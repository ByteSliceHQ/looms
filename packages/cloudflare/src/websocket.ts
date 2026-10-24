import { Effect, Option, Predicate } from 'effect'

import {
  attachmentFromFilter,
  fanoutSubscription,
  openSubscription,
  subscriptionFilter,
  subscriptionFromSeq,
  type AttachedSubscriptionSocket,
  type EventEnvelope,
  type EventStore,
  type SubscriptionAttachment,
} from '@looms/core'
import {
  authResponse,
  defaultAuthorize,
  grantSubprotocol,
  loadSubscriptionOpening,
  readSubscriptionBounds,
  runRouteInfo,
  type Authorize,
  type LoomsRuntime,
} from '@looms/runtime'

const EVENTS_PATH = /^\/runs\/([^/]+)\/events\/?$/

export interface HibernatingSocketState {
  acceptWebSocket(ws: WebSocket, tags?: string[]): void
  getWebSockets?(tag?: string): readonly WebSocket[]
  setWebSocketAutoResponse?(pair: WebSocketRequestResponsePair): void
}

export interface OpenRunSocketOptions {
  readonly ctx: HibernatingSocketState
  readonly runtime: LoomsRuntime
  readonly store: EventStore
  readonly request: Request
  readonly runId: string
  readonly authorize?: Authorize
  readonly createPair?: () => { readonly client: WebSocket; readonly server: WebSocket } | undefined
}

const autoResponseInstalled = new WeakSet<object>()

export function isRunSocketUpgrade(request: Request): boolean {
  if (request.method !== 'GET') {
    return false
  }

  const upgrade = request.headers.get('upgrade')

  if (upgrade === null || upgrade.toLowerCase() !== 'websocket') {
    return false
  }

  return runEventsPath(new URL(request.url)) !== undefined
}

/**
 * Wakes on append, not on a socket subscription, so a hibernated object can sleep
 * while its WebSockets stay accepted.
 */
export function attachSocketFanout(
  ctx: HibernatingSocketState,
  store: EventStore,
  runId: string,
): EventStore {
  return tapAppend(store, (events) =>
    readSubscriptionBounds(store, runId).pipe(
      Effect.map((bounds) => {
        fanoutSubscription(acceptedSockets(ctx, runId), events, { head: bounds.head })
      }),
      Effect.orElseSucceed(() => {
        fanoutSubscription(acceptedSockets(ctx, runId), events, { head: 1 })
      }),
    ),
  )
}

export function openRunSocket(options: OpenRunSocketOptions): Effect.Effect<Response> {
  const url = new URL(options.request.url)
  const requested = runEventsPath(url)

  if (requested !== options.runId) {
    return Effect.succeed(Response.json({ error: 'Run not found' }, { status: 404 }))
  }

  const authorize = options.authorize ?? defaultAuthorize

  return Effect.gen(function* () {
    const route = yield* runRouteInfo(options.runtime, options.store, {
      access: 'read',
      name: 'runs.events',
      runId: options.runId,
    }).pipe(Effect.option)

    if (Option.isNone(route)) {
      return Response.json({ error: 'Event log is unavailable' }, { status: 500 })
    }

    const decision = yield* authorize(options.request, route.value)

    const denied = authResponse(decision)

    if (denied) {
      return denied
    }

    const cursor = subscriptionFromSeq(url, options.request.headers.get('last-event-id'))

    if (!cursor.ok) {
      return Response.json({ error: cursor.message }, { status: 400 })
    }

    const createPair = options.createPair ?? createWebSocketPair
    const pair = createPair()

    if (!pair) {
      return new Response('WebSocket upgrade is not available', { status: 426 })
    }

    installAutoResponse(options.ctx)
    options.ctx.acceptWebSocket(pair.server, [options.runId])

    const filter = subscriptionFilter(url)
    const attachment = attachmentFromFilter(filter, cursor.fromSeq, null)
    const socket = wrapSocket(pair.server)
    socket.setAttachment(attachment)

    const loaded = yield* loadSubscriptionOpening(
      options.store,
      options.runId,
      cursor.fromSeq,
    ).pipe(Effect.option)

    if (Option.isNone(loaded)) {
      return Response.json({ error: 'Event log is unavailable' }, { status: 500 })
    }

    const current = socket.attachment() ?? attachment
    const next = openSubscription(socket, current, loaded.value)

    if (next) {
      socket.setAttachment(next)
    }

    const protocol = grantSubprotocol(options.request)

    return new Response(null, {
      status: 101,
      webSocket: pair.client,
      headers: protocol ? { 'sec-websocket-protocol': protocol } : undefined,
    })
  })
}

