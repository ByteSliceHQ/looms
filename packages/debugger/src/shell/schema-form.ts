import { Predicate } from 'effect'

import { isJsonNumber, isJsonObject, isJsonString, type JsonValue } from '@looms/core'

export interface FormField {
  readonly name: string
  readonly label: string
  readonly type: 'string' | 'number' | 'boolean'
  readonly defaultValue: string
}

function fieldType(value: JsonValue): FormField['type'] | undefined {
  if (value === 'string') {
    return 'string'
  }

  if (value === 'number' || value === 'integer') {
    return 'number'
  }

  if (value === 'boolean') {
    return 'boolean'
  }

  return undefined
}

/** Flat object fields, or undefined when the schema needs the raw JSON editor. */
export function formFields(schema: JsonValue | undefined): readonly FormField[] | undefined {
  if (!isJsonObject(schema) || schema.type !== 'object' || !isJsonObject(schema.properties)) {
    return undefined
  }

  const fields: FormField[] = []

  for (const [name, property] of Object.entries(schema.properties)) {
    if (!isJsonObject(property) || !isJsonString(property.type)) {
      return undefined
    }

    const type = fieldType(property.type)

    if (!type) {
      return undefined
    }

    const fallback = property.default

    const defaultValue =
      isJsonString(fallback) || isJsonNumber(fallback) || Predicate.isBoolean(fallback)
        ? String(fallback)
        : ''

    fields.push({
      name,
      label: isJsonString(property.title) ? property.title : name,
      type,
      defaultValue,
    })
  }

  return fields
}

export function valuesToInput(
  fields: readonly FormField[],
  values: Readonly<Record<string, string>>,
): JsonValue {
  const input: Record<string, JsonValue> = {}

  for (const field of fields) {
    const raw = values[field.name] ?? field.defaultValue

    if (field.type === 'number') {
      const parsed = Number(raw)
      input[field.name] = Number.isFinite(parsed) ? parsed : 0
      continue
    }

    if (field.type === 'boolean') {
      input[field.name] = raw === 'true'
      continue
    }

    input[field.name] = raw
  }

  return input
}
