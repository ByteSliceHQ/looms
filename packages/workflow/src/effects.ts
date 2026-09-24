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
  nodeResultBuilders,
  type NodeResult,
  type NodeState,
  type WorkflowDefinition,
  type WorkflowIteration,
} from './definitions'
import { WorkflowDefinitionsTag } from './definitions-store'
import {
  assertJsonWithinLimit,
  DEFAULT_CHECKPOINT_SIZE_LIMIT_BYTES,
  DEFAULT_GRAPH_CONCURRENCY,
  getReadyNodeIds,
  getSkippableNodeIds,
  getUnusedFallbackIds,
  iterationChildWorkflowId,
  nodeChildWorkflowId,
  nodeResults,
  nodeRunKey,
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
  attempt: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(1))),
  iteration: Schema.optional(Schema.Struct({ index: Schema.Finite, previous: Schema.Json })),
  input: Schema.optional(Schema.Json),
  nodes: Schema.optional(Schema.Record(Schema.String, NodeStateSchema)),
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
    raw.type === 'switch' ||
    raw.type === 'map' ||
    raw.type === 'loop'
  )
}

type WorkflowEvents = EventInputOf<WorkflowEvent>[]

function threadFailed(threadId: string, error: string): WorkflowEvents {
  return [{ type: 'runtime.thread.failed', payload: { threadId, error }, threadId }]
}

export const scheduleEffect = workflowModule.effect({
  type: 'workflow.schedule',
  input: ScheduleInput,
  execute: (input, ctx) =>
    Effect.gen(function* () {
      const workflows = yield* WorkflowDefinitionsTag

      const definition = input.definitionName
        ? workflows.get(input.definitionName, input.definitionVersion)
        : undefined

      if (!definition) {
        return []
      }

      const nodes = { ...input.nodes } satisfies Record<string, NodeState>

      for (const node of definition.nodes) {
        nodes[node.id] ??= { status: 'pending', result: null, error: null, attempts: 0 }
      }

      return yield* scheduleEvents(definition, { nodes, input: input.input ?? null }, ctx.threadId)
    }),
})

function failurePolicyEvents(
  definition: WorkflowDefinition,
  nodes: Record<string, NodeState>,
  threadId: string,
): WorkflowEvents | undefined {
  const failed = definition.nodes.find((node) => nodes[node.id]?.status === 'failed')

  if (!failed) {
    return undefined
  }

  const state = nodes[failed.id]
  const policy = failed.failure ?? { type: 'fail' as const }
  const error = state?.error ?? `Node ${failed.id} failed`

  switch (policy.type) {
    case 'retry':
      return (state?.attempts ?? 0) < policy.maxAttempts
        ? [{ type: 'workflow.node.started', payload: { nodeId: failed.id }, threadId }]
        : threadFailed(threadId, error)
    case 'skip':
      return [
        {
          type: 'workflow.node.skipped',
          payload: { nodeId: failed.id, reason: error, cause: 'policy' },
          threadId,
        },
      ]
    case 'fallback':
      return [
        {
          type: 'workflow.node.skipped',
          payload: { nodeId: failed.id, reason: `fallback:${policy.nodeId}`, cause: 'policy' },
          threadId,
        },
        { type: 'workflow.node.started', payload: { nodeId: policy.nodeId }, threadId },
      ]
    case 'fail':
      return threadFailed(threadId, error)

    default: {
      const exhaustiveCheck: never = policy
      return exhaustiveCheck
    }
  }
}

