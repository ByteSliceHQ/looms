import { describe, expect, test } from 'bun:test'

import { generateText, simulateReadableStream } from 'ai'
import { MockLanguageModelV3 } from 'ai/test'

import type { AgentRunContext, Message } from '@looms/agent'

import { resolveAttachments, toModelMessages } from './messages'
import { vercelLlm } from './vercel-llm'

const run: AgentRunContext = {
  runId: 'run_1',
  threadId: 'thread_1',
  attributes: { tenant: 'acme' },
  secrets: {},
}

function modelUsage(input: number, output: number) {
  return {
    inputTokens: {
      total: input,
      noCache: input,
      cacheRead: undefined,
      cacheWrite: undefined,
    },
    outputTokens: {
      total: output,
      text: output,
      reasoning: undefined,
    },
  }
}

function finishReason(unified: 'stop' | 'tool-calls') {
  return { unified, raw: undefined }
}

describe('toModelMessages', () => {
  test('sends resolved attachments as image and file parts beside the text', async () => {
    const png = new Uint8Array([137, 80, 78, 71])
    const pdf = new Uint8Array([37, 80, 68, 70])

    const lines = [
      {
        role: 'user' as const,
        content: 'What is in these?',
        attachments: [
          { id: 'a1', mediaType: 'image/png', name: 'shot.png' },
          { id: 'a2', mediaType: 'application/pdf', name: 'spec.pdf' },
        ],
      },
    ]

    const attachments = await resolveAttachments(
      lines,
      (attachment) => (attachment.id === 'a1' ? png : pdf),
      run,
    )

    expect(toModelMessages(lines, { attachments })).toEqual([
      {
        role: 'user',
        content: [
          { type: 'text', text: 'What is in these?' },
          { type: 'image', image: png, mediaType: 'image/png' },
          { type: 'file', data: pdf, mediaType: 'application/pdf', filename: 'spec.pdf' },
        ],
      },
    ])
  })

  test('names an attachment it cannot send and falls back to its url', async () => {
    const lines = [
      {
        role: 'user' as const,
        content: 'Listen',
        attachments: [
          { id: 'gone', mediaType: 'audio/mpeg', name: 'memo.mp3' },
          { id: 'hosted', mediaType: 'image/jpeg', url: 'https://example.com/cat.jpg' },
        ],
      },
    ]

    const attachments = await resolveAttachments(lines, () => null, run)

    expect(toModelMessages(lines, { attachments })).toEqual([
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Listen\n\n[Attached, not shown to the model: memo.mp3 (audio/mpeg)]',
          },
          { type: 'image', image: new URL('https://example.com/cat.jpg'), mediaType: 'image/jpeg' },
        ],
      },
    ])
  })

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

test('sends the files on a tool result beside its text', async () => {
  const png = new Uint8Array([1, 2, 3])
  const content = '{"attachments":[{"id":"a1","mediaType":"image/png","name":"shot.png"}]}'

  const lines: Message[] = [
    {
      role: 'tool',
      content,
      toolCallId: 'tc1',
      name: 'board_view',
      attachments: [
        { id: 'a1', mediaType: 'image/png', name: 'shot.png' },
        { id: 'a2', mediaType: 'video/mp4', url: 'https://files.example/a2' },
        { id: 'a3', mediaType: 'audio/mpeg' },
      ],
    },
  ]

  const attachments = await resolveAttachments(
    lines,
    (attachment) => (attachment.id === 'a1' ? png : null),
    run,
  )

  expect(toModelMessages(lines, { attachments })).toEqual([
    {
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId: 'tc1',
          toolName: 'board_view',
          output: {
            type: 'content',
            value: [
              { type: 'text', text: content },
              {
                type: 'file',
                data: { type: 'data', data: png },
                mediaType: 'image/png',
                filename: 'shot.png',
              },
              {
                type: 'file',
                data: { type: 'url', url: new URL('https://files.example/a2') },
                mediaType: 'video/mp4',
              },
            ],
          },
        },
      ],
    },
  ])
})

test('tells the resolver which run the files are read for', async () => {
  const seen: Array<string | undefined> = []

  await resolveAttachments(
    [{ role: 'user', content: 'look', attachments: [{ id: 'a1', mediaType: 'image/png' }] }],
    (attachment, caller) => {
      seen.push(`${caller.attributes.tenant}/${attachment.id}`)

      return null
    },
    run,
  )

  expect(seen).toEqual(['acme/a1'])
})

describe('vercelLlm', () => {
  test('maps generateText text and tool calls', async () => {
    const model = new MockLanguageModelV3({
      doGenerate: async () => ({
        finishReason: finishReason('tool-calls'),
        usage: modelUsage(1, 1),
        content: [
          { type: 'text', text: '' },
          {
            type: 'tool-call',
            toolCallId: 'tc1',
            toolName: 'greet',
            input: JSON.stringify({ name: 'Ada' }),
          },
        ],
        warnings: [],
      }),
    })

    const adapter = vercelLlm({ model, stream: false })

    const result = await adapter.complete({
      run,
      agent: { name: 'helper', version: '1' },
      turn: 1,
      input: null,
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
              finishReason: finishReason('stop'),
              usage: modelUsage(1, 2),
              totalUsage: modelUsage(1, 2),
            },
          ],
        }),
      }),
    })

    const adapter = vercelLlm({ model, stream: true })
    const deltas: string[] = []

    const result = await adapter.complete({
      run,
      agent: { name: 'helper', version: '1' },
      turn: 1,
      input: null,
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
        finishReason: finishReason('stop'),
        usage: modelUsage(1, 1),
        content: [{ type: 'text', text: 'ok' }],
        warnings: [],
      }),
    })

    const { text } = await generateText({ model, prompt: 'hi' })
    expect(text).toBe('ok')
  })
})
