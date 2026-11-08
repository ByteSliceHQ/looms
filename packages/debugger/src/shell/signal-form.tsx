import { useEffect, useMemo, useState } from 'react'

import {
  cleanUndefined,
  type JsonValue,
  type PublishedEvent,
  type PublishedSignal,
  type ThreadNode,
} from '@looms/core'
import { useRunStore, useThreadTree } from '@looms/react'

import { JsonTree } from '../components/json-tree'
import { useDebugger } from '../context'
import { errorMessage, shortId } from '../lib/cn'
import { Button } from '../ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command'
import { Kbd } from '../ui/panel'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Field, useRunAction } from './run-action'
import {
  initialValues,
  inputForm,
  parseFormInput,
  type FormValues,
  type InputForm,
} from './schema-form'
import { InputFields } from './start-form'

const PREVIEW_MS = 250

function flattenThreads(root: ThreadNode | null): readonly ThreadNode[] {
  if (!root) {
    return []
  }

  const rows: ThreadNode[] = []

  const walk = (node: ThreadNode) => {
    rows.push(node)

    for (const child of node.children) {
      walk(child)
    }
  }

  walk(root)
  return rows
}

export function useSignalCatalog() {
  const { client } = useDebugger()
  const [signals, setSignals] = useState<readonly PublishedSignal[]>([])
  const [events, setEvents] = useState<readonly PublishedEvent[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([client.listSignals(), client.listEvents()])
      .then(([signalCatalog, eventCatalog]) => {
        setSignals(signalCatalog.signals)
        setEvents(eventCatalog.events)
        setError(null)
      })
      .catch((cause: unknown) => setError(errorMessage(cause)))
  }, [client])

  return { signals, events, error }
}

function signalKey(signal: PublishedSignal): string {
  return `${signal.namespace}.${signal.name}`
}

function PreviewPanel({
  pending,
  error,
  events,
}: {
  pending: boolean
  error: string | null
  events: readonly { readonly type: string; readonly payload: JsonValue }[] | null
}) {
  if (pending) {
    return <p className="text-muted-foreground text-[11px]">Previewing…</p>
  }

  if (error) {
    return (
      <p className="text-status-failed text-[11px]" title={error}>
        {error}
      </p>
    )
  }

  if (!events) {
    return <p className="text-muted-foreground text-[11px]">Preview will appear here.</p>
  }

  if (events.length === 0) {
    return <p className="text-muted-foreground text-[11px]">No events built.</p>
  }

  return (
    <div className="border-border bg-card max-h-48 overflow-auto rounded-md border p-2">
      <JsonTree value={events} defaultExpandDepth={2} />
    </div>
  )
}

