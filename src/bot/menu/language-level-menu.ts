import type { Context } from '#root/bot/context.js'
import { LANGUAGE_LEVELS } from '#root/bot/constants/languale-levels.js'
import { Menu, MenuRange } from '@grammyjs/menu'
import { setLanguageLevel } from '#root/bot/handlers/language-level/set-language-level.js'

export const languageLevelMenu = new Menu<Context>('language-level-menu')
  .dynamic(async (ctx) => {
    const range = new MenuRange<Context>()

    for (const languageLevel of LANGUAGE_LEVELS) {
      range
        .text(
          `${ctx.session.languageLevel === languageLevel ? '✅ ' : ''}${languageLevel}`,
          async (ctx) => {
            await setLanguageLevel(ctx, languageLevel)
          },
        )
        .row()
    }
    return range
  })
