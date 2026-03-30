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

interface AwardsEditorProps {
  value: string;
  onChange: (value: string) => void;
  divisionName: string;
}

interface AwardSection {
  id: string;
  title: string;
  heading?: string;
  collapsible: boolean;
  collapsed?: boolean;
  order: number;
}

const DEFAULT_SECTIONS: AwardSection[] = [
  { id: 'pointLeaders', title: 'Point Leaders Award', collapsible: true, order: 0 },
  { id: 'allStarTeams', title: 'All-Star Teams', collapsible: true, order: 1 },
];

export function AwardsEditor({ value, onChange, divisionName }: AwardsEditorProps) {
  const [mode, setMode] = useState<'visual' | 'json'>('visual');
  const [data, setData] = useState<any>({});
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState(value || '{}');
  const [sections, setSections] = useState<AwardSection[]>([]);
  const [editingHeading, setEditingHeading] = useState<string | null>(null);

  // Parse JSON on mount and when value changes from outside
  useEffect(() => {
    try {
      if (value && typeof value === 'string' && value.trim()) {
        const parsed = JSON.parse(value);
        setData(parsed);
        setJsonText(JSON.stringify(parsed, null, 2));
        setJsonError(null);

        // Extract or initialize sections metadata
        const dataKeys = Object.keys(parsed).filter(key => key !== '__metadata' && typeof parsed[key] === 'object');
        const metadata = parsed.__metadata || {};

        const newSections: AwardSection[] = dataKeys.map((key, idx) => ({
          id: key,
          title: metadata[key]?.title || getDefaultTitle(key),
          heading: metadata[key]?.heading,
          collapsible: metadata[key]?.collapsible ?? true,
          collapsed: metadata[key]?.collapsed ?? false,
          order: metadata[key]?.order ?? idx,
        })).sort((a, b) => a.order - b.order);

        setSections(newSections.length > 0 ? newSections : DEFAULT_SECTIONS);
      } else {
        setData({});
        setJsonText('{}');
        setSections(DEFAULT_SECTIONS);
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

  const getDefaultTitle = (key: string): string => {
    switch (key) {
      case 'north': return 'North Conference';
      case 'south': return 'South Conference';
      case 'pointLeaders': return 'Point Leaders Award';
      case 'allStarTeams': return 'All-Star Teams';
      case 'rookieOfTheYear': return 'Rookie of the Year';
      case 'mvp': return 'Most Valuable Player';
      case 'defensivePlayer': return 'Defensive Player of the Year';
      case 'coachOfTheYear': return 'Coach of the Year';
      default: return key.charAt(0).toUpperCase() + key.slice(1);
    }
  };

  const updateSectionsMetadata = (newSections: AwardSection[]) => {
    setSections(newSections);

    // Update metadata in data
    const metadata: Record<string, any> = {};
    newSections.forEach(section => {
      metadata[section.id] = {
        title: section.title,
        heading: section.heading,
        collapsible: section.collapsible,
        collapsed: section.collapsed,
        order: section.order,
      };
    });

    handleDataChange({
      ...data,
      __metadata: metadata,
    });
  };

  const moveSection = (idx: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;

    if (targetIdx < 0 || targetIdx >= newSections.length) return;

    // Swap order values
    const tempOrder = newSections[idx].order;
    newSections[idx].order = newSections[targetIdx].order;
    newSections[targetIdx].order = tempOrder;

    // Re-sort by order
    newSections.sort((a, b) => a.order - b.order);

    updateSectionsMetadata(newSections);
  };

  const toggleCollapsible = (idx: number) => {
    const newSections = [...sections];
    newSections[idx].collapsible = !newSections[idx].collapsible;
    updateSectionsMetadata(newSections);
  };

  const toggleCollapsed = (idx: number) => {
    const newSections = [...sections];
    newSections[idx].collapsed = !newSections[idx].collapsed;
    updateSectionsMetadata(newSections);
  };

  const startEditHeading = (idx: number) => {
    setEditingHeading(sections[idx].id);
  };

  const saveHeading = (idx: number, value: string) => {
    const newSections = [...sections];
    newSections[idx].heading = value || undefined;
    updateSectionsMetadata(newSections);
    setEditingHeading(null);
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

  // Get the actual data keys (excluding __metadata)
  const dataKeys = Object.keys(data).filter(key => key !== '__metadata');

  // Helper to get tab label
  const getTabLabel = (key: string): string => {
    const section = sections.find(s => s.id === key);
    return section?.title || getDefaultTitle(key);
  };

  // Helper to get tab description
  const getTabDescription = (key: string): string => {
    switch (key) {
      case 'north': return 'Awards and honors for the North Conference';
      case 'south': return 'Awards and honors for the South Conference';
      case 'pointLeaders': return 'Regular season point leaders award';
      case 'allStarTeams': return 'All-Star team selections';
      default: return `Awards information`;
    }
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
  "__metadata": { "north": { "title": "...", "heading": "...", "collapsible": true, "collapsed": false, "order": 0 } },
  "north": {
    "conferenceName": "Jim Andrews Conference",
    "pointLeaders": { "title": "...", "recipients": [...] }
  },
  "south": { ... }
}`}
          </pre>
        </div>
      </div>
    );
  }

  // Visual Editor
  const defaultTab = sections.length > 0 ? sections[0].id : (dataKeys[0] || '');

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
            No awards data found. Use the JSON Editor to add data, or it will be created automatically when you save.
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
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{getTabLabel(key)}</CardTitle>
                      <CardDescription>{getTabDescription(key)}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Conference Name for north/south */}
                  {(key === 'north' || key === 'south') && (
                    <div className="space-y-2">
                      <Label>Conference Name</Label>
                      <Input
                        value={data[key]?.conferenceName || ''}
                        onChange={(e) => updateNestedData([key, 'conferenceName'], e.target.value)}
                        placeholder={key === 'north' ? "e.g., Jim Andrews Conference" : "e.g., Cindy Garant Conference"}
                      />
                    </div>
                  )}

                  {/* Dynamic sections based on data structure */}
                  {Object.entries(data[key] || {}).filter(([subKey]) =>
                    subKey !== 'conferenceName' && typeof data[key][subKey] === 'object'
                  ).map(([subKey, subValue]: [string, any]) => {
                    const sectionIdx = sections.findIndex(s => s.id === `${key}.${subKey}`);
                    const section = sectionIdx >= 0 ? sections[sectionIdx] : null;
                    const isCollapsed = section?.collapsed ?? false;

                    // Get section title from metadata or default
                    const sectionTitle = subKey.charAt(0).toUpperCase() + subKey.slice(1).replace(/([A-Z])/g, ' $1').trim();

                    // Check if this is pointLeaders with recipients
                    if (subKey === 'pointLeaders' && subValue?.recipients) {
                      return (
                        <div key={subKey} className="border rounded-lg overflow-hidden">
                          {/* Section Header with controls */}
                          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
                            <div className="flex items-center gap-2">
                              {editingHeading === `${key}.${subKey}` ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    value={section?.heading || ''}
                                    onChange={(e) => {}}
                                    placeholder="Custom heading (optional)"
                                    className="h-7 w-48"
                                  />
                                  <Button
                                    onClick={() => saveHeading(sectionIdx, '')}
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
                              ) : (
                                <span className="text-sm font-semibold">
                                  {section?.heading || sectionTitle}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                onClick={() => startEditHeading(sectionIdx)}
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                title="Edit heading"
                              >
                                <Edit2 className="w-3 h-3 text-gray-500" />
                              </Button>
                              <Button
                                onClick={() => toggleCollapsible(sectionIdx)}
                                size="sm"
                                variant="ghost"
                                className={`h-7 w-7 p-0 ${section?.collapsible ? 'text-blue-600' : 'text-gray-400'}`}
                                title={section?.collapsible ? 'Collapsible enabled' : 'Collapsible disabled'}
                              >
                                <AlertCircle className="w-3 h-3" />
                              </Button>
                              {section?.collapsible && (
                                <Button
                                  onClick={() => toggleCollapsed(sectionIdx)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  title={isCollapsed ? 'Expand' : 'Collapse'}
                                >
                                  {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Section Content */}
                          {!isCollapsed && (
                            <div className="p-4 space-y-4">
                              <div className="space-y-2">
                                <Label>Award Title</Label>
                                <Input
                                  value={data[key]?.pointLeaders?.title || ''}
                                  onChange={(e) => updateNestedData([key, 'pointLeaders', 'title'], e.target.value)}
                                  placeholder="e.g., Dave Nyhuis Award – Regular Season Point Leader"
                                />
                              </div>

                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">Recipients</Label>
                                  <Button
                                    onClick={() => {
                                      const recipients = data[key]?.pointLeaders?.recipients || [];
                                      updateNestedData([key, 'pointLeaders', 'recipients'], [
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

                                {(data[key]?.pointLeaders?.recipients || []).length === 0 && (
                                  <p className="text-sm text-gray-500 italic">No recipients added yet.</p>
                                )}

                                {(data[key]?.pointLeaders?.recipients || []).map((recipient: any, idx: number) => (
                                  <Card key={idx} className="bg-gray-50">
                                    <CardContent className="pt-6 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <Badge>Recipient {idx + 1}</Badge>
                                        <div className="flex items-center gap-1">
                                          {idx > 0 && (
                                            <Button
                                              onClick={() => {
                                                const recipients = [...(data[key]?.pointLeaders?.recipients || [])];
                                                const temp = recipients[idx];
                                                recipients[idx] = recipients[idx - 1];
                                                recipients[idx - 1] = temp;
                                                updateNestedData([key, 'pointLeaders', 'recipients'], recipients);
                                              }}
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 w-7 p-0"
                                              title="Move up"
                                            >
                                              <ChevronUp className="w-3 h-3" />
                                            </Button>
                                          )}
                                          {idx < (data[key]?.pointLeaders?.recipients || []).length - 1 && (
                                            <Button
                                              onClick={() => {
                                                const recipients = [...(data[key]?.pointLeaders?.recipients || [])];
                                                const temp = recipients[idx];
                                                recipients[idx] = recipients[idx + 1];
                                                recipients[idx + 1] = temp;
                                                updateNestedData([key, 'pointLeaders', 'recipients'], recipients);
                                              }}
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
                                              const recipients = [...(data[key]?.pointLeaders?.recipients || [])];
                                              recipients.splice(idx, 1);
                                              updateNestedData([key, 'pointLeaders', 'recipients'], recipients);
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
                                            value={recipient.year || ''}
                                            onChange={(e) => {
                                              const recipients = [...(data[key]?.pointLeaders?.recipients || [])];
                                              recipients[idx] = { ...recipients[idx], year: e.target.value };
                                              updateNestedData([key, 'pointLeaders', 'recipients'], recipients);
                                            }}
                                            placeholder="2025"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs">Player (with #)</Label>
                                          <Input
                                            value={recipient.player || ''}
                                            onChange={(e) => {
                                              const recipients = [...(data[key]?.pointLeaders?.recipients || [])];
                                              recipients[idx] = { ...recipients[idx], player: e.target.value };
                                              updateNestedData([key, 'pointLeaders', 'recipients'], recipients);
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
                                            const recipients = [...(data[key]?.pointLeaders?.recipients || [])];
                                            recipients[idx] = { ...recipients[idx], team: e.target.value };
                                            updateNestedData([key, 'pointLeaders', 'recipients'], recipients);
                                          }}
                                          placeholder="Team name"
                                        />
                                      </div>

                                      <div className="space-y-1">
                                        <Label className="text-xs">Stats</Label>
                                        <Input
                                          value={recipient.stats || ''}
                                          onChange={(e) => {
                                            const recipients = [...(data[key]?.pointLeaders?.recipients || [])];
                                            recipients[idx] = { ...recipients[idx], stats: e.target.value };
                                            updateNestedData([key, 'pointLeaders', 'recipients'], recipients);
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
                                              const recipients = [...(data[key]?.pointLeaders?.recipients || [])];
                                              recipients[idx] = { ...recipients[idx], points: parseInt(e.target.value) || 0 };
                                              updateNestedData([key, 'pointLeaders', 'recipients'], recipients);
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
                                              const recipients = [...(data[key]?.pointLeaders?.recipients || [])];
                                              recipients[idx] = { ...recipients[idx], games: parseInt(e.target.value) || 0 };
                                              updateNestedData([key, 'pointLeaders', 'recipients'], recipients);
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
                                            const recipients = [...(data[key]?.pointLeaders?.recipients || [])];
                                            recipients[idx] = { ...recipients[idx], note: e.target.value };
                                            updateNestedData([key, 'pointLeaders', 'recipients'], recipients);
                                          }}
                                          placeholder="e.g., North Central Division"
                                        />
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Default section rendering for other award types
                    return (
                      <div key={subKey} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-base font-semibold">{sectionTitle}</Label>
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Use the JSON Editor to edit this section's content.
                            </AlertDescription>
                          </Alert>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}