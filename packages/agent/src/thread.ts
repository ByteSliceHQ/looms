import { Option, Predicate, Schema } from 'effect'

import {
  asJson,
  createWaitId,
  defineThread,
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

import {
  AgentEffectsRequestedPayloadSchema,
  AgentMessagePayloadSchema,
  AgentSpawnRequestedPayloadSchema,
  AgentSteeredPayloadSchema,
  AgentToolCallRequestedPayloadSchema,
  AgentToolResultPayloadSchema,
  AgentTurnStartedPayloadSchema,
  MessageSchema,
  type AgentState,
  type Message,
  type ToolCall,
} from './types'

const decodeMessagePayload = Schema.decodeUnknownOption(AgentMessagePayloadSchema)
const decodeMessageDirect = Schema.decodeUnknownOption(MessageSchema)
const decodeTurnStarted = Schema.decodeUnknownOption(AgentTurnStartedPayloadSchema)
const decodeToolCallRequested = Schema.decodeUnknownOption(AgentToolCallRequestedPayloadSchema)
const decodeToolResult = Schema.decodeUnknownOption(AgentToolResultPayloadSchema)
const decodeSteered = Schema.decodeUnknownOption(AgentSteeredPayloadSchema)
const decodeSpawnRequested = Schema.decodeUnknownOption(AgentSpawnRequestedPayloadSchema)
const decodeEffectsRequested = Schema.decodeUnknownOption(AgentEffectsRequestedPayloadSchema)

function inputToLine(input: JsonValue): Message | null {
  if (input === null) return null
  if (Predicate.isString(input)) return { role: 'user', content: input }
  if (Predicate.isObject(input)) {
    if (Predicate.isString(input.text)) return { role: 'user', content: input.text }
    if (Predicate.isString(input.task)) return { role: 'user', content: input.task }
    if (Predicate.isString(input.topic)) return { role: 'user', content: input.topic }
    if (Predicate.isString(input.prompt)) return { role: 'user', content: input.prompt }
  }
  return { role: 'user', content: JSON.stringify(input) }
}

function extractMessage(payload: JsonValue): Message {
  const asMsgPayload = decodeMessagePayload(payload)
  if (Option.isSome(asMsgPayload)) return asMsgPayload.value.message
  if (Predicate.isObject(payload)) {
    const raw = payload.message ?? payload
    const decoded = decodeMessageDirect(raw)
    if (Option.isSome(decoded)) return decoded.value
  }
  return { role: 'user', content: '' }
}

function attachToolCall(lines: readonly Message[], toolCall: ToolCall): Message[] {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index]
    if (line?.role !== 'assistant') continue
    const existing = line.toolCalls ?? []
    if (existing.some((item) => item.id === toolCall.id)) return [...lines]
    const next = [...lines]
    next[index] = { ...line, toolCalls: [...existing, toolCall] }
    return next
  }
  return [...lines]
}

