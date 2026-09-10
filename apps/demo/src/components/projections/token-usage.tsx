import { useRun } from '@/hooks/use-run'
import { tokenUsage } from '@looms/agent'
import { useProjection } from '@looms/livestore/react'

export function TokenUsage({ runId }: { runId: string }) {
  const { store } = useRun(runId)
  const usage = useProjection(store, tokenUsage)
  return (
    <p className="font-mono text-xs">
      in {usage.input} / out {usage.output}
    </p>
  )
}
