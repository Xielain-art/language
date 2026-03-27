import type { Context } from '#root/bot/context.js'
import type { ContentPart } from '#root/bot/services/ai.js'
import { getPlacementTestProvider, ModelOverloadedError } from '#root/bot/services/ai.js'
import { downloadVoiceAsBase64 } from '#root/bot/helpers/telegram.js'
import { validateVoiceMessageAndReply } from '#root/bot/helpers/audio-validation.js'
import { updateUserProfile } from '#root/bot/services/user.js'
import { getMainMenuKeyboard } from '#root/bot/helpers/keyboards.js'
import { sendTelegramLog, LOG_TOPICS } from '#root/bot/services/telegram-logger.js'
import { transcribeAudio } from '#root/bot/services/stt.js'
import { parsePlacementTestResult } from '#root/bot/helpers/ai-parser.js'
import { Composer } from 'grammy'

const composer = new Composer<Context>()

const feature = composer.chatType('private')

export async function startPlacementTest(ctx: Context) {
  ctx.session.state = 'placement_test'
  ctx.session.placementTestData = {
    currentQuestion: 0,
    questions: [],
    answers: []
  }
  
  await ctx.deleteMessage().catch(() => {})
  
  const targetLanguage = ctx.session.user?.target_language_name || 'English'
  
  // Generate questions using AI
  const { getPlacementTestModel } = await import('#root/bot/services/bot-settings.js')
  const { getAIProvider } = await import('#root/bot/services/ai.js')
  const placementModel = await getPlacementTestModel() || 'gemini-2.5-flash-lite'
  const aiProvider = await getAIProvider(placementModel)
  
  const generateQuestionsPrompt = `Generate exactly 3 simple questions in ${targetLanguage} for a language placement test. The questions should be about:
1. The person themselves (name, age, job, hobbies)
2. Their daily routine
3. Their recent activities or plans

Return ONLY a JSON array with exactly 3 strings, like this:
["Question 1", "Question 2", "Question 3"]

Do NOT include any other text or explanation.`

  try {
    const result = await aiProvider.ask(
      { text: generateQuestionsPrompt },
      [{ role: 'user', parts: [{ text: generateQuestionsPrompt }] }],
      generateQuestionsPrompt
    )
    
    const cleanJson = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const questions = JSON.parse(cleanJson)
    
    if (!Array.isArray(questions) || questions.length !== 3) {
      throw new Error('Invalid questions format')
    }
    
    ctx.session.placementTestData!.questions = questions
    await ctx.reply(`📝 ${questions[0]}`)
  } catch (err) {
    console.error('Failed to generate placement test questions:', err)
    
    const fallbackQuestions: Record<string, string[]> = {
      en: [
        'Tell me about yourself. What do you do? What are your hobbies?',
        'Describe your typical day. What do you usually do in the morning, afternoon, and evening?',
        'What did you do last weekend? Or what are your plans for the next weekend?'
      ],
      ru: [
        'Расскажи о себе. Кем ты работаешь? Какие у тебя хобби?',
        'Опиши свой обычный день. Что ты обычно делаешь утром, днем и вечером?',
        'Что ты делал на прошлых выходных? Или какие у тебя планы на следующие выходные?'
      ],
      de: [
        'Erzähl mir von dir. Was machst du? Was sind deine Hobbys?',
        'Beschreibe deinen typischen Tag. Was machst du normalerweise morgens, nachmittags und abends?',
        'Was hast du letztes Wochenende gemacht? Oder was sind deine Pläne für das nächste Wochenende?'
      ],
      fr: [
        'Parle-moi de toi. Que fais-tu? Quels sont tes loisirs?',
        'Décris ta journée typique. Que fais-tu habituellement le matin, l\'après-midi et le soir?',
        'Qu\'as-tu fait le week-end dernier? Ou quels sont tes plans pour le prochain week-end?'
      ],
      es: [
        'Háblame de ti. ¿A qué te dedicas? ¿Cuáles son tus pasatiempos?',
        'Describe tu día típico. ¿Qué sueles hacer por la mañana, por la tarde y por la noche?',
        '¿Qué hiciste el fin de semana pasado? O ¿cuáles son tus planes para el próximo fin de semana?'
      ]
    }
    
    const targetLangCode = ctx.session.user?.learning_language || 'en'
    const questions = fallbackQuestions[targetLangCode] || fallbackQuestions['en']
    
    ctx.session.placementTestData!.questions = questions
    await ctx.reply(`📝 ${questions[0]}`)
  }
}

