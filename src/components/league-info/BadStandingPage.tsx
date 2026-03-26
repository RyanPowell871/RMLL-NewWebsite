import { AlertTriangle, Calendar, DollarSign } from 'lucide-react';

interface BadStandingEntry {
  date: string;
  sortDate: string;
  player: string;
  team: string;
  feesOwed: string;
}

const BAD_STANDING_LIST: BadStandingEntry[] = [
  { date: '20-Jan-26', sortDate: '2026-01-20', player: 'Sarah Peever', team: 'Capital Region Saints', feesOwed: '2025 Season' },
  { date: '11-Jan-26', sortDate: '2026-01-11', player: 'Tyler Johnson', team: 'Irish Sr. C', feesOwed: '2025 Season' },
  { date: '11-Jan-26', sortDate: '2026-01-11', player: 'Cole Pederson', team: 'Irish Sr. C', feesOwed: '2025 Season' },
  { date: '11-Jan-26', sortDate: '2026-01-11', player: 'Adam Stackard', team: 'Irish Sr. C', feesOwed: '2025 Season' },
  { date: '29-Dec-25', sortDate: '2025-12-29', player: 'Zach Kish', team: 'Pioneers Sr. C', feesOwed: '2025 Season' },
  { date: '21-Dec-25', sortDate: '2025-12-21', player: 'Hunter Cecka', team: 'Crude Tier I', feesOwed: '2025 Season' },
  { date: '21-Dec-25', sortDate: '2025-12-21', player: 'Will Horne', team: 'Crude Tier I', feesOwed: '2024 & 2025 Seasons' },
  { date: '15-Dec-25', sortDate: '2025-12-15', player: 'Declan McLaughlin', team: 'Bandits Tier II', feesOwed: '2025 Season' },
  { date: 'Dec. 13, 2025', sortDate: '2025-12-13', player: 'Jay (JP) Telford', team: 'Bandits Tier II', feesOwed: '2025 Season' },
  { date: 'Dec. 5, 2025', sortDate: '2025-12-05', player: 'Riley Robertson', team: 'Crude Tier II', feesOwed: '2025 Season' },
  { date: 'Jan. 31, 2024', sortDate: '2024-01-31', player: 'Dawson Nielson', team: 'Warriors Sr. C', feesOwed: '2023 Season' },
  { date: '31-Jan-24', sortDate: '2024-01-31', player: 'Karmen Ward', team: 'Warriors Sr. C', feesOwed: '2023 Season' },
  { date: 'Jan. 23, 2024', sortDate: '2024-01-23', player: 'Maculay Brown', team: 'Calgary Irish', feesOwed: '2023 Season' },
  { date: '10-Feb-19', sortDate: '2019-02-10', player: 'Parker Read', team: 'Sabrecats Tier II', feesOwed: '2018 Season' },
  { date: '5-Oct-17', sortDate: '2017-10-05', player: 'Kirsten Kelly', team: 'Capital Region Saints', feesOwed: '2017 Season' },
  { date: 'Jan. 21, 2016', sortDate: '2016-01-21', player: 'Chris Chysyk', team: 'Warriors Sr. B', feesOwed: '2015 Season' },
  { date: 'Aug. 28, 2015', sortDate: '2015-08-28', player: 'Patrick Temple', team: 'Silvertips', feesOwed: '2015 Season' },
  { date: 'Mar. 23, 2015', sortDate: '2015-03-23', player: 'Lochlan Munro', team: 'Tier II Titans', feesOwed: '2014 Season' },
  { date: 'Mar. 7, 2015', sortDate: '2015-03-07', player: 'Patrick Temple', team: 'Shamrocks', feesOwed: '2014 Season' },
  { date: 'Jan. 21, 2015', sortDate: '2015-01-21', player: 'Connor Beagrie', team: 'Barracudas Tier III', feesOwed: '2014 Season' },
  { date: 'Jan. 21, 2015', sortDate: '2015-01-21', player: 'Serge Archambault', team: 'Barracudas Tier III', feesOwed: '2014 Season' },
  { date: 'Dec. 8, 2014', sortDate: '2014-12-08', player: 'David Ahl', team: 'Slash', feesOwed: '2014 Season' },
  { date: '29-Jul-13', sortDate: '2013-07-29', player: 'Yasmin Dhanoo', team: 'Saints', feesOwed: '2013 Season' },
];

const LAST_UPDATED = 'March 13, 2026';

export function BadStandingPage() {
  return (
    <div>
      {/* Warning banner */}
      <div className="not-prose mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-800 mb-1">Players in Bad Standing</p>
            <p className="text-sm text-red-700">
              Players listed below are in "bad standing" with the RMLL due to outstanding fees owed. As per RMLL regulations,
              players in bad standing are not permitted to participate in voting, drafts, or games until all monies owing are resolved.
            </p>
          </div>
        </div>
      </div>

      <div className="not-prose mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Calendar className="w-4 h-4" />
        <span>Last updated: <strong className="text-gray-700">{LAST_UPDATED}</strong></span>
        <span className="mx-2 text-gray-300">|</span>
        <DollarSign className="w-4 h-4" />
        <span><strong className="text-gray-700">{BAD_STANDING_LIST.length}</strong> entries</span>
      </div>

      {/* Table */}
      <div className="not-prose overflow-x-auto rounded-lg border border-gray-200 shadow-sm hidden sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#8B4513] text-white">
              <th className="text-left px-3 py-2.5 font-bold whitespace-nowrap">Date</th>
              <th className="text-left px-3 py-2.5 font-bold whitespace-nowrap">Player</th>
              <th className="text-left px-3 py-2.5 font-bold whitespace-nowrap">Team</th>
              <th className="text-left px-3 py-2.5 font-bold whitespace-nowrap">Fees Owed</th>
            </tr>
          </thead>
          <tbody>
            {BAD_STANDING_LIST.map((entry, i) => (
              <tr
                key={`${entry.player}-${entry.sortDate}-${i}`}
                className={`border-t border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50/50 transition-colors`}
              >
                <td className="px-3 py-2 whitespace-nowrap text-gray-600">{entry.date}</td>
                <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{entry.player}</td>
                <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{entry.team}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                    {entry.feesOwed}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="not-prose sm:hidden space-y-2">
        {BAD_STANDING_LIST.map((entry, i) => (
          <div
            key={`mobile-${entry.player}-${entry.sortDate}-${i}`}
            className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="font-bold text-gray-900 text-sm">{entry.player}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800 shrink-0">
                {entry.feesOwed}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{entry.team}</span>
              <span className="text-gray-300">•</span>
              <span>{entry.date}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Regulation reference */}
      <div className="not-prose mt-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">RMLL Regulation Reference</p>
          <p className="text-sm text-gray-700">
            As per RMLL Schedule 11 (Fine Schedule): <em>"Monies owing to RMLL"</em> results in <strong>"Bad standing"</strong> — 
            no voting, no drafts, no games. Players must resolve all outstanding fees with their Franchise to be removed from this list.
          </p>
        </div>
      </div>
    </div>
  );
}