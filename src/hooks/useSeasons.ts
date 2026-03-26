import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  fetchSeasons, 
  type Season, 
  type SportzSoftResponse, 
  type SeasonsResponse,
  buildStandingsCategoryMapping,
  getUniqueGameTypes,
  isApiKeyReady,
  waitForApiKey
} from '../services/sportzsoft';

interface UseSeasonsResult {
  seasons: Season[];
  seasonYears: string[];
  seasonIdsByYear: Record<string, number>;
  standingsCategoryMapping: Record<string, string>; // code -> friendly name
  gameTypes: string[]; // unique game type names
  loading: boolean;
  error: string | null;
  getCurrentSeasonYear: () => string;
  getCurrentSeasonId: () => number | null;
}

export function useSeasons(): UseSeasonsResult {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Wait for API key to be ready before making API calls
      const apiKeyReady = await waitForApiKey(10000);

      if (!apiKeyReady) {
        console.error('[useSeasons] API key not ready after waiting. Using fallback.');
        setError('API key not available');
        // Use fallback immediately
        const fallbackSeason: Season = {
          SeasonId: 7235,
          StartYear: 2025,
          IsActive: true,
          PublicWebViewing: true,
          SeasonName: '2025 Season',
          StartDate: '2025-01-01',
          EndDate: '2025-12-31',
          DisplayString: '2025',
          StartEnd: '2025',
          OrganizationId: 0,
          ProgramId: 0,
          SeasonTypeCodeId: 0,
          DaysDuration: 365,
          OrgName: 'RMLL',
          ParentOrgName: '',
          PGBOrgName: '',
          ProgramName: '',
          Groups: [],
          EffectiveAgeDate: null,
          FemaleEffectiveAgeDate: null,
          GoverningBodySeasonId: null,
          PGBOrganizationId: null,
          TimeZoneCd: null,
        };
        setSeasons([fallbackSeason]);
        setLoading(false);
        return;
      }


      setLoading(true);
      setError(null);

      try {
        // Use 'BP' limiter code with 'GD' child codes to get Groups and Divisions
        const response = await fetchSeasons('BP', true);
        

        
        if (response.Success && response.Response) {
          // Handle both singular Season and plural Seasons
          let seasonArray: Season[] = [];
          
          if (response.Response.Seasons && Array.isArray(response.Response.Seasons)) {

            seasonArray = response.Response.Seasons;
          } else if (response.Response.Season) {

            // If API returns single Season object, wrap it in an array
            seasonArray = [response.Response.Season];
          }
          

          
          // Filter and sort seasons
          // Include both active and inactive seasons — only require valid IDs
          // (older seasons may not have PublicWebViewing set but still have valid data)
          const validSeasons = seasonArray
            .filter(season => {
              // Derive StartYear from StartDate if missing
              if (season.StartYear == null && season.StartDate) {
                const yearFromDate = new Date(season.StartDate).getFullYear();
                if (!isNaN(yearFromDate)) {
                  season.StartYear = yearFromDate;
                }
              }
              const hasValidIds = season.SeasonId != null && season.SeasonId > 0 && season.StartYear != null;
              // Include if it has valid IDs — don't require PublicWebViewing for historical seasons
              return hasValidIds;
            })
            .sort((a, b) => b.StartYear - a.StartYear);
          
          if (validSeasons.length > 0) {
            setSeasons(validSeasons);
          } else {
            console.warn('[useSeasons] No valid seasons found in API response, using fallback');
            // Use fallback only if we truly got no seasons
            const fallbackSeason: Season = {
              SeasonId: 7235,
              StartYear: 2025,
              IsActive: true,
              PublicWebViewing: true,
              SeasonName: '2025 Season',
              StartDate: '2025-01-01',
              EndDate: '2025-12-31',
              DisplayString: '2025',
              StartEnd: '2025',
              OrganizationId: 0,
              ProgramId: 0,
              SeasonTypeCodeId: 0,
              DaysDuration: 365,
              OrgName: 'RMLL',
              ParentOrgName: '',
              PGBOrgName: '',
              ProgramName: '',
              Groups: [],
              EffectiveAgeDate: null,
              FemaleEffectiveAgeDate: null,
              GoverningBodySeasonId: null,
              PGBOrganizationId: null,
              TimeZoneCd: null,
            };
            setSeasons([fallbackSeason]);
          }
        } else {
          console.error('[useSeasons] API returned Success=false or no Response');
          throw new Error('API returned unsuccessful response');
        }
      } catch (err) {
        console.error('[useSeasons] Error fetching seasons:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch seasons');
        // Use hardcoded season as fallback even on error
        const fallbackSeason: Season = {
          SeasonId: 7235,
          StartYear: 2025,
          IsActive: true,
          PublicWebViewing: true,
          SeasonName: '2025 Season',
          StartDate: '2025-01-01',
          EndDate: '2025-12-31',
          DisplayString: '2025',
          StartEnd: '2025',
          OrganizationId: 0,
          ProgramId: 0,
          SeasonTypeCodeId: 0,
          DaysDuration: 365,
          OrgName: 'RMLL',
          ParentOrgName: '',
          PGBOrgName: '',
          ProgramName: '',
          Groups: [],
          EffectiveAgeDate: null,
          FemaleEffectiveAgeDate: null,
          GoverningBodySeasonId: null,
          PGBOrganizationId: null,
          TimeZoneCd: null,
        };
        setSeasons([fallbackSeason]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Extract unique years from seasons and create a mapping
  const seasonYears = useMemo(() => 
    seasons.map(season => season.StartYear.toString()), 
    [seasons]
  );
  
  // Create a map of year to season ID
  const seasonIdsByYear = useMemo(() => {
    const mapping: Record<string, number> = {};
    seasons.forEach(season => {
      mapping[season.StartYear.toString()] = season.SeasonId;
    });
    return mapping;
  }, [seasons]);

  // Get the current season year (most recent)
  const getCurrentSeasonYear = useCallback(() => {
    if (seasons.length === 0) return new Date().getFullYear().toString();
    return seasons[0].StartYear.toString();
  }, [seasons]);

  // Get the current season ID (most recent)
  const getCurrentSeasonId = useCallback(() => {
    if (seasons.length === 0) return null;
    return seasons[0].SeasonId;
  }, [seasons]);

  // Build standings category mapping and get unique game types
  const standingsCategoryMapping = useMemo(() => 
    buildStandingsCategoryMapping(seasons),
    [seasons]
  );
  const gameTypes = useMemo(() => 
    getUniqueGameTypes(seasons),
    [seasons]
  );

  return {
    seasons,
    seasonYears,
    seasonIdsByYear,
    standingsCategoryMapping,
    gameTypes,
    loading,
    error,
    getCurrentSeasonYear,
    getCurrentSeasonId,
  };
}