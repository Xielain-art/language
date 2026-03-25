import type { Context } from '#root/bot/context.js'
import { getActiveModels } from '#root/bot/services/ai-models.js'
import { updateUserProfile } from '#root/bot/services/user.js'
import { Menu, MenuRange } from '@grammyjs/menu'

export const aiModelMenu = new Menu<Context>('ai-model-menu')
  .dynamic(async (ctx) => {
    const range = new MenuRange<Context>()
    const currentModel = ctx.session.user?.selected_ai_model || 'gemini-2.5-flash-lite'
    
    // Load models from database
    const models = await getActiveModels()

    for (const model of models) {
      const isSelected = currentModel === model.code
      
      range
        .text(
          `${isSelected ? '✅ ' : ''}🤖 ${model.name}`,
          async (ctx) => {
            const userId = ctx.from?.id
            if (userId) {
              try {
                await updateUserProfile(userId, { selected_ai_model: model.code })
                if (ctx.session.user) {
                  ctx.session.user.selected_ai_model = model.code
                }
              } catch (err) {
                console.error('Failed to update AI model:', err)
                await ctx.answerCallbackQuery({ text: ctx.t('error-saving-selection') })
                return
              }
            }
            await ctx.answerCallbackQuery({ text: ctx.t('ai-model-selected', { model: model.name }) })
            
            // Return to settings menu
            const { settingsMenu } = await import('#root/bot/menu/settings-menu.js')
            await ctx.editMessageText(ctx.t('menu-settings-title'), { 
              parse_mode: 'HTML',
              reply_markup: settingsMenu 
            })
          },
        )
        .row()
    }
    return range
  })
  .back(
    ctx => ctx.t('vocabulary-back'),
    async (ctx) => {
      const { settingsMenu } = await import('#root/bot/menu/settings-menu.js')
      await ctx.editMessageText(ctx.t('menu-settings-title'), { 
        parse_mode: 'HTML',
        reply_markup: settingsMenu 
      })
    }
  )