import type { Context } from '#root/bot/context.js'
import { LANGUAGE_LEVELS } from '#root/bot/constants/language-levels.js'
import { Menu } from '@grammyjs/menu'
import { updateUserProfile } from '#root/bot/services/user.js'
import { getProfileText } from '#root/bot/helpers/profile.js'
import { getAIProvider } from '#root/bot/services/ai.js'

/**
 * Common logic for level selection
 */
async function selectLevel(ctx: Context, languageLevel: string) {
  const userId = ctx.from?.id
  if (userId) {
    try {
      await updateUserProfile(userId, { 
        level: languageLevel,
        level_selected: true 
      })
      if (ctx.session.user) {
        ctx.session.user.level = languageLevel
        ctx.session.user.level_selected = true
      }
    } catch (err) {
      console.error('Failed to update user level:', err)
      await ctx.answerCallbackQuery({ text: ctx.t('error-saving-selection') })
      return
    }
  }

  await ctx.deleteMessage()
  await ctx.reply(ctx.t('level-selected', { level: languageLevel }))
  
  const { mainMenu } = await import('#root/bot/menu/index.js')
  const profileText = getProfileText(ctx)
  if (profileText) {
    await ctx.reply(profileText, { reply_markup: mainMenu, parse_mode: 'HTML' })
  } else {
    await ctx.reply(ctx.t('menu-main-title'), { reply_markup: mainMenu })
  }
}

export const onboardingLevelMenu = new Menu<Context>('onboarding-level-menu')
  .dynamic(async (ctx, range) => {
    const currentLevel = ctx.session.user?.level
    for (const level of LANGUAGE_LEVELS) {
      range
        .text(
          `${currentLevel === level ? '✅ ' : ''}${level}`,
          ctx => selectLevel(ctx, level)
        )
        .row()
    }
    // Add AI placement test button
    range.text(`🤖 ${ctx.t('determine-level-ai')}`, async (ctx) => {
      ctx.session.state = 'placement_test'
      await ctx.deleteMessage()
      await ctx.reply(ctx.t('placement-test-instructions'))
      
      // Generate 3 questions using AI
      const targetLanguage = ctx.session.user?.target_language_name || 'English'
      // Use placement test model for question generation
      const { getPlacementTestModel } = await import('#root/bot/services/bot-settings.js')
      const placementModel = await getPlacementTestModel() || 'qwen-plus'
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
        
        // Parse the questions
        const cleanJson = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const questions = JSON.parse(cleanJson)
        
        if (!Array.isArray(questions) || questions.length !== 3) {
          throw new Error('Invalid questions format')
        }
        
        ctx.session.placementTestData = {
          currentQuestion: 0,
          questions: questions,
          answers: []
        }
        
        // Ask the first question
        await ctx.reply(`📝 ${questions[0]}`)
      } catch (err) {
        console.error('Failed to generate placement test questions:', err)
        // Fallback to simple questions in target language
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
        
        ctx.session.placementTestData = {
          currentQuestion: 0,
          questions: questions,
          answers: []
        }
        
        await ctx.reply(`📝 ${questions[0]}`)
      }
    })
  })
  .back(
    '⬅️ Back',
    async (ctx) => {
      await ctx.editMessageText(ctx.t('language-level'), { parse_mode: 'HTML' })
    }
  )

export const settingsLevelMenu = new Menu<Context>('settings-level-menu')
  .dynamic(async (ctx, range) => {
    const currentLevel = ctx.session.user?.level
    for (const level of LANGUAGE_LEVELS) {
      range
        .text(
          `${currentLevel === level ? '✅ ' : ''}${level}`,
          ctx => selectLevel(ctx, level)
        )
        .row()
    }
    // Add AI placement test button
    range.text(`🤖 ${ctx.t('determine-level-ai')}`, async (ctx) => {
      ctx.session.state = 'placement_test'
      await ctx.deleteMessage()
      await ctx.reply(ctx.t('placement-test-instructions'))
      
      // Generate 3 questions using AI
      const targetLanguage = ctx.session.user?.target_language_name || 'English'
      const currentAiModel = ctx.session.user?.selected_ai_model || 'gemini-2.5-flash-lite'
      const aiProvider = await getAIProvider(currentAiModel)
      
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
        
        // Parse the questions
        const cleanJson = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const questions = JSON.parse(cleanJson)
        
        if (!Array.isArray(questions) || questions.length !== 3) {
          throw new Error('Invalid questions format')
        }
        
        ctx.session.placementTestData = {
          currentQuestion: 0,
          questions: questions,
          answers: []
        }
        
        // Ask the first question
        await ctx.reply(`📝 ${questions[0]}`)
      } catch (err) {
        console.error('Failed to generate placement test questions:', err)
        // Fallback to simple questions
        const fallbackQuestions = [
          `Tell me about yourself in ${targetLanguage}.`,
          `Describe your typical day in ${targetLanguage}.`,
          `What did you do last weekend in ${targetLanguage}?`
        ]
        
        ctx.session.placementTestData = {
          currentQuestion: 0,
          questions: fallbackQuestions,
          answers: []
        }
        
        await ctx.reply(`📝 ${fallbackQuestions[0]}`)
      }
    })
  })
  .back(
    '⬅️ Back',
    async (ctx) => {
      await ctx.editMessageText(ctx.t('menu-settings'), { parse_mode: 'HTML' })
    }
  )
