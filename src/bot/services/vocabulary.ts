import { supabase } from '#root/services/supabase.js'

export interface VocabularyItem {
  id: string
  user_id: number
  word: string
  translation: string
  language_code: string
  is_learned: boolean
  created_at: string
}

/**
 * Get a paginated list of vocabulary items
 */
export async function getVocabularyPage(
  userId: number,
  isLearned: boolean,
  languageCode: string,
  page: number,
  itemsPerPage: number
): Promise<{ data: VocabularyItem[] | null; error: any; count: number | null }> {
  const from = page * itemsPerPage
  const to = from + itemsPerPage - 1

  const { data, error, count } = await supabase
    .from('vocabulary')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_learned', isLearned)
    .eq('language_code', languageCode)
    .order('created_at', { ascending: false })
    .range(from, to)

  return { data, error, count }
}

/**
 * Get unique languages from user's vocabulary
 */
export async function getVocabularyLanguages(
  userId: number,
  isLearned: boolean
): Promise<{ data: string[] | null; error: any }> {
  const { data, error } = await supabase
    .from('vocabulary')
    .select('language_code')
    .eq('user_id', userId)
    .eq('is_learned', isLearned)

  if (error || !data) {
    return { data: null, error }
  }

  const uniqueLangs = [...new Set(data.map(l => l.language_code))].filter(Boolean) as string[]
  return { data: uniqueLangs, error: null }
}

/**
 * Get a single vocabulary item by ID
 */
export async function getWordById(wordId: string): Promise<{ data: VocabularyItem | null; error: any }> {
  const { data, error } = await supabase
    .from('vocabulary')
    .select('*')
    .eq('id', wordId)
    .single()

  return { data, error }
}

/**
 * Toggle word learned status
 */
export async function toggleWordStatus(wordId: string, currentStatus: boolean): Promise<{ error: any }> {
  const { error } = await supabase
    .from('vocabulary')
    .update({ is_learned: !currentStatus })
    .eq('id', wordId)

  return { error }
}

/**
 * Mark word as learned
 */
export async function markWordAsLearned(wordId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('vocabulary')
    .update({ is_learned: true })
    .eq('id', wordId)

  return { error }
}

/**
 * Delete a vocabulary word
 */
export async function deleteWord(wordId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('vocabulary')
    .delete()
    .eq('id', wordId)

  return { error }
}

/**
 * Add a new vocabulary word
 */
export async function addVocabularyWord(
  userId: number,
  langCode: string,
  word: string,
  translation: string
): Promise<{ error: any }> {
  const { error } = await supabase.from('vocabulary').insert({
    user_id: userId,
    word,
    translation,
    language_code: langCode,
  })

  return { error }
}

/**
 * Get all unlearned words for a user
 */
export async function getUnlearnedWords(userId: number): Promise<{ data: VocabularyItem[] | null; error: any }> {
  const { data, error } = await supabase
    .from('vocabulary')
    .select('*')
    .eq('user_id', userId)
    .eq('is_learned', false)
    .order('created_at', { ascending: false })

  return { data, error }
}

/**
 * Get a random unlearned word for flashcard practice
 */
export async function getRandomUnlearnedWord(userId: number): Promise<{ data: VocabularyItem | null; error: any }> {
  const { data: words, error } = await getUnlearnedWords(userId)

  if (error || !words || words.length === 0) {
    return { data: null, error }
  }

  const randomIndex = Math.floor(Math.random() * words.length)
  return { data: words[randomIndex], error: null }
}

/**
 * Get vocabulary statistics for a user
 */
export async function getVocabularyStats(userId: number): Promise<{
  total: number
  learned: number
  error: any
}> {
  const { data, error } = await supabase
    .from('vocabulary')
    .select('is_learned')
    .eq('user_id', userId)

  if (error || !data) {
    return { total: 0, learned: 0, error }
  }

  return {
    total: data.length,
    learned: data.filter(w => w.is_learned).length,
    error: null
  }
}