import type { Context } from '#root/bot/context.js'
import type { ContentItem, ContentPart } from '#root/bot/services/ai.js'
import { getMainMenuKeyboard } from '#root/bot/helpers/keyboards.js'
import { askGemini, askGeminiForAnalysis } from '#root/bot/services/ai.js'
import { downloadVoiceAsBase64 } from '#root/bot/helpers/telegram.js'
import { getSystemInstruction, getAnalysisPrompt } from '#root/bot/helpers/prompts.js'
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

feature.on(['message:text', 'message:voice'], async (ctx, next) => {
  if (ctx.session.state !== 'free_chat') {
    return next()
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

    const userParts: ContentPart[] = []

    if (ctx.message.text) {
      textInput = ctx.message.text
      userParts.push({ text: textInput })
    }
    else if (ctx.message.voice) {
      // Voice Safety: Enforce 20MB limit
      const fileSize = ctx.message.voice.file_size || 0
      if (fileSize > 20 * 1024 * 1024) {
          return ctx.reply(ctx.t('error-voice-too-large'))
      }

      audioBase64 = await downloadVoiceAsBase64(ctx, ctx.message.voice.file_id)
      userParts.push({ 
        inlineData: { 
          mimeType: 'audio/ogg; codecs=opus', 
          data: audioBase64 
        } 
      })
    }

    const user = ctx.session.user
    const userToneCode = user?.selected_tone_code || 'friendly'
    const targetLanguage = user?.target_language_name || 'English'

    const systemInstruction = await getSystemInstruction(userToneCode, targetLanguage)

    const chatHistory = ctx.session.chatHistory || []
    
    // SLIDING WINDOW: Pass only last 20 messages to keep request small
    const limitedHistory = chatHistory.slice(-20)

    const responseText = await askGemini({ text: textInput, audioBase64 }, limitedHistory, systemInstruction)

    // Update FULL history in session (preserved for final analysis)
    chatHistory.push({ role: 'user', parts: userParts })
    chatHistory.push({ role: 'model', parts: [{ text: responseText }] })
    ctx.session.chatHistory = chatHistory

    const cancelKeyboard = {
        keyboard: [[{ text: ctx.t('free-chat-cancel-btn') }]],
        resize_keyboard: true
    }
    
    await ctx.reply(responseText, { reply_markup: cancelKeyboard })

  } catch (e: any) {
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
        const uiLanguageName = langNames[ctx.from?.language_code || 'en'] || 'English'
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
        
        const analysis = await askGeminiForAnalysis(chatHistory, analysisPrompt)

        let reportText = `${ctx.t('free-chat-analysis-title')}\n\n`
        reportText += `${ctx.t('free-chat-analysis-feedback')}\n<blockquote>${analysis.feedback}</blockquote>\n\n`

        if (analysis.mistakes && analysis.mistakes.length > 0) {
            reportText += `${ctx.t('free-chat-analysis-mistakes')}\n`
            analysis.mistakes.forEach(m => { reportText += `• ${m}\n` })
            reportText += `\n`
        }

        const inlineKeyboard = new InlineKeyboard()

        if (analysis.new_words && analysis.new_words.length > 0) {
            reportText += `${ctx.t('free-chat-analysis-new-words')}\n`
            analysis.new_words.forEach(w => {
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
        await ctx.reply(getProfileText(ctx), { reply_markup: getMainMenuKeyboard(ctx), parse_mode: 'HTML' })

    } catch (e: any) {
        console.error('endFreeChat error:', e)
        ctx.session.state = 'idle'
        ctx.session.chatHistory = []
        await ctx.reply(ctx.t('free-chat-analysis-error'), { reply_markup: getMainMenuKeyboard(ctx) })
    }
}

export { feature as freeChatFeature }
