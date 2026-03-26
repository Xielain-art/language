/**
 * Audio validation helper for voice messages.
 * Centralizes audio validation logic used across features.
 */
import type { Context } from '#root/bot/context.js'
import { getMaxAudioSizeMb, getMaxAudioDurationSec } from '#root/bot/services/bot-settings.js'

export interface AudioValidationConfig {
  maxSizeMb?: number
  maxDurationSec?: number
}

export interface AudioValidationResult {
  valid: boolean
  errorKey?: string
}

/**
 * Validate a voice message against size and duration limits.
 * Uses configurable limits from bot_settings with fallbacks.
 */
export async function validateVoiceMessage(
  ctx: Context,
  fileSize?: number,
  duration?: number,
  config?: AudioValidationConfig
): Promise<AudioValidationResult> {
  const maxSizeMb = config?.maxSizeMb ?? await getMaxAudioSizeMb()
  const maxDurationSec = config?.maxDurationSec ?? await getMaxAudioDurationSec()

  // Check file size
  const sizeInMb = (fileSize || 0) / (1024 * 1024)
  if (sizeInMb > maxSizeMb) {
    return { valid: false, errorKey: 'error-voice-too-large' }
  }

  // Check duration
  if ((duration || 0) > maxDurationSec) {
    return { valid: false, errorKey: 'error-voice-too-long' }
  }

  return { valid: true }
}

/**
 * Validate voice message and send error reply if invalid.
 * Returns true if valid, false if invalid (and error was sent).
 */
export async function validateVoiceMessageAndReply(
  ctx: Context,
  fileSize?: number,
  duration?: number,
  config?: AudioValidationConfig
): Promise<boolean> {
  const result = await validateVoiceMessage(ctx, fileSize, duration, config)
  
  if (!result.valid && result.errorKey) {
    await ctx.reply(ctx.t(result.errorKey))
    return false
  }

  return true
}