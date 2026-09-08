import { __exportAll$1 as __exportAll, __require$1 as __require } from "../_ssr/rolldown-runtime-DaEwE2D6.mjs";
import { BaseProto, Class$1 as Class, Clock, ConsoleRef, DisablePropagation, NodeInspectSymbol, PipeInspectableProto, Reference, Scope, Service, TaggedClass, TaggedError, UnhandledLogLevel, _await, acquireRelease, add, addFinalizer$1 as addFinalizer, addFinalizerExit, andThen, annotateLogs, array, as, asVoid, assignProperty, cached, callback as callback$1, callback$1 as callback, catchCause, close, compose, constFalse, constTrue, constVoid, constant, context, contextWith, decodeBase64, delay, die$1 as die, doneUnsafe, dual, effect, effectContext, empty$2 as empty$5, empty$4, encodeBase64, ensuring, exit, exponential, fail, fail$2, fail$4 as fail$1, failCause, failCause$1, filter$2 as filter, filterInterruptors, findError, flatMap, flatMap$1, flow, fnUntraced, forEach, forever, forkDetach, forkIn, forkScoped, format$1 as format, fromInputUnsafe, fromIterable as fromIterable$1, fromNullishOr$1 as fromNullishOr, gen, get as get$3, getOrUndefined as getOrUndefined$1, getOrUndefined$1 as getOrUndefined, getOrUndefinedUnsafe, getUnsafe as getUnsafe$1, has, hasInterrupts, hasInterruptsOnly, hasProperty, head$1 as head, identity, ignore, ignoreCause, interrupt, interrupt$1 as interrupt$2, interrupt$2 as interrupt$1, interruptible, interruptors, into, isArrayNonEmpty, isEffect, isFailure, isFailure$1, isNone, isNotUndefined, isSome, isSuccess$1 as isSuccess, isTagged, logError, logWithLevel, make$4 as make$14, make$7 as make$13, makeEquivalence as makeEquivalence$1, makeEquivalence$1 as makeEquivalence, makeEquivalence$2, makeSpanScoped, makeUnsafe$1 as makeUnsafe$2, makeUnsafe$2 as makeUnsafe$3, map, map$3 as map$1, map$5 as map$2, mapError, match$2 as match, match$3 as match$1, matchCauseEffect, merge$1, millis, min, never, none, onError, onExit, onExitPrimitive$1 as onExitPrimitive, onInterrupt as onInterrupt$1, onInterrupt$1 as onInterrupt, orDie, pipeArguments, provide as provide$1, provide$2 as provide, provideContext, raceFirst, redact as redact$1, replicateEffect, retry, retryOrElse, runFork, runForkWith, runSync, scope, scopeAddFinalizerUnsafe, scopeCloseUnsafe, scopeMakeUnsafe, scoped, scopedWith, seconds, serviceOption, some, spaced, squash, strictEqual, structure, succeed, succeed$1 as succeed$2, succeed$5 as succeed$1, suspend, suspend$2 as suspend$1, symbol as symbol$1, symbol$1 as symbol$2, symbolRedactable, sync as sync$1, sync$1 as sync, tap, tapCause, timeout, toMillis, toPredicate, tryPromise, try_ as try_$1, try_$1 as try_, undefined_, uninterruptibleMask, uninterruptibleMask$1, updateContext, updateService, useSpan, void_, void_$2 as void_$1, whileLoop, withFiber as withFiber$1, withFiber$1 as withFiber, withParentSpan } from "./@effect/opentelemetry+[...].mjs";
import { Class as Class$1, Collector, Defect, Error as Error$2, Exit, Int, Literals, Never, NonEmptyArray, String as String$1, Struct, TaggedError as TaggedError$1, Union, Void, bounded, declare, decodeSync, decodeUnknownEffect, empty$1 as empty$6, encodeEffect, end, ensuring as ensuring$1, fail as fail$3, failCause as failCause$2, fromPubSub, fromQueue, fromReadableStream, fromTransform, get$1 as get$4, getCurrent, has as has$1, interrupt as interrupt$3, interruptAll, interruptAs, isSchema, isStream, make$4 as make$16, make$5 as make$15, makeCollectorUnsafe, makeUnsafe as makeUnsafe$4, makeUnsafe$1 as makeUnsafe$5, map$1 as map$3, offer$1 as offer, offerAll$1 as offerAll, optional, provideContext as provideContext$1, publishUnsafe, remove as remove$2, runForEachArray, set$1 as set$2, suspend as suspend$2, tag$1 as tag, take$2 as take, toCodecJson, toReadableStreamEffect, unbounded$1 as unbounded, unbounded$2 as unbounded$1, unwrap, values } from "./@livestore/common+[...].mjs";
import { createRequire } from "module";
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Console.js
/**
* Context reference for the current console service in the Effect system, allowing access to the active console implementation from within the Effect context.
*
* **When to use**
*
* Use when you need an effect to run against a provided console implementation,
* such as tests or alternate runtimes, rather than the default console.
*
* **Details**
*
* When no override is provided, the reference resolves to `globalThis.console`.
*
* **Example** (Accessing the current console)
*
* ```ts import.meta.vitest
* import { Console, Effect } from "effect"
*
* const messages: Array<unknown> = []
* const testConsole: Console.Console = Object.assign(Object.create(console), {
*   log: (...args: ReadonlyArray<unknown>) => messages.push(...args)
* })
* const program = Console.consoleWith((console) =>
*   Effect.sync(() => {
*     console.log("Hello from current console!")
*   })
* )
*
* Effect.runSync(Effect.provideService(program, Console.Console, testConsole))
* messages // => ["Hello from current console!"]
* ```
*
* @see {@link consoleWith} for using the current console service inside an effect
*
* @category services
* @since 2.0.0
*/
var Console = ConsoleRef;
/**
* Creates an Effect that provides access to the current console service and lets you perform operations with it within an Effect context.
*
* **Example** (Accessing the current console service)
*
* ```ts import.meta.vitest
* import { Console, Effect } from "effect"
*
* const messages: Array<unknown> = []
* const testConsole: Console.Console = Object.assign(Object.create(console), {
*   log: (...args: ReadonlyArray<unknown>) => messages.push(...args),
*   error: (...args: ReadonlyArray<unknown>) => messages.push(...args)
* })
* const program = Console.consoleWith((console) =>
*   Effect.sync(() => {
*     console.log("Hello, world!")
*     console.error("This is an error message")
*   })
* )
*
* Effect.runSync(Effect.provideService(program, Console.Console, testConsole))
* messages // => ["Hello, world!", "This is an error message"]
* ```
*
* @category constructors
* @since 2.0.0
*/
var consoleWith = (f) => withFiber((fiber) => f(fiber.getRef(Console)));
/**
* Logs a general-purpose message to the console.
*
* **Example** (Writing log messages)
*
* ```ts import.meta.vitest
* import { Console, Effect } from "effect"
*
* const messages: Array<ReadonlyArray<unknown>> = []
* const testConsole: Console.Console = Object.assign(Object.create(console), {
*   log: (...args: ReadonlyArray<unknown>) => messages.push(args)
* })
* const program = Effect.gen(function*() {
*   yield* Console.log("Hello, world!")
*   yield* Console.log("User data:", { name: "John", age: 30 })
*   yield* Console.log("Processing", 42, "items")
* })
*
* Effect.runSync(Effect.provideService(program, Console.Console, testConsole))
* const expected = [
*   ["Hello, world!"],
*   ["User data:", { name: "John", age: 30 }],
*   ["Processing", 42, "items"]
* ]
* messages // => expected
* ```
*
* @category accessors
* @since 2.0.0
*/
var log = (...args) => consoleWith((console) => sync(() => {
	console.log(...args);
}));
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/FiberMap.js
/**
* Manages fibers by key inside a scope.
*
* A `FiberMap<K, A, E>` owns a map of running fibers, interrupts them when its
* scope closes, and automatically removes each entry when the corresponding
* fiber completes. Use it when a program needs to start, replace, join, or
* interrupt background work by a stable key while keeping all fibers tied to
* one scope.
*
* @since 2.0.0
*/
var TypeId$16 = "~effect/FiberMap";
/**
* Returns `true` if a value is a `FiberMap`.
*
* **Details**
*
* This is a type guard that checks for the `FiberMap` runtime marker.
*
* **Example** (Checking if a value is a FiberMap)
*
* ```ts import.meta.vitest
* import { Effect, FiberMap } from "effect"
*
* const program = Effect.gen(function*() {
*   const map = yield* FiberMap.make<string>()
*
*   return [FiberMap.isFiberMap(map), FiberMap.isFiberMap({}), FiberMap.isFiberMap(null)]
* })
*
* const actual = await Effect.runPromise(Effect.scoped(program))
* actual // => [true, false, false]
* ```
*
* @category guards
* @since 2.0.0
*/
var isFiberMap = (u) => hasProperty(u, TypeId$16);
var Proto$9 = {
	[TypeId$16]: TypeId$16,
	[Symbol.iterator]() {
		if (this.state._tag === "Closed") return empty$4();
		return this.state.backing[Symbol.iterator]();
	},
	...PipeInspectableProto,
	toJSON() {
		return {
			_id: "FiberMap",
			state: this.state
		};
	}
};
var makeUnsafe$1 = (backing, deferred) => {
	const self = Object.create(Proto$9);
	self.state = {
		_tag: "Open",
		backing
	};
	self.deferred = deferred;
	return self;
};
/**
* Creates a scoped `FiberMap` for storing fibers by key.
*
* **Details**
*
* When the associated Scope is closed, all fibers in the map will be
* interrupted. You can add fibers to the map using `FiberMap.set` or
* `FiberMap.run`, and the fibers will be automatically removed from the
* `FiberMap` when they complete.
*
* **Example** (Creating a scoped FiberMap)
*
* ```ts import.meta.vitest
* import { Effect, FiberMap } from "effect"
*
* const program = Effect.gen(function*() {
*   const map = yield* FiberMap.make<string>()
*
*   // run some effects and add the fibers to the map
*   yield* FiberMap.run(map, "fiber a", Effect.never)
*   yield* FiberMap.run(map, "fiber b", Effect.never)
*
*   yield* Effect.yieldNow
*   return yield* FiberMap.size(map)
* }).pipe(
*   Effect.scoped // The fibers will be interrupted when the scope is closed
* )
*
* const actual = await Effect.runPromise(program)
* actual // => 2
* ```
*
* @category constructors
* @since 2.0.0
*/
var make$12 = () => acquireRelease(sync$1(() => makeUnsafe$1(empty$6(), makeUnsafe$2())), (map) => suspend(() => {
	const state = map.state;
	if (state._tag === "Closed") return void_;
	map.state = { _tag: "Closed" };
	return interruptAll(values(state.backing)).pipe(into(map.deferred));
}));
var internalFiberId$1 = -1;
var isInternalInterruption$1 = /*#__PURE__*/ toPredicate(/*#__PURE__*/ compose(filterInterruptors, /*#__PURE__*/ has(internalFiberId$1)));
/**
* Adds a fiber to the `FiberMap` under a key using a synchronous, unsafe
* mutation.
*
* **When to use**
*
* Use when an existing forked fiber must be installed under a key immediately
* and synchronous interruption of the replaced fiber is acceptable.
*
* **Details**
*
* When the fiber completes, it is removed from the map. If the key already has
* a fiber, that previous fiber is interrupted unless `onlyIfMissing` is set;
* in that case the new fiber is interrupted and the existing entry is kept.
*
* **Example** (Adding a fiber unsafely)
*
* ```ts import.meta.vitest
* import { Deferred, Effect, Fiber, FiberMap } from "effect"
*
* const program = Effect.gen(function*() {
*   const map = yield* FiberMap.make<string>()
*   const deferred = yield* Deferred.make<string>()
*
*   // Create a fiber and add it to the map
*   const fiber = yield* Effect.forkChild(Deferred.await(deferred))
*   FiberMap.setUnsafe(map, "greeting", fiber)
*
*   yield* Deferred.succeed(deferred, "Hello")
*
*   // Join the fiber to get its successful value
*   return yield* Fiber.join(fiber)
* })
*
* const actual = await Effect.runPromise(Effect.scoped(program))
* actual // => "Hello"
* ```
*
* @category combinators
* @since 4.0.0
*/
var setUnsafe$1 = /*#__PURE__*/ dual((args) => isFiberMap(args[0]), (self, key, fiber, options) => {
	if (self.state._tag === "Closed") {
		fiber.interruptUnsafe(internalFiberId$1);
		return;
	}
	const previous = get$4(self.state.backing, key);
	if (previous._tag === "Some") {
		if (options?.onlyIfMissing === true) {
			fiber.interruptUnsafe(internalFiberId$1);
			return;
		} else if (previous.value === fiber) return;
		previous.value.interruptUnsafe(internalFiberId$1);
	}
	set$2(self.state.backing, key, fiber);
	fiber.addObserver((exit) => {
		if (self.state._tag === "Closed") return;
		const current = get$4(self.state.backing, key);
		if (isSome(current) && fiber === current.value) remove$2(self.state.backing, key);
		if (isFailure(exit) && (options?.propagateInterruption === true ? !isInternalInterruption$1(exit.cause) : !hasInterruptsOnly(exit.cause))) doneUnsafe(self.deferred, exit);
	});
});
/**
* Checks whether a key exists in the FiberMap.
*
* **Example** (Checking if a key exists unsafely)
*
* ```ts import.meta.vitest
* import { Effect, FiberMap } from "effect"
*
* const program = Effect.gen(function*() {
*   const map = yield* FiberMap.make<string>()
*
*   // Add a fiber to the map
*   yield* FiberMap.run(map, "task1", Effect.never)
*
*   // Check if keys exist
*   return [FiberMap.hasUnsafe(map, "task1"), FiberMap.hasUnsafe(map, "task2")]
* })
*
* const actual = await Effect.runPromise(Effect.scoped(program))
* actual // => [true, false]
* ```
*
* @category combinators
* @since 4.0.0
*/
var hasUnsafe = /*#__PURE__*/ dual(2, (self, key) => self.state._tag === "Closed" ? false : has$1(self.state.backing, key));
/**
* Removes a fiber from the FiberMap, interrupting it if it exists.
*
* **Example** (Removing a fiber)
*
* ```ts import.meta.vitest
* import { Effect, FiberMap } from "effect"
*
* const program = Effect.gen(function*() {
*   const map = yield* FiberMap.make<string>()
*
*   // Add some fibers to the map
*   yield* FiberMap.run(map, "task1", Effect.never)
*   yield* FiberMap.run(map, "task2", Effect.never)
*
*   const sizeBefore = yield* FiberMap.size(map)
*
*   // Remove a specific fiber (this will interrupt it)
*   yield* FiberMap.remove(map, "task1")
*
*   return [sizeBefore, yield* FiberMap.size(map)]
* })
*
* const actual = await Effect.runPromise(Effect.scoped(program))
* actual // => [2, 1]
* ```
*
* @category combinators
* @since 2.0.0
*/
var remove$1 = /*#__PURE__*/ dual(2, (self, key) => suspend(() => {
	if (self.state._tag === "Closed") return void_;
	const fiber = get$4(self.state.backing, key);
	if (fiber._tag === "None") return void_;
	return interruptAs(fiber.value, internalFiberId$1);
}));
var constInterruptedFiber$1 = /*#__PURE__*/ function() {
	let fiber = void 0;
	return () => {
		if (fiber === void 0) fiber = runFork(interrupt);
		return fiber;
	};
}();
/**
* Forks an Effect and stores the resulting fiber in the `FiberMap` under a key.
*
* **Details**
*
* When the fiber completes, it is removed from the map. If the key already has
* a fiber, the previous fiber is interrupted unless `onlyIfMissing` is set.
*
* **Example** (Forking effects into a map)
*
* ```ts import.meta.vitest
* import { Effect, Fiber, FiberMap } from "effect"
*
* const program = Effect.gen(function*() {
*   const map = yield* FiberMap.make<string>()
*
*   // Run effects and add the fibers to the map
*   const fiber1 = yield* FiberMap.run(map, "task1", Effect.succeed("Hello"))
*   const fiber2 = yield* FiberMap.run(map, "task2", Effect.succeed("World"))
*
*   // Join the fibers to get their successful values
*   const result1 = yield* Fiber.join(fiber1)
*   const result2 = yield* Fiber.join(fiber2)
*   return [result1, result2, yield* FiberMap.size(map)]
* })
*
* const actual = await Effect.runPromise(Effect.scoped(program))
* actual // => ["Hello", "World", 0]
* ```
*
* @category combinators
* @since 2.0.0
*/
var run = function() {
	const self = arguments[0];
	if (isEffect(arguments[2])) return runImpl(self, arguments[1], arguments[2], arguments[3]);
	const key = arguments[1];
	const options = arguments[2];
	return (effect) => runImpl(self, key, effect, options);
};
var runImpl = (self, key, effect, options) => withFiber$1((parent) => {
	if (self.state._tag === "Closed") return interrupt;
	else if (options?.onlyIfMissing === true && hasUnsafe(self, key)) return sync$1(constInterruptedFiber$1);
	const fiber = runForkWith(parent.context)(effect);
	setUnsafe$1(self, key, fiber, options);
	return succeed(fiber);
});
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/FiberSet.js
/**
* Manages many fibers together inside one scope.
*
* A `FiberSet<A, E>` tracks running fibers, removes each fiber when it
* completes, and interrupts all still-running fibers when the owning scope
* closes. This module includes scoped runtime constructors plus helpers for
* adding, clearing, running, counting, joining, and waiting for managed fibers.
*
* @since 2.0.0
*/
var TypeId$15 = "~effect/FiberSet";
/**
* Checks whether a value is a FiberSet.
*
* **Example** (Checking if a value is a FiberSet)
*
* ```ts import.meta.vitest
* import { Effect, FiberSet } from "effect"
*
* const program = Effect.gen(function*() {
*   const set = yield* FiberSet.make()
*
*   return [FiberSet.isFiberSet(set), FiberSet.isFiberSet({})]
* })
*
* const actual = await Effect.runPromise(Effect.scoped(program))
* actual // => [true, false]
* ```
*
* @category guards
* @since 2.0.0
*/
var isFiberSet = (u) => hasProperty(u, TypeId$15);
var Proto$8 = {
	[TypeId$15]: TypeId$15,
	[Symbol.iterator]() {
		if (this.state._tag === "Closed") return empty$4();
		return this.state.backing[Symbol.iterator]();
	},
	...PipeInspectableProto,
	toJSON() {
		return {
			_id: "FiberSet",
			state: this.state
		};
	}
};
var makeUnsafe = (backing, deferred) => {
	const self = Object.create(Proto$8);
	self.state = {
		_tag: "Open",
		backing
	};
	self.deferred = deferred;
	return self;
};
/**
* Creates a scoped `FiberSet` for storing fibers.
*
* **Details**
*
* When the associated Scope is closed, all fibers in the set will be
* interrupted. You can add fibers to the set using `FiberSet.add` or
* `FiberSet.run`, and the fibers will be automatically removed from the
* FiberSet when they complete.
*
* **Example** (Creating a scoped FiberSet)
*
* ```ts import.meta.vitest
* import { Effect, FiberSet } from "effect"
*
* const program = Effect.gen(function*() {
*   const set = yield* FiberSet.make()
*
*   // run some effects and add the fibers to the set
*   yield* FiberSet.run(set, Effect.never)
*   yield* FiberSet.run(set, Effect.never)
*
*   yield* Effect.yieldNow
*   return yield* FiberSet.size(set)
* }).pipe(
*   Effect.scoped // The fibers will be interrupted when the scope is closed
* )
*
* const actual = await Effect.runPromise(program)
* actual // => 2
* ```
*
* @category constructors
* @since 2.0.0
*/
var make$11 = () => acquireRelease(sync$1(() => makeUnsafe(/* @__PURE__ */ new Set(), makeUnsafe$2())), (set) => suspend(() => {
	const state = set.state;
	if (state._tag === "Closed") return void_;
	set.state = { _tag: "Closed" };
	const fibers = state.backing;
	return interruptAll(fibers).pipe(into(set.deferred));
}));
var internalFiberId = -1;
var isInternalInterruption = /*#__PURE__*/ toPredicate(/*#__PURE__*/ compose(filterInterruptors, /*#__PURE__*/ has(internalFiberId)));
/**
* Adds an existing fiber to the `FiberSet` using a synchronous, unsafe
* mutation.
*
* **When to use**
*
* Use when an already forked fiber must be registered immediately and
* synchronous interruption on a closed set is acceptable.
*
* **Details**
*
* When the fiber completes, it is removed from the set. If the set is already
* closed, the supplied fiber is interrupted immediately. Non-interruption
* failures are recorded for `FiberSet.join`.
*
* **Example** (Adding a fiber unsafely)
*
* ```ts import.meta.vitest
* import { Effect, FiberSet } from "effect"
*
* const program = Effect.gen(function*() {
*   const set = yield* FiberSet.make()
*   const fiber = yield* Effect.forkChild(Effect.never)
*
*   // Unsafe add - doesn't return an Effect
*   FiberSet.addUnsafe(set, fiber)
*
*   // The fiber is now managed by the set
*   return yield* FiberSet.size(set)
* })
*
* const actual = await Effect.runPromise(Effect.scoped(program))
* actual // => 1
* ```
*
* @category combinators
* @since 4.0.0
*/
var addUnsafe = /*#__PURE__*/ dual((args) => isFiberSet(args[0]), (self, fiber, options) => {
	if (self.state._tag === "Closed") {
		fiber.interruptUnsafe(internalFiberId);
		return;
	} else if (self.state.backing.has(fiber)) return;
	self.state.backing.add(fiber);
	fiber.addObserver((exit) => {
		if (self.state._tag === "Closed") return;
		self.state.backing.delete(fiber);
		if (isFailure(exit) && (options?.propagateInterruption === true ? !isInternalInterruption(exit.cause) : !hasInterruptsOnly(exit.cause))) doneUnsafe(self.deferred, exit);
	});
});
var constInterruptedFiber = /*#__PURE__*/ function() {
	let fiber = void 0;
	return () => {
		if (fiber === void 0) fiber = runFork(interrupt);
		return fiber;
	};
}();
/**
* Captures a `Runtime` and uses it to fork effects into the `FiberSet`.
*
* **Example** (Capturing a runtime)
*
* ```ts import.meta.vitest
* import { Context, Effect, Fiber, FiberSet } from "effect"
*
* class Users extends Context.Service<Users, {
*   readonly getAll: Effect.Effect<Array<unknown>>
* }>()("Users") {}
*
* const program = Effect.gen(function*() {
*   const set = yield* FiberSet.make()
*   const run = yield* FiberSet.runtime(set)<Users>()
*
*   // run some effects and add the fibers to the set
*   const fiber = run(Effect.andThen(Users, (_) => _.getAll))
*   return (yield* Fiber.join(fiber)).length
* }).pipe(
*   Effect.scoped // The fibers will be interrupted when the scope is closed
* )
*
* const actual = await Effect.runPromise(Effect.provideService(program, Users, {
*   getAll: Effect.succeed([])
* }))
* actual // => 0
* ```
*
* @category combinators
* @since 2.0.0
*/
var runtime = (self) => () => map(context(), (services) => {
	const runFork = runForkWith(services);
	return (effect, options) => {
		if (self.state._tag === "Closed") return constInterruptedFiber();
		const fiber = runFork(effect, options);
		addUnsafe(self, fiber, options);
		return fiber;
	};
});
/**
* Joins all fibers in the FiberSet. If any fiber in the set terminates with a failure,
* the returned Effect will terminate with the first failure that occurred.
*
* **Example** (Joining failing fibers)
*
* ```ts import.meta.vitest
* import { Effect, Exit, FiberSet } from "effect"
*
* const program = Effect.gen(function*() {
*   const set = yield* FiberSet.make()
*   yield* FiberSet.add(set, Effect.runFork(Effect.fail("error")))
*
*   // parent fiber will fail with "error"
*   yield* FiberSet.join(set)
* })
*
* const actual = await Effect.runPromise(Effect.exit(Effect.scoped(program)))
* actual // => Exit.fail("error")
* ```
*
* @category combinators
* @since 2.0.0
*/
var join = (self) => _await(self.deferred);
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/PrimaryKey.js
/**
* Defines the unique identifier used to identify objects that implement the `PrimaryKey` interface.
*
* **When to use**
*
* Use to implement the `PrimaryKey` protocol as a computed property key on
* classes or object literals that expose a stable string identifier.
*
* @see {@link PrimaryKey} for the protocol interface that declares the method keyed by this symbol
* @see {@link value} for reading the string key from a `PrimaryKey` value
* @see {@link isPrimaryKey} for checking whether an unknown value carries this method
*
* @category symbols
* @since 2.0.0
*/
var symbol = "~effect/interfaces/PrimaryKey";
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Pool.js
var TypeId$14 = "~effect/Pool";
var Acquire = /*#__PURE__*/ Symbol();
var AcquireContext = /*#__PURE__*/ Symbol();
/**
* Makes a new pool of the specified fixed size.
*
* **When to use**
*
* Use when you need a fixed-size pool with no growth or shrinkage.
*
* **Details**
*
* The pool is returned in a `Scope`, which governs the lifetime of the pool.
* When the pool is shutdown because the `Scope` is closed, the individual
* items allocated by the pool will be released in some unspecified order.
*
* By setting the `concurrency` parameter, you can control the level of concurrent
* access per pool item. By default, the number of permits is set to `1`.
*
* `targetUtilization` determines when to create new pool items. It is a value
* between 0 and 1, where 1 means only create new pool items when all the existing
* items are fully utilized.
*
* A `targetUtilization` of 0.5 will create new pool items when the existing items are
* 50% utilized.
*
* @see {@link makeWithTTL} for pools with min/max sizes and a TTL-based shrinking policy
* @see {@link makeWithStrategy} for pools with a custom resizing and reclamation strategy
* @category constructors
* @since 2.0.0
*/
var make$10 = (options) => makeWithStrategy({
	...options,
	min: options.size,
	max: options.size,
	strategy: strategyNoop
});
/**
* Creates a scoped pool with minimum and maximum sizes and a time-to-live
* policy for shrinking unused excess items.
*
* **When to use**
*
* Use to create an elastic scoped pool that can grow up to a maximum size and
* later reclaim unused excess items.
*
* **Details**
*
* The returned pool requires `Scope`; when that scope is closed, allocated
* items are released in an unspecified order. `concurrency` controls how many
* fibers may use each pool item at once and defaults to `1`.
*
* `targetUtilization` controls when new items are created and is clamped by the
* pool implementation. A value of `1` waits until existing items are fully
* utilized before creating more items.
*
* `timeToLiveStrategy` controls when excess items expire: `"creation"` measures
* from item creation, while `"usage"` measures from pool usage. The default is
* `"usage"`.
*
* **Example** (Creating a connection pool)
*
* ```ts import.meta.vitest
* import { Duration, Effect, Pool } from "effect"
*
* interface Connection {
*   readonly execute: (sql: string) => Effect.Effect<ReadonlyArray<string>>
*   readonly close: Effect.Effect<void>
* }
*
* const acquireDBConnection = Effect.acquireRelease(
*   Effect.succeed({
*     execute: (sql) => Effect.succeed([`executed: ${sql}`]),
*     close: Effect.void
*   } satisfies Connection),
*   (connection) => connection.close
* )
*
* const program = Effect.scoped(
*   Effect.flatMap(
*     Pool.makeWithTTL({
*       acquire: acquireDBConnection,
*       min: 10,
*       max: 20,
*       timeToLive: Duration.seconds(60)
*     }),
*     (pool) => Effect.flatMap(Pool.get(pool), (connection) => connection.execute("select 1"))
*   )
* )
*
* await Effect.runPromise(program) // => ["executed: select 1"]
* ```
*
* @category constructors
* @since 2.0.0
*/
var makeWithTTL = (options) => flatMap(options.timeToLiveStrategy === "creation" ? strategyCreationTTL(options.timeToLive) : strategyUsageTTL(options.timeToLive), (strategy) => makeWithStrategy({
	...options,
	strategy
}));
/**
* Creates a scoped pool using a custom resizing and reclamation strategy.
*
* **When to use**
*
* Use to build a pool whose item lifecycle is controlled by an explicit
* `Strategy`, such as custom background resizing, replacement, or reclamation.
*
* **Details**
*
* The returned pool requires `Scope`; closing the scope shuts down the pool and
* releases allocated items.
*
* @see {@link make} for fixed-size pools without custom resizing or reclamation
* @see {@link makeWithTTL} for min/max pools that shrink excess items with a TTL policy
* @see {@link Strategy} for the custom strategy contract consumed by this constructor
*
* @category constructors
* @since 4.0.0
*/
var makeWithStrategy = (options) => uninterruptibleMask(fnUntraced(function* (restore) {
	const services = yield* context();
	const scope = get$3(services, Scope);
	const config = {
		acquire: updateContext(options.acquire, (input) => merge$1(services, input)),
		concurrency: options.concurrency ?? 1,
		isFixed: options.min === options.max,
		minSize: options.min,
		maxSize: options.max,
		strategy: options.strategy,
		targetUtilization: Math.min(Math.max(options.targetUtilization ?? 1, .1), 1)
	};
	const state = {
		scope,
		isShuttingDown: false,
		usage: 0,
		resizeSemaphore: makeUnsafe$4(1),
		items: /* @__PURE__ */ new Set(),
		availableHead: void 0,
		availableTail: void 0,
		invalidated: /* @__PURE__ */ new Set(),
		waiters: /* @__PURE__ */ new Set()
	};
	const self = {
		[TypeId$14]: TypeId$14,
		[Acquire]: options.acquire,
		[AcquireContext]: services,
		config,
		state,
		pipe() {
			return pipeArguments(this, arguments);
		}
	};
	yield* addFinalizer(scope, shutdown(self));
	if (config.minSize > 0) yield* tap(forkDetach(restore(resize(self)), { startImmediately: true }), (fiber) => addFinalizer(scope, interrupt$3(fiber)));
	if (options.strategy !== strategyNoop) yield* tap(forkDetach(restore(options.strategy.run(self))), (fiber) => addFinalizer(scope, interrupt$3(fiber)));
	return self;
}));
var shutdown = /*#__PURE__*/ fnUntraced(function* (self) {
	if (self.state.isShuttingDown) return;
	self.state.isShuttingDown = true;
	const size = self.state.items.size;
	const semaphore = makeUnsafe$4(size);
	for (const item of self.state.items) if (item.refCount > 0) {
		item.finalizer = tap(item.finalizer, semaphore.release(1));
		self.state.invalidated.add(item);
		yield* semaphore.take(1);
	} else {
		self.state.items.delete(item);
		removeAvailable(self, item);
		self.state.invalidated.delete(item);
		yield* item.finalizer;
	}
	yield* semaphore.releaseAll;
	if (self.state.waiters.size > 0) {
		const waiters = Array.from(self.state.waiters);
		self.state.waiters.clear();
		for (const notify of waiters) notify();
	}
	yield* semaphore.take(size);
});
/**
* Retrieves an item from the pool in a scoped effect.
*
* **When to use**
*
* Use to borrow a pooled resource for the lifetime of the current scope so it
* is automatically returned when that scope closes.
*
* **Details**
*
* The returned effect waits for an available item when the pool is at capacity.
* If acquiring a new item fails, the effect fails with the acquisition error.
*
* **Gotchas**
*
* Retrying a failed `get` can repeat the acquisition attempt.
*
* @see {@link invalidate} for removing an unhealthy item from future reuse
*
* @category getters
* @since 2.0.0
*/
var get$2 = (self) => withFiber((fiber) => {
	const state = self.state;
	if (state.isShuttingDown) return interrupt$1;
	if (state.availableHead !== void 0) {
		state.usage++;
		if (self.config.isFixed || targetSize(self) <= activeSize(self)) return leaseItem(self, state.availableHead, fiber);
		state.usage--;
	}
	return getSlowWith(self, leaseItemWith);
});
var getSlowWith = (self, lease) => uninterruptibleMask$1((restore) => {
	const state = self.state;
	state.usage++;
	const wait = flatMap$1(onInterrupt(restore(waitForItem(self)), () => sync(() => {
		state.usage--;
	})), () => loop);
	const step = withFiber((fiber) => {
		if (state.isShuttingDown) {
			state.usage--;
			return interrupt$1;
		}
		if (state.availableHead !== void 0) return lease(self, state.availableHead, fiber, restore);
		return wait;
	});
	const loop = suspend$1(() => {
		if (state.isShuttingDown) {
			state.usage--;
			return interrupt$1;
		}
		return targetSize(self) > activeSize(self) ? flatMap$1(state.resizeSemaphore.withPermitsIfAvailable(1)(forkIn(interruptible(resize(self)), state.scope)), () => step) : step;
	});
	return loop;
});
var leaseItemBookkeeping = (self, item) => {
	const state = self.state;
	if (item.exit._tag === "Failure") {
		state.usage--;
		state.items.delete(item);
		state.invalidated.delete(item);
		removeAvailable(self, item);
		return false;
	}
	item.refCount++;
	if (item.refCount >= self.config.concurrency) removeAvailable(self, item);
	return true;
};
var leaseItem = (self, item, fiber) => {
	if (!leaseItemBookkeeping(self, item)) return item.exit;
	const scope = getUnsafe$1(fiber.context, Scope);
	if (scope.state._tag === "Closed") return flatMap$1(item.release(item.exit), () => item.exit);
	scopeAddFinalizerUnsafe(scope, {}, item.release);
	return item.exit;
};
var leaseItemWith = (self, item, fiber) => leaseItem(self, item, fiber);
var releaseItem = (self, item) => withFiber((fiber) => {
	const state = self.state;
	item.refCount--;
	state.usage--;
	if (state.invalidated.has(item)) return invalidatePoolItem(self, item);
	if (item.refCount === self.config.concurrency - 1) {
		addAvailable(self, item);
		wakeWaiters(self, fiber, 1);
	}
	return void_$1;
});
var waitForItem = (self) => callback((resume) => {
	const state = self.state;
	if (state.availableHead !== void 0 || state.isShuttingDown) return resume(void_$1);
	const observer = () => {
		state.waiters.delete(observer);
		resume(void_$1);
	};
	state.waiters.add(observer);
	return sync(() => {
		state.waiters.delete(observer);
	});
});
var wakeWaiters = (self, fiber, count) => {
	const waiters = self.state.waiters;
	if (waiters.size === 0) return;
	fiber.currentDispatcher.scheduleTask(() => {
		let remaining = count;
		const toWake = [];
		for (const notify of waiters) {
			if (remaining-- <= 0) break;
			toWake.push(notify);
		}
		for (let i = 0; i < toWake.length; i++) toWake[i]();
	}, 0);
};
var wakeAll = (self) => withFiber((fiber) => {
	wakeWaiters(self, fiber, Number.POSITIVE_INFINITY);
	return void_$1;
});
var addAvailable = (self, item) => {
	if (item.isAvailable) return;
	item.isAvailable = true;
	item.availablePrevious = self.state.availableTail;
	item.availableNext = void 0;
	if (self.state.availableTail !== void 0) self.state.availableTail.availableNext = item;
	else self.state.availableHead = item;
	self.state.availableTail = item;
};
var removeAvailable = (self, item) => {
	if (!item.isAvailable) return;
	item.isAvailable = false;
	if (item.availablePrevious !== void 0) item.availablePrevious.availableNext = item.availableNext;
	else self.state.availableHead = item.availableNext;
	if (item.availableNext !== void 0) item.availableNext.availablePrevious = item.availablePrevious;
	else self.state.availableTail = item.availablePrevious;
	item.availablePrevious = void 0;
	item.availableNext = void 0;
};
var invalidatePoolItem = (self, poolItem) => suspend(() => {
	if (!self.state.items.has(poolItem)) return void_;
	else if (poolItem.refCount === 0) {
		self.state.items.delete(poolItem);
		removeAvailable(self, poolItem);
		self.state.invalidated.delete(poolItem);
		return asVoid(flatMap(poolItem.finalizer, () => forkIn(interruptible(resize(self)), self.state.scope, { startImmediately: true })));
	}
	self.state.invalidated.add(poolItem);
	removeAvailable(self, poolItem);
	return void_;
});
var resize = (self) => self.state.resizeSemaphore.withPermits(1)(resizeLoop(self));
var resizeLoop = (self) => suspend(() => {
	const active = activeSize(self);
	const target = targetSize(self);
	if (active >= target) return void_;
	const toAcquire = target - active;
	const acquireOne = self.config.strategy === strategyNoop ? allocate(self) : flatMap(self.config.strategy.reclaim(self), (item) => item ? succeed(item) : allocate(self));
	if (toAcquire === 1) {
		const acquired = tap(acquireOne, wakeAll(self));
		return self.config.isFixed ? asVoid(acquired) : flatMap(acquired, (item) => item.exit._tag === "Failure" ? void_ : resizeLoop(self));
	}
	const acquired = acquireOne.pipe(replicateEffect(toAcquire, { concurrency: toAcquire }), tap(wakeAll(self)));
	return self.config.isFixed ? asVoid(acquired) : flatMap(acquired, (items) => items.some((_) => _.exit._tag === "Failure") ? void_ : resizeLoop(self));
});
var allocate = (self) => uninterruptibleMask$1((restore) => withFiber((fiber) => {
	const impl = self;
	const scope = scopeMakeUnsafe();
	const previousContext = fiber.context;
	fiber.setContext(add(impl[AcquireContext], Scope, scope));
	const use = flatMap(exit(impl[Acquire]), (exit) => {
		const item = {
			exit,
			finalizer: catchCause(close(scope, exit), reportUnhandledError),
			refCount: 0,
			disableReclaim: false,
			isAvailable: false,
			availablePrevious: void 0,
			availableNext: void 0,
			release: void 0
		};
		item.release = constant(releaseItem(self, item));
		self.state.items.add(item);
		addAvailable(self, item);
		if (self.config.strategy === strategyNoop) return exit._tag === "Success" ? succeed(item) : as(item.finalizer, item);
		return as(exit._tag === "Success" ? self.config.strategy.onAcquire(item) : flatMap(item.finalizer, () => self.config.strategy.onAcquire(item)), item);
	});
	return onExitPrimitive(restore(use), (exit) => {
		fiber.setContext(previousContext);
		return exit._tag === "Failure" ? scopeCloseUnsafe(scope, exit) : void 0;
	}, true);
}));
var targetSize = (self) => {
	if (self.state.isShuttingDown) return 0;
	if (self.config.isFixed) return self.config.minSize;
	const utilization = self.state.usage / self.config.targetUtilization;
	const target = Math.ceil(utilization / self.config.concurrency);
	return Math.min(Math.max(self.config.minSize, target), self.config.maxSize);
};
var activeSize = (self) => {
	return self.state.items.size - self.state.invalidated.size;
};
var strategyNoop = {
	run: (_) => void_,
	onAcquire: (_) => void_,
	reclaim: (_) => undefined_
};
var strategyCreationTTL = /*#__PURE__*/ fnUntraced(function* (ttl) {
	const clock = yield* Clock;
	const queue = yield* unbounded();
	const ttlMillis = toMillis(fromInputUnsafe(ttl));
	const creationTimes = /* @__PURE__ */ new WeakMap();
	return identity({
		run: (pool) => {
			const process = (item) => suspend(() => {
				if (!pool.state.items.has(item) || pool.state.invalidated.has(item)) return void_;
				const now = clock.currentTimeMillisUnsafe();
				const created = creationTimes.get(item);
				const remaining = ttlMillis - (now - created);
				return remaining > 0 ? delay(process(item), remaining) : invalidatePoolItem(pool, item);
			});
			return take(queue).pipe(tap(process), forever({ disableYield: true }));
		},
		onAcquire: (item) => suspend(() => {
			creationTimes.set(item, clock.currentTimeMillisUnsafe());
			return offer(queue, item);
		}),
		reclaim: (_) => undefined_
	});
});
var strategyUsageTTL = /*#__PURE__*/ fnUntraced(function* (ttl) {
	const queue = yield* unbounded();
	return identity({
		run: (pool) => {
			const process = suspend(() => {
				if (activeSize(pool) - targetSize(pool) <= 0) return void_;
				return take(queue).pipe(tap((item) => invalidatePoolItem(pool, item)), flatMap(() => process));
			});
			return process.pipe(delay(ttl), forever({ disableYield: true }));
		},
		onAcquire: (item) => offer(queue, item),
		reclaim(pool) {
			return suspend(() => {
				if (pool.state.invalidated.size === 0) return undefined_;
				const item = head(filter(pool.state.invalidated, (item) => !item.disableReclaim));
				if (item._tag === "None") return undefined_;
				pool.state.invalidated.delete(item.value);
				if (item.value.refCount < pool.config.concurrency) addAvailable(pool, item.value);
				return as(offer(queue, item.value), item.value);
			});
		}
	});
});
var reportUnhandledError = (cause) => withFiber$1((fiber) => {
	const unhandledLogLevel = fiber.getRef(UnhandledLogLevel);
	if (unhandledLogLevel) return logWithLevel(unhandledLogLevel)("Unhandled error in pool finalizer", cause);
	return void_;
});
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/persistence/KeyValueStore.js
/**
* Provides effectful key/value storage for persistence backends.
*
* `KeyValueStore` is a service for storing string or binary values by key. It
* is useful for lightweight durable state, browser storage, local files, SQL
* tables, tests, and as a storage building block for higher-level persistence
* APIs. This module includes store operations, prefixed views, schema-aware JSON
* storage, error values, and layers for memory, filesystem, Web Storage, and
* SQL-backed stores.
*
* @since 4.0.0
*/
var TypeId$13 = "~effect/persistence/KeyValueStore";
var ErrorTypeId = "~effect/persistence/KeyValueStore/KeyValueStoreError";
/**
* Error raised by key/value store operations, including the failed method,
* optional key, message, and cause.
*
* @category errors
* @since 4.0.0
*/
var KeyValueStoreError = class extends (/*#__PURE__*/ TaggedError("KeyValueStoreError")) {
	/**
	* Marks this value as a key-value store error for runtime guards.
	*
	* @since 4.0.0
	*/
	[ErrorTypeId] = ErrorTypeId;
};
/**
* Service tag for string and binary key/value storage.
*
* **When to use**
*
* Use to access or provide the persistence store used for lightweight durable
* state.
*
* @category services
* @since 4.0.0
*/
var KeyValueStore = /*#__PURE__*/ Service("effect/persistence/KeyValueStore");
/**
* Constructs a `KeyValueStore` from primitive store operations.
*
* **Details**
*
* Default implementations are derived for `has`, `isEmpty`, `modify`, and
* `modifyUint8Array` unless they are provided in the options.
*
* @category constructors
* @since 4.0.0
*/
var make$9 = (options) => KeyValueStore.of({
	[TypeId$13]: TypeId$13,
	has: (key) => map(options.get(key), isNotUndefined),
	isEmpty: map(options.size, (size) => size === 0),
	modify: (key, f) => flatMap(options.get(key), (o) => {
		if (o === void 0) return undefined_;
		const newValue = f(o);
		return as(options.set(key, newValue), newValue);
	}),
	modifyUint8Array: (key, f) => flatMap(options.getUint8Array(key), (o) => {
		if (o === void 0) return undefined_;
		const newValue = f(o);
		return as(options.set(key, newValue), newValue);
	}),
	...options
});
/**
* Adapts a string-only backing store into a `KeyValueStore`.
*
* **Details**
*
* `Uint8Array` values are stored as base64 strings. `getUint8Array` decodes
* base64 values and falls back to UTF-8 encoding for non-base64 strings.
*
* @category constructors
* @since 4.0.0
*/
var makeStringOnly = (options) => {
	const encoder = new TextEncoder();
	return make$9({
		...options,
		getUint8Array: (key) => options.get(key).pipe(map(map$3((value) => match(decodeBase64(value), {
			onFailure: () => encoder.encode(value),
			onSuccess: identity
		})))),
		set: (key, value) => typeof value === "string" ? options.set(key, value) : suspend(() => options.set(key, encodeBase64(value)))
	});
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/SubscriptionRef.js
/**
* Stores mutable state and publishes changes as a stream.
*
* A `SubscriptionRef<A>` stores the latest value, publishes the initial value,
* and publishes every committed update so subscribers can observe state over
* time. Updates are serialized so only one change is applied at a time. This
* module includes constructors, current-value reads, the `changes` stream,
* writes, updates, partial updates, and effectful update helpers.
*
* @since 2.0.0
*/
var SubscriptionRef_exports = /* @__PURE__ */ __exportAll({
	changes: () => changes,
	get: () => get$1,
	getAndSet: () => getAndSet,
	getAndUpdate: () => getAndUpdate,
	getAndUpdateEffect: () => getAndUpdateEffect,
	getAndUpdateSome: () => getAndUpdateSome,
	getAndUpdateSomeEffect: () => getAndUpdateSomeEffect,
	getUnsafe: () => getUnsafe,
	isSubscriptionRef: () => isSubscriptionRef,
	make: () => make$8,
	modify: () => modify$1,
	modifyEffect: () => modifyEffect,
	modifySome: () => modifySome,
	modifySomeEffect: () => modifySomeEffect,
	set: () => set$1,
	setAndGet: () => setAndGet,
	update: () => update,
	updateAndGet: () => updateAndGet,
	updateAndGetEffect: () => updateAndGetEffect,
	updateEffect: () => updateEffect,
	updateSome: () => updateSome,
	updateSomeAndGet: () => updateSomeAndGet,
	updateSomeAndGetEffect: () => updateSomeAndGetEffect,
	updateSomeEffect: () => updateSomeEffect
});
var TypeId$12 = "~effect/SubscriptionRef";
/**
* Returns `true` if the provided value is a `SubscriptionRef`.
*
* **When to use**
*
* Use to narrow an unknown value before calling `SubscriptionRef` operations
* that require a subscription reference.
*
* @category guards
* @since 4.0.0
*/
var isSubscriptionRef = (u) => hasProperty(u, TypeId$12);
var Proto$7 = {
	...PipeInspectableProto,
	[TypeId$12]: { _A: identity },
	toJSON() {
		return {
			_id: "SubscriptionRef",
			value: this.value
		};
	}
};
/**
* Constructs a new `SubscriptionRef` from an initial value.
*
* **When to use**
*
* Use to create a `SubscriptionRef` when consumers need to read the latest
* value and subscribe to every update.
*
* **Details**
*
* The initial value is published during construction, so `changes` starts new
* subscribers with that value before future updates.
*
* @see {@link changes} for streaming the current value and subsequent updates
* @see {@link set} for replacing the value and notifying subscribers
*
* @category constructors
* @since 2.0.0
*/
var make$8 = (value) => map(unbounded$1({ replay: 1 }), (pubsub) => {
	const self = Object.create(Proto$7);
	self.semaphore = makeUnsafe$4(1);
	self.value = value;
	self.pubsub = pubsub;
	publishUnsafe(self.pubsub, value);
	return self;
});
/**
* Creates a stream that emits the current value and all subsequent changes to
* the `SubscriptionRef`.
*
* **Details**
*
* The stream will first emit the current value, then emit all future changes
* as they occur.
*
* **Example** (Streaming changes)
*
* ```ts import.meta.vitest
* import { Deferred, Effect, Fiber, Stream, SubscriptionRef } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* SubscriptionRef.make(0)
*   const ready = yield* Deferred.make<void>()
*
*   const fiber = yield* SubscriptionRef.changes(ref).pipe(
*     Stream.tap(() => Deferred.succeed(ready, void 0)),
*     Stream.take(3),
*     Stream.runCollect,
*     Effect.forkChild
*   )
*
*   yield* Deferred.await(ready)
*   yield* SubscriptionRef.set(ref, 1)
*   yield* SubscriptionRef.set(ref, 2)
*
*   const values = yield* Fiber.join(fiber)
*   return Array.from(values)
* })
*
* await Effect.runPromise(program) // => [0, 1, 2]
* ```
*
* @category subscriptions
* @since 4.0.0
*/
var changes = (self) => fromPubSub(self.pubsub);
/**
* Retrieves the current value of the `SubscriptionRef` unsafely.
*
* **When to use**
*
* Use when you are in synchronous internals or test setup where concurrent
* updates are controlled.
*
* **Gotchas**
*
* This function directly accesses the underlying reference without any
* synchronization. It should only be used when you are certain there are no
* concurrent modifications.
*
* **Example** (Reading the current value unsafely)
*
* ```ts import.meta.vitest
* import { Effect, SubscriptionRef } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* SubscriptionRef.make(42)
*
*   return SubscriptionRef.getUnsafe(ref)
* })
*
* await Effect.runPromise(program) // => 42
* ```
*
* @category getters
* @since 4.0.0
*/
var getUnsafe = (self) => self.value;
/**
* Retrieves the current value of the `SubscriptionRef`.
*
* **Example** (Reading the current value)
*
* ```ts import.meta.vitest
* import { Effect, SubscriptionRef } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* SubscriptionRef.make(42)
*
*   return yield* SubscriptionRef.get(ref)
* })
*
* await Effect.runPromise(program) // => 42
* ```
*
* @category getters
* @since 2.0.0
*/
var get$1 = (self) => sync$1(() => self.value);
/**
* Retrieves the current value and sets a new value atomically, notifying
* subscribers of the change.
*
* **Example** (Getting and setting a value)
*
* ```ts import.meta.vitest
* import { Effect, SubscriptionRef } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* SubscriptionRef.make(10)
*
*   const oldValue = yield* SubscriptionRef.getAndSet(ref, 20)
*   const newValue = yield* SubscriptionRef.get(ref)
*   return [oldValue, newValue]
* })
*
* await Effect.runPromise(program) // => [10, 20]
* ```
*
* @category getters
* @since 2.0.0
*/
var getAndSet = /*#__PURE__*/ dual(2, (self, value) => self.semaphore.withPermit(sync$1(() => {
	const current = self.value;
	setUnsafe(self, value);
	return current;
})));
var setUnsafe = (self, value) => {
	self.value = value;
	publishUnsafe(self.pubsub, value);
};
/**
* Retrieves the current value and updates it atomically with the result of
* applying a function, notifying subscribers of the change.
*
* **Example** (Getting and updating a value)
*
* ```ts import.meta.vitest
* import { Effect, SubscriptionRef } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* SubscriptionRef.make(10)
*
*   const oldValue = yield* SubscriptionRef.getAndUpdate(ref, (n) => n * 2)
*   const newValue = yield* SubscriptionRef.get(ref)
*   return [oldValue, newValue]
* })
*
* await Effect.runPromise(program) // => [10, 20]
* ```
*
* @category getters
* @since 2.0.0
*/
var getAndUpdate = /*#__PURE__*/ dual(2, (self, update) => self.semaphore.withPermit(sync$1(() => {
	const current = self.value;
	setUnsafe(self, update(current));
	return current;
})));
/**
* Retrieves the current value and updates it atomically with the result of
* applying an effectful function, notifying subscribers of the change.
*
* **Example** (Getting and updating with an effect)
*
* ```ts import.meta.vitest
* import { Effect, SubscriptionRef } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* SubscriptionRef.make(10)
*
*   const oldValue = yield* SubscriptionRef.getAndUpdateEffect(
*     ref,
*     (n) => Effect.succeed(n + 5)
*   )
*   const newValue = yield* SubscriptionRef.get(ref)
*   return [oldValue, newValue]
* })
*
* await Effect.runPromise(program) // => [10, 15]
* ```
*
* @category getters
* @since 2.0.0
*/
var getAndUpdateEffect = /*#__PURE__*/ dual(2, (self, update) => self.semaphore.withPermit(suspend(() => {
	const current = self.value;
	return map(update(current), (newValue) => {
		setUnsafe(self, newValue);
		return current;
	});
})));
/**
* Retrieves the current value and optionally updates the reference.
*
* **When to use**
*
* Use to read the old `SubscriptionRef` value while applying a synchronous
* update only when a new value is available.
*
* **Details**
*
* If the function returns `Option.some`, the new value is set and published. If
* it returns `Option.none`, the reference is left unchanged and no update is
* published.
*
* **Example** (Getting and conditionally updating a value)
*
* ```ts import.meta.vitest
* import { Effect, Option, SubscriptionRef } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* SubscriptionRef.make(10)
*
*   const oldValue = yield* SubscriptionRef.getAndUpdateSome(
*     ref,
*     (n) => n > 5 ? Option.some(n * 2) : Option.none()
*   )
*   const newValue = yield* SubscriptionRef.get(ref)
*   return [oldValue, newValue]
* })
*
* await Effect.runPromise(program) // => [10, 20]
* ```
*
* @category getters
* @since 2.0.0
*/
var getAndUpdateSome = /*#__PURE__*/ dual(2, (self, update) => self.semaphore.withPermit(sync$1(() => {
	const current = self.value;
	const option = update(current);
	if (isNone(option)) return current;
	setUnsafe(self, option.value);
	return current;
})));
/**
* Retrieves the current value and optionally updates the reference effectfully.
*
* **When to use**
*
* Use to read the old `SubscriptionRef` value while applying an effectful
* update only when a new value is available.
*
* **Details**
*
* If the effect succeeds with `Option.some`, the new value is set and
* published. If it succeeds with `Option.none`, the reference is left unchanged
* and no update is published.
*
* **Example** (Getting and conditionally updating with an effect)
*
* ```ts import.meta.vitest
* import { Effect, Option, SubscriptionRef } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* SubscriptionRef.make(10)
*
*   const oldValue = yield* SubscriptionRef.getAndUpdateSomeEffect(
*     ref,
*     (n) => Effect.succeed(n > 5 ? Option.some(n + 3) : Option.none())
*   )
*   const newValue = yield* SubscriptionRef.get(ref)
*   return [oldValue, newValue]
* })
*
* await Effect.runPromise(program) // => [10, 13]
* ```
*
* @category getters
* @since 2.0.0
*/
var getAndUpdateSomeEffect = /*#__PURE__*/ dual(2, (self, update) => self.semaphore.withPermit(suspend(() => {
	const current = self.value;
	return map(update(current), (option) => {
		if (isNone(option)) return current;
		setUnsafe(self, option.value);
		return current;
	});
})));
/**
* Modifies the `SubscriptionRef` atomically with a function that computes a
* return value and a new value, notifying subscribers of the change.
*
* **Example** (Modifying a value)
*
* ```ts import.meta.vitest
* import { Effect, SubscriptionRef } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* SubscriptionRef.make(10)
*
*   const result = yield* SubscriptionRef.modify(ref, (n) => [
*     `Old value was ${n}`,
*     n * 2
*   ])
*   const newValue = yield* SubscriptionRef.get(ref)
*   return [result, newValue]
* })
*
* await Effect.runPromise(program) // => ["Old value was 10", 20]
* ```
*
* @category mutations
* @since 2.0.0
*/
var modify$1 = /*#__PURE__*/ dual(2, (self, modify) => self.semaphore.withPermit(sync$1(() => {
	const [b, newValue] = modify(self.value);
	setUnsafe(self, newValue);
	return b;
})));
/**
* Modifies the `SubscriptionRef` atomically with an effectful function that
* computes a return value and a new value, notifying subscribers of the
* change.
*
* **Example** (Modifying with an effect)
*
* ```ts import.meta.vitest
* import { Effect, SubscriptionRef } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* SubscriptionRef.make(10)
*
*   const result = yield* SubscriptionRef.modifyEffect(
*     ref,
*     (n) => Effect.succeed([`Doubled from ${n}`, n * 2] as const)
*   )
*   const newValue = yield* SubscriptionRef.get(ref)
*   return [result, newValue]
* })
*
* await Effect.runPromise(program) // => ["Doubled from 10", 20]
* ```
*
* @category mutations
* @since 2.0.0
*/
var modifyEffect = /*#__PURE__*/ dual(2, (self, modify) => self.semaphore.withPermit(suspend(() => map(modify(self.value), ([b, newValue]) => {
	setUnsafe(self, newValue);
	return b;
}))));
/**
* Computes a return value and optionally updates the reference.
*
* **When to use**
*
* Use to return a separate result while synchronously deciding whether to
* publish a new `SubscriptionRef` value.
*
* **Details**
*
* If the function returns `Option.some` for the new value, the value is set and
* published. If it returns `Option.none`, the reference is left unchanged and
* no update is published.
*
* **Example** (Conditionally modifying a value)
*
* ```ts import.meta.vitest
* import { Effect, Option, SubscriptionRef } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* SubscriptionRef.make(10)
*
*   const result = yield* SubscriptionRef.modifySome(
*     ref,
*     (n) =>
*       n > 5 ? ["Updated", Option.some(n * 2)] : ["Not updated", Option.none()]
*   )
*   const newValue = yield* SubscriptionRef.get(ref)
*   return [result, newValue]
* })
*
* await Effect.runPromise(program) // => ["Updated", 20]
* ```
*
* @category mutations
* @since 2.0.0
*/
var modifySome = /*#__PURE__*/ dual(2, (self, modify) => self.semaphore.withPermit(sync$1(() => {
	const [b, option] = modify(self.value);
	if (isNone(option)) return b;
	setUnsafe(self, option.value);
	return b;
})));
/**
* Computes a return value and optionally updates the reference effectfully.
*
* **When to use**
*
* Use to return a separate result while effectfully deciding whether to publish
* a new `SubscriptionRef` value.
*
* **Details**
*
* If the effect succeeds with `Option.some`, the new value is set and
* published. If it succeeds with `Option.none`, the reference is left unchanged
* and no update is published.
*
* **Example** (Conditionally modifying with an effect)
*
* ```ts import.meta.vitest
* import { Effect, Option, SubscriptionRef } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* SubscriptionRef.make(10)
*
*   const result = yield* SubscriptionRef.modifySomeEffect(
*     ref,
*     (n) =>
*       Effect.succeed(
*         n > 5
*           ? (["Updated", Option.some(n + 5)] as const)
*           : (["Not updated", Option.none()] as const)
*       )
*   )
*   const newValue = yield* SubscriptionRef.get(ref)
*   return [result, newValue]
* })
*
* await Effect.runPromise(program) // => ["Updated", 15]
* ```
*
* @category mutations
* @since 2.0.0
*/
var modifySomeEffect = /*#__PURE__*/ dual(2, (self, modify) => self.semaphore.withPermit(suspend(() => map(modify(self.value), ([b, option]) => {
	if (isNone(option)) return b;
	setUnsafe(self, option.value);
	return b;
}))));
/**
* Sets the value of the `SubscriptionRef`, notifying all subscribers of the
* change.
*
* **Example** (Setting a value)
*
* ```ts import.meta.vitest
* import { Effect, SubscriptionRef } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* SubscriptionRef.make(0)
*
*   yield* SubscriptionRef.set(ref, 42)
*
*   return yield* SubscriptionRef.get(ref)
* })
*
* await Effect.runPromise(program) // => 42
* ```
*
* @category mutations
* @since 2.0.0
*/
var set$1 = /*#__PURE__*/ dual(2, (self, value) => self.semaphore.withPermit(sync$1(() => setUnsafe(self, value))));
/**
* Sets the value of the `SubscriptionRef` and returns the new value,
* notifying all subscribers of the change.
*
* **Example** (Setting and reading the new value)
*
* ```ts import.meta.vitest
* import { Effect, SubscriptionRef } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* SubscriptionRef.make(0)
*
*   return yield* SubscriptionRef.setAndGet(ref, 42)
* })
*
* await Effect.runPromise(program) // => 42
* ```
*
* @category mutations
* @since 2.0.0
*/
var setAndGet = /*#__PURE__*/ dual(2, (self, value) => self.semaphore.withPermit(sync$1(() => {
	setUnsafe(self, value);
	return value;
})));
/**
* Updates the value of the `SubscriptionRef` with the result of applying a
* function, notifying subscribers of the change.
*
* **Example** (Updating a value)
*
* ```ts import.meta.vitest
* import { Effect, SubscriptionRef } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* SubscriptionRef.make(10)
*
*   yield* SubscriptionRef.update(ref, (n) => n * 2)
*
*   return yield* SubscriptionRef.get(ref)
* })
*
* await Effect.runPromise(program) // => 20
* ```
*
* @category mutations
* @since 2.0.0
*/
var update = /*#__PURE__*/ dual(2, (self, update) => self.semaphore.withPermit(sync$1(() => setUnsafe(self, update(self.value)))));
/**
* Updates the value of the `SubscriptionRef` with the result of applying an
* effectful function, notifying subscribers of the change.
*
* **Example** (Updating with an effect)
*
* ```ts import.meta.vitest
* import { Effect, SubscriptionRef } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* SubscriptionRef.make(10)
*
*   yield* SubscriptionRef.updateEffect(ref, (n) => Effect.succeed(n + 5))
*
*   return yield* SubscriptionRef.get(ref)
* })
*
* await Effect.runPromise(program) // => 15
* ```
*
* @category mutations
* @since 2.0.0
*/
var updateEffect = /*#__PURE__*/ dual(2, (self, update) => self.semaphore.withPermit(suspend(() => map(update(self.value), (newValue) => setUnsafe(self, newValue)))));
/**
* Updates the value of the `SubscriptionRef` with the result of applying a
* function and returns the new value, notifying subscribers of the change.
*
* **Example** (Updating and reading the new value)
*
* ```ts import.meta.vitest
* import { Effect, SubscriptionRef } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* SubscriptionRef.make(10)
*
*   return yield* SubscriptionRef.updateAndGet(ref, (n) => n * 2)
* })
*
* await Effect.runPromise(program) // => 20
* ```
*
* @category mutations
* @since 2.0.0
*/
var updateAndGet = /*#__PURE__*/ dual(2, (self, update) => self.semaphore.withPermit(sync$1(() => {
	const newValue = update(self.value);
	setUnsafe(self, newValue);
	return newValue;
})));
/**
* Updates the value of the `SubscriptionRef` with the result of applying an
* effectful function and returns the new value, notifying subscribers of the
* change.
*
* **Example** (Updating with an effect and reading the new value)
*
* ```ts import.meta.vitest
* import { Effect, SubscriptionRef } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* SubscriptionRef.make(10)
*
*   return yield* SubscriptionRef.updateAndGetEffect(
*     ref,
*     (n) => Effect.succeed(n + 5)
*   )
* })
*
* await Effect.runPromise(program) // => 15
* ```
*
* @category mutations
* @since 2.0.0
*/
var updateAndGetEffect = /*#__PURE__*/ dual(2, (self, update) => self.semaphore.withPermit(suspend(() => map(update(self.value), (newValue) => {
	setUnsafe(self, newValue);
	return newValue;
}))));
/**
* Applies an update function to the current value. If it returns
* `Option.some`, sets and publishes that value; if it returns `Option.none`,
* leaves the reference unchanged and does not publish.
*
* **Example** (Conditionally updating a value)
*
* ```ts import.meta.vitest
* import { Effect, Option, SubscriptionRef } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* SubscriptionRef.make(10)
*
*   yield* SubscriptionRef.updateSome(
*     ref,
*     (n) => n > 5 ? Option.some(n * 2) : Option.none()
*   )
*
*   return yield* SubscriptionRef.get(ref)
* })
*
* await Effect.runPromise(program) // => 20
* ```
*
* @category mutations
* @since 2.0.0
*/
var updateSome = /*#__PURE__*/ dual(2, (self, update) => self.semaphore.withPermit(sync$1(() => {
	const option = update(self.value);
	if (isNone(option)) return;
	setUnsafe(self, option.value);
})));
/**
* Applies an effectful update only when it produces a new value.
*
* **When to use**
*
* Use to conditionally update a `SubscriptionRef` with an effectful function
* while discarding the resulting value.
*
* **Details**
*
* If the effect succeeds with `Option.some`, the new value is set and
* published. If it succeeds with `Option.none`, the reference is left unchanged
* and no update is published.
*
* **Example** (Conditionally updating with an effect)
*
* ```ts import.meta.vitest
* import { Effect, Option, SubscriptionRef } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* SubscriptionRef.make(10)
*
*   yield* SubscriptionRef.updateSomeEffect(
*     ref,
*     (n) => Effect.succeed(n > 5 ? Option.some(n + 3) : Option.none())
*   )
*
*   return yield* SubscriptionRef.get(ref)
* })
*
* await Effect.runPromise(program) // => 13
* ```
*
* @category mutations
* @since 2.0.0
*/
var updateSomeEffect = /*#__PURE__*/ dual(2, (self, update) => self.semaphore.withPermit(suspend(() => map(update(self.value), (option) => {
	if (isNone(option)) return;
	setUnsafe(self, option.value);
}))));
/**
* Applies an optional update and returns the current value afterward.
*
* **When to use**
*
* Use to conditionally update a `SubscriptionRef` and read the value that is
* current after the update decision.
*
* **Details**
*
* If the function returns `Option.some`, the new value is set, published, and
* returned. If it returns `Option.none`, the unchanged current value is
* returned without publishing.
*
* **Example** (Conditionally updating and reading the new value)
*
* ```ts import.meta.vitest
* import { Effect, Option, SubscriptionRef } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* SubscriptionRef.make(10)
*
*   return yield* SubscriptionRef.updateSomeAndGet(
*     ref,
*     (n) => n > 5 ? Option.some(n * 2) : Option.none()
*   )
* })
*
* await Effect.runPromise(program) // => 20
* ```
*
* @category mutations
* @since 2.0.0
*/
var updateSomeAndGet = /*#__PURE__*/ dual(2, (self, update) => self.semaphore.withPermit(sync$1(() => {
	const current = self.value;
	const option = update(current);
	if (isNone(option)) return current;
	setUnsafe(self, option.value);
	return option.value;
})));
/**
* Applies an effectful optional update and returns the current value afterward.
*
* **When to use**
*
* Use to conditionally update a `SubscriptionRef` effectfully and read the
* value that is current after the update decision.
*
* **Details**
*
* If the effect succeeds with `Option.some`, the new value is set, published,
* and returned. If it succeeds with `Option.none`, the unchanged current value
* is returned without publishing.
*
* **Example** (Conditionally updating with an effect and reading the new value)
*
* ```ts import.meta.vitest
* import { Effect, Option, SubscriptionRef } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* SubscriptionRef.make(10)
*
*   return yield* SubscriptionRef.updateSomeAndGetEffect(
*     ref,
*     (n) => Effect.succeed(n > 5 ? Option.some(n + 3) : Option.none())
*   )
* })
*
* await Effect.runPromise(program) // => 13
* ```
*
* @category mutations
* @since 2.0.0
*/
var updateSomeAndGetEffect = /*#__PURE__*/ dual(2, (self, update) => self.semaphore.withPermit(suspend(() => {
	const current = self.value;
	return map(update(current), (option) => {
		if (isNone(option)) return current;
		setUnsafe(self, option.value);
		return option.value;
	});
})));
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/http/Headers.js
/**
* Models HTTP headers for the unstable HTTP client and server modules.
*
* `Headers` values are immutable maps keyed by lowercase header name. This
* module converts common header inputs into that shape, provides helpers for
* reading and updating header values, and redacts configured sensitive headers
* when values are inspected.
*
* @since 4.0.0
*/
/**
* Runtime type identifier for `Headers` values.
*
* @category type IDs
* @since 4.0.0
*/
var TypeId$11 = /*#__PURE__*/ Symbol.for("~effect/http/Headers");
var Proto$6 = /*#__PURE__*/ Object.defineProperties(/*#__PURE__*/ Object.create(null), {
	[TypeId$11]: { value: TypeId$11 },
	[symbolRedactable]: { value(context) {
		return redact(this, get$3(context, CurrentRedactedNames));
	} },
	toJSON: { value() {
		return redact$1(this);
	} },
	[symbol$1]: { value(that) {
		return Equivalence$1(this, that);
	} },
	[symbol$2]: { value() {
		return structure(this);
	} },
	toString: { value: BaseProto.toString },
	[NodeInspectSymbol]: { value: BaseProto[NodeInspectSymbol] }
});
var make$7 = (input) => Object.assign(Object.create(Proto$6), input);
/**
* Provides an `Equivalence` instance that compares `Headers` by header names
* and string values.
*
* @category instances
* @since 4.0.0
*/
var Equivalence$1 = /*#__PURE__*/ makeEquivalence(/*#__PURE__*/ strictEqual());
/**
* An empty `Headers` collection.
*
* @category constructors
* @since 4.0.0
*/
var empty$3 = /*#__PURE__*/ Object.create(Proto$6);
/**
* Creates `Headers` from a record or iterable of header entries.
*
* **Details**
*
* Header names are normalized to lowercase. Array values in record input are joined with `", "`, and `undefined` values are omitted.
*
* @category constructors
* @since 4.0.0
*/
var fromInput$1 = (input) => {
	if (input === void 0) return empty$3;
	else if (Symbol.iterator in input) {
		const out = Object.create(Proto$6);
		for (const [k, v] of input) out[k.toLowerCase()] = v;
		return out;
	}
	const out = Object.create(Proto$6);
	for (const [k, v] of Object.entries(input)) if (Array.isArray(v)) out[k.toLowerCase()] = v.join(", ");
	else if (v !== void 0) out[k.toLowerCase()] = v;
	return out;
};
/**
* Treats an existing record as `Headers` unsafely.
*
* **Gotchas**
*
* This mutates the record's prototype and does not normalize header names; callers must provide the expected lowercase keys.
*
* @category constructors
* @since 4.0.0
*/
var fromRecordUnsafe = (input) => Object.setPrototypeOf(input, Proto$6);
/**
* Returns a new `Headers` collection with the given header set.
*
* **Details**
*
* The header name is normalized to lowercase.
*
* @category combinators
* @since 4.0.0
*/
var set = /*#__PURE__*/ dual(3, (self, key, value) => {
	const out = make$7(self);
	out[key.toLowerCase()] = value;
	return out;
});
/**
* Returns a new `Headers` collection with all provided headers set.
*
* **Details**
*
* Input headers are normalized with `fromInput` and override existing headers with the same lowercase name.
*
* @category combinators
* @since 4.0.0
*/
var setAll$1 = /*#__PURE__*/ dual(2, (self, headers) => make$7({
	...self,
	...fromInput$1(headers)
}));
/**
* Returns a new `Headers` collection containing headers from both collections.
*
* **Details**
*
* Headers from the second collection override headers from the first collection with the same name.
*
* @category combinators
* @since 4.0.0
*/
var merge = /*#__PURE__*/ dual(2, (self, headers) => {
	const out = make$7(self);
	Object.assign(out, headers);
	return out;
});
/**
* Returns a new `Headers` collection with the named header removed.
*
* **Details**
*
* The provided header name is normalized to lowercase before removal.
*
* @category combinators
* @since 4.0.0
*/
var remove = /*#__PURE__*/ dual(2, (self, key) => {
	const out = make$7(self);
	delete out[key.toLowerCase()];
	return out;
});
/**
* Returns a plain record with selected header values wrapped in `Redacted`.
*
* **Details**
*
* String keys are normalized to lowercase before matching; regular expressions are tested against the stored header names.
*
* @category combinators
* @since 4.0.0
*/
var redact = /*#__PURE__*/ dual(2, (self, key) => {
	const out = { ...self };
	const modify = (key) => {
		if (typeof key === "string") {
			const k = key.toLowerCase();
			if (k in self) out[k] = make$15(self[k]);
		} else for (const name in self) if (key.test(name)) out[name] = make$15(self[name]);
	};
	if (Array.isArray(key)) for (let i = 0; i < key.length; i++) modify(key[i]);
	else modify(key);
	return out;
});
/**
* Checks whether a header name matches one of the redaction patterns.
*
* **Details**
*
* String patterns are compared case-insensitively against the header name;
* regular expressions are tested against it. Use to avoid the record copy of
* `redact` when only a membership check is needed.
*
* @category combinators
* @since 4.0.0
*/
var isRedactedName = (name, patterns) => {
	for (let i = 0; i < patterns.length; i++) {
		const pattern = patterns[i];
		if (typeof pattern === "string") {
			if (pattern.toLowerCase() === name) return true;
		} else if (pattern.test(name)) return true;
	}
	return false;
};
/**
* Context reference listing header names or patterns that should be redacted when `Headers` are inspected or rendered.
*
* **Details**
*
* Defaults include `authorization`, `cookie`, `set-cookie`, and `x-api-key`.
*
* @category services
* @since 4.0.0
*/
var CurrentRedactedNames = /*#__PURE__*/ Reference("effect/Headers/CurrentRedactedNames", { defaultValue: () => [
	"authorization",
	"cookie",
	"set-cookie",
	"x-api-key"
] });
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/http/UrlParams.js
/**
* Models URL query parameters as ordered string pairs.
*
* `UrlParams` is used for HTTP client query strings, URL-encoded form bodies,
* and server-side decoding. Values can be built from records, iterables, or
* native `URLSearchParams`, then updated, serialized, converted to a `URL`, or
* decoded with schemas.
*
* @since 4.0.0
*/
var TypeId$10 = "~effect/http/UrlParams";
/**
* Returns `true` when a value is a `UrlParams` instance.
*
* @category guards
* @since 4.0.0
*/
var isUrlParams = (u) => hasProperty(u, TypeId$10);
var Proto$5 = {
	...PipeInspectableProto,
	[TypeId$10]: TypeId$10,
	[Symbol.iterator]() {
		return this.params[Symbol.iterator]();
	},
	toJSON() {
		return {
			_id: "UrlParams",
			params: Object.fromEntries(this.params)
		};
	},
	[symbol$1](that) {
		return Equivalence(this, that);
	},
	[symbol$2]() {
		return array(this.params.flat());
	}
};
/**
* Creates `UrlParams` from ordered string key-value pairs.
*
* **Details**
*
* The input pairs are used as-is and are not coerced or normalized.
*
* @category constructors
* @since 4.0.0
*/
var make$6 = (params) => {
	const self = Object.create(Proto$5);
	self.params = params;
	return self;
};
/**
* Creates `UrlParams` from a supported input shape.
*
* **Details**
*
* Primitive values are converted to strings, arrays produce repeated parameters,
* nested records use bracket notation, and `undefined` values are omitted.
*
* @category constructors
* @since 4.0.0
*/
var fromInput = (input) => {
	if (isUrlParams(input)) return input;
	const parsed = fromInputNested(input);
	const out = [];
	for (let i = 0; i < parsed.length; i++) if (Array.isArray(parsed[i][0])) {
		const [keys, value] = parsed[i];
		out.push([`${keys[0]}[${keys.slice(1).join("][")}]`, value]);
	} else out.push(parsed[i]);
	return make$6(out);
};
var fromInputNested = (input) => {
	const entries = typeof input[Symbol.iterator] === "function" ? fromIterable$1(input) : Object.entries(input);
	const out = [];
	for (const [key, value] of entries) if (Array.isArray(value)) {
		for (let i = 0; i < value.length; i++) if (value[i] !== void 0) out.push([key, String(value[i])]);
	} else if (typeof value === "object") {
		const nested = fromInputNested(value);
		for (const [k, v] of nested) out.push([[key, ...typeof k === "string" ? [k] : k], v]);
	} else if (value !== void 0) out.push([key, String(value)]);
	return out;
};
/**
* Provides an order-sensitive `Equivalence` instance for `UrlParams`.
*
* **Details**
*
* Two values are equivalent when they contain the same key-value pairs in the same
* order.
*
* @category instances
* @since 4.0.0
*/
var Equivalence = /*#__PURE__*/ make$13((a, b) => arrayEquivalence(a.params, b.params));
var arrayEquivalence = /*#__PURE__*/ makeEquivalence$1(/*#__PURE__*/ makeEquivalence$2([/*#__PURE__*/ strictEqual(), /*#__PURE__*/ strictEqual()]));
/**
* An empty `UrlParams` value.
*
* @category constructors
* @since 4.0.0
*/
var empty$2 = /*#__PURE__*/ make$6([]);
/**
* Sets multiple query parameters from input.
*
* **Details**
*
* Keys present in the input replace existing values for those keys, while
* unmentioned existing parameters are preserved.
*
* @category combinators
* @since 4.0.0
*/
var setAll = /*#__PURE__*/ dual(2, (self, input) => {
	const out = fromInput(input);
	const params = out.params;
	const keys = /* @__PURE__ */ new Set();
	for (let i = 0; i < params.length; i++) keys.add(params[i][0]);
	for (let i = 0; i < self.params.length; i++) {
		if (keys.has(self.params[i][0])) continue;
		params.push(self.params[i]);
	}
	return out;
});
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/http/HttpBody.js
var TypeId$9 = "~effect/http/HttpBody";
var Proto$4 = class {
	[TypeId$9];
	constructor() {
		this[TypeId$9] = TypeId$9;
	}
	[NodeInspectSymbol]() {
		return this.toJSON();
	}
	toString() {
		return format(this, { ignoreToString: true });
	}
};
/**
* HTTP body variant representing the absence of request content.
*
* @category models
* @since 4.0.0
*/
var Empty = class extends Proto$4 {
	_tag = "Empty";
	toJSON() {
		return {
			_id: "effect/HttpBody",
			_tag: "Empty"
		};
	}
};
/**
* Provides the singleton empty HTTP body.
*
* **When to use**
*
* Use when you need an HTTP body value that represents no body content.
*
* @category constants
* @since 4.0.0
*/
var empty$1 = /*#__PURE__*/ new Empty();
/**
* HTTP body variant backed by a `Uint8Array`.
*
* **Details**
*
* It stores the bytes, content type, and byte length.
*
* @category models
* @since 4.0.0
*/
var Uint8Array$1 = class extends Proto$4 {
	_tag = "Uint8Array";
	body;
	contentType;
	contentLength;
	constructor(body, contentType, contentLength) {
		super();
		this.body = body;
		this.contentType = contentType;
		this.contentLength = contentLength;
	}
	toJSON() {
		return {
			_id: "effect/HttpBody",
			_tag: "Uint8Array",
			body: this.contentType.startsWith("text/") || this.contentType.endsWith("json") ? new TextDecoder().decode(this.body) : `Uint8Array(${this.body.length})`,
			contentType: this.contentType,
			contentLength: this.contentLength
		};
	}
};
/**
* Creates a byte-array HTTP body.
*
* **Details**
*
* The content type defaults to `application/octet-stream`, and the content length is the byte array length.
*
* @category constructors
* @since 4.0.0
*/
var uint8Array = (body, contentType) => new Uint8Array$1(body, contentType ?? "application/octet-stream", body.length);
var encoder = /*#__PURE__*/ new TextEncoder();
/**
* Creates a UTF-8 encoded text HTTP body.
*
* **Details**
*
* The content type defaults to `text/plain`.
*
* @category constructors
* @since 4.0.0
*/
var text = (body, contentType) => uint8Array(encoder.encode(body), contentType ?? "text/plain");
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/http/HttpMethod.js
/**
* Provides tuples mapping each supported HTTP method to its short
* request-constructor name.
*
* **When to use**
*
* Use when you need the mapping from supported HTTP method literals to their
* short request-constructor names.
*
* @category constants
* @since 4.0.0
*/
var allShort = [
	["GET", "get"],
	["POST", "post"],
	["PUT", "put"],
	["DELETE", "del"],
	["PATCH", "patch"],
	["HEAD", "head"],
	["OPTIONS", "options"],
	["TRACE", "trace"]
];
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/http/internal/httpBody.js
/** @internal */
var updateHeaders = (headers, body) => {
	if (body._tag === "Empty" || body._tag === "FormData") return remove(remove(headers, "content-type"), "content-length");
	headers = body.contentType === void 0 ? remove(headers, "content-type") : set(headers, "content-type", body.contentType);
	return body.contentLength === void 0 ? remove(headers, "content-length") : set(headers, "content-length", body.contentLength.toString());
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/http/Url.js
/**
* Error returned when constructing a `URL` fails.
*
* @category errors
* @since 4.0.0
*/
var UrlError = class extends (/*#__PURE__*/ TaggedError("UrlError")) {};
/**
* Creates a `URL` safely by appending `UrlParams` and an optional hash to a URL string.
*
* **Details**
*
* Returns a `Result` that fails with `UrlError` if the URL cannot be constructed.
*
* @category constructors
* @since 4.0.0
*/
var make$5 = (url, params, hash) => try_({
	try: () => {
		const urlInstance = new URL(url, baseUrl());
		for (let i = 0; i < params.params.length; i++) {
			const [key, value] = params.params[i];
			if (value !== void 0) urlInstance.searchParams.append(key, value);
		}
		if (hash !== void 0) urlInstance.hash = hash;
		return urlInstance;
	},
	catch: (cause) => new UrlError({ cause })
});
var baseUrl = () => {
	if ("location" in globalThis && globalThis.location !== void 0 && globalThis.location.origin !== void 0 && globalThis.location.pathname !== void 0) return location.origin + location.pathname;
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/http/HttpClientRequest.js
var TypeId$8 = "~effect/http/HttpClientRequest";
/**
* Returns `true` when a value is an `HttpClientRequest`.
*
* @category guards
* @since 4.0.0
*/
var isHttpClientRequest = (u) => hasProperty(u, TypeId$8);
var Proto$3 = {
	[TypeId$8]: TypeId$8,
	...BaseProto,
	toJSON() {
		return {
			_id: "HttpClientRequest",
			method: this.method,
			url: this.url,
			urlParams: this.urlParams,
			hash: this.hash,
			headers: redact$1(this.headers),
			body: this.body.toJSON()
		};
	},
	pipe() {
		return pipeArguments(this, arguments);
	}
};
/**
* Constructs an `HttpClientRequest` from fully normalized request components.
*
* @category constructors
* @since 4.0.0
*/
function makeWith$1(method, url, urlParams, hash, headers, body) {
	const self = Object.create(Proto$3);
	self.method = method;
	self.url = url;
	self.urlParams = urlParams;
	self.hash = hash;
	self.headers = headers;
	self.body = body;
	return self;
}
/**
* An empty `GET` request with no URL, query parameters, hash, headers, or body.
*
* @category constructors
* @since 4.0.0
*/
var empty = /*#__PURE__*/ makeWith$1("GET", "", empty$2, /*#__PURE__*/ none(), empty$3, empty$1);
/**
* Creates a request constructor for the specified HTTP method.
*
* @category constructors
* @since 4.0.0
*/
var make$4 = (method) => (url, options) => modify(empty, {
	method,
	url,
	...options ?? void 0
});
/**
* Creates a `GET` request for the specified URL.
*
* @category constructors
* @since 4.0.0
*/
var get = /*#__PURE__*/ make$4("GET");
/**
* Creates a `POST` request for the specified URL.
*
* @category constructors
* @since 4.0.0
*/
var post = /*#__PURE__*/ make$4("POST");
/**
* Applies request options to an `HttpClientRequest`, returning a new request.
*
* @category combinators
* @since 4.0.0
*/
var modify = /*#__PURE__*/ dual(2, (self, options) => {
	let result = self;
	if (options.method) result = setMethod(result, options.method);
	if (options.url) result = setUrl(result, options.url);
	if (options.headers) result = setHeaders(result, options.headers);
	if (options.urlParams) result = setUrlParams(result, options.urlParams);
	if (options.hash) result = setHash(result, options.hash);
	if (options.body) result = setBody(result, options.body);
	if (options.accept) result = accept(result, options.accept);
	if (options.acceptJson) result = acceptJson(result);
	return result;
});
/**
* Sets the HTTP method on a request, returning a new request.
*
* @category combinators
* @since 4.0.0
*/
var setMethod = /*#__PURE__*/ dual(2, (self, method) => makeWith$1(method, self.url, self.urlParams, self.hash, self.headers, self.body));
/**
* Sets a single request header, replacing any existing value for that header.
*
* @category combinators
* @since 4.0.0
*/
var setHeader = /*#__PURE__*/ dual(3, (self, key, value) => makeWith$1(self.method, self.url, self.urlParams, self.hash, set(self.headers, key, value), self.body));
/**
* Sets multiple request headers from an input collection, replacing existing values with matching names.
*
* @category combinators
* @since 4.0.0
*/
var setHeaders = /*#__PURE__*/ dual(2, (self, input) => makeWith$1(self.method, self.url, self.urlParams, self.hash, setAll$1(self.headers, input), self.body));
/**
* Sets the `Accept` header to the specified media type.
*
* @category combinators
* @since 4.0.0
*/
var accept = /*#__PURE__*/ dual(2, (self, mediaType) => setHeader(self, "Accept", mediaType));
/**
* Sets the `Accept` header to `application/json`.
*
* @category combinators
* @since 4.0.0
*/
var acceptJson = /*#__PURE__*/ accept("application/json");
/**
* Sets the request URL. When given a `URL`, its search parameters and hash are extracted into the request's structured fields.
*
* @category combinators
* @since 4.0.0
*/
var setUrl = /*#__PURE__*/ dual(2, (self, url) => {
	if (typeof url === "string") return makeWith$1(self.method, url, self.urlParams, self.hash, self.headers, self.body);
	const clone = new URL(url.toString());
	const urlParams = fromInput(clone.searchParams);
	const hash = fromNullishOr(clone.hash === "" ? void 0 : clone.hash.slice(1));
	clone.search = "";
	clone.hash = "";
	return makeWith$1(self.method, clone.toString(), urlParams, hash, self.headers, self.body);
});
/**
* Prepends a URL segment to the request URL, inserting or trimming one slash as needed.
*
* @category combinators
* @since 4.0.0
*/
var prependUrl = /*#__PURE__*/ dual(2, (self, path) => {
	if (path === "") return self;
	return makeWith$1(self.method, joinSegments(path, self.url), self.urlParams, self.hash, self.headers, self.body);
});
var joinSegments = (first, second) => {
	const endsWithSlash = first.endsWith("/");
	const startsWithSlash = second.startsWith("/");
	return endsWithSlash && startsWithSlash ? first + second.slice(1) : !endsWithSlash && !startsWithSlash ? first + "/" + second : first + second;
};
/**
* Sets query parameters from an input collection, replacing existing values for matching names.
*
* @category combinators
* @since 4.0.0
*/
var setUrlParams = /*#__PURE__*/ dual(2, (self, input) => makeWith$1(self.method, self.url, setAll(self.urlParams, input), self.hash, self.headers, self.body));
/**
* Sets the URL fragment on a request without the leading `#`.
*
* @category combinators
* @since 4.0.0
*/
var setHash = /*#__PURE__*/ dual(2, (self, hash) => makeWith$1(self.method, self.url, self.urlParams, some(hash), self.headers, self.body));
/**
* Sets the request body and updates `Content-Type` and `Content-Length` headers from the body metadata when available.
*
* @category combinators
* @since 4.0.0
*/
var setBody = /*#__PURE__*/ dual(2, (self, body) => {
	return makeWith$1(self.method, self.url, self.urlParams, self.hash, updateHeaders(self.headers, body), body);
});
/**
* Sets a text request body with an optional content type.
*
* @category combinators
* @since 4.0.0
*/
var bodyText = /*#__PURE__*/ dual((args) => isHttpClientRequest(args[0]), (self, body, contentType) => setBody(self, text(body, contentType)));
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/http/Cookies.js
/**
* Models HTTP cookies and cookie collections for requests and responses.
*
* A `Cookie` stores a name, value, encoded value, and standard cookie
* attributes. A `Cookies` value is an immutable collection keyed by cookie
* name. This module parses request `Cookie` headers, builds response
* `Set-Cookie` headers, and provides helpers for adding, removing, merging, and
* expiring cookies.
*
* @since 4.0.0
*/
var TypeId$7 = "~effect/http/Cookies";
var CookieTypeId = "~effect/http/Cookies/Cookie";
var Proto$2 = {
	[TypeId$7]: TypeId$7,
	...BaseProto,
	toJSON() {
		return {
			_id: "effect/Cookies",
			cookies: map$1(this.cookies, (cookie) => cookie.toJSON())
		};
	},
	pipe() {
		return pipeArguments(this, arguments);
	}
};
/**
* Creates a `Cookies` collection from an existing readonly record of cookies keyed by cookie name.
*
* @category constructors
* @since 4.0.0
*/
var fromReadonlyRecord = (cookies) => {
	const self = Object.create(Proto$2);
	self.cookies = cookies;
	return self;
};
/**
* Create a Cookies object from an Iterable
*
* @category constructors
* @since 4.0.0
*/
var fromIterable = (cookies) => {
	const record = {};
	for (const cookie of cookies) assignProperty(record, cookie.name, cookie);
	return fromReadonlyRecord(record);
};
/**
* Create a Cookies object from a set of Set-Cookie headers
*
* @category constructors
* @since 4.0.0
*/
var fromSetCookie = (headers) => {
	const arrayHeaders = typeof headers === "string" ? [headers] : headers;
	const cookies = [];
	for (const header of arrayHeaders) {
		const cookie = parseSetCookie(header.trim());
		if (cookie) cookies.push(cookie);
	}
	return fromIterable(cookies);
};
function parseSetCookie(header) {
	const parts = header.split(";").map((_) => _.trim()).filter((_) => _ !== "");
	if (parts.length === 0) return;
	const firstEqual = parts[0].indexOf("=");
	if (firstEqual === -1) return;
	const name = parts[0].slice(0, firstEqual);
	if (!fieldContentRegExp.test(name)) return;
	const valueEncoded = parts[0].slice(firstEqual + 1);
	const value = tryDecodeURIComponent(valueEncoded);
	if (parts.length === 1) return Object.assign(Object.create(CookieProto), {
		name,
		value,
		valueEncoded
	});
	const options = {};
	for (let i = 1; i < parts.length; i++) {
		const part = parts[i];
		const equalIndex = part.indexOf("=");
		const key = equalIndex === -1 ? part : part.slice(0, equalIndex).trim();
		const value = equalIndex === -1 ? void 0 : part.slice(equalIndex + 1).trim();
		switch (key.toLowerCase()) {
			case "domain": {
				if (value === void 0) break;
				const domain = value.trim().replace(/^\./, "");
				if (domain) options.domain = domain;
				break;
			}
			case "expires": {
				if (value === void 0) break;
				const date = new Date(value);
				if (!isNaN(date.getTime())) options.expires = date;
				break;
			}
			case "max-age": {
				if (value === void 0) break;
				const maxAge = parseInt(value, 10);
				if (!isNaN(maxAge)) options.maxAge = seconds(maxAge);
				break;
			}
			case "path":
				if (value === void 0) break;
				if (value[0] === "/") options.path = value;
				break;
			case "priority":
				if (value === void 0) break;
				switch (value.toLowerCase()) {
					case "low":
						options.priority = "low";
						break;
					case "medium":
						options.priority = "medium";
						break;
					case "high": options.priority = "high";
				}
				break;
			case "httponly":
				options.httpOnly = true;
				break;
			case "secure":
				options.secure = true;
				break;
			case "partitioned":
				options.partitioned = true;
				break;
			case "samesite":
				if (value === void 0) break;
				switch (value.toLowerCase()) {
					case "lax":
						options.sameSite = "lax";
						break;
					case "strict":
						options.sameSite = "strict";
						break;
					case "none": options.sameSite = "none";
				}
		}
	}
	return Object.assign(Object.create(CookieProto), {
		name,
		value,
		valueEncoded,
		options: Object.keys(options).length > 0 ? options : void 0
	});
}
var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
var CookieProto = {
	[CookieTypeId]: CookieTypeId,
	...BaseProto,
	toJSON() {
		return {
			_id: "effect/Cookies/Cookie",
			name: this.name,
			value: this.value,
			options: this.options
		};
	}
};
var tryDecodeURIComponent = (str) => {
	try {
		return decodeURIComponent(str);
	} catch (_) {
		return str;
	}
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/http/HttpClientError.js
/**
* Typed failure model for Effect HTTP client operations.
*
* HTTP clients wrap request construction, transport, status-code validation, and
* response decoding failures in `HttpClientError`. The wrapper keeps the failed
* request and the specific failure reason together, so callers can handle client
* failures uniformly while still matching on the reason `_tag` for retry
* policy, logging, metrics, and user-facing messages.
*
* @since 4.0.0
*/
var TypeId$6 = "~effect/http/HttpClientError";
/**
* Error wrapper for HTTP client failures, exposing the failed request and the optional response through its `reason`.
*
* @category errors
* @since 4.0.0
*/
var HttpClientError = class extends (/*#__PURE__*/ TaggedError("HttpClientError")) {
	constructor(props) {
		if ("cause" in props.reason) super({
			...props,
			cause: props.reason.cause
		});
		else super(props);
	}
	/**
	* Marks this value as an HTTP client error for runtime guards.
	*
	* @since 4.0.0
	*/
	[TypeId$6] = TypeId$6;
	/**
	* HTTP request associated with the client failure.
	*
	* @since 4.0.0
	*/
	get request() {
		return this.reason.request;
	}
	/**
	* HTTP response associated with the client failure, when one was received.
	*
	* @since 4.0.0
	*/
	get response() {
		return "response" in this.reason ? this.reason.response : void 0;
	}
	get message() {
		return this.reason.message;
	}
};
var formatReason = (tag) => tag.endsWith("Error") ? tag.slice(0, -5) : tag;
var formatMessage = (reason, description, info) => description ? `${reason}: ${description} (${info})` : `${reason} error (${info})`;
/**
* Error describing transport-level failures that occur while sending an HTTP request.
*
* @category errors
* @since 4.0.0
*/
var TransportError = class extends (/*#__PURE__*/ TaggedError("TransportError")) {
	/**
	* Formats the request method and URL for transport error messages.
	*
	* @since 4.0.0
	*/
	get methodAndUrl() {
		return `${this.request.method} ${this.request.url}`;
	}
	/**
	* Builds the transport error message from the optional description and request details.
	*
	* @since 4.0.0
	*/
	get message() {
		return formatMessage(formatReason(this._tag), this.description, this.methodAndUrl);
	}
};
/**
* Error describing failures while constructing a URL from an HTTP client request.
*
* @category errors
* @since 4.0.0
*/
var InvalidUrlError = class extends (/*#__PURE__*/ TaggedError("InvalidUrlError")) {
	/**
	* Formats the request method and URL for invalid URL error messages.
	*
	* @since 4.0.0
	*/
	get methodAndUrl() {
		return `${this.request.method} ${this.request.url}`;
	}
	/**
	* Builds the invalid URL error message from the optional description and request details.
	*
	* @since 4.0.0
	*/
	get message() {
		return formatMessage(formatReason(this._tag), this.description, this.methodAndUrl);
	}
};
/**
* Response error for HTTP responses rejected because of their status code.
*
* @category errors
* @since 4.0.0
*/
var StatusCodeError = class extends (/*#__PURE__*/ TaggedError("StatusCodeError")) {
	/**
	* Formats the request method and URL for status code error messages.
	*
	* @since 4.0.0
	*/
	get methodAndUrl() {
		return `${this.request.method} ${this.request.url}`;
	}
	/**
	* Builds the status code error message from the response status, optional description, and request details.
	*
	* @since 4.0.0
	*/
	get message() {
		const info = `${this.response.status} ${this.methodAndUrl}`;
		return formatMessage(formatReason(this._tag), this.description, info);
	}
};
/**
* Response error for failures while decoding an HTTP response body.
*
* @category errors
* @since 4.0.0
*/
var DecodeError = class extends (/*#__PURE__*/ TaggedError("DecodeError")) {
	/**
	* Formats the request method and URL for response decoding error messages.
	*
	* @since 4.0.0
	*/
	get methodAndUrl() {
		return `${this.request.method} ${this.request.url}`;
	}
	/**
	* Builds the response decoding error message from the response status, optional description, and request details.
	*
	* @since 4.0.0
	*/
	get message() {
		const info = `${this.response.status} ${this.methodAndUrl}`;
		return formatMessage(formatReason(this._tag), this.description, info);
	}
};
/**
* Response error for operations that expected a response body but received an empty body.
*
* @category errors
* @since 4.0.0
*/
var EmptyBodyError = class extends (/*#__PURE__*/ TaggedError("EmptyBodyError")) {
	/**
	* Formats the request method and URL for empty response body error messages.
	*
	* @since 4.0.0
	*/
	get methodAndUrl() {
		return `${this.request.method} ${this.request.url}`;
	}
	/**
	* Builds the empty body error message from the response status, optional description, and request details.
	*
	* @since 4.0.0
	*/
	get message() {
		const info = `${this.response.status} ${this.methodAndUrl}`;
		return formatMessage(formatReason(this._tag), this.description, info);
	}
};
/**
* Schema for serializable HTTP client errors, preserving the specific error kind
* and cause.
*
* @category schemas
* @since 4.0.0
*/
var HttpClientErrorSchema = class HttpClientErrorSchema extends (/*#__PURE__*/ Error$2(TypeId$6)({
	_tag: /*#__PURE__*/ tag("HttpError"),
	kind: /*#__PURE__*/ Literals([
		"EncodeError",
		"DecodeError",
		"TransportError",
		"InvalidUrlError",
		"StatusCodeError",
		"EmptyBodyError"
	]),
	cause: /*#__PURE__*/ optional(/*#__PURE__*/ Defect())
})) {
	/**
	* Builds the serializable schema representation for an HTTP client error.
	*
	* @since 4.0.0
	*/
	static fromHttpClientError(error) {
		return new HttpClientErrorSchema({
			_tag: "HttpError",
			kind: error.reason._tag,
			cause: error.reason
		});
	}
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/http/HttpIncomingMessage.js
/**
* Type identifier for `HttpIncomingMessage` values.
*
* @category type IDs
* @since 4.0.0
*/
var TypeId$5 = "~effect/http/HttpIncomingMessage";
/**
* Builds an inspectable object for an incoming message, redacting headers and including a synchronously readable JSON or text body when available.
*
* @category converting
* @since 4.0.0
*/
var inspect = (self, that) => {
	const contentType = self.headers["content-type"] ?? "";
	let body;
	if (contentType.includes("application/json")) try {
		body = runSync(self.json);
	} catch (_) {}
	else if (contentType.includes("text/") || contentType.includes("urlencoded")) try {
		body = runSync(self.text);
	} catch (_) {}
	const obj = {
		...that,
		headers: redact$1(self.headers),
		remoteAddress: self.remoteAddress
	};
	if (body !== void 0) obj.body = body;
	return obj;
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/http/HttpClientResponse.js
/**
* Represents responses returned by the Effect HTTP client.
*
* An `HttpClientResponse` keeps the original request together with the response
* status, headers, cookies, and body accessors from the shared incoming-message
* model. This module includes constructors, schema-based decoders, helpers for
* streaming response bodies, and utilities for matching or filtering by HTTP
* status.
*
* @since 4.0.0
*/
/**
* Type identifier for `HttpClientResponse` values.
*
* @category type IDs
* @since 4.0.0
*/
var TypeId$4 = "~effect/http/HttpClientResponse";
/**
* Wraps a Web `Response` and its original `HttpClientRequest` as an `HttpClientResponse`.
*
* @category constructors
* @since 4.0.0
*/
var fromWeb = (request, source) => new WebHttpClientResponse(request, source);
/**
* Converts an effect producing an `HttpClientResponse` into a stream of response body bytes.
*
* @category accessors
* @since 4.0.0
*/
var stream = (effect) => unwrap(map(effect, (self) => self.stream));
/**
* Succeeds with the response only when its status is in the 2xx range, otherwise fails with `HttpClientError`.
*
* @category filtering
* @since 4.0.0
*/
var filterStatusOk$1 = (self) => self.status >= 200 && self.status < 300 ? succeed(self) : fail(new HttpClientError({ reason: new StatusCodeError({
	response: self,
	request: self.request,
	description: "non 2xx status code"
}) }));
var WebHttpClientResponse = class extends Class {
	[TypeId$5];
	[TypeId$4];
	request;
	source;
	constructor(request, source) {
		super();
		this.request = request;
		this.source = source;
		this[TypeId$5] = TypeId$5;
		this[TypeId$4] = TypeId$4;
	}
	toJSON() {
		return inspect(this, {
			_id: "HttpClientResponse",
			request: this.request.toJSON(),
			status: this.status
		});
	}
	get status() {
		return this.source.status;
	}
	get headers() {
		return fromInput$1(this.source.headers);
	}
	cachedCookies;
	get cookies() {
		if (this.cachedCookies) return this.cachedCookies;
		return this.cachedCookies = fromSetCookie(this.source.headers.getSetCookie());
	}
	get remoteAddress() {
		return none();
	}
	get stream() {
		return this.source.body ? fromReadableStream({
			evaluate: () => this.source.body,
			onError: (cause) => new HttpClientError({ reason: new DecodeError({
				request: this.request,
				response: this,
				cause
			}) })
		}) : fail$3(new HttpClientError({ reason: new EmptyBodyError({
			request: this.request,
			response: this,
			description: "can not create stream from empty body"
		}) }));
	}
	get json() {
		return flatMap(this.text, (text) => try_$1({
			try: () => text === "" ? null : JSON.parse(text),
			catch: (cause) => new HttpClientError({ reason: new DecodeError({
				request: this.request,
				response: this,
				cause
			}) })
		}));
	}
	textBody;
	get text() {
		return this.textBody ??= map(this.arrayBuffer, (_) => new TextDecoder().decode(_));
	}
	get urlParamsBody() {
		return flatMap(this.text, (_) => try_$1({
			try: () => fromInput(new URLSearchParams(_)),
			catch: (cause) => new HttpClientError({ reason: new DecodeError({
				request: this.request,
				response: this,
				cause
			}) })
		}));
	}
	formDataBody;
	get formData() {
		return this.formDataBody ??= tryPromise({
			try: () => this.source.formData(),
			catch: (cause) => new HttpClientError({ reason: new DecodeError({
				request: this.request,
				response: this,
				cause
			}) })
		}).pipe(cached, runSync);
	}
	arrayBufferBody;
	get arrayBuffer() {
		if (this.arrayBufferBody) return this.arrayBufferBody;
		this.arrayBufferBody = tryPromise({
			try: () => this.source.arrayBuffer(),
			catch: (cause) => new HttpClientError({ reason: new DecodeError({
				request: this.request,
				response: this,
				cause
			}) })
		}).pipe(cached, runSync);
		return this.arrayBufferBody;
	}
	pipe() {
		return pipeArguments(this, arguments);
	}
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/http/HttpTraceContext.js
/**
* HTTP propagation helpers for Effect tracing context.
*
* This module converts Effect `Tracer.Span` values into outbound trace headers
* and decodes inbound propagation headers into `Tracer.ExternalSpan` parents.
* HTTP clients use it to continue the current span across outgoing requests, and
* server middleware uses it to parent request spans from upstream services.
*
* @since 4.0.0
*/
/**
* Encodes a span into HTTP trace propagation headers.
*
* **Details**
*
* The generated headers include both compact B3 (`b3`) and W3C `traceparent`
* formats.
*
* @category encoding
* @since 4.0.0
*/
var toHeaders = (span) => fromRecordUnsafe({
	b3: `${span.traceId}-${span.spanId}-${span.sampled ? "1" : "0"}${match$1(span.parent, {
		onNone: () => "",
		onSome: (parent) => `-${parent.spanId}`
	})}`,
	traceparent: `00-${span.traceId}-${span.spanId}-${span.sampled ? "01" : "00"}`
});
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/http/HttpClient.js
var TypeId$3 = "~effect/http/HttpClient";
/**
* Service tag for the default outgoing HTTP client service.
*
* **When to use**
*
* Use to provide the default outgoing HTTP client service used by request
* accessors such as `execute`, `get`, and `post`.
*
* @category services
* @since 4.0.0
*/
var HttpClient = /*#__PURE__*/ Service("effect/HttpClient");
/**
* Transforms a client by applying an effectful transformation to each response effect.
*
* @category mapping
* @since 4.0.0
*/
var transformResponse = /*#__PURE__*/ dual(2, (self, f) => makeWith((request) => f(self.postprocess(request)), self.preprocess));
/**
* Filters responses that return a 2xx status code.
*
* @category filtering
* @since 4.0.0
*/
var filterStatusOk = /*#__PURE__*/ transformResponse(/*#__PURE__*/ flatMap(filterStatusOk$1));
/**
* Constructs an `HttpClient.With` from a preprocessing function and a postprocessing function.
*
* **Details**
*
* `execute` applies preprocessing to the request and then passes the resulting request effect to postprocessing.
*
* @category constructors
* @since 4.0.0
*/
var makeWith = (postprocess, preprocess) => {
	const self = Object.create(Proto$1);
	self.preprocess = preprocess;
	self.postprocess = postprocess;
	self.execute = function(request) {
		return postprocess(preprocess(request));
	};
	return self;
};
var Proto$1 = {
	[TypeId$3]: TypeId$3,
	pipe() {
		return pipeArguments(this, arguments);
	},
	...BaseProto,
	toJSON() {
		return { _id: "effect/HttpClient" };
	},
	.../*#__PURE__*/ Object.fromEntries(/*#__PURE__*/ allShort.map(([fullMethod, method]) => [method, function(url, options) {
		return this.execute(make$4(fullMethod)(url, options));
	}]))
};
/**
* Constructs an `HttpClient` from a low-level request runner.
*
* **Details**
*
* The runner receives the request, resolved URL, abort signal, and current fiber. The client wrapper handles URL construction failures, tracing and propagation, header redaction, and aborting non-scoped requests on interruption.
*
* @category constructors
* @since 4.0.0
*/
var make$3 = (f) => makeWith((effect) => flatMap(effect, (request) => withFiber$1((fiber) => {
	const scopedController = scopedRequests.get(request);
	const controller = scopedController ?? new AbortController();
	const urlResult = make$5(request.url, request.urlParams, getOrUndefined(request.hash));
	if (isFailure$1(urlResult)) return fail(new HttpClientError({ reason: new InvalidUrlError({
		request,
		cause: urlResult.failure
	}) }));
	const url = urlResult.success;
	if (fiber.getRef(DisablePropagation) || fiber.getRef(TracerDisabledWhen)(request)) {
		const effect = f(request, url, controller.signal, fiber);
		if (scopedController) return effect;
		return uninterruptibleMask((restore) => matchCauseEffect(restore(effect), {
			onSuccess(response) {
				responseRegistry.register(response, controller);
				return succeed(new InterruptibleResponse(response, controller));
			},
			onFailure(cause) {
				if (hasInterrupts(cause)) controller.abort();
				return failCause(cause);
			}
		}));
	}
	return useSpan(fiber.getRef(SpanNameGenerator)(request), { kind: "client" }, (span) => {
		span.attribute("http.request.method", request.method);
		span.attribute("server.address", url.origin);
		if (url.port !== "") span.attribute("server.port", +url.port);
		span.attribute("url.full", url.toString());
		span.attribute("url.path", url.pathname);
		span.attribute("url.scheme", url.protocol.slice(0, -1));
		const query = url.search.slice(1);
		if (query !== "") span.attribute("url.query", query);
		const redactedHeaderNames = fiber.getRef(CurrentRedactedNames);
		const headerFilter = fiber.getRef(TracerHeaderFilter);
		for (const name in request.headers) {
			if (!headerFilter(name, "request")) continue;
			span.attribute(`http.request.header.${name}`, isRedactedName(name, redactedHeaderNames) ? "<redacted>" : request.headers[name]);
		}
		request = fiber.getRef(TracerPropagationEnabled) ? setHeaders(request, toHeaders(span)) : request;
		return uninterruptibleMask((restore) => restore(f(request, url, controller.signal, fiber)).pipe(withParentSpan(span, { captureStackTrace: false }), matchCauseEffect({
			onSuccess: (response) => {
				span.attribute("http.response.status_code", response.status);
				for (const name in response.headers) {
					if (!headerFilter(name, "response")) continue;
					span.attribute(`http.response.header.${name}`, isRedactedName(name, redactedHeaderNames) ? "<redacted>" : response.headers[name]);
				}
				if (scopedController) return succeed(response);
				responseRegistry.register(response, controller);
				return succeed(new InterruptibleResponse(response, controller));
			},
			onFailure(cause) {
				if (!scopedController && hasInterrupts(cause)) controller.abort();
				return failCause(cause);
			}
		})));
	});
})), succeed);
/**
* Appends a transformation of the request object before sending it.
*
* @category mapping
* @since 4.0.0
*/
var mapRequest = /*#__PURE__*/ dual(2, (self, f) => makeWith(self.postprocess, (request) => map(self.preprocess(request), f)));
/**
* Context reference for a predicate that disables client-side tracing for matching outgoing requests.
*
* @category services
* @since 4.0.0
*/
var TracerDisabledWhen = /*#__PURE__*/ Reference("effect/http/HttpClient/TracerDisabledWhen", { defaultValue: () => constFalse });
/**
* Context reference for filtering request and response headers added to client spans.
*
* @category services
* @since 4.0.0
*/
var TracerHeaderFilter = /*#__PURE__*/ Reference("effect/http/HttpClient/TracerHeaderFilter", { defaultValue: () => constTrue });
/**
* Context reference that controls whether outgoing client spans are propagated to request headers.
*
* @category services
* @since 4.0.0
*/
var TracerPropagationEnabled = /*#__PURE__*/ Reference("effect/HttpClient/TracerPropagationEnabled", { defaultValue: constTrue });
/**
* Context reference for generating the span name used for outgoing client request spans.
*
* @category services
* @since 4.0.0
*/
var SpanNameGenerator = /*#__PURE__*/ Reference("effect/http/HttpClient/SpanNameGenerator", { defaultValue: () => (request) => `http.client ${request.method}` });
/**
* Creates an `HttpClient` layer and merges the layer construction context into client response effects.
*
* @category layers
* @since 4.0.0
*/
var layerMergedContext = (effect$1) => effect(HttpClient)(contextWith((context) => map(effect$1, (client) => transformResponse(client, updateContext((input) => merge$1(context, input))))));
var responseRegistry = /*#__PURE__*/ (() => {
	if ("FinalizationRegistry" in globalThis && globalThis.FinalizationRegistry) {
		const registry = /*#__PURE__*/ new FinalizationRegistry((controller) => {
			controller.abort();
		});
		return {
			register(response, controller) {
				registry.register(response, controller, response);
			},
			unregister(response) {
				registry.unregister(response);
			}
		};
	}
	const timers = /*#__PURE__*/ new Map();
	return {
		register(response, controller) {
			timers.set(response, setTimeout(() => controller.abort(), 5e3));
		},
		unregister(response) {
			const timer = timers.get(response);
			if (timer === void 0) return;
			clearTimeout(timer);
			timers.delete(response);
		}
	};
})();
var scopedRequests = /*#__PURE__*/ new WeakMap();
var InterruptibleResponse = class {
	original;
	controller;
	constructor(original, controller) {
		this.original = original;
		this.controller = controller;
	}
	[TypeId$4] = TypeId$4;
	[TypeId$5] = TypeId$5;
	applyInterrupt(effect) {
		return suspend(() => {
			responseRegistry.unregister(this.original);
			return onInterrupt$1(effect, () => sync$1(() => {
				this.controller.abort();
			}));
		});
	}
	get request() {
		return this.original.request;
	}
	get status() {
		return this.original.status;
	}
	get headers() {
		return this.original.headers;
	}
	get cookies() {
		return this.original.cookies;
	}
	get remoteAddress() {
		return this.original.remoteAddress;
	}
	get formData() {
		return this.applyInterrupt(this.original.formData);
	}
	get text() {
		return this.applyInterrupt(this.original.text);
	}
	get json() {
		return this.applyInterrupt(this.original.json);
	}
	get urlParamsBody() {
		return this.applyInterrupt(this.original.urlParamsBody);
	}
	get arrayBuffer() {
		return this.applyInterrupt(this.original.arrayBuffer);
	}
	get stream() {
		return suspend$2(() => {
			responseRegistry.unregister(this.original);
			return ensuring$1(this.original.stream, sync$1(() => {
				this.controller.abort();
			}));
		});
	}
	toJSON() {
		return this.original.toJSON();
	}
	[NodeInspectSymbol]() {
		return this.original[NodeInspectSymbol]();
	}
	pipe() {
		return pipeArguments(this, arguments);
	}
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/socket/Socket.js
/**
* Service tag for bidirectional socket transports.
*
* **When to use**
*
* Use to access or provide the socket implementation used by programs that
* read and write frames through the Effect environment.
*
* @category services
* @since 4.0.0
*/
var Socket = /*#__PURE__*/ Service("effect/socket/Socket");
/**
* Runtime type identifier attached to `SocketError` values.
*
* @category type IDs
* @since 4.0.0
*/
var SocketErrorTypeId = "~effect/socket/Socket/SocketError";
/**
* Returns `true` when a value is a `SocketError`.
*
* @category guards
* @since 4.0.0
*/
var isSocketError = (u) => hasProperty(u, SocketErrorTypeId);
/**
* Typed error for failures that occur while reading from a socket.
*
* @category errors
* @since 4.0.0
*/
var SocketReadError = class extends (/*#__PURE__*/ Error$2("effect/socket/Socket/SocketReadError")({
	_tag: /*#__PURE__*/ tag("SocketReadError"),
	cause: /*#__PURE__*/ Defect()
})) {
	/**
	* Default message used for socket read failures.
	*
	* @since 4.0.0
	*/
	message = `An error occurred during Read`;
};
/**
* Typed error for failures that occur while writing to a socket.
*
* @category errors
* @since 4.0.0
*/
var SocketWriteError = class extends (/*#__PURE__*/ Error$2("effect/socket/Socket/SocketWriteError")({
	_tag: /*#__PURE__*/ tag("SocketWriteError"),
	cause: /*#__PURE__*/ Defect()
})) {
	/**
	* Default message used for socket write failures.
	*
	* @since 4.0.0
	*/
	message = `An error occurred during Write`;
};
/**
* Typed error for failures that occur while opening a socket, including
* unknown open failures and open timeouts.
*
* @category errors
* @since 4.0.0
*/
var SocketOpenError = class extends (/*#__PURE__*/ Error$2("effect/socket/Socket/SocketOpenError")({
	_tag: /*#__PURE__*/ tag("SocketOpenError"),
	kind: /*#__PURE__*/ Literals(["Unknown", "Timeout"]),
	cause: /*#__PURE__*/ Defect()
})) {
	/**
	* Formats timeout and unknown open failures for display.
	*
	* @since 4.0.0
	*/
	get message() {
		return this.kind === "Timeout" ? `timeout waiting for "open"` : `An error occurred during Open`;
	}
};
/**
* Typed error for a socket close event, carrying the close code and optional
* close reason.
*
* @category errors
* @since 4.0.0
*/
var SocketCloseError = class extends (/*#__PURE__*/ Error$2("effect/socket/Socket/SocketCloseError")({
	_tag: /*#__PURE__*/ tag("SocketCloseError"),
	code: Int,
	closeReason: /*#__PURE__*/ optional(String$1)
})) {
	/**
	* Separates clean socket close errors from errors that should remain failures.
	*
	* @since 4.0.0
	*/
	static filterClean(isClean) {
		return function(u) {
			return SocketError.is(u) && u.reason._tag === "SocketCloseError" && isClean(u.reason.code) ? succeed$1(u.reason) : fail$1(u);
		};
	}
	get message() {
		if (this.closeReason) return `${this.code}: ${this.closeReason}`;
		return `${this.code}`;
	}
};
/**
* Schema for all socket-specific error reasons.
*
* @category errors
* @since 4.0.0
*/
var SocketErrorReason = /*#__PURE__*/ Union([
	SocketReadError,
	SocketWriteError,
	SocketOpenError,
	SocketCloseError
]);
/**
* Tagged error that wraps socket read, write, open, and close failures while
* preserving the underlying reason.
*
* @category errors
* @since 4.0.0
*/
var SocketError = class extends (/*#__PURE__*/ TaggedError$1(SocketErrorTypeId)("SocketError", {
	_tag: /*#__PURE__*/ tag("SocketError"),
	reason: SocketErrorReason
})) {
	constructor(props) {
		if ("cause" in props.reason) super({
			...props,
			cause: props.reason.cause
		});
		else super(props);
	}
	/**
	* Marks this value as a socket error wrapper for runtime guards.
	*
	* @since 4.0.0
	*/
	[SocketErrorTypeId] = SocketErrorTypeId;
	/**
	* Returns `true` when the value is a `SocketError`.
	*
	* @since 4.0.0
	*/
	static is(u) {
		return isSocketError(u);
	}
	message = this.reason.message;
};
//#endregion
//#region ../../node_modules/.bun/msgpackr@2.1.0/node_modules/msgpackr/unpack.js
var decoder;
try {
	decoder = new TextDecoder();
} catch (error) {}
var src;
var srcEnd;
var position$1 = 0;
var EMPTY_ARRAY = [];
var strings = EMPTY_ARRAY;
var stringPosition = 0;
var currentUnpackr = {};
var currentStructures;
var srcString;
var srcStringStart = 0;
var srcStringEnd = 0;
var bundledStrings$1;
var referenceMap;
var currentExtensions = [];
var dataView;
var defaultOptions = {
	useRecords: false,
	mapsAsObjects: true
};
var C1Type = class {};
var C1 = new C1Type();
C1.name = "MessagePack 0xC1";
var sequentialMode = false;
var inlineObjectReadThreshold = 2;
var Unpackr = class Unpackr {
	constructor(options) {
		if (options) {
			if (options.useRecords === false && options.mapsAsObjects === void 0) options.mapsAsObjects = true;
			if (options.sequential && options.trusted !== false) {
				options.trusted = true;
				if (!options.structures && options.useRecords != false) {
					options.structures = [];
					if (!options.maxSharedStructures) options.maxSharedStructures = 0;
				}
			}
			if (options.structures) options.structures.sharedLength = options.structures.length;
			else if (options.getStructures) {
				(options.structures = []).uninitialized = true;
				options.structures.sharedLength = 0;
			}
			if (options.int64AsNumber) options.int64AsType = "number";
		}
		Object.assign(this, options);
	}
	unpack(source, options) {
		if (src) return saveState(() => {
			clearSource();
			return this ? this.unpack(source, options) : Unpackr.prototype.unpack.call(defaultOptions, source, options);
		});
		if (!source.buffer && source.constructor === ArrayBuffer) source = typeof Buffer !== "undefined" ? Buffer.from(source) : new Uint8Array(source);
		if (typeof options === "object") {
			srcEnd = options.end || source.length;
			position$1 = options.start || 0;
		} else {
			position$1 = 0;
			srcEnd = options > -1 ? options : source.length;
		}
		stringPosition = 0;
		srcStringEnd = 0;
		srcString = null;
		strings = EMPTY_ARRAY;
		bundledStrings$1 = null;
		src = source;
		try {
			dataView = source.dataView || (source.dataView = new DataView(source.buffer, source.byteOffset, source.byteLength));
		} catch (error) {
			src = null;
			if (source instanceof Uint8Array) throw error;
			throw new Error("Source must be a Uint8Array or Buffer but was a " + (source && typeof source == "object" ? source.constructor.name : typeof source));
		}
		if (this instanceof Unpackr) {
			currentUnpackr = this;
			if (this.structures) {
				currentStructures = this.structures;
				return checkedRead(options);
			} else if (!currentStructures || currentStructures.length > 0) currentStructures = [];
		} else {
			currentUnpackr = defaultOptions;
			if (!currentStructures || currentStructures.length > 0) currentStructures = [];
		}
		return checkedRead(options);
	}
	unpackMultiple(source, forEach) {
		let values, lastPosition = 0;
		try {
			sequentialMode = true;
			let size = source.length;
			let value = this ? this.unpack(source, size) : defaultUnpackr.unpack(source, size);
			if (forEach) {
				if (forEach(value, lastPosition, position$1) === false) return;
				while (position$1 < size) {
					lastPosition = position$1;
					if (forEach(checkedRead(), lastPosition, position$1) === false) return;
				}
			} else {
				values = [value];
				while (position$1 < size) {
					lastPosition = position$1;
					values.push(checkedRead());
				}
				return values;
			}
		} catch (error) {
			error.lastPosition = lastPosition;
			error.values = values;
			throw error;
		} finally {
			sequentialMode = false;
			clearSource();
		}
	}
	_mergeStructures(loadedStructures, existingStructures) {
		if (this._onLoadedStructures) loadedStructures = this._onLoadedStructures(loadedStructures);
		loadedStructures = loadedStructures || [];
		if (Object.isFrozen(loadedStructures)) loadedStructures = loadedStructures.map((structure) => structure.slice(0));
		for (let i = 0, l = loadedStructures.length; i < l; i++) {
			let structure = loadedStructures[i];
			if (structure) {
				structure.isShared = true;
				if (i >= 32) structure.highByte = i - 32 >> 5;
			}
		}
		loadedStructures.sharedLength = loadedStructures.length;
		for (let id in existingStructures || []) if (id >= 0) {
			let structure = loadedStructures[id];
			let existing = existingStructures[id];
			if (existing) {
				if (structure) (loadedStructures.restoreStructures || (loadedStructures.restoreStructures = []))[id] = structure;
				loadedStructures[id] = existing;
			}
		}
		return this.structures = loadedStructures;
	}
	decode(source, options) {
		return this.unpack(source, options);
	}
};
function checkedRead(options) {
	try {
		if (!currentUnpackr.trusted && !sequentialMode) {
			let sharedLength = currentStructures.sharedLength || 0;
			if (sharedLength < currentStructures.length) currentStructures.length = sharedLength;
		}
		let result;
		if (currentUnpackr._readStruct && src[position$1] < 64 && src[position$1] >= 32) {
			result = currentUnpackr._readStruct(src, position$1, srcEnd);
			src = null;
			if (!(options && options.lazy) && result) result = result.toJSON();
			position$1 = srcEnd;
		} else result = read();
		if (bundledStrings$1) {
			position$1 = bundledStrings$1.postBundlePosition;
			bundledStrings$1 = null;
		}
		if (sequentialMode) currentStructures.restoreStructures = null;
		if (position$1 == srcEnd) {
			if (currentStructures && currentStructures.restoreStructures) restoreStructures();
			currentStructures = null;
			src = null;
			if (referenceMap) referenceMap = null;
		} else if (position$1 > srcEnd) throw new Error("Unexpected end of MessagePack data");
		else if (!sequentialMode) {
			let jsonView;
			try {
				jsonView = JSON.stringify(result, (_, value) => typeof value === "bigint" ? `${value}n` : value).slice(0, 100);
			} catch (error) {
				jsonView = "(JSON view not available " + error + ")";
			}
			throw new Error("Data read, but end of buffer not reached " + jsonView);
		}
		return result;
	} catch (error) {
		if (currentStructures && currentStructures.restoreStructures) restoreStructures();
		clearSource();
		if (error instanceof RangeError || error.message.startsWith("Unexpected end of buffer") || position$1 > srcEnd) error.incomplete = true;
		throw error;
	}
}
function restoreStructures() {
	for (let id in currentStructures.restoreStructures) currentStructures[id] = currentStructures.restoreStructures[id];
	currentStructures.restoreStructures = null;
}
function read() {
	let token = src[position$1++];
	if (token < 160) {
		if (token < 128) {
			if (token < 64) return token;
			else {
				let structure = currentStructures[token & 63] || currentUnpackr.getStructures && loadStructures()[token & 63];
				if (structure) {
					if (!structure.read) structure.read = createStructureReader(structure, token & 63);
					return structure.read();
				} else return token;
			}
		} else if (token < 144) {
			token -= 128;
			if (currentUnpackr.mapsAsObjects) {
				let object = {};
				for (let i = 0; i < token; i++) {
					let key = readKey();
					if (key === "__proto__") key = "__proto_";
					object[key] = read();
				}
				return object;
			} else {
				let map = /* @__PURE__ */ new Map();
				for (let i = 0; i < token; i++) map.set(read(), read());
				return map;
			}
		} else {
			token -= 144;
			let array = new Array(token);
			for (let i = 0; i < token; i++) array[i] = read();
			if (currentUnpackr.freezeData) return Object.freeze(array);
			return array;
		}
	} else if (token < 192) {
		let length = token - 160;
		if (srcStringEnd >= position$1) return srcString.slice(position$1 - srcStringStart, (position$1 += length) - srcStringStart);
		if (srcStringEnd == 0 && srcEnd < 140) {
			let string = length < 16 ? shortStringInJS(length) : longStringInJS(length);
			if (string != null) return string;
		}
		return readFixedString(length);
	} else {
		let value;
		switch (token) {
			case 192: return null;
			case 193:
				if (bundledStrings$1) {
					value = read();
					if (value > 0) return bundledStrings$1[1].slice(bundledStrings$1.position1, bundledStrings$1.position1 += value);
					else return bundledStrings$1[0].slice(bundledStrings$1.position0, bundledStrings$1.position0 -= value);
				}
				return C1;
			case 194: return false;
			case 195: return true;
			case 196:
				value = src[position$1++];
				if (value === void 0) throw new Error("Unexpected end of buffer");
				return readBin(value);
			case 197:
				value = dataView.getUint16(position$1);
				position$1 += 2;
				return readBin(value);
			case 198:
				value = dataView.getUint32(position$1);
				position$1 += 4;
				return readBin(value);
			case 199: return readExt(src[position$1++]);
			case 200:
				value = dataView.getUint16(position$1);
				position$1 += 2;
				return readExt(value);
			case 201:
				value = dataView.getUint32(position$1);
				position$1 += 4;
				return readExt(value);
			case 202:
				value = dataView.getFloat32(position$1);
				if (currentUnpackr.useFloat32 > 2) {
					let multiplier = mult10[(src[position$1] & 127) << 1 | src[position$1 + 1] >> 7];
					position$1 += 4;
					return (multiplier * value + (value > 0 ? .5 : -.5) >> 0) / multiplier;
				}
				position$1 += 4;
				return value;
			case 203:
				value = dataView.getFloat64(position$1);
				position$1 += 8;
				return value;
			case 204: return src[position$1++];
			case 205:
				value = dataView.getUint16(position$1);
				position$1 += 2;
				return value;
			case 206:
				value = dataView.getUint32(position$1);
				position$1 += 4;
				return value;
			case 207:
				if (currentUnpackr.int64AsType === "number") {
					value = dataView.getUint32(position$1) * 4294967296;
					value += dataView.getUint32(position$1 + 4);
				} else if (currentUnpackr.int64AsType === "string") value = dataView.getBigUint64(position$1).toString();
				else if (currentUnpackr.int64AsType === "auto") {
					value = dataView.getBigUint64(position$1);
					if (value <= BigInt(2) << BigInt(52)) value = Number(value);
				} else value = dataView.getBigUint64(position$1);
				position$1 += 8;
				return value;
			case 208: return dataView.getInt8(position$1++);
			case 209:
				value = dataView.getInt16(position$1);
				position$1 += 2;
				return value;
			case 210:
				value = dataView.getInt32(position$1);
				position$1 += 4;
				return value;
			case 211:
				if (currentUnpackr.int64AsType === "number") {
					value = dataView.getInt32(position$1) * 4294967296;
					value += dataView.getUint32(position$1 + 4);
				} else if (currentUnpackr.int64AsType === "string") value = dataView.getBigInt64(position$1).toString();
				else if (currentUnpackr.int64AsType === "auto") {
					value = dataView.getBigInt64(position$1);
					if (value >= BigInt(-2) << BigInt(52) && value <= BigInt(2) << BigInt(52)) value = Number(value);
				} else value = dataView.getBigInt64(position$1);
				position$1 += 8;
				return value;
			case 212:
				value = src[position$1++];
				if (value == 114) return recordDefinition(src[position$1++] & 63);
				else {
					let extension = currentExtensions[value];
					if (extension) {
						if (extension.read) {
							position$1++;
							return extension.read(read());
						} else if (extension.noBuffer) {
							position$1++;
							return extension();
						} else return extension(src.subarray(position$1, ++position$1));
					} else throw new Error("Unknown extension " + value);
				}
			case 213:
				value = src[position$1];
				if (value == 114) {
					position$1++;
					return recordDefinition(src[position$1++] & 63, src[position$1++]);
				} else return readExt(2);
			case 214: return readExt(4);
			case 215: return readExt(8);
			case 216: return readExt(16);
			case 217:
				value = src[position$1++];
				if (srcStringEnd >= position$1) return srcString.slice(position$1 - srcStringStart, (position$1 += value) - srcStringStart);
				return readString8(value);
			case 218:
				value = dataView.getUint16(position$1);
				position$1 += 2;
				if (srcStringEnd >= position$1) return srcString.slice(position$1 - srcStringStart, (position$1 += value) - srcStringStart);
				return readString16(value);
			case 219:
				value = dataView.getUint32(position$1);
				position$1 += 4;
				if (srcStringEnd >= position$1) return srcString.slice(position$1 - srcStringStart, (position$1 += value) - srcStringStart);
				return readString32(value);
			case 220:
				value = dataView.getUint16(position$1);
				position$1 += 2;
				return readArray(value);
			case 221:
				value = dataView.getUint32(position$1);
				position$1 += 4;
				return readArray(value);
			case 222:
				value = dataView.getUint16(position$1);
				position$1 += 2;
				return readMap(value);
			case 223:
				value = dataView.getUint32(position$1);
				position$1 += 4;
				return readMap(value);
			default:
				if (token >= 224) return token - 256;
				if (token === void 0) throw endOfMessagePackError();
				throw new Error("Unknown MessagePack token " + token);
		}
	}
}
var validName = /^[a-zA-Z_$][a-zA-Z\d_$]*$/;
function createStructureReader(structure, firstId) {
	function readObject() {
		if (readObject.count++ > inlineObjectReadThreshold) {
			let optimizedReadObject;
			try {
				optimizedReadObject = structure.read = new Function("r", "return function(){return " + (currentUnpackr.freezeData ? "Object.freeze" : "") + "({" + structure.map((key) => key === "__proto__" ? "__proto_:r()" : validName.test(key) ? key + ":r()" : "[" + JSON.stringify(key) + "]:r()").join(",") + "})}")(read);
			} catch (error) {
				inlineObjectReadThreshold = Infinity;
				return readObject();
			}
			structure.read0 = optimizedReadObject;
			if (structure.highByte === 0) structure.read = createSecondByteReader(firstId, structure.read);
			return optimizedReadObject();
		}
		let object = {};
		for (let i = 0, l = structure.length; i < l; i++) {
			let key = structure[i];
			if (key === "__proto__") key = "__proto_";
			object[key] = read();
		}
		if (currentUnpackr.freezeData) return Object.freeze(object);
		return object;
	}
	readObject.count = 0;
	structure.read0 = readObject;
	if (structure.highByte === 0) return createSecondByteReader(firstId, readObject);
	return readObject;
}
var createSecondByteReader = (firstId, read0) => {
	return function() {
		let highByte = src[position$1++];
		if (highByte === 0) return read0();
		let id = firstId < 32 ? -(firstId + (highByte << 5)) : firstId + (highByte << 5);
		let structure = currentStructures[id] || loadStructures()[id];
		if (!structure) throw new Error("Record id is not defined for " + id);
		if (!structure.read) structure.read = createStructureReader(structure, firstId);
		return structure.read();
	};
};
function loadStructures() {
	let loadedStructures = saveState(() => {
		src = null;
		return currentUnpackr.getStructures();
	});
	return currentStructures = currentUnpackr._mergeStructures(loadedStructures, currentStructures);
}
var readFixedString = readStringJS;
var readString8 = readStringJS;
var readString16 = readStringJS;
var readString32 = readStringJS;
function setExtractor(extractStrings) {
	readFixedString = readString(1);
	readString8 = readString(2);
	readString16 = readString(3);
	readString32 = readString(5);
	function readString(headerLength) {
		return function readString(length) {
			let string = strings[stringPosition++];
			if (string == null) {
				if (bundledStrings$1) return readStringJS(length);
				let byteOffset = src.byteOffset;
				let extraction = extractStrings(position$1 - headerLength + byteOffset, srcEnd + byteOffset, src.buffer);
				if (typeof extraction == "string") {
					string = extraction;
					strings = EMPTY_ARRAY;
				} else {
					strings = extraction;
					stringPosition = 1;
					srcStringEnd = 1;
					string = strings[0];
					if (string === void 0) throw new Error("Unexpected end of buffer");
				}
			}
			let srcStringLength = string.length;
			if (srcStringLength <= length) {
				position$1 += length;
				return string;
			}
			srcString = string;
			srcStringStart = position$1;
			srcStringEnd = position$1 + srcStringLength;
			position$1 += length;
			return string.slice(0, length);
		};
	}
}
function readStringJS(length) {
	let result;
	if (length < 16) {
		if (result = shortStringInJS(length)) return result;
	}
	if (length > 64 && decoder) return decoder.decode(src.subarray(position$1, position$1 += length));
	const end = position$1 + length;
	const units = [];
	result = "";
	while (position$1 < end) {
		const byte1 = src[position$1++];
		if ((byte1 & 128) === 0) units.push(byte1);
		else if ((byte1 & 224) === 192) {
			if (byte1 < 194 || position$1 >= end || (src[position$1] & 192) !== 128) units.push(65533);
			else {
				const byte2 = src[position$1++] & 63;
				units.push((byte1 & 31) << 6 | byte2);
			}
		} else if ((byte1 & 240) === 224) {
			const byte2 = position$1 < end ? src[position$1] : 0;
			if (position$1 >= end || (byte2 & 192) !== 128 || byte1 === 224 && byte2 < 160 || byte1 === 237 && byte2 >= 160) units.push(65533);
			else {
				position$1++;
				if (position$1 >= end || (src[position$1] & 192) !== 128) units.push(65533);
				else {
					const byte3 = src[position$1++] & 63;
					units.push((byte1 & 31) << 12 | (byte2 & 63) << 6 | byte3);
				}
			}
		} else if ((byte1 & 248) === 240) {
			const byte2 = position$1 < end ? src[position$1] : 0;
			if (byte1 > 244 || position$1 >= end || (byte2 & 192) !== 128 || byte1 === 240 && byte2 < 144 || byte1 === 244 && byte2 >= 144) units.push(65533);
			else {
				position$1++;
				if (position$1 >= end || (src[position$1] & 192) !== 128) units.push(65533);
				else {
					const byte3 = src[position$1++] & 63;
					if (position$1 >= end || (src[position$1] & 192) !== 128) units.push(65533);
					else {
						const byte4 = src[position$1++] & 63;
						let unit = (byte1 & 7) << 18 | (byte2 & 63) << 12 | byte3 << 6 | byte4;
						unit -= 65536;
						units.push(unit >>> 10 & 1023 | 55296);
						units.push(56320 | unit & 1023);
					}
				}
			}
		} else units.push(65533);
		if (units.length >= 4096) {
			result += fromCharCode.apply(String, units);
			units.length = 0;
		}
	}
	if (units.length > 0) result += fromCharCode.apply(String, units);
	return result;
}
function endOfMessagePackError() {
	let error = /* @__PURE__ */ new Error("Unexpected end of MessagePack data");
	error.incomplete = true;
	return error;
}
function readArray(length) {
	if (length > srcEnd - position$1) throw endOfMessagePackError();
	let array = new Array(length);
	for (let i = 0; i < length; i++) array[i] = read();
	if (currentUnpackr.freezeData) return Object.freeze(array);
	return array;
}
function readMap(length) {
	if (length > (srcEnd - position$1) / 2) throw endOfMessagePackError();
	if (currentUnpackr.mapsAsObjects) {
		let object = {};
		for (let i = 0; i < length; i++) {
			let key = readKey();
			if (key === "__proto__") key = "__proto_";
			object[key] = read();
		}
		return object;
	} else {
		let map = /* @__PURE__ */ new Map();
		for (let i = 0; i < length; i++) map.set(read(), read());
		return map;
	}
}
var fromCharCode = String.fromCharCode;
function longStringInJS(length) {
	let start = position$1;
	let bytes = new Array(length);
	for (let i = 0; i < length; i++) {
		const byte = src[position$1++];
		if ((byte & 128) > 0) {
			position$1 = start;
			return;
		}
		bytes[i] = byte;
	}
	return fromCharCode.apply(String, bytes);
}
function shortStringInJS(length) {
	if (length < 4) {
		if (length < 2) {
			if (length === 0) return "";
			else {
				let a = src[position$1++];
				if ((a & 128) > 1) {
					position$1 -= 1;
					return;
				}
				return fromCharCode(a);
			}
		} else {
			let a = src[position$1++];
			let b = src[position$1++];
			if ((a & 128) > 0 || (b & 128) > 0) {
				position$1 -= 2;
				return;
			}
			if (length < 3) return fromCharCode(a, b);
			let c = src[position$1++];
			if ((c & 128) > 0) {
				position$1 -= 3;
				return;
			}
			return fromCharCode(a, b, c);
		}
	} else {
		let a = src[position$1++];
		let b = src[position$1++];
		let c = src[position$1++];
		let d = src[position$1++];
		if ((a & 128) > 0 || (b & 128) > 0 || (c & 128) > 0 || (d & 128) > 0) {
			position$1 -= 4;
			return;
		}
		if (length < 6) {
			if (length === 4) return fromCharCode(a, b, c, d);
			else {
				let e = src[position$1++];
				if ((e & 128) > 0) {
					position$1 -= 5;
					return;
				}
				return fromCharCode(a, b, c, d, e);
			}
		} else if (length < 8) {
			let e = src[position$1++];
			let f = src[position$1++];
			if ((e & 128) > 0 || (f & 128) > 0) {
				position$1 -= 6;
				return;
			}
			if (length < 7) return fromCharCode(a, b, c, d, e, f);
			let g = src[position$1++];
			if ((g & 128) > 0) {
				position$1 -= 7;
				return;
			}
			return fromCharCode(a, b, c, d, e, f, g);
		} else {
			let e = src[position$1++];
			let f = src[position$1++];
			let g = src[position$1++];
			let h = src[position$1++];
			if ((e & 128) > 0 || (f & 128) > 0 || (g & 128) > 0 || (h & 128) > 0) {
				position$1 -= 8;
				return;
			}
			if (length < 10) {
				if (length === 8) return fromCharCode(a, b, c, d, e, f, g, h);
				else {
					let i = src[position$1++];
					if ((i & 128) > 0) {
						position$1 -= 9;
						return;
					}
					return fromCharCode(a, b, c, d, e, f, g, h, i);
				}
			} else if (length < 12) {
				let i = src[position$1++];
				let j = src[position$1++];
				if ((i & 128) > 0 || (j & 128) > 0) {
					position$1 -= 10;
					return;
				}
				if (length < 11) return fromCharCode(a, b, c, d, e, f, g, h, i, j);
				let k = src[position$1++];
				if ((k & 128) > 0) {
					position$1 -= 11;
					return;
				}
				return fromCharCode(a, b, c, d, e, f, g, h, i, j, k);
			} else {
				let i = src[position$1++];
				let j = src[position$1++];
				let k = src[position$1++];
				let l = src[position$1++];
				if ((i & 128) > 0 || (j & 128) > 0 || (k & 128) > 0 || (l & 128) > 0) {
					position$1 -= 12;
					return;
				}
				if (length < 14) {
					if (length === 12) return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l);
					else {
						let m = src[position$1++];
						if ((m & 128) > 0) {
							position$1 -= 13;
							return;
						}
						return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m);
					}
				} else {
					let m = src[position$1++];
					let n = src[position$1++];
					if ((m & 128) > 0 || (n & 128) > 0) {
						position$1 -= 14;
						return;
					}
					if (length < 15) return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m, n);
					let o = src[position$1++];
					if ((o & 128) > 0) {
						position$1 -= 15;
						return;
					}
					return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
				}
			}
		}
	}
}
function readOnlyJSString() {
	let token = src[position$1++];
	let length;
	if (token < 192) length = token - 160;
	else switch (token) {
		case 217:
			length = src[position$1++];
			break;
		case 218:
			length = dataView.getUint16(position$1);
			position$1 += 2;
			break;
		case 219:
			length = dataView.getUint32(position$1);
			position$1 += 4;
			break;
		default: throw new Error("Expected string");
	}
	return readStringJS(length);
}
function readBin(length) {
	return currentUnpackr.copyBuffers ? Uint8Array.prototype.slice.call(src, position$1, position$1 += length) : src.subarray(position$1, position$1 += length);
}
function readExt(length) {
	let type = src[position$1++];
	if (currentExtensions[type]) {
		let end;
		return currentExtensions[type](src.subarray(position$1, end = position$1 += length), (readPosition) => {
			position$1 = readPosition;
			try {
				return read();
			} finally {
				position$1 = end;
			}
		});
	} else throw new Error("Unknown extension type " + type);
}
var keyCache = new Array(4096);
function readKey() {
	let length = src[position$1++];
	if (length >= 160 && length < 192) {
		length = length - 160;
		if (srcStringEnd >= position$1) return srcString.slice(position$1 - srcStringStart, (position$1 += length) - srcStringStart);
		else if (!(srcStringEnd == 0 && srcEnd < 180)) return readFixedString(length);
	} else {
		position$1--;
		return asSafeString(read());
	}
	let key = (length << 5 ^ (length > 1 ? dataView.getUint16(position$1) : length > 0 ? src[position$1] : 0)) & 4095;
	let entry = keyCache[key];
	let checkPosition = position$1;
	let end = position$1 + length - 3;
	let chunk;
	let i = 0;
	if (entry && entry.bytes == length) {
		while (checkPosition < end) {
			chunk = dataView.getUint32(checkPosition);
			if (chunk != entry[i++]) {
				checkPosition = 1879048192;
				break;
			}
			checkPosition += 4;
		}
		end += 3;
		while (checkPosition < end) {
			chunk = src[checkPosition++];
			if (chunk != entry[i++]) {
				checkPosition = 1879048192;
				break;
			}
		}
		if (checkPosition === end) {
			position$1 = checkPosition;
			return entry.string;
		}
		end -= 3;
		checkPosition = position$1;
	}
	entry = [];
	keyCache[key] = entry;
	entry.bytes = length;
	while (checkPosition < end) {
		chunk = dataView.getUint32(checkPosition);
		entry.push(chunk);
		checkPosition += 4;
	}
	end += 3;
	while (checkPosition < end) {
		chunk = src[checkPosition++];
		entry.push(chunk);
	}
	let string = length < 16 ? shortStringInJS(length) : longStringInJS(length);
	if (string != null) return entry.string = string;
	return entry.string = readFixedString(length);
}
function asSafeString(property) {
	if (typeof property === "string") return property;
	if (typeof property === "number" || typeof property === "boolean" || typeof property === "bigint") return property.toString();
	if (property == null) return property + "";
	if (currentUnpackr.allowArraysInMapKeys && Array.isArray(property) && property.flat().every((item) => [
		"string",
		"number",
		"boolean",
		"bigint"
	].includes(typeof item))) return property.flat().toString();
	throw new Error(`Invalid property type for record: ${typeof property}`);
}
var recordDefinition = (id, highByte) => {
	let structure = read().map(asSafeString);
	let firstByte = id;
	if (highByte !== void 0) {
		id = id < 32 ? -((highByte << 5) + id) : (highByte << 5) + id;
		structure.highByte = highByte;
	}
	let existingStructure = currentStructures[id];
	if (existingStructure && (existingStructure.isShared || sequentialMode)) (currentStructures.restoreStructures || (currentStructures.restoreStructures = []))[id] = existingStructure;
	currentStructures[id] = structure;
	structure.read = createStructureReader(structure, firstByte);
	return (structure.read0 || structure.read)();
};
currentExtensions[0] = () => {};
currentExtensions[0].noBuffer = true;
currentExtensions[66] = (data) => {
	let headLength = data.byteLength % 8 || 8;
	let head = BigInt(data[0] & 128 ? data[0] - 256 : data[0]);
	for (let i = 1; i < headLength; i++) {
		head <<= BigInt(8);
		head += BigInt(data[i]);
	}
	if (data.byteLength !== headLength) {
		let view = new DataView(data.buffer, data.byteOffset, data.byteLength);
		let decode = (start, end) => {
			let length = end - start;
			if (length <= 40) {
				let out = view.getBigUint64(start);
				for (let i = start + 8; i < end; i += 8) {
					out <<= BigInt(64);
					out |= view.getBigUint64(i);
				}
				return out;
			}
			let middle = start + (length >> 4 << 3);
			let left = decode(start, middle);
			let right = decode(middle, end);
			return left << BigInt((end - middle) * 8) | right;
		};
		head = head << BigInt((view.byteLength - headLength) * 8) | decode(headLength, view.byteLength);
	}
	return head;
};
var errors = {
	Error,
	EvalError,
	RangeError,
	ReferenceError,
	SyntaxError,
	TypeError,
	URIError,
	AggregateError: typeof AggregateError === "function" ? AggregateError : null
};
currentExtensions[101] = () => {
	let data = read();
	if (!errors[data[0]]) {
		let error = Error(data[1], { cause: data[2] });
		error.name = data[0];
		return error;
	}
	return errors[data[0]](data[1], { cause: data[2] });
};
currentExtensions[105] = (data) => {
	if (currentUnpackr.structuredClone === false) throw new Error("Structured clone extension is disabled");
	let id = dataView.getUint32(position$1 - 4);
	if (!referenceMap) referenceMap = /* @__PURE__ */ new Map();
	let token = src[position$1];
	let target;
	if (token >= 144 && token < 160 || token == 220 || token == 221) target = [];
	else if (token >= 128 && token < 144 || token == 222 || token == 223) target = /* @__PURE__ */ new Map();
	else if ((token >= 199 && token <= 201 || token >= 212 && token <= 216) && src[position$1 + 1] === 115) target = /* @__PURE__ */ new Set();
	else target = {};
	let refEntry = { target };
	referenceMap.set(id, refEntry);
	let targetProperties = read();
	if (!refEntry.used) return refEntry.target = targetProperties;
	else Object.assign(target, targetProperties);
	if (target instanceof Map) for (let [k, v] of targetProperties.entries()) target.set(k, v);
	if (target instanceof Set) for (let i of Array.from(targetProperties)) target.add(i);
	return target;
};
currentExtensions[112] = (data) => {
	if (currentUnpackr.structuredClone === false) throw new Error("Structured clone extension is disabled");
	let id = dataView.getUint32(position$1 - 4);
	let refEntry = referenceMap.get(id);
	refEntry.used = true;
	return refEntry.target;
};
currentExtensions[115] = () => new Set(read());
var typedArrays = [
	"Int8",
	"Uint8",
	"Uint8Clamped",
	"Int16",
	"Uint16",
	"Int32",
	"Uint32",
	"Float32",
	"Float64",
	"BigInt64",
	"BigUint64"
].map((type) => type + "Array");
var glbl = typeof globalThis === "object" ? globalThis : window;
currentExtensions[116] = (data) => {
	let typeCode = data[0];
	let buffer = Uint8Array.prototype.slice.call(data, 1).buffer;
	let typedArrayName = typedArrays[typeCode];
	if (!typedArrayName) {
		if (typeCode === 16) return buffer;
		if (typeCode === 17) return new DataView(buffer);
		throw new Error("Could not find typed array for code " + typeCode);
	}
	return new glbl[typedArrayName](buffer);
};
currentExtensions[120] = () => {
	let data = read();
	return new RegExp(data[0], data[1]);
};
var TEMP_BUNDLE = [];
currentExtensions[98] = (data) => {
	let dataSize = (data[0] << 24) + (data[1] << 16) + (data[2] << 8) + data[3];
	let dataPosition = position$1;
	position$1 += dataSize - data.length;
	bundledStrings$1 = TEMP_BUNDLE;
	bundledStrings$1 = [readOnlyJSString(), readOnlyJSString()];
	bundledStrings$1.position0 = 0;
	bundledStrings$1.position1 = 0;
	bundledStrings$1.postBundlePosition = position$1;
	position$1 = dataPosition;
	return read();
};
currentExtensions[255] = (data) => {
	if (data.length == 4) return /* @__PURE__ */ new Date((data[0] * 16777216 + (data[1] << 16) + (data[2] << 8) + data[3]) * 1e3);
	else if (data.length == 8) return /* @__PURE__ */ new Date(((data[0] << 22) + (data[1] << 14) + (data[2] << 6) + (data[3] >> 2)) / 1e6 + ((data[3] & 3) * 4294967296 + data[4] * 16777216 + (data[5] << 16) + (data[6] << 8) + data[7]) * 1e3);
	else if (data.length == 12) return /* @__PURE__ */ new Date(((data[0] << 24) + (data[1] << 16) + (data[2] << 8) + data[3]) / 1e6 + ((data[4] & 128 ? -281474976710656 : 0) + data[6] * 1099511627776 + data[7] * 4294967296 + data[8] * 16777216 + (data[9] << 16) + (data[10] << 8) + data[11]) * 1e3);
	else return /* @__PURE__ */ new Date("invalid");
};
function saveState(callback) {
	if (currentUnpackr && currentUnpackr._onSaveState) currentUnpackr._onSaveState();
	let savedSrcEnd = srcEnd;
	let savedPosition = position$1;
	let savedStringPosition = stringPosition;
	let savedSrcStringStart = srcStringStart;
	let savedSrcStringEnd = srcStringEnd;
	let savedSrcString = srcString;
	let savedStrings = strings;
	let savedReferenceMap = referenceMap;
	let savedBundledStrings = bundledStrings$1;
	let savedSrc = new Uint8Array(src.slice(0, srcEnd));
	let savedStructures = currentStructures;
	let savedStructuresContents = currentStructures.slice(0, currentStructures.length);
	let savedPackr = currentUnpackr;
	let savedSequentialMode = sequentialMode;
	let value = callback();
	srcEnd = savedSrcEnd;
	position$1 = savedPosition;
	stringPosition = savedStringPosition;
	srcStringStart = savedSrcStringStart;
	srcStringEnd = savedSrcStringEnd;
	srcString = savedSrcString;
	strings = savedStrings;
	referenceMap = savedReferenceMap;
	bundledStrings$1 = savedBundledStrings;
	src = savedSrc;
	sequentialMode = savedSequentialMode;
	currentStructures = savedStructures;
	currentStructures.splice(0, currentStructures.length, ...savedStructuresContents);
	currentUnpackr = savedPackr;
	dataView = new DataView(src.buffer, src.byteOffset, src.byteLength);
	return value;
}
function clearSource() {
	src = null;
	referenceMap = null;
	currentStructures = null;
}
var mult10 = new Array(147);
for (let i = 0; i < 256; i++) mult10[i] = +("1e" + Math.floor(45.15 - i * .30103));
var defaultUnpackr = new Unpackr({ useRecords: false });
defaultUnpackr.unpack;
defaultUnpackr.unpackMultiple;
defaultUnpackr.unpack;
var FLOAT32_OPTIONS = {
	NEVER: 0,
	ALWAYS: 1,
	DECIMAL_ROUND: 3,
	DECIMAL_FIT: 4
};
new Uint8Array((/* @__PURE__ */ new Float32Array(1)).buffer, 0, 4);
Unpackr.SUPPORTS_STRUCT_HOOKS = true;
//#endregion
//#region ../../node_modules/.bun/msgpackr@2.1.0/node_modules/msgpackr/pack.js
var textEncoder;
try {
	textEncoder = new TextEncoder();
} catch (error) {}
var extensions;
var extensionClasses;
var hasNodeBuffer = typeof Buffer !== "undefined";
var ByteArrayAllocate = hasNodeBuffer ? function(length) {
	return Buffer.allocUnsafeSlow(length);
} : Uint8Array;
var ByteArray = hasNodeBuffer ? Buffer : Uint8Array;
var MAX_BUFFER_SIZE = hasNodeBuffer ? 4294967296 : 2144337920;
var target;
var keysTarget;
var targetView;
var position = 0;
var safeEnd;
var bundledStrings = null;
var MAX_BUNDLE_SIZE = 21760;
var hasNonLatin = /[\u0080-\uFFFF]/;
var RECORD_SYMBOL = Symbol("record-id");
var Packr = class extends Unpackr {
	constructor(options) {
		super(options);
		this.offset = 0;
		let start;
		let hasSharedUpdate;
		let structures;
		let referenceMap;
		let encodeUtf8 = ByteArray.prototype.utf8Write ? function(string, position) {
			return target.utf8Write(string, position, target.byteLength - position);
		} : textEncoder && textEncoder.encodeInto ? function(string, position) {
			return textEncoder.encodeInto(string, target.subarray(position)).written;
		} : false;
		let packr = this;
		if (!options) options = {};
		let isSequential = options && options.sequential;
		let hasSharedStructures = options.structures || options.saveStructures;
		let maxSharedStructures = options.maxSharedStructures;
		if (maxSharedStructures == null) maxSharedStructures = hasSharedStructures ? 32 : 0;
		if (maxSharedStructures > 8160) throw new Error("Maximum maxSharedStructure is 8160");
		if (options.structuredClone && options.moreTypes == void 0) this.moreTypes = true;
		let maxOwnStructures = options.maxOwnStructures;
		if (maxOwnStructures == null) maxOwnStructures = hasSharedStructures ? 32 : 64;
		if (!this.structures && options.useRecords != false) this.structures = [];
		let useTwoByteRecords = maxSharedStructures > 32 || maxOwnStructures + maxSharedStructures > 64;
		let sharedLimitId = maxSharedStructures + 64;
		let maxStructureId = maxSharedStructures + maxOwnStructures + 64;
		if (maxStructureId > 8256) throw new Error("Maximum maxSharedStructure + maxOwnStructure is 8192");
		let recordIdsToRemove = [];
		let transitionsCount = 0;
		let serializationsSinceTransitionRebuild = 0;
		this.pack = this.encode = function(value, encodeOptions) {
			if (!target) {
				target = new ByteArrayAllocate(8192);
				targetView = target.dataView || (target.dataView = new DataView(target.buffer, 0, 8192));
				position = 0;
			}
			safeEnd = target.length - 10;
			if (safeEnd - position < 2048) {
				target = new ByteArrayAllocate(target.length);
				targetView = target.dataView || (target.dataView = new DataView(target.buffer, 0, target.length));
				safeEnd = target.length - 10;
				position = 0;
			} else position = position + 7 & 2147483640;
			start = position;
			if (encodeOptions & 2048) position += encodeOptions & 255;
			referenceMap = packr.structuredClone ? /* @__PURE__ */ new Map() : null;
			if (packr.bundleStrings && typeof value !== "string") {
				bundledStrings = [];
				bundledStrings.size = Infinity;
			} else bundledStrings = null;
			structures = packr.structures;
			if (structures) {
				if (structures.uninitialized) structures = packr._mergeStructures(packr.getStructures());
				let sharedLength = structures.sharedLength || 0;
				if (sharedLength > maxSharedStructures) throw new Error("Shared structures is larger than maximum shared structures, try increasing maxSharedStructures to " + structures.sharedLength);
				if (!structures.transitions) {
					structures.transitions = Object.create(null);
					for (let i = 0; i < sharedLength; i++) {
						let keys = structures[i];
						if (!keys) continue;
						let nextTransition, transition = structures.transitions;
						for (let j = 0, l = keys.length; j < l; j++) {
							let key = keys[j];
							nextTransition = transition[key];
							if (!nextTransition) nextTransition = transition[key] = Object.create(null);
							transition = nextTransition;
						}
						transition[RECORD_SYMBOL] = i + 64;
					}
					this.lastNamedStructuresLength = sharedLength;
				}
				if (!isSequential) structures.nextId = sharedLength + 64;
			}
			if (hasSharedUpdate) hasSharedUpdate = false;
			let encodingError;
			try {
				if (packr._writeStruct && value && typeof value === "object") {
					if (value.constructor === Object) writeStruct(value);
					else if (value.constructor !== Map && !Array.isArray(value) && !extensionClasses.some((extClass) => value instanceof extClass)) writeStruct(packr.useToJSON !== false && value.toJSON ? value.toJSON() : value);
					else pack(value);
				} else pack(value);
				let lastBundle = bundledStrings;
				if (bundledStrings) writeBundles(start, pack, 0);
				if (referenceMap && referenceMap.idsToInsert) {
					let idsToInsert = referenceMap.idsToInsert.sort((a, b) => a.offset > b.offset ? 1 : -1);
					let i = idsToInsert.length;
					let incrementPosition = -1;
					while (lastBundle && i > 0) {
						let insertionPoint = idsToInsert[--i].offset + start;
						if (insertionPoint < lastBundle.stringsPosition + start && incrementPosition === -1) incrementPosition = 0;
						if (insertionPoint > lastBundle.position + start) {
							if (incrementPosition >= 0) incrementPosition += 6;
						} else {
							if (incrementPosition >= 0) {
								targetView.setUint32(lastBundle.position + start, targetView.getUint32(lastBundle.position + start) + incrementPosition);
								incrementPosition = -1;
							}
							lastBundle = lastBundle.previous;
							i++;
						}
					}
					if (incrementPosition >= 0 && lastBundle) targetView.setUint32(lastBundle.position + start, targetView.getUint32(lastBundle.position + start) + incrementPosition);
					position += idsToInsert.length * 6;
					if (position > safeEnd) makeRoom(position);
					packr.offset = position;
					let serialized = insertIds(target.subarray(start, position), idsToInsert);
					referenceMap = null;
					return serialized;
				}
				packr.offset = position;
				if (encodeOptions & 512) {
					target.start = start;
					target.end = position;
					return target;
				}
				return target.subarray(start, position);
			} catch (error) {
				encodingError = error;
				throw error;
			} finally {
				if (structures) {
					resetStructures();
					if (hasSharedUpdate && packr.saveStructures) {
						let sharedLength = structures.sharedLength || 0;
						let returnBuffer = target.subarray(start, position);
						let newSharedData = (packr._prepareStructures || prepareStructures)(structures, packr);
						if (!encodingError) {
							if (packr.saveStructures(newSharedData, newSharedData.isCompatible) === false) {
								structures.uninitialized = true;
								return packr.pack(value, encodeOptions);
							}
							packr.lastNamedStructuresLength = sharedLength;
							if (target.length > 1073741824) target = null;
							return returnBuffer;
						}
					}
				}
				if (target.length > 1073741824) target = null;
				if (encodeOptions & 1024) position = start;
			}
		};
		const resetStructures = () => {
			if (serializationsSinceTransitionRebuild < 10) serializationsSinceTransitionRebuild++;
			let sharedLength = structures.sharedLength || 0;
			if (structures.length > sharedLength && !isSequential) structures.length = sharedLength;
			if (transitionsCount > 1e4) {
				structures.transitions = null;
				serializationsSinceTransitionRebuild = 0;
				transitionsCount = 0;
				if (recordIdsToRemove.length > 0) recordIdsToRemove = [];
			} else if (recordIdsToRemove.length > 0 && !isSequential) {
				for (let i = 0, l = recordIdsToRemove.length; i < l; i++) recordIdsToRemove[i][RECORD_SYMBOL] = 0;
				recordIdsToRemove = [];
			}
		};
		const packArray = (value) => {
			var length = value.length;
			if (length < 16) target[position++] = 144 | length;
			else if (length < 65536) {
				target[position++] = 220;
				target[position++] = length >> 8;
				target[position++] = length & 255;
			} else {
				target[position++] = 221;
				targetView.setUint32(position, length);
				position += 4;
			}
			for (let i = 0; i < length; i++) pack(value[i]);
		};
		const pack = (value) => {
			if (position > safeEnd) target = makeRoom(position);
			var type = typeof value;
			var length;
			if (type === "string") {
				let strLength = value.length;
				if (bundledStrings && strLength >= 4 && strLength < 4096) {
					if ((bundledStrings.size += strLength) > MAX_BUNDLE_SIZE) {
						let extStart;
						let maxBytes = (bundledStrings[0] ? bundledStrings[0].length * 3 + bundledStrings[1].length : 0) + 10;
						if (position + maxBytes > safeEnd) target = makeRoom(position + maxBytes);
						let lastBundle;
						if (bundledStrings.position) {
							lastBundle = bundledStrings;
							target[position] = 200;
							position += 3;
							target[position++] = 98;
							extStart = position - start;
							position += 4;
							writeBundles(start, pack, 0);
							targetView.setUint16(extStart + start - 3, position - start - extStart);
						} else {
							target[position++] = 214;
							target[position++] = 98;
							extStart = position - start;
							position += 4;
						}
						bundledStrings = ["", ""];
						bundledStrings.previous = lastBundle;
						bundledStrings.size = 0;
						bundledStrings.position = extStart;
					}
					let twoByte = hasNonLatin.test(value);
					bundledStrings[twoByte ? 0 : 1] += value;
					target[position++] = 193;
					pack(twoByte ? -strLength : strLength);
					return;
				}
				let headerSize;
				if (strLength < 32) headerSize = 1;
				else if (strLength < 256) headerSize = 2;
				else if (strLength < 65536) headerSize = 3;
				else headerSize = 5;
				let maxBytes = strLength * 3;
				if (position + maxBytes > safeEnd) target = makeRoom(position + maxBytes);
				if (strLength < 64 || !encodeUtf8) {
					let i, c1, c2, strPosition = position + headerSize;
					for (i = 0; i < strLength; i++) {
						c1 = value.charCodeAt(i);
						if (c1 < 128) target[strPosition++] = c1;
						else if (c1 < 2048) {
							target[strPosition++] = c1 >> 6 | 192;
							target[strPosition++] = c1 & 63 | 128;
						} else if ((c1 & 64512) === 55296 && ((c2 = value.charCodeAt(i + 1)) & 64512) === 56320) {
							c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
							i++;
							target[strPosition++] = c1 >> 18 | 240;
							target[strPosition++] = c1 >> 12 & 63 | 128;
							target[strPosition++] = c1 >> 6 & 63 | 128;
							target[strPosition++] = c1 & 63 | 128;
						} else {
							target[strPosition++] = c1 >> 12 | 224;
							target[strPosition++] = c1 >> 6 & 63 | 128;
							target[strPosition++] = c1 & 63 | 128;
						}
					}
					length = strPosition - position - headerSize;
				} else length = encodeUtf8(value, position + headerSize);
				if (length < 32) target[position++] = 160 | length;
				else if (length < 256) {
					if (headerSize < 2) target.copyWithin(position + 2, position + 1, position + 1 + length);
					target[position++] = 217;
					target[position++] = length;
				} else if (length < 65536) {
					if (headerSize < 3) target.copyWithin(position + 3, position + 2, position + 2 + length);
					target[position++] = 218;
					target[position++] = length >> 8;
					target[position++] = length & 255;
				} else {
					if (headerSize < 5) target.copyWithin(position + 5, position + 3, position + 3 + length);
					target[position++] = 219;
					targetView.setUint32(position, length);
					position += 4;
				}
				position += length;
			} else if (type === "number") {
				if (value >>> 0 === value) {
					if (value < 32 || value < 128 && this.useRecords === false || value < 64 && !this._writeStruct) target[position++] = value;
					else if (value < 256) {
						target[position++] = 204;
						target[position++] = value;
					} else if (value < 65536) {
						target[position++] = 205;
						target[position++] = value >> 8;
						target[position++] = value & 255;
					} else {
						target[position++] = 206;
						targetView.setUint32(position, value);
						position += 4;
					}
				} else if (value >> 0 === value) {
					if (value >= -32) target[position++] = 256 + value;
					else if (value >= -128) {
						target[position++] = 208;
						target[position++] = value + 256;
					} else if (value >= -32768) {
						target[position++] = 209;
						targetView.setInt16(position, value);
						position += 2;
					} else {
						target[position++] = 210;
						targetView.setInt32(position, value);
						position += 4;
					}
				} else {
					let useFloat32;
					if ((useFloat32 = this.useFloat32) > 0 && value < 4294967296 && value >= -2147483648) {
						target[position++] = 202;
						targetView.setFloat32(position, value);
						let xShifted;
						if (useFloat32 < 4 || (xShifted = value * mult10[(target[position] & 127) << 1 | target[position + 1] >> 7]) >> 0 === xShifted) {
							position += 4;
							return;
						} else position--;
					}
					target[position++] = 203;
					targetView.setFloat64(position, value);
					position += 8;
				}
			} else if (type === "object" || type === "function") {
				if (!value) target[position++] = 192;
				else {
					if (referenceMap) {
						let referee = referenceMap.get(value);
						if (referee) {
							if (!referee.id) referee.id = (referenceMap.idsToInsert || (referenceMap.idsToInsert = [])).push(referee);
							target[position++] = 214;
							target[position++] = 112;
							targetView.setUint32(position, referee.id);
							position += 4;
							return;
						} else referenceMap.set(value, { offset: position - start });
					}
					let constructor = value.constructor;
					if (constructor === Object) writeObject(value);
					else if (constructor === Array) packArray(value);
					else if (constructor === Map) {
						if (this.mapAsEmptyObject) target[position++] = 128;
						else {
							length = value.size;
							if (length < 16) target[position++] = 128 | length;
							else if (length < 65536) {
								target[position++] = 222;
								target[position++] = length >> 8;
								target[position++] = length & 255;
							} else {
								target[position++] = 223;
								targetView.setUint32(position, length);
								position += 4;
							}
							for (let [key, entryValue] of value) {
								pack(key);
								pack(entryValue);
							}
						}
					} else {
						for (let i = 0, l = extensions.length; i < l; i++) {
							let extensionClass = extensionClasses[i];
							if (value instanceof extensionClass) {
								let extension = extensions[i];
								if (extension.write) {
									if (extension.type) {
										target[position++] = 212;
										target[position++] = extension.type;
										target[position++] = 0;
									}
									let writeResult = extension.write.call(this, value);
									if (writeResult === value) {
										if (Array.isArray(value)) packArray(value);
										else writeObject(value);
									} else pack(writeResult);
									return;
								}
								let currentTarget = target;
								let currentTargetView = targetView;
								let currentPosition = position;
								target = null;
								let result;
								try {
									result = extension.pack.call(this, value, (size) => {
										target = currentTarget;
										currentTarget = null;
										position += size;
										if (position > safeEnd) makeRoom(position);
										return {
											target,
											targetView,
											position: position - size
										};
									}, pack);
								} finally {
									if (currentTarget) {
										target = currentTarget;
										targetView = currentTargetView;
										position = currentPosition;
										safeEnd = target.length - 10;
									}
								}
								if (result) {
									if (result.length + position > safeEnd) makeRoom(result.length + position);
									position = writeExtensionData(result, target, position, extension.type);
								}
								return;
							}
						}
						if (Array.isArray(value)) packArray(value);
						else {
							if (packr.useToJSON !== false && value.toJSON) {
								const json = value.toJSON();
								if (json !== value) return pack(json);
							}
							if (type === "function") return pack(this.writeFunction && this.writeFunction(value));
							writeObject(value);
						}
					}
				}
			} else if (type === "boolean") target[position++] = value ? 195 : 194;
			else if (type === "bigint") {
				if (value < 0x8000000000000000 && value >= -0x8000000000000000) {
					target[position++] = 211;
					targetView.setBigInt64(position, value);
				} else if (value < 0x10000000000000000 && value > 0) {
					target[position++] = 207;
					targetView.setBigUint64(position, value);
				} else if (this.largeBigIntToFloat) {
					target[position++] = 203;
					targetView.setFloat64(position, Number(value));
				} else if (this.largeBigIntToString) return pack(value.toString());
				else if (this.useBigIntExtension || this.moreTypes) {
					let empty = value < 0 ? BigInt(-1) : BigInt(0);
					let array;
					if (value >> BigInt(65536) === empty) {
						let mask = BigInt(0x10000000000000000) - BigInt(1);
						let chunks = [];
						while (true) {
							chunks.push(value & mask);
							if (value >> BigInt(63) === empty) break;
							value >>= BigInt(64);
						}
						array = new Uint8Array(new BigUint64Array(chunks).buffer);
						array.reverse();
					} else {
						let invert = value < 0;
						let string = (invert ? ~value : value).toString(16);
						if (string.length % 2) string = "0" + string;
						else if (parseInt(string.charAt(0), 16) >= 8) string = "00" + string;
						if (hasNodeBuffer) array = Buffer.from(string, "hex");
						else {
							array = new Uint8Array(string.length / 2);
							for (let i = 0; i < array.length; i++) array[i] = parseInt(string.slice(i * 2, i * 2 + 2), 16);
						}
						if (invert) for (let i = 0; i < array.length; i++) array[i] = ~array[i];
					}
					if (array.length + position > safeEnd) makeRoom(array.length + position);
					position = writeExtensionData(array, target, position, 66);
					return;
				} else throw new RangeError(value + " was too large to fit in MessagePack 64-bit integer format, use useBigIntExtension, or set largeBigIntToFloat to convert to float-64, or set largeBigIntToString to convert to string");
				position += 8;
			} else if (type === "undefined") {
				if (this.encodeUndefinedAsNil) target[position++] = 192;
				else {
					target[position++] = 212;
					target[position++] = 0;
					target[position++] = 0;
				}
			} else throw new Error("Unknown type: " + type);
		};
		const writePlainObject = this.variableMapSize || this.coercibleKeyAsNumber || this.skipValues ? (object) => {
			let keys;
			if (this.skipValues) {
				keys = [];
				for (let key in object) if ((typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key)) && !this.skipValues.includes(object[key])) keys.push(key);
			} else keys = Object.keys(object);
			let length = keys.length;
			if (length < 16) target[position++] = 128 | length;
			else if (length < 65536) {
				target[position++] = 222;
				target[position++] = length >> 8;
				target[position++] = length & 255;
			} else {
				target[position++] = 223;
				targetView.setUint32(position, length);
				position += 4;
			}
			let key;
			if (this.coercibleKeyAsNumber) for (let i = 0; i < length; i++) {
				key = keys[i];
				let num = Number(key);
				pack(isNaN(num) ? key : num);
				pack(object[key]);
			}
			else for (let i = 0; i < length; i++) {
				pack(key = keys[i]);
				pack(object[key]);
			}
		} : (object) => {
			target[position++] = 222;
			let objectOffset = position - start;
			position += 2;
			let size = 0;
			for (let key in object) if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key)) {
				pack(key);
				pack(object[key]);
				size++;
			}
			if (size > 65535) throw new Error("Object is too large to serialize with fast 16-bit map size, use the \"variableMapSize\" option to serialize this object");
			target[objectOffset++ + start] = size >> 8;
			target[objectOffset + start] = size & 255;
		};
		const writeRecord = this.useRecords === false ? writePlainObject : options.progressiveRecords && !useTwoByteRecords ? (object) => {
			let nextTransition, transition = structures.transitions || (structures.transitions = Object.create(null));
			let objectOffset = position++ - start;
			let wroteKeys;
			for (let key in object) if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key)) {
				nextTransition = transition[key];
				if (nextTransition) transition = nextTransition;
				else {
					let keys = Object.keys(object);
					let lastTransition = transition;
					transition = structures.transitions;
					let newTransitions = 0;
					for (let i = 0, l = keys.length; i < l; i++) {
						let key = keys[i];
						nextTransition = transition[key];
						if (!nextTransition) {
							nextTransition = transition[key] = Object.create(null);
							newTransitions++;
						}
						transition = nextTransition;
					}
					if (objectOffset + start + 1 == position) {
						position--;
						newRecord(transition, keys, newTransitions);
					} else insertNewRecord(transition, keys, objectOffset, newTransitions);
					wroteKeys = true;
					transition = lastTransition[key];
				}
				pack(object[key]);
			}
			if (!wroteKeys) {
				let recordId = transition[RECORD_SYMBOL];
				if (recordId) target[objectOffset + start] = recordId;
				else insertNewRecord(transition, Object.keys(object), objectOffset, 0);
			}
		} : (object) => {
			let nextTransition, transition = structures.transitions || (structures.transitions = Object.create(null));
			let newTransitions = 0;
			for (let key in object) if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key)) {
				nextTransition = transition[key];
				if (!nextTransition) {
					nextTransition = transition[key] = Object.create(null);
					newTransitions++;
				}
				transition = nextTransition;
			}
			let recordId = transition[RECORD_SYMBOL];
			if (recordId) {
				if (recordId >= 96 && useTwoByteRecords) {
					target[position++] = ((recordId -= 96) & 31) + 96;
					target[position++] = recordId >> 5;
				} else target[position++] = recordId;
			} else newRecord(transition, transition.__keys__ || Object.keys(object), newTransitions);
			for (let key in object) if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key)) pack(object[key]);
		};
		const checkUseRecords = typeof this.useRecords == "function" && this.useRecords;
		const writeObject = checkUseRecords ? (object) => {
			checkUseRecords(object) ? writeRecord(object) : writePlainObject(object);
		} : writeRecord;
		const writeStruct = (object) => {
			let newPosition = packr._writeStruct(object, target, start, position, structures, makeRoom, (value, newPosition, notifySharedUpdate) => {
				if (notifySharedUpdate) return hasSharedUpdate = true;
				position = newPosition;
				let startTarget = target;
				pack(value);
				resetStructures();
				if (startTarget !== target) return {
					position,
					targetView,
					target
				};
				return position;
			});
			if (newPosition === 0) return writeObject(object);
			position = newPosition;
		};
		const makeRoom = (end) => {
			let newSize;
			if (end > 16777216) {
				if (end - start > MAX_BUFFER_SIZE) throw new Error("Packed buffer would be larger than maximum buffer size");
				newSize = Math.min(MAX_BUFFER_SIZE, Math.round(Math.max((end - start) * (end > 67108864 ? 1.25 : 2), 4194304) / 4096) * 4096);
			} else newSize = (Math.max(end - start << 2, target.length - 1) >> 12) + 1 << 12;
			let newBuffer = new ByteArrayAllocate(newSize);
			targetView = newBuffer.dataView || (newBuffer.dataView = new DataView(newBuffer.buffer, 0, newSize));
			end = Math.min(end, target.length);
			if (target.copy) target.copy(newBuffer, 0, start, end);
			else newBuffer.set(target.slice(start, end));
			position -= start;
			start = 0;
			safeEnd = newBuffer.length - 10;
			return target = newBuffer;
		};
		const newRecord = (transition, keys, newTransitions) => {
			let recordId = structures.nextId;
			if (!recordId) recordId = 64;
			if (recordId < sharedLimitId && this.shouldShareStructure && !this.shouldShareStructure(keys)) {
				recordId = structures.nextOwnId;
				if (!(recordId < maxStructureId)) recordId = sharedLimitId;
				structures.nextOwnId = recordId + 1;
			} else {
				if (recordId >= maxStructureId) recordId = sharedLimitId;
				structures.nextId = recordId + 1;
			}
			let highByte = keys.highByte = recordId >= 96 && useTwoByteRecords ? recordId - 96 >> 5 : -1;
			transition[RECORD_SYMBOL] = recordId;
			transition.__keys__ = keys;
			structures[recordId - 64] = keys;
			if (recordId < sharedLimitId) {
				keys.isShared = true;
				structures.sharedLength = recordId - 63;
				hasSharedUpdate = true;
				if (highByte >= 0) {
					target[position++] = (recordId & 31) + 96;
					target[position++] = highByte;
				} else target[position++] = recordId;
			} else {
				if (highByte >= 0) {
					target[position++] = 213;
					target[position++] = 114;
					target[position++] = (recordId & 31) + 96;
					target[position++] = highByte;
				} else {
					target[position++] = 212;
					target[position++] = 114;
					target[position++] = recordId;
				}
				if (newTransitions) transitionsCount += serializationsSinceTransitionRebuild * newTransitions;
				if (recordIdsToRemove.length >= maxOwnStructures) recordIdsToRemove.shift()[RECORD_SYMBOL] = 0;
				recordIdsToRemove.push(transition);
				pack(keys);
			}
		};
		const insertNewRecord = (transition, keys, insertionOffset, newTransitions) => {
			let mainTarget = target;
			let mainPosition = position;
			let mainSafeEnd = safeEnd;
			let mainStart = start;
			target = keysTarget;
			position = 0;
			start = 0;
			if (!target) keysTarget = target = new ByteArrayAllocate(8192);
			safeEnd = target.length - 10;
			newRecord(transition, keys, newTransitions);
			keysTarget = target;
			let keysPosition = position;
			target = mainTarget;
			position = mainPosition;
			safeEnd = mainSafeEnd;
			start = mainStart;
			if (keysPosition > 1) {
				let newEnd = position + keysPosition - 1;
				if (newEnd > safeEnd) makeRoom(newEnd);
				let insertionPosition = insertionOffset + start;
				target.copyWithin(insertionPosition + keysPosition, insertionPosition + 1, position);
				target.set(keysTarget.slice(0, keysPosition), insertionPosition);
				position = newEnd;
			} else target[insertionOffset + start] = keysTarget[0];
		};
	}
	useBuffer(buffer) {
		target = buffer;
		target.dataView || (target.dataView = new DataView(target.buffer, target.byteOffset, target.byteLength));
		targetView = target.dataView;
		position = 0;
	}
	set position(value) {
		position = value;
	}
	get position() {
		return position;
	}
	clearSharedData() {
		if (this.structures) this.structures = [];
		if (this.typedStructs) this.typedStructs = [];
	}
};
extensionClasses = [
	Date,
	Set,
	Error,
	RegExp,
	ArrayBuffer,
	Object.getPrototypeOf(Uint8Array.prototype).constructor,
	DataView,
	C1Type
];
extensions = [
	{ pack(date, allocateForWrite, pack) {
		let seconds = date.getTime() / 1e3;
		if ((this.useTimestamp32 || date.getMilliseconds() === 0) && seconds >= 0 && seconds < 4294967296) {
			let { target, targetView, position } = allocateForWrite(6);
			target[position++] = 214;
			target[position++] = 255;
			targetView.setUint32(position, seconds);
		} else if (seconds > 0 && seconds < 4294967296) {
			let { target, targetView, position } = allocateForWrite(10);
			target[position++] = 215;
			target[position++] = 255;
			targetView.setUint32(position, date.getMilliseconds() * 4e6 + (seconds / 1e3 / 4294967296 >> 0));
			targetView.setUint32(position + 4, seconds);
		} else if (isNaN(seconds)) {
			if (this.onInvalidDate) {
				allocateForWrite(0);
				return pack(this.onInvalidDate());
			}
			let { target, targetView, position } = allocateForWrite(3);
			target[position++] = 212;
			target[position++] = 255;
			target[position++] = 255;
		} else {
			let { target, targetView, position } = allocateForWrite(15);
			target[position++] = 199;
			target[position++] = 12;
			target[position++] = 255;
			targetView.setUint32(position, date.getMilliseconds() * 1e6);
			targetView.setBigInt64(position + 4, BigInt(Math.floor(seconds)));
		}
	} },
	{ pack(set, allocateForWrite, pack) {
		if (this.setAsEmptyObject) {
			allocateForWrite(0);
			return pack({});
		}
		let array = Array.from(set);
		let { target, position } = allocateForWrite(this.moreTypes ? 3 : 0);
		if (this.moreTypes) {
			target[position++] = 212;
			target[position++] = 115;
			target[position++] = 0;
		}
		pack(array);
	} },
	{ pack(error, allocateForWrite, pack) {
		let { target, position } = allocateForWrite(this.moreTypes ? 3 : 0);
		if (this.moreTypes) {
			target[position++] = 212;
			target[position++] = 101;
			target[position++] = 0;
		}
		pack([
			error.name,
			error.message,
			error.cause
		]);
	} },
	{ pack(regex, allocateForWrite, pack) {
		let { target, position } = allocateForWrite(this.moreTypes ? 3 : 0);
		if (this.moreTypes) {
			target[position++] = 212;
			target[position++] = 120;
			target[position++] = 0;
		}
		pack([regex.source, regex.flags]);
	} },
	{ pack(arrayBuffer, allocateForWrite) {
		if (this.moreTypes) writeExtBuffer(arrayBuffer, 16, allocateForWrite);
		else writeBuffer(hasNodeBuffer ? Buffer.from(arrayBuffer) : new Uint8Array(arrayBuffer), allocateForWrite);
	} },
	{ pack(typedArray, allocateForWrite) {
		let constructor = typedArray.constructor;
		if (constructor !== ByteArray && this.moreTypes) writeExtBuffer(typedArray, typedArrays.indexOf(constructor.name), allocateForWrite);
		else writeBuffer(typedArray, allocateForWrite);
	} },
	{ pack(arrayBuffer, allocateForWrite) {
		if (this.moreTypes) writeExtBuffer(arrayBuffer, 17, allocateForWrite);
		else writeBuffer(hasNodeBuffer ? Buffer.from(arrayBuffer) : new Uint8Array(arrayBuffer), allocateForWrite);
	} },
	{ pack(c1, allocateForWrite) {
		let { target, position } = allocateForWrite(1);
		target[position] = 193;
	} }
];
function writeExtBuffer(typedArray, type, allocateForWrite, encode) {
	let length = typedArray.byteLength;
	if (length + 1 < 256) {
		var { target, position } = allocateForWrite(4 + length);
		target[position++] = 199;
		target[position++] = length + 1;
	} else if (length + 1 < 65536) {
		var { target, position } = allocateForWrite(5 + length);
		target[position++] = 200;
		target[position++] = length + 1 >> 8;
		target[position++] = length + 1 & 255;
	} else {
		var { target, position, targetView } = allocateForWrite(7 + length);
		target[position++] = 201;
		targetView.setUint32(position, length + 1);
		position += 4;
	}
	target[position++] = 116;
	target[position++] = type;
	if (!typedArray.buffer) typedArray = new Uint8Array(typedArray);
	target.set(new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength), position);
}
function writeBuffer(buffer, allocateForWrite) {
	let length = buffer.byteLength;
	var target, position;
	if (length < 256) {
		var { target, position } = allocateForWrite(length + 2);
		target[position++] = 196;
		target[position++] = length;
	} else if (length < 65536) {
		var { target, position } = allocateForWrite(length + 3);
		target[position++] = 197;
		target[position++] = length >> 8;
		target[position++] = length & 255;
	} else {
		var { target, position, targetView } = allocateForWrite(length + 5);
		target[position++] = 198;
		targetView.setUint32(position, length);
		position += 4;
	}
	target.set(buffer, position);
}
function writeExtensionData(result, target, position, type) {
	let length = result.length;
	switch (length) {
		case 1:
			target[position++] = 212;
			break;
		case 2:
			target[position++] = 213;
			break;
		case 4:
			target[position++] = 214;
			break;
		case 8:
			target[position++] = 215;
			break;
		case 16:
			target[position++] = 216;
			break;
		default: if (length < 256) {
			target[position++] = 199;
			target[position++] = length;
		} else if (length < 65536) {
			target[position++] = 200;
			target[position++] = length >> 8;
			target[position++] = length & 255;
		} else {
			target[position++] = 201;
			target[position++] = length >> 24;
			target[position++] = length >> 16 & 255;
			target[position++] = length >> 8 & 255;
			target[position++] = length & 255;
		}
	}
	target[position++] = type;
	target.set(result, position);
	position += length;
	return position;
}
function insertIds(serialized, idsToInsert) {
	let nextId;
	let distanceToMove = idsToInsert.length * 6;
	let lastEnd = serialized.length - distanceToMove;
	while (nextId = idsToInsert.pop()) {
		let offset = nextId.offset;
		let id = nextId.id;
		serialized.copyWithin(offset + distanceToMove, offset, lastEnd);
		distanceToMove -= 6;
		let position = offset + distanceToMove;
		serialized[position++] = 214;
		serialized[position++] = 105;
		serialized[position++] = id >> 24;
		serialized[position++] = id >> 16 & 255;
		serialized[position++] = id >> 8 & 255;
		serialized[position++] = id & 255;
		lastEnd = offset;
	}
	return serialized;
}
function writeBundles(start, pack, incrementPosition) {
	if (bundledStrings.length > 0) {
		targetView.setUint32(bundledStrings.position + start, position + incrementPosition - bundledStrings.position - start);
		bundledStrings.stringsPosition = position - start;
		let writeStrings = bundledStrings;
		bundledStrings = null;
		pack(writeStrings[0]);
		pack(writeStrings[1]);
	}
}
function prepareStructures(structures, packr) {
	structures.isCompatible = (existingStructures) => {
		let compatible = !existingStructures || (packr.lastNamedStructuresLength || 0) === existingStructures.length;
		if (!compatible) packr._mergeStructures(existingStructures);
		return compatible;
	};
	return structures;
}
Packr.SUPPORTS_STRUCT_HOOKS = true;
var defaultPackr = new Packr({ useRecords: false });
defaultPackr.pack;
defaultPackr.pack;
var { NEVER, ALWAYS, DECIMAL_ROUND, DECIMAL_FIT } = FLOAT32_OPTIONS;
//#endregion
//#region ../../node_modules/.bun/msgpackr@2.1.0/node_modules/msgpackr/node-index.js
if (!(process.env.MSGPACKR_NATIVE_ACCELERATION_DISABLED !== void 0 && process.env.MSGPACKR_NATIVE_ACCELERATION_DISABLED.toLowerCase() === "true")) {
	let extractor;
	try {
		if (typeof __require == "function") extractor = __require("msgpackr-extract");
		else extractor = createRequire(import.meta.url)("msgpackr-extract");
		if (extractor) setExtractor(extractor.extractStrings);
	} catch (error) {}
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/encoding/Sse.js
var SseErrorTypeId = "~effect/encoding/Sse/SseError";
/**
* Error reason raised when pending Server-Sent Events state exceeds the
* configured maximum size.
*
* @category errors
* @since 4.0.0
*/
var EventTooLarge = class extends (/*#__PURE__*/ TaggedError("EventTooLarge")) {
	get message() {
		return `Pending SSE event exceeded the maximum size of ${this.maxEventSize}`;
	}
};
/**
* Error raised when decoding a Server-Sent Events stream fails.
*
* @category errors
* @since 4.0.0
*/
var SseError = class extends (/*#__PURE__*/ TaggedError("SseError")) {
	/**
	* Marks this value as an SSE decoding error.
	*
	* @since 4.0.0
	*/
	[SseErrorTypeId] = SseErrorTypeId;
	/**
	* Delegates the public message to the underlying SSE error reason.
	*
	* @since 4.0.0
	*/
	get message() {
		return this.reason.message;
	}
};
var defaultMaxEventSize = 10485760;
/**
* Creates a channel that parses Server-Sent Events text chunks into `Event` values.
*
* **Details**
*
* SSE `retry` directives are emitted as `Retry` failures so callers can
* reconnect with the requested delay.
*
* @category decoding
* @since 4.0.0
*/
var decode = (options) => fromTransform((upstream, _scope) => sync$1(() => {
	let buffer = [];
	let retry;
	const parser = makeParser((event) => {
		if (event._tag === "Retry") retry = event;
		else buffer.push(event);
	}, options);
	const pump = flatMap(upstream, (arr) => {
		for (let i = 0; i < arr.length; i++) {
			const error = parser.feed(arr[i]);
			if (error !== void 0) return fail(error);
		}
		return void_;
	});
	return suspend(function loop() {
		if (isArrayNonEmpty(buffer)) {
			const out = buffer;
			buffer = [];
			return succeed(out);
		} else if (retry) return fail(retry);
		return flatMap(pump, loop);
	});
}));
/**
* Creates a stateful Server-Sent Events parser.
*
* **Details**
*
* Call `feed` with text chunks to parse `Event` and `Retry` values through the
* callback, and call `reset` to clear any buffered event state. `feed` returns
* an `SseError` if the pending event exceeds `maxEventSize`.
*
* @category decoding
* @since 4.0.0
*/
function makeParser(onParse, options) {
	const maxEventSize = options?.maxEventSize ?? defaultMaxEventSize;
	let isFirstChunk;
	let buffer;
	let startingPosition;
	let startingFieldLength;
	let discardTrailingNewline;
	let lastEventId;
	let eventName;
	let data;
	reset();
	return {
		feed,
		reset
	};
	function reset() {
		isFirstChunk = true;
		buffer = "";
		startingPosition = 0;
		startingFieldLength = -1;
		discardTrailingNewline = false;
		lastEventId = void 0;
		eventName = void 0;
		data = "";
	}
	function feed(chunk) {
		buffer = buffer ? buffer + chunk : chunk;
		if (isFirstChunk && buffer.startsWith(BOM)) buffer = buffer.slice(BOM.length);
		isFirstChunk = false;
		const length = buffer.length;
		let position = 0;
		while (position < length) {
			if (discardTrailingNewline) {
				if (buffer[position] === "\n") ++position;
				discardTrailingNewline = false;
			}
			let lineLength = -1;
			let fieldLength = startingFieldLength;
			let character;
			for (let index = startingPosition; lineLength < 0 && index < length; ++index) {
				character = buffer[index];
				if (character === ":" && fieldLength < 0) fieldLength = index - position;
				else if (character === "\r") {
					discardTrailingNewline = true;
					lineLength = index - position;
				} else if (character === "\n") lineLength = index - position;
			}
			if (lineLength < 0) {
				startingPosition = length - position;
				startingFieldLength = fieldLength;
				break;
			} else {
				startingPosition = 0;
				startingFieldLength = -1;
			}
			parseEventStreamLine(buffer, position, fieldLength, lineLength);
			position += lineLength + 1;
		}
		if (position === length) buffer = "";
		else if (position > 0) buffer = buffer.slice(position);
		if (buffer.length + data.length > maxEventSize) {
			const error = new SseError({ reason: new EventTooLarge({ maxEventSize }) });
			reset();
			return error;
		}
	}
	function parseEventStreamLine(lineBuffer, index, fieldLength, lineLength) {
		if (lineLength === 0) {
			if (data.length > 0) {
				onParse({
					_tag: "Event",
					id: lastEventId,
					event: eventName || "message",
					data: data.slice(0, -1)
				});
				data = "";
			}
			eventName = void 0;
			return;
		}
		const noValue = fieldLength < 0;
		const field = lineBuffer.slice(index, index + (noValue ? lineLength : fieldLength));
		let step = 0;
		if (noValue) step = lineLength;
		else if (lineBuffer[index + fieldLength + 1] === " ") step = fieldLength + 2;
		else step = fieldLength + 1;
		const position = index + step;
		const valueLength = lineLength - step;
		const value = lineBuffer.slice(position, position + valueLength).toString();
		if (field === "data") data += value ? `${value}\n` : "\n";
		else if (field === "event") eventName = value;
		else if (field === "id" && !value.includes("\0")) lastEventId = value;
		else if (field === "retry" && /^\d+$/.test(value)) onParse(new Retry({
			duration: millis(parseInt(value, 10)),
			lastEventId
		}));
	}
}
var BOM = "﻿";
var RetryTypeId = "~effect/encoding/Sse/Retry";
/**
* Represents a Server-Sent Events retry directive.
*
* **Details**
*
* Decoders surface this value as a failure to request reconnection after
* `duration`; encoders serialize an upstream `Retry` failure as a `retry:` line.
*
* @category models
* @since 4.0.0
*/
var Retry = class Retry extends (/*#__PURE__*/ TaggedClass("Retry")) {
	/**
	* Marks this value as an SSE retry directive for runtime guards.
	*
	* @since 4.0.0
	*/
	[RetryTypeId] = RetryTypeId;
	/**
	* Returns `true` when the value is an SSE retry directive.
	*
	* @since 4.0.0
	*/
	static is(u) {
		return hasProperty(u, RetryTypeId);
	}
	/**
	* Separates SSE retry directives from regular event values.
	*
	* @since 4.0.0
	*/
	static filter(u) {
		return Retry.is(u) ? succeed$1(u) : fail$1(u);
	}
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/http/FetchHttpClient.js
/**
* Fetch-based implementation of the Effect HTTP client service.
*
* This module provides an `HttpClient` layer that executes requests through a
* Web Fetch API implementation. It is the transport to use in browsers, edge
* runtimes, and Node.js environments where `globalThis.fetch` is available, or
* anywhere a compatible fetch function can be supplied.
*
* @since 4.0.0
*/
/**
* Context reference for the `fetch` implementation used by the fetch-based HTTP client.
*
* **Details**
*
* Defaults to `globalThis.fetch`.
*
* @category services
* @since 4.0.0
*/
var Fetch = /*#__PURE__*/ Reference("effect/http/FetchHttpClient/Fetch", { defaultValue: () => globalThis.fetch });
/**
* Service that contains default fetch options for the fetch-based HTTP client.
*
* **When to use**
*
* Use to provide default credentials, cache, redirect, integrity, or other
* fetch options for outgoing HTTP requests.
*
* **Details**
*
* Request-specific method, headers, body, and abort signal are supplied by the client when a request is executed.
*
* @category services
* @since 4.0.0
*/
var RequestInit = class extends (/*#__PURE__*/ Service()("effect/http/FetchHttpClient/RequestInit")) {};
/**
* Layer that provides an `HttpClient` implementation backed by the configured
* `Fetch` function.
*
* **When to use**
*
* Use when an Effect program should execute `HttpClient` requests through the
* platform `fetch` implementation, especially in browser, edge, or Node.js
* runtimes with `globalThis.fetch`.
*
* **Details**
*
* The layer uses the current `Fetch` reference and optional `RequestInit`
* service for each request. Request-specific method, headers, body, and abort
* signal are supplied by the client and override matching `RequestInit` fields.
*
* **Gotchas**
*
* Fetch behavior comes from the runtime's implementation, so CORS, cookies,
* redirects, abort handling, and streaming support can vary by platform. Stream
* request bodies are sent as Web streams with `duplex: "half"`, and any
* `content-length` header is removed before calling `fetch`.
*
* @see {@link Fetch} for supplying the fetch implementation used by this layer
* @see {@link RequestInit} for default `RequestInit` options applied before request-specific fields
*
* @category layers
* @since 4.0.0
*/
var layer = /*#__PURE__*/ layerMergedContext(/*#__PURE__*/ succeed(/* @__PURE__ */ make$3((request, url, signal, fiber) => {
	const fetch = fiber.getRef(Fetch);
	const options = getOrUndefined$1(fiber.context, RequestInit) ?? {};
	let headers = options.headers ? merge(fromInput$1(options.headers), request.headers) : request.headers;
	if (headers["content-length"]) headers = remove(headers, "content-length");
	const send = (body) => map(tryPromise({
		try: () => fetch(url, {
			...options,
			method: request.method,
			headers,
			body,
			duplex: request.body._tag === "Stream" ? "half" : void 0,
			signal
		}),
		catch: (cause) => new HttpClientError({ reason: new TransportError({
			request,
			cause
		}) })
	}), (response) => fromWeb(request, response));
	switch (request.body._tag) {
		case "Raw":
		case "Uint8Array": return send(request.body.body);
		case "FormData": return send(request.body.formData);
		case "Stream": return flatMap(toReadableStreamEffect(request.body.stream), send);
	}
	return send(void 0);
})));
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/workers/WorkerError.js
var TypeId$2 = "~effect/workers/WorkerError";
/**
* Worker error reason for failures while spawning or setting up a worker.
*
* @category errors
* @since 4.0.0
*/
var WorkerSpawnError = class extends (/*#__PURE__*/ Error$2("effect/workers/WorkerError/WorkerSpawnError")({
	_tag: /*#__PURE__*/ tag("WorkerSpawnError"),
	message: String$1,
	cause: /*#__PURE__*/ optional(/*#__PURE__*/ Defect())
})) {};
/**
* Worker error reason for failures while sending a message to a worker.
*
* @category errors
* @since 4.0.0
*/
var WorkerSendError = class extends (/*#__PURE__*/ Error$2("effect/workers/WorkerError/WorkerSendError")({
	_tag: /*#__PURE__*/ tag("WorkerSendError"),
	message: String$1,
	cause: /*#__PURE__*/ optional(/*#__PURE__*/ Defect())
})) {};
/**
* Worker error reason for failures while receiving or handling a message from a
* worker.
*
* @category errors
* @since 4.0.0
*/
var WorkerReceiveError = class extends (/*#__PURE__*/ Error$2("effect/workers/WorkerError/WorkerReceiveError")({
	_tag: /*#__PURE__*/ tag("WorkerReceiveError"),
	message: String$1,
	cause: /*#__PURE__*/ optional(/*#__PURE__*/ Defect())
})) {};
/**
* Worker error reason for an unclassified worker failure.
*
* @category errors
* @since 4.0.0
*/
var WorkerUnknownError = class extends (/*#__PURE__*/ Error$2("effect/workers/WorkerError/WorkerUnknownError")({
	_tag: /*#__PURE__*/ tag("WorkerUnknownError"),
	message: String$1,
	cause: /*#__PURE__*/ optional(/*#__PURE__*/ Defect())
})) {};
/**
* Schema for decoding and encoding all supported worker error reason variants.
*
* @category schemas
* @since 4.0.0
*/
var WorkerErrorReason = /*#__PURE__*/ Union([
	WorkerSpawnError,
	WorkerSendError,
	WorkerReceiveError,
	WorkerUnknownError
]);
/**
* Error raised by worker APIs, wrapping a specific `WorkerErrorReason` and
* exposing its message and cause.
*
* @category errors
* @since 4.0.0
*/
var WorkerError = class extends (/*#__PURE__*/ Error$2(TypeId$2)({
	_tag: /*#__PURE__*/ tag("WorkerError"),
	reason: WorkerErrorReason
})) {
	constructor(props) {
		super({
			...props,
			cause: props.reason.cause
		});
	}
	/**
	* Marks this value as a worker error for runtime guards.
	*
	* @since 4.0.0
	*/
	[TypeId$2] = TypeId$2;
	get message() {
		return this.reason.message;
	}
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/workers/Worker.js
/**
* Client-side worker primitives shared by browser, Node, and Bun adapters.
*
* This module defines the platform-neutral `Worker` client, the `WorkerPlatform`
* service that creates workers by numeric id, and the `Spawner` service used to
* find platform-specific worker instances. `makePlatform` wraps platform setup
* and listen hooks into a `WorkerPlatform`, buffers outgoing messages until the
* worker is ready, runs incoming messages with Effect handlers, and ties worker
* cleanup to scope lifetime.
*
* @since 4.0.0
*/
/**
* Service that spawns effect `Worker` instances for numeric worker ids using
* the configured `Spawner`.
*
* @category services
* @since 4.0.0
*/
var WorkerPlatform = class extends (/*#__PURE__*/ Service()("effect/workers/Worker/WorkerPlatform")) {};
/**
* Service tag for the worker `SpawnerFn`.
*
* @category services
* @since 4.0.0
*/
var Spawner = /*#__PURE__*/ Service("effect/workers/Worker/Spawner");
/**
* Creates a layer that provides a worker `Spawner` service from a `SpawnerFn`.
*
* @category layers
* @since 4.0.0
*/
var layerSpawner = /*#__PURE__*/ succeed$2(Spawner);
/**
* Creates a `WorkerPlatform` from platform-specific setup and listen hooks,
* buffering sent messages until the worker is ready and scoping port cleanup to
* the worker run.
*
* @category constructors
* @since 4.0.0
*/
var makePlatform = () => (options) => WorkerPlatform.of({ spawn(id) {
	return gen(function* () {
		const spawn = yield* Spawner;
		let currentPort;
		const buffer = [];
		const sendToPort = (port, message, transfers) => try_$1({
			try: () => port.postMessage([0, message], transfers),
			catch: (cause) => new WorkerError({ reason: new WorkerSendError({
				message: "Failed to send message to worker",
				cause
			}) })
		});
		const run = (handler, opts) => uninterruptibleMask((restore) => scopedWith(fnUntraced(function* (scope) {
			const port = yield* options.setup({
				worker: spawn(id),
				scope
			});
			yield* addFinalizer(scope, sync$1(() => {
				currentPort = void 0;
			}));
			const fiberSet = yield* make$11().pipe(provide(scope));
			const run = yield* runtime(fiberSet)();
			const ready = makeUnsafe$5();
			yield* options.listen({
				port,
				scope,
				emit(data) {
					if (data[0] === 0) {
						if (opts?.onSpawn) run(ensuring(opts.onSpawn, ready.open));
						else ready.openUnsafe();
						return;
					}
					run(handler(data[1]));
				},
				deferred: fiberSet.deferred
			});
			yield* ready.await;
			currentPort = port;
			if (buffer.length > 0) {
				for (const [message, transfers] of buffer) yield* sendToPort(port, message, transfers);
				buffer.length = 0;
			}
			return yield* restore(join(fiberSet));
		})));
		const send = (message, transfers) => suspend(() => {
			if (currentPort === void 0) {
				buffer.push([message, transfers]);
				return void_;
			}
			return sendToPort(currentPort, message, transfers);
		});
		return {
			run,
			send
		};
	});
} });
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/rpc/RpcSchema.js
/**
* RPC schema markers and interruption annotations.
*
* This module contains the small pieces of schema metadata that the RPC
* declaration, client, server, cluster, and reactivity layers share. It marks
* streamed responses and annotates interruptions that came from a remote client
* closing or cancelling a request.
*
* @since 4.0.0
*/
var StreamSchemaTypeId = "~effect/rpc/RpcSchema/StreamSchema";
/**
* Returns `true` when a schema is an RPC stream schema created by
* `RpcSchema.Stream`.
*
* @category guards
* @since 4.0.0
*/
function isStreamSchema(schema) {
	return hasProperty(schema, StreamSchemaTypeId);
}
/** @internal */
function getStreamSchemas(schema) {
	return isStreamSchema(schema) ? some({
		success: schema.success,
		error: schema.error
	}) : none();
}
var schema = /*#__PURE__*/ declare(isStream);
/**
* Creates an RPC stream schema from a stream element success schema and stream
* error schema.
*
* @category constructors
* @since 4.0.0
*/
function Stream(success, error) {
	return make$16(schema.ast, {
		[StreamSchemaTypeId]: StreamSchemaTypeId,
		success,
		error
	});
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/rpc/Rpc.js
var TypeId$1 = "~effect/rpc/Rpc";
var Proto = {
	[TypeId$1]: TypeId$1,
	pipe() {
		return pipeArguments(this, arguments);
	},
	setSuccess(successSchema) {
		return makeProto$1({
			_tag: this._tag,
			payloadSchema: this.payloadSchema,
			successSchema,
			errorSchema: this.errorSchema,
			defectSchema: this.defectSchema,
			annotations: this.annotations,
			middlewares: this.middlewares
		});
	},
	setError(errorSchema) {
		return makeProto$1({
			_tag: this._tag,
			payloadSchema: this.payloadSchema,
			successSchema: this.successSchema,
			errorSchema,
			defectSchema: this.defectSchema,
			annotations: this.annotations,
			middlewares: this.middlewares
		});
	},
	setPayload(payloadSchema) {
		return makeProto$1({
			_tag: this._tag,
			payloadSchema: isSchema(payloadSchema) ? payloadSchema : Struct(payloadSchema),
			successSchema: this.successSchema,
			errorSchema: this.errorSchema,
			defectSchema: this.defectSchema,
			annotations: this.annotations,
			middlewares: this.middlewares
		});
	},
	middleware(middleware) {
		return makeProto$1({
			_tag: this._tag,
			payloadSchema: this.payloadSchema,
			successSchema: this.successSchema,
			errorSchema: this.errorSchema,
			defectSchema: this.defectSchema,
			annotations: this.annotations,
			middlewares: /* @__PURE__ */ new Set([...this.middlewares, middleware])
		});
	},
	prefix(prefix) {
		return makeProto$1({
			_tag: `${prefix}${this._tag}`,
			payloadSchema: this.payloadSchema,
			successSchema: this.successSchema,
			errorSchema: this.errorSchema,
			defectSchema: this.defectSchema,
			annotations: this.annotations,
			middlewares: this.middlewares
		});
	},
	annotate(tag, value) {
		return makeProto$1({
			_tag: this._tag,
			payloadSchema: this.payloadSchema,
			successSchema: this.successSchema,
			errorSchema: this.errorSchema,
			defectSchema: this.defectSchema,
			middlewares: this.middlewares,
			annotations: add(this.annotations, tag, value)
		});
	},
	annotateMerge(context) {
		return makeProto$1({
			_tag: this._tag,
			payloadSchema: this.payloadSchema,
			successSchema: this.successSchema,
			errorSchema: this.errorSchema,
			defectSchema: this.defectSchema,
			middlewares: this.middlewares,
			annotations: merge$1(this.annotations, context)
		});
	}
};
var makeProto$1 = (options) => {
	function Rpc() {}
	Object.setPrototypeOf(Rpc, Proto);
	Object.assign(Rpc, options);
	Rpc.key = `effect/rpc/Rpc/${options._tag}`;
	return Rpc;
};
/**
* Creates an RPC definition with the supplied tag and optional schemas.
*
* **Details**
*
* Payload options can be either a schema or struct fields. `stream: true` wraps
* the success and error schemas in a stream schema and sets the normal error
* schema to `Schema.Never`. `primaryKey` creates a payload class with a
* primary key derived from the payload value.
*
* @category constructors
* @since 4.0.0
*/
var make$2 = (tag, options) => {
	const successSchema = options?.success ?? Void;
	const errorSchema = options?.error ?? Never;
	const defectSchema = options?.defect ?? Defect();
	let payloadSchema;
	if (options?.primaryKey) payloadSchema = class Payload extends Class$1(`effect/rpc/Rpc/${tag}`)(options.payload) {
		[symbol]() {
			return options.primaryKey(this);
		}
	};
	else payloadSchema = isSchema(options?.payload) ? options?.payload : options?.payload ? Struct(options?.payload) : Void;
	return makeProto$1({
		_tag: tag,
		payloadSchema,
		successSchema: options?.stream ? Stream(successSchema, errorSchema) : successSchema,
		errorSchema: options?.stream ? Never : errorSchema,
		defectSchema,
		annotations: empty$5(),
		middlewares: /* @__PURE__ */ new Set()
	});
};
var exitSchemaCache = /*#__PURE__*/ new WeakMap();
/**
* Builds the `Schema.Exit` used to encode and decode RPC results.
*
* **Details**
*
* The failure side includes the RPC error schema, middleware error schemas, and
* stream error schema for streaming RPCs. Streaming RPCs use `Schema.Void` for
* the exit success value. The schema is cached per RPC definition.
*
* @category constructors
* @since 4.0.0
*/
var exitSchema = (self) => {
	if (exitSchemaCache.has(self)) return exitSchemaCache.get(self);
	const rpc = self;
	const failures = /* @__PURE__ */ new Set([rpc.errorSchema]);
	const streamSchemas = getStreamSchemas(rpc.successSchema);
	if (isSome(streamSchemas)) failures.add(streamSchemas.value.error);
	for (const middleware of rpc.middlewares) failures.add(middleware.error);
	const schema = Exit(isSome(streamSchemas) ? Void : rpc.successSchema, Union([...failures]), rpc.defectSchema);
	exitSchemaCache.set(self, schema);
	return schema;
};
var WrapperTypeId = "~effect/rpc/Rpc/Wrapper";
/**
* Returns `true` when the value is an RPC `Wrapper`.
*
* @category guards
* @since 4.0.0
*/
var isWrapper = (u) => WrapperTypeId in u;
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/rpc/RpcClientError.js
/**
* Client-side protocol failures reported by unstable RPC transports.
*
* `RpcClientError` is the error type generated clients use when a call fails
* before a remote handler can return its declared typed error. Its `reason`
* covers built-in transport failures from HTTP, sockets, and workers, plus
* `RpcClientDefect` values for malformed or incompatible protocol data.
*
* @since 4.0.0
*/
var TypeId = "~effect/rpc/RpcClientError";
/**
* Represents a client-side RPC defect, such as a protocol violation or
* decoding failure, with a message and original cause.
*
* @category errors
* @since 4.0.0
*/
var RpcClientDefect = class extends (/*#__PURE__*/ Error$2("effect/rpc/RpcClientError/RpcClientDefect")({
	_tag: /*#__PURE__*/ tag("RpcClientDefect"),
	message: String$1,
	cause: /*#__PURE__*/ Defect()
})) {};
/**
* Error wrapper for RPC client failures, including worker, socket, HTTP client,
* and client protocol defect failures.
*
* @category errors
* @since 4.0.0
*/
var RpcClientError = class extends (/*#__PURE__*/ Error$2(TypeId)({
	_tag: /*#__PURE__*/ tag("RpcClientError"),
	reason: /*#__PURE__*/ Union([
		WorkerErrorReason,
		SocketErrorReason,
		HttpClientErrorSchema,
		RpcClientDefect
	])
})) {
	/**
	* Marks this value as an RPC client error for runtime guards.
	*
	* @since 4.0.0
	*/
	[TypeId] = TypeId;
	get message() {
		return `${this.reason._tag}: ${this.reason.message}`;
	}
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/rpc/RpcMessage.js
/**
* Converts a bigint or string request id into the branded `RequestId` type.
*
* @category constructors
* @since 4.0.0
*/
var RequestId = (id) => id;
/**
* Represents the reusable `Ping` message value.
*
* @category constants
* @since 4.0.0
*/
var constPing = { _tag: "Ping" };
/**
* Checks if the response type is terminal.
*
* @category guards
* @since 4.0.0
*/
var isTerminalResponse = (response) => {
	switch (response._tag) {
		case "Exit":
		case "Defect":
		case "ClientProtocolError": return true;
		default: return false;
	}
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/rpc/RpcSerialization.js
/**
* Service that describes how RPC protocol messages are encoded and decoded,
* including the content type and whether the serialization format provides
* message framing.
*
* **When to use**
*
* Use to provide the serialization boundary shared by RPC clients and servers
* for a chosen wire format.
*
* @category services
* @since 4.0.0
*/
var RpcSerialization = class extends (/*#__PURE__*/ Service()("effect/rpc/RpcSerialization")) {};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/rpc/RpcWorker.js
/**
* Context service that supplies the initial RPC worker message as encoded data
* paired with any transferables that should be posted with it.
*
* @category services
* @since 4.0.0
*/
var InitialMessage = class extends (/*#__PURE__*/ Service()("effect/rpc/RpcWorker/InitialMessage")) {};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/rpc/Utils.js
/**
* Builds an RPC client protocol service that tracks active client IDs and
* buffers server responses per client until that client's `run` handler is
* installed.
*
* @category services
* @since 4.0.0
*/
var withRunClient = (f) => suspend(() => {
	const clientIds = /* @__PURE__ */ new Set();
	const clientBuffers = /* @__PURE__ */ new Map();
	const clientWrites = /* @__PURE__ */ new Map();
	let write = (clientId, data) => contextWith((context) => {
		let buffer = clientBuffers.get(clientId);
		if (!buffer) {
			buffer = [];
			clientBuffers.set(clientId, buffer);
		}
		buffer.push([data, context]);
		return void_;
	});
	return map(f((clientId, data) => {
		const clientWrite = clientWrites.get(clientId);
		if (clientWrite) return clientWrite(data);
		return write(clientId, data);
	}, clientIds), (a) => ({
		...a,
		run(clientId, f) {
			return gen(function* () {
				clientIds.add(clientId);
				clientWrites.set(clientId, f);
				const buffer = clientBuffers.get(clientId);
				if (buffer) {
					clientBuffers.delete(clientId);
					for (const [args, context] of buffer) yield* provideContext(suspend(() => f(args)), context);
				}
				return yield* onExit(never, () => {
					clientIds.delete(clientId);
					clientWrites.delete(clientId);
					return void_;
				});
			});
		}
	}));
});
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/rpc/RpcClient.js
var RpcClient_exports = /* @__PURE__ */ __exportAll({
	ConnectionHooks: () => ConnectionHooks,
	CurrentHeaders: () => CurrentHeaders,
	Protocol: () => Protocol,
	layerProtocolHttp: () => layerProtocolHttp,
	layerProtocolSocket: () => layerProtocolSocket,
	layerProtocolWorker: () => layerProtocolWorker,
	make: () => make$1,
	makeNoSerialization: () => makeNoSerialization,
	makeProtocolHttp: () => makeProtocolHttp,
	makeProtocolSocket: () => makeProtocolSocket,
	makeProtocolWorker: () => makeProtocolWorker,
	withHeaders: () => withHeaders
});
var isRpcClientError = (u) => isTagged(u, "RpcClientError");
var requestIdCounter = 0;
/**
* Creates an RPC client for an already-decoded message channel, returning the
* client API together with a `write` function for delivering server messages
* back to the client.
*
* @category constructors
* @since 4.0.0
*/
var makeNoSerialization = /*#__PURE__*/ fnUntraced(function* (group, options) {
	const spanPrefix = options?.spanPrefix ?? "RpcClient";
	const supportsAck = options?.supportsAck ?? true;
	const disableTracing = options?.disableTracing ?? false;
	const generateRequestId = options?.generateRequestId ?? (() => requestIdCounter++);
	const services = yield* context();
	const scope = get$3(services, Scope);
	const entries = /* @__PURE__ */ new Map();
	let isShutdown = false;
	yield* addFinalizer(scope, withFiber$1((parent) => {
		isShutdown = true;
		return clearEntries(interrupt$2(parent.id));
	}));
	const clearEntries = fnUntraced(function* (exit) {
		for (const [id, entry] of entries) {
			entries.delete(id);
			if (entry._tag === "Queue") yield* exit._tag === "Success" ? end(entry.queue) : failCause$2(entry.queue, exit.cause);
			else entry.resume(exit);
		}
	});
	const onRequest = (rpc) => {
		const isStream = isStreamSchema(rpc.successSchema);
		const middleware = getRpcClientMiddleware(rpc);
		return (payload, opts) => {
			const headers = opts?.headers ? fromInput$1(opts.headers) : empty$3;
			const context = opts?.context ?? empty$5();
			if (!isStream) {
				const onRequest = (span) => onEffectRequest(rpc, middleware, span, rpc.payloadSchema.make(payload), headers, context, opts?.discard ?? false);
				return disableTracing ? onRequest(void 0) : useSpan(`${spanPrefix}.${rpc._tag}`, { attributes: options.spanAttributes }, onRequest);
			}
			const queue = onStreamRequest(rpc, middleware, rpc.payloadSchema.make(payload), headers, opts?.streamBufferSize ?? 16, context);
			if (opts?.asQueue) return queue;
			return unwrap(map(queue, fromQueue));
		};
	};
	const onEffectRequest = (rpc, middleware, span, payload, headers, context, discard) => withFiber$1((parentFiber) => {
		if (isShutdown) return interrupt;
		const id = generateRequestId();
		const send = middleware((message) => options.onFromClient({
			message,
			context,
			discard
		}), {
			_tag: "Request",
			id,
			tag: rpc._tag,
			payload,
			...span ? {
				traceId: span.traceId,
				spanId: span.spanId,
				sampled: span.sampled
			} : {},
			headers: merge(parentFiber.getRef(CurrentHeaders), headers)
		});
		if (discard) return send;
		let fiber;
		return onInterrupt$1(callback$1((resume) => {
			const entry = {
				_tag: "Effect",
				rpc,
				context,
				resume(exit) {
					resume(exit);
					if (fiber && !fiber.pollUnsafe()) parentFiber.currentDispatcher.scheduleTask(() => {
						fiber.interruptUnsafe(parentFiber.id);
					}, 0);
				}
			};
			entries.set(id, entry);
			fiber = send.pipe(span ? withParentSpan(span, { captureStackTrace: false }) : identity, runForkWith(parentFiber.context));
			fiber.addObserver((exit) => {
				if (exit._tag === "Failure") return resume(exit);
			});
		}), (interruptors) => {
			entries.delete(id);
			return andThen(interrupt$3(fiber), sendInterrupt(id, Array.from(interruptors), context));
		});
	});
	const onStreamRequest = fnUntraced(function* (rpc, middleware, payload, headers, streamBufferSize, context) {
		if (isShutdown) return yield* interrupt;
		const span = disableTracing ? void 0 : yield* makeSpanScoped(`${spanPrefix}.${rpc._tag}`, { attributes: options.spanAttributes });
		const fiber = getCurrent();
		const id = generateRequestId();
		const scope = getUnsafe$1(fiber.context, Scope);
		yield* addFinalizerExit(scope, (exit) => {
			if (!entries.has(id)) return void_;
			entries.delete(id);
			return sendInterrupt(id, isFailure(exit) ? Array.from(interruptors(exit.cause)) : [], context);
		});
		const queue = yield* bounded(streamBufferSize);
		entries.set(id, {
			_tag: "Queue",
			rpc,
			queue,
			scope,
			context
		});
		yield* middleware((message) => options.onFromClient({
			message,
			context,
			discard: false
		}), {
			_tag: "Request",
			id,
			tag: rpc._tag,
			payload,
			...span ? {
				traceId: span.traceId,
				spanId: span.spanId,
				sampled: span.sampled
			} : {},
			headers: merge(fiber.getRef(CurrentHeaders), headers)
		}).pipe(span ? withParentSpan(span, { captureStackTrace: false }) : identity, catchCause((error) => failCause$2(queue, error)), interruptible, forkIn(scope, { startImmediately: true }));
		return queue;
	});
	const getRpcClientMiddleware = (rpc) => {
		const middlewares = [];
		for (const tag of rpc.middlewares.values()) {
			const middleware = getOrUndefinedUnsafe(services, `${tag.key}/Client`);
			if (!middleware) continue;
			middlewares.push(middleware);
		}
		if (middlewares.length === 0) return (send, request) => send(request);
		return function loop(send, request, index = middlewares.length - 1) {
			if (index === -1) return send(request);
			return middlewares[index]({
				rpc,
				request,
				next(request) {
					return loop(send, request, index - 1);
				}
			});
		};
	};
	const sendInterrupt = (requestId, interruptors, context) => callback$1((resume) => {
		const parentFiber = getCurrent();
		options.onFromClient({
			message: {
				_tag: "Interrupt",
				requestId,
				interruptors
			},
			context,
			discard: false
		}).pipe(timeout(1e3), runForkWith(parentFiber.context)).addObserver(() => {
			resume(void_);
		});
	});
	const write = (message) => {
		switch (message._tag) {
			case "Chunk": {
				const requestId = message.requestId;
				const entry = entries.get(requestId);
				if (!entry || entry._tag !== "Queue") return void_;
				return offerAll(entry.queue, message.values).pipe(supportsAck ? flatMap(() => options.onFromClient({
					message: {
						_tag: "Ack",
						requestId: message.requestId
					},
					context: entry.context,
					discard: false
				})) : identity, catchCause((cause) => failCause$2(entry.queue, cause)));
			}
			case "Exit": {
				const requestId = message.requestId;
				const entry = entries.get(requestId);
				if (!entry) return void_;
				entries.delete(requestId);
				if (entry._tag === "Effect") {
					entry.resume(message.exit);
					return void_;
				}
				return message.exit._tag === "Success" ? end(entry.queue) : failCause$2(entry.queue, message.exit.cause);
			}
			case "Defect": return clearEntries(die(message.defect));
			case "ClientEnd": return void_;
		}
	};
	let client;
	if (options.flatten) {
		const fns = /* @__PURE__ */ new Map();
		client = function client(tag, payload, options) {
			let fn = fns.get(tag);
			if (!fn) {
				fn = onRequest(group.requests.get(tag));
				fns.set(tag, fn);
			}
			return fn(payload, options);
		};
	} else {
		client = {};
		group.requests.forEach((rpc) => {
			assignProperty(client, rpc._tag, onRequest(rpc));
		});
	}
	return {
		client,
		write
	};
});
var clientIdCounter = 0;
/**
* Creates a schema-aware RPC client for a group using the current client
* `Protocol`, encoding requests and decoding server responses.
*
* @category constructors
* @since 4.0.0
*/
var make$1 = /*#__PURE__*/ fnUntraced(function* (group, options) {
	const clientId = clientIdCounter++;
	const { codecFor, run, send, supportsAck, supportsTransferables } = yield* Protocol;
	const rpcSchemas = makeRpcSchemas(codecFor);
	const decodeDefect = decodeSync(codecFor(Defect()));
	const entries = /* @__PURE__ */ new Map();
	const { client, write } = yield* makeNoSerialization(group, {
		...options,
		supportsAck,
		onFromClient({ message }) {
			switch (message._tag) {
				case "Request": {
					const rpc = group.requests.get(message.tag);
					const collector = supportsTransferables ? makeCollectorUnsafe() : void 0;
					const fiber = getCurrent();
					const entry = {
						rpc,
						context: collector ? add(fiber.context, Collector, collector) : fiber.context,
						schemas: rpcSchemas(rpc)
					};
					entries.set(message.id, entry);
					return entry.schemas.encodePayload(message.payload).pipe(provideContext(entry.context), orDie, flatMap((payload) => send(clientId, {
						...message,
						id: message.id,
						payload,
						headers: Object.entries(message.headers)
					}, collector && collector.readUnsafe())));
				}
				case "Ack":
					if (!entries.get(message.requestId)) return void_;
					return send(clientId, {
						_tag: "Ack",
						requestId: message.requestId
					});
				case "Interrupt":
					if (!entries.get(message.requestId)) return void_;
					entries.delete(message.requestId);
					return send(clientId, {
						_tag: "Interrupt",
						requestId: message.requestId
					});
				case "Eof": return void_;
			}
		}
	});
	yield* run(clientId, (message) => {
		switch (message._tag) {
			case "Chunk": {
				const requestId = RequestId(message.requestId);
				const entry = entries.get(requestId);
				if (!entry || isNone(entry.schemas.decodeChunk)) return void_;
				return entry.schemas.decodeChunk.value(message.values).pipe(provideContext(entry.context), orDie, flatMap((chunk) => write({
					_tag: "Chunk",
					clientId: 0,
					requestId: RequestId(message.requestId),
					values: chunk
				})), onError((cause) => write({
					_tag: "Exit",
					clientId: 0,
					requestId: RequestId(message.requestId),
					exit: failCause$1(cause)
				})));
			}
			case "Exit": {
				const requestId = RequestId(message.requestId);
				const entry = entries.get(requestId);
				if (!entry) return void_;
				entries.delete(requestId);
				return entry.schemas.decodeExit(message.exit).pipe(provideContext(entry.context), orDie, matchCauseEffect({
					onSuccess: (exit) => write({
						_tag: "Exit",
						clientId: 0,
						requestId,
						exit
					}),
					onFailure: (cause) => write({
						_tag: "Exit",
						clientId: 0,
						requestId,
						exit: failCause$1(cause)
					})
				}));
			}
			case "Defect": return write({
				_tag: "Defect",
				clientId: 0,
				defect: decodeDefect(message.defect)
			});
			case "ClientProtocolError": {
				const exit = fail$2(message.error);
				return forEach(entries.keys(), (requestId) => write({
					_tag: "Exit",
					clientId: 0,
					requestId,
					exit
				}));
			}
			default: return void_;
		}
	}).pipe(catchCause(logError), interruptible, forkScoped);
	return client;
});
var makeRpcSchemas = (codecFor) => {
	const cache = /* @__PURE__ */ new WeakMap();
	return (rpc) => {
		let entry = cache.get(rpc);
		if (entry !== void 0) return entry;
		const streamSchemas = getStreamSchemas(rpc.successSchema);
		entry = {
			decodeChunk: map$2(streamSchemas, (streamSchemas) => decodeUnknownEffect(codecFor(NonEmptyArray(streamSchemas.success)))),
			encodePayload: encodeEffect(codecFor(rpc.payloadSchema)),
			decodeExit: decodeUnknownEffect(codecFor(exitSchema(rpc)))
		};
		cache.set(rpc, entry);
		return entry;
	};
};
/**
* Fiber reference containing headers that are merged into outgoing RPC
* client requests.
*
* **When to use**
*
* Use to set request headers that should be automatically merged into outgoing
* RPC client messages.
*
* @category services
* @since 4.0.0
*/
var CurrentHeaders = /*#__PURE__*/ Reference("effect/rpc/RpcClient/CurrentHeaders", { defaultValue: () => empty$3 });
/**
* Runs an effect with additional RPC client headers, merging them with the
* current `CurrentHeaders` value for outgoing requests.
*
* @category headers
* @since 4.0.0
*/
var withHeaders = /*#__PURE__*/ dual(2, (effect, headers) => updateService(effect, CurrentHeaders, merge(fromInput$1(headers))));
/**
* Defines the service interface for an RPC client transport, responsible for running the
* receive loop and sending encoded client messages.
*
* **When to use**
*
* Use to provide the transport boundary for RPC clients over HTTP, WebSocket,
* workers, sockets, or custom protocols.
*
* @category services
* @since 4.0.0
*/
var Protocol = class extends (/*#__PURE__*/ Service()("effect/rpc/RpcClient/Protocol")) {
	/**
	* Creates a client protocol service from the supplied RPC request runner.
	*
	* @since 4.0.0
	*/
	static make = withRunClient;
};
/**
* Creates a client `Protocol` that sends each RPC request through the supplied
* `HttpClient` and decodes responses with the current `RpcSerialization`.
*
* @category protocols
* @since 4.0.0
*/
var makeProtocolHttp = (client) => Protocol.make(fnUntraced(function* (writeResponse) {
	const serialization = yield* RpcSerialization;
	const isFramed = serialization.includesFraming;
	const httpClientError = (cause) => new RpcClientError({ reason: HttpClientErrorSchema.fromHttpClientError(cause) });
	const protocolDefect = (message, cause) => new RpcClientError({ reason: new RpcClientDefect({
		message,
		cause
	}) });
	const emptyResponseError = (request) => protocolDefect("Received empty HTTP response from RPC server", request);
	const incompleteResponseError = (request) => protocolDefect("HTTP response ended before RPC request completed", request);
	return {
		send: fnUntraced(function* (clientId, request) {
			if (request._tag !== "Request") return;
			const parser = serialization.makeUnsafe();
			const encoded = parser.encode(request);
			const body = typeof encoded === "string" ? text(encoded, serialization.contentType) : uint8Array(encoded, serialization.contentType);
			const response = yield* client.post("", { body }).pipe(mapError(httpClientError));
			if (!isFramed) {
				const text = yield* response.text.pipe(mapError(httpClientError));
				const responses = yield* try_$1({
					try: () => parser.decode(text),
					catch: (cause) => protocolDefect("Error decoding HTTP response", cause)
				});
				if (!Array.isArray(responses)) return yield* protocolDefect("Expected an array of responses", responses);
				if (responses.length === 0) return yield* emptyResponseError(request);
				let completed = false;
				let i = 0;
				yield* whileLoop({
					while: () => i < responses.length,
					body: () => {
						const response = responses[i++];
						if (isTerminalResponse(response)) completed = true;
						return writeResponse(clientId, response);
					},
					step: constVoid
				});
				if (!completed) return yield* incompleteResponseError(request);
				return;
			}
			let hasResponse = false;
			let completed = false;
			yield* runForEachArray(response.stream, (chunk) => try_$1({
				try: () => chunk.flatMap(parser.decode),
				catch: (cause) => protocolDefect("Error decoding HTTP response", cause)
			}).pipe(flatMap((responses) => {
				if (responses.length === 0) return void_;
				hasResponse = true;
				let i = 0;
				return whileLoop({
					while: () => i < responses.length,
					body: () => {
						const response = responses[i++];
						if (isTerminalResponse(response)) completed = true;
						return writeResponse(clientId, response);
					},
					step: constVoid
				});
			}))).pipe(mapError((cause) => isRpcClientError(cause) ? cause : httpClientError(cause)));
			if (!hasResponse) return yield* emptyResponseError(request);
			else if (!completed) return yield* incompleteResponseError(request);
		}),
		supportsAck: false,
		supportsTransferables: false,
		codecFor: serialization.codecFor
	};
}));
/**
* Provides a client `Protocol` backed by `HttpClient`, targeting the configured
* URL and optionally transforming the client before use.
*
* @category layers
* @since 4.0.0
*/
var layerProtocolHttp = (options) => effect(Protocol)(flatMap(HttpClient, (client) => {
	client = mapRequest(client, prependUrl(options.url));
	return makeProtocolHttp(options.transformClient ? options.transformClient(client) : client);
}));
/**
* Creates a client `Protocol` over the current `Socket`, using the current
* `RpcSerialization`, connection hooks, ping timeouts, and the configured retry
* policy.
*
* @category protocols
* @since 4.0.0
*/
var makeProtocolSocket = (options) => Protocol.make(fnUntraced(function* (writeResponse, clientIds) {
	const socket = yield* Socket;
	const serialization = yield* RpcSerialization;
	const hooks = yield* serviceOption(ConnectionHooks);
	const requestClientMap = /* @__PURE__ */ new Map();
	const write = yield* socket.writer;
	let parser = serialization.makeUnsafe();
	const pinger = yield* makePinger(suspend(() => write(parser.encode(constPing))));
	let currentError;
	const onOpen = suspend(() => {
		currentError = void 0;
		return isSome(hooks) ? hooks.value.onConnect : void_;
	});
	const broadcast = (response) => forEach(clientIds, (clientId) => writeResponse(clientId, response));
	const broadcastError = (error) => {
		currentError = error;
		return broadcast({
			_tag: "ClientProtocolError",
			error
		});
	};
	yield* suspend(() => {
		parser = serialization.makeUnsafe();
		pinger.reset();
		return socket.runRaw((message) => {
			try {
				const responses = parser.decode(message);
				if (responses.length === 0) return;
				let i = 0;
				return whileLoop({
					while: () => i < responses.length,
					body: () => {
						const response = responses[i++];
						if (response._tag === "Pong") {
							pinger.onPong();
							return void_;
						}
						if (Object.hasOwn(response, "requestId")) {
							const requestId = response.requestId;
							const clientId = requestClientMap.get(requestId);
							if (clientId !== void 0) {
								if (response._tag === "Exit") requestClientMap.delete(requestId);
								return writeResponse(clientId, response);
							}
						}
						return broadcast(response);
					},
					step: constVoid
				});
			} catch (defect) {
				return broadcast({
					_tag: "ClientProtocolError",
					error: new RpcClientError({ reason: new RpcClientDefect({
						message: "Error decoding message",
						cause: defect
					}) })
				});
			}
		}, { onOpen }).pipe(raceFirst(flatMap(pinger.timeout, () => fail(new SocketError({ reason: new SocketOpenError({
			kind: "Timeout",
			cause: /* @__PURE__ */ new Error("ping timeout")
		}) })))));
	}).pipe(flatMap(() => fail(new SocketError({ reason: new SocketCloseError({ code: 1e3 }) }))), isSome(hooks) ? ensuring(hooks.value.onDisconnect) : identity, tapCause((cause) => {
		const error = findError(cause);
		const hasError = isSuccess(error);
		const rpcError = new RpcClientError({ reason: hasError ? error.success.reason : new RpcClientDefect({
			message: "Unknown socket error",
			cause: squash(cause)
		}) });
		if (options?.retryTransientErrors && hasError && error.success.reason._tag === "SocketOpenError") return (options.onTransientError?.(rpcError) ?? void_).pipe(ignoreCause({
			log: true,
			message: "RpcClient onTransientError hook failed"
		}));
		return broadcastError(rpcError);
	}), retryOrElse(options?.retryPolicy ?? defaultRetryPolicy, (error) => broadcastError(new RpcClientError({ reason: error.reason }))), annotateLogs({
		module: "RpcClient",
		method: "makeProtocolSocket"
	}), forkScoped);
	return {
		send(clientId, request) {
			if (currentError) return fail(currentError);
			if (request._tag === "Request") requestClientMap.set(request.id, clientId);
			const encoded = parser.encode(request);
			if (encoded === void 0) return void_;
			return orDie(write(encoded));
		},
		supportsAck: true,
		supportsTransferables: false,
		codecFor: serialization.codecFor
	};
}));
var defaultRetryPolicy = /*#__PURE__*/ min([/*#__PURE__*/ exponential(500, 1.5), /*#__PURE__*/ spaced(5e3)]);
var makePinger = /*#__PURE__*/ fnUntraced(function* (writePing) {
	let recievedPong = true;
	const latch = makeUnsafe$5();
	const reset = () => {
		recievedPong = true;
		latch.closeUnsafe();
	};
	const onPong = () => {
		recievedPong = true;
	};
	yield* suspend(() => {
		if (!recievedPong) return latch.open;
		recievedPong = false;
		return writePing;
	}).pipe(delay("5 seconds"), ignore, forever, interruptible, forkScoped);
	return {
		timeout: latch.await,
		reset,
		onPong
	};
});
/**
* Provides a client `Protocol` backed by the current `Socket` and
* `RpcSerialization` services.
*
* @category layers
* @since 4.0.0
*/
var layerProtocolSocket = (options) => effect(Protocol)(makeProtocolSocket(options));
/**
* Creates a client `Protocol` backed by a pool of workers, routing RPC requests
* to workers and supporting transferable values when the platform does.
*
* @category protocols
* @since 4.0.0
*/
var makeProtocolWorker = (options) => Protocol.make(fnUntraced(function* (writeResponse, clientIds) {
	const worker = yield* WorkerPlatform;
	const scope$1 = yield* scope;
	let workerId = 0;
	const initialMessage = yield* serviceOption(InitialMessage);
	const hooks = yield* serviceOption(ConnectionHooks);
	const entries = /* @__PURE__ */ new Map();
	const broadcast = (response) => forEach(clientIds, (clientId) => writeResponse(clientId, response));
	const acquire = gen(function* () {
		const id = workerId++;
		const backing = yield* worker.spawn(id);
		yield* backing.run((response) => {
			if (response._tag === "Exit") {
				const entry = entries.get(response.requestId);
				if (entry) {
					entries.delete(response.requestId);
					entry.latch.openUnsafe();
					return writeResponse(entry.clientId, response);
				}
			} else if (response._tag === "Defect") {
				for (const [requestId, entry] of entries) {
					entries.delete(requestId);
					entry.latch.openUnsafe();
				}
				return broadcast(response);
			} else if ("requestId" in response) {
				const entry = entries.get(response.requestId);
				if (entry) return writeResponse(entry.clientId, response);
			}
			return broadcast(response);
		}, { onSpawn: isSome(initialMessage) ? flatMap(initialMessage.value, ([value, transfers]) => orDie(backing.send({
			_tag: "InitialMessage",
			value
		}, transfers))) : void 0 }).pipe(tapCause((cause) => {
			for (const [requestId, entry] of entries) {
				if (entry.worker !== backing) continue;
				entries.delete(requestId);
				entry.latch.openUnsafe();
			}
			const error = findError(cause);
			return broadcast({
				_tag: "ClientProtocolError",
				error: new RpcClientError({ reason: isSuccess(error) ? error.success.reason : new RpcClientDefect({
					message: "Error in worker",
					cause: squash(cause)
				}) })
			});
		}), retry(spaced(1e3)), annotateLogs({
			module: "RpcClient",
			method: "makeProtocolWorker"
		}), interruptible, forkScoped);
		return backing;
	});
	const pool = "minSize" in options ? yield* makeWithTTL({
		acquire,
		min: options.minSize,
		max: options.maxSize,
		concurrency: options.concurrency,
		targetUtilization: options.targetUtilization,
		timeToLive: options.timeToLive
	}) : yield* make$10({
		acquire,
		size: options.size,
		concurrency: options.concurrency,
		targetUtilization: options.targetUtilization
	});
	yield* addFinalizer(scope$1, sync$1(() => {
		for (const entry of entries.values()) entry.latch.openUnsafe();
		entries.clear();
	}));
	const send = (clientId, request, transferables) => {
		switch (request._tag) {
			case "Request": return get$2(pool).pipe(flatMap((worker) => {
				const latch = makeUnsafe$5(false);
				entries.set(request.id, {
					clientId,
					worker,
					latch
				});
				return flatMap(worker.send(request, transferables), () => latch.await);
			}), scoped, orDie);
			case "Interrupt": {
				const entry = entries.get(request.requestId);
				if (!entry) return void_;
				entries.delete(request.requestId);
				entry.latch.openUnsafe();
				return orDie(entry.worker.send(request));
			}
			case "Ack": {
				const entry = entries.get(request.requestId);
				if (!entry) return void_;
				return orDie(entry.worker.send(request));
			}
		}
		return void_;
	};
	yield* scoped(get$2(pool));
	if (isSome(hooks)) yield* hooks.value.onConnect;
	return {
		send,
		supportsAck: true,
		supportsTransferables: true,
		codecFor: toCodecJson
	};
}));
/**
* Provides a client `Protocol` backed by a worker pool using the current worker
* platform and spawner services.
*
* @category layers
* @since 4.0.0
*/
var layerProtocolWorker = /*#__PURE__*/ flow(makeProtocolWorker, /*#__PURE__*/ effect(Protocol));
/**
* Represents optional client protocol hooks that run when a transport connects
* and disconnects.
*
* **When to use**
*
* Use to run setup or cleanup effects when an RPC client transport opens or
* closes.
*
* @category services
* @since 4.0.0
*/
var ConnectionHooks = class extends (/*#__PURE__*/ Service()("effect/rpc/RpcClient/ConnectionHooks")) {};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/rpc/RpcGroup.js
var RpcGroupProto = {
	add(...rpcs) {
		const requests = new Map(this.requests);
		for (const rpc of rpcs) requests.set(rpc._tag, rpc);
		return makeProto({
			requests,
			annotations: this.annotations
		});
	},
	merge(...groups) {
		const requests = new Map(this.requests);
		const annotations = new Map(this.annotations.mapUnsafe);
		for (const group of groups) {
			for (const [tag, rpc] of group.requests) requests.set(tag, rpc);
			for (const [key, value] of group.annotations.mapUnsafe) annotations.set(key, value);
		}
		return makeProto({
			requests,
			annotations: makeUnsafe$3(annotations)
		});
	},
	omit(...tags) {
		const requests = new Map(this.requests);
		for (const tag of tags) requests.delete(tag);
		return makeProto({
			requests,
			annotations: this.annotations
		});
	},
	middleware(middleware) {
		const requests = /* @__PURE__ */ new Map();
		for (const [tag, rpc] of this.requests) requests.set(tag, rpc.middleware(middleware));
		return makeProto({
			requests,
			annotations: this.annotations
		});
	},
	toHandlers(build) {
		const self = this;
		return gen(function* () {
			const services = yield* context();
			const handlers = isEffect(build) ? yield* build : build;
			const contextMap = /* @__PURE__ */ new Map();
			self.requests.forEach((rpc, tag) => {
				contextMap.set(rpc.key, {
					tag: rpc._tag,
					handler: handlers[tag],
					context: services
				});
			});
			return makeUnsafe$3(contextMap);
		});
	},
	prefix(prefix) {
		const requests = /* @__PURE__ */ new Map();
		for (const rpc of this.requests.values()) {
			const newRpc = rpc.prefix(prefix);
			requests.set(newRpc._tag, newRpc);
		}
		return makeProto({
			requests,
			annotations: this.annotations
		});
	},
	toLayer(build) {
		return effectContext(this.toHandlers(build));
	},
	of: identity,
	toLayerHandler(service, build) {
		const self = this;
		return effectContext(gen(function* () {
			const services = yield* context();
			const handler = isEffect(build) ? yield* build : build;
			const contextMap = /* @__PURE__ */ new Map();
			const rpc = self.requests.get(service);
			contextMap.set(rpc.key, {
				handler,
				context: services
			});
			return makeUnsafe$3(contextMap);
		}));
	},
	accessHandler(service) {
		return contextWith((parentContext) => {
			const rpc = this.requests.get(service);
			const { handler, context } = getOrUndefinedUnsafe(parentContext, rpc.key);
			return succeed((payload, options) => {
				options.rpc = rpc;
				const result = handler(payload, options);
				const effectOrStream = isWrapper(result) ? result.value : result;
				return isEffect(effectOrStream) ? provide$1(effectOrStream, context) : provideContext$1(effectOrStream, context);
			});
		});
	},
	annotate(service, value) {
		return makeProto({
			requests: this.requests,
			annotations: add(this.annotations, service, value)
		});
	},
	annotateRpcs(service, value) {
		return this.annotateRpcsMerge(make$14(service, value));
	},
	annotateMerge(context) {
		return makeProto({
			requests: this.requests,
			annotations: merge$1(this.annotations, context)
		});
	},
	annotateRpcsMerge(context) {
		const requests = /* @__PURE__ */ new Map();
		for (const [tag, rpc] of this.requests) requests.set(tag, rpc.annotateMerge(merge$1(context, rpc.annotations)));
		return makeProto({
			requests,
			annotations: this.annotations
		});
	}
};
var makeProto = (options) => Object.assign(function() {}, RpcGroupProto, {
	requests: options.requests,
	annotations: options.annotations
});
/**
* Creates an `RpcGroup` from one or more RPC definitions.
*
* @category constructors
* @since 4.0.0
*/
var make = (...rpcs) => makeProto({
	requests: new Map(rpcs.map((rpc) => [rpc._tag, rpc])),
	annotations: empty$5()
});
//#endregion
export { HttpClient, KeyValueStore, KeyValueStoreError, Protocol, RpcClientDefect, RpcClientError, RpcClient_exports, RpcSerialization, Socket, SocketCloseError, SocketError, SocketOpenError, SubscriptionRef_exports, WorkerError, WorkerPlatform, WorkerReceiveError, bodyText, changes, constPing, decode, filterStatusOk, get, get$1, layer, layerSpawner, log, make, make$2 as make$1, make$8 as make$2, make$12 as make$3, makePlatform, makeStringOnly, post, remove$1 as remove, run, set$1 as set, setHeaders, stream };
