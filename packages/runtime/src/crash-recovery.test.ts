import { describe, expect, test } from 'bun:test'
import { defineAgent, defineWorkflow } from '@looms/core'
import { createLooms } from './looms'

describe('crash recovery', () => {
  test('new runtime resumes parked HITL from the same EventStore', async () => {
    const wf = defineWorkflow({
      name: 'hitl-crash',
      nodes: [
        {
          id: 'review',
          run: (ctx) =>
            ctx.requestReview({
              title: 'Approve release?',
              actions: [{ id: 'ok', label: 'Ship', outcome: 'approve' }],
            }),
        },
        {
          id: 'ship',
          deps: ['review'],
          run: () => ({ shipped: true }),
        },
      ],
      output: ({ results }) => results,
    })

    const first = createLooms({ definitions: [wf] })
    const { actorId, state: parked } = await first.startWorkflow('hitl-crash', null)
    expect(parked.status).toBe('waiting_review')
    const reviewId = Object.keys(parked.reviews)[0]
    expect(reviewId).toBeDefined()

    // Simulate process restart: new host, same durable store
    const { store } = await first.ready()
    const second = createLooms({
      definitions: [wf],
      store,
    })
    const resumed = await second.decideReview(actorId, reviewId!, {
      actionId: 'ok',
      outcome: 'approve',
    })
    expect(resumed.status).toBe('completed')
    expect(resumed.output).toEqual({
      review: { approved: true },
      ship: { shipped: true },
    })
  })

  test('wake after restart completes owed agent turn from log', async () => {
    const agent = defineAgent({
      name: 'recover-echo',
      instructions: 'echo',
      runTurn: ({ input }) => ({
        message: { role: 'assistant', content: 'recovered' },
        done: true,
        output: input,
      }),
    })

    const first = createLooms({ definitions: [agent] })
    const { actorId } = await first.startAgent('recover-echo', { n: 1 })

    const { store } = await first.ready()
    const second = createLooms({
      definitions: [agent],
      store,
    })
    const state = await second.wake(actorId)
    expect(state.status).toBe('completed')
    expect(state.output).toEqual({ n: 1 })
  })
})
