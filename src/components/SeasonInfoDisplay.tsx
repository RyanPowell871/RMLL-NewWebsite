import React from 'react';
import { Calendar, MapPin, Trophy, Users, Clock } from 'lucide-react';
import { Card } from './ui/card';
import type { SeasonInfoData as UnifiedSeasonInfoData, DraftSection, RegularSeasonSection, PlayoffSection, ProvincialSection, ChampionshipSection } from './admin/SeasonInfoEditor';

// Legacy data structures (for backward compatibility)
interface LegacySeasonInfoData {
  drafts?: {
    north?: {
      title: string;
      subtitle: string;
      date: string;
      time: string;
      location?: string;
      notes?: string;
    };
    south?: {
      title: string;
      subtitle: string;
      date: string;
      time: string;
      notes?: string;
    };
  };
  draft?: {
    title: string;
    draftEligible?: string;
    details?: string[];
    event?: {
      date: string;
      time: string;
      location?: string;
      note?: string;
      social?: string;
      virtual?: string;
    };
    draftOrder?: string[];
  };
  season?: {
    title: string;
    seasonStart: string;
    seasonEnd: string;
    gameDays: string;
    regularSeasonGames: string;
  };
  regularSeason?: {
    start: string;
    end: string;
    gameDays: string[];
    totalGames: number;
    format: string;
    notes?: string;
  };
  playoffs?: {
    format: string;
    scenarios?: Array<{
      name: string;
      condition: string;
      games: Array<{
        number: number;
        date: string;
        time: string;
        optional?: boolean;
      }>;
    }>;
    dates?: string;
    note?: string;
  };
  provincial?: {
    format: string;
    scenarios?: Array<{
      name: string;
      condition: string;
      games: Array<{
        number: number;
        date: string;
        time: string;
        optional?: boolean;
      }>;
    }>;
    dates?: string;
    pools?: {
      poolA: string[];
      poolB: string[];
    };
    venues?: string;
    poolRoundNote?: string;
    schedule?: Array<{
      number: number;
      date: string;
      time: string;
      matchup: string;
      venue?: string;
      label?: string;
    }>;
    note?: string;
  };
  national?: {
    title: string;
    dates: string;
    location: string;
  };
  presidentsCup?: {
    dates: string;
    location: string;
    city: string;
    travelDays: string[];
  };
  notes?: string;
}

interface SeasonInfoDisplayProps {
  data: string | any;
}

// ============================================================================
// DATA MIGRATION - Convert legacy format to unified format
// ============================================================================

