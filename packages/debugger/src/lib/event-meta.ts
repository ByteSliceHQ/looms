import type { DebuggerEvent, EventStreamCatalog, EventSummary } from '../contracts'

export interface CachedEventMeta {
  summary: EventSummary
  searchText: string
  family: string
}

interface CacheEntry {
  catalog: object
  meta: CachedEventMeta
}

const metaCache = new WeakMap<object, CacheEntry>()

export function getEventMeta<TEvent extends DebuggerEvent>(
  event: TEvent,
  catalog: EventStreamCatalog<TEvent>,
): CachedEventMeta {
  const existing = metaCache.get(event)

  if (existing && existing.catalog === catalog) {
    return existing.meta
  }

  const meta: CachedEventMeta = {
    summary: catalog.summarize(event),
    searchText: catalog.searchText(event),
    family: catalog.familyOf(event.type),
  }

  metaCache.set(event, { catalog, meta })
  return meta
}
