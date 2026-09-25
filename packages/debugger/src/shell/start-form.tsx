import { useState } from 'react'

import type { LoomsDefinition } from '@looms/client'
import {
  cleanUndefined,
  createRunId,
  isJsonObject,
  isJsonString,
  type JsonValue,
} from '@looms/core'
import { useRunEvents, useRunStore, useRunSummary, useThreadTree } from '@looms/react'

import { JsonView } from '../components/json-view'
import { useDebugger } from '../context'
import { formFields, valuesToInput } from './schema-form'

function messageOf(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause)
}

function RunResult({ runId }: { runId: string }) {
  const store = useRunStore(runId)
  const summary = useRunSummary(store)
  const tree = useThreadTree(store)
  const events = useRunEvents(store)
  const rootThreadId = tree.root?.threadId

  const completed = events.find(
    (event) => event.type === 'runtime.thread.completed' && event.threadId === rootThreadId,
  )

  const failed = events.find(
    (event) => event.type === 'runtime.thread.failed' && event.threadId === rootThreadId,
  )

  const output = completed && isJsonObject(completed.payload) ? completed.payload.output : undefined
  const failure = failed && isJsonObject(failed.payload) ? failed.payload.error : undefined

  return (
    <div className="space-y-2">
      <p className="text-xs">
        <span className="text-muted-foreground">Status </span>
        {summary.status}
      </p>
      {output !== undefined ? <JsonView value={output} /> : null}
      {isJsonString(failure) ? <p className="text-status-failed text-xs">{failure}</p> : null}
    </div>
  )
}

export function StartForm({
  definition,
  runId,
  onStarted,
}: {
  definition: LoomsDefinition
  runId?: string
  onStarted: (runId: string) => void
}) {
  const { client } = useDebugger()
  const fields = formFields(definition.inputSchema)

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries((fields ?? []).map((field) => [field.name, field.defaultValue])),
  )

  const [raw, setRaw] = useState('{}')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stringInput =
    isJsonObject(definition.inputSchema) && definition.inputSchema.type === 'string'

  function input(): JsonValue {
    if (stringInput) {
      return values.text ?? ''
    }

    if (fields) {
      return valuesToInput(fields, values)
    }

    return cleanUndefined(JSON.parse(raw))
  }

  function start() {
    setPending(true)
    setError(null)
    const nextRunId = createRunId()

    let parsed: JsonValue

    try {
      parsed = input()
    } catch (cause: unknown) {
      setPending(false)
      setError(messageOf(cause))
      return
    }

    onStarted(nextRunId)

    client
      .startRun({
        kind: definition.kind,
        definitionName: definition.name,
        definitionVersion: definition.version,
        input: parsed,
        runId: nextRunId,
      })
      .catch((cause: unknown) => setError(messageOf(cause)))
      .finally(() => setPending(false))
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-border border-b px-3 py-2">
        <h2 className="text-sm font-medium">{definition.name}</h2>
        {definition.description ? (
          <p className="text-muted-foreground text-xs">{definition.description}</p>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-3 py-3">
        {runId ? (
          <RunResult runId={runId} />
        ) : (
          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault()
              start()
            }}
          >
            {stringInput ? (
              <textarea
                className="border-border bg-background min-h-16 w-full rounded border px-2 py-1 text-sm"
                value={values.text ?? ''}
                onChange={(event) => setValues({ text: event.target.value })}
              />
            ) : fields ? (
              fields.map((field) => (
                <label key={field.name} className="grid gap-1 text-xs">
                  <span className="text-muted-foreground">{field.label}</span>
                  <input
                    className="border-border bg-background rounded border px-2 py-1"
                    value={values[field.name] ?? ''}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, [field.name]: event.target.value }))
                    }
                  />
                </label>
              ))
            ) : (
              <textarea
                className="border-border bg-background min-h-24 w-full rounded border px-2 py-1 font-mono text-xs"
                value={raw}
                onChange={(event) => setRaw(event.target.value)}
                aria-label="JSON input"
              />
            )}
            <button
              type="submit"
              className="bg-primary text-primary-foreground rounded px-3 py-1 text-xs"
              disabled={pending}
            >
              Start
            </button>
          </form>
        )}
      </div>
      {error ? <p className="text-status-failed px-3 pb-3 text-xs">{error}</p> : null}
    </div>
  )
}