function migrateToUnified(data: any): UnifiedSeasonInfoData {
  // If already has the new format (drafts array with first item having id), return as-is
  if (data.drafts && Array.isArray(data.drafts) && data.drafts.length > 0 && data.drafts[0].id) {
    return data as UnifiedSeasonInfoData;
  }

  // Start with only metadata, not copying legacy properties
  const unified: UnifiedSeasonInfoData = {
    __metadata: data.__metadata,
  };

  // Migrate drafts (legacy drafts object -> drafts array)
  if (data.drafts && typeof data.drafts === 'object' && !Array.isArray(data.drafts)) {
    const drafts: DraftSection[] = [];
    if (data.drafts.north) {
      drafts.push({
        id: 'north_draft',
        title: data.drafts.north.title || 'North Draft',
        subtitle: data.drafts.north.subtitle,
        date: data.drafts.north.date,
        time: data.drafts.north.time,
        location: data.drafts.north.location,
        notes: data.drafts.north.notes,
        region: 'North',
      });
    }
    if (data.drafts.south) {
      drafts.push({
        id: 'south_draft',
        title: data.drafts.south.title || 'South Draft',
        subtitle: data.drafts.south.subtitle,
        date: data.drafts.south.date,
        time: data.drafts.south.time,
        notes: data.drafts.south.notes,
        region: 'South',
      });
    }
    if (drafts.length > 0) {
      unified.drafts = drafts;
    }
  }

  // Migrate Junior A draft (legacy draft object -> drafts array)
  if (data.draft && typeof data.draft === 'object') {
    unified.drafts = [
      {
        id: 'junior_a_draft',
        title: data.draft.title || 'Junior A Entry Draft',
        details: data.draft.details,
        event: data.draft.event,
        draftOrder: data.draft.draftOrder,
        date: data.draft.event?.date,
        time: data.draft.event?.time,
        location: data.draft.event?.location,
        notes: data.draft.draftEligible,
      },
    ];
  }

  // Migrate regularSeason (legacy regularSeason -> regularSeason array)
  if (data.regularSeason && typeof data.regularSeason === 'object') {
    unified.regularSeason = [
      {
        id: 'regular_season',
        title: 'Regular Season',
        seasonStart: data.regularSeason.start,
        seasonEnd: data.regularSeason.end,
        totalGames: data.regularSeason.totalGames?.toString(),
        format: data.regularSeason.format,
        gameDays: data.regularSeason.gameDays?.join(', '),
        notes: data.regularSeason.notes,
      },
    ];
  }

  // Migrate season (Junior A style season -> regularSeason array)
  if (data.season && typeof data.season === 'object') {
    unified.regularSeason = [
      {
        id: 'junior_a_season',
        title: data.season.title || 'Season',
        seasonStart: data.season.seasonStart,
        seasonEnd: data.season.seasonEnd,
        gameDays: data.season.gameDays,
        totalGames: data.season.regularSeasonGames,
      },
    ];
  }

  // Migrate playoffs (legacy playoffs -> playoffs array)
  if (data.playoffs && typeof data.playoffs === 'object') {
    const playoff: PlayoffSection = {
      id: 'playoffs',
      format: data.playoffs.format,
      dates: data.playoffs.dates,
      note: data.playoffs.note,
    };
    if (data.playoffs.scenarios) {
      playoff.scenarios = data.playoffs.scenarios.map((s: any, idx: number) => ({
        id: `scenario_${idx}`,
        name: s.name,
        condition: s.condition,
        games: s.games.map((g: any, gIdx: number) => ({
          id: `game_${gIdx}`,
          number: g.number,
          date: g.date,
          time: g.time,
          optional: g.optional,
        })),
      }));
    }
    unified.playoffs = [playoff];
  }

  // Migrate provincial (legacy provincial -> provincial array)
  if (data.provincial && typeof data.provincial === 'object') {
    const provincial: ProvincialSection = {
      id: 'provincial',
      format: data.provincial.format,
      formatType: data.provincial.schedule ? 'tournament' : data.provincial.note ? 'simple' : 'scenario',
      dates: data.provincial.dates,
      note: data.provincial.note,
      pools: data.provincial.pools,
      venues: data.provincial.venues,
      poolRoundNote: data.provincial.poolRoundNote,
    };
    if (data.provincial.scenarios) {
      provincial.scenarios = data.provincial.scenarios.map((s: any, idx: number) => ({
        id: `scenario_${idx}`,
        name: s.name,
        condition: s.condition,
        games: s.games.map((g: any, gIdx: number) => ({
          id: `game_${gIdx}`,
          number: g.number,
          date: g.date,
          time: g.time,
          optional: g.optional,
        })),
      }));
    }
    if (data.provincial.schedule) {
      provincial.schedule = data.provincial.schedule.map((g: any, idx: number) => ({
        id: `game_${idx}`,
        number: g.number,
        date: g.date,
        time: g.time,
        matchup: g.matchup,
        venue: g.venue,
        label: g.label,
      }));
    }
    unified.provincial = [provincial];
  }

  // Migrate national (legacy national -> championships array)
  if (data.national && typeof data.national === 'object') {
    unified.championships = [
      {
        id: 'national',
        title: data.national.title || 'National Championship',
        type: 'national',
        dates: data.national.dates,
        location: data.national.location,
      },
    ];
  }

  // Migrate presidentsCup (legacy presidentsCup -> championships array)
  if (data.presidentsCup && typeof data.presidentsCup === 'object') {
    unified.championships = [
      {
        id: 'presidents_cup',
        title: 'Presidents Cup',
        type: 'presidents-cup',
        dates: data.presidentsCup.dates,
        location: data.presidentsCup.location,
        city: data.presidentsCup.city,
        travelDays: data.presidentsCup.travelDays,
      },
    ];
  }

  return unified;
}

// ============================================================================
// DISPLAY COMPONENTS
// ============================================================================

