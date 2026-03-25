import type { Context } from '#root/bot/context.js'
import { getLanguages, supabase, updateUserPreferences } from '#root/services/supabase.js'
import { Menu } from '@grammyjs/menu'

import { updateUserProfile } from '#root/bot/services/user.js'

export const selectLanguageToLearnMenu = new Menu<Context>('select-language-to-learn-menu')
  .dynamic(async (ctx, range) => {
    const languages = await getLanguages()
    const userId = ctx.from?.id
    const currentLearningLanguage = ctx.session.user?.learning_language
    const currentLocaleCode = ctx.session.__language_code || ctx.from?.language_code || 'en'

    for (const language of languages) {
      // Show language name in the selected UI language
      const languageName = currentLocaleCode === 'ru' ? language.name_ru : language.name_en
      range
        .text(
          `${currentLearningLanguage === language.code ? '✅ ' : ''}${languageName}`,
          async (ctx) => {
            if (userId) {
              try {
                await updateUserProfile(userId, { 
                  learning_language: language.code,
                  learning_language_selected: true 
                })
                if (ctx.session.user) {
                  ctx.session.user.learning_language = language.code
                  ctx.session.user.target_language_name = language.name_en
                  ctx.session.user.learning_language_selected = true
                }
              } catch (err) {
                console.error('Failed to update learning language:', err)
                await ctx.answerCallbackQuery({ text: ctx.t('error-saving-selection') })
                return
              }
            }
            await ctx.editMessageText(ctx.t('language-level'))
            ctx.menu.nav('onboarding-level-menu')
          },
        )

        .row()
    }
    range.back('⬅️ Back')
  })
