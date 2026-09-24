#!/usr/bin/env bun
import { BunRuntime, BunServices } from '@effect/platform-bun'
import { Effect } from 'effect'
import { Command } from 'effect/unstable/cli'

import { looms, VERSION } from './commands'

// This executable boundary owns the lifetime of the complete application layer.
// oxlint-disable-next-line effecttsgo/strict-effect-provide
looms.pipe(Command.run({ version: VERSION }), Effect.provide(BunServices.layer), BunRuntime.runMain)