export function scheduleEvents(
  definition: WorkflowDefinition,
  binding: {
    nodes: Record<string, NodeState>
    input: JsonValue
  },
  threadId: string,
): Effect.Effect<WorkflowEvents> {
  return Effect.gen(function* () {
    yield* assertJsonWithinLimit(binding.input, 'Workflow input', definition.inputLimitBytes)

    const policyEvents = failurePolicyEvents(definition, binding.nodes, threadId)

    if (policyEvents) {
      return policyEvents
    }

    const skipped: WorkflowEvents = [
      ...getSkippableNodeIds(definition, binding.nodes).map((nodeId) => ({
        type: 'workflow.node.skipped' as const,
        payload: { nodeId, reason: 'inactive branch', cause: 'inactive' as const },
        threadId,
      })),
      ...getUnusedFallbackIds(definition, binding.nodes).map((nodeId) => ({
        type: 'workflow.node.skipped' as const,
        payload: { nodeId, reason: 'fallback not needed', cause: 'inactive' as const },
        threadId,
      })),
    ]

    if (skipped.length > 0) {
      return skipped
    }

    const statuses = Object.values(binding.nodes).map((node) => node.status)
    const running = statuses.filter((status) => status === 'running').length
    const slots = Math.max(0, (definition.concurrency ?? DEFAULT_GRAPH_CONCURRENCY) - running)
    const ready = getReadyNodeIds(definition, binding.nodes).slice(0, slots)

    if (ready.length > 0) {
      return ready.map((nodeId) => ({
        type: 'workflow.node.started' as const,
        payload: { nodeId },
        threadId,
      }))
    }

    if (statuses.some((status) => status === 'pending' || status === 'running')) {
      return []
    }

    const results = nodeResults(definition, binding.nodes)

    const output = definition.output
      ? definition.output({ input: binding.input, results })
      : results

    yield* assertJsonWithinLimit(output, 'Workflow output', definition.outputLimitBytes)

    return [{ type: 'runtime.thread.completed' as const, payload: { threadId, output }, threadId }]
  }).pipe(
    Effect.catchTag('WorkflowValueTooLargeError', (error) =>
      Effect.succeed(threadFailed(threadId, error.message)),
    ),
  )
}

export const runNodeEffect = workflowModule.effect({
  type: 'workflow.runNode',
  input: RunNodeInput,
  execute: (input, ctx) =>
    Effect.gen(function* () {
      const workflows = yield* WorkflowDefinitionsTag

      const definition = input.definitionName
        ? workflows.get(input.definitionName, input.definitionVersion)
        : undefined

      const run: NodeRun = {
        threadId: ctx.threadId,
        nodeId: input.nodeId,
        attempt: input.attempt,
        iteration: input.iteration,
        input: input.input ?? null,
        nodes: input.nodes ?? {},
      }

      if (!definition) {
        return finished(run, null, 'Unknown workflow definition')
      }

      return yield* runNode(definition, run)
    }),
})

interface NodeRun {
  readonly threadId: string
  readonly nodeId: string
  readonly attempt: number
  readonly iteration: WorkflowIteration | undefined
  readonly input: JsonValue
  readonly nodes: Readonly<Record<string, NodeState>>
}

function finished(run: NodeRun, result: JsonValue | null, error: string | null): WorkflowEvents {
  return [
    {
      type: 'workflow.node.finished',
      payload: { nodeId: run.nodeId, result, error },
      threadId: run.threadId,
    },
  ]
}

function runNode(definition: WorkflowDefinition, run: NodeRun): Effect.Effect<WorkflowEvents> {
  return Effect.gen(function* () {
    const nodeDef = definition.nodes.find((node) => node.id === run.nodeId)

    if (!nodeDef) {
      return finished(run, null, `Unknown node: ${run.nodeId}`)
    }

    const raw = yield* Effect.tryPromise({
      try: () =>
        Promise.resolve(
          nodeDef.run({
            threadId: run.threadId,
            nodeId: run.nodeId,
            input: run.input,
            results: nodeResults(definition, run.nodes),
            iteration: run.iteration,
            ...nodeResultBuilders(),
          }),
        ),
      catch: (cause) => new WorkflowNodeError(cause),
    }).pipe(
      Effect.map((value) => ({ ok: true as const, value })),
      Effect.catch((err) => Effect.succeed({ ok: false as const, error: err.message })),
    )

    if (!raw.ok) {
      return finished(run, null, raw.error)
    }

    const result: NodeResult = isNodeResult(raw.value)
      ? raw.value
      : { type: 'value', value: raw.value }

    return yield* nodeResultEvents(definition, nodeDef.type, run, result)
  }).pipe(
    Effect.catchTag('WorkflowValueTooLargeError', (error) =>
      Effect.succeed(finished(run, null, error.message)),
    ),
  )
}

