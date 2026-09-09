import { describe, expect, test } from 'bun:test'
import { createKeyedSerializer } from './serialize'

describe('createKeyedSerializer', () => {
  test('runs tasks for the same key in FIFO order', async () => {
    const serializer = createKeyedSerializer()
    const order: number[] = []
    const tasks = [0, 1, 2, 3, 4].map((index) =>
      serializer.run('same-stream', async () => {
        await Bun.sleep(5 + ((4 - index) * 3))
        order.push(index)
        return index
      }),
    )
    const results = await Promise.all(tasks)
    expect(results).toEqual([0, 1, 2, 3, 4])
    expect(order).toEqual([0, 1, 2, 3, 4])
  })

  test('a failed task does not block later tasks on the same key', async () => {
    const serializer = createKeyedSerializer()
    const order: string[] = []
    const first = serializer.run('stream', async () => {
      order.push('a')
      throw new Error('boom')
    })
    const second = serializer.run('stream', async () => {
      order.push('b')
      return 'ok'
    })
    expect(first).rejects.toThrow('boom')
    expect(await second).toBe('ok')
    expect(order).toEqual(['a', 'b'])
  })
})
