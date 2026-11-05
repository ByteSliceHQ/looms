import { isDeepStrictEqual } from 'node:util'

import { Predicate, Schema } from 'effect'

import type { CatalogEntry, EventCatalog } from './catalog'
import { createEvent, type EventInput } from './envelope'
import type { AnyRuntimeModule } from './module'
import { foldProjection } from './projection'
import { protocolCatalog } from './protocol'
import { validateInputSync, type SchemaInput } from './schema'
import { cleanUndefined, stringifyJson, type JsonValue } from './types'

function catalogsOf(module: AnyRuntimeModule): readonly EventCatalog[] {
  return [protocolCatalog, ...(module.events ? [module.events] : []), ...(module.observes ?? [])]
}

function isSchemaInput(entry: CatalogEntry): entry is SchemaInput {
  return Schema.isSchema(entry) || (Predicate.isReadonlyObject(entry) && '~standard' in entry)
}

function catalogEntry(catalogs: readonly EventCatalog[], type: string): CatalogEntry | undefined {
  for (const catalog of catalogs) {
    const prefix = `${catalog.namespace}.`

    if (!type.startsWith(prefix)) {
      continue
    }

    const entry = catalog.entries[type.slice(prefix.length)]

    if (entry !== undefined) {
      return entry
    }
  }

  return undefined
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
  const catalogs = catalogsOf(module)

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

    const projectionNames = Object.keys(example.projections)

    if (projectionNames.length === 0) {
      errors.push(`example ${example.name} names no projections`)
    }

    let eventsOk = true

    for (const event of example.events) {
      const entry = catalogEntry(catalogs, event.type)

      if (entry === undefined) {
        eventsOk = false
        errors.push(`example ${example.name} event ${event.type} is outside the module catalogs`)
        continue
      }

      const message = payloadError(entry, event)

      if (message !== undefined) {
        eventsOk = false
        errors.push(`example ${example.name} event ${event.type}: ${message}`)
      }
    }

    if (!eventsOk) {
      continue
    }

    for (const name of projectionNames) {
      const projection = Object.values(module.projections ?? {}).find((item) => item.name === name)

      if (!projection) {
        errors.push(`example ${example.name} names unknown projection ${name}`)
        continue
      }

      const folded = foldProjection(
        projection,
        example.events.map((event: EventInput, index) =>
          createEvent('example', event, { seq: index + 1 }),
        ),
      )

      const expected = example.projections[name]

      if (expected === undefined) {
        errors.push(`example ${example.name} projection ${name} has no expected state`)
        continue
      }

      if (!isDeepStrictEqual(folded, expected)) {
        errors.push(
          `example ${example.name} projection ${name}: expected ${show(expected)}, got ${show(cleanUndefined(folded))}`,
        )
      }
    }
  }

  return errors
}
