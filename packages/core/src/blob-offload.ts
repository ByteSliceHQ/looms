import { Effect, Option, Schema, Stream } from 'effect'

import { BlobStoreError, type BlobStore, type BlobStoreFailure } from './blob-store'
import {
  DEFAULT_BLOB_THRESHOLD_BYTES,
  claimJson,
  collectBlobDigests,
  expandBlobDigests,
  offloadJson,
  resolveJson,
} from './blobs'
import type { AppendableEvent, EventEnvelope } from './envelope'
import { DEFAULT_MAX_EVENT_BYTES, utf8JsonBytes } from './limits'
import { SnapshotStoreError, withSnapshotStore, type SnapshotStore } from './snapshot-store'
import { RunStateSchema, type RunState } from './state'
import { EventStoreError, type EventStore } from './store'
import type { JsonValue } from './types'

const decodeJsonText = Schema.decodeUnknownEffect(Schema.fromJsonString(Schema.Json))
const decodeRunState = Schema.decodeUnknownEffect(RunStateSchema)

export interface BlobOffloadOptions {
  /** Snapshot store to offload and resolve. Trim keeps digests referenced by its latest snapshot. */
  readonly snapshots?: SnapshotStore
  /** UTF-8 JSON size above which a string is stored by hash. Default 64 KiB. */
  readonly thresholdBytes?: number
  /** Serialized event size that claims the whole payload. Default 1 MiB. */
  readonly maxEventBytes?: number
}

/**
 * Store oversized JSON outside the event log.
 *
 * Append replaces values over the threshold with a content-addressed reference before the
 * event byte limit runs. `read`, `readStream`, and `subscribe` resolve those references, so
 * folds, projections, and callers see the original values. The stored log keeps the references.
 * When `snapshots` is set, snapshot save and load do the same, and trim deletes a body only
 * once no retained event and no latest snapshot in any run still needs it.
 */
export function withBlobOffload(
  store: EventStore,
  blobs: BlobStore,
  options?: BlobOffloadOptions,
): EventStore {
  const thresholdBytes = options?.thresholdBytes ?? DEFAULT_BLOB_THRESHOLD_BYTES
  const maxEventBytes = options?.maxEventBytes ?? DEFAULT_MAX_EVENT_BYTES
  const snapshots = options?.snapshots

  const wrappedSnapshots = snapshots
    ? wrapSnapshots(snapshots, store, blobs, thresholdBytes)
    : undefined

  const release = (runId: string): Effect.Effect<void, EventStoreError> =>
    keepDigests(store, snapshots, blobs, runId).pipe(
      Effect.flatMap((keep) => blobs.replaceRefs(runId, keep)),
      Effect.mapError(asEventError),
    )

  const wrapped: EventStore = {
    append: (runId, events, appendOptions) =>
      Effect.gen(function* () {
        const stored = yield* Effect.forEach(events, (event) =>
          offloadAppendable(runId, event, blobs, thresholdBytes, maxEventBytes),
        ).pipe(Effect.mapError(asEventError))

        const seeds = digestsOf(stored.map((event) => event.payload))

        const expanded = yield* expandBlobDigests(blobs, seeds).pipe(Effect.mapError(asEventError))

        yield* blobs.retain(runId, [...expanded]).pipe(Effect.mapError(asEventError))

        return yield* store.append(runId, stored, appendOptions)
      }),

    read: (runId, readOptions) =>
      store
        .read(runId, readOptions)
        .pipe(
          Effect.flatMap((events) =>
            Effect.forEach(events, (event) =>
              resolveEnvelope(event, blobs).pipe(Effect.mapError(asEventError)),
            ),
          ),
        ),

    readStream: store.readStream
      ? (runId, readOptions) =>
          store.readStream!(runId, readOptions).pipe(
            Stream.mapEffect((event) =>
              resolveEnvelope(event, blobs).pipe(Effect.mapError(asEventError)),
            ),
          )
      : undefined,

    tail: (runId) => store.tail(runId),

    bounds: store.bounds ? (runId) => store.bounds!(runId) : undefined,

    trim: store.trim
      ? (runId, beforeSeq) => store.trim!(runId, beforeSeq).pipe(Effect.andThen(release(runId)))
      : undefined,

    subscribe: (runId, subscribeOptions) =>
      store
        .subscribe(runId, subscribeOptions)
        .pipe(
          Stream.mapEffect((event) =>
            resolveEnvelope(event, blobs).pipe(Effect.mapError(asEventError)),
          ),
        ),

    listRuns: store.listRuns,
  }

  if (!wrappedSnapshots) {
    return wrapped
  }

  return withSnapshotStore(wrapped, wrappedSnapshots)
}

function offloadAppendable(
  runId: string,
  event: AppendableEvent,
  blobs: BlobStore,
  thresholdBytes: number,
  maxEventBytes: number,
): Effect.Effect<AppendableEvent, BlobStoreFailure> {
  return Effect.gen(function* () {
    const payload = yield* offloadJson(event.payload, blobs, { thresholdBytes })
    const offloaded = { ...event, payload }

    if (eventBytes(runId, offloaded) <= maxEventBytes) {
      return offloaded
    }

    const ref = yield* claimJson(payload, blobs)

    return { ...event, payload: ref }
  })
}

