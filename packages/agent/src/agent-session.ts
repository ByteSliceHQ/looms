import { Predicate, Schema } from 'effect'

import {
  cancel,
  createWaitId,
  invoke,
  spawn,
  wait,
  type EventEnvelope,
  type JsonValue,
  type RuntimeEffect,
  type ThreadDefinition,
} from '@looms/core'

import type { AgentSessionDefinition } from './definitions'
import { agentModule } from './scope'
import type {
  AgentSessionClosure,
  AgentSessionMessage,
  AgentSessionSnapshot,
  AgentSessionState,
  AgentSessionTurnStatus,
} from './types'

const SessionActionInput = Schema.Struct({
  action: Schema.Union([Schema.Literal('admit'), Schema.Literal('steer'), Schema.Literal('close')]),
  sessionThreadId: Schema.String,
  messageId: Schema.String,
  childThreadId: Schema.optional(Schema.String),
  activeMessageId: Schema.optional(Schema.String),
  text: Schema.optional(Schema.String),
  status: Schema.optional(
    Schema.Union([
      Schema.Literal('completed'),
      Schema.Literal('failed'),
      Schema.Literal('cancelled'),
    ]),
  ),
  error: Schema.optional(Schema.String),
})

export const agentSessionActionEffect = agentModule.effect({
  type: 'agent.sessionAction',
  input: SessionActionInput,
  execute: (input) => {
    switch (input.action) {
      case 'admit':
        return [
          agentModule.input(
            'session.turn.started',
            {
              messageId: input.messageId,
              childThreadId: input.childThreadId ?? '',
            },
            { threadId: input.sessionThreadId },
          ),
        ]
      case 'steer':
        return [
          agentModule.input(
            'steered',
            {
              turn: 0,
              messageId: input.messageId,
              message: { role: 'user', content: input.text ?? '' },
              interrupt: true,
            },
            { threadId: input.childThreadId },
          ),
          agentModule.input(
            'session.steer.delivered',
            {
              messageId: input.messageId,
              activeMessageId: input.activeMessageId ?? '',
            },
            { threadId: input.sessionThreadId },
          ),
        ]
      case 'close':
        return [
          agentModule.input(
            'session.turn.closed',
            {
              messageId: input.messageId,
              status: input.status ?? 'failed',
              error: input.error,
            },
            { threadId: input.sessionThreadId },
          ),
        ]

      default: {
        const exhaustiveCheck: never = input.action
        return exhaustiveCheck
      }
    }
  },
})

function objectPayload(event: EventEnvelope): { [key: string]: JsonValue } {
  return Predicate.isObject(event.payload) ? event.payload : {}
}

function messageFrom(value: JsonValue | undefined): AgentSessionMessage | null {
  const payload = Predicate.isObject(value) ? value : {}
  return Predicate.isString(payload.messageId) && Predicate.isString(payload.text)
    ? {
        messageId: payload.messageId,
        text: payload.text,
        delivery:
          payload.delivery === 'steer' ||
          payload.delivery === 'followUp' ||
          payload.delivery === 'nextTurn'
            ? payload.delivery
            : undefined,
      }
    : null
}

function consumedIds(event: EventEnvelope): string[] {
  const payload = objectPayload(event)
  const embedded = Predicate.isObject(payload.event) ? payload.event : {}
  const embeddedPayload = Predicate.isObject(embedded.payload) ? embedded.payload : {}
  const output = Predicate.isObject(embeddedPayload.output) ? embeddedPayload.output : {}
  const ids = output.consumedSteerMessageIds
  return Array.isArray(ids) ? ids.filter(Predicate.isString) : []
}

type ClosureStatus = Omit<AgentSessionClosure, 'messageId'>

function closureStatus(event: EventEnvelope): ClosureStatus {
  const payload = objectPayload(event)
  const embedded = Predicate.isObject(payload.event) ? payload.event : {}
  const embeddedPayload = Predicate.isObject(embedded.payload) ? embedded.payload : {}

  const status =
    embedded.type === 'runtime.thread.completed'
      ? 'completed'
      : embedded.type === 'runtime.thread.cancelled'
        ? 'cancelled'
        : 'failed'

  const error = Predicate.isString(embeddedPayload.error) ? embeddedPayload.error : undefined
  return { status, error }
}

function close(
  messageId: string,
  status: AgentSessionTurnStatus,
  error?: string,
): AgentSessionClosure {
  return error === undefined ? { messageId, status } : { messageId, status, error }
}

function childThreadId(sessionThreadId: string, messageId: string): string {
  return `${sessionThreadId}_turn_${encodeURIComponent(messageId)}`
}

