import { agent, type LlmAdapter } from '@swirls/looms/agent'
import { approval } from '@swirls/looms/approval'
import type { EvaluatorAdapter } from '@swirls/looms/evaluator'
import { evaluator } from '@swirls/looms/evaluator'
import { schedule } from '@swirls/looms/schedule'
import { workflow } from '@swirls/looms/workflow'

import {
  classifyException,
  dispatcher,
  laneDigest,
  morningSweep,
  recoverShipment,
} from './definitions'
import { notices } from './modules/notices'
import { recovery } from './modules/recovery'
import { shipments } from './modules/shipments'

export interface NorthlineHostOptions {
  /** Model for the dispatcher. Omit it and the agent module uses its built-in stub. */
  readonly llm?: LlmAdapter
  /** Evaluation model. Omit it and the evaluator module uses its deterministic stub. */
  readonly evaluator?: EvaluatorAdapter
}

export function northlineModules(options: NorthlineHostOptions = {}) {
  const agents = options.llm
    ? agent({ definitions: [dispatcher], llm: options.llm })
    : agent({ definitions: [dispatcher] })

  const evaluators = options.evaluator
    ? evaluator({ definitions: [classifyException], evaluator: options.evaluator })
    : evaluator({ definitions: [classifyException] })

  return [
    agents,
    workflow({ definitions: [recoverShipment, laneDigest] }),
    evaluators,
    approval(),
    schedule({ definitions: [morningSweep] }),
    shipments,
    recovery,
    notices,
  ] as const
}
