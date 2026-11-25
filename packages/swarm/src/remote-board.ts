import { Option, Schema } from 'effect'

import { AttachmentSchema } from '@looms/agent'
import { JsonValueSchema, type JsonValue } from '@looms/core'

import {
  BoardError,
  BoardErrorCodeSchema,
  BoardEventSchema,
  BoardLabelsSchema,
  BoardMessageSchema,
  BoardTaskSchema,
  TaskClaimSchema,
  TaskStateSchema,
  type BoardErrorCode,
  type BoardMessage,
  type BoardTask,
  type ClaimInput,
  type CreateTaskInput,
  type EventQuery,
  type LabelInput,
  type MessageQuery,
  type PostInput,
  type RenewInput,
  type ReplyInput,
  type SettleInput,
  type TaskChangeInput,
  type TaskQuery,
  type EventPage,
  type MessageBoard,
  type TaskClaim,
} from './board'

/**
 * A board in another process. `boardHandler` serves a {@link MessageBoard} over HTTP where the
 * board's store lives, and `remoteBoard` is the same board for a host that can only reach it over
 * the network, such as a run in a Durable Object whose board is in a database behind an API.
 *
 * One request is one board call: a POST whose JSON body is `{ method, input }`. The answer is
 * `{ ok: true, value }`, or `{ ok: false, code, message }` when the board refused. Anything else,
 * including a status other than 200, is a fault the swarm retries.
 */

const Attachments = Schema.optional(Schema.Array(AttachmentSchema))
const Labels = Schema.optional(BoardLabelsSchema)
const Text = Schema.optional(Schema.String)
const Count = Schema.optional(Schema.Finite)

const TaskChangeSchema = Schema.Struct({ by: Schema.String, task: Schema.String, note: Text })

/** Every board call: what it takes and what it answers. */
const calls = {
  post: {
    input: Schema.Struct({
      by: Schema.String,
      channel: Schema.String,
      text: Schema.String,
      labels: Labels,
      attachments: Attachments,
      key: Text,
    }),
    output: BoardMessageSchema,
  },
  reply: {
    input: Schema.Struct({
      by: Schema.String,
      to: Schema.String,
      text: Schema.String,
      labels: Labels,
      attachments: Attachments,
      key: Text,
    }),
    output: BoardMessageSchema,
  },
  label: {
    input: Schema.Struct({
      by: Schema.String,
      message: Schema.String,
      set: Labels,
      unset: Schema.optional(Schema.Array(Schema.String)),
      if: Schema.optional(Schema.Record(Schema.String, Schema.NullOr(Schema.String))),
    }),
    output: BoardMessageSchema,
  },
  messages: {
    input: Schema.Struct({
      id: Text,
      channel: Text,
      thread: Text,
      by: Text,
      mentions: Text,
      labels: Labels,
      after: Text,
      limit: Count,
    }),
    output: Schema.Array(BoardMessageSchema),
  },
  createTask: {
    input: Schema.Struct({
      by: Schema.String,
      channel: Schema.String,
      text: Schema.String,
      for: Text,
      needs: Schema.optional(Schema.Array(Schema.String)),
      labels: Labels,
      attachments: Attachments,
      key: Text,
    }),
    output: BoardTaskSchema,
  },
  tasks: {
    input: Schema.Struct({
      channel: Text,
      state: Schema.optional(TaskStateSchema),
      for: Text,
      holder: Text,
      limit: Count,
    }),
    output: Schema.Array(BoardTaskSchema),
  },
  claim: {
    input: Schema.Struct({ by: Schema.String, task: Text, channel: Text, leaseMs: Count }),
    output: Schema.NullOr(TaskClaimSchema),
  },
  renew: {
    input: Schema.Struct({ task: Schema.String, token: Schema.String, leaseMs: Count }),
    output: TaskClaimSchema,
  },
  settle: {
    input: Schema.Struct({
      task: Schema.String,
      token: Schema.String,
      outcome: Schema.Union([
        Schema.Literal('completed'),
        Schema.Literal('failed'),
        Schema.Literal('blocked'),
        Schema.Literal('released'),
      ]),
      note: Text,
    }),
    output: BoardTaskSchema,
  },
  reopen: { input: TaskChangeSchema, output: BoardTaskSchema },
  cancel: { input: TaskChangeSchema, output: BoardTaskSchema },
  events: {
    input: Schema.Struct({ after: Text, limit: Count }),
    output: Schema.Struct({
      events: Schema.Array(BoardEventSchema),
      cursor: Schema.NullOr(Schema.String),
      more: Schema.Boolean,
    }),
  },
}

