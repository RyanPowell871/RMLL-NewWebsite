-- ============================================================================
-- Reset League Info Pages to Defaults
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================================

-- This will clear all CMS overrides for League Info pages
-- After running, pages will use their default content from the codebase

-- 1. Delete all structured content overrides
DELETE FROM kv_store_9a1ba23f
WHERE key LIKE 'page-structured:%';

-- 2. Delete all HTML page overrides (excluding home page)
DELETE FROM kv_store_9a1ba23f
WHERE key LIKE 'page:%'
AND key NOT IN ('page:home', 'page:home/');

-- 3. Delete the navigation KV entry (so it falls back to corrected default)
DELETE FROM kv_store_9a1ba23f
WHERE key = 'league-info:navigation';

-- 4. Verify what was cleared
SELECT
    key,
    CASE
        WHEN key LIKE 'page-structured:%' THEN 'Structured'
        WHEN key LIKE 'page:%' THEN 'HTML'
        WHEN key = 'league-info:navigation' THEN 'Navigation'
    END as override_type,
    CASE
        WHEN value->>'pageId' IS NOT NULL THEN value->>'pageId'
        WHEN key LIKE 'page:%' THEN REPLACE(key, 'page:', '')
        ELSE 'unknown'
    END as page_id,
    CASE
        WHEN value->>'title' IS NOT NULL THEN value->>'title'
        WHEN value->>'pageTitle' IS NOT NULL THEN value->>'pageTitle'
        ELSE '(no title)'
    END as title
FROM kv_store_9a1ba23f
WHERE key LIKE 'page-%' OR key = 'league-info:navigation'
ORDER BY key;

-- Expected result should be empty (no rows returned after the deletes)
-- ============================================================================