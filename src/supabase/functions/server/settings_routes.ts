import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as db from "./db.tsx";

const app = new Hono();

// Initialize Supabase client for auth verification
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Helper: verify admin/editor user from Authorization header
async function verifyAuthUser(authHeader: string | null): Promise<{ authorized: boolean; userId?: string; role?: string; error?: string }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false, error: 'No authorization token provided' };
  }

  const token = authHeader.substring(7);

  // Get user from token
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { authorized: false, error: 'Invalid token' };
  }

  // Get user role from database
  const userProfile = await db.getUserById(user.id);

  if (!userProfile) {
    return { authorized: false, error: 'User profile not found' };
  }

  if (!['admin', 'editor'].includes(userProfile.role)) {
    return { authorized: false, error: 'Access denied: Admin or Editor role required' };
  }

  return { authorized: true, userId: user.id, role: userProfile.role };
}

// ============================================
// SETTINGS ROUTES
// ============================================

// Get site settings (public)
app.get("/settings", async (c) => {
  try {
    const settings = await db.getSiteSettings();
    return c.json({ success: true, data: settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update site settings (admin only)
app.put("/settings", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { authorized, error: authError } = await verifyAuthUser(authHeader);

    if (!authorized) {
      return c.json({ success: false, error: authError || 'Unauthorized' }, 403);
    }

    const body = await c.req.json();
    const updated = await db.updateSiteSettings(body);

    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating settings:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update SportzSoft API key (admin only)
app.put("/settings/sportzsoft-key", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { authorized, error: authError } = await verifyAuthUser(authHeader);

    if (!authorized) {
      return c.json({ success: false, error: authError || 'Unauthorized' }, 403);
    }

    const body = await c.req.json();
    const { apiKey } = body;

    if (!apiKey) {
      return c.json({ success: false, error: 'API key is required' }, 400);
    }

    const updated = await db.updateSportzSoftApiKey(apiKey);

    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating SportzSoft API key:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// LEAGUE CONTACTS ROUTES
// ============================================

// Get league contacts (public)
app.get("/league-contacts", async (c) => {
  try {
    const contacts = await db.getLeagueContacts();
    return c.json({ success: true, data: contacts });
  } catch (error) {
    console.error("Error fetching league contacts:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update league contacts (admin only)
app.put("/league-contacts", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { authorized, error: authError } = await verifyAuthUser(authHeader);

    if (!authorized) {
      return c.json({ success: false, error: authError || 'Unauthorized' }, 403);
    }

    const body = await c.req.json();
    const updated = await db.updateLeagueContacts(body);

    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating league contacts:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;