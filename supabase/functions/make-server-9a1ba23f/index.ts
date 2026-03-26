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
import componentEditorRoutes from "./component_editor_routes_v2.ts";

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
app.route(basePath, componentEditorRoutes);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

Deno.serve(app.fetch);