import { agent, type LlmAdapter } from '@swirls/looms/agent'
import { approval } from '@swirls/looms/approval'
import { evaluator, type EvaluatorAdapter } from '@swirls/looms/evaluator'
import { schedule } from '@swirls/looms/schedule'
import { workflow } from '@swirls/looms/workflow'

import { analyst } from './definitions/analyst'
import { tradeCycle } from './definitions/cycle'
import { gradeFill } from './definitions/grade'
import { endOfDay, eodRecon, marketOpen, openBook } from './definitions/schedules'
import { attributeSymbol } from './definitions/schedules'
import { tradeSession } from './definitions/session'
import { execution } from './modules/execution'
import { ledger } from './modules/ledger'
import { market } from './modules/market'
import { risk } from './modules/risk'
import { signals } from './modules/signals'

export interface MeridianHostOptions {
  readonly llm?: LlmAdapter
  readonly evaluator?: EvaluatorAdapter
}

export function meridianModules(options: MeridianHostOptions = {}) {
  const agents = options.llm
    ? agent({ definitions: [analyst], llm: options.llm })
    : agent({ definitions: [analyst] })

  const evaluators = options.evaluator
    ? evaluator({ definitions: [gradeFill], evaluator: options.evaluator })
    : evaluator({ definitions: [gradeFill] })

  return [
    agents,
    workflow({
      definitions: [tradeCycle, tradeSession, openBook, eodRecon, attributeSymbol],
    }),
    evaluators,
    approval(),
    schedule({ definitions: [marketOpen, endOfDay] }),
    market,
    signals,
    risk,
    execution,
    ledger,
  ] as const
}
