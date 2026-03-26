-- ============================================================================
-- RMLL Website - Production Database Schema
-- Supabase PostgreSQL Schema
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For hashing (if needed)

-- ============================================================================
-- STORAGE BUCKETS (to be created via Supabase Dashboard UI)
-- ============================================================================
-- 1. make-9a1ba23f-images     - For uploaded images
-- 2. make-9a1ba23f-documents  - For uploaded documents
--
-- Both should have public bucket policies for read access

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');

CREATE TYPE announcement_priority AS ENUM ('high', 'medium', 'low');

CREATE TYPE announcement_type AS ENUM ('info', 'warning', 'success', 'error');

CREATE TYPE announcement_frequency AS ENUM ('once', 'always', 'daily', 'weekly');

CREATE TYPE news_category AS ENUM (
  'general',
  'game-recap',
  'player-spotlight',
  'team-news',
  'league-update',
  'playoffs',
  'awards',
  'community'
);

CREATE TYPE page_template AS ENUM ('default', 'full-width', 'sidebar');

CREATE TYPE document_category AS ENUM (
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
  'other'
);

CREATE TYPE suspension_status AS ENUM ('active', 'served', 'pending');

-- ============================================================================
-- TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Users (linked to Supabase Auth)
-- ----------------------------------------------------------------------------
CREATE TABLE app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT app_users_email_unique UNIQUE(email)
);

-- Index for role-based queries
CREATE INDEX idx_app_users_role ON app_users(role);
CREATE INDEX idx_app_users_is_active ON app_users(is_active);

-- ----------------------------------------------------------------------------
-- News Articles
-- ----------------------------------------------------------------------------
CREATE TABLE news_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image_url TEXT,
  author TEXT NOT NULL DEFAULT 'RMLL Admin',
  published_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  category news_category NOT NULL DEFAULT 'general',
  division_id INTEGER,  -- Foreign key reference to SportzSoft division
  tags JSONB NOT NULL DEFAULT '[]',  -- JSON array of strings
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_spotlight BOOLEAN NOT NULL DEFAULT false,
  image_position TEXT, -- 'top' | 'center' | 'bottom' for object-position
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT news_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Indexes
CREATE INDEX idx_news_published ON news_articles(is_published, published_date DESC);
CREATE INDEX idx_news_category ON news_articles(category);
CREATE INDEX idx_news_division ON news_articles(division_id);
CREATE INDEX idx_news_spotlight ON news_articles(is_spotlight) WHERE is_spotlight = true;
CREATE INDEX idx_news_tags ON news_articles USING GIN (tags);
CREATE INDEX idx_news_search ON news_articles USING GIN (to_tsvector('english', title || ' ' || excerpt));

-- Full text search trigger
CREATE OR REPLACE FUNCTION news_articles_search_trigger() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.excerpt, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add search_vector column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'news_articles' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE news_articles ADD COLUMN search_vector TSVECTOR;
    CREATE INDEX idx_news_articles_search ON news_articles USING GIN (search_vector);
    CREATE TRIGGER news_articles_search_update BEFORE INSERT OR UPDATE ON news_articles
      FOR EACH ROW EXECUTE FUNCTION news_articles_search_trigger();
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Announcements
-- ----------------------------------------------------------------------------
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type announcement_type NOT NULL DEFAULT 'info',
  priority announcement_priority NOT NULL DEFAULT 'medium',
  display_frequency announcement_frequency NOT NULL DEFAULT 'once',
  target_pages JSONB NOT NULL DEFAULT '[]',  -- JSON array of pages ['all', 'home', 'schedule', etc.]
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  button_text TEXT,
  button_link TEXT,
  image_url TEXT,
  division_id INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_announcements_active ON announcements(is_active, start_date, end_date);
CREATE INDEX idx_announcements_priority ON announcements(priority);
CREATE INDEX idx_announcements_division ON announcements(division_id);

-- ----------------------------------------------------------------------------
-- Pages
-- ----------------------------------------------------------------------------
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  meta_description TEXT,
  featured_image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  show_in_nav BOOLEAN NOT NULL DEFAULT false,
  nav_order INTEGER NOT NULL DEFAULT 0,
  template page_template NOT NULL DEFAULT 'default',
  custom_component TEXT,  -- For pages that use React components
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pages_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Indexes
CREATE INDEX idx_pages_nav ON pages(show_in_nav, nav_order) WHERE show_in_nav = true;
CREATE INDEX idx_pages_published ON pages(is_published);
CREATE INDEX idx_pages_search ON pages USING GIN (to_tsvector('english', title || ' ' || COALESCE(content, '')));

