import { Menu } from '@grammyjs/menu'
import type { Context } from '#root/bot/context.js'
import { toneMenu } from './tone-menu.js'
import { languageMenu } from './language-menu.js'
import { languageLevelMenu } from './language-level-menu.js'

export const settingsMenu = new Menu<Context>('settings-menu')
  .text((ctx) => ctx.t('menu-settings-tone'), (ctx) => ctx.menu.nav('tone-menu'))
  .row()
  .text((ctx) => ctx.t('menu-settings-language'), async (ctx) => {
    await ctx.editMessageText(ctx.t('language'), { reply_markup: languageMenu })
  })
  .row()
  .text((ctx) => ctx.t('menu-settings-level'), async (ctx) => {
    await ctx.editMessageText(ctx.t('language-level-title'), { reply_markup: languageLevelMenu })
  })
  .row()
  .back('⬅️ Back')


