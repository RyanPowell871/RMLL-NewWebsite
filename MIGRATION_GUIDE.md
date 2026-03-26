# Database Migration Guide

This guide explains how to migrate from the KV store implementation to the production-ready PostgreSQL database schema for the RMLL website.

## Overview

The original implementation used a simple KV store (`kv_store_9a1ba23f` table) which stored all data as JSON strings. The new implementation uses proper PostgreSQL tables with appropriate data types, indexes, and Row Level Security (RLS).

## Migration Steps

### 1. Run the Initial Schema Migration

1. Open the Supabase Dashboard for your project
2. Go to SQL Editor
3. Run the contents of `supabase/migrations/20250325_initial_schema.sql`

This will create:
- All necessary tables with proper constraints
- Indexes for performance
- Row Level Security (RLS) policies
- Storage buckets for documents and images
- Initial data (site settings, league contacts, seasons, divisions)

### 2. Migrate Existing Data (if needed)

If you have existing data in the KV store that needs to be migrated, you'll need to write custom migration scripts. The structure of the new database is:

| KV Key Pattern | Database Table | Key Field |
|---------------|----------------|-----------|
| `news:*` | `news_articles` | `slug` |
| `announcement:*` | `announcements` | `id` |
| `page:*` | `pages` | `slug` |
| `document:*` | `documents` | `id` |
| `image:*` | `images` | `id` |
| `user:*` | `app_users` | `id` (matches auth.users.id) |
| `site:settings` | `site_settings` | `id = 1` |
| `league:contacts` | `league_contacts` | `id = 1` |

Note: The following features still use KV and are not migrated:
- Division data (`division:*`)
- League info navigation (`league-info:navigation`)
- Structured page content (`page-structured:*`)
- Suspensions (`suspensions:*`)
- Component page overrides (`page:*` for component pages)

### 3. Update Environment Variables

Make sure your Supabase environment variables are set in your edge function environment:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `SUPABASE_ANON_KEY` - Anon key for client-side operations

### 4. Update Client-Side Code

The client-side API calls (`src/services/cms-api.ts`, etc.) should work without changes as the API responses remain compatible.

### 5. Test the Migration

1. Start your development server: `npm run dev`
2. Test the CMS at `/cms`
3. Verify:
   - News articles display correctly
   - Pages load properly
   - Documents and images can be uploaded
   - User management works
   - Settings and league contacts save correctly

## Database Schema Overview

### Core Tables

#### app_users
- Linked to auth.users via CASCADE delete
- Contains role (admin, editor, viewer) and profile data

#### news_articles
- Articles with title, content, author, category
- Supports tags, featured images, spotlight flag
- Published status filtering

#### announcements
- Site-wide announcements with priority levels
- Target page filtering
- Date-based display windows

#### pages & page_blocks
- CMS pages with content
- Page blocks for structured content

#### documents
- File uploads with metadata
- Category and subcategory classification
- Year-based filtering

#### images
- Image uploads with metadata
- Category-based organization

#### site_settings & league_contacts
- Singleton records (id=1)
- Site configuration and contact info

### Enums

- `user_role`: admin, editor, viewer
- `announcement_priority`: high, medium, low
- `announcement_type`: info, warning, success, error
- `announcement_frequency`: once, always, daily, weekly
- `news_category`: general, game-recap, player-spotlight, team-news, league-update, playoffs, awards, community
- `page_template`: default, full-width, sidebar
- `document_category`: governance, rules-regulations, officiating, forms, insurance, meetings, financial, schedules, rosters, transactions, statistics, communications, historical, other

## Storage Buckets

- `make-9a1ba23f-documents` - PDF and document files
- `make-9a1ba23f-images` - Image files

## RLS Policies

### Public Access
- Published news articles
- Active announcements (within date range)
- Published pages
- Page blocks (visible only)
- Public documents
- Images
- Divisions
- Seasons
- Suspensions
- Association statuses
- Site settings
- League contacts
- Contact submissions (INSERT only)
- Newsletter subscriptions (INSERT only)

### Admin Access
- Full access to all tables for admin role
- Full access to news, pages, page_blocks, documents, images for admin/editor roles
- Settings and league contacts for admin only
- User management for admin only

## Local Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Setup Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a new project at https://supabase.com
   - Run the migration SQL in the SQL Editor
   - Get your project URL and keys from Settings > API

3. **Configure environment variables:**
   Create a `.env` file (or configure in Supabase Edge Functions settings):
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   SPORTZSOFT_API_KEY=your-sportzsoft-key
   ```

   For Edge Functions:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Create an admin user:**
   - Sign up via the Supabase Auth UI or use SQL
   - Insert into `app_users` table with `role = 'admin'`

   ```sql
   -- Example: Create admin user (replace with your user ID from auth.users)
   INSERT INTO app_users (id, email, name, role, is_active)
   VALUES ('your-user-id', 'admin@rmll.ca', 'Admin', 'admin', true);
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Access the CMS:**
   - Navigate to `/cms`
   - Sign in with your admin credentials

## Rollback Plan

If you need to rollback to the KV store implementation:

1. Restore your previous route files:
   - `src/supabase/functions/server/content_routes.ts`
   - `src/supabase/functions/server/settings_routes.ts`
   - `src/supabase/functions/server/auth_routes.ts`
   - `src/supabase/functions/server/email_routes.ts`
   - `src/supabase/functions/server/documents_routes.ts`
   - `src/supabase/functions/server/images_routes.ts`

2. The KV store (`kv_store_9a1ba23f`) will still contain your original data

3. Redeploy your edge functions

## Notes

- The new database is production-ready with proper indexing and constraints
- RLS policies ensure security without needing to check permissions in code
- The KV store is still used for some features (division data, structured content) that require complex JSON structures
- Storage buckets remain unchanged
- API endpoints remain compatible with the frontend code