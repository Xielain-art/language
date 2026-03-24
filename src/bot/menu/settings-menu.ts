import type { Context } from '#root/bot/context.js'
import { Menu } from '@grammyjs/menu'
import { settingsLevelMenu } from './language-level-menu.js'
import { languageSettingsMenu } from './language-settings-menu.js'
import { toneMenu } from './tone-menu.js'
import { analysisToneMenu } from './analysis-tone-menu.js'

export const settingsMenu = new Menu<Context>('settings-menu')
  .text(ctx => ctx.t('menu-settings-tone'), ctx => ctx.menu.nav('tone-menu'))
  .row()
  .text(ctx => ctx.t('menu-settings-analysis-tone'), ctx => ctx.menu.nav('analysis-tone-menu'))
  .row()
  .text(ctx => ctx.t('menu-settings-language'), ctx => ctx.menu.nav('language-settings-menu'))
  .row()
  .text(ctx => ctx.t('menu-settings-level'), (ctx) => {
    ctx.menu.nav('settings-level-menu')
  })
  .row()
  .back('⬅️ Back')
