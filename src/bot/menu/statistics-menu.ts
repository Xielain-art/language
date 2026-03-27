import type { Context } from '#root/bot/context.js'
import { generateProgressReport, generateMegaReport } from '#root/bot/services/ai.js'
import { getBotSetting } from '#root/bot/services/bot-settings.js'
import { startPlacementTest } from '#root/bot/features/placement-test.js'
import {
  getWeeklyMistakeStats,
  getLastReportDate,
  getNewMistakesCount,
  saveReport,
  getReportsHistory,
  getReportById,
  getPastReports,
  getNewReportsCount,
  getMistakesSinceReport,
  type WeeklyStats
} from '#root/bot/services/statistics.js'
import { sendTelegramLog, LOG_TOPICS } from '#root/bot/services/telegram-logger.js'
import { Menu } from '@grammyjs/menu'
import { InlineKeyboard } from 'grammy'

function generateProgressBar(current: number, max: number, length: number = 10): string {
  const filled = Math.min(Math.round((current / max) * length), length)
  const empty = length - filled
  return '▓'.repeat(filled) + '░'.repeat(empty)
}

export async function formatStatsText(
  ctx: Context,
  stats: { counts: Record<string, number>; total: number } | null,
  progress: { mistakes: number, minMistakes: number, reports: number, minReports: number }
) {
  let text = `${ctx.t('stats-title')}\n\n`

  if (stats && stats.total > 0) {
    text += `${ctx.t('stats-grammar', { count: stats.counts.Grammar })}\n`
    text += `${ctx.t('stats-vocabulary', { count: stats.counts.Vocabulary })}\n`
    text += `${ctx.t('stats-punctuation', { count: stats.counts.Punctuation })}\n`
    text += `${ctx.t('stats-spelling', { count: stats.counts.Spelling })}\n\n`
    text += `${ctx.t('stats-total', { count: stats.total })}`

    const topWeakness = Object.entries(stats.counts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])[0]

    if (topWeakness) {
      const icons: Record<string, string> = { Grammar: '📝', Vocabulary: '📖', Punctuation: '📍', Spelling: '🔤' }
      text += `\n\n💡 ${ctx.t('stats-top-weakness', { weakness: `${icons[topWeakness[0]]} ${topWeakness[0]}` })}`
    }
  } else {
    text += ctx.t('stats-no-data')
  }

  // --- Progress bars (Level Up) ---
  text += `\n\n📈 <b>${ctx.t('stats-progress-title')}</b>\n`

  const mistakesBar = generateProgressBar(progress.mistakes, progress.minMistakes)
  text += `\n📊 ${ctx.t('stats-mistakes-progress', { count: progress.mistakes, min: progress.minMistakes })}\n<code>${mistakesBar}</code>`

  const reportsBar = generateProgressBar(progress.reports, progress.minReports)
  text += `\n⭐️ ${ctx.t('stats-reports-progress', { count: progress.reports, min: progress.minReports })}\n<code>${reportsBar}</code>`

  if (progress.reports >= progress.minReports) {
    text += `\n\n🎉 <i>${ctx.t('stats-mega-ready')}</i>`
  } else if (progress.mistakes >= progress.minMistakes) {
    text += `\n\n💡 <i>${ctx.t('stats-report-ready')}</i>`
  }

  return text
}

