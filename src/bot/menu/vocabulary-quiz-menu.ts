import type { Context } from '#root/bot/context.js'
import {
  getRandomUnlearnedWord,
  getRandomWordsForQuiz,
  updateWordAfterReview,
  resetWordProgress,
  getWordsForReview,
  type VocabularyItem
} from '#root/bot/services/vocabulary.js'
import { Menu } from '@grammyjs/menu'
import { InlineKeyboard } from 'grammy'

/**
 * Vocabulary Quiz Menu - Shows word and asks for translation
 */
export const vocabularyQuizMenu = new Menu<Context>('vocabulary-quiz-menu')
  .text(ctx => ctx.t('vocabulary-quiz-show-btn'), async (ctx) => {
    const wordId = ctx.session.selectedWordId
    if (!wordId) return

    const { data: word } = await getRandomUnlearnedWord(ctx.from!.id)
    if (!word) return

    // Get 3 random wrong options
    const { data: wrongOptions } = await getRandomWordsForQuiz(ctx.from!.id, wordId, 3)
    
    // Create options array with correct answer
    const options = [
      { text: word.translation, isCorrect: true },
      ...(wrongOptions || []).map(w => ({ text: w.translation, isCorrect: false }))
    ]
    
    // Shuffle options
    const shuffled = options.sort(() => Math.random() - 0.5)
    const correctIndex = shuffled.findIndex(o => o.isCorrect)

    // Store quiz data in session
    ctx.session.quizData = {
      correctIndex,
      explanation: `The correct translation of "${word.word}" is "${word.translation}"`,
      options: shuffled.map(o => o.text)
    }
    ctx.session.state = 'quiz'

    let text = `🎴 <b>What does this word mean?</b>\n\n🇬🇧 <b>${word.word}</b>\n\n`
    text += `Choose the correct translation:`

    await ctx.editMessageText(text, { 
      parse_mode: 'HTML',
      reply_markup: vocabularyQuizAnswerMenu
    })
  })
  .row()
  .text(ctx => ctx.t('vocabulary-quiz-skip-btn'), async (ctx) => {
    await loadNextQuizWord(ctx)
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
 * Vocabulary Quiz Answer Menu
 */
export const vocabularyQuizAnswerMenu = new Menu<Context>('vocabulary-quiz-answer-menu')
  .dynamic(async (ctx, range) => {
    const quizData = ctx.session.quizData
    if (!quizData) return

    // Get the options from the message text
    const messageText = ctx.callbackQuery?.message?.text || ''
    
    // Parse options from the message - they are stored in session
    const wordId = ctx.session.selectedWordId
    if (!wordId) return

    const { data: word } = await getRandomUnlearnedWord(ctx.from!.id)
    if (!word) return

    // Get 3 random wrong options
    const { data: wrongOptions } = await getRandomWordsForQuiz(ctx.from!.id, wordId, 3)
    
    // Create options array with correct answer
    const options = [
      { text: word.translation, isCorrect: true },
      ...(wrongOptions || []).map(w => ({ text: w.translation, isCorrect: false }))
    ]
    
    // Shuffle options
    const shuffled = options.sort(() => Math.random() - 0.5)
    
    shuffled.forEach((option, index) => {
      range.text(option.text, async (ctx) => {
        await handleVocabularyQuizAnswer(ctx, option.isCorrect, word, wordId)
      }).row()
    })
  })

/**
 * Handle vocabulary quiz answer
 */
async function handleVocabularyQuizAnswer(ctx: Context, isCorrect: boolean, word: VocabularyItem, wordId: string) {
  ctx.session.state = 'idle'
  ctx.session.quizData = undefined

  if (isCorrect) {
    // Update word progress with SRS
    await updateWordAfterReview(wordId, word.learning_stage)
    
    await ctx.editMessageText(
      `✅ <b>${ctx.t('vocabulary-quiz-correct')}</b>\n\n"${word.word}" → "${word.translation}"`,
      { 
        parse_mode: 'HTML',
        reply_markup: vocabularyQuizContinueMenu
      }
    )
  } else {
    // Reset word progress with SRS
    await resetWordProgress(wordId)
    
    await ctx.editMessageText(
      `❌ <b>${ctx.t('vocabulary-quiz-incorrect')}</b>\n\nThe correct answer was: "${word.translation}"`,
      { 
        parse_mode: 'HTML',
        reply_markup: vocabularyQuizContinueMenu
      }
    )
  }

  await ctx.answerCallbackQuery()
}

/**
 * Continue after quiz answer
 */
export const vocabularyQuizContinueMenu = new Menu<Context>('vocabulary-quiz-continue-menu')
  .text(ctx => ctx.t('vocabulary-quiz-next-btn'), async (ctx) => {
    await loadNextQuizWord(ctx)
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
 * Load next quiz word
 */
export async function loadNextQuizWord(ctx: Context) {
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
    await ctx.editMessageText(ctx.t('vocabulary-quiz-no-words'), {
      parse_mode: 'HTML',
      reply_markup: new InlineKeyboard().text(ctx.t('vocabulary-back'), 'nav_vocabulary')
    })
    return
  }

  ctx.session.selectedWordId = word.id

  // Get 3 random wrong options
  const { data: wrongOptions } = await getRandomWordsForQuiz(userId, word.id, 3)
  
  // Create options array with correct answer
  const options = [
    { text: word.translation, isCorrect: true },
    ...(wrongOptions || []).map(w => ({ text: w.translation, isCorrect: false }))
  ]
  
  // Shuffle options
  const shuffled = options.sort(() => Math.random() - 0.5)
  const correctIndex = shuffled.findIndex(o => o.isCorrect)

  // Store quiz data in session
  ctx.session.quizData = {
    correctIndex,
    explanation: `The correct translation of "${word.word}" is "${word.translation}"`,
    options: shuffled.map(o => o.text)
  }
  ctx.session.state = 'quiz'

  let text = `🎴 <b>What does this word mean?</b>\n\n🇬🇧 <b>${word.word}</b>\n\n`
  text += `Choose the correct translation:`

  await ctx.editMessageText(text, { 
    parse_mode: 'HTML',
    reply_markup: vocabularyQuizAnswerMenu
  })
}

vocabularyQuizMenu.register(vocabularyQuizAnswerMenu)
vocabularyQuizMenu.register(vocabularyQuizContinueMenu)