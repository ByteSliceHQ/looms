import { Layer, Predicate } from 'effect'

import { defineModule, makeDefinitionStore, type EventInput } from '@looms/core'

import { createAgentSessionThread } from './agent-session'
import type { AgentDefinition, AgentSessionDefinition } from './definitions'
import { AgentDefinitionsLive } from './definitions-store'
import { callLlmEffect, executeToolEffect } from './effects'
import { llmFromAdapter, LlmTag, StubLlmLive, type LlmAdapter, type StubLlmPolicy } from './llm'
import { conversation, tokenUsage, turnActivity } from './projections'
import { agentModule } from './scope'
import {
  agentSessionMessageEvents,
  cancelAgentTurn,
  steer,
  stopAgentTurn,
  submitAgentMessage,
  userMessage,
} from './signals'
import { agentThread } from './threads'

export interface AgentModuleOptions {
  readonly definitions?: readonly (AgentDefinition | AgentSessionDefinition)[]
  /** Model adapter used for every agent turn. Defaults to a deterministic stub for tests and scripted agents. */
  readonly llm?: LlmAdapter
  readonly llmPolicy?: StubLlmPolicy
}

export function agent(options: AgentModuleOptions = {}) {
  const definitions = options.definitions ?? []

  const agentDefinitions = makeDefinitionStore(
    'agent',
    definitions.filter((definition): definition is AgentDefinition => definition.kind === 'agent'),
  )

  const sessionDefinitions = makeDefinitionStore(
    'agent-session',
    definitions.filter(
      (definition): definition is AgentSessionDefinition => definition.kind === 'agent-session',
    ),
  )

  const llmLayer = options.llm
    ? Layer.succeed(LlmTag, llmFromAdapter(options.llm))
    : StubLlmLive(options.llmPolicy)

  return defineModule(agentModule, () => ({
    definitions,
    threads: {
      agent: agentThread,
      'agent-session': createAgentSessionThread(sessionDefinitions),
    },
    effects: {
      callLLM: callLlmEffect,
      executeTool: executeToolEffect,
    },
    projections: {
      conversation,
      tokenUsage,
      turnActivity,
    },
    signals: {
      userMessage,
      steer,
      stopAgentTurn,
      submitAgentMessage,
      cancelAgentTurn,
      agentSessionMessageEvents,
    },
    examples: [
      {
        name: 'a reply updates conversation and token usage',
        events: [
          userMessage('Hello'),
          agentModule.input('message', {
            turn: 1,
            message: { role: 'assistant', content: 'Hi there' },
            usage: { input: 4, output: 2 },
          }),
        ],
        projections: {
          conversation: {
            lines: [
              { role: 'user', content: 'Hello' },
              { role: 'assistant', content: 'Hi there' },
            ],
          },
          tokenUsage: { input: 4, output: 2 },
        },
      },
    ],
    services: () => Layer.merge(llmLayer, AgentDefinitionsLive(agentDefinitions)),
    interruptsOnSignal,
    bindHost(host) {
      agentDefinitions.useResolver(host.definitionResolver)
      sessionDefinitions.useResolver(host.definitionResolver)
    },
  }))
}

/** A stop or an interrupting steer abandons the turn in progress on its thread. */
function interruptsOnSignal(event: EventInput): readonly string[] {
  const abandonsTurn =
    event.type === 'agent.turn.stopped' ||
    (event.type === 'agent.steered' &&
      Predicate.isObject(event.payload) &&
      event.payload.interrupt === true)

  return abandonsTurn && event.threadId ? [event.threadId] : []
}