function eventBytes(runId: string, event: AppendableEvent): number {
  return utf8JsonBytes({ ...event, runId, seq: event.seq ?? 0 })
}

function resolveEnvelope(
  event: EventEnvelope,
  blobs: BlobStore,
): Effect.Effect<EventEnvelope, BlobStoreFailure> {
  return resolveJson(event.payload, blobs).pipe(Effect.map((payload) => ({ ...event, payload })))
}

function digestsOf(values: ReadonlyArray<JsonValue>): Set<string> {
  const seeds = new Set<string>()

  for (const value of values) {
    collectBlobDigests(value, seeds)
  }

  return seeds
}

function keepDigests(
  store: EventStore,
  snapshots: SnapshotStore | undefined,
  blobs: BlobStore,
  runId: string,
): Effect.Effect<ReadonlySet<string>, EventStoreError | BlobStoreFailure> {
  return Effect.gen(function* () {
    const events = yield* store.read(runId)
    const seeds = digestsOf(events.map((event) => event.payload))

    if (snapshots) {
      const latest = yield* snapshots
        .loadLatest(runId)
        .pipe(Effect.mapError((cause) => new EventStoreError(cause.message, cause)))

      if (Option.isSome(latest)) {
        const encoded = yield* jsonValue(latest.value.state).pipe(
          Effect.mapError((cause) => new EventStoreError(cause.message, cause)),
        )

        collectBlobDigests(encoded, seeds)
      }
    }

    return yield* expandBlobDigests(blobs, seeds)
  })
}

function wrapSnapshots(
  snapshots: SnapshotStore,
  store: EventStore,
  blobs: BlobStore,
  thresholdBytes: number,
): SnapshotStore {
  const release = (runId: string): Effect.Effect<void, SnapshotStoreError> =>
    keepDigests(store, snapshots, blobs, runId).pipe(
      Effect.flatMap((keep) => blobs.replaceRefs(runId, keep)),
      Effect.mapError((cause) => new SnapshotStoreError(cause.message, cause)),
    )

  return {
    loadLatest: (runId) =>
      Effect.gen(function* () {
        const loaded = yield* snapshots.loadLatest(runId)

        if (Option.isNone(loaded)) {
          return loaded
        }

        const encoded = yield* jsonValue(loaded.value.state).pipe(Effect.mapError(asSnapshotError))
        const resolved = yield* resolveJson(encoded, blobs).pipe(Effect.mapError(asSnapshotError))

        const state = yield* decodeRunState(resolved).pipe(
          Effect.mapError(
            (cause) => new SnapshotStoreError('snapshot state did not match RunState', cause),
          ),
        )

        return Option.some({ ...loaded.value, state })
      }),

    save: (snapshot) =>
      Effect.gen(function* () {
        const encoded = yield* jsonValue(snapshot.state).pipe(Effect.mapError(asSnapshotError))

        const offloaded = yield* offloadJson(encoded, blobs, {
          thresholdBytes,
          claimRoot: false,
        }).pipe(Effect.mapError(asSnapshotError))

        const state = yield* decodeRunState(offloaded).pipe(
          Effect.mapError(
            (cause) => new SnapshotStoreError('snapshot state did not match RunState', cause),
          ),
        )

        const seeds = digestsOf([offloaded])

        const expanded = yield* expandBlobDigests(blobs, seeds).pipe(
          Effect.mapError(asSnapshotError),
        )

        yield* blobs.retain(snapshot.runId, [...expanded]).pipe(Effect.mapError(asSnapshotError))

        return yield* snapshots.save({
          runId: snapshot.runId,
          cursor: snapshot.cursor,
          stateHash: snapshot.stateHash,
          takenAt: snapshot.takenAt,
          state,
        })
      }),

    listCursors: snapshots.listCursors ? (runId) => snapshots.listCursors!(runId) : undefined,

    prune: snapshots.prune
      ? (runId, keepLatest) =>
          snapshots.prune!(runId, keepLatest).pipe(Effect.andThen(release(runId)))
      : undefined,

    saveHeader: (header) => snapshots.saveHeader(header),

    listHeaders: snapshots.listHeaders,
  }
}

function jsonValue(state: RunState): Effect.Effect<JsonValue, BlobStoreError> {
  return decodeJsonText(JSON.stringify(state)).pipe(
    Effect.mapError((cause) => new BlobStoreError('snapshot state is not JSON', cause)),
  )
}

function asEventError(cause: BlobStoreFailure | EventStoreError): EventStoreError {
  return new EventStoreError(cause.message, cause)
}

function asSnapshotError(cause: BlobStoreFailure | EventStoreError): SnapshotStoreError {
  return new SnapshotStoreError(cause.message, cause)
}
