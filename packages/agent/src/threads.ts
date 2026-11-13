import { Predicate } from 'effect'

import {
  cancel,
  createWaitId,
  DEFAULT_DEFINITION_VERSION,
  emit,
  invoke,
  isJsonObject,
  isWithdrawnError,
  parseEffectId,
  spawn,
  wait,
  waitOutcome,
  type EventEnvelope,
  type JsonValue,
  type RuntimeEffect,
} from '@looms/core'

import { STRUCTURED_OUTPUT_TOOL_NAME } from './definitions'
import { callLlmEffect, executeToolEffect } from './effects'
import { agentModule } from './scope'
import { closeOpenToolCalls, insertToolResult } from './transcript'
import type { AgentState, Message, ToolCall } from './types'

function inputToLine(input: JsonValue): Message | null {
  if (input === null) {
    return null
  }

  if (Predicate.isString(input)) {
    return { role: 'user', content: input }
  }

  if (Predicate.isObject(input)) {
    if (Predicate.isString(input.text)) {
      return { role: 'user', content: input.text }
    }

    if (Predicate.isString(input.task)) {
      return { role: 'user', content: input.task }
    }

    if (Predicate.isString(input.topic)) {
      return { role: 'user', content: input.topic }
    }

    if (Predicate.isString(input.prompt)) {
      return { role: 'user', content: input.prompt }
    }
  }

  return { role: 'user', content: JSON.stringify(input) }
}

function attachToolCall(lines: readonly Message[], toolCall: ToolCall): Message[] {
  const index = lines.findLastIndex((line) => line.role === 'assistant')
  const line = lines[index]

  if (!line || line.toolCalls?.some((item) => item.id === toolCall.id)) {
    return [...lines]
  }

  return lines.with(index, { ...line, toolCalls: [...(line.toolCalls ?? []), toolCall] })
}

/** Schedule another LLM turn only when no tool calls are still open. */
function wakeIfIdle(state: Pick<AgentState, 'pendingToolCalls'>): boolean {
  return state.pendingToolCalls.length === 0
}

/** Drop the turn in progress: answer its open tool calls and cancel the children they started. */
function abandonTurn(state: AgentState): AgentState {
  return {
    ...state,
    lines: closeOpenToolCalls(state.lines),
    pendingSteer: null,
    pendingToolCalls: [],
    executingToolCalls: [],
    pendingSpawns: [],
    pendingEffects: [],
    pendingEmits: [],
    pendingEffectTools: {},
    needsLlmCall: false,
    deferWake: false,
    midCallMessages: [],
    abandonedChildThreadIds: [
      ...(state.abandonedChildThreadIds ?? []),
      ...state.pendingSpawns.map((item) => item.childThreadId),
    ],
  }
}

