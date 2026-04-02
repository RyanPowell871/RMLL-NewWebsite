import { useState } from 'react';
import { Heart, Trophy, Award, Shield, Star, Users, ChevronDown, ChevronUp } from 'lucide-react';

/* --- Jaydon Sommerfeld Memorial Award --- */

interface MemorialRecipient {
  year: number;
  player: string;
  team: string;
}

const SOMMERFELD_RECIPIENTS: MemorialRecipient[] = [
  { year: 2025, player: 'Alex Swann', team: 'Mavericks Lacrosse Club' },
  { year: 2024, player: 'Seth De La Ronde', team: 'Winnipeg Blizzard' },
  { year: 2023, player: 'Ben Royer', team: 'Edmonton Warriors' },
  { year: 2022, player: 'Joseph Royer', team: 'Edmonton Warriors' },
  { year: 2019, player: 'Dylan Ferrier', team: 'Calgary Shamrocks' },
  { year: 2018, player: 'Jared Ferris', team: 'Calgary Shamrocks' },
  { year: 2017, player: 'Kelson Borisenko', team: 'Manitoba Blizzard' },
  { year: 2016, player: 'Blake Tajiri', team: 'Calgary Chill' },
];

/* --- Annual Division Awards --- */

interface AwardCategory {
  category: string;
  recipients: string; // free-text since legacy formats vary
}

interface AnnualAwards {
  year: number;
  title: string;
  subtitle?: string;
  categories: AwardCategory[];
}

const ANNUAL_AWARDS: AnnualAwards[] = [
  {
    year: 2023,
    title: '2023 Jr. B Tier I North Awards',
    categories: [
      { category: 'Most Valuable Player', recipients: 'Sebastian Simonson \u2013 Edmonton Warriors' },
      { category: 'Offensive Player of the Year', recipients: 'Sebastian Simonson \u2013 Edmonton Warriors' },
      { category: 'Defensive Player of the Year', recipients: 'Caden Gulka \u2013 Edmonton Warriors' },
      { category: 'Transition Player of the Year', recipients: 'Brendan Onofrychuk \u2013 Edmonton Warriors' },
      { category: 'Rookie of the Year', recipients: 'Grayson Maloney \u2013 Beaumont Outlaws' },
      { category: 'Top Goalie of the Year', recipients: 'Tait Pinch \u2013 Edmonton Warriors' },
      { category: 'Bench Staff of the Year', recipients: 'Edmonton Warriors' },
    ],
  },
  {
    year: 2013,
    title: '2013 Jr. B Tier I Award Recipients',
    categories: [
      { category: 'Goalie', recipients: 'Troy Boucher (Crude), Jon McMillan (Warriors), Adam Virgo (Mounties)' },
      { category: 'Defender', recipients: 'Brett Lariviere (Warriors), Kyle Patterson (Chill), Steven McQueen (Shamrocks)' },
      { category: 'Coach', recipients: 'Terry Dokken (Crude), Wayne Sutherland (Mounties), Jared McNicol (Chill)' },
      { category: 'Rookie', recipients: 'Lucas Claude (Chill), Cody Stannard (Crude), Colton Bykowsky (Titans)' },
      { category: 'All-Star North', recipients: 'Erik Turner (Crude), Adam Saunders (SWAT), Cody Stannard (Crude), Bryton Thorarinson (SWAT), Ryan Ewashko (Warriors), Jon McMillan (Warriors)' },
      { category: 'All-Star South', recipients: 'Sean Tyrell (Mounties), Mitch Grant (Mounties), Brandon Steubing (Gryphons), Bret Davis (Shamrocks), Lucas Claude (Chill), Adam Virgo (Mounties)' },
    ],
  },
  {
    year: 2012,
    title: '2012 Jr. B Tier I Award Recipients',
    categories: [
      { category: 'Goalie', recipients: 'Darren Zwack (Titans); Runners Up: Adam Virgo (Silvertips), Nick Klotz (Silvertips), and Adam Mooney (Rampage)' },
      { category: 'Defender', recipients: 'Garret Cunningham (Crude) and Adam Oscienny (Chill); Runners Up: Matt Downie (Titans) and Kyle Patterson (Chill)' },
      { category: 'Coach', recipients: 'Ken Stuebing (Gryphons); Runner Up: Randy Trobak (SWAT)' },
      { category: 'Rookie', recipients: 'Bret Davis (Shamrocks); Runner Up: Sean Tyrell (Mounties)' },
      { category: 'All-Star North', recipients: 'Erik Turner (Crude), Brett Reynor (Titans), Bryton Thorarinson (SWAT), Adam Wild (Titans), Adam Saunders (SWAT), and Tristan Rai (Titans)' },
      { category: 'All-Star South', recipients: 'Thomas Bruton (Mounties), Davis Reykdal (Rampage), Cody Friesen (Mounties), Bret Davis (Shamrocks), Connor Thomson (Shamrocks), and Paul Nicholson (Gryphons)' },
    ],
  },
];

