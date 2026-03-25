-- Add selected_ai_model column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS selected_ai_model TEXT DEFAULT 'gemini-2.5-flash-lite';