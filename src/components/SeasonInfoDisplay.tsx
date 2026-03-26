import React from 'react';
import { Calendar, MapPin, Trophy, Users, Clock } from 'lucide-react';
import { Card } from './ui/card';

interface SeasonInfoData {
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
  // Junior A draft structure
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
  // Junior A season structure
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
    // Senior B/C style with scenarios
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
    // Junior A style with dates
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
    // Senior C tournament style
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
    // Junior A style
    note?: string;
  };
  // Junior A national championship
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
  data: string | SeasonInfoData;
}

export function SeasonInfoDisplay({ data }: SeasonInfoDisplayProps) {
  let seasonInfo: SeasonInfoData | any;

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
        {seasonInfo.map((section, idx) => (
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

  return (
    <div className="space-y-4">
      {/* Drafts Section */}
      {seasonInfo.drafts && (
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#013fac] to-[#0F2942] text-white p-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <h3 className="text-sm uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>
                Graduating Junior Draft
              </h3>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* North Draft */}
              {seasonInfo.drafts.north && (
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-l-[#013fac]">
                  <h4 className="font-bold text-base text-gray-900 mb-1">
                    {seasonInfo.drafts.north.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">{seasonInfo.drafts.north.subtitle}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-[#013fac]" />
                      <span>{seasonInfo.drafts.north.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4 text-[#013fac]" />
                      <span>{seasonInfo.drafts.north.time}</span>
                    </div>
                    {seasonInfo.drafts.north.location && (
                      <div className="flex items-start gap-2 text-gray-700">
                        <MapPin className="w-4 h-4 text-[#013fac] mt-0.5 flex-shrink-0" />
                        <span>{seasonInfo.drafts.north.location}</span>
                      </div>
                    )}
                  </div>
                  {seasonInfo.drafts.north.notes && (
                    <p className="text-xs text-gray-600 mt-3 italic border-t border-gray-200 pt-2">
                      {seasonInfo.drafts.north.notes}
                    </p>
                  )}
                </div>
              )}

              {/* South Draft */}
              {seasonInfo.drafts.south && (
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-l-[#DC2626]">
                  <h4 className="font-bold text-base text-gray-900 mb-1">
                    {seasonInfo.drafts.south.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">{seasonInfo.drafts.south.subtitle}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-[#DC2626]" />
                      <span>{seasonInfo.drafts.south.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4 text-[#DC2626]" />
                      <span>{seasonInfo.drafts.south.time}</span>
                    </div>
                  </div>
                  {seasonInfo.drafts.south.notes && (
                    <p className="text-xs text-gray-600 mt-3 italic border-t border-gray-200 pt-2">
                      {seasonInfo.drafts.south.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Junior A Draft Section */}
      {seasonInfo.draft && (
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#013fac] to-[#0F2942] text-white p-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <h3 className="text-sm uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>
                Junior A Draft
              </h3>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Draft Details */}
              {seasonInfo.draft.details && (
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-l-[#013fac]">
                  <h4 className="font-bold text-base text-gray-900 mb-1">
                    {seasonInfo.draft.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">{seasonInfo.draft.draftEligible}</p>
                  <div className="space-y-2 text-sm">
                    {seasonInfo.draft.details.map((detail, idx) => (
                      <p key={idx} className="text-sm text-gray-700">{detail}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Draft Event */}
              {seasonInfo.draft.event && (
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-l-[#DC2626]">
                  <h4 className="font-bold text-base text-gray-900 mb-1">
                    {seasonInfo.draft.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">{seasonInfo.draft.draftEligible}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-[#DC2626]" />
                      <span>{seasonInfo.draft.event.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4 text-[#DC2626]" />
                      <span>{seasonInfo.draft.event.time}</span>
                    </div>
                    {seasonInfo.draft.event.location && (
                      <div className="flex items-start gap-2 text-gray-700">
                        <MapPin className="w-4 h-4 text-[#DC2626] mt-0.5 flex-shrink-0" />
                        <span>{seasonInfo.draft.event.location}</span>
                      </div>
                    )}
                    {seasonInfo.draft.event.note && (
                      <p className="text-xs text-gray-600 mt-3 italic border-t border-gray-200 pt-2">
                        {seasonInfo.draft.event.note}
                      </p>
                    )}
                    {seasonInfo.draft.event.social && (
                      <p className="text-xs text-gray-600 mt-3 italic border-t border-gray-200 pt-2">
                        {seasonInfo.draft.event.social}
                      </p>
                    )}
                    {seasonInfo.draft.event.virtual && (
                      <p className="text-xs text-gray-600 mt-3 italic border-t border-gray-200 pt-2">
                        {seasonInfo.draft.event.virtual}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Draft Order */}
            {seasonInfo.draft.draftOrder && (
              <div className="bg-gray-50 p-4 rounded-lg mt-4 border-l-4 border-l-green-500">
                <h4 className="font-bold text-base text-gray-900 mb-3">Draft Order</h4>
                <div className="space-y-1">
                  {seasonInfo.draft.draftOrder.map((order, idx) => (
                    <p key={idx} className="text-sm text-gray-700">{order}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Junior A Season Section */}
      {seasonInfo.season && (
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#DC2626] to-[#991b1b] text-white p-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <h3 className="text-sm uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>
                Junior A Season
              </h3>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Season Start</p>
                    <p className="text-base font-semibold text-gray-900">{seasonInfo.season.seasonStart}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Season End</p>
                    <p className="text-base font-semibold text-gray-900">{seasonInfo.season.seasonEnd}</p>
                  </div>
                </div>
              </div>
              <div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Total Games</p>
                    <p className="text-base font-semibold text-gray-900">
                      {seasonInfo.season.regularSeasonGames} games ({seasonInfo.season.gameDays})
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Regular Season Section */}
      {seasonInfo.regularSeason && (
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#DC2626] to-[#991b1b] text-white p-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <h3 className="text-sm uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>
                Regular Season
              </h3>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Season Start</p>
                    <p className="text-base font-semibold text-gray-900">{seasonInfo.regularSeason.start}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Season End</p>
                    <p className="text-base font-semibold text-gray-900">{seasonInfo.regularSeason.end}</p>
                  </div>
                </div>
              </div>
              <div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Total Games</p>
                    <p className="text-base font-semibold text-gray-900">
                      {seasonInfo.regularSeason.totalGames} games ({seasonInfo.regularSeason.format})
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Game Days</p>
                    <div className="flex flex-wrap gap-1.5">
                      {seasonInfo.regularSeason.gameDays.map((day) => (
                        <span
                          key={day}
                          className="px-2 py-1 bg-[#DC2626] text-white text-xs font-bold rounded"
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {seasonInfo.regularSeason.notes && (
              <p className="text-xs text-gray-600 mt-3 italic border-t border-gray-200 pt-2">
                {seasonInfo.regularSeason.notes}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Playoffs Section */}
      {seasonInfo.playoffs && (
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#013fac] to-[#0F2942] text-white p-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              <h3 className="text-sm uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>
                Playoffs
              </h3>
            </div>
            <p className="text-xs text-white/80 mt-1">{seasonInfo.playoffs.format}</p>
          </div>
          <div className="p-4 space-y-3">
            {seasonInfo.playoffs.scenarios && seasonInfo.playoffs.scenarios.map((scenario, idx) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-base text-gray-900 mb-1">{scenario.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{scenario.condition}</p>
                <div className="space-y-2">
                  {scenario.games.map((game) => (
                    <div
                      key={game.number}
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

            {/* Junior A style with dates */}
            {seasonInfo.playoffs.dates && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-base text-gray-900 mb-3">Playoff Dates</h4>
                <p className="text-sm text-gray-700">{seasonInfo.playoffs.dates}</p>
                {seasonInfo.playoffs.note && (
                  <p className="text-xs text-gray-600 mt-3 italic border-t border-gray-200 pt-2">
                    {seasonInfo.playoffs.note}
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Provincial Section */}
      {seasonInfo.provincial && (
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#DC2626] to-[#991b1b] text-white p-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              <h3 className="text-sm uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>
                Provincial Championship
              </h3>
            </div>
            <p className="text-xs text-white/80 mt-1">{seasonInfo.provincial.format}</p>
          </div>
          <div className="p-4 space-y-3">
            {seasonInfo.provincial.scenarios && seasonInfo.provincial.scenarios.map((scenario, idx) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-base text-gray-900 mb-1">{scenario.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{scenario.condition}</p>
                <div className="space-y-2">
                  {scenario.games.map((game) => (
                    <div
                      key={game.number}
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

            {/* Senior C tournament style */}
            {seasonInfo.provincial.schedule && (
              <>
                {seasonInfo.provincial.dates && (
                  <div className="bg-blue-50 border-l-4 border-l-[#DC2626] p-4 rounded-lg mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-[#DC2626]" />
                      <h4 className="font-bold text-base text-gray-900">Tournament Dates</h4>
                    </div>
                    <p className="text-sm text-gray-700">{seasonInfo.provincial.dates}</p>
                  </div>
                )}

                {seasonInfo.provincial.pools && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-3">
                    <h4 className="font-bold text-base text-gray-900 mb-3">Pool Structure</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-sm font-bold text-[#DC2626] mb-2">POOL A</p>
                        <div className="space-y-1">
                          {seasonInfo.provincial.pools.poolA.map((team, idx) => (
                            <p key={idx} className="text-sm text-gray-700">• {team}</p>
                          ))}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-sm font-bold text-[#DC2626] mb-2">POOL B</p>
                        <div className="space-y-1">
                          {seasonInfo.provincial.pools.poolB.map((team, idx) => (
                            <p key={idx} className="text-sm text-gray-700">• {team}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                    {seasonInfo.provincial.poolRoundNote && (
                      <p className="text-xs text-gray-600 mt-3 italic border-t border-gray-200 pt-2">
                        {seasonInfo.provincial.poolRoundNote}
                      </p>
                    )}
                  </div>
                )}

                {seasonInfo.provincial.venues && (
                  <div className="bg-blue-50 border-l-4 border-l-[#DC2626] p-4 rounded-lg mb-3">
                    <div className="flex items-start gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-[#DC2626] mt-0.5 flex-shrink-0" />
                      <h4 className="font-bold text-base text-gray-900">Venues</h4>
                    </div>
                    <p className="text-sm text-gray-700 ml-6">{seasonInfo.provincial.venues}</p>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold text-base text-gray-900 mb-3">Tournament Schedule</h4>
                  <div className="space-y-2">
                    {seasonInfo.provincial.schedule.map((game) => (
                      <div
                        key={game.number}
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
              </>
            )}

            {/* Junior A style */}
            {seasonInfo.provincial.note && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-base text-gray-900 mb-3">Provincial Notes</h4>
                <p className="text-sm text-gray-700">{seasonInfo.provincial.note}</p>
              </div>
            )}
            
            {/* Junior A style dates without schedule */}
            {seasonInfo.provincial.dates && !seasonInfo.provincial.schedule && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-base text-gray-900 mb-3">Provincial Dates</h4>
                <p className="text-sm text-gray-700">{seasonInfo.provincial.dates}</p>
                {seasonInfo.provincial.note && (
                  <p className="text-xs text-gray-600 mt-3 italic border-t border-gray-200 pt-2">
                    {seasonInfo.provincial.note}
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Junior A National Championship Section */}
      {seasonInfo.national && (
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#013fac] to-[#0F2942] text-white p-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              <h3 className="text-sm uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>
                National Championship
              </h3>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-[#013fac] mt-1" />
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Tournament Dates</p>
                  <p className="text-base font-semibold text-gray-900">{seasonInfo.national.dates}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#013fac] mt-1" />
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Location</p>
                  <p className="text-base font-semibold text-gray-900">{seasonInfo.national.location}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Presidents Cup Section */}
      {seasonInfo.presidentsCup && (
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#013fac] to-[#0F2942] text-white p-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              <h3 className="text-sm uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>
                Presidents Cup
              </h3>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-[#013fac] mt-1" />
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Tournament Dates</p>
                  <p className="text-base font-semibold text-gray-900">{seasonInfo.presidentsCup.dates}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#013fac] mt-1" />
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Location</p>
                  <p className="text-base font-semibold text-gray-900">{seasonInfo.presidentsCup.location}</p>
                  <p className="text-sm text-gray-600">{seasonInfo.presidentsCup.city}</p>
                </div>
              </div>
              {seasonInfo.presidentsCup.travelDays && seasonInfo.presidentsCup.travelDays.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Travel Days</p>
                  <div className="space-y-1">
                    {seasonInfo.presidentsCup.travelDays.map((day, idx) => (
                      <p key={idx} className="text-sm text-gray-700">{day}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Notes */}
      {seasonInfo.notes && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
          <p className="text-sm text-amber-900">
            <span className="font-bold">Note:</span> {seasonInfo.notes}
          </p>
        </div>
      )}
    </div>
  );
}