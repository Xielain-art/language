-- Add SRS (Spaced Repetition System) columns to vocabulary table
ALTER TABLE vocabulary 
ADD COLUMN IF NOT EXISTS learning_stage INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_review_date TIMESTAMPTZ DEFAULT NOW();

-- Create index for efficient review queries
CREATE INDEX IF NOT EXISTS idx_vocabulary_review ON vocabulary(user_id, next_review_date);