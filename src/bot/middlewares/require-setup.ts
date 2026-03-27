import type { Context } from '#root/bot/context.js'
import type { NextFunction } from 'grammy'
import { languageMenu } from '#root/bot/menu/index.js'
import { onboardingLevelMenu } from '#root/bot/menu/language-level-menu.js'

/**
 * Middleware to ensure user has completed onboarding (ui_language, target_language, level).
 * Blocks all features until setup is complete.
 */
export async function requireSetup(ctx: Context, next: NextFunction) {
  // Only apply to private chats
  if (ctx.chat?.type !== 'private') {
    return next()
  }

  // Skip if this is a callback_query belonging to onboarding menus
  if (ctx.callbackQuery) {
    const callbackData = ctx.callbackQuery.data
    const onboardingMenus = [
      'language-menu',
      'onboarding-level-menu',
      'settings-level-menu',
      'select-language-to-learn-menu',
      'select-language-menu',
      'ui-language-menu',
    ]
    
    // Check if callback data starts with any onboarding menu prefix
    const isOnboardingCallback = onboardingMenus.some(menu => 
      callbackData?.startsWith(menu) || callbackData === menu
    )
    
    // Also check for menu navigation patterns (e.g., "language-menu:nav:select-language-menu")
    const isMenuNavigation = callbackData?.includes(':nav:') || callbackData?.includes('menu')
    
    if (isOnboardingCallback || isMenuNavigation) {
      return next()
    }
  }

  const user = ctx.session.user

  // If no user session, let the welcome handler deal with it
  if (!user) {
    return next()
  }

  // Allow placement test to proceed
  if (ctx.session.state === 'placement_test') {
    return next()
  }

  // Check if learning_language is set
  if (!user.learning_language_selected) {
    // Delete the incoming message if it exists (with try-catch to handle already deleted messages)
    if (ctx.message) {
      try {
        await ctx.deleteMessage()
      } catch {
        // Message might already be deleted, ignore error
      }
    }

    // Send setup required message and show target language selection
    const { selectLanguageToLearnMenu } = await import('#root/bot/menu/select-language-to-learn.js')
    await ctx.reply(ctx.t('setup-required'))
    await ctx.reply(ctx.t('language-to-learn'), {
      reply_markup: selectLanguageToLearnMenu,
    })
    return
  }

  // Check if level is set
  if (!user.level_selected) {
    // Delete the incoming message if it exists (with try-catch to handle already deleted messages)
    if (ctx.message) {
      try {
        await ctx.deleteMessage()
      } catch {
        // Message might already be deleted, ignore error
      }
    }

    // Send setup required message and force AI placement test
    await ctx.reply(ctx.t('setup-required'))
    const { startPlacementTest } = await import('#root/bot/features/placement-test.js')
    return startPlacementTest(ctx)
  }

  // All setup complete, proceed
  return next()
}