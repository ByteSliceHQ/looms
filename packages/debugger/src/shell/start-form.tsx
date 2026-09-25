import { Play } from 'lucide-react'
import { useState } from 'react'

import { isJsonObject, isJsonString, type JsonValue } from '@looms/core'
import { useRunEvents, useRunStore, useRunSummary, useThreadTree } from '@looms/react'

import { JsonTree } from '../components/json-tree'
import { StatusBadge } from '../components/status-dot'
import type { WorkspaceContext } from '../plugin'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Input } from '../ui/input'
import { ScrollArea } from '../ui/scroll-area'
import { Textarea } from '../ui/textarea'
import {
  formInput,
  initialValues,
  inputForm,
  type FormField,
  type FormValues,
  type InputForm,
} from './schema-form'
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

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField
  value: string
  onChange: (value: string) => void
}) {
  switch (field.type) {
    case 'boolean':
      return (
        <Checkbox
          checked={value === 'true'}
          onCheckedChange={(checked) => onChange(String(checked === true))}
        />
      )
    case 'number':
      return (
        <Input
          type="number"
          className="h-8 font-mono text-xs"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )
    case 'string':
      return (
        <Input
          className="h-8 text-[13px]"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )

    default: {
      const exhaustive: never = field.type
      return exhaustive
    }
  }
}

function InputFields({
  form,
  values,
  onChange,
}: {
  form: InputForm
  values: FormValues
  onChange: (values: FormValues) => void
}) {
  switch (form.kind) {
    case 'text':
      return (
        <Textarea
          className="max-h-64 min-h-20"
          value={values.source}
          onChange={(event) => onChange({ ...values, source: event.target.value })}
          aria-label="Input"
        />
      )
    case 'fields':
      return form.fields.map((field) => (
        <label
          key={field.name}
          className={
            field.type === 'boolean' ? 'flex items-center gap-2 text-xs' : 'grid gap-1.5 text-xs'
          }
        >
          <span className="text-foreground font-medium">{field.label}</span>
          <FieldInput
            field={field}
            value={values.fields[field.name] ?? ''}
            onChange={(value) =>
              onChange({ ...values, fields: { ...values.fields, [field.name]: value } })
            }
          />
        </label>
      ))
    case 'json':
      return (
        <Textarea
          className="max-h-80 min-h-28 font-mono text-xs"
          value={values.source}
          onChange={(event) => onChange({ ...values, source: event.target.value })}
          aria-label="JSON input"
          spellCheck={false}
        />
      )

    default: {
      const exhaustive: never = form
      return exhaustive
    }
  }
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
