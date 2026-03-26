/**
 * Schema definitions for editable component files.
 *
 * Each schema defines:
 * - Which component file to edit
 * - What data can be extracted from it
 * - The structure of each editable field
 */

// ============================================
// Type Definitions
// ============================================

export type FieldType = 'text' | 'number' | 'boolean' | 'icon' | 'array' | 'multiline';

export interface FieldProperty {
  type: FieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
}

export interface FieldSchema {
  [key: string]: FieldProperty;
}

export interface ArrayField {
  type: 'array';
  name: string;
  label: string;
  itemSchema: FieldSchema;
  defaultItem?: Record<string, any>;
}

export interface SimpleField {
  type: 'simple';
  name: string;
  label: string;
  fieldType: 'text' | 'multiline';
  defaultValue?: string;
}

export interface InlineTextField {
  type: 'inline';
  label: string;
  pattern: RegExp;
  replacementTemplate: string;
}

export type EditableField = ArrayField | SimpleField | InlineTextField;

export interface ComponentSchema {
  pageId: string;
  componentFile: string;
  title: string;
  description?: string;
  editableFields: EditableField[];
  notEditableReason?: string;
}

// ============================================
// Component Schemas
// ============================================

/**
 * High Priority (simple array structures)
 * - code-of-conduct: CONDUCT_ITEMS[]
 * - privacy-policy: POLICY_POINTS[]
 * - registration: DIVISIONS[], STEPS[]
 * - combines: COMBINES[]
 */

