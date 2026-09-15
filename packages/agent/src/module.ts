import { Layer } from 'effect'

import { defineModule } from '@looms/core'

import type { AgentDefinition } from './definitions'
import { AgentDefinitionsLive } from './definitions-store'
import { callLlmEffect, executeToolEffect } from './effects'
import { llmFromAdapter, LlmTag, StubLlmLive, type LlmAdapter, type StubLlmPolicy } from './llm'
import { conversation, tokenUsage } from './projections'
import { agentModule } from './scope'
import { agentThread } from './threads'

export interface AgentModuleOptions {
  readonly definitions?: readonly AgentDefinition[]
  /** Model adapter used for every agent turn. Defaults to a deterministic stub for tests and scripted agents. */
  readonly llm?: LlmAdapter
  readonly llmPolicy?: StubLlmPolicy
}

export function agent(options: AgentModuleOptions = {}) {
  const definitions = options.definitions ?? []
  const llmLayer = options.llm
    ? Layer.succeed(LlmTag, llmFromAdapter(options.llm))
    : StubLlmLive(options.llmPolicy)

  return defineModule(agentModule, () => ({
    definitions,
    threads: { agent: agentThread },
    effects: {
      callLLM: callLlmEffect,
      executeTool: executeToolEffect,
    },
    projections: {
      conversation,
      tokenUsage,
    },
    services: () => Layer.merge(llmLayer, AgentDefinitionsLive(definitions)),
  }))
}
