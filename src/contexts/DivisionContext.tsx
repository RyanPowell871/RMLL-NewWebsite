import { createContext, useContext, useState, useRef, ReactNode, useMemo, useCallback, useEffect } from 'react';

// Default/fallback divisions (all possible divisions)
export const allPossibleDivisions = [
  'All Divisions',
  'Senior B',
  'Senior C',
  'Junior A',
  'Junior B Tier I',
  'Junior B Tier II',
  'Junior B Tier III',
  'Alberta Major Senior Female',
  'Alberta Major Female'
];

// Default/fallback sub-divisions for all divisions that could have them
export const allPossibleSubDivisions: Record<string, string[]> = {
  'Junior B Tier I': ['All', 'North', 'South', 'Central', 'East'],
  'Junior B Tier II': ['All', 'North', 'South'],
  'Senior C': ['All', 'North', 'South']
};

interface DivisionContextType {
  selectedDivision: string;
  setSelectedDivision: (division: string) => void;
  selectedSubDivision: string;
  setSelectedSubDivision: (subDivision: string) => void;
  // New: dynamic divisions based on active data
  activeDivisions: string[];
  setActiveDivisions: (divisions: string[]) => void;
  activeSubDivisions: Record<string, string[]>;
  setActiveSubDivisions: (subDivisions: Record<string, string[]>) => void;
  // Dynamic division ID mappings (populated from API, replaces hardcoded constants)
  dynamicDivisionGroups: Record<string, number[]>;
  setDynamicDivisionGroups: (groups: Record<string, number[]>) => void;
  dynamicSubDivisionIds: Record<string, Record<string, number[]>>;
  setDynamicSubDivisionIds: (subs: Record<string, Record<string, number[]>>) => void;
  // Computed values
  divisions: string[];  // Either active divisions or all possible divisions
  subDivisions: Record<string, string[]>;  // Either active subdivisions or all possible subdivisions
}

const DivisionContext = createContext<DivisionContextType | undefined>(undefined);

const LS_DIVISION_KEY = 'rmll_favourite_division';
const LS_SUBDIVISION_KEY = 'rmll_favourite_subdivision';

function getSavedDivision(): string {
  try {
    return localStorage.getItem(LS_DIVISION_KEY) || 'All Divisions';
  } catch {
    return 'All Divisions';
  }
}

function getSavedSubDivision(): string {
  try {
    return localStorage.getItem(LS_SUBDIVISION_KEY) || 'All';
  } catch {
    return 'All';
  }
}

