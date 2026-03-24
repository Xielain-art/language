import { Content, HarmBlockThreshold, HarmCategory, VertexAI } from '@google-cloud/vertexai'
import { config } from '../../config.js'
import { getSystemInstruction, POST_ANALYSIS_PROMPT, TutorTone } from '../constants/prompts.js'

// Initialize Vertex AI
// Usually, Vertex AI relies on Application Default Credentials (ADC).
// Ensure you have auth context or service account configured.
const vertexAi = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT || 'fluentai-dev',
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
})

const DEFAULT_SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
]

export interface GeminiInput {
  text?: string
  audioBase64?: string
}

/**
 * Ask Gemini a question based on user string/audio and history.
 */
export async function askGemini(
  input: GeminiInput,
  chatHistory: Content[],
  tone: TutorTone,
): Promise<string> {
  const model = vertexAi.preview.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: {
      role: 'system',
      parts: [{ text: getSystemInstruction(tone) }],
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
    safetySettings: DEFAULT_SAFETY_SETTINGS,
  })

  const parts = []

  if (input.text) {
    parts.push({ text: input.text })
  }

  if (input.audioBase64) {
    parts.push({
      inlineData: {
        mimeType: 'audio/ogg',
        data: input.audioBase64,
      },
    })
  }

  const chat = model.startChat({
    history: chatHistory,
  })

  const result = await chat.sendMessage(parts)
  return result.response.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export interface PostAnalysisResult {
  feedback: string
  mistakes: string[]
  new_words: Array<{ word: string, translation: string }>
}

/**
 * Run Gemini post-analysis on a chat history returning structured JSON.
 */
export async function askGeminiForAnalysis(chatHistory: Content[]): Promise<PostAnalysisResult> {
  const model = vertexAi.preview.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.1, // Low temperature for consistent JSON
      responseMimeType: 'application/json',
    },
    safetySettings: DEFAULT_SAFETY_SETTINGS,
  })

  // Start chat with history so Gemini has context of the dialogue
  const chat = model.startChat({ history: chatHistory })

  // Send the analysis prompt
  const result = await chat.sendMessage([{ text: POST_ANALYSIS_PROMPT }])
  const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '{}'

  try {
    const cleaned = responseText.trim().replace(/^```json/, '').replace(/```$/, '').trim()
    return JSON.parse(cleaned)
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
