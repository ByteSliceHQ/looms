/**
 * Per-key coalescing append buffer.
 * - `push` enqueues and succeeds without waiting for the store ack (unless over `maxPending`).
 * - At most one flush is in flight per key; arrivals during a flush form the next batch.
 * - Buffer order is flush order. Independent keys flush concurrently.
 * - A failed flush poisons the key: later `push` calls fail, `drain` still succeeds.
 */
import { type Cause, Deferred, Effect, Exit, Ref } from 'effect'

export interface CoalescingAppenderOptions {
  /** When the buffer exceeds this size, `push` waits for the next flush. Default 1024. */
  readonly maxPending?: number
  /** Extra delay before the first flush of an idle key. `0` (default) yields to the scheduler. */
  readonly lingerMs?: number
}

interface KeyState<T, E> {
  buffer: T[]
  flushing: boolean
  scheduled: boolean
  poison: Cause.Cause<E> | undefined
  nextFlush: Deferred.Deferred<void, E>
}

type EnqueueResult<E> =
  | { kind: 'poisoned'; cause: Cause.Cause<E> }
  | {
      kind: 'enqueued'
      shouldSchedule: boolean
      pending: number
      deferred: Deferred.Deferred<void, E>
    }

type TakeResult<T, E> =
  | { kind: 'gone' }
  | { kind: 'idle'; state: KeyState<T, E> }
  | { kind: 'batch'; batch: readonly T[]; state: KeyState<T, E> }

type DrainWait<E> = { kind: 'done' } | { kind: 'wait'; deferred: Deferred.Deferred<void, E> }

function createState<T, E>(): KeyState<T, E> {
  return {
    buffer: [],
    flushing: false,
    scheduled: false,
    poison: undefined,
    nextFlush: Deferred.makeUnsafe<void, E>(),
  }
}

const completeFlush = <T, E>(state: KeyState<T, E>, cause?: Cause.Cause<E>): Effect.Effect<void> =>
  Effect.gen(function* () {
    const current = state.nextFlush
    state.nextFlush = Deferred.makeUnsafe<void, E>()

    if (cause) {
      yield* Deferred.failCause(current, cause)
      return
    }

    yield* Deferred.succeed(current, undefined)
  })

export function createCoalescingAppender<T, E = Error>(
  flush: (key: string, batch: readonly T[]) => Effect.Effect<void, E>,
  options?: CoalescingAppenderOptions,
) {
  const maxPending = options?.maxPending ?? 1024
  const lingerMs = options?.lingerMs ?? 0
  const states = Ref.makeUnsafe(new Map<string, KeyState<T, E>>())

  const evictIfIdle = (key: string): Effect.Effect<void> =>
    Ref.update(states, (map) => {
      const state = map.get(key)

      if (
        !state ||
        state.buffer.length > 0 ||
        state.flushing ||
        state.scheduled ||
        state.poison !== undefined
      ) {
        return map
      }

      const next = new Map(map)
      next.delete(key)
      return next
    })

  const take = (key: string): Effect.Effect<TakeResult<T, E>> =>
    Ref.modify(states, (map): readonly [TakeResult<T, E>, Map<string, KeyState<T, E>>] => {
      const state = map.get(key)

      if (!state) {
        return [{ kind: 'gone' }, map]
      }

      if (state.buffer.length === 0) {
        state.flushing = false
        state.scheduled = false
        return [{ kind: 'idle', state }, map]
      }

      const batch = state.buffer
      state.buffer = []
      state.flushing = true
      state.scheduled = false
      return [{ kind: 'batch', batch, state }, map]
    })

  const stillCurrent = (key: string, state: KeyState<T, E>): Effect.Effect<boolean> =>
    Ref.modify(states, (map) => [map.get(key) === state, map])

  const runFlush = (key: string): Effect.Effect<void> =>
    Effect.gen(function* () {
      while (true) {
        const taken = yield* take(key)

        switch (taken.kind) {
          case 'gone':
            return
          case 'idle':
            yield* completeFlush(taken.state)
            yield* evictIfIdle(key)
            return

          case 'batch': {
            const exit = yield* Effect.exit(flush(key, taken.batch))

            if (Exit.isFailure(exit)) {
              const current = yield* stillCurrent(key, taken.state)

              if (current) {
                taken.state.poison = exit.cause
                taken.state.buffer = []
                taken.state.flushing = false
                taken.state.scheduled = false
                yield* completeFlush(taken.state, exit.cause)
              }

              return
            }

            const current = yield* stillCurrent(key, taken.state)

            if (!current) {
              return
            }

            yield* completeFlush(taken.state)
            continue
          }

          default: {
            const exhaustiveCheck: never = taken
            void exhaustiveCheck
            return
          }
        }
      }
    })

  const scheduleFlush = (key: string): Effect.Effect<void> =>
    Effect.sync(() => {
      Effect.runFork(
        (lingerMs > 0 ? Effect.sleep(lingerMs) : Effect.yieldNow).pipe(
          Effect.andThen(runFlush(key)),
        ),
      )
    })

  const enqueue = (key: string, event: T): Effect.Effect<EnqueueResult<E>> =>
    Ref.modify(states, (map): readonly [EnqueueResult<E>, Map<string, KeyState<T, E>>] => {
      const existing = map.get(key)

      if (existing?.poison !== undefined) {
        return [{ kind: 'poisoned', cause: existing.poison }, map]
      }

      const next = existing ? map : new Map(map)
      const state = existing ?? createState<T, E>()

      if (!existing) {
        next.set(key, state)
      }

      state.buffer.push(event)
      const shouldSchedule = !state.flushing && !state.scheduled

      if (shouldSchedule) {
        state.scheduled = true
      }

      return [
        {
          kind: 'enqueued',
          shouldSchedule,
          pending: state.buffer.length,
          deferred: state.nextFlush,
        },
        next,
      ]
    })

  const push = (key: string, event: T): Effect.Effect<void, E> =>
    Effect.gen(function* () {
      const result = yield* enqueue(key, event)

      switch (result.kind) {
        case 'poisoned':
          return yield* Effect.failCause(result.cause)

        case 'enqueued': {
          if (result.shouldSchedule) {
            yield* scheduleFlush(key)
          }

          if (result.pending > maxPending) {
            yield* Deferred.await(result.deferred)
          }

          return undefined
        }

        default: {
          const exhaustiveCheck: never = result
          void exhaustiveCheck
          return undefined
        }
      }
    })

  const drain = (key: string): Effect.Effect<void> =>
    Effect.gen(function* () {
      while (true) {
        const wait = yield* Ref.modify(
          states,
          (map): readonly [DrainWait<E>, Map<string, KeyState<T, E>>] => {
            const state = map.get(key)

            if (
              !state ||
              state.poison !== undefined ||
              (state.buffer.length === 0 && !state.flushing && !state.scheduled)
            ) {
              return [{ kind: 'done' as const }, map]
            }

            return [{ kind: 'wait' as const, deferred: state.nextFlush }, map]
          },
        )

        if (wait.kind === 'done') {
          return
        }

        yield* Deferred.await(wait.deferred).pipe(Effect.ignoreCause)
      }
    })

  const clear = (key?: string): void => {
    Effect.runSync(
      Ref.update(states, (map) => {
        if (key === undefined) {
          return new Map()
        }

        if (!map.has(key)) {
          return map
        }

        const next = new Map(map)
        next.delete(key)
        return next
      }),
    )
  }

  const size = (): number => Effect.runSync(Ref.get(states)).size

  return { push, drain, clear, size }
}

export type CoalescingAppender<T, E = Error> = ReturnType<typeof createCoalescingAppender<T, E>>
