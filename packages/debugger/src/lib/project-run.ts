import {
  EventIndex,
  project,
  threadTree,
  toThreadTree,
  type EventEnvelope,
  type ThreadTree,
} from '@looms/core'

import { runStatusFromEvents } from './event-counts'

export type ProjectedRunView = {
  runId: string
  tree: ThreadTree
  eventCounts: Map<string, number>
  runStatus: string
  startedAt?: number
}

export function projectRunView(events: readonly EventEnvelope[]): ProjectedRunView {
  const index = new EventIndex()
  index.append(events)
  const tree = toThreadTree(project(threadTree, events))

  return {
    runId: events[0]?.runId ?? tree.runId,
    tree,
    eventCounts: new Map(index.getCounts()),
    runStatus: runStatusFromEvents(events),
    startedAt: index.getStartedAt(),
  }
}
