import { Context, Layer } from 'effect'

import type { EvaluatorDefinition } from './definitions'

export interface EvaluatorDefinitionStore {
  get(name: string): EvaluatorDefinition | undefined
}

export class EvaluatorDefinitionsTag extends Context.Service<
  EvaluatorDefinitionsTag,
  EvaluatorDefinitionStore
>()('looms/EvaluatorDefinitions') {}

export function makeEvaluatorDefinitionStore(
  definitions: ReadonlyArray<EvaluatorDefinition>,
): EvaluatorDefinitionStore {
  const map = new Map(definitions.map((def) => [def.name, def]))
  return { get: (name) => map.get(name) }
}

export const EvaluatorDefinitionsLive = (definitions: ReadonlyArray<EvaluatorDefinition>) =>
  Layer.succeed(EvaluatorDefinitionsTag, makeEvaluatorDefinitionStore(definitions))
