-- Add SportzSoft API key column to site_settings
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS sportzsoft_api_key TEXT;
COMMENT ON COLUMN site_settings.sportzsoft_api_key IS 'SportzSoft API key for fetching lacrosse data';