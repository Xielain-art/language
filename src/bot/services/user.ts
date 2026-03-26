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
  ui_language_selected: boolean
  learning_language_selected: boolean
  level_selected: boolean
  report_language: string | null
  report_language_name?: string | null
  streak_count?: number
  max_streak?: number
}

/**
 * Map raw database row to UserProfile
 */
function mapToUserProfile(data: any): UserProfile {
  return {
    id: Number(data.id),
    level: data.level,
    selected_tone_code: data.selected_tone_code,
    selected_analysis_tone_code: data.selected_analysis_tone_code,
    learning_language: data.learning_language,
    selected_ai_model: data.selected_ai_model || 'gemini-2.5-flash-lite',
    ui_language_selected: data.ui_language_selected || false,
    learning_language_selected: data.learning_language_selected || false,
    level_selected: data.level_selected || false,
    report_language: data.report_language,
  }
}

export async function getUserProfile(userId: number, locale?: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, level, selected_tone_code, selected_analysis_tone_code, learning_language, selected_ai_model, ui_language_selected, learning_language_selected, level_selected, report_language, streak_count, max_streak')
    .eq('id', userId)
    .single()

  if (error || !data)
    return null

  const profile = mapToUserProfile(data)
  profile.streak_count = data.streak_count || 0
  profile.max_streak = data.max_streak || 0

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

  if (profile.report_language) {
    const { data: reportLangData } = await supabase
      .from('languages')
      .select('name_en, name_ru')
      .eq('code', profile.report_language)
      .single()
    
    profile.report_language_name = locale === 'ru' ? reportLangData?.name_ru : reportLangData?.name_en
  }

  return profile
}

/**
 * Create a new user if they don't exist (upsert)
 */
export async function createUserIfNotExists(userId: number): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .upsert({ id: userId }, { onConflict: 'id' })
    .select()
    .single()

  if (error) {
    console.error('Error inserting user:', error)
    return null
  }

  if (!data) {
    return null
  }

  return mapToUserProfile(data)
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
