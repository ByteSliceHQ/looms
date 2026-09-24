import type { StandardSchemaV1 } from '@standard-schema/spec'
import { Schema } from 'effect'

import { DEFAULT_DEFINITION_VERSION, type JsonValue, type RuntimeEffect } from '@looms/core'

import {
  DEFAULT_GRAPH_CONCURRENCY,
  getReadyNodeIds,
  resolveGraphConcurrency,
  topologicalSort,
  workflowEdges,
  type WorkflowEdge,
} from './graph'

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
  attempts: Schema.optional(Schema.Finite),
  branch: Schema.optional(Schema.String),
  /** Policy skips (skip/fallback) still satisfy dependents; inactive skips propagate. */
  skipCause: Schema.optional(Schema.Union([Schema.Literal('inactive'), Schema.Literal('policy')])),
  iteration: Schema.optional(Schema.Struct({ index: Schema.Finite, previous: Schema.Json })),
})
export type NodeState = Schema.Schema.Type<typeof NodeStateSchema>

export interface WorkflowChild {
  readonly kind: string
  readonly name: string
  readonly version?: string
}

export interface WorkflowIteration {
  /** Zero-based index of the loop iteration about to run. */
  readonly index: number
  /** Output of the previous iteration's child. */
  readonly previous: JsonValue
}

export interface WorkflowNodeContext<TInput = JsonValue> {
  readonly threadId: string
  readonly nodeId: string
  readonly input: TInput
  readonly results: { [nodeId: string]: JsonValue | null }
  /** Set when a `loop` node is re-run after one of its iterations completed. */
  readonly iteration: WorkflowIteration | undefined
  spawn(child: WorkflowChild, input: JsonValue): NodeResult
  sleep(ms: number): NodeResult
  effects(effects: RuntimeEffect[]): NodeResult
  /** Run one child per item, one at a time, and finish with the ordered outputs. */
  map(child: WorkflowChild, items: readonly JsonValue[]): NodeResult
  /** Run one child per item with bounded concurrency and finish with the ordered outputs. */
  fanout(child: WorkflowChild, items: readonly JsonValue[], concurrency?: number): NodeResult
  /**
   * Run one child iteration, then re-run this node with `ctx.iteration`. Returning a value
   * instead ends the loop; reaching `maxIterations` ends it with the last iteration's output.
   */
  loop(child: WorkflowChild, input: JsonValue, options: { maxIterations: number }): NodeResult
}

export type NodeResult =
  | { type: 'value'; value: JsonValue }
  | {
      type: 'spawn'
      kind: string
      name: string
      version: string
      input: JsonValue
      childThreadId?: string
    }
  | { type: 'sleep'; ms: number }
  | { type: 'effects'; effects: RuntimeEffect[] }
  | { type: 'switch'; branch: string; value?: JsonValue }
  | {
      type: 'map'
      kind: string
      name: string
      version: string
      items: readonly JsonValue[]
      concurrency: number
    }
  | {
      type: 'loop'
      kind: string
      name: string
      version: string
      input: JsonValue
      maxIterations: number
    }

export type WorkflowFailurePolicy =
  | { readonly type: 'fail' }
  | { readonly type: 'skip' }
  | { readonly type: 'retry'; readonly maxAttempts: number }
  | { readonly type: 'fallback'; readonly nodeId: string }

export interface WorkflowNodeDefinition<TInput = JsonValue> {
  id: string
  deps?: string[]
  type?: 'task' | 'switch' | 'workflow'
  failure?: WorkflowFailurePolicy
  run(ctx: WorkflowNodeContext<TInput>): Promise<JsonValue | NodeResult> | JsonValue | NodeResult
}

export interface WorkflowDefinition<
  TName extends string = string,
  TInput = JsonValue,
  TOutput extends JsonValue = JsonValue,
