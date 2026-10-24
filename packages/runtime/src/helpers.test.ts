import { describe, expect, test } from 'bun:test'

import { Effect, Schema } from 'effect'

import { DEFAULT_DEFINITION_VERSION, staticDefinitionResolver } from '@looms/core'

import { threadStartedEvents } from './helpers'

describe('threadStartedEvents', () => {
  test('emits runtime.thread.started for registered definition', async () => {
    const def = {
      kind: 'workflow',
      name: 'checkout',
      version: DEFAULT_DEFINITION_VERSION,
      value: { kind: 'workflow', name: 'checkout', version: DEFAULT_DEFINITION_VERSION },
    }

    const events = await Effect.runPromise(
      threadStartedEvents(staticDefinitionResolver([def]), {
        kind: 'workflow',
        definitionName: 'checkout',
        definitionVersion: DEFAULT_DEFINITION_VERSION,
        input: { amount: 50 },
        threadId: 'thr_1',
        parentThreadId: null,
      }),
    )

    expect(events).toHaveLength(1)
    expect(events[0]?.type).toBe('runtime.thread.started')

    expect(events[0]?.payload).toEqual({
      threadId: 'thr_1',
      kind: 'workflow',
      definitionName: 'checkout',
      definitionVersion: DEFAULT_DEFINITION_VERSION,
      input: { amount: 50 },
      parentThreadId: null,
    })
  })

  test('rejects unknown definitions with explicit error', () => {
    expect(
      Effect.runPromise(
        threadStartedEvents(staticDefinitionResolver([]), {
          kind: 'workflow',
          definitionName: 'checkout',
          definitionVersion: DEFAULT_DEFINITION_VERSION,
          input: null,
          threadId: 'thr_1',
          parentThreadId: null,
        }),
      ),
    ).rejects.toThrow(/Unknown definition workflow:checkout/)
  })

  test('emits runtime.thread.failed when schema validation fails', async () => {
    const def = {
      kind: 'workflow',
      name: 'checkout',
      version: DEFAULT_DEFINITION_VERSION,
      input: Schema.Struct({ amount: Schema.Finite }),
      value: { kind: 'workflow', name: 'checkout', version: DEFAULT_DEFINITION_VERSION },
    }

    const events = await Effect.runPromise(
      threadStartedEvents(staticDefinitionResolver([def]), {
        kind: 'workflow',
        definitionName: 'checkout',
        definitionVersion: DEFAULT_DEFINITION_VERSION,
        input: { amount: 'not-a-number' },
        threadId: 'thr_1',
        parentThreadId: null,
      }),
    )

    expect(events).toHaveLength(2)
    expect(events[0]?.type).toBe('runtime.thread.started')
    expect(events[1]?.type).toBe('runtime.thread.failed')
  })
})
