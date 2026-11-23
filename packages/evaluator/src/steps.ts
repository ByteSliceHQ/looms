import {
  createWaitId,
  invoke,
  typeIds,
  wait,
  type JsonValue,
  type LoomsIds,
  type RuntimeEffect,
} from '@looms/core'

import type { EvaluatorDefinition } from './definitions'
import { evaluateEffect } from './effects'

export function evaluate(
  definition: EvaluatorDefinition,
  input: JsonValue,
  ids: LoomsIds = typeIds,
): RuntimeEffect[] {
  const evaluationId = ids.create('wait')

  return [
    invoke(
      evaluateEffect,
      {
        evaluationId,
        definitionName: definition.name,
        input,
      },
      `evaluate_${evaluationId}`,
    ),
    wait({
      waitId: createWaitId(evaluationId, 'result'),
      on: { type: 'evaluator.evaluated', match: { evaluationId } },
      tag: { evaluationId },
    }),
  ]
}
