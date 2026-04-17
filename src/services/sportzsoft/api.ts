import { 
  SportzSoftResponse, 
  ScheduleResponse, 
  TeamResponse, 
  SeasonsResponse, 
  StandingsResponse, 
  GameDetailResponse, 
  TeamRosterResponse, 
  PlayerSeasonStats,
  Team,
  DivisionScheduleStatus
} from './types';
import { 
  BASE_URL, 
  ORGANIZATION_ID 
} from './constants';
import { 
  getHeaders, 
  waitForApiKey 
} from './client';

// ── Centralized API Response Cache ──────────────────────────────────────────
// Caches GET responses by URL so navigating between pages doesn't re-fetch.
// TTL-based: data expires after DEFAULT_TTL_MS and is re-fetched on next access.

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const apiCache = new Map<string, CacheEntry>();

// In-flight request deduplication: if the same URL is already being fetched,
// subsequent callers share the same promise instead of firing a duplicate request.
const inflightRequests = new Map<string, Promise<any>>();

/**
 * Cached fetch wrapper. Returns cached data if available and not expired,
 * otherwise fetches from the network and stores the result.
 * Deduplicates concurrent requests to the same URL.
 */
async function cachedFetch(url: string, options: RequestInit, ttl: number = DEFAULT_TTL_MS): Promise<any> {
  // Check cache first
  const cached = apiCache.get(url);
  if (cached && (Date.now() - cached.timestamp) < cached.ttl) {

    return cached.data;
  }

  // Deduplicate in-flight requests
  if (inflightRequests.has(url)) {

    return inflightRequests.get(url)!;
  }

  const fetchPromise = (async () => {

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    const data = await response.json();
    // Only cache successful API responses
    if (data.Success !== false) {
      apiCache.set(url, { data, timestamp: Date.now(), ttl });
    }
    return data;
  })();

  inflightRequests.set(url, fetchPromise);

  try {
    const result = await fetchPromise;
    return result;
  } finally {
    inflightRequests.delete(url);
  }
}

/** Clear all cached API responses (useful for manual refresh) */
export function clearApiCache(): void {
  apiCache.clear();
}

/** Clear cached division schedule status for specific divisions */
export function clearDivisionScheduleCache(divisionIds: number[]): void {
  divisionIds.forEach(id => {
    const url = `${BASE_URL}/SportsDivision/${id}?LimiterCode=BS`;
    apiCache.delete(url);
  });
}

/** Get cache stats for debugging */
export function getApiCacheStats(): { entries: number; urls: string[] } {
  return {
    entries: apiCache.size,
    urls: Array.from(apiCache.keys()).map(u => u.replace(BASE_URL, '...')),
  };
}

// Fetch Facilities for the Organization
export async function fetchFacilities(
  organizationId: number = ORGANIZATION_ID
): Promise<SportzSoftResponse<any>> {
  const apiKeyReady = await waitForApiKey(10000);
  if (!apiKeyReady) {
    throw new Error('API key not initialized. Cannot make API call.');
  }

  // Facilities data rarely changes — use a longer 30-minute TTL
  const url = `${BASE_URL}/Facilities/${organizationId}`;

  try {
    const data = await cachedFetch(url, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    }, 30 * 60 * 1000);
    return data;
  } catch (error) {
    console.error('Error fetching facilities:', error);
    throw error;
  }
}

// Fetch Schedule (Games and Practices)
export async function fetchSchedule(
  seasonId: number,
  startDate: string,
  endDate: string,
  options: {
    practices?: boolean;
    games?: boolean;
    constraints?: boolean;
    limiterCode?: string;
  } = {}
): Promise<SportzSoftResponse<ScheduleResponse>> {
  const {
    practices = false,
    games = true,
    constraints = false,
    limiterCode = 'BPS'
  } = options;

  const apiKeyReady = await waitForApiKey(10000);
  if (!apiKeyReady) {
    throw new Error('API key not initialized. Cannot make API call.');
  }

  const url = `${BASE_URL}/Season/${seasonId}/Schedule?LimiterCode=${limiterCode}&Start=${startDate}&End=${endDate}&Practices=${practices}&Games=${games}&Constraints=${constraints}`;

  try {
    const data = await cachedFetch(url, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    });
    if (!data.Success) {
      console.error('[fetchSchedule] API returned Success=false:', data);
    }
    return data;
  } catch (error) {
    console.error('Error fetching schedule:', error);
    throw error;
  }
}

