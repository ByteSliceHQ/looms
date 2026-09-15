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

/**
 * Recursively remove keys with `undefined` values from an object,
 * matching wire JSON serialization behavior where undefined properties drop.
 */
export function cleanUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    // SAFETY: Mapping recursively over an array preserves array structure.
    return value.map(cleanUndefined) as T
  }

  if (value === null || !Predicate.isObject(value)) {
    return value
  }

  const result: { [key: string]: JsonValue } = {}

  for (const [k, v] of Object.entries(value)) {
    if (v !== undefined) {
      // SAFETY: cleanUndefined produces JSON-compatible values from JSON-like inputs.
      result[k] = cleanUndefined(v) as JsonValue
    }
  }

  // SAFETY: Rebuilding an object without undefined keys preserves its record shape.
  return result as T
}

/** Mark a JSON-serializable struct as a log payload, stripping undefined fields. */
export function asJson<T>(payload: T): JsonValue {
  // SAFETY: cleanUndefined ensures undefined keys drop as they would across the wire.
  return cleanUndefined(payload as JsonValue)
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
