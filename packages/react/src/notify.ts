import { Predicate } from 'effect'

/**
 * How store→subscriber notifications are scheduled after events land.
 *
 * - `adaptive` (default): notify on the next macrotask when the stream is
 *   quiet so UI can tick +1; under burst, coalesce to an animation frame.
 * - `frame`: always at most one notify per animation frame.
 * - `immediate`: notify synchronously on every apply (max granularity).
 * - `{ delayMs }`: debounce-style timer coalesce.
 */
export type CoalesceOption = 'adaptive' | 'frame' | 'immediate' | { delayMs: number }

/** Quiet→burst threshold for `adaptive` coalesce (ms since last notify). */
const ADAPTIVE_BURST_WINDOW_MS = 8

export interface NotifyScheduler {
  schedule: () => void
  flush: () => void
  cancel: () => void
}

function nowMs(): number {
  const perf = globalThis.performance
  return perf !== undefined && Predicate.isFunction(perf.now) ? perf.now() : Date.now()
}

export function createNotifyScheduler(
  coalesce: CoalesceOption,
  onNotify: () => void,
): NotifyScheduler {
  let notifyScheduled = false
  let notifyTimer: ReturnType<typeof setTimeout> | undefined
  let notifyRaf: number | undefined
  let lastNotifyAt = Number.NEGATIVE_INFINITY

  const fire = () => {
    notifyScheduled = false
    notifyTimer = undefined
    notifyRaf = undefined
    lastNotifyAt = nowMs()
    onNotify()
  }

  const scheduleFrame = () => {
    if (Predicate.isFunction(globalThis.requestAnimationFrame)) {
      notifyRaf = requestAnimationFrame(fire)
    } else {
      notifyTimer = setTimeout(fire, 0)
    }
  }

  const cancel = () => {
    if (!notifyScheduled) {
      return
    }

    notifyScheduled = false

    if (notifyTimer !== undefined) {
      clearTimeout(notifyTimer)
      notifyTimer = undefined
    }

    if (notifyRaf !== undefined && Predicate.isFunction(globalThis.cancelAnimationFrame)) {
      cancelAnimationFrame(notifyRaf)
      notifyRaf = undefined
    }
  }

  const schedule = () => {
    if (coalesce === 'immediate') {
      fire()
      return
    }

    if (notifyScheduled) {
      return
    }

    notifyScheduled = true

    if (coalesce === 'adaptive') {
      const inBurst = nowMs() - lastNotifyAt < ADAPTIVE_BURST_WINDOW_MS

      if (inBurst) {
        scheduleFrame()
      } else {
        notifyTimer = setTimeout(fire, 0)
      }

      return
    }

    if (coalesce === 'frame') {
      scheduleFrame()
      return
    }

    if (Predicate.isObject(coalesce) && 'delayMs' in coalesce) {
      const delayMs = Predicate.isNumber(coalesce.delayMs) ? Math.max(0, coalesce.delayMs) : 0
      notifyTimer = setTimeout(fire, delayMs)
      return
    }

    const _exhaustive: never = coalesce
    void _exhaustive
  }

  const flush = () => {
    if (notifyScheduled) {
      cancel()
      fire()
    }
  }

  return { schedule, flush, cancel }
}
