import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import { Schema } from 'effect'

import { createEvent, JsonValueSchema, type EventEnvelope } from './envelope'
import { foldRun, type FoldRegistry } from './fold'
import { emptyRunState, type RunState } from './state'
import { asJson, fromJsonStruct, type JsonValue } from './types'

export const DEFAULT_SNAPSHOT_EVERY = 200

export const SnapshotTakenPayloadSchema = Schema.Struct({
  seq: Schema.Number,
  stateHash: Schema.String,
  state: Schema.optional(JsonValueSchema),
})

export function hashRunState(state: RunState): string {
  const json = JSON.stringify(state)
  return bytesToHex(sha256(new TextEncoder().encode(json))).slice(0, 16)
}

function runStateToJson(state: RunState): JsonValue {
  const raw: unknown = JSON.parse(JSON.stringify(state))
  return Schema.decodeUnknownSync(JsonValueSchema)(raw)
}

export function shouldTakeSnapshot(
  events: readonly EventEnvelope[],
  every: number = DEFAULT_SNAPSHOT_EVERY,
): boolean {
  const durable = events.filter((e) => !e.ephemeral && e.type !== 'runtime.snapshot.taken')

  if (durable.length === 0) {
    return false
  }

  let lastSnap: EventEnvelope | undefined

  for (let i = events.length - 1; i >= 0; i--) {
    const candidate = events[i]

    if (candidate?.type === 'runtime.snapshot.taken') {
      lastSnap = candidate
      break
    }
  }

  const since = lastSnap ? durable.filter((e) => e.seq > lastSnap.seq).length : durable.length
  return since >= every
}

export function buildSnapshotEvent(
  runId: string,
  events: readonly EventEnvelope[],
  registry: FoldRegistry,
  options?: { includeState?: boolean },
): EventEnvelope {
  const state = foldRun(events, registry, { runId })
  const last = events[events.length - 1]

  const payload = options?.includeState
    ? asJson({ seq: last?.seq ?? 0, stateHash: hashRunState(state), state: runStateToJson(state) })
    : asJson({ seq: last?.seq ?? 0, stateHash: hashRunState(state) })

  return createEvent(runId, {
    type: 'runtime.snapshot.taken',
    payload,
    threadId: null,
    origin: { type: 'system' },
  })
}

export function foldFromSnapshots(
  events: readonly EventEnvelope[],
  registry: FoldRegistry,
  options?: { runId?: string },
): RunState {
  const runId = options?.runId ?? events[0]?.runId ?? 'unknown'
  let latestSnapIdx = -1

  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i]?.type === 'runtime.snapshot.taken') {
      latestSnapIdx = i
      break
    }
  }

  if (latestSnapIdx < 0) {
    return foldRun(events, registry, { runId })
  }

  const snap = events[latestSnapIdx]!
  const decoded = Schema.decodeUnknownSync(SnapshotTakenPayloadSchema)(snap.payload)

  if (decoded.state !== undefined) {
    const trailing = events.filter((e) => e.seq > decoded.seq)

    if (trailing.length === 0) {
      return fromJsonStruct<RunState>(decoded.state)
    }

    return foldRun(trailing, registry, {
      runId,
      initial: fromJsonStruct<RunState>(decoded.state),
    })
  }

  return foldRun(events, registry, { runId })
}

export function emptySnapshot(runId: string): RunState {
  return emptyRunState(runId)
}
