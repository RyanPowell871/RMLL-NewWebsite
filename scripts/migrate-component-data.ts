/**
 * Migration Script: Extract component data to database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const COMPONENT_SCHEMAS = [
  {
    pageId: 'code-of-conduct',
    componentFile: 'CodeOfConductPage.tsx',
    title: 'Code of Conduct',
    editableFields: [
      { type: 'array', name: 'CONDUCT_ITEMS', label: 'Conduct Items' },
    ],
  },
  {
    pageId: 'privacy-policy',
    componentFile: 'PrivacyPolicyPage.tsx',
    title: 'Privacy Policy',
    editableFields: [
      { type: 'array', name: 'POLICY_POINTS', label: 'Policy Points' },
      { type: 'simple', name: 'PRIVACY_OFFICER_TEXT', label: 'Privacy Officer Contact Text', defaultValue: '' },
    ],
  },
  {
    pageId: 'registration',
    componentFile: 'RegistrationPage.tsx',
    title: 'Intent-to-Play Registration',
    editableFields: [
      { type: 'array', name: 'DIVISIONS', label: 'Divisions' },
      { type: 'array', name: 'STEPS', label: 'Registration Steps' },
      { type: 'simple', name: 'REGISTRATION_FEE', label: 'Registration Fee', defaultValue: '' },
      { type: 'simple', name: 'REGISTRATION_URL', label: 'Registration URL', defaultValue: '' },
    ],
  },
  {
    pageId: 'combines',
    componentFile: 'CombinesPage.tsx',
    title: 'Junior Combines',
    editableFields: [
      { type: 'array', name: 'COMBINES', label: 'Combine Events' },
    ],
  },
  {
    pageId: 'bad-standing',
    componentFile: 'BadStandingPage.tsx',
    title: 'Players in Bad Standing',
    editableFields: [
      { type: 'array', name: 'BAD_STANDING_LIST', label: 'Bad Standing List' },
      { type: 'simple', name: 'LAST_UPDATED', label: 'Last Updated', defaultValue: '' },
    ],
  },
  {
    pageId: 'super-coaching-clinic',
    componentFile: 'SuperCoachingClinicPage.tsx',
    title: 'Super Coaching Clinic',
    editableFields: [
      { type: 'array', name: 'INSTRUCTORS', label: 'Instructors' },
      { type: 'array', name: 'TOPICS', label: 'Topics' },
      { type: 'array', name: 'SCHEDULE', label: 'Schedule' },
    ],
  },
  {
    pageId: 'new-player-info',
    componentFile: 'NewPlayerInfoPage.tsx',
    title: 'New Player Info (Junior)',
    editableFields: [
      { type: 'array', name: 'DIVISIONS', label: 'Divisions' },
      { type: 'array', name: 'MINOR_VS_JUNIOR', label: 'Minor vs Junior Differences' },
      { type: 'array', name: 'CONTACTS', label: 'Key Contacts' },
    ],
  },
  {
    pageId: 'new-player-info-female',
    componentFile: 'NewPlayerInfoFemalePage.tsx',
    title: 'New Player Info (Female)',
    editableFields: [
      { type: 'array', name: 'DIFFERENCES', label: 'Differences' },
      { type: 'array', name: 'DIVISIONS', label: 'Divisions' },
      { type: 'array', name: 'NORTH_FRANCHISES', label: 'North Franchises' },
      { type: 'array', name: 'SOUTH_FRANCHISES', label: 'South Franchises' },
      { type: 'array', name: 'KEY_CONTACTS', label: 'Key Contacts' },
    ],
  },
  {
    pageId: 'point-leader-awards',
    componentFile: 'PointLeaderAwards.tsx',
    title: 'Point Leader Awards',
    editableFields: [
      { type: 'array', name: 'DIVISION_AWARDS', label: 'Division Awards' },
    ],
  },
  {
    pageId: 'lc-ala-info',
    componentFile: 'LCALAInfoPage.tsx',
    title: 'LC & ALA Info',
    editableFields: [
      { type: 'array', name: 'LC_LINKS', label: 'Lacrosse Canada Links' },
      { type: 'array', name: 'ALA_LINKS', label: 'Alberta Lacrosse Links' },
    ],
  },
  {
    pageId: 'brand-guidelines',
    componentFile: 'BrandGuidelinesPage.tsx',
    title: 'Brand Guidelines',
    editableFields: [
      { type: 'array', name: 'BRAND_COLORS', label: 'Brand Colors' },
      { type: 'array', name: 'LOGO_VARIANTS', label: 'Logo Variants' },
    ],
  },
  {
    pageId: 'record-books',
    componentFile: 'RecordBooksPage.tsx',
    title: 'Record Books',
    editableFields: [
      { type: 'array', name: 'RECORD_BOOK_TABS', label: 'Record Book Tabs' },
    ],
  },
  {
    pageId: 'graduating-u17-info',
    componentFile: 'GraduatingU17InfoPage.tsx',
    title: 'Graduating U17 Info',
    editableFields: [
      { type: 'array', name: 'SESSIONS', label: 'Info Sessions' },
    ],
  },
];

const supabaseUrl = 'https://nkfbehspyjookipapdbp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
  console.error('Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Extract array using bracket matching
 */
