/** Run ids start with a base36 millisecond timestamp (`run_<ms36>_<counter>_<entropy>`). */
export function runCreatedAt(runId: string): number | undefined {
  const stamp = runId.split('_')[1]

  if (!stamp) {
    return undefined
  }

  const ms = Number.parseInt(stamp, 36)
  return Number.isFinite(ms) ? ms : undefined
}

export function relativeTime(then: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - then) / 1000))

  if (seconds < 45) {
    return 'just now'
  }

  const minutes = Math.round(seconds / 60)

  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.round(minutes / 60)

  if (hours < 24) {
    return `${hours}h ago`
  }

  return `${Math.round(hours / 24)}d ago`
}
