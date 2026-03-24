import type { Context } from '#root/bot/context.js'
import { mainMenu } from '#root/bot/menu/index.js'
import { Composer } from 'grammy'

const composer = new Composer<Context>()
const feature = composer.chatType('private')

feature.callbackQuery('enter_free_chat', async (ctx) => {
  await ctx.deleteMessage()
  await ctx.conversation.enter('free-chat')
})

feature.callbackQuery('in_dev', async (ctx) => {
  await ctx.answerCallbackQuery(ctx.t('in-development'))
})

feature.callbackQuery('back_to_main', async (ctx) => {
  await ctx.reply(ctx.t('menu-main-title'), { reply_markup: mainMenu })
})

export { composer as mainMenuFeature }
