import { z } from 'zod'

import type { AgentTurnResult, LlmAdapter, LlmCompleteArgs } from '@swirls/looms/agent'
import { asJson, type JsonValue } from '@swirls/looms/core'

import { isLiveSymbol, isSymbol } from './market'

function latestUserText(messages: LlmCompleteArgs['messages']): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]

    if (message?.role === 'user' && message.content) {
      return message.content
    }
  }

  return ''
}

function latestTool(messages: LlmCompleteArgs['messages']) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]

    if (message?.role === 'tool') {
      return message
    }
  }

  return undefined
}

function toolCall(
  args: LlmCompleteArgs,
  name: string,
  content: string,
  arguments_: JsonValue,
): Promise<AgentTurnResult> {
  const id = `call_${name}_${args.messages.length}`

  return Promise.resolve(args.onTextDelta?.(content)).then(() => ({
    message: {
      role: 'assistant',
      content,
      toolCalls: [{ id, name, arguments: arguments_ }],
    },
    toolCalls: [{ id, name, arguments: arguments_ }],
  }))
}

function reply(args: LlmCompleteArgs, content: string): Promise<AgentTurnResult> {
  return Promise.resolve(args.onTextDelta?.(content)).then(() => ({
    message: { role: 'assistant', content },
    done: true,
  }))
}

const QuoteSummary = z.object({
  symbol: z.string(),
  bid: z.number(),
  ask: z.number(),
  last: z.number(),
})

const SessionSummary = z.object({
  runId: z.string(),
})

const BookSummary = z.object({
  position: z.number(),
  realizedPnl: z.number(),
  lastOrder: z.string(),
})

function parsedJson(content: string): JsonValue {
  try {
    return asJson(JSON.parse(content))
  } catch {
    return null
  }
}

function summarize(content: string): string {
  const parsed = parsedJson(content)
  const quote = QuoteSummary.safeParse(parsed)

  if (quote.success) {
    return `${quote.data.symbol} ${quote.data.bid} / ${quote.data.ask}, last ${quote.data.last}.`
  }

  const session = SessionSummary.safeParse(parsed)

  if (session.success) {
    return `Session ${session.data.runId}.`
  }

  const book = BookSummary.safeParse(parsed)

  if (book.success) {
    return `Book position ${book.data.position}, realized ${book.data.realizedPnl}. ${book.data.lastOrder}`
  }

  return content
}

const SYMBOL = /\b[A-Z]{1,5}(?:-USD)?\b/
const RUN = /\brun_[a-z0-9_]+\b/i

function intentOf(text: string): 'quote' | 'positions' | 'start' | 'halt' | 'explain' | 'help' {
  const lower = text.toLowerCase()

  if (/\bhalt|cancel|stop\b/.test(lower)) {
    return 'halt'
  }

  if (/\bstart|open|run\b/.test(lower)) {
    return 'start'
  }

  if (/\bquote|price|book\b/.test(lower)) {
    return 'quote'
  }

  if (/\bposition|p&l|pnl|exposure\b/.test(lower)) {
    return 'positions'
  }

  if (/\bexplain|why|order\b/.test(lower)) {
    return 'explain'
  }

  return 'help'
}

const help =
  'Ask for a quote, the book, a session (start NVDA momentum), a halt with a run id, or an explanation of the last order.'

export const deskLlm: LlmAdapter = {
  complete(args) {
    const tool = latestTool(args.messages)

    if (tool?.content) {
      return reply(args, summarize(tool.content))
    }

    const text = latestUserText(args.messages)
    const intent = intentOf(text)
    const symbol = text.match(SYMBOL)?.[0]
    const runId = text.match(RUN)?.[0]

    if (intent === 'help') {
      return reply(args, help)
    }

    if (intent === 'quote') {
      if (!symbol || !isSymbol(symbol)) {
        return reply(args, `Name a symbol. ${help}`)
      }

      return toolCall(args, 'quote', `Reading ${symbol}.`, {
        symbol,
        tick: 0,
        venue: isLiveSymbol(symbol) ? 'robinhood' : 'sim',
      })
    }

    if (intent === 'positions' || intent === 'explain') {
      return toolCall(
        args,
        intent === 'positions' ? 'positions' : 'explain_order',
        'Reading the book.',
        {},
      )
    }

    if (intent === 'halt') {
      if (!runId) {
        return reply(args, 'Halt needs a run id.')
      }

      return toolCall(args, 'halt_session', `Halting ${runId}.`, { runId })
    }

    const strategy = /mean|revert/i.test(text) ? 'mean-revert' : 'momentum'
    const venue = /live|robinhood/i.test(text) ? 'robinhood' : 'sim'

    if (!symbol || !isSymbol(symbol)) {
      return reply(args, `Name a symbol to start. ${help}`)
    }

    return toolCall(args, 'start_session', `Starting ${symbol}.`, {
      symbol,
      strategy,
      venue: venue === 'robinhood' && isLiveSymbol(symbol) ? 'robinhood' : 'sim',
      cycles: 6,
      intervalMs: venue === 'robinhood' ? 5_000 : 250,
    })
  },
}
