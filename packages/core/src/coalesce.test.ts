import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import { createCoalescingAppender } from './coalesce'

const run = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromise(effect)
const tick = () => run(Effect.yieldNow)

describe('createCoalescingAppender', () => {
  test('preserves push order across flushes', async () => {
    const batches: number[][] = []

    const appender = createCoalescingAppender<number>((_key, batch) =>
      Effect.sync(() => {
        batches.push([...batch])
      }),
    )

    for (let i = 0; i < 20; i++) {
      await run(appender.push('k', i))
    }

    await run(appender.drain('k'))
    expect(batches.flat()).toEqual([...Array(20).keys()])
  })

  test('keeps at most one flush in flight per key', async () => {
    let inFlight = 0
    let maxInFlight = 0

    const appender = createCoalescingAppender<number>(() =>
      Effect.gen(function* () {
        inFlight += 1
        maxInFlight = Math.max(maxInFlight, inFlight)
        yield* Effect.sleep(20)
        inFlight -= 1
      }),
    )

    await run(Effect.all(Array.from({ length: 30 }, (_, i) => appender.push('k', i))))
    await run(appender.drain('k'))
    expect(maxInFlight).toBe(1)
  })

  test('flushes the first push without waiting for more items', async () => {
    const batches: number[][] = []

    const appender = createCoalescingAppender<number>((_key, batch) =>
      Effect.sync(() => {
        batches.push([...batch])
      }),
    )

    await run(appender.push('k', 1))
    await run(appender.drain('k'))
    expect(batches).toEqual([[1]])
  })

  test('coalesces arrivals while a flush is in flight', async () => {
    const batches: number[][] = []
    let release: (() => void) | undefined

    const firstFlush = new Promise<void>((resolve) => {
      release = resolve
    })

    const appender = createCoalescingAppender<number>((_key, batch) =>
      Effect.gen(function* () {
        batches.push([...batch])

        if (batches.length === 1) {
          yield* Effect.promise(() => firstFlush)
        }
      }),
    )

    await run(appender.push('k', 1))
    await tick()
    expect(batches).toEqual([[1]])

    await run(appender.push('k', 2))
    await run(appender.push('k', 3))
    expect(batches).toEqual([[1]])

    release?.()
    await run(appender.drain('k'))
    expect(batches).toEqual([[1], [2, 3]])
  })

  test('drain waits for an in-flight flush and a refilled buffer', async () => {
    let flushed = 0
    let release: (() => void) | undefined

    const firstFlush = new Promise<void>((resolve) => {
      release = resolve
    })

    const appender = createCoalescingAppender<number>((_key, batch) =>
      Effect.gen(function* () {
        flushed += batch.length

        if (flushed === 1) {
          yield* Effect.promise(() => firstFlush)
        }
      }),
    )

    await run(appender.push('k', 1))
    await tick()
    await run(appender.push('k', 2))
    await run(appender.push('k', 3))

    let drained = false

    const draining = run(appender.drain('k')).then(() => {
      drained = true
    })

    await tick()
    expect(drained).toBe(false)
    expect(flushed).toBe(1)

    release?.()
    await draining
    expect(drained).toBe(true)
    expect(flushed).toBe(3)
  })

  test('a failed flush poisons later pushes and still lets drain succeed', async () => {
    const appender = createCoalescingAppender<number>(() => Effect.fail(new Error('boom')))

    await run(appender.push('k', 1))
    await run(appender.drain('k'))
    expect(run(appender.push('k', 2))).rejects.toThrow('boom')
  })

  test('maxPending backpressure waits for the next flush', async () => {
    let release: (() => void) | undefined

    const held = new Promise<void>((resolve) => {
      release = resolve
    })

    const appender = createCoalescingAppender<number>(() => Effect.promise(() => held), {
      maxPending: 2,
    })

    await run(appender.push('k', 1))
    await tick()

    await run(appender.push('k', 2))
    await run(appender.push('k', 3))

    let released = false

    const blocked = run(appender.push('k', 4)).then(() => {
      released = true
    })

    await tick()
    expect(released).toBe(false)

    release?.()
    await blocked
    expect(released).toBe(true)
    await run(appender.drain('k'))
  })

  test('clear drops poison so the key can flush again', async () => {
    let shouldFail = true
    const flushed: number[] = []

    const appender = createCoalescingAppender<number>((_key, batch) =>
      Effect.gen(function* () {
        if (shouldFail) {
          return yield* Effect.fail(new Error('boom'))
        }

        flushed.push(...batch)
      }),
    )

    await run(appender.push('k', 1))
    await run(appender.drain('k'))
    expect(run(appender.push('k', 2))).rejects.toThrow('boom')

    appender.clear('k')
    shouldFail = false
    await run(appender.push('k', 3))
    await run(appender.drain('k'))
    expect(flushed).toEqual([3])
  })

  test('flushes independent keys concurrently', async () => {
    let inFlight = 0
    let maxInFlight = 0

    const appender = createCoalescingAppender<number>(() =>
      Effect.gen(function* () {
        inFlight += 1
        maxInFlight = Math.max(maxInFlight, inFlight)
        yield* Effect.sleep(15)
        inFlight -= 1
      }),
    )

    await run(Effect.all([appender.push('a', 1), appender.push('b', 1)]))
    await run(Effect.all([appender.drain('a'), appender.drain('b')]))
    expect(maxInFlight).toBe(2)
  })
})
