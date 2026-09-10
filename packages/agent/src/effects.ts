import { Effect, Predicate, Schema } from 'effect'

import { asJson, createThreadId, defineEffect, type EventInput, type JsonValue } from '@looms/core'
import { validateInput } from '@looms/core'

import { normalizeTools, type ToolLike } from './definitions'
import { AgentDefinitionsTag } from './definitions-store'
import { LlmTag } from './llm'
import { toolSpecs } from './tool-schema'
import { MessageSchema, ToolCallSchema, type ToolCall } from './types'

const CallLlmInput = Schema.Struct({
  turn: Schema.Number,
  definitionName: Schema.optional(Schema.String),
  messages: Schema.optional(Schema.Array(MessageSchema)),
  input: Schema.optional(Schema.Json),
})

const ExecuteToolInput = Schema.Struct({
  turn: Schema.Number,
  definitionName: Schema.optional(Schema.String),
  toolCall: ToolCallSchema,
})

function findTool(tools: ToolLike[], name: string): ToolLike | undefined {
  return tools.find((tool) => tool.name === name)
}

export const callLlmEffect = defineEffect({
  type: 'agent.callLLM',
  input: CallLlmInput,
  execute: (input, ctx) =>
    runCallLlm({
      turn: input.turn,
      definitionName: input.definitionName,
      // SAFETY: message arrays in callLLM input are serialized Message objects.
      messages: (input.messages as import('./types').Message[]) ?? [],
      input: input.input ?? null,
      runId: ctx.runId,
      threadId: ctx.threadId,
      emit: (event) => ctx.emit(event),
    }),
})

function runCallLlm(args: {
  turn: number
  definitionName?: string
  messages: import('./types').Message[]
  input: JsonValue
  runId: string
  threadId: string
  emit: (event: EventInput) => Promise<void>
}): Effect.Effect<ReadonlyArray<EventInput>, Error, LlmTag | AgentDefinitionsTag> {
  return Effect.gen(function* () {
    const { turn, threadId, emit, definitionName, messages, input } = args
    const agents = yield* AgentDefinitionsTag
    const llm = yield* LlmTag
    const definition = definitionName ? agents.get(definitionName) : undefined
    if (!definition) {
      return [
        {
          type: 'runtime.thread.failed',
          payload: { threadId, error: `Unknown agent definition for ${threadId}` },
          threadId,
        },
      ]
    }
    if (turn > (definition.maxTurns ?? 20)) {
      return [
        {
          type: 'runtime.thread.failed',
          payload: { threadId, error: `Max turns exceeded (${definition.maxTurns ?? 20})` },
          threadId,
        },
      ]
    }

    const tools = normalizeTools(definition.tools)
    const events: EventInput[] = [
      {
        type: 'agent.turn.started',
        payload: { turn },
        threadId,
      },
    ]

    const turnCtx = {
      threadId,
      turn,
      messages,
      input,
      tools,
      instructions: definition.instructions,
    }

    const result = definition.runTurn
      ? yield* Effect.tryPromise({
          try: () => Promise.resolve(definition.runTurn!(turnCtx)),
          catch: (cause) => (cause instanceof Error ? cause : new Error(String(cause))),
        })
      : yield* llm.complete({
          model: definition.model,
          instructions: definition.instructions,
          messages: [{ role: 'system', content: definition.instructions }, ...turnCtx.messages],
          tools,
          toolSpecs: toolSpecs(tools),
          onTextDelta: async (delta) => {
            await emit({
              type: 'agent.turn.text_delta',
              payload: { turn, delta },
              threadId,
              ephemeral: true,
            })
          },
        })

    const toolCalls = result.toolCalls ?? result.message.toolCalls ?? []
    const shouldStop = definition.stopWhen?.({
      turn,
      maxTurns: definition.maxTurns ?? 20,
      messages: turnCtx.messages,
      toolCalls,
      result,
    })

    events.push({
      type: 'agent.message',
      payload: asJson({
        turn,
        message: result.message,
        usage: result.usage ?? null,
      }),
      threadId,
    })

    if (shouldStop) {
      if (!definition.conversational) {
        events.push({
          type: 'runtime.thread.completed',
          payload: { threadId, output: result.output ?? { text: result.message.content } },
          threadId,
        })
      }
      return events
    }

    for (const toolCall of toolCalls) {
      events.push({
        type: 'agent.tool_call.requested',
        payload: asJson({ turn, toolCall }),
        threadId,
      })
    }

    if (toolCalls.length === 0 && !definition.conversational) {
      events.push({
        type: 'runtime.thread.completed',
        payload: {
          threadId,
          output: result.output ?? { text: result.message.content },
        },
        threadId,
      })
    }

    return events
  })
}

