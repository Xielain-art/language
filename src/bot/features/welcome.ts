import type { Context } from '#root/bot/context.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { getMainMenuKeyboard, getLanguageMenuKeyboard } from '#root/bot/helpers/keyboards.js'
import { getProfileText } from '#root/bot/helpers/profile.js'
import { sendTelegramLog, LOG_TOPICS } from '#root/bot/services/telegram-logger.js'
import { Composer } from 'grammy'
import { getUserProfile, createUserIfNotExists } from '#root/bot/services/user.js'
import { languageMenu, mainMenu } from '#root/bot/menu/index.js'
import { onboardingLevelMenu } from '#root/bot/menu/language-level-menu.js'

const composer = new Composer<Context>()

const feature = composer.chatType('private')

feature.command('start', logHandle('command-start'), async (ctx) => {
  try {
    const userId = ctx.from?.id
    const locale = ctx.session.__language_code || ctx.from?.language_code || 'en'
    if (userId) {
      // CRITICAL: Onboarding/Registration logic
      let profile = await getUserProfile(userId, locale)

      const isNewUser = !profile
      
      if (!profile) {
        // User doesn't exist, create them using the service
        profile = await createUserIfNotExists(userId)
      }

      if (profile) {
        ctx.session.user = profile
        ctx.session.userExists = true
        
        // Log new user registration to Telegram forum if configured
        const logChatId = ctx.config.logChatId
        if (logChatId && isNewUser) {
          await sendTelegramLog(
            ctx.api,
            logChatId,
            LOG_TOPICS.USERS.key,
            `👤 <b>New User Registration</b>\n\n` +
            `<b>Name:</b> ${ctx.from?.first_name} ${ctx.from?.last_name || ''}\n` +
            `<b>Username:</b> @${ctx.from?.username || 'N/A'}\n` +
            `<b>User ID:</b> ${userId}\n` +
            `<b>Language:</b> ${ctx.from?.language_code || 'N/A'}`
          )
        }

        // If onboarding is complete, show main menu
        if (profile.ui_language_selected && profile.learning_language_selected && profile.level_selected) {
          const profileText = await getProfileText(ctx)
          if (profileText) {
            return ctx.reply(profileText, {
              parse_mode: 'HTML',
              reply_markup: mainMenu,
            })
          } else {
            return ctx.reply(ctx.t('menu-main-title'), {
              reply_markup: mainMenu,
            })
          }
        }
        
        // If UI language is selected but learning language is not, show target language selection
        if (profile.ui_language_selected && !profile.learning_language_selected) {
          const { selectLanguageToLearnMenu } = await import('#root/bot/menu/select-language-to-learn.js')
          return ctx.reply(ctx.t('language-to-learn'), {
            reply_markup: selectLanguageToLearnMenu,
          })
        }

        // Force AI placement test instead of manual level selection
        if (profile.ui_language_selected && profile.learning_language_selected && !profile.level_selected) {
          const { startPlacementTest } = await import('#root/bot/features/placement-test.js')
          return startPlacementTest(ctx)
        }
      }
    }

    // Start onboarding flow - first select UI language
    // Show welcome message in both languages
    const welcomeText = `👋 Hello, ${ctx.from!.first_name}!\nЯ твой AI-репетитор. Я помогу тебе заговорить свободно.\n\nSend me **voice messages**, and I will correct your mistakes in real-time.\nОтправляй мне **голосовые сообщения**, и я буду исправлять твои ошибки в реальном времени.\n\nTo start, please select your interface language:\nДля начала выбери язык интерфейса:`
    
    await ctx.reply(welcomeText, { parse_mode: 'Markdown' })
    return ctx.reply(ctx.t('language'), {
      reply_markup: languageMenu,
    })
  } catch (error) {
    console.error('Error in /start command:', error)
    return ctx.reply(ctx.t('error-unexpected'))
  }
})

// /menu command - only available after onboarding is complete
feature.command('menu', logHandle('command-menu'), async (ctx) => {
  try {
    const userId = ctx.from?.id
    if (!userId) {
      return ctx.reply(ctx.t('error-user-not-found'))
    }

    const locale = ctx.session.__language_code || ctx.from?.language_code || 'en'
    const profile = await getUserProfile(userId, locale)

    if (!profile) {
      return ctx.reply(ctx.t('error-user-not-found'))
    }

    ctx.session.user = profile
    ctx.session.userExists = true

    // Check if onboarding is complete
    if (!profile.ui_language_selected || !profile.learning_language_selected || !profile.level_selected) {
      return ctx.reply(ctx.t('setup-required'))
    }

    const profileText = await getProfileText(ctx)
    if (profileText) {
      return ctx.reply(profileText, {
        parse_mode: 'HTML',
        reply_markup: mainMenu,
      })
    } else {
      return ctx.reply(ctx.t('menu-main-title'), {
        reply_markup: mainMenu,
      })
    }
  } catch (error) {
    console.error('Error in /menu command:', error)
    return ctx.reply(ctx.t('error-unexpected'))
  }
})

export { composer as welcomeFeature }