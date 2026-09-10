import {
  Config,
  Console,
  Effect,
  FileSystem,
  Layer,
  Option,
  Path,
  Queue,
  Stdio,
  Stream,
  Terminal,
} from 'effect'
import { Argument, CliError, Command, Flag } from 'effect/unstable/cli'
import { ChildProcessSpawner } from 'effect/unstable/process'

import { steer as steerEvent } from '@looms/agent'
import { decision } from '@looms/approval'
import { createLoomsClient } from '@looms/client'
import type { JsonValue } from '@looms/core'
import { createLooms } from '@looms/runtime'

const VERSION = '0.1.0'

const urlFlag = Flag.string('url').pipe(
  Flag.withDescription('Looms host base URL (env LOOMS_URL)'),
  Flag.withFallbackConfig(Config.string('LOOMS_URL')),
  Flag.withDefault('http://127.0.0.1:8787'),
  Flag.map((url) => url.replace(/\/$/, '')),
)

function parseJsonArg(raw: Option.Option<string>): JsonValue {
  if (Option.isNone(raw) || raw.value === '') return null
  try {
    // SAFETY: CLI JSON args decode to JsonValue; parse failures fall back to the raw string
    return JSON.parse(raw.value) as JsonValue
  } catch {
    return raw.value
  }
}

function clientFor(url: string) {
  return createLoomsClient({ baseUrl: url })
}

function tryClient<A>(run: () => Promise<A>): Effect.Effect<A, CliError.UserError> {
  return Effect.tryPromise({
    try: run,
    catch: (error) =>
      new CliError.UserError({
        cause: error,
        userMessage: error instanceof Error ? error.message : String(error),
      }),
  })
}

const serve = Command.make(
  'serve',
  {
    port: Flag.integer('port').pipe(
      Flag.withDescription('Port to listen on (env PORT)'),
      Flag.withFallbackConfig(Config.int('PORT')),
      Flag.withDefault(8787),
    ),
  },
  Effect.fn('serve')(function* ({ port }) {
    const looms = createLooms()
    const server = looms.serve({ port })
    yield* Console.log(`Looms runtime listening on http://127.0.0.1:${server?.port ?? port}`)
    return yield* Effect.never
  }),
).pipe(
  Command.withDescription('Start the Looms runtime host'),
  Command.withShortDescription('Start the runtime'),
)

const loomsBase = Command.make('looms').pipe(
  Command.withDescription('Looms thread runtime'),
  Command.withSharedFlags({ url: urlFlag }),
)

const start = Command.make(
  'start',
  {
    kind: Argument.string('kind').pipe(
      Argument.withDescription('Thread kind (e.g. agent, workflow)'),
    ),
    name: Argument.string('name').pipe(Argument.withDescription('Definition name')),
    json: Argument.string('json').pipe(
      Argument.withDescription('Optional JSON input'),
      Argument.optional,
    ),
  },
  Effect.fn('start')(function* ({ kind, name, json }) {
    const { url } = yield* loomsBase
    const result = yield* tryClient(() =>
      clientFor(url).startRun({ kind, definitionName: name, input: parseJsonArg(json) }),
    )
    yield* Console.log(JSON.stringify(result, null, 2))
  }),
).pipe(
  Command.withDescription(
    'Start a run from a registered definition: looms start agent echo \'{"text":"hi"}\'',
  ),
  Command.withShortDescription('Start a run'),
)

const events = Command.make(
  'events',
  {
    runId: Argument.string('runId').pipe(Argument.withDescription('Run id')),
  },
  Effect.fn('events')(function* ({ runId }) {
    const { url } = yield* loomsBase
    const result = yield* tryClient(() => clientFor(url).getEvents(runId))
    yield* Console.log(JSON.stringify(result, null, 2))
  }),
).pipe(
  Command.withDescription('List events for a run'),
  Command.withShortDescription('List run events'),
)

const state = Command.make(
  'state',
  {
    runId: Argument.string('runId').pipe(Argument.withDescription('Run id')),
  },
  Effect.fn('state')(function* ({ runId }) {
    const { url } = yield* loomsBase
    const result = yield* tryClient(() => clientFor(url).getRun(runId))
    yield* Console.log(JSON.stringify(result, null, 2))
  }),
).pipe(Command.withDescription('Show run state'), Command.withShortDescription('Show run state'))

