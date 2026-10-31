import type { EventsOf } from '@swirls/looms/core'

import type { meridianModules } from './runtime'

export type MeridianEvents = EventsOf<typeof meridianModules>

declare module '@swirls/looms/core' {
  interface LoomsRegister {
    events: MeridianEvents
  }
}
