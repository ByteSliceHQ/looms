import { Data, Effect, Predicate, Schema } from 'effect'

import {
  createThreadId,
  DEFAULT_DEFINITION_VERSION,
  validateInputEffect,
  type EventInputOf,
  type JsonValue,
} from '@looms/core'

import {
  buildStructuredOutputInstructions,
  defaultAgentCompactor,
  defineTool,
  isContextOverflowError,
  normalizeTools,
  STRUCTURED_OUTPUT_TOOL_NAME,
  TEAM_MEMBER_MAX_DEPTH,
  type AgentTurnResult,
  type ToolLike,
} from './definitions'
import { AgentDefinitionsTag } from './definitions-store'
import { LlmTag, type LlmError } from './llm'
import { agentModule, type AgentEvent } from './scope'
import { toolSpecs } from './tool-schema'
import { MessageSchema, ToolCallSchema, type Message, type ToolCall } from './types'

const CallLlmInput = Schema.Struct({
  turn: Schema.Finite,
  definitionName: Schema.optional(Schema.String),
  definitionVersion: Schema.String.pipe(
    Schema.withDecodingDefaultKey(Effect.succeed(DEFAULT_DEFINITION_VERSION)),
  ),
  messages: Schema.optional(Schema.Array(MessageSchema)),
  input: Schema.optional(Schema.Json),
  depth: Schema.optional(Schema.Finite),
  structuredOutput: Schema.optional(Schema.NullOr(Schema.Json)),
  alreadyCompacted: Schema.optional(Schema.Boolean),
  consumedSteerMessageIds: Schema.optional(Schema.Array(Schema.String)),
})

const ExecuteToolInput = Schema.Struct({
  turn: Schema.Finite,
  definitionName: Schema.optional(Schema.String),
  definitionVersion: Schema.String.pipe(
    Schema.withDecodingDefaultKey(Effect.succeed(DEFAULT_DEFINITION_VERSION)),
  ),
  toolCall: ToolCallSchema,
  depth: Schema.optional(Schema.Finite),
})

class AgentExecutionError extends Data.TaggedError('AgentExecutionError')<{
  readonly operation: string
  readonly cause: unknown
  readonly message: string
}> {
  constructor(operation: string, cause: unknown) {
    super({
      operation,
      cause,
      message: cause instanceof Error ? cause.message : String(cause),
    })

    this.name = 'AgentExecutionError'
  }
}

function findTool(tools: ToolLike[], name: string): ToolLike | undefined {
  return tools.find((tool) => tool.name === name)
}

export const callLlmEffect = agentModule.effect({
  type: 'agent.callLLM',
  input: CallLlmInput,
  execute: (input, ctx) =>
    runCallLlm({
      turn: input.turn,
      definitionName: input.definitionName,
      definitionVersion: input.definitionVersion,
      messages: [...(input.messages ?? [])],
      input: input.input ?? null,
      depth: input.depth ?? 0,
      structuredOutput: input.structuredOutput ?? null,
      alreadyCompacted: input.alreadyCompacted ?? false,
      consumedSteerMessageIds: [...(input.consumedSteerMessageIds ?? [])],
      runId: ctx.runId,
      threadId: ctx.threadId,
      signal: ctx.signal,
      emit: (event) => ctx.emit(event),
    }),
})

function runCallLlm(args: {
  turn: number
  definitionName?: string
  definitionVersion: string
  messages: Message[]
  input: JsonValue
  depth: number
  structuredOutput: JsonValue | null
  alreadyCompacted: boolean
  consumedSteerMessageIds: string[]
  runId: string
  threadId: string
  signal: AbortSignal
  emit: (event: EventInputOf<AgentEvent>) => Promise<void>
}): Effect.Effect<
  ReadonlyArray<EventInputOf<AgentEvent>>,
  AgentExecutionError | LlmError,
  LlmTag | AgentDefinitionsTag
