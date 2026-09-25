import { isJsonObject, type JsonValue } from '@looms/core'

/** Map a chat message onto an agent's input schema. */
export function chatInput(schema: JsonValue | undefined, text: string): JsonValue {
  if (!isJsonObject(schema) || schema.type === 'string') {
    return text
  }

  if (schema.type === 'object' && isJsonObject(schema.properties)) {
    if (Object.hasOwn(schema.properties, 'text')) {
      return { text }
    }

    if (Object.hasOwn(schema.properties, 'message')) {
      return { message: text }
    }
  }

  return text
}
