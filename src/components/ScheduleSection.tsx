import { useState, useEffect, useMemo, useRef, Fragment } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock, Calendar as CalendarIcon, LayoutGrid, List, CalendarDays, X, Download, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown, FileText, FileSpreadsheet, MessageSquare } from 'lucide-react';
import { useDivision } from '../contexts/DivisionContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { GameSheetModal } from './GameSheetModal';
import { FacilityMapLink } from './FacilityMapLink';
import { useScheduleData } from '../hooks/useScheduleData';
import { useSeasons } from '../hooks/useSeasons';
import { useDivisionScheduleStatus } from '../hooks/useDivisionScheduleStatus';
import {
  parseGameTime,
  parseGameTimeCompact,
  formatGameDate,
  formatGameDateLong,
  buildDivisionGroups,
  getSubDivisions,
  hasSubDivisions,
  generateSeasonMonths,
  generateSeasonWeeks,
  generateMonthsFromGames,
  generateWeeksFromGames,
  detectGameDateRange,
  buildStandingsCategoryMappingFromGames,
  getUniqueGameTypesFromGames,
  mapStandingCategoryCodeToName,
  parseDateAsLocal,
  resolveGameStatus,
  hasScores,
  isGameComplete
} from '../services/sportzsoft';
import type { EnhancedGame } from '../services/sportzsoft';
import { exportGamesToCalendar, type GameForCalendar } from '../utils/calendar';
import shamrocksLogo from 'figma:asset/451bbc9cb0dc69d999248789df7937a5d31b2bc3.png';
import rockiesLogo from 'figma:asset/7731aebae94e152f358806079868cc4565ee122c.png';
import silvertipsLogo from 'figma:asset/684000dca4c85b66ba1fc0229c1108f3ed19c423.png';
import coloradoLogo from 'figma:asset/7b200b07ad33b0b371963d2489b2746b0467043c.png';
import crudeLogo from 'figma:asset/624710d201f00439999e5d9f4d18a983f346e1b2.png';
import rampageLogo from 'figma:asset/c2b0866dd6acd5ea1a4ca18182e137eb37131c88.png';

// Team logo mapping - maps team names to their logo images
const TEAM_LOGO_MAP: Record<string, string> = {
  'Calgary Shamrocks': shamrocksLogo,
  'Calgary Rockies': rockiesLogo,
  'Calgary Silvertips': silvertipsLogo,
  'Colorado Mammoth': coloradoLogo,
  'Calgary Crude': crudeLogo,
  'Calgary Rampage': rampageLogo,
  // Add more mappings as needed
};

// Helper function to get team logo by team name
const getTeamLogo = (teamName: string, apiLogoUrl?: string): string => {
  // First try the API logo URL
  if (apiLogoUrl) {
    return apiLogoUrl;
  }
  
  // Fall back to team name mapping
  const mappedLogo = TEAM_LOGO_MAP[teamName];
  if (mappedLogo) {
    return mappedLogo;
  }
  
  // Final fallback to default logo
  return shamrocksLogo;
};

interface Game {
  id: string;
  gameNumber?: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId?: number;
  visitorTeamId?: number;
  homeScore: number;
  awayScore: number;
  homeRecord: string;
  awayRecord: string;
  date: string;
  fullDate: string;
  time: string;
  status: 'FINAL' | 'LIVE' | 'UPCOMING' | 'EXHIBITION';
  homeLogo: string;
  awayLogo: string;
  division: string;
  divisionId: number;
  location: string;
  venue: string;
  standingCategoryCode?: string; // Added for game type filtering
  gameComments?: string | null; // Game comments from API (always shown)
  schedulingComments?: string | null; // Scheduling comments from API (only shown when schedule in progress)
  homeTeamDivisionId?: number; // Home team's division — for crossover game detection
  visitorTeamDivisionId?: number; // Visitor team's division — for crossover game detection
}

// Status badge styling and labels
function getStatusBadgeStyle(status: string): string {
  switch (status) {
    case 'FINAL': return 'bg-[#4b5baa] text-white';
    case 'LIVE': return 'bg-red-600 text-white';
    case 'EXHIBITION': return 'bg-amber-600 text-white';
    case 'SUSPENDED': return 'bg-yellow-600 text-white';
    case 'CANCELLED': return 'bg-gray-400 text-white';
    case 'FORFEIT': return 'bg-orange-700 text-white';
    case 'DEFAULT': return 'bg-orange-600 text-white';
    default: return 'bg-gray-600 text-white';
  }
}
function getStatusLabel(status: string): string {
  switch (status) {
    case 'FINAL': return 'Final';
    case 'LIVE': return 'LIVE';
    case 'UPCOMING': return 'Upcoming';
    case 'EXHIBITION': return 'Exhibition';
    case 'SUSPENDED': return 'Suspended';
    case 'CANCELLED': return 'Cancelled';
    case 'FORFEIT': return 'Forfeit';
    case 'DEFAULT': return 'Default';
    default: return status;
  }
}

export function ScheduleSection() {
  const { 
    selectedDivision: favoriteDivision, 
    selectedSubDivision: favoriteSubDivision
  } = useDivision();
  
  // Fetch available seasons from the API
  const { 
    seasons, 
    seasonYears, 
    seasonIdsByYear, 
    standingsCategoryMapping,
    gameTypes: apiGameTypes,
    loading: seasonsLoading, 
    getCurrentSeasonYear 
  } = useSeasons();
  
  const [selectedDivision, setSelectedDivision] = useState(() =>
    favoriteDivision || 'All Divisions'
  );
  const [selectedSubDivision, setSelectedSubDivision] = useState(() =>
    favoriteSubDivision || 'All'
  );
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedSeasonYear, setSelectedSeasonYear] = useState(() => new Date().getFullYear().toString());
  const [selectedGameType, setSelectedGameType] = useState('All Game Types');
  const [selectedTeam, setSelectedTeam] = useState('All Teams');
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'season'>('week');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'card' | 'calendar'>('grid');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Track previous season to detect actual season changes
  const prevSeasonRef = useRef<string>('');
  // Track if we've initialized week/month to prevent re-triggering on array recalculations
  const initializedRef = useRef<boolean>(false);
  // Track if we had real data last time - to detect transition from fallback to real
  const hadRealDataRef = useRef<boolean>(false);
  // Track previous game type to detect actual game type changes
  const prevGameTypeRef = useRef<string>('All Game Types');
  
  // Use API season years if available, otherwise use fallback
  const availableSeasonYears = seasonYears.length > 0 ? seasonYears : ['2025', '2024', '2023', '2022'];
  
  // Build dynamic division groups from the current season
  const currentSeason = useMemo(() => {
    return seasons.find(s => s.StartYear.toString() === selectedSeasonYear) || seasons[0];
  }, [seasons, selectedSeasonYear]);
  
  const divisionGroups = useMemo(() => {
    if (!currentSeason) return { 'All Divisions': [] };
    return buildDivisionGroups(currentSeason);
  }, [currentSeason]);
  
  const divisions = useMemo(() => {
    return Object.keys(divisionGroups);
  }, [divisionGroups]);

  // Collect all division IDs from the current season for schedule status checks
  const allDivisionIds = useMemo(() => {
    const ids: number[] = [];
    Object.values(divisionGroups).forEach(divIds => {
      divIds.forEach(id => {
        if (!ids.includes(id)) ids.push(id);
      });
    });
    return ids;
  }, [divisionGroups]);

  const isViewingCurrentSeason = parseInt(selectedSeasonYear) >= new Date().getFullYear();
  const selectedSeasonId = seasonIdsByYear[selectedSeasonYear] || 0;

  // Fetch GameScheduleReady / GameScheduleFinal flags for all divisions
  const {
    isScheduleReady,
    isScheduleFinal,
    inProgressDivisionIds,
    statusMap: divisionStatusMap,
    loading: scheduleStatusLoading
  } = useDivisionScheduleStatus(allDivisionIds, selectedSeasonId);

  // Build game types list from API data (with fallback)
  const gameTypes = useMemo(() => {
    if (apiGameTypes.length > 0) {
      return ['All Game Types', ...apiGameTypes];
    }
    return ['All Game Types', 'Regular Season', 'Playoffs', 'Provincials'];
  }, [apiGameTypes]);
  
  // Helper function to check if a game matches the selected game type
  const matchesGameType = (gameCode: string | undefined, selectedType: string): boolean => {
    if (selectedType === 'All Game Types') {
      return true;
    }

    const gameType = getGameTypeFromCode(gameCode);
    if (!gameType) {
      // If we can't determine the game type, show it (don't filter it out)
      return true;
    }

    // Exact match
    if (gameType === selectedType) {
      return true;
    }

    // Fuzzy match - handle minor differences in capitalization, spacing, etc.
    const normalizedGameType = gameType.toLowerCase().trim();
    const normalizedSelectedType = selectedType.toLowerCase().trim();

    if (normalizedGameType === normalizedSelectedType) {
      return true;
    }

    // Check if one contains the other (e.g., 'Regular Season' matches 'Regular')
    if (normalizedGameType.includes(normalizedSelectedType) ||
        normalizedSelectedType.includes(normalizedGameType)) {
      return true;
    }

    return false;
  };

 // Fetch ALL games for the season (for generating weeks/months lists)
  const { games: allSeasonGames, teams: allSeasonTeams } = useScheduleData({
    seasonId: selectedSeasonId,
    season: selectedSeasonYear,
    viewMode: 'season',
    selectedMonth: undefined,
    selectedWeek: undefined,
    division: 'All Divisions',
    subDivision: 'All',
    team: 'All Teams',
    currentSeason: currentSeason,
    subDivisionMap: undefined,
    divisionGroupMap: divisionGroups
  });
  
