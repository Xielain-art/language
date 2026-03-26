import type { Context } from '#root/bot/context.js'
import { getLanguages } from '#root/services/supabase.js'
import { Menu } from '@grammyjs/menu'
import { updateUserProfile } from '#root/bot/services/user.js'

export const reportLanguageMenu = new Menu<Context>('report-language-menu')
  .dynamic(async (ctx, range) => {
    const languages = await getLanguages()
    const userId = ctx.from?.id
    const currentReportLanguage = ctx.session.user?.report_language
    const locale = ctx.session.__language_code || 'en'

    for (const language of languages) {
      const isSelected = currentReportLanguage === language.code
      const languageName = locale === 'ru' ? language.name_ru : language.name_en
      range
        .text(
          `${isSelected ? '✅ ' : ''}${languageName}`,
          async (ctx) => {
            if (userId) {
              try {
                await updateUserProfile(userId, { report_language: language.code })
                if (ctx.session.user) {
                  ctx.session.user.report_language = language.code
                  ctx.session.user.report_language_name = languageName
                }
                await ctx.answerCallbackQuery({ text: ctx.t('report-language-selected', { language: languageName }) })
                ctx.menu.update()
              } catch (err) {
                console.error('Failed to update report language:', err)
                await ctx.answerCallbackQuery({ text: ctx.t('error-saving-selection') })
              }
            }
          },
        )
        .row()
    }
    range.back(
      ctx => ctx.t('vocabulary-back'),
      async (ctx) => {
        await ctx.editMessageText(ctx.t('menu-settings'), { parse_mode: 'HTML' })
      }
    )
  })