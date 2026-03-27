/**
 * Speech-to-Text (STT) Service
 * Supports multiple providers: Qwen (DashScope), OpenAI (Whisper)
 */

import { getBotSetting } from '#root/bot/services/bot-settings.js'
import { getSTTModel, type STTModel } from '#root/bot/services/cache.js'

export interface STTResult {
  text: string
  success: boolean
  error?: string
}

/**
 * Transcribe audio using the configured STT provider
 */
export async function transcribeAudio(audioBase64: string): Promise<STTResult> {
  try {
    const modelCode = await getBotSetting('active_stt_model') || 'qwen3-asr-flash-2025-09-08'
    const model = await getSTTModel(modelCode)
    
    if (!model) {
      console.error(`STT model not found: ${modelCode}`)
      return { text: '', success: false, error: `Model not found: ${modelCode}` }
    }
    
    switch (model.provider) {
      case 'qwen':
        return await transcribeWithQwen(audioBase64, model)
      case 'openai':
        return await transcribeWithOpenAI(audioBase64, model)
      default:
        console.error(`Unknown STT provider: ${model.provider}`)
        return { text: '', success: false, error: `Unknown provider: ${model.provider}` }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('STT transcription error:', errorMsg)
    return { text: '', success: false, error: errorMsg }
  }
}

/**
 * Transcribe using Qwen (DashScope) STT API
 */
async function transcribeWithQwen(audioBase64: string, model: STTModel): Promise<STTResult> {
  const apiKey = process.env.QWEN_API_KEY
  if (!apiKey) {
    return { text: '', success: false, error: 'QWEN_API_KEY not configured' }
  }

  try {
    const response = await fetch(
      'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model.code,
          input: {
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'audio_url',
                    audio_url: {
                      url: `data:audio/ogg;codecs=opus;base64,${audioBase64}`
                    }
                  },
                  {
                    type: 'text',
                    text: 'Transcribe this audio exactly as spoken. Return only the transcription text, nothing else.'
                  }
                ]
              }
            ]
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Qwen STT API error:', response.status, errorText)
      return { text: '', success: false, error: `API error: ${response.status}` }
    }

    const data = await response.json()
    const transcription = data.output?.choices?.[0]?.message?.content || ''
    
    if (!transcription) {
      return { text: '', success: false, error: 'No transcription returned' }
    }

    return { text: transcription, success: true }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Qwen STT request failed:', errorMsg)
    return { text: '', success: false, error: errorMsg }
  }
}

/**
 * Transcribe using OpenAI Whisper API
 */
async function transcribeWithOpenAI(audioBase64: string, model: STTModel): Promise<STTResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { text: '', success: false, error: 'OPENAI_API_KEY not configured' }
  }

  try {
    // Convert base64 to blob for multipart form
    const audioBuffer = Buffer.from(audioBase64, 'base64')
    const blob = new Blob([audioBuffer], { type: 'audio/ogg' })
    
    const formData = new FormData()
    formData.append('file', blob, 'audio.ogg')
    formData.append('model', model.code)

    const response = await fetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI STT API error:', response.status, errorText)
      return { text: '', success: false, error: `API error: ${response.status}` }
    }

    const data = await response.json()
    const transcription = data.text || ''
    
    if (!transcription) {
      return { text: '', success: false, error: 'No transcription returned' }
    }

    return { text: transcription, success: true }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('OpenAI STT request failed:', errorMsg)
    return { text: '', success: false, error: errorMsg }
  }
}