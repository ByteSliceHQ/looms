import { useState, type ReactNode } from 'react'

import { errorMessage } from '../lib/cn'

export function useRunAction() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function run<T>(action: () => Promise<T>, onDone?: (value: T) => void) {
    setPending(true)
    setError(null)

    action()
      .then((value) => onDone?.(value))
      .catch((cause: unknown) => setError(errorMessage(cause)))
      .finally(() => setPending(false))
  }

  return { run, pending, error, setError }
}

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
