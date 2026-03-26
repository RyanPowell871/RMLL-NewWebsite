import { Trophy, Users, Calendar } from 'lucide-react';
import heroImage from 'figma:asset/fdfcb8e6c2b97967b54febaebf3bb794e8d4e2db.png';
import { useState, useEffect, useRef } from 'react';
import { fetchTeams, fetchSchedule, SEASON_IDS, detectActiveDivisions, buildDivisionGroups, buildDynamicSubDivisionIds, isApiKeyReady } from '../services/sportzsoft';
import { useSeasons } from '../hooks/useSeasons';

export function Hero() {
  const [divisionCount, setDivisionCount] = useState<number>(8);
  const [teamCount, setTeamCount] = useState<number>(50);
  const [gameCount, setGameCount] = useState<number>(200);
  const [isLoading, setIsLoading] = useState(true);
  const [firstGameDate, setFirstGameDate] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchedRef = useRef(false);

  // Use dynamic season lookup from useSeasons — wait for it to load before fetching
  const { seasons, seasonIdsByYear, loading: seasonsLoading } = useSeasons();

  useEffect(() => {
    // Wait for useSeasons to finish loading to avoid double-fetching
    if (seasonsLoading) return;
    // Only fetch once
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchLeagueStats = async () => {
      try {
        setIsLoading(true);
        
        // Wait for API key to be ready (max 5 seconds)
        let attempts = 0;
        while (!isApiKeyReady() && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!isApiKeyReady()) {
          setIsLoading(false);
          return;
        }

        // Build a list of season IDs to try, starting with the most recent
        // This handles the case where a new season exists but has no teams yet
        const currentYear = new Date().getFullYear();
        const seasonIdsToTry: { seasonId: number; year: number }[] = [];
        
        // Try next year too (in case a future season exists), then current, then previous
        for (let year = currentYear + 1; year >= currentYear - 2; year--) {
          const yearStr = year.toString();
          const sid = seasonIdsByYear[yearStr] || SEASON_IDS[yearStr];
          if (sid && sid > 0 && !seasonIdsToTry.some(s => s.seasonId === sid)) {
            seasonIdsToTry.push({ seasonId: sid, year });
          }
        }
        
        // Fallback: use any season from useSeasons
        if (seasonIdsToTry.length === 0 && seasons.length > 0) {
          seasonIdsToTry.push({ seasonId: seasons[0].SeasonId, year: seasons[0].StartYear });
        }
        
        // Fallback: hardcoded 2025
        if (seasonIdsToTry.length === 0) {
          seasonIdsToTry.push({ seasonId: SEASON_IDS['2025'], year: 2025 });
        }



        let foundData = false;
        let seasonYear = currentYear;
        let countdownDateSet = false; // Track if countdown date was set by rollover check

        for (let i = 0; i < seasonIdsToTry.length; i++) {
          const entry = seasonIdsToTry[i];
          if (!entry.seasonId) continue;
          
          seasonYear = entry.year;

          // Fetch teams to count divisions and teams
          const teamsResponse = await fetchTeams(entry.seasonId, 'BI');
          
          if (teamsResponse.Success && teamsResponse.Response?.Teams) {
            const teams = teamsResponse.Response.Teams;
            
            if (teams.length > 0) {
              // Build dynamic division groups from the season API data
              const seasonObj = seasons.find(s => s.SeasonId === entry.seasonId);
              let dynamicGroups: Record<string, number[]> = {};
              let dynamicSubDivs: Record<string, Record<string, number[]>> = {};
              if (seasonObj?.Groups?.length) {
                dynamicGroups = buildDivisionGroups(seasonObj);
                dynamicSubDivs = buildDynamicSubDivisionIds(seasonObj, teams);
              }

              const activeDivisions = detectActiveDivisions(teams, dynamicGroups, dynamicSubDivs);
              
              // If teams exist but don't map to known divisions, skip
              if (activeDivisions.divisions.length === 0) {

                continue;
              }

              // Season rollover: if this is the newest season and first game hasn't started, skip
              if (i === 0 && seasonIdsToTry.length > 1) {
                const scheduleCheck = await fetchSchedule(
                  entry.seasonId,
                  `${entry.year}-01-01`,
                  `${entry.year + 1}-12-31`,
                  { games: true, practices: false, limiterCode: 'PS' }
                );
                if (scheduleCheck.Success && scheduleCheck.Response?.Schedule?.Games) {
                  const games = scheduleCheck.Response.Schedule.Games;
                  if (games.length > 0) {
                    const sorted = [...games].sort((a, b) =>
                      new Date(a.GameDate).getTime() - new Date(b.GameDate).getTime()
                    );
                    const firstGame = new Date(sorted[0].GameDate);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (firstGame > today) {
                      // Season hasn't started — show THIS season's data (teams, divisions, games)
                      // since it reflects the upcoming/current registration
                      setFirstGameDate(firstGame);
                      countdownDateSet = true;
                      setTeamCount(teams.length);
                      setDivisionCount(activeDivisions.divisions.length);
                      setGameCount(games.length);
                      foundData = true;
                      break; // Use upcoming season data, don't fall back
                    }
                    // Season has started — use this season's data
                    setGameCount(games.length);
                    setFirstGameDate(firstGame);
                  } else {
                    // No games scheduled — skip to previous season
                    continue;
                  }
                }
              }
              
              setTeamCount(teams.length);
              setDivisionCount(activeDivisions.divisions.length);
              foundData = true;

              // If we haven't already fetched the schedule (i.e. this wasn't the rollover check path)
              if (i !== 0 || seasonIdsToTry.length <= 1) {
                const scheduleResponse = await fetchSchedule(
                  entry.seasonId,
                  `${seasonYear}-01-01`,
                  `${seasonYear + 1}-12-31`,
                  { games: true, practices: false, limiterCode: 'PS' }
                );

                if (scheduleResponse.Success && scheduleResponse.Response?.Schedule?.Games) {
                  const games = scheduleResponse.Response.Schedule.Games;
                  setGameCount(games.length);

                  // Find the first game date for countdown
                  // BUT: don't overwrite if firstGameDate was already set by the rollover check
                  // (which found a future season's first game for the countdown)
                  if (games.length > 0 && !countdownDateSet) {
                    const sortedGames = [...games].sort((a, b) => 
                      new Date(a.GameDate).getTime() - new Date(b.GameDate).getTime()
                    );
                    setFirstGameDate(new Date(sortedGames[0].GameDate));
                  }
                }
              }
              break; // Stop trying other seasons
            } else {

            }
          }
        }

        if (!foundData) {

        }
      } catch (error) {
        console.error('[Hero] Error fetching stats:', error);
        // Keep default values on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeagueStats();
  }, [seasonsLoading, seasons, seasonIdsByYear]);

  // Determine current season status
  const getSeasonStatus = () => {
    const today = new Date();
    const year = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11

    // Assuming season runs approximately May-August
    if (currentMonth >= 0 && currentMonth <= 3) {
      return { year, status: 'UPCOMING', statusColor: 'bg-blue-600', animate: false };
    } else if (currentMonth >= 4 && currentMonth <= 7) {
      return { year, status: 'LIVE', statusColor: 'bg-red-600', animate: true };
    } else {
      return { year, status: 'COMPLETED', statusColor: 'bg-green-600', animate: false };
    }
  };

  const seasonStatus = getSeasonStatus();

  // Countdown logic
  useEffect(() => {
    if (firstGameDate) {
      const targetDate = new Date(firstGameDate);
      // Calculate immediately before waiting for interval
      const calcCountdown = () => {
        const now = new Date();
        const difference = targetDate.getTime() - now.getTime();
        if (difference <= 0) {
          setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          return false;
        }
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setCountdown({ days, hours, minutes, seconds });
        return true;
      };

      calcCountdown(); // Run immediately
      const interval = setInterval(() => {
        if (!calcCountdown()) clearInterval(interval);
      }, 1000);

      countdownRef.current = interval;
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [firstGameDate]);

  const showCountdown = seasonStatus.status === 'UPCOMING' && firstGameDate && firstGameDate.getTime() > Date.now();

  return (
    <section className="relative bg-gradient-to-br from-[#001741] via-[#00234f] to-[#003060] text-white overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-8 items-center min-h-[500px] sm:min-h-[600px]">
          {/* Left Content */}
          <div className="px-4 sm:px-6 lg:px-12 py-8 sm:py-12 lg:py-20 z-10">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#013fac] text-white text-sm sm:text-base lg:text-lg font-bold rounded tracking-wider">
                {seasonStatus.year} SEASON
                <span className={`inline-flex items-center gap-1.5 ${seasonStatus.statusColor} px-2 py-0.5 rounded ${seasonStatus.animate ? 'animate-pulse' : ''}`}>
                  {seasonStatus.animate && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                  )}
                  {seasonStatus.status}
                </span>
              </div>
              
              {/* Countdown Timer - only show when UPCOMING and we have a first game date in the future */}
              {showCountdown && (
                <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded px-3 py-1.5 sm:px-4 sm:py-2">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 flex-shrink-0" />
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <div className="text-center">
                      <span className="text-base sm:text-lg lg:text-xl font-bold tabular-nums">{countdown.days}</span>
                      <span className="text-[8px] sm:text-[10px] text-gray-400 font-semibold tracking-wider ml-0.5">D</span>
                    </div>
                    <span className="text-gray-500 font-bold text-xs">:</span>
                    <div className="text-center">
                      <span className="text-base sm:text-lg lg:text-xl font-bold tabular-nums">{String(countdown.hours).padStart(2, '0')}</span>
                      <span className="text-[8px] sm:text-[10px] text-gray-400 font-semibold tracking-wider ml-0.5">H</span>
                    </div>
                    <span className="text-gray-500 font-bold text-xs">:</span>
                    <div className="text-center">
                      <span className="text-base sm:text-lg lg:text-xl font-bold tabular-nums">{String(countdown.minutes).padStart(2, '0')}</span>
                      <span className="text-[8px] sm:text-[10px] text-gray-400 font-semibold tracking-wider ml-0.5">M</span>
                    </div>
                    <span className="text-gray-500 font-bold text-xs">:</span>
                    <div className="text-center">
                      <span className="text-base sm:text-lg lg:text-xl font-bold tabular-nums text-red-400">{String(countdown.seconds).padStart(2, '0')}</span>
                      <span className="text-[8px] sm:text-[10px] text-gray-400 font-semibold tracking-wider ml-0.5">S</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <h1 className="mb-4 sm:mb-6">
              <span className="block">ROCKY MOUNTAIN</span>
              <span className="block">LACROSSE LEAGUE</span>
            </h1>
            
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl font-semibold text-gray-300 mb-6 sm:mb-8 lg:mb-10 max-w-lg">
              Alberta's Premier Box Lacrosse League bringing world-class competition to the heart of the Rockies.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8 lg:mb-10 max-w-lg">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 lg:p-4 border border-white/20">
                <div className="flex items-center justify-center mb-1 sm:mb-2">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-red-500" />
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-0.5 sm:mb-1">{isLoading ? '...' : divisionCount}</div>
                  <div className="text-[10px] sm:text-xs text-gray-300">DIVISIONS</div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 lg:p-4 border border-white/20">
                <div className="flex items-center justify-center mb-1 sm:mb-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-red-500" />
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-0.5 sm:mb-1">{isLoading ? '...' : teamCount}</div>
                  <div className="text-[10px] sm:text-xs text-gray-300">TEAMS</div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 lg:p-4 border border-white/20">
                <div className="flex items-center justify-center mb-1 sm:mb-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-red-500" />
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-0.5 sm:mb-1">{isLoading ? '...' : gameCount}</div>
                  <div className="text-[10px] sm:text-xs text-gray-300">GAMES</div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 sm:gap-3 flex-wrap">
              <button 
                onClick={() => {
                  if ((window as any).navigateToPath) {
                    (window as any).navigateToPath('/league-info');
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group relative px-4 py-2 sm:px-5 sm:py-2.5 lg:px-6 lg:py-3 text-white rounded font-bold text-xs sm:text-sm tracking-wider overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(to bottom, var(--color-primary), var(--color-primary-dark))' }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: 'linear-gradient(to bottom, var(--color-primary-light), var(--color-primary))' }}></div>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50"></div>
                <span className="relative z-10">LEAGUE INFO</span>
              </button>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('rmll-navigate', { detail: { page: 'schedule' } }));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group relative px-4 py-2 sm:px-5 sm:py-2.5 lg:px-6 lg:py-3 bg-white text-[#013fac] rounded font-bold text-xs sm:text-sm tracking-wider shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border-2" style={{ borderColor: 'var(--color-primary)' }}
              >
                <span className="relative z-10">VIEW SCHEDULE</span>
              </button>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('rmll-navigate', { detail: { page: 'standings' } }));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group relative px-4 py-2 sm:px-5 sm:py-2.5 lg:px-6 lg:py-3 bg-white text-[#013fac] rounded font-bold text-xs sm:text-sm tracking-wider shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border-2"
                style={{ borderColor: 'var(--color-primary)' }}
              >
                <span className="relative z-10">VIEW STANDINGS</span>
              </button>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative h-full min-h-[300px] sm:min-h-[400px] lg:min-h-[600px]">
            {/* Mountain silhouette overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#001741] via-transparent to-transparent z-10"></div>
            
            <div className="absolute inset-0 opacity-20">
              <svg viewBox="0 0 800 600" className="w-full h-full" preserveAspectRatio="xMaxYMax slice">
                <defs>
                  <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1.5" fill="#DC2626" />
                  </pattern>
                </defs>
                <rect x="400" y="0" width="400" height="600" fill="url(#dots)" />
              </svg>
            </div>

            <div className="absolute inset-0 p-6 sm:p-8 lg:p-12 xl:p-16 flex items-center justify-center">
              <img
                src={heroImage}
                alt="Rocky Mountain Lacrosse League Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}