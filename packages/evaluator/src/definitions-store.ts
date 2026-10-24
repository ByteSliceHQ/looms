import { Context, Layer } from 'effect'

import { makeDefinitionStore, type DefinitionStore } from '@looms/core'

import type { EvaluatorDefinition } from './definitions'

export type EvaluatorDefinitionStore = DefinitionStore<EvaluatorDefinition>

export class EvaluatorDefinitionsTag extends Context.Service<
  EvaluatorDefinitionsTag,
  EvaluatorDefinitionStore
>()('looms/EvaluatorDefinitions') {}

export function makeEvaluatorDefinitionStore(
  definitions: ReadonlyArray<EvaluatorDefinition>,
): EvaluatorDefinitionStore {
  return makeDefinitionStore('evaluator', definitions)
}

export const EvaluatorDefinitionsLive = (definitions: EvaluatorDefinitionStore) =>
  Layer.succeed(EvaluatorDefinitionsTag, definitions)
