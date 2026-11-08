import { Effect, Predicate } from 'effect'

import type { EventInput } from './envelope'
import type { AnyRuntimeModule } from './module'
import {
  validateInputEffect,
  validateInputSync,
  type InferDefinedSchema,
  type InvalidInputError,
  type SchemaInput,
} from './schema'
import { asJson, type JsonValue } from './types'

const signalBrand = Symbol.for('@looms/core/signal')

/** Options for a signal call. `threadId` stamps events that do not already set one. */
export interface SignalOptions {
  readonly threadId?: string
}

type SignalResult = EventInput | readonly EventInput[]

/**
 * A named, schema-backed event builder. Callable as `(input, options?) => events`.
 * When `input` is omitted on the definition, the first argument is options: `pause()` or
 * `stopAgentTurn({ threadId })`.
 */
export type SignalDefinition<
  TInput = JsonValue | undefined,
  E extends SignalResult = EventInput,
> = {
  readonly description?: string
  readonly input?: SchemaInput
  readonly [signalBrand]: true
} & ([TInput] extends [undefined]
  ? {
      (options?: SignalOptions): E
    }
  : {
      (input: TInput, options?: SignalOptions): E
    })

/** Erased signal shape for registries, publishing, and `findSignal`. */
export type AnySignalDefinition = {
  readonly description?: string
  readonly input?: SchemaInput
  readonly [signalBrand]: true
  // `any` args so concrete SignalDefinition call signatures stay assignable here.
  (...args: any[]): SignalResult
}

export function isSignalDefinition(value: unknown): value is AnySignalDefinition {
  return Predicate.isFunction(value) && signalBrand in value
}

function stampOne(event: EventInput, threadId: string | undefined): EventInput {
  return threadId !== undefined && event.threadId === undefined ? { ...event, threadId } : event
}

function isEventBatch(built: SignalResult): built is readonly EventInput[] {
  return Array.isArray(built)
}

function asEventList(built: SignalResult): EventInput[] {
  return isEventBatch(built) ? [...built] : [built]
}

/** Stamp `threadId` onto events that do not already set one. Preserves single vs batch shape. */
export function stampSignalThread(built: SignalResult, threadId: string | undefined): SignalResult {
  if (isEventBatch(built)) {
    return built.map((event) => stampOne(event, threadId))
  }

  return stampOne(built, threadId)
}

interface DefineSignalInput<TSchema, E extends SignalResult> {
  readonly description?: string
  readonly input?: TSchema
  readonly build: (input: InferDefinedSchema<TSchema, undefined>) => E
}

/**
 * Low-level signal constructor. Inside a module, prefer `m.signal` / `scope.signal`,
 * which check that built events belong to the module's catalogs.
 */
export function defineSignal<
  TSchema extends SchemaInput | undefined = undefined,
  E extends SignalResult = EventInput,
>(def: DefineSignalInput<TSchema, E>): SignalDefinition<InferDefinedSchema<TSchema, undefined>, E> {
  type Input = InferDefinedSchema<TSchema, undefined>

  function invoke(input: Input, options: SignalOptions | undefined): E {
    const stamped = stampSignalThread(def.build(input), options?.threadId)
    // SAFETY: stampSignalThread preserves single vs batch; build returns E.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return stamped as E
  }

  function noInput(): Input {
    // SAFETY: no-schema signals use InferDefinedSchema<undefined, undefined> === undefined.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return undefined as Input
  }

  // SAFETY: the callable matches the SignalDefinition overload for this input schema.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const call = (
    def.input === undefined
      ? (options?: SignalOptions) => invoke(noInput(), options)
      : (input: Input, options?: SignalOptions) => invoke(input, options)
  ) as SignalDefinition<Input, E>

  Object.defineProperty(call, signalBrand, { value: true })

  if (def.description !== undefined) {
    Object.defineProperty(call, 'description', { value: def.description })
  }

  if (def.input !== undefined) {
    Object.defineProperty(call, 'input', { value: def.input })
  }

  return call
}

/** Look up a signal by module namespace and member key. */
export function findSignal(
  modules: readonly AnyRuntimeModule[],
  namespace: string,
  name: string,
): AnySignalDefinition | undefined {
  for (const module of modules) {
    if (module.namespace !== namespace) {
      continue
    }

    const signals = module.signals

    if (!signals || !Object.hasOwn(signals, name)) {
      return undefined
    }

    const candidate = signals[name]

    return isSignalDefinition(candidate) ? candidate : undefined
  }

  return undefined
}

/**
 * Validate `rawInput` against the signal's schema, run `build`, and stamp `threadId`.
 * Returns the events that `runtime.signal` would append.
 */
export function runSignal(
  definition: AnySignalDefinition,
  rawInput: JsonValue,
  threadId?: string,
): Effect.Effect<EventInput[], InvalidInputError> {
  return Effect.gen(function* () {
    const schema = definition.input
    const built = schema ? definition(yield* validateInputEffect(schema, rawInput)) : definition()
    return asEventList(stampSignalThread(built, threadId))
  })
}

/** Sync form of {@link runSignal}. Throws {@link InvalidInputError} on bad input. */
export function runSignalSync(
  definition: AnySignalDefinition,
  rawInput: JsonValue,
  threadId?: string,
): EventInput[] {
  const schema = definition.input
  const built = schema ? definition(validateInputSync(schema, asJson(rawInput))) : definition()
  return asEventList(stampSignalThread(built, threadId))
}
