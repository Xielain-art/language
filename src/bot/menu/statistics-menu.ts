import type { Context } from '#root/bot/context.js'
import { supabase } from '#root/services/supabase.js'
import { generateProgressReport } from '#root/bot/services/ai.js'
import { Menu } from '@grammyjs/menu'
import { InlineKeyboard } from 'grammy'

/**
 * Gets weekly mistake statistics for a user.
 */
async function getWeeklyMistakeStats(userId: number) {
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
 * Formats statistics text for display.
 */
async function formatStatsText(ctx: Context, stats: { counts: Record<string, number>; total: number } | null) {
  if (!stats || stats.total === 0) {
    return ctx.t('stats-no-data')
  }

  let text = `${ctx.t('stats-title')}\n\n`
  text += `${ctx.t('stats-grammar', { count: stats.counts.Grammar })}\n`
  text += `${ctx.t('stats-vocabulary', { count: stats.counts.Vocabulary })}\n`
  text += `${ctx.t('stats-punctuation', { count: stats.counts.Punctuation })}\n`
  text += `${ctx.t('stats-spelling', { count: stats.counts.Spelling })}\n\n`
  text += `${ctx.t('stats-total', { count: stats.total })}`

  // Find top weakness
  const topWeakness = Object.entries(stats.counts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])[0]

  if (topWeakness) {
    const icons: Record<string, string> = {
      Grammar: '📝',
      Vocabulary: '📖',
      Punctuation: '📍',
      Spelling: '🔤'
    }
    text += `\n\n💡 Твоя самая частая проблема — ${icons[topWeakness[0]]} ${topWeakness[0]}. Хочешь разобрать примеры?`
  }

  return text
}

/**
 * Main Statistics Menu
 */
export const statisticsMenu = new Menu<Context>('statistics-menu')
  .text(ctx => ctx.t('stats-ai-report-btn'), async (ctx) => {
    const userId = ctx.from?.id
    if (!userId) {
      await ctx.answerCallbackQuery({ text: ctx.t('error-user-not-found') })
      return
    }

    // Show confirmation with API usage warning
    const confirmText = `⚠️ <b>Внимание!</b>\n\nГенерация AI-отчета использует API-запросы к выбранной вами модели ИИ.\n\nПродолжить?`
    
    await ctx.answerCallbackQuery()
    await ctx.editMessageText(confirmText, { 
      parse_mode: 'HTML',
      reply_markup: new InlineKeyboard()
        .text('✅ Да, сгенерировать', 'generate_report_confirm')
        .row()
        .text('❌ Отмена', 'generate_report_cancel')
    })
  })
  .row()
  .back(
    ctx => ctx.t('vocabulary-back'),
    async (ctx) => {
      const { getProfileText } = await import('#root/bot/helpers/profile.js')
      await ctx.editMessageText(await getProfileText(ctx), { parse_mode: 'HTML' })
    }
  )

/**
 * Shows statistics menu with current data.
 */
export async function showStatisticsMenu(ctx: Context) {
  const userId = ctx.from?.id
  if (!userId) {
    await ctx.reply(ctx.t('error-user-not-found'))
    return
  }

  const stats = await getWeeklyMistakeStats(userId)
  const statsText = await formatStatsText(ctx, stats)

  await ctx.reply(statsText, {
    parse_mode: 'HTML',
    reply_markup: statisticsMenu
  })
}

/**
 * Handles report generation confirmation.
 */
export async function handleGenerateReportConfirm(ctx: Context) {
  const userId = ctx.from?.id
  if (!userId) {
    await ctx.answerCallbackQuery({ text: ctx.t('error-user-not-found') })
    return
  }

  await ctx.answerCallbackQuery()
  await ctx.editMessageText(ctx.t('stats-ai-report-loading'), { parse_mode: 'HTML' })

  try {
    // Get user's UI language
    const langNames: Record<string, string> = { 
      en: 'English', 
      ru: 'Russian', 
      de: 'German', 
      fr: 'French', 
      es: 'Spanish' 
    }
    const uiLanguageName = langNames[ctx.session.__language_code || 'en'] || 'English'

    // Get user's selected AI model
    const user = ctx.session.user
    const aiModel = user?.selected_ai_model || 'gemini-2.5-flash-lite'

    // Get recent mistakes (last 50)
    const { data: mistakes, error } = await supabase
      .from('user_mistakes')
      .select('type, original_text, corrected_text')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error || !mistakes || mistakes.length === 0) {
      await ctx.editMessageText(ctx.t('stats-no-data'), { parse_mode: 'HTML' })
      return
    }

    // Generate AI report using user's selected model
    const report = await generateProgressReport(mistakes, uiLanguageName, aiModel)

    let reportText = `${ctx.t('stats-ai-report-title')}\n\n`
    
    if (report.mainWeaknesses.length > 0) {
      const icons: Record<string, string> = {
        Grammar: '📝',
        Vocabulary: '📖',
        Punctuation: '📍',
        Spelling: '🔤'
      }
      reportText += `🔍 <b>Главные слабые зоны:</b>\n`
      report.mainWeaknesses.forEach((weakness, index) => {
        reportText += `${index + 1}. ${icons[weakness] || '•'} ${weakness}\n`
      })
      reportText += `\n`
    }

    reportText += `💡 <b>Совет:</b>\n${report.advice}`

    // Save report to database
    await supabase
      .from('user_progress_reports')
      .insert({
        user_id: userId,
        weaknesses: report.mainWeaknesses,
        advice: report.advice,
        mistakes_analyzed: mistakes.length,
        ai_model_used: aiModel,
        created_at: new Date().toISOString()
      })

    await ctx.editMessageText(reportText, { parse_mode: 'HTML' })
  } catch (error) {
    console.error('Error generating AI report:', error)
    await ctx.editMessageText(ctx.t('stats-ai-report-error'), { parse_mode: 'HTML' })
  }
}

/**
 * Handles report generation cancellation.
 */
export async function handleGenerateReportCancel(ctx: Context) {
  await ctx.answerCallbackQuery()
  // Go back to statistics menu
  const userId = ctx.from?.id
  if (userId) {
    const stats = await getWeeklyMistakeStats(userId)
    const statsText = await formatStatsText(ctx, stats)
    await ctx.editMessageText(statsText, { parse_mode: 'HTML', reply_markup: statisticsMenu })
  }
}