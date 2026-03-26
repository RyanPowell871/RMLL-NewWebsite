/**
 * Hook for fetching draft data from the dedicated DivisionDraft endpoint.
 * 
 * Uses dynamic season discovery to resolve DivisionGroupId or DivisionId
 * from the display division name (e.g., "Junior B Tier I" → DivisionGroupId).
 * 
 * The API returns:
 *   - DivisionDraftId: groups picks into a named draft event
 *   - DraftEntryId: each individual pick record
 *   - Trade info for entries that changed via trade
 * 
 * When filtering by FranchiseId or TeamId, returns ALL data for any draft
 * that franchise/team participated in (not just their picks).
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchDivisionDraft } from '../services/sportzsoft/api';
import { useSeasons } from './useSeasons';
import { useDivisionMapping } from './useDivisionMapping';
import type { Season } from '../services/sportzsoft/types';

// ── Parsed output types ──

export interface DraftEntry {
  id: string;
  draftId: number;
  draftTitle: string;
  entryId: number;
  round: number | null;
  pickNumber: number | null;
  overallPick: number | null;
  teamName: string;             // FranchiseName from API
  teamFranchiseId: number | null;
  playerName: string | null;    // FullName (or FirstName + LastName)
  playerId: number | null;      // PersonId
  lastClubRegisteredTo: string | null;
  date: string;
  dateRaw: string;
  comment: string;
  isPassed: boolean;            // PassFlag
  // Trade info
  isTrade: boolean;
  tradedToFranchiseName: string | null;
  tradedToFranchiseId: number | null;
  tradeId: number | null;
  tradeDate: string | null;
  tradeInfo: string | null;
  // Division context
  divisionName: string | null;
  divGroupName: string | null;
  seasonName: string | null;
  seasonYear: number | null;
  // Raw entry for debugging
  _raw: any;
}

export interface DraftGroup {
  draftId: number;
  title: string;
  date: string;
  entries: DraftEntry[];
}

export interface UseDivisionDraftResult {
  /** All parsed entries across all drafts, sorted by round/pick */
  allEntries: DraftEntry[];
  /** Entries grouped by DivisionDraftId */
  draftGroups: DraftGroup[];
  /** Available draft event titles for filtering */
  availableDrafts: { id: number; title: string; count: number }[];
  /** Available teams across all draft entries */
  availableTeams: string[];
  loading: boolean;
  error: Error | null;
  /** Season selector */
  selectedSeason: string;
  setSelectedSeason: (season: string) => void;
  seasonOptions: { label: string; value: string; seasonId?: number }[];
  seasonsLoading: boolean;
  /** Subdivision selector */
  selectedSubdivision: string;
  setSelectedSubdivision: (sub: string) => void;
  availableSubdivisions: string[];
  hasSubdivisions: boolean;
  refetch: () => void;
}

// ── Name matching helpers (same pattern as useProtectedList) ──

const NAME_ALIASES: Record<string, string[]> = {
  'Junior B Tier I': ['Jr Tier I', 'Jr. Tier I', 'Jr B Tier I', 'Jr. B Tier I'],
  'Junior B Tier II': ['Jr Tier II', 'Jr. Tier II', 'Jr B Tier II', 'Jr. B Tier II'],
  'Junior B Tier III': ['Jr Tier III', 'Jr. Tier III', 'Jr B Tier III', 'Jr. B Tier III'],
  'Junior A': ['Jr A', 'Jr. A'],
  'Senior B': ['Sr B', 'Sr. B'],
  'Senior C': ['Sr C', 'Sr. C'],
  'Alberta Major Female': ['Alberta Major Female', 'Major Female'],
  'Alberta Major Senior Female': ['Alberta Major Senior Female', 'Major Senior Female'],
};

const normalize = (s: string) =>
  s.toLowerCase().replace(/[.\s]+/g, ' ').replace(/tier\s+/gi, 'tier ').trim();

/**
 * Resolve divisionName to the matching DivisionGroup from the season,
 * returning { groupId, divisionIds } or null.
 */
