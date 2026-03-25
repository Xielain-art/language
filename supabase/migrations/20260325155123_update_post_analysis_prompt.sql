-- Update post_analysis prompt to match new MistakeDetail interface
-- This ensures the JSON structure returned by AI matches the TypeScript interface

UPDATE prompts SET prompt_text = 'Analyze the conversation history. Return STRICT JSON (no markdown, no ```json):

{
  "feedback": "Short feedback about user''s {{LANGUAGE}} level",
  "mistakes": [
    {
      "original": "user''s mistake text",
      "correction": "corrected text",
      "explanation": "explanation in {{UI_LANGUAGE}}",
      "type": "Grammar" | "Vocabulary" | "Punctuation" | "Spelling"
    }
  ],
  "new_words": [
    {
      "word": "{{LANGUAGE}} word",
      "translation": "{{UI_LANGUAGE}} translation"
    }
  ]
}

CRITICAL RULES:
- ALL explanations and feedback MUST be in {{UI_LANGUAGE}}
- Do NOT use English or {{LANGUAGE}} for explanations
- Return ONLY the JSON object, no other text'
WHERE code = 'post_analysis' AND type = 'system';
