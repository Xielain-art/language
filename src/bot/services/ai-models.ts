import { supabase } from '#root/services/supabase.js'
import { cache, CacheKeys } from '#root/bot/services/cache.js'

export interface AIModel {
  code: string
  name: string
  provider: 'gemini' | 'qwen' | 'openai' | 'deepseek'
  description: string | null
  is_active: boolean
  supports_voice: boolean
  created_at: string
  updated_at: string
}

export async function getActiveModels(): Promise<AIModel[]> {
  const cacheKey = CacheKeys.activeModels()
  
  return cache.getOrFetch(cacheKey, async () => {
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Failed to get active models:', error)
      return []
    }

    return data || []
  }) as Promise<AIModel[]>
}

export async function getModelByCode(code: string): Promise<AIModel | null> {
  const cacheKey = CacheKeys.aiModel(code)
  
  return cache.getOrFetch(cacheKey, async () => {
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('code', code)
      .single()

    if (error || !data) {
      console.error(`Failed to get model ${code}:`, error)
      return null
    }

    return data
  })
}

export async function getModelProvider(code: string): Promise<string> {
  const model = await getModelByCode(code)
  return model?.provider || 'gemini'
}

export async function addModel(model: Omit<AIModel, 'created_at' | 'updated_at'>): Promise<boolean> {
  const { error } = await supabase
    .from('ai_models')
    .insert(model)

  if (error) {
    console.error('Failed to add model:', error)
    return false
  }

  return true
}

export async function updateModel(code: string, updates: Partial<AIModel>): Promise<boolean> {
  const { error } = await supabase
    .from('ai_models')
    .update(updates)
    .eq('code', code)

  if (error) {
    console.error(`Failed to update model ${code}:`, error)
    return false
  }

  return true
}

export async function deleteModel(code: string): Promise<boolean> {
  const { error } = await supabase
    .from('ai_models')
    .delete()
    .eq('code', code)

  if (error) {
    console.error(`Failed to delete model ${code}:`, error)
    return false
  }

  return true
}

export async function setModelActive(code: string, isActive: boolean): Promise<boolean> {
  return updateModel(code, { is_active: isActive })
}