import type { Context } from '#root/bot/context.js'
import { LANGUAGE_LEVELS } from '#root/bot/constants/languale-levels.js'
import { Menu, MenuRange } from '@grammyjs/menu'
import { mainMenu } from '#root/bot/menu/main-menu.js'

export const languageLevelMenu = new Menu<Context>('language-level-menu')
  .dynamic((ctx) => {
    const range = new MenuRange<Context>()

    for (const languageLevel of LANGUAGE_LEVELS) {
      range
        .text(
          `${ctx.session.languageLevel === languageLevel ? '✅ ' : ''}${languageLevel}`,
          async (ctx) => {
            ctx.session.languageLevel = languageLevel
            
            await ctx.deleteMessage()
            
            await ctx.reply(ctx.t('level-selected', { level: languageLevel }))
            await ctx.reply(ctx.t('menu-main-title'), { reply_markup: mainMenu })
          },
        )
        .row()
    }
    range.back('⬅️ Back')
    return range
  })