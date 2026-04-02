import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Plus, Trash2, AlertCircle, Code, Eye, ChevronUp, ChevronDown, Edit2, Check, X } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { TextareaWithLinkInserter } from './TextareaWithLinkInserter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface AwardsEditorProps {
  value: string;
  onChange: (value: string) => void;
  divisionName: string;
}

interface AwardSection {
  key: string;
  label: string;
  description: string;
  type: 'pointLeaders' | 'divisionAwards' | 'tournaments' | 'conference';
  path: string[]; // Path to the data (e.g., ['pointLeaders'] or ['division', 'north'])
}

// Data structure types
interface PointLeader {
  year: string;
  player: string;
  team: string;
  stats: string;
  points?: number;
  games?: number;
  conference?: string;
  note?: string;
}

interface DivisionAward {
  name: string;
  description?: string;
  recipients?: Array<{
    year: string;
    player: string;
    team: string;
    conference?: string;
  }>;
}

interface TournamentEvent {
  year: string;
  name: string;
  trophy: string;
  result: string;
}

export function AwardsEditor({ value, onChange, divisionName }: AwardsEditorProps) {
  const [mode, setMode] = useState<'visual' | 'json'>('visual');
  const [data, setData] = useState<any>({});
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState(value || '{}');
  const [editingHeading, setEditingHeading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('main');

  // Parse JSON on mount and when value changes from outside
  useEffect(() => {
    try {
      if (value && typeof value === 'string' && value.trim()) {
        const parsed = JSON.parse(value);
        setData(parsed);
        setJsonText(JSON.stringify(parsed, null, 2));
        setJsonError(null);
      } else {
        setData({});
        setJsonText('{}');
      }
    } catch (err) {
      console.error('Error parsing awards JSON:', err);
      setJsonError('Invalid JSON format');
      setJsonText(typeof value === 'string' ? value : '{}');
    }
  }, [value]);

  const handleJsonChange = (newJson: string) => {
    setJsonText(newJson);
    try {
      const parsed = JSON.parse(newJson);
      setData(parsed);
      setJsonError(null);
      onChange(newJson);
    } catch (err) {
      setJsonError('Invalid JSON format');
    }
  };

  const handleDataChange = (newData: any) => {
    setData(newData);
    const jsonString = JSON.stringify(newData, null, 2);
    setJsonText(jsonString);
    onChange(jsonString);
  };

  // Helper to safely update nested data
  const updateNestedData = (path: string[], value: any) => {
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) current[path[i]] = {};
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    handleDataChange(newData);
  };

  // Get value from nested path
  const getNestedValue = (path: string[]) => {
    let current = data;
    for (const key of path) {
      if (!current) return undefined;
      current = current[key];
    }
    return current;
  };

  // Determine available sections based on data structure
  const getSections = (): AwardSection[] => {
    const sections: AwardSection[] = [];

    // Check for conference-based structure (Tier II)
    if (data.north || data.south) {
      setActiveTab(data.north ? 'north' : 'south');
      if (data.north) {
        sections.push({
          key: 'north',
          label: 'North Conference',
          description: 'North conference awards and point leaders',
          type: 'conference',
          path: ['north']
        });
      }
      if (data.south) {
        sections.push({
          key: 'south',
          label: 'South Conference',
          description: 'South conference awards and point leaders',
          type: 'conference',
          path: ['south']
        });
      }
      return sections;
    }

    // Standard structure - point leaders
    if (data.pointLeaders) {
      sections.push({
        key: 'pointLeaders',
        label: 'Point Leaders',
        description: 'Division point leaders by year',
        type: 'pointLeaders',
        path: ['pointLeaders']
      });
    }

    // Division awards (array format)
    if (data.divisionAwards?.awards || data.divisionAwards?.categories) {
      sections.push({
        key: 'divisionAwards',
        label: 'Division Awards',
        description: 'Annual division awards',
        type: 'divisionAwards',
        path: ['divisionAwards']
      });
    }

    // Tournaments
    if (data.tournaments?.events) {
      sections.push({
        key: 'tournaments',
        label: 'Tournaments',
        description: 'Tournament results and events',
        type: 'tournaments',
        path: ['tournaments']
      });
    }

    return sections;
  };

  const sections = getSections();

  // Reorder items
  const moveItem = (path: string[], itemKey: string, idx: number, direction: 'up' | 'down') => {
    const items = [...(getNestedValue([...path, itemKey]) || [])];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;

    if (targetIdx < 0 || targetIdx >= items.length) return;

    const temp = items[idx];
    items[idx] = items[targetIdx];
    items[targetIdx] = temp;

    updateNestedData([...path, itemKey], items);
  };

  // Remove item
  const removeItem = (path: string[], itemKey: string, idx: number) => {
    const items = [...(getNestedValue([...path, itemKey]) || [])];
    items.splice(idx, 1);
    updateNestedData([...path, itemKey], items);
  };

  // Add point leader
  const addPointLeader = (path: string[]) => {
    const recipients = getNestedValue([...path, 'recipients']) || [];
    updateNestedData([...path, 'recipients'], [
      { year: '', player: '', team: '', stats: '', points: 0, games: 0, conference: '' },
      ...recipients
    ]);
  };

  // Update point leader field
  const updatePointLeader = (path: string[], idx: number, field: string, value: any) => {
    const recipients = [...(getNestedValue([...path, 'recipients']) || [])];
    recipients[idx] = { ...recipients[idx], [field]: value };
    updateNestedData([...path, 'recipients'], recipients);
  };

  // Add division award
  const addDivisionAward = (path: string[]) => {
    const awards = getNestedValue([...path, 'awards']) || [];
    updateNestedData([...path, 'awards'], [
      { name: '', recipients: [] },
      ...awards
    ]);
  };

  // Add recipient to division award
  const addDivisionAwardRecipient = (path: string[], awardIdx: number) => {
    const awards = [...(getNestedValue(path) || [])];
    const recipients = awards[awardIdx]?.recipients || [];
    awards[awardIdx] = {
      ...awards[awardIdx],
      recipients: [{ year: '', player: '', team: '', conference: '' }, ...recipients]
    };
    updateNestedData(path, awards);
  };

  // Update division award
  const updateDivisionAward = (path: string[], awardIdx: number, field: string, value: any) => {
    const awards = [...(getNestedValue(path) || [])];
    awards[awardIdx] = { ...awards[awardIdx], [field]: value };
    updateNestedData(path, awards);
  };

  // Update division award recipient
  const updateDivisionAwardRecipient = (path: string[], awardIdx: number, recipientIdx: number, field: string, value: any) => {
    const awards = [...(getNestedValue(path) || [])];
    const recipients = [...(awards[awardIdx]?.recipients || [])];
    recipients[recipientIdx] = { ...recipients[recipientIdx], [field]: value };
    awards[awardIdx] = { ...awards[awardIdx], recipients };
    updateNestedData(path, awards);
  };

  // Remove division award
  const removeDivisionAward = (path: string[], awardIdx: number) => {
    const awards = [...(getNestedValue(path) || [])];
    awards.splice(awardIdx, 1);
    updateNestedData(path, awards);
  };

  // Remove division award recipient
  const removeDivisionAwardRecipient = (path: string[], awardIdx: number, recipientIdx: number) => {
    const awards = [...(getNestedData(path) || [])];
    const recipients = [...(awards[awardIdx]?.recipients || [])];
    recipients.splice(recipientIdx, 1);
    awards[awardIdx] = { ...awards[awardIdx], recipients };
    updateNestedData(path, awards);
  };

  // Add tournament event
  const addTournamentEvent = (path: string[]) => {
    const events = getNestedValue([...path, 'events']) || [];
    updateNestedData([...path, 'events'], [
      { year: '', name: '', trophy: '', result: '' },
      ...events
    ]);
  };

  // Update tournament event
  const updateTournamentEvent = (path: string[], idx: number, field: string, value: any) => {
    const events = [...(getNestedValue([...path, 'events']) || [])];
    events[idx] = { ...events[idx], [field]: value };
    updateNestedData([...path, 'events'], events);
  };

  if (mode === 'json') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">JSON Editor</Badge>
            {jsonError && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Invalid JSON
              </Badge>
            )}
          </div>
          <Button onClick={() => setMode('visual')} variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Visual Editor
          </Button>
        </div>

        {jsonError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{jsonError}</AlertDescription>
          </Alert>
        )}

        <Textarea
          value={jsonText}
          onChange={(e) => handleJsonChange(e.target.value)}
          rows={25}
          className="font-mono text-sm"
          placeholder="Enter JSON data..."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Visual Editor</Badge>
          <Badge variant="secondary">{divisionName}</Badge>
        </div>
        <Button onClick={() => setMode('json')} variant="outline" size="sm">
          <Code className="w-4 h-4 mr-2" />
          JSON Editor
        </Button>
      </div>

      {sections.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No awards data found. Use the JSON Editor to add award data.
          </AlertDescription>
        </Alert>
      )}

      {sections.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
            {sections.map(section => (
              <TabsTrigger key={section.key} value={section.key}>
                {section.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {sections.map(section => {
            const sectionData = getNestedValue(section.path) || {};

            return (
              <TabsContent key={section.key} value={section.key} className="space-y-4">
                {/* Point Leaders Section */}
                {section.type === 'pointLeaders' && (
                  <>
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            {editingHeading === section.key ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={sectionData.title || ''}
                                  onChange={(e) => updateNestedData([...section.path, 'title'], e.target.value)}
                                  placeholder="Custom heading"
                                  className="h-8 w-64"
                                />
                                <Button onClick={() => setEditingHeading(null)} size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  <Check className="w-4 h-4 text-green-600" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <CardTitle>{sectionData.title || 'Point Leaders'}</CardTitle>
                                <CardDescription>{sectionData.description}</CardDescription>
                              </>
                            )}
                          </div>
                          <Button onClick={() => setEditingHeading(section.key)} size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Edit2 className="w-4 h-4 text-gray-500" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <TextareaWithLinkInserter
                          id={`${section.key}-description`}
                          label="Description"
                          value={sectionData.description || ''}
                          onChange={(value) => updateNestedData([...section.path, 'description'], value)}
                          rows={2}
                          placeholder="Description of the point leader award..."
                        />
                        {sectionData.note && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            {sectionData.note}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">Point Leaders</Label>
                          <Button onClick={() => addPointLeader(section.path)} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Point Leader
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {(sectionData.recipients || []).length === 0 && (
                          <p className="text-sm text-gray-500 italic">No point leaders added yet.</p>
                        )}
                        {(sectionData.recipients || []).map((recipient: PointLeader, idx: number) => (
                          <div key={idx} className="bg-gray-50 border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge>{recipient.year || 'New Entry'}</Badge>
                              <div className="flex items-center gap-1">
                                {idx > 0 && (
                                  <Button onClick={() => moveItem(section.path, 'recipients', idx, 'up')} variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <ChevronUp className="w-3 h-3" />
                                  </Button>
                                )}
                                {idx < (sectionData.recipients || []).length - 1 && (
                                  <Button onClick={() => moveItem(section.path, 'recipients', idx, 'down')} variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <ChevronDown className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button onClick={() => removeItem(section.path, 'recipients', idx)} variant="ghost" size="sm">
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Year</Label>
                                <Input value={recipient.year || ''} onChange={(e) => updatePointLeader(section.path, idx, 'year', e.target.value)} placeholder="2025" />
                              </div>
                              <div>
                                <Label className="text-xs">Conference (optional)</Label>
                                <Input value={recipient.conference || ''} onChange={(e) => updatePointLeader(section.path, idx, 'conference', e.target.value)} placeholder="North" />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Player</Label>
                              <Input value={recipient.player || ''} onChange={(e) => updatePointLeader(section.path, idx, 'player', e.target.value)} placeholder="#17 John Doe" />
                            </div>
                            <div>
                              <Label className="text-xs">Team</Label>
                              <Input value={recipient.team || ''} onChange={(e) => updatePointLeader(section.path, idx, 'team', e.target.value)} placeholder="Team Name" />
                            </div>
                            <div>
                              <Label className="text-xs">Stats</Label>
                              <Input value={recipient.stats || ''} onChange={(e) => updatePointLeader(section.path, idx, 'stats', e.target.value)} placeholder="46 goals; 54 assists" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Points</Label>
                                <Input type="number" value={recipient.points || ''} onChange={(e) => updatePointLeader(section.path, idx, 'points', e.target.value ? parseInt(e.target.value) || 0 : 0)} placeholder="100" />
                              </div>
                              <div>
                                <Label className="text-xs">Games</Label>
                                <Input type="number" value={recipient.games || ''} onChange={(e) => updatePointLeader(section.path, idx, 'games', e.target.value ? parseInt(e.target.value) || 0 : 0)} placeholder="16" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Division Awards Section */}
                {section.type === 'divisionAwards' && (
                  <>
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            {editingHeading === section.key ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={sectionData.title || ''}
                                  onChange={(e) => updateNestedData([...section.path, 'title'], e.target.value)}
                                  placeholder="Custom heading"
                                  className="h-8 w-64"
                                />
                                <Button onClick={() => setEditingHeading(null)} size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  <Check className="w-4 h-4 text-green-600" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <CardTitle>{sectionData.title || 'Division Awards'}</CardTitle>
                                <CardDescription>{sectionData.description}</CardDescription>
                              </>
                            )}
                          </div>
                          <Button onClick={() => setEditingHeading(section.key)} size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Edit2 className="w-4 h-4 text-gray-500" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <TextareaWithLinkInserter
                          id={`${section.key}-description`}
                          label="Description"
                          value={sectionData.description || ''}
                          onChange={(value) => updateNestedData([...section.path, 'description'], value)}
                          rows={2}
                          placeholder="Description of division awards..."
                        />
                      </CardContent>
                    </Card>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Award Categories</Label>
                        <Button onClick={() => addDivisionAward(section.path)} size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Award
                        </Button>
                      </div>

                      {(sectionData.awards || sectionData.categories || []).length === 0 && (
                        <p className="text-sm text-gray-500 italic">No awards added yet.</p>
                      )}

                      {(sectionData.awards || sectionData.categories || []).map((award: DivisionAward, awardIdx: number) => (
                        <Card key={awardIdx} className="border-l-4 border-l-[#013fac]">
                          <CardHeader className="py-3">
                            <div className="flex items-center justify-between">
                              <Input
                                value={award.name || ''}
                                onChange={(e) => updateDivisionAward([...section.path, 'awards'], awardIdx, 'name', e.target.value)}
                                placeholder="Award Name (e.g., Offensive Player of the Year)"
                                className="font-semibold"
                              />
                              <Button onClick={() => removeDivisionAward([...section.path, 'awards'], awardIdx)} variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <TextareaWithLinkInserter
                              id={`${section.key}-${awardIdx}-desc`}
                              label="Award Description (optional)"
                              value={award.description || ''}
                              onChange={(value) => updateDivisionAward([...section.path, 'awards'], awardIdx, 'description', value)}
                              rows={1}
                              placeholder="Description of this award..."
                            />

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-sm font-medium">Recipients</Label>
                                <Button onClick={() => addDivisionAwardRecipient([...section.path, 'awards'], awardIdx)} size="sm" variant="outline">
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add
                                </Button>
                              </div>
                              {(award.recipients || []).length === 0 && (
                                <p className="text-xs text-gray-500 italic">No recipients added yet.</p>
                              )}
                              <div className="space-y-2">
                                {(award.recipients || []).map((recipient: any, recipientIdx: number) => (
                                  <div key={recipientIdx} className="flex items-center gap-2 bg-gray-50 rounded p-2">
                                    <Input
                                      value={recipient.year || ''}
                                      onChange={(e) => updateDivisionAwardRecipient([...section.path, 'awards'], awardIdx, recipientIdx, 'year', e.target.value)}
                                      placeholder="Year"
                                      className="w-20 text-xs"
                                    />
                                    <Input
                                      value={recipient.player || ''}
                                      onChange={(e) => updateDivisionAwardRecipient([...section.path, 'awards'], awardIdx, recipientIdx, 'player', e.target.value)}
                                      placeholder="Player"
                                      className="flex-1 text-xs"
                                    />
                                    <Input
                                      value={recipient.team || ''}
                                      onChange={(e) => updateDivisionAwardRecipient([...section.path, 'awards'], awardIdx, recipientIdx, 'team', e.target.value)}
                                      placeholder="Team"
                                      className="flex-1 text-xs"
                                    />
                                    <Input
                                      value={recipient.conference || ''}
                                      onChange={(e) => updateDivisionAwardRecipient([...section.path, 'awards'], awardIdx, recipientIdx, 'conference', e.target.value)}
                                      placeholder="Conference"
                                      className="w-20 text-xs"
                                    />
                                    <Button onClick={() => removeDivisionAwardRecipient([...section.path, 'awards'], awardIdx, recipientIdx)} variant="ghost" size="sm" className="h-7 w-7 p-0">
                                      <X className="w-3 h-3 text-red-600" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}

                {/* Tournaments Section */}
                {section.type === 'tournaments' && (
                  <>
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            {editingHeading === section.key ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={sectionData.title || ''}
                                  onChange={(e) => updateNestedData([...section.path, 'title'], e.target.value)}
                                  placeholder="Custom heading"
                                  className="h-8 w-64"
                                />
                                <Button onClick={() => setEditingHeading(null)} size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  <Check className="w-4 h-4 text-green-600" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <CardTitle>{sectionData.title || 'Tournaments'}</CardTitle>
                                <CardDescription>{sectionData.description}</CardDescription>
                              </>
                            )}
                          </div>
                          <Button onClick={() => setEditingHeading(section.key)} size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Edit2 className="w-4 h-4 text-gray-500" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <TextareaWithLinkInserter
                          id={`${section.key}-description`}
                          label="Description"
                          value={sectionData.description || ''}
                          onChange={(value) => updateNestedData([...section.path, 'description'], value)}
                          rows={2}
                          placeholder="Tournament description..."
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">Tournament Events</Label>
                          <Button onClick={() => addTournamentEvent(section.path)} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Event
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {(sectionData.events || []).length === 0 && (
                          <p className="text-sm text-gray-500 italic">No tournament events added yet.</p>
                        )}
                        {(sectionData.events || []).map((event: TournamentEvent, idx: number) => (
                          <div key={idx} className="bg-gray-50 border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge>{event.year || 'New Event'}</Badge>
                              <div className="flex items-center gap-1">
                                {idx > 0 && (
                                  <Button onClick={() => moveItem(section.path, 'events', idx, 'up')} variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <ChevronUp className="w-3 h-3" />
                                  </Button>
                                )}
                                {idx < (sectionData.events || []).length - 1 && (
                                  <Button onClick={() => moveItem(section.path, 'events', idx, 'down')} variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <ChevronDown className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button onClick={() => removeItem(section.path, 'events', idx)} variant="ghost" size="sm">
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Year</Label>
                              <Input value={event.year || ''} onChange={(e) => updateTournamentEvent(section.path, idx, 'year', e.target.value)} placeholder="2025" />
                            </div>
                            <div>
                              <Label className="text-xs">Tournament Name</Label>
                              <Input value={event.name || ''} onChange={(e) => updateTournamentEvent(section.path, idx, 'name', e.target.value)} placeholder="West Coast Senior C Lacrosse Tournament" />
                            </div>
                            <div>
                              <Label className="text-xs">Trophy</Label>
                              <Input value={event.trophy || ''} onChange={(e) => updateTournamentEvent(section.path, idx, 'trophy', e.target.value)} placeholder="Treasure Cove Cup" />
                            </div>
                            <div>
                              <Label className="text-xs">Result</Label>
                              <Input value={event.result || ''} onChange={(e) => updateTournamentEvent(section.path, idx, 'result', e.target.value)} placeholder="Red Deer Silverbacks – Silver Medal" />
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Conference Section (Tier II style) */}
                {section.type === 'conference' && (
                  <div className="space-y-4">
                    {/* Point Leaders */}
                    {sectionData.pointLeaders && (
                      <>
                        <Card>
                          <CardHeader>
                            <CardTitle>{sectionData.pointLeaders.title || 'Point Leaders'}</CardTitle>
                            <CardDescription>{sectionData.pointLeaders.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between mb-3">
                              <Label className="text-base font-semibold">Point Leaders</Label>
                              <Button onClick={() => addPointLeader(section.path)} size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Point Leader
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {(sectionData.pointLeaders.recipients || []).map((recipient: PointLeader, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded p-2">
                                  <Input value={recipient.year || ''} onChange={(e) => updatePointLeader(section.path, idx, 'year', e.target.value)} placeholder="Year" className="w-16 text-xs" />
                                  <Input value={recipient.player || ''} onChange={(e) => updatePointLeader(section.path, idx, 'player', e.target.value)} placeholder="Player" className="flex-1 text-xs" />
                                  <Input value={recipient.team || ''} onChange={(e) => updatePointLeader(section.path, idx, 'team', e.target.value)} placeholder="Team" className="flex-1 text-xs" />
                                  <Input value={recipient.stats || ''} onChange={(e) => updatePointLeader(section.path, idx, 'stats', e.target.value)} placeholder="Stats" className="flex-1 text-xs" />
                                  <Button onClick={() => removeItem(section.path, 'recipients', idx)} variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <X className="w-3 h-3 text-red-600" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}

                    {/* Division Awards */}
                    {sectionData.divisionAwards?.awards && (
                      <>
                        <Card>
                          <CardHeader>
                            <CardTitle>{sectionData.divisionAwards.title || 'Division Awards'}</CardTitle>
                            <CardDescription>{sectionData.divisionAwards.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {(sectionData.divisionAwards.awards || []).map((award: DivisionAward, awardIdx: number) => (
                                <div key={awardIdx} className="border rounded p-3 space-y-2">
                                  <Input
                                    value={award.name || ''}
                                    onChange={(e) => updateDivisionAward([...section.path, 'divisionAwards', 'awards'], awardIdx, 'name', e.target.value)}
                                    placeholder="Award Name"
                                    className="font-medium"
                                  />
                                  <div className="space-y-1">
                                    <Label className="text-xs">Recipients</Label>
                                    {(award.recipients || []).map((recipient: any, recipientIdx: number) => (
                                      <div key={recipientIdx} className="flex items-center gap-2">
                                        <Input
                                          value={recipient.year || ''}
                                          onChange={(e) => updateDivisionAwardRecipient([...section.path, 'divisionAwards', 'awards'], awardIdx, recipientIdx, 'year', e.target.value)}
                                          placeholder="Year"
                                          className="w-16 text-xs"
                                        />
                                        <Input
                                          value={recipient.player || ''}
                                          onChange={(e) => updateDivisionAwardRecipient([...section.path, 'divisionAwards', 'awards'], awardIdx, recipientIdx, 'player', e.target.value)}
                                          placeholder="Player"
                                          className="flex-1 text-xs"
                                        />
                                        <Input
                                          value={recipient.team || ''}
                                          onChange={(e) => updateDivisionAwardRecipient([...section.path, 'divisionAwards', 'awards'], awardIdx, recipientIdx, 'team', e.target.value)}
                                          placeholder="Team"
                                          className="flex-1 text-xs"
                                        />
                                        <Button onClick={() => removeDivisionAwardRecipient([...section.path, 'divisionAwards', 'awards'], awardIdx, recipientIdx)} variant="ghost" size="sm" className="h-6 w-6 p-0">
                                          <X className="w-3 h-3 text-red-600" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}