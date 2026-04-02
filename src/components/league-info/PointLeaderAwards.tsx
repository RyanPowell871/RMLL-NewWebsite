'use client';

import { useState } from 'react';
import { Trophy, Filter } from 'lucide-react';

/* --- Types --- */

interface PointLeaderEntry {
  year: number;
  jersey?: string;
  name: string;
  team: string;
  goals: number | null;
  assists: number | null;
  points: number;
  games: number | null;
}

interface DivisionAward {
  id: string;
  awardName: string | null; // Named awards have a name, unnamed ones are null
  division: string;
  entries: PointLeaderEntry[];
}

/* --- Data --- */

const DIVISION_AWARDS: DivisionAward[] = [
  {
    id: 'south',
    awardName: 'Kelly Mitchell Award',
    division: 'South Division',
    entries: [
      { year: 2025, jersey: '#18', name: 'Ben Erickson', team: 'Okotoks Marauders', goals: 34, assists: 39, points: 73, games: 17 },
      { year: 2024, jersey: '#2', name: 'Zane Fletcher', team: 'Calgary Shamrocks', goals: 43, assists: 49, points: 92, games: 20 },
      { year: 2023, jersey: '#17', name: 'Max Janousek', team: 'Calgary Shamrocks', goals: 36, assists: 48, points: 84, games: 19 },
      { year: 2022, jersey: '#23', name: 'Jaxson Geddes', team: 'Calgary Shamrocks', goals: 67, assists: 52, points: 119, games: 20 },
      { year: 2019, jersey: '#23', name: 'Dylan Ferrier', team: 'Calgary Shamrocks', goals: 37, assists: 35, points: 72, games: 19 },
      { year: 2018, jersey: '#22', name: 'Eric Lemire', team: 'Calgary Shamrocks', goals: 32, assists: 54, points: 86, games: 17 },
      { year: 2017, jersey: '#8', name: 'Colby Fraser', team: 'Calgary Shamrocks', goals: 52, assists: 53, points: 105, games: 20 },
      { year: 2016, jersey: '#23', name: 'Kelson Borisenko', team: 'Manitoba Blizzard', goals: 56, assists: 50, points: 106, games: 20 },
      { year: 2015, jersey: '#20', name: 'Baden Boyenko', team: 'Saskatchewan SWAT', goals: 68, assists: 53, points: 121, games: 20 },
      { year: 2014, jersey: '#27', name: 'Lyndon Bunio', team: 'Calgary Chill', goals: 60, assists: 63, points: 123, games: 18 },
      { year: 2013, jersey: '#12', name: 'Sean Tyrrell', team: 'Calgary Jr. B Mountaineers', goals: 41, assists: 60, points: 101, games: 19 },
      { year: 2012, jersey: '#22', name: 'Davis Reykdal', team: 'Red Deer Rampage', goals: 28, assists: 41, points: 69, games: 18 },
      { year: 2011, jersey: '#67', name: 'Cody Friesen', team: 'Calgary Jr. B Mountaineers', goals: 50, assists: 38, points: 88, games: 21 },
      { year: 2010, jersey: undefined, name: 'Dustin Taylor', team: 'Rockyview Silvertips', goals: 24, assists: 20, points: 44, games: 17 },
      { year: 2009, jersey: undefined, name: 'Destin Seguin', team: 'Calgary Jr. Mountaineers', goals: 21, assists: 20, points: 41, games: null },
    ],
  },
  {
    id: 'north',
    awardName: 'Chris Letendre Award',
    division: 'North Division',
    entries: [
      { year: 2025, jersey: '#20', name: 'Joshua Fodchuk', team: 'St. Albert Crude', goals: 44, assists: 41, points: 85, games: 18 },
      { year: 2024, jersey: '#6', name: 'Joshua Fodchuk', team: 'Edmonton Warriors', goals: 49, assists: 45, points: 94, games: 21 },
      { year: 2023, jersey: '#14', name: 'Graham Dicken', team: 'Edmonton Warriors', goals: 44, assists: 58, points: 102, games: 19 },
      { year: 2022, jersey: '#23', name: 'Joseph Royer', team: 'Edmonton Warriors', goals: 35, assists: 84, points: 119, games: 19 },
      { year: 2019, jersey: '#7', name: 'Markus Fouillard', team: 'Fort Saskatchewan Rebels', goals: 51, assists: 52, points: 103, games: 18 },
      { year: 2018, jersey: '#21', name: 'Tyler Sonnichsen', team: 'Edmonton Warriors', goals: 74, assists: 64, points: 138, games: 18 },
      { year: 2017, jersey: '#9', name: 'Colin Poitras', team: 'Manitoba Blizzard', goals: 35, assists: 66, points: 101, games: 20 },
      { year: 2016, jersey: '#21', name: 'Tyler Sonnichsen', team: 'Edmonton Jr. B Warriors', goals: 53, assists: 47, points: 100, games: 19 },
      { year: 2015, jersey: '#8', name: 'Michael Newman', team: 'Manitoba Blizzard', goals: 24, assists: 47, points: 71, games: 20 },
      { year: 2014, jersey: '#17', name: 'Steven Toporowski', team: 'Saskatchewan Swat', goals: 43, assists: 63, points: 106, games: 19 },
      { year: 2013, jersey: '#4', name: 'Adam Saunders', team: 'Saskatchewan Swat', goals: 45, assists: 50, points: 95, games: 20 },
      { year: 2012, jersey: '#6', name: 'Adam Wild', team: 'Sherwood Park Titans', goals: 44, assists: 47, points: 91, games: 15 },
      { year: 2011, jersey: '#10', name: 'Chris Britton', team: 'Edmonton Warriors', goals: 35, assists: 84, points: 119, games: 19 },
      { year: 2010, jersey: undefined, name: 'Dallas Smith', team: 'Sherwood Park Titans', goals: 14, assists: 39, points: 53, games: 18 },
      { year: 2009, jersey: undefined, name: 'Adam Stuckless', team: 'Edmonton Warriors', goals: 34, assists: 26, points: 60, games: null },
    ],
  },
  {
    id: 'central',
    awardName: null,
    division: 'Central Division',
    entries: [
      { year: 2025, jersey: '#24', name: 'Cash Banister', team: 'Calgary Chill', goals: 29, assists: 48, points: 77, games: 15 },
      { year: 2024, jersey: '#12', name: 'Isaac Tisdale', team: 'Red Deer Rampage', goals: 41, assists: 59, points: 100, games: 20 },
      { year: 2023, jersey: '#7', name: 'Quaid Bolger', team: 'Calgary Chill', goals: 45, assists: 54, points: 99, games: 19 },
      { year: 2022, jersey: '#17', name: 'Nolan Oakey', team: 'Rockyview Silvertips', goals: 52, assists: 55, points: 107, games: 16 },
      { year: 2019, jersey: '#17', name: 'Nolan Oakey', team: 'Rockyview Silvertips', goals: 32, assists: 60, points: 92, games: 20 },
      { year: 2018, jersey: '#89', name: 'Joey Gardner', team: 'Calgary Chill', goals: 37, assists: 69, points: 106, games: 20 },
    ],
  },
  {
    id: 'east',
    awardName: null,
    division: 'East Division',
    entries: [
      { year: 2025, jersey: '#2', name: 'Ryan McDonald', team: 'Queen City Kings', goals: 30, assists: 31, points: 61, games: 12 },
      { year: 2024, jersey: '#2', name: 'Ryan McDonald', team: 'Queen City Kings', goals: 68, assists: 35, points: 103, games: 20 },
      { year: 2023, jersey: '#23', name: 'Jackson Klewchuk', team: 'Winnipeg Blizzard', goals: 49, assists: 56, points: 105, games: 19 },
      { year: 2022, jersey: '#23', name: 'Jackson Klewchuk', team: 'Manitoba Blizzard', goals: 63, assists: 40, points: 103, games: 18 },
      { year: 2019, jersey: '#6', name: 'Blaze Bezecki', team: 'Manitoba Blizzard', goals: 35, assists: 23, points: 58, games: 18 },
      { year: 2018, jersey: '#23', name: 'Kelson Borisenko', team: 'Manitoba Blizzard', goals: 37, assists: 45, points: 82, games: 14 },
    ],
  },
  {
    id: 'overall',
    awardName: 'Jim Burke Award',
    division: 'Overall',
    entries: [
      { year: 2025, jersey: '#20', name: 'Joshua Fodchuk', team: 'St. Albert Crude', goals: 44, assists: 41, points: 85, games: 18 },
      { year: 2024, jersey: '#2', name: 'Ryan McDonald', team: 'Queen City Kings', goals: 68, assists: 35, points: 103, games: 20 },
      { year: 2023, jersey: '#23', name: 'Jackson Klewchuk', team: 'Winnipeg Blizzard', goals: 49, assists: 56, points: 105, games: 19 },
      { year: 2022, jersey: '#23', name: 'Joseph Royer', team: 'Edmonton Warriors', goals: 35, assists: 84, points: 119, games: 19 },
      { year: 2022, jersey: '#23', name: 'Jaxson Geddes', team: 'Calgary Shamrocks', goals: 67, assists: 52, points: 119, games: 20 },
      { year: 2019, jersey: '#7', name: 'Markus Fouillard', team: 'Fort Saskatchewan Rebels', goals: 51, assists: 52, points: 103, games: 18 },
      { year: 2018, jersey: '#21', name: 'Tyler Sonnichsen', team: 'Edmonton Warriors', goals: 74, assists: 64, points: 138, games: 18 },
      { year: 2017, jersey: '#8', name: 'Colby Fraser', team: 'Calgary Shamrocks', goals: 52, assists: 53, points: 105, games: 20 },
      { year: 2016, jersey: '#23', name: 'Kelson Borisenko', team: 'Manitoba Blizzard', goals: 56, assists: 50, points: 106, games: 20 },
      { year: 2015, jersey: '#20', name: 'Baden Boyenko', team: 'Saskatchewan SWAT', goals: 68, assists: 53, points: 121, games: 20 },
      { year: 2014, jersey: '#27', name: 'Lyndon Bunio', team: 'Calgary Chill', goals: 60, assists: 63, points: 123, games: 18 },
      { year: 2013, jersey: '#12', name: 'Sean Tyrrell', team: 'Calgary Jr. B Mountaineers', goals: 41, assists: 60, points: 101, games: 19 },
      { year: 2012, jersey: '#6', name: 'Adam Wild', team: 'Sherwood Park Titans', goals: 44, assists: 47, points: 91, games: 15 },
      { year: 2011, jersey: '#10', name: 'Chris Britton', team: 'Edmonton Warriors', goals: 35, assists: 84, points: 119, games: 19 },
      { year: 2010, jersey: undefined, name: 'Dallas Smith', team: 'Sherwood Park Titans', goals: 14, assists: 39, points: 53, games: 18 },
      { year: 2009, jersey: undefined, name: 'Adam Stuckless', team: 'Edmonton Warriors', goals: 34, assists: 26, points: 60, games: null },
      { year: 2006, jersey: undefined, name: 'Joel Henry', team: 'Rockyview Silvertips', goals: null, assists: null, points: 93, games: null },
      { year: 2005, jersey: undefined, name: 'Jesse Draper', team: 'Sherwood Park Titans', goals: null, assists: null, points: 61, games: null },
      { year: 2004, jersey: undefined, name: 'Dean Materi', team: 'Edmonton Warriors', goals: null, assists: null, points: 98, games: null },
      { year: 2003, jersey: undefined, name: 'Dean Materi', team: 'Edmonton Warriors', goals: null, assists: null, points: 70, games: null },
      { year: 2002, jersey: undefined, name: 'Colin Sherbanuk', team: 'Edmonton Miners', goals: null, assists: null, points: 93, games: null },
      { year: 2001, jersey: undefined, name: 'Rob McGowan', team: 'Calgary Jr. Mountaineers', goals: null, assists: null, points: 36, games: null },
      { year: 2000, jersey: undefined, name: 'Brad Scott', team: 'Edmonton Miners', goals: null, assists: null, points: 60, games: null },
    ],
  },
];

