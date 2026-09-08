import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { createLoomsClient } from '@looms/client'
import { checkout, echo, greeter, orchestrator, pipeline } from '../definitions'

const loomsClient = createLoomsClient()

const DEFINITIONS = [
  {
    name: echo.name,
    label: 'echo (agent)',
    placeholder: 'hi',
    start: (text: string) => loomsClient.start(echo, { text: text || 'hi' }),
  },
  {
    name: greeter.name,
    label: 'greeter (agent + tool)',
    placeholder: 'Ada',
    start: (name: string) => loomsClient.start(greeter, { name: name || 'world' }),
  },
  {
    name: orchestrator.name,
    label: 'orchestrator (sub-agent)',
    placeholder: 'summarize',
    start: (task: string) => loomsClient.start(orchestrator, { task: task || 'summarize' }),
  },
  {
    name: checkout.name,
    label: 'checkout (approval + payments)',
    placeholder: '150',
    start: (amount: string) =>
      loomsClient.start(checkout, { amount: Number(amount) || 150, currency: 'USD' }),
  },
  {
    name: pipeline.name,
    label: 'pipeline (DAG + spawn)',
    placeholder: '21',
    start: (n: string) => loomsClient.start(pipeline, { n: Number(n) || 21 }),
  },
]

export function StartPanel() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string>(DEFINITIONS[0]!.name)
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const def = DEFINITIONS.find((item) => item.name === selected) ?? DEFINITIONS[0]!

  async function onStart() {
    setError(null)
    setPending(true)
    try {
      const result = await def.start(input.trim())
      await navigate({
        to: '/runs/$runId',
        params: { runId: result.runId },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="panel">
      <h2>Start a run</h2>
      <p className="muted">
        Creates a run on the Looms kernel. Open the debugger to inspect the thread tree, or chat
        for conversational agents.
      </p>
      <div className="row">
        <select
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value)
            setInput('')
          }}
        >
          {DEFINITIONS.map((item) => (
            <option key={item.name} value={item.name}>
              {item.label}
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
