/**
 * Grammar Service
 * Handles all AI-related logic for grammar features
 */
import { getAIProvider } from '#root/bot/services/ai.js'
import { getPromptByCode } from '#root/services/supabase.js'
import { parseGrammarRule, parseGrammarQuiz, type GrammarRule, type GrammarQuiz } from '#root/bot/helpers/ai-parser.js'

/**
 * Replace placeholders in prompt template
 */
function replacePromptPlaceholders(
  prompt: string,
  targetLanguage: string,
  userLevel: string,
  uiLanguage: string,
  extraVars?: Record<string, string>
): string {
  let result = prompt
    .replace(/\{\{target_language\}\}/g, targetLanguage)
    .replace(/\{\{user_level\}\}/g, userLevel)
    .replace(/\{\{ui_language\}\}/g, uiLanguage)
  
  if (extraVars) {
    for (const [key, value] of Object.entries(extraVars)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    }
  }
  
  return result
}

/**
 * Generate a grammar rule explanation
 */
export async function generateGrammarRule(
  targetLanguage: string,
  userLevel: string,
  uiLanguage: string,
  aiModel: string
): Promise<GrammarRule | null> {
  try {
    const promptTemplate = await getPromptByCode('grammar_explain')
    if (!promptTemplate) {
      console.error('Grammar explain prompt not found')
      return null
    }

    const prompt = replacePromptPlaceholders(promptTemplate, targetLanguage, userLevel, uiLanguage)
    const aiProvider = await getAIProvider(aiModel)
    const response = await aiProvider.ask({ text: prompt }, [], 'You are a helpful language tutor.')

    return parseGrammarRule(response)
  } catch (error) {
    console.error('Error generating grammar rule:', error)
    return null
  }
}

/**
 * Generate a grammar quiz
 */
export async function generateGrammarQuiz(
  targetLanguage: string,
  userLevel: string,
  uiLanguage: string,
  aiModel: string
): Promise<GrammarQuiz | null> {
  try {
    const promptTemplate = await getPromptByCode('grammar_quiz')
    if (!promptTemplate) {
      console.error('Grammar quiz prompt not found')
      return null
    }

    const prompt = replacePromptPlaceholders(promptTemplate, targetLanguage, userLevel, uiLanguage)
    const aiProvider = await getAIProvider(aiModel)
    const response = await aiProvider.ask({ text: prompt }, [], 'You are a helpful language tutor.')

    return parseGrammarQuiz(response)
  } catch (error) {
    console.error('Error generating grammar quiz:', error)
    return null
  }
}

/**
 * Generate weakness analysis
 */
export async function generateWeaknessAnalysis(
  targetLanguage: string,
  userLevel: string,
  uiLanguage: string,
  weaknessType: string,
  mistakeCount: number,
  aiModel: string
): Promise<GrammarRule | null> {
  try {
    const promptTemplate = await getPromptByCode('grammar_weakness')
    if (!promptTemplate) {
      console.error('Grammar weakness prompt not found')
      return null
    }

    const prompt = replacePromptPlaceholders(promptTemplate, targetLanguage, userLevel, uiLanguage, {
      weakness_type: weaknessType,
      mistake_count: String(mistakeCount)
    })
    
    const aiProvider = await getAIProvider(aiModel)
    const response = await aiProvider.ask({ text: prompt }, [], 'You are a helpful language tutor.')

    return parseGrammarRule(response)
  } catch (error) {
    console.error('Error generating weakness analysis:', error)
    return null
  }
}