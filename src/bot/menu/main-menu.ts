import type { Context } from '#root/bot/context.js'
import { supabase } from '#root/services/supabase.js'
import { Menu } from '@grammyjs/menu'

export const mainMenu: Menu<Context> = new Menu<Context>('main-menu')
  .text(
    ctx => ctx.t('menu-free-chat'),
    async (ctx) => {
      await ctx.conversation.enter('free-chat')
    },
  )
  .row()
  .text(ctx => ctx.t('menu-roles'), ctx => ctx.menu.nav('roleplay-menu'))
  .row()
  .text(ctx => ctx.t('menu-vocabulary'), async (ctx) => {
    await ctx.deleteMessage()
    const userId = ctx.from?.id
    if (!userId)
      return

    const { data, error } = await supabase.from('vocabulary').select('*').eq('user_id', userId).limit(50)
    if (error || !data || data.length === 0) {
      return ctx.reply(ctx.t('vocabulary-empty'), { reply_markup: mainMenu })
    }

    let text = `📚 ${ctx.t('vocabulary-title')}\n\n`
    data.forEach((item) => {
      text += `• <b>${item.word}</b> — ${item.translation}\n`
    })

    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: mainMenu })
  })
  .row()
  .text(ctx => ctx.t('menu-settings'), ctx => ctx.menu.nav('settings-menu'))
