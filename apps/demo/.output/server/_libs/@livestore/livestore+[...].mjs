import { __toESM$1 as __toESM } from "../../_ssr/rolldown-runtime-DaEwE2D6.mjs";
import { Class$1 as Class, MinimumLogLevel, OtelTracer, ParentSpan, PipeInspectableProto, Scope, Service, Tracer, _await, acquireRelease, addFinalizer, annotateLogs, asVoid, buildWithMemoMap, catchCause, catchDefect, catchTag, close, context, currentOtelSpan, die, done, dual, effect, empty, ensuring, fail$3 as fail, failCause$1 as failCause, findDefect, findError, flatMap, flatten, fn, forever, forkChild, forkDetach, forkIn, forkScoped, forkUnsafe, fromResult, gen, getOption, hasProperty, identity, interruptible, isAsyncFiberError, isDone, isFailure$1 as isFailure, isSuccess as isSuccess$1, isSuccess$1 as isSuccess, log, logDebug, logError, make$1 as make$3, make$2 as make$4, make$3 as make$2, makeExternalSpan, makeMemoMapUnsafe, makeUnsafe as makeUnsafe$1, map, mapError, mergeAll, never, none, orDie, pipe, provide as provide$1, provide$2, provideContext, provideService, require_src, runCallback, runCallbackWith, runFork, runForkWith, runPromise, runPromiseExit, runPromiseExitWith, runPromiseWith, runSync, runSyncExit, runSyncExitWith, runSyncWith, scope, scoped, some, squash, string, succeed$1, succeed$2, succeed$3 as succeed, suspend, symbol, symbol$1, sync, tap, tapCause, timeout, tracer, try_, unwrap, void_ as void_$1, void_$1 as void_, withFiber, withSpan, yieldNow } from "../@effect/opentelemetry+[...].mjs";
import { BoundArray, BoundMap, BoundSet, DebugInfoHistoryRes, DebugInfoRerunQueryRes, DebugInfoRes, DebugInfoResetRes, IntentionalShutdownCause, Json, LS_DEV, LiveQueriesRes, MaterializeError, MaterializerHashMismatchError, OtelLiveDummy, Pong, QueryBuilderAstSymbol, ReactivityGraphRes, ResetAllData, SessionIdSymbol, SetSyncLatch, SqliteError, StateHead, SyncHeadRes, UnknownError, VersionMismatch, assertNever, await_, callback, catchTag as catchTag$1, concat, decodeEffect, decodeResult, decodeUnknownSync, devtoolsProtocolVersion, empty as empty$1, encodeEffect, fail as fail$1, flatMap as flatMap$1, fromEffect, get as get$1, getExecStatementsFromMaterializer, getResultSchema, hashMaterializerResults, interrupt, isDevEnv, isDevtoolsProtocolVersionSupported, isQueryBuilder, isStateSystemTable, join, liveStoreVersion, logWarnIfTakesLongerThan, make as make$7, make$2 as make$6, make$3 as make$8, make$7 as make$5, makeClientSessionSyncProcessor, makeExecute, makeSchema$1 as makeSchema, makeSchemaMemo, makeSelect, map as map$1, mapEffect, objectToString, offerUnsafe, omitUndefineds, prepareBindValues, prettyBytes, provideOtel, resolveDevtoolsProtocolVersion, resolveEventDef, resolveSessionIdSymbolInBindValues, runDrain, runIn, set as set$1, shouldNeverHappen, shutdown, sql, take$2 as take, tap as tap$1, tapCauseLogPretty, tapError, tapSync as tapSync$1, throttle, toAsyncIterable, toString, trySyncOrPromiseOrEffect, unbounded$1 as unbounded, unwrap as unwrap$1, withPerformanceMeasure, withSavepoint } from "./common+[...].mjs";
import { NOT_REFRESHED_YET, StoreInternalsSymbol, makeExecBeforeFirstRun, makeReactivityGraph, queryDb } from "./framework-toolkit+[...].mjs";
import { webcrypto } from "node:crypto";
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/ManagedRuntime.js
var TypeId = "~effect/ManagedRuntime";
/**
* Creates a `ManagedRuntime` from a layer.
*
* **When to use**
*
* Use to create a reusable runtime from a `Layer` for application entry points
* or integration code that runs many effects without rebuilding services.
*
* **Details**
*
* The layer is built lazily on first use and its context is cached for
* subsequent runs. Resources acquired by the layer are owned by the runtime and
* are released when `dispose` or `disposeEffect` is run. `options.memoMap` can
* be used to share layer memoization with other layer builds.
*
* **Gotchas**
*
* Dispose the runtime when it is no longer needed. A runtime cannot be reused
* after disposal.
*
* **Example** (Creating a managed runtime)
*
* ```ts import.meta.vitest
* import { Context, Effect, Layer, ManagedRuntime } from "effect"
*
* const notifications: Array<string> = []
*
* class Notifications extends Context.Service<Notifications, {
*   readonly notify: (message: string) => Effect.Effect<void>
* }>()("Notifications") {
*   static readonly layer = Layer.succeed(this)({
*     notify: Effect.fn("Notifications.notify")((message) =>
*       Effect.sync(() => notifications.push(message))
*     )
*   })
* }
*
* const runtime = ManagedRuntime.make(Notifications.layer)
*
* const program = Effect.flatMap(
*   Notifications,
*   (_) => _.notify("Hello, world!")
* ).pipe(Effect.ensuring(runtime.disposeEffect))
*
* await runtime.runPromise(program)
* notifications // => ["Hello, world!"]
* ```
*
* @see {@link ManagedRuntime} for the returned runtime interface
* @see {@link Layer.MemoMap} for shared layer memoization
* @see {@link Layer.build} for lower-level scoped layer construction
*
* @category constructors
* @since 2.0.0
*/
var make$1 = (layer, options) => {
	const memoMap = options?.memoMap ?? makeMemoMapUnsafe();
	const scope = makeUnsafe$1("parallel");
	const layerScope = forkUnsafe(scope, "sequential");
	const defaultRunOptions = { onFiberStart: runIn(scope) };
	const mergeRunOptions = (options) => options ? {
		...options,
		onFiberStart: options.onFiberStart ? (fiber) => {
			defaultRunOptions.onFiberStart(fiber);
			options.onFiberStart(fiber);
		} : defaultRunOptions.onFiberStart
	} : defaultRunOptions;
	let buildFiber;
	const contextEffect = withFiber((fiber) => {
		if (!buildFiber) buildFiber = runFork(tap(buildWithMemoMap(layer, memoMap, layerScope), (context) => sync(() => {
			self.cachedContext = context;
		})), {
			...defaultRunOptions,
			scheduler: fiber.currentScheduler
		});
		return flatten(await_(buildFiber));
	});
	const self = {
		[TypeId]: TypeId,
		memoMap,
		scope,
		contextEffect,
		cachedContext: void 0,
		context() {
			return self.cachedContext === void 0 ? runPromise(self.contextEffect) : Promise.resolve(self.cachedContext);
		},
		dispose() {
			return runPromise(self.disposeEffect);
		},
		[Symbol.asyncDispose]() {
			return self.dispose();
		},
		disposeEffect: suspend(() => {
			self.contextEffect = die("ManagedRuntime disposed");
			self.cachedContext = void 0;
			return close(self.scope, void_);
		}),
		runFork(effect, options) {
			return self.cachedContext === void 0 ? runFork(provide(self, effect), mergeRunOptions(options)) : runForkWith(self.cachedContext)(effect, mergeRunOptions(options));
		},
		runCallback(effect, options) {
			return self.cachedContext === void 0 ? runCallback(provide(self, effect), mergeRunOptions(options)) : runCallbackWith(self.cachedContext)(effect, mergeRunOptions(options));
		},
		runSyncExit(effect) {
			return self.cachedContext === void 0 ? runSyncExit(provide(self, effect)) : runSyncExitWith(self.cachedContext)(effect);
		},
		runSync(effect) {
			return self.cachedContext === void 0 ? runSync(provide(self, effect)) : runSyncWith(self.cachedContext)(effect);
		},
		runPromiseExit(effect, options) {
			return self.cachedContext === void 0 ? runPromiseExit(provide(self, effect), mergeRunOptions(options)) : runPromiseExitWith(self.cachedContext)(effect, mergeRunOptions(options));
		},
		runPromise(effect, options) {
			return self.cachedContext === void 0 ? runPromise(provide(self, effect), mergeRunOptions(options)) : runPromiseWith(self.cachedContext)(effect, mergeRunOptions(options));
		}
	};
	return self;
};
function provide(managed, effect) {
	return flatMap(managed.contextEffect, (context) => provideContext(effect, context));
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Ref.js
/**
* Stores fiber-safe mutable state inside Effect programs.
*
* A `Ref<A>` holds one value and exposes reads, writes, and atomic
* transformations as effects, so state changes compose with Effect's
* concurrency model. This module includes constructors, safe and unsafe reads,
* set and get-and-set helpers, update and modify helpers, and conditional
* update variants that leave the value unchanged when an `Option.none` result
* is returned.
*
* @since 2.0.0
*/
var RefProto = {
	["~effect/Ref"]: { _A: identity },
	...PipeInspectableProto,
	toJSON() {
		return {
			_id: "Ref",
			ref: this.ref
		};
	}
};
/**
* Creates a new Ref with the specified initial value (unsafe version).
*
* **When to use**
*
* Use when you need immediate synchronous construction and can guarantee
* that creating the `Ref` outside of `Effect` is safe.
*
* **Gotchas**
*
* Prefer `Ref.make` for Effect-wrapped creation in Effect programs.
*
* **Example** (Creating a ref unsafely)
*
* ```ts import.meta.vitest
* import { Ref } from "effect"
*
* const counter = Ref.makeUnsafe(0)
* Ref.getUnsafe(counter) // => 0
* ```
*
* @category constructors
* @since 4.0.0
*/
var makeUnsafe = (value) => {
	const self = Object.create(RefProto);
	self.ref = make$5(value);
	return self;
};
/**
* Creates a new Ref with the specified initial value.
*
* **When to use**
*
* Use to create a `Ref` for shared mutable state inside an Effect program.
*
* **Example** (Creating a ref)
*
* ```ts import.meta.vitest
* import { Effect, Ref } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* Ref.make(42)
*   return yield* Ref.get(ref)
* })
*
* await Effect.runPromise(program) // => 42
* ```
*
* @see {@link makeUnsafe} for synchronous construction outside Effect code
*
* @category constructors
* @since 2.0.0
*/
var make = (value) => sync(() => makeUnsafe(value));
/**
* Gets the current value of the Ref.
*
* **When to use**
*
* Use to read the current `Ref` value without changing it.
*
* **Example** (Getting the current value)
*
* ```ts import.meta.vitest
* import { Effect, Ref } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* Ref.make(42)
*   return yield* Ref.get(ref)
* })
*
* await Effect.runPromise(program) // => 42
* ```
*
* @see {@link set} for replacing the current value
*
* @category getters
* @since 2.0.0
*/
var get = (self) => sync(() => self.ref.current);
/**
* Sets the value of the Ref to the specified value.
*
* **When to use**
*
* Use to replace the current `Ref` value with a known value.
*
* **Example** (Setting a value)
*
* ```ts import.meta.vitest
* import { Effect, Ref } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* Ref.make(0)
*   yield* Ref.set(ref, 42)
*   return yield* Ref.get(ref)
* })
*
* const program2 = Effect.gen(function*() {
*   const ref = yield* Ref.make(0)
*   yield* Ref.set(ref, 100)
*   return yield* Ref.get(ref)
* })
*
* await Effect.runPromise(program) // => 42
* await Effect.runPromise(program2) // => 100
* ```
*
* @see {@link getAndSet} for setting while returning the previous value
* @see {@link setAndGet} for setting while returning the new value
*
* @category mutations
* @since 2.0.0
*/
var set = /*#__PURE__*/ dual(2, (self, value) => sync(() => set$1(self.ref, value)));
/**
* Updates the value of the Ref atomically using the given function.
*
* **When to use**
*
* Use to apply a `Ref` state transition without returning a value.
*
* **Example** (Updating a value)
*
* ```ts import.meta.vitest
* import { Effect, Ref } from "effect"
*
* const program = Effect.gen(function*() {
*   const counter = yield* Ref.make(5)
*
*   yield* Ref.update(counter, (n) => n * 2)
*   return yield* Ref.get(counter)
* })
*
* const program2 = Effect.gen(function*() {
*   const counter = yield* Ref.make(5)
*   yield* Ref.update(counter, (n: number) => n + 10)
*   return yield* Ref.get(counter)
* })
*
* await Effect.runPromise(program) // => 10
* await Effect.runPromise(program2) // => 15
* ```
*
* @see {@link updateAndGet} for returning the new value
* @see {@link getAndUpdate} for returning the previous value
*
* @category mutations
* @since 2.0.0
*/
var update = /*#__PURE__*/ dual(2, (self, f) => sync(() => {
	self.ref.current = f(self.ref.current);
}));
//#endregion
//#region ../../node_modules/.bun/@livestore+utils@0.5.0-dev.0+d3a200b613bc4887/node_modules/@livestore/utils/dist/effect/OtelTracer.js
var makeSpanLink = (otelSpanLink) => ({
	span: makeExternalSpan(otelSpanLink.context),
	attributes: otelSpanLink.attributes ?? {}
});
//#endregion
//#region ../../node_modules/.bun/@livestore+utils@0.5.0-dev.0+d3a200b613bc4887/node_modules/@livestore/utils/dist/effect/Stream.js
var tapSync = (tapFn) => (stream) => tap$1(stream, (a) => sync(() => tapFn(a)));
/**
* Concatenates two streams where the second stream has access to the last element
* of the first stream as an `Option`. If the first stream is empty, the callback
* receives `Option.none()`.
*
* @param stream - The first stream to consume
* @param getStream2 - Function that receives the last element from the first stream
*   and returns the second stream to concatenate
* @returns A new stream containing all elements from both streams
*
* @example
* ```ts
* // Direct usage
* const result = concatWithLastElement(
*   Stream.make(1, 2, 3),
*   lastElement => lastElement.pipe(
*     Option.match({
*       onNone: () => Stream.make('empty'),
*       onSome: last => Stream.make(`last-was-${last}`)
*     })
*   )
* )
*
* // Piped usage
* const result = Stream.make(1, 2, 3).pipe(
*   concatWithLastElement(lastElement =>
*     Stream.make(lastElement.pipe(Option.getOrElse(() => 0)) * 10)
*   )
* )
* ```
*/
var concatWithLastElement = dual(2, (stream1, getStream2) => pipe(make(none()), fromEffect, flatMap$1((lastRef) => pipe(stream1, tap$1((value) => set(lastRef, some(value))), concat(pipe(get(lastRef), map(getStream2), unwrap$1))))));
dual(2, (stream, fallbackValue) => concatWithLastElement(stream, (lastElement) => lastElement._tag === "None" ? make$6(fallbackValue) : empty$1));
//#endregion
//#region ../../node_modules/.bun/@livestore+utils@0.5.0-dev.0+d3a200b613bc4887/node_modules/@livestore/utils/dist/effect/TaskTracing.js
var withAsyncTaggingTracing = (makeTrace) => (eff) => {
	if (hasProperty(console, "createTask") === false) return eff;
	const makeTracer = gen(function* () {
		const oldTracer = yield* tracer;
		const evaluate = (primitive, fiber) => oldTracer.context?.(primitive, fiber) ?? primitive["~effect/Effect/evaluate"](fiber);
		return make$2({
			span: (options) => {
				const span = oldTracer.span(options);
				const trace = makeTrace(options.name);
				span.runInTask = (f) => trace.run(f);
				return span;
			},
			context: (primitive, fiber) => {
				const maybeParentSpan = getOption(fiber.context, ParentSpan);
				if (maybeParentSpan._tag === "None") return evaluate(primitive, fiber);
				const parentSpan = maybeParentSpan.value;
				if (parentSpan._tag === "ExternalSpan") return evaluate(primitive, fiber);
				const span = parentSpan;
				if ("runInTask" in span && typeof span.runInTask === "function") return span.runInTask(() => evaluate(primitive, fiber));
				return evaluate(primitive, fiber);
			}
		});
	});
	const withTracerLayer = effect(Tracer, makeTracer);
	return provide$1(eff, withTracerLayer);
};
//#endregion
//#region ../../node_modules/.bun/nanoid@5.0.9/node_modules/nanoid/url-alphabet/index.js
var urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
//#endregion
//#region ../../node_modules/.bun/nanoid@5.0.9/node_modules/nanoid/index.js
var POOL_SIZE_MULTIPLIER = 128;
var pool;
var poolOffset;
function fillPool(bytes) {
	if (!pool || pool.length < bytes) {
		pool = Buffer.allocUnsafe(bytes * POOL_SIZE_MULTIPLIER);
		webcrypto.getRandomValues(pool);
		poolOffset = 0;
	} else if (poolOffset + bytes > pool.length) {
		webcrypto.getRandomValues(pool);
		poolOffset = 0;
	}
	poolOffset += bytes;
}
function nanoid(size = 21) {
	fillPool(size |= 0);
	let id = "";
	for (let i = poolOffset - size; i < poolOffset; i++) id += urlAlphabet[pool[i] & 63];
	return id;
}
//#endregion
//#region ../../node_modules/.bun/@livestore+livestore@0.5.0-dev.0+4e44266562819145/node_modules/@livestore/livestore/dist/QueryCache.js
var import_src = /* @__PURE__ */ __toESM(require_src(), 1);
var ignore = [
	"begin",
	"rollback",
	"commit",
	"savepoint",
	"release"
];
var cacheSize = 200;
var QueryCache = class {
	#entries = new BoundMap(cacheSize);
	#dependencies = /* @__PURE__ */ new Map();
	getKey = (sql, bindValues) => {
		if (bindValues == null) return sql;
		const formatValue = (value) => value === SessionIdSymbol ? "SessionIdSymbol" : String(value);
		if (Array.isArray(bindValues) === true) return `${sql}\n${bindValues.map(formatValue).join("\n")}`;
		return sql + "\n" + Object.entries(bindValues).map(([key, value]) => `${key}:${formatValue(value)}`).join("\n");
	};
	get = (key) => {
		return this.#entries.get(key);
	};
	set = (queriedTables, key, results) => {
		this.#entries.set(key, results);
		for (const table of queriedTables) {
			let keys = this.#dependencies.get(table);
			if (keys == null) {
				keys = new BoundSet(cacheSize);
				keys.onEvict = this.#dependencyTrackerEvicted;
				this.#dependencies.set(table, keys);
			}
			keys.add(key);
		}
	};
	#dependencyTrackerEvicted = (key) => {
		this.#entries.delete(key);
	};
	ignoreQuery = (query) => {
		return ignore.some((prefix) => query.startsWith(prefix));
	};
	invalidate = (queriedTables) => {
		for (const table of queriedTables) {
			const keys = this.#dependencies.get(table);
			if (keys == null) continue;
			for (const k of keys) this.#entries.delete(k);
		}
	};
};
//#endregion
//#region ../../node_modules/.bun/@livestore+livestore@0.5.0-dev.0+4e44266562819145/node_modules/@livestore/livestore/dist/SqliteDbWrapper.js
var emptyDebugInfo = () => ({
	slowQueries: new BoundArray(200),
	queryFrameDuration: 0,
	queryFrameCount: 0,
	events: new BoundArray(1e3)
});
/**
* This class is mostly adding result caching around a SqliteDb which is used to speed up
* SQLite queries when used through the reactivity graph.
*/
var SqliteDbWrapper = class {
	_tag = "SqliteDb";
	cachedStmts = new BoundMap(200);
	tablesUsedCache = new BoundMap(200);
	resultCache = new QueryCache();
	db;
	otelTracer;
	otelRootSpanContext;
	tablesUsedStmt;
	debugInfo = emptyDebugInfo();
	constructor({ db, otel }) {
		this.db = db;
		this.otelTracer = otel.tracer;
		this.otelRootSpanContext = otel.rootSpanContext;
		this.tablesUsedStmt = db.prepare(`SELECT tbl_name FROM tables_used(?) AS u JOIN sqlite_master ON sqlite_master.name = u.name WHERE u.schema = 'main';`);
		this.cachedStmts.onEvict = (_queryStr, stmt) => stmt.finalize();
		configureSQLite(this);
	}
	get debug() {
		return this.db.debug;
	}
	get metadata() {
		return this.db.metadata;
	}
	prepare(queryStr) {
		return this.db.prepare(queryStr);
	}
	import(data) {
		return this.db.import(data);
	}
	close() {
		this.db.close();
	}
	destroy() {
		this.db.destroy();
	}
	session() {
		return this.db.session();
	}
	makeChangeset(data) {
		return this.db.makeChangeset(data);
	}
	txn(callback) {
		this.execute(sql`begin transaction;`);
		let errored = false;
		let result;
		try {
			result = callback();
		} catch (e) {
			errored = true;
			this.execute(sql`rollback;`);
			throw e;
		}
		if (errored === false) this.execute(sql`commit;`);
		return result;
	}
	withChangeset(callback) {
		const session = this.db.session();
		const result = callback();
		const changeset = session.changeset();
		session.finish();
		return {
			result,
			changeset: changeset !== void 0 ? {
				_tag: "sessionChangeset",
				data: changeset,
				debug: null
			} : { _tag: "no-op" }
		};
	}
	rollback(changeset) {
		this.db.makeChangeset(changeset).invert().apply();
	}
	getTablesUsed(query) {
		const tableNameFromPlainDeleteQuery = tryGetTableNameFromPlainDeleteQuery(query);
		if (tableNameFromPlainDeleteQuery !== void 0) return /* @__PURE__ */ new Set([tableNameFromPlainDeleteQuery]);
		const cached = this.tablesUsedCache.get(query);
		if (cached !== void 0) return cached;
		const stmt = this.tablesUsedStmt;
		const tablesUsed = /* @__PURE__ */ new Set();
		try {
			const results = stmt.select([query]);
			for (const row of results) tablesUsed.add(row.tbl_name);
		} catch (e) {
			console.error("Error getting tables used", e, "for query", query);
			return /* @__PURE__ */ new Set();
		}
		this.tablesUsedCache.set(query, tablesUsed);
		return tablesUsed;
	}
	cachedExecute(queryStr, bindValues, options) {
		return this.otelTracer.startActiveSpan("livestore.in-memory-db:execute", { attributes: { "sql.query": queryStr } }, options?.otelContext ?? this.otelRootSpanContext, (span) => {
			const startTimePerfNow = performance.now();
			try {
				let stmt = this.cachedStmts.get(queryStr);
				if (stmt === void 0) {
					stmt = this.db.prepare(queryStr);
					this.cachedStmts.set(queryStr, stmt);
				}
				stmt.execute(bindValues);
				if (options?.hasNoEffects !== true && this.resultCache.ignoreQuery(queryStr) === false) this.resultCache.invalidate(options?.writeTables ?? this.getTablesUsed(queryStr));
				span.end();
				const durationMs = performance.now() - startTimePerfNow;
				this.debugInfo.queryFrameDuration += durationMs;
				this.debugInfo.queryFrameCount++;
				if (durationMs > 5 && isDevEnv() === true) this.debugInfo.slowQueries.push({
					queryStr,
					bindValues,
					durationMs,
					rowsCount: void 0,
					queriedTables: /* @__PURE__ */ new Set(),
					startTimePerfNow
				});
				return { durationMs };
			} catch (cause) {
				span.recordException(cause);
				span.end();
				if (LS_DEV === true) debugger;
				throw new SqliteError({
					cause,
					query: {
						bindValues: bindValues ?? {},
						sql: queryStr
					}
				});
			}
		});
	}
	execute = makeExecute((queryStr, bindValues) => this.cachedExecute(queryStr, bindValues));
	select = makeSelect((queryStr, bindValues) => this.cachedSelect(queryStr, bindValues));
	cachedSelect(queryStr, bindValues, options) {
		const { queriedTables, skipCache = false, otelContext } = options ?? {};
		return this.otelTracer.startActiveSpan("sql-in-memory-select", {}, otelContext ?? this.otelRootSpanContext, (span) => {
			const startTimePerfNow = performance.now();
			try {
				span.setAttribute("sql.query", queryStr);
				const key = this.resultCache.getKey(queryStr, bindValues);
				const cachedResult = this.resultCache.get(key);
				if (skipCache === false && cachedResult !== void 0) {
					span.setAttribute("sql.rowsCount", cachedResult.length);
					span.setAttribute("sql.cached", true);
					span.end();
					return cachedResult;
				}
				let stmt = this.cachedStmts.get(queryStr);
				if (stmt === void 0) {
					stmt = this.db.prepare(queryStr);
					this.cachedStmts.set(queryStr, stmt);
				}
				const result = stmt.select(bindValues);
				span.setAttribute("sql.rowsCount", result.length);
				span.setAttribute("sql.cached", false);
				const queriedTables_ = queriedTables ?? this.getTablesUsed(queryStr);
				this.resultCache.set(queriedTables_, key, result);
				span.end();
				const durationMs = performance.now() - startTimePerfNow;
				this.debugInfo.queryFrameDuration += durationMs;
				this.debugInfo.queryFrameCount++;
				if (durationMs > 5 && isDevEnv() === true) this.debugInfo.slowQueries.push({
					queryStr,
					bindValues,
					durationMs,
					rowsCount: result.length,
					queriedTables: queriedTables_,
					startTimePerfNow
				});
				return result;
			} finally {
				span.end();
			}
		});
	}
	export() {
		for (const key of this.cachedStmts.keys()) this.cachedStmts.delete(key);
		return this.db.export();
	}
};
/** Set up SQLite performance; hasn't been super carefully optimized yet. */
var configureSQLite = (db) => {
	db.execute(sql`
      PRAGMA page_size=32768;
      PRAGMA cache_size=10000;
      PRAGMA synchronous='OFF';
      PRAGMA temp_store='MEMORY';
      PRAGMA foreign_keys='ON'; -- we want foreign key constraints to be enforced
    `);
};
var tryGetTableNameFromPlainDeleteQuery = (query) => {
	const [_, tableName] = query.trim().match(/^delete\s+from\s+(\w+)$/i) ?? [];
	return tableName;
};
//#endregion
//#region ../../node_modules/.bun/@livestore+livestore@0.5.0-dev.0+4e44266562819145/node_modules/@livestore/livestore/dist/store/devtools.js
var requestNextTick = globalThis.requestAnimationFrame === void 0 ? (cb) => setTimeout(cb, 1e3) : globalThis.requestAnimationFrame;
var cancelTick = globalThis.cancelAnimationFrame === void 0 ? (id) => clearTimeout(id) : globalThis.cancelAnimationFrame;
var connectDevtoolsToStore = fn("LSD.devtools.connectStoreToDevtools")(function* ({ storeDevtoolsChannel, store }) {
	const reactivityGraphSubcriptions = /* @__PURE__ */ new Map();
	const liveQueriesSubscriptions = /* @__PURE__ */ new Map();
	const debugInfoHistorySubscriptions = /* @__PURE__ */ new Map();
	const syncHeadClientSessionSubscriptions = /* @__PURE__ */ new Map();
	const services = yield* context();
	const { clientId, sessionId } = store[StoreInternalsSymbol].clientSession;
	yield* addFinalizer(() => sync(() => {
		for (const unsub of reactivityGraphSubcriptions.values()) unsub();
		for (const unsub of liveQueriesSubscriptions.values()) unsub();
		for (const unsub of debugInfoHistorySubscriptions.values()) unsub();
		for (const unsub of syncHeadClientSessionSubscriptions.values()) unsub();
	}));
	const handledRequestIds = /* @__PURE__ */ new Set();
	const sendToDevtools = (message) => storeDevtoolsChannel.send(message).pipe(tapCauseLogPretty, runFork);
	const onMessage = (decodedMessage) => {
		if (decodedMessage.clientId !== clientId || decodedMessage.sessionId !== sessionId) return;
		if (decodedMessage._tag === "LSD.ClientSession.Disconnect") {
			for (const unsub of reactivityGraphSubcriptions.values()) unsub();
			reactivityGraphSubcriptions.clear();
			for (const unsub of liveQueriesSubscriptions.values()) unsub();
			liveQueriesSubscriptions.clear();
			for (const unsub of debugInfoHistorySubscriptions.values()) unsub();
			debugInfoHistorySubscriptions.clear();
			for (const unsub of syncHeadClientSessionSubscriptions.values()) unsub();
			syncHeadClientSessionSubscriptions.clear();
			storeDevtoolsChannel.shutdown.pipe(runFork);
			return;
		}
		const requestId = decodedMessage.requestId;
		if (handledRequestIds.has(requestId) === true) return;
		handledRequestIds.add(requestId);
		const requestIdleCallback = globalThis.requestIdleCallback ?? ((cb) => cb());
		switch (decodedMessage._tag) {
			case "LSD.ClientSession.ReactivityGraphSubscribe": {
				const includeResults = decodedMessage.includeResults;
				const { subscriptionId } = decodedMessage;
				const send = () => requestIdleCallback(() => sendToDevtools(ReactivityGraphRes.make({
					reactivityGraph: store[StoreInternalsSymbol].reactivityGraph.getSnapshot({ includeResults }),
					requestId: nanoid(10),
					clientId,
					sessionId,
					liveStoreVersion,
					subscriptionId
				})), { timeout: 500 });
				send();
				const throttledSend = throttle(send, 20);
				reactivityGraphSubcriptions.set(subscriptionId, store[StoreInternalsSymbol].reactivityGraph.subscribeToRefresh(throttledSend));
				break;
			}
			case "LSD.ClientSession.DebugInfoReq":
				sendToDevtools(DebugInfoRes.make({
					debugInfo: store[StoreInternalsSymbol].sqliteDbWrapper.debugInfo,
					requestId,
					clientId,
					sessionId,
					liveStoreVersion
				}));
				break;
			case "LSD.ClientSession.DebugInfoHistorySubscribe": {
				const { subscriptionId } = decodedMessage;
				const buffer = [];
				let hasStopped = false;
				let tickHandle;
				const tick = () => {
					buffer.push(store[StoreInternalsSymbol].sqliteDbWrapper.debugInfo);
					store[StoreInternalsSymbol].sqliteDbWrapper.debugInfo = emptyDebugInfo();
					if (buffer.length > 10) {
						sendToDevtools(DebugInfoHistoryRes.make({
							debugInfoHistory: buffer,
							requestId: nanoid(10),
							clientId,
							sessionId,
							liveStoreVersion,
							subscriptionId
						}));
						buffer.length = 0;
					}
					if (hasStopped === false) tickHandle = requestNextTick(tick);
				};
				tickHandle = requestNextTick(tick);
				const unsub = () => {
					hasStopped = true;
					if (tickHandle !== void 0) {
						cancelTick(tickHandle);
						tickHandle = void 0;
					}
				};
				debugInfoHistorySubscriptions.set(subscriptionId, unsub);
				break;
			}
			case "LSD.ClientSession.DebugInfoHistoryUnsubscribe": {
				const { subscriptionId } = decodedMessage;
				debugInfoHistorySubscriptions.get(subscriptionId)?.();
				debugInfoHistorySubscriptions.delete(subscriptionId);
				break;
			}
			case "LSD.ClientSession.DebugInfoResetReq":
				store[StoreInternalsSymbol].sqliteDbWrapper.debugInfo.slowQueries.clear();
				sendToDevtools(DebugInfoResetRes.make({
					requestId,
					clientId,
					sessionId,
					liveStoreVersion
				}));
				break;
			case "LSD.ClientSession.DebugInfoRerunQueryReq": {
				const { queryStr, bindValues, queriedTables } = decodedMessage;
				store[StoreInternalsSymbol].sqliteDbWrapper.cachedSelect(queryStr, bindValues, {
					queriedTables,
					skipCache: true
				});
				sendToDevtools(DebugInfoRerunQueryRes.make({
					requestId,
					clientId,
					sessionId,
					liveStoreVersion
				}));
				break;
			}
			case "LSD.ClientSession.ReactivityGraphUnsubscribe": {
				const { subscriptionId } = decodedMessage;
				reactivityGraphSubcriptions.get(subscriptionId)?.();
				reactivityGraphSubcriptions.delete(subscriptionId);
				break;
			}
			case "LSD.ClientSession.LiveQueriesSubscribe": {
				const { subscriptionId } = decodedMessage;
				const send = () => requestIdleCallback(() => sendToDevtools(LiveQueriesRes.make({
					liveQueries: [...store[StoreInternalsSymbol].activeQueries].map((q) => ({
						/** TODO: include schema metadata for schema-aware rendering in devtools (e.g., schema AST/hash/identifier or table+columns for QueryBuilder-derived queries). */
						_tag: q._tag,
						id: q.id,
						label: q.label,
						hash: q.def.hash,
						runs: q.runs,
						executionTimes: q.executionTimes.map((_) => Number(_.toString().slice(0, 5))),
						lastestResult: q.results$.previousResult === NOT_REFRESHED_YET ? "SYMBOL_NOT_REFRESHED_YET" : q.results$.previousResult,
						activeSubscriptions: Array.from(q.activeSubscriptions)
					})),
					requestId: nanoid(10),
					liveStoreVersion,
					clientId,
					sessionId,
					subscriptionId
				})), { timeout: 500 });
				send();
				const throttledSend = throttle(send, 20);
				liveQueriesSubscriptions.set(subscriptionId, store[StoreInternalsSymbol].reactivityGraph.subscribeToRefresh(throttledSend));
				break;
			}
			case "LSD.ClientSession.LiveQueriesUnsubscribe": {
				const { subscriptionId } = decodedMessage;
				liveQueriesSubscriptions.get(subscriptionId)?.();
				liveQueriesSubscriptions.delete(subscriptionId);
				break;
			}
			case "LSD.ClientSession.SyncHeadSubscribe": {
				const { subscriptionId } = decodedMessage;
				const send = (syncState) => sendToDevtools(SyncHeadRes.make({
					local: syncState.localHead,
					upstream: syncState.upstreamHead,
					requestId: nanoid(10),
					clientId,
					sessionId,
					liveStoreVersion,
					subscriptionId
				}));
				send(store[StoreInternalsSymbol].syncProcessor.syncState.pipe(runSync));
				syncHeadClientSessionSubscriptions.set(subscriptionId, store[StoreInternalsSymbol].syncProcessor.syncState.changes.pipe(tap$1((syncState) => sync(() => send(syncState))), runDrain, interruptible, tapCauseLogPretty, runCallbackWith(services)));
				break;
			}
			case "LSD.ClientSession.SyncHeadUnsubscribe": {
				const { subscriptionId } = decodedMessage;
				syncHeadClientSessionSubscriptions.get(subscriptionId)?.();
				syncHeadClientSessionSubscriptions.delete(subscriptionId);
				break;
			}
			case "LSD.ClientSession.Ping":
				if (isDevtoolsProtocolVersionSupported(decodedMessage.devtoolsProtocolVersion) === false) {
					sendToDevtools(VersionMismatch.make({
						requestId,
						clientId,
						sessionId,
						liveStoreVersion,
						appVersion: liveStoreVersion,
						receivedVersion: decodedMessage.liveStoreVersion,
						appDevtoolsProtocolVersion: devtoolsProtocolVersion,
						receivedDevtoolsProtocolVersion: resolveDevtoolsProtocolVersion(decodedMessage.devtoolsProtocolVersion)
					}));
					break;
				}
				sendToDevtools(Pong.make({
					requestId,
					clientId,
					sessionId,
					liveStoreVersion,
					devtoolsProtocolVersion
				}));
				break;
			default: console.warn(`[LSD.ClientSession] Unknown message`, decodedMessage);
		}
	};
	yield* storeDevtoolsChannel.listen.pipe(mapEffect(fromResult), tapSync((message) => onMessage(message)), runDrain, withSpan("LSD.devtools.onMessage"));
}, UnknownError.mapToUnknownError);
//#endregion
//#region ../../node_modules/.bun/@livestore+livestore@0.5.0-dev.0+4e44266562819145/node_modules/@livestore/livestore/dist/utils/data-structures.js
var ReferenceCountedSet = class {
	map;
	constructor() {
		this.map = /* @__PURE__ */ new Map();
	}
	add = (key) => {
		const count = this.map.get(key) ?? 0;
		this.map.set(key, count + 1);
	};
	remove = (key) => {
		const count = this.map.get(key) ?? 0;
		if (count === 1) this.map.delete(key);
		else this.map.set(key, count - 1);
	};
	has = (key) => {
		return this.map.has(key);
	};
	get size() {
		return this.map.size;
	}
	*[Symbol.iterator]() {
		for (const key of this.map.keys()) yield key;
	}
};
//#endregion
//#region ../../node_modules/.bun/@livestore+livestore@0.5.0-dev.0+4e44266562819145/node_modules/@livestore/livestore/dist/utils/dev.js
var downloadBlob = (data, fileName, mimeType = "application/octet-stream") => {
	const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
	const url = window.URL.createObjectURL(blob);
	downloadURL(url, fileName);
	setTimeout(() => window.URL.revokeObjectURL(url), 1e3);
};
var downloadURL = (data, fileName) => {
	const a = document.createElement("a");
	a.href = data;
	a.download = fileName;
	document.body.appendChild(a);
	a.style.display = "none";
	a.click();
	a.remove();
};
var exposeDebugUtils = () => {
	globalThis.__debugLiveStoreUtils = {
		downloadBlob,
		runSync: (effect) => runSync(effect),
		runFork: (effect) => runFork(effect),
		dumpDb: (db) => {
			const tables = db.select(`SELECT name FROM sqlite_master WHERE type='table'`);
			for (const table of tables) {
				const rows = db.select(`SELECT * FROM ${table.name}`);
				console.log(`Table: ${table.name} (${prettyBytes(table.name.length)}, ${rows.length} rows)`);
				console.table(rows);
			}
		}
	};
};
//#endregion
//#region ../../node_modules/.bun/@livestore+livestore@0.5.0-dev.0+4e44266562819145/node_modules/@livestore/livestore/dist/store/store.js
if (isDevEnv() === true) exposeDebugUtils();
/**
* Default parameters for the Store. Also used in `create-store.ts`
*/
var STORE_DEFAULT_PARAMS = {
	leaderPushBatchSize: 100,
	eventQueryBatchSize: 100
};
/**
* Central interface to a LiveStore database providing reactive queries, event commits, and sync.
*
* A `Store` instance wraps a local SQLite database that is kept in sync with other clients via
* an event log. Instead of mutating state directly, you commit events that get materialized
* into database rows. Queries automatically re-run when their underlying tables change.
*
* ## Creating a Store
*
* Use `createStore` (Effect-based) or `createStorePromise` to obtain a Store instance.
* In React applications, use `StoreRegistry` with `<StoreRegistryProvider>` and the `useStore()` hook
* which manages the Store lifecycle.
*
* ## Querying Data
*
* Use {@link Store.query} for one-shot reads or {@link Store.subscribe} for reactive subscriptions.
* Both accept query builders (e.g. `tables.todo.where({ complete: true })`) or custom `LiveQueryDef`s.
*
* ## Committing Events
*
* Use {@link Store.commit} to persist events. Events are immediately materialized locally and
* asynchronously synced to other clients. Multiple events can be committed atomically.
*
* ## Lifecycle
*
* The Store must be shut down when no longer needed via {@link Store.shutdown} or
* {@link Store.shutdownPromise}. Framework integrations (React, Effect) handle this automatically.
*
* @typeParam TSchema - The LiveStore schema defining tables and events
* @typeParam TContext - Optional user-defined context attached to the Store (e.g. for dependency injection)
*
* @example
* ```ts
* // Query data
* const todos = store.query(tables.todo.where({ complete: false }))
*
* // Subscribe to changes
* const unsubscribe = store.subscribe(tables.todo.all(), (todos) => {
*   console.log('Todos updated:', todos)
* })
*
* // Commit an event
* store.commit(events.todoCreated({ id: nanoid(), text: 'Buy milk' }))
* ```
*/
var Store = class extends Class {
	/** Unique identifier for this Store instance, stable for its lifetime. */
	storeId;
	/** The LiveStore schema defining tables, events, and materializers. */
	schema;
	/** User-defined context attached to this Store (e.g. for dependency injection). */
	context;
	/** Options provided to the Store constructor. */
	params;
	/**
	* Reactive connectivity updates emitted by the backing sync backend.
	*
	* @example
	* ```ts
	* import { Effect, Stream } from 'effect'
	*
	* const status = await store.networkStatus.pipe(Effect.runPromise)
	*
	* await store.networkStatus.changes.pipe(
	*   Stream.tap((next) => console.log('network status update', next)),
	*   Stream.runDrain,
	*   Effect.scoped,
	*   Effect.runPromise,
	* )
	* ```
	*/
	networkStatus;
	/**
	* Indicates how data is being stored.
	*
	* - `persisted`: Data is persisted to disk (e.g., via OPFS on web, SQLite file on native)
	* - `in-memory`: Data is only stored in memory and will be lost on page refresh
	*
	* The store operates in `in-memory` mode when persistent storage is unavailable,
	* such as in Safari/Firefox private browsing mode where OPFS is restricted.
	*
	* @example
	* ```tsx
	* if (store.storageMode === 'in-memory') {
	*   showWarning('Data will not be persisted in private browsing mode')
	* }
	* ```
	*/
	storageMode;
	/**
	* Store internals. Not part of the public API — shapes and semantics may change without notice.
	*/
	[StoreInternalsSymbol];
	constructor({ clientSession, schema, otelOptions, context, batchUpdates, storeId, effectContext, params, confirmUnsavedChanges, __runningInDevtools }) {
		super();
		this.storeId = storeId;
		this.schema = schema;
		this.context = context;
		this.params = params;
		this.networkStatus = clientSession.leaderThread.networkStatus;
		this.storageMode = clientSession.leaderThread.initialState.storageMode;
		const reactivityGraph = makeReactivityGraph();
		const stateHead = make$7({ dbState: clientSession.sqliteDb });
		const syncProcessor = makeClientSessionSyncProcessor({
			schema,
			clientSession,
			materializeEvent: fn("client-session-sync-processor:materialize-event")((eventEncoded, { materializerHashLeader }) => gen({ self: this }, function* () {
				const resolution = yield* resolveEventDef(schema, {
					operation: "@livestore/livestore:store:materializeEvent",
					event: eventEncoded
				});
				if (resolution._tag === "unknown") {
					yield* stateHead.set(eventEncoded.seqNum);
					return {
						writeTables: /* @__PURE__ */ new Set(),
						sessionChangeset: { _tag: "no-op" },
						materializerHash: none()
					};
				}
				const { eventDef, materializer } = resolution;
				const execArgsArr = getExecStatementsFromMaterializer({
					eventDef,
					materializer,
					dbState: this[StoreInternalsSymbol].sqliteDbWrapper,
					event: {
						decoded: void 0,
						encoded: eventEncoded
					}
				});
				const materializerHash = isDevEnv() === true ? some(hashMaterializerResults(execArgsArr)) : none();
				if (materializerHashLeader._tag === "Some" && materializerHash._tag === "Some" && materializerHashLeader.value !== materializerHash.value) return yield* MaterializerHashMismatchError.make({ eventName: eventEncoded.name });
				const span = yield* currentOtelSpan.pipe(orDie);
				const otelContext = import_src.trace.setSpan(import_src.context.active(), span);
				const writeTablesForEvent = /* @__PURE__ */ new Set();
				const exec = () => {
					for (const { statementSql, bindValues, writeTables = this[StoreInternalsSymbol].sqliteDbWrapper.getTablesUsed(statementSql) } of execArgsArr) {
						try {
							this[StoreInternalsSymbol].sqliteDbWrapper.cachedExecute(statementSql, bindValues, {
								otelContext,
								writeTables
							});
						} catch (cause) {
							throw UnknownError.make({
								cause,
								note: `Error executing materializer for event "${eventEncoded.name}".\nStatement: ${statementSql}\nBind values: ${JSON.stringify(bindValues)}`
							});
						}
						for (const table of writeTables) writeTablesForEvent.add(table);
						this[StoreInternalsSymbol].sqliteDbWrapper.debug.head = eventEncoded.seqNum;
					}
				};
				const sessionChangeset = this[StoreInternalsSymbol].sqliteDbWrapper.withChangeset(exec).changeset;
				yield* stateHead.set(eventEncoded.seqNum);
				return {
					writeTables: writeTablesForEvent,
					sessionChangeset,
					materializerHash
				};
			}).pipe(withSavepoint(clientSession.sqliteDb), mapError((cause) => MaterializeError.make({ cause })))),
			rollback: (changeset) => {
				this[StoreInternalsSymbol].sqliteDbWrapper.rollback(changeset);
			},
			refreshTables: (tables) => {
				const tablesToUpdate = [];
				for (const tableName of tables) {
					const tableRef = this[StoreInternalsSymbol].tableRefs[tableName];
					assertNever(tableRef !== void 0, `No table ref found for ${tableName}`);
					tablesToUpdate.push([tableRef, null]);
				}
				reactivityGraph.setRefs(tablesToUpdate);
			},
			params: { ...omitUndefineds({ leaderPushBatchSize: params.leaderPushBatchSize }) },
			confirmUnsavedChanges
		}).pipe(provideService(StateHead, stateHead), runSyncWith(effectContext.services));
		const tableRefs = {};
		const activeQueries = new ReferenceCountedSet();
		const commitsSpan = otelOptions.tracer.startSpan("LiveStore:commits", {}, otelOptions.rootSpanContext);
		const otelMuationsSpanContext = import_src.trace.setSpan(import_src.context.active(), commitsSpan);
		const queriesSpan = otelOptions.tracer.startSpan("LiveStore:queries", {}, otelOptions.rootSpanContext);
		const otelQueriesSpanContext = import_src.trace.setSpan(import_src.context.active(), queriesSpan);
		reactivityGraph.context = {
			store: this,
			defRcMap: /* @__PURE__ */ new Map(),
			reactivityGraph: new WeakRef(reactivityGraph),
			otelTracer: otelOptions.tracer,
			rootOtelContext: otelQueriesSpanContext,
			effectsWrapper: batchUpdates
		};
		const otelObj = {
			tracer: otelOptions.tracer,
			rootSpanContext: otelOptions.rootSpanContext,
			commitsSpanContext: otelMuationsSpanContext,
			queriesSpanContext: otelQueriesSpanContext
		};
		const allTableNames = new Set(__runningInDevtools === true ? this.schema.state.sqlite.tables.keys() : Array.from(this.schema.state.sqlite.tables.keys()).filter((_) => !isStateSystemTable(_)));
		const existingTableRefs = new Map(Array.from(reactivityGraph.atoms.values()).filter((_) => _._tag === "ref" && _.label?.startsWith("tableRef:") === true).map((_) => [_.label.slice(9), _]));
		for (const tableName of allTableNames) tableRefs[tableName] = existingTableRefs.get(tableName) ?? reactivityGraph.makeRef(null, {
			equal: () => false,
			label: `tableRef:${String(tableName)}`,
			meta: { liveStoreRefType: "table" }
		});
		const boot = gen({ self: this }, function* () {
			yield* addFinalizer(() => sync(() => {
				for (const tableRef of Object.values(tableRefs)) for (const superComp of tableRef.super) this[StoreInternalsSymbol].reactivityGraph.removeEdge(superComp, tableRef);
				commitsSpan.end();
				queriesSpan.end();
			}));
			yield* syncProcessor.boot;
		});
		const sqliteDbWrapper = new SqliteDbWrapper({
			otel: otelOptions,
			db: clientSession.sqliteDb
		});
		this[StoreInternalsSymbol] = {
			eventSchema: makeSchemaMemo(schema),
			clientSession,
			sqliteDbWrapper,
			effectContext,
			otel: otelObj,
			reactivityGraph,
			tableRefs,
			activeQueries,
			syncProcessor,
			boot,
			isShutdown: false
		};
		this.networkStatus = clientSession.leaderThread.networkStatus;
	}
	/**
	* Current session identifier for this Store instance.
	*
	* - Stable for the lifetime of the Store
	* - Useful for correlating events or scoping per-session data
	*/
	get sessionId() {
		return this[StoreInternalsSymbol].clientSession.sessionId;
	}
	/**
	* Stable client identifier for the process/device using this Store.
	*
	* - Shared across Store instances created by the same client
	* - Useful for diagnostics and multi-client correlation
	*/
	get clientId() {
		return this[StoreInternalsSymbol].clientSession.clientId;
	}
	checkShutdown = (operation) => {
		if (this[StoreInternalsSymbol].isShutdown === true) throw new UnknownError({
			cause: `Store has been shut down (while performing "${operation}").`,
			note: `You cannot perform this operation after the store has been shut down.`
		});
	};
	/**
	* Subscribe to the results of a query.
	*
	* - When providing an `onUpdate` callback it returns an {@link Unsubscribe} function.
	* - Without a callback it returns an {@link AsyncIterable} that yields query results.
	*
	* @example
	* ```ts
	* const unsubscribe = store.subscribe(query$, (result) => console.log(result))
	* ```
	*
	* @example
	* ```ts
	* for await (const result of store.subscribe(query$)) {
	*   console.log(result)
	* }
	* ```
	*/
	subscribe = ((query, onUpdateOrOptions, maybeOptions) => {
		if (typeof onUpdateOrOptions === "function") return this.subscribeWithCallback(query, onUpdateOrOptions, maybeOptions);
		return this.subscribeAsAsyncIterable(query, onUpdateOrOptions);
	});
	subscribeWithCallback = (query, onUpdate, options) => {
		this.checkShutdown("subscribe");
		return this[StoreInternalsSymbol].otel.tracer.startActiveSpan(`LiveStore.subscribe`, { attributes: {
			label: options?.label,
			queryLabel: isQueryBuilder(query) === true ? query.toString() : query.label
		} }, options?.otelContext ?? this[StoreInternalsSymbol].otel.queriesSpanContext, (span) => {
			const otelContext = import_src.trace.setSpan(import_src.context.active(), span);
			const queryRcRef = isQueryBuilder(query) === true ? queryDb(query).make(this[StoreInternalsSymbol].reactivityGraph.context) : query._tag === "def" || query._tag === "signal-def" ? query.make(this[StoreInternalsSymbol].reactivityGraph.context) : {
				value: query,
				deref: () => {}
			};
			const query$ = queryRcRef.value;
			const label = `subscribe:${options?.label}`;
			let suppressCallback = options?.skipInitialRun === true;
			const effect = this[StoreInternalsSymbol].reactivityGraph.makeEffect((get, _otelContext, debugRefreshReason) => {
				const result = get(query$.results$, otelContext, debugRefreshReason);
				if (suppressCallback === true) return;
				onUpdate(result);
			}, { label });
			const runInitialEffect = () => {
				effect.doEffect(otelContext, {
					_tag: "subscribe.initial",
					label: `subscribe-initial-run:${options?.label}`
				});
			};
			if (options?.stackInfo !== void 0) query$.activeSubscriptions.add(options.stackInfo);
			options?.onSubscribe?.(query$);
			this[StoreInternalsSymbol].activeQueries.add(query$);
			if (query$.isDestroyed === false) {
				if (suppressCallback === true) {
					runInitialEffect();
					suppressCallback = false;
				} else runInitialEffect();
			}
			const unsubscribe = () => {
				try {
					this[StoreInternalsSymbol].reactivityGraph.destroyNode(effect);
					this[StoreInternalsSymbol].activeQueries.remove(query$);
					if (options?.stackInfo !== void 0) query$.activeSubscriptions.delete(options.stackInfo);
					queryRcRef.deref();
					options?.onUnsubsubscribe?.();
				} finally {
					span.end();
				}
			};
			return unsubscribe;
		});
	};
	subscribeAsAsyncIterable = (query, options) => {
		this.checkShutdown("subscribe");
		return { [Symbol.asyncIterator]: () => {
			const services = this[StoreInternalsSymbol].effectContext.services;
			const runSync = runSyncWith(services);
			const runPromiseExit = runPromiseExitWith(services);
			let queue;
			let isDone$1 = false;
			let unsubscribe;
			const done = () => ({
				done: true,
				value: void 0
			});
			const isClosed = () => isDone$1;
			const isQueueDone = (cause) => {
				const error = findError(cause);
				return isSuccess(error) && isDone(error.success);
			};
			const ensureQueue = () => {
				queue ??= unbounded().pipe(runSync);
				return queue;
			};
			const emit = (value) => {
				if (isDone$1 === true) return;
				offerUnsafe(ensureQueue(), value);
			};
			const ensureSubscribed = () => {
				unsubscribe ??= this.subscribeWithCallback(query, emit, options);
			};
			const close = () => {
				if (isDone$1 === false) {
					isDone$1 = true;
					unsubscribe?.();
					unsubscribe = void 0;
					if (queue !== void 0) shutdown(queue).pipe(runSync);
				}
				return done();
			};
			return {
				next: async () => {
					if (isDone$1 === true) return done();
					ensureSubscribed();
					const exit = await runPromiseExit(take(ensureQueue()));
					if (isSuccess$1(exit) === true) return {
						done: false,
						value: exit.value
					};
					if (isClosed() === true || isQueueDone(exit.cause) === true) return done();
					throw squash(exit.cause);
				},
				return: () => Promise.resolve(close()),
				throw: (cause) => {
					close();
					return Promise.reject(cause);
				}
			};
		} };
	};
	subscribeStream = (query, options) => callback((emit) => gen({ self: this }, function* () {
		const otelSpan = yield* currentOtelSpan.pipe(catchTag("NoSuchElementError", () => void_$1));
		const otelContext = otelSpan !== void 0 ? import_src.trace.setSpan(import_src.context.active(), otelSpan) : import_src.context.active();
		yield* acquireRelease(sync(() => this.subscribe(query, (result) => {
			offerUnsafe(emit, result);
		}, {
			...options,
			otelContext
		})), (unsub) => sync(() => unsub()));
	}));
	/**
	* Synchronously queries the database without creating a LiveQuery.
	* This is useful for queries that don't need to be reactive.
	*
	* Example: Query builder
	* ```ts
	* const completedTodos = store.query(tables.todo.where({ complete: true }))
	* ```
	*
	* Example: Raw SQL query
	* ```ts
	* const completedTodos = store.query({ query: 'SELECT * FROM todo WHERE complete = 1', bindValues: {} })
	* ```
	*/
	query = (query, options) => {
		this.checkShutdown("query");
		if (typeof query === "object" && "query" in query && "bindValues" in query) {
			const res = this[StoreInternalsSymbol].sqliteDbWrapper.cachedSelect(query.query, prepareBindValues(query.bindValues, query.query), { ...omitUndefineds({ otelContext: options?.otelContext }) });
			if (query.schema !== void 0) return decodeUnknownSync(query.schema)(res);
			return res;
		} else if (isQueryBuilder(query) === true) {
			const ast = query[QueryBuilderAstSymbol];
			if (ast._tag === "RowQuery") makeExecBeforeFirstRun({
				table: ast.tableDef,
				id: ast.id,
				explicitDefaultValues: ast.explicitDefaultValues,
				otelContext: options?.otelContext
			})(this[StoreInternalsSymbol].reactivityGraph.context);
			const sqlRes = query.asSql();
			const schema = getResultSchema(query);
			const resolvedBindValues = sqlRes.bindValues === void 0 ? void 0 : resolveSessionIdSymbolInBindValues(sqlRes.bindValues, this[StoreInternalsSymbol].clientSession.sessionId);
			const rawRes = this[StoreInternalsSymbol].sqliteDbWrapper.cachedSelect(sqlRes.query, resolvedBindValues === void 0 ? void 0 : prepareBindValues(resolvedBindValues, sqlRes.query), {
				...omitUndefineds({ otelContext: options?.otelContext }),
				queriedTables: /* @__PURE__ */ new Set([query[QueryBuilderAstSymbol].tableDef.sqliteDef.name])
			});
			const decodeResult$1 = decodeResult(schema)(rawRes);
			if (isSuccess(decodeResult$1) === true) return decodeResult$1.success;
			else return shouldNeverHappen("Failed to decode query result with for schema:", objectToString(schema), "raw result:", rawRes, "decode error:", decodeResult$1.failure);
		} else if (query._tag === "def") {
			const query$ = query.make(this[StoreInternalsSymbol].reactivityGraph.context);
			const result = this.query(query$.value, options);
			query$.deref();
			return result;
		} else if (query._tag === "signal-def") return query.make(this[StoreInternalsSymbol].reactivityGraph.context).value.get();
		else return query.run({ ...omitUndefineds({
			otelContext: options?.otelContext,
			debugRefreshReason: options?.debugRefreshReason
		}) });
	};
	/**
	* Set the value of a signal
	*
	* @example
	* ```ts
	* const count$ = signal(0, { label: 'count$' })
	* store.setSignal(count$, 2)
	* ```
	*
	* @example
	* ```ts
	* const count$ = signal(0, { label: 'count$' })
	* store.setSignal(count$, (prev) => prev + 1)
	* ```
	*/
	setSignal = (signalDef, value) => {
		this.checkShutdown("setSignal");
		const signalRef = signalDef.make(this[StoreInternalsSymbol].reactivityGraph.context);
		const newValue = typeof value === "function" ? value(signalRef.value.get()) : value;
		signalRef.value.set(newValue);
		if (signalRef.rc > 1) signalRef.deref();
	};
	/**
	* Commit a list of events to the store which will immediately update the local database
	* and sync the events across other clients (similar to a `git commit`).
	*
	* @example
	* ```ts
	* store.commit(events.todoCreated({ id: nanoid(), text: 'Make coffee' }))
	* ```
	*
	* You can call `commit` with multiple events to apply them in a single database transaction.
	*
	* @example
	* ```ts
	* const todoId = nanoid()
	* store.commit(
	*   events.todoCreated({ id: todoId, text: 'Make coffee' }),
	*   events.todoCompleted({ id: todoId }))
	* ```
	*
	* For more advanced transaction scenarios, you can pass a synchronous function to `commit` which will receive a callback
	* to which you can pass multiple events to be committed in the same database transaction.
	* Under the hood this will simply collect all events and apply them in a single database transaction.
	*
	* @example
	* ```ts
	* store.commit((commit) => {
	*   const todoId = nanoid()
	*   if (Math.random() > 0.5) {
	*     commit(events.todoCreated({ id: todoId, text: 'Make coffee' }))
	*   } else {
	*     commit(events.todoCompleted({ id: todoId }))
	*   }
	* })
	* ```
	*
	* When committing a large batch of events, you can also skip the database refresh to improve performance
	* and call `store.manualRefresh()` after all events have been committed.
	*
	* @example
	* ```ts
	* const todos = [
	*   { id: nanoid(), text: 'Make coffee' },
	*   { id: nanoid(), text: 'Buy groceries' },
	*   // ... 1000 more todos
	* ]
	* for (const todo of todos) {
	*   store.commit({ skipRefresh: true }, events.todoCreated({ id: todo.id, text: todo.text }))
	* }
	* store.manualRefresh()
	* ```
	*/
	commit = (firstEventOrTxnFnOrOptions, ...restEvents) => {
		this.checkShutdown("commit");
		const { events, options } = this.getCommitArgs(firstEventOrTxnFnOrOptions, restEvents);
		gen({ self: this }, function* () {
			const commitsSpan = import_src.trace.getSpan(this[StoreInternalsSymbol].otel.commitsSpanContext);
			commitsSpan?.addEvent("commit");
			const currentSpan = yield* currentOtelSpan.pipe(orDie);
			commitsSpan?.addLink({ context: currentSpan.spanContext() });
			if (events.length === 0) return;
			const localServices = yield* context();
			const encodedEvents = yield* this[StoreInternalsSymbol].syncProcessor.encodeEvents(events);
			const { writeTables } = yield* try_({
				try: () => {
					const materialize = () => this[StoreInternalsSymbol].syncProcessor.materializeEvents(encodedEvents).pipe(runSyncWith(localServices));
					return events.length > 1 ? this[StoreInternalsSymbol].sqliteDbWrapper.txn(materialize) : materialize();
				},
				catch: (cause) => UnknownError.make({ cause })
			});
			yield* this[StoreInternalsSymbol].syncProcessor.push(encodedEvents);
			const tablesToUpdate = [];
			for (const tableName of writeTables) {
				const tableRef = this[StoreInternalsSymbol].tableRefs[tableName];
				assertNever(tableRef !== void 0, `No table ref found for ${tableName}`);
				tablesToUpdate.push([tableRef, null]);
			}
			const debugRefreshReason = {
				_tag: "commit",
				events,
				writeTables: Array.from(writeTables)
			};
			const skipRefresh = options?.skipRefresh ?? false;
			this[StoreInternalsSymbol].reactivityGraph.setRefs(tablesToUpdate, {
				debugRefreshReason,
				skipRefresh,
				otelContext: import_src.trace.setSpan(import_src.context.active(), currentSpan)
			});
		}).pipe(withSpan("LiveStore:commit", {
			root: true,
			attributes: {
				"livestore.eventsCount": events.length,
				"livestore.eventTags": events.map((_) => _.name),
				...options?.label && { "livestore.commitLabel": options.label }
			},
			links: [makeSpanLink({ context: import_src.trace.getSpanContext(this[StoreInternalsSymbol].otel.commitsSpanContext) }), ...options?.spanLinks?.map(makeSpanLink) ?? []]
		}), tapCause(logError), catchCause((cause) => forkChild(this.shutdown(cause))), runSyncWith(this[StoreInternalsSymbol].effectContext.services));
	};
	/**
	* Returns an async iterable of events from the eventlog.
	* Currently only events confirmed by the sync backend is supported.
	*
	* Defaults to tracking upstreamHead as it advances. If an `until` event is
	* supplied the stream finalizes upon reaching it.
	*
	* To start streaming from a specific point in the eventlog
	* you can provide a `since` event.
	*
	* Allows filtering by:
	*  - `filter`: event types
	*  - `clientIds`: client identifiers
	*  - `sessionIds`: session identifiers
	*
	* The batchSize option controls the maximum amount of events that are fetched
	* from the eventlog in each query. Defaults to 100 and has a max allowed
	* value of 1000.
	*
	* TODO:
	* - Support streaming unconfirmed events
	*  - Leader level
	*  - Session level
	* - Support streaming client-only events
	*
	* @example
	* ```ts
	* // Stream todoCompleted events from the start
	* for await (const event of store.events(filter: ['todoCompleted'])) {
	*   console.log(event)
	* }
	* ```
	*
	* @example
	* ```ts
	* // Start streaming from a specific event
	* for await (const event of store.events({ since: EventSequenceNumber.Client.fromString('e3') })) {
	*   console.log(event)
	* }
	* ```
	*/
	events = (options) => {
		const stream = this.eventsStream(options);
		return { async *[Symbol.asyncIterator]() {
			const iterator = toAsyncIterable(stream);
			for await (const event of iterator) yield event;
		} };
	};
	/**
	* Returns an Effect Stream of events from the eventlog.
	* See `store.events` for details on options and behaviour.
	*/
	eventsStream = (options) => {
		const { clientSession } = this[StoreInternalsSymbol];
		const eventSchema = makeSchema(this.schema);
		const preferredBatchSize = options?.batchSize ?? this.params.eventQueryBatchSize ?? STORE_DEFAULT_PARAMS.eventQueryBatchSize;
		const baseOptions = {
			...options,
			filter: options?.filter,
			batchSize: preferredBatchSize
		};
		return clientSession.leaderThread.events.stream(baseOptions).pipe(mapEffect((event) => decodeEffect(eventSchema)(event)), catchTag$1("SchemaError", (cause) => fail$1(UnknownError.make({ cause }))), tapError((error) => logError("Error in eventsStream", error)));
	};
	/**
	* Returns the current synchronization status of the store.
	*
	* This is a synchronous operation that returns the sync state between the
	* client session and the leader thread. Use this to display sync indicators
	* or check if local changes have been pushed to the leader.
	*
	* @example
	* ```ts
	* const status = store.syncStatus()
	* console.log(status.isSynced ? 'Synced' : `${status.pendingCount} pending`)
	* ```
	*
	* @example
	* ```ts
	* // Health check for backend connectivity
	* const status = store.syncStatus()
	* if (!status.isSynced && status.pendingCount > 100) {
	*   console.warn('Large backlog of unsynced events')
	* }
	* ```
	*/
	syncStatus = () => {
		this.checkShutdown("syncStatus");
		const syncState = this[StoreInternalsSymbol].syncProcessor.syncState.pipe(runSync);
		const pendingCount = syncState.pending.length;
		return {
			localHead: toString(syncState.localHead),
			upstreamHead: toString(syncState.upstreamHead),
			pendingCount,
			isSynced: pendingCount === 0
		};
	};
	/**
	* Returns an Effect Stream of sync status updates.
	*
	* Emits the current status immediately and then whenever the sync state changes.
	* Use this for Effect-based workflows or when you need more control over the stream.
	*
	* @example
	* ```ts
	* store.syncStatusStream().pipe(
	*   Stream.tap((status) => Effect.log(`Sync status: ${status.isSynced}`)),
	*   Stream.runDrain,
	* )
	* ```
	*/
	syncStatusStream = () => {
		const syncStateSubscribable = this[StoreInternalsSymbol].syncProcessor.syncState;
		return concat(fromEffect(syncStateSubscribable.pipe(map(this.makeSyncStatus))), syncStateSubscribable.changes.pipe(map$1(this.makeSyncStatus)));
	};
	/**
	* Subscribes to sync status changes.
	*
	* The callback is invoked immediately with the current status and then
	* whenever the sync state changes (e.g., when events are pushed or confirmed).
	*
	* @param onUpdate - Callback invoked with the current sync status
	* @returns Unsubscribe function to stop receiving updates
	*
	* @example
	* ```ts
	* const unsubscribe = store.subscribeSyncStatus((status) => {
	*   updateUI(status.isSynced ? 'Synced' : 'Syncing...')
	* })
	*
	* // Later, stop listening
	* unsubscribe()
	* ```
	*/
	subscribeSyncStatus = (onUpdate) => {
		this.checkShutdown("subscribeSyncStatus");
		const fiber = this.syncStatusStream().pipe(tap$1((status) => sync(() => onUpdate(status))), runDrain, this.runEffectFork);
		return () => {
			interrupt(fiber).pipe(runForkWith(this[StoreInternalsSymbol].effectContext.services));
		};
	};
	makeSyncStatus = (syncState) => {
		const pendingCount = syncState.pending.length;
		return {
			localHead: toString(syncState.localHead),
			upstreamHead: toString(syncState.upstreamHead),
			pendingCount,
			isSynced: pendingCount === 0
		};
	};
	/**
	* This can be used in combination with `skipRefresh` when committing events.
	* We might need a better solution for this. Let's see.
	*/
	manualRefresh = (options) => {
		this.checkShutdown("manualRefresh");
		const { label } = options ?? {};
		this[StoreInternalsSymbol].otel.tracer.startActiveSpan("LiveStore:manualRefresh", { attributes: { "livestore.manualRefreshLabel": label } }, this[StoreInternalsSymbol].otel.commitsSpanContext, (span) => {
			const otelContext = import_src.trace.setSpan(import_src.context.active(), span);
			this[StoreInternalsSymbol].reactivityGraph.runDeferredEffects({ otelContext });
			span.end();
		});
	};
	/**
	* Shuts down the store and closes the client session.
	*
	* This is called automatically when the store was created using the React or Effect API.
	*/
	shutdownPromise = async (cause) => {
		this.checkShutdown("shutdownPromise");
		this[StoreInternalsSymbol].isShutdown = true;
		await this.shutdown(cause !== void 0 ? fail(cause) : void 0).pipe(this.runEffectFork, join, runPromise);
	};
	/**
	* Shuts down the store and closes the client session.
	*
	* This is called automatically when the store was created using the React or Effect API.
	*/
	shutdown = (cause) => {
		this[StoreInternalsSymbol].isShutdown = true;
		return this[StoreInternalsSymbol].clientSession.shutdown(cause !== void 0 ? failCause(cause) : succeed(IntentionalShutdownCause.make({ reason: "manual" })));
	};
	/**
	* Helper methods useful during development
	*
	* @internal
	*/
	_dev = {
		downloadDb: (source = "local") => {
			gen({ self: this }, function* () {
				downloadBlob(source === "local" ? this[StoreInternalsSymbol].sqliteDbWrapper.export() : yield* this[StoreInternalsSymbol].clientSession.leaderThread.export, `livestore-${Date.now()}.db`);
			}).pipe(this.runEffectFork);
		},
		downloadEventlogDb: () => {
			gen({ self: this }, function* () {
				downloadBlob(yield* this[StoreInternalsSymbol].clientSession.leaderThread.getEventlogData, `livestore-eventlog-${Date.now()}.db`);
			}).pipe(this.runEffectFork);
		},
		hardReset: (mode = "all-data") => {
			gen({ self: this }, function* () {
				const clientId = this[StoreInternalsSymbol].clientSession.clientId;
				yield* this[StoreInternalsSymbol].clientSession.leaderThread.sendDevtoolsMessage(ResetAllData.Request.make({
					liveStoreVersion,
					mode,
					requestId: nanoid(),
					clientId
				}));
			}).pipe(this.runEffectFork);
		},
		overrideNetworkStatus: (status) => {
			const clientId = this[StoreInternalsSymbol].clientSession.clientId;
			this[StoreInternalsSymbol].clientSession.leaderThread.sendDevtoolsMessage(SetSyncLatch.Request.make({
				clientId,
				closeLatch: status === "offline",
				liveStoreVersion,
				requestId: nanoid()
			})).pipe(this.runEffectFork);
		},
		syncStates: () => gen({ self: this }, function* () {
			return {
				session: yield* this[StoreInternalsSymbol].syncProcessor.syncState,
				leader: yield* this[StoreInternalsSymbol].clientSession.leaderThread.syncState
			};
		}).pipe(this.runEffectPromise),
		printSyncStates: () => {
			gen({ self: this }, function* () {
				const session = yield* this[StoreInternalsSymbol].syncProcessor.syncState;
				yield* log(`Session sync state: ${objectToString(session.localHead)} (upstream: ${objectToString(session.upstreamHead)})`, session.toJSON());
				const leader = yield* this[StoreInternalsSymbol].clientSession.leaderThread.syncState;
				yield* log(`Leader sync state: ${objectToString(leader.localHead)} (upstream: ${objectToString(leader.upstreamHead)})`, leader.toJSON());
			}).pipe(this.runEffectFork);
		},
		version: liveStoreVersion,
		otel: { rootSpanContext: () => import_src.trace.getSpan(this[StoreInternalsSymbol].otel.rootSpanContext)?.spanContext() }
	};
	toJSON = () => ({
		_tag: "livestore.Store",
		reactivityGraph: this[StoreInternalsSymbol].reactivityGraph.getSnapshot({ includeResults: true })
	});
	runEffectFork = (effect) => effect.pipe(forkIn(this[StoreInternalsSymbol].effectContext.lifetimeScope), tapCauseLogPretty, runForkWith(this[StoreInternalsSymbol].effectContext.services));
	runEffectPromise = (effect) => effect.pipe(tapCauseLogPretty, runPromiseWith(this[StoreInternalsSymbol].effectContext.services));
	getCommitArgs = (firstEventOrTxnFnOrOptions, restEvents) => {
		let events;
		let options;
		if (typeof firstEventOrTxnFnOrOptions === "function") events = firstEventOrTxnFnOrOptions((arg) => events.push(arg));
		else if (firstEventOrTxnFnOrOptions?.label !== void 0 || firstEventOrTxnFnOrOptions?.skipRefresh !== void 0 || firstEventOrTxnFnOrOptions?.otelContext !== void 0 || firstEventOrTxnFnOrOptions?.spanLinks !== void 0) {
			options = firstEventOrTxnFnOrOptions;
			events = restEvents;
		} else if (firstEventOrTxnFnOrOptions === void 0) events = [];
		else events = [firstEventOrTxnFnOrOptions, ...restEvents];
		return {
			events,
			options
		};
	};
};
//#endregion
//#region ../../node_modules/.bun/@livestore+livestore@0.5.0-dev.0+4e44266562819145/node_modules/@livestore/livestore/dist/store/create-store.js
/**
* Hard upper bound (ms) for the detached shutdown drain. A dead/unresponsive leader must not keep
* the drain (and therefore the lifetime scope) alive forever; after this bound the scope is
* force-closed. Kept comfortably above the 1s caller-side soft wait so that a still-progressing
* in-flight leader push is allowed to finish rather than being interrupted.
*/
var SHUTDOWN_DRAIN_HARD_TIMEOUT_MS = 3e4;
/**
* @deprecated Use `makeStoreContext()` from `@livestore/livestore/effect` instead.
* This service doesn't preserve schema types. See the Effect integration docs for migration.
*
* @example Migration
* ```ts
* // Before (untyped)
* import { LiveStoreContextRunning } from '@livestore/livestore/effect'
* const { store } = yield* LiveStoreContextRunning
*
* // After (typed)
* import { makeStoreContext } from '@livestore/livestore/effect'
* const AppStore = makeStoreContext<typeof schema>()('app')
* const { store } = yield* AppStore.Tag
* ```
*/
var LiveStoreContextRunning = class LiveStoreContextRunning extends Service()("@livestore/livestore/effect/LiveStoreContextRunning") {
	static fromDeferred = gen(function* () {
		const deferred = yield* DeferredStoreContext;
		const ctx = yield* _await(deferred);
		return succeed$1(LiveStoreContextRunning, LiveStoreContextRunning.of(ctx));
	}).pipe(unwrap);
};
/**
* @deprecated Use `StoreContext.DeferredTag` from `makeStoreContext()` instead.
*/
var DeferredStoreContext = class extends Service()("@livestore/livestore/effect/DeferredStoreContext") {};
var createStore = ({ schema, adapter, storeId, context: context$1 = {}, boot, batchUpdates, disableDevtools, onBootStatus, shutdownDeferred, params, debug, confirmUnsavedChanges = true, syncPayload, syncPayloadSchema }) => gen(function* () {
	const lifetimeScope = yield* make$3();
	yield* validateStoreId(storeId);
	yield* addFinalizer((_) => close(lifetimeScope, _));
	const debugInstanceId = debug?.instanceId ?? nanoid(10);
	const resolvedSyncPayloadSchema = syncPayloadSchema ?? Json;
	return yield* gen(function* () {
		const span = yield* currentOtelSpan.pipe(orDie);
		const otelRootSpanContext = import_src.trace.setSpan(import_src.context.active(), span);
		const otelTracer = yield* OtelTracer;
		const bootStatusQueue = yield* acquireRelease(unbounded(), shutdown);
		yield* take(bootStatusQueue).pipe(tapSync$1((status) => onBootStatus?.(status)), tap((status) => status.stage === "done" ? shutdown(bootStatusQueue).pipe(asVoid) : void_$1), forever, tapCauseLogPretty, forkScoped);
		const storeDeferred = yield* make$4();
		const connectDevtoolsToStore_ = (storeDevtoolsChannel) => gen(function* () {
			yield* connectDevtoolsToStore({
				storeDevtoolsChannel,
				store: yield* _await(storeDeferred)
			});
		});
		const services = yield* context();
		let shutdownSyncProcessor;
		const shutdown$1 = (exit) => gen(function* () {
			const closeFiber = yield* (shutdownSyncProcessor?.(exit) ?? void_$1).pipe(timeout(SHUTDOWN_DRAIN_HARD_TIMEOUT_MS), catchTag("TimeoutError", () => logError(`@livestore/livestore:shutdown: drain exceeded hard bound of ${SHUTDOWN_DRAIN_HARD_TIMEOUT_MS}ms; forcing scope close`)), ensuring(close(lifetimeScope, exit)), forkDetach);
			yield* join(closeFiber).pipe(logWarnIfTakesLongerThan({
				label: "@livestore/livestore:shutdown",
				duration: 500
			}), timeout(1e3), catchTag("TimeoutError", () => logError("@livestore/livestore:shutdown: Timed out after 1 second")));
			if (shutdownDeferred !== void 0) yield* done(shutdownDeferred, exit);
			yield* logDebug("LiveStore shutdown complete");
		}).pipe(withSpan("@livestore/livestore:shutdown"), provide$1(services), tapCauseLogPretty, runFork, join);
		const syncPayloadEncoded = syncPayload === void 0 ? void 0 : yield* encodeEffect(resolvedSyncPayloadSchema)(syncPayload).pipe(UnknownError.mapToUnknownError);
		const clientSession = yield* adapter({
			schema,
			storeId,
			devtoolsEnabled: getDevtoolsEnabled(disableDevtools),
			bootStatusQueue,
			shutdown: shutdown$1,
			connectDevtoolsToStore: connectDevtoolsToStore_,
			debugInstanceId,
			syncPayloadSchema: resolvedSyncPayloadSchema,
			syncPayloadEncoded
		}).pipe(withPerformanceMeasure("livestore:makeAdapter"), withSpan("createStore:makeAdapter"));
		if (LS_DEV === true && clientSession.leaderThread.initialState.migrationsReport.migrations.length > 0) yield* logDebug("[@livestore/livestore:createStore] migrationsReport", ...clientSession.leaderThread.initialState.migrationsReport.migrations.map((m) => m.hashes.actual === void 0 ? `Table '${m.tableName}' doesn't exist yet. Creating table...` : `Schema hash mismatch for table '${m.tableName}' (DB: ${m.hashes.actual}, expected: ${m.hashes.expected}), migrating table...`));
		const store = new Store({
			clientSession,
			schema,
			context: context$1,
			otelOptions: {
				tracer: otelTracer,
				rootSpanContext: otelRootSpanContext
			},
			effectContext: {
				lifetimeScope,
				services
			},
			__runningInDevtools: !getDevtoolsEnabled(disableDevtools),
			confirmUnsavedChanges,
			batchUpdates: (run) => run(),
			storeId,
			params: {
				leaderPushBatchSize: params?.leaderPushBatchSize ?? STORE_DEFAULT_PARAMS.leaderPushBatchSize,
				eventQueryBatchSize: params?.eventQueryBatchSize ?? STORE_DEFAULT_PARAMS.eventQueryBatchSize
			}
		});
		shutdownSyncProcessor = store[StoreInternalsSymbol].syncProcessor.shutdown;
		yield* store[StoreInternalsSymbol].boot;
		if (boot !== void 0) yield* trySyncOrPromiseOrEffect(() => boot(store, {
			migrationsReport: clientSession.leaderThread.initialState.migrationsReport,
			parentSpan: span
		})).pipe(UnknownError.mapToUnknownError, provide$1(succeed$1(LiveStoreContextRunning, LiveStoreContextRunning.of({
			stage: "running",
			store
		}))), withSpan("createStore:boot"));
		yield* yieldNow;
		if (batchUpdates !== void 0) store[StoreInternalsSymbol].reactivityGraph.context.effectsWrapper = batchUpdates;
		yield* succeed$2(storeDeferred, store);
		globalThis.__debugLiveStore ??= {};
		globalThis.__debugLiveStore[storeId] = store;
		yield* addFinalizer(() => sync(() => {
			delete globalThis.__debugLiveStore?.[storeId];
		}));
		return store;
	}).pipe(withSpan("createStore", { attributes: {
		debugInstanceId,
		storeId
	} }), annotateLogs({
		debugInstanceId,
		storeId
	}), LS_DEV === true ? withAsyncTaggingTracing((name) => console.createTask(name)) : identity, provide$2(lifetimeScope));
});
var validateStoreId = (storeId) => gen(function* () {
	if (/^[a-zA-Z0-9_-]+$/.test(storeId) === false) return yield* UnknownError.make({
		cause: `Invalid storeId: ${storeId}. Only alphanumeric characters, underscores, and hyphens are allowed.`,
		payload: { storeId }
	});
});
var getDevtoolsEnabled = (disableDevtools) => {
	if (disableDevtools === true || disableDevtools === false) return !disableDevtools;
	if (isDevEnv() === true) return true;
	return false;
};
//#endregion
//#region ../../node_modules/.bun/@livestore+livestore@0.5.0-dev.0+4e44266562819145/node_modules/@livestore/livestore/dist/store/StoreRegistry.js
/**
* Default time to keep unused stores in cache.
*
* - Browser: 60 seconds (60,000 ms)
* - SSR: Infinity (disables disposal to avoid disposing stores before server render completes)
*
* @internal Exported primarily for testing purposes.
*/
var DEFAULT_UNUSED_CACHE_TIME = typeof window === "undefined" ? Number.POSITIVE_INFINITY : 6e4;
/**
* RcMap cache key that uses storeId for equality/hashing but carries full options.
* This allows RcMap to deduplicate by storeId while the lookup function has access to all options.
*
* @remarks
* Only `storeId` is used for equality and hashing. This means if `getOrLoadPromise` is called
* with different options (e.g., different `adapter`) but the same `storeId`, the cached store
* from the first call will be returned. This is intentional - a store's identity is determined
* solely by its `storeId`, and callers should not expect to get different stores by varying
* other options while keeping the same `storeId`.
*/
var StoreCacheKey = class StoreCacheKey {
	options;
	constructor(options) {
		this.options = options;
	}
	/**
	* Equality is based solely on `storeId`. Other options in `RegistryStoreOptions` are ignored
	* for cache key comparison. The first options used for a given `storeId` determine the
	* store's configuration.
	*/
	[symbol](that) {
		return that instanceof StoreCacheKey && this.options.storeId === that.options.storeId;
	}
	[symbol$1]() {
		return string(this.options.storeId);
	}
};
/**
* Store Registry coordinating store loading, caching, and retention
*
* @public
*/
var StoreRegistry = class {
	/**
	* Reference-counted cache mapping storeId to Store instances.
	* Stores are created on first access and disposed after `unusedCacheTime` when all references are released.
	*/
	#rcMap;
	/**
	* Effect context providing Scope and OtelTracer for all registry operations.
	* When the context's scope closes, all managed stores are automatically shut down.
	*/
	#context;
	/**
	* Disposal callback for the runtime created by the registry.
	* Undefined when caller provided their own services (caller owns cleanup in that case).
	*/
	#disposeOwnedRuntime;
	/**
	* In-flight loading promises keyed by storeId.
	* Ensures concurrent `getOrLoadPromise` calls receive the same Promise reference.
	*/
	#loadingPromises = /* @__PURE__ */ new Map();
	/**
	* Creates a new StoreRegistry instance.
	*
	* @example
	* ```ts
	* const registry = new StoreRegistry({
	*   defaultOptions: {
	*     batchUpdates,
	*     unusedCacheTime: 30_000,
	*   }
	* })
	* ```
	*/
	constructor(config = {}) {
		if (config.context !== void 0) this.#context = config.context;
		else {
			const ownedRuntime = make$1(mergeAll(effect(Scope, scope), OtelLiveDummy));
			this.#context = ownedRuntime.contextEffect.pipe(runSync);
			this.#disposeOwnedRuntime = () => ownedRuntime.dispose();
		}
		this.#rcMap = make$8({
			lookup: ({ options }) => {
				const mergedOptions = {
					...config.defaultOptions,
					...options
				};
				return createStore(mergedOptions).pipe(catchDefect((cause) => UnknownError.make({ cause })), withSpan(`StoreRegistry.lookup:${mergedOptions.storeId}`), provide$1(mergeAll(mergedOptions.logger ?? empty, succeed$1(MinimumLogLevel, mergedOptions.logLevel ?? (isDevEnv() === true ? "Debug" : "Info")))), provideOtel(omitUndefineds({
					parentSpanContext: mergedOptions.otelOptions?.rootSpanContext,
					otelTracer: mergedOptions.otelOptions?.tracer
				})));
			},
			idleTimeToLive: ({ options }) => options.unusedCacheTime ?? config.defaultOptions?.unusedCacheTime ?? DEFAULT_UNUSED_CACHE_TIME
		}).pipe(runSyncWith(this.#context));
	}
	/**
	* Gets a cached store or loads a new one, with the store lifetime scoped to the caller.
	*
	* @typeParam TSchema - The schema type for the store
	* @typeParam TContext - The context type for the store
	* @typeParam TSyncPayloadSchema - The sync payload schema type
	* @returns An Effect that yields the store, scoped to the provided Scope
	*
	* @remarks
	* - Stores are kept in cache and reused while any scope holds them
	* - When the scope closes, the reference is released; the store is disposed after `unusedCacheTime`
	*   if no other scopes retain it
	* - Concurrent calls with the same storeId share the same store instance
	*/
	getOrLoad = (options) => gen({ self: this }, function* () {
		const key = new StoreCacheKey(options);
		return yield* get$1(this.#rcMap, key);
	}).pipe(withSpan(`StoreRegistry.getOrLoad:${options.storeId}`));
	/**
	* Get or load a store, returning it directly if already loaded or a promise if loading.
	*
	* @typeParam TSchema - The schema type for the store
	* @typeParam TContext - The context type for the store
	* @typeParam TSyncPayloadSchema - The sync payload schema type
	* @returns The loaded store if available, or a Promise that resolves to the loaded store
	* @throws unknown - store loading error
	*
	* @remarks
	* - Returns the store instance directly (synchronous) when already loaded
	* - Returns a stable Promise reference when loading is in progress or needs to be initiated
	* - Throws with the same error instance on subsequent calls after failure
	* - Applies default options from registry config, with call-site options taking precedence
	* - Concurrent calls with the same storeId share the same store instance
	*/
	getOrLoadPromise = (options) => {
		const exit = this.getOrLoad(options).pipe(scoped, runSyncExitWith(this.#context));
		if (isSuccess$1(exit) === true) return exit.value;
		const defect = findDefect(exit.cause);
		if (isFailure(defect) === true) throw squash(exit.cause);
		if (isAsyncFiberError(defect.success) === false) throw squash(exit.cause);
		const { storeId } = options;
		const cached = this.#loadingPromises.get(storeId);
		if (cached !== void 0) return cached;
		const fiber = defect.success.fiber;
		const promise = join(fiber).pipe(runPromiseWith(this.#context)).finally(() => this.#loadingPromises.delete(storeId));
		this.#loadingPromises.set(storeId, promise);
		return promise;
	};
	/**
	* Retains the store in cache.
	*
	* @typeParam TSchema - The schema type for the store
	* @typeParam TContext - The context type for the store
	* @typeParam TSyncPayloadSchema - The sync payload schema type
	* @returns A release function that, when called, removes this retention hold
	*
	* @remarks
	* - Multiple retains on the same store are independent; each must be released separately
	* - If the store isn't cached yet, it will be loaded and then retained
	* - The store will remain in cache until all retains are released and after `unusedCacheTime` expires
	*/
	retain = (options) => {
		const release = gen({ self: this }, function* () {
			const key = new StoreCacheKey(options);
			yield* get$1(this.#rcMap, key);
			return yield* never;
		}).pipe(scoped, runCallbackWith(this.#context));
		return () => release();
	};
	/**
	* Loads a store (without suspending) to warm up the cache.
	*
	* @typeParam TSchema - The schema of the store to preload
	* @typeParam TContext - The context type for the store
	* @typeParam TSyncPayloadSchema - The sync payload schema type
	* @returns A promise that resolves when the loading is complete (success or failure)
	*
	* @remarks
	* - We don't return the store or throw as this is a fire-and-forget operation.
	* - If the entry remains unused after preload resolves/rejects, it is scheduled for disposal.
	* - Does not affect the retention of the store in cache.
	*/
	preload = async (options) => {
		try {
			await this.getOrLoadPromise(options);
		} catch {}
	};
	/**
	* Disposes the registry and all its managed stores, immediately releasing resources
	* (database connections, WebSocket connections, web workers, etc.).
	*
	* Most applications should use a single `StoreRegistry` and don't need to call
	* this method. It's only necessary when creating multiple short-lived registries to
	* immediately release resources and avoid conflicts with subsequent registries.
	*
	* @returns A promise that resolves when disposal is complete
	*
	* @remarks
	* - No-op if a custom `context` was provided to the constructor (caller owns cleanup)
	* - Idempotent: safe to call multiple times
	* - After disposal, the registry should not be used
	*/
	dispose = async () => {
		await this.#disposeOwnedRuntime?.();
	};
};
/**
* Helper for defining reusable store options with full type inference. Returns
* options that can be passed to `useStore()` or `storeRegistry.preload()`.
*
* @remarks
* At runtime this is an identity function that returns the input unchanged.
* Its value lies in enabling TypeScript's excess property checking to catch
* typos and configuration errors, while allowing options to be shared across
* `useStore()`, `storeRegistry.preload()`, `storeRegistry.getOrLoad()`, etc.
*
* @typeParam TSchema - The LiveStore schema type
* @typeParam TContext - User-defined context attached to the store
* @typeParam TSyncPayloadSchema - Schema for the sync payload sent to the backend
* @param options - The store configuration options
* @returns The same options object, unchanged
*
* @example
* ```ts
* export const issueStoreOptions = (issueId: string) =>
*   storeOptions({
*     storeId: `issue-${issueId}`,
*     schema,
*     adapter,
*     unusedCacheTime: 30_000,
*   })
*
* // In a component
* const issueStore = useStore(issueStoreOptions(issueId))
*
* // In a route loader or event handler
* storeRegistry.preload({
*   ...issueStoreOptions(issueId),
*   unusedCacheTime: 10_000,
* });
* ```
*/
var storeOptions = (options) => options;
//#endregion
export { StoreRegistry, get, make, set, storeOptions, update };
