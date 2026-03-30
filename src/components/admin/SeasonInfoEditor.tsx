import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Plus, Trash2, AlertCircle, Eye, ChevronUp, ChevronDown, Edit2, Check, X, Code } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { SeasonInfoDisplay } from '../SeasonInfoDisplay';

interface Game {
  number: number;
  date: string;
  time: string;
  optional?: boolean;
}

interface Scenario {
  name: string;
  condition: string;
  games: Game[];
}

interface SeasonInfoData {
  drafts?: {
    north?: {
      title: string;
      subtitle: string;
      date: string;
      time: string;
      location?: string;
      notes?: string;
    };
    south?: {
      title: string;
      subtitle: string;
      date: string;
      time: string;
      notes?: string;
    };
  };
  regularSeason?: {
    start: string;
    end: string;
    gameDays: string[];
    totalGames: number;
    format: string;
  };
  playoffs?: {
    format: string;
    scenarios: Scenario[];
  };
  provincial?: {
    format: string;
    scenarios: Scenario[];
  };
  presidentsCup?: {
    dates: string;
    location: string;
    city: string;
    travelDays: string[];
  };
  notes?: string;
}

interface SeasonInfoEditorProps {
  value: string;
  onChange: (value: string) => void;
}

function ScenarioEditor({
  scenarios,
  onChange,
  label,
}: {
  scenarios: Scenario[];
  onChange: (scenarios: Scenario[]) => void;
  label: string;
}) {
  const addScenario = () => {
    onChange([...scenarios, { name: '', condition: '', games: [] }]);
  };

  const removeScenario = (index: number) => {
    const updated = [...scenarios];
    updated.splice(index, 1);
    onChange(updated);
  };

  const updateScenario = (index: number, field: keyof Scenario, value: any) => {
    const updated = [...scenarios];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addGame = (scenarioIndex: number) => {
    const updated = [...scenarios];
    const nextNum = (updated[scenarioIndex].games?.length || 0) + 1;
    updated[scenarioIndex] = {
      ...updated[scenarioIndex],
      games: [...(updated[scenarioIndex].games || []), { number: nextNum, date: '', time: '' }],
    };
    onChange(updated);
  };

  const removeGame = (scenarioIndex: number, gameIndex: number) => {
    const updated = [...scenarios];
    const games = [...updated[scenarioIndex].games];
    games.splice(gameIndex, 1);
    updated[scenarioIndex] = { ...updated[scenarioIndex], games };
    onChange(updated);
  };

  const updateGame = (scenarioIndex: number, gameIndex: number, field: keyof Game, value: any) => {
    const updated = [...scenarios];
    const games = [...updated[scenarioIndex].games];
    games[gameIndex] = { ...games[gameIndex], [field]: value };
    updated[scenarioIndex] = { ...updated[scenarioIndex], games };
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

  const moveGame = (scenarioIndex: number, gameIndex: number, direction: 'up' | 'down') => {
    const updated = [...scenarios];
    const games = [...updated[scenarioIndex].games];
    const targetIdx = direction === 'up' ? gameIndex - 1 : gameIndex + 1;
    if (targetIdx < 0 || targetIdx >= games.length) return;
    const temp = games[gameIndex];
    games[gameIndex] = games[targetIdx];
    games[targetIdx] = temp;
    updated[scenarioIndex] = { ...updated[scenarioIndex], games };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">{label} Scenarios</Label>
        <Button onClick={addScenario} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-1" />
          Add Scenario
        </Button>
      </div>

      {scenarios.length === 0 && (
        <p className="text-sm text-gray-500 italic py-2">
          No scenarios configured. Add a scenario to define game schedules.
        </p>
      )}

      {scenarios.map((scenario, sIdx) => (
        <Card key={sIdx} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Scenario {sIdx + 1}</span>
            <div className="flex items-center gap-1">
              {sIdx > 0 && (
                <Button onClick={() => moveScenario(sIdx, 'up')} variant="ghost" size="sm" className="h-7 w-7 p-0" title="Move up">
                  <ChevronUp className="w-3 h-3" />
                </Button>
              )}
              {sIdx < scenarios.length - 1 && (
                <Button onClick={() => moveScenario(sIdx, 'down')} variant="ghost" size="sm" className="h-7 w-7 p-0" title="Move down">
                  <ChevronDown className="w-3 h-3" />
                </Button>
              )}
              <Button onClick={() => removeScenario(sIdx)} variant="ghost" size="sm">
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input
                value={scenario.name}
                onChange={(e) => updateScenario(sIdx, 'name', e.target.value)}
                placeholder="e.g., 3 Game Series"
              />
            </div>
            <div>
              <Label className="text-xs">Condition</Label>
              <Input
                value={scenario.condition}
                onChange={(e) => updateScenario(sIdx, 'condition', e.target.value)}
                placeholder="e.g., If 3rd/4th place teams"
              />
            </div>
          </div>

          {/* Games within this scenario */}
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Games</Label>
              <Button onClick={() => addGame(sIdx)} size="sm" variant="outline" className="h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" />
                Add Game
              </Button>
            </div>

            {(scenario.games || []).length === 0 && (
              <p className="text-xs text-gray-400 italic">No games added.</p>
            )}

            {(scenario.games || []).map((game, gIdx) => (
              <div key={gIdx} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded p-2">
                {gIdx > 0 && (
                  <Button
                    onClick={() => moveGame(sIdx, gIdx, 'up')}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 shrink-0"
                    title="Move up"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                )}
                {gIdx < (scenario.games || []).length - 1 && (
                  <Button
                    onClick={() => moveGame(sIdx, gIdx, 'down')}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 shrink-0"
                    title="Move down"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                )}
                <div className="w-12 shrink-0">
                  <Label className="text-[10px] text-gray-500">Game #</Label>
                  <Input
                    type="number"
                    value={game.number}
                    onChange={(e) => updateGame(sIdx, gIdx, 'number', parseInt(e.target.value) || 0)}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-[10px] text-gray-500">Date</Label>
                  <Input
                    value={game.date}
                    onChange={(e) => updateGame(sIdx, gIdx, 'date', e.target.value)}
                    placeholder="Friday, July 17"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="w-24 shrink-0">
                  <Label className="text-[10px] text-gray-500">Time</Label>
                  <Input
                    value={game.time}
                    onChange={(e) => updateGame(sIdx, gIdx, 'time', e.target.value)}
                    placeholder="7:00 PM"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="flex items-end gap-1 shrink-0 pb-0.5">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={game.optional || false}
                      onChange={(e) => updateGame(sIdx, gIdx, 'optional', e.target.checked)}
                      className="rounded border-gray-300 text-xs"
                    />
                    <span className="text-[10px] text-gray-500">If req.</span>
                  </label>
                  <Button onClick={() => removeGame(sIdx, gIdx)} variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

export function SeasonInfoEditor({ value, onChange }: SeasonInfoEditorProps) {
  const [mode, setMode] = useState<'visual' | 'json' | 'preview'>('visual');
  const [jsonValue, setJsonValue] = useState(value);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [data, setData] = useState<SeasonInfoData>({});
  const [editingHeading, setEditingHeading] = useState<string | null>(null);

  // Parse initial value
  useEffect(() => {
    try {
      const parsed = value ? JSON.parse(value) : {};
      setData(parsed);
      setJsonValue(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (e) {
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
      setData(parsed);
      onChange(newJson);
      setJsonError(null);
    } catch (e) {
      setJsonError('Invalid JSON');
    }
  };

  // Get tab metadata
  const getTabMetadata = (key: string) => data.__metadata?.[key] || {};
  const updateTabMetadata = (key: string, field: string, value: any) => {
    const metadata = data.__metadata || {};
    metadata[key] = { ...metadata[key], [field]: value };
    updateData({ ...data, __metadata: metadata });
  };

  const getTabLabel = (key: string) => {
    const metadata = getTabMetadata(key);
    if (metadata.title) return metadata.title;
    switch (key) {
      case 'drafts': return 'Drafts';
      case 'regular': return 'Regular Season';
      case 'playoffs': return 'Playoffs';
      case 'provincial': return 'Provincial';
      case 'presidents': return 'Presidents Cup';
      case 'notes': return 'Notes';
      default: return key;
    }
  };

  const isTabCollapsed = (key: string) => {
    const metadata = getTabMetadata(key);
    return metadata.collapsed ?? false;
  };

  const isTabCollapsible = (key: string) => {
    const metadata = getTabMetadata(key);
    return metadata.collapsible ?? true;
  };

  const availableTabs = ['drafts', 'regular', 'playoffs', 'provincial', 'presidents', 'notes'];

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
          <Alert>
            <AlertCircle className="w-4 w-4" />
            <AlertDescription>
              Use the visual editor to build structured season information. This will be displayed as beautiful cards on the Division Info page.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="drafts" className="w-full">
            <TabsList className="grid grid-cols-3 lg:grid-cols-6">
              {availableTabs.map(tab => (
                <TabsTrigger key={tab} value={tab}>
                  {getTabLabel(tab)}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Drafts Tab */}
            <TabsContent value="drafts" className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold">North Draft</h4>
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => setEditingHeading('drafts-north')}
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      title="Edit heading"
                    >
                      <Edit2 className="w-3 h-3 text-gray-500" />
                    </Button>
                  </div>
                </div>
                {editingHeading === 'drafts-north' ? (
                  <div className="flex items-center gap-2 mb-3">
                    <Input
                      value={getTabMetadata('drafts').northHeading || ''}
                      onChange={(e) => {}}
                      placeholder="Custom heading (optional)"
                      className="h-7 w-48"
                    />
                    <Button
                      onClick={() => {
                        updateTabMetadata('drafts', 'northHeading', '');
                        setEditingHeading(null);
                      }}
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                    >
                      <Check className="w-3 h-3 text-green-600" />
                    </Button>
                    <Button
                      onClick={() => setEditingHeading(null)}
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                    >
                      <X className="w-3 h-3 text-red-600" />
                    </Button>
                  </div>
                ) : getTabMetadata('drafts').northHeading ? (
                  <p className="text-sm text-gray-600 mb-3 italic">{getTabMetadata('drafts').northHeading}</p>
                ) : null}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={data.drafts?.north?.title || ''}
                      onChange={(e) => updateData({
                        ...data,
                        drafts: {
                          ...data.drafts,
                          north: { ...data.drafts?.north!, title: e.target.value }
                        }
                      })}
                      placeholder="North Draft"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Subtitle</Label>
                    <Input
                      value={data.drafts?.north?.subtitle || ''}
                      onChange={(e) => updateData({
                        ...data,
                        drafts: {
                          ...data.drafts,
                          north: { ...data.drafts?.north!, subtitle: e.target.value }
                        }
                      })}
                      placeholder="(Teams)"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Date</Label>
                    <Input
                      value={data.drafts?.north?.date || ''}
                      onChange={(e) => updateData({
                        ...data,
                        drafts: {
                          ...data.drafts,
                          north: { ...data.drafts?.north!, date: e.target.value }
                        }
                      })}
                      placeholder="Wednesday, February 4, 2026"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Time</Label>
                    <Input
                      value={data.drafts?.north?.time || ''}
                      onChange={(e) => updateData({
                        ...data,
                        drafts: {
                          ...data.drafts,
                          north: { ...data.drafts?.north!, time: e.target.value }
                        }
                      })}
                      placeholder="7:00 PM"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Location (optional)</Label>
                    <Input
                      value={data.drafts?.north?.location || ''}
                      onChange={(e) => updateData({
                        ...data,
                        drafts: {
                          ...data.drafts,
                          north: { ...data.drafts?.north!, location: e.target.value }
                        }
                      })}
                      placeholder="Local Eatery Sherwood..."
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Notes (optional)</Label>
                    <Input
                      value={data.drafts?.north?.notes || ''}
                      onChange={(e) => updateData({
                        ...data,
                        drafts: {
                          ...data.drafts,
                          north: { ...data.drafts?.north!, notes: e.target.value }
                        }
                      })}
                      placeholder="Players welcome to attend..."
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold">South Draft</h4>
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => setEditingHeading('drafts-south')}
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      title="Edit heading"
                    >
                      <Edit2 className="w-3 h-3 text-gray-500" />
                    </Button>
                  </div>
                </div>
                {editingHeading === 'drafts-south' ? (
                  <div className="flex items-center gap-2 mb-3">
                    <Input
                      value={getTabMetadata('drafts').southHeading || ''}
                      onChange={(e) => {}}
                      placeholder="Custom heading (optional)"
                      className="h-7 w-48"
                    />
                    <Button
                      onClick={() => {
                        updateTabMetadata('drafts', 'southHeading', '');
                        setEditingHeading(null);
                      }}
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                    >
                      <Check className="w-3 h-3 text-green-600" />
                    </Button>
                    <Button
                      onClick={() => setEditingHeading(null)}
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                    >
                      <X className="w-3 h-3 text-red-600" />
                    </Button>
                  </div>
                ) : getTabMetadata('drafts').southHeading ? (
                  <p className="text-sm text-gray-600 mb-3 italic">{getTabMetadata('drafts').southHeading}</p>
                ) : null}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={data.drafts?.south?.title || ''}
                      onChange={(e) => updateData({
                        ...data,
                        drafts: {
                          ...data.drafts,
                          south: { ...data.drafts?.south!, title: e.target.value }
                        }
                      })}
                      placeholder="South Draft"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Subtitle</Label>
                    <Input
                      value={data.drafts?.south?.subtitle || ''}
                      onChange={(e) => updateData({
                        ...data,
                        drafts: {
                          ...data.drafts,
                          south: { ...data.drafts?.south!, subtitle: e.target.value }
                        }
                      })}
                      placeholder="(Teams)"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Date</Label>
                    <Input
                      value={data.drafts?.south?.date || ''}
                      onChange={(e) => updateData({
                        ...data,
                        drafts: {
                          ...data.drafts,
                          south: { ...data.drafts?.south!, date: e.target.value }
                        }
                      })}
                      placeholder="Thursday, February 5, 2026"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Time</Label>
                    <Input
                      value={data.drafts?.south?.time || ''}
                      onChange={(e) => updateData({
                        ...data,
                        drafts: {
                          ...data.drafts,
                          south: { ...data.drafts?.south!, time: e.target.value }
                        }
                      })}
                      placeholder="7:00 PM"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Notes (optional)</Label>
                    <Input
                      value={data.drafts?.south?.notes || ''}
                      onChange={(e) => updateData({
                        ...data,
                        drafts: {
                          ...data.drafts,
                          south: { ...data.drafts?.south!, notes: e.target.value }
                        }
                      })}
                      placeholder="Follow Live on X..."
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Regular Season Tab */}
            <TabsContent value="regular" className="space-y-4">
              <Card className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Season Start</Label>
                    <Input
                      value={data.regularSeason?.start || ''}
                      onChange={(e) => updateData({
                        ...data,
                        regularSeason: { ...data.regularSeason!, start: e.target.value }
                      })}
                      placeholder="Friday, April 24, 2026"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Season End</Label>
                    <Input
                      value={data.regularSeason?.end || ''}
                      onChange={(e) => updateData({
                        ...data,
                        regularSeason: { ...data.regularSeason!, end: e.target.value }
                      })}
                      placeholder="Sunday, July 12, 2026"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Total Games</Label>
                    <Input
                      type="number"
                      value={data.regularSeason?.totalGames || 0}
                      onChange={(e) => updateData({
                        ...data,
                        regularSeason: { ...data.regularSeason!, totalGames: parseInt(e.target.value) || 0 }
                      })}
                      placeholder="14"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Format</Label>
                    <Input
                      value={data.regularSeason?.format || ''}
                      onChange={(e) => updateData({
                        ...data,
                        regularSeason: { ...data.regularSeason!, format: e.target.value }
                      })}
                      placeholder="Unbalanced home & away"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Game Days (comma-separated)</Label>
                    <Input
                      value={data.regularSeason?.gameDays?.join(', ') || ''}
                      onChange={(e) => updateData({
                        ...data,
                        regularSeason: {
                          ...data.regularSeason!,
                          gameDays: e.target.value.split(',').map(d => d.trim())
                        }
                      })}
                      placeholder="Monday, Wednesday, Friday, Saturday, Sunday"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Playoffs Tab */}
            <TabsContent value="playoffs" className="space-y-4">
              <Card className="p-4 space-y-4">
                <div>
                  <Label className="text-xs">Playoff Format</Label>
                  <Input
                    value={data.playoffs?.format || ''}
                    onChange={(e) => updateData({
                      ...data,
                      playoffs: { format: e.target.value, scenarios: data.playoffs?.scenarios || [] }
                    })}
                    placeholder="e.g., Best of 5, Best of 7, Round Robin"
                  />
                </div>

                <ScenarioEditor
                  scenarios={data.playoffs?.scenarios || []}
                  onChange={(scenarios) => updateData({
                    ...data,
                    playoffs: { format: data.playoffs?.format || '', scenarios }
                  })}
                  label="Playoff"
                />
              </Card>
            </TabsContent>

            {/* Provincial Tab */}
            <TabsContent value="provincial" className="space-y-4">
              <Card className="p-4 space-y-4">
                <div>
                  <Label className="text-xs">Provincial Format</Label>
                  <Input
                    value={data.provincial?.format || ''}
                    onChange={(e) => updateData({
                      ...data,
                      provincial: { format: e.target.value, scenarios: data.provincial?.scenarios || [] }
                    })}
                    placeholder="e.g., Best of 5, Round Robin + Final"
                  />
                </div>

                <ScenarioEditor
                  scenarios={data.provincial?.scenarios || []}
                  onChange={(scenarios) => updateData({
                    ...data,
                    provincial: { format: data.provincial?.format || '', scenarios }
                  })}
                  label="Provincial"
                />
              </Card>
            </TabsContent>

            {/* Presidents Cup Tab */}
            <TabsContent value="presidents">
              <Card className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="text-xs">Tournament Dates</Label>
                    <Input
                      value={data.presidentsCup?.dates || ''}
                      onChange={(e) => updateData({
                        ...data,
                        presidentsCup: { ...data.presidentsCup!, dates: e.target.value }
                      })}
                      placeholder="Sunday, August 30 to Saturday, September 5, 2026"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Location</Label>
                    <Input
                      value={data.presidentsCup?.location || ''}
                      onChange={(e) => updateData({
                        ...data,
                        presidentsCup: { ...data.presidentsCup!, location: e.target.value }
                      })}
                      placeholder="Silent Ice Centre - Hatch Arena"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">City</Label>
                    <Input
                      value={data.presidentsCup?.city || ''}
                      onChange={(e) => updateData({
                        ...data,
                        presidentsCup: { ...data.presidentsCup!, city: e.target.value }
                      })}
                      placeholder="Nisku, AB"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Travel Days (comma-separated)</Label>
                    <Input
                      value={data.presidentsCup?.travelDays?.join(', ') || ''}
                      onChange={(e) => updateData({
                        ...data,
                        presidentsCup: {
                          ...data.presidentsCup!,
                          travelDays: e.target.value.split(',').map(d => d.trim())
                        }
                      })}
                      placeholder="Saturday, August 29, 2026, Sunday, September 6, 2026"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes">
              <Card className="p-4">
                <Label className="text-xs">Important Notes</Label>
                <Textarea
                  value={data.notes || ''}
                  onChange={(e) => updateData({ ...data, notes: e.target.value })}
                  placeholder="Dates for Playoffs and Provincials may be subject to change..."
                  rows={4}
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
            <SeasonInfoDisplay data={data} />
          </div>
        </div>
      )}
    </div>
  );
}