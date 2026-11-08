import { Effect, Fiber } from 'effect'
import { AlarmClock, CircleStop, GitFork, Radio } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useRunStore, useRunSummary } from '@looms/react'

import { useDebugger } from '../context'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { useRunAction } from './run-action'
import { SignalForm } from './signal-form'

const NOTICE_MS = 3_000

/** Run-scoped actions that live beside the run switcher. */
export function RunControls({
  runId,
  onForked,
}: {
  runId: string
  onForked: (runId: string) => void
}) {
  const { client } = useDebugger()
  const { rootThreadId, finished, resumable } = useRunSummary(useRunStore(runId))
  // A wake holds its request open until the run parks, so Cancel needs its own pending state.
  const waking = useRunAction()
  const cancelling = useRunAction()
  const forking = useRunAction()
  const error = forking.error ?? cancelling.error ?? waking.error
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!notice) {
      return undefined
    }

    const clear = Effect.runFork(
      Effect.sleep(NOTICE_MS).pipe(Effect.andThen(Effect.sync(() => setNotice(null)))),
    )

    return () => {
      Effect.runFork(Fiber.interrupt(clear))
    }
  }, [notice])

  function wake() {
    setNotice(null)
    cancelling.setError(null)

    waking.run(
      () => client.wake(runId),
      ({ appended }) =>
        setNotice(
          appended === 0
            ? 'Nothing pending'
            : `Woke: ${appended} new event${appended === 1 ? '' : 's'}`,
        ),
    )
  }

  return (
    <div className="flex items-center gap-0.5">
      {error ? (
        <span className="text-status-failed mr-2 max-w-60 truncate text-[11px]" title={error}>
          {error}
        </span>
      ) : notice ? (
        <span role="status" className="text-muted-foreground mr-2 text-[11px]">
          {notice}
        </span>
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        disabled={waking.pending}
        title="Process pending work: due timers, retries, and effects stalled by a restart"
        onClick={wake}
      >
        <AlarmClock />
        Wake
      </Button>
      {resumable ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={forking.pending}
          title="Start a new run that picks up where this one stopped"
          onClick={() => {
            setNotice(null)
            waking.setError(null)

            forking.run(
              () => client.fork(runId),
              (forked) => onForked(forked.runId),
            )
          }}
        >
          <GitFork />
          Continue
        </Button>
      ) : (
        <Button
          variant="destructive"
          size="sm"
          disabled={cancelling.pending || finished}
          onClick={() => {
            setNotice(null)
            waking.setError(null)
            cancelling.run(() => client.cancel(runId))
          }}
        >
          <CircleStop />
          Cancel
        </Button>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="data-[state=open]:bg-accent data-[state=open]:text-foreground"
          >
            <Radio />
            Signal
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[28rem]">
          <SignalForm runId={runId} rootThreadId={rootThreadId} />
        </PopoverContent>
      </Popover>
    </div>
  )
}
