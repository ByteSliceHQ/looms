import { Effect, Predicate, Schema } from 'effect'

import {
  asJson,
  createWaitId,
  DEFAULT_DEFINITION_VERSION,
  EventInputSchema,
  emit,
  fail,
  invoke,
  isJsonObject,
  isWithdrawnError,
  RuntimeEffectSchema,
  spawn,
  stableEffectId,
  wait,
  type EventInput,
  type JsonValue,
  type RuntimeEffect,
} from '@looms/core'

import { NodeStateSchema, type NodeState } from './definitions'
import { runNodeEffect, scheduleEffect } from './effects'
import {
  iterationChildWorkflowId,
  nodeRunKey,
  utf8JsonSize,
  WorkflowValueTooLargeError,
} from './graph'
import { workflowModule } from './scope'

export { NodeStateSchema, NodeStatusSchema, type NodeState, type NodeStatus } from './definitions'

const attemptNumber = Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(1)))

export const WorkflowPendingSpawnSchema = Schema.Struct({
  childThreadId: Schema.String,
  kind: Schema.String,
  definitionName: Schema.String,
  definitionVersion: Schema.String,
  nodeId: Schema.String,
  attempt: attemptNumber,
  input: Schema.Json,
  loopIndex: Schema.NullOr(Schema.Finite).pipe(Schema.withDecodingDefaultKey(Effect.succeed(null))),
})
export type WorkflowPendingSpawn = Schema.Schema.Type<typeof WorkflowPendingSpawnSchema>

export const WorkflowPendingMapSchema = Schema.Struct({
  nodeId: Schema.String,
  attempt: attemptNumber,
  kind: Schema.String,
  definitionName: Schema.String,
  definitionVersion: Schema.String,
  items: Schema.Array(Schema.Json),
  concurrency: Schema.Finite,
  limitBytes: Schema.Finite,
  /** Items before this index have been started; later ones wait for a free slot. */
  nextIndex: Schema.Finite,
  outputs: Schema.Record(Schema.String, Schema.Json),
})
export type WorkflowPendingMap = Schema.Schema.Type<typeof WorkflowPendingMapSchema>

export const WorkflowPendingSleepSchema = Schema.Struct({
  waitId: Schema.String,
  wakeAt: Schema.Finite,
  nodeId: Schema.String,
})
export type WorkflowPendingSleep = Schema.Schema.Type<typeof WorkflowPendingSleepSchema>

export const WorkflowPendingEffectsSchema = Schema.Struct({
  nodeId: Schema.String,
  effects: Schema.mutable(Schema.Array(RuntimeEffectSchema)),
})
export type WorkflowPendingEffects = Schema.Schema.Type<typeof WorkflowPendingEffectsSchema>

export const WorkflowPendingEmitSchema = Schema.Struct({
  id: Schema.String,
  event: EventInputSchema,
})
export type WorkflowPendingEmit = Schema.Schema.Type<typeof WorkflowPendingEmitSchema>

export const WorkflowStateSchema = Schema.Struct({
  definitionName: Schema.optional(Schema.String),
  definitionVersion: Schema.optional(Schema.String),
  nodes: Schema.Record(Schema.String, NodeStateSchema),
  concurrency: Schema.Finite,
  input: Schema.Json,
  nodeIds: Schema.mutable(Schema.Array(Schema.String)),
  needsSchedule: Schema.Boolean,
  runningNodes: Schema.mutable(Schema.Array(Schema.String)),
  pendingSpawns: Schema.mutable(Schema.Array(WorkflowPendingSpawnSchema)),
  pendingMaps: Schema.mutable(Schema.Array(WorkflowPendingMapSchema)).pipe(
    Schema.withDecodingDefaultKey(Effect.succeed([])),
  ),
  pendingSleeps: Schema.mutable(Schema.Array(WorkflowPendingSleepSchema)),
  pendingEffects: Schema.mutable(Schema.Array(WorkflowPendingEffectsSchema)),
  pendingEmits: Schema.mutable(Schema.Array(WorkflowPendingEmitSchema)),
  status: Schema.Union([
    Schema.Literal('running'),
    Schema.Literal('completed'),
    Schema.Literal('failed'),
  ]),
  error: Schema.NullOr(Schema.String),
})
export type WorkflowState = Schema.Schema.Type<typeof WorkflowStateSchema>

