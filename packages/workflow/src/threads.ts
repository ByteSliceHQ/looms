import { Predicate, Schema } from 'effect'

import {
  asJson,
  createWaitId,
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

import { type NodeState } from './definitions'
import { runNodeEffect, scheduleEffect } from './effects'
import { workflowModule } from './scope'

export { NodeStateSchema, NodeStatusSchema, type NodeState, type NodeStatus } from './definitions'

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

// SAFETY: WorkflowState is folded by reducers; Schema.Unknown is a typed placeholder, not a decoder.
export const WorkflowStateSchema = Schema.Unknown as Schema.Schema<WorkflowState>

function scheduleInvocation(state: WorkflowState) {
  return invoke(scheduleEffect, {
    definitionName: state.definitionName,
    nodes: state.nodes,
    input: state.input,
  })
}

function runNodeInvocation(state: WorkflowState, nodeId: string) {
  const results: { [id: string]: Schema.Json | null } = {}

  for (const [id, node] of Object.entries(state.nodes)) {
    results[id] = node.result
  }

  return invoke(
    runNodeEffect,
    {
      definitionName: state.definitionName,
      nodeId,
      input: state.input,
      results,
    },
    `runNode_${nodeId}`,
  )
}

export const workflowThread = workflowModule.thread({
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
  step(state, event, ctx) {
    switch (event.type) {
      case 'runtime.thread.started': {
        const payload = event.payload
        const defName = payload.definitionName || state.definitionName
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
        const nodeId = event.payload.nodeId

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
        const { nodeId, result, error } = event.payload

        if (!nodeId) {
          return state
        }

        const failed = Predicate.isString(error) && error.length > 0
        return {
          ...state,
          nodes: {
            ...state.nodes,
            [nodeId]: {
              status: failed ? 'failed' : 'completed',
              result: result ?? null,
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
        const { childThreadId, kind, definitionName, nodeId, input } = event.payload

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
              input: input ?? null,
            },
          ],
        }
      }

      case 'workflow.sleep.requested': {
        const { waitId, wakeAt, nodeId } = event.payload

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
        const { nodeId, effects: rawEffects } = event.payload
        const effects: readonly RuntimeEffect[] = Array.isArray(rawEffects) ? rawEffects : []

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
        const error = event.payload.error || 'effect failed'

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
                payload: { nodeId, result: null, error: message },
                threadId: ctx.threadId,
              },
            },
          ],
        }
      }

      case 'runtime.wait.satisfied': {
        const tag = event.payload.tag

        if (!Predicate.isObject(tag)) {
          return state
        }

        const nodeId = Predicate.isString(tag.nodeId) ? tag.nodeId : undefined

        if (!nodeId) {
          return state
        }

        const embedded = event.payload.event

        const embeddedObj =
          Predicate.isObject(embedded) && Predicate.isObject(embedded.payload)
            ? embedded.payload
            : {}

        const error = Predicate.isString(embeddedObj.error) ? embeddedObj.error : null

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
                payload: {
                  nodeId,
                  // SAFETY: result is serialized to a JSON-compatible node execution result.
                  result: asJson(result) ?? null,
                  error,
                },
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
  effects(state, ctx) {
    const effects: RuntimeEffect[] = []

    if (state.needsSchedule) {
      effects.push(scheduleInvocation(state))
    }

    for (const nodeId of state.runningNodes) {
      effects.push(runNodeInvocation(state, nodeId))
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

    if (state.status === 'failed') {
      effects.push(fail(state.error ?? 'Workflow execution failed'))
    }

    return effects
  },
})
