import {
  fromWireEvent,
  LoomsEventSchema,
  type ActorState,
  type AgentDefinition,
  type AnyAgentDefinition,
  type AnyDefinition,
  type AnyWorkflowDefinition,
  type JsonValue,
  type Message,
  type LoomsEvent,
  type WorkflowDefinition,
} from '@looms/core'
import { Predicate, Schema } from 'effect'

export interface LoomsClientOptions {
  /**
   * Looms host origin, e.g. `http://127.0.0.1:8787`.
   * Omit or pass `''` for same-origin relative paths (`/actors/...`) — typical in browser apps
   * that proxy the Looms host.
   */
  baseUrl?: string
  fetch?: typeof fetch
}

export interface StartResult {
  actorId: string
  state: ActorState
}

export type FindAgent<
  TDefs extends readonly AnyDefinition[],
  TName extends string,
> = Extract<TDefs[number], { kind?: 'agent'; name: TName }>

export type FindWorkflow<
  TDefs extends readonly AnyDefinition[],
  TName extends string,
> = Extract<TDefs[number], { kind?: 'workflow'; name: TName }>

export type AgentNames<TDefs extends readonly AnyDefinition[]> =
  Extract<TDefs[number], AnyAgentDefinition>['name']

export type WorkflowNames<TDefs extends readonly AnyDefinition[]> =
  Extract<TDefs[number], AnyWorkflowDefinition>['name']

export type AgentInput<
  TDefs extends readonly AnyDefinition[],
  TName extends string,
> = FindAgent<TDefs, TName> extends AgentDefinition<any, infer TInput, any>
  ? TInput
  : JsonValue

export type WorkflowInput<
  TDefs extends readonly AnyDefinition[],
  TName extends string,
> = FindWorkflow<TDefs, TName> extends WorkflowDefinition<any, infer TInput, any>
  ? TInput
  : JsonValue

export interface LoomsClient<TDefs extends readonly AnyDefinition[] = readonly AnyDefinition[]> {
  startAgent<TDef extends AnyAgentDefinition>(
    definition: TDef,
    input: TDef extends AgentDefinition<any, infer TInput, any> ? TInput : JsonValue,
    options?: { actorId?: string },
  ): Promise<StartResult>
  startAgent<TName extends AgentNames<TDefs>>(
    definitionName: TName,
    input: AgentInput<TDefs, TName>,
    options?: { actorId?: string },
  ): Promise<StartResult>
  startAgent(
    definitionOrName: AnyAgentDefinition | string,
    input?: JsonValue,
    options?: { actorId?: string },
  ): Promise<StartResult>

  startWorkflow<TDef extends AnyWorkflowDefinition>(
    definition: TDef,
    input: TDef extends WorkflowDefinition<any, infer TInput, any> ? TInput : JsonValue,
    options?: { actorId?: string },
  ): Promise<StartResult>
  startWorkflow<TName extends WorkflowNames<TDefs>>(
    definitionName: TName,
    input: WorkflowInput<TDefs, TName>,
    options?: { actorId?: string },
  ): Promise<StartResult>
  startWorkflow(
    definitionOrName: AnyWorkflowDefinition | string,
    input?: JsonValue,
    options?: { actorId?: string },
  ): Promise<StartResult>

  getState: (actorId: string) => Promise<ActorState>
  getEvents: (actorId: string, options?: { fromSeq?: number; limit?: number }) => Promise<LoomsEvent[]>
  sendMessage: (actorId: string, message: string | Message) => Promise<ActorState>
  decideReview: (
    actorId: string,
    reviewId: string,
    decision: { actionId?: string; outcome: 'approve' | 'reject'; payload?: JsonValue },
  ) => Promise<ActorState>
  steer: (
    actorId: string,
    message: string | Message,
    options?: { interrupt?: boolean; turn?: number },
  ) => Promise<ActorState>
  /**
   * Subscribe to actor events via SSE when available, otherwise poll GET /actors/:id/events.
   * Returns an unsubscribe function.
   */
  subscribeEvents: (
    actorId: string,
    onEvent: (event: LoomsEvent) => void,
    options?: { fromSeq?: number; pollIntervalMs?: number },
  ) => () => void
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`HTTP ${res.status}: ${body}`)
  }
  // SAFETY: caller specifies T for the known HTTP JSON response shape at each call site
  return (await res.json()) as T
}

