import { useEffect, useMemo, useState, type ReactNode } from 'react'

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
import { Field, InputFields } from './form-fields'
import { useRunAction } from './run-action'
import {
  initialValues,
  inputForm,
  parseFormInput,
  type FormValues,
  type InputForm,
} from './schema-form'
import { useDebouncedPreview, type PreviewEvents } from './use-debounced-preview'

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
  events: PreviewEvents | null
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

function ThreadSelect({
  rootThreadId,
  threads,
  value,
  onChange,
}: {
  rootThreadId?: string
  threads: readonly ThreadNode[]
  value: string
  onChange: (threadId: string) => void
}) {
  const resolved = value || rootThreadId

  return (
    <Field label="Thread" hint="defaults to root">
      <Select value={resolved ?? ''} onValueChange={onChange}>
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
  )
}

function ExecutorFooter({
  pending,
  canSend,
  error,
  sent,
}: {
  pending: boolean
  canSend: boolean
  error: string | null
  sent: boolean
}) {
  return (
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
      <Button type="submit" size="sm" disabled={pending || !canSend}>
        Send signal
      </Button>
    </div>
  )
}

type ParsedInput =
  | { readonly ok: true; readonly value: JsonValue | undefined }
  | { readonly ok: false; readonly error: string }

function SignalExecutor({
  runId,
  rootThreadId,
  selectionKey,
  parsed,
  inputKey,
  preview,
  send,
  picker,
  inputLabel,
  form,
  values,
  onValuesChange,
  showInput,
  emptyInputHint,
}: {
  runId: string
  rootThreadId?: string
  selectionKey: string
  parsed: ParsedInput
  inputKey: string
  preview: (input: JsonValue | undefined, threadId: string | undefined) => Promise<PreviewEvents>
  send: (input: JsonValue | undefined, threadId: string | undefined) => Promise<void>
  picker: ReactNode
  inputLabel: string
  form: InputForm
  values: FormValues
  onValuesChange: (values: FormValues) => void
  showInput: boolean
  emptyInputHint: string
}) {
  const store = useRunStore(runId)
  const tree = useThreadTree(store)
  const threads = useMemo(() => flattenThreads(tree.root), [tree.root])

  const [threadId, setThreadId] = useState('')
  const resolvedThreadId = threadId || rootThreadId

  const { run, pending, error, setError } = useRunAction()
  const [sent, setSent] = useState(false)

  const previewRun = useDebouncedPreview({
    enabled: selectionKey.length > 0 && parsed.ok,
    key: `${inputKey}:${resolvedThreadId ?? ''}`,
    run: () => {
      if (!parsed.ok) {
        return Promise.reject(new Error(parsed.error))
      }

      return preview(parsed.value, resolvedThreadId)
    },
  })

  useEffect(() => {
    setSent(false)
    setError(null)
  }, [selectionKey, setError])

  const parseError = parsed.ok ? null : parsed.error
  const previewError = parseError ?? previewRun.error
  const canSend = parsed.ok && selectionKey.length > 0

  function submit() {
    if (!parsed.ok || !canSend) {
      return
    }

    setSent(false)
    setError(null)

    run(
      () => send(parsed.value, resolvedThreadId),
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
      onKeyDown={(event) => {
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
          event.preventDefault()
          submit()
        }
      }}
    >
      {picker}

      <ThreadSelect
        rootThreadId={rootThreadId}
        threads={threads}
        value={threadId}
        onChange={setThreadId}
      />

      {showInput ? (
        <div className="grid gap-2">
          <p className="text-muted-foreground text-[11px] font-medium">{inputLabel}</p>
          <InputFields form={form} values={values} onChange={onValuesChange} />
        </div>
      ) : selectionKey ? (
        <p className="text-muted-foreground text-xs">No input</p>
      ) : (
        <p className="text-muted-foreground text-xs">{emptyInputHint}</p>
      )}

      <section className="grid gap-1.5">
        <p className="text-muted-foreground text-[11px] font-medium">Preview</p>
        <PreviewPanel
          pending={previewRun.pending}
          error={previewError}
          events={parseError ? null : previewRun.events}
        />
      </section>

      <ExecutorFooter pending={pending} canSend={canSend} error={error} sent={sent} />
    </form>
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
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const selected = signals.find((signal) => signalKey(signal) === selectedKey)

  const form: InputForm = useMemo(
    () => (selected?.inputSchema ? inputForm(selected.inputSchema) : { kind: 'json' }),
    [selected],
  )

  const [values, setValues] = useState<FormValues>(() => initialValues(form))

  useEffect(() => {
    setValues(initialValues(form))
  }, [selected, form])

  const parsed: ParsedInput = !selected
    ? { ok: false, error: 'Choose a signal' }
    : selected.inputSchema
      ? parseFormInput(form, values)
      : { ok: true, value: undefined }

  const namespaces = useMemo(
    () => [...new Set(signals.map((signal) => signal.namespace))],
    [signals],
  )

  const selectionKey = selected ? signalKey(selected) : ''

  return (
    <SignalExecutor
      runId={runId}
      rootThreadId={rootThreadId}
      selectionKey={selectionKey}
      parsed={parsed}
      inputKey={`${selectionKey}:${JSON.stringify(values)}`}
      preview={(input, threadId) => {
        if (!selected) {
          return Promise.reject(new Error('Choose a signal'))
        }

        return client
          .previewSignal(selected.namespace, selected.name, { input, threadId })
          .then((result) => result.events)
      }}
      send={(input, threadId) => {
        if (!selected) {
          return Promise.reject(new Error('Choose a signal'))
        }

        return client
          .sendSignal(runId, selected.namespace, selected.name, { input, threadId })
          .then(() => undefined)
      }}
      picker={
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
      }
      inputLabel="Input"
      form={form}
      values={values}
      onValuesChange={setValues}
      showInput={Boolean(selected?.inputSchema)}
      emptyInputHint="Choose a signal to configure input."
    />
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
  const [eventType, setEventType] = useState('')
  const selectedEvent = catalog.find((event) => event.type === eventType)

  const form = useMemo(
    () => inputForm(selectedEvent?.payloadSchema),
    [selectedEvent?.payloadSchema],
  )

  const [values, setValues] = useState<FormValues>(() => initialValues(form))

  useEffect(() => {
    setValues(initialValues(form))
  }, [eventType, form])

  const parsed: ParsedInput = eventType
    ? parseFormInput(form, values)
    : { ok: false, error: 'Choose an event' }

  return (
    <SignalExecutor
      runId={runId}
      rootThreadId={rootThreadId}
      selectionKey={eventType}
      parsed={parsed}
      inputKey={`${eventType}:${JSON.stringify(values)}`}
      preview={(input, threadId) =>
        client
          .previewEvents([
            {
              type: eventType,
              payload: input ?? null,
              threadId,
            },
          ])
          .then((result) => result.events)
      }
      send={(input, threadId) =>
        client
          .signal(runId, [
            {
              type: eventType,
              payload: cleanUndefined(input ?? null),
              threadId,
            },
          ])
          .then(() => undefined)
      }
      picker={
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
      }
      inputLabel="Payload"
      form={form}
      values={values}
      onValuesChange={setValues}
      showInput={eventType.length > 0}
      emptyInputHint="Choose an event type."
    />
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
