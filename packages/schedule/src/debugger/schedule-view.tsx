import { useEffect, useState } from 'react'

import { Button, StatusBadge, useDebugger } from '@looms/debugger'
import { useProjection, useRunStore } from '@looms/react'

import { scheduleStatus } from '../projections'
import { pause, resume, trigger } from '../signals'
import { describeSpec, nextFireAt, type ScheduleSpec } from '../specs'

export function ScheduleView({ runId }: { runId: string }) {
  const { client, openRun } = useDebugger()
  const store = useRunStore(runId)
  const state = useProjection(store, scheduleStatus)
  const now = useNow(state.status === 'running' && state.nextAt !== null)

  if (!state.spec && state.recent.length === 0) {
    return <p className="text-muted-foreground text-xs">No schedule yet.</p>
  }

  const upcoming = state.spec ? upcomingFires(state.spec, state.nextAt) : []
  const remaining = state.nextAt === null ? null : state.nextAt - now

  return (
    <div className="grid gap-3 text-xs">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-medium">
          {state.spec ? describeSpec(state.spec) : 'Schedule'}
        </span>
        <StatusBadge status={state.status} />
      </div>
      <p className="text-muted-foreground">
        {state.status === 'paused' || state.status === 'retired'
          ? 'No alarm is set.'
          : remaining === null
            ? 'Nothing further is scheduled.'
            : `Next fire ${formatRemaining(remaining)}.`}
      </p>
      {state.status === 'running' || state.status === 'paused' ? (
        <div className="flex gap-1.5">
          {state.status === 'paused' ? (
            <Button size="xs" onClick={() => void client.signal(runId, [resume()])}>
              Resume
            </Button>
          ) : (
            <Button
              size="xs"
              variant="outline"
              onClick={() => void client.signal(runId, [pause()])}
            >
              Pause
            </Button>
          )}
          <Button
            size="xs"
            variant="outline"
            onClick={() => void client.signal(runId, [trigger()])}
          >
            Fire now
          </Button>
        </div>
      ) : null}
      {upcoming.length > 0 ? (
        <ol className="text-muted-foreground grid gap-1">
          {upcoming.map((at) => (
            <li key={at}>{formatInstant(at)}</li>
          ))}
        </ol>
      ) : null}
      {state.recent.length > 0 ? (
        <ul className="grid gap-1">
          {state.recent.map((item, index) => (
            <li key={`${item.at}-${index}`} className="flex items-center gap-2">
              <span className="text-muted-foreground w-14 shrink-0">
                {item.outcome === 'fired' ? 'Fired' : 'Skipped'}
              </span>
              {item.runId && openRun ? (
                <button
                  type="button"
                  className="truncate text-left underline-offset-2 hover:underline"
                  onClick={() => openRun(item.runId ?? '')}
                >
                  {item.runId}
                </button>
              ) : (
                <span className="truncate">{item.reason ?? item.runId ?? 'held'}</span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function upcomingFires(spec: ScheduleSpec, nextAt: number | null): number[] {
  if (nextAt === null) {
    return []
  }

  const times = [nextAt]
  let cursor = nextAt

  while (times.length < 5) {
    const next = nextFireAt(spec, cursor)

    if (next === null) {
      break
    }

    times.push(next)
    cursor = next
  }

  return times
}

function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!active) {
      return undefined
    }

    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 1_000)
    return () => clearInterval(timer)
  }, [active])

  return now
}

function formatRemaining(ms: number): string {
  if (ms <= 0) {
    return 'is due'
  }

  const seconds = Math.ceil(ms / 1_000)

  if (seconds < 60) {
    return `in ${seconds}s`
  }

  const minutes = Math.floor(seconds / 60)

  if (minutes < 60) {
    return `in ${minutes}m`
  }

  return `in ${Math.floor(minutes / 60)}h`
}

function formatInstant(at: number): string {
  return new Date(at).toISOString().replace('.000Z', 'Z')
}
