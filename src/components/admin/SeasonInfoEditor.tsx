import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Plus, Trash2, AlertCircle, Eye, ChevronUp, ChevronDown, Edit2, Check, X, Code, Copy, GripVertical } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { SeasonInfoDisplay } from '../SeasonInfoDisplay';

// ============================================================================
// UNIFIED DATA STRUCTURES
// ============================================================================

export interface SeasonInfoData {
  __metadata?: Record<string, { title?: string; description?: string; heading?: string; collapsible?: boolean; collapsed?: boolean }>;
  drafts?: DraftSection[];
  regularSeason?: RegularSeasonSection[];
  playoffs?: PlayoffSection[];
  provincial?: ProvincialSection[];
  championships?: ChampionshipSection[];
  notes?: string;
}

export interface DraftSection {
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  time?: string;
  location?: string;
  notes?: string;
  // Additional fields for Junior A style drafts
  details?: string[];
  event?: {
    date?: string;
    time?: string;
    location?: string;
    note?: string;
    social?: string;
    virtual?: string;
  };
  draftOrder?: string[];
  // Region label for display
  region?: string;
}

export interface RegularSeasonSection {
  id: string;
  title: string;
  seasonStart?: string;
  seasonEnd?: string;
  gameDays?: string;
  totalGames?: string;
  format?: string;
  notes?: string;
}

export interface PlayoffSection {
  id: string;
  title?: string;
  format?: string;
  // Scenario format (best-of series)
  scenarios?: PlayoffScenario[];
  // Simple format (just dates + note)
  dates?: string;
  note?: string;
  notes?: string;
}

export interface PlayoffScenario {
  id: string;
  name: string;
  condition: string;
  games: PlayoffGame[];
  note?: string;
}

export interface PlayoffGame {
  id: string;
  number: number;
  date: string;
  time: string;
  optional?: boolean;
}

export interface ProvincialSection {
  id: string;
  formatType?: 'scenario' | 'tournament' | 'simple';
  title?: string;
  format?: string;
  // Scenario format
  scenarios?: PlayoffScenario[];
  // Tournament format
  dates?: string;
  pools?: {
    poolA: string[];
    poolB: string[];
  };
  venues?: string;
  poolRoundNote?: string;
  schedule?: TournamentGame[];
  // Simple format
  note?: string;
}

export interface TournamentGame {
  id: string;
  number: number;
  date: string;
  time: string;
  matchup: string;
  venue?: string;
  label?: string;
}

export interface ChampionshipSection {
  id: string;
  title?: string;
  type?: 'presidents-cup' | 'national' | 'other';
  dates: string;
  location: string;
  city?: string;
  travelDays?: string[];
}

// ============================================================================
// EDITOR COMPONENTS
// ============================================================================

interface SeasonInfoEditorProps {
  value: string;
  onChange: (value: string) => void;
  divisionName?: string;
}

