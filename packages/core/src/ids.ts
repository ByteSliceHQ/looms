import { DateTime, Predicate } from 'effect'

let counter = 0

function token(): string {
  counter += 1
  const timestamp = DateTime.toEpochMillis(DateTime.nowUnsafe())
  // Synchronous ID factories need process-independent entropy without an Effect runtime.
  // oxlint-disable-next-line effecttsgo/crypto-random-uuid
  const entropy = globalThis.crypto.randomUUID().replaceAll('-', '')
  return `${timestamp.toString(36)}_${counter.toString(36)}_${entropy}`
}

export function createEventId(): string {
  return `evt_${token()}`
}

export function createRunId(): string {
  return `run_${token()}`
}

export function createThreadId(): string {
  return `thr_${token()}`
}

function fnv1a32(value: string, seed: number): string {
  let hash = seed >>> 0

  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }

  return (hash >>> 0).toString(16).padStart(8, '0')
}

/**
 * A UUID-shaped id derived only from `parts`, so a reducer that replays the same events names the same
 * child thread every time.
 */
export function deterministicThreadId(...parts: readonly (string | number)[]): string {
  const source = parts.join(':')
  let reversed = ''

  for (let index = source.length - 1; index >= 0; index--) {
    reversed += source.charAt(index)
  }

  const hex = [
    fnv1a32(source, 0x811c9dc5),
    fnv1a32(source, 0x9e3779b9),
    fnv1a32(reversed, 0x85ebca6b),
    fnv1a32(reversed, 0xc2b2ae35),
  ].join('')

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${(
    (Number.parseInt(hex.slice(16, 18), 16) & 0x3f) |
    0x80
  )
    .toString(16)
    .padStart(2, '0')}${hex.slice(18, 20)}-${hex.slice(20)}`
}

export function createWaitId(scope?: string, tag?: string | number): string {
  if (scope !== undefined && tag !== undefined) {
    return `wait_${scope}_${tag}`
  }

  if (scope !== undefined) {
    return `wait_${scope}_${token()}`
  }

  return `wait_${token()}`
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