-- ----------------------------------------------------------------------------
-- Page Blocks (structured content for League Info pages)
-- ----------------------------------------------------------------------------
CREATE TABLE page_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_slug TEXT NOT NULL,
  block_type TEXT NOT NULL,  -- 'hero', 'intro', 'text', 'image', 'awards', 'championships', etc.
  block_key TEXT NOT NULL,   -- Unique key for this block within the page
  content JSONB NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT page_blocks_unique UNIQUE(page_slug, block_key)
);

-- Indexes
CREATE INDEX idx_page_blocks_page ON page_blocks(page_slug, order_index);

-- ----------------------------------------------------------------------------
-- Documents
-- ----------------------------------------------------------------------------
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,  -- MIME type
  category document_category NOT NULL DEFAULT 'other',
  subcategory TEXT,
  document_year INTEGER,
  division_id INTEGER,
  season_id INTEGER,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_year ON documents(document_year DESC);
CREATE INDEX idx_documents_division ON documents(division_id);
CREATE INDEX idx_documents_season ON documents(season_id);
CREATE INDEX idx_documents_public ON documents(is_public);
CREATE INDEX idx_documents_search ON documents USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || file_name));

-- ----------------------------------------------------------------------------
-- Images
-- ----------------------------------------------------------------------------
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  alt_text TEXT,
  category TEXT NOT NULL DEFAULT 'uncategorized',
  file_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_images_category ON images(category);
CREATE INDEX idx_images_uploaded ON images(uploaded_at DESC);

-- ----------------------------------------------------------------------------
-- Site Settings (Singleton - single row)
-- ----------------------------------------------------------------------------
CREATE TABLE site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  -- Site Info
  site_name TEXT NOT NULL DEFAULT 'Rocky Mountain Lacrosse League',
  site_tagline TEXT DEFAULT 'Alberta''s Premier Box Lacrosse League',
  site_description TEXT,
  logo_url TEXT,

  -- Contact Info
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT,

  -- Social Media
  social_facebook TEXT,
  social_twitter TEXT,
  social_instagram TEXT,
  social_youtube TEXT,

  -- Footer
  footer_text TEXT,
  footer_links JSONB,

  -- SEO
  meta_description TEXT,
  meta_keywords TEXT,

  -- Analytics
  google_analytics_id TEXT,

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT site_settings_single CHECK (id = 1)
);

-- ----------------------------------------------------------------------------
-- League Contacts (Singleton - single row)
-- ----------------------------------------------------------------------------
CREATE TABLE league_contacts (
  id INTEGER PRIMARY KEY DEFAULT 1,
  address_line1 TEXT,
  address_line2 TEXT,
  privacy_officer_title TEXT,
  privacy_officer_name TEXT,
  privacy_officer_email TEXT,
  general_inquiry_email TEXT,
  contact_form_recipients JSONB,  -- JSON array of email addresses
  executive_contacts JSONB,       -- JSON array of {role, name, email}
  division_commissioners JSONB,   -- JSON array of {division, commissioner, email}
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT league_contacts_single CHECK (id = 1)
);

-- ----------------------------------------------------------------------------
-- Divisions (CMS-managed division data)
-- ----------------------------------------------------------------------------
CREATE TABLE divisions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  awards JSONB,              -- Historical awards data
  championships JSONB,       -- Historical championships data
  tier INTEGER,              -- For divisions with tiers (Junior A, Tier I, II, III)
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_divisions_active ON divisions(is_active, sort_order);

-- ----------------------------------------------------------------------------
-- Contact Form Submissions
-- ----------------------------------------------------------------------------
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email_id TEXT,              -- Resend email ID (if sent)
  status TEXT NOT NULL DEFAULT 'new',  -- 'new', 'read', 'replied'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_contact_submissions_date ON contact_submissions(submitted_at DESC);
CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);

-- ----------------------------------------------------------------------------
-- Newsletter Subscribers
-- ----------------------------------------------------------------------------
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_newsletter_email ON newsletter_subscribers(LOWER(email));
CREATE INDEX idx_newsletter_active ON newsletter_subscribers(is_active);

