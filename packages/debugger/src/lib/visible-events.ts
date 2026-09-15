import { useDeferredValue, useMemo } from 'react'

import type { DebuggerEvent, EventStreamCatalog } from '../contracts'
import { getEventMeta } from './event-meta'

export function useVisibleEvents<TEvent extends DebuggerEvent>({
  events,
  query,
  families,
  threadId,
  catalog,
}: {
  events: readonly TEvent[]
  query: string
  families: ReadonlySet<string>
  threadId?: string
  catalog: EventStreamCatalog<TEvent>
}): readonly TEvent[] {
  const deferredQuery = useDeferredValue(query)
  const q = deferredQuery.trim().toLowerCase()

  return useMemo(() => {
    return events.filter((event) => {
      if (threadId && event.threadId !== threadId) {
        return false
      }

      const meta = getEventMeta(event, catalog)

      if (!families.has(meta.family)) {
        return false
      }

      if (q && !meta.searchText.includes(q)) {
        return false
      }

      return true
    })
  }, [events, q, families, threadId, catalog])
}
