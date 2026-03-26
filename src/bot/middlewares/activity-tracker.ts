import type { Context } from '#root/bot/context.js'
import type { NextFunction } from 'grammy'
import { supabase } from '#root/services/supabase.js'

/**
 * Middleware to track user activity and update streaks.
 * Runs on every message in private chats.
 */
export async function activityTracker(ctx: Context, next: NextFunction) {
  // Only track activity for authenticated users in private chats
  if (!ctx.from || ctx.chat?.type !== 'private' || !ctx.session.user) {
    return next()
  }

  const userId = ctx.from.id
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

  try {
    // Get current user data
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('last_activity_date, streak_count, max_streak')
      .eq('id', userId)
      .single()

    if (fetchError || !userData) {
      // If user not found, just continue
      return next()
    }

    const lastActivityDate = userData.last_activity_date
    const currentStreak = userData.streak_count || 0
    const maxStreak = userData.max_streak || 0

    // Check if activity already tracked today
    if (lastActivityDate === today) {
      return next()
    }

    // Calculate new streak
    let newStreak = 1 // Default to 1 for first activity or reset

    if (lastActivityDate) {
      const lastDate = new Date(lastActivityDate)
      const todayDate = new Date(today)
      const yesterdayDate = new Date(todayDate)
      yesterdayDate.setDate(yesterdayDate.getDate() - 1)

      // Check if last activity was yesterday
      if (lastDate.toISOString().split('T')[0] === yesterdayDate.toISOString().split('T')[0]) {
        newStreak = currentStreak + 1
      }
      // Otherwise, streak resets to 1 (gap in activity)
    }

    // Calculate new max streak
    const newMaxStreak = Math.max(newStreak, maxStreak)

    // Update user record
    const { error: updateError } = await supabase
      .from('users')
      .update({
        last_activity_date: today,
        streak_count: newStreak,
        max_streak: newMaxStreak
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating streak:', updateError)
    }

    // Store streak info in session for potential notifications
    ctx.session.__streakUpdated = true
    ctx.session.__newStreakCount = newStreak

  } catch (error) {
    console.error('Activity tracker error:', error)
    // Don't block the request if tracking fails
  }

  return next()
}