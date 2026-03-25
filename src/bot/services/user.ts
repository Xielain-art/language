import { supabase } from '#root/services/supabase.js'

export interface UserProfile {
  id: number
  level: string | null
  selected_tone_code: string | null
  selected_analysis_tone_code: string | null
  learning_language: string | null
  target_language_name?: string | null
  tone_label?: string | null
  selected_ai_model?: string | null
}

export async function getUserProfile(userId: number, locale?: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, level, selected_tone_code, selected_analysis_tone_code, learning_language, selected_ai_model')
    .eq('id', userId)
    .single()

  if (error || !data)
    return null

  const profile: UserProfile = {
    id: Number(data.id),
    level: data.level,
    selected_tone_code: data.selected_tone_code,
    selected_analysis_tone_code: data.selected_analysis_tone_code,
    learning_language: data.learning_language,
    selected_ai_model: data.selected_ai_model || 'gemini-2.5-flash-lite',
  }

  if (profile.learning_language) {
    const { data: langData } = await supabase
      .from('languages')
      .select('name_en, name_ru')
      .eq('code', profile.learning_language)
      .single()
    
    profile.target_language_name = locale === 'ru' ? langData?.name_ru : langData?.name_en
  }

  if (profile.selected_tone_code) {
    const { data: toneData } = await supabase
      .from('prompts')
      .select('label_en, label_ru')
      .eq('code', profile.selected_tone_code)
      .eq('type', 'tone')
      .single()
    
    if (toneData) {
      profile.tone_label = locale === 'ru' ? toneData.label_ru : toneData.label_en
    }
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
