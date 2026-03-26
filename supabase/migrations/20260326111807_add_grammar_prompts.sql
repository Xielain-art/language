-- Add grammar prompts to the prompts table
INSERT INTO prompts (code, type, label_ru, label_en, prompt_text) VALUES
(
  'grammar_explain',
  'grammar',
  'Объяснение грамматики',
  'Grammar Explanation',
  'You are a language tutor. The user is learning {{target_language}} at level {{user_level}}. Their native language is {{ui_language}}. 

Choose ONE random but important grammar rule for this level. Explain it briefly (up to 3 paragraphs) and provide 3 examples.

Return the response in JSON format:
{
  "topic": "Name of the grammar rule",
  "explanation": "Brief explanation of the rule",
  "examples": ["Example 1", "Example 2", "Example 3"]
}'
),
(
  'grammar_quiz',
  'grammar',
  'Тест по грамматике',
  'Grammar Quiz',
  'You are a language tutor. Generate a grammar quiz question for {{target_language}} at level {{user_level}}. The user''s native language is {{ui_language}}.

Create a sentence with a blank and 4 answer options. One option should be correct.

Return the response in JSON format:
{
  "question": "Sentence with ___ (fill in the blank)",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_index": 2,
  "explanation": "Brief explanation why this answer is correct"
}'
),
(
  'grammar_weakness',
  'grammar',
  'Анализ слабых мест',
  'Weakness Analysis',
  'You are a language tutor. The user is learning {{target_language}} at level {{user_level}}. Their native language is {{ui_language}}. 

They have a weakness in {{weakness_type}} (made {{mistake_count}} mistakes in the last 7 days).

Explain this common mistake type and provide 3 examples of correct usage to help them improve.

Return the response in JSON format:
{
  "topic": "{{weakness_type}} mistakes",
  "explanation": "Brief explanation of common {{weakness_type}} mistakes",
  "examples": ["Example 1", "Example 2", "Example 3"]
}'
);

-- Create RPC function for random vocabulary selection
CREATE OR REPLACE FUNCTION get_random_vocabulary(
  user_id_param BIGINT,
  exclude_id UUID,
  limit_count INT
)
RETURNS SETOF vocabulary AS $$
  SELECT * FROM vocabulary 
  WHERE user_id = user_id_param AND id != exclude_id 
  ORDER BY random() 
  LIMIT limit_count;
$$ LANGUAGE sql;