import type { Context } from '#root/bot/context.js'
import {
  getRandomUnlearnedWord,
  updateWordAfterReview,
  resetWordProgress,
  getWordsForReview,
  type VocabularyItem
} from '#root/bot/services/vocabulary.js'
import { Composer, InlineKeyboard } from 'grammy'

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

/**
 * Check spelling answer
 */
async function checkSpellingAnswer(ctx: Context, userAnswer: string) {
  const wordId = ctx.session.selectedWordId
  if (!wordId) return

  const { data: word } = await getRandomUnlearnedWord(ctx.from!.id)
  if (!word || word.id !== wordId) {
    ctx.session.state = 'idle'
    await ctx.reply(ctx.t('vocabulary-spelling-error'))
    return
  }

  const isCorrect = userAnswer.toLowerCase().trim() === word.word.toLowerCase().trim()

  if (isCorrect) {
    // Update word progress with SRS
    await updateWordAfterReview(wordId, word.learning_stage)
    
    await ctx.reply(
      `✅ <b>${ctx.t('vocabulary-spelling-correct')}</b>\n\n"${word.word}" → "${word.translation}"`,
      { 
        parse_mode: 'HTML',
        reply_markup: getVocabularySpellingContinueMenu(ctx)
      }
    )
  } else {
    // Reset word progress with SRS
    await resetWordProgress(wordId)
    
    await ctx.reply(
      `❌ <b>${ctx.t('vocabulary-spelling-incorrect')}</b>\n\nThe correct word was: "${word.word}"`,
      { 
        parse_mode: 'HTML',
        reply_markup: getVocabularySpellingContinueMenu(ctx)
      }
    )
  }

  ctx.session.state = 'idle'
}

/**
 * Continue after spelling answer
 */
function getVocabularySpellingContinueMenu(ctx: Context) {
  return new InlineKeyboard()
    .text(ctx.t('vocabulary-spelling-next-btn'), 'continue_spelling')
    .row()
    .text(ctx.t('vocabulary-back'), 'nav_vocabulary')
}

/**
 * Cancel spelling practice
 */
function getVocabularySpellingCancelMenu(ctx: Context) {
  return new InlineKeyboard()
    .text(ctx.t('vocabulary-spelling-skip-btn'), 'skip_spelling')
    .row()
    .text(ctx.t('vocabulary-spelling-cancel-btn'), 'cancel_spelling')
}

/**
 * Load next spelling word
 */
export async function loadNextSpellingWord(ctx: Context) {
  const userId = ctx.from?.id
  if (!userId) return

  // Get words due for review first
  const { data: reviewWords } = await getWordsForReview(userId)
  
  let word: VocabularyItem | null = null
  
  if (reviewWords && reviewWords.length > 0) {
    // Pick a random word from review list
    const randomIndex = Math.floor(Math.random() * reviewWords.length)
    word = reviewWords[randomIndex]
  } else {
    // Get random unlearned word
    const { data: randomWord } = await getRandomUnlearnedWord(userId)
    word = randomWord
  }

  if (!word) {
    await ctx.reply(ctx.t('vocabulary-spelling-no-words'), {
      parse_mode: 'HTML',
      reply_markup: new InlineKeyboard().text(ctx.t('vocabulary-back'), 'nav_vocabulary')
    })
    return
  }

  ctx.session.selectedWordId = word.id
  ctx.session.state = 'vocabulary_typing'

  let text = `🔤 <b>Spelling Practice</b>\n\n`
  text += `🇷🇺 <b>Translation:</b>\n<blockquote>${word.translation}</blockquote>\n\n`
  text += `Type the English word:`

  await ctx.reply(text, { 
    parse_mode: 'HTML',
    reply_markup: getVocabularySpellingCancelMenu(ctx)
  })
}

