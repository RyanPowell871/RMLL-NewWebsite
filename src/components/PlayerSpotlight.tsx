import { TrendingUp, Target, Award, User, Loader2, Star } from 'lucide-react';
import { useDivision } from '../contexts/DivisionContext';
import { useNavigation } from '../contexts/NavigationContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useState, useEffect, useMemo } from 'react';
import { useHomepageStats } from '../hooks/useHomepageStats';
import { getTeamLogo } from '../utils/team-logos';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface SpotlightPlayer {
  name: string;
  team: string;
  teamLogo: string;
  image: string | null;
  position: string;
  playerId: number;
  photoDocId?: number;
  isGoalie?: boolean;
  stats: { label: string; value: string }[];
  category: string; // "Points Leader" | "Top Scorer" | "Top Goalie"
}

export function PlayerSpotlight() {
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

  // Build spotlight players from real data
  const spotlightPlayers = useMemo((): SpotlightPlayer[] => {
    if (players.length === 0 && goalies.length === 0) return [];

    const result: SpotlightPlayer[] = [];
    const usedPlayerIds = new Set<number>();

    // Minimum GP filter — set low to include players early in the season
    const minGP = 1;
    const qualifiedPlayers = players.filter(p => p.gamesPlayed >= minGP);
    const qualifiedGoalies = goalies.filter(g => g.gamesPlayed >= minGP);

    // 1. Points Leader — prefer players with a photo
    const pointsSorted = [...qualifiedPlayers].sort((a, b) => b.points - a.points);
    const pointsLeader = pointsSorted.find(p => p.avatar) || pointsSorted[0];
    if (pointsLeader) {
      usedPlayerIds.add(pointsLeader.playerId);
      result.push({
        name: pointsLeader.player,
        team: pointsLeader.team,
        teamLogo: getTeamLogo(pointsLeader.team, pointsLeader.teamLogoUrl),
        image: pointsLeader.avatar || null,
        position: pointsLeader.position || 'Forward',
        playerId: pointsLeader.playerId,
        photoDocId: pointsLeader.photoDocId,
        category: 'Points Leader',
        stats: [
          { label: 'Goals', value: pointsLeader.goals.toString() },
          { label: 'Assists', value: pointsLeader.assists.toString() },
          { label: 'Points', value: pointsLeader.points.toString() },
        ],
      });
    }

    // 2. Goals Leader (different from points leader) — prefer players with a photo
    const goalsSorted = [...qualifiedPlayers].sort((a, b) => b.goals - a.goals);
    const goalsLeader = goalsSorted.find(p => !usedPlayerIds.has(p.playerId) && p.avatar) 
                     || goalsSorted.find(p => !usedPlayerIds.has(p.playerId));
    if (goalsLeader) {
      usedPlayerIds.add(goalsLeader.playerId);
      result.push({
        name: goalsLeader.player,
        team: goalsLeader.team,
        teamLogo: getTeamLogo(goalsLeader.team, goalsLeader.teamLogoUrl),
        image: goalsLeader.avatar || null,
        position: goalsLeader.position || 'Forward',
        playerId: goalsLeader.playerId,
        photoDocId: goalsLeader.photoDocId,
        category: 'Top Scorer',
        stats: [
          { label: 'Goals', value: goalsLeader.goals.toString() },
          { label: 'GP', value: goalsLeader.gamesPlayed.toString() },
          { label: 'Points', value: goalsLeader.points.toString() },
        ],
      });
    }

    // 3. Top Goalie — by save percentage, prefer goalies with a photo
    const goalieSorted = [...qualifiedGoalies].sort((a, b) => b.savePercentage - a.savePercentage);
    const topGoalie = goalieSorted.find(g => g.avatar) || goalieSorted[0];
    if (topGoalie) {
      const svPct = topGoalie.savePercentage > 1 
        ? topGoalie.savePercentage.toFixed(1) 
        : (topGoalie.savePercentage * 100).toFixed(1);
      const gaa = topGoalie.gaa.toFixed(2);
      result.push({
        name: topGoalie.player,
        team: topGoalie.team,
        teamLogo: getTeamLogo(topGoalie.team, topGoalie.teamLogoUrl),
        image: topGoalie.avatar || null,
        position: 'Goalie',
        playerId: topGoalie.playerId,
        photoDocId: topGoalie.photoDocId,
        isGoalie: true,
        category: 'Top Goalie',
        stats: [
          { label: 'GP', value: topGoalie.gamesPlayed.toString() },
          { label: 'SV%', value: svPct },
          { label: 'GAA', value: gaa },
        ],
      });
    }

    // If we only got 2 or fewer, try to fill with assists leader or another skater
    if (result.length < 3 && qualifiedPlayers.length > 0) {
      const assistsSorted = [...qualifiedPlayers].sort((a, b) => b.assists - a.assists);
      const assistsLeader = assistsSorted.find(p => !usedPlayerIds.has(p.playerId) && p.avatar)
                         || assistsSorted.find(p => !usedPlayerIds.has(p.playerId));
      if (assistsLeader) {
        result.push({
          name: assistsLeader.player,
          team: assistsLeader.team,
          teamLogo: getTeamLogo(assistsLeader.team, assistsLeader.teamLogoUrl),
          image: assistsLeader.avatar || null,
          position: assistsLeader.position || 'Forward',
          playerId: assistsLeader.playerId,
          photoDocId: assistsLeader.photoDocId,
          category: 'Assists Leader',
          stats: [
            { label: 'Assists', value: assistsLeader.assists.toString() },
            { label: 'GP', value: assistsLeader.gamesPlayed.toString() },
            { label: 'Points', value: assistsLeader.points.toString() },
          ],
        });
      }
    }

    return result;
  }, [players, goalies]);

  const categoryIcon = (cat: string) => {
    switch (cat) {
      case 'Points Leader': return <Award className="w-3 h-3" />;
      case 'Top Scorer': return <Target className="w-3 h-3" />;
      case 'Top Goalie': return <TrendingUp className="w-3 h-3" />;
      default: return <Star className="w-3 h-3" />;
    }
  };

  const handlePlayerClick = (player: SpotlightPlayer) => {
    navigateTo('player', { playerId: player.playerId, playerName: player.name, photoDocId: player.photoDocId, isGoalie: player.isGoalie || false, fromPage: 'home', fromLabel: 'Back to Home' });
  };

  return (
    <section className="bg-white py-8 sm:py-12 lg:py-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-gray-900 font-bold tracking-tight mb-2">Player Spotlight</h2>
            {seasonLabel && (
              <p className="text-xs text-gray-500 font-semibold mt-1">{seasonLabel} Season</p>
            )}
            <div className="h-1 w-16 sm:w-20 bg-[#013fac] rounded mt-2"></div>
          </div>
          <button 
            onClick={() => navigateTo('stats')}
            className="group relative inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5 bg-gradient-to-b from-red-600 to-red-700 text-white rounded font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-red-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-300 to-transparent opacity-50"></div>
            <span className="relative z-10">View All Players</span>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
                <div className="h-[280px] sm:h-[320px] lg:h-[340px] bg-gray-200" />
                <div className="p-4 sm:p-5 lg:p-6 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="text-center space-y-1">
                        <div className="h-8 bg-gray-200 rounded" />
                        <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && spotlightPlayers.length === 0 && (
          <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h4 className="text-lg font-bold text-gray-900 mb-2">No Player Data Available</h4>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Player statistics for {selectedDivision === 'All Divisions' ? 'the league' : selectedDivision} are not yet available for this season.
            </p>
          </div>
        )}

        {/* Players Grid */}
        {!loading && spotlightPlayers.length > 0 && (
          <div className={`grid gap-4 sm:gap-6 lg:gap-8 ${
            spotlightPlayers.length === 1 ? 'md:grid-cols-1 max-w-lg mx-auto' :
            spotlightPlayers.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' :
            'md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {spotlightPlayers.map((player, index) => (
              <button
                key={`${player.playerId}-${index}`}
                onClick={() => handlePlayerClick(player)}
                className="group block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow text-left"
              >
                {/* Player Image */}
                <div className="relative h-[280px] sm:h-[320px] lg:h-[340px] overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                  {player.image ? (
                    <ImageWithFallback
                      src={player.image}
                      alt={player.name}
                      className="w-full h-full object-cover object-[center_20%] group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <User className="w-16 h-16 text-gray-500 mx-auto mb-2" />
                        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">No Photo</span>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* Team Logo */}
                  <div className="absolute bottom-3 left-3 bg-white p-2 rounded shadow-lg">
                    <ImageWithFallback src={player.teamLogo} alt={player.team} className="w-8 h-8 object-contain" />
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-3 right-3 bg-red-600 px-2 py-0.5 rounded text-white text-[10px] sm:text-xs font-bold tracking-wider flex items-center gap-1">
                    {categoryIcon(player.category)}
                    {player.category}
                  </div>

                  {/* Position Badge */}
                  <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded text-white text-[10px] font-bold tracking-wider">
                    {player.position}
                  </div>
                </div>

                {/* Player Info */}
                <div className="p-4 sm:p-5 lg:p-6">
                  <h3 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 mb-1 group-hover:text-red-600 transition-colors">
                    {player.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-4 font-semibold">{player.team}</p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {player.stats.map((stat, statIndex) => (
                      <div key={statIndex} className="text-center">
                        <div className="text-red-600 font-bold text-lg sm:text-xl lg:text-2xl mb-0.5">
                          {stat.value}
                        </div>
                        <div className="text-gray-600 text-[10px] sm:text-xs font-semibold uppercase tracking-wide">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}