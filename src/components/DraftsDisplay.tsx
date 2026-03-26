import React, { useState, useMemo } from 'react';
import { useDraftPicks } from '../hooks/useDraftPicks';
import {
  RefreshCw,
  AlertCircle,
  Search,
  Calendar,
  Loader2,
  Filter,
  ArrowRightLeft,
  Trophy,
} from 'lucide-react';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface DraftsDisplayProps {
  divisionName: string;
}

export function DraftsDisplay({ divisionName }: DraftsDisplayProps) {
  const {
    allPicks,
    rounds,
    availableTypes,
    typeFilter,
    setTypeFilter,
    totalPicks,
    loading,
    error,
    selectedSeason,
    setSelectedSeason,
    seasonOptions,
    seasonsLoading,
    refetch,
  } = useDraftPicks(divisionName);

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'rounds' | 'table'>('rounds');
  const [selectedDraftId, setSelectedDraftId] = useState<number | 'all'>('all');

  // Apply search and draft filter
  const filteredPicks = useMemo(() => {
    let result = allPicks;

    // Apply draft filter
    if (selectedDraftId !== 'all') {
      result = result.filter(p => p.draftId === selectedDraftId);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => {
        return (
          (p.playerName && p.playerName.toLowerCase().includes(q)) ||
          (p.teamName && p.teamName.toLowerCase().includes(q)) ||
          (p.tradeWithTeam && p.tradeWithTeam.toLowerCase().includes(q)) ||
          (p.comment && p.comment.toLowerCase().includes(q)) ||
          (p.draftTitle && p.draftTitle.toLowerCase().includes(q)) ||
          (p.lastClubRegisteredTo && p.lastClubRegisteredTo.toLowerCase().includes(q))
        );
      });
    }

    return result;
  }, [allPicks, selectedDraftId, searchQuery]);

  // Get available drafts for filter dropdown
  const availableDrafts = useMemo(() => {
    const draftMap = new Map<number, { id: number; title: string; count: number }>();
    allPicks.forEach(pick => {
      const existing = draftMap.get(pick.draftId);
      if (existing) {
        existing.count++;
      } else {
        draftMap.set(pick.draftId, {
          id: pick.draftId,
          title: pick.draftTitle || `Draft ${pick.draftId}`,
          count: 1,
        });
      }
    });
    return Array.from(draftMap.values()).sort((a, b) => a.id - b.id);
  }, [allPicks]);

  // Has any pick with round info?
  const hasRounds = filteredPicks.some(p => p.round !== null);
  const hasOverallPick = filteredPicks.some(p => p.overallPick !== null);
  const hasTrades = filteredPicks.some(p => p.isTrade);
  const hasLastClub = filteredPicks.some(p => p.lastClubRegisteredTo);

  if (loading || seasonsLoading) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-10 h-10 text-[#013fac] animate-spin mb-4" />
          <p className="text-sm font-bold text-gray-500">Loading draft information...</p>
          <p className="text-xs text-gray-400 mt-1">{seasonsLoading ? 'Loading season data...' : 'Fetching from DivisionDraft API'}</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-red-200 shadow-sm bg-red-50">
        <div className="p-8 flex flex-col items-center justify-center min-h-[200px]">
          <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
          <h3 className="text-lg font-bold text-red-900 mb-1">Error Loading Draft Data</h3>
          <p className="text-sm text-red-700 mb-4 max-w-md text-center">{error.message}</p>
          <button
            onClick={refetch}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4 font-sans">
      {/* Header */}
      <Card className="border border-gray-200 shadow-sm bg-gradient-to-br from-white to-gray-50">
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2" style={{ fontFamily: 'var(--font-secondary)' }}>
                <Trophy className="w-5 h-5 text-[#013fac]" />
                Draft Information
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {filteredPicks.length} draft entr{filteredPicks.length !== 1 ? 'ies' : 'y'} for {divisionName}
                {selectedSeason && (
                  <span className="ml-1 text-gray-400">
                    ({seasonOptions.find(s => String(s.value) === String(selectedSeason))?.label || selectedSeason})
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={refetch}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors self-start"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 mt-4">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Season Selector */}
              <div className="w-full sm:w-48 shrink-0">
                <Select value={selectedSeason ? String(selectedSeason) : ''} onValueChange={setSelectedSeason} disabled={seasonsLoading}>
                  <SelectTrigger className="w-full bg-white font-bold text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#013fac]" />
                      <SelectValue placeholder={seasonsLoading ? 'Loading...' : 'Select Season'} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {seasonOptions.map(option => (
                      <SelectItem key={option.value} value={String(option.value)} className="font-bold">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Draft Filter (if multiple drafts exist) */}
              {availableDrafts.length > 1 && (
                <div className="w-full sm:w-64 shrink-0">
                  <Select value={selectedDraftId === 'all' ? 'all' : String(selectedDraftId)} onValueChange={(val) => setSelectedDraftId(val === 'all' ? 'all' : Number(val))}>
                    <SelectTrigger className="w-full bg-white font-bold text-sm">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-[#013fac]" />
                        <SelectValue placeholder="All Drafts" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="font-bold">All Drafts ({totalPicks})</SelectItem>
                      {availableDrafts.map(option => (
                        <SelectItem key={option.id} value={String(option.id)} className="font-bold">
                          {option.title} ({option.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search players, teams, details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#013fac] focus:border-[#013fac] bg-white"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden shrink-0">
                <button
                  onClick={() => setViewMode('rounds')}
                  className={`px-3 py-2 text-xs font-bold transition-colors ${
                    viewMode === 'rounds' ? 'bg-[#013fac] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  By Round
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 text-xs font-bold transition-colors border-l border-gray-300 ${
                    viewMode === 'table' ? 'bg-[#013fac] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>

            {/* Type Filter (if both picks and trades exist) */}
            {availableTypes.length > 1 && (
              <div className="flex items-center gap-2 mt-1">
                <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => setTypeFilter('all')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
                      typeFilter === 'all'
                        ? 'bg-[#013fac] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    All ({totalPicks})
                  </button>
                  {availableTypes.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setTypeFilter(typeFilter === type.id ? 'all' : type.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${
                        typeFilter === type.id
                          ? 'bg-[#013fac] text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      {type.name}
                      <span className="opacity-60">({type.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Empty State */}
      {filteredPicks.length === 0 && (
        <Card className="border border-gray-200 shadow-sm">
          <div className="p-12 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h4 className="text-lg font-bold text-gray-900 mb-2">No Draft Data Found</h4>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {searchQuery
                ? `No draft entries matching "${searchQuery}" were found.`
                : `No draft data has been recorded for ${divisionName} in the ${seasonOptions.find(s => String(s.value) === String(selectedSeason))?.label || selectedSeason} season.`
              }
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-sm font-bold text-[#013fac] hover:underline">
                  Clear search
                </button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ── By Round View ── */}
      {viewMode === 'rounds' && filteredPicks.length > 0 && (
        <div className="space-y-6">
          {/* Group by draft first, then by round */}
          {(() => {
            // Group picks by draft
            const picksByDraft = new Map<number, DraftPick[]>();
            filteredPicks.forEach(pick => {
              if (!picksByDraft.has(pick.draftId)) {
                picksByDraft.set(pick.draftId, []);
              }
              picksByDraft.get(pick.draftId)!.push(pick);
            });

            // For each draft, group by round
            return Array.from(picksByDraft.entries())
              .sort(([a], [b]) => a - b)
              .map(([draftId, draftPicks]) => {
                // Group this draft's picks by round
                const roundMap = new Map<number, DraftPick[]>();
                const noRoundPicks: DraftPick[] = [];

                draftPicks.forEach(pick => {
                  if (pick.round !== null) {
                    const existing = roundMap.get(pick.round) || [];
                    existing.push(pick);
                    roundMap.set(pick.round, existing);
                  } else {
                    noRoundPicks.push(pick);
                  }
                });

                const roundsInDraft = Array.from(roundMap.entries())
                  .sort(([a], [b]) => a - b)
                  .map(([round, picks]) => ({
                    round,
                    picks: picks.sort((a, b) => (a.pickNumber || a.overallPick || 999) - (b.pickNumber || b.overallPick || 999)),
                  }));

                if (noRoundPicks.length > 0) {
                  roundsInDraft.push({ round: 0, picks: noRoundPicks });
                }

                const draftTitle = draftPicks[0]?.draftTitle || `Draft ${draftId}`;

                return (
                  <div key={draftId} className="space-y-3">
                    {/* Draft header */}
                    <div className="flex items-center gap-3">
                      <div className="bg-[#013fac] text-white text-xs font-black px-3 py-1.5 rounded-sm">
                        {draftTitle}
                      </div>
                      <span className="text-xs font-bold text-gray-400">
                        {draftPicks.length} pick{draftPicks.length !== 1 ? 's' : ''}
                      </span>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    {/* Rounds in this draft */}
                    <div className="ml-4 space-y-3">
                      {roundsInDraft.map(roundGroup => (
                        <div key={`${draftId}-${roundGroup.round}`}>
                          {/* Round header */}
                          <div className="flex items-center gap-3 mb-2">
                            <div className="bg-[#011741] text-white text-xs font-bold px-3 py-1 rounded-full">
                              {roundGroup.round === 0 ? 'UNDRAFTED' : `ROUND ${roundGroup.round}`}
                            </div>
                            <span className="text-xs text-gray-400">{roundGroup.picks.length} pick{roundGroup.picks.length !== 1 ? 's' : ''}</span>
                          </div>

                          {/* Picks in this round */}
                          <div className="grid gap-2">
                            {roundGroup.picks.map((pick, idx) => (
                              <Card
                                key={pick.id}
                                className={`border p-4 hover:shadow-md transition-all ${
                                  pick.isPassed
                                    ? 'border-gray-300 bg-gray-50 opacity-60'
                                    : pick.isTrade
                                      ? 'border-amber-200 bg-amber-50/50'
                                      : 'border-gray-200 bg-white'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  {/* Pick number badge */}
                                  <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm shadow-sm ${
                                    pick.isPassed
                                      ? 'bg-gray-400 text-white'
                                      : 'bg-gradient-to-br from-[#011741] to-[#013fac] text-white'
                                  }`}>
                                    {pick.isPassed ? '—' : pick.pickNumber ?? idx + 1}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <span className="font-bold text-sm text-gray-900">{pick.teamName}</span>
                                      {pick.isPassed && (
                                        <span className="inline-flex items-center text-xs font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                                          PASS
                                        </span>
                                      )}
                                      {pick.isTrade && pick.tradeWithTeam && (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                                          <ArrowRightLeft className="w-3 h-3" />
                                          traded to {pick.tradeWithTeam}
                                        </span>
                                      )}
                                    </div>

                                    {pick.isPassed ? (
                                      <div className="text-sm text-gray-400 italic">Pass</div>
                                    ) : pick.playerName ? (
                                      <div className="flex items-baseline gap-2">
                                        <span className="text-sm text-gray-700 font-semibold">{pick.playerName}</span>
                                        {pick.lastClubRegisteredTo && (
                                          <span className="text-xs text-gray-400">({pick.lastClubRegisteredTo})</span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-sm text-gray-400 italic">Player TBD</div>
                                    )}

                                    {pick.tradeInfo && (
                                      <p className="text-xs text-amber-600 mt-1 leading-relaxed">
                                        {pick.tradeInfo}
                                      </p>
                                    )}
                                  </div>

                                  {/* Date — only show if we have a real date */}
                                  {pick.date && pick.date !== 'Unknown' && (
                                    <div className="shrink-0 text-xs text-gray-400 font-medium whitespace-nowrap">
                                      {pick.date}
                                    </div>
                                  )}
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
          })()}
        </div>
      )}

      {/* ── Table View ── */}
      {viewMode === 'table' && filteredPicks.length > 0 && (
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap font-sans">
              <thead className="bg-gray-100/80 text-gray-500 font-extrabold uppercase text-xs tracking-wider border-b border-gray-200">
                <tr>
                  {hasOverallPick && <th className="px-3 py-3 text-center w-12">#</th>}
                  {hasRounds && <th className="px-3 py-3 text-center w-16">Rd</th>}
                  {hasRounds && <th className="px-3 py-3 text-center w-16">Pick</th>}
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3">Player</th>
                  {hasLastClub && <th className="px-4 py-3">Last Club</th>}
                  {hasTrades && <th className="px-4 py-3">Trade Info</th>}
                </tr>
              </thead>
              <tbody>
                {filteredPicks.map(pick => (
                  <tr
                    key={pick.id}
                    className={`transition-colors border-b border-gray-100 last:border-0 ${
                      pick.isPassed
                        ? 'bg-gray-50 text-gray-400'
                        : pick.isTrade
                          ? 'bg-amber-50/30 hover:bg-amber-50/60'
                          : 'hover:bg-gray-50/80'
                    }`}
                  >
                    {hasOverallPick && (
                      <td className="px-3 py-3 text-center">
                        {pick.overallPick !== null ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 text-xs font-black rounded-full bg-[#011741] text-white">
                            {pick.overallPick}
                          </span>
                        ) : '-'}
                      </td>
                    )}
                    {hasRounds && (
                      <td className="px-3 py-3 text-center font-bold text-gray-700">
                        {pick.round ?? '-'}
                      </td>
                    )}
                    {hasRounds && (
                      <td className="px-3 py-3 text-center font-medium text-gray-600">
                        {pick.pickNumber ?? '-'}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">
                      {pick.teamName}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {pick.isPassed ? (
                        <span className="inline-flex items-center text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">PASS</span>
                      ) : pick.playerName ? (
                        <span className="font-semibold text-gray-700">{pick.playerName}</span>
                      ) : (
                        <span className="text-gray-400 italic">TBD</span>
                      )}
                    </td>
                    {hasLastClub && (
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {pick.lastClubRegisteredTo || '-'}
                      </td>
                    )}
                    {hasTrades && (
                      <td className="px-4 py-3 text-sm whitespace-nowrap max-w-xs">
                        {pick.tradeWithTeam ? (
                          <div>
                            <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                              <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
                              {pick.tradeWithTeam}
                            </span>
                            {pick.tradeInfo && (
                              <div className="text-xs text-amber-600/80 mt-0.5 whitespace-normal line-clamp-1" title={pick.tradeInfo}>
                                {pick.tradeInfo}
                              </div>
                            )}
                          </div>
                        ) : '-'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}