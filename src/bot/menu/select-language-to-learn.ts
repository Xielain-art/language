import type { Context } from '#root/bot/context.js'
import { AVIABLE_LANGUAGES } from '#root/bot/constants/aviable-languages.js'
import { Menu, MenuRange } from '@grammyjs/menu'
import { setLanguageLevel } from '#root/bot/handlers/language-level/set-language-level.js'

export const selectLanguageToLearnMenu = new Menu<Context>('select-language-to-learn-menu')
  .dynamic(async (ctx) => {
    const range = new MenuRange<Context>()

    for (const language of AVIABLE_LANGUAGES) {
      range
        .text(
          `${ctx.session.languageToLearn === language ? '✅ ' : ''}${language}`,
          async (ctx) => {
            ctx.session.languageToLearn = language
            ctx.menu.update()
          },
        )
        .row()
    }
    return range
  })
