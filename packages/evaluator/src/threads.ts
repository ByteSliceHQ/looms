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
import { EvaluatorEvaluatedPayloadSchema, type EvaluatorEvaluated } from './events'
import { evaluatorModule } from './scope'

export const EvaluatorThreadStateSchema = Schema.Struct({
  definitionName: Schema.optional(Schema.String),
  input: Schema.Json,
  evaluationId: Schema.String,
  dispatched: Schema.Boolean,
  status: Schema.Union([
    Schema.Literal('pending'),
    Schema.Literal('completed'),
    Schema.Literal('failed'),
  ]),
  output: Schema.NullOr(EvaluatorEvaluatedPayloadSchema),
  error: Schema.NullOr(Schema.String),
})
export type EvaluatorThreadState = Schema.Schema.Type<typeof EvaluatorThreadStateSchema>

const decodeEvaluated = Schema.decodeUnknownOption(EvaluatorEvaluatedPayloadSchema)

function readEvaluated(payload: JsonValue): EvaluatorEvaluated | undefined {
  const decoded = decodeEvaluated(payload)
  return Option.isSome(decoded) ? decoded.value : undefined
}

export const evaluatorThread = evaluatorModule.thread({
  kind: 'evaluator',
  shape: EvaluatorThreadStateSchema,
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

      case 'evaluator.requested': {
        if (event.payload.evaluationId !== state.evaluationId) {
          return state
        }

        return { ...state, dispatched: true }
      }

      case 'evaluator.evaluated': {
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
        const error = event.payload.error || 'Evaluation failed'
        return {
          ...state,
          status: 'failed' as const,
          error,
        }
      }

      case 'runtime.wait.satisfied': {
        const embedded = event.payload.event

        if (!Predicate.isObject(embedded) || embedded.type !== 'evaluator.evaluated') {
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
      return [fail(state.error ?? 'Evaluation failed')]
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
        on: { type: 'evaluator.evaluated', match: { evaluationId: state.evaluationId } },
      }),
    )

    return effects
  },
})
