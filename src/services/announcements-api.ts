// Announcements API Service
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getAccessToken } from '../utils/supabase-client';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f`;

// Type Definitions
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'announcement';
  priority: number;
  display_frequency: 'once' | 'daily' | 'session' | 'always';
  target_pages: string[];
  start_date: string | null;
  end_date: string | null;
  button_text: string | null;
  button_link: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string;
  updated_at: string;
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  type?: 'info' | 'warning' | 'success' | 'announcement';
  priority?: number;
  display_frequency?: 'once' | 'daily' | 'session' | 'always';
  target_pages?: string[];
  start_date?: string | null;
  end_date?: string | null;
  button_text?: string | null;
  button_link?: string | null;
  image_url?: string | null;
  is_active?: boolean;
}

// ============================================
// PUBLIC ANNOUNCEMENTS FUNCTIONS
// ============================================

// Get active announcements (public)
export async function fetchActiveAnnouncements(): Promise<Announcement[]> {
  const response = await fetch(`${BASE_URL}/announcements`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Failed to fetch announcements');
  }

  const result = await response.json();
  return result.data || result.announcements || [];
}

// ============================================
// ADMIN ANNOUNCEMENTS FUNCTIONS
// ============================================

// Get all announcements (admin only)
export async function fetchAllAnnouncements(): Promise<Announcement[]> {
  const response = await fetch(`${BASE_URL}/announcements`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getAccessToken()}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Failed to fetch announcements');
  }

  const result = await response.json();
  return result.data || result.announcements || [];
}

// Create announcement (admin only)
export async function createAnnouncement(data: CreateAnnouncementData): Promise<Announcement> {
  const response = await fetch(`${BASE_URL}/announcements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getAccessToken()}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Failed to create announcement');
  }

  const result = await response.json();
  return result.data || result.announcement;
}

// Update announcement (admin only)
export async function updateAnnouncement(id: string, data: Partial<CreateAnnouncementData>): Promise<Announcement> {
  const response = await fetch(`${BASE_URL}/announcements/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getAccessToken()}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Failed to update announcement');
  }

  const result = await response.json();
  return result.data || result.announcement;
}

// Delete announcement (admin only)
export async function deleteAnnouncement(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/announcements/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getAccessToken()}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Failed to delete announcement');
  }
}