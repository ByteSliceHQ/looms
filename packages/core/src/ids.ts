import { sha256 } from '@noble/hashes/sha2.js'
import { Data, DateTime, Predicate } from 'effect'

/** The ids a format draws fresh: one per event, run, thread, or wait. */
export type DrawnIdKind = 'event' | 'run' | 'thread' | 'wait'

/** The ids a format derives from parts, so replay names the same child every time. */
export type DerivedIdKind = 'run' | 'thread'

export type IdPart = string | number

/**
 * How a process names events, runs, threads, and waits. The default is {@link typeIds}.
 *
 * Two rules hold for every id a format returns:
 *
 * - It is a non-empty string.
 * - It contains no `:`. Effect ids are `<threadId>:<tag>`.
 *
 * `derive` must also be a pure function of `kind` and `parts`: reducers call it on every replay
 * and must name the same child each time. Looms cannot check this.
 */
export interface LoomsIds {
  /** A fresh id that no earlier call returned. */
  create(kind: DrawnIdKind): string
  /** The same id for the same `kind` and `parts`, on every call, in every process. */
  derive(kind: DerivedIdKind, parts: readonly IdPart[]): string
}

export class InvalidIdFormatError extends Data.TaggedError('InvalidIdFormatError')<{
  readonly message: string
  readonly rule: 'non-empty' | 'no-colon'
  readonly id: unknown
}> {}

const TYPEID_PREFIX = {
  event: 'evt',
  run: 'run',
  thread: 'thr',
  wait: 'wait',
} as const satisfies Record<DrawnIdKind, string>

const CROCKFORD = '0123456789abcdefghjkmnpqrstvwxyz'

/** The 26-character TypeID suffix for a UUID's 16 bytes: 128 bits, left-padded to 130. */
export function encodeTypeIdSuffix(uuid: Uint8Array): string {
  if (uuid.length !== 16) {
    throw new RangeError(`A TypeID suffix encodes 16 bytes, got ${uuid.length}`)
  }

  let value = 0n

  for (const byte of uuid) {
    value = (value << 8n) | BigInt(byte)
  }

  let suffix = ''

  for (let index = 0; index < 26; index++) {
    suffix = CROCKFORD.charAt(Number(value & 31n)) + suffix
    value >>= 5n
  }

  return suffix
}

/** `<prefix>_<suffix>` for a UUID's 16 bytes, per TypeID 0.3. */
export function typeId(prefix: string, uuid: Uint8Array): string {
  return `${prefix}_${encodeTypeIdSuffix(uuid)}`
}

const RANDOM_BYTES = 10

let lastTimestamp = -1
const lastRandom = new Uint8Array(RANDOM_BYTES)

/** How many bits of each `lastRandom` byte the UUID carries: 4 + 8 for rand_a, 6 + 56 for rand_b. */
const RANDOM_MASKS = [0x0f, 0xff, 0x3f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff] as const

function drawRandom(): void {
  globalThis.crypto.getRandomValues(lastRandom)
  lastRandom[2] = lastRandom[2]! & 0x3f
  // Clear the top bit so a burst within one millisecond has room to count up.
  lastRandom[0] = lastRandom[0]! & 0x07
}

/** Add one to the 74 random bits. Returns false when they wrap. */
function incrementRandom(): boolean {
  for (let index = RANDOM_BYTES - 1; index >= 0; index--) {
    lastRandom[index] = (lastRandom[index]! + 1) & RANDOM_MASKS[index]!

    if (lastRandom[index] !== 0) {
      return true
    }
  }

  return false
}

/**
 * UUIDv7 bytes (RFC 9562): a 48-bit millisecond timestamp, then random bits. Ids drawn in the same
 * millisecond, or after the clock steps back, increment the previous random bits (section 6.2,
 * method 2), so every id this process draws sorts after the one before it.
 */
export function uuidV7(): Uint8Array {
  const now = DateTime.toEpochMillis(DateTime.nowUnsafe())

  if (now > lastTimestamp) {
    lastTimestamp = now
    drawRandom()
  } else if (!incrementRandom()) {
    lastTimestamp += 1
    drawRandom()
  }

  const bytes = new Uint8Array(16)
  let timestamp = lastTimestamp

  for (let index = 5; index >= 0; index--) {
    bytes[index] = timestamp % 256
    timestamp = Math.floor(timestamp / 256)
  }

  bytes[6] = 0x70 | lastRandom[0]!
  bytes[7] = lastRandom[1]!
  bytes[8] = 0x80 | lastRandom[2]!
  bytes.set(lastRandom.subarray(3), 9)
  return bytes
}

const encoder = new TextEncoder()

/**
 * UUIDv8 bytes whose 122 free bits are the leading bits of SHA-256 over `kind` and `parts`. Parts
 * are hashed as JSON, so `['a:b', 'c']` and `['a', 'b:c']` differ, and so do `1` and `'1'`.
 */
