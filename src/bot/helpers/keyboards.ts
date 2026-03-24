import type { Context } from '#root/bot/context.js'
import { InlineKeyboard } from 'grammy'

/**
 * Manually constructs the Main Menu keyboard.
 * This is used to avoid issues with the @grammyjs/menu plugin when
 * sending menus from contexts where the plugin isn't active.
 */
export function getMainMenuKeyboard(ctx: Context): InlineKeyboard {
  return new InlineKeyboard()
    .text(ctx.t('menu-free-chat'), 'enter_free_chat')
    .row()
    .text(ctx.t('menu-roles'), 'nav_roles')
    .row()
    .text(ctx.t('menu-vocabulary'), 'nav_vocabulary')
    .row()
    .text(ctx.t('menu-settings'), 'nav_settings')
}

/**
 * Manually constructs the Language Selection keyboard.
 */
export function getLanguageMenuKeyboard(ctx: Context): InlineKeyboard {
  return new InlineKeyboard()
    .text('🇬🇧 English', 'set_ui_en')
    .row()
    .text('🇷🇺 Русский', 'set_ui_ru')
}
