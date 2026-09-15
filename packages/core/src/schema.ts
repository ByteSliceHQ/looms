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

export type SchemaInput =
  | StandardSchemaV1<any, any>
  | Schema.Top
  | Schema.Schema<any>
  | { _output: any }

export type InferSchemaOutput<T> =
  T extends Schema.Schema<infer Out>
    ? Out
    : T extends Schema.Top
      ? Schema.Schema.Type<T>
      : T extends StandardSchemaV1<any, infer Out>
        ? Out
        : T extends { _output: infer Out }
          ? Out
          : never

/** Output of an optional `input` / `shape` schema, or `TFallback` when the schema is omitted. */
export type InferDefinedSchema<T, TFallback = JsonValue> = [T] extends [undefined]
  ? TFallback
  : InferSchemaOutput<NonNullable<T>>

type SchemaCandidate<TInput> =
  | StandardSchemaV1<JsonValue, TInput>
  | StandardSchemaV1<unknown, TInput>
  | StandardSchemaV1<any, TInput>
  | Schema.Schema<TInput>
  | { _output: TInput }
  | {
      input?:
        | StandardSchemaV1<JsonValue, TInput>
        | StandardSchemaV1<unknown, TInput>
        | StandardSchemaV1<any, TInput>
        | Schema.Schema<TInput>
        | { _output: TInput }
      schema?:
        | StandardSchemaV1<JsonValue, TInput>
        | StandardSchemaV1<unknown, TInput>
        | StandardSchemaV1<any, TInput>
        | Schema.Schema<TInput>
        | { _output: TInput }
    }
  | null
  | undefined

function toStandard<TInput>(
  candidate: SchemaCandidate<TInput>,
): StandardSchemaV1<JsonValue, TInput> | undefined {
  if (!candidate) {
    return undefined
  }

  if (Schema.isSchema(candidate)) {
    // SAFETY: Effect Schema converts to StandardSchemaV1 via official helper.
    return Schema.toStandardSchemaV1(candidate as Schema.Codec<TInput, TInput>) as StandardSchemaV1<
      JsonValue,
      TInput
    >
  }

  if (Predicate.isObject(candidate) && '~standard' in candidate) {
    // SAFETY: verified '~standard' property exists on object.
    return candidate as StandardSchemaV1<JsonValue, TInput>
  }

  if (Predicate.isObject(candidate) && 'safeParse' in candidate) {
    // SAFETY: candidate has safeParse property verified by key check.
    const safeParse = (candidate as { safeParse?: unknown }).safeParse

    if (Predicate.isFunction(safeParse)) {
      // SAFETY: verified safeParse is a function matching the Zod safeParse contract.
      const zodSchema = candidate as {
        safeParse: (raw: any) =>
          | { success: true; data: TInput }
          | {
              success: false
              error: { issues: Array<{ message: string; path: (string | number)[] }> }
            }
      }

      return {
        '~standard': {
          version: 1,
          vendor: 'zod-compat',
          validate(raw) {
            const res = zodSchema.safeParse(raw)

            if (res.success) {
              return { value: res.data }
            }

            return {
              issues: res.error.issues.map((issue) => ({
                message: issue.message,
                path: issue.path,
              })),
            }
          },
        },
      }
    }
  }

  return undefined
}

function extractSchema<TInput>(
  schemaOrDef: SchemaCandidate<TInput>,
): StandardSchemaV1<JsonValue, TInput> | undefined {
  const direct = toStandard<TInput>(schemaOrDef)

  if (direct) {
    return direct
  }

  if (schemaOrDef && Predicate.isObject(schemaOrDef)) {
    if ('schema' in schemaOrDef) {
      // SAFETY: verified schemaOrDef has schema property.
      const fromSchema = toStandard<TInput>(
        (schemaOrDef as { schema?: SchemaCandidate<TInput> }).schema,
      )

      if (fromSchema) {
        return fromSchema
      }
    }

    if ('input' in schemaOrDef) {
      // SAFETY: Verified schemaOrDef has input property.
      return toStandard<TInput>((schemaOrDef as { input?: SchemaCandidate<TInput> }).input)
    }
  }

  return undefined
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

export function validateInputEffect<TInput = JsonValue>(
  schemaOrDef: SchemaCandidate<TInput>,
  raw: JsonValue,
): Effect.Effect<TInput, InvalidInputError> {
  const schema = extractSchema(schemaOrDef)

  if (!schema) {
    // SAFETY: when no schema is provided, raw JsonValue is accepted as TInput.
    return Effect.succeed(raw as TInput)
  }

  return Effect.gen(function* () {
    let result = schema['~standard'].validate(raw)

    if (result instanceof Promise) {
      result = yield* Effect.tryPromise({
        // SAFETY: Standard Schema validate() returns this Promise when async.
        try: () => result as Promise<StandardSchemaV1.Result<TInput>>,
        catch: (cause) =>
          new InvalidInputError(
            `Schema validation failed: ${cause instanceof Error ? cause.message : String(cause)}`,
          ),
      })
    }

    if (result.issues !== undefined) {
      const text = result.issues.map(formatIssue).join(', ')
      return yield* Effect.fail(new InvalidInputError(`Invalid input: ${text}`, result.issues))
    }

    return result.value
  })
}

export async function validateInput<TInput = JsonValue>(
  schemaOrDef: SchemaCandidate<TInput>,
  raw: JsonValue,
): Promise<TInput> {
  return Effect.runPromise(validateInputEffect(schemaOrDef, raw))
}

export function validateInputSync<TInput = JsonValue>(
  schemaOrDef: SchemaCandidate<TInput>,
  raw: JsonValue,
): TInput {
  const schema = extractSchema(schemaOrDef)

  if (!schema) {
    // SAFETY: when no schema is provided, raw JsonValue is accepted as TInput.
    return raw as TInput
  }

  // SAFETY: StandardSchemaV1.validate returns Result<TInput> or Promise<Result<TInput>>.
  const result = schema['~standard'].validate(raw)

  if (result instanceof Promise) {
    throw new Error('Async schema validation is not supported in synchronous context')
  }

  if (result.issues !== undefined) {
    const text = result.issues.map(formatIssue).join(', ')
    throw new InvalidInputError(`Invalid input: ${text}`, result.issues)
  }

  // SAFETY: When result.issues is undefined, result is SuccessResult.
  return result.value
}
