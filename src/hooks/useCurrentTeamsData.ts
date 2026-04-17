import { useState, useEffect, useRef } from 'react';
import {
  fetchTeams,
  fetchSeasons,
  DIVISION_NAMES,
  type Team as ApiTeam,
} from '../services/sportzsoft';
import { useSeasons } from './useSeasons';
import { EnhancedTeam } from './useTeamsData';
import { mapToBroadDivision, extractSubDivision } from '../utils/division-mapping';

interface UseCurrentTeamsDataResult {
  teams: EnhancedTeam[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// In-memory cache with expiration
const CACHE_KEY = 'rmll_current_teams_cache_v6'; // v6: added ChildCodes=B for TeamRoles (PRIM/SECD contacts)
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  teams: EnhancedTeam[];
  timestamp: number;
  seasonId: number;
}

/**
 * Fetches teams for the CURRENT season only with caching.
 * Much more efficient than fetching all historical seasons.
 */
export function useCurrentTeamsData(): UseCurrentTeamsDataResult {
  const [teams, setTeams] = useState<EnhancedTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { getCurrentSeasonId, seasons } = useSeasons();

  const fetchCurrentSeasonTeams = async (forceRefresh = false) => {
    const currentSeasonId = getCurrentSeasonId();
    
    if (!currentSeasonId) {

      return;
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const parsed: CachedData = JSON.parse(cachedData);
          const age = Date.now() - parsed.timestamp;
          
          // Use cache if it's for the same season and not expired
          if (parsed.seasonId === currentSeasonId && age < CACHE_EXPIRY_MS) {

            setTeams(parsed.teams);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('[useCurrentTeamsData] Error reading cache:', err);
      }
    }

    setLoading(true);
    setError(null);

    try {

      
      // First, fetch the season data to get division mappings
      const seasonResponse = await fetchSeasons('B', true);
      const currentSeason = seasonResponse.Response?.Season || 
                           seasonResponse.Response?.Seasons?.find((s: any) => s.SeasonId === currentSeasonId);
      
      // Build a dynamic division mapping from the API response
      const divisionMap: Record<number, string> = {};
      if (currentSeason?.Groups) {
        currentSeason.Groups.forEach((group: any) => {
          if (group.Divisions) {
            group.Divisions.forEach((division: any) => {
              divisionMap[division.DivisionId] = division.DivisionName;
            });
          }
        });
      }
      

      
      const response = await fetchTeams(currentSeasonId, 'BIC', 'CLB'); // BIC limiter + C(ontact) L(ink) B(TeamRoles) ChildCodes
      
      if (response.Success && response.Response?.Teams) {
        const apiTeams = response.Response.Teams;
        


        // Enhance teams with division names from our dynamic map
        const enhancedTeams: EnhancedTeam[] = apiTeams.map(team => {
          const apiDivisionName = divisionMap[team.DivisionId] || team.DivisionName || DIVISION_NAMES[team.DivisionId] || 'Unknown Division';
          const broadDivision = mapToBroadDivision(apiDivisionName);
          const subDivision = extractSubDivision(apiDivisionName);
          
          return {
            ...team,
            DivisionName: broadDivision,
            SubDivision: subDivision,
          };
        });

        setTeams(enhancedTeams);
        
        // Cache the results
        try {
          const cacheData: CachedData = {
            teams: enhancedTeams,
            timestamp: Date.now(),
            seasonId: currentSeasonId
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        } catch (err) {
          console.warn('[useCurrentTeamsData] Error caching data:', err);
        }
      } else {
        throw new Error('No teams data in response');
      }
    } catch (err) {
      console.error('[useCurrentTeamsData] Error fetching current season teams:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch teams');
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch when we have a current season ID
    const currentSeasonId = getCurrentSeasonId();
    if (currentSeasonId) {
      fetchCurrentSeasonTeams();
    }
  }, [getCurrentSeasonId()]);

  return { 
    teams, 
    loading, 
    error,
    refetch: () => fetchCurrentSeasonTeams(true)
  };
}