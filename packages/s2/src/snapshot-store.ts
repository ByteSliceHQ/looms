import { AppendInput, AppendRecord, S2, S2Endpoints, S2Error } from '@s2-dev/streamstore'
import { Effect, Layer, Option, Schema, Stream } from 'effect'

import {
  createKeyedSerializer,
  assertSnapshotByteLimit,
  RunStateSchema,
  RunSummarySchema,
  SnapshotStoreError,
  SnapshotPayloadTooLargeError,
  SnapshotStoreTag,
  type RunSnapshot,
  type RunSummary,
  type SnapshotStore,
} from '@looms/core'

import { S2ConfigSchema, type S2Config } from './config'
import { paginateS2Stream } from './pagination'

const DEFAULT_PREFIX = 'snapshots'
const DEFAULT_MAX_CHUNK_BYTES = 900 * 1024

export interface SnapshotFrame {
  readonly v: 1
  readonly runId: string
  readonly cursor: number
  readonly stateHash: string
  readonly takenAt: number
  readonly chunk: number
  readonly chunks: number
  readonly data: string
}

const SnapshotFrameSchema = Schema.Struct({
  v: Schema.Literal(1),
  runId: Schema.String,
  cursor: Schema.Finite,
  stateHash: Schema.String,
  takenAt: Schema.Finite,
  chunk: Schema.Finite,
  chunks: Schema.Finite,
  data: Schema.String,
})

const SnapshotFrameJson = Schema.fromJsonString(SnapshotFrameSchema)
const decodeFrame = Schema.decodeSync(SnapshotFrameJson)
const encodeFrame = Schema.encodeSync(SnapshotFrameJson)
const HeaderJson = Schema.fromJsonString(RunSummarySchema)
const decodeHeader = Schema.decodeUnknownOption(HeaderJson)
const encodeHeader = Schema.encodeSync(HeaderJson)

export function frameSnapshot(
  snapshot: RunSnapshot,
  maxChunkBytes = DEFAULT_MAX_CHUNK_BYTES,
): SnapshotFrame[] {
  const json = JSON.stringify(snapshot.state)
  const chunks = Math.max(1, Math.ceil(json.length / maxChunkBytes))
  const frames: SnapshotFrame[] = []

  for (let i = 0; i < chunks; i++) {
    frames.push({
      v: 1,
      runId: snapshot.runId,
      cursor: snapshot.cursor,
      stateHash: snapshot.stateHash,
      takenAt: snapshot.takenAt,
      chunk: i,
      chunks,
      data: json.slice(i * maxChunkBytes, (i + 1) * maxChunkBytes),
    })
  }

  return frames
}

export function assembleSnapshot(frames: readonly SnapshotFrame[]): RunSnapshot {
  if (frames.length === 0) {
    throw new SnapshotStoreError('Cannot assemble snapshot from empty frames')
  }

  const first = frames[0]!
  // Oxlint's immutable alternative requires ES2023; sorting a fresh copy is safe on ES2022.
  // oxlint-disable-next-line unicorn/no-array-sort
  const ordered = [...frames].sort((a, b) => a.chunk - b.chunk)

  for (const frame of ordered) {
    if (
      frame.cursor !== first.cursor ||
      frame.chunks !== first.chunks ||
      frame.runId !== first.runId
    ) {
      throw new SnapshotStoreError('Snapshot frames are inconsistent')
    }
  }

  if (ordered.length !== first.chunks) {
    throw new SnapshotStoreError(
      `Incomplete snapshot: got ${ordered.length} of ${first.chunks} frames`,
    )
  }

  for (let i = 0; i < first.chunks; i++) {
    if (ordered[i]?.chunk !== i) {
      throw new SnapshotStoreError(`Missing snapshot chunk ${i}`)
    }
  }

  const json = ordered.map((frame) => frame.data).join('')
  const state = Schema.decodeSync(Schema.fromJsonString(RunStateSchema))(json)

  return {
    runId: first.runId,
    cursor: first.cursor,
    stateHash: first.stateHash,
    takenAt: first.takenAt,
    state,
  }
}