/* --- Components --- */

function SommerfeldMemorialSection() {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0F2942] to-[#1a3a5c] px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-bold text-white" style={{ fontFamily: 'var(--font-secondary)' }}>
              Jaydon Sommerfeld Memorial Award
            </h4>
            <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
              Larry Bishop Memorial Cup &ndash; Championship Series MVP
            </p>
          </div>
        </div>
      </div>

      {/* Memorial Description */}
      <div className="bg-gradient-to-br from-gray-50 to-white px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="space-y-2.5">
          <p className="text-sm font-semibold text-gray-900">
            Jaydon Nicholas Sommerfeld
          </p>
          <p className="text-xs text-gray-500 italic">
            February 1, 1998 &ndash; June 10, 2015
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            With the tragic death of the Rockyview Silvertips rookie player, Jaydon Sommerfeld, in June 2015, 
            the Jr. B Tier I Division established the Jaydon Sommerfeld Memorial Award in 2016.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            This award is presented to the Most Valuable Player during the Larry Bishop Memorial Cup &ndash; RMLL Jr. B Tier I Championship Series.
          </p>
        </div>
      </div>

      {/* Recipients Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left font-bold text-gray-700 border-b border-gray-200 w-20">Year</th>
              <th className="px-4 py-2 text-left font-bold text-gray-700 border-b border-gray-200">Player</th>
              <th className="px-4 py-2 text-left font-bold text-gray-700 border-b border-gray-200 hidden sm:table-cell">Team</th>
            </tr>
          </thead>
          <tbody>
            {SOMMERFELD_RECIPIENTS.map((r, i) => {
              const isFirst = i === 0;
              return (
                <tr
                  key={r.year}
                  className={`
                    ${isFirst ? 'bg-amber-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    hover:bg-blue-50 transition-colors
                  `}
                >
                  <td className={`px-4 py-2 border-b border-gray-100 font-bold tabular-nums ${isFirst ? 'text-[#013fac]' : 'text-gray-900'}`}>
                    {r.year}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-100">
                    <div>
                      <span className={`font-semibold ${isFirst ? 'text-[#013fac]' : 'text-gray-900'}`}>
                        {r.player}
                      </span>
                      {isFirst && (
                        <span className="ml-1.5 text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full font-bold uppercase">
                          Current
                        </span>
                      )}
                      <span className="text-gray-500 text-xs sm:hidden block mt-0.5">{r.team}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 border-b border-gray-100 text-gray-600 hidden sm:table-cell">
                    {r.team}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnnualAwardsSection({ awards }: { awards: AnnualAwards }) {
  const [expanded, setExpanded] = useState(awards.year >= 2020);

  // Alternate header colors based on year for visual variety
  const isEvenIndex = ANNUAL_AWARDS.findIndex(a => a.year === awards.year) % 2 === 0;
  const headerBg = isEvenIndex
    ? 'bg-gradient-to-r from-[#DC2626] to-[#991b1b]'
    : 'bg-gradient-to-r from-[#013fac] to-[#0F2942]';

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Clickable Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`${headerBg} w-full px-4 py-3 flex items-center justify-between text-left`}
      >
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-white shrink-0" />
          <h4 className="text-sm sm:text-base font-bold text-white" style={{ fontFamily: 'var(--font-secondary)' }}>
            {awards.title}
          </h4>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-white/70 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/70 shrink-0" />
        )}
      </button>

      {/* Content */}
      {expanded && (
        <div className="divide-y divide-gray-100">
          {awards.categories.map((cat, i) => (
            <div key={cat.category} className={`px-4 py-3 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                <span className="text-xs font-bold text-[#013fac] uppercase tracking-wide shrink-0 sm:w-48 sm:min-w-[12rem]">
                  {cat.category}
                </span>
                <span className="text-sm text-gray-700 leading-relaxed">
                  {cat.recipients}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* --- Main Export --- */

export function JrBTier1DivisionAwards() {
  return (
    <div className="space-y-6">
      {/* Sommerfeld Memorial Award */}
      <SommerfeldMemorialSection />

      {/* Annual Division Awards */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-[#013fac]" />
          <h3 className="text-base sm:text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-secondary)' }}>
            Annual Division Awards
          </h3>
        </div>

        {ANNUAL_AWARDS.map(awards => (
          <AnnualAwardsSection key={awards.year} awards={awards} />
        ))}
      </div>
    </div>
  );
}
