import type { Context } from '#root/bot/context.js'
import { getPromptsByType, supabase } from '#root/services/supabase.js'
import { Menu } from '@grammyjs/menu'

export const toneMenu = new Menu<Context>('tone-menu')
  .dynamic(async (ctx, range) => {
    const tones = await getPromptsByType('tone')
    const locale = await ctx.i18n.getLocale()

    for (const tone of tones) {
      const label = locale === 'ru' ? tone.label_ru : tone.label_en
      range
        .text(`🗣 ${label}`, async (ctx) => {
          const userId = ctx.from?.id
          if (userId) {
            try {
              const { data, error } = await supabase
                .from('users')
                .update({ selected_tone_code: tone.code })
                .eq('id', userId)
                .select()

              if (error)
                throw error
              if (!data || data.length === 0) {
                console.error(`User update failed: User ${userId} not found or not updated`)
              }
            }
            catch (err) {
              console.error('Failed to update user tone:', err)
              await ctx.answerCallbackQuery({ text: '❌ Error saving selection' })
              return
            }
          }
          await ctx.answerCallbackQuery({ text: `✅ Tone selected: ${label}` })
          await ctx.menu.back()
        })

        .row()
    }
  })
  .back('⬅️ Back')
