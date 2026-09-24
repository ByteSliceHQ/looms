import { createWaitId, invoke, wait, type JsonValue, type RuntimeEffect } from '@looms/core'

import type { EvaluatorDefinition } from './definitions'
import { evaluateEffect } from './effects'

export function evaluate(definition: EvaluatorDefinition, input: JsonValue): RuntimeEffect[] {
  const evaluationId = createWaitId('evaluator')

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