export const COMPONENT_SCHEMAS: ComponentSchema[] = [
  // === Code of Conduct ===
  {
    pageId: 'code-of-conduct',
    componentFile: 'CodeOfConductPage.tsx',
    title: 'Code of Conduct',
    description: 'Edit the conduct items that all RMLL members are expected to uphold.',
    editableFields: [
      {
        type: 'array',
        name: 'CONDUCT_ITEMS',
        label: 'Conduct Items',
        itemSchema: {
          letter: { type: 'text', label: 'Letter', required: true, placeholder: 'A' },
          text: { type: 'text', label: 'Description', required: true },
        },
        defaultItem: { letter: '', text: '' },
      },
    ],
  },

  // === Privacy Policy ===
  {
    pageId: 'privacy-policy',
    componentFile: 'PrivacyPolicyPage.tsx',
    title: 'Privacy Policy',
    description: 'Edit privacy policy points and contact information.',
    editableFields: [
      {
        type: 'array',
        name: 'POLICY_POINTS',
        label: 'Policy Points',
        itemSchema: {
          icon: { type: 'icon', label: 'Icon (component name)', required: true, placeholder: 'Shield' },
          title: { type: 'text', label: 'Title', required: true },
          description: { type: 'multiline', label: 'Description', required: true },
        },
        defaultItem: { icon: 'Shield', title: '', description: '' },
      },
      {
        type: 'simple',
        name: 'PRIVACY_OFFICER_TEXT',
        label: 'Privacy Officer Contact Text',
        fieldType: 'multiline',
        defaultValue: 'The President of the RMLL serves as the Privacy Officer for the RMLL.',
      },
    ],
  },

  // === Registration ===
  {
    pageId: 'registration',
    componentFile: 'RegistrationPage.tsx',
    title: 'Intent-to-Play Registration',
    description: 'Edit registration divisions and step-by-step instructions.',
    editableFields: [
      {
        type: 'array',
        name: 'DIVISIONS',
        label: 'Divisions',
        itemSchema: {
          name: { type: 'text', label: 'Name', required: true },
          dob: { type: 'text', label: 'DOB Range', required: true, placeholder: 'DOB 2009, 2008, 2007' },
          note: { type: 'text', label: 'Note' },
          color: { type: 'text', label: 'Tailwind Color Classes', placeholder: 'bg-blue-50 border-blue-300' },
        },
        defaultItem: { name: '', dob: '', note: '', color: 'bg-blue-50 border-blue-300' },
      },
      {
        type: 'array',
        name: 'STEPS',
        label: 'Registration Steps',
        itemSchema: {
          step: { type: 'number', label: 'Step Number', required: true },
          title: { type: 'text', label: 'Title', required: true },
          description: { type: 'multiline', label: 'Description', required: true },
        },
        defaultItem: { step: 1, title: '', description: '' },
      },
      {
        type: 'simple',
        name: 'REGISTRATION_FEE',
        label: 'Registration Fee',
        fieldType: 'text',
        defaultValue: '$87.00',
      },
      {
        type: 'simple',
        name: 'REGISTRATION_URL',
        label: 'Registration URL',
        fieldType: 'text',
        defaultValue: 'http://rmll.rampregistrations.com',
      },
    ],
  },

  // === Combines ===
  {
    pageId: 'combines',
    componentFile: 'CombinesPage.tsx',
    title: 'Junior Combines',
    description: 'Edit Junior Combine events and information.',
    editableFields: [
      {
        type: 'array',
        name: 'COMBINES',
        label: 'Combine Events',
        itemSchema: {
          name: { type: 'text', label: 'Name', required: true },
          region: { type: 'text', label: 'Region (north/south)', required: true },
          date: { type: 'text', label: 'Date', required: true },
          time: { type: 'text', label: 'Time', required: true },
          location: { type: 'text', label: 'Location', required: true },
          locationDetail: { type: 'text', label: 'Location Detail' },
          cost: { type: 'text', label: 'Cost', required: true },
          costNote: { type: 'text', label: 'Cost Note' },
          who: { type: 'multiline', label: 'Who Should Attend', required: true },
          registrationDeadline: { type: 'text', label: 'Registration Deadline', required: true },
          registrationUrl: { type: 'text', label: 'Registration URL', required: true },
          waiverUrl: { type: 'text', label: 'Waiver URL' },
          waiverNote: { type: 'text', label: 'Waiver Note' },
          capacityNote: { type: 'text', label: 'Capacity Note' },
        },
        defaultItem: {
          name: '',
          region: 'north',
          date: '',
          time: '',
          location: '',
          cost: '',
          who: '',
          registrationDeadline: '',
          registrationUrl: '',
        },
      },
    ],
  },

  // === Bad Standing ===
  {
    pageId: 'bad-standing',
    componentFile: 'BadStandingPage.tsx',
    title: 'Players in Bad Standing',
    description: 'Manage the list of players in bad standing due to outstanding fees.',
    editableFields: [
      {
        type: 'array',
        name: 'BAD_STANDING_LIST',
        label: 'Bad Standing List',
        itemSchema: {
          date: { type: 'text', label: 'Date Display', required: true },
          sortDate: { type: 'text', label: 'Sortable Date (YYYY-MM-DD)', required: true },
          player: { type: 'text', label: 'Player Name', required: true },
          team: { type: 'text', label: 'Team', required: true },
          feesOwed: { type: 'text', label: 'Fees Owed', required: true },
        },
        defaultItem: { date: '', sortDate: '', player: '', team: '', feesOwed: '' },
      },
      {
        type: 'simple',
        name: 'LAST_UPDATED',
        label: 'Last Updated',
        fieldType: 'text',
        defaultValue: 'February 5, 2026',
      },
    ],
  },

  // === Super Coaching Clinic ===
  {
    pageId: 'super-coaching-clinic',
    componentFile: 'SuperCoachingClinicPage.tsx',
    title: 'Super Coaching Clinic',
    description: 'Edit coaching clinic instructors and schedule.',
    editableFields: [
      {
        type: 'array',
        name: 'INSTRUCTORS',
        label: 'Instructors',
        itemSchema: {
          name: { type: 'text', label: 'Name', required: true },
          credentials: { type: 'multiline', label: 'Credentials/Bio', required: true },
        },
        defaultItem: { name: '', credentials: '' },
      },
      {
        type: 'array',
        name: 'TOPICS',
        label: 'Topics',
        itemSchema: {
          topic: { type: 'text', label: 'Topic Name', required: true },
        },
        defaultItem: { topic: '' },
      },
      {
        type: 'array',
        name: 'SCHEDULE',
        label: 'Schedule',
        itemSchema: {
          day: { type: 'text', label: 'Day', required: true },
          time: { type: 'text', label: 'Time', required: true },
          label: { type: 'text', label: 'Label', required: true },
        },
        defaultItem: { day: '', time: '', label: '' },
      },
    ],
  },

  // === New Player Info ===
  {
    pageId: 'new-player-info',
    componentFile: 'NewPlayerInfoPage.tsx',
    title: 'New Player Info (Junior)',
    description: 'Edit new player information for Junior division.',
    editableFields: [
      {
        type: 'array',
        name: 'DIVISIONS',
        label: 'Divisions',
        itemSchema: {
          name: { type: 'text', label: 'Division Name', required: true },
          teams: { type: 'number', label: 'Number of Teams', required: true },
          note: { type: 'text', label: 'Note' },
        },
        defaultItem: { name: '', teams: 0, note: '' },
      },
      {
        type: 'array',
        name: 'MINOR_VS_JUNIOR',
        label: 'Minor vs Junior Differences',
        itemSchema: {
          difference: { type: 'text', label: 'Difference', required: true },
        },
        defaultItem: { difference: '' },
      },
      {
        type: 'array',
        name: 'CONTACTS',
        label: 'Key Contacts',
        itemSchema: {
          role: { type: 'text', label: 'Role', required: true },
          name: { type: 'text', label: 'Name', required: true },
          email: { type: 'text', label: 'Email', required: true },
        },
        defaultItem: { role: '', name: '', email: '' },
      },
    ],
  },

  // === New Player Info (Female) ===
  {
    pageId: 'new-player-info-female',
    componentFile: 'NewPlayerInfoFemalePage.tsx',
    title: 'New Player Info (Female)',
    description: 'Edit new player information for Female division.',
    editableFields: [
      {
        type: 'array',
        name: 'DIFFERENCES',
        label: 'Differences',
        itemSchema: {
          difference: { type: 'text', label: 'Difference', required: true },
        },
        defaultItem: { difference: '' },
      },
      {
        type: 'array',
        name: 'DIVISIONS',
        label: 'Divisions',
        itemSchema: {
          name: { type: 'text', label: 'Division Name', required: true },
          teams: { type: 'number', label: 'Number of Teams', required: true },
          note: { type: 'text', label: 'Note' },
        },
        defaultItem: { name: '', teams: 0, note: '' },
      },
      {
        type: 'array',
        name: 'NORTH_FRANCHISES',
        label: 'North Franchises',
        itemSchema: {
          name: { type: 'text', label: 'Franchise Name', required: true },
          region: { type: 'text', label: 'Region', required: true, placeholder: 'north' },
          boundaryDescription: { type: 'multiline', label: 'Boundary Description' },
          website: { type: 'text', label: 'Website URL' },
        },
        defaultItem: { name: '', region: 'north', boundaryDescription: '', website: '' },
      },
      {
        type: 'array',
        name: 'SOUTH_FRANCHISES',
        label: 'South Franchises',
        itemSchema: {
          name: { type: 'text', label: 'Franchise Name', required: true },
          region: { type: 'text', label: 'Region', required: true, placeholder: 'south' },
        },
        defaultItem: { name: '', region: 'south' },
      },
      {
        type: 'array',
        name: 'KEY_CONTACTS',
        label: 'Key Contacts',
        itemSchema: {
          role: { type: 'text', label: 'Role', required: true },
          name: { type: 'text', label: 'Name', required: true },
          email: { type: 'text', label: 'Email', required: true },
        },
        defaultItem: { role: '', name: '', email: '' },
      },
    ],
  },

  // === Point Leader Awards ===
  {
    pageId: 'point-leader-awards',
    componentFile: 'PointLeaderAwards.tsx',
    title: 'Point Leader Awards',
    description: 'Edit point leader award divisions and recipients.',
    editableFields: [
      {
        type: 'array',
        name: 'DIVISION_AWARDS',
        label: 'Division Awards',
        itemSchema: {
          division: { type: 'text', label: 'Division Name', required: true },
          awardName: { type: 'text', label: 'Award Name', required: true },
          recipients: { type: 'array', label: 'Recipients (comma-separated)' },
        },
        defaultItem: { division: '', awardName: '', recipients: [] },
      },
    ],
  },

  // === LC & ALA Info ===
  {
    pageId: 'lc-ala-info',
    componentFile: 'LCALAInfoPage.tsx',
    title: 'LC & ALA Info',
    description: 'Edit LC and ALA links and information.',
    editableFields: [
      {
        type: 'array',
        name: 'LC_LINKS',
        label: 'Lacrosse Canada Links',
        itemSchema: {
          name: { type: 'text', label: 'Name', required: true },
          url: { type: 'text', label: 'URL', required: true },
          description: { type: 'text', label: 'Description' },
        },
        defaultItem: { name: '', url: '', description: '' },
      },
      {
        type: 'array',
        name: 'ALA_LINKS',
        label: 'Alberta Lacrosse Links',
        itemSchema: {
          name: { type: 'text', label: 'Name', required: true },
          url: { type: 'text', label: 'URL', required: true },
          description: { type: 'text', label: 'Description' },
        },
        defaultItem: { name: '', url: '', description: '' },
      },
    ],
  },

  // === Brand Guidelines ===
  {
    pageId: 'brand-guidelines',
    componentFile: 'BrandGuidelinesPage.tsx',
    title: 'Brand Guidelines',
    description: 'Edit brand colors and logo variants.',
    editableFields: [
      {
        type: 'array',
        name: 'BRAND_COLORS',
        label: 'Brand Colors',
        itemSchema: {
          name: { type: 'text', label: 'Color Name', required: true },
          hex: { type: 'text', label: 'Hex Code', required: true },
          usage: { type: 'text', label: 'Usage Notes' },
        },
        defaultItem: { name: '', hex: '', usage: '' },
      },
      {
        type: 'array',
        name: 'LOGO_VARIANTS',
        label: 'Logo Variants',
        itemSchema: {
          name: { type: 'text', label: 'Variant Name', required: true },
          description: { type: 'text', label: 'Description', required: true },
          format: { type: 'text', label: 'File Format' },
        },
        defaultItem: { name: '', description: '', format: '' },
      },
    ],
  },

  // === Affiliate Links ===
  {
    pageId: 'affiliate-links',
    componentFile: 'AffiliateLinksPage.tsx',
    title: 'Affiliate Links',
    description: 'Edit affiliate organization links. Note: This component uses inline sections definition.',
    editableFields: [],
    notEditableReason: 'This component uses inline sections defined within the component function. Please edit the file directly.',
  },

  // === Record Books ===
  {
    pageId: 'record-books',
    componentFile: 'RecordBooksPage.tsx',
    title: 'Record Books',
    description: 'Edit record book tabs and records.',
    editableFields: [
      {
        type: 'array',
        name: 'RECORD_BOOK_TABS',
        label: 'Record Book Tabs',
        itemSchema: {
          id: { type: 'text', label: 'Tab ID', required: true },
          title: { type: 'text', label: 'Tab Title', required: true },
          records: { type: 'array', label: 'Records' },
        },
        defaultItem: { id: '', title: '', records: [] },
      },
    ],
  },

  // === Graduating U17 Info ===
  {
    pageId: 'graduating-u17-info',
    componentFile: 'GraduatingU17InfoPage.tsx',
    title: 'Graduating U17 Info',
    description: 'Edit graduating U17 player information sessions.',
    editableFields: [
      {
        type: 'array',
        name: 'SESSIONS',
        label: 'Info Sessions',
        itemSchema: {
          city: { type: 'text', label: 'City', required: true },
          date: { type: 'text', label: 'Date', required: true },
          venue: { type: 'text', label: 'Venue', required: true },
          address: { type: 'text', label: 'Address', required: true },
          time: { type: 'text', label: 'Time', required: true },
        },
        defaultItem: { city: '', date: '', venue: '', address: '', time: '' },
      },
    ],
  },

  // === Awards (Complex) ===
  {
    pageId: 'awards',
    componentFile: 'AwardsPage.tsx',
    title: 'Awards',
    description: 'Edit award information and recipients. This has a complex nested structure.',
    editableFields: [],
    notEditableReason: 'This component has a complex nested structure with biography arrays. Please edit the file directly.',
  },
];

// ============================================
// Helper Functions
// ============================================

/**
 * Get schema by page ID
 */
export function getSchemaByPageId(pageId: string): ComponentSchema | undefined {
  return COMPONENT_SCHEMAS.find((s) => s.pageId === pageId);
}

/**
 * Get all editable schemas (excluding those marked as not editable)
 */
export function getEditableSchemas(): ComponentSchema[] {
  return COMPONENT_SCHEMAS.filter((s) =>
    s.editableFields.length > 0 && !s.notEditableReason
  );
}

/**
 * Check if a component is editable
 */
export function isComponentEditable(pageId: string): boolean {
  const schema = getSchemaByPageId(pageId);
  if (!schema) return false;
  return schema.editableFields.length > 0 && !schema.notEditableReason;
}