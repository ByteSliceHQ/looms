import { Data, Effect, Option, Schema } from 'effect'

import { authAllowed, authDenied, type AuthDecision, type Authorize, type RouteInfo } from './auth'

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

const unauthorized = authDenied(401, 'Unauthorized')
const forbidden = authDenied(403, 'Forbidden')

const GrantPayloadSchema = Schema.Struct({
  v: Schema.Literal(1),
  runId: Schema.String,
  principal: Schema.String,
  access: Schema.Literal('read'),
  exp: Schema.Finite,
})

const GrantPayloadJson = Schema.fromJsonString(GrantPayloadSchema)
const encodeGrantPayload = Schema.encodeSync(GrantPayloadJson)
const decodeGrantPayload = Schema.decodeUnknownOption(GrantPayloadJson)

export type GrantFailure = 'malformed' | 'signature' | 'expired' | 'claims'

export class GrantError extends Data.TaggedError('GrantError')<{
  readonly reason: GrantFailure
}> {}

/** Claims carried by a run grant. `exp` is an exclusive expiry in Unix milliseconds. */
export interface RunGrant {
  readonly runId: string
  readonly principal: string
  readonly access: 'read'
  readonly exp: number
}

export interface GrantAuthOptions {
  readonly secret: string
  /** Clock used for expiry. Defaults to `Date.now`. */
  readonly now?: () => number
  /**
   * Extra time after `exp` that still verifies. Covers clock skew between the issuer and the host.
   * Defaults to 0.
   */
  readonly clockSkewMs?: number
}

interface GrantPayload {
  readonly v: 1
  readonly runId: string
  readonly principal: string
  readonly access: 'read'
  readonly exp: number
}

/**
 * Signs a read grant for one run. The token is URL-safe and is also a legal WebSocket subprotocol
 * value, so a browser can send it as a query parameter or as `Sec-WebSocket-Protocol`.
 */
export function issueRunGrant(secret: string, claims: RunGrant): Effect.Effect<string, GrantError> {
  return Effect.gen(function* () {
    const payload = grantPayload(claims)

    if (!payload) {
      return yield* new GrantError({ reason: 'claims' })
    }

    const json = yield* Effect.try({
      try: () => encodeGrantPayload(payload),
      catch: () => new GrantError({ reason: 'claims' }),
    })

    const encoded = encodeBase64Url(textEncoder.encode(json))
    const key = yield* importHmacKey(secret)

    const signature = yield* Effect.tryPromise({
      try: () => crypto.subtle.sign('HMAC', key, textEncoder.encode(encoded)),
      catch: () => new GrantError({ reason: 'signature' }),
    })

    return `v1.${encoded}.${encodeBase64Url(new Uint8Array(signature))}`
  })
}

/** Verifies the HMAC and expiry. A grant for another run fails later, when a route is checked. */
export function verifyRunGrant(
  secret: string,
  token: string,
  now: number,
  clockSkewMs = 0,
): Effect.Effect<RunGrant, GrantError> {
  return Effect.gen(function* () {
    const parts = token.split('.')

    if (parts.length !== 3 || parts[0] !== 'v1') {
      return yield* new GrantError({ reason: 'malformed' })
    }

    const encoded = parts[1] ?? ''
    const signature = decodeBase64Url(parts[2] ?? '')
    const payloadBytes = decodeBase64Url(encoded)

    if (!signature || !payloadBytes) {
      return yield* new GrantError({ reason: 'malformed' })
    }

    const key = yield* importHmacKey(secret)

    const authentic = yield* Effect.tryPromise({
      try: () => crypto.subtle.verify('HMAC', key, signature, textEncoder.encode(encoded)),
      catch: () => new GrantError({ reason: 'signature' }),
    })

    if (!authentic) {
      return yield* new GrantError({ reason: 'signature' })
    }

    const decoded = decodeGrantPayload(textDecoder.decode(payloadBytes))

    if (
      Option.isNone(decoded) ||
      decoded.value.runId.length === 0 ||
      decoded.value.principal.length === 0
    ) {
      return yield* new GrantError({ reason: 'claims' })
    }

    const skew = finiteSkew(clockSkewMs)

    if (decoded.value.exp <= now - skew) {
      return yield* new GrantError({ reason: 'expired' })
    }

    return {
      runId: decoded.value.runId,
      principal: decoded.value.principal,
      access: decoded.value.access,
      exp: decoded.value.exp,
    }
  })
}

