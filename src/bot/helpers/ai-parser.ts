/**
 * Utility for parsing and validating AI responses using valibot.
 * Provides schema validation for structured AI outputs.
 */
import * as v from 'valibot'

// Schema for mistake details in post-analysis
const MistakeDetailSchema = v.object({
  original: v.string(),
  correction: v.string(),
  explanation: v.string(),
  type: v.pipe(
    v.string(),
    v.transform((input) => input.charAt(0).toUpperCase() + input.slice(1).toLowerCase()),
    v.picklist(['Grammar', 'Vocabulary', 'Punctuation', 'Spelling'])
  ),
})

// Schema for new words in post-analysis
const NewWordSchema = v.object({
  word: v.string(),
  translation: v.string(),
})

// Schema for post-analysis result
export const PostAnalysisResultSchema = v.object({
  feedback: v.string(),
  mistakes: v.array(MistakeDetailSchema),
  new_words: v.array(NewWordSchema),
})

// Schema for placement test result
export const PlacementTestResultSchema = v.object({
  level: v.picklist(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  feedback: v.string(),
})

// Schema for progress report
export const ProgressReportSchema = v.object({
  mainWeaknesses: v.array(v.string()),
  advice: v.string(),
  readyForLevelUp: v.optional(v.boolean()),
})

// Schema for grammar rule explanation
export const GrammarRuleSchema = v.object({
  topic: v.string(),
  explanation: v.string(),
  examples: v.array(v.string()),
})

// Schema for grammar quiz
export const GrammarQuizSchema = v.object({
  question: v.string(),
  options: v.array(v.string()),
  correct_index: v.number(),
  explanation: v.string(),
})

// Types inferred from schemas
export type PostAnalysisResult = v.InferOutput<typeof PostAnalysisResultSchema>
export type PlacementTestResult = v.InferOutput<typeof PlacementTestResultSchema>
export type ProgressReport = v.InferOutput<typeof ProgressReportSchema>
export type MistakeDetail = v.InferOutput<typeof MistakeDetailSchema>
export type GrammarRule = v.InferOutput<typeof GrammarRuleSchema>
export type GrammarQuiz = v.InferOutput<typeof GrammarQuizSchema>

/**
 * Clean markdown wrappers that LLMs sometimes add around JSON.
 */
export function cleanJsonResponse(rawText: string): string {
  return rawText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
}

/**
 * Parse and validate post-analysis result from AI response.
 * Returns a default fallback if parsing or validation fails.
 */
export function parsePostAnalysisResult(rawText: string): PostAnalysisResult {
  const fallback: PostAnalysisResult = {
    feedback: 'Analysis could not be completed due to a technical error. Please continue practicing!',
    mistakes: [],
    new_words: [],
  }

  try {
    const cleaned = cleanJsonResponse(rawText)
    const parsed = JSON.parse(cleaned)
    return v.parse(PostAnalysisResultSchema, parsed)
  } catch (error) {
    console.error('Failed to parse post-analysis result:', error, 'Raw output:', rawText)
    return fallback
  }
}

/**
 * Parse and validate placement test result from AI response.
 * Returns null if parsing or validation fails.
 */
export function parsePlacementTestResult(rawText: string): PlacementTestResult | null {
  try {
    const cleaned = cleanJsonResponse(rawText)
    const parsed = JSON.parse(cleaned)
    return v.parse(PlacementTestResultSchema, parsed)
  } catch (error) {
    console.error('Failed to parse placement test result:', error, 'Raw output:', rawText)
    return null
  }
}

/**
 * Parse and validate progress report from AI response.
 * Returns a default fallback if parsing or validation fails.
 */
export function parseProgressReport(rawText: string): ProgressReport {
  const fallback: ProgressReport = {
    mainWeaknesses: [],
    advice: 'Unable to generate report at this time.',
  }

  try {
    const cleaned = cleanJsonResponse(rawText)
    const parsed = JSON.parse(cleaned)
    return v.parse(ProgressReportSchema, parsed)
  } catch (error) {
    console.error('Failed to parse progress report:', error, 'Raw output:', rawText)
    return fallback
  }
}

/**
 * Parse and validate grammar rule from AI response.
 * Returns null if parsing or validation fails.
 */
export function parseGrammarRule(rawText: string): GrammarRule | null {
  try {
    const cleaned = cleanJsonResponse(rawText)
    const parsed = JSON.parse(cleaned)
    return v.parse(GrammarRuleSchema, parsed)
  } catch (error) {
    console.error('Failed to parse grammar rule:', error, 'Raw output:', rawText)
    return null
  }
}

/**
 * Parse and validate grammar quiz from AI response.
 * Returns null if parsing or validation fails.
 */
export function parseGrammarQuiz(rawText: string): GrammarQuiz | null {
  try {
    const cleaned = cleanJsonResponse(rawText)
    const parsed = JSON.parse(cleaned)
    return v.parse(GrammarQuizSchema, parsed)
  } catch (error) {
    console.error('Failed to parse grammar quiz:', error, 'Raw output:', rawText)
    return null
  }
}
