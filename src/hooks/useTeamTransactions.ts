/**
 * Hook for fetching franchise transactions and protected list for a specific team.
 * 
 * Transactions: Uses the TeamFranchiseTransaction endpoint (correct for history).
 * Protected List: Uses Team call to get TeamFranchiseId, then
 *   TeamFranchise/{id}?ChildCodes=P to get the protected list.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  fetchFranchiseTransactions, 
  FranchiseTransaction,
  fetchTeamFranchiseProtectedList,
  fetchFranchiseDetails,
} from '../services/sportzsoft/api';

export interface TeamTransactionEntry {
  id: string;
  date: string;
  dateRaw: string;
  year: number;
  playerName: string | null;
  teamName: string;
  comment: string;
  typeCode: string;
  typeName: string;
  tradeWithTeam: string | null;
  status: string;
  teamFranchiseId: number | null;
  tradeWithFranchiseId: number | null;
}

export interface ProtectedListEntry {
  id: string;
  playerName: string;
  playerId?: number;
  jerseyNumber?: string;
  position?: string;
  date: string;
  dateRaw: string;
  comment: string;
  // Keep backward-compatible fields so the TeamDetailPage doesn't break
  typeCode: string;
  typeName: string;
  teamName: string;
  teamFranchiseId: number | null;
}

export interface UseTeamTransactionsResult {
  transactions: TeamTransactionEntry[];
  protectedList: ProtectedListEntry[];
  allEntries: TeamTransactionEntry[];
  loading: boolean;
  protectedListLoading: boolean;
  error: Error | null;
  protectedListError: Error | null;
  refetch: () => void;
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
 * Mirrors the parser in useProtectedList.ts.
 * 
 * Based on actual DB structure: TeamFranchiseRoles with FranchiseRoleCd='PROT'.
 */
function parseProtectedPlayersForTeam(response: any, teamName: string, teamId: number): ProtectedListEntry[] {
  const players: ProtectedListEntry[] = [];
  
  if (!response) return players;

  const topKeys = Object.keys(response);


  // Prioritize TeamFranchiseRoles (known from DB structure)
  // NOTE: 'Roster' is intentionally EXCLUDED — it contains team roster entries, not protected list data.
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

  // 1. Check top level
  searchForArray(response, '');

  // 2. Check nested Response
  if (!protectedArray && response.Response) {
    const resp = response.Response;

    
    searchForArray(resp, 'Response');

    if (!protectedArray && Array.isArray(resp)) {
      protectedArray = resp;
      foundKey = 'Response (array)';
    }

    // Check Team/Franchise/TeamFranchise wrappers
    for (const wrapper of ['Team', 'Franchise', 'TeamFranchise']) {
      if (!protectedArray && resp[wrapper]) {

        searchForArray(resp[wrapper], `Response.${wrapper}`);
      }
    }
  }

  // 3. Broad scan for any array with role/player-like items
  if (!protectedArray) {
    const scanTarget = response.Response || response;
    for (const key of Object.keys(scanTarget)) {
      const val = scanTarget[key];
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
        const item = val[0];
        
        // SKIP Roster arrays — they contain team roster entries, not protected list data.
        const isRosterEntry = item.ActiveTeamId !== undefined || 
                              item.AffiliateFlag !== undefined ||
                              item.PlayerRegNo !== undefined ||
                              item.ShotOnHandLMR !== undefined ||
                              item.TeamPlayerId !== undefined ||
                              item.DateStarted !== undefined;
        if (isRosterEntry) {

          continue;
        }
        
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
    const jerseyNumber = resolveStr(entry, 'PlayerNo', 'JerseyNumber', 'No', 'Jersey');
    const position = resolveStr(entry, 'Position', 'SportPositionName', 'Pos');
    const date = resolveStr(entry, 'EffectiveDate', 'ProtectedDate', 'TransactionDate', 'DateAdded', 'Date');
    const comment = resolveStr(entry, 'Comment', 'TransactionComment', 'Notes');

    let formattedDate = '';
    if (date) {
      try {
        formattedDate = new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      } catch { formattedDate = date; }
    }

    players.push({
      id: `protected-${teamId}-${playerId || idx}`,
      playerName,
      playerId: playerId || undefined,
      jerseyNumber: jerseyNumber || undefined,
      position: position || undefined,
      date: formattedDate,
      dateRaw: date,
      comment,
      typeCode: 'P',
      typeName: 'Protected',
      teamName,
      teamFranchiseId: null,
    });
  });

  return players;
}