> {
  return Effect.gen(function* () {
    const {
      turn,
      threadId,
      emit,
      definitionName,
      definitionVersion,
      messages,
      input,
      structuredOutput,
      consumedSteerMessageIds,
      signal,
    } = args

    const agents = yield* AgentDefinitionsTag
    const llm = yield* LlmTag
    const definition = definitionName ? agents.get(definitionName, definitionVersion) : undefined

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

    const staticTools = normalizeTools(definition.tools)
    let dynamicTools: ToolLike[] = []

    if (definition.resolveTools) {
      const dynamicEntries = yield* Effect.tryPromise({
        try: () =>
          Promise.resolve(
            definition.resolveTools!({
              threadId,
              turn,
              messages,
              input,
              tools: staticTools,
              instructions: definition.instructions,
              signal,
            }),
          ),
        catch: (cause) => new AgentExecutionError('resolve dynamic tools', cause),
      })

      dynamicTools = normalizeTools(dynamicEntries)
    }

    const tools = [...staticTools, ...dynamicTools]

    if (definition.output) {
      tools.push(
        defineTool({
          name: STRUCTURED_OUTPUT_TOOL_NAME,
          description:
            'Submit the final structured output for this task. Call this tool when you have completed all work and matched the required schema.',
          input: definition.output,
          handler: (out) => ({ accepted: true, output: out }),
        }),
      )
    }

    const instructions = definition.output
      ? `${definition.instructions}\n\n${buildStructuredOutputInstructions(STRUCTURED_OUTPUT_TOOL_NAME)}`
      : definition.instructions

    const turnCtx = {
      threadId,
      turn,
      messages,
      input,
      tools,
      instructions,
      signal,
    }

    if (definition.assertCredits) {
      const creditCheck = yield* Effect.tryPromise({
        try: () => Promise.resolve(definition.assertCredits!(turnCtx)),
        catch: (cause) => new AgentExecutionError('credit gate check', cause),
      }).pipe(
        Effect.match({
          onFailure: (error) => ({ ok: false as const, error: error.message }),
          onSuccess: () => ({ ok: true as const }),
        }),
      )

      if (!creditCheck.ok) {
        return [
          {
            type: 'runtime.thread.failed',
            payload: { threadId, error: creditCheck.error },
            threadId,
          },
        ]
      }
    }

    const events: EventInputOf<AgentEvent>[] = [
      {
        type: 'agent.turn.started',
        payload: { turn },
        threadId,
      },
    ]

    const executeTurn = (
      turnMessages: readonly Message[],
    ): Effect.Effect<AgentTurnResult, AgentExecutionError | LlmError> => {
      if (definition.runTurn) {
        return Effect.tryPromise({
          try: () =>
            Promise.resolve(
              definition.runTurn!({
                ...turnCtx,
                messages: [...turnMessages],
                instructions,
              }),
            ),
          catch: (cause) => new AgentExecutionError('run agent turn', cause),
        })
      }

      return llm.complete({
        model: definition.model,
        instructions,
        messages: [{ role: 'system', content: instructions }, ...turnMessages],
        tools,
        toolSpecs: toolSpecs(tools),
        signal,
        onTextDelta: (delta) =>
          emit({
            type: 'agent.turn.text_delta',
            payload: { turn, delta },
            threadId,
            ephemeral: true,
          }),
      })
    }

    let currentMessages = turnCtx.messages

    const result = yield* executeTurn(currentMessages).pipe(
      Effect.matchEffect({
        onFailure: (err) => {
          if (isContextOverflowError(err) && !args.alreadyCompacted) {
            return Effect.gen(function* () {
              const compactor = definition.compact ?? defaultAgentCompactor
              const originalCount = currentMessages.length

              const compacted = yield* Effect.tryPromise({
                try: () =>
                  Promise.resolve(
                    compactor({
                      threadId,
                      turn,
                      messages: currentMessages,
                      reason: 'overflow',
                    }),
                  ),
                catch: (cause) => new AgentExecutionError('context compaction', cause),
              })

              events.push({
                type: 'agent.context.compacted',
                payload: {
                  turn,
                  originalCount,
                  compactedCount: compacted.messages.length,
                  summary: compacted.summary,
                  reason: 'overflow',
                  messages: [...compacted.messages],
                },
                threadId,
              })

              currentMessages = [...compacted.messages]
              return yield* executeTurn(currentMessages)
            })
          }

          return Effect.fail(err)
        },
        onSuccess: (res) => Effect.succeed(res),
      }),
    )

    const toolCalls = result.toolCalls ?? result.message.toolCalls ?? []

    const shouldStop = definition.stopWhen?.({
      turn,
      maxTurns: definition.maxTurns ?? 20,
      messages: currentMessages,
      toolCalls,
      result,
    })

    events.push({
      type: 'agent.message',
      payload: {
        turn,
        message: result.message,
        usage: result.usage,
      },
      threadId,
    })

    if (result.usage) {
      events.push({
        type: 'agent.turn.usage',
        payload: {
          turn,
          input: result.usage.input,
          output: result.usage.output,
        },
        threadId,
      })

      if (definition.trackUsage) {
        yield* Effect.tryPromise({
          try: () =>
            Promise.resolve(
              definition.trackUsage!(
                { input: result.usage!.input, output: result.usage!.output, turn },
                turnCtx,
              ),
            ),
          catch: (cause) => new AgentExecutionError('track usage', cause),
        }).pipe(
          Effect.match({
            onFailure: () => undefined,
            onSuccess: () => undefined,
          }),
        )
      }
    }

    if (shouldStop) {
      if (!definition.conversational) {
        const output = structuredOutput ?? result.output ?? { text: result.message.content }

        events.push({
          type: 'runtime.thread.completed',
          payload: {
            threadId,
            output:
              consumedSteerMessageIds.length === 0 ? output : { output, consumedSteerMessageIds },
          },
          threadId,
        })
      }

      return events
    }

    for (const toolCall of toolCalls) {
      events.push({
        type: 'agent.tool_call.requested',
        payload: { turn, toolCall },
        threadId,
      })
    }

    if (toolCalls.length === 0 && !definition.conversational) {
      const output = structuredOutput ?? result.output ?? { text: result.message.content }

      events.push({
        type: 'runtime.thread.completed',
        payload: {
          threadId,
          output:
            consumedSteerMessageIds.length === 0 ? output : { output, consumedSteerMessageIds },
        },
        threadId,
      })
    }

    return events
  })
}

