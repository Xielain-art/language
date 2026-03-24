import type { LANGUAGE_LEVELS } from '#root/bot/constants/language-levels.js'
import type { Context } from '#root/bot/context.js'

export async function setLanguageLevel(ctx: Context, languageLevel: typeof LANGUAGE_LEVELS[number]) {
  ctx.session.languageLevel = languageLevel
  await ctx.editMessageText(ctx.t('language-select'))
  ctx.menu.nav('select-language-to-learn-menu')
}
