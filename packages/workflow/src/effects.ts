import {
  createThreadId,
  createWaitId,
  defineEffect,
  type EventInput,
  type JsonValue,
} from '@looms/core'
import { Effect, Predicate, Schema } from 'effect'
import { readyNodes, type NodeResult, type WorkflowDefinition } from './definitions'
import { WorkflowDefinitionsTag } from './definitions-store'

const ScheduleInput = Schema.Struct({})
const RunNodeInput = Schema.Struct({
  nodeId: Schema.String,
})

const threadBindings = new Map<
  string,
  { definitionName: string; nodes: { [id: string]: { status: string; result: JsonValue | null } }; input: JsonValue }
>()

export function bindWorkflowThread(
  threadId: string,
  binding: {
    definitionName: string
    nodes: { [id: string]: { status: string; result: JsonValue | null } }
    input: JsonValue
  },
): void {
  threadBindings.set(threadId, binding)
}

function isNodeResult(raw: JsonValue | NodeResult): raw is NodeResult {
  if (!Predicate.isObject(raw) || !('type' in raw)) return false
  return (
    raw.type === 'value' || raw.type === 'spawn' || raw.type === 'sleep' || raw.type === 'effects'
  )
}

export const scheduleEffect = defineEffect({
  type: 'workflow.schedule',
  input: ScheduleInput,
  execute: (_input, ctx) =>
    Effect.gen(function* () {
      const workflows = yield* WorkflowDefinitionsTag
      const threadId = ctx.threadId
      const binding = threadBindings.get(threadId)
      const definition = binding ? workflows.get(binding.definitionName) : undefined
      if (!definition || !binding) return []
      const nodes = { ...binding.nodes }
      for (const node of definition.nodes) {
        if (!nodes[node.id]) nodes[node.id] = { status: 'pending', result: null }
      }
      return scheduleEvents(definition, { ...binding, nodes }, threadId)
    }),
})

export function scheduleEvents(
  definition: WorkflowDefinition,
  binding: {
    nodes: { [id: string]: { status: string; result: JsonValue | null } }
    input: JsonValue
  },
  threadId: string,
): EventInput[] {
  const running = Object.values(binding.nodes).filter((n) => n.status === 'running').length
  const slots = Math.max(0, (definition.concurrency ?? 8) - running)
  const ready = readyNodes(definition, binding.nodes).slice(0, slots)
  const events: EventInput[] = []
  for (const nodeId of ready) {
    events.push({
      type: 'workflow.node.started',
      payload: { nodeId },
      threadId,
    })
  }
  if (ready.length > 0) return events

  const pending = Object.values(binding.nodes).some(
    (n) => n.status === 'pending' || n.status === 'running',
  )
  if (pending) return []

  const failed = Object.entries(binding.nodes).find(([, n]) => n.status === 'failed')
  if (failed) {
    return [
      {
        type: 'runtime.thread.failed',
        payload: { threadId, error: `Node ${failed[0]} failed` },
        threadId,
      },
    ]
  }

  const results: { [id: string]: JsonValue | null } = {}
  for (const [id, node] of Object.entries(binding.nodes)) {
    results[id] = node.result
  }
  const output = definition.output ? definition.output({ input: binding.input, results }) : results
  return [
    {
      type: 'runtime.thread.completed',
      payload: { threadId, output },
      threadId,
    },
  ]
}

export const runNodeEffect = defineEffect({
  type: 'workflow.runNode',
  input: RunNodeInput,
  execute: (input, ctx) =>
    Effect.gen(function* () {
      const workflows = yield* WorkflowDefinitionsTag
      const threadId = ctx.threadId
      const binding = threadBindings.get(threadId)
      const definition = binding ? workflows.get(binding.definitionName) : undefined
      if (!definition || !binding) {
        return [
          {
            type: 'workflow.node.finished',
            payload: { nodeId: input.nodeId, result: null, error: 'Unknown workflow definition' },
            threadId,
          },
        ]
      }
      return yield* runNode(definition, binding, input.nodeId, threadId)
    }),
})

function runNode(
  definition: WorkflowDefinition,
  binding: {
    nodes: { [id: string]: { status: string; result: JsonValue | null } }
    input: JsonValue
  },
  nodeId: string,
  threadId: string,
): Effect.Effect<ReadonlyArray<EventInput>, Error> {
  return Effect.gen(function* () {
    const nodeDef = definition.nodes.find((node) => node.id === nodeId)
    if (!nodeDef) {
      return [
        {
          type: 'workflow.node.finished',
          payload: { nodeId, result: null, error: `Unknown node: ${nodeId}` },
          threadId,
        },
      ]
    }
    const results: { [id: string]: JsonValue | null } = {}
    for (const [id, node] of Object.entries(binding.nodes)) {
      results[id] = node.result
    }
    const raw = yield* Effect.tryPromise({
      try: () =>
        Promise.resolve(
          nodeDef.run({
            threadId,
            nodeId,
            input: binding.input,
            results,
            spawn: (child, input) => ({ type: 'spawn', kind: child.kind, name: child.name, input }),
            sleep: (ms) => ({ type: 'sleep', ms }),
            effects: (effects) => ({ type: 'effects', effects }),
          }),
        ),
      catch: (cause) => (cause instanceof Error ? cause : new Error(String(cause))),
    }).pipe(
      Effect.map((value) => ({ ok: true as const, value })),
      Effect.catch((err) => Effect.succeed({ ok: false as const, error: err.message })),
    )
    if (!raw.ok) {
      return [
        {
          type: 'workflow.node.finished',
          payload: { nodeId, result: null, error: raw.error },
          threadId,
        },
      ]
    }
    const result: NodeResult = isNodeResult(raw.value) ? raw.value : { type: 'value', value: raw.value }
    switch (result.type) {
      case 'value':
        return [
          {
            type: 'workflow.node.finished',
            payload: { nodeId, result: result.value, error: null },
            threadId,
          },
        ]
      case 'spawn': {
        const childThreadId = createThreadId()
        return [
          {
            type: 'workflow.spawn.requested',
            payload: {
              nodeId,
              childThreadId,
              kind: result.kind,
              definitionName: result.name,
              input: result.input,
            },
            threadId,
          },
        ]
      }
      case 'sleep':
        return [
          {
            type: 'workflow.sleep.requested',
            payload: {
              nodeId,
              waitId: createWaitId(),
              wakeAt: Date.now() + result.ms,
            },
            threadId,
          },
        ]
      case 'effects':
        return [
          {
            type: 'workflow.effects.requested',
            payload: {
              nodeId,
              // SAFETY: node effect lists are JSON-serializable RuntimeEffect values.
              effects: result.effects as JsonValue[],
            },
            threadId,
          },
        ]
      default: {
        const _exhaustive: never = result
        return _exhaustive
      }
    }
  })
}
