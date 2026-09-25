import { useProjection, useRunStore } from '@looms/react'

import { tokenUsage } from '../projections'

const format = new Intl.NumberFormat()

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-border bg-card/60 rounded-lg border px-2.5 py-2">
      <p className="text-muted-foreground text-[11px]">{label}</p>
      <p className="font-mono text-[13px] font-medium tabular-nums">{format.format(value)}</p>
    </div>
  )
}

export function TokenUsageView({ runId }: { runId: string }) {
  const state = useProjection(useRunStore(runId), tokenUsage)
  return (
    <div className="grid grid-cols-3 gap-2">
      <Stat label="Input" value={state.input} />
      <Stat label="Output" value={state.output} />
      <Stat label="Total" value={state.input + state.output} />
    </div>
  )
}
