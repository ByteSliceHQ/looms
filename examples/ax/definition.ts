import { z } from 'zod'

import { approval, gate } from '@swirls/looms/approval'
import { createWaitId, defineModule, invoke, wait } from '@swirls/looms/core'
import { defineWorkflow, workflow } from '@swirls/looms/workflow'

import { AnalysisInput, AnalysisResult, localAnalysis } from './analysis'

export const repository = defineModule(
  {
    namespace: 'repository',
    protocolVersion: '1.0.0',
    events: { analyzed: AnalysisResult },
  },
  (m) => ({
    effects: {
      analyze: m.effect({
        type: 'repository.analyze.v1',
        input: AnalysisInput,
        retry: {
          maxAttempts: 3,
          backoffMs: 1_000,
          scheduleToStartTimeoutMs: 300_000,
          startToCloseTimeoutMs: 900_000,
          heartbeatTimeoutMs: 60_000,
          cancellationTimeoutMs: 60_000,
        },
        execute: localAnalysis,
      }),
    },
    projections: {
      report: m.projection({
        name: 'repository.report',
        shape: z.object({ analyses: z.array(AnalysisResult) }),
        initialState: { analyses: [] },
        reduce: (state, event) =>
          event.type === 'repository.analyzed'
            ? { analyses: [...state.analyses, event.payload] }
            : state,
      }),
    },
  }),
)

export const review = defineWorkflow({
  name: 'ax-repository-review',
  input: AnalysisInput,
  nodes: [
    {
      id: 'analyze',
      run: (ctx) =>
        ctx.effects([
          invoke(repository.effects.analyze, ctx.input),
          wait({
            waitId: createWaitId(ctx.nodeId, 'analyzed'),
            on: { type: 'repository.analyzed' },
          }),
        ]),
    },
    {
      id: 'review',
      deps: ['analyze'],
      run: (ctx) => ctx.effects(gate({ title: 'Accept repository analysis?' })),
    },
    {
      id: 'finish',
      deps: ['review'],
      run: (ctx) => ({
        accepted: z.object({ outcome: z.literal('approve') }).safeParse(ctx.results.review).success,
        report: ctx.results.analyze ?? null,
      }),
    },
  ],
  output: ({ results }) => results.finish ?? null,
})

export const modules = [repository, workflow({ definitions: [review] }), approval()]
