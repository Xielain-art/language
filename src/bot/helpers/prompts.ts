import { getPromptByCode } from '#root/services/supabase.js'

/**
 * Формирует системную инструкцию, загружая текст из БД и заменяя плейсхолдеры.
 */
export async function getSystemInstruction(
  toneCode: string, 
  targetLanguage: string, 
  uiLanguageName: string = 'English', 
  userLevel: string = 'B1'
): Promise<string> {
  try {
    // 1. Загружаем основной текст промпта из БД по коду (friendly, strict, и т.д.)
    const promptText = await getPromptByCode(toneCode)
    
    if (!promptText) {
      // Фолбек, если в базе пусто
      return `You are a helpful ${targetLanguage} tutor. User level: ${userLevel}.`
    }

    // 2. Выполняем подстановку переменных
    let prompt = promptText
      .replace(/\{\{LANGUAGE\}\}/g, targetLanguage)
      .replace(/\{\{UI_LANGUAGE\}\}/g, uiLanguageName)
    
    // 3. Добавляем CEFR-адаптацию (динамически)
    prompt += `\n\nCRITICAL: The user's level is ${userLevel}. Adjust your vocabulary, sentence structure, and grammar to be strictly appropriate for this level. Use simpler words for A1-A2. Avoid complex idioms for beginners.`
    
    // 4. Добавляем специфику для новичков (A1-A2)
    if (userLevel === 'A1' || userLevel === 'A2') {
      prompt += `\n\nIMPORTANT FOR BEGINNERS: When using potentially difficult or new words, provide their translation in ${uiLanguageName} in brackets immediately after the word. Example: "I like to explore (исследовать) new places."`
    }
    
    return prompt
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