// Fetch Teams
export async function fetchTeams(
  seasonId: number,
  limiterCode: string = 'BI',
  childCodes: string = ''
): Promise<SportzSoftResponse<TeamResponse>> {
  const apiKeyReady = await waitForApiKey(10000);
  if (!apiKeyReady) {
    throw new Error('API key not initialized. Cannot make API call.');
  }

  let url = `${BASE_URL}/Season/${seasonId}/Team?LimiterCode=${limiterCode}`;
  if (childCodes) {
    url += `&ChildCodes=${childCodes}`;
  }

  try {
    const data = await cachedFetch(url, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    });
    if (!data.Success) {
      console.error('[fetchTeams] API returned Success=false:', data);
    }
    return data;
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
}

// Fetch Seasons with Division Groups from Organization
export async function fetchSeasons(
  limiterCode: string = 'BP',
  includeInactive: boolean = true,
  organizationId: number = ORGANIZATION_ID
): Promise<SportzSoftResponse<SeasonsResponse>> {
  const apiKeyReady = await waitForApiKey(10000);
  if (!apiKeyReady) {
    throw new Error('API key not initialized. Cannot make API call.');
  }

  // Seasons data - use very short cache for live 2026 season updates
  const url = `${BASE_URL}/Organization/${organizationId}/Seasons?LimiterCode=${limiterCode}&ChildCodes=GDC&IncludeInActive=${includeInactive}`;

  try {
    const data = await cachedFetch(url, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    }, 30 * 1000); // 30 seconds TTL - force fresh data
    return data;
  } catch (error) {
    console.error('Error fetching seasons:', error);
    throw error;
  }
}

// Fetch Standings for a season/division
export async function fetchStandings(
  seasonId: number,
  divisionId?: number,
  limiterCode: string = 'B',
  childCodes: string = 'TS',
  standingsCode: string = 'regu'
): Promise<SportzSoftResponse<StandingsResponse>> {
  const apiKeyReady = await waitForApiKey(10000);
  if (!apiKeyReady) {
    throw new Error('API key not initialized. Cannot make API call.');
  }

  // Build URL — try SportsDivision endpoint when divisionId provided, Season endpoint otherwise
  let url: string;
  if (divisionId) {
    // Division-level: SportsDivision/{divId}?LimiterCode=BS&ChildCodes=S
    url = `${BASE_URL}/SportsDivision/${divisionId}?LimiterCode=BS&ChildCodes=S`;
  } else {
    // Season-level fallback
    url = `${BASE_URL}/Season/${seasonId}?LimiterCode=${limiterCode}&ChildCodes=${childCodes}&StandingsCode=${standingsCode}`;
  }
  try {
    const data = await cachedFetch(url, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    });
    
    // Log raw response shape for SportsDivision calls to debug structure issues
    if (divisionId) {
      // If the API doesn't wrap in Success/Response, normalize it
      if (data && data.Success === undefined) {
        return { Success: true, Response: data } as any;
      }
    }
    
    return data;
  } catch (error) {
    console.error('[fetchStandings] Error fetching standings:', error);
    throw error;
  }
}

// Fetch Detailed Game Information
export async function fetchGameDetails(
  gameId: number,
  childCodes: string = 'SGPROT',
  limiterCode: string = 'B'
): Promise<SportzSoftResponse<GameDetailResponse>> {
  const apiKeyReady = await waitForApiKey(10000);
  if (!apiKeyReady) {
    throw new Error('API key not initialized. Cannot make API call.');
  }

  const url = `${BASE_URL}/Game/${gameId}?LimiterCode=${limiterCode}&ChildCodes=${childCodes}`;

  try {
    const data = await cachedFetch(url, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    });
    return data;
  } catch (error) {
    console.error('Error fetching game details:', error);
    throw error;
  }
}

// Fetch Team Schedule
export async function fetchTeamSchedule(
  teamId: number,
  includeGames: boolean = true,
  includePractices: boolean = true,
  limiterCode: string = 'B',
  childCodes: string = 'RB',
  startDate?: string,
  endDate?: string
): Promise<SportzSoftResponse<ScheduleResponse>> {
  const apiKeyReady = await waitForApiKey(10000);
  if (!apiKeyReady) {
    throw new Error('API key not initialized. Cannot make API call.');
  }

  let url = `${BASE_URL}/Team/${teamId}/Schedule?Games=${includeGames}&Practices=${includePractices}&LimiterCode=${limiterCode}&ChildCodes=${childCodes}`;
  if (startDate && endDate) {
    url += `&Start=${startDate}&End=${endDate}`;
  }

  try {
    const data = await cachedFetch(url, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    });
    return data;
  } catch (error) {
    console.error('Error fetching team schedule:', error);
    throw error;
  }
}

