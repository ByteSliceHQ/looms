import { Predicate, Schema } from 'effect'

import { NodeStateSchema, type NodeState } from './definitions'
import { workflowModule } from './scope'

export const NodesProjectionSchema = Schema.Struct({
  nodes: Schema.Record(Schema.String, NodeStateSchema),
})
export type NodesProjectionState = Schema.Schema.Type<typeof NodesProjectionSchema>

export const nodes = workflowModule.projection({
  name: 'nodes',
  shape: NodesProjectionSchema,
  initialState: { nodes: {} },
  reduce(state, event) {
    switch (event.type) {
      case 'workflow.node.started': {
        const { nodeId } = event.payload
        return {
          nodes: {
            ...state.nodes,
            [nodeId]: {
              status: 'running',
              result: null,
              error: null,
            } satisfies NodeState,
          },
        }
      }

      case 'workflow.node.finished': {
        const { nodeId, result, error, branch } = event.payload
        const failed = Predicate.isString(error) && error.length > 0

        const nodeState: NodeState =
          branch === undefined
            ? {
                status: failed ? 'failed' : 'completed',
                result: result ?? null,
                error: failed ? error : null,
              }
            : {
                status: failed ? 'failed' : 'completed',
                result: result ?? null,
                error: failed ? error : null,
                branch,
              }

        return {
          nodes: {
            ...state.nodes,
            [nodeId]: nodeState,
          },
        }
      }

      case 'workflow.node.skipped': {
        const { nodeId } = event.payload
        return {
          nodes: {
            ...state.nodes,
            [nodeId]: {
              status: 'skipped',
              result: null,
              error: null,
            } satisfies NodeState,
          },
        }
      }

      default:
        return state
    }
  },
})
