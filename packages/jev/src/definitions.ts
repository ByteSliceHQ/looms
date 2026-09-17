import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { Schema } from 'effect'

import { defineKind, type JsonValue } from '@looms/core'

import type { JevQuestions, JevRouteArgs, JevRouteDecision, JevSkipResult } from './types'

export interface JevDefinition<TName extends string = string, TInput = JsonValue> {
  readonly kind: 'jev'
  readonly name: TName
  readonly description?: string
  readonly model?: string
  readonly input?: StandardSchemaV1<any, TInput> | Schema.ConstraintDecoder<TInput>
  readonly questions: JevQuestions
  state?(input: TInput): string
  skipModel?(input: TInput): JevSkipResult | undefined
  route?(args: JevRouteArgs): JevRouteDecision
}

export type AnyJevDefinition = JevDefinition

export function defineJev<TName extends string, TInput = JsonValue>(
  def: Omit<JevDefinition<TName, TInput>, 'kind'>,
): JevDefinition<TName, TInput> {
  return defineKind('jev', def)
}
