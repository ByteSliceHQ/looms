import { defineModule } from '@swirls/looms/core'

import { computeSignal } from './effects'
import { signalTape } from './projections'
import { signalsScope } from './scope'

export const signals = defineModule(signalsScope, () => ({
  effects: { compute: computeSignal },
  projections: { signalTape },
}))
