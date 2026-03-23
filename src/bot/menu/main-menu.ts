import type { Context } from '#root/bot/context.js'
import { Menu } from '@grammyjs/menu'

export const mainMenu = new Menu<Context>('main-menu')
  .text((ctx) => ctx.t('menu-free-chat'), (ctx) => ctx.answerCallbackQuery(ctx.t('in-development')))
  .row()
  .text((ctx) => ctx.t('menu-roles'), (ctx) => ctx.answerCallbackQuery(ctx.t('in-development')))
  .row()
  .text((ctx) => ctx.t('menu-vocabulary'), (ctx) => ctx.answerCallbackQuery(ctx.t('in-development')))
  .text((ctx) => ctx.t('menu-settings'), (ctx) => ctx.answerCallbackQuery(ctx.t('in-development')))