export const statisticsMenu = new Menu<Context>('statistics-menu')
  .text(ctx => ctx.t('stats-ai-report-btn'), async (ctx) => {
    const userId = ctx.from?.id
    if (!userId) return

    const minMistakes = Number(await getBotSetting('stats_min_mistakes')) || 10
    const { data: lastReportDate } = await getLastReportDate(userId, false)
    const { count: newMistakesCount } = await getNewMistakesCount(userId, lastReportDate || undefined)

    if (newMistakesCount < minMistakes) {
      const needed = minMistakes - newMistakesCount
      await ctx.answerCallbackQuery()
      await ctx.editMessageText(ctx.t('stats-need-more-mistakes', { count: needed }), {
        parse_mode: 'HTML',
        reply_markup: new InlineKeyboard().text(ctx.t('vocabulary-back'), 'statistics-menu')
      })
      return
    }

    await ctx.editMessageText(ctx.t('stats-report-confirm-msg'), { parse_mode: 'HTML', reply_markup: reportConfirmMenu })
  })
  .row()
  .text(ctx => ctx.t('stats-mega-report-btn'), async (ctx) => {
    const userId = ctx.from?.id
    if (!userId) return

    const minReports = Number(await getBotSetting('stats_min_reports_for_mega')) || 5
    const { data: lastMegaReportDate } = await getLastReportDate(userId, true)
    const { count: newReportsCount } = await getNewReportsCount(userId, lastMegaReportDate || undefined)

    if (newReportsCount < minReports) {
      const needed = minReports - newReportsCount
      await ctx.answerCallbackQuery()
      await ctx.editMessageText(ctx.t('stats-need-more-reports', { count: needed }), {
        parse_mode: 'HTML',
        reply_markup: new InlineKeyboard().text(ctx.t('vocabulary-back'), 'statistics-menu')
      })
      return
    }

    await ctx.editMessageText(ctx.t('stats-mega-report-confirm-msg'), { parse_mode: 'HTML', reply_markup: megaReportConfirmMenu })
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

    const paginationLimit = Number(await getBotSetting('stats_pagination_limit')) || 5
    const page = ctx.session.reportsPage || 0
    const { data: reports } = await getReportsHistory(userId, page, paginationLimit)

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
  .back(ctx => ctx.t('vocabulary-back'), async (ctx) => await showReportsHistory(ctx))

const reportDetailsMenu = new Menu<Context>('report-details-menu')
  .back(ctx => ctx.t('vocabulary-back'), async (ctx) => await showReportsHistory(ctx))

async function showStatisticsMenu(ctx: Context) {
  const userId = ctx.from?.id
  if (!userId) return

  const minMistakes = Number(await getBotSetting('stats_min_mistakes')) || 10
  const minReports = Number(await getBotSetting('stats_min_reports_for_mega')) || 5

  const { data: lastReportDate } = await getLastReportDate(userId, false)
  const { data: lastMegaReportDate } = await getLastReportDate(userId, true)

  const { count: newMistakesCount } = await getNewMistakesCount(userId, lastReportDate || undefined)
  const { count: newReportsCount } = await getNewReportsCount(userId, lastMegaReportDate || undefined)

  const stats = await getWeeklyMistakeStats(userId)
  const statsText = await formatStatsText(ctx, stats, {
      mistakes: newMistakesCount,
      minMistakes,
      reports: newReportsCount,
      minReports
  })
  await ctx.editMessageText(statsText, { parse_mode: 'HTML', reply_markup: statisticsMenu })
}

async function showReportsHistory(ctx: Context) {
  await ctx.editMessageText(ctx.t('stats-history-title'), { parse_mode: 'HTML', reply_markup: reportsHistoryMenu })
}

async function showReportDetails(ctx: Context) {
  const reportId = ctx.session.selectedReportId
  if (!reportId) return

  const { data: report } = await getReportById(reportId)

  if (!report) return

  const typeKey = report.is_mega_report ? 'stats-type-mega' : 'stats-type-normal'
  const typeText = ctx.t(typeKey)
  const dateText = new Date(report.created_at).toLocaleDateString()

  const text = ctx.t('stats-report-card-details', {
    type: typeText,
    date: dateText,
    weaknesses: report.weaknesses.join(', '),
    advice: report.advice
  })

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: reportDetailsMenu })
}

async function handleGenerateReport(ctx: Context, isMega: boolean) {
  const userId = ctx.from?.id
  if (!userId) return

  await ctx.editMessageText(ctx.t('stats-ai-report-loading'), { parse_mode: 'HTML' })

  try {
    const reportLanguage = ctx.session.user?.report_language_name || ctx.session.__language_code || 'en'
    const aiModel = ctx.session.user?.selected_ai_model || 'gemini-2.5-flash-lite'
    const userLevel = ctx.session.user?.level || 'B1'

    const mistakesLimit = Number(await getBotSetting('stats_mistakes_limit')) || 50

    let report
    if (isMega) {
      const { data: lastMegaReportDate } = await getLastReportDate(userId, true)
      const { data: pastReports } = await getPastReports(userId, lastMegaReportDate || undefined, 10)
      report = await generateMegaReport(pastReports || [], reportLanguage, aiModel, userLevel)
    } else {
      const { data: lastReportDate } = await getLastReportDate(userId, false)
      const { data: mistakes } = await getMistakesSinceReport(userId, lastReportDate || undefined, mistakesLimit)
      report = await generateProgressReport(mistakes || [], reportLanguage, aiModel)
    }

    await saveReport(userId, report.mainWeaknesses, report.advice, isMega, aiModel)

    const logChatId = ctx.config.logChatId
    if (logChatId) {
      const reportType = isMega ? 'Mega Report' : 'Progress Report'
      let extraLog = ''
      if (report.readyForLevelUp) {
        extraLog = '\n<b>🎓 Level Up Recommended by AI!</b>'
      }

      await sendTelegramLog(
        ctx.api,
        logChatId,
        LOG_TOPICS.PROGRESS.key,
        `📈 <b>${reportType} Generated</b>\n\n` +
        `<b>User:</b> ${ctx.from?.first_name} (${userId})\n` +
        `<b>Model:</b> ${aiModel}\n` +
        `<b>Weaknesses:</b> ${report.mainWeaknesses.join(', ')}\n` +
        `<b>Advice:</b> ${report.advice.substring(0, 300)}${extraLog}`
      )
    }

    const readyKey = isMega ? 'stats-report-ready-mega' : 'stats-report-ready-normal'
    const typeText = isMega ? ctx.t('stats-type-mega') : ctx.t('stats-type-normal')

    let text = ctx.t('stats-report-card-details', {
      type: typeText,
      date: new Date().toLocaleDateString(),
      weaknesses: report.mainWeaknesses.join(', '),
      advice: report.advice
    })

    let keyboard = new InlineKeyboard().text(ctx.t('vocabulary-back'), 'statistics-menu')

    if (report.readyForLevelUp && userLevel !== 'C2') {
       text += `\n\n${ctx.t('stats-level-up-suggestion')}`
       keyboard = new InlineKeyboard()
          .text(ctx.t('stats-level-up-btn'), 'start_level_up_exam')
          .row()
          .text(ctx.t('vocabulary-back'), 'statistics-menu')
    }

    await ctx.editMessageText(`${ctx.t(readyKey)}\n\n${text}`, { parse_mode: 'HTML', reply_markup: keyboard })
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