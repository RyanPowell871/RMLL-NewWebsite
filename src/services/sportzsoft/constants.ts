
// SportzSoft API Constants

// Base URL for SportzSoft API
export const BASE_URL = 'https://www.sportzsoft.com/ssRest/TeamRest.dll';

// Organization ID for RMLL
export const ORGANIZATION_ID = 520;

// Mock data fallback configuration
export const useMockData = false;

// Season IDs — only include known valid IDs; zeros are misleading
// Season IDs change each year and are resolved dynamically from the API via useSeasons
export const SEASON_IDS: Record<string, number> = {
  '2026': 7235,
};

// Division ID mappings for 2026 Season
// NOTE: These IDs are season-specific and change when SportzSoft creates new seasons.
// The dynamic DivisionContext (loaded by DivisionDataLoader) should be the primary source.
// These constants serve as fallbacks only. Update when a new season starts.
export const DIVISION_IDS = {
  // Alberta Major Female
  ALBERTA_MAJOR_FEMALE: 76886,
  
  // Alberta Major Senior Female
  ALBERTA_MAJOR_SENIOR_FEMALE: 76887,
  
  // Jr. A
  JUNIOR_A: 76888,
  
  // Jr. B Tier I
  JUNIOR_B_TIER_I_CENTRAL: 76889,
  JUNIOR_B_TIER_I_EAST: 76890,
  JUNIOR_B_TIER_I_NORTH: 76891,
  JUNIOR_B_TIER_I_SOUTH: 76892,
  JUNIOR_B_TIER_I_PROVINCIALS: 76893,
  
  // Jr. B Tier II
  JUNIOR_B_TIER_II_NORTH: 76894,
  JUNIOR_B_TIER_II_NORTH_CENTRAL: 76895,
  JUNIOR_B_TIER_II_NORTH_EAST: 76896,
  JUNIOR_B_TIER_II_SOUTH: 76897,
  JUNIOR_B_TIER_II_SOUTH_CENTRAL: 76898,
  JUNIOR_B_TIER_II_SOUTH_WEST: 76899,
  JUNIOR_B_TIER_II_PROVINCIALS: 76900,
  
  // Jr. Tier III
  JUNIOR_B_TIER_III: 76901,
  
  // Sr. B
  SENIOR_B: 76902,
  
  // Sr. C
  SENIOR_C_PROVINCIALS: 76903,
  SENIOR_C_NORTH: 76904,
  SENIOR_C_SOUTH: 76905,
} as const;

// Reverse mapping: Division ID -> Division Name
export const DIVISION_NAMES: Record<number, string> = {
  [DIVISION_IDS.ALBERTA_MAJOR_FEMALE]: 'Alberta Major Female',
  [DIVISION_IDS.ALBERTA_MAJOR_SENIOR_FEMALE]: 'Alberta Major Senior Female',
  [DIVISION_IDS.JUNIOR_A]: 'Junior A',
  [DIVISION_IDS.JUNIOR_B_TIER_I_CENTRAL]: 'Junior B Tier I - Central',
  [DIVISION_IDS.JUNIOR_B_TIER_I_EAST]: 'Junior B Tier I - East',
  [DIVISION_IDS.JUNIOR_B_TIER_I_NORTH]: 'Junior B Tier I - North',
  [DIVISION_IDS.JUNIOR_B_TIER_I_SOUTH]: 'Junior B Tier I - South',
  [DIVISION_IDS.JUNIOR_B_TIER_I_PROVINCIALS]: 'Junior B Tier I - Provincials',
  [DIVISION_IDS.JUNIOR_B_TIER_II_NORTH]: 'Junior B Tier II - North',
  [DIVISION_IDS.JUNIOR_B_TIER_II_NORTH_CENTRAL]: 'Junior B Tier II - North Central',
  [DIVISION_IDS.JUNIOR_B_TIER_II_NORTH_EAST]: 'Junior B Tier II - North East',
  [DIVISION_IDS.JUNIOR_B_TIER_II_SOUTH]: 'Junior B Tier II - South',
  [DIVISION_IDS.JUNIOR_B_TIER_II_SOUTH_CENTRAL]: 'Junior B Tier II - South Central',
  [DIVISION_IDS.JUNIOR_B_TIER_II_SOUTH_WEST]: 'Junior B Tier II - South West',
  [DIVISION_IDS.JUNIOR_B_TIER_II_PROVINCIALS]: 'Junior B Tier II - Provincials',
  [DIVISION_IDS.JUNIOR_B_TIER_III]: 'Junior B Tier III',
  [DIVISION_IDS.SENIOR_B]: 'Senior B',
  [DIVISION_IDS.SENIOR_C_PROVINCIALS]: 'Senior C - Provincials',
  [DIVISION_IDS.SENIOR_C_NORTH]: 'Senior C - North',
  [DIVISION_IDS.SENIOR_C_SOUTH]: 'Senior C - South',
};

