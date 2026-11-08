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
  readonly type: 'string' | 'number' | 'boolean' | 'select'
  readonly defaultValue: string
  readonly required: boolean
  readonly options?: readonly string[]
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

/** Effect `Schema.optional` often publishes `anyOf: [{ type: T }, { type: "null" }]`. */
function scalarTypeOfProperty(property: {
  readonly [key: string]: JsonValue
}): FormField['type'] | undefined {
  if (isJsonString(property.type)) {
    return fieldType(property.type)
  }

  if (Array.isArray(property.type)) {
    const scalars = property.type.filter((entry) => entry !== 'null')

    if (scalars.length === 1) {
      return fieldType(scalars[0]!)
    }

    return undefined
  }

  for (const key of ['anyOf', 'oneOf'] as const) {
    const variants = property[key]

    if (!Array.isArray(variants)) {
      continue
    }

    const nonNull = variants.filter((variant) => isJsonObject(variant) && variant.type !== 'null')

    if (nonNull.length !== 1 || !isJsonObject(nonNull[0])) {
      return undefined
    }

    return scalarTypeOfProperty(nonNull[0])
  }

  return undefined
}

function stringEnumOptions(property: {
  readonly [key: string]: JsonValue
}): readonly string[] | undefined {
  if (isJsonString(property.const)) {
    return [property.const]
  }

  if (!Array.isArray(property.enum)) {
    return undefined
  }

  const options: string[] = []

  for (const value of property.enum) {
    if (!isJsonString(value)) {
      return undefined
    }

    options.push(value)
  }

  return options.length > 0 ? options : undefined
}

function requiredPropertyNames(schema: { readonly [key: string]: JsonValue }): ReadonlySet<string> {
  if (!Array.isArray(schema.required)) {
    return new Set()
  }

  const names: string[] = []

  for (const name of schema.required) {
    if (isJsonString(name)) {
      names.push(name)
    }
  }

  return new Set(names)
}

function selectDefaultValue(options: readonly string[], fallback: JsonValue | undefined): string {
  if (isJsonString(fallback) && options.includes(fallback)) {
    return fallback
  }

  return options[0] ?? ''
}

/** Flat object fields, or undefined when the schema needs the raw JSON editor. */
export function formFields(schema: JsonValue | undefined): readonly FormField[] | undefined {
  if (!isJsonObject(schema) || schema.type !== 'object' || !isJsonObject(schema.properties)) {
    return undefined
  }

  const fields: FormField[] = []
  const required = requiredPropertyNames(schema)

  for (const [name, property] of Object.entries(schema.properties)) {
    if (!isJsonObject(property)) {
      return undefined
    }

    const enumOptions = stringEnumOptions(property)

    if (enumOptions) {
      fields.push({
        name,
        label: isJsonString(property.title) ? property.title : name,
        type: 'select',
        defaultValue: selectDefaultValue(enumOptions, property.default),
        required: required.has(name),
        options: enumOptions,
      })

      continue
    }

    const type = scalarTypeOfProperty(property)

    if (!type) {
      return undefined
    }

    const fallback = property.default

    let defaultValue = ''

    if (isJsonString(fallback) || isJsonNumber(fallback) || Predicate.isBoolean(fallback)) {
      defaultValue = String(fallback)
    } else if (type === 'boolean') {
      // Checkboxes are two-state; start unchecked so the control matches emitted `false`.
      defaultValue = 'false'
    }

    fields.push({
      name,
      label: isJsonString(property.title) ? property.title : name,
      type,
      defaultValue,
      required: required.has(name),
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

    // Checkboxes always emit a boolean so the control matches preview/send input.
    if (field.type === 'boolean') {
      input[field.name] = raw === 'true'
      continue
    }

    // Optional empty strings/numbers are omitted; required empties fail below.
    if (!field.required && raw === '') {
      continue
    }

    if (field.required && raw.trim() === '') {
      throw new Error(`${field.label} is required`)
    }

    if (field.type === 'number') {
      const parsed = Number(raw)

      if (!Number.isFinite(parsed)) {
        throw new Error(`${field.label} must be a number`)
      }

      input[field.name] = parsed
      continue
    }

    input[field.name] = raw
  }

  return input
}

export function parseFormInput(
  form: InputForm,
  values: FormValues,
):
  | { readonly ok: true; readonly value: JsonValue }
  | { readonly ok: false; readonly error: string } {
  try {
    return { ok: true, value: formInput(form, values) }
  } catch (cause: unknown) {
    const message = cause instanceof Error ? cause.message : String(cause)
    return { ok: false, error: message }
  }
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
