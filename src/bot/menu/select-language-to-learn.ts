import type { Context } from '#root/bot/context.js'
import { AVIABLE_LANGUAGES } from '#root/bot/constants/aviable-languages.js'
import { Menu, MenuRange } from '@grammyjs/menu'

export const selectLanguageToLearnMenu = new Menu<Context>('select-language-to-learn-menu')
  .dynamic((ctx) => {
    const range = new MenuRange<Context>()

    for (const language of AVIABLE_LANGUAGES) {
      range
        .text(
          `${ctx.session.languageToLearn === language ? '✅ ' : ''}${language.toUpperCase()}`,
          async (ctx) => {
            ctx.session.languageToLearn = language
            await ctx.editMessageText(ctx.t('language-level'))
            ctx.menu.nav('language-level-menu')
          },
        )
        .row()
    }
    range.back('⬅️ Back')
    return range
  })