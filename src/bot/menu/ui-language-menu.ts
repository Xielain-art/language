import type { Context } from '#root/bot/context.js'
import { i18n } from '#root/bot/i18n.js'
import { getUserProfile } from '#root/bot/services/user.js'
import { Menu, MenuRange } from '@grammyjs/menu'

const languageNames: Record<string, string> = { en: '🇬🇧 English', ru: '🇷🇺 Русский' }

export const uiLanguageMenu = new Menu<Context>('ui-language-menu')
  .dynamic(async (ctx) => {
    const range = new MenuRange<Context>()
    const currentLocaleCode = await ctx.i18n.getLocale()

    for (const localeCode of i18n.locales) {
      const isSelected = currentLocaleCode === localeCode
      range
        .text(
          `${isSelected ? '✅ ' : ''}${languageNames[localeCode] || localeCode}`,
          async (ctx) => {
            await ctx.i18n.setLocale(localeCode)
            ctx.session.__language_code = localeCode
            
            // Reload user profile with new locale to get translated tone and language names
            if (ctx.from && ctx.session.user) {
              const profile = await getUserProfile(ctx.from.id, localeCode)
              if (profile) {
                ctx.session.user = profile
              }
            }
            
            await ctx.answerCallbackQuery({ text: ctx.t('language-changed') })
            
            // Re-render the menu with the new language immediately
            await ctx.editMessageText(ctx.t('language-select'), { parse_mode: 'HTML' })
          },
        )
        .row()
    }
    return range
  })
  .back(ctx => ctx.t('vocabulary-back'))
