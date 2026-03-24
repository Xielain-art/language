-- Add language_code column to vocabulary table
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS language_code TEXT;

-- Update existing records to English as a default (or null if preferred)
UPDATE vocabulary SET language_code = 'en' WHERE language_code IS NULL;
