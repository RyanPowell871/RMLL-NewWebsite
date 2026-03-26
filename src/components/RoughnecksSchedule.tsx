import { useState } from 'react';
import { ExternalLink, Calendar, AlertTriangle, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import roughnecksLogo from 'figma:asset/a13f64a2ada652455c1f298f88b3c777f1e9dc14.png';

const ROUGHNECKS_URL = 'https://www.calgaryroughnecks.com/schedule/';
const ROUGHNECKS_RED = '#CE1126';
const ROUGHNECKS_BLACK = '#1A1A1A';

// 2025-26 NLL season — remaining schedule as of Feb 26, 2026
const SCHEDULE_GAMES = [
  { date: 'Sat, Feb 28', time: '7:00 PM', opponent: 'Halifax Thunderbirds', home: true, theme: 'Superhero Party' },
  { date: 'Sun, Mar 8', time: '1:00 PM', opponent: 'Rochester Knighthawks', home: false },
  { date: 'Sat, Mar 14', time: '7:00 PM', opponent: 'Ottawa Black Bears', home: true, theme: "St. Patrick's Day Party" },
  { date: 'Sat, Mar 21', time: '7:00 PM', opponent: 'Colorado Mammoth', home: false },
  { date: 'Sat, Mar 28', time: '7:00 PM', opponent: 'Las Vegas Desert Dogs', home: false },
  { date: 'Sat, Apr 4', time: '7:00 PM', opponent: 'Oshawa Firewolves', home: true, theme: 'Tiki Party' },
  { date: 'Sat, Apr 11', time: '7:00 PM', opponent: 'Oshawa Firewolves', home: false },
  { date: 'Sat, Apr 18', time: '7:00 PM', opponent: 'Colorado Mammoth', home: true, theme: 'Roughnecks Rodeo' },
];

export function RoughnecksSchedule() {
  const [showAll, setShowAll] = useState(false);

  const displayGames = showAll ? SCHEDULE_GAMES : SCHEDULE_GAMES.slice(0, 6);

  return (
    <section className="bg-gradient-to-b from-gray-900 via-gray-900 to-black py-10 sm:py-14 lg:py-16 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 opacity-[0.04]">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1740906793007-692710a640a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYWNyb3NzZSUyMGFyZW5hJTIwaW5kb29yJTIwc3RhZGl1bXxlbnwxfHx8fDE3NzIwOTI3NTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      {/* Red accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: ROUGHNECKS_RED }}></div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            {/* Roughnecks Logo Placeholder */}
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center shadow-lg border border-white/10 shrink-0 overflow-hidden bg-white p-1"
            >
              <img src={roughnecksLogo} alt="Calgary Roughnecks" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl text-white font-bold tracking-tight">
                Calgary Roughnecks
              </h2>
              <p className="text-gray-400 text-sm font-semibold mt-0.5">
                2025-26 NLL Season Schedule
              </p>
              <div className="h-1 w-16 rounded mt-2" style={{ backgroundColor: ROUGHNECKS_RED }}></div>
            </div>
          </div>
          <a
            href={ROUGHNECKS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-4 py-2.5 text-white rounded font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
            style={{ backgroundColor: ROUGHNECKS_RED }}
          >
            <Calendar className="w-4 h-4" />
            Full Schedule & Tickets
            <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>

        {/* Schedule Table */}
        <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 sm:px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/10"
               style={{ backgroundColor: 'rgba(206, 17, 38, 0.08)' }}>
            <div className="col-span-3">Date</div>
            <div className="col-span-1 text-center">Time</div>
            <div className="col-span-3">Matchup</div>
            <div className="col-span-1 text-center">H/A</div>
            <div className="col-span-4">Theme / Notes</div>
          </div>

          {/* Game Rows */}
          <div className="divide-y divide-white/5">
            {displayGames.map((game, idx) => (
              <div
                key={idx}
                className="group grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2 px-4 sm:px-6 py-3 sm:py-3.5 hover:bg-white/[0.04] transition-colors items-center"
              >
                {/* Date */}
                <div className="sm:col-span-3 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0 hidden sm:block" />
                  <span className="text-white font-semibold text-sm">{game.date}</span>
                </div>

                {/* Time */}
                <div className="sm:col-span-1 text-center">
                  <span className="text-gray-400 text-sm font-medium">{game.time}</span>
                </div>

                {/* Opponent */}
                <div className="sm:col-span-3 flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: game.home ? '#fff' : '#9ca3af' }}>
                    {game.home ? 'vs' : '@'}{' '}
                  </span>
                  <span className="text-white text-sm font-bold">{game.opponent}</span>
                </div>

                {/* Home/Away Badge */}
                <div className="sm:col-span-1 text-center hidden sm:block">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      game.home
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    {game.home ? 'Home' : 'Away'}
                  </span>
                </div>

                {/* Theme / Notes */}
                <div className="sm:col-span-4">
                  {game.theme ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-600/20 to-orange-500/20 text-orange-300 border border-orange-500/30">
                      <span className="text-[10px]">🎉</span>
                      {game.theme}
                    </span>
                  ) : (
                    <span className="text-gray-600 text-xs sm:text-sm italic">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Show More / Show Less */}
          {SCHEDULE_GAMES.length > 6 && (
            <div className="border-t border-white/10 px-6 py-3">
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold transition-colors hover:text-white"
                style={{ color: ROUGHNECKS_RED }}
              >
                {showAll ? 'Show Less' : `Show All ${SCHEDULE_GAMES.length} Games`}
                <ChevronRight className={`w-4 h-4 transition-transform ${showAll ? '-rotate-90' : 'rotate-90'}`} />
              </button>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-4 flex items-start gap-2 text-gray-500 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p>
            Schedule is approximate and subject to change. Visit{' '}
            <a href={ROUGHNECKS_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-300 transition-colors">
              calgaryroughnecks.com
            </a>{' '}
            for official game times, ticket information, and broadcast details.
          </p>
        </div>
      </div>
    </section>
  );
}