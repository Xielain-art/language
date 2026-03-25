import type { Context } from '#root/bot/context.js'

/**
 * Generates a formatted profile string for the user.
 */
export function getProfileText(ctx: Context): string {
  const user = ctx.session.user
  if (!user) return ''

  return ctx.t('menu-main-profile', {
    target_lang: user.target_language_name || 'English',
    level: user.level || 'Not set',
    tone: user.selected_tone_code || 'Friendly',
  })
}
