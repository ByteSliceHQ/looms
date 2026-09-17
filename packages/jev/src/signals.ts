import { createWaitId, invoke, wait, type JsonValue, type RuntimeEffect } from '@looms/core'

import type { JevDefinition } from './definitions'
import { evaluateEffect } from './effects'

export function evaluate(definition: JevDefinition, input: JsonValue): RuntimeEffect[] {
  const evaluationId = createWaitId('jev')

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
      on: { type: 'jev.evaluated', match: { evaluationId } },
      tag: { evaluationId },
    }),
  ]
}
