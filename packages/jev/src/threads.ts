import { Option, Predicate, Schema } from 'effect'

import {
  asJson,
  complete,
  createWaitId,
  fail,
  invoke,
  wait,
  type JsonValue,
  type RuntimeEffect,
} from '@looms/core'

import { evaluateEffect } from './effects'
import { JevEvaluatedPayloadSchema, type JevEvaluated } from './events'
import { jevModule } from './scope'

export const JevThreadStateSchema = Schema.Struct({
  definitionName: Schema.optional(Schema.String),
  input: Schema.Json,
  evaluationId: Schema.String,
  dispatched: Schema.Boolean,
  status: Schema.Union([
    Schema.Literal('pending'),
    Schema.Literal('completed'),
    Schema.Literal('failed'),
  ]),
  output: Schema.NullOr(JevEvaluatedPayloadSchema),
  error: Schema.NullOr(Schema.String),
})
export type JevThreadState = Schema.Schema.Type<typeof JevThreadStateSchema>

const decodeEvaluated = Schema.decodeUnknownOption(JevEvaluatedPayloadSchema)

function readEvaluated(payload: JsonValue): JevEvaluated | undefined {
  const decoded = decodeEvaluated(payload)
  return Option.isSome(decoded) ? decoded.value : undefined
}

export const jevThread = jevModule.thread({
  kind: 'jev',
  shape: JevThreadStateSchema,
  initialState: (ctx) => ({
    definitionName: ctx.definitionName,
    input: ctx.input,
    evaluationId: `eval_${ctx.threadId}`,
    dispatched: false,
    status: 'pending' as const,
    output: null,
    error: null,
  }),
  step(state, event, ctx) {
    if (state.status === 'completed' || state.status === 'failed') {
      return state
    }

    switch (event.type) {
      case 'runtime.thread.started': {
        return {
          ...state,
          definitionName: event.payload.definitionName || state.definitionName,
          input: event.payload.input ?? state.input,
          evaluationId: `eval_${ctx.threadId}`,
        }
      }

      case 'jev.requested': {
        if (event.payload.evaluationId !== state.evaluationId) {
          return state
        }

        return { ...state, dispatched: true }
      }

      case 'jev.evaluated': {
        if (event.payload.evaluationId !== state.evaluationId) {
          return state
        }

        return {
          ...state,
          dispatched: true,
          status: 'completed' as const,
          output: event.payload,
          error: null,
        }
      }

      case 'runtime.effect.failed': {
        const error = event.payload.error || 'Jev evaluation failed'
        return {
          ...state,
          status: 'failed' as const,
          error,
        }
      }

      case 'runtime.wait.satisfied': {
        const embedded = event.payload.event

        if (!Predicate.isObject(embedded) || embedded.type !== 'jev.evaluated') {
          return state
        }

        const evaluated = readEvaluated(embedded.payload)

        if (!evaluated || evaluated.evaluationId !== state.evaluationId) {
          return state
        }

        return {
          ...state,
          dispatched: true,
          status: 'completed' as const,
          output: evaluated,
          error: null,
        }
      }

      default:
        return state
    }
  },
  effects(state): RuntimeEffect[] {
    if (state.status === 'failed') {
      return [fail(state.error ?? 'Jev evaluation failed')]
    }

    if (state.status === 'completed') {
      return [complete(asJson(state.output ?? null))]
    }

    const effects: RuntimeEffect[] = []

    if (!state.dispatched) {
      effects.push(
        invoke(
          evaluateEffect,
          {
            evaluationId: state.evaluationId,
            definitionName: state.definitionName,
            input: state.input,
          },
          `evaluate_${state.evaluationId}`,
        ),
      )
    }

    effects.push(
      wait({
        waitId: createWaitId(state.evaluationId, 'result'),
        on: { type: 'jev.evaluated', match: { evaluationId: state.evaluationId } },
      }),
    )

    return effects
  },
})
