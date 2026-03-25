import type { Context } from '#root/bot/context.js'
import { Menu } from '@grammyjs/menu'
import { getProfileText } from '#root/bot/helpers/profile.js'

export const aboutMenu = new Menu<Context>('about-menu')
  .back(
    ctx => ctx.t('vocabulary-back'),
    async (ctx) => {
      await ctx.editMessageText(await getProfileText(ctx), { parse_mode: 'HTML' })
    }
  )