export const executeToolEffect = agentModule.effect({
  type: 'agent.executeTool',
  input: ExecuteToolInput,
  execute: (input, ctx) =>
    Effect.gen(function* () {
      const threadId = ctx.threadId
      const agents = yield* AgentDefinitionsTag

      const definition = input.definitionName
        ? agents.get(input.definitionName, input.definitionVersion)
        : undefined

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

      const staticTools = normalizeTools(definition.tools)
      let dynamicTools: ToolLike[] = []

      if (definition.resolveTools) {
        const dynamicEntries = yield* Effect.tryPromise({
          try: () =>
            Promise.resolve(
              definition.resolveTools!({
                threadId,
                turn: input.turn,
                messages: [],
                input: null,
                tools: staticTools,
                instructions: definition.instructions,
              }),
            ),
          catch: () => [],
        }).pipe(
          Effect.match({
            onFailure: () => [],
            onSuccess: (entries) => entries,
          }),
        )

        dynamicTools = normalizeTools(dynamicEntries)
      }

      const allTools = [...staticTools, ...dynamicTools]

      if (definition.output) {
        allTools.push(
          defineTool({
            name: STRUCTURED_OUTPUT_TOOL_NAME,
            description: 'Submit the final structured output for this task.',
            input: definition.output,
            handler: (out) => ({ accepted: true, output: out }),
          }),
        )
      }

      const tool = findTool(allTools, input.toolCall.name)

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
          const validated = yield* validateInputEffect(tool.input, input.toolCall.arguments).pipe(
            Effect.match({
              onFailure: (error) => ({ ok: false as const, error: error.message }),
              onSuccess: (value) => ({ ok: true as const, value }),
            }),
          )

          if (!validated.ok) {
            const isSubmit = tool.name === STRUCTURED_OUTPUT_TOOL_NAME

            return [
              {
                type: 'agent.tool.result',
                payload: {
                  turn: input.turn,
                  toolCallId: input.toolCall.id,
                  name: input.toolCall.name,
                  result: null,
                  error: isSubmit
                    ? `Output validation failed: ${validated.error}. Fix the fields and call ${STRUCTURED_OUTPUT_TOOL_NAME} again.`
                    : validated.error,
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
            catch: (cause) => new AgentExecutionError(`run tool ${tool.name}`, cause),
          }).pipe(
            Effect.match({
              onFailure: (error) => ({ ok: false as const, error: error.message }),
              onSuccess: (value) => ({ ok: true as const, value }),
            }),
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
          const depth = input.depth ?? 0

          if (depth >= TEAM_MEMBER_MAX_DEPTH) {
            return [
              {
                type: 'agent.tool.result',
                payload: {
                  turn: input.turn,
                  toolCallId: input.toolCall.id,
                  name: input.toolCall.name,
                  result: null,
                  error: `Subagent depth limit reached (max depth: ${TEAM_MEMBER_MAX_DEPTH})`,
                },
                threadId,
              },
            ]
          }

          const validated = tool.input
            ? yield* validateInputEffect(tool.input, input.toolCall.arguments).pipe(
                Effect.match({
                  onFailure: (error) => ({ ok: false as const, error: error.message }),
                  onSuccess: (value) => ({ ok: true as const, value }),
                }),
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
                definitionVersion: tool.childVersion,
                input: childInput,
                toolCallId: input.toolCall.id,
                depth: depth + 1,
              },
              threadId,
            },
          ]
        }

        case 'effects': {
          const validated = tool.input
            ? yield* validateInputEffect(tool.input, input.toolCall.arguments).pipe(
                Effect.match({
                  onFailure: (error) => ({ ok: false as const, error: error.message }),
                  onSuccess: (value) => ({ ok: true as const, value }),
                }),
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
              payload: {
                toolCallId: input.toolCall.id,
                effects,
                waitOn: tool.waitOn
                  ? {
                      type: tool.waitOn.type,
                      match: tool.waitOn.match,
                    }
                  : undefined,
              },
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
  if (!Predicate.isObject(value)) {
    return null
  }

  if (!Predicate.isString(value.id) || !Predicate.isString(value.name)) {
    return null
  }

  return { id: value.id, name: value.name, arguments: value.arguments ?? null }
}
