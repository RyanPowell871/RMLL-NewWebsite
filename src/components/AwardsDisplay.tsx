import React from 'react';
import { Card } from './ui/card';
import { Trophy, Award, TrendingUp, ChevronUp, ChevronDown, ChevronsUpDown, Star } from 'lucide-react';

interface PointLeaderRecipient {
  year: string;
  player: string;
  team: string;
  stats: string;
  points: number;
  games: number | null;
  conference?: string | null;
}

interface AwardRecipient {
  year: string;
  player: string;
  team: string;
  players?: string; // For team awards like First Team, Second Team
}

interface DivisionAward {
  name: string;
  recipients?: AwardRecipient[];
  winners?: AwardRecipient[]; // Junior A format
}

interface Legacy2009Award {
  name: string;
  player: string;
  team: string;
}

interface AwardsData {
  pointLeaders?: {
    title: string;
    description?: string;
    award?: string; // Junior A format
    note?: string;
    recipients?: PointLeaderRecipient[];
    winners?: Array<{ // Junior A format
      year: string;
      player: string;
      team: string;
      stats: string;
    }>;
  };
  divisionAwards?: {
    title?: string; // Junior A format
    description?: string;
    awards?: DivisionAward[];
    categories?: DivisionAward[]; // Junior A format
    legacy2009?: {
      title: string;
      awards: Legacy2009Award[];
    };
  };
  tournaments?: {
    description: string;
    events: Array<{
      year: string;
      name: string;
      trophy: string;
      result: string;
    }>;
  };
}

interface AwardsDisplayProps {
  data: string | AwardsData | any;
}

