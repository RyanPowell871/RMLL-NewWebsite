-- Initial schema for RMLL website
-- Run this migration via Supabase Dashboard SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');
CREATE TYPE announcement_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE announcement_type AS ENUM ('info', 'warning', 'success', 'error');
CREATE TYPE announcement_frequency AS ENUM ('once', 'always', 'daily', 'weekly');
CREATE TYPE news_category AS ENUM ('general', 'game-recap', 'player-spotlight', 'team-news', 'league-update', 'playoffs', 'awards', 'community');
CREATE TYPE page_template AS ENUM ('default', 'full-width', 'sidebar');
CREATE TYPE document_category AS ENUM ('governance', 'rules-regulations', 'officiating', 'forms', 'insurance', 'meetings', 'financial', 'schedules', 'rosters', 'transactions', 'statistics', 'communications', 'historical', 'other');

-- Create tables
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

CREATE INDEX idx_app_users_role ON app_users(role);
CREATE INDEX idx_app_users_is_active ON app_users(is_active);

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
  division_id INTEGER,
  tags JSONB NOT NULL DEFAULT '[]',
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_spotlight BOOLEAN NOT NULL DEFAULT false,
  image_position TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT news_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX idx_news_published ON news_articles(is_published, published_date DESC);
CREATE INDEX idx_news_category ON news_articles(category);
CREATE INDEX idx_news_division ON news_articles(division_id);
CREATE INDEX idx_news_spotlight ON news_articles(is_spotlight) WHERE is_spotlight = true;
CREATE INDEX idx_news_tags ON news_articles USING GIN (tags);

CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type announcement_type NOT NULL DEFAULT 'info',
  priority announcement_priority NOT NULL DEFAULT 'medium',
  display_frequency announcement_frequency NOT NULL DEFAULT 'once',
  target_pages JSONB NOT NULL DEFAULT '[]',
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

CREATE INDEX idx_announcements_active ON announcements(is_active, start_date, end_date);
CREATE INDEX idx_announcements_priority ON announcements(priority);
CREATE INDEX idx_announcements_division ON announcements(division_id);

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
  custom_component TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pages_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX idx_pages_nav ON pages(show_in_nav, nav_order) WHERE show_in_nav = true;
CREATE INDEX idx_pages_published ON pages(is_published);

CREATE TABLE page_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_slug TEXT NOT NULL,
  block_type TEXT NOT NULL,
  block_key TEXT NOT NULL,
  content JSONB NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT page_blocks_unique UNIQUE(page_slug, block_key)
);

CREATE INDEX idx_page_blocks_page ON page_blocks(page_slug, order_index);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
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

CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_year ON documents(document_year DESC);
CREATE INDEX idx_documents_division ON documents(division_id);
CREATE INDEX idx_documents_season ON documents(season_id);
CREATE INDEX idx_documents_public ON documents(is_public);

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

CREATE INDEX idx_images_category ON images(category);
CREATE INDEX idx_images_uploaded ON images(uploaded_at DESC);

CREATE TABLE site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  site_name TEXT NOT NULL DEFAULT 'Rocky Mountain Lacrosse League',
  site_tagline TEXT DEFAULT 'Alberta''s Premier Box Lacrosse League',
  site_description TEXT,
  logo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT,
  social_facebook TEXT,
  social_twitter TEXT,
  social_instagram TEXT,
  social_youtube TEXT,
  footer_text TEXT,
  footer_links JSONB,
  meta_description TEXT,
  meta_keywords TEXT,
  google_analytics_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT site_settings_single CHECK (id = 1)
);

CREATE TABLE league_contacts (
  id INTEGER PRIMARY KEY DEFAULT 1,
  address_line1 TEXT,
  address_line2 TEXT,
  privacy_officer_title TEXT,
  privacy_officer_name TEXT,
  privacy_officer_email TEXT,
  general_inquiry_email TEXT,
  contact_form_recipients JSONB,
  executive_contacts JSONB,
  division_commissioners JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT league_contacts_single CHECK (id = 1)
);

CREATE TABLE divisions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  awards JSONB,
  championships JSONB,
  tier INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_divisions_active ON divisions(is_active, sort_order);

CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email_id TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contact_submissions_date ON contact_submissions(submitted_at DESC);
CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);

CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_newsletter_email ON newsletter_subscribers(LOWER(email));
CREATE INDEX idx_newsletter_active ON newsletter_subscribers(is_active);

