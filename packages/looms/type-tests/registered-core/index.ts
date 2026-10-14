import { Schema } from 'effect'

import { defineEventCatalog, defineProjection, type RegisteredEvent } from '@swirls/looms/core'
import { useRunEvents, type LoomsClientStore } from '@swirls/looms/react'

import type { Equal, Expect } from '../expect'

const billing = defineEventCatalog('billing', {
  charged: Schema.Struct({ cents: Schema.Finite }),
})

declare module '@swirls/looms/core' {
  interface LoomsRegister {
    catalog: typeof billing
  }
}

type Charged = Extract<RegisteredEvent, { type: 'billing.charged' }>

export type CatalogPayloadsAreTyped = Expect<Equal<Charged['payload'], { readonly cents: number }>>

export const revenue = defineProjection({
  name: 'revenue',
  initialState: 0,
  reduce(state, event) {
    return event.type === 'billing.charged' ? state + event.payload.cents : state
  },
})

export function useHookTypes(store: LoomsClientStore) {
  const events = useRunEvents(store)

  type Events = Expect<Equal<typeof events, readonly RegisteredEvent[]>>

  return events
}
