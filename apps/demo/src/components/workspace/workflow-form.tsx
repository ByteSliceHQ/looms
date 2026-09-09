import { useState } from 'react'
import type { JsonValue } from '@looms/core'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { JsonView } from '../json-view'
import type { WorkflowRunType } from '../../catalog'
import { rememberRun } from '@/hooks/use-recent-runs'
import { useRun } from '@/hooks/use-run'
import { loomsClient } from '@/lib/looms-client'
import { statusClass } from '@/lib/status'

function fieldValue(value: string, type: 'string' | 'number', fallback: string | number): JsonValue {
  if (type === 'number') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : Number(fallback)
  }
  return value || String(fallback)
}

function WorkflowResult({ runId }: { runId: string }) {
  const { status, tree, events } = useRun(runId)
  const completed = events.find(
    (event) => event.type === 'runtime.thread.completed' && event.threadId === tree.root?.threadId,
  )
  const failed = events.find(
    (event) => event.type === 'runtime.thread.failed' && event.threadId === tree.root?.threadId,
  )
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">Status</span>
        <span className={statusClass(status)}>{status}</span>
      </div>
      {completed?.type === 'runtime.thread.completed' ? (
        <JsonView value={completed.payload.output} />
      ) : failed?.type === 'runtime.thread.failed' ? (
        <p className="text-xs text-status-failed">{failed.payload.error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">Running…</p>
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
        <p className="text-xs text-muted-foreground">{type.description}</p>
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
            <span className="text-[11px] text-muted-foreground">{field.label}</span>
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
      {error ? <p className="text-xs text-status-failed">{error}</p> : null}
      {runId ? <WorkflowResult runId={runId} /> : null}
    </div>
  )
}
