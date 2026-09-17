import { Layer } from 'effect'

import { defineModule } from '@looms/core'

import type { JevDefinition } from './definitions'
import { JevDefinitionsLive } from './definitions-store'
import { evaluateEffect } from './effects'
import {
  jevFromAdapter,
  JevTag,
  StubJevLive,
  type JevAdapter,
  type StubJevPolicy,
} from './evaluator'
import { evaluations } from './projections'
import { jevModule } from './scope'
import { jevThread } from './threads'

export interface JevModuleOptions {
  readonly definitions?: readonly JevDefinition[]
  /** Model adapter used for every evaluation. Defaults to a deterministic stub. */
  readonly evaluator?: JevAdapter
  readonly evaluatorPolicy?: StubJevPolicy
}

export function jev(options: JevModuleOptions = {}) {
  const definitions = options.definitions ?? []

  const evaluatorLayer = options.evaluator
    ? Layer.succeed(JevTag, jevFromAdapter(options.evaluator))
    : StubJevLive(options.evaluatorPolicy)

  return defineModule(jevModule, () => ({
    definitions,
    threads: { jev: jevThread },
    effects: {
      evaluate: evaluateEffect,
    },
    projections: {
      evaluations,
    },
    services: () => Layer.merge(evaluatorLayer, JevDefinitionsLive(definitions)),
  }))
}
