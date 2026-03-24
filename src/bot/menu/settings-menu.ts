import type { Context } from '#root/bot/context.js'
import { Menu } from '@grammyjs/menu'
import { settingsLevelMenu } from './language-level-menu.js'
import { languageSettingsMenu } from './language-settings-menu.js'
import { toneMenu } from './tone-menu.js'
import { analysisToneMenu } from './analysis-tone-menu.js'
import { uiLanguageMenu } from './ui-language-menu.js'
import { getProfileText } from '#root/bot/helpers/profile.js'

export const settingsMenu = new Menu<Context>('settings-menu')
  .text(ctx => ctx.t('menu-settings-tone'), async (ctx) => {
    await ctx.editMessageText(ctx.t('menu-settings-tone'), { parse_mode: 'HTML' })
    ctx.menu.nav('tone-menu')
  })
  .row()
  .text(ctx => ctx.t('menu-settings-analysis-tone'), async (ctx) => {
    await ctx.editMessageText(ctx.t('menu-settings-analysis-tone'), { parse_mode: 'HTML' })
    ctx.menu.nav('analysis-tone-menu')
  })
  .row()
  .text(ctx => ctx.t('menu-settings-language'), async (ctx) => {
    await ctx.editMessageText(ctx.t('language-to-learn'), { parse_mode: 'HTML' })
    ctx.menu.nav('language-settings-menu')
  })
  .row()
  .text(ctx => ctx.t('menu-settings-ui-language'), async (ctx) => {
    await ctx.editMessageText(ctx.t('language-select'), { parse_mode: 'HTML' })
    ctx.menu.nav('ui-language-menu')
  })
  .row()
  .text(ctx => ctx.t('menu-settings-level'), async (ctx) => {
    await ctx.editMessageText(ctx.t('language-level-title'), { parse_mode: 'HTML' })
    ctx.menu.nav('settings-level-menu')
  })
  .row()
  .back(
    ctx => ctx.t('vocabulary-back'),
    async (ctx) => {
      await ctx.editMessageText(getProfileText(ctx), { parse_mode: 'HTML' })
    }
  )
