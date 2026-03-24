import type { Context } from '#root/bot/context.js'
import { Buffer } from 'node:buffer'

/**
 * Downloads a voice file from Telegram and converts it to base64.
 */
export async function downloadVoiceAsBase64(ctx: Context, fileId: string): Promise<string> {
  const fileObj = await ctx.api.getFile(fileId)
  const fileUrl = `https://api.telegram.org/file/bot${ctx.config.botToken}/${fileObj.file_path}`

  const res = await fetch(fileUrl)
  if (!res.ok) {
    throw new Error('Failed to download voice file')
  }
  
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer).toString('base64')
}
