import type { Context } from '#root/bot/context.js'
import { getPromptsByType } from '#root/services/supabase.js'
import { Menu } from '@grammyjs/menu'
import { updateUserProfile } from '#root/bot/services/user.js'

export const toneMenu = new Menu<Context>('tone-menu')
  .dynamic(async (ctx, range) => {
    const tones = await getPromptsByType('tone')
    const locale = await ctx.i18n.getLocale()
    const currentTone = ctx.session.user?.selected_tone_code

    for (const tone of tones) {
      const label = locale === 'ru' ? tone.label_ru : tone.label_en
      const isSelected = currentTone === tone.code
      
      range
        .text(`${isSelected ? '✅ ' : ''}🗣 ${label}`, async (ctx) => {
          const userId = ctx.from?.id
          if (userId) {
            try {
              await updateUserProfile(userId, { selected_tone_code: tone.code })
              if (ctx.session.user) {
                ctx.session.user.selected_tone_code = tone.code
              }
            }
            catch (err) {
              console.error('Failed to update user tone:', err)
              await ctx.answerCallbackQuery({ text: '❌ Error saving selection' })
              return
            }
          }
          await ctx.answerCallbackQuery({ text: `✅ Tone selected: ${label}` })
          ctx.menu.update()
        })
        .row()
    }
  })
  .back(
    ctx => ctx.t('vocabulary-back'),
    async (ctx) => {
      await ctx.editMessageText(ctx.t('menu-settings-tone'), { parse_mode: 'HTML' })
    }
  )
