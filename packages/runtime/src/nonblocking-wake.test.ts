import { describe, expect, test } from 'bun:test'

import { Effect, Predicate, Schema } from 'effect'

import { agent, defineAgent, steer } from '@looms/agent'
import {
  complete,
  defineEffect,
  defineEventCatalog,
  defineRuntimeModule,
  defineThread,
  invoke,
  spawn,
  wait,
} from '@looms/core'

import { createLooms } from './looms'

async function waitFor(
  predicate: () => Promise<boolean> | boolean,
  timeoutMs = 2_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs

  while (!(await predicate()) && Date.now() < deadline) {
    await Bun.sleep(5)
  }

  if (!(await predicate())) {
    throw new Error('timed out waiting for condition')
  }
}

describe('non-blocking wake', () => {
  test(
    'plans a sibling thread while another local effect is still in flight',
    async () => {
      let releaseSlow: (() => void) | undefined
      let slowStarted = false
      let fastFinished = false

      const catalog = defineEventCatalog('nb', {
        poke: Schema.Struct({}),
        slowDone: Schema.Struct({}),
        fastDone: Schema.Struct({}),
      })

      const slow = defineEffect({
        type: 'nb.slow',
        placement: 'local',
        execute: (_input, ctx) =>
          Effect.promise(
            () =>
              new Promise<readonly { type: string; payload: {}; threadId: string }[]>((resolve) => {
                slowStarted = true

                releaseSlow = () =>
                  resolve([{ type: 'nb.slowDone', payload: {}, threadId: ctx.threadId }])
              }),
          ),
      })

      const fast = defineEffect({
        type: 'nb.fast',
        placement: 'local',
        execute: (_input, ctx) => {
          fastFinished = true
          return [{ type: 'nb.fastDone', payload: {}, threadId: ctx.threadId }]
        },
      })

      const session = defineThread<{
        phase: 'boot' | 'waiting' | 'poked'
        slowDone: boolean
        fastDone: boolean
      }>({
        kind: 'nb-session',
        initialState: () => ({ phase: 'boot', slowDone: false, fastDone: false }),
        step: (state, event) => {
          if (event.type === 'runtime.thread.started' && state.phase === 'boot') {
            return { ...state, phase: 'waiting' }
          }

          if (event.type === 'nb.poke') {
            return { ...state, phase: 'poked' }
          }

          if (
            event.type === 'runtime.wait.satisfied' &&
            Predicate.isObject(event.payload) &&
            Predicate.isObject(event.payload.tag) &&
            Predicate.isString(event.payload.tag.kind)
          ) {
            if (event.payload.tag.kind === 'fast') {
              return { ...state, fastDone: true }
            }

            if (event.payload.tag.kind === 'slow') {
              return { ...state, slowDone: true }
            }
          }

          return state
        },
        effects: (state, ctx) => {
          if (state.phase === 'waiting') {
            return [
              spawn({
                childThreadId: `${ctx.threadId}:slow`,
                kind: 'nb-worker',
                definitionName: 'nb-worker',
                input: { mode: 'slow' },
              }),
              wait({
                waitId: `${ctx.threadId}:mailbox`,
                on: { type: 'nb.poke' },
              }),
            ]
          }

          if (state.phase === 'poked' && !state.fastDone) {
            return [
              spawn({
                childThreadId: `${ctx.threadId}:fast`,
                kind: 'nb-worker',
                definitionName: 'nb-worker',
                input: { mode: 'fast' },
              }),
              wait({
                waitId: `${ctx.threadId}:fast-done`,
                on: {
                  type: 'runtime.thread.completed',
                  match: { threadId: `${ctx.threadId}:fast` },
                },
                tag: { kind: 'fast' },
              }),
            ]
          }

          if (!state.slowDone) {
            return [
              wait({
                waitId: `${ctx.threadId}:slow-done`,
                on: {
                  type: 'runtime.thread.completed',
                  match: { threadId: `${ctx.threadId}:slow` },
                },
                tag: { kind: 'slow' },
              }),
            ]
          }

          return [complete({ ok: true })]
        },
      })

      const worker = defineThread<{ mode: string; done: boolean }>({
        kind: 'nb-worker',
        input: Schema.Struct({ mode: Schema.String }),
        initialState: (ctx) => ({
          mode: ctx.input?.mode ?? 'slow',
          done: false,
        }),
        step: (state, event) => {
          if (event.type === 'nb.slowDone' || event.type === 'nb.fastDone') {
            return { ...state, done: true }
          }

          return state
        },
        effects: (state) => {
          if (state.done) {
            return [complete({ ok: true })]
          }

          return state.mode === 'fast' ? [invoke(fast, null, 'fast')] : [invoke(slow, null, 'slow')]
        },
      })

      const module = defineRuntimeModule({
        namespace: 'nb',
        protocolVersion: '1.0.0',
        events: catalog,
        threads: {
          'nb-session': session,
          'nb-worker': worker,
        },
        effects: { slow, fast },
        definitions: [
          { kind: 'nb-session', name: 'nb-session', version: 'v1', input: Schema.Null },
          {
            kind: 'nb-worker',
            name: 'nb-worker',
            version: 'v1',
            input: Schema.Struct({ mode: Schema.String }),
          },
        ],
      })

      const looms = createLooms({ modules: [module] })

      const starting = looms.start(
        { kind: 'nb-session', name: 'nb-session', version: 'v1' },
        null,
        {
          runId: 'nb-run',
        },
      )

      await waitFor(() => slowStarted)

      void looms.signal('nb-run', [{ type: 'nb.poke', payload: {} }]).catch(() => undefined)

      await waitFor(() => fastFinished)
      expect(releaseSlow).toBeDefined()

      releaseSlow?.()
      void starting.catch(() => undefined)

      // start() may park while the slow fiber is still settling; nudge and wait on durable status.
      await waitFor(async () => {
        if ((await looms.getRun('nb-run')).status === 'completed') {
          return true
        }

        await looms.wake('nb-run').catch(() => undefined)

        return (await looms.getRun('nb-run')).status === 'completed'
      }, 8_000)

      expect((await looms.getRun('nb-run')).status).toBe('completed')
      await looms.stop()
    },
    { timeout: 15_000 },
  )

  test('a non-interrupt steer mid-call is still answered after the call finishes', async () => {
    const seen: string[] = []
    let releaseFirst: (() => void) | undefined
    let firstTurnStarted = false

    const assistant = defineAgent({
      name: 'midcall-steerable-nb',
      instructions: 'answer',
      conversational: true,
      runTurn: async ({ messages }) => {
        const content = messages.findLast((message) => message.role === 'user')?.content ?? ''
        seen.push(content)

        if (content === 'hello') {
          firstTurnStarted = true

          await new Promise<void>((resolve) => {
            releaseFirst = resolve
          })

          return { message: { role: 'assistant', content: 'hi' }, done: true }
        }

        return { message: { role: 'assistant', content: `heard: ${content}` }, done: true }
      },
    })

    const looms = createLooms({ modules: [agent({ definitions: [assistant] })] })
    const starting = looms.start(assistant, 'hello')
    await waitFor(() => firstTurnStarted)
    const [runId] = await looms.listRuns()
    const { rootThreadId } = await looms.getRun(runId!)

    void looms
      .signal(runId!, [
        steer({ content: 'late request', interrupt: false }, { threadId: rootThreadId! }),
      ])
      .catch(() => undefined)

    await waitFor(() => releaseFirst !== undefined)
    releaseFirst?.()
    await starting

    await waitFor(() => seen.includes('late request'))
    expect(seen).toEqual(['hello', 'late request'])

    await looms.stop()
  })
})
