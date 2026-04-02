import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Plus, Trash2, AlertCircle, Code, Eye, ChevronUp, ChevronDown, Edit2, Check, X, PlusCircle } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { TextareaWithLinkInserter } from './TextareaWithLinkInserter';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AlertTriangle, Database } from 'lucide-react';

interface AwardsEditorProps {
  value: string;
  onChange: (value: string) => void;
  divisionName: string;
}

// Default template for new awards data
const DEFAULT_AWARDS_TEMPLATE = {
  pointLeaders: {
    title: 'Season Point Leaders',
    description: 'Regular Season Point Leaders',
    recipients: []
  },
  divisionAwards: {
    title: 'Division Awards',
    description: 'Annual awards and honors',
    awards: []
  },
  tournaments: {
    description: 'Tournament events and results',
    events: []
  }
};

// Conference-based template for divisions with North/South conferences
const CONFERENCE_AWARDS_TEMPLATE = {
  north: {
    pointLeaders: {
      title: 'North Conference Point Leaders',
      description: 'North Conference Regular Season Point Leaders',
      recipients: []
    },
    divisionAwards: {
      title: 'North Conference Awards',
      description: 'North Conference annual awards',
      awards: []
    }
  },
  south: {
    pointLeaders: {
      title: 'South Conference Point Leaders',
      description: 'South Conference Regular Season Point Leaders',
      recipients: []
    },
    divisionAwards: {
      title: 'South Conference Awards',
      description: 'South Conference annual awards',
      awards: []
    }
  }
};

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
      console.error('[AwardsEditor] Error parsing awards JSON:', err);
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

  // Detect data structure type
  const getDataStructure = () => {
    if (!data || Object.keys(data).length === 0) return 'empty';
    if (data.north || data.south) return 'conference';

    // Check for Junior A format (uses winners instead of recipients)
    const isJuniorAFormat = data.pointLeaders?.winners ||
                            data.divisionAwards?.categories;

    if (data.pointLeaders || data.divisionAwards || data.tournaments || isJuniorAFormat) {
      return isJuniorAFormat ? 'juniorA' : 'standard';
    }

    if (Array.isArray(data)) return 'array';
    return 'unknown';
  };

  const dataStructure = getDataStructure();

  // Create default data structure
  const createDefaultStructure = (type: 'standard' | 'conference') => {
    const template = type === 'conference' ? CONFERENCE_AWARDS_TEMPLATE : DEFAULT_AWARDS_TEMPLATE;
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
                    onClick={() => createDefaultStructure('standard')}
                    size="sm"
                    variant="outline"
                  >
                    Standard Awards (pointLeaders, divisionAwards, tournaments)
                  </Button>
                  <Button
                    onClick={() => createDefaultStructure('conference')}
                    size="sm"
                    variant="outline"
                  >
                    Conference Awards (North/South conferences)
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Conference-based structure (Tier II)
  if (dataStructure === 'conference') {
    const conferences = [];
    if (data.north) conferences.push({ key: 'north', label: 'North Conference', data: data.north });
    if (data.south) conferences.push({ key: 'south', label: 'South Conference', data: data.south });
    if (conferences.length > 0 && !activeTab.startsWith('conf-')) {
      setActiveTab(`conf-${conferences[0].key}`);
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Visual Editor</Badge>
            <Badge variant="secondary">{divisionName}</Badge>
            <Badge variant="outline">Conference Structure</Badge>
          </div>
          <Button onClick={() => setMode('json')} variant="outline" size="sm">
            <Code className="w-4 h-4 mr-2" />
            JSON Editor
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${conferences.length}, 1fr)` }}>
            {conferences.map(conf => (
              <TabsTrigger key={conf.key} value={`conf-${conf.key}`}>
                {conf.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {conferences.map(conf => (
            <TabsContent key={conf.key} value={`conf-${conf.key}`} className="space-y-4">
              {/* Point Leaders */}
              {(conf.data.pointLeaders !== undefined) && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        {editingHeading === `${conf.key}-pointLeaders` ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={conf.data.pointLeaders.title || ''}
                              onChange={(e) => {
                                const newData = { ...data };
                                if (!newData[conf.key]) newData[conf.key] = {};
                                if (!newData[conf.key].pointLeaders) newData[conf.key].pointLeaders = {};
                                newData[conf.key].pointLeaders.title = e.target.value;
                                handleDataChange(newData);
                              }}
                              className="text-lg font-semibold"
                              placeholder="Point Leaders Title"
                            />
                            <Button
                              onClick={() => setEditingHeading(null)}
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
                          <CardTitle className="cursor-pointer hover:text-blue-600" onClick={() => setEditingHeading(`${conf.key}-pointLeaders`)}>
                            {conf.data.pointLeaders.title || 'Point Leaders'}
                          </CardTitle>
                        )}
                        {conf.data.pointLeaders.description && (
                          <CardDescription>{conf.data.pointLeaders.description}</CardDescription>
                        )}
                      </div>
                      <Button onClick={() => {
                        const recipients = [...(conf.data.pointLeaders.recipients || [])];
                        updateNestedData([conf.key, 'pointLeaders', 'recipients'], [
                          { year: '', player: '', team: '', stats: '', points: 0, games: 0, conference: '' },
                          ...recipients
                        ]);
                      }} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Point Leader
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {conf.data.pointLeaders.note && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        {conf.data.pointLeaders.note}
                      </div>
                    )}
                    <div className="space-y-2">
                      {(conf.data.pointLeaders.recipients || []).map((recipient: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-50 border rounded p-2">
                          {idx > 0 && (
                            <Button onClick={() => {
                              const recipients = [...(conf.data.pointLeaders.recipients || [])];
                              const temp = recipients[idx];
                              recipients[idx] = recipients[idx - 1];
                              recipients[idx - 1] = temp;
                              updateNestedData([conf.key, 'pointLeaders', 'recipients'], recipients);
                            }} variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <ChevronUp className="w-3 h-3" />
                            </Button>
                          )}
                          {idx < (conf.data.pointLeaders.recipients || []).length - 1 && (
                            <Button onClick={() => {
                              const recipients = [...(conf.data.pointLeaders.recipients || [])];
                              const temp = recipients[idx];
                              recipients[idx] = recipients[idx + 1];
                              recipients[idx + 1] = temp;
                              updateNestedData([conf.key, 'pointLeaders', 'recipients'], recipients);
                            }} variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          )}
                          <Input value={recipient.year || ''} onChange={(e) => {
                            const recipients = [...(conf.data.pointLeaders.recipients || [])];
                            recipients[idx] = { ...recipients[idx], year: e.target.value };
                            updateNestedData([conf.key, 'pointLeaders', 'recipients'], recipients);
                          }} placeholder="Year" className="w-16 text-xs" />
                          <Input value={recipient.player || ''} onChange={(e) => {
                            const recipients = [...(conf.data.pointLeaders.recipients || [])];
                            recipients[idx] = { ...recipients[idx], player: e.target.value };
                            updateNestedData([conf.key, 'pointLeaders', 'recipients'], recipients);
                          }} placeholder="Player" className="flex-1 text-xs" />
                          <Input value={recipient.team || ''} onChange={(e) => {
                            const recipients = [...(conf.data.pointLeaders.recipients || [])];
                            recipients[idx] = { ...recipients[idx], team: e.target.value };
                            updateNestedData([conf.key, 'pointLeaders', 'recipients'], recipients);
                          }} placeholder="Team" className="flex-1 text-xs" />
                          <Input value={recipient.stats || ''} onChange={(e) => {
                            const recipients = [...(conf.data.pointLeaders.recipients || [])];
                            recipients[idx] = { ...recipients[idx], stats: e.target.value };
                            updateNestedData([conf.key, 'pointLeaders', 'recipients'], recipients);
                          }} placeholder="Stats" className="w-24 text-xs" />
                          <Input type="number" value={recipient.points || ''} onChange={(e) => {
                            const recipients = [...(conf.data.pointLeaders.recipients || [])];
                            recipients[idx] = { ...recipients[idx], points: e.target.value ? parseInt(e.target.value) || 0 : 0 };
                            updateNestedData([conf.key, 'pointLeaders', 'recipients'], recipients);
                          }} placeholder="Pts" className="w-14 text-xs" />
                          <Button onClick={() => {
                            const recipients = [...(conf.data.pointLeaders.recipients || [])];
                            recipients.splice(idx, 1);
                            updateNestedData([conf.key, 'pointLeaders', 'recipients'], recipients);
                          }} variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      ))}
                      {(!conf.data.pointLeaders.recipients || conf.data.pointLeaders.recipients.length === 0) && (
                        <p className="text-sm text-gray-500 italic">No point leaders added yet. Click "Add Point Leader" to add one.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Division Awards */}
              {(conf.data.divisionAwards !== undefined) && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        {editingHeading === `${conf.key}-divisionAwards` ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={conf.data.divisionAwards.title || ''}
                              onChange={(e) => {
                                const newData = { ...data };
                                if (!newData[conf.key]) newData[conf.key] = {};
                                if (!newData[conf.key].divisionAwards) newData[conf.key].divisionAwards = {};
                                newData[conf.key].divisionAwards.title = e.target.value;
                                handleDataChange(newData);
                              }}
                              className="text-lg font-semibold"
                              placeholder="Division Awards Title"
                            />
                            <Button
                              onClick={() => setEditingHeading(null)}
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
                          <CardTitle className="cursor-pointer hover:text-blue-600" onClick={() => setEditingHeading(`${conf.key}-divisionAwards`)}>
                            {conf.data.divisionAwards.title || 'Division Awards'}
                          </CardTitle>
                        )}
                        {conf.data.divisionAwards.description && (
                          <CardDescription>{conf.data.divisionAwards.description}</CardDescription>
                        )}
                      </div>
                      <Button onClick={() => {
                        const awards = [...(conf.data.divisionAwards.awards || [])];
                        updateNestedData([conf.key, 'divisionAwards', 'awards'], [
                          { name: '', recipients: [] },
                          ...awards
                        ]);
                      }} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Award Category
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(conf.data.divisionAwards.awards || []).map((award: any, awardIdx: number) => (
                      <Card key={awardIdx} className="border-l-4 border-l-[#013fac]">
                        <CardHeader className="py-3">
                          <div className="flex items-center gap-2">
                            <Input
                              value={award.name || ''}
                              onChange={(e) => {
                                const awards = [...(conf.data.divisionAwards.awards || [])];
                                awards[awardIdx] = { ...awards[awardIdx], name: e.target.value };
                                updateNestedData([conf.key, 'divisionAwards', 'awards'], awards);
                              }}
                              placeholder="Award Name"
                              className="font-semibold flex-1"
                            />
                            <Button onClick={() => {
                              const awards = [...(conf.data.divisionAwards.awards || [])];
                              awards.splice(awardIdx, 1);
                              updateNestedData([conf.key, 'divisionAwards', 'awards'], awards);
                            }} variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {award.description !== undefined && (
                            <TextareaWithLinkInserter
                              id={`${conf.key}-divisionAwards-${awardIdx}-desc`}
                              label="Description (optional)"
                              value={award.description || ''}
                              onChange={(value) => {
                                const awards = [...(conf.data.divisionAwards.awards || [])];
                                awards[awardIdx] = { ...awards[awardIdx], description: value };
                                updateNestedData([conf.key, 'divisionAwards', 'awards'], awards);
                              }}
                              rows={2}
                            />
                          )}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-semibold">Recipients</Label>
                              <Button
                                onClick={() => {
                                  const awards = [...(conf.data.divisionAwards.awards || [])];
                                  const awardRecipients = [...(awards[awardIdx].recipients || [])];
                                  awardRecipients.push({ year: '', player: '', team: '' });
                                  awards[awardIdx] = { ...awards[awardIdx], recipients: awardRecipients };
                                  updateNestedData([conf.key, 'divisionAwards', 'awards'], awards);
                                }}
                                size="sm"
                                variant="outline"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add Recipient
                              </Button>
                            </div>
                            {(award.recipients || []).map((recipient: any, rIdx: number) => (
                              <div key={rIdx} className="flex items-center gap-2 bg-gray-50 rounded p-2">
                                <Input
                                  value={recipient.year || ''}
                                  onChange={(e) => {
                                    const awards = [...(conf.data.divisionAwards.awards || [])];
                                    const awardRecipients = [...(awards[awardIdx].recipients || [])];
                                    awardRecipients[rIdx] = { ...awardRecipients[rIdx], year: e.target.value };
                                    awards[awardIdx] = { ...awards[awardIdx], recipients: awardRecipients };
                                    updateNestedData([conf.key, 'divisionAwards', 'awards'], awards);
                                  }}
                                  placeholder="Year"
                                  className="w-16 text-xs"
                                />
                                <Input
                                  value={recipient.player || ''}
                                  onChange={(e) => {
                                    const awards = [...(conf.data.divisionAwards.awards || [])];
                                    const awardRecipients = [...(awards[awardIdx].recipients || [])];
                                    awardRecipients[rIdx] = { ...awardRecipients[rIdx], player: e.target.value };
                                    awards[awardIdx] = { ...awards[awardIdx], recipients: awardRecipients };
                                    updateNestedData([conf.key, 'divisionAwards', 'awards'], awards);
                                  }}
                                  placeholder="Player"
                                  className="flex-1 text-xs"
                                />
                                <Input
                                  value={recipient.team || ''}
                                  onChange={(e) => {
                                    const awards = [...(conf.data.divisionAwards.awards || [])];
                                    const awardRecipients = [...(awards[awardIdx].recipients || [])];
                                    awardRecipients[rIdx] = { ...awardRecipients[rIdx], team: e.target.value };
                                    awards[awardIdx] = { ...awards[awardIdx], recipients: awardRecipients };
                                    updateNestedData([conf.key, 'divisionAwards', 'awards'], awards);
                                  }}
                                  placeholder="Team"
                                  className="flex-1 text-xs"
                                />
                                <Button
                                  onClick={() => {
                                    const awards = [...(conf.data.divisionAwards.awards || [])];
                                    const awardRecipients = [...(awards[awardIdx].recipients || [])];
                                    awardRecipients.splice(rIdx, 1);
                                    awards[awardIdx] = { ...awards[awardIdx], recipients: awardRecipients };
                                    updateNestedData([conf.key, 'divisionAwards', 'awards'], awards);
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                >
                                  <Trash2 className="w-3 h-3 text-red-600" />
                                </Button>
                              </div>
                            ))}
                            {(!award.recipients || award.recipients.length === 0) && (
                              <p className="text-xs text-gray-500 italic">No recipients added yet.</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {(!conf.data.divisionAwards.awards || conf.data.divisionAwards.awards.length === 0) && (
                      <p className="text-sm text-gray-500 italic">No award categories added yet. Click "Add Award Category" to add one.</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    );
  }

  // Standard structure (Senior C, etc.)
  if (dataStructure === 'standard') {
    const sections: any[] = [];
    if (data.pointLeaders !== undefined) sections.push({ key: 'pointLeaders', label: 'Point Leaders', data: data.pointLeaders });
    if (data.divisionAwards !== undefined) sections.push({ key: 'divisionAwards', label: 'Division Awards', data: data.divisionAwards });
    if (data.tournaments !== undefined) sections.push({ key: 'tournaments', label: 'Tournaments', data: data.tournaments });

    if (sections.length > 0 && !activeTab.startsWith('std-')) {
      setActiveTab(`std-${sections[0].key}`);
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

        {sections.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
              {sections.map(section => (
                <TabsTrigger key={section.key} value={`std-${section.key}`}>
                  {section.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {sections.map(section => (
              <TabsContent key={section.key} value={`std-${section.key}`} className="space-y-4">
                {/* Point Leaders */}
                {section.key === 'pointLeaders' && (
                  <>
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            {editingHeading === 'pointLeaders' ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={section.data.title || ''}
                                  onChange={(e) => {
                                    const newData = { ...data };
                                    if (!newData.pointLeaders) newData.pointLeaders = {};
                                    newData.pointLeaders.title = e.target.value;
                                    handleDataChange(newData);
                                  }}
                                  className="text-lg font-semibold"
                                  placeholder="Point Leaders Title"
                                />
                                <Button
                                  onClick={() => setEditingHeading(null)}
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
                              <CardTitle className="cursor-pointer hover:text-blue-600" onClick={() => setEditingHeading('pointLeaders')}>
                                {section.data.title || 'Point Leaders'}
                              </CardTitle>
                            )}
                            {section.data.description && (
                              <CardDescription>{section.data.description}</CardDescription>
                            )}
                          </div>
                          <Button onClick={() => {
                            const recipients = [...(section.data.recipients || [])];
                            updateNestedData(['pointLeaders', 'recipients'], [
                              { year: '', player: '', team: '', stats: '', points: 0, games: 0, conference: '' },
                              ...recipients
                            ]);
                          }} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Point Leader
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {section.data.note && (
                          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            {section.data.note}
                          </div>
                        )}
                        <div className="space-y-2">
                          {(section.data.recipients || []).map((recipient: any, idx: number) => (
                            <div key={idx} className="bg-gray-50 border rounded p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge>{recipient.year || 'New Entry'}</Badge>
                                <div className="flex items-center gap-1">
                                  {idx > 0 && (
                                    <Button onClick={() => {
                                      const recipients = [...(section.data.recipients || [])];
                                      const temp = recipients[idx];
                                      recipients[idx] = recipients[idx - 1];
                                      recipients[idx - 1] = temp;
                                      updateNestedData(['pointLeaders', 'recipients'], recipients);
                                    }} variant="ghost" size="sm" className="h-6 w-6 p-0">
                                      <ChevronUp className="w-3 h-3" />
                                    </Button>
                                  )}
                                  {idx < (section.data.recipients || []).length - 1 && (
                                    <Button onClick={() => {
                                      const recipients = [...(section.data.recipients || [])];
                                      const temp = recipients[idx];
                                      recipients[idx] = recipients[idx + 1];
                                      recipients[idx + 1] = temp;
                                      updateNestedData(['pointLeaders', 'recipients'], recipients);
                                    }} variant="ghost" size="sm" className="h-6 w-6 p-0">
                                      <ChevronDown className="w-3 h-3" />
                                    </Button>
                                  )}
                                  <Button onClick={() => {
                                    const recipients = [...(section.data.recipients || [])];
                                    recipients.splice(idx, 1);
                                    updateNestedData(['pointLeaders', 'recipients'], recipients);
                                  }} variant="ghost" size="sm">
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">Year</Label>
                                  <Input value={recipient.year || ''} onChange={(e) => {
                                    const recipients = [...(section.data.recipients || [])];
                                    recipients[idx] = { ...recipients[idx], year: e.target.value };
                                    updateNestedData(['pointLeaders', 'recipients'], recipients);
                                  }} placeholder="2025" />
                                </div>
                                <div>
                                  <Label className="text-xs">Conference</Label>
                                  <Input value={recipient.conference || ''} onChange={(e) => {
                                    const recipients = [...(section.data.recipients || [])];
                                    recipients[idx] = { ...recipients[idx], conference: e.target.value };
                                    updateNestedData(['pointLeaders', 'recipients'], recipients);
                                  }} placeholder="North" />
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Player</Label>
                                <Input value={recipient.player || ''} onChange={(e) => {
                                  const recipients = [...(section.data.recipients || [])];
                                  recipients[idx] = { ...recipients[idx], player: e.target.value };
                                  updateNestedData(['pointLeaders', 'recipients'], recipients);
                                }} placeholder="#17 John Doe" />
                              </div>
                              <div>
                                <Label className="text-xs">Team</Label>
                                <Input value={recipient.team || ''} onChange={(e) => {
                                  const recipients = [...(section.data.recipients || [])];
                                  recipients[idx] = { ...recipients[idx], team: e.target.value };
                                  updateNestedData(['pointLeaders', 'recipients'], recipients);
                                }} placeholder="Team Name" />
                              </div>
                              <div>
                                <Label className="text-xs">Stats</Label>
                                <Input value={recipient.stats || ''} onChange={(e) => {
                                  const recipients = [...(section.data.recipients || [])];
                                  recipients[idx] = { ...recipients[idx], stats: e.target.value };
                                  updateNestedData(['pointLeaders', 'recipients'], recipients);
                                }} placeholder="46 goals; 54 assists" />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">Points</Label>
                                  <Input type="number" value={recipient.points || ''} onChange={(e) => {
                                    const recipients = [...(section.data.recipients || [])];
                                    recipients[idx] = { ...recipients[idx], points: e.target.value ? parseInt(e.target.value) || 0 : 0 };
                                    updateNestedData(['pointLeaders', 'recipients'], recipients);
                                  }} placeholder="100" />
                                </div>
                                <div>
                                  <Label className="text-xs">Games</Label>
                                  <Input type="number" value={recipient.games || ''} onChange={(e) => {
                                    const recipients = [...(section.data.recipients || [])];
                                    recipients[idx] = { ...recipients[idx], games: e.target.value ? parseInt(e.target.value) || 0 : 0 };
                                    updateNestedData(['pointLeaders', 'recipients'], recipients);
                                  }} placeholder="16" />
                                </div>
                              </div>
                            </div>
                          ))}
                          {(!section.data.recipients || section.data.recipients.length === 0) && (
                            <p className="text-sm text-gray-500 italic">No point leaders added yet. Click "Add Point Leader" to add one.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Division Awards */}
                {section.key === 'divisionAwards' && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          {editingHeading === 'divisionAwards' ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={section.data.title || ''}
                                onChange={(e) => {
                                  const newData = { ...data };
                                  if (!newData.divisionAwards) newData.divisionAwards = {};
                                  newData.divisionAwards.title = e.target.value;
                                  handleDataChange(newData);
                                }}
                                className="text-lg font-semibold"
                                placeholder="Division Awards Title"
                              />
                              <Button
                                onClick={() => setEditingHeading(null)}
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
                            <CardTitle className="cursor-pointer hover:text-blue-600" onClick={() => setEditingHeading('divisionAwards')}>
                              {section.data.title || 'Division Awards'}
                            </CardTitle>
                          )}
                          {section.data.description && (
                            <CardDescription>{section.data.description}</CardDescription>
                          )}
                        </div>
                        <Button onClick={() => {
                          const awards = [...(section.data.awards || [])];
                          updateNestedData(['divisionAwards', 'awards'], [
                            { name: '', recipients: [] },
                            ...awards
                          ]);
                        }} size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Award Category
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(section.data.awards || []).map((award: any, awardIdx: number) => (
                        <Card key={awardIdx} className="border-l-4 border-l-[#013fac]">
                          <CardHeader className="py-3">
                            <div className="flex items-center gap-2">
                              <Input
                                value={award.name || ''}
                                onChange={(e) => {
                                  const awards = [...(section.data.awards || [])];
                                  awards[awardIdx] = { ...awards[awardIdx], name: e.target.value };
                                  updateNestedData(['divisionAwards', 'awards'], awards);
                                }}
                                placeholder="Award Name"
                                className="font-semibold flex-1"
                              />
                              <Button onClick={() => {
                                const awards = [...(section.data.awards || [])];
                                awards.splice(awardIdx, 1);
                                updateNestedData(['divisionAwards', 'awards'], awards);
                              }} variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {award.description !== undefined && (
                              <TextareaWithLinkInserter
                                id={`divisionAwards-${awardIdx}-desc`}
                                label="Description (optional)"
                                value={award.description || ''}
                                onChange={(value) => {
                                  const awards = [...(section.data.awards || [])];
                                  awards[awardIdx] = { ...awards[awardIdx], description: value };
                                  updateNestedData(['divisionAwards', 'awards'], awards);
                                }}
                                rows={2}
                              />
                            )}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">Recipients</Label>
                                <Button
                                  onClick={() => {
                                    const awards = [...(section.data.awards || [])];
                                    const awardRecipients = [...(awards[awardIdx].recipients || [])];
                                    awardRecipients.push({ year: '', player: '', team: '' });
                                    awards[awardIdx] = { ...awards[awardIdx], recipients: awardRecipients };
                                    updateNestedData(['divisionAwards', 'awards'], awards);
                                  }}
                                  size="sm"
                                  variant="outline"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Recipient
                                </Button>
                              </div>
                              {(award.recipients || []).map((recipient: any, rIdx: number) => (
                                <div key={rIdx} className="flex items-center gap-2 bg-gray-50 rounded p-2">
                                  <Input
                                    value={recipient.year || ''}
                                    onChange={(e) => {
                                      const awards = [...(section.data.awards || [])];
                                      const awardRecipients = [...(awards[awardIdx].recipients || [])];
                                      awardRecipients[rIdx] = { ...awardRecipients[rIdx], year: e.target.value };
                                      awards[awardIdx] = { ...awards[awardIdx], recipients: awardRecipients };
                                      updateNestedData(['divisionAwards', 'awards'], awards);
                                    }}
                                    placeholder="Year"
                                    className="w-16 text-xs"
                                  />
                                  <Input
                                    value={recipient.player || ''}
                                    onChange={(e) => {
                                      const awards = [...(section.data.awards || [])];
                                      const awardRecipients = [...(awards[awardIdx].recipients || [])];
                                      awardRecipients[rIdx] = { ...awardRecipients[rIdx], player: e.target.value };
                                      awards[awardIdx] = { ...awards[awardIdx], recipients: awardRecipients };
                                      updateNestedData(['divisionAwards', 'awards'], awards);
                                    }}
                                    placeholder="Player"
                                    className="flex-1 text-xs"
                                  />
                                  <Input
                                    value={recipient.team || ''}
                                    onChange={(e) => {
                                      const awards = [...(section.data.awards || [])];
                                      const awardRecipients = [...(awards[awardIdx].recipients || [])];
                                      awardRecipients[rIdx] = { ...awardRecipients[rIdx], team: e.target.value };
                                      awards[awardIdx] = { ...awards[awardIdx], recipients: awardRecipients };
                                      updateNestedData(['divisionAwards', 'awards'], awards);
                                    }}
                                    placeholder="Team"
                                    className="flex-1 text-xs"
                                  />
                                  <Button
                                    onClick={() => {
                                      const awards = [...(section.data.awards || [])];
                                      const awardRecipients = [...(awards[awardIdx].recipients || [])];
                                      awardRecipients.splice(rIdx, 1);
                                      awards[awardIdx] = { ...awards[awardIdx], recipients: awardRecipients };
                                      updateNestedData(['divisionAwards', 'awards'], awards);
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                  >
                                    <Trash2 className="w-3 h-3 text-red-600" />
                                  </Button>
                                </div>
                              ))}
                              {(!award.recipients || award.recipients.length === 0) && (
                                <p className="text-xs text-gray-500 italic">No recipients added yet.</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {(!section.data.awards || section.data.awards.length === 0) && (
                        <p className="text-sm text-gray-500 italic">No award categories added yet. Click "Add Award Category" to add one.</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Tournaments */}
                {section.key === 'tournaments' && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          {editingHeading === 'tournaments' ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={section.data.title || ''}
                                onChange={(e) => {
                                  const newData = { ...data };
                                  if (!newData.tournaments) newData.tournaments = {};
                                  newData.tournaments.title = e.target.value;
                                  handleDataChange(newData);
                                }}
                                className="text-lg font-semibold"
                                placeholder="Tournaments Title"
                              />
                              <Button
                                onClick={() => setEditingHeading(null)}
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
                            <CardTitle className="cursor-pointer hover:text-blue-600" onClick={() => setEditingHeading('tournaments')}>
                              {section.data.title || 'Tournaments'}
                            </CardTitle>
                          )}
                          {section.data.description && (
                            <CardDescription>{section.data.description}</CardDescription>
                          )}
                        </div>
                        <Button onClick={() => {
                          const events = [...(section.data.events || [])];
                          updateNestedData(['tournaments', 'events'], [
                            { year: '', name: '', trophy: '', result: '' },
                            ...events
                          ]);
                        }} size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Tournament
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {(section.data.events || []).map((event: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 border rounded p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge>{event.year || 'New Entry'}</Badge>
                            <div className="flex items-center gap-1">
                              {idx > 0 && (
                                <Button onClick={() => {
                                  const events = [...(section.data.events || [])];
                                  const temp = events[idx];
                                  events[idx] = events[idx - 1];
                                  events[idx - 1] = temp;
                                  updateNestedData(['tournaments', 'events'], events);
                                }} variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <ChevronUp className="w-3 h-3" />
                                </Button>
                              )}
                              {idx < (section.data.events || []).length - 1 && (
                                <Button onClick={() => {
                                  const events = [...(section.data.events || [])];
                                  const temp = events[idx];
                                  events[idx] = events[idx + 1];
                                  events[idx + 1] = temp;
                                  updateNestedData(['tournaments', 'events'], events);
                                }} variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <ChevronDown className="w-3 h-3" />
                                </Button>
                              )}
                              <Button onClick={() => {
                                const events = [...(section.data.events || [])];
                                events.splice(idx, 1);
                                updateNestedData(['tournaments', 'events'], events);
                              }} variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Year</Label>
                              <Input value={event.year || ''} onChange={(e) => {
                                const events = [...(section.data.events || [])];
                                events[idx] = { ...events[idx], year: e.target.value };
                                updateNestedData(['tournaments', 'events'], events);
                              }} placeholder="2025" />
                            </div>
                            <div>
                              <Label className="text-xs">Trophy</Label>
                              <Input value={event.trophy || ''} onChange={(e) => {
                                const events = [...(section.data.events || [])];
                                events[idx] = { ...events[idx], trophy: e.target.value };
                                updateNestedData(['tournaments', 'events'], events);
                              }} placeholder="Trophy Name" />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Tournament Name</Label>
                            <Input value={event.name || ''} onChange={(e) => {
                              const events = [...(section.data.events || [])];
                              events[idx] = { ...events[idx], name: e.target.value };
                              updateNestedData(['tournaments', 'events'], events);
                            }} placeholder="Tournament Name" />
                          </div>
                          <div>
                            <Label className="text-xs">Result</Label>
                            <Input value={event.result || ''} onChange={(e) => {
                              const events = [...(section.data.events || [])];
                              events[idx] = { ...events[idx], result: e.target.value };
                              updateNestedData(['tournaments', 'events'], events);
                            }} placeholder="Result" />
                          </div>
                        </div>
                      ))}
                      {(!section.data.events || section.data.events.length === 0) && (
                        <p className="text-sm text-gray-500 italic">No tournaments added yet. Click "Add Tournament" to add one.</p>
                      )}
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

  // Junior A structure (uses winners instead of recipients)
  if (dataStructure === 'juniorA') {
    const sections: any[] = [];
    if (data.pointLeaders !== undefined) sections.push({ key: 'pointLeaders', label: 'Point Leaders', data: data.pointLeaders });
    if (data.divisionAwards !== undefined) sections.push({ key: 'divisionAwards', label: 'Division Awards', data: data.divisionAwards });
    if (data.tournaments !== undefined) sections.push({ key: 'tournaments', label: 'Tournaments', data: data.tournaments });

    if (sections.length > 0 && !activeTab.startsWith('juniorA-')) {
      setActiveTab(`juniorA-${sections[0].key}`);
    }

    const isJuniorAFormat = data.pointLeaders?.winners !== undefined;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Visual Editor</Badge>
            <Badge variant="secondary">{divisionName}</Badge>
            <Badge variant="outline">Junior A Format</Badge>
          </div>
          <Button onClick={() => setMode('json')} variant="outline" size="sm">
            <Code className="w-4 h-4 mr-2" />
            JSON Editor
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
            {sections.map(section => (
              <TabsTrigger key={section.key} value={`juniorA-${section.key}`}>
                {section.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {sections.map(section => (
            <TabsContent key={section.key} value={`juniorA-${section.key}`} className="space-y-4">
              {/* Point Leaders - Junior A Format */}
              {section.key === 'pointLeaders' && (
                <>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          {editingHeading === 'juniorA-pointLeaders' ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={section.data.title || ''}
                                onChange={(e) => {
                                  const newData = { ...data };
                                  if (!newData.pointLeaders) newData.pointLeaders = {};
                                  newData.pointLeaders.title = e.target.value;
                                  handleDataChange(newData);
                                }}
                                className="text-lg font-semibold"
                                placeholder="Point Leaders Title"
                              />
                              <Button
                                onClick={() => setEditingHeading(null)}
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
                            <CardTitle className="cursor-pointer hover:text-blue-600" onClick={() => setEditingHeading('juniorA-pointLeaders')}>
                              {section.data.title || 'Point Leaders'}
                            </CardTitle>
                          )}
                          {section.data.description && (
                            <CardDescription>{section.data.description}</CardDescription>
                          )}
                          {section.data.award && (
                            <CardDescription>{section.data.award}</CardDescription>
                          )}
                        </div>
                        <Button onClick={() => {
                          if (isJuniorAFormat) {
                            const winners = [...(section.data.winners || [])];
                            updateNestedData(['pointLeaders', 'winners'], [
                              { year: '', player: '', team: '', stats: '' },
                              ...winners
                            ]);
                          } else {
                            const recipients = [...(section.data.recipients || [])];
                            updateNestedData(['pointLeaders', 'recipients'], [
                              { year: '', player: '', team: '', stats: '', points: 0, games: 0 },
                              ...recipients
                            ]);
                          }
                        }} size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add {isJuniorAFormat ? 'Winner' : 'Point Leader'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {section.data.note && (
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                          {section.data.note}
                        </div>
                      )}
                      <div className="space-y-2">
                        {(isJuniorAFormat ? (section.data.winners || []) : (section.data.recipients || [])).map((item: any, idx: number) => (
                          <div key={idx} className="bg-gray-50 border rounded p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge>{item.year || 'New Entry'}</Badge>
                              <div className="flex items-center gap-1">
                                {idx > 0 && (
                                  <Button onClick={() => {
                                    const list = [...(isJuniorAFormat ? (section.data.winners || []) : (section.data.recipients || []))];
                                    const temp = list[idx];
                                    list[idx] = list[idx - 1];
                                    list[idx - 1] = temp;
                                    updateNestedData(['pointLeaders', isJuniorAFormat ? 'winners' : 'recipients'], list);
                                  }} variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <ChevronUp className="w-3 h-3" />
                                  </Button>
                                )}
                                {idx < (isJuniorAFormat ? (section.data.winners || []) : (section.data.recipients || [])).length - 1 && (
                                  <Button onClick={() => {
                                    const list = [...(isJuniorAFormat ? (section.data.winners || []) : (section.data.recipients || []))];
                                    const temp = list[idx];
                                    list[idx] = list[idx + 1];
                                    list[idx + 1] = temp;
                                    updateNestedData(['pointLeaders', isJuniorAFormat ? 'winners' : 'recipients'], list);
                                  }} variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <ChevronDown className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button onClick={() => {
                                  const list = [...(isJuniorAFormat ? (section.data.winners || []) : (section.data.recipients || []))];
                                  list.splice(idx, 1);
                                  updateNestedData(['pointLeaders', isJuniorAFormat ? 'winners' : 'recipients'], list);
                                }} variant="ghost" size="sm">
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Year</Label>
                                <Input value={item.year || ''} onChange={(e) => {
                                  const list = [...(isJuniorAFormat ? (section.data.winners || []) : (section.data.recipients || []))];
                                  list[idx] = { ...list[idx], year: e.target.value };
                                  updateNestedData(['pointLeaders', isJuniorAFormat ? 'winners' : 'recipients'], list);
                                }} placeholder="2025" />
                              </div>
                              <div>
                                <Label className="text-xs">Team</Label>
                                <Input value={item.team || ''} onChange={(e) => {
                                  const list = [...(isJuniorAFormat ? (section.data.winners || []) : (section.data.recipients || []))];
                                  list[idx] = { ...list[idx], team: e.target.value };
                                  updateNestedData(['pointLeaders', isJuniorAFormat ? 'winners' : 'recipients'], list);
                                }} placeholder="Team Name" />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Player</Label>
                              <Input value={item.player || ''} onChange={(e) => {
                                const list = [...(isJuniorAFormat ? (section.data.winners || []) : (section.data.recipients || []))];
                                list[idx] = { ...list[idx], player: e.target.value };
                                updateNestedData(['pointLeaders', isJuniorAFormat ? 'winners' : 'recipients'], list);
                              }} placeholder="#17 John Doe" />
                            </div>
                            <div>
                              <Label className="text-xs">Stats</Label>
                              <Input value={item.stats || ''} onChange={(e) => {
                                const list = [...(isJuniorAFormat ? (section.data.winners || []) : (section.data.recipients || []))];
                                list[idx] = { ...list[idx], stats: e.target.value };
                                updateNestedData(['pointLeaders', isJuniorAFormat ? 'winners' : 'recipients'], list);
                              }} placeholder="46 goals; 54 assists" />
                            </div>
                            {!isJuniorAFormat && (
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">Points</Label>
                                  <Input type="number" value={item.points || ''} onChange={(e) => {
                                    const list = [...(section.data.recipients || [])];
                                    list[idx] = { ...list[idx], points: e.target.value ? parseInt(e.target.value) || 0 : 0 };
                                    updateNestedData(['pointLeaders', 'recipients'], list);
                                  }} placeholder="100" />
                                </div>
                                <div>
                                  <Label className="text-xs">Games</Label>
                                  <Input type="number" value={item.games || ''} onChange={(e) => {
                                    const list = [...(section.data.recipients || [])];
                                    list[idx] = { ...list[idx], games: e.target.value ? parseInt(e.target.value) || 0 : 0 };
                                    updateNestedData(['pointLeaders', 'recipients'], list);
                                  }} placeholder="16" />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        {((isJuniorAFormat ? (section.data.winners || []) : (section.data.recipients || [])).length === 0 && (
                          <p className="text-sm text-gray-500 italic">
                            No {isJuniorAFormat ? 'winners' : 'point leaders'} added yet. Click the Add button above to add one.
                          </p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Division Awards - Junior A Format (uses categories instead of awards) */}
              {section.key === 'divisionAwards' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        {editingHeading === 'juniorA-divisionAwards' ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={section.data.title || ''}
                              onChange={(e) => {
                                const newData = { ...data };
                                if (!newData.divisionAwards) newData.divisionAwards = {};
                                newData.divisionAwards.title = e.target.value;
                                handleDataChange(newData);
                              }}
                              className="text-lg font-semibold"
                              placeholder="Division Awards Title"
                            />
                            <Button
                              onClick={() => setEditingHeading(null)}
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
                          <CardTitle className="cursor-pointer hover:text-blue-600" onClick={() => setEditingHeading('juniorA-divisionAwards')}>
                            {section.data.title || 'Division Awards'}
                          </CardTitle>
                        )}
                        {section.data.description && (
                          <CardDescription>{section.data.description}</CardDescription>
                        )}
                      </div>
                      <Button onClick={() => {
                        const list = section.data.categories || section.data.awards || [];
                        updateNestedData(['divisionAwards', section.data.categories ? 'categories' : 'awards'], [
                          { name: '', winners: [], recipients: [] },
                          ...list
                        ]);
                      }} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Award Category
                      </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(section.data.categories || section.data.awards || []).map((award: any, awardIdx: number) => (
                        <Card key={awardIdx} className="border-l-4 border-l-[#013fac]">
                          <CardHeader className="py-3">
                            <div className="flex items-center gap-2">
                              <Input
                                value={award.name || ''}
                                onChange={(e) => {
                                  const list = [...(section.data.categories || section.data.awards || [])];
                                  list[awardIdx] = { ...list[awardIdx], name: e.target.value };
                                  updateNestedData(['divisionAwards', section.data.categories ? 'categories' : 'awards'], list);
                                }}
                                placeholder="Award Name"
                                className="font-semibold flex-1"
                              />
                              <Button onClick={() => {
                                const list = [...(section.data.categories || section.data.awards || [])];
                                list.splice(awardIdx, 1);
                                updateNestedData(['divisionAwards', section.data.categories ? 'categories' : 'awards'], list);
                              }} variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {award.description !== undefined && (
                              <TextareaWithLinkInserter
                                id={`juniorA-divisionAwards-${awardIdx}-desc`}
                                label="Description (optional)"
                                value={award.description || ''}
                                onChange={(value) => {
                                  const list = [...(section.data.categories || section.data.awards || [])];
                                  list[awardIdx] = { ...list[awardIdx], description: value };
                                  updateNestedData(['divisionAwards', section.data.categories ? 'categories' : 'awards'], list);
                                }}
                                rows={2}
                              />
                            )}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">Recipients</Label>
                                <Button
                                  onClick={() => {
                                    const awardRecipients = [...(award.winners || award.recipients || [])];
                                    awardRecipients.push({ year: '', player: '', team: '' });
                                    const list = [...(section.data.categories || section.data.awards || [])];
                                    list[awardIdx] = { ...list[awardIdx], winners: awardRecipients, recipients: awardRecipients };
                                    updateNestedData(['divisionAwards', section.data.categories ? 'categories' : 'awards'], list);
                                  }}
                                  size="sm"
                                  variant="outline"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Recipient
                                </Button>
                              </div>
                              {(award.winners || award.recipients || []).map((recipient: any, rIdx: number) => (
                                <div key={rIdx} className="flex items-center gap-2 bg-gray-50 rounded p-2">
                                  <Input
                                    value={recipient.year || ''}
                                    onChange={(e) => {
                                      const awardRecipients = [...(award.winners || award.recipients || [])];
                                      awardRecipients[rIdx] = { ...awardRecipients[rIdx], year: e.target.value };
                                      const list = [...(section.data.categories || section.data.awards || [])];
                                      list[awardIdx] = { ...list[awardIdx], winners: awardRecipients, recipients: awardRecipients };
                                      updateNestedData(['divisionAwards', section.data.categories ? 'categories' : 'awards'], list);
                                    }}
                                    placeholder="Year"
                                    className="w-16 text-xs"
                                  />
                                  <Input
                                    value={recipient.player || ''}
                                    onChange={(e) => {
                                      const awardRecipients = [...(award.winners || award.recipients || [])];
                                      awardRecipients[rIdx] = { ...awardRecipients[rIdx], player: e.target.value };
                                      const list = [...(section.data.categories || section.data.awards || [])];
                                      list[awardIdx] = { ...list[awardIdx], winners: awardRecipients, recipients: awardRecipients };
                                      updateNestedData(['divisionAwards', section.data.categories ? 'categories' : 'awards'], list);
                                    }}
                                    placeholder="Player"
                                    className="flex-1 text-xs"
                                  />
                                  <Input
                                    value={recipient.team || ''}
                                    onChange={(e) => {
                                      const awardRecipients = [...(award.winners || award.recipients || [])];
                                      awardRecipients[rIdx] = { ...awardRecipients[rIdx], team: e.target.value };
                                      const list = [...(section.data.categories || section.data.awards || [])];
                                      list[awardIdx] = { ...list[awardIdx], winners: awardRecipients, recipients: awardRecipients };
                                      updateNestedData(['divisionAwards', section.data.categories ? 'categories' : 'awards'], list);
                                    }}
                                    placeholder="Team"
                                    className="flex-1 text-xs"
                                  />
                                  <Button
                                    onClick={() => {
                                      const awardRecipients = [...(award.winners || award.recipients || [])];
                                      awardRecipients.splice(rIdx, 1);
                                      const list = [...(section.data.categories || section.data.awards || [])];
                                      list[awardIdx] = { ...list[awardIdx], winners: awardRecipients, recipients: awardRecipients };
                                      updateNestedData(['divisionAwards', section.data.categories ? 'categories' : 'awards'], list);
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                  >
                                    <Trash2 className="w-3 h-3 text-red-600" />
                                  </Button>
                                </div>
                              ))}
                              {(!award.winners && !award.recipients || award.winners.length === 0 && award.recipients.length === 0) && (
                                <p className="text-xs text-gray-500 italic">No recipients added yet.</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {(!section.data.categories && !section.data.awards || (section.data.categories?.length === 0 && section.data.awards?.length === 0)) && (
                        <p className="text-sm text-gray-500 italic">No award categories added yet. Click "Add Award Category" to add one.</p>
                      )}
                    </CardContent>
                  </Card>
                )}

              {/* Tournaments - same as standard */}
              {section.key === 'tournaments' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        {editingHeading === 'juniorA-tournaments' ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={section.data.title || ''}
                              onChange={(e) => {
                                const newData = { ...data };
                                if (!newData.tournaments) newData.tournaments = {};
                                newData.tournaments.title = e.target.value;
                                handleDataChange(newData);
                              }}
                              className="text-lg font-semibold"
                              placeholder="Tournaments Title"
                            />
                            <Button
                              onClick={() => setEditingHeading(null)}
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
                          <CardTitle className="cursor-pointer hover:text-blue-600" onClick={() => setEditingHeading('juniorA-tournaments')}>
                            {section.data.title || 'Tournaments'}
                          </CardTitle>
                        )}
                        {section.data.description && (
                          <CardDescription>{section.data.description}</CardDescription>
                        )}
                      </div>
                      <Button onClick={() => {
                        const events = [...(section.data.events || [])];
                        updateNestedData(['tournaments', 'events'], [
                          { year: '', name: '', trophy: '', result: '' },
                          ...events
                        ]);
                      }} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Tournament
                      </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {(section.data.events || []).map((event: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 border rounded p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge>{event.year || 'New Entry'}</Badge>
                            <div className="flex items-center gap-1">
                              {idx > 0 && (
                                <Button onClick={() => {
                                  const events = [...(section.data.events || [])];
                                  const temp = events[idx];
                                  events[idx] = events[idx - 1];
                                  events[idx - 1] = temp;
                                  updateNestedData(['tournaments', 'events'], events);
                                }} variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <ChevronUp className="w-3 h-3" />
                                </Button>
                              )}
                              {idx < (section.data.events || []).length - 1 && (
                                <Button onClick={() => {
                                  const events = [...(section.data.events || [])];
                                  const temp = events[idx];
                                  events[idx] = events[idx + 1];
                                  events[idx + 1] = temp;
                                  updateNestedData(['tournaments', 'events'], events);
                                }} variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <ChevronDown className="w-3 h-3" />
                                </Button>
                              )}
                              <Button onClick={() => {
                                const events = [...(section.data.events || [])];
                                events.splice(idx, 1);
                                updateNestedData(['tournaments', 'events'], events);
                              }} variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Year</Label>
                              <Input value={event.year || ''} onChange={(e) => {
                                const events = [...(section.data.events || [])];
                                events[idx] = { ...events[idx], year: e.target.value };
                                updateNestedData(['tournaments', 'events'], events);
                              }} placeholder="2025" />
                            </div>
                            <div>
                              <Label className="text-xs">Trophy</Label>
                              <Input value={event.trophy || ''} onChange={(e) => {
                                const events = [...(section.data.events || [])];
                                events[idx] = { ...events[idx], trophy: e.target.value };
                                updateNestedData(['tournaments', 'events'], events);
                              }} placeholder="Trophy Name" />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Tournament Name</Label>
                            <Input value={event.name || ''} onChange={(e) => {
                              const events = [...(section.data.events || [])];
                              events[idx] = { ...events[idx], name: e.target.value };
                              updateNestedData(['tournaments', 'events'], events);
                            }} placeholder="Tournament Name" />
                          </div>
                          <div>
                            <Label className="text-xs">Result</Label>
                            <Input value={event.result || ''} onChange={(e) => {
                              const events = [...(section.data.events || [])];
                              events[idx] = { ...events[idx], result: e.target.value };
                              updateNestedData(['tournaments', 'events'], events);
                            }} placeholder="Result" />
                          </div>
                        </div>
                      ))}
                      {(!section.data.events || section.data.events.length === 0) && (
                        <p className="text-sm text-gray-500 italic">No tournaments added yet. Click "Add Tournament" to add one.</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
        
      </div>
    );
  }

  // Empty or unknown structure - show helpful UI
  const hasData = data && Object.keys(data).length > 0;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Visual Editor</Badge>
          <Badge variant="secondary">{divisionName}</Badge>
          {!hasData && <Badge variant="destructive">Empty</Badge>}
          {hasData && <Badge variant="outline">Unknown Format</Badge>}
        </div>
        <Button onClick={() => setMode('json')} variant="outline" size="sm">
          <Code className="w-4 h-4 mr-2" />
          JSON Editor
        </Button>
      </div>

      {!hasData ? (
        <>
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              <div className="flex flex-col gap-3">
                <span className="font-semibold">No awards data found for {divisionName}.</span>
                <p className="text-sm">Choose a template to get started:</p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => createDefaultStructure('standard')}
                    size="sm"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Standard Awards
                  </Button>
                  <Button
                    onClick={() => createDefaultStructure('conference')}
                    size="sm"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Conference Awards
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
              <li>• <strong>Standard Awards:</strong> Point Leaders, Division Awards, Tournaments (single division)</li>
              <li>• <strong>Conference Awards:</strong> North/South conferences with separate awards per conference</li>
            </ul>
          </div>
        </>
      ) : (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex flex-col gap-2">
              <span className="font-semibold">Awards data is in an unrecognized format.</span>
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
      )}
    </div>
  );
}