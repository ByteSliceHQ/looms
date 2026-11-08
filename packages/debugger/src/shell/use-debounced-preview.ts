import { useEffect, useRef, useState } from 'react'

import type { JsonValue } from '@looms/core'

import { errorMessage } from '../lib/cn'

/** Short trailing debounce so typing stays smooth without feeling laggy. */
const PREVIEW_MS = 100

export type PreviewEvents = readonly { readonly type: string; readonly payload: JsonValue }[]

/**
 * Debounced preview with a generation token so a slow stale response cannot overwrite a newer
 * one or clear pending while a later request is still in flight.
 *
 * Input changes (`key`) keep the last successful preview visible until the next result arrives.
 * Selection changes (`resetKey`) clear immediately so a previous signal/event never flashes.
 */
export function useDebouncedPreview({
  enabled,
  key,
  resetKey,
  run,
}: {
  enabled: boolean
  key: string
  resetKey: string
  run: () => Promise<PreviewEvents>
}) {
  const [events, setEvents] = useState<PreviewEvents | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const generation = useRef(0)
  const runRef = useRef(run)
  runRef.current = run

  useEffect(() => {
    generation.current += 1
    setEvents(null)
    setError(null)
    setPending(false)
  }, [resetKey])

  useEffect(() => {
    if (!enabled) {
      generation.current += 1
      setEvents(null)
      setError(null)
      setPending(false)
      return undefined
    }

    const current = ++generation.current

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
