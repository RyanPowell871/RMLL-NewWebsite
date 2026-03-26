/**
 * Hook for fetching and organizing Protected List data from SportzSoft.
 * 
 * Protected lists are a RUNNING DOCUMENT — not seasonal. Each team has one
 * protected list (max 45 players). We use the most recent season only to
 * identify which teams exist in the division, then fetch each team's
 * protected list via TeamFranchise/{franchiseId}?ChildCodes=P.
 * 
 * Flow: Team list → get TeamFranchiseId → TeamFranchise endpoint with ChildCodes=P
 * The data lives in the TeamFranchiseRole table with FranchiseRoleCd='PROT'.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchTeams, fetchFranchiseDetails } from '../services/sportzsoft/api';
import { DIVISION_GROUPS, SUB_DIVISION_IDS, PREFERRED_SUBDIVISION_ORDER } from '../services/sportzsoft/constants';
import { buildDivisionGroups } from '../services/sportzsoft/utils';
import { useSeasons } from './useSeasons';
import { useDivisionMapping } from './useDivisionMapping';

export interface ProtectedPlayer {
  playerName: string;
  playerId?: number;
  jerseyNumber?: string;
  position?: string;
  date: string;
  dateRaw: string;
  comment: string;
  id: string;
}

export interface TeamProtectedList {
  teamName: string;
  teamId: number;
  teamFranchiseId: number | null;
  teamLogoUrl: string | null;
  players: ProtectedPlayer[];
}

export interface UseProtectedListResult {
  teams: TeamProtectedList[];
  totalPlayers: number;
  loading: boolean;
  error: Error | null;
  selectedSubdivision: string;
  setSelectedSubdivision: (sub: string) => void;
  availableSubdivisions: string[];
  hasSubdivisions: boolean;
  refetch: () => void;
}

// Map division display names to the division IDs used by the API
// Tries dynamic season-based IDs first, then falls back to hardcoded constants
function getDivisionIdsForName(divisionName: string): number[] {
  const ids = DIVISION_GROUPS[divisionName];
  if (ids && ids.length > 0) return ids;
  
  for (const [key, value] of Object.entries(DIVISION_GROUPS)) {
    if (key.toLowerCase() === divisionName.toLowerCase() && value.length > 0) {
      return value;
    }
  }
  
  return [];
}

/**
 * Flexibly match a display division name (e.g., "Junior B Tier I") to a
 * dynamic group name from the API (e.g., "Jr Tier I").
 */
function findDynamicDivisionIds(
  divisionName: string, 
  dynamicGroups: Record<string, number[]>,
  subdivisionName?: string
): number[] {
  // Display name → API group name aliases
  const nameAliases: Record<string, string[]> = {
    'Junior B Tier I': ['Jr Tier I', 'Jr. Tier I', 'Jr B Tier I', 'Jr. B Tier I'],
    'Junior B Tier II': ['Jr Tier II', 'Jr. Tier II', 'Jr B Tier II', 'Jr. B Tier II'],
    'Junior B Tier III': ['Jr Tier III', 'Jr. Tier III', 'Jr B Tier III', 'Jr. B Tier III'],
    'Junior A': ['Jr A', 'Jr. A'],
    'Senior B': ['Sr B', 'Sr. B'],
    'Senior C': ['Sr C', 'Sr. C'],
    'Alberta Major Female': ['Alberta Major Female', 'Major Female'],
    'Alberta Major Senior Female': ['Alberta Major Senior Female', 'Major Senior Female'],
  };

  // Normalize for comparison
  const normalize = (s: string) => s.toLowerCase().replace(/[.\s]+/g, ' ').replace(/tier\s+/gi, 'tier ').trim();

  // Try exact match first
  let matchedGroupName: string | null = null;
  let matchedIds: number[] = [];

  if (dynamicGroups[divisionName]) {
    matchedGroupName = divisionName;
    matchedIds = dynamicGroups[divisionName];
  }

  // Try aliases
  if (matchedIds.length === 0) {
    const aliases = nameAliases[divisionName] || [];
    for (const alias of aliases) {
      if (dynamicGroups[alias]) {
        matchedGroupName = alias;
        matchedIds = dynamicGroups[alias];
        break;
      }
    }
  }

  // Try case-insensitive match
  if (matchedIds.length === 0) {
    for (const [key, ids] of Object.entries(dynamicGroups)) {
      if (key === 'All Divisions') continue;
      if (normalize(key) === normalize(divisionName)) {
        matchedGroupName = key;
        matchedIds = ids;
        break;
      }
    }
  }

  // Try partial match
  if (matchedIds.length === 0) {
    const normalizedName = normalize(divisionName);
    for (const [key, ids] of Object.entries(dynamicGroups)) {
      if (key === 'All Divisions') continue;
      const normalizedKey = normalize(key);
      if (normalizedName.includes(normalizedKey) || normalizedKey.includes(normalizedName)) {
        matchedGroupName = key;
        matchedIds = ids;
        break;
      }
    }
  }

  if (matchedIds.length > 0) {

  }

  return matchedIds;
}

