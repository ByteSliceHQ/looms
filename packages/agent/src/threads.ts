import { Predicate } from 'effect'

import {
  asJson,
  createWaitId,
  DEFAULT_DEFINITION_VERSION,
  emit,
  invoke,
  isWithdrawnError,
  parseEffectId,
  spawn,
  wait,
  type EventEnvelope,
  type JsonValue,
  type RuntimeEffect,
} from '@looms/core'

import { callLlmEffect, executeToolEffect } from './effects'
import { agentModule } from './scope'
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
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index]

    if (line?.role !== 'assistant') {
      continue
    }

    const existing = line.toolCalls ?? []

    if (existing.some((item) => item.id === toolCall.id)) {
      return [...lines]
    }

    const next = [...lines]
    next[index] = { ...line, toolCalls: [...existing, toolCall] }
    return next
  }

  return [...lines]
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
    pendingSteer: null,
    input: ctx.input,
    output: null,
    pendingEffectTools: {},
    consumedSteerMessageIds: [],
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

      case 'agent.turn.started': {
        return {
          ...state,
          turn: event.payload.turn,
          needsLlmCall: false,
          pendingSteer: null,
        }
      }

      case 'agent.message.received': {
        const message = event.payload.message
        const lines = [...state.lines, message]
        const needsLlmCall = state.pendingToolCalls.length === 0
        return {
          ...state,
          lines,
          needsLlmCall,
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

        const lines: Message[] = [
          ...state.lines,
          {
            role: 'tool',
            content,
            toolCallId,
            name: name ?? undefined,
          },
        ]

        const needsLlmCall = pendingToolCalls.length === 0
        return {
          ...state,
          lines,
          pendingToolCalls,
          executingToolCalls,
          pendingSpawns,
          pendingEffects,
          pendingEmits,
          needsLlmCall,
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
          return {
            ...state,
            lines: [...state.lines, message],
            pendingSteer: message,
            pendingToolCalls: [],
            executingToolCalls: [],
            pendingSpawns: [],
            pendingEffects: [],
            pendingEmits: [],
            needsLlmCall: true,
            consumedSteerMessageIds,
          }
        }

        return {
          ...state,
          lines: [...state.lines, message],
          pendingSteer: message,
          consumedSteerMessageIds,
        }
      }

      case 'agent.spawn.requested': {
        const { childThreadId, kind, definitionName, definitionVersion, toolCallId, input } =
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

        const embedded = event.payload.event

        const embeddedObj =
          Predicate.isObject(embedded) && Predicate.isObject(embedded.payload)
            ? embedded.payload
            : {}

        const threadId = ctx.threadId
        const name = Predicate.isString(tag.name) ? tag.name : 'child'
        const error = Predicate.isString(embeddedObj.error) ? embeddedObj.error : null

        const result = asJson(
          embeddedObj.output ?? (Predicate.isObject(embedded) ? embedded.payload : null) ?? null,
        )

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
            definitionName: state.definitionName,
            definitionVersion: state.definitionVersion ?? DEFAULT_DEFINITION_VERSION,
            messages: state.lines,
            input: state.input,
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

  const embedded = event.payload.event

  const embeddedPayload =
    Predicate.isObject(embedded) && Predicate.isObject(embedded.payload) ? embedded.payload : {}

  const threadId = event.threadId ?? null
  const name = Predicate.isString(tag.name) ? tag.name : 'child'
  const error = Predicate.isString(embeddedPayload.error) ? embeddedPayload.error : null

  const result = asJson(
    embeddedPayload.output ?? (Predicate.isObject(embedded) ? embedded.payload : null) ?? null,
  )

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
