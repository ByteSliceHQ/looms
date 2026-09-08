import {
  asJson,
  createWaitId,
  defineThread,
  fail,
  invoke,
  spawn,
  wait,
  type JsonValue,
  type RuntimeEffect,
} from '@looms/core'
import { Predicate } from 'effect'

export type NodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

export interface NodeState {
  status: NodeStatus
  result: JsonValue | null
  error: string | null
}

export interface WorkflowState {
  nodes: { [nodeId: string]: NodeState }
  concurrency: number
  input: JsonValue
  nodeIds: string[]
}

function asObject(payload: JsonValue): { [key: string]: JsonValue } {
  if (!Predicate.isObject(payload)) return {}
  return payload
}

function readString(obj: { [key: string]: JsonValue }, key: string): string | undefined {
  const value = obj[key]
  return Predicate.isString(value) ? value : undefined
}

export const workflowThread = defineThread<WorkflowState>({
  kind: 'workflow',
  initialState: (ctx) => ({
    nodes: {},
    concurrency: 8,
    input: ctx.input,
    nodeIds: [],
  }),
  reduce(state, event, ctx) {
    switch (event.type) {
      case 'runtime.thread.started': {
        const payload = asObject(event.payload)
        const inputObj = Predicate.isObject(payload.input) ? payload.input : {}
        const nodeIds = Array.isArray(inputObj.nodeIds)
          ? inputObj.nodeIds.filter(Predicate.isString)
          : state.nodeIds
        const nodes: { [nodeId: string]: NodeState } = {}
        for (const nodeId of nodeIds) {
          nodes[nodeId] = { status: 'pending', result: null, error: null }
        }
        return {
          state: { ...state, nodes, nodeIds, input: payload.input ?? state.input },
          effects: [invoke('workflow.schedule', {})],
        }
      }
      case 'workflow.node.started': {
        const nodeId = readString(asObject(event.payload), 'nodeId')
        if (!nodeId) return { state }
        return {
          state: {
            ...state,
            nodes: {
              ...state.nodes,
              [nodeId]: { status: 'running', result: null, error: null },
            },
          },
          effects: [invoke('workflow.runNode', { nodeId })],
        }
      }
      case 'workflow.node.finished': {
        const payload = asObject(event.payload)
        const nodeId = readString(payload, 'nodeId')
        if (!nodeId) return { state }
        const error = payload.error
        const failed = Predicate.isString(error) && error.length > 0
        const next: WorkflowState = {
          ...state,
          nodes: {
            ...state.nodes,
            [nodeId]: {
              status: failed ? 'failed' : 'completed',
              result: payload.result ?? null,
              error: failed ? error : null,
            },
          },
        }
        if (failed) {
          return { state: next, effects: [fail(error)] }
        }
        return { state: next, effects: [invoke('workflow.schedule', {})] }
      }
      case 'workflow.spawn.requested': {
        const payload = asObject(event.payload)
        const childThreadId = readString(payload, 'childThreadId')
        const kind = readString(payload, 'kind')
        const definitionName = readString(payload, 'definitionName')
        const nodeId = readString(payload, 'nodeId')
        if (!childThreadId || !kind || !definitionName || !nodeId) return { state }
        const waitId = createWaitId()
        return {
          state,
          effects: [
            spawn({
              childThreadId,
              kind,
              definitionName,
              input: payload.input ?? null,
            }),
            wait({
              waitId,
              on: { type: 'runtime.thread.completed', match: { threadId: childThreadId } },
              tag: { nodeId },
            }),
            wait({
              waitId: `${waitId}_fail`,
              on: { type: 'runtime.thread.failed', match: { threadId: childThreadId } },
              tag: { nodeId },
            }),
          ],
        }
      }
      case 'workflow.sleep.requested': {
        const payload = asObject(event.payload)
        const waitId = readString(payload, 'waitId')
        const wakeAt = payload.wakeAt
        const nodeId = readString(payload, 'nodeId')
        if (!waitId || !Predicate.isNumber(wakeAt) || !nodeId) return { state }
        return {
          state,
          effects: [wait({ waitId, on: { timerAt: wakeAt }, tag: { nodeId } })],
        }
      }
      case 'workflow.effects.requested': {
        const payload = asObject(event.payload)
        const nodeId = readString(payload, 'nodeId')
        const raw = payload.effects
        // SAFETY: node handlers serialize RuntimeEffect values into the event payload.
        const effects: RuntimeEffect[] = Array.isArray(raw)
          ? (raw as RuntimeEffect[])
          : []
        if (!nodeId) return { state, effects }
        return {
          state,
          effects: effects.map((effect) => {
            if (effect.type !== 'runtime.wait' || !('on' in effect)) return effect
            const tag = Predicate.isObject(effect.tag) ? { ...effect.tag, nodeId } : { nodeId }
            return { ...effect, tag }
          }),
        }
      }
      case 'runtime.wait.satisfied': {
        const payload = asObject(event.payload)
        const tag = payload.tag
        if (!Predicate.isObject(tag)) return { state }
        const nodeId = readString(tag, 'nodeId')
        if (!nodeId) return { state }
        const embedded = payload.event
        const embeddedObj =
          Predicate.isObject(embedded) && Predicate.isObject(embedded.payload) ? embedded.payload : {}
        const error = readString(embeddedObj, 'error') ?? null

        return {
          state,
          effects: [
            {
              type: 'runtime.emit',
              event: {
                type: 'workflow.node.finished',
                payload: asJson({
                  nodeId,
                  result: embeddedObj.output ?? (Predicate.isObject(embedded) ? embedded.payload : { waited: true }),
                  error,
                }),
                threadId: ctx.threadId,
              },
            },
          ],
        }
      }
      default:
        return { state }
    }
  },
})
