import { AppendInput, AppendRecord, S2, S2Endpoints, S2Error } from '@s2-dev/streamstore'
import { Effect, Layer, Option, Schema } from 'effect'

import {
  createKeyedSerializer,
  SnapshotStoreError,
  SnapshotStoreTag,
  type RunSnapshot,
  type SnapshotStore,
} from '@looms/core'

import { S2ConfigSchema, type S2Config } from './config'

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
  cursor: Schema.Number,
  stateHash: Schema.String,
  takenAt: Schema.Number,
  chunk: Schema.Number,
  chunks: Schema.Number,
  data: Schema.String,
})

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
  // SAFETY: frames are produced by `frameSnapshot` from a serialized RunState.
  const state = JSON.parse(json) as RunSnapshot['state']

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
    return Schema.decodeUnknownSync(SnapshotFrameSchema)(JSON.parse(body))
  } catch {
    return undefined
  }
}

interface SnapshotRecord {
  readonly seqNum: number
  readonly body: string
}

type SnapshotStream = ReturnType<ReturnType<S2['basin']>['stream']>

/**
 * Trailing command records (the trim written by `prune`) are skipped by
 * `ignoreCommandRecords`, so a `tailOffset: 1` read can come back empty.
 * Probe a few records from the tail instead.
 */
const TAIL_PROBE = 4

async function readFromTail(
  stream: SnapshotStream,
  tailOffset: number,
): Promise<SnapshotRecord[] | null> {
  try {
    const page = await stream.read({
      start: { from: { tailOffset } },
      ignoreCommandRecords: true,
    })

    return [...page.records]
  } catch (cause) {
    if (cause instanceof S2Error && (cause.status === 404 || cause.status === 416)) {
      return null
    }

    throw cause
  }
}

/** Latest complete data frame near the tail, with its record, or undefined. */
async function readLatestFrame(
  stream: SnapshotStream,
): Promise<{ record: SnapshotRecord; frame: SnapshotFrame } | undefined> {
  const records = (await readFromTail(stream, TAIL_PROBE)) ?? []

  for (let i = records.length - 1; i >= 0; i--) {
    const record = records[i]!
    const frame = parseFrame(record.body)

    if (frame) {
      return { record, frame }
    }
  }

  return undefined
}

async function readAllSnapshotRecords(stream: SnapshotStream): Promise<SnapshotRecord[]> {
  const records: SnapshotRecord[] = []
  let cursor = 0

  while (true) {
    const page = await stream
      .read({
        start: { from: { seqNum: cursor }, clamp: true },
        stop: { limits: { count: 1000 } },
        ignoreCommandRecords: true,
      })
      .catch((cause: unknown) => {
        // 404: no stream yet. 416: nothing at or past `cursor` (e.g. only a trim record).
        if (cause instanceof S2Error && (cause.status === 404 || cause.status === 416)) {
          return null
        }

        throw cause
      })

    if (!page || page.records.length === 0) {
      break
    }

    records.push(...page.records)
    const last = page.records[page.records.length - 1]!
    const next = last.seqNum + 1

    if (page.tail?.seqNum !== undefined && next >= page.tail.seqNum) {
      break
    }

    cursor = next
  }

  return records
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

  return assembled.sort((a, b) => a.cursor - b.cursor)
}