export function createAgentSessionThread(
  definitions: ReadonlyMap<string, AgentSessionDefinition>,
): ThreadDefinition<AgentSessionState> {
  return agentModule.thread<AgentSessionState>({
    kind: 'agent-session',
    initialState: (ctx) => {
      const definition = definitions.get(`${ctx.definitionName}@${ctx.definitionVersion}`)
      return {
        definitionName: ctx.definitionName,
        definitionVersion: ctx.definitionVersion,
        pendingMessages: [],
        nextTurnMessages: [],
        processedMessageIds: [],
        activeTurn: null,
        pendingSteerDeliveries: [],
        pendingClosures: [],
        lastSequence: 0,
        idleTimeoutMs: definition?.idleTimeoutMs ?? 0,
        idleDeadlineAt: null,
        parked: false,
        cancelling: false,
      }
    },
    step(state, event) {
      switch (event.type) {
        case 'runtime.thread.started': {
          const initial = messageFrom(objectPayload(event).input)
          const idleDeadlineAt = state.idleTimeoutMs > 0 ? event.ts + state.idleTimeoutMs : null

          if (!initial || state.processedMessageIds.includes(initial.messageId)) {
            return { ...state, idleDeadlineAt }
          }

          return {
            ...state,
            pendingMessages: [initial],
            processedMessageIds: [initial.messageId],
            idleDeadlineAt,
          }
        }

        case 'agent.session.message.submitted': {
          const payload = objectPayload(event)
          const message = messageFrom(payload)

          if (!message || state.processedMessageIds.includes(message.messageId)) {
            return state
          }

          const processedMessageIds = [...state.processedMessageIds, message.messageId]
          const idleDeadlineAt = state.idleTimeoutMs > 0 ? event.ts + state.idleTimeoutMs : null

          if (message.delivery === 'nextTurn') {
            return {
              ...state,
              nextTurnMessages: [...state.nextTurnMessages, message],
              processedMessageIds,
              idleDeadlineAt,
              parked: false,
            }
          }

          const queued =
            message.delivery === 'steer' && state.activeTurn
              ? { ...message, steeredIntoMessageId: state.activeTurn.messageId }
              : message

          return {
            ...state,
            pendingMessages: [...state.pendingMessages, queued],
            pendingSteerDeliveries:
              queued.steeredIntoMessageId &&
              state.activeTurn &&
              payload.activeChildThreadId !== state.activeTurn.childThreadId
                ? [...state.pendingSteerDeliveries, queued]
                : state.pendingSteerDeliveries,
            processedMessageIds,
            idleDeadlineAt,
            parked: false,
          }
        }

        case 'agent.session.turn.started': {
          const messageId = event.payload.messageId
          const admitted = state.pendingMessages.find((message) => message.messageId === messageId)

          const text = [...state.nextTurnMessages, ...(admitted ? [admitted] : [])]
            .map((message) => message.text)
            .join('\n')

          return {
            ...state,
            pendingMessages: state.pendingMessages.filter(
              (message) => message.messageId !== messageId,
            ),
            activeTurn: {
              messageId,
              childThreadId: event.payload.childThreadId,
              text,
            },
            nextTurnMessages: [],
            lastSequence: state.lastSequence + 1,
            cancelling: false,
          }
        }

        case 'agent.session.steer.delivered':
          return {
            ...state,
            pendingSteerDeliveries: state.pendingSteerDeliveries.filter(
              (message) => message.messageId !== event.payload.messageId,
            ),
          }
        case 'agent.session.turn.closed':
          return {
            ...state,
            pendingClosures: state.pendingClosures.filter(
              (closure) => closure.messageId !== event.payload.messageId,
            ),
          }
        case 'agent.session.cancel.requested':
        case 'runtime.thread.cancel.requested':
          return state.activeTurn ? { ...state, cancelling: true } : state

        case 'runtime.wait.satisfied': {
          const payload = objectPayload(event)
          const tag = Predicate.isObject(payload.tag) ? payload.tag : {}

          if (tag.kind === 'agent-session-idle') {
            if (tag.deadlineAt === state.idleDeadlineAt && state.activeTurn === null) {
              return { ...state, parked: true, idleDeadlineAt: null }
            }

            return state
          }

          if (tag.kind !== 'agent-session-turn' || !state.activeTurn) {
            return state
          }

          const active = state.activeTurn
          const consumed = new Set(consumedIds(event))
          const result = closureStatus(event)

          const pendingClosures = [
            ...state.pendingClosures,
            close(active.messageId, result.status, result.error),
            ...[...consumed].map((messageId) => close(messageId, result.status, result.error)),
          ]

          return {
            ...state,
            pendingMessages: state.pendingMessages.flatMap((message) => {
              if (consumed.has(message.messageId)) {
                return []
              }

              return message.steeredIntoMessageId === active.messageId
                ? [{ ...message, steeredIntoMessageId: undefined }]
                : [message]
            }),
            pendingSteerDeliveries: state.pendingSteerDeliveries.filter(
              (message) =>
                !consumed.has(message.messageId) &&
                message.steeredIntoMessageId !== active.messageId,
            ),
            pendingClosures,
            activeTurn: null,
            lastSequence: state.lastSequence + 1,
            cancelling: false,
            idleDeadlineAt: state.idleTimeoutMs > 0 ? event.ts + state.idleTimeoutMs : null,
          }
        }

        default:
          return state
      }
    },
    effects(state, ctx) {
      const effects: RuntimeEffect[] = []

      for (const closure of state.pendingClosures) {
        effects.push(
          invoke(
            agentSessionActionEffect,
            {
              action: 'close',
              sessionThreadId: ctx.threadId,
              messageId: closure.messageId,
              status: closure.status,
              error: closure.error,
            },
            `session_close_${closure.messageId}`,
          ),
        )
      }

      for (const message of state.pendingSteerDeliveries) {
        if (!state.activeTurn || message.steeredIntoMessageId !== state.activeTurn.messageId) {
          continue
        }

        effects.push(
          invoke(
            agentSessionActionEffect,
            {
              action: 'steer',
              sessionThreadId: ctx.threadId,
              childThreadId: state.activeTurn.childThreadId,
              activeMessageId: state.activeTurn.messageId,
              messageId: message.messageId,
              text: message.text,
            },
            `session_steer_${message.messageId}`,
          ),
        )
      }

      if (state.activeTurn) {
        const { childThreadId: turnThreadId, messageId, text } = state.activeTurn
        const definition = definitions.get(`${state.definitionName}@${state.definitionVersion}`)

        if (state.cancelling) {
          effects.push(cancel(turnThreadId))
        } else if (definition) {
          effects.push(
            spawn({
              childThreadId: turnThreadId,
              kind: 'agent',
              definitionName: definition.agent.name,
              definitionVersion: definition.agent.version,
              input: { text },
            }),
          )
        }

        // The turn wait must survive cancellation: the child's cancelled event is what closes it.
        effects.push(
          wait({
            waitId: createWaitId(ctx.threadId, `turn_${messageId}`),
            on: {
              type: [
                'runtime.thread.completed',
                'runtime.thread.failed',
                'runtime.thread.cancelled',
              ],
              match: { threadId: turnThreadId },
            },
            tag: { kind: 'agent-session-turn', messageId },
          }),
        )

        return effects
      }

      const next = state.pendingMessages.find(
        (message) => message.steeredIntoMessageId === undefined,
      )

      if (next) {
        effects.push(
          invoke(
            agentSessionActionEffect,
            {
              action: 'admit',
              sessionThreadId: ctx.threadId,
              childThreadId: childThreadId(ctx.threadId, next.messageId),
              messageId: next.messageId,
            },
            `session_admit_${next.messageId}`,
          ),
        )

        return effects
      }

      if (state.parked || state.idleTimeoutMs === 0 || state.idleDeadlineAt === null) {
        effects.push(
          wait({
            waitId: createWaitId(ctx.threadId, 'mailbox'),
            on: { type: 'agent.session.message.submitted', match: { threadId: ctx.threadId } },
            tag: { kind: 'agent-session-mailbox' },
          }),
        )
      } else {
        effects.push(
          wait({
            waitId: createWaitId(ctx.threadId, `idle_${state.idleDeadlineAt}`),
            on: { timerAt: state.idleDeadlineAt },
            tag: { kind: 'agent-session-idle', deadlineAt: state.idleDeadlineAt },
          }),
        )
      }

      return effects
    },
  })
}

export function agentSessionSnapshot(state: AgentSessionState): AgentSessionSnapshot {
  return {
    activeTurnId: state.activeTurn?.messageId ?? null,
    activeChildThreadId: state.activeTurn?.childThreadId ?? null,
    pendingMessageCount: state.pendingMessages.length,
    nextTurnHeldCount: state.nextTurnMessages.length,
    processedMessageIds: state.processedMessageIds,
    lastSequence: state.lastSequence,
    parked: state.parked,
  }
}
