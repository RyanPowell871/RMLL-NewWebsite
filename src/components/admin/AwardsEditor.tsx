import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Plus, Trash2, AlertCircle, Code, Eye, ChevronUp, ChevronDown, Edit2, Check, X } from 'lucide-react';
import { TextareaWithLinkInserter } from './TextareaWithLinkInserter';

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

interface AwardData {
  title?: string;
  description?: string;
  recipients?: Array<{
    year?: string;
    player?: string;
    team?: string;
    stats?: string;
    points?: number;
    games?: number;
    note?: string;
  }>;
}

interface AwardsDisplayData {
  __metadata?: Record<string, AwardSection>;
  [key: string]: AwardData;
}

const DEFAULT_SECTIONS: AwardSection[] = [
  { id: 'pointLeaders', title: 'Point Leaders Award', collapsible: true, order: 0 },
  { id: 'allStarTeams', title: 'All-Star Teams', collapsible: true, order: 1 },
  { id: 'rookieOfTheYear', title: 'Rookie of the Year', collapsible: true, order: 2 },
  { id: 'mvp', title: 'Most Valuable Player', collapsible: true, order: 3 },
  { id: 'defensivePlayer', title: 'Defensive Player of the Year', collapsible: true, order: 4 },
  { id: 'coachOfTheYear', title: 'Coach of the Year', collapsible: true, order: 5 },
];

const DEFAULT_AWARD_DATA: AwardData = {
  title: '',
  description: '',
  recipients: [],
};

