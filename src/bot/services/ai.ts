import { GoogleGenAI } from '@google/genai'
import { config } from '../../config.js'

// Correct initialization according to @google/genai documentation
const genAI = new (GoogleGenAI as any)({ apiKey: config.geminiApiKey })

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

/**
 * Ask Gemini a question based on user string/audio and history.
 */
export async function askGemini(
  input: GeminiInput,
  chatHistory: ContentItem[],
  systemInstruction: string,
): Promise<string> {
  try {
    const history = chatHistory.map(item => ({
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

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: allContents as any,
      config: {
        systemInstruction: { parts: [{ text: systemInstruction }] },
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    })

    const responseText = result.text?.trim()
    
    // Safety Fallback: Handle empty responses caused by AI safety filters
    if (!responseText) {
        return "I'm sorry, I can't respond to that message. Let's talk about something else! 🔄"
    }

    return responseText
  } catch (error: any) {
    console.error('Gemini API Error (askGemini):', error.message, error.stack)
    throw error
  }
}

export interface PostAnalysisResult {
  feedback: string
  mistakes: string[]
  new_words: Array<{ word: string, translation: string }>
}

/**
 * Run Gemini post-analysis on a chat history returning structured JSON.
 */
export async function askGeminiForAnalysis(
  chatHistory: ContentItem[],
  systemInstruction: string,
): Promise<PostAnalysisResult> {
  try {
    const history = chatHistory.map(item => ({
      role: item.role,
      parts: item.parts.map(p => ({ text: p.text || '' })),
    }))

    const triggerMessage = 'Analysis start.'

    // Define the schema for structured output (Guaranteed JSON)
    const responseSchema = {
      type: 'OBJECT',
      properties: {
        feedback: { type: 'STRING' },
        mistakes: {
          type: 'ARRAY',
          items: { type: 'STRING' },
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

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-lite',
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
    }
    catch (e) {
      console.error('Failed to parse Gemini structured output:', e, 'Raw output:', responseText)
      // Robust Fallback: Never crash the endChat process
      return {
        feedback: 'Analysis could not be completed due to a technical error. Please continue practicing!',
        mistakes: [],
        new_words: [],
      }
    }
  } catch (error: any) {
    console.error('Gemini API Error (askGeminiForAnalysis):', error.message, error.stack)
    // Graceful Fallback even if the API call itself fails
    return {
        feedback: 'Analysis failed due to an API error. Don\'t worry, keep up the good work!',
        mistakes: [],
        new_words: [],
    }
  }
}
