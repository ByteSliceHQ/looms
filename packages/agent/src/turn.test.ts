import { describe, expect, test } from 'bun:test'
import { defineAgent, defineTool, event, hasToolCall, reduceActor } from '@looms/core'
import { Effect, Layer, Schema } from 'effect'
import { LlmTag, StubLlmLive } from './llm'
import { executeAgentTurn, executeToolCall } from './turn'

const TextInputSchema = Schema.Struct({
  text: Schema.optional(Schema.String),
})

const AddInputSchema = Schema.Struct({
  a: Schema.Number,
  b: Schema.Number,
})

const ToolResultPayloadSchema = Schema.Struct({
  result: Schema.Number,
})

const AgentMessagePayloadSchema = Schema.Struct({
  message: Schema.Struct({
    content: Schema.String,
  }),
})

describe('@looms/agent', () => {
  test('runTurn override produces turn + message + completed', async () => {
    const def = defineAgent({
      name: 'echo',
      instructions: 'echo',
      runTurn: ({ input }) => {
        const parsed = Schema.decodeUnknownSync(TextInputSchema)(input ?? {})
        return {
          message: { role: 'assistant', content: parsed.text ?? '' },
          done: true,
          output: input,
        }
      },
    })
    const actorId = 'a1'
    const state = reduceActor([
      { ...event('actor.started', actorId, {
        kind: 'agent',
        definitionName: 'echo',
        input: { text: 'hi' },
        parentActorId: null,
      }), seq: 1 },
    ])
    if (state.kind !== 'agent') throw new Error('expected agent')

    const result = await Effect.runPromise(
      executeAgentTurn(def, state).pipe(Effect.provide(StubLlmLive())),
    )
    expect(result.events.map((e) => e.type)).toEqual([
      'agent.turn.started',
      'agent.message',
      'actor.completed',
    ])
  })

  test('function tool executes inline', async () => {
    const def = defineAgent({
      name: 'tools',
      instructions: 'use tools',
      tools: [
        defineTool({
          name: 'add',
          description: 'add',
          handler: (input) => {
            const n = Schema.decodeUnknownSync(AddInputSchema)(input)
            return n.a + n.b
          },
        }),
      ],
    })
    const actorId = 'a2'
    const state = reduceActor([
      { ...event('actor.started', actorId, {
        kind: 'agent',
        definitionName: 'tools',
        input: null,
        parentActorId: null,
      }), seq: 1 },
      { ...event('agent.turn.started', actorId, { turn: 1 }), seq: 2 },
      { ...event('agent.tool_call.requested', actorId, {
        turn: 1,
        toolCall: { id: 'tc1', name: 'add', arguments: { a: 1, b: 2 } },
      }), seq: 3 },
    ])
    if (state.kind !== 'agent') throw new Error('expected agent')

    const result = await Effect.runPromise(
      executeToolCall(def, state, 1, { id: 'tc1', name: 'add', arguments: { a: 1, b: 2 } }),
    )
    const toolResult = result.events[0]
    expect(toolResult?.type).toBe('tool.result')
    const payload = Schema.decodeUnknownSync(ToolResultPayloadSchema)(toolResult!.payload)
    expect(payload.result).toBe(3)
  })

  test('conversational agents do not complete after a text reply', async () => {
    const def = defineAgent({
      name: 'chat',
      instructions: 'chat',
      conversational: true,
      runTurn: () => ({
        message: { role: 'assistant', content: 'hello' },
        done: true,
      }),
    })
    const actorId = 'a4'
    const state = reduceActor([
      {
        ...event('actor.started', actorId, {
          kind: 'agent',
          definitionName: 'chat',
          input: 'hi',
          parentActorId: null,
        }),
        seq: 1,
      },
    ])
    if (state.kind !== 'agent') throw new Error('expected agent')

    const result = await Effect.runPromise(
      executeAgentTurn(def, state).pipe(Effect.provide(StubLlmLive())),
    )
    expect(result.events.map((e) => e.type)).toEqual(['agent.turn.started', 'agent.message'])
  })

  test('stopWhen + hasToolCall completes without executing tools', async () => {
    const def = defineAgent({
      name: 'answerer',
      instructions: 'answer',
      stopWhen: hasToolCall('answer'),
      runTurn: () => ({
        message: {
          role: 'assistant',
          content: '',
          toolCalls: [{ id: 'tc_ans', name: 'answer', arguments: { text: 'final' } }],
        },
        toolCalls: [{ id: 'tc_ans', name: 'answer', arguments: { text: 'final' } }],
      }),
    })
    const actorId = 'a5'
    const state = reduceActor([
      {
        ...event('actor.started', actorId, {
          kind: 'agent',
          definitionName: 'answerer',
          input: null,
          parentActorId: null,
        }),
        seq: 1,
      },
    ])
    if (state.kind !== 'agent') throw new Error('expected agent')

    const result = await Effect.runPromise(
      executeAgentTurn(def, state).pipe(Effect.provide(StubLlmLive())),
    )
    expect(result.events.map((e) => e.type)).toEqual([
      'agent.turn.started',
      'agent.message',
      'actor.completed',
    ])
    const completed = result.events.find((e) => e.type === 'actor.completed')
    expect(completed?.type === 'actor.completed' && completed.payload.output).toEqual({
      text: 'final',
    })
  })

  test('emits ephemeral text_delta through emit sink', async () => {
    const def = defineAgent({
      name: 'stream',
      instructions: 'stream',
    })
    const actorId = 'a6'
    const state = reduceActor([
      {
        ...event('actor.started', actorId, {
          kind: 'agent',
          definitionName: 'stream',
          input: null,
          parentActorId: null,
        }),
        seq: 1,
      },
      {
        ...event('agent.message.received', actorId, {
          message: { role: 'user', content: 'hi' },
        }),
        seq: 2,
      },
    ])
    if (state.kind !== 'agent') throw new Error('expected agent')

    const emitted: string[] = []
    const llm = Layer.succeed(LlmTag, {
      complete: (args) =>
        Effect.gen(function* () {
          yield* Effect.tryPromise({
            try: () => Promise.resolve(args.onTextDelta?.('hel')),
            catch: (cause) => (cause instanceof Error ? cause : new Error(String(cause))),
          })
          yield* Effect.tryPromise({
            try: () => Promise.resolve(args.onTextDelta?.('lo')),
            catch: (cause) => (cause instanceof Error ? cause : new Error(String(cause))),
          })
          return {
            message: { role: 'assistant' as const, content: 'hello' },
          }
        }),
    })

    const result = await Effect.runPromise(
      executeAgentTurn(def, state, {
        emit: (evt) => {
          emitted.push(evt.type)
        },
      }).pipe(Effect.provide(llm)),
    )
    expect(emitted).toEqual(['agent.turn.started', 'agent.turn.text_delta', 'agent.turn.text_delta'])
    expect(result.events.map((e) => e.type)).toEqual(['agent.message', 'actor.completed'])
  })

  test('adapter errors become actor.failed', async () => {
    const def = defineAgent({
      name: 'boom',
      instructions: 'boom',
    })
    const actorId = 'a7'
    const state = reduceActor([
      {
        ...event('actor.started', actorId, {
          kind: 'agent',
          definitionName: 'boom',
          input: null,
          parentActorId: null,
        }),
        seq: 1,
      },
    ])
    if (state.kind !== 'agent') throw new Error('expected agent')

    const llm = Layer.succeed(LlmTag, {
      complete: () => Effect.fail(new Error('provider down')),
    })
    const result = await Effect.runPromise(
      executeAgentTurn(def, state).pipe(Effect.provide(llm)),
    )
    expect(result.events.map((e) => e.type)).toEqual(['agent.turn.started', 'actor.failed'])
    const failed = result.events.find((e) => e.type === 'actor.failed')
    expect(failed?.type === 'actor.failed' && failed.payload.error).toBe('provider down')
  })

  test('StubLlm echoes last user message', async () => {
    const def = defineAgent({
      name: 'stub',
      instructions: 'echo',
    })
    const actorId = 'a3'
    const state = reduceActor([
      { ...event('actor.started', actorId, {
        kind: 'agent',
        definitionName: 'stub',
        input: null,
        parentActorId: null,
      }), seq: 1 },
      { ...event('agent.message.received', actorId, {
        message: { role: 'user', content: 'hello stub' },
      }), seq: 2 },
    ])
    if (state.kind !== 'agent') throw new Error('expected agent')

    const result = await Effect.runPromise(
      executeAgentTurn(def, state).pipe(Effect.provide(StubLlmLive())),
    )
    const msg = result.events.find((e) => e.type === 'agent.message')
    expect(msg).toBeDefined()
    const payload = Schema.decodeUnknownSync(AgentMessagePayloadSchema)(msg!.payload)
    expect(payload.message.content).toBe('hello stub')
  })
})
