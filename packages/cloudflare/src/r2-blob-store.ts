import { Effect } from 'effect'

import { blobStoreFromBytes, BlobStoreError, type BlobBytes, type BlobStore } from '@looms/core'

const PREFIX = 'looms/blobs/'

export interface R2ObjectBodyLike {
  arrayBuffer(): Promise<ArrayBuffer>
}

export interface R2ListResult {
  readonly objects: ReadonlyArray<{ readonly key: string }>
  readonly truncated: boolean
  readonly cursor?: string
}

/**
 * Structural subset of a Cloudflare `R2Bucket` binding. An `R2Bucket` satisfies it.
 */
export interface R2StoredObject {
  readonly key: string
}

export interface R2BucketLike {
  put(key: string, value: Uint8Array): Promise<R2StoredObject>
  get(key: string): Promise<R2ObjectBodyLike | null>
  delete(key: string): Promise<void>
  list(options?: { prefix?: string; cursor?: string }): Promise<R2ListResult>
}

/**
 * Content-addressed blob store in R2 under `looms/blobs/`.
 * Reference counting is local to this bucket. Give one store one writer: two Durable
 * Objects deleting the same hash at the same time can remove a body the other still needs.
 */
export function r2BlobStore(bucket: R2BucketLike): BlobStore {
  return blobStoreFromBytes(r2BlobBytes(bucket))
}

function r2BlobBytes(bucket: R2BucketLike): BlobBytes {
  const keyFor = (key: string) => `${PREFIX}${key}`

  return {
    read: (key) =>
      Effect.tryPromise({
        try: () => bucket.get(keyFor(key)),
        catch: (cause) => new BlobStoreError(`Unable to read blob key ${key}`, cause),
      }).pipe(
        Effect.flatMap((object) => {
          if (!object) {
            return Effect.succeed(null)
          }

          return Effect.tryPromise({
            try: () => object.arrayBuffer(),
            catch: (cause) => new BlobStoreError(`Unable to read blob key ${key}`, cause),
          }).pipe(Effect.map((buffer) => new Uint8Array(buffer)))
        }),
      ),

    write: (key, body) =>
      Effect.tryPromise({
        try: () => bucket.put(keyFor(key), body),
        catch: (cause) => new BlobStoreError(`Unable to write blob key ${key}`, cause),
      }).pipe(Effect.asVoid),

    remove: (key) =>
      Effect.tryPromise({
        try: () => bucket.delete(keyFor(key)),
        catch: (cause) => new BlobStoreError(`Unable to delete blob key ${key}`, cause),
      }).pipe(Effect.asVoid),

    list: (prefix) => listPrefixed(bucket, `${PREFIX}${prefix}`),
  }
}

function listPrefixed(
  bucket: R2BucketLike,
  prefix: string,
): Effect.Effect<ReadonlyArray<string>, BlobStoreError> {
  return Effect.gen(function* () {
    const keys: string[] = []
    let cursor: string | undefined

    for (;;) {
      const page = yield* Effect.tryPromise({
        try: () =>
          cursor === undefined ? bucket.list({ prefix }) : bucket.list({ prefix, cursor }),
        catch: (cause) => new BlobStoreError(`Unable to list blob keys ${prefix}`, cause),
      })

      for (const object of page.objects) {
        keys.push(object.key.slice(PREFIX.length))
      }

      if (!page.truncated || page.cursor === undefined || page.cursor === cursor) {
        return keys
      }

      cursor = page.cursor
    }
  })
}