function resolveDivisionGroup(
  season: Season,
  divisionName: string,
  subdivisionName?: string
): { groupId: number | null; divisionIds: number[] } {
  if (!season?.Groups) return { groupId: null, divisionIds: [] };

  // Build a lookup: groupName → { groupId, divisionIds }
  const lookup = new Map<string, { groupId: number; divisionIds: number[] }>();
  for (const group of season.Groups) {
    const activeDivs = (group.Divisions || []).filter(d => d.IsActive);
    if (activeDivs.length === 0) continue;
    const name = group.DivGroupName || group.DisplayString;
    lookup.set(name, {
      groupId: group.DivisionGroupId,
      divisionIds: activeDivs.map(d => d.DivisionId),
    });
  }

  // Try exact match
  if (lookup.has(divisionName)) {
    const match = lookup.get(divisionName)!;
    return filterBySubdivision(match, season, divisionName, subdivisionName);
  }

  // Try aliases
  const aliases = NAME_ALIASES[divisionName] || [];
  for (const alias of aliases) {
    if (lookup.has(alias)) {
      const match = lookup.get(alias)!;
      return filterBySubdivision(match, season, divisionName, subdivisionName);
    }
  }

  // Try normalized match
  const normalizedName = normalize(divisionName);
  for (const [key, val] of lookup) {
    if (normalize(key) === normalizedName) {
      return filterBySubdivision(val, season, divisionName, subdivisionName);
    }
  }

  // Try partial match
  for (const [key, val] of lookup) {
    const nk = normalize(key);
    if (normalizedName.includes(nk) || nk.includes(normalizedName)) {
      return filterBySubdivision(val, season, divisionName, subdivisionName);
    }
  }

  // Fallback to hardcoded constants
  // REMOVED: Hardcoded constants contain stale 2025 IDs and would
  // return 2025 data regardless of which season is selected.
  console.warn(`[useDivisionDraft] No dynamic match found for "${divisionName}" in season`);

  return { groupId: null, divisionIds: [] };
}

function filterBySubdivision(
  match: { groupId: number; divisionIds: number[] },
  season: Season,
  divisionName: string,
  subdivisionName?: string
): { groupId: number | null; divisionIds: number[] } {
  if (!subdivisionName || subdivisionName === 'All') return match;

  // Filter divisionIds to only those matching the subdivision
  const group = season.Groups?.find(g => g.DivisionGroupId === match.groupId);
  if (!group) return match;

  const filtered = (group.Divisions || [])
    .filter(d => d.IsActive && d.DivisionName.includes(subdivisionName))
    .map(d => d.DivisionId);

  if (filtered.length > 0) {
    // For subdivision filtering, pass individual divisionIds (not groupId)
    return { groupId: null, divisionIds: filtered };
  }

  return match;
}

// ── Flexible field resolver ──

function str(obj: any, ...keys: string[]): string {
  for (const k of keys) {
    if (obj?.[k] != null && String(obj[k]).trim()) return String(obj[k]).trim();
  }
  return '';
}

function num(obj: any, ...keys: string[]): number | null {
  for (const k of keys) {
    if (obj?.[k] != null) {
      const n = Number(obj[k]);
      if (!isNaN(n)) return n;
    }
  }
  return null;
}

// ── Hook ──

