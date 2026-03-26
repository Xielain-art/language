import { GoogleGenAI } from '@google/genai'
import OpenAI from 'openai'
import { config } from '../../config.js'

// Custom Error for Model Overloaded
export class ModelOverloadedError extends Error {
  constructor(message: string = 'Model is overloaded') {
    super(message)
    this.name = 'ModelOverloadedError'
  }
}

// Shared Interfaces
export interface GeminiInput {
  text?: string
  audioBase64?: string
}

export interface ContentPart {
  text?: string
  inlineData?: {
    mimeType: string
    data: string
  }
}

export interface ContentItem {
  role: 'user' | 'model'
  parts: ContentPart[]
}

export interface MistakeDetail {
  original: string
  correction: string
  explanation: string
  type: 'Grammar' | 'Vocabulary' | 'Punctuation' | 'Spelling'
}

export interface PostAnalysisResult {
  feedback: string
  mistakes: MistakeDetail[]
  new_words: Array<{ word: string, translation: string }>
}

// AI Provider Interface
export interface IAIProvider {
  ask(input: GeminiInput, chatHistory: ContentItem[], systemInstruction: string): Promise<string>
  askForAnalysis(chatHistory: ContentItem[], systemInstruction: string): Promise<PostAnalysisResult>
  askStream(input: GeminiInput, chatHistory: ContentItem[], systemInstruction: string): AsyncGenerator<string, void, unknown>
}

// Gemini Provider
class GeminiProvider implements IAIProvider {
  private genAI: GoogleGenAI
  private modelCode: string

  constructor(modelCode: string = 'gemini-2.5-flash-lite') {
    this.genAI = new GoogleGenAI({ apiKey: config.geminiApiKey })
    this.modelCode = modelCode
  }

  private prepareHistory(chatHistory: ContentItem[]): any[] {
    return chatHistory.map(item => ({
      role: item.role,
      parts: item.parts.map(p => {
        if (p.inlineData) {
          return {
            inlineData: {
              mimeType: p.inlineData.mimeType,
              data: p.inlineData.data,
            },
          }
        }
        return { text: p.text || '' }
      }),
    }))
  }

  async ask(input: GeminiInput, chatHistory: ContentItem[], systemInstruction: string): Promise<string> {
    try {
      const history = this.prepareHistory(chatHistory)

      const messageParts: any[] = []
      if (input.text) messageParts.push({ text: input.text })
      if (input.audioBase64) {
        messageParts.push({
          inlineData: {
            mimeType: 'audio/ogg; codecs=opus',
            data: input.audioBase64,
          },
        })
      }

      const allContents = [
        ...history,
        { role: 'user', parts: messageParts }
      ]

      const result = await this.genAI.models.generateContent({
        model: this.modelCode,
        contents: allContents as any,
        config: {
          systemInstruction: { parts: [{ text: systemInstruction }] },
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      })

      const responseText = result.text?.trim()
      
      if (!responseText) {
        return "I'm sorry, I can't respond to that message. Let's talk about something else! 🔄"
      }

      return responseText
    } catch (error: any) {
      console.error('Gemini API Error:', error.message, error.stack)
      if (error.message?.includes('503') || error.message?.includes('High demand') || error.message?.includes('overloaded')) {
        throw new ModelOverloadedError(error.message)
      }
      throw error
    }
  }

  async askForAnalysis(chatHistory: ContentItem[], systemInstruction: string): Promise<PostAnalysisResult> {
    try {
      const history = chatHistory.map(item => ({
        role: item.role,
        parts: item.parts.map(p => ({ text: p.text || '' })),
      }))

      const triggerMessage = 'Analysis start.'

      const responseSchema = {
        type: 'OBJECT',
        properties: {
          feedback: { type: 'STRING' },
          mistakes: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                original: { type: 'STRING' },
                correction: { type: 'STRING' },
                explanation: { type: 'STRING' },
                type: { 
                  type: 'STRING',
                  enum: ['Grammar', 'Vocabulary', 'Punctuation', 'Spelling']
                },
              },
              required: ['original', 'correction', 'explanation', 'type'],
            },
          },
          new_words: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                word: { type: 'STRING' },
                translation: { type: 'STRING' },
              },
              required: ['word', 'translation'],
            },
          },
        },
        required: ['feedback', 'mistakes', 'new_words'],
      }

      const result = await this.genAI.models.generateContent({
        model: this.modelCode,
        contents: [...history, { role: 'user', parts: [{ text: triggerMessage }] }] as any,
        config: {
          systemInstruction: { parts: [{ text: systemInstruction }] },
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: responseSchema as any,
        },
      })

      const responseText = result.text || '{}'

      try {
        return JSON.parse(responseText)
      } catch (e) {
        console.error('Failed to parse Gemini structured output:', e, 'Raw output:', responseText)
        return {
          feedback: 'Analysis could not be completed due to a technical error. Please continue practicing!',
          mistakes: [],
          new_words: [],
        }
      }
    } catch (error: any) {
      console.error('Gemini API Error (analysis):', error.message, error.stack)
      if (error.message?.includes('503') || error.message?.includes('High demand') || error.message?.includes('overloaded')) {
        throw new ModelOverloadedError(error.message)
      }
      return {
        feedback: 'Analysis failed due to an API error. Don\'t worry, keep up the good work!',
        mistakes: [],
        new_words: [],
      }
    }
  }

  async *askStream(input: GeminiInput, chatHistory: ContentItem[], systemInstruction: string): AsyncGenerator<string, void, unknown> {
    try {
      const history = this.prepareHistory(chatHistory)

      const messageParts: any[] = []
      if (input.text) messageParts.push({ text: input.text })
      if (input.audioBase64) {
        messageParts.push({
          inlineData: {
            mimeType: 'audio/ogg; codecs=opus',
            data: input.audioBase64,
          },
        })
      }

      const allContents = [
        ...history,
        { role: 'user', parts: messageParts }
      ]

      const result = await this.genAI.models.generateContentStream({
        model: this.modelCode,
        contents: allContents as any,
        config: {
          systemInstruction: { parts: [{ text: systemInstruction }] },
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      })

      for await (const chunk of result) {
        const text = chunk.text
        if (text) {
          yield text
        }
      }
    } catch (error: any) {
      console.error('Gemini API Error (stream):', error.message, error.stack)
      if (error.message?.includes('503') || error.message?.includes('High demand') || error.message?.includes('overloaded')) {
        throw new ModelOverloadedError(error.message)
      }
      throw error
    }
  }
}

