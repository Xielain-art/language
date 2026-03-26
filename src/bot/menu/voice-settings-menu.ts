import type { Context } from '#root/bot/context.js'
import { Menu } from '@grammyjs/menu'
import { updateUserProfile } from '#root/bot/services/user.js'
import { getAvailableVoices } from '#root/bot/services/tts.js'
import { sendTelegramLog, LOG_TOPICS } from '#root/bot/services/telegram-logger.js'

export const voiceSettingsMenu = new Menu<Context>('voice-settings-menu')
  .text(
    ctx => {
      const isEnabled = ctx.session.user?.is_voice_enabled
      return isEnabled ? ctx.t('voice-enabled') : ctx.t('voice-disabled')
    },
    async (ctx) => {
      const userId = ctx.from?.id
      if (!userId) return

      const currentState = ctx.session.user?.is_voice_enabled || false
      const newState = !currentState

      try {
        await updateUserProfile(userId, { is_voice_enabled: newState })
        if (ctx.session.user) {
          ctx.session.user.is_voice_enabled = newState
        }

        // Log voice toggle
        const logChatId = ctx.config.logChatId
        if (logChatId) {
          await sendTelegramLog(
            ctx.api,
            logChatId,
            LOG_TOPICS.INTERACTIONS.key,
            `⚙️ <b>Voice ${newState ? 'Enabled' : 'Disabled'}</b>\n\n` +
            `<b>User:</b> ${ctx.from?.first_name} (${userId})`
          )
        }

        await ctx.answerCallbackQuery(newState ? ctx.t('voice-turned-on') : ctx.t('voice-turned-off'))
        
        // Refresh menu
        await ctx.editMessageText(ctx.t('voice-settings-title'), { 
          parse_mode: 'HTML',
          reply_markup: voiceSettingsMenu 
        })
      } catch (error) {
        console.error('Error toggling voice:', error)
        await ctx.answerCallbackQuery(ctx.t('error-saving-selection'))
      }
    }
  )
  .row()
  .text(
    ctx => ctx.t('voice-select'),
    async (ctx) => {
      await ctx.answerCallbackQuery()
      ctx.menu.nav('voice-id-menu')
    }
  )
  .row()
  .back(
    ctx => ctx.t('vocabulary-back'),
    async (ctx) => {
      const { settingsMenu } = await import('./settings-menu.js')
      await ctx.editMessageText(ctx.t('menu-settings'), { 
        parse_mode: 'HTML',
        reply_markup: settingsMenu 
      })
    }
  )

// Voice ID selection submenu
export const voiceIdMenu = new Menu<Context>('voice-id-menu')
  .dynamic(async (ctx, range) => {
    const voices = await getAvailableVoices()
    const currentVoiceId = ctx.session.user?.voice_id || 'default'

    for (const voice of voices) {
      const isSelected = currentVoiceId === voice
      const label = isSelected ? `✅ ${voice}` : voice

      range.text(label, async (c) => {
        const userId = c.from?.id
        if (!userId) return

        try {
          await updateUserProfile(userId, { voice_id: voice })
          if (c.session.user) {
            c.session.user.voice_id = voice
          }

          await c.answerCallbackQuery(c.t('voice-id-selected', { voice }))
          
          // Log voice change
          const logChatId = c.config.logChatId
          if (logChatId) {
            await sendTelegramLog(
              c.api,
              logChatId,
              LOG_TOPICS.INTERACTIONS.key,
              `🗣 <b>Voice Changed</b>\n\n` +
              `<b>User:</b> ${c.from?.first_name} (${userId})\n` +
              `<b>New Voice:</b> ${voice}`
            )
          }
          
          // Refresh menu
          await c.editMessageText(c.t('voice-select'), { 
            parse_mode: 'HTML',
            reply_markup: voiceIdMenu 
          })
        } catch (error) {
          console.error('Error updating voice:', error)
          await c.answerCallbackQuery(c.t('error-saving-selection'))
        }
      }).row()
    }
  })
  .back(
    ctx => ctx.t('vocabulary-back'),
    async (ctx) => {
      await ctx.editMessageText(ctx.t('voice-settings-title'), { 
        parse_mode: 'HTML',
        reply_markup: voiceSettingsMenu 
      })
    }
  )

// Register submenu
voiceSettingsMenu.register(voiceIdMenu)