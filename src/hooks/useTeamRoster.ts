import { useState, useEffect } from 'react';
import { fetchTeamRoster, type SportzSoftResponse, type TeamRosterResponse } from '../services/sportzsoft';

interface UseTeamRosterOptions {
  teamId: number | null;
  limiterCode?: string;
  childCodes?: string;
  autoFetch?: boolean;
}

interface UseTeamRosterReturn {
  roster: any[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  availableSeasons: string[];
  fullResponse: any;
}

/**
 * Custom hook to fetch team roster
 */
export function useTeamRoster({
  teamId,
  limiterCode = 'BI',
  childCodes = 'HSRBPG', // H=SeasonalTeams (must be first), S=Schedule, R=Roster, B=TeamRoles, P=PlayerStats, G=GoalieStats
  autoFetch = true
}: UseTeamRosterOptions): UseTeamRosterReturn {
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([]);
  const [fullResponse, setFullResponse] = useState<any>(null);

  const fetchData = async () => {
    if (!teamId) {
      setRoster([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response: SportzSoftResponse<TeamRosterResponse> = await fetchTeamRoster(
        teamId,
        limiterCode,
        childCodes
      );

      if (response.Success && response.Response && response.Response.Team) {
        // Store full response for access to SeasonalTeams
        // The API returns data nested under Response.Team
        setFullResponse(response.Response.Team);
        
        // Extract available season IDs from SeasonalTeams array
        const seasonIds: string[] = [];
        if (response.Response.Team.SeasonalTeams && Array.isArray(response.Response.Team.SeasonalTeams)) {
          response.Response.Team.SeasonalTeams.forEach((seasonData: any, index: number) => {
            if (seasonData.SeasonId) {
              seasonIds.push(seasonData.SeasonId.toString());
            }
          });
        }
        setAvailableSeasons(seasonIds);
        
        // Set current roster (from Response.Team.Roster - current season)
        const rosterData = response.Response.Team.Roster || [];
        setRoster(rosterData);
      } else {
        console.error('[useTeamRoster] API returned Success=false or no Response:', response);
        throw new Error('Failed to fetch team roster: API returned Success=false');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error fetching team roster');
      console.error('[useTeamRoster] Error:', error);
      setError(error);
      setRoster([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [teamId, limiterCode, childCodes, autoFetch]);

  return {
    roster,
    loading,
    error,
    refetch: fetchData,
    availableSeasons,
    fullResponse
  };
}