import { useState } from 'react'

import { rememberRun } from '@/hooks/use-recent-runs'
import { loomsClient } from '@/lib/looms-client'
import { statusClass } from '@/lib/status'
import type { JsonValue } from '@swirls/looms/core'
import { useRunEvents, useRunStore, useRunSummary, useThreadTree } from '@swirls/looms/react'

import type { WorkflowRunType } from '../../catalog'
import { JsonView } from '../json-view'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

function fieldValue(
  value: string,
  type: 'string' | 'number',
  fallback: string | number,
): JsonValue {
  if (type === 'number') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : Number(fallback)
  }

  return value || String(fallback)
}

function WorkflowResult({ runId }: { runId: string }) {
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

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">Status</span>
        <span className={statusClass(summary.status)}>{summary.status}</span>
      </div>
      {completed?.type === 'runtime.thread.completed' ? (
        <JsonView value={completed.payload.output} />
      ) : failed?.type === 'runtime.thread.failed' ? (
        <p className="text-status-failed text-xs">{failed.payload.error}</p>
      ) : (
        <p className="text-muted-foreground text-xs">Running…</p>
      )}
    </div>
  )
}

export function WorkflowForm({
  type,
  runId,
  onStarted,
}: {
  type: WorkflowRunType
  runId?: string
  onStarted: (runId: string) => void
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(type.fields.map((field) => [field.name, String(field.default)])),
  )

  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start() {
    setPending(true)
    setError(null)

    try {
      const input = Object.fromEntries(
        type.fields.map((field) => [
          field.name,
          fieldValue(values[field.name] ?? '', field.type, field.default),
        ]),
      )

      const result = await loomsClient.start(type.def, input)

      rememberRun({
        runId: result.runId,
        definitionName: type.name,
        kind: type.kind,
        startedAt: Date.now(),
      })

      onStarted(result.runId)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <div>
        <h2 className="text-sm font-medium">{type.label}</h2>
        <p className="text-muted-foreground text-xs">{type.description}</p>
      </div>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          void start()
        }}
      >
        {type.fields.map((field) => (
          <label key={field.name} className="block space-y-1">
            <span className="text-muted-foreground text-[11px]">{field.label}</span>
            <Input
              type={field.type === 'number' ? 'number' : 'text'}
              value={values[field.name] ?? ''}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, [field.name]: event.target.value }))
              }
            />
          </label>
        ))}
        <Button type="submit" disabled={pending}>
          {pending ? 'Starting…' : runId ? 'Run again' : 'Start'}
        </Button>
      </form>
      {error ? <p className="text-status-failed text-xs">{error}</p> : null}
      {runId ? <WorkflowResult runId={runId} /> : null}
    </div>
  )
}
