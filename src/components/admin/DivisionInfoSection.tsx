import { useState, useRef } from 'react';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ChevronUp, ChevronDown, Edit2, Check, X, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export interface SectionConfig {
  id: string;
  title: string;
  heading?: string;
  collapsible: boolean;
  collapsed?: boolean;
  order: number;
  isCustom?: boolean; // Custom sections added by user
}

export interface DivisionInfoField {
  id: string;
  label: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}

interface DivisionInfoSectionProps {
  config: SectionConfig;
  fields: DivisionInfoField[];
  values: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
  onConfigChange: (config: SectionConfig) => void;
  onMove?: (direction: 'up' | 'down') => void;
  onDelete?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  children?: React.ReactNode;
}

export function DivisionInfoSection({
  config,
  fields,
  values,
  onChange,
  onConfigChange,
  onMove,
  onDelete,
  canMoveUp = false,
  canMoveDown = false,
  children,
}: DivisionInfoSectionProps) {
  const [editingHeading, setEditingHeading] = useState(false);
  const [headingValue, setHeadingValue] = useState(config.heading || '');

  const handleSaveHeading = () => {
    onConfigChange({
      ...config,
      heading: headingValue || undefined,
    });
    setEditingHeading(false);
  };

  const displayHeading = config.heading || config.title;
  const isCollapsed = config.collapsed ?? false;

  return (
    <Card className="overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <div className="flex items-center gap-2 flex-1">
          {editingHeading ? (
            <div className="flex items-center gap-1">
              <Input
                value={headingValue}
                onChange={(e) => setHeadingValue(e.target.value)}
                placeholder={`Custom heading for ${config.title} (optional)`}
                className="h-7 w-64"
              />
              <Button
                onClick={handleSaveHeading}
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
              >
                <Check className="w-3 h-3 text-green-600" />
              </Button>
              <Button
                onClick={() => {
                  setHeadingValue(config.heading || '');
                  setEditingHeading(false);
                }}
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
              >
                <X className="w-3 h-3 text-red-600" />
              </Button>
            </div>
          ) : (
            <span className="text-sm font-semibold">
              {displayHeading}
            </span>
          )}
          {config.isCustom && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Custom</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {config.heading !== undefined && !editingHeading && (
            <Button
              onClick={() => setEditingHeading(true)}
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              title="Edit heading"
            >
              <Edit2 className="w-3 h-3 text-gray-500" />
            </Button>
          )}
          <Button
            onClick={() => onConfigChange({ ...config, collapsible: !config.collapsible })}
            size="sm"
            variant="ghost"
            className={`h-7 w-7 p-0 ${config.collapsible ? 'text-blue-600' : 'text-gray-400'}`}
            title={config.collapsible ? 'Collapsible enabled' : 'Collapsible disabled'}
          >
            <AlertCircle className="w-3 h-3" />
          </Button>
          {config.collapsible && (
            <Button
              onClick={() => onConfigChange({ ...config, collapsed: !isCollapsed })}
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          )}
          {onMove && canMoveUp && (
            <Button
              onClick={() => onMove('up')}
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              title="Move up"
            >
              <ChevronUp className="w-3 h-3" />
            </Button>
          )}
          {onMove && canMoveDown && (
            <Button
              onClick={() => onMove('down')}
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              title="Move down"
            >
              <ChevronDown className="w-3 h-3" />
            </Button>
          )}
          {onDelete && config.isCustom && (
            <Button
              onClick={onDelete}
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              title="Delete section"
            >
              <Trash2 className="w-3 h-3 text-red-500" />
            </Button>
          )}
        </div>
      </div>

      {/* Section Content */}
      {!isCollapsed && (
        <div className="p-4 space-y-4">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Textarea
                id={field.id}
                value={values[field.id] || ''}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                rows={field.rows || 2}
                className={field.rows && field.rows > 4 ? 'font-normal' : ''}
              />
            </div>
          ))}
          {children}
        </div>
      )}
    </Card>
  );
}

// Custom section template for adding new sections
export const CUSTOM_SECTION_TEMPLATE: SectionConfig = {
  id: '',
  title: 'New Section',
  collapsible: true,
  collapsed: false,
  order: 999,
  isCustom: true,
};

