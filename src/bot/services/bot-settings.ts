import { supabase } from '#root/services/supabase.js'
import { cache, CacheKeys } from '#root/bot/services/cache.js'

export interface BotSetting {
  key: string
  value: string
  description: string | null
  updated_at: string
}

export async function getBotSetting(key: string): Promise<string | null> {
  const cacheKey = CacheKeys.botSetting(key)
  
  return cache.getOrFetch(cacheKey, async () => {
    const { data, error } = await supabase
      .from('bot_settings')
      .select('value')
      .eq('key', key)
      .single()

    if (error || !data) {
      console.error(`Failed to get bot setting ${key}:`, error)
      return null
    }

    return data.value
  })
}

export async function setBotSetting(key: string, value: string): Promise<boolean> {
  const { error } = await supabase
    .from('bot_settings')
    .upsert({ key, value }, { onConflict: 'key' })

  if (error) {
    console.error(`Failed to set bot setting ${key}:`, error)
    return false
  }

  // Invalidate cache for this setting
  cache.delete(CacheKeys.botSetting(key))
  return true
}

export async function getAllBotSettings(): Promise<BotSetting[]> {
  const { data, error } = await supabase
    .from('bot_settings')
    .select('*')
    .order('key')

  if (error) {
    console.error('Failed to get all bot settings:', error)
    return []
  }

  return data || []
}

export async function getPlacementTestModel(): Promise<string> {
  const model = await getBotSetting('placement_test_model')
  return model || 'qwen-plus'
}

export async function getAvailableModels(): Promise<string[]> {
  const modelsJson = await getBotSetting('available_models')
  if (!modelsJson) {
    return ['gemini-2.5-flash-lite', 'qwen-plus']
  }

  try {
    return JSON.parse(modelsJson)
  } catch (e) {
    console.error('Failed to parse available_models:', e)
    return ['gemini-2.5-flash-lite', 'qwen-plus']
  }
}

export async function setAvailableModels(models: string[]): Promise<boolean> {
  return setBotSetting('available_models', JSON.stringify(models))
}

export async function setPlacementTestModel(model: string): Promise<boolean> {
  return setBotSetting('placement_test_model', model)
}

// Audio configuration
export async function getMaxAudioSizeMb(): Promise<number> {
  const value = await getBotSetting('max_audio_size_mb')
  return value ? parseInt(value, 10) : 20
}

export async function getMaxAudioDurationSec(): Promise<number> {
  const value = await getBotSetting('max_audio_duration_sec')
  return value ? parseInt(value, 10) : 60
}

// Chat configuration
export async function getChatHistoryDepth(): Promise<number> {
  const value = await getBotSetting('chat_history_depth')
  return value ? parseInt(value, 10) : 20
}

// Vocabulary configuration
export async function getVocabularyItemsPerPage(): Promise<number> {
  const value = await getBotSetting('vocabulary_items_per_page')
  return value ? parseInt(value, 10) : 10
}

// Mistake type icons
export async function getMistakeTypeIcons(): Promise<Record<string, string>> {
  const value = await getBotSetting('mistake_type_icons')
  if (!value) {
    return {
      Grammar: '📝',
      Vocabulary: '📖',
      Punctuation: '📍',
      Spelling: '🔤'
    }
  }
  try {
    return JSON.parse(value)
  } catch (e) {
    console.error('Failed to parse mistake_type_icons:', e)
    return {
      Grammar: '📝',
      Vocabulary: '📖',
      Punctuation: '📍',
      Spelling: '🔤'
    }
  }
}
