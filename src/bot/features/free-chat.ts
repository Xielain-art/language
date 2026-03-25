import type { Context } from '#root/bot/context.js'
import type { ContentItem, ContentPart, MistakeDetail } from '#root/bot/services/ai.js'
import { getMainMenuKeyboard } from '#root/bot/helpers/keyboards.js'
import { getAIProvider, ModelOverloadedError } from '#root/bot/services/ai.js'
import { downloadVoiceAsBase64 } from '#root/bot/helpers/telegram.js'
import { getSystemInstruction, getAnalysisPrompt } from '#root/bot/helpers/prompts.js'
import { supabase } from '#root/services/supabase.js'
import { Composer, InlineKeyboard } from 'grammy'

const composer = new Composer<Context>()

const feature = composer.chatType('private')

feature.command('cancel', async (ctx, next) => {
  if (ctx.session.state === 'free_chat') {
    await endFreeChat(ctx)
  } else {
    await next()
  }
})

// Handler for inline "End dialogue" button
feature.callbackQuery('cancel_free_chat', async (ctx) => {
  if (ctx.session.state === 'free_chat') {
    // Remove the "End dialogue" button from the old message
    await ctx.editMessageReplyMarkup({ reply_markup: undefined }).catch(() => {})
    
    // End the dialogue
    await endFreeChat(ctx)
  }
  await ctx.answerCallbackQuery()
})

// Handler for "Switch AI Model" button
feature.callbackQuery('switch_ai_model', async (ctx) => {
  const { aiModelMenu } = await import('#root/bot/menu/ai-model-menu.js')
  await ctx.editMessageText(ctx.t('ai-model-select'), { 
    parse_mode: 'HTML',
    reply_markup: aiModelMenu 
  })
  await ctx.answerCallbackQuery()
})

