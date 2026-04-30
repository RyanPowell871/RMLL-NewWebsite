import { Trophy, Target, Shield, User, Loader2 } from 'lucide-react';
import { useDivision } from '../contexts/DivisionContext';
import { useNavigation } from '../contexts/NavigationContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useState, useEffect, useMemo } from 'react';
import { useHomepageStats } from '../hooks/useHomepageStats';
import { LeaguePlayerStat } from '../hooks/useLeagueStats';
import { getTeamLogo } from '../utils/team-logos';
import { ImageWithFallback } from './figma/ImageWithFallback';

const TOP_N = 5;
const MIN_GP_SKATERS = 1;
const MIN_GP_GOALIES = 1;

interface LeaderEntry {
  rank: number;
  name: string;
  team: string;
  teamLogo: string;
  stat: string;
  label: string;
  image?: string;
  playerId: number;
  photoDocId?: number;
  isGoalie?: boolean;
}

interface LeaderCategory {
  title: string;
  icon: typeof Trophy;
  players: LeaderEntry[];
}

export function LeagueLeaders() {
  const { selectedDivision: favoriteDivision, selectedSubDivision: favoriteSubDivision, divisions, subDivisions } = useDivision();
  const { navigateTo } = useNavigation();
  const [selectedDivision, setSelectedDivision] = useState(() =>
    favoriteDivision || 'All Divisions'
  );
  const [selectedSubDivision, setSelectedSubDivision] = useState(() =>
    favoriteSubDivision || 'All'
  );

  // Update local division when favorite changes
  useEffect(() => {
    setSelectedDivision(favoriteDivision);
    setSelectedSubDivision(favoriteSubDivision);
  }, [favoriteDivision, favoriteSubDivision]);

  // Fetch stats with automatic season fallback (e.g. 2026 → 2025 if no data yet)
  const { players, goalies, loading, seasonLabel } = useHomepageStats(selectedDivision, selectedSubDivision);

  // Build leader categories from real data
  const categories = useMemo((): LeaderCategory[] => {
    if (players.length === 0 && goalies.length === 0) return [];

    const qualifiedPlayers = players.filter(p => p.gamesPlayed >= MIN_GP_SKATERS);
    const qualifiedGoalies = goalies.filter(g => g.gamesPlayed >= MIN_GP_GOALIES);

    const mapToEntry = (
      list: LeaguePlayerStat[],
      statFn: (p: LeaguePlayerStat) => string,
      label: string
    ): LeaderEntry[] => {
      return list.slice(0, TOP_N).map((p, i) => ({
        rank: i + 1,
        name: p.player,
        team: p.team,
        teamLogo: getTeamLogo(p.team, p.teamLogoUrl),
        stat: statFn(p),
        label,
        image: p.avatar,
        playerId: p.playerId,
        photoDocId: p.photoDocId,
      }));
    };

    // Points Leaders
    const pointsSorted = [...qualifiedPlayers].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goals !== a.goals) return b.goals - a.goals;
      return a.gamesPlayed - b.gamesPlayed; // Fewer GP is more impressive at same points
    });

    // Goal Scorers
    const goalsSorted = [...qualifiedPlayers].sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      if (b.points !== a.points) return b.points - a.points;
      return a.gamesPlayed - b.gamesPlayed;
    });

    // Top Goalies by Save %
    const goalieSorted = [...qualifiedGoalies].sort((a, b) => {
      if (b.savePercentage !== a.savePercentage) return b.savePercentage - a.savePercentage;
      return b.wins - a.wins;
    });

    const result: LeaderCategory[] = [];

    if (pointsSorted.length > 0) {
      result.push({
        title: 'Points Leaders',
        icon: Trophy,
        players: mapToEntry(pointsSorted, p => p.points.toString(), 'PTS'),
      });
    }

    if (goalsSorted.length > 0) {
      result.push({
        title: 'Goal Scorers',
        icon: Target,
        players: mapToEntry(goalsSorted, p => p.goals.toString(), 'G'),
      });
    }

    if (goalieSorted.length > 0) {
      const goalieEntries: LeaderEntry[] = goalieSorted.slice(0, TOP_N).map((g, i) => {
        const svPct = g.savePercentage > 1
          ? g.savePercentage.toFixed(1)
          : (g.savePercentage * 100).toFixed(1);
        return {
          rank: i + 1,
          name: g.player,
          team: g.team,
          teamLogo: getTeamLogo(g.team, g.teamLogoUrl),
          stat: svPct,
          label: 'SV%',
          image: g.avatar,
          playerId: g.playerId,
          photoDocId: g.photoDocId,
          isGoalie: true,
        };
      });
      result.push({
        title: 'Top Goalies',
        icon: Shield,
        players: goalieEntries,
      });
    }

    return result;
  }, [players, goalies]);

  const handlePlayerClick = (playerId: number, playerName: string, photoDocId?: number, isGoalie?: boolean) => {
    navigateTo('player', { playerId, playerName, photoDocId, isGoalie: isGoalie || false, fromPage: 'home', fromLabel: 'Back to Home' });
  };

  return (
    <section className="bg-gray-50 py-8 sm:py-12 lg:py-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-gray-900 font-bold tracking-tight mb-2">
              League Leaders
            </h2>
            {seasonLabel && (
              <p className="text-xs text-gray-500 font-semibold mt-1">{seasonLabel} Season</p>
            )}
            <div className="h-1 w-16 sm:w-20 bg-[#013fac] rounded mt-2"></div>
          </div>
          <button
            onClick={() => navigateTo('stats')}
            className="group relative inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5 bg-gradient-to-b from-[#013fac] to-[#012d7a] text-white rounded font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#0150d4] to-[#013fac] opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            <span className="relative z-10">Full Stats</span>
          </button>
        </div>

        {/* Division Filter */}
        <div className="mb-6 sm:mb-8">
          {/* Mobile Dropdown */}
          <div className="sm:hidden">
            <Select value={selectedDivision} onValueChange={(val) => { setSelectedDivision(val); setSelectedSubDivision('All'); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Division" />
              </SelectTrigger>
              <SelectContent>
                {divisions.map((division) => (
                  <SelectItem key={division} value={division}>
                    {division}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Sub-Division Selector - Mobile */}
            {subDivisions[selectedDivision] && (
              <div className="mt-2">
                <Select value={selectedSubDivision} onValueChange={setSelectedSubDivision}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Conference" />
                  </SelectTrigger>
                  <SelectContent>
                    {subDivisions[selectedDivision].map((subDiv) => (
                      <SelectItem key={subDiv} value={subDiv}>
                        {subDiv === 'All' ? 'All Conferences' : subDiv}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Desktop Buttons */}
          <div className="hidden sm:flex flex-wrap gap-1.5 sm:gap-2">
            {divisions.map((division) => (
              <button
                key={division}
                onClick={() => { setSelectedDivision(division); setSelectedSubDivision('All'); }}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold tracking-wide whitespace-nowrap rounded transition-all duration-200 ${
                  selectedDivision === division
                    ? 'bg-gradient-to-b from-red-600 to-red-700 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-[#013fac]/5 border-2 border-[#013fac]/20 hover:border-[#013fac]'
                }`}
              >
                {division}
              </button>
            ))}
          </div>
          
          {/* Sub-Division Filter - Desktop */}
          {subDivisions[selectedDivision] && (
            <div className="hidden sm:flex flex-wrap gap-1.5 sm:gap-2 mt-3">
              {subDivisions[selectedDivision].map((subDiv) => (
                <button
                  key={subDiv}
                  onClick={() => setSelectedSubDivision(subDiv)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold tracking-wide whitespace-nowrap rounded transition-all duration-200 ${
                    selectedSubDivision === subDiv
                      ? 'bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {subDiv === 'All' ? 'All Conferences' : subDiv}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm animate-pulse">
                <div className="bg-red-600 p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded w-9 h-9" />
                    <div className="h-5 bg-white/30 rounded w-32" />
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                      <div className="w-8 h-8 rounded-full bg-gray-200" />
                      <div className="w-10 h-10 rounded bg-gray-200" />
                      <div className="flex-1 space-y-1">
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                      <div className="h-7 bg-gray-200 rounded w-10" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && categories.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h4 className="text-lg font-bold text-gray-900 mb-2">No Stats Available</h4>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              League leader statistics for {selectedDivision === 'All Divisions' ? 'the league' : selectedDivision} are not yet available for this season.
            </p>
          </div>
        )}

        {/* Categories Grid */}
        {!loading && categories.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {categories.map((category, categoryIndex) => {
              const Icon = category.icon;
              return (
                <div
                  key={categoryIndex}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                >
                  {/* Category Header */}
                  <div className="bg-red-600 p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-white font-bold tracking-tight">{category.title}</h3>
                    </div>
                  </div>

                  {/* Players List */}
                  <div className="p-4 space-y-2">
                    {category.players.map((player, playerIndex) => (
                      <button
                        key={`${player.playerId}-${playerIndex}`}
                        onClick={() => handlePlayerClick(player.playerId, player.name, player.photoDocId, player.isGoalie)}
                        className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded transition-colors text-left"
                      >
                        {/* Rank */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                          player.rank === 1 ? 'bg-yellow-500' :
                          player.rank === 2 ? 'bg-gray-400' :
                          player.rank === 3 ? 'bg-amber-700' :
                          'bg-red-600'
                        }`}>
                          <span className="text-white font-bold text-sm">{player.rank}</span>
                        </div>

                        {/* Player Image or Team Logo */}
                        {player.image ? (
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full overflow-hidden shadow-sm ${
                            player.rank === 1 ? 'border-2 border-yellow-400 w-12 h-12' : 'border border-gray-200'
                          }`}>
                            <ImageWithFallback
                              src={player.image}
                              alt={player.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-10 h-10 bg-white rounded p-1.5 flex items-center justify-center border border-gray-200 shadow-sm">
                            <ImageWithFallback
                              src={player.teamLogo}
                              alt={player.team}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}

                        {/* Player Info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-900 font-bold text-sm truncate hover:text-red-600 transition-colors">
                            {player.name}
                          </div>
                          <div className="text-gray-600 text-xs truncate">
                            {player.team}
                          </div>
                        </div>

                        {/* Stat */}
                        <div className="flex-shrink-0 text-right">
                          <div className="text-red-600 font-bold text-xl">
                            {player.stat}
                          </div>
                          <div className="text-gray-500 text-xs uppercase">
                            {player.label}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* View All Link */}
                  <div className="p-4 pt-0">
                    <button 
                      onClick={() => navigateTo('stats')}
                      className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded font-bold text-sm transition-colors"
                    >
                      View All {category.title}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}