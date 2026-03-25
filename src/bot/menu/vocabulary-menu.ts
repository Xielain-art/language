import type { Context } from '#root/bot/context.js'
import { supabase } from '#root/services/supabase.js'
import { Menu, MenuRange } from '@grammyjs/menu'

const ITEMS_PER_PAGE = 10

/**
 * Helper to fetch a page of vocabulary items
 */
async function fetchVocabularyPage(userId: number, isLearned: boolean, languageCode: string, page: number) {
  const from = page * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1

  const { data, error, count } = await supabase
    .from('vocabulary')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_learned', isLearned)
    .eq('language_code', languageCode)
    .order('created_at', { ascending: false })
    .range(from, to)

  return { data, error, count }
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

    const { data: languages, error } = await supabase
      .from('vocabulary')
      .select('language_code')
      .eq('user_id', userId)
      .eq('is_learned', ctx.session.selectedVocabularyStatus)

    if (error || !languages) {
      await ctx.editMessageText(ctx.t('vocabulary-empty'))
      return
    }

    const uniqueLangs = [...new Set(languages.map(l => l.language_code))]

    for (const lang of uniqueLangs) {
      if (!lang) continue
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

    const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE)
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

    const { data: item } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('id', wordId)
      .single()

    if (!item) return

    const toggleLabel = item.is_learned ? ctx.t('vocabulary-mark-learning') : ctx.t('vocabulary-mark-learned')
    range.text(toggleLabel, async (ctx) => {
      await supabase
        .from('vocabulary')
        .update({ is_learned: !item.is_learned })
        .eq('id', wordId)
      
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
      await supabase.from('vocabulary').delete().eq('id', wordId)
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
