// src/bot/context.ts
import type { Config } from '#root/config.js'
import type { Logger } from '#root/logger.js'
import type { AutoChatActionFlavor } from '@grammyjs/auto-chat-action'
import type { Conversation, ConversationFlavor } from '@grammyjs/conversations'
import type { HydrateFlavor } from '@grammyjs/hydrate'
import type { I18nFlavor } from '@grammyjs/i18n'
import type { MenuFlavor } from '@grammyjs/menu'
import type { ParseModeFlavor } from '@grammyjs/parse-mode'
import type { Context as DefaultContext, SessionFlavor } from 'grammy'

export interface SessionData {
  languageLevel?: string
  learning_language?: string
  selected_tone_code?: string
  targetLanguageName?: string
}

interface ExtendedContextFlavor {
  logger: Logger
  config: Config
}

export type InnerContext = ParseModeFlavor<
  HydrateFlavor<
    DefaultContext &
    ExtendedContextFlavor &
    SessionFlavor<SessionData> &
    I18nFlavor &
    MenuFlavor &
    AutoChatActionFlavor
  >
>

export type Context = InnerContext & ConversationFlavor<InnerContext>

export type MyConversation = Conversation<Context, InnerContext>
