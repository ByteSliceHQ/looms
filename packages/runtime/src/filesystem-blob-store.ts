import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'

import { Data, Effect, Predicate } from 'effect'

import { blobStoreFromBytes, BlobStoreError, type BlobBytes, type BlobStore } from '@looms/core'

class MissingBlobFile extends Data.TaggedError('MissingBlobFile') {}

/**
 * Content-addressed blob store rooted at `directory`. For Bun and Node hosts.
 * A Durable Object should use `r2BlobStore` instead. One directory should have one writer.
 */
export function filesystemBlobStore(directory: string): BlobStore {
  return blobStoreFromBytes(filesystemBlobBytes(directory))
}

function filesystemBlobBytes(directory: string): BlobBytes {
  return {
    read: (key) => readOptional(`${directory}/${key}`, key),

    write: (key, body) =>
      Effect.tryPromise({
        try: () => mkdir(`${directory}/${folderOf(key)}`, { recursive: true }),
        catch: (cause) =>
          new BlobStoreError(`Unable to create a directory for blob key ${key}`, cause),
      }).pipe(
        Effect.andThen(
          Effect.tryPromise({
            try: () => writeFile(`${directory}/${key}`, body),
            catch: (cause) => new BlobStoreError(`Unable to write blob key ${key}`, cause),
          }),
        ),
      ),

    remove: (key) =>
      Effect.tryPromise({
        try: () => rm(`${directory}/${key}`, { force: true }),
        catch: (cause) => new BlobStoreError(`Unable to delete blob key ${key}`, cause),
      }),

    list: (prefix) => listFolder(directory, prefix),
  }
}

function readOptional(path: string, key: string): Effect.Effect<Uint8Array | null, BlobStoreError> {
  return Effect.tryPromise({
    try: () => readFile(path),
    catch: (cause): BlobStoreError | MissingBlobFile =>
      isMissingFile(cause)
        ? new MissingBlobFile()
        : new BlobStoreError(`Unable to read blob key ${key}`, cause),
  }).pipe(
    Effect.catchTag('MissingBlobFile', () => Effect.succeed(null)),
    Effect.map((body) => (body === null ? null : new Uint8Array(body))),
  )
}

function listFolder(
  directory: string,
  prefix: string,
): Effect.Effect<ReadonlyArray<string>, BlobStoreError> {
  const folder = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix

  return Effect.tryPromise({
    try: () => readdir(`${directory}/${folder}`),
    catch: (cause): BlobStoreError | MissingBlobFile =>
      isMissingFile(cause)
        ? new MissingBlobFile()
        : new BlobStoreError(`Unable to list blob keys ${prefix}`, cause),
  }).pipe(
    Effect.catchTag('MissingBlobFile', () => Effect.succeed([])),
    Effect.map((names) => names.map((name) => `${folder}/${name}`)),
  )
}

function folderOf(key: string): string {
  const slash = key.lastIndexOf('/')

  return slash < 0 ? '' : key.slice(0, slash)
}

function isMissingFile(cause: unknown): boolean {
  return Predicate.isObject(cause) && 'code' in cause && cause.code === 'ENOENT'
}
