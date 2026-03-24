import { supabase } from '#root/services/supabase.js'

export interface UserProfile {
  id: number
  level: string | null
  selected_tone_code: string | null
  learning_language: string | null
  target_language_name?: string | null
}

export async function getUserProfile(userId: number): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, level, selected_tone_code, learning_language')
    .eq('id', userId)
    .single()

  if (error || !data)
    return null

  const profile: UserProfile = {
    id: Number(data.id),
    level: data.level,
    selected_tone_code: data.selected_tone_code,
    learning_language: data.learning_language,
  }

  if (profile.learning_language) {
    const { data: langData } = await supabase
      .from('languages')
      .select('name_en')
      .eq('code', profile.learning_language)
      .single()
    
    profile.target_language_name = langData?.name_en
  }

  return profile
}

export async function updateUserProfile(userId: number, updates: Partial<UserProfile>) {
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)

  if (error) {
    throw error
  }
}
