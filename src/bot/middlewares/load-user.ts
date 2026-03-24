import type { Context } from '#root/bot/context.js'
import type { NextFunction } from 'grammy'
import { getUserProfile } from '#root/bot/services/user.js'

export async function loadUser(ctx: Context, next: NextFunction) {
  if (ctx.from && ctx.chat?.type === 'private') {
    // CRITICAL: Only load if session user is missing
    // or if specifically requested (could add a flag here)
    if (!ctx.session.user) {
      const profile = await getUserProfile(ctx.from.id)
      if (profile) {
        ctx.session.user = profile
        ctx.session.userExists = true
      }
    }
  }

  return next()
}
