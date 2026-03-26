import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  fetchAllDivisionScheduleStatuses,
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
}

/**
 * Fetches GameScheduleReady and GameScheduleFinal flags for all provided division IDs.
 * 
 * Business rules (from SportzSoft API):
 * - GameScheduleFinal=true  → show "Schedule Complete"
 * - GameScheduleFinal=false → show "Schedule In Progress"
 * - Games are always visible regardless of flags — we only show status indicators
 */
export function useDivisionScheduleStatus(divisionIds: number[]): UseDivisionScheduleStatusResult {
  const [statusMap, setStatusMap] = useState<Map<number, DivisionScheduleStatus>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchKey = useRef('');

  useEffect(() => {
    if (!divisionIds || divisionIds.length === 0) return;

    // Deduplicate fetch by sorted division IDs
    const fetchKey = [...divisionIds].sort().join(',');
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
  }, [divisionIds.join(',')]);

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
    error
  };
}