import { useState, useMemo, useEffect, Fragment } from 'react';
import { MapPin, ArrowLeft, Download, Calendar as CalendarIcon, Trophy, Shield, Users, Info, ChevronLeft, ChevronRight, Loader2, ExternalLink, TrendingUp, Clock, User, Facebook, Instagram, Youtube, Globe, MessageSquare, FileText, FileSpreadsheet } from 'lucide-react';
import { GameSheetModal } from './GameSheetModal';
import { FacilityMapLink } from './FacilityMapLink';
import { useTeamRoster } from '../hooks/useTeamRoster';
import { useSeasons } from '../hooks/useSeasons';
import { fetchTeams, fetchTeamRoster, fetchPlayerStats, DIVISION_NAMES, getPlayerPhotoUrl } from '../services/sportzsoft';
import { parseGameTime, formatGameDate, formatGameDateLong, parseDateAsLocal, type Game, type Practice, fetchTeamSchedule, mapStandingCategoryCodeToName } from '../services/sportzsoft';
import { fetchTeamRaw, fetchTeamConstraints } from '../services/sportzsoft/api';
import { useDivisionScheduleStatus } from '../hooks/useDivisionScheduleStatus';

// X (Twitter) logo as inline SVG component
function XLogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

import { extractColorsFromImage, DEFAULT_COLORS, type ExtractedColors } from '../utils/color-extractor';
import { Header } from './Header';
import { Footer } from './Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useNavigation } from '../contexts/NavigationContext';
import { useTeamTransactions } from '../hooks/useTeamTransactions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { exportGamesToCalendar, type GameForCalendar } from '../utils/calendar';
import { useTableSort, SortableHeader } from './SortableTable';
import { FranchiseCertificate } from './FranchiseCertificate';
import { TeamEvents } from './TeamEvents';

// Small avatar component for roster tables
function PlayerAvatar({ photoUrl }: { photoUrl: string | null }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-200 bg-gray-100 shrink-0 flex items-center justify-center">
      {photoUrl && !imgError ? (
        <img src={photoUrl} alt="" className="w-full h-full object-cover" onError={() => setImgError(true)} />
      ) : (
        <User className="w-3.5 h-3.5 text-gray-300" />
      )}
    </div>
  );
}

interface TeamDetailPageProps {
  teamId: string;
  teamName: string;
  season?: string;
  teamLogo?: string;
  divisionId?: number;
  initialTab?: string;
  onBack: () => void;
}

interface BenchPersonnel {
  role: string;
  name: string;
}

// ============================================================================
// UNIVERSAL FIELD RESOLVER — mirrors usePlayerProfile.ts
// Tries every known field name variant from the SportzSoft API
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

// Compute GAA: (GoalsAgainst / MinutesPlayed) * 60
// Also handles direct GAA field from API
function computeGAA(obj: any): number {
  const directGAA = resolveNum(obj, 'GoalsAgainstAverage', 'GAA', 'Gaa');
  if (directGAA > 0) return directGAA;
  const ga = resolveNum(obj, 'GoalsAgainst', 'GA', 'GATotal');
  const min = resolveNum(obj, 'MinutesPlayed', 'Min', 'Minutes', 'TOI', 'TimeOnIce', 'Mins', 'MP', 'TotalMinutes', 'TimePlayed');
  if (min <= 0) return 0;
  return (ga / min) * 60;
}

// Compute Save%: returns percentage value (e.g. 91.5)
function computeSavePct(obj: any): number {
  const directSvPct = resolveNum(obj, 'SavePercentage', 'SavePct', 'SvPct', 'SVPct', 'SV_PCT', 'Svpct', 'SavePctg', 'SVPCT', 'SavePercent', 'Sv_Pct');
  if (directSvPct > 0) return directSvPct > 1 ? directSvPct : directSvPct * 100;
  // API uses "SaversTotal" for saves
  const saves = resolveNum(obj, 'Saves', 'SV', 'Svs', 'SVS', 'SaversTotal', 'ShotsStopped', 'SavesMade', 'TotalSaves', 'SavesTotal');
  const ga = resolveNum(obj, 'GoalsAgainst', 'GA', 'GATotal');
  // API uses "ShotsTotal" for shots against
  const sa = resolveNum(obj, 'ShotsAgainst', 'SA', 'ShotsTotal', 'ShotAgainst', 'TotalShots', 'ShotsReceived') || (saves + ga);
  if (sa <= 0) return 0;
  return (saves / sa) * 100;
}

// Compute minutes from GAA and GA: min = GA * 60 / GAA
function computeMinutes(obj: any): number {
  const min = resolveNum(obj, 'MinutesPlayed', 'Min', 'Minutes', 'TOI', 'TimeOnIce', 'Mins', 'MP', 'TotalMinutes', 'TimePlayed');
  if (min > 0) return min;
  const ga = resolveNum(obj, 'GoalsAgainst', 'GA', 'GATotal');
  const gaa = resolveNum(obj, 'GoalsAgainstAverage', 'GAA', 'Gaa');
  if (gaa > 0 && ga > 0) return Math.round((ga * 60) / gaa);
  return 0;
}