// Qwen Provider (OpenAI-compatible)
class QwenProvider implements IAIProvider {
  private client: OpenAI
  private modelCode: string

  constructor(modelCode: string = 'qwen-plus') {
    this.client = new OpenAI({
      apiKey: config.qwenApiKey,
      baseURL: config.qwenBaseUrl,
    })
    this.modelCode = modelCode
  }

  async ask(input: GeminiInput, chatHistory: ContentItem[], systemInstruction: string): Promise<string> {
    try {
      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemInstruction },
      ]

      for (const item of chatHistory) {
        if (item.role === 'user') {
          const content = item.parts.map(p => p.text || '').join(' ')
          if (content) messages.push({ role: 'user', content })
        } else {
          const content = item.parts.map(p => p.text || '').join(' ')
          if (content) messages.push({ role: 'assistant', content })
        }
      }

      const userContent = input.text || ''
      if (userContent) {
        messages.push({ role: 'user', content: userContent })
      }

      const completion = await this.client.chat.completions.create({
        model: this.modelCode,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      })

      const responseText = completion.choices[0]?.message?.content?.trim()
      
      if (!responseText) {
        return "I'm sorry, I can't respond to that message. Let's talk about something else! 🔄"
      }

      return responseText
    } catch (error: any) {
      console.error('Qwen API Error:', error.message, error.stack)
      if (error.status === 503 || error.status === 429 || error.message?.includes('overloaded')) {
        throw new ModelOverloadedError(error.message)
      }
      throw error
    }
  }

  async askForAnalysis(chatHistory: ContentItem[], systemInstruction: string): Promise<PostAnalysisResult> {
    try {
      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemInstruction + '\n\nRespond ONLY with valid JSON matching this structure: {"feedback": string, "mistakes": [{"original": string, "correction": string, "explanation": string, "type": "Grammar"|"Vocabulary"|"Punctuation"|"Spelling"}], "new_words": [{"word": string, "translation": string}]}' },
      ]

      for (const item of chatHistory) {
        if (item.role === 'user') {
          const content = item.parts.map(p => p.text || '').join(' ')
          if (content) messages.push({ role: 'user', content })
        } else {
          const content = item.parts.map(p => p.text || '').join(' ')
          if (content) messages.push({ role: 'assistant', content })
        }
      }

      messages.push({ role: 'user', content: 'Analysis start.' })

      const completion = await this.client.chat.completions.create({
        model: this.modelCode,
        messages,
        temperature: 0.1,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      })

      const responseText = completion.choices[0]?.message?.content || '{}'

      try {
        // Clean markdown wrappers that LLMs sometimes add
        const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        return JSON.parse(cleanJson)
      } catch (e) {
        console.error('Failed to parse Qwen structured output:', e, 'Raw output:', responseText)
        return {
          feedback: 'Analysis could not be completed due to a technical error. Please continue practicing!',
          mistakes: [],
          new_words: [],
        }
      }
    } catch (error: any) {
      console.error('Qwen API Error (analysis):', error.message, error.stack)
      if (error.status === 503 || error.status === 429 || error.message?.includes('overloaded')) {
        throw new ModelOverloadedError(error.message)
      }
      return {
        feedback: 'Analysis failed due to an API error. Don\'t worry, keep up the good work!',
        mistakes: [],
        new_words: [],
      }
    }
  }

  async *askStream(input: GeminiInput, chatHistory: ContentItem[], systemInstruction: string): AsyncGenerator<string, void, unknown> {
    try {
      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemInstruction },
      ]

      for (const item of chatHistory) {
        if (item.role === 'user') {
          const content = item.parts.map(p => p.text || '').join(' ')
          if (content) messages.push({ role: 'user', content })
        } else {
          const content = item.parts.map(p => p.text || '').join(' ')
          if (content) messages.push({ role: 'assistant', content })
        }
      }

      const userContent = input.text || ''
      if (userContent) {
        messages.push({ role: 'user', content: userContent })
      }

      const stream = await this.client.chat.completions.create({
        model: this.modelCode,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: true,
      })

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          yield content
        }
      }
    } catch (error: any) {
      console.error('Qwen API Error (stream):', error.message, error.stack)
      if (error.status === 503 || error.status === 429 || error.message?.includes('overloaded')) {
        throw new ModelOverloadedError(error.message)
      }
      throw error
    }
  }
}

