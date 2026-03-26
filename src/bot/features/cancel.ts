import type { Context } from '#root/bot/context.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { Composer } from 'grammy'

const composer = new Composer<Context>()

const feature = composer.chatType('private')

/**
 * Global /cancel command handler
 * Resets all temporary session state and returns user to idle
 */
feature.command('cancel', logHandle('cancel-command'), async (ctx) => {
  // Clear ALL temporary session variables
  ctx.session.state = 'idle'
  ctx.session.chatHistory = []
  ctx.session.quizData = undefined
  ctx.session.placementTestData = undefined
  ctx.session.selectedWordId = undefined
  
  await ctx.reply(ctx.t('operation-cancelled'))
})

export { composer as cancelFeature }