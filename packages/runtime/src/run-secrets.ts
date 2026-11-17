import { Clock, Data, Effect } from 'effect'

import {
  hasEntries,
  isRunTerminal,
  sameStringRecord,
  type EventStore,
  type RunAttributes,
  type RunState,
  type SecretContext,
} from '@looms/core'

import { RuntimeExecutionError, SecretContextConflictError } from './errors'
import { notifyObserver, type RuntimeObserver } from './observer'

/** The run a secret provider is asked about. Everything here is safe to log. */
export interface SecretRun {
  readonly runId: string
  readonly kind: string | null
  readonly definitionName: string | null
  readonly definitionVersion: string | null
  readonly attributes: RunAttributes
  readonly correlationId: string | null
  /** The run that launched this one, when an effect did. */
  readonly launchedByRunId: string | null
}

/** One attempt of one effect. */
export interface SecretAttempt {
  readonly effectId: string
  readonly attempt: number
  /** The effect's type, such as `agent.model`. */
  readonly type: string
  readonly threadId: string
}

/** A run that `run` is about to start. */
export interface SecretChild {
  readonly runId: string
  /** `launch`: an effect of `run` started it. `fork`: it continues `run`, which has finished. */
  readonly relation: 'launch' | 'fork'
  readonly kind: string | null
  readonly definitionName: string | null
  readonly attributes: RunAttributes
}

/** What one attempt receives, and optionally what the run holds from now on. */
export interface AttemptSecrets {
  /** What the attempt's handler sees as `ctx.secrets`. */
  readonly secrets: SecretContext
  /**
   * Replaces what the run holds. Leave it out to keep what is held. Use it to store a credential
   * the provider just fetched or refreshed, so the next attempt does not fetch it again.
   */
  readonly hold?: SecretContext
}

type ProviderResult<A> = A | Promise<A> | Effect.Effect<A, Error>

/**
 * Decides what a run holds and what each attempt receives. Every method is optional, and a
 * runtime with no provider holds the secrets a start supplies and hands them to every attempt.
 *
 * Looms stores what the run holds beside the log, never in an event, snapshot, or HTTP response,
 * and deletes it when the run finishes. What an attempt receives is never stored.
 *
 * A method may be called more than once for the same run or attempt (a start is retried, a worker
 * asks twice), so each must be safe to repeat. Errors a method throws are reported to the
 * observer and never written to the log, but keep secret values out of their messages anyway.
 */
export interface SecretProvider {
  /**
   * What the run holds, decided when it starts. `supplied` is what the start passed as `secrets`.
   * Not called again once the run holds something.
   */
  readonly provision?: (input: {
    readonly run: SecretRun
    readonly supplied: SecretContext
  }) => ProviderResult<SecretContext>
  /**
   * What one attempt receives, decided each time an attempt is about to get its secrets. `held`
   * is what the run holds now. Return the held secrets narrowed to this attempt, and never the
   * held secrets themselves when they are worth more than one attempt. A failure fails the
   * attempt under the effect's retry policy.
   */
  readonly forAttempt?: (input: {
    readonly run: SecretRun
    readonly held: SecretContext
    readonly attempt: SecretAttempt
  }) => ProviderResult<AttemptSecrets>
  /**
   * What a run started by this one is supplied with, which that run's `provision` then sees.
   * Without this a child run is supplied with nothing unless the launch passes `secrets`.
   */
  readonly forChild?: (input: {
    readonly run: SecretRun
    readonly held: SecretContext
    readonly child: SecretChild
  }) => ProviderResult<SecretContext>
  /**
   * Called once the run has finished, before Looms deletes what it holds. A failure is reported
   * and the held secrets are deleted regardless, so anything held must also expire by itself.
   */
  readonly revoke?: (input: {
    readonly run: SecretRun
    readonly held: SecretContext
  }) => ProviderResult<void>
}

/**
 * Encrypts what a run holds before it is stored. `runId` must be bound into the result, so one
 * run's stored secrets cannot be opened as another's.
 */
export interface SecretSealer {
  readonly seal: (runId: string, secrets: SecretContext) => Effect.Effect<string, Error>
  readonly open: (runId: string, sealed: string) => Effect.Effect<SecretContext, Error>
}

export type SecretStep = 'provision' | 'forAttempt' | 'forChild' | 'revoke' | 'seal' | 'open'

/** A secret provider or sealer failed. The message never includes secret values. */
export class SecretProviderError extends Data.TaggedError('SecretProviderError')<{
  readonly runId: string
  readonly step: SecretStep
  readonly message: string
  readonly cause: unknown
}> {
  constructor(runId: string, step: SecretStep, cause: unknown) {
    super({ runId, step, cause, message: `Secrets for run "${runId}" failed at ${step}` })
    this.name = 'SecretProviderError'
  }
}

