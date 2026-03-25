import { supabase } from '#root/services/supabase.js'

export interface BotSetting {
  key: string
  value: string
  description: string | null
  updated_at: string
}

export async function getBotSetting(key: string): Promise<string | null> {
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
}

export async function setBotSetting(key: string, value: string): Promise<boolean> {
  const { error } = await supabase
    .from('bot_settings')
    .upsert({ key, value }, { onConflict: 'key' })

  if (error) {
    console.error(`Failed to set bot setting ${key}:`, error)
    return false
  }

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