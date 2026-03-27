import type { Context } from '#root/bot/context.js'
import { getProfileText } from '#root/bot/helpers/profile.js'
import { getRoleplays } from '#root/services/supabase.js'
import { getAIProvider } from '#root/bot/services/ai.js'
import { Menu } from '@grammyjs/menu'
import { InlineKeyboard } from 'grammy'
import ISO6391 from 'iso-639-1'

const levelValues: Record<string, number> = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6 }

function getMinLevelValue(range: string) {
  const minLevel = range.split('-')[0] || 'A1'
  return levelValues[minLevel] || 1
}

export const roleplayMenu = new Menu<Context>('roleplay-menu')
  .dynamic(async (ctx, range) => {
    const roleplays = await getRoleplays()
    const locale = await ctx.i18n.getLocale()
    
    const userLevelValue = levelValues[ctx.session.user?.level || 'A1'] || 1

    for (const role of roleplays) {
      const label = locale === 'ru' ? role.title_ru : role.title_en
      
      const requiredLevelValue = getMinLevelValue(role.level)
      const isLocked = userLevelValue < requiredLevelValue
      const prefix = isLocked ? '🔒 ' : ''

      range
        .text(`${prefix}[${role.level}] ${label}`, async (ctx) => {
          
          if (isLocked) {
             const reqLvl = role.level.split('-')[0] || role.level
             return ctx.answerCallbackQuery({ 
               text: ctx.t('roleplay-locked', { level: reqLvl }), 
               show_alert: true 
             })
          }

          await ctx.answerCallbackQuery()
          
          ctx.session.state = 'roleplay'
          ctx.session.chatHistory = []
          
          const targetLanguage = ctx.session.user?.target_language_name || 'English'
          const userLevel = ctx.session.user?.level || 'A1'
          const uiLanguageName = ISO6391.getName(ctx.session.__language_code || ctx.from?.language_code || 'en') || 'English'

          const systemPrompt = role.system_prompt
            .replace(/\{\{LANGUAGE\}\}/g, targetLanguage)
            .replace(/\{\{UI_LANGUAGE\}\}/g, uiLanguageName)
            .replace(/\{\{LEVEL\}\}/g, userLevel)
            
          ctx.session.roleplaySession = { code: role.code, systemPrompt: systemPrompt }
          
          await ctx.deleteMessage().catch(() => {})
          
          const inlineCancelKeyboard = new InlineKeyboard().text(ctx.t('free-chat-cancel-btn'), 'cancel_free_chat')
          
          const sentMessage = await ctx.reply(`⏳ ${ctx.t('grammar-loading')}`, {
              parse_mode: 'HTML',
              reply_markup: inlineCancelKeyboard
          })
          
          const aiModel = ctx.session.user?.selected_ai_model || 'gemini-2.5-flash-lite'
          const aiProvider = await getAIProvider(aiModel)
          
          const startPrompt = `Please start the roleplay now. You must send the first message to the user to begin the conversation. Introduce the context briefly and ask the first question. Speak ONLY in ${targetLanguage}.`

          let firstMessage = ''
          try {
            firstMessage = await aiProvider.ask({ text: startPrompt }, [], systemPrompt)
          } catch (e) {
            console.error("Error generating first roleplay message:", e)
            firstMessage = role.first_message
          }
          
          await ctx.api.editMessageText(ctx.chat!.id, sentMessage.message_id, `🎭 <b>${label}</b>\n\n${firstMessage}`, {
              parse_mode: 'HTML',
              reply_markup: inlineCancelKeyboard
          })
          
          // IMPORTANT: Gemini API requires history to start with 'user' role
          // Add fake user message before model's first message to prevent 400 error
          ctx.session.chatHistory.push({
            role: 'user',
            parts: [{ text: "Let's start the roleplay." }]
          })
          ctx.session.chatHistory.push({
            role: 'model',
            parts: [{ text: firstMessage }]
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