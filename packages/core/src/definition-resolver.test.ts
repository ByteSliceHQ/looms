import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import {
  cachedDefinitionResolver,
  chainDefinitionResolvers,
  pinnedDefinitionRefs,
  staticDefinitionResolver,
} from './definition-resolver'
import { makeDefinitionStore, type VersionedDefinition } from './definition-store'
import { createEvent } from './envelope'

const checkout = {
  kind: 'workflow',
  name: 'checkout',
  version: 'v1',
} as const

const refund = {
  kind: 'workflow',
  name: 'refund',
  version: 'v2',
} as const

function started(type: string, payload: Record<string, string>) {
  return {
    ...createEvent('run_1', {
      type,
      payload,
      origin: { type: 'system' as const },
    }),
    seq: 1,
  }
}

describe('definition resolver', () => {
  test('static lookup returns the registered object and misses as undefined', async () => {
    const resolver = staticDefinitionResolver([checkout])
    const found = await Effect.runPromise(resolver.resolve('workflow', 'checkout', 'v1'))

    expect(found).toBe(checkout)
    expect(resolver.peek('workflow', 'refund', 'v2')).toBeUndefined()
    expect(await Effect.runPromise(resolver.resolve('workflow', 'refund', 'v2'))).toBeUndefined()
  })

  test('chain stops at the first definition', async () => {
    let calls = 0

    const second = {
      peek: () => undefined,
      resolve: () =>
        Effect.sync(() => {
          calls += 1
          return refund
        }),
    }

    const resolver = chainDefinitionResolvers([staticDefinitionResolver([checkout]), second])
    const found = await Effect.runPromise(resolver.resolve('workflow', 'checkout', 'v1'))

    expect(found).toBe(checkout)
    expect(calls).toBe(0)
    expect(await Effect.runPromise(resolver.resolve('workflow', 'refund', 'v2'))).toBe(refund)
    expect(calls).toBe(1)
  })

  test('cache returns a miss without fetching again and evicts the oldest entry', async () => {
    const fetches: string[] = []

    const inner = {
      peek: () => undefined,
      resolve: (kind: string, name: string, version: string) =>
        Effect.sync(() => {
          fetches.push(`${kind}:${name}@${version}`)

          if (name === 'missing') {
            return undefined
          }

          return { kind, name, version }
        }),
    }

    const resolver = cachedDefinitionResolver(inner, { capacity: 1 })

    expect(await Effect.runPromise(resolver.resolve('workflow', 'missing', 'v1'))).toBeUndefined()
    expect(await Effect.runPromise(resolver.resolve('workflow', 'missing', 'v1'))).toBeUndefined()
    expect(fetches).toEqual(['workflow:missing@v1'])
    expect(resolver.peek('workflow', 'missing', 'v1')).toBeUndefined()

    await Effect.runPromise(resolver.resolve('workflow', 'checkout', 'v1'))
    expect(resolver.peek('workflow', 'missing', 'v1')).toBeUndefined()
    expect(resolver.peek('workflow', 'checkout', 'v1')?.name).toBe('checkout')

    await Effect.runPromise(resolver.resolve('workflow', 'missing', 'v1'))
    expect(fetches).toEqual(['workflow:missing@v1', 'workflow:checkout@v1', 'workflow:missing@v1'])
  })

  test('a store peeks a primed resolver and keeps its own definitions first', async () => {
    const dynamic = { kind: 'workflow', name: 'dynamic', version: 'v9', nodes: ['a'] }

    const resolver = cachedDefinitionResolver({
      peek: () => undefined,
      resolve: (kind: string, name: string, version: string) =>
        Effect.succeed(
          kind === 'workflow' && name === 'dynamic' && version === 'v9' ? dynamic : undefined,
        ),
    })

    const store = makeDefinitionStore<VersionedDefinition>('workflow', [checkout])
    store.useResolver(resolver)

    expect(store.get('checkout', 'v1')).toBe(checkout)
    expect(store.get('dynamic', 'v9')).toBeUndefined()
    expect(await Effect.runPromise(store.resolve('dynamic', 'v9'))).toBe(dynamic)
    expect(store.get('dynamic', 'v9')).toMatchObject({ nodes: ['a'] })
  })

  test('pinned refs follow the start events and default a missing version', () => {
    const refs = pinnedDefinitionRefs([
      started('runtime.run.started', {
        kind: 'workflow',
        definitionName: 'checkout',
        definitionVersion: 'v2',
      }),
      started('runtime.thread.started', {
        kind: 'workflow',
        definitionName: 'checkout',
        definitionVersion: 'v2',
      }),
      started('runtime.thread.started', { kind: 'agent', definitionName: 'helper' }),
      started('workflow.node.started', { nodeId: 'a' }),
    ])

    expect(refs).toEqual([
      { kind: 'workflow', name: 'checkout', version: 'v2' },
      { kind: 'agent', name: 'helper', version: 'v1' },
    ])
  })
})
