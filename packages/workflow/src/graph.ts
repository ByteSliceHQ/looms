import { Data } from 'effect'

import { isJsonString, type JsonValue } from '@looms/core'

import type { NodeState, WorkflowDefinition, WorkflowNodeDefinition } from './definitions'

export const MIN_GRAPH_CONCURRENCY = 1
export const MAX_GRAPH_CONCURRENCY = 64
export const DEFAULT_GRAPH_CONCURRENCY = 8
export const DEFAULT_VALUE_SIZE_LIMIT_BYTES = 2_000_000
export const DEFAULT_CHECKPOINT_SIZE_LIMIT_BYTES = 4_000_000

export class WorkflowValidationError extends Data.TaggedError('WorkflowValidationError')<{
  readonly message: string
}> {
  constructor(message: string) {
    super({ message })
  }
}

export class WorkflowValueTooLargeError extends Data.TaggedError('WorkflowValueTooLargeError')<{
  readonly label: string
  readonly actualBytes: number
  readonly limitBytes: number
  readonly message: string
}> {
  constructor(label: string, actualBytes: number, limitBytes: number) {
    super({
      label,
      actualBytes,
      limitBytes,
      message: `${label} is ${actualBytes} UTF-8 bytes; limit is ${limitBytes} bytes`,
    })
  }
}

export interface WorkflowEdge {
  readonly sourceNodeId: string
  readonly targetNodeId: string
  /** For switch nodes, only the edge matching the returned branch is active. */
  readonly label?: string
}

export type GraphNodeStatuses = Record<string, NodeState['status']>

