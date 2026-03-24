import type { Context } from '#root/bot/context.js'
import { getPromptsByType } from '#root/services/supabase.js'
import { Menu } from '@grammyjs/menu'
import { updateUserProfile } from '#root/bot/services/user.js'

export const roleplayMenu = new Menu<Context>('roleplay-menu')
  .dynamic(async (ctx, range) => {
    const roleplays = await getPromptsByType('roleplay')
    const locale = await ctx.i18n.getLocale()
    const currentTone = ctx.session.user?.selected_tone_code

    for (const role of roleplays) {
      const label = locale === 'ru' ? role.label_ru : role.label_en
      const isSelected = currentTone === role.code

      range
        .text(`${isSelected ? '✅ ' : ''}🎭 ${label}`, async (ctx) => {
          const userId = ctx.from?.id
          if (userId) {
            try {
              await updateUserProfile(userId, { selected_tone_code: role.code })
              if (ctx.session.user) {
                ctx.session.user.selected_tone_code = role.code
              }
            }
            catch (err) {
              console.error('Failed to update user roleplay:', err)
              await ctx.answerCallbackQuery({ text: '❌ Error starting session' })
              return
            }
          }
          await ctx.answerCallbackQuery({ text: `▶️ Starting: ${label}` })
          
          // Switch state to free_chat
          ctx.session.state = 'free_chat'
          ctx.session.chatHistory = []
          
          await ctx.deleteMessage().catch(() => {})
          await ctx.reply(ctx.t('free-chat-activated'), {
              reply_markup: {
                  keyboard: [[{ text: ctx.t('free-chat-cancel-btn') }]],
                  resize_keyboard: true
              }
          })
        })

        .row()
    }
  })
  .back('⬅️ Back')
