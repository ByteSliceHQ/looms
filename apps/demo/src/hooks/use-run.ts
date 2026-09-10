import { useMemo } from 'react'

import { threadTree, toThreadTree } from '@looms/core'
import { useProjection, useRunStore } from '@looms/livestore/react'

import type { DemoEvents } from '../runtime'

export function useRun(runId: string) {
  const store = useRunStore(runId)
  const treeState = useProjection(store, threadTree)
  // SAFETY: demo host events are DemoEvents from the composed catalogs.
  const events = store.events() as DemoEvents[]
  const tables = store.getState()
  const run = tables.runs.get(runId)

  const tree = useMemo(() => toThreadTree(treeState), [treeState])

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const event of events) {
      const key = event.threadId ?? 'run'
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  }, [events])

  const rootThreadId =
    [...tables.threads.values()].find((row) => row.parentThreadId === null)?.threadId ??
    run?.rootThreadId ??
    undefined

  const startedAt = events.find((event) => event.type === 'runtime.run.started')?.ts

  return {
    store,
    events,
    tree,
    rootThreadId,
    counts,
    startedAt,
    definitionName: run?.definitionName ?? tree.root?.definitionName ?? undefined,
    kind: run?.kind ?? tree.root?.kind ?? undefined,
    status: run?.status ?? 'running',
  }
}
