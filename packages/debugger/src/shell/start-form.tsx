import { Play } from 'lucide-react'
import { useState } from 'react'

import { isJsonObject, isJsonString, type JsonValue } from '@looms/core'
import { useRunEvents, useRunStore, useRunSummary, useThreadTree } from '@looms/react'

import { JsonTree } from '../components/json-tree'
import { StatusBadge } from '../components/status-dot'
import type { WorkspaceContext } from '../plugin'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { InputFields } from './form-fields'
import { formInput, initialValues, inputForm } from './schema-form'
import { useStartRun } from './use-start-run'

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
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">Status</span>
        <StatusBadge status={summary.status} />
      </div>
      {output !== undefined ? (
        <section className="border-border bg-card rounded-lg border p-3">
          <h3 className="text-muted-foreground mb-1.5 text-[11px] font-medium">Output</h3>
          <JsonTree value={output} defaultExpandDepth={2} />
        </section>
      ) : null}
      {isJsonString(failure) ? (
        <p className="text-status-failed bg-status-failed/10 rounded-md px-3 py-2 text-xs">
          {failure}
        </p>
      ) : null}
    </div>
  )
}

/** Starts a run from a form built from the definition's input schema, then shows its result. */
export function StartForm(context: WorkspaceContext) {
  const form = inputForm(context.definition.inputSchema)
  const [values, setValues] = useState(() => initialValues(form))
  const { start, fail, pending, error } = useStartRun(context)

  function submit() {
    let input: JsonValue

    try {
      input = formInput(form, values)
    } catch (cause: unknown) {
      fail(cause)
      return
    }

    start(input)
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        {context.runId ? (
          <RunResult runId={context.runId} />
        ) : (
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            <div>
              <p className="text-[13px] font-medium">Input</p>
              <p className="text-muted-foreground text-xs">
                Fields come from the definition&apos;s input schema.
              </p>
            </div>
            <InputFields form={form} values={values} onChange={setValues} />
            <div className="flex items-center gap-3">
              <Button type="submit" size="sm" disabled={pending}>
                <Play />
                Start run
              </Button>
              {error ? <p className="text-status-failed min-w-0 text-[11px]">{error}</p> : null}
            </div>
          </form>
        )}
        {context.runId && error ? (
          <p className="text-status-failed mt-3 text-[11px]">{error}</p>
        ) : null}
      </div>
    </ScrollArea>
  )
}
