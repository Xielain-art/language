import type { Context } from '#root/bot/context.js'
import { Menu } from '@grammyjs/menu'
import { toneMenu } from './tone-menu.js'
import { roleplayMenu } from './roleplay-menu.js'

export const mainMenu = new Menu<Context>('main-menu')
  .text(
    (ctx) => ctx.t('menu-free-chat'),
    async (ctx) => {
      await ctx.conversation.enter('freeChatConversation')
    }
  )
  .row()
  .text((ctx) => ctx.t('menu-roles'), (ctx) => ctx.menu.nav('roleplay-menu'))
  .row()
  .text((ctx) => ctx.t('menu-vocabulary'), (ctx) => ctx.answerCallbackQuery(ctx.t('in-development')))
  .row()
  .text((ctx) => ctx.t('menu-settings'), (ctx) => ctx.menu.nav('tone-menu'))

mainMenu.register(roleplayMenu)
mainMenu.register(toneMenu)