export type BoardMethod = keyof typeof calls

/** What a board call is made with. */
export type BoardInput =
  | PostInput
  | ReplyInput
  | LabelInput
  | MessageQuery
  | CreateTaskInput
  | TaskQuery
  | ClaimInput
  | RenewInput
  | SettleInput
  | TaskChangeInput
  | EventQuery

/** What a board call resolves with. */
export type BoardValue =
  | BoardMessage
  | readonly BoardMessage[]
  | BoardTask
  | readonly BoardTask[]
  | TaskClaim
  | EventPage
  | null

/** What a board answers one call with. A refusal is an answer; a fault is not. */
export type BoardReply =
  | { readonly ok: true; readonly value: BoardValue }
  | { readonly ok: false; readonly code: BoardErrorCode; readonly message: string }

const BoardCallSchema = Schema.Struct({
  method: Schema.String,
  input: Schema.optional(JsonValueSchema),
})

const BoardAnswerSchema = Schema.Union([
  Schema.Struct({ ok: Schema.Literal(true), value: JsonValueSchema }),
  Schema.Struct({ ok: Schema.Literal(false), code: BoardErrorCodeSchema, message: Schema.String }),
])

const decodeCall = Schema.decodeUnknownOption(BoardCallSchema)
const decodeCallText = Schema.decodeUnknownOption(Schema.fromJsonString(BoardCallSchema))
const decodeAnswerText = Schema.decodeUnknownOption(Schema.fromJsonString(BoardAnswerSchema))

function isMethod(name: string): name is BoardMethod {
  return Object.hasOwn(calls, name)
}

function refusal(code: BoardErrorCode, message: string): BoardReply {
  return { ok: false, code, message }
}

function parse<A, I>(method: BoardMethod, schema: Schema.Codec<A, I>, input: JsonValue): A {
  const decoded = Schema.decodeUnknownOption(schema)(input)

  if (Option.isNone(decoded)) {
    throw new BoardError({ code: 'invalid_input', message: `Invalid input for "${method}"` })
  }

  return decoded.value
}

type BoardCallHandler = (board: MessageBoard, input: JsonValue) => Promise<BoardValue>

const handlers = {
  post: (board, input) => board.post(parse('post', calls.post.input, input)),
  reply: (board, input) => board.reply(parse('reply', calls.reply.input, input)),
  label: (board, input) => board.label(parse('label', calls.label.input, input)),
  messages: (board, input) => board.messages(parse('messages', calls.messages.input, input)),
  createTask: (board, input) =>
    board.createTask(parse('createTask', calls.createTask.input, input)),
  tasks: (board, input) => board.tasks(parse('tasks', calls.tasks.input, input)),
  claim: (board, input) => board.claim(parse('claim', calls.claim.input, input)),
  renew: (board, input) => board.renew(parse('renew', calls.renew.input, input)),
  settle: (board, input) => board.settle(parse('settle', calls.settle.input, input)),
  reopen: (board, input) => board.reopen(parse('reopen', calls.reopen.input, input)),
  cancel: (board, input) => board.cancel(parse('cancel', calls.cancel.input, input)),
  events: (board, input) => board.events(parse('events', calls.events.input, input)),
} satisfies Record<BoardMethod, BoardCallHandler>

/**
 * Run one call, given as untrusted JSON, against a board. Resolves with the board's answer or its
 * refusal, and rejects only when the board faulted. Use it to serve a board from a route of your
 * own; {@link boardHandler} wraps it for a plain `Request`.
 */
