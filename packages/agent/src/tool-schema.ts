import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { JsonValue } from '@looms/core'
import { Schema } from 'effect'
import { normalizeTools, type AgentToolEntry, type ToolLike } from './definitions'
import type { LlmToolSpec } from './llm'

interface StandardJsonSchemaConverter {
  readonly input: (options: { target: string }) => JsonValue
}

interface StandardJsonSchemaHolder {
  readonly '~standard': {
    readonly jsonSchema?: {
      readonly input?: StandardJsonSchemaConverter['input']
    }
  }
}

type SchemaCandidate = StandardSchemaV1<JsonValue, JsonValue> | StandardJsonSchemaHolder | Schema.Codec<JsonValue>

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
    // SAFETY: Effect Schema values used as tool input codecs produce Standard JSON Schema.
    const standard = Schema.toStandardJSONSchemaV1(schema as Schema.Codec<JsonValue, JsonValue, never, never>)
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
    case 'thread':
      return tool.input
    case 'effects':
      return undefined
    default: {
      const exhaustiveCheck: never = tool
      return exhaustiveCheck
    }
  }
}

export function toolJsonSchema(tool: ToolLike): JsonValue {
  return tool.inputSchema ?? fromInputCandidate(toolInputCandidate(tool)) ?? EMPTY_OBJECT_SCHEMA
}

export function toolSpecs(tools: ReadonlyArray<AgentToolEntry> = []): LlmToolSpec[] {
  return normalizeTools(tools).map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputJsonSchema: toolJsonSchema(tool),
  }))
}

export function jsonSchemaFromStandard(schema: SchemaCandidate | null | undefined): JsonValue {
  return fromInputCandidate(schema ?? undefined) ?? EMPTY_OBJECT_SCHEMA
}
