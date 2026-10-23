import { Effect, Predicate, Schema } from 'effect'

import {
  BlobStoreError,
  isSha256Digest,
  sha256Hex,
  type BlobStore,
  type BlobStoreFailure,
} from './blob-store'
import { utf8JsonBytes } from './limits'
import { isJsonObject, type JsonValue } from './types'

export const DEFAULT_BLOB_THRESHOLD_BYTES = 64 * 1024

const BLOB_KIND = 'blob'
const BLOB_MEDIA_TYPE = 'application/json'
const decodeJsonText = Schema.decodeUnknownEffect(Schema.fromJsonString(Schema.Json))

/**
 * Reserved stored shape. A JSON object with exactly these fields is a claim check,
 * not caller data. `bytes` is the UTF-8 length of the JSON body named by `sha256`.
 */
export interface BlobRef {
  readonly $looms: typeof BLOB_KIND
  readonly sha256: string
  readonly bytes: number
  readonly mediaType: typeof BLOB_MEDIA_TYPE
  readonly [key: string]: JsonValue
}

export function isBlobRef(value: JsonValue): value is BlobRef {
  if (!isJsonObject(value) || Object.keys(value).length !== 4) {
    return false
  }

  const kind = value.$looms
  const sha256 = value.sha256
  const bytes = value.bytes
  const mediaType = value.mediaType

  return (
    kind === BLOB_KIND &&
    Predicate.isString(sha256) &&
    isSha256Digest(sha256) &&
    Predicate.isNumber(bytes) &&
    Number.isInteger(bytes) &&
    bytes >= 0 &&
    mediaType === BLOB_MEDIA_TYPE
  )
}

export interface OffloadJsonOptions {
  readonly thresholdBytes?: number
  /** When false, the root value stays inline even if it is over the threshold. Children are still claimed. */
  readonly claimRoot?: boolean
}

/** Store `value` and return a reference, even when it is under the offload threshold. */
export function claimJson(
  value: JsonValue,
  blobs: BlobStore,
): Effect.Effect<BlobRef, BlobStoreFailure> {
  return putJson(value, blobs)
}

/** Replace values larger than `thresholdBytes` with {@link BlobRef}s. Bodies are stored by hash. */
export function offloadJson(
  value: JsonValue,
  blobs: BlobStore,
  options?: OffloadJsonOptions,
): Effect.Effect<JsonValue, BlobStoreFailure> {
  const thresholdBytes = options?.thresholdBytes ?? DEFAULT_BLOB_THRESHOLD_BYTES

  return offloadNode(value, blobs, thresholdBytes, options?.claimRoot ?? true)
}

/** Replace {@link BlobRef}s with the JSON they name, including references nested inside a body. */
export function resolveJson(
  value: JsonValue,
  blobs: BlobStore,
): Effect.Effect<JsonValue, BlobStoreFailure> {
  return resolveNode(value, blobs, new Set())
}

/**
 * Digests named by `value`, plus digests nested inside those bodies.
 * A parent blob that itself contains references still keeps those bodies alive.
 */
export function expandBlobDigests(
  blobs: BlobStore,
  seeds: ReadonlySet<string>,
): Effect.Effect<ReadonlySet<string>, BlobStoreFailure> {
  if (seeds.size === 0) {
    return Effect.succeed(new Set())
  }

  return Effect.gen(function* () {
    const all = new Set<string>()
    const pending = [...seeds]

    while (pending.length > 0) {
      const digest = pending.pop()

      if (digest === undefined || all.has(digest)) {
        continue
      }

      all.add(digest)

      const body = yield* blobs.get(digest)
      const json = yield* decodeBody(body)
      const nested = new Set<string>()

      collectBlobDigests(json, nested)

      for (const child of nested) {
        if (!all.has(child)) {
          pending.push(child)
        }
      }
    }

    return all
  })
}

/** Record every blob digest embedded in `value`. Does not read blob bodies. */
export function collectBlobDigests(value: JsonValue, into: Set<string>): void {
  if (isBlobRef(value)) {
    into.add(value.sha256)
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectBlobDigests(item, into)
    }

    return
  }

  if (isJsonObject(value)) {
    for (const child of Object.values(value)) {
      collectBlobDigests(child, into)
    }
  }
}

