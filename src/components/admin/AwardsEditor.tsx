import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Plus, Trash2, AlertCircle, Code, Eye, ChevronUp, ChevronDown, Edit2, Check, X } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { TextareaWithLinkInserter } from './TextareaWithLinkInserter';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

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
    if (data.pointLeaders || data.divisionAwards || data.tournaments) return 'standard';
    if (Array.isArray(data)) return 'array';
    return 'unknown';
  };

  const dataStructure = getDataStructure();

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
              {conf.data.pointLeaders && (
                <Card>
                  <CardHeader>
                    <CardTitle>{conf.data.pointLeaders.title || 'Point Leaders'}</CardTitle>
                    <CardDescription>{conf.data.pointLeaders.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {conf.data.pointLeaders.note && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        {conf.data.pointLeaders.note}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Point Leaders</Label>
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
                    <div className="space-y-2">
                      {(conf.data.pointLeaders.recipients || []).map((recipient: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded p-2">
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
                          }} placeholder="Stats" className="flex-1 text-xs" />
                          <Button onClick={() => {
                            const recipients = [...(conf.data.pointLeaders.recipients || [])];
                            recipients.splice(idx, 1);
                            updateNestedData([conf.key, 'pointLeaders', 'recipients'], recipients);
                          }} variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <X className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Division Awards */}
              {conf.data.divisionAwards?.awards && (
                <Card>
                  <CardHeader>
                    <CardTitle>{conf.data.divisionAwards.title || 'Division Awards'}</CardTitle>
                    <CardDescription>{conf.data.divisionAwards.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {conf.data.divisionAwards.awards.map((award: any, awardIdx: number) => (
                      <Card key={awardIdx} className="border-l-4 border-l-[#013fac]">
                        <CardHeader className="py-3">
                          <Input
                            value={award.name || ''}
                            onChange={(e) => {
                              const awards = [...(conf.data.divisionAwards.awards || [])];
                              awards[awardIdx] = { ...awards[awardIdx], name: e.target.value };
                              updateNestedData([conf.key, 'divisionAwards', 'awards'], awards);
                            }}
                            placeholder="Award Name"
                            className="font-semibold"
                          />
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Recipients</Label>
                            {(award.recipients || []).map((recipient: any, recipientIdx: number) => (
                              <div key={recipientIdx} className="flex items-center gap-2 bg-gray-50 rounded p-2">
                                <Input value={recipient.year || ''} onChange={(e) => {
                                  const awards = [...(conf.data.divisionAwards.awards || [])];
                                  const recipients = [...(awards[awardIdx]?.recipients || [])];
                                  recipients[recipientIdx] = { ...recipients[recipientIdx], year: e.target.value };
                                  awards[awardIdx] = { ...awards[awardIdx], recipients };
                                  updateNestedData([conf.key, 'divisionAwards', 'awards'], awards);
                                }} placeholder="Year" className="w-16 text-xs" />
                                <Input value={recipient.player || ''} onChange={(e) => {
                                  const awards = [...(conf.data.divisionAwards.awards || [])];
                                  const recipients = [...(awards[awardIdx]?.recipients || [])];
                                  recipients[recipientIdx] = { ...recipients[recipientIdx], player: e.target.value };
                                  awards[awardIdx] = { ...awards[awardIdx], recipients };
                                  updateNestedData([conf.key, 'divisionAwards', 'awards'], awards);
                                }} placeholder="Player" className="flex-1 text-xs" />
                                <Input value={recipient.team || ''} onChange={(e) => {
                                  const awards = [...(conf.data.divisionAwards.awards || [])];
                                  const recipients = [...(awards[awardIdx]?.recipients || [])];
                                  recipients[recipientIdx] = { ...recipients[recipientIdx], team: e.target.value };
                                  awards[awardIdx] = { ...awards[awardIdx], recipients };
                                  updateNestedData([conf.key, 'divisionAwards', 'awards'], awards);
                                }} placeholder="Team" className="flex-1 text-xs" />
                                <Button onClick={() => {
                                  const awards = [...(conf.data.divisionAwards.awards || [])];
                                  const recipients = [...(awards[awardIdx]?.recipients || [])];
                                  recipients.splice(recipientIdx, 1);
                                  awards[awardIdx] = { ...awards[awardIdx], recipients };
                                  updateNestedData([conf.key, 'divisionAwards', 'awards'], awards);
                                }} variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <X className="w-3 h-3 text-red-600" />
                                </Button>
                              </div>
                            ))}
                            <Button onClick={() => {
                              const awards = [...(conf.data.divisionAwards.awards || [])];
                              const recipients = [...(awards[awardIdx]?.recipients || [])];
                              recipients.push({ year: '', player: '', team: '' });
                              awards[awardIdx] = { ...awards[awardIdx], recipients };
                              updateNestedData([conf.key, 'divisionAwards', 'awards'], awards);
                            }} size="sm" variant="outline" className="text-xs">
                              <Plus className="w-3 h-3 mr-1" /> Add Recipient
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
    if (data.pointLeaders) sections.push({ key: 'pointLeaders', label: 'Point Leaders', data: data.pointLeaders });
    if (data.divisionAwards?.awards) sections.push({ key: 'divisionAwards', label: 'Division Awards', data: data.divisionAwards });
    if (data.tournaments?.events) sections.push({ key: 'tournaments', label: 'Tournaments', data: data.tournaments });

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
                        <CardTitle>{section.data.title || 'Point Leaders'}</CardTitle>
                        <CardDescription>{section.data.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {section.data.note && (
                          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            {section.data.note}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">Point Leaders</Label>
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
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Division Awards */}
                {section.key === 'divisionAwards' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{section.data.title || 'Division Awards'}</CardTitle>
                      <CardDescription>{section.data.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {(section.data.awards || section.data.categories || []).map((award: any, awardIdx: number) => (
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
                              <TextareaWithLinkInserter
                                id={`divisionAwards-${awardIdx}-desc`}
                                label="Description (optional)"
                                value={award.description || ''}
                                onChange={(value) => {
                                  const awards = [...(section.data.awards || [])];
                                  awards[awardIdx] = { ...awards[awardIdx], description: value };
                                  updateNestedData(['divisionAwards', 'awards'], awards);
                                }}
                                rows={1}
                              />
                              <div className="space-y-1">
                                <Label className="text-xs">Recipients</Label>
                                {(award.recipients || []).map((recipient: any, recipientIdx: number) => (
                                  <div key={recipientIdx} className="flex items-center gap-2 bg-gray-50 rounded p-2">
                                    <Input value={recipient.year || ''} onChange={(e) => {
                                      const awards = [...(section.data.awards || [])];
                                      const recipients = [...(awards[awardIdx]?.recipients || [])];
                                      recipients[recipientIdx] = { ...recipients[recipientIdx], year: e.target.value };
                                      awards[awardIdx] = { ...awards[awardIdx], recipients };
                                      updateNestedData(['divisionAwards', 'awards'], awards);
                                    }} placeholder="Year" className="w-16 text-xs" />
                                    <Input value={recipient.player || ''} onChange={(e) => {
                                      const awards = [...(section.data.awards || [])];
                                      const recipients = [...(awards[awardIdx]?.recipients || [])];
                                      recipients[recipientIdx] = { ...recipients[recipientIdx], player: e.target.value };
                                      awards[awardIdx] = { ...awards[awardIdx], recipients };
                                      updateNestedData(['divisionAwards', 'awards'], awards);
                                    }} placeholder="Player" className="flex-1 text-xs" />
                                    <Input value={recipient.team || ''} onChange={(e) => {
                                      const awards = [...(section.data.awards || [])];
                                      const recipients = [...(awards[awardIdx]?.recipients || [])];
                                      recipients[recipientIdx] = { ...recipients[recipientIdx], team: e.target.value };
                                      awards[awardIdx] = { ...awards[awardIdx], recipients };
                                      updateNestedData(['divisionAwards', 'awards'], awards);
                                    }} placeholder="Team" className="flex-1 text-xs" />
                                    <Input value={recipient.conference || ''} onChange={(e) => {
                                      const awards = [...(section.data.awards || [])];
                                      const recipients = [...(awards[awardIdx]?.recipients || [])];
                                      recipients[recipientIdx] = { ...recipients[recipientIdx], conference: e.target.value };
                                      awards[awardIdx] = { ...awards[awardIdx], recipients };
                                      updateNestedData(['divisionAwards', 'awards'], awards);
                                    }} placeholder="Conference" className="w-20 text-xs" />
                                    <Button onClick={() => {
                                      const awards = [...(section.data.awards || [])];
                                      const recipients = [...(awards[awardIdx]?.recipients || [])];
                                      recipients.splice(recipientIdx, 1);
                                      awards[awardIdx] = { ...awards[awardIdx], recipients };
                                      updateNestedData(['divisionAwards', 'awards'], awards);
                                    }} variant="ghost" size="sm" className="h-6 w-6 p-0">
                                      <X className="w-3 h-3 text-red-600" />
                                    </Button>
                                  </div>
                                ))}
                                <Button onClick={() => {
                                  const awards = [...(section.data.awards || [])];
                                  const recipients = [...(awards[awardIdx]?.recipients || [])];
                                  recipients.push({ year: '', player: '', team: '', conference: '' });
                                  awards[awardIdx] = { ...awards[awardIdx], recipients };
                                  updateNestedData(['divisionAwards', 'awards'], awards);
                                }} size="sm" variant="outline" className="text-xs">
                                  <Plus className="w-3 h-3 mr-1" /> Add Recipient
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tournaments */}
                {section.key === 'tournaments' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{section.data.title || 'Tournaments'}</CardTitle>
                      <CardDescription>{section.data.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Tournament Events</Label>
                        <Button onClick={() => {
                          const events = [...(section.data.events || [])];
                          updateNestedData(['tournaments', 'events'], [
                            { year: '', name: '', trophy: '', result: '' },
                            ...events
                          ]);
                        }} size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Event
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {(section.data.events || []).map((event: any, idx: number) => (
                          <div key={idx} className="bg-gray-50 border rounded p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge>{event.year || 'New Event'}</Badge>
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

  // Empty or unknown structure
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

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No awards data found. Use the JSON Editor to add award data.
        </AlertDescription>
      </Alert>
    </div>
  );
}