// Fetch Team Roster
export async function fetchTeamRoster(
  teamId: number,
  limiterCode: string = 'B',
  childCodes: string = 'HSRBPG'
): Promise<SportzSoftResponse<TeamRosterResponse>> {
  const apiKeyReady = await waitForApiKey(10000);
  if (!apiKeyReady) {
    throw new Error('API key not initialized. Cannot make API call.');
  }

  const url = `${BASE_URL}/Team/${teamId}?LimiterCode=${limiterCode}&ChildCodes=${childCodes}`;

  try {
    const data = await cachedFetch(url, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    });
    return data;
  } catch (error) {
    console.error('Error fetching team roster:', error);
    throw error;
  }
}

// Fetch Single Team Details
export async function fetchTeamDetails(
  teamId: number,
  limiterCode: string = 'BI',
  childCodes: string = ''
): Promise<SportzSoftResponse<Team>> {
  const apiKeyReady = await waitForApiKey(10000);
  if (!apiKeyReady) {
    throw new Error('API key not initialized. Cannot make API call.');
  }

  const url = `${BASE_URL}/Team/${teamId}?LimiterCode=${limiterCode}&ChildCodes=${childCodes}`;

  try {
    const data = await cachedFetch(url, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    });
    return data;
  } catch (error) {
    console.error('Error fetching team details:', error);
    throw error;
  }
}

// DIAGNOSTIC: Fetch Team with NO limiter codes — returns all available fields
// Call this to discover social media links, PCN role, and other hidden fields
export async function fetchTeamRaw(
  teamId: number
): Promise<SportzSoftResponse<any>> {
  const apiKeyReady = await waitForApiKey(10000);
  if (!apiKeyReady) {
    console.error('[fetchTeamRaw] API key not ready after 10s wait');
    throw new Error('API key not initialized. Cannot make API call.');
  }

  // No LimiterCode, no ChildCodes — raw full response
  const url = `${BASE_URL}/Team/${teamId}`;


  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[fetchTeamRaw] Non-OK response body:', text);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    return data;
  } catch (error) {
    console.error('[fetchTeamRaw] Error:', error);
    throw error;
  }
}

export interface FetchPlayerStatsOptions {
  seasonId?: number;
  divisionId?: number;
  divisionGroupId?: number;
  teamId?: number;
  limiterCode?: string;
  standingCode?: string;
  playersOnly?: boolean;
  goaliesOnly?: boolean;
}

// Fetch Player Statistics
// Updated to use the direct PlayerStats endpoint and support various filters
export async function fetchPlayerStats(
  options: FetchPlayerStatsOptions
): Promise<SportzSoftResponse<PlayerSeasonStats[]>> {
  const apiKeyReady = await waitForApiKey(10000);
  if (!apiKeyReady) {
    throw new Error('API key not initialized. Cannot make API call.');
  }

  const {
    seasonId,
    divisionId,
    divisionGroupId,
    teamId,
    limiterCode = 'B',
    standingCode,
    playersOnly = false,
    goaliesOnly = false
  } = options;

  let url = `${BASE_URL}/PlayerStats?LimiterCode=${limiterCode}`;
  if (seasonId) url += `&SeasonId=${seasonId}`;
  if (divisionId) url += `&DivisionId=${divisionId}`;
  if (divisionGroupId) url += `&DivisionGroupId=${divisionGroupId}`;
  if (teamId) url += `&TeamId=${teamId}`;
  if (standingCode) url += `&StandingCode=${standingCode}`;
  if (playersOnly) url += `&PlayersOnly=1`;
  if (goaliesOnly) url += `&GoaliesOnly=1`;

  try {
    const data = await cachedFetch(url, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    });
    return data;
  } catch (error) {
    console.error('Error fetching player stats:', error);
    throw error;
  }
}