function createClient(config: S2Config): S2 {
  if (Schema.is(Schema.String)(config.endpoint)) {
    return new S2({
      accessToken: config.accessToken,
      endpoints: new S2Endpoints({
        account: config.endpoint,
        basin: config.endpoint,
      }),
    })
  }

  if (config.endpoint) {
    return new S2({
      accessToken: config.accessToken,
      endpoints: new S2Endpoints(config.endpoint),
    })
  }

  return new S2({ accessToken: config.accessToken })
}

function parseFrame(body: string): SnapshotFrame | undefined {
  try {
    return decodeFrame(body)
  } catch {
    return undefined
  }
}

interface SnapshotRecord {
  readonly seqNum: number
  readonly body: string
}

type SnapshotStream = ReturnType<ReturnType<S2['basin']>['stream']>

function toSnapshotError(cause: unknown, message: string): SnapshotStoreError {
  return cause instanceof SnapshotStoreError
    ? cause
    : new SnapshotStoreError(
        `${message}: ${cause instanceof Error ? cause.message : String(cause)}`,
        cause,
      )
}

/**
 * Trailing command records (the trim written by `prune`) are skipped by
 * `ignoreCommandRecords`, so a `tailOffset: 1` read can come back empty.
 * Probe a few records from the tail instead.
 */
const TAIL_PROBE = 4

function readFromTail(
  stream: SnapshotStream,
  tailOffset: number,
): Effect.Effect<SnapshotRecord[], SnapshotStoreError> {
  return Effect.tryPromise({
    try: () =>
      stream.read({
        start: { from: { tailOffset } },
        ignoreCommandRecords: true,
      }),
    catch: (cause) => toSnapshotError(cause, 'Failed to read snapshot stream tail'),
  }).pipe(
    Effect.map((page) => [...page.records]),
    Effect.catchIf(
      (error) =>
        error.cause instanceof S2Error &&
        (error.cause.status === 404 || error.cause.status === 416),
      () => Effect.succeed([]),
    ),
  )
}

/** Latest complete data frame near the tail, with its record, or undefined. */
function readLatestFrame(
  stream: SnapshotStream,
): Effect.Effect<{ record: SnapshotRecord; frame: SnapshotFrame } | undefined, SnapshotStoreError> {
  return readFromTail(stream, TAIL_PROBE).pipe(
    Effect.map((records) => {
      for (let i = records.length - 1; i >= 0; i--) {
        const record = records[i]!
        const frame = parseFrame(record.body)

        if (frame) {
          return { record, frame }
        }
      }

      return undefined
    }),
  )
}

function readAllSnapshotRecords(
  stream: SnapshotStream,
): Effect.Effect<SnapshotRecord[], SnapshotStoreError> {
  return paginateS2Stream((cursor, count) =>
    Effect.tryPromise({
      try: () =>
        stream.read({
          start: { from: { seqNum: cursor }, clamp: true },
          stop: { limits: { count } },
          ignoreCommandRecords: true,
        }),
      catch: (cause) => toSnapshotError(cause, 'Failed to scan snapshot stream'),
    }).pipe(
      Effect.catchIf(
        (error) =>
          error.cause instanceof S2Error &&
          (error.cause.status === 404 || error.cause.status === 416),
        () => Effect.succeed(null),
      ),
    ),
  ).pipe(Stream.runCollect)
}

function groupCompleteSnapshots(records: readonly SnapshotRecord[]): RunSnapshot[] {
  const byCursor = new Map<number, SnapshotFrame[]>()

  for (const record of records) {
    const frame = parseFrame(record.body)

    if (!frame) {
      continue
    }

    const existing = byCursor.get(frame.cursor) ?? []
    existing.push(frame)
    byCursor.set(frame.cursor, existing)
  }

  const assembled: RunSnapshot[] = []

  for (const frames of byCursor.values()) {
    try {
      assembled.push(assembleSnapshot(frames))
    } catch {
      continue
    }
  }

  // `assembled` is function-local, so in-place sorting cannot mutate caller-owned data.
  // oxlint-disable-next-line unicorn/no-array-sort
  return assembled.sort((a, b) => a.cursor - b.cursor)
}

