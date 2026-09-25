import { useState } from 'react'

import { isJsonObject, isJsonString, type JsonValue } from '@looms/core'
import { useRunEvents, useRunStore, useRunSummary, useThreadTree } from '@looms/react'

import { JsonView } from '../components/json-view'
import type { WorkspaceContext } from '../plugin'
import {
  formInput,
  initialValues,
  inputForm,
  type FormField,
  type FormValues,
  type InputForm,
} from './schema-form'
import { useStartRun } from './use-start-run'

const inputClass = 'border-border bg-background rounded border px-2 py-1'

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
        <input
          type="checkbox"
          checked={value === 'true'}
          onChange={(event) => onChange(String(event.target.checked))}
        />
      )
    case 'number':
      return (
        <input
          type="number"
          className={inputClass}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )
    case 'string':
      return (
        <input
          className={inputClass}
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
        <textarea
          className={`${inputClass} min-h-16 w-full text-sm`}
          value={values.source}
          onChange={(event) => onChange({ ...values, source: event.target.value })}
          aria-label="Input"
        />
      )
    case 'fields':
      return form.fields.map((field) => (
        <label key={field.name} className="grid gap-1 text-xs">
          <span className="text-muted-foreground">{field.label}</span>
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
        <textarea
          className={`${inputClass} min-h-24 w-full font-mono text-xs`}
          value={values.source}
          onChange={(event) => onChange({ ...values, source: event.target.value })}
          aria-label="JSON input"
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-auto px-3 py-3">
        {context.runId ? (
          <RunResult runId={context.runId} />
        ) : (
          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            <InputFields form={form} values={values} onChange={setValues} />
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
