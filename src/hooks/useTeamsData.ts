import { useState, useEffect } from 'react';
import {
  fetchTeams,
  DIVISION_NAMES,
  useMockData,
  type Team as ApiTeam,
} from '../services/sportzsoft';
import { useSeasons } from './useSeasons';
import { useDivisionMapping } from './useDivisionMapping';
import { mapToBroadDivision, extractSubDivision } from '../utils/division-mapping';

export interface EnhancedTeam extends ApiTeam {
  DivisionName: string;
  SubDivisionName?: string;  // Store the original subdivision name for filtering
  SubDivision?: string;      // Extracted subdivision (e.g., 'North', 'South')
}

interface UseTeamsDataOptions {
  season?: string;
  division?: string;
  subDivision?: string;
}

interface UseTeamsDataResult {
  teams: EnhancedTeam[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Mock team data for fallback
const mockTeams: EnhancedTeam[] = [
  { TeamId: 141462, TeamName: 'Sr. Miners', DivisionId: 76889, DivisionName: 'Senior B' },
  { TeamId: 141463, TeamName: 'Knights', DivisionId: 76889, DivisionName: 'Senior B' },
  { TeamId: 141464, TeamName: 'Outlaws', DivisionId: 76889, DivisionName: 'Senior B' },
  { TeamId: 141496, TeamName: 'Sr. C Warriors', DivisionId: 76905, DivisionName: 'Senior C' },
  { TeamId: 141497, TeamName: 'Rage', DivisionId: 76905, DivisionName: 'Senior C' },
];

export function useTeamsData(options: UseTeamsDataOptions = {}): UseTeamsDataResult {
  const { season = '2025', division, subDivision } = options;
  const [teams, setTeams] = useState<EnhancedTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get season IDs from the API
  const { seasons, seasonIdsByYear } = useSeasons();
  const { divisionGroups, subDivisionIds } = useDivisionMapping();

  const fetchData = async () => {
    // If using mock data, return immediately
    if (useMockData) {
      setTeams(mockTeams);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const seasonId = seasonIdsByYear[season];
      if (!seasonId) {
        console.warn(`Season ID not found for ${season}, skipping fetch`);
        setTeams([]);
        setLoading(false);
        return;
      }

      const response = await fetchTeams(seasonId);

      if (response.Success && response.Response?.Teams) {
        // Build dynamic division name lookup from season data
        const dynamicDivNames: Record<number, string> = {};
        const seasonObj = seasons.find(s => s.StartYear.toString() === season);
        if (seasonObj?.Groups) {
          seasonObj.Groups.forEach(group => {
            const groupName = group.DivGroupName || group.SeasonGroupName || '';
            group.Divisions?.forEach(div => {
              if (div.DivisionId) {
                dynamicDivNames[div.DivisionId] = div.DivisionName || groupName;
              }
            });
          });
        }

        // Enhance teams with division names
        const enhancedTeams: EnhancedTeam[] = response.Response.Teams.map(team => {
          const apiDivisionName = dynamicDivNames[team.DivisionId] || team.DivisionName || DIVISION_NAMES[team.DivisionId] || 'Unknown Division';
          const broadDivision = mapToBroadDivision(apiDivisionName);
          const subDivision = extractSubDivision(apiDivisionName);
          
          return {
            ...team,
            DivisionName: broadDivision,
            SubDivisionName: subDivision,
            SubDivision: subDivision,
          };
        });
        
        setTeams(enhancedTeams);
      } else {
        setTeams([]);
      }
    } catch (err) {
      console.error('Error fetching teams data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch teams');
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [season, seasonIdsByYear]);

  // Filter teams by division using division IDs (like the Schedule page)
  const filteredTeams = (() => {
    if (!division || division === 'All Divisions') {
      return teams;
    }

    // Get the division IDs for this division group (dynamic with fallback)
    const divisionIds = divisionGroups[division];
    
    if (!divisionIds || divisionIds.length === 0) {
      return teams;
    }

    // Filter teams by division ID
    const filtered = teams.filter(team => divisionIds.includes(team.DivisionId));
    return filtered;
  })();

  // Further filter by subdivision using subdivision IDs
  const finalFilteredTeams = (() => {
    if (!division || !subDivision || subDivision === 'All') {
      return filteredTeams;
    }

    // Get the subdivision IDs for this division and subdivision (dynamic with fallback)
    const subDivIds = subDivisionIds[division]?.[subDivision];
    
    if (!subDivIds || subDivIds.length === 0) {
      return filteredTeams;
    }

    // Filter teams by subdivision ID
    const finalFiltered = filteredTeams.filter(team => subDivIds.includes(team.DivisionId));
    return finalFiltered;
  })();

  return {
    teams: finalFilteredTeams,
    loading,
    error,
    refetch: fetchData
  };
}