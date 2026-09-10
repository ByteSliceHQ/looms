import { Predicate, Schema } from 'effect'

import { defineProjection, type EventEnvelope, type JsonValue } from '@looms/core'

import { NodeStateSchema } from './threads'

function payloadObject(event: EventEnvelope): { [key: string]: JsonValue } {
  if (!Predicate.isObject(event.payload)) return {}
  return event.payload
}

export const NodesProjectionSchema = Schema.Struct({
  nodes: Schema.Record(Schema.String, NodeStateSchema),
})
export type NodesProjectionState = Schema.Schema.Type<typeof NodesProjectionSchema>

export const nodes = defineProjection({
  name: 'nodes',
  shape: NodesProjectionSchema,
  initialState: { nodes: {} },
  reduce(state, event) {
    const payload = payloadObject(event)
    const nodeId = Predicate.isString(payload.nodeId) ? payload.nodeId : undefined
    if (!nodeId) return state
    switch (event.type) {
      case 'workflow.node.started':
        return {
          nodes: { ...state.nodes, [nodeId]: { status: 'running', result: null, error: null } },
        }
      case 'workflow.node.finished': {
        const error = payload.error
        const failed = Predicate.isString(error) && error.length > 0
        return {
          nodes: {
            ...state.nodes,
            [nodeId]: {
              status: failed ? 'failed' : 'completed',
              result: payload.result ?? null,
              error: failed ? error : null,
            },
          },
        }
      }
      case 'workflow.node.skipped':
        return {
          nodes: { ...state.nodes, [nodeId]: { status: 'skipped', result: null, error: null } },
        }
      default:
        return state
    }
  },
})
