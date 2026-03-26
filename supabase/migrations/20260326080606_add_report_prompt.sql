INSERT INTO prompts (code, type, label_ru, label_en, prompt_text)
VALUES (
  'progress_report', 'system', 'Анализ ошибок', 'Mistakes Analysis', 
  'Analyze the following list of language learning mistakes. Identify 2 main weak areas and provide specific advice on how to improve. CRITICAL: Write your response ONLY in {{UI_LANGUAGE}}. Return ONLY valid JSON with this exact structure: {"mainWeaknesses": ["weakness 1", "weakness 2"], "advice": "detailed advice (2-3 sentences)"}'
) ON CONFLICT (code) DO UPDATE SET prompt_text = EXCLUDED.prompt_text;

INSERT INTO prompts (code, type, label_ru, label_en, prompt_text)
VALUES (
  'mega_report', 'system', 'Мега-отчет', 'Mega Report', 
  'Analyze the following past language learning reports for a user. Identify the overall progress, persistent weaknesses, and provide a comprehensive learning strategy. CRITICAL: Write your response ONLY in {{UI_LANGUAGE}}. Return ONLY valid JSON with this exact structure: {"mainWeaknesses": ["persistent weakness 1"], "advice": "detailed mega-advice (3-5 sentences)"}'
) ON CONFLICT (code) DO UPDATE SET prompt_text = EXCLUDED.prompt_text;
