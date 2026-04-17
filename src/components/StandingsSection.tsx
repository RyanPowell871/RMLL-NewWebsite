import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useState, useEffect, useRef } from 'react';
import { useSeasons } from '../hooks/useSeasons';
import { useDivision } from '../contexts/DivisionContext';
import { 
  fetchTeams,
  fetchStandings,
  isApiKeyReady,
  DIVISION_NAMES,
  DIVISION_GROUPS,
  type Team,
  type Season
} from '../services/sportzsoft';
// getTeamLogo import removed - using dynamic logos from API

interface TeamStanding {
  rank: number;
  teamId: number;
  teamName: string;
  teamLogoUrl?: string;
  divisionId: number;
  divisionName: string;
  gp: number;
  w: number;
  l: number;
  t: number;
  def: number;
  otl: number;
  pts: number;
  gf: number;
  ga: number;
  diff: number;
  pim: number;
  gAvg: number;
  streak: string;
}

const gameTypes = [
  'Regular Season',
  'Playoffs',
  'Provincials'
];

// Playoff spots per division group (how many teams advance per sub-division)
// Senior Female has no playoffs. Junior B Tier II advances 6 per division. Senior C advances 2. Others default to 4.
function getPlayoffSpots(divisionGroup: string): number {
  const lower = divisionGroup.toLowerCase();
  if (lower.includes('female') || lower.includes('women')) return 0; // No playoffs
  if (lower.includes('tier ii') || lower.includes('tier 2')) return 6;
  if (lower.includes('senior c') || lower.includes('sr. c') || lower.includes('sr c')) return 2;
  return 4; // Default for Senior B, Junior A, Junior B Tier I, Junior B Tier III, etc.
}

