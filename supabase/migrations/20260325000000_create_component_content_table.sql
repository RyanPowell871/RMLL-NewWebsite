-- Create table for storing editable component content
CREATE TABLE IF NOT EXISTS public.rmll_component_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id TEXT NOT NULL UNIQUE,
  component_file TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on page_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_rmll_component_content_page_id
  ON public.rmll_component_content(page_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rmll_component_content_updated_at
  BEFORE UPDATE ON public.rmll_component_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON TABLE public.rmll_component_content TO authenticated;
GRANT ALL ON TABLE public.rmll_component_content TO service_role;

-- Grant execute permissions on the trigger function
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO service_role;

-- Enable Row Level Security
ALTER TABLE public.rmll_component_content ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read
CREATE POLICY "Allow authenticated read access"
  ON public.rmll_component_content
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow all authenticated users to insert
CREATE POLICY "Allow authenticated insert access"
  ON public.rmll_component_content
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow all authenticated users to update
CREATE POLICY "Allow authenticated update access"
  ON public.rmll_component_content
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policy to allow service role full access
CREATE POLICY "Allow service role full access"
  ON public.rmll_component_content
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comment on table
COMMENT ON TABLE public.rmll_component_content IS 'Stores editable content for React components';