import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { JsonValue, RuntimeEffect } from '@looms/core'
import type { StopWhen } from './stop-when'
import type { Message, ToolCall } from './types'

export interface ToolContext {
  readonly threadId: string
  readonly turn: number
  readonly signal?: AbortSignal
}

export interface FunctionTool<
  TName extends string = string,
  TInput = JsonValue,
  TOutput extends JsonValue = JsonValue,
> {
  readonly kind: 'function'
  readonly name: TName
  readonly description: string
  readonly input?: StandardSchemaV1<JsonValue, TInput>
  readonly inputSchema?: JsonValue
  handler(input: TInput, ctx: ToolContext): Promise<TOutput> | TOutput
}

export interface ThreadTool {
  readonly kind: 'thread'
  readonly name: string
  readonly description: string
  readonly input?: StandardSchemaV1<JsonValue, JsonValue>
  readonly inputSchema?: JsonValue
  readonly childKind: string
  readonly childName: string
  readonly child: { kind: string; name: string }
  mapInput?(input: JsonValue): JsonValue
}

export interface EffectsTool {
  readonly kind: 'effects'
  readonly name: string
  readonly description: string
  readonly input?: StandardSchemaV1<JsonValue, JsonValue>
  readonly inputSchema?: JsonValue
  effects(input: JsonValue): RuntimeEffect[]
  waitOn?: { type: string | readonly string[]; match?: JsonValue }
}

export type ToolLike = FunctionTool | ThreadTool | EffectsTool

export type AgentToolEntry =
  | ToolLike
  | {
      kind: string
      name: string
      instructions?: string
      description?: string
      input?: StandardSchemaV1<JsonValue, JsonValue>
    }

export interface AgentTurnContext<TInput = JsonValue> {
  readonly threadId: string
  readonly turn: number
  readonly messages: Message[]
  readonly input: TInput
  readonly tools: ToolLike[]
  readonly instructions: string
}

export interface AgentTurnResult<TOutput extends JsonValue = JsonValue> {
  message: Message
  toolCalls?: ToolCall[]
  done?: boolean
  output?: TOutput
  usage?: { input: number; output: number }
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
  readonly input?: StandardSchemaV1<JsonValue, TInput>
  readonly tools?: ToolLike[]
  readonly maxTurns?: number
  readonly conversational?: boolean
  readonly stopWhen?: StopWhen
  runTurn?(ctx: AgentTurnContext<TInput>): Promise<AgentTurnResult<TOutput>> | AgentTurnResult<TOutput>
}

export type AnyAgentDefinition = AgentDefinition<string, JsonValue, JsonValue>

export function normalizeTools(tools: ReadonlyArray<AgentToolEntry> = []): ToolLike[] {
  return tools.map((entry) => {
    if (entry.kind === 'function' || entry.kind === 'thread' || entry.kind === 'effects') {
      // SAFETY: kind discriminant matches ToolLike.
      return entry as ToolLike
    }
    return asThreadTool({
      child: { kind: entry.kind, name: entry.name },
      description:
        'instructions' in entry && entry.instructions
          ? entry.instructions
          : 'description' in entry && entry.description
            ? entry.description
            : entry.name,
      input: 'input' in entry ? entry.input : undefined,
    })
  })
}

export function defineTool<
  TName extends string,
  TSchema extends StandardSchemaV1<JsonValue, JsonValue> | undefined = undefined,
  TInput = TSchema extends StandardSchemaV1<JsonValue, infer TOut> ? TOut : JsonValue,
  TOutput extends JsonValue = JsonValue,
>(def: {
  name: TName
  description: string
  input?: TSchema
  inputSchema?: JsonValue
  handler: (input: TInput, ctx: ToolContext) => Promise<TOutput> | TOutput
}): FunctionTool<TName, TInput, TOutput> {
  // SAFETY: factory fields match FunctionTool.
  return { kind: 'function', ...def } as FunctionTool<TName, TInput, TOutput>
}

