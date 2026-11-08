import { useState } from 'react'

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
