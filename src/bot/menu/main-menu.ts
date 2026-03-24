import type { Context } from '#root/bot/context.js'
import { supabase } from '#root/services/supabase.js'
import { Menu } from '@grammyjs/menu'

export const mainMenu = new Menu<Context>('main-menu')
  .text(
    ctx => ctx.t('menu-free-chat'),
    async (ctx) => {
      // Switch state to free_chat
      ctx.session.state = 'free_chat'
      ctx.session.chatHistory = []
      
      await ctx.deleteMessage().catch(() => {})
      await ctx.reply(ctx.t('free-chat-activated'))
    },
  )
  .row()
  .text(ctx => ctx.t('menu-roles'), ctx => ctx.menu.nav('roleplay-menu'))
  .row()
  .text(ctx => ctx.t('menu-vocabulary'), ctx => ctx.menu.nav('vocabulary-menu'))
  .row()
  .text(ctx => ctx.t('menu-settings'), ctx => ctx.menu.nav('settings-menu'))
