import type { Context } from '#root/bot/context.js'
import { LANGUAGE_LEVELS } from '#root/bot/constants/languale-levels.js'
import { mainMenu } from '#root/bot/menu/index.js'
import { supabase, updateUserPreferences } from '#root/services/supabase.js'
import { Menu } from '@grammyjs/menu'

export const languageLevelMenu = new Menu<Context>('language-level-menu')
  .dynamic(async (ctx, range) => {
    const userId = ctx.from?.id
    let currentLevel = ctx.session.languageLevel

    if (!currentLevel && userId) {
      const { data } = await supabase.from('users').select('level').eq('id', userId).single()
      currentLevel = data?.level
      ctx.session.languageLevel = currentLevel
    }

    for (const languageLevel of LANGUAGE_LEVELS) {
      range
        .text(
          `${currentLevel === languageLevel ? '✅ ' : ''}${languageLevel}`,
          async (ctx) => {
            if (userId) {
              await updateUserPreferences(userId, { level: languageLevel })
              ctx.session.languageLevel = languageLevel
            }

            await ctx.deleteMessage()

            await ctx.reply(ctx.t('level-selected', { level: languageLevel }))
            await ctx.reply(ctx.t('menu-main-title'), { reply_markup: mainMenu })
          },
        )
        .row()
    }
    range.back('⬅️ Back')
  })
