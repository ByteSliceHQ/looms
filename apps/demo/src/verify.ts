import { Effect } from 'effect'
import { z } from 'zod'

import { agent, asEffectsTool, defineAgent } from '@looms/agent'
import { decision, gate, pendingApprovals } from '@looms/approval'
import {
  defineEffect,
  defineRuntimeModule,
  foldRun,
  isJsonObject,
  isJsonString,
  project,
  threadTree,
  toThreadTree,
  treeFromRun,
} from '@looms/core'
import { createLooms } from '@looms/runtime'
import { workflow } from '@looms/workflow'

import { assistant, checkout, definitions, echo, orchestrator, pipeline } from './definitions'
import { demoModules } from './runtime'

const EchoOutputSchema = z.object({ text: z.string() })

const PipelineOutputSchema = z.object({
  double: z.number().optional(),
  format: z
    .object({
      doubled: z.number().optional(),
    })
    .optional(),
})

const OrchestratorOutputSchema = z.object({
  result: z.string().optional(),
})

function rootOf(state: {
  rootThreadId: string | null
  threads: { [id: string]: { status: string; output: unknown } }
}) {
  return state.rootThreadId ? state.threads[state.rootThreadId] : undefined
}

export async function verifyDemo(): Promise<void> {
  const looms = createLooms({ definitions, modules: demoModules() })

  {
    const { state } = await looms.start(echo, { text: 'hello' })

    if (state.status !== 'completed') {
      throw new Error(`echo expected completed, got ${state.status}`)
    }

    const parsed = EchoOutputSchema.safeParse(rootOf(state)?.output)

    if (!parsed.success || parsed.data.text !== 'hello') {
      throw new Error(`echo bad output: ${JSON.stringify(rootOf(state)?.output)}`)
    }
  }

  {
    const { state } = await looms.start(pipeline, { n: 21 })

    if (state.status !== 'completed') {
      throw new Error(`pipeline expected completed, got ${state.status}`)
    }

    const parsed = PipelineOutputSchema.safeParse(rootOf(state)?.output)

    if (!parsed.success || parsed.data.double !== 42) {
      throw new Error('pipeline double expected 42')
    }

    if (parsed.data.format?.doubled !== 42) {
      throw new Error(
        `pipeline format.doubled expected 42, got ${JSON.stringify(parsed.data.format)}`,
      )
    }
  }

  {
    const { runId, state } = await looms.start(checkout, { amount: 40, currency: 'USD' })

    if (state.status !== 'completed') {
      throw new Error(`checkout below threshold expected completed, got ${state.status}`)
    }

    const events = await looms.getEvents(runId)

    if (!events.some((event) => event.type === 'payments.charge.authorized')) {
      throw new Error('checkout below threshold expected an authorized charge')
    }
  }

  {
    const { runId, state } = await looms.start(checkout, { amount: 150, currency: 'USD' })
    const root = rootOf(state)

    if (root?.status !== 'waiting') {
      throw new Error(`checkout expected waiting on approval, got ${root?.status}`)
    }

    const pending = await looms.project(runId, pendingApprovals)
    const approvalId = pending.items.find((item) => item.status === 'pending')?.approvalId

    if (!approvalId) {
      throw new Error('checkout missing pending approval')
    }

    const next = await looms.signal(runId, [decision(approvalId, 'approve')])

    if (next.status !== 'completed') {
      throw new Error(`checkout after approve expected completed, got ${next.status}`)
    }

    const events = await looms.getEvents(runId)

    if (!events.some((event) => event.type === 'payments.charge.authorized')) {
      throw new Error('checkout approve path expected payments.charge.authorized')
    }

    const runtime = await looms.runtime
    const first = foldRun(events, runtime.registry, { runId })
    const second = foldRun(events, runtime.registry, { runId })

    if (JSON.stringify(first) !== JSON.stringify(second)) {
      throw new Error('checkout replay is not deterministic')
    }

    const tree = treeFromRun(next)

    if (!tree.root) {
      throw new Error('checkout missing thread tree root')
    }
  }

  {
    const { runId, state } = await looms.start(checkout, { amount: 175, currency: 'USD' })

    if (rootOf(state)?.status !== 'waiting') {
      throw new Error(`checkout decline path expected waiting, got ${rootOf(state)?.status}`)
    }

    const pending = await looms.project(runId, pendingApprovals)
    const approvalId = pending.items.find((item) => item.status === 'pending')?.approvalId

    if (!approvalId) {
      throw new Error('checkout decline path missing approval')
    }

    const next = await looms.signal(runId, [decision(approvalId, 'reject')])

    if (next.status !== 'completed') {
      throw new Error(`checkout after reject expected completed, got ${next.status}`)
    }

    const events = await looms.getEvents(runId)

    if (events.some((event) => event.type.startsWith('payments.charge.'))) {
      throw new Error('checkout reject path should not charge')
    }
  }

  {
    const { state } = await looms.start(orchestrator, { task: 'summarize' })

    if (state.status !== 'completed') {
      throw new Error(`orchestrator expected completed, got ${state.status}`)
    }

    const children = Object.values(state.threads).filter((item) => item.parentThreadId !== null)

    if (children.length < 1) {
      throw new Error('orchestrator expected a child thread')
    }

    if (children.some((item) => item.status !== 'completed')) {
      throw new Error(`orchestrator child not completed: ${JSON.stringify(children)}`)
    }

    const parsed = OrchestratorOutputSchema.safeParse(rootOf(state)?.output)

    if (!parsed.success || !parsed.data.result?.includes('summarize')) {
      throw new Error(`orchestrator bad output: ${JSON.stringify(rootOf(state)?.output)}`)
    }

    const tree = treeFromRun(state)
    const specialistNode = tree.root?.children.find((c) => c.definitionName === 'specialist')

    if (!specialistNode) {
      throw new Error('missing specialist child in tree')
    }

    const researcherNode = specialistNode.children.find((c) => c.definitionName === 'researcher')

    if (!researcherNode) {
      throw new Error('missing researcher grandchild in tree')
    }

    const pipelineNode = researcherNode.children.find((c) => c.definitionName === 'pipeline')

    if (!pipelineNode) {
      throw new Error('missing pipeline great-grandchild in tree')
    }

    const echoNode = pipelineNode.children.find((c) => c.definitionName === 'echo')

    if (!echoNode) {
      throw new Error('missing echo great-great-grandchild in tree')
    }
  }

  {
    const { state } = await looms.start(assistant, 'hello')
    const root = rootOf(state)

    if (root?.status !== 'running' && root?.status !== 'waiting') {
      throw new Error(`assistant expected running, got ${root?.status}`)
    }
  }

  {
    const { runId, state } = await looms.start(
      assistant,
      'ask a specialist to research "number of lakes in minnesota"',
    )

    const tree = treeFromRun(state)
    const specialistChild = tree.root?.children.find((c) => c.definitionName === 'specialist')

    if (!specialistChild) {
      throw new Error('assistant failed to spawn specialist child for research topic')
    }

    const events = await looms.getEvents(runId)

    const spawnEvent = events.find(
      (e) =>
        e.type === 'agent.spawn.requested' &&
        isJsonObject(e.payload) &&
        e.payload.definitionName === 'specialist',
    )

    const spawnInput = isJsonObject(spawnEvent?.payload) ? spawnEvent?.payload.input : null

    if (!isJsonObject(spawnInput) || !isJsonString(spawnInput.task) || !spawnInput.task) {
      throw new Error(`specialist spawned with invalid input: ${JSON.stringify(spawnInput)}`)
    }

    if (spawnInput.task === 'analyze' || spawnInput.task === 'default') {
      throw new Error(
        `specialist received fallback task instead of research topic: ${spawnInput.task}`,
      )
    }
  }

  {
    const { state } = await looms.start(assistant, 'Ask the specialist to investigate latency')
    const tree = treeFromRun(state)
    const specialistChild = tree.root?.children.find((c) => c.definitionName === 'specialist')

    if (!specialistChild) {
      throw new Error('assistant failed to spawn specialist child')
    }

    const researcherGrandchild = specialistChild.children.find(
      (c) => c.definitionName === 'researcher',
    )

    if (!researcherGrandchild) {
      throw new Error('assistant specialist missing researcher grandchild')
    }
  }

  {
    const { runId, state } = await looms.start(assistant, 'facilitate checkout 175')

    if (rootOf(state)?.status !== 'waiting') {
      throw new Error(`assistant checkout expected waiting, got ${rootOf(state)?.status}`)
    }

    const pending = await looms.project(runId, pendingApprovals)
    const approvalId = pending.items.find((item) => item.status === 'pending')?.approvalId

    if (!approvalId) {
      throw new Error('assistant checkout missing pending approval')
    }

    const next = await looms.signal(runId, [decision(approvalId, 'approve')])
    const root = rootOf(next)

    if (root?.status !== 'running' && root?.status !== 'waiting') {
      throw new Error(`assistant after approve expected running, got ${root?.status}`)
    }

    const events = await looms.getEvents(runId)
    const treeState = project(threadTree, events)
    const tree = toThreadTree(treeState)

    if (tree.root?.status === 'waiting') {
      throw new Error(
        'assistant threadTree stuck waiting after checkout approved (sibling wait leak)',
      )
    }

    const checkoutChild = tree.root?.children.find((c) => c.definitionName === 'checkout')

    if (!checkoutChild || checkoutChild.status !== 'completed') {
      throw new Error(`assistant checkout child expected completed, got ${checkoutChild?.status}`)
    }

    if (!events.some((event) => event.type === 'agent.tool.result')) {
      throw new Error('assistant expected tool result after checkout completed')
    }
  }

  {
    const caller = defineAgent({
      name: 'checkout_caller',
      instructions: 'run checkout',
      tools: [checkout],
      runTurn: ({ turn }) => {
        if (turn === 1) {
          return {
            message: {
              role: 'assistant',
              content: '',
              toolCalls: [{ id: 'call_checkout', name: 'checkout', arguments: {} }],
            },
            toolCalls: [{ id: 'call_checkout', name: 'checkout', arguments: {} }],
          }
        }

        return {
          message: { role: 'assistant', content: 'checkout finished' },
          done: true,
          output: { ok: true },
        }
      },
    })

    const scripted = createLooms({
      definitions: [...definitions, caller],
      modules: demoModules(),
    })

    const { runId, state } = await scripted.start(caller, 'run checkout')

    if (rootOf(state)?.status !== 'waiting') {
      throw new Error(`checkout_caller expected waiting on approval, got ${rootOf(state)?.status}`)
    }

    const child = Object.values(state.threads).find(
      (thread) => thread.definitionName === 'checkout',
    )

    if (!child) {
      throw new Error('checkout_caller missing checkout child')
    }

    const childInput = z.object({ amount: z.number(), currency: z.string() }).safeParse(child.input)

    if (
      !childInput.success ||
      childInput.data.amount !== 150 ||
      childInput.data.currency !== 'USD'
    ) {
      throw new Error(
        `checkout_caller expected defaulted input, got ${JSON.stringify(child.input)}`,
      )
    }

    const pending = await scripted.project(runId, pendingApprovals)
    const approvalId = pending.items.find((item) => item.status === 'pending')?.approvalId

    if (!approvalId) {
      throw new Error('checkout_caller missing pending approval')
    }

    const next = await scripted.signal(runId, [decision(approvalId, 'approve')])

    if (next.status !== 'completed') {
      throw new Error(`checkout_caller after approve expected completed, got ${next.status}`)
    }

    const events = await scripted.getEvents(runId)

    if (!events.some((event) => event.type === 'payments.charge.authorized')) {
      throw new Error('checkout_caller expected payments.charge.authorized')
    }

    const treeState = project(threadTree, events)
    const tree = toThreadTree(treeState)

    if (tree.root?.status !== 'completed') {
      throw new Error(
        `checkout_caller threadTree root expected completed, got ${tree.root?.status}`,
      )
    }

    const checkoutNode = tree.root.children.find((c) => c.definitionName === 'checkout')

    if (!checkoutNode || checkoutNode.status !== 'completed') {
      throw new Error(
        `checkout_caller threadTree checkout expected completed, got ${checkoutNode?.status}`,
      )
    }
  }

  {
    const failingApproval = defineRuntimeModule({
      namespace: 'approval',
      protocolVersion: '1.0.0',
      effects: {
        request: defineEffect({
          type: 'approval.request',
          execute: () => Effect.fail(new Error('approval handler down')),
        }),
      },
    })

    const asker = defineAgent({
      name: 'asker',
      instructions: 'ask',
      tools: [
        asEffectsTool({
          name: 'ask_approval',
          description: 'Ask a human to approve or reject a request',
          effects: () => gate({ title: 'Approve this request?' }),
          waitOn: { type: 'approval.decided' },
        }),
      ],
      runTurn: ({ turn, messages }) => {
        if (turn === 1) {
          return {
            message: {
              role: 'assistant',
              content: '',
              toolCalls: [{ id: 't1', name: 'ask_approval', arguments: {} }],
            },
            toolCalls: [{ id: 't1', name: 'ask_approval', arguments: {} }],
          }
        }

        const last = messages.at(-1)?.content ?? ''
        return {
          message: { role: 'assistant', content: last },
          done: true,
          output: { text: last },
        }
      },
    })

    const failing = createLooms({
      definitions: [asker],
      modules: [agent(), workflow(), failingApproval],
    })

    const { runId, state } = await failing.start(asker, 'please approve')

    if (state.status !== 'completed') {
      throw new Error(`asker expected completed after handler failure, got ${state.status}`)
    }

    if (Object.keys(state.waits).length > 0) {
      throw new Error(`asker parked on waits after handler failure: ${JSON.stringify(state.waits)}`)
    }

    const events = await failing.getEvents(runId)

    if (events.some((event) => event.type === 'runtime.wait.registered')) {
      throw new Error('asker should not register approval waits after handler failure')
    }

    const toolResult = events.find((event) => event.type === 'agent.tool.result')
    const error = toolResult && isJsonObject(toolResult.payload) ? toolResult.payload.error : null

    if (!isJsonString(error) || !error.includes('approval handler down')) {
      throw new Error(`asker expected tool error, got ${JSON.stringify(toolResult?.payload)}`)
    }
  }
}

if (import.meta.main) {
  try {
    await verifyDemo()
    console.log('demo verify: ok')
  } catch (err) {
    console.error('demo verify: failed')
    console.error(err)
    process.exit(1)
  }
}
