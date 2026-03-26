/**
 * Shared transaction-fetching logic for division-level data.
 * Used by useTransactions, useProtectedList, and useDraftPicks to avoid
 * duplicating the fetch/transform/dedup pipeline.
 */
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
  value: string;
  startDate?: string;
  endDate?: string;
  seasonId?: number;
}

function formatDateParam(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export interface UseDivisionTransactionsOptions {
  /** Only include entries matching these type codes (client-side filter). Empty = all types. */
  includeTypeCodes?: string[];
  /** Exclude entries matching these type codes (client-side filter). */
  excludeTypeCodes?: string[];
  /** Optional API-level type filter (passed as &Type= param). */
  apiTypeFilter?: string;
  /** Label for console logs */
  hookName?: string;
}

export interface UseDivisionTransactionsResult {
  allEntries: TransactionEntry[];
  loading: boolean;
  error: Error | null;
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

export function useDivisionTransactions(
  divisionName: string,
  options: UseDivisionTransactionsOptions = {}
): UseDivisionTransactionsResult {
  const {
    includeTypeCodes = [],
    excludeTypeCodes = [],
    apiTypeFilter,
    hookName = 'useDivisionTransactions',
  } = options;

  const [allRawEntries, setAllRawEntries] = useState<TransactionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
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

  const { seasons, loading: seasonsLoading } = useSeasons();

  const seasonOptions: SeasonOption[] = useMemo(() => {
    const opts: SeasonOption[] = [];
    if (seasons && seasons.length > 0) {
      seasons.forEach(season => {
        const yearStr = season.StartYear.toString();
        opts.push({
          label: `${season.SeasonName || yearStr}`,
          value: yearStr,
          startDate: season.StartDate ? formatDateParam(season.StartDate) : `${yearStr}0101`,
          endDate: season.EndDate ? formatDateParam(season.EndDate) : `${yearStr}1231`,
          seasonId: season.SeasonId,
        });
      });
    }
    return opts;
  }, [seasons]);

  // Auto-select the most recent season when seasons load and no season is selected
  useEffect(() => {
    if (seasonOptions.length > 0 && (!selectedSeason || selectedSeason === '' || selectedSeason === 'all')) {
      // Season options are ordered by the API — pick the first one (most recent)
      setSelectedSeason(seasonOptions[0].value);
    }
  }, [seasonOptions]);

  const dateRange = useMemo(() => {
    if (!selectedSeason || selectedSeason === 'all') {
      // Fallback: if somehow no season selected, use a wide range
      return { fromDate: '20000101', toDate: undefined };
    }
    const seasonOpt = seasonOptions.find(s => s.value === selectedSeason);
    if (seasonOpt && seasonOpt.startDate) {
      return { fromDate: seasonOpt.startDate, toDate: seasonOpt.endDate };
    }
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
        for (const [key, value] of Object.entries(divisionGroups)) {
          if (key.toLowerCase() === divisionName.toLowerCase() && value.length > 0) {
            divisionIds = value;
            break;
          }
        }
      }
    }

    if (divisionIds.length === 0) {
      console.warn(`[${hookName}] No division IDs found for "${divisionName}" (sub: ${selectedSubdivision})`);
      setAllRawEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {


      const fetchPromises = divisionIds.map(divId =>
        fetchFranchiseTransactions({
          divisionId: divId,
          fromDate: dateRange.fromDate,
          toDate: dateRange.toDate,
          type: apiTypeFilter,
        })
          .then(response => {
            if (response.Success && response.Response?.FranchiseTransactions) {
              return response.Response.FranchiseTransactions;
            }
            return [] as FranchiseTransaction[];
          })
          .catch(err => {
            console.error(`[${hookName}] Error fetching divisionId=${divId}:`, err);
            return [] as FranchiseTransaction[];
          })
      );

      const results = await Promise.all(fetchPromises);
      const allRaw = results.flat();


      if (allRaw.length > 0) {

      }

      // Transform & dedup
      const seen = new Set<string>();
      const entries: TransactionEntry[] = [];

      allRaw.forEach((t, idx) => {
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

      // Sort by date descending
      entries.sort((a, b) => {
        const dateA = new Date(a.dateRaw).getTime();
        const dateB = new Date(b.dateRaw).getTime();
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateB - dateA;
      });


      setAllRawEntries(entries);
      setError(null);
    } catch (err) {
      console.error(`[${hookName}] Fatal error:`, err);
      setError(err instanceof Error ? err : new Error('Failed to fetch transactions'));
      setAllRawEntries([]);
    } finally {
      setLoading(false);
    }
  }, [divisionName, dateRange, apiTypeFilter, hookName, selectedSubdivision, divisionGroups, subDivisionIds]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Apply include/exclude type code filters
  const allEntries = useMemo(() => {
    let filtered = allRawEntries;
    if (includeTypeCodes.length > 0) {
      filtered = filtered.filter(e => includeTypeCodes.includes(e.typeCode));
    }
    if (excludeTypeCodes.length > 0) {
      filtered = filtered.filter(e => !excludeTypeCodes.includes(e.typeCode));
    }
    return filtered;
  }, [allRawEntries, includeTypeCodes, excludeTypeCodes]);

  return {
    allEntries,
    loading,
    error,
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