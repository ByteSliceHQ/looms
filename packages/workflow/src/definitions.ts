import type { StandardSchemaV1 } from '@standard-schema/spec'
import { Schema } from 'effect'

import type { JsonValue, RuntimeEffect } from '@looms/core'

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

export interface WorkflowNodeContext<TInput = JsonValue> {
  readonly threadId: string
  readonly nodeId: string
  readonly input: TInput
  readonly results: { [nodeId: string]: JsonValue | null }
  spawn(child: { kind: string; name: string }, input: JsonValue): NodeResult
  sleep(ms: number): NodeResult
  effects(effects: RuntimeEffect[]): NodeResult
}

export type NodeResult =
  | { type: 'value'; value: JsonValue }
  | { type: 'spawn'; kind: string; name: string; input: JsonValue }
  | { type: 'sleep'; ms: number }
  | { type: 'effects'; effects: RuntimeEffect[] }

export interface WorkflowNodeDefinition<TInput = JsonValue> {
  id: string
  deps?: string[]
  run(ctx: WorkflowNodeContext<TInput>): Promise<JsonValue | NodeResult> | JsonValue | NodeResult
}

export interface WorkflowDefinition<
  TName extends string = string,
  TInput = JsonValue,
  TOutput extends JsonValue = JsonValue,
> {
  readonly kind: 'workflow'
  readonly name: TName
  readonly description?: string
  readonly input?: StandardSchemaV1<any, TInput> | Schema.ConstraintDecoder<TInput>
  readonly nodes: WorkflowNodeDefinition<TInput>[]
  readonly concurrency?: number
  output?(ctx: { input: TInput; results: { [nodeId: string]: JsonValue | null } }): TOutput
}

export type AnyWorkflowDefinition = WorkflowDefinition

export function defineWorkflow<
  TName extends string,
  TInput = JsonValue,
  TOutput extends JsonValue = JsonValue,
>(
  def: Omit<WorkflowDefinition<TName, TInput, TOutput>, 'kind'>,
): WorkflowDefinition<TName, TInput, TOutput> {
  return { kind: 'workflow', ...def }
}

export function readyNodes(
  workflow: WorkflowDefinition,
  nodeStates: { [nodeId: string]: { status: string } },
): string[] {
  return workflow.nodes
    .filter((node) => {
      const state = nodeStates[node.id]

      if (state && state.status !== 'pending') {
        return false
      }

      const deps = node.deps ?? []
      return deps.every((depId) => {
        const dep = nodeStates[depId]
        return dep?.status === 'completed' || dep?.status === 'skipped'
      })
    })
    .map((node) => node.id)
}
