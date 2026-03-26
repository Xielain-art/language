import type { Context } from '#root/bot/context.js'
import { supabase } from '#root/services/supabase.js'

/**
 * Gets weekly mistake statistics for a user.
 */
export async function getWeeklyMistakeStats(userId: number): Promise<string> {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data, error } = await supabase
      .from('user_mistakes')
      .select('type')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString())

    if (error || !data || data.length === 0) {
      return ''
    }

    // Count mistakes by type
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

    // Get top 3 mistake types
    const sorted = Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    if (sorted.length === 0) {
      return ''
    }

    const icons: Record<string, string> = {
      Grammar: '📝',
      Vocabulary: '📖',
      Punctuation: '📍',
      Spelling: '🔤'
    }

    const statsText = sorted
      .map(([type, count]) => `${icons[type]} ${type}: ${count}`)
      .join(' | ')

    return `\n📊 Last 7 days: ${statsText} (${data.length} total)`
  } catch (error) {
    console.error('Error getting weekly mistake stats:', error)
    return ''
  }
}

/**
 * Generates a formatted profile string for the user.
 */
export async function getProfileText(ctx: Context): Promise<string> {
  const user = ctx.session.user
  if (!user) return ''

  let profileText = ctx.t('menu-main-profile', {
    target_lang: user.target_language_name || 'English',
    level: user.level || 'Not set',
    tone: user.tone_label || user.selected_tone_code || 'Friendly',
  })

  // Add streak information
  if (user.streak_count && user.streak_count > 0) {
    profileText += `\n🔥 Streak: ${user.streak_count} day${user.streak_count > 1 ? 's' : ''}`
    if (user.max_streak && user.max_streak > user.streak_count) {
      profileText += ` (best: ${user.max_streak})`
    }
  }

  // Add weekly mistake statistics
  if (user.id) {
    const stats = await getWeeklyMistakeStats(user.id)
    if (stats) {
      profileText += stats
    }
  }

  return profileText
}
