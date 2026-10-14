import { describe, expect, test } from 'bun:test'

import { Predicate, Schema } from 'effect'

import { defineProjection, isJsonObject, isJsonString, type EventEnvelope } from '@looms/core'

import { defineLiveFold, EventIndex, foldLive, ProjectionCache } from './derived'
import { createLoomsStore } from './store'

function makeEvent(
  seq: number,
  type: string,
  threadId = 'thr_1',
  ephemeral = false,
): EventEnvelope {
  return {
    id: `evt_${seq}`,
    runId: 'run_1',
    seq,
    ts: 1000 + seq,
    type,
    payload: { seq },
    threadId,
    ephemeral,
    origin: { type: 'system' },
  }
}

const offlineFetch: typeof fetch = () => Promise.reject(new Error('offline'))

function appendType(state: readonly string[], event: EventEnvelope): readonly string[] {
  return [...state, event.type]
}

function delta(seq: number, text: string, effectId: string): EventEnvelope {
  return { ...makeEvent(seq, 'delta', 'thr_1', true), effectId, payload: { text } }
}

function retryScheduled(seq: number, effectId: string): EventEnvelope {
  return {
    ...makeEvent(seq, 'runtime.effect.retry.scheduled'),
    payload: { effectId, attempt: 1, nextAttemptAt: 0, error: 'timed out' },
  }
}

const deltaText = defineLiveFold({
  name: 'deltaText',
  initialState: '',
  reduce(state, event) {
    if (event.type === 'delta' && isJsonObject(event.payload) && isJsonString(event.payload.text)) {
      return state + event.payload.text
    }

    return state
  },
})

describe('ProjectionCache', () => {
  test('folds only new events and reuses previous state reference when unchanged', () => {
    let reducerCalls = 0

    const countProjection = defineProjection({
      name: 'count',
      initialState: 0,
      reduce(state, event) {
        reducerCalls += 1

        if (event.type === 'increment') {
          return state + 1
        }

        return state
      },
    })

    const cache = new ProjectionCache()
    const batch1 = [makeEvent(1, 'increment'), makeEvent(2, 'noop')]
    const state1 = cache.project(countProjection, batch1)

    expect(state1).toBe(1)
    expect(reducerCalls).toBe(2)

    // Querying again with same events should NOT call reducer again
    const state1Again = cache.project(countProjection, batch1)
    expect(state1Again).toBe(1)
    expect(reducerCalls).toBe(2)

    // Appending a non-increment event
    const batch2 = [...batch1, makeEvent(3, 'noop')]
    const state2 = cache.project(countProjection, batch2)
    expect(state2).toBe(1)
    expect(reducerCalls).toBe(3) // Only 1 new call, NOT 3
    expect(state2).toBe(state1) // Stable reference because reducer returned state unchanged

    // Appending an increment event
    const batch3 = [...batch2, makeEvent(4, 'increment')]
    const state3 = cache.project(countProjection, batch3)
    expect(state3).toBe(2)
    expect(reducerCalls).toBe(4) // Only 1 new call
  })

  test('skips ephemeral events in projections', () => {
    let reducerCalls = 0

    const initialStrings: readonly string[] = []

    const testProjection = defineProjection({
      name: 'test',
      initialState: initialStrings,
      reduce(state, event) {
        reducerCalls += 1
        return [...state, event.type]
      },
    })

    const cache = new ProjectionCache()

    const events = [
      makeEvent(1, 'regular'),
      makeEvent(2, 'delta', 'thr_1', true), // ephemeral
      makeEvent(3, 'regular_2'),
    ]

    const state = cache.project(testProjection, events)
    expect(state).toEqual(['regular', 'regular_2'])
    expect(reducerCalls).toBe(2)
  })

  test('live fold includes ephemeral events', () => {
    const textFold = defineLiveFold({
      name: 'streamingText',
      initialState: '',
      reduce(state, event) {
        if (
          event.type === 'delta' &&
          Predicate.isObject(event.payload) &&
          'text' in event.payload &&
          Predicate.isString(event.payload.text)
        ) {
          return state + event.payload.text
        }

        return state
      },
    })

    const cache = new ProjectionCache()
    const e1 = { ...makeEvent(1, 'delta', 'thr_1', true), payload: { text: 'Hello ' } }
    const e2 = { ...makeEvent(2, 'delta', 'thr_1', true), payload: { text: 'world!' } }

    const state1 = cache.fold(textFold, [e1])
    expect(state1).toBe('Hello ')

    const state2 = cache.fold(textFold, [e1, e2])
    expect(state2).toBe('Hello world!')
  })

  test('a projection and a live fold with the same reducer differ only by ephemeral events', () => {
    const durableOnly = defineProjection({ name: 'types', initialState: [], reduce: appendType })
    const everything = defineLiveFold({ name: 'types', initialState: [], reduce: appendType })

    const events = [
      makeEvent(1, 'started'),
      makeEvent(2, 'delta', 'thr_1', true),
      makeEvent(3, 'finished'),
    ]

    const cache = new ProjectionCache()
    expect(cache.project(durableOnly, events)).toEqual(['started', 'finished'])
    expect(cache.fold(everything, events)).toEqual(['started', 'delta', 'finished'])
  })

  test('infers live fold state from a shape schema', () => {
    const PartsSchema = Schema.Struct({
      parts: Schema.Array(Schema.String),
    })

    const partsFold = defineLiveFold({
      name: 'parts',
      shape: PartsSchema,
      initialState: { parts: [] },
      reduce(state, event) {
        if (
          event.type === 'delta' &&
          Predicate.isObject(event.payload) &&
          'text' in event.payload &&
          Predicate.isString(event.payload.text)
        ) {
          return { parts: state.parts.concat(event.payload.text) }
        }

        return state
      },
    })

    expect(partsFold.shape).toBe(PartsSchema)

    const cache = new ProjectionCache()
    const event = { ...makeEvent(1, 'delta'), payload: { text: 'Hello' } }
    expect(cache.fold(partsFold, [event]).parts).toEqual(['Hello'])
  })
})