function nodeResultEvents(
  definition: WorkflowDefinition,
  nodeType: WorkflowDefinition['nodes'][number]['type'],
  run: NodeRun,
  result: NodeResult,
) {
  return Effect.gen(function* () {
    const { threadId, nodeId, attempt } = run
    const outputLabel = `Node ${nodeId} output`

    switch (result.type) {
      case 'value':
        yield* assertJsonWithinLimit(result.value, outputLabel, definition.outputLimitBytes)
        return finished(run, result.value, null)

      case 'switch': {
        const value = result.value ?? result.branch
        yield* assertJsonWithinLimit(value, outputLabel, definition.outputLimitBytes)

        return [
          {
            type: 'workflow.node.finished',
            payload: { nodeId, result: value, error: null, branch: result.branch },
            threadId,
          },
        ] satisfies WorkflowEvents
      }

      case 'spawn': {
        const childThreadId =
          result.childThreadId ??
          (nodeType === 'workflow'
            ? nodeChildWorkflowId(threadId, nodeId, attempt)
            : createThreadId())

        return spawnRequested(run, childThreadId, result, result.input)
      }

      case 'sleep': {
        const now = yield* Clock.currentTimeMillis
        const key = nodeRunKey(nodeId, attempt, run.iteration?.index)

        return [
          {
            type: 'workflow.sleep.requested',
            payload: {
              nodeId,
              waitId: createWaitId(threadId, `sleep_${key}`),
              wakeAt: now + result.ms,
            },
            threadId,
          },
        ] satisfies WorkflowEvents
      }

      case 'effects':
        return [
          {
            type: 'workflow.effects.requested',
            payload: { nodeId, effects: result.effects ?? [] },
            threadId,
          },
        ] satisfies WorkflowEvents

      case 'map': {
        if (result.items.length === 0) {
          return finished(run, [], null)
        }

        const limitBytes = definition.checkpointLimitBytes ?? DEFAULT_CHECKPOINT_SIZE_LIMIT_BYTES
        yield* assertJsonWithinLimit(result.items, `Node ${nodeId} items`, limitBytes)

        return [
          {
            type: 'workflow.map.requested',
            payload: {
              nodeId,
              attempt,
              kind: result.kind,
              definitionName: result.name,
              definitionVersion: result.version,
              items: result.items,
              concurrency: result.concurrency,
              limitBytes,
            },
            threadId,
          },
        ] satisfies WorkflowEvents
      }

      case 'loop': {
        const index = run.iteration?.index ?? 0

        if (index >= result.maxIterations) {
          return finished(run, run.iteration?.previous ?? null, null)
        }

        const childThreadId = iterationChildWorkflowId(threadId, nodeId, 'loop', attempt, index)
        return spawnRequested(run, childThreadId, result, result.input, index)
      }

      default: {
        const exhaustiveCheck: never = result
        return exhaustiveCheck
      }
    }
  })
}

function spawnRequested(
  run: NodeRun,
  childThreadId: string,
  child: { readonly kind: string; readonly name: string; readonly version: string },
  input: JsonValue,
  loopIndex: number | null = null,
): WorkflowEvents {
  return [
    {
      type: 'workflow.spawn.requested',
      payload: {
        nodeId: run.nodeId,
        attempt: run.attempt,
        childThreadId,
        kind: child.kind,
        definitionName: child.name,
        definitionVersion: child.version,
        input,
        loopIndex,
      },
      threadId: run.threadId,
    },
  ]
}
