import { useState, useEffect, useMemo } from 'react';
import {
  fetchSchedule,
  fetchTeams,
  fetchStandings,
  DIVISION_NAMES,
  DIVISION_GROUPS,
  SUB_DIVISION_IDS,
  GAME_STATUS,
  formatDateForApi,
  getMonthDateRange,
  getWeekDateRange,
  parseGameTime,
  formatGameDate,
  useMockData,
  isApiKeyReady,
  type Game,
  type EnhancedGame,
  type Team,
  type SportzSoftResponse,
  type ScheduleResponse,
  type TeamResponse,
  type Season
} from '../services/sportzsoft';

// Mock games data matching real API structure
const mockGames: Game[] = [
  {
    GameId: 131424,
    GameDate: "2025-05-01T01:00:00.000Z",
    HomeTeamId: 141462,
    VisitorTeamId: 141463,
    GameNumber: "SB-001",
    StartTime: "1900-01-01T19:00:00.000Z",
    EndTime: "1900-01-01T21:00:00.000Z",
    Duration: 120,
    GameComments: null,
    PrivateToTeamId: null,
    GameStatusCodeId: 120,
    PublishedFlag: true,
    StandingCategoryCode: "regu",
    DivisionId: 76889,
    FacilityId: 1474,
    FacilityTimeSlotId: 184214,
    UsageCode: "F",
    HomeTeamOrganizationId: 520,
    HomeTeamClub: "Rocky Mountain Lacrosse League",
    VisitorTeamOrgId: 520,
    VisitorTeamClub: "Rocky Mountain Lacrosse League",
    DayOfWeek: 5,
    FacilityCode: "TABER",
    FacilityName: "Taber Arena"
  },
  {
    GameId: 131434,
    GameDate: "2025-05-02T01:00:00.000Z",
    HomeTeamId: 141463,
    VisitorTeamId: 141464,
    GameNumber: "SB-002",
    StartTime: "1900-01-01T19:30:00.000Z",
    EndTime: "1900-01-01T21:30:00.000Z",
    Duration: 120,
    GameComments: null,
    PrivateToTeamId: null,
    GameStatusCodeId: 120,
    PublishedFlag: true,
    StandingCategoryCode: "exh", // Exhibition game
    DivisionId: 76889,
    FacilityId: 1490,
    FacilityTimeSlotId: 184205,
    UsageCode: "F",
    HomeTeamOrganizationId: 520,
    HomeTeamClub: "Rocky Mountain Lacrosse League",
    VisitorTeamOrgId: 520,
    VisitorTeamClub: "Rocky Mountain Lacrosse League",
    DayOfWeek: 6,
    FacilityCode: "CARD",
    FacilityName: "Cardston Arena"
  },
  {
    GameId: 131364,
    GameDate: "2025-05-03T01:00:00.000Z",
    HomeTeamId: 141496,
    VisitorTeamId: 141497,
    GameNumber: "SC-001",
    StartTime: "1900-01-01T20:00:00.000Z",
    EndTime: "1900-01-01T22:00:00.000Z",
    Duration: 120,
    GameComments: null,
    PrivateToTeamId: null,
    GameStatusCodeId: 118,
    PublishedFlag: true,
    StandingCategoryCode: "play", // Playoff game
    DivisionId: 76905,
    FacilityId: 1516,
    FacilityTimeSlotId: 184051,
    UsageCode: "F",
    HomeTeamOrganizationId: 520,
    HomeTeamClub: "Rocky Mountain Lacrosse League",
    VisitorTeamOrgId: 520,
    VisitorTeamClub: "Rocky Mountain Lacrosse League",
    DayOfWeek: 7,
    FacilityCode: "CROSS",
    FacilityName: "Pete Knight Memorial Arena"
  },
  {
    GameId: 131477,
    GameDate: "2025-05-04T01:00:00.000Z",
    HomeTeamId: 141451,
    VisitorTeamId: 141453,
    GameNumber: "JB1-001",
    StartTime: "1900-01-01T15:00:00.000Z",
    EndTime: "1900-01-01T17:00:00.000Z",
    Duration: 120,
    GameComments: null,
    PrivateToTeamId: null,
    GameStatusCodeId: 118,
    PublishedFlag: true,
    StandingCategoryCode: "prov", // Provincial game
    DivisionId: 76889,
    FacilityId: 1528,
    FacilityTimeSlotId: 184254,
    UsageCode: "F",
    HomeTeamOrganizationId: 520,
    HomeTeamClub: "Rocky Mountain Lacrosse League",
    VisitorTeamOrgId: 520,
    VisitorTeamClub: "Rocky Mountain Lacrosse League",
    DayOfWeek: 1,
    FacilityCode: "IAI",
    FacilityName: "Innisfail Arena Blue Rink"
  }
];

