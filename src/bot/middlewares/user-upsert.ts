import type { NextFunction } from 'grammy'
import type { Context } from '#root/bot/context.js'
import { supabase } from '#root/services/supabase.js'

export async function userUpsert(ctx: Context, next: NextFunction) {
  if (ctx.from && ctx.chat?.type === 'private') {
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
  }

  return next()
}
