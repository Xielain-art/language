-- Create STT models table
CREATE TABLE IF NOT EXISTS stt_models (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL
);

-- Create TTS models table
CREATE TABLE IF NOT EXISTS tts_models (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  voices JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Insert default STT models
INSERT INTO stt_models (code, name, provider) VALUES
  ('qwen3-asr-flash-2025-09-08', 'Qwen Flash ASR', 'qwen'),
  ('fun-asr-2025-08-25', 'Qwen Fun ASR', 'qwen'),
  ('whisper-1', 'OpenAI Whisper', 'openai')
ON CONFLICT (code) DO NOTHING;

-- Insert default TTS models
INSERT INTO tts_models (code, name, provider, voices) VALUES
  ('cosyvoice-v3-flash', 'Qwen CosyVoice Flash', 'qwen', '["longxiaoxia", "longshu", "longjing", "longcheng", "longxiang"]'::jsonb),
  ('cosyvoice-v2', 'Qwen CosyVoice V2', 'qwen', '["longxiaoxia", "longshu", "longjing", "longcheng", "longxiang"]'::jsonb),
  ('tts-1', 'OpenAI TTS-1', 'openai', '["alloy", "echo", "fable", "onyx", "nova", "shimmer"]'::jsonb),
  ('tts-1-hd', 'OpenAI TTS-1 HD', 'openai', '["alloy", "echo", "fable", "onyx", "nova", "shimmer"]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- Update bot_settings with active model keys
INSERT INTO bot_settings (key, value, description) VALUES
  ('active_stt_model', 'qwen3-asr-flash-2025-09-08', 'Active STT model code'),
  ('active_tts_model', 'cosyvoice-v3-flash', 'Active TTS model code')
ON CONFLICT (key) DO NOTHING;