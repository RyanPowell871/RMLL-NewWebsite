import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Plus, Trash2, AlertCircle, Code, Eye, ChevronUp, ChevronDown, Edit2, Check, X, PlusCircle, Database, AlertTriangle } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { TextareaWithLinkInserter } from './TextareaWithLinkInserter';

interface ChampionshipsEditorProps {
  value: string;
  onChange: (value: string) => void;
  divisionName: string;
}

interface TabConfig {
  key: string;
  label: string;
  description: string;
  type: 'provincial' | 'national' | 'conference' | 'division-championship';
  path: string[]; // Path to the data (e.g., ['provincial'] or ['division', 'north'])
}

// Default templates for championships data
const PROVINCIAL_TEMPLATE = {
  provincial: {
    title: 'ALA Provincial Championships',
    description: 'Provincial championship history and results',
    trophy: {
      name: '',
      description: ''
    },
    results: []
  }
};

const NATIONAL_TEMPLATE = {
  national: {
    title: 'National Championships',
    description: 'National championship history and results',
    trophy: {
      name: '',
      description: ''
    },
    results: []
  }
};

const CONFERENCE_TEMPLATE = {
  north: {
    conferenceName: 'North Conference',
    champions: []
  },
  south: {
    conferenceName: 'South Conference',
    champions: []
  }
};

const DIVISION_TEMPLATE = {
  division: {
    north: {
      title: 'North Division Champions',
      results: []
    },
    south: {
      title: 'South Division Champions',
      results: []
    }
  }
};