// Division Group to DivisionIds mapping (for filtering)
// Order matches display priority across the site
export const DIVISION_GROUPS: Record<string, number[]> = {
  'All Divisions': [], // Empty means no filter
  'Senior B': [DIVISION_IDS.SENIOR_B],
  'Senior C': [
    DIVISION_IDS.SENIOR_C_NORTH,
    DIVISION_IDS.SENIOR_C_SOUTH,
    DIVISION_IDS.SENIOR_C_PROVINCIALS,
  ],
  'Junior A': [DIVISION_IDS.JUNIOR_A],
  'Junior B Tier I': [
    DIVISION_IDS.JUNIOR_B_TIER_I_CENTRAL,
    DIVISION_IDS.JUNIOR_B_TIER_I_EAST,
    DIVISION_IDS.JUNIOR_B_TIER_I_NORTH,
    DIVISION_IDS.JUNIOR_B_TIER_I_SOUTH,
    DIVISION_IDS.JUNIOR_B_TIER_I_PROVINCIALS,
  ],
  'Junior B Tier II': [
    DIVISION_IDS.JUNIOR_B_TIER_II_NORTH,
    DIVISION_IDS.JUNIOR_B_TIER_II_NORTH_CENTRAL,
    DIVISION_IDS.JUNIOR_B_TIER_II_NORTH_EAST,
    DIVISION_IDS.JUNIOR_B_TIER_II_SOUTH,
    DIVISION_IDS.JUNIOR_B_TIER_II_SOUTH_CENTRAL,
    DIVISION_IDS.JUNIOR_B_TIER_II_SOUTH_WEST,
    DIVISION_IDS.JUNIOR_B_TIER_II_PROVINCIALS,
  ],
  'Junior B Tier III': [DIVISION_IDS.JUNIOR_B_TIER_III],
  'Alberta Major Senior Female': [DIVISION_IDS.ALBERTA_MAJOR_SENIOR_FEMALE],
  'Alberta Major Female': [DIVISION_IDS.ALBERTA_MAJOR_FEMALE],
};

// Desired division group display order
// Includes both full names and API abbreviations
export const DIVISION_GROUP_ORDER = [
  'All Divisions',
  'Senior B',
  'Senior C',
  'Sr. C', // API abbreviation
  'Junior A',
  'Jr A', // API abbreviation
  'Junior B Tier I',
  'Jr Tier I', // API abbreviation
  'Junior B Tier II',
  'Jr Tier II', // API abbreviation
  'Junior B Tier III',
  'Jr Tier III', // API abbreviation
  'Alberta Major Senior Female',
  'Alberta Major Female',
];

