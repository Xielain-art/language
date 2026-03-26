-- Add streak tracking columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_activity_date DATE,
ADD COLUMN IF NOT EXISTS streak_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_streak INT DEFAULT 0;

-- Create index for efficient streak queries
CREATE INDEX IF NOT EXISTS idx_users_last_activity ON users(last_activity_date);