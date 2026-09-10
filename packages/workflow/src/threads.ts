import { Predicate, Schema } from 'effect'

import {
  asJson,
  createWaitId,
  defineThread,
  emit,
  fail,
  invoke,
  isWithdrawnError,
  spawn,
  wait,
  type EventInput,
  type JsonValue,
  type RuntimeEffect,
} from '@looms/core'

export const NodeStatusSchema = Schema.Union([
  Schema.Literal('pending'),
  Schema.Literal('running'),
  Schema.Literal('completed'),
  Schema.Literal('failed'),
  Schema.Literal('skipped'),
])
export type NodeStatus = Schema.Schema.Type<typeof NodeStatusSchema>

export const NodeStateSchema = Schema.Struct({
  status: NodeStatusSchema,
  result: Schema.NullOr(Schema.Json),
  error: Schema.NullOr(Schema.String),
})
export type NodeState = Schema.Schema.Type<typeof NodeStateSchema>

export interface WorkflowPendingSpawn {
  readonly childThreadId: string
  readonly kind: string
  readonly definitionName: string
  readonly nodeId: string
  readonly input: JsonValue
}

export interface WorkflowPendingSleep {
  readonly waitId: string
  readonly wakeAt: number
  readonly nodeId: string
}

export interface WorkflowPendingEffects {
  readonly nodeId: string
  readonly effects: RuntimeEffect[]
}

export interface WorkflowPendingEmit {
  readonly id: string
  readonly event: EventInput
}

export interface WorkflowState {
  definitionName?: string
  nodes: { [nodeId: string]: NodeState }
  concurrency: number
  input: JsonValue
  nodeIds: string[]
  needsSchedule: boolean
  runningNodes: string[]
  pendingSpawns: WorkflowPendingSpawn[]
  pendingSleeps: WorkflowPendingSleep[]
  pendingEffects: WorkflowPendingEffects[]
  pendingEmits: WorkflowPendingEmit[]
  status: 'running' | 'completed' | 'failed'
  error: string | null
}

export const WorkflowStateSchema = Schema.Unknown as Schema.Schema<WorkflowState>

function asObject(payload: JsonValue): { [key: string]: JsonValue } {
  if (!Predicate.isObject(payload)) {
    return {}
  }

  return payload
}

function readString(obj: { [key: string]: JsonValue }, key: string): string | undefined {
  const value = obj[key]
  return Predicate.isString(value) ? value : undefined
}

function scheduleInvocation(state: WorkflowState) {
  const nodes: {
    [id: string]: { status: string; result: JsonValue | null; error: string | null }
  } = {}

  for (const [id, node] of Object.entries(state.nodes)) {
    nodes[id] = { status: node.status, result: node.result, error: node.error }
  }

  return invoke(
    'workflow.schedule',
    asJson({
      definitionName: state.definitionName,
      nodes,
      input: state.input,
    }),
  )
}

function runNodeInvocation(state: WorkflowState, nodeId: string) {
  const results: { [id: string]: JsonValue | null } = {}

  for (const [id, node] of Object.entries(state.nodes)) {
    results[id] = node.result
  }

  return invoke(
    'workflow.runNode',
    asJson({
      definitionName: state.definitionName,
      nodeId,
      input: state.input,
      results,
    }),
    `runNode_${nodeId}`,
  )
}

