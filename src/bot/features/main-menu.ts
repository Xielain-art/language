import type { Context } from '#root/bot/context.js'
import { Composer } from 'grammy'

const composer = new Composer<Context>()
const feature = composer.chatType('private')

feature.callbackQuery('enter_free_chat', async (ctx) => {
  try {
    await ctx.deleteMessage()
    ctx.session.state = 'free_chat'
    ctx.session.chatHistory = []
    await ctx.reply(ctx.t('free-chat-activated'), {
        reply_markup: {
            keyboard: [[{ text: ctx.t('free-chat-cancel-btn') }]],
            resize_keyboard: true
        }
    })
  } catch (error) {
    console.error('Error entering free chat:', error)
    await ctx.reply('Error starting chat session.')
  }
})

feature.callbackQuery('nav_roles', async (ctx) => {
    const { mainMenu } = await import('#root/bot/menu/index.js')
    await ctx.editMessageText(ctx.t('menu-roles'), { reply_markup: mainMenu })
    // Since mainMenu is already registered, grammy-menu handles the navigation 
    // when we update the reply_markup to the menu instance.
})

feature.callbackQuery('nav_vocabulary', async (ctx) => {
    const { mainMenu } = await import('#root/bot/menu/index.js')
    await ctx.editMessageText(ctx.t('menu-vocabulary'), { reply_markup: mainMenu })
})

feature.callbackQuery('nav_settings', async (ctx) => {
    const { mainMenu } = await import('#root/bot/menu/index.js')
    await ctx.editMessageText(ctx.t('menu-settings'), { reply_markup: mainMenu })
})

feature.callbackQuery(/^set_ui_(.+)$/, async (ctx) => {
    const localeCode = ctx.match[1]
    await ctx.i18n.setLocale(localeCode)
    await ctx.editMessageText(ctx.t('language-to-learn'))
    const { languageMenu } = await import('#root/bot/menu/index.js')
    await ctx.editMessageReplyMarkup({ reply_markup: languageMenu })
})

feature.callbackQuery('in_dev', async (ctx) => {
  await ctx.answerCallbackQuery(ctx.t('in-development'))
})

export { composer as mainMenuFeature }
