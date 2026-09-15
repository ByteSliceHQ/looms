import { tokenUsage } from '@looms/agent'
import { useProjection, useRunStore } from '@looms/livestore/react'

export function TokenUsage({ runId }: { runId: string }) {
  const store = useRunStore(runId)
  const usage = useProjection(store, tokenUsage)

  return (
    <p className="font-mono text-xs">
      in {usage.input} / out {usage.output}
    </p>
  )
}
