import {
  asJson,
  createWaitId,
  defineThread,
  emit,
  invoke,
  spawn,
  wait,
  type EventEnvelope,
  type JsonValue,
  type RuntimeEffect,
} from '@looms/core'
import { Predicate } from 'effect'
import type { AgentState, Message, ToolCall } from './types'

function asObject(payload: JsonValue): { [key: string]: JsonValue } {
  if (!Predicate.isObject(payload)) return {}
  return payload
}

function readString(obj: { [key: string]: JsonValue }, key: string): string | undefined {
  const value = obj[key]
  return Predicate.isString(value) ? value : undefined
}

function readNumber(obj: { [key: string]: JsonValue }, key: string): number | undefined {
  const value = obj[key]
  return Predicate.isNumber(value) ? value : undefined
}

function inputToLine(input: JsonValue): Message | null {
  if (input === null) return null
  if (Predicate.isString(input)) return { role: 'user', content: input }
  if (Predicate.isObject(input) && Predicate.isString(input.text)) {
    return { role: 'user', content: input.text }
  }
  return { role: 'user', content: JSON.stringify(input) }
}

function readToolCalls(raw: { [key: string]: JsonValue }): ToolCall[] | undefined {
  const calls = raw.toolCalls
  if (!Array.isArray(calls)) return undefined
  const listed: ToolCall[] = []
  for (const item of calls) {
    if (!Predicate.isObject(item)) continue
    const id = readString(item, 'id')
    const name = readString(item, 'name')
    if (!id || !name) continue
    listed.push({ id, name, arguments: item.arguments ?? null })
  }
  return listed.length > 0 ? listed : undefined
}

function readMessage(obj: { [key: string]: JsonValue }): Message {
  const raw = obj.message
  if (!Predicate.isObject(raw)) return { role: 'user', content: '' }
  const role = readString(raw, 'role')
  const message: Message = {
    role: role === 'system' || role === 'assistant' || role === 'tool' ? role : 'user',
    content: readString(raw, 'content') ?? '',
  }
  const toolCallId = readString(raw, 'toolCallId')
  const name = readString(raw, 'name')
  const toolCalls = readToolCalls(raw)
  if (toolCallId) message.toolCallId = toolCallId
  if (name) message.name = name
  if (toolCalls) message.toolCalls = toolCalls
  return message
}

function attachToolCall(lines: Message[], toolCall: ToolCall): Message[] {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index]
    if (line?.role !== 'assistant') continue
    const existing = line.toolCalls ?? []
    if (existing.some((item) => item.id === toolCall.id)) return lines
    const next = [...lines]
    next[index] = { ...line, toolCalls: [...existing, toolCall] }
    return next
  }
  return lines
}

function readToolCall(obj: { [key: string]: JsonValue }): ToolCall {
  const raw = obj.toolCall
  if (!Predicate.isObject(raw)) return { id: '', name: '', arguments: null }
  return {
    id: readString(raw, 'id') ?? '',
    name: readString(raw, 'name') ?? '',
    arguments: raw.arguments ?? null,
  }
}

