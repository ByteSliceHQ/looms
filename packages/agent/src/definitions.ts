import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { Schema } from 'effect'

import {
  DEFAULT_DEFINITION_VERSION,
  type JsonValue,
  type RuntimeEffect,
  type SchemaInput,
} from '@looms/core'

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
  readonly input?: StandardSchemaV1<any, TInput> | Schema.ConstraintDecoder<TInput>
  handler(input: TInput, ctx: ToolContext): Promise<TOutput> | TOutput
}

export interface ThreadTool {
  readonly kind: 'thread'
  readonly name: string
  readonly description: string
  readonly input?: SchemaInput
  readonly childKind: string
  readonly childName: string
  readonly childVersion: string
  readonly child: { kind: string; name: string; version?: string }
  mapInput?(input: JsonValue): JsonValue
}

export interface EffectsTool {
  readonly kind: 'effects'
  readonly name: string
  readonly description: string
  readonly input?: SchemaInput
  effects(input: JsonValue): RuntimeEffect[]
  waitOn?: { type: string | readonly string[]; match?: JsonValue }
}

export type ToolLike = FunctionTool | ThreadTool | EffectsTool

export type AgentToolEntry =
  | ToolLike
  | {
      kind: string
      name: string
      version?: string
      instructions?: string
      description?: string
      input?: SchemaInput
    }

export interface AgentTurnContext<TInput = JsonValue> {
  readonly threadId: string
  readonly turn: number
  readonly messages: Message[]
  readonly input: TInput
  readonly tools: ToolLike[]
  readonly instructions: string
  readonly signal?: AbortSignal
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
  readonly version: string
  readonly description?: string
  readonly model?: string
  readonly instructions: string
  readonly input?: StandardSchemaV1<any, TInput> | Schema.ConstraintDecoder<TInput>
  readonly tools?: ToolLike[]
  readonly maxTurns?: number
  readonly conversational?: boolean
  readonly stopWhen?: StopWhen
  runTurn?(
    ctx: AgentTurnContext<TInput>,
  ): Promise<AgentTurnResult<TOutput>> | AgentTurnResult<TOutput>
}

export type AnyAgentDefinition = AgentDefinition

export interface AgentSessionDefinition<TName extends string = string> {
  readonly kind: 'agent-session'
  readonly name: TName
  readonly version: string
  readonly description?: string
  /** The agent definition is pinned when the session definition is created. */
  readonly agent: Pick<AgentDefinition, 'kind' | 'name' | 'version'>
  /** Max idle milliseconds before parking. Zero waits indefinitely. */
  readonly idleTimeoutMs: number
}

export function defineAgentSession<TName extends string>(def: {
  readonly name: TName
  readonly description?: string
  readonly agent: Pick<AgentDefinition, 'kind' | 'name' | 'version'>
  readonly version?: string
  readonly idleTimeoutMs?: number
}): AgentSessionDefinition<TName> {
  const definition = {
    kind: 'agent-session' as const,
    name: def.name,
    version: def.version ?? DEFAULT_DEFINITION_VERSION,
    agent: {
      kind: 'agent' as const,
      name: def.agent.name,
      version: def.agent.version,
    },
    idleTimeoutMs: Math.max(0, def.idleTimeoutMs ?? 0),
  }

  if (def.description === undefined) {
    return definition
  }

  return { ...definition, description: def.description }
}

export function normalizeTools(tools: ReadonlyArray<AgentToolEntry> = []): ToolLike[] {
  return tools.map((entry) => {
    if (entry.kind === 'function' && 'handler' in entry) {
      return entry
    }

    if (entry.kind === 'thread' && 'child' in entry) {
      return entry
    }

    if (entry.kind === 'effects' && 'effects' in entry) {
      return entry
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
  TInput = JsonValue,
  TOutput extends JsonValue = JsonValue,
>(def: Omit<FunctionTool<TName, TInput, TOutput>, 'kind'>): FunctionTool<TName, TInput, TOutput> {
  return { kind: 'function', ...def }
}

export function defineAgent<
  TName extends string,
  TInput = JsonValue,
  TOutput extends JsonValue = JsonValue,
>(
  def: Omit<AgentDefinition<TName, TInput, TOutput>, 'kind' | 'version' | 'tools'> & {
    readonly version?: string
    readonly tools?: AgentToolEntry[]
  },
): AgentDefinition<TName, TInput, TOutput> {
  return {
    kind: 'agent',
    ...def,
    version: def.version ?? DEFAULT_DEFINITION_VERSION,
    tools: def.tools ? normalizeTools(def.tools) : undefined,
  }
}

export function asThreadTool(def: {
  name?: string
  description?: string
  input?: SchemaInput
  child: { kind: string; name: string; version?: string }
  mapInput?: (input: JsonValue) => JsonValue
}): ThreadTool {
  return {
    kind: 'thread',
    name: def.name ?? def.child.name,
    description: def.description ?? def.child.name,
    input: def.input,
    childKind: def.child.kind,
    childName: def.child.name,
    childVersion: def.child.version ?? DEFAULT_DEFINITION_VERSION,
    child: def.child,
    mapInput: def.mapInput,
  }
}

export function asAgentTool(def: {
  name?: string
  description?: string
  input?: SchemaInput
  agent: {
    kind: 'agent'
    name: string
    version?: string
    instructions?: string
    input?: SchemaInput
  }
  mapInput?: (input: JsonValue) => JsonValue
}): ThreadTool {
  return asThreadTool({
    name: def.name,
    description: def.description ?? def.agent.instructions,
    input: def.input ?? def.agent.input,
    child: { kind: 'agent', name: def.agent.name, version: def.agent.version },
    mapInput: def.mapInput,
  })
}

type EvaluatorToolTarget = {
  kind: 'evaluator'
  name: string
  description?: string
  input?: SchemaInput
}

export function asEvaluatorTool(def: {
  name?: string
  description?: string
  input?: SchemaInput
  evaluator: EvaluatorToolTarget
  mapInput?: (input: JsonValue) => JsonValue
}): ThreadTool {
  return asThreadTool({
    name: def.name,
    description: def.description ?? def.evaluator.description,
    input: def.input ?? def.evaluator.input,
    child: { kind: 'evaluator', name: def.evaluator.name },
    mapInput: def.mapInput,
  })
}

export function asWorkflowTool(def: {
  name?: string
  description?: string
  input?: SchemaInput
  workflow: {
    kind: 'workflow'
    name: string
    version?: string
    description?: string
    input?: SchemaInput
  }
  mapInput?: (input: JsonValue) => JsonValue
}): ThreadTool {
  return asThreadTool({
    name: def.name,
    description: def.description ?? def.workflow.description,
    input: def.input ?? def.workflow.input,
    child: { kind: 'workflow', name: def.workflow.name, version: def.workflow.version },
    mapInput: def.mapInput,
  })
}

export function asEffectsTool(def: {
  name: string
  description: string
  input?: SchemaInput
  effects: (input: JsonValue) => RuntimeEffect[]
  waitOn?: { type: string | readonly string[]; match?: JsonValue }
}): EffectsTool {
  return {
    kind: 'effects',
    name: def.name,
    description: def.description,
    input: def.input,
    effects: def.effects,
    waitOn: def.waitOn,
  }
}