export const workflowThread = defineThread({
  kind: 'workflow',
  shape: WorkflowStateSchema,
  initialState: (ctx): WorkflowState => ({
    definitionName: ctx.definitionName,
    nodes: {},
    concurrency: 8,
    input: ctx.input,
    nodeIds: [],
    needsSchedule: false,
    runningNodes: [],
    pendingSpawns: [],
    pendingSleeps: [],
    pendingEffects: [],
    pendingEmits: [],
    status: 'running',
    error: null,
  }),
  step(state: WorkflowState, event, ctx): WorkflowState {
    switch (event.type) {
      case 'runtime.thread.started': {
        const payload = asObject(event.payload)
        const defName = readString(payload, 'definitionName') ?? state.definitionName
        const inputObj = Predicate.isObject(payload.input) ? payload.input : {}

        const nodeIds = Array.isArray(inputObj.nodeIds)
          ? inputObj.nodeIds.filter(Predicate.isString)
          : state.nodeIds

        const nodes: { [nodeId: string]: NodeState } = {}

        for (const nodeId of nodeIds) {
          nodes[nodeId] = { status: 'pending', result: null, error: null }
        }

        return {
          ...state,
          definitionName: defName,
          nodes,
          nodeIds,
          input: payload.input ?? state.input,
          needsSchedule: true,
        }
      }

      case 'workflow.node.started': {
        const nodeId = readString(asObject(event.payload), 'nodeId')

        if (!nodeId) {
          return state
        }

        return {
          ...state,
          nodes: {
            ...state.nodes,
            [nodeId]: { status: 'running', result: null, error: null },
          },
          runningNodes: state.runningNodes.includes(nodeId)
            ? state.runningNodes
            : [...state.runningNodes, nodeId],
          needsSchedule: false,
        }
      }

      case 'workflow.node.finished': {
        const payload = asObject(event.payload)
        const nodeId = readString(payload, 'nodeId')

        if (!nodeId) {
          return state
        }

        const error = payload.error
        const failed = Predicate.isString(error) && error.length > 0
        return {
          ...state,
          nodes: {
            ...state.nodes,
            [nodeId]: {
              status: failed ? 'failed' : 'completed',
              result: payload.result ?? null,
              error: failed ? error : null,
            },
          },
          runningNodes: state.runningNodes.filter((id) => id !== nodeId),
          pendingSpawns: state.pendingSpawns.filter((item) => item.nodeId !== nodeId),
          pendingSleeps: state.pendingSleeps.filter((item) => item.nodeId !== nodeId),
          pendingEffects: state.pendingEffects.filter((item) => item.nodeId !== nodeId),
          pendingEmits: state.pendingEmits.filter((item) => item.id !== `finished_${nodeId}`),
          status: failed ? 'failed' : state.status,
          error: failed ? error : state.error,
          needsSchedule: !failed,
        }
      }

      case 'workflow.spawn.requested': {
        const payload = asObject(event.payload)
        const childThreadId = readString(payload, 'childThreadId')
        const kind = readString(payload, 'kind')
        const definitionName = readString(payload, 'definitionName')
        const nodeId = readString(payload, 'nodeId')

        if (!childThreadId || !kind || !definitionName || !nodeId) {
          return state
        }

        return {
          ...state,
          pendingSpawns: [
            ...state.pendingSpawns.filter((item) => item.nodeId !== nodeId),
            {
              childThreadId,
              kind,
              definitionName,
              nodeId,
              input: payload.input ?? null,
            },
          ],
        }
      }

      case 'workflow.sleep.requested': {
        const payload = asObject(event.payload)
        const waitId = readString(payload, 'waitId')
        const wakeAt = payload.wakeAt
        const nodeId = readString(payload, 'nodeId')

        if (!waitId || !Predicate.isNumber(wakeAt) || !nodeId) {
          return state
        }

        return {
          ...state,
          pendingSleeps: [
            ...state.pendingSleeps.filter((item) => item.nodeId !== nodeId),
            { waitId, wakeAt, nodeId },
          ],
        }
      }

      case 'workflow.effects.requested': {
        const payload = asObject(event.payload)
        const nodeId = readString(payload, 'nodeId')
        const raw = payload.effects
        // SAFETY: node handlers serialize RuntimeEffect values into the event payload.
        const effects: RuntimeEffect[] = Array.isArray(raw) ? (raw as RuntimeEffect[]) : []

        if (!nodeId) {
          return state
        }

        const taggedEffects = effects.map((effect, idx) => {
          if (effect.type === 'runtime.wait' && 'on' in effect) {
            const tag = Predicate.isObject(effect.tag) ? { ...effect.tag, nodeId } : { nodeId }
            return { ...effect, tag }
          }

          if (!('tag' in effect && Predicate.isString(effect.tag))) {
            return { ...effect, tag: `${nodeId}_${effect.type}_${idx}` }
          }

          return effect
        })

        return {
          ...state,
          pendingEffects: [
            ...state.pendingEffects.filter((item) => item.nodeId !== nodeId),
            { nodeId, effects: taggedEffects },
          ],
        }
      }

      case 'runtime.effect.failed': {
        const payload = asObject(event.payload)
        const error = readString(payload, 'error') ?? 'effect failed'

        if (isWithdrawnError(error)) {
          return state
        }

        const running = Object.entries(state.nodes).find(([, node]) => node.status === 'running')

        if (!running) {
          return state
        }

        const nodeId = running[0]
        const message = `Node ${nodeId} failed: ${error}`
        return {
          ...state,
          nodes: {
            ...state.nodes,
            [nodeId]: { status: 'failed', result: null, error: message },
          },
          runningNodes: state.runningNodes.filter((id) => id !== nodeId),
          pendingSpawns: state.pendingSpawns.filter((item) => item.nodeId !== nodeId),
          pendingSleeps: state.pendingSleeps.filter((item) => item.nodeId !== nodeId),
          pendingEffects: state.pendingEffects.filter((item) => item.nodeId !== nodeId),
          pendingEmits: [
            ...state.pendingEmits.filter((item) => item.id !== `finished_${nodeId}`),
            {
              id: `finished_${nodeId}`,
              event: {
                type: 'workflow.node.finished',
                payload: asJson({ nodeId, result: null, error: message }),
                threadId: ctx.threadId,
              },
            },
          ],
        }
      }

      case 'runtime.wait.satisfied': {
        const payload = asObject(event.payload)
        const tag = payload.tag

        if (!Predicate.isObject(tag)) {
          return state
        }

        const nodeId = readString(tag, 'nodeId')

        if (!nodeId) {
          return state
        }

        const embedded = payload.event

        const embeddedObj =
          Predicate.isObject(embedded) && Predicate.isObject(embedded.payload)
            ? embedded.payload
            : {}

        const error = readString(embeddedObj, 'error') ?? null

        const result =
          embeddedObj.output ?? (Predicate.isObject(embedded) ? embedded.payload : { waited: true })

        return {
          ...state,
          pendingSpawns: state.pendingSpawns.filter((item) => item.nodeId !== nodeId),
          pendingSleeps: state.pendingSleeps.filter((item) => item.nodeId !== nodeId),
          pendingEffects: state.pendingEffects.filter((item) => item.nodeId !== nodeId),
          pendingEmits: [
            ...state.pendingEmits.filter((item) => item.id !== `finished_${nodeId}`),
            {
              id: `finished_${nodeId}`,
              event: {
                type: 'workflow.node.finished',
                payload: asJson({
                  nodeId,
                  result,
                  error,
                }),
                threadId: ctx.threadId,
              },
            },
          ],
        }
      }

      default:
        return state
    }
  },
  output(state: WorkflowState, ctx) {
    const effects: RuntimeEffect[] = []

    if (state.status === 'failed' && state.error) {
      effects.push(fail(state.error))
      return { effects }
    }

    if (state.needsSchedule) {
      effects.push(scheduleInvocation(state))
    }

    for (const nodeId of state.runningNodes) {
      const hasSpawn = state.pendingSpawns.some((item) => item.nodeId === nodeId)
      const hasSleep = state.pendingSleeps.some((item) => item.nodeId === nodeId)
      const hasEffects = state.pendingEffects.some((item) => item.nodeId === nodeId)

      if (!hasSpawn && !hasSleep && !hasEffects) {
        effects.push(runNodeInvocation(state, nodeId))
      }
    }

    for (const spawnReq of state.pendingSpawns) {
      const waitId = createWaitId(ctx.threadId, `spawn_${spawnReq.childThreadId}`)

      effects.push(
        spawn({
          childThreadId: spawnReq.childThreadId,
          kind: spawnReq.kind,
          definitionName: spawnReq.definitionName,
          input: spawnReq.input,
        }),
        wait({
          waitId,
          on: {
            type: ['runtime.thread.completed', 'runtime.thread.failed'],
            match: { threadId: spawnReq.childThreadId },
          },
          tag: { nodeId: spawnReq.nodeId },
        }),
      )
    }

    for (const sleepReq of state.pendingSleeps) {
      effects.push(
        wait({
          waitId: sleepReq.waitId,
          on: { timerAt: sleepReq.wakeAt },
          tag: { nodeId: sleepReq.nodeId },
        }),
      )
    }

    for (const effectReq of state.pendingEffects) {
      for (const eff of effectReq.effects) {
        effects.push(eff)
      }
    }

    for (const emitReq of state.pendingEmits) {
      effects.push(emit(emitReq.event))
    }

    return { effects }
  },
})