// Fetch Player Career Statistics
export async function fetchPlayerCareerStats(
  playerId: number,
  limiterCode: string = 'B'
): Promise<SportzSoftResponse<PlayerSeasonStats[]>> {
  const apiKeyReady = await waitForApiKey(10000);
  if (!apiKeyReady) {
    throw new Error('API key not initialized. Cannot make API call.');
  }

  const url = `${BASE_URL}/Player/${playerId}?LimiterCode=${limiterCode}I&ChildCodes=HSYPG`;

  try {
    const data = await cachedFetch(url, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    });
    return data;
  } catch (error) {
    console.error('Error fetching player career stats:', error);
    throw error;
  }
}

// Fetch Enhanced Player Profile (New API)
export async function fetchEnhancedPlayerProfile(
    playerId: number,
    statsFilterSeasonId?: number,
    childCodes: string = 'HSYPG'
): Promise<SportzSoftResponse<any>> {
    const apiKeyReady = await waitForApiKey(10000);
    if (!apiKeyReady) {
      throw new Error('API key not initialized. Cannot make API call.');
    }
  
    let url = `${BASE_URL}/Player/${playerId}?LimiterCode=BI&ChildCodes=${childCodes}`;
    if (statsFilterSeasonId) {
        url += `&StatsFilterSeasonId=${statsFilterSeasonId}`;
    }
  
    try {
      const data = await cachedFetch(url, {
        method: 'GET',
        headers: getHeaders(),
        mode: 'cors',
        credentials: 'omit',
      });
      return data;
    } catch (error) {
      console.error('Error fetching enhanced player profile:', error);
      throw error;
    }
}

// Fetch Franchise Transactions
// Uses TeamFranchiseTransaction endpoint with params for DivisionId, Type, FromDate, ToDate, etc.
export interface FetchTransactionsOptions {
  divisionId?: number;
  teamId?: number;
  franchiseId?: number;
  type?: string; // T=Trade, P=Protected, R=Release, etc.
  fromDate?: string; // yyyymmdd format
  toDate?: string; // yyyymmdd format
}

export interface FranchiseTransaction {
  TransactionDate: string;
  PlayerName: string | null;
  TeamName: string;
  TransactionComment: string;
  // API field names have quirks - TransactionTypeCd and TrasactionTypeName (API typo)
  TransactionTypeCd: string;
  TrasactionTypeName: string; // Note: API has typo - missing 'n' in "Transaction"
  TradeWithTeamName: string | null;
  TeamFranchiseId: number | null;
  FranchiseTradeId: number | null;
  TradeWithFranchiseId: number | null;
  TradeTypeCd: string | null;
  TradeStatus: string;
  DivGroupCommonCode: string | null;
  OrganizationId: number | null;
}

export async function fetchFranchiseTransactions(
  options: FetchTransactionsOptions
): Promise<SportzSoftResponse<{ FranchiseTransactions: FranchiseTransaction[] }>> {
  const apiKeyReady = await waitForApiKey(10000);
  if (!apiKeyReady) {
    throw new Error('API key not initialized. Cannot make API call.');
  }

  let url = `${BASE_URL}/TeamFranchiseTransaction?`;
  const params: string[] = [];
  if (options.divisionId) params.push(`DivisionId=${options.divisionId}`);
  if (options.teamId) params.push(`TeamId=${options.teamId}`);
  if (options.franchiseId) params.push(`FranchiseId=${options.franchiseId}`);
  if (options.type) params.push(`Type=${options.type}`);
  if (options.fromDate) params.push(`FromDate=${options.fromDate}`);
  if (options.toDate) params.push(`ToDate=${options.toDate}`);
  url += params.join('&');

  try {
    const data = await cachedFetch(url, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    });
    return data;
  } catch (error) {
    console.error('[fetchFranchiseTransactions] Error:', error);
    throw error;
  }
}

// Fetch Team details to get TeamFranchiseId (and basic team info)
// Uses Team endpoint — the response includes TeamFranchiseId which we need
// to then call the TeamFranchise endpoint for the protected list.
export async function fetchTeamFranchiseProtectedList(
  teamId: number,
  limiterCode: string = 'B',
  childCodes: string = ''
): Promise<SportzSoftResponse<any>> {
  const apiKeyReady = await waitForApiKey(10000);
  if (!apiKeyReady) {
    throw new Error('API key not initialized. Cannot make API call.');
  }

  const url = `${BASE_URL}/Team/${teamId}?LimiterCode=${limiterCode}${childCodes ? `&ChildCodes=${childCodes}` : ''}`;

  try {
    const data = await cachedFetch(url, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    });
    return data;
  } catch (error) {
    console.error('[fetchTeamFranchiseProtectedList] Error:', error);
    throw error;
  }
}

