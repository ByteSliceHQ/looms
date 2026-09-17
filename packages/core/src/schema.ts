import type { StandardSchemaV1 } from '@standard-schema/spec'
import { Data, Effect, Predicate, Schema } from 'effect'

import type { JsonValue } from './types'

export class InvalidInputError extends Data.TaggedError('InvalidInputError')<{
  readonly message: string
  readonly issues: ReadonlyArray<StandardSchemaV1.Issue>
}> {
  override readonly issues: ReadonlyArray<StandardSchemaV1.Issue>

  constructor(text: string, issues: ReadonlyArray<StandardSchemaV1.Issue> = []) {
    super({ message: text, issues })
    this.name = 'InvalidInputError'
    this.issues = issues
  }
}

export type SchemaInput = StandardSchemaV1<any, any> | Schema.ConstraintDecoder<unknown>

export type InferSchemaOutput<T> =
  T extends Schema.Schema<infer Out>
    ? Out
    : T extends Schema.ConstraintDecoder<unknown>
      ? Schema.Schema.Type<T>
      : T extends StandardSchemaV1<any, infer Out>
        ? Out
        : never

/** Output of an optional `input` / `shape` schema, or `TFallback` when the schema is omitted. */
export type InferDefinedSchema<T, TFallback = JsonValue> = [T] extends [undefined]
  ? TFallback
  : InferSchemaOutput<NonNullable<T>>

type DecodedInput = InferSchemaOutput<SchemaInput>
type ValidatedInput<TSchema extends SchemaInput | null | undefined> = TSchema extends SchemaInput
  ? InferSchemaOutput<TSchema>
  : JsonValue

function isStandardSchema(candidate: SchemaInput): candidate is StandardSchemaV1<any, any> {
  if (!Predicate.isReadonlyObject(candidate) || !('~standard' in candidate)) {
    return false
  }

  const standard = candidate['~standard']
  return (
    Predicate.isReadonlyObject(standard) &&
    'validate' in standard &&
    Predicate.isFunction(standard.validate)
  )
}

function toStandard(candidate: SchemaInput): StandardSchemaV1<any, any> {
  return isStandardSchema(candidate) ? candidate : Schema.toStandardSchemaV1(candidate)
}

function formatIssue(issue: StandardSchemaV1.Issue): string {
  if (!issue.path || issue.path.length === 0) {
    return issue.message
  }

  const pathStr = issue.path
    .map((p) => {
      if (Predicate.isReadonlyObject(p) && 'key' in p) {
        return String(p.key)
      }

      if (Predicate.isString(p) || Predicate.isNumber(p)) {
        return String(p)
      }

      return ''
    })
    .filter((s) => s.length > 0)
    .join('.')

  return `${pathStr}: ${issue.message}`
}

function decodeInput(
  schema: SchemaInput | null | undefined,
  raw: JsonValue,
): Effect.Effect<DecodedInput, InvalidInputError> {
  if (!schema) {
    return Effect.succeed(raw)
  }

  const standard = toStandard(schema)
  return Effect.tryPromise({
    try: () => Promise.resolve(standard['~standard'].validate(raw)),
    catch: (cause) =>
      new InvalidInputError(
        `Schema validation failed: ${cause instanceof Error ? cause.message : String(cause)}`,
      ),
  }).pipe(
    Effect.flatMap((result) => {
      if (result.issues !== undefined) {
        const text = result.issues.map(formatIssue).join(', ')
        return new InvalidInputError(`Invalid input: ${text}`, result.issues)
      }

      return Effect.succeed(result.value)
    }),
  )
}

export function validateInputEffect<TSchema extends SchemaInput | null | undefined>(
  schema: TSchema,
  raw: JsonValue,
): Effect.Effect<ValidatedInput<TSchema>, InvalidInputError>

export function validateInputEffect(
  schema: SchemaInput | null | undefined,
  raw: JsonValue,
): Effect.Effect<DecodedInput, InvalidInputError> {
  return decodeInput(schema, raw)
}

export function validateInput<TSchema extends SchemaInput>(
  schema: TSchema,
  raw: JsonValue,
): Promise<InferSchemaOutput<TSchema>>

export function validateInput(schema: null | undefined, raw: JsonValue): Promise<JsonValue>

export function validateInput(
  schema: SchemaInput | null | undefined,
  raw: JsonValue,
): Promise<DecodedInput> {
  return Effect.runPromise(decodeInput(schema, raw))
}

export function validateInputSync<TSchema extends SchemaInput>(
  schema: TSchema,
  raw: JsonValue,
): InferSchemaOutput<TSchema>

export function validateInputSync(schema: null | undefined, raw: JsonValue): JsonValue

export function validateInputSync(
  schema: SchemaInput | null | undefined,
  raw: JsonValue,
): DecodedInput {
  if (!schema) {
    return raw
  }

  const result = toStandard(schema)['~standard'].validate(raw)

  if (result instanceof Promise) {
    throw new Error('Async schema validation is not supported in synchronous context')
  }

  if (result.issues !== undefined) {
    const text = result.issues.map(formatIssue).join(', ')
    throw new InvalidInputError(`Invalid input: ${text}`, result.issues)
  }

  return result.value
}
