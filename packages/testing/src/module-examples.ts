import { isDeepStrictEqual } from 'node:util'

import { Predicate, Schema } from 'effect'

import {
  cleanUndefined,
  createEvent,
  findCatalogEntry,
  moduleCatalogs,
  project,
  stringifyJson,
  validateInputSync,
  type AnyRuntimeModule,
  type CatalogEntry,
  type EventInput,
  type JsonValue,
  type SchemaInput,
} from '@looms/core'

function isSchemaInput(entry: CatalogEntry): entry is SchemaInput {
  return Schema.isSchema(entry) || (Predicate.isReadonlyObject(entry) && '~standard' in entry)
}

function payloadError(entry: CatalogEntry, event: EventInput): string | undefined {
  if (!isSchemaInput(entry)) {
    return undefined
  }

  try {
    validateInputSync(entry, cleanUndefined(event.payload))
    return undefined
  } catch (err) {
    return err instanceof Error ? err.message : String(err)
  }
}

function show(value: JsonValue): string {
  return stringifyJson(value)
}

/**
 * Fold each example trace and report events the catalog rejects or projections that do not match.
 * Returns an empty list when every example lands on its declared state.
 */
export function moduleExampleErrors(module: AnyRuntimeModule): readonly string[] {
  const errors: string[] = []
  const seen = new Set<string>()
  const catalogs = moduleCatalogs(module)

  for (const example of module.examples ?? []) {
    if (example.name.trim() === '') {
      errors.push('module example is missing a name')
    } else if (seen.has(example.name)) {
      errors.push(`duplicate example ${example.name}`)
    }

    seen.add(example.name)

    if (example.events.length === 0) {
      errors.push(`example ${example.name} has no events`)
    }

    const projectionKeys = Object.keys(example.projections)

    if (projectionKeys.length === 0) {
      errors.push(`example ${example.name} names no projections`)
    }

    let eventsOk = true

    for (const event of example.events) {
      const match = findCatalogEntry(catalogs, event.type)

      if (match === undefined) {
        eventsOk = false
        errors.push(`example ${example.name} event ${event.type} is outside the module catalogs`)
        continue
      }

      const message = payloadError(match.entry, event)

      if (message !== undefined) {
        eventsOk = false
        errors.push(`example ${example.name} event ${event.type}: ${message}`)
      }
    }

    if (!eventsOk) {
      continue
    }

    const envelopes = example.events.map((event: EventInput, index) =>
      createEvent(
        'example',
        {
          ...event,
          id: event.id ?? `example_${index + 1}`,
          ts: event.ts ?? index + 1,
        },
        { seq: index + 1 },
      ),
    )

    for (const key of projectionKeys) {
      const projection = module.projections?.[key]

      if (!projection) {
        errors.push(`example ${example.name} names unknown projection ${key}`)
        continue
      }

      const folded = cleanUndefined(project(projection, envelopes))
      const expected = example.projections[key] ?? null

      if (!isDeepStrictEqual(folded, expected)) {
        errors.push(
          `example ${example.name} projection ${key}: expected ${show(expected)}, got ${show(folded)}`,
        )
      }
    }
  }

  return errors
}
