import type { RunAttributes, RunLaunchSource, RunStatus, ThreadStatus } from '@looms/core'

export interface RunRow {
  runId: string
  status: RunStatus
  rootThreadId: string | null
  kind: string | null
  definitionName: string | null
  /** The effect in another run that launched this one. */
  launchedBy: RunLaunchSource | null
  attributes: RunAttributes
}

export interface ThreadRow {
  threadId: string
  runId: string
  kind: string
  definitionName: string
  parentThreadId: string | null
  status: ThreadStatus
}

/** Materialized run/thread rows. Event log lives only in `store.events()` / EventIndex. */
export interface MaterializedTables {
  runs: Map<string, RunRow>
  threads: Map<string, ThreadRow>
}

export function emptyTables(): MaterializedTables {
  return {
    runs: new Map(),
    threads: new Map(),
  }
}
