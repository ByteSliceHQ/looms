import {
  event,
  normalizeTools,
  toolSpecs,
  validateInput,
  type AgentDefinition,
  type AgentState,
  type AgentTurnResult,
  type JsonValue,
  type ToolCall,
  type ToolLike,
  type TypedLoomsEvent,
  type WorkflowDefinition,
} from '@looms/core'
import { Effect } from 'effect'
import { LlmTag } from './llm'

export type AgentEvent = TypedLoomsEvent

export interface ExecuteTurnResult {
  events: AgentEvent[]
  /** Child actors that should be started by the runtime. */
  spawns: Array<{
    childActorId: string
    kind: 'agent' | 'workflow'
    definitionName: string
    definition?: AgentDefinition | WorkflowDefinition
    input: JsonValue
    toolCallId: string | null
  }>
}

export interface ExecuteTurnOptions {
  readonly emit?: (evt: AgentEvent) => void | Promise<void>
}

function createChildId(parentId: string, name: string): string {
  return `${parentId}__${name}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

function findTool(tools: ToolLike[], name: string): ToolLike | undefined {
  return tools.find((t) => t.name === name)
}

function failTurn(actorId: string, error: string): ExecuteTurnResult {
  return {
    events: [event('actor.failed', actorId, { error })],
    spawns: [],
  }
}

function completionOutput(result: AgentTurnResult, toolCalls: ToolCall[]): JsonValue {
  if (result.output !== undefined) return result.output
  if (toolCalls.length === 1) return toolCalls[0]!.arguments
  if (toolCalls.length > 1) {
    return {
      toolCalls: toolCalls.map((toolCall) => ({
        name: toolCall.name,
        arguments: toolCall.arguments,
      })),
    }
  }
  return { text: result.message.content }
}

function callEmit(
  emit: ExecuteTurnOptions['emit'],
  evt: AgentEvent,
): Effect.Effect<void, Error> {
  if (!emit) return Effect.void
  return Effect.tryPromise({
    try: () => Promise.resolve(emit(evt)),
    catch: (cause) => (cause instanceof Error ? cause : new Error(String(cause))),
  })
}

/**
 * Produce events for a single agent turn (agent.turn owed work).
 */
export const executeAgentTurn = (
  definition: AgentDefinition,
  state: AgentState,
  options: ExecuteTurnOptions = {},
): Effect.Effect<ExecuteTurnResult, Error, LlmTag> =>
  Effect.gen(function* () {
    const turn = state.turn + 1
    if (turn > state.maxTurns) {
      return failTurn(state.actorId, `Max turns exceeded (${state.maxTurns})`)
    }

    const tools = normalizeTools(definition.tools)
    const specs = toolSpecs(tools)
    const turnCtx = {
      actorId: state.actorId,
      turn,
      messages: state.messages,
      input: state.input,
      tools,
      instructions: definition.instructions,
    }

    const started = event('agent.turn.started', state.actorId, { turn })
    yield* callEmit(options.emit, started)

    const resultOrError = yield* Effect.gen(function* () {
      if (definition.runTurn) {
        return yield* Effect.tryPromise({
          try: () => Promise.resolve(definition.runTurn!(turnCtx)),
          catch: (cause) => (cause instanceof Error ? cause : new Error(String(cause))),
        })
      }
      const llm = yield* LlmTag
      return yield* llm.complete({
        model: definition.model,
        instructions: definition.instructions,
        messages: [{ role: 'system', content: definition.instructions }, ...state.messages],
        tools,
        toolSpecs: specs,
        signal: undefined,
        onTextDelta: options.emit
          ? (delta) =>
              options.emit!(
                event(
                  'agent.turn.text_delta',
                  state.actorId,
                  { turn, delta },
                  { ephemeral: true },
                ),
              )
          : undefined,
      })
    }).pipe(
      Effect.map((value) => ({ ok: true as const, value })),
      Effect.catch((err) =>
        Effect.succeed({
          ok: false as const,
          error: err instanceof Error ? err.message : String(err),
        }),
      ),
    )

    if (!resultOrError.ok) {
      return {
        events: options.emit
          ? failTurn(state.actorId, resultOrError.error).events
          : [started, ...failTurn(state.actorId, resultOrError.error).events],
        spawns: [],
      }
    }

    const result = resultOrError.value
    const toolCalls = result.toolCalls ?? result.message.toolCalls ?? []
    const shouldStop = definition.stopWhen?.({
      turn,
      maxTurns: state.maxTurns,
      messages: state.messages,
      toolCalls,
      result,
    })

    const events: AgentEvent[] = options.emit ? [] : [started]
    events.push(
      event('agent.message', state.actorId, {
        turn,
        message: result.message,
      }),
    )

    if (shouldStop) {
      if (!definition.conversational) {
        events.push(
          event('actor.completed', state.actorId, {
            output: completionOutput(result, toolCalls),
          }),
        )
      }
      return { events, spawns: [] }
    }

    for (const toolCall of toolCalls) {
      events.push(
        event('agent.tool_call.requested', state.actorId, {
          turn,
          toolCall,
        }),
      )
    }

    if (toolCalls.length === 0 && !definition.conversational) {
      events.push(
        event('actor.completed', state.actorId, {
          output: result.output ?? { text: result.message.content },
        }),
      )
    }

    return { events, spawns: [] }
  })

/**
 * Execute a pending tool call. Function tools run inline; agent/workflow tools emit child.spawned.
 */
export const executeToolCall = (
  definition: AgentDefinition,
  state: AgentState,
  turn: number,
  toolCall: ToolCall,
): Effect.Effect<ExecuteTurnResult, Error> =>
  Effect.gen(function* () {
    const tools = normalizeTools(definition.tools)
    const tool = findTool(tools, toolCall.name)
    if (!tool) {
      return {
        events: [
          event('tool.result', state.actorId, {
            turn,
            toolCallId: toolCall.id,
            name: toolCall.name,
            result: null,
            error: `Unknown tool: ${toolCall.name}`,
          }),
        ],
        spawns: [],
      }
    }

    switch (tool.kind) {
      case 'function': {
        const validatedArgs = yield* Effect.tryPromise({
          try: () => validateInput(tool.input, toolCall.arguments),
          catch: (cause) => (cause instanceof Error ? cause : new Error(String(cause))),
        }).pipe(
          Effect.map((value) => ({ ok: true as const, value })),
          Effect.catch((err) => Effect.succeed({ ok: false as const, error: err.message })),
        )

        if (!validatedArgs.ok) {
          return {
            events: [
              event('tool.result', state.actorId, {
                turn,
                toolCallId: toolCall.id,
                name: toolCall.name,
                result: null,
                error: validatedArgs.error,
              }),
            ],
            spawns: [],
          }
        }

        const result = yield* Effect.tryPromise({
          try: () =>
            Promise.resolve(
              tool.handler(validatedArgs.value, {
                actorId: state.actorId,
                turn,
              }),
            ),
          catch: (cause) => (cause instanceof Error ? cause : new Error(String(cause))),
        }).pipe(
          Effect.map((value) => ({ ok: true as const, value })),
          Effect.catch((err) => Effect.succeed({ ok: false as const, error: err.message })),
        )

        if (!result.ok) {
          return {
            events: [
              event('tool.result', state.actorId, {
                turn,
                toolCallId: toolCall.id,
                name: toolCall.name,
                result: null,
                error: result.error,
              }),
            ],
            spawns: [],
          }
        }

        return {
          events: [
            event('tool.result', state.actorId, {
              turn,
              toolCallId: toolCall.id,
              name: toolCall.name,
              result: result.value,
              error: null,
            }),
          ],
          spawns: [],
        }
      }
      case 'agent-tool': {
        const input = tool.mapInput ? tool.mapInput(toolCall.arguments) : toolCall.arguments
        const childActorId = createChildId(state.actorId, tool.agent.name)
        return {
          events: [
            event('child.spawned', state.actorId, {
              childActorId,
              childKind: 'agent',
              childDefinitionName: tool.agent.name,
              toolCallId: toolCall.id,
              nodeId: null,
              input,
            }),
          ],
          spawns: [
            {
              childActorId,
              kind: 'agent' as const,
              definitionName: tool.agent.name,
              definition: tool.agent,
              input,
              toolCallId: toolCall.id,
            },
          ],
        }
      }
      case 'workflow-tool': {
        const input = tool.mapInput ? tool.mapInput(toolCall.arguments) : toolCall.arguments
        const childActorId = createChildId(state.actorId, tool.workflow.name)
        return {
          events: [
            event('child.spawned', state.actorId, {
              childActorId,
              childKind: 'workflow',
              childDefinitionName: tool.workflow.name,
              toolCallId: toolCall.id,
              nodeId: null,
              input,
            }),
          ],
          spawns: [
            {
              childActorId,
              kind: 'workflow' as const,
              definitionName: tool.workflow.name,
              definition: tool.workflow,
              input,
              toolCallId: toolCall.id,
            },
          ],
        }
      }
      default: {
        const _exhaustive: never = tool
        return _exhaustive
      }
    }
  })
