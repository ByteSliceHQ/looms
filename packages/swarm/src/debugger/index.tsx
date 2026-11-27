import type { DebuggerPlugin } from '@looms/debugger'

import { swarmStatus } from '../projections'
import { swarmBoard } from './board-fold'
import type { BoardReader } from './board-reader'
import { summarizeSwarmEvent } from './summarize'
import {
  createSwarmWorkspace,
  SwarmPanels,
  SwarmView,
  SwarmWorkspace,
  type SwarmBoardSource,
} from './swarm-view'

export type SwarmDebuggerOptions = SwarmBoardSource

/**
 * The swarm debugger plugin. Pass `board` to show each swarm's whole board, read live from the
 * board itself; without it the board panes show the board as the run pulled it.
 */
export function createSwarmDebugger(options: SwarmDebuggerOptions = {}): DebuggerPlugin {
  return {
    name: 'swarm',
    families: [{ family: 'swarm', color: 'oklch(0.76 0.13 160)', summarize: summarizeSwarmEvent }],
    workspace: { kinds: ['swarm'], component: createSwarmWorkspace(options) },
    headlessProjections: [swarmStatus.name],
  }
}

export const swarmDebugger: DebuggerPlugin = createSwarmDebugger()

export { SwarmPanels, SwarmView, SwarmWorkspace, swarmBoard, summarizeSwarmEvent }
export type { BoardReader }
export { applyEvents, boardTaskGroups, boardThreads, type SwarmBoard } from './board-fold'
export { followBoard, useLiveBoard, type LiveBoard } from './board-reader'
export type { SwarmBoardView } from './swarm-view'
