import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Plus, Trash2, AlertCircle, Code, Eye, ChevronUp, ChevronDown, Edit2, Check, X } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { TextareaWithLinkInserter } from './TextareaWithLinkInserter';

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
  const [editingHeading, setEditingHeading] = useState<string | null>(null);

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

  // Get available championship types from data
  const dataKeys = Object.keys(data).filter(key => key !== '__metadata' && key !== '__typename');

  // Determine default tab based on available data
  const defaultTab = dataKeys.length > 0 ? dataKeys[0] : 'provincial';

  // Helper to get tab label from key
  const getTabLabel = (key: string): string => {
    const metadata = data.__metadata?.[key];
    if (metadata?.title) return metadata.title;
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
    const metadata = data.__metadata?.[key];
    if (metadata?.description) return metadata.description;
    switch (key) {
      case 'provincial': return 'ALA Provincial Championship information';
      case 'national': return 'National Championship information';
      case 'north': return 'Championship history for the North Conference';
      case 'south': return 'Championship history for the South Conference';
      default: return 'Championship information';
    }
  };

  // Update metadata
  const updateMetadata = (key: string, field: string, value: any) => {
    const metadata = data.__metadata || {};
    const keyMetadata = metadata[key] || {};
    metadata[key] = { ...keyMetadata, [field]: value };
    handleDataChange({ ...data, __metadata: metadata });
  };

  // Reorder results
  const moveResult = (key: string, idx: number, direction: 'up' | 'down') => {
    const results = [...(data[key]?.results || [])];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;

    if (targetIdx < 0 || targetIdx >= results.length) return;

    const temp = results[idx];
    results[idx] = results[targetIdx];
    results[targetIdx] = temp;

    updateNestedData([key, 'results'], results);
  };

  // Reorder champions
  const moveChampion = (key: string, idx: number, direction: 'up' | 'down') => {
    const champions = [...(data[key]?.champions || [])];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;

    if (targetIdx < 0 || targetIdx >= champions.length) return;

    const temp = champions[idx];
    champions[idx] = champions[targetIdx];
    champions[targetIdx] = temp;

    updateNestedData([key, 'champions'], champions);
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
  "__metadata": {
    "provincial": { "title": "Provincial", "heading": "Custom heading", "collapsible": true, "collapsed": false }
  },
  "provincial": {
    "title": "Provincial Championships",
    "description": "Optional description",
    "trophy": { "name": "...", "description": "..." },
    "results": [{ "year": "2025", "gold": "...", "silver": "...", "bronze": "..." }]
  }
}`}
          </pre>
        </div>
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

          {dataKeys.map(key => {
            const metadata = data.__metadata?.[key] || {};
            const isCollapsed = metadata.collapsed ?? false;
            const isCollapsible = metadata.collapsible ?? true;
            const sectionData = data[key] || {};

            return (
              <TabsContent key={key} value={key} className="space-y-4">
                {(key === 'provincial' || key === 'national') && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          {editingHeading === key ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={metadata.heading || ''}
                                onChange={(e) => updateMetadata(key, 'heading', e.target.value)}
                                placeholder="Custom heading (optional)"
                                className="h-8 w-64"
                              />
                              <Button
                                onClick={() => setEditingHeading(null)}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <Check className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button
                                onClick={() => {
                                  updateMetadata(key, 'heading', '');
                                  setEditingHeading(null);
                                }}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <X className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <CardTitle>{metadata.heading || `${getTabLabel(key)} Championship`}</CardTitle>
                              <CardDescription>{getTabDescription(key)}</CardDescription>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() => setEditingHeading(key)}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            title="Edit heading"
                          >
                            <Edit2 className="w-4 h-4 text-gray-500" />
                          </Button>
                          <Button
                            onClick={() => updateMetadata(key, 'collapsible', !isCollapsible)}
                            size="sm"
                            variant="ghost"
                            className={`h-8 w-8 p-0 ${isCollapsible ? 'text-blue-600' : 'text-gray-400'}`}
                            title={isCollapsible ? 'Collapsible enabled' : 'Collapsible disabled'}
                          >
                            <AlertCircle className="w-4 h-4" />
                          </Button>
                          {isCollapsible && (
                            <Button
                              onClick={() => updateMetadata(key, 'collapsed', !isCollapsed)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              title={isCollapsed ? 'Expand' : 'Collapse'}
                            >
                              {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {!isCollapsed && (
                      <CardContent className="space-y-4">
                        <TextareaWithLinkInserter
                          id={`${key}-title`}
                          label="Title"
                          value={sectionData.title || ''}
                          onChange={(value) => updateNestedData([key, 'title'], value)}
                          rows={1}
                          placeholder={`${getTabLabel(key)} Championships`}
                        />

                        <TextareaWithLinkInserter
                          id={`${key}-description`}
                          label="Description"
                          value={sectionData.description || ''}
                          onChange={(value) => updateNestedData([key, 'description'], value)}
                          rows={3}
                          placeholder="Optional description..."
                        />

                        <div className="border-t pt-4 space-y-3">
                          <Label className="text-base font-semibold">Trophy Information</Label>
                          <div className="space-y-2">
                            <Label>Trophy Name</Label>
                            <Input
                              value={sectionData.trophy?.name || ''}
                              onChange={(e) => updateNestedData([key, 'trophy', 'name'], e.target.value)}
                              placeholder="e.g., Carol Patterson Trophy"
                            />
                          </div>
                          <TextareaWithLinkInserter
                            id={`${key}-trophy-description`}
                            label="Trophy Description"
                            value={sectionData.trophy?.description || ''}
                            onChange={(value) => updateNestedData([key, 'trophy', 'description'], value)}
                            rows={4}
                            placeholder="Trophy history and significance..."
                          />
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

                          {(sectionData.results || []).length === 0 && (
                            <p className="text-sm text-gray-500 italic">No results added yet.</p>
                          )}

                          {(sectionData.results || []).map((result: any, idx: number) => (
                            <Card key={idx} className="bg-gray-50">
                              <CardContent className="pt-6 space-y-3">
                                <div className="flex items-center justify-between">
                                  <Badge>Result {idx + 1}</Badge>
                                  <div className="flex items-center gap-1">
                                    {idx > 0 && (
                                      <Button
                                        onClick={() => moveResult(key, idx, 'up')}
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        title="Move up"
                                      >
                                        <ChevronUp className="w-3 h-3" />
                                      </Button>
                                    )}
                                    {idx < (sectionData.results || []).length - 1 && (
                                      <Button
                                        onClick={() => moveResult(key, idx, 'down')}
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        title="Move down"
                                      >
                                        <ChevronDown className="w-3 h-3" />
                                      </Button>
                                    )}
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
                    )}
                  </Card>
                )}

                {(key === 'north' || key === 'south') && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          {editingHeading === key ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={metadata.heading || ''}
                                onChange={(e) => updateMetadata(key, 'heading', e.target.value)}
                                placeholder="Custom heading (optional)"
                                className="h-8 w-64"
                              />
                              <Button
                                onClick={() => setEditingHeading(null)}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <Check className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button
                                onClick={() => {
                                  updateMetadata(key, 'heading', '');
                                  setEditingHeading(null);
                                }}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <X className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <CardTitle>{metadata.heading || `${getTabLabel(key)} Champions`}</CardTitle>
                              <CardDescription>{getTabDescription(key)}</CardDescription>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() => setEditingHeading(key)}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            title="Edit heading"
                          >
                            <Edit2 className="w-4 h-4 text-gray-500" />
                          </Button>
                          <Button
                            onClick={() => updateMetadata(key, 'collapsible', !isCollapsible)}
                            size="sm"
                            variant="ghost"
                            className={`h-8 w-8 p-0 ${isCollapsible ? 'text-blue-600' : 'text-gray-400'}`}
                            title={isCollapsible ? 'Collapsible enabled' : 'Collapsible disabled'}
                          >
                            <AlertCircle className="w-4 h-4" />
                          </Button>
                          {isCollapsible && (
                            <Button
                              onClick={() => updateMetadata(key, 'collapsed', !isCollapsed)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              title={isCollapsed ? 'Expand' : 'Collapse'}
                            >
                              {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {!isCollapsed && (
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Conference Name</Label>
                          <Input
                            value={sectionData.conferenceName || ''}
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

                          {(sectionData.champions || []).length === 0 && (
                            <p className="text-sm text-gray-500 italic">No champions added yet.</p>
                          )}

                          <div className="grid gap-2">
                            {(sectionData.champions || []).map((champion: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                {idx > 0 && (
                                  <Button
                                    onClick={() => moveChampion(key, idx, 'up')}
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 shrink-0"
                                    title="Move up"
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                  </Button>
                                )}
                                {idx < (sectionData.champions || []).length - 1 && (
                                  <Button
                                    onClick={() => moveChampion(key, idx, 'down')}
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 shrink-0"
                                    title="Move down"
                                  >
                                    <ChevronDown className="w-3 h-3" />
                                  </Button>
                                )}
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
                    )}
                  </Card>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}