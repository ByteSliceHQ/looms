import { Clock, Data, Effect, Predicate, Schema } from 'effect'

import {
  createThreadId,
  createWaitId,
  DEFAULT_DEFINITION_VERSION,
  type EventInputOf,
  type JsonValue,
} from '@looms/core'

import {
  NodeStateSchema,
  type NodeResult,
  type NodeState,
  type WorkflowDefinition,
  validateWorkflowInput,
} from './definitions'
import { WorkflowDefinitionsTag } from './definitions-store'
import {
  assertJsonWithinLimit,
  getReadyNodeIds,
  getSkippableNodeIds,
  nodeChildWorkflowId,
  resolveGraphConcurrency,
} from './graph'
import { workflowModule, type WorkflowEvent } from './scope'

const ScheduleInput = Schema.Struct({
  definitionName: Schema.optional(Schema.String),
  definitionVersion: Schema.String.pipe(
    Schema.withDecodingDefaultKey(Effect.succeed(DEFAULT_DEFINITION_VERSION)),
  ),
  nodes: Schema.optional(Schema.Record(Schema.String, NodeStateSchema)),
  input: Schema.optional(Schema.Json),
})

const RunNodeInput = Schema.Struct({
  definitionName: Schema.optional(Schema.String),
  definitionVersion: Schema.String.pipe(
    Schema.withDecodingDefaultKey(Effect.succeed(DEFAULT_DEFINITION_VERSION)),
  ),
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
    raw.type === 'value' ||
    raw.type === 'spawn' ||
    raw.type === 'sleep' ||
    raw.type === 'effects' ||
    raw.type === 'switch'
  )
}

export const scheduleEffect = workflowModule.effect({
  type: 'workflow.schedule',
  input: ScheduleInput,
  execute: (input, ctx) =>
    Effect.gen(function* () {
      const workflows = yield* WorkflowDefinitionsTag
      const threadId = ctx.threadId

      const definition = input.definitionName
        ? workflows.get(input.definitionName, input.definitionVersion)
        : undefined

      if (!definition) {
        return []
      }

      const rawNodes = input.nodes ?? {}
      const nodes: Record<string, NodeState> = {}

      for (const [id, n] of Object.entries(rawNodes)) {
        nodes[id] = {
          status: n.status,
          result: n.result ?? null,
          error: n.error ?? null,
          attempts: n.attempts,
          branch: n.branch,
        }
      }

      for (const node of definition.nodes) {
        if (!nodes[node.id]) {
          nodes[node.id] = { status: 'pending', result: null, error: null, attempts: 0 }
        }
      }

      const workflowInput = input.input ?? null
      validateWorkflowInput(definition, workflowInput)
      return scheduleEvents(definition, { nodes, input: workflowInput }, threadId)
    }),
})

export function scheduleEvents(
  definition: WorkflowDefinition,
  binding: {
    nodes: Record<string, NodeState>
    input: JsonValue
  },
  threadId: string,
): EventInputOf<WorkflowEvent>[] {
  const failed = definition.nodes.find((node) => binding.nodes[node.id]?.status === 'failed')

  if (failed) {
    const state = binding.nodes[failed.id]
    const policy = failed.failure ?? { type: 'fail' as const }

    switch (policy.type) {
      case 'retry':
        if ((state?.attempts ?? 0) < policy.maxAttempts) {
          return [{ type: 'workflow.node.started', payload: { nodeId: failed.id }, threadId }]
        }

        break
      case 'skip':
        return [
          {
            type: 'workflow.node.skipped',
            payload: { nodeId: failed.id, reason: state?.error ?? 'failure policy skip' },
            threadId,
          },
        ]
      case 'fallback':
        return [
          {
            type: 'workflow.node.skipped',
            payload: { nodeId: failed.id, reason: `fallback:${policy.nodeId}` },
            threadId,
          },
          { type: 'workflow.node.started', payload: { nodeId: policy.nodeId }, threadId },
        ]
      case 'fail':
        break

      default: {
        const exhaustiveCheck: never = policy
        return exhaustiveCheck
      }
    }

    return [
      {
        type: 'runtime.thread.failed',
        payload: { threadId, error: state?.error ?? `Node ${failed.id} failed` },
        threadId,
      },
    ]
  }

  const skippable = getSkippableNodeIds(definition, binding.nodes)

  if (skippable.length > 0) {
    return skippable.map((nodeId) => ({
      type: 'workflow.node.skipped' as const,
      payload: { nodeId, reason: 'inactive branch' },
      threadId,
    }))
  }

  const running = Object.values(binding.nodes).filter((n) => n.status === 'running').length
  const slots = Math.max(0, resolveGraphConcurrency(definition.concurrency) - running)
  const ready = getReadyNodeIds(definition, binding.nodes).slice(0, slots)
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

  const results: { [id: string]: JsonValue | null } = {}

  for (const [id, node] of Object.entries(binding.nodes)) {
    results[id] = node.result
  }

  const output = definition.output ? definition.output({ input: binding.input, results }) : results
  assertJsonWithinLimit(output, 'Workflow output', definition.outputLimitBytes)
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

      const definition = input.definitionName
        ? workflows.get(input.definitionName, input.definitionVersion)
        : undefined

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
            spawn: (child, input) => ({
              type: 'spawn',
              kind: child.kind,
              name: child.name,
              version: child.version ?? DEFAULT_DEFINITION_VERSION,
              input,
            }),
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
        assertJsonWithinLimit(
          result.value ?? null,
          `Node ${nodeId} output`,
          definition.outputLimitBytes,
        )

        return [
          {
            type: 'workflow.node.finished',
            payload: { nodeId, result: result.value ?? null, error: null },
            threadId,
          },
        ]

      case 'spawn': {
        const childThreadId =
          result.childThreadId ??
          (nodeDef.type === 'workflow' ? nodeChildWorkflowId(threadId, nodeId) : createThreadId())

        return [
          {
            type: 'workflow.spawn.requested',
            payload: {
              nodeId,
              childThreadId,
              kind: result.kind,
              definitionName: result.name,
              definitionVersion: result.version,
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

      case 'switch':
        assertJsonWithinLimit(
          result.value ?? result.branch,
          `Node ${nodeId} output`,
          definition.outputLimitBytes,
        )

        return [
          {
            type: 'workflow.node.finished',
            payload: {
              nodeId,
              result: result.value ?? result.branch,
              error: null,
              branch: result.branch,
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
