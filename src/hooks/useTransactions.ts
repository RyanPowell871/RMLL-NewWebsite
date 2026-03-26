import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchFranchiseTransactions, FranchiseTransaction } from '../services/sportzsoft/api';
import { useDivisionMapping } from './useDivisionMapping';
import { useSeasons } from './useSeasons';

export interface TransactionEntry {
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
  divGroupCommonCode: string | null;
}

export interface SeasonOption {
  label: string;
  value: string; // 'all' or year string like '2025'
  startDate?: string; // yyyymmdd
  endDate?: string; // yyyymmdd
  seasonId?: number;
}

export interface UseTransactionsResult {
  transactions: TransactionEntry[];
  loading: boolean;
  error: Error | null;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  availableTypes: { id: string; name: string; count: number }[];
  totalBeforeTypeFilter: number;
  teamFilter: string;
  setTeamFilter: (team: string) => void;
  availableTeams: { name: string; count: number }[];
  totalBeforeTeamFilter: number;
  selectedSeason: string;
  setSelectedSeason: (season: string) => void;
  seasonOptions: SeasonOption[];
  seasonsLoading: boolean;
  selectedSubdivision: string;
  setSelectedSubdivision: (sub: string) => void;
  availableSubdivisions: string[];
  hasSubdivisions: boolean;
  refetch: () => void;
}

