import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Save, AlertCircle, CheckCircle2, Loader2, Info, Calendar, Users, Award, Trophy, FileText, ArrowRightLeft, ExternalLink, Database, Trash2, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { SeasonInfoEditor } from './SeasonInfoEditor';
import { AwardsEditor } from './AwardsEditor';
import { ChampionshipsEditor } from './ChampionshipsEditor';
import { DivisionInfoSection, getDefaultSectionConfigs, SECTION_FIELDS, type SectionConfig } from './DivisionInfoSection';

const divisions = [
  'Senior B',
  'Senior C',
  'Junior A',
  'Junior B Tier I',
  'Junior B Tier II',
  'Junior B Tier III',
  'Alberta Major Senior Female',
  'Alberta Major Female'
];

interface DivisionData {
  divisionDescription?: string;
  divisionInfo?: {
    teams: string;
    playerAges: string;
    graduatingDraft: string;
    playingRights: string;
    minGames: string;
    outOfProvince: string;
    outOfCountry: string;
    otherJurisdiction?: string;
    regularSeasonStandings?: string;
    tryouts?: string;
    northGraduatingDraft?: string;
    centralGraduatingDraft?: string;
    southGraduatingDraft?: string;
    protectedList?: string;
    draftedProtectedPlayers?: string;
    freeAgent?: string;
    firstYearRegistration?: string;
    instagram?: string;
    draftInfo?: string;
    protectedListInfo?: string;
    calgaryFreeAgents?: string;
    stAlbertDrillers?: string;
    sherwoodParkTitans?: string;
    capitalRegionSaints?: string;
    redDeerRiot?: string;
    freeAgents?: string;
    returningPlayers?: string;
    customSections?: Record<string, string>; // For custom section content
  };
  seasonInfo?: string;
  awards?: string;
  championships?: string;
  sectionConfigs?: string; // JSON string of section configs
}

