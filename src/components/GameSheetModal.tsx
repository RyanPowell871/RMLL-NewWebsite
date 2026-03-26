import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useState, useMemo, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Users, Download, FileText, Loader2, Video } from 'lucide-react';
import { FacilityMapLink } from './FacilityMapLink';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { exportGameToCalendar, type GameForCalendar } from '../utils/calendar';
import { exportGameSheetPDF, type GameSheetPDFData } from '../utils/gameSheetPdf';
import rmllShieldLogo from 'figma:asset/fdfcb8e6c2b97967b54febaebf3bb794e8d4e2db.png';
import { useGameDetails } from '../hooks/useGameDetails';
import { fetchTeamRoster, getPlayerPhotoUrl, parseDateAsLocal, type ScoringStats, type GoalieStats, type PenaltyStats, type RosterPlayer as APIRosterPlayer } from '../services/sportzsoft';

// Parse a datetime string's TIME portion as local (avoids UTC timezone shift).
// SportzSoft returns e.g. "2025-06-15T19:00:00" or "2025-06-15T19:00:00.000Z"
// new Date() treats the Z suffix as UTC, shifting the displayed time by the user's offset.
function parseTimeAsLocal(dateTimeStr: string): string {
  if (!dateTimeStr) return '';
  const timePart = dateTimeStr.includes('T') ? dateTimeStr.split('T')[1]?.replace('Z', '').split('.')[0] : '';
  if (!timePart) return '';
  const [h, m] = timePart.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return '';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Parse a game clock time string (like "15:52" or "4:58") into total seconds.
 * Used for sorting goals/penalties in descending order (countdown clock — higher time = earlier in period).
 */
function parseClockTimeToSeconds(timeStr: string): number {
  if (!timeStr) return -1;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 1 && !isNaN(parts[0])) {
    return parts[0] * 60;
  }
  return -1;
}

interface Game {
  id: string;
  gameNumber?: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamId?: number;
  visitorTeamId?: number;
  homeScore: number;
  awayScore: number;
  homeRecord: string;
  awayRecord: string;
  date: string;
  fullDate?: string;
  time: string;
  status: 'FINAL' | 'LIVE' | 'UPCOMING' | 'EXHIBITION';
  homeLogo: string;
  awayLogo: string;
  division: string;
  location: string;
  venue?: string;
  gamestreamurl?: string;
}

interface PeriodScore {
  period: string;
  homeScore: number;
  awayScore: number;
}

interface RosterPlayer {
  number: string;
  name: string;
  flag: string;  // G=Goalie, C=Captain, A=Alternate, AP=Affiliate, IN=InHome
  goals: { period: number; time: string }[];
  assists: number;
  points: number;
  penaltyMinutes?: number;
  isInHome?: boolean;           // Designated "In Home" for bench penalties (marked with "H")
  servingSuspension?: boolean;   // Player is serving a suspension
  suspensionNote?: string;       // Details about the suspension being served
}

interface Penalty {
  period: number;
  playerNumber: string;
  playerName: string;
  offence: string;
  minutes: number;
  startTime: string;
  finishTime: string;
}

interface CoachingStaff {
  headCoach: string;
  assistantCoaches: string[];
  trainer: string;
  manager: string;
  allStaff: { role: string; name: string }[];
}

interface TeamStats {
  shots: number;
  saves: number;
  savePercentage: number;
  powerPlays: string;
  penalties: number;
  penaltyMinutes: number;
}

interface GoalieDisplay {
  number: string;
  name: string;
  period1: number;
  period2: number;
  period3: number;
  ot: number;
  totalSaves: number;
  totalShots: number;
}

interface GameSheetModalProps {
  game: Game | null;
  open: boolean;
  onClose: () => void;
}

// Compute REAL period scores from ScoringStats data
// Each ScoringStats entry represents one goal with Period, TeamId fields
// Uses roster to reliably determine which team scored (goal.TeamId can be unreliable)
const computePeriodScores = (
  scoringStats: any[] | undefined,
  homeTeamId: number,
  visitorTeamId: number,
  roster?: any[]
): PeriodScore[] => {
  if (!scoringStats || scoringStats.length === 0 || homeTeamId === 0) {
    // No real data available — return zeros (don't fabricate)
    return [
      { period: '1', homeScore: 0, awayScore: 0 },
      { period: '2', homeScore: 0, awayScore: 0 },
      { period: '3', homeScore: 0, awayScore: 0 },
    ];
  }

  // Count goals per period per team
  const periodMap: Record<number, { home: number; away: number }> = {};
  
  scoringStats.forEach(goal => {
    const period = goal.Period || 0;
    if (!periodMap[period]) periodMap[period] = { home: 0, away: 0 };
    
    // Determine scoring team: look up the scorer in the roster first (most reliable)
    const scorer = roster?.find((r: any) => (r.PlayerId || r.PersonId) === goal.PlayerId);
    let scoringTeamId: string;
    if (scorer?.TeamId) {
      scoringTeamId = String(scorer.TeamId);
    } else if (goal.ScoringTeamId) {
      scoringTeamId = String(goal.ScoringTeamId);
    } else {
      scoringTeamId = String(goal.TeamId || '');
    }
    
    if (scoringTeamId === String(homeTeamId)) {
      periodMap[period].home++;
    } else if (scoringTeamId === String(visitorTeamId)) {
      periodMap[period].away++;
    }
  });

  // Build period scores for periods 1-3 plus any OT
  const result: PeriodScore[] = [];
  for (let p = 1; p <= 3; p++) {
    result.push({
      period: String(p),
      homeScore: periodMap[p]?.home || 0,
      awayScore: periodMap[p]?.away || 0,
    });
  }
  
  // Check for OT periods (4+)
  const otPeriods = Object.keys(periodMap).map(Number).filter(p => p > 3).sort((a, b) => a - b);
  if (otPeriods.length > 0) {
    let otHome = 0, otAway = 0;
    otPeriods.forEach(p => {
      otHome += periodMap[p]?.home || 0;
      otAway += periodMap[p]?.away || 0;
    });
    result.push({
      period: 'OT',
      homeScore: otHome,
      awayScore: otAway,
    });
  }

  return result;
};

// Generate team stats
const generateTeamStats = (score: number, opponentScore: number): TeamStats => {
  const shots = score * 3 + Math.floor(Math.random() * 10) + 15;
  const opponentShots = opponentScore * 3 + Math.floor(Math.random() * 10) + 15;
  const saves = opponentShots - opponentScore;
  
  return {
    shots,
    saves,
    savePercentage: parseFloat(((saves / opponentShots) * 100).toFixed(1)),
    powerPlays: `${Math.floor(score * 0.2)}/${Math.floor(Math.random() * 3) + 2}`,
    penalties: Math.floor(Math.random() * 5) + 3,
    penaltyMinutes: (Math.floor(Math.random() * 5) + 3) * 2 + Math.floor(Math.random() * 40)
  };
};

/**
 * Transform API roster data into component format with scoring data
 * 
 * Key Data Structures:
 * - RosterView: Contains PlayerNumber (jersey #), PersonId, TeamPlayerId, FirstName, LastName
 * - ScoringStats: Each entry is ONE goal with scorer (PersonId) and assists (AssistedByTeamPlayerId1/2)
 * - PenaltyStats: Contains PersonId, PenaltyMinutes, Period, TimeIn
 */
