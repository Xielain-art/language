import type { Context } from '#root/bot/context.js'
import { getLanguages } from '#root/services/supabase.js'
import { Menu } from '@grammyjs/menu'
import { updateUserProfile } from '#root/bot/services/user.js'

export const languageSettingsMenu = new Menu<Context>('language-settings-menu')
  .dynamic(async (ctx, range) => {
    const languages = await getLanguages()
    const userId = ctx.from?.id
    const currentLearningLanguage = ctx.session.user?.learning_language

    for (const language of languages) {
      const isSelected = currentLearningLanguage === language.code
      range
        .text(
          `${isSelected ? '✅ ' : ''}${language.name_en}`,
          async (ctx) => {
            if (userId) {
              await updateUserProfile(userId, { learning_language: language.code })
              if (ctx.session.user) {
                ctx.session.user.learning_language = language.code
                ctx.session.user.target_language_name = language.name_en
              }
              await ctx.answerCallbackQuery({ text: `✅ Updated to ${language.name_en}` })
              ctx.menu.update()
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