export function DivisionProvider({ children }: { children: ReactNode }) {
  const [selectedDivision, setSelectedDivisionRaw] = useState(getSavedDivision);
  const [selectedSubDivision, setSelectedSubDivisionRaw] = useState(getSavedSubDivision);
  const [activeDivisions, setActiveDivisionsRaw] = useState<string[]>([]);
  const [activeSubDivisions, setActiveSubDivisionsRaw] = useState<Record<string, string[]>>({});
  const [subDivisionsLoaded, setSubDivisionsLoaded] = useState(false);

  // Dynamic division ID mappings — populated from API season data by DivisionDataLoader
  const [dynamicDivisionGroups, setDynamicDivisionGroupsRaw] = useState<Record<string, number[]>>({});
  const [dynamicSubDivisionIds, setDynamicSubDivisionIdsRaw] = useState<Record<string, Record<string, number[]>>>({});

  // Track whether the favorite was explicitly set by the user (from localStorage or Header)
  // This prevents validation effects from overriding user intent
  const userFavoriteRef = useRef({
    div: getSavedDivision(),
    sub: getSavedSubDivision()
  });

  const setSelectedDivision = useCallback((div: string) => {
    setSelectedDivisionRaw(div);
  }, []);

  const setSelectedSubDivision = useCallback((sub: string) => {
    setSelectedSubDivisionRaw(sub);
  }, []);

  const setActiveDivisions = useCallback((divs: string[]) => {
    setActiveDivisionsRaw(divs);
  }, []);

  // Persist division selection to localStorage
  useEffect(() => {
    try {
      if (selectedDivision === 'All Divisions') {
        localStorage.removeItem(LS_DIVISION_KEY);
        userFavoriteRef.current.div = 'All Divisions';
      } else {
        localStorage.setItem(LS_DIVISION_KEY, selectedDivision);
        userFavoriteRef.current.div = selectedDivision;
      }
    } catch { /* localStorage unavailable */ }
  }, [selectedDivision]);

  useEffect(() => {
    try {
      if (selectedSubDivision === 'All') {
        localStorage.removeItem(LS_SUBDIVISION_KEY);
        userFavoriteRef.current.sub = 'All';
      } else {
        localStorage.setItem(LS_SUBDIVISION_KEY, selectedSubDivision);
        userFavoriteRef.current.sub = selectedSubDivision;
      }
    } catch { /* localStorage unavailable */ }
  }, [selectedSubDivision]);

  // Use active divisions if available, otherwise fall back to all possible divisions
  const divisions = useMemo(() => {
    if (activeDivisions.length > 0) {
      return ['All Divisions', ...activeDivisions];
    }
    return allPossibleDivisions;
  }, [activeDivisions]);

  // Use active subdivisions if available, otherwise fall back to all possible subdivisions
  // Only use fallback if subdivisions haven't been explicitly loaded yet
  const subDivisions = useMemo(() => {
    if (subDivisionsLoaded) {
      return activeSubDivisions;
    }
    return allPossibleSubDivisions;
  }, [activeSubDivisions, subDivisionsLoaded]);

  // Reset sub-division when main division changes (only via user action from Header)
  // Components call this through context.setSelectedDivision
  const handleDivisionChange = useCallback((division: string) => {
    setSelectedDivision(division);
    setSelectedSubDivision('All');
  }, [setSelectedDivision, setSelectedSubDivision]);

  // Auto-reset selectedDivision if it's not in the active divisions list
  // BUT: protect the user's explicitly saved favorite — only reset if it's truly invalid
  useEffect(() => {
    if (activeDivisions.length > 0 && selectedDivision !== 'All Divisions') {
      if (!activeDivisions.includes(selectedDivision)) {
        // Before resetting, check if this is a user-saved favorite from localStorage
        // If so, check against allPossibleDivisions too (the active list might be incomplete/stale)
        const lsFavorite = getSavedDivision();
        if (selectedDivision === lsFavorite && allPossibleDivisions.includes(selectedDivision)) {
          return; // Don't reset — user explicitly saved this favorite
        }
        setSelectedDivision('All Divisions');
        setSelectedSubDivision('All');
      }
    }
  }, [activeDivisions, selectedDivision, setSelectedDivision, setSelectedSubDivision]);

  // Validate saved sub-division against available sub-divisions once they load
  useEffect(() => {
    if (subDivisionsLoaded && selectedSubDivision !== 'All') {
      const availableSubs = activeSubDivisions[selectedDivision];
      if (!availableSubs || !availableSubs.includes(selectedSubDivision)) {
        // Before resetting, check against allPossibleSubDivisions too
        const possibleSubs = allPossibleSubDivisions[selectedDivision];
        if (possibleSubs && possibleSubs.includes(selectedSubDivision)) {
          return; // Don't reset
        }
        setSelectedSubDivision('All');
      }
    }
  }, [subDivisionsLoaded, activeSubDivisions, selectedDivision, selectedSubDivision, setSelectedSubDivision]);

  // Wrapper for setActiveSubDivisions that also marks subdivisions as loaded
  const handleSetActiveSubDivisions = useCallback((subDivs: Record<string, string[]>) => {
    setActiveSubDivisionsRaw(subDivs);
    setSubDivisionsLoaded(true);
  }, []);

  const value = useMemo(() => ({ 
    selectedDivision, 
    setSelectedDivision: handleDivisionChange,
    selectedSubDivision,
    setSelectedSubDivision,
    activeDivisions,
    setActiveDivisions,
    activeSubDivisions,
    setActiveSubDivisions: handleSetActiveSubDivisions,
    divisions,
    subDivisions,
    dynamicDivisionGroups,
    setDynamicDivisionGroups: setDynamicDivisionGroupsRaw,
    dynamicSubDivisionIds,
    setDynamicSubDivisionIds: setDynamicSubDivisionIdsRaw
  }), [
    selectedDivision, 
    selectedSubDivision, 
    handleDivisionChange,
    setSelectedSubDivision,
    activeDivisions,
    setActiveDivisions,
    activeSubDivisions,
    divisions,
    subDivisions,
    handleSetActiveSubDivisions,
    dynamicDivisionGroups,
    setDynamicDivisionGroupsRaw,
    dynamicSubDivisionIds,
    setDynamicSubDivisionIdsRaw
  ]);

  return (
    <DivisionContext.Provider value={value}>
      {children}
    </DivisionContext.Provider>
  );
}

export function useDivision() {
  const context = useContext(DivisionContext);
  if (context === undefined) {
    throw new Error('useDivision must be used within a DivisionProvider');
  }
  return context;
}