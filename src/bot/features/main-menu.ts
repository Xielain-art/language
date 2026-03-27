import type { Context } from '#root/bot/context.js'
import { getProfileText } from '#root/bot/helpers/profile.js'
import { Composer, InlineKeyboard } from 'grammy'

const composer = new Composer<Context>()
const feature = composer.chatType('private')

feature.callbackQuery('enter_free_chat', async (ctx) => {
  try {
    await ctx.deleteMessage()
    ctx.session.state = 'free_chat'
    ctx.session.chatHistory = []
    
    const activationText = `🎙 <b>${ctx.t('free-chat-activated')}</b>`
    
    const inlineCancelKeyboard = new InlineKeyboard()
        .text(ctx.t('free-chat-cancel-btn'), 'cancel_free_chat')
    
    await ctx.reply(activationText, {
        parse_mode: 'HTML',
        reply_markup: inlineCancelKeyboard
    })
  } catch (error) {
    console.error('Error entering free chat:', error)
    await ctx.reply('Error starting chat session.')
  }
})

feature.callbackQuery('nav_roles', async (ctx) => {
    const { mainMenu } = await import('#root/bot/menu/index.js')
    const profileText = await getProfileText(ctx)
    await ctx.editMessageText(profileText, { reply_markup: mainMenu, parse_mode: 'HTML' })
})

feature.callbackQuery('nav_vocabulary', async (ctx) => {
    const { mainMenu } = await import('#root/bot/menu/index.js')
    const profileText = await getProfileText(ctx)
    await ctx.editMessageText(profileText, { reply_markup: mainMenu, parse_mode: 'HTML' })
})

feature.callbackQuery('nav_settings', async (ctx) => {
    const { mainMenu } = await import('#root/bot/menu/index.js')
    const profileText = await getProfileText(ctx)
    await ctx.editMessageText(profileText, { reply_markup: mainMenu, parse_mode: 'HTML' })
})

feature.callbackQuery('nav_about', async (ctx) => {
    const { mainMenu } = await import('#root/bot/menu/index.js')
    const aboutText = ctx.t('about-text')
    await ctx.editMessageText(aboutText, { reply_markup: mainMenu, parse_mode: 'HTML' })
})

feature.callbackQuery('in_dev', async (ctx) => {
  await ctx.answerCallbackQuery(ctx.t('in-development'))
})

feature.callbackQuery('statistics-menu', async (ctx) => {
  const { statisticsMenu, formatStatsText } = await import('#root/bot/menu/statistics-menu.js')
  const { getWeeklyMistakeStats, getLastReportDate, getNewMistakesCount, getNewReportsCount } = await import('#root/bot/services/statistics.js')
  const { getBotSetting } = await import('#root/bot/services/bot-settings.js')

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
  await ctx.editMessageText(statsText, { reply_markup: statisticsMenu, parse_mode: 'HTML' })
})

export { composer as mainMenuFeature }
