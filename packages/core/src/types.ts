import { Predicate, Schema } from 'effect'

/** JSON-compatible values used in event payloads and effect I/O. */
export type JsonPrimitive = string | number | boolean | null
export type JsonArray = JsonValue[] | readonly JsonValue[]
export type JsonObject = { readonly [key: string]: JsonValue }
export type JsonValue = JsonPrimitive | JsonArray | JsonObject

/** Structs that JSON-serialize to event payloads. */
export interface JsonPayload {
  readonly [key: string]: JsonValue | JsonPayload | readonly (JsonValue | JsonPayload)[] | undefined
}

const encodeUnknownJson = Schema.encodeSync(Schema.fromJsonString(Schema.Unknown))

const encodeUnknownJsonPretty = Schema.encodeSync(
  Schema.fromJsonString(Schema.Unknown, { space: 2 }),
)

export const stringifyJson = encodeUnknownJson
export const stringifyJsonPretty = encodeUnknownJsonPretty

// This recursive serializer is the parser for unknown JSON-like boundary values.
// oxlint-disable-next-line anti-slop/no-unknown-parameters
function cleanJsonValue(value: unknown): JsonValue | undefined {
  if (value === null || Predicate.isString(value) || Predicate.isBoolean(value)) {
    return value
  }

  if (Predicate.isNumber(value)) {
    return Number.isFinite(value) ? value : null
  }

  if (Array.isArray(value)) {
    return value.map((item) => cleanJsonValue(item) ?? null)
  }

  if (!Predicate.isReadonlyObject(value)) {
    return undefined
  }

  const result: Record<string, JsonValue> = {}

  for (const [key, nested] of Object.entries(value)) {
    const cleaned = cleanJsonValue(nested)

    if (cleaned !== undefined) {
      result[key] = cleaned
    }
  }

  return result
}

/** Convert a value to its JSON wire representation, dropping undefined object properties. */
// Public JSON normalization intentionally accepts unknown input and returns the parsed domain type.
// oxlint-disable-next-line anti-slop/no-unknown-parameters
export function cleanUndefined(value: unknown): JsonValue {
  return cleanJsonValue(value) ?? null
}

/** Mark a JSON-serializable struct as a log payload, stripping undefined fields. */
export const asJson = cleanUndefined

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
