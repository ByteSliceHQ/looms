import { z } from 'zod'

import { applyFill, flatBook, unrealized } from '../../accounting'
import { ledgerScope } from './scope'

const BookState = z.object({
  position: z.number(),
  avgCost: z.number(),
  cash: z.number(),
  realizedPnl: z.number(),
  mark: z.number(),
  unrealizedPnl: z.number(),
  curve: z.array(z.object({ ts: z.number(), equity: z.number() })),
})

export const book = ledgerScope.projection({
  name: 'book',
  shape: BookState,
  initialState: { ...flatBook, mark: 0, unrealizedPnl: 0, curve: [] },
  reduce(state, event) {
    if (
      event.type !== 'execution.order.filled' &&
      event.type !== 'execution.order.partially_filled'
    ) {
      return state
    }

    const next = applyFill(state, {
      side: event.payload.side,
      qty: event.payload.qty,
      price: event.payload.price,
    })

    const mark = event.payload.price
    const open = unrealized(next, mark)

    return {
      ...next,
      mark,
      unrealizedPnl: open,
      curve: [
        ...state.curve,
        { ts: event.ts ?? 0, equity: next.cash + next.position * mark },
      ].slice(-200),
    }
  },
})
