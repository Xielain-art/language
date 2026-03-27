-- Create separate analysis tone prompts that only modify feedback style
-- These prompts will be used for post-analysis, not conversation tones

-- First, let's create analysis-specific tones
INSERT INTO prompts (code, type, label_ru, label_en, prompt_text) VALUES
('analysis_friendly', 'analysis_tone', 'Дружелюбный', 'Friendly', 'Write your feedback in a warm, encouraging, and supportive tone. Praise the user for their efforts and progress.'),
('analysis_strict', 'analysis_tone', 'Строгий', 'Strict', 'Write your feedback in a professional, direct, and demanding tone. Focus heavily on areas needing improvement.'),
('analysis_detailed', 'analysis_tone', 'Детальный', 'Detailed', 'Write your feedback in a thorough, analytical manner. Provide specific examples and detailed explanations.')
ON CONFLICT (code) DO NOTHING;

-- Update the post_analysis prompt to NOT concatenate with tone prompts
-- Instead, include a placeholder for tone-specific instructions
UPDATE prompts SET prompt_text = 'Analyze the conversation history above. You MUST return a STRICT JSON object (and nothing else, no markdown formatting) with the following structure:
{
  "feedback": "A short and helpful overall feedback about the user''s {{LANGUAGE}} level and fluency in this dialogue. {{ANALYSIS_TONE_INSTRUCTION}}",
  "mistakes": [
    {
      "original": "exactly what the user wrote",
      "correction": "corrected version of the text",
      "explanation": "short explanation of why this is a mistake, written strictly in {{UI_LANGUAGE}}",
      "type": "Grammar" | "Vocabulary" | "Punctuation" | "Spelling"
    }
  ],
  "new_words": [
    {
      "word": "{{LANGUAGE}} word or phrase from the context",
      "translation": "{{UI_LANGUAGE}} translation"
    }
  ]
}

=== CRITICAL RULES ===
1. ALL explanations and feedback MUST be in {{UI_LANGUAGE}}.
2. DO NOT use markdown code blocks (like ```json). Return only raw text starting with { and ending with }.
3. Classify mistakes strictly into the provided categories.
4. Feedback must be written in the style specified by the analysis tone.'
WHERE code = 'post_analysis' AND type = 'system';