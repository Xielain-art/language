import type { Context } from '#root/bot/context.js'
import { getAIProvider } from '#root/bot/services/ai.js'
import { getUserProfile } from '#root/bot/services/user.js'
import { parseGrammarRule, parseGrammarQuiz } from '#root/bot/helpers/ai-parser.js'
import { Menu } from '@grammyjs/menu'
import ISO6391 from 'iso-639-1'

/**
 * Main Grammar Menu
 */
export const grammarMenu = new Menu<Context>('grammar-menu')
  .text(ctx => ctx.t('grammar-explain-rule-btn'), async (ctx) => {
    await explainGrammarRule(ctx)
  })
  .row()
  .text(ctx => ctx.t('grammar-quiz-btn'), async (ctx) => {
    await startGrammarQuiz(ctx)
  })
  .row()
  .text(ctx => ctx.t('grammar-weakness-btn'), async (ctx) => {
    await analyzeWeakness(ctx)
  })
  .row()
  .back(
    ctx => ctx.t('vocabulary-back'),
    async (ctx) => {
      const { getProfileText } = await import('#root/bot/helpers/profile.js')
      await ctx.editMessageText(await getProfileText(ctx), { parse_mode: 'HTML' })
    }
  )

/**
 * Grammar Quiz Answer Menu
 */
export const grammarQuizMenu = new Menu<Context>('grammar-quiz-menu')
  .dynamic(async (ctx, range) => {
    const quizData = ctx.session.grammarQuizData
    if (!quizData || !quizData.options) return

    quizData.options.forEach((option, index) => {
      range.text(option, async (ctx) => {
        await handleQuizAnswer(ctx, index, quizData.correctIndex, quizData.explanation)
      }).row()
    })
  })

/**
 * Explain a random grammar rule
 */
async function explainGrammarRule(ctx: Context) {
  const userId = ctx.from?.id
  if (!userId) return

  const user = await getUserProfile(userId, ctx.session.__language_code || 'en')
  if (!user) return

  await ctx.editMessageText(ctx.t('grammar-loading'), { parse_mode: 'HTML' })

  try {
    const targetLanguage = user.target_language_name || 'English'
    const userLevel = user.level || 'B1'
    const uiLanguageName = ISO6391.getName(ctx.session.__language_code || 'en') || 'English'
    const aiModel = user.selected_ai_model || 'gemini-2.5-flash-lite'

    const aiProvider = await getAIProvider(aiModel)

    const prompt = `You are a language tutor. The user is learning ${targetLanguage} at level ${userLevel}. Their native language is ${uiLanguageName}. 

Choose ONE random but important grammar rule for this level. Explain it briefly (up to 3 paragraphs) and provide 3 examples.

Return the response in JSON format:
{
  "topic": "Name of the grammar rule",
  "explanation": "Brief explanation of the rule",
  "examples": ["Example 1", "Example 2", "Example 3"]
}`

    const response = await aiProvider.ask({ text: prompt }, [], 'You are a helpful language tutor.')

    // Parse and validate the JSON response using valibot
    const data = parseGrammarRule(response)

    if (!data) {
      throw new Error('Invalid or malformed grammar rule response')
    }

    let text = `📖 <b>${data.topic}</b>\n\n`
    text += `${data.explanation}\n\n`
    text += `💡 <b>Examples:</b>\n`
    data.examples.forEach((example: string, index: number) => {
      text += `${index + 1}. ${example}\n`
    })

    await ctx.editMessageText(text, { 
      parse_mode: 'HTML',
      reply_markup: grammarMenu
    })

  } catch (error) {
    console.error('Error explaining grammar rule:', error)
    await ctx.editMessageText(ctx.t('grammar-error'), {
      parse_mode: 'HTML',
      reply_markup: grammarMenu
    })
  }
}

/**
 * Start a grammar quiz
 */
