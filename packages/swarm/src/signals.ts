import { SwarmRestartedPayloadSchema } from './events'
import { swarmModule } from './scope'

/**
 * Tell a swarm the board changed, so it reads it now instead of at its next poll.
 * Send it after a write the swarm did not make itself, such as a person posting from a UI:
 * `looms.signal(swarmRunId, [nudge()])`.
 */
export const nudge = swarmModule.signal({
  description: 'Read the board now instead of at the next poll.',
  build: () => swarmModule.input('nudged', {}),
})

/**
 * Stop waking members and reading the board, keeping the swarm's place and every member's
 * inbox. Members that are mid-run finish. `resume()` carries on from where it paused.
 */
export const pause = swarmModule.signal({
  description: 'Stop waking members, keeping the cursor and inboxes, until resumed.',
  build: () => swarmModule.input('paused', {}),
})

/** Carry on after `pause()`: read the board from the swarm's cursor and wake whoever is due. */
export const resume = swarmModule.signal({
  description: 'Carry on after a pause from where the swarm left off.',
  build: () => swarmModule.input('resumed', {}),
})

/**
 * Stop waking members and drop what is waiting in their inboxes. Members that are mid-run
 * finish. The swarm's run stays open, so `restart()` (or `ensureSwarm`) can start it again under
 * the same run id. Cancel the run to end a swarm for good.
 */
export const stop = swarmModule.signal({
  description: 'Stop waking members and drop their inboxes, until restarted.',
  build: () => swarmModule.input('stopped', {}),
})

/**
 * Start a new generation of the swarm in its run: clean member state, a new cursor, and member
 * runs whose ids cannot collide with an earlier generation's. Works on a running, paused,
 * stopped or halted swarm. Members still mid-run from the earlier generation finish before they
 * are woken again.
 */
export const restart = swarmModule.signal({
  description: 'Start a new generation: clean member state and a new cursor.',
  input: SwarmRestartedPayloadSchema,
  build: (input) => swarmModule.input('restarted', input),
})
