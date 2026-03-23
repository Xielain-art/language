import type { Context } from '#root/bot/context.js'
import { LANGUAGE_LEVELS } from '#root/bot/constants/languale-levels.js'

export const setLanguageLevel = async (ctx: Context, languageLevel: typeof LANGUAGE_LEVELS[number]) => {
  ctx.session.languageLevel = languageLevel
  await ctx.editMessageText(ctx.t('language-select'))
  ctx.menu.nav('select-language-to-learn-menu')
}

