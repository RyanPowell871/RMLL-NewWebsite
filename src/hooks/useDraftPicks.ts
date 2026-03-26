/**
 * Hook for fetching and organizing Draft data from SportzSoft.
 * 
 * NOW uses the dedicated DivisionDraft endpoint (via useDivisionDraft)
 * instead of piggy-backing on TeamFranchiseTransaction.
 * 
 * Provides a backwards-compatible interface so DraftsDisplay still works
 * without changes, while exposing richer draft-specific data (grouped drafts,
 * proper round/pick numbers, trade info).
 */
import { useState, useMemo } from 'react';
import { useDivisionDraft, DraftEntry, DraftGroup } from './useDivisionDraft';

export interface DraftPick {
  id: string;
  playerName: string | null;
  teamName: string;
  tradeWithTeam: string | null;
  date: string;
  dateRaw: string;
  comment: string;
  typeCode: string;
  typeName: string;
  round: number | null;
  pickNumber: number | null;
  overallPick: number | null;
  draftId: number;
  draftTitle: string;
  isTrade: boolean;
  tradeComment: string | null;
  isPassed: boolean;
  lastClubRegisteredTo: string | null;
  tradeInfo: string | null;
}

export interface DraftRound {
  round: number;
  picks: DraftPick[];
}

export interface UseDraftPicksResult {
  allPicks: DraftPick[];
  rounds: DraftRound[];
  draftGroups: DraftGroup[];
  availableDrafts: { id: number; title: string; count: number }[];
  availableTypes: { id: string; name: string; count: number }[];
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  teamFilter: string;
  setTeamFilter: (team: string) => void;
  draftFilter: number | 'all';
  setDraftFilter: (draft: number | 'all') => void;
  availableTeams: string[];
  totalPicks: number;
  loading: boolean;
  error: Error | null;
  selectedSeason: string;
  setSelectedSeason: (season: string) => void;
  seasonOptions: { label: string; value: string; seasonId?: number }[];
  seasonsLoading: boolean;
  selectedSubdivision: string;
  setSelectedSubdivision: (sub: string) => void;
  availableSubdivisions: string[];
  hasSubdivisions: boolean;
  refetch: () => void;
}

export function useDraftPicks(divisionName: string): UseDraftPicksResult {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [draftFilter, setDraftFilter] = useState<number | 'all'>('all');

  const {
    allEntries,
    draftGroups,
    availableDrafts,
    availableTeams,
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
    refetch,
  } = useDivisionDraft(divisionName);

  // Transform DraftEntry → DraftPick (backwards-compatible shape)
  const allPicks = useMemo<DraftPick[]>(() => {
    return allEntries.map(e => ({
      id: e.id,
      playerName: e.playerName,
      teamName: e.teamName,
      tradeWithTeam: e.tradedToFranchiseName,
      date: e.date,
      dateRaw: e.dateRaw,
      comment: e.comment,
      typeCode: e.isPassed ? 'PASS' : e.isTrade ? 'TRADE' : 'PICK',
      typeName: e.isPassed ? 'Pass' : e.isTrade ? 'Traded Pick' : 'Draft Pick',
      round: e.round,
      pickNumber: e.pickNumber,
      overallPick: e.overallPick,
      draftId: e.draftId,
      draftTitle: e.draftTitle,
      isTrade: e.isTrade,
      tradeComment: e.tradeInfo,
      isPassed: e.isPassed,
      lastClubRegisteredTo: e.lastClubRegisteredTo,
      tradeInfo: e.tradeInfo,
    }));
  }, [allEntries]);

  // Discover available types
  const availableTypes = useMemo(() => {
    const typeMap = new Map<string, { name: string; count: number }>();
    allPicks.forEach(p => {
      const key = p.typeCode;
      const existing = typeMap.get(key);
      if (existing) {
        typeMap.set(key, { ...existing, count: existing.count + 1 });
      } else {
        typeMap.set(key, { name: p.typeName, count: 1 });
      }
    });
    return Array.from(typeMap.entries()).map(([id, { name, count }]) => ({ id, name, count }));
  }, [allPicks]);

  // Apply filters
  const filteredPicks = useMemo(() => {
    let result = allPicks;
    if (typeFilter !== 'all') {
      result = result.filter(p => p.typeCode === typeFilter);
    }
    if (teamFilter !== 'all') {
      result = result.filter(p => p.teamName === teamFilter);
    }
    if (draftFilter !== 'all') {
      result = result.filter(p => p.draftId === draftFilter);
    }
    return result;
  }, [allPicks, typeFilter, teamFilter, draftFilter]);

  // Group by round
  const rounds = useMemo(() => {
    const roundMap = new Map<number, DraftPick[]>();
    const noRound: DraftPick[] = [];

    filteredPicks.forEach(pick => {
      if (pick.round !== null) {
        const existing = roundMap.get(pick.round) || [];
        existing.push(pick);
        roundMap.set(pick.round, existing);
      } else {
        noRound.push(pick);
      }
    });

    const result: DraftRound[] = Array.from(roundMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([round, picks]) => ({
        round,
        picks: picks.sort((a, b) => (a.pickNumber || a.overallPick || 999) - (b.pickNumber || b.overallPick || 999)),
      }));

    if (noRound.length > 0) {
      result.push({ round: 0, picks: noRound });
    }

    return result;
  }, [filteredPicks]);

  return {
    allPicks: filteredPicks,
    rounds,
    draftGroups,
    availableDrafts,
    availableTypes,
    typeFilter,
    setTypeFilter,
    teamFilter,
    setTeamFilter,
    draftFilter,
    setDraftFilter,
    availableTeams,
    totalPicks: allPicks.length,
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
    refetch,
  };
}