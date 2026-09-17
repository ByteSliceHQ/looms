import { Context, Data, Effect, Layer, Predicate } from 'effect'

import { stringifyJson, type JsonValue } from '@looms/core'

import type { AgentTurnContext, AgentTurnResult, ToolLike } from './definitions'
import type { Message, ToolCall } from './types'

export interface LlmToolSpec {
  readonly name: string
  readonly description: string
  readonly inputJsonSchema: JsonValue
}

export interface LlmCompleteArgs {
  model?: string
  instructions: string
  messages: Message[]
  tools: ToolLike[]
  toolSpecs?: LlmToolSpec[]
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

export interface StubLlmPolicy {
  toolCallsFor?: (ctx: AgentTurnContext) => ToolCall[] | undefined
  doneAfterText?: boolean
}

export const makeStubLlm = (policy: StubLlmPolicy = {}): LlmService => ({
  complete: (args) =>
    Effect.sync(() => {
      const ctx: AgentTurnContext = {
        threadId: 'stub',
        turn: 0,
        messages: args.messages,
        input: null,
        tools: args.tools,
        instructions: args.instructions,
      }

      const toolCalls = policy.toolCallsFor?.(ctx)

      if (toolCalls && toolCalls.length > 0) {
        return {
          message: { role: 'assistant', content: '', toolCalls },
          toolCalls,
        }
      }

      let lastUser: Message | undefined

      for (let i = args.messages.length - 1; i >= 0; i--) {
        const item = args.messages[i]

        if (item?.role === 'user') {
          lastUser = item
          break
        }
      }

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
