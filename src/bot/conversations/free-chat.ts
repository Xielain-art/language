import type { InnerContext, MyConversation } from '#root/bot/context.js'
import type { ContentItem } from '#root/bot/services/ai.js'
import { Buffer } from 'node:buffer'
import { i18n } from '#root/bot/i18n.js'
import { mainMenu } from '#root/bot/menu/index.js'
import { askGemini, askGeminiForAnalysis } from '#root/bot/services/ai.js'

import { getPromptByCode, supabase } from '#root/services/supabase.js'
import { InlineKeyboard, Keyboard } from 'grammy'

export async function freeChatConversation(conversation: MyConversation, ctx: InnerContext) {
  const locale = ctx.from?.language_code || 'en'
  const t = (key: string, vars?: any) => i18n.t(locale, key, vars)

  // 1. Remove the original main menu message to avoid clutter
  await ctx.deleteMessage().catch(() => {})

  const cancelText = t('free-chat-cancel-btn')
  const replyKeyboard = new Keyboard().text(cancelText).resized()

  await ctx.reply(t('free-chat-activated'), { reply_markup: replyKeyboard })

  // 2. Fetch the user's chosen AI tone/roleplay from DB or Session Cache
  const userId = ctx.from?.id
  let userToneCode = 'friendly'
  let targetLanguage = 'English'

  // Use session caching to avoid frequent DB hits
  if (ctx.session.selected_tone_code && ctx.session.learning_language) {
    userToneCode = ctx.session.selected_tone_code
    targetLanguage = ctx.session.targetLanguageName || 'English'
  }
  else if (userId) {
    const { data, error } = await conversation.external(() =>
      supabase.from('users')
        .select('selected_tone_code, learning_language')
        .eq('id', userId)
        .single(),
    )
    if (error) {
      console.error('Failed to fetch user preferences:', error)
    }

    if (data?.selected_tone_code) {
      userToneCode = data.selected_tone_code
      ctx.session.selected_tone_code = userToneCode
    }

    // Fetch target language name for replacement
    if (data?.learning_language) {
      ctx.session.learning_language = data.learning_language
      const { data: langData } = await conversation.external(() =>
        supabase.from('languages').select('name_en').eq('code', data.learning_language).single(),
      )
      if (langData?.name_en) {
        targetLanguage = langData.name_en
        ctx.session.targetLanguageName = targetLanguage
      }
    }
  }

  // Fetch the actual text for this tone code
  let systemInstruction = await conversation.external(() => getPromptByCode(userToneCode))
  if (systemInstruction) {
    // Replace placeholder with target language
    systemInstruction = systemInstruction.replace(/\{\{LANGUAGE\}\}/g, targetLanguage).replace(/English/g, targetLanguage)
  }
  else {
    // Basic fallback if db fails
    systemInstruction = `You are a helpful ${targetLanguage} tutor. Correct mistakes.`
  }

  const chatHistory: ContentItem[] = []

  while (true) {
    const userCtx = await conversation.waitFor(['message:text', 'message:voice'])

    // Check if user wants to exit
    if (userCtx.message?.text === cancelText) {
      await userCtx.reply(t('free-chat-analyzing'), { reply_markup: { remove_keyboard: true } })
      break
    }

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
        // Handle Voice message
        const fileId = userCtx.message.voice.file_id
        const fileObj = await conversation.external(() => userCtx.api.getFile(fileId))
        const fileUrl = `https://api.telegram.org/file/bot${ctx.config.botToken}/${fileObj.file_path}`

        const arrayBuffer = await conversation.external(async () => {
          const res = await fetch(fileUrl)
          if (!res.ok)
            throw new Error('Failed to download file')
          return await res.arrayBuffer()
        })

        audioBase64 = Buffer.from(arrayBuffer).toString('base64')
      }

      // Call AI within an external block, passing raw system instruction
      const responseText = await conversation.external(() =>
        askGemini({ text: textInput, audioBase64 }, chatHistory, systemInstruction!),
      )

      // Add to conversation state
      if (textInput) {
        chatHistory.push({ role: 'user', parts: [{ text: textInput }] })
      }
      else {
        chatHistory.push({ role: 'user', parts: [{ text: '[Voice message content]' }] })
      }
      chatHistory.push({ role: 'model', parts: [{ text: responseText }] })

      await userCtx.reply(responseText, { reply_markup: replyKeyboard })
    }
    catch (e) {
      console.error(e)
      await userCtx.reply(t('free-chat-error'), { reply_markup: replyKeyboard })
    }
  }

  // Post-analysis phase
  if (chatHistory.length === 0) {
    await ctx.reply(t('free-chat-no-messages'), { reply_markup: mainMenu })
    return
  }

  try {
    let analysisPrompt = await conversation.external(() => getPromptByCode('post_analysis')) || ''
    const tonePrompt = await conversation.external(() => getPromptByCode(userToneCode))

    if (tonePrompt) {
      // Replace language in tone prompt too if any
      const localizedTone = tonePrompt.replace(/\{\{LANGUAGE\}\}/g, targetLanguage).replace(/English/g, targetLanguage)
      analysisPrompt += `\n\nCRITICAL RULE FOR FEEDBACK: Your "feedback" string MUST be written in Russian BUT adopting the following persona/tone:\n${localizedTone}`
    }

    const analysis = await conversation.external(() => askGeminiForAnalysis(chatHistory, analysisPrompt))

    let reportText = `${t('free-chat-analysis-title')}\n\n`
    reportText += `<b>${t('free-chat-analysis-feedback')}</b>\n${analysis.feedback}\n\n`

    if (analysis.mistakes && analysis.mistakes.length > 0) {
      reportText += `<b>${t('free-chat-analysis-mistakes')}</b>\n`
      analysis.mistakes.forEach((m: string) => {
        reportText += `• ${m}\n`
      })
      reportText += `\n`
    }

    const inlineKeyboard = new InlineKeyboard()
    if (analysis.new_words && analysis.new_words.length > 0) {
      reportText += `<b>${t('free-chat-analysis-new-words')}</b>\n`
      analysis.new_words.forEach((w: any) => {
        if (!w.word || !w.translation)
          return
        reportText += `• ${w.word} — ${w.translation}\n`

    const cbData = `addw:${w.word.substring(0, 15)}:${w.translation.substring(0, 20)}`
    inlineKeyboard.text(t('free-chat-add-word-btn', { word: w.word }), cbData).row()
  })
}

// Add a button to return to main menu
inlineKeyboard.text(t('menu-main-title'), 'back_to_main').row()

await ctx.reply(reportText, {
  parse_mode: 'HTML',
  reply_markup: inlineKeyboard.inline_keyboard.length > 0 ? inlineKeyboard : undefined,
})
  }
  catch (e) {
    console.error(e)
    await ctx.reply(t('free-chat-analysis-error'), { reply_markup: mainMenu })
  }
}
