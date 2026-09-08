import type { StandardSchemaV1 } from '@standard-schema/spec'
import { Schema } from 'effect'
import type { JsonValue } from './types'
import { normalizeTools, type AgentToolEntry, type ToolLike } from './definitions'

export interface LlmToolSpec {
  readonly name: string
  readonly description: string
  readonly inputJsonSchema: JsonValue
}

interface StandardJsonSchemaConverter {
  readonly input: (options: { target: string }) => JsonValue
}

interface StandardJsonSchemaProps {
  readonly jsonSchema?: {
    readonly input?: StandardJsonSchemaConverter['input']
  }
}

interface StandardJsonSchemaHolder {
  readonly '~standard': StandardJsonSchemaProps
}

type SchemaCandidate =
  | StandardSchemaV1<unknown, unknown>
  | StandardJsonSchemaHolder
  | Schema.Codec<any, any, never, never>

const EMPTY_OBJECT_SCHEMA: JsonValue = { type: 'object' }

function isStandardJsonSchemaHolder(value: SchemaCandidate): value is StandardJsonSchemaHolder {
  return '~standard' in value
}

function fromStandardJsonSchema(schema: SchemaCandidate): JsonValue | undefined {
  if (!isStandardJsonSchemaHolder(schema)) return undefined
  const input = schema['~standard'].jsonSchema?.input
  if (!input) return undefined
  try {
    return input({ target: 'draft-2020-12' })
  } catch {
    return undefined
  }
}

function fromEffectSchema(schema: SchemaCandidate): JsonValue | undefined {
  if (!Schema.isSchema(schema)) return undefined
  try {
    // SAFETY: Effect Schema converts to StandardJSONSchemaV1 via official helper.
    const standard = Schema.toStandardJSONSchemaV1(schema as Schema.Codec<any, any, never, never>)
    return fromStandardJsonSchema(standard)
  } catch {
    return undefined
  }
}

function fromInputCandidate(input: SchemaCandidate | undefined): JsonValue | undefined {
  if (!input) return undefined
  return fromStandardJsonSchema(input) ?? fromEffectSchema(input)
}

function toolInputCandidate(tool: ToolLike): SchemaCandidate | undefined {
  switch (tool.kind) {
    case 'function':
      return tool.input
    case 'agent-tool':
      return tool.agent.input
    case 'workflow-tool':
      return tool.workflow.input
    default: {
      const _exhaustive: never = tool
      return _exhaustive
    }
  }
}

function explicitInputSchema(tool: ToolLike): JsonValue | undefined {
  if (tool.inputSchema === undefined || tool.inputSchema === null) return undefined
  return tool.inputSchema
}

/** Derive a JSON Schema object for an LLM tool definition. */
export function toolJsonSchema(tool: ToolLike): JsonValue {
  return (
    explicitInputSchema(tool) ??
    fromInputCandidate(toolInputCandidate(tool)) ??
    EMPTY_OBJECT_SCHEMA
  )
}

export function toolSpecs(tools: ReadonlyArray<AgentToolEntry> = []): LlmToolSpec[] {
  return normalizeTools(tools).map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputJsonSchema: toolJsonSchema(tool),
  }))
}

/** Used by tests / callers that already hold a Standard Schema candidate. */
export function jsonSchemaFromStandard(schema: SchemaCandidate | null | undefined): JsonValue {
  return fromInputCandidate(schema ?? undefined) ?? EMPTY_OBJECT_SCHEMA
}