// Universal field resolver
function resolveStr(obj: any, ...fieldNames: string[]): string {
  for (const name of fieldNames) {
    if (obj[name] !== undefined && obj[name] !== null && String(obj[name]).trim()) return String(obj[name]);
  }
  return '';
}

function resolveNum(obj: any, ...fieldNames: string[]): number {
  for (const name of fieldNames) {
    if (obj[name] !== undefined && obj[name] !== null) return Number(obj[name]) || 0;
  }
  return 0;
}

/**
 * Parse protected list players from the franchise/team API response.
 * 
 * Based on the actual database structure, the protected list entries are stored as
 * TeamFranchiseRoles with FranchiseRoleCd='PROT'. The API returns them under a key
 * like 'TeamFranchiseRoles' or 'Roles'. Each entry has:
 *   - TeamFranchiseRoleId (unique ID)
 *   - TeamFranchiseId (franchise ID)
 *   - PersonId (player ID)
 *   - FranchiseRoleCd ('PROT')
 *   - EffectiveDate
 *   - ExpiryDate (null for active)
 *   - IsActive (1 for active)
 *   - FullName (player name)
 */
function parseProtectedPlayers(response: any, teamName: string, teamId: number): ProtectedPlayer[] {
  const players: ProtectedPlayer[] = [];
  
  if (!response) {

    return players;
  }

  // Log all top-level keys for discovery
  const topKeys = Object.keys(response);


  // Keys to search for — prioritize TeamFranchiseRoles (known from DB structure)
  // NOTE: 'Roster' is intentionally EXCLUDED — ChildCodes=R on Team/TeamFranchise
  // returns the team Roster (player registrations), NOT the protected list.
  const possibleArrayKeys = [
    'TeamFranchiseRoles', 'Roles', 'FranchiseRoles',
    'ProtectedList', 'ProtectedPlayers', 'Protected',
    'FranchiseProtectedList', 'FranchiseProtected',
    'ProtectedRoster', 'ProtectedMembers',
    'Players', 'Members',
    'TeamProtectedList', 'TeamProtected',
  ];

  let protectedArray: any[] | null = null;
  let foundKey = '';

  // Helper to search an object for matching array keys
  function searchForArray(obj: any, prefix: string): boolean {
    if (!obj || typeof obj !== 'object') return false;
    for (const key of possibleArrayKeys) {
      if (Array.isArray(obj[key]) && obj[key].length > 0) {
        protectedArray = obj[key];
        foundKey = prefix ? `${prefix}.${key}` : key;
        return true;
      }
    }
    return false;
  }

  // 1. Check top-level
  searchForArray(response, '');

  // 2. Check nested Response
  if (!protectedArray && response.Response) {
    const resp = response.Response;

    
    searchForArray(resp, 'Response');

    // Check if Response itself is an array
    if (!protectedArray && Array.isArray(resp)) {
      protectedArray = resp;
      foundKey = 'Response (array)';
    }

    // Check common wrappers: Team, Franchise, TeamFranchise
    const wrappers = ['Team', 'Franchise', 'TeamFranchise'];
    for (const wrapper of wrappers) {
      if (!protectedArray && resp[wrapper]) {

        searchForArray(resp[wrapper], `Response.${wrapper}`);
      }
    }
  }

  // 3. Broad scan: look for any array with role/player-like items
  if (!protectedArray) {
    const scanTarget = response.Response || response;
    for (const key of Object.keys(scanTarget)) {
      const val = scanTarget[key];
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
        const item = val[0];
        
        // SKIP Roster arrays — they contain team roster entries, not protected list data.
        // Roster entries have fields like: ActiveTeamId, AffiliateFlag, PlayerRegNo, 
        // ShotOnHandLMR, SportPositionName, DateStarted, DateEnded, Player, TeamPlayerId
        const isRosterEntry = item.ActiveTeamId !== undefined || 
                              item.AffiliateFlag !== undefined ||
                              item.PlayerRegNo !== undefined ||
                              item.ShotOnHandLMR !== undefined ||
                              item.TeamPlayerId !== undefined ||
                              item.DateStarted !== undefined;
        if (isRosterEntry) {

          continue;
        }
        
        // Check for known fields from the TeamFranchiseRole table
        const isRoleArray = item.FranchiseRoleCd !== undefined || item.TeamFranchiseRoleId !== undefined;
        const hasNameField = item.FullName || item.PlayerName || item.FirstName || item.LastName || 
                            item.MemberName || item.PersonName || item.Name;
        if (isRoleArray || hasNameField) {

          protectedArray = val;
          foundKey = key;
          break;
        }
      }
    }
  }

  if (!protectedArray || protectedArray.length === 0) {

    return players;
  }


  
  // Log first item for field discovery
  if (protectedArray[0]) {

  }

  // Filter: If entries have FranchiseRoleCd, only keep 'PROT' entries that are active
  // NOTE: The ProtectedList array from ChildCodes=P often does NOT include an IsActive
  // field — entries present in the array are implicitly active. If IsActive is absent,
  // we treat the entry as active. We also treat ExpiryDate===null as active.
  const hasRoleCd = protectedArray[0]?.FranchiseRoleCd !== undefined;
  const filteredArray = hasRoleCd
    ? protectedArray.filter((entry: any) => {
        const roleCd = (entry.FranchiseRoleCd || '').toUpperCase();
        // If IsActive is not present at all, default to active (the API only returns active entries)
        const isActive = entry.IsActive === undefined || entry.IsActive === null ||
                         entry.IsActive === 1 || entry.IsActive === true || entry.IsActive === '1';
        // Also check ExpiryDate — null/absent means still active
        const notExpired = entry.ExpiryDate === undefined || entry.ExpiryDate === null;
        return roleCd === 'PROT' && (isActive || notExpired);
      })
    : protectedArray;

  if (hasRoleCd) {

    if (filteredArray.length === 0 && protectedArray.length > 0) {

    }
  }

  // Parse each entry
  filteredArray.forEach((entry: any, idx: number) => {
    const playerName = resolveStr(entry, 
      'FullName', 'PlayerName', 'Name', 'MemberName', 'PersonName', 'DisplayName'
    ) || (
      (resolveStr(entry, 'FirstName') && resolveStr(entry, 'LastName'))
        ? `${resolveStr(entry, 'FirstName')} ${resolveStr(entry, 'LastName')}`
        : ''
    );

    if (!playerName) return;

    const playerId = resolveNum(entry, 'PersonId', 'PlayerId', 'MemberId', 'Id');
    const jerseyNumber = resolveStr(entry, 'PlayerNo', 'JerseyNumber', 'No', 'Jersey', 'Number');
    const position = resolveStr(entry, 'Position', 'SportPositionName', 'Pos');
    const date = resolveStr(entry, 'EffectiveDate', 'ProtectedDate', 'TransactionDate', 'DateAdded', 'Date', 'CreatedDate');
    const comment = resolveStr(entry, 'Comment', 'TransactionComment', 'Notes', 'Description');

    let formattedDate = '';
    if (date) {
      try {
        const parsedDate = new Date(date);
        formattedDate = parsedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      } catch { 
        formattedDate = date;
      }
    }

    players.push({
      playerName,
      playerId: playerId || undefined,
      jerseyNumber: jerseyNumber || undefined,
      position: position || undefined,
      date: formattedDate,
      dateRaw: date,
      comment,
      id: `protected-${teamId}-${playerId || idx}-${idx}`,
    });
  });


  return players;
}

