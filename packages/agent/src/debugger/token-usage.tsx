import type { ProjectionContext } from '@looms/debugger'

import type { TokenUsage } from '../types'

export function TokenUsageView({ state }: ProjectionContext<TokenUsage>) {
  return (
    <p className="font-mono text-xs">
      in {state.input} / out {state.output}
    </p>
  )
}
