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
  .text(ctx => ctx.t('menu-vocabulary'), ctx => ctx.menu.nav('vocabulary-menu'))
  .row()
  .text(ctx => ctx.t('menu-settings'), ctx => ctx.menu.nav('settings-menu'))
