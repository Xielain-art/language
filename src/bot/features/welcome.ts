import type { Context } from '#root/bot/context.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { getMainMenuKeyboard, getLanguageMenuKeyboard } from '#root/bot/helpers/keyboards.js'
import { getProfileText } from '#root/bot/helpers/profile.js'
import { supabase } from '#root/services/supabase.js'
import { Composer } from 'grammy'
import { getUserProfile } from '#root/bot/services/user.js'
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

      if (!profile) {
        // User doesn't exist, insert them using upsert and return the created profile
        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .upsert({ id: userId }, { onConflict: 'id' })
          .select()
          .single()
        
        if (insertError) {
          console.error('Error inserting user:', insertError)
        }
        
        if (newProfile) {
          profile = {
            id: Number(newProfile.id),
            level: newProfile.level,
            selected_tone_code: newProfile.selected_tone_code,
            selected_analysis_tone_code: newProfile.selected_analysis_tone_code,
            learning_language: newProfile.learning_language,
            selected_ai_model: newProfile.selected_ai_model || 'gemini-2.5-flash-lite',
            ui_language_selected: newProfile.ui_language_selected || false,
            learning_language_selected: newProfile.learning_language_selected || false,
            level_selected: newProfile.level_selected || false,
          }
        }
      }

      if (profile) {
        ctx.session.user = profile
        ctx.session.userExists = true

        // If onboarding is complete, show main menu
        if (profile.ui_language_selected && profile.learning_language_selected && profile.level_selected) {
          const profileText = getProfileText(ctx)
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
        
        // If both UI language and learning language are selected but level is not, show level selection
        if (profile.ui_language_selected && profile.learning_language_selected && !profile.level_selected) {
          return ctx.reply(ctx.t('language-level'), {
            reply_markup: onboardingLevelMenu,
          })
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

    const profileText = getProfileText(ctx)
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