function transformRosterWithScoring(
  rosterPlayers: any[] | undefined,
  scoringStats: any[] | undefined,
  penaltyStats: any[] | undefined,
  teamId: number
): RosterPlayer[] {
  if (!rosterPlayers || rosterPlayers.length === 0) {
    return [];
  }

  // Filter roster for this team - only include actual players with valid jersey numbers
  // PlayerNumber contains role codes for staff (like "TPRM", "ASSTC", etc.)
  const teamRoster = rosterPlayers.filter(p => {
    // Use loose comparison or string conversion for IDs to be safe
    if (String(p.TeamId) !== String(teamId)) return false;
    
    // Check various possible fields for jersey number
    const playerNum = p.JerseyNumber || p.PlayerNumber || p.JerseyNo || p.No;
    
    // Check if it's a valid number
    return playerNum && !isNaN(parseInt(playerNum));
  });

  const allScoring = scoringStats || [];
  const allPenalties = penaltyStats || [];

  return teamRoster.map(player => {
    // Determine player ID (try both fields)
    const playerId = player.PlayerId || player.PersonId;
    const teamPlayerId = player.TeamPlayerId;
    
    // Filter scoring stats to find goals by this player
    // ScoringStats contains individual goal events
    const playerGoals = allScoring.filter(s => s.PlayerId === playerId || s.PersonId === playerId);
    
    // Map goals to the expected format
    const goals = playerGoals.map(g => ({
      period: g.Period,
      time: g.TimeIn || g.Time || '0:00'
    }));
    
    // Calculate assists
    // Assists are linked via TeamPlayerId
    const playerAssists = allScoring.filter(s => 
      (s.AssistedByTeamPlayerId1 && s.AssistedByTeamPlayerId1 === teamPlayerId) || 
      (s.AssistedByTeamPlayerId2 && s.AssistedByTeamPlayerId2 === teamPlayerId)
    );
    
    const goalsCount = goals.length;
    const assistsCount = playerAssists.length;
    const points = goalsCount + assistsCount;

    // Calculate penalty minutes for this player
    // CRITICAL: Penalties use PlayerId, not PersonId!
    const penaltyMinutes = allPenalties
      .filter(p => p.PlayerId === playerId)
      .reduce((sum, p) => sum + (p.PenaltyMinutes || p.PenaltyMin || 0), 0);

    const playerNum = player.JerseyNumber || player.PlayerNumber || player.JerseyNo || player.No || '0';

    // Determine player position/flag code for gamesheet
    // Primary source: PositionCode field from the API roster entry
    const positionCode = (player.PositionCode || '').trim();
    let flag = positionCode;
    
    // Fallback: infer from legacy fields if PositionCode is missing
    if (!flag) {
      const pos = (player.Position || player.RosterPosition || player.PlayerPosition || '').toUpperCase();
      if (/^G$|GOALIE|GOALKEEPER|GOAL\s*TENDER/i.test(pos)) flag = 'G';
      if (player.IsCaptain || player.Captain) flag = 'C';
      else if (player.IsAlternate || player.IsAssistantCaptain || player.AlternateCaptain) flag = 'A';
      if ((player.IsAffiliate || player.AffiliatePlayer || player.AffiliateFlag) && !flag) flag = 'AP';
      if ((player.InHomePenalties || player.InHomePenaltiesFlag) && !flag) flag = 'IN';
      if (player.ServingSuspension && !flag) flag = 'S';
    }

    return {
      number: String(playerNum), 
      name: `${player.LastName?.toUpperCase() || ''}, ${player.FirstName?.toUpperCase() || ''}`.trim(),
      flag,
      goals,
      assists: assistsCount,
      points,
      penaltyMinutes,
      isInHome: !!player.InHomePenalties,
      servingSuspension: !!(player.ServingSuspension),
      suspensionNote: player.SuspensionNote || undefined
    };
  }).sort((a, b) => {
    // Sort by jersey number
    const numA = parseInt(a.number) || 0;
    const numB = parseInt(b.number) || 0;
    return numA - numB;
  });
}

/**
 * Transform API penalty data into component format
 * 
 * Key Fields:
 * - PersonId: Player identifier
 * - PlayerNo or StatPlayerNo: Jersey number
 * - FirstName, LastName: Player name
 * - Period: Which period
 * - PenaltyMinutes or Minutes: Duration
 * - TimeIn or Time: When it occurred
 * - PenaltyType or Infraction: Description
 */
function transformPenalties(
  penaltyStats: any[] | undefined,
  rosterPlayers: any[] | undefined,
  teamId: number
): Penalty[] {
  if (!penaltyStats || penaltyStats.length === 0) {
    return [];
  }

  // Filter by PenaltyTeamId, not TeamId
  const teamPenalties = penaltyStats.filter(p => String(p.PenaltyTeamId) === String(teamId));

  return teamPenalties.map(penalty => {
    // Look up player info from roster using PlayerId
    const player = rosterPlayers?.find(r => 
      (r.PlayerId || r.PersonId) === penalty.PlayerId
    );
    
    const jerseyNumber = player?.JerseyNumber || player?.PlayerNumber || penalty.PlayerNo || '?';
    const playerName = player 
      ? `${player.FirstName} ${player.LastName}`.toUpperCase()
      : `PLAYER #${jerseyNumber}`;
    
    return {
      period: penalty.Period || 0,
      playerNumber: String(jerseyNumber),
      playerName,
      offence: penalty.PenaltyName || penalty.PenaltyType || 'Unknown',
      minutes: penalty.PenaltyMin || penalty.PenaltyMinutes || 0,
      startTime: penalty.TimeIn || '0:00',
      finishTime: penalty.TimeOut || 'End'
    };
  }).sort((a, b) => {
    // Sort by period first, then by clock time descending (countdown: higher time = earlier in period)
    if (a.period !== b.period) return a.period - b.period;
    return parseClockTimeToSeconds(b.startTime) - parseClockTimeToSeconds(a.startTime);
  });
}

/**
 * Calculate team stats from API data
 * 
 * Goalie Stats Fields:
 * - TeamId - Which team
 * - TotalShots - Total shots faced
 * - ShotsStopped - Saves made
 * 
 * Penalty Stats Fields:
 * - PenaltyTeamId (NOT TeamId!) - Which team committed the penalty
 * - PenaltyMin (NOT PenaltyMinutes!) - Duration in minutes
 */
function calculateTeamStats(
  goalieStats: any[] | undefined,
  penaltyStats: any[] | undefined,
  teamId: number,
  opponentTeamId: number
): TeamStats {
  // IMPORTANT: A team's own goalies report shots AGAINST this team (opponent's shots on net)
  // and saves made BY this team's goalies.
  // To get this team's OWN shots on goal, we look at the OPPONENT's goalie stats.
  const teamGoalies = goalieStats?.filter((g: any) => String(g.TeamId) === String(teamId)) || [];
  const opponentGoalies = goalieStats?.filter((g: any) => String(g.TeamId) === String(opponentTeamId)) || [];
  
  // Saves = saves made by this team's goalies (from their own goalie data)
  const saves = teamGoalies.reduce((sum: number, g: any) => sum + (g.ShotsStopped || 0), 0);
  // Shots against = total shots faced by this team's goalies
  const shotsAgainst = teamGoalies.reduce((sum: number, g: any) => sum + (g.TotalShots || 0), 0);
  // Shots FOR = total shots faced by opponent's goalies (= this team's shots on goal)
  const shotsFor = opponentGoalies.reduce((sum: number, g: any) => sum + (g.TotalShots || 0), 0);
  
  const savePercentage = shotsAgainst > 0 ? parseFloat(((saves / shotsAgainst) * 100).toFixed(1)) : 0;

  // Get penalty stats for this team - USE PenaltyTeamId NOT TeamId!
  const teamPenaltiesData = penaltyStats?.filter((p: any) => String(p.PenaltyTeamId) === String(teamId)) || [];
  const penaltyCount = teamPenaltiesData.length;
  const totalPenaltyMinutes = teamPenaltiesData.reduce((sum: number, p: any) => sum + (p.PenaltyMin || 0), 0);

  return {
    shots: shotsFor || 0,       // This team's shots on goal
    saves: saves || 0,          // Saves by this team's goalies
    savePercentage,             // This team's goalie save %
    powerPlays: '0/0',         // API doesn't provide power play data directly
    penalties: penaltyCount,
    penaltyMinutes: totalPenaltyMinutes
  };
}

/**
 * Extract coaching staff from TeamRoles array (bench personnel)
 * This matches the data structure used by the Team Detail Page
 */
function extractCoachingStaffFromTeamRoles(teamRoles: any[]): CoachingStaff {
  if (!teamRoles || !Array.isArray(teamRoles)) {
    return { headCoach: 'TBD', assistantCoaches: [], trainer: '', manager: '', allStaff: [] };
  }

  // Filter for bench personnel only
  const benchStaff = teamRoles.filter((role: any) =>
    role.TeamRoleClassification === 'Bench'
  );

  // Clean name - remove role codes in parentheses like "(CHH)", "(CH3)", "(BMVP)", etc.
  function cleanName(name: string): string {
    return name.replace(/\s*\([^)]+\)\s*$/g, '').trim();
  }

  // Sort priority: Head Coach first, then Asst Coaches, Trainers, Managers, then others
  function getRolePriority(roleName: string): number {
    if (roleName === 'Head Coach') return 1;
    if (roleName.includes('Asst Coach')) return 2;
    if (roleName.includes('Trainer')) return 3;
    if (roleName.includes('Manager')) return 4;
    return 5;
  }

  const sortedStaff = benchStaff
    .map((role: any) => {
      const roleName = role.Role || '';
      // Use FirstName + LastName if available, otherwise use Name and clean it
      let personName = '';
      if (role.FirstName && role.LastName) {
        personName = `${role.FirstName} ${role.LastName}`.trim();
      } else if (role.Name) {
        personName = cleanName(role.Name);
      }
      return { role: roleName, name: personName || 'TBD', priority: getRolePriority(roleName) };
    })
    .sort((a: any, b: any) => a.priority - b.priority);

  const headCoach = sortedStaff.find((s: any) => s.role === 'Head Coach');
  const assistantCoaches = sortedStaff.filter((s: any) => s.role.includes('Asst Coach'));
  const trainer = sortedStaff.find((s: any) => s.role.includes('Trainer'));
  const manager = sortedStaff.find((s: any) => s.role.includes('Manager'));

  // Build allStaff array
  const allStaff: { role: string; name: string }[] = [];
  if (headCoach) allStaff.push({ role: 'COACH', name: headCoach.name.toUpperCase() });
  assistantCoaches.forEach((ac: any) => allStaff.push({ role: 'COACH', name: ac.name.toUpperCase() }));
  if (trainer) allStaff.push({ role: 'TRAINER', name: trainer.name.toUpperCase() });
  if (manager) allStaff.push({ role: 'MANAGER', name: manager.name.toUpperCase() });

  return {
    headCoach: headCoach ? headCoach.name.toUpperCase() : 'TBD',
    assistantCoaches: assistantCoaches.map((ac: any) => ac.name.toUpperCase()),
    trainer: trainer ? trainer.name.toUpperCase() : '',
    manager: manager ? manager.name.toUpperCase() : '',
    allStaff
  };
}

