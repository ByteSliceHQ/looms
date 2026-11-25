import { Context, Data, Effect, Layer, Predicate } from 'effect'

import { stringifyJson, type JsonValue } from '@looms/core'

import type { AgentRunContext, AgentTurnContext, AgentTurnResult, ToolLike } from './definitions'
import type { Message, ToolCall } from './types'

export interface LlmToolSpec {
  readonly name: string
  readonly description: string
  readonly inputJsonSchema: JsonValue
}

/** The agent a model call is made for. */
export interface LlmAgentRef {
  readonly name: string
  readonly version: string
}

export interface LlmCompleteArgs {
  /** The model id the agent asked for. Absent when the agent leaves it to the adapter. */
  model?: string
  /** The agent this call is made for. */
  agent: LlmAgentRef
  /** The agent's turn, from 1. */
  turn: number
  /** The agent run's input. */
  input: JsonValue
  instructions: string
  messages: Message[]
  tools: ToolLike[]
  toolSpecs?: LlmToolSpec[]
  /** The run this call is made for, so an adapter can scope what it reads to the run's tenant. */
  run: AgentRunContext
  onTextDelta?: (delta: string) => void | Promise<void>
  signal?: AbortSignal
}

export interface LlmService {
  readonly complete: (args: LlmCompleteArgs) => Effect.Effect<AgentTurnResult, LlmError>
}

export interface LlmAdapter {
  readonly complete: (args: LlmCompleteArgs) => Promise<AgentTurnResult>
}

export class LlmError extends Data.TaggedError('LlmError')<{
  readonly cause: unknown
  readonly message: string
}> {
  constructor(cause: unknown) {
    super({
      cause,
      message: cause instanceof Error ? cause.message : String(cause),
    })

    this.name = 'LlmError'
  }
}

export function llmFromAdapter(adapter: LlmAdapter): LlmService {
  return {
    complete: (args) =>
      Effect.tryPromise({
        try: () => adapter.complete(args),
        catch: (cause) => new LlmError(cause),
      }),
  }
}

export class LlmTag extends Context.Service<LlmTag, LlmService>()('looms/Llm') {}

/**
 * What a scripted model sees on each call: the agent's turn, plus what a real `llm.complete`
 * receives about the call, so a script can tell which agent, run and model it is serving.
 */
export interface StubLlmContext extends AgentTurnContext {
  /** The run the call is made for, as `LlmCompleteArgs.run`. */
  readonly run: AgentRunContext
  /** The agent the call is made for, as `LlmCompleteArgs.agent`. */
  readonly agent: LlmAgentRef
  /** The model id the agent asked for, as `LlmCompleteArgs.model`. */
  readonly model?: string
}

export interface StubLlmPolicy {
  toolCallsFor?: (ctx: StubLlmContext) => ToolCall[] | undefined
  doneAfterText?: boolean
}

export const makeStubLlm = (policy: StubLlmPolicy = {}): LlmService => ({
  complete: (args) =>
    Effect.sync(() => {
      const ctx: StubLlmContext = {
        threadId: args.run.threadId,
        turn: args.turn,
        messages: args.messages,
        input: args.input,
        tools: args.tools,
        instructions: args.instructions,
        signal: args.signal,
        run: args.run,
        agent: args.agent,
        model: args.model,
      }

      const toolCalls = policy.toolCallsFor?.(ctx)

      if (toolCalls && toolCalls.length > 0) {
        return {
          message: { role: 'assistant', content: '', toolCalls },
          toolCalls,
        }
      }

      const lastUser = args.messages.findLast((item) => item.role === 'user')
      const lastContent = args.messages.at(-1)?.content

      const content =
        lastUser?.content ??
        (Predicate.isString(lastContent) ? lastContent : stringifyJson(lastContent ?? null))

      return {
        message: { role: 'assistant', content },
        done: policy.doneAfterText !== false,
        output: { text: content },
        usage: { input: 0, output: content.length },
      }
    }),
})

export const StubLlmLive = (policy?: StubLlmPolicy) => Layer.succeed(LlmTag, makeStubLlm(policy))
