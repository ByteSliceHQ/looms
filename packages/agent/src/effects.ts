import {
  asJson,
  createThreadId,
  defineEffect,
  type EventInput,
  type JsonValue,
} from '@looms/core'
import { Effect, Predicate, Schema } from 'effect'
import { AgentDefinitionsTag } from './definitions-store'
import { normalizeTools, type ToolLike } from './definitions'
import { LlmTag } from './llm'
import { toolSpecs } from './tool-schema'
import { validateInput } from '@looms/core'
import type { ToolCall } from './types'

const CallLlmInput = Schema.Struct({
  turn: Schema.Number,
})

const ToolCallSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  arguments: Schema.MutableJson,
})

const ExecuteToolInput = Schema.Struct({
  turn: Schema.Number,
  toolCall: ToolCallSchema,
})

function findTool(tools: ToolLike[], name: string): ToolLike | undefined {
  return tools.find((tool) => tool.name === name)
}

export const callLlmEffect = defineEffect({
  type: 'agent.callLLM',
  input: CallLlmInput,
  execute: (input, ctx) =>
    runCallLlm(input.turn, ctx.runId, ctx.threadId, (event) => ctx.emit(event)),
})

function runCallLlm(
  turn: number,
  _runId: string,
  threadId: string,
  emit: (event: EventInput) => void,
): Effect.Effect<ReadonlyArray<EventInput>, Error, LlmTag | AgentDefinitionsTag> {
  return Effect.gen(function* () {
    const agents = yield* AgentDefinitionsTag
    const llm = yield* LlmTag
    const definition = agents.get(currentDefinitionName(threadId))
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
      messages: currentLines(threadId),
      input: currentInput(threadId),
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
          onTextDelta: (delta) => {
            emit({
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
      const definition = agents.get(currentDefinitionName(threadId))
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
          const mapped = tool.mapInput ? tool.mapInput(input.toolCall.arguments) : input.toolCall.arguments
          const childThreadId = createThreadId()
          return [
            {
              type: 'agent.spawn.requested',
              payload: {
                childThreadId,
                kind: tool.childKind,
                definitionName: tool.childName,
                input: mapped,
                toolCallId: input.toolCall.id,
              },
              threadId,
            },
          ]
        }
        case 'effects': {
          const effects = tool.effects(input.toolCall.arguments)
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
          const _exhaustive: never = tool
          return _exhaustive
        }
      }
    }),
})

/** Filled by the runtime before dispatching agent effects. */
const threadBindings = new Map<string, { definitionName: string; lines: import('./types').Message[]; input: JsonValue }>()

export function bindAgentThread(
  threadId: string,
  binding: { definitionName: string; lines: import('./types').Message[]; input: JsonValue },
): void {
  threadBindings.set(threadId, binding)
}

function currentDefinitionName(threadId: string): string {
  return threadBindings.get(threadId)?.definitionName ?? ''
}

function currentLines(threadId: string): import('./types').Message[] {
  return threadBindings.get(threadId)?.lines ?? []
}

function currentInput(threadId: string): JsonValue {
  return threadBindings.get(threadId)?.input ?? null
}

export function readToolCall(value: JsonValue): ToolCall | null {
  if (!Predicate.isObject(value)) return null
  if (!Predicate.isString(value.id) || !Predicate.isString(value.name)) return null
  return { id: value.id, name: value.name, arguments: value.arguments ?? null }
}
