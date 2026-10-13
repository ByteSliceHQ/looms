import { Predicate } from 'effect'

import { agentModule } from './scope'
import { closeOpenToolCalls } from './transcript'
import {
  ConversationSchema,
  TokenUsageSchema,
  TurnActivitySchema,
  type Message,
  type ToolCall,
} from './types'

export const conversation = agentModule.projection({
  name: 'conversation',
  shape: ConversationSchema,
  initialState: { lines: [] },
  reduce(state, event) {
    switch (event.type) {
      case 'agent.message.received':
      case 'agent.message':

      case 'agent.steered': {
        const raw = event.payload.message

        if (!raw) {
          return state
        }

        const role =
          raw.role === 'system' || raw.role === 'assistant' || raw.role === 'tool'
            ? raw.role
            : 'user'

        let toolCalls: ToolCall[] | undefined
        const calls = raw.toolCalls

        if (Array.isArray(calls)) {
          const collected: ToolCall[] = []

          for (const item of calls) {
            if (
              !Predicate.isObject(item) ||
              !Predicate.isString(item.id) ||
              !Predicate.isString(item.name)
            ) {
              continue
            }

            collected.push({ id: item.id, name: item.name, arguments: item.arguments ?? null })
          }

          if (collected.length > 0) {
            toolCalls = collected
          }
        }

        const line: Message = {
          role,
          content: Predicate.isString(raw.content) ? raw.content : '',
          toolCallId: raw.toolCallId ?? undefined,
          name: raw.name ?? undefined,
          toolCalls,
        }

        const interrupted = event.type === 'agent.steered' && event.payload.interrupt === true
        return { lines: [...(interrupted ? closeOpenToolCalls(state.lines) : state.lines), line] }
      }

      case 'agent.tool.result': {
        const { error, result, toolCallId, name } = event.payload

        const content =
          Predicate.isString(error) && error.length > 0 ? error : JSON.stringify(result ?? null)

        const toolLine: Message = {
          role: 'tool',
          content,
          toolCallId: toolCallId ?? undefined,
          name: name ?? undefined,
          toolCalls: undefined,
        }

        return {
          lines: [...state.lines, toolLine],
        }
      }

      case 'agent.turn.stopped':
        return { lines: closeOpenToolCalls(state.lines) }

      default:
        return state
    }
  },
})

/** Whether the run's root agent or session has a turn in progress that `stopAgentTurn` can end. */
export const turnActivity = agentModule.projection({
  name: 'turnActivity',
  shape: TurnActivitySchema,
  initialState: { rootThreadId: null, active: false },
  reduce(state, event) {
    if (event.type === 'runtime.run.started') {
      return { ...state, rootThreadId: event.payload.rootThreadId ?? null }
    }

    if (event.threadId === null || event.threadId !== state.rootThreadId) {
      return state
    }

    switch (event.type) {
      case 'runtime.thread.started':
        return { ...state, active: event.payload.kind === 'agent' }
      case 'agent.message.received':
      case 'agent.tool_call.requested':
      case 'agent.session.turn.started':
        return { ...state, active: true }
      case 'agent.steered':
        return event.payload.interrupt === true ? { ...state, active: true } : state
      case 'agent.message':
      case 'agent.turn.stopped':
      case 'runtime.thread.completed':
      case 'runtime.thread.failed':
      case 'runtime.thread.cancelled':
        return { ...state, active: false }
      case 'runtime.wait.satisfied':
        return Predicate.isObject(event.payload.tag) &&
          event.payload.tag.kind === 'agent-session-turn'
          ? { ...state, active: false }
          : state
      default:
        return state
    }
  },
})

export const tokenUsage = agentModule.projection({
  name: 'tokenUsage',
  shape: TokenUsageSchema,
  initialState: { input: 0, output: 0 },
  reduce(state, event) {
    if (event.type !== 'agent.message') {
      return state
    }

    const usage = event.payload.usage

    if (!usage) {
      return state
    }

    return {
      input: state.input + (Predicate.isNumber(usage.input) ? usage.input : 0),
      output: state.output + (Predicate.isNumber(usage.output) ? usage.output : 0),
    }
  },
})
