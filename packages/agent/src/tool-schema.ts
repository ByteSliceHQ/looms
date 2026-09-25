import { jsonSchemaOfInput, type JsonValue, type SchemaInput } from '@looms/core'

import { normalizeTools, type AgentToolEntry, type ToolLike } from './definitions'
import type { LlmToolSpec } from './llm'

const EMPTY_OBJECT_SCHEMA: JsonValue = { type: 'object' }

function toolInput(tool: ToolLike): SchemaInput | undefined {
  switch (tool.kind) {
    case 'function':
      return tool.input
    case 'thread':
      return tool.input
    case 'effects':
      return tool.input

    default: {
      const exhaustiveCheck: never = tool
      return exhaustiveCheck
    }
  }
}

export function toolJsonSchema(tool: ToolLike): JsonValue {
  return jsonSchemaOfInput(toolInput(tool)) ?? EMPTY_OBJECT_SCHEMA
}

export function toolSpecs(tools: ReadonlyArray<AgentToolEntry> = []): LlmToolSpec[] {
  return normalizeTools(tools).map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputJsonSchema: toolJsonSchema(tool),
  }))
}
