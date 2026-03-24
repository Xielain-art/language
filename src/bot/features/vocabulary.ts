import { Composer } from 'grammy'
import type { Context } from '#root/bot/context.js'
import { supabase } from '#root/services/supabase.js'

export const vocabularyFeature = new Composer<Context>()

vocabularyFeature.callbackQuery(/^addw:(.+):(.+)$/, async (ctx) => {
  const match = ctx.match
  if (!match) return

  const word = match[1]
  const translation = match[2]
  const userId = ctx.from?.id

  if (!userId) {
    return ctx.answerCallbackQuery({ text: 'User ID not found!', show_alert: true })
  }

  try {
    const { error } = await supabase.from('vocabulary').insert({
      user_id: userId,
      word,
      translation,
    })

    if (error) {
      console.error('Error saving vocabulary:', error)
      return ctx.answerCallbackQuery({ text: 'Ошибка сохранения в БД!', show_alert: true })
    }

    // Acknowledge the query with a small toast notification
    await ctx.answerCallbackQuery({ text: `✅ Добавлено: ${word}` })
    
    // We could ideally edit the message to remove this exact button, but removing a single 
    // button from an inline keyboard requires rebuilding the keyboard without this button.
    // For simplicity, we just answer the query.

  } catch (error) {
    console.error(error)
    await ctx.answerCallbackQuery({ text: 'Произошла непредвиденная ошибка.', show_alert: true })
  }
})
