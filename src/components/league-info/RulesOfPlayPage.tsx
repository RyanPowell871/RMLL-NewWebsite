import { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, List, AlertTriangle, Info } from 'lucide-react';

/* ─── Reusable UI ─── */

function Section({ id, title, children, open, onToggle }: { id: string; title: string; children: React.ReactNode; open: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm" id={`rop-${id}`}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 bg-white hover:bg-gray-50 transition-colors text-left">
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-[#013fac] text-white text-xs font-bold shrink-0">{id}</span>
        <span className="flex-1 font-bold text-gray-900 text-sm sm:text-base">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && <div className="px-4 sm:px-5 pb-5 pt-2 bg-white border-t border-gray-100 text-sm text-gray-700 leading-relaxed space-y-3">{children}</div>}
    </div>
  );
}

function GroupHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mt-6 mb-3 first:mt-0">
      <div className="h-0.5 flex-1 bg-gradient-to-r from-[#013fac] to-transparent"></div>
      <h3 className="text-sm font-bold text-[#013fac] uppercase tracking-wider whitespace-nowrap">{title}</h3>
      <div className="h-0.5 flex-1 bg-gradient-to-l from-[#013fac] to-transparent"></div>
    </div>
  );
}

function Note({ children, type = 'info' }: { children: React.ReactNode; type?: 'info' | 'warning' | 'important' }) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    important: 'bg-red-50 border-red-200 text-red-800',
  };
  const icons = {
    info: <Info className="w-4 h-4 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />,
    important: <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />,
  };
  return (
    <div className={`flex gap-2 p-3 rounded-lg border text-sm ${styles[type]}`}>
      {icons[type]}
      <div>{children}</div>
    </div>
  );
}

/* ─── Penalty Situation Table Row ─── */
interface PenaltySituation {
  num: number | string;
  teamA: string;
  teamB: string;
  floor: string;
  resolution: string;
  notes?: string;
}

