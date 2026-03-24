import type { InnerContext, MyConversation } from '#root/bot/context.js'
import type { ContentItem } from '#root/bot/services/ai.js'
import { i18n } from '#root/bot/i18n.js'
import { mainMenu } from '#root/bot/menu/index.js'
import { askGemini, askGeminiForAnalysis } from '#root/bot/services/ai.js'
import { downloadVoiceAsBase64 } from '#root/bot/helpers/telegram.js'
import { getSystemInstruction, getAnalysisPrompt } from '#root/bot/helpers/prompts.js'
import { InlineKeyboard, Keyboard } from 'grammy'

export async function freeChatConversation(conversation: MyConversation, ctx: InnerContext) {
  const locale = ctx.from?.language_code || 'en'
  const t = (key: string, vars?: any) => i18n.t(locale, key, vars)

  await ctx.deleteMessage().catch(() => {})

  const cancelText = t('free-chat-cancel-btn')
  const replyKeyboard = new Keyboard().text(cancelText).resized()

  await ctx.reply(t('free-chat-activated'), { reply_markup: replyKeyboard })

  // Use values from session (loaded by middleware)
  const userToneCode = ctx.session.user?.selected_tone_code || 'friendly'
  const targetLanguage = ctx.session.user?.target_language_name || 'English'

  const systemInstruction = await conversation.external(() => 
    getSystemInstruction(userToneCode, targetLanguage)
  )

  const chatHistory: ContentItem[] = []

  while (true) {
    const userCtx = await conversation.waitFor(['message:text', 'message:voice'])

    // Check if user wants to exit
    if (userCtx.message?.text === cancelText) {
      await userCtx.reply(t('free-chat-analyzing'), { reply_markup: { remove_keyboard: true } })
      break
    }

    // Handle commands within conversation
    if (userCtx.message?.text?.startsWith('/')) {
      await userCtx.reply(t('free-chat-analyzing'), { reply_markup: { remove_keyboard: true } })
      await conversation.skip()
      break
    }

    try {
      userCtx.api.sendChatAction(userCtx.chat!.id, 'typing').catch(() => {})

      let textInput: string | undefined
      let audioBase64: string | undefined

      if (userCtx.message?.text) {
        textInput = userCtx.message.text
      }
      else if (userCtx.message?.voice) {
        audioBase64 = await conversation.external(() => 
          downloadVoiceAsBase64(userCtx as any, userCtx.message!.voice!.file_id)
        )
      }

      const responseText = await conversation.external(() =>
        askGemini({ text: textInput, audioBase64 }, chatHistory, systemInstruction),
      )

      chatHistory.push({ 
        role: 'user', 
        parts: [{ text: textInput || '[Voice message content]' }] 
      })
      chatHistory.push({ role: 'model', parts: [{ text: responseText }] })

      await userCtx.reply(responseText, { reply_markup: replyKeyboard })
    }
    catch (e) {
      console.error('Free chat interaction error:', e)
      await userCtx.reply(t('free-chat-error'), { reply_markup: replyKeyboard })
    }
  }

  if (chatHistory.length === 0) {
    return ctx.reply(t('free-chat-no-messages'), { reply_markup: mainMenu })
  }

  try {
    const analysisPrompt = await conversation.external(() => 
      getAnalysisPrompt(userToneCode, targetLanguage)
    )
    const analysis = await conversation.external(() => 
      askGeminiForAnalysis(chatHistory, analysisPrompt)
    )

    let reportText = `${t('free-chat-analysis-title')}\n\n`
    reportText += `<b>${t('free-chat-analysis-feedback')}</b>\n${analysis.feedback}\n\n`

    if (analysis.mistakes?.length > 0) {
      reportText += `<b>${t('free-chat-analysis-mistakes')}</b>\n`
      analysis.mistakes.forEach(m => { reportText += `• ${m}\n` })
      reportText += `\n`
    }

    const inlineKeyboard = new InlineKeyboard()
    if (analysis.new_words?.length > 0) {
      reportText += `<b>${t('free-chat-analysis-new-words')}</b>\n`
      analysis.new_words.forEach(w => {
        if (!w.word || !w.translation) return
        reportText += `• ${w.word} — ${w.translation}\n`
        const cbData = `addw:${w.word.substring(0, 15)}:${w.translation.substring(0, 20)}`
        inlineKeyboard.text(t('free-chat-add-word-btn', { word: w.word }), cbData).row()
      })
    }

    inlineKeyboard.text(t('menu-main-title'), 'back_to_main').row()

    await ctx.reply(reportText, {
      parse_mode: 'HTML',
      reply_markup: inlineKeyboard.inline_keyboard.length > 0 ? inlineKeyboard : undefined,
    })
  }
  catch (e) {
    console.error('Post-analysis error:', e)
    await ctx.reply(t('free-chat-analysis-error'), { reply_markup: mainMenu })
  }
}