feature.on(['message:text', 'message:voice'], async (ctx, next) => {
  if (ctx.session.state !== 'free_chat') {
    return next()
  }
  
  // Remove buttons from all previous bot messages
  if (ctx.session.botMessageIds && ctx.session.botMessageIds.length > 0) {
    for (const msgId of ctx.session.botMessageIds) {
      try {
        await ctx.api.editMessageReplyMarkup(ctx.chat!.id, msgId, { reply_markup: undefined })
      } catch (err: any) {
        // Message may have been deleted or is too old - ignore errors
        if (err?.error_code !== 400 && err?.error_code !== 403) {
          console.error(`Failed to remove buttons from message ${msgId}:`, err)
        }
      }
    }
    ctx.session.botMessageIds = []
  }

  // Handle "End dialogue" button or command if matched by text
  const cancelText = ctx.t('free-chat-cancel-btn')
  if (ctx.message.text === cancelText) {
    await endFreeChat(ctx)
    return
  }

  // Handle exit via any command
  if (ctx.message.text?.startsWith('/')) {
    await endFreeChat(ctx, false)
    return next()
  }

  // Input Protection: Reject invalid types (stickers, photos, etc.)
  if (!ctx.message.text && !ctx.message.voice) {
      return ctx.reply(ctx.t('error-invalid-input-type'))
  }

  try {
    // Persistent Typing Status
    ctx.chatAction = 'typing'

    let textInput: string | undefined
    let audioBase64: string | undefined

    const user = ctx.session.user
    if (!user) {
      return ctx.reply(ctx.t('error-user-not-found'))
    }

    const userParts: ContentPart[] = []

    if (ctx.message.text) {
      textInput = ctx.message.text
      userParts.push({ text: textInput })
    }
    else if (ctx.message.voice) {
      // Check if selected model supports audio
      const currentAiModel = user.selected_ai_model || 'gemini-2.5-flash-lite'
      const { getModelByCode } = await import('#root/bot/services/ai-models.js')
      const modelInfo = await getModelByCode(currentAiModel)
      
      if (!modelInfo?.supports_voice) {
        return ctx.reply(ctx.t('error-qwen-no-voice'))
      }
      
      // Voice Safety: Enforce 20MB file size limit
      const fileSize = ctx.message.voice.file_size || 0
      if (fileSize > 20 * 1024 * 1024) {
          return ctx.reply(ctx.t('error-voice-too-large'))
      }
      
      // Voice Safety: Enforce 60 second duration limit
      const duration = ctx.message.voice.duration || 0
      if (duration > 60) {
          return ctx.reply(ctx.t('error-voice-too-long'))
      }

      audioBase64 = await downloadVoiceAsBase64(ctx, ctx.message.voice.file_id)
      userParts.push({ 
        inlineData: { 
          mimeType: 'audio/ogg; codecs=opus', 
          data: audioBase64 
        } 
      })
    }

    const userToneCode = user.selected_tone_code || 'friendly'
    const targetLanguage = user.target_language_name || 'English'
    const userLevel = user.level || 'B1'

    // Determine user's UI language
    const langNames: Record<string, string> = { en: 'English', ru: 'Russian', de: 'German', fr: 'French', es: 'Spanish' }
    const uiLanguageName = langNames[ctx.session.__language_code || ctx.from?.language_code || 'en'] || 'English'

    const systemInstruction = await getSystemInstruction(userToneCode, targetLanguage, uiLanguageName, userLevel)

    const chatHistory = ctx.session.chatHistory || []
    
    // SLIDING WINDOW: Pass only last 20 messages to keep request small
    const limitedHistory = chatHistory.slice(-20)

    // Get AI provider based on user's selected model
    const aiModel = user.selected_ai_model || 'gemini-2.5-flash-lite'
    const aiProvider = await getAIProvider(aiModel)
    
    // Streaming: Send initial message and update as chunks arrive
    const inlineCancelKeyboard = new InlineKeyboard()
        .text(ctx.t('free-chat-cancel-btn'), 'cancel_free_chat')
    
    let sentMessage = await ctx.reply('▌', { reply_markup: inlineCancelKeyboard })
    if (!ctx.session.botMessageIds) {
      ctx.session.botMessageIds = []
    }
    ctx.session.botMessageIds.push(sentMessage.message_id)
    
    let fullResponse = ''
    let lastUpdateTime = Date.now()
    const updateInterval = 500 // Update every 500ms to avoid rate limits
    
    try {
      for await (const chunk of aiProvider.askStream({ text: textInput, audioBase64 }, limitedHistory, systemInstruction)) {
        fullResponse += chunk
        
        // Throttle updates to avoid Telegram rate limits
        const now = Date.now()
        if (now - lastUpdateTime >= updateInterval) {
          try {
            await ctx.api.editMessageText(
              ctx.chat!.id, 
              sentMessage.message_id, 
              fullResponse + '▌',
              { reply_markup: inlineCancelKeyboard }
            )
            lastUpdateTime = now
          } catch (editError: any) {
            // Ignore "message is not modified" errors
            if (!editError?.description?.includes('message is not modified')) {
              console.error('Error editing message:', editError)
            }
          }
        }
      }
      
      // Final update without cursor
      if (fullResponse) {
        try {
          await ctx.api.editMessageText(
            ctx.chat!.id, 
            sentMessage.message_id, 
            fullResponse,
            { reply_markup: inlineCancelKeyboard }
          )
        } catch (editError: any) {
          // Ignore "message is not modified" errors
          if (!editError?.description?.includes('message is not modified')) {
            console.error('Error editing final message:', editError)
          }
        }
      }
    } catch (streamError: any) {
      // If streaming fails, fall back to regular ask
      console.error('Streaming failed, falling back to regular ask:', streamError)
      fullResponse = await aiProvider.ask({ text: textInput, audioBase64 }, limitedHistory, systemInstruction)
      try {
        await ctx.api.editMessageText(
          ctx.chat!.id, 
          sentMessage.message_id, 
          fullResponse,
          { reply_markup: inlineCancelKeyboard }
        )
      } catch (editError: any) {
        // If edit fails, send new message
        if (!editError?.description?.includes('message is not modified')) {
          sentMessage = await ctx.reply(fullResponse, { reply_markup: inlineCancelKeyboard })
          ctx.session.botMessageIds.push(sentMessage.message_id)
        }
      }
    }

    // Update FULL history in session (preserved for final analysis)
    chatHistory.push({ role: 'user', parts: userParts })
    chatHistory.push({ role: 'model', parts: [{ text: fullResponse }] })
    ctx.session.chatHistory = chatHistory

  } catch (e: any) {
    // Handle ModelOverloadedError specifically
    if (e instanceof ModelOverloadedError) {
      const switchKeyboard = new InlineKeyboard()
        .text(ctx.t('switch-ai-model-btn'), 'switch_ai_model')
      
      await ctx.reply(ctx.t('error-model-overloaded'), { reply_markup: switchKeyboard })
      return
    }
    
    const errorMsg = e instanceof Error ? e.message : String(e)
    const errorStack = e instanceof Error ? e.stack : ''
    
    console.error('Free chat interaction error:', errorMsg, errorStack)
    
    if (ctx.logger) {
      ctx.logger.error({
        msg: 'Free chat interaction error',
        error: errorMsg,
        stack: errorStack,
        userId: ctx.from?.id,
      })
    }
    await ctx.reply(ctx.t('free-chat-error'))
  }
})

