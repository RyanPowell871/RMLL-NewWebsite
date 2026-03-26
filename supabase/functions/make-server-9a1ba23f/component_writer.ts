/**
 * Component writer utility for updating React component files.
 *
 * This utility writes changes back to component files by:
 * 1. Finding the original array/object declaration
 * 2. Replacing it with the new data
 * 3. Preserving formatting and comments where possible
 */

import type { ComponentSchema, EditableField } from "./component_schemas.ts";

export interface UpdateResult {
  success: boolean;
  newContent?: string;
  error?: string;
}

// ============================================
// Value Serialization
// ============================================

/**
 * Serialize a value to TypeScript/JavaScript syntax
 */
export function serializeValue(value: unknown, indent: number = 0): string {
  const indentStr = ' '.repeat(indent);

  if (value === null) {
    return 'null';
  }

  if (value === undefined) {
    return 'undefined';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'string') {
    // Check if the string contains newlines
    if (value.includes('\n')) {
      // Use template literal for multi-line strings
      return '`' + value.replace(/`/g, '\\`').replace(/\$/g, '\\$') + '`';
    }
    // Use single quotes for simple strings
    return "'" + value.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }
    return serializeArray(value, indent);
  }

  if (typeof value === 'object') {
    return serializeObject(value as Record<string, unknown>, indent);
  }

  return String(value);
}

/**
 * Serialize an array to TypeScript syntax
 */
function serializeArray(arr: unknown[], indent: number = 0): string {
  const indentStr = ' '.repeat(indent);
  const innerIndentStr = ' '.repeat(indent + 2);

  // If array contains simple values only, keep it on one line
  const isSimple = arr.every((item) =>
    typeof item === 'string' ||
    typeof item === 'number' ||
    typeof item === 'boolean'
  );

  if (isSimple && arr.length <= 4) {
    return '[' + arr.map((item) => serializeValue(item, 0)).join(', ') + ']';
  }

  // Multi-line format
  const items = arr.map((item) => innerIndentStr + serializeValue(item, indent + 2));
  return '[\n' + items.join(',\n') + ',\n' + indentStr + ']';
}

/**
 * Serialize an object to TypeScript syntax
 */
function serializeObject(obj: Record<string, unknown>, indent: number = 0): string {
  const indentStr = ' '.repeat(indent);
  const innerIndentStr = ' '.repeat(indent + 2);

  const entries = Object.entries(obj).map(([key, value]) => {
    return innerIndentStr + key + ': ' + serializeValue(value, indent + 2);
  });

  if (entries.length === 0) {
    return '{}';
  }

  return '{\n' + entries.join(',\n') + '\n' + indentStr + '}';
}

/**
 * Special serialization for arrays with specific field names
 * (handles the case where itemSchema uses different keys than the actual data)
 */
export function serializeArrayBySchema(
  arr: unknown[],
  fieldSchema: Record<string, { type: string }>,
  indent: number = 0
): string {
  const indentStr = ' '.repeat(indent);
  const innerIndentStr = ' '.repeat(indent + 2);

  const items = arr.map((item) => {
    const obj = item as Record<string, unknown>;
    const entries = Object.keys(fieldSchema).map((key) => {
      return innerIndentStr + key + ': ' + serializeValue(obj[key], indent + 2);
    });
    return innerIndentStr + '{\n' + entries.join(',\n') + '\n' + innerIndentStr + '}';
  });

  if (items.length === 0) {
    return '[]';
  }

  return '[\n' + items.join(',\n') + '\n' + indentStr + ']';
}

// ============================================
// Finding and Replacing Declarations
// ============================================

/**
 * Find the start and end positions of a const array/object declaration
 */
function findDeclarationBounds(content: string, constName: string): {
  start: number;
  end: number;
  beforeEquals: string;
  afterEquals: string;
} | null {
  // Pattern to match: const NAME: Type[] = [
  const pattern = new RegExp(`(const\\s+${constName}\\s*(?::\\s*[^=]+)?)\\s*=\\s*\\[`, 's');
  const match = content.match(pattern);

  if (!match) {
    // Try without type annotation
    const simplePattern = new RegExp(`(const\\s+${constName})\\s*=\\s*\\[`, 's');
    const simpleMatch = content.match(simplePattern);

    if (!simpleMatch) {
      return null;
    }

    const startPos = (simpleMatch.index ?? 0) + simpleMatch[0].length - 1; // Position of '['

    // Find the matching closing bracket
    const endPos = findMatchingBracket(content, startPos, '[', ']');
    if (endPos === null) return null;

    return {
      start: simpleMatch.index ?? 0,
      end: endPos + 1,
      beforeEquals: simpleMatch[1],
      afterEquals: '',
    };
  }

  const startPos = (match.index ?? 0) + match[0].length - 1; // Position of '['
  const endPos = findMatchingBracket(content, startPos, '[', ']');

  if (endPos === null) return null;

  return {
    start: match.index ?? 0,
    end: endPos + 1,
    beforeEquals: match[1],
    afterEquals: '',
  };
}

/**
 * Find matching closing bracket position
 */
function findMatchingBracket(
  content: string,
  startPos: number,
  openChar: string = '[',
  closeChar: string = ']'
): number | null {
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
        return i;
      }
    }
  }

  return null;
}

/**
 * Find the bounds of a simple const declaration (string, number, boolean)
 */
function findSimpleConstBounds(
  content: string,
  constName: string
): { start: number; end: number; beforeEquals: string } | null {
  // Pattern to match: const NAME: type = value;
  const pattern = new RegExp(
    `(const\\s+${constName}\\s*(?::\\s*\\w+)?)\\s*=\\s*([^;\\n]+);`,
    's'
  );

  const match = content.match(pattern);

  if (!match) {
    return null;
  }

  return {
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
    beforeEquals: match[1],
  };
}

// ============================================
// Main Update Function
// ============================================

/**
 * Update a component file with new data for a specific field
 */
export function updateComponentFile(
  content: string,
  fieldName: string,
  newData: unknown
): UpdateResult {
  // Try to find and update an array/object declaration
  const arrayBounds = findDeclarationBounds(content, fieldName);

  if (arrayBounds) {
    const { start, end, beforeEquals } = arrayBounds;

    // Serialize the new data
    const serialized = serializeValue(newData, 2);

    // Build the replacement
    const before = content.substring(0, start);
    const after = content.substring(end);

    // Preserve the indentation of the original declaration
    const indentMatch = before.match(/([ \t]*)$/);
    const indent = indentMatch ? indentMatch[1] : '';

    // Create new declaration with proper indentation
    let newContent: string;

    if (typeof newData === 'string' && !newData.includes('\n')) {
      // Simple string value
      newContent = before + beforeEquals + ' = ' + serializeValue(newData, 0) + ';' + after;
    } else {
      // Array or object value
      newContent = before + beforeEquals + ' =\n' + indent + serialized + ';' + after;
    }

    return { success: true, newContent };
  }

  // Try to find and update a simple const declaration
  const simpleBounds = findSimpleConstBounds(content, fieldName);

  if (simpleBounds) {
    const { start, end, beforeEquals } = simpleBounds;
    const before = content.substring(0, start);
    const after = content.substring(end);

    const newContent = before + beforeEquals + ' = ' + serializeValue(newData, 0) + ';' + after;

    return { success: true, newContent };
  }

  return { success: false, error: `Could not find declaration for ${fieldName}` };
}

/**
 * Update all fields in a component file based on schema
 */
export function updateComponentFileFromSchema(
  content: string,
  schema: ComponentSchema,
  newData: Map<string, unknown>
): UpdateResult {
  let newContent = content;

  for (const field of schema.editableFields) {
    if (field.type === 'array' || field.type === 'simple') {
      const value = newData.get(field.name);
      if (value !== undefined) {
        const result = updateComponentFile(newContent, field.name, value);
        if (result.success && result.newContent) {
          newContent = result.newContent;
        } else {
          return { success: false, error: result.error };
        }
      }
    }
  }

  return { success: true, newContent };
}

// ============================================
// Diff and Preview
// ============================================

/**
 * Create a diff preview of changes
 */
export function createDiffPreview(original: string, updated: string): string {
  const lines1 = original.split('\n');
  const lines2 = updated.split('\n');

  const diff: string[] = [];

  // Simple line-by-line diff
  const maxLines = Math.max(lines1.length, lines2.length);

  for (let i = 0; i < maxLines; i++) {
    const line1 = lines1[i] ?? '';
    const line2 = lines2[i] ?? '';

    if (line1 !== line2) {
      if (line1) {
        diff.push(`- ${line1}`);
      }
      if (line2) {
        diff.push(`+ ${line2}`);
      }
    }
  }

  return diff.join('\n');
}

/**
 * Validate that the new content is syntactically valid
 * (basic check for matching brackets/parentheses)
 */
export function validateSyntax(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const brackets: { char: string; pos: number }[] = [];

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    // Skip strings
    if (char === '"' || char === "'" || char === '`') {
      const endQuote = content.indexOf(char, i + 1);
      if (endQuote === -1) {
        errors.push(`Unclosed string at position ${i}`);
      } else {
        i = endQuote;
      }
      continue;
    }

    if (char === '{' || char === '[' || char === '(') {
      brackets.push({ char, pos: i });
    } else if (char === '}' || char === ']' || char === ')') {
      const last = brackets.pop();
      if (!last) {
        errors.push(`Unmatched closing ${char} at position ${i}`);
      } else {
        const pairs: Record<string, string> = { '{': '}', '[': ']', '(': ')' };
        if (pairs[last.char] !== char) {
          errors.push(`Mismatched brackets at position ${i}: expected ${pairs[last.char]}, got ${char}`);
        }
      }
    }
  }

  if (brackets.length > 0) {
    errors.push(`${brackets.length} unclosed bracket(s): ${brackets.map((b) => b.char).join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}