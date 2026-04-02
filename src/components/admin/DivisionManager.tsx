import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Save, AlertCircle, CheckCircle2, Loader2, Info, Calendar, Users, Award, Trophy, FileText, ArrowRightLeft, ExternalLink, Database, Trash2, Plus, Layout, Maximize2, Edit, File, Flag, AlertTriangle, Zap, Star } from 'lucide-react';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { SeasonInfoEditor } from './SeasonInfoEditor';
import { AwardsEditor } from './AwardsEditor';
import { ChampionshipsEditor } from './ChampionshipsEditor';
import { DivisionInfoSection, getDefaultSectionConfigs, SECTION_FIELDS, type SectionConfig } from './DivisionInfoSection';
import { TextareaWithLinkInserter } from './TextareaWithLinkInserter';

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

// Available icons for custom sections
const AVAILABLE_ICONS = [
  { name: 'Info', icon: Info, label: 'Info' },
  { name: 'FileText', icon: FileText, label: 'Document' },
  { name: 'Users', icon: Users, label: 'Users' },
  { name: 'Calendar', icon: Calendar, label: 'Calendar' },
  { name: 'Award', icon: Award, label: 'Award' },
  { name: 'Trophy', icon: Trophy, label: 'Trophy' },
  { name: 'Edit', icon: Edit, label: 'Edit' },
  { name: 'File', icon: File, label: 'File' },
  { name: 'Flag', icon: Flag, label: 'Flag' },
  { name: 'AlertTriangle', icon: AlertTriangle, label: 'Alert' },
  { name: 'Zap', icon: Zap, label: 'Lightning' },
  { name: 'Star', icon: Star, label: 'Star' },
];

// Available RMLL colors
const RMLL_COLORS = [
  { name: 'Blue', value: '#013fac', bgClass: 'bg-[#013fac]', textClass: 'text-[#013fac]', labelBg: 'bg-blue-50' },
  { name: 'Red', value: '#DC2626', bgClass: 'bg-[#DC2626]', textClass: 'text-[#DC2626]', labelBg: 'bg-red-50' },
  { name: 'Instagram', value: '#E1306C', bgClass: 'bg-[#E1306C]', textClass: 'text-[#E1306C]', labelBg: 'bg-pink-50' },
];

interface EditSectionData {
  sectionId: string;
  title: string;       // Identifier (read-only for existing sections)
  heading?: string;    // Display title override
  fieldLabel: string;
  colSpan: 1 | 2;
  color: string;
  iconName: string;
  isCustom?: boolean;
}

