import { Keyboard, InlineKeyboard } from 'grammy'
import type { InnerContext, MyConversation } from '#root/bot/context.js'
import { i18n } from '#root/bot/i18n.js'
import { mainMenu } from '#root/bot/menu/main-menu.js'
import { askGemini, askGeminiForAnalysis } from '#root/bot/services/ai.js'
import type { Content } from '@google-cloud/vertexai'
import { supabase } from '#root/services/supabase.js'

export async function freeChatConversation(conversation: MyConversation, ctx: InnerContext) {
  const locale = ctx.from?.language_code || 'en'
  const t = (key: string, vars?: any) => i18n.t(locale, key, vars)

  // 1. Remove the original main menu message to avoid clutter
  await conversation.external(() => ctx.deleteMessage().catch(() => {}))

  const cancelText = '❌ Закончить диалог'
  const replyKeyboard = new Keyboard().text(cancelText).resized()

  await ctx.reply(
    "🎙 Режим свободного диалога активирован!\n\nОтправь мне текст или голосовое сообщение на английском.",
    { reply_markup: replyKeyboard }
  )

  // Fetch the user's chosen AI tone
  const userId = ctx.from?.id
  let userTone: 'friendly' | 'strict' | 'toxic' = 'friendly'
  
  if (userId) {
    const { data } = await conversation.external(() =>
      supabase.from('users').select('ai_tone').eq('id', userId).single()
    )
    if (data?.ai_tone) {
      userTone = data.ai_tone as any
    }
  }

  const chatHistory: Content[] = []

  while (true) {
    const userCtx = await conversation.waitFor(['message:text', 'message:voice'])

    // Check if user wants to exit
    if (userCtx.message?.text === cancelText || userCtx.message?.text === '/cancel') {
      await userCtx.reply('Анализирую наш диалог, подожди немного... ⏳', { reply_markup: { remove_keyboard: true } })
      break
    }

    try {
      await userCtx.replyWithChatAction('typing')

      let textInput: string | undefined
      let audioBase64: string | undefined

      if (userCtx.message?.text) {
        textInput = userCtx.message.text
      } else if (userCtx.message?.voice) {
        // Handle Voice message
        const fileId = userCtx.message.voice.file_id
        const fileObj = await conversation.external(() => userCtx.api.getFile(fileId))
        const fileUrl = `https://api.telegram.org/file/bot${ctx.config.botToken}/${fileObj.file_path}`
        
        const arrayBuffer = await conversation.external(async () => {
          const res = await fetch(fileUrl)
          if (!res.ok) throw new Error("Failed to download file")
          return await res.arrayBuffer()
        })
        
        audioBase64 = Buffer.from(arrayBuffer).toString('base64')
      }

      // Call AI within an external block
      const responseText = await conversation.external(() =>
        askGemini({ text: textInput, audioBase64 }, chatHistory, userTone)
      )

      // Add to conversation state
      if (textInput) {
        chatHistory.push({ role: 'user', parts: [{ text: textInput }] })
      } else {
        chatHistory.push({ role: 'user', parts: [{ text: "[Voice message content analyzed by AI]" }] })
      }
      chatHistory.push({ role: 'model', parts: [{ text: responseText }] })

      await userCtx.reply(responseText, { reply_markup: replyKeyboard })

    } catch (e) {
      console.error(e)
      await userCtx.reply('Произошла ошибка при обработке сообщения. Попробуй еще раз.')
    }
  }

  // Post-analysis phase
  try {
    const analysis = await conversation.external(() => askGeminiForAnalysis(chatHistory))
    
    let reportText = `📊 <b>Анализ диалога</b>\n\n`
    reportText += `<b>Отзыв:</b>\n${analysis.feedback}\n\n`
    
    if (analysis.mistakes && analysis.mistakes.length > 0) {
      reportText += `<b>Ошибки и исправления:</b>\n`
      analysis.mistakes.forEach((m: string) => {
        reportText += `• ${m}\n`
      })
      reportText += `\n`
    }

    const inlineKeyboard = new InlineKeyboard()
    if (analysis.new_words && analysis.new_words.length > 0) {
      reportText += `<b>Новые слова:</b>\n`
      let wordsAddedCount = 0;
      analysis.new_words.forEach((w: any) => {
        if (!w.word || !w.translation) return;
        reportText += `• ${w.word} — ${w.translation}\n`
        
        // Ensure callback data length <= 64 bytes
        const cbData = `addw:${w.word.substring(0, 15)}:${w.translation.substring(0, 20)}`
        inlineKeyboard.text(`➕ Добавить '${w.word}'`, cbData).row()
        wordsAddedCount++;
      })
    }

    await ctx.reply(reportText, { 
      parse_mode: 'HTML', 
      reply_markup: inlineKeyboard.inline_keyboard.length > 0 ? inlineKeyboard : undefined 
    })
    
    // Return to main menu immediately after analysis
    await ctx.reply(t('menu-main-title'), { reply_markup: mainMenu })

  } catch (e) {
    console.error(e)
    await ctx.reply('Не удалось сделать анализ диалога 😔', { reply_markup: mainMenu })
  }
}