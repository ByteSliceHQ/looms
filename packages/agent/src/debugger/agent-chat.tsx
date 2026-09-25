import { Bot, CornerDownRight, MessageSquare, Settings2, User, Wrench } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'

import { createEventId, isJsonObject, isJsonString, type EventInput } from '@looms/core'
import {
  cn,
  Composer,
  EmptyState,
  errorMessage,
  FollowList,
  inputForm,
  JsonTree,
  messageInput,
  parseStructuredJson,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  shortId,
  StartForm,
  useDebugger,
  useStartRun,
  type DebuggerContextValue,
  type WorkspaceContext,
} from '@looms/debugger'
import { createFold, useEventFold, useProjection, useRunStore, useRunSummary } from '@looms/react'

import { conversation } from '../projections'
import { sendAgentSessionMessage, userMessage } from '../signals'
import type { AgentMessageDelivery, Message, ToolCall } from '../types'

function sessionClient(client: DebuggerContextValue['client']) {
  return {
    getRun: (runId: string) => client.getRun(runId).then((result) => result.state),
    signal: (runId: string, events: readonly EventInput[]) => client.signal(runId, events),
  }
}

interface StreamingState {
  lastMessageSeq: number
  turnStarted: boolean
  parts: string[]
}

const streamingFold = createFold<StreamingState>({
  name: 'agentStreamingText',
  initialState: { lastMessageSeq: -1, turnStarted: false, parts: [] },
  includeEphemeral: true,
  reduce(state, event) {
    if (event.type === 'agent.message') {
      return { lastMessageSeq: event.seq, turnStarted: false, parts: [] }
    }

    if (event.seq <= state.lastMessageSeq) {
      return state
    }

    if (event.type === 'agent.turn.started') {
      return { ...state, turnStarted: true }
    }

    if (
      event.type === 'agent.turn.text_delta' &&
      isJsonObject(event.payload) &&
      isJsonString(event.payload.delta)
    ) {
      return {
        ...state,
        turnStarted: true,
        parts: state.parts.concat(event.payload.delta),
      }
    }

    return state
  },
})

type TranscriptItem =
  | { readonly kind: 'line'; readonly line: Message; readonly index: number }
  | { readonly kind: 'stream'; readonly text: string }

const deliveryOptions: readonly {
  readonly value: AgentMessageDelivery
  readonly label: string
  readonly description: string
}[] = [
  { value: 'followUp', label: 'Follow up', description: 'Queue after the current turn' },
  { value: 'steer', label: 'Steer', description: 'Redirect the active turn' },
  { value: 'nextTurn', label: 'Next turn', description: 'Hold until the next turn starts' },
]

function RoleLabel({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-[11px] font-medium [&_svg]:size-3">
      {icon}
      {children}
    </div>
  )
}

function MessageText({ content, className }: { content: string; className?: string }) {
  const structured = useMemo(() => parseStructuredJson(content), [content])

  if (structured !== undefined) {
    return <JsonTree value={structured} defaultExpandDepth={2} />
  }

  return (
    <div className={cn('text-[13px] leading-relaxed break-words whitespace-pre-wrap', className)}>
      {content}
    </div>
  )
}

function ToolCard({
  icon,
  name,
  meta,
  children,
}: {
  icon: ReactNode
  name: string
  meta?: string
  children: ReactNode
}) {
  return (
    <div className="border-border bg-card/60 overflow-hidden rounded-lg border">
      <div className="border-border/70 flex h-7 items-center gap-1.5 border-b px-2.5 text-[11px] [&_svg]:size-3">
        <span className="text-muted-foreground">{icon}</span>
        <span className="font-mono font-medium">{name}</span>
        {meta ? (
          <span className="text-muted-foreground ml-auto truncate font-mono text-[10px]">
            {meta}
          </span>
        ) : null}
      </div>
      <div className="px-2.5 py-1.5">{children}</div>
    </div>
  )
}

function ToolCallCard({ call }: { call: ToolCall }) {
  return (
    <ToolCard icon={<Wrench />} name={call.name} meta={shortId(call.id)}>
      <JsonTree value={call.arguments} defaultExpandDepth={2} />
    </ToolCard>
  )
}

function MessageItem({ line, toolName }: { line: Message; toolName?: string }) {
  switch (line.role) {
    case 'user':
      return (
        <>
          <RoleLabel icon={<User />}>User</RoleLabel>
          <div className="bg-secondary w-fit max-w-full rounded-lg px-3 py-2">
            <MessageText content={line.content} />
          </div>
        </>
      )
    case 'assistant':
      return (
        <>
          <RoleLabel icon={<Bot />}>Assistant</RoleLabel>
          <div className="grid gap-2">
            {line.content ? <MessageText content={line.content} /> : null}
            {line.toolCalls?.map((call) => (
              <ToolCallCard key={call.id} call={call} />
            ))}
          </div>
        </>
      )
    case 'tool':
      return (
        <ToolCard
          icon={<CornerDownRight />}
          name={`${line.name ?? toolName ?? 'tool'} result`}
          meta={line.toolCallId ? shortId(line.toolCallId) : undefined}
        >
          <MessageText content={line.content} />
        </ToolCard>
      )
    case 'system':
      return (
        <>
          <RoleLabel icon={<Settings2 />}>System</RoleLabel>
          <MessageText content={line.content} className="text-muted-foreground" />
        </>
      )

    default: {
      const exhaustive: never = line.role
      return exhaustive
    }
  }
}