export function TeamDetailPage({ teamId, teamName, season, teamLogo, divisionId, initialTab, onBack }: TeamDetailPageProps) {
  const { navigateTo } = useNavigation();
  const [activeTab, setActiveTab] = useState(initialTab || 'home');
  const [benchPersonnel, setBenchPersonnel] = useState<BenchPersonnel[]>([]);
  const [extractedColors, setExtractedColors] = useState<ExtractedColors>(DEFAULT_COLORS);
  const [apiTeamColors, setApiTeamColors] = useState<{ color1: string; color2: string } | null>(null);
  const [teamNamesMap, setTeamNamesMap] = useState<Record<number, string>>({});
  const [teamLogosMap, setTeamLogosMap] = useState<Record<number, string>>({});
  const [isSwitchingSeason, setIsSwitchingSeason] = useState(false);
  
  // State for team data
  const [apiGames, setApiGames] = useState<Game[]>([]);
  const [apiPractices, setApiPractices] = useState<Practice[]>([]);
  const [teamConstraints, setTeamConstraints] = useState<any[]>([]);
  const [constraintsLoading, setConstraintsLoading] = useState(false);
  const [playerStats, setPlayerStats] = useState<any[]>([]);
  const [goalieStats, setGoalieStats] = useState<any[]>([]);
  const [statsGameType, setStatsGameType] = useState<string>('regu');

  // State for season mapping
  const [seasonTeamIdMap, setSeasonTeamIdMap] = useState<Record<string, number>>({});

  // Social media links from raw team data
  const [socialLinks, setSocialLinks] = useState<{
    facebook: string; twitter: string; instagram: string;
    youtube: string; website: string;
  }>({ facebook: '', twitter: '', instagram: '', youtube: '', website: '' });

  // Helper to navigate to a player profile with back context
  const navigateToPlayer = (params: Record<string, any>) => {
    navigateTo('player', {
      ...params,
      fromPage: 'teams',
      fromLabel: `Back to ${teamName}`,
      fromParams: {
        selectedTeamId: currentTeamId,
        selectedTeamName: teamName,
        selectedTeamLogo: teamLogo,
        selectedTeamDivisionId: divisionId,
        selectedTeamTab: activeTab,
        selectedTeamSeason: currentSeason,
      },
    });
  };
  
  // Get season IDs from API
  const { seasonIdsByYear, getCurrentSeasonYear, seasonYears, seasons } = useSeasons();
  const [selectedSeason, setSelectedSeason] = useState('');
  
  // Create reverse mapping: seasonId -> year
  const yearsBySeasonId = useMemo(() => {
    const mapping: Record<number, string> = {};
    seasons.forEach(season => {
      mapping[season.SeasonId] = season.StartYear.toString();
    });
    return mapping;
  }, [seasons]);
  
  // Initialize selected season
  useEffect(() => {
    if (!selectedSeason && seasonYears.length > 0) {
      const initialSeason = season || getCurrentSeasonYear();
      setSelectedSeason(initialSeason);
    }
  }, [season, seasonYears, getCurrentSeasonYear, selectedSeason]);
  
  const currentSeason = selectedSeason || getCurrentSeasonYear();
  const seasonId = seasonIdsByYear[currentSeason] || null;
  
  // Current Team ID being viewed (starts with prop, updates when season changes)
  const [currentTeamId, setCurrentTeamId] = useState<number>(() => parseInt(teamId));

  // Use useTeamRoster with currentTeamId - this will fetch comprehensive data
  // including Schedule (S), Roster (R), TeamRoles (B), SeasonalTeams (H)
  // Note: Stats (P, G) are fetched separately to avoid key collisions in the API response
  const { loading: isLoading, availableSeasons, fullResponse } = useTeamRoster({
    teamId: currentTeamId,
    limiterCode: 'BI',
    childCodes: 'HSRB', 
    autoFetch: true
  });
  
  // Fetch team transactions & protected list
  const { 
    transactions: teamTransactions, 
    protectedList: teamProtectedList, 
    loading: transactionsLoading, 
    error: transactionsError,
    protectedListLoading,
    protectedListError,
  } = useTeamTransactions(currentTeamId, divisionId, teamName, currentSeason);

  // Build a mapping of SeasonId -> TeamId from SeasonalTeams
  useEffect(() => {
    if (fullResponse?.SeasonalTeams && Array.isArray(fullResponse.SeasonalTeams)) {
      setSeasonTeamIdMap(prevMap => {
        const newMap = { ...prevMap };
        fullResponse.SeasonalTeams.forEach((seasonTeam: any) => {
          if (seasonTeam.SeasonId && seasonTeam.TeamId) {
            newMap[seasonTeam.SeasonId.toString()] = seasonTeam.TeamId;
          }
        });
        // Also include the current season's team
        if (fullResponse.SeasonId && fullResponse.TeamId) {
          newMap[fullResponse.SeasonId.toString()] = fullResponse.TeamId;
        }

        return newMap;
      });
    }
  }, [fullResponse]);

  // Fetch raw team data for social media links
  useEffect(() => {
    if (!currentTeamId) return;
    const fetchSocial = async () => {
      try {
        const raw = await fetchTeamRaw(currentTeamId);
        const t = raw?.Response?.Team || raw?.Response || {};
        setSocialLinks({
          facebook: t.FaceBookAccount || t.FacebookAccount || '',
          twitter: t.TwitterAccount || '',
          instagram: t.InstagramAccount || '',
          youtube: t.YouTubeAccount || t.YoutubeAccount || '',
          website: t.WebSite || t.Website || t.WebsiteUrl || '',
        });
      } catch (e) {
        console.warn('[TeamDetailPage] Failed to fetch social links:', e);
      }
    };
    fetchSocial();
  }, [currentTeamId]);

  // Handle season change: switch the currentTeamId
  useEffect(() => {
    if (!seasonId) return;
    
    // Check if we need to switch team ID
    const targetTeamId = seasonTeamIdMap[seasonId.toString()];
    
    if (targetTeamId && targetTeamId !== currentTeamId) {

      setCurrentTeamId(targetTeamId);
    } else if (!targetTeamId && fullResponse && fullResponse.SeasonId !== seasonId) {
      // We don't have the ID for this season yet. 
      // We will try to find it via the name lookup fallback.

      setIsSwitchingSeason(true);
    }
  }, [seasonId, seasonTeamIdMap, currentTeamId, fullResponse]);

  // Fetch stats separately to handle API quirks (duplicate keys)
  useEffect(() => {
    if (!currentTeamId) return;
    
    const fetchStats = async () => {
      try {

        
        // Fetch Skater Stats (P)
        const skaterResponse = await fetchTeamRoster(currentTeamId, 'BI', 'P');
        if (skaterResponse.Success && skaterResponse.Response) {
          const resp = skaterResponse.Response as any;
          const teamData = resp.Team || resp;
          let stats: any[] = [];
          
          if (teamData.PlayerStats) {
             if (Array.isArray(teamData.PlayerStats)) {
               stats = teamData.PlayerStats;
             } else if (teamData.PlayerStats.Players && Array.isArray(teamData.PlayerStats.Players)) {
               stats = teamData.PlayerStats.Players;
             }
          }
          
          // Fallback: check for any array with PlayerId entries
          if (stats.length === 0) {
            const candidateKeys = Object.keys(teamData).filter(k => {
              const v = teamData[k];
              return Array.isArray(v) && v.length > 0 && v[0]?.PlayerId !== undefined;
            });
            if (candidateKeys.length > 0) {

              stats = teamData[candidateKeys[0]];
            }
          }
          

          if (stats.length > 0) {

          }
          setPlayerStats(stats);
        }
        
        // Fetch Goalie Stats (G)
        const goalieResponse = await fetchTeamRoster(currentTeamId, 'BI', 'G');

        
        if (goalieResponse.Success && goalieResponse.Response) {
          const resp = goalieResponse.Response as any;
          // Try multiple paths: Response.Team, Response directly, or Response.Teams[0]
          const teamData = resp.Team || resp;
          

          // Log any array/object fields for discovery
          Object.keys(teamData).forEach(k => {
            const v = teamData[k];
            if (v && typeof v === 'object') {

            }
          });

          // Stats might be in GoalieStats OR PlayerStats (with GoalieFlag)
          let stats: any[] = [];
          
          // Try GoalieStats first
          const goalieArr = teamData.GoalieStats || teamData.GoaliePlayerStats || teamData.GoaliesStats;
          if (goalieArr) {
            if (Array.isArray(goalieArr)) {
              stats = goalieArr;
            } else if (goalieArr.Players && Array.isArray(goalieArr.Players)) {
              stats = goalieArr.Players;
            } else if (typeof goalieArr === 'object') {
              // Single goalie object — wrap in array
              stats = [goalieArr];
            }
          }
          
          // Fallback: PlayerStats (API sometimes puts goalies here with ChildCode G)
          if (stats.length === 0 && teamData.PlayerStats) {
            if (Array.isArray(teamData.PlayerStats)) {
              stats = teamData.PlayerStats;
            } else if (teamData.PlayerStats.Players && Array.isArray(teamData.PlayerStats.Players)) {
              stats = teamData.PlayerStats.Players;
            }
          }
          
          // Fallback: check any other array that might contain stats
          if (stats.length === 0) {
            const candidateKeys = Object.keys(teamData).filter(k => {
              const v = teamData[k];
              return Array.isArray(v) && v.length > 0 && v[0]?.PlayerId !== undefined;
            });
            if (candidateKeys.length > 0) {

              stats = teamData[candidateKeys[0]];
            }
          }
          

          if (stats.length > 0) {

          } else {

          }
          
          // ================================================================
          // SUPPLEMENTAL: G child code gives basic fields (GP, G, A, PTS, PIM)
          // but NOT goalie metrics (Saves, GA, MIN, GAA, SV%). Fetch those
          // from /PlayerStats with goaliesOnly=true, then merge by PlayerId.
          // ================================================================
          if (stats.length > 0) {
            try {
              const sid = seasonId ? Number(seasonId) : null;
              if (sid) {
                // Get divisionId from first goalie entry or team data
                const divId = stats[0]?.DivisionId || teamData.DivisionId;
                const opts: any = { seasonId: sid, goaliesOnly: true, limiterCode: 'BI' };
                if (divId) opts.divisionId = divId;
                

                const supplementResp = await fetchPlayerStats(opts).catch(err => {
                  console.warn('[TeamDetailPage] Supplemental goalie fetch error:', err?.message || err);
                  return null;
                });
                
                if (supplementResp?.Success) {
                  const entries = Array.isArray(supplementResp.Response) ? supplementResp.Response : [];
                  // Build lookup by PlayerId
                  const goalieMetrics = new Map<number, any>();
                  entries.forEach((e: any) => {
                    if (e.TeamId === currentTeamId) {
                      const pid = Number(e.PlayerId || e.PersonId || e.MemberId);
                      if (pid) goalieMetrics.set(pid, e);
                    }
                  });
                  
                  if (goalieMetrics.size > 0) {

                    // Merge goalie metrics into G child code entries
                    stats = stats.map((s: any) => {
                      const pid = Number(s.PlayerId || s.PersonId || s.MemberId);
                      const metrics = goalieMetrics.get(pid);
                      if (metrics) {
                        return { ...s, ...metrics, ...s }; // s fields take priority, but add missing metric fields from /PlayerStats
                      }
                      return s;
                    });
                    // Re-merge: let metrics override 0/null/undefined values in original
                    stats = stats.map((s: any) => {
                      const pid = Number(s.PlayerId || s.PersonId || s.MemberId);
                      const metrics = goalieMetrics.get(pid);
                      if (!metrics) return s;
                      const merged = { ...s };
                      const metricFields = ['Saves', 'GoalsAgainst', 'GA', 'ShotsAgainst', 'SA',
                        'MinutesPlayed', 'Min', 'Minutes', 'Wins', 'W', 'Losses', 'L',
                        'Shutouts', 'SO', 'GamesDressed', 'GD',
                        'GoalsAgainstAverage', 'GAA', 'SavePercentage', 'SavePct', 'SvPct'];
                      metricFields.forEach(f => {
                        if (metrics[f] !== undefined && metrics[f] !== null && (merged[f] === undefined || merged[f] === null || merged[f] === 0)) {
                          merged[f] = metrics[f];
                        }
                      });
                      return merged;
                    });

                  }
                }
              }
            } catch (suppErr) {
              console.warn('[TeamDetailPage] Supplemental goalie metrics failed:', suppErr);
            }
          }
          
          setGoalieStats(stats);
        } else {

           setGoalieStats([]);
        }
        
      } catch (err) {
        console.error('[TeamDetailPage] Error fetching separate stats:', err);
        setPlayerStats([]);
        setGoalieStats([]);
      }
    };
    
    fetchStats();
  }, [currentTeamId, seasonId, seasonTeamIdMap, seasons]);

  // Fetch practices separately via the Schedule endpoint
  useEffect(() => {
    if (!currentTeamId) return;
    
    const fetchPractices = async () => {
      try {

        const response = await fetchTeamSchedule(
          currentTeamId,
          false,  // includeGames - we already have them
          true,   // includePractices
          'B',
          ''
        );
        
        if (response.Success && response.Response?.Schedule?.Practices) {
          const practices = response.Response.Schedule.Practices;

          setApiPractices(practices);
        } else {

          setApiPractices([]);
        }
      } catch (err) {
        console.error('[TeamDetailPage] Error fetching practices:', err);
        setApiPractices([]);
      }
    };
    
    fetchPractices();
  }, [currentTeamId]);

  // Fetch team schedule constraints via ChildCode=C
  useEffect(() => {
    if (!currentTeamId) return;
    
    const fetchConstraints = async () => {
      setConstraintsLoading(true);
      try {
        const response = await fetchTeamConstraints(currentTeamId);
        
        // Try multiple paths to find the team object — API response may or may not be wrapped
        const team = response?.Response?.Team || response?.Team || response?.Response || response;
        
        if (!team || typeof team !== 'object') {
          console.log('[TeamDetailPage] No Team data in constraints response');
          setTeamConstraints([]);
          setConstraintsLoading(false);
          return;
        }

        console.log(`[TeamDetailPage] Constraints response keys:`, Object.keys(team));

        // Extract constraints — try every plausible field name
        let constraints = team.Constraints || team.ScheduleConstraints || team.TeamConstraints 
          || team.TeamScheduleConstraints || team.SchedulingConstraints || null;
        
        // If none of the known keys worked, search for any array field that looks like constraints
        if (!constraints) {
          for (const key of Object.keys(team)) {
            const val = team[key];
            if (Array.isArray(val) && val.length > 0 && val[0] && typeof val[0] === 'object') {
              const firstItem = val[0];
              const itemKeys = Object.keys(firstItem);
              const looksLikeConstraint = itemKeys.some(k => 
                /day|constraint|usage|start|end|earliest|latest/i.test(k)
              );
              if (looksLikeConstraint) {
                console.log(`[TeamDetailPage] Found constraints in field "${key}" (${val.length} items)`, Object.keys(val[0]));
                constraints = val;
                break;
              }
            }
          }
        }
        
        if (!constraints) {
          console.log('[TeamDetailPage] No constraint data found in any field');
          setTeamConstraints([]);
          setConstraintsLoading(false);
          return;
        }

        const constraintList = Array.isArray(constraints) ? constraints : [constraints];
        console.log(`[TeamDetailPage] Team ${currentTeamId} constraints: ${constraintList.length} items`, constraintList.length > 0 ? Object.keys(constraintList[0]) : 'empty');
        setTeamConstraints(constraintList.filter((c: any) => c && typeof c === 'object'));
      } catch (err) {
        console.error('[TeamDetailPage] Error fetching team constraints:', err);
        setTeamConstraints([]);
      } finally {
        setConstraintsLoading(false);
      }
    };

    fetchConstraints();
  }, [currentTeamId]);

  // Extract data from fullResponse when it changes
  useEffect(() => {
    if (!fullResponse) return;



    // 0. Team Colors from API (TeamColor1, TeamColor2 fields)
    const color1 = resolveStr(fullResponse, 'TeamColor1', 'TeamColour1', 'HomeColor', 'HomeColour1', 'PrimaryColor');
    const color2 = resolveStr(fullResponse, 'TeamColor2', 'TeamColour2', 'AwayColor', 'AwayColour1', 'SecondaryColor');
    if (color1 || color2) {

      setApiTeamColors({ color1: color1 || '', color2: color2 || '' });
    }

    // 1. Schedule
    if (fullResponse.Schedule || fullResponse.GameSchedule) {
      // Handle both Schedule and GameSchedule keys
      const scheduleData = fullResponse.Schedule || fullResponse.GameSchedule;
      let games: any[] = [];
      
      if (Array.isArray(scheduleData)) {
        games = scheduleData;
      } else if (scheduleData.Games && Array.isArray(scheduleData.Games)) {
        games = scheduleData.Games;
      }
      
      // Filter just in case, though usually child code S returns only this team's games
      const teamGames = games.filter(
        (game: any) => game.HomeTeamId === currentTeamId || game.VisitorTeamId === currentTeamId
      );

      // Debug: log GameComments presence
      const gamesWithComments = teamGames.filter((g: any) => g.SchedulingComments || g.GameComments);
      if (gamesWithComments.length > 0) {
        console.log(`[TeamDetailPage] ${gamesWithComments.length} games have comments:`, gamesWithComments.map((g: any) => ({ GameId: g.GameId, SchedulingComments: g.SchedulingComments, GameComments: g.GameComments })));
      } else if (teamGames.length > 0) {
        console.log('[TeamDetailPage] First game keys:', Object.keys(teamGames[0]));
        console.log('[TeamDetailPage] No games have comments. SchedulingComments:', teamGames[0]?.SchedulingComments, 'GameComments:', teamGames[0]?.GameComments);
      }

      setApiGames(teamGames);
    } else {
      setApiGames([]);
    }

    // Note: Stats are now handled by the separate useEffect above
    
    // 4. Bench Personnel (TeamRoles)
    if (fullResponse.TeamRoles && Array.isArray(fullResponse.TeamRoles)) {
      const benchStaff = fullResponse.TeamRoles.filter((role: any) => 
        role.TeamRoleClassification === 'Bench'
      );
      
      // Sort priority: Head Coach first, then Asst Coaches, Trainers, Managers, then others
      function getRolePriority(roleName: string): number {
        if (roleName === 'Head Coach') return 1;
        if (roleName.includes('Asst Coach')) return 2;
        if (roleName.includes('Trainer')) return 3;
        if (roleName.includes('Manager')) return 4;
        return 5;
      }
      
      // Keep ALL bench personnel — no deduplication
      const staffList: BenchPersonnel[] = benchStaff
        .map((role: any) => {
          const roleName = role.Role || '';
          const personName = role.Name || `${role.FirstName || ''} ${role.LastName || ''}`.trim();
          return { role: roleName, name: personName || 'TBD' };
        })
        .sort((a: BenchPersonnel, b: BenchPersonnel) => getRolePriority(a.role) - getRolePriority(b.role));
      
      setBenchPersonnel(staffList.length > 0 ? staffList : [
        { role: 'Head Coach', name: 'TBD' },
        { role: 'Asst Coach', name: 'TBD' }
      ]);
    } else {
      setBenchPersonnel([
        { role: 'Head Coach', name: 'TBD' },
        { role: 'Asst Coach', name: 'TBD' }
      ]);
    }

  }, [fullResponse, currentTeamId]);

  
  // Build season dropdown based on available seasons from API
  const teamSeasonYears = useMemo(() => {
    if (!availableSeasons || availableSeasons.length === 0) {
      return seasonYears;
    }
    // Convert season IDs to years using the reverse mapping
    const years = availableSeasons
      .map(seasonIdStr => {
        const seasonIdNum = parseInt(seasonIdStr);
        const year = yearsBySeasonId[seasonIdNum];
        return year;
      })
      .filter(year => year !== undefined);
    
    // Sort years in descending order (newest first)
    const sortedYears = [...years].sort((a, b) => parseInt(b) - parseInt(a));
    return sortedYears;
  }, [availableSeasons, seasonYears, yearsBySeasonId]);
  
  // Helper to get standing category code from a stat entry
  const getStatCategory = (stat: any): string => {
    const code = resolveStr(stat, 'StandingCategoryCode', 'StandingCode', 'CategoryCode', 'Standing');
    return code ? code.toLowerCase() : '';
  };

  // Filter stats by game type, or aggregate when 'all'
  const filteredPlayerStats = useMemo(() => {
    if (!playerStats.length) return [];
    
    // Check if the data actually has category codes
    const hasCategories = playerStats.some((s: any) => getStatCategory(s));
    if (!hasCategories) return playerStats; // No category info, return as-is
    
    if (statsGameType === 'all') {
      // Aggregate stats per player across all categories
      const byPlayer = new Map<number, any>();
      playerStats.forEach((s: any) => {
        const pid = s.PlayerId;
        if (!byPlayer.has(pid)) {
          byPlayer.set(pid, { ...s });
        } else {
          const existing = byPlayer.get(pid)!;
          ['GamesPlayed', 'GP', 'Goals', 'G', 'GoalsScored', 'Assists', 'A', 'AssistsTotal',
           'Points', 'Pts', 'TotalPoints', 'PenaltyMin', 'PenaltyMinutes', 'PIM', 'PenMin', 'Penalties', 'PenMins',
           'PPGoals', 'PowerPlayGoals', 'PPG', 'PP', 'SHGoals', 'ShortHandedGoals', 'SHG', 'SH',
           'GameWinningGoals', 'GWG'].forEach(key => {
            if (s[key] !== undefined && s[key] !== null) {
              existing[key] = (existing[key] || 0) + (Number(s[key]) || 0);
            }
          });
        }
      });
      return Array.from(byPlayer.values());
    }
    
    return playerStats.filter((s: any) => getStatCategory(s) === statsGameType);
  }, [playerStats, statsGameType]);

  const filteredGoalieStats = useMemo(() => {
    if (!goalieStats.length) return [];
    
    const hasCategories = goalieStats.some((s: any) => getStatCategory(s));
    if (!hasCategories) return goalieStats;
    
    if (statsGameType === 'all') {
      const byPlayer = new Map<number, any>();
      goalieStats.forEach((g: any) => {
        const pid = g.PlayerId;
        if (!byPlayer.has(pid)) {
          byPlayer.set(pid, { ...g });
        } else {
          const existing = byPlayer.get(pid)!;
          ['GamesPlayed', 'GP', 'GamesDressed', 'GD', 'Dressed',
           'Wins', 'W', 'Losses', 'L',
           'GoalsAgainst', 'GA', 'GATotal',
           'Saves', 'SV', 'Svs', 'SVS', 'SaversTotal', 'ShotsStopped', 'SavesMade', 'TotalSaves', 'SavesTotal',
           'ShotsAgainst', 'SA', 'ShotsTotal',
           'MinutesPlayed', 'Min', 'Minutes', 'TOI', 'Mins',
           'Goals', 'G', 'Assists', 'A', 'Points', 'Pts', 'TotalPoints',
           'PenaltyMin', 'PenaltyMinutes', 'PIM', 'PenMin'].forEach(key => {
            if (g[key] !== undefined && g[key] !== null) {
              existing[key] = (existing[key] || 0) + (Number(g[key]) || 0);
            }
          });
          // Clear rate stats so they get recomputed from aggregated counting stats
          delete existing.GoalsAgainstAverage;
          delete existing.GAA;
          delete existing.Gaa;
          delete existing.SavePercentage;
          delete existing.SavePct;
          delete existing.SvPct;
        }
      });
      return Array.from(byPlayer.values());
    }
    
    return goalieStats.filter((g: any) => getStatCategory(g) === statsGameType);
  }, [goalieStats, statsGameType]);
  
  // Roster derivation directly from fullResponse.Roster
  const roster = useMemo(() => {
    if (!fullResponse || !fullResponse.Roster) {
      return [];
    }

    let rosterData: any[] = [];
    if (Array.isArray(fullResponse.Roster)) {
      rosterData = fullResponse.Roster;
    } else if (fullResponse.Roster.Players && Array.isArray(fullResponse.Roster.Players)) {
      rosterData = fullResponse.Roster.Players;
    } else if (fullResponse.Roster.Roster && Array.isArray(fullResponse.Roster.Roster)) {
      rosterData = fullResponse.Roster.Roster;
    }

    if (rosterData.length === 0) return [];

    // Since we are fetching the specific TeamID for the season, 
    // fullResponse.Roster IS the correct roster for the selected season.
    
    return rosterData.map((player: any) => {
      const playerId = player.PlayerId;
      
      // Find stats for this player (use filtered stats to match game type)
      const stats = filteredPlayerStats.find((s: any) => s.PlayerId === playerId);
      const goalie = filteredGoalieStats.find((g: any) => g.PlayerId === playerId);
      
      // Determine if this is primarily a goalie
      const positionName = resolveStr(player, 'SportPositionName', 'PositionName', 'Position', 'Pos').toLowerCase();
      const isGoalie = positionName.includes('goalie') || 
                       positionName.includes('goal') ||
                       positionName === 'g';
      
      const cleanRegNumber = (reg: string | null) => {
         if (!reg) return '-';
         // Remove leading quotes if present
         return reg.replace(/^'/, '');
      };

      return {
        playerId,
        number: resolveStr(player, 'PlayerNo', 'PlayerNumber', 'JerseyNumber', 'Number', 'No', 'Jersey') || '0',
        name: resolveStr(player, 'Name', 'PlayerName', 'FullName') || 'Unknown',
        firstName: (resolveStr(player, 'Name', 'PlayerName') || '').split(' ')[0] || '',
        lastName: (resolveStr(player, 'Name', 'PlayerName') || '').split(' ').slice(1).join(' ') || '',
        position: resolveStr(player, 'SportPositionName', 'PositionName', 'Position', 'Pos') || '-',
        age: player.Age ? Math.floor(player.Age).toString() : '-', 
        height: player.Height || '-',
        weight: player.Weight || '-',
        startDate: player.DateStarted ? parseDateAsLocal(player.DateStarted).toLocaleDateString() : '-',
        regNumber: cleanRegNumber(player.PlayerRegNo2 || player.PlayerRegNo1),
        photoDocId: player.PhotoDocId,
        photoUrl: player.PhotoDocId ? getPlayerPhotoUrl(player.PhotoDocId) : null,
        // Stats
        isGoalie,
        stats: isGoalie && goalie ? {
          gp: resolveNum(goalie, 'GamesPlayed', 'GP'),
          w: resolveNum(goalie, 'Wins', 'W'),
          l: resolveNum(goalie, 'Losses', 'L'),
          gaa: computeGAA(goalie).toFixed(2),
          svPct: computeSavePct(goalie) > 0 ? computeSavePct(goalie).toFixed(1) : '0.0'
        } : stats ? {
          gp: resolveNum(stats, 'GamesPlayed', 'GP'),
          g: resolveNum(stats, 'Goals', 'G', 'GoalsScored'),
          a: resolveNum(stats, 'Assists', 'A', 'AssistsTotal'),
          pts: resolveNum(stats, 'Points', 'Pts', 'TotalPoints'),
          pim: resolveNum(stats, 'PenaltyMin', 'PenaltyMinutes', 'PIM', 'PenMin', 'Penalties', 'PenMins')
        } : null
      };
    }).sort((a: any, b: any) => parseInt(a.number) - parseInt(b.number));

  }, [fullResponse, filteredPlayerStats, filteredGoalieStats]);

  // Extract colors from team logo
  useEffect(() => {
    if (teamLogo) {
      extractColorsFromImage(teamLogo).then(colors => {
        setExtractedColors(colors);
      });
    }
  }, [teamLogo]);
  

  // Fetch all teams to build team name lookup and fallback for season switching
  useEffect(() => {
    const loadTeamNames = async () => {
      if (!seasonId) return;
      
      try {
        // Fetch all teams for the season to build name lookup
        const teamsResponse = await fetchTeams(seasonId, 'BI');
        if (teamsResponse.Success && teamsResponse.Response?.Teams) {
          const nameMap: Record<number, string> = {};
          const logoMap: Record<number, string> = {};
          let fallbackTeamId: number | null = null;

          teamsResponse.Response.Teams.forEach(team => {
            nameMap[team.TeamId] = team.TeamName;
            if (team.PrimaryTeamLogoURL) {
              logoMap[team.TeamId] = team.PrimaryTeamLogoURL;
            }
            
            // Try to match by name for fallback
            if (team.TeamName === teamName) {
              fallbackTeamId = team.TeamId;
            }
          });
          setTeamNamesMap(nameMap);
          setTeamLogosMap(logoMap);
          
          // Fallback Logic: If no mapped ID exists, try to switch to the team with the same name
          const mappedId = seasonTeamIdMap[seasonId.toString()];
          if (!mappedId && fallbackTeamId) {

             setCurrentTeamId(fallbackTeamId);
          }
          setIsSwitchingSeason(false);
        }
      } catch (err) {
        console.error('[TeamDetailPage] Error fetching team names:', err);
        setIsSwitchingSeason(false);
      }
    };
    
    loadTeamNames();
  }, [seasonId, teamName, seasonTeamIdMap]);
  
  // Helper function to get team name by ID
  const getTeamName = (teamId: number) => {
    return teamNamesMap[teamId] || 'Unknown Team';
  };
  
  // Upcoming games for calendar
  const upcomingGames = useMemo(() => {
    const now = new Date();
    return apiGames
      .filter(g => new Date(g.GameDate) >= now)
      .sort((a, b) => new Date(a.GameDate).getTime() - new Date(b.GameDate).getTime())
      .slice(0, 4);
  }, [apiGames]);

  // Determine Division Name (from prop or from data)
  const divisionName = useMemo(() => {
    if (divisionId && DIVISION_NAMES[divisionId]) return DIVISION_NAMES[divisionId];
    if (fullResponse?.DivisionName) return fullResponse.DivisionName;
    return '';
  }, [divisionId, fullResponse]);

  // --- New Enhancements ---
  
  const [scheduleFilter, setScheduleFilter] = useState<'all' | 'games' | 'home' | 'away' | 'practices'>('all');
  const [scheduleGameType, setScheduleGameType] = useState('All Game Types');
  const [rosterGrouping, setRosterGrouping] = useState<'list' | 'position'>('position');
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Table sort states
  const scheduleSort = useTableSort('date', 'asc');
  const practicesSort = useTableSort('date', 'asc');
  const rosterPlayersSort = useTableSort('number', 'asc');
  const rosterGoaliesSort = useTableSort('number', 'asc');
  const rosterGroupSort = useTableSort('number', 'asc');
  const playerStatsSort = useTableSort('pts', 'desc');
  const goalieStatsSort = useTableSort('svPct', 'desc');
  const transactionsSort = useTableSort('date', 'desc');
  const protectedListSort = useTableSort('name', 'asc');

  // Calendar State
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  // Game Sheet Modal State
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [isGameSheetOpen, setIsGameSheetOpen] = useState(false);

  // Compute available game types from this team's games
  const teamGameTypes = useMemo(() => {
    const typeSet = new Set<string>();
    apiGames.forEach(game => {
      const code = game.StandingCategoryCode;
      if (code) {
        const name = mapStandingCategoryCodeToName(code);
        if (name !== 'All Games') typeSet.add(name);
      }
    });
    const types = Array.from(typeSet).sort();
    return types.length > 1 ? ['All Game Types', ...types] : [];
  }, [apiGames]);

  // Fetch schedule status for this team's division
  const teamDivisionIds = useMemo(() => {
    // Collect unique division IDs from the team's games
    const ids = new Set<number>();
    if (divisionId) ids.add(divisionId);
    apiGames.forEach(g => {
      if (g.DivisionId) ids.add(g.DivisionId);
    });
    return Array.from(ids);
  }, [divisionId, apiGames]);

  const { isScheduleFinal: isTeamScheduleFinal, inProgressDivisionIds: teamInProgressDivIds, statusMap: teamStatusMap } = useDivisionScheduleStatus(teamDivisionIds, seasonId ? Number(seasonId) : undefined);

  // Determine if team's schedule is in progress (any of its divisions not finalized)
  // IMPORTANT: Only show "in progress" for the current/latest season. Past seasons are always complete.
  // The API's GameScheduleFinal flag reflects the *current* season's division status, so past-season
  // division IDs would incorrectly show as "in progress" if the same division is still being scheduled.
  const isViewingCurrentSeason = parseInt(currentSeason) >= new Date().getFullYear();
  const isTeamScheduleInProgress = useMemo(() => {
    if (!isViewingCurrentSeason) return false; // Past seasons are always complete
    if (teamDivisionIds.length === 0) return false;
    return teamDivisionIds.some(id => teamInProgressDivIds.has(id));
  }, [teamDivisionIds, teamInProgressDivIds, isViewingCurrentSeason]);

  // Calculate Season Bounds from Games + Practices
  const seasonBounds = useMemo(() => {
    if (apiGames.length === 0 && apiPractices.length === 0) return null;
    
    const gameDates = apiGames.map(g => new Date(g.GameDate).getTime());
    const practiceDates = apiPractices.map(p => new Date(p.PracticeDate).getTime());
    const dates = [...gameDates, ...practiceDates];
    
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    // Adjust to start/end of month for safety
    minDate.setDate(1);
    maxDate.setMonth(maxDate.getMonth() + 1);
    maxDate.setDate(0);
    
    return { min: minDate, max: maxDate };
  }, [apiGames, apiPractices]);

  // Set initial calendar date to first game or today if in season
  useEffect(() => {
    if (apiGames.length > 0 && !seasonBounds?.min) {
       // If bounds aren't ready yet
       return;
    }
    
    if (seasonBounds) {
      const today = new Date();
      if (today >= seasonBounds.min && today <= seasonBounds.max) {
        setCalendarDate(today);
      } else {
        // If today is outside season, default to season start or closest game
        // Find closest game to today? Or just start?
        // Let's default to today if close, otherwise start date
        // Actually, if season is over, show last month?
        // Let's just default to "now" if possible, or min date if "now" is way off.
        // For simplicity, let's default to the current season's first game month if today is far off.
        const firstGameDate = new Date(Math.min(...apiGames.map(g => new Date(g.GameDate).getTime())));
        if (Math.abs(today.getTime() - firstGameDate.getTime()) > 30 * 24 * 60 * 60 * 1000 * 6) { // 6 months
           setCalendarDate(firstGameDate);
        } else {
           setCalendarDate(today);
        }
      }
    }
  }, [seasonBounds]); // Only run when bounds are calculated (on load)

  // Generate Calendar Days
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const days = [];

    if (calendarView === 'month') {
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const startDate = new Date(firstDayOfMonth);
      startDate.setDate(startDate.getDate() - startDate.getDay()); // Back to Sunday

      const endDate = new Date(lastDayOfMonth);
      if (endDate.getDay() < 6) {
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // Forward to Saturday
      }

      // Ensure we have at least 6 weeks for consistency if needed, but standard logic is fine
      const d = new Date(startDate);
      while (d <= endDate) {
        days.push(new Date(d));
        d.setDate(d.getDate() + 1);
      }
    } else {
      // Week View
      const startDate = new Date(calendarDate);
      startDate.setDate(startDate.getDate() - startDate.getDay()); // Back to Sunday
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        days.push(d);
      }
    }
    return days;
  }, [calendarDate, calendarView]);

  const handlePrevDate = () => {
    const newDate = new Date(calendarDate);
    if (calendarView === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    
    // Check bounds
    if (seasonBounds && newDate < seasonBounds.min) {
      // Allow going one step before but maybe visually disable?
      // For now let's just allow it but maybe clamp if way off?
      // User asked to "only show weeks/months that season is active"
      // So we should clamp.
      
      // If month view, and newDate month is before minDate month
      if (calendarView === 'month') {
         const minMonth = new Date(seasonBounds.min);
         minMonth.setDate(1); // Start of start month
         if (newDate < minMonth) return;
      } else {
         // Week view: check if end of new week is before start of season
         const endOfWeek = new Date(newDate);
         endOfWeek.setDate(endOfWeek.getDate() + 6);
         if (endOfWeek < seasonBounds.min) return;
      }
    }
    
    setCalendarDate(newDate);
  };

  const handleNextDate = () => {
    const newDate = new Date(calendarDate);
    if (calendarView === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    
    // Check bounds
    if (seasonBounds && newDate > seasonBounds.max) {
       if (calendarView === 'month') {
         // If new month is strictly after max month
         // maxDate is set to end of month, so just compare
         if (newDate > seasonBounds.max) return;
       } else {
         // Week view: check if start of new week is after season end
         if (newDate > seasonBounds.max) return;
       }
    }
    
    setCalendarDate(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    // Only allow if today is within bounds
    if (seasonBounds && (today < seasonBounds.min || today > seasonBounds.max)) {
       // If today is out of bounds, go to closest bound?
       // Or just do nothing?
       // Let's go to season end if past, start if before
       if (today > seasonBounds.max) setCalendarDate(seasonBounds.max);
       else setCalendarDate(seasonBounds.min);
    } else {
       setCalendarDate(today);
    }
  };
  
  const handleGameClick = (game: any) => {
    const isHomeTeam = game.HomeTeamId === currentTeamId;
    const opponentId = isHomeTeam ? game.VisitorTeamId : game.HomeTeamId;
    
    // Construct Game object for modal
    const isGameFinal = 
      game.GameStatus === 'Final' || 
      game.GameStatus === 'FINAL' || 
      game.GameStatus === 'Played' || 
      (game.HomeScore !== null && game.VisitorScore !== null && new Date(game.GameDate) < new Date());

    const isGameLive = 
      game.GameStatus === 'In Progress' || 
      game.GameStatus === 'Live';

    const isExhibition = game.StandingCategoryCode?.toLowerCase() === 'exhb';

    const modalGame = {
      id: game.GameId ? game.GameId.toString() : '',
      gameNumber: game.GameNumber ? parseInt(game.GameNumber) : undefined, // Try to parse number
      homeTeam: game.HomeTeamName || 'Home Team',
      awayTeam: game.VisitorTeamName || 'Away Team',
      homeScore: game.HomeScore ?? 0,
      awayScore: game.VisitorScore ?? 0,
      homeRecord: '', // Records not available in team detail view
      awayRecord: '',
      date: formatGameDate(game.GameDate),
      fullDate: formatGameDateLong(game.GameDate),
      time: parseGameTime(game.StartTime),
      status: isExhibition ? 'EXHIBITION' as const : isGameFinal ? 'FINAL' : isGameLive ? 'LIVE' : 'UPCOMING',
      homeLogo: game.HomeTeamLogoURL || teamLogosMap[game.HomeTeamId] || '',
      awayLogo: game.VisitorTeamLogoURL || teamLogosMap[game.VisitorTeamId] || '',
      division: game.DivisionName || divisionName,
      location: game.FacilityName,
      venue: game.FacilityName
    };
    
    setSelectedGame(modalGame);
    setIsGameSheetOpen(true);
  };

  // Comprehensive Season Stats Calculation
  const seasonStats = useMemo(() => {
    if (apiGames.length === 0) return null;
    
    let wins = 0, losses = 0, ties = 0;
    let gf = 0, ga = 0;
    let homeRecord = { w: 0, l: 0, t: 0 };
    let awayRecord = { w: 0, l: 0, t: 0 };
    
    // Sort games by date asc for streak calculation
    const completedGames = apiGames
      .filter(g => g.HomeScore !== null && g.VisitorScore !== null)
      .sort((a, b) => new Date(a.GameDate).getTime() - new Date(b.GameDate).getTime());
      
    completedGames.forEach(game => {
      const isHome = game.HomeTeamId === currentTeamId;
      const teamScore = isHome ? game.HomeScore! : game.VisitorScore!;
      const oppScore = isHome ? game.VisitorScore! : game.HomeScore!;
      
      gf += teamScore;
      ga += oppScore;
      
      if (teamScore > oppScore) {
        wins++;
        if (isHome) homeRecord.w++; else awayRecord.w++;
      } else if (teamScore < oppScore) {
        losses++;
        if (isHome) homeRecord.l++; else awayRecord.l++;
      } else {
        ties++;
        if (isHome) homeRecord.t++; else awayRecord.t++;
      }
    });
    
    // Streak Calculation
    let streak = '-';
    if (completedGames.length > 0) {
      let currentStreak = 0;
      let type = ''; // W, L, T
      
      // Iterate backwards
      for (let i = completedGames.length - 1; i >= 0; i--) {
        const game = completedGames[i];
        const isHome = game.HomeTeamId === currentTeamId;
        const teamScore = isHome ? game.HomeScore! : game.VisitorScore!;
        const oppScore = isHome ? game.VisitorScore! : game.HomeScore!;
        
        let result = '';
        if (teamScore > oppScore) result = 'W';
        else if (teamScore < oppScore) result = 'L';
        else result = 'T';
        
        if (i === completedGames.length - 1) {
          type = result;
          currentStreak = 1;
        } else {
          if (result === type) currentStreak++;
          else break;
        }
      }
      streak = `${type}${currentStreak}`;
    }
    
    const calculateLast10 = (games: any[]) => {
      const last10Games = games.slice(-10);
      let w = 0, l = 0, t = 0;
      last10Games.forEach(game => {
        const isHome = game.HomeTeamId === currentTeamId;
        const teamScore = isHome ? game.HomeScore! : game.VisitorScore!;
        const oppScore = isHome ? game.VisitorScore! : game.HomeScore!;
        
        if (teamScore > oppScore) w++;
        else if (teamScore < oppScore) l++;
        else t++;
      });
      return `${w}-${l}-${t}`;
    };

    return {
      gp: completedGames.length,
      w: wins,
      l: losses,
      t: ties,
      pts: (wins * 2) + ties,
      gf,
      ga,
      diff: gf - ga,
      streak,
      home: `${homeRecord.w}-${homeRecord.l}-${homeRecord.t}`,
      away: `${awayRecord.w}-${awayRecord.l}-${awayRecord.t}`,
      last10: calculateLast10(completedGames)
    };
  }, [apiGames, currentTeamId]);

  // Group Roster by Position
  const rosterByPosition = useMemo(() => {
    if (!roster.length) return {};
    
    const groups: Record<string, any[]> = {
      'Goalies': [],
      'Defense': [],
      'Forwards': [],
      'Staff': [] // If any
    };
    
    roster.forEach(player => {
      if (player.isGoalie) {
        groups['Goalies'].push(player);
      } else if (player.position?.toLowerCase().includes('def') || player.position === 'D') {
        groups['Defense'].push(player);
      } else {
        // Default to forwards for others (Center, Wing, Forward, or unknown)
        groups['Forwards'].push(player);
      }
    });
    
    return groups;
  }, [roster]);

  // Build a PlayerId → jersey number lookup from the processed roster
  const jerseyNumberMap = useMemo(() => {
    const map: Record<number, string> = {};
    roster.forEach((p: any) => {
      if (p.playerId && p.number && p.number !== '0') {
        map[p.playerId] = p.number;
      }
    });
    return map;
  }, [roster]);

  // Build a PlayerId → PhotoDocId lookup from the processed roster
  const photoDocIdMap = useMemo(() => {
    const map: Record<number, number> = {};
    roster.forEach((p: any) => {
      if (p.playerId && p.photoDocId) {
        map[p.playerId] = p.photoDocId;
      }
    });
    return map;
  }, [roster]);

  const downloadSchedule = () => {
    if (scheduleFilter === 'practices') {
      // Download practices CSV
      const pHeaders = ['Date', 'Start Time', 'End Time', 'Duration (min)', 'Location', 'Type', 'Notes'];
      const pRows = apiPractices
        .sort((a, b) => new Date(a.PracticeDate).getTime() - new Date(b.PracticeDate).getTime())
        .map(practice => [
          formatGameDate(practice.PracticeDate),
          parseGameTime(practice.StartTime),
          parseGameTime(practice.EndTime),
          practice.Duration,
          `"${(practice.FacilityName || '').replace(/"/g, '""')}"`,
          practice.PracticeType || 'Practice',
          `"${(practice.PracticeComments || '').replace(/"/g, '""')}"`
        ].join(','));
      
      const pCsvContent = "data:text/csv;charset=utf-8," + [pHeaders.join(','), ...pRows].join('\n');
      const pEncodedUri = encodeURI(pCsvContent);
      const pLink = document.createElement("a");
      pLink.setAttribute("href", pEncodedUri);
      pLink.setAttribute("download", `${teamName}_${currentSeason}_Practices.csv`);
      document.body.appendChild(pLink);
      pLink.click();
      document.body.removeChild(pLink);
      setExportModalOpen(false);
      return;
    }
    
    // Generate CSV content
    const headers = ['Game #', 'Date', 'Time', 'Opponent', 'Location', 'Home/Away', 'Result', 'Scheduling Comments', 'Game Comments'];
    const rows = apiGames.map(game => {
      const isHomeTeam = game.HomeTeamId === currentTeamId;
      const opponentId = isHomeTeam ? game.VisitorTeamId : game.HomeTeamId;
      const opponent = getTeamName(opponentId);
      const result = game.HomeScore !== null ? 
        (isHomeTeam ? `${game.HomeScore}-${game.VisitorScore}` : `${game.VisitorScore}-${game.HomeScore}`) : 
        '-';
        
      return [
        `"${game.GameNumber || '-'}"`,
        `"${formatGameDate(game.GameDate)}"`,
        `"${parseGameTime(game.StartTime)}"`,
        `"${(opponent || '').replace(/"/g, '""')}"`,
        `"${(game.FacilityName || '').replace(/"/g, '""')}"`,
        `"${isHomeTeam ? 'Home' : 'Away'}"`,
        `"${result}"`,
        `"${(game.SchedulingComments || '').replace(/"/g, '""')}"`,
        `"${(game.GameComments || '').replace(/"/g, '""')}"`
      ].join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${teamName}_${currentSeason}_Schedule.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportModalOpen(false);
  };

  const handleExportToCalendar = () => {
    if (scheduleFilter === 'practices') {
      // Export practices to calendar
      if (apiPractices.length === 0) {
        alert('No practices to export');
        return;
      }
      const calendarPractices: GameForCalendar[] = apiPractices.map(practice => ({
        id: practice.PracticeId.toString(),
        homeTeam: teamName,
        awayTeam: 'Practice',
        venue: practice.FacilityName,
        date: formatGameDate(practice.PracticeDate),
        fullDate: practice.PracticeDate,
        time: parseGameTime(practice.StartTime),
        division: '',
        status: 'UPCOMING',
      }));
      exportGamesToCalendar(calendarPractices, `${teamName}_${currentSeason}_Practices.ics`);
      setExportModalOpen(false);
      return;
    }

    if (apiGames.length === 0) {
      alert('No games to export');
      return;
    }
    
    const calendarGames: GameForCalendar[] = apiGames.map(game => ({
      id: game.GameId.toString(),
      gameNumber: game.GameNumber?.toString(),
      homeTeam: getTeamName(game.HomeTeamId),
      awayTeam: getTeamName(game.VisitorTeamId),
      venue: game.FacilityName,
      date: formatGameDate(game.GameDate),
      fullDate: game.GameDate,
      time: parseGameTime(game.StartTime),
      division: '',
      status: game.HomeScore !== null ? 'FINAL' : 'UPCOMING',
    }));
    
    exportGamesToCalendar(calendarGames, `${teamName}_${currentSeason}_Schedule.ics`);
    setExportModalOpen(false);
  };

  const handleExportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to export PDF');
      return;
    }

    const pdfStyles = `<style>
  body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
  h1 { color: #013fac; font-size: 22px; margin-bottom: 4px; }
  h2 { color: #666; font-size: 14px; font-weight: normal; margin-top: 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
  th { background: #013fac; color: white; padding: 8px; text-align: left; }
  td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) { background: #f9fafb; }
  @media print { body { padding: 0; } }
</style>`;

    if (scheduleFilter === 'practices') {
      if (apiPractices.length === 0) {
        alert('No practices to export');
        printWindow.close();
        return;
      }
      const practiceRows = apiPractices
        .sort((a, b) => new Date(a.PracticeDate).getTime() - new Date(b.PracticeDate).getTime())
        .map(p => `<tr>
          <td>${formatGameDate(p.PracticeDate)}</td>
          <td>${parseGameTime(p.StartTime)} - ${parseGameTime(p.EndTime)}</td>
          <td>${p.FacilityName || '-'}</td>
          <td>${p.PracticeType || 'Practice'}</td>
          <td>${p.Duration} min</td>
          <td>${p.PracticeComments || ''}</td>
        </tr>`).join('');

      printWindow.document.write(`<!DOCTYPE html><html><head><title>${teamName} - ${currentSeason} Practices</title>${pdfStyles}</head><body>
<h1>${teamName}</h1><h2>${currentSeason} Season Practices</h2>
<table><thead><tr><th>Date</th><th>Time</th><th>Location</th><th>Type</th><th>Duration</th><th>Notes</th></tr></thead>
<tbody>${practiceRows}</tbody></table>
<p style="margin-top: 20px; font-size: 10px; color: #999;">Generated ${new Date().toLocaleDateString()} — Rocky Mountain Lacrosse League</p>
</body></html>`);
      printWindow.document.close();
      setExportModalOpen(false);
      return;
    }

    if (apiGames.length === 0) {
      alert('No games to export');
      printWindow.close();
      return;
    }

    const gameRows = apiGames.map(game => {
      const isHomeTeam = game.HomeTeamId === currentTeamId;
      const opponent = getTeamName(isHomeTeam ? game.VisitorTeamId : game.HomeTeamId);
      const result = game.HomeScore !== null
        ? (isHomeTeam ? `${game.HomeScore}-${game.VisitorScore}` : `${game.VisitorScore}-${game.HomeScore}`)
        : '-';
      const schedulingComment = game.SchedulingComments?.trim();
      const gameComment = game.GameComments?.trim();
      return `<tr>
        <td>${game.GameNumber || '-'}</td>
        <td>${formatGameDate(game.GameDate)}</td>
        <td>${parseGameTime(game.StartTime)}</td>
        <td>${isHomeTeam ? 'vs' : '@'} ${opponent}</td>
        <td>${game.FacilityName}</td>
        <td style="text-align:center">${result}</td>
      </tr>
      ${schedulingComment ? `<tr><td colspan="6" style="padding: 0 8px 6px; font-size: 11px; color: #b45309; font-style: italic;">📝 ${schedulingComment}</td></tr>` : ''}
      ${gameComment ? `<tr><td colspan="6" style="padding: 0 8px 6px; font-size: 11px; color: #3b82f6; font-style: italic;">📝 ${gameComment}</td></tr>` : ''}`;
    }).join('');

    printWindow.document.write(`<!DOCTYPE html><html><head><title>${teamName} - ${currentSeason} Schedule</title>${pdfStyles}</head><body>
<h1>${teamName}</h1><h2>${currentSeason} Season Schedule</h2>
<table><thead><tr><th>Game #</th><th>Date</th><th>Time</th><th>Opponent</th><th>Location</th><th>Result</th></tr></thead>
<tbody>${gameRows}</tbody></table>
<p style="margin-top: 20px; font-size: 10px; color: #999;">Generated ${new Date().toLocaleDateString()} — Rocky Mountain Lacrosse League</p>
</body></html>`);
    printWindow.document.close();
    setExportModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Inject dynamic CSS for team colors */}
      <style>{`
        [data-team-header] {
          background: linear-gradient(135deg, ${extractedColors.primary} 0%, ${extractedColors.secondary} 100%) !important;
        }
        [data-team-border] {
          border-color: ${extractedColors.primary} !important;
        }
        [data-team-accent] {
          color: ${extractedColors.primary} !important;
        }
        [data-team-bg] {
          background-color: ${extractedColors.primary} !important;
        }
        [data-team-bg-light] {
          background-color: ${extractedColors.primary}20 !important;
        }
        [data-state="active"][data-team-tab] {
          border-bottom-color: ${extractedColors.primary} !important;
        }
        [data-team-hover]:hover {
          color: ${extractedColors.primary} !important;
        }
      `}</style>
      
      <Header />
      
      {/* Team Header */}
      <div 
        data-team-header 
        className="text-white py-4 border-b-4"
        style={{ borderBottomColor: extractedColors.primary }}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          {/* Back Button */}
          <button 
            onClick={onBack}
            data-team-hover
            className="flex items-center gap-2 text-sm mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-bold">Back to Teams</span>
          </button>

          {/* Team Info */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Team Logo */}
            {teamLogo && (
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                <ImageWithFallback
                  src={teamLogo}
                  alt={`${teamName} Logo`}
                  className="w-full h-full object-contain rounded-full p-2"
                />
              </div>
            )}

            {/* Team Name & Season Selector */}
            <div className="flex-1">
              {divisionName && (
                <div className="flex items-center gap-2 mb-1 opacity-90">
                  <Badge variant="outline" className="text-white border-white/40 bg-white/10 hover:bg-white/20">
                    {divisionName}
                  </Badge>
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-2">{teamName}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <label htmlFor="team-season-select" className="text-sm font-bold opacity-80 uppercase tracking-wider">
                  Season:
                </label>
                <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                  <SelectTrigger id="team-season-select" className="w-32 h-8 bg-white/10 border-white/20 text-white font-bold hover:bg-white/20">
                    <SelectValue placeholder="Select Season" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamSeasonYears.map((year) => (
                      <SelectItem key={year} value={year} className="font-bold">
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Social Media Icons */}
                {(socialLinks.facebook || socialLinks.twitter || socialLinks.instagram || socialLinks.youtube || socialLinks.website) && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    {socialLinks.website && (
                      <a
                        href={socialLinks.website.startsWith('http') ? socialLinks.website : `https://${socialLinks.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                        title={socialLinks.website}
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                    {socialLinks.facebook && (
                      <a
                        href={socialLinks.facebook.startsWith('http') ? socialLinks.facebook : `https://facebook.com/${socialLinks.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-white/15 hover:bg-[#1877F2] text-white flex items-center justify-center transition-colors"
                        title={socialLinks.facebook}
                      >
                        <Facebook className="w-4 h-4" />
                      </a>
                    )}
                    {socialLinks.twitter && (
                      <a
                        href={socialLinks.twitter.startsWith('http') ? socialLinks.twitter : `https://x.com/${socialLinks.twitter.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-white/15 hover:bg-black text-white flex items-center justify-center transition-colors"
                        title={`@${socialLinks.twitter.replace(/^@/, '')}`}
                      >
                        <XLogoIcon className="w-4 h-4" />
                      </a>
                    )}
                    {socialLinks.instagram && (
                      <a
                        href={`https://instagram.com/${socialLinks.instagram.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-white/15 hover:bg-gradient-to-br hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] text-white flex items-center justify-center transition-colors"
                        title={`@${socialLinks.instagram.replace(/^@/, '')}`}
                      >
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                    {socialLinks.youtube && (
                      <a
                        href={socialLinks.youtube.startsWith('http') ? socialLinks.youtube : `https://youtube.com/${socialLinks.youtube}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-white/15 hover:bg-[#FF0000] text-white flex items-center justify-center transition-colors"
                        title="YouTube"
                      >
                        <Youtube className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Games Ticker */}
      <div className="bg-white border-b-2 border-gray-200 py-3 overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex gap-6 overflow-x-auto scrollbar-hide">
            {upcomingGames.map((game, i) => {
              const isHomeTeam = game.HomeTeamId === currentTeamId;
              const opponentId = isHomeTeam ? game.VisitorTeamId : game.HomeTeamId;
              const opponent = getTeamName(opponentId);
              const gameDate = parseDateAsLocal(game.GameDate);
              const gameResult = game.HomeScore !== null ? 
                (isHomeTeam ? `${game.HomeScore}-${game.VisitorScore}` : `${game.VisitorScore}-${game.HomeScore}`) : 
                null;
              const isExhibitionGame = game.StandingCategoryCode?.toLowerCase() === 'exhb';
              
              return (
                <div 
                  key={i} 
                  className={`flex items-center gap-4 min-w-[280px] px-4 py-2 rounded-lg border cursor-pointer hover:shadow-md transition-all ${
                    isExhibitionGame ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => handleGameClick(game)}
                >
                  <div className="text-center">
                    <div className="text-xs font-bold text-gray-500">
                      {gameDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                    </div>
                    <div className="text-xl font-black">{gameDate.getDate()}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm flex items-center gap-1.5">
                      <Badge variant="outline" className="mb-1">{isHomeTeam ? 'vs' : '@'}</Badge>
                      {isExhibitionGame && (
                        <Badge className="mb-1 bg-amber-600 text-white text-[9px] px-1.5 py-0">Exhibition</Badge>
                      )}
                    </div>
                    <div className="font-bold text-sm">{opponent}</div>
                  </div>
                  {gameResult && !isExhibitionGame ? (
                    <div className="text-right">
                      <div className="font-black text-lg" style={{ color: extractedColors.primary }}>{gameResult}</div>
                      <div className="text-xs text-gray-500">Final</div>
                    </div>
                  ) : (
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-600">{parseGameTime(game.StartTime)}</div>
                      <div className="text-[10px] text-gray-400 font-semibold uppercase">{gameDate.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start h-auto bg-transparent rounded-none border-b-0 p-0 gap-1 overflow-x-auto">
              <TabsTrigger 
                value="home"
                data-team-tab 
                className="rounded-none border-b-4 border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 font-bold"
              >
                Home
              </TabsTrigger>
              <TabsTrigger 
                value="calendar"
                data-team-tab 
                className="rounded-none border-b-4 border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 font-bold"
              >
                Calendar
              </TabsTrigger>
              <TabsTrigger 
                value="schedule"
                data-team-tab 
                className="rounded-none border-b-4 border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 font-bold"
              >
                Schedule
              </TabsTrigger>
              <TabsTrigger 
                value="roster"
                data-team-tab 
                className="rounded-none border-b-4 border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 font-bold"
              >
                Roster
              </TabsTrigger>
              <TabsTrigger 
                value="stats"
                data-team-tab 
                className="rounded-none border-b-4 border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 font-bold"
              >
                Stats
              </TabsTrigger>
              <TabsTrigger 
                value="transactions"
                data-team-tab 
                className="rounded-none border-b-4 border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 font-bold"
              >
                Transactions
              </TabsTrigger>
              <TabsTrigger 
                value="protected-list"
                data-team-tab 
                className="rounded-none border-b-4 border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 font-bold"
              >
                Protected List
              </TabsTrigger>
              <TabsTrigger 
                value="franchise"
                data-team-tab 
                className="rounded-none border-b-4 border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 font-bold"
              >
                Franchise
              </TabsTrigger>
              <TabsTrigger 
                value="events"
                data-team-tab 
                className="rounded-none border-b-4 border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 font-bold"
              >
                Events
              </TabsTrigger>
            </TabsList>

            {/* Tab Content */}
            <div className="py-4">
              {isLoading || isSwitchingSeason ? (
                <div className="flex flex-col items-center justify-center py-32">
                  <Loader2 className="w-16 h-16 text-gray-300 animate-spin mb-4" />
                  <p className="text-xl font-bold text-gray-400">Loading Season Data...</p>
                </div>
              ) : (
                <>
              {/* Home Tab */}
              <TabsContent value="home" className="mt-0 space-y-4">
                
                {/* Season Stats Summary */}
                {seasonStats && (
                  <Card className="border-2 shadow-lg" style={{ borderColor: `${extractedColors.primary}40` }}>
                    <CardHeader 
                      className="border-b-2 rounded-t-lg"
                      style={{ 
                        backgroundColor: extractedColors.primary,
                        borderBottomColor: extractedColors.primary
                      }}
                    >
                      <CardTitle className="text-2xl font-black text-white flex items-center gap-2">
                        <Trophy className="w-6 h-6" />
                        Season Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 divide-x divide-y md:divide-y-0 border-b">
                        <div className="p-4 text-center">
                          <div className="text-xs font-bold text-gray-500 uppercase">GP</div>
                          <div className="text-2xl font-black">{seasonStats.gp}</div>
                        </div>
                        <div className="p-4 text-center bg-gray-50">
                          <div className="text-xs font-bold text-gray-500 uppercase">Record</div>
                          <div className="text-2xl font-black" style={{ color: extractedColors.primary }}>
                            {seasonStats.w}-{seasonStats.l}-{seasonStats.t}
                          </div>
                        </div>
                        <div className="p-4 text-center">
                          <div className="text-xs font-bold text-gray-500 uppercase">Points</div>
                          <div className="text-2xl font-black">{seasonStats.pts}</div>
                        </div>
                        <div className="p-4 text-center bg-gray-50">
                          <div className="text-xs font-bold text-gray-500 uppercase">Streak</div>
                          <div className="text-2xl font-black">{seasonStats.streak}</div>
                        </div>
                        <div className="p-4 text-center">
                          <div className="text-xs font-bold text-gray-500 uppercase">GF</div>
                          <div className="text-2xl font-black text-green-600">{seasonStats.gf}</div>
                        </div>
                        <div className="p-4 text-center bg-gray-50">
                          <div className="text-xs font-bold text-gray-500 uppercase">GA</div>
                          <div className="text-2xl font-black text-red-600">{seasonStats.ga}</div>
                        </div>
                        <div className="p-4 text-center">
                          <div className="text-xs font-bold text-gray-500 uppercase">Diff</div>
                          <div className="text-2xl font-black">
                            {seasonStats.diff > 0 ? '+' : ''}{seasonStats.diff}
                          </div>
                        </div>
                        <div className="p-4 text-center bg-gray-50">
                          <div className="text-xs font-bold text-gray-500 uppercase">L10</div>
                          <div className="text-xl font-black">{seasonStats.last10}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 divide-x">
                        <div className="p-3 text-center">
                          <span className="text-xs text-gray-500 font-bold uppercase mr-2">Home</span>
                          <span className="font-black">{seasonStats.home}</span>
                        </div>
                        <div className="p-3 text-center">
                          <span className="text-xs text-gray-500 font-bold uppercase mr-2">Away</span>
                          <span className="font-black">{seasonStats.away}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Bench Personnel Grid */}
                <Card className="border-2 shadow-lg" style={{ borderColor: `${extractedColors.primary}40` }}>
                  <CardHeader 
                    className="border-b-2 rounded-t-lg"
                    style={{ 
                      backgroundColor: extractedColors.primary,
                      borderBottomColor: extractedColors.primary
                    }}
                  >
                    <CardTitle className="text-xl font-black text-white flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Bench Personnel
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {benchPersonnel.map((person, i) => (
                        <div key={`${person.role}-${i}`} className="bg-white border border-gray-100 rounded-lg p-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5" style={{ borderLeft: `4px solid ${extractedColors.primary}` }}>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm" 
                               style={{ backgroundColor: extractedColors.secondary }}>
                            {person.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="overflow-hidden">
                            <div className="font-bold text-gray-900 truncate" title={person.name}>{person.name}</div>
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide truncate">{person.role}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Games & Upcoming Games */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Recent Games - Horizontal Scroll */}
                  <Card className="border-2 shadow-lg" style={{ borderColor: `${extractedColors.primary}40}` }}>
                    <CardHeader
                      className="border-b-2 rounded-t-lg py-3"
                      style={{
                        backgroundColor: extractedColors.primary,
                        borderBottomColor: extractedColors.primary
                      }}
                    >
                      <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Recent Games
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      {(() => {
                        if (!apiGames.length) return <div className="text-gray-400 italic text-sm text-center py-4">No games played yet</div>;
                        const completedGames = apiGames
                          .filter(g => g.HomeScore !== null && g.VisitorScore !== null)
                          .sort((a, b) => new Date(b.GameDate).getTime() - new Date(a.GameDate).getTime());

                        if (completedGames.length === 0) return <div className="text-gray-400 italic text-sm text-center py-4">No completed games yet</div>;

                        return (
                          <div
                            className="flex gap-2 overflow-x-auto scrollbar-hide"
                            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                          >
                            {completedGames.map((game, idx) => {
                              const isHome = game.HomeTeamId === currentTeamId;
                              const teamScore = isHome ? game.HomeScore! : game.VisitorScore!;
                              const oppScore = isHome ? game.VisitorScore! : game.HomeScore!;
                              const opponentId = isHome ? game.VisitorTeamId : game.HomeTeamId;
                              const opponent = getTeamName(opponentId);
                              const won = teamScore > oppScore;
                              const tied = teamScore === oppScore;
                              const gameNumber = game.GameNumber || game.gameNumber || '';

                              return (
                                <div key={`${game.GameId}-${idx}`} className="flex-shrink-0 w-28 p-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200">
                                  <div className="text-center">
                                    <div className="text-[10px] text-gray-500 font-bold mb-1">
                                      #{gameNumber}
                                    </div>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-white text-xs mx-auto mb-1 ${
                                      won ? 'bg-green-500' : tied ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}>
                                      {won ? 'W' : tied ? 'T' : 'L'}
                                    </div>
                                    <div className="text-[10px] text-gray-500 mb-1">{isHome ? 'vs' : '@'}</div>
                                    <div className="text-xs font-bold text-gray-900 truncate mb-1">{opponent}</div>
                                    <div className="text-sm font-black" style={{ color: won ? '#16a34a' : tied ? '#ca8a04' : '#dc2626' }}>
                                      {teamScore}-{oppScore}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* Upcoming Games - Horizontal Scroll */}
                  <Card className="border-2 shadow-lg" style={{ borderColor: `${extractedColors.primary}40}` }}>
                    <CardHeader
                      className="border-b-2 rounded-t-lg py-3"
                      style={{
                        backgroundColor: extractedColors.primary,
                        borderBottomColor: extractedColors.primary
                      }}
                    >
                      <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        Upcoming Games
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      {(() => {
                        const now = new Date();
                        const futureGames = apiGames
                          .filter(g => new Date(g.GameDate) > now && g.HomeScore === null)
                          .sort((a, b) => new Date(a.GameDate).getTime() - new Date(b.GameDate).getTime());

                        if (futureGames.length === 0) return <div className="text-gray-400 italic text-sm text-center py-4">No upcoming games scheduled</div>;

                        return (
                          <div
                            className="flex gap-2 overflow-x-auto scrollbar-hide"
                            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                          >
                            {futureGames.map((game, idx) => {
                              const isHome = game.HomeTeamId === currentTeamId;
                              const opponentId = isHome ? game.VisitorTeamId : game.HomeTeamId;
                              const opponent = getTeamName(opponentId);
                              const gameDate = parseDateAsLocal(game.GameDate);
                              const daysAway = Math.ceil((gameDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                              const gameDateStr = formatGameDate(game.GameDate);
                              const gameNumber = game.GameNumber || game.gameNumber || '';

                              return (
                                <div key={`${game.GameId}-${idx}`} className="flex-shrink-0 w-28 p-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200">
                                  <div className="text-center">
                                    <div className="text-[10px] text-gray-500 font-bold mb-1">
                                      #{gameNumber}
                                    </div>
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-white text-xs mx-auto mb-1" style={{ backgroundColor: extractedColors.primary }}>
                                      {isHome ? 'H' : 'A'}
                                    </div>
                                    <div className="text-[10px] text-gray-500 mb-1">{isHome ? 'vs' : '@'}</div>
                                    <div className="text-xs font-bold text-gray-900 truncate mb-1">{opponent}</div>
                                    <div className="text-[10px] text-gray-500 mb-1">{gameDateStr}</div>
                                    <div className="text-sm font-black" style={{ color: extractedColors.primary }}>
                                      {daysAway === 0 ? 'TODAY' : daysAway === 1 ? 'TMW' : `${daysAway}d`}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>

                {/* Roster Snapshot & Top Performers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Roster Snapshot */}
                  <Card className="border-2 shadow-lg" style={{ borderColor: `${extractedColors.primary}40` }}>
                    <CardHeader 
                      className="border-b-2 rounded-t-lg py-3"
                      style={{ 
                        backgroundColor: extractedColors.primary,
                        borderBottomColor: extractedColors.primary
                      }}
                    >
                      <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Roster Snapshot
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      {roster.length > 0 ? (() => {
                        const goalies = roster.filter(p => p.isGoalie);
                        const defense = roster.filter(p => !p.isGoalie && (p.position?.toLowerCase().includes('def') || p.position === 'D'));
                        const forwards = roster.filter(p => !p.isGoalie && !(p.position?.toLowerCase().includes('def') || p.position === 'D'));
                        
                        return (
                          <div className="space-y-3">
                            <div className="text-center mb-3">
                              <div className="text-3xl font-black" style={{ color: extractedColors.primary }}>{roster.length}</div>
                              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Players</div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                                <div className="text-xl font-black text-gray-800">{goalies.length}</div>
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Goalies</div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                                <div className="text-xl font-black text-gray-800">{defense.length}</div>
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Defense</div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                                <div className="text-xl font-black text-gray-800">{forwards.length}</div>
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Forwards</div>
                              </div>
                            </div>
                            {apiTeamColors && (apiTeamColors.color1 || apiTeamColors.color2) && (
                              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                <span className="text-xs font-bold text-gray-500 uppercase">Team Colors:</span>
                                <div className="flex gap-1.5">
                                  {apiTeamColors.color1 && (
                                    <span className="text-xs font-semibold text-gray-700">{apiTeamColors.color1}</span>
                                  )}
                                  {apiTeamColors.color1 && apiTeamColors.color2 && (
                                    <span className="text-gray-300">/</span>
                                  )}
                                  {apiTeamColors.color2 && (
                                    <span className="text-xs font-semibold text-gray-700">{apiTeamColors.color2}</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })() : (
                        <div className="text-gray-400 italic text-sm text-center py-4">Roster not yet available</div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Top Performers */}
                  <Card className="border-2 shadow-lg" style={{ borderColor: `${extractedColors.primary}40` }}>
                    <CardHeader 
                      className="border-b-2 rounded-t-lg py-3"
                      style={{ 
                        backgroundColor: extractedColors.primary,
                        borderBottomColor: extractedColors.primary
                      }}
                    >
                      <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Top Performers
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      {filteredPlayerStats.length > 0 || filteredGoalieStats.length > 0 ? (
                        <div className="space-y-3">
                          {/* Top 3 Scorers */}
                          {filteredPlayerStats.length > 0 && (() => {
                            const topScorers = [...filteredPlayerStats]
                              .sort((a, b) => resolveNum(b, 'Points', 'Pts', 'TotalPoints') - resolveNum(a, 'Points', 'Pts', 'TotalPoints'))
                              .slice(0, 3);
                            
                            return topScorers.map((player, idx) => (
                              <div key={player.PlayerId || idx} className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
                                  style={{ backgroundColor: idx === 0 ? '#d4af37' : idx === 1 ? '#a8a8a8' : '#cd7f32' }}>
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <button
                                    onClick={() => navigateToPlayer({ playerId: player.PlayerId, teamId: currentTeamId, seasonId, photoDocId: player.PhotoDocId })}
                                    className="text-sm font-bold hover:underline transition-colors truncate block"
                                    style={{ color: extractedColors.primary }}
                                  >
                                    {resolveStr(player, 'PlayerName', 'Name', 'FullName')}
                                  </button>
                                  <div className="text-[10px] text-gray-500 font-semibold uppercase">
                                    #{jerseyNumberMap[player.PlayerId] || resolveStr(player, 'PlayerNo', 'PlayerNumber', 'JerseyNumber') || '?'} &middot; {resolveStr(player, 'SportPositionName', 'PositionName', 'Position') || '?'}
                                  </div>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                  <div>
                                    <div className="text-sm font-black" style={{ color: extractedColors.primary }}>
                                      {resolveNum(player, 'Points', 'Pts', 'TotalPoints')}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-bold">PTS</div>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {resolveNum(player, 'Goals', 'G')}G {resolveNum(player, 'Assists', 'A')}A
                                  </div>
                                </div>
                              </div>
                            ));
                          })()}
                          
                          {/* Top Goalie */}
                          {filteredGoalieStats.length > 0 && (() => {
                            const topGoalie = [...filteredGoalieStats]
                              .filter(g => resolveNum(g, 'MinutesPlayed', 'Min', 'Minutes', 'TOI', 'Mins') > 0)
                              .sort((a, b) => computeGAA(a) - computeGAA(b))[0];
                            
                            if (!topGoalie) return null;
                            const gaa = computeGAA(topGoalie);
                            const svPct = computeSavePct(topGoalie);
                            
                            return (
                              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white bg-blue-600">
                                  G
                                </div>
                                <div className="flex-1 min-w-0">
                                  <button
                                    onClick={() => navigateToPlayer({ playerId: topGoalie.PlayerId, teamId: currentTeamId, seasonId, photoDocId: topGoalie.PhotoDocId, isGoalie: true })}
                                    className="text-sm font-bold hover:underline transition-colors truncate block"
                                    style={{ color: extractedColors.primary }}
                                  >
                                    {resolveStr(topGoalie, 'PlayerName', 'Name', 'FullName')}
                                  </button>
                                  <div className="text-[10px] text-gray-500 font-semibold uppercase">Top Goaltender</div>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                  <div>
                                    <div className="text-sm font-black" style={{ color: extractedColors.primary }}>
                                      {gaa.toFixed(2)}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-bold">GAA</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-black text-gray-700">
                                      {svPct > 0 ? (svPct * 100).toFixed(1) : '0.0'}%
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-bold">SV%</div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="text-gray-400 italic text-sm text-center py-4">Stats not yet available</div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Calendar Tab */}
              <TabsContent value="calendar" className="mt-0">
                <Card className="border-2 shadow-lg" style={{ borderColor: `${extractedColors.primary}40` }}>
                  <CardHeader 
                    className="border-b-2 rounded-t-lg p-4"
                    style={{ 
                      backgroundColor: extractedColors.primary,
                      borderBottomColor: extractedColors.primary
                    }}
                  >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <CardTitle className="text-xl font-black text-white flex items-center gap-2">
                          <CalendarIcon className="w-5 h-5" />
                          Team Schedule
                        </CardTitle>
                        <div className="flex bg-white/10 rounded-lg p-1">
                          <button
                            onClick={() => setCalendarView('month')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                              calendarView === 'month' ? 'bg-white text-black' : 'text-white hover:bg-white/10'
                            }`}
                          >
                            Month
                          </button>
                          <button
                            onClick={() => setCalendarView('week')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                              calendarView === 'week' ? 'bg-white text-black' : 'text-white hover:bg-white/10'
                            }`}
                          >
                            Week
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-white">
                        <button onClick={handlePrevDate} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="text-lg font-black min-w-[140px] text-center">
                          {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                        <button onClick={handleNextDate} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={handleToday}
                          className="px-3 py-1 text-xs font-bold bg-white/10 hover:bg-white/20 rounded-md border border-white/20 transition-colors"
                        >
                          Today
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Calendar Legend */}
                    {apiPractices.length > 0 && (
                      <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded border-l-2" style={{ borderLeftColor: extractedColors.primary, backgroundColor: `${extractedColors.primary}15` }} />
                          <span className="font-semibold text-gray-600">Games</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded border-l-2 border-l-green-600 bg-green-50" />
                          <span className="font-semibold text-gray-600">Practices</span>
                        </div>
                      </div>
                    )}
                    {/* Days Header */}
                    <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-2 text-center text-xs font-bold text-gray-500 uppercase">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 auto-rows-fr bg-gray-200 gap-px border-b border-gray-200">
                      {calendarDays.map((day, i) => {
                        const isToday = new Date().toDateString() === day.toDateString();
                        const isCurrentMonth = day.getMonth() === calendarDate.getMonth();
                        const dayGames = apiGames.filter(g => new Date(g.GameDate).toDateString() === day.toDateString());
                        const dayPractices = apiPractices.filter(p => new Date(p.PracticeDate).toDateString() === day.toDateString());
                        
                        return (
                          <div 
                            key={i} 
                            className={`min-h-[100px] bg-white p-2 flex flex-col gap-1 ${
                              !isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className={`text-sm font-bold ${
                                isToday 
                                  ? 'bg-red-600 text-white w-6 h-6 flex items-center justify-center rounded-full' 
                                  : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                              }`}>
                                {day.getDate()}
                              </span>
                            </div>
                            
                            <div className="flex-1 flex flex-col gap-1 mt-1">
                              {dayGames.map((game, idx) => {
                                const isHome = game.HomeTeamId === currentTeamId;
                                const opponentId = isHome ? game.VisitorTeamId : game.HomeTeamId;
                                const opponent = getTeamName(opponentId);
                                const isExhGame = game.StandingCategoryCode?.toLowerCase() === 'exhb';
                                
                                return (
                                  <div 
                                    key={idx}
                                    onClick={() => handleGameClick(game)}
                                    className="text-xs p-1.5 rounded border border-l-2 shadow-sm transition-all hover:shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                                    style={{ 
                                      borderLeftColor: isExhGame ? '#d97706' : extractedColors.primary,
                                      backgroundColor: isExhGame ? '#fffbeb' : `${extractedColors.primary}05`,
                                      borderColor: isExhGame ? '#fbbf2440' : `${extractedColors.primary}20`
                                    }}
                                  >
                                    <div className="font-bold truncate" style={{ color: isExhGame ? '#d97706' : extractedColors.primary }}>
                                      {isHome ? 'vs' : '@'} {opponent}
                                      {isExhGame && <span className="text-[9px] ml-1 font-bold text-amber-600">(EXH)</span>}
                                    </div>
                                    <div className="text-gray-500 text-[10px] flex justify-between">
                                      <span>{parseGameTime(game.StartTime)}</span>
                                      {game.HomeScore !== null && !isExhGame && (
                                        <span className="font-bold">
                                          {isHome ? game.HomeScore : game.VisitorScore}-{isHome ? game.VisitorScore : game.HomeScore}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              {dayPractices.map((practice, idx) => (
                                <div 
                                  key={`p-${idx}`}
                                  className="text-xs p-1.5 rounded border border-l-2 shadow-sm"
                                  style={{ 
                                    borderLeftColor: '#16a34a',
                                    backgroundColor: '#f0fdf4',
                                    borderColor: '#bbf7d040'
                                  }}
                                >
                                  <div className="font-bold truncate text-green-700">
                                    {practice.PracticeType || 'Practice'}
                                  </div>
                                  <div className="text-gray-500 text-[10px]">
                                    {parseGameTime(practice.StartTime)}–{parseGameTime(practice.EndTime)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="schedule" className="mt-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                      <button
                        onClick={() => setScheduleFilter('all')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                          scheduleFilter === 'all'
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setScheduleFilter('games')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                          scheduleFilter === 'games'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Games
                      </button>
                      <button
                        onClick={() => setScheduleFilter('home')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                          scheduleFilter === 'home'
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Home
                      </button>
                      <button
                        onClick={() => setScheduleFilter('away')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                          scheduleFilter === 'away'
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Away
                      </button>
                      <button
                        onClick={() => setScheduleFilter('practices')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                          scheduleFilter === 'practices'
                            ? 'bg-green-700 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Practices{apiPractices.length > 0 ? ` (${apiPractices.length})` : ''}
                      </button>
                    </div>

                    {/* Game Type Filter */}
                    {teamGameTypes.length > 0 && scheduleFilter !== 'practices' && (
                      <Select value={scheduleGameType} onValueChange={setScheduleGameType}>
                        <SelectTrigger className="w-[180px] h-9 text-sm font-bold bg-white shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {teamGameTypes.map(type => (
                            <SelectItem key={type} value={type} className="font-bold text-sm">
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => setExportModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-white font-bold text-xs rounded transition-all hover:opacity-90"
                    style={{ background: `linear-gradient(to bottom, ${extractedColors.primary}, ${extractedColors.secondary})` }}
                    aria-label="Export schedule"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                </div>

                <Card className="border-2 shadow-lg" style={{ borderColor: `${extractedColors.primary}40` }}>
                  <CardHeader 
                    className="border-b-2 rounded-t-lg"
                    style={{ 
                      backgroundColor: extractedColors.primary,
                      borderBottomColor: extractedColors.primary
                    }}
                  >
                    <CardTitle className="text-xl font-black text-white">
                      {scheduleFilter === 'all'
                        ? `${currentSeason} Schedule — All${scheduleGameType !== 'All Game Types' ? ` (${scheduleGameType})` : ''}`
                        : scheduleFilter === 'games'
                        ? `${currentSeason} Schedule — All Games${scheduleGameType !== 'All Game Types' ? ` (${scheduleGameType})` : ''}`
                        : scheduleFilter === 'practices'
                        ? `${currentSeason} Practices`
                        : `${currentSeason} ${scheduleFilter === 'home' ? 'Home' : 'Away'} Games${scheduleGameType !== 'All Game Types' ? ` — ${scheduleGameType}` : ''}`
                      }
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {scheduleFilter === 'games' ? (
                      /* ── Games Only View (no practices) ── */
                      (() => {
                        // Filter games by game type
                        const filteredGames = apiGames.filter(game => {
                          if (scheduleGameType !== 'All Game Types') {
                            const gameTypeName = mapStandingCategoryCodeToName(game.StandingCategoryCode || null);
                            if (gameTypeName === 'All Games') return false;
                            const normalizedGameType = gameTypeName.toLowerCase().trim();
                            const normalizedSelectedType = scheduleGameType.toLowerCase().trim();
                            if (normalizedGameType !== normalizedSelectedType &&
                                !normalizedGameType.includes(normalizedSelectedType) &&
                                !normalizedSelectedType.includes(normalizedGameType)) {
                              return false;
                            }
                          }
                          return true;
                        });

                        // Sort games by date
                        const sortedGames = [...filteredGames].sort((a, b) => {
                          const dateA = new Date(a.GameDate).getTime();
                          const dateB = new Date(b.GameDate).getTime();
                          if (dateA !== dateB) return dateA - dateB;
                          return (a.StartTime || '').localeCompare(b.StartTime || '');
                        });

                        return sortedGames.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr style={{ backgroundColor: extractedColors.secondary }}>
                                  <th className="text-center py-2.5 px-3 font-bold text-white">#</th>
                                  <th className="text-left py-2.5 px-3 font-bold text-white">Date</th>
                                  <th className="text-left py-2.5 px-3 font-bold text-white">Type</th>
                                  <th className="text-left py-2.5 px-3 font-bold text-white">Opponent</th>
                                  <th className="text-left py-2.5 px-3 font-bold text-white hidden md:table-cell">Location</th>
                                  <th className="text-center py-2.5 px-3 font-bold text-white">Time</th>
                                  <th className="text-center py-2.5 px-3 font-bold text-white">Result</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sortedGames.map((game, i) => {
                                  const isHomeTeam = game.HomeTeamId === currentTeamId;
                                  const opponentId = isHomeTeam ? game.VisitorTeamId : game.HomeTeamId;
                                  const opponent = getTeamName(opponentId);
                                  const isExhibitionGame = game.StandingCategoryCode?.toLowerCase() === 'exhb';
                                  const result = (game.HomeScore !== null && !isExhibitionGame) ?
                                    (isHomeTeam ? `${game.HomeScore}-${game.VisitorScore}` : `${game.VisitorScore}-${game.HomeScore}`) :
                                    '-';

                                  return (
                                    <Fragment key={i}>
                                      <tr
                                        className={`${(isTeamScheduleInProgress && game.SchedulingComments?.trim()) || game.GameComments?.trim() ? '' : 'border-b border-gray-200'} hover:bg-gray-50 cursor-pointer ${isExhibitionGame ? 'bg-amber-50/50' : ''}`}
                                        onClick={() => handleGameClick(game)}
                                      >
                                        <td className="py-2 px-3 text-center text-sm text-gray-500 font-mono">{game.GameNumber || '-'}</td>
                                        <td className="py-2 px-3 font-semibold">{formatGameDate(game.GameDate)}</td>
                                        <td className="py-2 px-3">
                                          <div className="flex items-center gap-2">
                                            <Badge variant={isHomeTeam ? 'default' : 'outline'} className="text-xs">
                                              {isHomeTeam ? 'vs' : '@'}
                                            </Badge>
                                            <span className="font-bold">{opponent}</span>
                                            {isExhibitionGame && (
                                              <Badge className="bg-amber-600 text-white text-[10px] px-1.5 py-0">Exhibition</Badge>
                                            )}
                                            {game.HomeTeamDivisionId && game.VisitorTeamDivisionId && game.HomeTeamDivisionId !== game.VisitorTeamDivisionId && (
                                              <Badge className="bg-purple-100 text-purple-700 border border-purple-200 text-[10px] px-1.5 py-0">Crossover</Badge>
                                            )}
                                          </div>
                                        </td>
                                        <td className="py-2 px-3 hidden md:table-cell">
                                          <FacilityMapLink venueName={game.FacilityName} className="text-sm" />
                                        </td>
                                        <td className="py-2 px-3 text-center text-sm">{parseGameTime(game.StartTime)}</td>
                                        <td className="py-2 px-3 text-center font-black" style={{ color: extractedColors.primary }}>{result}</td>
                                      </tr>
                                      {((isTeamScheduleInProgress && game.SchedulingComments?.trim()) || game.GameComments?.trim()) && (
                                        <tr className="border-b border-gray-200">
                                          <td colSpan={7} className="py-1 px-3 pb-2">
                                            <div className="flex flex-col gap-0.5">
                                              {isTeamScheduleInProgress && game.SchedulingComments?.trim() && (
                                                <div className="flex items-center gap-1.5">
                                                  <MessageSquare className="w-3 h-3 text-amber-600 flex-shrink-0" />
                                                  <span className="text-xs font-semibold text-amber-700 italic">{game.SchedulingComments}</span>
                                                </div>
                                              )}
                                              {game.GameComments?.trim() && (
                                                <div className="flex items-center gap-1.5">
                                                  <MessageSquare className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                                  <span className="text-xs font-semibold text-blue-600 italic">{game.GameComments}</span>
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
                        ) : (
                          <div className="text-center py-12 text-gray-500 italic">
                            No games scheduled yet for {currentSeason}.
                          </div>
                        );
                      })()
                    ) : scheduleFilter === 'all' ? (
                      /* ── Combined Games + Practices View ── */
                      (() => {
                        // Filter games by game type before combining
                        const filteredGames = apiGames.filter(game => {
                          if (scheduleGameType !== 'All Game Types') {
                            const gameTypeName = mapStandingCategoryCodeToName(game.StandingCategoryCode || null);
                            // Skip games with no matching game type (null/undefined codes map to "All Games")
                            if (gameTypeName === 'All Games') return false;
                            // Case-insensitive and partial matching
                            const normalizedGameType = gameTypeName.toLowerCase().trim();
                            const normalizedSelectedType = scheduleGameType.toLowerCase().trim();
                            if (normalizedGameType !== normalizedSelectedType &&
                                !normalizedGameType.includes(normalizedSelectedType) &&
                                !normalizedSelectedType.includes(normalizedGameType)) {
                              return false;
                            }
                          }
                          return true;
                        });

                        const combinedSchedule = [
                          ...filteredGames.map(g => ({
                            type: 'game' as const,
                            id: g.GameId,
                            gameNumber: g.GameNumber,
                            date: g.GameDate,
                            time: g.StartTime || '',
                            displayTime: parseGameTime(g.StartTime || ''),
                            homeTeamId: g.HomeTeamId,
                            visitorTeamId: g.VisitorTeamId,
                            homeScore: g.HomeScore,
                            visitorScore: g.VisitorScore,
                            homeTeamDivisionId: g.HomeTeamDivisionId,
                            visitorTeamDivisionId: g.VisitorTeamDivisionId,
                          })),
                          ...apiPractices.map(p => ({
                            type: 'practice' as const,
                            id: p.PracticeId,
                            date: p.PracticeDate,
                            time: p.StartTime || '',
                            endTime: p.EndTime || '',
                            displayTime: parseGameTime(p.StartTime || ''),
                            displayEndTime: parseGameTime(p.EndTime || ''),
                            practiceType: p.PracticeType || 'Practice',
                            venue: p.FacilityName,
                            duration: p.Duration,
                            comments: p.PracticeComments,
                          }))
                        ].sort((a, b) => {
                          const dateA = new Date(a.date).getTime();
                          const dateB = new Date(b.date).getTime();
                          if (dateA !== dateB) return dateA - dateB;
                          // If same date, sort by time
                          return a.time.localeCompare(b.time);
                        });

                        return combinedSchedule.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr style={{ backgroundColor: extractedColors.secondary }}>
                                  <th className="text-center py-2.5 px-3 font-bold text-white">#</th>
                                  <th className="text-left py-2.5 px-3 font-bold text-white">Date</th>
                                  <th className="text-left py-2.5 px-3 font-bold text-white">Type</th>
                                  <th className="text-left py-2.5 px-3 font-bold text-white">Description</th>
                                  <th className="text-left py-2.5 px-3 font-bold text-white hidden md:table-cell">Location</th>
                                  <th className="text-center py-2.5 px-3 font-bold text-white">Time</th>
                                  <th className="text-center py-2.5 px-3 font-bold text-white">Result</th>
                                </tr>
                              </thead>
                              <tbody>
                                {combinedSchedule.map((item, idx) => (
                                  <tr
                                    key={`${item.type}-${item.id || idx}`}
                                    className={`border-b border-gray-200 hover:bg-gray-50 ${
                                      item.type === 'game' && item.isExhibition ? 'bg-amber-50/50' : ''
                                    } ${item.type === 'practice' ? 'bg-green-50/30' : ''}`}
                                  >
                                    <td className="py-2.5 px-3 text-center text-sm text-gray-500 font-mono">
                                      {item.type === 'game' ? (item.gameNumber || '-') : '-'}
                                    </td>
                                    <td className="py-2.5 px-3 font-semibold text-sm">
                                      {formatGameDate(item.date)}
                                    </td>
                                    <td className="py-2.5 px-3">
                                      {item.type === 'game' ? (
                                        <Badge variant={item.isHome ? 'default' : 'outline'} className="text-xs">
                                          {item.isHome ? 'vs' : '@'}
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-green-600 text-white text-[10px] px-1.5 py-0.5">
                                          Practice
                                        </Badge>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3">
                                      {item.type === 'game' ? (
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-sm">{item.type === 'game' ? (item.isHome ? item.awayTeam : item.homeTeam) : ''}</span>
                                          {item.standingCategoryCode?.toLowerCase() === 'exhb' && (
                                            <Badge className="bg-amber-600 text-white text-[10px] px-1.5 py-0">Exhibition</Badge>
                                          )}
                                          {item.homeTeamDivisionId && item.visitorTeamDivisionId && item.homeTeamDivisionId !== item.visitorTeamDivisionId && (
                                            <Badge className="bg-purple-100 text-purple-700 border border-purple-200 text-[10px] px-1.5 py-0">Crossover</Badge>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm">{item.practiceType || 'Practice'}</span>
                                          {item.comments && (
                                            <span className="text-xs text-gray-500 truncate max-w-[150px]">{item.comments}</span>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 hidden md:table-cell">
                                      <FacilityMapLink venueName={item.venue} className="text-xs" />
                                    </td>
                                    <td className="py-2.5 px-3 text-center text-sm">
                                      {item.type === 'game' ? item.displayTime : `${item.displayTime} - ${item.displayEndTime}`}
                                    </td>
                                    <td className="py-2.5 px-3 text-center text-sm font-bold">
                                      {item.type === 'game' ? (
                                        item.result !== null ? (
                                          <span className={item.result > 0 ? 'text-green-600' : item.result < 0 ? 'text-red-600' : 'text-gray-500'}>
                                            {item.result > 0 ? `W${item.result}` : item.result < 0 ? `L${Math.abs(item.result)}` : 'T'}
                                          </span>
                                        ) : '-'
                                      ) : (
                                        <span className="text-gray-400">-</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500 italic">
                            No schedule information available for {currentSeason}.
                          </div>
                        );
                      })()
                    ) : scheduleFilter === 'practices' ? (
                      /* ── Practices View ── */
                      apiPractices.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr style={{ backgroundColor: extractedColors.secondary }}>
                                <SortableHeader column="date" label="Date" sort={practicesSort.sort} onSort={practicesSort.toggleSort} className="text-left py-2 px-3 font-bold text-white" dark />
                                <SortableHeader column="type" label="Type" sort={practicesSort.sort} onSort={practicesSort.toggleSort} className="text-left py-2 px-3 font-bold text-white" dark />
                                <SortableHeader column="location" label="Location" sort={practicesSort.sort} onSort={practicesSort.toggleSort} className="text-left py-2 px-3 font-bold hidden md:table-cell text-white" dark />
                                <SortableHeader column="start" label="Start" sort={practicesSort.sort} onSort={practicesSort.toggleSort} className="text-center py-2 px-3 font-bold text-white" dark />
                                <SortableHeader column="end" label="End" sort={practicesSort.sort} onSort={practicesSort.toggleSort} className="text-center py-2 px-3 font-bold text-white" dark />
                                <SortableHeader column="duration" label="Duration" sort={practicesSort.sort} onSort={practicesSort.toggleSort} className="text-center py-2 px-3 font-bold hidden sm:table-cell text-white" dark />
                              </tr>
                            </thead>
                            <tbody>
                              {practicesSort.sortData(apiPractices, (p, col) => {
                                switch (col) {
                                  case 'date': return new Date(p.PracticeDate).getTime();
                                  case 'type': return p.PracticeType || 'Practice';
                                  case 'location': return p.FacilityName || '';
                                  case 'start': return p.StartTime || '';
                                  case 'end': return p.EndTime || '';
                                  case 'duration': return p.Duration || 0;
                                  default: return 0;
                                }
                              }).map((practice, i) => {
                                  const isPast = new Date(practice.PracticeDate) < new Date(new Date().toDateString());
                                  return (
                                    <tr 
                                      key={practice.PracticeId || i} 
                                      className={`border-b border-gray-200 ${isPast ? 'text-gray-400' : 'hover:bg-green-50/50'}`}
                                    >
                                      <td className="py-2 px-3 font-semibold">{formatGameDate(practice.PracticeDate)}</td>
                                      <td className="py-2 px-3">
                                        <div className="flex items-center gap-2">
                                          <Badge className="bg-green-600 text-white text-[10px] px-1.5 py-0.5">
                                            {practice.PracticeType || 'Practice'}
                                          </Badge>
                                          {practice.PracticeComments && (
                                            <span className="text-xs text-gray-500 truncate max-w-[200px]">{practice.PracticeComments}</span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-2 px-3 hidden md:table-cell">
                                        <FacilityMapLink venueName={practice.FacilityName} className="text-sm" />
                                      </td>
                                      <td className="py-2 px-3 text-center text-sm">{parseGameTime(practice.StartTime)}</td>
                                      <td className="py-2 px-3 text-center text-sm">{parseGameTime(practice.EndTime)}</td>
                                      <td className="py-2 px-3 text-center text-sm hidden sm:table-cell">{practice.Duration} min</td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500 italic">
                          No practices scheduled yet for {currentSeason}.
                        </div>
                      )
                    ) : isLoading ? (
                      <div className="text-center py-12 text-gray-500">Loading schedule...</div>
                    ) : apiGames.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr style={{ backgroundColor: extractedColors.secondary }}>
                              <SortableHeader column="gameNum" label="Game #" sort={scheduleSort.sort} onSort={scheduleSort.toggleSort} className="text-center py-2 px-3 font-bold text-white" dark />
                              <SortableHeader column="date" label="Date" sort={scheduleSort.sort} onSort={scheduleSort.toggleSort} className="text-left py-2 px-3 font-bold text-white" dark />
                              <SortableHeader column="opponent" label="Opponent" sort={scheduleSort.sort} onSort={scheduleSort.toggleSort} className="text-left py-2 px-3 font-bold text-white" dark />
                              <SortableHeader column="location" label="Location" sort={scheduleSort.sort} onSort={scheduleSort.toggleSort} className="text-left py-2 px-3 font-bold hidden md:table-cell text-white" dark />
                              <SortableHeader column="time" label="Time" sort={scheduleSort.sort} onSort={scheduleSort.toggleSort} className="text-center py-2 px-3 font-bold text-white" dark />
                              <SortableHeader column="result" label="Result" sort={scheduleSort.sort} onSort={scheduleSort.toggleSort} className="text-center py-2 px-3 font-bold text-white" dark />
                            </tr>
                          </thead>
                          <tbody>
                            {scheduleSort.sortData(
                              apiGames.filter(game => {
                                // Game type filter
                                if (scheduleGameType !== 'All Game Types') {
                                  const gameTypeName = mapStandingCategoryCodeToName(game.StandingCategoryCode || null);
                                  // Skip games with no matching game type (null/undefined codes map to "All Games")
                                  if (gameTypeName === 'All Games') return false;
                                  // Case-insensitive and partial matching
                                  const normalizedGameType = gameTypeName.toLowerCase().trim();
                                  const normalizedSelectedType = scheduleGameType.toLowerCase().trim();
                                  if (normalizedGameType !== normalizedSelectedType &&
                                      !normalizedGameType.includes(normalizedSelectedType) &&
                                      !normalizedSelectedType.includes(normalizedGameType)) {
                                    return false;
                                  }
                                }
                                if (scheduleFilter === 'all' || scheduleFilter === 'games') return true;
                                const isHome = game.HomeTeamId === currentTeamId;
                                return scheduleFilter === 'home' ? isHome : !isHome;
                              }),
                              (game, col) => {
                                const isHome = game.HomeTeamId === currentTeamId;
                                switch (col) {
                                  case 'gameNum': return game.GameNumber || 0;
                                  case 'date': return new Date(game.GameDate).getTime();
                                  case 'opponent': return getTeamName(isHome ? game.VisitorTeamId : game.HomeTeamId);
                                  case 'location': return game.FacilityName || '';
                                  case 'time': return game.StartTime || '';
                                  case 'result': {
                                    if (game.HomeScore === null) return -1;
                                    return isHome ? (game.HomeScore - game.VisitorScore) : (game.VisitorScore - game.HomeScore);
                                  }
                                  default: return 0;
                                }
                              }
                            )
                              .map((game, i) => {
                                const isHomeTeam = game.HomeTeamId === currentTeamId;
                                const opponentId = isHomeTeam ? game.VisitorTeamId : game.HomeTeamId;
                                const opponent = getTeamName(opponentId);
                                const isExhibitionGame = game.StandingCategoryCode?.toLowerCase() === 'exhb';
                                const result = (game.HomeScore !== null && !isExhibitionGame) ? 
                                  (isHomeTeam ? `${game.HomeScore}-${game.VisitorScore}` : `${game.VisitorScore}-${game.HomeScore}`) : 
                                  '-';
                                
                                return (
                                  <Fragment key={i}>
                                  <tr 
                                    className={`${(isTeamScheduleInProgress && game.SchedulingComments?.trim()) || game.GameComments?.trim() ? '' : 'border-b border-gray-200'} hover:bg-gray-50 cursor-pointer ${isExhibitionGame ? 'bg-amber-50/50' : ''}`}
                                    onClick={() => handleGameClick(game)}
                                  >
                                    <td className="py-2 px-3 text-center text-sm text-gray-500 font-mono">{game.GameNumber || '-'}</td>
                                    <td className="py-2 px-3 font-semibold">{formatGameDate(game.GameDate)}</td>
                                    <td className="py-2 px-3">
                                      <div className="flex items-center gap-2">
                                        <Badge variant={isHomeTeam ? 'default' : 'outline'} className="text-xs">
                                          {isHomeTeam ? 'vs' : '@'}
                                        </Badge>
                                        <span className="font-bold">{opponent}</span>
                                        {isExhibitionGame && (
                                          <Badge className="bg-amber-600 text-white text-[10px] px-1.5 py-0">Exhibition</Badge>
                                        )}
                                        {game.HomeTeamDivisionId && game.VisitorTeamDivisionId && game.HomeTeamDivisionId !== game.VisitorTeamDivisionId && (
                                          <Badge className="bg-purple-100 text-purple-700 border border-purple-200 text-[10px] px-1.5 py-0">Crossover</Badge>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-2 px-3 hidden md:table-cell">
                                      <FacilityMapLink venueName={game.FacilityName} className="text-sm" />
                                    </td>
                                    <td className="py-2 px-3 text-center text-sm">{parseGameTime(game.StartTime)}</td>
                                    <td className="py-2 px-3 text-center font-black" style={{ color: extractedColors.primary }}>{result}</td>
                                  </tr>
                                  {((isTeamScheduleInProgress && game.SchedulingComments?.trim()) || game.GameComments?.trim()) && (
                                    <tr className="border-b border-gray-200">
                                      <td colSpan={6} className="py-1 px-3 pb-2">
                                        <div className="flex flex-col gap-0.5">
                                          {isTeamScheduleInProgress && game.SchedulingComments?.trim() && (
                                            <div className="flex items-center gap-1.5">
                                              <MessageSquare className="w-3 h-3 text-amber-600 flex-shrink-0" />
                                              <span className="text-xs font-semibold text-amber-700 italic">{game.SchedulingComments}</span>
                                            </div>
                                          )}
                                          {game.GameComments?.trim() && (
                                            <div className="flex items-center gap-1.5">
                                              <MessageSquare className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                              <span className="text-xs font-semibold text-blue-600 italic">{game.GameComments}</span>
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
                    ) : (
                      <div className="text-center py-12 text-gray-500 italic">
                        The {currentSeason} schedule has not been released yet. Check back soon for game dates and times!
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Schedule Constraints — only show when schedule is in progress */}
                {teamConstraints.length > 0 && isTeamScheduleInProgress && (
                  <Card className="border-2 shadow-lg mt-4" style={{ borderColor: `${extractedColors.primary}40` }}>
                    <CardHeader 
                      className="border-b-2 rounded-t-lg"
                      style={{ 
                        backgroundColor: extractedColors.secondary || extractedColors.primary,
                        borderBottomColor: extractedColors.secondary || extractedColors.primary
                      }}
                    >
                      <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Schedule Constraints
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-100 border-b">
                              <th className="text-left py-2.5 px-4 font-bold text-gray-700">Day</th>
                              <th className="text-left py-2.5 px-4 font-bold text-gray-700">Type</th>
                              <th className="text-left py-2.5 px-4 font-bold text-gray-700">Start</th>
                              <th className="text-left py-2.5 px-4 font-bold text-gray-700">End</th>
                              <th className="text-left py-2.5 px-4 font-bold text-gray-700 hidden md:table-cell">Facility</th>
                              <th className="text-left py-2.5 px-4 font-bold text-gray-700 hidden lg:table-cell">Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teamConstraints.map((constraint: any, idx: number) => {
                              // Resolve fields — API field names may vary
                              const dayOfWeek = constraint.DayOfWeek ?? constraint.DayOfWeekName ?? constraint.Day ?? '';
                              const dayName = typeof dayOfWeek === 'number' 
                                ? ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dayOfWeek] || `Day ${dayOfWeek}`
                                : dayOfWeek;
                              const constraintType = constraint.ConstraintType || constraint.Type || constraint.ConstraintTypeName || constraint.UsageCode || '';
                              const startTime = constraint.StartTime || constraint.EarliestStart || constraint.Start || '';
                              const endTime = constraint.EndTime || constraint.LatestEnd || constraint.End || '';
                              const facility = constraint.FacilityName || constraint.Facility || constraint.FacilityCode || '';
                              const notes = constraint.Comments || constraint.Notes || constraint.ConstraintComments || constraint.Description || '';
                              
                              // Format times if they're in ISO format
                              const formatConstraintTime = (t: string) => {
                                if (!t) return '—';
                                try {
                                  if (t.includes('T')) {
                                    const timePart = t.split('T')[1]?.split('.')[0] || '';
                                    const [h, m] = timePart.split(':').map(Number);
                                    const ampm = h >= 12 ? 'PM' : 'AM';
                                    const h12 = h % 12 || 12;
                                    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
                                  }
                                  return t;
                                } catch { return t; }
                              };

                              // Map constraint type codes to readable names
                              const typeLabel = (() => {
                                const code = constraintType.toString().toUpperCase();
                                if (code === 'A' || code === 'AVAILABLE') return 'Available';
                                if (code === 'U' || code === 'UNAVAILABLE' || code === 'N') return 'Unavailable';
                                if (code === 'P' || code === 'PREFERRED') return 'Preferred';
                                if (code === 'H' || code === 'HOME') return 'Home';
                                if (code === 'V' || code === 'VISITOR' || code === 'AWAY') return 'Away';
                                return constraintType || '—';
                              })();

                              const isUnavailable = typeLabel === 'Unavailable';

                              return (
                                <tr key={idx} className={`border-b last:border-b-0 ${isUnavailable ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                                  <td className="py-2.5 px-4 font-semibold">{dayName || '—'}</td>
                                  <td className="py-2.5 px-4">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                                      isUnavailable 
                                        ? 'bg-red-100 text-red-700'
                                        : typeLabel === 'Preferred'
                                        ? 'bg-green-100 text-green-700'
                                        : typeLabel === 'Available'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {typeLabel}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4 font-mono text-xs">{formatConstraintTime(startTime)}</td>
                                  <td className="py-2.5 px-4 font-mono text-xs">{formatConstraintTime(endTime)}</td>
                                  <td className="py-2.5 px-4 hidden md:table-cell">{facility || '—'}</td>
                                  <td className="py-2.5 px-4 hidden lg:table-cell text-gray-500 text-xs">{notes || '—'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {constraintsLoading && (
                  <div className="flex items-center gap-2 mt-4 text-gray-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading schedule constraints...
                  </div>
                )}
              </TabsContent>

              {/* Roster Tab */}
              <TabsContent value="roster" className="mt-0">
                <div className="flex justify-end mb-4">
                  <div className="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                    <button
                      onClick={() => setRosterGrouping('position')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 ${
                        rosterGrouping === 'position' 
                          ? 'bg-gray-900 text-white' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Users className="w-3 h-3" />
                      By Position
                    </button>
                    <button
                      onClick={() => setRosterGrouping('list')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 ${
                        rosterGrouping === 'list' 
                          ? 'bg-gray-900 text-white' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Info className="w-3 h-3" />
                      List View
                    </button>
                  </div>
                </div>

                {rosterGrouping === 'list' ? (
                  <div className="space-y-6">
                    {isLoading ? (
                      <div className="text-center py-12 text-gray-500">Loading roster...</div>
                    ) : roster.length > 0 ? (
                      <>
                        {/* Player Stats Table */}
                        {roster.filter((p: any) => !p.isGoalie).length > 0 && (
                          <Card className="border-2 shadow-lg" style={{ borderColor: `${extractedColors.primary}40` }}>
                            <CardHeader 
                              className="border-b-2 rounded-t-lg"
                              style={{ backgroundColor: extractedColors.primary, borderBottomColor: extractedColors.primary }}
                            >
                              <CardTitle className="text-xl font-black text-white">Players</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="overflow-x-auto">
                                <table className="w-full font-sans whitespace-nowrap">
                                  <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                      <SortableHeader column="number" label="#" sort={rosterPlayersSort.sort} onSort={rosterPlayersSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider" />
                                      <SortableHeader column="name" label="NAME" sort={rosterPlayersSort.sort} onSort={rosterPlayersSort.toggleSort} className="px-3 py-2.5 text-left text-xs font-bold text-gray-500 tracking-wider" />
                                      <SortableHeader column="pos" label="POS" sort={rosterPlayersSort.sort} onSort={rosterPlayersSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider" />
                                      <SortableHeader column="gp" label="GP" sort={rosterPlayersSort.sort} onSort={rosterPlayersSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider" />
                                      <SortableHeader column="g" label="G" sort={rosterPlayersSort.sort} onSort={rosterPlayersSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider" />
                                      <SortableHeader column="a" label="A" sort={rosterPlayersSort.sort} onSort={rosterPlayersSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider" />
                                      <SortableHeader column="pts" label="PTS" sort={rosterPlayersSort.sort} onSort={rosterPlayersSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider" />
                                      <SortableHeader column="pim" label="PIM" sort={rosterPlayersSort.sort} onSort={rosterPlayersSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider hidden md:table-cell" />
                                      <SortableHeader column="age" label="Age" sort={rosterPlayersSort.sort} onSort={rosterPlayersSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider hidden lg:table-cell" />
                                      <SortableHeader column="ht" label="Ht" sort={rosterPlayersSort.sort} onSort={rosterPlayersSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider hidden lg:table-cell" />
                                      <SortableHeader column="wt" label="Wt" sort={rosterPlayersSort.sort} onSort={rosterPlayersSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider hidden xl:table-cell" />
                                      <SortableHeader column="startDate" label="START" sort={rosterPlayersSort.sort} onSort={rosterPlayersSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider hidden xl:table-cell" />
                                      <SortableHeader column="regNum" label="REG #" sort={rosterPlayersSort.sort} onSort={rosterPlayersSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider hidden xl:table-cell" />
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {rosterPlayersSort.sortData(roster.filter((p: any) => !p.isGoalie), (p: any, col) => {
                                      switch (col) {
                                        case 'number': return parseInt(p.number) || 0;
                                        case 'name': return p.name || '';
                                        case 'pos': return p.position || '';
                                        case 'gp': return p.stats?.gp ?? -1;
                                        case 'g': return p.stats?.g ?? -1;
                                        case 'a': return p.stats?.a ?? -1;
                                        case 'pts': return p.stats?.pts ?? -1;
                                        case 'pim': return p.stats?.pim ?? -1;
                                        case 'age': return parseInt(p.age) || 0;
                                        case 'ht': return p.height || '';
                                        case 'wt': return parseInt(p.weight) || 0;
                                        case 'regNum': return p.regNumber || '';
                                        case 'startDate': return p.startDate || '';
                                        default: return 0;
                                      }
                                    }).map((player: any, i) => (
                                      <tr key={`player-${player.playerId}-${i}`} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="px-3 py-2.5 text-center text-sm font-bold text-gray-500">{player.number}</td>
                                        <td className="px-3 py-2.5">
                                          <button
                                            onClick={() => navigateToPlayer({ playerId: player.playerId, teamId: currentTeamId, seasonId, photoDocId: player.photoDocId })}
                                            className="text-left hover:underline transition-colors flex items-center gap-2 group/name text-sm font-semibold"
                                            style={{ color: extractedColors.primary }}
                                          >
                                            <PlayerAvatar photoUrl={player.photoUrl} />
                                            {player.name}
                                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover/name:opacity-60 transition-opacity shrink-0" />
                                          </button>
                                        </td>
                                        <td className="px-3 py-2.5 text-center text-sm text-gray-500">{player.position}</td>
                                        {player.stats ? (
                                          <>
                                            <td className="px-3 py-2.5 text-center text-sm font-medium text-gray-900">{player.stats.gp}</td>
                                            <td className="px-3 py-2.5 text-center text-sm font-medium text-gray-900">{player.stats.g}</td>
                                            <td className="px-3 py-2.5 text-center text-sm font-medium text-gray-900">{player.stats.a}</td>
                                            <td className="px-3 py-2.5 text-center text-sm font-bold" style={{ color: extractedColors.primary }}>{player.stats.pts}</td>
                                            <td className="px-3 py-2.5 text-center text-sm text-gray-600 hidden md:table-cell">{player.stats.pim}</td>
                                          </>
                                        ) : (
                                          <>
                                            <td className="px-3 py-2.5 text-center text-sm text-gray-400">-</td>
                                            <td className="px-3 py-2.5 text-center text-sm text-gray-400">-</td>
                                            <td className="px-3 py-2.5 text-center text-sm text-gray-400">-</td>
                                            <td className="px-3 py-2.5 text-center text-sm text-gray-400">-</td>
                                            <td className="px-3 py-2.5 text-center text-sm text-gray-400 hidden md:table-cell">-</td>
                                          </>
                                        )}
                                        <td className="px-3 py-2.5 text-center text-sm text-gray-500 hidden lg:table-cell">{player.age}</td>
                                        <td className="px-3 py-2.5 text-center text-sm text-gray-500 hidden lg:table-cell">{player.height}</td>
                                        <td className="px-3 py-2.5 text-center text-sm text-gray-500 hidden xl:table-cell">{player.weight}</td>
                                        <td className="px-3 py-2.5 text-center text-sm text-gray-500 hidden xl:table-cell">{player.startDate}</td>
                                        <td className="px-3 py-2.5 text-center text-sm text-gray-500 hidden xl:table-cell">{player.regNumber}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Goalie Stats Table */}
                        {roster.filter((p: any) => p.isGoalie).length > 0 && (
                          <Card className="border-2 shadow-lg" style={{ borderColor: `${extractedColors.primary}40` }}>
                            <CardHeader 
                              className="border-b-2 rounded-t-lg"
                              style={{ backgroundColor: extractedColors.primary, borderBottomColor: extractedColors.primary }}
                            >
                              <CardTitle className="text-xl font-black text-white">Goalies</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="overflow-x-auto">
                                <table className="w-full font-sans whitespace-nowrap">
                                  <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                      <SortableHeader column="number" label="#" sort={rosterGoaliesSort.sort} onSort={rosterGoaliesSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider" />
                                      <SortableHeader column="name" label="NAME" sort={rosterGoaliesSort.sort} onSort={rosterGoaliesSort.toggleSort} className="px-3 py-2.5 text-left text-xs font-bold text-gray-500 tracking-wider" />
                                      <SortableHeader column="gp" label="GP" sort={rosterGoaliesSort.sort} onSort={rosterGoaliesSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider" />
                                      <SortableHeader column="gaa" label="GAA" sort={rosterGoaliesSort.sort} onSort={rosterGoaliesSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider" />
                                      <SortableHeader column="svPct" label="SV%" sort={rosterGoaliesSort.sort} onSort={rosterGoaliesSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider" />
                                      <SortableHeader column="age" label="Age" sort={rosterGoaliesSort.sort} onSort={rosterGoaliesSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider hidden lg:table-cell" />
                                      <SortableHeader column="ht" label="Ht" sort={rosterGoaliesSort.sort} onSort={rosterGoaliesSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider hidden lg:table-cell" />
                                      <SortableHeader column="wt" label="Wt" sort={rosterGoaliesSort.sort} onSort={rosterGoaliesSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider hidden xl:table-cell" />
                                      <SortableHeader column="startDate" label="START" sort={rosterGoaliesSort.sort} onSort={rosterGoaliesSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider hidden xl:table-cell" />
                                      <SortableHeader column="regNum" label="REG #" sort={rosterGoaliesSort.sort} onSort={rosterGoaliesSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider hidden xl:table-cell" />
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {rosterGoaliesSort.sortData(roster.filter((p: any) => p.isGoalie), (p: any, col) => {
                                      switch (col) {
                                        case 'number': return parseInt(p.number) || 0;
                                        case 'name': return p.name || '';
                                        case 'gp': return p.stats?.gp ?? -1;
                                        case 'w': return p.stats?.w ?? -1;
                                        case 'l': return p.stats?.l ?? -1;
                                        case 'gaa': return parseFloat(p.stats?.gaa) || 0;
                                        case 'svPct': return parseFloat(p.stats?.svPct) || 0;
                                        case 'age': return parseInt(p.age) || 0;
                                        case 'ht': return p.height || '';
                                        case 'wt': return parseInt(p.weight) || 0;
                                        case 'regNum': return p.regNumber || '';
                                        case 'startDate': return p.startDate || '';
                                        default: return 0;
                                      }
                                    }).map((player: any, i) => (
                                      <tr key={`goalie-${player.playerId}-${i}`} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="px-3 py-2.5 text-center text-sm font-bold text-gray-500">{player.number}</td>
                                        <td className="px-3 py-2.5">
                                          <button
                                            onClick={() => navigateToPlayer({ playerId: player.playerId, teamId: currentTeamId, seasonId, photoDocId: player.photoDocId, isGoalie: true })}
                                            className="text-left hover:underline transition-colors flex items-center gap-2 group/name text-sm font-semibold"
                                            style={{ color: extractedColors.primary }}
                                          >
                                            <PlayerAvatar photoUrl={player.photoUrl} />
                                            {player.name}
                                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover/name:opacity-60 transition-opacity shrink-0" />
                                          </button>
                                        </td>
                                        {player.stats ? (
                                          <>
                                            <td className="px-3 py-2.5 text-center text-sm font-medium text-gray-900">{player.stats.gp}</td>
                                            <td className="px-3 py-2.5 text-center text-sm font-bold" style={{ color: extractedColors.primary }}>{player.stats.gaa}</td>
                                            <td className="px-3 py-2.5 text-center text-sm font-medium text-gray-900">{player.stats.svPct}%</td>
                                          </>
                                        ) : (
                                          <>
                                            <td className="px-3 py-2.5 text-center text-sm text-gray-400">-</td>
                                            <td className="px-3 py-2.5 text-center text-sm text-gray-400">-</td>
                                            <td className="px-3 py-2.5 text-center text-sm text-gray-400">-</td>
                                          </>
                                        )}
                                        <td className="px-3 py-2.5 text-center text-sm text-gray-500 hidden lg:table-cell">{player.age}</td>
                                        <td className="px-3 py-2.5 text-center text-sm text-gray-500 hidden lg:table-cell">{player.height}</td>
                                        <td className="px-3 py-2.5 text-center text-sm text-gray-500 hidden xl:table-cell">{player.weight}</td>
                                        <td className="px-3 py-2.5 text-center text-sm text-gray-500 hidden xl:table-cell">{player.startDate}</td>
                                        <td className="px-3 py-2.5 text-center text-sm text-gray-500 hidden xl:table-cell">{player.regNumber}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </>
                    ) : (
                      <Card className="border-2 shadow-lg" style={{ borderColor: `${extractedColors.primary}40` }}>
                        <CardContent className="p-0">
                          <div className="text-center py-12 text-gray-500 italic">
                            The {currentSeason} roster will be available once the season schedule is released and games begin.
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                <div className="space-y-6">
                  {['Goalies', 'Defense', 'Forwards'].map((groupName) => {
                    const groupRoster = rosterByPosition[groupName] || [];
                    if (groupRoster.length === 0) return null;
                    const isGoalieGroup = groupName === 'Goalies';
                    
                    return (
                      <Card key={groupName} className="border-2 shadow-lg" style={{ borderColor: `${extractedColors.primary}40` }}>
                        <CardHeader 
                          className="border-b-2 rounded-t-lg"
                          style={{ 
                            backgroundColor: extractedColors.primary,
                            borderBottomColor: extractedColors.primary
                          }}
                        >
                          <CardTitle className="text-xl font-black text-white">{groupName}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <table className="w-full font-sans whitespace-nowrap">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                  <SortableHeader column="number" label="#" sort={rosterGroupSort.sort} onSort={rosterGroupSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider" />
                                  <SortableHeader column="name" label="NAME" sort={rosterGroupSort.sort} onSort={rosterGroupSort.toggleSort} className="px-3 py-2.5 text-left text-xs font-bold text-gray-500 tracking-wider" />
                                  <SortableHeader column="pos" label="POS" sort={rosterGroupSort.sort} onSort={rosterGroupSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider" />
                                  <SortableHeader column="gp" label="GP" sort={rosterGroupSort.sort} onSort={rosterGroupSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider" />
                                  {isGoalieGroup ? (
                                    <>
                                      <SortableHeader column="gaa" label="GAA" sort={rosterGroupSort.sort} onSort={rosterGroupSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider" />
                                      <SortableHeader column="svPct" label="SV%" sort={rosterGroupSort.sort} onSort={rosterGroupSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider hidden md:table-cell" />
                                    </>
                                  ) : (
                                    <>
                                      <SortableHeader column="g" label="G" sort={rosterGroupSort.sort} onSort={rosterGroupSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider" />
                                      <SortableHeader column="a" label="A" sort={rosterGroupSort.sort} onSort={rosterGroupSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider" />
                                      <SortableHeader column="pts" label="PTS" sort={rosterGroupSort.sort} onSort={rosterGroupSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider" />
                                      <SortableHeader column="pim" label="PIM" sort={rosterGroupSort.sort} onSort={rosterGroupSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider hidden md:table-cell" />
                                    </>
                                  )}
                                  <SortableHeader column="age" label="Age" sort={rosterGroupSort.sort} onSort={rosterGroupSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider hidden lg:table-cell" />
                                  <SortableHeader column="ht" label="Ht" sort={rosterGroupSort.sort} onSort={rosterGroupSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider hidden lg:table-cell" />
                                  <SortableHeader column="wt" label="Wt" sort={rosterGroupSort.sort} onSort={rosterGroupSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider hidden xl:table-cell" />
                                  <SortableHeader column="startDate" label="START" sort={rosterGroupSort.sort} onSort={rosterGroupSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider hidden xl:table-cell" />
                                  <SortableHeader column="regNum" label="REG #" sort={rosterGroupSort.sort} onSort={rosterGroupSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider hidden xl:table-cell" />
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {rosterGroupSort.sortData(groupRoster, (p: any, col) => {
                                  switch (col) {
                                    case 'number': return parseInt(p.number) || 0;
                                    case 'name': return p.name || '';
                                    case 'pos': return p.position || '';
                                    case 'gp': return p.stats?.gp ?? -1;
                                    case 'g': return p.stats?.g ?? -1;
                                    case 'a': return p.stats?.a ?? -1;
                                    case 'pts': return p.stats?.pts ?? -1;
                                    case 'pim': return p.stats?.pim ?? -1;
                                    case 'w': return p.stats?.w ?? -1;
                                    case 'l': return p.stats?.l ?? -1;
                                    case 'gaa': return parseFloat(p.stats?.gaa) || 0;
                                    case 'svPct': return parseFloat(p.stats?.svPct) || 0;
                                    case 'age': return parseInt(p.age) || 0;
                                    case 'ht': return p.height || '';
                                    case 'wt': return parseInt(p.weight) || 0;
                                    case 'regNum': return p.regNumber || '';
                                    case 'startDate': return p.startDate || '';
                                    default: return 0;
                                  }
                                }).map((player: any, i: number) => (
                                  <tr key={`${groupName}-${player.playerId}-${i}`} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="px-3 py-2.5 text-center text-sm font-bold text-gray-500">{player.number}</td>
                                    <td className="px-3 py-2.5">
                                      <button
                                        onClick={() => navigateToPlayer({ playerId: player.playerId, teamId: currentTeamId, seasonId, photoDocId: player.photoDocId, isGoalie: isGoalieGroup || player.isGoalie })}
                                        className="text-left hover:underline transition-colors flex items-center gap-2 group/name text-sm font-semibold"
                                        style={{ color: extractedColors.primary }}
                                      >
                                        <PlayerAvatar photoUrl={player.photoUrl} />
                                        {player.name}
                                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover/name:opacity-60 transition-opacity shrink-0" />
                                      </button>
                                    </td>
                                    <td className="px-3 py-2.5 text-center text-sm text-gray-500">{player.position}</td>
                                    {isGoalieGroup && player.stats ? (
                                      <>
                                        <td className="px-3 py-2.5 text-center text-sm font-medium text-gray-900">{player.stats.gp}</td>
                                        <td className="px-3 py-2.5 text-center text-sm font-bold" style={{ color: extractedColors.primary }}>{player.stats.gaa}</td>
                                        <td className="px-3 py-2.5 text-center text-sm font-medium text-gray-900 hidden md:table-cell">{player.stats.svPct}%</td>
                                      </>
                                    ) : player.stats && !isGoalieGroup ? (
                                      <>
                                        <td className="px-3 py-2.5 text-center text-sm font-medium text-gray-900">{player.stats.gp}</td>
                                        <td className="px-3 py-2.5 text-center text-sm font-medium text-gray-900">{player.stats.g}</td>
                                        <td className="px-3 py-2.5 text-center text-sm font-medium text-gray-900">{player.stats.a}</td>
                                        <td className="px-3 py-2.5 text-center text-sm font-bold" style={{ color: extractedColors.primary }}>{player.stats.pts}</td>
                                        <td className="px-3 py-2.5 text-center text-sm text-gray-600 hidden md:table-cell">{player.stats.pim}</td>
                                      </>
                                    ) : (
                                      <>
                                        <td className="px-3 py-2.5 text-center text-sm text-gray-400">-</td>
                                        <td className="px-3 py-2.5 text-center text-sm text-gray-400">-</td>
                                        <td className="px-3 py-2.5 text-center text-sm text-gray-400">-</td>
                                        <td className="px-3 py-2.5 text-center text-sm text-gray-400">-</td>
                                        <td className="px-3 py-2.5 text-center text-sm text-gray-400 hidden md:table-cell">-</td>
                                      </>
                                    )}
                                    <td className="px-3 py-2.5 text-center text-sm text-gray-500 hidden lg:table-cell">{player.age}</td>
                                    <td className="px-3 py-2.5 text-center text-sm text-gray-500 hidden lg:table-cell">{player.height}</td>
                                    <td className="px-3 py-2.5 text-center text-sm text-gray-500 hidden xl:table-cell">{player.weight}</td>
                                    <td className="px-3 py-2.5 text-center text-sm text-gray-500 hidden xl:table-cell">{player.startDate}</td>
                                    <td className="px-3 py-2.5 text-center text-sm text-gray-500 hidden xl:table-cell">{player.regNumber}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
              </TabsContent>

              {/* Stats Tab */}
              <TabsContent value="stats" className="mt-0 space-y-6">
                {/* Game Type Filter */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-bold text-gray-500">Game Type:</span>
                  <div className="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                    {[
                      { label: 'All Games', value: 'all' },
                      { label: 'Regular Season', value: 'regu' },
                      { label: 'Playoffs', value: 'plyo' },
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setStatsGameType(type.value)}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${
                          statsGameType === type.value
                            ? 'text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        style={statsGameType === type.value ? { backgroundColor: extractedColors.primary } : undefined}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Team Stats Summary */}
                {filteredPlayerStats.length > 0 && (() => {
                  const teamTotals = filteredPlayerStats.reduce((acc: any, p: any) => {
                    acc.gp = Math.max(acc.gp, resolveNum(p, 'GamesPlayed', 'GP'));
                    acc.goals += resolveNum(p, 'Goals', 'G', 'GoalsScored');
                    acc.assists += resolveNum(p, 'Assists', 'A', 'AssistsTotal');
                    acc.points += resolveNum(p, 'Points', 'Pts', 'TotalPoints');
                    acc.pim += resolveNum(p, 'PenaltyMin', 'PenaltyMinutes', 'PIM', 'PenMin', 'Penalties', 'PenMins');
                    acc.ppg += resolveNum(p, 'PPGoals', 'PowerPlayGoals', 'PPG', 'PP');
                    acc.shg += resolveNum(p, 'SHGoals', 'ShortHandedGoals', 'SHG', 'SH');
                    acc.gwg += resolveNum(p, 'GameWinningGoals', 'GWG');
                    return acc;
                  }, { gp: 0, goals: 0, assists: 0, points: 0, pim: 0, ppg: 0, shg: 0, gwg: 0 });

                  return (
                    <Card className="border-2 shadow-lg" style={{ borderColor: `${extractedColors.primary}40` }}>
                      <CardHeader 
                        className="border-b-2 rounded-t-lg py-3"
                        style={{ backgroundColor: extractedColors.primary, borderBottomColor: extractedColors.primary }}
                      >
                        <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                          <Trophy className="w-5 h-5" />
                          Team Statistics Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 font-sans">
                        <div className="grid grid-cols-4 md:grid-cols-8 divide-x divide-y md:divide-y-0 border-b">
                          <div className="p-3 text-center">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">GP</div>
                            <div className="text-xl font-bold">{teamTotals.gp}</div>
                          </div>
                          <div className="p-3 text-center bg-gray-50">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Goals</div>
                            <div className="text-xl font-bold" style={{ color: extractedColors.primary }}>{teamTotals.goals}</div>
                          </div>
                          <div className="p-3 text-center">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Assists</div>
                            <div className="text-xl font-bold">{teamTotals.assists}</div>
                          </div>
                          <div className="p-3 text-center bg-gray-50">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Points</div>
                            <div className="text-xl font-bold">{teamTotals.points}</div>
                          </div>
                          <div className="p-3 text-center">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">PIM</div>
                            <div className="text-xl font-bold text-red-600">{teamTotals.pim}</div>
                          </div>
                          <div className="p-3 text-center bg-gray-50">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">PPG</div>
                            <div className="text-xl font-bold">{teamTotals.ppg}</div>
                          </div>
                          <div className="p-3 text-center">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">SHG</div>
                            <div className="text-xl font-bold">{teamTotals.shg}</div>
                          </div>
                          <div className="p-3 text-center bg-gray-50">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">GWG</div>
                            <div className="text-xl font-bold">{teamTotals.gwg}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Scoring Stats */}
                <Card className="border-2 shadow-lg" style={{ borderColor: `${extractedColors.primary}40` }}>
                  <CardHeader 
                    className="border-b-2 rounded-t-lg"
                    style={{ 
                      backgroundColor: extractedColors.primary,
                      borderBottomColor: extractedColors.primary
                    }}
                  >
                    <CardTitle className="text-xl font-black text-white flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Player Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="text-center py-12 text-gray-500">Loading stats...</div>
                    ) : filteredPlayerStats.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full font-sans whitespace-nowrap">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="px-3 py-2.5 text-center w-10 text-xs font-bold text-gray-500 tracking-wider">#</th>
                              <SortableHeader column="name" label="PLAYER" sort={playerStatsSort.sort} onSort={playerStatsSort.toggleSort} className="px-3 py-2.5 text-left text-xs font-bold text-gray-500 tracking-wider" />
                              <SortableHeader column="no" label="No" sort={playerStatsSort.sort} onSort={playerStatsSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider" />
                              <SortableHeader column="gp" label="GP" sort={playerStatsSort.sort} onSort={playerStatsSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider" />
                              <SortableHeader column="g" label="G" sort={playerStatsSort.sort} onSort={playerStatsSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider" />
                              <SortableHeader column="a" label="A" sort={playerStatsSort.sort} onSort={playerStatsSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider" />
                              <SortableHeader column="pts" label="PTS" sort={playerStatsSort.sort} onSort={playerStatsSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider" />
                              <SortableHeader column="pim" label="PIM" sort={playerStatsSort.sort} onSort={playerStatsSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider" />
                              <SortableHeader column="ppg" label="PPG" sort={playerStatsSort.sort} onSort={playerStatsSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider hidden lg:table-cell" />
                              <SortableHeader column="shg" label="SHG" sort={playerStatsSort.sort} onSort={playerStatsSort.toggleSort} className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 tracking-wider hidden lg:table-cell" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {playerStatsSort.sortData(filteredPlayerStats, (p: any, col) => {
                              switch (col) {
                                case 'name': return resolveStr(p, 'PlayerName', 'Name', 'FullName') || '';
                                case 'no': return parseInt(jerseyNumberMap[p.PlayerId] || resolveStr(p, 'PlayerNo', 'PlayerNumber', 'JerseyNumber', 'Number', 'No', 'Jersey', 'Num', 'JerseyNo')) || 0;
                                case 'gp': return resolveNum(p, 'GamesPlayed', 'GP');
                                case 'g': return resolveNum(p, 'Goals', 'G', 'GoalsScored');
                                case 'a': return resolveNum(p, 'Assists', 'A', 'AssistsTotal');
                                case 'pts': return resolveNum(p, 'Points', 'Pts', 'TotalPoints');
                                case 'pim': return resolveNum(p, 'PenaltyMin', 'PenaltyMinutes', 'PIM', 'PenMin', 'Penalties', 'PenMins');
                                case 'ppg': return resolveNum(p, 'PPGoals', 'PowerPlayGoals', 'PPG', 'PP');
                                case 'shg': return resolveNum(p, 'SHGoals', 'ShortHandedGoals', 'SHG', 'SH');
                                default: return 0;
                              }
                            }).map((player: any, i) => (
                                <tr key={`${player.PlayerId}-${i}`} className="hover:bg-blue-50/50 transition-colors group">
                                  <td className="px-3 py-2.5 text-center text-sm font-bold text-gray-400">{i + 1}</td>
                                  <td className="px-3 py-2.5">
                                    <button
                                      onClick={() => navigateToPlayer({ playerId: player.PlayerId, teamId: currentTeamId, seasonId, photoDocId: player.PhotoDocId || photoDocIdMap[player.PlayerId] })}
                                      className="text-left hover:underline transition-colors flex items-center gap-1.5 group/name text-sm font-semibold"
                                      style={{ color: extractedColors.primary }}
                                    >
                                      {resolveStr(player, 'PlayerName', 'Name', 'FullName') || 'Unknown'}
                                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover/name:opacity-60 transition-opacity shrink-0" />
                                    </button>
                                  </td>
                                  <td className="px-3 py-2.5 text-center text-sm font-bold text-gray-500">{jerseyNumberMap[player.PlayerId] || resolveStr(player, 'PlayerNo', 'PlayerNumber', 'JerseyNumber', 'Number', 'No', 'Jersey', 'Num', 'JerseyNo') || '-'}</td>
                                  <td className="px-3 py-2.5 text-center text-sm font-medium text-gray-900">{resolveNum(player, 'GamesPlayed', 'GP')}</td>
                                  <td className="px-3 py-2.5 text-center text-sm font-medium text-gray-900">{resolveNum(player, 'Goals', 'G', 'GoalsScored')}</td>
                                  <td className="px-3 py-2.5 text-center text-sm font-medium text-gray-900">{resolveNum(player, 'Assists', 'A', 'AssistsTotal')}</td>
                                  <td className="px-3 py-2.5 text-center border-l border-gray-100 bg-gray-50/50">
                                    <span className="inline-block min-w-[28px] py-0.5 px-1.5 rounded text-sm font-bold" style={{ backgroundColor: `${extractedColors.primary}15`, color: extractedColors.primary }}>
                                      {resolveNum(player, 'Points', 'Pts', 'TotalPoints')}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-center text-sm text-gray-600">{resolveNum(player, 'PenaltyMin', 'PenaltyMinutes', 'PIM', 'PenMin', 'Penalties', 'PenMins')}</td>
                                  <td className="px-3 py-2.5 text-center hidden lg:table-cell text-sm text-gray-500">{resolveNum(player, 'PPGoals', 'PowerPlayGoals', 'PPG', 'PP')}</td>
                                  <td className="px-3 py-2.5 text-center hidden lg:table-cell text-sm text-gray-500">{resolveNum(player, 'SHGoals', 'ShortHandedGoals', 'SHG', 'SH')}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500 italic">
                        No {statsGameType === 'regu' ? 'regular season' : statsGameType === 'plyo' ? 'playoff' : ''} stats available for this season yet.
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Goalie Stats */}
                <Card className="border-2 shadow-lg" style={{ borderColor: `${extractedColors.primary}40` }}>
                  <CardHeader 
                    className="border-b-2 rounded-t-lg"
                    style={{ 
                      backgroundColor: extractedColors.primary,
                      borderBottomColor: extractedColors.primary
                    }}
                  >
                    <CardTitle className="text-xl font-black text-white flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Goalie Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {filteredGoalieStats.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full font-sans whitespace-nowrap [&_th]:px-2 [&_th]:py-2 [&_td]:px-2 [&_td]:py-2">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="text-center w-10 text-xs font-bold text-gray-500 tracking-wider">#</th>
                              <SortableHeader column="name" label="GOALIE" sort={goalieStatsSort.sort} onSort={goalieStatsSort.toggleSort} className="text-left text-xs font-bold text-gray-500 tracking-wider" />
                              <SortableHeader column="gp" label="GP" sort={goalieStatsSort.sort} onSort={goalieStatsSort.toggleSort} className="text-center text-xs font-bold text-gray-500 tracking-wider" />
                              <SortableHeader column="gd" label="GD" sort={goalieStatsSort.sort} onSort={goalieStatsSort.toggleSort} className="text-center text-xs font-bold text-gray-500 tracking-wider" />
                              <SortableHeader column="min" label="Min" sort={goalieStatsSort.sort} onSort={goalieStatsSort.toggleSort} className="text-center text-xs font-bold text-gray-500 tracking-wider" />
                              <SortableHeader column="sog" label="SOG" sort={goalieStatsSort.sort} onSort={goalieStatsSort.toggleSort} className="text-center text-xs font-bold text-gray-500 tracking-wider" />
                              <SortableHeader column="ga" label="GA" sort={goalieStatsSort.sort} onSort={goalieStatsSort.toggleSort} className="text-center text-xs font-bold text-gray-500 tracking-wider" />
                              <SortableHeader column="gaa" label="GAA" sort={goalieStatsSort.sort} onSort={goalieStatsSort.toggleSort} className="text-center text-xs font-bold text-gray-500 tracking-wider" />
                              <SortableHeader column="sv" label="SV" sort={goalieStatsSort.sort} onSort={goalieStatsSort.toggleSort} className="text-center text-xs font-bold text-gray-500 tracking-wider" />
                              <SortableHeader column="svPct" label="SV%" sort={goalieStatsSort.sort} onSort={goalieStatsSort.toggleSort} className="text-center text-xs font-bold text-gray-500 tracking-wider" />
                              <SortableHeader column="g" label="G" sort={goalieStatsSort.sort} onSort={goalieStatsSort.toggleSort} className="text-center text-xs font-bold text-gray-500 tracking-wider" />
                              <SortableHeader column="a" label="A" sort={goalieStatsSort.sort} onSort={goalieStatsSort.toggleSort} className="text-center text-xs font-bold text-gray-500 tracking-wider" />
                              <SortableHeader column="pts" label="Pts" sort={goalieStatsSort.sort} onSort={goalieStatsSort.toggleSort} className="text-center text-xs font-bold text-gray-500 tracking-wider" />
                              <SortableHeader column="pim" label="PIM" sort={goalieStatsSort.sort} onSort={goalieStatsSort.toggleSort} className="text-center text-xs font-bold text-gray-500 tracking-wider" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {goalieStatsSort.sortData(filteredGoalieStats, (g: any, col) => {
                              switch (col) {
                                case 'name': return resolveStr(g, 'PlayerName', 'Name', 'FullName') || '';
                                case 'gp': return resolveNum(g, 'GamesPlayed', 'GP');
                                case 'gd': return resolveNum(g, 'GamesDressed', 'GD', 'Dressed') || resolveNum(g, 'GamesPlayed', 'GP');
                                case 'min': return computeMinutes(g);
                                case 'sog': { const sv = resolveNum(g, 'Saves', 'SV', 'Svs', 'SVS', 'SaversTotal', 'ShotsStopped', 'SavesMade', 'TotalSaves', 'SavesTotal'); const ga = resolveNum(g, 'GoalsAgainst', 'GA', 'GATotal'); return resolveNum(g, 'ShotsAgainst', 'SA', 'ShotsTotal', 'ShotAgainst', 'TotalShots', 'ShotsReceived') || (sv + ga); }
                                case 'ga': return resolveNum(g, 'GoalsAgainst', 'GA', 'GATotal');
                                case 'gaa': return computeGAA(g);
                                case 'sv': return resolveNum(g, 'Saves', 'SV', 'Svs', 'SVS', 'SaversTotal', 'ShotsStopped', 'SavesMade', 'TotalSaves', 'SavesTotal');
                                case 'svPct': return computeSavePct(g);
                                case 'g': return resolveNum(g, 'Goals', 'G');
                                case 'a': return resolveNum(g, 'Assists', 'A');
                                case 'pts': return resolveNum(g, 'Points', 'Pts', 'TotalPoints') || (resolveNum(g, 'Goals', 'G') + resolveNum(g, 'Assists', 'A'));
                                case 'pim': return resolveNum(g, 'PenaltyMin', 'PenaltyMinutes', 'PIM', 'PenMin', 'Penalties', 'PenMins');
                                default: return 0;
                              }
                            }).map((goalie: any, i) => {
                                const gaa = computeGAA(goalie);
                                const svPct = computeSavePct(goalie);
                                const minutes = computeMinutes(goalie);
                                const saves = resolveNum(goalie, 'Saves', 'SV', 'Svs', 'SVS', 'SaversTotal', 'ShotsStopped', 'SavesMade', 'TotalSaves', 'SavesTotal');
                                const goalsAgainst = resolveNum(goalie, 'GoalsAgainst', 'GA', 'GATotal');
                                const shotsAgainst = resolveNum(goalie, 'ShotsAgainst', 'SA', 'ShotsTotal', 'ShotAgainst', 'TotalShots', 'ShotsReceived') || (saves + goalsAgainst);
                                const gp = resolveNum(goalie, 'GamesPlayed', 'GP');
                                const gd = resolveNum(goalie, 'GamesDressed', 'GD', 'Dressed') || gp;
                                const goals = resolveNum(goalie, 'Goals', 'G');
                                const assists = resolveNum(goalie, 'Assists', 'A');
                                const points = resolveNum(goalie, 'Points', 'Pts', 'TotalPoints') || (goals + assists);
                                const pim = resolveNum(goalie, 'PenaltyMin', 'PenaltyMinutes', 'PIM', 'PenMin', 'Penalties', 'PenMins');
                                return (
                                <tr key={`${goalie.PlayerId}-${i}`} className="hover:bg-blue-50/50 transition-colors group">
                                  <td className="text-center text-sm font-bold text-gray-400">{i + 1}</td>
                                  <td>
                                    <button
                                      onClick={() => navigateToPlayer({ playerId: goalie.PlayerId, teamId: currentTeamId, seasonId, photoDocId: goalie.PhotoDocId || photoDocIdMap[goalie.PlayerId], isGoalie: true })}
                                      className="text-left hover:underline transition-colors flex items-center gap-1.5 group/name text-sm font-semibold"
                                      style={{ color: extractedColors.primary }}
                                    >
                                      {resolveStr(goalie, 'PlayerName', 'Name', 'FullName') || 'Unknown'}
                                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover/name:opacity-60 transition-opacity shrink-0" />
                                    </button>
                                  </td>
                                  <td className="text-center text-sm font-medium text-gray-900">{gp}</td>
                                  <td className="text-center text-sm text-gray-500">{gd}</td>
                                  <td className="text-center text-sm text-gray-500">{minutes || '-'}</td>
                                  <td className="text-center text-sm font-medium text-gray-900">{shotsAgainst}</td>
                                  <td className="text-center text-sm font-medium text-gray-900">{goalsAgainst}</td>
                                  <td className="text-center text-sm font-medium text-gray-900">{gaa > 0 ? gaa.toFixed(1) : '-'}</td>
                                  <td className="text-center text-sm font-medium text-gray-900">{saves || '-'}</td>
                                  <td className="text-center border-l border-gray-100 bg-gray-50/50">
                                    <span className="inline-block min-w-[28px] py-0.5 px-1.5 rounded text-sm font-bold" style={{ backgroundColor: `${extractedColors.primary}15`, color: extractedColors.primary }}>
                                      {svPct > 0 ? svPct.toFixed(1) : '-'}
                                    </span>
                                  </td>
                                  <td className="text-center text-sm text-gray-500">{goals || '-'}</td>
                                  <td className="text-center text-sm text-gray-500">{assists || '-'}</td>
                                  <td className="text-center text-sm text-gray-500">{points || '-'}</td>
                                  <td className="text-center text-sm text-gray-500">{pim || '-'}</td>
                                </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500 italic">
                        No {statsGameType === 'regu' ? 'regular season' : statsGameType === 'plyo' ? 'playoff' : ''} goalie stats available for this season yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Transactions Tab */}
              <TabsContent value="transactions" className="mt-0">
                <Card className="border-2 shadow-lg" style={{ borderColor: `${extractedColors.primary}40` }}>
                  <CardHeader 
                    className="border-b-2 rounded-t-lg"
                    style={{ 
                      backgroundColor: extractedColors.primary,
                      borderBottomColor: extractedColors.primary
                    }}
                  >
                    <CardTitle className="text-xl font-black text-white flex items-center justify-between">
                      <span>Transactions</span>
                      <div className="flex items-center gap-2">
                        {!transactionsLoading && (
                          <Badge variant="outline" className="text-white/80 border-white/30 bg-white/10 font-semibold text-xs">
                            {currentSeason} Season
                          </Badge>
                        )}
                        {!transactionsLoading && teamTransactions.length > 0 && (
                          <Badge variant="outline" className="text-white border-white/40 bg-white/10 font-bold text-sm">
                            {teamTransactions.length} total
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {transactionsLoading ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="w-10 h-10 text-gray-300 animate-spin mb-3" />
                        <p className="text-gray-400 font-bold">Loading transactions...</p>
                      </div>
                    ) : transactionsError ? (
                      <div className="text-center py-12 text-red-500">
                        <p className="font-bold">Error loading transactions</p>
                        <p className="text-sm text-gray-500 mt-1">{transactionsError.message}</p>
                      </div>
                    ) : teamTransactions.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr style={{ backgroundColor: extractedColors.secondary }}>
                              <SortableHeader column="date" label="Date" sort={transactionsSort.sort} onSort={transactionsSort.toggleSort} className="text-left py-2 px-3 font-bold text-white" dark />
                              <SortableHeader column="type" label="Type" sort={transactionsSort.sort} onSort={transactionsSort.toggleSort} className="text-left py-2 px-3 font-bold text-white" dark />
                              <SortableHeader column="player" label="Player" sort={transactionsSort.sort} onSort={transactionsSort.toggleSort} className="text-left py-2 px-3 font-bold text-white" dark />
                              <SortableHeader column="details" label="Details" sort={transactionsSort.sort} onSort={transactionsSort.toggleSort} className="text-left py-2 px-3 font-bold text-white hidden md:table-cell" dark />
                              <SortableHeader column="tradeWith" label="Trade With" sort={transactionsSort.sort} onSort={transactionsSort.toggleSort} className="text-left py-2 px-3 font-bold text-white hidden lg:table-cell" dark />
                              <SortableHeader column="status" label="Status" sort={transactionsSort.sort} onSort={transactionsSort.toggleSort} className="text-center py-2 px-3 font-bold text-white hidden lg:table-cell" dark />
                            </tr>
                          </thead>
                          <tbody>
                            {transactionsSort.sortData(teamTransactions, (txn, col) => {
                              switch (col) {
                                case 'date': return txn.date || '';
                                case 'type': return txn.typeName || txn.typeCode || '';
                                case 'player': return txn.playerName || '';
                                case 'details': return txn.comment || '';
                                case 'tradeWith': return txn.tradeWithTeam || '';
                                case 'status': return txn.status || '';
                                default: return 0;
                              }
                            }).map((txn) => {
                              const typeColor = txn.typeCode === 'T' ? 'bg-blue-100 text-blue-800' 
                                : txn.typeCode === 'R' ? 'bg-red-100 text-red-800'
                                : txn.typeCode === 'D' ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800';
                              
                              return (
                                <tr key={txn.id} className="border-b border-gray-200 hover:bg-gray-50">
                                  <td className="py-2.5 px-3 text-sm font-semibold whitespace-nowrap">{txn.date}</td>
                                  <td className="py-2.5 px-3">
                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${typeColor}`}>
                                      {txn.typeName || txn.typeCode || 'Transaction'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 font-bold text-sm" style={{ color: extractedColors.primary }}>
                                    {txn.playerName || '-'}
                                  </td>
                                  <td className="py-2.5 px-3 text-sm text-gray-600 hidden md:table-cell max-w-xs truncate" title={txn.comment}>
                                    {txn.comment || '-'}
                                  </td>
                                  <td className="py-2.5 px-3 text-sm text-gray-600 hidden lg:table-cell">
                                    {txn.tradeWithTeam || '-'}
                                  </td>
                                  <td className="py-2.5 px-3 text-center hidden lg:table-cell">
                                    {txn.status ? (
                                      <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800">
                                        {txn.status}
                                      </span>
                                    ) : '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500 italic">
                        <p>No transactions recorded for the {currentSeason} season.</p>
                        <p className="text-xs mt-1 text-gray-400">Try selecting a different season from the dropdown above.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Franchise Certificate Tab */}
              <TabsContent value="franchise" className="mt-0">
                <FranchiseCertificate
                  teamId={currentTeamId}
                  teamName={teamName}
                  teamLogo={teamLogo}
                  divisionName={divisionName}
                  primaryColor={extractedColors.primary}
                  secondaryColor={extractedColors.secondary}
                  currentSeason={currentSeason}
                />
              </TabsContent>

              {/* Protected List Tab */}
              <TabsContent value="protected-list" className="mt-0">
                <Card className="border-2 shadow-lg" style={{ borderColor: `${extractedColors.primary}40` }}>
                  <CardHeader
                    className="border-b-2 rounded-t-lg"
                    style={{
                      backgroundColor: extractedColors.primary,
                      borderBottomColor: extractedColors.primary
                    }}
                  >
                    <CardTitle className="text-xl font-black text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        <span>Protected List</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!protectedListLoading && teamProtectedList.length > 0 && (
                          <Badge variant="outline" className="text-white border-white/40 bg-white/10 font-bold text-sm">
                            {teamProtectedList.length} players
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                    {teamProtectedList.length > 0 && (() => {
                      // Compute the most recent revised date from player dates
                      let latestDateRaw = '';
                      for (const player of teamProtectedList) {
                        if (player.dateRaw && player.dateRaw > latestDateRaw) {
                          latestDateRaw = player.dateRaw;
                        }
                      }
                      if (!latestDateRaw) return null;
                      try {
                        const revisedDate = new Date(latestDateRaw).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                        return (
                          <div className="text-xs text-white/70 font-medium mt-1">
                            Revised: {revisedDate}
                          </div>
                        );
                      } catch {
                        return null;
                      }
                    })()}
                  </CardHeader>
                  <CardContent className="p-0">
                    {protectedListLoading ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="w-10 h-10 text-gray-300 animate-spin mb-3" />
                        <p className="text-gray-400 font-bold">Loading protected list...</p>
                      </div>
                    ) : protectedListError ? (
                      <div className="text-center py-12 text-red-500">
                        <p className="font-bold">Error loading protected list</p>
                        <p className="text-sm text-gray-500 mt-1">{protectedListError.message}</p>
                      </div>
                    ) : teamProtectedList.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr style={{ backgroundColor: extractedColors.secondary }}>
                              <th className="text-left py-2 px-3 font-bold text-white w-12">#</th>
                              <SortableHeader column="name" label="Player" sort={protectedListSort.sort} onSort={protectedListSort.toggleSort} className="text-left py-2 px-3 font-bold text-white" dark />
                              <SortableHeader column="no" label="No." sort={protectedListSort.sort} onSort={protectedListSort.toggleSort} className="text-left py-2 px-3 font-bold text-white hidden sm:table-cell w-16" dark />
                              <SortableHeader column="pos" label="Pos" sort={protectedListSort.sort} onSort={protectedListSort.toggleSort} className="text-left py-2 px-3 font-bold text-white hidden sm:table-cell" dark />
                              <SortableHeader column="date" label="Date Added" sort={protectedListSort.sort} onSort={protectedListSort.toggleSort} className="text-left py-2 px-3 font-bold text-white hidden md:table-cell" dark />
                              <SortableHeader column="notes" label="Notes" sort={protectedListSort.sort} onSort={protectedListSort.toggleSort} className="text-left py-2 px-3 font-bold text-white hidden lg:table-cell" dark />
                            </tr>
                          </thead>
                          <tbody>
                            {protectedListSort.sortData(
                              teamProtectedList.filter(entry => entry.playerName),
                              (entry, col) => {
                                switch (col) {
                                  case 'name': return entry.playerName || '';
                                  case 'no': return parseInt(entry.jerseyNumber || '0') || 0;
                                  case 'pos': return entry.position || '';
                                  case 'date': return entry.date || '';
                                  case 'notes': return entry.comment || '';
                                  default: return 0;
                                }
                              }
                            ).map((entry, i) => (
                                <tr key={entry.id} className="border-b border-gray-200 hover:bg-gray-50">
                                  <td className="py-2.5 px-3 font-bold text-gray-400 text-sm">{i + 1}</td>
                                  <td className="py-2.5 px-3 font-bold" style={{ color: extractedColors.primary }}>
                                    {entry.playerName}
                                  </td>
                                  <td className="py-2.5 px-3 text-sm text-gray-600 hidden sm:table-cell">
                                    {entry.jerseyNumber || '-'}
                                  </td>
                                  <td className="py-2.5 px-3 text-sm text-gray-600 hidden sm:table-cell">
                                    {entry.position || '-'}
                                  </td>
                                  <td className="py-2.5 px-3 text-sm text-gray-600 hidden md:table-cell whitespace-nowrap">
                                    {entry.date || '-'}
                                  </td>
                                  <td className="py-2.5 px-3 text-sm text-gray-500 hidden lg:table-cell max-w-xs truncate" title={entry.comment}>
                                    {entry.comment || '-'}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500 italic">
                        <p>No protected list data available for this team.</p>
                        <p className="text-xs mt-1 text-gray-400">The protected list may not have been submitted yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Events Tab */}
              <TabsContent value="events" className="mt-0">
                <TeamEvents
                  teamId={currentTeamId}
                  teamName={teamName}
                  primaryColor={extractedColors.primary}
                  secondaryColor={extractedColors.secondary}
                  currentSeason={currentSeason}
                />
              </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </div>
      </div>
      <Footer />
      
      {/* Game Sheet Modal */}
      {selectedGame && (
        <GameSheetModal 
          game={selectedGame} 
          open={isGameSheetOpen} 
          onClose={() => setIsGameSheetOpen(false)} 
        />
      )}

      {/* Export Options Modal */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#001741]">Export Schedule</DialogTitle>
            <DialogDescription>
              Choose how you'd like to export {teamName}'s {scheduleFilter === 'practices' ? 'practices' : 'schedule'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {/* Sync to Calendar */}
            <button
              onClick={handleExportToCalendar}
              className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-[#4b5baa] hover:bg-[#f0f1f9] transition-all group"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors" style={{ background: extractedColors.primary }}>
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-gray-900">Sync to Calendar</div>
                <div className="text-xs text-gray-600">Download .ics file to add to your calendar app</div>
              </div>
            </button>

            {/* Download CSV */}
            <button
              onClick={downloadSchedule}
              className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-[#4b5baa] hover:bg-[#f0f1f9] transition-all group"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors" style={{ background: extractedColors.primary }}>
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
              <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors" style={{ background: extractedColors.primary }}>
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
    </div>
  );
}