export const agentThread = defineThread<AgentState>({
  kind: 'agent',
  initialState: (ctx) => ({
    lines: [],
    pendingToolCalls: [],
    turn: 0,
    maxTurns: 20,
    pendingSteer: null,
    input: ctx.input,
    output: null,
  }),
  reduce(state, event, ctx) {
    switch (event.type) {
      case 'runtime.thread.started': {
        const line = inputToLine(state.input)
        const lines = line ? [line] : state.lines
        return {
          state: { ...state, lines },
          effects: [invoke('agent.callLLM', { turn: 1 })],
        }
      }
      case 'agent.message.received': {
        const payload = asObject(event.payload)
        const message = readMessage(payload)
        const lines = [...state.lines, message]
        if (state.pendingToolCalls.length > 0) {
          return { state: { ...state, lines } }
        }
        return {
          state: { ...state, lines },
          effects: [invoke('agent.callLLM', { turn: state.turn + 1 })],
        }
      }
      case 'agent.turn.started': {
        const payload = asObject(event.payload)
        return {
          state: {
            ...state,
            turn: readNumber(payload, 'turn') ?? state.turn + 1,
            pendingSteer: null,
          },
        }
      }
      case 'agent.message': {
        const payload = asObject(event.payload)
        return { state: { ...state, lines: [...state.lines, readMessage(payload)] } }
      }
      case 'agent.tool_call.requested': {
        const payload = asObject(event.payload)
        const toolCall = readToolCall(payload)
        return {
          state: {
            ...state,
            lines: attachToolCall(state.lines, toolCall),
            pendingToolCalls: [...state.pendingToolCalls, toolCall],
          },
          effects: [
            invoke(
              'agent.executeTool',
              asJson({
                turn: readNumber(payload, 'turn') ?? state.turn,
                toolCall,
              }),
            ),
          ],
        }
      }
      case 'agent.tool.result': {
        const payload = asObject(event.payload)
        const toolCallId = readString(payload, 'toolCallId') ?? ''
        const pendingToolCalls = state.pendingToolCalls.filter((item) => item.id !== toolCallId)
        const error = payload.error
        const content = Predicate.isString(error) && error.length > 0 ? error : JSON.stringify(payload.result ?? null)
        const next: AgentState = {
          ...state,
          pendingToolCalls,
          lines: [
            ...state.lines,
            {
              role: 'tool',
              content,
              toolCallId,
              name: readString(payload, 'name'),
            },
          ],
        }
        if (pendingToolCalls.length === 0) {
          return { state: next, effects: [invoke('agent.callLLM', { turn: state.turn + 1 })] }
        }
        return { state: next }
      }
      case 'agent.steered': {
        const payload = asObject(event.payload)
        const message = readMessage(payload)
        let next: AgentState = {
          ...state,
          lines: [...state.lines, message],
          pendingSteer: message,
        }
        if (payload.interrupt === true) {
          next = { ...next, pendingToolCalls: [] }
          return {
            state: next,
            effects: [invoke('agent.callLLM', { turn: state.turn + 1 })],
          }
        }
        return { state: next }
      }
      case 'agent.spawn.requested': {
        const payload = asObject(event.payload)
        const childThreadId = readString(payload, 'childThreadId')
        const kind = readString(payload, 'kind')
        const definitionName = readString(payload, 'definitionName')
        const toolCallId = readString(payload, 'toolCallId')
        if (!childThreadId || !kind || !definitionName || !toolCallId) return { state }
        const waitId = createWaitId()
        return {
          state,
          effects: [
            spawn({
              childThreadId,
              kind,
              definitionName,
              input: payload.input ?? null,
            }),
            wait({
              waitId,
              on: { type: 'runtime.thread.completed', match: { threadId: childThreadId } },
              tag: { toolCallId, name: definitionName },
            }),
            wait({
              waitId: `${waitId}_fail`,
              on: { type: 'runtime.thread.failed', match: { threadId: childThreadId } },
              tag: { toolCallId, name: definitionName },
            }),
          ],
        }
      }
      case 'agent.effects.requested': {
        const payload = asObject(event.payload)
        const toolCallId = readString(payload, 'toolCallId') ?? ''
        const rawEffects = payload.effects
        // SAFETY: handler serialized RuntimeEffect values into the event payload.
        const effects: RuntimeEffect[] = Array.isArray(rawEffects)
          ? (rawEffects as RuntimeEffect[])
          : []
        const waitOn = payload.waitOn
        if (Predicate.isObject(waitOn) && Predicate.isString(waitOn.type)) {
          effects.push(
            wait({
              waitId: createWaitId(),
              on: { type: waitOn.type, match: waitOn.match },
              tag: { toolCallId },
            }),
          )
        }
        return { state, effects }
      }
      case 'runtime.wait.satisfied': {
        const payload = asObject(event.payload)
        const tag = payload.tag
        if (!Predicate.isObject(tag)) return { state }
        const toolCallId = readString(tag, 'toolCallId')
        if (!toolCallId) return { state }
        const embedded = payload.event
        const embeddedObj =
          Predicate.isObject(embedded) && Predicate.isObject(embedded.payload) ? embedded.payload : {}
        const threadId = ctx.threadId
        return {
          state,
          effects: [
            emit({
              type: 'agent.tool.result',
              payload: {
                turn: state.turn,
                toolCallId,
                name: readString(tag, 'name') ?? 'child',
                result: embeddedObj.output ?? (Predicate.isObject(embedded) ? embedded.payload : null) ?? null,
                error: readString(embeddedObj, 'error') ?? null,
              },
              threadId,
            }),
          ],
        }
      }
      default:
        return { state }
    }
  },
})

export function satisfiedToToolResult(event: EventEnvelope): RuntimeEffect | null {
  const payload = asObject(event.payload)
  const tag = payload.tag
  if (!Predicate.isObject(tag)) return null
  const toolCallId = readString(tag, 'toolCallId')
  if (!toolCallId) return null
  const embedded = payload.event
  const embeddedPayload = Predicate.isObject(embedded) && Predicate.isObject(embedded.payload) ? embedded.payload : {}
  const threadId = event.threadId ?? null
  return emit({
    type: 'agent.tool.result',
    payload: {
      turn: 0,
      toolCallId,
      name: readString(tag, 'name') ?? 'child',
      result: embeddedPayload.output ?? (Predicate.isObject(embedded) ? embedded.payload : null) ?? null,
      error: readString(embeddedPayload, 'error') ?? null,
    },
    threadId,
  })
}