export function s2SnapshotStore(config: S2Config): SnapshotStore {
  const parsed = Schema.decodeSync(S2ConfigSchema)(config)
  const client = createClient(parsed)
  const basin = client.basin(parsed.basin)
  const prefix = parsed.snapshotPrefix ?? DEFAULT_PREFIX
  const appends = createKeyedSerializer()
  const ensured = new Set<string>()
  const headers = new Map<string, RunSummary>()
  let basinEnsured = false
  let headersLoaded = false

  const streamName = (runId: string) => `${prefix}/${runId}`

  const ensureBasin = Effect.suspend(() => {
    if (basinEnsured) {
      return Effect.void
    }

    return Effect.tryPromise({
      try: () => client.basins.create({ basin: parsed.basin }),
      catch: (cause) => toSnapshotError(cause, `Failed to ensure basin ${parsed.basin}`),
    }).pipe(
      Effect.catchIf(
        (error) => error.cause instanceof S2Error && error.cause.status === 409,
        () => Effect.void,
      ),
      Effect.tap(() =>
        Effect.sync(() => {
          basinEnsured = true
        }),
      ),
      Effect.asVoid,
    )
  })

  const ensureStream = (runId: string): Effect.Effect<SnapshotStream, SnapshotStoreError> =>
    Effect.gen(function* () {
      yield* ensureBasin
      const name = streamName(runId)

      if (!ensured.has(name)) {
        yield* Effect.tryPromise({
          try: () =>
            basin.streams.create({
              stream: name,
              config: { retentionPolicy: { infinite: {} } },
            }),
          catch: (cause) => toSnapshotError(cause, `Failed to ensure stream ${name}`),
        }).pipe(
          Effect.catchIf(
            (error) =>
              error.cause instanceof S2Error &&
              (error.cause.status === 409 ||
                error.cause.status === 404 ||
                error.cause.status === 405),
            () => Effect.void,
          ),
        )

        ensured.add(name)
      }

      return basin.stream(name)
    })

  const service: SnapshotStore = {
    save: (snapshot) =>
      Effect.gen(function* () {
        yield* Effect.try({
          try: () => assertSnapshotByteLimit(snapshot),
          catch: (cause) =>
            cause instanceof SnapshotPayloadTooLargeError
              ? cause
              : new SnapshotStoreError('snapshot size validation failed', cause),
        })

        const stream = yield* ensureStream(snapshot.runId)
        const frames = frameSnapshot(snapshot)

        const records = frames.map((frame) =>
          AppendRecord.string({
            body: encodeFrame(frame),
            headers: [
              ['looms-cursor', String(frame.cursor)],
              ['looms-chunk', `${frame.chunk}/${frame.chunks}`],
            ],
          }),
        )

        yield* Effect.tryPromise({
          try: () =>
            appends.run(snapshot.runId, () => {
              if (records.length === 1) {
                return stream.append(AppendInput.create(records)).then(() => undefined)
              }

              let pending = Promise.resolve()

              for (const record of records) {
                pending = pending.then(() =>
                  stream.append(AppendInput.create([record])).then(() => undefined),
                )
              }

              return pending
            }),
          catch: (cause) => toSnapshotError(cause, `Failed to save snapshot for ${snapshot.runId}`),
        })
      }),

    loadLatest: (runId) =>
      Effect.gen(function* () {
        const stream = yield* ensureStream(runId)
        const tailFrame = yield* readLatestFrame(stream)

        if (!tailFrame) {
          return Option.none<RunSnapshot>()
        }

        if (tailFrame.frame.chunk === tailFrame.frame.chunks - 1) {
          const lastFrame = tailFrame.frame
          const records = (yield* readFromTail(stream, lastFrame.chunks + TAIL_PROBE)) ?? []

          const frames = records
            .map((record) => parseFrame(record.body))
            .filter((frame): frame is SnapshotFrame => frame !== undefined)
            .filter((frame) => frame.cursor === lastFrame.cursor)

          if (frames.length === lastFrame.chunks) {
            return Option.some(assembleSnapshot(frames))
          }
        }

        // Incomplete or interleaved tail: fall back to scanning the retained stream.
        const records = yield* readAllSnapshotRecords(stream)
        const complete = groupCompleteSnapshots(records)
        const newest = complete[complete.length - 1]
        return newest ? Option.some(newest) : Option.none<RunSnapshot>()
      }),

    listCursors: (runId) =>
      Effect.gen(function* () {
        const stream = yield* ensureStream(runId)
        const records = yield* readAllSnapshotRecords(stream)
        return groupCompleteSnapshots(records).map((snapshot) => snapshot.cursor)
      }),

    prune: (runId, keepLatest) =>
      Effect.gen(function* () {
        const stream = yield* ensureStream(runId)

        if (keepLatest <= 1) {
          // Fast path: the latest complete frame tells us where the latest snapshot starts.
          const latest = yield* readLatestFrame(stream)

          if (!latest || latest.frame.chunk !== latest.frame.chunks - 1) {
            return
          }

          const start = latest.record.seqNum - latest.frame.chunk

          if (start <= 0) {
            return
          }

          yield* Effect.tryPromise({
            try: () =>
              appends.run(runId, () =>
                stream.append(AppendInput.create([AppendRecord.trim(start)])),
              ),
            catch: (cause) => toSnapshotError(cause, `Failed to prune snapshots for ${runId}`),
          })

          return
        }

        const records = yield* readAllSnapshotRecords(stream)
        const complete = groupCompleteSnapshots(records)

        if (complete.length <= keepLatest) {
          return
        }

        const keep = complete[complete.length - keepLatest]

        if (!keep) {
          return
        }

        const firstKept = records.find((record) => parseFrame(record.body)?.cursor === keep.cursor)

        if (!firstKept) {
          return
        }

        yield* Effect.tryPromise({
          try: () =>
            appends.run(runId, () =>
              stream.append(AppendInput.create([AppendRecord.trim(firstKept.seqNum)])),
            ),
          catch: (cause) => toSnapshotError(cause, `Failed to prune snapshots for ${runId}`),
        })
      }),

    saveHeader: (header) =>
      Effect.gen(function* () {
        const stream = yield* ensureStream('__headers')

        yield* Effect.tryPromise({
          try: () =>
            appends.run('__headers', () =>
              stream.append(
                AppendInput.create([AppendRecord.string({ body: encodeHeader(header) })]),
              ),
            ),
          catch: (cause) => toSnapshotError(cause, `Failed to save run header for ${header.runId}`),
        })

        headers.set(header.runId, header)
      }),

    listHeaders: Effect.gen(function* () {
      if (headersLoaded) {
        return [...headers.values()]
      }

      const stream = yield* ensureStream('__headers')

      const records = yield* paginateS2Stream((cursor, count) =>
        Effect.tryPromise({
          try: () =>
            stream.read({
              start: { from: { seqNum: cursor }, clamp: true },
              stop: { limits: { count } },
              ignoreCommandRecords: true,
            }),
          catch: (cause) => toSnapshotError(cause, 'Failed to read run headers'),
        }).pipe(
          Effect.catchIf(
            (error) =>
              error.cause instanceof S2Error &&
              (error.cause.status === 404 || error.cause.status === 416),
            () => Effect.succeed(null),
          ),
        ),
      ).pipe(Stream.runCollect)

      const loaded = new Map<string, RunSummary>()

      for (const record of records) {
        const decoded = decodeHeader(record.body)

        if (Option.isSome(decoded)) {
          loaded.set(decoded.value.runId, decoded.value)
        }
      }

      for (const [runId, header] of loaded) {
        if (!headers.has(runId)) {
          headers.set(runId, header)
        }
      }

      headersLoaded = true
      return [...headers.values()]
    }),
  }

  return service
}

export function S2SnapshotStoreLive(config: S2Config) {
  return Layer.succeed(SnapshotStoreTag, s2SnapshotStore(config))
}
