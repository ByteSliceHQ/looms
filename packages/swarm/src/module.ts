import { defineModule, makeDefinitionStore } from '@looms/core'

import type { BoardResolver, MessageBoard } from './board'
import type { SwarmDefinition } from './definitions'
import {
  activateEffect,
  claimTaskEffect,
  createTaskEffect,
  labelEffect,
  listTasksEffect,
  postEffect,
  pullEffect,
  readEffect,
  replyEffect,
  settleTaskEffect,
  viewEffect,
} from './effects'
import { swarmStatus } from './projections'
import { swarmModule } from './scope'
import { SwarmServicesLive, memoryBoards } from './services'
import { nudge, stop } from './signals'
import { createTask, post } from './steps'
import { createSwarmThread } from './threads'

export interface SwarmModuleOptions {
  readonly definitions?: readonly SwarmDefinition[]
  /** One board shared by every swarm on this host, whatever board id a swarm names. */
  readonly board?: MessageBoard
  /**
   * Looks a board up by id, for a host that keeps a board per tenant. Takes precedence over
   * `board`. With neither, boards are held in memory and do not survive a restart.
   */
  readonly boards?: BoardResolver
}

export function swarm(options: SwarmModuleOptions = {}) {
  const listed = options.definitions ?? []
  const definitions = makeDefinitionStore('swarm', listed)
  const shared = options.board
  const boards = options.boards ?? (shared ? () => shared : memoryBoards())

  return defineModule(swarmModule, () => ({
    definitions: listed,
    threads: { swarm: createSwarmThread(definitions) },
    effects: {
      pull: pullEffect,
      activate: activateEffect,
      post: postEffect,
      reply: replyEffect,
      read: readEffect,
      view: viewEffect,
      label: labelEffect,
      createTask: createTaskEffect,
      listTasks: listTasksEffect,
      claimTask: claimTaskEffect,
      settleTask: settleTaskEffect,
    },
    projections: { swarmStatus },
    signals: { nudge, stop },
    steps: { post, createTask },
    examples: [
      {
        name: 'an activation marks the member active until its run settles',
        events: [
          swarmModule.input('board.pulled', {
            board: 'acme',
            pull: 0,
            cursor: '000000000001',
            events: [
              {
                cursor: '000000000001',
                type: 'message.posted',
                at: 1_000,
                by: 'dana',
                message: {
                  id: 'msg_1',
                  channel: 'support',
                  text: '@triage a customer cannot log in',
                  by: 'dana',
                  re: null,
                  mentions: ['triage'],
                  labels: {},
                  attachments: [],
                  createdAt: 1_000,
                },
              },
            ],
            more: false,
            nextPullAt: null,
          }),
          swarmModule.input('member.activated', {
            board: 'acme',
            member: 'triage',
            activation: 1,
            runId: 'swarm_acme:triage:1',
            events: 1,
            at: 1_001,
          }),
        ],
        projections: {
          swarmStatus: {
            status: 'running',
            board: 'acme',
            cursor: '000000000001',
            eventsRead: 1,
            members: {
              triage: {
                status: 'active',
                activations: 1,
                runId: 'swarm_acme:triage:1',
                lastOutcome: null,
              },
            },
            recent: [{ member: 'triage', runId: 'swarm_acme:triage:1', events: 1, at: 1_001 }],
          },
        },
      },
    ],
    services: () => SwarmServicesLive(definitions, boards),
    bindHost(host) {
      definitions.useResolver(host.definitionResolver)
    },
  }))
}
