import { 
  Game, 
  Team, 
  Season, 
  ActiveDivisions,
  GameDateRange
} from './types';

import {
  DIVISION_GROUPS,
  DIVISION_GROUP_ORDER,
  SUB_DIVISION_IDS,
  PREFERRED_DIVISION_ORDER,
  PREFERRED_SUBDIVISION_ORDER
} from './constants';

// Normalize API division group names to friendly display names
// Strips leading/trailing year numbers and maps abbreviations to full names
export function normalizeDivisionGroupName(apiName: string): string {
  // Strip leading/trailing year numbers (e.g. "2025 Sr. B" → "Sr. B", "Sr. B 2025" → "Sr. B")
  let cleaned = apiName.replace(/^\d{4}\s+/, '').replace(/\s+\d{4}$/, '').trim();
  
  // Map common API abbreviations to full display names
  const nameMap: Record<string, string> = {
    'Sr. B': 'Senior B',
    'Sr B': 'Senior B',
    'Sr. C': 'Senior C',
    'Sr C': 'Senior C',
    'Jr. A': 'Junior A',
    'Jr A': 'Junior A',
    'Jr. B Tier I': 'Junior B Tier I',
    'Jr B Tier I': 'Junior B Tier I',
    'Jr Tier I': 'Junior B Tier I',
    'Jr. Tier I': 'Junior B Tier I',
    'Jr. B Tier II': 'Junior B Tier II',
    'Jr B Tier II': 'Junior B Tier II',
    'Jr Tier II': 'Junior B Tier II',
    'Jr. Tier II': 'Junior B Tier II',
    'Jr. B Tier III': 'Junior B Tier III',
    'Jr B Tier III': 'Junior B Tier III',
    'Jr. Tier III': 'Junior B Tier III',
    'Jr Tier III': 'Junior B Tier III',
    'Alta Major Sr. Female': 'Alberta Major Senior Female',
    'Alta Major Female': 'Alberta Major Female',
    'Alberta Major Sr. Female': 'Alberta Major Senior Female',
  };
  return nameMap[cleaned] || cleaned;
}

// Helper function to sort division groups in the correct order
export function sortDivisionGroups(groups: Record<string, number[]>): Record<string, number[]> {
  const sorted: Record<string, number[]> = {};
  
  // Add groups in the desired order if they exist
  DIVISION_GROUP_ORDER.forEach(groupName => {
    if (groups[groupName] !== undefined) {
      sorted[groupName] = groups[groupName];
    }
  });
  
  // Add any remaining groups that weren't in the order list
  Object.keys(groups).forEach(groupName => {
    if (sorted[groupName] === undefined) {
      sorted[groupName] = groups[groupName];
    }
  });
  
  return sorted;
}

// Helper to build dynamic division mapping from seasons data
export function buildDivisionMapping(seasons: Season[]): Record<number, string> {
  const mapping: Record<number, string> = {};
  
  seasons.forEach(season => {
    season.Groups?.forEach(group => {
      group.Divisions?.forEach(division => {
        if (division.IsActive) {
          mapping[division.DivisionId] = division.DivisionName;
        }
      });
    });
  });
  
  return mapping;
}