// Add New Section Modal
function AddSectionModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, fieldLabel: string, colSpan: 1 | 2, color: string, iconName: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [colSpan, setColSpan] = useState<1 | 2>(1);
  const [selectedColor, setSelectedColor] = useState(RMLL_COLORS[0].value);
  const [selectedIcon, setSelectedIcon] = useState(AVAILABLE_ICONS[0].name);

  const handleAdd = () => {
    if (title.trim()) {
      onAdd(title.trim(), fieldLabel.trim() || title.trim(), colSpan, selectedColor, selectedIcon);
      setTitle('');
      setFieldLabel('');
      setColSpan(1);
      setSelectedColor(RMLL_COLORS[0].value);
      setSelectedIcon(AVAILABLE_ICONS[0].name);
      onClose();
    }
  };

  if (!isOpen) return null;

  const IconComponent = AVAILABLE_ICONS.find(i => i.name === selectedIcon)?.icon || Info;

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
          <div>
            <Label>Color</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {RMLL_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    selectedColor === color.value
                      ? `${color.bgClass} text-white ring-2 ring-offset-2 ring-gray-400 scale-110 shadow-md`
                      : `${color.bgClass} text-white/80 hover:opacity-100`
                  }`}
                  title={color.name}
                >
                  <div className="w-3 h-3 rounded-full bg-white/30"></div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">Selected: {RMLL_COLORS.find(c => c.value === selectedColor)?.name}</p>
          </div>
          <div>
            <Label>Icon</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {AVAILABLE_ICONS.map((icon) => {
                const IconComponent = icon.icon;
                return (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={() => setSelectedIcon(icon.name)}
                    className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${
                      selectedIcon === icon.name
                        ? `bg-[#013fac] text-white border-[#013fac] ring-2 ring-offset-1 ring-[#013fac] scale-110 shadow-md`
                        : 'border-gray-300 hover:bg-gray-50 text-gray-500'
                    }`}
                    title={icon.label}
                  >
                    <IconComponent className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Selected: {AVAILABLE_ICONS.find(i => i.name === selectedIcon)?.label}</p>
          </div>
          <div>
            <Label>Layout</Label>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setColSpan(1)}
                className={`flex-1 p-3 border rounded-lg text-sm font-medium transition-colors ${
                  colSpan === 1
                    ? 'bg-purple-50 border-purple-500 text-purple-700 ring-2 ring-purple-300'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <Layout className="w-5 h-5" />
                  <span>Half Width</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setColSpan(2)}
                className={`flex-1 p-3 border rounded-lg text-sm font-medium transition-colors ${
                  colSpan === 2
                    ? 'bg-purple-50 border-purple-500 text-purple-700 ring-2 ring-purple-300'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <Maximize2 className="w-5 h-5" />
                  <span>Full Width</span>
                </div>
              </button>
            </div>
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

// Edit Section Modal
function EditSectionModal({
  isOpen,
  onClose,
  onEdit,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (data: EditSectionData) => void;
  initialData: EditSectionData | null;
}) {
  const [title, setTitle] = useState('');
  const [heading, setHeading] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [colSpan, setColSpan] = useState<1 | 2>(1);
  const [selectedColor, setSelectedColor] = useState(RMLL_COLORS[0].value);
  const [selectedIcon, setSelectedIcon] = useState(AVAILABLE_ICONS[0].name);

  // Reset form when modal opens with new data
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setHeading(initialData.heading || '');
      setFieldLabel(initialData.fieldLabel);
      setColSpan(initialData.colSpan);
      setSelectedColor(initialData.color);
      setSelectedIcon(initialData.iconName);
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    if (title.trim() && initialData) {
      onEdit({
        sectionId: initialData.sectionId,
        title: initialData.isCustom ? title.trim() : initialData.title, // Only custom sections can change title
        heading: initialData.isCustom ? undefined : (heading.trim() || undefined), // Existing sections use heading
        fieldLabel: fieldLabel.trim() || undefined, // Save field label for all sections (undefined means use default)
        colSpan,
        color: selectedColor,
        iconName: selectedIcon,
        isCustom: initialData.isCustom,
      });
      onClose();
    }
  };

  if (!isOpen || !initialData) return null;

  const IconComponent = AVAILABLE_ICONS.find(i => i.name === selectedIcon)?.icon || Info;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Edit Section</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* For custom sections: editable title */}
          {initialData.isCustom ? (
            <div>
              <Label>Section Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Additional Rules"
              />
            </div>
          ) : (
            /* For existing sections: show read-only title and editable heading */
            <>
              <div>
                <Label>Section ID (Read-only)</Label>
                <Input
                  value={title}
                  disabled
                  className="bg-gray-100 text-gray-600"
                />
              </div>
              <div>
                <Label>Display Title Override</Label>
                <Input
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  placeholder={`Leave empty to use: ${title}`}
                />
                <p className="text-xs text-gray-500 mt-1">Enter a custom title to display instead of "{title}"</p>
              </div>
            </>
          )}
          {/* Field Label for all sections */}
          <div>
            <Label>Field Label</Label>
            <Input
              value={fieldLabel}
              onChange={(e) => setFieldLabel(e.target.value)}
              placeholder="e.g., Content"
            />
            <p className="text-xs text-gray-500 mt-1">Label shown above the content input field. Leave empty to use the default.</p>
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {RMLL_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    selectedColor === color.value
                      ? `${color.bgClass} text-white ring-2 ring-offset-2 ring-gray-400 scale-110 shadow-md`
                      : `${color.bgClass} text-white/80 hover:opacity-100`
                  }`}
                  title={color.name}
                >
                  <div className="w-3 h-3 rounded-full bg-white/30"></div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">Selected: {RMLL_COLORS.find(c => c.value === selectedColor)?.name}</p>
          </div>
          <div>
            <Label>Icon</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {AVAILABLE_ICONS.map((icon) => {
                const IconComponent = icon.icon;
                return (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={() => setSelectedIcon(icon.name)}
                    className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${
                      selectedIcon === icon.name
                        ? `bg-[#013fac] text-white border-[#013fac] ring-2 ring-offset-1 ring-[#013fac] scale-110 shadow-md`
                        : 'border-gray-300 hover:bg-gray-50 text-gray-500'
                    }`}
                    title={icon.label}
                  >
                    <IconComponent className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Selected: {AVAILABLE_ICONS.find(i => i.name === selectedIcon)?.label}</p>
          </div>
          <div>
            <Label>Layout</Label>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setColSpan(1)}
                className={`flex-1 p-3 border rounded-lg text-sm font-medium transition-colors ${
                  colSpan === 1
                    ? 'bg-purple-50 border-purple-500 text-purple-700 ring-2 ring-purple-300'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <Layout className="w-5 h-5" />
                  <span>Half Width</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setColSpan(2)}
                className={`flex-1 p-3 border rounded-lg text-sm font-medium transition-colors ${
                  colSpan === 2
                    ? 'bg-purple-50 border-purple-500 text-purple-700 ring-2 ring-purple-300'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <Maximize2 className="w-5 h-5" />
                  <span>Full Width</span>
                </div>
              </button>
            </div>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
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

  // Edit section modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSection, setEditingSection] = useState<EditSectionData | null>(null);

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
            // Merge with defaults, preserving custom sections and deleted status
            const defaultConfigs = getDefaultSectionConfigs(selectedDivision);
            const mergedConfigs: SectionConfig[] = [];

            // Add default sections with saved config
            defaultConfigs.forEach(defaultConfig => {
              const savedConfig = parsedConfigs.find(c => c.id === defaultConfig.id);
              // If saved config exists and is marked deleted, mark default as deleted
              if (savedConfig) {
                mergedConfigs.push({ ...defaultConfig, ...savedConfig });
              } else {
                mergedConfigs.push(defaultConfig);
              }
            });

            // Add custom sections (including deleted ones, they'll be filtered when rendering)
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
      // Validate JSON fields before saving
      if (awards && awards.trim()) {
        try {
          JSON.parse(awards);
        } catch (e) {
          throw new Error('Awards contains invalid JSON. Please fix the errors in JSON Editor mode before saving.');
        }
      }

      if (championships && championships.trim()) {
        try {
          JSON.parse(championships);
        } catch (e) {
          throw new Error('Championships contains invalid JSON. Please fix the errors in JSON Editor mode before saving.');
        }
      }

      if (seasonInfo && seasonInfo.trim()) {
        try {
          JSON.parse(seasonInfo);
        } catch (e) {
          throw new Error('Season Info contains invalid JSON. Please fix the errors in JSON Editor mode before saving.');
        }
      }

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
          freeAgentsAMF: fieldValues.freeAgentsAMF,
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

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    // Filter out deleted sections and sort by order
    const visibleConfigs = sectionConfigs.filter(c => !c.deleted).sort((a, b) => a.order - b.order);

    // Find the index of the section in the visible configs
    const idx = visibleConfigs.findIndex(c => c.id === sectionId);
    if (idx === -1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;

    // Check bounds
    if (targetIdx < 0 || targetIdx >= visibleConfigs.length) return;

    // Swap order values between the two sections
    const section1 = visibleConfigs[idx];
    const section2 = visibleConfigs[targetIdx];
    const tempOrder = section1.order;
    section1.order = section2.order;
    section2.order = tempOrder;

    // Update sectionConfigs with the new order values
    setSectionConfigs([...sectionConfigs]);
  };

  const deleteSection = (sectionId: string) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      setSectionConfigs(sectionConfigs.map(c =>
        c.id === sectionId ? { ...c, deleted: true } : c
      ));
    }
  };

  const addCustomSection = (title: string, fieldLabel: string, colSpan: 1 | 2 = 1, color: string = '#013fac', iconName: string = 'Info') => {
    const newId = `custom-${Date.now()}`;
    const newSection: SectionConfig = {
      id: newId,
      title,
      heading: undefined,
      collapsible: true,
      collapsed: false,
      order: sectionConfigs.length,
      isCustom: true,
      colSpan,
      color,
      iconName,
    };
    setSectionConfigs([...sectionConfigs, newSection]);
    // Initialize the field value
    setFieldValues({ ...fieldValues, [newId]: '' });
  };

  const openEditModal = (sectionId: string) => {
    const config = sectionConfigs.find(c => c.id === sectionId);
    if (config) {
      // Get the default field label from SECTION_FIELDS or use config title
      const defaultFieldLabel = SECTION_FIELDS[config.id]?.[0]?.label || config.title;
      setEditingSection({
        sectionId: config.id,
        title: config.title,
        heading: config.heading,
        fieldLabel: config.fieldLabel || defaultFieldLabel || '',
        colSpan: config.colSpan || 1,
        color: config.color || '#013fac',
        iconName: config.iconName || 'Info',
        isCustom: config.isCustom,
      });
      setShowEditModal(true);
    }
  };

  const editSection = (data: EditSectionData) => {
    setSectionConfigs(sectionConfigs.map(c =>
      c.id === data.sectionId
        ? {
            ...c,
            title: data.title,
            heading: data.heading,
            fieldLabel: data.fieldLabel,
            colSpan: data.colSpan,
            color: data.color,
            iconName: data.iconName,
          }
        : c
    ));
    setShowEditModal(false);
    setEditingSection(null);
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
                  <TextareaWithLinkInserter
                    value={divisionDescription}
                    onChange={setDivisionDescription}
                    placeholder="Enter a description of this division - its history, values, level of play, etc."
                    rows={8}
                    className="font-normal"
                  />
                </div>
              </Card>

              {/* Configurable Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(() => {
                  // Filter out deleted sections and sort by order
                  const visibleConfigs = sectionConfigs.filter(c => !c.deleted).sort((a, b) => a.order - b.order);

                  return visibleConfigs.map((config, idx) => {
                    const fields = SECTION_FIELDS[config.id] || [];
                    const customFields = config.isCustom
                      ? [{ id: config.id, label: config.title, placeholder: 'Enter content...', rows: 4 }]
                      : [];

                    if (!config.isCustom && fields.length === 0) return null;

                    return (
                      <div key={config.id} className={config.colSpan === 2 ? 'md:col-span-2' : ''}>
                        <DivisionInfoSection
                          config={config}
                          fields={config.isCustom ? customFields : fields}
                          values={fieldValues}
                          onChange={handleFieldChange}
                          onConfigChange={handleSectionConfigChange}
                          onMove={(direction) => moveSection(config.id, direction)}
                          onDelete={() => deleteSection(config.id)}
                          onEdit={() => openEditModal(config.id)}
                          canMoveUp={idx > 0}
                          canMoveDown={idx < visibleConfigs.length - 1}
                        />
                      </div>
                    );
                  });
                })()}
              </div>

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

      {/* Edit Section Modal */}
      <EditSectionModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingSection(null);
        }}
        onEdit={editSection}
        initialData={editingSection}
      />
    </div>
  );
}