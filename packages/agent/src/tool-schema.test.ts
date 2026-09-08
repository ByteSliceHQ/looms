import { describe, expect, test } from 'bun:test'
import { Schema } from 'effect'
import { normalizeTools } from './definitions'
import { toolJsonSchema, toolSpecs } from './tool-schema'

const CheckoutInput = Schema.toStandardSchemaV1(
  Schema.Struct({
    amount: Schema.Number,
    currency: Schema.String,
  }),
)

describe('tool schema', () => {
  test('normalizeTools carries definition input onto thread tools', () => {
    const tools = normalizeTools([
      {
        kind: 'workflow',
        name: 'checkout',
        description: 'Approval gate then charge',
        input: CheckoutInput,
      },
    ])
    expect(tools[0]?.kind).toBe('thread')
    if (tools[0]?.kind !== 'thread') return
    expect(tools[0].input).toBe(CheckoutInput)
    expect(tools[0].childKind).toBe('workflow')
    expect(tools[0].childName).toBe('checkout')
  })

  test('toolSpecs include properties from thread-tool input schemas', () => {
    const specs = toolSpecs([
      {
        kind: 'workflow',
        name: 'checkout',
        description: 'Approval gate then charge',
        input: CheckoutInput,
      },
    ])
    expect(specs[0]?.name).toBe('checkout')
    const schema = specs[0]?.inputJsonSchema
    expect(schema).toBeDefined()
    const encoded = JSON.stringify(schema)
    expect(encoded).toContain('amount')
    expect(encoded).toContain('currency')
  })

  test('toolJsonSchema falls back to an object when no input is present', () => {
    const tools = normalizeTools([{ kind: 'workflow', name: 'bare' }])
    expect(toolJsonSchema(tools[0]!)).toEqual({ type: 'object' })
  })
})
