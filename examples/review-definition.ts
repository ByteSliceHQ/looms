import { z } from 'zod'

import { agent, defineAgent, defineTool } from '@looms/agent'
import { approval, gate } from '@looms/approval'
import { defineWorkflow, workflow } from '@looms/workflow'

// A deterministic agent makes the first run reproducible without an API key.
// Replace runTurn with a model adapter when you are ready to use an LLM.
const draftMessage = defineTool({
  name: 'draft_message',
  description: 'Draft a release announcement for review.',
  input: z.object({ topic: z.string() }),
  handler: ({ topic }) => ({ text: `Ready for review: ${topic}` }),
})

export const writer = defineAgent({
  name: 'writer',
  instructions: 'Draft an announcement, then return it for human review.',
  input: z.object({ topic: z.string() }),
  tools: [draftMessage],
  maxTurns: 3,
  runTurn: ({ input, turn }) =>
    turn === 1
      ? {
          message: { role: 'assistant', content: 'Preparing a draft.' },
          toolCalls: [{ id: 'draft', name: 'draft_message', arguments: input }],
        }
      : {
          message: { role: 'assistant', content: `Ready for review: ${input.topic}` },
          done: true,
          output: { text: `Ready for review: ${input.topic}` },
        },
})

const approved = z.object({ outcome: z.literal('approve') })

export const release = defineWorkflow({
  name: 'release-v1',
  input: z.object({ topic: z.string() }),
  nodes: [
    { id: 'draft', run: (ctx) => ctx.spawn(writer, ctx.input) },
    {
      id: 'review',
      deps: ['draft'],
      run: (ctx) => ctx.effects(gate({ title: `Publish ${ctx.input.topic}?` })),
    },
    {
      id: 'publish',
      deps: ['review'],
      run: (ctx) => {
        // A gate waits for a decision. Only an explicit approval permits publishing.
        if (!approved.safeParse(ctx.results.review).success) {
          return { published: false, reason: 'not-approved', simulated: true, draft: null }
        }

        // A simulated publication: no network request or external side effect.
        return {
          published: true,
          reason: 'approved',
          simulated: true,
          draft: ctx.results.draft ?? null,
        }
      },
    },
  ],
  output: ({ results }) => results.publish ?? null,
})

export const modules = [
  agent({ definitions: [writer] }),
  workflow({ definitions: [release] }),
  approval(),
]