export function StandingsSection() {
  const { seasons, seasonYears, seasonIdsByYear, getCurrentSeasonYear, loading: seasonsLoading } = useSeasons();
  const { selectedDivision: favoriteDivision, selectedSubDivision: favoriteSubDivision } = useDivision();
  


  const [selectedSeasonYear, setSelectedSeasonYear] = useState('');
  const [selectedGameType, setSelectedGameType] = useState('Regular Season');
  const [selectedDivisionGroup, setSelectedDivisionGroup] = useState('');
  const [selectedSubDivision, setSelectedSubDivision] = useState<number | null>(null);
  
  const [allStandings, setAllStandings] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchingRef = useRef(false);
  const lastFetchRef = useRef('');
  // Track whether division has been initialized (to avoid resetting on game type change)
  const divisionInitializedRef = useRef(false);

  // Dynamic division data built from actual API responses (works for all seasons)
  const [dynamicDivisionGroups, setDynamicDivisionGroups] = useState<Record<string, number[]>>({});
  const [dynamicDivisionNames, setDynamicDivisionNames] = useState<Record<number, string>>({});
  const [activeDivisionGroups, setActiveDivisionGroups] = useState<string[]>([]);
  const [activeDivisionIds, setActiveDivisionIds] = useState<Set<number>>(new Set());

  // Set initial season to the latest one with data
  useEffect(() => {
    if (!selectedSeasonYear && seasonYears.length > 0) {
      const mostRecentSeason = seasonYears[0];
      setSelectedSeasonYear(mostRecentSeason);
    }
  }, [seasonYears.length]);

  // Reset division initialization when season changes (so favorites re-apply)
  const prevSeasonRef = useRef(selectedSeasonYear);
  // No longer resetting divisionInitializedRef on season change — preserve user's division selection

  // When division group changes (user clicks a tab), set first sub-division from dynamic groups
  // Only react to actual GROUP changes, not dynamicDivisionGroups/activeDivisionIds object updates
  const userChangedGroupRef = useRef(false);
  const prevGroupRef = useRef(selectedDivisionGroup);
  useEffect(() => {
    if (userChangedGroupRef.current) {
      userChangedGroupRef.current = false;
      prevGroupRef.current = selectedDivisionGroup;
      return; // Skip — the favorite logic already set the sub-division
    }
    // Only reset sub-division if the group actually changed (not just data refreshed)
    if (selectedDivisionGroup !== prevGroupRef.current) {
      prevGroupRef.current = selectedDivisionGroup;
      if (selectedDivisionGroup && dynamicDivisionGroups[selectedDivisionGroup]) {
        const divisions = dynamicDivisionGroups[selectedDivisionGroup].filter(id => activeDivisionIds.has(id));
        if (divisions.length > 0) {
          setSelectedSubDivision(divisions[0]);
        }
      }
    }
  }, [selectedDivisionGroup, dynamicDivisionGroups, activeDivisionIds]);

  // Helper: match a favorite division name to an active dynamic group
  const matchFavoriteToGroup = (
    fav: string,
    groups: Record<string, number[]>,
    activeGroups: string[]
  ): string | null => {
    if (!fav || fav === 'All Divisions') return null;
    // Exact match first
    if (activeGroups.includes(fav)) return fav;
    // Fuzzy match (e.g. "Junior B Tier I" ↔ "Junior B Tier I")
    return activeGroups.find(g => g.includes(fav) || fav.includes(g)) || null;
  };

  // Helper: match a favorite sub-division name to a division ID within a group
  const matchFavoriteSubDivision = (
    favSub: string,
    groupDivIds: number[],
    names: Record<number, string>,
    activeIds: Set<number>
  ): number | null => {
    if (!favSub || favSub === 'All') return null;
    const activeDivs = groupDivIds.filter(id => activeIds.has(id));
    return activeDivs.find(id => {
      const name = names[id] || '';
      return name.includes(favSub);
    }) || null;
  };

  // React to favorite division changes AFTER dynamic groups are loaded
  useEffect(() => {
    if (Object.keys(dynamicDivisionGroups).length === 0) return; // Groups not loaded yet
    if (!favoriteDivision || favoriteDivision === 'All Divisions') return;

    const matched = matchFavoriteToGroup(favoriteDivision, dynamicDivisionGroups, activeDivisionGroups);
    if (matched) {
      // Update group if it changed
      if (matched !== selectedDivisionGroup) {
        userChangedGroupRef.current = true; // Prevent the group-change effect from overriding
        setSelectedDivisionGroup(matched);
      }

      // Always update sub-division when favorite changes (even if group didn't change)
      const groupDivIds = dynamicDivisionGroups[matched] || [];
      const subMatch = matchFavoriteSubDivision(favoriteSubDivision, groupDivIds, dynamicDivisionNames, activeDivisionIds);
      if (subMatch) {
        setSelectedSubDivision(subMatch);
      } else if (matched !== selectedDivisionGroup) {
        // Only default to first if the group actually changed
        const activeDivs = groupDivIds.filter(id => activeDivisionIds.has(id));
        if (activeDivs.length > 0) setSelectedSubDivision(activeDivs[0]);
      }
    }
  }, [favoriteDivision, favoriteSubDivision, dynamicDivisionGroups, dynamicDivisionNames, activeDivisionGroups, activeDivisionIds]);

  // Helper: normalize API division group names to friendly display names
  const normalizeDivisionGroupName = (apiName: string): string => {
    // Strip leading/trailing year numbers (e.g. "2025 Sr. B" → "Sr. B", "Sr. B 2025" → "Sr. B")
    let cleaned = apiName.replace(/^\d{4}\s+/, '').replace(/\s+\d{4}$/, '').trim();
    
    // Map common API abbreviations to full display names
    const nameMap: Record<string, string> = {
      'Sr. B': 'Senior B',
      'Sr B': 'Senior B',
      'Sr. C': 'Senior C',
      'Sr C': 'Senior C',
      'Jr. A': 'Junior A',
      'Jr A': 'Junior A',
      'Jr. B Tier I': 'Junior B Tier I',
      'Jr Tier I': 'Junior B Tier I',
      'Jr. B Tier II': 'Junior B Tier II',
      'Jr Tier II': 'Junior B Tier II',
      'Jr. Tier III': 'Junior B Tier III',
      'Jr Tier III': 'Junior B Tier III',
      'Jr. B Tier III': 'Junior B Tier III',
    };
    return nameMap[cleaned] || cleaned;
  };

  // Helper: build division groups from season Groups data
  const buildDivisionGroupsFromSeason = (season: Season, teams: Team[]): {
    groups: Record<string, number[]>;
    names: Record<number, string>;
  } => {
    const groups: Record<string, number[]> = {};
    const names: Record<number, string> = {};
    
    // First, try to build from season's Groups/Divisions structure
    if (season?.Groups && season.Groups.length > 0) {
      season.Groups.forEach(group => {
        // Prefer DivGroupName (clean) over SeasonGroupName (may include season year)
        const groupName = normalizeDivisionGroupName(group.DivGroupName || group.SeasonGroupName || 'Unknown');
        if (!groups[groupName]) {
          groups[groupName] = [];
        }
        if (group.Divisions && group.Divisions.length > 0) {
          group.Divisions.forEach(div => {
            groups[groupName].push(div.DivisionId);
            names[div.DivisionId] = div.DivisionName || div.DisplayString || `Division ${div.DivisionId}`;
          });
        }
      });
    }
    
    // If we got groups from the season, use them
    if (Object.keys(groups).length > 0) {

      return { groups, names };
    }
    
    // Fallback: build groups from team data by grouping divisions
    const divisionMap = new Map<number, string>();
    teams.forEach(team => {
      if (!divisionMap.has(team.DivisionId)) {
        // Use API-provided DivisionName, then hardcoded fallback
        divisionMap.set(team.DivisionId, team.DivisionName || DIVISION_NAMES[team.DivisionId] || `Division ${team.DivisionId}`);
      }
    });
    
    // Group divisions by their base name (e.g., "Jr. B Tier I - North" → "Junior B Tier I")
    divisionMap.forEach((divName, divId) => {
      names[divId] = divName;
      
      // Extract group name by stripping sub-division suffix
      let groupName = divName;
      if (divName.includes(' - ')) {
        groupName = divName.split(' - ')[0].trim();
      }
      groupName = normalizeDivisionGroupName(groupName);
      
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(divId);
    });
    

    return { groups, names };
  };

  // Helper: sort division groups in preferred display order
  const sortDivisionGroups = (groupNames: string[]): string[] => {
    const preferredOrder = [
      'Senior B', 'Senior C', 'Junior A', 'Junior B Tier I',
      'Junior B Tier II', 'Junior B Tier III',
      'Alberta Major Senior Female', 'Alberta Major Female'
    ];
    return groupNames.sort((a, b) => {
      const aIdx = preferredOrder.findIndex(p => a.includes(p) || p.includes(a));
      const bIdx = preferredOrder.findIndex(p => b.includes(p) || p.includes(b));
      if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });
  };

  // Fetch standings data
  useEffect(() => {
    const fetchKey = `${selectedSeasonYear}-${selectedGameType}`;
    
    if (lastFetchRef.current && !lastFetchRef.current.startsWith(fetchKey)) {
      lastFetchRef.current = '';
    }
    
    if (fetchingRef.current || lastFetchRef.current === fetchKey) return;

    const seasonId = seasonIdsByYear[selectedSeasonYear];
    if (!seasonId) return;

    const fetchData = async () => {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        let attempts = 0;
        while (!isApiKeyReady() && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (!isApiKeyReady()) throw new Error('API key not initialized');


        
        const teamsResponse = await fetchTeams(seasonId, 'BI');
        if (!teamsResponse.Success || !teamsResponse.Response?.Teams) {
          console.error('[Standings] Teams fetch failed for seasonId:', seasonId, teamsResponse);
          throw new Error(`Failed to fetch teams for season ${selectedSeasonYear}`);
        }

        const allTeams: Team[] = teamsResponse.Response.Teams;

        // Determine which standing code to use based on game type
        let standingCode = 'regu';
        if (selectedGameType === 'Playoffs') standingCode = 'plyo';
        else if (selectedGameType === 'Provincials') standingCode = 'prov';

        // Build a team info map from the teams fetch (for logos)
        const teamInfoMap = new Map<number, { name: string; logoUrl?: string; divisionId: number }>();
        allTeams.forEach(team => {
          teamInfoMap.set(team.TeamId, {
            name: team.TeamName,
            logoUrl: team.PrimaryTeamLogoURL,
            divisionId: team.DivisionId
          });
        });

        // Build dynamic division groups from season's actual data
        const currentSeason = seasons.find(s => s.StartYear.toString() === selectedSeasonYear);
        const { groups: dynGroups, names: dynNames } = buildDivisionGroupsFromSeason(currentSeason!, allTeams);

        // Collect all unique division IDs from teams AND dynamic groups
        const allDivisionIds = new Set<number>();
        allTeams.forEach(t => allDivisionIds.add(t.DivisionId));
        Object.values(dynGroups).forEach(ids => ids.forEach(id => allDivisionIds.add(id)));

        console.log(`[Standings] Fetching standings per-division (${allDivisionIds.size} divs), seasonId=${seasonId}, standingCode="${standingCode}"...`);

        // Helper: extract standings directly from SportsDivision response
        // Instead of generic recursion, handle the known API shape directly
        const extractedStandings: TeamStanding[] = [];
        const extractedTeamDivKeys = new Set<string>();

        const extractFromDivisionResponse = (rawDiv: any, divId: number) => {
          // The response is { SportsDivision: { ..., Standings: [...] } }
          const sd = rawDiv?.SportsDivision || rawDiv;
          if (!sd) return;

          const standingsArr = sd.Standings || sd.Standing;
          if (!Array.isArray(standingsArr) || standingsArr.length === 0) {
            console.log(`[Standings] Div ${divId}: No Standings array found on SportsDivision object`);
            return;
          }

          for (const item of standingsArr) {
            if (!item || typeof item !== 'object') continue;

            // Filter by standing category code
            const code = (item.StandingCategoryCode || item.StandingCode || '').toLowerCase();
            if (code && code !== standingCode) continue;

            // Get TeamId — either nested in Team object or directly on item
            const team = item.Team;
            const teamId = (team && typeof team === 'object' && team.TeamId)
              ? Number(team.TeamId)
              : (item.TeamId ? Number(item.TeamId) : null);
            
            if (!teamId) continue;

            const divisionId = divId || (sd.DivisionId ? Number(sd.DivisionId) : 0) || teamInfoMap.get(teamId)?.divisionId || 0;
            const dedupKey = `${teamId}-${divisionId}`;
            if (extractedTeamDivKeys.has(dedupKey)) continue;
            extractedTeamDivKeys.add(dedupKey);

            const teamInfo = teamInfoMap.get(teamId);
            const teamName = (team?.TeamName) || item.TeamName || teamInfo?.name || `Team ${teamId}`;
            const teamLogoUrl = team?.PrimaryTeamLogoURL || team?.TeamLogoURL || item.PrimaryTeamLogoURL || teamInfo?.logoUrl;
            const divisionName = dynNames[divisionId] || DIVISION_NAMES[divisionId] || sd.DivisionName || 'Unknown';

            // Extract stats — handle both field naming conventions
            const gp = item.GamesPlayed ?? item.GP ?? 0;
            const l = item.GamesLost ?? item.Losses ?? item.L ?? 0;
            const t = item.GamesTied ?? item.Ties ?? item.T ?? 0;
            const def = item.GamesDefaulted ?? item.Defaults ?? item.Def ?? 0;
            const w = item.GamesWon ?? item.Wins ?? item.W ??
                      (gp > 0 ? (gp - l - t - def) : 0);
            const otl = item.OvertimeLosses ?? item.OTL ?? 0;
            const pts = item.Points ?? item.Pts ?? ((w * 2) + t + otl);
            const gf = item.GoalsFor ?? item.GF ?? 0;
            const ga = item.GoalsAgainst ?? item.GA ?? 0;
            const diff = gf - ga;
            const pim = item.PenaltyMins ?? item.PIM ?? 0;
            const pct = item.PointsPercentage ?? null;
            const gAvg = pct !== null ? (typeof pct === 'number' ? pct : parseFloat(pct) || 0) :
              ((gf + ga) > 0 ? parseFloat((gf / (gf + ga)).toFixed(3)) : 0);
            const streak = item.StreakInfo ?? item.Streak ?? '-';

            if (extractedStandings.length === 0) {
              console.log('%c[Standings] First extraction! TeamId:', 'color: magenta; font-weight: bold', 
                teamId, teamName, 'GP:', gp, 'W:', w, 'L:', l, 'T:', t, 'PTS:', pts, 'GF:', gf, 'GA:', ga, 'PIM:', pim);
              console.log('%c[Standings] Item keys:', 'color: magenta; font-weight: bold', Object.keys(item));
              // Log ALL fields that contain "pen" or "min" or "pim" (case-insensitive) to find PIM field
              const pimCandidates: Record<string, any> = {};
              Object.keys(item).forEach(k => {
                const kl = k.toLowerCase();
                if (kl.includes('pen') || kl.includes('pim') || kl.includes('min') || kl.includes('infrac') || kl.includes('foul')) {
                  pimCandidates[k] = item[k];
                }
              });
              console.log('%c[Standings] PIM candidates:', 'color: red; font-weight: bold', JSON.stringify(pimCandidates));
            }

            extractedStandings.push({
              rank: 0, teamId, teamName, teamLogoUrl, divisionId, divisionName,
              gp, w, l, t, def, otl, pts, gf, ga, diff, pim,
              gAvg: typeof gAvg === 'number' ? gAvg : parseFloat(gAvg) || 0,
              streak: typeof streak === 'string' ? streak : (streak || '-')
            });
          }
        };

        // ── Strategy: Per-division parallel fetch via SportsDivision endpoint ──
        // URL pattern: SportsDivision/{divId}?LimiterCode=BS&ChildCodes=S
        const divisionIds = Array.from(allDivisionIds);
        const divStandingsPromises = divisionIds.map(divId =>
          fetchStandings(seasonId, divId, 'BS', 'S', standingCode)
            .then(resp => ({ divId, resp, error: null as string | null }))
            .catch(err => ({ divId, resp: null as any, error: String(err) }))
        );

        const divResults = await Promise.all(divStandingsPromises);
        let successCount = 0;
        let failCount = 0;

        for (const { divId, resp, error: fetchErr } of divResults) {
          if (fetchErr || !resp) {
            failCount++;
            if (fetchErr) console.warn(`[Standings] Division ${divId} fetch error:`, fetchErr);
            else console.warn(`[Standings] Division ${divId} null response`);
            continue;
          }
          
          // Handle both wrapped {Success, Response} and raw response shapes
          const isWrapped = resp.Success !== undefined;
          if (isWrapped && !resp.Success) {
            failCount++;
            console.warn(`[Standings] Division ${divId} Success=false:`, JSON.stringify(resp).substring(0, 500));
            continue;
          }
          
          successCount++;
          const rawDiv = isWrapped ? resp.Response : resp;
          
          if (!rawDiv) {
            console.warn(`[Standings] Division ${divId} has no data (Response is null/undefined)`);
            continue;
          }

          // Log the first successful division response structure in detail
          if (successCount <= 2) {
            const respStr = JSON.stringify(rawDiv);
            console.log(`%c[Standings] Div ${divId} response size: ${respStr.length} chars`, 'color: blue; font-weight: bold');
            console.log(`%c[Standings] Div ${divId} top-level keys: ${JSON.stringify(Object.keys(rawDiv))}`, 'color: blue; font-weight: bold');
            
            // Deep-dive: log the SportsDivision structure and Standings items
            const sd = rawDiv.SportsDivision || rawDiv;
            if (sd) {
              console.log(`%c[Standings] Div ${divId} SportsDivision keys: ${JSON.stringify(Object.keys(sd))}`, 'color: blue; font-weight: bold');
              const standingsArr = sd.Standings || sd.Standing;
              if (Array.isArray(standingsArr) && standingsArr.length > 0) {
                console.log(`%c[Standings] Div ${divId} Standings[0] keys: ${JSON.stringify(Object.keys(standingsArr[0]))}`, 'color: green; font-weight: bold');
                console.log(`%c[Standings] Div ${divId} Standings[0] sample: ${JSON.stringify(standingsArr[0]).substring(0, 2000)}`, 'color: green; font-weight: bold');
                // If first item has nested arrays, log those too
                Object.keys(standingsArr[0]).forEach(sk => {
                  const v = standingsArr[0][sk];
                  if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object') {
                    console.log(`%c[Standings] Div ${divId} Standings[0].${sk}[0] keys: ${JSON.stringify(Object.keys(v[0]))}`, 'color: orange; font-weight: bold');
                    console.log(`%c[Standings] Div ${divId} Standings[0].${sk}[0] sample: ${JSON.stringify(v[0]).substring(0, 1000)}`, 'color: orange; font-weight: bold');
                  }
                });
              } else {
                console.log(`%c[Standings] Div ${divId} NO Standings array found. Checked: Standings=${!!sd.Standings}, Standing=${!!sd.Standing}, Teams=${!!sd.Teams}`, 'color: red; font-weight: bold');
              }
            }
          }

          extractFromDivisionResponse(rawDiv, divId);
        }

        console.log(`[Standings] Per-division: ${successCount} ok, ${failCount} failed, ${extractedStandings.length} standings for "${standingCode}"`);

        // ── Fallback: If per-division yielded nothing, try season-level with GDTS ──
        if (extractedStandings.length === 0) {
          console.log('[Standings] Per-division returned 0. Trying season-level GDTS fallback...');
          try {
            const seasonResp = await fetchStandings(seasonId, undefined, 'B', 'GDTS', standingCode);
            if (seasonResp.Success && seasonResp.Response) {
              const respStr = JSON.stringify(seasonResp.Response);
              console.log('[Standings] Season response (first 3000 chars):', respStr.substring(0, 3000));
              extractFromDivisionResponse(seasonResp.Response, 0);
              console.log(`[Standings] Season-level extracted ${extractedStandings.length} for "${standingCode}"`);
            }
          } catch (err) {
            console.warn('[Standings] Season-level fallback also failed:', err);
          }
        }

        console.log(`[Standings] Final: ${extractedTeamDivKeys.size} unique team-div combos, ${extractedStandings.length} standings extracted`);

        // Use extracted standings or fall back to zero-stat team list
        let standings: TeamStanding[];
        if (extractedStandings.length > 0) {
          standings = extractedStandings.sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;
            if (b.diff !== a.diff) return b.diff - a.diff;
            return b.gf - a.gf;
          });
          console.log('[Standings] Using official standings from SportzSoft API');
        } else {
          console.warn('[Standings] No standings data available yet for "' + standingCode + '" — season may not have started. Showing teams with zero stats.');
          // Deduplicate teams by TeamId (same team can appear in multiple divisions)
          const seenTeamIds = new Set<number>();
          standings = allTeams.filter(team => {
            if (seenTeamIds.has(team.TeamId)) return false;
            seenTeamIds.add(team.TeamId);
            return true;
          }).map(team => {
            const divisionName = dynNames[team.DivisionId] || DIVISION_NAMES[team.DivisionId] || team.DivisionName || 'Unknown';
            return {
              rank: 0,
              teamId: team.TeamId,
              teamName: team.TeamName,
              teamLogoUrl: team.PrimaryTeamLogoURL,
              divisionId: team.DivisionId,
              divisionName,
              gp: 0, w: 0, l: 0, t: 0, def: 0, otl: 0, pts: 0, gf: 0, ga: 0, diff: 0, pim: 0, gAvg: 0, streak: '-'
            };
          });
        }

        setAllStandings(standings);
        lastFetchRef.current = fetchKey;

        // Store the dynamic groups/names for this season
        setDynamicDivisionGroups(dynGroups);
        setDynamicDivisionNames(dynNames);

        // Determine which dynamic division groups have active teams
        const activeDivIds = new Set(standings.map(t => t.divisionId));
        const activeGroups: string[] = [];
        
        // Use dynamic groups (built from API data) instead of hardcoded DIVISION_GROUPS
        Object.entries(dynGroups).forEach(([groupName, divIds]) => {
          if (groupName === 'All Divisions') return;
          if (divIds.some(id => activeDivIds.has(id))) {
            activeGroups.push(groupName);
          }
        });
        
        const sortedGroups = sortDivisionGroups(activeGroups);
        setActiveDivisionGroups(sortedGroups);
        setActiveDivisionIds(activeDivIds);

        // Only set division/subdivision on initial load or season change.
        // When just switching game type, preserve the user's current division selection.
        if (sortedGroups.length > 0) {
          const currentGroupStillValid = selectedDivisionGroup && sortedGroups.includes(selectedDivisionGroup);
          const currentSubDivStillValid = selectedSubDivision !== null && activeDivIds.has(selectedSubDivision);

          if (divisionInitializedRef.current && currentGroupStillValid) {
            // Division already set and still valid — preserve it (game type switch scenario)
            // Just validate the sub-division is still in the active set
            if (!currentSubDivStillValid) {
              const divisions = (dynGroups[selectedDivisionGroup] || []).filter(id => activeDivIds.has(id));
              if (divisions.length > 0) {
                userChangedGroupRef.current = true;
                setSelectedSubDivision(divisions[0]);
              }
            }
          } else {
            // First load or season change — apply favorite or default
            let targetGroup = sortedGroups[0]; // Default: first group
            let targetSubDiv: number | null = null;
            
            // Try to match the user's favorite division
            if (favoriteDivision && favoriteDivision !== 'All Divisions') {
              const favMatch = sortedGroups.find(g => 
                g === favoriteDivision || g.includes(favoriteDivision) || favoriteDivision.includes(g)
              );
              if (favMatch) {
                targetGroup = favMatch;
                // Try to match sub-division too
                if (favoriteSubDivision && favoriteSubDivision !== 'All') {
                  const groupDivIds = (dynGroups[targetGroup] || []).filter(id => activeDivIds.has(id));
                  const subMatch = groupDivIds.find(id => {
                    const name = dynNames[id] || '';
                    return name.includes(favoriteSubDivision);
                  });
                  if (subMatch) targetSubDiv = subMatch;
                }
              }
            }
            
            userChangedGroupRef.current = true; // Prevent group-change effect from overriding
            setSelectedDivisionGroup(targetGroup);
            
            if (targetSubDiv) {
              setSelectedSubDivision(targetSubDiv);
            } else {
              const divisions = (dynGroups[targetGroup] || []).filter(id => activeDivIds.has(id));
              if (divisions.length > 0) {
                setSelectedSubDivision(divisions[0]);
              }
            }
            divisionInitializedRef.current = true;
          }
        }
      } catch (err) {
        console.error('[StandingsSection] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load standings');
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchData();
  }, [selectedSeasonYear, selectedGameType, seasonIdsByYear, seasons]);

  // Filter standings by selected division group/sub-division (using dynamic groups)
  const currentDivisionIds = selectedDivisionGroup 
    ? (dynamicDivisionGroups[selectedDivisionGroup] || DIVISION_GROUPS[selectedDivisionGroup] || [])
    : [];
  const filteredStandings = (selectedSubDivision !== null
    ? allStandings.filter(team => team.divisionId === selectedSubDivision)
    : allStandings.filter(team => currentDivisionIds.includes(team.divisionId))
  ).filter(team => {
    // For Playoffs/Provincials, hide teams that haven't played any games
    if (selectedGameType !== 'Regular Season') {
      return team.gp > 0;
    }
    return true;
  });

  // Add ranks
  const rankedStandings = filteredStandings.map((team, index) => ({
    ...team,
    rank: index + 1
  }));

  const totalGamesPlayed = rankedStandings.reduce((sum, team) => sum + team.gp, 0);

  // Get sub-divisions for current group (using dynamic groups, only active ones)
  const subDivisions = selectedDivisionGroup 
    ? (dynamicDivisionGroups[selectedDivisionGroup] || DIVISION_GROUPS[selectedDivisionGroup] || []).filter(id => activeDivisionIds.has(id))
    : [];
  const hasSubDivisions = subDivisions.length > 1;

  // Compute playoff spots for the currently selected division group
  const playoffSpots = getPlayoffSpots(selectedDivisionGroup);

  // Helper to get short division name (strip group prefix) - uses dynamic names first
  const getShortDivisionName = (divId: number): string => {
    const fullName = dynamicDivisionNames[divId] || DIVISION_NAMES[divId] || '';
    // If it contains " - ", take the part after it
    if (fullName.includes(' - ')) {
      return fullName.split(' - ')[1];
    }
    return fullName;
  };

  return (
    <section id="standings" className="bg-gray-50 py-8 sm:py-12 lg:py-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* Show loading state while seasons are being fetched */}
        {seasonsLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="text-gray-600 font-semibold text-lg">Loading seasons...</div>
          </div>
        ) : (
          <>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-gray-900 font-bold tracking-tight mb-2">Standings</h2>
                <div className="h-1 w-16 sm:w-20 bg-[#013fac] rounded"></div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <Select value={selectedSeasonYear} onValueChange={setSelectedSeasonYear}>
                  <SelectTrigger className="w-full sm:w-[140px] font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {seasonYears.map((year) => (
                      <SelectItem key={year} value={year} className="font-bold">
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedGameType} onValueChange={setSelectedGameType}>
                  <SelectTrigger className="w-full sm:w-[180px] font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {gameTypes.map((type) => (
                      <SelectItem key={type} value={type} className="font-bold">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Main Division Group - Dropdown on Mobile, Buttons on Desktop */}
            <div className="mb-3">
              {/* Mobile Dropdown */}
              <div className="md:hidden">
                <Select value={selectedDivisionGroup} onValueChange={setSelectedDivisionGroup}>
                  <SelectTrigger className="w-full font-bold bg-gradient-to-b from-red-600 to-red-700 text-white border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activeDivisionGroups.map((divisionGroup) => (
                      <SelectItem key={divisionGroup} value={divisionGroup} className="font-bold">
                        {divisionGroup}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop Buttons */}
              <div className="hidden md:flex gap-2 pb-2 overflow-x-auto scrollbar-hide">
                {activeDivisionGroups.map((divisionGroup) => (
                  <button
                    key={divisionGroup}
                    onClick={() => setSelectedDivisionGroup(divisionGroup)}
                    className={`px-4 py-2 text-xs font-bold tracking-wide whitespace-nowrap rounded transition-all duration-200 ${
                      selectedDivisionGroup === divisionGroup
                        ? 'bg-gradient-to-b from-red-600 to-red-700 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-[#013fac]/5 border-2 border-[#013fac]/20 hover:border-[#013fac]'
                    }`}
                  >
                    {divisionGroup}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-Division - Dropdown on Mobile, Buttons on Desktop */}
            {hasSubDivisions && (
              <div className="mb-6">
                {/* Mobile Dropdown */}
                <div className="md:hidden">
                  <Select 
                    value={selectedSubDivision?.toString() || ''} 
                    onValueChange={(val) => setSelectedSubDivision(parseInt(val))}
                  >
                    <SelectTrigger className="w-full font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {subDivisions.map((divId) => {
                        const divName = getShortDivisionName(divId);
                        if (!divName) return null;
                        return (
                          <SelectItem key={divId} value={divId.toString()} className="font-bold">
                            {divName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Desktop Buttons */}
                <div className="hidden md:flex gap-2 pb-2 overflow-x-auto scrollbar-hide">
                  {subDivisions.map((divId) => {
                    const divName = getShortDivisionName(divId);
                    if (!divName) return null;
                    return (
                      <button
                        key={divId}
                        onClick={() => setSelectedSubDivision(divId)}
                        className={`px-3 py-1.5 text-xs font-bold tracking-wide whitespace-nowrap rounded transition-all duration-200 ${
                          selectedSubDivision === divId
                            ? 'bg-[#013fac] text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                        }`}
                      >
                        {divName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-gray-500 font-semibold">Loading standings...</div>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-red-500 font-semibold">Error: {error}</div>
                </div>
              ) : rankedStandings.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="text-gray-500 font-semibold mb-2">No standings available</div>
                    <div className="text-sm text-gray-400">
                      Standings will appear once games have been played
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-gradient-to-r from-blue-50 to-red-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex flex-wrap gap-4 sm:gap-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 font-semibold">Teams:</span>
                        <span className="font-bold text-[#001741]">{rankedStandings.length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 font-semibold">Total Games:</span>
                        <span className="font-bold text-[#001741]">{totalGamesPlayed}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 font-semibold">Division:</span>
                        <span className="font-bold text-[#001741]">
                          {selectedSubDivision ? getShortDivisionName(selectedSubDivision) : selectedDivisionGroup}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile Card View */}
                  <div className="md:hidden">
                    {rankedStandings.map((team) => (
                      <div 
                        key={`${team.teamId}-${team.divisionId}`}
                        className={`border-b border-gray-200 p-4 ${playoffSpots > 0 && team.rank <= playoffSpots ? 'bg-green-50 border-l-4 border-l-green-500' : ''}`}
                      >
                        {/* Header with Rank, Logo, and Team Name */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                            team.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                            team.rank === 2 ? 'bg-gray-300 text-gray-900' :
                            team.rank === 3 ? 'bg-orange-400 text-orange-900' :
                            playoffSpots > 0 && team.rank <= playoffSpots ? 'bg-green-500 text-white' :
                            'bg-gray-200 text-gray-700'
                          }`}>
                            {team.rank}
                          </div>
                          {team.teamLogoUrl && (
                            <img src={team.teamLogoUrl} alt={`${team.teamName} logo`} className="w-8 h-8 object-contain" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-base text-gray-900 truncate">{team.teamName}</div>
                            <div className="text-xs text-gray-500">{team.gp} Games Played</div>
                          </div>
                        </div>

                        {/* Main Stats Grid */}
                        <div className="grid grid-cols-4 gap-3 mb-3">
                          <div className="text-center">
                            <div className="text-xs text-gray-500 font-semibold mb-1">W</div>
                            <div className="text-lg font-bold text-green-700">{team.w}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500 font-semibold mb-1">L</div>
                            <div className="text-lg font-bold text-red-700">{team.l}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500 font-semibold mb-1">T</div>
                            <div className="text-lg font-bold text-orange-600">{team.t}</div>
                          </div>
                          <div className="text-center bg-blue-50 rounded-lg py-1">
                            <div className="text-xs text-gray-500 font-semibold mb-1">PTS</div>
                            <div className="text-lg font-bold text-blue-700">{team.pts}</div>
                          </div>
                        </div>

                        {/* Secondary Stats */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex gap-4">
                            <span className="text-gray-600">
                              <span className="font-semibold">DEF:</span> {team.def}
                            </span>
                            <span className="text-gray-600">
                              <span className="font-semibold">GF:</span> {team.gf}
                            </span>
                            <span className="text-gray-600">
                              <span className="font-semibold">GA:</span> {team.ga}
                            </span>
                            <span className="text-gray-600">
                              <span className="font-semibold">PIM:</span> {team.pim}
                            </span>
                            <span className={`font-semibold ${team.diff > 0 ? 'text-green-600' : team.diff < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                              {team.diff > 0 ? '+' : ''}{team.diff}
                            </span>
                          </div>
                          <div className={`px-2 py-1 rounded font-bold ${
                            team.streak.startsWith('W') ? 'bg-green-100 text-green-700' :
                            team.streak.startsWith('L') ? 'bg-red-100 text-red-700' :
                            team.streak.startsWith('T') ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {team.streak}
                          </div>
                        </div>

                        {/* Goals Average */}
                        <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center text-xs">
                          <span className="text-gray-600 font-semibold">Goals Avg</span>
                          <span className="font-bold text-gray-900">{team.gAvg}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#001741] hover:bg-[#001741]">
                          <TableHead className="text-white font-bold text-xs sm:text-sm">RK</TableHead>
                          <TableHead className="text-white font-bold text-xs sm:text-sm">TEAM</TableHead>
                          <TableHead className="text-white text-center font-bold text-xs sm:text-sm">GP</TableHead>
                          <TableHead className="text-white text-center font-bold text-xs sm:text-sm">W</TableHead>
                          <TableHead className="text-white text-center font-bold text-xs sm:text-sm">L</TableHead>
                          <TableHead className="text-white text-center font-bold text-xs sm:text-sm">T</TableHead>
                          <TableHead className="text-white text-center font-bold text-xs sm:text-sm">DEF</TableHead>
                          <TableHead className="text-white text-center font-bold text-xs sm:text-sm">PTS</TableHead>
                          <TableHead className="text-white text-center font-bold text-xs sm:text-sm">GF</TableHead>
                          <TableHead className="text-white text-center font-bold text-xs sm:text-sm">GA</TableHead>
                          <TableHead className="text-white text-center font-bold text-xs sm:text-sm lg:table-cell">G AVG</TableHead>
                          <TableHead className="text-white text-center font-bold text-xs sm:text-sm lg:table-cell">DIFF</TableHead>
                          <TableHead className="text-white text-center font-bold text-xs sm:text-sm xl:table-cell">PIM</TableHead>
                          <TableHead className="text-white text-center font-bold text-xs sm:text-sm xl:table-cell">STRK</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rankedStandings.map((team) => (
                          <TableRow 
                            key={`${team.teamId}-${team.divisionId}`}
                            className={`transition-colors hover:bg-gray-50 ${playoffSpots > 0 && team.rank <= playoffSpots ? 'bg-green-50 border-l-4 border-l-green-500' : ''}`}
                          >
                            <TableCell className="font-bold text-sm sm:text-base">
                              <div className="flex items-center gap-1">
                                {team.rank}
                                {playoffSpots > 0 && team.rank <= playoffSpots && <span className="text-green-600 text-xs">●</span>}
                              </div>
                            </TableCell>
                            <TableCell className="font-bold text-sm sm:text-base">
                              <div className="flex items-center gap-2">
                                {team.teamLogoUrl && <img src={team.teamLogoUrl} alt={`${team.teamName} logo`} className="w-5 h-5 object-contain" />}
                                {team.teamName}
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-semibold text-sm sm:text-base">{team.gp}</TableCell>
                            <TableCell className="text-center font-semibold text-sm sm:text-base text-green-700">{team.w}</TableCell>
                            <TableCell className="text-center font-semibold text-sm sm:text-base text-red-700">{team.l}</TableCell>
                            <TableCell className="text-center font-semibold text-sm sm:text-base text-orange-600">{team.t}</TableCell>
                            <TableCell className="text-center font-semibold text-sm sm:text-base text-gray-600">{team.def}</TableCell>
                            <TableCell className="text-center font-bold text-sm sm:text-base bg-blue-50">{team.pts}</TableCell>
                            <TableCell className="text-center font-semibold text-sm sm:text-base">{team.gf}</TableCell>
                            <TableCell className="text-center font-semibold text-sm sm:text-base">{team.ga}</TableCell>
                            <TableCell className="text-center font-semibold text-sm sm:text-base">{team.gAvg}</TableCell>
                            <TableCell className={`text-center font-bold text-sm sm:text-base ${team.diff > 0 ? 'text-green-600' : team.diff < 0 ? 'text-red-600' : ''}`}>
                              {team.diff > 0 ? '+' : ''}{team.diff}
                            </TableCell>
                            <TableCell className="text-center font-semibold text-sm sm:text-base text-gray-600">{team.pim}</TableCell>
                            <TableCell className={`text-center font-bold text-sm sm:text-base ${team.streak.startsWith('W') ? 'text-green-600' : team.streak.startsWith('L') ? 'text-red-600' : team.streak.startsWith('T') ? 'text-orange-600' : 'text-gray-600'}`}>
                              {team.streak}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>

            {playoffSpots > 0 && (
              <div className="mt-4 flex items-center gap-4 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
                  <span className="font-semibold">Playoff Position (Top {playoffSpots})</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}