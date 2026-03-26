// CMS API Service for News, Announcements, and Documents
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getAccessToken } from '../utils/supabase-client';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f`;

// Type Definitions
export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  featured_image_url: string | null;
  image_position: string | null; // 'top' | 'center' | 'bottom' — controls object-position for cropping
  author: string;
  published_date: string;
  category: string;
  division_id: number | null;
  tags: string[];
  is_published: boolean;
  is_spotlight: boolean;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  start_date: string;
  end_date: string | null;
  division_id: number | null;
  is_active: boolean;
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  category: string;
  subcategory?: string;
  document_year?: number;
  division_id: number | null;
  season_id: number | null;
  upload_date: string;
  is_public: boolean;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string | null;
  featured_image_url: string | null;
  is_published: boolean;
  show_in_nav: boolean;
  nav_order: number;
  template: 'default' | 'full-width' | 'sidebar';
  custom_component?: string; // For pages that use React components instead of HTML
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  // Site Info
  site_name: string;
  site_tagline: string;
  site_description: string;
  logo_url: string | null;
  
  // Contact Info
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  
  // Social Media
  social_facebook: string;
  social_twitter: string;
  social_instagram: string;
  social_youtube: string;
  
  // Footer
  footer_text: string;
  footer_links: Array<{ label: string; url: string }>;
  
  // SEO
  meta_description: string;
  meta_keywords: string[];
  
  // Analytics
  google_analytics_id: string;

  // Other
  updated_at: string;
}

export interface LeagueContacts {
  address_line1: string;
  address_line2: string;
  privacy_officer_title: string;
  privacy_officer_name: string;
  privacy_officer_email: string;
  general_inquiry_email: string;
  contact_form_recipients: string[];
  executive_contacts: Array<{ role: string; name: string; email: string }>;
  division_commissioners: Array<{ division: string; commissioner: string; email: string }>;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface UploadResponse {
  success: boolean;
  url: string;
  filename: string;
}

// Helper function to make API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getAccessToken()}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `API Error: ${response.statusText}`);
  }

  return response.json();
}

// ============================================
// IMAGE UPLOAD API
// ============================================

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/upload-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await getAccessToken()}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Failed to upload image');
  }

  const data = await response.json();
  return data.url;
}

// ============================================
// DOCUMENT UPLOAD API
// ============================================

export interface UploadDocumentOptions {
  file: File;
  title: string;
  description: string;
  category: string;
  subcategory?: string | null;
  document_year?: number | null;
  division_id?: number | null;
  season_id?: number | null;
  is_public?: boolean;
}

export async function uploadDocument(options: UploadDocumentOptions): Promise<Document> {
  const formData = new FormData();
  formData.append('file', options.file);
  formData.append('title', options.title);
  formData.append('description', options.description);
  formData.append('category', options.category);
  formData.append('is_public', String(options.is_public ?? true));
  
  if (options.subcategory) {
    formData.append('subcategory', options.subcategory);
  }
  if (options.document_year) {
    formData.append('document_year', String(options.document_year));
  }
  if (options.division_id) {
    formData.append('division_id', String(options.division_id));
  }
  if (options.season_id) {
    formData.append('season_id', String(options.season_id));
  }

  const response = await fetch(`${BASE_URL}/upload-document`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await getAccessToken()}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Failed to upload document');
  }

  const data = await response.json();
  if (!data.success || !data.data) {
    throw new Error(data.error || 'Failed to upload document');
  }
  
  return data.data;
}

// ============================================
// NEWS ARTICLES API
// ============================================

export interface FetchNewsOptions {
  division?: number;
  category?: string;
  limit?: number;
  published?: boolean;
}

export async function fetchNews(options?: FetchNewsOptions): Promise<NewsArticle[]> {
  const params = new URLSearchParams();
  
  if (options?.division) params.append('division', options.division.toString());
  if (options?.category) params.append('category', options.category);
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.published !== undefined) params.append('published', options.published.toString());
  
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await apiCall<ApiResponse<NewsArticle[]>>(`/news${query}`);
  
  return response.data || [];
}

export async function fetchNewsArticle(slug: string): Promise<NewsArticle | null> {
  try {
    const response = await apiCall<ApiResponse<NewsArticle>>(`/news/${slug}`);
    return response.data || null;
  } catch (error) {
    console.error('Error fetching news article:', error);
    return null;
  }
}

export async function createNewsArticle(article: Partial<NewsArticle>): Promise<NewsArticle> {
  const response = await apiCall<ApiResponse<NewsArticle>>('/news', {
    method: 'POST',
    body: JSON.stringify(article),
  });
  
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create article');
  }
  
  return response.data;
}

export async function updateNewsArticle(slug: string, article: Partial<NewsArticle>): Promise<NewsArticle> {
  const response = await apiCall<ApiResponse<NewsArticle>>(`/news/${slug}`, {
    method: 'PUT',
    body: JSON.stringify(article),
  });
  
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update article');
  }
  
  return response.data;
}

export async function deleteNewsArticle(slug: string): Promise<void> {
  await apiCall<ApiResponse<void>>(`/news/${slug}`, {
    method: 'DELETE',
  });
}

// News categories
export const NEWS_CATEGORIES = [
  'general',
  'game-recap',
  'player-spotlight',
  'team-news',
  'league-update',
  'playoffs',
  'awards',
  'community',
] as const;

// ============================================
// ANNOUNCEMENTS API
// ============================================

export interface FetchAnnouncementsOptions {
  division?: number;
  active?: boolean;
}

export async function fetchAnnouncements(options?: FetchAnnouncementsOptions): Promise<Announcement[]> {
  const params = new URLSearchParams();
  
  if (options?.division) params.append('division', options.division.toString());
  if (options?.active !== undefined) params.append('active', options.active.toString());
  
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await apiCall<ApiResponse<Announcement[]>>(`/announcements${query}`);
  
  return response.data || [];
}

export async function createAnnouncement(announcement: Partial<Announcement>): Promise<Announcement> {
  const response = await apiCall<ApiResponse<Announcement>>('/announcements', {
    method: 'POST',
    body: JSON.stringify(announcement),
  });
  
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create announcement');
  }
  
  return response.data;
}

export async function updateAnnouncement(id: string, announcement: Partial<Announcement>): Promise<Announcement> {
  const response = await apiCall<ApiResponse<Announcement>>(`/announcements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(announcement),
  });
  
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update announcement');
  }
  
  return response.data;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await apiCall<ApiResponse<void>>(`/announcements/${id}`, {
    method: 'DELETE',
  });
}

