import { readKillSwitch } from '../../bindings'
import { assessRisk } from '../../risk'
import { RiskInput, riskEvents, type RiskChecked } from './events'
import { riskScope } from './scope'

function eventFor(decision: RiskChecked) {
  switch (decision.outcome) {
    case 'passed':
      return riskEvents.input('check.passed', decision)
    case 'soft_breach':
      return riskEvents.input('check.soft_breach', decision)
    case 'blocked':
      return riskEvents.input('check.blocked', decision)

    default: {
      const unexpected: never = decision.outcome
      return unexpected
    }
  }
}

export const checkRisk = riskScope.effect({
  type: 'risk.check',
  placement: 'local',
  input: RiskInput,
  execute: (input) =>
    readKillSwitch().then((killed) => {
      const decision = assessRisk({
        venue: input.venue,
        side: input.side,
        qty: input.qty,
        price: input.price,
        dayNotional: input.dayNotional,
        limits: input.limits,
        killed,
        book: {
          position: input.position,
          avgCost: input.avgCost,
          cash: input.cash,
          realizedPnl: input.realizedPnl,
        },
      })

      const payload = {
        symbol: input.symbol,
        outcome: decision.outcome,
        reason: decision.reason,
        side: input.side,
        qty: input.qty,
        price: input.price,
        tick: input.tick,
      }

      return [eventFor(payload), riskEvents.input('check.completed', payload)]
    }),
})
