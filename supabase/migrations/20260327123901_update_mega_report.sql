UPDATE prompts
SET prompt_text = 'Analyze the following past language learning reports for a user. Identify the overall progress, persistent weaknesses, and provide a comprehensive learning strategy. Evaluate if the user has outgrown level {{LEVEL}}. If yes, set readyForLevelUp to true. CRITICAL: Write your response ONLY in {{UI_LANGUAGE}}. Return ONLY valid JSON with this exact structure: {"mainWeaknesses": ["persistent weakness 1"], "advice": "detailed mega-advice (3-5 sentences)", "readyForLevelUp": false}'
WHERE code = 'mega_report';
