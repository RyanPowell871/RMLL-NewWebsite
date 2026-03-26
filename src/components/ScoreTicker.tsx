import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDivision } from '../contexts/DivisionContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { GameSheetModal } from './GameSheetModal';
import { useScheduleData } from '../hooks/useScheduleData';
import { parseGameTime, buildDivisionGroups } from '../services/sportzsoft';
import { buildDynamicSubDivisionIds } from '../services/sportzsoft/utils';
import { SUB_DIVISION_IDS, DIVISION_GROUPS } from '../services/sportzsoft/constants';
import { useSeasons } from '../hooks/useSeasons';
import { useDivisionScheduleStatus } from '../hooks/useDivisionScheduleStatus';
import shamrocksLogo from 'figma:asset/451bbc9cb0dc69d999248789df7937a5d31b2bc3.png';
import rockiesLogo from 'figma:asset/7731aebae94e152f358806079868cc4565ee122c.png';

interface Game {
  id: string;
  gameNumber: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamId?: number;
  visitorTeamId?: number;
  homeScore: number;
  awayScore: number;
  homeRecord: string;
  awayRecord: string;
  date: string;
  time: string;
  status: 'FINAL' | 'LIVE' | 'UPCOMING' | 'EXHIBITION';
  homeLogo: string;
  awayLogo: string;
  division: string;
  divisionId: number;
  location: string;
  conference?: string; // For Junior B Tier I and II
}

// Helper function to format game date
const formatGameDate = (dateString: string): string => {
  // Parse as local date to avoid timezone shift (API returns UTC dates)
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const monthStr = date.toLocaleDateString('en-US', { month: 'short' });
  return `${monthStr} ${day}`;
};