export async function answerBoardCall(board: MessageBoard, call: JsonValue): Promise<BoardReply> {
  const decoded = decodeCall(call)

  if (Option.isNone(decoded)) {
    return refusal('invalid_input', 'A board call is { method, input }')
  }

  const { method, input } = decoded.value

  if (!isMethod(method)) {
    return refusal('invalid_input', `The board has no call "${method}"`)
  }

  try {
    return { ok: true, value: await handlers[method](board, input ?? {}) }
  } catch (error) {
    if (error instanceof BoardError) {
      return refusal(error.code, error.message)
    }

    throw error
  }
}

function respond(reply: BoardReply, status = 200): Response {
  return new Response(JSON.stringify(reply), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

/**
 * Serve boards over HTTP. `resolve` picks the board for a request: that is where a host
 * authenticates the caller and throws {@link BoardError} with `board_denied` for a board the
 * caller may not use.
 *
 * ```ts
 * const handle = boardHandler((request) => boardFor(tenantOf(request)))
 * ```
 *
 * A board that faults answers 500 with no detail, and the remote board's caller retries.
 */
export function boardHandler(
  resolve: (request: Request) => MessageBoard | Promise<MessageBoard>,
): (request: Request) => Promise<Response> {
  return async (request) => {
    if (request.method !== 'POST') {
      return respond(refusal('invalid_input', 'A board call is a POST'), 405)
    }

    const call = decodeCallText(await request.text())

    if (Option.isNone(call)) {
      return respond(refusal('invalid_input', 'A board call is JSON of { method, input }'))
    }

    try {
      const board = await resolve(request)

      return respond(await answerBoardCall(board, call.value))
    } catch (error) {
      if (error instanceof BoardError) {
        return respond(refusal(error.code, error.message))
      }

      return new Response(null, { status: 500 })
    }
  }
}

export interface RemoteBoardOptions {
  /** Where the board is served, as given to {@link boardHandler}. */
  readonly url: string
  /** Defaults to the global `fetch`. Pass a service binding's `fetch` to stay off the internet. */
  readonly fetch?: (request: Request) => Promise<Response>
  /** Sent with every call, such as a bearer token. Called per request so a token can rotate. */
  readonly headers?: () => Record<string, string> | Promise<Record<string, string>>
}

/** The board served at `options.url`. Refusals reject with {@link BoardError}, as a local board's do. */
export function remoteBoard(options: RemoteBoardOptions): MessageBoard {
  const send = options.fetch ?? ((request: Request) => fetch(request))

  async function call<A, I>(
    method: BoardMethod,
    input: BoardInput,
    output: Schema.Codec<A, I>,
  ): Promise<A> {
    const response = await send(
      new Request(options.url, {
        method: 'POST',
        headers: { ...(await options.headers?.()), 'content-type': 'application/json' },
        body: JSON.stringify({ method, input }),
      }),
    )

    if (response.status !== 200) {
      throw new Error(`The board answered ${response.status} to "${method}"`)
    }

    const answer = decodeAnswerText(await response.text())

    if (Option.isNone(answer)) {
      throw new Error(`The board gave an unreadable answer to "${method}"`)
    }

    if (!answer.value.ok) {
      throw new BoardError({ code: answer.value.code, message: answer.value.message })
    }

    const value = Schema.decodeUnknownOption(output)(answer.value.value)

    if (Option.isNone(value)) {
      throw new Error(`The board gave an unreadable result for "${method}"`)
    }

    return value.value
  }

  return {
    post: (input) => call('post', input, calls.post.output),
    reply: (input) => call('reply', input, calls.reply.output),
    label: (input) => call('label', input, calls.label.output),
    messages: (query = {}) => call('messages', query, calls.messages.output),
    createTask: (input) => call('createTask', input, calls.createTask.output),
    tasks: (query = {}) => call('tasks', query, calls.tasks.output),
    claim: (input) => call('claim', input, calls.claim.output),
    renew: (input) => call('renew', input, calls.renew.output),
    settle: (input) => call('settle', input, calls.settle.output),
    reopen: (input) => call('reopen', input, calls.reopen.output),
    cancel: (input) => call('cancel', input, calls.cancel.output),
    events: (query = {}) => call('events', query, calls.events.output),
  }
}
