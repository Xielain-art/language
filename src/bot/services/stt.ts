/**
 * Speech-to-Text (STT) Service
 * Supports multiple providers: Qwen (DashScope), OpenAI (Whisper)
 */

import { getBotSetting } from '#root/bot/services/bot-settings.js'

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
    const provider = await getBotSetting('stt_provider') || 'qwen'
    
    switch (provider) {
      case 'qwen':
        return await transcribeWithQwen(audioBase64)
      case 'openai':
        return await transcribeWithOpenAI(audioBase64)
      default:
        console.error(`Unknown STT provider: ${provider}`)
        return { text: '', success: false, error: `Unknown provider: ${provider}` }
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
async function transcribeWithQwen(audioBase64: string): Promise<STTResult> {
  const apiKey = process.env.QWEN_API_KEY
  if (!apiKey) {
    return { text: '', success: false, error: 'QWEN_API_KEY not configured' }
  }

  const model = await getBotSetting('stt_model') || 'fun-asr-2025-08-25'

  try {
    const response = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
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
async function transcribeWithOpenAI(audioBase64: string): Promise<STTResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { text: '', success: false, error: 'OPENAI_API_KEY not configured' }
  }

  const model = await getBotSetting('stt_model') || 'whisper-1'

  try {
    // Convert base64 to blob for multipart form
    const audioBuffer = Buffer.from(audioBase64, 'base64')
    const blob = new Blob([audioBuffer], { type: 'audio/ogg' })
    
    const formData = new FormData()
    formData.append('file', blob, 'audio.ogg')
    formData.append('model', model)

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