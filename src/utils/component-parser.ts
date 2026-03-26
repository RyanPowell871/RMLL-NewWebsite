/**
 * Component parser utility for extracting editable data from React component files.
 *
 * This utility reads component files and extracts array data based on schema definitions.
 * It handles:
 * - Top-level const array declarations
 * - Simple string/number values
 * - Proper handling of TypeScript syntax
 */

import type { ComponentSchema, EditableField } from './component-schemas.js';

export interface ParsedComponent {
  filePath: string;
  content: string;
  extractedData: Map<string, unknown>;
  success: boolean;
  errors: string[];
}

export interface ParseResult {
  success: boolean;
  data?: unknown[];
  error?: string;
}

// ============================================
// AST-like Parsing Helpers
// ============================================

/**
 * Extract the content between matching brackets/parentheses
 */
function extractBracketedContent(content: string, startPos: number, openChar: string = '[', closeChar: string = ']'): string | null {
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let escaped = false;

  for (let i = startPos; i < content.length; i++) {
    const char = content[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (inString) {
      if (char === stringChar) {
        inString = false;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringChar = char;
      continue;
    }

    if (char === openChar) {
      depth++;
    } else if (char === closeChar) {
      depth--;
      if (depth === 0) {
        return content.substring(startPos, i + 1);
      }
    }
  }

  return null;
}

/**
 * Find a const/array declaration and extract its content
 */
function findConstDeclaration(content: string, constName: string): ParseResult {
  // Pattern to match: const NAME: Type[] = [content];
  // OR: const NAME = [content];
  const patterns = [
    // With type annotation
    new RegExp(`const\\s+${constName}\\s*:\\s*\\w+(?:\\[\\])?\\s*=\\s*\\[`, 's'),
    // Without type annotation
    new RegExp(`const\\s+${constName}\\s*=\\s*\\[`, 's'),
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const startPos = (match.index ?? 0) + match[0].length - 1; // Position of the opening '['
      const bracketedContent = extractBracketedContent(content, startPos);

      if (bracketedContent) {
        const result = parseArrayContent(bracketedContent);
        if (result.success) {
          return { success: true, data: result.data };
        }
        return { success: false, error: result.error };
      }
    }
  }

  return { success: false, error: `Could not find declaration for ${constName}` };
}

/**
 * Parse array content from bracketed string
 */
function parseArrayContent(content: string): ParseResult {
  try {
    const cleaned = content.trim();
    if (cleaned === '[]') {
      return { success: true, data: [] };
    }

    // Remove outer brackets
    const innerContent = cleaned.slice(1, -1).trim();

    if (!innerContent) {
      return { success: true, data: [] };
    }

    // Parse the array using a simple but robust approach
    const items = parseArrayItems(innerContent);
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Parse array items from content (handles nested objects)
 */
function parseArrayItems(content: string): unknown[] {
  const items: unknown[] = [];
  let currentItem = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let escaped = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (escaped) {
      currentItem += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      currentItem += char;
      continue;
    }

    if (inString) {
      currentItem += char;
      if (char === stringChar) {
        inString = false;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringChar = char;
      currentItem += char;
      continue;
    }

    if (char === '{' || char === '[') {
      depth++;
      currentItem += char;
    } else if (char === '}' || char === ']') {
      depth--;
      currentItem += char;
    } else if (char === ',' && depth === 0) {
      // End of current item
      const parsed = parseValue(currentItem.trim());
      if (parsed !== undefined) {
        items.push(parsed);
      }
      currentItem = '';
    } else {
      currentItem += char;
    }
  }

  // Add the last item
  const lastItem = currentItem.trim();
  if (lastItem) {
    const parsed = parseValue(lastItem);
    if (parsed !== undefined) {
      items.push(parsed);
    }
  }

  return items;
}

/**
 * Parse a single value (string, number, boolean, object, or array)
 */
function parseValue(value: string): unknown {
  value = value.trim();

  if (!value) {
    return undefined;
  }

  // String values
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('`') && value.endsWith('`'))) {
    // Remove quotes and unescape
    let str = value.slice(1, -1);
    // Unescape common escape sequences
    str = str.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
    return str;
  }

  // Number values
  if (/^-?\d+\.?\d*$/.test(value)) {
    return Number(value);
  }

  // Boolean values
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (value === 'undefined') return undefined;

  // Object values
  if (value.startsWith('{') && value.endsWith('}')) {
    return parseObject(value.slice(1, -1));
  }

  // Array values
  if (value.startsWith('[') && value.endsWith(']')) {
    return parseArrayItems(value.slice(1, -1));
  }

  // Try to parse as a simple string (might be a variable reference)
  return value;
}

/**
 * Parse an object from content
 */
function parseObject(content: string): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  let currentKey = '';
  let currentValue = '';
  let state: 'key' | 'after-key' | 'value' = 'key';
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let escaped = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (escaped) {
      if (state === 'value') currentValue += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      if (state === 'value') currentValue += char;
      escaped = true;
      continue;
    }

    if (inString) {
      if (state === 'key') {
        currentKey += char;
      } else {
        currentValue += char;
      }
      if (char === stringChar) {
        inString = false;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringChar = char;
      if (state === 'key') {
        currentKey += char;
      } else {
        currentValue += char;
      }
      continue;
    }

    if (state === 'key') {
      if (char === ':') {
        state = 'after-key';
      } else {
        currentKey += char;
      }
    } else if (state === 'after-key') {
      if (char !== ' ' && char !== '\t' && char !== '\n') {
        state = 'value';
        currentValue = char;
      }
    } else if (state === 'value') {
      if (char === '{' || char === '[') {
        depth++;
        currentValue += char;
      } else if (char === '}' || char === ']') {
        depth--;
        currentValue += char;
      } else if (char === ',' && depth === 0) {
        // End of this key-value pair
        const key = parseKey(currentKey.trim());
        const value = parseValue(currentValue.trim());
        if (key) {
          obj[key] = value;
        }
        currentKey = '';
        currentValue = '';
        state = 'key';
      } else {
        currentValue += char;
      }
    }
  }

  // Add the last item
  if (state === 'value') {
    const key = parseKey(currentKey.trim());
    const value = parseValue(currentValue.trim());
    if (key) {
      obj[key] = value;
    }
  }

  return obj;
}

