import { Schema } from 'effect'

import { JevEvaluatedPayloadSchema, type JevEvaluated } from './events'
import { jevModule } from './scope'

export const EvaluationsSchema = Schema.Struct({
  items: Schema.mutable(Schema.Array(JevEvaluatedPayloadSchema)),
})
export type EvaluationsState = Schema.Schema.Type<typeof EvaluationsSchema>

export const evaluations = jevModule.projection({
  name: 'evaluations',
  shape: EvaluationsSchema,
  initialState: { items: [] },
  reduce(state, event) {
    if (event.type !== 'jev.evaluated') {
      return state
    }

    const next: JevEvaluated = event.payload
    return {
      items: [...state.items.filter((item) => item.evaluationId !== next.evaluationId), next],
    }
  },
})
