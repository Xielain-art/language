import type { Context } from '#root/bot/context.js'
import type { NextFunction } from 'grammy'
import { supabase } from '#root/services/supabase.js'

export async function userUpsert(ctx: Context, next: NextFunction) {
  if (ctx.from && ctx.chat?.type === 'private' && !ctx.session.userExists) {
    const { error } = await supabase.from('users').upsert({
      id: ctx.from.id,
    }, { onConflict: 'id' }).select()

    if (error) {
      ctx.logger.error({
        msg: 'Failed to upsert user',
        error,
        userId: ctx.from.id,
      })
    }
    else {
      ctx.session.userExists = true
    }
  }

  return next()
}
