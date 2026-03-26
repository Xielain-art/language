import type { Context } from '#root/bot/context.js'
import {
  getRandomUnlearnedWord,
  updateWordAfterReview,
  resetWordProgress,
  getWordsForReview,
  type VocabularyItem
} from '#root/bot/services/vocabulary.js'
import { Menu } from '@grammyjs/menu'
import { InlineKeyboard } from 'grammy'

/**
 * Vocabulary Spelling Menu - Shows translation and asks for word
 */
export const vocabularySpellingMenu = new Menu<Context>('vocabulary-spelling-menu')
  .text(ctx => ctx.t('vocabulary-spelling-start-btn'), async (ctx) => {
    await loadNextSpellingWord(ctx)
  })
  .row()
  .back(
    ctx => ctx.t('vocabulary-back'),
    async (ctx) => {
      const { vocabularyMenu } = await import('#root/bot/menu/vocabulary-menu.js')
      await ctx.editMessageText(ctx.t('vocabulary-title'), { parse_mode: 'HTML' })
      ctx.menu.nav('vocabulary-menu')
    }
  )

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
    await ctx.editMessageText(ctx.t('vocabulary-spelling-no-words'), {
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

  await ctx.editMessageText(text, { 
    parse_mode: 'HTML',
    reply_markup: vocabularySpellingCancelMenu
  })
}

/**
 * Cancel spelling practice
 */
export const vocabularySpellingCancelMenu = new Menu<Context>('vocabulary-spelling-cancel-menu')
  .text(ctx => ctx.t('vocabulary-spelling-skip-btn'), async (ctx) => {
    const wordId = ctx.session.selectedWordId
    if (wordId) {
      // Reset word progress when skipped
      await resetWordProgress(wordId)
    }
    ctx.session.state = 'idle'
    await loadNextSpellingWord(ctx)
  })
  .row()
  .text(ctx => ctx.t('vocabulary-spelling-cancel-btn'), async (ctx) => {
    ctx.session.state = 'idle'
    ctx.session.selectedWordId = undefined
    const { vocabularyMenu } = await import('#root/bot/menu/vocabulary-menu.js')
    await ctx.editMessageText(ctx.t('vocabulary-title'), { parse_mode: 'HTML' })
    ctx.menu.nav('vocabulary-menu')
  })

/**
 * Check spelling answer
 */
export async function checkSpellingAnswer(ctx: Context, userAnswer: string) {
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
        reply_markup: vocabularySpellingContinueMenu
      }
    )
  } else {
    // Reset word progress with SRS
    await resetWordProgress(wordId)
    
    await ctx.reply(
      `❌ <b>${ctx.t('vocabulary-spelling-incorrect')}</b>\n\nThe correct word was: "${word.word}"`,
      { 
        parse_mode: 'HTML',
        reply_markup: vocabularySpellingContinueMenu
      }
    )
  }

  ctx.session.state = 'idle'
}

/**
 * Continue after spelling answer
 */
export const vocabularySpellingContinueMenu = new Menu<Context>('vocabulary-spelling-continue-menu')
  .text(ctx => ctx.t('vocabulary-spelling-next-btn'), async (ctx) => {
    await loadNextSpellingWord(ctx)
  })
  .row()
  .back(
    ctx => ctx.t('vocabulary-back'),
    async (ctx) => {
      const { vocabularyMenu } = await import('#root/bot/menu/vocabulary-menu.js')
      await ctx.editMessageText(ctx.t('vocabulary-title'), { parse_mode: 'HTML' })
      ctx.menu.nav('vocabulary-menu')
    }
  )

vocabularySpellingMenu.register(vocabularySpellingCancelMenu)
vocabularySpellingMenu.register(vocabularySpellingContinueMenu)