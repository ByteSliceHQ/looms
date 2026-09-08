import { describe, expect, test } from 'bun:test'
import { generateText, simulateReadableStream } from 'ai'
import { MockLanguageModelV3 } from 'ai/test'
import { toModelMessages } from './messages'
import { vercelLlm } from './vercel-llm'

describe('toModelMessages', () => {
  test('maps system, user, assistant tool calls, and tool results', () => {
    const messages = toModelMessages([
      { role: 'user', content: 'hi' },
      {
        role: 'assistant',
        content: '',
        toolCalls: [{ id: 'tc1', name: 'greet', arguments: { name: 'Ada' } }],
      },
      { role: 'tool', content: '{"greeting":"Hello, Ada!"}', toolCallId: 'tc1', name: 'greet' },
    ])
    expect(messages[0]).toEqual({ role: 'user', content: 'hi' })
    expect(messages[1]).toEqual({
      role: 'assistant',
      content: [
        { type: 'tool-call', toolCallId: 'tc1', toolName: 'greet', input: { name: 'Ada' } },
      ],
    })
    expect(messages[2]).toEqual({
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId: 'tc1',
          toolName: 'greet',
          output: { type: 'json', value: { greeting: 'Hello, Ada!' } },
        },
      ],
    })
  })
})

describe('vercelLlm', () => {
  test('maps generateText text and tool calls', async () => {
    const model = new MockLanguageModelV3({
      doGenerate: async () => ({
        finishReason: 'tool-calls',
        usage: { inputTokens: 1, outputTokens: 1 },
        content: [
          { type: 'text', text: '' },
          { type: 'tool-call', toolCallId: 'tc1', toolName: 'greet', input: { name: 'Ada' } },
        ],
        warnings: [],
      }),
    })
    const adapter = vercelLlm({ model, stream: false })
    const result = await adapter.complete({
      instructions: 'help',
      messages: [{ role: 'user', content: 'greet Ada' }],
      tools: [],
      toolSpecs: [
        {
          name: 'greet',
          description: 'Return a greeting',
          inputJsonSchema: {
            type: 'object',
            properties: { name: { type: 'string' } },
          },
        },
      ],
    })
    expect(result.toolCalls).toEqual([{ id: 'tc1', name: 'greet', arguments: { name: 'Ada' } }])
    expect(result.message.role).toBe('assistant')
  })

  test('forwards stream text deltas', async () => {
    const model = new MockLanguageModelV3({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: [
            { type: 'stream-start', warnings: [] },
            { type: 'text-start', id: 't' },
            { type: 'text-delta', id: 't', delta: 'hel' },
            { type: 'text-delta', id: 't', delta: 'lo' },
            { type: 'text-end', id: 't' },
            {
              type: 'finish',
              finishReason: 'stop',
              usage: { inputTokens: 1, outputTokens: 2 },
              totalUsage: { inputTokens: 1, outputTokens: 2 },
            },
          ],
        }),
      }),
    })
    const adapter = vercelLlm({ model, stream: true })
    const deltas: string[] = []
    const result = await adapter.complete({
      instructions: 'help',
      messages: [{ role: 'user', content: 'hi' }],
      tools: [],
      onTextDelta: (delta) => {
        deltas.push(delta)
      },
    })
    expect(deltas).toEqual(['hel', 'lo'])
    expect(result.message.content).toBe('hello')
    expect(result.toolCalls).toEqual([])
  })

  test('mock model is accepted by generateText', async () => {
    const model = new MockLanguageModelV3({
      doGenerate: async () => ({
        finishReason: 'stop',
        usage: { inputTokens: 1, outputTokens: 1 },
        content: [{ type: 'text', text: 'ok' }],
        warnings: [],
      }),
    })
    const { text } = await generateText({ model, prompt: 'hi' })
    expect(text).toBe('ok')
  })
})