export function useProtectedList(divisionName: string): UseProtectedListResult {
  const [teams, setTeams] = useState<TeamProtectedList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedSubdivision, setSelectedSubdivision] = useState<string>('All');

  // We need season data first to build dynamic subdivision info
  const { seasons, loading: seasonsLoading } = useSeasons();

  const currentSeasonId = useMemo(() => {
    if (!seasons || seasons.length === 0) return null;
    // First season is the most recent
    return seasons[0].SeasonId;
  }, [seasons]);

  // Build dynamic division groups from the current season
  const dynamicDivisionGroups = useMemo(() => {
    if (!seasons || seasons.length === 0) return null;
    const currentSeason = seasons[0];
    if (!currentSeason.Groups || currentSeason.Groups.length === 0) return null;
    const groups = buildDivisionGroups(currentSeason);

    return groups;
  }, [seasons]);

  // Build dynamic subdivision mapping from the current season
  const dynamicSubdivisions = useMemo(() => {
    if (!seasons || seasons.length === 0) return null;
    const currentSeason = seasons[0];
    if (!currentSeason.Groups) return null;

    // For each group, extract subdivision names from division names
    const subMap: Record<string, Record<string, number[]>> = {};
    currentSeason.Groups.forEach(group => {
      const groupName = group.DivGroupName || group.DisplayString;
      const divisions = group.Divisions?.filter(d => d.IsActive) || [];
      if (divisions.length <= 1) return; // No subdivisions if only 1 division

      const subs: Record<string, number[]> = { 'All': divisions.map(d => d.DivisionId) };
      divisions.forEach(div => {
        // Extract subdivision suffix: e.g., "Jr. B Tier I South" → "South"
        const parts = div.DivisionName.split(/\s+/);
        const lastPart = parts[parts.length - 1];
        // Common subdivision suffixes
        if (['North', 'South', 'Central', 'East', 'West', 'Provincials'].includes(lastPart)) {
          if (!subs[lastPart]) subs[lastPart] = [];
          subs[lastPart].push(div.DivisionId);
        }
        // Handle compound names like "North Central", "North East", "South West", "South Central"
        if (parts.length >= 2) {
          const lastTwo = parts.slice(-2).join(' ');
          if (['North Central', 'North East', 'South West', 'South Central'].includes(lastTwo)) {
            // Add to the broader region too (e.g., "North Central" → "North")
            const region = parts[parts.length - 2];
            if (!subs[region]) subs[region] = [];
            if (!subs[region].includes(div.DivisionId)) {
              subs[region].push(div.DivisionId);
            }
          }
        }
      });
      
      if (Object.keys(subs).length > 1) { // Has more than just 'All'
        subMap[groupName] = subs;
      }
    });


    return subMap;
  }, [seasons]);

  // Compute available subdivisions for this division — prefer dynamic season data
  // over hardcoded SUB_DIVISION_IDS (which may contain stale divisions like "Central"
  // that no longer exist in the current season).
  const availableSubdivisions = useMemo(() => {
    // First try dynamic subdivisions from the current season
    if (dynamicSubdivisions) {
      // Use the same alias-based matching that findDynamicDivisionIds uses,
      // since dynamicSubdivisions keys are API group names (e.g., "Jr Tier I")
      // while divisionName is the display name (e.g., "Junior B Tier I").
      const nameAliases: Record<string, string[]> = {
        'Junior B Tier I': ['Jr Tier I', 'Jr. Tier I', 'Jr B Tier I', 'Jr. B Tier I', 'Junior B Tier I'],
        'Junior B Tier II': ['Jr Tier II', 'Jr. Tier II', 'Jr B Tier II', 'Jr. B Tier II', 'Junior B Tier II'],
        'Junior B Tier III': ['Jr Tier III', 'Jr. Tier III', 'Jr B Tier III', 'Jr. B Tier III', 'Junior B Tier III'],
        'Junior A': ['Jr A', 'Jr. A', 'Junior A'],
        'Senior B': ['Sr B', 'Sr. B', 'Senior B'],
        'Senior C': ['Sr C', 'Sr. C', 'Senior C'],
        'Alberta Major Female': ['Alberta Major Female', 'Major Female'],
        'Alberta Major Senior Female': ['Alberta Major Senior Female', 'Major Senior Female'],
      };
      const normalize = (s: string) => s.toLowerCase().replace(/[.\s]+/g, ' ').replace(/tier\s+/gi, 'tier ').trim();

      let matchedSubs: Record<string, number[]> | null = null;
      
      // 1. Exact match
      if (dynamicSubdivisions[divisionName]) {
        matchedSubs = dynamicSubdivisions[divisionName];
      }

      // 2. Try aliases (handles "Junior B Tier I" → "Jr Tier I" etc.)
      if (!matchedSubs) {
        const aliases = nameAliases[divisionName] || [];
        for (const alias of aliases) {
          if (dynamicSubdivisions[alias]) {
            matchedSubs = dynamicSubdivisions[alias];

            break;
          }
        }
      }

      // 3. Normalized comparison
      if (!matchedSubs) {
        const normalizedDivisionName = normalize(divisionName);
        for (const [groupName, subs] of Object.entries(dynamicSubdivisions)) {
          const normalizedGroupName = normalize(groupName);
          if (normalizedGroupName === normalizedDivisionName) {
            matchedSubs = subs;
            break;
          }
        }
      }

      // 4. Partial/contains match (last resort)
      if (!matchedSubs) {
        const normalizedDivisionName = normalize(divisionName);
        for (const [groupName, subs] of Object.entries(dynamicSubdivisions)) {
          const normalizedGroupName = normalize(groupName);
          if (normalizedDivisionName.includes(normalizedGroupName) ||
              normalizedGroupName.includes(normalizedDivisionName)) {
            matchedSubs = subs;
            break;
          }
        }
      }
      
      if (matchedSubs) {
        const subNames = Object.keys(matchedSubs);
        // Apply preferred ordering if available
        const preferredOrder = PREFERRED_SUBDIVISION_ORDER[divisionName];
        if (preferredOrder) {
          // Only include preferred entries that actually exist in dynamic data
          const ordered = preferredOrder.filter(s => subNames.includes(s));
          // Append any dynamic entries not in preferred order
          const remaining = subNames.filter(s => !ordered.includes(s));
          const result = [...ordered, ...remaining];

          return result;
        }

        return subNames;
      }

      // Dynamic data is loaded but no match found — this division has no subdivisions

      return [];
    }
    
    // Dynamic data not yet loaded — return empty to avoid showing stale hardcoded filters
    // (the UI will re-render once dynamic data arrives)
    return [];
  }, [divisionName, dynamicSubdivisions]);

  const hasSubdivisions = availableSubdivisions.length > 0;

  // Reset subdivision when division changes
  useEffect(() => {
    setSelectedSubdivision('All');
  }, [divisionName]);

  // Also reset subdivision if the selected one no longer exists in the available list
  // (e.g., user was on "Central" but dynamic data loaded and Central doesn't exist)
  useEffect(() => {
    if (selectedSubdivision !== 'All' && availableSubdivisions.length > 0 && !availableSubdivisions.includes(selectedSubdivision)) {

      setSelectedSubdivision('All');
    }
  }, [selectedSubdivision, availableSubdivisions]);

  const fetchData = useCallback(async () => {
    if (!currentSeasonId) {

      return;
    }

    // Get division IDs for filtering — try DYNAMIC groups first (current season),
    // then fall back to hardcoded constants (which may have stale IDs)
    let divisionIds: number[] = [];

    // Step 1: Try dynamic resolution from current season data
    if (dynamicDivisionGroups) {
      // Handle subdivision selection
      if (selectedSubdivision !== 'All' && dynamicSubdivisions) {
        // Find the matching group name in dynamicSubdivisions using the same
        // flexible name matching logic as findDynamicDivisionIds
        const allGroupNames = Object.keys(dynamicSubdivisions);
        let matchingGroupName: string | undefined;
        
        // Try each group name to see if it matches our divisionName
        for (const gn of allGroupNames) {
          // Build a temporary groups object to test the match
          if (findDynamicDivisionIds(divisionName, { [gn]: [0] }).length > 0) {
            matchingGroupName = gn;
            break;
          }
        }

        if (matchingGroupName && dynamicSubdivisions[matchingGroupName]?.[selectedSubdivision]) {
          divisionIds = dynamicSubdivisions[matchingGroupName][selectedSubdivision];

        }
      }
      
      // If no subdivision match, try full group match
      if (divisionIds.length === 0) {
        divisionIds = findDynamicDivisionIds(divisionName, dynamicDivisionGroups, selectedSubdivision);
      }
    }

    // Step 2: Fallback to hardcoded constants
    if (divisionIds.length === 0) {

      if (selectedSubdivision !== 'All' && SUB_DIVISION_IDS[divisionName]?.[selectedSubdivision]) {
        divisionIds = SUB_DIVISION_IDS[divisionName][selectedSubdivision];
      } else {
        divisionIds = getDivisionIdsForName(divisionName);
      }
    }

    if (divisionIds.length === 0) {
      console.warn(`[useProtectedList] No division IDs found for "${divisionName}" (sub: ${selectedSubdivision})`);
      setTeams([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {


      // Step 1: Fetch all teams for the current season to get TeamFranchiseId
      const teamsResponse = await fetchTeams(currentSeasonId, 'BI');
      
      if (!teamsResponse.Success || !teamsResponse.Response?.Teams) {
        throw new Error('Failed to fetch teams');
      }

      const allTeams = teamsResponse.Response.Teams;
      
      // Log team structure for discovery (first team)
      if (allTeams.length > 0) {
        const sampleTeam = allTeams[0] as any;

        
        const franchiseFields = Object.keys(sampleTeam).filter(k => 
          /franchise|fran/i.test(k)
        );

        if (franchiseFields.length > 0) {
          franchiseFields.forEach(f => {

          });
        }
      }

      // Filter teams by division IDs
      const divisionIdSet = new Set(divisionIds);
      const relevantTeams = allTeams.filter((t: any) => divisionIdSet.has(t.DivisionId));
      


      if (relevantTeams.length === 0) {
        setTeams([]);
        return;
      }

      // Step 2: For each team, fetch their protected list
      const fetchPromises = relevantTeams.map(async (team: any) => {
        const teamId = team.TeamId;
        const teamName = team.TeamName || `Team ${teamId}`;
        const franchiseId = team.TeamFranchiseId || team.FranchiseId || team.TeamFranchise?.TeamFranchiseId;



        let protectedPlayers: ProtectedPlayer[] = [];

        // Approach A (preferred): TeamFranchise/{franchiseId}?ChildCodes=P
        // The protected list is stored in TeamFranchiseRoles (FranchiseRoleCd='PROT')
        if (franchiseId) {
          try {

            const franchiseResponse = await fetchFranchiseDetails(franchiseId, 'C', 'P');
            if (franchiseResponse.Success && franchiseResponse.Response) {
              protectedPlayers = parseProtectedPlayers(franchiseResponse, teamName, teamId);
            }
          } catch (err) {
            console.warn(`[useProtectedList] Franchise endpoint failed for ${teamName}:`, err);
          }
        }

        return {
          teamName,
          teamId,
          teamFranchiseId: franchiseId || null,
          teamLogoUrl: resolveStr(team, 'PrimaryTeamLogoURL', 'TeamLogoUrl', 'TeamLogoFilename', 'LogoUrl') || null,
          players: protectedPlayers.sort((a, b) => a.playerName.localeCompare(b.playerName)),
        };
      });

      const results = await Promise.all(fetchPromises);

      // Sort teams alphabetically
      results.sort((a, b) => a.teamName.localeCompare(b.teamName));


      results.forEach(t => {

      });
      const total = results.reduce((sum, t) => sum + t.players.length, 0);


      setTeams(results);
      setError(null);
    } catch (err) {
      console.error('[useProtectedList] Fatal error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch protected lists'));
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [divisionName, selectedSubdivision, currentSeasonId, dynamicDivisionGroups, dynamicSubdivisions]);

  useEffect(() => {
    if (currentSeasonId) {
      fetchData();
    }
  }, [fetchData, currentSeasonId]);

  const totalPlayers = useMemo(() =>
    teams.reduce((sum, t) => sum + t.players.length, 0),
    [teams]
  );

  return {
    teams,
    totalPlayers,
    loading: loading || seasonsLoading,
    error,
    selectedSubdivision,
    setSelectedSubdivision,
    availableSubdivisions,
    hasSubdivisions,
    refetch: fetchData,
  };
}