/**
 * Structured Content Block System for League Info Pages
 * 
 * Each page's content is defined as an array of sections,
 * each containing typed content blocks. The CMS editor
 * renders appropriate form controls per block type,
 * and the ContentBlockRenderer turns blocks into styled React.
 */

// ─── Content Block Types ───

export interface HeroBlock {
  type: 'hero';
  icon?: string;            // lucide icon name
  title: string;
  subtitle?: string;
  accentColor?: string;     // default: '#013fac'
}

export interface ParagraphBlock {
  type: 'paragraph';
  text: string;             // supports basic HTML (<strong>, <a>, <em>, etc.)
}

export interface HeadingBlock {
  type: 'heading';
  text: string;
  level: 2 | 3 | 4;
}

export interface BlockquoteBlock {
  type: 'blockquote';
  text: string;             // supports HTML
}

export interface ListBlock {
  type: 'list';
  items: string[];          // each item can contain HTML
  ordered?: boolean;
}

export interface LetteredListBlock {
  type: 'lettered-list';
  items: { letter: string; text: string }[];
}

export interface StepsBlock {
  type: 'steps';
  items: { step: number; title: string; description: string }[];
}

export interface CardGridBlock {
  type: 'card-grid';
  columns?: 1 | 2 | 3;
  items: {
    title: string;
    description: string;
    icon?: string;         // lucide icon name
    color?: 'blue' | 'red' | 'green' | 'purple' | 'amber' | 'gray';
  }[];
}

export interface LinkListBlock {
  type: 'link-list';
  items: {
    label: string;
    url: string;
    description?: string;
  }[];
}

export interface TableBlock {
  type: 'table';
  title?: string;
  headers: string[];
  rows: string[][];
  note?: string;
}

export interface ChampionshipListBlock {
  type: 'championship-list';
  items: { year: string; detail: string; highlight?: boolean }[];
}

export interface InfoBoxBlock {
  type: 'info-box';
  title?: string;
  content: string;         // supports HTML
  variant?: 'info' | 'warning' | 'success' | 'dark';
}

export interface ContactTableBlock {
  type: 'contact-table';
  items: { position: string; name: string; email?: string }[];
}

export interface DividerBlock {
  type: 'divider';
}

export interface ButtonLinkBlock {
  type: 'button-link';
  label: string;
  sublabel?: string;
  url: string;
  icon?: string;
}

export interface KeyValueBlock {
  type: 'key-value';
  items: { label: string; value: string; icon?: string }[];
}

export type ContentBlock =
  | HeroBlock
  | ParagraphBlock
  | HeadingBlock
  | BlockquoteBlock
  | ListBlock
  | LetteredListBlock
  | StepsBlock
  | CardGridBlock
  | LinkListBlock
  | TableBlock
  | ChampionshipListBlock
  | InfoBoxBlock
  | ContactTableBlock
  | DividerBlock
  | ButtonLinkBlock
  | KeyValueBlock;

// ─── Section & Page Schema ───

export interface ContentSection {
  id: string;
  title: string;
  icon?: string;           // lucide icon name
  collapsible?: boolean;
  defaultOpen?: boolean;
  accentColor?: string;    // hex colour
  blocks: ContentBlock[];
}

export interface PageContentSchema {
  pageId: string;
  title: string;
  sections: ContentSection[];
}

// ─── Helper to get a human-readable label for a block type ───
export const BLOCK_TYPE_LABELS: Record<ContentBlock['type'], string> = {
  'hero': 'Hero Banner',
  'paragraph': 'Paragraph',
  'heading': 'Heading',
  'blockquote': 'Blockquote',
  'list': 'List',
  'lettered-list': 'Lettered List',
  'steps': 'Steps',
  'card-grid': 'Card Grid',
  'link-list': 'Link List',
  'table': 'Data Table',
  'championship-list': 'Championship List',
  'info-box': 'Info Box',
  'contact-table': 'Contact Table',
  'divider': 'Divider',
  'button-link': 'Button Link',
  'key-value': 'Key-Value Pairs',
};

// All block types available for insertion
export const ALL_BLOCK_TYPES = Object.keys(BLOCK_TYPE_LABELS) as ContentBlock['type'][];

// ─── Merge function: apply KV overrides to defaults ───
export function mergePageContent(
  defaults: PageContentSchema,
  overrides: Partial<PageContentSchema> | null
): PageContentSchema {
  if (!overrides) return defaults;

  const merged = { ...defaults };

  // Override title if provided
  if (overrides.title) merged.title = overrides.title;

  // Override sections — match by section ID
  if (overrides.sections && overrides.sections.length > 0) {
    merged.sections = overrides.sections as ContentSection[];
  }

  return merged;
}
