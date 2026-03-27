-- Add mega_reports_passed field to track how many mega reports user has completed
ALTER TABLE users ADD COLUMN IF NOT EXISTS mega_reports_passed INTEGER DEFAULT 0;

-- Add settings for level-up system
INSERT INTO bot_settings (key, value, description) VALUES
  ('level_up_reports_required', '10', 'Number of mega reports required before level-up exam is available'),
  ('level_up_enabled', 'true', 'Enable/disable the level-up exam feature')
ON CONFLICT (key) DO NOTHING;