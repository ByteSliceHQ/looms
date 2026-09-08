import type { StandardSchemaV1 } from '@standard-schema/spec'
import { Predicate, Schema } from 'effect'
import type { StopWhen } from './stop-when'
import type { JsonValue, Message, ToolCall } from './types'

export class InvalidInputError extends Error {
  readonly _tag = 'InvalidInputError'
  readonly issues: ReadonlyArray<StandardSchemaV1.Issue>
  constructor(message: string, issues: ReadonlyArray<StandardSchemaV1.Issue> = []) {
    super(message)
    this.name = 'InvalidInputError'
    this.issues = issues
  }
}

type SchemaCandidate<TInput> =
  | StandardSchemaV1<unknown, TInput>
  | Schema.Schema<any>
  | { input?: StandardSchemaV1<unknown, TInput> | Schema.Schema<any> }
  | null
  | undefined

function toStandard<TInput>(candidate: SchemaCandidate<TInput>): StandardSchemaV1<unknown, TInput> | undefined {
  if (!candidate) {
    return undefined
  }
  if (Schema.isSchema(candidate)) {
    // SAFETY: Effect Schema converts to StandardSchemaV1 via official helper.
    return Schema.toStandardSchemaV1(candidate as Schema.Codec<any, any, never, never>) as any
  }
  if (Predicate.isObject(candidate) && '~standard' in candidate) {
    // SAFETY: verified '~standard' property exists on object.
    return candidate as any
  }
  return undefined
}

function extractSchema<TInput>(
  schemaOrDef: SchemaCandidate<TInput>,
): StandardSchemaV1<unknown, TInput> | undefined {
  const direct = toStandard<TInput>(schemaOrDef)
  if (direct) return direct
  if (schemaOrDef && Predicate.isObject(schemaOrDef) && 'input' in schemaOrDef) {
    // SAFETY: Verified schemaOrDef has 'input' property.
    return toStandard<TInput>((schemaOrDef as { input?: SchemaCandidate<TInput> }).input)
  }
  return undefined
}

function formatIssue(issue: StandardSchemaV1.Issue): string {
  if (!issue.path || issue.path.length === 0) {
    return issue.message
  }
  const pathStr = issue.path
    .map((p) => {
      if (Predicate.isReadonlyObject(p) && 'key' in p) {
        return String(p.key)
      }
      if (Predicate.isString(p) || Predicate.isNumber(p)) {
        return String(p)
      }
      return ''
    })
    .filter((s) => s.length > 0)
    .join('.')
  return `${pathStr}: ${issue.message}`
}

export async function validateInput<TInput = unknown>(
  schemaOrDef:
    | StandardSchemaV1<unknown, TInput>
    | { input?: StandardSchemaV1<unknown, TInput> }
    | undefined,
  raw: JsonValue,
): Promise<TInput> {
  const schema = extractSchema(schemaOrDef)
  if (!schema) {
    // SAFETY: when no schema is provided, raw JsonValue is accepted as TInput.
    return raw as TInput
  }
  // SAFETY: StandardSchemaV1.validate returns Result<TInput> or Promise<Result<TInput>>.
  let result = schema['~standard'].validate(raw) as
    | StandardSchemaV1.Result<TInput>
    | Promise<StandardSchemaV1.Result<TInput>>
  if (result instanceof Promise) {
    result = await result
  }
  if (result.issues !== undefined) {
    const msg = result.issues.map(formatIssue).join(', ')
    throw new InvalidInputError(`Invalid input: ${msg}`, result.issues)
  }
  // SAFETY: When result.issues is undefined, result is SuccessResult.
  return (result as StandardSchemaV1.SuccessResult<TInput>).value
}

export function validateInputSync<TInput = unknown>(
  schemaOrDef:
    | StandardSchemaV1<unknown, TInput>
    | { input?: StandardSchemaV1<unknown, TInput> }
    | undefined,
  raw: JsonValue,
): TInput {
  const schema = extractSchema(schemaOrDef)
  if (!schema) {
    // SAFETY: when no schema is provided, raw JsonValue is accepted as TInput.
    return raw as TInput
  }
  // SAFETY: StandardSchemaV1.validate returns Result<TInput> or Promise<Result<TInput>>.
  const result = schema['~standard'].validate(raw) as
    | StandardSchemaV1.Result<TInput>
    | Promise<StandardSchemaV1.Result<TInput>>
  if (result instanceof Promise) {
    throw new Error('Async schema validation is not supported in synchronous context')
  }
  if (result.issues !== undefined) {
    const msg = result.issues.map(formatIssue).join(', ')
    throw new InvalidInputError(`Invalid input: ${msg}`, result.issues)
  }
  // SAFETY: When result.issues is undefined, result is SuccessResult.
  return (result as StandardSchemaV1.SuccessResult<TInput>).value
}

export interface ToolContext {
  readonly actorId: string
  readonly turn: number
  readonly signal?: AbortSignal
}

export interface ToolDefinition<
  TName extends string = string,
  TInput = JsonValue,
  TOutput extends JsonValue = JsonValue,
