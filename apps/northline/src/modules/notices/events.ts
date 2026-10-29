import { z } from 'zod'

import { defineEventCatalog } from '@swirls/looms/core'

export const SendNoticeInput = z.object({
  shipmentId: z.string(),
  pro: z.string(),
  to: z.string(),
  subject: z.string(),
  body: z.string(),
})
export type SendNoticeInput = z.infer<typeof SendNoticeInput>

export const NoticeBody = z.object({
  noticeId: z.string(),
  shipmentId: z.string(),
  pro: z.string(),
  channel: z.literal('email'),
  to: z.string(),
  subject: z.string(),
  body: z.string(),
})
export type NoticeBody = z.infer<typeof NoticeBody>

export const noticesEvents = defineEventCatalog('notices', {
  'notice.queued': NoticeBody,
  'notice.delivered': NoticeBody,
})