export function AwardsDisplay({ data }: AwardsDisplayProps) {
  const [sortColumn, setSortColumn] = React.useState<'year' | 'player' | 'team'>('year');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
  const [activeConference, setActiveConference] = React.useState<'north' | 'south'>('north');
  
  let awardsData: AwardsData | any;
  
  try {
    // Handle both string and object inputs
    awardsData = typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <div className="p-6">
          <p className="text-sm text-gray-600 italic">Awards information will be updated soon...</p>
        </div>
      </Card>
    );
  }

  // Check if this is a conference-based format (Junior B Tier II)
  const hasConferences = awardsData.north && awardsData.south;
  
  // If conference-based, use the active conference's data
  const conferenceData = hasConferences ? awardsData[activeConference] : null;

  // Check if it's an array of generic sections (title, subtitle, content format)
  if (Array.isArray(awardsData)) {
    return (
      <div className="space-y-4">
        {awardsData.map((section, idx) => (
          <Card key={idx} className="border border-gray-200 shadow-sm overflow-hidden">
            <div className={`${
              idx % 2 === 0 
                ? 'bg-gradient-to-r from-[#DC2626] to-[#991b1b]' 
                : 'bg-gradient-to-r from-[#013fac] to-[#0F2942]'
            } text-white p-3`}>
              <h3 className="text-sm uppercase tracking-wide font-bold" style={{ fontFamily: 'var(--font-secondary)' }}>
                {section.title}
              </h3>
              {section.subtitle && (
                <p className="text-xs text-white/80 mt-1">{section.subtitle}</p>
              )}
            </div>
            <div className="p-4">
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {section.content}
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Determine if this is Junior A format (has winners instead of recipients)
  const isJuniorAFormat = Boolean(awardsData.pointLeaders?.winners);
  
  // Sorting function
  const handleSort = (column: 'year' | 'player' | 'team') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'year' ? 'desc' : 'asc');
    }
  };

  // Sort icon component
  const SortIcon = ({ column }: { column: 'year' | 'player' | 'team' }) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-3.5 h-3.5 text-[#DC2626]" /> : 
      <ChevronDown className="w-3.5 h-3.5 text-[#DC2626]" />;
  };

  // Sort winners for Junior A format
  const sortedWinners = isJuniorAFormat && awardsData.pointLeaders?.winners ? 
    [...awardsData.pointLeaders.winners].sort((a, b) => {
      let comparison = 0;
      
      switch (sortColumn) {
        case 'year':
          comparison = parseInt(a.year) - parseInt(b.year);
          break;
        case 'player':
          comparison = a.player.localeCompare(b.player);
          break;
        case 'team':
          comparison = a.team.localeCompare(b.team);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    }) : [];

  // Sort recipients for Senior B format
  const sortedRecipients = !isJuniorAFormat && awardsData.pointLeaders?.recipients ? 
    [...awardsData.pointLeaders.recipients].sort((a, b) => {
      let comparison = 0;
      
      switch (sortColumn) {
        case 'year':
          comparison = parseInt(a.year) - parseInt(b.year);
          break;
        case 'player':
          comparison = a.player.localeCompare(b.player);
          break;
        case 'team':
          comparison = a.team.localeCompare(b.team);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    }) : [];

  // Get the division awards (either awards or categories)
  const divisionAwardsList = awardsData.divisionAwards?.awards || awardsData.divisionAwards?.categories || [];

  return (
    <div className="space-y-6">
      {/* Season Point Leaders Section */}
      {awardsData.pointLeaders && (
        <div className="space-y-4">
          <Card className="border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#DC2626] to-[#991b1b] text-white p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6" />
                <div className="flex-1">
                  <h3 className="text-base uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>
                    {awardsData.pointLeaders.title}
                  </h3>
                  {awardsData.pointLeaders.award && (
                    <p className="text-xs text-white/90 mt-1 font-semibold">{awardsData.pointLeaders.award}</p>
                  )}
                  {awardsData.pointLeaders.description && (
                    <p className="text-xs text-white/80 mt-1">{awardsData.pointLeaders.description}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-5">
              {/* Note removed — point leaders are CMS-managed */}
              
              {/* Point Leaders Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th 
                        className="text-left py-3 px-2 text-xs font-bold text-gray-700 uppercase tracking-wide cursor-pointer hover:bg-gray-50 transition-colors select-none" 
                        style={{ fontFamily: 'var(--font-secondary)' }}
                        onClick={() => handleSort('year')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Year</span>
                          <SortIcon column="year" />
                        </div>
                      </th>
                      {hasConferences && (
                        <th className="text-left py-3 px-2 text-xs font-bold text-gray-700 uppercase tracking-wide hidden sm:table-cell" style={{ fontFamily: 'var(--font-secondary)' }}>Conference</th>
                      )}
                      <th 
                        className="text-left py-3 px-2 text-xs font-bold text-gray-700 uppercase tracking-wide cursor-pointer hover:bg-gray-50 transition-colors select-none" 
                        style={{ fontFamily: 'var(--font-secondary)' }}
                        onClick={() => handleSort('player')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Player</span>
                          <SortIcon column="player" />
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-2 text-xs font-bold text-gray-700 uppercase tracking-wide cursor-pointer hover:bg-gray-50 transition-colors select-none" 
                        style={{ fontFamily: 'var(--font-secondary)' }}
                        onClick={() => handleSort('team')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Team</span>
                          <SortIcon column="team" />
                        </div>
                      </th>
                      <th className="text-left py-3 px-2 text-xs font-bold text-gray-700 uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>Stats</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isJuniorAFormat ? (
                      // Junior A Format
                      sortedWinners.map((winner, idx) => (
                        <tr 
                          key={idx}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-2 text-sm font-bold text-[#DC2626]">{winner.year}</td>
                          <td className="py-3 px-2 text-sm font-semibold text-gray-900">{winner.player}</td>
                          <td className="py-3 px-2 text-sm text-gray-700">{winner.team}</td>
                          <td className="py-3 px-2 text-sm text-gray-600">{winner.stats}</td>
                        </tr>
                      ))
                    ) : (
                      // Senior B Format
                      sortedRecipients.map((recipient, idx) => (
                        <tr 
                          key={idx}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-2 text-sm font-bold text-[#DC2626]">{recipient.year}</td>
                          {hasConferences && (
                            <td className="py-3 px-2 text-sm font-semibold text-gray-700 hidden sm:table-cell">
                              {recipient.conference && (
                                <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded ${
                                  recipient.conference === 'North' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {recipient.conference}
                                </span>
                              )}
                            </td>
                          )}
                          <td className="py-3 px-2 text-sm font-semibold text-gray-900">{recipient.player}</td>
                          <td className="py-3 px-2 text-sm text-gray-700">{recipient.team}</td>
                          <td className="py-3 px-2 text-sm text-gray-600">{recipient.stats}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Division Awards Section */}
      {awardsData.divisionAwards && divisionAwardsList.length > 0 && (
        <div className="space-y-4">
          <Card className="border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#013fac] to-[#0F2942] text-white p-4">
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6" />
                <div>
                  <h3 className="text-base uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>
                    {awardsData.divisionAwards.title || 'Division Annual Awards'}
                  </h3>
                  {awardsData.divisionAwards.description && (
                    <p className="text-xs text-white/80 mt-1">{awardsData.divisionAwards.description}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {divisionAwardsList
                  .filter(award => {
                    const awardName = award.name || award.title || '';
                    return awardName !== 'Jim Burke Award';
                  })
                  .map((award, idx) => {
                  const awardWinners = award.recipients || award.winners || [];
                  
                  // Handle old format with title/subtitle/content
                  const awardName = award.name || award.title || '';
                  const awardSubtitle = award.subtitle || '';
                  const awardContent = award.content || '';
                  
                  return (
                    <Card key={idx} className="border-l-4 border-l-[#DC2626] shadow-sm bg-white">
                      <div className="p-4">
                        <div className="flex items-start gap-2 mb-3">
                          <Trophy className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
                          <h4 className="text-sm font-bold text-gray-900 uppercase" style={{ fontFamily: 'var(--font-secondary)' }}>
                            {awardName}
                          </h4>
                        </div>
                        {awardSubtitle && (
                          <p className="text-xs text-gray-600 font-semibold mb-2">{awardSubtitle}</p>
                        )}
                        {awardContent ? (
                          <div className="text-xs text-gray-700 whitespace-pre-line">{awardContent}</div>
                        ) : (
                        <div className="space-y-2">
                          {awardWinners.map((winner, ridx) => (
                            <div 
                              key={ridx}
                              className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0"
                            >
                              <div className="flex-1">
                                {winner.players ? (
                                  // Team award format (First Team, Second Team)
                                  <p className="text-sm text-gray-700">{winner.players}</p>
                                ) : (
                                  // Individual award format
                                  <>
                                    <p className="text-sm font-semibold text-gray-900">{winner.player}</p>
                                    <p className="text-xs text-gray-600">{winner.team}</p>
                                  </>
                                )}
                              </div>
                              <span className="text-xs font-bold text-[#DC2626] ml-2">{winner.year}</span>
                            </div>
                          ))}
                        </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Legacy 2009 Awards */}
          {awardsData.divisionAwards.legacy2009 && (
            <Card className="border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-[#DC2626] to-[#991b1b] text-white p-4">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6" />
                  <h3 className="text-base uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>
                    {awardsData.divisionAwards.legacy2009.title}
                  </h3>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {awardsData.divisionAwards.legacy2009.awards.map((award, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <p className="text-xs font-bold text-gray-700 uppercase mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                        {award.name}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">{award.player}</p>
                      <p className="text-xs text-gray-600">{award.team}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tournaments Section */}
      {awardsData.tournaments && (
        <div className="space-y-4">
          <Card className="border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#DC2626] to-[#991b1b] text-white p-4">
              <div className="flex items-center gap-3">
                <Star className="w-6 h-6" />
                <div>
                  <h3 className="text-base uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>
                    Tournaments
                  </h3>
                  <p className="text-xs text-white/80 mt-1">{awardsData.tournaments.description}</p>
                </div>
              </div>
            </div>
            
            <div className="p-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {awardsData.tournaments.events.map((event, idx) => (
                  <Card key={idx} className="border-l-4 border-l-[#DC2626] shadow-sm bg-white">
                    <div className="p-4">
                      <div className="flex items-start gap-2 mb-3">
                        <Trophy className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                            {event.name}
                          </h4>
                          <p className="text-xs font-bold text-gray-700">{event.trophy}</p>
                        </div>
                        <span className="text-xs font-bold text-[#DC2626]">{event.year}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-sm text-gray-700">{event.result}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}