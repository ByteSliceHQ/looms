import { describe, expect, test } from 'bun:test'
import { defineWorkflow, event, reduceActor } from '@looms/core'
import { Effect, Schema } from 'effect'
import { executeWorkflowNode } from './execute'
import { scheduleWorkflow } from './schedule'

const NodeIdPayloadSchema = Schema.Struct({
  nodeId: Schema.String,
})

const FinishedResultPayloadSchema = Schema.Struct({
  result: Schema.Struct({
    n: Schema.Number,
  }),
})

describe('@looms/workflow', () => {
  test('schedule emits node.started for ready nodes', () => {
    const def = defineWorkflow({
      name: 'pipe',
      nodes: [
        { id: 'a', run: () => 1 },
        { id: 'b', deps: ['a'], run: () => 2 },
      ],
    })
    const actorId = 'wf1'
    const state = reduceActor(
      [
        {
          ...event('actor.started', actorId, {
            kind: 'workflow',
            definitionName: 'pipe',
            input: null,
            parentActorId: null,
            nodeIds: ['a', 'b'],
          }),
          seq: 1,
        },
      ],
      { kind: 'workflow', nodeIds: ['a', 'b'] },
    )
    if (state.kind !== 'workflow') throw new Error('expected workflow')
    const events = scheduleWorkflow(def, state)
    expect(events.map((e) => e.type)).toEqual(['workflow.node.started'])
    const started = events[0]
    expect(started).toBeDefined()
    const payload = Schema.decodeUnknownSync(NodeIdPayloadSchema)(started!.payload)
    expect(payload.nodeId).toBe('a')
  })

  test('execute node value result', async () => {
    const def = defineWorkflow({
      name: 'one',
      nodes: [{ id: 'a', run: () => ({ n: 42 }) }],
    })
    const actorId = 'wf2'
    const state = reduceActor(
      [
        {
          ...event('actor.started', actorId, {
            kind: 'workflow',
            definitionName: 'one',
            input: null,
            parentActorId: null,
            nodeIds: ['a'],
          }),
          seq: 1,
        },
        { ...event('workflow.node.started', actorId, { nodeId: 'a' }), seq: 2 },
      ],
      { kind: 'workflow', nodeIds: ['a'] },
    )
    if (state.kind !== 'workflow') throw new Error('expected workflow')
    const result = await Effect.runPromise(executeWorkflowNode(def, state, 'a'))
    const finished = result.events[0]
    expect(finished?.type).toBe('workflow.node.finished')
    const payload = Schema.decodeUnknownSync(FinishedResultPayloadSchema)(finished!.payload)
    expect(payload.result).toEqual({ n: 42 })
  })

  test('execute node review result', async () => {
    const def = defineWorkflow({
      name: 'hitl',
      nodes: [
        {
          id: 'review',
          run: (ctx) => ctx.requestReview({ title: 'OK?' }),
        },
      ],
    })
    const actorId = 'wf3'
    const state = reduceActor(
      [
        {
          ...event('actor.started', actorId, {
            kind: 'workflow',
            definitionName: 'hitl',
            input: null,
            parentActorId: null,
            nodeIds: ['review'],
          }),
          seq: 1,
        },
        { ...event('workflow.node.started', actorId, { nodeId: 'review' }), seq: 2 },
      ],
      { kind: 'workflow', nodeIds: ['review'] },
    )
    if (state.kind !== 'workflow') throw new Error('expected workflow')
    const result = await Effect.runPromise(executeWorkflowNode(def, state, 'review'))
    expect(result.events[0]?.type).toBe('review.requested')
  })
})
