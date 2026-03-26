import type { Context } from '#root/bot/context.js'
import { getVocabularyItemsPerPage } from '#root/bot/services/bot-settings.js'
import {
  getVocabularyPage,
  getVocabularyLanguages,
  getWordById,
  toggleWordStatus,
  deleteWord,
  getUnlearnedWords,
  getVocabularyStats,
  markWordAsLearned,
  getRandomUnlearnedWord,
  type VocabularyItem
} from '#root/bot/services/vocabulary.js'
import { Menu, MenuRange } from '@grammyjs/menu'

/**
 * Helper to fetch a page of vocabulary items
 */
async function fetchVocabularyPage(userId: number, isLearned: boolean, languageCode: string, page: number) {
  const itemsPerPage = await getVocabularyItemsPerPage()
  const { data, error, count } = await getVocabularyPage(userId, isLearned, languageCode, page, itemsPerPage)
  return { data, error, count, itemsPerPage }
}

/**
 * Main Vocabulary Menu: Select category (Learning / Learned)
 */
export const vocabularyMenu = new Menu<Context>('vocabulary-menu')
  .text(ctx => ctx.t('vocabulary-category-learning'), async (ctx) => {
    ctx.session.selectedVocabularyStatus = false
    await ctx.editMessageText(ctx.t('vocabulary-select-language'), { parse_mode: 'HTML' })
    ctx.menu.nav('vocabulary-language-menu')
  })
  .row()
  .text(ctx => ctx.t('vocabulary-category-learned'), async (ctx) => {
    ctx.session.selectedVocabularyStatus = true
    await ctx.editMessageText(ctx.t('vocabulary-select-language'), { parse_mode: 'HTML' })
    ctx.menu.nav('vocabulary-language-menu')
  })
  .row()
  .row()
  .text(ctx => ctx.t('menu-learn-words'), async (ctx) => {
    const { showLearnWords } = await import('#root/bot/menu/vocabulary-menu.js')
    await showLearnWords(ctx)
  })
  .row()
  .back(
    ctx => ctx.t('vocabulary-back'),
    async (ctx) => {
      const { getProfileText } = await import('#root/bot/helpers/profile.js')
      await ctx.editMessageText(await getProfileText(ctx), { parse_mode: 'HTML' })
    }
  )

/**
 * Language Selection Menu
 */
export const vocabularyLanguageMenu = new Menu<Context>('vocabulary-language-menu')
  .dynamic(async (ctx, range) => {
    const userId = ctx.from?.id
    if (!userId) return

    const { data: uniqueLangs, error } = await getVocabularyLanguages(
      userId,
      ctx.session.selectedVocabularyStatus ?? false
    )

    if (error || !uniqueLangs || uniqueLangs.length === 0) {
      await ctx.editMessageText(ctx.t('vocabulary-empty'))
      return
    }

    for (const lang of uniqueLangs) {
      range.text(lang.toUpperCase(), async (ctx) => {
        ctx.session.selectedVocabularyLanguage = lang
        ctx.session.vocabularyPage = 0
        await ctx.editMessageText(ctx.t('vocabulary-title'), { parse_mode: 'HTML' })
        ctx.menu.nav('vocabulary-words-menu')
      }).row()
    }
  })
  .back(
    ctx => ctx.t('vocabulary-back'),
    async (ctx) => {
      await ctx.editMessageText(ctx.t('vocabulary-title'), { parse_mode: 'HTML' })
    }
  )

/**
 * Words List Menu (Paginated)
 */
export const vocabularyWordsMenu = new Menu<Context>('vocabulary-words-menu')
  .dynamic(async (ctx, range) => {
    const userId = ctx.from?.id
    const isLearned = ctx.session.selectedVocabularyStatus ?? false
    const lang = ctx.session.selectedVocabularyLanguage ?? 'en'
    
    if (!userId) return

    if (ctx.session.vocabularyPage === undefined) {
      ctx.session.vocabularyPage = 0
    }

    const { data, error, count } = await fetchVocabularyPage(userId, isLearned, lang, ctx.session.vocabularyPage)

    if (error || !data || data.length === 0) {
      await ctx.editMessageText(ctx.t('vocabulary-empty'))
      return
    }

    for (const item of data) {
      range
        .text(item.word, async (ctx) => {
          ctx.session.selectedWordId = item.id
          await ctx.editMessageText(
            ctx.t('vocabulary-word-card', {
              word: item.word,
              translation: item.translation,
              status: item.is_learned ? ctx.t('vocabulary-status-learned') : ctx.t('vocabulary-status-learning')
            }),
            { parse_mode: 'HTML' }
          )
          ctx.menu.nav('word-card-menu')
        })
        .row()
    }

    const totalPages = Math.ceil((count || 0) / (await getVocabularyItemsPerPage()))
    const currentPage = ctx.session.vocabularyPage + 1

    if (totalPages > 1) {
      if (ctx.session.vocabularyPage > 0) {
        range.text(ctx.t('vocabulary-prev', { page: ctx.session.vocabularyPage }), async (ctx) => {
          ctx.session.vocabularyPage!--
          ctx.menu.update()
        })
      }
      if (ctx.session.vocabularyPage < totalPages - 1) {
        range.text(ctx.t('vocabulary-next', { page: currentPage + 1 }), async (ctx) => {
          ctx.session.vocabularyPage!++
          ctx.menu.update()
        })
      }
      range.row()
    }
  })
  .back(
    ctx => ctx.t('vocabulary-back'),
    async (ctx) => {
      await ctx.editMessageText(ctx.t('vocabulary-select-language'), { parse_mode: 'HTML' })
    }
  )

