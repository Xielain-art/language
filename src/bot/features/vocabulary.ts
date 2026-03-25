import type { Context } from '#root/bot/context.js'
import { supabase } from '#root/services/supabase.js'
import { Composer } from 'grammy'

export const vocabularyFeature = new Composer<Context>()

vocabularyFeature.callbackQuery(/^addw:([^:]+):([^:]+):(.+)$/, async (ctx) => {
  const match = ctx.match
  if (!match)
    return

  const langCode = match[1]
  const word = match[2]
  const translation = match[3]
  const userId = ctx.from?.id

  if (!userId) {
    return ctx.answerCallbackQuery({ text: 'User ID not found!', show_alert: true })
  }

  try {
    const { error } = await supabase.from('vocabulary').insert({
      user_id: userId,
      word,
      translation,
      language_code: langCode,
    })

    if (error) {
      console.error('Error saving vocabulary:', error)
      return ctx.answerCallbackQuery({ text: ctx.t('error-saving-vocabulary'), show_alert: true })
    }

    await ctx.answerCallbackQuery({ text: ctx.t('vocabulary-added-success') })

    // Provide visual feedback on the button
    const oldKeyboard = ctx.callbackQuery.message?.reply_markup?.inline_keyboard
    if (oldKeyboard) {
      const newKeyboard = oldKeyboard.map(row => 
        row.map((btn: any) => {
          if ('callback_data' in btn && btn.callback_data === ctx.callbackQuery.data) {
            return { text: `✅ ${word}`, callback_data: 'done' }
          }
          return btn
        })
      )
      await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: newKeyboard } })
    }
  }
  catch (error) {
    console.error(error)
    await ctx.answerCallbackQuery({ text: ctx.t('error-unexpected'), show_alert: true })
  }
})
