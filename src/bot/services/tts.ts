/**
 * Text-to-Speech (TTS) Service
 * Supports multiple providers: Qwen (DashScope), OpenAI (TTS-1)
 */

import { getBotSetting } from '#root/bot/services/bot-settings.js'

export interface TTSResult {
  audioBuffer: Buffer
  success: boolean
  error?: string
  extension?: 'ogg' | 'mp3' | 'wav'
}

/**
 * Generate speech audio from text using the configured TTS provider
 */
export async function generateSpeech(text: string, voiceId: string): Promise<TTSResult> {
  try {
    const provider = await getBotSetting('tts_provider') || 'qwen'
    
    switch (provider) {
      case 'qwen':
        return await generateWithQwen(text, voiceId)
      case 'openai':
        return await generateWithOpenAI(text, voiceId)
      default:
        console.error(`Unknown TTS provider: ${provider}`)
        return { audioBuffer: Buffer.alloc(0), success: false, error: `Unknown provider: ${provider}` }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('TTS generation error:', errorMsg)
    return { audioBuffer: Buffer.alloc(0), success: false, error: errorMsg }
  }
}

/**
 * Generate speech using Qwen (DashScope) TTS API
 */
async function generateWithQwen(text: string, voiceId: string): Promise<TTSResult> {
  const apiKey = process.env.QWEN_API_KEY
  if (!apiKey) {
    return { audioBuffer: Buffer.alloc(0), success: false, error: 'QWEN_API_KEY not configured' }
  }

  const model = await getBotSetting('tts_model') || 'cosyvoice-v3-flash'

  try {
    // Use default voice if not specified or 'default'
    const voice = voiceId && voiceId !== 'default' ? voiceId : 'longxiaoxia'

    // Dynamic endpoint detection based on model
    const isCosyVoice = model.includes('cosyvoice')
    const endpoint = isCosyVoice 
      ? 'https://dashscope.aliyuncs.com/api/v1/services/audio/text-to-speech/text-to-audio'
      : 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2speech/speech-synthesis'

    const response = await fetch(
      endpoint,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          input: {
            text: text
          },
          parameters: {
            voice: voice,
            format: 'mp3'
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Qwen TTS API error:', response.status, errorText)
      return { audioBuffer: Buffer.alloc(0), success: false, error: `API error: ${response.status}` }
    }

    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = Buffer.from(arrayBuffer)

    if (audioBuffer.length === 0) {
      return { audioBuffer: Buffer.alloc(0), success: false, error: 'No audio returned' }
    }

    return { audioBuffer, success: true, extension: 'mp3' }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Qwen TTS request failed:', errorMsg)
    return { audioBuffer: Buffer.alloc(0), success: false, error: errorMsg }
  }
}

/**
 * Generate speech using OpenAI TTS API
 */
async function generateWithOpenAI(text: string, voiceId: string): Promise<TTSResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { audioBuffer: Buffer.alloc(0), success: false, error: 'OPENAI_API_KEY not configured' }
  }

  const model = await getBotSetting('tts_model') || 'tts-1'

  try {
    // OpenAI voices: alloy, echo, fable, onyx, nova, shimmer
    const voice = voiceId && voiceId !== 'default' ? voiceId : 'nova'

    const response = await fetch(
      'https://api.openai.com/v1/audio/speech',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          input: text,
          voice: voice,
          response_format: 'opus'
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI TTS API error:', response.status, errorText)
      return { audioBuffer: Buffer.alloc(0), success: false, error: `API error: ${response.status}` }
    }

    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = Buffer.from(arrayBuffer)

    if (audioBuffer.length === 0) {
      return { audioBuffer: Buffer.alloc(0), success: false, error: 'No audio returned' }
    }

    return { audioBuffer, success: true, extension: 'ogg' }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('OpenAI TTS request failed:', errorMsg)
    return { audioBuffer: Buffer.alloc(0), success: false, error: errorMsg }
  }
}

/**
 * Get available voices for the configured provider
 */
export async function getAvailableVoices(): Promise<string[]> {
  const provider = await getBotSetting('tts_provider') || 'qwen'
  
  switch (provider) {
    case 'qwen':
      return ['longxiaoxia', 'longshu', 'longjing', 'longcheng', 'longxiang']
    case 'openai':
      return ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
    default:
      return ['default']
  }
}