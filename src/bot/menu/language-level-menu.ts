import type { Context } from '#root/bot/context.js'
import { LANGUAGE_LEVELS } from '#root/bot/constants/language-levels.js'
import { Menu } from '@grammyjs/menu'
import { updateUserProfile } from '#root/bot/services/user.js'
import { getProfileText } from '#root/bot/helpers/profile.js'
import { startPlacementTest } from '#root/bot/features/placement-test.js'

async function selectLevel(ctx: Context, languageLevel: string) {
  const userId = ctx.from?.id
  if (userId) {
    try {
      await updateUserProfile(userId, { level: languageLevel, level_selected: true })
      if (ctx.session.user) {
        ctx.session.user.level = languageLevel
        ctx.session.user.level_selected = true
      }
    } catch (err) {
      console.error('Failed to update user level:', err)
      await ctx.answerCallbackQuery({ text: ctx.t('error-saving-selection') })
      return
    }
  }

  await ctx.deleteMessage()
  await ctx.reply(ctx.t('level-selected', { level: languageLevel }))
  
  const { mainMenu } = await import('#root/bot/menu/index.js')
  const profileText = await getProfileText(ctx)
  if (profileText) {
    await ctx.reply(profileText, { reply_markup: mainMenu, parse_mode: 'HTML' })
  } else {
    await ctx.reply(ctx.t('menu-main-title'), { reply_markup: mainMenu })
  }
}

export const onboardingLevelMenu = new Menu<Context>('onboarding-level-menu')
  .dynamic(async (ctx, range) => {
    const currentLevel = ctx.session.user?.level
    for (const level of LANGUAGE_LEVELS) {
      range.text(`${currentLevel === level ? '✅ ' : ''}${level}`, ctx => selectLevel(ctx, level)).row()
    }
    range.text(`🤖 ${ctx.t('determine-level-ai')}`, async (ctx) => {
      await ctx.answerCallbackQuery()
      await startPlacementTest(ctx)
    })
  })
  .back('⬅️ Back', async (ctx) => {
      await ctx.editMessageText(ctx.t('language-level'), { parse_mode: 'HTML' })
  })

export const settingsLevelMenu = new Menu<Context>('settings-level-menu')
  .dynamic(async (ctx, range) => {
    const currentLevel = ctx.session.user?.level
    for (const level of LANGUAGE_LEVELS) {
      range.text(`${currentLevel === level ? '✅ ' : ''}${level}`, ctx => selectLevel(ctx, level)).row()
    }
    range.text(`🤖 ${ctx.t('determine-level-ai')}`, async (ctx) => {
      await ctx.answerCallbackQuery()
      await startPlacementTest(ctx)
    })
  })
  .back('⬅️ Back', async (ctx) => {
      await ctx.editMessageText(ctx.t('menu-settings'), { parse_mode: 'HTML' })
  })