> {
  readonly kind: 'function'
  readonly name: TName
  readonly description: string
  readonly input?: StandardSchemaV1<unknown, TInput>
  /** Lightweight JSON Schema for tool arguments (optional validation). */
  readonly inputSchema?: JsonValue
  handler(input: TInput, ctx: ToolContext): Promise<TOutput> | TOutput
}

export interface AgentTurnContext<TInput = JsonValue> {
  readonly actorId: string
  readonly turn: number
  readonly messages: Message[]
  readonly input: TInput
  readonly tools: ToolLike[]
  readonly instructions: string
}

export interface AgentTurnResult<TOutput extends JsonValue = JsonValue> {
  message: Message
  toolCalls?: ToolCall[]
  /** When true, host finalizes the actor with `output`. */
  done?: boolean
  output?: TOutput
}

export interface AgentDefinition<
  TName extends string = string,
  TInput = JsonValue,
  TOutput extends JsonValue = JsonValue,
> {
  readonly kind: 'agent'
  readonly name: TName
  readonly model?: string
  readonly instructions: string
  readonly input?: StandardSchemaV1<unknown, TInput>
  readonly tools?: AgentToolEntry[]
  /** Max LLM turns before the actor fails. Default 20. */
  readonly maxTurns?: number
  /**
   * When true, a text reply without tool calls leaves the actor running
   * (waiting for the next user message) instead of completing.
   */
  readonly conversational?: boolean
  /**
   * Evaluated after each model response. When true, requested tool calls are
   * dropped and task agents complete (conversational agents just finish the turn).
   */
  readonly stopWhen?: StopWhen
  /**
   * Deterministic runner for tests / offline mode.
   * If omitted, the host uses the Llm service.
   */
  runTurn?(ctx: AgentTurnContext<TInput>): Promise<AgentTurnResult<TOutput>> | AgentTurnResult<TOutput>
}

export interface WorkflowNodeContext<TInput = JsonValue> {
  readonly actorId: string
  readonly nodeId: string
  readonly input: TInput
  readonly results: Record<string, JsonValue | null>
  readonly signal?: AbortSignal
  requestReview(request: {
    title: string
    description?: string
    schema?: JsonValue
    actions?: Array<{ id: string; label: string; outcome: 'approve' | 'reject' }>
  }): { type: 'review'; review: Omit<Parameters<WorkflowNodeContext['requestReview']>[0], never> }
  spawnAgent<TChildInput>(
    agent: AgentDefinition<string, TChildInput, any>,
    input: TChildInput,
  ): { type: 'spawn_agent'; agent: AnyAgentDefinition; input: JsonValue }
  spawnWorkflow<TChildInput>(
    workflow: WorkflowDefinition<string, TChildInput, any>,
    input: TChildInput,
  ): { type: 'spawn_workflow'; workflow: AnyWorkflowDefinition; input: JsonValue }
}

export type NodeResult =
  | { type: 'value'; value: JsonValue }
  | {
      type: 'review'
      review: {
        title: string
        description?: string
        schema?: JsonValue
        actions?: Array<{ id: string; label: string; outcome: 'approve' | 'reject' }>
      }
    }
  | { type: 'wait'; ms: number }
  | { type: 'spawn_agent'; agent: AnyAgentDefinition; input: JsonValue }
  | { type: 'spawn_workflow'; workflow: AnyWorkflowDefinition; input: JsonValue }

export interface WorkflowNodeDefinition<TInput = JsonValue> {
  id: string
  /** Node ids that must complete before this node runs. */
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
  readonly input?: StandardSchemaV1<unknown, TInput>
  readonly nodes: WorkflowNodeDefinition<TInput>[]
  readonly concurrency?: number
  output?(ctx: {
    input: TInput
    results: Record<string, JsonValue | null>
  }): TOutput
}

export interface AgentToolDefinition<TChildInput = JsonValue> {
  readonly kind: 'agent-tool'
  readonly name: string
  readonly description: string
  readonly inputSchema?: JsonValue
  readonly agent: AnyAgentDefinition
  mapInput?(input: JsonValue): TChildInput
}

export interface WorkflowToolDefinition<TChildInput = JsonValue> {
  readonly kind: 'workflow-tool'
  readonly name: string
  readonly description: string
  readonly inputSchema?: JsonValue
  readonly workflow: AnyWorkflowDefinition
  mapInput?(input: JsonValue): TChildInput
}

export type ToolLike =
  | ToolDefinition<string, any, any>
  | AgentToolDefinition<any>
  | WorkflowToolDefinition<any>

export type AgentToolEntry = ToolLike | AnyAgentDefinition | AnyWorkflowDefinition

export type AnyAgentDefinition = AgentDefinition<string, any, any>
export type AnyWorkflowDefinition = WorkflowDefinition<string, any, any>
export type AnyToolDefinition = ToolDefinition<string, any, any>
export type AnyDefinition = AnyAgentDefinition | AnyWorkflowDefinition