function SportzSoftDataNotice({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-teal-600" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-lg p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-800 flex items-center justify-center shrink-0">
              <ExternalLink className="w-5 h-5 text-teal-700 dark:text-teal-300" />
            </div>
            <div>
              <h4 className="font-semibold text-teal-900 dark:text-teal-100 mb-1">
                Powered by SportzSoft API
              </h4>
              <p className="text-sm text-teal-700 dark:text-teal-300 mb-3">
                This data is pulled live from the SportzSoft league management system and displayed automatically on the website. It does not need to be managed through the CMS.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-800 dark:text-teal-200 dark:border-teal-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Live Data
                </Badge>
                <Badge variant="outline" className="border-teal-300 text-teal-700 dark:border-teal-600 dark:text-teal-300">
                  Auto-synced
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Add New Section Modal
function AddSectionModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, fieldLabel: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');

  const handleAdd = () => {
    if (title.trim()) {
      onAdd(title.trim(), fieldLabel.trim() || title.trim());
      setTitle('');
      setFieldLabel('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Add Custom Section</h3>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <Label>Section Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Additional Rules"
            />
          </div>
          <div>
            <Label>Field Label</Label>
            <Input
              value={fieldLabel}
              onChange={(e) => setFieldLabel(e.target.value)}
              placeholder="e.g., Content"
            />
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdd}>Add Section</Button>
        </div>
      </div>
    </div>
  );
}

export function DivisionManager() {
  const [selectedDivision, setSelectedDivision] = useState(divisions[0]);
  const [activeTab, setActiveTab] = useState('division-info');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Section configurations
  const [sectionConfigs, setSectionConfigs] = useState<SectionConfig[]>([]);

  // Division Description
  const [divisionDescription, setDivisionDescription] = useState('');

  // Field values
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  // Other tab fields
  const [seasonInfo, setSeasonInfo] = useState('');
  const [awards, setAwards] = useState('');
  const [championships, setChampionships] = useState('');

  // Add section modal
  const [showAddModal, setShowAddModal] = useState(false);

  // Initialize section configs when division changes
  useEffect(() => {
    const defaultConfigs = getDefaultSectionConfigs(selectedDivision);
    setSectionConfigs(defaultConfigs);
  }, [selectedDivision]);

  // Load division data (only depends on selectedDivision, NOT sectionConfigs)
  useEffect(() => {
    if (selectedDivision) {
      loadDivisionData();
    }
  }, [selectedDivision]);

  const loadDivisionData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/division/${encodeURIComponent(selectedDivision)}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data: DivisionData = await response.json();

        // Load division description
        setDivisionDescription(data.divisionDescription || '');

        // Load section configs if available
        if (data.sectionConfigs) {
          try {
            const parsedConfigs = JSON.parse(data.sectionConfigs) as SectionConfig[];
            // Merge with defaults, preserving custom sections
            const defaultConfigs = getDefaultSectionConfigs(selectedDivision);
            const mergedConfigs: SectionConfig[] = [];

            // Add default sections with saved config
            defaultConfigs.forEach(defaultConfig => {
              const savedConfig = parsedConfigs.find(c => c.id === defaultConfig.id);
              mergedConfigs.push(savedConfig ? { ...defaultConfig, ...savedConfig } : defaultConfig);
            });

            // Add custom sections
            parsedConfigs.filter(c => c.isCustom && !defaultConfigs.find(d => d.id === c.id))
              .forEach(customConfig => {
                mergedConfigs.push(customConfig);
              });

            // Sort by order
            mergedConfigs.sort((a, b) => a.order - b.order);

            setSectionConfigs(mergedConfigs);
          } catch (e) {
            console.error('Error parsing section configs:', e);
          }
        }

        // Load division info fields
        const newValues: Record<string, string> = { ...fieldValues };
        if (data.divisionInfo) {
          Object.entries(data.divisionInfo).forEach(([key, value]) => {
            newValues[key] = value as string;
          });
        }
        // Load custom sections
        if (data.divisionInfo?.customSections) {
          Object.entries(data.divisionInfo.customSections).forEach(([key, value]) => {
            newValues[key] = value as string;
          });
        }
        setFieldValues(newValues);

        // Load other tab fields
        setSeasonInfo(data.seasonInfo || '');

        // Handle awards
        if (typeof data.awards === 'object' && data.awards !== null) {
          setAwards(JSON.stringify(data.awards, null, 2));
        } else {
          setAwards(data.awards || '');
        }

        // Handle championships
        if (typeof data.championships === 'object' && data.championships !== null) {
          setChampionships(JSON.stringify(data.championships, null, 2));
        } else {
          setChampionships(data.championships || '');
        }
      }
    } catch (err) {
      console.error('Error loading division data:', err);
      setError('Failed to load division data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const data: DivisionData = {
        divisionDescription,
        divisionInfo: {
          teams: fieldValues.teams || '',
          playerAges: fieldValues.playerAges || '',
          graduatingDraft: fieldValues.graduatingDraft || '',
          playingRights: fieldValues.playingRights || '',
          minGames: fieldValues.minGames || '',
          outOfProvince: fieldValues.outOfProvince || '',
          outOfCountry: fieldValues.outOfCountry || '',
          otherJurisdiction: fieldValues.otherJurisdiction,
          regularSeasonStandings: fieldValues.regularSeasonStandings,
          tryouts: fieldValues.tryouts,
          northGraduatingDraft: fieldValues.northGraduatingDraft,
          centralGraduatingDraft: fieldValues.centralGraduatingDraft,
          southGraduatingDraft: fieldValues.southGraduatingDraft,
          protectedList: fieldValues.protectedList,
          draftedProtectedPlayers: fieldValues.draftedProtectedPlayers,
          freeAgent: fieldValues.freeAgent,
          firstYearRegistration: fieldValues.firstYearRegistration,
          instagram: fieldValues.instagram,
          draftInfo: fieldValues.draftInfo,
          protectedListInfo: fieldValues.protectedListInfo,
          calgaryFreeAgents: fieldValues.calgaryFreeAgents,
          stAlbertDrillers: fieldValues.stAlbertDrillers,
          sherwoodParkTitans: fieldValues.sherwoodParkTitans,
          capitalRegionSaints: fieldValues.capitalRegionSaints,
          redDeerRiot: fieldValues.redDeerRiot,
          freeAgents: fieldValues.freeAgentsAMF,
          returningPlayers: fieldValues.returningPlayers,
          // Custom sections
          ...sectionConfigs.filter(s => s.isCustom).reduce((acc, section) => {
            const value = fieldValues[section.id];
            if (value !== undefined) {
              acc[section.id] = value;
            }
            return acc;
          }, {} as Record<string, string>),
        },
        seasonInfo,
        awards,
        championships,
        sectionConfigs: JSON.stringify(sectionConfigs),
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/division/${encodeURIComponent(selectedDivision)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save division data');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving division data:', err);
      setError('Failed to save division data');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues({ ...fieldValues, [fieldId]: value });
  };

  const handleSectionConfigChange = (config: SectionConfig) => {
    setSectionConfigs(sectionConfigs.map(c =>
      c.id === config.id ? config : c
    ));
  };

  const moveSection = (idx: number, direction: 'up' | 'down') => {
    const newConfigs = [...sectionConfigs];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;

    if (targetIdx < 0 || targetIdx >= newConfigs.length) return;

    // Swap order values
    const tempOrder = newConfigs[idx].order;
    newConfigs[idx].order = newConfigs[targetIdx].order;
    newConfigs[targetIdx].order = tempOrder;

    // Re-sort by order
    newConfigs.sort((a, b) => a.order - b.order);

    setSectionConfigs(newConfigs);
  };

  const deleteSection = (sectionId: string) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      setSectionConfigs(sectionConfigs.filter(c => c.id !== sectionId));
    }
  };

  const addCustomSection = (title: string, fieldLabel: string) => {
    const newId = `custom-${Date.now()}`;
    const newSection: SectionConfig = {
      id: newId,
      title,
      heading: undefined,
      collapsible: true,
      collapsed: false,
      order: sectionConfigs.length,
      isCustom: true,
    };
    setSectionConfigs([...sectionConfigs, newSection]);
    // Initialize the field value
    setFieldValues({ ...fieldValues, [newId]: '' });
  };

  const isEditableTab = !['drafts', 'protected-list', 'transactions'].includes(activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Division Manager</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Manage content for all division pages including rules, season info, awards, and more.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Division data saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Division Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Division</CardTitle>
          <CardDescription>Choose which division to edit</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedDivision} onValueChange={setSelectedDivision}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select Division" />
            </SelectTrigger>
            <SelectContent>
              {divisions.map((division) => (
                <SelectItem key={division} value={division}>
                  {division}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#013fac]" />
        </div>
      ) : (
        <>
          {/* Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
              <TabsTrigger value="division-info" className="text-xs sm:text-sm">
                <Info className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Division </span>Info
              </TabsTrigger>
              <TabsTrigger value="season-info" className="text-xs sm:text-sm">
                <Calendar className="w-4 h-4 mr-1" />
                Season
              </TabsTrigger>
              <TabsTrigger value="drafts" className="text-xs sm:text-sm">
                <Users className="w-4 h-4 mr-1" />
                Drafts
              </TabsTrigger>
              <TabsTrigger value="protected-list" className="text-xs sm:text-sm">
                <FileText className="w-4 h-4 mr-1" />
                Protected
              </TabsTrigger>
              <TabsTrigger value="transactions" className="text-xs sm:text-sm">
                <ArrowRightLeft className="w-4 h-4 mr-1" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="awards" className="text-xs sm:text-sm">
                <Award className="w-4 h-4 mr-1" />
                Awards
              </TabsTrigger>
              <TabsTrigger value="championships" className="text-xs sm:text-sm">
                <Trophy className="w-4 h-4 mr-1" />
                Championships
              </TabsTrigger>
            </TabsList>

            {/* Division Info Tab */}
            <TabsContent value="division-info" className="space-y-4">
              {/* Division Description - always visible */}
              <Card>
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
                  <span className="text-sm font-semibold">Division Description</span>
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-xs text-gray-500">This text appears prominently at the top of the division page as an overview/about section. Use line breaks to separate paragraphs.</p>
                  <Textarea
                    value={divisionDescription}
                    onChange={(e) => setDivisionDescription(e.target.value)}
                    placeholder="Enter a description of this division - its history, values, level of play, etc."
                    rows={8}
                    className="font-normal"
                  />
                </div>
              </Card>

              {/* Configurable Sections */}
              {sectionConfigs
                .sort((a, b) => a.order - b.order)
                .map((config, idx) => {
                  const fields = SECTION_FIELDS[config.id] || [];
                  const customFields = config.isCustom
                    ? [{ id: config.id, label: config.title, placeholder: 'Enter content...', rows: 4 }]
                    : [];

                  if (!config.isCustom && fields.length === 0) return null;

                  return (
                    <DivisionInfoSection
                      key={config.id}
                      config={config}
                      fields={config.isCustom ? customFields : fields}
                      values={fieldValues}
                      onChange={handleFieldChange}
                      onConfigChange={handleSectionConfigChange}
                      onMove={(direction) => moveSection(idx, direction)}
                      onDelete={config.isCustom ? () => deleteSection(config.id) : undefined}
                      canMoveUp={idx > 0}
                      canMoveDown={idx < sectionConfigs.length - 1}
                    />
                  );
                })}

              {/* Add Section Button */}
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowAddModal(true)}
                  variant="outline"
                  className="w-full max-w-xs"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Section
                </Button>
              </div>
            </TabsContent>

            {/* Season Info Tab */}
            <TabsContent value="season-info">
              <Card>
                <CardHeader>
                  <CardTitle>Season Information</CardTitle>
                  <CardDescription>Current season details and schedule for {selectedDivision}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SeasonInfoEditor
                    value={seasonInfo}
                    onChange={setSeasonInfo}
                    divisionName={selectedDivision}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Drafts Tab - SportzSoft Data */}
            <TabsContent value="drafts">
              <SportzSoftDataNotice
                title="Draft Information"
                description={`Entry draft results and history for ${selectedDivision}`}
              />
            </TabsContent>

            {/* Protected List Tab - SportzSoft Data */}
            <TabsContent value="protected-list">
              <SportzSoftDataNotice
                title="Protected Lists"
                description={`Team protected player lists for ${selectedDivision}`}
              />
            </TabsContent>

            {/* Transactions Tab - SportzSoft Data */}
            <TabsContent value="transactions">
              <SportzSoftDataNotice
                title="Transactions"
                description={`Player trades, signings, and transactions for ${selectedDivision}`}
              />
            </TabsContent>

            {/* Awards Tab */}
            <TabsContent value="awards">
              <Card>
                <CardHeader>
                  <CardTitle>Division Awards</CardTitle>
                  <CardDescription>Annual awards and honors for {selectedDivision}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AwardsEditor
                    value={awards}
                    onChange={setAwards}
                    divisionName={selectedDivision}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Championships Tab */}
            <TabsContent value="championships">
              <Card>
                <CardHeader>
                  <CardTitle>Championship History</CardTitle>
                  <CardDescription>Provincial and National championship results and history for {selectedDivision}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ChampionshipsEditor
                    value={championships}
                    onChange={setChampionships}
                    divisionName={selectedDivision}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button - only show for editable tabs */}
          {isEditableTab && (
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                size="lg"
                className="min-w-[120px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Add Section Modal */}
      <AddSectionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addCustomSection}
      />
    </div>
  );
}