export function useTeamTransactions(
  teamId: number | null, 
  divisionId?: number,
  teamName?: string,
  seasonYear?: string
): UseTeamTransactionsResult {
  const [allEntries, setAllEntries] = useState<TeamTransactionEntry[]>([]);
  const [protectedList, setProtectedList] = useState<ProtectedListEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [protectedListLoading, setProtectedListLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [protectedListError, setProtectedListError] = useState<Error | null>(null);

  // Compute date range from season year
  const dateRange = useMemo(() => {
    if (!seasonYear || seasonYear === 'all') {
      return { fromDate: '20000101', toDate: undefined };
    }
    return { fromDate: `${seasonYear}0101`, toDate: `${seasonYear}1231` };
  }, [seasonYear]);

  // Fetch transactions (unchanged — this is still correct for transaction history)
  const fetchTransactionData = useCallback(async () => {
    if (!teamId) {
      setAllEntries([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {


      const fetchPromises: Promise<{ source: string; data: FranchiseTransaction[] }>[] = [];

      // 1. Fetch by teamId
      fetchPromises.push(
        fetchFranchiseTransactions({
          teamId,
          fromDate: dateRange.fromDate,
          toDate: dateRange.toDate,
        })
          .then(response => ({
            source: 'teamId',
            data: (response.Success && response.Response?.FranchiseTransactions) 
              ? response.Response.FranchiseTransactions 
              : []
          }))
          .catch(err => {
            console.warn('[useTeamTransactions] Error fetching by teamId:', err);
            return { source: 'teamId', data: [] as FranchiseTransaction[] };
          })
      );

      // 2. If we have divisionId, also fetch division-level data
      if (divisionId) {
        fetchPromises.push(
          fetchFranchiseTransactions({
            divisionId,
            fromDate: dateRange.fromDate,
            toDate: dateRange.toDate,
          })
            .then(response => ({
              source: 'divisionId',
              data: (response.Success && response.Response?.FranchiseTransactions) 
                ? response.Response.FranchiseTransactions 
                : []
            }))
            .catch(err => {
              console.warn('[useTeamTransactions] Error fetching by divisionId:', err);
              return { source: 'divisionId', data: [] as FranchiseTransaction[] };
            })
        );
      }

      const results = await Promise.all(fetchPromises);
      
      const teamIdResults = results.find(r => r.source === 'teamId')?.data || [];
      const divisionResults = results.find(r => r.source === 'divisionId')?.data || [];



      let rawToProcess: FranchiseTransaction[] = [];

      if (teamIdResults.length > 0) {
        rawToProcess = teamIdResults;
      }
      
      if (divisionResults.length > 0 && teamName) {
        const normalizedName = teamName.toLowerCase().trim();
        const teamDivResults = divisionResults.filter(t => {
          const txnTeam = (t.TeamName || '').toLowerCase().trim();
          const txnTradeWith = (t.TradeWithTeamName || '').toLowerCase().trim();
          return txnTeam === normalizedName || 
                 txnTeam.includes(normalizedName) || 
                 normalizedName.includes(txnTeam) ||
                 txnTradeWith === normalizedName ||
                 txnTradeWith.includes(normalizedName) ||
                 normalizedName.includes(txnTradeWith);
        });
        rawToProcess = [...rawToProcess, ...teamDivResults];
      } else if (divisionResults.length > 0 && !teamName && teamIdResults.length === 0) {
        rawToProcess = divisionResults;
      }

      // Transform and dedup
      const seen = new Set<string>();
      const entries: TeamTransactionEntry[] = [];

      rawToProcess.forEach((t, idx) => {
        const dedupKey = `${t.TransactionDate}|${t.TeamName}|${t.TransactionComment}|${t.PlayerName}`;
        if (seen.has(dedupKey)) return;
        seen.add(dedupKey);

        const parsedDate = t.TransactionDate ? new Date(t.TransactionDate) : null;
        const dateStr = parsedDate
          ? parsedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
          : 'Unknown Date';
        const year = parsedDate ? parsedDate.getFullYear() : 0;

        const typeCode = (t as any).TransactionTypeCd || (t as any).TransactionTypeId || '';
        const typeName = (t as any).TrasactionTypeName || (t as any).TransactionTypeName || '';

        entries.push({
          id: `team-txn-${idx}-${t.TeamFranchiseId || 0}-${year}-${typeCode}`,
          date: dateStr,
          dateRaw: t.TransactionDate || '',
          year,
          playerName: t.PlayerName,
          teamName: t.TeamName || 'Unknown Team',
          comment: t.TransactionComment || '',
          typeCode,
          typeName: typeName || (
            typeCode === 'T' ? 'Trade' : 
            typeCode === 'P' ? 'Protected' : 
            typeCode === 'R' ? 'Release' : 
            typeCode === 'D' ? 'Draft' : 
            typeCode === 'W' ? 'Waiver' :
            typeCode === 'S' ? 'Suspension' :
            typeCode || 'Transaction'
          ),
          tradeWithTeam: t.TradeWithTeamName,
          status: t.TradeStatus || '',
          teamFranchiseId: t.TeamFranchiseId,
          tradeWithFranchiseId: t.TradeWithFranchiseId,
        });
      });

      // Sort by date descending
      entries.sort((a, b) => {
        const dateA = new Date(a.dateRaw).getTime();
        const dateB = new Date(b.dateRaw).getTime();
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateB - dateA;
      });



      setAllEntries(entries);
      setError(null);
    } catch (err) {
      console.error('[useTeamTransactions] Fatal error fetching transactions:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch team transactions'));
      setAllEntries([]);
    } finally {
      setLoading(false);
    }
  }, [teamId, divisionId, teamName, dateRange]);

  // Fetch protected list using the franchise approach
  // Flow: Team call → get TeamFranchiseId → TeamFranchise/{id}?ChildCodes=P
  // Protected lists are NOT seasonal — they're a running document per team
  const fetchProtectedListData = useCallback(async () => {
    if (!teamId) {
      setProtectedList([]);
      return;
    }

    setProtectedListLoading(true);
    setProtectedListError(null);

    try {


      let players: ProtectedListEntry[] = [];
      const name = teamName || `Team ${teamId}`;

      // Step 1: Get TeamFranchiseId from the Team endpoint
      let franchiseId: number | null = null;
      try {
        const teamResponse = await fetchTeamFranchiseProtectedList(teamId, 'B');
        if (teamResponse.Success && teamResponse.Response) {
          const resp = teamResponse.Response;
          franchiseId = resp.Team?.TeamFranchiseId || resp.TeamFranchiseId || 
                       resp.Team?.FranchiseId || resp.FranchiseId || null;

        }
      } catch (err) {
        console.warn(`[useTeamTransactions] Team endpoint failed:`, err);
      }

      // Step 2: Use TeamFranchiseId to call TeamFranchise/{id}?ChildCodes=P
      if (franchiseId) {
        try {

          const franchiseResponse = await fetchFranchiseDetails(franchiseId, 'C', 'P');
          if (franchiseResponse.Success && franchiseResponse.Response) {
            players = parseProtectedPlayersForTeam(franchiseResponse, name, teamId);
          }
        } catch (err) {
          console.warn(`[useTeamTransactions] Franchise protected list failed:`, err);
        }
      } else {
        console.warn(`[useTeamTransactions] No TeamFranchiseId found for ${name} — cannot fetch protected list`);
      }

      // Sort alphabetically
      players.sort((a, b) => a.playerName.localeCompare(b.playerName));
      

      setProtectedList(players);
      setProtectedListError(null);
    } catch (err) {
      console.error('[useTeamTransactions] Fatal error fetching protected list:', err);
      setProtectedListError(err instanceof Error ? err : new Error('Failed to fetch protected list'));
      setProtectedList([]);
    } finally {
      setProtectedListLoading(false);
    }
  }, [teamId, teamName]);

  // Fetch both in parallel
  useEffect(() => {
    fetchTransactionData();
    fetchProtectedListData();
  }, [fetchTransactionData, fetchProtectedListData]);

  // Filter transactions to exclude type 'P' since protected list is now separate
  const transactions = useMemo(() => {
    return allEntries.filter(e => e.typeCode !== 'P');
  }, [allEntries]);

  const refetch = useCallback(() => {
    fetchTransactionData();
    fetchProtectedListData();
  }, [fetchTransactionData, fetchProtectedListData]);

  return {
    transactions,
    protectedList,
    allEntries,
    loading: loading || protectedListLoading,
    protectedListLoading,
    error,
    protectedListError,
    refetch,
  };
}