// Fetch protected list from TeamFranchise endpoint using ChildCodes=P (Protected)
// Flow: Get TeamFranchiseId from Team call, then call TeamFranchise/{id}?ChildCodes=P
// Uses LimiterCode=C for protected list data
export async function fetchFranchiseDetails(
  franchiseId: number,
  limiterCode: string = 'C',
  childCodes: string = 'P'
): Promise<SportzSoftResponse<any>> {
  const apiKeyReady = await waitForApiKey(10000);
  if (!apiKeyReady) {
    throw new Error('API key not initialized. Cannot make API call.');
  }

  const url = `${BASE_URL}/TeamFranchise/${franchiseId}?LimiterCode=${limiterCode}&ChildCodes=${childCodes}`;

  try {
    const data = await cachedFetch(url, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    });
    return data;
  } catch (error) {
    console.error('[fetchFranchiseDetails] Error:', error);
    throw error;
  }
}

// Fetch Division Draft data from the dedicated DivisionDraft endpoint
// Supports filtering by FranchiseId, TeamId, DivisionId, or DivisionGroupId.
// When filtering by FranchiseId or TeamId, returns ALL data for any draft
// that franchise/team participated in (not just their picks).
export interface FetchDivisionDraftOptions {
  franchiseId?: number;
  teamId?: number;
  divisionId?: number;
  divisionGroupId?: number;
  seasonId?: number;
}

export async function fetchDivisionDraft(
  options: FetchDivisionDraftOptions
): Promise<SportzSoftResponse<any>> {
  const apiKeyReady = await waitForApiKey(10000);
  if (!apiKeyReady) {
    throw new Error('API key not initialized. Cannot make API call.');
  }

  let url = `${BASE_URL}/DivisionDraft?`;
  const params: string[] = [];
  if (options.franchiseId) params.push(`FranchiseId=${options.franchiseId}`);
  if (options.teamId) params.push(`TeamId=${options.teamId}`);
  if (options.divisionId) params.push(`DivisionId=${options.divisionId}`);
  if (options.divisionGroupId) params.push(`DivisionGroupId=${options.divisionGroupId}`);
  if (options.seasonId) params.push(`SeasonId=${options.seasonId}`);
  url += params.join('&');

  try {
    const data = await cachedFetch(url, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    });
    return data;
  } catch (error) {
    console.error('[fetchDivisionDraft] Error:', error);
    throw error;
  }
}

// Fetch Team Events - tries multiple SportzSoft API patterns to find events
// SportzSoft teams can create events (fundraisers, socials, tryouts, etc.)
// Pattern 1: Team/{id}?ChildCodes=E (Events as child data)
// Pattern 2: Team/{id}/Event endpoint
// Pattern 3: Team/{id}/Schedule with Events flag
export async function fetchTeamEvents(
  teamId: number,
  limiterCode: string = 'B'
): Promise<{ source: string; data: any }[]> {
  const apiKeyReady = await waitForApiKey(10000);
  if (!apiKeyReady) {
    throw new Error('API key not initialized. Cannot make API call.');
  }

  const results: { source: string; data: any }[] = [];

  // Pattern 1: ChildCodes=E on Team endpoint
  try {
    const url1 = `${BASE_URL}/Team/${teamId}?LimiterCode=${limiterCode}&ChildCodes=E`;

    const data1 = await cachedFetch(url1, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    });
    results.push({ source: 'Team?ChildCodes=E', data: data1 });
  } catch (error) {
    console.warn('[fetchTeamEvents] Pattern 1 failed:', error);
  }

  // Pattern 2: Team/{id}/Event endpoint
  try {
    const url2 = `${BASE_URL}/Team/${teamId}/Event?LimiterCode=${limiterCode}`;

    const data2 = await cachedFetch(url2, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    });
    results.push({ source: 'Team/Event', data: data2 });
  } catch (error) {
    console.warn('[fetchTeamEvents] Pattern 2 failed:', error);
  }

  // Pattern 3: Team/{id}/Schedule with broader codes
  try {
    const url3 = `${BASE_URL}/Team/${teamId}/Schedule?Games=false&Practices=false&LimiterCode=${limiterCode}&ChildCodes=E`;

    const data3 = await cachedFetch(url3, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    });
    results.push({ source: 'Team/Schedule?ChildCodes=E', data: data3 });
  } catch (error) {
    console.warn('[fetchTeamEvents] Pattern 3 failed:', error);
  }

  // Pattern 4: TeamEvent endpoint  
  try {
    const url4 = `${BASE_URL}/TeamEvent?TeamId=${teamId}&LimiterCode=${limiterCode}`;

    const data4 = await cachedFetch(url4, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    });
    results.push({ source: 'TeamEvent?TeamId', data: data4 });
  } catch (error) {
    console.warn('[fetchTeamEvents] Pattern 4 failed:', error);
  }

  return results;
}

