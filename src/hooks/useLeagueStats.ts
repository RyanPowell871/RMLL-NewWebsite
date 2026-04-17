import { useState, useEffect } from 'react';
import {
  fetchTeams,
  fetchPlayerStats,
  fetchTeamRoster,
  fetchStandings,
  getPlayerPhotoUrl,
} from '../services/sportzsoft';

export interface LeaguePlayerStat {
  rank?: number;
  player: string;
  playerId: number;
  jerseyNumber: string;
  team: string;
  teamId: number;
  teamLogoUrl?: string;
  position: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  shots: number; // SOG
  plusMinus: number;
  pim: number;
  ppg: number;
  shg: number;
  gwg: number;
  otGoals: number;
  goalsRank?: number;
  assistsRank?: number;
  division: string;
  divisionId: number;
  divisionGroupId?: number;
  avatar?: string;
  photoDocId?: number;
  sportPositionId?: number;
}

export interface LeagueGoalieStat {
  rank?: number;
  player: string;
  playerId: number;
  jerseyNumber: string;
  team: string;
  teamId: number;
  teamLogoUrl?: string;
  gamesPlayed: number;
  gamesDressed: number;
  wins: number;
  losses: number;
  ties: number; // or OT losses
  gaa: number;
  savePercentage: number;
  shutouts: number;
  saves: number;
  goalsAgainst: number;
  shotsAgainst: number;
  goals: number;
  assists: number;
  points: number;
  pim: number;
  minutes: number;
  division: string;
  divisionId: number;
  divisionGroupId?: number;
  avatar?: string;
  photoDocId?: number;
}

interface UseLeagueStatsReturn {
  players: LeaguePlayerStat[];
  goalies: LeagueGoalieStat[];
  loading: boolean;
  error: Error | null;
  progress: number; // 0 to 100
}

// Cache outside the hook to persist data across filter changes
// Added TTL for 2026 season freshness - data expires after 5 minutes
const statsCache = new Map<string, { players: LeaguePlayerStat[], goalies: LeagueGoalieStat[], timestamp: number }>();
const STATS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Universal field resolver for API response field name variations
function resolveNum(obj: any, ...fieldNames: string[]): number {
    // First pass: exact case match (fast path)
    for (const name of fieldNames) {
        if (obj[name] !== undefined && obj[name] !== null) return Number(obj[name]) || 0;
    }
    // Second pass: case-insensitive fallback (covers API inconsistencies)
    const objKeys = Object.keys(obj);
    for (const name of fieldNames) {
        const lower = name.toLowerCase();
        const match = objKeys.find(k => k.toLowerCase() === lower);
        if (match && obj[match] !== undefined && obj[match] !== null) return Number(obj[match]) || 0;
    }
    return 0;
}

function resolveStr(obj: any, ...fieldNames: string[]): string {
    for (const name of fieldNames) {
        if (obj[name] !== undefined && obj[name] !== null && String(obj[name]).trim()) return String(obj[name]);
    }
    // Case-insensitive fallback
    const objKeys = Object.keys(obj);
    for (const name of fieldNames) {
        const lower = name.toLowerCase();
        const match = objKeys.find(k => k.toLowerCase() === lower);
        if (match && obj[match] !== undefined && obj[match] !== null && String(obj[match]).trim()) return String(obj[match]);
    }
    return '';
}

// Force mapping to the lowercase codes as requested by the user
const GAME_TYPE_CODES: Record<string, string[]> = {
  'regu': ['regu'],
  'plyo': ['plyo'],
  'prov': ['prov']
};

