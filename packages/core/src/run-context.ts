import { Data, Option, Schema, type Effect } from 'effect'

import type { JsonValue } from './types'

/**
 * Immutable labels for a run, such as tenant, project, or org.
 * They are safe for every reader of the run: events, snapshots, summaries, and authorization.
 */
export type RunAttributes = { readonly [key: string]: string }

/**
 * Bearer material for a run, such as an attenuated macaroon.
 * It is stored beside the log and is never written to an event, snapshot, or HTTP response.
 */
export type SecretContext = { readonly [key: string]: string }

/** One declared run attribute. A replica stores each declared attribute in its own column. */
export interface RunAttributeField {
  /** A start without this attribute is rejected. */
  readonly required?: boolean
  /** Index the replica column. */
  readonly index?: boolean
  /** Replica column name. Defaults to the key in snake_case. */
  readonly fieldName?: string
}

/** Declared run attributes, keyed by attribute name. */
export type RunAttributeFields = { readonly [name: string]: RunAttributeField }

type RequiredAttributeKeys<Fields extends RunAttributeFields> = {
  [Key in keyof Fields & string]: Fields[Key] extends { readonly required: true } ? Key : never
}[keyof Fields & string]

/**
 * The `attributes` a start accepts. Without a declaration this is any string map.
 * With one, only declared keys are allowed and `required` keys must be present.
 */
export type RunAttributesInput<Fields extends RunAttributeFields = RunAttributeFields> =
  string extends keyof Fields
    ? RunAttributes
    : { readonly [Key in RequiredAttributeKeys<Fields>]: string } & {
        readonly [Key in Exclude<keyof Fields & string, RequiredAttributeKeys<Fields>>]?: string
      }

export type HasRequiredAttributes<Fields extends RunAttributeFields> = [
  RequiredAttributeKeys<Fields>,
] extends [never]
  ? false
  : true

/** `{ attributes }` for a start: required when a declared attribute is. */
export type RunAttributesOption<Fields extends RunAttributeFields = RunAttributeFields> =
  HasRequiredAttributes<Fields> extends true
    ? { readonly attributes: RunAttributesInput<Fields> }
    : { readonly attributes?: RunAttributesInput<Fields> }

/** Declare run attributes once and pass the result to the runtime, the replica, and the client. */
export function defineRunAttributes<const Fields extends RunAttributeFields>(
  fields: Fields,
): Fields {
  return fields
}

export class InvalidRunAttributesError extends Data.TaggedError('InvalidRunAttributesError')<{
  readonly message: string
  readonly issues: readonly string[]
}> {
  constructor(issues: readonly string[]) {
    super({ message: `Invalid run attributes: ${issues.join('; ')}`, issues })
    this.name = 'InvalidRunAttributesError'
  }
}

/** Missing required and undeclared attributes, in declaration order then input order. */
export function runAttributeIssues(
  fields: RunAttributeFields,
  attributes: RunAttributes,
): readonly string[] {
  const missing = Object.entries(fields)
    .filter(([name, field]) => field.required === true && attributes[name] === undefined)
    .map(([name]) => `"${name}" is required`)

  const undeclared = Object.keys(attributes)
    .filter((name) => !Object.hasOwn(fields, name))
    .map((name) => `"${name}" is not a declared attribute`)

  return [...missing, ...undeclared]
}

export const RunAttributesSchema = Schema.Record(Schema.String, Schema.String)

export const SecretContextSchema = Schema.Record(Schema.String, Schema.String)

const decodeAttributes = Schema.decodeUnknownOption(RunAttributesSchema)
const decodeSecretContext = Schema.decodeUnknownOption(SecretContextSchema)

export interface RunSecretStore {
  readonly get: (runId: string) => Effect.Effect<SecretContext, Error>
  readonly put: (runId: string, secrets: SecretContext) => Effect.Effect<void, Error>
}

export function hasEntries(record: { readonly [key: string]: string }): boolean {
  return Object.keys(record).length > 0
}

export function sameStringRecord(
  left: { readonly [key: string]: string },
  right: { readonly [key: string]: string },
): boolean {
  const leftKeys = Object.keys(left).toSorted()
  const rightKeys = Object.keys(right).toSorted()

  if (leftKeys.length !== rightKeys.length) {
    return false
  }

  return leftKeys.every((key, index) => key === rightKeys[index] && left[key] === right[key])
}

/** Reads a string map from an event payload. Anything else becomes an empty map. */
export function readAttributes(value: JsonValue | undefined): RunAttributes {
  return value === undefined ? {} : Option.getOrElse(decodeAttributes(value), () => ({}))
}

export function readSecretContext(value: JsonValue): SecretContext {
  return Option.getOrElse(decodeSecretContext(value), () => ({}))
}
