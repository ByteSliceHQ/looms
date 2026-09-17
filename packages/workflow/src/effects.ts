import { Clock, Data, Effect, Predicate, Schema } from 'effect'

import { createThreadId, createWaitId, type EventInputOf, type JsonValue } from '@looms/core'

import {
  NodeStateSchema,
  readyNodes,
  type NodeResult,
  type WorkflowDefinition,
} from './definitions'
import { WorkflowDefinitionsTag } from './definitions-store'
import { workflowModule, type WorkflowEvent } from './scope'

const ScheduleInput = Schema.Struct({
  definitionName: Schema.optional(Schema.String),
  nodes: Schema.optional(Schema.Record(Schema.String, NodeStateSchema)),
  input: Schema.optional(Schema.Json),
})

const RunNodeInput = Schema.Struct({
  definitionName: Schema.optional(Schema.String),
  nodeId: Schema.String,
  input: Schema.optional(Schema.Json),
  results: Schema.optional(Schema.Record(Schema.String, Schema.NullOr(Schema.Json))),
})

class WorkflowNodeError extends Data.TaggedError('WorkflowNodeError')<{
  readonly cause: unknown
  readonly message: string
}> {
  constructor(cause: unknown) {
    super({
      cause,
      message: cause instanceof Error ? cause.message : String(cause),
    })

    this.name = 'WorkflowNodeError'
  }
}

function isNodeResult(raw: JsonValue | NodeResult): raw is NodeResult {
  if (!Predicate.isObject(raw) || !('type' in raw)) {
    return false
  }

  return (
    raw.type === 'value' || raw.type === 'spawn' || raw.type === 'sleep' || raw.type === 'effects'
  )
}

export const scheduleEffect = workflowModule.effect({
  type: 'workflow.schedule',
  input: ScheduleInput,
  execute: (input, ctx) =>
    Effect.gen(function* () {
      const workflows = yield* WorkflowDefinitionsTag
      const threadId = ctx.threadId
      const definition = input.definitionName ? workflows.get(input.definitionName) : undefined

      if (!definition) {
        return []
      }

      const rawNodes = input.nodes ?? {}
      const nodes: { [id: string]: { status: string; result: JsonValue | null } } = {}

      for (const [id, n] of Object.entries(rawNodes)) {
        // SAFETY: NodeState results are valid JSON-serializable node execution outputs.
        nodes[id] = { status: n.status, result: n.result ?? null }
      }

      for (const node of definition.nodes) {
        if (!nodes[node.id]) {
          nodes[node.id] = { status: 'pending', result: null }
        }
      }

      return scheduleEvents(definition, { nodes, input: input.input ?? null }, threadId)
    }),
})

export function scheduleEvents(
  definition: WorkflowDefinition,
  binding: {
    nodes: { [id: string]: { status: string; result: JsonValue | null } }
    input: JsonValue
  },
  threadId: string,
): EventInputOf<WorkflowEvent>[] {
  const running = Object.values(binding.nodes).filter((n) => n.status === 'running').length
  const slots = Math.max(0, (definition.concurrency ?? 8) - running)
  const ready = readyNodes(definition, binding.nodes).slice(0, slots)
  const events: EventInputOf<WorkflowEvent>[] = []

  for (const nodeId of ready) {
    events.push({
      type: 'workflow.node.started',
      payload: { nodeId },
      threadId,
    })
  }

  if (ready.length > 0) {
    return events
  }

  const pending = Object.values(binding.nodes).some(
    (n) => n.status === 'pending' || n.status === 'running',
  )

  if (pending) {
    return []
  }

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

export const runNodeEffect = workflowModule.effect({
  type: 'workflow.runNode',
  input: RunNodeInput,
  execute: (input, ctx) =>
    Effect.gen(function* () {
      const workflows = yield* WorkflowDefinitionsTag
      const threadId = ctx.threadId
      const definition = input.definitionName ? workflows.get(input.definitionName) : undefined

      if (!definition) {
        return [
          {
            type: 'workflow.node.finished',
            payload: { nodeId: input.nodeId, result: null, error: 'Unknown workflow definition' },
            threadId,
          },
        ]
      }

      const rawResults = input.results ?? {}
      const results: { [id: string]: JsonValue | null } = {}

      for (const [id, val] of Object.entries(rawResults)) {
        // SAFETY: Node results dictionary maps node IDs to JSON values or null.
        results[id] = val ?? null
      }

      return yield* runNode(
        definition,
        { input: input.input ?? null, results },
        input.nodeId,
        threadId,
      )
    }),
})

function runNode(
  definition: WorkflowDefinition,
  binding: {
    results: { [id: string]: JsonValue | null }
    input: JsonValue
  },
  nodeId: string,
  threadId: string,
): Effect.Effect<ReadonlyArray<EventInputOf<WorkflowEvent>>> {
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

    const results = binding.results

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
      catch: (cause) => new WorkflowNodeError(cause),
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

    const result: NodeResult = isNodeResult(raw.value)
      ? raw.value
      : { type: 'value', value: raw.value }

    switch (result.type) {
      case 'value':
        return [
          {
            type: 'workflow.node.finished',
            payload: { nodeId, result: result.value ?? null, error: null },
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
              input: result.input ?? null,
            },
            threadId,
          },
        ]
      }

      case 'sleep': {
        const now = yield* Clock.currentTimeMillis

        return [
          {
            type: 'workflow.sleep.requested',
            payload: {
              nodeId,
              waitId: createWaitId(threadId, `sleep_${nodeId}`),
              wakeAt: now + result.ms,
            },
            threadId,
          },
        ]
      }

      case 'effects':
        return [
          {
            type: 'workflow.effects.requested',
            payload: {
              nodeId,
              effects: result.effects ?? [],
            },
            threadId,
          },
        ]

      default: {
        const exhaustiveCheck: never = result
        return exhaustiveCheck
      }
    }
  })
}
