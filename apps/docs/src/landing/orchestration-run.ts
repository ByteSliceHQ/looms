import { createEvent, type EventEnvelope, type JsonValue } from '@looms/core'

export const LANDING_RUN_ID = 'run_landing_incident'
export const COMMANDER_THREAD_ID = 'thr_commander'
export const RESEARCHER_THREAD_ID = 'thr_researcher'
export const ANALYST_THREAD_ID = 'thr_analyst'
export const PLANNER_THREAD_ID = 'thr_planner'
export const RISK_REVIEWER_THREAD_ID = 'thr_risk_reviewer'

const STARTED_AT = 1_700_000_000_000

type EventExtras = {
  threadId?: string | null
  parentThreadId?: string | null
  causationId?: string | null
  ephemeral?: boolean
}

let timelineAt = STARTED_AT

function eventDelay(seq: number, type: string): number {
  switch (type) {
    case 'runtime.run.started':
      return 0
    case 'agent.turn.text_delta':
      return 90
    case 'agent.spawn.requested':
      return 180
    case 'runtime.thread.started':
      return 220
    case 'agent.tool_call.requested':
      return 260 + (seq % 3) * 35
    case 'agent.message':
      return 340
    case 'agent.tool.result':
      return 480
    case 'approval.requested':
      return 420
    case 'runtime.wait.registered':
      return 220
    case 'approval.decided':
      return 1_600
    case 'runtime.wait.satisfied':
      return 180
    case 'runtime.thread.completed':
      return 260
    case 'runtime.run.completed':
      return 420
    default:
      return 130 + (seq % 4) * 25
  }
}

function event(
  seq: number,
  type: string,
  payload: JsonValue,
  extras: EventExtras = {},
): EventEnvelope {
  timelineAt += eventDelay(seq, type)

  return createEvent(
    LANDING_RUN_ID,
    {
      type,
      payload,
      threadId: extras.threadId ?? null,
      parentThreadId: extras.parentThreadId,
      causationId: extras.causationId,
      ephemeral: extras.ephemeral,
      origin: { type: 'system' },
      id: `evt_landing_${seq}`,
      ts: timelineAt,
    },
    { seq },
  )
}

function threadStarted(
  seq: number,
  threadId: string,
  definitionName: string,
  parentThreadId: string | null,
  input: JsonValue,
): EventEnvelope {
  return event(
    seq,
    'runtime.thread.started',
    {
      threadId,
      kind: 'agent',
      definitionName,
      input,
      parentThreadId,
    },
    { threadId, parentThreadId },
  )
}

function agentEvent(
  seq: number,
  threadId: string,
  type: string,
  payload: JsonValue,
  causationId?: string,
): EventEnvelope {
  return event(seq, type, payload, { threadId, causationId })
}

function textDelta(seq: number, threadId: string, turn: number, delta: string): EventEnvelope {
  return event(seq, 'agent.turn.text_delta', { turn, delta }, { threadId, ephemeral: true })
}

function toolCall(
  seq: number,
  threadId: string,
  id: string,
  name: string,
  args: JsonValue,
  turn = 1,
): EventEnvelope {
  return agentEvent(seq, threadId, 'agent.tool_call.requested', {
    turn,
    toolCall: { id, name, arguments: args },
  })
}

function toolResult(
  seq: number,
  threadId: string,
  toolCallId: string,
  name: string,
  result: JsonValue,
  turn = 1,
  causingSeq = seq - 1,
): EventEnvelope {
  return agentEvent(
    seq,
    threadId,
    'agent.tool.result',
    { turn, toolCallId, name, result, error: null },
    `evt_landing_${causingSeq}`,
  )
}

function spawn(
  seq: number,
  parentThreadId: string,
  childThreadId: string,
  definitionName: string,
  toolCallId: string,
  input: JsonValue,
): EventEnvelope {
  return agentEvent(seq, parentThreadId, 'agent.spawn.requested', {
    childThreadId,
    kind: 'agent',
    definitionName,
    input,
    toolCallId,
  })
}

function threadCompleted(seq: number, threadId: string, output: JsonValue): EventEnvelope {
  return event(seq, 'runtime.thread.completed', { threadId, output }, { threadId })
}

const task = 'Investigate the checkout conversion drop and propose a safe rollout plan'