async function endFreeChat(ctx: Context, showAnalysis = true) {
    try {
        if (showAnalysis) {
            await ctx.reply(ctx.t('free-chat-analyzing'), { reply_markup: { remove_keyboard: true } })
        } else {
            await ctx.reply('👋', { reply_markup: { remove_keyboard: true } })
        }
        
        const chatHistory = [...(ctx.session.chatHistory || [])]
        const user = ctx.session.user
        const learningLanguageCode = user?.learning_language || 'en'
        
        const langNames: Record<string, string> = { en: 'English', ru: 'Russian', de: 'German', fr: 'French', es: 'Spanish' }
        const uiLanguageName = langNames[ctx.session.__language_code || 'en'] || 'English'
        const targetLanguageName = user?.target_language_name || 'English'
        
        const analysisTone = user?.selected_analysis_tone_code || 'friendly'
        
        ctx.session.state = 'idle'
        ctx.session.chatHistory = []

        if (!showAnalysis || chatHistory.length === 0) {
            if (showAnalysis) {
                 await ctx.reply(ctx.t('free-chat-no-messages'), { reply_markup: getMainMenuKeyboard(ctx) })
            }
            return
        }

        const analysisPrompt = await getAnalysisPrompt(
            analysisTone,
            targetLanguageName,
            uiLanguageName
        )
        
        // Get AI provider based on user's selected model
        const aiModel = user?.selected_ai_model || 'gemini-2.5-flash-lite'
        const aiProvider = await getAIProvider(aiModel)
        
        const analysis = await aiProvider.askForAnalysis(chatHistory, analysisPrompt)

        let reportText = `${ctx.t('free-chat-analysis-title')}\n\n`
        reportText += `${ctx.t('free-chat-analysis-feedback')}\n<blockquote>${analysis.feedback}</blockquote>\n\n`

        // Save mistakes to database for analytics
        if (analysis.mistakes && analysis.mistakes.length > 0 && user?.id) {
            const mistakesToSave = analysis.mistakes.map(m => ({
                user_id: user.id,
                type: m.type,
                original_text: m.original,
                corrected_text: m.correction
            }))

            const { error: dbError } = await supabase
                .from('user_mistakes')
                .insert(mistakesToSave)

            if (dbError) {
                console.error('Failed to save mistakes for analytics:', dbError)
            }
        }

        // Display mistakes with icons based on type
        if (analysis.mistakes && analysis.mistakes.length > 0) {
            reportText += `${ctx.t('free-chat-analysis-mistakes')}\n`
            const icons: Record<string, string> = { 
                Grammar: '📝', 
                Vocabulary: '📖', 
                Punctuation: '📍', 
                Spelling: '🔤' 
            }
            analysis.mistakes.forEach((m: MistakeDetail) => { 
                const icon = icons[m.type] || '•'
                reportText += `${icon} <s>${m.original}</s> → <b>${m.correction}</b>\n<i>${m.explanation}</i>\n\n` 
            })
        }

        const inlineKeyboard = new InlineKeyboard()

        if (analysis.new_words && analysis.new_words.length > 0) {
            reportText += `${ctx.t('free-chat-analysis-new-words')}\n`
            analysis.new_words.forEach((w: { word: string, translation: string }) => {
                if (!w.word || !w.translation) return
                reportText += `• <b>${w.word}</b> — ${w.translation}\n`
                const cbData = `addw:${learningLanguageCode}:${w.word.substring(0, 15)}:${w.translation.substring(0, 20)}`
                inlineKeyboard.text(ctx.t('free-chat-add-word-btn', { word: w.word }), cbData).row()
            })
        }

        await ctx.reply(reportText, {
            parse_mode: 'HTML',
            reply_markup: inlineKeyboard.inline_keyboard.length > 0 ? inlineKeyboard : undefined,
        })
        
        const { getProfileText } = await import('#root/bot/helpers/profile.js')
        const profileText = await getProfileText(ctx)
        if (profileText) {
            await ctx.reply(profileText, { reply_markup: getMainMenuKeyboard(ctx), parse_mode: 'HTML' })
        } else {
            await ctx.reply(ctx.t('menu-main-title'), { reply_markup: getMainMenuKeyboard(ctx) })
        }

    } catch (e: any) {
        console.error('endFreeChat error:', e)
        ctx.session.state = 'idle'
        ctx.session.chatHistory = []
        await ctx.reply(ctx.t('free-chat-analysis-error'), { reply_markup: getMainMenuKeyboard(ctx) })
    }
}

export { composer as freeChatFeature }
