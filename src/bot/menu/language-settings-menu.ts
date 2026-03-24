import type { Context } from '#root/bot/context.js'
import { getLanguages, supabase, updateUserPreferences } from '#root/services/supabase.js'
import { Menu } from '@grammyjs/menu'

export const languageSettingsMenu = new Menu<Context>('language-settings-menu')
  .dynamic(async (ctx, range) => {
    const languages = await getLanguages()
    const userId = ctx.from?.id

    let currentLearningLanguage = ctx.session.learning_language
    if (!currentLearningLanguage && userId) {
      const { data } = await supabase.from('users').select('learning_language').eq('id', userId).single()
      currentLearningLanguage = data?.learning_language
      ctx.session.learning_language = currentLearningLanguage
    }

    for (const language of languages) {
      range
        .text(
          `${currentLearningLanguage === language.code ? '✅ ' : ''}${language.name_en}`,
          async (ctx) => {
            if (userId) {
              await updateUserPreferences(userId, { learning_language: language.code })
              ctx.session.learning_language = language.code
              ctx.session.targetLanguageName = language.name_en
              await ctx.answerCallbackQuery({ text: `✅ Updated to ${language.name_en}` })
            }
          },
        )

        .row()
    }
    range.back('⬅️ Back')
  })
