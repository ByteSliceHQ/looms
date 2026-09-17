import { compactJson } from '@/lib/utils'
import { isJsonObject, isJsonString, type JsonValue } from '@swirls/looms/core'
import {
  DEFAULT_FAMILIES,
  familyClass,
  familyFromPrefix,
  type EventStreamCatalog,
  type EventSummary,
} from '@swirls/looms/debugger'

import type { DemoEvents } from '../../runtime'

export type { EventFamily, EventSummary } from '@swirls/looms/debugger'
export { familyClass, familyFromPrefix as eventFamily }

function obj(value: JsonValue | null): { [key: string]: JsonValue } {
  return isJsonObject(value) ? value : {}
}

function text(value: JsonValue | undefined): string | undefined {
  return isJsonString(value) ? value : undefined
}

function messageContent(payload: JsonValue | null): string | undefined {
  const message = obj(payload ?? null).message

  if (!isJsonObject(message)) {
    return undefined
  }

  return isJsonString(message.content) ? message.content : undefined
}

type ToolCallSummary = {
  name: string
  args: JsonValue
}

function toolCallSummary(payload: JsonValue | null): ToolCallSummary {
  const call = obj(payload ?? null).toolCall

  if (!isJsonObject(call)) {
    return { name: 'tool', args: null }
  }

  return {
    name: isJsonString(call.name) ? call.name : 'tool',
    args: call.arguments ?? null,
  }
}

export function summarizeEvent(event: DemoEvents): EventSummary {
  switch (event.type) {
    case 'runtime.run.started':
      return {
        title: 'run started',
        detail: `${event.payload.kind}:${event.payload.definitionName}`,
      }
    case 'runtime.run.completed':
      return {
        title: event.payload.error ? 'run failed' : 'run completed',
        detail: event.payload.error ?? compactJson(event.payload.output),
      }
    case 'runtime.thread.started':
      return {
        title: 'thread started',
        detail: `${event.payload.kind}:${event.payload.definitionName}`,
      }
    case 'runtime.thread.completed':
      return { title: 'thread completed', detail: compactJson(event.payload.output) }
    case 'runtime.thread.failed':
      return { title: 'thread failed', detail: event.payload.error }
    case 'runtime.thread.cancelled':
      return { title: 'thread cancelled', detail: event.payload.reason }

    case 'runtime.wait.registered': {
      const on = event.payload.on

      const detail =
        'type' in on
          ? isJsonString(on.type)
            ? on.type
            : on.type.join(', ')
          : `timer ${on.timerAt}`

      return { title: 'wait registered', detail }
    }

    case 'runtime.wait.satisfied':
      return { title: 'wait satisfied', detail: event.payload.event.type }
    case 'runtime.timer.set':
      return { title: 'timer set', detail: String(event.payload.wakeAt) }
    case 'runtime.timer.fired':
      return { title: 'timer fired' }
    case 'runtime.effect.failed':
      return { title: 'effect failed', detail: event.payload.error }
    case 'runtime.snapshot.taken':
      return { title: 'snapshot', detail: `seq ${event.payload.seq}` }
    case 'runtime.signal.received':
      return { title: 'signal', detail: compactJson(event.payload) }
    case 'agent.message.received':
      return { title: 'user message', detail: messageContent(event.payload) }
    case 'agent.turn.started':
      return { title: 'turn started', detail: `turn ${event.payload.turn}` }
    case 'agent.turn.text_delta':
      return { title: 'text delta', detail: event.payload.delta }
    case 'agent.message':
      return { title: 'agent message', detail: messageContent(event.payload) }

    case 'agent.tool_call.requested': {
      const call = toolCallSummary(event.payload)
      return { title: `tool ${call.name}`, detail: compactJson(call.args) }
    }

    case 'agent.tool.result':
      return {
        title: event.payload.error
          ? `tool error ${event.payload.name}`
          : `tool result ${event.payload.name}`,
        detail: event.payload.error ?? compactJson(event.payload.result ?? null),
      }
    case 'agent.steered':
      return { title: 'steered', detail: messageContent(event.payload) }
    case 'agent.spawn.requested':
      return {
        title: 'agent spawn',
        detail: `${event.payload.kind}:${event.payload.definitionName}`,
      }
    case 'agent.effects.requested':
      return { title: 'agent effects', detail: event.payload.toolCallId }
    case 'workflow.node.started':
      return { title: 'node started', detail: event.payload.nodeId }
    case 'workflow.node.finished':
      return {
        title: event.payload.error ? 'node failed' : 'node finished',
        detail:
          event.payload.error ?? `${event.payload.nodeId} ${compactJson(event.payload.result)}`,
      }
    case 'workflow.node.skipped':
      return { title: 'node skipped', detail: `${event.payload.nodeId} · ${event.payload.reason}` }
    case 'workflow.spawn.requested':
      return {
        title: 'workflow spawn',
        detail: `${event.payload.definitionName} from ${event.payload.nodeId}`,
      }
    case 'workflow.sleep.requested':
      return { title: 'sleep', detail: event.payload.nodeId }
    case 'workflow.effects.requested':
      return { title: 'workflow effects', detail: event.payload.nodeId }
    case 'approval.requested':
      return { title: 'approval requested', detail: event.payload.title }
    case 'approval.decided':
      return { title: `approval ${event.payload.outcome}`, detail: event.payload.approvalId }
    case 'approval.timed_out':
      return { title: 'approval timed out', detail: event.payload.approvalId }
    case 'payments.charge.requested':
      return {
        title: 'charge requested',
        detail: `${event.payload.amount} ${event.payload.currency}`,
      }
    case 'payments.charge.authorized':
      return {
        title: 'charge authorized',
        detail: `${event.payload.amount} ${event.payload.currency}`,
      }
    case 'payments.charge.declined':
      return {
        title: 'charge declined',
        detail: `${event.payload.amount} ${event.payload.currency} · ${event.payload.reason}`,
      }

    default: {
      const exhaustiveCheck: never = event
      return { title: 'event', detail: compactJson(obj(exhaustiveCheck)) }
    }
  }
}

export function searchText(event: DemoEvents): string {
  const summary = summarizeEvent(event)
  return [
    event.type,
    event.threadId ?? '',
    summary.title,
    summary.detail ?? '',
    text(event.id) ?? '',
  ]
    .join(' ')
    .toLowerCase()
}

export const demoEventCatalog: EventStreamCatalog<DemoEvents> = {
  families: DEFAULT_FAMILIES,
  familyOf: familyFromPrefix,
  familyClass,
  summarize: summarizeEvent,
  searchText,
}
