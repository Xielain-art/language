import type { Context } from '#root/bot/context.js'
import { Menu } from '@grammyjs/menu'
import { languageLevelMenu } from './language-level-menu.js'
import { languageSettingsMenu } from './language-settings-menu.js'
import { toneMenu } from './tone-menu.js'

export const settingsMenu = new Menu<Context>('settings-menu')
  .text(ctx => ctx.t('menu-settings-tone'), ctx => ctx.menu.nav('tone-menu'))
  .row()
  .text(ctx => ctx.t('menu-settings-language'), ctx => ctx.menu.nav('language-settings-menu'))
  .row()
  .text(ctx => ctx.t('menu-settings-level'), (ctx) => {
    ctx.menu.nav('language-level-menu')
  })
  .row()
  .back('⬅️ Back')

settingsMenu.register(toneMenu)
settingsMenu.register(languageSettingsMenu)