// Fetch Division Schedule Status
// Uses SportsDivision/{divId}?LimiterCode=S to get GameScheduleReady and GameScheduleFinal flags
// GameScheduleReady: if true, games for this division can be shown publicly; if false, hide them
// GameScheduleFinal: if true, schedule is complete; if false, schedule is in progress
export async function fetchDivisionScheduleStatus(
  divisionId: number
): Promise<DivisionScheduleStatus | null> {
  const apiKeyReady = await waitForApiKey(10000);
  if (!apiKeyReady) {
    throw new Error('API key not initialized. Cannot make API call.');
  }

  const url = `${BASE_URL}/SportsDivision/${divisionId}?LimiterCode=BS`;

  try {
    const data = await cachedFetch(url, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    }, 2 * 60 * 1000); // 2-minute TTL — schedule status may change frequently

    const raw = data?.Response?.SportsDivision || data?.SportsDivision || data?.Response || data;
    if (!raw) {
      console.warn(`[fetchDivisionScheduleStatus] Div ${divisionId}: No data in response`);
      return null;
    }

    // Robust boolean parsing — API may return true, "true", "True", 1, "1", "Y", "Yes", etc.
    const parseBool = (val: any): boolean => {
      if (val === true || val === 1) return true;
      if (typeof val === 'string') {
        const v = val.trim().toLowerCase();
        return v === 'true' || v === '1' || v === 'y' || v === 'yes';
      }
      return false;
    };

    return {
      divisionId,
      divisionName: raw.DivisionName || raw.DisplayString || `Division ${divisionId}`,
      gameScheduleReady: parseBool(raw.GameScheduleReady),
      gameScheduleFinal: parseBool(raw.GameScheduleFinal),
    };
  } catch (error) {
    console.error(`[fetchDivisionScheduleStatus] Error for div ${divisionId}:`, error);
    return null;
  }
}

// Fetch Team Schedule Constraints
// Uses Team/{teamId}?LimiterCode=B&ChildCodes=C to get scheduling constraints for a team
export async function fetchTeamConstraints(
  teamId: number,
  limiterCode: string = 'B'
): Promise<SportzSoftResponse<any>> {
  const apiKeyReady = await waitForApiKey(10000);
  if (!apiKeyReady) {
    throw new Error('API key not initialized. Cannot make API call.');
  }

  const url = `${BASE_URL}/Team/${teamId}?LimiterCode=${limiterCode}&ChildCodes=C`;

  try {
    const data = await cachedFetch(url, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    }, 10 * 60 * 1000); // 10-minute TTL

    return data;
  } catch (error) {
    console.error(`[fetchTeamConstraints] Error for team ${teamId}:`, error);
    throw error;
  }
}

// Fetch schedule status for multiple divisions in parallel
export async function fetchAllDivisionScheduleStatuses(
  divisionIds: number[]
): Promise<Map<number, DivisionScheduleStatus>> {
  const statusMap = new Map<number, DivisionScheduleStatus>();
  
  const results = await Promise.all(
    divisionIds.map(id => 
      fetchDivisionScheduleStatus(id)
        .catch(err => {
          console.warn(`[fetchAllDivisionScheduleStatuses] Div ${id} failed:`, err);
          return null;
        })
    )
  );

  results.forEach(status => {
    if (status) {
      statusMap.set(status.divisionId, status);
    }
  });

  console.log(`[fetchAllDivisionScheduleStatuses] ${statusMap.size}/${divisionIds.length} divisions loaded. Ready: ${Array.from(statusMap.values()).filter(s => s.gameScheduleReady).length}, Final: ${Array.from(statusMap.values()).filter(s => s.gameScheduleFinal).length}`);

  return statusMap;
}