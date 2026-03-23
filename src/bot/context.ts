import type { Config } from '#root/config.js'
import type { Logger } from '#root/logger.js'
import type { AutoChatActionFlavor } from '@grammyjs/auto-chat-action'
import type { ConversationFlavor } from '@grammyjs/conversations'
import type { HydrateFlavor } from '@grammyjs/hydrate'
import type { I18nFlavor } from '@grammyjs/i18n'
import type { ParseModeFlavor } from '@grammyjs/parse-mode'
import type { MenuFlavor } from '@grammyjs/menu'
import type { Context as DefaultContext, SessionFlavor } from 'grammy'

export interface SessionData {
  languageLevel?: string
  languageToLearn?: string
}

interface ExtendedContextFlavor {
  logger: Logger
  config: Config
}

type CoreContext = DefaultContext &
  ExtendedContextFlavor &
  SessionFlavor<SessionData> &
  I18nFlavor &
  MenuFlavor &
  AutoChatActionFlavor

export type Context = ParseModeFlavor<
  HydrateFlavor<
    ConversationFlavor<CoreContext>
  >
>