function offloadNode(
  value: JsonValue,
  blobs: BlobStore,
  thresholdBytes: number,
  claim: boolean,
): Effect.Effect<JsonValue, BlobStoreFailure> {
  if (isBlobRef(value)) {
    return Effect.succeed(value)
  }

  if (Array.isArray(value)) {
    return Effect.forEach(value, (item) => offloadNode(item, blobs, thresholdBytes, true)).pipe(
      Effect.flatMap((items) => storeIfOver(items, blobs, thresholdBytes, claim)),
    )
  }

  if (isJsonObject(value)) {
    return offloadObject(value, blobs, thresholdBytes, claim)
  }

  return storeIfOver(value, blobs, thresholdBytes, claim)
}

function offloadObject(
  value: { readonly [key: string]: JsonValue },
  blobs: BlobStore,
  thresholdBytes: number,
  claim: boolean,
): Effect.Effect<JsonValue, BlobStoreFailure> {
  return Effect.gen(function* () {
    const next: { [key: string]: JsonValue } = {}

    for (const key of Object.keys(value)) {
      const child = value[key]

      if (child === undefined) {
        continue
      }

      next[key] = yield* offloadNode(child, blobs, thresholdBytes, true)
    }

    return yield* storeIfOver(next, blobs, thresholdBytes, claim)
  })
}

function storeIfOver(
  value: JsonValue,
  blobs: BlobStore,
  thresholdBytes: number,
  claim: boolean,
): Effect.Effect<JsonValue, BlobStoreFailure> {
  // Strings only. Objects and arrays stay in place so schema-shaped snapshot state still decodes.
  // An event that is still over the byte limit claims its whole payload afterward.
  if (!claim || !Predicate.isString(value) || utf8JsonBytes(value) <= thresholdBytes) {
    return Effect.succeed(value)
  }

  return putJson(value, blobs)
}

function putJson(value: JsonValue, blobs: BlobStore): Effect.Effect<BlobRef, BlobStoreFailure> {
  const body = new TextEncoder().encode(JSON.stringify(value))

  return sha256Hex(body).pipe(
    Effect.flatMap((sha256) =>
      blobs.put(sha256, body).pipe(
        Effect.map((): BlobRef => ({
          $looms: BLOB_KIND,
          sha256,
          bytes: body.byteLength,
          mediaType: BLOB_MEDIA_TYPE,
        })),
      ),
    ),
  )
}

function resolveNode(
  value: JsonValue,
  blobs: BlobStore,
  seen: ReadonlySet<string>,
): Effect.Effect<JsonValue, BlobStoreFailure> {
  if (isBlobRef(value)) {
    if (seen.has(value.sha256)) {
      return Effect.fail(new BlobStoreError(`blob ${value.sha256} refers to itself`))
    }

    const next = new Set(seen)
    next.add(value.sha256)

    return blobs.get(value.sha256).pipe(
      Effect.flatMap((body) => decodeBody(body)),
      Effect.flatMap((decoded) => resolveNode(decoded, blobs, next)),
    )
  }

  if (Array.isArray(value)) {
    return Effect.forEach(value, (item) => resolveNode(item, blobs, seen))
  }

  if (isJsonObject(value)) {
    return resolveObject(value, blobs, seen)
  }

  return Effect.succeed(value)
}

function resolveObject(
  value: { readonly [key: string]: JsonValue },
  blobs: BlobStore,
  seen: ReadonlySet<string>,
): Effect.Effect<JsonValue, BlobStoreFailure> {
  return Effect.gen(function* () {
    const next: { [key: string]: JsonValue } = {}

    for (const key of Object.keys(value)) {
      const child = value[key]

      if (child === undefined) {
        continue
      }

      next[key] = yield* resolveNode(child, blobs, seen)
    }

    return next
  })
}

function decodeBody(body: Uint8Array): Effect.Effect<JsonValue, BlobStoreError> {
  return decodeJsonText(new TextDecoder().decode(body)).pipe(
    Effect.mapError((cause) => new BlobStoreError('blob body is not JSON', cause)),
  )
}
