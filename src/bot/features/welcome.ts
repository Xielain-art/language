import type { Context } from '#root/bot/context.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { getMainMenuKeyboard, getLanguageMenuKeyboard } from '#root/bot/helpers/keyboards.js'
import { getProfileText } from '#root/bot/helpers/profile.js'
import { supabase } from '#root/services/supabase.js'
import { Composer } from 'grammy'
import { getUserProfile } from '#root/bot/services/user.js'

const composer = new Composer<Context>()

const feature = composer.chatType('private')

feature.command('start', logHandle('command-start'), async (ctx) => {
  try {
    const userId = ctx.from?.id
    if (userId) {
      // CRITICAL: Onboarding/Registration logic
      let profile = await getUserProfile(userId)

      if (!profile) {
        // User doesn't exist, insert them
        await supabase.from('users').insert({ id: userId })
        profile = await getUserProfile(userId)
      }

      if (profile) {
        ctx.session.user = profile
        ctx.session.userExists = true

        if (profile.level) {
          const { mainMenu } = await import('#root/bot/menu/index.js')
          return ctx.reply(getProfileText(ctx), {
            parse_mode: 'HTML',
            reply_markup: mainMenu,
          })
        }
      }
    }

    await ctx.reply(ctx.t('start', { name: ctx.from!.first_name }))
    const { languageMenu } = await import('#root/bot/menu/index.js')
    return ctx.reply(ctx.t('language'), {
      reply_markup: languageMenu,
    })
  } catch (error) {
    console.error('Error in /start command:', error)
    return ctx.reply('An error occurred. Please try /start again later.')
  }
})

export { composer as welcomeFeature }
