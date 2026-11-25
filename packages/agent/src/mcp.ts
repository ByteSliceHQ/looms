import type { StandardSchemaV1 } from '@standard-schema/spec'
import { Option, Schema } from 'effect'

import {
  JsonValueSchema,
  isJsonObject,
  isJsonString,
  type JsonObject,
  type JsonValue,
} from '@looms/core'

import { defineTool, type AgentRunContext, type FunctionTool } from './definitions'

/**
 * Tools served by a Model Context Protocol server, as agent tools. The server is reached over
 * streamable HTTP, one POST per request, so it works from any host that has `fetch`.
 *
 * ```ts
 * const records = mcpTools({ url: 'https://example.test/mcp' })
 *
 * const agent = defineAgent({ name: 'clerk', instructions, resolveTools: (ctx) => records(ctx) })
 * ```
 */
export interface McpToolsOptions {
  readonly url: string
  /** Defaults to the global `fetch`. Pass a service binding's `fetch` to stay off the internet. */
  readonly fetch?: (request: Request) => Promise<Response>
  /**
   * Sent with every request, such as a bearer token. Called with the run so a token can come from
   * its secrets and a tenant from its attributes.
   */
  readonly headers?: (
    run: AgentRunContext,
  ) => Record<string, string> | Promise<Record<string, string>>
  /**
   * Arguments the host supplies, such as the tenant the run belongs to. Each is sent only to
   * tools whose input schema declares it, and removed from those tools' schemas, so the model
   * neither sees nor sets it. A tool that does not declare a bound field never receives it.
   *
   * A field set to `undefined` is bound with no value for this run: it is still hidden from the
   * model and not sent. A tool that requires such a field is left out of the run's tools, since
   * neither the host nor the model could make a valid call to it.
   */
  readonly bind?: (run: AgentRunContext) => McpBoundArguments
  /** Only these tools, by the server's names. Without it, every tool the server lists. */
  readonly only?: readonly string[]
  /** Put before each tool's name, to keep two servers' tools apart. */
  readonly prefix?: string
  /** How long a server's tool list is reused. Default one minute. */
  readonly cacheMs?: number
  /** Epoch milliseconds. Defaults to `Date.now`. */
  readonly now?: () => number
}

/** Arguments a host binds. `undefined` binds a field with no value for this run. */
export interface McpBoundArguments {
  readonly [name: string]: JsonValue | undefined
}

const DEFAULT_CACHE_MS = 60_000
const PROTOCOL_VERSION = '2025-06-18'

const ListedToolSchema = Schema.Struct({
  name: Schema.String,
  description: Schema.optional(Schema.String),
  inputSchema: Schema.optional(JsonValueSchema),
})

type ListedTool = Schema.Schema.Type<typeof ListedToolSchema>

const ListResultSchema = Schema.Struct({
  tools: Schema.Array(ListedToolSchema),
  nextCursor: Schema.optional(Schema.String),
})

const CallResultSchema = Schema.Struct({
  content: Schema.optional(
    Schema.Array(Schema.Struct({ type: Schema.String, text: Schema.optional(Schema.String) })),
  ),
  structuredContent: Schema.optional(JsonValueSchema),
  isError: Schema.optional(Schema.Boolean),
})

const ReplySchema = Schema.Struct({
  id: Schema.optional(Schema.NullOr(Schema.Union([Schema.String, Schema.Finite]))),
  result: Schema.optional(JsonValueSchema),
  error: Schema.optional(Schema.Struct({ message: Schema.String })),
})

const decodeReply = Schema.decodeUnknownOption(Schema.fromJsonString(ReplySchema))
const decodeList = Schema.decodeUnknownOption(ListResultSchema)
const decodeCall = Schema.decodeUnknownOption(CallResultSchema)

/** The JSON-RPC reply in a response body, which is plain JSON or one server-sent event stream. */
function replyTexts(contentType: string, body: string): string[] {
  if (!contentType.includes('text/event-stream')) {
    return [body]
  }

  return body
    .split(/\r?\n\r?\n/)
    .map((event) =>
      event
        .split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart())
        .join('\n'),
    )
    .filter((data) => data !== '')
}

/** The argument names a tool's schema declares, and those it requires. */
interface DeclaredFields {
  readonly properties: readonly string[]
  readonly required: readonly string[]
}

function declaredFields(schema: JsonValue | undefined): DeclaredFields {
  if (!isJsonObject(schema)) {
    return { properties: [], required: [] }
  }

  const { properties, required } = schema

  return {
    properties: isJsonObject(properties) ? Object.keys(properties) : [],
    required: Array.isArray(required)
      ? required.flatMap((key) => (isJsonString(key) ? [key] : []))
      : [],
  }
}

