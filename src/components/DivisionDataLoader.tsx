import { useEffect, useRef } from 'react';
import { useDivision } from '../contexts/DivisionContext';
import { 
  fetchTeams, 
  fetchSchedule,
  detectActiveDivisions, 
  buildDivisionGroups,
  buildDynamicSubDivisionIds,
  SEASON_IDS, 
  useMockData, 
  type Team,
  type Season
} from '../services/sportzsoft';
import { useSeasons } from '../hooks/useSeasons';

/**
 * DivisionDataLoader
 * 
 * This component loads team data for the current season and updates the 
 * DivisionContext with active divisions based on actual data.
 * 
 * Season rollover logic:
 * - Tries the most recent season first
 * - If the most recent season has teams but its first game hasn't started yet,
 *   falls back to the previous season (so the site shows current-season data
 *   until the new season's first game actually begins)
 * - Division IDs are resolved dynamically from the season API data,
 *   so new seasons with new IDs work automatically without code changes
 */
export function DivisionDataLoader() {
  const { 
    setActiveDivisions, 
    setActiveSubDivisions,
    setDynamicDivisionGroups,
    setDynamicSubDivisionIds
  } = useDivision();
  const { seasons, seasonIdsByYear, loading: seasonsLoading } = useSeasons();
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Wait for useSeasons to finish loading
    if (seasonsLoading) return;
    // Only run once
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const loadActiveDivisions = async () => {
      try {
        // Build list of season IDs to try (most recent first)
        const currentYear = new Date().getFullYear();
        const seasonIdsToTry: { seasonId: number; season?: Season; year: number }[] = [];
        
        for (let year = currentYear + 1; year >= currentYear - 2; year--) {
          const yearStr = year.toString();
          const sid = seasonIdsByYear[yearStr] || SEASON_IDS[yearStr];
          if (sid && sid > 0 && !seasonIdsToTry.some(s => s.seasonId === sid)) {
            const seasonObj = seasons.find(s => s.SeasonId === sid);
            seasonIdsToTry.push({ seasonId: sid, season: seasonObj, year });
          }
        }
        
        // Fallback to any loaded season
        if (seasonIdsToTry.length === 0 && seasons.length > 0) {
          seasonIdsToTry.push({
            seasonId: seasons[0].SeasonId,
            season: seasons[0],
            year: seasons[0].StartYear
          });
        }

        for (const entry of seasonIdsToTry) {
          if (!entry.seasonId) continue;

          const response = await fetchTeams(entry.seasonId, 'BI');
          
          if (!response.Success || !response.Response?.Teams) {
            continue;
          }

          const teams: Team[] = response.Response.Teams;

          if (teams.length === 0) {
            continue;
          }

          // Build dynamic division groups from the season API data
          // This is the key change — we no longer rely on hardcoded DIVISION_IDS
          let dynamicGroups: Record<string, number[]> = {};
          let dynamicSubDivs: Record<string, Record<string, number[]>> = {};

          if (entry.season && entry.season.Groups && entry.season.Groups.length > 0) {
            dynamicGroups = buildDivisionGroups(entry.season);
            dynamicSubDivs = buildDynamicSubDivisionIds(entry.season, teams);
          }

          // Detect active divisions using dynamic groups (falls back to hardcoded if dynamic is empty)
          const activeData = detectActiveDivisions(teams, dynamicGroups, dynamicSubDivs);
          
          // If teams exist but don't map to any known divisions, skip
          if (activeData.divisions.length === 0) {
            continue;
          }

          // Season rollover check: if this is a FUTURE season (first game hasn't started),
          // skip it so the site continues showing the current/previous season
          if (seasonIdsToTry.indexOf(entry) === 0 && seasonIdsToTry.length > 1) {
            try {
              const scheduleResponse = await fetchSchedule(
                entry.seasonId,
                `${entry.year}-01-01`,
                `${entry.year + 1}-12-31`,
                { games: true, practices: false, limiterCode: 'PS' }
              );

              if (scheduleResponse.Success && scheduleResponse.Response?.Schedule?.Games) {
                const games = scheduleResponse.Response.Schedule.Games;
                if (games.length > 0) {
                  // Find the first game date
                  const sortedGames = [...games].sort((a, b) => 
                    new Date(a.GameDate).getTime() - new Date(b.GameDate).getTime()
                  );
                  const firstGameDate = new Date(sortedGames[0].GameDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  if (firstGameDate > today) {
                    // First game hasn't started yet — skip to previous season
                    continue;
                  }
                } else {
                  // No games scheduled yet — skip to previous season
                  continue;
                }
              }
            } catch {
              // If schedule fetch fails, proceed with this season anyway
            }
          }

          // Store dynamic mappings in context for all consumers
          if (Object.keys(dynamicGroups).length > 1) {
            setDynamicDivisionGroups(dynamicGroups);
          }
          if (Object.keys(dynamicSubDivs).length > 0) {
            setDynamicSubDivisionIds(dynamicSubDivs);
          }

          setActiveDivisions(activeData.divisions);
          setActiveSubDivisions(activeData.subDivisions);
          return; // Done
        }


      } catch (error) {
        console.error('[DivisionDataLoader] Error:', error);
        // On error, the context will use fallback divisions (all possible divisions)
      }
    };

    loadActiveDivisions();
  }, [seasonsLoading, seasons, seasonIdsByYear, setActiveDivisions, setActiveSubDivisions, setDynamicDivisionGroups, setDynamicSubDivisionIds]);

  // This component doesn't render anything
  return null;
}
