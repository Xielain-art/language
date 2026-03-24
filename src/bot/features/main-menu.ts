import type { Context } from '#root/bot/context.js'
import { Composer } from 'grammy'

const composer = new Composer<Context>()
const feature = composer.chatType('private')

feature.callbackQuery('enter_free_chat', async (ctx) => {
  await ctx.deleteMessage()
  await ctx.conversation.enter('freeChatConversation')
})

feature.callbackQuery('in_dev', async (ctx) => {
  await ctx.answerCallbackQuery(ctx.t('in-development'))
})

export { composer as mainMenuFeature }
