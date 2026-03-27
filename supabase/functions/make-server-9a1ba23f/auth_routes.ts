import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as db from "./db.ts";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Helper function to verify admin access
async function verifyAdmin(authHeader: string | null): Promise<{ authorized: boolean; userId?: string; error?: string }> {
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

  if (!userProfile || userProfile.role !== 'admin') {
    return { authorized: false, error: 'Access denied: Admin role required' };
  }

  return { authorized: true, userId: user.id };
}

// Protected emails - cannot be modified by other admins
const PROTECTED_EMAILS = ['ryan@altereddigital.com'];

// Helper to check if current admin can modify target user
async function canModifyUser(authHeader: string | null, targetUserId: string): Promise<{ allowed: boolean; error?: string }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { allowed: false, error: 'No authorization token provided' };
  }

  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { allowed: false, error: 'Invalid token' };
  }

  // User can always modify themselves
  if (user.id === targetUserId) {
    console.log(`[canModifyUser] Self-modification allowed for user: ${user.id}`);
    return { allowed: true };
  }

  // Check if target user is protected
  const targetProfile = await db.getUserById(targetUserId);
  if (!targetProfile) {
    console.log(`[canModifyUser] User not found: ${targetUserId}`);
    return { allowed: false, error: 'User not found' };
  }

  const targetEmail = targetProfile.email?.toLowerCase();
  console.log(`[canModifyUser] Checking protection - Target email: "${targetEmail}", Protected list: ${JSON.stringify(PROTECTED_EMAILS)}`);

  if (PROTECTED_EMAILS.includes(targetEmail)) {
    console.log(`[canModifyUser] BLOCKED - Protected user: ${targetEmail}`);
    return { allowed: false, error: 'Protected user: cannot be modified by other admins' };
  }

  console.log(`[canModifyUser] Allowed - Not protected`);
  return { allowed: true };
}

