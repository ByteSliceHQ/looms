import { describe, expect, test } from 'bun:test'

import { jsonSchemaOfInput, type JsonValue } from '@looms/core'

import type { AgentRunContext } from './definitions'
import { mcpTools } from './mcp'

const run: AgentRunContext = {
  runId: 'run_1',
  threadId: 'thread_1',
  attributes: { tenant: 'acme' },
  secrets: {},
}

interface Call {
  readonly method: string
  readonly params: JsonValue
  readonly authorization: string | null
}

/** A server with one tool, answering in JSON or as an event stream. */
function server(calls: Call[], stream = false) {
  return async (request: Request): Promise<Response> => {
    const body: { id: number; method: string; params: JsonValue } = await request.json()

    calls.push({
      method: body.method,
      params: body.params,
      authorization: request.headers.get('authorization'),
    })

    const result =
      body.method === 'tools/list'
        ? {
            tools: [
              {
                name: 'find',
                description: 'Find records',
                inputSchema: {
                  type: 'object',
                  properties: { tenant: { type: 'string' }, query: { type: 'string' } },
                  required: ['tenant', 'query'],
                },
              },
              { name: 'drop' },
            ],
          }
        : JSON.stringify(body.params).includes('"boom"')
          ? { isError: true, content: [{ type: 'text', text: 'no such record' }] }
          : { content: [{ type: 'text', text: 'ok' }], structuredContent: { found: 2 } }

    const reply = JSON.stringify({ jsonrpc: '2.0', id: body.id, result })

    return stream
      ? new Response(`event: message\ndata: ${reply}\n\n`, {
          headers: { 'content-type': 'text/event-stream' },
        })
      : new Response(reply, { headers: { 'content-type': 'application/json' } })
  }
}

describe('mcp tools', () => {
  test('lists the server tools once and hides bound arguments from the model', async () => {
    const calls: Call[] = []

    const tools = mcpTools({
      url: 'http://mcp.test/',
      fetch: server(calls),
      headers: (ctx) => ({ authorization: `Bearer ${ctx.runId}` }),
      bind: (ctx) => ({ tenant: ctx.attributes.tenant ?? '' }),
      only: ['find'],
      prefix: 'records_',
    })

    const [find, ...rest] = await tools(run)

    await tools(run)

    expect(rest).toEqual([])
    expect(find?.name).toBe('records_find')
    expect(calls.map((call) => call.method)).toEqual(['tools/list'])
    expect(calls[0]?.authorization).toBe('Bearer run_1')

    expect(jsonSchemaOfInput(find?.input)).toEqual({
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    })

    expect(
      await find?.handler({ query: 'late invoices', tenant: 'other' }, { ...run, turn: 1 }),
    ).toEqual({
      found: 2,
    })

    expect(calls[1]).toMatchObject({
      method: 'tools/call',
      params: { name: 'find', arguments: { query: 'late invoices', tenant: 'acme' } },
    })
  })

  test('reads an event stream answer and reports a tool error as a failure', async () => {
    const tools = mcpTools({ url: 'http://mcp.test/', fetch: server([], true) })
    const [find] = await tools(run)

    expect(await find?.handler({ query: 'x' }, { ...run, turn: 1 })).toEqual({ found: 2 })

    const failure = await Promise.resolve(
      find?.handler({ query: 'boom' }, { ...run, turn: 1 }),
    ).then(
      () => 'answered',
      (error: Error) => error.message,
    )

    expect(failure).toBe('no such record')
  })

  test('lists again once the cache is old', async () => {
    const calls: Call[] = []
    let time = 0

    const tools = mcpTools({
      url: 'http://mcp.test/',
      fetch: server(calls),
      cacheMs: 1_000,
      now: () => time,
    })

    await tools(run)
    time = 1_000
    await tools(run)

    expect(calls.map((call) => call.method)).toEqual(['tools/list', 'tools/list'])
  })
})
