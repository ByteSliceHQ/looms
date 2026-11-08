import { useEffect, useRef, useState } from 'react'

import type { JsonValue } from '@looms/core'

import { errorMessage } from '../lib/cn'

const PREVIEW_MS = 250

export type PreviewEvents = readonly { readonly type: string; readonly payload: JsonValue }[]

/**
 * Debounced preview with a generation token so a slow stale response cannot overwrite a newer
 * one or clear pending while a later request is still in flight.
 *
 * `key` must change whenever `run`'s closed-over inputs change. `run` itself is read from a ref
 * so the effect does not reschedule on every render.
 */
export function useDebouncedPreview({
  enabled,
  key,
  run,
}: {
  enabled: boolean
  key: string
  run: () => Promise<PreviewEvents>
}) {
  const [events, setEvents] = useState<PreviewEvents | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const generation = useRef(0)
  const runRef = useRef(run)
  runRef.current = run

  useEffect(() => {
    const current = ++generation.current
    setEvents(null)
    setError(null)
    setPending(false)

    if (!enabled) {
      return undefined
    }

    // oxlint-disable-next-line effecttsgo/global-timers -- React preview debounce uses DOM timers.
    const timer = setTimeout(() => {
      if (generation.current !== current) {
        return
      }

      setPending(true)

      runRef
        .current()
        .then((next) => {
          if (generation.current !== current) {
            return
          }

          setEvents(next)
          setError(null)
        })
        .catch((cause: unknown) => {
          if (generation.current !== current) {
            return
          }

          setEvents(null)
          setError(errorMessage(cause))
        })
        .finally(() => {
          if (generation.current === current) {
            setPending(false)
          }
        })
    }, PREVIEW_MS)

    return () => {
      clearTimeout(timer)
      generation.current += 1
    }
  }, [enabled, key])

  return { events, error, pending }
}