// Get current user profile
app.get("/user/profile", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'No authorization token provided' }, 401);
    }

    const token = authHeader.substring(7);

    // Get user from token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return c.json({ success: false, error: 'Invalid token' }, 401);
    }

    // Get user profile from database
    let userProfile = await db.getUserById(user.id);

    // If no profile exists, create a default one
    if (!userProfile) {
      userProfile = await db.createUser({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        role: 'viewer', // Default role
        is_active: true,
      });
      console.log(`[User Profile] Created default profile for user: ${user.id}`);
    }

    // Add last_login_at info from auth
    const profileWithLogin = {
      ...userProfile,
      last_login_at: user.last_sign_in_at,
    };

    return c.json({ success: true, user: profileWithLogin });
  } catch (error) {
    console.error('[User Profile] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get all users (admin only)
app.get("/admin/users", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { authorized, error: authError } = await verifyAdmin(authHeader);

    if (!authorized) {
      return c.json({ success: false, error: authError || 'Unauthorized' }, 403);
    }

    // Get all user profiles from database
    const userProfiles = await db.getAllUsers();

    // Also get all auth users for complete data
    const { data: { users: authUsers }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('[Admin Users] Error fetching auth users:', error);
    }

    // Merge auth data with profiles
    const users = userProfiles.map(profile => {
      const authUser = authUsers?.find(u => u.id === profile.id);
      return {
        ...profile,
        last_sign_in: authUser?.last_sign_in_at,
        created_at: profile.created_at || authUser?.created_at,
      };
    });

    return c.json({ success: true, users });
  } catch (error) {
    console.error('[Admin Users] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Create new user (admin only)
app.post("/admin/users", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { authorized, error: authError } = await verifyAdmin(authHeader);

    if (!authorized) {
      return c.json({ success: false, error: authError || 'Unauthorized' }, 403);
    }

    const body = await c.req.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name || !role) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return c.json({ success: false, error: 'Invalid role' }, 400);
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.error('[Create User] Auth error:', error);
      return c.json({ success: false, error: error.message }, 400);
    }

    if (!data.user) {
      return c.json({ success: false, error: 'Failed to create user' }, 500);
    }

    // Create user profile in database
    const userProfile = await db.createUser({
      id: data.user.id,
      email: data.user.email || '',
      name,
      role,
      is_active: true,
    });

    console.log(`[Create User] Created user: ${email} with role: ${role}`);

    return c.json({ success: true, user: userProfile }, 201);
  } catch (error) {
    console.error('[Create User] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update user role (admin only)
app.patch("/admin/users/:userId/role", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { authorized, error: authError } = await verifyAdmin(authHeader);

    if (!authorized) {
      return c.json({ success: false, error: authError || 'Unauthorized' }, 403);
    }

    const userId = c.req.param('userId');
    const body = await c.req.json();
    const { role } = body;

    if (!role || !['admin', 'editor', 'viewer'].includes(role)) {
      return c.json({ success: false, error: 'Invalid role' }, 400);
    }

    // Check if current admin can modify this user
    const { allowed, error: modifyError } = await canModifyUser(authHeader, userId);
    if (!allowed) {
      return c.json({ success: false, error: modifyError }, 403);
    }

    // Get existing user profile to check if exists
    const existingProfile = await db.getUserById(userId);

    if (!existingProfile) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Update role
    const userProfile = await db.updateUser(userId, { role });

    console.log(`[Update User Role] Updated user ${userId} to role: ${role}`);

    return c.json({ success: true, user: userProfile });
  } catch (error) {
    console.error('[Update User Role] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update user (admin only) - full update
app.put("/admin/users/:userId", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { authorized, error: authError } = await verifyAdmin(authHeader);

    if (!authorized) {
      return c.json({ success: false, error: authError || 'Unauthorized' }, 403);
    }

    const userId = c.req.param('userId');
    const body = await c.req.json();

    // Get existing user profile to check if exists
    const existingProfile = await db.getUserById(userId);

    if (!existingProfile) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Check if current admin can modify this user
    const { allowed, error: modifyError } = await canModifyUser(authHeader, userId);
    if (!allowed) {
      return c.json({ success: false, error: modifyError }, 403);
    }

    // Build updates object
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.role && ['admin', 'editor', 'viewer'].includes(body.role)) {
      updates.role = body.role;
    }
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    // Update in database
    const userProfile = await db.updateUser(userId, updates);

    // If email changed, also update in Supabase Auth
    if (body.email && body.email !== existingProfile.email) {
      try {
        await supabase.auth.admin.updateUserById(userId, { email: body.email });
        // Update email in profile too
        await db.updateUser(userId, { email: body.email });
      } catch (e) {
        console.error('[Update User] Failed to update email in auth:', e);
      }
    }

    // If name changed, update user_metadata
    if (body.name) {
      try {
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: { name: body.name }
        });
      } catch (e) {
        console.error('[Update User] Failed to update name in auth:', e);
      }
    }

    console.log(`[Update User] Updated user ${userId}`);

    return c.json({ success: true, data: userProfile });
  } catch (error) {
    console.error('[Update User] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Reset user password (admin only)
app.post("/admin/users/:userId/reset-password", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { authorized, error: authError } = await verifyAdmin(authHeader);

    if (!authorized) {
      return c.json({ success: false, error: authError || 'Unauthorized' }, 403);
    }

    const userId = c.req.param('userId');
    const body = await c.req.json();
    const { password } = body;

    if (!password || password.length < 6) {
      return c.json({ success: false, error: 'Password must be at least 6 characters' }, 400);
    }

    // Get existing user profile to check if exists
    const existingProfile = await db.getUserById(userId);

    if (!existingProfile) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Check if current admin can modify this user
    const { allowed, error: modifyError } = await canModifyUser(authHeader, userId);
    if (!allowed) {
      return c.json({ success: false, error: modifyError }, 403);
    }

    // Update password in Supabase Auth
    const { data, error } = await supabase.auth.admin.updateUserById(userId, { password });

    if (error) {
      console.error('[Reset Password] Auth error:', error);
      return c.json({ success: false, error: error.message }, 400);
    }

    console.log(`[Reset Password] Reset password for user: ${existingProfile.email}`);

    return c.json({ success: true, message: 'Password reset successfully', user: existingProfile });
  } catch (error) {
    console.error('[Reset Password] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete user (admin only)
app.delete("/admin/users/:userId", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { authorized, userId: adminId, error: authError } = await verifyAdmin(authHeader);

    if (!authorized) {
      return c.json({ success: false, error: authError || 'Unauthorized' }, 403);
    }

    const userId = c.req.param('userId');

    // Prevent admin from deleting themselves
    if (userId === adminId) {
      return c.json({ success: false, error: 'Cannot delete your own account' }, 400);
    }

    // Check if current admin can modify this user
    const { allowed, error: modifyError } = await canModifyUser(authHeader, userId);
    if (!allowed) {
      return c.json({ success: false, error: modifyError }, 403);
    }

    // Delete from database (will cascade to app_users table)
    await db.deleteUser(userId);

    // Delete from Supabase Auth
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error('[Delete User] Auth error:', error);
      // Continue even if auth deletion fails
    }

    console.log(`[Delete User] Deleted user: ${userId}`);

    return c.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('[Delete User] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;