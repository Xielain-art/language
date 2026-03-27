import { getPromptByCode } from '#root/services/supabase.js'

/**
 * Формирует системную инструкцию, загружая текст из БД и заменяя плейсхолдеры.
 * Все логика адаптации хранится в базе данных.
 */
export async function getSystemInstruction(
  toneCode: string, 
  targetLanguage: string, 
  uiLanguageName: string = 'English', 
  userLevel: string = 'B1'
): Promise<string> {
  try {
    const promptText = await getPromptByCode(toneCode)
    
    if (!promptText) {
      return `You are a helpful ${targetLanguage} tutor. User level: ${userLevel}.`
    }

    return promptText
      .replace(/\{\{LANGUAGE\}\}/g, targetLanguage)
      .replace(/\{\{UI_LANGUAGE\}\}/g, uiLanguageName)
      .replace(/\{\{LEVEL\}\}/g, userLevel)
  } catch (error) {
    console.error('Error getting system instruction:', error)
    return `You are a helpful ${targetLanguage} tutor.`
  }
}

/**
 * Формирует промпт для анализа, загружая текст из БД и заменяя плейсхолдеры.
 * Использует отдельные промпты для анализа, а не разговорные тона.
 */
export async function getAnalysisPrompt(
  analysisToneCode: string, 
  targetLanguageName: string, 
  uiLanguageName: string
): Promise<string> {
  // Загружаем базовый промпт анализа и тон анализа
  const [basePrompt, tonePrompt] = await Promise.all([
    getPromptByCode('post_analysis'),
    getPromptByCode(`analysis_${analysisToneCode}`)
  ])
  
  // Получаем инструкцию тона или используем дефолтную
  const toneInstruction = tonePrompt || 'Write feedback in a balanced, helpful tone.'
  
  // Заменяем плейсхолдер тона в базовом промпте
  return (basePrompt || '')
    .replace(/\{\{LANGUAGE\}\}/g, targetLanguageName)
    .replace(/\{\{UI_LANGUAGE\}\}/g, uiLanguageName)
    .replace(/\{\{ANALYSIS_TONE_INSTRUCTION\}\}/g, toneInstruction)
}

export async function getProgressReportPrompt(uiLanguageName: string): Promise<string> {
  const promptText = await getPromptByCode('progress_report') || 'Analyze mistakes. Write in {{UI_LANGUAGE}}. Return JSON: {"mainWeaknesses": [], "advice": ""}'
  return promptText.replace(/\{\{UI_LANGUAGE\}\}/g, uiLanguageName)
}

export async function getMegaReportPrompt(uiLanguageName: string, userLevel: string = 'B1'): Promise<string> {
  const promptText = await getPromptByCode('mega_report') || 'Analyze past reports. Write in {{UI_LANGUAGE}}. Evaluate if the user has outgrown level {{LEVEL}}. If yes, set readyForLevelUp to true. Return JSON: {"mainWeaknesses": [], "advice": "", "readyForLevelUp": false}'
  return promptText
    .replace(/\{\{UI_LANGUAGE\}\}/g, uiLanguageName)
    .replace(/\{\{LEVEL\}\}/g, userLevel)
}
