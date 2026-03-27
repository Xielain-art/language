import type { Context } from '#root/bot/context.js'
import { getProfileText } from '#root/bot/helpers/profile.js'
import { getRoleplays } from '#root/services/supabase.js'
import { Menu } from '@grammyjs/menu'
import { InlineKeyboard } from 'grammy'

export const roleplayMenu = new Menu<Context>('roleplay-menu')
  .dynamic(async (ctx, range) => {
    const roleplays = await getRoleplays()
    const locale = await ctx.i18n.getLocale()

    for (const role of roleplays) {
      const label = locale === 'ru' ? role.title_ru : role.title_en
      
      range
        .text(`[${role.level}] 🎭 ${label}`, async (ctx) => {
          await ctx.answerCallbackQuery()
          
          // Set state and clear history
          ctx.session.state = 'roleplay'
          ctx.session.chatHistory = []
          
          // Save system prompt for this roleplay session
          ctx.session.roleplaySession = {
            code: role.code,
            systemPrompt: role.system_prompt
          }
          
          await ctx.deleteMessage().catch(() => {})
          
          // BOT STARTS THE DIALOGUE FIRST!
          const inlineCancelKeyboard = new InlineKeyboard()
              .text(ctx.t('free-chat-cancel-btn'), 'cancel_free_chat')
          
          const sentMessage = await ctx.reply(`🎭 <b>${label}</b>\n\n${role.first_message}`, {
              parse_mode: 'HTML',
              reply_markup: inlineCancelKeyboard
          })
          
          // Save bot message to history so AI knows context
          ctx.session.chatHistory.push({
            role: 'model',
            parts: [{ text: role.first_message }]
          })
          ctx.session.lastInteractiveMessageId = sentMessage.message_id
        })
        .row()
    }
  })
  .back(
    ctx => ctx.t('vocabulary-back'),
    async (ctx) => {
      await ctx.editMessageText(await getProfileText(ctx), { parse_mode: 'HTML' })
    }
  )