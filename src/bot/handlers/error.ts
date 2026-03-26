import type { Context } from '#root/bot/context.js'
import type { ErrorHandler } from 'grammy'
import { getUpdateInfo } from '#root/bot/helpers/logging.js'
import { sendTelegramLog, LOG_TOPICS } from '#root/bot/services/telegram-logger.js'

export const errorHandler: ErrorHandler<Context> = async (error) => {
  const { ctx } = error
  const logChatId = ctx.config.logChatId

  ctx.logger.error({
    err: error.error,
    update: getUpdateInfo(ctx),
  })

  // Send error to Telegram log forum if configured
  if (logChatId) {
    const errorMessage = error.error instanceof Error 
      ? error.error.message 
      : String(error.error)
    
    const errorStack = error.error instanceof Error && error.error.stack
      ? error.error.stack
      : 'No stack trace available'

    const updateInfo = getUpdateInfo(ctx)
    
    await sendTelegramLog(
      ctx.api,
      logChatId,
      LOG_TOPICS.ERRORS.key,
      `🔴 <b>Error</b>\n\n` +
      `<b>Message:</b> ${errorMessage.substring(0, 500)}\n\n` +
      `<b>Update:</b> ${updateInfo}\n\n` +
      `<b>Stack:</b>\n<code>${errorStack.substring(0, 1500)}</code>`
    )
  }
}