export function useLeagueStats(seasonId: number | null, divisionIds?: number[] | null, divisionGroupId?: number | null, gameType: string = 'regu'): UseLeagueStatsReturn {
  const [players, setPlayers] = useState<LeaguePlayerStat[]>([]);
  const [goalies, setGoalies] = useState<LeagueGoalieStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // If we have a division group ID, we can proceed without seasonId if necessary, 
    // but usually seasonId is still good for context.
    if (!seasonId && !divisionGroupId) {
      setPlayers([]);
      setGoalies([]);
      return;
    }

    // Include season year in cache key to prevent cross-season data mixing
    // If seasonId is null, use 'null' to distinguish from seasonId=0
    const seasonKey = seasonId === null ? 'null' : String(seasonId);
    const cacheKey = `${seasonKey}-${divisionGroupId || 0}-${divisionIds ? divisionIds.join(',') : 'all'}-${gameType}`;

    // Check cache first (with TTL)
    if (statsCache.has(cacheKey)) {
      const cached = statsCache.get(cacheKey)!;
      const isExpired = (Date.now() - cached.timestamp) > STATS_CACHE_TTL;

      if (!isExpired) {
        setPlayers(cached.players);
        setGoalies(cached.goalies);
        setProgress(100);
        setLoading(false);
        return;
      }
      // Cache expired, remove it
      statsCache.delete(cacheKey);
    }

    // If seasonId is null, clear any cached entries that might have been created
    // with a null seasonId to prevent stale data from being returned
    if (!seasonId) {
      for (const [key] of statsCache.entries()) {
        if (key.startsWith('null-')) {
          statsCache.delete(key);
        }
      }
    }

    const loadStats = async () => {
      setLoading(true);
      setError(null);
      setProgress(0);

      try {

        
        const targetTeamsMap = new Map<number, { teamId: number; teamName: string; teamLogoUrl?: string; divisionId: number; divisionName: string }>();
        const divisionLookup = new Map<number, string>();
        const collectedDivisionIds = new Set<number>();
        const divisionIdToGroupId = new Map<number, number>(); // Map division ID to group ID for context
        
        // --- Step 1: Structure Fetch (Primary Source for Division Names and Codes) ---
        // We run this FIRST or prioritize its results to ensure we get correct Division Names and valid Codes
        const structureFetchPromise = (async () => {
          if (!seasonId) return; // Need season ID for structure fetch usually

          try {

            
            // Parallel fetch: Get Teams directly AND get Season Structure
            const [structureResponse, teamsResponse] = await Promise.all([
              fetchStandings(seasonId, undefined, 'BI', 'G,D'), // Get Groups, Divisions
              fetchTeams(seasonId, 'BI') // Get Teams with DivisionId
            ]);
            
            // Process Structure (Groups -> Divisions)
            if (structureResponse.Success && structureResponse.Response?.Season?.Groups) {
              structureResponse.Response.Season.Groups.forEach(group => {
                const groupId = group.DivisionGroupId;
                const groupName = group.DivGroupName || group.SeasonGroupName || '';

                group.Divisions?.forEach(div => {
                  // Construct a Composite Name: "Group Name - Division Name"
                  let fullDivisionName = div.DivisionName || div.DivisionDescription || '';
                  
                  if (groupName && fullDivisionName && !fullDivisionName.toLowerCase().includes(groupName.toLowerCase())) {
                    fullDivisionName = `${groupName} - ${fullDivisionName}`;
                  } else if (!fullDivisionName && groupName) {
                    fullDivisionName = groupName;
                  }

                  // Populate Division Lookup (Critical for filtering)
                  if (div.DivisionId) {
                    const dId = Number(div.DivisionId);
                    divisionLookup.set(dId, fullDivisionName);
                    collectedDivisionIds.add(dId);
                    if (groupId) divisionIdToGroupId.set(dId, groupId);
                  }
                });
              });
            }

            // Process Teams (Teams -> DivisionId -> DivisionName)
            if (teamsResponse.Success && teamsResponse.Response?.Teams) {
              let foundTeamsCount = 0;
              teamsResponse.Response.Teams.forEach((t: any) => {
                 const tId = Number(t.TeamId || t.Id);
                 if (tId) {
                   const dId = Number(t.DivisionId);
                   if (dId) {
                      collectedDivisionIds.add(dId);
                   }
                   // Try to get Division Name from lookup, or use what's on the team record
                   const dName = divisionLookup.get(dId) || t.DivisionName || '';
                   
                   targetTeamsMap.set(tId, {
                    teamId: tId,
                    teamName: t.TeamName || t.Name,
                    teamLogoUrl: t.PrimaryTeamLogoURL || t.TeamLogoUrl || t.TeamLogoFilename,
                    divisionId: dId,
                    divisionName: dName
                  });
                  foundTeamsCount++;
                 }
              });

              // Log team logo availability for debugging
              const teamsWithLogos = Array.from(targetTeamsMap.values()).filter(t => t.teamLogoUrl);

              if (teamsWithLogos.length > 0) {

              } else if (foundTeamsCount > 0) {
                // Log raw team object keys to discover the correct logo field name
                const sampleTeam = teamsResponse.Response.Teams[0];
                const logoRelatedKeys = Object.keys(sampleTeam).filter(k => /logo|image|photo|img|icon/i.test(k));

              }
            }

          } catch (err) {
            console.warn(`[useLeagueStats] Structure fetch failed:`, err);
          }
        })();

        // Wait for structure fetch to populate lookup map
        await structureFetchPromise;

        // Determine which codes to fetch based on gameType
        let standingsCodesToFetch: string[] = [];

        if (!gameType || gameType === 'all') {
             // If fetching all games, use specific known codes rather than relying on API discovery which can be flaky
             standingsCodesToFetch = ['regu', 'plyo', 'prov']; 

        } else {
             // Use the strict mapping provided
             if (GAME_TYPE_CODES[gameType]) {
                 standingsCodesToFetch = GAME_TYPE_CODES[gameType];

             } else {
                 // Fallback if the user passes something unexpected (like uppercase from URL)
                 standingsCodesToFetch = [gameType.toLowerCase()];
                 console.warn(`[useLeagueStats] Unknown game type '${gameType}', attempting lowercased: ${standingsCodesToFetch[0]}`);
             }
        }
        
        // --- Step 4: Fetch Stats via Endpoint ---
        const playersMap = new Map<number, LeaguePlayerStat>();
        const goaliesMap = new Map<number, LeagueGoalieStat>();
        
        try {

          
          type FetchContext = { divisionId?: number; divisionGroupId?: number; type: 'players' | 'goalies' };
          let fetchTasks: { promise: Promise<any>; context: FetchContext }[] = [];
          
          // Helper to create tasks for all standing codes
          const addTasksForCodes = (did: number | undefined, groupId: number | undefined) => {
             standingsCodesToFetch.forEach(code => {
                // IMPORTANT: Changed 'standingCategoryCode' to 'standingCode' to match API expectation
                const params: any = { limiterCode: 'BI', standingCode: code, playersOnly: true };
                const goalieParams: any = { limiterCode: 'BI', standingCode: code, goaliesOnly: true };

                if (did) {
                   params.divisionId = did;
                   goalieParams.divisionId = did;
                   fetchTasks.push({
                     promise: fetchPlayerStats(params).catch(e => { console.error(`Error fetching players for div ${did} code ${code}`, e); return { Response: [] }; }),
                     context: { divisionId: did, type: 'players' }
                   });
                   fetchTasks.push({
                     promise: fetchPlayerStats(goalieParams).catch(e => { console.error(`Error fetching goalies for div ${did} code ${code}`, e); return { Response: [] }; }),
                     context: { divisionId: did, type: 'goalies' }
                   });
                } else if (groupId) {
                   params.divisionGroupId = groupId;
                   goalieParams.divisionGroupId = groupId;
                   fetchTasks.push({
                     promise: fetchPlayerStats(params).catch(e => { console.error(`Error fetching players for group ${groupId} code ${code}`, e); return { Response: [] }; }),
                     context: { divisionGroupId: groupId, type: 'players' }
                   });
                   fetchTasks.push({
                     promise: fetchPlayerStats(goalieParams).catch(e => { console.error(`Error fetching goalies for group ${groupId} code ${code}`, e); return { Response: [] }; }),
                     context: { divisionGroupId: groupId, type: 'goalies' }
                   });
                } else if (seasonId) {
                   params.seasonId = seasonId;
                   goalieParams.seasonId = seasonId;
                   fetchTasks.push({
                     promise: fetchPlayerStats(params),
                     context: { type: 'players' }
                   });
                   fetchTasks.push({
                     promise: fetchPlayerStats(goalieParams),
                     context: { type: 'goalies' }
                   });
                }
             });
          };

          if (divisionIds && divisionIds.length > 0) {
             // Case 1: Specific Divisions requested

             divisionIds.forEach(did => addTasksForCodes(did, undefined));
          } else if (divisionGroupId) {
             // Case 2: Division Group
             // Resolve specific divisions within this group and fetch them individually using DivisionId parameter.
             const groupDivisionIds = Array.from(collectedDivisionIds).filter(dId => divisionIdToGroupId.get(dId) === divisionGroupId);
             
             if (groupDivisionIds.length > 0) {

                 groupDivisionIds.forEach(did => addTasksForCodes(did, undefined));
             } else {
                 // Fallback: If no sub-divisions found (or structure failed), try fetching by GroupID (without SeasonId)
                 // This is a normal fallback path for some configurations.

                 addTasksForCodes(undefined, divisionGroupId);
             }
          } else {
             // Case 3: Whole Season (Default)
             // Instead of SeasonId param which is slow, use collected division IDs
             if (collectedDivisionIds.size > 0) {
                 const allIds = Array.from(collectedDivisionIds);

                 allIds.forEach(did => addTasksForCodes(did, undefined));
             } else if (seasonId) {
                 // Fallback if structure fetch failed or no divisions found (unlikely)
                 console.warn(`[useLeagueStats] No divisions found in structure, falling back to SeasonId fetch (may be slow)`);
                 addTasksForCodes(undefined, undefined); // Will use seasonId from context
             }
          }

          const responses = await Promise.all(fetchTasks.map(t => t.promise));
          
          // Process all responses
          let goalieFieldsLogged = false;
          responses.forEach((response, index) => {
             const context = fetchTasks[index].context;
             
             // Handle Response
             let scoringData: any[] = [];
             
             // Check if response is the array itself (some endpoints)
             if (Array.isArray(response)) {
                 scoringData = response;
             } 
             // Check standard Response property
             else if (response?.Response) {
                 const r = response.Response;
                 if (Array.isArray(r)) {
                     scoringData = r;
                  } else if (typeof r === 'object') {
                     // Check for various potential wrapper keys
                     if (Array.isArray(r.PlayerSeasonStats)) scoringData = r.PlayerSeasonStats;
                     else if (Array.isArray(r.PlayerStats)) scoringData = r.PlayerStats;
                     else if (Array.isArray(r.GoalieSeasonStats)) scoringData = r.GoalieSeasonStats;
                     else if (Array.isArray(r.GoalieStats)) scoringData = r.GoalieStats;
                     else if (Array.isArray(r.Players)) scoringData = r.Players; // Legacy
                     else if (Array.isArray(r.Goalies)) scoringData = r.Goalies; // Legacy
                 }
             }



             if (scoringData.length > 0) {
                scoringData.forEach((p: any) => {
                   // Common fields
                   const tId = Number(p.TeamId);
                   const teamInfo = targetTeamsMap.get(tId);
                   
                   // Use context to fill in missing Division info if API didn't return it
                   let divisionName = teamInfo?.divisionName || p.DivisionName || '';
                   let divisionId = teamInfo?.divisionId || Number(p.DivisionId) || 0;
                   
                   // Fallback to context
                   if (!divisionId && context.divisionId) {
                      divisionId = context.divisionId;
                   }
                   if (!divisionName && divisionId && divisionLookup.has(divisionId)) {
                      divisionName = divisionLookup.get(divisionId) || '';
                   }
                   
                   // Log missing division data
                   if (!divisionName && !divisionId) {
                     // console.warn(`[useLeagueStats] Missing division info for player ${p.PlayerName} (TeamId: ${tId})`);
                   }

                   const teamName = p.TeamShortName || teamInfo?.teamName || p.TeamName || p.FullTeamName || '';
                   const name = p.PlayerName || (p.FirstName && p.LastName ? `${p.FirstName} ${p.LastName}` : 'Unknown');
                   // User instruction: "Player/ID/PlayerStats will take the PlayerId"
                   // We prefer PlayerId but fallback to PersonId/Id if missing (e.g. list view)
                   const playerId = p.PlayerId || p.PersonId || p.MemberId || p.Id || 0;

                   const photoDocId = p.PhotoDocId || p.ImageDocId || p.DocId;
                   const avatar = photoDocId ? getPlayerPhotoUrl(photoDocId) : undefined;

                   // Determine Group ID
                   // Use context (if available) or lookup from Division ID
                   const pGroupId = context.divisionGroupId || (divisionId ? divisionIdToGroupId.get(divisionId) : undefined);

                   // Explicitly check context type to prevent miscategorization if fields are missing/similar
                   const isGoalie = context.type === 'goalies';
                   const entryKey = playerId * 100000 + tId;
                   
                   if (isGoalie) {
                       // Detect if this entry carries actual goalie-specific data (SportPositionId=113)
                       // The GoaliesOnly=1 endpoint can return BOTH goalie stat entries (113) with
                       // saves/minutes/SV% AND skater stat entries for the same player without those fields.
                       // We use this flag to protect goalie-specific fields from being clobbered during merge.
                       const sportPosId = Number(p.SportPositionId || p.PositionId || 0);
                       const isGoalieStatEntry = sportPosId === 113;
                       
                       const rawSvPct = resolveNum(p, 'SavePercentage');
                       
                       const gamesPlayed = resolveNum(p, 'GamesPlayed', 'GP');
                       const gamesDressed = resolveNum(p, 'GamesDressed', 'GD') || gamesPlayed;
                       const wins = resolveNum(p, 'Wins', 'W');
                       const losses = resolveNum(p, 'Losses', 'L');
                       const ties = resolveNum(p, 'Ties', 'OvertimeLosses', 'OTL');
                       const shutouts = resolveNum(p, 'Shutouts', 'SO');
                       // API uses "SaversTotal" for saves (not "Saves" or "SavesTotal")
                       const saves = resolveNum(p, 'SaversTotal', 'Saves');
                       const goalsAgainst = resolveNum(p, 'GoalsAgainst', 'GA');
                       // API uses "ShotsTotal" for shots against
                       const shotsAgainst = resolveNum(p, 'ShotsTotal', 'ShotsAgainst') || (saves + goalsAgainst);
                       const goals = resolveNum(p, 'Goals', 'G');
                       const assists = resolveNum(p, 'Assists', 'A');
                       const points = resolveNum(p, 'Points', 'Pts') || (goals + assists);
                       const pim = resolveNum(p, 'PenaltyMin', 'PIM');
                       let minutes = resolveNum(p, 'MinutesPlayed', 'Min');
                       
                       // Calculate GAA and SV% from raw data if API didn't provide them
                       const rawGAA = resolveNum(p, 'GoalsAgainstAverage', 'GAA');
                       
                       // Back-calculate minutes from GAA + GA if the API doesn't return minutes directly
                       // GAA = GA * 60 / MIN → MIN = GA * 60 / GAA
                       if (!minutes && rawGAA > 0 && goalsAgainst > 0) {
                           minutes = Math.round((goalsAgainst * 60) / rawGAA);
                       }
                       
                       const calculatedGAA = minutes > 0 ? (goalsAgainst * 60) / minutes : 0;
                       const calculatedSvPct = shotsAgainst > 0 ? (saves / shotsAgainst) * 100 : 0;
                       
                       // Determine if this entry has meaningful goalie data
                       const hasGoalieData = isGoalieStatEntry || saves > 0 || rawSvPct > 0 || rawGAA > 0;

                       if (goaliesMap.has(entryKey)) {
                          // Merge Stats
                          const existing = goaliesMap.get(entryKey)!;
                          
                          if (hasGoalieData) {
                              // This entry has real goalie data — merge goalie-specific fields
                              existing.gamesPlayed += gamesPlayed;
                              existing.gamesDressed += gamesDressed;
                              existing.wins += wins;
                              existing.losses += losses;
                              existing.ties += ties;
                              existing.shutouts += shutouts;
                              existing.saves += saves;
                              existing.goalsAgainst += goalsAgainst;
                              existing.shotsAgainst += shotsAgainst;
                              existing.minutes += minutes;
                              existing.goals += goals;
                              existing.assists += assists;
                              existing.points += points;
                              existing.pim += pim;
                              
                              // Recalculate Averages after merge
                              if (existing.minutes > 0) {
                                  existing.gaa = (existing.goalsAgainst * 60) / existing.minutes;
                              }
                              if (existing.shotsAgainst > 0 && existing.saves > 0) {
                                  existing.savePercentage = (existing.saves / existing.shotsAgainst) * 100;
                              }
                          } else {
                              // Non-goalie stat entry (e.g. skater stats for same player)
                              // Only merge non-goalie fields; do NOT touch saves/SV%/GAA/minutes
                              existing.goals += goals;
                              existing.assists += assists;
                              existing.points += points;
                              existing.pim += pim;
                          }
                       } else {
                           // Create New Entry
                           const goalieEntry: LeagueGoalieStat = {
                              player: name,
                              playerId: playerId,
                              jerseyNumber: resolveStr(p, 'PlayerNo', 'JerseyNumber'),
                              team: teamName,
                              teamId: tId,
                              teamLogoUrl: teamInfo?.teamLogoUrl,
                              gamesPlayed,
                              gamesDressed,
                              wins,
                              losses,
                              ties,
                              gaa: rawGAA || calculatedGAA,
                              savePercentage: rawSvPct > 0 ? (rawSvPct <= 1 ? rawSvPct * 100 : rawSvPct) : calculatedSvPct,
                              shutouts,
                              saves,
                              goalsAgainst,
                              shotsAgainst,
                              goals,
                              assists,
                              points,
                              pim,
                              minutes,
                              division: divisionName,
                              divisionId: divisionId,
                              divisionGroupId: pGroupId,
                              avatar: avatar,
                              photoDocId: photoDocId
                           };
                           goaliesMap.set(entryKey, goalieEntry);
                       }
                   } else {
                       // Player
                       const gamesPlayed = resolveNum(p, 'GamesPlayed', 'GP');
                       const goals = resolveNum(p, 'Goals', 'G');
                       const assists = resolveNum(p, 'Assists', 'A');
                       const points = resolveNum(p, 'Points', 'Pts') || (goals + assists);
                       const shots = resolveNum(p, 'Shots');
                       const plusMinus = resolveNum(p, 'PlusMinus');
                       const pim = resolveNum(p, 'PenaltyMin', 'PIM');
                       const ppg = resolveNum(p, 'PPGoals');
                       const shg = resolveNum(p, 'SHGoals');
                       const gwg = resolveNum(p, 'GameWinningGoals', 'GWG');
                       const otGoals = resolveNum(p, 'OTGoals');

                       if (playersMap.has(entryKey)) {
                          // Merge Stats
                          const existing = playersMap.get(entryKey)!;
                          existing.gamesPlayed += gamesPlayed;
                          existing.goals += goals;
                          existing.assists += assists;
                          existing.points += points;
                          existing.shots += shots;
                          existing.plusMinus += plusMinus;
                          existing.pim += pim;
                          existing.ppg += ppg;
                          existing.shg += shg;
                          existing.gwg += gwg;
                          existing.otGoals += otGoals;
                       } else {
                           // Create New Entry
                           const playerEntry: LeaguePlayerStat = {
                              player: name,
                              playerId: playerId,
                              jerseyNumber: resolveStr(p, 'PlayerNo', 'JerseyNumber'),
                              team: teamName,
                              teamId: tId,
                              teamLogoUrl: teamInfo?.teamLogoUrl,
                              position: resolveStr(p, 'SportPositionName', 'Position') || 'F',
                              gamesPlayed,
                              goals,
                              assists,
                              points,
                              shots,
                              plusMinus,
                              pim,
                              ppg,
                              shg,
                              gwg,
                              otGoals,
                              goalsRank: p.GoalsRanking,
                              assistsRank: p.AssistsRanking,
                              division: divisionName,
                              divisionId: divisionId,
                              divisionGroupId: pGroupId,
                              avatar: avatar,
                              photoDocId: photoDocId,
                              sportPositionId: p.SportPositionId
                           };
                           playersMap.set(entryKey, playerEntry);
                       }
                   }
                });
             }
          });

        } catch (err) {
             console.error(`[useLeagueStats] Error fetching bulk stats:`, err);
        }
        
        setProgress(100);

        const allPlayers = Array.from(playersMap.values());
        const allGoalies = Array.from(goaliesMap.values());

        // --- Step 5: Enrich with player photos from roster data ---
        // The PlayerStats API endpoint doesn't return PhotoDocId, so we fetch
        // roster data from teams to cross-reference and fill in player photos.
        try {
          const playersWithoutPhotos = [...allPlayers.filter(p => !p.avatar), ...allGoalies.filter(g => !g.avatar)];
          if (playersWithoutPhotos.length > 0) {
            // Collect unique team IDs that have players missing photos
            const teamIdsNeedingPhotos = new Set<number>();
            playersWithoutPhotos.forEach(p => { if (p.teamId) teamIdsNeedingPhotos.add(p.teamId); });
            

            
            // Fetch rosters in parallel (just 'R' child code for minimal data)
            const rosterPromises = Array.from(teamIdsNeedingPhotos).map(tId =>
              fetchTeamRoster(tId, 'BI', 'R')
                .then(res => ({ teamId: tId, response: res }))
                .catch(err => { console.warn(`[useLeagueStats] Failed to fetch roster for team ${tId}:`, err); return null; })
            );
            
            const rosterResults = await Promise.all(rosterPromises);
            
            // Build PlayerId → PhotoDocId lookup from all rosters
            const photoLookup = new Map<number, number>();
            rosterResults.forEach(result => {
              if (!result || !result.response?.Success || !result.response?.Response?.Team) return;
              const teamData = result.response.Response.Team as any;
              let rosterData: any[] = [];
              if (teamData.Roster) {
                if (Array.isArray(teamData.Roster)) rosterData = teamData.Roster;
                else if (teamData.Roster.Players && Array.isArray(teamData.Roster.Players)) rosterData = teamData.Roster.Players;
                else if (teamData.Roster.Roster && Array.isArray(teamData.Roster.Roster)) rosterData = teamData.Roster.Roster;
              }
              rosterData.forEach((player: any) => {
                const pId = player.PlayerId || player.PersonId || player.Id;
                const docId = player.PhotoDocId || player.ImageDocId;
                if (pId && docId) {
                  photoLookup.set(Number(pId), Number(docId));
                }
              });
            });
            

            
            // Apply photos to players and goalies missing them
            let enrichedCount = 0;
            allPlayers.forEach(p => {
              if (!p.avatar && photoLookup.has(p.playerId)) {
                const docId = photoLookup.get(p.playerId)!;
                p.photoDocId = docId;
                p.avatar = getPlayerPhotoUrl(docId);
                enrichedCount++;
              }
            });
            allGoalies.forEach(g => {
              if (!g.avatar && photoLookup.has(g.playerId)) {
                const docId = photoLookup.get(g.playerId)!;
                g.photoDocId = docId;
                g.avatar = getPlayerPhotoUrl(docId);
                enrichedCount++;
              }
            });
            

          }
        } catch (err) {
          console.warn(`[useLeagueStats] Photo enrichment failed (non-fatal):`, err);
        }

        // Sort globally
        allPlayers.sort((a, b) => b.points - a.points);
        allGoalies.sort((a, b) => b.savePercentage - a.savePercentage);

        // Data quality summary
        // Update Cache
        statsCache.set(cacheKey, { players: allPlayers, goalies: allGoalies, timestamp: Date.now() });

        setPlayers(allPlayers);
        setGoalies(allGoalies);

      } catch (err) {
        console.error('[useLeagueStats] Error:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [seasonId, divisionGroupId, divisionIds, gameType]);

  return { players, goalies, loading, error, progress };
}