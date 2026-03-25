-- Add onboarding tracking fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ui_language_selected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS learning_language_selected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS level_selected BOOLEAN DEFAULT FALSE;

-- Update existing users who have completed onboarding
UPDATE users 
SET 
  ui_language_selected = TRUE,
  learning_language_selected = (learning_language IS NOT NULL),
  level_selected = (level IS NOT NULL)
WHERE learning_language IS NOT NULL AND level IS NOT NULL;