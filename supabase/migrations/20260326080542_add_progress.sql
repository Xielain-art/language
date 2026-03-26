CREATE TABLE IF NOT EXISTS user_progress_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,
  advice TEXT NOT NULL,
  mistakes_analyzed INT DEFAULT 0,
  ai_model_used TEXT,
  is_mega_report BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_progress_reports_user_id ON user_progress_reports(user_id);
ALTER TABLE user_progress_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage user_progress_reports" ON user_progress_reports FOR ALL USING (true);