// Default section configurations for different divisions
export const getDefaultSectionConfigs = (divisionName: string): SectionConfig[] => {
  const common: SectionConfig[] = [
    { id: 'teams', title: 'Teams', collapsible: true, collapsed: false, order: 0 },
    { id: 'playerAges', title: 'Player Ages', collapsible: true, collapsed: false, order: 1 },
    { id: 'graduatingDraft', title: 'Graduating Junior Entry Draft', collapsible: true, collapsed: false, order: 2 },
    { id: 'playingRights', title: 'Playing Rights', collapsible: true, collapsed: false, order: 3 },
    { id: 'minGames', title: 'Minimum Games for Playoff Eligibility', collapsible: true, collapsed: false, order: 4 },
    { id: 'outOfProvince', title: 'Out of Province Players', collapsible: true, collapsed: false, order: 5 },
    { id: 'outOfCountry', title: 'Out of Country Players', collapsible: true, collapsed: false, order: 6 },
  ];

  if (['Senior B', 'Senior C', 'Junior A', 'Junior B Tier I', 'Junior B Tier II', 'Junior B Tier III'].includes(divisionName)) {
    return [
      ...common,
      { id: 'tryouts', title: 'Tryouts', collapsible: true, collapsed: false, order: 7 },
    ];
  }

  if (['Senior B', 'Senior C', 'Junior A', 'Junior B Tier I', 'Junior B Tier II'].includes(divisionName)) {
    return [
      ...common,
      { id: 'tryouts', title: 'Tryouts', collapsible: true, collapsed: false, order: 7 },
      { id: 'regularSeasonStandings', title: 'Regular Season Standings', collapsible: true, collapsed: false, order: 8 },
    ];
  }

  if (['Senior B', 'Senior C', 'Junior B Tier I', 'Junior B Tier II', 'Junior B Tier III'].includes(divisionName)) {
    return [
      ...common,
      { id: 'tryouts', title: 'Tryouts', collapsible: true, collapsed: false, order: 7 },
      { id: 'otherJurisdiction', title: 'Other Jurisdiction Players', collapsible: true, collapsed: false, order: 8 },
      { id: 'protectedList', title: 'Protected List', collapsible: true, collapsed: false, order: 9 },
      { id: 'draftedProtectedPlayers', title: 'Drafted Protected Players', collapsible: true, collapsed: false, order: 10 },
      { id: 'freeAgent', title: 'Free Agent', collapsible: true, collapsed: false, order: 11 },
      { id: 'firstYearRegistration', title: 'First Year Registration', collapsible: true, collapsed: false, order: 12 },
    ];
  }

  if (divisionName === 'Junior B Tier I') {
    return [
      ...common,
      { id: 'tryouts', title: 'Tryouts', collapsible: true, collapsed: false, order: 7 },
      { id: 'otherJurisdiction', title: 'Other Jurisdiction Players', collapsible: true, collapsed: false, order: 8 },
      { id: 'regularSeasonStandings', title: 'Regular Season Standings', collapsible: true, collapsed: false, order: 9 },
      { id: 'northGraduatingDraft', title: 'North Graduating Draft', collapsible: true, collapsed: false, order: 10 },
      { id: 'centralGraduatingDraft', title: 'Central Graduating Draft', collapsible: true, collapsed: false, order: 11 },
      { id: 'southGraduatingDraft', title: 'South Graduating Draft', collapsible: true, collapsed: false, order: 12 },
      { id: 'protectedList', title: 'Protected List', collapsible: true, collapsed: false, order: 13 },
      { id: 'draftedProtectedPlayers', title: 'Drafted Protected Players', collapsible: true, collapsed: false, order: 14 },
      { id: 'freeAgent', title: 'Free Agent', collapsible: true, collapsed: false, order: 15 },
      { id: 'firstYearRegistration', title: 'First Year Registration', collapsible: true, collapsed: false, order: 16 },
    ];
  }

  if (divisionName === 'Alberta Major Female') {
    return [
      ...common,
      { id: 'instagram', title: 'Instagram', collapsible: true, collapsed: false, order: 7 },
      { id: 'draftInfo', title: 'Draft Info', collapsible: true, collapsed: false, order: 8 },
      { id: 'protectedListInfo', title: 'Protected List Info', collapsible: true, collapsed: false, order: 9 },
      { id: 'calgaryFreeAgents', title: 'Calgary Free Agents', collapsible: true, collapsed: false, order: 10 },
      { id: 'stAlbertDrillers', title: 'St. Albert Drillers', collapsible: true, collapsed: false, order: 11 },
      { id: 'sherwoodParkTitans', title: 'Sherwood Park Titans', collapsible: true, collapsed: false, order: 12 },
      { id: 'capitalRegionSaints', title: 'Capital Region Saints', collapsible: true, collapsed: false, order: 13 },
      { id: 'redDeerRiot', title: 'Red Deer Riot', collapsible: true, collapsed: false, order: 14 },
      { id: 'freeAgentsAMF', title: 'Free Agents', collapsible: true, collapsed: false, order: 15 },
      { id: 'returningPlayers', title: 'Returning Players', collapsible: true, collapsed: false, order: 16 },
    ];
  }

  if (divisionName === 'Alberta Major Senior Female') {
    return [
      ...common,
      { id: 'instagram', title: 'Instagram', collapsible: true, collapsed: false, order: 7 },
    ];
  }

  return common;
};

