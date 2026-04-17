import { useState, useEffect } from 'react';
import { fetchEnhancedPlayerProfile, fetchTeams, fetchPlayerStats, fetchGameDetails, type PlayerSeasonStats, getPlayerPhotoUrl } from '../services/sportzsoft';
import { extractColorsFromImage } from '../utils/color-extractor';
import { getTeamLogo } from '../utils/team-logos';
import { getTeamColors } from '../utils/team-colors';

const GOALIE_POSITION_ID = 113;

// Known goalie position strings (lowercase for matching)
const GOALIE_POSITION_NAMES = ['goalie', 'goaltender', 'goal', 'goalkeeper'];
const GOALIE_POSITION_CODES = ['g', 'gl'];

// ============================================================================
// UNIVERSAL FIELD RESOLVER - Tries every known field name variant from the API
// ============================================================================
function resolveField(obj: any, ...fieldNames: string[]): any {
    for (const name of fieldNames) {
        if (obj[name] !== undefined && obj[name] !== null) return obj[name];
    }
    return undefined;
}

function resolveNum(obj: any, ...fieldNames: string[]): number {
    const val = resolveField(obj, ...fieldNames);
    return val !== undefined ? Number(val) || 0 : 0;
}

function resolveStr(obj: any, ...fieldNames: string[]): string {
    const val = resolveField(obj, ...fieldNames);
    return val !== undefined && val !== null ? String(val) : '';
}

// ============================================================================
// GOALIE DETECTION - Multi-signal check for whether a stat entry is goalie data
// ============================================================================
function isGoalieStatEntry(stat: any): boolean {
    // 1. Explicit SportPositionId match (set by GoalieStats tagger or already on the entry)
    if (stat.SportPositionId === GOALIE_POSITION_ID) return true;

    // 2. Check position name fields for goalie keywords
    const posName = resolveStr(stat, 'SportPositionName', 'PositionName', 'Position', 'Pos').toLowerCase().trim();
    if (posName && GOALIE_POSITION_NAMES.some(g => posName.includes(g))) return true;

    // 3. Check position code fields
    const posCode = resolveStr(stat, 'PositionCode', 'PosCode', 'SportPositionCode').toLowerCase().trim();
    if (posCode && GOALIE_POSITION_CODES.includes(posCode)) return true;

    // 4. Heuristic: ONLY fires if Saves > 0 (the one truly goalie-exclusive stat).
    // Game API per-period entries use ShotsStopped; PlayerStats bulk API uses Saves
    const saves = resolveNum(stat, 'ShotsStopped', 'Saves', 'SV', 'Svs', 'SVS', 'SaversTotal', 'SavesMade', 'TotalSaves', 'SavesTotal');
    if (saves > 0) return true;

    return false;
}

// Check if a position string indicates goalie
function isGoaliePosition(positionStr: string): boolean {
    if (!positionStr) return false;
    const lower = positionStr.toLowerCase().trim();
    return GOALIE_POSITION_NAMES.some(g => lower.includes(g)) || GOALIE_POSITION_CODES.includes(lower);
}

// ============================================================================
// EXPORTED INTERFACES
// ============================================================================
export interface GameLogEntry {
    gameId: number;
    gameNumber?: string;
    seasonId?: number;
    date: string;
    gameInfo?: string; 
    opponent: string;
    opponentId?: number;
    homeAway: string;
    result: string;
    score: string;
    goals: number;
    assists: number;
    points: number;
    pim: number;
    ppg?: number;
    shg?: number;
    gwg?: number;
    shots?: number;
    plusMinus?: number;
    
    // Goalie specific
    saves?: number;
    goalsAgainst?: number;
    shotsAgainst?: number;
    minutes?: number;
    decision?: string;
    shutout?: boolean;
}

export interface PenaltyLogEntry {
    date: string;
    seasonId?: number;
    gameId?: number;
    gameNumber?: string;
    opponent?: string;
    offense: string;
    minutes: number;
    period: string;
    time: string;
    timeOut?: string;
    pp?: boolean; // Was it a power play situation
}

export interface AggregatedSeasonStats {
    seasonId: number;
    teamId: number;
    seasonName: string;
    teamName: string;
    divisionName: string;
    stats: {
        regular?: PlayerSeasonStats;
        playoffs?: PlayerSeasonStats;
        exhibition?: PlayerSeasonStats;
        provincials?: PlayerSeasonStats;
    }
}

// Career totals type (reused for combined, player-only, and goalie-only)
export interface CareerTotals {
    gamesPlayed: number;
    gamesDressed: number;
    goals: number;
    assists: number;
    points: number;
    pim: number;
    ppg: number;
    shg: number;
    gwg: number;
    shots: number;
    plusMinus: number;
    wins: number;
    losses: number;
    ties: number;
    otLosses: number;
    goalsAgainst: number;
    saves: number;
    shutouts: number;
    minutes: number;
    shotsAgainst: number;
}

export interface PlayerProfile {
  playerId: number;
  name: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  teamLogoUrl?: string;
  
  hometown: string;
  homeProvStateCd: string;
  birthDate?: string;
  birthYear?: number;
  height?: string;
  weight?: string;
  shoots?: string;
  position?: string;
  
  // Current Team Data
  currentTeamColors?: {
      primary: string;
      secondary: string;
      tertiary: string;
  };
  
  // Grouped stats
  seasons: PlayerSeasonStats[];
  
  // Aggregated by Season (combining Regular/Playoffs/etc)
  aggregatedSeasons: AggregatedSeasonStats[];

  // Game Log
  gameLog: GameLogEntry[];

  // Penalty Log
  penaltyLog: PenaltyLogEntry[];
  
  // Aggregate totals (combined across all roles)
  career: CareerTotals;
  
  // Role-separated career totals and season breakdowns
  playerCareer: CareerTotals;
  goalieCareer: CareerTotals;
  playerAggregatedSeasons: AggregatedSeasonStats[];
  goalieAggregatedSeasons: AggregatedSeasonStats[];
  
  // Extended Bio
  age?: number;
  birthDateFull?: string;
  
  mostRecentTeam?: string;
  mostRecentTeamId?: number;
  mostRecentJersey?: string;
  mostRecentPosition?: string;
  divisionName?: string;
  
  // Helpers
  hasGoalieStats: boolean;
  hasPlayerStats: boolean;
  primaryRole: 'goalie' | 'player';
  activeSeasonId?: number;
  
  // League Context (Mixed from bulk API)
  leagueRank?: number;
  leagueContext?: string;
}

// ============================================================================
// TEAM NAME FALLBACK CHAIN
// ============================================================================
function resolveTeamName(stat: any): string {
    // Prefer TeamShortName (clean, no division prefix) over FullTeamName (includes division like "U15 Tier 1 - Calgary Mountaineers")
    return resolveStr(stat, 'TeamShortName', 'TeamName', 'Team', 'PlayingWithTeam', 'ClubName', 'Club', 'TeamCode', 'TeamAbbr', 'TeamAbbrv', 'TeamAbbreviation', 'FullTeamName') || 'Unknown Team';
}

