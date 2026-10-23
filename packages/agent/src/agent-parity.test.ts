import { describe, expect, test } from 'bun:test'

import { Schema } from 'effect'

import { createEvent } from '@looms/core'

import {
  asAgentTool,
  defineAgent,
  defineTool,
  isContextOverflowError,
  STRUCTURED_OUTPUT_TOOL_NAME,
  TEAM_MEMBER_MAX_DEPTH,
} from './definitions'
import { agentCatalog } from './events'
import { agentThread } from './threads'

describe('agent parity', () => {
  describe('structured output', () => {
    test('defines submit_output tool matching output schema', () => {
      const OutputSchema = Schema.Struct({
        answer: Schema.String,
        confidence: Schema.Finite,
      })

      const agent = defineAgent({
        name: 'structured-agent',
        instructions: 'Answer with structured data',
        output: OutputSchema,
      })

      expect(agent.output).toBeDefined()
      expect(STRUCTURED_OUTPUT_TOOL_NAME).toBe('submit_output')
    })

    test('agent thread records structured output when submit_output succeeds', () => {
      let state = agentThread.initialState({
        definitionName: 'structured-agent',
        definitionVersion: 'v1',
        input: 'solve problem',
      })

      state = agentThread.step(
        state,
        createEvent('run_1', {
          type: 'runtime.thread.started',
          payload: {
            definitionName: 'structured-agent',
            definitionVersion: 'v1',
            input: 'solve problem',
          },
          threadId: 'thr_1',
          origin: { type: 'system' },
        }),
        { threadId: 'thr_1', runId: 'run_1' },
      )

      state = agentThread.step(
        state,
        createEvent('run_1', {
          type: 'agent.tool.result',
          payload: {
            turn: 1,
            toolCallId: 'call_1',
            name: 'submit_output',
            result: { accepted: true, output: { answer: '42', confidence: 0.99 } },
            error: null,
          },
          threadId: 'thr_1',
          origin: { type: 'system' },
        }),
        { threadId: 'thr_1', runId: 'run_1' },
      )

      expect(state.structuredOutput).toEqual({ answer: '42', confidence: 0.99 })
    })
  })

  describe('context compaction', () => {
    test('detects context overflow errors', () => {
      expect(isContextOverflowError(new Error('context window exceeded'))).toBe(true)
      expect(isContextOverflowError(new Error('maximum context length is 4096 tokens'))).toBe(true)
      expect(isContextOverflowError(new Error('Prompt too long for this model'))).toBe(true)
      expect(isContextOverflowError(new Error('rate limit reached'))).toBe(false)
    })

    test('step updates lines when agent.context.compacted event is applied', () => {
      let state = agentThread.initialState({
        definitionName: 'agent_1',
        definitionVersion: 'v1',
        input: 'hello',
      })

      state = agentThread.step(
        state,
        createEvent('run_1', {
          type: 'runtime.thread.started',
          payload: {
            definitionName: 'agent_1',
            definitionVersion: 'v1',
            input: 'hello',
          },
          threadId: 'thr_1',
          origin: { type: 'system' },
        }),
        { threadId: 'thr_1', runId: 'run_1' },
      )

      // Add messages
      state = agentThread.step(
        state,
        createEvent('run_1', {
          type: 'agent.message',
          payload: {
            turn: 1,
            message: { role: 'assistant', content: 'hello back' },
          },
          threadId: 'thr_1',
          origin: { type: 'system' },
        }),
        { threadId: 'thr_1', runId: 'run_1' },
      )

      expect(state.lines).toHaveLength(2)

      // Apply context compacted event
      state = agentThread.step(
        state,
        createEvent('run_1', {
          type: 'agent.context.compacted',
          payload: {
            turn: 2,
            originalCount: 2,
            compactedCount: 1,
            summary: '[compacted]',
            reason: 'overflow',
            messages: [{ role: 'system', content: '[compacted]' }],
          },
          threadId: 'thr_1',
          origin: { type: 'system' },
        }),
        { threadId: 'thr_1', runId: 'run_1' },
      )

      expect(state.lines).toEqual([{ role: 'system', content: '[compacted]' }])
      expect(state.alreadyCompactedTurns).toEqual([2])
    })
  })

  describe('dynamic tool sets', () => {
    test('accepts resolveTools on agent definition', () => {
      const dynamicTool = defineTool({
        name: 'dynamic_calculator',
        description: 'Dynamic math tool',
        handler: () => 'result',
      })

      const agent = defineAgent({
        name: 'dynamic-tools-agent',
        instructions: 'Use tools dynamically',
        resolveTools: (_ctx) => [dynamicTool],
      })

      expect(agent.resolveTools).toBeDefined()
    })
  })

  describe('usage hooks and credit gate', () => {
    test('catalog validates turn.usage payload', () => {
      const payload = { turn: 1, input: 100, output: 50 }
      const schema = agentCatalog.entries['turn.usage']
      const decoded = Schema.decodeSync(schema)(payload)

      expect(decoded.input).toBe(100)
      expect(decoded.output).toBe(50)
    })

    test('accepts assertCredits and trackUsage on agent definition', async () => {
      let creditsChecked = false
      let trackedTokens = 0

      const agent = defineAgent({
        name: 'metered-agent',
        instructions: 'Metered usage',
        assertCredits: () => {
          creditsChecked = true
        },
        trackUsage: (usage) => {
          trackedTokens += usage.input + usage.output
        },
      })

      expect(agent.assertCredits).toBeDefined()
      expect(agent.trackUsage).toBeDefined()

      await agent.assertCredits?.({
        threadId: 't1',
        turn: 1,
        messages: [],
        input: null,
        tools: [],
        instructions: '',
      })

      await agent.trackUsage?.(
        { input: 10, output: 20, turn: 1 },
        {
          threadId: 't1',
          turn: 1,
          messages: [],
          input: null,
          tools: [],
          instructions: '',
        },
      )

      expect(creditsChecked).toBe(true)
      expect(trackedTokens).toBe(30)
    })
  })

  describe('subagent depth limit', () => {
    test('TEAM_MEMBER_MAX_DEPTH is 3', () => {
      expect(TEAM_MEMBER_MAX_DEPTH).toBe(3)
    })

    test('asAgentTool inherits or defaults correctly', () => {
      const childAgent = defineAgent({
        name: 'researcher',
        instructions: 'Do research',
      })

      const tool = asAgentTool({ agent: childAgent })
      expect(tool.childName).toBe('researcher')
      expect(tool.childKind).toBe('agent')
    })

    test('step extracts depth from input and increments for spawn', () => {
      let state = agentThread.initialState({
        definitionName: 'parent-agent',
        definitionVersion: 'v1',
        input: { task: 'lead team', agentDepth: 2 },
      })

      state = agentThread.step(
        state,
        createEvent('run_1', {
          type: 'runtime.thread.started',
          payload: {
            definitionName: 'parent-agent',
            definitionVersion: 'v1',
            input: { task: 'lead team', agentDepth: 2 },
          },
          threadId: 'thr_lead',
          origin: { type: 'system' },
        }),
        { threadId: 'thr_lead', runId: 'run_1' },
      )

      expect(state.depth).toBe(2)

      state = agentThread.step(
        state,
        createEvent('run_1', {
          type: 'agent.spawn.requested',
          payload: {
            childThreadId: 'thr_child',
            kind: 'agent',
            definitionName: 'subagent',
            definitionVersion: 'v1',
            toolCallId: 'call_sub',
            input: { task: 'subtask' },
          },
          threadId: 'thr_lead',
          origin: { type: 'system' },
        }),
        { threadId: 'thr_lead', runId: 'run_1' },
      )

      expect(state.pendingSpawns[0]?.depth).toBe(3)
    })
  })
})
