import type { StandardSchemaV1 } from '@standard-schema/spec'
import { Data, Effect } from 'effect'

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

export function validateEventInput(
  catalogs: readonly EventCatalog[],
  input: EventInput,
): Effect.Effect<EventInput, InvalidEventError> {
  const match = findCatalogAndEntry(catalogs, input.type)

  if (!match) {
    return Effect.succeed(input)
  }

  const cleanedPayload = cleanUndefined(input.payload)

  // SAFETY: match.entry is a catalog entry (Schema, StandardSchema, or payload marker).
  return validateInputEffect(match.entry as never, cleanedPayload).pipe(
    Effect.map((validatedPayload) => ({
      ...input,
      payload: validatedPayload,
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
