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
import componentEditorRoutes from "./component_editor_routes_v2.ts";

const app = new Hono();

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

// Mount routes - For Supabase edge functions, we receive the full path including the function name
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

// Component editor - mount at basePath + '/component-editor'
app.route(basePath + '/component-editor', componentEditorRoutes);

// Root health check (outside base path)
app.get("/health", (c) => c.json({ status: "ok" }));

console.log(`Server initialized. Routes mounted at ${basePath}`);

Deno.serve(app.fetch);