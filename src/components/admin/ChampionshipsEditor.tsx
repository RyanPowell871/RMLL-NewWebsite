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

interface ChampionshipsEditorProps {
  value: string;
  onChange: (value: string) => void;
  divisionName: string;
}

export function ChampionshipsEditor({ value, onChange, divisionName }: ChampionshipsEditorProps) {
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
      console.error('Error parsing championships JSON:', err);
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
  "provincial": {
    "title": "Provincial Championships",
    "description": "Optional description",
    "trophy": { "name": "...", "description": "..." },
    "results": [{ "year": "2025", "gold": "...", "silver": "...", "bronze": "..." }]
  },
  "national": {
    "title": "National Championships",
    "description": "Optional description",
    "trophy": { "name": "...", "description": "..." },
    "results": [{ "year": "2025", "gold": "..." }]
  },
  "north": {
    "conferenceName": "Jim Andrews Conference",
    "champions": [{ "year": "2025", "team": "..." }]
  },
  "south": {
    "conferenceName": "Cindy Garant Conference",
    "champions": [{ "year": "2025", "team": "..." }]
  }
}`}
          </pre>
        </div>
      </div>
    );
  }

  // Visual Editor
  // Get available championship types from data
  const dataKeys = Object.keys(data).filter(key => key !== '__typename');

  // Determine default tab based on available data
  const defaultTab = dataKeys.length > 0 ? dataKeys[0] : 'provincial';

  // Helper to get tab label from key
  const getTabLabel = (key: string): string => {
    switch (key) {
      case 'provincial': return 'Provincial';
      case 'national': return 'National';
      case 'north': return 'North Conference';
      case 'south': return 'South Conference';
      default: return key.charAt(0).toUpperCase() + key.slice(1);
    }
  };

  // Helper to get tab description from key
  const getTabDescription = (key: string): string => {
    switch (key) {
      case 'provincial': return 'ALA Provincial Championship information';
      case 'national': return 'National Championship information';
      case 'north': return 'Championship history for the North Conference';
      case 'south': return 'Championship history for the South Conference';
      default: return 'Championship information';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline">Visual Editor</Badge>
        <Button onClick={() => setMode('json')} variant="outline" size="sm">
          <Code className="w-4 h-4 mr-2" />
          JSON Editor
        </Button>
      </div>

      {dataKeys.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No championships data found. Use the JSON Editor to add data, or it will be created automatically when you save.
          </AlertDescription>
        </Alert>
      )}

      {dataKeys.length > 0 && (
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${dataKeys.length}, 1fr)` }}>
            {dataKeys.map(key => (
              <TabsTrigger key={key} value={key}>
                {getTabLabel(key)}
              </TabsTrigger>
            ))}
          </TabsList>

          {dataKeys.map(key => (
            <TabsContent key={key} value={key} className="space-y-4">
              {(key === 'provincial' || key === 'national') && (
                <Card>
                  <CardHeader>
                    <CardTitle>{getTabLabel(key)} Championship</CardTitle>
                    <CardDescription>{getTabDescription(key)}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={data[key]?.title || ''}
                        onChange={(e) => updateNestedData([key, 'title'], e.target.value)}
                        placeholder={`${getTabLabel(key)} Championships`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={data[key]?.description || ''}
                        onChange={(e) => updateNestedData([key, 'description'], e.target.value)}
                        placeholder="Optional description..."
                        rows={2}
                      />
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <Label className="text-base font-semibold">Trophy Information</Label>
                      <div className="space-y-2">
                        <Label>Trophy Name</Label>
                        <Input
                          value={data[key]?.trophy?.name || ''}
                          onChange={(e) => updateNestedData([key, 'trophy', 'name'], e.target.value)}
                          placeholder="e.g., Carol Patterson Trophy"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Trophy Description</Label>
                        <Textarea
                          value={data[key]?.trophy?.description || ''}
                          onChange={(e) => updateNestedData([key, 'trophy', 'description'], e.target.value)}
                          placeholder="Trophy history and significance..."
                          rows={4}
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Championship Results</Label>
                        <Button
                          onClick={() => {
                            const results = data[key]?.results || [];
                            updateNestedData([key, 'results'], [
                              { year: '', gold: '', silver: '', bronze: '' },
                              ...results
                            ]);
                          }}
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Result
                        </Button>
                      </div>

                      {(data[key]?.results || []).length === 0 && (
                        <p className="text-sm text-gray-500 italic">No results added yet.</p>
                      )}

                      {(data[key]?.results || []).map((result: any, idx: number) => (
                        <Card key={idx} className="bg-gray-50">
                          <CardContent className="pt-6 space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge>Result {idx + 1}</Badge>
                              <Button
                                onClick={() => {
                                  const results = [...(data[key]?.results || [])];
                                  results.splice(idx, 1);
                                  updateNestedData([key, 'results'], results);
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
                                  value={result.year || ''}
                                  onChange={(e) => {
                                    const results = [...(data[key]?.results || [])];
                                    results[idx] = { ...results[idx], year: e.target.value };
                                    updateNestedData([key, 'results'], results);
                                  }}
                                  placeholder="2025"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Host (optional)</Label>
                                <Input
                                  value={result.host || ''}
                                  onChange={(e) => {
                                    const results = [...(data[key]?.results || [])];
                                    results[idx] = { ...results[idx], host: e.target.value };
                                    updateNestedData([key, 'results'], results);
                                  }}
                                  placeholder="Team name"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Gold (Champion)</Label>
                              <Input
                                value={result.gold || ''}
                                onChange={(e) => {
                                  const results = [...(data[key]?.results || [])];
                                  results[idx] = { ...results[idx], gold: e.target.value };
                                  updateNestedData([key, 'results'], results);
                                }}
                                placeholder="Team name"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Silver (Runner-up)</Label>
                              <Input
                                value={result.silver || ''}
                                onChange={(e) => {
                                  const results = [...(data[key]?.results || [])];
                                  results[idx] = { ...results[idx], silver: e.target.value };
                                  updateNestedData([key, 'results'], results);
                                }}
                                placeholder="Team name"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Bronze (optional)</Label>
                              <Input
                                value={result.bronze || ''}
                                onChange={(e) => {
                                  const results = [...(data[key]?.results || [])];
                                  results[idx] = { ...results[idx], bronze: e.target.value };
                                  updateNestedData([key, 'results'], results);
                                }}
                                placeholder="Team name"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {(key === 'north' || key === 'south') && (
                <Card>
                  <CardHeader>
                    <CardTitle>{getTabLabel(key)} Champions</CardTitle>
                    <CardDescription>{getTabDescription(key)}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Conference Name</Label>
                      <Input
                        value={data[key]?.conferenceName || ''}
                        onChange={(e) => updateNestedData([key, 'conferenceName'], e.target.value)}
                        placeholder={key === 'north' ? "e.g., Jim Andrews Conference" : "e.g., Cindy Garant Conference"}
                      />
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Conference Champions</Label>
                        <Button
                          onClick={() => {
                            const champions = data[key]?.champions || [];
                            updateNestedData([key, 'champions'], [
                              { year: '', team: '' },
                              ...champions
                            ]);
                          }}
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Champion
                        </Button>
                      </div>

                      {(data[key]?.champions || []).length === 0 && (
                        <p className="text-sm text-gray-500 italic">No champions added yet.</p>
                      )}

                      <div className="grid gap-2">
                        {(data[key]?.champions || []).map((champion: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <Input
                              value={champion.year || ''}
                              onChange={(e) => {
                                const champions = [...(data[key]?.champions || [])];
                                champions[idx] = { ...champions[idx], year: e.target.value };
                                updateNestedData([key, 'champions'], champions);
                              }}
                              placeholder="Year"
                              className="w-24"
                            />
                            <Input
                              value={champion.team || ''}
                              onChange={(e) => {
                                const champions = [...(data[key]?.champions || [])];
                                champions[idx] = { ...champions[idx], team: e.target.value };
                                updateNestedData([key, 'champions'], champions);
                              }}
                              placeholder="Team name"
                              className="flex-1"
                            />
                            <Button
                              onClick={() => {
                                const champions = [...(data[key]?.champions || [])];
                                champions.splice(idx, 1);
                                updateNestedData([key, 'champions'], champions);
                              }}
                              variant="ghost"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
