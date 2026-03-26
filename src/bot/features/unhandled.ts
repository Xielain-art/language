import type { Context } from '#root/bot/context.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { Composer } from 'grammy'

const composer = new Composer<Context>()

const feature = composer.chatType('private')

feature.on('message', logHandle('unhandled-message'), (ctx) => {
  // Don't show unhandled message for vocabulary_typing state
  // as it's handled by the vocabulary spelling feature
  if (ctx.session.state === 'vocabulary_typing') {
    return
  }
  
  // Handle text input during quiz
  if (ctx.session.state === 'quiz') {
    return ctx.reply(ctx.t('error-use-buttons'))
  }
  
  return ctx.reply(ctx.t('unhandled'))
})

feature.on('callback_query', logHandle('unhandled-callback-query'), (ctx) => {
  return ctx.answerCallbackQuery()
})

export { composer as unhandledFeature }
