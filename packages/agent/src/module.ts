import { Layer } from 'effect'

import { defineModule, makeDefinitionStore } from '@looms/core'

import { agentSessionActionEffect, createAgentSessionThread } from './agent-session'
import type { AgentDefinition, AgentSessionDefinition } from './definitions'
import { AgentDefinitionsLive } from './definitions-store'
import { callLlmEffect, executeToolEffect } from './effects'
import { llmFromAdapter, LlmTag, StubLlmLive, type LlmAdapter, type StubLlmPolicy } from './llm'
import { conversation, tokenUsage } from './projections'
import { agentModule } from './scope'
import { agentThread } from './threads'

export interface AgentModuleOptions {
  readonly definitions?: readonly (AgentDefinition | AgentSessionDefinition)[]
  /** Model adapter used for every agent turn. Defaults to a deterministic stub for tests and scripted agents. */
  readonly llm?: LlmAdapter
  readonly llmPolicy?: StubLlmPolicy
}

export function agent(options: AgentModuleOptions = {}) {
  const definitions = options.definitions ?? []

  const agentDefinitions = definitions.filter(
    (definition): definition is AgentDefinition => definition.kind === 'agent',
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
      sessionAction: agentSessionActionEffect,
    },
    projections: {
      conversation,
      tokenUsage,
    },
    services: () => Layer.merge(llmLayer, AgentDefinitionsLive(agentDefinitions)),
  }))
}
