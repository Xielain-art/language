import { getPromptByCode } from '#root/services/supabase.js'

/**
 * Formats the system instruction by replacing placeholders with the target language.
 */
export async function getSystemInstruction(toneCode: string, targetLanguage: string, uiLanguageName: string = 'English', userLevel: string = 'B1'): Promise<string> {
  try {
    const promptText = await getPromptByCode(toneCode)
    
    if (!promptText) {
      return `You are a helpful ${targetLanguage} tutor. Correct mistakes and maintain a natural conversation. CRITICAL: The user's level is ${userLevel}. Adjust your vocabulary, sentence structure, and grammar to be strictly appropriate for this level. Use simpler words for A1-A2. Avoid complex idioms for beginners.`
    }

    // Replace language placeholders
    let prompt = promptText
      .replace(/\{\{LANGUAGE\}\}/g, targetLanguage)
      .replace(/\{\{UI_LANGUAGE\}\}/g, uiLanguageName)
    
    // Add level-aware instruction
    prompt += `\n\nCRITICAL: The user's level is ${userLevel}. Adjust your vocabulary, sentence structure, and grammar to be strictly appropriate for this level. Use simpler words for A1-A2. Avoid complex idioms for beginners.`
    
    // CEFR adaptation for A1-A2: Add inline translations for difficult words
    if (userLevel === 'A1' || userLevel === 'A2') {
      prompt += `\n\nIMPORTANT FOR BEGINNERS: When using potentially difficult or new words, provide their translation in ${uiLanguageName} in brackets immediately after the word. Example: "I like to explore (исследовать) new places." This helps beginners understand without breaking the conversation flow.`
    }
    
    console.log(prompt)
    return prompt
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
=== CRITICAL LANGUAGE RULES (MUST FOLLOW) ===
ALL text in your response MUST be written in ${uiLanguageName}.
- The "feedback" field MUST be in ${uiLanguageName}.
- The "mistakes" array explanations MUST be in ${uiLanguageName}.
- The "new_words" translations MUST be in ${uiLanguageName}.
- Do NOT write any explanations in ${targetLanguageName} or English.

=== ANALYSIS TASK ===
Perform a thorough analysis of the preceding conversation history. 
Identify the user's grammatical mistakes in ${targetLanguageName} and provide helpful feedback.
Pick out 3-5 useful new vocabulary words or phrases from the conversation that the user could learn.

=== PERSONA/TONE ===
${tonePrompt || 'Friendly and helpful.'}
`

    return basePrompt + "\n\n" + instruction
  } catch (error) {
    console.error('Error getting analysis prompt:', error)
    return `You are a language tutor. Analyze the conversation and provide feedback in ${uiLanguageName}.`
  }
}