function tapAppend(
  store: EventStore,
  onAppend: (events: readonly EventEnvelope[]) => Effect.Effect<void>,
): EventStore {
  return {
    ...store,
    append: (runId, events, appendOptions) =>
      Effect.gen(function* () {
        const result = yield* store.append(runId, events, appendOptions)
        const first = result.sequences[0]

        if (first === undefined) {
          return result
        }

        yield* Effect.gen(function* () {
          const appended = yield* store.read(runId, {
            fromSeq: first,
            limit: result.sequences.length,
          })

          if (appended.length === 0) {
            return
          }

          yield* onAppend(appended)
        }).pipe(Effect.ignore)

        return result
      }),
  }
}

function acceptedSockets(
  ctx: HibernatingSocketState,
  runId: string,
): readonly AttachedSubscriptionSocket[] {
  if (!ctx.getWebSockets) {
    return []
  }

  return ctx.getWebSockets(runId).map(wrapSocket)
}

function wrapSocket(ws: WebSocket): AttachedSubscriptionSocket {
  return {
    send: (data) => {
      ws.send(data)
    },
    close: (code, reason) => {
      ws.close(code, reason)
    },
    get bufferedAmount() {
      return Predicate.isNumber(ws.bufferedAmount) ? ws.bufferedAmount : 0
    },
    attachment: () => readAttachment(ws),
    setAttachment: (attachment) => {
      writeAttachment(ws, attachment)
    },
  }
}

function readAttachment(ws: WebSocket): SubscriptionAttachment | undefined {
  if (!('deserializeAttachment' in ws)) {
    return undefined
  }

  // oxlint-disable-next-line typescript/unbound-method -- hibernation methods are own properties of the platform socket
  const read: unknown = ws.deserializeAttachment

  if (!Predicate.isFunction(read)) {
    return undefined
  }

  const value: unknown = read.call(ws)

  if (!Predicate.isObject(value) || !('cursor' in value) || !Predicate.isNumber(value.cursor)) {
    return undefined
  }

  const principal =
    'principal' in value && (value.principal === null || Predicate.isString(value.principal))
      ? value.principal
      : null

  const threadId = 'threadId' in value && Predicate.isString(value.threadId) ? value.threadId : null

  const includeEphemeral = !('includeEphemeral' in value) || value.includeEphemeral !== false

  return {
    principal,
    cursor: value.cursor,
    threadId,
    includeEphemeral,
  }
}

function writeAttachment(ws: WebSocket, attachment: SubscriptionAttachment): void {
  if (!('serializeAttachment' in ws)) {
    return
  }

  // oxlint-disable-next-line typescript/unbound-method -- hibernation methods are own properties of the platform socket
  const write: unknown = ws.serializeAttachment

  if (!Predicate.isFunction(write)) {
    return
  }

  write.call(ws, attachment)
}

function installAutoResponse(ctx: HibernatingSocketState): void {
  if (autoResponseInstalled.has(ctx) || !ctx.setWebSocketAutoResponse) {
    return
  }

  try {
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'))
    autoResponseInstalled.add(ctx)
  } catch {
    // Hosts without the hibernation helper still accept the socket.
  }
}

interface WorkersSocketPair {
  readonly 0: WebSocket
  readonly 1: WebSocket
}

interface WorkersGlobals {
  readonly WebSocketPair?: new () => WorkersSocketPair
}

function createWebSocketPair(): { client: WebSocket; server: WebSocket } | undefined {
  // SAFETY: Workers adds WebSocketPair to the global object. Other hosts leave it absent.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const candidate = (globalThis as WorkersGlobals).WebSocketPair

  if (!Predicate.isFunction(candidate)) {
    return undefined
  }

  let pair: unknown

  try {
    pair = Reflect.construct(candidate, [])
  } catch {
    return undefined
  }

  if (!isSocketPair(pair)) {
    return undefined
  }

  return { client: pair[0], server: pair[1] }
}

function isSocket(value: unknown): value is WebSocket {
  return (
    Predicate.isObject(value) &&
    'send' in value &&
    Predicate.isFunction(value.send) &&
    'close' in value &&
    Predicate.isFunction(value.close)
  )
}

function isSocketPair(value: unknown): value is { 0: WebSocket; 1: WebSocket } {
  return Predicate.isObject(value) && isSocket(value[0]) && isSocket(value[1])
}

function runEventsPath(url: URL): string | undefined {
  const match = EVENTS_PATH.exec(url.pathname)
  const raw = match?.[1]

  if (!raw) {
    return undefined
  }

  try {
    return decodeURIComponent(raw)
  } catch {
    return undefined
  }
}
