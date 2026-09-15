import {
  isJsonNumber,
  isJsonObject,
  isJsonString,
  isProtocolType,
  type JsonValue,
} from '@looms/core'

import type { DebuggerEvent } from '../contracts'
import { compactJson } from '../lib/cn'
import type { EventSummary } from './family'

function obj(value: JsonValue | null): { [key: string]: JsonValue } {
  return isJsonObject(value) ? value : {}
}

function text(value: JsonValue | undefined): string | undefined {
  return isJsonString(value) ? value : undefined
}

function numeric(value: JsonValue | undefined): string | undefined {
  return isJsonNumber(value) ? String(value) : undefined
}

export function summarizeProtocolEvent(event: DebuggerEvent): EventSummary | undefined {
  if (!isProtocolType(event.type)) {
    return undefined
  }

  const payload = obj(event.payload)

  switch (event.type) {
    case 'runtime.run.started':
      return {
        title: 'run started',
        detail: `${text(payload.kind) ?? 'run'}:${text(payload.definitionName) ?? 'unknown'}`,
      }
    case 'runtime.run.completed':
      return {
        title: text(payload.error) ? 'run failed' : 'run completed',
        detail: text(payload.error) ?? compactJson(payload.output ?? null),
      }
    case 'runtime.thread.started':
      return {
        title: 'thread started',
        detail: `${text(payload.kind) ?? 'thread'}:${text(payload.definitionName) ?? 'unknown'}`,
      }
    case 'runtime.thread.completed':
      return { title: 'thread completed', detail: compactJson(payload.output ?? null) }
    case 'runtime.thread.failed':
      return { title: 'thread failed', detail: text(payload.error) }
    case 'runtime.thread.cancelled':
      return { title: 'thread cancelled', detail: text(payload.reason) }

    case 'runtime.wait.registered': {
      const on = obj(payload.on ?? null)
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
      const waited = obj(payload.event ?? null)
      return { title: 'wait satisfied', detail: text(waited.type) }
    }

    case 'runtime.timer.set':
      return { title: 'timer set', detail: numeric(payload.wakeAt) }
    case 'runtime.timer.fired':
      return { title: 'timer fired' }
    case 'runtime.effect.failed':
      return { title: 'effect failed', detail: text(payload.error) }
    case 'runtime.snapshot.taken':
      return { title: 'snapshot', detail: `seq ${numeric(payload.seq) ?? ''}` }
    case 'runtime.signal.received':
      return { title: 'signal', detail: compactJson(event.payload) }

    default: {
      const exhaustiveType: never = event.type
      return { title: 'event', detail: compactJson(obj(exhaustiveType)) }
    }
  }
}