const approve = Command.make(
  'approve',
  {
    runId: Argument.string('runId').pipe(Argument.withDescription('Run id')),
    approvalId: Argument.string('approvalId').pipe(Argument.withDescription('Pending approval id')),
    accept: Flag.boolean('approve').pipe(
      Flag.withAlias('a'),
      Flag.withDescription('Approve the request'),
      Flag.withDefault(false),
    ),
    reject: Flag.boolean('reject').pipe(
      Flag.withAlias('r'),
      Flag.withDescription('Reject the request'),
      Flag.withDefault(false),
    ),
  },
  Effect.fn('approve')(function* ({ runId, approvalId, accept, reject }) {
    if (accept === reject) {
      return yield* new CliError.UserError({
        cause: new Error('Specify exactly one of --approve or --reject'),
        userMessage: 'Specify exactly one of --approve or --reject',
      })
    }
    const outcome = accept ? 'approve' : 'reject'
    const { url } = yield* loomsBase
    const result = yield* tryClient(() =>
      clientFor(url).signal(runId, [decision(approvalId, outcome)]),
    )
    yield* Console.log(JSON.stringify(result, null, 2))
  }),
).pipe(
  Command.withDescription('Approve or reject a pending approval'),
  Command.withShortDescription('Decide an approval'),
)

const replay = Command.make(
  'replay',
  {
    runId: Argument.string('runId').pipe(Argument.withDescription('Run id')),
    seq: Argument.integer('seq').pipe(Argument.withDescription('Event sequence to replay through')),
  },
  Effect.fn('replay')(function* ({ runId, seq }) {
    const { url } = yield* loomsBase
    const result = yield* tryClient(() => clientFor(url).replayTo(runId, seq))
    yield* Console.log(JSON.stringify(result, null, 2))
  }),
).pipe(
  Command.withDescription('Replay a run to a sequence'),
  Command.withShortDescription('Replay to seq'),
)

const signal = Command.make(
  'signal',
  {
    runId: Argument.string('runId').pipe(Argument.withDescription('Run id')),
    type: Argument.string('type').pipe(Argument.withDescription('Event type')),
    json: Argument.string('json').pipe(
      Argument.withDescription('Optional JSON payload'),
      Argument.optional,
    ),
  },
  Effect.fn('signal')(function* ({ runId, type, json }) {
    const { url } = yield* loomsBase
    const result = yield* tryClient(() =>
      clientFor(url).signal(runId, [{ type, payload: parseJsonArg(json) }]),
    )
    yield* Console.log(JSON.stringify(result, null, 2))
  }),
).pipe(
  Command.withDescription('Append an external event and wake the run'),
  Command.withShortDescription('Signal a run'),
)

const steer = Command.make(
  'steer',
  {
    runId: Argument.string('runId').pipe(Argument.withDescription('Run id')),
    message: Argument.string('message').pipe(
      Argument.withDescription('Steering message'),
      Argument.variadic({ min: 1 }),
    ),
    interrupt: Flag.boolean('interrupt').pipe(
      Flag.withDescription('Interrupt the current turn (use --no-interrupt to disable)'),
      Flag.withDefault(true),
    ),
  },
  Effect.fn('steer')(function* ({ runId, message, interrupt }) {
    const { url } = yield* loomsBase
    const result = yield* tryClient(() =>
      clientFor(url).signal(runId, [steerEvent(message.join(' '), { interrupt })]),
    )
    yield* Console.log(JSON.stringify(result, null, 2))
  }),
).pipe(
  Command.withDescription('Send a steering message to a running agent'),
  Command.withShortDescription('Steer an agent'),
)

const tail = Command.make(
  'tail',
  {
    runId: Argument.string('runId').pipe(Argument.withDescription('Run id')),
  },
  Effect.fn('tail')(function* ({ runId }) {
    const { url } = yield* loomsBase
    const client = clientFor(url)

    yield* Console.log(`Tailing ${runId} (ctrl-c to stop)`)
    yield* Effect.scoped(
      Effect.gen(function* () {
        const queue = yield* Queue.unbounded<string>()
        yield* Effect.acquireRelease(
          Effect.sync(() =>
            client.subscribeEvents(runId, (event) => {
              Queue.offerUnsafe(queue, JSON.stringify(event))
            }),
          ),
          (stop) => Effect.sync(() => stop()),
        )
        yield* Stream.fromQueue(queue).pipe(Stream.runForEach((line) => Console.log(line)))
      }),
    )
  }),
).pipe(
  Command.withDescription('Stream events for a run'),
  Command.withShortDescription('Tail run events'),
)

export const looms = loomsBase.pipe(
  Command.withSubcommands([serve, start, events, state, approve, replay, signal, steer, tail]),
)

export const cliTestLayer = Layer.mergeAll(
  FileSystem.layerNoop({}),
  Path.layer,
  Stdio.layerTest({}),
  Layer.succeed(
    Terminal.Terminal,
    Terminal.make({
      columns: Effect.succeed(80),
      rows: Effect.succeed(24),
      readInput: Effect.die('unused'),
      readLine: Effect.die('unused'),
      display: () => Effect.void,
    }),
  ),
  Layer.succeed(
    ChildProcessSpawner.ChildProcessSpawner,
    ChildProcessSpawner.make(() => Effect.die('unused')),
  ),
)

/** Run the CLI with an explicit argv (for tests and programmatic use). */
export const runCli = (argv: ReadonlyArray<string>) =>
  Command.runWith(looms, { version: VERSION })(argv)

export { VERSION }
