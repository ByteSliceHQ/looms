import { Predicate } from 'effect'

/** JSON-compatible values used in event payloads and effect I/O. */
export type JsonPrimitive = string | number | boolean | null
export type JsonArray = JsonValue[] | readonly JsonValue[]
export type JsonObject = { readonly [key: string]: JsonValue }
export type JsonValue = JsonPrimitive | JsonArray | JsonObject

/** Structs that JSON-serialize to event payloads. */
export interface JsonPayload {
  readonly [key: string]: JsonValue | JsonPayload | readonly (JsonValue | JsonPayload)[] | undefined
}

/** Mark a JSON-serializable struct as a log payload. */
export function asJson<T>(payload: T): JsonValue {
  // SAFETY: callers pass JSON-serializable structs; undefined keys drop on the wire.
  return payload as JsonValue
}

/** Recover a typed struct previously written as JSON. */
export function fromJsonStruct<T>(value: JsonValue): T {
  // SAFETY: value is a JSON struct previously produced as T.
  return value as T
}

export function isJsonObject(value: unknown): value is { [key: string]: JsonValue } {
  return Predicate.isObject(value) && !Array.isArray(value)
}

export function isJsonString(value: unknown): value is string {
  return Predicate.isString(value)
}

export function isJsonNumber(value: unknown): value is number {
  return Predicate.isNumber(value) && Number.isFinite(value)
}

export type ThreadStatus = 'running' | 'waiting' | 'completed' | 'failed' | 'cancelled'

export type RunStatus = 'running' | 'completed' | 'failed' | 'cancelled'
