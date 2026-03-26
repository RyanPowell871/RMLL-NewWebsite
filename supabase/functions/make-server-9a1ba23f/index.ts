import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

// Import route modules (from same directory now)
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

// Debug middleware - log ALL incoming requests
app.use("*", async (c, next) => {
  console.log(`[REQUEST] ${c.req.method} ${c.req.path}`);
  await next();
});

// Middleware
app.use("*", logger());
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowHeaders: ["Content-Type", "Authorization", "x-client-info", "apikey"],
  exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
  maxAge: 600,
  credentials: true,
}));

// Error handling
app.onError((err, c) => {
  console.error('Global error handler:', err);
  return c.json({ 
    success: false, 
    error: err.message || 'Internal Server Error' 
  }, 500);
});

// Initialize Storage Buckets (Idempotent)
// We do this on server startup (or first request)
async function initializeStorage() {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const bucketsToEnsure = [
      'make-9a1ba23f-images', 
      'make-9a1ba23f-documents'
    ];

    const { data: buckets } = await supabase.storage.listBuckets();
    const existingBucketNames = buckets?.map(b => b.name) || [];

    for (const bucketName of bucketsToEnsure) {
      if (!existingBucketNames.includes(bucketName)) {
        console.log(`[Storage] Creating bucket: ${bucketName}`);
        await supabase.storage.createBucket(bucketName, {
          public: true, // Make public for easy access
          fileSizeLimit: 52428800, // 50MB
        });
      }
    }
  } catch (error) {
    console.error('[Storage] Error initializing buckets:', error);
  }
}

// Initialize storage in background
initializeStorage();

// Mount routes
const basePath = '/make-server-9a1ba23f';

// TEST ROUTE - Simple response to test if routes work
app.get('/test-route', (c) => {
  console.log('[TEST] Route hit!');
  return c.json({
    success: true,
    message: 'Test route works!',
    path: c.req.path
  });
});

app.get(`${basePath}/test-route`, (c) => {
  console.log('[TEST] basePath route hit!');
  return c.json({
    success: true,
    message: 'BasePath test route works!',
    path: c.req.path,
    basePath: basePath
  });
});

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

// Try multiple mount points for component-editor
app.get('/component-editor', (c) => {
  console.log('[Component Editor] GET /component-editor (root)');
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

app.get(`${basePath}/component-editor`, (c) => {
  console.log(`[Component Editor] GET ${basePath}/component-editor (basePath)`);
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

app.get('/component-editor/:pageId', async (c) => {
  const pageId = c.req.param('pageId');
  console.log(`[Component Editor] GET /component-editor/${pageId} (root)`);

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

app.get(`${basePath}/component-editor/:pageId`, async (c) => {
  const pageId = c.req.param('pageId');
  console.log(`[Component Editor] GET ${basePath}/component-editor/${pageId} (basePath)`);

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

app.post('/component-editor/:pageId', async (c) => {
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

// ============================================
// DEBUG: Catch-all route to see what paths are being received
// ============================================
app.all('/*', (c) => {
  console.log('[DEBUG] Unmatched request:', {
    method: c.req.method,
    path: c.req.path,
    url: c.req.url,
    urlObj: c.req.urlObj,
  });
  return c.json({
    debug: true,
    method: c.req.method,
    path: c.req.path,
    url: c.req.url,
    message: 'Path not found in routes. Check Supabase edge function logs for details.',
  }, 404);
});

// ============================================
// COMPONENT EDITOR ROUTES
// ============================================
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);
const COMPONENT_CONTENT_TABLE = 'rmll_component_content';

// GET /component-editor - List components
app.get('/component-editor', (c) => {
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

// GET /component-editor/:pageId - Get component
app.get('/component-editor/:pageId', async (c) => {
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

// POST /component-editor/:pageId - Save component
app.post('/component-editor/:pageId', async (c) => {
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

// Root health check (outside base path)
app.get("/health", (c) => c.json({ status: "ok" }));

console.log(`Server initialized. Routes mounted at ${basePath}`);

Deno.serve(app.fetch);