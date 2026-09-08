import { createLoomsClient } from '@looms/client'
import type { JsonValue } from '@looms/core'
import { createLooms } from '@looms/runtime'
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
).pipe(Command.withDescription('Start the Looms runtime host'), Command.withShortDescription('Start the runtime'))

const loomsBase = Command.make('looms').pipe(
  Command.withDescription('Looms durable agents & workflows'),
  Command.withSharedFlags({ url: urlFlag }),
)

const callAgent = Command.make(
  'agent',
  {
    name: Argument.string('name').pipe(Argument.withDescription('Agent definition name')),
    json: Argument.string('json').pipe(
      Argument.withDescription('Optional JSON input'),
      Argument.optional,
    ),
  },
  Effect.fn('callAgent')(function* ({ name, json }) {
    const { url } = yield* loomsBase
    const result = yield* tryClient(() => clientFor(url).startAgent(name, parseJsonArg(json)))
    yield* Console.log(JSON.stringify(result, null, 2))
  }),
).pipe(Command.withDescription('Start an agent'), Command.withShortDescription('Start an agent'))

const callWorkflow = Command.make(
  'workflow',
  {
    name: Argument.string('name').pipe(Argument.withDescription('Workflow definition name')),
    json: Argument.string('json').pipe(
      Argument.withDescription('Optional JSON input'),
      Argument.optional,
    ),
  },
  Effect.fn('callWorkflow')(function* ({ name, json }) {
    const { url } = yield* loomsBase
    const result = yield* tryClient(() => clientFor(url).startWorkflow(name, parseJsonArg(json)))
    yield* Console.log(JSON.stringify(result, null, 2))
  }),
).pipe(Command.withDescription('Start a workflow'), Command.withShortDescription('Start a workflow'))

const call = Command.make('call').pipe(
  Command.withDescription('Start an agent or workflow'),
  Command.withShortDescription('Start an agent or workflow'),
  Command.withSubcommands([callAgent, callWorkflow]),
)

const events = Command.make(
  'events',
  {
    actorId: Argument.string('actorId').pipe(Argument.withDescription('Actor id')),
  },
  Effect.fn('events')(function* ({ actorId }) {
    const { url } = yield* loomsBase
    const result = yield* tryClient(() => clientFor(url).getEvents(actorId))
    yield* Console.log(JSON.stringify(result, null, 2))
  }),
).pipe(Command.withDescription('List events for an actor'), Command.withShortDescription('List actor events'))

const state = Command.make(
  'state',
  {
    actorId: Argument.string('actorId').pipe(Argument.withDescription('Actor id')),
  },
  Effect.fn('state')(function* ({ actorId }) {
    const { url } = yield* loomsBase
    const result = yield* tryClient(() => clientFor(url).getState(actorId))
    yield* Console.log(JSON.stringify(result, null, 2))
  }),
).pipe(Command.withDescription('Show actor state'), Command.withShortDescription('Show actor state'))

const review = Command.make(
  'review',
  {
    actorId: Argument.string('actorId').pipe(Argument.withDescription('Actor id')),
    reviewId: Argument.string('reviewId').pipe(Argument.withDescription('Pending review id')),
    approve: Flag.boolean('approve').pipe(
      Flag.withAlias('a'),
      Flag.withDescription('Approve the review'),
      Flag.withDefault(false),
    ),
    reject: Flag.boolean('reject').pipe(
      Flag.withAlias('r'),
      Flag.withDescription('Reject the review'),
      Flag.withDefault(false),
    ),
  },
  Effect.fn('review')(function* ({ actorId, reviewId, approve, reject }) {
    if (approve === reject) {
      return yield* new CliError.UserError({
        cause: new Error('Specify exactly one of --approve or --reject'),
        userMessage: 'Specify exactly one of --approve or --reject',
      })
    }
    const outcome = approve ? 'approve' : 'reject'
    const { url } = yield* loomsBase
    const result = yield* tryClient(() =>
      clientFor(url).decideReview(actorId, reviewId, {
        actionId: outcome,
        outcome,
      }),
    )
    yield* Console.log(JSON.stringify(result, null, 2))
  }),
).pipe(
  Command.withDescription('Approve or reject a human review'),
  Command.withShortDescription('Decide a review'),
)

const steer = Command.make(
  'steer',
  {
    actorId: Argument.string('actorId').pipe(Argument.withDescription('Actor id')),
    message: Argument.string('message').pipe(
      Argument.withDescription('Steering message'),
      Argument.variadic({ min: 1 }),
    ),
    interrupt: Flag.boolean('interrupt').pipe(
      Flag.withDescription('Interrupt the current turn (use --no-interrupt to disable)'),
      Flag.withDefault(true),
    ),
  },
  Effect.fn('steer')(function* ({ actorId, message, interrupt }) {
    const { url } = yield* loomsBase
    const result = yield* tryClient(() =>
      clientFor(url).steer(actorId, message.join(' '), { interrupt }),
    )
    yield* Console.log(JSON.stringify(result, null, 2))
  }),
).pipe(
  Command.withDescription('Send a steering message to a running actor'),
  Command.withShortDescription('Steer an actor'),
)

const tail = Command.make(
  'tail',
  {
    actorId: Argument.string('actorId').pipe(Argument.withDescription('Actor id')),
  },
  Effect.fn('tail')(function* ({ actorId }) {
    const { url } = yield* loomsBase
    const client = clientFor(url)

    yield* Console.log(`Tailing ${actorId} (ctrl-c to stop)`)
    yield* Effect.scoped(
      Effect.gen(function* () {
        const queue = yield* Queue.unbounded<string>()
        yield* Effect.acquireRelease(
          Effect.sync(() =>
            client.subscribeEvents(actorId, (event) => {
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
  Command.withDescription('Stream events for an actor'),
  Command.withShortDescription('Tail actor events'),
)

export const looms = loomsBase.pipe(
  Command.withSubcommands([serve, call, events, state, review, steer, tail]),
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
