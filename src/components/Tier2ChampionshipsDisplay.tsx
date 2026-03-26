import React from 'react';
import { Card } from './ui/card';
import { Trophy, Award, Medal } from 'lucide-react';

interface ChampionResult {
  year: string;
  gold: string;
  silver: string | null;
  bronze: string | null;
  host?: string;
}

interface ConferenceChampion {
  year: string;
  team: string;
}

interface Subdivision {
  title: string;
  champions: ConferenceChampion[];
}

interface ConferenceChampionships {
  conferenceName: string;
  champions: ConferenceChampion[];
  subdivisions?: Subdivision[];
}

interface Tier2ChampionshipsData {
  provincial: {
    title: string;
    trophy: {
      name: string;
      description: string;
    };
    results: ChampionResult[];
  };
  north: ConferenceChampionships;
  south: ConferenceChampionships;
}

interface Tier2ChampionshipsDisplayProps {
  data: string;
}

export function Tier2ChampionshipsDisplay({ data }: Tier2ChampionshipsDisplayProps) {
  const [activeConference, setActiveConference] = React.useState<'north' | 'south'>('north');
  
  let championshipsData: Tier2ChampionshipsData;
  
  try {
    championshipsData = JSON.parse(data);
  } catch (e) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <div className="p-6">
          <p className="text-sm text-gray-600 italic">Championships information will be updated soon...</p>
        </div>
      </Card>
    );
  }

  // Validate data structure
  if (!championshipsData || !championshipsData.provincial || !championshipsData.north || !championshipsData.south) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <div className="p-6">
          <p className="text-sm text-gray-600 italic">Championships information will be updated soon...</p>
        </div>
      </Card>
    );
  }

  const conferenceData = championshipsData[activeConference];

  return (
    <div className="space-y-6">
      {/* Provincial Championships - Always visible */}
      <Card className="border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#DC2626] to-[#991b1b] text-white p-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6" />
            <div>
              <h3 className="text-base uppercase tracking-wide font-bold" style={{ fontFamily: 'var(--font-secondary)' }}>
                {championshipsData.provincial.title}
              </h3>
              <p className="text-xs text-white/90 mt-1">{championshipsData.provincial.trophy.name}</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="bg-blue-50 border-l-4 border-[#013fac] p-4 mb-5">
            <p className="text-sm text-gray-700 leading-relaxed">
              {championshipsData.provincial.trophy.description}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2 text-xs font-bold text-gray-700 uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>Year</th>
                  <th className="text-left py-3 px-2 text-xs font-bold text-gray-700 uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>Gold</th>
                  <th className="text-left py-3 px-2 text-xs font-bold text-gray-700 uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>Silver</th>
                  <th className="text-left py-3 px-2 text-xs font-bold text-gray-700 uppercase tracking-wide hidden sm:table-cell" style={{ fontFamily: 'var(--font-secondary)' }}>Bronze</th>
                  <th className="text-left py-3 px-2 text-xs font-bold text-gray-700 uppercase tracking-wide hidden md:table-cell" style={{ fontFamily: 'var(--font-secondary)' }}>Host</th>
                </tr>
              </thead>
              <tbody>
                {championshipsData.provincial.results.map((result, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-2 text-sm font-bold text-[#DC2626]">{result.year}</td>
                    <td className="py-3 px-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Medal className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        <span className="font-semibold text-gray-900">{result.gold}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm">
                      {result.silver ? (
                        <div className="flex items-center gap-2">
                          <Medal className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-700">{result.silver}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-sm hidden sm:table-cell">
                      {result.bronze ? (
                        <div className="flex items-center gap-2">
                          <Medal className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span className="text-gray-700">{result.bronze}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600 hidden md:table-cell">
                      {result.host || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Conference Tabs */}
      <div>
        <div className="flex gap-2 border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveConference('north')}
            className={`px-4 py-2 text-sm font-bold uppercase tracking-wide transition-colors border-b-2 ${
              activeConference === 'north'
                ? 'border-[#013fac] text-[#013fac]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={{ fontFamily: 'var(--font-secondary)' }}
          >
            {championshipsData.north.conferenceName}
          </button>
          <button
            onClick={() => setActiveConference('south')}
            className={`px-4 py-2 text-sm font-bold uppercase tracking-wide transition-colors border-b-2 ${
              activeConference === 'south'
                ? 'border-[#DC2626] text-[#DC2626]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={{ fontFamily: 'var(--font-secondary)' }}
          >
            {championshipsData.south.conferenceName}
          </button>
        </div>

        {/* Conference Champions */}
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <div className={`bg-gradient-to-r ${
            activeConference === 'north' 
              ? 'from-[#013fac] to-[#0F2942]' 
              : 'from-[#DC2626] to-[#991b1b]'
          } text-white p-4`}>
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6" />
              <h3 className="text-base uppercase tracking-wide font-bold" style={{ fontFamily: 'var(--font-secondary)' }}>
                {conferenceData.conferenceName} Champions
              </h3>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {conferenceData.champions.map((champion, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg border-2 ${
                    activeConference === 'north'
                      ? 'bg-blue-50 border-[#013fac]/20 hover:border-[#013fac] hover:shadow-md'
                      : 'bg-red-50 border-[#DC2626]/20 hover:border-[#DC2626] hover:shadow-md'
                  } transition-all`}
                >
                  <p className={`text-xs font-bold mb-1 ${
                    activeConference === 'north' ? 'text-[#013fac]' : 'text-[#DC2626]'
                  }`} style={{ fontFamily: 'var(--font-secondary)' }}>
                    {champion.year}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    {champion.team}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Subdivision Champions */}
        {conferenceData.subdivisions && conferenceData.subdivisions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {conferenceData.subdivisions.map((subdivision, idx) => (
              <Card key={idx} className={`border border-gray-200 shadow-sm overflow-hidden border-l-4 ${
                activeConference === 'north' ? 'border-l-[#013fac]' : 'border-l-[#DC2626]'
              }`}>
                <div className={`bg-gradient-to-r ${
                  activeConference === 'north' 
                    ? 'from-[#013fac]/10 to-[#0F2942]/10' 
                    : 'from-[#DC2626]/10 to-[#991b1b]/10'
                } p-3 border-b border-gray-200`}>
                  <h4 className="text-sm uppercase tracking-wide font-bold text-gray-900" style={{ fontFamily: 'var(--font-secondary)' }}>
                    {subdivision.title}
                  </h4>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    {subdivision.champions.map((champion, cidx) => (
                      <div 
                        key={cidx}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <span className="text-sm font-semibold text-gray-900">{champion.team}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          activeConference === 'north' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {champion.year}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}