import type { Context } from '#root/bot/context.js'
import { getPromptsByType } from '#root/services/supabase.js'
import { Menu } from '@grammyjs/menu'
import { updateUserProfile } from '#root/bot/services/user.js'

export const analysisToneMenu = new Menu<Context>('analysis-tone-menu')
  .dynamic(async (ctx, range) => {
    const tones = await getPromptsByType('tone')
    const locale = await ctx.i18n.getLocale()
    const currentTone = ctx.session.user?.selected_analysis_tone_code

    for (const tone of tones) {
      const label = locale === 'ru' ? tone.label_ru : tone.label_en
      const isSelected = currentTone === tone.code

      range
        .text(`${isSelected ? '✅ ' : ''}📊 ${label}`, async (ctx) => {
          const userId = ctx.from?.id
          if (userId) {
            try {
              await updateUserProfile(userId, { selected_analysis_tone_code: tone.code })
              if (ctx.session.user) {
                ctx.session.user.selected_analysis_tone_code = tone.code
              }
            }
            catch (err) {
              console.error('Failed to update user analysis tone:', err)
              await ctx.answerCallbackQuery({ text: '❌ Error saving selection' })
              return
            }
          }
          await ctx.answerCallbackQuery({ text: `✅ Analysis tone: ${label}` })
          ctx.menu.update()
        })
        .row()
    }
  })
  .back('⬅️ Back')
