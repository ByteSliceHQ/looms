import { describe, expect, test } from 'bun:test'

import { Effect, ManagedRuntime } from 'effect'

import {
  composeModules,
  defineEffect,
  defineRuntimeModule,
  staticDefinitionResolver,
  type LocalEffectContext,
  type RunLauncher,
} from '@looms/core'

import { dispatchEffect } from './dispatch-effect'
import { moduleServices } from './helpers'

const launcher: RunLauncher = {
  launch: () => Effect.void,
  status: () => Effect.succeed(null),
  signal: () => Effect.void,
  cancel: () => Effect.void,
}

const ctx: LocalEffectContext = {
  placement: 'local',
  effectId: 'eff_1',
  runId: 'run_1',
  threadId: 'thr_1',
  causingEventId: 'evt_1',
  attributes: {},
  secrets: {},
  signal: new AbortController().signal,
  trace: null,
  heartbeat: () => Promise.resolve(),
  emit: () => Promise.resolve(),
}

function dispatch(effects: Parameters<typeof defineRuntimeModule>[0]['effects'], type: string) {
  const modules = [defineRuntimeModule({ namespace: 'demo', protocolVersion: '1.0.0', effects })]
  const registry = composeModules(modules)
  const services = ManagedRuntime.make(moduleServices(modules))

  return Effect.runPromise(
    dispatchEffect(
      registry,
      services,
      staticDefinitionResolver([]),
      launcher,
      { type, input: {}, tag: 'demo' },
      ctx,
    ),
  ).finally(() => services.dispose())
}

describe('dispatchEffect', () => {
  test('runs a local definition', async () => {
    const ping = defineEffect({
      type: 'demo.ping',
      placement: 'local',
      execute: () => [{ type: 'demo.pong', payload: null }],
    })

    expect(await dispatch({ ping }, 'demo.ping')).toEqual([{ type: 'demo.pong', payload: null }])
  })

  test('fails a worker definition that reaches the host instead of completing it', async () => {
    const render = defineEffect({ type: 'demo.render', placement: 'worker' })

    expect(await dispatch({ render }, 'demo.render')).toEqual([
      {
        type: 'runtime.effect.failed',
        payload: {
          effectId: 'eff_1',
          error: 'demo.render is worker-placed; the host cannot run it',
          nonRetryable: true,
        },
        threadId: 'thr_1',
      },
    ])
  })
})
