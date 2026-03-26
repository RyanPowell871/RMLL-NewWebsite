import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  AlertTriangle, Gavel, Calendar, DollarSign, Ban, Clock, Users, Info,
  Search, Filter, X, ChevronDown, ChevronUp, BarChart3, ListFilter, FileText, Loader2, ChevronRight
} from 'lucide-react';
import {
  type Suspension, type SeasonData,
  SEASON_SUSPENSIONS,
  getAvailableSeasons, getSuspensionsForSeason,
  extractFilterOptions, categorizeOffense, getPenaltyType,
  parseFineAmount, parseGameCount,
} from './suspensions-data';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

/* ═══════════════════════════════════════════════════════════════
 *  TYPES
 * ═══════════════════════════════════════════════════════════════ */

type ViewMode = 'cards' | 'table';
type PenaltyFilter = 'all' | 'fine' | 'suspension' | 'both' | 'team-fine';

interface Filters {
  search: string;
  team: string;
  division: string;
  offenseCategory: string;
  penaltyType: PenaltyFilter;
  personType: 'all' | 'player' | 'coach' | 'team';
}

const DEFAULT_FILTERS: Filters = {
  search: '',
  team: '',
  division: '',
  offenseCategory: '',
  penaltyType: 'all',
  personType: 'all',
};

/* ═══════════════════════════════════════════════════════════════
 *  FILTER LOGIC
 * ═══════════════════════════════════════════════════════════════ */

function applyFilters(suspensions: Suspension[], filters: Filters): Suspension[] {
  return suspensions.filter(s => {
    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const searchable = [s.name, s.team, s.division, s.offense, s.opponent, s.role].filter(Boolean).join(' ').toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    // Team
    if (filters.team && s.team !== filters.team) return false;

    // Division
    if (filters.division && s.division !== filters.division) return false;

    // Offense category
    if (filters.offenseCategory && categorizeOffense(s) !== filters.offenseCategory) return false;

    // Penalty type
    if (filters.penaltyType !== 'all') {
      const pt = getPenaltyType(s);
      switch (filters.penaltyType) {
        case 'fine': if (pt !== 'Fine') return false; break;
        case 'suspension': if (pt !== 'Suspension') return false; break;
        case 'both': if (pt !== 'Fine & Suspension') return false; break;
        case 'team-fine': if (!s.isTeamFine) return false; break;
      }
    }

    // Person type
    if (filters.personType !== 'all') {
      if (filters.personType === 'coach' && !s.isCoach) return false;
      if (filters.personType === 'team' && !s.isTeamFine) return false;
      if (filters.personType === 'player' && (s.isCoach || s.isTeamFine)) return false;
    }

    return true;
  });
}

/* ═══════════════════════════════════════════════════════════════
 *  STATS COMPUTATION
 * ═══════════════════════════════════════════════════════════════ */

interface Stats {
  totalRecords: number;
  totalFines: number;
  totalGames: number;
  uniquePlayers: number;
  uniqueTeams: number;
  teamFines: number;
  coachSuspensions: number;
}

function computeStats(records: Suspension[]): Stats {
  const players = new Set<string>();
  const teams = new Set<string>();
  let totalFines = 0;
  let totalGames = 0;
  let teamFines = 0;
  let coachSuspensions = 0;

  records.forEach(s => {
    players.add(s.name);
    teams.add(s.team);
    totalFines += parseFineAmount(s.penalties?.fine);
    totalGames += parseGameCount(s.penalties?.suspension);
    if (s.isTeamFine) teamFines++;
    if (s.isCoach) coachSuspensions++;
  });

  return {
    totalRecords: records.length,
    totalFines,
    totalGames,
    uniquePlayers: players.size,
    uniqueTeams: teams.size,
    teamFines,
    coachSuspensions,
  };
}

/* ═══════════════════════════════════════════════════════════════
 *  COMPACT STATS BAR
 * ═══════════════════════════════════════════════════════════════ */

