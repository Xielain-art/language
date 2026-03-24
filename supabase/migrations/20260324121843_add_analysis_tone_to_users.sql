-- Add selected_analysis_tone_code to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_analysis_tone_code TEXT DEFAULT 'friendly';

-- Add a default analysis prompt if it doesn't exist
INSERT INTO prompts (code, type, label_ru, label_en, prompt_text)
VALUES ('post_analysis', 'system', 'Анализ диалога', 'Dialogue Analysis', 'You are an expert language tutor. Analyze the chat history.')
ON CONFLICT (code) DO NOTHING;