describe('live fold retries', () => {
  test('drops ephemeral events from every attempt a later retry superseded', () => {
    const events = [
      delta(1, 'first ', 'eff_model'),
      retryScheduled(2, 'eff_model'),
      delta(3, 'second ', 'eff_model'),
      retryScheduled(4, 'eff_model'),
      delta(5, 'third', 'eff_model'),
    ]

    expect(foldLive(deltaText, events)).toBe('third')
  })

  test('keeps ephemeral events from other effects and durable events', () => {
    const durable = { ...makeEvent(2, 'delta'), effectId: 'eff_model', payload: { text: 'kept ' } }

    const events = [
      delta(1, 'dropped ', 'eff_model'),
      durable,
      delta(3, 'tool ', 'eff_tool'),
      retryScheduled(4, 'eff_model'),
      delta(5, 'retried', 'eff_model'),
    ]

    expect(foldLive(deltaText, events)).toBe('kept tool retried')
  })

  test('the incremental cache matches foldLive at every prefix', () => {
    const events = [
      delta(1, 'a', 'eff_model'),
      delta(2, 'b', 'eff_tool'),
      retryScheduled(3, 'eff_tool'),
      delta(4, 'c', 'eff_model'),
      retryScheduled(5, 'eff_model'),
      delta(6, 'd', 'eff_model'),
      delta(7, 'e', 'eff_tool'),
      retryScheduled(8, 'eff_other'),
      delta(9, 'f', 'eff_model'),
    ]

    const cache = new ProjectionCache()

    for (let length = 0; length <= events.length; length++) {
      const prefix = events.slice(0, length)
      expect(cache.fold(deltaText, prefix)).toBe(foldLive(deltaText, prefix))
    }
  })

  test('folds only new events until a batch contains a retry', () => {
    let reducerCalls = 0

    const counted = defineLiveFold({
      initialState: '',
      reduce(state, event) {
        reducerCalls += 1
        return deltaText.reduce(state, event)
      },
    })

    const cache = new ProjectionCache()
    const first = [delta(1, 'a', 'eff_model'), delta(2, 'b', 'eff_model')]
    cache.fold(counted, first)

    const appended = [...first, delta(3, 'c', 'eff_model')]
    expect(cache.fold(counted, appended)).toBe('abc')
    expect(reducerCalls).toBe(3)

    const retried = [...appended, retryScheduled(4, 'eff_model')]
    expect(cache.fold(counted, retried)).toBe('')
    expect(reducerCalls).toBe(4)
  })
})

