import { useState, useEffect } from 'react';
import {
  fetchTeams,
  DIVISION_NAMES,
  type Team as ApiTeam,
} from '../services/sportzsoft';
import { useSeasons } from './useSeasons';
import { EnhancedTeam } from './useTeamsData';

// Map API subdivision names to broader division categories
const mapToBroadDivision = (divisionName: string): string => {
  if (divisionName === 'Alberta Major Female') return 'Alberta Major Female';
  if (divisionName === 'Alberta Major Senior Female') return 'Alberta Major Senior Female';
  if (divisionName === 'Jr. A') return 'Junior A';
  
  // Check Tier III and Tier II BEFORE Tier I since they contain "Tier I" as a substring
  if (divisionName.includes('Jr. Tier III')) return 'Junior B Tier III';
  if (divisionName.includes('Jr. B Tier II')) return 'Junior B Tier II';
  if (divisionName.includes('Jr. B Tier I')) return 'Junior B Tier I';
  
  if (divisionName === 'Sr. B') return 'Senior B';
  if (divisionName.includes('Sr. C')) return 'Senior C';
  
  return divisionName;
};

interface UseAllTeamsDataResult {
  teams: EnhancedTeam[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches ALL teams across ALL seasons and deduplicates them.
 * Returns a historical list of teams that have ever existed.
 */
export function useAllTeamsData(): UseAllTeamsDataResult {
  const [teams, setTeams] = useState<EnhancedTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { seasons, seasonIdsByYear } = useSeasons();

  useEffect(() => {
    const fetchAllTeams = async () => {
      // Check if seasons are defined and have data
      if (!seasons || seasons.length === 0) {
        // Seasons not loaded yet

        return;
      }

      setLoading(true);
      setError(null);

      try {

        
        // Fetch teams for each season
        const allTeamsPromises = seasons.map(async (season) => {
          try {
            const response = await fetchTeams(season.SeasonId, 'BI'); // Use 'BI' to include team images
            if (response.Success && response.Response?.Teams) {
              return response.Response.Teams.map(team => ({
                ...team,
                SeasonYear: season.StartYear.toString()
              }));
            }
            return [];
          } catch (err) {
            console.warn(`Failed to fetch teams for season ${season.StartYear}:`, err);
            return [];
          }
        });

        const allTeamsArrays = await Promise.all(allTeamsPromises);
        const allTeamsFlat = allTeamsArrays.flat();
        


        // Deduplicate teams by TeamId (keep the most recent entry for each team)
        const uniqueTeamsMap = new Map<number, ApiTeam & { SeasonYear: string }>();
        
        allTeamsFlat.forEach(team => {
          const existing = uniqueTeamsMap.get(team.TeamId);
          if (!existing || parseInt(team.SeasonYear) > parseInt(existing.SeasonYear)) {
            uniqueTeamsMap.set(team.TeamId, team);
          }
        });

        const uniqueTeams = Array.from(uniqueTeamsMap.values());
        


        // Enhance teams with division names
        const enhancedTeams: EnhancedTeam[] = uniqueTeams.map(team => {
          // Build dynamic division name from the season the team belongs to
          let apiDivisionName = team.DivisionName || '';
          if (!apiDivisionName) {
            const teamSeason = seasons.find(s => s.StartYear.toString() === (team as any).SeasonYear);
            if (teamSeason?.Groups) {
              for (const group of teamSeason.Groups) {
                const div = group.Divisions?.find(d => d.DivisionId === team.DivisionId);
                if (div) {
                  apiDivisionName = div.DivisionName || group.DivGroupName || '';
                  break;
                }
              }
            }
          }
          if (!apiDivisionName) {
            apiDivisionName = DIVISION_NAMES[team.DivisionId] || 'Unknown Division';
          }
          const broadDivision = mapToBroadDivision(apiDivisionName);
          
          return {
            ...team,
            DivisionName: broadDivision,
          };
        });


        setTeams(enhancedTeams);
      } catch (err) {
        console.error('[useAllTeamsData] Error fetching all teams:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch teams');
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllTeams();
  }, [seasons]);

  return { teams, loading, error };
}