export function createLoomsClient<
  TDefs extends readonly AnyDefinition[] = readonly AnyDefinition[],
>(options: LoomsClientOptions = {}): LoomsClient<TDefs> {
  const baseUrl = (options.baseUrl ?? '').replace(/\/$/, '')
  const fetchFn = options.fetch ?? fetch

  const client: LoomsClient<TDefs> = {
    startAgent: async (definitionOrName: AnyAgentDefinition | string, input?: any, opts?: { actorId?: string }) => {
      const definitionName = Predicate.isString(definitionOrName)
        ? definitionOrName
        : definitionOrName.name
      const res = await fetchFn(`${baseUrl}/actors/agent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ definitionName, input, actorId: opts?.actorId }),
      })
      return parseJson<StartResult>(res)
    },

    startWorkflow: async (definitionOrName: AnyWorkflowDefinition | string, input?: any, opts?: { actorId?: string }) => {
      const definitionName = Predicate.isString(definitionOrName)
        ? definitionOrName
        : definitionOrName.name
      const res = await fetchFn(`${baseUrl}/actors/workflow`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ definitionName, input, actorId: opts?.actorId }),
      })
      return parseJson<StartResult>(res)
    },

    getState: async (actorId) => {
      const res = await fetchFn(`${baseUrl}/actors/${encodeURIComponent(actorId)}/state`)
      const body = await parseJson<{ state: ActorState }>(res)
      return body.state
    },

    getEvents: async (actorId, opts) => {
      const params = new URLSearchParams()
      if (opts?.fromSeq !== undefined) params.set('fromSeq', String(opts.fromSeq))
      if (opts?.limit !== undefined) params.set('limit', String(opts.limit))
      const qs = params.toString()
      const res = await fetchFn(
        `${baseUrl}/actors/${encodeURIComponent(actorId)}/events${qs ? `?${qs}` : ''}`,
      )
      const body = await parseJson<{ events: unknown[] }>(res)
      return body.events.map((raw) =>
        fromWireEvent(Schema.decodeUnknownSync(LoomsEventSchema)(raw)),
      )
    },

    sendMessage: async (actorId, message) => {
      const res = await fetchFn(`${baseUrl}/actors/${encodeURIComponent(actorId)}/signal`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const body = await parseJson<{ state: ActorState }>(res)
      return body.state
    },

    decideReview: async (actorId, reviewId, decision) => {
      const res = await fetchFn(
        `${baseUrl}/actors/${encodeURIComponent(actorId)}/reviews/${encodeURIComponent(reviewId)}/decide`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            actionId: decision.actionId ?? decision.outcome,
            outcome: decision.outcome,
            payload: decision.payload,
          }),
        },
      )
      const body = await parseJson<{ state: ActorState }>(res)
      return body.state
    },

    steer: async (actorId, message, opts) => {
      const res = await fetchFn(`${baseUrl}/actors/${encodeURIComponent(actorId)}/steer`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message,
          interrupt: opts?.interrupt,
          turn: opts?.turn,
        }),
      })
      const body = await parseJson<{ state: ActorState }>(res)
      return body.state
    },

    subscribeEvents: (actorId, onEvent, opts) => {
      let cancelled = false
      let cursor = (opts?.fromSeq ?? 1) - 1
      const pollIntervalMs = opts?.pollIntervalMs ?? 500

      let timer: ReturnType<typeof setInterval> | undefined
      const startPolling = () => {
        const tick = async () => {
          if (cancelled) return
          try {
            const events = await client.getEvents(actorId, { fromSeq: cursor + 1 })
            for (const event of events) {
              cursor = event.seq
              onEvent(event)
            }
          } catch {
            // transient
          }
        }
        void tick()
        timer = setInterval(() => void tick(), pollIntervalMs)
      }
      startPolling()

      return () => {
        cancelled = true
        if (timer) clearInterval(timer)
      }
    },
  }

  return client
}