-- ----------------------------------------------------------------------------
-- Seasons (for tracking season data)
-- ----------------------------------------------------------------------------
CREATE TABLE seasons (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_seasons_year ON seasons(year DESC);
CREATE INDEX idx_seasons_active ON seasons(is_active);

-- ----------------------------------------------------------------------------
-- Suspensions
-- ----------------------------------------------------------------------------
CREATE TABLE suspensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id INTEGER REFERENCES seasons(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL,
  player_id INTEGER,  -- SportzSoft player ID
  team_id INTEGER,     -- SportzSoft team ID
  division_id INTEGER,
  suspension_type TEXT NOT NULL,  -- 'suspension' or 'carryover'
  games INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  association TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_suspensions_season ON suspensions(season_id);
CREATE INDEX idx_suspensions_player ON suspensions(player_id);
CREATE INDEX idx_suspensions_team ON suspensions(team_id);
CREATE INDEX idx_suspensions_division ON suspensions(division_id);
CREATE INDEX idx_suspensions_status ON suspensions(status);
CREATE INDEX idx_suspensions_type ON suspensions(suspension_type);

-- ----------------------------------------------------------------------------
-- Association Statuses (for each season)
-- ----------------------------------------------------------------------------
CREATE TABLE association_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  association_name TEXT NOT NULL,
  is_compliant BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT association_statuses_unique UNIQUE(season_id, association_name)
);

-- Indexes
CREATE INDEX idx_association_season ON association_statuses(season_id);

-- ----------------------------------------------------------------------------
-- Audit Logs (optional - for tracking CMS changes)
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,       -- 'create', 'update', 'delete'
  entity_type TEXT NOT NULL,  -- 'news', 'page', 'document', etc.
  entity_id TEXT,
  changes JSONB,             -- Before/after values
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE association_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Public read access to published news"
  ON news_articles FOR SELECT
  USING (is_published = true);

CREATE POLICY "Public read access to active announcements"
  ON announcements FOR SELECT
  USING (is_active = true AND
         (start_date IS NULL OR start_date <= NOW()) AND
         (end_date IS NULL OR end_date >= NOW()));

CREATE POLICY "Public read access to published pages"
  ON pages FOR SELECT
  USING (is_published = true);

CREATE POLICY "Public read access to page blocks"
  ON page_blocks FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Public read access to public documents"
  ON documents FOR SELECT
  USING (is_public = true);

CREATE POLICY "Public read access to images"
  ON images FOR SELECT
  USING (true);

CREATE POLICY "Public read access to divisions"
  ON divisions FOR SELECT
  USING (true);

CREATE POLICY "Public read access to seasons"
  ON seasons FOR SELECT
  USING (true);

CREATE POLICY "Public read access to suspensions"
  ON suspensions FOR SELECT
  USING (true);

CREATE POLICY "Public read access to association statuses"
  ON association_statuses FOR SELECT
  USING (true);

CREATE POLICY "Public read access to site settings"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "Public read access to league contacts"
  ON league_contacts FOR SELECT
  USING (true);

-- Public create access (contact form, newsletter)
CREATE POLICY "Public create contact submissions"
  ON contact_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public create newsletter subscription"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- Admin/Editor policies (via Supabase Auth)
CREATE POLICY "Admin/Editor full access to news"
  ON news_articles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admin full access to announcements"
  ON announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admin/Editor full access to pages"
  ON pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admin/Editor full access to page blocks"
  ON page_blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admin/Editor full access to documents"
  ON documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admin/Editor full access to images"
  ON images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admin full access to settings"
  ON site_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to league contacts"
  ON league_contacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to divisions"
  ON divisions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to contact submissions"
  ON contact_submissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to subscribers"
  ON newsletter_subscribers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to seasons"
  ON seasons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to suspensions"
  ON suspensions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to association statuses"
  ON association_statuses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can read their own profile"
  ON app_users FOR SELECT
  USING (id = auth.uid());

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_app_users_updated_at BEFORE UPDATE ON app_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_articles_updated_at BEFORE UPDATE ON news_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_page_blocks_updated_at BEFORE UPDATE ON page_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_images_updated_at BEFORE UPDATE ON images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_league_contacts_updated_at BEFORE UPDATE ON league_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_divisions_updated_at BEFORE UPDATE ON divisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_submissions_updated_at BEFORE UPDATE ON contact_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suspensions_updated_at BEFORE UPDATE ON suspensions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_association_statuses_updated_at BEFORE UPDATE ON association_statuses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for news articles with formatted data
CREATE VIEW v_news_articles AS
SELECT
  id,
  slug,
  title,
  content,
  excerpt,
  featured_image_url,
  author,
  published_date,
  category,
  division_id,
  tags,
  is_published,
  is_spotlight,
  image_position,
  created_at,
  updated_at
FROM news_articles;

-- View for active announcements
CREATE VIEW v_active_announcements AS
SELECT
  id,
  title,
  content,
  type,
  priority,
  display_frequency,
  target_pages,
  start_date,
  end_date,
  button_text,
  button_link,
  image_url,
  division_id
FROM announcements
WHERE is_active = true
  AND (start_date IS NULL OR start_date <= NOW())
  AND (end_date IS NULL OR end_date >= NOW())
ORDER BY priority DESC;

-- View for public documents
CREATE VIEW v_public_documents AS
SELECT
  id,
  title,
  description,
  file_url,
  file_name,
  file_size,
  file_type,
  category,
  subcategory,
  document_year,
  division_id,
  season_id,
  upload_date
FROM documents
WHERE is_public = true
ORDER BY document_year DESC NULLS LAST, upload_date DESC;

-- View for active seasons
CREATE VIEW v_active_seasons AS
SELECT *
FROM seasons
WHERE is_active = true
ORDER BY year DESC;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default site settings
INSERT INTO site_settings (id, site_name, site_tagline, site_description, contact_email, footer_text, footer_links, meta_description, meta_keywords) VALUES (
  1,
  'Rocky Mountain Lacrosse League',
  'Alberta''s Premier Box Lacrosse League',
  'The RMLL is a competitive box lacrosse league serving communities across Alberta.',
  'info@rmll.ca',
  '© 2024 Rocky Mountain Lacrosse League. All rights reserved.',
  '[]'::JSONB,
  'Rocky Mountain Lacrosse League - Alberta''s Premier Box Lacrosse League',
  '["lacrosse", "box lacrosse", "alberta", "RMLL"]'::JSONB
) ON CONFLICT (id) DO NOTHING;

-- Insert default league contacts
INSERT INTO league_contacts (id, address_line1, address_line2, privacy_officer_title, privacy_officer_name, privacy_officer_email, executive_contacts, division_commissioners) VALUES (
  1,
  'PO Box 47083 Creekside',
  'Calgary, Alberta T3P 0B9',
  'President of the RMLL',
  '',
  '',
  '[
    {"role": "President", "name": "Duane Bratt", "email": "dbratt@mtroyal.ca"},
    {"role": "Executive Director", "name": "Christine Thielen", "email": "christinethielen@hotmail.com"},
    {"role": "Vice President", "name": "Greg Lintz", "email": "greg@purdonlaw.com"}
  ]'::JSONB,
  '[]'::JSONB
) ON CONFLICT (id) DO NOTHING;

