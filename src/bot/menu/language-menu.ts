import type { Context } from '#root/bot/context.js'
import { i18n } from '#root/bot/i18n.js'
import { Menu, MenuRange } from '@grammyjs/menu'
import { updateUserProfile } from '#root/bot/services/user.js'

// Language names in different UI languages
const languageNames: Record<string, Record<string, string>> = {
  en: { en: '🇬🇧 English', ru: '🇷🇺 Russian' },
  ru: { en: '🇬🇧 Английский', ru: '🇷🇺 Русский' }
}

export const languageMenu = new Menu<Context>('language-menu')
  .text(ctx => ctx.t('language-select'), async (ctx) => {
    await ctx.editMessageText(ctx.t('language-select'), { parse_mode: 'HTML' })
    ctx.menu.nav('select-language-menu')
  })

export const selectLanguageMenu = new Menu<Context>('select-language-menu')
  .dynamic(async (ctx) => {
    const range = new MenuRange<Context>()
    const currentLocaleCode = await ctx.i18n.getLocale()

    for (const localeCode of i18n.locales) {
      const isSelected = currentLocaleCode === localeCode
      range
        .text(
          `${isSelected ? '✅ ' : ''}${languageNames[currentLocaleCode]?.[localeCode] || languageNames['en']?.[localeCode] || localeCode}`,
          async (ctx) => {
            await ctx.i18n.setLocale(localeCode)
            ctx.session.__language_code = localeCode
            
            // Update onboarding flag in database
            const userId = ctx.from?.id
            if (userId) {
              try {
                await updateUserProfile(userId, { ui_language_selected: true })
                if (ctx.session.user) {
                  ctx.session.user.ui_language_selected = true
                }
              } catch (err) {
                console.error('Failed to update ui_language_selected:', err)
              }
            }
            
            await ctx.answerCallbackQuery({ text: ctx.t('language-changed') })
            
            // Navigate to target language selection
            await ctx.editMessageText(ctx.t('language-to-learn'), { parse_mode: 'HTML' })
            ctx.menu.nav('select-language-to-learn-menu')
          },
        )
        .row()
    }
    return range
  })
  .back(
    '⬅️ Back',
    async (ctx) => {
      await ctx.editMessageText(ctx.t('language'), { parse_mode: 'HTML' })
    }
  )
