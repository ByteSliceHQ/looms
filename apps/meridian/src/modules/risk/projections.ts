import { z } from 'zod'

import { riskScope } from './scope'

const Exposure = z.object({
  outcome: z.enum(['passed', 'soft_breach', 'blocked']).nullable(),
  reason: z.string().nullable(),
  breaches: z.number(),
})

export const exposure = riskScope.projection({
  name: 'exposure',
  shape: Exposure,
  initialState: { outcome: null, reason: null, breaches: 0 },
  reduce(state, event) {
    switch (event.type) {
      case 'risk.check.passed':
      case 'risk.check.soft_breach':
      case 'risk.check.blocked':
        return {
          outcome: event.payload.outcome,
          reason: event.payload.reason,
          breaches: event.payload.outcome === 'passed' ? state.breaches : state.breaches + 1,
        }
      case 'risk.check.completed':
        return state
      default:
        return state
    }
  },
})
