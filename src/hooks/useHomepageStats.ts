import { useMemo } from 'react';
import { useSeasons } from './useSeasons';
import { useLeagueStats, LeaguePlayerStat, LeagueGoalieStat } from './useLeagueStats';
import { useDivisionMapping } from './useDivisionMapping';

/**
 * Hook that fetches league stats for homepage sections (Player Spotlight, League Leaders).
 *
 * It fetches stats for the current (most recent) season only. If there is no data
 * (e.g. the season hasn't started yet), it will show the "No Data Available" state
 * instead of falling back to previous seasons.
 */

interface UseHomepageStatsReturn {
  players: LeaguePlayerStat[];
  goalies: LeagueGoalieStat[];
  loading: boolean;
  error: Error | null;
  seasonLabel: string; // e.g. "2026" — so UI can indicate which season is shown
}

export function useHomepageStats(
  selectedDivision: string,
  selectedSubDivision: string = 'All'
): UseHomepageStatsReturn {
  const { seasons, loading: seasonsLoading } = useSeasons();
  const { getDivisionIds, getSubDivisionIds } = useDivisionMapping();

  // Resolve division IDs from selected division + sub-division
  const divisionIds = useMemo(() => {
    if (selectedDivision === 'All Divisions') return null;

    // If a specific sub-division is selected, use it
    if (selectedSubDivision && selectedSubDivision !== 'All') {
      return getSubDivisionIds(selectedDivision, selectedSubDivision);
    }

    // Otherwise fall back to the full division group
    return getDivisionIds(selectedDivision);
  }, [selectedDivision, selectedSubDivision, getDivisionIds, getSubDivisionIds]);

  // Find the most recent season from the available seasons
  const currentSeason = useMemo(() => {
    if (seasonsLoading || seasons.length === 0) return null;
    // seasons are sorted by StartYear descending, so first is most recent
    return seasons[0];
  }, [seasons, seasonsLoading]);

  // Use the current season ID only - no fallback to previous seasons
  const activeSeasonId = useMemo(() => {
    if (currentSeason) return currentSeason.SeasonId;
    return null;
  }, [currentSeason]);

  const activeSeasonLabel = useMemo(() => {
    if (currentSeason) return currentSeason.StartYear.toString();
    return '';
  }, [currentSeason]);

  // Fetch stats for the current season only (no fallback)
  const { players, goalies, loading: statsLoading, error } = useLeagueStats(
    activeSeasonId,
    divisionIds,
    null,
    'regu'
  );

  // We're loading if seasons are loading or stats are loading
  const loading = seasonsLoading || statsLoading;

  return {
    players,
    goalies,
    loading,
    error,
    seasonLabel: activeSeasonLabel,
  };
}