/**
 * Word Action Card
 */
export const wordCardMenu = new Menu<Context>('word-card-menu')
  .dynamic(async (ctx, range) => {
    const wordId = ctx.session.selectedWordId
    if (!wordId) return

    const { data: item } = await getWordById(wordId)

    if (!item) return

    const toggleLabel = item.is_learned ? ctx.t('vocabulary-mark-learning') : ctx.t('vocabulary-mark-learned')
    range.text(toggleLabel, async (ctx) => {
      await toggleWordStatus(wordId, item.is_learned)
      
      await ctx.editMessageText(
        ctx.t('vocabulary-word-card', {
          word: item.word,
          translation: item.translation,
          status: !item.is_learned ? ctx.t('vocabulary-status-learned') : ctx.t('vocabulary-status-learning')
        }),
        { parse_mode: 'HTML' }
      )
      ctx.menu.update()
    }).row()

    range.text(ctx.t('vocabulary-delete'), async (ctx) => {
      await deleteWord(wordId)
      await ctx.answerCallbackQuery({ text: '🗑 Deleted' })
      ctx.menu.back()
    }).row()
  })
  .back(
    ctx => ctx.t('vocabulary-back'),
    async (ctx) => {
      await ctx.editMessageText(ctx.t('vocabulary-title'), { parse_mode: 'HTML' })
    }
  )

/**
 * Flashcard Learning Menu
 */
export const learnWordsMenu = new Menu<Context>('learn-words-menu')
  .text(ctx => ctx.t('learn-word-show-btn'), async (ctx) => {
    const wordId = ctx.session.selectedWordId
    if (!wordId) return

    const { data: item } = await getWordById(wordId)

    if (!item) return

    await ctx.editMessageText(
      `🇬🇧 <b>${item.word}</b>\n\n🇷🇺 ${item.translation}`,
      { parse_mode: 'HTML' }
    )
    ctx.menu.nav('learn-word-actions-menu')
  })

/**
 * Actions after showing translation
 */
export const learnWordActionsMenu = new Menu<Context>('learn-word-actions-menu')
  .text(ctx => ctx.t('learn-word-know-btn'), async (ctx) => {
    const wordId = ctx.session.selectedWordId
    if (!wordId) return

    await markWordAsLearned(wordId)

    await ctx.answerCallbackQuery({ text: '✅ Marked as learned!' })
    
    // Load next word
    await loadNextWord(ctx)
  })
  .text(ctx => ctx.t('learn-word-learn-btn'), async (ctx) => {
    await ctx.answerCallbackQuery()
    await loadNextWord(ctx)
  })
  .row()
  .text(ctx => ctx.t('vocabulary-back'), async (ctx) => {
    await ctx.editMessageText(ctx.t('vocabulary-title'), { parse_mode: 'HTML' })
    ctx.menu.back()
  })

/**
 * Loads the next unlearned word for flashcard practice.
 */
async function loadNextWord(ctx: Context) {
  const userId = ctx.from?.id
  if (!userId) return

  // Get random unlearned word
  const { data: word, error } = await getRandomUnlearnedWord(userId)

  if (error || !word) {
    await ctx.editMessageText(ctx.t('learn-word-no-words'), { parse_mode: 'HTML' })
    return
  }
  
  ctx.session.selectedWordId = word.id

  await ctx.editMessageText(
    ctx.t('learn-word-title') + `\n\n🇬🇧 <b>${word.word}</b>`,
    { 
      parse_mode: 'HTML',
      reply_markup: learnWordsMenu
    }
  )
}

/**
 * Loads 5 random unlearned words for flashcard practice.
 */
async function loadFiveWords(ctx: Context) {
  const userId = ctx.from?.id
  if (!userId) return

  // Get all unlearned words
  const { data: words, error } = await getUnlearnedWords(userId)

  if (error || !words || words.length === 0) {
    await ctx.editMessageText(ctx.t('learn-word-no-words'), { parse_mode: 'HTML' })
    return
  }

  // Shuffle and pick 5 random words
  const shuffled = words.sort(() => Math.random() - 0.5)
  const selectedWords = shuffled.slice(0, 5)
  
  // Store the words in session for navigation
  ctx.session.learnWordsList = selectedWords.map((w: VocabularyItem) => w.id)
  ctx.session.learnWordsIndex = 0
  
  const word = selectedWords[0]
  ctx.session.selectedWordId = word.id

  const progressText = `📚 ${ctx.t('learn-word-progress', { learned: 1, total: selectedWords.length })}`
  
  await ctx.editMessageText(
    `${progressText}\n\n${ctx.t('learn-word-title')}\n\n🇬🇧 <b>${word.word}</b>`,
    { 
      parse_mode: 'HTML',
      reply_markup: learnWordsMenu
    }
  )
}

/**
 * Shows the learn words interface.
 */
export async function showLearnWords(ctx: Context) {
  const userId = ctx.from?.id
  if (!userId) {
    await ctx.reply(ctx.t('error-user-not-found'))
    return
  }

  // Get stats for progress display
  const { total, learned, error } = await getVocabularyStats(userId)

  if (error) {
    await ctx.reply(ctx.t('error-unexpected'))
    return
  }

  if (total === 0) {
    await ctx.reply(ctx.t('learn-word-no-words'))
    return
  }

  if (learned === total) {
    await ctx.reply(ctx.t('learn-word-complete'))
    return
  }

  await ctx.reply(ctx.t('learn-word-progress', { learned, total }))
  await loadNextWord(ctx)
}
