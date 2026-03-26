-- Manual Document Migration SQL
-- Use this to add documents to the database table
--
-- Instructions:
-- 1. First, check what files are in your Supabase Storage (make-9a1ba23f-documents bucket)
-- 2. Get the public URL for each file from the Supabase Dashboard → Storage → Documents
-- 3. Run the INSERT statements below for each file you want to add

-- Example INSERT statements (update with actual file URLs and details)
-- Adjust the file_url, file_name, and other fields as needed

-- Governance documents
INSERT INTO documents (title, description, file_url, file_name, file_size, file_type, category, subcategory, document_year, division_id, season_id, is_public)
VALUES (
  'RMLL Bylaws',
  'The official bylaws of the Rocky Mountain Lacrosse League',
  'https://YOUR_SUPABASE_URL/storage/v1/object/public/make-9a1ba23f-documents/bylaws.pdf',
  'bylaws.pdf',
  524288,
  'application/pdf',
  'governance',
  'bylaws',
  2024,
  NULL,
  NULL,
  true
) ON CONFLICT DO NOTHING;

-- Rules and Regulations
INSERT INTO documents (title, description, file_url, file_name, file_size, file_type, category, subcategory, document_year, division_id, season_id, is_public)
VALUES (
  'RMLL Playing Rules 2025',
  'Official playing rules for the 2025 season',
  'https://YOUR_SUPABASE_URL/storage/v1/object/public/make-9a1ba23f-documents/playing-rules-2025.pdf',
  'playing-rules-2025.pdf',
  1048576,
  'application/pdf',
  'rules-regulations',
  'playing-rules',
  2025,
  NULL,
  NULL,
  true
) ON CONFLICT DO NOTHING;

-- Officiating documents
INSERT INTO documents (title, description, file_url, file_name, file_size, file_type, category, subcategory, document_year, division_id, season_id, is_public)
VALUES (
  'Referee Manual',
  'RMLL referee officiating manual',
  'https://YOUR_SUPABASE_URL/storage/v1/object/public/make-9a1ba23f-documents/referee-manual.pdf',
  'referee-manual.pdf',
  786432,
  'application/pdf',
  'officiating',
  'referee-manuals',
  2025,
  NULL,
  NULL,
  true
) ON CONFLICT DO NOTHING;

-- Forms
INSERT INTO documents (title, description, file_url, file_name, file_size, file_type, category, subcategory, document_year, division_id, season_id, is_public)
VALUES (
  'Registration Form',
  'Player registration form template',
  'https://YOUR_SUPABASE_URL/storage/v1/object/public/make-9a1ba23f-documents/registration-form.pdf',
  'registration-form.pdf',
  262144,
  'application/pdf',
  'forms',
  'registration',
  2025,
  NULL,
  NULL,
  true
) ON CONFLICT DO NOTHING;

-- Insurance
INSERT INTO documents (title, description, file_url, file_name, file_size, file_type, category, subcategory, document_year, division_id, season_id, is_public)
VALUES (
  'Certificate of Insurance',
  'League certificate of liability insurance',
  'https://YOUR_SUPABASE_URL/storage/v1/object/public/make-9a1ba23f-documents/certificate-of-insurance.pdf',
  'certificate-of-insurance.pdf',
  3145728,
  'application/pdf',
  'insurance',
  'certificates',
  2025,
  NULL,
  NULL,
  true
) ON CONFLICT DO NOTHING;

-- Meetings
INSERT INTO documents (title, description, file_url, file_name, file_size, file_type, category, subcategory, document_year, division_id, season_id, is_public)
VALUES (
  'Board Meeting Minutes - January 2025',
  'Minutes from the January 2025 board meeting',
  'https://YOUR_SUPABASE_URL/storage/v1/object/public/make-9a1ba23f-documents/board-minutes-jan-2025.pdf',
  'board-minutes-jan-2025.pdf',
  131072,
  'application/pdf',
  'meetings',
  'board-minutes',
  2025,
  NULL,
  NULL,
  true
) ON CONFLICT DO NOTHING;

-- Financial
INSERT INTO documents (title, description, file_url, file_name, file_size, file_type, category, subcategory, document_year, division_id, season_id, is_public)
VALUES (
  '2025 Budget',
  'Approved budget for the 2025 season',
  'https://YOUR_SUPABASE_URL/storage/v1/object/public/make-9a1ba23f-documents/2025-budget.pdf',
  '2025-budget.pdf',
  2097152,
  'application/pdf',
  'financial',
  'budgets',
  2025,
  NULL,
  NULL,
  true
) ON CONFLICT DO NOTHING;

-- Schedules
INSERT INTO documents (title, description, file_url, file_name, file_size, file_type, category, subcategory, document_year, division_id, season_id, is_public)
VALUES (
  '2025 Season Schedule',
  'Complete schedule for the 2025 season',
  'https://YOUR_SUPABASE_URL/storage/v1/object/public/make-9a1ba23f-documents/2025-season-schedule.pdf',
  '2025-season-schedule.pdf',
  524288,
  'application/pdf',
  'schedules',
  'season-calendars',
  2025,
  NULL,
  NULL,
  true
) ON CONFLICT DO NOTHING;

-- Rosters
INSERT INTO documents (title, description, file_url, file_name, file_size, file_type, category, subcategory, document_year, division_id, season_id, is_public)
VALUES (
  '2025 Protected Lists',
  'Protected player lists for the 2025 season',
  'https://YOUR_SUPABASE_URL/storage/v1/object/public/make-9a1ba23f-documents/2025-protected-lists.pdf',
  '2025-protected-lists.pdf',
  393216,
  'application/pdf',
  'rosters',
  'protected-lists',
  2025,
  NULL,
  NULL,
  true
) ON CONFLICT DO NOTHING;

-- Query to check existing documents
SELECT id, title, file_name, category, document_year, is_public
FROM documents
ORDER BY upload_date DESC;

-- Query to check for duplicates by file_url
SELECT file_url, COUNT(*) as count
FROM documents
GROUP BY file_url
HAVING COUNT(*) > 1;

-- Valid category values (copy these into your INSERT statements)
-- 'governance', 'rules-regulations', 'officiating', 'forms', 'insurance',
-- 'meetings', 'financial', 'schedules', 'rosters', 'transactions',
-- 'statistics', 'communications', 'historical', 'other'