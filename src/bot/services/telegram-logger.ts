import type { Api } from 'grammy'
import { getBotSetting, setBotSetting } from '#root/bot/services/bot-settings.js'

/**
 * Log topic categories with their display names and database keys.
 */
export const LOG_TOPICS = {
  ERRORS: {
    name: '🔴 Errors & Bugs',
    key: 'log_topic_errors',
  },
  INTERACTIONS: {
    name: '💬 AI Interactions',
    key: 'log_topic_interactions',
  },
  USERS: {
    name: '👤 Users & Auth',
    key: 'log_topic_users',
  },
  PAYMENTS: {
    name: '💳 Payments & Billing',
    key: 'log_topic_payments',
  },
  PROGRESS: {
    name: '📈 Progress & Reports',
    key: 'log_topic_progress',
  },
  SYSTEM: {
    name: '⚙️ System & Settings',
    key: 'log_topic_system',
  },
  ADMIN: {
    name: '🛡 Admin Actions',
    key: 'log_topic_admin',
  },
} as const

type TopicKey = typeof LOG_TOPICS[keyof typeof LOG_TOPICS]['key']

/**
 * Initializes log topics in the Telegram forum group.
 * Creates topics if they don't exist and saves their IDs to the database.
 * 
 * @param api - GrammY API instance
 * @param logChatId - The chat ID of the log forum group
 * @returns Array of results for each topic initialization
 */
export async function initLogTopics(api: Api, logChatId: string): Promise<{ topic: string; status: 'created' | 'exists' | 'error'; messageThreadId?: number }[]> {
  const chatId = Number(logChatId)
  const results: { topic: string; status: 'created' | 'exists' | 'error'; messageThreadId?: number }[] = []

  for (const topic of Object.values(LOG_TOPICS)) {
    try {
      // Check if topic already exists in database
      const existingTopicId = await getBotSetting(topic.key)
      
      if (existingTopicId) {
        results.push({
          topic: topic.name,
          status: 'exists',
          messageThreadId: Number(existingTopicId),
        })
        continue
      }

      // Create new forum topic
      const result = await api.createForumTopic(chatId, topic.name as string)

      const messageThreadId = result.message_thread_id

      // Save topic ID to database
      await setBotSetting(topic.key, String(messageThreadId))

      results.push({
        topic: topic.name,
        status: 'created',
        messageThreadId,
      })

      // Wait 1 second to avoid 429 Flood Wait error
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`Failed to initialize topic ${topic.name}:`, error)
      results.push({
        topic: topic.name,
        status: 'error',
      })
    }
  }

  return results
}

/**
 * Sends a log message to the specified topic in the Telegram forum group.
 * 
 * @param api - GrammY API instance
 * @param logChatId - The chat ID of the log forum group
 * @param topicKey - The database key of the topic to send to
 * @param message - The message content (HTML supported)
 */
export async function sendTelegramLog(api: Api, logChatId: string, topicKey: TopicKey, message: string): Promise<void> {
  // Skip if logChatId is not configured
  if (!logChatId) {
    return
  }

  try {
    // Get topic ID from database
    const messageThreadId = await getBotSetting(topicKey)
    
    if (!messageThreadId) {
      console.error(`Topic ${topicKey} not initialized. Run /initlogs first.`)
      return
    }

    // Truncate message to 4000 characters if needed (Telegram limit is 4096)
    const truncatedMessage = message.length > 4000 
      ? message.substring(0, 4000) + '\n\n... (truncated)'
      : message

    const chatId = Number(logChatId)
    const threadId = Number(messageThreadId)

    await api.sendMessage(chatId, truncatedMessage, {
      message_thread_id: threadId,
      parse_mode: 'HTML',
    })
  } catch (error) {
    console.error(`Failed to send log to topic ${topicKey}:`, error)
  }
}