function StreamingItem({ text }: { text: string }) {
  return (
    <>
      <RoleLabel icon={<Bot />}>Assistant</RoleLabel>
      <div className="text-[13px] leading-relaxed break-words whitespace-pre-wrap">
        {text}
        <span
          aria-label="Generating"
          className="bg-foreground/70 ml-0.5 inline-block h-3.5 w-1.5 animate-pulse rounded-[1px] align-[-2px]"
        />
      </div>
    </>
  )
}

function Transcript({ runId }: { runId: string }) {
  const store = useRunStore(runId)
  const convo = useProjection(store, conversation)
  const streaming = useEventFold(store, streamingFold)
  const stream = streaming.turnStarted ? streaming.parts.join('') : null

  const toolNames = useMemo(() => {
    const names = new Map<string, string>()

    for (const line of convo.lines) {
      for (const call of line.toolCalls ?? []) {
        names.set(call.id, call.name)
      }
    }

    return names
  }, [convo.lines])

  const items = useMemo<TranscriptItem[]>(() => {
    const lines: TranscriptItem[] = convo.lines.map((line, index) => ({
      kind: 'line',
      line,
      index,
    }))

    return stream === null ? lines : [...lines, { kind: 'stream', text: stream }]
  }, [convo.lines, stream])

  return (
    <FollowList
      items={items}
      estimateSize={96}
      overscan={4}
      paddingStart={8}
      paddingEnd={12}
      getKey={(item) => (item.kind === 'stream' ? 'stream' : item.index)}
      empty={<p className="text-muted-foreground p-6 text-center text-xs">Waiting for messages…</p>}
      renderItem={(item) => (
        <div className="px-4 py-2">
          {item.kind === 'stream' ? (
            <StreamingItem text={item.text} />
          ) : (
            <MessageItem
              line={item.line}
              toolName={item.line.toolCallId ? toolNames.get(item.line.toolCallId) : undefined}
            />
          )}
        </div>
      )}
    />
  )
}

function DeliverySelect({
  value,
  onChange,
}: {
  value: AgentMessageDelivery
  onChange: (value: AgentMessageDelivery) => void
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        const option = deliveryOptions.find((candidate) => candidate.value === next)

        if (option) {
          onChange(option.value)
        }
      }}
    >
      <SelectTrigger aria-label="Delivery">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start" className="w-60">
        {deliveryOptions.map((option) => (
          <SelectItem key={option.value} value={option.value} description={option.description}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function AgentChat(context: WorkspaceContext) {
  const { definition, runId } = context
  const { client } = useDebugger()
  const [draft, setDraft] = useState('')
  const [delivery, setDelivery] = useState<AgentMessageDelivery>('followUp')
  const { start, pending, error } = useStartRun(context)
  const session = definition.kind === 'agent-session'
  const form = inputForm(definition.inputSchema)

  if (!runId && !session && messageInput(form, '') === undefined) {
    return <StartForm {...context} />
  }

  function send() {
    const content = draft.trim()
    const input = session ? null : messageInput(form, content)

    if (!content || input === undefined) {
      return
    }

    setDraft('')

    start(
      input,
      session
        ? (id) => sendAgentSessionMessage(sessionClient(client), id, createEventId(), content)
        : undefined,
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {runId ? (
        <Transcript runId={runId} />
      ) : (
        <div className="min-h-0 flex-1">
          <EmptyState icon={<MessageSquare />} title={`Talk to ${definition.name}`}>
            Your first message starts a new run.
          </EmptyState>
        </div>
      )}
      {runId ? (
        <FollowUp
          runId={runId}
          session={session}
          delivery={delivery}
          setDelivery={setDelivery}
          startError={error}
        />
      ) : (
        <Composer
          value={draft}
          onChange={setDraft}
          onSubmit={send}
          pending={pending}
          placeholder={`Message ${definition.name}…`}
          submitLabel="Start"
          error={error}
        />
      )}
    </div>
  )
}

function FollowUp({
  runId,
  session,
  delivery,
  setDelivery,
  startError,
}: {
  runId: string
  session: boolean
  delivery: AgentMessageDelivery
  setDelivery: (delivery: AgentMessageDelivery) => void
  startError: string | null
}) {
  const { client } = useDebugger()
  const store = useRunStore(runId)
  const { rootThreadId } = useRunSummary(store)
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function send() {
    const content = draft.trim()

    if (!content || !rootThreadId) {
      return
    }

    setPending(true)
    setError(null)

    const commit = session
      ? sendAgentSessionMessage(sessionClient(client), runId, createEventId(), content, {
          delivery,
          threadId: rootThreadId,
        })
      : store.commit(userMessage(content, { threadId: rootThreadId }))

    commit
      .then(() => setDraft(''))
      .catch((cause: unknown) => setError(errorMessage(cause)))
      .finally(() => setPending(false))
  }

  return (
    <Composer
      value={draft}
      onChange={setDraft}
      onSubmit={send}
      pending={pending}
      disabled={!rootThreadId}
      placeholder="Send a follow-up…"
      error={error ?? startError}
      toolbar={session ? <DeliverySelect value={delivery} onChange={setDelivery} /> : null}
    />
  )
}
