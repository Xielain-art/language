-- Create type for mistake categories
CREATE TYPE mistake_type AS ENUM ('Grammar', 'Vocabulary', 'Punctuation', 'Spelling');

-- Table for mistake history
CREATE TABLE IF NOT EXISTS user_mistakes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  type mistake_type NOT NULL,
  original_text TEXT,
  corrected_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast graph building by time
CREATE INDEX IF NOT EXISTS idx_user_mistakes_user_date ON user_mistakes(user_id, created_at);

-- Enable RLS
ALTER TABLE user_mistakes ENABLE ROW LEVEL SECURITY;

-- Policy for service role access
CREATE POLICY "Service role can manage user_mistakes" ON user_mistakes
  FOR ALL USING (true);