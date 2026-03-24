import { GoogleGenAI } from '@google/genai'
import { config } from '../../config.js'

// Initialize the new Google Gen AI SDK
const ai = new GoogleGenAI({ apiKey: config.vertexAiKey })

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
  // Map our internal chat history to the shape the SDK expects (which usually is very similar)
  const formattedHistory = chatHistory.map(item => ({
    role: item.role,
    parts: item.parts.map((p: any) => p),
  }))

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction,
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
    // history is officially supported in the new SDK
    history: formattedHistory,
  })

  // Prepare current turn parts
  const parts: any[] = []

  if (input.text) {
    parts.push(input.text)
  }

  if (input.audioBase64) {
    parts.push({
      inlineData: {
        // As requested by the architecture shift
        mimeType: 'audio/ogg; codecs=opus',
        data: input.audioBase64,
      },
    })
  }

  const result = await chat.sendMessage({ message: parts })
  return result.text || ''
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
  const formattedHistory = chatHistory.map(item => ({
    role: item.role,
    parts: item.parts.map((p: any) => p),
  }))

  const responseSchema = {
    type: 'object',
    properties: {
      feedback: { type: 'string' },
      mistakes: {
        type: 'array',
        items: { type: 'string' },
      },
      new_words: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            word: { type: 'string' },
            translation: { type: 'string' },
          },
          required: ['word', 'translation'],
        },
      },
    },
    required: ['feedback', 'mistakes', 'new_words'],
  }

  const chat = ai.chats.create({
    model: 'gemini-1.5-flash-latest',
    config: {
      systemInstruction,
      temperature: 0.1, // Low temperature for consistent JSON
      responseMimeType: 'application/json',
      responseSchema,

    },
    // history is officially supported in the new SDK
    history: formattedHistory,
  })

  // Send the analysis request trigger
  const result = await chat.sendMessage({ message: 'Please perform the conversation analysis according to your system instructions.' })

  const responseText = result.text || '{}'

  try {
    return JSON.parse(responseText)
  }
  catch (e) {
    console.error('Failed to parse Gemini post-analysis output:', e)
    return {
      feedback: 'Failed to analyze the conversation.',
      mistakes: [],
      new_words: [],
    }
  }
}
