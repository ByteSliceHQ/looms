import type { StandardSchemaV1 } from '@standard-schema/spec'
import { Data, Effect, Predicate, Schema } from 'effect'

import type { CatalogEntries, CatalogEntry, EventCatalog } from './catalog'
import type { EventInput } from './envelope'
import {
  InvalidInputError,
  validateInputEffect,
  validateInputSync,
  type SchemaInput,
} from './schema'
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

/** Locate a catalog entry for a fully-qualified event type across the given catalogs. */
export function findCatalogEntry(
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

/** The runtime schema behind a catalog entry. `payload<T>()` entries have none. */
function schemaOf(entry: CatalogEntry): SchemaInput | undefined {
  return isEffectSchema(entry) || isStandardSchema(entry) ? entry : undefined
}

function invalidEvent(type: string, err: InvalidInputError): InvalidEventError {
  return new InvalidEventError(
    type,
    `Invalid payload for event "${type}": ${err.message}`,
    err.issues,
  )
}

export function validateEventInput(
  catalogs: readonly EventCatalog[],
  input: EventInput,
): Effect.Effect<EventInput, InvalidEventError> {
  const match = findCatalogEntry(catalogs, input.type)

  if (!match) {
    return Effect.succeed(input)
  }

  return validateInputEffect(schemaOf(match.entry), cleanUndefined(input.payload)).pipe(
    Effect.map((validatedPayload) => ({
      ...input,
      payload: cleanUndefined(validatedPayload),
    })),
    Effect.mapError((err) => invalidEvent(input.type, err)),
  )
}

/**
 * Synchronous `validateEventInput`. Throws `InvalidEventError` for a rejected payload, and
 * throws when a catalog schema validates asynchronously.
 */
export function validateEventInputSync(
  catalogs: readonly EventCatalog[],
  input: EventInput,
): EventInput {
  const match = findCatalogEntry(catalogs, input.type)

  if (!match) {
    return input
  }

  const schema = schemaOf(match.entry)
  const payload = cleanUndefined(input.payload)

  if (!schema) {
    return { ...input, payload }
  }

  try {
    return { ...input, payload: cleanUndefined(validateInputSync(schema, payload)) }
  } catch (err) {
    throw err instanceof InvalidInputError ? invalidEvent(input.type, err) : err
  }
}

export function validateEventsEffect(
  catalogs: readonly EventCatalog[],
  events: readonly EventInput[],
): Effect.Effect<EventInput[], InvalidEventError> {
  return Effect.forEach(events, (event) => validateEventInput(catalogs, event))
}
