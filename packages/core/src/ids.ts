let counter = 0

function token(): string {
  counter += 1
  return `${Date.now().toString(36)}_${counter.toString(36)}_${Math.random().toString(36).slice(2, 8)}`
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

export function createWaitId(): string {
  return `wait_${token()}`
}

export function createEffectId(threadId: string, causingSeq: number, index: number): string {
  return `${threadId}:${causingSeq}:${index}`
}

export function parseEffectId(
  effectId: string,
): { threadId: string; causingSeq: number; index: number } | null {
  const last = effectId.lastIndexOf(':')
  const second = last > 0 ? effectId.lastIndexOf(':', last - 1) : -1
  if (last <= 0 || second < 0) return null
  const causingSeq = Number(effectId.slice(second + 1, last))
  const index = Number(effectId.slice(last + 1))
  if (!Number.isFinite(causingSeq) || !Number.isFinite(index)) return null
  return { threadId: effectId.slice(0, second), causingSeq, index }
}