export function useDivisionDraft(divisionName: string): UseDivisionDraftResult {
  const [allEntries, setAllEntries] = useState<DraftEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedSubdivision, setSelectedSubdivision] = useState('All');

  const { seasons, loading: seasonsLoading } = useSeasons();
  const { subDivisionIds } = useDivisionMapping();

  // Build season options
  const seasonOptions = useMemo(() => {
    if (!seasons || seasons.length === 0) return [];
    return seasons.map(s => ({
      label: s.SeasonName || String(s.StartYear),
      value: String(s.StartYear),
      seasonId: s.SeasonId,
    }));
  }, [seasons]);

  // Auto-select most recent season
  useEffect(() => {
    if (seasonOptions.length > 0 && (!selectedSeason || selectedSeason === '')) {
      setSelectedSeason(seasonOptions[0].value);
    }
  }, [seasonOptions]);

  // Compute available subdivisions dynamically from season data
  const availableSubdivisions = useMemo(() => {
    const activeSeason = seasons?.find(s => String(s.StartYear) === selectedSeason);
    if (!activeSeason) {
      // Fallback to dynamic or hardcoded
      const subs = subDivisionIds[divisionName];
      return subs ? Object.keys(subs) : [];
    }

    const group = activeSeason.Groups?.find(g => {
      const name = g.DivGroupName || g.DisplayString;
      if (name === divisionName) return true;
      const aliases = NAME_ALIASES[divisionName] || [];
      if (aliases.includes(name)) return true;
      if (normalize(name) === normalize(divisionName)) return true;
      return false;
    });

    if (!group || !group.Divisions) return [];
    const activeDivs = group.Divisions.filter(d => d.IsActive);
    if (activeDivs.length <= 1) return [];

    const subs = ['All'];
    const patterns = ['North', 'South', 'East', 'West', 'Central', 'Provincials'];
    for (const pattern of patterns) {
      if (activeDivs.some(d => d.DivisionName.includes(pattern))) {
        subs.push(pattern);
      }
    }
    return subs;
  }, [seasons, selectedSeason, divisionName]);

  const hasSubdivisions = availableSubdivisions.length > 1;

  // Reset subdivision when division changes
  useEffect(() => {
    setSelectedSubdivision('All');
  }, [divisionName]);

  const fetchData = useCallback(async () => {
    if (!selectedSeason || selectedSeason === '') {

      return;
    }

    const activeSeason = seasons?.find(s => String(s.StartYear) === selectedSeason);
    if (!activeSeason) {
      console.warn('[useDivisionDraft] No matching season found for', selectedSeason);
      setAllEntries([]);
      return;
    }

    const resolved = resolveDivisionGroup(
      activeSeason,
      divisionName,
      selectedSubdivision !== 'All' ? selectedSubdivision : undefined
    );

    if (!resolved.groupId && resolved.divisionIds.length === 0) {
      console.warn(`[useDivisionDraft] Could not resolve division IDs for "${divisionName}"`);
      setAllEntries([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let allResponses: any[] = [];
      const seasonId = activeSeason.SeasonId;

      if (resolved.groupId && (!selectedSubdivision || selectedSubdivision === 'All')) {
        // Prefer DivisionGroupId for a single fast call

        const resp = await fetchDivisionDraft({ divisionGroupId: resolved.groupId, seasonId });
        if (resp.Success && resp.Response) {
          allResponses.push(resp.Response);
        }
      } else {
        // Fetch per-division for subdivision filtering

        const promises = resolved.divisionIds.map(divId =>
          fetchDivisionDraft({ divisionId: divId, seasonId })
            .then(r => (r.Success && r.Response ? r.Response : null))
            .catch(err => {
              console.error(`[useDivisionDraft] Error for divisionId=${divId}:`, err);
              return null;
            })
        );
        const results = await Promise.all(promises);
        allResponses = results.filter(Boolean);
      }

      // Parse the responses — we don't know the exact shape yet, so be flexible
      const entries: DraftEntry[] = [];
      const seen = new Set<string>();

      for (const resp of allResponses) {
        parseDraftResponse(resp, entries, seen);
      }

      // Filter entries to only the selected season.
      // The API may return drafts across multiple seasons for a DivisionGroupId,
      // so we enforce the season boundary client-side using SeasonYear or SeasonId.
      const selectedYear = Number(selectedSeason);
      const seasonFiltered = entries.filter(e => {
        // Primary check: SeasonYear matches the selected year
        if (e.seasonYear != null) return e.seasonYear === selectedYear;
        // Fallback: check if the raw entry's SeasonId matches
        const rawSeasonId = num(e._raw, 'SeasonId');
        if (rawSeasonId != null) return rawSeasonId === seasonId;
        // If neither field exists, include the entry (best effort)
        return true;
      });

      // Sort by draft title, then round, then pick/overall
      seasonFiltered.sort((a, b) => {
        if (a.draftId !== b.draftId) return a.draftId - b.draftId;
        const ra = a.round ?? 999;
        const rb = b.round ?? 999;
        if (ra !== rb) return ra - rb;
        const pa = a.overallPick ?? a.pickNumber ?? 999;
        const pb = b.overallPick ?? b.pickNumber ?? 999;
        return pa - pb;
      });


      setAllEntries(seasonFiltered);
      setError(null);
    } catch (err) {
      console.error('[useDivisionDraft] Fatal error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch draft data'));
      setAllEntries([]);
    } finally {
      setLoading(false);
    }
  }, [divisionName, selectedSeason, selectedSubdivision, seasons]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group entries by DivisionDraftId
  const draftGroups = useMemo(() => {
    const map = new Map<number, DraftGroup>();
    allEntries.forEach(e => {
      if (!map.has(e.draftId)) {
        map.set(e.draftId, {
          draftId: e.draftId,
          title: e.draftTitle,
          date: e.date,
          entries: [],
        });
      }
      map.get(e.draftId)!.entries.push(e);
    });
    return Array.from(map.values());
  }, [allEntries]);

  // Derive filter options
  const availableDrafts = useMemo(() => {
    return draftGroups.map(g => ({
      id: g.draftId,
      title: g.title,
      count: g.entries.length,
    }));
  }, [draftGroups]);

  const availableTeams = useMemo(() => {
    const s = new Set<string>();
    allEntries.forEach(e => { if (e.teamName) s.add(e.teamName); });
    return Array.from(s).sort();
  }, [allEntries]);

  return {
    allEntries,
    draftGroups,
    availableDrafts,
    availableTeams,
    loading,
    error,
    selectedSeason,
    setSelectedSeason,
    seasonOptions,
    seasonsLoading,
    selectedSubdivision,
    setSelectedSubdivision,
    availableSubdivisions,
    hasSubdivisions,
    refetch: fetchData,
  };
}

// ── Response parser ──
// Flexible parser that handles known SportzSoft DivisionDraft response shapes:
//   - Flat entries: each row is a DraftEntry with DivisionDraftId to group them
//   - Nested: DivisionDrafts[] containers with DraftEntries[] sub-arrays

function parseDraftResponse(resp: any, out: DraftEntry[], seen: Set<string>) {
  if (!resp) return;

  // Discover which key holds the drafts array
  const arrayKeys = Object.keys(resp).filter(k => Array.isArray(resp[k]));

  // Strategy 1: Look for a key containing "Draft" that is an array
  let draftsArray: any[] | null = null;
  let draftsKey = '';

  for (const key of arrayKeys) {
    if (key.toLowerCase().includes('draft')) {
      draftsArray = resp[key];
      draftsKey = key;
      break;
    }
  }

  // Strategy 2: If no "Draft" array key, check if the response IS a flat array of entries
  if (!draftsArray && arrayKeys.length > 0) {
    draftsKey = arrayKeys[0];
    draftsArray = resp[draftsKey];

  }

  // Strategy 3: The response might be a single draft object (not an array)
  if (!draftsArray) {
    // Check if the response itself looks like a draft
    if (resp.DivisionDraftId || resp.DraftId) {
      draftsArray = [resp];
      draftsKey = 'self';
    }
  }

  if (!draftsArray || draftsArray.length === 0) {
    return;
  }

  // Check if these are draft-level containers (with sub-entries) or flat entries
  const first = draftsArray[0];
  const firstKeys = Object.keys(first);

  // Detect if first item has nested entries (draft container) or is a flat entry
  const hasNestedEntries = firstKeys.some(k =>
    k.toLowerCase().includes('entr') && Array.isArray(first[k])
  );

  if (hasNestedEntries) {
    // Draft containers with nested entries
    for (const draft of draftsArray) {
      const draftId = num(draft, 'DivisionDraftId', 'DraftId') ?? 0;
      const draftTitle = str(draft, 'DraftTitle', 'Title', 'Name', 'DraftName', 'DivisionDraftName', 'Description');
      const draftDate = str(draft, 'DraftDate', 'Date', 'EventDate');

      // Find the entries array
      const entriesKey = Object.keys(draft).find(k =>
        k.toLowerCase().includes('entr') && Array.isArray(draft[k])
      );
      const entries = entriesKey ? draft[entriesKey] : [];

      for (const entry of entries) {
        addEntry(entry, draftId, draftTitle, draftDate, out, seen);
      }
    }
  } else {
    // Flat entries — each row IS a draft entry (may have DivisionDraftId to group them)
    // Group by DivisionDraftId
    const draftMap = new Map<number, { title: string; date: string }>();
    for (const entry of draftsArray) {
      const draftId = num(entry, 'DivisionDraftId', 'DraftId') ?? 0;
      if (!draftMap.has(draftId)) {
        draftMap.set(draftId, {
          title: str(entry, 'DraftTitle', 'DivisionDraftTitle', 'DivisionDraftName', 'Title', 'Name', 'Description'),
          date: str(entry, 'DraftDate', 'EventDate', 'Date'),
        });
      }
    }

    for (const entry of draftsArray) {
      const draftId = num(entry, 'DivisionDraftId', 'DraftId') ?? 0;
      const info = draftMap.get(draftId) || { title: `Draft ${draftId}`, date: '' };
      addEntry(entry, draftId, info.title || `Draft ${draftId}`, info.date, out, seen);
    }
  }
}

function addEntry(
  raw: any,
  draftId: number,
  draftTitle: string,
  draftDate: string,
  out: DraftEntry[],
  seen: Set<string>
) {
  // ── Confirmed API field names (from console output): ──
  // DraftEntryId, DivisionDraftId, DraftPickNo, DraftRound,
  // TeamFranchiseId, FranchiseName,
  // TradedToFranchiseId, TradedToFranchiseName,
  // FirstName, LastName, FullName, PersonId,
  // LastClubRegisteredTo, LastClubRegisteredToFranchiseId,
  // TradeId, "Trade Date" (has space!), TradeInfo, PassFlag,
  // DraftTitle, DivisionId, DivisionName, DivisionGroupId,
  // DivGroupName, CommonGroupCode, SeasonId, SeasonName, SeasonYear,
  // ProgramId, OrganizationId

  const entryId = num(raw, 'DraftEntryId') ?? 0;
  const dedupKey = `${draftId}-${entryId}`;
  if (seen.has(dedupKey)) return;
  seen.add(dedupKey);

  // No date per-entry in the confirmed fields; use draftDate or trade date
  const tradeDateStr = str(raw, 'Trade Date', 'TradeDate'); // Note: API uses "Trade Date" with space
  const dateStr = tradeDateStr || draftDate;
  const parsedDate = dateStr ? new Date(dateStr) : null;
  const formattedDate = parsedDate && !isNaN(parsedDate.getTime())
    ? parsedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : draftDate || 'Unknown';

  // Player name — FullName is the primary field, fall back to FirstName + LastName
  const playerName =
    str(raw, 'FullName') ||
    [str(raw, 'FirstName'), str(raw, 'LastName')].filter(Boolean).join(' ') ||
    null;

  // Trade info — TradedToFranchiseName is the confirmed field
  const tradedToName = str(raw, 'TradedToFranchiseName');
  const tradeIdVal = num(raw, 'TradeId');
  const tradeInfoStr = str(raw, 'TradeInfo');
  const isTrade = !!(tradedToName || tradeIdVal || tradeInfoStr);

  // PassFlag — indicates the team passed on this pick
  const isPassed = !!(raw?.PassFlag);

  out.push({
    id: `draft-${draftId}-${entryId}`,
    draftId,
    draftTitle: str(raw, 'DraftTitle') || draftTitle || `Draft ${draftId}`,
    entryId,
    round: num(raw, 'DraftRound'),
    pickNumber: num(raw, 'DraftPickNo'),
    overallPick: null, // Not provided by API; could compute from round + pick
    teamName: str(raw, 'FranchiseName'),
    teamFranchiseId: num(raw, 'TeamFranchiseId'),
    playerName: playerName || null,
    playerId: num(raw, 'PersonId'),
    lastClubRegisteredTo: str(raw, 'LastClubRegisteredTo') || null,
    date: formattedDate,
    dateRaw: dateStr,
    comment: '', // No dedicated comment field in API
    isPassed,
    isTrade,
    tradedToFranchiseName: tradedToName || null,
    tradedToFranchiseId: num(raw, 'TradedToFranchiseId'),
    tradeId: tradeIdVal,
    tradeDate: tradeDateStr || null,
    tradeInfo: tradeInfoStr || null,
    divisionName: str(raw, 'DivisionName') || null,
    divGroupName: str(raw, 'DivGroupName') || null,
    seasonName: str(raw, 'SeasonName') || null,
    seasonYear: num(raw, 'SeasonYear'),
    _raw: raw,
  });
}