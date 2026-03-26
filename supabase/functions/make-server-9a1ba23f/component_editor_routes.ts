/**
 * Component Editor API Routes
 *
 * Provides API endpoints for reading and writing React component files.
 * This allows the CMS to directly edit component source code.
 */

import { Hono } from "npm:hono";
import { COMPONENT_SCHEMAS, getEditableSchemas, getSchemaByPageId } from "./component_schemas.ts";
import { parseComponentFile } from "./component_parser.ts";
import { updateComponentFileFromSchema, validateSyntax } from "./component_writer.ts";

const app = new Hono();

// Helper: Read a component file
async function readComponentFile(componentFile: string): Promise<{ content: string; exists: boolean }> {
  try {
    const filePath = `src/components/league-info/${componentFile}`;
    const content = await Deno.readTextFile(filePath);
    return { content, exists: true };
  } catch (error) {
    console.error(`Error reading file ${componentFile}:`, error);
    return { content: '', exists: false };
  }
}

// Helper: Write a component file
async function writeComponentFile(componentFile: string, content: string): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = `src/components/league-info/${componentFile}`;

    // Validate syntax before writing
    const validation = validateSyntax(content);
    if (!validation.valid) {
      return { success: false, error: `Syntax validation failed: ${validation.errors.join(', ')}` };
    }

    await Deno.writeTextFile(filePath, content);
    return { success: true };
  } catch (error) {
    console.error(`Error writing file ${componentFile}:`, error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================
// GET /component-editor
// List all editable components
// ============================================
app.get('/', (c) => {
  try {
    const components = getEditableSchemas().map((schema) => ({
      pageId: schema.pageId,
      title: schema.title,
      description: schema.description,
      componentFile: schema.componentFile,
      fieldCount: schema.editableFields.length,
    }));

    return c.json({
      success: true,
      data: components,
    });
  } catch (error) {
    console.error('Error listing components:', error);
    return c.json(
      { success: false, error: 'Failed to list components' },
      500
    );
  }
});

// ============================================
// GET /component-editor/:pageId
// Get component data for editing
// ============================================
app.get('/:pageId', async (c) => {
  try {
    const { pageId } = c.req.param();

    const schema = getSchemaByPageId(pageId);
    if (!schema) {
      return c.json(
        { success: false, error: 'Component not found' },
        404
      );
    }

    // Check if component is editable
    if (schema.notEditableReason) {
      return c.json({
        success: false,
        error: 'Component is not editable',
        reason: schema.notEditableReason,
      }, 400);
    }

    // Read the component file
    const { content, exists } = await readComponentFile(schema.componentFile);

    if (!exists) {
      return c.json(
        { success: false, error: `Component file not found: ${schema.componentFile}` },
        404
      );
    }

    // Parse the component file
    const parsed = parseComponentFile(content, schema);

    // Extract data from parsed result
    const extractedData: Record<string, unknown> = {};
    for (const [key, value] of parsed.extractedData.entries()) {
      extractedData[key] = value;
    }

    return c.json({
      success: true,
      data: {
        schema: {
          pageId: schema.pageId,
          componentFile: schema.componentFile,
          title: schema.title,
          description: schema.description,
          editableFields: schema.editableFields,
        },
        content: content,
        extractedData: extractedData,
        parseSuccess: parsed.success,
        parseErrors: parsed.errors,
      },
    });
  } catch (error) {
    console.error('Error getting component:', error);
    return c.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get component' },
      500
    );
  }
});

// ============================================
// POST /component-editor/:pageId
// Update component data
// ============================================
app.post('/:pageId', async (c) => {
  try {
    const { pageId } = c.req.param();
    const body = await c.req.json();
    const { fieldName, data } = body;

    const schema = getSchemaByPageId(pageId);
    if (!schema) {
      return c.json(
        { success: false, error: 'Component not found' },
        404
      );
    }

    // Check if component is editable
    if (schema.notEditableReason) {
      return c.json({
        success: false,
        error: 'Component is not editable',
        reason: schema.notEditableReason,
      }, 400);
    }

    // Read the current file content
    const { content, exists } = await readComponentFile(schema.componentFile);

    if (!exists) {
      return c.json(
        { success: false, error: `Component file not found: ${schema.componentFile}` },
        404
      );
    }

    // Prepare data to update
    let newDataMap: Map<string, unknown>;

    if (fieldName && data !== undefined) {
      // Single field update
      const currentParsed = parseComponentFile(content, schema);
      newDataMap = currentParsed.extractedData;
      newDataMap.set(fieldName, data);
    } else if (data) {
      // Full data update (data should be an object with field names as keys)
      newDataMap = new Map(Object.entries(data));
    } else {
      return c.json(
        { success: false, error: 'Invalid request: provide either fieldName+data or data object' },
        400
      );
    }

    // Update the file content
    const updateResult = updateComponentFileFromSchema(content, schema, newDataMap);

    if (!updateResult.success) {
      return c.json(
        { success: false, error: updateResult.error },
        500
      );
    }

    // Write the updated content
    const writeResult = await writeComponentFile(schema.componentFile, updateResult.newContent!);

    if (!writeResult.success) {
      return c.json(
        { success: false, error: writeResult.error },
        500
      );
    }

    return c.json({
      success: true,
      message: 'Component updated successfully',
      data: {
        content: updateResult.newContent,
      },
    });
  } catch (error) {
    console.error('Error updating component:', error);
    return c.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update component' },
      500
    );
  }
});

// ============================================
// POST /component-editor/:pageId/preview
// Preview component changes (diff)
// ============================================
app.post('/:pageId/preview', async (c) => {
  try {
    const { pageId } = c.req.param();
    const body = await c.req.json();
    const { data } = body;

    const schema = getSchemaByPageId(pageId);
    if (!schema) {
      return c.json(
        { success: false, error: 'Component not found' },
        404
      );
    }

    // Read the current file content
    const { content, exists } = await readComponentFile(schema.componentFile);

    if (!exists) {
      return c.json(
        { success: false, error: `Component file not found: ${schema.componentFile}` },
        404
      );
    }

    // Prepare new data
    const newDataMap = new Map(Object.entries(data || {}));

    // Generate preview (update content without writing)
    const updateResult = updateComponentFileFromSchema(content, schema, newDataMap);

    if (!updateResult.success) {
      return c.json(
        { success: false, error: updateResult.error },
        500
      );
    }

    return c.json({
      success: true,
      data: {
        previewContent: updateResult.newContent,
        isValid: true,
      },
    });
  } catch (error) {
    console.error('Error previewing component:', error);
    return c.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to preview component' },
      500
    );
  }
});

export default app;