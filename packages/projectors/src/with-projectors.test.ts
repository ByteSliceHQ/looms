import { describe, expect, test } from 'bun:test'
import { event, makeMemoryEventStore, type LoomsEvent } from '@looms/core'
import { Effect } from 'effect'
import type { Projector } from './projector'
import { projectEvents, withProjectors } from './with-projectors'

describe('withProjectors', () => {
  test('delivers appended events as a batch in log order', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const seen: LoomsEvent[][] = []
    const projector: Projector = {
      name: 'spy',
      project: async (events) => {
        seen.push([...events])
      },
    }
    const wrapped = withProjectors(store, [projector])
    await Effect.runPromise(
      wrapped.append('a1', [
        event(
          'actor.started',
          'a1',
          {
            kind: 'workflow',
            definitionName: 'pipe',
            input: null,
            parentActorId: null,
          },
          { seq: 1 },
        ),
        event('actor.completed', 'a1', { output: null }, { seq: 2 }),
      ]),
    )

    expect(seen).toHaveLength(1)
    expect(seen[0]?.map((e) => e.type)).toEqual(['actor.started', 'actor.completed'])
    expect(seen[0]?.map((e) => e.seq)).toEqual([1, 2])
  })

  test('isolates projector failures so append still succeeds', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const errors: Array<{ name: string; message: string }> = []
    const boom: Projector = {
      name: 'boom',
      project: async () => {
        throw new Error('nope')
      },
    }
    const wrapped = withProjectors(store, [boom], {
      onError: (error, projector) => {
        errors.push({
          name: projector.name,
          message: error.message,
        })
      },
    })
    const result = await Effect.runPromise(
      wrapped.append('a1', [event('actor.completed', 'a1', { output: null })]),
    )
    expect(result.sequences).toHaveLength(1)
    expect(errors).toEqual([{ name: 'boom', message: 'nope' }])
  })

  test('projectEvents delivers the batch to each projector', async () => {
    const seen: string[] = []
    const first: Projector = {
      name: 'first',
      project: async (events) => {
        seen.push(`first:${events.length}`)
      },
    }
    const second: Projector = {
      name: 'second',
      project: async (events) => {
        seen.push(`second:${events[0]?.type ?? ''}`)
      },
    }
    await projectEvents(
      [first, second],
      [event('actor.completed', 'a1', { output: null }, { seq: 1 })],
    )
    expect(seen).toEqual(['first:1', 'second:actor.completed'])
  })
})
