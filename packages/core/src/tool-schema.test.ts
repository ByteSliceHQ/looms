import { describe, expect, test } from 'bun:test'
import { Schema } from 'effect'
import { defineAgent, defineTool, defineWorkflow } from './definitions'
import { jsonSchemaFromStandard, toolJsonSchema, toolSpecs } from './tool-schema'

interface TestJsonSchema {
  readonly type: string
  readonly properties?: {
    readonly shown?: { readonly type: string }
    readonly hidden?: { readonly type: string }
    readonly city?: { readonly type: string }
    readonly doc?: { readonly type: string }
    readonly task?: { readonly type: string }
    readonly n?: { readonly type: string }
  }
}

function withStandardJsonSchema(schema: TestJsonSchema) {
  return {
    '~standard': {
      version: 1 as const,
      vendor: 'test',
      validate: () => ({ value: {} }),
      jsonSchema: {
        input: () => schema,
        output: () => schema,
      },
    },
  }
}

describe('toolJsonSchema', () => {
  test('uses explicit inputSchema first', () => {
    const tool = defineTool({
      name: 'explicit',
      description: 'd',
      input: withStandardJsonSchema({ type: 'object', properties: { hidden: { type: 'string' } } }),
      inputSchema: { type: 'object', properties: { shown: { type: 'number' } } },
      handler: () => ({}),
    })
    expect(toolJsonSchema(tool)).toEqual({
      type: 'object',
      properties: { shown: { type: 'number' } },
    })
  })

  test('reads Standard JSON Schema from input', () => {
    const tool = defineTool({
      name: 'std',
      description: 'd',
      input: withStandardJsonSchema({
        type: 'object',
        properties: { city: { type: 'string' } },
      }),
      handler: () => ({}),
    })
    expect(toolJsonSchema(tool)).toEqual({
      type: 'object',
      properties: { city: { type: 'string' } },
    })
  })

  test('converts Effect Schema input', () => {
    const tool = defineTool({
      name: 'effect',
      description: 'd',
      input: Schema.Struct({ n: Schema.Number }),
      handler: () => ({}),
    })
    const schema = toolJsonSchema(tool)
    expect(schema).toBeTypeOf('object')
    expect(schema).not.toBeNull()
    const decoded = Schema.decodeUnknownExit(Schema.Unknown)(schema)
    expect(decoded._tag).toBe('Success')
    expect(JSON.stringify(schema).includes('object') || JSON.stringify(schema).includes('n')).toBe(true)
  })

  test('falls back to empty object schema', () => {
    const tool = defineTool({
      name: 'empty',
      description: 'd',
      handler: () => ({}),
    })
    expect(toolJsonSchema(tool)).toEqual({ type: 'object' })
  })

  test('workflow-tool uses workflow input', () => {
    const wf = defineWorkflow({
      name: 'hitl',
      description: 'Human-in-the-loop approval gate',
      input: withStandardJsonSchema({
        type: 'object',
        properties: { doc: { type: 'string' } },
      }),
      nodes: [{ id: 'n', run: () => 1 }],
    })
    const specs = toolSpecs([wf])
    expect(specs).toEqual([
      {
        name: 'hitl',
        description: 'Human-in-the-loop approval gate',
        inputJsonSchema: {
          type: 'object',
          properties: { doc: { type: 'string' } },
        },
      },
    ])
  })

  test('agent-tool uses agent input', () => {
    const agent = defineAgent({
      name: 'specialist',
      instructions: 'Specialize on a short task.',
      input: withStandardJsonSchema({
        type: 'object',
        properties: { task: { type: 'string' } },
      }),
    })
    const specs = toolSpecs([agent])
    expect(specs[0]?.name).toBe('specialist')
    expect(specs[0]?.description).toBe('Specialize on a short task.')
    expect(specs[0]?.inputJsonSchema).toEqual({
      type: 'object',
      properties: { task: { type: 'string' } },
    })
  })

  test('jsonSchemaFromStandard falls back', () => {
    expect(jsonSchemaFromStandard(null)).toEqual({ type: 'object' })
  })
})
