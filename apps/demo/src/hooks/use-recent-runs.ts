import { useSyncExternalStore } from 'react'
import { z } from 'zod'

const KEY = 'looms-demo-recent-runs'
const MAX = 12
const EMPTY: RecentRun[] = []

const RecentRunSchema = z.object({
  runId: z.string(),
  definitionName: z.string(),
  kind: z.string(),
  startedAt: z.number(),
})

export type RecentRun = z.infer<typeof RecentRunSchema>

let cachedRaw: string | null = null
let cached: RecentRun[] = EMPTY

function read(): RecentRun[] {
  if (typeof localStorage === 'undefined') {
    return cached
  }

  const raw = localStorage.getItem(KEY)

  if (raw === cachedRaw) {
    return cached
  }

  cachedRaw = raw

  if (!raw) {
    cached = EMPTY
    return cached
  }

  const parsed = z.array(RecentRunSchema).safeParse(JSON.parse(raw))
  cached = parsed.success ? parsed.data : EMPTY
  return cached
}

function write(runs: RecentRun[]) {
  const next = runs.slice(0, MAX)
  cached = next
  cachedRaw = JSON.stringify(next)
  localStorage.setItem(KEY, cachedRaw)
  window.dispatchEvent(new Event(KEY))
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener(KEY, onStoreChange)

  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener(KEY, onStoreChange)
  }
}

export function rememberRun(run: RecentRun) {
  write([run, ...read().filter((item) => item.runId !== run.runId)])
}

export function useRecentRuns(): RecentRun[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY)
}
