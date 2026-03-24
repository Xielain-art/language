import { getPromptByCode } from '#root/services/supabase.js'

/**
 * Formats the system instruction by replacing placeholders with the target language.
 */
export async function getSystemInstruction(toneCode: string, targetLanguage: string): Promise<string> {
  const promptText = await getPromptByCode(toneCode)
  
  if (!promptText) {
    return `You are a helpful ${targetLanguage} tutor. Correct mistakes and maintain a natural conversation.`
  }

  return promptText
    .replace(/\{\{LANGUAGE\}\}/g, targetLanguage)
    .replace(/English/g, targetLanguage)
}

/**
 * Formats the analysis prompt with specialized persona instructions.
 */
export async function getAnalysisPrompt(toneCode: string, targetLanguage: string): Promise<string> {
  let analysisPrompt = await getPromptByCode('post_analysis') || ''
  const tonePrompt = await getPromptByCode(toneCode)

  if (tonePrompt) {
    const localizedTone = tonePrompt
      .replace(/\{\{LANGUAGE\}\}/g, targetLanguage)
      .replace(/English/g, targetLanguage)
      
    analysisPrompt += `\n\nCRITICAL RULE FOR FEEDBACK: Your "feedback" string MUST be written in Russian BUT adopting the following persona/tone:\n${localizedTone}`
  }

  return analysisPrompt
}
