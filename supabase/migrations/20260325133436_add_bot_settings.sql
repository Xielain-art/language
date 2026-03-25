-- Create bot_settings table for admin configuration
CREATE TABLE IF NOT EXISTS bot_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO bot_settings (key, value, description) VALUES
  ('placement_test_model', 'qwen-plus', 'Model used for AI placement tests'),
  ('available_models', '["gemini-2.5-flash-lite", "qwen-plus"]', 'Available AI models for users to choose from')
ON CONFLICT (key) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bot_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for timestamp updates
CREATE TRIGGER update_bot_settings_timestamp
  BEFORE UPDATE ON bot_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_bot_settings_timestamp();