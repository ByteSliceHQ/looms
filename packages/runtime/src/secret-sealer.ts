import { Data, Effect, Schema } from 'effect'

import { SecretContextSchema } from '@looms/core'

import type { SecretSealer } from './run-secrets'

export interface SecretSealerOptions {
  /** The key new records are sealed with. At least 32 characters of high-entropy text. */
  readonly key: string
  /** Keys that older records may still be sealed with. They open records and never seal them. */
  readonly previousKeys?: ReadonlyArray<string>
}

/** A record could not be sealed or opened. The message never includes secret values. */
export class SecretSealError extends Data.TaggedError('SecretSealError')<{
  readonly message: string
}> {}

interface SealingKey {
  readonly id: string
  readonly key: CryptoKey
}

const MIN_KEY_LENGTH = 32
const VERSION = 'v1'
const encoder = new TextEncoder()
const decoder = new TextDecoder()
const SecretsJson = Schema.fromJsonString(SecretContextSchema)
const decodeSecrets = Schema.decodeUnknownEffect(SecretsJson)
const encodeSecrets = Schema.encodeSync(SecretsJson)

const failed = (message: string) => () => new SecretSealError({ message })

function bytes(text: string): Uint8Array<ArrayBuffer> {
  const encoded = encoder.encode(text)
  const copy = new Uint8Array(new ArrayBuffer(encoded.length))
  copy.set(encoded)
  return copy
}

function toBase64Url(value: ArrayBuffer | Uint8Array): string {
  const view = value instanceof Uint8Array ? value : new Uint8Array(value)
  let binary = ''

  for (const byte of view) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function fromBase64Url(value: string): Effect.Effect<Uint8Array<ArrayBuffer>, SecretSealError> {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    return Effect.fail(new SecretSealError({ message: 'The sealed record is malformed' }))
  }

  const binary = atob(value.replaceAll('-', '+').replaceAll('_', '/'))
  const out = new Uint8Array(new ArrayBuffer(binary.length))

  for (let index = 0; index < binary.length; index += 1) {
    out[index] = binary.charCodeAt(index)
  }

  return Effect.succeed(out)
}

function hkdf(info: string) {
  return {
    name: 'HKDF',
    hash: 'SHA-256',
    salt: new Uint8Array(new ArrayBuffer(0)),
    info: bytes(info),
  }
}

/** Derives the encryption key and a public id for it, so a record names the key that sealed it. */
function derive(secret: string): Effect.Effect<SealingKey, SecretSealError> {
  const fail = failed('The sealing key could not be derived')

  return Effect.gen(function* () {
    const material = yield* Effect.tryPromise({
      try: () =>
        crypto.subtle.importKey('raw', bytes(secret), 'HKDF', false, ['deriveBits', 'deriveKey']),
      catch: fail,
    })

    const id = yield* Effect.tryPromise({
      try: () => crypto.subtle.deriveBits(hkdf('looms/run-secrets/v1/id'), material, 64),
      catch: fail,
    })

    const key = yield* Effect.tryPromise({
      try: () =>
        crypto.subtle.deriveKey(
          hkdf('looms/run-secrets/v1/key'),
          material,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt'],
        ),
      catch: fail,
    })

    return { id: toBase64Url(id), key }
  })
}

/**
 * Seals what a run holds with AES-256-GCM, under a key derived from `key`. The run id is
 * authenticated with each record, so a record copied to another run does not open.
 *
 * This protects a copy of the storage that leaves without the key, such as a backup or an
 * export. It does not protect against code that runs in the host, which has the key.
 */
export function secretSealer(options: SecretSealerOptions): SecretSealer {
  const secrets = [options.key, ...(options.previousKeys ?? [])]

  if (secrets.some((secret) => secret.length < MIN_KEY_LENGTH)) {
    throw new Error(`A secret sealing key needs at least ${MIN_KEY_LENGTH} characters`)
  }

  let derived: Promise<ReadonlyArray<SealingKey>> | undefined

  // Derived on first use and kept: deriving is the expensive part of every seal and open.
  const keys = Effect.tryPromise({
    try: () => {
      derived ??= Effect.runPromise(Effect.forEach(secrets, derive))
      return derived
    },
    catch: failed('The sealing key could not be derived'),
  })

  return {
    seal: (runId, secretContext) =>
      Effect.gen(function* () {
        const [current] = yield* keys

        if (!current) {
          return yield* new SecretSealError({ message: 'No sealing key' })
        }

        const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)))

        const sealed = yield* Effect.tryPromise({
          try: () =>
            crypto.subtle.encrypt(
              { name: 'AES-GCM', iv, additionalData: bytes(runId) },
              current.key,
              bytes(encodeSecrets(secretContext)),
            ),
          catch: failed('The secrets could not be sealed'),
        })

        return [VERSION, current.id, toBase64Url(iv), toBase64Url(sealed)].join('.')
      }),

    open: (runId, sealed) =>
      Effect.gen(function* () {
        const [version, id, iv, body] = sealed.split('.')

        if (version !== VERSION || !id || !iv || !body) {
          return yield* new SecretSealError({ message: 'The sealed record is malformed' })
        }

        const match = (yield* keys).find((candidate) => candidate.id === id)

        if (!match) {
          return yield* new SecretSealError({
            message: 'The sealed record was sealed with a key this runtime does not have',
          })
        }

        const nonce = yield* fromBase64Url(iv)
        const ciphertext = yield* fromBase64Url(body)

        const opened = yield* Effect.tryPromise({
          try: () =>
            crypto.subtle.decrypt(
              { name: 'AES-GCM', iv: nonce, additionalData: bytes(runId) },
              match.key,
              ciphertext,
            ),
          catch: failed('The sealed record does not open for this run with this key'),
        })

        return yield* decodeSecrets(decoder.decode(opened)).pipe(
          Effect.mapError(failed('The sealed record is malformed')),
        )
      }),
  }
}