// ============================================
// DOCUMENTS API
// ============================================

export interface FetchDocumentsOptions {
  category?: string;
  division?: number;
  season?: number;
}

export async function fetchDocuments(options?: FetchDocumentsOptions): Promise<Document[]> {
  const params = new URLSearchParams();
  
  if (options?.category) params.append('category', options.category);
  if (options?.division) params.append('division', options.division.toString());
  if (options?.season) params.append('season', options.season.toString());
  
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await apiCall<ApiResponse<Document[]>>(`/documents${query}`);
  
  return response.data || [];
}

export async function createDocument(document: Partial<Document>): Promise<Document> {
  const response = await apiCall<ApiResponse<Document>>('/documents', {
    method: 'POST',
    body: JSON.stringify(document),
  });
  
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create document');
  }
  
  return response.data;
}

export async function deleteDocument(id: string): Promise<void> {
  await apiCall<ApiResponse<void>>(`/documents/${id}`, {
    method: 'DELETE',
  });
}

export async function updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
  const response = await apiCall<ApiResponse<Document>>(`/documents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update document');
  }

  return response.data;
}

// Import documents from CSV/JSON data
export async function importDocuments(documents: Document[]): Promise<{ success: boolean; message: string; imported?: number; skipped?: number; errors?: string[] }> {
  const url = `${BASE_URL}/documents/import`;

  console.log('[importDocuments] Calling:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAccessToken()}`,
      },
      body: JSON.stringify({ documents }),
    });

    console.log('[importDocuments] Response status:', response.status, response.statusText);

    const text = await response.text();
    console.log('[importDocuments] Response body:', text);

    if (!response.ok) {
      let errorMessage = `API Error (${response.status}): ${response.statusText}`;
      try {
        const json = JSON.parse(text);
        errorMessage = json.error || errorMessage;
      } catch {
        errorMessage = text || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const json = JSON.parse(text);

    if (!json.success) {
      throw new Error(json.error || 'Failed to import documents');
    }

    return json;
  } catch (error) {
    console.error('[importDocuments] Error:', error);
    throw error;
  }
}

// Document categories - must match database enum: document_category
export const DOCUMENT_CATEGORIES = [
  'governance',
  'rules-regulations',
  'officiating',
  'forms',
  'insurance',
  'meetings',
  'financial',
  'schedules',
  'rosters',
  'transactions',
  'statistics',
  'communications',
  'historical',
  'other',
] as const;

// ============================================
// PAGES API
// ============================================

export async function fetchPages(): Promise<Page[]> {
  const response = await apiCall<ApiResponse<Page[]>>('/pages');
  return response.data || [];
}

export async function fetchPage(slug: string): Promise<Page | null> {
  try {
    const response = await apiCall<ApiResponse<Page>>(`/pages/${slug}`);
    return response.data || null;
  } catch (error) {
    console.error('Error fetching page:', error);
    return null;
  }
}

export async function createPage(page: Partial<Page>): Promise<Page> {
  const response = await apiCall<ApiResponse<Page>>('/pages', {
    method: 'POST',
    body: JSON.stringify(page),
  });
  
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create page');
  }
  
  return response.data;
}

