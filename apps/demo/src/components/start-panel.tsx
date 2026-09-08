import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { createLoomsClient } from '@looms/client'
import type { definitions } from '../definitions'

const loomsClient = createLoomsClient<typeof definitions>()

const DEFINITIONS = [
  {
    name: 'echo',
    label: 'echo (agent)',
    placeholder: 'hi',
    start: (text: string) => loomsClient.startAgent('echo', { text: text || 'hi' }),
  },
  {
    name: 'greeter',
    label: 'greeter (agent + tool)',
    placeholder: 'Ada',
    start: (name: string) => loomsClient.startAgent('greeter', { name: name || 'world' }),
  },
  {
    name: 'orchestrator',
    label: 'orchestrator (sub-agent)',
    placeholder: 'summarize',
    start: (task: string) => loomsClient.startAgent('orchestrator', { task: task || 'summarize' }),
  },
  {
    name: 'hitl',
    label: 'hitl (review gate)',
    placeholder: 'draft document',
    start: (doc: string) => loomsClient.startWorkflow('hitl', { doc: doc || 'draft' }),
  },
  {
    name: 'pipeline',
    label: 'pipeline (DAG + spawn)',
    placeholder: '21',
    start: (n: string) => loomsClient.startWorkflow('pipeline', { n: Number(n) || 21 }),
  },
]

export function StartPanel() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(DEFINITIONS[0]!.name)
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const def = DEFINITIONS.find((d) => d.name === selected) ?? DEFINITIONS[0]!

  async function onStart() {
    setError(null)
    setPending(true)
    try {
      const result = await def.start(input.trim())
      await navigate({
        to: '/actors/$actorId',
        params: { actorId: result.actorId },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="panel">
      <h2>Start a session</h2>
      <p className="muted">
        Creates an agent or workflow actor on the Looms host. LiveStore then syncs the event log
        through s2-lite.
      </p>
      <div className="row">
        <select
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value)
            setInput('')
          }}
        >
          {DEFINITIONS.map((d) => (
            <option key={d.name} value={d.name}>
              {d.label}
            </option>
          ))}
        </select>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={def.placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void onStart()
          }}
        />
        <button type="button" disabled={pending} onClick={() => void onStart()}>
          {pending ? 'Starting…' : 'Start'}
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
    </section>
  )
}
