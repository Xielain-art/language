import type { Context } from '#root/bot/context.js'
import { isAdmin } from '#root/bot/filters/is-admin.js'
import { setCommandsHandler } from '#root/bot/handlers/commands/setcommands.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { initLogTopics, sendTelegramLog, LOG_TOPICS } from '#root/bot/services/telegram-logger.js'
import { chatAction } from '@grammyjs/auto-chat-action'
import { Composer } from 'grammy'

const composer = new Composer<Context>()

const feature = composer
  .chatType('private')
  .filter(isAdmin)

feature.command(
  'setcommands',
  logHandle('command-setcommands'),
  chatAction('typing'),
  async (ctx) => {
    const logChatId = ctx.config.logChatId
    
    // Execute the setcommands handler
    await setCommandsHandler(ctx)
    
    // Log admin action if logging is configured
    if (logChatId) {
      await sendTelegramLog(
        ctx.api,
        logChatId,
        LOG_TOPICS.ADMIN.key,
        `🛡 <b>Admin Action</b>\nCommand: /setcommands\nAdmin: ${ctx.from?.first_name} (${ctx.from?.id})\nResult: Bot commands updated`
      )
    }
  },
)

feature.command(
  'initlogs',
  logHandle('command-initlogs'),
  chatAction('typing'),
  async (ctx) => {
    const logChatId = ctx.config.logChatId
    
    if (!logChatId) {
      await ctx.reply('❌ LOG_CHAT_ID is not configured. Please add it to your .env file.')
      return
    }

    await ctx.reply('🔄 Initializing log topics...')

    try {
      const results = await initLogTopics(ctx.api, logChatId)
      
      let response = '📊 <b>Log Topics Initialization Results:</b>\n\n'
      
      for (const result of results) {
        const statusEmoji = result.status === 'created' ? '✅' : result.status === 'exists' ? 'ℹ️' : '❌'
        const statusText = result.status === 'created' ? 'Created' : result.status === 'exists' ? 'Already exists' : 'Error'
        
        response += `${statusEmoji} ${result.topic}\n`
        response += `   Status: ${statusText}`
        
        if (result.messageThreadId) {
          response += ` (ID: ${result.messageThreadId})`
        }
        response += '\n\n'
      }

      await ctx.reply(response, { parse_mode: 'HTML' })

      // Log admin action
      await sendTelegramLog(
        ctx.api,
        logChatId,
        LOG_TOPICS.ADMIN.key,
        `🛡 <b>Admin Action</b>\nCommand: /initlogs\nAdmin: ${ctx.from?.first_name} (${ctx.from?.id})\nResult: Initialized ${results.filter(r => r.status === 'created').length} new topics`
      )
    } catch (error) {
      console.error('Failed to initialize log topics:', error)
      await ctx.reply('❌ Failed to initialize log topics. Check console for details.')
    }
  },
)

export { composer as adminFeature }
