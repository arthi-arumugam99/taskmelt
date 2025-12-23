-- Create dumps table for storing brain dump sessions
CREATE TABLE IF NOT EXISTS dumps (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  categories JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  summary TEXT,
  reflection_insight TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_dumps_user_id ON dumps(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_dumps_created_at ON dumps(created_at DESC);

-- Enable Row Level Security
ALTER TABLE dumps ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own dumps
CREATE POLICY "Users can read their own dumps"
  ON dumps
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own dumps
CREATE POLICY "Users can insert their own dumps"
  ON dumps
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own dumps
CREATE POLICY "Users can update their own dumps"
  ON dumps
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own dumps
CREATE POLICY "Users can delete their own dumps"
  ON dumps
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function on update
CREATE TRIGGER update_dumps_updated_at
  BEFORE UPDATE ON dumps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
