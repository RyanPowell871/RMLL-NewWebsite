import { useState, useEffect, useCallback } from 'react';
import { fetchFacilities } from '../services/sportzsoft/api';

interface Facility {
  id: number;
  name: string;
  city: string;
  province: string;
  phone?: string;
  postalCode?: string;
  address?: string;
  address2?: string;
  addresslink?: string;
}

// Normalize facility name for matching (removes common variations)
function normalizeFacilityName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/['']/g, "'")
    .replace(/&/g, 'and')
    .replace(/centre/g, 'center')
    .replace(/community/g, 'comm')
    .replace(/recreation/g, 'rec')
    .replace(/arena/g, '');
}

// Find a facility map link by name
export function findFacilityMapLink(
  facilities: Facility[],
  venueName: string
): string | undefined {
  if (!venueName || !facilities.length) return undefined;

  const normalizedName = normalizeFacilityName(venueName);

  // Try exact match first
  let match = facilities.find(
    f => normalizeFacilityName(f.name) === normalizedName
  );

  // Try partial match (contains)
  if (!match) {
    match = facilities.find(
      f => normalizedName.includes(normalizeFacilityName(f.name)) ||
           normalizeFacilityName(f.name).includes(normalizedName)
    );
  }

  // Return the addresslink if found
  return match?.addresslink;
}

// Hook to load and cache facilities data
export function useFacilities() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFacilities = useCallback(async () => {
    if (facilities.length > 0) return; // Already loaded

    setLoading(true);
    setError(null);
    try {
      const response = await fetchFacilities(520);

      if (!response || response.Success === false) {
        throw new Error(response?.Message || 'API returned unsuccessful response');
      }

      let rawList: any[] = [];

      if (Array.isArray(response)) {
        rawList = response;
      } else if (response.Data && Array.isArray(response.Data)) {
        rawList = response.Data;
      } else if (response.Facilities && Array.isArray(response.Facilities)) {
        rawList = response.Facilities;
      } else if (response.Result && Array.isArray(response.Result)) {
        rawList = response.Result;
      } else {
        for (const key of Object.keys(response)) {
          if (Array.isArray(response[key]) && response[key].length > 0) {
            rawList = response[key];
            break;
          }
        }
      }

      if (rawList.length === 0) {
        console.warn('[useFacilities] No facility array found in response.');
        return;
      }

      const normalized: Facility[] = rawList.map((raw: any) => ({
        id: raw.FacilityId ?? 0,
        name: raw.FacilityName ?? 'Unknown Facility',
        city: raw.CityName ?? '',
        province: raw.ProvStateCd ?? '',
        phone: raw.PhoneNo || undefined,
        postalCode: raw.PostalZip || undefined,
        address: raw.AddressLine1 || raw.Address || undefined,
        address2: raw.AddressLine2 || undefined,
        addresslink: raw.AddressLink?.match(/href=["'](.*?)["']/i)?.[1] ||
          (raw.AddressLink?.trim().startsWith('http') ? raw.AddressLink.trim() : undefined),
      }));

      setFacilities(normalized);
    } catch (err: any) {
      console.error('[useFacilities] Error loading facilities:', err);
      setError(err.message || 'Failed to load facilities');
    } finally {
      setLoading(false);
    }
  }, [facilities.length]);

  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  return { facilities, loading, error };
}