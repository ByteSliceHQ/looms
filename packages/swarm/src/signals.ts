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

/** Stop waking members. The swarm completes once the members that are mid-run have finished. */
export const stop = swarmModule.signal({
  description: 'Stop waking members and complete once running members finish.',
  build: () => swarmModule.input('stopped', {}),
})
