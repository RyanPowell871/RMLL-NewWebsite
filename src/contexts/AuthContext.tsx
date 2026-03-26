import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabaseClient } from '../utils/supabase-client';
import { projectId } from '../utils/supabase/info';

const supabase = getSupabaseClient();

export type UserRole = 'admin' | 'editor' | 'viewer' | null;

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
  isEditor: () => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string, accessToken: string): Promise<User | null> => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/user/profile`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch user profile:', response.statusText);
        return null;
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        setUser(null);
        setLoading(false);
        return;
      }

      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user.id, session.access_token);
        setUser(userProfile);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user.id, session.access_token);
        setUser(userProfile);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        return { success: false, error: error.message };
      }

      if (data.session) {
        const userProfile = await fetchUserProfile(data.user.id, data.session.access_token);
        setUser(userProfile);
        return { success: true };
      }

      return { success: false, error: 'No session returned' };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isAdmin = () => user?.role === 'admin';
  const isEditor = () => user?.role === 'admin' || user?.role === 'editor';

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const userProfile = await fetchUserProfile(session.user.id, session.access_token);
      setUser(userProfile);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, isAdmin, isEditor, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}