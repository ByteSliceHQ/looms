import { z } from 'zod'

import { NoticeBody } from './events'
import { noticesScope } from './scope'

const OutboxItem = NoticeBody.extend({
  status: z.enum(['queued', 'delivered']),
})

const OutboxState = z.object({
  items: z.array(OutboxItem),
})

export const outbox = noticesScope.projection({
  name: 'outbox',
  shape: OutboxState,
  initialState: { items: [] },
  reduce(state, event) {
    if (event.type !== 'notices.notice.queued' && event.type !== 'notices.notice.delivered') {
      return state
    }

    const status = noticeStatus(event.type)
    const next = { ...event.payload, status }

    return {
      items: [...state.items.filter((item) => item.noticeId !== next.noticeId), next],
    }
  },
})

function noticeStatus(
  type: 'notices.notice.queued' | 'notices.notice.delivered',
): 'queued' | 'delivered' {
  switch (type) {
    case 'notices.notice.delivered':
      return 'delivered'
    case 'notices.notice.queued':
      return 'queued'

    default: {
      const unreachable: never = type
      return unreachable
    }
  }
}