export function SeasonInfoDisplay({ data }: SeasonInfoDisplayProps) {
  let seasonInfo: any;

  // Parse if string, otherwise use as-is
  try {
    seasonInfo = typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    // Fallback to plain text display
    return (
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
          {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  }

  // Check if it's an array of generic sections (title, subtitle, content format)
  if (Array.isArray(seasonInfo)) {
    return (
      <div className="space-y-3">
        {seasonInfo.map((section: any, idx: number) => (
          <Card key={idx} className="border border-gray-200 shadow-sm overflow-hidden">
            <div className={`${
              idx % 2 === 0
                ? 'bg-gradient-to-r from-[#013fac] to-[#0F2942]'
                : 'bg-gradient-to-r from-[#DC2626] to-[#991b1b]'
            } text-white p-2.5`}>
              <h3 className="text-sm uppercase tracking-wide font-bold" style={{ fontFamily: 'var(--font-secondary)' }}>
                {section.title}
              </h3>
              {section.subtitle && (
                <p className="text-xs text-white/80 mt-0.5">{section.subtitle}</p>
              )}
            </div>
            <div className="p-3.5">
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {section.content}
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Migrate legacy data to unified format
  const unified = migrateToUnified(seasonInfo);

  return (
    <div className="space-y-4">
      {/* Drafts Section */}
      {Array.isArray(unified.drafts) && unified.drafts.length > 0 && (
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#013fac] to-[#0F2942] text-white p-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <h3 className="text-sm uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>
                Drafts
              </h3>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.isArray(unified.drafts) && unified.drafts.map((draft, idx) => (
                <div
                  key={draft.id}
                  className={`bg-gray-50 p-4 rounded-lg border-l-4 ${
                    idx % 2 === 0 ? 'border-l-[#013fac]' : 'border-l-[#DC2626]'
                  }`}
                >
                  <h4 className="font-bold text-base text-gray-900 mb-1">
                    {draft.title}
                  </h4>
                  {draft.subtitle && (
                    <p className="text-sm text-gray-600 mb-3">{draft.subtitle}</p>
                  )}
                  <div className="space-y-2 text-sm">
                    {draft.date && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4 text-[#013fac]" />
                        <span>{draft.date}</span>
                      </div>
                    )}
                    {draft.time && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-4 h-4 text-[#013fac]" />
                        <span>{draft.time}</span>
                      </div>
                    )}
                    {draft.location && (
                      <div className="flex items-start gap-2 text-gray-700">
                        <MapPin className="w-4 h-4 text-[#013fac] mt-0.5 flex-shrink-0" />
                        <span>{draft.location}</span>
                      </div>
                    )}
                  </div>
                  {draft.notes && (
                    <p className="text-xs text-gray-600 mt-3 italic border-t border-gray-200 pt-2">
                      {draft.notes}
                    </p>
                  )}

                  {/* Junior A style details */}
                  {draft.details && draft.details.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="space-y-1">
                        {draft.details.map((detail, dIdx) => (
                          <p key={dIdx} className="text-sm text-gray-700">{detail}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Draft Order (Junior A style) */}
            {unified.drafts.some(d => d.draftOrder && d.draftOrder.length > 0) && (
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-l-green-500">
                <h4 className="font-bold text-base text-gray-900 mb-3">Draft Order</h4>
                {unified.drafts.map((draft) => (
                  draft.draftOrder && draft.draftOrder.length > 0 && (
                    <div key={draft.id} className="mb-2">
                      <p className="text-xs font-semibold text-gray-500 mb-1">{draft.title}</p>
                      <div className="space-y-1">
                        {draft.draftOrder.map((order, idx) => (
                          <p key={idx} className="text-sm text-gray-700">{order}</p>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Regular Season Section */}
      {Array.isArray(unified.regularSeason) && unified.regularSeason.length > 0 && (
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#DC2626] to-[#991b1b] text-white p-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <h3 className="text-sm uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>
                Regular Season
              </h3>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {unified.regularSeason.map((season, idx) => (
              <div key={season.id} className={idx > 0 ? 'border-t border-gray-200 pt-4' : ''}>
                {season.title && season.title !== 'Regular Season' && (
                  <h4 className="font-bold text-base text-gray-900 mb-3">{season.title}</h4>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-3">
                      {season.seasonStart && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Season Start</p>
                          <p className="text-base font-semibold text-gray-900">{season.seasonStart}</p>
                        </div>
                      )}
                      {season.seasonEnd && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Season End</p>
                          <p className="text-base font-semibold text-gray-900">{season.seasonEnd}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="space-y-3">
                      {season.totalGames && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Total Games</p>
                          <p className="text-base font-semibold text-gray-900">
                            {season.totalGames} {season.format && `(${season.format})`}
                          </p>
                        </div>
                      )}
                      {season.gameDays && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Game Days</p>
                          <div className="flex flex-wrap gap-1.5">
                            {season.gameDays.split(',').map((day, dIdx) => (
                              <span
                                key={dIdx}
                                className="px-2 py-1 bg-[#DC2626] text-white text-xs font-bold rounded"
                              >
                                {day.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {season.notes && (
                  <p className="text-xs text-gray-600 mt-3 italic border-t border-gray-200 pt-2">
                    {season.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Playoffs Section */}
      {Array.isArray(unified.playoffs) && unified.playoffs.length > 0 && (
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#013fac] to-[#0F2942] text-white p-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              <h3 className="text-sm uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>
                Playoffs
              </h3>
            </div>
            {unified.playoffs[0].format && (
              <p className="text-xs text-white/80 mt-1">{unified.playoffs[0].format}</p>
            )}
          </div>
          <div className="p-4 space-y-4">
            {unified.playoffs.map((playoff, pIdx) => (
              <div key={playoff.id} className={pIdx > 0 ? 'border-t border-gray-200 pt-4' : ''}>
                {playoff.title && playoff.title !== 'Playoffs' && (
                  <h4 className="font-bold text-base text-gray-900 mb-3">{playoff.title}</h4>
                )}

                {/* Scenarios */}
                {playoff.scenarios && playoff.scenarios.length > 0 && (
                  <div className="space-y-3">
                    {playoff.scenarios.map((scenario) => (
                      <div key={scenario.id} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-bold text-base text-gray-900 mb-1">{scenario.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{scenario.condition}</p>
                        <div className="space-y-2">
                          {scenario.games.map((game) => (
                            <div
                              key={game.id}
                              className="flex items-center justify-between py-2 px-3 bg-white rounded border border-gray-200"
                            >
                              <span className="text-sm font-semibold text-gray-900">
                                Game {game.number}{game.optional && ' (if required)'}
                              </span>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>{game.date}</span>
                                <span className="font-semibold text-[#013fac]">{game.time}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Simple dates format */}
                {playoff.dates && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold text-base text-gray-900 mb-3">Playoff Dates</h4>
                    <p className="text-sm text-gray-700">{playoff.dates}</p>
                  </div>
                )}

                {playoff.note && (
                  <p className="text-xs text-gray-600 italic border-t border-gray-200 pt-2">
                    {playoff.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Provincial Section */}
      {Array.isArray(unified.provincial) && unified.provincial.length > 0 && (
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#DC2626] to-[#991b1b] text-white p-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              <h3 className="text-sm uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>
                Provincial Championship
              </h3>
            </div>
            {unified.provincial[0].format && (
              <p className="text-xs text-white/80 mt-1">{unified.provincial[0].format}</p>
            )}
          </div>
          <div className="p-4 space-y-4">
            {unified.provincial.map((provincial, pIdx) => (
              <div key={provincial.id} className={pIdx > 0 ? 'border-t border-gray-200 pt-4' : ''}>
                {provincial.title && provincial.title !== 'Provincial Championship' && (
                  <h4 className="font-bold text-base text-gray-900 mb-3">{provincial.title}</h4>
                )}

                {/* Tournament dates */}
                {provincial.dates && !provincial.schedule && (
                  <div className="bg-blue-50 border-l-4 border-l-[#DC2626] p-4 rounded-lg mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-[#DC2626]" />
                      <h4 className="font-bold text-base text-gray-900">Tournament Dates</h4>
                    </div>
                    <p className="text-sm text-gray-700">{provincial.dates}</p>
                  </div>
                )}

                {/* Pool structure */}
                {provincial.pools && (provincial.pools.poolA?.length > 0 || provincial.pools.poolB?.length > 0) && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-3">
                    <h4 className="font-bold text-base text-gray-900 mb-3">Pool Structure</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {provincial.pools.poolA && provincial.pools.poolA.length > 0 && (
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-sm font-bold text-[#DC2626] mb-2">POOL A</p>
                          <div className="space-y-1">
                            {provincial.pools.poolA.map((team, idx) => (
                              <p key={idx} className="text-sm text-gray-700">• {team}</p>
                            ))}
                          </div>
                        </div>
                      )}
                      {provincial.pools.poolB && provincial.pools.poolB.length > 0 && (
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-sm font-bold text-[#DC2626] mb-2">POOL B</p>
                          <div className="space-y-1">
                            {provincial.pools.poolB.map((team, idx) => (
                              <p key={idx} className="text-sm text-gray-700">• {team}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {provincial.poolRoundNote && (
                      <p className="text-xs text-gray-600 mt-3 italic border-t border-gray-200 pt-2">
                        {provincial.poolRoundNote}
                      </p>
                    )}
                  </div>
                )}

                {/* Venues */}
                {provincial.venues && (
                  <div className="bg-blue-50 border-l-4 border-l-[#DC2626] p-4 rounded-lg mb-3">
                    <div className="flex items-start gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-[#DC2626] mt-0.5 flex-shrink-0" />
                      <h4 className="font-bold text-base text-gray-900">Venues</h4>
                    </div>
                    <p className="text-sm text-gray-700 ml-6">{provincial.venues}</p>
                  </div>
                )}

                {/* Tournament schedule */}
                {provincial.schedule && provincial.schedule.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-3">
                    <h4 className="font-bold text-base text-gray-900 mb-3">Tournament Schedule</h4>
                    <div className="space-y-2">
                      {provincial.schedule.map((game) => (
                        <div
                          key={game.id}
                          className="py-2 px-3 bg-white rounded border border-gray-200"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-bold text-gray-900">Game {game.number}</span>
                              {game.label && (
                                <span className="text-xs font-bold text-[#DC2626] bg-red-50 px-2 py-0.5 rounded">
                                  {game.label}
                                </span>
                              )}
                            </div>
                            <div className="text-right text-sm">
                              <div className="font-semibold text-gray-900">{game.matchup}</div>
                              <div className="text-xs text-gray-600 mt-0.5">
                                {game.date} • <span className="text-[#DC2626] font-semibold">{game.time}</span>
                              </div>
                              {game.venue && (
                                <div className="text-xs text-gray-500 mt-0.5 italic">{game.venue}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scenarios */}
                {provincial.scenarios && provincial.scenarios.length > 0 && (
                  <div className="space-y-3">
                    {provincial.scenarios.map((scenario) => (
                      <div key={scenario.id} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-bold text-base text-gray-900 mb-1">{scenario.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{scenario.condition}</p>
                        <div className="space-y-2">
                          {scenario.games.map((game) => (
                            <div
                              key={game.id}
                              className="flex items-center justify-between py-2 px-3 bg-white rounded border border-gray-200"
                            >
                              <span className="text-sm font-semibold text-gray-900">
                                Game {game.number}{game.optional && ' (if required)'}
                              </span>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>{game.date}</span>
                                <span className="font-semibold text-[#DC2626]">{game.time}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Note */}
                {provincial.note && (
                  <p className="text-xs text-gray-600 italic border-t border-gray-200 pt-2">
                    {provincial.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Championships Section */}
      {Array.isArray(unified.championships) && unified.championships.length > 0 && (
        <>
          {unified.championships.map((champ) => (
            <Card key={champ.id} className="border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-[#013fac] to-[#0F2942] text-white p-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  <h3 className="text-sm uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>
                    {champ.title || (champ.type === 'national' ? 'National Championship' : 'Presidents Cup')}
                  </h3>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-[#013fac] mt-1" />
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Tournament Dates</p>
                      <p className="text-base font-semibold text-gray-900">{champ.dates}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#013fac] mt-1" />
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Location</p>
                      <p className="text-base font-semibold text-gray-900">{champ.location}</p>
                      {champ.city && (
                        <p className="text-sm text-gray-600">{champ.city}</p>
                      )}
                    </div>
                  </div>
                  {champ.travelDays && champ.travelDays.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Travel Days</p>
                      <div className="space-y-1">
                        {champ.travelDays.map((day, idx) => (
                          <p key={idx} className="text-sm text-gray-700">{day}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </>
      )}

      {/* Notes */}
      {unified.notes && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
          <p className="text-sm text-amber-900">
            <span className="font-bold">Note:</span> {unified.notes}
          </p>
        </div>
      )}

      {/* Empty state */}
      {(!Array.isArray(unified.drafts) || unified.drafts.length === 0) &&
       (!Array.isArray(unified.regularSeason) || unified.regularSeason.length === 0) &&
       (!Array.isArray(unified.playoffs) || unified.playoffs.length === 0) &&
       (!Array.isArray(unified.provincial) || unified.provincial.length === 0) &&
       (!Array.isArray(unified.championships) || unified.championships.length === 0) &&
       !unified.notes && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <p className="text-gray-500">No season information available.</p>
        </div>
      )}
    </div>
  );
}