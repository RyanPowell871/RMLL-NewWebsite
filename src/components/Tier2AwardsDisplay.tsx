import React from 'react';
import { Card } from './ui/card';
import { Trophy, TrendingUp, Star } from 'lucide-react';

interface AllStarPlayer {
  position: string;
  player: string;
  team: string;
}

interface ConferenceAwardsData {
  conferenceName: string;
  pointLeaders: {
    title: string;
    recipients: Array<{
      year: string;
      player: string;
      team: string;
      stats: string;
      points: number;
      games: number | null;
      note?: string;
    }>;
  };
  allStarTeams: {
    title: string;
    firstTeam: {
      title: string;
      year: string;
      players: AllStarPlayer[];
    };
    secondTeam: {
      title: string;
      year: string;
      players: AllStarPlayer[];
      honourableMention?: string;
    };
  };
}

interface Tier2AwardsData {
  north: ConferenceAwardsData;
  south: ConferenceAwardsData;
}

interface Tier2AwardsDisplayProps {
  data: string;
}

export function Tier2AwardsDisplay({ data }: Tier2AwardsDisplayProps) {
  const [activeConference, setActiveConference] = React.useState<'north' | 'south'>('north');
  
  let awardsData: Tier2AwardsData;
  
  try {
    awardsData = JSON.parse(data);
  } catch (e) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <div className="p-6">
          <p className="text-sm text-gray-600 italic">Awards information will be updated soon...</p>
        </div>
      </Card>
    );
  }

  // Validate data structure
  if (!awardsData || !awardsData.north || !awardsData.south) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <div className="p-6">
          <p className="text-sm text-gray-600 italic">Awards information will be updated soon...</p>
        </div>
      </Card>
    );
  }

  const conferenceData = awardsData[activeConference];

  return (
    <div className="space-y-6">
      {/* Conference Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveConference('north')}
          className={`px-4 py-2 text-sm font-bold uppercase tracking-wide transition-colors border-b-2 ${
            activeConference === 'north'
              ? 'border-[#013fac] text-[#013fac]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          style={{ fontFamily: 'var(--font-secondary)' }}
        >
          {awardsData.north.conferenceName}
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
          {awardsData.south.conferenceName}
        </button>
      </div>

      {/* Point Leaders */}
      <Card className="border border-gray-200 shadow-sm overflow-hidden">
        <div className={`bg-gradient-to-r ${
          activeConference === 'north' 
            ? 'from-[#013fac] to-[#0F2942]' 
            : 'from-[#DC2626] to-[#991b1b]'
        } text-white p-4`}>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6" />
            <h3 className="text-base uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>
              {conferenceData.pointLeaders.title}
            </h3>
          </div>
        </div>
        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2 text-xs font-bold text-gray-700 uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>Year</th>
                  <th className="text-left py-3 px-2 text-xs font-bold text-gray-700 uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>Player</th>
                  <th className="text-left py-3 px-2 text-xs font-bold text-gray-700 uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>Team</th>
                  <th className="text-left py-3 px-2 text-xs font-bold text-gray-700 uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>Stats</th>
                  <th className="text-right py-3 px-2 text-xs font-bold text-gray-700 uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>Points</th>
                  <th className="text-right py-3 px-2 text-xs font-bold text-gray-700 uppercase tracking-wide hidden sm:table-cell" style={{ fontFamily: 'var(--font-secondary)' }}>GP</th>
                </tr>
              </thead>
              <tbody>
                {conferenceData.pointLeaders.recipients.map((recipient, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className={`py-3 px-2 text-sm font-bold ${activeConference === 'north' ? 'text-[#013fac]' : 'text-[#DC2626]'}`}>
                      {recipient.year}
                    </td>
                    <td className="py-3 px-2 text-sm font-semibold text-gray-900">{recipient.player}</td>
                    <td className="py-3 px-2 text-sm text-gray-700">{recipient.team}</td>
                    <td className="py-3 px-2 text-sm text-gray-600">
                      {recipient.stats}
                      {recipient.note && (
                        <span className="block text-xs text-gray-500 italic mt-0.5">{recipient.note}</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-sm font-bold text-gray-900 text-right">{recipient.points}</td>
                    <td className="py-3 px-2 text-sm text-gray-600 text-right hidden sm:table-cell">{recipient.games || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* All-Star Teams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* First Team */}
        <Card className={`border border-gray-200 shadow-sm overflow-hidden border-l-4 ${
          activeConference === 'north' ? 'border-l-[#013fac]' : 'border-l-[#DC2626]'
        }`}>
          <div className={`bg-gradient-to-r ${
            activeConference === 'north' 
              ? 'from-[#013fac] to-[#0F2942]' 
              : 'from-[#DC2626] to-[#991b1b]'
          } text-white p-3`}>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              <div>
                <h4 className="text-sm uppercase tracking-wide font-bold" style={{ fontFamily: 'var(--font-secondary)' }}>
                  {conferenceData.allStarTeams.firstTeam.title}
                </h4>
                <p className="text-xs text-white/80 mt-0.5">{conferenceData.allStarTeams.firstTeam.year}</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {conferenceData.allStarTeams.firstTeam.players.map((player, idx) => (
                <div key={idx} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    activeConference === 'north' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {player.position}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{player.player}</p>
                    <p className="text-xs text-gray-600">{player.team}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Second Team */}
        <Card className={`border border-gray-200 shadow-sm overflow-hidden border-l-4 ${
          activeConference === 'north' ? 'border-l-[#013fac]' : 'border-l-[#DC2626]'
        }`}>
          <div className={`bg-gradient-to-r ${
            activeConference === 'north' 
              ? 'from-[#013fac]/80 to-[#0F2942]/80' 
              : 'from-[#DC2626]/80 to-[#991b1b]/80'
          } text-white p-3`}>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              <div>
                <h4 className="text-sm uppercase tracking-wide font-bold" style={{ fontFamily: 'var(--font-secondary)' }}>
                  {conferenceData.allStarTeams.secondTeam.title}
                </h4>
                <p className="text-xs text-white/80 mt-0.5">{conferenceData.allStarTeams.secondTeam.year}</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {conferenceData.allStarTeams.secondTeam.players.map((player, idx) => (
                <div key={idx} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    activeConference === 'north' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {player.position}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{player.player}</p>
                    <p className="text-xs text-gray-600">{player.team}</p>
                  </div>
                </div>
              ))}
              {conferenceData.allStarTeams.secondTeam.honourableMention && (
                <div className="pt-2 mt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    <span className="font-bold">Honourable Mention:</span> {conferenceData.allStarTeams.secondTeam.honourableMention}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}