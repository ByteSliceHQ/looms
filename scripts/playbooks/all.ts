#!/usr/bin/env bun
/**
 * Run all demo playbooks sequentially.
 *
 * Prereq: bun run demo   (separate terminal)
 * Run:    bun run scripts/playbooks/all.ts
 */

import { $ } from 'bun'
import { ensureHost, log, LOOMS_URL } from './_lib.ts'

await ensureHost()
log('running all playbooks against', LOOMS_URL)

const scripts = [
  'scripts/playbooks/01-agents.ts',
  'scripts/playbooks/02-hitl.ts',
  'scripts/playbooks/03-pipeline-and-chat.ts',
]

let failed = false
for (const script of scripts) {
  log(`→ ${script}`)
  const result = await $`bun run ${script}`.nothrow()
  if (result.exitCode !== 0) {
    failed = true
    console.error(`playbook failed: ${script}`)
  }
}

process.exit(failed ? 1 : 0)
