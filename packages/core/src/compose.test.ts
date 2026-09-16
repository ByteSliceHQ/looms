import { describe, expect, test } from 'bun:test'

import { Effect, Schema } from 'effect'

import { defineEventCatalog } from './catalog'
import {
  composeModules,
  composeModulesEffect,
  ModuleCompositionError,
  type EventsOf,
} from './compose'
import { defineEffect } from './effects'
import { defineRuntimeModule } from './module'
import { createModuleScope, defineModule } from './module-scope'
import { defineThread } from './thread'

const ping = defineThread({
  kind: 'ping',
  initialState: () => ({}),
  step: (state) => state,
})

describe('composeModules', () => {
  test('rejects duplicate namespaces', () => {
    const a = defineRuntimeModule({
      namespace: 'dup',
      protocolVersion: '1.0.0',
    })

    expect(() => composeModules([a, a])).toThrow(ModuleCompositionError)
  })

  test('indexes threads and effects', () => {
    const catalog = defineEventCatalog('demo', {
      done: Schema.Struct({ ok: Schema.Boolean }),
    })

    const effect = defineEffect({
      type: 'demo.work',
      input: Schema.Struct({ n: Schema.Number }),
      execute: () => [],
    })

    const module = defineRuntimeModule({
      namespace: 'demo',
      protocolVersion: '1.0.0',
      events: catalog,
      threads: { ping },
      effects: { work: effect },
    })

    const composed = composeModules([module])
    expect(composed.threads.get('ping')).toBe(ping)
    expect(composed.effects.get('demo.work')).toBe(effect)
  })

  test('composeModulesEffect returns typed ModuleCompositionError catchable with catchTag', async () => {
    const a = defineRuntimeModule({
      namespace: 'dup_effect',
      protocolVersion: '1.0.0',
    })

    const result = await Effect.runPromise(
      composeModulesEffect([a, a]).pipe(
        Effect.map(() => 'ok'),
        Effect.catchTag('ModuleCompositionError', (err) =>
          Effect.succeed(`caught: ${err.message}`),
        ),
      ),
    )

    expect(result).toContain('caught: Duplicate module namespace: dup_effect')
  })

  test('composes a module assembled from separately defined members', () => {
    const catalog = defineEventCatalog('scoped', {
      started: Schema.Struct({ id: Schema.String }),
    })

    const scoped = createModuleScope({
      namespace: 'scoped',
      protocolVersion: '1.0.0',
      events: catalog,
    })

    const thread = scoped.thread({
      kind: 'scopedThread',
      initialState: () => ({ id: '' }),
      step: (state, event) => {
        if (event.type === 'scoped.started') {
          return { id: event.payload.id }
        }

        return state
      },
    })

    const effect = scoped.effect({
      type: 'scoped.doWork',
      execute: () => [],
    })

    const module = defineModule(scoped, () => ({
      threads: { scopedThread: thread },
      effects: { work: effect },
    }))

    const composed = composeModules([module])
    expect(composed.threads.get('scopedThread')).toBe(thread)
    expect(composed.effects.get('scoped.doWork')).toBe(effect)
    expect(composed.catalogs).toHaveLength(2)
    expect(composed.catalogs[1]?.namespace).toBe('scoped')
  })

  test('collects definitions owned by modules', () => {
    const checkout = { kind: 'ping', name: 'checkout' }

    const module = defineRuntimeModule({
      namespace: 'flows',
      protocolVersion: '1.0.0',
      definitions: [checkout],
      threads: { ping },
    })

    const composed = composeModules([module])

    expect(composed.definitions).toEqual([
      { kind: 'ping', name: 'checkout', input: undefined, value: checkout },
    ])
  })

  test('rejects duplicate definitions across modules', () => {
    const def = { kind: 'ping', name: 'shared' }

    const a = defineRuntimeModule({
      namespace: 'a',
      protocolVersion: '1.0.0',
      definitions: [def],
      threads: { ping },
    })

    const b = defineRuntimeModule({
      namespace: 'b',
      protocolVersion: '1.0.0',
      definitions: [def],
      threads: { ping },
    })

    expect(() => composeModules([a, b])).toThrow(/Duplicate definition: ping:shared/)
  })

  test('rejects definitions whose owning module does not implement the kind', () => {
    const module = defineRuntimeModule({
      namespace: 'orphan',
      protocolVersion: '1.0.0',
      definitions: [{ kind: 'workflow', name: 'checkout' }],
    })

    expect(() => composeModules([module])).toThrow(
      /registers definition workflow:checkout but does not implement thread kind workflow/,
    )
  })
})

describe('EventsOf', () => {
  test('infers events from module arrays and creator functions', () => {
    const catalog = defineEventCatalog('demo', {
      done: Schema.Struct({ ok: Schema.Boolean }),
    })

    const module = defineRuntimeModule({
      namespace: 'demo',
      protocolVersion: '1.0.0',
      events: catalog,
    })

    const modules = [module] as const
    const createModules = () => modules

    type FromArray = EventsOf<typeof modules>
    type FromFn = EventsOf<typeof createModules>
    type FromComposed = EventsOf<{ modules: typeof modules }>
    type FromCatalog = EventsOf<typeof catalog>

    const fromArray: FromArray = {
      id: 'e1',
      runId: 'r1',
      seq: 1,
      ts: 1,
      type: 'demo.done',
      payload: { ok: true },
      threadId: null,
      origin: { type: 'system' },
    }

    const fromFn: FromFn = fromArray
    const fromComposed: FromComposed = fromArray
    const fromCatalog: FromCatalog = fromArray

    expect(fromArray.type).toBe('demo.done')
    expect(fromFn.payload.ok).toBe(true)
    expect(fromComposed.type).toBe('demo.done')
    expect(fromCatalog.payload.ok).toBe(true)

    // Protocol events are included for module arrays
    type ProtocolOk = Extract<FromArray, { type: 'runtime.run.started' }>
    // SAFETY: null placeholder only exercises the ProtocolOk type alias.
    const started = null as ProtocolOk | null
    expect(started).toBeNull()
  })
})