/** The one key a sealed record is stored under. A held secret cannot use this name. */
export const SEALED_SECRETS_KEY = 'looms.sealed'

const NO_STORE = 'This event store cannot persist a secret context'

export interface RunSecretsOptions {
  readonly provider?: SecretProvider
  readonly sealer?: SecretSealer
  readonly observer?: RuntimeObserver
}

export interface RunSecrets {
  /** Stores what a new run holds. A retried start changes nothing once the run holds something. */
  readonly provision: (
    store: EventStore,
    runId: string,
    state: RunState,
    supplied: SecretContext | undefined,
  ) => Effect.Effect<void, Error>
  /** What one attempt receives. Fails when the provider or the store does. */
  readonly forAttempt: (
    store: EventStore,
    runId: string,
    state: RunState,
    attempt: SecretAttempt,
  ) => Effect.Effect<SecretContext, Error>
  /** What a run started by this one is supplied with. */
  readonly forChild: (
    store: EventStore,
    runId: string,
    state: RunState,
    child: SecretChild,
  ) => Effect.Effect<SecretContext, Error>
  /** Revokes and deletes what a finished run holds. Never fails. */
  readonly release: (store: EventStore, runId: string, state: RunState) => Effect.Effect<void>
}

export function secretRun(runId: string, state: RunState): SecretRun {
  const start = state.startIdentity

  return {
    runId,
    kind: start?.kind ?? null,
    definitionName: start?.definitionName ?? null,
    definitionVersion: start?.definitionVersion ?? null,
    attributes: state.attributes,
    correlationId: start?.correlationId ?? null,
    launchedByRunId: start?.launchedBy?.runId ?? null,
  }
}

function asEffect<A>(result: A | Effect.Effect<A, Error>): Effect.Effect<A, Error> {
  return Effect.isEffect(result) ? result : Effect.succeed(result)
}

function call<A>(
  runId: string,
  step: SecretStep,
  make: () => ProviderResult<A>,
): Effect.Effect<A, SecretProviderError> {
  // A provider may throw, reject, or fail an Effect. All three become one error.
  return Effect.tryPromise({
    try: () => Promise.resolve().then(make),
    catch: (cause) => new SecretProviderError(runId, step, cause),
  }).pipe(
    Effect.flatMap((result) =>
      asEffect(result).pipe(
        Effect.mapError((cause) => new SecretProviderError(runId, step, cause)),
      ),
    ),
  )
}

function describe(error: Error): string {
  if (!(error instanceof SecretProviderError)) {
    return error.message
  }

  return error.cause instanceof Error ? error.cause.message : String(error.cause)
}