describe('EventIndex', () => {
  test('indexes events by thread, seq, type, and counts', () => {
    const index = new EventIndex()

    const events = [
      makeEvent(1, 'runtime.run.started', 'thr_root'),
      makeEvent(2, 'worker.task', 'thr_worker_1'),
      makeEvent(3, 'worker.task', 'thr_worker_2'),
      makeEvent(4, 'worker.task', 'thr_worker_1'),
    ]

    index.append(events)

    expect(index.getStartedAt()).toBe(1001)
    expect(index.getCounts().get('thr_root')).toBe(1)
    expect(index.getCounts().get('thr_worker_1')).toBe(2)
    expect(index.getCounts().get('thr_worker_2')).toBe(1)

    expect(index.getBySeq(3)?.id).toBe('evt_3')
    expect(index.getBySeq(99)).toBeUndefined()

    expect(index.getLatest('worker.task')?.seq).toBe(4)

    const worker1Events = index.getByThread('thr_worker_1')
    expect(worker1Events).toHaveLength(2)
    expect(worker1Events[0]?.seq).toBe(2)
    expect(worker1Events[1]?.seq).toBe(4)

    // Snapshot is stable across reads
    expect(index.getByThread('thr_worker_1')).toBe(worker1Events)
  })
})

describe('Store snapshots and coalescing', () => {
  test('events snapshot has stable reference between batches', () => {
    const store = createLoomsStore({
      storeId: 'test_run',
      endpoint: 'http://127.0.0.1:9999',
      fetch: offlineFetch,
      coalesce: 'immediate',
    })

    const initialSnapshot = store.events()
    expect(store.events()).toBe(initialSnapshot)
    expect(store.version()).toBe(0)
    expect(store.status()).toBe('connecting')

    store.dispose()
  })

  test('coalesces notifications with flush', async () => {
    let notifyCount = 0

    const store = createLoomsStore({
      storeId: 'test_run',
      endpoint: 'http://127.0.0.1:9999',
      fetch: offlineFetch,
      coalesce: { delayMs: 100 },
    })

    store.subscribe(() => {
      notifyCount += 1
    })

    // Initial subscribe invokes listener once
    expect(notifyCount).toBe(1)

    // Flush when nothing is pending does not trigger extra notification
    store.flush()
    expect(notifyCount).toBe(1)

    store.dispose()
  })

  test('adaptive coalesce defaults and flush collapses pending notify', async () => {
    let notifyCount = 0

    const store = createLoomsStore({
      storeId: 'test_run_adaptive',
      endpoint: 'http://127.0.0.1:9999',
      fetch: offlineFetch,
    })

    store.subscribe(() => {
      notifyCount += 1
    })

    expect(notifyCount).toBe(1)
    store.flush()
    expect(notifyCount).toBe(1)

    store.dispose()
  })

  test('projection reducer called O(N) times across 10 subscriber reads', () => {
    let reducerCalls = 0

    const projection = defineProjection({
      name: 'metrics',
      initialState: 0,
      reduce(state, _event) {
        reducerCalls += 1
        return state + 1
      },
    })

    const cache = new ProjectionCache()
    const events = Array.from({ length: 50 }, (_, i) => makeEvent(i + 1, 'ping'))

    // 10 subscribers read the projection
    for (let sub = 0; sub < 10; sub++) {
      const result = cache.project(projection, events)
      expect(result).toBe(50)
    }

    // Reducer should only be called 50 times (O(N)), NOT 500 times (10 * 50)!
    expect(reducerCalls).toBe(50)

    // 10 more events arrive
    const moreEvents = [
      ...events,
      ...Array.from({ length: 10 }, (_, i) => makeEvent(51 + i, 'ping')),
    ]

    // 10 subscribers read again
    for (let sub = 0; sub < 10; sub++) {
      const result = cache.project(projection, moreEvents)
      expect(result).toBe(60)
    }

    // Only 10 additional reducer calls for the new batch!
    expect(reducerCalls).toBe(60)
  })
})
