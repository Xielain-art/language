-- Add configurable settings to replace hardcoded values

-- Audio limits
INSERT INTO bot_settings (key, value, description) VALUES
  ('max_audio_size_mb', '20', 'Maximum audio file size in MB'),
  ('max_audio_duration_sec', '60', 'Maximum audio duration in seconds')
ON CONFLICT (key) DO NOTHING;

-- Chat history depth
INSERT INTO bot_settings (key, value, description) VALUES
  ('chat_history_depth', '20', 'Number of messages to keep in AI context window')
ON CONFLICT (key) DO NOTHING;

-- Vocabulary pagination
INSERT INTO bot_settings (key, value, description) VALUES
  ('vocabulary_items_per_page', '10', 'Number of vocabulary items per page')
ON CONFLICT (key) DO NOTHING;

-- Error icons mapping (JSON)
INSERT INTO bot_settings (key, value, description) VALUES
  ('mistake_type_icons', '{"Grammar": "📝", "Vocabulary": "📖", "Punctuation": "📍", "Spelling": "🔤"}', 'Icons for mistake types in analysis')
ON CONFLICT (key) DO NOTHING;