import type { Context } from '#root/bot/context.js'
import { LANGUAGE_LEVELS } from '#root/bot/constants/language-levels.js'
import { mainMenu } from '#root/bot/menu/index.js'
import { Menu } from '@grammyjs/menu'
import { updateUserProfile } from '#root/bot/services/user.js'

/**
 * Common logic for level selection
 */
async function selectLevel(ctx: Context, languageLevel: string) {
  const userId = ctx.from?.id
  if (userId) {
    await updateUserProfile(userId, { level: languageLevel })
    if (ctx.session.user) {
      ctx.session.user.level = languageLevel
    }
  }

  await ctx.deleteMessage()
  await ctx.reply(ctx.t('level-selected', { level: languageLevel }))
  await ctx.reply(ctx.t('menu-main-title'), { reply_markup: mainMenu })
}

export const onboardingLevelMenu = new Menu<Context>('onboarding-level-menu')
  .dynamic(async (ctx, range) => {
    const currentLevel = ctx.session.user?.level
    for (const level of LANGUAGE_LEVELS) {
      range
        .text(
          `${currentLevel === level ? '✅ ' : ''}${level}`,
          ctx => selectLevel(ctx, level)
        )
        .row()
    }
  })
  .back('⬅️ Back')

export const settingsLevelMenu = new Menu<Context>('settings-level-menu')
  .dynamic(async (ctx, range) => {
    const currentLevel = ctx.session.user?.level
    for (const level of LANGUAGE_LEVELS) {
      range
        .text(
          `${currentLevel === level ? '✅ ' : ''}${level}`,
          ctx => selectLevel(ctx, level)
        )
        .row()
    }
  })
  .back('⬅️ Back')
