// SportzSoft API Types

// API Response Types based on actual SportzSoft API
export interface SportzSoftResponse<T> {
  Success: boolean;
  SessionId: string;
  Response: T;
}

export interface Game {
  GameId: number;
  GameDate: string;
  HomeTeamId: number;
  VisitorTeamId: number;
  GameNumber: string;
  StartTime: string;
  EndTime: string;
  Duration: number;
  GameComments: string | null;
  SchedulingComments: string | null;
  PrivateToTeamId: number | null;
  GameStatusCodeId: number;
  GameStatusCode?: string;       // e.g. "FINL", "DEFW", "DDEF", "FORF", "CANC", "POST", "N/R", "TBP" (Game Detail endpoint only)
  GameStatusName?: string;        // e.g. "Final", "Default", "Double Default", "Forfeited", "Cancelled", "Postponed" (Game Detail endpoint only)
  GameStatus?: string;            // e.g. "Final", "Defaulted", "To Be Played" (Schedule endpoint — authoritative for status resolution)
  DefaultingTeamId?: number;      // Team that takes the loss in a forfeit/default (0 or absent for double default; Game Detail endpoint only)
  PublishedFlag: boolean;
  StandingCategoryCode: string;
  DivisionId: number;
  FacilityId: number;
  FacilityTimeSlotId: number;
  UsageCode: string;
  HomeTeamOrganizationId: number;
  HomeTeamClub: string;
  VisitorTeamOrgId: number;
  VisitorTeamClub: string;
  HomeTeamDivisionId?: number; // Division of home team — differs from DivisionId in crossover games
  VisitorTeamDivisionId?: number; // Division of visitor team — differs from DivisionId in crossover games
  DayOfWeek: number;
  FacilityCode: string | null;
  FacilityName: string;
  HomeScore?: number; // Available when limiterCode includes 'S'
  VisitorScore?: number; // Available when limiterCode includes 'S'
}

export interface Practice {
  PracticeId: number;
  PracticeNumber: string;
  PracticeDate: string;
  TeamId: number;
  SeasonId: number;
  FacilityId: number;
  PoolStatusCd: string | null;
  PracticeType: string | null;
  PracticeStatusCdId: number;
  PrivateToTeam: boolean;
  PublishedFlag: boolean;
  StartTime: string;
  EndTime: string;
  Duration: number;
  SharingCode: string | null;
  ShareWithTeamId: number | null;
  ShareWithPracticeId: number | null;
  PracticeComments: string | null;
  SchedulingComments: string | null;
  FacilityTimeSlotId: number | null;
  UsageCode: string;
  DayOfWeek: number;
  FacilityCode: string | null;
  FacilityName: string;
}

export interface ScheduleResponse {
  Schedule: {
    Practices: Practice[];
    Constraints: any[];
    Games: Game[];
  };
}

export interface Team {
  TeamId: number;
  TeamName: string;
  DivisionId: number;
  DivisionName?: string;
  TeamFranchiseId?: number; // Franchise ID for protected list lookups
  PrimaryTeamLogoURL?: string; // Available when limiterCode includes 'I'
  TeamLogoFilename?: string; // Available when limiterCode includes 'I'
  TeamColor1?: string;
  TeamColor2?: string;
  HomeFacilityName?: string; // Available when limiterCode includes 'B'
  HomeFacility1Name?: string; // Alternate facility name field
  HomeFacility2Name?: string; // Alternate facility name field
  // Add more team fields as needed
  [key: string]: any; // Allow other API fields
}

export interface TeamResponse {
  Teams: Team[];
}

// Seasons API Response Types
export interface Division {
  CommonGroupCode: string | null;
  DivisionDescription: string | null;
  DivisionGroupId: number;
  DivisionId: number;
  DivisionName: string;
  DivisionNumber: number | null;
  GenderConstraint: string | null;
  IsActive: boolean;
  OrganizationId: number;
  SeasonId: number;
  TournamentFlag: boolean;
  DisplayString: string;
  StandingCodes?: StandingsCategory[]; // Available when ChildCodes includes 'C'
}

export interface StandingsCategory {
  StandingsCategoryId: number;
  StandingCategoryCode: string;
  StandingCategoryName: string;
  DivisionId: number;
  SeasonId: number;
  SortOrder: number;
}

export interface DivisionGroup {
  CommonGroupCode: string;
  DivGroupName: string;
  DivGroupNumber: string;
  DivisionGroupId: number;
  GenderCd: string | null;
  GovBodyAgeGroupCode: string;
  IsActive: boolean;
  MaxBirthDate: string | null;
  MinBirthDate: string | null;
  OrganizationId: number;
  SeasonId: number;
  BirthDateRange: string;
  DisplayString: string;
  NameCodeSort: string;
  SeasonActive: boolean;
  SeasonGroupGBCode: string;
  SeasonGroupName: string;
  SeasonName: string;
  Divisions: Division[];
}

export interface Season {
  EffectiveAgeDate: string | null;
  EndDate: string;
  FemaleEffectiveAgeDate: string | null;
  GoverningBodySeasonId: number | null;
  IsActive: boolean;
  OrganizationId: number;
  PGBOrganizationId: number | null;
  ProgramId: number;
  PublicWebViewing: boolean;
  SeasonId: number;
  SeasonName: string;
  SeasonTypeCodeId: number;
  StartDate: string;
  TimeZoneCd: string | null;
  DaysDuration: number;
  DisplayString: string;
  OrgName: string;
  ParentOrgName: string;
  PGBOrgName: string;
  ProgramName: string;
  StartEnd: string;
  StartYear: number;
  Groups: DivisionGroup[];
}