export function defineAgent<
  TName extends string,
  TSchema extends StandardSchemaV1<JsonValue, JsonValue> | undefined = undefined,
  TInput = TSchema extends StandardSchemaV1<JsonValue, infer TOut> ? TOut : JsonValue,
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
  runTurn?: (ctx: AgentTurnContext<TInput>) => Promise<AgentTurnResult<TOutput>> | AgentTurnResult<TOutput>
}): AgentDefinition<TName, TInput, TOutput> {
  // SAFETY: factory fields match AgentDefinition.
  return {
    kind: 'agent',
    ...def,
    tools: def.tools ? normalizeTools(def.tools) : undefined,
  } as AgentDefinition<TName, TInput, TOutput>
}

export function asThreadTool(def: {
  name?: string
  description?: string
  input?: StandardSchemaV1<JsonValue, JsonValue>
  inputSchema?: JsonValue
  child: { kind: string; name: string }
  mapInput?: (input: JsonValue) => JsonValue
}): ThreadTool {
  return {
    kind: 'thread',
    name: def.name ?? def.child.name,
    description: def.description ?? def.child.name,
    input: def.input,
    inputSchema: def.inputSchema,
    childKind: def.child.kind,
    childName: def.child.name,
    child: def.child,
    mapInput: def.mapInput,
  }
}

export function asAgentTool(def: {
  name?: string
  description?: string
  input?: StandardSchemaV1<JsonValue, JsonValue>
  inputSchema?: JsonValue
  agent: {
    kind: 'agent'
    name: string
    instructions?: string
    input?: StandardSchemaV1<JsonValue, unknown>
    inputSchema?: JsonValue
  }
  mapInput?: (input: JsonValue) => JsonValue
}): ThreadTool {
  // SAFETY: Agent input schema accepts JsonValue.
  const agentInput =
    'input' in def.agent && def.agent.input
      ? (def.agent.input as StandardSchemaV1<JsonValue, JsonValue>)
      : undefined
  return asThreadTool({
    name: def.name,
    description: def.description ?? def.agent.instructions,
    input: def.input ?? agentInput,
    inputSchema: def.inputSchema ?? def.agent.inputSchema,
    child: { kind: 'agent', name: def.agent.name },
    mapInput: def.mapInput,
  })
}

export function asWorkflowTool(def: {
  name?: string
  description?: string
  input?: StandardSchemaV1<JsonValue, JsonValue>
  inputSchema?: JsonValue
  workflow: {
    kind: 'workflow'
    name: string
    description?: string
    input?: StandardSchemaV1<JsonValue, unknown>
    inputSchema?: JsonValue
  }
  mapInput?: (input: JsonValue) => JsonValue
}): ThreadTool {
  // SAFETY: Workflow input schema accepts JsonValue.
  const workflowInput =
    'input' in def.workflow && def.workflow.input
      ? (def.workflow.input as StandardSchemaV1<JsonValue, JsonValue>)
      : undefined
  return asThreadTool({
    name: def.name,
    description: def.description ?? def.workflow.description,
    input: def.input ?? workflowInput,
    inputSchema: def.inputSchema ?? def.workflow.inputSchema,
    child: { kind: 'workflow', name: def.workflow.name },
    mapInput: def.mapInput,
  })
}

export function asEffectsTool(def: {
  name: string
  description: string
  input?: StandardSchemaV1<JsonValue, JsonValue>
  inputSchema?: JsonValue
  effects: (input: JsonValue) => RuntimeEffect[]
  waitOn?: { type: string | readonly string[]; match?: JsonValue }
}): EffectsTool {
  return {
    kind: 'effects',
    name: def.name,
    description: def.description,
    input: def.input,
    inputSchema: def.inputSchema,
    effects: def.effects,
    waitOn: def.waitOn,
  }
}
