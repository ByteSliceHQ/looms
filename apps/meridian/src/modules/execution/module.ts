import { defineModule } from '@swirls/looms/core'

import { submitOrder } from './effects'
import { blotter } from './projections'
import { executionScope } from './scope'

export const execution = defineModule(executionScope, () => ({
  effects: { submit: submitOrder },
  projections: { blotter },
}))
