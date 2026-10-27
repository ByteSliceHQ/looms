import { Data, Effect, Schema } from 'effect'

const SHA256 = /^[a-f0-9]{64}$/

const decodeDigestList = Schema.decodeUnknownEffect(
  Schema.fromJsonString(Schema.Array(Schema.String)),
)

export class BlobStoreError extends Data.TaggedError('BlobStoreError')<{
  readonly message: string
  readonly cause?: unknown
}> {
  override readonly cause?: unknown

  constructor(message: string, cause?: unknown) {
    super({ message, cause })
    this.name = 'BlobStoreError'
    this.cause = cause
  }
}

export class BlobNotFoundError extends Data.TaggedError('BlobNotFoundError')<{
  readonly digest: string
  readonly message: string
}> {
  constructor(digest: string) {
    super({ digest, message: `blob ${digest} was not found` })
    this.name = 'BlobNotFoundError'
  }
}

export type BlobStoreFailure = BlobStoreError | BlobNotFoundError

/**
 * Content-addressed bytes. `put` is idempotent: the same digest stores one body.
 * `retain` and `replaceRefs` record which digests a run still needs. A body is deleted only
 * when no run references it. Many runs may share one store, each writing its own references.
 */
export interface BlobStore {
  readonly put: (digest: string, body: Uint8Array) => Effect.Effect<void, BlobStoreError>
  readonly get: (digest: string) => Effect.Effect<Uint8Array, BlobStoreFailure>
  readonly retain: (
    runId: string,
    digests: ReadonlyArray<string>,
  ) => Effect.Effect<void, BlobStoreError>
  readonly replaceRefs: (
    runId: string,
    keep: ReadonlySet<string>,
  ) => Effect.Effect<void, BlobStoreError>
}

export function isSha256Digest(value: string): boolean {
  return SHA256.test(value)
}

/** Byte operations behind {@link blobStoreFromBytes}. Keys are store-relative, not run ids. */
export interface BlobBytes {
  readonly read: (key: string) => Effect.Effect<Uint8Array | null, BlobStoreError>
  readonly write: (key: string, body: Uint8Array) => Effect.Effect<void, BlobStoreError>
  readonly remove: (key: string) => Effect.Effect<void, BlobStoreError>
  readonly exists: (key: string) => Effect.Effect<boolean, BlobStoreError>
  readonly list: (prefix: string) => Effect.Effect<ReadonlyArray<string>, BlobStoreError>
}

const EMPTY = new Uint8Array(0)

export function memoryBlobStore(): BlobStore {
  return blobStoreFromBytes(memoryBlobBytes())
}

export function blobStoreFromBytes(bytes: BlobBytes): BlobStore {
  return {
    put: (digest, body) =>
      Effect.gen(function* () {
        yield* assertDigest(digest)

        const actual = yield* sha256Hex(body)

        if (actual !== digest) {
          return yield* new BlobStoreError(`blob body does not match digest ${digest}`)
        }

        const existing = yield* bytes.read(objectKey(digest))

        if (existing) {
          const existingDigest = yield* sha256Hex(existing)

          // A truncated or corrupted object must be overwritten; skipping leaves get() broken forever.
          if (existingDigest === digest) {
            return yield* Effect.void
          }
        }

        return yield* bytes.write(objectKey(digest), body)
      }),

    get: (digest) =>
      Effect.gen(function* () {
        yield* assertDigest(digest)

        const body = yield* bytes.read(objectKey(digest))

        if (!body) {
          return yield* new BlobNotFoundError(digest)
        }

        const actual = yield* sha256Hex(body)

        if (actual !== digest) {
          return yield* new BlobStoreError(`blob ${digest} failed its integrity check`)
        }

        return body
      }),

    // Markers go down before the existence check, and `collect` lists markers again after
    // deleting. Whichever side runs second sees the other, so a referenced body is never lost:
    // either `collect` restores it or this append fails and its retry uploads the body again.
    retain: (runId, digests) =>
      Effect.gen(function* () {
        const current = new Set(yield* readRunDigests(bytes, runId))
        const added = [...new Set(digests)].filter((digest) => !current.has(digest))

        if (added.length === 0) {
          return yield* Effect.void
        }

        yield* Effect.forEach(added, assertDigest, { discard: true })

        yield* Effect.forEach(added, (digest) => bytes.write(refKey(digest, runId), EMPTY), {
          concurrency: REF_CONCURRENCY,
          discard: true,
        })

        yield* writeRunDigests(bytes, runId, [...current, ...added])

        const present = yield* Effect.forEach(added, (digest) => bytes.exists(objectKey(digest)), {
          concurrency: REF_CONCURRENCY,
        })

        const missing = added.filter((_, index) => !present[index])

        if (missing.length > 0) {
          return yield* new BlobStoreError(
            `blobs ${missing.join(', ')} were deleted before run ${runId} referenced them; retry the append`,
          )
        }

        return yield* Effect.void
      }),

    replaceRefs: (runId, keep) =>
      Effect.gen(function* () {
        const previous = yield* readRunDigests(bytes, runId)
        const dropped = previous.filter((digest) => !keep.has(digest))

        if (dropped.length === 0) {
          return
        }

        yield* Effect.forEach(
          dropped,
          (digest) =>
            bytes.remove(refKey(digest, runId)).pipe(Effect.andThen(collect(bytes, digest))),
          { concurrency: REF_CONCURRENCY, discard: true },
        )

        yield* writeRunDigests(
          bytes,
          runId,
          previous.filter((digest) => keep.has(digest)),
        )
      }),
  }
}

