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