-- Insert current season
INSERT INTO seasons (year, name, is_active) VALUES
  (2025, '2025 Season', true)
ON CONFLICT DO NOTHING;

-- Insert default divisions
INSERT INTO divisions (name, display_name, description, is_active, sort_order) VALUES
  ('Senior B', 'Senior B', NULL, true, 1),
  ('Senior C', 'Senior C', NULL, true, 2),
  ('Junior A', 'Junior A', NULL, true, 3),
  ('Junior B Tier I', 'Junior B Tier I', NULL, true, 4),
  ('Junior B Tier II', 'Junior B Tier II', NULL, true, 5),
  ('Junior B Tier III', 'Junior B Tier III', NULL, true, 6),
  ('Alberta Major Senior Female', 'Senior Female', NULL, true, 7),
  ('Alberta Major Female', 'Junior Ladies', NULL, true, 8)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- GRANTS (for storage buckets - run in Supabase Dashboard)
-- ============================================================================
-- After creating storage buckets in the dashboard, run these:

-- For images bucket:
-- grant usage on schema storage to postgres;
-- grant usage on schema public to postgres;
-- grant select on all tables in schema storage to postgres;
-- grant select on all tables in schema storage to authenticated;
-- grant select on all tables in schema storage to anon;

-- Or use Supabase Dashboard UI for bucket policies.

-- ============================================================================
-- DONE
-- ============================================================================