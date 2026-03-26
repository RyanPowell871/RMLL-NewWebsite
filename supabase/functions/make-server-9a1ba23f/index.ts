import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

// Import route modules
import authRoutes from "./auth_routes.ts";
import contentRoutes from "./content_routes.ts";
import documentsRoutes from "./documents_routes.ts";
import imagesRoutes from "./images_routes.ts";
import settingsRoutes from "./settings_routes.ts";
import configRoutes from "./config_routes.ts";
import emailRoutes from "./email_routes.ts";
import suspensionsRoutes from "./suspensions_routes.ts";
import linkCheckerRoutes from "./link_checker_routes.ts";
import { COMPONENT_SCHEMAS, getEditableSchemas, getSchemaByPageId } from "./component_schemas.ts";

const app = new Hono();

// Middleware
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowHeaders: ["Content-Type", "Authorization", "x-client-info", "apikey"],
}));

// Error handling
app.onError((err, c) => {
  console.error('Global error handler:', err);
  return c.json({
    success: false,
    error: err.message || 'Internal Server Error'
  }, 500);
});

// Storage initialization
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

async function initializeStorage() {
  try {
    const bucketsToEnsure = ['make-9a1ba23f-images', 'make-9a1ba23f-documents'];
    const { data: buckets } = await supabaseClient.storage.listBuckets();
    const existingBucketNames = buckets?.map(b => b.name) || [];

    for (const bucketName of bucketsToEnsure) {
      if (!existingBucketNames.includes(bucketName)) {
        await supabaseClient.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 52428800,
        });
      }
    }
  } catch (error) {
    console.error('[Storage] Error initializing buckets:', error);
  }
}
initializeStorage();

// ============================================
// MOUNT ROUTES - Using basePath as seen in working routes
// ============================================
const basePath = '/make-server-9a1ba23f';

app.route(basePath, authRoutes);
app.route(basePath, contentRoutes);
app.route(basePath, documentsRoutes);
app.route(basePath, imagesRoutes);
app.route(basePath, settingsRoutes);
app.route(basePath, configRoutes);
app.route(basePath, emailRoutes);
app.route(basePath, suspensionsRoutes);
app.route(basePath, linkCheckerRoutes);

// ============================================
// COMPONENT EDITOR ROUTES
// ============================================
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);
const COMPONENT_CONTENT_TABLE = 'rmll_component_content';

// GET /make-server-9a1ba23f/component-editor - List components
app.get(`${basePath}/component-editor`, (c) => {
  console.log('[Component Editor] GET /component-editor - listing components');
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
    console.error('[Component Editor] Error listing components:', error);
    return c.json(
      { success: false, error: 'Failed to list components' },
      500
    );
  }
});

// GET /make-server-9a1ba23f/component-editor/:pageId - Get component
app.get(`${basePath}/component-editor/:pageId`, async (c) => {
  const pageId = c.req.param('pageId');
  console.log(`[Component Editor] GET /component-editor/${pageId} - fetching component`);

  try {
    const schema = getSchemaByPageId(pageId);
    if (!schema) {
      return c.json(
        { success: false, error: 'Component not found' },
        404
      );
    }

    if (schema.notEditableReason) {
      return c.json({
        success: false,
        error: 'Component is not editable',
        reason: schema.notEditableReason,
      }, 400);
    }

    const extractedData: Record<string, unknown> = {};
    for (const field of schema.editableFields) {
      if (field.type === 'array') {
        extractedData[field.name] = [];
      } else if (field.type === 'simple' && field.defaultValue) {
        extractedData[field.name] = field.defaultValue;
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
        content: '',
        extractedData: extractedData,
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

// POST /make-server-9a1ba23f/component-editor/:pageId - Save component
app.post(`${basePath}/component-editor/:pageId`, async (c) => {
  const pageId = c.req.param('pageId');
  const body = await c.req.json();
  const { data } = body;

  const schema = getSchemaByPageId(pageId);
  if (!schema) {
    return c.json(
      { success: false, error: 'Component not found' },
      404
    );
  }

  const { error: upsertError } = await supabase
    .from(COMPONENT_CONTENT_TABLE)
    .upsert({
      page_id: pageId,
      component_file: schema.componentFile,
      title: schema.title,
      content: `// Content for ${schema.title}`,
      extracted_data: data || {},
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'page_id',
    });

  if (upsertError) {
    return c.json(
      { success: false, error: `Database error: ${upsertError.message}` },
      500
    );
  }

  return c.json({
    success: true,
    message: 'Component saved successfully',
  });
});

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Debug route
app.get("/debug", (c) => {
  return c.json({
    debug: true,
    message: 'Debug route works',
    receivedPath: c.req.path,
  });
});

Deno.serve(app.fetch);