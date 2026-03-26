import type { Context } from '#root/bot/context.js'
import { supabase } from '#root/services/supabase.js'
import { generateProgressReport, generateMegaReport } from '#root/bot/services/ai.js'
import { Menu } from '@grammyjs/menu'
import { InlineKeyboard } from 'grammy'

/**
 * Gets weekly mistake statistics for a user.
 */
export async function getWeeklyMistakeStats(userId: number) {
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
export async function formatStatsText(ctx: Context, stats: { counts: Record<string, number>; total: number } | null) {
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
    text += `\n\n💡 ${ctx.t('stats-top-weakness', { weakness: `${icons[topWeakness[0]]} ${topWeakness[0]}` })}`
  }

  return text
}

export const statisticsMenu = new Menu<Context>('statistics-menu')
  .text(ctx => ctx.t('stats-ai-report-btn'), async (ctx) => {
    await ctx.editMessageText(ctx.t('stats-report-confirm-msg'), {
      parse_mode: 'HTML',
      reply_markup: reportConfirmMenu
    })
  })
  .row()
  .text(ctx => ctx.t('stats-mega-report-btn'), async (ctx) => {
    const userId = ctx.from?.id
    if (!userId) return

    const { count } = await supabase
      .from('user_progress_reports')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (!count || count < 5) {
      await ctx.answerCallbackQuery({ text: ctx.t('stats-mega-report-not-enough'), show_alert: true })
      return
    }

    await ctx.editMessageText(ctx.t('stats-mega-report-confirm-msg'), {
      parse_mode: 'HTML',
      reply_markup: megaReportConfirmMenu
    })
  })
  .row()
  .text(ctx => ctx.t('stats-history-btn'), async (ctx) => {
    ctx.session.reportsPage = 0
    await showReportsHistory(ctx)
  })
  .row()
  .back(
    ctx => ctx.t('vocabulary-back'),
    async (ctx) => {
      const { getProfileText } = await import('#root/bot/helpers/profile.js')
      await ctx.editMessageText(await getProfileText(ctx), { parse_mode: 'HTML' })
    }
  )

const reportConfirmMenu = new Menu<Context>('report-confirm-menu')
  .text('✅', async (ctx) => await handleGenerateReport(ctx, false))
  .text('❌', async (ctx) => await showStatisticsMenu(ctx))

const megaReportConfirmMenu = new Menu<Context>('mega-report-confirm-menu')
  .text('✅', async (ctx) => await handleGenerateReport(ctx, true))
  .text('❌', async (ctx) => await showStatisticsMenu(ctx))

const reportsHistoryMenu = new Menu<Context>('reports-history-menu')
  .dynamic(async (ctx, range) => {
    const userId = ctx.from?.id
    if (!userId) return

    const page = ctx.session.reportsPage || 0
    const { data: reports } = await supabase
      .from('user_progress_reports')
      .select('id, created_at, is_mega_report')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(page * 5, (page + 1) * 5 - 1)

    reports?.forEach(report => {
      range.text(
        `${report.is_mega_report ? '⭐ ' : ''}${new Date(report.created_at).toLocaleDateString()}`,
        async (ctx) => {
          ctx.session.selectedReportId = report.id
          await showReportDetails(ctx)
        }
      ).row()
    })

    range.text('⬅️', async (ctx) => {
      ctx.session.reportsPage = Math.max(0, (ctx.session.reportsPage || 0) - 1)
      await showReportsHistory(ctx)
    })
    range.text('➡️', async (ctx) => {
      ctx.session.reportsPage = (ctx.session.reportsPage || 0) + 1
      await showReportsHistory(ctx)
    })
  })
  .row()
  .back(ctx => ctx.t('vocabulary-back'), async (ctx) => await showStatisticsMenu(ctx))

const reportDetailsMenu = new Menu<Context>('report-details-menu')
  .back(ctx => ctx.t('vocabulary-back'), async (ctx) => await showReportsHistory(ctx))

async function showStatisticsMenu(ctx: Context) {
  const userId = ctx.from?.id
  if (!userId) return

  const stats = await getWeeklyMistakeStats(userId)
  const statsText = await formatStatsText(ctx, stats)
  await ctx.editMessageText(statsText, { parse_mode: 'HTML', reply_markup: statisticsMenu })
}

async function showReportsHistory(ctx: Context) {
  await ctx.editMessageText(ctx.t('stats-history-title'), { parse_mode: 'HTML', reply_markup: reportsHistoryMenu })
}

async function showReportDetails(ctx: Context) {
  const reportId = ctx.session.selectedReportId
  if (!reportId) return

  const { data: report } = await supabase
    .from('user_progress_reports')
    .select('*')
    .eq('id', reportId)
    .single()

  if (!report) return

  const text = `<b>${report.is_mega_report ? '⭐ Мега-отчет' : '📊 Отчет'}</b> (${new Date(report.created_at).toLocaleDateString()})\n\n` +
               `🔍 <b>Weaknesses:</b> ${report.weaknesses.join(', ')}\n\n` +
               `💡 <b>Advice:</b>\n${report.advice}`

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: reportDetailsMenu })
}

async function handleGenerateReport(ctx: Context, isMega: boolean) {
  const userId = ctx.from?.id
  if (!userId) return

  await ctx.editMessageText(ctx.t('stats-ai-report-loading'), { parse_mode: 'HTML' })

  try {
    const langNames: Record<string, string> = { en: 'English', ru: 'Russian', de: 'German', fr: 'French', es: 'Spanish' }
    const uiLanguageName = langNames[ctx.session.__language_code || 'en'] || 'English'
    const aiModel = ctx.session.user?.selected_ai_model || 'gemini-2.5-flash-lite'

    let report
    if (isMega) {
      const { data: pastReports } = await supabase
        .from('user_progress_reports')
        .select('weaknesses, advice, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)
      
      report = await generateMegaReport(pastReports || [], uiLanguageName, aiModel)
    } else {
      const { data: mistakes } = await supabase
        .from('user_mistakes')
        .select('type, original_text, corrected_text')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      
      report = await generateProgressReport(mistakes || [], uiLanguageName, aiModel)
    }

    await supabase.from('user_progress_reports').insert({
      user_id: userId,
      weaknesses: report.mainWeaknesses,
      advice: report.advice,
      is_mega_report: isMega,
      ai_model_used: aiModel
    })

    const text = `<b>${isMega ? '⭐ Мега-отчет готов!' : '📊 Отчет готов!'}</b>\n\n` +
                 `🔍 <b>Weaknesses:</b> ${report.mainWeaknesses.join(', ')}\n\n` +
                 `💡 <b>Advice:</b>\n${report.advice}`

    await ctx.editMessageText(text, { 
      parse_mode: 'HTML', 
      reply_markup: new InlineKeyboard().text(ctx.t('vocabulary-back'), 'statistics-menu') 
    })
  } catch (error) {
    await ctx.editMessageText(ctx.t('stats-ai-report-error'), { 
      parse_mode: 'HTML',
      reply_markup: new InlineKeyboard().text(ctx.t('vocabulary-back'), 'statistics-menu')
    })
  }
}

statisticsMenu.register(reportConfirmMenu)
statisticsMenu.register(megaReportConfirmMenu)
statisticsMenu.register(reportsHistoryMenu)
statisticsMenu.register(reportDetailsMenu)
