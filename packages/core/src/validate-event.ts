import type { StandardSchemaV1 } from '@standard-schema/spec'
import { Data, Effect, Predicate, Schema } from 'effect'

import type { CatalogEntries, CatalogEntry, EventCatalog } from './catalog'
import type { EventInput } from './envelope'
import { validateInputEffect } from './schema'
import { cleanUndefined } from './types'

export class InvalidEventError extends Data.TaggedError('InvalidEventError')<{
  readonly type: string
  readonly message: string
  readonly issues: ReadonlyArray<StandardSchemaV1.Issue>
}> {
  override readonly type: string
  override readonly issues: ReadonlyArray<StandardSchemaV1.Issue>

  constructor(type: string, text: string, issues: ReadonlyArray<StandardSchemaV1.Issue> = []) {
    super({ type, message: text, issues })
    this.name = 'InvalidEventError'
    this.type = type
    this.issues = issues
  }
}

function findCatalogAndEntry(
  catalogs: readonly EventCatalog[],
  type: string,
): { catalog: EventCatalog; key: string; entry: CatalogEntry } | undefined {
  for (const catalog of catalogs) {
    const prefix = `${catalog.namespace}.`

    if (type.startsWith(prefix)) {
      const key = type.slice(prefix.length)
      const entries: CatalogEntries = catalog.entries
      const entry: CatalogEntry | undefined = entries[key]

      if (entry !== undefined) {
        return { catalog, key, entry }
      }
    }
  }

  return undefined
}

function isStandardSchema(entry: CatalogEntry): entry is StandardSchemaV1 {
  return Predicate.isReadonlyObject(entry) && '~standard' in entry
}

function isEffectSchema(entry: CatalogEntry): entry is Schema.ConstraintDecoder<unknown> {
  return Schema.isSchema(entry)
}

export function validateEventInput(
  catalogs: readonly EventCatalog[],
  input: EventInput,
): Effect.Effect<EventInput, InvalidEventError> {
  const match = findCatalogAndEntry(catalogs, input.type)

  if (!match) {
    return Effect.succeed(input)
  }

  const cleanedPayload = cleanUndefined(input.payload)

  const validated = isEffectSchema(match.entry)
    ? validateInputEffect(match.entry, cleanedPayload)
    : isStandardSchema(match.entry)
      ? validateInputEffect(match.entry, cleanedPayload)
      : Effect.succeed(cleanedPayload)

  return validated.pipe(
    Effect.map((validatedPayload) => ({
      ...input,
      payload: cleanUndefined(validatedPayload),
    })),
    Effect.mapError(
      (err) =>
        new InvalidEventError(
          input.type,
          `Invalid payload for event "${input.type}": ${err.message}`,
          err.issues,
        ),
    ),
  )
}

export function validateEventsEffect(
  catalogs: readonly EventCatalog[],
  events: readonly EventInput[],
): Effect.Effect<EventInput[], InvalidEventError> {
  return Effect.forEach(events, (event) => validateEventInput(catalogs, event))
}
