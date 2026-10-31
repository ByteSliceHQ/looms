import { signalFor } from '../../signals'
import { SignalInput, signalsEvents } from './events'
import { signalsScope } from './scope'

export const computeSignal = signalsScope.effect({
  type: 'signals.compute',
  placement: 'local',
  input: SignalInput,
  execute: (input) => {
    const signal = signalFor(input.strategy, input.prices, input.imbalance)

    return [
      signalsEvents.input('signal.ready', {
        symbol: input.symbol,
        strategy: input.strategy,
        tick: input.tick,
        ...signal,
      }),
    ]
  },
})
