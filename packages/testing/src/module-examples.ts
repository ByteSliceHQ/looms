import { isDeepStrictEqual } from 'node:util'

import {
  cleanUndefined,
  createEvent,
  findCatalogEntry,
  project,
  stringifyJson,
  validateEventInputSync,
  type AnyRuntimeModule,
  type EventCatalog,
  type EventInput,
  type ModuleExample,
} from '@looms/core'

function nameErrors(examples: readonly ModuleExample[]): string[] {
  return examples.flatMap(({ name }, index) => {
    if (name.trim() === '') {
      return ['module example is missing a name']
    }

    return examples.findIndex((other) => other.name === name) < index
      ? [`duplicate example ${name}`]
      : []
  })
}

function shapeErrors(example: ModuleExample): string[] {
  return [
    ...(example.events.length === 0 ? [`example ${example.name} has no events`] : []),
    ...(Object.keys(example.projections).length === 0
      ? [`example ${example.name} names no projections`]
      : []),
  ]
}

function eventError(
  catalogs: readonly EventCatalog[],
  example: ModuleExample,
  event: EventInput,
): string | undefined {
  if (!findCatalogEntry(catalogs, event.type)) {
    return `example ${example.name} event ${event.type} is outside the module catalogs`
  }

  try {
    validateEventInputSync(catalogs, event)
    return undefined
  } catch (err) {
    return `example ${example.name} event ${event.type}: ${err instanceof Error ? err.message : String(err)}`
  }
}

function projectionErrors(module: AnyRuntimeModule, example: ModuleExample): string[] {
  const envelopes = example.events.map((event, index) =>
    createEvent(
      'example',
      { ...event, id: event.id ?? `example_${index + 1}`, ts: event.ts ?? index + 1 },
      { seq: index + 1 },
    ),
  )

  return Object.entries(example.projections).flatMap(([key, expected]) => {
    const projection = module.projections?.[key]

    if (!projection) {
      return [`example ${example.name} names unknown projection ${key}`]
    }

    const folded = cleanUndefined(project(projection, envelopes))

    return isDeepStrictEqual(folded, expected)
      ? []
      : [
          `example ${example.name} projection ${key}: expected ${stringifyJson(expected)}, got ${stringifyJson(folded)}`,
        ]
  })
}

function exampleErrors(
  module: AnyRuntimeModule,
  catalogs: readonly EventCatalog[],
  example: ModuleExample,
): string[] {
  const events = example.events.flatMap((event) => eventError(catalogs, example, event) ?? [])

  return [
    ...shapeErrors(example),
    ...events,
    ...(events.length === 0 ? projectionErrors(module, example) : []),
  ]
}

/**
 * Fold each example trace with runtime projection semantics. Reports misnamed examples, events
 * outside `catalogs` or rejected by their schema, and projections that land on a different state.
 */
export function moduleExampleErrors(
  module: AnyRuntimeModule,
  catalogs: readonly EventCatalog[],
): readonly string[] {
  const examples = module.examples ?? []

  return [
    ...nameErrors(examples),
    ...examples.flatMap((example) => exampleErrors(module, catalogs, example)),
  ]
}
