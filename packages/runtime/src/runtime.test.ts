import { describe, expect, test } from 'bun:test'
import { agent, asEffectsTool, defineAgent } from '@looms/agent'
import { defineEffect, defineRuntimeModule, invoke, wait, type JsonValue } from '@looms/core'
import { defineWorkflow, workflow } from '@looms/workflow'
import { Effect, Predicate, Schema } from 'effect'
import { createLooms } from './looms'

describe('createLooms', () => {
  test('runs a deterministic echo agent to completion', async () => {
    const echo = defineAgent({
      name: 'echo',
      instructions: 'echo',
      runTurn: ({ input }) => ({
        message: { role: 'assistant', content: JSON.stringify(input) },
        done: true,
        output: input,
      }),
    })
    const looms = createLooms({ definitions: [echo] })
    const result = await looms.start(echo, { text: 'hi' })
    expect(result.state.status).toBe('completed')
    const root = result.state.rootThreadId
      ? result.state.threads[result.state.rootThreadId]
      : undefined
    expect(root?.status).toBe('completed')
    expect(root?.output).toEqual({ text: 'hi' })
  })

  test('withdraws sibling waits when an invoke fails', async () => {
    const boom = defineWorkflow({
      name: 'boom',
      nodes: [
        {
          id: 'charge',
          run: (ctx) =>
            ctx.effects([
              invoke('no.such.effect', {}),
              wait({ waitId: 'w_auth', on: { type: 'payments.charge.authorized' } }),
              wait({ waitId: 'w_decl', on: { type: 'payments.charge.declined' } }),
            ]),
        },
      ],
    })
    const looms = createLooms({ definitions: [boom] })
    const { runId, state } = await looms.start(boom, {})
    expect(state.status).toBe('failed')
    const root = state.rootThreadId ? state.threads[state.rootThreadId] : undefined
    expect(root?.status).toBe('failed')
    expect(Object.keys(state.waits)).toEqual([])
    const events = await looms.getEvents(runId)
    expect(events.some((event) => event.type === 'runtime.wait.registered')).toBe(false)
    expect(
      events.some(
        (event) =>
          event.type === 'runtime.effect.failed' &&
          Predicate.isObject(event.payload) &&
          Predicate.isString(event.payload.error) &&
          event.payload.error.startsWith('withdrawn:'),
      ),
    ).toBe(true)
  })

  test('applies definition defaults when spawning a child with empty input', async () => {
    const DefaultN = {
      '~standard': {
        version: 1 as const,
        vendor: 'looms-test',
        validate(value: JsonValue) {
          const obj = Predicate.isObject(value) ? value : {}
          const n = obj.n
          if (n !== undefined && !Predicate.isNumber(n)) {
            return { issues: [{ message: 'expected number' }] }
          }
          return { value: { n: Predicate.isNumber(n) ? n : 7 } }
        },
      },
    }
    const child = defineWorkflow({
      name: 'defaults',
      input: DefaultN,
      nodes: [{ id: 'out', run: (ctx) => ctx.input }],
    })
    const parent = defineWorkflow({
      name: 'spawner',
      nodes: [
        {
          id: 'spawn',
          run: (ctx) => ctx.spawn(child, {}),
        },
      ],
    })
    const looms = createLooms({ definitions: [child, parent] })
    const { runId, state } = await looms.start(parent, {})
    expect(state.status).toBe('completed')
    const childThread = Object.values(state.threads).find((thread) => thread.definitionName === 'defaults')
    expect(childThread?.input).toEqual({ n: 7 })
    const events = await looms.getEvents(runId)
    const started = events.find(
      (event) =>
        event.type === 'runtime.thread.started' &&
        Predicate.isObject(event.payload) &&
        event.payload.definitionName === 'defaults',
    )
    expect(started && Predicate.isObject(started.payload) ? started.payload.input : null).toEqual({ n: 7 })
  })

  test('invalid spawn input fails the child and unblocks the parent', async () => {
    const RequiredN = Schema.toStandardSchemaV1(Schema.Struct({ n: Schema.Number }))
    const child = defineWorkflow({
      name: 'needs_n',
      input: RequiredN,
      nodes: [{ id: 'out', run: (ctx) => ctx.input }],
    })
    const parent = defineWorkflow({
      name: 'bad_spawner',
      nodes: [
        {
          id: 'spawn',
          run: (ctx) => ctx.spawn(child, { n: 'nope' }),
        },
      ],
    })
    const looms = createLooms({ definitions: [child, parent] })
    const { state } = await looms.start(parent, {})
    expect(state.status).toBe('failed')
    const childThread = Object.values(state.threads).find((thread) => thread.definitionName === 'needs_n')
    expect(childThread?.status).toBe('failed')
    expect(childThread?.error).toBeTruthy()
    const parentThread = state.rootThreadId ? state.threads[state.rootThreadId] : undefined
    expect(parentThread?.status).toBe('failed')
  })

  test('invalid thread-tool args return a tool error without spawning', async () => {
    const RequiredN = Schema.toStandardSchemaV1(Schema.Struct({ n: Schema.Number }))
    const child = defineWorkflow({
      name: 'needs_n',
      input: RequiredN,
      nodes: [{ id: 'out', run: (ctx) => ctx.input }],
    })
    const caller = defineAgent({
      name: 'caller',
      instructions: 'call',
      tools: [child],
      runTurn: ({ turn }) => {
        if (turn === 1) {
          return {
            message: {
              role: 'assistant',
              content: '',
              toolCalls: [{ id: 't1', name: 'needs_n', arguments: { n: 'nope' } }],
            },
            toolCalls: [{ id: 't1', name: 'needs_n', arguments: { n: 'nope' } }],
          }
        }
        return {
          message: { role: 'assistant', content: 'handled' },
          done: true,
          output: { ok: true },
        }
      },
    })
    const looms = createLooms({ definitions: [child, caller] })
    const { runId, state } = await looms.start(caller, 'go')
    expect(state.status).toBe('completed')
    expect(Object.values(state.threads).some((thread) => thread.definitionName === 'needs_n')).toBe(false)
    const events = await looms.getEvents(runId)
    const toolResult = events.find((event) => event.type === 'agent.tool.result')
    expect(toolResult).toBeDefined()
    expect(
      toolResult && Predicate.isObject(toolResult.payload) ? toolResult.payload.error : null,
    ).toBeTruthy()
  })

  test('effects-tool handler failure does not park the agent', async () => {
    const failing = defineRuntimeModule({
      namespace: 'boom',
      protocolVersion: '1.0.0',
      effects: {
        explode: defineEffect({
          type: 'boom.explode',
          execute: () => Effect.fail(new Error('boom handler down')),
        }),
      },
    })
    const asker = defineAgent({
      name: 'asker',
      instructions: 'ask',
      tools: [
        asEffectsTool({
          name: 'explode',
          description: 'explode',
          effects: () => [
            invoke('boom.explode', {}),
            wait({ waitId: 'w_boom', on: { type: 'boom.done' } }),
          ],
          waitOn: { type: 'boom.done' },
        }),
      ],
      runTurn: ({ turn }) => {
        if (turn === 1) {
          return {
            message: {
              role: 'assistant',
              content: '',
              toolCalls: [{ id: 't1', name: 'explode', arguments: {} }],
            },
            toolCalls: [{ id: 't1', name: 'explode', arguments: {} }],
          }
        }
        return {
          message: { role: 'assistant', content: 'recovered' },
          done: true,
          output: { text: 'recovered' },
        }
      },
    })
    const looms = createLooms({
      definitions: [asker],
      modules: [agent(), workflow(), failing],
    })
    const { runId, state } = await looms.start(asker, 'go')
    const events = await looms.getEvents(runId)
    const types = events.map((event) => event.type)
    expect(state.status).toBe('completed')
    expect(Object.keys(state.waits)).toEqual([])
    expect(types.some((type) => type === 'runtime.wait.registered')).toBe(false)
    expect(types).toContain('agent.tool.result')
    const toolResult = events.find((event) => event.type === 'agent.tool.result')
    expect(
      toolResult && Predicate.isObject(toolResult.payload) && Predicate.isString(toolResult.payload.error)
        ? toolResult.payload.error
        : '',
    ).toContain('boom handler down')
  })

  test('streams text deltas in order before the assistant message', async () => {
    const llm = {
      async complete(args: { onTextDelta?: (delta: string) => void | Promise<void> }) {
        await args.onTextDelta?.('hel')
        await args.onTextDelta?.('lo')
        return {
          message: { role: 'assistant', content: 'hello' },
          done: true,
          output: { text: 'hello' },
        }
      },
    }
    const bot = defineAgent({
      name: 'streamer',
      instructions: 'stream',
    })
    const looms = createLooms({
      definitions: [bot],
      modules: [agent({ llm })],
    })
    const { runId } = await looms.start(bot, 'hi')
    const events = await looms.getEvents(runId)
    const deltas = events.filter((event) => event.type === 'agent.turn.text_delta')
    expect(
      deltas.map((event) => (Predicate.isObject(event.payload) ? event.payload.delta : '')),
    ).toEqual(['hel', 'lo'])
    const firstDelta = events.findIndex((event) => event.type === 'agent.turn.text_delta')
    const message = events.findIndex((event) => event.type === 'agent.message')
    expect(firstDelta).toBeGreaterThan(-1)
    expect(message).toBeGreaterThan(firstDelta)
    expect(deltas.every((event) => event.ephemeral === true)).toBe(true)
  })
})
