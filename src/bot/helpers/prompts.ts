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
 */
export async function getAnalysisPrompt(
  toneCode: string, 
  targetLanguageName: string, 
  uiLanguageName: string
): Promise<string> {
  const [basePrompt, tonePrompt] = await Promise.all([
    getPromptByCode('post_analysis'),
    getPromptByCode(toneCode)
  ])
  
  return (basePrompt || '')
    .replace(/\{\{LANGUAGE\}\}/g, targetLanguageName)
    .replace(/\{\{UI_LANGUAGE\}\}/g, uiLanguageName) + "\n\n" + (tonePrompt || '')
}
