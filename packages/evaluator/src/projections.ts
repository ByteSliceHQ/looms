import { Schema } from 'effect'

import { EvaluatorEvaluatedPayloadSchema, type EvaluatorEvaluated } from './events'
import { evaluatorModule } from './scope'

export const EvaluationsSchema = Schema.Struct({
  items: Schema.mutable(Schema.Array(EvaluatorEvaluatedPayloadSchema)),
})
export type EvaluationsState = Schema.Schema.Type<typeof EvaluationsSchema>

export const evaluations = evaluatorModule.projection({
  name: 'evaluations',
  shape: EvaluationsSchema,
  initialState: { items: [] },
  reduce(state, event) {
    if (event.type !== 'evaluator.evaluated') {
      return state
    }

    const next: EvaluatorEvaluated = event.payload
    return {
      items: [...state.items.filter((item) => item.evaluationId !== next.evaluationId), next],
    }
  },
})