type FilterId = 'all' | 'south' | 'north' | 'central' | 'east' | 'overall';

const FILTERS: { id: FilterId; label: string; shortLabel: string }[] = [
  { id: 'all', label: 'All Awards', shortLabel: 'All' },
  { id: 'south', label: 'South Division', shortLabel: 'South' },
  { id: 'north', label: 'North Division', shortLabel: 'North' },
  { id: 'east', label: 'East Division', shortLabel: 'East' },
  { id: 'overall', label: 'Overall', shortLabel: 'Overall' },
  { id: 'central', label: 'Central Division', shortLabel: 'Central' },
];

/* --- Table Component --- */

function AwardTable({ award }: { award: DivisionAward }) {
  const title = award.awardName
    ? `${award.awardName} - ${award.division} Regular Season Point Leader`
    : `${award.division} Regular Season Point Leader`;

  // Determine if any entries have detailed stats (goals/assists/games)
  const hasDetailedStats = award.entries.some(e => e.goals !== null);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Table Header */}
      <div className="bg-[#013fac] px-4 py-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-white shrink-0" />
          <h4 className="text-sm sm:text-base font-bold text-white">{title}</h4>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left font-bold text-gray-700 border-b border-gray-200 w-16">Year</th>
              <th className="px-3 py-2 text-center font-bold text-gray-700 border-b border-gray-200 w-12">#</th>
              <th className="px-3 py-2 text-left font-bold text-gray-700 border-b border-gray-200">Player</th>
              <th className="px-3 py-2 text-left font-bold text-gray-700 border-b border-gray-200 hidden sm:table-cell">Team</th>
              {hasDetailedStats && (
                <>
                  <th className="px-3 py-2 text-center font-bold text-gray-700 border-b border-gray-200 w-12 hidden md:table-cell">G</th>
                  <th className="px-3 py-2 text-center font-bold text-gray-700 border-b border-gray-200 w-12 hidden md:table-cell">A</th>
                </>
              )}
              <th className="px-3 py-2 text-center font-bold text-gray-700 border-b border-gray-200 w-14">PTS</th>
              {hasDetailedStats && (
                <th className="px-3 py-2 text-center font-bold text-gray-700 border-b border-gray-200 w-14 hidden lg:table-cell">GP</th>
              )}
            </tr>
          </thead>
          <tbody>
            {award.entries.map((entry, i) => {
              const isFirst = i === 0;
              return (
                <tr
                  key={`${entry.year}-${entry.name}`}
                  className={`
                    ${isFirst ? 'bg-amber-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    hover:bg-blue-50 transition-colors
                  `}
                >
                  <td className={`px-3 py-2 border-b border-gray-100 font-bold tabular-nums ${isFirst ? 'text-[#013fac]' : 'text-gray-900'}`}>
                    {entry.year}
                  </td>
                  <td className="px-3 py-2 border-b border-gray-100 text-center text-gray-500 tabular-nums">
                    {entry.jersey || '-'}
                  </td>
                  <td className="px-3 py-2 border-b border-gray-100">
                    <div>
                      <span className={`font-semibold ${isFirst ? 'text-[#013fac]' : 'text-gray-900'}`}>
                        {entry.name}
                      </span>
                      {isFirst && (
                        <span className="ml-1.5 text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full font-bold uppercase">
                          Current
                        </span>
                      )}
                      <span className="text-gray-500 text-xs sm:hidden block mt-0.5">{entry.team}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 border-b border-gray-100 text-gray-600 hidden sm:table-cell">
                    {entry.team}
                  </td>
                  {hasDetailedStats && (
                    <>
                      <td className="px-3 py-2 border-b border-gray-100 text-center tabular-nums text-gray-700 hidden md:table-cell">
                        {entry.goals ?? '-'}
                      </td>
                      <td className="px-3 py-2 border-b border-gray-100 text-center tabular-nums text-gray-700 hidden md:table-cell">
                        {entry.assists ?? '-'}
                      </td>
                    </>
                  )}
                  <td className={`px-3 py-2 border-b border-gray-100 text-center tabular-nums font-bold ${isFirst ? 'text-[#013fac]' : 'text-gray-900'}`}>
                    {entry.points}
                  </td>
                  {hasDetailedStats && (
                    <td className="px-3 py-2 border-b border-gray-100 text-center tabular-nums text-gray-500 hidden lg:table-cell">
                      {entry.games ?? '-'}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* --- Main Component --- */

export function PointLeaderAwards() {
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');

  const filteredAwards = activeFilter === 'all'
    ? [...DIVISION_AWARDS].sort((a, b) => {
        // When showing all, move central to the end
        if (a.id === 'central') return 1;
        if (b.id === 'central') return -1;
        return 0;
      })
    : DIVISION_AWARDS.filter(a => a.id === activeFilter);

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-red-50 border-2 border-[#013fac] rounded-lg p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <Trophy className="w-7 h-7 text-[#013fac] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Junior B Tier 1 - Regular Season Point Leaders
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Divisional and overall regular season scoring champions, recognized annually since the league's early years.
            </p>
          </div>
        </div>
      </div>

      {/* Division Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-gray-400 shrink-0" />
        <div className="flex gap-1 sm:gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`
                px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all
                ${activeFilter === f.id
                  ? 'bg-[#013fac] text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              <span className="sm:hidden">{f.shortLabel}</span>
              <span className="hidden sm:inline">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Award Tables */}
      <div className="space-y-6">
        {filteredAwards.map(award => (
          <AwardTable key={award.id} award={award} />
        ))}
      </div>
    </div>
  );
}