function SituationTable({ situations, title }: { situations: PenaltySituation[]; title?: string }) {
  return (
    <div className="space-y-2">
      {title && <h4 className="font-bold text-gray-900 text-sm">{title}</h4>}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-full text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-[#013fac] text-white">
              <th className="px-2 py-2 text-left font-bold border border-blue-800 w-12">#</th>
              <th className="px-2 py-2 text-left font-bold border border-blue-800">Team "A"</th>
              <th className="px-2 py-2 text-left font-bold border border-blue-800">Team "B"</th>
              <th className="px-2 py-2 text-left font-bold border border-blue-800 w-20">Floor</th>
              <th className="px-2 py-2 text-left font-bold border border-blue-800">Resolution / Notes</th>
            </tr>
          </thead>
          <tbody>
            {situations.map((s, i) => (
              <tr key={s.num} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-2 py-2 font-bold text-[#013fac] border border-gray-200 align-top">{s.num}</td>
                <td className="px-2 py-2 border border-gray-200 align-top whitespace-pre-line">{s.teamA}</td>
                <td className="px-2 py-2 border border-gray-200 align-top whitespace-pre-line">{s.teamB}</td>
                <td className="px-2 py-2 border border-gray-200 align-top font-mono text-center">{s.floor}</td>
                <td className="px-2 py-2 border border-gray-200 align-top whitespace-pre-line">
                  {s.resolution}
                  {s.notes && <div className="mt-1 text-xs italic text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">{s.notes}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */

export function RulesOfPlayPage() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [showTOC, setShowTOC] = useState(false);

  const toggle = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allSectionIds = [
    'intro', 'special-note', '4sec', '8sec', 'faceoffs', 'faceoff-mechanic',
    'delayed-penalty', 'coincidental', '4on4', 'multiple-penalties',
    'over-and-back', 'illegal-sub', 'fast-restarts', 'in-homes',
    'penalty-admin', 'crease-play', 'nets', 'jewelry', 'illegal-equip',
    'delay-of-game', 'possession', 'signals',
    'app-intro', 'sit-1-3', 'sit-5-12', 'sit-13-23', 'sit-24-33', 'sit-34-43', 'sit-44-50', 'sit-51-58', 'sit-59-64'
  ];

  const expandAll = () => setOpenSections(new Set(allSectionIds));
  const collapseAll = () => setOpenSections(new Set());

  const TOC_ITEMS = [
    { group: 'Rules & Procedure Package', items: [
      { id: 'intro', label: 'Introduction' },
      { id: 'special-note', label: 'Special Note — Crease Dives' },
    ]},
    { group: '2024 Rule Modifications', items: [
      { id: '4sec', label: '4-Second Count' },
      { id: '8sec', label: '8-Second Count' },
      { id: 'faceoffs', label: 'Face-offs & Restraining Lines' },
      { id: 'faceoff-mechanic', label: 'Face-off Mechanic' },
      { id: 'delayed-penalty', label: 'Delayed Penalty Mechanic' },
      { id: 'coincidental', label: 'Coincidental Penalties' },
      { id: '4on4', label: '4-on-4 after Coincidental Penalties' },
      { id: 'multiple-penalties', label: 'Multiple Penalties' },
      { id: 'over-and-back', label: 'Over and Back / Back Over' },
      { id: 'illegal-sub', label: 'Illegal Substitution' },
      { id: 'fast-restarts', label: 'Fast Restarts' },
      { id: 'in-homes', label: 'In-Homes' },
      { id: 'penalty-admin', label: 'Penalty Administration' },
    ]},
    { group: 'Additional Rules & Clarifications', items: [
      { id: 'crease-play', label: 'Crease-Play' },
      { id: 'nets', label: 'Position of Nets' },
      { id: 'jewelry', label: 'Jewelry' },
      { id: 'illegal-equip', label: 'Illegal Equipment' },
      { id: 'delay-of-game', label: 'Delay of Game' },
      { id: 'possession', label: 'NLL Possession Rules' },
      { id: 'signals', label: 'Signals' },
    ]},
    { group: 'Appendix A — Penalty Situations', items: [
      { id: 'app-intro', label: 'Appendix Introduction & RMLL Updates' },
      { id: 'sit-1-3', label: 'Situations 1–3, 15b' },
      { id: 'sit-5-12', label: 'Situations 5–12' },
      { id: 'sit-13-23', label: 'Situations 13–23' },
      { id: 'sit-24-33', label: 'Situations 24–33' },
      { id: 'sit-34-43', label: 'Situations 34–43' },
      { id: 'sit-44-50', label: 'Situations 44–50' },
      { id: 'sit-51-58', label: 'Situations 51–58' },
      { id: 'sit-59-64', label: 'Situations 59–64' },
    ]},
  ];

  /* ─── Penalty Situations Data ─── */

  const situations1to3: PenaltySituation[] = [
    {
      num: 1,
      teamA: '2 min minor (Player #1)',
      teamB: '—',
      floor: '5-on-4',
      resolution: 'Team A short-handed. If Team B scores, Player #1 is released.',
    },
    {
      num: 2,
      teamA: '2 min minor (Player #1)\n2 min minor (Player #2)',
      teamB: '—',
      floor: '5-on-3',
      resolution: 'Player #1 serves first (least time, first in first out). If Team B scores, Player #1 released. If second goal, Player #2 released.',
    },
    {
      num: 3,
      teamA: '2 min minor (Player #1)',
      teamB: '2 min minor (Player #3)',
      floor: '4-on-4',
      resolution: 'Coincidental minors — cancel. Both players serve penalty time but teams play at full strength with substitutes. Players released at goal, penalty, time-out, or end of period upon expiration.',
    },
    {
      num: '15b',
      teamA: '2 min minor (Player #1)',
      teamB: '2 min minor (Player #3)',
      floor: '4-on-4',
      resolution: 'Single minor to each team at same stoppage with no other penalties — 4-on-4 with minor on clock as time-served penalty. Players released upon expiration of penalty time. Consistent with current LC rules.',
    },
  ];

  const situations5to12: PenaltySituation[] = [
    {
      num: 5,
      teamA: '5 min major (Player #1)',
      teamB: '—',
      floor: '5-on-4',
      resolution: 'Team A short-handed. Goals do NOT release Player #1 — major served in entirety. Player released after 5 min.',
    },
    {
      num: 6,
      teamA: '2 min minor (Player #1)\n5 min major (Player #2)',
      teamB: '—',
      floor: '5-on-3',
      resolution: 'Player #1 (minor) serves first. If goal scored on Team A, Player #1 released. Player #2 serves full 5 min major regardless of goals.',
      notes: 'If one player gets a 2+5 min penalty, minor served first.',
    },
    {
      num: 7,
      teamA: '2 min minor (Player #1)',
      teamB: '—',
      floor: '5-on-4',
      resolution: 'Goal scored during delayed penalty on Team B. Player #1 penalty goes on clock. Rule 37.2 — "roll the box." Minor still on clock.',
      notes: 'When goal scored on delay and penalty being served, "roll the box."',
    },
    {
      num: 8,
      teamA: '5 min major (Player #1)',
      teamB: '—',
      floor: '5-on-4',
      resolution: 'Goal scored on Team A during major. Major continues — served in entirety.',
      notes: 'Once a goal comes off a major penalty, next powerplay goal counts against the major.',
    },
    {
      num: 9,
      teamA: '2+5 min (Player #1)',
      teamB: '—',
      floor: '5-on-4',
      resolution: 'Minor served first. If goal scored, minor is cancelled, major starts. Player serves remainder of major after minor expires or is cancelled by goal.',
    },
    {
      num: 10,
      teamA: '5 min major (Player #1)',
      teamB: '5 min major (Player #3)',
      floor: '4-on-4',
      resolution: 'Coincidental majors. Both players serve full 5 min. Teams play at full strength with substitutes from bench.',
    },
    {
      num: 11,
      teamA: '5 min major (Player #1)\n2 min minor (Player #2)',
      teamB: '5 min major (Player #3)',
      floor: '5-on-4\nthen 4-on-4',
      resolution: 'Coincidental majors cancel for floor strength. Team A has additional minor (Player #2) — 5-on-4 for 2 min. After minor expires/goal, returns to 4-on-4 (or 5-on-5 once majors expire).',
    },
    {
      num: 12,
      teamA: '2 min minor (Player #1)\n2 min minor (Player #2)',
      teamB: '2 min minor (Player #3)',
      floor: '5-on-4',
      resolution: 'One coincidental minor pair cancels (Player #1 vs Player #3). Team A still has Player #2\'s minor — 5-on-4. If goal scored on Team A, Player #2 released.',
    },
  ];

  const situations13to23: PenaltySituation[] = [
    {
      num: 13,
      teamA: '10 min misconduct (Player #1)',
      teamB: '—',
      floor: '5-on-5',
      resolution: 'Misconduct does not affect floor strength. Player #1 sits 10 min. Substitute allowed. If GM (Game Misconduct), player ejected for remainder of game.',
    },
    {
      num: 15,
      teamA: '2 min minor (Player #1)\n10 min misconduct (Player #1)',
      teamB: '—',
      floor: '5-on-4',
      resolution: 'Minor affects floor strength. Player #1 serves both — minor first, then misconduct. In-Home or designated player may serve the minor portion. After minor expires (or goal), misconduct begins.',
    },
    {
      num: 16,
      teamA: '2 min minor (Player #1)',
      teamB: '2 min minor (Player #3)\n10 min misconduct (Player #3)',
      floor: '4-on-4\nthen 5-on-4',
      resolution: 'Coincidental minors cancel for floor strength. Player #3 still serves 10 min misconduct after minor time. Team B short-handed for misconduct? No — misconduct doesn\'t affect floor strength.',
    },
    {
      num: 17,
      teamA: '—',
      teamB: '2 min minor (Player #3, Goalie)',
      floor: '5-on-4',
      resolution: 'Goalie minor — In-Home or designated player serves the penalty. Goalie remains in net. Team B short-handed.',
    },
    {
      num: 18,
      teamA: '5 min major (Player #1)',
      teamB: '5 min major (Player #3)\n2 min minor (Player #4)',
      floor: '4-on-4\nthen 5-on-4',
      resolution: 'Coincidental majors cancel for floor strength. Team B has additional minor (Player #4). Team A on power play 5-on-4 for Player #4\'s minor.',
    },
    {
      num: 19,
      teamA: '2 min minor (Player #1)',
      teamB: '—',
      floor: '5-on-4\n(delayed)',
      resolution: 'Delayed penalty signaled against Team A. Play continues until completion of play. Team A cannot score during delay. If Team B scores during delay, penalty still assessed.',
    },
    {
      num: 20,
      teamA: '2 min minor (Player #1)\n2 min minor (Player #2, on delay)',
      teamB: '—',
      floor: '5-on-3',
      resolution: 'First penalty being served. Second penalty called on delay. Both go on clock at stoppage. Player #1 serves first, then Player #2.',
    },
    {
      num: 21,
      teamA: '2 min minor (Player #1, on delay)',
      teamB: '2 min minor (Player #3, on delay)',
      floor: '4-on-4',
      resolution: 'Both penalties called on same delayed stoppage. Coincidental — cancel for floor strength. Both serve time, substitutes allowed.',
    },
    {
      num: 22,
      teamA: '2 min minor (Player #1)\n5 min major + GM (Player #2)',
      teamB: '—',
      floor: '5-on-3',
      resolution: 'Player #2 ejected (Game Misconduct). Major served by In-Home or designated player. Team A short 2 players. Minor served first (Player #1), major in entirety.',
    },
    {
      num: 23,
      teamA: '5 min match penalty (Player #1)',
      teamB: '—',
      floor: '5-on-4',
      resolution: 'Match penalty = player ejected + automatic review. In RMLL LC play, match penalties end after 2 goals scored against (not served in entirety like regular majors). Served by In-Home.',
    },
  ];

  const situations24to33: PenaltySituation[] = [
    {
      num: 24,
      teamA: '2 min minor (Player #1, serving)\n2 min minor (Player #2, delayed)',
      teamB: '—',
      floor: '5-on-4\nthen 5-on-3',
      resolution: 'Player #1 already serving. Player #2 penalty on delay. At stoppage, Player #2\'s penalty goes on clock. Floor goes 5-on-3. Rule 37.2 applies — if goal scored, Player #1 released first (least time).',
    },
    {
      num: 25,
      teamA: '2 min minor (Player #1)\n5 min major (Player #2)',
      teamB: '2 min minor (Player #3)',
      floor: '5-on-4',
      resolution: 'One coincidental minor pair cancels (Player #1 vs Player #3). Team A still has Player #2\'s major — 5-on-4. Major served in entirety.',
    },
    {
      num: 26,
      teamA: '2 min minor (Player #1)\n2 min minor (Player #2)',
      teamB: '2 min minor (Player #3)\n2 min minor (Player #4)',
      floor: '4-on-4\nthen 3-on-3',
      resolution: 'Two coincidental minor pairs cancel. If only one pair cancels (per Rule 37.2), remaining minors create 4-on-4. If all assessed simultaneously, 3-on-3 with all four serving.',
      notes: 'Rule 37.2 — cancel as many as possible, least players short.',
    },
    {
      num: 27,
      teamA: '5 min major + GM (Player #1)',
      teamB: '5 min major + GM (Player #2)',
      floor: '4-on-4',
      resolution: 'Coincidental major + GMs. Both ejected. Majors cancel for floor strength. Teams play 4-on-4 with substitutes serving. Both serve full 5 min.',
    },
    {
      num: 28,
      teamA: '2 min minor (Player #1)',
      teamB: '—',
      floor: '5-on-4',
      resolution: 'Standard power play. If Team B scores, Player #1 released. 5-on-5 resumes.',
    },
    {
      num: 29,
      teamA: '2 min minor (Player #1, serving)\nGoal scored on Team A',
      teamB: '—',
      floor: '5-on-4\nthen 5-on-5',
      resolution: 'Goal scored during Player #1\'s minor. Player #1 released immediately. Teams return to 5-on-5. Face-off at center.',
    },
    {
      num: 30,
      teamA: '2 min minor (Player #1)\n2 min minor (Player #2)',
      teamB: '—',
      floor: '5-on-3',
      resolution: 'Two minors stacked. If goal scored, Player #1 released (least time remaining). Floor becomes 5-on-4. If second goal scored, Player #2 released.',
    },
    {
      num: 31,
      teamA: '5 min major (Player #1)\n2 min minor (Player #2)',
      teamB: '—',
      floor: '5-on-3',
      resolution: 'Minor served first. If goal scored, minor player released (5-on-4). Major continues full 5 min regardless of goals.',
    },
    {
      num: 32,
      teamA: '2 min minor (Player #1)',
      teamB: '2 min minor (Player #3)\n2 min minor (Player #4)',
      floor: '5-on-4',
      resolution: 'One coincidental minor pair cancels (Player #1 vs Player #3). Team B has additional minor (Player #4). Team A on 5-on-4 power play.',
    },
    {
      num: 33,
      teamA: '2 min minor (Player #1)\n10 min misconduct (Player #1)',
      teamB: '2 min minor (Player #3)',
      floor: '4-on-4',
      resolution: 'Coincidental minors cancel. Player #1 still serves 10 min misconduct (doesn\'t affect floor strength). Substitute allowed for Player #1.',
    },
  ];

  const situations34to43: PenaltySituation[] = [
    {
      num: 34,
      teamA: '2 min minor (Player #1)',
      teamB: '—',
      floor: '5-on-4',
      resolution: 'Standard minor — Team B power play. Goal releases Player #1.',
    },
    {
      num: 35,
      teamA: '2 min minor (Player #1)',
      teamB: '2 min minor (Player #3)',
      floor: '4-on-4',
      resolution: 'Equal coincidental minors cancel for floor strength. Both serve time. Substitutes play.',
    },
    {
      num: 36,
      teamA: '2 min minor (Player #1)\n2 min minor (Player #2)',
      teamB: '2 min minor (Player #3)',
      floor: '5-on-4',
      resolution: 'One pair cancels (Player #1 vs #3). Player #2\'s minor remains — 5-on-4 for Team B.',
    },
    {
      num: 37,
      teamA: '5 min major (Player #1)',
      teamB: '2 min minor (Player #3)',
      floor: '5-on-4\nthen 5-on-4',
      resolution: 'Cannot cancel major vs minor. Both serve. Team A short for major (5 min). Team B short for minor (2 min). Net: 5-on-4 Team B for 2 min, then 5-on-4 Team B for remaining 3 min of major.',
    },
    {
      num: 38,
      teamA: '10 min misconduct (Player #1)',
      teamB: '10 min misconduct (Player #3)',
      floor: '5-on-5',
      resolution: 'Coincidental misconducts. Neither affects floor strength. Both players sit 10 min. Substitutes play. 5-on-5 throughout.',
    },
    {
      num: 39,
      teamA: '2 min minor (In-Home serving)',
      teamB: '—',
      floor: '5-on-4',
      resolution: 'In-Home designated to serve bench minor or non-designated player penalty. In-Home\'s time does not count toward penalty — only corrects floor strength. In-Home serves, team short-handed.',
    },
    {
      num: 40,
      teamA: '5 min major + GM (Player #1)',
      teamB: '—',
      floor: '5-on-4',
      resolution: 'Player #1 ejected. In-Home or designated player serves the 5 min major from penalty box. Major served in entirety. No early release for goals.',
    },
    {
      num: 41,
      teamA: '2 min minor (Player #1)\n2 min minor (Player #2)\n2 min minor (Player #3, delayed)',
      teamB: '—',
      floor: '5-on-3',
      resolution: 'Two penalties serving, third on delay. At stoppage, third penalty goes on. Cannot go below 3-on-5. Third penalty results in penalty shot to Team B instead.',
    },
    {
      num: 42,
      teamA: '5 min match penalty (Player #1)',
      teamB: '5 min match penalty (Player #3)',
      floor: '4-on-4',
      resolution: 'Coincidental match penalties. Both ejected. Penalties cancel for floor strength. In-Homes or designated players serve. In RMLL, match penalties end after 2 goals.',
    },
    {
      num: 43,
      teamA: '2 min minor (Goalie)',
      teamB: '—',
      floor: '5-on-4',
      resolution: 'Goalie penalty — In-Home or designated player serves from box. Goalie remains in net. If goalie receives GM, backup replaces; In-Home serves penalty.',
    },
  ];

  const situations44to50: PenaltySituation[] = [
    {
      num: 44,
      teamA: '2 min minor (Player #1, serving)\n2 min minor (Player #2, serving)\n2 min minor (Player #3, delayed)',
      teamB: '—',
      floor: '5-on-3',
      resolution: 'Already 5-on-3. Third penalty on delay cannot make floor go below 3. Penalty shot awarded to Team B. Player #3\'s penalty cancelled by penalty shot. Players #1 and #2 continue serving.',
    },
    {
      num: 45,
      teamA: '2 min minor (Player #1, serving)\nGoal scored during delay',
      teamB: '2 min minor (Player #3, delayed)',
      floor: '5-on-4\nthen 5-on-5',
      resolution: 'Goal scored during delayed penalty. Player #1 released (goal on power play). Player #3\'s penalty goes on clock. Net result: roll the box — Team B now serves minor. 5-on-4 Team A.',
      notes: 'Goal on delay with penalty being served = "roll the box."',
    },
    {
      num: 46,
      teamA: '5 min major (Player #1, serving)',
      teamB: '2 min minor (Player #3, delayed)',
      floor: '5-on-4',
      resolution: 'Goal scored during delay. Goal does NOT release Player #1 (major). Player #3\'s delayed penalty goes on clock. After minor, major continues.',
    },
    {
      num: 47,
      teamA: '2 min minor (Player #1)',
      teamB: '—',
      floor: '5-on-4',
      resolution: 'Penalty shot awarded to Team B (e.g., breakaway foul). Penalty shot does NOT release Player #1 regardless of outcome. Minor continues on clock after shot.',
    },
    {
      num: 48,
      teamA: '2 min minor (Player #1)\n2 min minor (Player #2)',
      teamB: '—',
      floor: '5-on-3',
      resolution: 'Third penalty called (Player #3 on delay). Penalty shot awarded. The penalty with least time remaining is cancelled by the penalty shot. New penalty time added to clock.',
    },
    {
      num: 49,
      teamA: '2 min minor (Player #1)',
      teamB: '—',
      floor: '5-on-4',
      resolution: 'Team A scores while short-handed (shorthanded goal). Player #1 is NOT released — minor continues. Shorthanded goals do not affect penalty time.',
    },
    {
      num: 50,
      teamA: '2 min double minor (Player #1)',
      teamB: '—',
      floor: '5-on-4',
      resolution: 'Double minor = 4 min total. If goal scored during first 2 min, first minor cancelled, second minor begins. If goal scored during second 2 min, Player #1 released.',
    },
  ];

  const situations51to58: PenaltySituation[] = [
    {
      num: 51,
      teamA: '5 min match penalty (Player #1)',
      teamB: '—',
      floor: '5-on-4',
      resolution: 'Match penalty in RMLL: served by In-Home. In LC play, match penalties end after 2 goals scored against the penalized team. Player ejected + automatic league review.',
      notes: 'RMLL Update: Match penalties need 2 goals to end in LC play.',
    },
    {
      num: 52,
      teamA: '5 min match penalty (Player #1)',
      teamB: '2 min minor (Player #3)',
      floor: '5-on-4\nthen 4-on-4',
      resolution: 'Cannot cancel match vs minor. Both serve. Team A short for match (ends after 2 goals in LC). Team B short for minor (2 min). Effective: 5-on-4 Team B for 2 min, then 5-on-4 Team B until 2 goals or time.',
    },
    {
      num: 53,
      teamA: '—',
      teamB: '5 min major (Player #3, Goalie)',
      floor: '5-on-4',
      resolution: 'Goalie receives major. Goalie ejected from game (major = ejection for goalies in many rules). Backup goalie enters. In-Home serves the 5 min major. Served in entirety.',
    },
    {
      num: 54,
      teamA: '2 min minor (Player #1)',
      teamB: '—',
      floor: '5-on-4',
      resolution: 'During Player #1\'s penalty, Player #1 receives additional 10 min misconduct from box. Misconduct starts after minor expires. Floor strength unaffected by misconduct.',
    },
    {
      num: 55,
      teamA: '5 min major + GM (Player #1)\n2 min minor (Player #2)',
      teamB: '5 min major + GM (Player #3)',
      floor: '5-on-4',
      resolution: 'Coincidental major+GMs cancel (Players #1 and #3 ejected). Player #2\'s minor remains. Team A short-handed 5-on-4.',
    },
    {
      num: 56,
      teamA: '2 min minor (Player #1)\n5 min major + GM (Player #2)',
      teamB: '2 min minor (Player #3)\n5 min major + GM (Player #4)',
      floor: '4-on-4',
      resolution: 'Coincidental major+GMs cancel (Players #2 and #4 ejected). Coincidental minors cancel (Players #1 and #3). Teams play 4-on-4 with substitutes. All penalties served.',
    },
    {
      num: 57,
      teamA: '2 min minor (Player #1)',
      teamB: '—',
      floor: '5-on-4',
      resolution: 'End of period during penalty. Player #1\'s remaining time carries to next period. Penalty resumes at start of next period. If minor has 0:30 left, it starts with 0:30 in next period.',
    },
    {
      num: 58,
      teamA: '5 min match penalty (Player #1)\n2 min minor (Player #2)',
      teamB: '—',
      floor: '5-on-3',
      resolution: 'Two time-served penalties. Team A down 2 players. Minor served first (least time). In RMLL LC play, match ends after 2 goals. If goal scored, minor player released first.',
      notes: 'Rule 38.3 — All penalties served in entirety in RMLL.',
    },
  ];

  const situations59to64: PenaltySituation[] = [
    {
      num: 59,
      teamA: '2 min minor (Player #1, serving)\n2 min minor (Player #2, serving)',
      teamB: '2 min minor (Player #3, delayed)',
      floor: '5-on-3',
      resolution: 'Already 5-on-3. Delayed penalty on Team B. At stoppage, Player #3\'s penalty goes on clock. Floor becomes 4-on-3 (cannot go below 3). Cancellation rules apply if coincidental.',
    },
    {
      num: 60,
      teamA: '2 min minor (Player #1)\n2 min minor (Player #2)',
      teamB: '2 min minor (Player #3)',
      floor: '4-on-3',
      resolution: 'Three penalties assessed. One pair cancels (Player #1 vs #3 or per Rule 37.2). Remaining penalty creates advantage. If all at same stoppage, cancel to make least players short.',
    },
    {
      num: 61,
      teamA: '—',
      teamB: 'Penalty Shot',
      floor: '5-on-5',
      resolution: 'Penalty shot awarded. Play stops. Designated shooter takes shot. Regardless of outcome (goal or save), play restarts with face-off. No penalty time assessed for the infraction that caused the penalty shot.',
    },
    {
      num: 62,
      teamA: '2 min minor (Player #1)',
      teamB: 'Penalty Shot + 2 min minor (Player #3)',
      floor: '4-on-4',
      resolution: 'Penalty shot awarded AND minor to Team B at same stoppage. Penalty shot taken first. Regardless of outcome, both minors go on clock. Coincidental minors cancel. 4-on-4 with substitutes.',
    },
    {
      num: 63,
      teamA: '2 min minor (Player #1, serving)\n2 min minor (Player #2, serving)',
      teamB: '—',
      floor: '5-on-3',
      resolution: 'Team A already 5-on-3. If ANOTHER penalty on Team A (Player #3), penalty shot awarded to Team B. Player with least time remaining is cancelled by the penalty shot. New penalty time replaces it.',
    },
    {
      num: 64,
      teamA: '5 min major (Player #1)\n2 min minor (Player #2, delayed)',
      teamB: '—',
      floor: '5-on-4\nthen 5-on-3',
      resolution: 'Major being served. Minor on delay. At stoppage, minor goes on clock. 5-on-3. Minor player released first if goal scored (least time). Major continues full 5 min.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-white border-2 border-[#013fac] rounded-lg p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <BookOpen className="w-8 h-8 text-[#013fac] shrink-0 mt-1" />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">2024 RMLL Rules & Procedure Package</h2>
            <p className="text-sm text-gray-500 mt-1 italic">Revised April 2, 2024</p>
            <p className="text-sm text-gray-700 mt-2">
              This document serves as a shared resource for all RMLL stakeholders (commissioners, players,
              coaches, managers, officials, and fans) to be informed by and referenced throughout the 2024
              season. This has been sourced from previous years OJLL, BCLA and RMLL rule packages/clarifications.
              2024 also saw the launch of the <strong>RMLL Casebook</strong>, which provides more information for rules
              and procedures not necessarily related to the 2024 Playing Rules Updates.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Original Documents Used: OLA Jr A/Sr A Document
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowTOC(!showTOC)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 transition-colors"
        >
          <List className="w-3.5 h-3.5" />
          {showTOC ? 'Hide' : 'Show'} Table of Contents
        </button>
        <button onClick={expandAll} className="px-3 py-1.5 text-xs font-bold bg-[#013fac] text-white border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#0149c9] transition-colors">
          Expand All
        </button>
        <button onClick={collapseAll} className="px-3 py-1.5 text-xs font-bold bg-white border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 transition-colors">
          Collapse All
        </button>
      </div>

      {/* Table of Contents */}
      {showTOC && (
        <div className="bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-5">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><List className="w-4 h-4" /> Table of Contents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TOC_ITEMS.map(group => (
              <div key={group.group}>
                <h4 className="text-xs font-bold text-[#013fac] uppercase tracking-wider mb-1.5 border-b border-blue-100 pb-1">{group.group}</h4>
                <ul className="space-y-0.5">
                  {group.items.map(item => (
                    <li key={item.id}>
                      <button
                        onClick={() => { toggle(item.id); setTimeout(() => document.getElementById(`rop-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100); }}
                        className="text-xs text-blue-700 hover:text-blue-900 hover:underline text-left"
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* PART 1: RULES & PROCEDURE PACKAGE                */}
      {/* ══════════════════════════════════════════════════ */}

      <GroupHeader title="Rules & Procedure Package" />

      <div className="space-y-3">
        <Section id="intro" title="Introduction" open={openSections.has('intro')} onToggle={() => toggle('intro')}>
          <p>
            This document serves as a shared resource for all RMLL stakeholders (commissioners, players,
            coaches, managers, officials, and fans) to be informed by and referenced throughout the 2024
            season. This has been sourced from previous years OJLL, BCLA and RMLL rule
            packages/clarifications.
          </p>
          <p>
            2024 also saw the launch of the <strong>RMLL Casebook</strong>, which provides more
            information for rules and procedures not necessarily related to the 2024 Playing Rules Updates.
          </p>
        </Section>

        <Section id="special-note" title="Special Note — Crease Dives" open={openSections.has('special-note')} onToggle={() => toggle('special-note')}>
          <Note type="important">
            <p className="font-bold">The 2024 RMLL Playing Rules being implemented have nothing to do with crease dives.</p>
          </Note>
          <p>
            Crease dives for all RMLL Divisions, including Jr. A, are and have been as per LC Rules (see Rule 39).
            Implementing the changes for RMLL Rules in 2024 will NOT change how crease dives are currently
            being called in each Division.
          </p>
          <p>
            Although the rule and the standard is the same for all Divisions, differences might be perceived
            between divisions. This is mostly a result of skill and execution differences. <strong>A legal crease dive
            looks and is called the same at all levels.</strong>
          </p>
        </Section>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* PART 2: 2024 RULE MODIFICATIONS                  */}
      {/* ══════════════════════════════════════════════════ */}

      <GroupHeader title="2024 Rule Modifications" />

      <div className="space-y-3">
        <Section id="4sec" title="4-Second Count" open={openSections.has('4sec')} onToggle={() => toggle('4sec')}>
          <p>
            When a team gains possession of the ball in their crease, the player in possession must vacate
            the crease within <strong>four (4) seconds</strong>.
          </p>
          <Note type="info">
            <p>Source: OLA Jr A/Sr A Document</p>
          </Note>
        </Section>

        <Section id="8sec" title="8-Second Count" open={openSections.has('8sec')} onToggle={() => toggle('8sec')}>
          <p>
            When a team gains possession in their defensive half of the floor, they must advance the ball
            with both feet across the center line within <strong>eight (8) seconds</strong> of gaining possession.
          </p>
          <p>
            If a team calls a timeout on their defensive side of half, the 8-second count will reset, but the
            30 clock will not reset.
          </p>
          <Note type="warning">
            <p className="italic">
              <strong>Clarification:</strong> Teams must keep the ball in their offensive half after gaining possession or
              carrying the ball with both feet across and making contact in that zone. Possession will be
              awarded to the non-offending team.
            </p>
            <p className="text-xs mt-1">Source: NLL Rule 48</p>
          </Note>
        </Section>

        <Section id="faceoffs" title="Face-offs & Restraining Lines" open={openSections.has('faceoffs')} onToggle={() => toggle('faceoffs')}>
          <p>
            In addition to revised face-off procedures which restrict stick and body contact, sticks must be placed
            <strong> eight (8) inches apart</strong> and touching the floor. The sticks must be placed so they are parallel
            to the centre line, <strong>four (4) inches</strong> from the centre line, and the players must keep their feet and
            body on their defensive half of the floor.
          </p>
          <p>
            Greater distance has been implemented between restraining lines; which are <strong>85' apart</strong> and
            <strong> 42'6"</strong> from the centre line. Players are immediately released from their restraining lines upon
            the whistle to start play, but may not make contact with the players who are facing off until they
            are fully upright and in possession of the ball.
          </p>
          <Note type="info">
            <p>Source: OLA Jr A/Sr A Document</p>
          </Note>
        </Section>

        <Section id="faceoff-mechanic" title="Face-off Mechanic" open={openSections.has('faceoff-mechanic')} onToggle={() => toggle('faceoff-mechanic')}>
          <p>
            <strong>Mechanic:</strong> The players feet must be on their defensive side of half not in contact with the centre
            line, and their right foot not being more forward than their right hand with their foot to the left of
            the head of their stick.
          </p>
          <p>
            Players may clamp, rake or pull the ball once the whistle is blown, but both players must
            "contest the ball" meaning one player cannot simply stand up and immediately begin checking
            the other face-off player.
          </p>
        </Section>

        <Section id="delayed-penalty" title="Delayed Penalty Mechanic" open={openSections.has('delayed-penalty')} onToggle={() => toggle('delayed-penalty')}>
          <p>While a delayed penalty is signaled, the play is stopped if/when:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>the defending team gains possession of the ball;</li>
            <li>if the ball goes out of bounds;</li>
            <li>an over-and-back violation occurs;</li>
            <li>a goal is scored;</li>
            <li>the shot clock or game clock expires; or</li>
            <li>an offensive player commits a penalty/infraction.</li>
          </ul>
          <p className="mt-3 font-bold">NOTE: Completion of the play shall also mean:</p>
          <ol className="list-[lower-roman] ml-5 space-y-1">
            <li>The ball has come into possession and control of an opposing player/goalkeeper.</li>
            <li><strong>A second infraction has occurred, regardless of which team commits the infraction.</strong></li>
            <li><strong>The ball proceeds loose out of the zone.</strong></li>
            <li>Any reason that would have normally caused a stoppage in play.</li>
          </ol>
          <p className="mt-3">
            The play will continue upon a shot on goal if the offensive team regains possession on the
            rebound, and the shot clock is reset; and if the ball contacts the defensive player's stick or body
            but the defensive team does not gain possession and control of the ball.
          </p>
        </Section>

        <Section id="coincidental" title="Coincidental Penalties" open={openSections.has('coincidental')} onToggle={() => toggle('coincidental')}>
          <p>
            If multiple penalties to each team are assessed during the same stoppage in play, minor penalties
            can be "canceled" without major penalties being required and will not be time-served penalties.
          </p>
          <p>
            When penalties "canceled" in this way, teams will be able to substitute from the bench for that
            player(s) and play at full-strength. The offending players will serve until a goal, penalty, time-out,
            or end of period upon the expiration of their penalty.
          </p>
        </Section>

        <Section id="4on4" title="4-on-4 after Coincidental Penalties" open={openSections.has('4on4')} onToggle={() => toggle('4on4')}>
          <p>
            Notwithstanding the above, when teams are playing at Full-Strength, regardless of the goalie
            being in or substituted from the bench, and a single minor penalty is called at the same stoppage
            to both teams with no other penalties at that stoppage, teams will resume playing <strong>4-on-4</strong> with
            the minor penalty on the clock as a time-served penalty.
          </p>
          <p>
            Players will be released upon the expiration of their penalty time. This is consistent with current
            LC rules (Situation 15b).
          </p>
        </Section>

        <Section id="multiple-penalties" title="Multiple Penalties" open={openSections.has('multiple-penalties')} onToggle={() => toggle('multiple-penalties')}>
          <p>
            If a team is short-handed with two players time-served penalties and a third penalty is called,
            a <strong>penalty shot</strong> will be awarded to the non-offending team.
          </p>
          <p className="font-bold">Administration:</p>
          <p>
            The penalty serving with the least amount of time remaining will be canceled off of the clock by
            the penalty shot, and the new penalty time (either a minor, double minor or major) will be added
            to the clock. The player with the least amount of time on their penalty will return to the players
            bench prior to the penalty shot.
          </p>
          <p>
            The outcome of the penalty shot does not impact any other penalties serving, and play restarts
            with a face-off, regardless of whether or not a goal is scored.
          </p>
        </Section>

        <Section id="over-and-back" title="Over and Back / Back Over" open={openSections.has('over-and-back')} onToggle={() => toggle('over-and-back')}>
          <p>
            "Over and back" is in effect for all possessions using the centre line. Teams who are in possession
            of the ball may not carry, pass, or allow the ball into their defensive half once they have entered
            their opponent's half of the playing surface. An "over and back" violation does not occur if the ball
            hits the goal/goalie for a reset or the defending team is last to touch the ball.
          </p>
          <Note type="warning">
            <p className="italic">
              <strong>Clarification:</strong> Should a "back over/over and back" violation occur, play may not restart within
              the 24-foot dotted line, including on a fast break. The Bill Hunter does not have a 24-foot circle.
              As such, officials will use the face-off restraining line as the threshold for when the play will be
              whistled-dead. Play will be restarted once the offensive team has moved approximately 5-yards
              from the top of the crease. It can be subject to the fast-restart rule, provided the ball is starting
              5-yards from the top of the crease.
            </p>
          </Note>
          <p>
            If the offensive team was the last to touch the ball prior to the ball going back over centre
            without a reset of the shot clock, the referee shall withhold the sounding of the whistle until it is
            apparent that the non-offending team will not gain possession. Possession shall be awarded to
            the non-offending team where the ball comes to rest.
          </p>
          <p>
            If a goaltender is pulled for an extra attacker, and the ball travels back across centre into the goal,
            the goal shall count and be considered a good goal.
          </p>
          <Note type="info">
            <p className="italic">
              <strong>Clarification:</strong> On a face-off, a team may go into their defensive half with the ball off a face-off
              provided they have not begun traveling towards the opposition's goal while in possession or are
              forced into their defensive half by a defender. This includes carrying, passing or batting a loose
              ball into their defensive half during the first possession following a face-off.
            </p>
          </Note>
        </Section>

        <Section id="illegal-sub" title="Illegal Substitution" open={openSections.has('illegal-sub')} onToggle={() => toggle('illegal-sub')}>
          <p>
            In all situations, if a team has too many players on the floor, a minor penalty will be assessed to
            the offending team.
          </p>
          <p>
            <strong>Administration:</strong> Officials will use the "illegal substitution" stacked forearm signal when reporting
            these fouls, not the "Too Many Players" palm signal.
          </p>
          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="font-bold text-amber-900">Clarification: Rule 36(c) — Too Many Players — Penalty Shot</p>
            <p className="text-amber-800 mt-1">
              If a player has their path altered by a player illegally on the floor (calling for a delayed penalty for
              Too Many Players and they meet the criteria for a breakaway), a penalty shot will be awarded. If
              the goalkeeper of the penalized team is not legally on the floor, a goal shall be awarded.
            </p>
          </div>
        </Section>

        <Section id="fast-restarts" title="Fast Restarts" open={openSections.has('fast-restarts')} onToggle={() => toggle('fast-restarts')}>
          <p>
            Upon the restart of play, the non-offending team may gain possession at any location on the
            playing floor where the ball comes to rest. Upon stoppage of play, the offending team must
            immediately put the ball down and allow for a fast restart by the opposing team.
          </p>
          <p>
            As well, all offending team players must immediately move a minimum of <strong>six (6) feet</strong> away from
            the ball. If a player does not move 6 feet away from the ball, a minor penalty for delay-of-game
            will be assessed to the offending player.
          </p>
          <Note type="info">
            <p className="italic">
              <strong>Clarification:</strong> Officials are instructed to use discretion when determining if a player is
              intentionally delaying the game. It is reasonable to expect minimal movement of the ball when
              placing it down on a concrete playing surface vs a turf playing surface.
            </p>
          </Note>
        </Section>

        <Section id="in-homes" title="In-Homes" open={openSections.has('in-homes')} onToggle={() => toggle('in-homes')}>
          <p>
            In-homes are a player designated by the coach to serve all bench minor penalties or penalties
            that may require an additional player to serve them (coincidentals, majors with game
            misconducts, goalkeeper penalties, etc.) This saves the teams and officials time in determining
            who may or may not have been on the floor at a given time of an infraction.
          </p>
          <p>
            In-homes will be provided to the officials prior to the game by being indicated on the game sheet
            similar to a captain or affiliated player with the designation <strong>"IH."</strong>
          </p>
          <p>
            Each club's designated in-home will be indicated on the game sheet. A goaltender cannot be
            designated in-home. Any non-designated player penalty, bench minor, or minor penalty to the
            goaltender, will be served by the in-home player.
          </p>
          <Note type="info">
            <p className="text-xs">Sources: BCLA Document; NLL Rule 24.2</p>
          </Note>
        </Section>

        <Section id="penalty-admin" title="Penalty Administration" open={openSections.has('penalty-admin')} onToggle={() => toggle('penalty-admin')}>
          <p>
            Timeserve penalty "cancelling" has changed this year to adopt the below framework.
            Cancelling refers to placing penalties on the scoreboard and teams being permitted to play with
            substitutes from the bench for "canceled" non-timeserve penalties.
          </p>
          <div className="mt-3 bg-gray-50 border border-gray-300 rounded-lg p-4 space-y-2 text-xs">
            <h4 className="font-bold text-gray-900 text-sm uppercase">Penalty Priority Checklist</h4>
            <p className="text-gray-500 italic text-xs">Move through checklist in priority sequence</p>
            <ol className="list-decimal ml-5 space-y-1.5 text-gray-800">
              <li><strong>Cancel as many penalties as possible.</strong></li>
              <li><strong>Cancel in a way to make them only one player short.</strong></li>
              <li><strong>Cancel in a way to avoid taking an extra player off the floor.</strong></li>
              <li>All coincidental major penalties with matching minors are offsetting. Substitution off bench to floor. No time on clock.</li>
              <li>All coincidental major penalties with non-matching minors require substitution in penalty box.</li>
              <li><strong>First in first out. Least amount of penalty time released first.</strong></li>
              <li>When a player receives a minor and major, he will serve the minor first.</li>
              <li>If a goal has been deducted from a major or match, you must continue to work on major or match.</li>
              <li><strong>Penalty release:</strong> Worst one player will lose is either 5 min or minor(s) or one goal off major.</li>
              <li>Player receiving a major penalty will serve the penalty time in its entirety. Player is released upon expiry of full penalty time on next technical stoppage. If two goals are scored on the major, team may substitute a player from players bench being short-handed.</li>
              <li>If a player who has incurred penalty time which results in a substitute from the bench to serve a portion of his time, then the player will only remain in the penalty box for the balance of time the sub is not serving.</li>
              <li>Match penalties — substitute must serve penalty. It is full time served unless three goals scored.</li>
              <li className="font-bold">Minor penalty release after goal:
                <ul className="list-disc ml-5 mt-1 font-normal">
                  <li>Is the team scored against short-handed?</li>
                  <li>Are they serving a minor penalty on the clock?</li>
                  <li>If the answer is yes to both AND there is no goal(s) attached to a major or match penalty, then you are to delete the minor penalty with the least amount of time on the clock. No goals will affect coincidental penalties being served.</li>
                </ul>
              </li>
              <li>When a major and minor penalty are assessed at the same time to a team, the minor shall be served first.</li>
              <li>When a minor penalty is already serving time in the penalty box and a delayed penalty is being assessed against the same team and a goal is scored, the existing minor penalty is released and the delay penalty enters penalty box to serve the penalty that was on clock. With coincidental, minor or minors are assessed and no other penalties are being served, then teams will play 4-on-4. Penalties time will <em>NOT</em> be on clock.</li>
            </ol>
          </div>
          <Note type="info">
            <p className="text-xs">Source: NLL Casebook Penalty Priority Checklist</p>
          </Note>
        </Section>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* PART 3: ADDITIONAL RULES & CLARIFICATIONS        */}
      {/* ══════════════════════════════════════════════════ */}

      <GroupHeader title="Additional Rules & Clarifications" />

      <div className="space-y-3">
        <Section id="crease-play" title="Crease-Play" open={openSections.has('crease-play')} onToggle={() => toggle('crease-play')}>
          <p>
            The <strong>24-foot dotted line</strong> is in effect for crease play. No offensive player may be inside the
            24-foot dotted line without the ball. If an offensive player is inside the 24-foot line without the
            ball and interferes with the play, an offensive zone crease violation will be called.
          </p>
          <Note type="warning">
            <p className="italic">
              <strong>Bill Hunter Arena Exception:</strong> The Bill Hunter does not have a 24-foot dotted line. Officials
              will use the face-off restraining line as the threshold.
            </p>
          </Note>
          <p>
            <strong>Offensive Zone Crease Violations:</strong> An offensive player cannot:
          </p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Step into the crease while the ball is in the offensive zone (unless driven in by a defender).</li>
            <li>Make contact with the goaltender in the crease.</li>
            <li>Screen the goaltender from inside the crease area.</li>
          </ul>
          <p>
            A player may run through the crease on a fast break or transition play as long as they don't
            interfere with the goaltender and are making a legitimate play on the ball.
          </p>
        </Section>

        <Section id="nets" title="Position of Nets" open={openSections.has('nets')} onToggle={() => toggle('nets')}>
          <p>
            Nets must be properly positioned and secured before play begins. If a net is dislodged during play,
            play shall be stopped immediately if the displacement affects the play in progress.
          </p>
        </Section>

        <Section id="jewelry" title="Jewelry" open={openSections.has('jewelry')} onToggle={() => toggle('jewelry')}>
          <p>
            <strong>Inspection Procedure:</strong> Officials shall inspect players for jewelry during the pre-game
            warmup. Any player found wearing jewelry will be asked to remove it. If they cannot or will not,
            they will not be permitted to play.
          </p>
          <p>
            <strong>2024 Season Guidance for Officials:</strong> Officials are reminded to conduct thorough pre-game
            inspections. Players wearing medical alert bracelets must have them taped down and covered.
            Religious medals must be removed or taped securely under equipment.
          </p>
        </Section>

        <Section id="illegal-equip" title="Illegal Equipment" open={openSections.has('illegal-equip')} onToggle={() => toggle('illegal-equip')}>
          <div className="space-y-3">
            <div>
              <p className="font-bold text-gray-900">Helmet Chin Strap:</p>
              <p>Must be properly fastened at all times during play. If a chin strap comes undone, the player must
              immediately leave the floor and repair it. If a player continues to play with an unfastened chin strap,
              a minor penalty for illegal equipment will be assessed.</p>
            </div>
            <div>
              <p className="font-bold text-gray-900">Face-Mask Chin-Cup:</p>
              <p>The chin-cup on a face-mask (cage) must be properly attached and functional. A face-mask without
              a chin-cup is considered illegal equipment.</p>
            </div>
            <div>
              <p className="font-bold text-gray-900">Face-Mask Bolted On:</p>
              <p>Face-masks must be properly bolted to the helmet using the manufacturer's hardware. Zip-ties,
              tape, or other makeshift attachments are not acceptable. A face-mask that is not properly bolted is
              considered illegal equipment.</p>
            </div>
            <div>
              <p className="font-bold text-gray-900">Modified Helmet:</p>
              <p>Any helmet that has been modified from the manufacturer's original design (e.g., removed padding,
              drilled holes, altered shell) is considered illegal equipment. Players wearing modified helmets will
              receive a minor penalty and must correct the issue before returning to play.</p>
            </div>
          </div>
        </Section>

        <Section id="delay-of-game" title="Delay of Game" open={openSections.has('delay-of-game')} onToggle={() => toggle('delay-of-game')}>
          <p>
            <strong>Clarification:</strong> Shooting the ball into the netting (above the glass/netting surrounding the floor)
            from the defensive zone is considered delay of game. A minor penalty will be assessed.
          </p>
          <p>
            Officials are instructed to use their judgment — an errant pass or deflection that goes into the netting
            should not be penalized, but deliberately clearing the ball over the glass/netting is delay of game.
          </p>
        </Section>

        <Section id="possession" title="NLL Possession Rules" open={openSections.has('possession')} onToggle={() => toggle('possession')}>
          <p>
            NLL possession rules are adopted <strong>(with exception of penalties after goals — this will result in
            possession)</strong>.
          </p>
          <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-bold text-gray-900 text-sm mb-2">Who Gets Possession? (CLA Framework)</h4>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-bold text-gray-800">Before the Whistle:</p>
                <ul className="list-disc ml-5 space-y-0.5">
                  <li>Team with the least amount of time on the clock gets possession.</li>
                  <li>Misconducts don't count toward penalty time calculations.</li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-gray-800">After the Whistle:</p>
                <ul className="list-disc ml-5 space-y-0.5">
                  <li>Team with the least amount of time on the clock gets possession.</li>
                  <li>If even time — last team with possession retains, or face-off.</li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic">See Appendix for Situations.</p>
          </div>
        </Section>

        <Section id="signals" title="Signals" open={openSections.has('signals')} onToggle={() => toggle('signals')}>
          <Note type="info">
            <p><strong>2024 RMLL Rules of Play — Signals:</strong> To be Released.</p>
            <p className="text-xs mt-1">A companion signals document with official referee signals for the 2024 rule changes is forthcoming.</p>
          </Note>
        </Section>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* APPENDIX A: PENALTY SITUATIONS                   */}
      {/* ══════════════════════════════════════════════════ */}

      <GroupHeader title="Appendix A — NLL Penalty Administration Situations" />

      <Note type="important">
        <div>
          <p className="font-bold">NLL Penalty Administration Situations 2023-2024</p>
          <p className="mt-1">Adopted for Consistency across the RMLL for 2024</p>
          <div className="mt-2 space-y-1">
            <p className="font-bold text-red-900">RMLL Updates:</p>
            <ul className="list-disc ml-5 space-y-0.5">
              <li><strong>Match penalties need 2 goals to end in LC play</strong> (not served in entirety like regular majors).</li>
              <li><strong>All penalties served in entirety</strong> — player released upon expiry of full penalty time on next technical stoppage.</li>
              <li><strong>In-Home time only corrects floor strength</strong> — does not count toward penalty time served by the penalized player.</li>
            </ul>
          </div>
        </div>
      </Note>

      <div className="space-y-3">
        <Section id="app-intro" title="Appendix Introduction & Key Rules" open={openSections.has('app-intro')} onToggle={() => toggle('app-intro')}>
          <h4 className="font-bold text-gray-900">Coincidental Minor Penalties when Playing at Full-Strength</h4>
          <p>
            When both teams are at full strength and coincidental minor penalties are called, the standard
            cancellation rules apply. Players serve their time but teams play with substitutes at full strength.
          </p>
          <p>
            <strong>Exception (Situation 15b):</strong> When a single minor is called on each team at the same stoppage
            with no other penalties, teams play 4-on-4 with the minor on the clock as a time-served penalty.
          </p>
          <h4 className="font-bold text-gray-900 mt-4">Key Principles</h4>
          <ul className="list-disc ml-5 space-y-1">
            <li>Minors: Released by powerplay goals. First in, first out (least time).</li>
            <li>Majors: Served in entirety (5 min). Goals do NOT release early.</li>
            <li>Match Penalties (RMLL LC): End after 2 goals scored against. Player ejected.</li>
            <li>Misconducts: 10 min — do NOT affect floor strength.</li>
            <li>Game Misconducts: Player ejected — penalty served by In-Home/designate.</li>
            <li>Goalie Penalties: Served by In-Home/designated player. Goalie stays in net.</li>
            <li>Coincidentals: Cancel for floor strength. Teams substitute. Players still serve time.</li>
            <li>3rd penalty when already 5-on-3: Results in penalty shot, not 6-on-3.</li>
          </ul>
        </Section>

        <Section id="sit-1-3" title="Situations 1–3, 15b" open={openSections.has('sit-1-3')} onToggle={() => toggle('sit-1-3')}>
          <SituationTable situations={situations1to3} />
        </Section>

        <Section id="sit-5-12" title="Situations 5–12" open={openSections.has('sit-5-12')} onToggle={() => toggle('sit-5-12')}>
          <SituationTable situations={situations5to12} />
        </Section>

        <Section id="sit-13-23" title="Situations 13–23" open={openSections.has('sit-13-23')} onToggle={() => toggle('sit-13-23')}>
          <SituationTable situations={situations13to23} />
        </Section>

        <Section id="sit-24-33" title="Situations 24–33" open={openSections.has('sit-24-33')} onToggle={() => toggle('sit-24-33')}>
          <SituationTable situations={situations24to33} />
        </Section>

        <Section id="sit-34-43" title="Situations 34–43" open={openSections.has('sit-34-43')} onToggle={() => toggle('sit-34-43')}>
          <SituationTable situations={situations34to43} />
        </Section>

        <Section id="sit-44-50" title="Situations 44–50" open={openSections.has('sit-44-50')} onToggle={() => toggle('sit-44-50')}>
          <SituationTable situations={situations44to50} />
        </Section>

        <Section id="sit-51-58" title="Situations 51–58" open={openSections.has('sit-51-58')} onToggle={() => toggle('sit-51-58')}>
          <SituationTable situations={situations51to58} />
        </Section>

        <Section id="sit-59-64" title="Situations 59–64" open={openSections.has('sit-59-64')} onToggle={() => toggle('sit-59-64')}>
          <SituationTable situations={situations59to64} />
        </Section>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 py-4 border-t border-gray-200 mt-8">
        <p>2024 RMLL Rules & Procedure Package — Revised April 2, 2024</p>
        <p className="mt-1">Original Documents: OLA Jr A/Sr A Document | NLL Casebook | BCLA Document | NLL Rules</p>
      </div>
    </div>
  );
}