// Fetch filtered data for display based on current filters
  const { games: apiGames, teams, loading, error } = useScheduleData({
    seasonId: selectedSeasonId,
    season: selectedSeasonYear,
    viewMode,
    selectedMonth,
    selectedWeek,
    // Use 'All Divisions' to let our robust client-side logic handle filtering
    // This ensures we get all games including crossover games
    division: 'All Divisions',
    subDivision: 'All',
    team: 'All Teams',
    currentSeason: currentSeason,
    subDivisionMap: undefined,
    divisionGroupMap: divisionGroups
  });

  // NEW: Build a highly reliable map of TeamId -> DivisionId across the whole season
  // This saves us when SportzSoft fails to include team division IDs on crossover games
  const teamDivisionMap = useMemo(() => {
    const map = new Map<number, number>();
    const addTeams = (teamList: any[]) => {
      if (!teamList) return;
      teamList.forEach(t => {
        if (t.TeamId && t.DivisionId) {
          map.set(t.TeamId, t.DivisionId);
        }
      });
    };
    addTeams(allSeasonTeams);
    addTeams(teams);
    return map;
  }, [allSeasonTeams, teams]);
  
  // NOW calculate subdivisions with teams data (after teams are loaded from useScheduleData)
  const currentSubDivisions = useMemo(() => {
    const teamsForFiltering = teams.length > 0 ? teams : undefined;
    if (!currentSeason || !hasSubDivisions(currentSeason, selectedDivision, teamsForFiltering)) {
      return {};
    }
    return getSubDivisions(currentSeason, selectedDivision, teamsForFiltering);
  }, [currentSeason, selectedDivision, teams]);
  
  const availableSubDivisions = useMemo(() => {
    return Object.keys(currentSubDivisions);
  }, [currentSubDivisions]);

  // Build complete subdivisions for ALL divisions in the season (for global context)
  const allSeasonSubDivisions = useMemo(() => {
    if (!currentSeason) return {};
    
    const allSubs: Record<string, string[]> = {};
    const teamsForFiltering = teams.length > 0 ? teams : undefined;
    const actualDivisions = divisions.filter(d => d !== 'All Divisions');
    
    actualDivisions.forEach(divName => {
      if (hasSubDivisions(currentSeason, divName, teamsForFiltering)) {
        const subs = getSubDivisions(currentSeason, divName, teamsForFiltering);
        allSubs[divName] = Object.keys(subs);
      }
    });
    
    return allSubs;
  }, [currentSeason, divisions, teams]);

  useEffect(() => {
    if (seasonYears.length > 0 && !seasonYears.includes(selectedSeasonYear)) {
      setSelectedSeasonYear(getCurrentSeasonYear());
    }
  }, [seasonYears, getCurrentSeasonYear]);

  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const effectiveLayoutMode = isMobile ? 'card' : layoutMode;

  const handlePreviousWeek = () => {
    const currentIndex = weeks.indexOf(selectedWeek);
    if (currentIndex > 0) setSelectedWeek(weeks[currentIndex - 1]);
  };

  const handleNextWeek = () => {
    const currentIndex = weeks.indexOf(selectedWeek);
    if (currentIndex < weeks.length - 1) setSelectedWeek(weeks[currentIndex + 1]);
  };

  const handlePreviousMonth = () => {
    const currentIndex = months.indexOf(selectedMonth);
    if (currentIndex > 0) setSelectedMonth(months[currentIndex - 1]);
  };

  const handleNextMonth = () => {
    const currentIndex = months.indexOf(selectedMonth);
    if (currentIndex < months.length - 1) setSelectedMonth(months[currentIndex + 1]);
  };

  const handleExportToCalendar = () => {
    if (filteredGames.length === 0) {
      alert('No games to export');
      return;
    }
    const calendarGames: GameForCalendar[] = filteredGames.map(game => ({
      id: game.id,
      gameNumber: game.gameNumber,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      venue: game.venue,
      date: game.date,
      fullDate: game.fullDate,
      time: game.time,
      division: game.division,
      status: game.status
    }));
    exportGamesToCalendar(calendarGames);
    setExportModalOpen(false);
  };

  const handleExportToCSV = () => {
    if (filteredGames.length === 0) {
      alert('No games to export');
      return;
    }
    const headers = ['Game #', 'Date', 'Time', 'Division', 'Home Team', 'Away Team', 'Score', 'Location', 'Status', 'Scheduling Comments', 'Game Comments'];
    const rows = filteredGames.map(game => [
      game.gameNumber || '-',
      game.date,
      game.time,
      game.division,
      game.homeTeam,
      game.awayTeam,
      hasScores(game.status) ? `${game.homeScore ?? 0}-${game.awayScore ?? 0}` : '-',
      game.venue,
      game.status,
      `"${(game.schedulingComments || '').replace(/"/g, '""')}"`,
      `"${(game.gameComments || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `RMLL_Schedule_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    setExportModalOpen(false);
  };

  const handleExportToPDF = () => {
    if (filteredGames.length === 0) {
      alert('No games to export');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to export PDF');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>RMLL Schedule</title>
          <style>
            @page { size: landscape; margin: 0.5in; }
            body { font-family: Arial, sans-serif; font-size: 10px; }
            h1 { text-align: center; color: #001741; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #001741; color: white; padding: 8px; text-align: left; font-weight: bold; }
            td { padding: 6px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background: #f9f9f9; }
            .text-center { text-align: center; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Rocky Mountain Lacrosse League - Schedule</h1>
          <p style="text-align: center; margin-bottom: 20px;">
            ${selectedDivision} - ${selectedSeasonYear} ${selectedGameType}
          </p>
          <table>
            <thead>
              <tr>
                <th>Game #</th>
                <th>Date</th>
                <th>Time</th>
                <th>Division</th>
                <th>Home Team</th>
                <th>Away Team</th>
                <th>Score</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredGames.map(game => `
                <tr>
                  <td>${game.gameNumber || '-'}</td>
                  <td>${game.date}</td>
                  <td>${game.time}</td>
                  <td>${game.division}</td>
                  <td>${game.homeTeam}</td>
                  <td>${game.awayTeam}</td>
                  <td>${hasScores(game.status) ? `${game.homeScore}-${game.awayScore}` : '-'}</td>
                  <td>${game.venue}</td>
                  <td>${game.status}</td>
                </tr>
                ${game.schedulingComments && game.schedulingComments.trim() ? `<tr><td colspan="9" style="padding: 0 8px 6px; font-size: 11px; color: #b45309; font-style: italic;">📝 ${game.schedulingComments}</td></tr>` : ''}
                ${game.gameComments && game.gameComments.trim() ? `<tr><td colspan="9" style="padding: 0 8px 6px; font-size: 11px; color: #3b82f6; font-style: italic;">📝 ${game.gameComments}</td></tr>` : ''}
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    setExportModalOpen(false);
  };

  // Generate dynamic months based on actual games with scheduled dates
  const months = useMemo(() => {
    if (!allSeasonGames || allSeasonGames.length === 0) {
      if (currentSeason && currentSeason.StartDate && currentSeason.EndDate) {
        return generateSeasonMonths(currentSeason.StartDate, currentSeason.EndDate);
      }
      return [];
    }

const convertedAllGames = allSeasonGames.map((apiGame) => ({
      ...apiGame, // Keep all the original properties to satisfy TypeScript
      HomeTeamDivisionId: apiGame.HomeTeamDivisionId || teamDivisionMap.get(apiGame.HomeTeamId),
      VisitorTeamDivisionId: apiGame.VisitorTeamDivisionId || teamDivisionMap.get(apiGame.VisitorTeamId)
    }));
    let filteredForMonths = convertedAllGames;

    if (selectedGameType !== 'All Game Types') {
      filteredForMonths = filteredForMonths.filter(game => {
        const gameType = mapStandingCategoryCodeToName(game.StandingCategoryCode);
        return gameType === selectedGameType;
      });
    }

    if (selectedDivision !== 'All Divisions') {
      const divisionIds = divisionGroups[selectedDivision] || [];
      filteredForMonths = filteredForMonths.filter(game => 
        divisionIds.includes(game.DivisionId) ||
        (game.HomeTeamDivisionId && divisionIds.includes(game.HomeTeamDivisionId)) ||
        (game.VisitorTeamDivisionId && divisionIds.includes(game.VisitorTeamDivisionId))
      );
    }

    if (selectedSubDivision !== 'All' && currentSubDivisions[selectedSubDivision]) {
      const subDivisionIds = currentSubDivisions[selectedSubDivision];
      filteredForMonths = filteredForMonths.filter(game => 
        subDivisionIds.includes(game.DivisionId) ||
        (game.HomeTeamDivisionId && subDivisionIds.includes(game.HomeTeamDivisionId)) ||
        (game.VisitorTeamDivisionId && subDivisionIds.includes(game.VisitorTeamDivisionId))
      );
    }

    if (selectedTeam !== 'All Teams') {
      filteredForMonths = filteredForMonths.filter(game =>
        game.HomeTeamName === selectedTeam || game.VisitorTeamName === selectedTeam
      );
    }

    if (filteredForMonths.length > 0) {
      const monthsWithGames = generateMonthsFromGames(filteredForMonths);
      if (monthsWithGames.length > 0) return monthsWithGames;
    }
    
    if (currentSeason && currentSeason.StartDate && currentSeason.EndDate) {
      return generateSeasonMonths(currentSeason.StartDate, currentSeason.EndDate);
    }
    return [];
  }, [allSeasonGames, currentSeason, selectedGameType, selectedDivision, selectedSubDivision, selectedTeam, divisionGroups, currentSubDivisions]);
  
  // Generate dynamic weeks based on actual games with scheduled dates
  const weeks = useMemo(() => {
    if (!allSeasonGames || allSeasonGames.length === 0) {
      if (currentSeason && currentSeason.StartDate && currentSeason.EndDate) {
        return generateSeasonWeeks(currentSeason.StartDate, currentSeason.EndDate);
      }
      return [];
    }

const convertedAllGames = allSeasonGames.map((apiGame) => ({
      ...apiGame, // Keep all the original properties to satisfy TypeScript
      HomeTeamDivisionId: apiGame.HomeTeamDivisionId || teamDivisionMap.get(apiGame.HomeTeamId),
      VisitorTeamDivisionId: apiGame.VisitorTeamDivisionId || teamDivisionMap.get(apiGame.VisitorTeamId)
    }));

    let filteredForWeeks = convertedAllGames;

    if (selectedGameType !== 'All Game Types') {
      filteredForWeeks = filteredForWeeks.filter(game => {
        const gameType = mapStandingCategoryCodeToName(game.StandingCategoryCode);
        return gameType === selectedGameType;
      });
    }

    if (selectedDivision !== 'All Divisions') {
      const divisionIds = divisionGroups[selectedDivision] || [];
      filteredForWeeks = filteredForWeeks.filter(game => 
        divisionIds.includes(game.DivisionId) ||
        (game.HomeTeamDivisionId && divisionIds.includes(game.HomeTeamDivisionId)) ||
        (game.VisitorTeamDivisionId && divisionIds.includes(game.VisitorTeamDivisionId))
      );
    }

    if (selectedSubDivision !== 'All' && currentSubDivisions[selectedSubDivision]) {
      const subDivisionIds = currentSubDivisions[selectedSubDivision];
      filteredForWeeks = filteredForWeeks.filter(game => 
        subDivisionIds.includes(game.DivisionId) ||
        (game.HomeTeamDivisionId && subDivisionIds.includes(game.HomeTeamDivisionId)) ||
        (game.VisitorTeamDivisionId && subDivisionIds.includes(game.VisitorTeamDivisionId))
      );
    }

    if (selectedTeam !== 'All Teams') {
      filteredForWeeks = filteredForWeeks.filter(game =>
        game.HomeTeamName === selectedTeam || game.VisitorTeamName === selectedTeam
      );
    }

    if (filteredForWeeks.length > 0) {
      const weeksWithGames = generateWeeksFromGames(filteredForWeeks);
      if (weeksWithGames.length > 0) return weeksWithGames;
    }
    
    if (currentSeason && currentSeason.StartDate && currentSeason.EndDate) {
      return generateSeasonWeeks(currentSeason.StartDate, currentSeason.EndDate);
    }
    return [];
  }, [allSeasonGames, currentSeason, selectedGameType, selectedDivision, selectedSubDivision, selectedTeam, divisionGroups, currentSubDivisions]);
  
  const hasRealData = useMemo(() => {
    return allSeasonGames && allSeasonGames.length > 0;
  }, [allSeasonGames]);

  const isReadyToRender = useMemo(() => {
    const hasData = weeks.length > 0 || months.length > 0;
    const hasSelections = selectedWeek !== '' && selectedMonth !== '';
    return hasData && hasSelections && !loading && !error;
  }, [weeks.length, months.length, selectedWeek, selectedMonth, loading, error]);

  const findCurrentWeek = (weeksList: string[]): string | null => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (const weekStr of weeksList) {
      const match = weekStr.match(/Week of (\w+) (\d+) - (\w+) (\d+)/);
      if (match) {
        const [, startMonth, startDay, endMonth, endDay] = match;
        const startMonthIndex = monthNames.indexOf(startMonth);
        const endMonthIndex = monthNames.indexOf(endMonth);
        const year = parseInt(selectedSeasonYear);
        
        const weekStart = new Date(year, startMonthIndex, parseInt(startDay));
        const weekEnd = new Date(year, endMonthIndex, parseInt(endDay));
        
        if (today >= weekStart && today <= weekEnd) return weekStr;
      }
    }
    return null;
  };

  useEffect(() => {
    const seasonChanged = prevSeasonRef.current !== '' && prevSeasonRef.current !== selectedSeasonYear;
    const realDataJustLoaded = !hadRealDataRef.current && hasRealData;
    
    if (seasonChanged) {
      initializedRef.current = false;
      hadRealDataRef.current = false;
      setSelectedWeek('');
      setSelectedMonth('');
    }
    
    if (realDataJustLoaded) {
      initializedRef.current = false;
    }
    
    if (weeks.length > 0 && selectedWeek !== '' && !weeks.includes(selectedWeek)) {
      setSelectedWeek('');
      initializedRef.current = false; 
    }
    
    if (weeks.length > 0 && !initializedRef.current) {
      const today = new Date();
      const seasonStart = currentSeason?.StartDate ? new Date(currentSeason.StartDate) : null;
      const seasonEnd = currentSeason?.EndDate ? new Date(currentSeason.EndDate) : null;
      const isSeasonActive = seasonStart && seasonEnd && today >= seasonStart && today <= seasonEnd;
      
      let weekToSelect: string;
      if (isSeasonActive) {
        const currentWeek = findCurrentWeek(weeks);
        weekToSelect = currentWeek || weeks[0];
      } else {
        weekToSelect = weeks[0];
      }
      setSelectedWeek(weekToSelect);
    }
    
    if (months.length > 0 && selectedMonth !== '' && !months.includes(selectedMonth)) {
      setSelectedMonth('');
      initializedRef.current = false;
    }
    
    if (months.length > 0 && !initializedRef.current) {
      const today = new Date();
      const seasonStart = currentSeason?.StartDate ? new Date(currentSeason.StartDate) : null;
      const seasonEnd = currentSeason?.EndDate ? new Date(currentSeason.EndDate) : null;
      const isSeasonActive = seasonStart && seasonEnd && today >= seasonStart && today <= seasonEnd;
      
      let monthToSelect: string;
      if (isSeasonActive) {
        const currentYear = new Date().getFullYear();
        const currentMonthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][today.getMonth()];
        const currentMonthStr = `${currentMonthName} ${currentYear}`;
        monthToSelect = months.includes(currentMonthStr) ? currentMonthStr : months[0];
      } else {
        monthToSelect = months[0];
      }
      setSelectedMonth(monthToSelect);
      initializedRef.current = true;
    }
    
    if (prevSeasonRef.current !== selectedSeasonYear) {
      prevSeasonRef.current = selectedSeasonYear;
    }
    hadRealDataRef.current = hasRealData;
  }, [selectedSeasonYear, weeks.length, months.length, hasRealData]);

  useEffect(() => {
    setSelectedDivision(favoriteDivision);
    setSelectedSubDivision(favoriteSubDivision);
  }, [favoriteDivision, favoriteSubDivision]);

  useEffect(() => {
    setSelectedTeam('All Teams');
  }, [selectedDivision]);
  
  useEffect(() => {
    if (availableSubDivisions.length > 0 && !availableSubDivisions.includes(selectedSubDivision)) {
      setSelectedSubDivision('All');
    }
  }, [selectedDivision, availableSubDivisions, selectedSubDivision]);

  useEffect(() => {
    if (selectedWeek && weeks.length > 0 && !weeks.includes(selectedWeek)) {
      setSelectedWeek(weeks[0]);
    }
    if (selectedMonth && months.length > 0 && !months.includes(selectedMonth)) {
      setSelectedMonth(months[0]);
    }
  }, [weeks, months, selectedWeek, selectedMonth]);

  useEffect(() => {
    const gameTypeActuallyChanged = prevGameTypeRef.current !== selectedGameType;
    if (!gameTypeActuallyChanged) return;
    prevGameTypeRef.current = selectedGameType;

    if (!allSeasonGames || allSeasonGames.length === 0 || !weeks.length || !months.length) return;

    let firstGameOfType;
    if (selectedGameType === 'All Game Types') {
      const sortedGames = [...allSeasonGames].sort((a, b) => 
        new Date(a.GameDate).getTime() - new Date(b.GameDate).getTime()
      );
      firstGameOfType = sortedGames[0];
    } else {
      firstGameOfType = allSeasonGames.find(game => {
        const gameType = mapStandingCategoryCodeToName(game.StandingCategoryCode);
        return gameType === selectedGameType;
      });
    }

    if (!firstGameOfType) return;

    const gameDate = new Date(firstGameOfType.GameDate);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (weeks.length > 0) {
      const weekStr = weeks.find(weekStr => {
        const match = weekStr.match(/Week of (\w+) (\d+) - (\w+) (\d+)/);
        if (match) {
          const [, startMonth, startDay, endMonth, endDay] = match;
          const startMonthIndex = monthNames.indexOf(startMonth);
          const endMonthIndex = monthNames.indexOf(endMonth);
          const year = gameDate.getFullYear();
          
          const weekStart = new Date(year, startMonthIndex, parseInt(startDay));
          const weekEnd = new Date(year, endMonthIndex, parseInt(endDay));
          weekEnd.setHours(23, 59, 59, 999);
          
          return gameDate >= weekStart && gameDate <= weekEnd;
        }
        return false;
      });
      if (weekStr) setSelectedWeek(weekStr);
    }

    if (months.length > 0) {
      const gameMonthName = monthNames[gameDate.getMonth()];
      const gameYear = gameDate.getFullYear();
      const monthStr = `${gameMonthName} ${gameYear}`;
      if (months.includes(monthStr)) setSelectedMonth(monthStr);
    }
  }, [selectedGameType, weeks, months, allSeasonGames]);

  const teamRecords = useMemo(() => {
    const records = new Map<number, { wins: number; losses: number; ties: number }>();
    if (!allSeasonGames || allSeasonGames.length === 0) return records;
    
    allSeasonGames.forEach(game => {
      const resolved = resolveGameStatus(game.GameStatus, game.StandingCategoryCode);
      const isFinal = resolved === 'FINAL' || resolved === 'FORFEIT' || resolved === 'DEFAULT';
      if (!isFinal) return;
      
      const homeScore = game.HomeScore ?? 0;
      const awayScore = game.VisitorScore ?? 0;
      
      if (!records.has(game.HomeTeamId)) records.set(game.HomeTeamId, { wins: 0, losses: 0, ties: 0 });
      if (!records.has(game.VisitorTeamId)) records.set(game.VisitorTeamId, { wins: 0, losses: 0, ties: 0 });
      
      const homeRec = records.get(game.HomeTeamId)!;
      const awayRec = records.get(game.VisitorTeamId)!;
      
      if (homeScore > awayScore) {
        homeRec.wins++;
        awayRec.losses++;
      } else if (awayScore > homeScore) {
        awayRec.wins++;
        homeRec.losses++;
      } else {
        homeRec.ties++;
        awayRec.ties++;
      }
    });
    return records;
  }, [allSeasonGames]);
  
  const formatRecord = (teamId: number): string => {
    const rec = teamRecords.get(teamId);
    if (!rec) return '';
    return `${rec.wins}-${rec.losses}-${rec.ties}`;
  };

  const convertedGames: Game[] = apiGames.map((apiGame) => {
    const hasScores = apiGame.HomeScore !== undefined && apiGame.HomeScore !== null &&
                      apiGame.VisitorScore !== undefined && apiGame.VisitorScore !== null;

    // Score logic: if both HomeScore and VisitorScore are 0, use BoxScore fields
    // (BoxScoreHome/BoxScoreVisitor have the running score for in-progress games)
    let homeScore: number | undefined = hasScores ? apiGame.HomeScore : undefined;
    let awayScore: number | undefined = hasScores ? apiGame.VisitorScore : undefined;
    if (hasScores && !homeScore && !awayScore) {
      homeScore = apiGame.BoxScoreHome ?? homeScore;
      awayScore = apiGame.BoxScoreVisistor ?? apiGame.BoxScoreVisitor ?? awayScore;
    }

    return {
      id: apiGame.GameId.toString(),
      gameNumber: (apiGame.GameNumber || apiGame.GameNo || apiGame.GameNum || apiGame.Number)?.toString() || undefined,
      homeTeam: apiGame.HomeTeamName || 'Home Team',
      awayTeam: apiGame.VisitorTeamName || 'Away Team',
      homeTeamId: apiGame.HomeTeamId,
      visitorTeamId: apiGame.VisitorTeamId,
      homeScore,
      awayScore,
      homeRecord: formatRecord(apiGame.HomeTeamId),
      awayRecord: formatRecord(apiGame.VisitorTeamId),
      date: formatGameDate(apiGame.GameDate),
      fullDate: apiGame.GameDate,
      time: parseGameTime(apiGame.StartTime) || parseGameTime(apiGame.GameDate),
      status: resolveGameStatus(apiGame.GameStatus, apiGame.StandingCategoryCode),
      homeLogo: apiGame.HomeTeamLogoURL || getTeamLogo(apiGame.HomeTeamName || 'Home Team', undefined),
      awayLogo: apiGame.VisitorTeamLogoURL || getTeamLogo(apiGame.VisitorTeamName || 'Away Team', undefined),
      division: apiGame.DivisionName || 'Unknown',
      divisionId: apiGame.DivisionId,
      location: apiGame.FacilityName,
      venue: apiGame.FacilityName,
      standingCategoryCode: apiGame.StandingCategoryCode,
      gameComments: apiGame.GameComments || null,
      schedulingComments: apiGame.SchedulingComments || null,
      homeTeamDivisionId: apiGame.HomeTeamDivisionId || teamDivisionMap.get(apiGame.HomeTeamId),
      visitorTeamDivisionId: apiGame.VisitorTeamDivisionId || teamDivisionMap.get(apiGame.VisitorTeamId),
    };
  });

  const actualStandingsCategoryMapping = useMemo(() => {
    if (convertedGames && convertedGames.length > 0) {
      const gamesForMapping = convertedGames.map(g => ({
        StandingCategoryCode: g.standingCategoryCode,
        GameId: g.id,
        GameDate: g.fullDate
      } as any));
      return buildStandingsCategoryMappingFromGames(gamesForMapping);
    }
    return standingsCategoryMapping;
  }, [convertedGames, standingsCategoryMapping]);
  
  const getGameTypeFromCode = (code: string | undefined): string | null => {
    if (!code || code === 'null') return null;
    if (actualStandingsCategoryMapping[code]) return actualStandingsCategoryMapping[code];

    const upperCode = code.toUpperCase().trim();
    if (actualStandingsCategoryMapping[upperCode]) return actualStandingsCategoryMapping[upperCode];

    // Fallback: try to match using partial string comparison
    const mappedName = mapStandingCategoryCodeToName(code);
    if (mappedName && mappedName !== 'All Games') {
      return mappedName;
    }

    return null;
  };

  // Filter games by game type, crossover divisions, and teams
  let filteredGames = convertedGames.filter(game => {
    // 1. Game Type filter
    if (selectedGameType !== 'All Game Types' && !matchesGameType(game.standingCategoryCode, selectedGameType)) {
      return false;
    }
    
    // 2. Division filter (Crossover support)
    if (selectedDivision !== 'All Divisions') {
      const divisionIds = divisionGroups[selectedDivision] || [];
      const matchesDivision = (game.divisionId && divisionIds.includes(game.divisionId)) ||
                              (game.homeTeamDivisionId && divisionIds.includes(game.homeTeamDivisionId)) ||
                              (game.visitorTeamDivisionId && divisionIds.includes(game.visitorTeamDivisionId));
      if (!matchesDivision) return false;
    }
    
    // 3. SubDivision filter (Crossover support)
    if (selectedSubDivision !== 'All' && currentSubDivisions[selectedSubDivision]) {
      const subDivisionIds = currentSubDivisions[selectedSubDivision];
      const matchesSubDivision = (game.divisionId && subDivisionIds.includes(game.divisionId)) ||
                                 (game.homeTeamDivisionId && subDivisionIds.includes(game.homeTeamDivisionId)) ||
                                 (game.visitorTeamDivisionId && subDivisionIds.includes(game.visitorTeamDivisionId));
      if (!matchesSubDivision) return false;
    }

    // 4. Team filter (case-insensitive)
    if (selectedTeam !== 'All Teams') {
      if (game.homeTeam?.toLowerCase() !== selectedTeam.toLowerCase() &&
          game.awayTeam?.toLowerCase() !== selectedTeam.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  if (viewMode === 'season' && sortColumn) {
    filteredGames = [...filteredGames].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'gameNumber': {
          const aStr = a.gameNumber || a.id || '';
          const bStr = b.gameNumber || b.id || '';
          const cmp = aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' });
          return sortDirection === 'asc' ? cmp : -cmp;
        }
        case 'date':
          aValue = new Date(a.fullDate).getTime();
          bValue = new Date(b.fullDate).getTime();
          break;
        case 'time':
          const parseTime = (timeStr: string) => {
            const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
            if (!match) return 0;
            let hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            const period = match[3]?.toUpperCase();
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            return hours * 60 + minutes;
          };
          aValue = parseTime(a.time);
          bValue = parseTime(b.time);
          break;
        case 'venue':
          aValue = a.venue.toLowerCase();
          bValue = b.venue.toLowerCase();
          break;
        case 'homeTeam':
          aValue = a.homeTeam.toLowerCase();
          bValue = b.homeTeam.toLowerCase();
          break;
        case 'awayTeam':
          aValue = a.awayTeam.toLowerCase();
          bValue = b.awayTeam.toLowerCase();
          break;
        case 'score':
          aValue = hasScores(a.status) ? (a.homeScore + a.awayScore) : -1;
          bValue = hasScores(b.status) ? (b.homeScore + b.awayScore) : -1;
          break;
        case 'status':
          const statusOrder: Record<string, number> = { 'LIVE': 0, 'UPCOMING': 1, 'EXHIBITION': 1, 'SUSPENDED': 1, 'CANCELLED': 1, 'FORFEIT': 2, 'DEFAULT': 2, 'FINAL': 2 };
          aValue = statusOrder[a.status] ?? 3;
          bValue = statusOrder[b.status] ?? 3;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const availableTeams = useMemo(() => {
    const teamSet = new Set<string>();
    filteredGames.forEach(game => {
      if (game.HomeTeamName) teamSet.add(game.HomeTeamName);
      if (game.VisitorTeamName) teamSet.add(game.VisitorTeamName);
    });
    return ['All Teams', ...Array.from(teamSet).sort()];
  }, [filteredGames]);

  // Support resolving multiple division names for crossover games
  const getDivisionNamesForGame = (game: Game) => {
    const names = new Set<string>();
    names.add(game.division); // Primary
    
    Object.entries(divisionGroups).forEach(([divName, divIds]) => {
      if ((game.homeTeamDivisionId && divIds.includes(game.homeTeamDivisionId)) || 
          (game.visitorTeamDivisionId && divIds.includes(game.visitorTeamDivisionId))) {
        names.add(divName);
      }
    });
    
    return Array.from(names);
  };

  const gamesByDivision = selectedDivision === 'All Divisions' 
    ? filteredGames.reduce((acc, game) => {
        const divNames = getDivisionNamesForGame(game);
        divNames.forEach(divName => {
          if (!acc[divName]) {
            acc[divName] = [];
          }
          acc[divName].push(game);
        });
        return acc;
      }, {} as Record<string, Game[]>)
    : null;

  const gamesByDate = selectedDivision !== 'All Divisions'
    ? filteredGames.reduce((acc, game) => {
        if (!acc[game.fullDate]) {
          acc[game.fullDate] = [];
        }
        acc[game.fullDate].push(game);
        return acc;
      }, {} as Record<string, Game[]>)
    : null;

  const dates = gamesByDate ? Object.keys(gamesByDate).sort() : [];
  
  const divisionOrderMap = new Map<number, number>();
  divisions.forEach((divName, index) => {
    if (divName !== 'All Divisions' && divisionGroups[divName]) {
      divisionGroups[divName].forEach(divId => {
        divisionOrderMap.set(divId, index);
      });
    }
  });
  
  const getDivisionIdForName = (divisionName: string): number => {
    return divisionGroups[divisionName]?.[0] || 9999;
  };
  
  const divisionNames = gamesByDivision 
    ? Object.keys(gamesByDivision).sort((a, b) => {
        const divIdA = getDivisionIdForName(a);
        const divIdB = getDivisionIdForName(b);
        
        const orderA = divisionOrderMap.get(divIdA) ?? 9999;
        const orderB = divisionOrderMap.get(divIdB) ?? 9999;
        
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.localeCompare(b);
      })
    : [];

  const generateCalendarDates = () => {
    if (viewMode === 'week') {
      const weekDates = [];
      if (!selectedWeek) return [];
      
      const match = selectedWeek.match(/Week of (\w+) (\d+) - (\w+) (\d+)/);
      if (!match) return [];
      
      const [, startMonth, startDay] = match;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = monthNames.indexOf(startMonth);
      const year = parseInt(selectedSeasonYear);
      
      const startDate = new Date(year, monthIndex, parseInt(startDay));
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        weekDates.push(date);
      }
      return weekDates;
    } else {
      if (!selectedMonth) return [];
      
      const [monthName, year] = selectedMonth.split(' ');
      const monthIndex = new Date(Date.parse(monthName + ' 1, ' + year)).getMonth();
      const yearNum = parseInt(year);
      
      const firstDay = new Date(yearNum, monthIndex, 1);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());
      
      const calendarDates = [];
      let currentDate = new Date(startDate);
      
      for (let i = 0; i < 42; i++) {
        calendarDates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return calendarDates;
    }
  };

  const getGamesForDate = (date: Date) => {
    // Use local date string to avoid UTC conversion issues
    const dateStr = date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
    return filteredGames.filter(game => {
      // Parse API date as local time and compare
      const gameDate = parseDateAsLocal(game.fullDate);
      const gameDateStr = gameDate.getFullYear() + '-' +
        String(gameDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(gameDate.getDate()).padStart(2, '0');
      return gameDateStr === dateStr;
    });
  };

  return (
    <section id="schedule" className="bg-gray-50 py-8 sm:py-12 lg:py-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-gray-900 font-bold tracking-tight mb-2">Schedule</h2>
            <div className="h-1 w-16 sm:w-20 bg-[#013fac] rounded"></div>
          </div>
          
          {/* Desktop Filters */}
          <div className="hidden sm:flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Season Year Selector */}
            <Select value={selectedSeasonYear} onValueChange={setSelectedSeasonYear}>
              <SelectTrigger className="w-full sm:w-[140px] font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableSeasonYears.map((year) => (
                  <SelectItem key={year} value={year} className="font-bold">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Game Type Selector */}
            <Select value={selectedGameType} onValueChange={setSelectedGameType}>
              <SelectTrigger className="w-full sm:w-[180px] font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {gameTypes.map((type) => (
                  <SelectItem key={type} value={type} className="font-bold">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode Tabs */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'month' | 'week' | 'season')} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-3 sm:w-[420px]">
                <TabsTrigger value="week" className="font-bold text-xs sm:text-sm">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Week View
                </TabsTrigger>
                <TabsTrigger value="month" className="font-bold text-xs sm:text-sm">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Month View
                </TabsTrigger>
                <TabsTrigger value="season" className="font-bold text-xs sm:text-sm">
                  <List className="w-4 h-4 mr-2" />
                  Season View
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Layout Mode Toggle - Desktop Only (hide in season view) */}
            {viewMode !== 'season' && (
            <div className="hidden lg:flex items-center gap-2 bg-white rounded-lg p-1 border-2 border-[#013fac]/20">
              <button
                onClick={() => setLayoutMode('grid')}
                className={`p-2 rounded transition-all ${
                  layoutMode === 'grid'
                    ? 'text-white'
                    : 'text-gray-600 hover:bg-[#013fac]/5'
                }`}
                style={layoutMode === 'grid' ? { background: 'linear-gradient(to bottom, var(--color-primary), var(--color-primary-dark))' } : {}}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayoutMode('card')}
                className={`p-2 rounded transition-all ${
                  layoutMode === 'card'
                    ? 'text-white'
                    : 'text-gray-600 hover:bg-[#013fac]/5'
                }`}
                style={layoutMode === 'card' ? { background: 'linear-gradient(to bottom, var(--color-primary), var(--color-primary-dark))' } : {}}
                aria-label="Card view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayoutMode('calendar')}
                className={`p-2 rounded transition-all ${
                  layoutMode === 'calendar'
                    ? 'text-white'
                    : 'text-gray-600 hover:bg-[#013fac]/5'
                }`}
                style={layoutMode === 'calendar' ? { background: 'linear-gradient(to bottom, var(--color-primary), var(--color-primary-dark))' } : {}}
                aria-label="Calendar view"
              >
                <CalendarDays className="w-4 h-4" />
              </button>
            </div>
            )}

            {/* Export Schedule Button */}
            <button
              onClick={() => setExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-white font-bold text-xs rounded transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(to bottom, var(--color-primary), var(--color-primary-dark))' }}
              aria-label="Export schedule"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>

          {/* Mobile Filters - Simplified */}
          <div className="flex sm:hidden flex-col gap-3 w-full">
            <div className="flex gap-2">
              {/* Season Year Selector */}
              <Select value={selectedSeasonYear} onValueChange={setSelectedSeasonYear}>
                <SelectTrigger className="flex-1 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableSeasonYears.map((year) => (
                    <SelectItem key={year} value={year} className="font-bold">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Game Type Selector */}
              <Select value={selectedGameType} onValueChange={setSelectedGameType}>
                <SelectTrigger className="flex-1 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {gameTypes.map((type) => (
                    <SelectItem key={type} value={type} className="font-bold">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* More Filters Button */}
              <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="flex-shrink-0 border-2 border-[#013fac]/20"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px] overflow-y-auto">
                  <SheetHeader className="px-6">
                    <SheetTitle>Schedule Filters</SheetTitle>
                    <SheetDescription>
                      Customize how you view the schedule
                    </SheetDescription>
                  </SheetHeader>
                  <div className="px-6 mt-6 space-y-6 pb-6">
                    {/* Week/Month Navigation */}
                    {viewMode !== 'season' && isReadyToRender && (
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-3 tracking-wide">
                          {viewMode === 'week' ? 'SELECT WEEK' : 'SELECT MONTH'}
                        </label>
                        {viewMode === 'week' ? (
                          <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                            <SelectTrigger className="w-full font-bold">
                              <SelectValue placeholder="Select week" />
                            </SelectTrigger>
                            <SelectContent>
                              {weeks.map((week) => (
                                <SelectItem key={week} value={week} className="font-bold">
                                  {week}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-full font-bold">
                              <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                            <SelectContent>
                              {months.map((month) => (
                                <SelectItem key={month} value={month} className="font-bold">
                                  {month}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}

                    {/* View Mode */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-3 tracking-wide">VIEW MODE</label>
                      <div className="grid grid-cols-1 gap-2.5">
                        <button
                          onClick={() => setViewMode('week')}
                          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-bold text-sm transition-all ${
                            viewMode === 'week'
                              ? 'bg-gradient-to-b from-[#013fac] to-[#012d7a] text-white shadow-md'
                              : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-[#013fac]'
                          }`}
                        >
                          <CalendarIcon className="w-4 h-4" />
                          Week View
                        </button>
                        <button
                          onClick={() => setViewMode('month')}
                          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-bold text-sm transition-all ${
                            viewMode === 'month'
                              ? 'bg-gradient-to-b from-[#013fac] to-[#012d7a] text-white shadow-md'
                              : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-[#013fac]'
                          }`}
                        >
                          <CalendarIcon className="w-4 h-4" />
                          Month View
                        </button>
                        <button
                          onClick={() => setViewMode('season')}
                          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-bold text-sm transition-all ${
                            viewMode === 'season'
                              ? 'bg-gradient-to-b from-[#013fac] to-[#012d7a] text-white shadow-md'
                              : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-[#013fac]'
                          }`}
                        >
                          <List className="w-4 h-4" />
                          Season View
                        </button>
                      </div>
                    </div>

                    {/* Team Filter */}
                    {availableTeams.length > 1 && (
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-3 tracking-wide">TEAM</label>
                        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                          <SelectTrigger className="w-full font-bold">
                            <SelectValue placeholder="Select Team" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTeams.map((team) => (
                              <SelectItem key={team} value={team} className="font-bold">
                                {team}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Export Button */}
                    <Button
                      onClick={() => {
                        handleExportToCalendar();
                        setFilterSheetOpen(false);
                      }}
                      className="w-full bg-gradient-to-b from-[#013fac] to-[#012d7a] hover:opacity-90 font-bold"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export to Calendar
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 sm:mb-8 space-y-4">
          {/* Division Filter */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2 tracking-wide">DIVISION</label>
            
            {/* Mobile Dropdown */}
            <div className="block md:hidden space-y-2">
              <Select value={selectedDivision} onValueChange={setSelectedDivision}>
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
              {availableSubDivisions.length > 0 && (
                <Select value={selectedSubDivision} onValueChange={setSelectedSubDivision}>
                  <SelectTrigger className="w-full font-bold">
                    <SelectValue placeholder="Select Conference" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubDivisions.map((subDiv) => (
                      <SelectItem key={subDiv} value={subDiv} className="font-bold">
                        {subDiv === 'All' ? 'All Conferences' : subDiv}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Desktop Filter Bar */}
            <div className="hidden md:block overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 pb-2 min-w-max">
                {divisions.map((division) => (
                  <button
                    key={division}
                    onClick={() => setSelectedDivision(division)}
                    className={`px-3 lg:px-4 py-2 text-xs font-bold tracking-wide whitespace-nowrap rounded transition-all duration-200 ${
                      selectedDivision === division
                        ? 'text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-[#013fac]/5 border-2 border-[#013fac]/20 hover:border-[#013fac]'
                    }`}
                    style={selectedDivision === division ? { background: 'linear-gradient(to bottom, var(--color-primary), var(--color-primary-dark))' } : {}}
                  >
                    {division}
                  </button>
                ))}
              </div>
              
              {/* Sub-Division Filter - Desktop */}
              {availableSubDivisions.length > 0 && (
                <div className="flex gap-2 pb-2 mt-2 min-w-max">
                  {availableSubDivisions.map((subDiv) => (
                    <button
                      key={subDiv}
                      onClick={() => setSelectedSubDivision(subDiv)}
                      className={`px-3 lg:px-4 py-2 text-xs font-bold tracking-wide whitespace-nowrap rounded transition-all duration-200 ${
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
          </div>

          {/* Week/Month Navigation and Team Filter - Desktop Only - Hide in Season View */}
          {viewMode !== 'season' && isReadyToRender && (
          <div className="hidden sm:block">
            <label className="block text-xs font-bold text-gray-600 mb-2 tracking-wide">
              {viewMode === 'week' ? 'WEEK' : 'MONTH'}
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={viewMode === 'week' ? handlePreviousWeek : handlePreviousMonth}
                  className="p-2 rounded-lg transition-all border-2 border-[#013fac]/20 hover:border-[#013fac] bg-white hover:bg-[#013fac]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={viewMode === 'week' ? 'Previous week' : 'Previous month'}
                  disabled={viewMode === 'week' ? weeks.indexOf(selectedWeek) === 0 : months.indexOf(selectedMonth) === 0}
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
              
              {viewMode === 'week' ? (
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger className="flex-1 font-bold max-w-xs">
                    <SelectValue placeholder="Select week" />
                  </SelectTrigger>
                  <SelectContent>
                    {weeks.map((week) => (
                      <SelectItem key={week} value={week} className="font-bold">
                        {week}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="flex-1 font-bold max-w-xs">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month} value={month} className="font-bold">
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <button
                onClick={viewMode === 'week' ? handleNextWeek : handleNextMonth}
                className="p-2 rounded-lg transition-all border-2 border-[#013fac]/20 hover:border-[#013fac] bg-white hover:bg-[#013fac]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={viewMode === 'week' ? 'Next week' : 'Next month'}
                disabled={viewMode === 'week' ? weeks.indexOf(selectedWeek) === weeks.length - 1 : months.indexOf(selectedMonth) === months.length - 1}
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
              </div>

              {/* Team Filter - Inline on the right */}
              {availableTeams.length > 1 && (
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="w-full sm:w-[250px] font-bold">
                    <SelectValue placeholder="Select Team" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeams.map((team) => (
                      <SelectItem key={team} value={team} className="font-bold">
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          )}

          {/* Team Filter for Season View - Show on right side - Desktop Only */}
          {viewMode === 'season' && availableTeams.length > 1 && (
          <div className="hidden sm:flex justify-end">
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-full sm:w-[300px] font-bold">
                <SelectValue placeholder="Select Team" />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.map((team) => (
                  <SelectItem key={team} value={team} className="font-bold">
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          )}
        </div>

        {/* Loading State */}
        {!isReadyToRender && !error && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#013fac]"></div>
            <p className="mt-4 text-gray-600 font-bold">Loading schedule data...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg shadow-md p-6">
            <p className="text-red-700 font-bold">Error loading games: {error}</p>
            <p className="text-red-600 text-sm mt-2">Please check your session ID and internet connection.</p>
          </div>
        )}

        {/* Games Display */}
        {isReadyToRender && (
        <div className="space-y-6">
          {viewMode === 'season' ? (
            // Season View - Table Format
            <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-white" style={{ background: 'linear-gradient(to bottom, var(--color-primary), var(--color-primary-dark))' }}>
                      <th 
                        className="px-3 py-3 text-left font-bold text-xs tracking-wide cursor-pointer hover:bg-white/10 transition-colors select-none"
                        onClick={() => handleSort('gameNumber')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Game #</span>
                          {sortColumn === 'gameNumber' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-3 py-3 text-left font-bold text-xs tracking-wide cursor-pointer hover:bg-white/10 transition-colors select-none"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Date</span>
                          {sortColumn === 'date' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-3 py-3 text-left font-bold text-xs tracking-wide cursor-pointer hover:bg-white/10 transition-colors select-none"
                        onClick={() => handleSort('time')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Time</span>
                          {sortColumn === 'time' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-3 py-3 text-left font-bold text-xs tracking-wide cursor-pointer hover:bg-white/10 transition-colors select-none"
                        onClick={() => handleSort('venue')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Location</span>
                          {sortColumn === 'venue' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-3 py-3 text-left font-bold text-xs tracking-wide cursor-pointer hover:bg-white/10 transition-colors select-none"
                        onClick={() => handleSort('homeTeam')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Home</span>
                          {sortColumn === 'homeTeam' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-3 py-3 text-left font-bold text-xs tracking-wide cursor-pointer hover:bg-white/10 transition-colors select-none"
                        onClick={() => handleSort('awayTeam')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Visitor</span>
                          {sortColumn === 'awayTeam' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-3 py-3 text-left font-bold text-xs tracking-wide cursor-pointer hover:bg-white/10 transition-colors select-none"
                        onClick={() => handleSort('score')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Score</span>
                          {sortColumn === 'score' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-3 py-3 text-left font-bold text-xs tracking-wide cursor-pointer hover:bg-white/10 transition-colors select-none"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Status</span>
                          {sortColumn === 'status' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center font-bold text-xs tracking-wide">Gamesheet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGames.map((game, index) => {
                      const awayWon = isGameComplete(game.status) && game.awayScore > game.homeScore;
                      const homeWon = isGameComplete(game.status) && game.homeScore > game.awayScore;
                      const showGameComment = !!(game.gameComments && game.gameComments.trim());
                      const showSchedulingComment = !!(isViewingCurrentSeason && game.schedulingComments && game.schedulingComments.trim());
                      const showComment = showGameComment || showSchedulingComment;
                      const isCrossover = !!(game.homeTeamDivisionId && game.visitorTeamDivisionId && game.homeTeamDivisionId !== game.visitorTeamDivisionId);
                      
                      return (
                        <Fragment key={game.id}>
                        <tr 
                          className={`${showComment ? '' : 'border-b border-gray-200'} transition-all ${
                            index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                          } hover:bg-gray-100`}
                        >
                          <td className="px-3 py-3 text-xs font-semibold text-gray-700">{game.gameNumber || '-'}</td>
                          <td className="px-3 py-3 text-xs font-semibold text-gray-700">{game.date}</td>
                          <td className="px-3 py-3 text-xs font-semibold text-gray-700">{game.time}</td>
                          <td className="px-3 py-3 align-bottom">
                            <FacilityMapLink venueName={game.venue} className="text-xs" />
                          </td>
                          <td 
                            className={`px-3 py-3 text-xs font-bold ${
                              homeWon ? 'text-red-800' : 'text-gray-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {game.homeTeam}
                              {homeWon && <span className="text-[#4b5baa] font-bold">W</span>}
                            </div>
                          </td>
                          <td 
                            className={`px-3 py-3 text-xs font-bold ${
                              awayWon ? 'text-red-800' : 'text-gray-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {game.awayTeam}
                              {awayWon && <span className="text-[#4b5baa] font-bold">W</span>}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs font-semibold text-gray-700">
                            {hasScores(game.status) ? `${game.homeScore ?? 0} - ${game.awayScore ?? 0}` : '-'}
                          </td>
                          <td className="px-3 py-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${getStatusBadgeStyle(game.status)}`}>
                              {getStatusLabel(game.status)}
                            </span>
                            {isCrossover && (
                              <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                                Crossover
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button 
                              onClick={() => setSelectedGame(game)}
                              className="px-3 py-1 text-xs font-bold text-white bg-[#4b5baa] hover:bg-[#3d4a8a] rounded transition-colors"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                        {showComment && (
                          <tr className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                            <td colSpan={9} className="px-3 pb-2 pt-0">
                              <div className="flex items-center gap-1.5 ml-1">
                                {showSchedulingComment && (
                                  <div className="flex items-center gap-1.5">
                                    <MessageSquare className="w-3 h-3 text-amber-600 flex-shrink-0" />
                                    <span className="text-xs font-semibold text-amber-700 italic">{game.schedulingComments}</span>
                                  </div>
                                )}
                                {showGameComment && (
                                  <div className="flex items-center gap-1.5">
                                    <MessageSquare className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                    <span className="text-xs font-semibold text-blue-600 italic">{game.gameComments}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            </>
          ) : effectiveLayoutMode === 'calendar' ? (
            // Calendar View
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {viewMode === 'week' ? (
                // Week Calendar - 7 day grid
                <div className="grid grid-cols-7 gap-px bg-gray-200">
                  {/* Day Headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="bg-[#001741] text-white p-2 text-center font-bold text-xs sm:text-sm">
                      {day}
                    </div>
                  ))}
                  
                  {/* Date Cells */}
                  {generateCalendarDates().map((date, index) => {
                    const dayGames = getGamesForDate(date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    return (
                      <div
                        key={index}
                        className={`bg-white min-h-[120px] sm:min-h-[150px] p-1 sm:p-2 ${
                          isToday ? 'bg-[#f0f1f9] ring-2 ring-[#5a6bba]' : ''
                        }`}
                      >
                        <div className={`font-bold text-xs sm:text-sm mb-1 ${
                          isToday ? 'text-[#4d5cac]' : 'text-gray-700'
                        }`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-0.5 overflow-y-auto max-h-[100px] sm:max-h-[120px]">
                          {dayGames.map((game) => (
                            <div
                              key={game.id}
                              onClick={() => setSelectedGame(game)}
                              className="p-1 sm:p-1.5 rounded bg-white hover:bg-gray-50 cursor-pointer border border-gray-300 hover:border-[#5a6bba] transition-all hover:shadow-md"
                            >
                              {/* Logos at top spanning width */}
                              <div className="flex items-center justify-center gap-1 pb-1 border-b border-gray-200">
                                <img src={game.awayLogo} alt="" className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                                <span className="text-[9px] sm:text-[10px] font-bold text-gray-400">@</span>
                                <img src={game.homeLogo} alt="" className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                              </div>
                              {/* Time and Score at bottom */}
                              <div className="flex items-center justify-between pt-0.5">
                                <div className="text-[8px] sm:text-[9px] font-bold text-gray-600">
                                  {game.time.replace(' PM', 'p').replace(' AM', 'a')}
                                </div>
                                {(hasScores(game.status)) ? (
                                  <div className="text-[8px] sm:text-[9px] font-bold" style={{
                                    color: game.status === 'FINAL' ? '#16a34a' : '#dc2626'
                                  }}>
                                    {game.awayScore}-{game.homeScore}
                                  </div>
                                ) : game.status === 'EXHIBITION' ? (
                                  <div className="text-[7px] sm:text-[8px] font-bold text-amber-600">
                                    EXH
                                  </div>
                                ) : (
                                  <div className="text-[8px] sm:text-[9px] font-bold text-gray-400">
                                    -
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Month Calendar - Full month grid
                <div>
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-px bg-gray-200">
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                      <div key={day} className="bg-[#001741] text-white p-2 sm:p-3 text-center font-bold text-xs sm:text-sm">
                        <span className="hidden sm:inline">{day}</span>
                        <span className="sm:hidden">{day.substring(0, 3)}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Date Cells */}
                  <div className="grid grid-cols-7 gap-px bg-gray-200">
                    {generateCalendarDates().map((date, index) => {
                      const dayGames = getGamesForDate(date);
                      const isToday = date.toDateString() === new Date().toDateString();
                      const [monthName] = selectedMonth.split(' ');
                      const currentMonth = new Date(Date.parse(monthName + ' 1, 2025')).getMonth();
                      const isCurrentMonth = date.getMonth() === currentMonth;
                      
                      return (
                        <div
                          key={index}
                          className={`bg-white min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 ${
                            !isCurrentMonth ? 'bg-gray-100 text-gray-400' : ''
                          } ${isToday ? 'bg-[#f0f1f9] ring-2 ring-inset ring-[#5a6bba]' : ''}`}
                        >
                          <div className={`font-bold text-xs sm:text-sm mb-1 ${
                            isToday ? 'text-[#4d5cac]' : isCurrentMonth ? 'text-gray-700' : 'text-gray-400'
                          }`}>
                            {date.getDate()}
                          </div>
                          <div className="space-y-0.5 overflow-y-auto max-h-[60px] sm:max-h-[100px]">
                            {dayGames.map((game) => (
                              <div
                                key={game.id}
                                onClick={() => setSelectedGame(game)}
                                className="p-0.5 sm:p-1 rounded bg-white hover:bg-gray-50 cursor-pointer border border-gray-300 hover:border-[#5a6bba] transition-all hover:shadow-md"
                              >
                                {/* Logos at top spanning width */}
                                <div className="flex items-center justify-center gap-0.5 pb-0.5 border-b border-gray-200">
                                  <img src={game.awayLogo} alt="" className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                                  <span className="text-[8px] sm:text-[9px] font-bold text-gray-400">@</span>
                                  <img src={game.homeLogo} alt="" className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                                </div>
                                {/* Time and Score at bottom */}
                                <div className="flex items-center justify-between pt-0.5">
                                  <div className="text-[7px] sm:text-[8px] font-bold text-gray-600">
                                    {game.time.replace(' PM', 'p').replace(' AM', 'a')}
                                  </div>
                                  {(hasScores(game.status)) ? (
                                    <div className="text-[7px] sm:text-[8px] font-bold" style={{
                                      color: game.status === 'FINAL' ? '#16a34a' : '#dc2626'
                                    }}>
                                      {game.awayScore}-{game.homeScore}
                                    </div>
                                  ) : game.status === 'EXHIBITION' ? (
                                    <div className="text-[6px] sm:text-[7px] font-bold text-amber-600">
                                      EXH
                                    </div>
                                  ) : (
                                    <div className="text-[7px] sm:text-[8px] font-bold text-gray-400">
                                      -
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : selectedDivision === 'All Divisions' ? (
            // Group by Division
            divisionNames.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center shadow">
                <p className="text-gray-500 font-bold">No games scheduled</p>
              </div>
            ) : (
              divisionNames.map((division) => {
                const divisionGamesByDate = gamesByDivision![division].reduce((acc, game) => {
                  if (!acc[game.fullDate]) {
                    acc[game.fullDate] = [];
                  }
                  acc[game.fullDate].push(game);
                  return acc;
                }, {} as Record<string, Game[]>);
                
                const divisionDates = Object.keys(divisionGamesByDate).sort();
                const divId = getDivisionIdForName(division);
                const scheduleFinal = isScheduleFinal(divId);
                const divIsInProgress = inProgressDivisionIds.has(divId);

                return (
                  <div key={division} className="space-y-4">
                    {/* Division Header with Schedule Status */}
                    <div className="rounded-lg px-6 py-4 shadow-lg" style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-primary-dark))' }}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="text-white font-bold text-lg sm:text-xl tracking-wide">{division}</h3>
                        {isViewingCurrentSeason && divisionStatusMap.has(divId) && !scheduleFinal && divIsInProgress && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-100 border border-yellow-400/30">
                            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                            Schedule In Progress
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Games within this division, grouped by date */}
                    <div className="space-y-4 pl-0 sm:pl-4">
                      {divisionDates.map((date) => (
                        <div key={date} className="bg-white rounded-lg shadow overflow-hidden">
                          {/* Date Header */}
                          <div className="bg-gradient-to-b from-gray-700 to-gray-800 px-4 sm:px-6 py-2 sm:py-3">
                            <h4 className="font-bold text-white tracking-wide text-xs sm:text-sm">{formatGameDateLong(date)}</h4>
                          </div>

                          {/* Games List - Using same grid/card logic */}
                          {effectiveLayoutMode === 'grid' && (
                            <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
                              {divisionGamesByDate[date].map((game) => {
                                const awayWon = isGameComplete(game.status) && game.awayScore > game.homeScore;
                                const homeWon = isGameComplete(game.status) && game.homeScore > game.awayScore;
                                
                                return (
                                  <div 
                                    key={game.id} 
                                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-all cursor-pointer border-2 border-transparent hover:border-red-600 hover:shadow-lg"
                                    onClick={() => setSelectedGame(game)}
                                  >
                                      {/* Time and Status */}
                                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                                      <div className="flex items-center gap-2">
                                        {game.gameNumber && (
                                          <span className="font-bold text-xs text-gray-500 border-r border-gray-300 pr-2">
                                            #{game.gameNumber}
                                          </span>
                                        )}
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        <span className="font-bold text-xs text-gray-700">{game.time}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                                            game.status === 'LIVE'
                                              ? 'bg-red-600 text-white animate-pulse'
                                              : getStatusBadgeStyle(game.status)
                                          }`}
                                        >
                                          {getStatusLabel(game.status)}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Teams */}
                                    <div className="space-y-2 mb-3">
                                      {/* Away Team */}
                                      <div className={`flex items-center justify-between gap-2 p-2 rounded transition-all ${
                                        awayWon ? 'bg-green-50 border-2 border-green-500 shadow-sm' : ''
                                      }`}>
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <img src={game.awayLogo} alt={game.awayTeam} className="w-8 h-8 flex-shrink-0 object-contain" />
                                          <div className="flex flex-col min-w-0">
                                            <span className={`tracking-wide font-bold text-sm truncate ${
                                              awayWon ? 'text-green-900' : 'text-gray-900'
                                            }`}>{game.awayTeam}</span>
                                            {game.awayRecord && <span className="text-xs text-gray-500 font-semibold">({game.awayRecord})</span>}
                                          </div>
                                        </div>
                                        {(hasScores(game.status)) && (
                                          <span className={`text-2xl font-bold min-w-[28px] text-right ${
                                            awayWon ? 'text-green-700' : 'text-gray-400'
                                          }`}>
                                            {game.awayScore}
                                          </span>
                                        )}
                                      </div>

                                      {/* Home Team */}
                                      <div className={`flex items-center justify-between gap-2 p-2 rounded transition-all ${
                                        homeWon ? 'bg-green-50 border-2 border-green-500 shadow-sm' : ''
                                      }`}>
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <img src={game.homeLogo} alt={game.homeTeam} className="w-8 h-8 flex-shrink-0 object-contain" />
                                          <div className="flex flex-col min-w-0">
                                            <span className={`tracking-wide font-bold text-sm truncate ${
                                              homeWon ? 'text-green-900' : 'text-gray-900'
                                            }`}>{game.homeTeam}</span>
                                            {game.homeRecord && <span className="text-xs text-gray-500 font-semibold">({game.homeRecord})</span>}
                                          </div>
                                        </div>
                                        {(hasScores(game.status)) && (
                                          <span className={`text-2xl font-bold min-w-[28px] text-right ${
                                            homeWon ? 'text-green-700' : 'text-gray-400'
                                          }`}>
                                            {game.homeScore}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Location */}
                                    <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
                                      <FacilityMapLink venueName={game.venue} className="font-bold text-xs" />
                                      {isViewingCurrentSeason && game.schedulingComments && game.schedulingComments.trim() && (
                                        <div className="flex items-center gap-1.5">
                                          <MessageSquare className="w-3 h-3 text-amber-600 flex-shrink-0" />
                                          <span className="text-xs font-semibold text-amber-700 italic">{game.schedulingComments}</span>
                                        </div>
                                      )}
                                      {game.gameComments && game.gameComments.trim() && (
                                        <div className="flex items-center gap-1.5">
                                          <MessageSquare className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                          <span className="text-xs font-semibold text-blue-600 italic">{game.gameComments}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Card View */}
                          <div className={effectiveLayoutMode === 'grid' ? 'lg:hidden divide-y divide-gray-200' : 'divide-y divide-gray-200'}>
                            {divisionGamesByDate[date].map((game) => {
                              const awayWon = isGameComplete(game.status) && game.awayScore > game.homeScore;
                              const homeWon = isGameComplete(game.status) && game.homeScore > game.awayScore;
                              
                              return (
                                <div 
                                  key={game.id} 
                                  className="p-4 sm:p-6 hover:bg-gray-50 transition-colors cursor-pointer group"
                                  onClick={() => setSelectedGame(game)}
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                             {/* Game #, Time and Status */}
                          <div className="flex flex-wrap items-center justify-between sm:flex-col sm:items-start gap-2 sm:gap-3 sm:w-40 flex-shrink-0">
                            <div className="flex items-center gap-2">
                              {game.gameNumber && (
                                <span className="font-bold text-sm text-gray-500 border-r border-gray-300 pr-2">
                                  #{game.gameNumber}
                                </span>
                              )}
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="font-bold text-sm text-gray-700">{game.time}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded inline-block w-fit ${
                                  game.status === 'LIVE'
                                    ? 'bg-red-600 text-white animate-pulse'
                                    : getStatusBadgeStyle(game.status)
                                }`}
                              >
                                {getStatusLabel(game.status)}
                              </span>
                              {game.homeTeamDivisionId && game.visitorTeamDivisionId && game.homeTeamDivisionId !== game.visitorTeamDivisionId && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                                  Crossover
                                </span>
                              )}
                            </div>
                          </div>

                                    {/* Teams */}
                                    <div className="flex-1 grid grid-cols-1 gap-2">
                                      {/* Away Team */}
                                      <div className={`flex items-center justify-between gap-3 p-2 -mx-2 rounded transition-all ${
                                        awayWon ? 'bg-green-50 border-l-4 border-green-500 pl-3' : ''
                                      }`}>
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          <img src={game.awayLogo} alt={game.awayTeam} className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 object-contain" />
                                          <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span className={`tracking-wide font-bold text-sm sm:text-base truncate ${
                                                awayWon ? 'text-green-900' : 'text-gray-900'
                                              }`}>{game.awayTeam}</span>
                                              {awayWon && (
                                                <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">WIN</span>
                                              )}
                                            </div>
                                            {game.awayRecord && <span className="text-xs text-gray-500 font-semibold">({game.awayRecord})</span>}
                                          </div>
                                        </div>
                                        {(hasScores(game.status)) && (
                                          <span className={`text-2xl sm:text-3xl font-bold min-w-[32px] text-right ${
                                            awayWon ? 'text-green-700' : 'text-gray-400'
                                          }`}>
                                            {game.awayScore}
                                          </span>
                                        )}
                                      </div>

                                      {/* Home Team */}
                                      <div className={`flex items-center justify-between gap-3 p-2 -mx-2 rounded transition-all ${
                                        homeWon ? 'bg-green-50 border-l-4 border-green-500 pl-3' : ''
                                      }`}>
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          <img src={game.homeLogo} alt={game.homeTeam} className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 object-contain" />
                                          <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span className={`tracking-wide font-bold text-sm sm:text-base truncate ${
                                                homeWon ? 'text-green-900' : 'text-gray-900'
                                              }`}>{game.homeTeam}</span>
                                              {homeWon && (
                                                <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">WIN</span>
                                              )}
                                            </div>
                                            {game.homeRecord && <span className="text-xs text-gray-500 font-semibold">({game.homeRecord})</span>}
                                          </div>
                                        </div>
                                        {(hasScores(game.status)) && (
                                          <span className={`text-2xl sm:text-3xl font-bold min-w-[32px] text-right ${
                                            homeWon ? 'text-green-700' : 'text-gray-400'
                                          }`}>
                                            {game.homeScore}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Location */}
                                    <div className="flex flex-col gap-1 sm:w-56 flex-shrink-0 sm:text-right">
                                      <div className="flex items-center gap-2 sm:justify-end">
                                        <FacilityMapLink venueName={game.venue} className="font-bold text-sm" showText={game.venue} />
                                      </div>
                                    </div>
                                  </div>
                                  {(isViewingCurrentSeason && game.schedulingComments && game.schedulingComments.trim()) || (game.gameComments && game.gameComments.trim()) ? (
                                    <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-gray-100">
                                      {isViewingCurrentSeason && game.schedulingComments && game.schedulingComments.trim() && (
                                        <div className="flex items-center gap-1.5">
                                          <MessageSquare className="w-3 h-3 text-amber-600 flex-shrink-0" />
                                          <span className="text-xs font-semibold text-amber-700 italic">{game.schedulingComments}</span>
                                        </div>
                                      )}
                                      {game.gameComments && game.gameComments.trim() && (
                                        <div className="flex items-center gap-1.5">
                                          <MessageSquare className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                          <span className="text-xs font-semibold text-blue-600 italic">{game.gameComments}</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )
          ) : (
            // Group by Date (Single Division View)
            dates.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center shadow">
                <p className="text-gray-500 font-bold">No games scheduled for this division</p>
              </div>
            ) : (
              <>
              {dates.map((date) => (
              <div key={date} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Date Header */}
                <div className="px-4 sm:px-6 py-3 sm:py-4" style={{ background: 'linear-gradient(to bottom, var(--color-primary), var(--color-primary-dark))' }}>
                  <h3 className="font-bold text-white tracking-wide text-sm sm:text-base">{formatGameDateLong(date)}</h3>
                </div>

                {/* Grid View - Desktop */}
                {effectiveLayoutMode === 'grid' && (
                  <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
                    {gamesByDate![date].map((game) => {
                      const awayWon = isGameComplete(game.status) && game.awayScore > game.homeScore;
                      const homeWon = isGameComplete(game.status) && game.homeScore > game.awayScore;
                      
                      return (
                        <div 
                          key={game.id} 
                          className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-all cursor-pointer border-2 border-transparent hover:border-red-600 hover:shadow-lg"
                          onClick={() => setSelectedGame(game)}
                        >
                          {/* Time and Status */}
                          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="font-bold text-xs text-gray-700">{game.time}</span>
                            </div>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded ${
                                game.status === 'LIVE'
                                  ? 'bg-red-600 text-white animate-pulse'
                                  : getStatusBadgeStyle(game.status)
                              }`}
                            >
                              {getStatusLabel(game.status)}
                            </span>
                          </div>

                          {/* Teams */}
                          <div className="space-y-2 mb-3">
                            {/* Away Team */}
                            <div className={`flex items-center justify-between gap-2 p-2 rounded transition-all ${
                              awayWon ? 'bg-green-50 border-2 border-green-500 shadow-sm' : ''
                            }`}>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <img src={game.awayLogo} alt={game.awayTeam} className="w-8 h-8 flex-shrink-0 object-contain" />
                                <div className="flex flex-col min-w-0">
                                  <span className={`tracking-wide font-bold text-sm truncate ${
                                    awayWon ? 'text-green-900' : 'text-gray-900'
                                  }`}>{game.awayTeam}</span>
                                  {game.awayRecord && <span className="text-xs text-gray-500 font-semibold">({game.awayRecord})</span>}
                                </div>
                              </div>
                              {(hasScores(game.status)) && (
                                <span className={`text-2xl font-bold min-w-[28px] text-right ${
                                  awayWon ? 'text-green-700' : 'text-gray-400'
                                }`}>
                                  {game.awayScore}
                                </span>
                              )}
                            </div>

                            {/* Home Team */}
                            <div className={`flex items-center justify-between gap-2 p-2 rounded transition-all ${
                              homeWon ? 'bg-green-50 border-2 border-green-500 shadow-sm' : ''
                            }`}>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <img src={game.homeLogo} alt={game.homeTeam} className="w-8 h-8 flex-shrink-0 object-contain" />
                                <div className="flex flex-col min-w-0">
                                  <span className={`tracking-wide font-bold text-sm truncate ${
                                    homeWon ? 'text-green-900' : 'text-gray-900'
                                  }`}>{game.homeTeam}</span>
                                  {game.homeRecord && <span className="text-xs text-gray-500 font-semibold">({game.homeRecord})</span>}
                                </div>
                              </div>
                              {(hasScores(game.status)) && (
                                <span className={`text-2xl font-bold min-w-[28px] text-right ${
                                  homeWon ? 'text-green-700' : 'text-gray-400'
                                }`}>
                                  {game.homeScore}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Location and Division */}
                          <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
                            <FacilityMapLink venueName={game.venue} className="font-bold text-xs" />
                            {isViewingCurrentSeason && game.schedulingComments && game.schedulingComments.trim() && (
                              <div className="flex items-center gap-1.5">
                                <MessageSquare className="w-3 h-3 text-amber-600 flex-shrink-0" />
                                <span className="text-xs font-semibold text-amber-700 italic">{game.schedulingComments}</span>
                              </div>
                            )}
                            {game.gameComments && game.gameComments.trim() && (
                              <div className="flex items-center gap-1.5">
                                <MessageSquare className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                <span className="text-xs font-semibold text-blue-600 italic">{game.gameComments}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded inline-block w-fit">
                                {game.division}
                              </span>
                              {game.homeTeamDivisionId && game.visitorTeamDivisionId && game.homeTeamDivisionId !== game.visitorTeamDivisionId && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                                  Crossover
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Card View - Mobile & Desktop */}
                <div className={effectiveLayoutMode === 'grid' ? 'lg:hidden divide-y divide-gray-200' : 'divide-y divide-gray-200'}>
                  {gamesByDate![date].map((game) => {
                    const awayWon = isGameComplete(game.status) && game.awayScore > game.homeScore;
                    const homeWon = isGameComplete(game.status) && game.homeScore > game.awayScore;
                    
                    return (
                      <div 
                        key={game.id} 
                        className="p-4 sm:p-6 hover:bg-gray-50 transition-colors cursor-pointer group"
                        onClick={() => setSelectedGame(game)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          {/* Game #, Time and Status */}
                          <div className="flex items-center justify-between sm:flex-col sm:items-start gap-3 sm:w-40 flex-shrink-0">
                            {game.gameNumber && (
                              <span className="text-[10px] font-bold text-gray-400 tracking-wide">#{game.gameNumber}</span>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="font-bold text-sm text-gray-700">{game.time}</span>
                            </div>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded inline-block w-fit ${
                                game.status === 'LIVE'
                                  ? 'bg-red-600 text-white animate-pulse'
                                  : getStatusBadgeStyle(game.status)
                              }`}
                            >
                              {getStatusLabel(game.status)}
                            </span>
                          </div>

                          {/* Teams */}
                          <div className="flex-1 grid grid-cols-1 gap-2">
                            {/* Away Team */}
                            <div className={`flex items-center justify-between gap-3 p-2 -mx-2 rounded transition-all ${
                              awayWon ? 'bg-green-50 border-l-4 border-green-500 pl-3' : ''
                            }`}>
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <img src={game.awayLogo} alt={game.awayTeam} className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 object-contain" />
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`tracking-wide font-bold text-sm sm:text-base truncate ${
                                      awayWon ? 'text-green-900' : 'text-gray-900'
                                    }`}>{game.awayTeam}</span>
                                    {awayWon && (
                                      <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">WIN</span>
                                    )}
                                  </div>
                                  {game.awayRecord && <span className="text-xs text-gray-500 font-semibold">({game.awayRecord})</span>}
                                </div>
                              </div>
                              {(hasScores(game.status)) && (
                                <span className={`text-2xl sm:text-3xl font-bold min-w-[32px] text-right ${
                                  awayWon ? 'text-green-700' : 'text-gray-400'
                                }`}>
                                  {game.awayScore}
                                </span>
                              )}
                            </div>

                            {/* Home Team */}
                            <div className={`flex items-center justify-between gap-3 p-2 -mx-2 rounded transition-all ${
                              homeWon ? 'bg-green-50 border-l-4 border-green-500 pl-3' : ''
                            }`}>
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <img src={game.homeLogo} alt={game.homeTeam} className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 object-contain" />
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`tracking-wide font-bold text-sm sm:text-base truncate ${
                                      homeWon ? 'text-green-900' : 'text-gray-900'
                                    }`}>{game.homeTeam}</span>
                                    {homeWon && (
                                      <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">WIN</span>
                                    )}
                                  </div>
                                  {game.homeRecord && <span className="text-xs text-gray-500 font-semibold">({game.homeRecord})</span>}
                                </div>
                              </div>
                              {(hasScores(game.status)) && (
                                <span className={`text-2xl sm:text-3xl font-bold min-w-[32px] text-right ${
                                  homeWon ? 'text-green-700' : 'text-gray-400'
                                }`}>
                                  {game.homeScore}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Location and Division */}
                          <div className="flex flex-col gap-1 sm:w-56 flex-shrink-0 sm:text-right">
                            <div className="flex items-center gap-2 sm:justify-end">
                              <FacilityMapLink venueName={game.venue} className="font-bold text-sm" showText={game.venue} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded inline-block w-fit">
                                {game.division}
                              </span>
                              {game.homeTeamDivisionId && game.visitorTeamDivisionId && game.homeTeamDivisionId !== game.visitorTeamDivisionId && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                                  Crossover
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {((isViewingCurrentSeason && game.schedulingComments && game.schedulingComments.trim()) || (game.gameComments && game.gameComments.trim())) && (
                          <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-gray-100">
                            {isViewingCurrentSeason && game.schedulingComments && game.schedulingComments.trim() && (
                              <div className="flex items-center gap-1.5">
                                <MessageSquare className="w-3 h-3 text-amber-600 flex-shrink-0" />
                                <span className="text-xs font-semibold text-amber-700 italic">{game.schedulingComments}</span>
                              </div>
                            )}
                            {game.gameComments && game.gameComments.trim() && (
                              <div className="flex items-center gap-1.5">
                                <MessageSquare className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                <span className="text-xs font-semibold text-blue-600 italic">{game.gameComments}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            </>
            )
          )}
        </div>
        )}

        {/* Export Options Modal */}
        <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#001741]">Export Schedule</DialogTitle>
              <DialogDescription>
                Choose how you'd like to export the schedule
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {/* Sync to Calendar */}
              <button
                onClick={handleExportToCalendar}
                className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-[#4b5baa] hover:bg-[#f0f1f9] transition-all group"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#4b5baa] flex items-center justify-center group-hover:bg-[#3d4a8a] transition-colors">
                  <CalendarIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-gray-900">Sync to Calendar</div>
                  <div className="text-xs text-gray-600">Download .ics file to add to your calendar app</div>
                </div>
              </button>

              {/* Download CSV */}
              <button
                onClick={handleExportToCSV}
                className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-[#4b5baa] hover:bg-[#f0f1f9] transition-all group"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#4b5baa] flex items-center justify-center group-hover:bg-[#3d4a8a] transition-colors">
                  <FileSpreadsheet className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-gray-900">Download CSV</div>
                  <div className="text-xs text-gray-600">Export schedule data as spreadsheet</div>
                </div>
              </button>

              {/* Download PDF */}
              <button
                onClick={handleExportToPDF}
                className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-[#4b5baa] hover:bg-[#f0f1f9] transition-all group"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#4b5baa] flex items-center justify-center group-hover:bg-[#3d4a8a] transition-colors">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-gray-900">Download PDF</div>
                  <div className="text-xs text-gray-600">Print-friendly schedule document</div>
                </div>
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Game Sheet Modal */}
        {selectedGame && (
          <GameSheetModal 
            game={selectedGame} 
            open={!!selectedGame} 
            onClose={() => setSelectedGame(null)} 
          />
        )}
      </div>
    </section>
  );
}