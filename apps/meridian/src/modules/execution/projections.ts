import { z } from 'zod'

import { executionScope } from './scope'

const Blotter = z.object({
  lastStatus: z.string().nullable(),
  fills: z.number(),
})

export const blotter = executionScope.projection({
  name: 'blotter',
  shape: Blotter,
  initialState: { lastStatus: null, fills: 0 },
  reduce(state, event) {
    switch (event.type) {
      case 'execution.order.closed':
      case 'execution.order.rejected':
      case 'execution.order.working':
        return { lastStatus: event.payload.status, fills: state.fills }
      case 'execution.order.filled':
      case 'execution.order.partially_filled':
        return { lastStatus: state.lastStatus, fills: state.fills + 1 }
      case 'execution.order.accepted':
        return state
      default:
        return state
    }
  },
})
