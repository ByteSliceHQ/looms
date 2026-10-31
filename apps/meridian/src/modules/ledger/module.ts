import { defineModule } from '@swirls/looms/core'

import { haltSession, loadDailyFills, openSession, readDesk } from './effects'
import { book } from './projections'
import { ledgerScope } from './scope'

export const ledger = defineModule(ledgerScope, () => ({
  effects: { dailyFills: loadDailyFills, desk: readDesk, open: openSession, halt: haltSession },
  projections: { book },
}))
