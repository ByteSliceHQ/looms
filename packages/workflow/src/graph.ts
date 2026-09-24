import { Data, Effect } from 'effect'

import { deterministicThreadId, isJsonString, utf8JsonBytes, type JsonValue } from '@looms/core'

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

/** Distinguishes each attempt, and each loop iteration within it, of one node. */
export function nodeRunKey(nodeId: string, attempt: number, iteration?: number): string {
  return iteration === undefined ? `${nodeId}_${attempt}` : `${nodeId}_${attempt}_${iteration}`
}

export function iterationChildWorkflowId(
  parentThreadId: string,
  nodeId: string,
  kind: 'map' | 'loop',
  attempt: number,
  index: number,
): string {
  return deterministicThreadId(parentThreadId, nodeId, kind, attempt, index)
}

export function nodeChildWorkflowId(
  parentThreadId: string,
  nodeId: string,
  attempt: number,
): string {
  return deterministicThreadId(parentThreadId, nodeId, 'workflow', attempt)
}

export function assertJsonWithinLimit(
  value: JsonValue | Readonly<object>,
  label: string,
  limitBytes = DEFAULT_VALUE_SIZE_LIMIT_BYTES,
): Effect.Effect<void, WorkflowValueTooLargeError> {
  const actualBytes = utf8JsonBytes(value)

  return actualBytes > limitBytes
    ? Effect.fail(new WorkflowValueTooLargeError(label, actualBytes, limitBytes))
    : Effect.void
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
  const state = states[edge.sourceNodeId]

  if (state?.status === 'skipped') {
    return state.skipCause === 'policy'
  }

  const source = nodes.find((node) => node.id === edge.sourceNodeId)

  if (source?.type !== 'switch') {
    return true
  }

  const branch = selectedBranch(state)
  return edge.label !== undefined && branch === edge.label
}

/** The fallback node standing in for `node`, if its failure policy handed off to one. */
function activeFallback(
  node: Pick<WorkflowNodeDefinition, 'failure'>,
  state: NodeState | undefined,
): string | undefined {
  return node.failure?.type === 'fallback' &&
    state?.status === 'skipped' &&
    state.skipCause === 'policy'
    ? node.failure.nodeId
    : undefined
}

/**
 * A node is settled once dependents may observe it: completed, or skipped. A node that fell back
 * stays unsettled until its fallback node completes, so dependents see the fallback's result.
 */
function isSettled<TInput>(
  definition: WorkflowDefinition<string, TInput>,
  states: Readonly<Record<string, NodeState>>,
  nodeId: string,
): boolean {
  const state = states[nodeId]

  if (state?.status === 'completed') {
    return true
  }

  if (state?.status !== 'skipped') {
    return false
  }

  const node = definition.nodes.find((candidate) => candidate.id === nodeId)
  const fallback = node && activeFallback(node, state)
  return fallback === undefined || isSettled(definition, states, fallback)
}

function fallbackTargets<TInput>(definition: WorkflowDefinition<string, TInput>): Set<string> {
  return new Set(
    definition.nodes.flatMap((node) =>
      node.failure?.type === 'fallback' ? [node.failure.nodeId] : [],
    ),
  )
}

export function getReadyNodeIds<TInput>(
  definition: WorkflowDefinition<string, TInput>,
  states: Readonly<Record<string, NodeState>>,
): string[] {
  const edges = workflowEdges(definition)
  const order = topologicalSort(definition.nodes, edges)
  const fallbacks = fallbackTargets(definition)

  return order.filter((nodeId) => {
    if ((states[nodeId]?.status ?? 'pending') !== 'pending' || fallbacks.has(nodeId)) {
      return false
    }

    const incoming = edges.filter((edge) => edge.targetNodeId === nodeId)

    if (incoming.length === 0) {
      return true
    }

    return (
      incoming.every((edge) => isSettled(definition, states, edge.sourceNodeId)) &&
      incoming.some((edge) => isEdgeActive(edge, definition.nodes, states))
    )
  })
}

/**
 * Nodes whose predecessors are settled but whose incoming paths are all inactive can be durably
 * skipped. Repeating this function propagates skips.
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

    return (
      incoming.every((edge) => isSettled(definition, states, edge.sourceNodeId)) &&
      !incoming.some((edge) => isEdgeActive(edge, definition.nodes, states))
    )
  })
}

/** Fallback nodes whose primaries all settled without falling back will never run. */
export function getUnusedFallbackIds<TInput>(
  definition: WorkflowDefinition<string, TInput>,
  states: Readonly<Record<string, NodeState>>,
): string[] {
  return [...fallbackTargets(definition)].filter((target) => {
    if ((states[target]?.status ?? 'pending') !== 'pending') {
      return false
    }

    const primaries = definition.nodes.filter(
      (node) => node.failure?.type === 'fallback' && node.failure.nodeId === target,
    )

    return primaries.every((node) => {
      const state = states[node.id]
      const status = state?.status
      return (status === 'completed' || status === 'skipped') && !activeFallback(node, state)
    })
  })
}

/** Node results as dependents see them: a node that fell back reports its fallback's result. */
export function nodeResults<TInput>(
  definition: WorkflowDefinition<string, TInput>,
  states: Readonly<Record<string, NodeState>>,
) {
  const results = Object.fromEntries(
    Object.entries(states).map(([id, state]) => [id, state.result] as const),
  )

  for (const node of definition.nodes) {
    const fallback = activeFallback(node, states[node.id])

    if (fallback !== undefined) {
      results[node.id] = states[fallback]?.result ?? null
    }
  }

  return results
}