export function AwardsEditor({ value, onChange, divisionName }: AwardsEditorProps) {
  const [mode, setMode] = useState<'visual' | 'json'>('visual');
  const [data, setData] = useState<AwardsDisplayData>({});
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState(value || '{}');
  const [sections, setSections] = useState<AwardSection[]>([]);
  const [editingHeading, setEditingHeading] = useState<string | null>(null);

  // Parse JSON on mount and when value changes from outside
  useEffect(() => {
    try {
      if (value && typeof value === 'string' && value.trim()) {
        const parsed = JSON.parse(value) as AwardsDisplayData;
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

  const handleDataChange = (newData: AwardsDisplayData) => {
    setData(newData);
    const jsonString = JSON.stringify(newData, null, 2);
    setJsonText(jsonString);
    onChange(jsonString);
  };

  // Helper to safely update nested data
  const updateNestedData = (sectionKey: string, fieldPath: string[], value: any) => {
    const newData = JSON.parse(JSON.stringify(data));
    if (!newData[sectionKey]) {
      newData[sectionKey] = { ...DEFAULT_AWARD_DATA };
    }
    let current = newData[sectionKey];
    for (let i = 0; i < fieldPath.length - 1; i++) {
      if (!current[fieldPath[i]]) current[fieldPath[i]] = {};
      current = current[fieldPath[i]];
    }
    current[fieldPath[fieldPath.length - 1]] = value;
    handleDataChange(newData);
  };

  const getDefaultTitle = (key: string): string => {
    switch (key) {
      case 'pointLeaders': return 'Point Leaders Award';
      case 'allStarTeams': return 'All-Star Teams';
      case 'rookieOfTheYear': return 'Rookie of the Year';
      case 'mvp': return 'Most Valuable Player';
      case 'defensivePlayer': return 'Defensive Player of the Year';
      case 'coachOfTheYear': return 'Coach of the Year';
      case 'north': return 'North Conference';
      case 'south': return 'South Conference';
      default: return key.charAt(0).toUpperCase() + key.slice(1);
    }
  };

  const updateSectionMetadata = (sectionIdx: number, updates: Partial<AwardSection>) => {
    const newSections = [...sections];
    newSections[sectionIdx] = { ...newSections[sectionIdx], ...updates };

    // Update metadata in data
    const section = newSections[sectionIdx];
    const metadata = { ...data.__metadata };
    metadata[section.id] = {
      title: section.title,
      heading: section.heading,
      collapsible: section.collapsible,
      collapsed: section.collapsed,
      order: section.order,
    };

    handleDataChange({ ...data, __metadata: metadata });
    setSections(newSections);
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

    // Update all section metadata
    const metadata = { ...data.__metadata };
    newSections.forEach((section) => {
      metadata[section.id] = {
        title: section.title,
        heading: section.heading,
        collapsible: section.collapsible,
        collapsed: section.collapsed,
        order: section.order,
      };
    });

    handleDataChange({ ...data, __metadata: metadata });
    setSections(newSections);
  };

  const toggleCollapsible = (idx: number) => {
    updateSectionMetadata(idx, { collapsible: !sections[idx].collapsible });
  };

  const toggleCollapsed = (idx: number) => {
    updateSectionMetadata(idx, { collapsed: !sections[idx].collapsed });
  };

  const startEditHeading = (idx: number) => {
    setEditingHeading(sections[idx].id);
  };

  const saveHeading = (idx: number, value: string) => {
    updateSectionMetadata(idx, { heading: value || undefined });
    setEditingHeading(null);
  };

  // Add recipient
  const addRecipient = (sectionKey: string) => {
    const recipients = data[sectionKey]?.recipients || [];
    updateNestedData(sectionKey, ['recipients'], [
      { year: '', player: '', team: '', stats: '', points: 0, games: 0, note: '' },
      ...recipients,
    ]);
  };

  // Remove recipient
  const removeRecipient = (sectionKey: string, idx: number) => {
    const recipients = [...(data[sectionKey]?.recipients || [])];
    recipients.splice(idx, 1);
    updateNestedData(sectionKey, ['recipients'], recipients);
  };

  // Move recipient
  const moveRecipient = (sectionKey: string, idx: number, direction: 'up' | 'down') => {
    const recipients = [...(data[sectionKey]?.recipients || [])];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;

    if (targetIdx < 0 || targetIdx >= recipients.length) return;

    const temp = recipients[idx];
    recipients[idx] = recipients[targetIdx];
    recipients[targetIdx] = temp;

    updateNestedData(sectionKey, ['recipients'], recipients);
  };

  // Update recipient field
  const updateRecipient = (sectionKey: string, idx: number, field: string, value: any) => {
    const recipients = [...(data[sectionKey]?.recipients || [])];
    recipients[idx] = { ...recipients[idx], [field]: value };
    updateNestedData(sectionKey, ['recipients'], recipients);
  };

  const getSectionData = (sectionKey: string): AwardData => {
    return data[sectionKey] || { ...DEFAULT_AWARD_DATA };
  };

  const getSectionTitle = (sectionKey: string): string => {
    const section = sections.find(s => s.id === sectionKey);
    return section?.title || getDefaultTitle(sectionKey);
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
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Invalid JSON</span>
            </div>
            <p className="text-sm mt-1">{jsonError}</p>
          </div>
        )}

        <textarea
          value={jsonText}
          onChange={(e) => handleJsonChange(e.target.value)}
          rows={25}
          className="font-mono text-sm w-full border rounded-lg p-4"
          placeholder="Enter JSON data..."
        />

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Expected structure:</strong></p>
          <pre className="bg-gray-50 p-2 rounded border overflow-x-auto">
{`{
  "__metadata": {
    "pointLeaders": { "title": "...", "heading": "...", "collapsible": true, "collapsed": false, "order": 0 }
  },
  "pointLeaders": {
    "title": "Point Leaders Award",
    "description": "Description of the award...",
    "recipients": [
      {
        "year": "2025",
        "player": "#17 John Doe",
        "team": "Team Name",
        "stats": "46 goals; 54 assists",
        "points": 100,
        "games": 16,
        "note": "North Central Division"
      }
    ]
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

      {sections.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">No awards data found</span>
          </div>
          <p className="text-sm mt-1">Use the JSON Editor to add award data, or it will be created automatically when you save.</p>
        </div>
      )}

      {sections.map((section, sectionIdx) => {
        const sectionData = getSectionData(section.id);
        const isCollapsed = section.collapsed ?? false;
        const recipients = sectionData.recipients || [];

        return (
          <Card key={section.id} className="overflow-hidden">
            {/* Section Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
              <div className="flex items-center gap-2 flex-1">
                {editingHeading === section.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      value={section.heading || ''}
                      onChange={(e) => {}}
                      placeholder="Custom heading (optional)"
                      className="h-7 w-64 border rounded px-2 text-sm"
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
                    {section.heading || section.title}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {section.heading !== undefined && !editingHeading && (
                  <Button
                    onClick={() => startEditHeading(sectionIdx)}
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    title="Edit heading"
                  >
                    <Edit2 className="w-3 h-3 text-gray-500" />
                  </Button>
                )}
                <Button
                  onClick={() => toggleCollapsible(sectionIdx)}
                  size="sm"
                  variant="ghost"
                  className={`h-7 w-7 p-0 ${section.collapsible ? 'text-blue-600' : 'text-gray-400'}`}
                  title={section.collapsible ? 'Collapsible enabled' : 'Collapsible disabled'}
                >
                  <AlertCircle className="w-3 h-3" />
                </Button>
                {section.collapsible && (
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
                {sectionIdx > 0 && (
                  <Button
                    onClick={() => moveSection(sectionIdx, 'up')}
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    title="Move section up"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                )}
                {sectionIdx < sections.length - 1 && (
                  <Button
                    onClick={() => moveSection(sectionIdx, 'down')}
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    title="Move section down"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Section Content */}
            {!isCollapsed && (
              <div className="p-4 space-y-4">
                {/* Award Title */}
                <TextareaWithLinkInserter
                  id={`${section.id}-title`}
                  label="Award Title"
                  value={sectionData.title || ''}
                  onChange={(value) => updateNestedData(section.id, ['title'], value)}
                  rows={1}
                  placeholder={`e.g., ${getDefaultTitle(section.id)}`}
                />

                {/* Description */}
                <TextareaWithLinkInserter
                  id={`${section.id}-description`}
                  label="Description"
                  value={sectionData.description || ''}
                  onChange={(value) => updateNestedData(section.id, ['description'], value)}
                  rows={2}
                  placeholder="Description of the award and its significance..."
                />

                {/* Recipients */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Recipients</label>
                    <Button
                      onClick={() => addRecipient(section.id)}
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Recipient
                    </Button>
                  </div>

                  {recipients.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No recipients added yet.</p>
                  )}

                  {recipients.map((recipient, idx) => (
                    <div key={idx} className="bg-gray-50 border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge>Recipient {idx + 1}</Badge>
                        <div className="flex items-center gap-1">
                          {idx > 0 && (
                            <Button
                              onClick={() => moveRecipient(section.id, idx, 'up')}
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              title="Move up"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </Button>
                          )}
                          {idx < recipients.length - 1 && (
                            <Button
                              onClick={() => moveRecipient(section.id, idx, 'down')}
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              title="Move down"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            onClick={() => removeRecipient(section.id, idx)}
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-600"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs">Year</label>
                          <input
                            value={recipient.year || ''}
                            onChange={(e) => updateRecipient(section.id, idx, 'year', e.target.value)}
                            placeholder="2025"
                            className="w-full border rounded px-2 py-1.5 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs">Player (with #)</label>
                          <input
                            value={recipient.player || ''}
                            onChange={(e) => updateRecipient(section.id, idx, 'player', e.target.value)}
                            placeholder="#17 John Doe"
                            className="w-full border rounded px-2 py-1.5 text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs">Team</label>
                        <input
                          value={recipient.team || ''}
                          onChange={(e) => updateRecipient(section.id, idx, 'team', e.target.value)}
                          placeholder="Team name"
                          className="w-full border rounded px-2 py-1.5 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs">Stats</label>
                        <input
                          value={recipient.stats || ''}
                          onChange={(e) => updateRecipient(section.id, idx, 'stats', e.target.value)}
                          placeholder="46 goals; 54 assists"
                          className="w-full border rounded px-2 py-1.5 text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs">Points</label>
                          <input
                            type="number"
                            value={recipient.points || ''}
                            onChange={(e) => updateRecipient(section.id, idx, 'points', e.target.value ? parseInt(e.target.value) || 0 : 0)}
                            placeholder="100"
                            className="w-full border rounded px-2 py-1.5 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs">Games</label>
                          <input
                            type="number"
                            value={recipient.games || ''}
                            onChange={(e) => updateRecipient(section.id, idx, 'games', e.target.value ? parseInt(e.target.value) || 0 : 0)}
                            placeholder="16"
                            className="w-full border rounded px-2 py-1.5 text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs">Note (optional)</label>
                        <input
                          value={recipient.note || ''}
                          onChange={(e) => updateRecipient(section.id, idx, 'note', e.target.value)}
                          placeholder="e.g., North Central Division"
                          className="w-full border rounded px-2 py-1.5 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}