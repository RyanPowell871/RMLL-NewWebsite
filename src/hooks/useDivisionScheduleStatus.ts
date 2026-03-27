import { useState, useEffect, useRef, useMemo } from 'react';
import {
  fetchAllDivisionScheduleStatuses,
  clearDivisionScheduleCache,
  isApiKeyReady,
  type DivisionScheduleStatus
} from '../services/sportzsoft';

interface UseDivisionScheduleStatusResult {
  /** Map of divisionId → schedule status */
  statusMap: Map<number, DivisionScheduleStatus>;
  /** Whether a division's games should be publicly visible (GameScheduleReady) */
  isScheduleReady: (divisionId: number) => boolean;
  /** Whether a division's schedule is finalized (complete) vs in progress (GameScheduleFinal) */
  isScheduleFinal: (divisionId: number) => boolean;
  /** Set of division IDs where GameScheduleFinal=false — show "in progress" indicator */
  inProgressDivisionIds: Set<number>;
  loading: boolean;
  error: string | null;
  /** Force refetch the schedule status (clears cache) */
  refetch: () => Promise<void>;
}

/**
 * Fetches GameScheduleReady and GameScheduleFinal flags for all provided division IDs.
 *
 * Business rules (from SportzSoft API):
 * - GameScheduleFinal=true  → show "Schedule Complete"
 * - GameScheduleFinal=false → show "Schedule In Progress"
 * - Games are always visible regardless of flags — we only show status indicators
 *
 * @param divisionIds - Division IDs to fetch status for
 * @param seasonId - Optional season ID to include in fetch key (for cache invalidation)
 */
export function useDivisionScheduleStatus(
  divisionIds: number[],
  seasonId?: number
): UseDivisionScheduleStatusResult {
  const [statusMap, setStatusMap] = useState<Map<number, DivisionScheduleStatus>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchKey = useRef('');

  const refetch = useRef(async () => {
    if (!divisionIds || divisionIds.length === 0) return;

    // Clear cache for these divisions to force fresh fetch
    clearDivisionScheduleCache(divisionIds);

    // Reset last fetch key to trigger fetch
    lastFetchKey.current = '';

    // The effect will now re-fetch because lastFetchKey doesn't match
  }).current;

  useEffect(() => {
    if (!divisionIds || divisionIds.length === 0) return;

    // Include seasonId in fetch key to invalidate cache when season changes
    const fetchKey = `${[...divisionIds].sort().join(',')}:${seasonId || ''}`;
    if (fetchKey === lastFetchKey.current) return;

    const fetchStatuses = async () => {
      // Wait for API key
      let attempts = 0;
      while (!isApiKeyReady() && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      if (!isApiKeyReady()) {
        setError('API key not initialized');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const map = await fetchAllDivisionScheduleStatuses(divisionIds);
        setStatusMap(map);
        lastFetchKey.current = fetchKey;
      } catch (err) {
        console.error('[useDivisionScheduleStatus] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch division schedule status');
      } finally {
        setLoading(false);
      }
    };

    fetchStatuses();
  }, [divisionIds.join(','), seasonId]);

  const isScheduleReady = (divisionId: number): boolean => {
    const status = statusMap.get(divisionId);
    // Default to true (show games) if we don't have status info yet
    return status ? status.gameScheduleReady : true;
  };

  const isScheduleFinal = (divisionId: number): boolean => {
    const status = statusMap.get(divisionId);
    // Default to true (complete) if we don't have status info — avoids
    // showing "in progress" for older seasons we haven't fetched yet
    return status ? status.gameScheduleFinal : true;
  };

  // Precompute in-progress division IDs (GameScheduleFinal=false) — show "in progress" indicator
  const inProgressDivisionIds = useMemo(() => {
    const ids = new Set<number>();
    statusMap.forEach((status, divId) => {
      if (!status.gameScheduleFinal) {
        ids.add(divId);
      }
    });
    return ids;
  }, [statusMap]);

  return {
    statusMap,
    isScheduleReady,
    isScheduleFinal,
    inProgressDivisionIds,
    loading,
    error,
    refetch
  };
}