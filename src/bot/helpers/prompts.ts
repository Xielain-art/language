import { getPromptByCode } from '#root/services/supabase.js'

/**
 * Formats the system instruction by replacing placeholders with the target language.
 */
export async function getSystemInstruction(toneCode: string, targetLanguage: string): Promise<string> {
  try {
    const promptText = await getPromptByCode(toneCode)
    
    if (!promptText) {
      return `You are a helpful ${targetLanguage} tutor. Correct mistakes and maintain a natural conversation.`
    }

    return promptText
      .replace(/\{\{LANGUAGE\}\}/g, targetLanguage)
      .replace(/English/g, targetLanguage)
  } catch (error) {
    console.error('Error getting system instruction:', error)
    return `You are a helpful ${targetLanguage} tutor. Correct mistakes and maintain a natural conversation.`
  }
}

/**
 * Formats the analysis prompt with specialized persona instructions and dynamic language support.
 */
export async function getAnalysisPrompt(
  toneCode: string, 
  targetLanguageName: string, 
  uiLanguageName: string
): Promise<string> {
  try {
    let basePrompt = await getPromptByCode('post_analysis') || 'You are a language tutor. Analyze the conversation.'
    const tonePrompt = await getPromptByCode(toneCode)

    const instruction = `
Perform a thorough analysis of the preceding conversation history. 
Identify the user's grammatical mistakes in ${targetLanguageName} and provide helpful feedback.
Pick out 3-5 useful new vocabulary words or phrases from the conversation that the user could learn.

CRITICAL LANGUAGE RULES:
1. Your "feedback" string MUST be written in ${uiLanguageName}.
2. For the "new_words" array, each "word" must be in ${targetLanguageName} and its "translation" must be in ${uiLanguageName}.
3. Adopt the following persona/tone for your feedback:
${tonePrompt || 'Friendly and helpful.'}
`

    return basePrompt + "\n\n" + instruction
  } catch (error) {
    console.error('Error getting analysis prompt:', error)
    return `You are a language tutor. Analyze the conversation and provide feedback in ${uiLanguageName}.`
  }
}