// Helper to map standing category code to friendly name
export function mapStandingCategoryCodeToName(code: string | null): string {
  if (!code || code === 'null') {
    return 'All Games';
  }

  const lowerCode = code.toLowerCase().trim();

  // Common standing category code mappings
  // Based on actual RMLL API responses from DivisionalStandingsCategories
  const knownMappings: Record<string, string> = {
    // RMLL API codes (lowercase)
    'exhb': 'Exhibition',
    'exhibition': 'Exhibition',
    'reg': 'Regular Season',
    'regu': 'Regular Season',
    'regular': 'Regular Season',
    'regseason': 'Regular Season',
    'plyo': 'Playoffs',
    'play': 'Playoffs',
    'playoff': 'Playoffs',
    'playoffs': 'Playoffs',
    'prov': 'Provincials',
    'provincial': 'Provincials',
    'tournament': 'Tournament',
    // Legacy uppercase codes (for backwards compatibility)
    'REG': 'Regular Season',
    'REGU': 'Regular Season',
    'REG08': 'Regular Season',
    'REGULAR': 'Regular Season',
    'PROSS': 'Playoffs',
    'PLAYOFF': 'Playoffs',
    'PLAYOFFS': 'Playoffs',
    'EXHB': 'Exhibition',
    'EXHIBITION': 'Exhibition',
    '(PROVINCIAL)': 'Provincials',
    'PROVINCIAL': 'Provincials',
    'TOURNAMENT': 'Tournament',
    // Additional variations
    'reg season': 'Regular Season',
    'regularseason': 'Regular Season',
    'regular season': 'Regular Season',
  };

  // Check exact match first (case-insensitive)
  if (knownMappings[lowerCode]) {
    return knownMappings[lowerCode];
  }

  // Check if code contains a known substring
  for (const [key, value] of Object.entries(knownMappings)) {
    if (lowerCode.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Fallback: capitalize and clean up the code
  return code.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Helper to build standings category code mapping from games data
export function buildStandingsCategoryMappingFromGames(games: Game[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  games.forEach(game => {
    const code = game.StandingCategoryCode;
    if (code && code !== 'null' && !mapping[code]) {
      mapping[code] = mapStandingCategoryCodeToName(code);
    }
  });
  
  return mapping;
}

// Helper to get all unique game types from games data
export function getUniqueGameTypesFromGames(games: Game[]): string[] {
  const typeSet = new Set<string>();
  
  games.forEach(game => {
    const code = game.StandingCategoryCode;
    if (code && code !== 'null') {
      const name = mapStandingCategoryCodeToName(code);
      // Exclude Exhibition games from filters since they have no game data
      if (name !== 'Exhibition') {
        typeSet.add(name);
      }
    }
  });
  
  // Convert to array and sort
  const types = Array.from(typeSet).sort();
  return types;
}

// Helper to build standings category code mapping from seasons data
export function buildStandingsCategoryMapping(seasons: Season[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  seasons.forEach(season => {
    season.Groups?.forEach(group => {
      group.Divisions?.forEach(division => {
        if (division.IsActive && division.StandingCodes) {
          division.StandingCodes.forEach(category => {
            const code = category.StandingCategoryCode.toUpperCase();
            const name = category.StandingCategoryName;
            
            // Map codes to friendly names for filtering
            if (!mapping[code]) {
              mapping[code] = name;
            }
          });
        }
      });
    });
  });
  
  return mapping;
}

// Helper to get all unique game types from standings categories
export function getUniqueGameTypes(seasons: Season[]): string[] {
  const typeSet = new Set<string>();
  
  seasons.forEach(season => {
    season.Groups?.forEach(group => {
      group.Divisions?.forEach(division => {
        if (division.IsActive && division.StandingCodes) {
          division.StandingCodes.forEach(category => {
            // Exclude Exhibition games from filters since they have no game data
            if (category.StandingCategoryCode?.toLowerCase() !== 'exhb') {
              typeSet.add(category.StandingCategoryName);
            }
          });
        }
      });
    });
  });
  
  // Convert to array and sort
  const types = Array.from(typeSet).sort();
  return types;
}

// Helper to build dynamic division groups from a specific season
export function buildDivisionGroups(season: Season): Record<string, number[]> {
  const groups: Record<string, number[]> = {
    'All Divisions': [], // Empty means no filter
  };
  
  if (!season.Groups) {
    return groups;
  }
  
  season.Groups.forEach(group => {
    // Only include active groups that have active divisions
    const activeDivisions = group.Divisions?.filter(div => div.IsActive) || [];
    
    if (activeDivisions.length > 0) {
      // Normalize the API name to match the friendly names used throughout the app
      const rawName = group.DivGroupName || group.DisplayString;
      const groupName = normalizeDivisionGroupName(rawName);
      
      // If multiple API groups normalize to the same name, merge their division IDs
      if (groups[groupName]) {
        groups[groupName] = [...groups[groupName], ...activeDivisions.map(div => div.DivisionId)];
      } else {
        groups[groupName] = activeDivisions.map(div => div.DivisionId);
      }
    }
  });
  
  // Sort groups in the desired order
  return sortDivisionGroups(groups);
}

// Helper to build division groups from ACTUAL TEAM DATA
export function buildDivisionGroupsFromTeams(teams: Team[], season: Season): Record<string, number[]> {
  const groups: Record<string, number[]> = {
    'All Divisions': [], // Empty means no filter
  };
  
  // Build a map of division name to division IDs from Season (for display names)
  const divisionIdToName = new Map<number, string>();
  season.Groups?.forEach(group => {
    group.Divisions?.forEach(div => {
      divisionIdToName.set(div.DivisionId, div.DivisionName);
    });
  });
  
  // Group teams by their actual division names
  const teamsByDivisionName = new Map<string, Set<number>>();
  
  teams.forEach(team => {
    const divisionName = team.DivisionName || divisionIdToName.get(team.DivisionId) || `Division ${team.DivisionId}`;
    
    if (!teamsByDivisionName.has(divisionName)) {
      teamsByDivisionName.set(divisionName, new Set());
    }
    teamsByDivisionName.get(divisionName)!.add(team.DivisionId);
  });
  
  // Convert to the expected format
  teamsByDivisionName.forEach((divisionIds, divisionName) => {
    groups[divisionName] = Array.from(divisionIds);
  });
  
  return sortDivisionGroups(groups);
}

// Helper to get all active division IDs from a season
export function getActiveDivisionIds(season: Season): number[] {
  const divisionIds: number[] = [];
  
  season.Groups?.forEach(group => {
    group.Divisions?.forEach(division => {
      if (division.IsActive) {
        divisionIds.push(division.DivisionId);
      }
    });
  });
  
  return divisionIds;
}

/**
 * Build dynamic sub-division ID mappings from a season's API data.
 * Mirrors the shape of the hardcoded SUB_DIVISION_IDS constant but
 * using the actual division IDs from the season.
 * 
 * Example output:
 * {
 *   'Junior B Tier I': { 'All': [80001, 80002, 80003], 'North': [80001], 'South': [80002] },
 *   'Senior C': { 'All': [80010, 80011], 'North': [80010], 'South': [80011] }
 * }
 */
export function buildDynamicSubDivisionIds(
  season: Season,
  teams?: Team[]
): Record<string, Record<string, number[]>> {
  const result: Record<string, Record<string, number[]>> = {};
  
  if (!season.Groups) return result;
  
  const teamDivisionIds = teams ? new Set(teams.map(t => t.DivisionId)) : null;
  
  season.Groups.forEach(group => {
    const rawName = group.DivGroupName || group.DisplayString;
    const groupName = normalizeDivisionGroupName(rawName);
    
    let activeDivisions = group.Divisions?.filter(div => div.IsActive) || [];
    
    // If teams provided, further filter to only divisions with actual teams
    if (teamDivisionIds) {
      activeDivisions = activeDivisions.filter(div => teamDivisionIds.has(div.DivisionId));
    }
    
    // Only create sub-division entries for groups with multiple divisions
    if (activeDivisions.length <= 1) return;
    
    const subDivs: Record<string, number[]> = {
      'All': activeDivisions.map(div => div.DivisionId),
    };
    
    const patterns = ['North', 'South', 'East', 'West', 'Central', 'Provincials'];
    
    activeDivisions.forEach(division => {
      const divName = division.DivisionName;
      for (const pattern of patterns) {
        if (divName.includes(pattern)) {
          if (!subDivs[pattern]) {
            subDivs[pattern] = [];
          }
          subDivs[pattern].push(division.DivisionId);
        }
      }
    });
    
    // Also handle compound sub-regions (e.g., "North Central", "North East", "South Central", "South West")
    // Group them under their primary region
    activeDivisions.forEach(division => {
      const divName = division.DivisionName;
      if (divName.includes('North Central') || divName.includes('North East')) {
        if (!subDivs['North']) subDivs['North'] = [];
        if (!subDivs['North'].includes(division.DivisionId)) {
          subDivs['North'].push(division.DivisionId);
        }
      }
      if (divName.includes('South Central') || divName.includes('South West')) {
        if (!subDivs['South']) subDivs['South'] = [];
        if (!subDivs['South'].includes(division.DivisionId)) {
          subDivs['South'].push(division.DivisionId);
        }
      }
    });
    
    // Only include if we have meaningful sub-divisions beyond 'All'
    if (Object.keys(subDivs).length > 1) {
      result[groupName] = subDivs;
    }
  });
  
  return result;
}

// Helper to get division group name by division ID (returns normalized name)
export function getDivisionGroupName(season: Season, divisionId: number): string | null {
  for (const group of season.Groups || []) {
    const division = group.Divisions?.find(div => div.DivisionId === divisionId);
    if (division) {
      return normalizeDivisionGroupName(group.DivGroupName || group.DisplayString);
    }
  }
  return null;
}

// Helper to find a season group by normalized name (handles raw API names vs friendly names)
function findGroupByName(season: Season, groupName: string) {
  // Try exact match first (raw API name)
  let group = season.Groups?.find(g => (g.DivGroupName || g.DisplayString) === groupName);
  if (group) return group;
  // Try normalized match (friendly name like "Junior B Tier I" → match "Jr. B Tier I")
  group = season.Groups?.find(g => 
    normalizeDivisionGroupName(g.DivGroupName || g.DisplayString) === groupName
  );
  return group || null;
}

// Helper to check if a season has sub-divisions for a given group
export function hasSubDivisions(season: Season, groupName: string, teams?: Team[]): boolean {
  const group = findGroupByName(season, groupName);
  
  if (!group || !group.Divisions) {
    return false;
  }
  
  let activeDivisions = group.Divisions.filter(div => div.IsActive);
  
  if (teams && teams.length > 0) {
    const teamDivisionIds = new Set(teams.map(t => t.DivisionId));
    activeDivisions = activeDivisions.filter(div => teamDivisionIds.has(div.DivisionId));
  }
  
  return activeDivisions.length > 1;
}

// Helper to get sub-divisions for a given group
export function getSubDivisions(
  season: Season, 
  groupName: string, 
  teams?: Team[]
): Record<string, number[]> {
  const subDivisions: Record<string, number[]> = {};
  
  const group = findGroupByName(season, groupName);
  
  if (!group || !group.Divisions) {
    return subDivisions;
  }
  
  const activeDivisions = group.Divisions.filter(div => div.IsActive);
  
  let divisionsWithTeams = activeDivisions;
  if (teams && teams.length > 0) {
    const teamDivisionIds = new Set(teams.map(t => t.DivisionId));
    divisionsWithTeams = activeDivisions.filter(div => teamDivisionIds.has(div.DivisionId));
  }
  
  subDivisions['All'] = divisionsWithTeams.map(div => div.DivisionId);
  
  divisionsWithTeams.forEach(division => {
    const divName = division.DivisionName;
    const patterns = ['North', 'South', 'East', 'West', 'Central', 'Provincials'];
    
    for (const pattern of patterns) {
      if (divName.includes(pattern)) {
        if (!subDivisions[pattern]) {
          subDivisions[pattern] = [];
        }
        subDivisions[pattern].push(division.DivisionId);
      }
    }
  });
  
  return subDivisions;
}

// Helper to generate months list from season start and end dates
export function generateSeasonMonths(startDate: string, endDate: string): string[] {
  const months: string[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const lastMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  
  while (current <= lastMonth) {
    const monthName = monthNames[current.getMonth()];
    const year = current.getFullYear();
    months.push(`${monthName} ${year}`);
    
    current.setMonth(current.getMonth() + 1);
  }
  
  return months;
}

// Helper to generate weeks list from season start and end dates
export function generateSeasonWeeks(startDate: string, endDate: string): string[] {
  const weeks: string[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const current = new Date(start);
  current.setDate(current.getDate() - current.getDay());
  
  while (current < end) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const startMonth = monthNames[weekStart.getMonth()];
    const startDay = weekStart.getDate();
    const endMonth = monthNames[weekEnd.getMonth()];
    const endDay = weekEnd.getDate();
    
    weeks.push(`Week of ${startMonth} ${startDay} - ${endMonth} ${endDay}`);
    
    current.setDate(current.getDate() + 7);
  }
  
  return weeks;
}

// Helper function to format date for API (YYYY-MM-DD)
export function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to get date range for a month
export function getMonthDateRange(year: number, month: number): { start: string; end: string } {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  
  return {
    start: formatDateForApi(startDate),
    end: formatDateForApi(endDate)
  };
}

// Helper function to get date range for a week
export function getWeekDateRange(startDate: Date): { start: string; end: string } {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  
  return {
    start: formatDateForApi(startDate),
    end: formatDateForApi(endDate)
  };
}

// Helper to format game time from API response
// Handles various formats: "2025-05-01T18:30:00", "18:30", "18:30:00", etc.
export function parseGameTime(timeString: string): string {
  if (!timeString) return '';

  let timePart = '';

  // Format 1: ISO datetime with 'T' separator - "2025-05-01T18:30:00" or "2025-05-01T18:30:00.000Z"
  if (timeString.includes('T')) {
    timePart = timeString.split('T')[1]?.split('.')[0]?.split('Z')[0] || '';
  }
  // Format 2: Simple time - "18:30" or "18:30:00"
  else if (timeString.match(/^\d{1,2}:\d{2}/)) {
    timePart = timeString;
  }
  // Format 3: Try to extract time after space - "2025-05-01 18:30"
  else if (timeString.includes(' ')) {
    const parts = timeString.split(' ');
    const lastPart = parts[parts.length - 1];
    if (lastPart.match(/^\d{1,2}:\d{2}/)) {
      timePart = lastPart;
    }
  }

  if (!timePart) return '';

  const [hoursStr, minutesStr] = timePart.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (isNaN(hours) || isNaN(minutes)) return '';

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');

  return `${displayHours}:${displayMinutes} ${period}`;
}

// Helper to format game time in compact format
export function parseGameTimeCompact(timeString: string): string {
  const fullTime = parseGameTime(timeString);
  return fullTime.replace(' PM', 'p').replace(' AM', 'a');
}

// Helper to format game date with day of week
export function formatGameDate(dateString: string): string {
  // Parse as local date to avoid timezone shift (API returns UTC dates like "2025-05-01T01:00:00.000Z"
  // which shift back a day in Mountain Time when using new Date())
  const localDate = parseDateAsLocal(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  };
  return localDate.toLocaleDateString('en-US', options);
}

// Helper to format game date with full day of week for headers
export function formatGameDateLong(dateString: string): string {
  const localDate = parseDateAsLocal(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  };
  return localDate.toLocaleDateString('en-US', options);
}

/**
 * Parse a date string as LOCAL time to prevent timezone offset shifting the day.
 * The SportzSoft API returns dates like "2025-05-01T01:00:00.000Z" where the date 
 * portion is what matters. Using new Date() directly interprets the Z suffix as UTC,
 * which can shift to the previous day in North American time zones.
 */
export function parseDateAsLocal(dateString: string): Date {
  if (!dateString) return new Date();
  // Extract just the date portion (YYYY-MM-DD) and parse without timezone
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Helper to detect which divisions and subdivisions are actually active based on team data
export function detectActiveDivisions(
  teams: Team[],
  dynamicGroups?: Record<string, number[]>,
  dynamicSubDivisions?: Record<string, Record<string, number[]>>
): ActiveDivisions {
  const activeDivisionIds = new Set<number>();
  const activeSubDivisionsByDivision: Record<string, Set<string>> = {};
  
  teams.forEach(team => {
    activeDivisionIds.add(team.DivisionId);
  });
  
  const activeDivisions = new Set<string>();

  // Use dynamic groups if provided, otherwise fall back to hardcoded constants
  const groups = (dynamicGroups && Object.keys(dynamicGroups).length > 1) ? dynamicGroups : DIVISION_GROUPS;
  const subDivs = (dynamicSubDivisions && Object.keys(dynamicSubDivisions).length > 0) ? dynamicSubDivisions : SUB_DIVISION_IDS;
  
  Object.entries(groups).forEach(([divisionName, divisionIds]) => {
    if (divisionName === 'All Divisions') return;
    
    const hasActiveTeams = divisionIds.some(id => activeDivisionIds.has(id));
    
    if (hasActiveTeams) {
      activeDivisions.add(divisionName);
      
      if (subDivs[divisionName]) {
        activeSubDivisionsByDivision[divisionName] = new Set<string>();
        
        Object.entries(subDivs[divisionName]).forEach(([subDivName, subDivIds]) => {
          if (subDivName === 'All') return;
          
          const hasSubDivTeams = subDivIds.some(id => activeDivisionIds.has(id));
          
          if (hasSubDivTeams) {
            activeSubDivisionsByDivision[divisionName].add(subDivName);
          }
        });
      }
    }
  });
  
  const divisionArray = PREFERRED_DIVISION_ORDER.filter(div => activeDivisions.has(div));
  // Also include any dynamic divisions not in the preferred order (e.g. new divisions added in SportzSoft)
  activeDivisions.forEach(div => {
    if (!divisionArray.includes(div)) {
      divisionArray.push(div);
    }
  });
  
  const subDivisionObject: Record<string, string[]> = {};
  Object.entries(activeSubDivisionsByDivision).forEach(([divName, subDivSet]) => {
    const preferredOrder = PREFERRED_SUBDIVISION_ORDER[divName] || ['All'];
    const activeSubDivs = preferredOrder.filter(subDiv => 
      subDiv === 'All' || subDivSet.has(subDiv)
    );
    
    if (activeSubDivs.length > 1 || (activeSubDivs.length === 1 && activeSubDivs[0] !== 'All')) {
      subDivisionObject[divName] = activeSubDivs.includes('All') ? activeSubDivs : ['All', ...activeSubDivs];
    }
  });
  
  return {
    divisions: divisionArray,
    subDivisions: subDivisionObject
  };
}

// Helper to detect the actual date range of games in a schedule
export function detectGameDateRange(games: Game[]): GameDateRange {
  if (!games || games.length === 0) {
    return {
      firstGameDate: null,
      lastGameDate: null,
      hasGames: false
    };
  }

  let firstDate: Date | null = null;
  let lastDate: Date | null = null;

  games.forEach(game => {
    const gameDate = new Date(game.GameDate);
    
    if (!firstDate || gameDate < firstDate) {
      firstDate = gameDate;
    }
    
    if (!lastDate || gameDate > lastDate) {
      lastDate = gameDate;
    }
  });

  return {
    firstGameDate: firstDate,
    lastGameDate: lastDate,
    hasGames: true
  };
}

// Helper to generate months list from actual game dates (only months with games)
export function generateMonthsFromGames(games: Game[]): string[] {
  if (!games || games.length === 0) {
    return [];
  }

  const monthsSet = new Set<string>();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  games.forEach(game => {
    const gameDate = new Date(game.GameDate);
    const monthName = monthNames[gameDate.getMonth()];
    const year = gameDate.getFullYear();
    const monthKey = `${monthName} ${year}`;
    monthsSet.add(monthKey);
  });

  const monthsArray = Array.from(monthsSet);
  monthsArray.sort((a, b) => {
    const [monthA, yearA] = a.split(' ');
    const [monthB, yearB] = b.split(' ');
    const dateA = new Date(`${monthA} 1, ${yearA}`);
    const dateB = new Date(`${monthB} 1, ${yearB}`);
    return dateA.getTime() - dateB.getTime();
  });

  return monthsArray;
}

// Helper to generate weeks list from actual game dates (only weeks with games)
export function generateWeeksFromGames(games: Game[]): string[] {
  if (!games || games.length === 0) {
    return [];
  }

  const weeksSet = new Set<string>();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  games.forEach(game => {
    const gameDate = new Date(game.GameDate);
    
    const weekStart = new Date(gameDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const startMonth = monthNames[weekStart.getMonth()];
    const startDay = weekStart.getDate();
    const endMonth = monthNames[weekEnd.getMonth()];
    const endDay = weekEnd.getDate();
    
    const weekKey = `Week of ${startMonth} ${startDay} - ${endMonth} ${endDay}`;
    weeksSet.add(weekKey);
  });

  const weeksArray = Array.from(weeksSet);
  weeksArray.sort((a, b) => {
    const extractDate = (weekStr: string) => {
      const match = weekStr.match(/Week of (\w+) (\d+)/);
      if (match) {
        const [, month, day] = match;
        const sampleDate = new Date(games[0].GameDate);
        const year = sampleDate.getFullYear();
        return new Date(`${month} ${day}, ${year}`);
      }
      return new Date(0);
    };
    
    const dateA = extractDate(a);
    const dateB = extractDate(b);
    return dateA.getTime() - dateB.getTime();
  });

  return weeksArray;
}

// Helper to check if a specific month has games
export function monthHasGames(games: Game[], monthYear: string): boolean {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [monthName, yearStr] = monthYear.split(' ');
  const targetMonth = monthNames.indexOf(monthName);
  const targetYear = parseInt(yearStr, 10);

  return games.some(game => {
    const gameDate = new Date(game.GameDate);
    return gameDate.getMonth() === targetMonth && gameDate.getFullYear() === targetYear;
  });
}

// Helper to check if a specific week has games
export function weekHasGames(games: Game[], weekStr: string): boolean {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const match = weekStr.match(/Week of (\w+) (\d+)/);
  if (!match) return false;
  
  const [, month, day] = match;
  const monthIndex = monthNames.indexOf(month);
  
  if (games.length === 0) return false;
  const sampleDate = new Date(games[0].GameDate);
  const year = sampleDate.getFullYear();
  
  const weekStart = new Date(year, monthIndex, parseInt(day, 10));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return games.some(game => {
    const gameDate = new Date(game.GameDate);
    return gameDate >= weekStart && gameDate <= weekEnd;
  });
}

// Player Photo URL Builder
export function getPlayerPhotoUrl(docId: number): string {
  if (!docId) return '';
  return `https://www.sportzsoft.com/admin/webAdmin.dll/GetImageDoc?DocId=${docId}`;
}