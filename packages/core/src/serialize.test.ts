import { describe, expect, test } from 'bun:test'

import { createKeyedSerializer } from './serialize'

describe('createKeyedSerializer', () => {
  test('runs tasks for the same key in FIFO order', async () => {
    const serializer = createKeyedSerializer()
    const log: string[] = []

    const p1 = serializer.run('k1', async () => {
      await new Promise((resolve) => setTimeout(resolve, 30))
      log.push('first')
      return 1
    })

    const p2 = serializer.run('k1', async () => {
      await new Promise((resolve) => setTimeout(resolve, 5))
      log.push('second')
      return 2
    })

    const p3 = serializer.run('k1', async () => {
      log.push('third')
      return 3
    })

    const results = await Promise.all([p1, p2, p3])
    expect(results).toEqual([1, 2, 3])
    expect(log).toEqual(['first', 'second', 'third'])
  })

  test('a failed task does not block later tasks on the same key', async () => {
    const serializer = createKeyedSerializer()
    const log: string[] = []

    const p1 = serializer.run('k1', async () => {
      log.push('start-1')
      throw new Error('failed')
    })

    const p2 = serializer.run('k1', async () => {
      log.push('start-2')
      return 'recovered'
    })

    expect(p1).rejects.toThrow('failed')
    const res = await p2
    expect(res).toBe('recovered')
    expect(log).toEqual(['start-1', 'start-2'])
  })

  test('automatically evicts completed keys from map to prevent memory leaks', async () => {
    const serializer = createKeyedSerializer()
    await serializer.run('k1', async () => 'done')
    // Once task and cleanup resolve:
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(serializer.size()).toBe(0)
  })

  test('drain waits for all pending tasks for a key', async () => {
    const serializer = createKeyedSerializer()
    let finished = false

    void serializer.run('k1', async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
      finished = true
    })

    expect(finished).toBe(false)
    await serializer.drain('k1')
    expect(finished).toBe(true)
  })
})
