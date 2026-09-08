import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { JsonValue, RuntimeEffect } from '@looms/core'

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
  readonly input?: StandardSchemaV1<JsonValue, TInput>
  readonly nodes: WorkflowNodeDefinition<TInput>[]
  readonly concurrency?: number
  output?(ctx: { input: TInput; results: { [nodeId: string]: JsonValue | null } }): TOutput
}

export type AnyWorkflowDefinition = WorkflowDefinition<string, JsonValue, JsonValue>

export function defineWorkflow<
  TName extends string,
  TSchema extends StandardSchemaV1<JsonValue, JsonValue> | undefined = undefined,
  TInput = TSchema extends StandardSchemaV1<JsonValue, infer TOut> ? TOut : JsonValue,
  TOutput extends JsonValue = JsonValue,
>(def: {
  name: TName
  description?: string
  input?: TSchema
  nodes: Array<{
    id: string
    deps?: string[]
    run: (ctx: WorkflowNodeContext<TInput>) => Promise<JsonValue | NodeResult> | JsonValue | NodeResult
  }>
  concurrency?: number
  output?: (ctx: { input: TInput; results: { [nodeId: string]: JsonValue | null } }) => TOutput
}): WorkflowDefinition<TName, TInput, TOutput> {
  // SAFETY: factory fields match WorkflowDefinition.
  return { kind: 'workflow', ...def } as WorkflowDefinition<TName, TInput, TOutput>
}

export function readyNodes(
  workflow: WorkflowDefinition,
  nodeStates: { [nodeId: string]: { status: string } },
): string[] {
  return workflow.nodes
    .filter((node) => {
      const state = nodeStates[node.id]
      if (state && state.status !== 'pending') return false
      const deps = node.deps ?? []
      return deps.every((depId) => {
        const dep = nodeStates[depId]
        return dep?.status === 'completed' || dep?.status === 'skipped'
      })
    })
    .map((node) => node.id)
}
