import { Predicate, Schema } from 'effect'

import {
  asJson,
  createWaitId,
  defineThread,
  fail,
  invoke,
  isWithdrawnError,
  spawn,
  wait,
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

export interface WorkflowState {
  definitionName?: string
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
  )
}

export const workflowThread = defineThread<WorkflowState>({
  kind: 'workflow',
  initialState: (ctx) => ({
    definitionName: ctx.definitionName,
    nodes: {},
    concurrency: 8,
    input: ctx.input,
    nodeIds: [],
  }),
  reduce(state, event, ctx) {
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
        const nextState: WorkflowState = {
          ...state,
          definitionName: defName,
          nodes,
          nodeIds,
          input: payload.input ?? state.input,
        }
        return {
          state: nextState,
          effects: [scheduleInvocation(nextState)],
        }
      }
      case 'workflow.node.started': {
        const nodeId = readString(asObject(event.payload), 'nodeId')
        if (!nodeId) return { state }
        const nextState: WorkflowState = {
          ...state,
          nodes: {
            ...state.nodes,
            [nodeId]: { status: 'running', result: null, error: null },
          },
        }
        return {
          state: nextState,
          effects: [runNodeInvocation(nextState, nodeId)],
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
        return { state: next, effects: [scheduleInvocation(next)] }
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
              on: {
                type: ['runtime.thread.completed', 'runtime.thread.failed'],
                match: { threadId: childThreadId },
              },
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
        const effects: RuntimeEffect[] = Array.isArray(raw) ? (raw as RuntimeEffect[]) : []
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
      case 'runtime.effect.failed': {
        const payload = asObject(event.payload)
        const error = readString(payload, 'error') ?? 'effect failed'
        if (isWithdrawnError(error)) return { state }
        const running = Object.entries(state.nodes).find(([, node]) => node.status === 'running')
        if (!running) return { state }
        const nodeId = running[0]
        const message = `Node ${nodeId} failed: ${error}`
        return {
          state: {
            ...state,
            nodes: {
              ...state.nodes,
              [nodeId]: { status: 'failed', result: null, error: message },
            },
          },
          effects: [
            {
              type: 'runtime.emit',
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
        if (!Predicate.isObject(tag)) return { state }
        const nodeId = readString(tag, 'nodeId')
        if (!nodeId) return { state }
        const embedded = payload.event
        const embeddedObj =
          Predicate.isObject(embedded) && Predicate.isObject(embedded.payload)
            ? embedded.payload
            : {}
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
                  result:
                    embeddedObj.output ??
                    (Predicate.isObject(embedded) ? embedded.payload : { waited: true }),
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
