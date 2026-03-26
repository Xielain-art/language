import { supabase } from '#root/services/supabase.js'

export interface VocabularyItem {
  id: string
  user_id: number
  word: string
  translation: string
  language_code: string
  is_learned: boolean
  created_at: string
  learning_stage: number
  next_review_date: string
}

// SRS intervals in days for each stage
const SRS_INTERVALS = [1, 3, 7, 14, 30, 60]

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

/**
 * Get words due for SRS review
 */
export async function getWordsForReview(userId: number): Promise<{ data: VocabularyItem[] | null; error: any }> {
  const now = new Date().toISOString()
  
  const { data, error } = await supabase
    .from('vocabulary')
    .select('*')
    .eq('user_id', userId)
    .eq('is_learned', false)
    .lte('next_review_date', now)
    .order('next_review_date', { ascending: true })

  return { data, error }
}

/**
 * Update word after successful SRS review
 */
export async function updateWordAfterReview(wordId: string, currentStage: number): Promise<{ error: any }> {
  const nextStage = Math.min(currentStage + 1, SRS_INTERVALS.length - 1)
  const intervalDays = SRS_INTERVALS[nextStage]
  
  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays)

  const { error } = await supabase
    .from('vocabulary')
    .update({
      learning_stage: nextStage,
      next_review_date: nextReviewDate.toISOString(),
      is_learned: nextStage >= SRS_INTERVALS.length - 1
    })
    .eq('id', wordId)

  return { error }
}

/**
 * Reset word SRS progress after failed review
 */
export async function resetWordProgress(wordId: string): Promise<{ error: any }> {
  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + SRS_INTERVALS[0])

  const { error } = await supabase
    .from('vocabulary')
    .update({
      learning_stage: 0,
      next_review_date: nextReviewDate.toISOString(),
      is_learned: false
    })
    .eq('id', wordId)

  return { error }
}

/**
 * Get random words for quiz (excluding a specific word)
 */
export async function getRandomWordsForQuiz(
  userId: number, 
  excludeWordId: string, 
  count: number = 3
): Promise<{ data: VocabularyItem[] | null; error: any }> {
  const { data, error } = await supabase
    .from('vocabulary')
    .select('*')
    .eq('user_id', userId)
    .neq('id', excludeWordId)
    .limit(count)

  if (error || !data) {
    return { data: null, error }
  }

  // Shuffle the array
  const shuffled = data.sort(() => Math.random() - 0.5)
  return { data: shuffled, error: null }
}
