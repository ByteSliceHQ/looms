import type { LlmAdapter, LlmCompleteArgs, AgentTurnResult } from '@swirls/looms/agent'
import { isJsonObject, isJsonString } from '@swirls/looms/core'

function extractText(messages: LlmCompleteArgs['messages']): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const item = messages[i]

    if (item?.role === 'user' && item.content) {
      try {
        const parsed: unknown = JSON.parse(item.content)

        if (isJsonObject(parsed) && isJsonString(parsed.task)) {
          return parsed.task
        }

        if (isJsonObject(parsed) && isJsonString(parsed.topic)) {
          return parsed.topic
        }

        if (isJsonObject(parsed) && isJsonString(parsed.text)) {
          return parsed.text
        }
      } catch {
        // use raw content
      }

      return item.content
    }
  }

  return 'telemetry analysis'
}

function hasTool(tools: LlmCompleteArgs['tools'], name: string): boolean {
  return tools.some((tool) => tool.name === name)
}

function toolResults(
  messages: LlmCompleteArgs['messages'],
): Array<{ name?: string; content: string }> {
  const results: Array<{ name?: string; content: string }> = []

  for (const msg of messages) {
    if (msg.role === 'tool') {
      results.push({ name: msg.name, content: msg.content })
    }
  }

  return results
}

function refundArguments(text: string) {
  const amountMatch = text.match(/\b(\d+(?:\.\d+)?)\b/)
  return { amount: amountMatch ? Number(amountMatch[1]) : 40, reason: text }
}

function emitDelta(
  args: LlmCompleteArgs,
  delta: string,
  result: AgentTurnResult,
): Promise<AgentTurnResult> {
  return Promise.resolve(args.onTextDelta?.(delta)).then(() => result)
}