export interface SeasonsResponse {
  Season?: Season;  // API returns singular Season object
  Seasons?: Season[];  // Keep this for backwards compatibility
}

// Enhanced Game with team names and other computed fields
export interface EnhancedGame extends Game {
  HomeTeamName?: string;
  VisitorTeamName?: string;
  HomeTeamLogoURL?: string;
  VisitorTeamLogoURL?: string;
  GameStatus?: string;
  DivisionName?: string;
  HomeScore?: number;
  VisitorScore?: number;
}

// Standings response types
export interface TeamStandingRecord {
  TeamId: number;
  TeamName: string;
  DivisionId: number;
  DivisionName?: string;
  GamesPlayed: number;
  Wins: number;
  Losses: number;
  Ties?: number;
  OvertimeLosses?: number;
  Points: number;
  GoalsFor: number;
  GoalsAgainst: number;
  GoalDifferential?: number;
  Percentage?: number;
  Streak?: string;
  // Add any other fields that SportzSoft returns
  [key: string]: any;
}

export interface StandingsResponse {
  Standings?: TeamStandingRecord[];
  Standing?: TeamStandingRecord[];
  // Could also be nested by division
  [key: string]: any;
}

// Helper to detect which divisions and subdivisions are actually active based on team data
export interface ActiveDivisions {
  divisions: string[];  // e.g., ['Senior B', 'Junior A', 'Junior B Tier I']
  subDivisions: Record<string, string[]>;  // e.g., {'Junior B Tier I': ['All', 'North', 'South']}
}

// Helper to detect the actual date range of games in a schedule
export interface GameDateRange {
  firstGameDate: Date | null;
  lastGameDate: Date | null;
  hasGames: boolean;
}

// Additional types that might be needed based on imports I saw
export interface ScoringStats {
  [key: string]: any;
}

export interface GoalieStats {
  [key: string]: any;
}

export interface PenaltyStats {
  [key: string]: any;
}

export interface RosterPlayer {
  [key: string]: any;
}

export interface TeamRosterResponse {
  [key: string]: any;
}

export interface GameDetailResponse {
  [key: string]: any;
}

export interface PlayerSeasonStats {
  PlayerId: number;
  TeamId: number;
  DivisionId: number;
  DivisionName?: string;
  TeamName?: string;
  PlayerName?: string;
  FirstName?: string;
  LastName?: string;
  JerseyNumber?: string;
  Position?: string;
  GamesPlayed?: number;
  Goals?: number;
  Assists?: number;
  Points?: number;
  PenaltyMinutes?: number;
  PlusMinus?: number;
  Shots?: number;
  PowerPlayGoals?: number;
  ShortHandedGoals?: number;
  GameWinningGoals?: number;
  OvertimeGoals?: number;
  PhotoDocId?: number;
  SportPositionId?: number;
  [key: string]: any; // Allow for other variations like GP, G, A, Pts etc.
}

// Game Official - returned by ChildCode 'O' on Game endpoint
export interface GameOfficial {
  PersonId?: number;
  Name?: string;           // Combined name field (e.g. "John Smith")
  FirstName?: string;
  LastName?: string;
  OfficialName?: string;
  RefereeNo?: string | number;  // Primary referee number field from API
  RefereeNumber?: string | number;
  OfficialRole?: string;
  RoleName?: string;
  PositionName?: string;
  SignedTimestamp?: string;  // Unix timestamp or ISO datetime for sign-off
  SignedDateTime?: string;  // When they signed the gamesheet
  SignatureDocId?: number;   // DocId for the image of their signature
  SignatureURL?: string;     // URL for the signature image
  [key: string]: any;
}

// Game TimeOut - returned by ChildCode 'T' on Game endpoint
export interface GameTimeOut {
  GameId: number;
  HomeTeamId: number;
  VisitorTeamId: number;
  TimeOutTeamId: number;
  HomeTimeOut: boolean;
  VisitorTimeOut: boolean;
  StandingCategoryCode: string;
  Period: number;
  TimeOnClock: string;
  [key: string]: any;
}

// Roster entry extended fields for gamesheet display
// ServingSuspension: indicates player is serving a suspension this game
// SuspensionNote: text detail about what suspension they're serving
// InHomePenalties: marks the player as the designated "In Home" for bench penalties (marked with "H" on physical gamesheets)
export interface GameRosterEntry {
  PlayerId?: number;
  PersonId?: number;
  TeamPlayerId?: number;
  TeamId?: number;
  FirstName?: string;
  LastName?: string;
  JerseyNumber?: string;
  PlayerNumber?: string;
  ServingSuspension?: boolean | string;
  SuspensionNote?: string;
  InHomePenalties?: boolean;
  [key: string]: any;
}

// Division Schedule Status - from SportsDivision endpoint with LimiterCode 'S'
export interface DivisionScheduleStatus {
  divisionId: number;
  divisionName: string;
  gameScheduleReady: boolean;  // If true, games can be shown publicly; if false, hide games
  gameScheduleFinal: boolean;  // If true, schedule is complete; if false, schedule is in progress
}