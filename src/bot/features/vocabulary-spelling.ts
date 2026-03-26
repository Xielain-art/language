import type { Context } from '#root/bot/context.js'
import { checkSpellingAnswer } from '#root/bot/menu/vocabulary-spelling-menu.js'
import { Composer } from 'grammy'

export const vocabularySpellingFeature = new Composer<Context>()

const feature = vocabularySpellingFeature.chatType('private')

feature.on('message:text', async (ctx, next) => {
  // Only handle text messages when in vocabulary_typing state
  if (ctx.session.state !== 'vocabulary_typing') {
    return next()
  }

  const userAnswer = ctx.message.text
  
  // Skip if it's a command
  if (userAnswer.startsWith('/')) {
    return next()
  }

  // Check the spelling answer
  await checkSpellingAnswer(ctx, userAnswer)
})