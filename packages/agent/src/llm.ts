import type {
  AgentTurnContext,
  AgentTurnResult,
  LlmToolSpec,
  Message,
  ToolCall,
  ToolLike,
} from '@looms/core'
import type { JsonValue } from '@looms/core'
import { Context, Effect, Layer, Predicate } from 'effect'

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
  readonly complete: (args: LlmCompleteArgs) => Effect.Effect<AgentTurnResult, Error>
}

export interface LlmAdapter {
  readonly complete: (args: LlmCompleteArgs) => Promise<AgentTurnResult>
}

export function llmFromAdapter(adapter: LlmAdapter): LlmService {
  return {
    complete: (args) =>
      Effect.tryPromise({
        try: () => adapter.complete(args),
        catch: (cause) => (cause instanceof Error ? cause : new Error(String(cause))),
      }),
  }
}

export class LlmTag extends Context.Service<LlmTag, LlmService>()('looms/Llm') {}

export interface StubLlmPolicy {
  /**
   * Optional tool-call policy. When the last user/tool message matches,
   * emit the given tool calls instead of an echo reply.
   */
  toolCallsFor?: (ctx: AgentTurnContext) => ToolCall[] | undefined
  /** When true, mark the turn done after a text reply (default true if no tools). */
  doneAfterText?: boolean
}

/**
 * Deterministic LLM stub for tests: echoes the last user message,
 * or emits tool calls from a simple policy.
 */
export const makeStubLlm = (policy: StubLlmPolicy = {}): LlmService => ({
  complete: (args) =>
    Effect.sync(() => {
      const ctx: AgentTurnContext = {
        actorId: 'stub',
        turn: 0,
        messages: args.messages,
        input: null,
        tools: args.tools,
        instructions: args.instructions,
      }
      const toolCalls = policy.toolCallsFor?.(ctx)
      if (toolCalls && toolCalls.length > 0) {
        return {
          message: {
            role: 'assistant',
            content: '',
            toolCalls,
          },
          toolCalls,
        }
      }
      const lastUser = [...args.messages].reverse().find((m) => m.role === 'user')
      const lastContent = args.messages.at(-1)?.content
      const content =
        lastUser?.content ??
        (Predicate.isString(lastContent) ? lastContent : JSON.stringify(lastContent ?? null))
      const done = policy.doneAfterText !== false
      return {
        message: { role: 'assistant', content },
        done,
        output: { text: content } satisfies JsonValue,
      }
    }),
})

export const StubLlmLive = (policy?: StubLlmPolicy) => Layer.succeed(LlmTag, makeStubLlm(policy))