// Helper to generate unique IDs
const generateId = () => `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ============================================================================
// DATA MIGRATION - Convert legacy format to unified format
// ============================================================================

// Helper to extract date/time/location from content text
function parseContentInfo(content: string): { date?: string; time?: string; location?: string; draftOrder?: string[]; cleanContent?: string } {
  const info: { date?: string; time?: string; location?: string; draftOrder?: string[]; cleanContent?: string } = {};

  // Extract date
  const dateMatch = content.match(/(?:Date:\s*)?(.+?)(?:\n|,\s*Time:|$)/);
  if (dateMatch) info.date = dateMatch[1].trim();

  // Extract time
  const timeMatch = content.match(/(?:Time:\s*)?(.+?)(?:\n|,\s*Loc|$)/);
  if (timeMatch) info.time = timeMatch[1].trim();

  // Extract location
  const locMatch = content.match(/(?:Loc(?:ation)?:\s*)?(.+?)(?:\n|,|\n\n|$)/);
  if (locMatch) info.location = locMatch[1].trim();

  // Extract draft order
  const draftOrderMatch = content.match(/(?:Draft Order:?)([\s\S]*?)(?:\n\n|And by trade|$)/);
  if (draftOrderMatch) {
    const orderText = draftOrderMatch[1].trim();
    // Parse numbered list
    const orderLines = orderText.split('\n').filter(line => line.trim());
    const orders: string[] = [];
    for (const line of orderLines) {
      const match = line.match(/^\s*\d+\.\s*(.+)$/);
      if (match) {
        orders.push(match[1].trim());
      }
    }
    if (orders.length > 0) {
      info.draftOrder = orders;
    }
  }

  // Clean content by removing extracted lines
  let cleanContent = content;
  if (info.date) {
    cleanContent = cleanContent.replace(/Date:\s*.+?\n/, '');
  }
  if (info.time) {
    cleanContent = cleanContent.replace(/Time:\s*.+?\n/, '');
  }
  if (info.location) {
    cleanContent = cleanContent.replace(/Loc(?:ation)?:\s*.+?\n/, '');
  }
  if (info.draftOrder && draftOrderMatch) {
    cleanContent = cleanContent.replace(/Draft Order:?[\s\S]*?(\n\n|And by trade)/, '$1');
  }

  // Clean up any remaining artifacts
  cleanContent = cleanContent
    .replace(/\n\n+/g, '\n\n')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '')
    .trim();

  if (cleanContent) {
    info.cleanContent = cleanContent;
  }

  return info;
}

// Migrate generic section array format to unified format
function migrateGenericSections(sections: any[]): SeasonInfoData {
  const unified: SeasonInfoData = {};
  const drafts: DraftSection[] = [];
  const regularSeason: RegularSeasonSection[] = [];
  const playoffs: PlayoffSection[] = [];
  const provincial: ProvincialSection[] = [];
  const championships: ChampionshipSection[] = [];

  for (const section of sections) {
    const title = section.title || '';
    const subtitle = section.subtitle || '';
    const content = section.content || '';

    // Draft-related sections
    if (title.includes('Draft') || title.includes('Entry Draft')) {
      const info = parseContentInfo(content);

      // Try to extract region from title
      let region: string | undefined;
      if (title.includes('North')) region = 'North';
      else if (title.includes('South')) region = 'South';
      else if (title.includes('Central')) region = 'Central';

      drafts.push({
        id: generateId(),
        title,
        subtitle,
        date: info.date,
        time: info.time,
        location: info.location,
        notes: info.cleanContent,
        draftOrder: info.draftOrder,
        region,
      });
    }
    // Regular Season related sections
    else if (title.includes('Regular Season') || title.includes('Game Days')) {
      if (title.includes('Game Days')) {
        // Parse game days - handle both commas and "and"
        let parsedGameDays = content;
        if (content.includes(' and ')) {
          parsedGameDays = content.replace(/ and /g, ', ');
        }
        const existing = regularSeason.find(s => s.title === 'Regular Season');
        if (existing) {
          existing.gameDays = parsedGameDays;
        } else {
          regularSeason.push({
            id: generateId(),
            title: 'Regular Season',
            gameDays: parsedGameDays,
          });
        }
      } else if (title.includes('Regular Season Games')) {
        // Try to extract games count
        const gamesMatch = content.match(/(\d+)\s*games/i);
        const gamesCount = gamesMatch ? gamesMatch[1] : undefined;

        const existing = regularSeason.find(s => s.title === 'Regular Season');
        if (existing) {
          existing.totalGames = gamesCount;
        } else {
          regularSeason.push({
            id: generateId(),
            title: 'Regular Season',
            totalGames: gamesCount,
          });
        }
      } else {
        // Try to extract season start and end from "Friday, April 24 to Sunday, July 5, 2026" format
        let seasonStart: string | undefined;
        let seasonEnd: string | undefined;
        const toIndex = content.indexOf(' to ');
        if (toIndex > 0 && content.includes(',')) {
          seasonStart = content.substring(0, toIndex).trim();
          const afterTo = content.substring(toIndex + 4).trim();
          const lastComma = afterTo.lastIndexOf(',');
          if (lastComma > 0) {
            seasonEnd = afterTo.substring(0, lastComma).trim();
          }
        }

        const existing = regularSeason.find(s => s.title === 'Regular Season');
        if (existing) {
          existing.seasonStart = existing.seasonStart || seasonStart;
          existing.seasonEnd = existing.seasonEnd || seasonEnd;
          if (!existing.notes) {
            existing.notes = content;
          }
        } else {
          regularSeason.push({
            id: generateId(),
            title: 'Regular Season',
            seasonStart,
            seasonEnd,
            notes: (!seasonStart && !seasonEnd) ? content : undefined,
          });
        }
      }
    }
    // Playoffs related sections
    else if (title.includes('Playoffs') || title.includes('Playoff')) {
      if (title.includes('Format')) {
        const existing = playoffs.find(s => s.id === 'playoffs');
        if (existing) {
          existing.format = content;
        } else {
          playoffs.push({
            id: 'playoffs',
            format: content,
          });
        }
      } else {
        const existing = playoffs.find(s => s.id === 'playoffs');
        if (existing) {
          existing.dates = content;
          existing.note = subtitle || '';
        } else {
          playoffs.push({
            id: 'playoffs',
            dates: content,
            note: subtitle || '',
          });
        }
      }
    }
    // Provincial related sections
    else if (title.includes('Provincial')) {
      if (title.includes('Format')) {
        const existing = provincial.find(s => s.id === 'provincial');
        if (existing) {
          existing.format = content;
        } else {
          provincial.push({
            id: 'provincial',
            format: content,
          });
        }
      } else if (title.includes('Dates')) {
        const existing = provincial.find(s => s.id === 'provincial');
        if (existing) {
          existing.dates = content;
        } else {
          provincial.push({
            id: 'provincial',
            dates: content,
          });
        }
      } else {
        const existing = provincial.find(s => s.id === 'provincial');
        if (existing) {
          existing.note = content;
        } else {
          provincial.push({
            id: 'provincial',
            note: content,
          });
        }
      }
    }
    // National / Championship sections
    else if (title.includes('National') || title.includes('Championship') || title.includes('Founders Cup') || title.includes('Minto Cup')) {
      const existing = championships.find(s => s.type === 'national');
      if (existing) {
        existing.title = existing.title || title;
        existing.dates = existing.dates || (title.includes('Sunday') && subtitle ? subtitle : '');
        existing.location = existing.location || content;
      } else {
        championships.push({
          id: generateId(),
          title,
          type: 'national',
          dates: subtitle || content,
          location: content,
        });
      }
    }
    // RMLL Championship
    else if (title.includes('RMLL Championship')) {
      const existing = championships.find(s => s.type === 'presidents-cup');
      if (existing) {
        existing.dates = existing.dates || subtitle;
        existing.location = existing.location || content;
      } else {
        championships.push({
          id: generateId(),
          title: 'RMLL Championship',
          type: 'other',
          dates: subtitle,
          location: content,
        });
      }
    }
    // Unknown sections - add as notes
    else {
      unified.notes = (unified.notes || '') + `\n\n${title}\n${content}`;
    }
  }

  if (drafts.length > 0) unified.drafts = drafts;
  if (regularSeason.length > 0) unified.regularSeason = regularSeason;
  if (playoffs.length > 0) unified.playoffs = playoffs;
  if (provincial.length > 0) unified.provincial = provincial;
  if (championships.length > 0) unified.championships = championships;

  return unified;
}

function migrateToUnified(data: any): SeasonInfoData {
  // Helper to check if array is in new format (has id property)
  const isNewFormatArray = (arr: any[]): boolean => {
    return Array.isArray(arr) && (arr.length === 0 || arr[0]?.id !== undefined);
  };

  // Helper to check if array is in generic section format (title/subtitle/content)
  const isGenericSectionArray = (arr: any): boolean => {
    return Array.isArray(arr) && (arr.length === 0 || arr[0]?.title !== undefined && arr[0]?.content !== undefined);
  };

  // Start with metadata
  const unified: SeasonInfoData = {
    __metadata: data.__metadata,
  };

  // Handle generic section array format (old format with title/subtitle/content sections)
  if (isGenericSectionArray(data)) {
    return migrateGenericSections(data);
  }

  // Handle drafts - either already in new format or needs migration
  if (isNewFormatArray(data.drafts)) {
    unified.drafts = data.drafts;
  } else if (data.drafts && typeof data.drafts === 'object' && !Array.isArray(data.drafts)) {
    // Legacy drafts object -> drafts array
    const drafts: DraftSection[] = [];
    if (data.drafts.north) {
      drafts.push({
        id: 'north_draft',
        title: data.drafts.north.title || 'North Draft',
        subtitle: data.drafts.north.subtitle,
        date: data.drafts.north.date,
        time: data.drafts.north.time,
        location: data.drafts.north.location,
        notes: data.drafts.north.notes,
        region: 'North',
      });
    }
    if (data.drafts.south) {
      drafts.push({
        id: 'south_draft',
        title: data.drafts.south.title || 'South Draft',
        subtitle: data.drafts.south.subtitle,
        date: data.drafts.south.date,
        time: data.drafts.south.time,
        notes: data.drafts.south.notes,
        region: 'South',
      });
    }
    if (drafts.length > 0) {
      unified.drafts = drafts;
    }
  } else if (data.draft && typeof data.draft === 'object') {
    // Junior A draft (legacy draft object -> drafts array)
    unified.drafts = [
      {
        id: 'junior_a_draft',
        title: data.draft.title || 'Junior A Entry Draft',
        details: Array.isArray(data.draft.details) ? data.draft.details : undefined,
        event: data.draft.event,
        draftOrder: Array.isArray(data.draft.draftOrder) ? data.draft.draftOrder : undefined,
        date: data.draft.event?.date,
        time: data.draft.event?.time,
        location: data.draft.event?.location,
        notes: data.draft.draftEligible,
      },
    ];
  }

  // Handle regularSeason - either already in new format or needs migration
  if (isNewFormatArray(data.regularSeason)) {
    unified.regularSeason = data.regularSeason;
  } else if (data.regularSeason && typeof data.regularSeason === 'object') {
    // Legacy regularSeason -> regularSeason array
    unified.regularSeason = [
      {
        id: 'regular_season',
        title: 'Regular Season',
        seasonStart: data.regularSeason.start,
        seasonEnd: data.regularSeason.end,
        totalGames: data.regularSeason.totalGames?.toString(),
        format: data.regularSeason.format,
        gameDays: Array.isArray(data.regularSeason.gameDays) ? data.regularSeason.gameDays.join(', ') : undefined,
        notes: data.regularSeason.notes,
      },
    ];
  } else if (data.season && typeof data.season === 'object') {
    // Junior A style season -> regularSeason array
    unified.regularSeason = [
      {
        id: 'junior_a_season',
        title: data.season.title || 'Season',
        seasonStart: data.season.seasonStart,
        seasonEnd: data.season.seasonEnd,
        gameDays: data.season.gameDays,
        totalGames: data.season.regularSeasonGames,
      },
    ];
  }

  // Handle playoffs - either already in new format or needs migration
  if (isNewFormatArray(data.playoffs)) {
    unified.playoffs = data.playoffs;
  } else if (data.playoffs && typeof data.playoffs === 'object') {
    // Legacy playoffs -> playoffs array
    const playoff: PlayoffSection = {
      id: 'playoffs',
      format: data.playoffs.format,
      dates: data.playoffs.dates,
      note: data.playoffs.note,
    };
    if (Array.isArray(data.playoffs.scenarios)) {
      playoff.scenarios = data.playoffs.scenarios.map((s: any, idx: number) => ({
        id: `scenario_${idx}`,
        name: s.name,
        condition: s.condition,
        games: Array.isArray(s.games) ? s.games.map((g: any, gIdx: number) => ({
          id: `game_${gIdx}`,
          number: g.number,
          date: g.date,
          time: g.time,
          optional: g.optional,
        })) : [],
      }));
    }
    unified.playoffs = [playoff];
  }

  // Handle provincial - either already in new format or needs migration
  if (isNewFormatArray(data.provincial)) {
    unified.provincial = data.provincial;
  } else if (data.provincial && typeof data.provincial === 'object') {
    // Legacy provincial -> provincial array
    const provincial: ProvincialSection = {
      id: 'provincial',
      format: data.provincial.format,
      formatType: Array.isArray(data.provincial.schedule) ? 'tournament' : data.provincial.note ? 'simple' : 'scenario',
      dates: data.provincial.dates,
      note: data.provincial.note,
      pools: data.provincial.pools,
      venues: data.provincial.venues,
      poolRoundNote: data.provincial.poolRoundNote,
    };
    if (Array.isArray(data.provincial.scenarios)) {
      provincial.scenarios = data.provincial.scenarios.map((s: any, idx: number) => ({
        id: `scenario_${idx}`,
        name: s.name,
        condition: s.condition,
        games: Array.isArray(s.games) ? s.games.map((g: any, gIdx: number) => ({
          id: `game_${gIdx}`,
          number: g.number,
          date: g.date,
          time: g.time,
          optional: g.optional,
        })) : [],
      }));
    }
    if (Array.isArray(data.provincial.schedule)) {
      provincial.schedule = data.provincial.schedule.map((g: any, idx: number) => ({
        id: `game_${idx}`,
        number: g.number,
        date: g.date,
        time: g.time,
        matchup: g.matchup,
        venue: g.venue,
        label: g.label,
      }));
    }
    unified.provincial = [provincial];
  }

  // Handle championships - either already in new format or needs migration
  if (isNewFormatArray(data.championships)) {
    unified.championships = data.championships;
  } else {
    const champs: ChampionshipSection[] = [];

    // Migrate national (legacy national -> championships array)
    if (data.national && typeof data.national === 'object') {
      champs.push({
        id: 'national',
        title: data.national.title || 'National Championship',
        type: 'national',
        dates: data.national.dates,
        location: data.national.location,
      });
    }

    // Migrate presidentsCup (legacy presidentsCup -> championships array)
    if (data.presidentsCup && typeof data.presidentsCup === 'object') {
      champs.push({
        id: 'presidents_cup',
        title: 'Presidents Cup',
        type: 'presidents-cup',
        dates: data.presidentsCup.dates,
        location: data.presidentsCup.location,
        city: data.presidentsCup.city,
        travelDays: Array.isArray(data.presidentsCup.travelDays) ? data.presidentsCup.travelDays : undefined,
      });
    }

    if (champs.length > 0) {
      unified.championships = champs;
    }
  }

  // Copy notes as-is
  unified.notes = data.notes;

  return unified;
}

// Game editor component for playoff scenarios
function GameEditor({
  games,
  onChange,
}: {
  games: PlayoffGame[];
  onChange: (games: PlayoffGame[]) => void;
}) {
  const addGame = () => {
    const nextNum = games.length + 1;
    onChange([...games, { id: generateId(), number: nextNum, date: '', time: '' }]);
  };

  const removeGame = (gameId: string) => {
    const updated = games.filter(g => g.id !== gameId);
    onChange(updated);
  };

  const updateGame = (gameId: string, field: keyof PlayoffGame, value: any) => {
    const updated = games.map(g => g.id === gameId ? { ...g, [field]: value } : g);
    onChange(updated);
  };

  const moveGame = (index: number, direction: 'up' | 'down') => {
    const updated = [...games];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {games.length === 0 && (
        <p className="text-xs text-gray-400 italic py-2">No games added.</p>
      )}
      {games.map((game, idx) => (
        <div key={game.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded p-2">
          <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
            {idx > 0 && (
              <Button onClick={() => moveGame(idx, 'up')} variant="ghost" size="sm" className="h-5 w-5 p-0" title="Move up">
                <ChevronUp className="w-3 h-3" />
              </Button>
            )}
            {idx < games.length - 1 && (
              <Button onClick={() => moveGame(idx, 'down')} variant="ghost" size="sm" className="h-5 w-5 p-0" title="Move down">
                <ChevronDown className="w-3 h-3" />
              </Button>
            )}
          </div>
          <div className="w-12 shrink-0">
            <Label className="text-[10px] text-gray-500">Game #</Label>
            <Input
              type="number"
              value={game.number}
              onChange={(e) => updateGame(game.id, 'number', parseInt(e.target.value) || 0)}
              className="h-7 text-xs"
            />
          </div>
          <div className="flex-1">
            <Label className="text-[10px] text-gray-500">Date</Label>
            <Input
              value={game.date}
              onChange={(e) => updateGame(game.id, 'date', e.target.value)}
              placeholder="Friday, July 17"
              className="h-7 text-xs"
            />
          </div>
          <div className="w-24 shrink-0">
            <Label className="text-[10px] text-gray-500">Time</Label>
            <Input
              value={game.time}
              onChange={(e) => updateGame(game.id, 'time', e.target.value)}
              placeholder="7:00 PM"
              className="h-7 text-xs"
            />
          </div>
          <div className="flex items-end gap-1 shrink-0 pb-0.5">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={game.optional || false}
                onChange={(e) => updateGame(game.id, 'optional', e.target.checked)}
                className="rounded border-gray-300 text-xs"
              />
              <span className="text-[10px] text-gray-500">If req.</span>
            </label>
            <Button onClick={() => removeGame(game.id)} variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Trash2 className="w-3 h-3 text-red-500" />
            </Button>
          </div>
        </div>
      ))}
      <Button onClick={addGame} size="sm" variant="outline" className="h-7 text-xs w-full">
        <Plus className="w-3 h-3 mr-1" /> Add Game
      </Button>
    </div>
  );
}

// Scenario editor component
function ScenarioEditor({
  scenarios,
  onChange,
  label,
}: {
  scenarios: PlayoffScenario[];
  onChange: (scenarios: PlayoffScenario[]) => void;
  label: string;
}) {
  const addScenario = () => {
    onChange([...scenarios, { id: generateId(), name: '', condition: '', games: [] }]);
  };

  const removeScenario = (scenarioId: string) => {
    const updated = scenarios.filter(s => s.id !== scenarioId);
    onChange(updated);
  };

  const updateScenario = (scenarioId: string, field: keyof PlayoffScenario, value: any) => {
    const updated = scenarios.map(s => s.id === scenarioId ? { ...s, [field]: value } : s);
    onChange(updated);
  };

  const moveScenario = (idx: number, direction: 'up' | 'down') => {
    const updated = [...scenarios];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">{label} Scenarios</Label>
        <Button onClick={addScenario} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-1" /> Add Scenario
        </Button>
      </div>

      {scenarios.length === 0 && (
        <p className="text-sm text-gray-500 italic py-2">
          No scenarios configured. Add a scenario to define game schedules.
        </p>
      )}

      {scenarios.map((scenario, idx) => (
        <Card key={scenario.id} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Scenario {idx + 1}</span>
            <div className="flex items-center gap-1">
              {idx > 0 && (
                <Button onClick={() => moveScenario(idx, 'up')} variant="ghost" size="sm" className="h-7 w-7 p-0" title="Move up">
                  <ChevronUp className="w-3 h-3" />
                </Button>
              )}
              {idx < scenarios.length - 1 && (
                <Button onClick={() => moveScenario(idx, 'down')} variant="ghost" size="sm" className="h-7 w-7 p-0" title="Move down">
                  <ChevronDown className="w-3 h-3" />
                </Button>
              )}
              <Button onClick={() => removeScenario(scenario.id)} variant="ghost" size="sm">
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input
                value={scenario.name}
                onChange={(e) => updateScenario(scenario.id, 'name', e.target.value)}
                placeholder="e.g., 3 Game Series"
              />
            </div>
            <div>
              <Label className="text-xs">Condition</Label>
              <Input
                value={scenario.condition}
                onChange={(e) => updateScenario(scenario.id, 'condition', e.target.value)}
                placeholder="e.g., If 3rd/4th place teams"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Note (optional)</Label>
            <Input
              value={scenario.note || ''}
              onChange={(e) => updateScenario(scenario.id, 'note', e.target.value)}
              placeholder="e.g., Additional notes about this scenario"
            />
          </div>

          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-medium">Games</Label>
            </div>
            <GameEditor games={scenario.games} onChange={(games) => updateScenario(scenario.id, 'games', games)} />
          </div>
        </Card>
      ))}
    </div>
  );
}

// Draft section editor
function DraftSectionEditor({
  data,
  onChange,
  onDelete,
}: {
  data: DraftSection;
  onChange: (data: DraftSection) => void;
  onDelete: () => void;
}) {
  const addDetail = () => {
    const details = data.details || [];
    onChange({ ...data, details: [...details, ''] });
  };

  const updateDetail = (index: number, value: string) => {
    const details = [...(data.details || [])];
    details[index] = value;
    onChange({ ...data, details });
  };

  const removeDetail = (index: number) => {
    const details = [...(data.details || [])];
    details.splice(index, 1);
    onChange({ ...data, details });
  };

  const addDraftOrderItem = () => {
    const draftOrder = data.draftOrder || [];
    onChange({ ...data, draftOrder: [...draftOrder, ''] });
  };

  const updateDraftOrderItem = (index: number, value: string) => {
    const draftOrder = [...(data.draftOrder || [])];
    draftOrder[index] = value;
    onChange({ ...data, draftOrder });
  };

  const removeDraftOrderItem = (index: number) => {
    const draftOrder = [...(data.draftOrder || [])];
    draftOrder.splice(index, 1);
    onChange({ ...data, draftOrder });
  };

  const moveDraftOrderItem = (index: number, direction: 'up' | 'down') => {
    const draftOrder = [...(data.draftOrder || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= draftOrder.length) return;
    const temp = draftOrder[index];
    draftOrder[index] = draftOrder[targetIdx];
    draftOrder[targetIdx] = temp;
    onChange({ ...data, draftOrder });
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs font-semibold">Title</Label>
            <Input
              value={data.title || ''}
              onChange={(e) => onChange({ ...data, title: e.target.value })}
              placeholder="e.g., North Draft"
            />
          </div>
          <div>
            <Label className="text-xs">Subtitle (optional)</Label>
            <Input
              value={data.subtitle || ''}
              onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
              placeholder="(Teams)"
            />
          </div>
          <div>
            <Label className="text-xs">Region (optional)</Label>
            <Input
              value={data.region || ''}
              onChange={(e) => onChange({ ...data, region: e.target.value })}
              placeholder="North"
            />
          </div>
        </div>
        <Button onClick={onDelete} variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 ml-2">
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Date</Label>
          <Input
            value={data.date || ''}
            onChange={(e) => onChange({ ...data, date: e.target.value })}
            placeholder="Wednesday, February 4, 2026"
          />
        </div>
        <div>
          <Label className="text-xs">Time</Label>
          <Input
            value={data.time || ''}
            onChange={(e) => onChange({ ...data, time: e.target.value })}
            placeholder="7:00 PM"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs">Location (optional)</Label>
        <Input
          value={data.location || ''}
          onChange={(e) => onChange({ ...data, location: e.target.value })}
          placeholder="Local Eatery Sherwood..."
        />
      </div>

      <div>
        <Label className="text-xs">Notes (optional)</Label>
        <Input
          value={data.notes || ''}
          onChange={(e) => onChange({ ...data, notes: e.target.value })}
          placeholder="Players welcome to attend..."
        />
      </div>

      {/* Draft Order - always visible for easy access */}
      {(data.draftOrder && data.draftOrder.length > 0) || (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-semibold">Draft Order</Label>
            <Button onClick={addDraftOrderItem} size="sm" variant="outline" className="h-6 text-xs">
              <Plus className="w-3 h-3 mr-1" /> Add Team
            </Button>
          </div>
          {(data.draftOrder || []).map((team, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-2">
              <div className="flex flex-col gap-0.5 shrink-0">
                {idx > 0 && (
                  <Button
                    onClick={() => moveDraftOrderItem(idx, 'up')}
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    title="Move up"
                  >
                    <ChevronUp className="w-2 h-2" />
                  </Button>
                )}
                {idx < (data.draftOrder?.length || 0) - 1 && (
                  <Button
                    onClick={() => moveDraftOrderItem(idx, 'down')}
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    title="Move down"
                  >
                    <ChevronDown className="w-2 h-2" />
                  </Button>
                )}
              </div>
              <span className="text-xs text-gray-500 w-5 shrink-0">{idx + 1}.</span>
              <Input
                value={team}
                onChange={(e) => updateDraftOrderItem(idx, e.target.value)}
                placeholder="Team name"
                className="h-6 text-xs flex-1"
              />
              <Button onClick={() => removeDraftOrderItem(idx)} variant="ghost" size="sm" className="h-6 w-6 p-0">
                <X className="w-3 h-3 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Junior A style details */}
      {(data.details && data.details.length > 0) || (data.event) || (
        <details className="text-sm border-t pt-4">
          <summary className="cursor-pointer text-blue-600 font-medium hover:underline">Advanced Options</summary>
          <div className="mt-3 space-y-4 pl-2 border-l-2 border-blue-200">
            {/* Draft Details */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-semibold">Draft Details</Label>
                <Button onClick={addDetail} size="sm" variant="outline" className="h-6 text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              {(data.details || []).map((detail, idx) => (
                <div key={idx} className="flex items-start gap-2 mb-2">
                  <Input
                    value={detail}
                    onChange={(e) => updateDetail(idx, e.target.value)}
                    placeholder="Enter detail text"
                    className="h-6 text-xs flex-1"
                  />
                  <Button onClick={() => removeDetail(idx)} variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <X className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Event Details */}
            {data.event && (
              <div>
                <Label className="text-xs font-semibold mb-2 block">Draft Event</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-gray-500">Date</Label>
                    <Input
                      value={data.event.date || ''}
                      onChange={(e) => onChange({
                        ...data,
                        event: { ...(data.event || {}), date: e.target.value }
                      })}
                      className="h-6 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-gray-500">Time</Label>
                    <Input
                      value={data.event.time || ''}
                      onChange={(e) => onChange({
                        ...data,
                        event: { ...(data.event || {}), time: e.target.value }
                      })}
                      className="h-6 text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[10px] text-gray-500">Location</Label>
                    <Input
                      value={data.event.location || ''}
                      onChange={(e) => onChange({
                        ...data,
                        event: { ...(data.event || {}), location: e.target.value }
                      })}
                      className="h-6 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </details>
      )}
    </Card>
  );
}

// Regular Season section editor
function RegularSeasonSectionEditor({
  data,
  onChange,
  onDelete,
}: {
  data: RegularSeasonSection;
  onChange: (data: RegularSeasonSection) => void;
  onDelete: () => void;
}) {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-3">
          <div>
            <Label className="text-xs font-semibold">Title</Label>
            <Input
              value={data.title || ''}
              onChange={(e) => onChange({ ...data, title: e.target.value })}
              placeholder="e.g., Regular Season 2026"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Season Start</Label>
              <Input
                value={data.seasonStart || ''}
                onChange={(e) => onChange({ ...data, seasonStart: e.target.value })}
                placeholder="Friday, April 24, 2026"
              />
            </div>
            <div>
              <Label className="text-xs">Season End</Label>
              <Input
                value={data.seasonEnd || ''}
                onChange={(e) => onChange({ ...data, seasonEnd: e.target.value })}
                placeholder="Sunday, July 12, 2026"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Total Games</Label>
              <Input
                value={data.totalGames || ''}
                onChange={(e) => onChange({ ...data, totalGames: e.target.value })}
                placeholder="14"
              />
            </div>
            <div>
              <Label className="text-xs">Format</Label>
              <Input
                value={data.format || ''}
                onChange={(e) => onChange({ ...data, format: e.target.value })}
                placeholder="Unbalanced home & away"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Game Days</Label>
            <Input
              value={data.gameDays || ''}
              onChange={(e) => onChange({ ...data, gameDays: e.target.value })}
              placeholder="Monday, Wednesday, Friday, Saturday, Sunday"
            />
          </div>
          <div>
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea
              value={data.notes || ''}
              onChange={(e) => onChange({ ...data, notes: e.target.value })}
              placeholder="Additional notes about the regular season..."
              rows={2}
            />
          </div>
        </div>
        <Button onClick={onDelete} variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 ml-2">
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    </Card>
  );
}

// Playoff section editor
function PlayoffSectionEditor({
  data,
  onChange,
  onDelete,
}: {
  data: PlayoffSection;
  onChange: (data: PlayoffSection) => void;
  onDelete: () => void;
}) {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 space-y-3">
          <div>
            <Label className="text-xs font-semibold">Title (optional)</Label>
            <Input
              value={data.title || ''}
              onChange={(e) => onChange({ ...data, title: e.target.value })}
              placeholder="e.g., Playoffs 2026"
            />
          </div>
          <div>
            <Label className="text-xs">Format</Label>
            <Input
              value={data.format || ''}
              onChange={(e) => onChange({ ...data, format: e.target.value })}
              placeholder="e.g., Best of 5, Round Robin"
            />
          </div>
        </div>
        <Button onClick={onDelete} variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 ml-2">
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>

      {/* Scenarios */}
      <div>
        <ScenarioEditor
          scenarios={data.scenarios || []}
          onChange={(scenarios) => onChange({ ...data, scenarios })}
          label="Playoff"
        />
      </div>
    </Card>
  );
}

// Tournament schedule editor
function TournamentScheduleEditor({
  schedule,
  onChange,
}: {
  schedule: TournamentGame[];
  onChange: (schedule: TournamentGame[]) => void;
}) {
  const addGame = () => {
    const nextNum = schedule.length + 1;
    onChange([...schedule, { id: generateId(), number: nextNum, date: '', time: '', matchup: '', venue: '', label: '' }]);
  };

  const removeGame = (gameId: string) => {
    const updated = schedule.filter(g => g.id !== gameId);
    const renumbered = updated.map((item, idx) => ({ ...item, number: idx + 1 }));
    onChange(renumbered);
  };

  const updateGame = (gameId: string, field: keyof TournamentGame, value: any) => {
    const updated = schedule.map(g => g.id === gameId ? { ...g, [field]: value } : g);
    onChange(updated);
  };

  const moveGame = (index: number, direction: 'up' | 'down') => {
    const updated = [...schedule];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    const renumbered = updated.map((item, idx) => ({ ...item, number: idx + 1 }));
    onChange(renumbered);
  };

  return (
    <div className="space-y-2">
      {schedule.length === 0 && (
        <p className="text-xs text-gray-400 italic py-2">No games scheduled yet.</p>
      )}
      {schedule.map((game, idx) => (
        <Card key={game.id} className="p-3 mb-2 border border-gray-200">
          <div className="flex items-start gap-2">
            <div className="flex flex-col gap-0.5 shrink-0 pt-1">
              {idx > 0 && (
                <Button onClick={() => moveGame(idx, 'up')} variant="ghost" size="sm" className="h-5 w-5 p-0" title="Move up">
                  <ChevronUp className="w-3 h-3" />
                </Button>
              )}
              {idx < schedule.length - 1 && (
                <Button onClick={() => moveGame(idx, 'down')} variant="ghost" size="sm" className="h-5 w-5 p-0" title="Move down">
                  <ChevronDown className="w-3 h-3" />
                </Button>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-12 shrink-0">
                  <Label className="text-[10px] text-gray-500">Game #</Label>
                  <span className="text-sm font-bold">{game.number}</span>
                </div>
                <div className="flex-1">
                  <Label className="text-[10px] text-gray-500">Matchup</Label>
                  <Input
                    value={game.matchup}
                    onChange={(e) => updateGame(game.id, 'matchup', e.target.value)}
                    placeholder="e.g., Team A vs Team B"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="w-20 shrink-0">
                  <Label className="text-[10px] text-gray-500">Label</Label>
                  <Input
                    value={game.label || ''}
                    onChange={(e) => updateGame(game.id, 'label', e.target.value)}
                    placeholder="Semi-Final"
                    className="h-7 text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label className="text-[10px] text-gray-500">Date</Label>
                  <Input
                    value={game.date}
                    onChange={(e) => updateGame(game.id, 'date', e.target.value)}
                    placeholder="Friday, August 14"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="w-20 shrink-0">
                  <Label className="text-[10px] text-gray-500">Time</Label>
                  <Input
                    value={game.time}
                    onChange={(e) => updateGame(game.id, 'time', e.target.value)}
                    placeholder="7:00 PM"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-[10px] text-gray-500">Venue</Label>
                  <Input
                    value={game.venue || ''}
                    onChange={(e) => updateGame(game.id, 'venue', e.target.value)}
                    placeholder="Field A"
                    className="h-7 text-xs"
                  />
                </div>
                <Button onClick={() => removeGame(game.id)} variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                  <Trash2 className="w-3 h-3 text-red-500" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
      <Button onClick={addGame} size="sm" variant="outline" className="h-7 text-xs w-full">
        <Plus className="w-3 h-3 mr-1" /> Add Game
      </Button>
    </div>
  );
}

// Pool editor component
function PoolEditor({
  pool,
  title,
  onChange,
  poolName,
}: {
  pool: string[];
  title: string;
  onChange: (pool: string[]) => void;
  poolName: 'poolA' | 'poolB';
}) {
  const addTeam = (team: string) => {
    if (!team.trim()) return;
    onChange([...pool, team.trim()]);
  };

  const removeTeam = (index: number) => {
    const updated = [...pool];
    updated.splice(index, 1);
    onChange(updated);
  };

  const updateTeam = (index: number, value: string) => {
    const updated = [...pool];
    updated[index] = value;
    onChange(updated);
  };

  const moveTeam = (index: number, direction: 'up' | 'down') => {
    const updated = [...pool];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    onChange(updated);
  };

  return (
    <div>
      <Label className="text-xs font-bold text-[#013fac] mb-2 block">{title}</Label>
      <div className="space-y-2 bg-white border border-gray-200 rounded p-2">
        {pool.map((team, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5 shrink-0">
              {idx > 0 && (
                <Button onClick={() => moveTeam(idx, 'up')} variant="ghost" size="sm" className="h-4 w-4 p-0" title="Move up">
                  <ChevronUp className="w-2 h-2" />
                </Button>
              )}
              {idx < pool.length - 1 && (
                <Button onClick={() => moveTeam(idx, 'down')} variant="ghost" size="sm" className="h-4 w-4 p-0" title="Move down">
                  <ChevronDown className="w-2 h-2" />
                </Button>
              )}
            </div>
            <span className="text-xs text-gray-500 w-4">{idx + 1}.</span>
            <Input
              value={team}
              onChange={(e) => updateTeam(idx, e.target.value)}
              placeholder="Team name"
              className="h-7 text-xs flex-1"
            />
            <Button onClick={() => removeTeam(idx)} variant="ghost" size="sm" className="h-7 w-7 p-0">
              <X className="w-3 h-3 text-red-500" />
            </Button>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1">
          <Input
            placeholder="Add team..."
            className="h-7 text-xs flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addTeam(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <Button
            onClick={(e) => {
              const input = e.currentTarget.parentElement?.querySelector('input');
              if (input) {
                addTeam(input.value);
                input.value = '';
              }
            }}
            size="sm"
            variant="outline"
            className="h-7 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
      </div>
    </div>
  );
}

// Provincial section editor
function ProvincialSectionEditor({
  data,
  onChange,
  onDelete,
}: {
  data: ProvincialSection;
  onChange: (data: ProvincialSection) => void;
  onDelete: () => void;
}) {
  const formatType = data.formatType || 'scenario';

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-3">
          <div>
            <Label className="text-xs font-semibold">Title (optional)</Label>
            <Input
              value={data.title || ''}
              onChange={(e) => onChange({ ...data, title: e.target.value })}
              placeholder="e.g., Provincial Championship"
            />
          </div>

          {/* Format Type Toggle */}
          <div>
            <Label className="text-xs font-semibold mb-2 block">Format Type</Label>
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg w-fit">
              <button
                onClick={() => onChange({ ...data, formatType: 'scenario' })}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  formatType === 'scenario'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                Scenario (Best-of Series)
              </button>
              <button
                onClick={() => onChange({ ...data, formatType: 'tournament' })}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  formatType === 'tournament'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                Tournament (Pool-Based)
              </button>
              <button
                onClick={() => onChange({ ...data, formatType: 'simple' })}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  formatType === 'simple'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                Simple (Dates + Note)
              </button>
            </div>
          </div>

          {formatType === 'simple' && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Dates</Label>
                <Input
                  value={data.dates || ''}
                  onChange={(e) => onChange({ ...data, dates: e.target.value })}
                  placeholder="e.g., August 14-16, 2026"
                />
              </div>
              <div>
                <Label className="text-xs">Note (optional)</Label>
                <Textarea
                  value={data.note || ''}
                  onChange={(e) => onChange({ ...data, note: e.target.value })}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>
        <Button onClick={onDelete} variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 ml-2">
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>

      {/* Scenario Format */}
      {formatType === 'scenario' && (
        <div>
          <div>
            <Label className="text-xs">Provincial Format</Label>
            <Input
              value={data.format || ''}
              onChange={(e) => onChange({ ...data, format: e.target.value })}
              placeholder="e.g., Best of 5, Round Robin + Final"
              className="mt-1"
            />
          </div>
          <ScenarioEditor
            scenarios={data.scenarios || []}
            onChange={(scenarios) => onChange({ ...data, scenarios })}
            label="Provincial"
          />
        </div>
      )}

      {/* Tournament Format */}
      {formatType === 'tournament' && (
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Tournament Dates</Label>
            <Input
              value={data.dates || ''}
              onChange={(e) => onChange({ ...data, dates: e.target.value })}
              placeholder="e.g., Friday, August 14 to Sunday, August 16, 2026"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PoolEditor
              pool={data.pools?.poolA || []}
              title="POOL A"
              onChange={(pool) => onChange({
                ...data,
                pools: { ...(data.pools || { poolA: [], poolB: [] }), poolA: pool }
              })}
              poolName="poolA"
            />
            <PoolEditor
              pool={data.pools?.poolB || []}
              title="POOL B"
              onChange={(pool) => onChange({
                ...data,
                pools: { ...(data.pools || { poolA: [], poolB: [] }), poolB: pool }
              })}
              poolName="poolB"
            />
          </div>

          <div>
            <Label className="text-xs">Pool Round Note (optional)</Label>
            <Input
              value={data.poolRoundNote || ''}
              onChange={(e) => onChange({ ...data, poolRoundNote: e.target.value })}
              placeholder="e.g., Top 2 teams from each pool advance"
            />
          </div>

          <div>
            <Label className="text-xs">Venues</Label>
            <Input
              value={data.venues || ''}
              onChange={(e) => onChange({ ...data, venues: e.target.value })}
              placeholder="e.g., Calgary Soccer Centre - Field A & B"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Tournament Schedule</Label>
            <TournamentScheduleEditor
              schedule={data.schedule || []}
              onChange={(schedule) => onChange({ ...data, schedule })}
            />
          </div>
        </div>
      )}
    </Card>
  );
}

// Championship section editor
function ChampionshipSectionEditor({
  data,
  onChange,
  onDelete,
}: {
  data: ChampionshipSection;
  onChange: (data: ChampionshipSection) => void;
  onDelete: () => void;
}) {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 space-y-3">
          <div>
            <Label className="text-xs font-semibold">Title (optional)</Label>
            <Input
              value={data.title || ''}
              onChange={(e) => onChange({ ...data, title: e.target.value })}
              placeholder="e.g., Presidents Cup"
            />
          </div>
          <div>
            <Label className="text-xs">Championship Type</Label>
            <select
              value={data.type || 'presidents-cup'}
              onChange={(e) => onChange({ ...data, type: e.target.value as any })}
              className="w-full h-9 px-3 text-sm rounded-md border border-gray-200 bg-white"
            >
              <option value="presidents-cup">Presidents Cup</option>
              <option value="national">National Championship</option>
              <option value="other">Other Championship</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">Tournament Dates</Label>
            <Input
              value={data.dates || ''}
              onChange={(e) => onChange({ ...data, dates: e.target.value })}
              placeholder="Sunday, August 30 to Saturday, September 5, 2026"
            />
          </div>
          <div>
            <Label className="text-xs">Location</Label>
            <Input
              value={data.location || ''}
              onChange={(e) => onChange({ ...data, location: e.target.value })}
              placeholder="Silent Ice Centre - Hatch Arena"
            />
          </div>
          <div>
            <Label className="text-xs">City (optional)</Label>
            <Input
              value={data.city || ''}
              onChange={(e) => onChange({ ...data, city: e.target.value })}
              placeholder="Nisku, AB"
            />
          </div>
          {data.type === 'presidents-cup' && (
            <div>
              <Label className="text-xs">Travel Days (comma-separated)</Label>
              <Input
                value={data.travelDays?.join(', ') || ''}
                onChange={(e) => onChange({
                  ...data,
                  travelDays: e.target.value.split(',').map(d => d.trim()).filter(Boolean)
                })}
                placeholder="Saturday, August 29, 2026, Sunday, September 6, 2026"
              />
            </div>
          )}
        </div>
        <Button onClick={onDelete} variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 ml-2">
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    </Card>
  );
}

// ============================================================================
// MAIN EDITOR
// ============================================================================

export function SeasonInfoEditor({ value, onChange, divisionName = '' }: SeasonInfoEditorProps) {
  const [mode, setMode] = useState<'visual' | 'json' | 'preview'>('visual');
  const [jsonValue, setJsonValue] = useState(value);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [data, setData] = useState<SeasonInfoData>({});

  // Parse initial value
  useEffect(() => {
    try {
      const parsed = value ? JSON.parse(value) : {};
      // Debug: log the raw data for non-empty data
      if (value && Object.keys(parsed).length > 0) {
        console.log('SeasonInfoEditor - Raw data:', parsed);
      }
      const migrated = migrateToUnified(parsed);
      console.log('SeasonInfoEditor - Migrated data:', migrated);
      setData(migrated);
      setJsonValue(JSON.stringify(migrated, null, 2));
      setJsonError(null);
    } catch (e) {
      console.error('SeasonInfoEditor - Parse error:', e);
      setJsonError('Invalid JSON format');
    }
  }, [value]);

  const updateData = (newData: SeasonInfoData) => {
    setData(newData);
    const jsonStr = JSON.stringify(newData);
    setJsonValue(JSON.stringify(newData, null, 2));
    onChange(jsonStr);
  };

  const handleJsonChange = (newJson: string) => {
    setJsonValue(newJson);
    try {
      const parsed = JSON.parse(newJson);
      const migrated = migrateToUnified(parsed);
      setData(migrated);
      // Save the migrated version as JSON
      const migratedJson = JSON.stringify(migrated);
      setJsonValue(JSON.stringify(migrated, null, 2));
      onChange(migratedJson);
      setJsonError(null);
    } catch (e) {
      setJsonError('Invalid JSON');
    }
  };

  // Tab labels
  const tabs = [
    { key: 'drafts', label: 'Drafts', icon: '📋' },
    { key: 'regularSeason', label: 'Regular Season', icon: '📅' },
    { key: 'playoffs', label: 'Playoffs', icon: '🏆' },
    { key: 'provincial', label: 'Provincial', icon: '🏅' },
    { key: 'championships', label: 'Championships', icon: '🎖️' },
    { key: 'notes', label: 'Notes', icon: '📝' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === 'visual' ? 'default' : 'outline'}
          onClick={() => setMode('visual')}
          size="sm"
        >
          Visual Editor
        </Button>
        <Button
          type="button"
          variant={mode === 'json' ? 'default' : 'outline'}
          onClick={() => setMode('json')}
          size="sm"
        >
          <Code className="w-4 h-4 mr-2" />
          JSON Editor
        </Button>
        <Button
          type="button"
          variant={mode === 'preview' ? 'default' : 'outline'}
          onClick={() => setMode('preview')}
          size="sm"
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>
      </div>

      {mode === 'visual' && (
        <div className="space-y-6">
          <Tabs defaultValue="drafts" className="w-full">
            <TabsList className="grid grid-cols-3 lg:grid-cols-6">
              {tabs.map(tab => (
                <TabsTrigger key={tab.key} value={tab.key}>
                  {tab.icon} <span className="ml-1 hidden sm:inline">{tab.label}</span>
                  <span className="ml-1 sm:hidden">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Drafts Tab */}
            <TabsContent value="drafts" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Drafts</h3>
                <Button
                  onClick={() => {
                    const drafts = data.drafts || [];
                    updateData({
                      ...data,
                      drafts: [...drafts, {
                        id: generateId(),
                        title: '',
                        region: drafts.length === 0 ? 'North' : 'South',
                      }]
                    });
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Draft Section
                </Button>
              </div>
              {(!Array.isArray(data.drafts) || data.drafts.length === 0) && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <p className="text-gray-500 mb-2">No draft sections added</p>
                  <Button
                    onClick={() => {
                      updateData({
                        ...data,
                        drafts: [{
                          id: generateId(),
                          title: 'North Draft',
                          region: 'North',
                        }]
                      });
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add First Draft
                  </Button>
                </div>
              )}
              {Array.isArray(data.drafts) && data.drafts.map((draft) => (
                <DraftSectionEditor
                  key={draft.id}
                  data={draft}
                  onChange={(updated) => {
                    const drafts = Array.isArray(data.drafts) ? data.drafts.map(d =>
                      d.id === draft.id ? updated : d
                    ) : [];
                    updateData({ ...data, drafts });
                  }}
                  onDelete={() => {
                    const drafts = Array.isArray(data.drafts) ? data.drafts.filter(d => d.id !== draft.id) : [];
                    updateData({ ...data, drafts });
                  }}
                />
              ))}
            </TabsContent>

            {/* Regular Season Tab */}
            <TabsContent value="regularSeason" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Regular Season</h3>
                <Button
                  onClick={() => {
                    const seasons = Array.isArray(data.regularSeason) ? data.regularSeason : [];
                    updateData({
                      ...data,
                      regularSeason: [...seasons, {
                        id: generateId(),
                        title: `Regular Season ${seasons.length + 1}`,
                      }]
                    });
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Regular Season Section
                </Button>
              </div>
              {(!Array.isArray(data.regularSeason) || data.regularSeason.length === 0) && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <p className="text-gray-500 mb-2">No regular season sections added</p>
                  <Button
                    onClick={() => {
                      updateData({
                        ...data,
                        regularSeason: [{
                          id: generateId(),
                          title: 'Regular Season',
                        }]
                      });
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Regular Season
                  </Button>
                </div>
              )}
              {Array.isArray(data.regularSeason) && data.regularSeason.map((season) => (
                <RegularSeasonSectionEditor
                  key={season.id}
                  data={season}
                  onChange={(updated) => {
                    const seasons = Array.isArray(data.regularSeason) ? data.regularSeason.map(s =>
                      s.id === season.id ? updated : s
                    ) : [];
                    updateData({ ...data, regularSeason: seasons });
                  }}
                  onDelete={() => {
                    const seasons = Array.isArray(data.regularSeason) ? data.regularSeason.filter(s => s.id !== season.id) : [];
                    updateData({ ...data, regularSeason: seasons });
                  }}
                />
              ))}
            </TabsContent>

            {/* Playoffs Tab */}
            <TabsContent value="playoffs" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Playoffs</h3>
                <Button
                  onClick={() => {
                    const playoffs = Array.isArray(data.playoffs) ? data.playoffs : [];
                    updateData({
                      ...data,
                      playoffs: [...playoffs, {
                        id: generateId(),
                        title: `Playoffs ${playoffs.length + 1}`,
                      }]
                    });
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Playoff Section
                </Button>
              </div>
              {(!Array.isArray(data.playoffs) || data.playoffs.length === 0) && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <p className="text-gray-500 mb-2">No playoff sections added</p>
                  <Button
                    onClick={() => {
                      updateData({
                        ...data,
                        playoffs: [{
                          id: generateId(),
                          title: 'Playoffs',
                        }]
                      });
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Playoffs
                  </Button>
                </div>
              )}
              {Array.isArray(data.playoffs) && data.playoffs.map((playoff) => (
                <PlayoffSectionEditor
                  key={playoff.id}
                  data={playoff}
                  onChange={(updated) => {
                    const playoffs = Array.isArray(data.playoffs) ? data.playoffs.map(p =>
                      p.id === playoff.id ? updated : p
                    ) : [];
                    updateData({ ...data, playoffs });
                  }}
                  onDelete={() => {
                    const playoffs = Array.isArray(data.playoffs) ? data.playoffs.filter(p => p.id !== playoff.id) : [];
                    updateData({ ...data, playoffs });
                  }}
                />
              ))}
            </TabsContent>

            {/* Provincial Tab */}
            <TabsContent value="provincial" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Provincial Championship</h3>
                <Button
                  onClick={() => {
                    const provincial = Array.isArray(data.provincial) ? data.provincial : [];
                    updateData({
                      ...data,
                      provincial: [...provincial, {
                        id: generateId(),
                        title: `Provincial Championship ${provincial.length + 1}`,
                        formatType: 'scenario',
                      }]
                    });
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Provincial Section
                </Button>
              </div>
              {(!Array.isArray(data.provincial) || data.provincial.length === 0) && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <p className="text-gray-500 mb-2">No provincial sections added</p>
                  <Button
                    onClick={() => {
                      updateData({
                        ...data,
                        provincial: [{
                          id: generateId(),
                          title: 'Provincial Championship',
                          formatType: 'scenario',
                        }]
                      });
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Provincial
                  </Button>
                </div>
              )}
              {Array.isArray(data.provincial) && data.provincial.map((prov) => (
                <ProvincialSectionEditor
                  key={prov.id}
                  data={prov}
                  onChange={(updated) => {
                    const provincial = Array.isArray(data.provincial) ? data.provincial.map(p =>
                      p.id === prov.id ? updated : p
                    ) : [];
                    updateData({ ...data, provincial });
                  }}
                  onDelete={() => {
                    const provincial = Array.isArray(data.provincial) ? data.provincial.filter(p => p.id !== prov.id) : [];
                    updateData({ ...data, provincial });
                  }}
                />
              ))}
            </TabsContent>

            {/* Championships Tab */}
            <TabsContent value="championships" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Championships</h3>
                <Button
                  onClick={() => {
                    const championships = Array.isArray(data.championships) ? data.championships : [];
                    updateData({
                      ...data,
                      championships: [...championships, {
                        id: generateId(),
                        type: 'presidents-cup',
                        title: championships.length === 0 ? 'Presidents Cup' : `Championship ${championships.length + 1}`,
                        dates: '',
                        location: '',
                      }]
                    });
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Championship
                </Button>
              </div>
              {(!Array.isArray(data.championships) || data.championships.length === 0) && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <p className="text-gray-500 mb-2">No championships added</p>
                  <Button
                    onClick={() => {
                      updateData({
                        ...data,
                        championships: [{
                          id: generateId(),
                          type: 'presidents-cup',
                          title: 'Presidents Cup',
                          dates: '',
                          location: '',
                        }]
                      });
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Presidents Cup
                  </Button>
                </div>
              )}
              {(data.championships || []).map((champ) => (
                <ChampionshipSectionEditor
                  key={champ.id}
                  data={champ}
                  onChange={(updated) => {
                    const championships = (data.championships || []).map(c =>
                      c.id === champ.id ? updated : c
                    );
                    updateData({ ...data, championships });
                  }}
                  onDelete={() => {
                    const championships = (data.championships || []).filter(c => c.id !== champ.id);
                    updateData({ ...data, championships });
                  }}
                />
              ))}
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Notes</h3>
              </div>
              <Card className="p-4">
                <Label className="text-xs mb-2 block">Important Notes</Label>
                <Textarea
                  value={data.notes || ''}
                  onChange={(e) => updateData({ ...data, notes: e.target.value })}
                  placeholder="Dates for Playoffs and Provincials may be subject to change..."
                  rows={6}
                />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {mode === 'json' && (
        <div>
          <Label className="text-xs mb-2 block">JSON Editor</Label>
          <Textarea
            value={jsonValue}
            onChange={(e) => handleJsonChange(e.target.value)}
            rows={20}
            className="font-mono text-xs"
          />
          {jsonError && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{jsonError}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {mode === 'preview' && (
        <div>
          <h4 className="font-bold text-sm mb-4">Preview</h4>
          <div className="border rounded-lg p-4 bg-gray-50">
            <SeasonInfoDisplay data={value} />
          </div>
        </div>
      )}
    </div>
  );
}