/**
 * Authorizes a read of the granted run. The token comes from the `grant` query parameter, or, when
 * that is absent, from a `v1.` WebSocket subprotocol. Writes, worker callbacks, operations, and
 * reads of any other run are refused. A host that accepts the subprotocol has to echo it on the
 * WebSocket response; see `grantSubprotocol`.
 */
export function grantAuth(options: GrantAuthOptions): Authorize {
  const now = options.now ?? Date.now
  const skew = finiteSkew(options.clockSkewMs)

  return (request, route) =>
    Effect.gen(function* () {
      const token = runGrantToken(request)

      if (token === undefined) {
        return unauthorized
      }

      return yield* verifyRunGrant(options.secret, token, now(), skew).pipe(
        Effect.map((grant) => grantDecision(grant, route)),
        Effect.catchTag('GrantError', () => Effect.succeed(unauthorized)),
      )
    })
}

/** The grant token on this request, if the client sent one. */
export function runGrantToken(request: Request): string | undefined {
  const query = new URL(request.url).searchParams.get('grant')

  if (query) {
    return query
  }

  return grantSubprotocol(request)
}

/**
 * The `v1.` grant the client offered as a WebSocket subprotocol. The upgrade response must echo it,
 * or the browser fails the handshake.
 */
export function grantSubprotocol(request: Request): string | undefined {
  return websocketGrant(request.headers.get('sec-websocket-protocol'))
}

function grantDecision(grant: RunGrant, route: RouteInfo): AuthDecision {
  if (route.access !== 'read' || route.runId !== grant.runId) {
    return forbidden
  }

  return authAllowed
}

function grantPayload(claims: RunGrant): GrantPayload | undefined {
  if (claims.runId.length === 0 || claims.principal.length === 0 || !Number.isFinite(claims.exp)) {
    return undefined
  }

  return {
    v: 1,
    runId: claims.runId,
    principal: claims.principal,
    access: 'read',
    exp: claims.exp,
  }
}

function finiteSkew(clockSkewMs: number | undefined): number {
  if (clockSkewMs === undefined || !Number.isFinite(clockSkewMs) || clockSkewMs < 0) {
    return 0
  }

  return clockSkewMs
}

function websocketGrant(header: string | null): string | undefined {
  if (header === null) {
    return undefined
  }

  for (const part of header.split(',')) {
    const protocol = part.trim()

    if (protocol.startsWith('v1.')) {
      return protocol
    }
  }

  return undefined
}

function importHmacKey(secret: string): Effect.Effect<CryptoKey, GrantError> {
  return Effect.tryPromise({
    try: () =>
      crypto.subtle.importKey(
        'raw',
        textEncoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify'],
      ),
    catch: () => new GrantError({ reason: 'signature' }),
  })
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  let encoded = btoa(binary).replaceAll('+', '-').replaceAll('/', '_')

  while (encoded.endsWith('=')) {
    encoded = encoded.slice(0, -1)
  }

  return encoded
}

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> | undefined {
  if (value.length === 0 || value.length % 4 === 1 || !/^[A-Za-z0-9_-]+$/.test(value)) {
    return undefined
  }

  const padded = value + '='.repeat((4 - (value.length % 4)) % 4)
  const binary = atob(padded.replaceAll('-', '+').replaceAll('_', '/'))
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}
