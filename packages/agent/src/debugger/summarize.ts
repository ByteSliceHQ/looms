import { isJsonObject, isJsonString, type JsonValue } from '@looms/core'
import {
  compactJson,
  jsonFields,
  jsonNumberText,
  jsonText,
  type DebuggerEvent,
  type EventSummary,
} from '@looms/debugger'

function messageContent(payload: JsonValue | null): string | undefined {
  const message = jsonFields(payload).message
  return isJsonObject(message) && isJsonString(message.content) ? message.content : undefined
}

function toolCallSummary(payload: JsonValue | null) {
  const call = jsonFields(payload).toolCall

  if (!isJsonObject(call)) {
    return { name: 'tool', args: null }
  }

  return {
    name: isJsonString(call.name) ? call.name : 'tool',
    args: call.arguments ?? null,
  }
}

export function summarizeAgentEvent(event: DebuggerEvent): EventSummary | undefined {
  const payload = jsonFields(event.payload)

  switch (event.type) {
    case 'agent.message.received':
      return { title: 'user message', detail: messageContent(event.payload) }
    case 'agent.turn.started':
      return { title: 'turn started', detail: `turn ${jsonNumberText(payload.turn) ?? ''}` }
    case 'agent.turn.text_delta':
      return { title: 'text delta', detail: jsonText(payload.delta) }
    case 'agent.message':
      return { title: 'agent message', detail: messageContent(event.payload) }

    case 'agent.tool_call.requested': {
      const call = toolCallSummary(event.payload)
      return { title: `tool ${call.name}`, detail: compactJson(call.args) }
    }

    case 'agent.tool.result':
      return {
        title: jsonText(payload.error)
          ? `tool error ${jsonText(payload.name)}`
          : `tool result ${jsonText(payload.name)}`,
        detail: jsonText(payload.error) ?? compactJson(payload.result ?? null),
      }
    case 'agent.steered':
      return { title: 'steered', detail: messageContent(event.payload) }
    case 'agent.spawn.requested':
      return {
        title: 'agent spawn',
        detail: `${jsonText(payload.kind) ?? 'agent'}:${jsonText(payload.definitionName) ?? 'unknown'}`,
      }
    case 'agent.effects.requested':
      return { title: 'agent effects', detail: jsonText(payload.toolCallId) }
    default:
      return undefined
  }
}
