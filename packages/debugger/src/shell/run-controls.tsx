import { AlarmClock, CircleStop, Radio } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { cleanUndefined, type EventInput } from '@looms/core'
import { useRunStore, useRunSummary } from '@looms/react'

import { useDebugger } from '../context'
import { errorMessage } from '../lib/cn'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Kbd } from '../ui/panel'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Textarea } from '../ui/textarea'

const CANCEL_TYPE = 'runtime.thread.cancel.requested'

function useRunAction() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function run<T>(action: () => Promise<T>, onDone?: () => void) {
    setPending(true)
    setError(null)

    action()
      .then(() => onDone?.())
      .catch((cause: unknown) => setError(errorMessage(cause)))
      .finally(() => setPending(false))
  }

  return { run, pending, error, setError }
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="flex items-baseline justify-between text-[11px]">
        <span className="text-foreground font-medium">{label}</span>
        {hint ? <span className="text-muted-foreground">{hint}</span> : null}
      </span>
      {children}
    </label>
  )
}

function SignalForm({ runId, rootThreadId }: { runId: string; rootThreadId?: string }) {
  const { client } = useDebugger()
  const [type, setType] = useState(CANCEL_TYPE)
  const [payload, setPayload] = useState('{}')
  const [thread, setThread] = useState('')
  const [sent, setSent] = useState(false)
  const { run, pending, error, setError } = useRunAction()

  function submit() {
    setSent(false)

    let parsed: EventInput

    try {
      parsed = {
        type,
        payload: cleanUndefined(JSON.parse(payload)),
        threadId: thread || rootThreadId,
      }
    } catch (cause: unknown) {
      setError(errorMessage(cause))
      return
    }

    run(
      () => client.signal(runId, [parsed]),
      () => setSent(true),
    )
  }

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <div>
        <p className="text-[13px] font-medium">Send a signal</p>
        <p className="text-muted-foreground text-xs">Append an event to this run&apos;s log.</p>
      </div>
      <Field label="Type">
        <Input
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="h-7 font-mono text-xs"
          autoFocus
        />
      </Field>
      <Field label="Thread" hint="defaults to root">
        <Input
          value={thread}
          placeholder={rootThreadId ?? 'thread id'}
          onChange={(event) => setThread(event.target.value)}
          className="h-7 font-mono text-xs"
        />
      </Field>
      <Field label="Payload" hint="JSON">
        <Textarea
          value={payload}
          onChange={(event) => setPayload(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault()
              submit()
            }
          }}
          className="max-h-48 min-h-20 font-mono text-xs"
          spellCheck={false}
        />
      </Field>
      <div className="flex items-center gap-2">
        {error ? (
          <p className="text-status-failed min-w-0 flex-1 truncate text-[11px]" title={error}>
            {error}
          </p>
        ) : sent ? (
          <p className="text-status-completed flex-1 text-[11px]">Signal sent</p>
        ) : (
          <p className="text-muted-foreground flex flex-1 items-center gap-1 text-[11px]">
            <Kbd>⌘</Kbd>
            <Kbd>↵</Kbd>
          </p>
        )}
        <Button type="submit" size="sm" disabled={pending || type.length === 0}>
          Send signal
        </Button>
      </div>
    </form>
  )
}

/** Run-scoped actions that live beside the run switcher. */
export function RunControls({ runId }: { runId: string }) {
  const { client } = useDebugger()
  const { rootThreadId, status } = useRunSummary(useRunStore(runId))
  const { run, pending, error } = useRunAction()
  const finished = status === 'completed' || status === 'failed' || status === 'cancelled'

  return (
    <div className="flex items-center gap-0.5">
      {error ? (
        <span className="text-status-failed mr-2 max-w-60 truncate text-[11px]" title={error}>
          {error}
        </span>
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => run(() => client.wake(runId))}
      >
        <AlarmClock />
        Wake
      </Button>
      <Button
        variant="destructive"
        size="sm"
        disabled={pending || finished}
        onClick={() =>
          run(() =>
            client.signal(runId, [
              { type: CANCEL_TYPE, payload: { threadId: rootThreadId ?? '' } },
            ]),
          )
        }
      >
        <CircleStop />
        Cancel
      </Button>
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
        <PopoverContent align="end" className="w-80">
          <SignalForm runId={runId} rootThreadId={rootThreadId} />
        </PopoverContent>
      </Popover>
    </div>
  )
}
