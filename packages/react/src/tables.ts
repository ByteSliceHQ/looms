export interface RunRow {
  runId: string
  status: string
  rootThreadId: string | null
  kind: string | null
  definitionName: string | null
}

export interface ThreadRow {
  threadId: string
  runId: string
  kind: string
  definitionName: string
  parentThreadId: string | null
  status: string
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