/**
 * Transform goalie stats from API into display format
 * 
 * GoalieStats Fields:
 * - PersonId, FirstName, LastName
 * - PlayerNo or RosterPlayerNo - Jersey number
 * - TeamId - Which team
 * - Period - Which period they played (PeriodIn/PeriodOut)
 * - ShotsStopped - Saves made
 * - TotalShots - Shots faced
 */
function transformGoalieStats(
  goalieStats: any[] | undefined,
  teamId: number
): GoalieDisplay[] {
  if (!goalieStats || goalieStats.length === 0) {
    return [];
  }

  // Filter for this team's goalies
  const teamGoalies = goalieStats.filter(g => String(g.TeamId) === String(teamId));
  
  // Group by goalie (PersonId) since they may have multiple entries (one per period)
  const goalieMap = new Map<number, GoalieDisplay>();
  
  teamGoalies.forEach(entry => {
    const personId = entry.PersonId;
    
    if (!goalieMap.has(personId)) {
      goalieMap.set(personId, {
        number: entry.RosterPlayerNo || entry.PlayerNo || '?',
        name: `${entry.FirstName || ''} ${entry.LastName || ''}`.trim().toUpperCase(),
        period1: 0,
        period2: 0,
        period3: 0,
        ot: 0,
        totalSaves: 0,
        totalShots: 0
      });
    }
    
    const goalie = goalieMap.get(personId)!;
    const period = entry.PeriodIn || entry.Period || 0;
    const saves = entry.ShotsStopped || 0;
    
    // Accumulate saves by period
    if (period === 1) goalie.period1 += saves;
    else if (period === 2) goalie.period2 += saves;
    else if (period === 3) goalie.period3 += saves;
    else if (period > 3) goalie.ot += saves;
    
    goalie.totalSaves += saves;
    goalie.totalShots += (entry.TotalShots || 0);
  });
  
  return Array.from(goalieMap.values());
}

