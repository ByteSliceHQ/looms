import type { DebuggerEvent, EventStreamCatalog, EventSummary } from '../contracts'
import { searchText, summarizeEvent } from '../events/catalog'

export interface CachedEventMeta {
  summary: EventSummary
  searchText: string
  family: string
}

interface CacheEntry {
  catalog: object | undefined
  meta: CachedEventMeta
}

const metaCache = new WeakMap<object, CacheEntry>()

export function getEventMeta<TEvent extends DebuggerEvent>(
  event: TEvent,
  catalog?: EventStreamCatalog<TEvent>,
): CachedEventMeta {
  const existing = metaCache.get(event)

  if (existing && existing.catalog === catalog) {
    return existing.meta
  }

  const family = catalog ? catalog.familyOf(event.type) : 'runtime'
  const summary = catalog ? catalog.summarize(event) : summarizeEvent(event)

  const text = catalog?.searchText
    ? catalog.searchText(event)
    : searchText(event, catalog ? catalog.summarize : summarizeEvent)

  const meta: CachedEventMeta = { summary, searchText: text, family }

  metaCache.set(event, {
    catalog,
    meta,
  })

  return meta
}