function extractArray(content: string, arrayName: string): any[] {
  // Find the array declaration ending with =
  const pattern = new RegExp(
    `const\\s+${arrayName}\\s*(?::\\s*[^=]+)?\\s*=`,
    'm'
  );

  const match = content.match(pattern);
  if (!match) {
    console.log(`  [WARN] Could not find array ${arrayName}`);
    return [];
  }

  // Find the opening bracket AFTER the equals sign
  const afterEquals = content.substring(match.index + match[0].length);
  const bracketIndexInSubstring = afterEquals.indexOf('[');

  if (bracketIndexInSubstring === -1) {
    console.log(`  [WARN] No opening bracket for ${arrayName}`);
    return [];
  }

  // Calculate actual position in original content
  const bracketIndex = match.index + match[0].length + bracketIndexInSubstring;

  // Find matching closing bracket
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let endIndex = -1;

  for (let i = bracketIndex; i < content.length; i++) {
    const c = content[i];

    // String handling
    if (inString) {
      if (c === stringChar && content[i - 1] !== '\\') {
        inString = false;
      }
      continue;
    }
    if (c === '"' || c === "'") {
      inString = true;
      stringChar = c;
      continue;
    }

    // Bracket counting
    if (c === '[') depth++;
    else if (c === ']') {
      depth--;
      if (depth === 0) {
        endIndex = i;
        break;
      }
    }
  }

  if (endIndex === -1) {
    console.log(`  [WARN] No closing bracket for ${arrayName}`);
    return [];
  }

  let arrayStr = content.substring(bracketIndex, endIndex + 1);

  try {
    // Replace JSX
    arrayStr = arrayStr.replace(/<\w+(?:\s+[^>]*?)?\s*\/>/g, '"JSX_COMPONENT"');
    arrayStr = arrayStr.replace(/<\w+(?:\s+[^>]*?)?>[\s\S]*?<\/\w+>/g, '"JSX_COMPONENT"');

    // Replace undefined with null
    arrayStr = arrayStr.replace(/\bundefined\b/g, 'null');

    // Add common variables
    const vars = `
      const SPORTZSOFT_REG_URL = 'https://sportzsoft.com';
      const SOUTH_WAIVER_URL = 'https://waiver.smartwaiver.com';
      const NORTH_WAIVER_URL = 'https://waiver.smartwaiver.com';
      const shieldLogo = '';
      const horizontalLogo = '';
      const iconLogo = '';
    `;

    const fn = new Function(`${vars} return ${arrayStr}`);
    const result = fn();

    return Array.isArray(result) ? cleanValue(result) : [];
  } catch (e: any) {
    console.error(`  [ERROR] ${arrayName}:`, e.message);
    return [];
  }
}

function cleanValue(v: any): any {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  if (Array.isArray(v)) return v.map(cleanValue);
  if (typeof v === 'object') {
    const r: any = {};
    for (const k in v) {
      if (v[k] !== undefined) r[k] = cleanValue(v[k]);
    }
    return r;
  }
  return null;
}

function extractSimpleValue(content: string, varName: string): string {
  const m = content.match(new RegExp(`const\\s+${varName}\\s*=\\s*(['"])([^'"]+)\\1\\s*;`));
  return m ? m[2] : '';
}

async function migrateComponentData() {
  const dir = join(process.cwd(), 'src', 'components', 'league-info');
  console.log('Starting migration...\n');

  for (const schema of COMPONENT_SCHEMAS) {
    console.log(`Processing: ${schema.title} (${schema.pageId})`);
    const filePath = join(dir, schema.componentFile);

    try {
      const content = readFileSync(filePath, 'utf-8');
      const extractedData: Record<string, any> = {};

      for (const field of schema.editableFields) {
        if (field.type === 'array') {
          const data = extractArray(content, field.name);
          console.log(`  ${field.name}: ${data.length} items`);
          extractedData[field.name] = data;
        } else if (field.type === 'simple') {
          const value = extractSimpleValue(content, field.name);
          console.log(`  ${field.name}: ${value || '(default)'}`);
          extractedData[field.name] = value;
        }
      }

      const { error } = await supabase.from('rmll_component_content').upsert({
        page_id: schema.pageId,
        component_file: schema.componentFile,
        title: schema.title,
        content: '// Migrated',
        extracted_data: extractedData,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'page_id' });

      if (error) {
        console.error(`  [ERROR] ${error.message}`);
      } else {
        console.log(`  [OK]\n`);
      }
    } catch (e: any) {
      console.error(`  [ERROR] ${e.message}\n`);
    }
  }

  console.log('Migration complete!');
}

migrateComponentData().catch(console.error);