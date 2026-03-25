import type { Context } from '#root/bot/context.js'
import type { ContentPart } from '#root/bot/services/ai.js'
import { getPlacementTestProvider, ModelOverloadedError } from '#root/bot/services/ai.js'
import { downloadVoiceAsBase64 } from '#root/bot/helpers/telegram.js'
import { updateUserProfile } from '#root/bot/services/user.js'
import { getMainMenuKeyboard } from '#root/bot/helpers/keyboards.js'
import { Composer } from 'grammy'

const composer = new Composer<Context>()

const feature = composer.chatType('private')

// Handle retry and cancel callbacks for placement test
feature.callbackQuery('retry_placement_test', async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.reply(ctx.t('placement-test-instructions'))
})

feature.callbackQuery('cancel_placement_test', async (ctx) => {
  ctx.session.state = 'idle'
  ctx.session.placementTestData = undefined
  await ctx.answerCallbackQuery()
  await ctx.reply(ctx.t('placement-test-cancelled'), { reply_markup: getMainMenuKeyboard(ctx) })
})

// Cancel placement test
feature.command('cancel', async (ctx, next) => {
  if (ctx.session.state === 'placement_test') {
    ctx.session.state = 'idle'
    await ctx.reply(ctx.t('placement-test-cancelled'), { reply_markup: getMainMenuKeyboard(ctx) })
  } else {
    await next()
  }
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

    // Initialize placement test session data if not exists
    if (!ctx.session.placementTestData) {
      ctx.session.placementTestData = {
        currentQuestion: 0,
        questions: [],
        answers: []
      }
    }

    const testData = ctx.session.placementTestData!
    const targetLanguage = user.target_language_name || 'English'

    // Check if Qwen model is selected - it doesn't support audio
    const currentAiModel = user.selected_ai_model || 'gemini-2.5-flash-lite'
    
    let textInput: string | undefined
    let audioBase64: string | undefined

    if (ctx.message.text) {
      textInput = ctx.message.text
    }
    else if (ctx.message.voice) {
      // Check if placement test model supports audio
      const { getPlacementTestModel } = await import('#root/bot/services/bot-settings.js')
      const { getModelByCode } = await import('#root/bot/services/ai-models.js')
      const placementModel = await getPlacementTestModel() || 'qwen-plus'
      const modelInfo = await getModelByCode(placementModel)
      
      if (!modelInfo?.supports_voice) {
        return ctx.reply(ctx.t('error-qwen-no-voice'))
      }
      
      // Voice Safety: Enforce 20MB limit
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
      // Ask next question
      const nextQuestion = testData.questions[testData.currentQuestion] || 'Next question...'
      await ctx.reply(`📝 ${nextQuestion}`)
    } else {
      // All questions answered, analyze responses
      await ctx.reply(ctx.t('placement-test-analyzing'))

      // Determine user's UI language
      const langNames: Record<string, string> = { en: 'English', ru: 'Russian', de: 'German', fr: 'French', es: 'Spanish' }
      const uiLanguageName = langNames[ctx.session.__language_code || ctx.from?.language_code || 'en'] || 'English'

      // Build the placement test prompt with all answers
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

      // Prepare content for AI
      const userParts: ContentPart[] = []
      userParts.push({ text: placementPrompt })

      // Add audio if available
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

      // Get dedicated placement test provider
      const aiProvider = await getPlacementTestProvider()

      // Call AI for level determination
      const result = await aiProvider.ask(
        { text: placementPrompt },
        [{ role: 'user', parts: userParts }],
        placementPrompt
      )

      // Parse the AI response
      let levelResult: { level: string; feedback: string }
      try {
        // Clean markdown wrappers that LLMs sometimes add
        const cleanJson = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        levelResult = JSON.parse(cleanJson)
      } catch (e) {
        console.error('Failed to parse placement test result:', e, 'Raw output:', result)
        return ctx.reply(ctx.t('placement-test-error'))
      }

      // Validate level
      const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
      if (!validLevels.includes(levelResult.level)) {
        console.error('Invalid level returned:', levelResult.level)
        return ctx.reply(ctx.t('placement-test-error'))
      }

      // Update user profile with determined level
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

      // Reset state
      ctx.session.state = 'idle'
      ctx.session.placementTestData = undefined

      // Show result to user with improved formatting
      const resultMessage = ctx.t('placement-test-result', {
        level: levelResult.level,
        feedback: levelResult.feedback
      })

      await ctx.reply(resultMessage, { parse_mode: 'HTML' })

      // Show main menu
      const { mainMenu } = await import('#root/bot/menu/index.js')
      const { getProfileText } = await import('#root/bot/helpers/profile.js')
      const profileText = getProfileText(ctx)
      if (profileText) {
        await ctx.reply(profileText, { reply_markup: mainMenu, parse_mode: 'HTML' })
      } else {
        await ctx.reply(ctx.t('menu-main-title'), { reply_markup: mainMenu })
      }
    }

  } catch (e: any) {
    // Handle ModelOverloadedError specifically with retry option
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
