import type { Context } from '#root/bot/context.js'
import { getLanguages, supabase, updateUserPreferences } from '#root/services/supabase.js'
import { Menu } from '@grammyjs/menu'

import { updateUserProfile } from '#root/bot/services/user.js'

export const selectLanguageToLearnMenu = new Menu<Context>('select-language-to-learn-menu')
  .dynamic(async (ctx, range) => {
    const languages = await getLanguages()
    const userId = ctx.from?.id
    const currentLearningLanguage = ctx.session.user?.learning_language

    for (const language of languages) {
      range
        .text(
          `${currentLearningLanguage === language.code ? '✅ ' : ''}${language.name_en}`,
          async (ctx) => {
            if (userId) {
              await updateUserProfile(userId, { learning_language: language.code })
              if (ctx.session.user) {
                ctx.session.user.learning_language = language.code
                ctx.session.user.target_language_name = language.name_en
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
