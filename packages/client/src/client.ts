import type { DefinitionInput, DefinitionRef, EventEnvelope, EventInput, JsonValue, RunState } from '@looms/core'
import { consumeSseStream, delay, eventsFromSseData } from './sse'

export interface LoomsClientOptions {
  baseUrl?: string
  fetch?: typeof fetch
}

export interface StartResult {
  runId: string
  threadId: string
  state: RunState
}

export function createLoomsClient(options: LoomsClientOptions = {}) {
  const baseUrl = (options.baseUrl ?? '').replace(/\/$/, '')
  const fetchImpl = options.fetch ?? fetch

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers)
    if (!headers.has('content-type')) headers.set('content-type', 'application/json')
    const res = await fetchImpl(`${baseUrl}${path}`, { ...init, headers })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(body || `HTTP ${res.status}`)
    }
    // SAFETY: host JSON responses match the generic requested by each route helper.
    return (await res.json()) as T
  }

  return {
    /** Start a run by `{ kind, definitionName }` when you only have names. */
    startRun: (args: { kind: string; definitionName: string; input?: JsonValue; runId?: string }) =>
      request<StartResult>('/runs', { method: 'POST', body: JSON.stringify(args) }),
    /** Start a run from a definition object (agent, workflow, or your own kind). */
    start: <TDef extends DefinitionRef>(definition: TDef, input?: DefinitionInput<TDef>) =>
      request<StartResult>('/runs', {
        method: 'POST',
        body: JSON.stringify({ kind: definition.kind, definitionName: definition.name, input }),
      }),
    getRun: (runId: string) => request<{ runId: string; state: RunState }>(`/runs/${runId}`),
    getState: (runId: string) => request<{ runId: string; state: RunState }>(`/runs/${runId}`),
    getEvents: (runId: string, opts?: { fromSeq?: number; limit?: number }) => {
      const params = new URLSearchParams()
      if (opts?.fromSeq !== undefined) params.set('fromSeq', String(opts.fromSeq))
      if (opts?.limit !== undefined) params.set('limit', String(opts.limit))
      const q = params.toString()
      return request<{ runId: string; events: EventEnvelope[] }>(`/runs/${runId}/events${q ? `?${q}` : ''}`)
    },
    signal: (runId: string, events: ReadonlyArray<EventInput>) =>
      request<{ runId: string; state: RunState }>(`/runs/${runId}/events`, {
        method: 'POST',
        body: JSON.stringify({ events }),
      }),
    wake: (runId: string) =>
      request<{ runId: string; state: RunState }>(`/runs/${runId}/wake`, { method: 'POST' }),
    replayTo: (runId: string, seq: number) =>
      request<{ runId: string; step: unknown }>(`/runs/${runId}/replay?seq=${seq}`),
    project: (runId: string, name: string) =>
      request<{ runId: string; name: string; value: unknown }>(`/runs/${runId}/projections/${name}`),
    subscribeEvents: (runId: string, onEvent: (event: EventEnvelope) => void, reconnectDelayMs = 1_000) => {
      let fromSeq = 1
      const controller = new AbortController()

      const run = async () => {
        while (!controller.signal.aborted) {
          try {
            const cursor = Math.max(0, fromSeq - 1)
            const headers = new Headers({ accept: 'text/event-stream' })
            if (cursor > 0) headers.set('last-event-id', String(cursor))
            const res = await fetchImpl(
              `${baseUrl}/api/livestore?storeId=${encodeURIComponent(runId)}&live=true&cursor=${cursor}`,
              { headers, signal: controller.signal },
            )
            if (!res.ok || !res.body) throw new Error(res.ok ? 'livestore sse missing body' : `HTTP ${res.status}`)
            await consumeSseStream(
              res.body,
              (frame) => {
                for (const event of eventsFromSseData(frame.data, runId)) {
                  onEvent(event)
                  fromSeq = Math.max(fromSeq, event.seq + 1)
                }
              },
              controller.signal,
            )
          } catch {
            if (controller.signal.aborted) return
          }
          if (controller.signal.aborted) return
          await delay(reconnectDelayMs, controller.signal)
        }
      }

      void run()
      return () => {
        controller.abort()
      }
    },
  }
}

export type LoomsClient = ReturnType<typeof createLoomsClient>
