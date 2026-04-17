import { useState, useEffect } from 'react';
import { 
  fetchGameDetails,
  type GameDetailResponse, 
  type SportzSoftResponse
} from '../services/sportzsoft';

interface UseGameDetailsOptions {
  gameId: number | null;
  homeTeamId?: number;
  visitorTeamId?: number;
  childCodes?: string;
  limiterCode?: string;
  autoFetch?: boolean;
}

interface UseGameDetailsReturn {
  gameDetails: GameDetailResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch detailed game information including scoring, goalie stats, penalties, and roster
 * 
 * Uses the /Game/{id} endpoint which is required for fetching specific game statistics.
 * The Team Schedule endpoint does NOT provide nested game stats (goals, penalties, etc.).
 */
export function useGameDetails({
  gameId,
  homeTeamId,
  visitorTeamId,
  childCodes = 'SGPROT', // Default to SGPROT (Scoring, Goalie, Penalties, Roster, Officials, TimeOuts)
  limiterCode = 'B',
  autoFetch = true
}: UseGameDetailsOptions): UseGameDetailsReturn {
  const [gameDetails, setGameDetails] = useState<GameDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!gameId) {
      setGameDetails(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the Game endpoint which specifically returns Scoring, Goalie, Penalties, and Roster data
      const response = await fetchGameDetails(
        gameId,
        childCodes,
        limiterCode
      );

      if (response.Success && response.Response) {
        // Normalize the response structure
        // The API returns nested arrays inside the Game object (Response.Game.ScoringStats, etc.)
        // But our component expects them at the top level of the response object
        const rawResponse = response.Response as any;
        
        const gameObj = rawResponse.Game || rawResponse;

        const normalizedDetails: GameDetailResponse = {
          Game: gameObj,
          // Extract arrays from Game object if they exist there, otherwise use top-level or empty array
          ScoringStats: gameObj.ScoringStats || rawResponse.ScoringStats || [],
          GoalieStats: gameObj.GoalieStats || rawResponse.GoalieStats || [],
          PenaltyStats: gameObj.PenaltyStats || rawResponse.PenaltyStats || [],
          // Map RosterView to Roster if Roster is missing
          Roster: gameObj.Roster || rawResponse.Roster || gameObj.RosterView || rawResponse.RosterView || [],
          // Officials data (ChildCode 'O')
          Officials: gameObj.Officials || rawResponse.Officials || gameObj.GameOfficials || rawResponse.GameOfficials || [],
          // TimeOuts data (ChildCode 'T')
          TimeOuts: gameObj.TimeOuts || rawResponse.TimeOuts || gameObj.GameTimeOuts || rawResponse.GameTimeOuts || []
        };
        
        setGameDetails(normalizedDetails);
      } else {
        throw new Error(
          `Failed to fetch game details for Game ID ${gameId}. ` +
          (response.Success ? 'Response was empty.' : 'API returned Success=false.')
        );
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error fetching game details');
      console.error('[useGameDetails] Error:', error);
      setError(error);
      setGameDetails(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [gameId, childCodes, limiterCode, autoFetch]);

  return {
    gameDetails,
    loading,
    error,
    refetch: fetchData
  };
}