function SignalTab({
  runId,
  rootThreadId,
  signals,
}: {
  runId: string
  rootThreadId?: string
  signals: readonly PublishedSignal[]
}) {
  const { client } = useDebugger()
  const store = useRunStore(runId)
  const tree = useThreadTree(store)
  const threads = useMemo(() => flattenThreads(tree.root), [tree.root])

  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const selected = signals.find((signal) => signalKey(signal) === selectedKey)

  const form: InputForm = useMemo(
    () => (selected?.inputSchema ? inputForm(selected.inputSchema) : { kind: 'json' }),
    [selected],
  )

  const [values, setValues] = useState<FormValues>(() => initialValues(form))
  const [threadId, setThreadId] = useState('')
  const resolvedThreadId = threadId || rootThreadId

  const [previewEvents, setPreviewEvents] = useState<
    readonly { type: string; payload: JsonValue }[] | null
  >(null)

  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewPending, setPreviewPending] = useState(false)

  const { run, pending, error, setError } = useRunAction()
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!selected) {
      return
    }

    setValues(initialValues(form))
    setPreviewEvents(null)
    setPreviewError(null)
    setSent(false)
  }, [selected, form])

  useEffect(() => {
    if (!selected) {
      return undefined
    }

    const parsed = selected.inputSchema
      ? parseFormInput(form, values)
      : ({ ok: true, value: undefined } as const)

    if (!parsed.ok) {
      setPreviewEvents(null)
      setPreviewError(parsed.error)
      return undefined
    }

    // oxlint-disable-next-line effecttsgo/global-timers -- React preview debounce uses DOM timers.
    const timer = setTimeout(() => {
      setPreviewPending(true)

      client
        .previewSignal(selected.namespace, selected.name, {
          input: parsed.value,
          threadId: resolvedThreadId,
        })
        .then((result) => {
          setPreviewEvents(result.events)
          setPreviewError(null)
        })
        .catch((cause: unknown) => {
          setPreviewEvents(null)
          setPreviewError(errorMessage(cause))
        })
        .finally(() => setPreviewPending(false))
    }, PREVIEW_MS)

    return () => clearTimeout(timer)
  }, [client, form, resolvedThreadId, selected, values])

  const inputParsed = selected?.inputSchema
    ? parseFormInput(form, values)
    : { ok: true as const, value: undefined }

  const previewValid =
    selected !== undefined &&
    inputParsed.ok &&
    !previewPending &&
    previewError === null &&
    previewEvents !== null

  const namespaces = useMemo(
    () => [...new Set(signals.map((signal) => signal.namespace))],
    [signals],
  )

  function send() {
    if (!selected || !inputParsed.ok || !previewValid) {
      return
    }

    setSent(false)
    setError(null)

    run(
      () =>
        client.sendSignal(runId, selected.namespace, selected.name, {
          input: inputParsed.value,
          threadId: resolvedThreadId,
        }),
      () => setSent(true),
    )
  }

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        send()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
          event.preventDefault()
          send()
        }
      }}
    >
      <Command className="border-border rounded-lg border">
        <CommandInput placeholder="Search signals…" />
        <CommandList className="max-h-40">
          <CommandEmpty>No signals found.</CommandEmpty>
          {namespaces.map((namespace) => (
            <CommandGroup key={namespace} heading={namespace}>
              {signals
                .filter((signal) => signal.namespace === namespace)
                .map((signal) => {
                  const key = signalKey(signal)
                  return (
                    <CommandItem
                      key={key}
                      value={`${signal.namespace} ${signal.name} ${signal.description ?? ''}`}
                      data-selected={key === selectedKey}
                      onSelect={() => setSelectedKey(key)}
                    >
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="font-medium">{signal.name}</span>
                        {signal.description ? (
                          <span className="text-muted-foreground line-clamp-1 text-[11px]">
                            {signal.description}
                          </span>
                        ) : null}
                      </div>
                    </CommandItem>
                  )
                })}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>

      <Field label="Thread" hint="defaults to root">
        <Select value={resolvedThreadId ?? ''} onValueChange={setThreadId}>
          <SelectTrigger className="w-full font-mono text-xs">
            <SelectValue placeholder={rootThreadId ? shortId(rootThreadId) : 'thread id'} />
          </SelectTrigger>
          <SelectContent>
            {threads.map((thread) => (
              <SelectItem
                key={thread.threadId}
                value={thread.threadId}
                description={thread.definitionName}
              >
                {shortId(thread.threadId)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {selected ? (
        selected.inputSchema ? (
          <div className="grid gap-2">
            <p className="text-muted-foreground text-[11px] font-medium">Input</p>
            <InputFields form={form} values={values} onChange={setValues} />
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">No input</p>
        )
      ) : (
        <p className="text-muted-foreground text-xs">Choose a signal to configure input.</p>
      )}

      <section className="grid gap-1.5">
        <p className="text-muted-foreground text-[11px] font-medium">Preview</p>
        <PreviewPanel pending={previewPending} error={previewError} events={previewEvents} />
      </section>

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
        <Button type="submit" size="sm" disabled={pending || !previewValid}>
          Send signal
        </Button>
      </div>
    </form>
  )
}

function AdvancedTab({
  runId,
  rootThreadId,
  events: catalog,
}: {
  runId: string
  rootThreadId?: string
  events: readonly PublishedEvent[]
}) {
  const { client } = useDebugger()
  const store = useRunStore(runId)
  const tree = useThreadTree(store)
  const threads = useMemo(() => flattenThreads(tree.root), [tree.root])

  const [eventType, setEventType] = useState('')
  const selectedEvent = catalog.find((event) => event.type === eventType)

  const form = useMemo(
    () => inputForm(selectedEvent?.payloadSchema),
    [selectedEvent?.payloadSchema],
  )

  const [values, setValues] = useState<FormValues>(() => initialValues(form))
  const [threadId, setThreadId] = useState('')
  const resolvedThreadId = threadId || rootThreadId

  const [previewEvents, setPreviewEvents] = useState<
    readonly { type: string; payload: JsonValue }[] | null
  >(null)

  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewPending, setPreviewPending] = useState(false)

  const { run, pending, error, setError } = useRunAction()
  const [sent, setSent] = useState(false)

  useEffect(() => {
    setValues(initialValues(form))
    setPreviewEvents(null)
    setPreviewError(null)
    setSent(false)
  }, [eventType, form])

  useEffect(() => {
    if (!eventType) {
      return undefined
    }

    const parsed = parseFormInput(form, values)

    if (!parsed.ok) {
      setPreviewEvents(null)
      setPreviewError(parsed.error)
      return undefined
    }

    // oxlint-disable-next-line effecttsgo/global-timers -- React preview debounce uses DOM timers.
    const timer = setTimeout(() => {
      setPreviewPending(true)

      client
        .previewEvents([
          {
            type: eventType,
            payload: parsed.value,
            threadId: resolvedThreadId,
          },
        ])
        .then((result) => {
          setPreviewEvents(result.events)
          setPreviewError(null)
        })
        .catch((cause: unknown) => {
          setPreviewEvents(null)
          setPreviewError(errorMessage(cause))
        })
        .finally(() => setPreviewPending(false))
    }, PREVIEW_MS)

    return () => clearTimeout(timer)
  }, [client, eventType, form, resolvedThreadId, values])

  const payloadParsed = parseFormInput(form, values)

  const previewValid =
    eventType.length > 0 &&
    payloadParsed.ok &&
    !previewPending &&
    previewError === null &&
    previewEvents !== null

  function send() {
    if (!payloadParsed.ok || !previewValid) {
      return
    }

    setSent(false)
    setError(null)

    run(
      () =>
        client.signal(runId, [
          {
            type: eventType,
            payload: cleanUndefined(payloadParsed.value),
            threadId: resolvedThreadId,
          },
        ]),
      () => setSent(true),
    )
  }

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        send()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
          event.preventDefault()
          send()
        }
      }}
    >
      <Field label="Event type">
        <Select value={eventType} onValueChange={setEventType}>
          <SelectTrigger className="w-full font-mono text-xs">
            <SelectValue placeholder="module.event" />
          </SelectTrigger>
          <SelectContent>
            {catalog.map((event) => (
              <SelectItem key={event.type} value={event.type}>
                {event.type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Thread" hint="defaults to root">
        <Select value={resolvedThreadId ?? ''} onValueChange={setThreadId}>
          <SelectTrigger className="w-full font-mono text-xs">
            <SelectValue placeholder={rootThreadId ? shortId(rootThreadId) : 'thread id'} />
          </SelectTrigger>
          <SelectContent>
            {threads.map((thread) => (
              <SelectItem
                key={thread.threadId}
                value={thread.threadId}
                description={thread.definitionName}
              >
                {shortId(thread.threadId)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {eventType ? (
        <div className="grid gap-2">
          <p className="text-muted-foreground text-[11px] font-medium">Payload</p>
          <InputFields form={form} values={values} onChange={setValues} />
        </div>
      ) : null}

      <section className="grid gap-1.5">
        <p className="text-muted-foreground text-[11px] font-medium">Preview</p>
        <PreviewPanel pending={previewPending} error={previewError} events={previewEvents} />
      </section>

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
        <Button type="submit" size="sm" disabled={pending || !previewValid}>
          Send signal
        </Button>
      </div>
    </form>
  )
}

export function SignalForm({ runId, rootThreadId }: { runId: string; rootThreadId?: string }) {
  const { signals, events, error } = useSignalCatalog()

  return (
    <div className="grid gap-3">
      <div>
        <p className="text-[13px] font-medium">Send a signal</p>
        <p className="text-muted-foreground text-xs">Append an event to this run&apos;s log.</p>
      </div>
      {error ? (
        <p className="text-status-failed text-[11px]" title={error}>
          {error}
        </p>
      ) : null}
      <Tabs defaultValue="signal">
        <TabsList>
          <TabsTrigger value="signal">Signal</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        <TabsContent value="signal" className="mt-3">
          <SignalTab runId={runId} rootThreadId={rootThreadId} signals={signals} />
        </TabsContent>
        <TabsContent value="advanced" className="mt-3">
          <AdvancedTab runId={runId} rootThreadId={rootThreadId} events={events} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
