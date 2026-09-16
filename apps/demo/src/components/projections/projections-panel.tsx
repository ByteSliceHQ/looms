import { ChevronDown } from 'lucide-react'
import { useCallback, useState, type ReactNode } from 'react'

import { conversation, tokenUsage } from '@swirls/looms/agent'
import { pendingApprovals } from '@swirls/looms/approval'
import { asJson } from '@swirls/looms/core'
import { useProjection, useRunSelector, useRunStore } from '@swirls/looms/react'
import { nodes } from '@swirls/looms/workflow'

import { ledger } from '../../modules/payments'
import { JsonView } from '../json-view'
import { Badge } from '../ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { Approvals } from './approvals'
import { Ledger } from './ledger'
import { TokenUsage } from './token-usage'
import { WorkflowNodes } from './workflow-nodes'

function Section({
  title,
  count,
  raw,
  children,
}: {
  title: string
  count?: number
  raw: object
  children: ReactNode
}) {
  const [open, setOpen] = useState(true)
  const [showRaw, setShowRaw] = useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-border border-b">
      <div className="flex items-center gap-1 px-2 py-1.5">
        <CollapsibleTrigger className="text-muted-foreground flex min-w-0 flex-1 items-center gap-1 text-left text-[11px] font-medium tracking-wide uppercase">
          <ChevronDown className={`size-3 transition-transform ${open ? '' : '-rotate-90'}`} />
          {title}
          {count !== undefined ? (
            <Badge variant="secondary" className="ml-1">
              {count}
            </Badge>
          ) : null}
        </CollapsibleTrigger>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground text-[10px]"
          onClick={() => setShowRaw((value) => !value)}
        >
          {showRaw ? 'view' : 'raw'}
        </button>
      </div>
      <CollapsibleContent className="px-2 pb-2">
        {showRaw ? <JsonView value={asJson(raw)} /> : children}
      </CollapsibleContent>
    </Collapsible>
  )
}

export function ProjectionsPanel({ runId }: { runId: string }) {
  const store = useRunStore(runId)

  const kind = useRunSelector(
    store,
    useCallback((s) => s.getState().runs.get(runId)?.kind, [runId]),
  )

  const approvals = useProjection(store, pendingApprovals)
  const charges = useProjection(store, ledger)
  const usage = useProjection(store, tokenUsage)
  const workflow = useProjection(store, nodes)
  const convo = useProjection(store, conversation)

  const showWorkflow = kind === 'workflow' || Object.keys(workflow.nodes).length > 0
  const showTokens = usage.input > 0 || usage.output > 0 || convo.lines.length > 0

  return (
    <div className="flex h-full min-h-0 flex-col overflow-auto">
      <div className="border-border text-muted-foreground border-b px-2 py-1.5 text-[11px] font-medium tracking-wide uppercase">
        Projections
      </div>
      <Section title="Approvals" count={approvals.items.length} raw={approvals}>
        <Approvals runId={runId} />
      </Section>
      <Section title="Ledger" count={charges.entries.length} raw={charges}>
        <Ledger runId={runId} />
      </Section>
      {showWorkflow ? (
        <Section title="Nodes" count={Object.keys(workflow.nodes).length} raw={workflow}>
          <WorkflowNodes runId={runId} />
        </Section>
      ) : null}
      {showTokens ? (
        <Section title="Tokens" raw={usage}>
          <TokenUsage runId={runId} />
        </Section>
      ) : null}
    </div>
  )
}