function StatsBar({ stats }: { stats: Stats }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 flex items-center gap-4 sm:gap-6 flex-wrap text-sm">
      <span className="font-semibold text-gray-900">{stats.totalRecords} records</span>
      <span className="text-gray-400 hidden sm:inline">|</span>
      <span className="text-amber-700 flex items-center gap-1">
        <DollarSign className="w-3.5 h-3.5" />{stats.totalFines.toLocaleString()} in fines
      </span>
      <span className="text-gray-400 hidden sm:inline">|</span>
      <span className="text-red-700 flex items-center gap-1">
        <Ban className="w-3.5 h-3.5" />{stats.totalGames} games suspended
      </span>
      <span className="text-gray-400 hidden sm:inline">|</span>
      <span className="text-gray-600">{stats.uniqueTeams} teams</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
 *  SUSPENSION CARD
 * ═══════════════════════════════════════════════════════════════ */

function SuspensionCard({ s, isCarryover = false }: { s: Suspension; isCarryover?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  const penaltyColor = s.isTeamFine
    ? 'border-l-orange-500'
    : s.isCoach
      ? 'border-l-blue-500'
      : s.penalties?.suspension
        ? 'border-l-red-500'
        : 'border-l-amber-500';

  return (
    <div className={`bg-white border border-gray-200 rounded-lg border-l-4 ${penaltyColor} overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-3 sm:p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-gray-900 text-sm sm:text-base">{s.name}</span>
              {s.isTeamFine && (
                <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">Team Fine</span>
              )}
              {s.isCoach && (
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">{s.role || 'Coach'}</span>
              )}
              {s.isRuling && (
                <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">Ruling</span>
              )}
              {isCarryover && (
                <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">Carryover</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{s.date}</span>
              <span className="font-medium text-gray-700">{s.team}</span>
              {s.division && <span>{s.division}</span>}
              {s.opponent && <span>vs {s.opponent}</span>}
            </div>
            <p className="text-sm text-gray-700 mt-1.5 font-medium">{s.offense}</p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {s.penalties?.fine && (
                <span className="text-xs flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  <DollarSign className="w-3 h-3" />{s.penalties.fine}
                </span>
              )}
              {s.penalties?.suspension && (
                <span className="text-xs flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                  <Ban className="w-3 h-3" />{s.penalties.suspension}
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0 mt-1">
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>
      </button>
      {expanded && s.penalties?.gamesDetail && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100">
          <div className="bg-gray-50 rounded-md p-3 mt-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Details</p>
            <p className="text-sm text-gray-700 leading-relaxed">{s.penalties.gamesDetail}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
 *  FILTER SECTION
 * ═══════════════════════════════════════════════════════════════ */

function FilterSection({
  filters,
  onChange,
  onReset,
  filterOptions,
  allRecords,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  onReset: () => void;
  filterOptions: { teams: string[]; divisions: string[]; offenseCategories: string[] };
  allRecords: Suspension[];
}) {
  const [open, setOpen] = useState(false);
  const activeCount = [
    filters.team,
    filters.division,
    filters.offenseCategory,
    filters.penaltyType !== 'all' ? filters.penaltyType : '',
    filters.personType !== 'all' ? filters.personType : '',
  ].filter(Boolean).length;

  // When a division is selected, only show teams from that division
  const availableTeams = useMemo(() => {
    if (!filters.division) return filterOptions.teams;
    const teamsInDiv = new Set<string>();
    for (const s of allRecords) {
      if (s.division === filters.division) teamsInDiv.add(s.team);
    }
    return [...teamsInDiv].sort();
  }, [filters.division, filterOptions.teams, allRecords]);

  // When division changes, clear team if it's no longer valid
  const handleDivisionChange = (division: string) => {
    const next: Filters = { ...filters, division };
    if (next.team) {
      // Check if current team exists in new division
      const teamsInDiv = new Set<string>();
      if (division) {
        for (const s of allRecords) {
          if (s.division === division) teamsInDiv.add(s.team);
        }
        if (!teamsInDiv.has(next.team)) {
          next.team = '';
        }
      }
    }
    onChange(next);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
          {activeCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-[#013fac] text-white rounded-full font-medium">{activeCount}</span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className="p-3 pt-0 border-t border-gray-100 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <select
              value={filters.division}
              onChange={(e) => handleDivisionChange(e.target.value)}
              className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white"
            >
              <option value="">All Divisions</option>
              {filterOptions.divisions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select
              value={filters.team}
              onChange={(e) => onChange({ ...filters, team: e.target.value })}
              className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white"
            >
              <option value="">All Teams{filters.division ? ` (${filters.division})` : ''}</option>
              {availableTeams.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              value={filters.offenseCategory}
              onChange={(e) => onChange({ ...filters, offenseCategory: e.target.value })}
              className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white"
            >
              <option value="">All Offenses</option>
              {filterOptions.offenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={filters.penaltyType}
              onChange={(e) => onChange({ ...filters, penaltyType: e.target.value as PenaltyFilter })}
              className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white"
            >
              <option value="all">All Penalties</option>
              <option value="fine">Fines Only</option>
              <option value="suspension">Suspensions Only</option>
              <option value="both">Fine & Suspension</option>
              <option value="team-fine">Team Fines</option>
            </select>
            <select
              value={filters.personType}
              onChange={(e) => onChange({ ...filters, personType: e.target.value as Filters['personType'] })}
              className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white"
            >
              <option value="all">All People</option>
              <option value="player">Players</option>
              <option value="coach">Coaches</option>
              <option value="team">Teams</option>
            </select>
            <button
              onClick={onReset}
              className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md px-2 py-1.5 border border-red-200 transition-colors"
            >
              Reset All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
 *  TABLE VIEW — expandable rows
 * ═══════════════════════════════════════════════════════════════ */

function ExpandableRow({ s }: { s: Suspension }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = !!(s.penalties?.gamesDetail || s.opponent);

  // Build compact penalty string
  const penaltyParts: string[] = [];
  if (s.penalties?.fine) penaltyParts.push(s.penalties.fine);
  if (s.penalties?.suspension) penaltyParts.push(s.penalties.suspension);
  const penaltyStr = penaltyParts.join(' + ');

  return (
    <>
      <tr
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={`border-b border-gray-100/80 text-xs transition-colors ${
          hasDetails ? 'cursor-pointer hover:bg-gray-50' : ''
        } ${expanded ? 'bg-blue-50/30' : ''}`}
      >
        <td className="pl-2 pr-0 py-1.5 w-5">
          {hasDetails && (
            <ChevronRight className={`w-3 h-3 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          )}
        </td>
        <td className="px-2 py-1.5 font-medium text-gray-900 whitespace-nowrap">
          {s.name}
          {s.isTeamFine && <span className="ml-1 text-[9px] text-orange-600 font-semibold">[T]</span>}
          {s.isCoach && <span className="ml-1 text-[9px] text-blue-600 font-semibold">[C]</span>}
        </td>
        <td className="px-2 py-1.5 text-gray-500 whitespace-nowrap">{s.team}{s.division ? <span className="text-gray-400 hidden lg:inline"> / {s.division}</span> : ''}</td>
        <td className="px-2 py-1.5 text-gray-700 max-w-[240px] truncate" title={s.offense}>{s.offense}</td>
        <td className="px-2 py-1.5 whitespace-nowrap">
          {penaltyStr ? (
            <span className={`font-medium ${s.penalties?.suspension ? 'text-red-700' : 'text-amber-700'}`}>{penaltyStr}</span>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
        <td className="px-2 py-1.5 text-gray-400 whitespace-nowrap hidden sm:table-cell">{s.date}</td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50/70 text-xs">
          <td></td>
          <td colSpan={5} className="px-2 py-2">
            <div className="space-y-0.5 text-gray-600">
              {s.opponent && <p><span className="font-semibold text-gray-700">vs</span> {s.opponent}</p>}
              {s.penalties?.gamesDetail && <p className="leading-relaxed">{s.penalties.gamesDetail}</p>}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function SuspensionTable({ records }: { records: Suspension[] }) {
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-500">
            <th className="w-5 pl-2 pr-0 py-1.5"></th>
            <th className="text-left px-2 py-1.5 font-semibold">Name</th>
            <th className="text-left px-2 py-1.5 font-semibold">Team</th>
            <th className="text-left px-2 py-1.5 font-semibold">Offense</th>
            <th className="text-left px-2 py-1.5 font-semibold">Penalty</th>
            <th className="text-left px-2 py-1.5 font-semibold hidden sm:table-cell">Date</th>
          </tr>
        </thead>
        <tbody>
          {records.map((s, i) => (
            <ExpandableRow key={`${s.name}-${s.sortDate}-${i}`} s={s} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
 *  MAIN PAGE COMPONENT
 * ═══════════════════════════════════════════════════════════════ */

export function SuspensionsPage() {
  // ── Dynamic data from KV (with hardcoded fallback) ──
  const [allSeasonsData, setAllSeasonsData] = useState<SeasonData[]>(SEASON_SUSPENSIONS);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'loading' | 'api' | 'hardcoded'>('loading');

  useEffect(() => {
    let cancelled = false;
    async function loadFromApi() {
      try {
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/cms/suspensions/all`,
          { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
        );
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        if (!cancelled && data.success && data.fromKv && data.allSeasons?.length > 0) {
          setAllSeasonsData(data.allSeasons);
          setDataSource('api');
        } else if (!cancelled) {
          setDataSource('hardcoded');
        }
      } catch (err) {

        if (!cancelled) setDataSource('hardcoded');
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }
    loadFromApi();
    return () => { cancelled = true; };
  }, []);

  // Derived helpers using dynamic data
  const availableSeasons = useMemo(
    () => allSeasonsData.map(s => s.season).sort((a, b) => b - a),
    [allSeasonsData]
  );
  const [selectedSeason, setSelectedSeason] = useState<number>(0);

  // Set initial season once data loads
  useEffect(() => {
    if (availableSeasons.length > 0 && selectedSeason === 0) {
      setSelectedSeason(availableSeasons[0]);
    }
  }, [availableSeasons, selectedSeason]);

  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  // Get data for selected season
  const seasonData = useMemo(() => {
    const found = allSeasonsData.find(s => s.season === selectedSeason);
    return {
      suspensions: found?.suspensions || [],
      carryovers: found?.carryovers || [],
    };
  }, [allSeasonsData, selectedSeason]);

  const currentSeasonMeta = useMemo(
    () => allSeasonsData.find(s => s.season === selectedSeason),
    [allSeasonsData, selectedSeason]
  );

  // Combine all records for this season for filtering
  const allSeasonRecords = useMemo(() => {
    return [...seasonData.suspensions, ...seasonData.carryovers].sort((a, b) => {
      return b.sortDate.localeCompare(a.sortDate);
    });
  }, [seasonData]);

  // Filter options come from the full (unfiltered) season data
  const filterOptions = useMemo(() => extractFilterOptions(allSeasonRecords), [allSeasonRecords]);

  // Apply filters
  const filteredRecords = useMemo(() => applyFilters(allSeasonRecords, filters), [allSeasonRecords, filters]);

  // Stats from filtered current season only (exclude carryovers)
  const filteredSeason = useMemo(() => {
    const seasonIds = new Set(seasonData.suspensions.map(s => s.name + s.sortDate));
    return filteredRecords.filter(s => seasonIds.has(s.name + s.sortDate));
  }, [filteredRecords, seasonData.suspensions]);

  // Stats from filtered current season only
  const stats = useMemo(() => computeStats(filteredSeason), [filteredSeason]);

  // For card view: split filtered into season vs carryover
  const filteredCarryovers = useMemo(() => {
    const seasonIds = new Set(seasonData.suspensions.map(s => s.name + s.sortDate));
    return filteredRecords.filter(s => !seasonIds.has(s.name + s.sortDate));
  }, [filteredRecords, seasonData.suspensions]);

  // Reset filters when season changes
  const handleSeasonChange = useCallback((season: number) => {
    setSelectedSeason(season);
    setFilters(DEFAULT_FILTERS);
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-amber-50 border-2 border-red-300 rounded-lg p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Gavel className="w-7 h-7 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Suspensions & Fines</h2>
              <p className="text-sm text-gray-600 mt-1">
                Disciplinary actions across all RMLL seasons. Select a season and use filters to find specific records.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Season Selector + View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {availableSeasons.map(year => (
            <button
              key={year}
              onClick={() => handleSeasonChange(year)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                selectedSeason === year
                  ? 'bg-[#013fac] text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search..."
              className="pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg w-44 focus:outline-none focus:ring-2 focus:ring-[#013fac]/20 focus:border-[#013fac]"
            />
            {filters.search && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'cards' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'table' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterSection
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
        filterOptions={filterOptions}
        allRecords={allSeasonRecords}
      />

      {/* Stats Row */}
      <StatsBar stats={stats} />

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Showing {filteredRecords.length} of {allSeasonRecords.length} records
          {dataSource === 'api' && (
            <span className="ml-2 text-xs text-green-600 font-medium">(Live from CMS)</span>
          )}
        </span>
      </div>

      {/* Content */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No records match your filters</p>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filter criteria.</p>
          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="mt-3 text-sm text-[#013fac] hover:underline font-medium"
          >
            Reset all filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <SuspensionTable records={filteredRecords} />
      ) : (
        <div className="space-y-6">
          {/* Current season suspensions */}
          {filteredSeason.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Gavel className="w-4 h-4" />
                {selectedSeason} Season Suspensions ({filteredSeason.length})
              </h3>
              <div className="space-y-2">
                {filteredSeason.map((s, i) => (
                  <SuspensionCard key={`s-${s.name}-${s.sortDate}-${i}`} s={s} />
                ))}
              </div>
            </div>
          )}

          {/* Carryovers */}
          {filteredCarryovers.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Carryovers from Previous Season ({filteredCarryovers.length})
              </h3>
              <div className="space-y-2">
                {filteredCarryovers.map((s, i) => (
                  <SuspensionCard key={`c-${s.name}-${s.sortDate}-${i}`} s={s} isCarryover />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Association Statuses */}
      {currentSeasonMeta?.associationStatuses && currentSeasonMeta.associationStatuses.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Minor Association Suspension Report Status
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {currentSeasonMeta.associationStatuses.map((a, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{a.abbreviation}</span>
                    <span className="text-xs text-gray-500 ml-1.5">{a.name}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    a.status === 'None' ? 'bg-gray-100 text-gray-600' :
                    a.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                    a.status === 'Received' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          All suspensions and fines are issued in accordance with RMLL Bylaws and Regulations. 
          For questions regarding specific disciplinary actions, contact the RMLL Executive Director.
        </p>
      </div>
    </div>
  );
}