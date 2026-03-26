// Singleton Supabase client instance
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;

// Create a single instance to avoid multiple client warnings
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, publicAnonKey);
  }
  return supabaseInstance;
}

// Helper to get current access token
export async function getAccessToken(): Promise<string> {
  try {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || publicAnonKey;
  } catch (error) {
    console.error('Error getting access token:', error);
    return publicAnonKey;
  }
}