function derivedUuid(kind: DerivedIdKind, parts: readonly IdPart[]): Uint8Array {
  const bytes = sha256(encoder.encode(`${kind}\n${JSON.stringify(parts)}`)).slice(0, 16)
  bytes[6] = 0x80 | (bytes[6]! & 0x0f)
  bytes[8] = 0x80 | (bytes[8]! & 0x3f)
  return bytes
}

/**
 * The default id format: [TypeID](https://github.com/jetify-com/typeid) 0.3. Ids are `evt_`,
 * `run_`, `thr_`, or `wait_` followed by 26 characters. Drawn ids carry a UUIDv7 and sort by
 * creation time within a process; derived ids carry a UUIDv8 hashed from their parts.
 */
export const typeIds: LoomsIds = {
  create: (kind) => typeId(TYPEID_PREFIX[kind], uuidV7()),
  derive: (kind, parts) => typeId(TYPEID_PREFIX[kind], derivedUuid(kind, parts)),
}

function checkId(id: string, source: string): string {
  if (!Predicate.isString(id) || id.length === 0) {
    throw new InvalidIdFormatError({
      rule: 'non-empty',
      id,
      message: `Invalid id format: ${source} must return a non-empty string, got ${JSON.stringify(id)}`,
    })
  }

  if (id.includes(':')) {
    throw new InvalidIdFormatError({
      rule: 'no-colon',
      id,
      message: `Invalid id format: ${source} returned ${JSON.stringify(id)}, which contains ":". Ids must not contain ":" because effect ids are "<threadId>:<tag>"`,
    })
  }

  return id
}

const checked = new WeakSet<LoomsIds>([typeIds])

const DRAWN_KINDS = ['event', 'run', 'thread', 'wait'] as const
const DERIVED_KINDS = ['run', 'thread'] as const

/**
 * The format an `ids` option names, or {@link typeIds} without one. A custom format is tried once
 * for every kind here, and every id it returns later is checked against the same rules; a
 * violation throws {@link InvalidIdFormatError}.
 */
export function resolveIds(ids?: LoomsIds): LoomsIds {
  if (ids === undefined) {
    return typeIds
  }

  if (checked.has(ids)) {
    return ids
  }

  const resolved: LoomsIds = {
    create: (kind) => checkId(ids.create(kind), `ids.create('${kind}')`),
    derive: (kind, parts) => checkId(ids.derive(kind, parts), `ids.derive('${kind}', parts)`),
  }

  for (const kind of DRAWN_KINDS) {
    resolved.create(kind)
  }

  for (const kind of DERIVED_KINDS) {
    resolved.derive(kind, ['looms', 0])
  }

  checked.add(resolved)
  return resolved
}

/** A fresh event id in the default format. A configured format is `ids.create('event')`. */
export function createEventId(): string {
  return typeIds.create('event')
}

/** A fresh run id in the default format. A configured format is `ids.create('run')`. */
export function createRunId(): string {
  return typeIds.create('run')
}

/** A fresh thread id in the default format. A configured format is `ids.create('thread')`. */
export function createThreadId(): string {
  return typeIds.create('thread')
}

/**
 * A stable run id in the default format, so a retry launches the same child run. A configured
 * format is `ctx.ids.derive('run', parts)`.
 */
export function deterministicRunId(...parts: readonly IdPart[]): string {
  return typeIds.derive('run', parts)
}

/**
 * A thread id in the default format derived only from `parts`, so a reducer that replays the same
 * events names the same child thread every time. A configured format is
 * `ctx.ids.derive('thread', parts)`.
 */
export function deterministicThreadId(...parts: readonly IdPart[]): string {
  return typeIds.derive('thread', parts)
}

/**
 * A wait id. With `scope` and `tag` it is the composed key `wait_<scope>_<tag>` and draws nothing.
 * Without a tag it draws from the default format; a configured format is `ids.create('wait')`.
 */
export function createWaitId(scope?: string, tag?: string | number): string {
  if (scope !== undefined && tag !== undefined) {
    return `wait_${scope}_${tag}`
  }

  if (scope !== undefined) {
    return `wait_${scope}_${encodeTypeIdSuffix(uuidV7())}`
  }

  return typeIds.create('wait')
}

export function createEffectId(
  threadId: string,
  causingSeqOrTag: number | string,
  index?: number,
): string {
  if (Predicate.isString(causingSeqOrTag)) {
    return `${threadId}:${causingSeqOrTag}`
  }

  return `${threadId}:${causingSeqOrTag}:${index ?? 0}`
}

export function parseEffectId(
  effectId: string,
): { threadId: string; causingSeq?: number; tag?: string; index?: number } | null {
  const parts = effectId.split(':')

  if (parts.length < 2) {
    return null
  }

  if (parts.length === 3) {
    const seq = Number(parts[1])
    const idx = Number(parts[2])

    if (Number.isFinite(seq) && Number.isFinite(idx)) {
      return { threadId: parts[0]!, causingSeq: seq, index: idx }
    }
  }

  return {
    threadId: parts[0]!,
    tag: parts.slice(1).join(':'),
  }
}
