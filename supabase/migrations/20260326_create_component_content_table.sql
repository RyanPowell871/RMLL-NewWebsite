-- Create table for component content storage
CREATE TABLE IF NOT EXISTS public.rmll_component_content (
  id BIGSERIAL PRIMARY KEY,
  page_id TEXT UNIQUE NOT NULL,
  component_file TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on page_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_rmll_component_content_page_id ON public.rmll_component_content(page_id);

-- Set up row level security (optional, adjust as needed)
ALTER TABLE public.rmll_component_content ENABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust as needed for your security model)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rmll_component_content TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rmll_component_content TO service_role;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.rmll_component_content
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();