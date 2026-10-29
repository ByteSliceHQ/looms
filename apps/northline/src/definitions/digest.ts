import { createWaitId, invoke, wait } from '@swirls/looms/core'
import { cron, defineSchedule } from '@swirls/looms/schedule'
import { defineWorkflow } from '@swirls/looms/workflow'

import { composeDigest } from '../modules/shipments'
import { DigestInput } from '../modules/shipments/events'

/** Stable run id so a deploy can ensure this schedule in place. */
export const MORNING_SWEEP_RUN_ID = 'northline-morning-sweep'

export const laneDigest = defineWorkflow({
  name: 'lane-digest',
  description: 'Counts open exceptions by destination for the morning sweep',
  input: DigestInput,
  nodes: [
    {
      id: 'compose',
      run: (ctx) =>
        ctx.effects([
          invoke(composeDigest, { at: ctx.input.at }, `digest_${ctx.nodeId}`),
          wait({
            waitId: createWaitId(ctx.nodeId, 'digest'),
            on: { type: 'shipments.digest.ready' },
          }),
        ]),
    },
  ],
  output: ({ results }) => results.compose ?? null,
})

/** Weekday morning in US Central, expressed in UTC. Fires start a lane digest. */
export const morningSweep = defineSchedule({
  name: 'morning-sweep',
  description: 'Weekday count of open exceptions by destination',
  target: laneDigest,
  spec: cron('0 13 * * 1-5', { tz: 'UTC' }),
  input: ({ at }) => ({ at }),
})
