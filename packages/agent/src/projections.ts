import { defineProjection, type EventEnvelope } from '@looms/core'
import { Predicate } from 'effect'
import type { Message, TokenUsage } from './types'

function payloadObject(event: EventEnvelope): { [key: string]: import('@looms/core').JsonValue } {
  if (!Predicate.isObject(event.payload)) return {}
  return event.payload
}

export const conversation = defineProjection<{ lines: Message[] }>({
  name: 'conversation',
  initialState: { lines: [] },
  reduce(state, event) {
    switch (event.type) {
      case 'agent.message.received':
      case 'agent.message':
      case 'agent.steered': {
        const payload = payloadObject(event)
        const raw = payload.message
        if (!Predicate.isObject(raw)) return state
        const role = Predicate.isString(raw.role) ? raw.role : 'user'
        const line: Message = {
          role: role === 'system' || role === 'assistant' || role === 'tool' ? role : 'user',
          content: Predicate.isString(raw.content) ? raw.content : '',
        }
        if (Predicate.isString(raw.toolCallId)) line.toolCallId = raw.toolCallId
        if (Predicate.isString(raw.name)) line.name = raw.name
        const calls = raw.toolCalls
        if (Array.isArray(calls)) {
          const toolCalls: Message['toolCalls'] = []
          for (const item of calls) {
            if (!Predicate.isObject(item) || !Predicate.isString(item.id) || !Predicate.isString(item.name)) continue
            toolCalls.push({ id: item.id, name: item.name, arguments: item.arguments ?? null })
          }
          if (toolCalls.length > 0) line.toolCalls = toolCalls
        }
        return { lines: [...state.lines, line] }
      }
      case 'agent.tool.result': {
        const payload = payloadObject(event)
        const error = payload.error
        const content =
          Predicate.isString(error) && error.length > 0 ? error : JSON.stringify(payload.result ?? null)
        return {
          lines: [
            ...state.lines,
            {
              role: 'tool',
              content,
              toolCallId: Predicate.isString(payload.toolCallId) ? payload.toolCallId : undefined,
              name: Predicate.isString(payload.name) ? payload.name : undefined,
            },
          ],
        }
      }
      default:
        return state
    }
  },
})

export const tokenUsage = defineProjection<TokenUsage>({
  name: 'tokenUsage',
  initialState: { input: 0, output: 0 },
  reduce(state, event) {
    if (event.type !== 'agent.message') return state
    const payload = payloadObject(event)
    const usage = payload.usage
    if (!Predicate.isObject(usage)) return state
    return {
      input: state.input + (Predicate.isNumber(usage.input) ? usage.input : 0),
      output: state.output + (Predicate.isNumber(usage.output) ? usage.output : 0),
    }
  },
})