/**
 * Parse a key (remove quotes)
 */
function parseKey(key: string): string | undefined {
  key = key.trim();
  if (!key) return undefined;

  if ((key.startsWith('"') && key.endsWith('"')) ||
      (key.startsWith("'") && key.endsWith("'"))) {
    return key.slice(1, -1);
  }

  return key;
}

/**
 * Find a simple const declaration (string, number)
 */
function findSimpleConst(content: string, constName: string): ParseResult {
  // Build regex patterns without using backticks in character classes
  // Use string concatenation to avoid template literal issues with backticks
  const basePattern = `const\\s+${constName}\\s*(?::\\s*string)?\\s*=\\s*`;
  const patterns = [
    // String literal - single quotes
    new RegExp(basePattern + `'([^']*)'`, 's'),
    // String literal - double quotes
    new RegExp(basePattern + `"([^"]*)"`, 's'),
    // String literal - backticks (separate pattern)
    new RegExp(basePattern + '`([^`]*)`', 's'),
    // Number literal
    new RegExp(`const\\s+${constName}\\s*(?::\\s*number)?\\s*=\\s*(-?\\d+\\.?\\d*)`, 's'),
    // Boolean literal
    new RegExp(`const\\s+${constName}\\s*(?::\\s*boolean)?\\s*=\\s*(true|false)`, 's'),
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1] !== undefined) {
      const value = match[1];
      // Try to parse as number
      const numValue = Number(value);
      if (!isNaN(numValue) && value !== '') {
        return { success: true, data: numValue };
      }
      // Try to parse as boolean
      if (value === 'true') return { success: true, data: true };
      if (value === 'false') return { success: true, data: false };
      // Default to string
      return { success: true, data: value };
    }
  }

  return { success: false, error: `Could not find declaration for ${constName}` };
}

// ============================================
// Main Parsing Function
// ============================================

/**
 * Parse a component file and extract editable data based on its schema
 */
export function parseComponentFile(content: string, schema: ComponentSchema): ParsedComponent {
  const extractedData = new Map<string, unknown>();
  const errors: string[] = [];
  let success = true;

  for (const field of schema.editableFields) {
    if (field.type === 'array') {
      const result = findConstDeclaration(content, field.name);
      if (result.success && result.data) {
        extractedData.set(field.name, result.data);
      } else {
        success = false;
        errors.push(`Failed to parse ${field.name}: ${result.error}`);
        extractedData.set(field.name, []);
      }
    } else if (field.type === 'simple') {
      const result = findSimpleConst(content, field.name);
      if (result.success) {
        extractedData.set(field.name, result.data);
      } else {
        // Try to find inline string/number in JSX
        const inlineResult = findInlineValue(content, field.name);
        if (inlineResult.success) {
          extractedData.set(field.name, inlineResult.data);
        } else {
          success = false;
          errors.push(`Failed to parse ${field.name}: ${result.error}`);
          extractedData.set(field.name, field.defaultValue || '');
        }
      }
    }
    // Inline fields are handled separately
  }

  return {
    filePath: schema.componentFile,
    content,
    extractedData,
    success,
    errors,
  };
}

/**
 * Find an inline value in JSX (e.g., {CONST} or inline string)
 */
function findInlineValue(content: string, varName: string): ParseResult {
  // Look for variable usage: {VAR_NAME}
  const varPattern = new RegExp(`\\{\\s*${varName}\\s*\\}`);
  if (varPattern.test(content)) {
    // Try to find where it's defined
    return findSimpleConst(content, varName);
  }

  return { success: false, error: `Could not find inline value for ${varName}` };
}

// ============================================
// Validation
// ============================================

/**
 * Validate parsed data against schema
 */
export function validateParsedData(parsed: ParsedComponent, schema: ComponentSchema): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const field of schema.editableFields) {
    if (field.type === 'array') {
      const data = parsed.extractedData.get(field.name);
      if (!Array.isArray(data)) {
        errors.push(`${field.name} should be an array`);
        continue;
      }

      // Validate each item
      for (let i = 0; i < data.length; i++) {
        const item = data[i] as Record<string, unknown>;
        for (const [key, propSchema] of Object.entries(field.itemSchema)) {
          if (propSchema.required && item[key] === undefined && item[key] === '') {
            errors.push(`${field.name}[${i}].${key} is required`);
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}