import { defineRuntimeModule, fromJsonStruct, type ModuleServicesContext } from '@looms/core'
import { Layer } from 'effect'
import { agentCatalog } from './catalog'
import type { AgentDefinition } from './definitions'
import { AgentDefinitionsLive } from './definitions-store'
import { agentThread } from './thread'
import { bindAgentThread, callLlmEffect, executeToolEffect } from './effects'
import { llmFromAdapter, LlmTag, StubLlmLive, type LlmAdapter, type StubLlmPolicy } from './llm'
import { conversation, tokenUsage } from './projections'
import type { AgentState } from './types'

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
    bindThread: (record) => {
      if (record.kind !== 'agent') return
      const state = fromJsonStruct<AgentState>(record.state)
      bindAgentThread(record.threadId, {
        definitionName: record.definitionName,
        lines: state.lines ?? [],
        input: record.input,
      })
    },
  })
}
