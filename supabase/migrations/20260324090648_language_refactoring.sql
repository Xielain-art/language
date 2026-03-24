-- Step 1: Create languages table
CREATE TABLE languages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL
);

-- Step 2: Insert base languages
INSERT INTO languages (code, name_ru, name_en) VALUES 
('en', 'Английский', 'English'),
('es', 'Испанский', 'Spanish'),
('de', 'Немецкий', 'German');

-- Step 3: Update users table
ALTER TABLE users RENAME COLUMN english_level TO level;
ALTER TABLE users ADD COLUMN learning_language TEXT REFERENCES languages(code);

-- Step 4: Update prompts to use {{LANGUAGE}} placeholder
UPDATE prompts 
SET prompt_text = REPLACE(prompt_text, 'English', '{{LANGUAGE}}')
WHERE type IN ('tone', 'roleplay');
