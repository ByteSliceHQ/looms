import { describe, expect, test } from 'bun:test'

import { notifyObserver, type RuntimeObservation } from './observer'

describe('runtime observer', () => {
  test('is failure-isolated for synchronous and asynchronous observers', async () => {
    const event: RuntimeObservation = { type: 'run.wake', runId: 'run_1', at: 1 }

    expect(() =>
      notifyObserver(
        {
          observe() {
            throw new Error('sync failure')
          },
        },
        event,
      ),
    ).not.toThrow()

    notifyObserver(
      {
        observe: () => Promise.reject(new Error('async failure')),
      },
      event,
    )

    await Promise.resolve()
  })
})
