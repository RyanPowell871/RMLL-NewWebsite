/**
 * Hook that provides the correct division ID mappings.
 * 
 * Prefers dynamic mappings from the API (stored in DivisionContext by DivisionDataLoader)
 * and falls back to the hardcoded constants for backward compatibility.
 * 
 * This ensures the site works with new season IDs automatically
 * without requiring code changes when SportzSoft generates new divisions.
 */
import { useMemo } from 'react';
import { useDivision } from '../contexts/DivisionContext';
import { DIVISION_GROUPS, SUB_DIVISION_IDS } from '../services/sportzsoft/constants';

export function useDivisionMapping() {
  const { dynamicDivisionGroups, dynamicSubDivisionIds } = useDivision();

  const divisionGroups = useMemo(() => {
    // Use dynamic if it has meaningful data (more than just 'All Divisions')
    if (dynamicDivisionGroups && Object.keys(dynamicDivisionGroups).length > 1) {
      return dynamicDivisionGroups;
    }
    return DIVISION_GROUPS;
  }, [dynamicDivisionGroups]);

  const subDivisionIds = useMemo(() => {
    if (dynamicSubDivisionIds && Object.keys(dynamicSubDivisionIds).length > 0) {
      return dynamicSubDivisionIds;
    }
    return SUB_DIVISION_IDS;
  }, [dynamicSubDivisionIds]);

  /**
   * Get division IDs for a given display name (e.g. "Junior B Tier I").
   * Handles exact match and case-insensitive fallback.
   */
  const getDivisionIds = useMemo(() => {
    return (divisionName: string): number[] | null => {
      if (divisionName === 'All Divisions') return null;

      // Exact match
      if (divisionGroups[divisionName] && divisionGroups[divisionName].length > 0) {
        return divisionGroups[divisionName];
      }

      // Case-insensitive fallback
      for (const [key, value] of Object.entries(divisionGroups)) {
        if (key.toLowerCase() === divisionName.toLowerCase() && value.length > 0) {
          return value;
        }
      }

      return null;
    };
  }, [divisionGroups]);

  /**
   * Get sub-division IDs for a given division and sub-division name.
   */
  const getSubDivisionIds = useMemo(() => {
    return (divisionName: string, subDivisionName: string): number[] | null => {
      if (!subDivisionName || subDivisionName === 'All') {
        return getDivisionIds(divisionName);
      }

      const subDivMap = subDivisionIds[divisionName];
      if (subDivMap && subDivMap[subDivisionName]) {
        return subDivMap[subDivisionName];
      }

      return getDivisionIds(divisionName);
    };
  }, [subDivisionIds, getDivisionIds]);

  return {
    divisionGroups,
    subDivisionIds,
    getDivisionIds,
    getSubDivisionIds,
  };
}