// Mock team data
const mockTeams: Team[] = [
  { TeamId: 141462, TeamName: 'Sr. Miners', DivisionId: 76889, DivisionName: 'Senior B' },
  { TeamId: 141463, TeamName: 'Knights', DivisionId: 76889, DivisionName: 'Senior B' },
  { TeamId: 141464, TeamName: 'Outlaws', DivisionId: 76889, DivisionName: 'Senior B' },
  { TeamId: 141451, TeamName: 'Shamrocks', DivisionId: 76889, DivisionName: 'Junior B Tier I' },
  { TeamId: 141453, TeamName: 'Crude', DivisionId: 76889, DivisionName: 'Junior B Tier I' },
  { TeamId: 141496, TeamName: 'Sr. C Warriors', DivisionId: 76905, DivisionName: 'Senior C' },
  { TeamId: 141497, TeamName: 'Rage', DivisionId: 76905, DivisionName: 'Senior C' },
];

interface UseScheduleDataOptions {
  seasonId: number;
  season: string;
  viewMode: 'week' | 'month' | 'season';
  selectedMonth?: string;
  selectedWeek?: string;
  division?: string;
  subDivision?: string;
  team?: string;
  gameType?: string; // Game type filter (e.g., 'All Game Types', 'Playoffs', 'Regular Season')
  currentSeason?: Season | null; // Pass the current season for dynamic subdivision lookup
  subDivisionMap?: Record<string, number[]>; // Dynamic subdivision mapping
  divisionGroupMap?: Record<string, number[]>; // Dynamic division group mapping
}

