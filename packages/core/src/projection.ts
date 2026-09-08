import { Predicate } from 'effect'
import type { EventEnvelope } from './envelope'
import type { RunState, ThreadRecord } from './state'
import type { JsonValue, ThreadStatus } from './types'

export interface ProjectionDefinition<S = unknown> {
  readonly name: string
  initialState: S
  reduce(state: S, event: EventEnvelope): S
}

export function defineProjection<S>(def: {
  readonly name: string
  readonly initialState: S
  reduce(state: S, event: EventEnvelope): S
}): ProjectionDefinition<S> {
  return def
}

export function foldProjection<S>(
  projection: ProjectionDefinition<S>,
  events: readonly EventEnvelope[],
  initial?: S,
): S {
  let state = initial !== undefined ? initial : projection.initialState
  for (const event of events) {
    state = projection.reduce(state, event)
  }
  return state
}

/** Fold a projection over events, skipping ephemeral ones. */
export function project<S>(
  definition: ProjectionDefinition<S>,
  events: readonly EventEnvelope[],
  from?: S,
): S {
  let state = from ?? definition.initialState
  for (const event of events) {
    if (event.ephemeral) continue
    state = definition.reduce(state, event)
  }
  return state
}

export interface ThreadNode {
  threadId: string
  kind: string
  definitionName: string
  status: ThreadRecord['status']
  parentThreadId: string | null
  children: ThreadNode[]
}

export type TreeNode = ThreadNode

export interface ThreadTree {
  runId: string
  root: ThreadNode | null
}

export interface TreeBuildState {
  runId: string
  records: { [threadId: string]: ThreadRecord }
  rootThreadId: string | null
}

function readPayload(event: EventEnvelope): { [key: string]: JsonValue } {
  if (!Predicate.isObject(event.payload)) return {}
  return event.payload
}

function readString(obj: { [key: string]: JsonValue }, key: string): string | undefined {
  const value = obj[key]
  return Predicate.isString(value) ? value : undefined
}

export const threadTree = defineProjection<TreeBuildState>({
  name: 'threadTree',
  initialState: { runId: '', records: {}, rootThreadId: null },
  reduce(state, event) {
    const payload = readPayload(event)
    switch (event.type) {
      case 'runtime.run.started': {
        const rootThreadId = readString(payload, 'rootThreadId') ?? state.rootThreadId
        return {
          ...state,
          runId: event.runId,
          rootThreadId,
        }
      }
      case 'runtime.thread.started': {
        const threadId = readString(payload, 'threadId') ?? event.threadId
        const kind = readString(payload, 'kind')
        const definitionName = readString(payload, 'definitionName')
        if (!threadId || !kind || !definitionName) return { ...state, runId: event.runId }
        const parent = payload.parentThreadId
        const parentThreadId = parent === null || Predicate.isString(parent) ? parent : null
        const record: ThreadRecord = {
          threadId,
          kind,
          definitionName,
          parentThreadId,
          status: 'running',
          input: payload.input ?? null,
          output: null,
          error: null,
          state: {},
        }
        const rootThreadId = state.rootThreadId ?? threadId
        return {
          runId: event.runId,
          rootThreadId,
          records: { ...state.records, [threadId]: record },
        }
      }
      case 'runtime.thread.completed':
      case 'runtime.thread.failed':
      case 'runtime.thread.cancelled': {
        const threadId = readString(payload, 'threadId') ?? event.threadId
        if (!threadId) return { ...state, runId: event.runId }
        const existing = state.records[threadId]
        if (!existing) return { ...state, runId: event.runId }
        const status: ThreadStatus =
          event.type === 'runtime.thread.completed'
            ? 'completed'
            : event.type === 'runtime.thread.failed'
              ? 'failed'
              : 'cancelled'
        return {
          ...state,
          runId: event.runId,
          records: {
            ...state.records,
            [threadId]: {
              ...existing,
              status,
              output: payload.output ?? existing.output,
              error: readString(payload, 'error') ?? existing.error,
            },
          },
        }
      }
      default:
        return state.runId === event.runId ? state : { ...state, runId: event.runId }
    }
  },
})

export function toThreadTree(state: TreeBuildState): ThreadTree {
  return treeFromRun({
    runId: state.runId,
    status: 'running',
    rootThreadId: state.rootThreadId,
    threads: state.records,
    waits: {},
    outstandingEffects: [],
  })
}

export function treeFromRun(state: RunState): ThreadTree {
  const records = Object.values(state.threads)
  const byParent = new Map<string | null, ThreadRecord[]>()
  for (const record of records) {
    const key = record.parentThreadId
    const list = byParent.get(key) ?? []
    list.push(record)
    byParent.set(key, list)
  }
  const toNode = (record: ThreadRecord): ThreadNode => ({
    threadId: record.threadId,
    kind: record.kind,
    definitionName: record.definitionName,
    status: record.status,
    parentThreadId: record.parentThreadId,
    children: (byParent.get(record.threadId) ?? []).map(toNode),
  })
  const rootRecord = state.rootThreadId
    ? state.threads[state.rootThreadId]
    : records.find((r) => r.parentThreadId === null)
  return {
    runId: state.runId,
    root: rootRecord ? toNode(rootRecord) : null,
  }
}

export interface TimelineEntry {
  seq: number
  id: string
  type: string
  threadId: string | null
  causationId: string | null
  effectId: string | null
  ts: number
}

export const timeline = defineProjection<TimelineEntry[]>({
  name: 'timeline',
  initialState: [],
  reduce(state, event) {
    const threadId = event.threadId ?? null
    return [
      ...state,
      {
        seq: event.seq,
        id: event.id,
        type: event.type,
        threadId,
        causationId: event.causationId ?? null,
        effectId: event.effectId ?? null,
        ts: event.ts,
      },
    ]
  },
})
