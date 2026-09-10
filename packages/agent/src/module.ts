import { Layer } from 'effect'

import { defineRuntimeModule, type ModuleServicesContext } from '@looms/core'

import { agentCatalog } from './events'
import type { AgentDefinition } from './definitions'
import { AgentDefinitionsLive } from './definitions-store'
import { callLlmEffect, executeToolEffect } from './effects'
import { llmFromAdapter, LlmTag, StubLlmLive, type LlmAdapter, type StubLlmPolicy } from './llm'
import { conversation, tokenUsage } from './projections'
import { agentThread } from './threads'

export interface AgentModuleOptions {
  /** Model adapter used for every agent turn. Defaults to a deterministic stub for tests and scripted agents. */
  readonly llm?: LlmAdapter
  readonly llmPolicy?: StubLlmPolicy
}

function agentDefinitions(ctx: ModuleServicesContext): AgentDefinition[] {
  const found: AgentDefinition[] = []
  for (const registered of ctx.definitions) {
    if (registered.value.kind !== 'agent') continue
    // SAFETY: definitions with kind 'agent' are produced by defineAgent.
    found.push(registered.value as AgentDefinition)
  }
  return found
}

export function agent(options: AgentModuleOptions = {}) {
  const llmLayer = options.llm
    ? Layer.succeed(LlmTag, llmFromAdapter(options.llm))
    : StubLlmLive(options.llmPolicy)
  return defineRuntimeModule({
    namespace: 'agent',
    protocolVersion: '1.0.0',
    events: agentCatalog,
    threads: { agent: agentThread },
    effects: {
      callLLM: callLlmEffect,
      executeTool: executeToolEffect,
    },
    projections: {
      conversation,
      tokenUsage,
    },
    services: (ctx) => Layer.merge(llmLayer, AgentDefinitionsLive(agentDefinitions(ctx))),
  })
}
