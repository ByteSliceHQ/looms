import { Predicate } from 'effect'
import type { ReactNode } from 'react'

type FlowChainProps = {
  steps: readonly ReactNode[]
  className?: string
}

/** Monospace step chain used across landing and docs illustrations. */
export function FlowChain({ steps, className = '' }: FlowChainProps) {
  return (
    <div
      className={`text-muted [&_b]:text-muted-light [&_span]:text-foreground my-6 flex flex-wrap items-center gap-2.5 font-mono text-[0.82rem] leading-normal [&_b]:px-0.5 [&_b]:font-normal [&_span]:font-medium ${className}`.trim()}
    >
      {steps.map((step, index) => (
        <span key={index} className="contents">
          {index > 0 ? <b>&rarr;</b> : null}
          {Predicate.isString(step) || Predicate.isNumber(step) ? <span>{step}</span> : step}
        </span>
      ))}
    </div>
  )
}
