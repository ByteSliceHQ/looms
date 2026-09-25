import { isJsonNumber, isJsonObject, isJsonString, type JsonValue } from '@looms/core'
import { compactJson, type DebuggerEvent, type EventSummary } from '@looms/debugger'

function obj(value: JsonValue | null): { [key: string]: JsonValue } {
  return isJsonObject(value) ? value : {}
}

function text(value: JsonValue | undefined): string | undefined {
  return isJsonString(value) ? value : undefined
}

function numeric(value: JsonValue | undefined): string | undefined {
  return isJsonNumber(value) ? String(value) : undefined
}

function messageContent(payload: JsonValue | null): string | undefined {
  const message = obj(payload).message
  return isJsonObject(message) && isJsonString(message.content) ? message.content : undefined
}

function toolCallSummary(payload: JsonValue | null) {
  const call = obj(payload).toolCall

  if (!isJsonObject(call)) {
    return { name: 'tool', args: null }
  }

  return {
    name: isJsonString(call.name) ? call.name : 'tool',
    args: call.arguments ?? null,
  }
}

export function summarizeAgentEvent(event: DebuggerEvent): EventSummary | undefined {
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
    default:
      return undefined
  }
}
