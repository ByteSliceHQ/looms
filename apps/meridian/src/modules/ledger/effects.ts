import { z } from 'zod'

import { readDailyFills, sessionControl } from '../../bindings'
import { DailyFillsInput, SessionHaltInput, SessionStartInput, ledgerEvents } from './events'
import { ledgerScope } from './scope'

export const loadDailyFills = ledgerScope.effect({
  type: 'ledger.daily_fills',
  placement: 'local',
  input: DailyFillsInput,
  execute: (input) =>
    readDailyFills(input.at).then((fills) => [
      ledgerEvents.input('daily_fills.ready', { at: input.at, fills: [...fills] }),
    ]),
})

export const readDesk = ledgerScope.effect({
  type: 'ledger.desk',
  placement: 'local',
  input: z.object({}),
  execute: () =>
    sessionControl()
      .book()
      .then((book) => [ledgerEvents.input('desk.ready', book)]),
})

export const openSession = ledgerScope.effect({
  type: 'ledger.session.open',
  placement: 'local',
  input: SessionStartInput,
  execute: (input) =>
    sessionControl()
      .start(input)
      .then((result) => [
        ledgerEvents.input('session.opened', {
          runId: 'runId' in result ? result.runId : null,
          reason: 'reason' in result ? result.reason : 'opened',
        }),
      ]),
})

export const haltSession = ledgerScope.effect({
  type: 'ledger.session.halt',
  placement: 'local',
  input: SessionHaltInput,
  execute: (input) =>
    sessionControl()
      .halt(input.runId)
      .then((result) => [
        ledgerEvents.input('session.halted', {
          runId: input.runId,
          halted: result.halted,
          reason: result.reason,
        }),
      ]),
})
