import type { Context } from '#root/bot/context.js'
import { getPromptsByType, supabase } from '#root/services/supabase.js'
import { Menu } from '@grammyjs/menu'

export const roleplayMenu = new Menu<Context>('roleplay-menu')
  .dynamic(async (ctx, range) => {
    const roleplays = await getPromptsByType('roleplay')
    const locale = await ctx.i18n.getLocale()

    for (const role of roleplays) {
      const label = locale === 'ru' ? role.label_ru : role.label_en
      range
        .text(`🎭 ${label}`, async (ctx) => {
          const userId = ctx.from?.id
          if (userId) {
            try {
              const { data, error } = await supabase
                .from('users')
                .update({ selected_tone_code: role.code })
                .eq('id', userId)
                .select()

              if (error)
                throw error
              if (!data || data.length === 0) {
                console.error(`User update failed: User ${userId} not found or not updated`)
              }
            }
            catch (err) {
              console.error('Failed to update user roleplay:', err)
              await ctx.answerCallbackQuery({ text: '❌ Error starting session' })
              return
            }
          }
          await ctx.answerCallbackQuery({ text: `▶️ Starting: ${label}` })
          // Remove the menu message
          await ctx.deleteMessage().catch(() => {})
          // Enter free chat which will now use the selected roleplay prompt
          await ctx.conversation.enter('freeChatConversation')
        })

        .row()
    }
  })
  .back('⬅️ Back')