export const agentThread = agentModule.thread<AgentState>({
  kind: 'agent',
  initialState: (ctx): AgentState => ({
    definitionName: ctx.definitionName,
    definitionVersion: ctx.definitionVersion,
    lines: [],
    pendingToolCalls: [],
    executingToolCalls: [],
    pendingSpawns: [],
    pendingEffects: [],
    pendingEmits: [],
    needsLlmCall: false,
    turn: 0,
    maxTurns: 20,
    depth: 0,
    structuredOutput: null,
    alreadyCompactedTurns: [],
    pendingSteer: null,
    input: ctx.input,
    output: null,
    pendingEffectTools: {},
    consumedSteerMessageIds: [],
    deferWake: false,
    midCallMessages: [],
  }),
  step(state, event, ctx) {
    switch (event.type) {
      case 'runtime.thread.started': {
        const payload = event.payload
        const defName = payload.definitionName || state.definitionName

        const defVersion =
          payload.definitionVersion ?? state.definitionVersion ?? DEFAULT_DEFINITION_VERSION

        // SAFETY: event payload input is JSON
        const input = payload.input !== undefined ? payload.input : state.input
        const line = inputToLine(input)
        const lines = line ? [line] : state.lines

        return {
          ...state,
          definitionName: defName,
          definitionVersion: defVersion,
          input,
          lines,
          needsLlmCall: true,
        }
      }

      case 'agent.lineage':
        return { ...state, depth: event.payload.depth }

      case 'agent.turn.started': {
        // Mid-call steers are already in `lines` when this fires (first event of the batch).
        // Defer the wake until `agent.turn.settled` so we do not schedule the next LLM before
        // `agent.message` / tool-call events from this same turn are applied. Snapshot the
        // extras so compaction can re-attach them instead of losing the steer.
        const messageCount = event.payload.messageCount ?? state.lines.length
        const midCallMessages = state.lines.slice(messageCount)
        const arrivedMidCall = midCallMessages.length > 0

        return {
          ...state,
          turn: event.payload.turn,
          needsLlmCall: false,
          deferWake: arrivedMidCall,
          midCallMessages: arrivedMidCall ? midCallMessages : [],
          // This call never saw a user message that arrived while it ran, so that message's
          // turn count starts after it.
          turnsBeforeMessage: midCallMessages.some((line) => line.role === 'user')
            ? event.payload.turn
            : state.turnsBeforeMessage,
          pendingSteer: null,
          abandonedChildThreadIds: [],
        }
      }

      case 'agent.turn.settled': {
        const deferWake = state.deferWake === true
        return {
          ...state,
          deferWake: false,
          midCallMessages: [],
          needsLlmCall: deferWake && wakeIfIdle(state),
        }
      }

      case 'agent.message.received': {
        const message = event.payload.message
        return {
          ...state,
          lines: [...state.lines, message],
          needsLlmCall: wakeIfIdle(state),
          turnsBeforeMessage: state.turn,
        }
      }

      case 'agent.message': {
        return { ...state, lines: [...state.lines, event.payload.message] }
      }

      case 'agent.tool_call.requested': {
        const { toolCall } = event.payload
        return {
          ...state,
          lines: attachToolCall(state.lines, toolCall),
          pendingToolCalls: [...state.pendingToolCalls, toolCall],
          executingToolCalls: [...state.executingToolCalls, toolCall],
          needsLlmCall: false,
        }
      }

      case 'agent.tool.result': {
        const { toolCallId, name, result, error } = event.payload
        const pendingToolCalls = state.pendingToolCalls.filter((item) => item.id !== toolCallId)
        const executingToolCalls = state.executingToolCalls.filter((item) => item.id !== toolCallId)
        const pendingSpawns = state.pendingSpawns.filter((item) => item.toolCallId !== toolCallId)
        const pendingEffects = state.pendingEffects.filter((item) => item.toolCallId !== toolCallId)
        const pendingEmits = state.pendingEmits.filter((item) => item.id !== `res_${toolCallId}`)

        const content =
          Predicate.isString(error) && error.length > 0 ? error : JSON.stringify(result ?? null)

        let structuredOutput = state.structuredOutput

        if (name === STRUCTURED_OUTPUT_TOOL_NAME && !error && result !== null) {
          structuredOutput =
            isJsonObject(result) && 'output' in result ? (result.output ?? null) : result
        }

        const lines = insertToolResult(state.lines, {
          role: 'tool',
          content,
          toolCallId,
          name: name ?? undefined,
        })

        return {
          ...state,
          lines,
          structuredOutput,
          pendingToolCalls,
          executingToolCalls,
          pendingSpawns,
          pendingEffects,
          pendingEmits,
          needsLlmCall: wakeIfIdle({ pendingToolCalls }),
        }
      }

      case 'agent.steered': {
        const message = event.payload.message
        const interrupt = event.payload.interrupt ?? false
        const messageId = event.payload.messageId

        const consumedSteerMessageIds =
          messageId && !state.consumedSteerMessageIds.includes(messageId)
            ? [...state.consumedSteerMessageIds, messageId]
            : state.consumedSteerMessageIds

        if (interrupt) {
          const abandoned = abandonTurn(state)

          return {
            ...abandoned,
            lines: [...abandoned.lines, message],
            pendingSteer: message,
            needsLlmCall: true,
            consumedSteerMessageIds,
            turnsBeforeMessage: state.turn,
          }
        }

        // Queue for the next turn. If the agent is idle (no open tool calls), that turn
        // starts now. Otherwise the message waits: tool results are inserted ahead of it
        // (`insertToolResult`), and the turn starts once the last one lands.
        return {
          ...state,
          lines: [...state.lines, message],
          pendingSteer: message,
          needsLlmCall: wakeIfIdle(state),
          consumedSteerMessageIds,
          turnsBeforeMessage: state.turn,
        }
      }

      case 'agent.context.compacted': {
        const compactedMessages = event.payload.messages
        const midCallMessages = state.midCallMessages ?? []

        const alreadyCompactedTurns = state.alreadyCompactedTurns
          ? [...state.alreadyCompactedTurns, event.payload.turn]
          : [event.payload.turn]

        const baseLines = compactedMessages ? [...compactedMessages] : state.lines

        return {
          ...state,
          // Compaction replaces `lines`; put mid-call steers back so the deferred wake still
          // has something new to answer.
          lines: midCallMessages.length > 0 ? [...baseLines, ...midCallMessages] : baseLines,
          alreadyCompactedTurns,
        }
      }

      case 'agent.turn.stopped':
        return abandonTurn(state)

      case 'agent.spawn.requested': {
        const { childThreadId, kind, definitionName, definitionVersion, toolCallId, input, depth } =
          event.payload

        return {
          ...state,
          executingToolCalls: state.executingToolCalls.filter((item) => item.id !== toolCallId),
          pendingSpawns: [
            ...state.pendingSpawns.filter((item) => item.toolCallId !== toolCallId),
            {
              childThreadId,
              kind,
              definitionName,
              definitionVersion,
              toolCallId,
              // SAFETY: schema-decoded input is JSON
              input: input ?? null,
              depth: depth ?? state.depth + 1,
            },
          ],
        }
      }

      case 'agent.effects.requested': {
        const { toolCallId, effects: rawEffects, waitOn } = event.payload

        const effects: RuntimeEffect[] = Array.isArray(rawEffects) ? [...rawEffects] : []

        const taggedEffects = effects.map((effect, idx) => {
          if (!('tag' in effect && Predicate.isString(effect.tag))) {
            return { ...effect, tag: `${toolCallId}_${effect.type}_${idx}` }
          }

          return effect
        })

        const pending = state.executingToolCalls.find((item) => item.id === toolCallId)

        const effectToolEntries: [string, { toolCallId: string; name: string }][] = [
          [String(event.seq), { toolCallId, name: pending?.name ?? 'tool' }],
          [toolCallId, { toolCallId, name: pending?.name ?? 'tool' }],
        ]

        for (const eff of taggedEffects) {
          if ('tag' in eff && Predicate.isString(eff.tag)) {
            effectToolEntries.push([eff.tag, { toolCallId, name: pending?.name ?? 'tool' }])
          }
        }

        return {
          ...state,
          executingToolCalls: state.executingToolCalls.filter((item) => item.id !== toolCallId),
          pendingEffects: [
            ...state.pendingEffects.filter((item) => item.toolCallId !== toolCallId),
            {
              toolCallId,
              effects: taggedEffects,
              waitOn: waitOn
                ? {
                    type: waitOn.type,
                    match: waitOn.match ?? undefined,
                  }
                : undefined,
            },
          ],
          pendingEffectTools: {
            ...state.pendingEffectTools,
            ...Object.fromEntries(effectToolEntries),
          },
        }
      }

      case 'runtime.effect.failed': {
        const payload = event.payload
        const error = payload.error || 'effect failed'

        if (isWithdrawnError(error)) {
          return state
        }

        const parsed = event.effectId ? parseEffectId(event.effectId) : null
        const tag = parsed?.tag
        const causingKey = parsed?.causingSeq !== undefined ? String(parsed.causingSeq) : ''

        const pending =
          (tag ? state.pendingEffectTools?.[tag] : undefined) ??
          (causingKey ? state.pendingEffectTools?.[causingKey] : undefined) ??
          (() => {
            const match = state.pendingEffects.find(
              (item) =>
                item.effects.some((e) => 'tag' in e && e.tag === tag) ||
                (tag !== undefined && tag.startsWith(item.toolCallId)),
            )

            return match ? { toolCallId: match.toolCallId, name: 'tool' } : undefined
          })()

        if (!pending) {
          return state
        }

        const rest: { [key: string]: { toolCallId: string; name: string } } = {}

        for (const [key, val] of Object.entries(state.pendingEffectTools ?? {})) {
          if (val.toolCallId !== pending.toolCallId) {
            rest[key] = val
          }
        }

        return {
          ...state,
          pendingEffectTools: rest,
          pendingEffects: state.pendingEffects.filter(
            (item) => item.toolCallId !== pending.toolCallId,
          ),
          pendingEmits: [
            ...state.pendingEmits.filter((item) => item.id !== `res_${pending.toolCallId}`),
            {
              id: `res_${pending.toolCallId}`,
              event: {
                type: 'agent.tool.result',
                payload: {
                  turn: state.turn,
                  toolCallId: pending.toolCallId,
                  name: pending.name,
                  result: null,
                  error,
                },
                threadId: ctx.threadId,
              },
            },
          ],
        }
      }

      case 'runtime.wait.satisfied': {
        if (!Predicate.isObject(event.payload)) {
          return state
        }

        const tag = event.payload.tag

        if (!Predicate.isObject(tag)) {
          return state
        }

        const toolCallId = Predicate.isString(tag.toolCallId) ? tag.toolCallId : undefined

        if (!toolCallId) {
          return state
        }

        const threadId = ctx.threadId
        const name = Predicate.isString(tag.name) ? tag.name : 'child'
        const { result, error } = waitOutcome(event.payload.event, tag)

        return {
          ...state,
          pendingSpawns: state.pendingSpawns.filter((item) => item.toolCallId !== toolCallId),
          pendingEffects: state.pendingEffects.filter((item) => item.toolCallId !== toolCallId),
          pendingEmits: [
            ...state.pendingEmits.filter((item) => item.id !== `res_${toolCallId}`),
            {
              id: `res_${toolCallId}`,
              event: {
                type: 'agent.tool.result',
                payload: {
                  turn: state.turn,
                  toolCallId,
                  name,
                  result,
                  error,
                },
                threadId,
              },
            },
          ],
        }
      }

      default:
        return state
    }
  },
  effects(state, ctx) {
    const effects: RuntimeEffect[] = []

    if (state.needsLlmCall) {
      effects.push(
        invoke(
          callLlmEffect,
          {
            turn: state.turn + 1,
            messageTurn: state.turn + 1 - (state.turnsBeforeMessage ?? 0),
            definitionName: state.definitionName,
            definitionVersion: state.definitionVersion ?? DEFAULT_DEFINITION_VERSION,
            messages: state.lines,
            input: state.input,
            structuredOutput: state.structuredOutput,
            alreadyCompacted: (state.alreadyCompactedTurns ?? []).includes(state.turn + 1),
            consumedSteerMessageIds: state.consumedSteerMessageIds,
          },
          `llm_turn_${state.turn + 1}`,
        ),
      )
    }

    for (const toolCall of state.executingToolCalls) {
      effects.push(
        invoke(
          executeToolEffect,
          {
            turn: state.turn,
            definitionName: state.definitionName,
            definitionVersion: state.definitionVersion ?? DEFAULT_DEFINITION_VERSION,
            toolCall,
            input: state.input,
            depth: state.depth,
          },
          `tool_${toolCall.id}`,
        ),
      )
    }

    for (const spawnReq of state.pendingSpawns) {
      const waitId = createWaitId(ctx.threadId, `spawn_${spawnReq.childThreadId}`)

      effects.push(
        spawn({
          childThreadId: spawnReq.childThreadId,
          kind: spawnReq.kind,
          definitionName: spawnReq.definitionName,
          definitionVersion: spawnReq.definitionVersion,
          input: spawnReq.input,
        }),
      )

      if (spawnReq.kind === 'agent') {
        effects.push(
          emit(
            {
              type: 'agent.lineage',
              payload: { depth: spawnReq.depth ?? state.depth + 1 },
              threadId: spawnReq.childThreadId,
            },
            `lineage_${spawnReq.childThreadId}`,
          ),
        )
      }

      effects.push(
        wait({
          waitId,
          on: {
            type: ['runtime.thread.completed', 'runtime.thread.failed'],
            match: { threadId: spawnReq.childThreadId },
          },
          tag: { toolCallId: spawnReq.toolCallId, name: spawnReq.definitionName },
        }),
      )
    }

    for (const effectReq of state.pendingEffects) {
      for (const eff of effectReq.effects) {
        effects.push(eff)
      }

      if (effectReq.waitOn) {
        effects.push(
          wait({
            waitId: createWaitId(ctx.threadId, `effects_${effectReq.toolCallId}`),
            on: { type: effectReq.waitOn.type, match: effectReq.waitOn.match },
            tag: { toolCallId: effectReq.toolCallId },
          }),
        )
      }
    }

    for (const emitReq of state.pendingEmits) {
      effects.push(emit(emitReq.event))
    }

    for (const childThreadId of state.abandonedChildThreadIds ?? []) {
      effects.push(cancel(childThreadId))
    }

    return effects
  },
})

export function satisfiedToToolResult(event: EventEnvelope): RuntimeEffect | null {
  if (!Predicate.isObject(event.payload)) {
    return null
  }

  const tag = event.payload.tag

  if (!Predicate.isObject(tag)) {
    return null
  }

  const toolCallId = Predicate.isString(tag.toolCallId) ? tag.toolCallId : undefined

  if (!toolCallId) {
    return null
  }

  const threadId = event.threadId ?? null
  const name = Predicate.isString(tag.name) ? tag.name : 'child'
  const { result, error } = waitOutcome(event.payload.event, tag)

  return emit({
    type: 'agent.tool.result',
    payload: {
      turn: 0,
      toolCallId,
      name,
      result,
      error,
    },
    threadId,
  })
}