// Format date to yyyymmdd for the API
function formatDateParam(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export function useTransactions(divisionName: string): UseTransactionsResult {
  const [allTransactions, setAllTransactions] = useState<TransactionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedSubdivision, setSelectedSubdivision] = useState<string>('All');

  const { divisionGroups, subDivisionIds } = useDivisionMapping();

  // Compute available subdivisions for this division
  const availableSubdivisions = useMemo(() => {
    const subs = subDivisionIds[divisionName];
    if (!subs) return [];
    return Object.keys(subs);
  }, [divisionName, subDivisionIds]);

  const hasSubdivisions = availableSubdivisions.length > 0;

  // Reset subdivision when division changes
  useEffect(() => {
    setSelectedSubdivision('All');
  }, [divisionName]);

  // Use the shared seasons hook to get season data
  const { 
    seasons, 
    loading: seasonsLoading,
  } = useSeasons();

  // Build season options from the seasons data
  const seasonOptions: SeasonOption[] = useMemo(() => {
    const options: SeasonOption[] = [];

    if (seasons && seasons.length > 0) {
      // Seasons are already sorted by StartYear descending from useSeasons
      seasons.forEach(season => {
        const yearStr = season.StartYear.toString();
        options.push({
          label: `${season.SeasonName || yearStr}`,
          value: yearStr,
          startDate: season.StartDate ? formatDateParam(season.StartDate) : `${yearStr}0101`,
          endDate: season.EndDate ? formatDateParam(season.EndDate) : `${yearStr}1231`,
          seasonId: season.SeasonId,
        });
      });
    }

    return options;
  }, [seasons]);

  // Auto-select the most recent season when seasons load
  useEffect(() => {
    if (seasonOptions.length > 0 && (!selectedSeason || selectedSeason === '' || selectedSeason === 'all')) {
      setSelectedSeason(seasonOptions[0].value);
    }
  }, [seasonOptions]);

  // Determine the date range based on selected season
  const dateRange = useMemo(() => {
    if (!selectedSeason || selectedSeason === 'all') {
      // Fallback: if somehow no season selected, use a wide range
      return { fromDate: '20000101', toDate: undefined };
    }

    const seasonOpt = seasonOptions.find(s => s.value === selectedSeason);
    if (seasonOpt && seasonOpt.startDate) {
      return { fromDate: seasonOpt.startDate, toDate: seasonOpt.endDate };
    }

    // Fallback: use the year
    return { fromDate: `${selectedSeason}0101`, toDate: `${selectedSeason}1231` };
  }, [selectedSeason, seasonOptions]);

  const fetchData = useCallback(async () => {
    // Don't fetch until a season is selected — prevents the initial wide-range
    // fetch that causes a visible double-load (all data flash then season data)
    if (!selectedSeason || selectedSeason === '') {

      return;
    }

    // Use subdivision-specific IDs when a subdivision is selected
    let divisionIds: number[];
    if (selectedSubdivision !== 'All' && subDivisionIds[divisionName]?.[selectedSubdivision]) {
      divisionIds = subDivisionIds[divisionName][selectedSubdivision];
    } else {
      const ids = divisionGroups[divisionName];
      divisionIds = (ids && ids.length > 0) ? ids : [];
      if (divisionIds.length === 0) {
        // Case-insensitive fallback
        for (const [key, value] of Object.entries(divisionGroups)) {
          if (key.toLowerCase() === divisionName.toLowerCase() && value.length > 0) {
            divisionIds = value;
            break;
          }
        }
      }
    }
    
    if (divisionIds.length === 0) {
      console.warn(`[useTransactions] No division IDs found for "${divisionName}" (sub: ${selectedSubdivision})`);
      setAllTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {

      
      // Fetch transactions for all sub-division IDs in parallel
      const fetchPromises = divisionIds.map(divId =>
        fetchFranchiseTransactions({ 
          divisionId: divId, 
          fromDate: dateRange.fromDate,
          toDate: dateRange.toDate,
        })
          .then(response => {
            if (response.Success && response.Response?.FranchiseTransactions) {
              return response.Response.FranchiseTransactions;
            }

            return [] as FranchiseTransaction[];
          })
          .catch(err => {
            console.error(`[useTransactions] Error fetching divisionId=${divId}:`, err);
            return [] as FranchiseTransaction[];
          })
      );

      const results = await Promise.all(fetchPromises);
      const allRaw = results.flat();


      
      // Log first entry structure for debugging
      if (allRaw.length > 0) {

      }

      // Transform and deduplicate
      const seen = new Set<string>();
      const entries: TransactionEntry[] = [];

      allRaw.forEach((t, idx) => {
        // Create a dedup key from date + team + comment
        const dedupKey = `${t.TransactionDate}|${t.TeamName}|${t.TransactionComment}|${t.PlayerName}`;
        if (seen.has(dedupKey)) return;
        seen.add(dedupKey);

        // Parse the date
        const parsedDate = t.TransactionDate ? new Date(t.TransactionDate) : null;
        const dateStr = parsedDate 
          ? parsedDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          : 'Unknown Date';

        // Extract year from the date for grouping
        const year = parsedDate ? parsedDate.getFullYear() : 0;

        // Map API field names (note the API typos/naming quirks)
        // TransactionTypeCd -> typeCode, TrasactionTypeName (typo!) -> typeName
        const typeCode = (t as any).TransactionTypeCd || (t as any).TransactionTypeId || '';
        const typeName = (t as any).TrasactionTypeName || (t as any).TransactionTypeName || '';
        const tradeTypeCd = (t as any).TradeTypeCd || (t as any).TradeTypeId || null;

        entries.push({
          id: `txn-${idx}-${t.TeamFranchiseId || 0}-${year}`,
          date: dateStr,
          dateRaw: t.TransactionDate || '',
          year,
          playerName: t.PlayerName,
          teamName: t.TeamName || 'Unknown Team',
          comment: t.TransactionComment || '',
          typeCode,
          typeName: typeName || (typeCode === 'T' ? 'Trade' : typeCode === 'P' ? 'Protected' : typeCode === 'R' ? 'Release' : typeCode || 'Transaction'),
          tradeWithTeam: t.TradeWithTeamName,
          status: t.TradeStatus || '',
          teamFranchiseId: t.TeamFranchiseId,
          tradeWithFranchiseId: t.TradeWithFranchiseId,
          divGroupCommonCode: (t as any).DivGroupCommonCode || null,
        });
      });

      // Sort by date descending (most recent first)
      entries.sort((a, b) => {
        const dateA = new Date(a.dateRaw).getTime();
        const dateB = new Date(b.dateRaw).getTime();
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateB - dateA;
      });



      setAllTransactions(entries);
      setError(null);
    } catch (err) {
      console.error('[useTransactions] Fatal error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch transactions'));
      setAllTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [divisionName, dateRange, selectedSubdivision, divisionGroups, subDivisionIds]);

  // Fetch on mount and when division or date range changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Discover available transaction types from all data
  const availableTypes = useMemo(() => {
    const typeMap = new Map<string, { name: string; count: number }>();
    allTransactions.forEach(e => {
      // Use typeName as the key if typeCode is empty
      const key = e.typeCode || e.typeName;
      if (key && !typeMap.has(key)) {
        typeMap.set(key, { name: e.typeName, count: 1 });
      } else if (key) {
        const entry = typeMap.get(key);
        if (entry) {
          typeMap.set(key, { ...entry, count: entry.count + 1 });
        }
      }
    });
    return Array.from(typeMap.entries()).map(([id, { name, count }]) => ({ id, name, count }));
  }, [allTransactions]);

  // Discover available teams from all data
  const availableTeams = useMemo(() => {
    const teamMap = new Map<string, number>();
    allTransactions.forEach(e => {
      if (e.teamName) {
        const currentCount = teamMap.get(e.teamName) || 0;
        teamMap.set(e.teamName, currentCount + 1);
      }
    });
    return Array.from(teamMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  }, [allTransactions]);

  // Apply type filter
  const filteredTransactions = useMemo(() => {
    if (typeFilter === 'all') return allTransactions;
    return allTransactions.filter(t => {
      const key = t.typeCode || t.typeName;
      return key === typeFilter;
    });
  }, [typeFilter, allTransactions]);

  // Apply team filter
  const finalTransactions = useMemo(() => {
    if (teamFilter === 'all') return filteredTransactions;
    return filteredTransactions.filter(t => {
      return t.teamName === teamFilter;
    });
  }, [teamFilter, filteredTransactions]);

  return {
    transactions: finalTransactions,
    loading,
    error,
    typeFilter,
    setTypeFilter,
    availableTypes,
    totalBeforeTypeFilter: allTransactions.length,
    teamFilter,
    setTeamFilter,
    availableTeams,
    totalBeforeTeamFilter: filteredTransactions.length,
    selectedSeason,
    setSelectedSeason,
    seasonOptions,
    seasonsLoading,
    selectedSubdivision,
    setSelectedSubdivision,
    availableSubdivisions,
    hasSubdivisions,
    refetch: fetchData,
  };
}