const initialWorkflowStatus: WorkflowState['status'] = 'running'

function scheduleInvocation(state: WorkflowState) {
  return invoke(scheduleEffect, {
    definitionName: state.definitionName,
    definitionVersion: state.definitionVersion ?? DEFAULT_DEFINITION_VERSION,
    nodes: state.nodes,
    input: state.input,
  })
}

function runNodeInvocation(state: WorkflowState, nodeId: string) {
  const node = state.nodes[nodeId]
  const attempts = node?.attempts ?? 1

  return invoke(
    runNodeEffect,
    {
      definitionName: state.definitionName,
      definitionVersion: state.definitionVersion ?? DEFAULT_DEFINITION_VERSION,
      nodeId,
      attempt: attempts,
      iteration: node?.iteration,
      input: state.input,
      nodes: state.nodes,
    },
    `runNode_${nodeRunKey(nodeId, attempts, node?.iteration?.index)}`,
  )
}

function spawnAndWait(
  threadId: string,
  child: Pick<WorkflowPendingSpawn, 'kind' | 'definitionName' | 'definitionVersion'>,
  childThreadId: string,
  input: JsonValue,
  tag: { readonly [key: string]: JsonValue },
): RuntimeEffect[] {
  return [
    spawn({
      childThreadId,
      kind: child.kind,
      definitionName: child.definitionName,
      definitionVersion: child.definitionVersion,
      input,
    }),
    wait({
      waitId: createWaitId(threadId, `spawn_${childThreadId}`),
      on: {
        type: ['runtime.thread.completed', 'runtime.thread.failed'],
        match: { threadId: childThreadId },
      },
      tag,
    }),
  ]
}

function mapChildThreadId(threadId: string, map: WorkflowPendingMap, index: number): string {
  return iterationChildWorkflowId(threadId, map.nodeId, 'map', map.attempt, index)
}

interface NodeEffect {
  readonly nodeId: string
  readonly effect: RuntimeEffect
}

/** Every effect a node currently needs, attributed to that node. */
function nodeEffects(state: WorkflowState, threadId: string): NodeEffect[] {
  const effects: NodeEffect[] = []

  const add = (nodeId: string, items: readonly RuntimeEffect[]) => {
    for (const effect of items) {
      effects.push({ nodeId, effect })
    }
  }

  for (const nodeId of state.runningNodes) {
    add(nodeId, [runNodeInvocation(state, nodeId)])
  }

  for (const item of state.pendingSpawns) {
    const tag = { nodeId: item.nodeId, attempt: item.attempt }

    add(
      item.nodeId,
      spawnAndWait(threadId, item, item.childThreadId, item.input, {
        ...tag,
        loopIndex: item.loopIndex,
      }),
    )
  }

  for (const map of state.pendingMaps) {
    for (let index = 0; index < map.nextIndex; index++) {
      if (!(String(index) in map.outputs)) {
        add(
          map.nodeId,
          spawnAndWait(
            threadId,
            map,
            mapChildThreadId(threadId, map, index),
            map.items[index] ?? null,
            { nodeId: map.nodeId, attempt: map.attempt, index },
          ),
        )
      }
    }
  }

  for (const sleep of state.pendingSleeps) {
    add(sleep.nodeId, [
      wait({ waitId: sleep.waitId, on: { timerAt: sleep.wakeAt }, tag: { nodeId: sleep.nodeId } }),
    ])
  }

  for (const pending of state.pendingEffects) {
    add(pending.nodeId, pending.effects)
  }

  return effects
}

