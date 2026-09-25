import { Predicate } from 'effect'

import {
  cleanUndefined,
  isJsonNumber,
  isJsonObject,
  isJsonString,
  type JsonValue,
} from '@looms/core'

export interface FormField {
  readonly name: string
  readonly label: string
  readonly type: 'string' | 'number' | 'boolean'
  readonly defaultValue: string
}

/** How a definition's input is edited: one text box, flat scalar fields, or raw JSON. */
export type InputForm =
  | { readonly kind: 'text' }
  | { readonly kind: 'fields'; readonly fields: readonly FormField[] }
  | { readonly kind: 'json' }

export interface FormValues {
  /** Field values by name, for the `fields` form. */
  readonly fields: Readonly<Record<string, string>>
  /** Text for the `text` form, or JSON source for the `json` form. */
  readonly source: string
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

export function inputForm(schema: JsonValue | undefined): InputForm {
  if (isJsonObject(schema) && schema.type === 'string') {
    return { kind: 'text' }
  }

  const fields = formFields(schema)
  return fields ? { kind: 'fields', fields } : { kind: 'json' }
}

export function initialValues(form: InputForm): FormValues {
  switch (form.kind) {
    case 'text':
      return { fields: {}, source: '' }
    case 'fields':
      return {
        fields: Object.fromEntries(form.fields.map((field) => [field.name, field.defaultValue])),
        source: '',
      }
    case 'json':
      return { fields: {}, source: '{}' }

    default: {
      const exhaustive: never = form
      return exhaustive
    }
  }
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

/** Input for the form's current values. Throws when the JSON source does not parse. */
export function formInput(form: InputForm, values: FormValues): JsonValue {
  switch (form.kind) {
    case 'text':
      return values.source
    case 'fields':
      return valuesToInput(form.fields, values.fields)
    case 'json':
      return cleanUndefined(JSON.parse(values.source))

    default: {
      const exhaustive: never = form
      return exhaustive
    }
  }
}

/** Input carrying a single chat message, when the form has exactly one string to put it in. */
export function messageInput(form: InputForm, message: string): JsonValue | undefined {
  switch (form.kind) {
    case 'text':
      return message

    case 'fields': {
      const strings = form.fields.filter((field) => field.type === 'string')
      const [only] = strings

      return strings.length === 1 && only
        ? valuesToInput(form.fields, { [only.name]: message })
        : undefined
    }

    case 'json':
      return undefined

    default: {
      const exhaustive: never = form
      return exhaustive
    }
  }
}
