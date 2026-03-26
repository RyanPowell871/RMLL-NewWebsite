import { useState, useEffect, useMemo, useRef } from 'react';
import { useDivision } from '../contexts/DivisionContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useSeasons } from '../hooks/useSeasons';
import { useLeagueStats, type LeaguePlayerStat, type LeagueGoalieStat } from '../hooks/useLeagueStats';
import { useDivisionMapping } from '../hooks/useDivisionMapping';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Filter, Trophy, Shield, Users as UsersIcon, ChevronRight, X, SlidersHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const gameTypes = [
  { label: 'All Games', value: 'all' },
  { label: 'Regular Season', value: 'regu' },
  { label: 'Playoffs', value: 'plyo' },
  { label: 'Provincials', value: 'prov' }
];

type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: string;
  direction: SortDirection;
}

// Robust text normalizer for division matching
const normalizeDivisionName = (name: string): string => {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/\./g, '') // Remove dots (Jr. -> Jr)
    .replace(/-/g, ' ') // Replace dashes with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/\bjunior\b/g, 'jr') // Standardize Junior
    .replace(/\bsenior\b/g, 'sr') // Standardize Senior
    .replace(/\btier i\b/g, 'tier 1') // Standardize Tier I
    .replace(/\btier ii\b/g, 'tier 2') // Standardize Tier II
    .replace(/\btier iii\b/g, 'tier 3') // Standardize Tier III
    .replace(/\btier 1\b/g, 'tier 1') // Ensure consistency
    .replace(/\btier 2\b/g, 'tier 2')
    .replace(/\btier 3\b/g, 'tier 3')
    .trim();
};

// Count active filters (excluding season which is always visible)
function countActiveFilters(
  selectedSubDivision: string,
  selectedTeam: string,
  selectedGameType: string,
  searchQuery: string,
  availableSubDivisions: string[]
): number {
  let count = 0;
  if (selectedSubDivision !== 'All' && availableSubDivisions.length > 0) count++;
  if (selectedTeam !== 'All Teams') count++;
  if (selectedGameType !== 'all') count++;
  if (searchQuery.trim()) count++;
  return count;
}