function nodeIdForEffect(state: WorkflowState, threadId: string, effectId: string): string | null {
  const match = nodeEffects(state, threadId).find(
    (item) => stableEffectId(threadId, item.effect) === effectId,
  )

  return match?.nodeId ?? null
}

function withoutPendingWork(state: WorkflowState, nodeId: string): WorkflowState {
  return {
    ...state,
    pendingSpawns: state.pendingSpawns.filter((item) => item.nodeId !== nodeId),
    pendingMaps: state.pendingMaps.filter((item) => item.nodeId !== nodeId),
    pendingSleeps: state.pendingSleeps.filter((item) => item.nodeId !== nodeId),
    pendingEffects: state.pendingEffects.filter((item) => item.nodeId !== nodeId),
  }
}

function stopNode(state: WorkflowState, nodeId: string): WorkflowState {
  return {
    ...withoutPendingWork(state, nodeId),
    runningNodes: state.runningNodes.filter((id) => id !== nodeId),
  }
}

/** Drops a node's pending work and emits the event that durably finishes it. */
function finishNode(
  state: WorkflowState,
  nodeId: string,
  result: JsonValue | null,
  error: string | null,
  threadId: string,
): WorkflowState {
  const id = `finished_${nodeId}`

  const event: EventInput = {
    type: 'workflow.node.finished',
    payload: { nodeId, result, error },
    threadId,
  }

  return {
    ...withoutPendingWork(state, nodeId),
    pendingEmits: [...state.pendingEmits.filter((item) => item.id !== id), { id, event }],
  }
}

interface WaitOutcome {
  readonly result: JsonValue | null
  readonly error: string | null
}

function waitOutcome(
  satisfied: JsonValue | undefined,
  tag: { readonly [key: string]: JsonValue },
): WaitOutcome {
  const payload =
    Predicate.isObject(satisfied) && Predicate.isObject(satisfied.payload) ? satisfied.payload : {}

  const error = Predicate.isString(payload.error) ? payload.error : null

  const approvalId = Predicate.isString(tag.approvalId) ? tag.approvalId : undefined

  const approvalTimeout =
    approvalId !== undefined &&
    Predicate.isObject(satisfied) &&
    satisfied.type === 'runtime.timer.fired'

  const terminalError = error ?? (approvalTimeout ? `Approval ${approvalId} timed out` : null)

  const result =
    payload.output ?? (Predicate.isObject(satisfied) ? satisfied.payload : { waited: true })

  // SAFETY: result is serialized to a JSON-compatible node execution result.
  return { result: terminalError ? null : (asJson(result) ?? null), error: terminalError }
}

function recordMapOutput(
  state: WorkflowState,
  map: WorkflowPendingMap,
  index: number,
  output: JsonValue | null,
  threadId: string,
): WorkflowState {
  if (String(index) in map.outputs) {
    return state
  }

  const outputs = { ...map.outputs, [String(index)]: output }
  const size = utf8JsonSize(outputs)

  if (size > map.limitBytes) {
    const error = new WorkflowValueTooLargeError(`Node ${map.nodeId} outputs`, size, map.limitBytes)
    return finishNode(state, map.nodeId, null, error.message, threadId)
  }

  if (Object.keys(outputs).length === map.items.length) {
    const ordered = map.items.map((_, i) => outputs[String(i)] ?? null)
    return finishNode(state, map.nodeId, ordered, null, threadId)
  }

  const nextIndex = Math.min(map.items.length, map.nextIndex + 1)

  return {
    ...state,
    pendingMaps: state.pendingMaps.map((item) =>
      item.nodeId === map.nodeId ? { ...item, outputs, nextIndex } : item,
    ),
  }
}

function isCurrentAttempt(state: WorkflowState, nodeId: string, attempt: JsonValue | undefined) {
  const node = state.nodes[nodeId]
  return node?.status === 'running' && (attempt === undefined || attempt === node.attempts)
}