function fnv1a32(value: string, seed: number): string {
  let hash = seed >>> 0

  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }

  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function deterministicWorkflowId(...parts: readonly (string | number)[]): string {
  const source = parts.join(':')
  let reversed = ''

  for (let index = source.length - 1; index >= 0; index--) {
    reversed += source.charAt(index)
  }

  const hex = [
    fnv1a32(source, 0x811c9dc5),
    fnv1a32(source, 0x9e3779b9),
    fnv1a32(reversed, 0x85ebca6b),
    fnv1a32(reversed, 0xc2b2ae35),
  ].join('')

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${(
    (Number.parseInt(hex.slice(16, 18), 16) & 0x3f) |
    0x80
  )
    .toString(16)
    .padStart(2, '0')}${hex.slice(18, 20)}-${hex.slice(20)}`
}

export function iterationChildWorkflowId(
  parentThreadId: string,
  nodeId: string,
  kind: 'map' | 'fanout' | 'while',
  index: number,
): string {
  return deterministicWorkflowId(parentThreadId, nodeId, kind, index)
}

export function nodeChildWorkflowId(parentThreadId: string, nodeId: string): string {
  return deterministicWorkflowId(parentThreadId, nodeId, 'workflow')
}

export function utf8JsonSize(value: JsonValue | Readonly<object>): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength
}

export function assertJsonWithinLimit(
  value: JsonValue | Readonly<object>,
  label: string,
  limitBytes = DEFAULT_VALUE_SIZE_LIMIT_BYTES,
): void {
  const actualBytes = utf8JsonSize(value)

  if (actualBytes > limitBytes) {
    throw new WorkflowValueTooLargeError(label, actualBytes, limitBytes)
  }
}

export function resolveGraphConcurrency(value?: number): number {
  const concurrency = value ?? DEFAULT_GRAPH_CONCURRENCY

  if (
    !Number.isInteger(concurrency) ||
    concurrency < MIN_GRAPH_CONCURRENCY ||
    concurrency > MAX_GRAPH_CONCURRENCY
  ) {
    throw new WorkflowValidationError('Workflow concurrency must be an integer between 1 and 64')
  }

  return concurrency
}

export function workflowEdges<TInput>(
  definition: WorkflowDefinition<string, TInput>,
): WorkflowEdge[] {
  if (definition.edges) {
    return [...definition.edges]
  }

  return definition.nodes.flatMap((node) =>
    (node.deps ?? []).map((sourceNodeId) => ({ sourceNodeId, targetNodeId: node.id })),
  )
}

export function topologicalSort(
  nodes: readonly Pick<WorkflowNodeDefinition, 'id'>[],
  edges: readonly WorkflowEdge[],
): string[] {
  const ids = new Set<string>()
  const inputOrder = new Map<string, number>()
  const indegree = new Map<string, number>()
  const outgoing = new Map<string, string[]>()

  nodes.forEach((node, index) => {
    if (ids.has(node.id)) {
      throw new WorkflowValidationError(`Duplicate workflow node: ${node.id}`)
    }

    ids.add(node.id)
    inputOrder.set(node.id, index)
    indegree.set(node.id, 0)
    outgoing.set(node.id, [])
  })

  for (const edge of edges) {
    if (!ids.has(edge.sourceNodeId)) {
      throw new WorkflowValidationError(
        `Edge references non-existent source node: ${edge.sourceNodeId}`,
      )
    }

    if (!ids.has(edge.targetNodeId)) {
      throw new WorkflowValidationError(
        `Edge references non-existent target node: ${edge.targetNodeId}`,
      )
    }

    outgoing.get(edge.sourceNodeId)?.push(edge.targetNodeId)
    indegree.set(edge.targetNodeId, (indegree.get(edge.targetNodeId) ?? 0) + 1)
  }

  const ready = nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id)
  const sorted: string[] = []

  while (ready.length > 0) {
    const nodeId = ready.shift()

    if (nodeId === undefined) {
      break
    }

    sorted.push(nodeId)

    for (const target of outgoing.get(nodeId) ?? []) {
      const next = (indegree.get(target) ?? 0) - 1
      indegree.set(target, next)

      if (next === 0) {
        ready.push(target)
        ready.sort((a, b) => (inputOrder.get(a) ?? 0) - (inputOrder.get(b) ?? 0))
      }
    }
  }

  if (sorted.length !== nodes.length) {
    throw new WorkflowValidationError('Workflow contains a cycle')
  }

  return sorted
}

function selectedBranch(state: NodeState | undefined): string | undefined {
  if (state?.status !== 'completed') {
    return undefined
  }

  if (state.branch !== undefined) {
    return state.branch
  }

  return isJsonString(state.result) ? state.result : undefined
}

export function isEdgeActive(
  edge: WorkflowEdge,
  nodes: readonly Pick<WorkflowNodeDefinition, 'id' | 'type'>[],
  states: Readonly<Record<string, NodeState>>,
): boolean {
  if (states[edge.sourceNodeId]?.status === 'skipped') {
    return false
  }

  const source = nodes.find((node) => node.id === edge.sourceNodeId)

  if (source?.type !== 'switch') {
    return true
  }

  const branch = selectedBranch(states[edge.sourceNodeId])
  return edge.label !== undefined && branch === edge.label
}

export function getReadyNodeIds<TInput>(
  definition: WorkflowDefinition<string, TInput>,
  states: Readonly<Record<string, NodeState>>,
): string[] {
  const edges = workflowEdges(definition)
  const order = topologicalSort(definition.nodes, edges)

  const fallbackTargets = new Set(
    definition.nodes.flatMap((node) =>
      node.failure?.type === 'fallback' ? [node.failure.nodeId] : [],
    ),
  )

  return order.filter((nodeId) => {
    if ((states[nodeId]?.status ?? 'pending') !== 'pending') {
      return false
    }

    if (fallbackTargets.has(nodeId)) {
      return false
    }

    const incoming = edges.filter((edge) => edge.targetNodeId === nodeId)

    if (incoming.length === 0) {
      return true
    }

    const terminal = incoming.every((edge) => {
      const status = states[edge.sourceNodeId]?.status
      return status === 'completed' || status === 'skipped'
    })

    return terminal && incoming.some((edge) => isEdgeActive(edge, definition.nodes, states))
  })
}

/**
 * Nodes whose predecessors are terminal but whose incoming switch paths are all
 * inactive can be durably skipped. Repeating this function propagates skips.
 */
export function getSkippableNodeIds<TInput>(
  definition: WorkflowDefinition<string, TInput>,
  states: Readonly<Record<string, NodeState>>,
): string[] {
  const edges = workflowEdges(definition)
  const order = topologicalSort(definition.nodes, edges)
  return order.filter((nodeId) => {
    if ((states[nodeId]?.status ?? 'pending') !== 'pending') {
      return false
    }

    const incoming = edges.filter((edge) => edge.targetNodeId === nodeId)

    if (incoming.length === 0) {
      return false
    }

    const allTerminal = incoming.every((edge) => {
      const status = states[edge.sourceNodeId]?.status
      return status === 'completed' || status === 'skipped'
    })

    return allTerminal && !incoming.some((edge) => isEdgeActive(edge, definition.nodes, states))
  })
}