export function ChampionshipsEditor({ value, onChange, divisionName }: ChampionshipsEditorProps) {
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
      // Only call onChange with valid, formatted JSON
      onChange(JSON.stringify(parsed, null, 2));
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

  // Determine data structure type and available tabs
  const getTabs = (): TabConfig[] => {
    const tabs: TabConfig[] = [];

    // Check for provincial/national (Tier II style)
    if (data.provincial) {
      tabs.push({
        key: 'provincial',
        label: 'Provincial',
        description: 'ALA Provincial Championship information',
        type: 'provincial',
        path: ['provincial']
      });
    }
    if (data.national) {
      tabs.push({
        key: 'national',
        label: 'National',
        description: 'National Championship information',
        type: 'national',
        path: ['national']
      });
    }

    // Check for division structure (Senior C style)
    if (data.division?.north) {
      tabs.push({
        key: 'division-north',
        label: 'North Division',
        description: 'North Division championship history',
        type: 'division-championship',
        path: ['division', 'north']
      });
    }
    if (data.division?.south) {
      tabs.push({
        key: 'division-south',
        label: 'South Division',
        description: 'South Division championship history',
        type: 'division-championship',
        path: ['division', 'south']
      });
    }

    // Check for conference structure (Tier II style)
    if (data.north && !data.division?.north) {
      tabs.push({
        key: 'north',
        label: 'North Conference',
        description: 'North Conference championship history',
        type: 'conference',
        path: ['north']
      });
    }
    if (data.south && !data.division?.south) {
      tabs.push({
        key: 'south',
        label: 'South Conference',
        description: 'South Conference championship history',
        type: 'conference',
        path: ['south']
      });
    }

    return tabs;
  };

  const tabs = getTabs();

  // Set active tab when tabs change
  useEffect(() => {
    if (tabs.length > 0 && !activeTab.startsWith('tab-')) {
      setActiveTab(`tab-${tabs[0].key}`);
    }
  }, [tabs.length]);

  // Reorder results/champions
  const moveItem = (path: string[], itemPath: string, idx: number, direction: 'up' | 'down') => {
    const items = [...(getNestedValue([...path, itemPath]) || [])];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;

    if (targetIdx < 0 || targetIdx >= items.length) return;

    const temp = items[idx];
    items[idx] = items[targetIdx];
    items[targetIdx] = temp;

    updateNestedData([...path, itemPath], items);
  };

  // Create template data
  const createTemplate = (template: any) => {
    handleDataChange(template);
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
            <Badge variant="secondary">{divisionName}</Badge>
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
          rows={30}
          className="font-mono text-sm"
          placeholder="Enter JSON data..."
        />

        {/* Show quick templates for empty data */}
        {Object.keys(data).length === 0 && (
          <Alert>
            <PlusCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex flex-col gap-2">
                <span className="font-semibold">Quick Start Templates:</span>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => createTemplate(PROVINCIAL_TEMPLATE)}
                    size="sm"
                    variant="outline"
                  >
                    Provincial Championships
                  </Button>
                  <Button
                    onClick={() => createTemplate(NATIONAL_TEMPLATE)}
                    size="sm"
                    variant="outline"
                  >
                    National Championships
                  </Button>
                  <Button
                    onClick={() => createTemplate(CONFERENCE_TEMPLATE)}
                    size="sm"
                    variant="outline"
                  >
                    Conference Championships
                  </Button>
                  <Button
                    onClick={() => createTemplate(DIVISION_TEMPLATE)}
                    size="sm"
                    variant="outline"
                  >
                    Division Championships
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
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

      {tabs.length === 0 && (
        <>
          {data && Object.keys(data).length > 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex flex-col gap-2">
                  <span className="font-semibold">Championships data is in an unrecognized format.</span>
                  <p className="text-sm">Current data keys: {Object.keys(data).join(', ')}</p>
                  <p className="text-sm">Use the JSON Editor to view, edit, or restructure this data.</p>
                  <Button
                    onClick={() => setMode('json')}
                    size="sm"
                  >
                    <Code className="w-4 h-4 mr-2" />
                    Open JSON Editor
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex flex-col gap-3">
                    <span className="font-semibold">No championships data found for {divisionName}.</span>
                    <p className="text-sm">Choose a template to get started:</p>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={() => createTemplate(PROVINCIAL_TEMPLATE)}
                        size="sm"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Provincial Championships
                      </Button>
                      <Button
                        onClick={() => createTemplate(NATIONAL_TEMPLATE)}
                        size="sm"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        National Championships
                      </Button>
                      <Button
                        onClick={() => createTemplate(CONFERENCE_TEMPLATE)}
                        size="sm"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Conference Championships
                      </Button>
                      <Button
                        onClick={() => createTemplate(DIVISION_TEMPLATE)}
                        size="sm"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Division Championships
                      </Button>
                      <Button
                        onClick={() => setMode('json')}
                        size="sm"
                        variant="outline"
                      >
                        <Code className="w-4 h-4 mr-2" />
                        Use JSON Editor
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Template Guide:</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• <strong>Provincial Championships:</strong> ALA Provincial Championship with gold/silver/bronze medals</li>
                  <li>• <strong>National Championships:</strong> National Championship results (Minto Cup, Founders Cup, etc.)</li>
                  <li>• <strong>Conference Championships:</strong> North/South conference champions</li>
                  <li>• <strong>Division Championships:</strong> Division champions for multi-division formats</li>
                </ul>
              </div>
            </>
          )}
        </>
      )}

      {tabs.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
            {tabs.map(tab => (
              <TabsTrigger key={tab.key} value={`tab-${tab.key}`}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map(tab => {
            const sectionData = getNestedValue(tab.path) || {};
            const isProvincialOrNational = tab.type === 'provincial' || tab.type === 'national';
            const isDivisionChampionship = tab.type === 'division-championship';
            const isConference = tab.type === 'conference';

            return (
              <TabsContent key={tab.key} value={`tab-${tab.key}`} className="space-y-4">
                {isProvincialOrNational && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          {editingHeading === tab.key ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={getNestedValue([...tab.path, 'title']) || ''}
                                onChange={(e) => updateNestedData([...tab.path, 'title'], e.target.value)}
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
                                onClick={() => setEditingHeading(null)}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <X className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <CardTitle>{sectionData.title || `${tab.label} Championship`}</CardTitle>
                              <CardDescription>{tab.description}</CardDescription>
                            </>
                          )}
                        </div>
                        <Button
                          onClick={() => setEditingHeading(tab.key)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="Edit heading"
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <TextareaWithLinkInserter
                        id={`${tab.key}-title`}
                        label="Title"
                        value={sectionData.title || ''}
                        onChange={(value) => updateNestedData([...tab.path, 'title'], value)}
                        rows={1}
                        placeholder={`${tab.label} Championships`}
                      />

                      <TextareaWithLinkInserter
                        id={`${tab.key}-description`}
                        label="Description"
                        value={sectionData.description || ''}
                        onChange={(value) => updateNestedData([...tab.path, 'description'], value)}
                        rows={3}
                        placeholder="Optional description..."
                      />

                      <div className="border-t pt-4 space-y-3">
                        <Label className="text-base font-semibold">Trophy Information</Label>
                        <div className="space-y-2">
                          <Label>Trophy Name</Label>
                          <Input
                            value={sectionData.trophy?.name || ''}
                            onChange={(e) => updateNestedData([...tab.path, 'trophy', 'name'], e.target.value)}
                            placeholder="e.g., Carol Patterson Trophy"
                          />
                        </div>
                        <TextareaWithLinkInserter
                          id={`${tab.key}-trophy-description`}
                          label="Trophy Description"
                          value={sectionData.trophy?.description || ''}
                          onChange={(value) => updateNestedData([...tab.path, 'trophy', 'description'], value)}
                          rows={4}
                          placeholder="Trophy history and significance..."
                        />
                      </div>

                      <div className="border-t pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">Championship Results</Label>
                          <Button
                            onClick={() => {
                              const results = sectionData.results || [];
                              updateNestedData([...tab.path, 'results'], [
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
                          <p className="text-sm text-gray-500 italic">No results added yet. Click "Add Result" to add one.</p>
                        )}

                        {(sectionData.results || []).map((result: any, idx: number) => (
                          <Card key={idx} className="bg-gray-50">
                            <CardContent className="pt-6 space-y-3">
                              <div className="flex items-center justify-between">
                                <Badge>Result {idx + 1}</Badge>
                                <div className="flex items-center gap-1">
                                  {idx > 0 && (
                                    <Button
                                      onClick={() => moveItem(tab.path, 'results', idx, 'up')}
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
                                      onClick={() => moveItem(tab.path, 'results', idx, 'down')}
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
                                      const results = [...(sectionData.results || [])];
                                      results.splice(idx, 1);
                                      updateNestedData([...tab.path, 'results'], results);
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
                                      const results = [...(sectionData.results || [])];
                                      results[idx] = { ...results[idx], year: e.target.value };
                                      updateNestedData([...tab.path, 'results'], results);
                                    }}
                                    placeholder="2025"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Host (optional)</Label>
                                  <Input
                                    value={result.host || ''}
                                    onChange={(e) => {
                                      const results = [...(sectionData.results || [])];
                                      results[idx] = { ...results[idx], host: e.target.value };
                                      updateNestedData([...tab.path, 'results'], results);
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
                                    const results = [...(sectionData.results || [])];
                                    results[idx] = { ...results[idx], gold: e.target.value };
                                    updateNestedData([...tab.path, 'results'], results);
                                  }}
                                  placeholder="Team name"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">Silver (Runner-up)</Label>
                                <Input
                                  value={result.silver || ''}
                                  onChange={(e) => {
                                    const results = [...(sectionData.results || [])];
                                    results[idx] = { ...results[idx], silver: e.target.value };
                                    updateNestedData([...tab.path, 'results'], results);
                                  }}
                                  placeholder="Team name"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">Bronze (optional)</Label>
                                <Input
                                  value={result.bronze || ''}
                                  onChange={(e) => {
                                    const results = [...(sectionData.results || [])];
                                    results[idx] = { ...results[idx], bronze: e.target.value };
                                    updateNestedData([...tab.path, 'results'], results);
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

                {isDivisionChampionship && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          {editingHeading === tab.key ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={sectionData.title || ''}
                                onChange={(e) => updateNestedData([...tab.path, 'title'], e.target.value)}
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
                                onClick={() => setEditingHeading(null)}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <X className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <CardTitle>{sectionData.title || `${tab.label} Champions`}</CardTitle>
                              <CardDescription>{tab.description}</CardDescription>
                            </>
                          )}
                        </div>
                        <Button
                          onClick={() => setEditingHeading(tab.key)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="Edit heading"
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="border-t pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">Division Champions</Label>
                          <Button
                            onClick={() => {
                              const results = sectionData.results || [];
                              updateNestedData([...tab.path, 'results'], [
                                { year: '', champion: '' },
                                ...results
                              ]);
                            }}
                            size="sm"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Champion
                          </Button>
                        </div>

                        {(sectionData.results || []).length === 0 && (
                          <p className="text-sm text-gray-500 italic">No champions added yet. Click "Add Champion" to add one.</p>
                        )}

                        <div className="grid gap-2">
                          {(sectionData.results || []).map((champion: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              {idx > 0 && (
                                <Button
                                  onClick={() => moveItem(tab.path, 'results', idx, 'up')}
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 shrink-0"
                                  title="Move up"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </Button>
                              )}
                              {idx < (sectionData.results || []).length - 1 && (
                                <Button
                                  onClick={() => moveItem(tab.path, 'results', idx, 'down')}
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
                                  const results = [...(sectionData.results || [])];
                                  results[idx] = { ...results[idx], year: e.target.value };
                                  updateNestedData([...tab.path, 'results'], results);
                                }}
                                placeholder="Year"
                                className="w-24"
                              />
                              <Input
                                value={champion.champion || ''}
                                onChange={(e) => {
                                  const results = [...(sectionData.results || [])];
                                  results[idx] = { ...results[idx], champion: e.target.value };
                                  updateNestedData([...tab.path, 'results'], results);
                                }}
                                placeholder="Team name"
                                className="flex-1"
                              />
                              <Button
                                onClick={() => {
                                  const results = [...(sectionData.results || [])];
                                  results.splice(idx, 1);
                                  updateNestedData([...tab.path, 'results'], results);
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

                {isConference && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          {editingHeading === tab.key ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={sectionData.conferenceName || sectionData.title || ''}
                                onChange={(e) => {
                                  if (sectionData.conferenceName !== undefined) {
                                    updateNestedData([...tab.path, 'conferenceName'], e.target.value);
                                  } else {
                                    updateNestedData([...tab.path, 'title'], e.target.value);
                                  }
                                }}
                                placeholder="Conference name"
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
                                onClick={() => setEditingHeading(null)}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <X className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <CardTitle>{sectionData.conferenceName || sectionData.title || `${tab.label} Champions`}</CardTitle>
                              <CardDescription>{tab.description}</CardDescription>
                            </>
                          )}
                        </div>
                        <Button
                          onClick={() => setEditingHeading(tab.key)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="Edit heading"
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {sectionData.conferenceName !== undefined && (
                        <div className="space-y-2">
                          <Label>Conference Name</Label>
                          <Input
                            value={sectionData.conferenceName || ''}
                            onChange={(e) => updateNestedData([...tab.path, 'conferenceName'], e.target.value)}
                            placeholder="e.g., Jim Andrews Conference"
                          />
                        </div>
                      )}

                      <div className="border-t pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">Conference Champions</Label>
                          <Button
                            onClick={() => {
                              const champions = sectionData.champions || [];
                              updateNestedData([...tab.path, 'champions'], [
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
                          <p className="text-sm text-gray-500 italic">No champions added yet. Click "Add Champion" to add one.</p>
                        )}

                        <div className="grid gap-2">
                          {(sectionData.champions || []).map((champion: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              {idx > 0 && (
                                <Button
                                  onClick={() => moveItem(tab.path, 'champions', idx, 'up')}
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
                                  onClick={() => moveItem(tab.path, 'champions', idx, 'down')}
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
                                  const champions = [...(sectionData.champions || [])];
                                  champions[idx] = { ...champions[idx], year: e.target.value };
                                  updateNestedData([...tab.path, 'champions'], champions);
                                }}
                                placeholder="Year"
                                className="w-24"
                              />
                              <Input
                                value={champion.team || ''}
                                onChange={(e) => {
                                  const champions = [...(sectionData.champions || [])];
                                  champions[idx] = { ...champions[idx], team: e.target.value };
                                  updateNestedData([...tab.path, 'champions'], champions);
                                }}
                                placeholder="Team name"
                                className="flex-1"
                              />
                              <Button
                                onClick={() => {
                                  const champions = [...(sectionData.champions || [])];
                                  champions.splice(idx, 1);
                                  updateNestedData([...tab.path, 'champions'], champions);
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
            );
          })}
        </Tabs>
      )}
    </div>
  );
}