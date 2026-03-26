import { useState, useEffect, useMemo, useRef } from 'react';
import { useSeasons } from './useSeasons';
import { useLeagueStats, LeaguePlayerStat, LeagueGoalieStat } from './useLeagueStats';
import { useDivisionMapping } from './useDivisionMapping';

/**
 * Hook that fetches league stats for homepage sections (Player Spotlight, League Leaders).
 * 
 * It tries the most recent season first. If that season returns no data
 * (e.g. the 2026 season hasn't started yet), it automatically falls back
 * to the previous season that does have data.
 */

interface UseHomepageStatsReturn {
  players: LeaguePlayerStat[];
  goalies: LeagueGoalieStat[];
  loading: boolean;
  error: Error | null;
  seasonLabel: string; // e.g. "2025" — so UI can indicate which season is shown
}

const MIN_PLAYERS_THRESHOLD = 3; // Need at least this many players to consider a season "has data"

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

  // State machine for season fallback
  // 'trying-latest' -> 'trying-fallback' -> 'done'
  const [phase, setPhase] = useState<'trying-latest' | 'trying-fallback' | 'done'>('trying-latest');
  const [activeSeasonId, setActiveSeasonId] = useState<number | null>(null);
  const [activeSeasonLabel, setActiveSeasonLabel] = useState<string>('');
  const prevSeasonsRef = useRef<string>('');

  // When seasons load, start with the most recent one
  useEffect(() => {
    if (seasonsLoading || seasons.length === 0) return;

    // Only reset if the seasons list actually changed (avoid re-triggering on every render)
    const seasonsKey = seasons.map(s => s.SeasonId).join(',');
    if (prevSeasonsRef.current === seasonsKey) return;
    prevSeasonsRef.current = seasonsKey;

    const latest = seasons[0];
    setActiveSeasonId(latest.SeasonId);
    setActiveSeasonLabel(latest.StartYear.toString());
    setPhase('trying-latest');
  }, [seasons, seasonsLoading]);

  // Fetch stats for the active season
  const { players, goalies, loading: statsLoading, error } = useLeagueStats(
    activeSeasonId,
    divisionIds,
    null,
    'regu'
  );

  // Check if we need to fall back after loading completes
  useEffect(() => {
    // Only evaluate after stats have finished loading for the current season
    if (statsLoading || !activeSeasonId || seasonsLoading) return;

    const hasData = players.length >= MIN_PLAYERS_THRESHOLD || goalies.length >= MIN_PLAYERS_THRESHOLD;

    if (phase === 'trying-latest' && !hasData) {
      // No data for the latest season — try the previous one
      const fallbackSeason = seasons.length > 1 ? seasons[1] : null;
      if (fallbackSeason) {
        setActiveSeasonId(fallbackSeason.SeasonId);
        setActiveSeasonLabel(fallbackSeason.StartYear.toString());
        setPhase('trying-fallback');
      } else {
        setPhase('done');
      }
    } else if (phase === 'trying-latest' && hasData) {
      setPhase('done');
    } else if (phase === 'trying-fallback') {
      setPhase('done');
    }
  }, [statsLoading, players, goalies, phase, activeSeasonId, seasons, activeSeasonLabel, seasonsLoading]);

  // We're loading if seasons are loading, stats are loading, or we haven't finished the fallback check
  const loading = seasonsLoading || statsLoading || (phase !== 'done' && activeSeasonId !== null);

  return {
    players,
    goalies,
    loading,
    error,
    seasonLabel: activeSeasonLabel,
  };
}