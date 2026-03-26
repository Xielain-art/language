// src/bot/context.ts
import type { Config } from '#root/config.js'
import type { Logger } from '#root/logger.js'
import type { AutoChatActionFlavor } from '@grammyjs/auto-chat-action'
import type { HydrateFlavor } from '@grammyjs/hydrate'
import type { I18nFlavor } from '@grammyjs/i18n'
import type { MenuFlavor } from '@grammyjs/menu'
import type { ParseModeFlavor } from '@grammyjs/parse-mode'
import type { Context as DefaultContext, SessionFlavor } from 'grammy'

import type { ContentItem } from '#root/bot/services/ai.js'
import type { UserProfile } from '#root/bot/services/user.js'

export interface SessionData {
  __language_code?: string
  userExists?: boolean
  user?: UserProfile | null
  
  // Vocabulary State
  vocabularyPage?: number;
  selectedWordId?: string;
  selectedVocabularyStatus?: boolean;
  selectedVocabularyLanguage?: string;
  learnWordsList?: string[]
  learnWordsIndex?: number

  // Progress Reports State
  reportsPage?: number;
  selectedReportId?: string;

  // FSM State
  state: 'idle' | 'free_chat' | 'placement_test'
  chatHistory: ContentItem[]
  
  // Track last bot message ID for inline button removal (optimized)
  lastInteractiveMessageId?: number
  
  // Placement Test State
  placementTestData?: {
    currentQuestion: number
    questions: string[]
    answers: Array<{
      question: string
      answer: string
      audioBase64?: string
    }>
  }
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

export type Context = InnerContext
