-- Add voice system support to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_voice_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS voice_id TEXT DEFAULT 'default';

-- Add STT/TTS provider settings to bot_settings
INSERT INTO bot_settings (key, value, description) VALUES
  ('stt_provider', 'qwen', 'Speech-to-Text provider (qwen, openai)'),
  ('stt_model', 'fun-asr-2025-08-25', 'STT model name'),
  ('tts_provider', 'qwen', 'Text-to-Speech provider (qwen, openai)'),
  ('tts_model', 'cosyvoice-v3-flash', 'TTS model name')
ON CONFLICT (key) DO NOTHING;