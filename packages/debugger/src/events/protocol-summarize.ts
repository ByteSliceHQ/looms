import { isJsonNumber, isJsonString, isProtocolType } from '@looms/core'

import type { DebuggerEvent, EventSummary } from '../contracts'
import { compactJson } from '../lib/cn'
import { jsonFields, jsonNumberText, jsonText } from '../lib/payload'

export function summarizeProtocolEvent(event: DebuggerEvent): EventSummary | undefined {
  if (!isProtocolType(event.type)) {
    return undefined
  }

  const payload = jsonFields(event.payload)

  switch (event.type) {
    case 'runtime.run.started':
      return {
        title: 'run started',
        detail: `${jsonText(payload.kind) ?? 'run'}:${jsonText(payload.definitionName) ?? 'unknown'}`,
      }
    case 'runtime.run.completed':
      return {
        title: jsonText(payload.error) ? 'run failed' : 'run completed',
        detail: jsonText(payload.error) ?? compactJson(payload.output ?? null),
      }
    case 'runtime.run.cancelled':
      return { title: 'run cancelled', detail: jsonText(payload.reason) }
    case 'runtime.thread.started':
      return {
        title: 'thread started',
        detail: `${jsonText(payload.kind) ?? 'thread'}:${jsonText(payload.definitionName) ?? 'unknown'}`,
      }
    case 'runtime.thread.completed':
      return { title: 'thread completed', detail: compactJson(payload.output ?? null) }
    case 'runtime.thread.failed':
      return { title: 'thread failed', detail: jsonText(payload.error) }
    case 'runtime.thread.cancelled':
      return { title: 'thread cancelled', detail: jsonText(payload.reason) }

    case 'runtime.wait.registered': {
      const on = jsonFields(payload.on ?? null)
      const type = on.type

      const detail = isJsonString(type)
        ? type
        : Array.isArray(type)
          ? type.filter(isJsonString).join(', ')
          : isJsonNumber(on.timerAt)
            ? `timer ${on.timerAt}`
            : undefined

      return { title: 'wait registered', detail }
    }

    case 'runtime.wait.satisfied': {
      const waited = jsonFields(payload.event ?? null)
      return { title: 'wait satisfied', detail: jsonText(waited.type) }
    }

    case 'runtime.timer.set':
      return { title: 'timer set', detail: jsonNumberText(payload.wakeAt) }
    case 'runtime.timer.fired':
      return { title: 'timer fired' }
    case 'runtime.effect.failed':
      return { title: 'effect failed', detail: jsonText(payload.error) }
    case 'runtime.effect.attempt.started':
      return { title: 'effect attempt started', detail: jsonNumberText(payload.attempt) }
    case 'runtime.effect.queued':
      return { title: 'effect queued', detail: jsonNumberText(payload.attempt) }
    case 'runtime.effect.dispatched':
      return { title: 'effect dispatched', detail: jsonNumberText(payload.attempt) }
    case 'runtime.effect.worker.started':
      return { title: 'worker started effect', detail: jsonNumberText(payload.attempt) }
    case 'runtime.effect.heartbeat':
      return { title: 'effect heartbeat', detail: jsonNumberText(payload.attempt) }
    case 'runtime.effect.completed':
      return { title: 'effect completed', detail: jsonNumberText(payload.attempt) }
    case 'runtime.effect.cancel.requested':
      return { title: 'effect cancellation requested', detail: jsonNumberText(payload.attempt) }
    case 'runtime.effect.cancelled':
      return { title: 'effect cancelled', detail: jsonNumberText(payload.attempt) }
    case 'runtime.effect.timed_out':
      return { title: 'effect timed out', detail: jsonText(payload.timeout) }
    case 'runtime.effect.ambiguous':
      return { title: 'effect outcome ambiguous', detail: jsonText(payload.error) }
    case 'runtime.effect.retry.scheduled':
      return { title: 'effect retry scheduled', detail: jsonText(payload.error) }
    case 'runtime.snapshot.taken':
      return { title: 'snapshot', detail: `seq ${jsonNumberText(payload.seq) ?? ''}` }
    case 'runtime.signal.received':
      return { title: 'signal', detail: compactJson(event.payload) }
    case 'runtime.thread.cancel.requested':
      return { title: 'thread cancellation requested', detail: jsonText(payload.threadId) }

    default: {
      const exhaustiveType: never = event.type
      return { title: 'event', detail: compactJson(jsonFields(exhaustiveType)) }
    }
  }
}
