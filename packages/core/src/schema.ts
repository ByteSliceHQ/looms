import type { StandardSchemaV1 } from '@standard-schema/spec'
import { Predicate, Schema } from 'effect'
import type { JsonValue } from './types'

export class InvalidInputError extends Error {
  readonly _tag = 'InvalidInputError'
  readonly issues: ReadonlyArray<StandardSchemaV1.Issue>
  constructor(text: string, issues: ReadonlyArray<StandardSchemaV1.Issue> = []) {
    super(text)
    this.name = 'InvalidInputError'
    this.issues = issues
  }
}

type SchemaCandidate<TInput> =
  | StandardSchemaV1<JsonValue, TInput>
  | StandardSchemaV1<unknown, TInput>
  | Schema.Schema<TInput>
  | {
      input?:
        | StandardSchemaV1<JsonValue, TInput>
        | StandardSchemaV1<unknown, TInput>
        | Schema.Schema<TInput>
    }
  | null
  | undefined

function toStandard<TInput>(candidate: SchemaCandidate<TInput>): StandardSchemaV1<JsonValue, TInput> | undefined {
  if (!candidate) {
    return undefined
  }
  if (Schema.isSchema(candidate)) {
    // SAFETY: Effect Schema converts to StandardSchemaV1 via official helper.
    return Schema.toStandardSchemaV1(candidate as Schema.Codec<TInput, TInput, never, never>) as StandardSchemaV1<
      JsonValue,
      TInput
    >
  }
  if (Predicate.isObject(candidate) && '~standard' in candidate) {
    // SAFETY: verified '~standard' property exists on object.
    return candidate as StandardSchemaV1<JsonValue, TInput>
  }
  return undefined
}

function extractSchema<TInput>(schemaOrDef: SchemaCandidate<TInput>): StandardSchemaV1<JsonValue, TInput> | undefined {
  const direct = toStandard<TInput>(schemaOrDef)
  if (direct) return direct
  if (schemaOrDef && Predicate.isObject(schemaOrDef) && 'input' in schemaOrDef) {
    // SAFETY: Verified schemaOrDef has 'input' property.
    return toStandard<TInput>((schemaOrDef as { input?: SchemaCandidate<TInput> }).input)
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

export async function validateInput<TInput = JsonValue>(
  schemaOrDef:
    | StandardSchemaV1<JsonValue, TInput>
    | StandardSchemaV1<unknown, TInput>
    | Schema.Schema<TInput>
    | { input?: StandardSchemaV1<JsonValue, TInput> | StandardSchemaV1<unknown, TInput> | Schema.Schema<TInput> }
    | undefined,
  raw: JsonValue,
): Promise<TInput> {
  const schema = extractSchema(schemaOrDef)
  if (!schema) {
    // SAFETY: when no schema is provided, raw JsonValue is accepted as TInput.
    return raw as TInput
  }
  // SAFETY: StandardSchemaV1.validate returns Result<TInput> or Promise<Result<TInput>>.
  let result = schema['~standard'].validate(raw) as
    | StandardSchemaV1.Result<TInput>
    | Promise<StandardSchemaV1.Result<TInput>>
  if (result instanceof Promise) {
    result = await result
  }
  if (result.issues !== undefined) {
    const text = result.issues.map(formatIssue).join(', ')
    throw new InvalidInputError(`Invalid input: ${text}`, result.issues)
  }
  // SAFETY: When result.issues is undefined, result is SuccessResult.
  return (result as StandardSchemaV1.SuccessResult<TInput>).value
}

export function validateInputSync<TInput = JsonValue>(
  schemaOrDef:
    | StandardSchemaV1<JsonValue, TInput>
    | StandardSchemaV1<unknown, TInput>
    | Schema.Schema<TInput>
    | { input?: StandardSchemaV1<JsonValue, TInput> | StandardSchemaV1<unknown, TInput> | Schema.Schema<TInput> }
    | undefined,
  raw: JsonValue,
): TInput {
  const schema = extractSchema(schemaOrDef)
  if (!schema) {
    // SAFETY: when no schema is provided, raw JsonValue is accepted as TInput.
    return raw as TInput
  }
  // SAFETY: StandardSchemaV1.validate returns Result<TInput> or Promise<Result<TInput>>.
  const result = schema['~standard'].validate(raw) as
    | StandardSchemaV1.Result<TInput>
    | Promise<StandardSchemaV1.Result<TInput>>
  if (result instanceof Promise) {
    throw new Error('Async schema validation is not supported in synchronous context')
  }
  if (result.issues !== undefined) {
    const text = result.issues.map(formatIssue).join(', ')
    throw new InvalidInputError(`Invalid input: ${text}`, result.issues)
  }
  // SAFETY: When result.issues is undefined, result is SuccessResult.
  return (result as StandardSchemaV1.SuccessResult<TInput>).value
}
