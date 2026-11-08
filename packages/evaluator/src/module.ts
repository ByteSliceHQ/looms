import { Layer } from 'effect'

import { defineModule, makeDefinitionStore } from '@looms/core'

import type { EvaluatorDefinition } from './definitions'
import { EvaluatorDefinitionsLive } from './definitions-store'
import { evaluateEffect } from './effects'
import {
  evaluatorFromAdapter,
  EvaluatorTag,
  StubEvaluatorLive,
  type StubEvaluatorPolicy,
} from './evaluator'
import { evaluations } from './projections'
import { evaluatorModule } from './scope'
import { evaluate } from './steps'
import { evaluatorThread } from './threads'
import type { EvaluatorAdapter } from './types'

export interface EvaluatorModuleOptions {
  readonly definitions?: readonly EvaluatorDefinition[]
  /** Model adapter used for every evaluation. Defaults to a deterministic stub. */
  readonly evaluator?: EvaluatorAdapter
  readonly evaluatorPolicy?: StubEvaluatorPolicy
}

export function evaluator(options: EvaluatorModuleOptions = {}) {
  const listed = options.definitions ?? []
  const definitions = makeDefinitionStore('evaluator', listed)

  const evaluatorLayer = options.evaluator
    ? Layer.succeed(EvaluatorTag, evaluatorFromAdapter(options.evaluator))
    : StubEvaluatorLive(options.evaluatorPolicy)

  return defineModule(evaluatorModule, () => ({
    definitions: listed,
    threads: { evaluator: evaluatorThread },
    effects: {
      evaluate: evaluateEffect,
    },
    projections: {
      evaluations,
    },
    steps: { evaluate },
    examples: [
      {
        name: 'an evaluated answer lands in the list',
        events: [
          evaluatorModule.input('evaluated', {
            evaluationId: 'ev_1',
            definitionName: 'risk',
            answers: {
              ok: { type: 'boolean', value: true, probability: 0.9 },
            },
            route: 'approve',
            reason: 'model',
          }),
        ],
        projections: {
          evaluations: {
            items: [
              {
                evaluationId: 'ev_1',
                definitionName: 'risk',
                answers: {
                  ok: { type: 'boolean', value: true, probability: 0.9 },
                },
                route: 'approve',
                reason: 'model',
              },
            ],
          },
        },
      },
    ],
    services: () => Layer.merge(evaluatorLayer, EvaluatorDefinitionsLive(definitions)),
    bindHost(host) {
      definitions.useResolver(host.definitionResolver)
    },
  }))
}
