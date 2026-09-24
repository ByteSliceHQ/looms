import { Context, Data, Effect, Option, Ref } from 'effect'

import { assertSnapshotByteLimit, SnapshotPayloadTooLargeError } from './limits'
import type { RunState } from './state'
import type { EventStore } from './store'

/**
 * Materialized run state at a known stream position.
 *
 * `cursor` is the seq of the last covered event (aligned with
 * `SnapshotTakenPayload.seq`). Recovery resumes at `cursor + 1`.
 */
export interface RunSnapshot {
  readonly runId: string
  readonly cursor: number
  readonly stateHash: string
  readonly takenAt: number
  readonly state: RunState
}

export class SnapshotStoreError extends Data.TaggedError('SnapshotStoreError')<{
  readonly message: string
  readonly cause?: unknown
}> {
  constructor(text: string, cause?: unknown) {
    super({ message: text, cause })
    this.name = 'SnapshotStoreError'
  }
}

export interface SnapshotStore {
  readonly loadLatest: (
    runId: string,
  ) => Effect.Effect<Option.Option<RunSnapshot>, SnapshotStoreError>
  readonly save: (
    snapshot: RunSnapshot,
  ) => Effect.Effect<void, SnapshotStoreError | SnapshotPayloadTooLargeError>
  readonly listCursors?: (runId: string) => Effect.Effect<number[], SnapshotStoreError>
  readonly prune?: (runId: string, keepLatest: number) => Effect.Effect<void, SnapshotStoreError>
}

export class SnapshotStoreTag extends Context.Service<SnapshotStoreTag, SnapshotStore>()(
  'looms/SnapshotStore',
) {}

const SNAPSHOT_STORE = Symbol.for('looms/EventStore.snapshotStore')

type WithSnapshotStore = EventStore & { [SNAPSHOT_STORE]?: SnapshotStore }

/** Attach a SnapshotStore to an EventStore so facades can pair them without extra options. */
export function withSnapshotStore(store: EventStore, snapshots: SnapshotStore): EventStore {
  const slot: WithSnapshotStore = store
  slot[SNAPSHOT_STORE] = snapshots
  return store
}

export function snapshotStoreOf(store: EventStore): SnapshotStore | undefined {
  const slot: WithSnapshotStore = store
  return slot[SNAPSHOT_STORE]
}

export const makeMemorySnapshotStore = Effect.gen(function* () {
  const snapshots = yield* Ref.make(new Map<string, RunSnapshot[]>())

  const service: SnapshotStore = {
    loadLatest: (runId) =>
      Effect.gen(function* () {
        const map = yield* Ref.get(snapshots)
        const list = map.get(runId)

        if (!list || list.length === 0) {
          return Option.none()
        }

        return Option.some(list[list.length - 1]!)
      }),

    save: (snapshot) =>
      Effect.try({
        try: () => assertSnapshotByteLimit(snapshot),
        catch: (cause) =>
          cause instanceof SnapshotPayloadTooLargeError
            ? cause
            : new SnapshotStoreError('snapshot size validation failed', cause),
      }).pipe(
        Effect.andThen(
          Ref.update(snapshots, (map) => {
            const next = new Map(map)
            const existing = next.get(snapshot.runId) ?? []
            next.set(snapshot.runId, [...existing, snapshot])
            return next
          }),
        ),
      ),

    listCursors: (runId) =>
      Effect.gen(function* () {
        const map = yield* Ref.get(snapshots)
        return (map.get(runId) ?? []).map((item) => item.cursor)
      }),

    prune: (runId, keepLatest) =>
      Ref.update(snapshots, (map) => {
        const list = map.get(runId)

        if (!list || list.length <= keepLatest) {
          return map
        }

        const next = new Map(map)
        next.set(runId, list.slice(list.length - keepLatest))
        return next
      }),
  }

  return service
})
