import type { Context } from '#root/bot/context.js'
import type { Conversation } from '@grammyjs/conversations'
import { mainMenu } from '#root/bot/menu/main-menu.js'

export async function freeChatConversation(conversation: Conversation<Context>, ctx: Context) {
  await ctx.reply("🎙 Режим свободного диалога активирован!\n\nОтправь мне текст или голосовое сообщение. Я отвечу.\n\n❌ Чтобы выйти, отправь /cancel")

  while (true) {
    const userCtx = await conversation.waitFor(['message:text', 'message:voice'])

    if (userCtx.message?.text === '/cancel') {
      await userCtx.reply("Возвращаемся в главное меню 📱", { reply_markup: mainMenu })
      return
    }

    if (userCtx.message?.voice) {
      await userCtx.reply("🤖 [Заглушка AI]: Я получил твое голосовое сообщение.")
      continue
    }

    if (userCtx.message?.text) {
      await userCtx.reply(`🤖 [Заглушка AI]: Ты написал: "${userCtx.message.text}"`)
    }
  }
}