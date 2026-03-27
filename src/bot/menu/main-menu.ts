import type { Context } from '#root/bot/context.js'
import { getProfileText } from '#root/bot/helpers/profile.js'
import { supabase } from '#root/services/supabase.js'
import { Menu } from '@grammyjs/menu'

export const mainMenu = new Menu<Context>('main-menu')
  .text(
    ctx => ctx.t('menu-free-chat'),
    async (ctx) => {
      ctx.session.state = 'free_chat'
      ctx.session.chatHistory = []
      await ctx.deleteMessage().catch(() => {})
      
      const activationText = `💬 <b>${ctx.t('free-chat-activated')}</b>`
      await ctx.reply(activationText, {
          parse_mode: 'HTML',
          reply_markup: {
              keyboard: [[{ text: ctx.t('free-chat-cancel-btn') }]],
              resize_keyboard: true
          }
      })
    },
  )
  .row()
  .text(
    ctx => ctx.t('menu-voice-chat'),
    async (ctx) => {
      ctx.session.state = 'voice_chat'
      ctx.session.chatHistory = []
      await ctx.deleteMessage().catch(() => {})
      
      const activationText = `🎙 <b>${ctx.t('voice-chat-activated')}</b>`
      await ctx.reply(activationText, {
          parse_mode: 'HTML',
          reply_markup: {
              keyboard: [[{ text: ctx.t('free-chat-cancel-btn') }]],
              resize_keyboard: true
          }
      })
    },
  )
  .row()
  .text(ctx => ctx.t('menu-roles'), async (ctx) => {
    await ctx.editMessageText(ctx.t('menu-roles'), { parse_mode: 'HTML' })
    ctx.menu.nav('roleplay-menu')
  })
  .row()
  .text(ctx => ctx.t('menu-vocabulary'), async (ctx) => {
    await ctx.editMessageText(ctx.t('vocabulary-title'), { parse_mode: 'HTML' })
    ctx.menu.nav('vocabulary-menu')
  })
  .row()
  .text(ctx => ctx.t('menu-statistics'), async (ctx) => {
    await ctx.editMessageText(ctx.t('stats-title'), { parse_mode: 'HTML' })
    ctx.menu.nav('statistics-menu')
  })
  .row()
  .text(ctx => ctx.t('menu-settings'), async (ctx) => {
    await ctx.editMessageText(ctx.t('menu-settings'), { parse_mode: 'HTML' })
    ctx.menu.nav('settings-menu')
  })
  .row()
  .text(ctx => ctx.t('menu-about'), async (ctx) => {
    await ctx.editMessageText(ctx.t('about-text'), { parse_mode: 'HTML' })
    ctx.menu.nav('about-menu')
  })
