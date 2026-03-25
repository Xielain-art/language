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
    await ctx.editMessageText(await getProfileText(ctx), { reply_markup: mainMenu, parse_mode: 'HTML' })
})

feature.callbackQuery('nav_vocabulary', async (ctx) => {
    const { mainMenu } = await import('#root/bot/menu/index.js')
    await ctx.editMessageText(await getProfileText(ctx), { reply_markup: mainMenu, parse_mode: 'HTML' })
})

feature.callbackQuery('nav_settings', async (ctx) => {
    const { mainMenu } = await import('#root/bot/menu/index.js')
    await ctx.editMessageText(await getProfileText(ctx), { reply_markup: mainMenu, parse_mode: 'HTML' })
})

feature.callbackQuery('nav_about', async (ctx) => {
    const { mainMenu } = await import('#root/bot/menu/index.js')
    await ctx.editMessageText(ctx.t('about-text'), { reply_markup: mainMenu, parse_mode: 'HTML' })
})

feature.callbackQuery('in_dev', async (ctx) => {
  await ctx.answerCallbackQuery(ctx.t('in-development'))
})

export { composer as mainMenuFeature }