const REF_CONCURRENCY = 8

/** Deletes a body no run references, and puts it back if a run referenced it meanwhile. */
function collect(bytes: BlobBytes, digest: string): Effect.Effect<void, BlobStoreError> {
  const referenced = bytes.list(refPrefix(digest)).pipe(Effect.map((keys) => keys.length > 0))

  return Effect.gen(function* () {
    if (yield* referenced) {
      return
    }

    const body = yield* bytes.read(objectKey(digest))

    if (!body) {
      return
    }

    yield* bytes.remove(objectKey(digest))

    if (yield* referenced) {
      yield* bytes.write(objectKey(digest), body)
    }
  })
}

function memoryBlobBytes(): BlobBytes {
  const objects = new Map<string, Uint8Array>()

  return {
    read: (key) =>
      Effect.sync(() => {
        const body = objects.get(key)

        return body ? body.slice() : null
      }),

    write: (key, body) =>
      Effect.sync(() => {
        objects.set(key, body.slice())
      }),

    remove: (key) =>
      Effect.sync(() => {
        objects.delete(key)
      }),

    exists: (key) => Effect.sync(() => objects.has(key)),

    list: (prefix) =>
      Effect.sync(() => [...objects.keys()].filter((key) => key.startsWith(prefix))),
  }
}

function objectKey(digest: string): string {
  return `objects/${digest}`
}

function runKey(runId: string): string {
  return `runs/${encodeURIComponent(runId)}`
}

function refPrefix(digest: string): string {
  return `refs/${digest}/`
}

function refKey(digest: string, runId: string): string {
  return `${refPrefix(digest)}${encodeURIComponent(runId)}`
}

function assertDigest(digest: string): Effect.Effect<void, BlobStoreError> {
  if (isSha256Digest(digest)) {
    return Effect.void
  }

  return Effect.fail(new BlobStoreError(`invalid blob digest ${digest}`))
}

export function sha256Hex(body: Uint8Array): Effect.Effect<string, BlobStoreError> {
  const copy = new Uint8Array(body.byteLength)
  copy.set(body)

  return Effect.tryPromise({
    try: () => crypto.subtle.digest('SHA-256', copy),
    catch: (cause) => new BlobStoreError('SHA-256 failed', cause),
  }).pipe(Effect.map((buffer) => hex(new Uint8Array(buffer))))
}

function hex(bytes: Uint8Array): string {
  let encoded = ''

  for (const byte of bytes) {
    encoded += byte.toString(16).padStart(2, '0')
  }

  return encoded
}

function readRunDigests(
  bytes: BlobBytes,
  runId: string,
): Effect.Effect<ReadonlyArray<string>, BlobStoreError> {
  return bytes.read(runKey(runId)).pipe(
    Effect.flatMap((body) => {
      if (!body) {
        return Effect.succeed([])
      }

      return decodeDigestList(new TextDecoder().decode(body)).pipe(
        Effect.mapError(
          (cause) => new BlobStoreError(`blob references for ${runId} are unreadable`, cause),
        ),
      )
    }),
  )
}

function writeRunDigests(
  bytes: BlobBytes,
  runId: string,
  digests: ReadonlyArray<string>,
): Effect.Effect<void, BlobStoreError> {
  return bytes.write(runKey(runId), new TextEncoder().encode(JSON.stringify(digests)))
}