// ============================================================================
// CLEAN SEASON NAME (Strip game type suffixes, IDs, etc.)
// ============================================================================
function cleanSeasonName(raw: string): string {
    if (!raw) return '';
    let clean = raw
        .replace(/\s*-\s*Playoffs?/i, '')
        .replace(/\s*Playoffs?/i, '')
        .replace(/Playodd/i, '')
        .replace(/\s*-\s*Exhibition/i, '')
        .replace(/\s*Exhibition/i, '')
        .replace(/\s*-?\s*Regular\s*Season/i, '')
        .replace(/\s*-?\s*Provincials?/i, '')
        .replace(/\s*\(\d+\)\s*/g, '') // Remove "(7235)" style IDs
        .replace(/\s*#\d+\s*/g, '') // Remove "#7235" style IDs
        .trim();
    // Remove trailing dash if cleaning left one
    clean = clean.replace(/\s*-\s*$/, '').trim();
    return clean || raw;
}

// ============================================================================
// GAME LOG ENTRY BUILDER - Exhaustive field mapping
// ============================================================================
function buildGameLogEntry(g: any, targetSeasonId?: number): GameLogEntry {
    // ---- Game ID & Date ----
    const gameId = resolveNum(g, 'GameId', 'GameID', 'Id', 'ID');
    const gameNumber = resolveStr(g, 'GameNumber', 'GameNo', 'GameNum');
    const date = resolveStr(g, 'GameDate', 'Date', 'GameDt', 'Dt', 'ScheduleDate');
    
    // ---- Opponent Detection (Cross-reference HomeTeam/VisitorTeam) ----
    const playerTeamId = resolveNum(g, 'TeamId', 'TeamID', 'PlayerTeamId');
    const homeTeamId = resolveNum(g, 'HomeTeamId', 'HomeTeamID', 'HomeId');
    const visitorTeamId = resolveNum(g, 'VisitorTeamId', 'VisitorTeamID', 'AwayTeamId', 'AwayTeamID', 'VisitorId');
    
    const homeTeamName = resolveStr(g, 'HomeTeamName', 'HomeTeam', 'HomeClub', 'HomeTeamClub');
    const visitorTeamName = resolveStr(g, 'VisitorTeamName', 'VisitorTeam', 'AwayTeamName', 'AwayTeam', 'VisitorClub', 'VisitorTeamClub', 'AwayClub');
    
    // Direct opponent fields - API uses OpposingTeam, PlayingWithTeam
    let opponent = resolveStr(g, 'OpposingTeam', 'OpponentName', 'Opponent', 'OpponentTeam', 'OppTeam', 'OppTeamName', 'OpponentClub');
    
    // Cross-reference if opponent not directly available
    if (!opponent || opponent === 'Unknown') {
        const isHome = playerTeamId === homeTeamId || resolveField(g, 'IsHome', 'IsHomeTeam', 'HomeFlag') === true;
        const isAway = playerTeamId === visitorTeamId;
        
        if (isHome && visitorTeamName) {
            opponent = visitorTeamName;
        } else if (isAway && homeTeamName) {
            opponent = homeTeamName;
        } else if (homeTeamName && visitorTeamName) {
            // If we know both teams but not which is the player's, try matching
            opponent = homeTeamName || visitorTeamName;
        }
    }
    if (!opponent) opponent = 'Unknown';
    
    // ---- Home/Away Detection ----
    let homeAway = resolveStr(g, 'HomeAway', 'HomeAwayCode', 'HA');
    if (!homeAway) {
        const isHome = resolveField(g, 'IsHome', 'IsHomeTeam', 'HomeFlag');
        if (isHome === true || isHome === 1 || isHome === 'Y') homeAway = 'Home';
        else if (isHome === false || isHome === 0 || isHome === 'N') homeAway = 'Away';
        else if (playerTeamId && homeTeamId && playerTeamId === homeTeamId) homeAway = 'Home';
        else if (playerTeamId && visitorTeamId && playerTeamId === visitorTeamId) homeAway = 'Away';
        else homeAway = '-';
    }
    
    // ---- Score & Result ----
    // API returns GameScoreInfo with combined info like "W 5-3", "L 2-4", "T 3-3", or just "5-3"
    const gameScoreInfo = resolveStr(g, 'GameScoreInfo', 'Score', 'FinalScore');
    let score = '-';
    let result = resolveStr(g, 'Result', 'GameResult', 'WinLoss', 'WL');
    
    if (gameScoreInfo) {
        const trimmed = gameScoreInfo.trim();
        // Check for W/L/T prefix like "W 5-3"
        const prefixMatch = trimmed.match(/^([WLT])\s+(.+)$/i);
        if (prefixMatch) {
            if (!result) result = prefixMatch[1].toUpperCase();
            score = prefixMatch[2].trim();
        } else {
            score = trimmed;
        }
        // Try to derive result from score numbers if still missing
        if (!result && score.includes('-')) {
            const parts = score.split('-').map(s => parseInt(s.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                if (parts[0] === parts[1]) result = 'T';
            }
        }
    }
    
    // Fallback: try separate score fields
    if (score === '-') {
        const homeScore = resolveField(g, 'HomeScore', 'HomeGoals', 'HomeTeamScore');
        const visitorScore = resolveField(g, 'VisitorScore', 'VisitorGoals', 'AwayScore', 'AwayGoals');
        if (homeScore !== undefined && visitorScore !== undefined) {
            score = `${homeScore}-${visitorScore}`;
        }
    }
    if (!result) result = '-';
    
    // ---- Player Stats for this game ----
    // API uses: Goals, Assists, Points, PenaltyMin, PPGoals, SHGoals (may be null for 0 values)
    const goals = resolveNum(g, 'Goals', 'G', 'GoalsScored');
    const assists = resolveNum(g, 'Assists', 'A', 'AssistsTotal');
    const points = resolveNum(g, 'Points', 'Pts', 'TotalPoints') || (goals + assists);
    const pim = resolveNum(g, 'PenaltyMin', 'PenaltyMinutes', 'PIM', 'PenMin', 'Penalties', 'PenMins');
    const ppg = resolveNum(g, 'PPGoals', 'PowerPlayGoals', 'PPG', 'PP');
    const shg = resolveNum(g, 'SHGoals', 'ShortHandedGoals', 'SHG', 'SH');
    const gwg = resolveNum(g, 'GameWinningGoals', 'GWG');
    const shots = resolveNum(g, 'Shots', 'SOG', 'ShotsOnGoal');
    const plusMinus = resolveNum(g, 'PlusMinus', 'PM', 'Plus_Minus');
    
    // ---- Goalie Stats for this game ----
    // Game API per-period entries use ShotsStopped (saves) and TotalShots (shots against)
    const saves = resolveNum(g, 'ShotsStopped', 'Saves', 'SV', 'Svs', 'SVS', 'SaversTotal', 'SavesMade', 'TotalSaves', 'SavesTotal');
    const goalsAgainst = resolveNum(g, 'GoalsAgainst', 'GA', 'GATotal');
    // Don't use 'ShotsOnGoal' or 'SOG' here — those are the SKATER's shots, not shots against the goalie
    const shotsAgainst = resolveNum(g, 'TotalShots', 'ShotsAgainst', 'SA', 'ShotsTotal', 'ShotAgainst', 'ShotsReceived') || (saves + goalsAgainst);
    const minutes = resolveNum(g, 'MinutesPlayed', 'Min', 'Minutes', 'TOI', 'TimeOnIce', 'Mins', 'MP', 'TotalMinutes');
    const decision = resolveStr(g, 'Decision', 'Dec', 'GoalieDecision');
    const shutout = resolveField(g, 'Shutout', 'ShutOut', 'SO') === true || resolveField(g, 'Shutout', 'ShutOut', 'SO') === 1;
    
    return {
        gameId,
        gameNumber: gameNumber || undefined,
        date,
        opponent,
        opponentId: resolveNum(g, 'OpponentTeamId', 'OppTeamId') || undefined,
        homeAway,
        result,
        score,
        goals,
        assists,
        points,
        pim,
        ppg,
        shg,
        gwg,
        shots,
        plusMinus,
        saves: saves || undefined,
        goalsAgainst: goalsAgainst || undefined,
        shotsAgainst: shotsAgainst || undefined,
        minutes: minutes || undefined,
        decision: decision || undefined,
        shutout: shutout || undefined,
        seasonId: targetSeasonId,
        gameInfo: resolveStr(g, 'GameInfo') || (gameNumber ? `Game ${gameNumber}` : undefined)
    };
}

// ============================================================================
// PENALTY LOG ENTRY BUILDER - Exhaustive field mapping (11+ field name variants)
// ============================================================================
function buildPenaltyLogEntry(p: any, targetSeasonId?: number): PenaltyLogEntry {
    const date = resolveStr(p, 'GameDate', 'Date', 'GameDt', 'Dt', 'PenaltyDate');
    const gameId = resolveNum(p, 'GameId', 'GameID', 'Id');
    const gameNumber = resolveStr(p, 'GameNumber', 'GameNo');
    
    // Opponent - API penalty entries don't have opponent; will be enriched later from game log
    let opponent = resolveStr(p, 'OpposingTeam', 'OpponentName', 'Opponent', 'OpponentTeam', 'OppTeam', 'OppTeamName');
    
    // Offense/Infraction name - API uses PenaltyName
    const offense = resolveStr(p, 
        'PenaltyName', 'OffenseName', 'Offense', 'Penalty', 'PenaltyType', 
        'PenaltyDescription', 'InfractionName', 'Infraction', 'OffenseDescription',
        'PenaltyCode', 'OffenseCode', 'Description'
    ) || 'Penalty';
    
    // Minor/Major indicator
    const minorMajor = resolveStr(p, 'MinorMajor', 'PenaltyClass', 'Type');
    
    // Minutes - API uses PenaltyMin
    const minutes = resolveNum(p, 
        'PenaltyMin', 'PenaltyMinutes', 'Minutes', 'Min', 'PIM', 'PenMin',
        'Duration', 'Mins', 'PenMins', 'TotalMinutes'
    );
    
    // Period
    const period = resolveStr(p, 
        'Period', 'PeriodNo', 'PeriodNumber', 'Per', 'Pd', 'PeriodId',
        'PeriodName', 'PeriodDesc'
    ) || '-';
    
    // Start time - API uses TimeIn
    const time = resolveStr(p, 
        'TimeIn', 'TimeOff', 'Time', 'Start', 'StartTime', 'PenaltyTime', 
        'InfractionTime', 'OffenseTime', 'TimePenalty', 'PenTime', 
        'GameTime', 'ClockTime', 'TimeOfPenalty', 'PenaltyStart'
    ) || '-';
    
    // End time - API uses TimeOut
    const timeOut = resolveStr(p, 
        'TimeOut', 'TimeOn', 'End', 'EndTime', 'TimeServed', 'ReleaseTime', 
        'ExpiryTime', 'PenaltyEnd', 'EndOfPenalty', 'TimeReturn',
        'TimeBack', 'ReturnTime', 'PenaltyExpiry', 'ExpireTime'
    ) || '-';
    
    const pp = resolveField(p, 'PowerPlay', 'PP', 'IsPowerPlay') === true;
    
    return {
        date,
        gameId: gameId || undefined,
        gameNumber: gameNumber || undefined,
        opponent: opponent || undefined,
        offense,
        minutes,
        period,
        time,
        timeOut,
        seasonId: targetSeasonId,
        pp: pp || undefined
    };
}

// ============================================================================
// MAIN HOOK
// ============================================================================
export function usePlayerProfile(playerId: number, teamId?: number, seasonId?: number, fallbackPhotoDocId?: number, isGoalieHint?: boolean) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!playerId) return;

    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      try {

        
        // ================================================================
        // STEP 1: Fetch ALL data in ONE call with full ChildCodes=HSYPG
        // No StatsFilterSeasonId = gets ALL career data
        // ================================================================
        const fullResp = await fetchEnhancedPlayerProfile(playerId, undefined, 'HSYPG');
        
        if (!fullResp.Success) {
            throw new Error(fullResp.Response?.toString() || 'Failed to fetch player data');
        }

        const r: any = fullResp.Response;
        const playerObj = r.Player || r;
        
        // ================================================================
        // CRITICAL: Extract PersonId from the player profile.
        // The API distinguishes PlayerId (registration-level) from PersonId
        // (person-level). Game API GoalieStats use PersonId for matching,
        // NOT PlayerId. We must resolve PersonId early for use in Step 3.5.
        // ================================================================
        const playerPersonId = resolveNum(playerObj, 'PersonId', 'PersonID', 'MemberId', 'MemberID') || playerId;

        
        // Also try to get PersonId from GoalieStats entries (G child code)
        // since they may have PersonId even if the player object doesn't
        let goaliePersonId = playerPersonId;
        const goalieStatsArrForId = playerObj.GoalieStats;
        if (Array.isArray(goalieStatsArrForId) && goalieStatsArrForId.length > 0) {
            const gPersonId = resolveNum(goalieStatsArrForId[0], 'PersonId', 'PersonID');
            if (gPersonId > 0) {
                goaliePersonId = gPersonId;

            }
        }
        
        // Also try PlayerStats entries for PersonId
        const playerStatsArrForId = playerObj.PlayerStats || playerObj.Stats || playerObj.SeasonStats;
        if (Array.isArray(playerStatsArrForId) && playerStatsArrForId.length > 0) {
            const pPersonId = resolveNum(playerStatsArrForId[0], 'PersonId', 'PersonID');
            if (pPersonId > 0 && pPersonId !== playerId && pPersonId !== playerPersonId) {
                goaliePersonId = goaliePersonId || pPersonId; // Use as fallback

            }
        }
        
        // Also try GamesPlayedStats entries for PersonId
        const gamesPlayedForId = playerObj.GamesPlayedStats || playerObj.PlayerGamesPlayedStats;
        if (Array.isArray(gamesPlayedForId) && gamesPlayedForId.length > 0) {
            const gpPersonId = resolveNum(gamesPlayedForId[0], 'PersonId', 'PersonID');
            if (gpPersonId > 0) {

                if (gpPersonId !== playerId && gpPersonId !== playerPersonId) {
                    goaliePersonId = gpPersonId;
                }
            }
        }
        
        // Build a set of all known IDs for this player for flexible matching
        const playerIdSet = new Set<number>([playerId, playerPersonId, goaliePersonId].filter(id => id > 0));

        
        // ================================================================
        // STEP 2: Parse Career Stats from P (PlayerStats) and G (GoalieStats)
        // ================================================================
        let allStats: PlayerSeasonStats[] = [];
        
        // PlayerStats (P) - Per-season aggregate stats for skaters
        const playerStatsArr = playerObj.PlayerStats || playerObj.Stats || playerObj.SeasonStats;
        if (Array.isArray(playerStatsArr)) {

            allStats = [...playerStatsArr];
        }
        
        // GoalieStats (G) - Per-season aggregate stats for goalies
        const goalieStatsArr = playerObj.GoalieStats;
        if (Array.isArray(goalieStatsArr)) {

            const gStats = goalieStatsArr.map((g: any) => ({ ...g, SportPositionId: GOALIE_POSITION_ID }));
            allStats.push(...gStats);
        }
        
        // Also try ScoringStats (S) as a fallback if no PlayerStats exist
        if (allStats.length === 0) {
            const scoringStatsArr = playerObj.ScoringStats || playerObj.PlayerScoringStats || playerObj.Scoring;
            if (Array.isArray(scoringStatsArr) && scoringStatsArr.length > 0) {

                allStats = [...scoringStatsArr];
            }
        }
        
        // Sort by SeasonId desc
        allStats.sort((a, b) => Number(b.SeasonId || 0) - Number(a.SeasonId || 0));
        
        // ================================================================
        // STEP 2.5: SUPPLEMENTAL GOALIE STATS FETCH
        // The G child code returns GoalieStats entries with basic fields
        // (GP, G, A, PTS, PIM, SeasonId, TeamId, DivisionId) but NOT the
        // actual goalie metrics (Saves, GA, MIN, SOG, GAA, SV%).
        // Those only come from the /PlayerStats endpoint — the same source
        // the league leaders page uses. We fetch per-division and merge.
        // ================================================================
        if (Array.isArray(goalieStatsArr) && goalieStatsArr.length > 0) {

            
            const pid = Number(playerId);
            
            // Build unique (seasonId, divisionId) pairs from GoalieStats entries
            const pairsToFetch: { seasonId: number; divisionId?: number; teamId?: number }[] = [];
            const seenKeys = new Set<string>();
            for (const g of goalieStatsArr) {
                const sId = g.SeasonId;
                if (!sId) continue;
                const dId = g.DivisionId || undefined;
                const tId = g.TeamId || teamId || undefined;
                const key = `${sId}-${dId || 'none'}`;
                if (seenKeys.has(key)) continue;
                seenKeys.add(key);
                pairsToFetch.push({ seasonId: sId, divisionId: dId, teamId: tId });
            }
            // Sort by seasonId desc and limit to 8 most recent
            pairsToFetch.sort((a, b) => b.seasonId - a.seasonId);
            const limitedPairs = pairsToFetch.slice(0, 8);

            
            try {
                // Fetch in batches of 3 concurrent
                const allGoalieEntries: any[] = [];
                for (let i = 0; i < limitedPairs.length; i += 3) {
                    const batch = limitedPairs.slice(i, i + 3);
                    const results = await Promise.all(
                        batch.map(pair => {
                            const opts: any = { seasonId: pair.seasonId, goaliesOnly: true, limiterCode: 'BI' };
                            if (pair.divisionId) opts.divisionId = pair.divisionId;
                            return fetchPlayerStats(opts).catch(err => {
                                console.warn(`[usePlayerProfile] GOALIE SUPPLEMENT: Error S${pair.seasonId}/D${pair.divisionId}:`, err?.message || err);
                                return null;
                            });
                        })
                    );
                    
                    results.forEach((resp, idx) => {
                        if (!resp?.Success) return;
                        const entries = Array.isArray(resp.Response) ? resp.Response : [];
                        // Match by any known ID (PlayerId, PersonId, etc.)
                        const matches = entries.filter((e: any) => {
                            const ePlayerId = Number(e.PlayerId);
                            const ePersonId = Number(e.PersonId);
                            const eMemberId = Number(e.MemberId);
                            const eMemberPlayerId = Number(e.MemberPlayerId);
                            return playerIdSet.has(ePlayerId) || playerIdSet.has(ePersonId) ||
                                playerIdSet.has(eMemberId) || playerIdSet.has(eMemberPlayerId);
                        });
                        if (matches.length > 0) {

                            if (allGoalieEntries.length === 0 && matches[0]) {

                            }
                            allGoalieEntries.push(...matches);
                        }
                    });
                }
                

                
                if (allGoalieEntries.length > 0) {
                    // Build lookup: seasonId+teamId+standingCode → goalie entry
                    const goalieDataMap = new Map<string, any>();
                    allGoalieEntries.forEach((g: any) => {
                        const sId = g.SeasonId;
                        const tId = g.TeamId;
                        const standing = resolveStr(g, 'StandingCategoryCode', 'StandingCode', 'CategoryCode').toLowerCase();
                        goalieDataMap.set(`${sId}-${tId}-${standing}`, g);
                        if (!goalieDataMap.has(`${sId}-${tId}-`)) goalieDataMap.set(`${sId}-${tId}-`, g);
                    });
                    
                    // Merge goalie-specific fields into allStats entries
                    let mergedCount = 0;
                    allStats.forEach(stat => {
                        if (!isGoalieStatEntry(stat) && stat.SportPositionId !== GOALIE_POSITION_ID) return;
                        const sId = stat.SeasonId;
                        const tId = stat.TeamId;
                        const standing = resolveStr(stat, 'StandingCategoryCode', 'StandingCode', 'CategoryCode').toLowerCase();
                        const goalieData = goalieDataMap.get(`${sId}-${tId}-${standing}`) || goalieDataMap.get(`${sId}-${tId}-`);
                        
                        if (goalieData) {
                            const fieldsToMerge = [
                                'Saves', 'SV', 'Svs', 'GoalsAgainst', 'GA',
                                'ShotsAgainst', 'SA', 'MinutesPlayed', 'Min', 'Minutes', 'MP',
                                'Wins', 'W', 'Losses', 'L', 'Ties', 'T',
                                'OvertimeLosses', 'OTL', 'Shutouts', 'SO',
                                'GamesDressed', 'GD', 'GoalsAgainstAverage', 'GAA',
                                'SavePercentage', 'SavePct', 'SvPct',
                            ];
                            fieldsToMerge.forEach(field => {
                                if (goalieData[field] !== undefined && goalieData[field] !== null) {
                                    if (stat[field] === undefined || stat[field] === null || stat[field] === 0) {
                                        stat[field] = goalieData[field];
                                    }
                                }
                            });
                            mergedCount++;
                        }
                    });

                }
            } catch (e: any) {
                console.warn('[usePlayerProfile] GOALIE SUPPLEMENT failed (non-fatal):', e?.message || e);
            }
        } else {

        }
        
        // Post-merge summary: verify goalie fields are present after Step 2.5 supplemental merge
        if (allStats.length > 0) {
            const goalieEntries = allStats.filter(s => isGoalieStatEntry(s));
            if (goalieEntries.length > 0) {
                const sample = goalieEntries[0];
                const goalieFields = ['Saves', 'GoalsAgainst', 'GA', 'ShotsAgainst', 'SA', 'MinutesPlayed', 'Min', 'Minutes',
                    'Wins', 'W', 'Losses', 'L', 'Shutouts', 'SO', 'GamesDressed', 'GD', 'GoalsAgainstAverage', 'GAA', 'SavePercentage', 'SavePct'];
                const present = goalieFields.filter(f => sample[f] !== undefined && sample[f] !== null && sample[f] !== 0);

            } else {

            }
        }
        
        // Determine most relevant season ID for logs
        let targetSeasonId = seasonId;
        if (!targetSeasonId && allStats.length > 0) {
            targetSeasonId = allStats[0].SeasonId;
        }
        
        // ================================================================
        // STEP 3: Parse Game Log from H (GamesPlayedStats) - from full response
        // ================================================================
        let allGameLogs: GameLogEntry[] = [];
        const rawGameLog = playerObj.GamesPlayedStats || playerObj.PlayerGamesPlayedStats || playerObj.GamesPlayed;
        if (Array.isArray(rawGameLog) && rawGameLog.length > 0) {

            
            // Log basic game log info (goalie-specific fields come from Step 3.5 enrichment, not raw H data)
            if (rawGameLog[0]) {
                const g = rawGameLog[0];
                const posCode = resolveStr(g, 'PositionCode', 'PosCode');
                const posName = resolveStr(g, 'SportPositionName', 'PositionName');

            }
            
            allGameLogs = rawGameLog.map((g: any) => buildGameLogEntry(g, resolveNum(g, 'SeasonId') || targetSeasonId));
        }
        
        // ================================================================
        // STEP 3.5: Enrich goalie game logs with per-game stats from Game API
        // The H (GamesPlayedStats) child code returns basic game info (date,
        // opponent, score) but NO goalie-specific stats (saves, GA, minutes).
        // For goalies, we fetch each game's details via /Game/{id}?ChildCodes=G
        // and extract the goalie stats by matching PlayerId.
        // ================================================================
        if (allGameLogs.length > 0) {
            // Detect goalie from raw game log entries (PositionCode: "GL", SportPositionName: "Goalie")
            const isGoalieFromGameLog = Array.isArray(rawGameLog) && rawGameLog.some((g: any) => {
                const posCode = resolveStr(g, 'PositionCode', 'PosCode', 'Pos').toUpperCase();
                const posName = resolveStr(g, 'SportPositionName', 'PositionName', 'Position');
                return posCode === 'GL' || posCode === 'G' || (posName && isGoaliePosition(posName));
            });
            
            // Also check the isGoalie nav param AND whether we have goalie stat entries from Step 2
            const isGoalieFromNav = isGoalieHint === true;
            const hasGoalieEntries = allStats.some(s => isGoalieStatEntry(s));
            

            
            if (isGoalieFromGameLog || isGoalieFromNav || hasGoalieEntries) {

                
                const gameIds = allGameLogs.map(g => g.gameId).filter(id => id > 0);
                
                // Fetch game details in batches of 5 to avoid overwhelming the API
                const BATCH_SIZE = 5;
                const gameGoalieStatsMap = new Map<number, any>();
                
                for (let i = 0; i < gameIds.length; i += BATCH_SIZE) {
                    const batch = gameIds.slice(i, i + BATCH_SIZE);
                    const results = await Promise.allSettled(
                        batch.map(gid => fetchGameDetails(gid, 'G', 'B'))
                    );
                    
                    results.forEach((result, idx) => {
                        const gid = batch[idx];
                        if (result.status === 'fulfilled' && result.value?.Success) {
                            const gameResp = result.value.Response;
                            const gameObj = gameResp?.Game || gameResp;
                            
                            // Diagnostic: log structure of first game response
                            if (i === 0 && idx === 0) {

                                const goalieArrDiag = gameObj?.GoalieStats || gameObj?.GoalieBoxscore || gameObj?.Goalies ||
                                                      gameResp?.GoalieStats || gameResp?.GoalieBoxscore || gameResp?.Goalies;
                                if (Array.isArray(goalieArrDiag) && goalieArrDiag.length > 0) {

                                } else {

                                    // Look for any array that might contain goalie data
                                    for (const [k, v] of Object.entries(gameObj || {})) {
                                        if (Array.isArray(v) && v.length > 0) {

                                        }
                                    }
                                    // Also check top-level response
                                    if (gameResp !== gameObj) {
                                        for (const [k, v] of Object.entries(gameResp || {})) {
                                            if (Array.isArray(v) && v.length > 0) {

                                            }
                                        }
                                    }
                                }

                            }
                            
                            // Find goalie stats for this player
                            // Game API GoalieStats uses PersonId (not PlayerId) and has
                            // one entry PER PERIOD per goalie. We need to:
                            // 1. Match by PersonId OR PlayerId using our full ID set
                            // 2. Aggregate all period entries into one per-game summary
                            // GoalieStats may be nested in Game object or at top level of response
                            const goalieArr = gameObj?.GoalieStats || gameObj?.GoalieBoxscore || gameObj?.Goalies || 
                                              gameResp?.GoalieStats || gameResp?.GoalieBoxscore || gameResp?.Goalies || [];
                            if (Array.isArray(goalieArr)) {
                                // Diagnostic: log all PersonIds in first game's GoalieStats
                                if (i === 0 && idx === 0 && goalieArr.length > 0) {
                                    const allIds = goalieArr.map((gs: any) => `PersonId=${gs.PersonId},PlayerId=${gs.PlayerId}`);

                                }
                                const myEntries = goalieArr.filter((gs: any) => {
                                    const gsPersonId = resolveNum(gs, 'PersonId', 'PersonID');
                                    const gsPlayerId = resolveNum(gs, 'PlayerId', 'PlayerID', 'Id');
                                    return playerIdSet.has(gsPersonId) || playerIdSet.has(gsPlayerId);
                                });
                                if (myEntries.length > 0) {
                                    // Aggregate across periods:
                                    // ShotsStopped = saves per period, TotalShots = shots faced per period
                                    const aggregated: any = { _periodCount: myEntries.length };
                                    let totalSaves = 0, totalShots = 0;
                                    myEntries.forEach((pe: any) => {
                                        totalSaves += resolveNum(pe, 'ShotsStopped', 'Saves', 'SV', 'Svs', 'SVS', 'SavesMade');
                                        totalShots += resolveNum(pe, 'TotalShots', 'ShotsAgainst', 'SA', 'ShotsTotal');
                                    });
                                    aggregated.ShotsStopped = totalSaves;
                                    aggregated.TotalShots = totalShots;
                                    aggregated.GoalsAgainst = totalShots - totalSaves;
                                    // Copy non-aggregatable fields from first entry
                                    const first = myEntries[0];
                                    aggregated.MinutesPlayed = resolveNum(first, 'MinutesPlayed', 'Min', 'Minutes', 'TOI', 'TimeOnIce');
                                    aggregated.Decision = resolveStr(first, 'Decision', 'Dec', 'GoalieDecision');
                                    aggregated.Shutout = resolveField(first, 'Shutout', 'ShutOut');
                                    aggregated.Wins = resolveNum(first, 'Wins', 'Win', 'W');
                                    aggregated.Losses = resolveNum(first, 'Losses', 'Loss', 'L');
                                    gameGoalieStatsMap.set(gid, aggregated);
                                }
                            }
                        } else if (result.status === 'rejected') {
                            console.warn(`[usePlayerProfile] Failed to fetch game ${gid}:`, result.reason);
                        }
                    });
                }
                

                
                // Diagnostic: log what fields we got from the first matched game
                if (gameGoalieStatsMap.size > 0) {
                    const firstEntry = gameGoalieStatsMap.values().next().value;

                }
                
                // Merge goalie stats into game log entries
                // The aggregated entries use ShotsStopped (saves), TotalShots (shots against),
                // and GoalsAgainst (derived as TotalShots - ShotsStopped)
                let enrichedCount = 0;
                allGameLogs = allGameLogs.map(entry => {
                    if (!entry.gameId || !gameGoalieStatsMap.has(entry.gameId)) return entry;
                    
                    const gs = gameGoalieStatsMap.get(entry.gameId)!;
                    const saves = resolveNum(gs, 'ShotsStopped', 'Saves', 'SV', 'Svs', 'SVS', 'SavesMade', 'TotalSaves');
                    const goalsAgainst = resolveNum(gs, 'GoalsAgainst', 'GA', 'GATotal');
                    const shotsAgainst = resolveNum(gs, 'TotalShots', 'ShotsAgainst', 'SA', 'ShotsTotal') || (saves + goalsAgainst);
                    const minutes = resolveNum(gs, 'MinutesPlayed', 'Min', 'Minutes', 'TOI', 'TimeOnIce', 'Mins', 'MP', 'TotalMinutes');
                    const decision = resolveStr(gs, 'Decision', 'Dec', 'GoalieDecision');
                    const shutoutVal = resolveField(gs, 'Shutout', 'ShutOut', 'SO');
                    const shutout = shutoutVal === true || shutoutVal === 1 || goalsAgainst === 0;
                    
                    // Derive decision from game result if not provided by API
                    let derivedDecision = decision;
                    if (!derivedDecision && entry.result) {
                        if (entry.result === 'W') derivedDecision = 'W';
                        else if (entry.result === 'L') derivedDecision = 'L';
                        else if (entry.result === 'T') derivedDecision = 'T';
                    }
                    
                    enrichedCount++;
                    return {
                        ...entry,
                        saves: saves || entry.saves,
                        goalsAgainst: goalsAgainst !== undefined ? goalsAgainst : entry.goalsAgainst,
                        shotsAgainst: shotsAgainst || entry.shotsAgainst,
                        minutes: minutes || entry.minutes,
                        decision: derivedDecision || entry.decision,
                        shutout: shutout || entry.shutout,
                    };
                });
                

            }
        }
        
        // ================================================================
        // STEP 4: Parse Penalty Log from Y (PenaltyStats) - from full response
        // ================================================================
        let allPenaltyLogs: PenaltyLogEntry[] = [];
        const rawPenaltyLog = playerObj.PenaltyStats || playerObj.PlayerPenaltyStats || playerObj.Penalties;
        if (Array.isArray(rawPenaltyLog) && rawPenaltyLog.length > 0) {

            allPenaltyLogs = rawPenaltyLog.map((p: any) => buildPenaltyLogEntry(p, resolveNum(p, 'SeasonId') || targetSeasonId));
        }
        
        // ================================================================
        // STEP 5: If no logs in full response AND we have a targetSeasonId,
        //         try a season-filtered call for logs
        // ================================================================
        if (targetSeasonId && (allGameLogs.length === 0 || allPenaltyLogs.length === 0)) {
            try {

                const logResp = await fetchEnhancedPlayerProfile(playerId, targetSeasonId, 'HY');
                if (logResp.Success) {
                    const logObj = logResp.Response?.Player || logResp.Response;
                    
                    // Log keys for debugging

                    
                    if (allGameLogs.length === 0) {
                        const seasonGameLog = logObj.GamesPlayedStats || logObj.PlayerGamesPlayedStats || logObj.GamesPlayed;
                        if (Array.isArray(seasonGameLog) && seasonGameLog.length > 0) {


                            allGameLogs = seasonGameLog.map((g: any) => buildGameLogEntry(g, targetSeasonId));
                        }
                    }
                    
                    if (allPenaltyLogs.length === 0) {
                        const seasonPenaltyLog = logObj.PenaltyStats || logObj.PlayerPenaltyStats || logObj.Penalties;
                        if (Array.isArray(seasonPenaltyLog) && seasonPenaltyLog.length > 0) {


                            allPenaltyLogs = seasonPenaltyLog.map((p: any) => buildPenaltyLogEntry(p, targetSeasonId));
                        }
                    }
                }
            } catch (e) {
                console.warn('[usePlayerProfile] Failed to fetch season-filtered logs:', e);
            }
            
            // If season-filtered fetch produced new game logs for a goalie, enrich them too
            // The enrichment in Step 3.5 didn't run (allGameLogs was empty then),
            // so run it now for the season-filtered game logs
            if (isGoalieHint && allGameLogs.length > 0 && !allGameLogs.some(g => g.saves || g.goalsAgainst || g.minutes)) {

                const gameIds = allGameLogs.map(g => g.gameId).filter(id => id > 0);
                const BATCH_SIZE = 5;
                const gameGoalieStatsMap = new Map<number, any>();
                
                for (let i = 0; i < gameIds.length; i += BATCH_SIZE) {
                    const batch = gameIds.slice(i, i + BATCH_SIZE);
                    const results = await Promise.allSettled(
                        batch.map(gid => fetchGameDetails(gid, 'G', 'B'))
                    );
                    results.forEach((result, idx) => {
                        const gid = batch[idx];
                        if (result.status === 'fulfilled' && result.value?.Success) {
                            const gameResp2 = result.value.Response;
                            const gameObj = gameResp2?.Game || gameResp2;
                            const goalieArr = gameObj?.GoalieStats || gameObj?.GoalieBoxscore || gameObj?.Goalies ||
                                              gameResp2?.GoalieStats || gameResp2?.GoalieBoxscore || gameResp2?.Goalies || [];
                            if (Array.isArray(goalieArr)) {
                                // Match by PersonId or PlayerId using full ID set, aggregate per-period entries
                                const myEntries = goalieArr.filter((gs: any) => {
                                    const gsPersonId = resolveNum(gs, 'PersonId', 'PersonID');
                                    const gsPlayerId = resolveNum(gs, 'PlayerId', 'PlayerID', 'Id');
                                    return playerIdSet.has(gsPersonId) || playerIdSet.has(gsPlayerId);
                                });
                                if (myEntries.length > 0) {
                                    const aggregated: any = { _periodCount: myEntries.length };
                                    let totalSaves = 0, totalShots = 0;
                                    myEntries.forEach((pe: any) => {
                                        totalSaves += resolveNum(pe, 'ShotsStopped', 'Saves', 'SV', 'Svs', 'SVS', 'SavesMade');
                                        totalShots += resolveNum(pe, 'TotalShots', 'ShotsAgainst', 'SA', 'ShotsTotal');
                                    });
                                    aggregated.ShotsStopped = totalSaves;
                                    aggregated.TotalShots = totalShots;
                                    aggregated.GoalsAgainst = totalShots - totalSaves;
                                    const first = myEntries[0];
                                    aggregated.MinutesPlayed = resolveNum(first, 'MinutesPlayed', 'Min', 'Minutes', 'TOI', 'TimeOnIce');
                                    aggregated.Decision = resolveStr(first, 'Decision', 'Dec', 'GoalieDecision');
                                    aggregated.Shutout = resolveField(first, 'Shutout', 'ShutOut');
                                    gameGoalieStatsMap.set(gid, aggregated);
                                }
                            }
                        }
                    });
                }
                
                let enrichedCount = 0;
                allGameLogs = allGameLogs.map(entry => {
                    if (!entry.gameId || !gameGoalieStatsMap.has(entry.gameId)) return entry;
                    const gs = gameGoalieStatsMap.get(entry.gameId)!;
                    const saves = resolveNum(gs, 'ShotsStopped', 'Saves', 'SV', 'Svs', 'SVS', 'SavesMade', 'TotalSaves');
                    const goalsAgainst = resolveNum(gs, 'GoalsAgainst', 'GA', 'GATotal');
                    const shotsAgainst = resolveNum(gs, 'TotalShots', 'ShotsAgainst', 'SA', 'ShotsTotal') || (saves + goalsAgainst);
                    const shutoutVal = resolveField(gs, 'Shutout', 'ShutOut', 'SO');
                    let derivedDecision = resolveStr(gs, 'Decision', 'Dec', 'GoalieDecision');
                    if (!derivedDecision && entry.result) {
                        if (entry.result === 'W') derivedDecision = 'W';
                        else if (entry.result === 'L') derivedDecision = 'L';
                        else if (entry.result === 'T') derivedDecision = 'T';
                    }
                    enrichedCount++;
                    return {
                        ...entry,
                        saves: saves || entry.saves,
                        goalsAgainst: goalsAgainst !== undefined ? goalsAgainst : entry.goalsAgainst,
                        shotsAgainst: shotsAgainst || entry.shotsAgainst,
                        minutes: resolveNum(gs, 'MinutesPlayed', 'Min', 'Minutes', 'TOI', 'TimeOnIce', 'Mins', 'MP') || entry.minutes,
                        decision: derivedDecision || entry.decision,
                        shutout: (shutoutVal === true || shutoutVal === 1 || goalsAgainst === 0) || entry.shutout,
                    };
                });

            }
        }
        
        // Build a map of SeasonId → cleaned season name so we can group
        // related sub-seasons (Regular, Playoffs, Provincials, etc.)
        const seasonIdToCleanName = new Map<number, string>();
        allStats.forEach(stat => {
            if (stat.SeasonId && !seasonIdToCleanName.has(stat.SeasonId)) {
                seasonIdToCleanName.set(stat.SeasonId, cleanSeasonName(stat.SeasonName || ''));
            }
        });

        // Filter logs to target season for display — include ALL sub-seasons
        // (regular, playoffs, provincials) that share the same cleaned name
        let gameLog = allGameLogs;
        let penaltyLog = allPenaltyLogs;
        if (targetSeasonId && allGameLogs.length > 0) {
            const targetCleanName = seasonIdToCleanName.get(targetSeasonId) || '';
            const relatedSeasonIds = new Set<number>();
            seasonIdToCleanName.forEach((name, id) => {
                if (name === targetCleanName) relatedSeasonIds.add(id);
            });
            const filtered = allGameLogs.filter(g => relatedSeasonIds.has(g.seasonId));
            if (filtered.length > 0) gameLog = filtered;
        }
        if (targetSeasonId && allPenaltyLogs.length > 0) {
            const targetCleanName = seasonIdToCleanName.get(targetSeasonId) || '';
            const relatedSeasonIds = new Set<number>();
            seasonIdToCleanName.forEach((name, id) => {
                if (name === targetCleanName) relatedSeasonIds.add(id);
            });
            const filtered = allPenaltyLogs.filter(p => relatedSeasonIds.has(p.seasonId));
            if (filtered.length > 0) penaltyLog = filtered;
        }
        
        // Enrich penalty log opponents from game log — the penalty API doesn't
        // include OpposingTeam, so we cross-reference by GameId
        if (penaltyLog.length > 0 && gameLog.length > 0) {
            const gameIdToOpponent = new Map<number, string>();
            gameLog.forEach(g => {
                if (g.gameId && g.opponent && g.opponent !== 'Unknown') {
                    gameIdToOpponent.set(g.gameId, g.opponent);
                }
            });
            let enriched = 0;
            penaltyLog.forEach(p => {
                if (!p.opponent && p.gameId && gameIdToOpponent.has(p.gameId)) {
                    p.opponent = gameIdToOpponent.get(p.gameId)!;
                    enriched++;
                }
            });
            if (enriched > 0) {

            }
        }

        // Sort logs by date desc
        gameLog.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        penaltyLog.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());



        // ================================================================
        // STEP 5.5: Build Team Name Lookup Map from multiple data sources
        // This resolves "Unknown Team" in the career table when stat entries
        // only have TeamId but not TeamName
        // ================================================================
        const teamNameMap = new Map<number, string>();
        const teamShortNameMap = new Map<number, string>(); // Prefer short/clean names for display
        
        // Source 1: Extract team names from raw game log entries (H data)
        // API uses PlayingWithTeam (player's team) and OpposingTeam (opponent)
        if (Array.isArray(rawGameLog)) {
            rawGameLog.forEach((g: any) => {
                // Note: H entries don't have TeamId/HomeTeamId/VisitorTeamId
                // They have PlayingWithTeam and OpposingTeam as string names only
                const tName = resolveStr(g, 'PlayingWithTeam', 'FullTeamName', 'TeamName', 'Team');
                const oppName = resolveStr(g, 'OpposingTeam', 'OpponentTeam');
                // We can't map names to IDs from game log alone, but names help with display
                // Try standard ID fields as fallback
                const homeId = resolveNum(g, 'HomeTeamId', 'HomeTeamID', 'HomeId');
                const homeName = resolveStr(g, 'HomeTeamName', 'HomeTeam', 'HomeClub', 'HomeTeamClub');
                const visId = resolveNum(g, 'VisitorTeamId', 'VisitorTeamID', 'AwayTeamId', 'VisitorId');
                const visName = resolveStr(g, 'VisitorTeamName', 'VisitorTeam', 'AwayTeamName', 'AwayTeam', 'VisitorClub', 'VisitorTeamClub');
                if (homeId && homeName) teamNameMap.set(homeId, homeName);
                if (visId && visName) teamNameMap.set(visId, visName);
                const tId = resolveNum(g, 'TeamId', 'TeamID');
                if (tId && tName) teamNameMap.set(tId, tName);
            });
        }
        
        // Source 2: Extract from raw penalty log entries
        if (Array.isArray(rawPenaltyLog)) {
            rawPenaltyLog.forEach((p: any) => {
                const homeId = resolveNum(p, 'HomeTeamId', 'HomeTeamID');
                const homeName = resolveStr(p, 'HomeTeamName', 'HomeTeam', 'HomeClub', 'HomeTeamClub');
                const visId = resolveNum(p, 'VisitorTeamId', 'VisitorTeamID');
                const visName = resolveStr(p, 'VisitorTeamName', 'VisitorTeam', 'AwayTeamName', 'AwayTeam', 'VisitorClub', 'VisitorTeamClub');
                if (homeId && homeName) teamNameMap.set(homeId, homeName);
                if (visId && visName) teamNameMap.set(visId, visName);
                const tId = resolveNum(p, 'TeamId', 'TeamID');
                const tName = resolveStr(p, 'TeamName', 'Team', 'ClubName');
                if (tId && tName) teamNameMap.set(tId, tName);
            });
        }
        
        // Source 3: Extract from ScoringStats if available
        const scoringArr = playerObj.ScoringStats || playerObj.PlayerScoringStats || playerObj.Scoring;
        if (Array.isArray(scoringArr)) {
            scoringArr.forEach((s: any) => {
                const tId = resolveNum(s, 'TeamId', 'TeamID');
                const tName = resolveStr(s, 'TeamName', 'Team', 'ClubName', 'Club');
                if (tId && tName) teamNameMap.set(tId, tName);
                const homeId = resolveNum(s, 'HomeTeamId', 'HomeTeamID');
                const homeName = resolveStr(s, 'HomeTeamName', 'HomeTeam', 'HomeClub', 'HomeTeamClub');
                const visId = resolveNum(s, 'VisitorTeamId', 'VisitorTeamID');
                const visName = resolveStr(s, 'VisitorTeamName', 'VisitorTeam', 'AwayTeam', 'VisitorClub', 'VisitorTeamClub');
                if (homeId && homeName) teamNameMap.set(homeId, homeName);
                if (visId && visName) teamNameMap.set(visId, visName);
            });
        }
        
        // Source 4: Extract any team names that DO exist on career stat entries
        allStats.forEach(s => {
            const tId = s.TeamId;
            const tName = resolveTeamName(s);
            if (tId && tName !== 'Unknown Team') teamNameMap.set(tId, tName);
        });

        // Source 5: Fetch teams from the API for all unique season IDs
        // Also build divisionId → divisionName map since API doesn't provide DivisionName
        const divisionNameMap = new Map<number, string>();
        const uniqueSeasonIds = [...new Set(allStats.map(s => s.SeasonId).filter(Boolean))];
        // Limit to 5 most recent seasons to avoid API overload
        uniqueSeasonIds.sort((a, b) => b - a);
        const teamFetchSeasonIds = uniqueSeasonIds.slice(0, 5);
        if (teamFetchSeasonIds.length > 0) {
            try {

                const teamResults = await Promise.all(
                    teamFetchSeasonIds.map(sid => fetchTeams(sid, 'BI').catch(err => {
                        console.warn(`[usePlayerProfile] Failed to fetch teams for season ${sid}:`, err);
                        return null;
                    }))
                );
                teamResults.forEach(resp => {
                    if (resp?.Success && resp.Response?.Teams) {
                        resp.Response.Teams.forEach((t: any) => {
                            if (t.TeamId && t.TeamName) {
                                teamNameMap.set(t.TeamId, t.TeamName);
                            }
                            // Prefer short name for display (e.g. "Fort Saskatchewan Rebels" 
                            // instead of "Jr Tier I Jr. B Tier I North Fort Saskatchewan Rebels")
                            const shortName = t.TeamShortName || t.ShortName || t.TeamNickName || t.NickName;
                            if (t.TeamId && shortName) {
                                teamShortNameMap.set(t.TeamId, shortName);
                            }
                            if (t.DivisionId && t.DivisionName) {
                                divisionNameMap.set(t.DivisionId, t.DivisionName);
                            }
                        });
                    }
                });
            } catch (e) {
                console.warn('[usePlayerProfile] Failed to batch-fetch teams:', e);
            }
        }
        


        // ================================================================
        // STEP 6: Group stats by Season and Team for Career Overview
        // ================================================================
        const seasonGroups = new Map<string, AggregatedSeasonStats & { _isGoalie?: boolean }>();

        allStats.forEach(stat => {
            const sId = stat.SeasonId;
            const tId = stat.TeamId;
            const isGoalieStat = isGoalieStatEntry(stat);
            // Use cleaned season name + team + role as the key so that
            // regular season and playoffs (which have different SeasonIds)
            // merge into one aggregated season entry instead of counting
            // as separate "seasons".
            const cleanedName = cleanSeasonName(stat.SeasonName || '');
            const key = `${cleanedName}-${tId}-${isGoalieStat ? 'G' : 'P'}`;

            if (!seasonGroups.has(key)) {
                // Prefer short name from Teams API, then fall back to stat entry, then full name map
                let tName = 'Unknown Team';
                if (tId && teamShortNameMap.has(tId)) {
                    tName = teamShortNameMap.get(tId)!;
                } else {
                    tName = resolveTeamName(stat);
                    if (tName === 'Unknown Team' && tId && teamNameMap.has(tId)) {
                        tName = teamNameMap.get(tId)!;
                    }
                }
                seasonGroups.set(key, {
                    seasonId: sId,
                    teamId: tId,
                    seasonName: cleanedName,
                    teamName: tName,
                    divisionName: resolveStr(stat, 'DivisionName', 'Division', 'DivName') || (stat.DivisionId && divisionNameMap.has(stat.DivisionId) ? divisionNameMap.get(stat.DivisionId)! : ''),
                    stats: {},
                    _isGoalie: isGoalieStat
                });
            }

            const group = seasonGroups.get(key)!;
            const standingCode = resolveStr(stat, 'StandingCategoryCode', 'StandingCode', 'CategoryCode').toLowerCase();
            const seasonNameLow = (stat.SeasonName || '').toLowerCase();

            if (standingCode === 'regu' || (!standingCode && !seasonNameLow.includes('playoff') && !seasonNameLow.includes('playodd') && !seasonNameLow.includes('exhibition') && !seasonNameLow.includes('provincial'))) {
                if (!group.stats.regular) group.stats.regular = stat;
            } else if (standingCode === 'plyo' || seasonNameLow.includes('playoff') || seasonNameLow.includes('playodd')) {
                if (!group.stats.playoffs) group.stats.playoffs = stat;
            } else if (standingCode === 'exhb' || seasonNameLow.includes('exhibition')) {
                if (!group.stats.exhibition) group.stats.exhibition = stat;
            } else if (standingCode === 'prov' || seasonNameLow.includes('provincial')) {
                if (!group.stats.provincials) group.stats.provincials = stat;
            } else {
                if (!group.stats.regular) group.stats.regular = stat;
            }
        });

        const allAggregatedSeasons = Array.from(seasonGroups.values()).sort((a, b) => b.seasonId - a.seasonId);
        // Combined (backward compat) — includes both goalie & player entries
        const aggregatedSeasons = allAggregatedSeasons;
        // Role-separated arrays for the toggle
        const playerAggregatedSeasons = allAggregatedSeasons.filter(s => !s._isGoalie);
        const goalieAggregatedSeasons = allAggregatedSeasons.filter(s => s._isGoalie);

        // ================================================================
        // STEP 7: Calculate Career Totals (combined + role-separated)
        // ================================================================
        let careerGP = 0, careerGD = 0, careerG = 0, careerA = 0, careerPts = 0, careerPIM = 0;
        let careerPPG = 0, careerSHG = 0, careerGWG = 0, careerShots = 0, careerPlusMinus = 0;
        let careerWins = 0, careerLosses = 0, careerTies = 0, careerOTL = 0;
        let careerGA = 0, careerSaves = 0, careerSO = 0, careerMins = 0, careerSA = 0;
        let hasGoalie = false, hasPlayer = false;

        allStats.forEach((s, i) => {
            const isGoalieStat = isGoalieStatEntry(s);
            
            // Per-entry role detection logged only for first entry as sample


            if (isGoalieStat) hasGoalie = true;
            else hasPlayer = true;

            careerGP += resolveNum(s, 'GamesPlayed', 'GP');
            careerGD += resolveNum(s, 'GamesDressed', 'GD', 'Dressed');
            // API uses PenaltyMin (not PenaltyMinutes)
            careerPIM += resolveNum(s, 'PenaltyMin', 'PenaltyMinutes', 'PIM', 'PenMin', 'Penalties');

            if (isGoalieStat) {
                careerWins += resolveNum(s, 'Wins', 'W');
                careerLosses += resolveNum(s, 'Losses', 'L');
                careerTies += resolveNum(s, 'Ties', 'T');
                careerOTL += resolveNum(s, 'OvertimeLosses', 'OTLosses', 'OTL');
                careerGA += resolveNum(s, 'GoalsAgainst', 'GA', 'GATotal');
                careerSaves += resolveNum(s, 'Saves', 'SV', 'Svs', 'SVS', 'SaversTotal', 'ShotsStopped', 'SavesMade', 'TotalSaves', 'SavesTotal');
                careerSO += resolveNum(s, 'Shutouts', 'SO', 'ShutOuts');
                careerMins += resolveNum(s, 'MinutesPlayed', 'Min', 'Minutes', 'Mins', 'MP', 'TOI', 'TimeOnIce', 'TotalMinutes');
                careerSA += resolveNum(s, 'ShotsAgainst', 'SA', 'ShotsTotal', 'ShotAgainst', 'TotalShots', 'ShotsReceived');
                careerG += resolveNum(s, 'Goals', 'G');
                careerA += resolveNum(s, 'Assists', 'A');
                careerPts += resolveNum(s, 'Points', 'Pts');
            } else {
                careerG += resolveNum(s, 'Goals', 'G');
                careerA += resolveNum(s, 'Assists', 'A');
                careerPts += resolveNum(s, 'Points', 'Pts');
                // API uses PPGoals, SHGoals (not PowerPlayGoals, ShortHandedGoals)
                careerPPG += resolveNum(s, 'PPGoals', 'PowerPlayGoals', 'PPG', 'PP');
                careerSHG += resolveNum(s, 'SHGoals', 'ShortHandedGoals', 'SHG', 'SH');
                careerGWG += resolveNum(s, 'GameWinningGoals', 'GWG');
                careerShots += resolveNum(s, 'Shots', 'SOG', 'ShotsOnGoal');
                careerPlusMinus += resolveNum(s, 'PlusMinus', 'PM', 'Plus_Minus');
            }
        });



        // Role-separated career totals
        const emptyCareer: CareerTotals = { gamesPlayed: 0, gamesDressed: 0, goals: 0, assists: 0, points: 0, pim: 0, ppg: 0, shg: 0, gwg: 0, shots: 0, plusMinus: 0, wins: 0, losses: 0, ties: 0, otLosses: 0, goalsAgainst: 0, saves: 0, shutouts: 0, minutes: 0, shotsAgainst: 0 };
        const pCareer = { ...emptyCareer };
        const gCareer = { ...emptyCareer };

        allStats.forEach(s => {
            const isGoalieStat = isGoalieStatEntry(s);
            const target = isGoalieStat ? gCareer : pCareer;
            target.gamesPlayed += resolveNum(s, 'GamesPlayed', 'GP');
            target.gamesDressed += resolveNum(s, 'GamesDressed', 'GD', 'Dressed');
            target.pim += resolveNum(s, 'PenaltyMin', 'PenaltyMinutes', 'PIM', 'PenMin', 'Penalties');
            target.goals += resolveNum(s, 'Goals', 'G');
            target.assists += resolveNum(s, 'Assists', 'A');
            target.points += resolveNum(s, 'Points', 'Pts');

            if (isGoalieStat) {
                target.wins += resolveNum(s, 'Wins', 'W');
                target.losses += resolveNum(s, 'Losses', 'L');
                target.ties += resolveNum(s, 'Ties', 'T');
                target.otLosses += resolveNum(s, 'OvertimeLosses', 'OTLosses', 'OTL');
                target.goalsAgainst += resolveNum(s, 'GoalsAgainst', 'GA', 'GATotal');
                target.saves += resolveNum(s, 'Saves', 'SV', 'Svs', 'SVS', 'SaversTotal', 'ShotsStopped', 'SavesMade', 'TotalSaves', 'SavesTotal');
                target.shutouts += resolveNum(s, 'Shutouts', 'SO', 'ShutOuts');
                target.minutes += resolveNum(s, 'MinutesPlayed', 'Min', 'Minutes', 'Mins', 'MP', 'TOI', 'TimeOnIce', 'TotalMinutes');
                target.shotsAgainst += resolveNum(s, 'ShotsAgainst', 'SA', 'ShotsTotal', 'ShotAgainst', 'TotalShots', 'ShotsReceived');
            } else {
                target.ppg += resolveNum(s, 'PPGoals', 'PowerPlayGoals', 'PPG', 'PP');
                target.shg += resolveNum(s, 'SHGoals', 'ShortHandedGoals', 'SHG', 'SH');
                target.gwg += resolveNum(s, 'GameWinningGoals', 'GWG');
                target.shots += resolveNum(s, 'Shots', 'SOG', 'ShotsOnGoal');
                target.plusMinus += resolveNum(s, 'PlusMinus', 'PM', 'Plus_Minus');
            }
        });
        // Fix shotsAgainst if not provided
        if (gCareer.shotsAgainst === 0 && (gCareer.saves + gCareer.goalsAgainst) > 0) {
            gCareer.shotsAgainst = gCareer.saves + gCareer.goalsAgainst;
        }
        
        // Back-calculate minutes from GAA if minutes are missing
        // GAA = GA * 60 / MIN → MIN = GA * 60 / GAA
        if (gCareer.minutes === 0 && gCareer.goalsAgainst > 0) {
            for (const s of allStats) {
                if (isGoalieStatEntry(s)) {
                    const preGAA = resolveNum(s, 'GoalsAgainstAverage', 'GAA', 'Gaa');
                    if (preGAA > 0) {
                        gCareer.minutes = Math.round((gCareer.goalsAgainst * 60) / preGAA);

                        break;
                    }
                }
            }
        }
        
        // Also fix combined career shotsAgainst
        if (careerSA === 0 && (careerSaves + careerGA) > 0) {
            careerSA = careerSaves + careerGA;
        }

        // ================================================================
        // STEP 8: Determine Primary Role
        // ================================================================
        let primaryRole: 'goalie' | 'player' = 'player';
        
        // latestEntry: Always the most recent stat (allStats[0]) — used for hero section (team logo, colors, jersey, position)
        // mostRecent: Matches the SELECTED season — used for activeSeasonId, game log filtering
        const latestEntry = allStats[0] || {};
        let mostRecent = latestEntry;
        if (targetSeasonId) {
            // Prefer match on both seasonId AND teamId (if provided)
            let seasonMatch = teamId 
                ? allStats.find(s => s.SeasonId === targetSeasonId && s.TeamId === teamId)
                : null;
            // Fallback: match on seasonId only (take first match, which is typically regular season)
            if (!seasonMatch) {
                seasonMatch = allStats.find(s => s.SeasonId === targetSeasonId);
            }
            if (seasonMatch) {
                mostRecent = seasonMatch;

            } else {

            }
        }
        
        if (isGoalieStatEntry(mostRecent)) {
            primaryRole = 'goalie';

        } else if (hasGoalie && !hasPlayer) {
            primaryRole = 'goalie';

        } else {

        }

        // ================================================================
        // STEP 9: Extract Biographical Info from the player object
        // ================================================================
        const source = (playerObj.FirstName || playerObj.LastName) ? playerObj : (r.Player || mostRecent);
        

        
        const firstName = resolveStr(source, 'FirstName', 'First', 'FName');
        const lastName = resolveStr(source, 'LastName', 'Last', 'LName', 'Surname');
        const playerName = resolveStr(source, 'PlayerName', 'Name', 'FullName') || 
            (firstName && lastName ? `${firstName} ${lastName}` : 'Unknown Player');
        
        const photoId = resolveNum(source, 'PhotoDocId', 'ImageDocId', 'ProfileImageId', 'DocId', 'PhotoId') || 
                         resolveNum(latestEntry, 'PhotoDocId', 'ImageDocId');
        // Hero section always uses latestEntry (current team) - not season-selected mostRecent
        const currentTeamId = latestEntry.TeamId || teamId;
        let currentTeamName = (currentTeamId && teamShortNameMap.has(currentTeamId)) 
            ? teamShortNameMap.get(currentTeamId)! 
            : resolveTeamName(latestEntry);
        if (currentTeamName === 'Unknown Team' && currentTeamId && teamNameMap.has(currentTeamId)) {
            currentTeamName = teamNameMap.get(currentTeamId)!;

        }
        
        // Calculate Age
        let age: number | undefined = resolveField(source, 'Age', 'AgeWeb', 'PlayerAge');
        const birthDateStr = resolveStr(source, 'BirthDate', 'DOB', 'DateOfBirth', 'Birthday');
        if (!age && birthDateStr) {
            const birthDate = new Date(birthDateStr);
            if (!isNaN(birthDate.getTime())) {
                const today = new Date();
                age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
            }
        }
        
        // Position - API uses SportPositionName. Use latestEntry (current team) for hero display.
        const position = resolveStr(source, 'SportPositionName', 'Position', 'PositionName', 'Pos') ||
                          resolveStr(latestEntry, 'SportPositionName', 'Position', 'PositionName', 'Pos');
        
        // Final fallback: If the bio-level position indicates goalie but primaryRole wasn't detected,
        // override it. This catches cases where the API only has position info on the player object
        // but not on individual stat entries.
        if (primaryRole === 'player' && position && isGoaliePosition(position)) {
            primaryRole = 'goalie';
            hasGoalie = true;
            hasPlayer = false;
            // The career loops already ran and put everything into pCareer.
            // Move pCareer data into gCareer since this player is actually a goalie.
            if (gCareer.gamesPlayed === 0 && pCareer.gamesPlayed > 0) {
                Object.assign(gCareer, pCareer);
                Object.assign(pCareer, emptyCareer);

            }
            // Also reclassify aggregated seasons
            if (goalieAggregatedSeasons.length === 0 && playerAggregatedSeasons.length > 0) {
                goalieAggregatedSeasons.push(...playerAggregatedSeasons);
                playerAggregatedSeasons.length = 0;

            }

        }
        
        // Hometown
        const homeCityName = resolveStr(source, 'HomeCityName', 'HomeCity', 'City', 'Hometown', 'HomeTown');
        const homeProvStateCd = resolveStr(source, 'HomeProvStateCd', 'HomeProvince', 'Province', 'State', 'ProvState');
        const hometown = homeCityName && homeProvStateCd 
            ? `${homeCityName}, ${homeProvStateCd}` 
            : (homeCityName || '');

        // ================================================================
        // STEP 10: Fetch Team Context (Logo, Colors, Rank)
        // Teams were already fetched in Step 5.5 for name resolution.
        // Now we re-use that data for logo, colors, and league ranking.
        // ================================================================
        let currentTeamNameForLookup = currentTeamName;
        let teamLogoUrl: string | undefined = undefined;
        let currentTeamColors: { primary: string; secondary: string; tertiary: string } | undefined = undefined;

        // Always use the latest season for team context (logo, colors) — not the selected season
        const sid = latestEntry.SeasonId || seasonId;
        
        if (sid && currentTeamId) {
             try {
                let divisionId = resolveNum(latestEntry, 'DivisionId', 'DivId');
                
                // Re-fetch teams for current season to get logo/colors (already cached by browser)

                const teamResp = await fetchTeams(sid, 'BI');
                
                if (teamResp.Success && teamResp.Response?.Teams) {
                    let t: any = teamResp.Response.Teams.find((x: any) => x.TeamId === currentTeamId);
                    if (!t && currentTeamName !== 'Unknown Team') {
                         t = teamResp.Response.Teams.find((x: any) => x.TeamName === currentTeamName);
                    }
                    // Also try matching by name from teamNameMap
                    if (!t && teamNameMap.has(currentTeamId)) {
                         const mappedName = teamNameMap.get(currentTeamId);
                         t = teamResp.Response.Teams.find((x: any) => x.TeamName === mappedName);
                    }
                    
                    if (t) {
                        currentTeamNameForLookup = t.TeamName;
                        teamLogoUrl = resolveStr(t, 'PrimaryTeamLogoURL', 'TeamLogoUrl', 'TeamLogoFilename', 'LogoUrl', 'Logo');
                        if (!divisionId) divisionId = t.DivisionId;
                        
                        const color1 = resolveStr(t, 'TeamColor1', 'Color1', 'PrimaryColor');
                        if (color1) {
                            currentTeamColors = {
                                primary: color1,
                                secondary: resolveStr(t, 'TeamColor2', 'Color2', 'SecondaryColor') || '#ffffff',
                                tertiary: resolveStr(t, 'TeamColor3', 'Color3', 'TertiaryColor') || '#000000'
                            };
                        }
                    }
                }


             } catch (e) {
                 console.warn('[usePlayerProfile] Failed to fetch context/teams:', e);
             }
        }

        const finalTeamLogoUrl = getTeamLogo(currentTeamNameForLookup, teamLogoUrl);

        if (!currentTeamColors) {
            const mappedColors = getTeamColors(currentTeamNameForLookup);
            if (mappedColors) {
                currentTeamColors = mappedColors;
            }
        }
        
        if (!currentTeamColors && finalTeamLogoUrl) {
            try {
                if (finalTeamLogoUrl.trim().length > 0) {
                    const extracted = await extractColorsFromImage(finalTeamLogoUrl);
                    currentTeamColors = {
                        primary: extracted.primary,
                        secondary: extracted.secondary,
                        tertiary: extracted.accent
                    };
                }
            } catch (e) {
                console.warn('[usePlayerProfile] Failed to extract colors:', e);
            }
        }

        // ================================================================
        // STEP 11: Build Profile Object
        // ================================================================
        // API uses PlayerNo (not JerseyNumber). Use latestEntry for current team context.
        const jersey = resolveStr(latestEntry, 'PlayerNo', 'PlayerNumber', 'JerseyNumber', 'Number', 'No', 'Jersey', 'Num', 'JerseyNo');
        
        const profileData: PlayerProfile = {
            playerId,
            name: playerName,
            firstName: firstName || playerName.split(' ')[0] || '',
            lastName: lastName || playerName.split(' ').slice(1).join(' ') || '',
            photoUrl: photoId ? getPlayerPhotoUrl(photoId) : (fallbackPhotoDocId ? getPlayerPhotoUrl(fallbackPhotoDocId) : undefined),
            teamLogoUrl: finalTeamLogoUrl,
            hometown,
            homeProvStateCd,
            birthDate: birthDateStr || undefined,
            birthDateFull: birthDateStr || undefined,
            birthYear: resolveField(source, 'BirthYear', 'YearOfBirth'),
            age,
            height: resolveStr(source, 'Height', 'Ht') || undefined,
            weight: resolveStr(source, 'Weight', 'Wt') || undefined,
            shoots: resolveStr(source, 'Shoots', 'Handedness', 'Hand', 'ShootsCatches') || undefined,
            position: position || undefined,
            currentTeamColors,
            seasons: allStats,
            aggregatedSeasons,
            gameLog, 
            penaltyLog,
            career: {
                gamesPlayed: careerGP,
                gamesDressed: careerGD,
                goals: careerG,
                assists: careerA,
                points: careerPts,
                pim: careerPIM,
                ppg: careerPPG,
                shg: careerSHG,
                gwg: careerGWG,
                shots: careerShots,
                plusMinus: careerPlusMinus,
                wins: careerWins,
                losses: careerLosses,
                ties: careerTies,
                otLosses: careerOTL,
                goalsAgainst: careerGA,
                saves: careerSaves,
                shutouts: careerSO,
                minutes: careerMins,
                shotsAgainst: careerSA || (careerSaves + careerGA)
            },
            playerCareer: pCareer,
            goalieCareer: gCareer,
            playerAggregatedSeasons,
            goalieAggregatedSeasons,
            mostRecentTeam: currentTeamName !== 'Unknown Team' ? currentTeamName : (currentTeamNameForLookup !== 'Unknown Team' ? currentTeamNameForLookup : undefined),
            mostRecentTeamId: currentTeamId,
            mostRecentJersey: jersey || undefined,
            mostRecentPosition: position || undefined,
            divisionName: resolveStr(latestEntry, 'DivisionName', 'Division', 'DivName') || (latestEntry.DivisionId && divisionNameMap.has(latestEntry.DivisionId) ? divisionNameMap.get(latestEntry.DivisionId) : undefined),
            hasGoalieStats: hasGoalie,
            hasPlayerStats: hasPlayer,
            primaryRole,
            activeSeasonId: targetSeasonId,
            leagueRank: undefined,
            leagueContext: undefined
        };


        
        // ================================================================
        // DATA QUALITY SUMMARY - Shows what populated vs what's missing
        // ================================================================
        const populated: string[] = [];
        const missing: string[] = [];
        const check = (label: string, val: any) => {
            if (val !== undefined && val !== null && val !== '' && val !== 0 && val !== false) populated.push(label);
            else missing.push(label);
        };
        check('Photo', profileData.photoUrl);
        check('TeamLogo', profileData.teamLogoUrl);
        check('TeamColors', profileData.currentTeamColors);
        check('Hometown', profileData.hometown);
        check('Age', profileData.age);
        check('BirthDate', profileData.birthDate);
        check('Height', profileData.height);
        check('Weight', profileData.weight);
        check('Shoots', profileData.shoots);
        check('Position', profileData.position);
        check('Jersey', profileData.mostRecentJersey);
        check('Division', profileData.divisionName);
        check('CareerGP', careerGP);
        check('CareerPts', careerPts);
        check('CareerPPG', careerPPG);
        check('CareerSHG', careerSHG);
        check('CareerGWG', careerGWG);
        check('CareerShots', careerShots);
        check('CareerPM', careerPlusMinus);
        check('GameLog', gameLog.length);
        check('PenaltyLog', penaltyLog.length);
        // Check game log data quality
        if (gameLog.length > 0) {
            const unknownOpponents = gameLog.filter(g => g.opponent === 'Unknown').length;
            const noScore = gameLog.filter(g => g.score === '-').length;
            const noResult = gameLog.filter(g => g.result === '-').length;
            if (unknownOpponents > 0) missing.push(`GameLog.Opponents(${unknownOpponents}/${gameLog.length} unknown)`);
            if (noScore > 0) missing.push(`GameLog.Scores(${noScore}/${gameLog.length} missing)`);
            if (noResult > 0) missing.push(`GameLog.Results(${noResult}/${gameLog.length} missing)`);
            
            // Goalie game log quality
            const withSaves = gameLog.filter(g => g.saves !== undefined && g.saves > 0).length;
            const withGA = gameLog.filter(g => g.goalsAgainst !== undefined).length;
            const withSA = gameLog.filter(g => g.shotsAgainst !== undefined && g.shotsAgainst > 0).length;
            const withMin = gameLog.filter(g => g.minutes !== undefined && g.minutes > 0).length;

        }

        
        setProfile(profileData);
      } catch (err: any) {
        console.error('[usePlayerProfile] ❌ Error loading player profile:', err);
        console.error('[usePlayerProfile] ❌ Stack:', err?.stack || 'no stack');
        setError(err instanceof Error ? err : new Error(String(err) || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [playerId, teamId, seasonId, isGoalieHint]);

  return { profile, loading, error };
}