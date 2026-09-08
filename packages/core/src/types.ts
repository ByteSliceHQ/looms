/** JSON-compatible values used in event payloads and effect I/O. */
export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { readonly [key: string]: JsonValue }
export type JsonObject = { readonly [key: string]: JsonValue }

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
  return Object.prototype.toString.call(value) === '[object Object]'
}

export function isJsonString(value: unknown): value is string {
  return Object.prototype.toString.call(value) === '[object String]' && !(value instanceof String)
}

export function isJsonNumber(value: unknown): value is number {
  return (
    Object.prototype.toString.call(value) === '[object Number]' &&
    !(value instanceof Number) &&
    Number.isFinite(Number(value))
  )
}

export type ThreadStatus = 'running' | 'waiting' | 'completed' | 'failed' | 'cancelled'

export type RunStatus = 'running' | 'completed' | 'failed' | 'cancelled'