export function createRunSecrets(options: RunSecretsOptions = {}): RunSecrets {
  const { provider, sealer } = options

  const reportFailure = (runId: string, step: SecretStep, error: Error) =>
    Clock.currentTimeMillis.pipe(
      Effect.map((at) =>
        notifyObserver(options.observer, {
          type: 'secrets.failed',
          runId,
          at,
          step,
          detail: describe(error),
        }),
      ),
    )

  const open = (runId: string, stored: SecretContext): Effect.Effect<SecretContext, Error> => {
    const sealed = stored[SEALED_SECRETS_KEY]

    if (sealed === undefined) {
      // Stored before sealing was turned on.
      return Effect.succeed(stored)
    }

    if (!sealer) {
      return Effect.fail(
        new SecretProviderError(
          runId,
          'open',
          new Error('The stored secrets are sealed and this runtime has no secretSealer'),
        ),
      )
    }

    return sealer
      .open(runId, sealed)
      .pipe(Effect.mapError((cause) => new SecretProviderError(runId, 'open', cause)))
  }

  const held = (store: EventStore, runId: string): Effect.Effect<SecretContext, Error> =>
    store.runSecrets
      ? store.runSecrets.get(runId).pipe(Effect.flatMap((stored) => open(runId, stored)))
      : Effect.succeed({})

  const hold = (
    store: EventStore,
    runId: string,
    next: SecretContext,
  ): Effect.Effect<void, Error> => {
    const stored = store.runSecrets

    if (!stored) {
      return hasEntries(next) ? Effect.fail(new RuntimeExecutionError(NO_STORE)) : Effect.void
    }

    if (!hasEntries(next)) {
      return stored.delete(runId)
    }

    if (Object.hasOwn(next, SEALED_SECRETS_KEY)) {
      return Effect.fail(
        new RuntimeExecutionError(`A secret cannot be named "${SEALED_SECRETS_KEY}"`),
      )
    }

    if (!sealer) {
      return stored.put(runId, next)
    }

    return sealer.seal(runId, next).pipe(
      Effect.mapError((cause) => new SecretProviderError(runId, 'seal', cause)),
      Effect.flatMap((sealed) => stored.put(runId, { [SEALED_SECRETS_KEY]: sealed })),
    )
  }

  /** Without a provider that provisions, a run holds what its start supplied, written once. */
  const holdSupplied = (
    store: EventStore,
    runId: string,
    current: SecretContext,
    supplied: SecretContext | undefined,
  ): Effect.Effect<void, Error> => {
    if (supplied === undefined || sameStringRecord(current, supplied)) {
      return Effect.void
    }

    return hasEntries(current)
      ? Effect.fail(new SecretContextConflictError(runId))
      : hold(store, runId, supplied)
  }

  const provision: RunSecrets['provision'] = (store, runId, state, supplied) => {
    const requested = supplied ?? {}

    // A finished run holds nothing, and a retried start must not put anything back.
    if (isRunTerminal(state)) {
      return Effect.void
    }

    if (!store.runSecrets && hasEntries(requested)) {
      return Effect.fail(new RuntimeExecutionError(NO_STORE))
    }

    const decide = provider?.provision

    return held(store, runId).pipe(
      Effect.flatMap((current) => {
        if (!decide) {
          return holdSupplied(store, runId, current, supplied)
        }

        if (hasEntries(current)) {
          return Effect.void
        }

        return call(runId, 'provision', () =>
          decide({ run: secretRun(runId, state), supplied: requested }),
        ).pipe(
          Effect.tapError((error) => reportFailure(runId, 'provision', error)),
          Effect.flatMap((next) => hold(store, runId, next)),
        )
      }),
    )
  }

  const issued = (runId: string, attempt: SecretAttempt, secrets: SecretContext) =>
    hasEntries(secrets)
      ? Clock.currentTimeMillis.pipe(
          Effect.map((at) =>
            notifyObserver(options.observer, {
              type: 'secrets.issued',
              runId,
              at,
              effectId: attempt.effectId,
              attempt: attempt.attempt,
              names: Object.keys(secrets).toSorted(),
            }),
          ),
        )
      : Effect.void

  const forAttempt: RunSecrets['forAttempt'] = (store, runId, state, attempt) => {
    const decide = provider?.forAttempt
    const current = held(store, runId)

    const decided = decide
      ? current.pipe(
          Effect.flatMap((holding) =>
            call(runId, 'forAttempt', () =>
              decide({ run: secretRun(runId, state), held: holding, attempt }),
            ).pipe(
              Effect.flatMap((result) => {
                const replace = result.hold !== undefined && !sameStringRecord(result.hold, holding)

                const stored = replace ? hold(store, runId, result.hold ?? {}) : Effect.void

                return stored.pipe(Effect.as(result.secrets))
              }),
            ),
          ),
        )
      : current

    return decided.pipe(
      Effect.tap((secrets) => issued(runId, attempt, secrets)),
      Effect.tapError((error) => reportFailure(runId, 'forAttempt', error)),
    )
  }

  const forChild: RunSecrets['forChild'] = (store, runId, state, child) => {
    const decide = provider?.forChild

    if (!decide) {
      return Effect.succeed({})
    }

    return held(store, runId).pipe(
      Effect.flatMap((current) =>
        call(runId, 'forChild', () =>
          decide({ run: secretRun(runId, state), held: current, child }),
        ),
      ),
      Effect.tapError((error) => reportFailure(runId, 'forChild', error)),
    )
  }

  const release: RunSecrets['release'] = (store, runId, state) => {
    const stored = store.runSecrets

    if (!stored) {
      return Effect.void
    }

    const decide = provider?.revoke

    const revoke = (raw: SecretContext): Effect.Effect<void> =>
      decide
        ? open(runId, raw).pipe(
            Effect.flatMap((current) =>
              call(runId, 'revoke', () => decide({ run: secretRun(runId, state), held: current })),
            ),
            Effect.catch((error) => reportFailure(runId, 'revoke', error)),
          )
        : Effect.void

    return stored.get(runId).pipe(
      Effect.flatMap((raw) =>
        hasEntries(raw) ? revoke(raw).pipe(Effect.andThen(stored.delete(runId))) : Effect.void,
      ),
      Effect.catch((error) =>
        reportFailure(runId, 'revoke', error).pipe(
          Effect.andThen(
            Effect.logWarning(`[looms] could not delete the secrets held by run ${runId}`),
          ),
        ),
      ),
    )
  }

  return { provision, forAttempt, forChild, release }
}
