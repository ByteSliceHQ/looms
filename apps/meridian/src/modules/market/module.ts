import { defineModule } from '@swirls/looms/core'

import { takeSnapshot } from './effects'
import { lastQuote } from './projections'
import { marketScope } from './scope'

export const market = defineModule(marketScope, () => ({
  effects: { snapshot: takeSnapshot },
  projections: { lastQuote },
}))