export function StatsSection() {
  const { selectedDivision: favoriteDivision, selectedSubDivision: favoriteSubDivision, divisions, subDivisions: contextSubDivisions } = useDivision();
  


  // Filter out 'All Divisions' from available options
  const filteredDivisions = useMemo(() => divisions.filter(d => d !== 'All Divisions'), [divisions]);
  
  // Initialize with favorite division if set, otherwise sessionStorage, otherwise first available
  const [selectedDivision, setSelectedDivision] = useState(() => {
    if (favoriteDivision && favoriteDivision !== 'All Divisions') return favoriteDivision;
    const saved = sessionStorage.getItem('stats-division');
    if (saved && divisions.includes(saved)) return saved;
    if (filteredDivisions.length > 0) return filteredDivisions[0];
    return 'Junior B Tier I'; // Fallback default
  });

  const [selectedSubDivision, setSelectedSubDivision] = useState(() => {
    if (favoriteDivision && favoriteDivision !== 'All Divisions' && favoriteSubDivision) return favoriteSubDivision;
    return sessionStorage.getItem('stats-subdivision') || 'All';
  });
  const [selectedTeam, setSelectedTeam] = useState(() => sessionStorage.getItem('stats-team') || 'All Teams');
  const [selectedGameType, setSelectedGameType] = useState(() => sessionStorage.getItem('stats-gametype') || 'all');
  const [playerType, setPlayerType] = useState<'players' | 'goalies'>(() => (sessionStorage.getItem('stats-playertype') as any) || 'players');
  const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem('stats-search') || '');
  
  // Mobile filter drawer state
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  
  // Sorting State
  const [playerSort, setPlayerSort] = useState<SortConfig>(() => {
      const saved = sessionStorage.getItem('stats-playersort');
      return saved ? JSON.parse(saved) : { key: 'points', direction: 'desc' };
  });
  const [goalieSort, setGoalieSort] = useState<SortConfig>(() => {
      const saved = sessionStorage.getItem('stats-goaliesort');
      return saved ? JSON.parse(saved) : { key: 'savePercentage', direction: 'desc' };
  });

  // Seasons Hook
  const { seasonYears, seasonIdsByYear, getCurrentSeasonYear, seasons } = useSeasons();
  const [selectedSeason, setSelectedSeason] = useState<string>(() => sessionStorage.getItem('stats-season') || '');

  // Persist state changes
  useEffect(() => sessionStorage.setItem('stats-division', selectedDivision), [selectedDivision]);
  useEffect(() => sessionStorage.setItem('stats-subdivision', selectedSubDivision), [selectedSubDivision]);
  useEffect(() => sessionStorage.setItem('stats-team', selectedTeam), [selectedTeam]);
  useEffect(() => sessionStorage.setItem('stats-gametype', selectedGameType), [selectedGameType]);
  useEffect(() => sessionStorage.setItem('stats-playertype', playerType), [playerType]);
  useEffect(() => sessionStorage.setItem('stats-search', searchQuery), [searchQuery]);
  useEffect(() => sessionStorage.setItem('stats-playersort', JSON.stringify(playerSort)), [playerSort]);
  useEffect(() => sessionStorage.setItem('stats-goaliesort', JSON.stringify(goalieSort)), [goalieSort]);
  useEffect(() => {
      if (selectedSeason) sessionStorage.setItem('stats-season', selectedSeason);
  }, [selectedSeason]);

  // Initialize selected season once loaded
  useEffect(() => {
    if (!selectedSeason && seasonYears.length > 0) {
      const current = getCurrentSeasonYear();
      setSelectedSeason(current);
      sessionStorage.setItem('stats-season', current);
    }
  }, [seasonYears, getCurrentSeasonYear, selectedSeason]);

  // Track previous favorite to detect real changes (not just re-mounts)
  const prevFavoriteRef = useRef({ div: favoriteDivision, sub: favoriteSubDivision });

  // Update local division when favorite changes in the header
  useEffect(() => {
    const prevDiv = prevFavoriteRef.current.div;
    const prevSub = prevFavoriteRef.current.sub;
    prevFavoriteRef.current = { div: favoriteDivision, sub: favoriteSubDivision };
    
    // Skip if nothing actually changed (e.g. on mount with same value)
    if (favoriteDivision === prevDiv && favoriteSubDivision === prevSub) return;
    if (!favoriteDivision || favoriteDivision === 'All Divisions') return;
    
    setSelectedDivision(favoriteDivision);
    setSelectedSubDivision(favoriteSubDivision || 'All');
    setSelectedTeam('All Teams');
  }, [favoriteDivision, favoriteSubDivision]);
  
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (filterDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [filterDrawerOpen]);

  // Determine Division IDs for the selected division (Only useful for current season)
  const { divisionGroups: dynamicGroups, subDivisionIds: dynamicSubIds } = useDivisionMapping();
  
  const activeDivisionIds = useMemo(() => {
    // Try exact match first
    if (dynamicGroups[selectedDivision]) {
      return dynamicGroups[selectedDivision];
    }
    // Fallback: try normalized name matching
    const normSelected = normalizeDivisionName(selectedDivision);
    for (const [key, value] of Object.entries(dynamicGroups)) {
      if (normalizeDivisionName(key) === normSelected) {
        return value;
      }
    }
    return null;
  }, [selectedDivision, dynamicGroups]);

  // Determine available Sub-Divisions for the selected Division
  // Use DivisionContext's subDivisions (synced with API names) with fallback to dynamic/static mapping
  const availableSubDivisions = useMemo(() => {
    // Primary: context subDivisions (dynamically built from API, keys match division names)
    const contextSubs = contextSubDivisions[selectedDivision];
    if (contextSubs && contextSubs.length > 0) {
      // Context subs already include 'All' and are properly ordered
      return contextSubs;
    }
    
    // Fallback: dynamic SUB_DIVISION_IDS from context
    if (dynamicSubIds[selectedDivision]) {
      const subDivs = Object.keys(dynamicSubIds[selectedDivision]);
      return subDivs.sort((a, b) => {
        if (a === 'All') return -1;
        if (b === 'All') return 1;
        return a.localeCompare(b);
      });
    }
    
    // Fallback: try normalized name matching
    const normSelected = normalizeDivisionName(selectedDivision);
    for (const [key, value] of Object.entries(dynamicSubIds)) {
      if (normalizeDivisionName(key) === normSelected) {
        const subDivs = Object.keys(value);
        return subDivs.sort((a, b) => {
          if (a === 'All') return -1;
          if (b === 'All') return 1;
          return a.localeCompare(b);
        });
      }
    }
    
    return [];
  }, [selectedDivision, contextSubDivisions, dynamicSubIds]);

  // Determine Division Group ID for optimized fetching
  const seasonId = selectedSeason ? seasonIdsByYear[selectedSeason] : null;
  
  const divisionGroupId = useMemo(() => {
    if (!selectedSeason || !selectedDivision) return null;
    
    const seasonObj = seasons.find(s => s.StartYear.toString() === selectedSeason);
    if (!seasonObj || !seasonObj.Groups) return null;
    
    const normSelected = normalizeDivisionName(selectedDivision);
    
    const group = seasonObj.Groups.find(g => {
       const groupName = g.DivGroupName || g.SeasonGroupName || '';
       const normGroup = normalizeDivisionName(groupName);
       
       return normGroup === normSelected || 
              (normGroup.includes(normSelected) && normSelected.length > 3) || 
              (normSelected.includes(normGroup) && normGroup.length > 3);
    });
    
    return group ? group.DivisionGroupId : null;
  }, [selectedSeason, selectedDivision, seasons]);

  // Fetch League Stats
  const { players, goalies, loading, error, progress } = useLeagueStats(seasonId, null, divisionGroupId, selectedGameType);
  const { navigateTo } = useNavigation();

  // Robust Division Matching
  const isEntityInDivision = (entity: LeaguePlayerStat | LeagueGoalieStat) => {
    if (selectedDivision === 'All Divisions') return false; 

    const normEntityDiv = normalizeDivisionName(entity.division || '');
    const normSelectedDiv = normalizeDivisionName(selectedDivision);
    
    let matchesMainDiv = false;
    
    if (divisionGroupId && entity.divisionGroupId === divisionGroupId) {
      matchesMainDiv = true;
    }
    else if (activeDivisionIds && entity.divisionId && activeDivisionIds.includes(entity.divisionId)) {
      matchesMainDiv = true;
    } 
    else if (normEntityDiv && normEntityDiv.includes(normSelectedDiv)) {
      matchesMainDiv = true;
    }
    else if (normSelectedDiv && normEntityDiv && normSelectedDiv.includes(normEntityDiv) && normEntityDiv.length > 5) {
      matchesMainDiv = true;
    }
    
    if (!matchesMainDiv) return false;

    if (selectedSubDivision !== 'All') {
      const normSelectedSub = normalizeDivisionName(selectedSubDivision);
      if (!normEntityDiv.includes(normSelectedSub)) {
        return false;
      }
    }

    return true;
  };

  // Derive Teams list from fetched data
  const availableTeams = useMemo(() => {
    const teamSet = new Set<string>();
    teamSet.add('All Teams');
    
    players.forEach(p => {
      if (isEntityInDivision(p)) {
        teamSet.add(p.team);
      }
    });
    goalies.forEach(g => {
      if (isEntityInDivision(g)) {
        teamSet.add(g.team);
      }
    });
    
    return Array.from(teamSet).sort();
  }, [players, goalies, selectedDivision, selectedSubDivision]); 

  // Reset team when division changes
  const handleDivisionChange = (division: string) => {
    setSelectedDivision(division);
    setSelectedSubDivision('All');
    setSelectedTeam('All Teams');
    setSelectedGameType('all');
  };

  const handleSort = (key: string, type: 'players' | 'goalies') => {
    const currentSort = type === 'players' ? playerSort : goalieSort;
    const setSort = type === 'players' ? setPlayerSort : setGoalieSort;

    if (currentSort.key === key) {
      setSort({ key, direction: currentSort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      setSort({ key, direction: 'desc' });
    }
  };

  // Filter and Sort Logic
  const processedPlayers = useMemo(() => {
    let filtered = players.filter(p => {
      const matchDivision = isEntityInDivision(p);
      const matchTeam = selectedTeam === 'All Teams' || p.team === selectedTeam;
      const matchSearch = !searchQuery || p.player.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDivision && matchTeam && matchSearch;
    });

    return filtered.sort((a, b) => {
      const aValue = (a as any)[playerSort.key];
      const bValue = (b as any)[playerSort.key];
      
      if (typeof aValue === 'string') {
        return playerSort.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return playerSort.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [players, selectedTeam, searchQuery, playerSort, selectedDivision, selectedSubDivision]);

  const processedGoalies = useMemo(() => {
    let filtered = goalies.filter(g => {
      const matchDivision = isEntityInDivision(g);
      const matchTeam = selectedTeam === 'All Teams' || g.team === selectedTeam;
      const matchSearch = !searchQuery || g.player.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDivision && matchTeam && matchSearch;
    });

    return filtered.sort((a, b) => {
      const aValue = (a as any)[goalieSort.key];
      const bValue = (b as any)[goalieSort.key];
      
      if (typeof aValue === 'string') {
        return goalieSort.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return goalieSort.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [goalies, selectedTeam, searchQuery, goalieSort, selectedDivision, selectedSubDivision]);

  const activeFilterCount = countActiveFilters(selectedSubDivision, selectedTeam, selectedGameType, searchQuery, availableSubDivisions);

  // Helper: returns highlight classes for a data cell if its column is the active sort
  const cellHighlight = (sortKey: string, type: 'players' | 'goalies') => {
    const currentSort = type === 'players' ? playerSort : goalieSort;
    if (currentSort.key === sortKey) {
      return 'bg-blue-50/60 text-[#013fac] font-bold';
    }
    return '';
  };

  // Helper for Table Headers
  const SortableHeader = ({ label, sortKey, type, align = 'center', ...rest }: { label: string, sortKey: string, type: 'players' | 'goalies', align?: 'left' | 'center' | 'right', className?: string }) => {
    const currentSort = type === 'players' ? playerSort : goalieSort;
    const isActive = currentSort.key === sortKey;

    return (
      <th 
        className={`group px-2 sm:px-4 py-3 text-xs font-bold tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none text-${align} ${isActive ? 'text-[#013fac] bg-blue-50/50' : 'text-gray-600'} ${rest.className || ''}`}
        onClick={() => handleSort(sortKey, type)}
      >
        <div className={`flex items-center gap-1 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
          {label}
          <span className={isActive ? 'text-[#013fac]' : 'text-gray-400'}>
            {isActive ? (
              currentSort.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-70 transition-opacity" />
            )}
          </span>
        </div>
      </th>
    );
  };

  // Shared filter controls (used in both inline and drawer)
  const FilterControls = ({ inDrawer = false }: { inDrawer?: boolean }) => (
    <div className={inDrawer ? 'flex flex-col gap-4' : 'flex flex-wrap items-center gap-3 w-full lg:w-auto'}>
      {/* Division Select */}
      <div className={inDrawer ? 'w-full' : 'w-full sm:w-[180px]'}>
        {inDrawer && <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Division</label>}
        <Select value={selectedDivision} onValueChange={handleDivisionChange}>
          <SelectTrigger className="font-bold border-gray-300">
            <SelectValue placeholder="Division" />
          </SelectTrigger>
          <SelectContent>
            {filteredDivisions.map((division) => (
              <SelectItem key={division} value={division} className="font-bold">
                {division}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sub-Division Select (Dynamic) */}
      {availableSubDivisions.length > 0 && (
        <div className={inDrawer ? 'w-full' : 'w-full sm:w-[140px]'}>
          {inDrawer && <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Sub-Division</label>}
          <Select value={selectedSubDivision} onValueChange={setSelectedSubDivision}>
            <SelectTrigger className="font-bold border-gray-300">
              <SelectValue placeholder="Sub-Division" />
            </SelectTrigger>
            <SelectContent>
              {availableSubDivisions.map((sub) => (
                <SelectItem key={sub} value={sub} className="font-bold">
                  {sub}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Team Select */}
      {availableTeams.length > 1 && (
        <div className={inDrawer ? 'w-full' : 'w-full sm:w-[180px]'}>
          {inDrawer && <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Team</label>}
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="font-bold border-gray-300">
              <SelectValue placeholder="All Teams" />
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

      {/* Game Type Select */}
      <div className={inDrawer ? 'w-full' : 'w-full sm:w-[150px]'}>
        {inDrawer && <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Game Type</label>}
        <Select value={selectedGameType} onValueChange={setSelectedGameType}>
          <SelectTrigger className="font-bold border-gray-300">
            <SelectValue placeholder="Game Type" />
          </SelectTrigger>
          <SelectContent>
            {gameTypes.map((type) => (
              <SelectItem key={type.value} value={type.value} className="font-bold">
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search (in drawer) */}
      {inDrawer && (
        <div className="w-full">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={`Search ${playerType}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 font-medium border-gray-300 focus:ring-[#013fac] focus:border-[#013fac]"
            />
          </div>
        </div>
      )}
    </div>
  );

  // Mobile player card
  const PlayerCard = ({ player, index }: { player: LeaguePlayerStat; index: number }) => (
    <div
      className="bg-white border border-gray-200 rounded-lg p-3 active:bg-blue-50 transition-colors"
      onClick={() => navigateTo('player', { playerId: player.playerId, teamId: player.teamId, seasonId, photoDocId: player.photoDocId, fromPage: 'stats', fromLabel: 'Back to Stats' })}
    >
      <div className="flex items-center gap-3 mb-2.5">
        {/* Rank */}
        <div className="shrink-0">
          {index < 3 ? (
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs ${
              index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-300' : 'bg-amber-600'
            }`}>
              {index + 1}
            </div>
          ) : (
            <span className="font-bold text-gray-400 text-xs w-7 text-center block">{index + 1}</span>
          )}
        </div>
        {/* Avatar + Name */}
        <Avatar className="h-9 w-9 border-2 border-white shadow-sm shrink-0">
          <AvatarImage src={player.avatar} />
          <AvatarFallback className="bg-gray-100 text-gray-500 font-bold text-xs">
            {(player.player || '?').split(' ').map(n => n[0]).join('').slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[#013fac] text-sm truncate flex items-center gap-1">
            {player.player}
            {player.jerseyNumber && <span className="text-gray-400 font-normal text-xs">#{player.jerseyNumber}</span>}
          </div>
          <div className="text-xs text-gray-500 truncate">{player.team}</div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
      </div>
      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-1 text-center">
        <div className="bg-gray-50 rounded px-1 py-1.5">
          <div className="text-[10px] text-gray-400 font-bold">GP</div>
          <div className="text-sm font-bold text-gray-900">{player.gamesPlayed}</div>
        </div>
        <div className="bg-gray-50 rounded px-1 py-1.5">
          <div className="text-[10px] text-gray-400 font-bold">G</div>
          <div className="text-sm font-bold text-gray-900">{player.goals}</div>
        </div>
        <div className="bg-gray-50 rounded px-1 py-1.5">
          <div className="text-[10px] text-gray-400 font-bold">A</div>
          <div className="text-sm font-bold text-gray-900">{player.assists}</div>
        </div>
        <div className="bg-[#013fac]/10 rounded px-1 py-1.5">
          <div className="text-[10px] text-[#013fac] font-bold">PTS</div>
          <div className="text-sm font-bold text-[#013fac]">{player.points}</div>
        </div>
        <div className="bg-gray-50 rounded px-1 py-1.5">
          <div className="text-[10px] text-gray-400 font-bold">PIM</div>
          <div className="text-sm font-bold text-gray-900">{player.pim}</div>
        </div>
      </div>
    </div>
  );

  // Mobile goalie card
  const GoalieCard = ({ goalie, index }: { goalie: LeagueGoalieStat; index: number }) => (
    <div
      className="bg-white border border-gray-200 rounded-lg p-3 active:bg-blue-50 transition-colors"
      onClick={() => navigateTo('player', { playerId: goalie.playerId, teamId: goalie.teamId, seasonId, photoDocId: goalie.photoDocId, isGoalie: true, fromPage: 'stats', fromLabel: 'Back to Stats' })}
    >
      <div className="flex items-center gap-3 mb-2.5">
        <div className="shrink-0">
          {index < 3 ? (
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs ${
              index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-300' : 'bg-amber-600'
            }`}>
              {index + 1}
            </div>
          ) : (
            <span className="font-bold text-gray-400 text-xs w-7 text-center block">{index + 1}</span>
          )}
        </div>
        <Avatar className="h-9 w-9 border-2 border-white shadow-sm shrink-0">
          <AvatarImage src={goalie.avatar} />
          <AvatarFallback className="bg-gray-100 text-gray-500 font-bold text-xs">
            {(goalie.player || '?').split(' ').map(n => n[0]).join('').slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[#013fac] text-sm truncate">{goalie.player}</div>
          <div className="text-xs text-gray-500 truncate">{goalie.team}</div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
      </div>
      <div className="grid grid-cols-5 gap-1 text-center">
        <div className="bg-gray-50 rounded px-1 py-1.5">
          <div className="text-[10px] text-gray-400 font-bold">GP</div>
          <div className="text-sm font-bold text-gray-900">{goalie.gamesPlayed}</div>
        </div>
        <div className="bg-gray-50 rounded px-1 py-1.5">
          <div className="text-[10px] text-gray-400 font-bold">GA</div>
          <div className="text-sm font-bold text-gray-900">{goalie.goalsAgainst}</div>
        </div>
        <div className="bg-gray-50 rounded px-1 py-1.5">
          <div className="text-[10px] text-gray-400 font-bold">GAA</div>
          <div className="text-sm font-bold text-gray-900">{goalie.gaa > 0 ? goalie.gaa.toFixed(1) : '-'}</div>
        </div>
        <div className="bg-[#013fac]/10 rounded px-1 py-1.5">
          <div className="text-[10px] text-[#013fac] font-bold">SV%</div>
          <div className="text-sm font-bold text-[#013fac]">{goalie.savePercentage > 0 ? goalie.savePercentage.toFixed(1) : '-'}</div>
        </div>
        <div className="bg-gray-50 rounded px-1 py-1.5">
          <div className="text-[10px] text-gray-400 font-bold">SV</div>
          <div className="text-sm font-bold text-gray-900">{goalie.saves || '-'}</div>
        </div>
      </div>
    </div>
  );

  return (
    <section className="min-h-screen bg-gray-50 py-6 sm:py-8 sm:py-12">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 sm:mb-8 gap-3 sm:gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-gray-900 font-bold tracking-tight mb-2">Stats</h2>
            <div className="h-1 w-16 sm:w-20 bg-[#013fac] rounded"></div>
          </div>
          
          <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            <button
              onClick={() => setPlayerType('players')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-bold transition-all ${
                playerType === 'players'
                  ? 'bg-[#013fac] text-white shadow-md'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <UsersIcon className="w-4 h-4" />
              Players
            </button>
            <button
              onClick={() => setPlayerType('goalies')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-bold transition-all ${
                playerType === 'goalies'
                  ? 'bg-[#013fac] text-white shadow-md'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Shield className="w-4 h-4" />
              Goalies
            </button>
          </div>
        </div>

        {/* Controls Bar — Desktop: inline filters | Mobile: season + filter button */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 mb-5 sm:mb-6 sticky top-20 z-10 backdrop-blur-md bg-white/95 supports-[backdrop-filter]:bg-white/80">
          {/* Mobile: Season + Filter Button row */}
          <div className="flex lg:hidden items-center gap-2">
            {/* Season */}
            <div className="flex-1 min-w-0">
              <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                <SelectTrigger className="font-bold border-gray-300">
                  <SelectValue placeholder="Season" />
                </SelectTrigger>
                <SelectContent>
                  {seasonYears.map((season) => (
                    <SelectItem key={season} value={season} className="font-bold">
                      {season}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Division (shown inline on mobile too for quick switching) */}
            <div className="flex-1 min-w-0">
              <Select value={selectedDivision} onValueChange={handleDivisionChange}>
                <SelectTrigger className="font-bold border-gray-300 text-xs">
                  <SelectValue placeholder="Division" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDivisions.map((division) => (
                    <SelectItem key={division} value={division} className="font-bold">
                      {division}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Filter button */}
            <button
              onClick={() => setFilterDrawerOpen(true)}
              className="relative flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold text-gray-700 transition-colors shrink-0 border border-gray-300"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden xs:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#013fac] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Desktop: All filters inline */}
          <div className="hidden lg:flex flex-row gap-4 justify-between items-center">
            <div className="flex flex-wrap items-center gap-3 w-auto">
              {/* Season Select */}
              <div className="w-[120px]">
                <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                  <SelectTrigger className="font-bold border-gray-300">
                    <SelectValue placeholder="Season" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasonYears.map((season) => (
                      <SelectItem key={season} value={season} className="font-bold">
                        {season}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <FilterControls />
            </div>
            {/* Desktop search */}
            <div className="relative w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={`Search ${playerType}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 font-medium border-gray-300 focus:ring-[#013fac] focus:border-[#013fac]"
              />
            </div>
          </div>
        </div>

        {/* Mobile Filter Drawer Overlay */}
        {filterDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setFilterDrawerOpen(false)}
            />
            {/* Drawer */}
            <div className="absolute top-0 right-0 h-full w-[85vw] max-w-[360px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-[#013fac]" />
                  <h3 className="font-bold text-gray-900">Filters</h3>
                </div>
                <button
                  onClick={() => setFilterDrawerOpen(false)}
                  className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-4">
                <FilterControls inDrawer />
              </div>
              {/* Drawer Footer */}
              <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-2">
                <button
                  onClick={() => {
                    setSelectedSubDivision('All');
                    setSelectedTeam('All Teams');
                    setSelectedGameType('all');
                    setSearchQuery('');
                  }}
                  className="w-full py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => setFilterDrawerOpen(false)}
                  className="w-full py-2.5 bg-[#013fac] text-white font-bold rounded-lg hover:bg-[#012d8a] transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 sm:p-16 text-center">
            <div className="w-16 h-16 border-4 border-[#013fac] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Stats...</h3>
            <p className="text-gray-500">Fetching the latest data from SportzSoft</p>
            {progress > 0 && (
              <div className="w-64 h-2 bg-gray-100 rounded-full mx-auto mt-6 overflow-hidden">
                <div 
                  className="h-full bg-[#013fac] transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm border border-red-100 p-8 sm:p-12 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Unable to Load Stats</h3>
            <p className="text-gray-500 max-w-md mx-auto">{error.message}</p>
          </div>
        ) : (
          <>
            {/* Players */}
            {playerType === 'players' && (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto pb-2">
                    <table className="w-full whitespace-nowrap">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-2 sm:px-4 py-3 text-center w-10 text-xs font-bold text-gray-500">#</th>
                          <SortableHeader label="PLAYER" sortKey="player" type="players" align="left" />
                          <SortableHeader label="No" sortKey="jerseyNumber" type="players" />
                          <SortableHeader label="TEAM" sortKey="team" type="players" align="left" />
                          <SortableHeader label="GP" sortKey="gamesPlayed" type="players" />
                          <SortableHeader label="G" sortKey="goals" type="players" />
                          <SortableHeader label="A" sortKey="assists" type="players" />
                          <SortableHeader label="PTS" sortKey="points" type="players" />
                          <SortableHeader label="PIM" sortKey="pim" type="players" />
                          <SortableHeader label="PPG" sortKey="ppg" type="players" />
                          <SortableHeader label="SHG" sortKey="shg" type="players" />
                          <SortableHeader label="+/-" sortKey="plusMinus" type="players" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {processedPlayers.length > 0 ? processedPlayers.map((player, index) => (
                          <tr 
                            key={`${player.playerId}-${index}`}
                            className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                            onClick={() => navigateTo('player', { playerId: player.playerId, teamId: player.teamId, seasonId, photoDocId: player.photoDocId, fromPage: 'stats', fromLabel: 'Back to Stats' })}
                          >
                            <td className="px-2 sm:px-4 py-3 text-center">
                              {index < 3 ? (
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-white mx-auto text-xs ${
                                  index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-300' : 'bg-amber-600'
                                }`}>
                                  {index + 1}
                                </div>
                              ) : (
                                <span className="font-bold text-gray-400 text-xs">{index + 1}</span>
                              )}
                            </td>
                            <td className="px-2 sm:px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                  <AvatarImage src={player.avatar} />
                                  <AvatarFallback className="bg-gray-100 text-gray-500 font-bold text-xs">
                                    {(player.player || '?').split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-[#013fac] group-hover:underline flex items-center gap-1">
                                    {player.player}
                                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-70 transition-opacity text-[#013fac] shrink-0" />
                                  </div>
                                  <div className="text-xs text-gray-500 hidden sm:block">{player.division}</div>
                                </div>
                              </div>
                            </td>
                            <td className={`px-2 sm:px-4 py-3 text-center text-sm font-bold text-gray-500 ${cellHighlight('jerseyNumber', 'players')}`}>{player.jerseyNumber || '-'}</td>
                            <td className={`px-2 sm:px-4 py-3 text-sm font-medium text-gray-600 ${cellHighlight('team', 'players')}`}>{player.team}</td>
                            <td className={`px-2 sm:px-4 py-3 text-center text-sm font-medium text-gray-900 ${cellHighlight('gamesPlayed', 'players')}`}>{player.gamesPlayed}</td>
                            <td className={`px-2 sm:px-4 py-3 text-center text-sm font-medium text-gray-900 border-l border-gray-100 ${cellHighlight('goals', 'players')}`}>{player.goals}</td>
                            <td className={`px-2 sm:px-4 py-3 text-center text-sm font-medium text-gray-900 border-l border-gray-100 ${cellHighlight('assists', 'players')}`}>{player.assists}</td>
                            <td className={`px-2 sm:px-4 py-3 text-center text-sm font-medium text-gray-900 border-l border-gray-100 ${cellHighlight('points', 'players')}`}>{player.points}</td>
                            <td className={`px-2 sm:px-4 py-3 text-center text-sm text-gray-600 border-l border-gray-100 ${cellHighlight('pim', 'players')}`}>{player.pim}</td>
                            <td className={`px-2 sm:px-4 py-3 text-center text-sm text-gray-500 border-l border-gray-100 ${cellHighlight('ppg', 'players')}`}>{player.ppg || 0}</td>
                            <td className={`px-2 sm:px-4 py-3 text-center text-sm text-gray-500 border-l border-gray-100 ${cellHighlight('shg', 'players')}`}>{player.shg || 0}</td>
                            <td className={`px-2 sm:px-4 py-3 text-center text-sm text-gray-500 border-l border-gray-100 ${cellHighlight('plusMinus', 'players')}`}>{player.plusMinus || 0}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={12} className="px-4 py-12 text-center text-gray-500">
                              No players found matching your criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card List */}
                <div className="md:hidden space-y-2">
                  {processedPlayers.length > 0 ? processedPlayers.map((player, index) => (
                    <PlayerCard key={`${player.playerId}-${index}`} player={player} index={index} />
                  )) : (
                    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                      No players found matching your criteria.
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Goalies */}
            {playerType === 'goalies' && (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap [&_th]:px-2 [&_th]:py-2 [&_td]:px-2 [&_td]:py-2">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-center w-10 text-xs font-bold text-gray-500">#</th>
                          <SortableHeader label="GOALIE" sortKey="player" type="goalies" align="left" />
                          <SortableHeader label="TEAM" sortKey="team" type="goalies" align="left" />
                          <SortableHeader label="GP" sortKey="gamesPlayed" type="goalies" />
                          <SortableHeader label="GD" sortKey="gamesDressed" type="goalies" />
                          <SortableHeader label="Min" sortKey="minutes" type="goalies" />
                          <SortableHeader label="SOG" sortKey="shotsAgainst" type="goalies" />
                          <SortableHeader label="GA" sortKey="goalsAgainst" type="goalies" />
                          <SortableHeader label="GAA" sortKey="gaa" type="goalies" />
                          <SortableHeader label="SV" sortKey="saves" type="goalies" />
                          <SortableHeader label="SV%" sortKey="savePercentage" type="goalies" />
                          <SortableHeader label="G" sortKey="goals" type="goalies" />
                          <SortableHeader label="A" sortKey="assists" type="goalies" />
                          <SortableHeader label="Pts" sortKey="points" type="goalies" />
                          <SortableHeader label="PIM" sortKey="pim" type="goalies" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {processedGoalies.length > 0 ? processedGoalies.map((goalie, index) => (
                          <tr 
                            key={`${goalie.playerId}-${index}`}
                            className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                            onClick={() => navigateTo('player', { playerId: goalie.playerId, teamId: goalie.teamId, seasonId, photoDocId: goalie.photoDocId, isGoalie: true, fromPage: 'stats', fromLabel: 'Back to Stats' })}
                          >
                            <td className="px-4 py-3 text-center">
                              {index < 3 ? (
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-white mx-auto text-xs ${
                                  index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-300' : 'bg-amber-600'
                                }`}>
                                  {index + 1}
                                </div>
                              ) : (
                                <span className="font-bold text-gray-400 text-xs">{index + 1}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8 border-2 border-white shadow-sm shrink-0">
                                  <AvatarImage src={goalie.avatar} />
                                  <AvatarFallback className="bg-gray-100 text-gray-500 font-bold text-xs">
                                    {(goalie.player || '?').split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-[#013fac] group-hover:underline flex items-center gap-1 text-sm truncate">
                                    {goalie.player}
                                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-70 transition-opacity text-[#013fac] shrink-0" />
                                  </div>
                                  <div className="text-xs text-gray-500 hidden sm:block">{goalie.division}</div>
                                </div>
                              </div>
                            </td>
                            <td className={`text-sm font-medium text-gray-600 max-w-[120px] truncate ${cellHighlight('team', 'goalies')}`}>{goalie.team}</td>
                            <td className={`text-center text-sm font-medium text-gray-900 ${cellHighlight('gamesPlayed', 'goalies')}`}>{goalie.gamesPlayed}</td>
                            <td className={`text-center text-sm text-gray-500 ${cellHighlight('gamesDressed', 'goalies')}`}>{goalie.gamesDressed}</td>
                            <td className={`text-center text-sm text-gray-500 ${cellHighlight('minutes', 'goalies')}`}>{goalie.minutes || '-'}</td>
                            <td className={`text-center text-sm font-medium text-gray-900 ${cellHighlight('shotsAgainst', 'goalies')}`}>{goalie.shotsAgainst}</td>
                            <td className={`text-center text-sm font-medium text-gray-900 ${cellHighlight('goalsAgainst', 'goalies')}`}>{goalie.goalsAgainst}</td>
                            <td className={`text-center text-sm font-medium text-gray-900 ${cellHighlight('gaa', 'goalies')}`}>{goalie.gaa > 0 ? goalie.gaa.toFixed(1) : '-'}</td>
                            <td className={`text-center text-sm font-medium text-gray-900 ${cellHighlight('saves', 'goalies')}`}>{goalie.saves || '-'}</td>
                            <td className={`text-center text-sm font-medium text-gray-900 ${cellHighlight('savePercentage', 'goalies')}`}>{goalie.savePercentage > 0 ? goalie.savePercentage.toFixed(1) : '-'}</td>
                            <td className={`text-center text-sm text-gray-500 ${cellHighlight('goals', 'goalies')}`}>{goalie.goals || '-'}</td>
                            <td className={`text-center text-sm text-gray-500 ${cellHighlight('assists', 'goalies')}`}>{goalie.assists || '-'}</td>
                            <td className={`text-center text-sm text-gray-500 ${cellHighlight('points', 'goalies')}`}>{goalie.points || '-'}</td>
                            <td className={`text-center text-sm text-gray-500 ${cellHighlight('pim', 'goalies')}`}>{goalie.pim || '-'}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={15} className="px-4 py-12 text-center text-gray-500">
                              No goalies found matching your criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card List */}
                <div className="md:hidden space-y-2">
                  {processedGoalies.length > 0 ? processedGoalies.map((goalie, index) => (
                    <GoalieCard key={`${goalie.playerId}-${index}`} goalie={goalie} index={index} />
                  )) : (
                    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                      No goalies found matching your criteria.
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}