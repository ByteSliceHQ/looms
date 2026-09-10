import { describe, expect, test } from 'bun:test'

import { Schema } from 'effect'

import { defineEventCatalog } from './catalog'
import { composeModules, ModuleCompositionError } from './compose'
import { defineEffect } from './effects'
import { defineRuntimeModule } from './module'
import { defineThread } from './thread'

const ping = defineThread({
  kind: 'ping',
  initialState: () => ({}),
  reduce: (state) => ({ state }),
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
    expect(composed.handlers.get('demo.work')).toBe(effect)
  })
})