export function s2SnapshotStore(config: S2Config): SnapshotStore {
  const parsed = Schema.decodeUnknownSync(S2ConfigSchema)(config)
  const client = createClient(parsed)
  const basin = client.basin(parsed.basin)
  const prefix = parsed.snapshotPrefix ?? DEFAULT_PREFIX
  const appends = createKeyedSerializer()
  const ensured = new Set<string>()
  let basinEnsured = false

  const streamName = (runId: string) => `${prefix}/${runId}`

  const ensureBasin = async () => {
    if (basinEnsured) {
      return
    }

    try {
      await client.basins.create({ basin: parsed.basin })
    } catch (err) {
      if (!(err instanceof S2Error && err.status === 409)) {
        throw err
      }
    }

    basinEnsured = true
  }

  const ensureStream = async (runId: string): Promise<SnapshotStream> => {
    await ensureBasin()
    const name = streamName(runId)

    if (!ensured.has(name)) {
      try {
        await basin.streams.create({
          stream: name,
          config: { retentionPolicy: { infinite: {} } },
        })
      } catch (err) {
        if (
          !(
            err instanceof S2Error &&
            (err.status === 409 || err.status === 404 || err.status === 405)
          )
        ) {
          throw err
        }
      }

      ensured.add(name)
    }

    return basin.stream(name)
  }

  const toError = (cause: unknown, message: string) =>
    cause instanceof SnapshotStoreError
      ? cause
      : new SnapshotStoreError(
          `${message}: ${cause instanceof Error ? cause.message : String(cause)}`,
          cause,
        )

  const service: SnapshotStore = {
    save: (snapshot) =>
      Effect.tryPromise({
        try: async () => {
          const stream = await ensureStream(snapshot.runId)
          const frames = frameSnapshot(snapshot)

          const records = frames.map((frame) =>
            AppendRecord.string({
              body: JSON.stringify(frame),
              headers: [
                ['looms-cursor', String(frame.cursor)],
                ['looms-chunk', `${frame.chunk}/${frame.chunks}`],
              ],
            }),
          )

          await appends.run(snapshot.runId, async () => {
            if (records.length === 1) {
              await stream.append(AppendInput.create(records))
              return
            }

            for (const record of records) {
              await stream.append(AppendInput.create([record]))
            }
          })
        },
        catch: (cause) => toError(cause, `Failed to save snapshot for ${snapshot.runId}`),
      }),

    loadLatest: (runId) =>
      Effect.tryPromise({
        try: async () => {
          const stream = await ensureStream(runId)
          const tailFrame = await readLatestFrame(stream)

          if (!tailFrame) {
            return Option.none<RunSnapshot>()
          }

          if (tailFrame.frame.chunk === tailFrame.frame.chunks - 1) {
            const lastFrame = tailFrame.frame
            const records = (await readFromTail(stream, lastFrame.chunks + TAIL_PROBE)) ?? []

            const frames = records
              .map((record) => parseFrame(record.body))
              .filter((frame): frame is SnapshotFrame => frame !== undefined)
              .filter((frame) => frame.cursor === lastFrame.cursor)

            if (frames.length === lastFrame.chunks) {
              return Option.some(assembleSnapshot(frames))
            }
          }

          // Incomplete or interleaved tail: fall back to scanning the retained stream.
          const records = await readAllSnapshotRecords(stream)
          const complete = groupCompleteSnapshots(records)
          const newest = complete[complete.length - 1]
          return newest ? Option.some(newest) : Option.none<RunSnapshot>()
        },
        catch: (cause) => toError(cause, `Failed to load snapshot for ${runId}`),
      }),

    listCursors: (runId) =>
      Effect.tryPromise({
        try: async () => {
          const stream = await ensureStream(runId)
          const records = await readAllSnapshotRecords(stream)
          return groupCompleteSnapshots(records).map((snapshot) => snapshot.cursor)
        },
        catch: (cause) => toError(cause, `Failed to list snapshot cursors for ${runId}`),
      }),

    prune: (runId, keepLatest) =>
      Effect.tryPromise({
        try: async () => {
          const stream = await ensureStream(runId)

          if (keepLatest <= 1) {
            // Fast path: the latest complete frame tells us where the latest snapshot starts.
            const latest = await readLatestFrame(stream)

            if (!latest || latest.frame.chunk !== latest.frame.chunks - 1) {
              return
            }

            const start = latest.record.seqNum - latest.frame.chunk

            if (start <= 0) {
              return
            }

            await appends.run(runId, () =>
              stream.append(AppendInput.create([AppendRecord.trim(start)])),
            )

            return
          }

          const records = await readAllSnapshotRecords(stream)
          const complete = groupCompleteSnapshots(records)

          if (complete.length <= keepLatest) {
            return
          }

          const keep = complete[complete.length - keepLatest]

          if (!keep) {
            return
          }

          const firstKept = records.find(
            (record) => parseFrame(record.body)?.cursor === keep.cursor,
          )

          if (!firstKept) {
            return
          }

          await appends.run(runId, () =>
            stream.append(AppendInput.create([AppendRecord.trim(firstKept.seqNum)])),
          )
        },
        catch: (cause) => toError(cause, `Failed to prune snapshots for ${runId}`),
      }),
  }

  return service
}

export function S2SnapshotStoreLive(config: S2Config) {
  return Layer.succeed(SnapshotStoreTag, s2SnapshotStore(config))
}
