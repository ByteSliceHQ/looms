import { describe, expect, test } from 'bun:test'

import { createEvent } from '@looms/core'

import {
  defaultAgentCompactor,
  isContextOverflowError,
  STRUCTURED_OUTPUT_TOOL_NAME,
} from './definitions'
import { agentThread } from './threads'
import type { Message } from './types'

describe('agent parity', () => {
  describe('structured output', () => {
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
            name: STRUCTURED_OUTPUT_TOOL_NAME,
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

      expect(isContextOverflowError(new Error('Maximum call stack size: stack overflow'))).toBe(
        false,
      )
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

  describe('default compactor', () => {
    test('keeps the task and never strands a tool result without its request', () => {
      const messages: Message[] = [
        { role: 'user', content: 'task' },
        { role: 'assistant', content: 'thinking' },
        { role: 'user', content: 'more' },
        {
          role: 'assistant',
          content: '',
          toolCalls: [
            { id: 'a', name: 'lookup', arguments: {} },
            { id: 'b', name: 'lookup', arguments: {} },
          ],
        },
        { role: 'tool', content: '1', toolCallId: 'a' },
        { role: 'tool', content: '2', toolCallId: 'b' },
        { role: 'assistant', content: 'answer' },
        { role: 'user', content: 'follow up' },
      ]

      const compacted = defaultAgentCompactor({
        threadId: 'thr_1',
        turn: 5,
        messages,
        reason: 'overflow',
      })

      expect(compacted.messages[0]).toEqual({ role: 'user', content: 'task' })
      expect(compacted.messages[1]).toEqual({ role: 'system', content: compacted.summary })
      expect(compacted.messages.slice(2)).toEqual(messages.slice(3))
    })

    test('leaves a short conversation unchanged', () => {
      const messages: Message[] = [
        { role: 'user', content: 'task' },
        { role: 'assistant', content: 'answer' },
      ]

      expect(
        defaultAgentCompactor({ threadId: 'thr_1', turn: 1, messages, reason: 'overflow' }),
      ).toEqual({ messages })
    })
  })

  describe('team member depth', () => {
    test('depth comes from agent.lineage and the input is left untouched', () => {
      const input = { task: 'subtask' }
      const ctx = { threadId: 'thr_child', runId: 'run_1', parentThreadId: 'thr_lead' }

      let state = agentThread.initialState({
        definitionName: 'subagent',
        definitionVersion: 'v1',
        input,
      })

      state = agentThread.step(
        state,
        createEvent('run_1', {
          type: 'runtime.thread.started',
          payload: { definitionName: 'subagent', definitionVersion: 'v1', input },
          threadId: 'thr_child',
          origin: { type: 'system' },
        }),
        ctx,
      )

      state = agentThread.step(
        state,
        createEvent('run_1', {
          type: 'agent.lineage',
          payload: { depth: 2 },
          threadId: 'thr_child',
          origin: { type: 'system' },
        }),
        ctx,
      )

      expect(state.depth).toBe(2)
      expect(state.input).toEqual(input)
      expect(state.lines).toEqual([{ role: 'user', content: 'subtask' }])
    })
  })
})
