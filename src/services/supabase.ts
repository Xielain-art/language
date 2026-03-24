import { createClient } from '@supabase/supabase-js'
import { config } from '../config.js'

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
  const { data, error } = await supabase.from('prompts').select('prompt_text').eq('code', code).single()
  if (error || !data) {
    console.error(`Failed to fetch prompt with code ${code}:`, error)
    return null
  }
  return data.prompt_text
}