export function ScoreTicker() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const { selectedDivision: favoriteDivision, selectedSubDivision: favoriteSubDivision, divisions, subDivisions } = useDivision();
  const [selectedDivision, setSelectedDivision] = useState(() =>
    favoriteDivision || 'All Divisions'
  );
  const [selectedSubDivision, setSelectedSubDivision] = useState(() =>
    favoriteSubDivision || 'All'
  );
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  
  // Get season data to determine visibility and current season year
  const { seasons, getCurrentSeasonYear, loading: seasonsLoading } = useSeasons();
  
  // Derive the best season year from loaded data — find most recent season with actual groups/data
  // Don't use useState here since it locks to the initial (pre-load) value
  const selectedSeasonYear = (() => {
    if (seasonsLoading || seasons.length === 0) return getCurrentSeasonYear();
    // Find the most recent season that is active, or just the most recent
    const activeSeason = seasons.find(s => s.IsActive);
    return (activeSeason || seasons[0]).StartYear.toString();
  })();
  
  // Calculate seasonId
  // Find matching season by year - don't require "Regular Season" in name since 2026+ seasons may have different naming
  const currentSeason = seasons.find(s => s.StartYear.toString() === selectedSeasonYear);
  const seasonId = currentSeason?.SeasonId || 0;
  
  // Build dynamic division groups from current season
  const divisionGroupMap = useMemo(() => {
    if (!currentSeason) return undefined;
    return buildDivisionGroups(currentSeason);
  }, [currentSeason]);

  // Fetch live data from SportzSoft API (must call before any conditional returns)
  // Fetch ALL season games — division filtering is done locally in the ticker for reliability
  const { games: allApiGames, loading, error } = useScheduleData({
    seasonId,
    season: selectedSeasonYear,
    // Don't pass division/subDivision — we filter locally below using DivisionId
    viewMode: 'season',
    currentSeason: currentSeason || null,
    divisionGroupMap,
  });
  
  // Build sub-division map for sub-division filtering
  const subDivisionMap = useMemo(() => {
    if (!currentSeason) return undefined;
    return buildDynamicSubDivisionIds(currentSeason);
  }, [currentSeason]);
  
  // Collect all division IDs for schedule status checks
  const allDivisionIds = useMemo(() => {
    if (!divisionGroupMap) return [];
    const ids: number[] = [];
    Object.values(divisionGroupMap).forEach(divIds => {
      divIds.forEach(id => { if (!ids.includes(id)) ids.push(id); });
    });
    return ids;
  }, [divisionGroupMap]);

  // Fetch schedule status flags — used for "in progress" indicators only
  const { inProgressDivisionIds } = useDivisionScheduleStatus(allDivisionIds);

  // Filter games by division/sub-division using DivisionId matching (not string comparison).
  // This is done locally in the ticker for reliability instead of relying on the hook's useMemo chain.
  const divisionFilteredGames = useMemo(() => {
    if (selectedDivision === 'All Divisions') return allApiGames;
    
    // Determine allowed DivisionIds for the selected division/sub-division
    let allowedDivisionIds: number[] = [];
    
    // Check sub-division first (more specific)
    if (selectedSubDivision && selectedSubDivision !== 'All') {
      // Dynamic sub-division map
      if (subDivisionMap?.[selectedDivision]?.[selectedSubDivision]) {
        allowedDivisionIds = subDivisionMap[selectedDivision][selectedSubDivision];
      }
      // Static fallback
      else if (SUB_DIVISION_IDS[selectedDivision]?.[selectedSubDivision]) {
        allowedDivisionIds = SUB_DIVISION_IDS[selectedDivision][selectedSubDivision];
      }
    }
    
    // If no sub-division filter matched, use the main division group
    if (allowedDivisionIds.length === 0) {
      if (divisionGroupMap?.[selectedDivision]) {
        allowedDivisionIds = divisionGroupMap[selectedDivision];
      } else if (DIVISION_GROUPS[selectedDivision]) {
        allowedDivisionIds = DIVISION_GROUPS[selectedDivision];
      }
    }
    
    // If we still have no IDs, show all (graceful fallback)
    if (allowedDivisionIds.length === 0) return allApiGames;
    
    return allApiGames.filter(g => allowedDivisionIds.includes(g.DivisionId));
  }, [allApiGames, selectedDivision, selectedSubDivision, divisionGroupMap, subDivisionMap]);


  
  // Show all season games in the ticker — it's scrollable so no need to aggressively window-filter.
  // Sort by date ascending so recent/current games appear first, upcoming games scroll to the right.
  const apiGames = useMemo(() => {
    if (divisionFilteredGames.length === 0) return [];
    
    // Sort all games by date ascending
    const sorted = [...divisionFilteredGames].sort(
      (a, b) => new Date(a.GameDate).getTime() - new Date(b.GameDate).getTime()
    );
    
    return sorted;
  }, [divisionFilteredGames]);
  
  // Auto-scroll to the "current" region on load: find the first game that is today or in the future
  const initialScrollIndex = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const idx = apiGames.findIndex(g => new Date(g.GameDate) >= now);
    // If found, back up a couple so user can see recent results too
    return idx > 0 ? Math.max(0, idx - 2) : 0;
  }, [apiGames]);

  // Update local division when favorite changes
  useEffect(() => {
    setSelectedDivision(favoriteDivision);
    setSelectedSubDivision(favoriteSubDivision);
  }, [favoriteDivision, favoriteSubDivision]);
  
  // Determine if ticker should be visible (after all hooks are called)
  const shouldShowTicker = (): boolean => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    
    // If we have any games in the season, show the ticker
    if (allApiGames.length > 0) {
      // Find the last game date from the actual schedule
      const sortedGames = [...allApiGames].sort((a, b) => 
        new Date(b.GameDate).getTime() - new Date(a.GameDate).getTime()
      );
      
      const lastGameDate = new Date(sortedGames[0].GameDate);
      const firstGameDate = new Date(sortedGames[sortedGames.length - 1].GameDate);
      const twoWeeksAfterSeason = new Date(lastGameDate);
      twoWeeksAfterSeason.setDate(twoWeeksAfterSeason.getDate() + 14);
      const preSeasonWindow = new Date(firstGameDate);
      preSeasonWindow.setDate(preSeasonWindow.getDate() - 60); // Show ticker up to 60 days before first game
      
      // Show ticker from 60 days before first game to 2 weeks after last game
      if (today >= preSeasonWindow && today <= twoWeeksAfterSeason) {
        return true;
      }
    } else {
      // Fallback: Assume season runs May-August, ends August 31st
      const assumedSeasonEnd = new Date(currentYear, 7, 31); // August 31st
      const twoWeeksAfterSeason = new Date(assumedSeasonEnd);
      twoWeeksAfterSeason.setDate(twoWeeksAfterSeason.getDate() + 14); // September 14th
      
      if (today <= twoWeeksAfterSeason) {
        return true;
      }
    }
    
    // Hide ticker in off-season
    return false;
  };
  
  const isVisible = shouldShowTicker();
  
  // Convert API games to component format
  const games: Game[] = apiGames.map((apiGame) => {
    // Determine if scores are available (not undefined/null and not both zero for final games)
    const hasScores = apiGame.HomeScore !== undefined && apiGame.HomeScore !== null && 
                      apiGame.VisitorScore !== undefined && apiGame.VisitorScore !== null;
    
    return {
      id: apiGame.GameId.toString(),
      gameNumber: apiGame.GameNumber,
      homeTeam: apiGame.HomeTeamName || 'Home Team',
      awayTeam: apiGame.VisitorTeamName || 'Away Team',
      homeTeamId: apiGame.HomeTeamId,
      visitorTeamId: apiGame.VisitorTeamId,
      homeScore: hasScores ? apiGame.HomeScore : 0,
      awayScore: hasScores ? apiGame.VisitorScore : 0,
      homeRecord: '', // Records computed from season standings
      awayRecord: '',
      date: formatGameDate(apiGame.GameDate),
      fullDate: apiGame.GameDate, // Pass full date for API lookups
      time: apiGame.GameStatus === 'Final' ? 'FINAL' : apiGame.GameStatus === 'In Progress' ? 'LIVE' : (parseGameTime(apiGame.StartTime) || parseGameTime(apiGame.GameDate)),
      status: apiGame.GameStatus === 'Final' ? 'FINAL' 
        : apiGame.GameStatus === 'In Progress' ? 'LIVE' 
        : (apiGame.StandingCategoryCode?.toLowerCase() === 'exhb') ? 'EXHIBITION'
        : 'UPCOMING',
      homeLogo: apiGame.HomeTeamLogoURL || rockiesLogo, // Use API logo URL or fallback to default
      awayLogo: apiGame.VisitorTeamLogoURL || shamrocksLogo, // Use API logo URL or fallback to default
      division: apiGame.DivisionName || 'Unknown',
      divisionId: apiGame.DivisionId,
      location: apiGame.FacilityName,
      conference: undefined, // Would need to extract from DivisionName if needed
    };
  });

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('score-ticker-container');
    if (container) {
      const scrollAmount = 300;
      const newPosition =
        direction === 'left'
          ? Math.max(0, scrollPosition - scrollAmount)
          : Math.min(container.scrollWidth - container.clientWidth, scrollPosition + scrollAmount);

      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  // Handle division change: reset sub-division and scroll position
  const handleDivisionChange = (division: string) => {
    setSelectedDivision(division);
    setSelectedSubDivision('All');
    setScrollPosition(0);
    // Reset scroll to start
    const container = document.getElementById('score-ticker-container');
    if (container) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  // Handle sub-division change: reset scroll position  
  const handleSubDivisionChange = (subDiv: string) => {
    setSelectedSubDivision(subDiv);
    setScrollPosition(0);
    const container = document.getElementById('score-ticker-container');
    if (container) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  // Auto-scroll to the current games region when games load
  useEffect(() => {
    if (initialScrollIndex > 0 && games.length > 0) {
      const container = document.getElementById('score-ticker-container');
      if (container) {
        // Each card is roughly 300px wide with gaps
        const scrollTo = initialScrollIndex * 310;
        // Use setTimeout to ensure DOM is rendered
        setTimeout(() => {
          container.scrollTo({ left: scrollTo, behavior: 'smooth' });
          setScrollPosition(scrollTo);
        }, 100);
      }
    }
  }, [initialScrollIndex, games.length]);
  
  // If ticker shouldn't be shown, return null AFTER all hooks are called
  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-gray-100 border-b-2 border-gray-300">
      {/* Division Filter */}
      <div className="border-b border-gray-300 bg-white">
        {/* Mobile Dropdown */}
        <div className="block md:hidden px-4 py-3 space-y-3">
          <Select value={selectedDivision} onValueChange={handleDivisionChange}>
            <SelectTrigger className="w-full font-bold">
              <SelectValue placeholder="Select Division" />
            </SelectTrigger>
            <SelectContent>
              {divisions.map((division) => (
                <SelectItem key={division} value={division} className="font-bold">
                  {division}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Sub-Division Selector - Mobile */}
          {subDivisions[selectedDivision] && (
            <Select value={selectedSubDivision} onValueChange={handleSubDivisionChange}>
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
          )}
        </div>

        {/* Desktop Filter Bar */}
        <div className="hidden md:block overflow-x-auto scrollbar-hide px-2 sm:px-4 lg:px-6">
          <div className="flex gap-1 py-2 sm:py-3 min-w-max sm:justify-center">
            {divisions.map((division) => (
              <button
                key={division}
                onClick={() => handleDivisionChange(division)}
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
          
          {/* Sub-Division Filter Bar - Desktop */}
          {subDivisions[selectedDivision] && (
            <div className="flex gap-1 pb-2 sm:pb-3 min-w-max sm:justify-center border-t border-gray-200 pt-2">
              {subDivisions[selectedDivision].map((subDiv) => (
                <button
                  key={subDiv}
                  onClick={() => handleSubDivisionChange(subDiv)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold tracking-wide whitespace-nowrap rounded transition-all duration-200 ${
                    selectedSubDivision === subDiv
                      ? 'bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-blue-50 border border-blue-200 hover:border-blue-400'
                  }`}
                >
                  {subDiv === 'All' ? 'All Conferences' : subDiv}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Games Ticker */}
      <div className="max-w-[1400px] mx-auto">
        <div className="relative">
          <button
            onClick={() => scroll('left')}
            className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-50 p-2 shadow-lg rounded-r-lg border border-gray-200"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          
          <div
            id="score-ticker-container"
            className="flex overflow-x-auto scrollbar-hide gap-2 sm:gap-3 px-2 sm:px-4 lg:px-12 py-3 sm:py-4 snap-x snap-mandatory touch-pan-x"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {games.length === 0 ? (
              <div className="w-full text-center py-8 text-gray-500">
                No games scheduled for this division
              </div>
            ) : (
              games.map((game, index) => {
                const isAwayWin = game.awayScore > game.homeScore && game.status === 'FINAL';
                const isHomeWin = game.homeScore > game.awayScore && game.status === 'FINAL';
                const isInProgress = inProgressDivisionIds.has(game.divisionId);
                
                return (
                  <div
                    key={`${game.id}-${index}`}
                    className={`group flex-shrink-0 bg-white hover:bg-gray-50 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 cursor-pointer transition-all border-2 hover:border-red-600 hover:shadow-lg min-w-[260px] sm:min-w-[280px] lg:min-w-[320px] snap-start ${
                      isInProgress ? 'border-yellow-300' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedGame(game)}
                  >
                    {/* Date, Location and Status */}
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-600 tracking-wide">{game.date}</span>
                        <span className="text-[10px] sm:text-xs text-gray-500 font-semibold truncate max-w-[150px]">{game.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {isInProgress && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 border border-yellow-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                            Draft
                          </span>
                        )}
                        {game.gameNumber && (
                          <span className="text-[10px] sm:text-xs font-bold text-gray-500">#{game.gameNumber}</span>
                        )}
                        <span
                          className={`text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded tracking-wider ${
                            game.status === 'LIVE'
                              ? 'bg-red-600 text-white animate-pulse'
                              : game.status === 'FINAL'
                              ? 'bg-gray-800 text-white'
                              : game.status === 'EXHIBITION'
                              ? 'bg-amber-600 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {game.status === 'EXHIBITION' ? 'EXH' : game.time}
                        </span>
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className={`flex items-center justify-between gap-2 sm:gap-3 mb-1.5 rounded px-2 py-1.5 -mx-2 transition-colors ${
                      isAwayWin ? 'bg-green-50' : ''
                    }`}>
                      <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
                        <img src={game.awayLogo} alt={game.awayTeam} className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 object-contain" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-gray-900 tracking-wide font-bold text-xs sm:text-sm truncate">{game.awayTeam}</span>
                          {game.awayRecord && <span className="text-[10px] sm:text-xs text-gray-500 font-semibold">({game.awayRecord})</span>}
                        </div>
                      </div>
                      <span className={`text-xl sm:text-2xl font-bold min-w-[24px] sm:min-w-[28px] text-right ${
                        game.status === 'UPCOMING' || game.status === 'EXHIBITION'
                          ? 'text-gray-400' 
                          : isAwayWin
                          ? 'text-gray-900'
                          : 'text-gray-500'
                      }`}>
                        {game.status === 'UPCOMING' || game.status === 'EXHIBITION' ? '-' : game.awayScore}
                      </span>
                    </div>

                    {/* Home Team */}
                    <div className={`flex items-center justify-between gap-2 sm:gap-3 rounded px-2 py-1.5 -mx-2 transition-colors ${
                      isHomeWin ? 'bg-green-50' : ''
                    }`}>
                      <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
                        <img src={game.homeLogo} alt={game.homeTeam} className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 object-contain" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-gray-900 tracking-wide font-bold text-xs sm:text-sm truncate">{game.homeTeam}</span>
                          {game.homeRecord && <span className="text-[10px] sm:text-xs text-gray-500 font-semibold">({game.homeRecord})</span>}
                        </div>
                      </div>
                      <span className={`text-xl sm:text-2xl font-bold min-w-[24px] sm:min-w-[28px] text-right ${
                        game.status === 'UPCOMING' || game.status === 'EXHIBITION'
                          ? 'text-gray-400' 
                          : isHomeWin
                          ? 'text-gray-900'
                          : 'text-gray-500'
                      }`}>
                        {game.status === 'UPCOMING' || game.status === 'EXHIBITION' ? '-' : game.homeScore}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => scroll('right')}
            className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-50 p-2 shadow-lg rounded-l-lg border border-gray-200"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Game Sheet Modal */}
      {selectedGame && (
        <GameSheetModal 
          game={selectedGame} 
          open={!!selectedGame} 
          onClose={() => setSelectedGame(null)} 
        />
      )}
    </div>
  );
}