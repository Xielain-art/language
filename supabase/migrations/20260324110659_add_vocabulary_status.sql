-- Add is_learned column to vocabulary table
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS is_learned BOOLEAN DEFAULT false NOT NULL;
