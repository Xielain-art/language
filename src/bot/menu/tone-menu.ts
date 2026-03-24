import { Menu } from '@grammyjs/menu'
import type { Context } from '#root/bot/context.js'
import { getPromptsByType, supabase } from '#root/services/supabase.js'

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
            await supabase.from('users').update({ selected_tone_code: tone.code }).eq('id', userId)
          }
          await ctx.answerCallbackQuery({ text: `✅ Tone selected: ${label}` })
          await ctx.menu.back()
        })
        .row()
    }
  })
  .back('⬅️ Back')