/** A tool's schema without the arguments the host binds. */
function withoutBound(schema: JsonValue | undefined, bound: readonly string[]): JsonValue {
  if (!isJsonObject(schema)) {
    return { type: 'object' }
  }

  const { properties, required } = schema

  const shownProperties = isJsonObject(properties)
    ? Object.fromEntries(Object.entries(properties).filter(([key]) => !bound.includes(key)))
    : properties

  const shownRequired = Array.isArray(required)
    ? required.filter((key) => !bound.some((name) => name === key))
    : required

  return Object.fromEntries(
    Object.entries({ ...schema, properties: shownProperties, required: shownRequired }).flatMap(
      ([key, value]) => (value === undefined ? [] : [[key, value] as const]),
    ),
  )
}

/** A schema that can also describe itself as JSON Schema, which is how a tool reaches the model. */
type DescribedSchema = StandardSchemaV1<JsonValue, JsonValue> & {
  readonly '~standard': { readonly jsonSchema: { readonly input: () => JsonValue } }
}

/** The server checks arguments, so this only carries its schema to the model. */
function passThrough(schema: JsonValue): DescribedSchema {
  return {
    '~standard': {
      version: 1,
      vendor: 'looms-mcp',
      validate: (value) =>
        isJsonObject(value)
          ? { value }
          : { issues: [{ message: 'Tool arguments must be an object' }] },
      jsonSchema: { input: () => schema },
    },
  }
}

interface Listing {
  readonly tools: readonly ListedTool[]
  readonly at: number
}

/**
 * Returns a function that resolves the server's tools for a run. Keep the function and call it
 * from `resolveTools`: it holds the tool list between turns.
 */
export function mcpTools(
  options: McpToolsOptions,
): (run: AgentRunContext) => Promise<FunctionTool[]> {
  const send = options.fetch ?? ((request: Request) => fetch(request))
  const now = options.now ?? (() => Date.now())
  const cacheMs = options.cacheMs ?? DEFAULT_CACHE_MS
  const prefix = options.prefix ?? ''
  let listing: Listing | null = null
  let nextId = 0

  async function rpc(run: AgentRunContext, method: string, params: JsonObject): Promise<JsonValue> {
    nextId += 1

    const id = nextId

    const response = await send(
      new Request(options.url, {
        method: 'POST',
        headers: {
          ...(await options.headers?.(run)),
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
          'mcp-protocol-version': PROTOCOL_VERSION,
        },
        body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
      }),
    )

    if (!response.ok) {
      throw new Error(`The MCP server answered ${response.status} to ${method}`)
    }

    const texts = replyTexts(response.headers.get('content-type') ?? '', await response.text())

    for (const text of texts) {
      const reply = Option.getOrUndefined(decodeReply(text))

      if (reply?.id === id) {
        if (reply.error) {
          throw new Error(reply.error.message)
        }

        return reply.result ?? null
      }
    }

    throw new Error(`The MCP server gave no answer to ${method}`)
  }

  async function list(run: AgentRunContext): Promise<readonly ListedTool[]> {
    if (listing && now() - listing.at < cacheMs) {
      return listing.tools
    }

    const tools: ListedTool[] = []
    let cursor: string | undefined

    do {
      const page = Option.getOrUndefined(
        decodeList(await rpc(run, 'tools/list', cursor === undefined ? {} : { cursor })),
      )

      if (!page) {
        throw new Error('The MCP server gave an unreadable tool list')
      }

      tools.push(...page.tools)
      cursor = page.nextCursor
    } while (cursor !== undefined)

    listing = { tools, at: now() }

    return tools
  }

  function bindTool(
    tool: ListedTool,
    hidden: readonly string[],
    supplied: JsonObject,
  ): FunctionTool {
    return defineTool({
      name: `${prefix}${tool.name}`,
      description: tool.description ?? tool.name,
      input: passThrough(withoutBound(tool.inputSchema, hidden)),
      handler: async (input, ctx) => {
        const given = isJsonObject(input)
          ? Object.fromEntries(Object.entries(input).filter(([key]) => !hidden.includes(key)))
          : {}

        const result = Option.getOrUndefined(
          decodeCall(
            await rpc(ctx, 'tools/call', {
              name: tool.name,
              arguments: { ...given, ...supplied },
            }),
          ),
        )

        if (!result) {
          throw new Error(`The MCP server gave an unreadable result for ${tool.name}`)
        }

        const text = (result.content ?? []).flatMap((part) => part.text ?? []).join('\n')

        if (result.isError) {
          throw new Error(text || `${tool.name} failed`)
        }

        return result.structuredContent ?? text
      },
    })
  }

  return async (run) => {
    const bound = options.bind?.(run) ?? {}
    const listed = await list(run)
    const wanted = options.only

    return listed
      .filter((tool) => wanted === undefined || wanted.includes(tool.name))
      .flatMap((tool) => {
        const fields = declaredFields(tool.inputSchema)
        const hidden = fields.properties.filter((key) => Object.hasOwn(bound, key))

        // A required field the host binds without a value cannot be filled by anyone.
        if (hidden.some((key) => bound[key] === undefined && fields.required.includes(key))) {
          return []
        }

        const supplied: JsonObject = Object.fromEntries(
          hidden.flatMap((key) => {
            const value = bound[key]

            return value === undefined ? [] : [[key, value] as const]
          }),
        )

        return [bindTool(tool, hidden, supplied)]
      })
  }
}
