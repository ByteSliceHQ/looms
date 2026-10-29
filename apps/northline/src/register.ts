import type { EventsOf } from '@swirls/looms/core'

import type { northlineModules } from './runtime'

export type NorthlineEvents = EventsOf<typeof northlineModules>

declare module '@swirls/looms/core' {
  interface LoomsRegister {
    events: NorthlineEvents
  }
}