// Sub-division to DivisionIds mapping
export const SUB_DIVISION_IDS: Record<string, Record<string, number[]>> = {
  'Junior B Tier I': {
    'All': [
      DIVISION_IDS.JUNIOR_B_TIER_I_CENTRAL,
      DIVISION_IDS.JUNIOR_B_TIER_I_EAST,
      DIVISION_IDS.JUNIOR_B_TIER_I_NORTH,
      DIVISION_IDS.JUNIOR_B_TIER_I_SOUTH,
      DIVISION_IDS.JUNIOR_B_TIER_I_PROVINCIALS,
    ],
    'North': [DIVISION_IDS.JUNIOR_B_TIER_I_NORTH],
    'South': [DIVISION_IDS.JUNIOR_B_TIER_I_SOUTH],
    'Central': [DIVISION_IDS.JUNIOR_B_TIER_I_CENTRAL],
    'East': [DIVISION_IDS.JUNIOR_B_TIER_I_EAST],
  },
  'Junior B Tier II': {
    'All': [
      DIVISION_IDS.JUNIOR_B_TIER_II_NORTH,
      DIVISION_IDS.JUNIOR_B_TIER_II_NORTH_CENTRAL,
      DIVISION_IDS.JUNIOR_B_TIER_II_NORTH_EAST,
      DIVISION_IDS.JUNIOR_B_TIER_II_SOUTH,
      DIVISION_IDS.JUNIOR_B_TIER_II_SOUTH_CENTRAL,
      DIVISION_IDS.JUNIOR_B_TIER_II_SOUTH_WEST,
      DIVISION_IDS.JUNIOR_B_TIER_II_PROVINCIALS,
    ],
    'North': [
      DIVISION_IDS.JUNIOR_B_TIER_II_NORTH,
      DIVISION_IDS.JUNIOR_B_TIER_II_NORTH_CENTRAL,
      DIVISION_IDS.JUNIOR_B_TIER_II_NORTH_EAST,
    ],
    'South': [
      DIVISION_IDS.JUNIOR_B_TIER_II_SOUTH,
      DIVISION_IDS.JUNIOR_B_TIER_II_SOUTH_CENTRAL,
      DIVISION_IDS.JUNIOR_B_TIER_II_SOUTH_WEST,
    ],
  },
  'Senior C': {
    'All': [
      DIVISION_IDS.SENIOR_C_NORTH,
      DIVISION_IDS.SENIOR_C_SOUTH,
      DIVISION_IDS.SENIOR_C_PROVINCIALS,
    ],
    'North': [DIVISION_IDS.SENIOR_C_NORTH],
    'South': [DIVISION_IDS.SENIOR_C_SOUTH],
  },
};

// Detailed division names for reference
export const DIVISION_NAMES_DETAILED: Record<number, string> = {
  // Alberta Major Female
  76886: 'Alberta Major Female',
  
  // Alberta Major Senior Female
  76887: 'Alberta Major Senior Female',
  
  // Jr. A
  76888: 'Jr. A',
  
  // Jr. B Tier I
  76889: 'Jr. B Tier I Central',
  76890: 'Jr. B Tier I East',
  76891: 'Jr. B Tier I North',
  76892: 'Jr. B Tier I South',
  76893: 'Jr. B Tier I Provincials',
  
  // Jr. B Tier II
  76894: 'Jr. B Tier II North',
  76895: 'Jr. B Tier II North Central',
  76896: 'Jr. B Tier II North East',
  76897: 'Jr. B Tier II South',
  76898: 'Jr. B Tier II South Central',
  76899: 'Jr. B Tier II South West',
  76900: 'Jr. B Tier II Provincials',
  
  // Jr. Tier III
  76901: 'Jr. Tier III',
  
  // Sr. B
  76902: 'Sr. B',
  
  // Sr. C
  76903: 'Sr. C Provincials',
  76904: 'Sr. C North',
  76905: 'Sr. C South',
};

// Game Status Code mapping (from SportzSoft API)
// These map numeric GameStatusCodeId (from the Schedule endpoint) to display strings.
// Codes 100-109 are period-level codes from the Game Detail endpoint — do NOT map them here
// or they'll cause scheduled games to show as LIVE. Unmapped codes fall through to 'Scheduled'.
// The downstream components use resolveGameStatus() to convert to FINAL/LIVE/UPCOMING etc.
export const GAME_STATUS: Record<number, string> = {
  110: 'Final',            // Regulation final
  111: 'Final',            // Overtime final
  112: 'Final',            // Shootout final
  113: 'Suspended',
  114: 'In Progress',
  115: 'In Progress',      // Duplicate of 114
  116: 'Completed',
  117: 'Completed',        // Duplicate of 116
  118: 'Final',            // Duplicate of 110
  119: 'Default',          // Defaulted (DEFW) — was mapped as Forfeit; DEFW/FORF share code 119
  120: 'Final',            // Duplicate of 110/118
  121: 'Final',            // Another Final variant (some APIs use this)
  122: 'Cancelled',
  123: 'Postponed',
  124: 'Double Default',   // Double Default (DDEF)
};

// Define the preferred order for divisions (matches the original hardcoded order)
export const PREFERRED_DIVISION_ORDER = [
  'Senior B',
  'Senior C',
  'Junior A',
  'Junior B Tier I',
  'Junior B Tier II',
  'Junior B Tier III',
  'Alberta Major Senior Female',
  'Alberta Major Female'
];

// Define the preferred order for subdivisions
export const PREFERRED_SUBDIVISION_ORDER: Record<string, string[]> = {
  'Junior B Tier I': ['All', 'North', 'South', 'Central', 'East'],
  'Junior B Tier II': ['All', 'North', 'South'],
  'Senior C': ['All', 'North', 'South']
};