export const executeToolEffect = defineEffect({
  type: 'agent.executeTool',
  input: ExecuteToolInput,
  execute: (input, ctx) =>
    Effect.gen(function* () {
      const threadId = ctx.threadId
      const agents = yield* AgentDefinitionsTag
      const definition = input.definitionName ? agents.get(input.definitionName) : undefined
      if (!definition) {
        return [
          {
            type: 'agent.tool.result',
            payload: {
              turn: input.turn,
              toolCallId: input.toolCall.id,
              name: input.toolCall.name,
              result: null,
              error: 'Unknown agent definition',
            },
            threadId,
          },
        ]
      }
      const tools = normalizeTools(definition.tools)
      const tool = findTool(tools, input.toolCall.name)
      if (!tool) {
        return [
          {
            type: 'agent.tool.result',
            payload: {
              turn: input.turn,
              toolCallId: input.toolCall.id,
              name: input.toolCall.name,
              result: null,
              error: `Unknown tool: ${input.toolCall.name}`,
            },
            threadId,
          },
        ]
      }
      switch (tool.kind) {
        case 'function': {
          const validated = yield* Effect.tryPromise({
            try: () => validateInput(tool.input, input.toolCall.arguments),
            catch: (cause) => (cause instanceof Error ? cause : new Error(String(cause))),
          }).pipe(
            Effect.map((value) => ({ ok: true as const, value })),
            Effect.catch((err) => Effect.succeed({ ok: false as const, error: err.message })),
          )
          if (!validated.ok) {
            return [
              {
                type: 'agent.tool.result',
                payload: {
                  turn: input.turn,
                  toolCallId: input.toolCall.id,
                  name: input.toolCall.name,
                  result: null,
                  error: validated.error,
                },
                threadId,
              },
            ]
          }
          const result = yield* Effect.tryPromise({
            try: () =>
              Promise.resolve(
                tool.handler(validated.value, {
                  threadId,
                  turn: input.turn,
                }),
              ),
            catch: (cause) => (cause instanceof Error ? cause : new Error(String(cause))),
          }).pipe(
            Effect.map((value) => ({ ok: true as const, value })),
            Effect.catch((err) => Effect.succeed({ ok: false as const, error: err.message })),
          )
          return [
            {
              type: 'agent.tool.result',
              payload: {
                turn: input.turn,
                toolCallId: input.toolCall.id,
                name: input.toolCall.name,
                result: result.ok ? result.value : null,
                error: result.ok ? null : result.error,
              },
              threadId,
            },
          ]
        }
        case 'thread': {
          const validated = tool.input
            ? yield* Effect.tryPromise({
                try: () => validateInput(tool.input, input.toolCall.arguments),
                catch: (cause) => (cause instanceof Error ? cause : new Error(String(cause))),
              }).pipe(
                Effect.map((value) => ({ ok: true as const, value })),
                Effect.catch((err) => Effect.succeed({ ok: false as const, error: err.message })),
              )
            : { ok: true as const, value: input.toolCall.arguments }

          if (!validated.ok) {
            return [
              {
                type: 'agent.tool.result',
                payload: {
                  turn: input.turn,
                  toolCallId: input.toolCall.id,
                  name: input.toolCall.name,
                  result: null,
                  error: validated.error,
                },
                threadId,
              },
            ]
          }
          const childInput = tool.mapInput ? tool.mapInput(validated.value) : validated.value
          const childThreadId = createThreadId()
          return [
            {
              type: 'agent.spawn.requested',
              payload: {
                childThreadId,
                kind: tool.childKind,
                definitionName: tool.childName,
                input: childInput,
                toolCallId: input.toolCall.id,
              },
              threadId,
            },
          ]
        }
        case 'effects': {
          const validated = tool.input
            ? yield* Effect.tryPromise({
                try: () => validateInput(tool.input, input.toolCall.arguments),
                catch: (cause) => (cause instanceof Error ? cause : new Error(String(cause))),
              }).pipe(
                Effect.map((value) => ({ ok: true as const, value })),
                Effect.catch((err) => Effect.succeed({ ok: false as const, error: err.message })),
              )
            : { ok: true as const, value: input.toolCall.arguments }

          if (!validated.ok) {
            return [
              {
                type: 'agent.tool.result',
                payload: {
                  turn: input.turn,
                  toolCallId: input.toolCall.id,
                  name: input.toolCall.name,
                  result: null,
                  error: validated.error,
                },
                threadId,
              },
            ]
          }
          const effects = tool.effects(validated.value)
          return [
            {
              type: 'agent.effects.requested',
              payload: asJson({
                toolCallId: input.toolCall.id,
                effects,
                waitOn: tool.waitOn ?? null,
              }),
              threadId,
            },
          ]
        }
        default: {
          const exhaustiveCheck: never = tool
          return exhaustiveCheck
        }
      }
    }),
})

export function readToolCall(value: JsonValue): ToolCall | null {
  if (!Predicate.isObject(value)) return null
  if (!Predicate.isString(value.id) || !Predicate.isString(value.name)) return null
  return { id: value.id, name: value.name, arguments: value.arguments ?? null }
}
