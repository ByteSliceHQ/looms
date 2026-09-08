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