export async function updatePage(slug: string, page: Partial<Page>): Promise<Page> {
  const response = await apiCall<ApiResponse<Page>>(`/pages/${slug}`, {
    method: 'PUT',
    body: JSON.stringify(page),
  });
  
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update page');
  }
  
  return response.data;
}

export async function deletePage(slug: string): Promise<void> {
  await apiCall<ApiResponse<void>>(`/pages/${slug}`, {
    method: 'DELETE',
  });
}

// Delete all pages
export async function deleteAllPages(): Promise<void> {
  await apiCall<ApiResponse<void>>('/pages/bulk-delete', {
    method: 'DELETE',
  });
}

// ============================================
// SETTINGS API
// ============================================

export async function fetchSettings(): Promise<SiteSettings> {
  const response = await apiCall<ApiResponse<SiteSettings>>('/settings');
  
  // Return default settings if none exist
  if (!response.data) {
    return {
      site_name: 'Rocky Mountain Lacrosse League',
      site_tagline: 'Alberta\'s Premier Box Lacrosse League',
      site_description: 'The RMLL is a competitive box lacrosse league serving communities across Alberta.',
      logo_url: null,
      contact_email: 'info@rmll.ca',
      contact_phone: '',
      contact_address: '',
      social_facebook: '',
      social_twitter: '',
      social_instagram: '',
      social_youtube: '',
      footer_text: '© 2024 Rocky Mountain Lacrosse League. All rights reserved.',
      footer_links: [],
      meta_description: 'Rocky Mountain Lacrosse League - Alberta\'s Premier Box Lacrosse League',
      meta_keywords: ['lacrosse', 'box lacrosse', 'alberta', 'RMLL'],
      google_analytics_id: '',
      updated_at: new Date().toISOString(),
    };
  }
  
  return response.data;
}

export async function updateSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  const response = await apiCall<ApiResponse<SiteSettings>>('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
  
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update settings');
  }
  
  return response.data;
}

// ============================================
// USERS API
// ============================================

export async function fetchUsers(): Promise<User[]> {
  const response = await apiCall<{ success: boolean; users?: User[]; error?: string }>('/admin/users');
  return response.users || [];
}

export async function fetchUser(id: string): Promise<User | null> {
  try {
    const response = await apiCall<ApiResponse<User>>(`/admin/users/${id}`);
    return response.data || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function createUser(user: Partial<User> & { password?: string }): Promise<User> {
  const response = await apiCall<ApiResponse<User>>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(user),
  });
  
  // Handle response format: server returns { success, user } not { success, data }
  const data = response as any;
  if (!data.success) {
    throw new Error(data.error || 'Failed to create user');
  }
  
  return data.user || data.data;
}

export async function updateUser(id: string, user: Partial<User>): Promise<User> {
  const response = await apiCall<ApiResponse<User>>(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(user),
  });
  
  const data = response as any;
  if (!data.success) {
    throw new Error(data.error || 'Failed to update user');
  }
  
  return data.data || data.user;
}

export async function deleteUser(id: string): Promise<void> {
  await apiCall<ApiResponse<void>>(`/admin/users/${id}`, {
    method: 'DELETE',
  });
}

// ============================================
// LEAGUE CONTACTS API
// ============================================

const LEAGUE_CONTACTS_DEFAULTS: LeagueContacts = {
  address_line1: 'PO Box 47083 Creekside',
  address_line2: 'Calgary, Alberta T3P 0B9',
  privacy_officer_title: 'President of the RMLL',
  privacy_officer_name: '',
  privacy_officer_email: '',
  general_inquiry_email: '',
  contact_form_recipients: [],
  executive_contacts: [
    { role: 'President', name: 'Duane Bratt', email: 'dbratt@mtroyal.ca' },
    { role: 'Executive Director', name: 'Christine Thielen', email: 'christinethielen@hotmail.com' },
    { role: 'Vice President', name: 'Greg Lintz', email: 'greg@purdonlaw.com' },
  ],
  division_commissioners: [],
  updated_at: new Date().toISOString(),
};

export async function fetchLeagueContacts(): Promise<LeagueContacts> {
  try {
    const response = await apiCall<ApiResponse<LeagueContacts>>('/league-contacts');
    if (!response.data) {
      return LEAGUE_CONTACTS_DEFAULTS;
    }
    // Merge with defaults so new fields are always present
    return { ...LEAGUE_CONTACTS_DEFAULTS, ...response.data };
  } catch (error) {
    console.error('Error fetching league contacts:', error);
    return LEAGUE_CONTACTS_DEFAULTS;
  }
}

export async function updateLeagueContacts(contacts: Partial<LeagueContacts>): Promise<LeagueContacts> {
  const response = await apiCall<ApiResponse<LeagueContacts>>('/league-contacts', {
    method: 'PUT',
    body: JSON.stringify(contacts),
  });
  
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update league contacts');
  }
  
  return response.data;
}