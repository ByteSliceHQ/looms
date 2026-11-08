import { createModuleScope, type EventOf } from '@looms/core'

import { evaluatorCatalog } from './events'

export const evaluatorModule = createModuleScope({
  namespace: 'evaluator',
  protocolVersion: '1.0.0',
  description: 'Typed questions that branch a run.',
  events: evaluatorCatalog,
})

export type EvaluatorEvent = EventOf<typeof evaluatorModule>