async function startGrammarQuiz(ctx: Context) {
  const userId = ctx.from?.id
  if (!userId) return

  const user = await getUserProfile(userId, ctx.session.__language_code || 'en')
  if (!user) return

  await ctx.editMessageText(ctx.t('grammar-loading'), { parse_mode: 'HTML' })

  try {
    const targetLanguage = user.target_language_name || 'English'
    const userLevel = user.level || 'B1'
    const uiLanguageName = ISO6391.getName(ctx.session.__language_code || 'en') || 'English'
    const aiModel = user.selected_ai_model || 'gemini-2.5-flash-lite'

    const aiProvider = await getAIProvider(aiModel)

    const prompt = `You are a language tutor. Generate a grammar quiz question for ${targetLanguage} at level ${userLevel}. The user's native language is ${uiLanguageName}.

Create a sentence with a blank and 4 answer options. One option should be correct.

Return the response in JSON format:
{
  "question": "Sentence with ___ (fill in the blank)",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_index": 2,
  "explanation": "Brief explanation why this answer is correct"
}`

    const response = await aiProvider.ask({ text: prompt }, [], 'You are a helpful language tutor.')

    // Parse and validate the JSON response using valibot
    const data = parseGrammarQuiz(response)

    if (!data) {
      throw new Error('Invalid or malformed grammar quiz response')
    }

    // Store quiz data in session
    ctx.session.grammarQuizData = {
      correctIndex: data.correct_index,
      explanation: data.explanation,
      options: data.options
    }
    ctx.session.state = 'grammar_quiz'

    let text = `🎯 <b>Grammar Quiz</b>\n\n`
    text += `${data.question}\n\n`
    text += `options: [${data.options.join(', ')}]`

    await ctx.editMessageText(text, { 
      parse_mode: 'HTML',
      reply_markup: grammarQuizMenu
    })

  } catch (error) {
    console.error('Error starting grammar quiz:', error)
    await ctx.editMessageText(ctx.t('grammar-error'), {
      parse_mode: 'HTML',
      reply_markup: grammarMenu
    })
  }
}

/**
 * Handle quiz answer
 */
async function handleQuizAnswer(ctx: Context, selectedIndex: number, correctIndex: number, explanation: string) {
  ctx.session.state = 'idle'
  ctx.session.grammarQuizData = undefined

  if (selectedIndex === correctIndex) {
    await ctx.editMessageText(
      `✅ <b>${ctx.t('grammar-correct')}</b>\n\n${explanation}`,
      { 
        parse_mode: 'HTML',
        reply_markup: grammarMenu
      }
    )
  } else {
    await ctx.editMessageText(
      `❌ <b>${ctx.t('grammar-incorrect')}</b>\n\n${explanation}`,
      { 
        parse_mode: 'HTML',
        reply_markup: grammarMenu
      }
    )
  }

  await ctx.answerCallbackQuery()
}

/**
 * Analyze user's weakness
 */
async function analyzeWeakness(ctx: Context) {
  const userId = ctx.from?.id
  if (!userId) return

  const user = await getUserProfile(userId, ctx.session.__language_code || 'en')
  if (!user) return

  await ctx.editMessageText(ctx.t('grammar-loading'), { parse_mode: 'HTML' })

  try {
    const { getWeeklyMistakeStats } = await import('#root/bot/services/statistics.js')
    const stats = await getWeeklyMistakeStats(userId)

    if (!stats || stats.total === 0) {
      await ctx.editMessageText(ctx.t('grammar-no-data'), {
        parse_mode: 'HTML',
        reply_markup: grammarMenu
      })
      return
    }

    // Find the top weakness
    const topWeakness = Object.entries(stats.counts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])[0]

    if (!topWeakness) {
      await ctx.editMessageText(ctx.t('grammar-no-data'), {
        parse_mode: 'HTML',
        reply_markup: grammarMenu
      })
      return
    }

    const targetLanguage = user.target_language_name || 'English'
    const userLevel = user.level || 'B1'
    const uiLanguageName = ISO6391.getName(ctx.session.__language_code || 'en') || 'English'
    const aiModel = user.selected_ai_model || 'gemini-2.5-flash-lite'

    const aiProvider = await getAIProvider(aiModel)

    const prompt = `You are a language tutor. The user is learning ${targetLanguage} at level ${userLevel}. Their native language is ${uiLanguageName}. 

They have a weakness in ${topWeakness[0]} (made ${topWeakness[1]} mistakes in the last 7 days).

Explain this common mistake type and provide 3 examples of correct usage to help them improve.

Return the response in JSON format:
{
  "topic": "${topWeakness[0]} mistakes",
  "explanation": "Brief explanation of common ${topWeakness[0]} mistakes",
  "examples": ["Example 1", "Example 2", "Example 3"]
}`

    const response = await aiProvider.ask({ text: prompt }, [], 'You are a helpful language tutor.')

    // Parse and validate the JSON response using valibot
    const data = parseGrammarRule(response)

    if (!data) {
      throw new Error('Invalid or malformed grammar rule response')
    }

    let text = `💡 <b>Your Weakness: ${data.topic}</b>\n\n`
    text += `${data.explanation}\n\n`
    text += `📝 <b>Examples to improve:</b>\n`
    data.examples.forEach((example: string, index: number) => {
      text += `${index + 1}. ${example}\n`
    })

    await ctx.editMessageText(text, { 
      parse_mode: 'HTML',
      reply_markup: grammarMenu
    })

  } catch (error) {
    console.error('Error analyzing weakness:', error)
    await ctx.editMessageText(ctx.t('grammar-error'), {
      parse_mode: 'HTML',
      reply_markup: grammarMenu
    })
  }
}

grammarMenu.register(grammarQuizMenu)