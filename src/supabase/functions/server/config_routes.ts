
import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as db from "./db.tsx";

const app = new Hono();

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// Test endpoint for AI connectivity
app.get("/test-ai", (c) => {
  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const sportzsoftKey = Deno.env.get('SPORTZSOFT_API_KEY');
    
    return c.json({ 
      status: "ok",
      openaiConfigured: !!openaiKey,
      sportzsoftConfigured: !!sportzsoftKey,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Test AI] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get SportzSoft API key (for frontend)
app.get("/config/sportzsoft-key", async (c) => {
  try {
    let apiKey = Deno.env.get('SPORTZSOFT_API_KEY');

    // Try to get from database first
    try {
      const dbKey = await db.getSportzSoftApiKey();
      if (dbKey && dbKey.trim().length > 0) {
        apiKey = dbKey.trim();
        console.log('[config/sportzsoft-key] Found key in database');
      }
    } catch (dbError) {
      console.log('[config/sportzsoft-key] Database lookup failed, using env var:', dbError);
    }

    console.log('[config/sportzsoft-key] API key request received');
    console.log('[config/sportzsoft-key] API key exists:', !!apiKey);

    if (!apiKey) {
      // Try alternative environment variable names
      apiKey = Deno.env.get('SUPABASE_SPORTZSOFT_API_KEY');
      if (apiKey) {
        console.log('[config/sportzsoft-key] Found key using SUPABASE_SPORTZSOFT_API_KEY');
      }
    }

    if (apiKey) {
      apiKey = apiKey.trim();
      console.log('[config/sportzsoft-key] API key length after trim:', apiKey.length);
      if (apiKey.length > 6) {
        console.log('[config/sportzsoft-key] API key preview:', `${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`);
      }
    }

    if (!apiKey || apiKey.length === 0) {
      console.error('[config/sportzsoft-key] ❌ SPORTZSOFT_API_KEY not set');
      return c.json({
        error: 'API key not configured. Please set the SportzSoft API key in the CMS Settings page.'
      }, 500);
    }

    return c.json({ apiKey });
  } catch (error) {
    console.error('[config/sportzsoft-key] Error retrieving API key:', error);
    return c.json({ error: 'Failed to retrieve API key' }, 500);
  }
});

export default app;
