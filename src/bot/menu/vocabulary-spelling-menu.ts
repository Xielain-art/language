import type { Context } from '#root/bot/context.js'
import { loadNextSpellingWord } from '#root/bot/features/vocabulary-spelling.js'
import { Menu } from '@grammyjs/menu'

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
