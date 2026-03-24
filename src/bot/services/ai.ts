import { GoogleGenAI } from '@google/genai'
import { config } from '../../config.js'

// Correct initialization according to @google/genai documentation
const genAI = new GoogleGenAI({ apiKey: config.geminiApiKey })

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
  const chat = genAI.chats.create({
    model: 'gemini-2.5-pro',
    config: {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
    history: chatHistory.map(item => ({
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
    })),
  })

  // Prepare current turn parts
  const messageParts: any[] = []

  if (input.text) {
    messageParts.push({ text: input.text })
  }

  if (input.audioBase64) {
    messageParts.push({
      inlineData: {
        mimeType: 'audio/ogg; codecs=opus',
        data: input.audioBase64,
      },
    })
  }

  const result = await chat.sendMessage({
    message: messageParts,
  })

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
  const chat = genAI.chats.create({
    model: 'gemini-2.5-pro',
    config: {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
    history: chatHistory.map(item => ({
      role: item.role,
      parts: item.parts.map(p => ({ text: p.text || '' })),
    })),
  })

  const triggerMessage = 'Please perform the conversation analysis according to your system instructions and return only JSON.'
  const result = await chat.sendMessage({
    message: triggerMessage,
  })

  const responseText = result.text || '{}'

  try {
    // Robust parsing: extract JSON from markdown or mixed text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    const cleanedText = jsonMatch ? jsonMatch[0] : responseText
    return JSON.parse(cleanedText)
  }
  catch (e) {
    console.error('Failed to parse Gemini post-analysis output:', e, 'Raw output:', responseText)
    return {
      feedback: 'Failed to analyze the conversation.',
      mistakes: [],
      new_words: [],
    }
  }
}