// Field definitions for each section
export const SECTION_FIELDS: Record<string, DivisionInfoField[]> = {
  teams: [
    { id: 'teams', label: 'Teams', placeholder: 'e.g., 8 teams compete in the Senior B division.', rows: 2 },
  ],
  playerAges: [
    { id: 'playerAges', label: 'Player Ages', placeholder: 'e.g., Players must be 21 years of age or older on January 1st of the current year.', rows: 2 },
  ],
  graduatingDraft: [
    { id: 'graduatingDraft', label: 'Graduating Junior Entry Draft', placeholder: 'e.g., Not applicable - Senior divisions do not participate in the draft.', rows: 2 },
  ],
  playingRights: [
    { id: 'playingRights', label: 'Playing Rights', placeholder: 'e.g., Teams may protect up to 15 players from the previous season.', rows: 2 },
  ],
  minGames: [
    { id: 'minGames', label: 'Minimum Games for Playoff Eligibility', placeholder: 'e.g., Players must play a minimum of 8 regular season games to be eligible for playoffs.', rows: 2 },
  ],
  outOfProvince: [
    { id: 'outOfProvince', label: 'Out of Province Players', placeholder: 'e.g., Out-of-province players must have a completed Proof of Residency form on file.', rows: 2 },
  ],
  outOfCountry: [
    { id: 'outOfCountry', label: 'Out of Country Players', placeholder: 'e.g., Must have a completed Proof of Medical form on file with the ALA.', rows: 2 },
  ],
  tryouts: [
    { id: 'tryouts', label: 'Tryouts', placeholder: 'Information about tryouts for this division', rows: 2 },
  ],
  regularSeasonStandings: [
    { id: 'regularSeasonStandings', label: 'Regular Season Standings', placeholder: 'Information about regular season standings', rows: 2 },
  ],
  otherJurisdiction: [
    { id: 'otherJurisdiction', label: 'Other Jurisdiction Players', placeholder: 'Rules for players from other jurisdictions', rows: 2 },
  ],
  northGraduatingDraft: [
    { id: 'northGraduatingDraft', label: 'North Graduating Draft', placeholder: 'Information about the North graduating draft', rows: 2 },
  ],
  centralGraduatingDraft: [
    { id: 'centralGraduatingDraft', label: 'Central Graduating Draft', placeholder: 'Information about the Central graduating draft', rows: 2 },
  ],
  southGraduatingDraft: [
    { id: 'southGraduatingDraft', label: 'South Graduating Draft', placeholder: 'Information about the South graduating draft', rows: 2 },
  ],
  protectedList: [
    { id: 'protectedList', label: 'Protected List', placeholder: 'Information about protected lists', rows: 2 },
  ],
  draftedProtectedPlayers: [
    { id: 'draftedProtectedPlayers', label: 'Drafted Protected Players', placeholder: 'Information about drafted protected players', rows: 2 },
  ],
  freeAgent: [
    { id: 'freeAgent', label: 'Free Agent', placeholder: 'Information about free agents', rows: 2 },
  ],
  firstYearRegistration: [
    { id: 'firstYearRegistration', label: 'First Year Registration', placeholder: 'Information about first year players', rows: 2 },
  ],
  instagram: [
    { id: 'instagram', label: 'Instagram', placeholder: 'Instagram handle or link', rows: 1 },
  ],
  draftInfo: [
    { id: 'draftInfo', label: 'Draft Info', placeholder: 'Information about the draft', rows: 2 },
  ],
  protectedListInfo: [
    { id: 'protectedListInfo', label: 'Protected List Info', placeholder: 'Information about protected lists', rows: 2 },
  ],
  calgaryFreeAgents: [
    { id: 'calgaryFreeAgents', label: 'Calgary Free Agents', placeholder: 'Calgary free agent information', rows: 2 },
  ],
  stAlbertDrillers: [
    { id: 'stAlbertDrillers', label: 'St. Albert Drillers', placeholder: 'St. Albert Drillers team information', rows: 2 },
  ],
  sherwoodParkTitans: [
    { id: 'sherwoodParkTitans', label: 'Sherwood Park Titans', placeholder: 'Sherwood Park Titans team information', rows: 2 },
  ],
  capitalRegionSaints: [
    { id: 'capitalRegionSaints', label: 'Capital Region Saints', placeholder: 'Capital Region Saints team information', rows: 2 },
  ],
  redDeerRiot: [
    { id: 'redDeerRiot', label: 'Red Deer Riot', placeholder: 'Red Deer Riot team information', rows: 2 },
  ],
  freeAgentsAMF: [
    { id: 'freeAgentsAMF', label: 'Free Agents', placeholder: 'Free agent information', rows: 2 },
  ],
  returningPlayers: [
    { id: 'returningPlayers', label: 'Returning Players', placeholder: 'Returning players information', rows: 2 },
  ],
};