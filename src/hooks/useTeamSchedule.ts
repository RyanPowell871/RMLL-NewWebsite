import { useState, useEffect } from 'react';
import { 
  fetchTeamSchedule, 
  type TeamScheduleResponse,
  type Game,
  type Practice,
  type SportzSoftResponse 
} from '../services/sportzsoft';

interface UseTeamScheduleOptions {
  teamId: number | null;
  seasonId?: number | null;
  includeGames?: boolean;
  includePractices?: boolean;
  limiterCode?: string;
  childCodes?: string;
  startDate?: string;
  endDate?: string;
  autoFetch?: boolean;
}

interface UseTeamScheduleReturn {
  games: Game[];
  practices: Practice[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch team schedule (games and practices)
 * 
 * @param options - Configuration options
 * @param options.teamId - The ID of the team to fetch schedule for (null to skip fetching)
 * @param options.includeGames - Whether to include games (default: true)
 * @param options.includePractices - Whether to include practices (default: false)
 * @param options.limiterCode - Limiter code for the API (default: 'B')
 * @param options.childCodes - Optional child codes for additional data (e.g., 'RB')
 * @param options.startDate - Optional start date filter (YYYY-MM-DD)
 * @param options.endDate - Optional end date filter (YYYY-MM-DD)
 * @param options.autoFetch - Whether to automatically fetch when teamId changes (default: true)
 * 
 * @returns Object containing games array, practices array, loading state, error, and refetch function
 * 
 * @example
 * const { games, practices, loading, error } = useTeamSchedule({ 
 *   teamId: 456654,
 *   includeGames: true,
 *   includePractices: true,
 *   startDate: '2025-05-01',
 *   endDate: '2025-09-30'
 * });
 */
export function useTeamSchedule({
  teamId,
  seasonId,
  includeGames = true,
  includePractices = false,
  limiterCode = 'B',
  childCodes = '',
  startDate,
  endDate,
  autoFetch = true
}: UseTeamScheduleOptions): UseTeamScheduleReturn {
  const [games, setGames] = useState<Game[]>([]);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!teamId) {
      setGames([]);
      setPractices([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {

      
      const response: SportzSoftResponse<TeamScheduleResponse> = await fetchTeamSchedule(
        teamId,
        seasonId || undefined,
        includeGames,
        includePractices,
        limiterCode,
        childCodes,
        startDate,
        endDate
      );

      if (response.Success && response.Response && response.Response.Schedule) {
        const gamesData = response.Response.Schedule.Games || [];
        const practicesData = response.Response.Schedule.Practices || [];
        
        // API already filters by team, so we don't need to filter again here
        setGames(gamesData);
        setPractices(practicesData);
        

      } else {
        throw new Error('Failed to fetch team schedule: API returned Success=false');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error fetching team schedule');
      console.error('[useTeamSchedule] Error:', error);
      setError(error);
      setGames([]);
      setPractices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [teamId, seasonId, includeGames, includePractices, limiterCode, childCodes, startDate, endDate, autoFetch]);

  return {
    games,
    practices,
    loading,
    error,
    refetch: fetchData
  };
}