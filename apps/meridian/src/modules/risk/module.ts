import { defineModule } from '@swirls/looms/core'

import { checkRisk } from './effects'
import { exposure } from './projections'
import { riskScope } from './scope'

export const risk = defineModule(riskScope, () => ({
  effects: { check: checkRisk },
  projections: { exposure },
}))