export const landingOrchestrationEvents: readonly EventEnvelope[] = [
  event(1, 'runtime.run.started', {
    rootThreadId: COMMANDER_THREAD_ID,
    kind: 'agent',
    definitionName: 'incident-commander',
    input: { task },
  }),
  threadStarted(2, COMMANDER_THREAD_ID, 'incident-commander', null, { task }),
  agentEvent(3, COMMANDER_THREAD_ID, 'agent.message.received', {
    message: { role: 'user', content: task },
  }),
  agentEvent(4, COMMANDER_THREAD_ID, 'agent.turn.started', { turn: 1 }),
  textDelta(5, COMMANDER_THREAD_ID, 1, 'I’ll run research, metrics, and planning in parallel…'),

  toolCall(6, COMMANDER_THREAD_ID, 'call_research', 'delegate_research', {
    question: 'What changed in the checkout funnel?',
  }),
  toolCall(7, COMMANDER_THREAD_ID, 'call_metrics', 'delegate_metrics', {
    metric: 'checkout_conversion',
    window: '24h',
  }),
  toolCall(8, COMMANDER_THREAD_ID, 'call_plan', 'delegate_planning', {
    goal: 'Recover conversion without increasing payment risk',
  }),
  spawn(9, COMMANDER_THREAD_ID, RESEARCHER_THREAD_ID, 'researcher', 'call_research', {
    question: 'What changed in the checkout funnel?',
  }),
  spawn(10, COMMANDER_THREAD_ID, ANALYST_THREAD_ID, 'data-analyst', 'call_metrics', {
    metric: 'checkout_conversion',
    window: '24h',
  }),
  spawn(11, COMMANDER_THREAD_ID, PLANNER_THREAD_ID, 'rollout-planner', 'call_plan', {
    goal: 'Recover conversion without increasing payment risk',
  }),

  threadStarted(12, RESEARCHER_THREAD_ID, 'researcher', COMMANDER_THREAD_ID, {
    question: 'What changed in the checkout funnel?',
  }),
  threadStarted(13, ANALYST_THREAD_ID, 'data-analyst', COMMANDER_THREAD_ID, {
    metric: 'checkout_conversion',
    window: '24h',
  }),
  threadStarted(14, PLANNER_THREAD_ID, 'rollout-planner', COMMANDER_THREAD_ID, {
    goal: 'Recover conversion without increasing payment risk',
  }),
  agentEvent(15, RESEARCHER_THREAD_ID, 'agent.turn.started', { turn: 1 }),
  agentEvent(16, ANALYST_THREAD_ID, 'agent.turn.started', { turn: 1 }),
  agentEvent(17, PLANNER_THREAD_ID, 'agent.turn.started', { turn: 1 }),

  toolCall(18, RESEARCHER_THREAD_ID, 'call_search', 'search_web', {
    query: 'checkout conversion failures payment authentication',
  }),
  toolCall(19, ANALYST_THREAD_ID, 'call_query', 'query_metrics', {
    metric: 'checkout_conversion',
    groupBy: ['browser', 'payment_method'],
  }),
  toolCall(20, PLANNER_THREAD_ID, 'call_risk', 'delegate_risk_review', {
    change: 'Relax 3DS challenge for low-risk returning customers',
  }),
  spawn(21, PLANNER_THREAD_ID, RISK_REVIEWER_THREAD_ID, 'risk-reviewer', 'call_risk', {
    change: 'Relax 3DS challenge for low-risk returning customers',
  }),
  threadStarted(22, RISK_REVIEWER_THREAD_ID, 'risk-reviewer', PLANNER_THREAD_ID, {
    change: 'Relax 3DS challenge for low-risk returning customers',
  }),
  agentEvent(23, RISK_REVIEWER_THREAD_ID, 'agent.turn.started', { turn: 1 }),
  toolCall(24, RISK_REVIEWER_THREAD_ID, 'call_policy', 'lookup_policy', {
    policy: 'low-risk-3ds-exemption',
    region: 'US',
  }),

  toolResult(
    25,
    RESEARCHER_THREAD_ID,
    'call_search',
    'search_web',
    {
      findings: ['A browser release changed iframe storage behavior', '3DS retries increased'],
    },
    1,
    18,
  ),
  toolResult(
    26,
    ANALYST_THREAD_ID,
    'call_query',
    'query_metrics',
    {
      conversionDelta: -0.18,
      affectedSegment: 'Safari + wallet',
      confidence: 0.97,
    },
    1,
    19,
  ),
  toolResult(
    27,
    RISK_REVIEWER_THREAD_ID,
    'call_policy',
    'lookup_policy',
    {
      allowed: true,
      guardrails: ['returning customer', 'risk score < 0.2', 'amount < $100'],
    },
    1,
    24,
  ),

  textDelta(
    28,
    RESEARCHER_THREAD_ID,
    1,
    'The regression aligns with Safari iframe storage and elevated 3DS retries…',
  ),
  threadCompleted(29, RESEARCHER_THREAD_ID, {
    cause: 'Safari iframe storage change',
    evidence: '3DS retries increased',
  }),
  textDelta(
    30,
    ANALYST_THREAD_ID,
    1,
    'Conversion is down 18% for Safari wallet traffic with 97% confidence…',
  ),
  threadCompleted(31, ANALYST_THREAD_ID, {
    conversionDelta: -0.18,
    segment: 'Safari + wallet',
  }),
  textDelta(
    32,
    RISK_REVIEWER_THREAD_ID,
    1,
    'A guarded exemption is compliant for low-risk returning customers…',
  ),
  threadCompleted(33, RISK_REVIEWER_THREAD_ID, {
    approved: true,
    guardrails: ['risk score < 0.2', 'amount < $100'],
  }),
  toolResult(
    34,
    PLANNER_THREAD_ID,
    'call_risk',
    'delegate_risk_review',
    {
      approved: true,
      guardrails: ['risk score < 0.2', 'amount < $100'],
    },
    1,
    20,
  ),
  agentEvent(35, PLANNER_THREAD_ID, 'agent.turn.started', { turn: 2 }),
  agentEvent(36, PLANNER_THREAD_ID, 'approval.requested', {
    approvalId: 'approval_rollout',
    title: 'Approve guarded 3DS rollout',
    description: 'Start at 5% and automatically roll back on conversion regression.',
    actions: [
      { id: 'approve', label: 'Approve rollout', outcome: 'approve' },
      { id: 'reject', label: 'Reject', outcome: 'reject' },
    ],
  }),
  event(
    37,
    'runtime.wait.registered',
    {
      waitId: 'wait_rollout_approval',
      threadId: PLANNER_THREAD_ID,
      on: { type: 'approval.decided' },
    },
    { threadId: PLANNER_THREAD_ID },
  ),
  agentEvent(
    38,
    PLANNER_THREAD_ID,
    'approval.decided',
    {
      approvalId: 'approval_rollout',
      actionId: 'approve',
      outcome: 'approve',
    },
    'evt_landing_36',
  ),
  event(
    39,
    'runtime.wait.satisfied',
    {
      waitId: 'wait_rollout_approval',
      event: {
        id: 'evt_landing_38',
        type: 'approval.decided',
        payload: { outcome: 'approve' },
      },
    },
    { threadId: PLANNER_THREAD_ID },
  ),
  threadCompleted(40, PLANNER_THREAD_ID, {
    planId: 'rollout_3ds_fix',
    stages: [5, 25, 100],
    approved: true,
  }),

  toolResult(
    41,
    COMMANDER_THREAD_ID,
    'call_research',
    'delegate_research',
    {
      cause: 'Safari iframe storage change',
    },
    1,
    6,
  ),
  toolResult(
    42,
    COMMANDER_THREAD_ID,
    'call_metrics',
    'delegate_metrics',
    {
      conversionDelta: -0.18,
      segment: 'Safari + wallet',
    },
    1,
    7,
  ),
  toolResult(
    43,
    COMMANDER_THREAD_ID,
    'call_plan',
    'delegate_planning',
    {
      planId: 'rollout_3ds_fix',
      stages: [5, 25, 100],
    },
    1,
    8,
  ),
  textDelta(44, COMMANDER_THREAD_ID, 2, 'Root cause confirmed. Preparing the rollout summary…'),
  agentEvent(45, COMMANDER_THREAD_ID, 'agent.message', {
    turn: 2,
    message: {
      role: 'assistant',
      content: 'Root cause confirmed. A guarded 3DS fix and staged rollout are ready.',
    },
  }),
  threadCompleted(46, COMMANDER_THREAD_ID, {
    cause: 'Safari iframe storage change',
    planId: 'rollout_3ds_fix',
  }),
  event(47, 'runtime.run.completed', {
    output: {
      cause: 'Safari iframe storage change',
      planId: 'rollout_3ds_fix',
      confidence: 0.97,
    },
    error: null,
  }),
]
