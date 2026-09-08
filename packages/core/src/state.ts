import type { RuntimeEffect, WaitCondition } from './effects'
import type { JsonValue, ThreadStatus, RunStatus } from './types'

export interface ThreadRecord {
  threadId: string
  kind: string
  definitionName: string
  parentThreadId: string | null
  status: ThreadStatus
  input: JsonValue
  output: JsonValue | null
  error: string | null
  state: JsonValue
}

export interface WaitRecord {
  waitId: string
  threadId: string
  on: WaitCondition
  tag?: JsonValue
}

export interface OutstandingEffect {
  effectId: string
  threadId: string
  causingSeq: number
  causingEventId: string
  effect: RuntimeEffect
}

export interface RunState {
  runId: string
  status: RunStatus
  rootThreadId: string | null
  threads: { [threadId: string]: ThreadRecord }
  waits: { [waitId: string]: WaitRecord }
  outstandingEffects: OutstandingEffect[]
}

export function emptyRunState(runId: string): RunState {
  return {
    runId,
    status: 'running',
    rootThreadId: null,
    threads: {},
    waits: {},
    outstandingEffects: [],
  }
}

export function isRunTerminal(state: RunState): boolean {
  return state.status === 'completed' || state.status === 'failed' || state.status === 'cancelled'
}

export function isRunParked(state: RunState): boolean {
  if (isRunTerminal(state)) return true
  if (state.outstandingEffects.length > 0) return false
  const records = Object.values(state.threads)
  if (records.length === 0) return false
  return records.every(
    (record) =>
      record.status === 'waiting' ||
      record.status === 'completed' ||
      record.status === 'failed' ||
      record.status === 'cancelled',
  )
}
