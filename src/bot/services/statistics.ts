import { supabase } from '#root/services/supabase.js'

export interface MistakeRecord {
  type: string
  original_text: string
  corrected_text: string
}

export interface UserMistake {
  id: string
  user_id: number
  type: string
  original_text: string
  corrected_text: string
  created_at: string
}

export interface ProgressReport {
  id: string
  user_id: number
  weaknesses: string[]
  advice: string
  is_mega_report: boolean
  ai_model_used: string
  created_at: string
}

export interface WeeklyStats {
  counts: Record<string, number>
  total: number
}

/**
 * Save user mistakes to the database
 */
export async function saveUserMistakes(
  userId: number,
  mistakes: Array<{ type: string; original: string; correction: string }>
): Promise<{ error: any }> {
  const mistakesToSave = mistakes.map(m => ({
    user_id: userId,
    type: m.type,
    original_text: m.original,
    corrected_text: m.correction
  }))

  const { error } = await supabase
    .from('user_mistakes')
    .insert(mistakesToSave)

  return { error }
}

/**
 * Get weekly mistake statistics for a user
 */
export async function getWeeklyMistakeStats(userId: number): Promise<WeeklyStats | null> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data, error } = await supabase
    .from('user_mistakes')
    .select('type')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString())

  if (error || !data) {
    return null
  }

  const counts: Record<string, number> = {
    Grammar: 0,
    Vocabulary: 0,
    Punctuation: 0,
    Spelling: 0
  }

  data.forEach(mistake => {
    if (counts[mistake.type] !== undefined) {
      counts[mistake.type]++
    }
  })

  return { counts, total: data.length }
}

/**
 * Get the last report date for a user
 */
export async function getLastReportDate(
  userId: number,
  isMega: boolean
): Promise<{ data: string | null; error: any }> {
  const { data, error } = await supabase
    .from('user_progress_reports')
    .select('created_at')
    .eq('user_id', userId)
    .eq('is_mega_report', isMega)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return { data: data?.created_at || null, error }
}

/**
 * Count new mistakes since a given date
 */
export async function getNewMistakesCount(
  userId: number,
  sinceDate?: string
): Promise<{ count: number; error: any }> {
  let query = supabase
    .from('user_mistakes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (sinceDate) {
    query = query.gt('created_at', sinceDate)
  }

  const { count, error } = await query

  return { count: count || 0, error }
}

/**
 * Save a progress report
 */
export async function saveReport(
  userId: number,
  weaknesses: string[],
  advice: string,
  isMega: boolean,
  aiModel: string
): Promise<{ error: any }> {
  const { error } = await supabase.from('user_progress_reports').insert({
    user_id: userId,
    weaknesses,
    advice,
    is_mega_report: isMega,
    ai_model_used: aiModel
  })

  return { error }
}

/**
 * Get reports history for a user (paginated)
 */
export async function getReportsHistory(
  userId: number,
  page: number,
  limit: number
): Promise<{ data: Pick<ProgressReport, 'id' | 'created_at' | 'is_mega_report'>[] | null; error: any }> {
  const { data, error } = await supabase
    .from('user_progress_reports')
    .select('id, created_at, is_mega_report')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  return { data, error }
}

/**
 * Get a single report by ID
 */
export async function getReportById(reportId: string): Promise<{ data: ProgressReport | null; error: any }> {
  const { data, error } = await supabase
    .from('user_progress_reports')
    .select('*')
    .eq('id', reportId)
    .single()

  return { data, error }
}

/**
 * Get past regular reports for mega report generation
 */
export async function getPastReports(
  userId: number,
  sinceDate?: string,
  limit: number = 10
): Promise<{ data: Pick<ProgressReport, 'weaknesses' | 'advice' | 'created_at'>[] | null; error: any }> {
  let query = supabase
    .from('user_progress_reports')
    .select('weaknesses, advice, created_at')
    .eq('user_id', userId)
    .eq('is_mega_report', false)
    .order('created_at', { ascending: false })

  if (sinceDate) {
    query = query.gt('created_at', sinceDate)
  }

  const { data, error } = await query.limit(limit)

  return { data, error }
}

/**
 * Count new regular reports since last mega report
 */
export async function getNewReportsCount(
  userId: number,
  sinceDate?: string
): Promise<{ count: number; error: any }> {
  let query = supabase
    .from('user_progress_reports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_mega_report', false)

  if (sinceDate) {
    query = query.gt('created_at', sinceDate)
  }

  const { count, error } = await query

  return { count: count || 0, error }
}

/**
 * Get mistakes since a given date for report generation
 */
export async function getMistakesSinceReport(
  userId: number,
  sinceDate?: string,
  limit: number = 50
): Promise<{ data: MistakeRecord[] | null; error: any }> {
  let query = supabase
    .from('user_mistakes')
    .select('type, original_text, corrected_text')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (sinceDate) {
    query = query.gt('created_at', sinceDate)
  }

  const { data, error } = await query.limit(limit)

  return { data, error }
}