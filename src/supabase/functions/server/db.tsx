// Database helper for RMLL website
// Direct database queries instead of kv_store
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// ============================================================================
// NEWS ARTICLES
// ============================================================================

export async function getNewsArticles(options?: { published?: boolean; category?: string; division?: number; limit?: number }) {
  const sb = supabase();

  let query = sb.from('news_articles').select('*');

  if (options?.published !== undefined) {
    query = query.eq('is_published', options.published);
  }
  if (options?.category) {
    query = query.eq('category', options.category);
  }
  if (options?.division) {
    query = query.eq('division_id', options.division);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  // Order by published date descending
  query = query.order('published_date', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getNewsArticleBySlug(slug: string) {
  const sb = supabase();
  const { data, error } = await sb
    .from('news_articles')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createNewsArticle(article: any) {
  const sb = supabase();
  const { data, error } = await sb
    .from('news_articles')
    .insert(article)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateNewsArticle(id: string, updates: any) {
  const sb = supabase();
  const { data, error } = await sb
    .from('news_articles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteNewsArticle(id: string) {
  const sb = supabase();
  const { error } = await sb.from('news_articles').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================================
// ANNOUNCEMENTS
// ============================================================================

export async function getAnnouncements(options?: { active?: boolean; division?: number }) {
  const sb = supabase();
  let query = sb.from('announcements').select('*');

  if (options?.active !== undefined) {
    query = query.eq('is_active', options.active);
  }
  if (options?.division) {
    query = query.eq('division_id', options.division);
  }

  // Order by priority descending
  query = query.order('priority', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createAnnouncement(announcement: any) {
  const sb = supabase();
  const { data, error } = await sb
    .from('announcements')
    .insert(announcement)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAnnouncement(id: string, updates: any) {
  const sb = supabase();
  const { data, error } = await sb
    .from('announcements')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAnnouncement(id: string) {
  const sb = supabase();
  const { error } = await sb.from('announcements').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================================
// PAGES
// ============================================================================

export async function getPages() {
  const sb = supabase();
  const { data, error } = await sb
    .from('pages')
    .select('*')
    .order('nav_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPageBySlug(slug: string) {
  const sb = supabase();
  const { data, error } = await sb
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createPage(page: any) {
  const sb = supabase();
  const { data, error } = await sb
    .from('pages')
    .insert(page)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePage(slug: string, updates: any) {
  const sb = supabase();
  const { data, error } = await sb
    .from('pages')
    .update(updates)
    .eq('slug', slug)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePage(slug: string) {
  const sb = supabase();
  const { error } = await sb.from('pages').delete().eq('slug', slug);
  if (error) throw error;
}

export async function deleteAllPages() {
  const sb = supabase();
  const { error } = await sb.from('pages').delete().neq('id', '');
  if (error) throw error;
}

// ============================================================================
// PAGE BLOCKS
// ============================================================================

export async function getPageBlocks(pageSlug: string) {
  const sb = supabase();
  const { data, error } = await sb
    .from('page_blocks')
    .select('*')
    .eq('page_slug', pageSlug)
    .eq('is_visible', true)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return data;
}

export async function setPageBlocks(pageSlug: string, blocks: any[]) {
  const sb = supabase();

  // Delete existing blocks
  await sb.from('page_blocks').delete().eq('page_slug', pageSlug);

  // Insert new blocks
  if (blocks.length > 0) {
    const { error } = await sb.from('page_blocks').insert(blocks);
    if (error) throw error;
  }
}

export async function updatePageBlock(id: string, updates: any) {
  const sb = supabase();
  const { data, error } = await sb
    .from('page_blocks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================================
// DOCUMENTS
// ============================================================================

export async function getDocuments(options?: { category?: string; division?: number; season?: number; publicOnly?: boolean }) {
  const sb = supabase();
  let query = sb.from('documents').select('*');

  if (options?.category) {
    query = query.eq('category', options.category);
  }
  if (options?.division) {
    query = query.eq('division_id', options.division);
  }
  if (options?.season) {
    query = query.eq('season_id', options.season);
  }
  if (options?.publicOnly) {
    query = query.eq('is_public', true);
  }

  // Order by year desc, then upload date desc
  query = query.order('document_year', { ascending: false, nullsFirst: false });
  query = query.order('upload_date', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getDocumentById(id: string) {
  const sb = supabase();
  const { data, error } = await sb
    .from('documents')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createDocument(document: any) {
  const sb = supabase();
  const { data, error } = await sb
    .from('documents')
    .insert(document)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDocument(id: string, updates: any) {
  const sb = supabase();
  const { data, error } = await sb
    .from('documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDocument(id: string) {
  const sb = supabase();
  const { error } = await sb.from('documents').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteAllDocuments() {
  const sb = supabase();
  const { error } = await sb.from('documents').delete().neq('id', '');
  if (error) throw error;
}

// ============================================================================
// IMAGES
// ============================================================================

export async function getImages(category?: string) {
  const sb = supabase();
  let query = sb.from('images').select('*');

  if (category) {
    query = query.eq('category', category);
  }

  query = query.order('uploaded_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getImageById(id: string) {
  const sb = supabase();
  const { data, error } = await sb
    .from('images')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createImage(image: any) {
  const sb = supabase();
  const { data, error } = await sb
    .from('images')
    .insert(image)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateImage(id: string, updates: any) {
  const sb = supabase();
  const { data, error } = await sb
    .from('images')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteImage(id: string) {
  const sb = supabase();
  const { error } = await sb.from('images').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteAllImages() {
  const sb = supabase();
  const { error } = await sb.from('images').delete().neq('id', '');
  if (error) throw error;
}

// ============================================================================
// USERS
// ============================================================================

export async function getAllUsers() {
  const sb = supabase();
  const { data, error } = await sb
    .from('app_users')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getUserById(id: string) {
  const sb = supabase();
  const { data, error } = await sb
    .from('app_users')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getUserByAuthId(authId: string) {
  const sb = supabase();
  const { data, error } = await sb
    .from('app_users')
    .select('*')
    .eq('id', authId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createUser(user: any) {
  const sb = supabase();
  const { data, error } = await sb
    .from('app_users')
    .insert(user)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateUser(id: string, updates: any) {
  const sb = supabase();
  const { data, error } = await sb
    .from('app_users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteUser(id: string) {
  const sb = supabase();
  const { error } = await sb.from('app_users').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================================
// SITE SETTINGS
// ============================================================================

export async function getSiteSettings() {
  const sb = supabase();
  const { data, error } = await sb
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error || !data) {
    // Return defaults
    return {
      site_name: 'Rocky Mountain Lacrosse League',
      site_tagline: "Alberta's Premier Box Lacrosse League",
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
    };
  }

  return data;
}

export async function updateSiteSettings(settings: any) {
  const sb = supabase();
  const { data, error } = await sb
    .from('site_settings')
    .update({ ...settings, id: 1 })
    .eq('id', 1)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSportzSoftApiKey(apiKey: string) {
  const sb = supabase();
  const { data, error } = await sb
    .from('site_settings')
    .update({ sportzsoft_api_key: apiKey.trim(), id: 1 })
    .eq('id', 1)
    .select()
    .single();
  if (error) {
    // If column doesn't exist, try to insert with the new column
    if (error.message && error.message.includes('column')) {
      const { data: insertData, error: insertError } = await sb
        .from('site_settings')
        .upsert({ id: 1, sportzsoft_api_key: apiKey.trim() }, { onConflict: 'id' })
        .select()
        .single();
      if (insertError) throw insertError;
      return insertData;
    }
    throw error;
  }
  return data;
}

export async function getSportzSoftApiKey(): Promise<string | null> {
  const sb = supabase();
  const { data, error } = await sb
    .from('site_settings')
    .select('sportzsoft_api_key')
    .eq('id', 1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.sportzsoft_api_key || null;
}

// ============================================================================
// LEAGUE CONTACTS
// ============================================================================

export async function getLeagueContacts() {
  const sb = supabase();
  const { data, error } = await sb
    .from('league_contacts')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error || !data) {
    return {
      address_line1: 'PO Box 47083 Creekside',
      address_line2: 'Calgary, Alberta T3P 0B9',
      privacy_officer_title: 'President of the RMLL',
      privacy_officer_name: '',
      privacy_officer_email: '',
      general_inquiry_email: '',
      contact_form_recipients: [],
      executive_contacts: [],
      division_commissioners: [],
    };
  }

  return data;
}

export async function updateLeagueContacts(contacts: any) {
  const sb = supabase();
  const { data, error } = await sb
    .from('league_contacts')
    .update({ ...contacts, id: 1 })
    .eq('id', 1)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================================
// DIVISIONS
// ============================================================================

export async function getDivisions(activeOnly: boolean = true) {
  const sb = supabase();
  let query = sb.from('divisions').select('*');

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  query = query.order('sort_order', { ascending: true });

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getDivisionByName(name: string) {
  const sb = supabase();
  const { data, error } = await sb
    .from('divisions')
    .select('*')
    .eq('name', name)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateDivision(id: number, updates: any) {
  const sb = supabase();
  const { data, error } = await sb
    .from('divisions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================================
// CONTACT SUBMISSIONS
// ============================================================================

export async function getContactSubmissions() {
  const sb = supabase();
  const { data, error } = await sb
    .from('contact_submissions')
    .select('*')
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createContactSubmission(submission: any) {
  const sb = supabase();
  const { data, error } = await sb
    .from('contact_submissions')
    .insert(submission)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateContactSubmission(id: string, updates: any) {
  const sb = supabase();
  const { data, error } = await sb
    .from('contact_submissions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================================
// NEWSLETTER SUBSCRIBERS
// ============================================================================

export async function getNewsletterSubscribers() {
  const sb = supabase();
  const { data, error } = await sb
    .from('newsletter_subscribers')
    .select('*')
    .eq('is_active', true)
    .order('subscribed_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getSubscriberByEmail(email: string) {
  const sb = supabase();
  const { data, error } = await sb
    .from('newsletter_subscribers')
    .select('*')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createSubscriber(subscriber: any) {
  const sb = supabase();
  const { data, error } = await sb
    .from('newsletter_subscribers')
    .insert(subscriber)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSubscriber(id: string, updates: any) {
  const sb = supabase();
  const { data, error } = await sb
    .from('newsletter_subscribers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================================
// SEASONS
// ============================================================================

export async function getSeasons(activeOnly: boolean = false) {
  const sb = supabase();
  let query = sb.from('seasons').select('*');

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  query = query.order('year', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getSeasonById(id: number) {
  const sb = supabase();
  const { data, error } = await sb
    .from('seasons')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getSeasonByYear(year: number) {
  const sb = supabase();
  const { data, error } = await sb
    .from('seasons')
    .select('*')
    .eq('year', year)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createSeason(season: any) {
  const sb = supabase();
  const { data, error } = await sb
    .from('seasons')
    .insert(season)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSeason(id: number, updates: any) {
  const sb = supabase();
  const { data, error } = await sb
    .from('seasons')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================================
// SUSPENSIONS
// ============================================================================

export async function getSuspensionsSeasons() {
  const sb = supabase();
  const { data, error } = await sb
    .from('seasons')
    .select('year', 'id')
    .order('year', { ascending: false });
  if (error) throw error;
  return data?.map(s => s.year) || [];
}

export async function getSuspensionsBySeason(seasonId: number) {
  const sb = supabase();
  const { data: suspensions, error: suspError } = await sb
    .from('suspensions')
    .select('*')
    .eq('season_id', seasonId)
    .order('player_name');

  const { data: statuses, error: statusError } = await sb
    .from('association_statuses')
    .select('*')
    .eq('season_id', seasonId);

  if (suspError) throw suspError;
  if (statusError) throw statusError;

  return {
    season_id: seasonId,
    suspensions: suspensions || [],
    association_statuses: statuses || [],
  };
}

export async function createSuspension(suspension: any) {
  const sb = supabase();
  const { data, error } = await sb
    .from('suspensions')
    .insert(suspension)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSuspension(id: string, updates: any) {
  const sb = supabase();
  const { data, error } = await sb
    .from('suspensions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSuspension(id: string) {
  const sb = supabase();
  const { error } = await sb.from('suspensions').delete().eq('id', id);
  if (error) throw error;
}

export async function updateAssociationStatuses(seasonId: number, statuses: any[]) {
  const sb = supabase();

  // Delete existing
  await sb.from('association_statuses').delete().eq('season_id', seasonId);

  // Insert new
  if (statuses.length > 0) {
    const { error } = await sb.from('association_statuses').insert(
      statuses.map(s => ({ ...s, season_id }))
    );
    if (error) throw error;
  }
}

export async function deleteSeason(seasonId: number) {
  const sb = supabase();

  // Delete suspensions
  await sb.from('suspensions').delete().eq('season_id', seasonId);
  // Delete association statuses
  await sb.from('association_statuses').delete().eq('season_id', seasonId);
  // Delete season
  await sb.from('seasons').delete().eq('id', seasonId);
}

// ============================================================================
// STORAGE HELPERS
// ============================================================================

const DOCUMENTS_BUCKET = 'make-9a1ba23f-documents';
const IMAGES_BUCKET = 'make-9a1ba23f-images';

export async function uploadToStorage(bucket: string, filename: string, file: Uint8Array, contentType: string) {
  const sb = supabase();
  const { data, error } = await sb
    .storage
    .from(bucket)
    .upload(filename, file, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  return data.path;
}

export async function deleteFromStorage(bucket: string, filename: string) {
  const sb = supabase();
  const { error } = await sb.storage.from(bucket).remove([filename]);
  if (error) throw error;
}

export function getPublicUrl(bucket: string, filename: string) {
  const sb = supabase();
  const { data } = sb.storage.from(bucket).getPublicUrl(filename);
  return data.publicUrl;
}

export { DOCUMENTS_BUCKET, IMAGES_BUCKET };