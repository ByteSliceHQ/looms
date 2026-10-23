import { Option, Schema, type Effect } from 'effect'

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
