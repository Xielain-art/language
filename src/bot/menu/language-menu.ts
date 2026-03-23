import type { Context } from '#root/bot/context.js'
import { i18n } from '#root/bot/i18n.js'
import { Menu, MenuRange } from '@grammyjs/menu'

const languageNames: Record<string, string> = {
  en: '🇬🇧 English',
  ru: '🇷🇺 Русский',
}

export const languageMenu = new Menu<Context>('language-menu')
  .dynamic(async (ctx) => {
    const range = new MenuRange<Context>()
    const currentLocaleCode = await ctx.i18n.getLocale()

    for (const localeCode of i18n.locales) {
      range
        .text(
          `${currentLocaleCode === localeCode ? '✅ ' : ''}${languageNames[localeCode] || localeCode.toUpperCase()}`,
          async (ctx) => {
            await ctx.i18n.setLocale(localeCode)
            ctx.menu.nav('language-level-menu')
          },
        )
        .row()
    }
    return range
  })
