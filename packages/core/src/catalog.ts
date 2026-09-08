import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { Schema } from 'effect'
import { createEvent, type EventEnvelope, type EventInput, type TypedEvent } from './envelope'
import { asJson, type JsonValue } from './types'

declare const catalogPayloadBrand: unique symbol

/** Type-only catalog entry. Carries a payload type without a runtime schema. */
export type CatalogEventSpec<TPayload = object> = {
  readonly [catalogPayloadBrand]?: TPayload
}

/**
 * Declare a catalog event's payload type when you do not have a Zod / Standard Schema.
 *
 * `payload<{ amount: number }>()` is a compile-time marker — not a cast of `{}`.
 */
export function payload<TPayload>(): CatalogEventSpec<TPayload> {
  return {}
}

export type CatalogEntry = CatalogEventSpec | Schema.Top | StandardSchemaV1

export type CatalogEntries = { readonly [key: string]: CatalogEntry }

export type InferPayload<T> = T extends CatalogEventSpec<infer P>
  ? P
  : T extends Schema.Top
    ? Schema.Schema.Type<T>
    : T extends StandardSchemaV1<infer _In, infer Out>
      ? Out
      : T

type CatalogPayload<T> = InferPayload<T> extends JsonValue ? InferPayload<T> : JsonValue

export interface EventCatalog<
  TNamespace extends string = string,
  TEntries extends CatalogEntries = CatalogEntries,
> {
  readonly namespace: TNamespace
  readonly entries: TEntries
  event<K extends keyof TEntries & string>(
    key: K,
    payload: InferPayload<TEntries[K]>,
    meta: Omit<EventInput, 'type' | 'payload'> & { runId: string },
  ): EventEnvelope<`${TNamespace}.${K}`>
}

export type CatalogEvent<TNamespace extends string, TEntries extends CatalogEntries> = {
  [K in keyof TEntries & string]: TypedEvent<`${TNamespace}.${K}`, CatalogPayload<TEntries[K]>>
}[keyof TEntries & string]

export type EventsOfCatalog<T> = T extends EventCatalog<infer N, infer E> ? CatalogEvent<N, E> : never

export function eventType<TNamespace extends string, K extends string>(
  namespace: TNamespace,
  key: K,
): `${TNamespace}.${K}` {
  return `${namespace}.${key}`
}

export function defineEventCatalog<TNamespace extends string, TEntries extends CatalogEntries>(
  namespace: TNamespace,
  entries: TEntries,
): EventCatalog<TNamespace, TEntries> {
  return {
    namespace,
    entries,
    event(key, payload, meta) {
      const { runId, ...rest } = meta
      return createEvent(runId, {
        ...rest,
        type: eventType(namespace, key),
        payload: asJson(payload),
      })
    },
  }
}

export function isCatalogEvent<TNamespace extends string>(
  event: EventEnvelope,
  catalog: EventCatalog<TNamespace, CatalogEntries>,
): event is EventEnvelope<`${TNamespace}.${string}`> {
  return event.type.startsWith(`${catalog.namespace}.`)
}