// Factory Function - dynamically detect provider from database
export async function getAIProvider(modelCode: string): Promise<IAIProvider> {
  const { getModelProvider } = await import('#root/bot/services/ai-models.js')
  const provider = await getModelProvider(modelCode)
  
  switch (provider) {
    case 'qwen':
    case 'deepseek':
    case 'openai':
      return new QwenProvider(modelCode)
    case 'gemini':
    default:
      return new GeminiProvider(modelCode)
  }
}

// Get placement test provider (uses dedicated model from database)
export async function getPlacementTestProvider(): Promise<IAIProvider> {
  // Read from database settings, fallback to config, then default
  const { getPlacementTestModel } = await import('#root/bot/services/bot-settings.js')
  const placementModel = await getPlacementTestModel() || config.placementTestModel || 'qwen-plus'
  return getAIProvider(placementModel)
}

// Available Models
export const AI_MODELS = [
  { code: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash' },
  { code: 'qwen-plus', name: 'Qwen Plus' },
]

// AI Progress Report Interface
export interface ProgressReport {
  mainWeaknesses: string[]
  advice: string
}

// AI Progress Report Function
export async function generateProgressReport(
  mistakes: Array<{ type: string; original_text: string; corrected_text: string }>,
  uiLanguageName: string,
  modelCode: string = 'gemini-2.5-flash-lite'
): Promise<ProgressReport> {
  try {
    const mistakesText = mistakes
      .slice(0, 50)
      .map(m => `- ${m.type}: "${m.original_text}" → "${m.corrected_text}"`)
      .join('\n')

    const { getProgressReportPrompt } = await import('#root/bot/helpers/prompts.js')
    const systemInstruction = await getProgressReportPrompt(uiLanguageName)

    const provider = await getAIProvider(modelCode)
    const response = await provider.ask(
      { text: mistakesText },
      [{ role: 'user', parts: [{ text: mistakesText }] }],
      systemInstruction
    )

    try {
      const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      return JSON.parse(cleanJson)
    } catch (parseError) {
      console.error('Failed to parse progress report:', parseError)
      return {
        mainWeaknesses: [],
        advice: 'Unable to generate report at this time.'
      }
    }
  } catch (error) {
    console.error('Error generating progress report:', error)
    return {
      mainWeaknesses: [],
      advice: 'Unable to generate report at this time.'
    }
  }
}

export async function generateMegaReport(
  reports: Array<{ weaknesses: string[]; advice: string; created_at: string }>,
  uiLanguageName: string,
  modelCode: string = 'gemini-2.5-flash-lite'
): Promise<ProgressReport> {
  try {
    const reportsText = reports
      .map(r => `[${r.created_at}] Weaknesses: ${r.weaknesses.join(', ')}. Advice: ${r.advice}`)
      .join('\n\n')

    const { getMegaReportPrompt } = await import('#root/bot/helpers/prompts.js')
    const systemInstruction = await getMegaReportPrompt(uiLanguageName)

    const provider = await getAIProvider(modelCode)
    const response = await provider.ask(
      { text: reportsText },
      [{ role: 'user', parts: [{ text: reportsText }] }],
      systemInstruction
    )

    try {
      const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      return JSON.parse(cleanJson)
    } catch (parseError) {
      console.error('Failed to parse mega report:', parseError)
      return {
        mainWeaknesses: [],
        advice: 'Unable to generate mega report at this time.'
      }
    }
  } catch (error) {
    console.error('Error generating mega report:', error)
    return {
      mainWeaknesses: [],
      advice: 'Unable to generate mega report at this time.'
    }
  }
}
