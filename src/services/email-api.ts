// Email API Service
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getAccessToken } from '../utils/supabase-client';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f`;

// Type Definitions
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface NewsletterSubscription {
  email: string;
  name?: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name: string | null;
  subscribed_at: string;
  is_active: boolean;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  submitted_at: string;
  email_id: string;
}

export interface EmailCampaign {
  subject: string;
  htmlContent: string;
  textContent?: string;
  recipients?: string[];
  sendToNewsletter?: boolean;
}

export interface CampaignResult {
  sent: number;
  failed: number;
  errors: string[];
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ============================================
// PUBLIC EMAIL FUNCTIONS
// ============================================

// Send contact form
export async function sendContactForm(data: ContactFormData): Promise<void> {
  const response = await fetch(`${BASE_URL}/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Failed to send message');
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to send message');
  }
}

// Subscribe to newsletter
export async function subscribeToNewsletter(data: NewsletterSubscription): Promise<void> {
  const response = await fetch(`${BASE_URL}/newsletter/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Failed to subscribe');
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to subscribe');
  }
}

// Unsubscribe from newsletter
export async function unsubscribeFromNewsletter(email: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/newsletter/unsubscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Failed to unsubscribe');
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to unsubscribe');
  }
}

// ============================================
// ADMIN EMAIL FUNCTIONS
// ============================================

// Get all newsletter subscribers (admin only)
export async function fetchNewsletterSubscribers(): Promise<{ subscribers: NewsletterSubscriber[]; total: number }> {
  const response = await fetch(`${BASE_URL}/admin/newsletter/subscribers`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getAccessToken()}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Failed to fetch subscribers');
  }

  const result = await response.json();
  return { subscribers: result.subscribers || [], total: result.total || 0 };
}

// Send email campaign (admin only)
export async function sendEmailCampaign(campaign: EmailCampaign): Promise<{ message: string; results: CampaignResult }> {
  const response = await fetch(`${BASE_URL}/admin/email/campaign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getAccessToken()}`,
    },
    body: JSON.stringify(campaign),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Failed to send campaign');
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to send campaign');
  }

  return { message: result.message, results: result.results };
}

// Get contact form submissions (admin only)
export async function fetchContactSubmissions(): Promise<ContactSubmission[]> {
  const response = await fetch(`${BASE_URL}/admin/contact/submissions`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getAccessToken()}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Failed to fetch submissions');
  }

  const result = await response.json();
  return result.submissions || [];
}