export const demoLlm: LlmAdapter = {
  complete(args: LlmCompleteArgs): Promise<AgentTurnResult> {
    const results = toolResults(args.messages)
    const taskOrTopic = extractText(args.messages)

    // 1. Assistant Agent
    if (hasTool(args.tools, 'specialist')) {
      if (results.length === 0) {
        const lower = taskOrTopic.toLowerCase()

        if (lower.includes('greet') && hasTool(args.tools, 'greet')) {
          return emitDelta(args, 'Calling the greeting tool…', {
            message: {
              role: 'assistant',
              content: '',
              toolCalls: [{ id: 'tc_greet', name: 'greet', arguments: { name: 'Ada' } }],
            },
            toolCalls: [{ id: 'tc_greet', name: 'greet', arguments: { name: 'Ada' } }],
          })
        }

        if (
          lower.includes('refund') &&
          /\b(score|evaluate|assess|risk)\b/.test(lower) &&
          hasTool(args.tools, 'triage_refund')
        ) {
          const scoreArgs = refundArguments(taskOrTopic)

          return emitDelta(args, `Scoring a ${scoreArgs.amount} USD refund with the evaluator…`, {
            message: {
              role: 'assistant',
              content: '',
              toolCalls: [{ id: 'tc_triage', name: 'triage_refund', arguments: scoreArgs }],
            },
            toolCalls: [{ id: 'tc_triage', name: 'triage_refund', arguments: scoreArgs }],
          })
        }

        if (lower.includes('refund') && hasTool(args.tools, 'refund')) {
          const refundArgs = refundArguments(taskOrTopic)

          return emitDelta(args, `Triaging a ${refundArgs.amount} USD refund…`, {
            message: {
              role: 'assistant',
              content: '',
              toolCalls: [{ id: 'tc_refund', name: 'refund', arguments: refundArgs }],
            },
            toolCalls: [{ id: 'tc_refund', name: 'refund', arguments: refundArgs }],
          })
        }

        if (
          (lower.includes('checkout') ||
            lower.includes('pay') ||
            lower.includes('charge') ||
            lower.includes('facilitate')) &&
          hasTool(args.tools, 'checkout')
        ) {
          const amountMatch = lower.match(/\b(\d+(?:\.\d+)?)\b/)
          const amount = amountMatch ? Number(amountMatch[1]) : 150
          return emitDelta(args, `Starting checkout for ${amount} USD…`, {
            message: {
              role: 'assistant',
              content: '',
              toolCalls: [
                { id: 'tc_checkout', name: 'checkout', arguments: { amount, currency: 'USD' } },
              ],
            },
            toolCalls: [
              { id: 'tc_checkout', name: 'checkout', arguments: { amount, currency: 'USD' } },
            ],
          })
        }

        if (
          (lower.includes('approval') || lower.includes('approve')) &&
          hasTool(args.tools, 'ask_approval')
        ) {
          return emitDelta(args, 'Requesting human approval…', {
            message: {
              role: 'assistant',
              content: '',
              toolCalls: [
                {
                  id: 'tc_approval',
                  name: 'ask_approval',
                  arguments: { title: 'Approve demo action?' },
                },
              ],
            },
            toolCalls: [
              {
                id: 'tc_approval',
                name: 'ask_approval',
                arguments: { title: 'Approve demo action?' },
              },
            ],
          })
        }

        // Default for assistant: delegate to the specialist agent to demonstrate hierarchical trees
        return emitDelta(args, 'Delegating to the specialist child agent for deep analysis…', {
          message: {
            role: 'assistant',
            content: '',
            toolCalls: [{ id: 'tc_spec', name: 'specialist', arguments: { task: taskOrTopic } }],
          },
          toolCalls: [{ id: 'tc_spec', name: 'specialist', arguments: { task: taskOrTopic } }],
        })
      }

      // Assistant Turn 2+: Synthesize completed findings
      const details = results.map((r) => r.content).join('\n')

      const checkoutLike = results.some((r) => {
        const c = r.content.toLowerCase()
        return (
          c.includes('gate') ||
          c.includes('charge') ||
          c.includes('approve') ||
          c.includes('reject')
        )
      })

      const refundLike = results.some((r) => r.name === 'refund')
      const scoredLike = results.some((r) => r.name === 'triage_refund')

      const reply = scoredLike
        ? `The evaluator scored the refund. Nothing was paid or queued for review. Evaluation:\n${details}`
        : refundLike
          ? `Refund triage finished. Outcome:\n${details}`
          : checkoutLike
            ? `Checkout finished. Outcome:\n${details}`
            : `Done. Tool results:\n${details}`

      return emitDelta(args, reply, {
        message: { role: 'assistant', content: reply },
        done: true,
        output: { text: reply, result: reply },
      })
    }

    // 2. Specialist Agent (has researcher, pipeline, calculate)
    if (hasTool(args.tools, 'researcher')) {
      if (results.length === 0) {
        return emitDelta(
          args,
          'Specialist coordinating sub-agents: launching researcher and computing metrics…',
          {
            message: {
              role: 'assistant',
              content: '',
              toolCalls: [
                { id: 'tc_res', name: 'researcher', arguments: { topic: taskOrTopic } },
                {
                  id: 'tc_calc',
                  name: 'calculate',
                  arguments: { operation: 'average', values: [12.4, 15.8, 14.2] },
                },
              ],
            },
            toolCalls: [
              { id: 'tc_res', name: 'researcher', arguments: { topic: taskOrTopic } },
              {
                id: 'tc_calc',
                name: 'calculate',
                arguments: { operation: 'average', values: [12.4, 15.8, 14.2] },
              },
            ],
          },
        )
      }

      // Specialist Turn 2+: Synthesize findings from researcher and calculate
      const details = results.map((r) => r.content).join(' | ')
      const summary = `Specialist completed [${taskOrTopic}]. Sub-agent findings & calculations: ${details}`
      return emitDelta(args, summary, {
        message: { role: 'assistant', content: summary },
        done: true,
        output: { result: summary, text: summary },
      })
    }

    // 3. Researcher Agent (has query_kb, pipeline)
    if (hasTool(args.tools, 'query_kb')) {
      if (results.length === 0) {
        return emitDelta(args, 'Researcher querying telemetry KB and running data pipeline…', {
          message: {
            role: 'assistant',
            content: '',
            toolCalls: [
              { id: 'tc_kb', name: 'query_kb', arguments: { topic: taskOrTopic } },
              { id: 'tc_pipe', name: 'pipeline', arguments: { n: 42 } },
            ],
          },
          toolCalls: [
            { id: 'tc_kb', name: 'query_kb', arguments: { topic: taskOrTopic } },
            { id: 'tc_pipe', name: 'pipeline', arguments: { n: 42 } },
          ],
        })
      }

      // Researcher Turn 2+: Synthesize KB telemetry and pipeline results
      const details = results.map((r) => r.content).join(' | ')
      const summary = `Research verified for [${taskOrTopic}]. Telemetry & pipeline results: ${details}`
      return emitDelta(args, summary, {
        message: { role: 'assistant', content: summary },
        done: true,
        output: { result: summary, text: summary },
      })
    }

    // Default agent fallback: echo text or produce completed reply
    const text = taskOrTopic.length > 0 ? taskOrTopic : 'done'
    return emitDelta(args, text, {
      message: { role: 'assistant', content: text },
      done: true,
      output: { text, result: text },
    })
  },
}
