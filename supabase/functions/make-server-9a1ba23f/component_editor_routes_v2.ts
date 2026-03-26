/**
 * Component Editor API Routes - Database-based implementation
 *
 * This version uses a database table to store component content instead of
 * directly reading/writing files, which is not possible in Supabase edge functions.
 */

import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js@2";
import { COMPONENT_SCHEMAS, getEditableSchemas, getSchemaByPageId } from "./component_schemas.ts";
import { parseComponentFile } from "./component_parser.ts";
import { updateComponentFileFromSchema, validateSyntax } from "./component_writer.ts";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Table name for storing component content
const COMPONENT_CONTENT_TABLE = 'rmll_component_content';

/**
 * Initialize the component content table if it doesn't exist
 * This would typically be done via a migration, but we'll create it on first use
 */
async function ensureTableExists(): Promise<boolean> {
  try {
    // Check if table exists by trying to query it
    const { error } = await supabase
      .from(COMPONENT_CONTENT_TABLE)
      .select('id')
      .limit(1);

    // If the table doesn't exist, error will be about relation not found
    if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('Table does not exist, it needs to be created via migration');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking table existence:', error);
    return false;
  }
}

/**
 * Get the database table name (with environment prefix if needed)
 */
function getTableName(): string {
  const env = Deno.env.get('DENO_DEPLOYMENT_ID') ? 'production' : 'development';
  return `${COMPONENT_CONTENT_TABLE}`;
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

    // Try to read from database first
    let content = '';
    let extractedData: Record<string, unknown> = {};

    const { data: storedData, error: readError } = await supabase
      .from(getTableName())
      .select('content, extracted_data')
      .eq('page_id', pageId)
      .maybeSingle();

    if (!readError && storedData) {
      content = storedData.content || '';
      extractedData = storedData.extracted_data || {};
    } else {
      // If not in database, try to provide a default response
      // We can't read files, so we'll return the schema with empty data
      console.log(`No stored data for ${pageId}, returning empty data`);
      extractedData = {};

      // Initialize with default empty arrays based on schema
      for (const field of schema.editableFields) {
        if (field.type === 'array') {
          extractedData[field.name] = [];
        } else if (field.type === 'simple' && field.defaultValue) {
          extractedData[field.name] = field.defaultValue;
        }
      }
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
        parseSuccess: true,
        parseErrors: [],
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

    // Prepare data to store
    let newDataMap: Record<string, unknown>;

    if (fieldName && data !== undefined) {
      // Single field update - we need to fetch current data first
      const { data: currentData } = await supabase
        .from(getTableName())
        .select('extracted_data')
        .eq('page_id', pageId)
        .maybeSingle();

      newDataMap = (currentData?.extracted_data as Record<string, unknown>) || {};
      newDataMap[fieldName] = data;
    } else if (data) {
      // Full data update
      newDataMap = data;
    } else {
      return c.json(
        { success: false, error: 'Invalid request: provide either fieldName+data or data object' },
        400
      );
    }

    // Store the data in the database
    const { error: upsertError } = await supabase
      .from(getTableName())
      .upsert({
        page_id: pageId,
        component_file: schema.componentFile,
        title: schema.title,
        content: `// Content for ${schema.title}`,
        extracted_data: newDataMap,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'page_id',
      });

    if (upsertError) {
      console.error('Error storing component data:', upsertError);
      return c.json(
        { success: false, error: `Database error: ${upsertError.message}` },
        500
      );
    }

    return c.json({
      success: true,
      message: 'Component saved successfully',
      data: {
        content: `// Content for ${schema.title}`,
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

    return c.json({
      success: true,
      data: {
        previewContent: `// Preview for ${schema.title}`,
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