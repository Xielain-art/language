import type { Context } from '#root/bot/context.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { languageMenu, mainMenu } from '#root/bot/menu/index.js'
import { supabase } from '#root/services/supabase.js'
import { Composer } from 'grammy'

const composer = new Composer<Context>()

const feature = composer.chatType('private')

feature.command('start', logHandle('command-start'), async (ctx) => {
  const userId = ctx.from?.id
  if (userId) {
    // CRITICAL: Onboarding/Registration logic
    const { data, error } = await supabase.from('users').select('level').eq('id', userId).single()

    if (error && error.code === 'PGRST116') {
      // User doesn't exist, insert them
      await supabase.from('users').insert({ id: userId })
      ctx.session.userExists = true
    }
    else if (data?.level) {
      ctx.session.userExists = true
      return ctx.reply(ctx.t('welcome-back'), {
        reply_markup: mainMenu,
      })
    }
  }

  await ctx.reply(ctx.t('start', { name: ctx.from!.first_name }))
  return ctx.reply(ctx.t('language'), {
    reply_markup: languageMenu,
  })
})

export { composer as welcomeFeature }
