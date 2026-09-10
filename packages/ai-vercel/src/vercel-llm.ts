import { generateText, jsonSchema, streamText, tool, type LanguageModel } from 'ai'

import type { AgentTurnResult, LlmAdapter, LlmToolSpec } from '@looms/agent'
import type { JsonValue } from '@looms/core'

import { toLoomsToolCalls, toModelMessages } from './messages'

function toAiTools(specs: ReadonlyArray<LlmToolSpec>) {
  return Object.fromEntries(
    specs.map((spec) => [
      spec.name,
      tool({
        description: spec.description,
        // SAFETY: LlmToolSpec.inputJsonSchema is JSON Schema produced by toolJsonSchema.
        inputSchema: jsonSchema(spec.inputJsonSchema as Parameters<typeof jsonSchema>[0]),
      }),
    ]),
  )
}

export interface VercelLlmOptions {
  readonly model: LanguageModel
  /** Prefer streamText when the turn supplies `onTextDelta`. Default true. */
  readonly stream?: boolean
}

function toolCallInput(call: { input?: unknown }): JsonValue {
  const input = 'input' in call ? call.input : {}
  // SAFETY: AI SDK tool-call input is JSON produced by the model against our schema.
  return (input ?? {}) as JsonValue
}

export function vercelLlm(options: VercelLlmOptions): LlmAdapter {
  const streamEnabled = options.stream !== false

  return {
    async complete(args): Promise<AgentTurnResult> {
      const messages = toModelMessages(args.messages)
      const tools =
        args.toolSpecs && args.toolSpecs.length > 0 ? toAiTools(args.toolSpecs) : undefined
      const shouldStream = streamEnabled && args.onTextDelta !== undefined

      if (shouldStream) {
        const result = tools
          ? streamText({
              model: options.model,
              instructions: args.instructions,
              messages,
              abortSignal: args.signal,
              // SAFETY: VercelAiTool values are `tool()` instances from the AI SDK.
              tools: tools as Parameters<typeof streamText>[0]['tools'],
            })
          : streamText({
              model: options.model,
              instructions: args.instructions,
              messages,
              abortSignal: args.signal,
            })

        for await (const part of result.fullStream) {
          if (part.type === 'text-delta') {
            const delta = 'text' in part ? part.text : ''
            if (delta) await args.onTextDelta?.(delta)
          }
        }

        try {
          const [text, rawToolCalls] = await Promise.all([result.text, result.toolCalls])
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
        } catch (err) {
          if (!(err instanceof Error) || !err.message.includes('No output generated')) {
            throw err
          }
        }
      }

      const result = tools
        ? await generateText({
            model: options.model,
            instructions: args.instructions,
            messages,
            abortSignal: args.signal,
            // SAFETY: VercelAiTool values are `tool()` instances from the AI SDK.
            tools: tools as Parameters<typeof generateText>[0]['tools'],
          })
        : await generateText({
            model: options.model,
            instructions: args.instructions,
            messages,
            abortSignal: args.signal,
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
    },
  }
}
