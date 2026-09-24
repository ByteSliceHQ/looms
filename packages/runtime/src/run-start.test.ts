import { describe, expect, test } from 'bun:test'

import { Effect, Option } from 'effect'

import {
  EventStoreConflictError,
  makeMemoryEventStore,
  makeMemorySnapshotStore,
  type EventStore,
} from '@looms/core'
import { defineWorkflow, workflow } from '@looms/workflow'

import { RuntimeExecutionError, StartRunConflictError } from './errors'
import { createLooms } from './looms'

describe('run start identity', () => {
  const v1 = defineWorkflow({
    name: 'identity',
    version: 'v1',
    nodes: [{ id: 'done', run: (ctx) => ctx.input }],
  })

  const v2 = defineWorkflow({
    name: 'identity',
    version: 'v2',
    nodes: [{ id: 'done', run: (ctx) => ctx.input }],
  })

  const other = defineWorkflow({
    name: 'other-identity',
    version: 'v1',
    nodes: [{ id: 'done', run: (ctx) => ctx.input }],
  })

  test('returns the winning root for the same idempotent logical start', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)

    const looms = createLooms({
      modules: [workflow({ definitions: [v1] })],
      store,
    })

    const first = await looms.startRun({
      kind: 'workflow',
      definitionName: 'identity',
      definitionVersion: 'v1',
      input: { b: 2, a: 1 },
      runId: 'same-start',
      idempotencyKey: 'request-1',
    })

    const retry = await looms.startRun({
      kind: 'workflow',
      definitionName: 'identity',
      definitionVersion: 'v1',
      input: { a: 1, b: 2 },
      runId: 'same-start',
      idempotencyKey: 'request-1',
    })

    expect(retry.threadId).toBe(first.threadId)
    expect(retry.state.status).toBe('completed')
    await looms.stop()
  })

  test('reloads and accepts the winner after an ambiguous append conflict', async () => {
    const inner = await Effect.runPromise(makeMemoryEventStore)
    let conflictOnce = true

    const store: EventStore = {
      ...inner,
      append: (runId, events, options) =>
        Effect.gen(function* () {
          const result = yield* inner.append(runId, events, options)

          if (conflictOnce && events.some((event) => event.type === 'runtime.run.started')) {
            conflictOnce = false
            return yield* new EventStoreConflictError(
              runId,
              options?.expectedTail ?? 0,
              result.tail,
            )
          }

          return result
        }),
    }

    const looms = createLooms({
      modules: [workflow({ definitions: [v1] })],
      store,
    })

    const result = await looms.startRun({
      kind: 'workflow',
      definitionName: 'identity',
      definitionVersion: 'v1',
      input: { value: 1 },
      runId: 'ambiguous-start',
      threadId: 'root',
      idempotencyKey: 'request-1',
    })

    expect(result.threadId).toBe('root')
    expect(result.state.status).toBe('completed')
    await looms.stop()
  })

  test('rejects every mismatched component of an existing start identity', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)

    const looms = createLooms({
      modules: [workflow({ definitions: [v1, v2, other] })],
      store,
    })

    const base = {
      kind: 'workflow',
      definitionName: 'identity',
      definitionVersion: 'v1',
      input: { value: 1 },
      runId: 'mismatched-start',
      threadId: 'requested-root',
      idempotencyKey: 'request-1',
    } as const

    await looms.startRun(base)

    const cases = [
      [{ ...base, definitionName: 'other-identity' }, 'definitionName'],
      [{ ...base, definitionVersion: 'v2' }, 'definitionVersion'],
      [{ ...base, input: { value: 2 } }, 'input'],
      [{ ...base, threadId: 'different-root' }, 'requestedThreadId'],
      [{ ...base, idempotencyKey: 'request-2' }, 'idempotencyKey'],
      [{ ...base, idempotencyKey: undefined }, 'idempotencyKey'],
    ] as const

    for (const [args, mismatch] of cases) {
      let caught: unknown

      try {
        await looms.startRun(args)
      } catch (error) {
        caught = error
      }

      expect(caught).toBeInstanceOf(StartRunConflictError)

      if (!(caught instanceof StartRunConflictError)) {
        throw new Error('Expected StartRunConflictError')
      }

      expect(caught.mismatches).toContain(mismatch)
    }

    await looms.stop()
  })

  test('validates identical and conflicting retries after compaction removes the start event', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const snapshots = await Effect.runPromise(makeMemorySnapshotStore)

    const looms = createLooms({
      modules: [workflow({ definitions: [v1] })],
      store,
      snapshotStore: snapshots,
      snapshotEvery: 1,
      trimAfterSnapshot: {
        keepSnapshots: 1,
        coverage: () => ({ archiveCursor: Number.MAX_SAFE_INTEGER }),
      },
    })

    const args = {
      kind: 'workflow',
      definitionName: 'identity',
      definitionVersion: 'v1',
      input: { b: 2, a: 1 },
      runId: 'compacted-start',
      threadId: 'compacted-root',
      idempotencyKey: 'request-compacted',
    } as const

    const first = await looms.startRun(args)
    const bounds = await Effect.runPromise(store.bounds!('compacted-start'))
    expect(bounds.head).toBeGreaterThan(1)

    const retry = await looms.startRun({ ...args, input: { a: 1, b: 2 } })
    expect(retry.threadId).toBe(first.threadId)

    expect(looms.startRun({ ...args, input: { a: 1, b: 3 } })).rejects.toBeInstanceOf(
      StartRunConflictError,
    )

    await looms.stop()
  })

  test('fails explicitly when a legacy compacted snapshot has no start identity', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const snapshots = await Effect.runPromise(makeMemorySnapshotStore)

    const options = {
      modules: [workflow({ definitions: [v1] })],
      store,
      snapshotStore: snapshots,
      snapshotEvery: 1,
    } as const

    const args = {
      kind: 'workflow',
      definitionName: 'identity',
      definitionVersion: 'v1',
      input: { value: 1 },
      runId: 'legacy-compacted-start',
      idempotencyKey: 'legacy-request',
    } as const

    const original = createLooms(options)
    await original.startRun(args)
    await original.stop()

    const latest = await Effect.runPromise(snapshots.loadLatest(args.runId))
    expect(Option.isSome(latest)).toBe(true)

    if (Option.isNone(latest)) {
      throw new Error('Expected a parked snapshot')
    }

    await Effect.runPromise(
      snapshots.save({
        ...latest.value,
        takenAt: latest.value.takenAt + 1,
        state: { ...latest.value.state, startIdentity: null },
      }),
    )

    await Effect.runPromise(store.trim!(args.runId, latest.value.cursor + 1))

    const recovered = createLooms(options)

    expect(recovered.startRun(args)).rejects.toThrow(
      new RuntimeExecutionError(
        `Run "${args.runId}" has durable state but no start identity; its legacy snapshot cannot safely validate a retry`,
      ),
    )

    await recovered.stop()
  })
})