export const workflowThread = workflowModule.thread({
  kind: 'workflow',
  shape: WorkflowStateSchema,
  initialState: (ctx) => ({
    definitionName: ctx.definitionName,
    definitionVersion: ctx.definitionVersion,
    nodes: {},
    concurrency: 8,
    input: ctx.input,
    nodeIds: [],
    needsSchedule: false,
    runningNodes: [],
    pendingSpawns: [],
    pendingMaps: [],
    pendingSleeps: [],
    pendingEffects: [],
    pendingEmits: [],
    status: initialWorkflowStatus,
    error: null,
  }),
  step(state, event, ctx) {
    switch (event.type) {
      case 'runtime.thread.started': {
        const payload = event.payload
        const defName = payload.definitionName || state.definitionName

        const defVersion =
          payload.definitionVersion ?? state.definitionVersion ?? DEFAULT_DEFINITION_VERSION

        const inputObj = Predicate.isObject(payload.input) ? payload.input : {}

        const nodeIds = Array.isArray(inputObj.nodeIds)
          ? inputObj.nodeIds.filter(Predicate.isString)
          : state.nodeIds

        const nodes: { [nodeId: string]: NodeState } = {}

        for (const nodeId of nodeIds) {
          nodes[nodeId] = { status: 'pending', result: null, error: null }
        }

        return {
          ...state,
          definitionName: defName,
          definitionVersion: defVersion,
          nodes,
          nodeIds,
          input: payload.input ?? state.input,
          needsSchedule: true,
        }
      }

      case 'workflow.node.started': {
        const nodeId = event.payload.nodeId

        if (!nodeId) {
          return state
        }

        return {
          ...state,
          nodes: {
            ...state.nodes,
            [nodeId]: {
              status: 'running',
              result: null,
              error: null,
              attempts: (state.nodes[nodeId]?.attempts ?? 0) + 1,
            } satisfies NodeState,
          },
          runningNodes: state.runningNodes.includes(nodeId)
            ? state.runningNodes
            : [...state.runningNodes, nodeId],
          needsSchedule: false,
        }
      }

      case 'workflow.node.finished': {
        const { nodeId, result, error, branch } = event.payload

        if (!nodeId) {
          return state
        }

        const failed = Predicate.isString(error) && error.length > 0
        return {
          ...stopNode(state, nodeId),
          nodes: {
            ...state.nodes,
            [nodeId]: {
              status: failed ? 'failed' : 'completed',
              result: result ?? null,
              error: failed ? error : null,
              attempts: state.nodes[nodeId]?.attempts ?? 1,
              branch,
            } satisfies NodeState,
          },
          pendingEmits: state.pendingEmits.filter((item) => item.id !== `finished_${nodeId}`),
          error: failed ? error : state.error,
          needsSchedule: true,
        }
      }

      case 'workflow.node.skipped': {
        const { nodeId, reason, cause } = event.payload
        return {
          ...stopNode(state, nodeId),
          nodes: {
            ...state.nodes,
            [nodeId]: {
              status: 'skipped',
              result: null,
              error: reason,
              attempts: state.nodes[nodeId]?.attempts ?? 0,
              skipCause: cause,
            } satisfies NodeState,
          },
          needsSchedule: true,
        }
      }

      case 'workflow.spawn.requested': {
        const { nodeId } = event.payload

        if (!isCurrentAttempt(state, nodeId, event.payload.attempt)) {
          return state
        }

        return {
          ...state,
          pendingSpawns: [
            ...state.pendingSpawns.filter((item) => item.nodeId !== nodeId),
            event.payload,
          ],
        }
      }

      case 'workflow.map.requested': {
        const { nodeId } = event.payload

        if (!isCurrentAttempt(state, nodeId, event.payload.attempt)) {
          return state
        }

        return {
          ...state,
          pendingMaps: [
            ...state.pendingMaps.filter((item) => item.nodeId !== nodeId),
            {
              ...event.payload,
              nextIndex: Math.min(event.payload.concurrency, event.payload.items.length),
              outputs: {},
            },
          ],
        }
      }

      case 'workflow.sleep.requested': {
        const { waitId, wakeAt, nodeId } = event.payload

        if (!waitId || !Predicate.isNumber(wakeAt) || !nodeId) {
          return state
        }

        return {
          ...state,
          pendingSleeps: [
            ...state.pendingSleeps.filter((item) => item.nodeId !== nodeId),
            { waitId, wakeAt, nodeId },
          ],
        }
      }

      case 'workflow.effects.requested': {
        const { nodeId, effects: rawEffects } = event.payload
        const effects: readonly RuntimeEffect[] = Array.isArray(rawEffects) ? rawEffects : []

        if (!nodeId) {
          return state
        }

        const attempts = state.nodes[nodeId]?.attempts ?? 1
        const key = nodeRunKey(nodeId, attempts, state.nodes[nodeId]?.iteration?.index)

        const taggedEffects = effects.map((effect, idx) => {
          if (effect.type === 'runtime.wait' && 'on' in effect) {
            const scope = { nodeId, attempt: attempts }
            const tag = Predicate.isObject(effect.tag) ? { ...effect.tag, ...scope } : scope
            return { ...effect, tag }
          }

          if (!('tag' in effect && Predicate.isString(effect.tag))) {
            return { ...effect, tag: `${key}_${effect.type}_${idx}` }
          }

          return effect
        })

        return {
          ...state,
          pendingEffects: [
            ...state.pendingEffects.filter((item) => item.nodeId !== nodeId),
            { nodeId, effects: taggedEffects },
          ],
        }
      }

      case 'runtime.effect.failed': {
        const error = event.payload.error || 'effect failed'

        if (isWithdrawnError(error)) {
          return state
        }

        const effectId = event.payload.effectId

        const nodeId = Predicate.isString(effectId)
          ? nodeIdForEffect(state, ctx.threadId, effectId)
          : null

        if (!nodeId) {
          return state
        }

        const message = `Node ${nodeId} failed: ${error}`

        return {
          ...finishNode(stopNode(state, nodeId), nodeId, null, message, ctx.threadId),
          nodes: {
            ...state.nodes,
            [nodeId]: {
              status: 'failed',
              result: null,
              error: message,
              attempts: state.nodes[nodeId]?.attempts,
            } satisfies NodeState,
          },
        }
      }

      case 'runtime.wait.satisfied': {
        const tag = event.payload.tag

        if (!isJsonObject(tag) || !Predicate.isString(tag.nodeId)) {
          return state
        }

        const nodeId = tag.nodeId

        if (!isCurrentAttempt(state, nodeId, tag.attempt)) {
          return state
        }

        const { result, error } = waitOutcome(event.payload.event, tag)
        const map = state.pendingMaps.find((item) => item.nodeId === nodeId)

        if (error === null && map && Predicate.isNumber(tag.index)) {
          return recordMapOutput(state, map, tag.index, result, ctx.threadId)
        }

        const node = state.nodes[nodeId]

        if (error === null && node && Predicate.isNumber(tag.loopIndex)) {
          return {
            ...state,
            nodes: {
              ...state.nodes,
              [nodeId]: { ...node, iteration: { index: tag.loopIndex + 1, previous: result } },
            },
            pendingSpawns: state.pendingSpawns.filter((item) => item.nodeId !== nodeId),
          }
        }

        return finishNode(state, nodeId, result, error, ctx.threadId)
      }

      default:
        return state
    }
  },
  effects(state, ctx) {
    const effects: RuntimeEffect[] = []

    if (state.needsSchedule) {
      effects.push(scheduleInvocation(state))
    }

    for (const item of nodeEffects(state, ctx.threadId)) {
      effects.push(item.effect)
    }

    for (const emitReq of state.pendingEmits) {
      effects.push(emit(emitReq.event))
    }

    if (state.status === 'failed') {
      effects.push(fail(state.error ?? 'Workflow execution failed'))
    }

    return effects
  },
})
