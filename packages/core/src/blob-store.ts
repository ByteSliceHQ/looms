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
 * `retain` and `replaceRefs` record which digests a run still needs. A body is
 * deleted only when no run's reference set mentions it. One store should have one writer.
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
  readonly list: (prefix: string) => Effect.Effect<ReadonlyArray<string>, BlobStoreError>
}

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
          return yield* Effect.void
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

    retain: (runId, digests) =>
      Effect.gen(function* () {
        const current = yield* readRunDigests(bytes, runId)
        const next = new Set(current)

        for (const digest of digests) {
          next.add(digest)
        }

        if (next.size === current.length) {
          return
        }

        yield* writeRunDigests(bytes, runId, [...next])
      }),

    replaceRefs: (runId, keep) =>
      Effect.gen(function* () {
        const previous = yield* readRunDigests(bytes, runId)

        yield* writeRunDigests(bytes, runId, [...keep])

        const dropped = previous.filter((digest) => !keep.has(digest))

        if (dropped.length === 0) {
          return
        }

        const referenced = yield* referencedDigests(bytes)

        for (const digest of dropped) {
          if (!referenced.has(digest)) {
            yield* bytes.remove(objectKey(digest))
          }
        }
      }),
  }
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

function referencedDigests(bytes: BlobBytes): Effect.Effect<ReadonlySet<string>, BlobStoreError> {
  return bytes.list('runs/').pipe(
    Effect.flatMap((keys) =>
      Effect.forEach(keys, (key) =>
        bytes.read(key).pipe(
          Effect.flatMap((body) => {
            if (!body) {
              return Effect.succeed([])
            }

            return decodeDigestList(new TextDecoder().decode(body)).pipe(
              Effect.mapError(
                (cause) => new BlobStoreError('blob references are unreadable', cause),
              ),
            )
          }),
        ),
      ),
    ),
    Effect.map((lists) => {
      const digests = new Set<string>()

      for (const list of lists) {
        for (const digest of list) {
          digests.add(digest)
        }
      }

      return digests
    }),
  )
}
