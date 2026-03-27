import { createClient } from '@supabase/supabase-js'
import { config } from '../config.js'
import { cache, CacheKeys } from '#root/bot/services/cache.js'

export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseSecretKey,
)

export async function getPromptsByType(type: 'tone' | 'roleplay' | 'system') {
  const { data, error } = await supabase.from('prompts').select('*').eq('type', type)
  if (error) {
    console.error(`Failed to fetch prompts of type ${type}:`, error)
    return []
  }
  return data || []
}

export async function getPromptByCode(code: string): Promise<string | null> {
  const cacheKey = CacheKeys.prompt(code)
  
  return cache.getOrFetch(cacheKey, async () => {
    const { data, error } = await supabase.from('prompts').select('prompt_text').eq('code', code).single()
    if (error || !data) {
      console.error(`Failed to fetch prompt with code ${code}:`, error)
      return null
    }
    return data.prompt_text
  })
}

export async function getLanguages() {
  const { data, error } = await supabase.from('languages').select('*')
  if (error) {
    console.error('Failed to fetch languages:', error)
    return []
  }
  return data || []
}

export async function updateUserPreferences(userId: number, data: any) {
  const { error } = await supabase.from('users').update(data).eq('id', userId)
  if (error) {
    console.error(`Failed to update user preferences for ${userId}:`, error)
    return { success: false, error }
  }
  return { success: true }
}

export async function getRoleplays() {
  const { data, error } = await supabase.from('roleplays').select('*').order('level')
  if (error) {
    console.error('Failed to fetch roleplays:', error)
    return []
  }
  return data || []
}