// Handle retry and cancel callbacks for placement test
feature.callbackQuery('retry_placement_test', async (ctx) => {
  await ctx.answerCallbackQuery()
  await startPlacementTest(ctx)
})

feature.callbackQuery('cancel_placement_test', async (ctx) => {
  ctx.session.state = 'idle'
  ctx.session.placementTestData = undefined
  await ctx.answerCallbackQuery()
  await ctx.reply(ctx.t('placement-test-cancelled'), { reply_markup: getMainMenuKeyboard(ctx) })
})

// Handle text and voice messages during placement test
feature.on(['message:text', 'message:voice'], async (ctx, next) => {
  if (ctx.session.state !== 'placement_test') {
    return next()
  }

  // Handle exit via any command
  if (ctx.message.text?.startsWith('/')) {
    ctx.session.state = 'idle'
    return next()
  }

  // Input Protection: Reject invalid types (stickers, photos, etc.)
  if (!ctx.message.text && !ctx.message.voice) {
    return ctx.reply(ctx.t('error-invalid-input-type'))
  }

  try {
    // Show typing indicator
    ctx.chatAction = 'typing'

    const user = ctx.session.user
    if (!user) {
      return ctx.reply(ctx.t('error-user-not-found'))
    }

    const testData = ctx.session.placementTestData!
    const targetLanguage = user.target_language_name || 'English'

    let textInput: string | undefined
    let audioBase64: string | undefined

    if (ctx.message.text) {
      textInput = ctx.message.text
    }
    else if (ctx.message.voice) {
      const { getPlacementTestModel } = await import('#root/bot/services/bot-settings.js')
      const { getModelByCode } = await import('#root/bot/services/ai-models.js')
      const placementModel = await getPlacementTestModel() || 'gemini-2.5-flash-lite'
      const modelInfo = await getModelByCode(placementModel)
      
      if (!modelInfo?.supports_voice) {
        return ctx.reply(ctx.t('error-qwen-no-voice'))
      }
      
      const isValid = await validateVoiceMessageAndReply(
        ctx,
        ctx.message.voice.file_size,
        ctx.message.voice.duration
      )
      if (!isValid) return

      audioBase64 = await downloadVoiceAsBase64(ctx, ctx.message.voice.file_id)
      
      const sttResult = await transcribeAudio(audioBase64)
      if (sttResult.success && sttResult.text) {
        await ctx.reply(`🗣 <i>${sttResult.text}</i>`, { parse_mode: 'HTML' })
        
        const logChatId = ctx.config.logChatId
        if (logChatId) {
          await sendTelegramLog(
            ctx.api,
            logChatId,
            LOG_TOPICS.INTERACTIONS.key,
            `🎤 <b>STT Used (Placement Test)</b>\n\n` +
            `<b>User:</b> ${ctx.from?.first_name} (${ctx.from?.id})\n` +
            `<b>Transcription:</b> ${sttResult.text.substring(0, 500)}`
          )
        }
      }
    }

    // Store the answer
    testData.answers.push({
      question: testData.questions[testData.currentQuestion] || 'Question',
      answer: textInput || '[Voice message]',
      audioBase64: audioBase64
    })

    // Move to next question or analyze
    testData.currentQuestion++

    if (testData.currentQuestion < 3) {
      const nextQuestion = testData.questions[testData.currentQuestion] || 'Next question...'
      await ctx.reply(`📝 ${nextQuestion}`)
    } else {
      // All questions answered, analyze responses
      await ctx.reply(ctx.t('placement-test-analyzing'))

      const langNames: Record<string, string> = { en: 'English', ru: 'Russian', de: 'German', fr: 'French', es: 'Spanish' }
      const uiLanguageName = langNames[ctx.session.__language_code || ctx.from?.language_code || 'en'] || 'English'

      const answersText = testData.answers.map((item, index) => 
        `Question ${index + 1}: ${item.question}\nAnswer: ${item.answer}`
      ).join('\n\n')

      const placementPrompt = `Analyze the following responses in ${targetLanguage} from a language placement test. The user answered 3 questions about themselves. Determine the CEFR level (A1-C2) of the language proficiency demonstrated.

${answersText}

Consider:
- Vocabulary range and sophistication
- Grammar accuracy and complexity
- Sentence structure
- Fluency and natural expression
- Ability to express ideas clearly

CRITICAL INSTRUCTION: You MUST write your feedback in ${uiLanguageName}. Do NOT write feedback in ${targetLanguage} or English. Write ONLY in ${uiLanguageName}.

Return ONLY valid JSON with this exact structure:
{
  "level": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
  "feedback": "Detailed explanation of why this level was assigned (3-5 sentences). Mention specific strengths and weaknesses. IMPORTANT: Write this feedback ONLY in ${uiLanguageName}, not in ${targetLanguage} or English."
}`

      const userParts: ContentPart[] = []
      userParts.push({ text: placementPrompt })

      for (const answer of testData.answers) {
        if (answer.audioBase64) {
          userParts.push({
            inlineData: {
              mimeType: 'audio/ogg; codecs=opus',
              data: answer.audioBase64
            }
          })
        }
      }

      const aiProvider = await getPlacementTestProvider()

      const result = await aiProvider.ask(
        { text: placementPrompt },
        [{ role: 'user', parts: userParts }],
        placementPrompt
      )

      const levelResult = parsePlacementTestResult(result)
      if (!levelResult) {
        console.error('Failed to parse placement test result. Raw output:', result)
        return ctx.reply(ctx.t('placement-test-error'))
      }

      const userId = ctx.from?.id
      if (userId) {
        try {
          await updateUserProfile(userId, { 
            level: levelResult.level,
            level_selected: true 
          })
          if (ctx.session.user) {
            ctx.session.user.level = levelResult.level
            ctx.session.user.level_selected = true
          }
        } catch (err) {
          console.error('Failed to update user level from placement test:', err)
          return ctx.reply(ctx.t('error-saving-selection'))
        }
      }

      ctx.session.state = 'idle'
      ctx.session.placementTestData = undefined

      const logChatId = ctx.config.logChatId
      if (logChatId) {
        await sendTelegramLog(
          ctx.api,
          logChatId,
          LOG_TOPICS.PROGRESS.key,
          `📈 <b>Placement Test Completed</b>\n\n` +
          `<b>User:</b> ${ctx.from?.first_name} (${ctx.from?.id})\n` +
          `<b>Determined Level:</b> ${levelResult.level}\n` +
          `<b>Target Language:</b> ${targetLanguage}\n` +
          `<b>Feedback:</b> ${levelResult.feedback.substring(0, 300)}`
        )
      }

      const resultMessage = ctx.t('placement-test-result', {
        level: levelResult.level,
        feedback: levelResult.feedback
      })

      await ctx.reply(resultMessage, { parse_mode: 'HTML' })

      const { mainMenu } = await import('#root/bot/menu/index.js')
      const { getProfileText } = await import('#root/bot/helpers/profile.js')
      const profileText = await getProfileText(ctx)
      if (profileText) {
        await ctx.reply(profileText, { reply_markup: mainMenu, parse_mode: 'HTML' })
      } else {
        await ctx.reply(ctx.t('menu-main-title'), { reply_markup: mainMenu })
      }
    }

  } catch (e: any) {
    if (e instanceof ModelOverloadedError) {
      const { InlineKeyboard } = await import('grammy')
      const retryKeyboard = new InlineKeyboard()
        .text(ctx.t('placement-test-retry-btn'), 'retry_placement_test')
        .text(ctx.t('placement-test-cancel-btn'), 'cancel_placement_test')
      
      await ctx.reply(ctx.t('error-model-overloaded-placement'), { 
        reply_markup: retryKeyboard,
        parse_mode: 'HTML'
      })
      return
    }

    const errorMsg = e instanceof Error ? e.message : String(e)
    const errorStack = e instanceof Error ? e.stack : ''

    console.error('Placement test error:', errorMsg, errorStack)

    if (ctx.logger) {
      ctx.logger.error({
        msg: 'Placement test error',
        error: errorMsg,
        stack: errorStack,
        userId: ctx.from?.id,
      })
    }

    ctx.session.state = 'idle'
    ctx.session.placementTestData = undefined
    await ctx.reply(ctx.t('placement-test-error'), { reply_markup: getMainMenuKeyboard(ctx) })
  }
})

export { composer as placementTestFeature }