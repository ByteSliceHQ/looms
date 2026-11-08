import type { ReactNode } from 'react'

import { Checkbox } from '../ui/checkbox'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import type { FormField, FormValues, InputForm } from './schema-form'

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
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

export function FieldInput({
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
    case 'select':
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="h-8 w-full font-mono text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

export function InputFields({
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
          <span className="text-foreground font-medium">
            {field.label}
            {field.required ? <span className="text-status-failed"> *</span> : null}
          </span>
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
