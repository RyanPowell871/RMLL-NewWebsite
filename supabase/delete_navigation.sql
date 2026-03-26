-- Delete the league info navigation from KV store
-- This will make it fall back to the corrected default navigation

DELETE FROM kv_store_9a1ba23f
WHERE key = 'league-info:navigation';