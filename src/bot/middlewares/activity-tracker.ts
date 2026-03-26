import type { Context } from '#root/bot/context.js'
import type { NextFunction } from 'grammy'
import { getUserActivityStats, updateUserStreak } from '#root/bot/services/user.js'
import { sendTelegramLog, LOG_TOPICS } from '#root/bot/services/telegram-logger.js'

/**
 * Middleware to track user activity and update streaks.
 * Runs on every message in private chats.
 * Uses session-based debouncing to prevent DDoS on database.
 */
export async function activityTracker(ctx: Context, next: NextFunction) {
  // Only track activity for authenticated users in private chats
  if (!ctx.from || ctx.chat?.type !== 'private' || !ctx.session.user) {
    return next()
  }

  const userId = ctx.from.id
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

  // Session-based debouncing: only query DB if date changed
  if (ctx.session.__lastActivityDate === today) {
    return next()
  }

  try {
    // Get current user activity stats
    const stats = await getUserActivityStats(userId)

    if (!stats) {
      // If user not found, just continue
      return next()
    }

    const { lastActivityDate, streakCount, maxStreak } = stats

    // Check if activity already tracked today
    if (lastActivityDate === today) {
      ctx.session.__lastActivityDate = today
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
        newStreak = streakCount + 1
      }
      // Otherwise, streak resets to 1 (gap in activity)
    }

    // Calculate new max streak
    const newMaxStreak = Math.max(newStreak, maxStreak)

    // Update user record
    const success = await updateUserStreak(userId, newStreak, newMaxStreak, today)

    if (!success) {
      console.error('Error updating streak')
    }

    // Store streak info in session for potential notifications
    ctx.session.__streakUpdated = true
    ctx.session.__newStreakCount = newStreak
    ctx.session.__lastActivityDate = today

    // Send streak notification if streak is greater than 1
    if (newStreak > 1) {
      ctx.reply(`🔥 ${ctx.t('streak-notification', { count: newStreak })}`).catch(console.error)
      
      // Log streak update to Telegram forum if configured
      const logChatId = ctx.config.logChatId
      if (logChatId) {
        await sendTelegramLog(
          ctx.api,
          logChatId,
          LOG_TOPICS.SYSTEM.key,
          `⚙️ <b>Streak Updated</b>\n\n` +
          `<b>User:</b> ${ctx.from?.first_name} (${userId})\n` +
          `<b>New Streak:</b> ${newStreak} days\n` +
          `<b>Max Streak:</b> ${newMaxStreak} days`
        )
      }
    }

  } catch (error) {
    console.error('Activity tracker error:', error)
    // Don't block the request if tracking fails
  }

  return next()
}