export function normalizeTools(tools: ReadonlyArray<AgentToolEntry> = []): ToolLike[] {
  return tools.map((entry) => {
    if (entry.kind === 'function' || entry.kind === 'agent-tool' || entry.kind === 'workflow-tool') {
      return entry
    }
    if (entry.kind === 'agent') {
      return asAgentTool({ agent: entry })
    }
    if (entry.kind === 'workflow') {
      return asWorkflowTool({ workflow: entry })
    }
    const _exhaustive: never = entry
    return _exhaustive
  })
}

export async function validateDefinitionInput(
  def: AnyDefinition | undefined,
  raw: JsonValue,
): Promise<JsonValue> {
  if (!def || !('input' in def) || !def.input) {
    return raw
  }
  // SAFETY: validated input conforming to definition schema is JsonValue compatible.
  return (await validateInput(def.input, raw)) as JsonValue
}

export function defineTool<
  TName extends string,
  TSchema extends StandardSchemaV1<unknown, any> | undefined = undefined,
  TInput = TSchema extends StandardSchemaV1<unknown, infer TOut> ? TOut : JsonValue,
  TOutput extends JsonValue = JsonValue,
>(def: {
  name: TName
  description: string
  input?: TSchema
  inputSchema?: JsonValue
  handler: (input: TInput, ctx: ToolContext) => Promise<TOutput> | TOutput
}): ToolDefinition<TName, TInput, TOutput> {
  // SAFETY: tool fields are validated by the factory interface.
  return { kind: 'function', ...def } as ToolDefinition<TName, TInput, TOutput>
}

export function defineAgent<
  TName extends string,
  TSchema extends StandardSchemaV1<unknown, any> | undefined = undefined,
  TInput = TSchema extends StandardSchemaV1<unknown, infer TOut> ? TOut : JsonValue,
  TOutput extends JsonValue = JsonValue,
>(def: {
  name: TName
  model?: string
  instructions: string
  input?: TSchema
  tools?: AgentToolEntry[]
  maxTurns?: number
  conversational?: boolean
  stopWhen?: StopWhen
  runTurn?: (
    ctx: AgentTurnContext<TInput>,
  ) => Promise<AgentTurnResult<TOutput>> | AgentTurnResult<TOutput>
}): AgentDefinition<TName, TInput, TOutput> {
  // SAFETY: agent definition fields are validated by the factory interface.
  return {
    kind: 'agent',
    ...def,
    tools: def.tools ? normalizeTools(def.tools) : undefined,
  } as AgentDefinition<TName, TInput, TOutput>
}

export function defineWorkflow<
  TName extends string,
  TSchema extends StandardSchemaV1<unknown, any> | undefined = undefined,
  TInput = TSchema extends StandardSchemaV1<unknown, infer TOut> ? TOut : JsonValue,
  TOutput extends JsonValue = JsonValue,
>(def: {
  name: TName
  description?: string
  input?: TSchema
  nodes: Array<{
    id: string
    deps?: string[]
    run: (
      ctx: WorkflowNodeContext<TInput>,
    ) => Promise<JsonValue | NodeResult> | JsonValue | NodeResult
  }>
  concurrency?: number
  output?: (ctx: { input: TInput; results: Record<string, JsonValue | null> }) => TOutput
}): WorkflowDefinition<TName, TInput, TOutput> {
  // SAFETY: workflow definition fields are validated by the factory interface.
  return { kind: 'workflow', ...def } as WorkflowDefinition<TName, TInput, TOutput>
}

export function asAgentTool<TChildInput = JsonValue>(def: {
  name?: string
  description?: string
  inputSchema?: JsonValue
  agent: AgentDefinition<string, TChildInput, any>
  mapInput?: (input: JsonValue) => TChildInput
}): AgentToolDefinition<TChildInput> {
  // SAFETY: agent tool fields are validated by the factory interface.
  return {
    kind: 'agent-tool',
    name: def.name ?? def.agent.name,
    description: def.description ?? def.agent.instructions,
    inputSchema: def.inputSchema,
    agent: def.agent,
    mapInput: def.mapInput,
  } as AgentToolDefinition<TChildInput>
}

export function asWorkflowTool<TChildInput = JsonValue>(def: {
  name?: string
  description?: string
  inputSchema?: JsonValue
  workflow: WorkflowDefinition<string, TChildInput, any>
  mapInput?: (input: JsonValue) => TChildInput
}): WorkflowToolDefinition<TChildInput> {
  // SAFETY: workflow tool fields are validated by the factory interface.
  return {
    kind: 'workflow-tool',
    name: def.name ?? def.workflow.name,
    description: def.description ?? def.workflow.description ?? def.workflow.name,
    inputSchema: def.inputSchema,
    workflow: def.workflow,
    mapInput: def.mapInput,
  } as WorkflowToolDefinition<TChildInput>
}

export function readyNodes(
  workflow: WorkflowDefinition<string, any, any>,
  nodeStates: Record<string, { status: string }>,
): string[] {
  return workflow.nodes
    .filter((node) => {
      const state = nodeStates[node.id]
      if (!state || state.status !== 'pending') return false
      const deps = node.deps ?? []
      return deps.every((depId) => {
        const dep = nodeStates[depId]
        return dep?.status === 'completed' || dep?.status === 'skipped'
      })
    })
    .map((node) => node.id)
}
