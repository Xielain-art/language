import type { Context } from '#root/bot/context.js'
import { InlineKeyboard } from 'grammy'

export function createMainMenu(ctx: Context) {
  return new InlineKeyboard()
    .text(ctx.t('menu-free-chat'), 'enter_free_chat').row()
    .text(ctx.t('menu-roles'), 'in_dev').row()
    .text(ctx.t('menu-vocabulary'), 'in_dev').row()
    .text(ctx.t('menu-settings'), 'in_dev')
}