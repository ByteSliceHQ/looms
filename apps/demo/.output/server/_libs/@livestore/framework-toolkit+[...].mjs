import { __toESM$1 as __toESM } from "../../_ssr/rolldown-runtime-DaEwE2D6.mjs";
import { hasProperty, isFailure$1 as isFailure, isFunction, isNotNullish, isString$1 as isString, isTagged, make$2 as make, require_src, string, symbol, symbol$1 } from "../@effect/opentelemetry+[...].mjs";
import { BoundArray, QueryBuilderAstSymbol, SessionIdSymbol, UnknownError, decodeResult, deepEqual, getResultSchema, hash, indent, isQueryBuilder, isSchema, makeFormatterDefault, objectToString, omitUndefineds, prepareBindValues, resolveAnnotations, resolveSessionIdSymbolInBindValues, shouldNeverHappen, tableIsClientDocumentTable, toEquivalence } from "./common+[...].mjs";
//#region ../../node_modules/.bun/@livestore+livestore@0.5.0-dev.0+4e44266562819145/node_modules/@livestore/livestore/dist/reactive.js
var import_src = /* @__PURE__ */ __toESM(require_src(), 1);
var NOT_REFRESHED_YET = Symbol.for("NOT_REFRESHED_YET");
var isThunk = (obj) => {
	return typeof obj === "object" && obj !== null && "_tag" in obj && obj._tag === "thunk";
};
var unknownRefreshReason = () => {
	return { _tag: "unknown" };
};
var encodedOptionSome = (value) => ({
	_tag: "Some",
	value
});
var encodedOptionNone = () => ({ _tag: "None" });
var globalGraphIdCounter = 0;
var uniqueGraphId = () => `graph-${++globalGraphIdCounter}`;
var ReactiveGraph = class {
	id = uniqueGraphId();
	atoms = /* @__PURE__ */ new Set();
	effects = /* @__PURE__ */ new Set();
	context;
	debugRefreshInfos = new BoundArray(200);
	currentDebugRefresh;
	deferredEffects = /* @__PURE__ */ new Map();
	refreshCallbacks = /* @__PURE__ */ new Set();
	nodeIdCounter = 0;
	uniqueNodeId = () => `node-${++this.nodeIdCounter}`;
	refreshInfoIdCounter = 0;
	uniqueRefreshInfoId = () => `refresh-info-${++this.refreshInfoIdCounter}`;
	makeRef(val, options) {
		const ref = {
			_tag: "ref",
			id: this.uniqueNodeId(),
			isDirty: false,
			isDestroyed: false,
			previousResult: val,
			computeResult: () => ref.previousResult,
			sub: /* @__PURE__ */ new Set(),
			super: /* @__PURE__ */ new Set(),
			...omitUndefineds({
				label: options?.label,
				meta: options?.meta
			}),
			equal: options?.equal ?? deepEqual,
			refreshes: 0
		};
		this.atoms.add(ref);
		return ref;
	}
	makeThunk(getResult, options) {
		const thunk = {
			_tag: "thunk",
			id: this.uniqueNodeId(),
			previousResult: NOT_REFRESHED_YET,
			isDirty: true,
			isDestroyed: false,
			computeResult: (otelContext, debugRefreshReason) => {
				if (thunk.isDirty === true) {
					const neededCurrentRefresh = this.currentDebugRefresh === void 0;
					let localDebugRefresh;
					if (neededCurrentRefresh === true) {
						localDebugRefresh = {
							refreshedAtoms: [],
							startMs: performance.now()
						};
						this.currentDebugRefresh = localDebugRefresh;
					}
					thunk.sub = /* @__PURE__ */ new Set();
					const getAtom = (atom, otelContext) => {
						this.addEdge(thunk, atom);
						return compute(atom, otelContext, debugRefreshReason);
					};
					let debugInfo;
					const setDebugInfo = (debugInfo_) => {
						debugInfo = debugInfo_;
					};
					const result = getResult(getAtom, setDebugInfo, this.context ?? throwContextNotSetError(this), otelContext, debugRefreshReason);
					const resultChanged = !thunk.equal(thunk.previousResult, result);
					const debugInfoForAtom = {
						atom: serializeAtom(thunk, false),
						resultChanged,
						debugInfo: debugInfo ?? unknownRefreshReason()
					};
					const debugRefresh = localDebugRefresh ?? this.currentDebugRefresh;
					if (debugRefresh !== void 0) debugRefresh.refreshedAtoms.push(debugInfoForAtom);
					thunk.isDirty = false;
					thunk.previousResult = result;
					thunk.recomputations++;
					if (neededCurrentRefresh === true && localDebugRefresh !== void 0) {
						const refreshedAtoms = localDebugRefresh.refreshedAtoms;
						const durationMs = performance.now() - localDebugRefresh.startMs;
						this.currentDebugRefresh = void 0;
						this.debugRefreshInfos.push({
							id: this.uniqueRefreshInfoId(),
							reason: debugRefreshReason ?? {
								_tag: "makeThunk",
								label: options?.label
							},
							skippedRefresh: false,
							refreshedAtoms,
							durationMs,
							completedTimestamp: Date.now(),
							graphSnapshot: this.getSnapshot({ includeResults: false })
						});
					}
					return result;
				} else return thunk.previousResult;
			},
			sub: /* @__PURE__ */ new Set(),
			super: /* @__PURE__ */ new Set(),
			recomputations: 0,
			...omitUndefineds({
				label: options?.label,
				meta: options?.meta
			}),
			equal: options?.equal ?? deepEqual,
			__getResult: getResult
		};
		this.atoms.add(thunk);
		return thunk;
	}
	destroyNode(node) {
		if (node._tag === "ref" || node._tag === "thunk") for (const superComp of node.super) this.destroyNode(superComp);
		if (node._tag !== "ref") for (const subComp of node.sub) this.removeEdge(node, subComp);
		if (node._tag === "effect") {
			this.deferredEffects.delete(node);
			this.effects.delete(node);
		} else this.atoms.delete(node);
		node.isDestroyed = true;
	}
	destroy() {
		for (const node of this.atoms) this.destroyNode(node);
	}
	makeEffect(doEffect, options) {
		const effect = {
			_tag: "effect",
			id: this.uniqueNodeId(),
			isDestroyed: false,
			doEffect: (otelContext, debugRefreshReason) => {
				effect.invocations++;
				effect.sub = /* @__PURE__ */ new Set();
				const getAtom = (atom, otelContext, debugRefreshReason) => {
					this.addEdge(effect, atom);
					return compute(atom, otelContext, debugRefreshReason);
				};
				doEffect(getAtom, otelContext, debugRefreshReason);
			},
			sub: /* @__PURE__ */ new Set(),
			...omitUndefineds({ label: options?.label }),
			invocations: 0
		};
		this.effects.add(effect);
		return effect;
	}
	setRef(ref, val, options) {
		this.setRefs([[ref, val]], options);
	}
	setRefs(refs, options) {
		const effectsToRefresh = /* @__PURE__ */ new Set();
		for (const [ref, val] of refs) {
			ref.previousResult = val;
			ref.refreshes++;
			markSuperCompDirtyRec(ref, effectsToRefresh);
		}
		if (options?.skipRefresh === true) for (const effect of effectsToRefresh) {
			if (this.deferredEffects.has(effect) === false) this.deferredEffects.set(effect, /* @__PURE__ */ new Set());
			if (options?.debugRefreshReason !== void 0) this.deferredEffects.get(effect).add(options.debugRefreshReason);
		}
		else this.runEffects(effectsToRefresh, {
			debugRefreshReason: options?.debugRefreshReason ?? unknownRefreshReason(),
			...omitUndefineds({ otelContext: options?.otelContext })
		});
	}
	runEffects = (effectsToRefresh, options) => {
		(this.context?.effectsWrapper ?? ((runEffects) => runEffects()))(() => {
			const previousDebugRefresh = this.currentDebugRefresh;
			const localDebugRefresh = {
				refreshedAtoms: [],
				startMs: performance.now()
			};
			this.currentDebugRefresh = localDebugRefresh;
			try {
				for (const effect of effectsToRefresh) effect.doEffect(options?.otelContext, options.debugRefreshReason);
			} finally {
				this.currentDebugRefresh = previousDebugRefresh;
			}
			const refreshedAtoms = localDebugRefresh.refreshedAtoms;
			const durationMs = performance.now() - localDebugRefresh.startMs;
			const refreshDebugInfo = {
				id: this.uniqueRefreshInfoId(),
				reason: options.debugRefreshReason,
				skippedRefresh: false,
				refreshedAtoms,
				durationMs,
				completedTimestamp: Date.now(),
				graphSnapshot: this.getSnapshot({ includeResults: false })
			};
			this.debugRefreshInfos.push(refreshDebugInfo);
			this.runRefreshCallbacks();
		});
	};
	runDeferredEffects = (options) => {
		for (const [effect, debugRefreshReasons] of this.deferredEffects) this.runEffects(/* @__PURE__ */ new Set([effect]), {
			debugRefreshReason: {
				_tag: "runDeferredEffects",
				originalRefreshReasons: Array.from(debugRefreshReasons),
				...omitUndefineds({ manualRefreshReason: options?.debugRefreshReason })
			},
			...omitUndefineds({ otelContext: options?.otelContext })
		});
	};
	runRefreshCallbacks = () => {
		for (const cb of this.refreshCallbacks) cb();
	};
	addEdge(superComp, subComp) {
		superComp.sub.add(subComp);
		subComp.super.add(superComp);
		if (this.currentDebugRefresh === void 0) this.runRefreshCallbacks();
	}
	removeEdge(superComp, subComp) {
		superComp.sub.delete(subComp);
		const effectsToRefresh = /* @__PURE__ */ new Set();
		markSuperCompDirtyRec(subComp, effectsToRefresh);
		for (const effect of effectsToRefresh) this.deferredEffects.set(effect, /* @__PURE__ */ new Set());
		subComp.super.delete(superComp);
		if (this.currentDebugRefresh === void 0) this.runRefreshCallbacks();
	}
	getSnapshot = (opts) => {
		const { includeResults = false } = opts ?? {};
		const atoms = [];
		for (const atom of this.atoms) atoms.push(serializeAtom(atom, includeResults));
		const effects = [];
		for (const effect of this.effects) effects.push(serializeEffect(effect));
		const deferredEffects = [];
		for (const [effect] of this.deferredEffects) deferredEffects.push(effect.id);
		return {
			atoms,
			effects,
			deferredEffects
		};
	};
	subscribeToRefresh = (cb) => {
		this.refreshCallbacks.add(cb);
		return () => {
			this.refreshCallbacks.delete(cb);
		};
	};
};
var compute = (atom, otelContext, debugRefreshReason) => {
	if (atom.isDestroyed === true) shouldNeverHappen(`LiveStore Error: Attempted to compute destroyed ${atom._tag} (${atom.id}): ${atom.label ?? ""}`);
	if (atom.isDirty === true) {
		const result = atom.computeResult(otelContext, debugRefreshReason);
		atom.isDirty = false;
		atom.previousResult = result;
		return result;
	} else return atom.previousResult;
};
var markSuperCompDirtyRec = (atom, effectsToRefresh) => {
	for (const superComp of atom.super) if (superComp._tag === "thunk") {
		superComp.isDirty = true;
		markSuperCompDirtyRec(superComp, effectsToRefresh);
	} else effectsToRefresh.add(superComp);
};
var throwContextNotSetError = (graph) => {
	throw new Error(`LiveStore Error: \`context\` not set on ReactiveGraph (${graph.id})`);
};
var serializeAtom = (atom, includeResult) => {
	const sub = [];
	for (const a of atom.sub) sub.push(a.id);
	const super_ = [];
	for (const a of atom.super) super_.push(a.id);
	const previousResult = includeResult === true ? encodedOptionSome(atom.previousResult === NOT_REFRESHED_YET ? "\"SYMBOL_NOT_REFRESHED_YET\"" : JSON.stringify(atom.previousResult, (key, nestedValue) => {
		if (isSchema(nestedValue) === false) return nestedValue;
		if (key === "schema") return void 0;
		const annotations = resolveAnnotations(nestedValue);
		return omitUndefineds({
			_tag: "Schema",
			ast: nestedValue.ast._tag,
			identifier: annotations?.identifier,
			title: annotations?.title,
			hash: hash(nestedValue)
		});
	})) : encodedOptionNone();
	if (atom._tag === "ref") return {
		_tag: atom._tag,
		id: atom.id,
		...omitUndefineds({
			label: atom.label,
			meta: atom.meta
		}),
		isDirty: atom.isDirty,
		sub,
		super: super_,
		isDestroyed: atom.isDestroyed,
		refreshes: atom.refreshes,
		previousResult
	};
	return {
		_tag: "thunk",
		id: atom.id,
		...omitUndefineds({
			label: atom.label,
			meta: atom.meta
		}),
		isDirty: atom.isDirty,
		sub,
		super: super_,
		isDestroyed: atom.isDestroyed,
		recomputations: atom.recomputations,
		previousResult
	};
};
var serializeEffect = (effect) => {
	const sub = [];
	for (const a of effect.sub) sub.push(a.id);
	return {
		_tag: effect._tag,
		id: effect.id,
		...omitUndefineds({ label: effect.label }),
		sub,
		invocations: effect.invocations,
		isDestroyed: effect.isDestroyed
	};
};
//#endregion
//#region ../../node_modules/.bun/@livestore+livestore@0.5.0-dev.0+4e44266562819145/node_modules/@livestore/livestore/dist/live-queries/base-class.js
var makeReactivityGraph = () => new ReactiveGraph();
var queryIdCounter = 0;
var TypeId = Symbol.for("LiveQuery");
var depsToString = (deps) => {
	if (typeof deps === "string" || typeof deps === "number") return deps.toString();
	return deps.filter(isNotNullish).join(",");
};
/**
* Type guard that checks if a value is a query or signal definition.
*
* Use this to distinguish between definitions (blueprints) and instances (live queries).
* Definitions are created by `queryDb()`, `computed()`, and `signal()`.
*
* @example
* ```ts
* const todos$ = queryDb(tables.todos.all())
*
* if (isLiveQueryDef(todos$)) {
*   console.log('This is a definition:', todos$.label)
* }
* ```
*/
var isLiveQueryDef = (value) => {
	if (isTagged(value, "def") === false && isTagged(value, "signal-def") === false) return false;
	return hasProperty(value, "make") && isFunction(value.make) && hasProperty(value, "hash") && isString(value.hash) && hasProperty(value, "label") && isString(value.label);
};
var LiveStoreQueryBase = class {
	"__result!";
	id = queryIdCounter++;
	[TypeId] = TypeId;
	activeSubscriptions = /* @__PURE__ */ new Set();
	get runs() {
		if (this.results$._tag === "thunk") return this.results$.recomputations;
		return 0;
	}
	executionTimes = [];
	isDestroyed = false;
	run = (args) => {
		return this.results$.computeResult(args.otelContext, args.debugRefreshReason);
	};
	dependencyQueriesRef = /* @__PURE__ */ new Set();
};
var makeGetAtomResult = (get, ctx, otelContext, dependencyQueriesRef) => {
	const getAtom = (atom, _otelContext, debugRefreshReason) => {
		if (atom._tag === "thunk" || atom._tag === "ref") return get(atom, otelContext, debugRefreshReason);
		if (atom._tag === "def" || atom._tag === "signal-def") {
			const query = atom.make(ctx);
			dependencyQueriesRef.add(query);
			return getAtom(query.value, _otelContext, debugRefreshReason);
		}
		if (atom._tag === "signal" && hasProperty(atom, "ref") === true) return get(atom.ref, otelContext, debugRefreshReason);
		return get(atom.results$, otelContext, debugRefreshReason);
	};
	return getAtom;
};
var withRCMap = (id, make) => {
	return (ctx, otelContext) => {
		let item = ctx.defRcMap.get(id);
		if (item !== void 0) {
			item.rc++;
			return item;
		}
		item = {
			rc: 1,
			value: make(ctx, otelContext),
			deref: () => {
				item.rc--;
				if (item.rc === 0) {
					item.value.destroy();
					ctx.defRcMap.delete(id);
				}
			}
		};
		ctx.defRcMap.set(id, item);
		return item;
	};
};
//#endregion
//#region ../../node_modules/.bun/@livestore+livestore@0.5.0-dev.0+4e44266562819145/node_modules/@livestore/livestore/dist/utils/function-string.js
var REACT_NATIVE_BAD_FUNCTION_STRING = "function() { [bytecode] }";
var isValidFunctionString = (fnStr) => {
	if (fnStr === REACT_NATIVE_BAD_FUNCTION_STRING) return {
		_tag: "invalid",
		reason: "react-native"
	};
	return { _tag: "valid" };
};
make();
var StoreInternalsSymbol = Symbol.for("livestore.StoreInternals");
/**
* Type guard that checks if a value is a live query instance.
*
* Live query instances are stateful objects bound to a Store's reactivity graph.
* They're created internally when you use a definition with `store.query()` or `store.subscribe()`.
*
* @example
* ```ts
* const [, , , query$] = useClientDocument(tables.uiState)
*
* if (isLiveQueryInstance(query$)) {
*   console.log('Execution count:', query$.runs)
* }
* ```
*/
var isLiveQueryInstance = (value) => hasProperty(value, TypeId);
/**
* Type guard that checks if a value can be used with `store.query()` or `store.subscribe()`.
*
* Queryable values include:
* - Query definitions (`LiveQueryDef` from `queryDb()`, `computed()`)
* - Signal definitions (`SignalDef` from `signal()`)
* - Live query instances (`LiveQuery`)
* - Query builders (e.g., `tables.todos.where(...)`)
*
* @example
* ```ts
* const handleQuery = (input: unknown) => {
*   if (isQueryable(input)) {
*     return store.query(input)
*   }
*   throw new Error('Not a valid query')
* }
* ```
*/
var isQueryable = (value) => isQueryBuilder(value) || isLiveQueryInstance(value) || isLiveQueryDef(value);
//#endregion
//#region ../../node_modules/.bun/@livestore+livestore@0.5.0-dev.0+4e44266562819145/node_modules/@livestore/livestore/dist/live-queries/client-document-get-query.js
var rowQueryLabel = (table, id) => `${table.sqliteDef.name}.get:${id === void 0 ? table.default.id : id === SessionIdSymbol ? "sessionId" : id}`;
var makeExecBeforeFirstRun = ({ id, explicitDefaultValues, table, otelContext: otelContext_ }) => ({ store }) => {
	if (tableIsClientDocumentTable(table) === false) return shouldNeverHappen(`Cannot insert row for table "${table.sqliteDef.name}" which does not have 'deriveEvents: true' set`);
	const otelContext = otelContext_ ?? store[StoreInternalsSymbol].otel.queriesSpanContext;
	const idVal = id === SessionIdSymbol ? store.sessionId : id;
	if (store[StoreInternalsSymbol].sqliteDbWrapper.cachedSelect(`SELECT 1 FROM '${table.sqliteDef.name}' WHERE id = ?`, [idVal], { otelContext }).length === 1 === true) return;
	store.commit({
		otelContext,
		skipRefresh: true,
		label: `${table.sqliteDef.name}.set:${idVal}`
	}, table.set(explicitDefaultValues, idVal));
};
//#endregion
//#region ../../node_modules/.bun/@livestore+livestore@0.5.0-dev.0+4e44266562819145/node_modules/@livestore/livestore/dist/live-queries/db-query.js
var isQueryInputRaw = (value) => hasProperty(value, "query") && hasProperty(value, "schema");
/**
* NOTE `queryDb` is only supposed to read data. Don't use it to insert/update/delete data but use events instead.
*
* When using contextual data when constructing the query, please make sure to include it in the `deps` option.
*
* @example
* ```ts
* const todos$ = queryDb(tables.todos.where({ complete: true }))
* ```
*
* @example
* ```ts
* // Group-by raw SQL query
* const colorCounts$ = queryDb({
*   query: sql`SELECT color, COUNT(*) as count FROM todos WHERE complete = ? GROUP BY color`,
*   schema: Schema.Array(Schema.Struct({
*     color: Schema.String,
*     count: Schema.Number,
*   })),
*   bindValues: [1],
* })
* ```
*
* @example
* ```ts
* // Using contextual data when constructing the query
* const makeFilteredQuery = (filter: string) =>
*   queryDb(tables.todos.where({ title: { op: 'like', value: filter } }), { deps: [filter] })
*
* const filteredTodos$ = makeFilteredQuery('buy coffee')
* ```
*/
var queryDb = (queryInput, options) => {
	const { queryString, extraDeps } = getQueryStringAndExtraDeps(queryInput);
	const hash = [
		queryString,
		options?.deps !== void 0 ? depsToString(options.deps) : void 0,
		depsToString(extraDeps)
	].filter(Boolean).join("-");
	if (isValidFunctionString(hash)._tag === "invalid") throw new Error(`On Expo/React Native, db queries must provide a \`deps\` option`);
	if (hash.trim() === "") return shouldNeverHappen("Invalid query hash for query:", objectToString(queryInput));
	const label = options?.label ?? queryString;
	const def = {
		_tag: "def",
		make: withRCMap(hash, (ctx, otelContext) => {
			return new LiveStoreDbQuery({
				reactivityGraph: ctx.reactivityGraph.deref(),
				queryInput,
				label,
				def,
				...omitUndefineds({
					map: options?.map,
					otelContext
				})
			});
		}),
		label,
		hash,
		[symbol](that) {
			return isLiveQueryDef(that) && that._tag === "def" && this.hash === that.hash;
		},
		[symbol$1]() {
			return string(this.hash);
		}
	};
	return def;
};
var bindValuesToDepKey = (bindValues) => {
	if (bindValues === void 0) return [];
	return Object.entries(bindValues).map(([key, value]) => `${key}:${value === SessionIdSymbol ? "SessionIdSymbol" : value}`).join(",");
};
var getQueryStringAndExtraDeps = (queryInput) => {
	if (isQueryBuilder(queryInput) === true) {
		const { query, bindValues } = queryInput.asSql();
		return {
			queryString: query,
			extraDeps: bindValuesToDepKey(bindValues)
		};
	}
	if (isQueryInputRaw(queryInput) === true) return {
		queryString: queryInput.query,
		extraDeps: bindValuesToDepKey(queryInput.bindValues)
	};
	if (typeof queryInput === "function") return {
		queryString: queryInput.toString(),
		extraDeps: []
	};
	return shouldNeverHappen(`Invalid query input: ${String(queryInput)}`);
};
var LiveStoreDbQuery = class extends LiveStoreQueryBase {
	_tag = "db";
	/** A reactive thunk representing the query text */
	queryInput$;
	/** A reactive thunk representing the query results */
	results$;
	label;
	reactivityGraph;
	mapResult;
	def;
	constructor({ queryInput, label: inputLabel, reactivityGraph, map, otelContext, def }) {
		super();
		let label = inputLabel ?? "db(unknown)";
		this.reactivityGraph = reactivityGraph;
		this.def = def;
		this.mapResult = map === void 0 ? (rows) => rows : map;
		const schemaRef = { current: typeof queryInput === "function" ? void 0 : isQueryBuilder(queryInput) === true ? void 0 : queryInput.schema };
		const execBeforeFirstRunRef = { current: void 0 };
		let queryInputRaw$OrQueryInputRaw;
		const fromQueryBuilder = (qb, otelContext) => {
			try {
				const qbRes = qb.asSql();
				const schema = getResultSchema(qb);
				const ast = qb[QueryBuilderAstSymbol];
				return {
					queryInputRaw: {
						query: qbRes.query,
						schema,
						bindValues: qbRes.bindValues,
						queriedTables: /* @__PURE__ */ new Set([ast.tableDef.sqliteDef.name])
					},
					label: ast._tag === "RowQuery" ? rowQueryLabel(ast.tableDef, ast.id) : qb.toString(),
					execBeforeFirstRun: ast._tag === "RowQuery" ? makeExecBeforeFirstRun({
						table: ast.tableDef,
						explicitDefaultValues: ast.explicitDefaultValues,
						id: ast.id,
						otelContext
					}) : void 0
				};
			} catch (cause) {
				throw new UnknownError({
					cause,
					note: `Error building query for ${qb.toString()}`,
					payload: { qb }
				});
			}
		};
		if (typeof queryInput === "function") {
			queryInputRaw$OrQueryInputRaw = this.reactivityGraph.makeThunk((get, setDebugInfo, ctx, otelContext) => {
				const startMs = performance.now();
				const queryInputResult = queryInput(makeGetAtomResult(get, ctx, otelContext ?? ctx.rootOtelContext, this.dependencyQueriesRef), ctx);
				const durationMs = performance.now() - startMs;
				let queryInputRaw;
				if (isQueryBuilder(queryInputResult) === true) {
					const res = fromQueryBuilder(queryInputResult, otelContext);
					queryInputRaw = res.queryInputRaw;
					this.label = res.label;
					execBeforeFirstRunRef.current = res.execBeforeFirstRun;
				} else queryInputRaw = queryInputResult;
				setDebugInfo({
					_tag: "computed",
					label: `${this.label}:queryInput`,
					query: queryInputRaw.query,
					durationMs
				});
				schemaRef.current = queryInputRaw.schema;
				return queryInputRaw;
			}, {
				label: `${label}:query`,
				meta: { liveStoreThunkType: "db.query" },
				equal: (a, b) => a.query === b.query && deepEqual(a.bindValues, b.bindValues)
			});
			this.queryInput$ = queryInputRaw$OrQueryInputRaw;
		} else {
			let queryInputRaw;
			if (isQueryBuilder(queryInput) === true) {
				const res = fromQueryBuilder(queryInput, otelContext);
				queryInputRaw = res.queryInputRaw;
				label = res.label;
				execBeforeFirstRunRef.current = res.execBeforeFirstRun;
			} else queryInputRaw = queryInput;
			schemaRef.current = queryInputRaw.schema;
			queryInputRaw$OrQueryInputRaw = queryInputRaw;
			if (inputLabel === void 0 && isQueryBuilder(queryInput) === true) {
				const ast = queryInput[QueryBuilderAstSymbol];
				if (ast._tag === "RowQuery") label = `db(${rowQueryLabel(ast.tableDef, ast.id)})`;
			}
		}
		const queriedTablesRef = { current: void 0 };
		const makeResultsEqual = (resultSchema) => {
			const eq = toEquivalence(resultSchema);
			return (a, b) => a === NOT_REFRESHED_YET || b === NOT_REFRESHED_YET ? false : eq(a, b);
		};
		const resultsEqual = map === void 0 ? schemaRef.current === void 0 ? (a, b) => makeResultsEqual(schemaRef.current)(a, b) : makeResultsEqual(schemaRef.current) : void 0;
		const results$ = this.reactivityGraph.makeThunk((get, setDebugInfo, queryContext, otelContext, debugRefreshReason) => queryContext.otelTracer.startActiveSpan("db:...", { attributes: { "livestore.debugRefreshReason": hasProperty(debugRefreshReason, "label") === true ? debugRefreshReason.label : debugRefreshReason?._tag } }, otelContext ?? queryContext.rootOtelContext, (span) => {
			const startTimePerfNow = performance.now();
			const otelContext = import_src.trace.setSpan(import_src.context.active(), span);
			const { store } = queryContext;
			if (execBeforeFirstRunRef.current !== void 0) {
				execBeforeFirstRunRef.current(queryContext, otelContext);
				execBeforeFirstRunRef.current = void 0;
			}
			const queryInputResult = isThunk(queryInputRaw$OrQueryInputRaw) === true ? get(queryInputRaw$OrQueryInputRaw, otelContext, debugRefreshReason) : queryInputRaw$OrQueryInputRaw;
			const sqlString = queryInputResult.query;
			const bindValues = queryInputResult.bindValues;
			if (queriedTablesRef.current === void 0) queriedTablesRef.current = store[StoreInternalsSymbol].sqliteDbWrapper.getTablesUsed(sqlString);
			const resolvedBindValues = bindValues === void 0 ? void 0 : resolveSessionIdSymbolInBindValues(bindValues, store.sessionId);
			for (const tableName of queriedTablesRef.current) get(store[StoreInternalsSymbol].tableRefs[tableName] ?? shouldNeverHappen(`No table ref found for ${tableName}`), otelContext, debugRefreshReason);
			span.setAttribute("sql.query", sqlString);
			span.updateName(`db:${sqlString.slice(0, 50)}`);
			const rawDbResults = store[StoreInternalsSymbol].sqliteDbWrapper.cachedSelect(sqlString, resolvedBindValues !== void 0 ? prepareBindValues(resolvedBindValues, sqlString) : void 0, {
				otelContext,
				...queriedTablesRef.current !== void 0 ? { queriedTables: queriedTablesRef.current } : {}
			});
			span.setAttribute("sql.rowsCount", rawDbResults.length);
			const parsedResult = decodeResult(schemaRef.current)(rawDbResults);
			if (isFailure(parsedResult) === true) {
				const parseErrorStr = makeFormatterDefault()(parsedResult.failure.issue);
				const expectedSchemaStr = String(schemaRef.current.ast);
				const bindValuesStr = bindValues === void 0 ? "" : `\nBind values: ${JSON.stringify(bindValues)}`;
				return shouldNeverHappen(`\
Error parsing SQL query result (${label}).

Query: ${sqlString}\
${bindValuesStr}

Expected schema: ${expectedSchemaStr}

Error: ${parseErrorStr}

Result:`, rawDbResults, "\n");
			}
			const result = this.mapResult(parsedResult.success);
			span.end();
			const durationMs = performance.now() - startTimePerfNow;
			this.executionTimes.push(durationMs);
			setDebugInfo({
				_tag: "db",
				label: `${label}:results`,
				query: sqlString,
				durationMs
			});
			return result;
		}), {
			label: `${label}:results`,
			meta: { liveStoreThunkType: "db.result" },
			...omitUndefineds({ equal: resultsEqual })
		});
		this.results$ = results$;
		this.label = label;
	}
	destroy = () => {
		this.isDestroyed = true;
		if (this.queryInput$ !== void 0) this.reactivityGraph.destroyNode(this.queryInput$);
		this.reactivityGraph.destroyNode(this.results$);
		for (const query of this.dependencyQueriesRef) query.deref();
	};
};
//#endregion
//#region ../../node_modules/.bun/@livestore+livestore@0.5.0-dev.0+4e44266562819145/node_modules/@livestore/livestore/dist/utils/stack-info.js
var extractStackInfoFromStackTrace = (stackTrace) => {
	const namePattern = /at (\S+) \((.+)\)/g;
	let match;
	const frames = [];
	let hasReachedStart = false;
	while (true) {
		match = namePattern.exec(stackTrace);
		if (match === null) break;
		const [, name, filePath] = match;
		if ((name.startsWith("use") === true || name.startsWith("Module.use") === true) && name.endsWith("QueryRef") === false) {
			hasReachedStart = true;
			frames.unshift({
				name: name.replace(/^Module\./, ""),
				filePath
			});
		} else if (hasReachedStart === true) {
			if (name !== "Object.react-stack-bottom-frame") frames.unshift({
				name,
				filePath
			});
			break;
		}
	}
	return { frames };
};
var stackInfoToString = (stackInfo) => stackInfo.frames.map((f) => `${f.name} (${f.filePath})`).join("\n");
//#endregion
//#region ../../node_modules/.bun/@livestore+framework-toolkit@0.5.0-dev.0+4e44266562819145/node_modules/@livestore/framework-toolkit/dist/client-document.js
/**
* Validates that a table is a client document table.
* Throws if the table is not a client document table.
*
* @param table - The table definition to validate
* @throws If the table is not a client document table
*/
var validateTableOptions = (table) => {
	if (tableIsClientDocumentTable(table) === false) shouldNeverHappen(`useClientDocument called on table "${table.sqliteDef.name}" which is not a client document table`);
};
/**
* Removes undefined values from an object.
* Returns non-object values unchanged.
*
* @param value - The value to process
* @returns The value with undefined properties removed (if object)
*/
var removeUndefinedValues = (value) => {
	if (typeof value === "object" && value !== null) return Object.fromEntries(Object.entries(value).filter(([_, v]) => v !== void 0));
	return value;
};
//#endregion
//#region ../../node_modules/.bun/@livestore+framework-toolkit@0.5.0-dev.0+4e44266562819145/node_modules/@livestore/framework-toolkit/dist/query.js
/**
* Normalizes a queryable into a standard internal representation.
*
* Handles:
* - QueryBuilder → wraps in queryDb() and returns as definition
* - LiveQueryDef/SignalDef → returns as definition
* - LiveQuery instance → returns as live-query
*
* @throws If the input is not a valid Queryable
*/
var normalizeQueryable = (queryable) => {
	if (isQueryable(queryable) === false) return shouldNeverHappen("Expected a Queryable value");
	if (isQueryBuilder(queryable) === true) return {
		_tag: "definition",
		def: queryDb(queryable)
	};
	if (queryable._tag === "def" || queryable._tag === "signal-def") return {
		_tag: "definition",
		def: queryable
	};
	return {
		_tag: "live-query",
		query$: queryable
	};
};
/**
* Computes a unique key for reference-counted query caching.
*
* The key includes all aspects of a store instance (storeId, clientId, sessionId)
* to prevent unexpected cache mappings across different store instances.
*
* @param store - The store instance
* @param normalized - The normalized queryable
* @returns A unique string key for caching
*/
var computeRcRefKey = (store, normalized) => {
	const base = `${store.storeId}_${store.clientId}_${store.sessionId}`;
	if (normalized._tag === "definition") return `${base}:def:${normalized.def.hash}`;
	return `${base}:instance:${normalized.query$.id}`;
};
/**
* Formats a query error with additional context for debugging.
*
* @param cause - The original error
* @param label - The query label
* @param stackInfo - Stack information for tracing
* @param framework - The framework name (e.g., 'react', 'solid')
* @returns A formatted Error with enhanced message
*/
var formatQueryError = (cause, label, stackInfo, framework) => {
	return new Error(`\
[@livestore/${framework}:useQuery] Error running query: ${cause.name}

Query: ${label}

${framework.charAt(0).toUpperCase() + framework.slice(1)} trace:

${indent(stackInfoToString(stackInfo), 4)}

Stack trace:
`, { cause });
};
/**
* Runs the initial query and returns the result.
* Handles errors by formatting them with framework-specific context.
*
* @param query$ - The live query to run
* @param otelContext - OpenTelemetry context for tracing
* @param stackInfo - Stack information for debugging
* @param framework - The framework name (e.g., 'react', 'solid')
* @returns The query result
* @throws Formatted error if the query fails
*/
var runInitialQuery = (query$, otelContext, stackInfo, framework) => {
	try {
		return query$.run({
			otelContext,
			debugRefreshReason: {
				_tag: "react",
				api: "useQuery",
				label: `useQuery:initial-run:${query$.label}`,
				stackInfo
			}
		});
	} catch (cause) {
		console.error(`[@livestore/${framework}:useQuery] Error running query`, cause);
		throw formatQueryError(cause, query$.label, stackInfo, framework);
	}
};
/**
* Gets the label from a normalized queryable.
*/
var getResourceLabel = (normalized) => normalized._tag === "definition" ? normalized.def.label : normalized.query$.label;
/**
* Creates the query resource (span, otelContext, queryRcRef) from a normalized queryable.
* This is the common factory logic shared between React and Solid hooks.
*/
var createQueryResource = (store, normalized, stackInfo, options) => {
	const resourceLabel = getResourceLabel(normalized);
	const span = store[StoreInternalsSymbol].otel.tracer.startSpan(options?.otelSpanName ?? `LiveStore:useQuery:${resourceLabel}`, { attributes: {
		label: resourceLabel,
		firstStackInfo: JSON.stringify(stackInfo)
	} }, options?.otelContext ?? store[StoreInternalsSymbol].otel.queriesSpanContext);
	const otelContext = import_src.trace.setSpan(import_src.context.active(), span);
	return {
		queryRcRef: normalized._tag === "definition" ? normalized.def.make(store[StoreInternalsSymbol].reactivityGraph.context, otelContext) : {
			value: normalized.query$,
			deref: () => {},
			rc: Number.POSITIVE_INFINITY
		},
		span,
		otelContext
	};
};
//#endregion
//#region ../../node_modules/.bun/@livestore+framework-toolkit@0.5.0-dev.0+4e44266562819145/node_modules/@livestore/framework-toolkit/dist/stack-info.js
/**
* The original stack trace limit before any modifications.
* Used to restore the limit after extracting stack info.
*/
var originalStackLimit = Error.stackTraceLimit;
/**
* Extracts stack information from a new Error's stack trace.
* Temporarily increases stack trace limit to capture sufficient context.
*
* @returns The extracted stack information
*/
var captureStackInfo = () => {
	Error.stackTraceLimit = 10;
	const stack = (/* @__PURE__ */ new Error()).stack;
	Error.stackTraceLimit = originalStackLimit;
	return extractStackInfoFromStackTrace(stack);
};
//#endregion
export { NOT_REFRESHED_YET, StoreInternalsSymbol, captureStackInfo, computeRcRefKey, createQueryResource, makeExecBeforeFirstRun, makeReactivityGraph, normalizeQueryable, queryDb, removeUndefinedValues, runInitialQuery, validateTableOptions };