export function GameSheetModal({ game, open, onClose }: GameSheetModalProps) {
  // Fetch game details from API when modal opens
  // The game.id is the actual numeric GameId from the API (stored as string)
  // The game.gameNumber is the display number like "31-Apr"
  const gameId = game?.id ? parseInt(game.id) : null;
  
  // Only fetch if we have a valid game ID and it's not an exhibition game
  const isExhibition = game?.status === 'EXHIBITION';
  const shouldFetch = open && gameId !== null && !isNaN(gameId as number) && !isExhibition;
  
  const { gameDetails, loading, error } = useGameDetails({ 
    gameId: shouldFetch ? gameId as number : null,
    homeTeamId: game?.homeTeamId,
    visitorTeamId: game?.visitorTeamId,
    childCodes: 'SGPROT', // Fetch all data: Scoring, Goalie, Penalties, Roster, Officials, TimeOuts
    limiterCode: 'BIS', // Basic info + Images + Scores
    autoFetch: shouldFetch
  });

  // Use data directly from gameDetails, not gameDetails.Game
  // The structure is { Game: {...}, ScoringStats: [...], Roster: [...], etc }
  
  // Merge prop data with fetched details to ensure status and scores are correct
  const displayGame = useMemo(() => {
    if (!game) return null;
    if (!gameDetails?.Game) return game;
    
    const details = gameDetails.Game;
    const statusLower = (details.GameStatus || '').toLowerCase();
    
    let status = game.status;
    if (statusLower === 'final' || statusLower === 'played' || statusLower === 'completed') {
      status = 'FINAL';
    } else if (statusLower === 'in progress' || statusLower === 'live') {
      status = 'LIVE';
    } else if (status === 'UPCOMING' && details.HomeScore !== null && details.VisitorScore !== null) {
      status = 'FINAL';
    }
    
    return {
      ...game,
      status,
      homeScore: details.HomeScore ?? game.homeScore,
      awayScore: details.VisitorScore ?? game.awayScore,
      homeTeam: details.HomeTeamName || game.homeTeam,
      awayTeam: details.VisitorTeamName || game.awayTeam,
      // Try to get logos from API response if available (some endpoints return them)
      homeLogo: (details as any).HomeTeamLogoURL || (details as any).HomeTeamLogo || game.homeLogo,
      awayLogo: (details as any).VisitorTeamLogoURL || (details as any).VisitorTeamLogo || game.awayLogo,
      // Update date/time/venue from detailed response
      date: details.GameDayDate || game.date,
      fullDate: details.GameDate ? parseDateAsLocal(details.GameDate).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) : (details.GameDayDate || game.fullDate),
      // IMPORTANT: Prefer game.time from the schedule listing (already correct).
      // The detail endpoint's GameDate often has an incorrect time component (e.g. T01:00:00).
      // Only fall back to detail fields if schedule time is missing.
      time: game.time || (details as any).StartEndTime || (details.GameDate ? parseTimeAsLocal(details.GameDate) : ''),
      venue: (details as any).FacilityName || (details as any).VenueName || game.venue,
      gamestreamurl: (details as any).GameStreamUrl || (details as any).gamestreamurl || (details as any).GameStreamURL || game.gamestreamurl
    };
  }, [game, gameDetails]);

  if (!game || !displayGame) return null;

  // Derived IDs from gameDetails
  const homeTeamId = gameDetails?.Game?.HomeTeamId || 0;
  const visitorTeamId = gameDetails?.Game?.VisitorTeamId || 0;

  const homeRoster = gameDetails?.Roster && homeTeamId !== 0 ? 
    transformRosterWithScoring(gameDetails.Roster, gameDetails.ScoringStats, gameDetails.PenaltyStats, homeTeamId) :
    [];
  const awayRoster = gameDetails?.Roster && visitorTeamId !== 0 ?
    transformRosterWithScoring(gameDetails.Roster, gameDetails.ScoringStats, gameDetails.PenaltyStats, visitorTeamId) :
    [];
    
  const homeStats = gameDetails?.GoalieStats && homeTeamId !== 0 ?
    calculateTeamStats(gameDetails.GoalieStats, gameDetails.PenaltyStats, homeTeamId, visitorTeamId) :
    generateTeamStats(displayGame.homeScore, displayGame.awayScore);
  const awayStats = gameDetails?.GoalieStats && visitorTeamId !== 0 ?
    calculateTeamStats(gameDetails.GoalieStats, gameDetails.PenaltyStats, visitorTeamId, homeTeamId) :
    generateTeamStats(displayGame.awayScore, displayGame.homeScore);
    
  const homePenalties = gameDetails?.PenaltyStats && homeTeamId !== 0 ?
    transformPenalties(gameDetails.PenaltyStats, gameDetails.Roster, homeTeamId) :
    [];
  const awayPenalties = gameDetails?.PenaltyStats && visitorTeamId !== 0 ?
    transformPenalties(gameDetails.PenaltyStats, gameDetails.Roster, visitorTeamId) :
    [];

  const homeGoalies = gameDetails?.GoalieStats && homeTeamId !== 0 ?
    transformGoalieStats(gameDetails.GoalieStats, homeTeamId) :
    [];
  const awayGoalies = gameDetails?.GoalieStats && visitorTeamId !== 0 ?
    transformGoalieStats(gameDetails.GoalieStats, visitorTeamId) :
    [];
    
  const periodScores = computePeriodScores(gameDetails?.ScoringStats, homeTeamId, visitorTeamId, gameDetails?.Roster);
  
  const isAwayWin = displayGame.status === 'FINAL' && displayGame.awayScore > displayGame.homeScore;
  const isHomeWin = displayGame.status === 'FINAL' && displayGame.homeScore > displayGame.awayScore;
  
  // Prefer the formatted date; only use fullDate if it's already human-readable (not raw ISO)
  const displayDate = (displayGame.fullDate && !displayGame.fullDate.includes('T'))
    ? displayGame.fullDate
    : displayGame.date || (displayGame.fullDate
        ? parseDateAsLocal(displayGame.fullDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : '');
  const gameNumber = displayGame.gameNumber 
    || gameDetails?.Game?.GameNumber 
    || (gameDetails?.Game as any)?.GameNo 
    || undefined;
  const venueName = displayGame.venue || displayGame.location;

  const handleAddToCalendar = () => {
    const calendarGame: GameForCalendar = {
      id: displayGame.id,
      gameNumber: typeof displayGame.gameNumber === 'number' ? displayGame.gameNumber.toString() : displayGame.gameNumber,
      homeTeam: displayGame.homeTeam,
      awayTeam: displayGame.awayTeam,
      venue: venueName,
      date: displayGame.date,
      fullDate: displayDate,
      time: displayGame.time,
      division: displayGame.division,
      status: displayGame.status
    };
    exportGameToCalendar(calendarGame);
  };

  const [pdfExporting, setPdfExporting] = useState(false);
  const [homeBenchPersonnel, setHomeBenchPersonnel] = useState<CoachingStaff | null>(null);
  const [awayBenchPersonnel, setAwayBenchPersonnel] = useState<CoachingStaff | null>(null);

  // Fetch bench personnel from team data (TeamRoles)
  useEffect(() => {
    const fetchBenchPersonnel = async () => {
      if (!homeTeamId || !visitorTeamId) return;

      console.log('[GameSheet] Fetching bench personnel - Home:', homeTeamId, 'Visitor:', visitorTeamId);

      try {
        // Fetch home team data with TeamRoles (childCode 'B')
        if (homeTeamId !== 0) {
          const homeResponse = await fetchTeamRoster(homeTeamId, 'B', 'B');
          console.log('[GameSheet] Home team full response:', homeResponse);

          // Try multiple paths to find TeamRoles
          let homeTeamRoles = null;
          if (homeResponse.Success) {
            homeTeamRoles = homeResponse.Response?.Team?.TeamRoles
              || homeResponse.Response?.TeamRoles
              || homeResponse.TeamRoles
              || (homeResponse as any).Response?.TeamRoles;

            console.log('[GameSheet] Home team TeamRoles found at path:', homeTeamRoles ? 'YES' : 'NO');
            console.log('[GameSheet] Home team Response keys:', homeResponse.Response ? Object.keys(homeResponse.Response) : 'N/A');
            console.log('[GameSheet] Home team Response.Team keys:', homeResponse.Response?.Team ? Object.keys(homeResponse.Response.Team) : 'N/A');
            if (homeTeamRoles) {
              console.log('[GameSheet] Home team TeamRoles data:', homeTeamRoles);
            }
          }

          if (homeTeamRoles && Array.isArray(homeTeamRoles)) {
            const homeStaff = extractCoachingStaffFromTeamRoles(homeTeamRoles);
            console.log('[GameSheet] Home bench personnel extracted:', homeStaff);
            setHomeBenchPersonnel(homeStaff);
          } else {
            console.warn('[GameSheet] Home team: No valid TeamRoles array found');
          }
        }

        // Fetch visitor team data with TeamRoles (childCode 'B')
        if (visitorTeamId !== 0) {
          const awayResponse = await fetchTeamRoster(visitorTeamId, 'B', 'B');
          console.log('[GameSheet] Visitor team full response:', awayResponse);

          // Try multiple paths to find TeamRoles
          let awayTeamRoles = null;
          if (awayResponse.Success) {
            awayTeamRoles = awayResponse.Response?.Team?.TeamRoles
              || awayResponse.Response?.TeamRoles
              || awayResponse.TeamRoles
              || (awayResponse as any).Response?.TeamRoles;

            console.log('[GameSheet] Visitor team TeamRoles found at path:', awayTeamRoles ? 'YES' : 'NO');
            console.log('[GameSheet] Visitor team Response keys:', awayResponse.Response ? Object.keys(awayResponse.Response) : 'N/A');
            console.log('[GameSheet] Visitor team Response.Team keys:', awayResponse.Response?.Team ? Object.keys(awayResponse.Response.Team) : 'N/A');
            if (awayTeamRoles) {
              console.log('[GameSheet] Visitor team TeamRoles data:', awayTeamRoles);
            }
          }

          if (awayTeamRoles && Array.isArray(awayTeamRoles)) {
            const awayStaff = extractCoachingStaffFromTeamRoles(awayTeamRoles);
            console.log('[GameSheet] Visitor bench personnel extracted:', awayStaff);
            setAwayBenchPersonnel(awayStaff);
          } else {
            console.warn('[GameSheet] Visitor team: No valid TeamRoles array found');
          }
        }
      } catch (err) {
        console.error('[GameSheet] Error fetching bench personnel:', err);
      }
    };

    if (open && homeTeamId && visitorTeamId) {
      fetchBenchPersonnel();
    }
  }, [open, homeTeamId, visitorTeamId]);

  // Use fetched bench personnel if available, otherwise fall back to TBD
  const homeCoaching = homeBenchPersonnel || { headCoach: 'TBD', assistantCoaches: [], trainer: '', manager: '', allStaff: [] };
  const awayCoaching = awayBenchPersonnel || { headCoach: 'TBD', assistantCoaches: [], trainer: '', manager: '', allStaff: [] };

  console.log('[GameSheet] Render - homeCoaching:', homeCoaching);
  console.log('[GameSheet] Render - awayCoaching:', awayCoaching);

  const handleExportPDF = async () => {
    setPdfExporting(true);
    try {
      const pdfData: GameSheetPDFData = {
        gameNumber: gameNumber ? String(gameNumber) : '',
        homeTeam: displayGame.homeTeam,
        awayTeam: displayGame.awayTeam,
        homeScore: displayGame.homeScore,
        awayScore: displayGame.awayScore,
        date: displayDate,
        time: displayGame.time,
        venue: venueName,
        division: displayGame.division,
        status: displayGame.status,
        homeRoster,
        awayRoster,
        homePenalties,
        awayPenalties,
        homeGoalies,
        awayGoalies,
        homeStats,
        awayStats,
        homeCoaching,
        awayCoaching,
        periodScores,
        homeLogo: displayGame.homeLogo,
        awayLogo: displayGame.awayLogo,
        rmllLogo: rmllShieldLogo,
        officials: gameDetails?.Officials?.map((o: any) => ({
          role: o.OfficialRole || o.RoleName || o.PositionName || 'Referee',
          name: `${o.FirstName || ''} ${o.LastName || ''}`.trim() || o.OfficialName || o.Name || '',
          number: o.RefereeNumber || o.OfficialNumber || o.JerseyNumber || '',
          signOffTimestamp: o.SignedDateTime
            ? new Date(o.SignedDateTime).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
              })
            : undefined,
        })) || [],
        gameStartTime: displayGame.time,
        gameEndTime: gameDetails?.EndTime
          ? parseTimeAsLocal(gameDetails.EndTime)
          : undefined,
        timeOuts: gameDetails?.TimeOuts?.map((to: any) => ({
          period: to.Period || 0,
          timeOnClock: to.TimeOnClock || '',
          isHome: !!(to.HomeTimeOut || (to.TimeOutTeamId && String(to.TimeOutTeamId) === String(homeTeamId))),
        })) || [],
        suspendedPlayers: gameDetails?.Roster
          ?.filter((p: any) => p.ServingSuspension)
          .map((p: any) => ({
            number: p.JerseyNumber || p.PlayerNumber || '?',
            name: `${p.FirstName || ''} ${p.LastName || ''}`.trim(),
            team: String(p.TeamId) === String(homeTeamId) ? displayGame.homeTeam : displayGame.awayTeam,
            note: p.SuspensionNote || 'Serving suspension',
          })) || [],
        homeGoalieEntries: gameDetails?.GoalieStats
          ?.filter((g: any) => String(g.TeamId) === String(homeTeamId))
          .map((g: any) => ({
            number: g.RosterPlayerNo || g.PlayerNo || '?',
            name: `#${g.RosterPlayerNo || g.PlayerNo || '?'} ${(g.FirstName || '').toUpperCase()} ${(g.LastName || '').toUpperCase()}`.trim(),
            periodIn: g.PeriodIn || g.Period || 0,
            timeIn: g.TimeIn || '',
            periodOut: g.PeriodOut || 0,
            timeOut: g.TimeOut || '',
            minsPlayed: g.MinutesPlayed || '',
            shots: g.TotalShots || 0,
            saves: g.ShotsStopped || 0,
          })) || [],
        awayGoalieEntries: gameDetails?.GoalieStats
          ?.filter((g: any) => String(g.TeamId) === String(visitorTeamId))
          .map((g: any) => ({
            number: g.RosterPlayerNo || g.PlayerNo || '?',
            name: `#${g.RosterPlayerNo || g.PlayerNo || '?'} ${(g.FirstName || '').toUpperCase()} ${(g.LastName || '').toUpperCase()}`.trim(),
            periodIn: g.PeriodIn || g.Period || 0,
            timeIn: g.TimeIn || '',
            periodOut: g.PeriodOut || 0,
            timeOut: g.TimeOut || '',
            minsPlayed: g.MinutesPlayed || '',
            shots: g.TotalShots || 0,
            saves: g.ShotsStopped || 0,
          })) || [],
        scoringDetails: gameDetails?.ScoringStats?.map((goal: any) => {
          const scorer = gameDetails.Roster?.find((r: any) => (r.PlayerId || r.PersonId) === goal.PlayerId);
          const scoringTeamId = scorer?.TeamId ? String(scorer.TeamId) : (goal.ScoringTeamId ? String(goal.ScoringTeamId) : String(goal.TeamId || ''));
          const a1 = goal.AssistedByTeamPlayerId1 ? gameDetails.Roster?.find((r: any) => r.TeamPlayerId === goal.AssistedByTeamPlayerId1) : null;
          const a2 = goal.AssistedByTeamPlayerId2 ? gameDetails.Roster?.find((r: any) => r.TeamPlayerId === goal.AssistedByTeamPlayerId2) : null;
          return {
            period: goal.Period || 0,
            time: goal.TimeIn || goal.Time || '',
            scorerNum: scorer ? String(scorer.JerseyNumber || scorer.PlayerNumber || '?') : String(goal.PlayerNo || '?'),
            a1Num: a1 ? String(a1.JerseyNumber || a1.PlayerNumber || '?') : '',
            a2Num: a2 ? String(a2.JerseyNumber || a2.PlayerNumber || '?') : '',
            type: goal.GoalTypeCode || goal.GoalType || '',
            isHome: scoringTeamId === String(homeTeamId),
          };
        }) || [],
      };
      await exportGameSheetPDF(pdfData);
    } catch (err) {
      console.error('[GameSheetModal] PDF export error:', err);
    } finally {
      setPdfExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-[95vw] lg:max-w-7xl max-h-[90vh] overflow-y-auto">
<DialogHeader>
          <DialogTitle className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-bold text-gray-900">
                Live Gamesheet{gameNumber ? ` - Game #${gameNumber}` : ''}
              </span>
              <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded">
                {displayGame.division}
              </span>
            </div>
            
            {/* Conditional Game Stream Button */}
            {displayGame.gamestreamurl && (
              <a
                href={displayGame.gamestreamurl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded hover:bg-red-700 transition-colors shadow-sm"
              >
                <Video className="w-4 h-4" />
                Watch Game Stream
              </a>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Complete game information including scores, statistics, and player performance
          </DialogDescription>
        </DialogHeader>

        {loading && !gameDetails ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Loading game details...</p>
          </div>
        ) : (
          <div className="space-y-4 mt-4 font-sans">
            {/* Game Header */}
          <div className="bg-gradient-to-r from-[#013fac] to-[#001741] rounded-lg p-3 text-white">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span className="font-bold text-sm">{displayDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-bold text-sm">{displayGame.time}</span>
                </div>
                <FacilityMapLink venueName={venueName} className="font-bold text-sm text-white hover:text-blue-100" />
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded ${
                  displayGame.status === 'LIVE'
                    ? 'bg-red-600 text-white animate-pulse'
                    : displayGame.status === 'FINAL'
                    ? 'bg-gray-800 text-white'
                    : displayGame.status === 'EXHIBITION'
                    ? 'bg-amber-600 text-white'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {displayGame.status}
              </span>
            </div>
          </div>

          {/* Score Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Home Team (left) */}
            <div
              className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg border-2 ${
                isHomeWin
                  ? 'bg-green-50 border-green-500'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <img
                src={displayGame.homeLogo || rmllShieldLogo}
                alt={displayGame.homeTeam}
                className="w-16 h-16 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = rmllShieldLogo; }}
              />
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1">
                <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                  <span
                    className={`font-bold text-lg ${
                      isHomeWin ? 'text-green-900' : 'text-gray-900'
                    }`}
                  >
                    {displayGame.homeTeam}
                  </span>
                  {isHomeWin && (
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                      WINNER
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500 font-semibold">
                  Home{displayGame.homeRecord ? ` • ${displayGame.homeRecord}` : ''}
                </span>
              </div>
              {displayGame.status !== 'UPCOMING' && displayGame.status !== 'EXHIBITION' && (
                <span
                  className={`text-4xl sm:text-5xl font-bold ${
                    isHomeWin ? 'text-green-700' : 'text-gray-400'
                  }`}
                >
                  {displayGame.homeScore}
                </span>
              )}
            </div>

            {/* Away Team (right) */}
            <div
              className={`flex flex-col sm:flex-row-reverse items-center justify-between gap-4 p-4 rounded-lg border-2 ${
                isAwayWin
                  ? 'bg-green-50 border-green-500'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <img
                src={displayGame.awayLogo || rmllShieldLogo}
                alt={displayGame.awayTeam}
                className="w-16 h-16 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = rmllShieldLogo; }}
              />
              <div className="flex flex-col items-center sm:items-end text-center sm:text-right flex-1">
                <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
                  {isAwayWin && (
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                      WINNER
                    </span>
                  )}
                  <span
                    className={`font-bold text-lg ${
                      isAwayWin ? 'text-green-900' : 'text-gray-900'
                    }`}
                  >
                    {displayGame.awayTeam}
                  </span>
                </div>
                <span className="text-xs text-gray-500 font-semibold">
                  {displayGame.awayRecord ? `${displayGame.awayRecord} • ` : ''}Visitor
                </span>
              </div>
              {displayGame.status !== 'UPCOMING' && displayGame.status !== 'EXHIBITION' && (
                <span
                  className={`text-4xl sm:text-5xl font-bold ${
                    isAwayWin ? 'text-green-700' : 'text-gray-400'
                  }`}
                >
                  {displayGame.awayScore}
                </span>
              )}
            </div>
          </div>

          {displayGame.status !== 'UPCOMING' && displayGame.status !== 'EXHIBITION' && (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="summary" className="font-bold text-xs sm:text-sm">
                  Summary
                </TabsTrigger>
                <TabsTrigger value="rosters" className="font-bold text-xs sm:text-sm">
                  Rosters
                </TabsTrigger>
                <TabsTrigger value="boxscores" className="font-bold text-xs sm:text-sm">
                  Box Scores
                </TabsTrigger>
                <TabsTrigger value="penalties" className="font-bold text-xs sm:text-sm">
                  Penalties
                </TabsTrigger>
                <TabsTrigger value="officials" className="font-bold text-xs sm:text-sm">
                  Officials
                </TabsTrigger>
              </TabsList>

              {/* Summary Tab */}
              <TabsContent value="summary" className="space-y-4 mt-4">
                {/* Period Scores */}
                <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
                  <div className="bg-black px-4 py-2">
                    <h4 className="font-bold text-white text-sm text-center">PERIOD SCORES</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-white border-b-2 border-black">
                          <th className="px-3 py-2 text-left font-bold text-xs uppercase w-[200px]">TEAM</th>
                          {periodScores.map((ps) => (
                            <th key={ps.period} className="px-3 py-2 text-center font-bold text-xs uppercase">{ps.period}</th>
                          ))}
                          <th className="px-3 py-2 text-center font-bold text-xs uppercase bg-yellow-50">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-300 bg-gray-50">
                          <td className="px-3 py-2 text-xs font-bold">{displayGame.awayTeam}</td>
                          {periodScores.map((ps) => (
                            <td key={ps.period} className="px-3 py-2 text-center text-xs font-bold">{ps.awayScore}</td>
                          ))}
                          <td className="px-3 py-2 text-center text-sm font-black bg-yellow-50">{displayGame.awayScore}</td>
                        </tr>
                        <tr className="bg-white">
                          <td className="px-3 py-2 text-xs font-bold">{displayGame.homeTeam}</td>
                          {periodScores.map((ps) => (
                            <td key={ps.period} className="px-3 py-2 text-center text-xs font-bold">{ps.homeScore}</td>
                          ))}
                          <td className="px-3 py-2 text-center text-sm font-black bg-yellow-50">{displayGame.homeScore}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Game Time */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 border border-gray-300">
                    <h5 className="font-bold text-xs text-gray-900 mb-1 uppercase">Game Time</h5>
                    <p className="text-xs"><span className="font-bold">Started:</span> {displayGame.time || 'N/A'}</p>
                    <p className="text-xs"><span className="font-bold">Status:</span> {displayGame.status}</p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-gray-300">
                    <h5 className="font-bold text-xs text-gray-900 mb-1 uppercase">Team Stats</h5>
                    <p className="text-xs"><span className="font-bold">Home SOG:</span> {homeStats.shots} | <span className="font-bold">PIM:</span> {homeStats.penaltyMinutes}</p>
                    <p className="text-xs"><span className="font-bold">Visitor SOG:</span> {awayStats.shots} | <span className="font-bold">PIM:</span> {awayStats.penaltyMinutes}</p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-gray-300">
                    <h5 className="font-bold text-xs text-gray-900 mb-1 uppercase">Coaching Staff</h5>
                    <p className="text-xs"><span className="font-bold">Home Coaches:</span> {[homeCoaching.headCoach, ...homeCoaching.assistantCoaches].filter(c => c && c !== 'TBD').join(', ') || 'TBD'}</p>
                    <p className="text-xs"><span className="font-bold">Visitor Coaches:</span> {[awayCoaching.headCoach, ...awayCoaching.assistantCoaches].filter(c => c && c !== 'TBD').join(', ') || 'TBD'}</p>
                  </div>
                </div>

                {/* Team Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Home Goalie Stats */}
                  <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
                    <div className="bg-black px-4 py-2 flex items-center gap-3">
                      <img src={displayGame.homeLogo || rmllShieldLogo} alt="" className="w-6 h-6" onError={(e) => { (e.target as HTMLImageElement).src = rmllShieldLogo; }} />
                      <h4 className="font-bold text-white text-xs">HOME GOALIE STATS — {displayGame.homeTeam}</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-white border-b border-gray-300">
                            <th className="px-3 py-2 text-left font-bold text-xs">#</th>
                            <th className="px-3 py-2 text-left font-bold text-xs">NAME</th>
                            <th className="px-3 py-2 text-center font-bold text-xs">1</th>
                            <th className="px-3 py-2 text-center font-bold text-xs">2</th>
                            <th className="px-3 py-2 text-center font-bold text-xs">3</th>
                            <th className="px-3 py-2 text-center font-bold text-xs">OT</th>
                            <th className="px-3 py-2 text-center font-bold text-xs bg-yellow-50">SAVES</th>
                          </tr>
                        </thead>
                        <tbody>
                          {homeGoalies.length > 0 ? homeGoalies.map((goalie, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 text-xs font-bold">{goalie.number}</td>
                              <td className="px-3 py-2 text-xs font-bold">{goalie.name}</td>
                              <td className="px-3 py-2 text-center text-xs">{goalie.period1}</td>
                              <td className="px-3 py-2 text-center text-xs">{goalie.period2}</td>
                              <td className="px-3 py-2 text-center text-xs">{goalie.period3}</td>
                              <td className="px-3 py-2 text-center text-xs">{goalie.ot || '-'}</td>
                              <td className="px-3 py-2 text-center text-xs font-bold bg-yellow-50">{goalie.totalSaves}</td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={7} className="px-3 py-2 text-center text-xs text-gray-500">No goalie data available</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Away Goalie Stats */}
                  <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
                    <div className="bg-black px-4 py-2 flex items-center gap-3">
                      <img src={displayGame.awayLogo || rmllShieldLogo} alt="" className="w-6 h-6" onError={(e) => { (e.target as HTMLImageElement).src = rmllShieldLogo; }} />
                      <h4 className="font-bold text-white text-xs">VISITOR GOALIE STATS — {displayGame.awayTeam}</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-white border-b border-gray-300">
                            <th className="px-3 py-2 text-left font-bold text-xs">#</th>
                            <th className="px-3 py-2 text-left font-bold text-xs">NAME</th>
                            <th className="px-3 py-2 text-center font-bold text-xs">1</th>
                            <th className="px-3 py-2 text-center font-bold text-xs">2</th>
                            <th className="px-3 py-2 text-center font-bold text-xs">3</th>
                            <th className="px-3 py-2 text-center font-bold text-xs">OT</th>
                            <th className="px-3 py-2 text-center font-bold text-xs bg-yellow-50">SAVES</th>
                          </tr>
                        </thead>
                        <tbody>
                          {awayGoalies.length > 0 ? awayGoalies.map((goalie, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 text-xs font-bold">{goalie.number}</td>
                              <td className="px-3 py-2 text-xs font-bold">{goalie.name}</td>
                              <td className="px-3 py-2 text-center text-xs">{goalie.period1}</td>
                              <td className="px-3 py-2 text-center text-xs">{goalie.period2}</td>
                              <td className="px-3 py-2 text-center text-xs">{goalie.period3}</td>
                              <td className="px-3 py-2 text-center text-xs">{goalie.ot || '-'}</td>
                              <td className="px-3 py-2 text-center text-xs font-bold bg-yellow-50">{goalie.totalSaves}</td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={7} className="px-3 py-2 text-center text-xs text-gray-500">No goalie data available</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Scoring Play-by-Play */}
                {gameDetails?.ScoringStats && gameDetails.ScoringStats.length > 0 && (
                  <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
                    <div className="bg-black px-4 py-2">
                      <h4 className="font-bold text-white text-sm text-center">SCORING SUMMARY</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-white border-b-2 border-black">
                            <th className="px-3 py-2 text-center font-bold text-xs">PER</th>
                            <th className="px-3 py-2 text-center font-bold text-xs">TIME</th>
                            <th className="px-3 py-2 text-left font-bold text-xs">TEAM</th>
                            <th className="px-3 py-2 text-left font-bold text-xs">SCORED BY</th>
                            <th className="px-3 py-2 text-left font-bold text-xs">ASSISTS</th>
                            <th className="px-3 py-2 text-center font-bold text-xs">TYPE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...gameDetails.ScoringStats]
                            .sort((a: any, b: any) => {
                              if ((a.Period || 0) !== (b.Period || 0)) return (a.Period || 0) - (b.Period || 0);
                              // Descending clock time (countdown: higher time = earlier in period)
                              return parseClockTimeToSeconds(b.TimeIn || '') - parseClockTimeToSeconds(a.TimeIn || '');
                            })
                            .map((goal: any, idx: number) => {
                              // Find scorer info from roster to determine which team scored
                              const scorer = gameDetails.Roster?.find((r: any) => 
                                (r.PlayerId || r.PersonId) === goal.PlayerId
                              );
                              
                              // Determine which team scored:
                              // 1. Use the scorer's TeamId from roster (most reliable)
                              // 2. Fall back to goal.ScoringTeamId if available
                              // 3. Last resort: goal.TeamId (can be unreliable)
                              let scoringTeamId: string;
                              if (scorer?.TeamId) {
                                scoringTeamId = String(scorer.TeamId);
                              } else if (goal.ScoringTeamId) {
                                scoringTeamId = String(goal.ScoringTeamId);
                              } else {
                                scoringTeamId = String(goal.TeamId || '');
                              }
                              
                              const isHome = scoringTeamId === String(homeTeamId);
                              // Find assist players from roster using TeamPlayerId
                              const assist1 = goal.AssistedByTeamPlayerId1 
                                ? gameDetails.Roster?.find((r: any) => r.TeamPlayerId === goal.AssistedByTeamPlayerId1)
                                : null;
                              const assist2 = goal.AssistedByTeamPlayerId2
                                ? gameDetails.Roster?.find((r: any) => r.TeamPlayerId === goal.AssistedByTeamPlayerId2)
                                : null;
                              const assistNames = [assist1, assist2]
                                .filter(Boolean)
                                .map(a => `#${a!.JerseyNumber || a!.PlayerNumber || '?'} ${a!.FirstName?.[0]}. ${a!.LastName}`)
                                .join(', ');
                              
                              const goalType = goal.GoalTypeCode || goal.GoalType || '';
                              
                              return (
                                <tr key={idx} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                  <td className="px-3 py-2 text-center text-xs font-bold">{goal.Period || '-'}</td>
                                  <td className="px-3 py-2 text-center text-xs">{goal.TimeIn || goal.Time || '-'}</td>
                                  <td className="px-3 py-2 text-xs font-bold">
                                    <span className={isHome ? 'text-blue-700' : 'text-red-700'}>
                                      {isHome ? displayGame.homeTeam : displayGame.awayTeam}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-xs font-bold">
                                    {scorer 
                                      ? `#${scorer.JerseyNumber || scorer.PlayerNumber || '?'} ${scorer.FirstName} ${scorer.LastName}`
                                      : `Player #${goal.PlayerNo || '?'}`}
                                  </td>
                                  <td className="px-3 py-2 text-xs text-gray-600">{assistNames || 'Unassisted'}</td>
                                  <td className="px-3 py-2 text-center text-xs">
                                    {goalType && <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-[10px] font-bold">{goalType}</span>}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Rosters Tab */}
              <TabsContent value="rosters" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Away Roster */}
                  <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
                    <div className="bg-black px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={displayGame.awayLogo || rmllShieldLogo} alt="" className="w-6 h-6" onError={(e) => { (e.target as HTMLImageElement).src = rmllShieldLogo; }} />
                        <h4 className="font-bold text-white text-xs">VISITOR — {displayGame.awayTeam}</h4>
                      </div>
                      {/* Colour label removed */}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-white border-b-2 border-black">
                            <th className="px-3 py-2 text-left font-bold text-xs">#</th>
                            <th className="px-3 py-2 text-left font-bold text-xs">PLAYER (Family Name, First)</th>
                            <th className="px-3 py-2 text-center font-bold text-xs w-12">FLAGS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {awayRoster.map((player, idx) => (
                            <tr key={idx} className={`border-b border-gray-200 ${player.servingSuspension ? 'bg-amber-50' : idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                              <td className="px-3 py-2 text-xs font-bold">{player.number}</td>
                              <td className="px-3 py-2 text-xs font-bold">
                                {player.name}
                                {player.servingSuspension && (
                                  <span className="ml-2 text-[10px] font-semibold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded" title={player.suspensionNote || 'Serving suspension'}>SUSP</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-center text-xs">
                                {player.flag && (
                                  <span className={`inline-block font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                    player.flag === 'AP' ? 'bg-purple-100 text-purple-800' :
                                    player.flag === 'IN' ? 'bg-blue-100 text-blue-800' :
                                    player.flag === 'C' || player.flag === 'A' ? 'bg-yellow-100 text-yellow-800' :
                                    player.flag === 'GL' ? 'bg-green-100 text-green-800' :
                                    player.flag === 'S' ? 'bg-amber-100 text-amber-800' :
                                    'bg-gray-100 text-gray-700'
                                  }`} title={
                                    player.flag === 'AP' ? 'Affiliate Player' :
                                    player.flag === 'IN' ? 'In-Home for Penalties' :
                                    player.flag === 'C' ? 'Captain' :
                                    player.flag === 'A' ? 'Alternate Captain' :
                                    player.flag === 'GL' ? 'Goalie' :
                                    player.flag === 'S' ? 'Serving Suspension' :
                                    player.flag
                                  }>{player.flag}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-black px-4 py-2">
                      <p className="text-white text-xs">
                        <span className="font-bold">Total Players on Bench:</span> {awayRoster.length}
                      </p>
                    </div>
                  </div>

                  {/* Home Roster */}
                  <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
                    <div className="bg-black px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={displayGame.homeLogo || rmllShieldLogo} alt="" className="w-6 h-6" onError={(e) => { (e.target as HTMLImageElement).src = rmllShieldLogo; }} />
                        <h4 className="font-bold text-white text-xs">HOME — {displayGame.homeTeam}</h4>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-white border-b-2 border-black">
                            <th className="px-3 py-2 text-left font-bold text-xs">#</th>
                            <th className="px-3 py-2 text-left font-bold text-xs">PLAYER (Family Name, First)</th>
                            <th className="px-3 py-2 text-center font-bold text-xs w-12">FLAGS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {homeRoster.map((player, idx) => (
                            <tr key={idx} className={`border-b border-gray-200 ${player.servingSuspension ? 'bg-amber-50' : idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                              <td className="px-3 py-2 text-xs font-bold">{player.number}</td>
                              <td className="px-3 py-2 text-xs font-bold">
                                {player.name}
                                {player.servingSuspension && (
                                  <span className="ml-2 text-[10px] font-semibold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded" title={player.suspensionNote || 'Serving suspension'}>SUSP</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-center text-xs">
                                {player.flag && (
                                  <span className={`inline-block font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                    player.flag === 'AP' ? 'bg-purple-100 text-purple-800' :
                                    player.flag === 'IN' ? 'bg-blue-100 text-blue-800' :
                                    player.flag === 'C' || player.flag === 'A' ? 'bg-yellow-100 text-yellow-800' :
                                    player.flag === 'GL' ? 'bg-green-100 text-green-800' :
                                    player.flag === 'S' ? 'bg-amber-100 text-amber-800' :
                                    'bg-gray-100 text-gray-700'
                                  }`} title={
                                    player.flag === 'AP' ? 'Affiliate Player' :
                                    player.flag === 'IN' ? 'In-Home for Penalties' :
                                    player.flag === 'C' ? 'Captain' :
                                    player.flag === 'A' ? 'Alternate Captain' :
                                    player.flag === 'GL' ? 'Goalie' :
                                    player.flag === 'S' ? 'Serving Suspension' :
                                    player.flag
                                  }>{player.flag}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-black px-4 py-2">
                      <p className="text-white text-xs">
                        <span className="font-bold">Total Players on Bench:</span> {homeRoster.length}
                      </p>
                    </div>
                  </div>
                </div>

              </TabsContent>

              {/* Box Scores Tab */}
              <TabsContent value="boxscores" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Home Box Score */}
                  <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
                    <div className="bg-black px-4 py-2 flex items-center gap-3">
                      <img src={displayGame.homeLogo || rmllShieldLogo} alt="" className="w-6 h-6" onError={(e) => { (e.target as HTMLImageElement).src = rmllShieldLogo; }} />
                      <h4 className="font-bold text-white text-xs">HOME — {displayGame.homeTeam}</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-white border-b-2 border-black">
                            <th className="px-2 py-2 text-center font-bold text-xs">#</th>
                            <th className="px-2 py-2 text-left font-bold text-xs">PLAYER</th>
                            <th className="px-2 py-2 text-center font-bold text-xs">G</th>
                            <th className="px-2 py-2 text-center font-bold text-xs">A</th>
                            <th className="px-2 py-2 text-center font-bold text-xs">PTS</th>
                            <th className="px-2 py-2 text-center font-bold text-xs">PIM</th>
                          </tr>
                        </thead>
                        <tbody>
                          {homeRoster.filter(p => p.goals.length > 0 || p.assists > 0 || (p.penaltyMinutes || 0) > 0).length > 0 ? (
                            homeRoster
                              .filter(p => p.goals.length > 0 || p.assists > 0 || (p.penaltyMinutes || 0) > 0)
                              .sort((a, b) => b.points - a.points || b.goals.length - a.goals.length)
                              .map((player, idx) => (
                                <tr key={idx} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                  <td className="px-2 py-2 text-center text-xs font-bold">{player.number}</td>
                                  <td className="px-2 py-2 text-xs font-bold">{player.name}</td>
                                  <td className="px-2 py-2 text-center text-xs font-bold text-red-700">{player.goals.length}</td>
                                  <td className="px-2 py-2 text-center text-xs">{player.assists}</td>
                                  <td className="px-2 py-2 text-center text-xs font-bold bg-yellow-50">{player.points}</td>
                                  <td className="px-2 py-2 text-center text-xs">{player.penaltyMinutes || 0}</td>
                                </tr>
                              ))
                          ) : (
                            <tr><td colSpan={6} className="px-3 py-4 text-center text-xs text-gray-400">No scoring data</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-black px-4 py-2 text-center">
                      <p className="text-white text-xs font-bold">{displayGame.homeScore} Goals | {homeStats.penaltyMinutes} PIM</p>
                    </div>
                  </div>

                  {/* Away Box Score */}
                  <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
                    <div className="bg-black px-4 py-2 flex items-center gap-3">
                      <img src={displayGame.awayLogo || rmllShieldLogo} alt="" className="w-6 h-6" onError={(e) => { (e.target as HTMLImageElement).src = rmllShieldLogo; }} />
                      <h4 className="font-bold text-white text-xs">VISITOR — {displayGame.awayTeam}</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-white border-b-2 border-black">
                            <th className="px-2 py-2 text-center font-bold text-xs">#</th>
                            <th className="px-2 py-2 text-left font-bold text-xs">PLAYER</th>
                            <th className="px-2 py-2 text-center font-bold text-xs">G</th>
                            <th className="px-2 py-2 text-center font-bold text-xs">A</th>
                            <th className="px-2 py-2 text-center font-bold text-xs">PTS</th>
                            <th className="px-2 py-2 text-center font-bold text-xs">PIM</th>
                          </tr>
                        </thead>
                        <tbody>
                          {awayRoster.filter(p => p.goals.length > 0 || p.assists > 0 || (p.penaltyMinutes || 0) > 0).length > 0 ? (
                            awayRoster
                              .filter(p => p.goals.length > 0 || p.assists > 0 || (p.penaltyMinutes || 0) > 0)
                              .sort((a, b) => b.points - a.points || b.goals.length - a.goals.length)
                              .map((player, idx) => (
                                <tr key={idx} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                  <td className="px-2 py-2 text-center text-xs font-bold">{player.number}</td>
                                  <td className="px-2 py-2 text-xs font-bold">{player.name}</td>
                                  <td className="px-2 py-2 text-center text-xs font-bold text-red-700">{player.goals.length}</td>
                                  <td className="px-2 py-2 text-center text-xs">{player.assists}</td>
                                  <td className="px-2 py-2 text-center text-xs font-bold bg-yellow-50">{player.points}</td>
                                  <td className="px-2 py-2 text-center text-xs">{player.penaltyMinutes || 0}</td>
                                </tr>
                              ))
                          ) : (
                            <tr><td colSpan={6} className="px-3 py-4 text-center text-xs text-gray-400">No scoring data</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-black px-4 py-2 text-center">
                      <p className="text-white text-xs font-bold">{displayGame.awayScore} Goals | {awayStats.penaltyMinutes} PIM</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Penalties Tab */}
              <TabsContent value="penalties" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Away Penalties */}
                  <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
                    <div className="bg-black px-4 py-2 flex items-center gap-3">
                      <img src={displayGame.awayLogo || rmllShieldLogo} alt="" className="w-6 h-6" onError={(e) => { (e.target as HTMLImageElement).src = rmllShieldLogo; }} />
                      <h4 className="font-bold text-white text-xs">VISITOR PENALTIES — {displayGame.awayTeam}</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-white border-b-2 border-black">
                            <th className="px-2 py-1 text-center font-bold text-xs">PER</th>
                            <th className="px-2 py-1 text-center font-bold text-xs">No.</th>
                            <th className="px-2 py-1 text-left font-bold text-xs">NAME</th>
                            <th className="px-2 py-1 text-left font-bold text-xs">OFFENCE</th>
                            <th className="px-2 py-1 text-center font-bold text-xs">MIN</th>
                            <th className="px-2 py-1 text-center font-bold text-xs">START</th>
                            <th className="px-2 py-1 text-center font-bold text-xs">FINISH</th>
                          </tr>
                        </thead>
                        <tbody>
                          {awayPenalties.map((penalty, idx) => (
                            <tr key={idx} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                              <td className="px-2 py-1 text-center text-xs font-bold">{penalty.period}</td>
                              <td className="px-2 py-1 text-center text-xs font-bold">{penalty.playerNumber}</td>
                              <td className="px-2 py-1 text-xs font-bold">{penalty.playerName}</td>
                              <td className="px-2 py-1 text-xs">{penalty.offence}</td>
                              <td className="px-2 py-1 text-center text-xs">{penalty.minutes}</td>
                              <td className="px-2 py-1 text-center text-xs">{penalty.startTime}</td>
                              <td className="px-2 py-1 text-center text-xs">{penalty.finishTime}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-black px-4 py-2 text-center">
                      <p className="text-white text-xs font-bold">{awayStats.penaltyMinutes} Mins</p>
                    </div>
                  </div>

                  {/* Home Penalties */}
                  <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
                    <div className="bg-black px-4 py-2 flex items-center gap-3">
                      <img src={displayGame.homeLogo || rmllShieldLogo} alt="" className="w-6 h-6" onError={(e) => { (e.target as HTMLImageElement).src = rmllShieldLogo; }} />
                      <h4 className="font-bold text-white text-xs">HOME PENALTIES — {displayGame.homeTeam}</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-white border-b-2 border-black">
                            <th className="px-2 py-1 text-center font-bold text-xs">PER</th>
                            <th className="px-2 py-1 text-center font-bold text-xs">No.</th>
                            <th className="px-2 py-1 text-left font-bold text-xs">NAME</th>
                            <th className="px-2 py-1 text-left font-bold text-xs">OFFENCE</th>
                            <th className="px-2 py-1 text-center font-bold text-xs">MIN</th>
                            <th className="px-2 py-1 text-center font-bold text-xs">START</th>
                            <th className="px-2 py-1 text-center font-bold text-xs">FINISH</th>
                          </tr>
                        </thead>
                        <tbody>
                          {homePenalties.map((penalty, idx) => (
                            <tr key={idx} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                              <td className="px-2 py-1 text-center text-xs font-bold">{penalty.period}</td>
                              <td className="px-2 py-1 text-center text-xs font-bold">{penalty.playerNumber}</td>
                              <td className="px-2 py-1 text-xs font-bold">{penalty.playerName}</td>
                              <td className="px-2 py-1 text-xs">{penalty.offence}</td>
                              <td className="px-2 py-1 text-center text-xs">{penalty.minutes}</td>
                              <td className="px-2 py-1 text-center text-xs">{penalty.startTime}</td>
                              <td className="px-2 py-1 text-center text-xs">{penalty.finishTime}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-black px-4 py-2 text-center">
                      <p className="text-white text-xs font-bold">{homeStats.penaltyMinutes} Mins</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Officials Tab */}
              <TabsContent value="officials" className="space-y-4 mt-4">
                {(gameDetails?.Officials && gameDetails.Officials.length > 0) ? (
                  <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
                    <div className="bg-black px-4 py-2">
                      <h4 className="font-bold text-white text-sm text-center">GAME OFFICIALS</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-white border-b-2 border-black">
                            <th className="px-3 py-2 text-center font-bold text-xs w-16">REF #</th>
                            <th className="px-3 py-2 text-left font-bold text-xs">NAME</th>
                            <th className="px-3 py-2 text-left font-bold text-xs">ROLE</th>
                            <th className="px-3 py-2 text-center font-bold text-xs">SIGNED</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gameDetails.Officials.map((official: any, idx: number) => {
                            const refNumber = official.RefereeNumber || official.OfficialNumber || official.JerseyNumber || '';
                            const name = official.FirstName && official.LastName
                              ? `${official.FirstName} ${official.LastName}`
                              : official.OfficialName || official.Name || 'N/A';
                            const role = official.OfficialRole || official.RoleName || official.PositionName || `Referee ${idx + 1}`;
                            const signedAt = official.SignedDateTime
                              ? new Date(official.SignedDateTime).toLocaleString('en-US', {
                                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                })
                              : '';
                            return (
                              <tr key={idx} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                <td className="px-3 py-2 text-center text-xs font-bold">{refNumber}</td>
                                <td className="px-3 py-2 text-xs font-bold">{name}</td>
                                <td className="px-3 py-2 text-xs uppercase text-gray-600">{role}</td>
                                <td className="px-3 py-2 text-center text-xs text-gray-500">
                                  {signedAt || <span className="text-gray-300">—</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden min-h-[200px] flex flex-col items-center justify-center p-8">
                    <div className="bg-gray-100 p-4 rounded-full mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Officials Assigned</h3>
                    <p className="text-gray-500 text-center max-w-sm text-sm">
                      Official assignment data is not yet available for this game.
                    </p>
                  </div>
                )}

                {/* Time Outs Section */}
                {gameDetails?.TimeOuts && gameDetails.TimeOuts.length > 0 && (
                  <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
                    <div className="bg-black px-4 py-2">
                      <h4 className="font-bold text-white text-sm text-center">TIME OUTS</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-white border-b-2 border-black">
                            <th className="px-3 py-2 text-center font-bold text-xs">PERIOD</th>
                            <th className="px-3 py-2 text-center font-bold text-xs">TIME ON CLOCK</th>
                            <th className="px-3 py-2 text-left font-bold text-xs">TEAM</th>
                            <th className="px-3 py-2 text-center font-bold text-xs">HOME</th>
                            <th className="px-3 py-2 text-center font-bold text-xs">VISITOR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gameDetails.TimeOuts.map((to: any, idx: number) => {
                            const isHomeTO = to.HomeTimeOut || (to.TimeOutTeamId && String(to.TimeOutTeamId) === String(homeTeamId));
                            const teamLabel = isHomeTO ? displayGame.homeTeam : displayGame.awayTeam;
                            return (
                              <tr key={idx} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                <td className="px-3 py-2 text-center text-xs font-bold">{to.Period || '-'}</td>
                                <td className="px-3 py-2 text-center text-xs">{to.TimeOnClock || '-'}</td>
                                <td className="px-3 py-2 text-xs font-bold">
                                  <span className={isHomeTO ? 'text-blue-700' : 'text-red-700'}>{teamLabel}</span>
                                </td>
                                <td className="px-3 py-2 text-center text-xs">
                                  {isHomeTO ? <span className="text-blue-700 font-bold">TO</span> : '—'}
                                </td>
                                <td className="px-3 py-2 text-center text-xs">
                                  {!isHomeTO ? <span className="text-red-700 font-bold">TO</span> : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Suspension Serving Section */}
                {gameDetails?.Roster && (() => {
                  const suspendedPlayers = (gameDetails.Roster as any[]).filter((p: any) => p.ServingSuspension);
                  if (suspendedPlayers.length === 0) return null;
                  return (
                    <div className="bg-white rounded-lg border-2 border-amber-300 overflow-hidden">
                      <div className="bg-amber-600 px-4 py-2">
                        <h4 className="font-bold text-white text-sm text-center">PLAYERS SERVING SUSPENSIONS</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-amber-50 border-b-2 border-amber-300">
                              <th className="px-3 py-2 text-center font-bold text-xs">#</th>
                              <th className="px-3 py-2 text-left font-bold text-xs">PLAYER</th>
                              <th className="px-3 py-2 text-left font-bold text-xs">TEAM</th>
                              <th className="px-3 py-2 text-left font-bold text-xs">SUSPENSION NOTE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {suspendedPlayers.map((p: any, idx: number) => {
                              const isHome = String(p.TeamId) === String(homeTeamId);
                              return (
                                <tr key={idx} className={`border-b border-amber-100 ${idx % 2 === 0 ? 'bg-amber-50/30' : 'bg-white'}`}>
                                  <td className="px-3 py-2 text-center text-xs font-bold">{p.JerseyNumber || p.PlayerNumber || '?'}</td>
                                  <td className="px-3 py-2 text-xs font-bold">{`${p.FirstName || ''} ${p.LastName || ''}`.trim()}</td>
                                  <td className="px-3 py-2 text-xs">
                                    <span className={isHome ? 'text-blue-700 font-bold' : 'text-red-700 font-bold'}>
                                      {isHome ? displayGame.homeTeam : displayGame.awayTeam}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-xs text-gray-600">{p.SuspensionNote || 'Serving suspension'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </TabsContent>
            </Tabs>
          )}

          {game.status === 'UPCOMING' && (
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 text-center">
              <p className="text-gray-700 font-semibold">
                Game details will be available once the game begins.
              </p>
            </div>
          )}

          {(game.status === 'EXHIBITION' || displayGame.status === 'EXHIBITION') && (
            <div className="bg-amber-50 rounded-lg p-6 border border-amber-300 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">🥍</span>
                <h3 className="text-lg font-black text-amber-800">Exhibition Game</h3>
              </div>
              <p className="text-amber-700 font-semibold">
                No game data is available for exhibition games. Exhibition games are not tracked in the standings or statistics.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleAddToCalendar}
              className="flex items-center gap-2 px-6 py-3 text-white font-bold text-sm rounded-lg transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(to bottom, var(--color-primary), var(--color-primary-dark))' }}
            >
              <Download className="w-4 h-4" />
              Add to Calendar
            </button>
            {displayGame.status !== 'UPCOMING' && displayGame.status !== 'EXHIBITION' && (
              <button
                onClick={handleExportPDF}
                disabled={pdfExporting}
                className="flex items-center gap-2 px-6 py-3 text-white font-bold text-sm rounded-lg transition-all hover:opacity-90 disabled:opacity-60 bg-gray-800 hover:bg-gray-700"
              >
                {pdfExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                {pdfExporting ? 'Generating...' : 'Export Game Sheet PDF'}
              </button>
            )}
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}