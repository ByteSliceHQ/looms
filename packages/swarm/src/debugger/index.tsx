import type { DebuggerPlugin } from '@looms/debugger'

import { swarmStatus } from '../projections'
import { swarmBoard } from './board-fold'
import { summarizeSwarmEvent } from './summarize'
import { SwarmPanels, SwarmView, SwarmWorkspace } from './swarm-view'

export const swarmDebugger: DebuggerPlugin = {
  name: 'swarm',
  families: [{ family: 'swarm', color: 'oklch(0.76 0.13 160)', summarize: summarizeSwarmEvent }],
  workspace: { kinds: ['swarm'], component: SwarmWorkspace },
  headlessProjections: [swarmStatus.name],
}

export { SwarmPanels, SwarmView, SwarmWorkspace, swarmBoard, summarizeSwarmEvent }
export { boardTaskGroups, boardThreads, type SwarmBoard } from './board-fold'
