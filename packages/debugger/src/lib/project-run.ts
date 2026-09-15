import { project, threadTree, toThreadTree, type EventEnvelope, type ThreadTree } from '@looms/core'

import { countEventsByThread, runStatusFromEvents, startedAtFromEvents } from './event-counts'

export type ProjectedRunView = {
  runId: string
  tree: ThreadTree
  eventCounts: Map<string, number>
  runStatus: string
  startedAt?: number
}

export function projectRunView(events: readonly EventEnvelope[]): ProjectedRunView {
  const tree = toThreadTree(project(threadTree, events))
  return {
    runId: events[0]?.runId ?? tree.runId,
    tree,
    eventCounts: countEventsByThread(events),
    runStatus: runStatusFromEvents(events),
    startedAt: startedAtFromEvents(events),
  }
}
