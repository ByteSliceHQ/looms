import { Effect } from 'effect'

import type { JsonValue } from '@looms/core'

import {
  assertJsonWithinLimit,
  DEFAULT_CHECKPOINT_SIZE_LIMIT_BYTES,
  iterationChildWorkflowId,
  resolveGraphConcurrency,
} from './graph'

export type CompositeKind = 'map' | 'fanout' | 'while'

export interface MapCheckpoint {
  readonly type: 'map'
  readonly nextIndex: number
  readonly results: readonly JsonValue[]
  readonly previous?: JsonValue
}

export interface FanoutCheckpoint {
  readonly type: 'fanout'
  readonly nextIndex: number
  readonly results: readonly (JsonValue | null)[]
}

export interface WhileCheckpoint {
  readonly type: 'while'
  readonly nextIndex: number
  readonly state: JsonValue
  readonly previous?: JsonValue
}

export type CompositeCheckpoint = MapCheckpoint | FanoutCheckpoint | WhileCheckpoint

export interface CompositeExecutionContext {
  readonly parentThreadId: string
  readonly nodeId: string
  readonly checkpointLimitBytes?: number
  executeChild(childThreadId: string, input: JsonValue, index: number): Promise<JsonValue>
  saveCheckpoint?(checkpoint: CompositeCheckpoint): Promise<void> | void
}

function saveCheckpoint(
  ctx: CompositeExecutionContext,
  checkpoint: CompositeCheckpoint,
): Effect.Effect<void> {
  return Effect.sync(() => {
    assertJsonWithinLimit(
      checkpoint,
      `${checkpoint.type} checkpoint`,
      ctx.checkpointLimitBytes ?? DEFAULT_CHECKPOINT_SIZE_LIMIT_BYTES,
    )
  }).pipe(Effect.andThen(Effect.promise(() => Promise.resolve(ctx.saveCheckpoint?.(checkpoint)))))
}

export function executeMap(
  items: readonly JsonValue[],
  ctx: CompositeExecutionContext,
  options: {
    readonly checkpoint?: MapCheckpoint
    readonly input?: (item: JsonValue, index: number, previous?: JsonValue) => JsonValue
  } = {},
): Promise<JsonValue[]> {
  return Effect.runPromise(
    Effect.gen(function* () {
      const results = [...(options.checkpoint?.results ?? [])]
      let previous = options.checkpoint?.previous
      const start = options.checkpoint?.nextIndex ?? 0

      for (let index = start; index < items.length; index++) {
        const item = items[index] ?? null
        const input = options.input?.(item, index, previous) ?? item

        previous = yield* Effect.promise(() =>
          ctx.executeChild(
            iterationChildWorkflowId(ctx.parentThreadId, ctx.nodeId, 'map', index),
            input,
            index,
          ),
        )

        results[index] = previous

        yield* saveCheckpoint(ctx, {
          type: 'map',
          nextIndex: index + 1,
          results,
          previous,
        })
      }

      return results
    }),
  )
}

interface IndexedOutcome {
  readonly index: number
  readonly value: JsonValue
}

export function executeFanout(
  items: readonly JsonValue[],
  ctx: CompositeExecutionContext,
  options: { readonly concurrency?: number; readonly checkpoint?: FanoutCheckpoint } = {},
): Promise<JsonValue[]> {
  return Effect.runPromise(
    Effect.gen(function* () {
      const concurrency = resolveGraphConcurrency(options.concurrency)
      const results = [...(options.checkpoint?.results ?? [])]
      let nextIndex = options.checkpoint?.nextIndex ?? 0
      const running = new Map<number, Promise<IndexedOutcome>>()

      while (nextIndex < items.length || running.size > 0) {
        while (nextIndex < items.length && running.size < concurrency) {
          const index = nextIndex++
          const item = items[index] ?? null
          const childId = iterationChildWorkflowId(ctx.parentThreadId, ctx.nodeId, 'fanout', index)

          const promise = ctx
            .executeChild(childId, item, index)
            .then<IndexedOutcome>((value) => ({ index, value }))

          running.set(index, promise)
        }

        const outcome = yield* Effect.promise(() => Promise.race(running.values()))
        running.delete(outcome.index)
        results[outcome.index] = outcome.value

        yield* saveCheckpoint(ctx, {
          type: 'fanout',
          nextIndex,
          results,
        })
      }

      return results.map((value) => value ?? null)
    }),
  )
}

export function executeWhile(
  initialState: JsonValue,
  ctx: CompositeExecutionContext,
  options: {
    readonly maxIterations: number
    readonly checkpoint?: WhileCheckpoint
    readonly condition: (
      state: JsonValue,
      index: number,
      previous?: JsonValue,
    ) => boolean | Promise<boolean>
    readonly update?: (
      state: JsonValue,
      output: JsonValue,
      index: number,
    ) => JsonValue | Promise<JsonValue>
  },
): Promise<{ iterations: number; lastOutput?: JsonValue; state: JsonValue }> {
  return Effect.runPromise(
    Effect.gen(function* () {
      if (!Number.isInteger(options.maxIterations) || options.maxIterations < 0) {
        throw new Error('while maxIterations must be a non-negative integer')
      }

      let state = options.checkpoint?.state ?? initialState
      let previous = options.checkpoint?.previous
      let index = options.checkpoint?.nextIndex ?? 0

      while (
        index < options.maxIterations &&
        (yield* Effect.promise(() => Promise.resolve(options.condition(state, index, previous))))
      ) {
        previous = yield* Effect.promise(() =>
          ctx.executeChild(
            iterationChildWorkflowId(ctx.parentThreadId, ctx.nodeId, 'while', index),
            state,
            index,
          ),
        )

        state = options.update
          ? yield* Effect.promise(() => Promise.resolve(options.update!(state, previous!, index)))
          : previous

        index++

        yield* saveCheckpoint(ctx, {
          type: 'while',
          nextIndex: index,
          state,
          previous,
        })
      }

      return { iterations: index, lastOutput: previous, state }
    }),
  )
}
