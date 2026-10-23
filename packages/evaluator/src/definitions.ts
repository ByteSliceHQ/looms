import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { Schema } from 'effect'

import { DEFAULT_DEFINITION_VERSION, defineKind, type JsonValue } from '@looms/core'

import type {
  EvaluatorQuestions,
  EvaluatorRouteArgs,
  EvaluatorRouteDecision,
  EvaluatorSkipResult,
} from './types'

export interface EvaluatorDefinition<TName extends string = string, TInput = JsonValue> {
  readonly kind: 'evaluator'
  readonly name: TName
  readonly version: string
  readonly description?: string
  /** Provider model id. Omit it to use the adapter default. */
  readonly model?: string
  readonly input?: StandardSchemaV1<any, TInput> | Schema.ConstraintDecoder<TInput>
  readonly questions: EvaluatorQuestions
  state?(this: void, input: TInput): string
  skipModel?(this: void, input: TInput): EvaluatorSkipResult | undefined
  route?(this: void, args: EvaluatorRouteArgs): EvaluatorRouteDecision
}

export type AnyEvaluatorDefinition = EvaluatorDefinition

export function defineEvaluator<TName extends string, TInput = JsonValue>(
  def: Omit<EvaluatorDefinition<TName, TInput>, 'kind' | 'version'> & {
    readonly version?: string
  },
): EvaluatorDefinition<TName, TInput> {
  return defineKind('evaluator', {
    ...def,
    version: def.version ?? DEFAULT_DEFINITION_VERSION,
  })
}
