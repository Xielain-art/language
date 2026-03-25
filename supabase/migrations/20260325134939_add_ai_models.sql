-- Create enum for AI providers
CREATE TYPE ai_provider AS ENUM ('gemini', 'qwen', 'openai', 'deepseek');

-- Create ai_models table
CREATE TABLE IF NOT EXISTS ai_models (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider ai_provider NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  supports_voice BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger for timestamp updates
CREATE TRIGGER update_ai_models_timestamp
  BEFORE UPDATE ON ai_models
  FOR EACH ROW
  EXECUTE FUNCTION update_bot_settings_timestamp();

-- Insert default models
INSERT INTO ai_models (code, name, provider, description, supports_voice) VALUES
  ('gemini-2.5-flash-lite', 'Gemini 2.5 Flash', 'gemini', 'Fast and efficient Google AI model', TRUE),
  ('qwen-plus', 'Qwen Plus', 'qwen', 'Alibaba Qwen model (text only)', FALSE)
ON CONFLICT (code) DO NOTHING;