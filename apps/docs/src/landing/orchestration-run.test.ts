import { describe, expect, test } from 'bun:test'

import { project, threadTree, toThreadTree } from '@looms/core'
import { projectRunView, runStatusFromEvents } from '@looms/debugger'

import {
  ANALYST_THREAD_ID,
  COMMANDER_THREAD_ID,
  landingOrchestrationEvents,
  PLANNER_THREAD_ID,
  RESEARCHER_THREAD_ID,
  RISK_REVIEWER_THREAD_ID,
} from './orchestration-run'

describe('landingOrchestrationEvents', () => {
  test('is a monotonic, complete multi-agent run', () => {
    expect(landingOrchestrationEvents.length).toBeGreaterThan(40)

    for (const [index, event] of landingOrchestrationEvents.entries()) {
      expect(event.seq).toBe(index + 1)
      expect(event.id).toBe(`evt_landing_${event.seq}`)

      if (index > 0) {
        expect(event.ts).toBeGreaterThan(landingOrchestrationEvents[index - 1]!.ts)
      }
    }

    expect(runStatusFromEvents(landingOrchestrationEvents)).toBe('completed')
    expect(landingOrchestrationEvents.at(-1)?.type).toBe('runtime.run.completed')
  })

  test('includes streamed deltas, realistic timing, and an approval wait', () => {
    const deltas = landingOrchestrationEvents.filter(
      (event) => event.type === 'agent.turn.text_delta',
    )

    const gaps = landingOrchestrationEvents
      .slice(1)
      .map((event, index) => event.ts - landingOrchestrationEvents[index]!.ts)

    expect(deltas.length).toBeGreaterThanOrEqual(4)
    expect(deltas.every((event) => event.ephemeral)).toBe(true)
    expect(new Set(gaps).size).toBeGreaterThan(5)
    expect(Math.max(...gaps)).toBeGreaterThanOrEqual(1_500)

    const waiting = projectRunView(landingOrchestrationEvents.slice(0, 37))

    const plannerWaiting = waiting.tree.root?.children.find(
      (child) => child.threadId === PLANNER_THREAD_ID,
    )

    expect(plannerWaiting?.status).toBe('waiting')

    const resumed = projectRunView(landingOrchestrationEvents.slice(0, 39))

    const plannerResumed = resumed.tree.root?.children.find(
      (child) => child.threadId === PLANNER_THREAD_ID,
    )

    expect(plannerResumed?.status).toBe('running')
  })

  test('projects parallel agents and a nested risk reviewer', () => {
    const afterCommander = toThreadTree(project(threadTree, landingOrchestrationEvents.slice(0, 2)))

    expect(afterCommander.root?.definitionName).toBe('incident-commander')
    expect(afterCommander.root?.children).toEqual([])

    const afterParallelSpawn = projectRunView(landingOrchestrationEvents.slice(0, 14))

    expect(afterParallelSpawn.tree.root?.children.map((child) => child.threadId)).toEqual([
      RESEARCHER_THREAD_ID,
      ANALYST_THREAD_ID,
      PLANNER_THREAD_ID,
    ])

    const afterRiskReview = projectRunView(landingOrchestrationEvents.slice(0, 22))

    expect(
      afterRiskReview.tree.root?.children
        .find((child) => child.threadId === PLANNER_THREAD_ID)
        ?.children.map((child) => child.threadId),
    ).toEqual([RISK_REVIEWER_THREAD_ID])

    const parallelToolCalls = landingOrchestrationEvents.slice(17, 20).map((event) => event.type)

    expect(parallelToolCalls).toEqual([
      'agent.tool_call.requested',
      'agent.tool_call.requested',
      'agent.tool_call.requested',
    ])

    expect(landingOrchestrationEvents[24]?.causationId).toBe('evt_landing_18')
    expect(landingOrchestrationEvents[25]?.causationId).toBe('evt_landing_19')

    const complete = projectRunView(landingOrchestrationEvents)

    expect(complete.runId).toBe(landingOrchestrationEvents[0]!.runId)
    expect(complete.tree.root?.threadId).toBe(COMMANDER_THREAD_ID)
    expect(complete.tree.root?.children).toHaveLength(3)
    expect(complete.tree.root?.children.every((child) => child.status === 'completed')).toBe(true)
    expect(complete.tree.root?.status).toBe('completed')
    expect(complete.runStatus).toBe('completed')
  })
})
