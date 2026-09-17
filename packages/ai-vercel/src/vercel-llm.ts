import {
  generateText,
  jsonSchema,
  streamText,
  tool,
  type JSONSchema7,
  type LanguageModel,
} from 'ai'
import { Data, Effect, Option, Predicate, Stream } from 'effect'

import type { AgentTurnResult, LlmAdapter, LlmToolSpec } from '@looms/agent'
import { asJson, type JsonValue } from '@looms/core'

import { toLoomsToolCalls, toModelMessages } from './messages'

class VercelLlmError extends Data.TaggedError('VercelLlmError')<{
  readonly cause: unknown
  readonly message: string
}> {
  constructor(cause: unknown) {
    super({
      cause,
      message: cause instanceof Error ? cause.message : String(cause),
    })

    this.name = 'VercelLlmError'
  }
}

function isJsonSchema(value: unknown): value is JSONSchema7 {
  return Predicate.isReadonlyObject(value) && !Array.isArray(value)
}

function toAiTools(specs: ReadonlyArray<LlmToolSpec>) {
  return Object.fromEntries(
    specs.map((spec) => {
      if (!isJsonSchema(spec.inputJsonSchema)) {
        throw new VercelLlmError(`Invalid JSON Schema for tool "${spec.name}"`)
      }

      return [
        spec.name,
        tool({
          description: spec.description,
          inputSchema: jsonSchema(spec.inputJsonSchema),
        }),
      ]
    }),
  )
}

export interface VercelLlmOptions {
  readonly model: LanguageModel
  /** Prefer streamText when the turn supplies `onTextDelta`. Default true. */
  readonly stream?: boolean
}

function toolCallInput(call: { input?: unknown }): JsonValue {
  const input = 'input' in call ? call.input : {}
  return asJson(input ?? {})
}

export function vercelLlm(options: VercelLlmOptions): LlmAdapter {
  const streamEnabled = options.stream !== false

  return {
    complete: (args): Promise<AgentTurnResult> =>
      Effect.runPromise(
        Effect.gen(function* () {
          const messages = toModelMessages(args.messages)

          const tools =
            args.toolSpecs && args.toolSpecs.length > 0 ? toAiTools(args.toolSpecs) : undefined

          if (streamEnabled && args.onTextDelta) {
            const result = tools
              ? streamText({
                  model: options.model,
                  instructions: args.instructions,
                  messages,
                  abortSignal: args.signal,
                  tools,
                })
              : streamText({
                  model: options.model,
                  instructions: args.instructions,
                  messages,
                  abortSignal: args.signal,
                })

            yield* Stream.fromAsyncIterable(
              result.fullStream,
              (cause) => new VercelLlmError(cause),
            ).pipe(
              Stream.runForEach((part) => {
                const delta = part.type === 'text-delta' && 'text' in part ? part.text : ''
                return delta
                  ? Effect.tryPromise({
                      try: () => Promise.resolve(args.onTextDelta?.(delta)),
                      catch: (cause) => new VercelLlmError(cause),
                    })
                  : Effect.void
              }),
            )

            const streamed = yield* Effect.tryPromise({
              try: () => Promise.all([result.text, result.toolCalls]),
              catch: (cause) => new VercelLlmError(cause),
            }).pipe(
              Effect.asSome,
              Effect.catchIf(
                (error) => error.message.includes('No output generated'),
                () => Effect.succeedNone,
              ),
            )

            if (Option.isSome(streamed)) {
              const [text, rawToolCalls] = streamed.value

              const toolCalls = toLoomsToolCalls(
                rawToolCalls.map((call) => ({
                  toolCallId: call.toolCallId,
                  toolName: call.toolName,
                  input: toolCallInput(call),
                })),
              )

              return {
                message: { role: 'assistant', content: text, toolCalls },
                toolCalls,
                usage: { input: 0, output: text.length },
              }
            }
          }

          const result = tools
            ? yield* Effect.tryPromise({
                try: () =>
                  generateText({
                    model: options.model,
                    instructions: args.instructions,
                    messages,
                    abortSignal: args.signal,
                    tools,
                  }),
                catch: (cause) => new VercelLlmError(cause),
              })
            : yield* Effect.tryPromise({
                try: () =>
                  generateText({
                    model: options.model,
                    instructions: args.instructions,
                    messages,
                    abortSignal: args.signal,
                  }),
                catch: (cause) => new VercelLlmError(cause),
              })

          const toolCalls = toLoomsToolCalls(
            result.toolCalls.map((call) => ({
              toolCallId: call.toolCallId,
              toolName: call.toolName,
              input: toolCallInput(call),
            })),
          )

          return {
            message: { role: 'assistant', content: result.text, toolCalls },
            toolCalls,
            usage: {
              input: result.usage?.inputTokens ?? 0,
              output: result.usage?.outputTokens ?? result.text.length,
            },
          }
        }),
      ),
  }
}
