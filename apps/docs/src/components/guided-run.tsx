import { useState } from 'react'

import { CodeBlock } from './code-block'

const stages = [
  {
    title: 'An agent drafts the announcement',
    detail:
      'The release workflow spawns a writer agent. Its tool call and result are recorded in the same run.',
    code: "{ id: 'draft', run: (ctx) => ctx.spawn(writer, ctx.input) }",
  },
  {
    title: 'A workflow asks for review',
    detail:
      'The writer has finished. The workflow records a request and parks until a matching decision arrives.',
    code: "ctx.effects(gate({ title: 'Publish Looms launch?' }))",
  },
  {
    title: 'The process stops',
    detail: 'The process exits. Its event log and pending approval remain in SQLite.',
    code: 'await looms.stop()',
  },
  {
    title: 'A new process opens the run',
    detail:
      'The host loads persisted history. It can inspect the pending review without repeating the completed writer step.',
    code: 'await looms.project(runId, pendingApprovals)',
  },
]

export function GuidedRun() {
  const [step, setStep] = useState(0)
  const [outcome, setOutcome] = useState<'approve' | 'reject'>('approve')
  const complete = step === stages.length
  const stage = stages[Math.min(step, stages.length - 1)]!

  const title = complete
    ? outcome === 'approve'
      ? 'Approved. The workflow continues.'
      : 'Rejected. Nothing is published.'
    : stage.title

  const detail = complete
    ? 'The decision is recorded. Only an approval lets the workflow publish.'
    : stage.detail

  return (
    <section className="guided-run" aria-label="Guided durability example">
      <div className="guided-label">
        <span>Example run</span>
        <span>{step + 1} / 5</span>
      </div>
      <div aria-live="polite">
        <h2>{title}</h2>
        <p>{detail}</p>
        <div className="guided-tree">
          <div>
            <span>release-v1</span>
            <strong>
              {complete
                ? 'completed'
                : step === 2
                  ? 'offline'
                  : step > 0
                    ? 'pending review'
                    : 'drafting'}
            </strong>
          </div>
          <div className="guided-child">
            <span>↳ writer</span>
            <strong>completed</strong>
          </div>
        </div>
        <CodeBlock
          lang="ts"
          code={
            complete
              ? `await looms.signal(runId, [decision(approvalId, '${outcome}')])`
              : stage.code
          }
        />
      </div>
      <div className="guided-actions">
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        {step < 3 && (
          <button type="button" className="primary-action" onClick={() => setStep(step + 1)}>
            {['Request review', 'Stop the process', 'Open in a new process'][step]} →
          </button>
        )}
        {step === 3 && (
          <>
            <button
              type="button"
              onClick={() => {
                setOutcome('reject')
                setStep(4)
              }}
            >
              Reject
            </button>
            <button
              type="button"
              className="primary-action"
              onClick={() => {
                setOutcome('approve')
                setStep(4)
              }}
            >
              Approve
            </button>
          </>
        )}
        {complete && (
          <button type="button" onClick={() => setStep(0)}>
            Start again
          </button>
        )}
      </div>
    </section>
  )
}
