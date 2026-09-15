import { Predicate } from 'effect'
import { useMemo, type ReactNode } from 'react'

type FlowChainProps = {
  steps: readonly ReactNode[]
  className?: string
}

/** Monospace step chain used across landing and docs illustrations. */
export function FlowChain({ steps, className = '' }: FlowChainProps) {
  const items = useMemo(() => {
    const counts = new Map<string, number>()
    return steps.map((step) => {
      const base = Predicate.isString(step) || Predicate.isNumber(step) ? String(step) : 'node'
      const count = (counts.get(base) ?? 0) + 1
      counts.set(base, count)
      return { id: `${base}__${count}`, step }
    })
  }, [steps])

  return (
    <div
      className={`text-muted [&_b]:text-muted-light [&_span]:text-foreground my-6 flex flex-wrap items-center gap-2.5 font-mono text-[0.82rem] leading-normal [&_b]:px-0.5 [&_b]:font-normal [&_span]:font-medium ${className}`.trim()}
    >
      {items.map(({ id, step }, i) => (
        <span key={id} className="contents">
          {i > 0 ? <b>&rarr;</b> : null}
          {Predicate.isString(step) || Predicate.isNumber(step) ? <span>{step}</span> : step}
        </span>
      ))}
    </div>
  )
}
