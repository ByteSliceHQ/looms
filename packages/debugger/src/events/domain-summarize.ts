import { isJsonNumber, isJsonObject, isJsonString, type JsonValue } from '@looms/core'

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

type ToolCallSummary = {
  name: string
  args: JsonValue
}

function messageContent(payload: JsonValue | null): string | undefined {
  const message = obj(payload ?? null).message
  return isJsonObject(message) && isJsonString(message.content) ? message.content : undefined
}

function toolCallSummary(payload: JsonValue | null): ToolCallSummary {
  const call = obj(payload ?? null).toolCall

  if (!isJsonObject(call)) {
    return { name: 'tool', args: null }
  }

  const summary: ToolCallSummary = {
    name: isJsonString(call.name) ? call.name : 'tool',
    args: call.arguments ?? null,
  }

  return summary
}

export function summarizeDomainEvent(event: DebuggerEvent): EventSummary | undefined {
  const payload = obj(event.payload)

  switch (event.type) {
    case 'agent.message.received':
      return { title: 'user message', detail: messageContent(event.payload) }
    case 'agent.turn.started':
      return { title: 'turn started', detail: `turn ${numeric(payload.turn) ?? ''}` }
    case 'agent.turn.text_delta':
      return { title: 'text delta', detail: text(payload.delta) }
    case 'agent.message':
      return { title: 'agent message', detail: messageContent(event.payload) }

    case 'agent.tool_call.requested': {
      const call = toolCallSummary(event.payload)
      return { title: `tool ${call.name}`, detail: compactJson(call.args) }
    }

    case 'agent.tool.result':
      return {
        title: text(payload.error)
          ? `tool error ${text(payload.name)}`
          : `tool result ${text(payload.name)}`,
        detail: text(payload.error) ?? compactJson(payload.result ?? null),
      }
    case 'agent.steered':
      return { title: 'steered', detail: messageContent(event.payload) }
    case 'agent.spawn.requested':
      return {
        title: 'agent spawn',
        detail: `${text(payload.kind) ?? 'agent'}:${text(payload.definitionName) ?? 'unknown'}`,
      }
    case 'agent.effects.requested':
      return { title: 'agent effects', detail: text(payload.toolCallId) }
    case 'workflow.node.started':
      return { title: 'node started', detail: text(payload.nodeId) }
    case 'workflow.node.finished':
      return {
        title: text(payload.error) ? 'node failed' : 'node finished',
        detail:
          text(payload.error) ??
          `${text(payload.nodeId) ?? ''} ${compactJson(payload.result ?? null)}`,
      }
    case 'workflow.node.skipped':
      return {
        title: 'node skipped',
        detail: `${text(payload.nodeId) ?? ''} · ${text(payload.reason) ?? ''}`,
      }
    case 'workflow.spawn.requested':
      return {
        title: 'workflow spawn',
        detail: `${text(payload.definitionName) ?? 'unknown'} from ${text(payload.nodeId) ?? ''}`,
      }
    case 'workflow.sleep.requested':
      return { title: 'sleep', detail: text(payload.nodeId) }
    case 'workflow.effects.requested':
      return { title: 'workflow effects', detail: text(payload.nodeId) }
    case 'approval.requested':
      return { title: 'approval requested', detail: text(payload.title) }
    case 'approval.decided':
      return {
        title: `approval ${text(payload.outcome) ?? 'decided'}`,
        detail: text(payload.approvalId),
      }
    case 'approval.timed_out':
      return { title: 'approval timed out', detail: text(payload.approvalId) }
    case 'payments.charge.requested':
      return {
        title: 'charge requested',
        detail: `${numeric(payload.amount) ?? ''} ${text(payload.currency) ?? ''}`.trim(),
      }
    case 'payments.charge.authorized':
      return {
        title: 'charge authorized',
        detail: `${numeric(payload.amount) ?? ''} ${text(payload.currency) ?? ''}`.trim(),
      }
    case 'payments.charge.declined':
      return {
        title: 'charge declined',
        detail:
          `${numeric(payload.amount) ?? ''} ${text(payload.currency) ?? ''} · ${text(payload.reason) ?? ''}`.trim(),
      }
    default:
      return undefined
  }
}
