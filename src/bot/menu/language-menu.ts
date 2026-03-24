import type { Context } from '#root/bot/context.js'
import { i18n } from '#root/bot/i18n.js'
import { Menu, MenuRange } from '@grammyjs/menu'

const languageNames: Record<string, string> = { en: '🇬🇧 English', ru: '🇷🇺 Русский' }

export const languageMenu = new Menu<Context>('language-menu')
  .text(ctx => ctx.t('language-select'), ctx => ctx.menu.nav('select-language-menu'))

export const selectLanguageMenu = new Menu<Context>('select-language-menu')
  .dynamic(async (ctx) => {
    const range = new MenuRange<Context>()
    const currentLocaleCode = await ctx.i18n.getLocale()

    for (const localeCode of i18n.locales) {
      range
        .text(
          `${currentLocaleCode === localeCode ? '✅ ' : ''}${languageNames[localeCode] || localeCode}`,
          async (ctx) => {
            await ctx.i18n.setLocale(localeCode)
            await ctx.editMessageText(ctx.t('language-to-learn'))
            ctx.menu.nav('select-language-to-learn-menu')
          },
        )
        .row()
    }
    return range
  })
  .back('⬅️ Back')
