import { isJsonObject, isJsonString, type EventEnvelope, type JsonValue } from '@looms/core'

import { emptyTables, type ThreadRow, type MaterializedTables, type RunRow } from './tables'

function payloadObject(event: EventEnvelope): { [key: string]: JsonValue } {
  return isJsonObject(event.payload) ? event.payload : {}
}

function readString(obj: { [key: string]: JsonValue }, key: string): string | undefined {
  const value = obj[key]
  return isJsonString(value) ? value : undefined
}

export function materializeEvents(
  events: readonly EventEnvelope[],
  from: MaterializedTables = emptyTables(),
): MaterializedTables {
  const tables: MaterializedTables = {
    runs: from.runs,
    threads: from.threads,
  }

  for (const event of events) {
    const payload = payloadObject(event)

    switch (event.type) {
      case 'runtime.run.started': {
        const existing = tables.runs.get(event.runId)
        const rootThreadId = readString(payload, 'rootThreadId') ?? existing?.rootThreadId ?? null

        const next: RunRow = {
          runId: event.runId,
          status: 'running',
          rootThreadId,
          kind: readString(payload, 'kind') ?? existing?.kind ?? null,
          definitionName: readString(payload, 'definitionName') ?? existing?.definitionName ?? null,
        }

        tables.runs.set(event.runId, next)
        break
      }

      case 'runtime.run.completed': {
        const existing = tables.runs.get(event.runId)

        tables.runs.set(event.runId, {
          runId: event.runId,
          status: readString(payload, 'error') ? 'failed' : 'completed',
          rootThreadId: existing?.rootThreadId ?? null,
          kind: existing?.kind ?? null,
          definitionName: existing?.definitionName ?? null,
        })

        break
      }

      case 'runtime.thread.started': {
        const threadId = readString(payload, 'threadId') ?? event.threadId
        const kind = readString(payload, 'kind')
        const definitionName = readString(payload, 'definitionName')

        if (!threadId || !kind || !definitionName) {
          break
        }

        const parent = payload.parentThreadId
        const parentThreadId = parent === null || isJsonString(parent) ? parent : null

        const row: ThreadRow = {
          threadId,
          runId: event.runId,
          kind,
          definitionName,
          parentThreadId,
          status: 'running',
        }

        tables.threads.set(threadId, row)
        break
      }

      case 'runtime.thread.completed':
      case 'runtime.thread.failed':

      case 'runtime.thread.cancelled': {
        const threadId = readString(payload, 'threadId') ?? event.threadId

        if (!threadId) {
          break
        }

        const existing = tables.threads.get(threadId)

        if (!existing) {
          break
        }

        const status =
          event.type === 'runtime.thread.completed'
            ? 'completed'
            : event.type === 'runtime.thread.failed'
              ? 'failed'
              : 'cancelled'

        tables.threads.set(threadId, { ...existing, status })
        break
      }

      default:
        break
    }
  }

  return tables
}