interface UseScheduleDataResult {
  games: EnhancedGame[];
  teams: Team[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useScheduleData(options: UseScheduleDataOptions): UseScheduleDataResult {
  const { seasonId, season, viewMode, selectedMonth, selectedWeek, division, subDivision, team, gameType, currentSeason, subDivisionMap, divisionGroupMap } = options;
  const [games, setGames] = useState<EnhancedGame[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a map of team ID to team name
  const teamMap = new Map<number, string>();
  teams.forEach(t => {
    teamMap.set(t.TeamId, t.TeamName);
  });

  const fetchData = async () => {
    // If using mock data, return immediately
    if (useMockData) {
      const enhancedMockGames: EnhancedGame[] = mockGames.map(game => ({
        ...game,
        HomeTeamName: mockTeams.find(t => t.TeamId === game.HomeTeamId)?.TeamName || 'Home Team',
        VisitorTeamName: mockTeams.find(t => t.TeamId === game.VisitorTeamId)?.TeamName || 'Visitor Team',
        GameStatus: game.GameStatusCode || GAME_STATUS[game.GameStatusCodeId] || game.GameStatus || 'Scheduled',
        DivisionName: DIVISION_NAMES[game.DivisionId] || 'Unknown Division',
        HomeScore: game.GameStatusCodeId === 120 ? Math.floor(Math.random() * 10) + 8 : undefined,
        VisitorScore: game.GameStatusCodeId === 120 ? Math.floor(Math.random() * 10) + 6 : undefined,
      }));
      
      setGames(enhancedMockGames);
      setTeams(mockTeams);
      setLoading(false);
      return;
    }

    // Don't fetch if seasonId is not valid yet (still loading)
    if (!seasonId || seasonId === 0) {
      setLoading(false);
      setGames([]);
      return;
    }
    
    // Don't fetch if we're in week/month view but the selection isn't initialized yet
    // Exception: if no selectedWeek is provided in week mode, default to current week
    if (viewMode === 'month' && !selectedMonth) {
      setLoading(false);
      setGames([]);
      return;
    }

    // Wait for API key to be ready
    if (!isApiKeyReady()) {

      let retries = 0;
      const maxRetries = 10;
      while (!isApiKeyReady() && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 200));
        retries++;
      }
      
      if (!isApiKeyReady()) {
        console.error('[useScheduleData] API key not ready after waiting');
        setError('API key not available');
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // First, fetch teams and season structure in parallel to get team names, logos, and division names
      const [teamsResponse, structureResponse] = await Promise.all([
        fetchTeams(seasonId, 'BI'),
        fetchStandings(seasonId, undefined, 'BI', 'G,D').catch(err => {
          console.warn('[useScheduleData] Season structure fetch failed (non-fatal):', err);
          return null;
        })
      ]);
      
      if (teamsResponse.Success && teamsResponse.Response?.Teams) {
        setTeams(teamsResponse.Response.Teams);
      }

      // Build dynamic division name lookup from season structure (Groups > Divisions)
      const dynamicDivisionNames: Record<number, string> = {};
      
      // PRIMARY SOURCE: Use currentSeason from useSeasons (already loaded, most reliable)
      // This is the Season object with Groups/Divisions — same data that powers division filters
      if (currentSeason?.Groups) {
        currentSeason.Groups.forEach((group: any) => {
          const groupName = group.DivGroupName || group.SeasonGroupName || '';
          group.Divisions?.forEach((div: any) => {
            if (div.DivisionId) {
              // Use the DivisionName directly — it's already descriptive (e.g. "Jr. B Tier II South")
              // Only fall back to groupName if DivisionName is empty
              const divName = div.DivisionName || div.DivisionDescription || groupName;
              dynamicDivisionNames[div.DivisionId] = divName;
            }
          });
        });
      }
      
      // SECONDARY SOURCE: Overlay with structureResponse from fetchStandings (may have additional data)
      if (structureResponse?.Success && structureResponse?.Response?.Season?.Groups) {
        structureResponse.Response.Season.Groups.forEach((group: any) => {
          const groupName = group.DivGroupName || group.SeasonGroupName || '';
          group.Divisions?.forEach((div: any) => {
            if (div.DivisionId && !dynamicDivisionNames[div.DivisionId]) {
              const divName = div.DivisionName || div.DivisionDescription || groupName;
              dynamicDivisionNames[div.DivisionId] = divName;
            }
          });
        });
      }

      // Also build division name lookup from teams data as additional fallback
      const teamDivisionNames: Record<number, string> = {};
      if (teamsResponse.Response?.Teams) {
        teamsResponse.Response.Teams.forEach((t: any) => {
          if (t.DivisionId && t.DivisionName) {
            teamDivisionNames[t.DivisionId] = t.DivisionName;
          }
        });
      }

      let dateRange: { start: string; end: string };

      // Calculate date range based on view mode
      if (viewMode === 'week' && selectedWeek && selectedWeek !== '') {
        // Parse week string like "Week of May 1 - May 7"
        // Extract the month and first day
        const match = selectedWeek.match(/Week of (\w+) (\d+)/);
        if (match) {
          const monthName = match[1];
          const day = parseInt(match[2]);
          const monthIndex = new Date(`${monthName} 1, 2000`).getMonth();
          const startDate = new Date(parseInt(season), monthIndex, day);
          dateRange = getWeekDateRange(startDate);
        } else {
          // Fallback to current week
          dateRange = getWeekDateRange(new Date());
        }
      } else if (viewMode === 'week' && (!selectedWeek || selectedWeek === '')) {
        // No week selected - default to current week (used by ScoreTicker)
        dateRange = getWeekDateRange(new Date());
      } else if (viewMode === 'month' && selectedMonth) {
        // Parse month string like "May 2025"
        const [monthName, year] = selectedMonth.split(' ');
        const monthIndex = new Date(`${monthName} 1, 2000`).getMonth();
        dateRange = getMonthDateRange(parseInt(year), monthIndex);
      } else {
        // Season view - use actual season dates if available, otherwise fallback to May-September
        if (currentSeason && currentSeason.StartDate && currentSeason.EndDate) {
          dateRange = {
            start: currentSeason.StartDate.split('T')[0], // Extract YYYY-MM-DD
            end: currentSeason.EndDate.split('T')[0]
          };
        } else {
          // Fallback to typical lacrosse season
          dateRange = {
            start: `${season}-05-01`,
            end: `${season}-09-30`
          };
        }
      }

      // Fetch schedule data
      const response = await fetchSchedule(seasonId, dateRange.start, dateRange.end, {
        games: true,
        practices: false,
        constraints: false
      });

      if (response.Success && response.Response?.Schedule?.Games) {
        
        // Enhance games with team names and other computed fields
        const enhancedGames: EnhancedGame[] = response.Response.Schedule.Games.map((game, idx) => {
          const homeTeam = teamsResponse.Response?.Teams.find(t => t.TeamId === game.HomeTeamId);
          const visitorTeam = teamsResponse.Response?.Teams.find(t => t.TeamId === game.VisitorTeamId);
          
          
          return {
            ...game,
            HomeTeamName: homeTeam?.TeamName || `Team ${game.HomeTeamId}`,
            VisitorTeamName: visitorTeam?.TeamName || `Team ${game.VisitorTeamId}`,
            HomeTeamLogoURL: homeTeam?.PrimaryTeamLogoURL,
            VisitorTeamLogoURL: visitorTeam?.PrimaryTeamLogoURL,
            GameStatus: game.GameStatusCode || GAME_STATUS[game.GameStatusCodeId] || game.GameStatus || 'Scheduled',
            DivisionName: dynamicDivisionNames[game.DivisionId] || teamDivisionNames[game.DivisionId] || DIVISION_NAMES[game.DivisionId] || homeTeam?.DivisionName || 'Unknown Division',
          };
        });
        
        setGames(enhancedGames);
      } else {
        setGames([]);
      }
    } catch (err) {
      console.error('Error fetching schedule data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch schedule');
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [seasonId, viewMode, selectedMonth, selectedWeek]);

  // Filter games by division and team using DivisionId
  const filteredGames = useMemo(() => games.filter(game => {
    // Division filter
    if (division && division !== 'All Divisions') {
      // Get the list of allowed division IDs
      let allowedDivisionIds: number[] = [];
      
      // If a subdivision is selected, use dynamic subdivision map if available
      if (subDivision && subDivision !== 'All' && subDivisionMap && subDivisionMap[subDivision]) {
        allowedDivisionIds = subDivisionMap[subDivision];
      }
      // Fallback to static SUB_DIVISION_IDS
      else if (subDivision && subDivision !== 'All' && SUB_DIVISION_IDS[division]?.[subDivision]) {
        allowedDivisionIds = SUB_DIVISION_IDS[division][subDivision];
      } 
      // Otherwise use all division IDs for the main division group
      else if (divisionGroupMap && divisionGroupMap[division]) {
        allowedDivisionIds = divisionGroupMap[division];
      }
      else if (DIVISION_GROUPS[division]) {
        allowedDivisionIds = DIVISION_GROUPS[division];
      }
      
      // Filter by DivisionId
      if (allowedDivisionIds.length > 0 && !allowedDivisionIds.includes(game.DivisionId)) {
        return false;
      }
    }
    
    // Team filter
    if (team && team !== 'All Teams') {
      if (game.HomeTeamName !== team && game.VisitorTeamName !== team) {
        return false;
      }
    }
    
    return true;
  }), [games, division, subDivision, team, subDivisionMap, divisionGroupMap]);
  
  return {
    games: filteredGames,
    teams,
    loading,
    error,
    refetch: fetchData
  };
}