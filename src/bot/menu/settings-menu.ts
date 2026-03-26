import type { Context } from '#root/bot/context.js'
import { Menu } from '@grammyjs/menu'
import { settingsLevelMenu } from './language-level-menu.js'
import { languageSettingsMenu } from './language-settings-menu.js'
import { toneMenu } from './tone-menu.js'
import { analysisToneMenu } from './analysis-tone-menu.js'
import { uiLanguageMenu } from './ui-language-menu.js'
import { aiModelMenu } from './ai-model-menu.js'
import { reportLanguageMenu } from './report-language-menu.js'
import { voiceSettingsMenu } from './voice-settings-menu.js'
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
  .text(ctx => ctx.t('menu-settings-ai-model'), async (ctx) => {
    await ctx.editMessageText(ctx.t('ai-model-select'), { parse_mode: 'HTML' })
    ctx.menu.nav('ai-model-menu')
  })
  .row()
  .text(ctx => ctx.t('menu-settings-report-language'), async (ctx) => {
    await ctx.editMessageText(ctx.t('report-language-select'), { parse_mode: 'HTML' })
    ctx.menu.nav('report-language-menu')
  })
  .row()
  .text(ctx => ctx.t('menu-settings-voice'), async (ctx) => {
    await ctx.editMessageText(ctx.t('voice-settings-title'), { parse_mode: 'HTML' })
    ctx.menu.nav('voice-settings-menu')
  })
  .row()
  .back(
    ctx => ctx.t('vocabulary-back'),
    async (ctx) => {
      await ctx.editMessageText(await getProfileText(ctx), { parse_mode: 'HTML' })
    }
  )