export const agentThread = defineThread<AgentState>({
  kind: 'agent',
  initialState: (ctx) => ({
    definitionName: ctx.definitionName,
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
  }),
  step(state, event, ctx) {
    switch (event.type) {
      case 'runtime.thread.started': {
        const payload = Predicate.isObject(event.payload) ? event.payload : {}
        const defName = Predicate.isString(payload.definitionName)
          ? payload.definitionName
          : state.definitionName
        // SAFETY: event payload input is JSON
        const input = payload.input !== undefined ? (payload.input as JsonValue) : state.input
        const line = inputToLine(input)
        const lines = line ? [line] : state.lines
        return {
          ...state,
          definitionName: defName,
          input,
          lines,
          needsLlmCall: true,
        }
      }
      case 'agent.turn.started': {
        const decoded = decodeTurnStarted(event.payload)
        const turn =
          Option.isSome(decoded) && decoded.value.turn !== undefined
            ? decoded.value.turn
            : state.turn + 1
        return {
          ...state,
          turn,
          needsLlmCall: false,
          pendingSteer: null,
        }
      }
      case 'agent.message.received': {
        const message = extractMessage(event.payload)
        const lines = [...state.lines, message]
        const needsLlmCall = state.pendingToolCalls.length === 0
        return {
          ...state,
          lines,
          needsLlmCall,
        }
      }
      case 'agent.message': {
        return { ...state, lines: [...state.lines, extractMessage(event.payload)] }
      }
      case 'agent.tool_call.requested': {
        const decoded = decodeToolCallRequested(event.payload)
        if (Option.isNone(decoded)) return state
        const { toolCall } = decoded.value
        return {
          ...state,
          lines: attachToolCall(state.lines, toolCall),
          pendingToolCalls: [...state.pendingToolCalls, toolCall],
          executingToolCalls: [...state.executingToolCalls, toolCall],
          needsLlmCall: false,
        }
      }
      case 'agent.tool.result': {
        const decoded = decodeToolResult(event.payload)
        if (Option.isNone(decoded)) return state
        const { toolCallId, name, result, error } = decoded.value
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
        const decoded = decodeSteered(event.payload)
        const message = Option.isSome(decoded)
          ? decoded.value.message
          : extractMessage(event.payload)
        const interrupt = Option.isSome(decoded) ? decoded.value.interrupt : false
        if (interrupt === true) {
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
          }
        }
        return {
          ...state,
          lines: [...state.lines, message],
          pendingSteer: message,
        }
      }
      case 'agent.spawn.requested': {
        const decoded = decodeSpawnRequested(event.payload)
        if (Option.isNone(decoded)) return state
        const { childThreadId, kind, definitionName, toolCallId, input } = decoded.value
        return {
          ...state,
          executingToolCalls: state.executingToolCalls.filter((item) => item.id !== toolCallId),
          pendingSpawns: [
            ...state.pendingSpawns.filter((item) => item.toolCallId !== toolCallId),
            {
              childThreadId,
              kind,
              definitionName,
              toolCallId,
              // SAFETY: schema-decoded input is JSON
              input: (input as JsonValue) ?? null,
            },
          ],
        }
      }
      case 'agent.effects.requested': {
        const decoded = decodeEffectsRequested(event.payload)
        if (Option.isNone(decoded)) return state
        const { toolCallId, effects: rawEffects, waitOn } = decoded.value
        // SAFETY: handler serialized RuntimeEffect values into the event payload.
        const effects: RuntimeEffect[] = Array.isArray(rawEffects)
          ? [...(rawEffects as RuntimeEffect[])]
          : []
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
                    // SAFETY: schema-decoded match is JSON
                    match: (waitOn.match as JsonValue) ?? undefined,
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
        const payload = Predicate.isObject(event.payload) ? event.payload : {}
        const error = Predicate.isString(payload.error) ? payload.error : 'effect failed'
        if (isWithdrawnError(error)) return state
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
        if (!pending) return state
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
        if (!Predicate.isObject(event.payload)) return state
        const tag = event.payload.tag
        if (!Predicate.isObject(tag)) return state
        const toolCallId = Predicate.isString(tag.toolCallId) ? tag.toolCallId : undefined
        if (!toolCallId) return state
        const embedded = event.payload.event
        const embeddedObj =
          Predicate.isObject(embedded) && Predicate.isObject(embedded.payload)
            ? embedded.payload
            : {}
        const threadId = ctx.threadId
        const name = Predicate.isString(tag.name) ? tag.name : 'child'
        const error = Predicate.isString(embeddedObj.error) ? embeddedObj.error : null
        // SAFETY: embedded output/payload is JSON
        const result =
          (embeddedObj.output as JsonValue) ??
          (Predicate.isObject(embedded) ? (embedded.payload as JsonValue) : null) ??
          null
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
  output(state, ctx) {
    const effects: RuntimeEffect[] = []

    if (state.needsLlmCall) {
      effects.push(
        invoke(
          'agent.callLLM',
          asJson({
            turn: state.turn + 1,
            definitionName: state.definitionName,
            messages: state.lines,
            input: state.input,
          }),
          `llm_turn_${state.turn + 1}`,
        ),
      )
    }

    for (const toolCall of state.executingToolCalls) {
      effects.push(
        invoke(
          'agent.executeTool',
          asJson({
            turn: state.turn,
            definitionName: state.definitionName,
            toolCall,
          }),
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

    return { effects }
  },
})

export function satisfiedToToolResult(event: EventEnvelope): RuntimeEffect | null {
  if (!Predicate.isObject(event.payload)) return null
  const tag = event.payload.tag
  if (!Predicate.isObject(tag)) return null
  const toolCallId = Predicate.isString(tag.toolCallId) ? tag.toolCallId : undefined
  if (!toolCallId) return null
  const embedded = event.payload.event
  const embeddedPayload =
    Predicate.isObject(embedded) && Predicate.isObject(embedded.payload) ? embedded.payload : {}
  const threadId = event.threadId ?? null
  const name = Predicate.isString(tag.name) ? tag.name : 'child'
  const error = Predicate.isString(embeddedPayload.error) ? embeddedPayload.error : null
  // SAFETY: embedded output/payload is JSON
  const result =
    (embeddedPayload.output as JsonValue) ??
    (Predicate.isObject(embedded) ? (embedded.payload as JsonValue) : null) ??
    null
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