CREATE TABLE seasons (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_seasons_year ON seasons(year DESC);
CREATE INDEX idx_seasons_active ON seasons(is_active);

CREATE TABLE suspensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id INTEGER REFERENCES seasons(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL,
  player_id INTEGER,
  team_id INTEGER,
  division_id INTEGER,
  suspension_type TEXT NOT NULL,
  games INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  association TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suspensions_season ON suspensions(season_id);
CREATE INDEX idx_suspensions_player ON suspensions(player_id);
CREATE INDEX idx_suspensions_team ON suspensions(team_id);
CREATE INDEX idx_suspensions_division ON suspensions(division_id);
CREATE INDEX idx_suspensions_status ON suspensions(status);
CREATE INDEX idx_suspensions_type ON suspensions(suspension_type);

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

CREATE INDEX idx_association_season ON association_statuses(season_id);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  changes JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at DESC);

-- Create updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_app_users_updated_at BEFORE UPDATE ON app_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_news_articles_updated_at BEFORE UPDATE ON news_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_page_blocks_updated_at BEFORE UPDATE ON page_blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_images_updated_at BEFORE UPDATE ON images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_league_contacts_updated_at BEFORE UPDATE ON league_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_divisions_updated_at BEFORE UPDATE ON divisions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_submissions_updated_at BEFORE UPDATE ON contact_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suspensions_updated_at BEFORE UPDATE ON suspensions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_association_statuses_updated_at BEFORE UPDATE ON association_statuses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
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

-- Public read policies
CREATE POLICY "Public read access to published news" ON news_articles FOR SELECT USING (is_published = true);
CREATE POLICY "Public read access to active announcements" ON announcements FOR SELECT USING (is_active = true AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()));
CREATE POLICY "Public read access to published pages" ON pages FOR SELECT USING (is_published = true);
CREATE POLICY "Public read access to page blocks" ON page_blocks FOR SELECT USING (is_visible = true);
CREATE POLICY "Public read access to public documents" ON documents FOR SELECT USING (is_public = true);
CREATE POLICY "Public read access to images" ON images FOR SELECT USING (true);
CREATE POLICY "Public read access to divisions" ON divisions FOR SELECT USING (true);
CREATE POLICY "Public read access to seasons" ON seasons FOR SELECT USING (true);
CREATE POLICY "Public read access to suspensions" ON suspensions FOR SELECT USING (true);
CREATE POLICY "Public read access to association statuses" ON association_statuses FOR SELECT USING (true);
CREATE POLICY "Public read access to site settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Public read access to league contacts" ON league_contacts FOR SELECT USING (true);
CREATE POLICY "Public create contact submissions" ON contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public create newsletter subscription" ON newsletter_subscribers FOR INSERT WITH CHECK (true);

-- Admin/Editor policies
CREATE POLICY "Admin/Editor full access to news" ON news_articles FOR ALL USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('admin', 'editor')));
CREATE POLICY "Admin full access to announcements" ON announcements FOR ALL USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin/Editor full access to pages" ON pages FOR ALL USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('admin', 'editor')));
CREATE POLICY "Admin/Editor full access to page blocks" ON page_blocks FOR ALL USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('admin', 'editor')));
CREATE POLICY "Admin/Editor full access to documents" ON documents FOR ALL USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('admin', 'editor')));
CREATE POLICY "Admin/Editor full access to images" ON images FOR ALL USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('admin', 'editor')));
CREATE POLICY "Admin full access to settings" ON site_settings FOR ALL USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to league contacts" ON league_contacts FOR ALL USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to divisions" ON divisions FOR ALL USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to contact submissions" ON contact_submissions FOR ALL USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to subscribers" ON newsletter_subscribers FOR ALL USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to seasons" ON seasons FOR ALL USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to suspensions" ON suspensions FOR ALL USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to association statuses" ON association_statuses FOR ALL USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can read their own profile" ON app_users FOR SELECT USING (id = auth.uid());

-- Insert initial data
INSERT INTO site_settings (id, site_name, site_tagline, site_description, contact_email, footer_text, footer_links, meta_description, meta_keywords) VALUES (
  1, 'Rocky Mountain Lacrosse League', 'Alberta''s Premier Box Lacrosse League',
  'The RMLL is a competitive box lacrosse league serving communities across Alberta.',
  'info@rmll.ca', '© 2024 Rocky Mountain Lacrosse League. All rights reserved.',
  '[]'::JSONB, 'Rocky Mountain Lacrosse League - Alberta''s Premier Box Lacrosse League',
  '["lacrosse", "box lacrosse", "alberta", "RMLL"]'::JSONB
) ON CONFLICT DO NOTHING;

INSERT INTO league_contacts (id, address_line1, address_line2, privacy_officer_title, privacy_officer_name, privacy_officer_email, executive_contacts, division_commissioners) VALUES (
  1, 'PO Box 47083 Creekside', 'Calgary, Alberta T3P 0B9', 'President of the RMLL', '', '',
  '[{"role": "President", "name": "Duane Bratt", "email": "dbratt@mtroyal.ca"}, {"role": "Executive Director", "name": "Christine Thielen", "email": "christinethielen@hotmail.com"}, {"role": "Vice President", "name": "Greg Lintz", "email": "greg@purdonlaw.com"}]'::JSONB,
  '[]'::JSONB
) ON CONFLICT DO NOTHING;

INSERT INTO seasons (year, name, is_active) VALUES (2025, '2025 Season', true) ON CONFLICT DO NOTHING;

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