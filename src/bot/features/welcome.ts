import type { Context } from '#root/bot/context.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { Composer } from 'grammy'
import { languageMenu } from '#root/bot/menu/index.js'

const composer = new Composer<Context>()

const feature = composer.chatType('private')

feature.command('start', logHandle('command-start'), async (ctx) => {
  await ctx.reply(ctx.t('start', { name: ctx.from!.first_name }))
  return ctx.reply(ctx.t('language'), {
    reply_markup: languageMenu,
  })
})


export { composer as welcomeFeature }
