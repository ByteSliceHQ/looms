import { z } from 'zod'

import { asEffectsTool, defineAgent } from '@swirls/looms/agent'
import { invoke } from '@swirls/looms/core'

import { haltSession, openSession, readDesk } from '../modules/ledger/effects'
import { SessionHaltInput, SessionStartInput } from '../modules/ledger/events'
import { takeSnapshot } from '../modules/market/effects'
import { SnapshotInput } from '../modules/market/events'

const quoteTool = asEffectsTool({
  name: 'quote',
  description: 'Read the current simulated or live quote for a symbol.',
  input: SnapshotInput,
  effects: (input) => {
    const parsed = SnapshotInput.safeParse(input)

    const snapshot = parsed.success
      ? parsed.data
      : { symbol: 'NVDA', tick: 0, venue: 'sim' as const }

    return [invoke(takeSnapshot, snapshot, `quote_${snapshot.symbol}_${snapshot.tick}`)]
  },
  waitOn: { type: 'market.snapshot.recorded' },
})

const positionsTool = asEffectsTool({
  name: 'positions',
  description: 'Read the desk book: position, realized P&L, open orders, and the kill switch.',
  input: z.object({}),
  effects: () => [invoke(readDesk, {}, 'desk_book')],
  waitOn: { type: 'ledger.desk.ready' },
})

const startTool = asEffectsTool({
  name: 'start_session',
  description: 'Open a strategy session on the desk.',
  input: SessionStartInput,
  effects: (input) => {
    const parsed = SessionStartInput.safeParse(input)

    const session = parsed.success
      ? parsed.data
      : {
          symbol: 'NVDA',
          strategy: 'momentum' as const,
          venue: 'sim' as const,
          cycles: 4,
          intervalMs: 250,
        }

    return [invoke(openSession, session, `open_${session.symbol}`)]
  },
  waitOn: { type: 'ledger.session.opened' },
})

const haltTool = asEffectsTool({
  name: 'halt_session',
  description: 'Cancel a running strategy session.',
  input: SessionHaltInput,
  effects: (input) => {
    const parsed = SessionHaltInput.safeParse(input)
    const runId = parsed.success ? parsed.data.runId : ''
    return [invoke(haltSession, { runId }, `halt_${runId || 'missing'}`)]
  },
  waitOn: { type: 'ledger.session.halted' },
})

const explainTool = asEffectsTool({
  name: 'explain_order',
  description: 'Explain the latest order the desk has recorded.',
  input: z.object({}),
  effects: () => [invoke(readDesk, {}, 'explain_order')],
  waitOn: { type: 'ledger.desk.ready' },
})

export const analyst = defineAgent({
  name: 'analyst',
  description: 'Conversational trading analyst for the Meridian desk',
  conversational: true,
  maxTurns: 8,
  input: z.string(),
  instructions: [
    'You are the Meridian desk analyst.',
    'Quote a symbol before you describe its price.',
    'Start a session only when asked, and name the symbol, strategy, and venue.',
    'Halt a session only when asked, and only with its run id.',
    'Explain an order from the desk book. Do not invent fills.',
    'Live Robinhood orders still wait for a person on the desk.',
  ].join(' '),
  tools: [quoteTool, positionsTool, startTool, haltTool, explainTool],
})
