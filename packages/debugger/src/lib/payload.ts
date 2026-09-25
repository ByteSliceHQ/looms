import { isJsonNumber, isJsonObject, isJsonString, type JsonValue } from '@looms/core'

/** Fields of a JSON object, or no fields for any other value. */
export function jsonFields(value: JsonValue | null | undefined): { [key: string]: JsonValue } {
  return isJsonObject(value) ? value : {}
}

export function jsonText(value: JsonValue | undefined): string | undefined {
  return isJsonString(value) ? value : undefined
}

export function jsonNumberText(value: JsonValue | undefined): string | undefined {
  return isJsonNumber(value) ? String(value) : undefined
}
