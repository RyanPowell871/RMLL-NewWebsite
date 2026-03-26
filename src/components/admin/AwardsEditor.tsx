import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Plus, Trash2, AlertCircle, Code, Eye } from 'lucide-react';
import { Textarea } from '../ui/textarea';

interface AwardsEditorProps {
  value: string;
  onChange: (value: string) => void;
  divisionName: string;
}

export function AwardsEditor({ value, onChange, divisionName }: AwardsEditorProps) {
  const [mode, setMode] = useState<'visual' | 'json'>('visual');
  const [data, setData] = useState<any>({});
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState(value || '{}');

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

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Expected structure:</strong></p>
          <pre className="bg-gray-50 p-2 rounded border overflow-x-auto">
{`{
  "north": {
    "conferenceName": "Jim Andrews Conference",
    "pointLeaders": {
      "title": "Award Title",
      "recipients": [
        { "year": "2025", "player": "#17 Name", "team": "...", "stats": "...", "points": 100, "games": 16 }
      ]
    },
    "allStarTeams": {
      "title": "All-Star Teams Title",
      "firstTeam": { "title": "...", "year": "2025", "players": [...] },
      "secondTeam": { "title": "...", "year": "2025", "players": [...] }
    }
  },
  "south": { ... same structure ... }
}`}
          </pre>
        </div>
      </div>
    );
  }

  // Visual Editor
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline">Visual Editor</Badge>
        <Button onClick={() => setMode('json')} variant="outline" size="sm">
          <Code className="w-4 h-4 mr-2" />
          JSON Editor
        </Button>
      </div>

      {Object.keys(data).length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No awards data found. Use the JSON Editor to add data, or it will be created automatically when you save.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="north" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="north">North Conference</TabsTrigger>
          <TabsTrigger value="south">South Conference</TabsTrigger>
        </TabsList>

        {/* North Conference */}
        <TabsContent value="north" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>North Conference Awards</CardTitle>
              <CardDescription>Awards and honors for the North Conference</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Conference Name</Label>
                <Input
                  value={data.north?.conferenceName || ''}
                  onChange={(e) => updateNestedData(['north', 'conferenceName'], e.target.value)}
                  placeholder="e.g., Jim Andrews Conference"
                />
              </div>

              {/* Point Leaders */}
              <div className="border-t pt-4 space-y-4">
                <Label className="text-base font-semibold">Point Leaders Award</Label>
                
                <div className="space-y-2">
                  <Label>Award Title</Label>
                  <Input
                    value={data.north?.pointLeaders?.title || ''}
                    onChange={(e) => updateNestedData(['north', 'pointLeaders', 'title'], e.target.value)}
                    placeholder="e.g., Dave Nyhuis Award – Regular Season Point Leader"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Recipients</Label>
                    <Button
                      onClick={() => {
                        const recipients = data.north?.pointLeaders?.recipients || [];
                        updateNestedData(['north', 'pointLeaders', 'recipients'], [
                          { year: '', player: '', team: '', stats: '', points: 0, games: 0 },
                          ...recipients
                        ]);
                      }}
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Recipient
                    </Button>
                  </div>

                  {(data.north?.pointLeaders?.recipients || []).length === 0 && (
                    <p className="text-sm text-gray-500 italic">No recipients added yet.</p>
                  )}

                  {(data.north?.pointLeaders?.recipients || []).map((recipient: any, idx: number) => (
                    <Card key={idx} className="bg-gray-50">
                      <CardContent className="pt-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge>Recipient {idx + 1}</Badge>
                          <Button
                            onClick={() => {
                              const recipients = [...(data.north?.pointLeaders?.recipients || [])];
                              recipients.splice(idx, 1);
                              updateNestedData(['north', 'pointLeaders', 'recipients'], recipients);
                            }}
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Year</Label>
                            <Input
                              value={recipient.year || ''}
                              onChange={(e) => {
                                const recipients = [...(data.north?.pointLeaders?.recipients || [])];
                                recipients[idx] = { ...recipients[idx], year: e.target.value };
                                updateNestedData(['north', 'pointLeaders', 'recipients'], recipients);
                              }}
                              placeholder="2025"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Player (with #)</Label>
                            <Input
                              value={recipient.player || ''}
                              onChange={(e) => {
                                const recipients = [...(data.north?.pointLeaders?.recipients || [])];
                                recipients[idx] = { ...recipients[idx], player: e.target.value };
                                updateNestedData(['north', 'pointLeaders', 'recipients'], recipients);
                              }}
                              placeholder="#17 John Doe"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Team</Label>
                          <Input
                            value={recipient.team || ''}
                            onChange={(e) => {
                              const recipients = [...(data.north?.pointLeaders?.recipients || [])];
                              recipients[idx] = { ...recipients[idx], team: e.target.value };
                              updateNestedData(['north', 'pointLeaders', 'recipients'], recipients);
                            }}
                            placeholder="Team name"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Stats</Label>
                          <Input
                            value={recipient.stats || ''}
                            onChange={(e) => {
                              const recipients = [...(data.north?.pointLeaders?.recipients || [])];
                              recipients[idx] = { ...recipients[idx], stats: e.target.value };
                              updateNestedData(['north', 'pointLeaders', 'recipients'], recipients);
                            }}
                            placeholder="46 goals; 54 assists"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Points</Label>
                            <Input
                              type="number"
                              value={recipient.points || ''}
                              onChange={(e) => {
                                const recipients = [...(data.north?.pointLeaders?.recipients || [])];
                                recipients[idx] = { ...recipients[idx], points: parseInt(e.target.value) || 0 };
                                updateNestedData(['north', 'pointLeaders', 'recipients'], recipients);
                              }}
                              placeholder="100"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Games</Label>
                            <Input
                              type="number"
                              value={recipient.games || ''}
                              onChange={(e) => {
                                const recipients = [...(data.north?.pointLeaders?.recipients || [])];
                                recipients[idx] = { ...recipients[idx], games: parseInt(e.target.value) || 0 };
                                updateNestedData(['north', 'pointLeaders', 'recipients'], recipients);
                              }}
                              placeholder="16"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Note (optional)</Label>
                          <Input
                            value={recipient.note || ''}
                            onChange={(e) => {
                              const recipients = [...(data.north?.pointLeaders?.recipients || [])];
                              recipients[idx] = { ...recipients[idx], note: e.target.value };
                              updateNestedData(['north', 'pointLeaders', 'recipients'], recipients);
                            }}
                            placeholder="e.g., North Central Division"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* All-Star Teams */}
              <div className="border-t pt-4 space-y-4">
                <Label className="text-base font-semibold">All-Star Teams</Label>
                
                <div className="space-y-2">
                  <Label>All-Star Teams Title</Label>
                  <Input
                    value={data.north?.allStarTeams?.title || ''}
                    onChange={(e) => updateNestedData(['north', 'allStarTeams', 'title'], e.target.value)}
                    placeholder="e.g., Jim Andrews All-Star Teams"
                  />
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    For complex All-Star Teams data (First Team, Second Team, players, positions), please use the JSON Editor for easier editing.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* South Conference */}
        <TabsContent value="south" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>South Conference Awards</CardTitle>
              <CardDescription>Awards and honors for the South Conference</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Conference Name</Label>
                <Input
                  value={data.south?.conferenceName || ''}
                  onChange={(e) => updateNestedData(['south', 'conferenceName'], e.target.value)}
                  placeholder="e.g., Cindy Garant Conference"
                />
              </div>

              {/* Point Leaders */}
              <div className="border-t pt-4 space-y-4">
                <Label className="text-base font-semibold">Point Leaders Award</Label>
                
                <div className="space-y-2">
                  <Label>Award Title</Label>
                  <Input
                    value={data.south?.pointLeaders?.title || ''}
                    onChange={(e) => updateNestedData(['south', 'pointLeaders', 'title'], e.target.value)}
                    placeholder="e.g., Jim Lovgren Award – Regular Season Point Leader"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Recipients</Label>
                    <Button
                      onClick={() => {
                        const recipients = data.south?.pointLeaders?.recipients || [];
                        updateNestedData(['south', 'pointLeaders', 'recipients'], [
                          { year: '', player: '', team: '', stats: '', points: 0, games: 0 },
                          ...recipients
                        ]);
                      }}
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Recipient
                    </Button>
                  </div>

                  {(data.south?.pointLeaders?.recipients || []).length === 0 && (
                    <p className="text-sm text-gray-500 italic">No recipients added yet.</p>
                  )}

                  {(data.south?.pointLeaders?.recipients || []).map((recipient: any, idx: number) => (
                    <Card key={idx} className="bg-gray-50">
                      <CardContent className="pt-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge>Recipient {idx + 1}</Badge>
                          <Button
                            onClick={() => {
                              const recipients = [...(data.south?.pointLeaders?.recipients || [])];
                              recipients.splice(idx, 1);
                              updateNestedData(['south', 'pointLeaders', 'recipients'], recipients);
                            }}
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Year</Label>
                            <Input
                              value={recipient.year || ''}
                              onChange={(e) => {
                                const recipients = [...(data.south?.pointLeaders?.recipients || [])];
                                recipients[idx] = { ...recipients[idx], year: e.target.value };
                                updateNestedData(['south', 'pointLeaders', 'recipients'], recipients);
                              }}
                              placeholder="2025"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Player (with #)</Label>
                            <Input
                              value={recipient.player || ''}
                              onChange={(e) => {
                                const recipients = [...(data.south?.pointLeaders?.recipients || [])];
                                recipients[idx] = { ...recipients[idx], player: e.target.value };
                                updateNestedData(['south', 'pointLeaders', 'recipients'], recipients);
                              }}
                              placeholder="#11 Jane Smith"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Team</Label>
                          <Input
                            value={recipient.team || ''}
                            onChange={(e) => {
                              const recipients = [...(data.south?.pointLeaders?.recipients || [])];
                              recipients[idx] = { ...recipients[idx], team: e.target.value };
                              updateNestedData(['south', 'pointLeaders', 'recipients'], recipients);
                            }}
                            placeholder="Team name"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Stats</Label>
                          <Input
                            value={recipient.stats || ''}
                            onChange={(e) => {
                              const recipients = [...(data.south?.pointLeaders?.recipients || [])];
                              recipients[idx] = { ...recipients[idx], stats: e.target.value };
                              updateNestedData(['south', 'pointLeaders', 'recipients'], recipients);
                            }}
                            placeholder="69 goals; 54 assists"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Points</Label>
                            <Input
                              type="number"
                              value={recipient.points || ''}
                              onChange={(e) => {
                                const recipients = [...(data.south?.pointLeaders?.recipients || [])];
                                recipients[idx] = { ...recipients[idx], points: parseInt(e.target.value) || 0 };
                                updateNestedData(['south', 'pointLeaders', 'recipients'], recipients);
                              }}
                              placeholder="123"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Games</Label>
                            <Input
                              type="number"
                              value={recipient.games || ''}
                              onChange={(e) => {
                                const recipients = [...(data.south?.pointLeaders?.recipients || [])];
                                recipients[idx] = { ...recipients[idx], games: parseInt(e.target.value) || 0 };
                                updateNestedData(['south', 'pointLeaders', 'recipients'], recipients);
                              }}
                              placeholder="15"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Note (optional)</Label>
                          <Input
                            value={recipient.note || ''}
                            onChange={(e) => {
                              const recipients = [...(data.south?.pointLeaders?.recipients || [])];
                              recipients[idx] = { ...recipients[idx], note: e.target.value };
                              updateNestedData(['south', 'pointLeaders', 'recipients'], recipients);
                            }}
                            placeholder="e.g., South Central Division"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* All-Star Teams */}
              <div className="border-t pt-4 space-y-4">
                <Label className="text-base font-semibold">All-Star Teams</Label>
                
                <div className="space-y-2">
                  <Label>All-Star Teams Title</Label>
                  <Input
                    value={data.south?.allStarTeams?.title || ''}
                    onChange={(e) => updateNestedData(['south', 'allStarTeams', 'title'], e.target.value)}
                    placeholder="e.g., Cindy Garant All-Star Teams"
                  />
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    For complex All-Star Teams data (First Team, Second Team, players, positions), please use the JSON Editor for easier editing.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