> {
  readonly kind: 'workflow'
  readonly name: TName
  readonly version: string
  readonly description?: string
  readonly input?: StandardSchemaV1<any, TInput> | Schema.ConstraintDecoder<TInput>
  readonly nodes: WorkflowNodeDefinition<TInput>[]
  readonly edges?: readonly WorkflowEdge[]
  readonly concurrency?: number
  readonly inputLimitBytes?: number
  readonly outputLimitBytes?: number
  readonly checkpointLimitBytes?: number
  output?(ctx: { input: TInput; results: { [nodeId: string]: JsonValue | null } }): TOutput
}

export type AnyWorkflowDefinition = WorkflowDefinition

function compatibleNodeStatus(status: string | undefined): NodeStatus {
  switch (status) {
    case 'pending':
    case 'running':
    case 'completed':
    case 'failed':
    case 'skipped':
      return status
    default:
      return 'pending'
  }
}

export function defineWorkflow<
  TName extends string,
  TInput = JsonValue,
  TOutput extends JsonValue = JsonValue,
>(
  def: Omit<WorkflowDefinition<TName, TInput, TOutput>, 'kind' | 'version'> & {
    readonly version?: string
  },
): WorkflowDefinition<TName, TInput, TOutput> {
  const definition = {
    kind: 'workflow' as const,
    ...def,
    version: def.version ?? DEFAULT_DEFINITION_VERSION,
    concurrency: resolveGraphConcurrency(def.concurrency),
  }

  topologicalSort(definition.nodes, workflowEdges(definition))

  for (const node of definition.nodes) {
    const failure = node.failure

    if (
      failure?.type === 'retry' &&
      (!Number.isInteger(failure.maxAttempts) ||
        failure.maxAttempts < 1 ||
        failure.maxAttempts > 64)
    ) {
      throw new Error(`Node "${node.id}" retry maxAttempts must be between 1 and 64`)
    }

    if (
      failure?.type === 'fallback' &&
      !definition.nodes.some((candidate) => candidate.id === failure.nodeId)
    ) {
      throw new Error(`Node "${node.id}" references unknown fallback "${failure.nodeId}"`)
    }
  }

  return definition
}

export function readyNodes(
  workflow: WorkflowDefinition,
  nodeStates: { [nodeId: string]: { status: string } },
): string[] {
  const states: Record<string, NodeState> = {}

  for (const node of workflow.nodes) {
    const state = nodeStates[node.id]

    states[node.id] = {
      status: compatibleNodeStatus(state?.status),
      result: null,
      error: null,
    }
  }

  return getReadyNodeIds(workflow, states)
}

function childRef(child: WorkflowChild) {
  return {
    kind: child.kind,
    name: child.name,
    version: child.version ?? DEFAULT_DEFINITION_VERSION,
  }
}

function iterations(
  child: WorkflowChild,
  items: readonly JsonValue[],
  concurrency: number,
): NodeResult {
  return {
    type: 'map',
    ...childRef(child),
    items,
    concurrency: resolveGraphConcurrency(concurrency),
  }
}

/** Builds the helpers a node's `run` uses to describe durable work. */
export function nodeResultBuilders(): Pick<
  WorkflowNodeContext,
  'spawn' | 'sleep' | 'effects' | 'map' | 'fanout' | 'loop'
> {
  return {
    spawn: (child, input) => ({ type: 'spawn', ...childRef(child), input }),
    sleep: (ms) => ({ type: 'sleep', ms }),
    effects: (effects) => ({ type: 'effects', effects }),
    map: (child, items) => iterations(child, items, 1),
    fanout: (child, items, concurrency = DEFAULT_GRAPH_CONCURRENCY) =>
      iterations(child, items, concurrency),
    loop: (child, input, { maxIterations }) => {
      if (!Number.isInteger(maxIterations) || maxIterations < 0) {
        throw new Error('loop maxIterations must be a non-negative integer')
      }

      return { type: 'loop', ...childRef(child), input, maxIterations }
    },
  }
}
