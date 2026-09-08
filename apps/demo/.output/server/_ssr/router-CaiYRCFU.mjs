import { __commonJSMin, __exportAll, __reExport, __toESM, __toESM$1 } from "./rolldown-runtime-DaEwE2D6.mjs";
import { StoreRegistryProvider, require_jsx_runtime, require_react, useStore } from "../_libs/livestore__react+react.mjs";
import { HeadContent, Link, Outlet, Scripts, createFileRoute, createRootRoute, createRouter, lazyRouteComponent, require_react_dom } from "../_libs/@tanstack/react-router+[...].mjs";
import { Effect_exports as Effect_exports$1, NoSuchElementError, Prototype, Schedule_exports as Schedule_exports$1, Service, TimeoutError, UnhandledLogLevel, UnknownError as UnknownError$2, _await, acquireRelease, acquireUseRelease, add, addDelay, addFinalizer, addFinalizer$1, andThen, annotateLogs, as, asVoid, build, catchCause as catchCause$1, catchCause$1 as catchCause, catchIf, catchTag, catch_, chunksOf, clockWith, close, constTrue, constVoid, context, currentSpan, die as die$1, die$1 as die, done, doneUnsafe, dropWhile, dual, effect, effectContext, empty$2 as empty, every, exists, exit, exponential, fail as fail$1, fail$1 as fail$2, fail$2 as fail$3, fail$3 as fail, fail$4, findError, findErrorOption, flatMap, flatMap$3 as flatMap$1, flatten, flatten$1, fn, fnUntraced, forEach, forever, forkScoped, format, fromNullishOr$1 as fromNullishOr, fromOption, fromPredicateOption, fromUndefinedOr, gen, getOrElse$1 as getOrElse, getOrUndefined$1 as getOrUndefined, hasInterruptsOnly, hasProperty, hash as hash$2, head as head$1, headNonEmpty, identity, ignore, interruptible, isArray, isEffect, isFailure as isFailure$1, isFailure$1 as isFailure, isNone, isNotNullish, isNotUndefined, isNumber, isPromiseLike, isReadonlyArrayNonEmpty, isReadonlyObject, isSome, isString$1 as isString, isSuccess as isSuccess$1, isSuccess$1 as isSuccess, isUndefined, join, lastNonEmpty, log, logDebug, logError, logWarning, make$1 as make$5, make$2 as make$6, map, map$2 as map$1, match$3 as match, matchEffect, merge as merge$1, millis, min$1 as min, minutes, modifyDelay, never, none, of as of$2, onInterrupt, orDie, orElse, partition, pipe, pretty, prettyErrors, provide$1, provide$2 as provide, provideMerge, provideService, raceFirst, retry, runForkWith, schedule, scoped, seconds, sleep, some, spaced, splitWhere, squash, string, succeed, succeed$1 as succeed$4, succeed$2, succeed$3 as succeed$1, succeed$5 as succeed$3, suspend, sync, tap, tapCause, timeoutOrElse, toEntries, toMillis, tryPromise, try_, unwrap, unzip, upTo, void_ as void_$1, void_$1 as void_, whileLoop } from "../_libs/@effect/opentelemetry+[...].mjs";
import { Boolean as Boolean$1, Collector, Context, CurrentLoggers, Defect, InvalidValue, MessagePort, Never, NullOr, Number as Number$1, Option, PropertySignature, Schema_exports as Schema_exports$1, Stream_exports as Stream_exports$1, String as String$1, Struct, TaggedError, TaggedStruct, Uint8Array as Uint8Array$1, Union, Union$1, Unknown, await_, clear as clear$2, clear$1, clear$2 as clear, concat, decodeResult, decodeTo, empty as empty$1, encodeEffect, encodeResult, encodeTo, exhaustive, fail as fail$5, filter, filterEffect, flatMap as flatMap$2, fromAsyncIterable, fromEffect, getCurrent, instanceOf, integer as integer$2, interrupt, is, isArrays, isBoolean, isLiteral, isNull, isNumber as isNumber$1, isObjects, isOptional, isSchema, isString as isString$1, isUndefined as isUndefined$1, isUnion, join as join$1, lambda, make$1 as make$8, make$2 as make$7, make$6 as make$10, make$8 as make$9, makeCollector, makeFilter, makeFormatterDefault, makeSchema, makeState, makeUnsafe$1 as makeUnsafe, map as map$2, map$2 as map$3, mapArrayEffect, mapEffect, materializers as materializers$1, never as never$1, nominal, offer, offer$1, offerAll as offerAll$1, offerAll$1 as offerAll, offerUnsafe, optional, parseJson, peek, pick, poll, publish, resolveAt, resolveIdentifier, resolveTitle, run, runCollect, runDrain, runForEach, runHead, shutdown, shutdown$1, sizeUnsafe, sliding, stringifyJson, synced, table as table$2, tag, take as take$2, take$1 as take, take$2 as take$1, takeBetween as takeBetween$1, takeBetween$1 as takeBetween, tap as tap$1, text as text$2, toEncoded, toEquivalence, toType, toType$1, tracerLogger, transform as transform$1, transform$1 as transform, transformOrFail, unbounded as unbounded$1, unbounded$1 as unbounded, unbounded$2, unwrap as unwrap$1, value, when } from "../_libs/@livestore/common+[...].mjs";
import { HttpClient, KeyValueStore, KeyValueStoreError, Protocol, RpcClientDefect, RpcClientError, RpcClient_exports as RpcClient_exports$1, RpcSerialization, Socket, SocketCloseError, SocketError, SocketOpenError, SubscriptionRef_exports as SubscriptionRef_exports$1, WorkerError, WorkerPlatform, WorkerReceiveError, bodyText, changes, constPing, decode, filterStatusOk, get as get$1, get$1 as get, layer, layerSpawner, log as log$1, make as make$14, make$1 as make$13, make$2 as make$11, make$3 as make$12, makePlatform, makeStringOnly, post, remove, run as run$1, set, setHeaders, stream } from "../_libs/effect+msgpackr.mjs";
import { StoreRegistry, get as get$2, make as make$15, set as set$1, storeOptions } from "../_libs/@livestore/livestore+[...].mjs";
import { queryDb } from "../_libs/@livestore/framework-toolkit+[...].mjs";
import { webcrypto } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/router-CaiYRCFU.js
var import_react = /* @__PURE__ */ __toESM$1(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_react_dom = require_react_dom();
var TwistEnvelope = Struct({
	id: String$1,
	actorId: optional(String$1),
	ts: Number$1,
	ephemeral: optional(Boolean$1),
	parentActorId: optional(NullOr(String$1)),
	payload: optional(Unknown)
});
function makeTwistEvent(name) {
	return synced({
		name,
		schema: TwistEnvelope
	});
}
var events = {
	actorStarted: makeTwistEvent("actor.started"),
	actorCompleted: makeTwistEvent("actor.completed"),
	actorFailed: makeTwistEvent("actor.failed"),
	actorCancelled: makeTwistEvent("actor.cancelled"),
	agentMessageReceived: makeTwistEvent("agent.message.received"),
	agentTurnStarted: makeTwistEvent("agent.turn.started"),
	agentTurnTextDelta: makeTwistEvent("agent.turn.text_delta"),
	agentTurnSteered: makeTwistEvent("agent.turn.steered"),
	agentMessage: makeTwistEvent("agent.message"),
	agentToolCallRequested: makeTwistEvent("agent.tool_call.requested"),
	toolResult: makeTwistEvent("tool.result"),
	childSpawned: makeTwistEvent("child.spawned"),
	childCompleted: makeTwistEvent("child.completed"),
	workflowNodeStarted: makeTwistEvent("workflow.node.started"),
	workflowNodeFinished: makeTwistEvent("workflow.node.finished"),
	workflowNodeSkipped: makeTwistEvent("workflow.node.skipped"),
	reviewRequested: makeTwistEvent("review.requested"),
	reviewDecided: makeTwistEvent("review.decided"),
	reviewTimedOut: makeTwistEvent("review.timed_out"),
	timerSet: makeTwistEvent("timer.set"),
	timerFired: makeTwistEvent("timer.fired"),
	snapshotTaken: makeTwistEvent("snapshot.taken")
};
var tables = {
	actors: table$2({
		name: "actors",
		columns: {
			actorId: text$2({ primaryKey: true }),
			kind: text$2({ nullable: true }),
			status: text$2({ nullable: true }),
			definitionName: text$2({ nullable: true }),
			parentActorId: text$2({ nullable: true }),
			inputJson: text$2({ nullable: true }),
			outputJson: text$2({ nullable: true }),
			error: text$2({ nullable: true }),
			updatedAt: integer$2({ nullable: false })
		}
	}),
	messages: table$2({
		name: "messages",
		columns: {
			id: text$2({ primaryKey: true }),
			actorId: text$2({ nullable: false }),
			seq: integer$2({ nullable: false }),
			role: text$2({ nullable: false }),
			content: text$2({ nullable: false }),
			toolCallId: text$2({ nullable: true }),
			name: text$2({ nullable: true }),
			turn: integer$2({ nullable: true }),
			ts: integer$2({ nullable: false })
		}
	}),
	nodes: table$2({
		name: "nodes",
		columns: {
			id: text$2({ primaryKey: true }),
			actorId: text$2({ nullable: false }),
			nodeId: text$2({ nullable: false }),
			status: text$2({ nullable: false }),
			resultJson: text$2({ nullable: true }),
			error: text$2({ nullable: true }),
			reviewId: text$2({ nullable: true }),
			updatedAt: integer$2({ nullable: false })
		}
	}),
	reviews: table$2({
		name: "reviews",
		columns: {
			reviewId: text$2({ primaryKey: true }),
			actorId: text$2({ nullable: false }),
			title: text$2({ nullable: false }),
			description: text$2({ nullable: true }),
			status: text$2({ nullable: false }),
			nodeId: text$2({ nullable: true }),
			decisionJson: text$2({ nullable: true }),
			updatedAt: integer$2({ nullable: false })
		}
	}),
	eventsLog: table$2({
		name: "events_log",
		columns: {
			id: text$2({ primaryKey: true }),
			actorId: text$2({ nullable: false }),
			type: text$2({ nullable: false }),
			seq: integer$2({ nullable: false }),
			ts: integer$2({ nullable: false }),
			ephemeral: integer$2({ nullable: false }),
			parentActorId: text$2({ nullable: true }),
			payloadJson: text$2({ nullable: false })
		}
	}),
	children: table$2({
		name: "children",
		columns: {
			childActorId: text$2({ primaryKey: true }),
			parentActorId: text$2({ nullable: false }),
			kind: text$2({ nullable: true }),
			definitionName: text$2({ nullable: true }),
			status: text$2({ nullable: false }),
			toolCallId: text$2({ nullable: true }),
			nodeId: text$2({ nullable: true }),
			inputJson: text$2({ nullable: true }),
			outputJson: text$2({ nullable: true }),
			error: text$2({ nullable: true }),
			updatedAt: integer$2({ nullable: false })
		}
	})
};
function json$2(value) {
	return JSON.stringify(value ?? null);
}
function asRecord(payload) {
	if (payload && isReadonlyObject(payload) && !Array.isArray(payload)) return payload;
	return {};
}
function resolveActorId(env, context) {
	if (env.actorId) return env.actorId;
	return context.query(tables.actors.select().first())?.actorId ?? "unknown";
}
function insertEventLog(env, type, seq, actorId) {
	return tables.eventsLog.insert({
		id: env.id,
		actorId,
		type,
		seq,
		ts: env.ts,
		ephemeral: env.ephemeral ? 1 : 0,
		parentActorId: env.parentActorId ?? null,
		payloadJson: json$2(env.payload)
	});
}
function upsertActor(env, actorId, patch) {
	return tables.actors.insert({
		actorId,
		kind: patch.kind ?? null,
		status: patch.status ?? null,
		definitionName: patch.definitionName ?? null,
		parentActorId: patch.parentActorId ?? null,
		inputJson: patch.inputJson ?? null,
		outputJson: patch.outputJson ?? null,
		error: patch.error ?? null,
		updatedAt: env.ts
	}).onConflict("actorId", "replace");
}
function materialize(type, fn) {
	return [type, (env, context) => fn(env, context)];
}
var materializerEntries = [
	materialize("actor.started", (env, ctx) => {
		const seq = ctx.event.seqNum.global;
		const p = asRecord(env.payload);
		const actorId = resolveActorId(env, ctx);
		const ops = [insertEventLog(env, "actor.started", seq, actorId), upsertActor(env, actorId, {
			kind: isString(p.kind) ? p.kind : null,
			status: "running",
			definitionName: isString(p.definitionName) ? p.definitionName : null,
			parentActorId: isString(p.parentActorId) ? p.parentActorId : null,
			inputJson: json$2(p.input ?? null)
		})];
		const nodeIds = Array.isArray(p.nodeIds) ? p.nodeIds : [];
		for (const nodeId of nodeIds) {
			if (!isString(nodeId)) continue;
			ops.push(tables.nodes.insert({
				id: `${actorId}:${nodeId}`,
				actorId,
				nodeId,
				status: "pending",
				resultJson: null,
				error: null,
				reviewId: null,
				updatedAt: env.ts
			}).onConflict("id", "replace"));
		}
		return ops;
	}),
	materialize("actor.completed", (env, ctx) => {
		const seq = ctx.event.seqNum.global;
		const actorId = resolveActorId(env, ctx);
		const p = asRecord(env.payload);
		return [insertEventLog(env, "actor.completed", seq, actorId), upsertActor(env, actorId, {
			status: "completed",
			outputJson: json$2(p.output ?? null),
			error: null
		})];
	}),
	materialize("actor.failed", (env, ctx) => {
		const seq = ctx.event.seqNum.global;
		const actorId = resolveActorId(env, ctx);
		const p = asRecord(env.payload);
		return [insertEventLog(env, "actor.failed", seq, actorId), upsertActor(env, actorId, {
			status: "failed",
			error: isString(p.error) ? p.error : json$2(p.error ?? null)
		})];
	}),
	materialize("actor.cancelled", (env, ctx) => {
		const seq = ctx.event.seqNum.global;
		const actorId = resolveActorId(env, ctx);
		return [insertEventLog(env, "actor.cancelled", seq, actorId), upsertActor(env, actorId, { status: "cancelled" })];
	}),
	materialize("agent.message.received", (env, ctx) => {
		const seq = ctx.event.seqNum.global;
		const actorId = resolveActorId(env, ctx);
		const message = asRecord(asRecord(env.payload).message ?? null);
		return [insertEventLog(env, "agent.message.received", seq, actorId), tables.messages.insert({
			id: `${env.id}:msg`,
			actorId,
			seq,
			role: isString(message.role) ? message.role : "user",
			content: isString(message.content) ? message.content : "",
			toolCallId: isString(message.toolCallId) ? message.toolCallId : null,
			name: isString(message.name) ? message.name : null,
			turn: null,
			ts: env.ts
		}).onConflict("id", "replace")];
	}),
	materialize("agent.turn.started", (env, ctx) => [insertEventLog(env, "agent.turn.started", ctx.event.seqNum.global, resolveActorId(env, ctx))]),
	materialize("agent.turn.text_delta", (env, ctx) => [insertEventLog(env, "agent.turn.text_delta", ctx.event.seqNum.global, resolveActorId(env, ctx))]),
	materialize("agent.turn.steered", (env, ctx) => [insertEventLog(env, "agent.turn.steered", ctx.event.seqNum.global, resolveActorId(env, ctx))]),
	materialize("agent.message", (env, ctx) => {
		const seq = ctx.event.seqNum.global;
		const actorId = resolveActorId(env, ctx);
		const p = asRecord(env.payload);
		const message = asRecord(p.message ?? null);
		return [insertEventLog(env, "agent.message", seq, actorId), tables.messages.insert({
			id: `${env.id}:msg`,
			actorId,
			seq,
			role: isString(message.role) ? message.role : "assistant",
			content: isString(message.content) ? message.content : "",
			toolCallId: isString(message.toolCallId) ? message.toolCallId : null,
			name: isString(message.name) ? message.name : null,
			turn: isNumber(p.turn) ? p.turn : null,
			ts: env.ts
		}).onConflict("id", "replace")];
	}),
	materialize("agent.tool_call.requested", (env, ctx) => [insertEventLog(env, "agent.tool_call.requested", ctx.event.seqNum.global, resolveActorId(env, ctx))]),
	materialize("tool.result", (env, ctx) => {
		const seq = ctx.event.seqNum.global;
		const actorId = resolveActorId(env, ctx);
		const p = asRecord(env.payload);
		return [insertEventLog(env, "tool.result", seq, actorId), tables.messages.insert({
			id: `${env.id}:tool`,
			actorId,
			seq,
			role: "tool",
			content: isString(p.error) ? p.error : JSON.stringify(p.result ?? null),
			toolCallId: isString(p.toolCallId) ? p.toolCallId : null,
			name: isString(p.name) ? p.name : null,
			turn: isNumber(p.turn) ? p.turn : null,
			ts: env.ts
		}).onConflict("id", "replace")];
	}),
	materialize("child.spawned", (env, ctx) => {
		const seq = ctx.event.seqNum.global;
		const actorId = resolveActorId(env, ctx);
		const p = asRecord(env.payload);
		const childActorId = isString(p.childActorId) ? p.childActorId : null;
		const ops = [insertEventLog(env, "child.spawned", seq, actorId), upsertActor(env, actorId, { status: "waiting_child" })];
		if (childActorId) ops.push(tables.children.insert({
			childActorId,
			parentActorId: actorId,
			kind: isString(p.childKind) ? p.childKind : null,
			definitionName: isString(p.childDefinitionName) ? p.childDefinitionName : null,
			status: "running",
			toolCallId: isString(p.toolCallId) ? p.toolCallId : null,
			nodeId: isString(p.nodeId) ? p.nodeId : null,
			inputJson: json$2(p.input ?? null),
			outputJson: null,
			error: null,
			updatedAt: env.ts
		}).onConflict("childActorId", "replace"));
		return ops;
	}),
	materialize("child.completed", (env, ctx) => {
		const seq = ctx.event.seqNum.global;
		const actorId = resolveActorId(env, ctx);
		const p = asRecord(env.payload);
		const childActorId = isString(p.childActorId) ? p.childActorId : null;
		const failed = p.error != null && p.error !== "";
		const ops = [insertEventLog(env, "child.completed", seq, actorId)];
		if (childActorId) ops.push(tables.children.update({
			status: failed ? "failed" : "completed",
			outputJson: json$2(p.result ?? null),
			error: isString(p.error) ? p.error : p.error ? json$2(p.error) : null,
			updatedAt: env.ts
		}).where({ childActorId }));
		return ops;
	}),
	materialize("workflow.node.started", (env, ctx) => {
		const seq = ctx.event.seqNum.global;
		const actorId = resolveActorId(env, ctx);
		const p = asRecord(env.payload);
		const nodeId = isString(p.nodeId) ? p.nodeId : "unknown";
		return [insertEventLog(env, "workflow.node.started", seq, actorId), tables.nodes.insert({
			id: `${actorId}:${nodeId}`,
			actorId,
			nodeId,
			status: "running",
			resultJson: null,
			error: null,
			reviewId: null,
			updatedAt: env.ts
		}).onConflict("id", "replace")];
	}),
	materialize("workflow.node.finished", (env, ctx) => {
		const seq = ctx.event.seqNum.global;
		const actorId = resolveActorId(env, ctx);
		const p = asRecord(env.payload);
		const nodeId = isString(p.nodeId) ? p.nodeId : "unknown";
		return [insertEventLog(env, "workflow.node.finished", seq, actorId), tables.nodes.insert({
			id: `${actorId}:${nodeId}`,
			actorId,
			nodeId,
			status: p.error ? "failed" : "completed",
			resultJson: json$2(p.result ?? null),
			error: isString(p.error) ? p.error : p.error ? json$2(p.error) : null,
			reviewId: null,
			updatedAt: env.ts
		}).onConflict("id", "replace")];
	}),
	materialize("workflow.node.skipped", (env, ctx) => {
		const seq = ctx.event.seqNum.global;
		const actorId = resolveActorId(env, ctx);
		const p = asRecord(env.payload);
		const nodeId = isString(p.nodeId) ? p.nodeId : "unknown";
		return [insertEventLog(env, "workflow.node.skipped", seq, actorId), tables.nodes.insert({
			id: `${actorId}:${nodeId}`,
			actorId,
			nodeId,
			status: "skipped",
			resultJson: null,
			error: null,
			reviewId: null,
			updatedAt: env.ts
		}).onConflict("id", "replace")];
	}),
	materialize("review.requested", (env, ctx) => {
		const seq = ctx.event.seqNum.global;
		const actorId = resolveActorId(env, ctx);
		const p = asRecord(env.payload);
		const reviewId = isString(p.reviewId) ? p.reviewId : env.id;
		const nodeId = isString(p.nodeId) ? p.nodeId : null;
		const ops = [
			insertEventLog(env, "review.requested", seq, actorId),
			tables.reviews.insert({
				reviewId,
				actorId,
				title: isString(p.title) ? p.title : "Review",
				description: isString(p.description) ? p.description : null,
				status: "pending",
				nodeId,
				decisionJson: null,
				updatedAt: env.ts
			}).onConflict("reviewId", "replace"),
			upsertActor(env, actorId, { status: "waiting_review" })
		];
		if (nodeId) ops.push(tables.nodes.insert({
			id: `${actorId}:${nodeId}`,
			actorId,
			nodeId,
			status: "waiting_review",
			resultJson: null,
			error: null,
			reviewId,
			updatedAt: env.ts
		}).onConflict("id", "replace"));
		return ops;
	}),
	materialize("review.decided", (env, ctx) => {
		const seq = ctx.event.seqNum.global;
		const actorId = resolveActorId(env, ctx);
		const p = asRecord(env.payload);
		const reviewId = isString(p.reviewId) ? p.reviewId : env.id;
		const outcome = p.outcome === "reject" ? "rejected" : "approved";
		return [insertEventLog(env, "review.decided", seq, actorId), tables.reviews.insert({
			reviewId,
			actorId,
			title: "Review",
			description: null,
			status: outcome,
			nodeId: null,
			decisionJson: json$2({
				actionId: p.actionId ?? null,
				outcome: p.outcome ?? null,
				payload: p.payload ?? null
			}),
			updatedAt: env.ts
		}).onConflict("reviewId", "replace")];
	}),
	materialize("review.timed_out", (env, ctx) => {
		const seq = ctx.event.seqNum.global;
		const actorId = resolveActorId(env, ctx);
		const p = asRecord(env.payload);
		const reviewId = isString(p.reviewId) ? p.reviewId : env.id;
		return [insertEventLog(env, "review.timed_out", seq, actorId), tables.reviews.insert({
			reviewId,
			actorId,
			title: "Review",
			description: null,
			status: "timed_out",
			nodeId: null,
			decisionJson: null,
			updatedAt: env.ts
		}).onConflict("reviewId", "replace")];
	}),
	materialize("timer.set", (env, ctx) => [insertEventLog(env, "timer.set", ctx.event.seqNum.global, resolveActorId(env, ctx))]),
	materialize("timer.fired", (env, ctx) => [insertEventLog(env, "timer.fired", ctx.event.seqNum.global, resolveActorId(env, ctx))]),
	materialize("snapshot.taken", (env, ctx) => [insertEventLog(env, "snapshot.taken", ctx.event.seqNum.global, resolveActorId(env, ctx))])
];
var materializers = materializers$1(events, Object.fromEntries(materializerEntries));
var state = makeState({
	tables,
	materializers
});
var schema = makeSchema({
	events,
	state
});
function decideReview(store, decision) {
	store.commit(events.reviewDecided({
		id: `rev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
		actorId: store.storeId,
		ts: Date.now(),
		payload: {
			reviewId: decision.reviewId,
			actionId: decision.actionId ?? decision.outcome,
			outcome: decision.outcome,
			payload: decision.payload
		}
	}));
}
var queries = {
	actors: queryDb(tables.actors.select()),
	messages: queryDb(tables.messages.select().orderBy("seq", "asc")),
	nodes: queryDb(tables.nodes.select()),
	reviews: queryDb(tables.reviews.select()),
	children: queryDb(tables.children.select()),
	events: queryDb(tables.eventsLog.select().orderBy("seq", "asc"))
};
var require_globalThis = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports._globalThis = void 0;
	/** only globals that common to node and browsers are allowed */
	exports._globalThis = typeof globalThis === "object" ? globalThis : global;
}));
var require_node = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		Object.defineProperty(o, k2, {
			enumerable: true,
			get: function() {
				return m[k];
			}
		});
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __exportStar = exports && exports.__exportStar || function(m, exports$3) {
		for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$3, p)) __createBinding(exports$3, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	__exportStar(require_globalThis(), exports);
}));
var require_platform = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		Object.defineProperty(o, k2, {
			enumerable: true,
			get: function() {
				return m[k];
			}
		});
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __exportStar = exports && exports.__exportStar || function(m, exports$2) {
		for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$2, p)) __createBinding(exports$2, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	__exportStar(require_node(), exports);
}));
var require_version = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.VERSION = void 0;
	exports.VERSION = "1.9.0";
}));
var require_semver = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.isCompatible = exports._makeCompatibilityCheck = void 0;
	var version_1 = require_version();
	var re = /^(\d+)\.(\d+)\.(\d+)(-(.+))?$/;
	/**
	* Create a function to test an API version to see if it is compatible with the provided ownVersion.
	*
	* The returned function has the following semantics:
	* - Exact match is always compatible
	* - Major versions must match exactly
	*    - 1.x package cannot use global 2.x package
	*    - 2.x package cannot use global 1.x package
	* - The minor version of the API module requesting access to the global API must be less than or equal to the minor version of this API
	*    - 1.3 package may use 1.4 global because the later global contains all functions 1.3 expects
	*    - 1.4 package may NOT use 1.3 global because it may try to call functions which don't exist on 1.3
	* - If the major version is 0, the minor version is treated as the major and the patch is treated as the minor
	* - Patch and build tag differences are not considered at this time
	*
	* @param ownVersion version which should be checked against
	*/
	function _makeCompatibilityCheck(ownVersion) {
		const acceptedVersions = /* @__PURE__ */ new Set([ownVersion]);
		const rejectedVersions = /* @__PURE__ */ new Set();
		const myVersionMatch = ownVersion.match(re);
		if (!myVersionMatch) return () => false;
		const ownVersionParsed = {
			major: +myVersionMatch[1],
			minor: +myVersionMatch[2],
			patch: +myVersionMatch[3],
			prerelease: myVersionMatch[4]
		};
		if (ownVersionParsed.prerelease != null) return function isExactmatch(globalVersion) {
			return globalVersion === ownVersion;
		};
		function _reject(v) {
			rejectedVersions.add(v);
			return false;
		}
		function _accept(v) {
			acceptedVersions.add(v);
			return true;
		}
		return function isCompatible(globalVersion) {
			if (acceptedVersions.has(globalVersion)) return true;
			if (rejectedVersions.has(globalVersion)) return false;
			const globalVersionMatch = globalVersion.match(re);
			if (!globalVersionMatch) return _reject(globalVersion);
			const globalVersionParsed = {
				major: +globalVersionMatch[1],
				minor: +globalVersionMatch[2],
				patch: +globalVersionMatch[3],
				prerelease: globalVersionMatch[4]
			};
			if (globalVersionParsed.prerelease != null) return _reject(globalVersion);
			if (ownVersionParsed.major !== globalVersionParsed.major) return _reject(globalVersion);
			if (ownVersionParsed.major === 0) {
				if (ownVersionParsed.minor === globalVersionParsed.minor && ownVersionParsed.patch <= globalVersionParsed.patch) return _accept(globalVersion);
				return _reject(globalVersion);
			}
			if (ownVersionParsed.minor <= globalVersionParsed.minor) return _accept(globalVersion);
			return _reject(globalVersion);
		};
	}
	exports._makeCompatibilityCheck = _makeCompatibilityCheck;
	/**
	* Test an API version to see if it is compatible with this API.
	*
	* - Exact match is always compatible
	* - Major versions must match exactly
	*    - 1.x package cannot use global 2.x package
	*    - 2.x package cannot use global 1.x package
	* - The minor version of the API module requesting access to the global API must be less than or equal to the minor version of this API
	*    - 1.3 package may use 1.4 global because the later global contains all functions 1.3 expects
	*    - 1.4 package may NOT use 1.3 global because it may try to call functions which don't exist on 1.3
	* - If the major version is 0, the minor version is treated as the major and the patch is treated as the minor
	* - Patch and build tag differences are not considered at this time
	*
	* @param version version of the API requesting an instance of the global API
	*/
	exports.isCompatible = _makeCompatibilityCheck(version_1.VERSION);
}));
var require_global_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.unregisterGlobal = exports.getGlobal = exports.registerGlobal = void 0;
	var platform_1 = require_platform();
	var version_1 = require_version();
	var semver_1 = require_semver();
	var major = version_1.VERSION.split(".")[0];
	var GLOBAL_OPENTELEMETRY_API_KEY = Symbol.for(`opentelemetry.js.api.${major}`);
	var _global = platform_1._globalThis;
	function registerGlobal(type, instance, diag, allowOverride = false) {
		var _a;
		const api = _global[GLOBAL_OPENTELEMETRY_API_KEY] = (_a = _global[GLOBAL_OPENTELEMETRY_API_KEY]) !== null && _a !== void 0 ? _a : { version: version_1.VERSION };
		if (!allowOverride && api[type]) {
			const err = /* @__PURE__ */ new Error(`@opentelemetry/api: Attempted duplicate registration of API: ${type}`);
			diag.error(err.stack || err.message);
			return false;
		}
		if (api.version !== version_1.VERSION) {
			const err = /* @__PURE__ */ new Error(`@opentelemetry/api: Registration of version v${api.version} for ${type} does not match previously registered API v${version_1.VERSION}`);
			diag.error(err.stack || err.message);
			return false;
		}
		api[type] = instance;
		diag.debug(`@opentelemetry/api: Registered a global for ${type} v${version_1.VERSION}.`);
		return true;
	}
	exports.registerGlobal = registerGlobal;
	function getGlobal(type) {
		var _a, _b;
		const globalVersion = (_a = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _a === void 0 ? void 0 : _a.version;
		if (!globalVersion || !(0, semver_1.isCompatible)(globalVersion)) return;
		return (_b = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _b === void 0 ? void 0 : _b[type];
	}
	exports.getGlobal = getGlobal;
	function unregisterGlobal(type, diag) {
		diag.debug(`@opentelemetry/api: Unregistering a global for ${type} v${version_1.VERSION}.`);
		const api = _global[GLOBAL_OPENTELEMETRY_API_KEY];
		if (api) delete api[type];
	}
	exports.unregisterGlobal = unregisterGlobal;
}));
var require_ComponentLogger = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DiagComponentLogger = void 0;
	var global_utils_1 = require_global_utils();
	/**
	* Component Logger which is meant to be used as part of any component which
	* will add automatically additional namespace in front of the log message.
	* It will then forward all message to global diag logger
	* @example
	* const cLogger = diag.createComponentLogger({ namespace: '@opentelemetry/instrumentation-http' });
	* cLogger.debug('test');
	* // @opentelemetry/instrumentation-http test
	*/
	var DiagComponentLogger = class {
		constructor(props) {
			this._namespace = props.namespace || "DiagComponentLogger";
		}
		debug(...args) {
			return logProxy("debug", this._namespace, args);
		}
		error(...args) {
			return logProxy("error", this._namespace, args);
		}
		info(...args) {
			return logProxy("info", this._namespace, args);
		}
		warn(...args) {
			return logProxy("warn", this._namespace, args);
		}
		verbose(...args) {
			return logProxy("verbose", this._namespace, args);
		}
	};
	exports.DiagComponentLogger = DiagComponentLogger;
	function logProxy(funcName, namespace, args) {
		const logger = (0, global_utils_1.getGlobal)("diag");
		if (!logger) return;
		args.unshift(namespace);
		return logger[funcName](...args);
	}
}));
var require_types = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DiagLogLevel = void 0;
	(function(DiagLogLevel) {
		/** Diagnostic Logging level setting to disable all logging (except and forced logs) */
		DiagLogLevel[DiagLogLevel["NONE"] = 0] = "NONE";
		/** Identifies an error scenario */
		DiagLogLevel[DiagLogLevel["ERROR"] = 30] = "ERROR";
		/** Identifies a warning scenario */
		DiagLogLevel[DiagLogLevel["WARN"] = 50] = "WARN";
		/** General informational log message */
		DiagLogLevel[DiagLogLevel["INFO"] = 60] = "INFO";
		/** General debug log message */
		DiagLogLevel[DiagLogLevel["DEBUG"] = 70] = "DEBUG";
		/**
		* Detailed trace level logging should only be used for development, should only be set
		* in a development environment.
		*/
		DiagLogLevel[DiagLogLevel["VERBOSE"] = 80] = "VERBOSE";
		/** Used to set the logging level to include all logging */
		DiagLogLevel[DiagLogLevel["ALL"] = 9999] = "ALL";
	})(exports.DiagLogLevel || (exports.DiagLogLevel = {}));
}));
var require_logLevelLogger = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.createLogLevelDiagLogger = void 0;
	var types_1 = require_types();
	function createLogLevelDiagLogger(maxLevel, logger) {
		if (maxLevel < types_1.DiagLogLevel.NONE) maxLevel = types_1.DiagLogLevel.NONE;
		else if (maxLevel > types_1.DiagLogLevel.ALL) maxLevel = types_1.DiagLogLevel.ALL;
		logger = logger || {};
		function _filterFunc(funcName, theLevel) {
			const theFunc = logger[funcName];
			if (typeof theFunc === "function" && maxLevel >= theLevel) return theFunc.bind(logger);
			return function() {};
		}
		return {
			error: _filterFunc("error", types_1.DiagLogLevel.ERROR),
			warn: _filterFunc("warn", types_1.DiagLogLevel.WARN),
			info: _filterFunc("info", types_1.DiagLogLevel.INFO),
			debug: _filterFunc("debug", types_1.DiagLogLevel.DEBUG),
			verbose: _filterFunc("verbose", types_1.DiagLogLevel.VERBOSE)
		};
	}
	exports.createLogLevelDiagLogger = createLogLevelDiagLogger;
}));
var require_diag = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DiagAPI = void 0;
	var ComponentLogger_1 = require_ComponentLogger();
	var logLevelLogger_1 = require_logLevelLogger();
	var types_1 = require_types();
	var global_utils_1 = require_global_utils();
	var API_NAME = "diag";
	exports.DiagAPI = class DiagAPI {
		/**
		* Private internal constructor
		* @private
		*/
		constructor() {
			function _logProxy(funcName) {
				return function(...args) {
					const logger = (0, global_utils_1.getGlobal)("diag");
					if (!logger) return;
					return logger[funcName](...args);
				};
			}
			const self = this;
			const setLogger = (logger, optionsOrLogLevel = { logLevel: types_1.DiagLogLevel.INFO }) => {
				var _a, _b, _c;
				if (logger === self) {
					const err = /* @__PURE__ */ new Error("Cannot use diag as the logger for itself. Please use a DiagLogger implementation like ConsoleDiagLogger or a custom implementation");
					self.error((_a = err.stack) !== null && _a !== void 0 ? _a : err.message);
					return false;
				}
				if (typeof optionsOrLogLevel === "number") optionsOrLogLevel = { logLevel: optionsOrLogLevel };
				const oldLogger = (0, global_utils_1.getGlobal)("diag");
				const newLogger = (0, logLevelLogger_1.createLogLevelDiagLogger)((_b = optionsOrLogLevel.logLevel) !== null && _b !== void 0 ? _b : types_1.DiagLogLevel.INFO, logger);
				if (oldLogger && !optionsOrLogLevel.suppressOverrideMessage) {
					const stack = (_c = (/* @__PURE__ */ new Error()).stack) !== null && _c !== void 0 ? _c : "<failed to generate stacktrace>";
					oldLogger.warn(`Current logger will be overwritten from ${stack}`);
					newLogger.warn(`Current logger will overwrite one already registered from ${stack}`);
				}
				return (0, global_utils_1.registerGlobal)("diag", newLogger, self, true);
			};
			self.setLogger = setLogger;
			self.disable = () => {
				(0, global_utils_1.unregisterGlobal)(API_NAME, self);
			};
			self.createComponentLogger = (options) => {
				return new ComponentLogger_1.DiagComponentLogger(options);
			};
			self.verbose = _logProxy("verbose");
			self.debug = _logProxy("debug");
			self.info = _logProxy("info");
			self.warn = _logProxy("warn");
			self.error = _logProxy("error");
		}
		/** Get the singleton instance of the DiagAPI API */
		static instance() {
			if (!this._instance) this._instance = new DiagAPI();
			return this._instance;
		}
	};
}));
var require_baggage_impl = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.BaggageImpl = void 0;
	exports.BaggageImpl = class BaggageImpl {
		constructor(entries) {
			this._entries = entries ? new Map(entries) : /* @__PURE__ */ new Map();
		}
		getEntry(key) {
			const entry = this._entries.get(key);
			if (!entry) return;
			return Object.assign({}, entry);
		}
		getAllEntries() {
			return Array.from(this._entries.entries()).map(([k, v]) => [k, v]);
		}
		setEntry(key, entry) {
			const newBaggage = new BaggageImpl(this._entries);
			newBaggage._entries.set(key, entry);
			return newBaggage;
		}
		removeEntry(key) {
			const newBaggage = new BaggageImpl(this._entries);
			newBaggage._entries.delete(key);
			return newBaggage;
		}
		removeEntries(...keys) {
			const newBaggage = new BaggageImpl(this._entries);
			for (const key of keys) newBaggage._entries.delete(key);
			return newBaggage;
		}
		clear() {
			return new BaggageImpl();
		}
	};
}));
var require_symbol = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.baggageEntryMetadataSymbol = void 0;
	/**
	* Symbol used to make BaggageEntryMetadata an opaque type
	*/
	exports.baggageEntryMetadataSymbol = Symbol("BaggageEntryMetadata");
}));
var require_utils$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.baggageEntryMetadataFromString = exports.createBaggage = void 0;
	var diag_1 = require_diag();
	var baggage_impl_1 = require_baggage_impl();
	var symbol_1 = require_symbol();
	var diag = diag_1.DiagAPI.instance();
	/**
	* Create a new Baggage with optional entries
	*
	* @param entries An array of baggage entries the new baggage should contain
	*/
	function createBaggage(entries = {}) {
		return new baggage_impl_1.BaggageImpl(new Map(Object.entries(entries)));
	}
	exports.createBaggage = createBaggage;
	/**
	* Create a serializable BaggageEntryMetadata object from a string.
	*
	* @param str string metadata. Format is currently not defined by the spec and has no special meaning.
	*
	*/
	function baggageEntryMetadataFromString(str) {
		if (typeof str !== "string") {
			diag.error(`Cannot create baggage metadata from unknown type: ${typeof str}`);
			str = "";
		}
		return {
			__TYPE__: symbol_1.baggageEntryMetadataSymbol,
			toString() {
				return str;
			}
		};
	}
	exports.baggageEntryMetadataFromString = baggageEntryMetadataFromString;
}));
var require_context$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ROOT_CONTEXT = exports.createContextKey = void 0;
	/** Get a key to uniquely identify a context value */
	function createContextKey(description) {
		return Symbol.for(description);
	}
	exports.createContextKey = createContextKey;
	/** The root context is used as the default parent context when there is no active context */
	exports.ROOT_CONTEXT = new class BaseContext {
		/**
		* Construct a new context which inherits values from an optional parent context.
		*
		* @param parentContext a context from which to inherit values
		*/
		constructor(parentContext) {
			const self = this;
			self._currentContext = parentContext ? new Map(parentContext) : /* @__PURE__ */ new Map();
			self.getValue = (key) => self._currentContext.get(key);
			self.setValue = (key, value) => {
				const context = new BaseContext(self._currentContext);
				context._currentContext.set(key, value);
				return context;
			};
			self.deleteValue = (key) => {
				const context = new BaseContext(self._currentContext);
				context._currentContext.delete(key);
				return context;
			};
		}
	}();
}));
var require_consoleLogger = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DiagConsoleLogger = void 0;
	var consoleMap = [
		{
			n: "error",
			c: "error"
		},
		{
			n: "warn",
			c: "warn"
		},
		{
			n: "info",
			c: "info"
		},
		{
			n: "debug",
			c: "debug"
		},
		{
			n: "verbose",
			c: "trace"
		}
	];
	/**
	* A simple Immutable Console based diagnostic logger which will output any messages to the Console.
	* If you want to limit the amount of logging to a specific level or lower use the
	* {@link createLogLevelDiagLogger}
	*/
	var DiagConsoleLogger = class {
		constructor() {
			function _consoleFunc(funcName) {
				return function(...args) {
					if (console) {
						let theFunc = console[funcName];
						if (typeof theFunc !== "function") theFunc = console.log;
						if (typeof theFunc === "function") return theFunc.apply(console, args);
					}
				};
			}
			for (let i = 0; i < consoleMap.length; i++) this[consoleMap[i].n] = _consoleFunc(consoleMap[i].c);
		}
	};
	exports.DiagConsoleLogger = DiagConsoleLogger;
}));
var require_NoopMeter = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.createNoopMeter = exports.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = exports.NOOP_OBSERVABLE_GAUGE_METRIC = exports.NOOP_OBSERVABLE_COUNTER_METRIC = exports.NOOP_UP_DOWN_COUNTER_METRIC = exports.NOOP_HISTOGRAM_METRIC = exports.NOOP_GAUGE_METRIC = exports.NOOP_COUNTER_METRIC = exports.NOOP_METER = exports.NoopObservableUpDownCounterMetric = exports.NoopObservableGaugeMetric = exports.NoopObservableCounterMetric = exports.NoopObservableMetric = exports.NoopHistogramMetric = exports.NoopGaugeMetric = exports.NoopUpDownCounterMetric = exports.NoopCounterMetric = exports.NoopMetric = exports.NoopMeter = void 0;
	/**
	* NoopMeter is a noop implementation of the {@link Meter} interface. It reuses
	* constant NoopMetrics for all of its methods.
	*/
	var NoopMeter = class {
		constructor() {}
		/**
		* @see {@link Meter.createGauge}
		*/
		createGauge(_name, _options) {
			return exports.NOOP_GAUGE_METRIC;
		}
		/**
		* @see {@link Meter.createHistogram}
		*/
		createHistogram(_name, _options) {
			return exports.NOOP_HISTOGRAM_METRIC;
		}
		/**
		* @see {@link Meter.createCounter}
		*/
		createCounter(_name, _options) {
			return exports.NOOP_COUNTER_METRIC;
		}
		/**
		* @see {@link Meter.createUpDownCounter}
		*/
		createUpDownCounter(_name, _options) {
			return exports.NOOP_UP_DOWN_COUNTER_METRIC;
		}
		/**
		* @see {@link Meter.createObservableGauge}
		*/
		createObservableGauge(_name, _options) {
			return exports.NOOP_OBSERVABLE_GAUGE_METRIC;
		}
		/**
		* @see {@link Meter.createObservableCounter}
		*/
		createObservableCounter(_name, _options) {
			return exports.NOOP_OBSERVABLE_COUNTER_METRIC;
		}
		/**
		* @see {@link Meter.createObservableUpDownCounter}
		*/
		createObservableUpDownCounter(_name, _options) {
			return exports.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC;
		}
		/**
		* @see {@link Meter.addBatchObservableCallback}
		*/
		addBatchObservableCallback(_callback, _observables) {}
		/**
		* @see {@link Meter.removeBatchObservableCallback}
		*/
		removeBatchObservableCallback(_callback) {}
	};
	exports.NoopMeter = NoopMeter;
	var NoopMetric = class {};
	exports.NoopMetric = NoopMetric;
	var NoopCounterMetric = class extends NoopMetric {
		add(_value, _attributes) {}
	};
	exports.NoopCounterMetric = NoopCounterMetric;
	var NoopUpDownCounterMetric = class extends NoopMetric {
		add(_value, _attributes) {}
	};
	exports.NoopUpDownCounterMetric = NoopUpDownCounterMetric;
	var NoopGaugeMetric = class extends NoopMetric {
		record(_value, _attributes) {}
	};
	exports.NoopGaugeMetric = NoopGaugeMetric;
	var NoopHistogramMetric = class extends NoopMetric {
		record(_value, _attributes) {}
	};
	exports.NoopHistogramMetric = NoopHistogramMetric;
	var NoopObservableMetric = class {
		addCallback(_callback) {}
		removeCallback(_callback) {}
	};
	exports.NoopObservableMetric = NoopObservableMetric;
	var NoopObservableCounterMetric = class extends NoopObservableMetric {};
	exports.NoopObservableCounterMetric = NoopObservableCounterMetric;
	var NoopObservableGaugeMetric = class extends NoopObservableMetric {};
	exports.NoopObservableGaugeMetric = NoopObservableGaugeMetric;
	var NoopObservableUpDownCounterMetric = class extends NoopObservableMetric {};
	exports.NoopObservableUpDownCounterMetric = NoopObservableUpDownCounterMetric;
	exports.NOOP_METER = new NoopMeter();
	exports.NOOP_COUNTER_METRIC = new NoopCounterMetric();
	exports.NOOP_GAUGE_METRIC = new NoopGaugeMetric();
	exports.NOOP_HISTOGRAM_METRIC = new NoopHistogramMetric();
	exports.NOOP_UP_DOWN_COUNTER_METRIC = new NoopUpDownCounterMetric();
	exports.NOOP_OBSERVABLE_COUNTER_METRIC = new NoopObservableCounterMetric();
	exports.NOOP_OBSERVABLE_GAUGE_METRIC = new NoopObservableGaugeMetric();
	exports.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = new NoopObservableUpDownCounterMetric();
	/**
	* Create a no-op Meter
	*/
	function createNoopMeter() {
		return exports.NOOP_METER;
	}
	exports.createNoopMeter = createNoopMeter;
}));
var require_Metric = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ValueType = void 0;
	(function(ValueType) {
		ValueType[ValueType["INT"] = 0] = "INT";
		ValueType[ValueType["DOUBLE"] = 1] = "DOUBLE";
	})(exports.ValueType || (exports.ValueType = {}));
}));
var require_TextMapPropagator = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.defaultTextMapSetter = exports.defaultTextMapGetter = void 0;
	exports.defaultTextMapGetter = {
		get(carrier, key) {
			if (carrier == null) return;
			return carrier[key];
		},
		keys(carrier) {
			if (carrier == null) return [];
			return Object.keys(carrier);
		}
	};
	exports.defaultTextMapSetter = { set(carrier, key, value) {
		if (carrier == null) return;
		carrier[key] = value;
	} };
}));
var require_NoopContextManager = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NoopContextManager = void 0;
	var context_1 = require_context$1();
	var NoopContextManager = class {
		active() {
			return context_1.ROOT_CONTEXT;
		}
		with(_context, fn, thisArg, ...args) {
			return fn.call(thisArg, ...args);
		}
		bind(_context, target) {
			return target;
		}
		enable() {
			return this;
		}
		disable() {
			return this;
		}
	};
	exports.NoopContextManager = NoopContextManager;
}));
var require_context = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ContextAPI = void 0;
	var NoopContextManager_1 = require_NoopContextManager();
	var global_utils_1 = require_global_utils();
	var diag_1 = require_diag();
	var API_NAME = "context";
	var NOOP_CONTEXT_MANAGER = new NoopContextManager_1.NoopContextManager();
	exports.ContextAPI = class ContextAPI {
		/** Empty private constructor prevents end users from constructing a new instance of the API */
		constructor() {}
		/** Get the singleton instance of the Context API */
		static getInstance() {
			if (!this._instance) this._instance = new ContextAPI();
			return this._instance;
		}
		/**
		* Set the current context manager.
		*
		* @returns true if the context manager was successfully registered, else false
		*/
		setGlobalContextManager(contextManager) {
			return (0, global_utils_1.registerGlobal)(API_NAME, contextManager, diag_1.DiagAPI.instance());
		}
		/**
		* Get the currently active context
		*/
		active() {
			return this._getContextManager().active();
		}
		/**
		* Execute a function with an active context
		*
		* @param context context to be active during function execution
		* @param fn function to execute in a context
		* @param thisArg optional receiver to be used for calling fn
		* @param args optional arguments forwarded to fn
		*/
		with(context, fn, thisArg, ...args) {
			return this._getContextManager().with(context, fn, thisArg, ...args);
		}
		/**
		* Bind a context to a target function or event emitter
		*
		* @param context context to bind to the event emitter or function. Defaults to the currently active context
		* @param target function or event emitter to bind
		*/
		bind(context, target) {
			return this._getContextManager().bind(context, target);
		}
		_getContextManager() {
			return (0, global_utils_1.getGlobal)(API_NAME) || NOOP_CONTEXT_MANAGER;
		}
		/** Disable and remove the global context manager */
		disable() {
			this._getContextManager().disable();
			(0, global_utils_1.unregisterGlobal)(API_NAME, diag_1.DiagAPI.instance());
		}
	};
}));
var require_trace_flags = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.TraceFlags = void 0;
	(function(TraceFlags) {
		/** Represents no flag set. */
		TraceFlags[TraceFlags["NONE"] = 0] = "NONE";
		/** Bit to represent whether trace is sampled in trace flags. */
		TraceFlags[TraceFlags["SAMPLED"] = 1] = "SAMPLED";
	})(exports.TraceFlags || (exports.TraceFlags = {}));
}));
var require_invalid_span_constants = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.INVALID_SPAN_CONTEXT = exports.INVALID_TRACEID = exports.INVALID_SPANID = void 0;
	var trace_flags_1 = require_trace_flags();
	exports.INVALID_SPANID = "0000000000000000";
	exports.INVALID_TRACEID = "00000000000000000000000000000000";
	exports.INVALID_SPAN_CONTEXT = {
		traceId: exports.INVALID_TRACEID,
		spanId: exports.INVALID_SPANID,
		traceFlags: trace_flags_1.TraceFlags.NONE
	};
}));
var require_NonRecordingSpan = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NonRecordingSpan = void 0;
	var invalid_span_constants_1 = require_invalid_span_constants();
	/**
	* The NonRecordingSpan is the default {@link Span} that is used when no Span
	* implementation is available. All operations are no-op including context
	* propagation.
	*/
	var NonRecordingSpan = class {
		constructor(_spanContext = invalid_span_constants_1.INVALID_SPAN_CONTEXT) {
			this._spanContext = _spanContext;
		}
		spanContext() {
			return this._spanContext;
		}
		setAttribute(_key, _value) {
			return this;
		}
		setAttributes(_attributes) {
			return this;
		}
		addEvent(_name, _attributes) {
			return this;
		}
		addLink(_link) {
			return this;
		}
		addLinks(_links) {
			return this;
		}
		setStatus(_status) {
			return this;
		}
		updateName(_name) {
			return this;
		}
		end(_endTime) {}
		isRecording() {
			return false;
		}
		recordException(_exception, _time) {}
	};
	exports.NonRecordingSpan = NonRecordingSpan;
}));
var require_context_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getSpanContext = exports.setSpanContext = exports.deleteSpan = exports.setSpan = exports.getActiveSpan = exports.getSpan = void 0;
	var context_1 = require_context$1();
	var NonRecordingSpan_1 = require_NonRecordingSpan();
	var context_2 = require_context();
	/**
	* span key
	*/
	var SPAN_KEY = (0, context_1.createContextKey)("OpenTelemetry Context Key SPAN");
	/**
	* Return the span if one exists
	*
	* @param context context to get span from
	*/
	function getSpan(context) {
		return context.getValue(SPAN_KEY) || void 0;
	}
	exports.getSpan = getSpan;
	/**
	* Gets the span from the current context, if one exists.
	*/
	function getActiveSpan() {
		return getSpan(context_2.ContextAPI.getInstance().active());
	}
	exports.getActiveSpan = getActiveSpan;
	/**
	* Set the span on a context
	*
	* @param context context to use as parent
	* @param span span to set active
	*/
	function setSpan(context, span) {
		return context.setValue(SPAN_KEY, span);
	}
	exports.setSpan = setSpan;
	/**
	* Remove current span stored in the context
	*
	* @param context context to delete span from
	*/
	function deleteSpan(context) {
		return context.deleteValue(SPAN_KEY);
	}
	exports.deleteSpan = deleteSpan;
	/**
	* Wrap span context in a NoopSpan and set as span in a new
	* context
	*
	* @param context context to set active span on
	* @param spanContext span context to be wrapped
	*/
	function setSpanContext(context, spanContext) {
		return setSpan(context, new NonRecordingSpan_1.NonRecordingSpan(spanContext));
	}
	exports.setSpanContext = setSpanContext;
	/**
	* Get the span context of the span if it exists.
	*
	* @param context context to get values from
	*/
	function getSpanContext(context) {
		var _a;
		return (_a = getSpan(context)) === null || _a === void 0 ? void 0 : _a.spanContext();
	}
	exports.getSpanContext = getSpanContext;
}));
var require_spancontext_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.wrapSpanContext = exports.isSpanContextValid = exports.isValidSpanId = exports.isValidTraceId = void 0;
	var invalid_span_constants_1 = require_invalid_span_constants();
	var NonRecordingSpan_1 = require_NonRecordingSpan();
	var VALID_TRACEID_REGEX = /^([0-9a-f]{32})$/i;
	var VALID_SPANID_REGEX = /^[0-9a-f]{16}$/i;
	function isValidTraceId(traceId) {
		return VALID_TRACEID_REGEX.test(traceId) && traceId !== invalid_span_constants_1.INVALID_TRACEID;
	}
	exports.isValidTraceId = isValidTraceId;
	function isValidSpanId(spanId) {
		return VALID_SPANID_REGEX.test(spanId) && spanId !== invalid_span_constants_1.INVALID_SPANID;
	}
	exports.isValidSpanId = isValidSpanId;
	/**
	* Returns true if this {@link SpanContext} is valid.
	* @return true if this {@link SpanContext} is valid.
	*/
	function isSpanContextValid(spanContext) {
		return isValidTraceId(spanContext.traceId) && isValidSpanId(spanContext.spanId);
	}
	exports.isSpanContextValid = isSpanContextValid;
	/**
	* Wrap the given {@link SpanContext} in a new non-recording {@link Span}
	*
	* @param spanContext span context to be wrapped
	* @returns a new non-recording {@link Span} with the provided context
	*/
	function wrapSpanContext(spanContext) {
		return new NonRecordingSpan_1.NonRecordingSpan(spanContext);
	}
	exports.wrapSpanContext = wrapSpanContext;
}));
var require_NoopTracer = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NoopTracer = void 0;
	var context_1 = require_context();
	var context_utils_1 = require_context_utils();
	var NonRecordingSpan_1 = require_NonRecordingSpan();
	var spancontext_utils_1 = require_spancontext_utils();
	var contextApi = context_1.ContextAPI.getInstance();
	/**
	* No-op implementations of {@link Tracer}.
	*/
	var NoopTracer = class {
		startSpan(name, options, context = contextApi.active()) {
			if (Boolean(options === null || options === void 0 ? void 0 : options.root)) return new NonRecordingSpan_1.NonRecordingSpan();
			const parentFromContext = context && (0, context_utils_1.getSpanContext)(context);
			if (isSpanContext(parentFromContext) && (0, spancontext_utils_1.isSpanContextValid)(parentFromContext)) return new NonRecordingSpan_1.NonRecordingSpan(parentFromContext);
			else return new NonRecordingSpan_1.NonRecordingSpan();
		}
		startActiveSpan(name, arg2, arg3, arg4) {
			let opts;
			let ctx;
			let fn;
			if (arguments.length < 2) return;
			else if (arguments.length === 2) fn = arg2;
			else if (arguments.length === 3) {
				opts = arg2;
				fn = arg3;
			} else {
				opts = arg2;
				ctx = arg3;
				fn = arg4;
			}
			const parentContext = ctx !== null && ctx !== void 0 ? ctx : contextApi.active();
			const span = this.startSpan(name, opts, parentContext);
			const contextWithSpanSet = (0, context_utils_1.setSpan)(parentContext, span);
			return contextApi.with(contextWithSpanSet, fn, void 0, span);
		}
	};
	exports.NoopTracer = NoopTracer;
	function isSpanContext(spanContext) {
		return typeof spanContext === "object" && typeof spanContext["spanId"] === "string" && typeof spanContext["traceId"] === "string" && typeof spanContext["traceFlags"] === "number";
	}
}));
var require_ProxyTracer = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ProxyTracer = void 0;
	var NOOP_TRACER = new (require_NoopTracer()).NoopTracer();
	/**
	* Proxy tracer provided by the proxy tracer provider
	*/
	var ProxyTracer = class {
		constructor(_provider, name, version, options) {
			this._provider = _provider;
			this.name = name;
			this.version = version;
			this.options = options;
		}
		startSpan(name, options, context) {
			return this._getTracer().startSpan(name, options, context);
		}
		startActiveSpan(_name, _options, _context, _fn) {
			const tracer = this._getTracer();
			return Reflect.apply(tracer.startActiveSpan, tracer, arguments);
		}
		/**
		* Try to get a tracer from the proxy tracer provider.
		* If the proxy tracer provider has no delegate, return a noop tracer.
		*/
		_getTracer() {
			if (this._delegate) return this._delegate;
			const tracer = this._provider.getDelegateTracer(this.name, this.version, this.options);
			if (!tracer) return NOOP_TRACER;
			this._delegate = tracer;
			return this._delegate;
		}
	};
	exports.ProxyTracer = ProxyTracer;
}));
var require_NoopTracerProvider = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NoopTracerProvider = void 0;
	var NoopTracer_1 = require_NoopTracer();
	/**
	* An implementation of the {@link TracerProvider} which returns an impotent
	* Tracer for all calls to `getTracer`.
	*
	* All operations are no-op.
	*/
	var NoopTracerProvider = class {
		getTracer(_name, _version, _options) {
			return new NoopTracer_1.NoopTracer();
		}
	};
	exports.NoopTracerProvider = NoopTracerProvider;
}));
var require_ProxyTracerProvider = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ProxyTracerProvider = void 0;
	var ProxyTracer_1 = require_ProxyTracer();
	var NOOP_TRACER_PROVIDER = new (require_NoopTracerProvider()).NoopTracerProvider();
	/**
	* Tracer provider which provides {@link ProxyTracer}s.
	*
	* Before a delegate is set, tracers provided are NoOp.
	*   When a delegate is set, traces are provided from the delegate.
	*   When a delegate is set after tracers have already been provided,
	*   all tracers already provided will use the provided delegate implementation.
	*/
	var ProxyTracerProvider = class {
		/**
		* Get a {@link ProxyTracer}
		*/
		getTracer(name, version, options) {
			var _a;
			return (_a = this.getDelegateTracer(name, version, options)) !== null && _a !== void 0 ? _a : new ProxyTracer_1.ProxyTracer(this, name, version, options);
		}
		getDelegate() {
			var _a;
			return (_a = this._delegate) !== null && _a !== void 0 ? _a : NOOP_TRACER_PROVIDER;
		}
		/**
		* Set the delegate tracer provider
		*/
		setDelegate(delegate) {
			this._delegate = delegate;
		}
		getDelegateTracer(name, version, options) {
			var _a;
			return (_a = this._delegate) === null || _a === void 0 ? void 0 : _a.getTracer(name, version, options);
		}
	};
	exports.ProxyTracerProvider = ProxyTracerProvider;
}));
var require_SamplingResult = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.SamplingDecision = void 0;
	(function(SamplingDecision) {
		/**
		* `Span.isRecording() === false`, span will not be recorded and all events
		* and attributes will be dropped.
		*/
		SamplingDecision[SamplingDecision["NOT_RECORD"] = 0] = "NOT_RECORD";
		/**
		* `Span.isRecording() === true`, but `Sampled` flag in {@link TraceFlags}
		* MUST NOT be set.
		*/
		SamplingDecision[SamplingDecision["RECORD"] = 1] = "RECORD";
		/**
		* `Span.isRecording() === true` AND `Sampled` flag in {@link TraceFlags}
		* MUST be set.
		*/
		SamplingDecision[SamplingDecision["RECORD_AND_SAMPLED"] = 2] = "RECORD_AND_SAMPLED";
	})(exports.SamplingDecision || (exports.SamplingDecision = {}));
}));
var require_span_kind = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.SpanKind = void 0;
	(function(SpanKind) {
		/** Default value. Indicates that the span is used internally. */
		SpanKind[SpanKind["INTERNAL"] = 0] = "INTERNAL";
		/**
		* Indicates that the span covers server-side handling of an RPC or other
		* remote request.
		*/
		SpanKind[SpanKind["SERVER"] = 1] = "SERVER";
		/**
		* Indicates that the span covers the client-side wrapper around an RPC or
		* other remote request.
		*/
		SpanKind[SpanKind["CLIENT"] = 2] = "CLIENT";
		/**
		* Indicates that the span describes producer sending a message to a
		* broker. Unlike client and server, there is no direct critical path latency
		* relationship between producer and consumer spans.
		*/
		SpanKind[SpanKind["PRODUCER"] = 3] = "PRODUCER";
		/**
		* Indicates that the span describes consumer receiving a message from a
		* broker. Unlike client and server, there is no direct critical path latency
		* relationship between producer and consumer spans.
		*/
		SpanKind[SpanKind["CONSUMER"] = 4] = "CONSUMER";
	})(exports.SpanKind || (exports.SpanKind = {}));
}));
var require_status = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.SpanStatusCode = void 0;
	(function(SpanStatusCode) {
		/**
		* The default status.
		*/
		SpanStatusCode[SpanStatusCode["UNSET"] = 0] = "UNSET";
		/**
		* The operation has been validated by an Application developer or
		* Operator to have completed successfully.
		*/
		SpanStatusCode[SpanStatusCode["OK"] = 1] = "OK";
		/**
		* The operation contains an error.
		*/
		SpanStatusCode[SpanStatusCode["ERROR"] = 2] = "ERROR";
	})(exports.SpanStatusCode || (exports.SpanStatusCode = {}));
}));
var require_tracestate_validators = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.validateValue = exports.validateKey = void 0;
	var VALID_KEY_CHAR_RANGE = "[_0-9a-z-*/]";
	var VALID_KEY_REGEX = new RegExp(`^(?:${`[a-z]${VALID_KEY_CHAR_RANGE}{0,255}`}|${`[a-z0-9]${VALID_KEY_CHAR_RANGE}{0,240}@[a-z]${VALID_KEY_CHAR_RANGE}{0,13}`})$`);
	var VALID_VALUE_BASE_REGEX = /^[ -~]{0,255}[!-~]$/;
	var INVALID_VALUE_COMMA_EQUAL_REGEX = /,|=/;
	/**
	* Key is opaque string up to 256 characters printable. It MUST begin with a
	* lowercase letter, and can only contain lowercase letters a-z, digits 0-9,
	* underscores _, dashes -, asterisks *, and forward slashes /.
	* For multi-tenant vendor scenarios, an at sign (@) can be used to prefix the
	* vendor name. Vendors SHOULD set the tenant ID at the beginning of the key.
	* see https://www.w3.org/TR/trace-context/#key
	*/
	function validateKey(key) {
		return VALID_KEY_REGEX.test(key);
	}
	exports.validateKey = validateKey;
	/**
	* Value is opaque string up to 256 characters printable ASCII RFC0020
	* characters (i.e., the range 0x20 to 0x7E) except comma , and =.
	*/
	function validateValue(value) {
		return VALID_VALUE_BASE_REGEX.test(value) && !INVALID_VALUE_COMMA_EQUAL_REGEX.test(value);
	}
	exports.validateValue = validateValue;
}));
var require_tracestate_impl = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.TraceStateImpl = void 0;
	var tracestate_validators_1 = require_tracestate_validators();
	var MAX_TRACE_STATE_ITEMS = 32;
	var MAX_TRACE_STATE_LEN = 512;
	var LIST_MEMBERS_SEPARATOR = ",";
	var LIST_MEMBER_KEY_VALUE_SPLITTER = "=";
	exports.TraceStateImpl = class TraceStateImpl {
		constructor(rawTraceState) {
			this._internalState = /* @__PURE__ */ new Map();
			if (rawTraceState) this._parse(rawTraceState);
		}
		set(key, value) {
			const traceState = this._clone();
			if (traceState._internalState.has(key)) traceState._internalState.delete(key);
			traceState._internalState.set(key, value);
			return traceState;
		}
		unset(key) {
			const traceState = this._clone();
			traceState._internalState.delete(key);
			return traceState;
		}
		get(key) {
			return this._internalState.get(key);
		}
		serialize() {
			return this._keys().reduce((agg, key) => {
				agg.push(key + LIST_MEMBER_KEY_VALUE_SPLITTER + this.get(key));
				return agg;
			}, []).join(LIST_MEMBERS_SEPARATOR);
		}
		_parse(rawTraceState) {
			if (rawTraceState.length > MAX_TRACE_STATE_LEN) return;
			this._internalState = rawTraceState.split(LIST_MEMBERS_SEPARATOR).reverse().reduce((agg, part) => {
				const listMember = part.trim();
				const i = listMember.indexOf(LIST_MEMBER_KEY_VALUE_SPLITTER);
				if (i !== -1) {
					const key = listMember.slice(0, i);
					const value = listMember.slice(i + 1, part.length);
					if ((0, tracestate_validators_1.validateKey)(key) && (0, tracestate_validators_1.validateValue)(value)) agg.set(key, value);
				}
				return agg;
			}, /* @__PURE__ */ new Map());
			if (this._internalState.size > MAX_TRACE_STATE_ITEMS) this._internalState = new Map(Array.from(this._internalState.entries()).reverse().slice(0, MAX_TRACE_STATE_ITEMS));
		}
		_keys() {
			return Array.from(this._internalState.keys()).reverse();
		}
		_clone() {
			const traceState = new TraceStateImpl();
			traceState._internalState = new Map(this._internalState);
			return traceState;
		}
	};
}));
var require_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.createTraceState = void 0;
	var tracestate_impl_1 = require_tracestate_impl();
	function createTraceState(rawTraceState) {
		return new tracestate_impl_1.TraceStateImpl(rawTraceState);
	}
	exports.createTraceState = createTraceState;
}));
var require_context_api = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.context = void 0;
	/** Entrypoint for context API */
	exports.context = require_context().ContextAPI.getInstance();
}));
var require_diag_api = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.diag = void 0;
	/**
	* Entrypoint for Diag API.
	* Defines Diagnostic handler used for internal diagnostic logging operations.
	* The default provides a Noop DiagLogger implementation which may be changed via the
	* diag.setLogger(logger: DiagLogger) function.
	*/
	exports.diag = require_diag().DiagAPI.instance();
}));
var require_NoopMeterProvider = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NOOP_METER_PROVIDER = exports.NoopMeterProvider = void 0;
	var NoopMeter_1 = require_NoopMeter();
	/**
	* An implementation of the {@link MeterProvider} which returns an impotent Meter
	* for all calls to `getMeter`
	*/
	var NoopMeterProvider = class {
		getMeter(_name, _version, _options) {
			return NoopMeter_1.NOOP_METER;
		}
	};
	exports.NoopMeterProvider = NoopMeterProvider;
	exports.NOOP_METER_PROVIDER = new NoopMeterProvider();
}));
var require_metrics = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.MetricsAPI = void 0;
	var NoopMeterProvider_1 = require_NoopMeterProvider();
	var global_utils_1 = require_global_utils();
	var diag_1 = require_diag();
	var API_NAME = "metrics";
	exports.MetricsAPI = class MetricsAPI {
		/** Empty private constructor prevents end users from constructing a new instance of the API */
		constructor() {}
		/** Get the singleton instance of the Metrics API */
		static getInstance() {
			if (!this._instance) this._instance = new MetricsAPI();
			return this._instance;
		}
		/**
		* Set the current global meter provider.
		* Returns true if the meter provider was successfully registered, else false.
		*/
		setGlobalMeterProvider(provider) {
			return (0, global_utils_1.registerGlobal)(API_NAME, provider, diag_1.DiagAPI.instance());
		}
		/**
		* Returns the global meter provider.
		*/
		getMeterProvider() {
			return (0, global_utils_1.getGlobal)(API_NAME) || NoopMeterProvider_1.NOOP_METER_PROVIDER;
		}
		/**
		* Returns a meter from the global meter provider.
		*/
		getMeter(name, version, options) {
			return this.getMeterProvider().getMeter(name, version, options);
		}
		/** Remove the global meter provider */
		disable() {
			(0, global_utils_1.unregisterGlobal)(API_NAME, diag_1.DiagAPI.instance());
		}
	};
}));
var require_metrics_api = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.metrics = void 0;
	/** Entrypoint for metrics API */
	exports.metrics = require_metrics().MetricsAPI.getInstance();
}));
var require_NoopTextMapPropagator = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NoopTextMapPropagator = void 0;
	/**
	* No-op implementations of {@link TextMapPropagator}.
	*/
	var NoopTextMapPropagator = class {
		/** Noop inject function does nothing */
		inject(_context, _carrier) {}
		/** Noop extract function does nothing and returns the input context */
		extract(context, _carrier) {
			return context;
		}
		fields() {
			return [];
		}
	};
	exports.NoopTextMapPropagator = NoopTextMapPropagator;
}));
var require_context_helpers = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.deleteBaggage = exports.setBaggage = exports.getActiveBaggage = exports.getBaggage = void 0;
	var context_1 = require_context();
	/**
	* Baggage key
	*/
	var BAGGAGE_KEY = (0, require_context$1().createContextKey)("OpenTelemetry Baggage Key");
	/**
	* Retrieve the current baggage from the given context
	*
	* @param {Context} Context that manage all context values
	* @returns {Baggage} Extracted baggage from the context
	*/
	function getBaggage(context) {
		return context.getValue(BAGGAGE_KEY) || void 0;
	}
	exports.getBaggage = getBaggage;
	/**
	* Retrieve the current baggage from the active/current context
	*
	* @returns {Baggage} Extracted baggage from the context
	*/
	function getActiveBaggage() {
		return getBaggage(context_1.ContextAPI.getInstance().active());
	}
	exports.getActiveBaggage = getActiveBaggage;
	/**
	* Store a baggage in the given context
	*
	* @param {Context} Context that manage all context values
	* @param {Baggage} baggage that will be set in the actual context
	*/
	function setBaggage(context, baggage) {
		return context.setValue(BAGGAGE_KEY, baggage);
	}
	exports.setBaggage = setBaggage;
	/**
	* Delete the baggage stored in the given context
	*
	* @param {Context} Context that manage all context values
	*/
	function deleteBaggage(context) {
		return context.deleteValue(BAGGAGE_KEY);
	}
	exports.deleteBaggage = deleteBaggage;
}));
var require_propagation = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.PropagationAPI = void 0;
	var global_utils_1 = require_global_utils();
	var NoopTextMapPropagator_1 = require_NoopTextMapPropagator();
	var TextMapPropagator_1 = require_TextMapPropagator();
	var context_helpers_1 = require_context_helpers();
	var utils_1 = require_utils$1();
	var diag_1 = require_diag();
	var API_NAME = "propagation";
	var NOOP_TEXT_MAP_PROPAGATOR = new NoopTextMapPropagator_1.NoopTextMapPropagator();
	exports.PropagationAPI = class PropagationAPI {
		/** Empty private constructor prevents end users from constructing a new instance of the API */
		constructor() {
			this.createBaggage = utils_1.createBaggage;
			this.getBaggage = context_helpers_1.getBaggage;
			this.getActiveBaggage = context_helpers_1.getActiveBaggage;
			this.setBaggage = context_helpers_1.setBaggage;
			this.deleteBaggage = context_helpers_1.deleteBaggage;
		}
		/** Get the singleton instance of the Propagator API */
		static getInstance() {
			if (!this._instance) this._instance = new PropagationAPI();
			return this._instance;
		}
		/**
		* Set the current propagator.
		*
		* @returns true if the propagator was successfully registered, else false
		*/
		setGlobalPropagator(propagator) {
			return (0, global_utils_1.registerGlobal)(API_NAME, propagator, diag_1.DiagAPI.instance());
		}
		/**
		* Inject context into a carrier to be propagated inter-process
		*
		* @param context Context carrying tracing data to inject
		* @param carrier carrier to inject context into
		* @param setter Function used to set values on the carrier
		*/
		inject(context, carrier, setter = TextMapPropagator_1.defaultTextMapSetter) {
			return this._getGlobalPropagator().inject(context, carrier, setter);
		}
		/**
		* Extract context from a carrier
		*
		* @param context Context which the newly created context will inherit from
		* @param carrier Carrier to extract context from
		* @param getter Function used to extract keys from a carrier
		*/
		extract(context, carrier, getter = TextMapPropagator_1.defaultTextMapGetter) {
			return this._getGlobalPropagator().extract(context, carrier, getter);
		}
		/**
		* Return a list of all fields which may be used by the propagator.
		*/
		fields() {
			return this._getGlobalPropagator().fields();
		}
		/** Remove the global propagator */
		disable() {
			(0, global_utils_1.unregisterGlobal)(API_NAME, diag_1.DiagAPI.instance());
		}
		_getGlobalPropagator() {
			return (0, global_utils_1.getGlobal)(API_NAME) || NOOP_TEXT_MAP_PROPAGATOR;
		}
	};
}));
var require_propagation_api = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.propagation = void 0;
	/** Entrypoint for propagation API */
	exports.propagation = require_propagation().PropagationAPI.getInstance();
}));
var require_trace = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.TraceAPI = void 0;
	var global_utils_1 = require_global_utils();
	var ProxyTracerProvider_1 = require_ProxyTracerProvider();
	var spancontext_utils_1 = require_spancontext_utils();
	var context_utils_1 = require_context_utils();
	var diag_1 = require_diag();
	var API_NAME = "trace";
	exports.TraceAPI = class TraceAPI {
		/** Empty private constructor prevents end users from constructing a new instance of the API */
		constructor() {
			this._proxyTracerProvider = new ProxyTracerProvider_1.ProxyTracerProvider();
			this.wrapSpanContext = spancontext_utils_1.wrapSpanContext;
			this.isSpanContextValid = spancontext_utils_1.isSpanContextValid;
			this.deleteSpan = context_utils_1.deleteSpan;
			this.getSpan = context_utils_1.getSpan;
			this.getActiveSpan = context_utils_1.getActiveSpan;
			this.getSpanContext = context_utils_1.getSpanContext;
			this.setSpan = context_utils_1.setSpan;
			this.setSpanContext = context_utils_1.setSpanContext;
		}
		/** Get the singleton instance of the Trace API */
		static getInstance() {
			if (!this._instance) this._instance = new TraceAPI();
			return this._instance;
		}
		/**
		* Set the current global tracer.
		*
		* @returns true if the tracer provider was successfully registered, else false
		*/
		setGlobalTracerProvider(provider) {
			const success = (0, global_utils_1.registerGlobal)(API_NAME, this._proxyTracerProvider, diag_1.DiagAPI.instance());
			if (success) this._proxyTracerProvider.setDelegate(provider);
			return success;
		}
		/**
		* Returns the global tracer provider.
		*/
		getTracerProvider() {
			return (0, global_utils_1.getGlobal)(API_NAME) || this._proxyTracerProvider;
		}
		/**
		* Returns a tracer from the global tracer provider.
		*/
		getTracer(name, version) {
			return this.getTracerProvider().getTracer(name, version);
		}
		/** Remove the global tracer provider */
		disable() {
			(0, global_utils_1.unregisterGlobal)(API_NAME, diag_1.DiagAPI.instance());
			this._proxyTracerProvider = new ProxyTracerProvider_1.ProxyTracerProvider();
		}
	};
}));
var require_trace_api = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.trace = void 0;
	/** Entrypoint for trace API */
	exports.trace = require_trace().TraceAPI.getInstance();
}));
var import_src = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.trace = exports.propagation = exports.metrics = exports.diag = exports.context = exports.INVALID_SPAN_CONTEXT = exports.INVALID_TRACEID = exports.INVALID_SPANID = exports.isValidSpanId = exports.isValidTraceId = exports.isSpanContextValid = exports.createTraceState = exports.TraceFlags = exports.SpanStatusCode = exports.SpanKind = exports.SamplingDecision = exports.ProxyTracerProvider = exports.ProxyTracer = exports.defaultTextMapSetter = exports.defaultTextMapGetter = exports.ValueType = exports.createNoopMeter = exports.DiagLogLevel = exports.DiagConsoleLogger = exports.ROOT_CONTEXT = exports.createContextKey = exports.baggageEntryMetadataFromString = void 0;
	var utils_1 = require_utils$1();
	Object.defineProperty(exports, "baggageEntryMetadataFromString", {
		enumerable: true,
		get: function() {
			return utils_1.baggageEntryMetadataFromString;
		}
	});
	var context_1 = require_context$1();
	Object.defineProperty(exports, "createContextKey", {
		enumerable: true,
		get: function() {
			return context_1.createContextKey;
		}
	});
	Object.defineProperty(exports, "ROOT_CONTEXT", {
		enumerable: true,
		get: function() {
			return context_1.ROOT_CONTEXT;
		}
	});
	var consoleLogger_1 = require_consoleLogger();
	Object.defineProperty(exports, "DiagConsoleLogger", {
		enumerable: true,
		get: function() {
			return consoleLogger_1.DiagConsoleLogger;
		}
	});
	var types_1 = require_types();
	Object.defineProperty(exports, "DiagLogLevel", {
		enumerable: true,
		get: function() {
			return types_1.DiagLogLevel;
		}
	});
	var NoopMeter_1 = require_NoopMeter();
	Object.defineProperty(exports, "createNoopMeter", {
		enumerable: true,
		get: function() {
			return NoopMeter_1.createNoopMeter;
		}
	});
	var Metric_1 = require_Metric();
	Object.defineProperty(exports, "ValueType", {
		enumerable: true,
		get: function() {
			return Metric_1.ValueType;
		}
	});
	var TextMapPropagator_1 = require_TextMapPropagator();
	Object.defineProperty(exports, "defaultTextMapGetter", {
		enumerable: true,
		get: function() {
			return TextMapPropagator_1.defaultTextMapGetter;
		}
	});
	Object.defineProperty(exports, "defaultTextMapSetter", {
		enumerable: true,
		get: function() {
			return TextMapPropagator_1.defaultTextMapSetter;
		}
	});
	var ProxyTracer_1 = require_ProxyTracer();
	Object.defineProperty(exports, "ProxyTracer", {
		enumerable: true,
		get: function() {
			return ProxyTracer_1.ProxyTracer;
		}
	});
	var ProxyTracerProvider_1 = require_ProxyTracerProvider();
	Object.defineProperty(exports, "ProxyTracerProvider", {
		enumerable: true,
		get: function() {
			return ProxyTracerProvider_1.ProxyTracerProvider;
		}
	});
	var SamplingResult_1 = require_SamplingResult();
	Object.defineProperty(exports, "SamplingDecision", {
		enumerable: true,
		get: function() {
			return SamplingResult_1.SamplingDecision;
		}
	});
	var span_kind_1 = require_span_kind();
	Object.defineProperty(exports, "SpanKind", {
		enumerable: true,
		get: function() {
			return span_kind_1.SpanKind;
		}
	});
	var status_1 = require_status();
	Object.defineProperty(exports, "SpanStatusCode", {
		enumerable: true,
		get: function() {
			return status_1.SpanStatusCode;
		}
	});
	var trace_flags_1 = require_trace_flags();
	Object.defineProperty(exports, "TraceFlags", {
		enumerable: true,
		get: function() {
			return trace_flags_1.TraceFlags;
		}
	});
	var utils_2 = require_utils();
	Object.defineProperty(exports, "createTraceState", {
		enumerable: true,
		get: function() {
			return utils_2.createTraceState;
		}
	});
	var spancontext_utils_1 = require_spancontext_utils();
	Object.defineProperty(exports, "isSpanContextValid", {
		enumerable: true,
		get: function() {
			return spancontext_utils_1.isSpanContextValid;
		}
	});
	Object.defineProperty(exports, "isValidTraceId", {
		enumerable: true,
		get: function() {
			return spancontext_utils_1.isValidTraceId;
		}
	});
	Object.defineProperty(exports, "isValidSpanId", {
		enumerable: true,
		get: function() {
			return spancontext_utils_1.isValidSpanId;
		}
	});
	var invalid_span_constants_1 = require_invalid_span_constants();
	Object.defineProperty(exports, "INVALID_SPANID", {
		enumerable: true,
		get: function() {
			return invalid_span_constants_1.INVALID_SPANID;
		}
	});
	Object.defineProperty(exports, "INVALID_TRACEID", {
		enumerable: true,
		get: function() {
			return invalid_span_constants_1.INVALID_TRACEID;
		}
	});
	Object.defineProperty(exports, "INVALID_SPAN_CONTEXT", {
		enumerable: true,
		get: function() {
			return invalid_span_constants_1.INVALID_SPAN_CONTEXT;
		}
	});
	var context_api_1 = require_context_api();
	Object.defineProperty(exports, "context", {
		enumerable: true,
		get: function() {
			return context_api_1.context;
		}
	});
	var diag_api_1 = require_diag_api();
	Object.defineProperty(exports, "diag", {
		enumerable: true,
		get: function() {
			return diag_api_1.diag;
		}
	});
	var metrics_api_1 = require_metrics_api();
	Object.defineProperty(exports, "metrics", {
		enumerable: true,
		get: function() {
			return metrics_api_1.metrics;
		}
	});
	var propagation_api_1 = require_propagation_api();
	Object.defineProperty(exports, "propagation", {
		enumerable: true,
		get: function() {
			return propagation_api_1.propagation;
		}
	});
	var trace_api_1 = require_trace_api();
	Object.defineProperty(exports, "trace", {
		enumerable: true,
		get: function() {
			return trace_api_1.trace;
		}
	});
	exports.default = {
		context: context_api_1.context,
		diag: diag_api_1.diag,
		metrics: metrics_api_1.metrics,
		propagation: propagation_api_1.propagation,
		trace: trace_api_1.trace
	};
})))(), 1);
/**
* Context service containing OpenTelemetry trace flags used when constructing external span contexts.
*
* @category services
* @since 4.0.0
*/
var OtelTraceFlags = class extends (/*#__PURE__*/ Service()("@effect/opentelemetry/Tracer/OtelTraceFlags")) {};
/**
* Context service containing OpenTelemetry trace state used when constructing external span contexts.
*
* @category services
* @since 4.0.0
*/
var OtelTraceState = class extends (/*#__PURE__*/ Service()("@effect/opentelemetry/Tracer/OtelTraceState")) {};
/**
* Creates an Effect external span from an OpenTelemetry span context, preserving trace flags and trace state when provided.
*
* @category constructors
* @since 4.0.0
*/
var makeExternalSpan = (options) => {
	let annotations = empty();
	if (options.traceFlags !== void 0) annotations = add(annotations, OtelTraceFlags, options.traceFlags);
	if (typeof options.traceState === "string") try {
		annotations = add(annotations, OtelTraceState, import_src.createTraceState(options.traceState));
	} catch {}
	else if (options.traceState) annotations = add(annotations, OtelTraceState, options.traceState);
	return {
		_tag: "ExternalSpan",
		traceId: options.traceId,
		spanId: options.spanId,
		sampled: isNotUndefined(options.traceFlags) ? isSampled(options.traceFlags) : true,
		annotations
	};
};
var bigint1e6 = /*#__PURE__*/ BigInt(1e6);
var bigint1e9 = /*#__PURE__*/ BigInt(1e9);
/**
* Gets the current OpenTelemetry span.
*
* **Details**
*
* This accessor works with both the official OpenTelemetry API, such as
* `Tracer.layer` and `NodeSdk.layer`, and the lightweight OTLP module, such as
* `OtlpTracer.layer`. When using OTLP, the returned span is a wrapper that
* conforms to the OpenTelemetry `Span` interface.
*
* @category accessors
* @since 4.0.0
*/
var currentOtelSpan = /*#__PURE__*/ clockWith((clock) => map(currentSpan, (span) => OtelSpanTypeId in span ? span.span : makeOtelSpan(span, clock)));
var makeOtelSpan = (span, clock) => {
	const spanContext = {
		traceId: span.traceId,
		spanId: span.spanId,
		traceFlags: span.sampled ? import_src.TraceFlags.SAMPLED : import_src.TraceFlags.NONE,
		isRemote: false
	};
	let exit = void_;
	const self = {
		spanContext: () => spanContext,
		setAttribute(key, value) {
			span.attribute(key, value);
			return self;
		},
		setAttributes(attributes) {
			for (const [key, value] of Object.entries(attributes)) span.attribute(key, value);
			return self;
		},
		addEvent(name) {
			let attributes = void 0;
			let startTime = void 0;
			if (arguments.length === 3) {
				attributes = arguments[1];
				startTime = arguments[2];
			} else startTime = arguments[1];
			span.event(name, convertOtelTimeInput(startTime, clock), attributes);
			return self;
		},
		addLink(link) {
			span.addLinks([{
				span: makeExternalSpan(link.context),
				attributes: link.attributes ?? {}
			}]);
			return self;
		},
		addLinks(links) {
			span.addLinks(links.map((link) => ({
				span: makeExternalSpan(link.context),
				attributes: link.attributes ?? {}
			})));
			return self;
		},
		setStatus(status) {
			exit = status.code === import_src.SpanStatusCode.ERROR ? die(status.message ?? "Unknown error") : void_;
			return self;
		},
		updateName: () => self,
		end(endTime) {
			const time = convertOtelTimeInput(endTime, clock);
			span.end(time, exit);
			return self;
		},
		isRecording: constTrue,
		recordException(exception, timeInput) {
			const time = convertOtelTimeInput(timeInput, clock);
			const cause = fail(exception);
			const error = prettyErrors(cause, { includeCauseInStack: true })[0];
			span.event(error.message, time, {
				"exception.type": error.name,
				"exception.message": error.message,
				"exception.stacktrace": error.stack ?? ""
			});
		}
	};
	return self;
};
var convertOtelTimeInput = (input, clock) => {
	if (input === void 0) return clock.currentTimeNanosUnsafe();
	else if (typeof input === "number") return BigInt(Math.round(input * 1e6));
	else if (input instanceof Date) return BigInt(input.getTime()) * bigint1e6;
	const [seconds, nanos] = input;
	return BigInt(seconds) * bigint1e9 + BigInt(nanos);
};
var OtelSpanTypeId = "~@effect/opentelemetry/Tracer/OtelSpan";
import_src.SpanKind.INTERNAL, import_src.SpanKind.CLIENT, import_src.SpanKind.SERVER, import_src.SpanKind.PRODUCER, import_src.SpanKind.CONSUMER;
var isSampled = (traceFlags) => (traceFlags & import_src.TraceFlags.SAMPLED) === import_src.TraceFlags.SAMPLED;
var isDevEnv = () => {
	if (typeof process !== "undefined" && process.env !== void 0) return false;
	return false;
};
var objectToString = (error) => {
	const str = error?.toString();
	if (str !== "[object Object]") return str;
	try {
		return JSON.stringify(error, null, 2);
	} catch (e) {
		console.log(error);
		return `Error while printing error: ${e}`;
	}
};
var tryAsFunctionAndNew = (fnOrConstructor, arg) => {
	try {
		return new fnOrConstructor(arg);
	} catch (_e) {
		return fnOrConstructor(arg);
	}
};
var envTruish = (env) => env !== void 0 && env.toLowerCase() !== "false" && env.toLowerCase() !== "0";
/**
* Logs and throws for impossible states, pausing at a breakpoint in development.
*
* @param msg - The error message to log and pass to the error.
* @param args - Arbitrary arguments to include in the log.
*
* @see {@link dieDebugger} for the Effect equivalent.
*/
var shouldNeverHappen = (msg, ...args) => {
	console.error(msg, ...args);
	if (isDevEnv() === true) debugger;
	throw new Error(`This should never happen: ${msg}`);
};
/**
* Emits a span event on the current Effect span via the tracer logger.
*
* @remarks
*
* Unlike raw `otelSpan.addEvent`, this doesn't require manual span threading —
* it automatically targets the nearest enclosing `Effect.withSpan`. If no span
* is in context, the call is a no-op.
*/
var spanEvent = (message, attributes) => provideService(log(message).pipe(annotateLogs(attributes ?? {})), CurrentLoggers, /* @__PURE__ */ new Set([tracerLogger]));
var Effect_exports = /* @__PURE__ */ __exportAll({
	acquireReleaseLog: () => acquireReleaseLog,
	addFinalizerLog: () => addFinalizerLog,
	debugLogEnv: () => debugLogEnv,
	dieDebugger: () => dieDebugger,
	eventListener: () => eventListener,
	ignoreIf: () => ignoreIf,
	logBefore: () => logBefore,
	logDuration: () => logDuration,
	logWarnIfTakesLongerThan: () => logWarnIfTakesLongerThan,
	orDieDebugger: () => orDieDebugger,
	scopeWithCloseable: () => scopeWithCloseable,
	spanEvent: () => spanEvent,
	tapCauseLogPretty: () => tapCauseLogPretty,
	tapSync: () => tapSync$1,
	timeoutOrDie: () => timeoutOrDie,
	timeoutOrDieMessage: () => timeoutOrDieMessage,
	toForkedDeferred: () => toForkedDeferred,
	trySyncOrPromiseOrEffect: () => trySyncOrPromiseOrEffect,
	withPerformanceMeasure: () => withPerformanceMeasure
});
__reExport(Effect_exports, Effect_exports$1);
/** Same as `Effect.scopeWith` but with a closeable `Scope`. */
var scopeWithCloseable = (fn) => gen(function* () {
	const scope = yield* make$5();
	yield* addFinalizer((exit) => close(scope, exit));
	return yield* fn(scope).pipe(provide(scope));
});
function trySyncOrPromiseOrEffect(operation) {
	return try_({
		try: () => {
			const result = operation();
			if (isEffect(result) === true) return result;
			if (isPromiseLike(result) === true) return tryPromise(() => result);
			return succeed(result);
		},
		catch: (cause) => new UnknownError$2(cause)
	}).pipe(flatten);
}
var acquireReleaseLog = (label) => acquireRelease(log(`${label} acquire`), (_, ex) => log(`${label} release`, ex));
var addFinalizerLog = (...msgs) => addFinalizer((exit) => log(...msgs, exit._tag === "Success" ? "with success" : `with failure: ${pretty(exit.cause)}`));
var logBefore = (...msgs) => (eff) => andThen(log(...msgs), eff);
/** Logs both on errors and defects */
var tapCauseLogPretty = (eff) => tapCause(eff, (cause) => gen(function* () {
	if (hasInterruptsOnly(cause) === true) return;
	const span = yield* currentOtelSpan.pipe(catchTag("NoSuchElementError", (_) => void_$1));
	const firstErrLine = cause.toString().split("\n")[0];
	yield* logError(firstErrLine, cause).pipe((_) => span === void 0 ? _ : annotateLogs({
		spanId: span.spanContext().spanId,
		traceId: span.spanContext().traceId
	})(_));
}));
/**
* Creates a defect, pausing at a breakpoint in development.
*
* @param msg - The error message to include in the defect.
* @param args - Arbitrary arguments available for inspection during debugging.
*
* @see {@link shouldNeverHappen} for the non-Effect equivalent that throws synchronously.
* @see {@link orDieDebugger}
*/
var dieDebugger = (msg, ...args) => suspend(() => {
	if (isDevEnv() === true) debugger;
	return die$1(new Error(msg));
});
/**
* Converts a failure into a defect, pausing at a breakpoint in development.
*
* @param self - The effect on which to apply the operation.
*
* @see {@link Effect.orDie}
* @see {@link dieDebugger}
*/
var orDieDebugger = (self) => matchEffect(self, {
	onFailure: (error) => suspend(() => {
		if (isDevEnv() === true) debugger;
		return die$1(error);
	}),
	onSuccess: succeed
});
var ignoreIf = dual(2, (self, predicate) => self.pipe(catchIf(predicate, () => void_$1)));
var eventListener = (target, type, handler, options) => gen(function* () {
	const services = yield* context();
	const handlerFn = (event) => handler(event).pipe(runForkWith(services));
	target.addEventListener(type, handlerFn, { once: options?.once ?? false });
	yield* addFinalizer(() => sync(() => target.removeEventListener(type, handlerFn)));
});
var logWarnIfTakesLongerThan = ({ label, duration }) => (eff) => gen(function* () {
	const services = yield* context();
	let tookLongerThanTimer = false;
	const timeoutFiber = sleep(duration).pipe(tap(() => {
		tookLongerThanTimer = true;
		return logWarning(`${label}: Took longer than ${objectToString(duration)}ms`);
	}), runForkWith(services));
	const start = Date.now();
	const res = yield* eff.pipe(exit, onInterrupt(fn(function* () {
		const end = Date.now();
		yield* interrupt(timeoutFiber);
		if (tookLongerThanTimer === true) yield* logWarning(`${label}: Interrupted after ${end - start}ms`);
	})));
	if (tookLongerThanTimer) yield* logWarning(`${label}: Actual duration: ${Date.now() - start}ms`);
	yield* interrupt(timeoutFiber);
	return yield* res;
});
var logDuration = (label) => (eff) => gen(function* () {
	const start = Date.now();
	const res = yield* eff;
	yield* log(`${label}: ${format(millis(Date.now() - start))}`);
	return res;
});
var tapSync$1 = (tapFn) => (eff) => tap(eff, (a) => sync(() => tapFn(a)));
var debugLogEnv = (msg) => pipe(context(), tap((env) => log$1(msg ?? "debugLogEnv", env)));
/**
* Enforces a time limit on an effect, triggering a defect on timeout.
*
* @remarks
*
* This function allows you to enforce a time limit on the execution of an
* effect. If the effect does not complete within the given duration, it dies
* with a {@link Cause.TimeoutError} as an unchecked defect. Unlike
* {@link Effect.timeout}, which adds `TimeoutError` to the error channel,
* this function keeps the error channel unchanged by treating the timeout as
* a defect.
*
* The returned effect will either:
* - Succeed with the original effect's result if it completes within the
*   specified duration.
* - Die with a {@link Cause.TimeoutError} defect if the time limit is exceeded.
*
* @see {@link timeoutOrDieMessage} for a version with a custom message.
* @see {@link Effect.timeout} for a version that raises a `TimeoutError` as a typed error.
* @see {@link Effect.timeoutOrElse} for a version with a custom timeout branch.
*/
var timeoutOrDie = (duration) => (self) => timeoutOrElse(self, {
	duration,
	orElse: () => die$1(new TimeoutError())
});
/**
* Enforces a time limit on an effect, triggering a defect with a custom
* message on timeout.
*
* @remarks
*
* This function behaves like {@link timeoutOrDie}, but allows you to provide
* a custom message for the {@link Cause.TimeoutError} defect. This is useful
* for adding context about which operation timed out, making it easier to
* diagnose issues in logs or error reports.
*
* The returned effect will either:
* - Succeed with the original effect's result if it completes within the
*   specified duration.
* - Die with a {@link Cause.TimeoutError} defect containing the provided
*   message if the time limit is exceeded.
*
* @see {@link timeoutOrDie} for a version without a custom message.
* @see {@link Effect.timeout} for a version that raises a `TimeoutError` as a typed error.
* @see {@link Effect.timeoutOrElse} for a version with a custom timeout branch.
*/
var timeoutOrDieMessage = (duration, message) => (self) => timeoutOrElse(self, {
	duration,
	orElse: () => die$1(new TimeoutError(message))
});
var toForkedDeferred = (eff) => pipe(make$6(), tap((deferred) => pipe(exit(eff), flatMap((ex) => done(deferred, ex)), tapCauseLogPretty, forkScoped)));
var withPerformanceMeasure = (meaureLabel) => (eff) => acquireUseRelease(sync(() => globalThis.performance.mark(`${meaureLabel}:start`)), () => eff, () => sync(() => {
	globalThis.performance.mark(`${meaureLabel}:end`);
	globalThis.performance.measure(meaureLabel, `${meaureLabel}:start`, `${meaureLabel}:end`);
}));
var getSpanTrace = () => {
	const fiber = getCurrent();
	if (fiber === void 0 || fiber.currentSpan === void 0) return "No current fiber";
	return "";
};
var logSpanTrace = () => console.log(getSpanTrace());
globalThis.getSpanTrace = getSpanTrace;
globalThis.logSpanTrace = logSpanTrace;
var SubscriptionRef_exports = /* @__PURE__ */ __exportAll({
	fromStream: () => fromStream,
	waitUntil: () => waitUntil
});
__reExport(SubscriptionRef_exports, SubscriptionRef_exports$1);
var waitUntil = dual(2, (sref, predicate) => pipe(changes(sref), filter(predicate), runHead, flatMap(fromOption)));
var fromStream = (stream, initialValue) => gen(function* () {
	const sref = yield* make$11(initialValue);
	yield* stream.pipe(tap$1((a) => set(sref, a)), runDrain, forkScoped);
	return sref;
});
var RpcClient_exports = /* @__PURE__ */ __exportAll({
	SocketPinger: () => SocketPinger,
	layerProtocolSocketWithIsConnected: () => layerProtocolSocketWithIsConnected,
	makeProtocolSocketWithIsConnected: () => makeProtocolSocketWithIsConnected
});
__reExport(RpcClient_exports, RpcClient_exports$1);
var layerProtocolSocketWithIsConnected = (options) => effect(Protocol, makeProtocolSocketWithIsConnected(options));
var makeProtocolSocketWithIsConnected = (options) => Protocol.make(fnUntraced(function* (writeResponse, clientIds) {
	const socket = yield* Socket;
	const serialization = yield* RpcSerialization;
	const requestClientMap = /* @__PURE__ */ new Map();
	const write = yield* socket.writer;
	let parser = serialization.makeUnsafe();
	const pinger = yield* makePinger(write(parser.encode(constPing)), options?.pingSchedule);
	let currentError;
	const markConnected = SubscriptionRef_exports.set(options.isConnected, true);
	const broadcast = (response) => forEach(clientIds, (clientId) => writeResponse(clientId, response));
	yield* suspend(() => {
		currentError = void 0;
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
						pinger.reset();
						if (response._tag === "Pong") {
							pinger.onPong();
							return markConnected;
						}
						if ("requestId" in response) {
							const clientId = requestClientMap.get(response.requestId);
							if (clientId !== void 0) {
								if (response._tag === "Exit") requestClientMap.delete(response.requestId);
								return markConnected.pipe(andThen(writeResponse(clientId, response)));
							}
						}
						return markConnected.pipe(andThen(broadcast(response)));
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
		}).pipe(raceFirst(flatMap(pinger.timeout, () => fail$1(new SocketError({ reason: new SocketOpenError({
			kind: "Timeout",
			cause: /* @__PURE__ */ new Error("ping timeout")
		}) })))));
	}).pipe(flatMap(() => fail$1(new SocketError({ reason: new SocketCloseError({
		code: 1e3,
		closeReason: "Closing connection"
	}) }))), tapCause(fn(function* (cause) {
		yield* SubscriptionRef_exports.set(options.isConnected, false);
		const error = findError(cause);
		if (options?.retryTransientErrors !== void 0 && isSuccess(error) === true && error.success.reason._tag === "SocketOpenError") return;
		currentError = new RpcClientError({ reason: isSuccess(error) === true ? error.success.reason : new RpcClientDefect({
			message: "Unknown socket error",
			cause: squash(cause)
		}) });
		return yield* broadcast({
			_tag: "ClientProtocolError",
			error: currentError
		});
	})), options?.retryTransientErrors !== void 0 ? retry(options.retryTransientErrors) : identity, annotateLogs({
		module: "RpcClient",
		method: "makeProtocolSocket"
	}), interruptible, ignore, provideService(UnhandledLogLevel, void 0), forkScoped);
	return {
		send: (clientId, request) => {
			if (currentError !== void 0) return fail$1(currentError);
			if (request._tag === "Request") requestClientMap.set(request.id, clientId);
			const encoded = parser.encode(request);
			if (encoded === void 0) return void_$1;
			return orDie(write(encoded));
		},
		supportsAck: true,
		supportsTransferables: false,
		pinger
	};
}));
var SocketPinger = map(Protocol, (protocol) => protocol.pinger);
var makePinger = fnUntraced(function* (writePing, pingSchedule = spaced(1e4).pipe(addDelay(() => succeed(5e3)))) {
	const manualPingDeferreds = /* @__PURE__ */ new Set();
	let recievedPong = true;
	const latch = makeUnsafe();
	const reset = () => {
		recievedPong = true;
		latch.closeUnsafe();
	};
	const onPong = () => {
		recievedPong = true;
		for (const deferred of manualPingDeferreds) doneUnsafe(deferred, void_$1);
	};
	yield* suspend(() => {
		if (recievedPong === false) return asVoid(latch.open);
		recievedPong = false;
		return asVoid(writePing);
	}).pipe(schedule(pingSchedule), ignore, forever, interruptible, forkScoped);
	const ping = gen(function* () {
		const deferred = yield* make$6();
		manualPingDeferreds.add(deferred);
		yield* _await(deferred);
		manualPingDeferreds.delete(deferred);
	});
	return {
		timeout: latch.await,
		reset,
		onPong,
		ping
	};
});
var Schedule_exports = /* @__PURE__ */ __exportAll({ exponentialBackoff10Sec: () => exponentialBackoff10Sec });
__reExport(Schedule_exports, Schedule_exports$1);
var exponentialBackoff10Sec = pipe(exponential(millis(10), 4), modifyDelay(({ duration }) => succeed(min(duration, seconds(1)))), upTo({ duration: seconds(10) }));
/**
* Diffs two values for a given schema and traverses downwards and returns a list of differences.
*/
var debugDiff = (base) => (a, b) => {
	const bag = [];
	debugDiffImpl(base.ast, a, b, "", bag);
	return bag;
};
var debugDiffImpl = (ast, a, b, path, bag) => {
	if (toEquivalence({ ast })(a, b) === false) {
		if (isUnion(ast) === true) {
			if (isTaggedUnion(ast) === true) {
				bag.push({
					path,
					a,
					b,
					ast
				});
				return;
			} else for (const type of ast.types) try {
				debugDiffImpl(type, a, b, path, bag);
				return;
			} catch {}
		} else if (isObjects(ast) === true) for (const prop of ast.propertySignatures) debugDiffImpl(prop.type, a[prop.name], b[prop.name], `${path}.${prop.name.toString()}`, bag);
		else bag.push({
			path,
			a,
			b,
			ast
		});
	}
};
var isTaggedUnion = (ast) => {
	if (isUnion(ast) === true) return ast.types.every((type) => {
		if (isObjects(type) === false) return false;
		return type.propertySignatures.some((prop) => prop.name.toString() === "_tag");
	});
	return false;
};
var Schema_exports = /* @__PURE__ */ __exportAll({
	debugDiff: () => debugDiff,
	decodeSyncDebug: () => decodeSyncDebug,
	encodeSyncDebug: () => encodeSyncDebug,
	encodeWithTransferables: () => encodeWithTransferables,
	getResolvedPropertySignatures: () => getResolvedPropertySignatures,
	hash: () => hash$1,
	head: () => head,
	headOrElse: () => headOrElse,
	jsonStringIndented: () => jsonStringIndented,
	pluck: () => pluck
});
__reExport(Schema_exports, Schema_exports$1);
var pluck = (key) => (schema) => {
	const field = schema.fields[key];
	return schema.mapFields(pick([key])).pipe(decodeTo(toType(field), {
		decode: transform((whole) => whole[key]),
		encode: transform((value) => ({ [key]: value }))
	}));
};
/**
* Like {@link fromJsonString}, but the ENCODED form is an *indented* JSON string
* (default 2-space) instead of compact — for committed/human-read JSON files
* (package.json, release plans, CI previews) that must stay diff-friendly while
* still round-tripping through the schema.
*
* Use a concrete schema for known shapes (adds validation) or `Schema.Unknown`
* for open-ended ones (the indented analogue of `fromJsonString(Schema.Unknown)`).
*
* TODO collapse into `fromJsonString(schema, { space })` now that Effect 4 accepts a
* `space` option; kept separate here to keep the Effect upgrade free of release-tooling changes.
*/
var jsonStringIndented = (schema, space = 2) => schema.pipe(encodeTo(String$1, {
	decode: parseJson(),
	encode: stringifyJson({ space })
}));
var head = (array) => array.pipe(decodeTo(Option(toType(array.value)), transform$1({
	decode: head$1,
	encode: match({
		onNone: () => [],
		onSome: of$2
	})
})));
var headOrElse = dual((args) => isSchema(args[0]), (array, orElse) => array.pipe(decodeTo(toType(array.value), transformOrFail({
	decode: (array) => isReadonlyArrayNonEmpty(array) === true ? succeed(headNonEmpty(array)) : orElse === void 0 ? fail$1(new InvalidValue({ message: "Unable to retrieve the first element of an empty array" })) : succeed(orElse()),
	encode: (value) => succeed(of$2(value))
}))));
var hash$1 = (schema) => {
	try {
		return string(JSON.stringify(schema.ast, null, 2));
	} catch {
		console.warn(`Schema hashing failed, falling back to hashing the shortend schema AST string. This is less reliable and may cause false positives.`);
		return hash$2(schema.ast.toString());
	}
};
var getResolvedPropertySignatures = (schema) => {
	const resolvedAst = toType$1(schema.ast);
	return isObjects(resolvedAst) === true ? resolvedAst.propertySignatures : [];
};
var encodeWithTransferables = (schema, options) => (a, overrideOptions) => gen(function* () {
	const collector = yield* makeCollector;
	return [yield* encodeEffect(schema, options)(a, overrideOptions).pipe(provideService(Collector, collector)), collector.readUnsafe()];
});
var decodeSyncDebug = (schema, options) => (input, overrideOptions) => {
	const res = decodeResult(schema, options)(input, overrideOptions);
	if (isFailure(res) === true) return shouldNeverHappen(`decodeSyncDebug failed:`, res.failure);
	else return res.success;
};
var encodeSyncDebug = (schema, options) => (input, overrideOptions) => {
	const res = encodeResult(schema, options)(input, overrideOptions);
	if (isFailure(res) === true) return shouldNeverHappen(`encodeSyncDebug failed:`, res.failure);
	else return res.success;
};
var Stream_exports = /* @__PURE__ */ __exportAll({
	concatWithLastElement: () => concatWithLastElement,
	emitIfEmpty: () => emitIfEmpty,
	runCollectReadonlyArray: () => runCollectReadonlyArray,
	runFirst: () => runFirst,
	runFirstUnsafe: () => runFirstUnsafe,
	skipRepeated: () => skipRepeated,
	skipRepeated_: () => skipRepeated_,
	tapArray: () => tapArray,
	tapLog: () => tapLog,
	tapLogWithLabel: () => tapLogWithLabel,
	tapSync: () => tapSync
});
__reExport(Stream_exports, Stream_exports$1);
var tapLog = (stream) => tapArray(forEach((_) => succeed(console.log(_))))(stream);
var tapSync = (tapFn) => (stream) => tap$1(stream, (a) => sync(() => tapFn(a)));
var tapLogWithLabel = (label) => (stream) => tapArray(forEach((_) => succeed(console.log(label, _))))(stream);
/**
* Runs an effect once for each array batch emitted by the stream, preserving
* the original stream elements.
*
* Use this for batch-oriented side effects such as `Queue.offerAll`. For
* element-wise side effects, prefer `Stream.tap`.
*
* @see {@link Stream.tap} for running an effect once per element.
*/
var tapArray = (f) => (self) => mapArrayEffect(self, (array) => pipe(f(array), map(() => array)));
var isIdentity = (a1, a2) => a1 === a2;
var skipRepeated = (isEqual = isIdentity) => (stream) => skipRepeated_(stream, isEqual);
var skipRepeated_ = (stream, isEqual = isIdentity) => pipe(make$15(none()), fromEffect, flatMap$2((ref) => pipe(stream, filterEffect((el) => pipe(get$2(ref), flatMap((prevEl) => {
	if (prevEl._tag === "None" || isEqual(prevEl.value, el) === false) return pipe(set$1(ref, some(el)), map(() => true));
	else return succeed(false);
}))))));
/**
* Returns the first element of the stream or `None` if the stream is empty.
* It's different than `Stream.runHead` which runs the stream to completion.
* */
var runFirst = (stream) => stream.pipe(take(1), runCollect, map(head$1));
/**
* Returns the first element of the stream or throws a `NoSuchElementError` if the stream is empty.
* It's different than `Stream.runHead` which runs the stream to completion.
* */
var runFirstUnsafe = (stream) => runFirst(stream).pipe(flatMap(fromOption));
var runCollectReadonlyArray = (stream) => stream.pipe(runCollect);
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
var concatWithLastElement = dual(2, (stream1, getStream2) => pipe(make$15(none()), fromEffect, flatMap$2((lastRef) => pipe(stream1, tap$1((value) => set$1(lastRef, some(value))), concat(pipe(get$2(lastRef), map(getStream2), unwrap$1))))));
/**
* Emits a default value if the stream is empty, otherwise passes through all elements.
* Uses `concatWithLastElement` internally to detect if the stream was empty.
*
* @param fallbackValue - The value to emit if the stream is empty
* @returns A dual function that can be used in pipe or direct call
*
* @example
* ```ts
* // Direct usage
* const result = emitIfEmpty(Stream.empty, 'default')
* // Emits: 'default'
*
* // Piped usage
* const result = Stream.make(1, 2, 3).pipe(emitIfEmpty('fallback'))
* // Emits: 1, 2, 3
*
* const empty = Stream.empty.pipe(emitIfEmpty('fallback'))
* // Emits: 'fallback'
* ```
*/
var emitIfEmpty = dual(2, (stream, fallbackValue) => concatWithLastElement(stream, (lastElement) => lastElement._tag === "None" ? make$7(fallbackValue) : empty$1));
/**
* @since 2.0.0
*/
var ReadableTypeId = Symbol.for("effect/Readable");
/**
* @since 2.0.0
* @category type ids
*/
var TypeId$3 = Symbol.for("effect/Subscribable");
var Proto = Object.assign(Prototype({
	label: "Subscribable",
	evaluate() {
		return this.get;
	}
}), {
	[ReadableTypeId]: ReadableTypeId,
	[TypeId$3]: TypeId$3
});
/**
* @since 2.0.0
* @category constructors
*/
var make$4 = (options) => Object.assign(Object.create(Proto), options);
var fromSubscriptionRef = (ref) => make$4({
	get: get(ref),
	changes: changes(ref)
});
dual(2, (self, f) => make$4({
	get: map(self.get, f),
	changes: map$2(self.changes, f)
}));
dual(2, (self, f) => make$4({
	get: flatMap(self.get, f),
	changes: mapEffect(self.changes, f)
}));
make$4({
	get: never,
	changes: never$1
});
var WebChannelSymbol = Symbol("WebChannel");
var DebugPingMessage = TaggedStruct("WebChannel.DebugPing", {
	message: String$1,
	payload: optional(String$1)
});
var WebChannelPing = TaggedStruct("WebChannel.Ping", { requestId: String$1 });
var WebChannelPong = TaggedStruct("WebChannel.Pong", { requestId: String$1 });
var WebChannelHeartbeat = Union([WebChannelPing, WebChannelPong]);
var schemaWithWebChannelMessages = (schema) => ({
	send: Union([
		schema.send,
		DebugPingMessage,
		WebChannelPing,
		WebChannelPong
	]),
	listen: Union([
		schema.listen,
		DebugPingMessage,
		WebChannelPing,
		WebChannelPong
	])
});
var mapSchema = (schema) => hasProperty(schema, "send") === true && hasProperty(schema, "listen") === true ? schemaWithWebChannelMessages(schema) : schemaWithWebChannelMessages({
	send: schema,
	listen: schema
});
var listenToDebugPing = (channelName) => (stream) => stream.pipe(filterEffect(fn(function* (msg) {
	if (isSuccess(msg) === true && is(DebugPingMessage)(msg.success) === true) {
		yield* logDebug(`WebChannel:ping [${channelName}] ${msg.success.message}`, msg.success.payload);
		return false;
	}
	return true;
})));
var messagePortChannel = ({ port, schema: inputSchema, debugId }) => scopeWithCloseable((scope) => Effect_exports.gen(function* () {
	const schema = mapSchema(inputSchema);
	const label = debugId === void 0 ? "messagePort" : `messagePort:${debugId}`;
	const messageQueue = yield* Effect_exports.acquireRelease(unbounded(), shutdown);
	const handler = (event) => {
		offerUnsafe(messageQueue, event);
	};
	port.addEventListener("message", handler);
	yield* Effect_exports.addFinalizer(() => Effect_exports.sync(() => port.removeEventListener("message", handler)));
	const send = (message) => Effect_exports.gen(function* () {
		const [messageEncoded, transferables] = yield* encodeWithTransferables(schema.send)(message);
		port.postMessage(messageEncoded, transferables);
	});
	const listen = Stream_exports.fromQueue(messageQueue).pipe(Stream_exports.map((_) => Schema_exports.decodeResult(schema.listen)(_.data)), listenToDebugPing(label));
	port.start();
	const closedDeferred = yield* Effect_exports.acquireRelease(make$6(), done(void_));
	const supportsTransferables = true;
	yield* Effect_exports.addFinalizer(() => Effect_exports.try({
		try: () => port.close(),
		catch: (cause) => new UnknownError$2(cause)
	}).pipe(Effect_exports.ignore));
	return {
		[WebChannelSymbol]: WebChannelSymbol,
		send,
		listen,
		closedDeferred,
		shutdown: close(scope, succeed$1("shutdown")),
		schema,
		supportsTransferables
	};
}).pipe(Effect_exports.withSpan(`WebChannel:messagePortChannel`)));
var messagePortChannelWithAck = ({ port, schema: inputSchema, debugId }) => scopeWithCloseable((scope) => Effect_exports.gen(function* () {
	const schema = mapSchema(inputSchema);
	const label = debugId === void 0 ? "messagePort" : `messagePort:${debugId}`;
	const requestAckMap = /* @__PURE__ */ new Map();
	const ChannelRequest = Schema_exports.TaggedStruct("ChannelRequest", {
		id: Schema_exports.String,
		payload: Schema_exports.Union([schema.listen, schema.send])
	}).annotate({ title: "webmesh.ChannelRequest" });
	const ChannelRequestAck = Schema_exports.TaggedStruct("ChannelRequestAck", { reqId: Schema_exports.String }).annotate({ title: "webmesh.ChannelRequestAck" });
	const ChannelMessage = Schema_exports.Union([ChannelRequest, ChannelRequestAck]).annotate({ title: "webmesh.ChannelMessage" });
	const debugInfo = {
		sendTotal: 0,
		sendPending: 0,
		listenTotal: 0,
		id: debugId
	};
	const messageQueue = yield* Effect_exports.acquireRelease(unbounded(), shutdown);
	const handler = (event) => {
		offerUnsafe(messageQueue, event);
	};
	port.addEventListener("message", handler);
	yield* Effect_exports.addFinalizer(() => Effect_exports.sync(() => port.removeEventListener("message", handler)));
	const send = (message) => Effect_exports.gen(function* () {
		debugInfo.sendTotal++;
		debugInfo.sendPending++;
		const id = crypto.randomUUID();
		const [messageEncoded, transferables] = yield* encodeWithTransferables(ChannelMessage)({
			_tag: "ChannelRequest",
			id,
			payload: message
		});
		const ack = yield* make$6();
		requestAckMap.set(id, ack);
		port.postMessage(messageEncoded, transferables);
		yield* _await(ack);
		requestAckMap.delete(id);
		debugInfo.sendPending--;
	});
	const listen = Stream_exports.fromQueue(messageQueue).pipe(Stream_exports.map((_) => Schema_exports.decodeResult(ChannelMessage)(_.data)), Stream_exports.tap((msg) => Effect_exports.gen(function* () {
		if (isSuccess(msg) === true) {
			if (msg.success._tag === "ChannelRequestAck") yield* succeed$2(requestAckMap.get(msg.success.reqId), void 0);
			else if (msg.success._tag === "ChannelRequest") {
				debugInfo.listenTotal++;
				port.postMessage(yield* Schema_exports.encodeEffect(ChannelMessage)({
					_tag: "ChannelRequestAck",
					reqId: msg.success.id
				}).pipe(Effect_exports.orDie));
			}
		}
	})), Stream_exports.filterMap(fromPredicateOption((msg) => isFailure(msg) === true ? some(msg) : msg.success._tag === "ChannelRequest" ? some(succeed$3(msg.success.payload)) : none())), listenToDebugPing(label));
	port.start();
	const closedDeferred = yield* Effect_exports.acquireRelease(make$6(), done(void_));
	const supportsTransferables = true;
	yield* Effect_exports.addFinalizer(() => Effect_exports.try({
		try: () => port.close(),
		catch: (cause) => new UnknownError$2(cause)
	}).pipe(Effect_exports.ignore));
	return {
		[WebChannelSymbol]: WebChannelSymbol,
		send,
		listen,
		closedDeferred,
		shutdown: close(scope, succeed$1("shutdown")),
		schema,
		supportsTransferables,
		debugInfo
	};
}).pipe(Effect_exports.withSpan(`WebChannel:messagePortChannelWithAck`)));
/**
* Eagerly starts listening to a channel by buffering incoming messages in a queue.
*/
var toOpenChannel = (channel, options) => Effect_exports.gen(function* () {
	const queue = yield* Effect_exports.acquireRelease(unbounded(), shutdown);
	const heartbeatChannel = channel;
	const pendingPingDeferredRef = { current: void 0 };
	yield* channel.listen.pipe(options?.heartbeat !== void 0 ? Stream_exports.filterEffect(Effect_exports.fn(function* (msg) {
		if (isSuccess(msg) === true && Schema_exports.is(WebChannelHeartbeat)(msg.success) === true) {
			if (msg.success._tag === "WebChannel.Ping") yield* heartbeatChannel.send(WebChannelPong.make({ requestId: msg.success.requestId }));
			else {
				const { deferred, requestId } = pendingPingDeferredRef.current ?? shouldNeverHappen("No pending ping");
				if (requestId !== msg.success.requestId) shouldNeverHappen("Received pong for unexpected requestId", requestId, msg.success.requestId);
				yield* succeed$2(deferred, void 0);
			}
			return false;
		}
		return true;
	})) : identity, tapArray((array) => offerAll(queue, array)), Stream_exports.runDrain, Effect_exports.forkScoped);
	if (options?.heartbeat !== void 0) {
		const { interval, timeout } = options.heartbeat;
		yield* Effect_exports.gen(function* () {
			while (true) {
				yield* Effect_exports.sleep(interval);
				const requestId = crypto.randomUUID();
				yield* heartbeatChannel.send(WebChannelPing.make({ requestId }));
				const deferred = yield* make$6();
				pendingPingDeferredRef.current = {
					deferred,
					requestId
				};
				yield* _await(deferred).pipe(Effect_exports.timeout(timeout), Effect_exports.catchTag("TimeoutError", () => channel.shutdown));
			}
		}).pipe(Effect_exports.withSpan(`WebChannel:heartbeat`), Effect_exports.forkScoped);
	}
	const listen = Stream_exports.fromQueue(queue).pipe(Stream_exports.rechunk(1));
	return {
		[WebChannelSymbol]: WebChannelSymbol,
		send: channel.send,
		listen,
		closedDeferred: channel.closedDeferred,
		shutdown: channel.shutdown,
		schema: channel.schema,
		supportsTransferables: channel.supportsTransferables,
		debugInfo: {
			innerDebugInfo: channel.debugInfo,
			listenQueueSize: queue
		}
	};
});
var of$1 = (proxy, options) => {
	if (options?.overrides === void 0) return proxy;
	return {
		...proxy,
		...options.overrides(proxy)
	};
};
var MigrationsReportEntry = Schema_exports.Struct({
	tableName: Schema_exports.String,
	hashes: Schema_exports.Struct({
		expected: Schema_exports.Finite,
		actual: Schema_exports.optional(Schema_exports.Finite)
	})
});
var MigrationsReport = Schema_exports.Struct({ migrations: Schema_exports.Array(MigrationsReportEntry) });
var env = (name) => {
	if (typeof process !== "undefined" && process.env !== void 0) return process.env[name];
	return {
		"BASE_URL": "/",
		"DEV": false,
		"MODE": "production",
		"PROD": true,
		"SSR": true,
		"TSS_DEV_SERVER": "false",
		"TSS_DEV_SSR_STYLES_BASEPATH": "/",
		"TSS_DEV_SSR_STYLES_ENABLED": "true",
		"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
		"TSS_INLINE_CSS_ENABLED": "false",
		"TSS_ROUTER_BASEPATH": "",
		"TSS_SERVER_FN_BASE": "/_serverFn/"
	}[name];
};
var TRACE_VERBOSE = env("LS_TRACE_VERBOSE") !== void 0 || env("VITE_LS_TRACE_VERBOSE") !== void 0;
/** Only set when developing LiveStore itself. */
var LS_DEV = envTruish(env("LS_DEV")) || envTruish(env("VITE_LS_DEV"));
envTruish(env("CI"));
typeof navigator !== "undefined" && navigator["product"];
var deepEqual = (a, b) => {
	if (a === b) return true;
	if (a != null && b != null && typeof a === "object" && typeof b === "object") {
		if (a.constructor !== b.constructor) return false;
		let length;
		let i;
		let keys;
		if (Array.isArray(a) === true) {
			length = a.length;
			if (length !== b.length) return false;
			for (i = length; i-- !== 0;) if (deepEqual(a[i], b[i]) === false) return false;
			return true;
		}
		if (a instanceof Map && b instanceof Map) {
			if (a.size !== b.size) return false;
			for (i of a.entries()) if (b.has(i[0]) === false) return false;
			for (i of a.entries()) if (deepEqual(i[1], b.get(i[0])) === false) return false;
			return true;
		}
		if (a instanceof Set && b instanceof Set) {
			if (a.size !== b.size) return false;
			for (i of a.entries()) if (b.has(i[0]) === false) return false;
			return true;
		}
		if (ArrayBuffer.isView(a) === true && ArrayBuffer.isView(b) === true) {
			length = a.length;
			if (length !== b.length) return false;
			for (i = length; i-- !== 0;) if (a[i] !== b[i]) return false;
			return true;
		}
		if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
		if (a.valueOf !== void 0 && a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
		if (a.toString !== void 0 && a.toString !== Object.prototype.toString) return a.toString() === b.toString();
		keys = Object.keys(a);
		length = keys.length;
		if (length !== Object.keys(b).length) return false;
		for (i = length; i-- !== 0;) if (Object.hasOwn(b, keys[i]) === false) return false;
		for (i = length; i-- !== 0;) {
			const key = keys[i];
			if (deepEqual(a[key], b[key]) === false) return false;
		}
		return true;
	}
	return a !== a && b !== b;
};
/** Indents a string each line by `n` characters (default: spaces) */
var indent = (str, n, char = " ") => str.split("\n").map((line) => char.repeat(n) + line).join("\n");
/**
* Use this to make assertion at end of if-else chain that all members of a
* union have been accounted for.
*/
var casesHandled = (unexpectedCase) => {
	debugger;
	throw new Error(`A case was not handled for value: ${truncate(objectToString(unexpectedCase), 1e3)}`);
};
var truncate = (str, length) => {
	if (str.length > length) return `${str.slice(0, length)}...`;
	else return str;
};
/**
* Memoizes a function by JSON-stringifying its arguments as the cache key.
* Suitable for functions with serializable arguments.
*
* @example
* ```ts
* const expensiveCalc = memoizeByStringifyArgs((a: number, b: number) => {
*   console.log('Computing...')
*   return a + b
* })
* expensiveCalc(1, 2) // logs 'Computing...', returns 3
* expensiveCalc(1, 2) // returns 3 (cached, no log)
* ```
*/
var memoizeByStringifyArgs = (fn) => {
	const cache = /* @__PURE__ */ new Map();
	return ((...args) => {
		const key = JSON.stringify(args);
		if (cache.has(key) === true) return cache.get(key);
		const result = fn(...args);
		cache.set(key, result);
		return result;
	});
};
/**
* Memoizes a single-argument function using reference equality for cache lookup.
* Suitable for functions where arguments are objects that should be compared by reference.
*
* @example
* ```ts
* const processUser = memoizeByRef((user: User) => expensiveTransform(user))
* processUser(userA) // Computes
* processUser(userA) // Returns cached (same reference)
* processUser(userB) // Computes (different reference)
* ```
*/
var memoizeByRef = (fn) => {
	const cache = /* @__PURE__ */ new Map();
	return ((arg) => {
		if (cache.has(arg) === true) return cache.get(arg);
		const result = fn(arg);
		cache.set(arg, result);
		return result;
	});
};
/**
* Type-level utility that removes `undefined` from all property types.
* Used for compatibility with libraries that don't type optionals as `| undefined`.
*
* Note: This is a type-level lie—the runtime value is unchanged.
*/
var omitUndefineds = (rec) => {
	return rec;
};
var GlobalBrand = nominal();
/** Effect Schema for encoding/decoding global sequence numbers. */
var Schema$3 = Schema_exports.fromBrand("GlobalEventSequenceNumber", GlobalBrand)(Schema_exports.Int);
/**
* Creates a branded global sequence number from a plain number.
*
* @example
* ```ts
* const seqNum = EventSequenceNumber.Global.make(5)
* ```
*/
var make$3 = GlobalBrand;
var ClientBrand = nominal();
/** Effect Schema for encoding/decoding client sequence numbers. */
var Schema$2 = Schema_exports.fromBrand("ClientEventSequenceNumber", ClientBrand)(Schema_exports.Int);
/**
* Creates a branded client sequence number from a plain number.
*
* @example
* ```ts
* const clientSeq = EventSequenceNumber.Client.make(1)
* ```
*/
var make$2 = ClientBrand;
/**
* Default client sequence number (0). Used for confirmed/synced events.
*
* @example
* ```ts
* const defaultSeq = EventSequenceNumber.Client.DEFAULT // 0
* ```
*/
var DEFAULT = make$2(0);
/**
* Compare two composite sequence numbers.
* Comparison hierarchy: global > client > rebaseGeneration
*/
var compare = (a, b) => {
	if (a.global !== b.global) return a.global - b.global;
	if (a.client !== b.client) return a.client - b.client;
	return a.rebaseGeneration - b.rebaseGeneration;
};
/**
* Convert a composite sequence number to a string representation.
*
* For notation documentation, see: contributor-docs/events-notation.md
*/
var toString = (seqNum) => {
	const rebaseGenerationStr = seqNum.rebaseGeneration > 0 ? `r${seqNum.rebaseGeneration}` : "";
	return seqNum.client === 0 ? `e${seqNum.global}${rebaseGenerationStr}` : `e${seqNum.global}.${seqNum.client}${rebaseGenerationStr}`;
};
/**
* Convert a string representation of a sequence number to a Composite.
* Parses strings in the format: e{global}[.{client}][r{rebaseGeneration}]
* Examples: "e0", "e0r1", "e0.1", "e0.1r1"
*
* For full notation documentation, see: contributor-docs/events-notation.md
*/
var fromString = (str) => {
	if (str.startsWith("e") === false) throw new Error("Invalid event sequence number string: must start with \"e\"");
	const remaining = str.slice(1);
	let rebaseGeneration = 0;
	let withoutRebase = remaining;
	const rebaseMatch = remaining.match(/r(\d+)$/);
	if (rebaseMatch !== null) {
		rebaseGeneration = Number.parseInt(rebaseMatch[1], 10);
		withoutRebase = remaining.slice(0, -rebaseMatch[0].length);
	}
	const parts = withoutRebase.split(".");
	if (parts[0] === "" || /^\d+$/.test(parts[0]) === false) throw new Error("Invalid event sequence number string: invalid number format");
	if (parts.length > 1 && parts[1] !== void 0 && (parts[1] === "" || /^\d+$/.test(parts[1]) === false)) throw new Error("Invalid event sequence number string: invalid number format");
	const global = Number.parseInt(parts[0], 10);
	const client = parts.length > 1 && parts[1] !== void 0 ? Number.parseInt(parts[1], 10) : 0;
	if (Number.isNaN(global) === true || Number.isNaN(client) === true || Number.isNaN(rebaseGeneration) === true) throw new TypeError("Invalid event sequence number string: invalid number format");
	return {
		global: make$3(global),
		client: make$2(client),
		rebaseGeneration
	};
};
/** Creates a Composite sequence number from a global sequence number (client=0, rebaseGeneration=0). */
var fromGlobal = (seqNum) => ({
	global: seqNum,
	client: DEFAULT,
	rebaseGeneration: 0
});
/** Returns true if two Composite sequence numbers are structurally equal. */
var isEqual = (a, b) => a.global === b.global && a.client === b.client && a.rebaseGeneration === b.rebaseGeneration;
/** Returns true if `a` is strictly greater than `b` (compares global, then client). */
var isGreaterThan = (a, b) => {
	return a.global > b.global || a.global === b.global && a.client > b.client;
};
/** Returns true if `a` is greater than or equal to `b` (compares global, then client). */
var isGreaterThanOrEqual = (a, b) => {
	return a.global > b.global || a.global === b.global && a.client >= b.client;
};
/** Returns the larger of two Composite sequence numbers. */
var max = (a, b) => {
	return a.global > b.global || a.global === b.global && a.client > b.client ? a : b;
};
/**
* Schema for the composite event sequence number.
* NOTE: Client mutation events with a non-0 client id won't be synced to the sync backend.
*/
var CompositeSchema = Schema_exports.Struct({
	global: Schema$3,
	/** Only increments for client-local events */
	client: Schema$2,
	rebaseGeneration: Schema_exports.Int
}).annotate({ title: "EventSequenceNumber.Composite" }).pipe(Schema_exports.overrideToFormatter(() => (seqNum) => toString(seqNum)));
/**
* Creates a validated Composite sequence number from input.
* If rebaseGeneration is omitted, defaults to REBASE_GENERATION_DEFAULT (0).
*/
var makeComposite = (seqNum) => {
	return Schema_exports.is(CompositeSchema)(seqNum) === true ? seqNum : Schema_exports.decodeSync(CompositeSchema)({
		...seqNum,
		rebaseGeneration: seqNum.rebaseGeneration ?? 0
	});
};
/**
* Effect Schema for the composite event sequence number (global + client + rebaseGeneration).
* Also includes a `make` helper for creating validated Composite values.
*
* @example
* ```ts
* const seqNum: EventSequenceNumber.Client.Composite = {
*   global: EventSequenceNumber.Global.make(5),
*   client: EventSequenceNumber.Client.DEFAULT,
*   rebaseGeneration: 0
* }
*
* const validated = EventSequenceNumber.Client.Composite.make({ global: 5, client: 0, rebaseGeneration: 0 })
* ```
*/
var Composite = Object.assign(CompositeSchema, { make: makeComposite });
/** The root sequence number (global=0, client=0, rebaseGeneration=0). Parent of the first event. */
var ROOT = {
	global: make$3(0),
	client: DEFAULT,
	rebaseGeneration: 0
};
/**
* Computes the next sequence number and its parent based on the current position.
*
* For client-only events (isClientOnly=true): increments the client component, keeps global.
* For global events (isClientOnly=false): increments global, resets client to 0.
*/
var nextPair = ({ seqNum, isClientOnly, rebaseGeneration }) => {
	if (isClientOnly === true) return {
		seqNum: {
			global: seqNum.global,
			client: make$2(seqNum.client + 1),
			rebaseGeneration: rebaseGeneration ?? seqNum.rebaseGeneration
		},
		parentSeqNum: seqNum
	};
	return {
		seqNum: {
			global: make$3(seqNum.global + 1),
			client: DEFAULT,
			rebaseGeneration: rebaseGeneration ?? seqNum.rebaseGeneration
		},
		parentSeqNum: {
			global: seqNum.global,
			client: DEFAULT,
			rebaseGeneration: seqNum.rebaseGeneration
		}
	};
};
Schema_exports.Struct({
	name: Schema_exports.String,
	args: Schema_exports.Any,
	seqNum: Composite,
	parentSeqNum: Composite,
	clientId: Schema_exports.String,
	sessionId: Schema_exports.String
}).annotate({ title: "LiveStoreEvent.Client.Decoded" });
/**
* Effect Schema for client events with encoded args.
* @example
* ```ts
* // Confirmed event (client=0)
* const event: LiveStoreEvent.Client.Encoded = {
*   name: 'todoCreated-v1',
*   args: { id: 'abc', text: 'Buy milk' },
*   seqNum: { global: 5, client: 0, rebaseGeneration: 0 },
*   parentSeqNum: { global: 4, client: 0, rebaseGeneration: 0 },
*   clientId: 'client-xyz',
*   sessionId: 'session-123'
* }
*
* // Pending local event (client=1, not yet synced)
* const pending: LiveStoreEvent.Client.Encoded = {
*   ...event,
*   seqNum: { global: 5, client: 1, rebaseGeneration: 0 },  // e5.1
* }
* ```
*/
var Encoded$2 = Schema_exports.Struct({
	name: Schema_exports.String,
	args: Schema_exports.Any,
	seqNum: Composite,
	parentSeqNum: Composite,
	clientId: Schema_exports.String,
	sessionId: Schema_exports.String
}).annotate({ title: "LiveStoreEvent.Client.Encoded" });
/**
* Internal event representation with metadata for sync processing.
* Includes changeset data and materializer hashes for conflict detection and rebasing.
*
* Note: This class is exported for internal use. The preferred access is via `LiveStoreEvent.Client.EncodedWithMeta`.
*/
var EncodedWithMeta = class EncodedWithMeta extends Schema_exports.Class("LiveStoreEvent.Client.EncodedWithMeta")({
	name: Schema_exports.String,
	args: Schema_exports.Any,
	seqNum: Composite,
	parentSeqNum: Composite,
	clientId: Schema_exports.String,
	sessionId: Schema_exports.String,
	meta: Schema_exports.Struct({
		sessionChangeset: Schema_exports.Union([
			Schema_exports.TaggedStruct("sessionChangeset", {
				data: Schema_exports.Uint8Array,
				debug: Schema_exports.Any.pipe(Schema_exports.optional)
			}),
			Schema_exports.TaggedStruct("no-op", {}),
			Schema_exports.TaggedStruct("unset", {})
		]),
		syncMetadata: Schema_exports.Option(Schema_exports.Json),
		/** Used to detect if the materializer is side effecting (during dev) */
		materializerHashLeader: Schema_exports.Option(Schema_exports.Finite),
		materializerHashSession: Schema_exports.Option(Schema_exports.Finite)
	}).mapFields(map$3(Schema_exports.mutableKey)).pipe(Schema_exports.withDecodingDefaultType(Effect_exports.succeed({
		sessionChangeset: { _tag: "unset" },
		syncMetadata: none(),
		materializerHashLeader: none(),
		materializerHashSession: none()
	})), Schema_exports.withConstructorDefault(Effect_exports.succeed({
		sessionChangeset: { _tag: "unset" },
		syncMetadata: none(),
		materializerHashLeader: none(),
		materializerHashSession: none()
	})))
}) {
	toJSON = () => {
		return {
			seqNum: `${toString(this.seqNum)} → ${toString(this.parentSeqNum)} (${this.clientId}, ${this.sessionId})`,
			name: this.name,
			args: this.args
		};
	};
	/**
	* Example: (global event)
	* For event e2 → e1 which should be rebased on event e3 → e2
	* the resulting event num will be e4 → e3
	*
	* Example: (client event)
	* For event e2.1 → e2 which should be rebased on event e3 → e2
	* the resulting event num will be e3.1 → e3
	*
	* Syntax: e2.2 → e2.1
	*          ^ ^    ^ ^
	*          | |    | +- client parent number
	*          | |    +--- global parent number
	*          | +-- client number
	*          +---- global number
	* Client num is omitted for global events
	*/
	rebase = ({ parentSeqNum, isClientOnly, rebaseGeneration }) => new EncodedWithMeta({
		...this,
		...nextPair({
			seqNum: parentSeqNum,
			isClientOnly,
			rebaseGeneration
		})
	});
	static fromGlobal = (event, meta) => new EncodedWithMeta({
		...event,
		seqNum: {
			global: event.seqNum,
			client: DEFAULT,
			rebaseGeneration: 0
		},
		parentSeqNum: {
			global: event.parentSeqNum,
			client: DEFAULT,
			rebaseGeneration: 0
		},
		meta: {
			sessionChangeset: { _tag: "unset" },
			syncMetadata: meta.syncMetadata,
			materializerHashLeader: meta.materializerHashLeader,
			materializerHashSession: meta.materializerHashSession
		}
	});
	toGlobal = () => ({
		name: this.name,
		args: this.args,
		seqNum: this.seqNum.global,
		parentSeqNum: this.parentSeqNum.global,
		clientId: this.clientId,
		sessionId: this.sessionId
	});
};
/**
* Structural equality check for client events. Compares seqNum (global + client),
* name, clientId, sessionId, and args. The `meta` field is ignored.
*
* Args are compared in their JSON-canonical form: locally-encoded events with
* `Schema.UndefinedOr` (or loose `Schema.optional`) fields produce
* `{ ..., flag: undefined }`, but JSON wire transport drops the key. Without
* canonicalizing, the local pending event compares unequal to its
* wire-roundtripped counterpart and the sync merge falsely takes the rebase
* path, surfacing as `MaterializerHashMismatchError` for state-dependent
* materializers.
*/
var isEqualEncoded = (a, b) => a.seqNum.global === b.seqNum.global && a.seqNum.client === b.seqNum.client && a.name === b.name && a.clientId === b.clientId && a.sessionId === b.sessionId && deepEqual(canonicalizeArgs(a.args), canonicalizeArgs(b.args));
var canonicalizeArgs = (args) => args === void 0 ? args : JSON.parse(JSON.stringify(args));
/**
* Creates an Effect Schema union for all event types in a schema (with composite sequence numbers).
* @example
* ```ts
* const eventSchema = LiveStoreEvent.Client.makeSchema(schema)
* const event = Schema.decodeUnknownSync(eventSchema)(rawEvent)
* ```
*/
var makeSchema$1 = (schema) => Schema_exports.Union([...schema.eventsDefsMap.values()].map((def) => Schema_exports.Struct({
	name: Schema_exports.Literal(def.name),
	args: def.schema,
	seqNum: Composite,
	parentSeqNum: Composite,
	clientId: Schema_exports.String,
	sessionId: Schema_exports.String
}))).annotate({ title: "LiveStoreEvent.Client" });
/**
* Effect Schema for global events with integer sequence numbers.
* @example
* ```ts
* const event: LiveStoreEvent.Global.Encoded = {
*   name: 'todoCreated-v1',
*   args: { id: 'abc', text: 'Buy milk' },
*   seqNum: 5,       // This event's position in the global log
*   parentSeqNum: 4, // Points to the previous event
*   clientId: 'client-xyz',
*   sessionId: 'session-123'
* }
* ```
*/
var Encoded$1 = Schema_exports.Struct({
	name: Schema_exports.String,
	args: Schema_exports.Any,
	seqNum: Schema$3,
	parentSeqNum: Schema$3,
	clientId: Schema_exports.String,
	sessionId: Schema_exports.String
}).annotate({ title: "LiveStoreEvent.Global.Encoded" });
/** Converts a Global event to Client format by expanding integer seqNums to composite form. */
var toClientEncoded = (event) => ({
	...event,
	seqNum: fromGlobal(event.seqNum),
	parentSeqNum: fromGlobal(event.parentSeqNum)
});
/**
* Effect Schema for validating/decoding input events with encoded args.
* @example
* ```ts
* import { Schema } from '@effect/schema'
* const decoded = Schema.decodeUnknownSync(LiveStoreEvent.Input.Encoded)(rawEvent)
* ```
*/
var Encoded = Schema_exports.Struct({
	name: Schema_exports.String,
	args: Schema_exports.Any
}).annotate({ title: "LiveStoreEvent.Input.Encoded" });
var UnknownError$1 = class UnknownError$1 extends Schema_exports.TaggedError("~@livestore/common/UnknownError")("UnknownError", {
	cause: Schema_exports.Defect(),
	note: Schema_exports.optional(Schema_exports.String),
	payload: Schema_exports.optional(Schema_exports.Any)
}) {
	static mapToUnknownError = (effect) => effect.pipe(Effect_exports.mapError((cause) => Schema_exports.is(UnknownError$1)(cause) === true ? cause : new UnknownError$1({ cause })), Effect_exports.catchDefect((cause) => new UnknownError$1({ cause })));
	static mapToUnknownErrorLayer = (layer) => layer.pipe(catchCause((cause) => {
		const error = findErrorOption(cause);
		return isSome(error) === true && Schema_exports.is(UnknownError$1)(error.value) === true ? effectContext(Effect_exports.fail(error.value)) : effectContext(Effect_exports.fail(new UnknownError$1({ cause })));
	}));
	static mapToUnknownErrorStream = (stream) => stream.pipe(Stream_exports.mapError((cause) => Schema_exports.is(UnknownError$1)(cause) === true ? cause : new UnknownError$1({ cause })));
};
var materializerHashMismatchNote = "Please make sure your event materializer is a pure function without side effects.";
var MaterializerHashMismatchError = class extends Schema_exports.TaggedError("~@livestore/common/MaterializerHashMismatchError")("MaterializerHashMismatchError", {
	eventName: Schema_exports.String,
	note: Schema_exports.String.pipe(Schema_exports.withDecodingDefaultType(Effect_exports.succeed(materializerHashMismatchNote)), Schema_exports.withConstructorDefault(Effect_exports.succeed(materializerHashMismatchNote)))
}) {};
var IntentionalShutdownCause = class extends Schema_exports.TaggedError("~@livestore/common/IntentionalShutdownCause")("IntentionalShutdownCause", { reason: Schema_exports.Literals([
	"devtools-reset",
	"devtools-import",
	"adapter-reset",
	"manual",
	"backend-id-mismatch"
]) }) {};
Schema_exports.TaggedError("~@livestore/common/StoreInterrupted")("StoreInterrupted", { reason: Schema_exports.String });
var SqliteError = class extends Schema_exports.TaggedError("~@livestore/common/SqliteError")("SqliteError", {
	query: Schema_exports.optional(Schema_exports.Struct({
		sql: Schema_exports.String,
		bindValues: Schema_exports.Union([Schema_exports.Record(Schema_exports.String, Schema_exports.Any), Schema_exports.Array(Schema_exports.Any)])
	})),
	/** The SQLite result code */
	code: Schema_exports.optional(Schema_exports.Union([Schema_exports.Finite, Schema_exports.String])),
	/** The original SQLite3 error */
	cause: Schema_exports.Defect(),
	note: Schema_exports.optional(Schema_exports.String)
}) {};
var UnknownEventError = class extends Schema_exports.TaggedError("~@livestore/common/UnknownEventError")("UnknownEventError", {
	event: Encoded$2.mapFields(pick([
		"name",
		"args",
		"seqNum",
		"clientId",
		"sessionId"
	])),
	reason: Schema_exports.Literals(["event-definition-missing", "materializer-missing"]),
	operation: Schema_exports.String,
	note: Schema_exports.optional(Schema_exports.String)
}) {};
var MaterializeError = class extends Schema_exports.TaggedError("~@livestore/common/MaterializeError")("MaterializeError", {
	cause: Schema_exports.Union([
		MaterializerHashMismatchError,
		SqliteError,
		UnknownEventError
	]),
	note: Schema_exports.optional(Schema_exports.String)
}) {};
var BootStateProgress = Schema_exports.Struct({
	done: Schema_exports.Finite,
	total: Schema_exports.Finite
});
/**
* Describes known reasons why LiveStore boot may encounter storage issues.
*
* @remarks
* - `private-browsing`: OPFS unavailable due to private/incognito browsing mode (Safari, Firefox)
* - `storage-unavailable`: OPFS access denied for other reasons (permissions, quota)
* - `unknown`: Unexpected error during storage initialization
*/
var BootWarningReason = Schema_exports.Literals([
	"private-browsing",
	"storage-unavailable",
	"unknown"
]);
Schema_exports.Literals(["persisted", "in-memory"]);
var BootStatus = Schema_exports.Union([
	Schema_exports.Struct({ stage: Schema_exports.Literal("loading") }),
	Schema_exports.Struct({
		stage: Schema_exports.Literal("migrating"),
		progress: BootStateProgress
	}),
	Schema_exports.Struct({
		stage: Schema_exports.Literal("rehydrating"),
		progress: BootStateProgress
	}),
	Schema_exports.Struct({
		stage: Schema_exports.Literal("syncing"),
		progress: BootStateProgress
	}),
	Schema_exports.Struct({ stage: Schema_exports.Literal("done") }),
	Schema_exports.Struct({
		stage: Schema_exports.Literal("warning"),
		reason: BootWarningReason,
		message: Schema_exports.String
	})
]).annotate({ title: "BootStatus" });
var BoundArray = class BoundArray {
	#array = [];
	sizeLimit;
	constructor(sizeLimit) {
		this.sizeLimit = sizeLimit;
	}
	static make = (sizeLimit, initial = []) => {
		const b = new BoundArray(sizeLimit);
		for (const v of initial) b.push(v);
		return b;
	};
	onEvict;
	push = (v) => {
		this.#array.push(v);
		if (this.#array.length > this.sizeLimit) {
			const first = this.#array.shift();
			if (first !== void 0 && this.onEvict !== void 0) this.onEvict(first);
		}
	};
	get = (index) => {
		return this.#array[index];
	};
	delete = (index) => {
		this.#array.splice(index, 1);
	};
	get length() {
		return this.#array.length;
	}
	[Symbol.iterator] = () => {
		return this.#array[Symbol.iterator]();
	};
	map = (fn) => {
		return this.#array.map(fn);
	};
	clear = () => {
		this.#array = [];
	};
	sort = (fn) => {
		return this.#array.toSorted(fn);
	};
};
/**
* Numeric schema for the SQLite `REAL` domain. Unlike `Schema.Finite` it accepts
* `Infinity`/`NaN`, because SQLite `REAL` columns can legitimately store them and
* bind values / DEFAULT codecs must round-trip those through the devtools/debug
* protocol. This is the single carve-out for the SQLite REAL numeric domain — use it
* instead of a bare `Schema.Number` so the `schemaNumber` exception lives in one place.
*/
var SqliteReal = Schema_exports.Number;
var SqlValueSchema = Schema_exports.Union([
	Schema_exports.String,
	SqliteReal,
	Schema_exports.Uint8Array,
	Schema_exports.Null
]);
var PreparedBindValues = Schema_exports.Union([Schema_exports.Array(SqlValueSchema), Schema_exports.Record(Schema_exports.String, SqlValueSchema)]).pipe(Schema_exports.brand("PreparedBindValues"));
/**
* This is a tag function for tagged literals.
* it lets us get syntax highlighting on SQL queries in VSCode, but
* doesn't do anything at runtime.
* Code copied from: https://esdiscuss.org/topic/string-identity-template-tag
*/
var sql = (template, ...args) => {
	let str = "";
	for (const [i, arg] of args.entries()) str += template[i] + String(arg);
	return str + template[template.length - 1];
};
/**
* Prepare bind values to send to SQLite
* Add $ to the beginning of keys; which we use as our interpolation syntax
* We also strip out any params that aren't used in the statement,
* because rusqlite doesn't allow unused named params
* TODO: Search for unused params via proper parsing, not string search
* TODO: Also make sure that the SQLite binding limit of 1000 is respected
*/
var prepareBindValues = (values, statement) => {
	if (Array.isArray(values) === true) return values;
	const result = {};
	for (const [key, value] of Object.entries(values)) if (statement.includes(key) === true) result[`$${key}`] = value;
	return result;
};
var SlowQueryInfo = Schema_exports.Struct({
	queryStr: Schema_exports.String,
	bindValues: Schema_exports.UndefinedOr(PreparedBindValues),
	durationMs: Schema_exports.Finite,
	rowsCount: Schema_exports.UndefinedOr(Schema_exports.Finite),
	queriedTables: Schema_exports.ReadonlySet(Schema_exports.String),
	startTimePerfNow: Schema_exports.Finite
});
var isBoundArrayLike = (value) => value instanceof BoundArray;
var BoundArraySchemaFromSelf = (item) => Schema_exports.declare(isBoundArrayLike, {
	identifier: "BoundArray",
	expected: "BoundArray",
	description: "Bounded array",
	toFormatter: () => (_) => `BoundArray(${_.length})`,
	toArbitrary: () => (fc) => {
		const itemArbitrary = Schema_exports.toArbitrary(item)(fc);
		return fc.integer({
			min: 0,
			max: 100
		}).chain((sizeLimit) => fc.array(itemArbitrary, { maxLength: sizeLimit }).map((items) => BoundArray.make(sizeLimit, items)));
	},
	toEquivalence: () => {
		const elementEquivalence = Schema_exports.toEquivalence(item);
		return (a, b) => {
			if (a === b) return true;
			if (isBoundArrayLike(a) === false || isBoundArrayLike(b) === false) return false;
			if (a.sizeLimit !== b.sizeLimit || a.length !== b.length) return false;
			const itemsA = [...a];
			const itemsB = [...b];
			for (let i = 0; i < itemsA.length; i++) if (elementEquivalence(itemsA[i], itemsB[i]) === false) return false;
			return true;
		};
	}
});
var BoundArraySchema = (elSchema) => Schema_exports.Struct({
	size: Schema_exports.Finite,
	items: Schema_exports.Array(elSchema)
}).pipe(Schema_exports.decodeTo(BoundArraySchemaFromSelf(Schema_exports.toType(elSchema)), {
	decode: transform((_) => BoundArray.make(_.size, _.items)),
	encode: transform((_) => ({
		size: _.sizeLimit,
		items: [..._]
	}))
}));
var DebugInfo = Schema_exports.Struct({
	slowQueries: BoundArraySchema(SlowQueryInfo),
	queryFrameDuration: Schema_exports.Finite,
	queryFrameCount: Schema_exports.Finite,
	events: BoundArraySchema(Schema_exports.Tuple([Schema_exports.String, Schema_exports.Any]))
});
DebugInfo.mapFields(map$3(Schema_exports.mutableKey));
var urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
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
var RequestSessions = Schema_exports.TaggedStruct("RequestSessions", {});
var SessionInfo = Schema_exports.TaggedStruct("SessionInfo", {
	storeId: Schema_exports.String,
	clientId: Schema_exports.String,
	sessionId: Schema_exports.String,
	schemaAlias: Schema_exports.String,
	isLeader: Schema_exports.Boolean,
	/**
	* Browser origin that produced this SessionInfo (for example, 'http://localhost:5173').
	* Set by browser-based publishers so DevTools can defensively filter by origin.
	* Currently only needed by the browser extension; non‑browser publishers typically set `undefined`.
	*/
	origin: Schema_exports.UndefinedOr(Schema_exports.String)
});
var Message = Schema_exports.Union([RequestSessions, SessionInfo]);
/** Usually called in client session */
var provideSessionInfo = ({ webChannel, sessionInfo }) => Effect_exports.gen(function* () {
	yield* webChannel.send(sessionInfo);
	yield* webChannel.listen.pipe(Stream_exports.mapEffect(Effect_exports.fromResult), Stream_exports.filter(Schema_exports.is(RequestSessions)), Stream_exports.tap(() => webChannel.send(sessionInfo)), Stream_exports.runDrain);
});
/**
* Deprecation Annotations for Events
*
* This module provides utilities for marking event fields and entire events as deprecated.
* When a deprecated field is used or a deprecated event is committed, a warning is logged.
*
* @example
* ```ts
* import { Events } from '@livestore/livestore'
* import { Schema } from 'effect'
* import { deprecated } from '@livestore/common/schema'
*
* // Field-level deprecation
* const todoUpdated = Events.synced({
*   name: 'v1.TodoUpdated',
*   schema: Schema.Struct({
*     id: Schema.String,
*     title: Schema.optional(Schema.String).pipe(deprecated("Use 'text' instead")),
*     text: Schema.optional(Schema.String),
*   }),
* })
*
* // Event-level deprecation
* const todoRenamed = Events.synced({
*   name: 'v1.TodoRenamed',
*   schema: Schema.Struct({ id: Schema.String, name: Schema.String }),
*   deprecated: "Use 'v1.TodoUpdated' instead",
* })
* ```
* @module
*/
/** Annotation key used to mark schemas as deprecated. */
var DeprecatedId = "livestore/schema/annotations/deprecated";
/**
* Finds deprecated fields with values in the given event arguments.
* This walks through a Struct schema and checks each property for deprecation.
*
* @param schema - The event schema (expected to be a Struct)
* @param args - The event arguments
* @returns Array of objects containing field name and deprecation reason
*/
var findDeprecatedFieldsWithValues = (schema, args) => {
	const result = [];
	const ast = toType$1(schema.ast);
	if (isObjects(ast) === true) for (const prop of ast.propertySignatures) {
		const fieldName = String(prop.name);
		if (args[fieldName] !== void 0) {
			const deprecationReason = prop.type.context?.annotations?.[DeprecatedId];
			const typeDeprecation = resolveAt(DeprecatedId)(prop.type);
			const reason = deprecationReason ?? typeDeprecation;
			if (reason !== void 0) result.push({
				field: fieldName,
				reason
			});
		}
	}
	return result;
};
/** Set of event names that have already logged deprecation warnings. */
var warnedDeprecatedEvents = /* @__PURE__ */ new Set();
/** Map of event+field combinations that have already logged deprecation warnings. */
var warnedDeprecatedFields = /* @__PURE__ */ new Set();
/**
* Logs deprecation warnings for an event using Effect.logWarning.
* Checks both event-level and field-level deprecation, with deduplication.
*
* @param eventDef - The event definition to check
* @param args - The event arguments
* @returns An Effect that logs warnings for any deprecations found
*/
var logDeprecationWarnings = (eventDef, args) => Effect_exports.gen(function* () {
	const eventName = eventDef.name;
	const eventDeprecation = eventDef.options.deprecated;
	if (eventDeprecation !== void 0 && warnedDeprecatedEvents.has(eventName) === false) {
		warnedDeprecatedEvents.add(eventName);
		yield* Effect_exports.logWarning("@livestore/schema:deprecated-event", {
			event: eventName,
			reason: eventDeprecation
		});
	}
	const deprecatedFields = findDeprecatedFieldsWithValues(eventDef.schema, args);
	for (const { field, reason } of deprecatedFields) {
		const key = `${eventName}:${field}`;
		if (warnedDeprecatedFields.has(key) === false) {
			warnedDeprecatedFields.add(key);
			yield* Effect_exports.logWarning("@livestore/schema:deprecated-field", {
				event: eventName,
				field,
				reason
			});
		}
	}
});
/**
* Can be used in queries to refer to the current session id.
* Will be replaced with the actual session id at runtime.
*
* In client document table:
* ```ts
* const uiState = State.SQLite.clientDocument({
*   name: 'ui_state',
*   schema: Schema.Struct({
*     theme: Schema.Literals(['dark', 'light', 'system']),
*     user: Schema.String,
*     showToolbar: Schema.Boolean,
*   }),
*   default: { value: defaultFrontendState, id: SessionIdSymbol },
* })
* ```
*
* Or in a client document query:
* ```ts
* const query$ = queryDb(tables.uiState.get(SessionIdSymbol))
* ```
*/
var SessionIdSymbol = Symbol.for("@livestore/session-id");
var hashCode = (str) => {
	let hash = 0;
	let i;
	let chr;
	if (str.length === 0) return hash;
	for (i = 0; i < str.length; i++) {
		chr = str.charCodeAt(i);
		hash = (hash << 5) - hash + chr;
		hash = Math.trunc(hash);
	}
	return hash;
};
/**
* Helper to detect if a column is a JSON column (encoded as a JSON string)
*/
var isJsonColumn = (column) => {
	if (column.type._tag !== "text") return false;
	return hasJsonStringEncoding$1(column.schema.ast);
};
/**
* `SchemaTransformation.fromJsonString` is a factory since Effect rc.109, so encoding links can no
* longer be matched by identity. `Schema.fromJsonString` annotates its encoded side as
* `application/json`, which identifies the link regardless of the reviver/replacer/space options.
*/
var hasJsonStringEncoding$1 = (ast) => {
	if (ast.encoding?.some((link) => link.to.annotations?.contentMediaType === "application/json") === true) return true;
	return isUnion(ast) === true && ast.types.some(hasJsonStringEncoding$1);
};
/**
* NOTE we're now including JSON schema information for JSON columns
* to detect client document schema changes
*/
var hash = (obj) => hashCode(JSON.stringify(trimInfoForHasing(obj)));
var trimInfoForHasing = (obj) => {
	switch (obj._tag) {
		case "table": return {
			_tag: "table",
			name: obj.name,
			columns: obj.columns.map((column) => trimInfoForHasing(column)),
			indexes: obj.indexes.map((index) => trimInfoForHasing(index))
		};
		case "column": {
			const baseInfo = {
				_tag: "column",
				name: obj.name,
				type: obj.type._tag,
				primaryKey: obj.primaryKey,
				nullable: obj.nullable,
				autoIncrement: obj.autoIncrement,
				default: obj.default
			};
			if (isJsonColumn(obj) === true && obj.schema !== void 0) baseInfo.jsonSchemaHash = hash$1(obj.schema);
			return baseInfo;
		}
		case "index": return {
			_tag: "index",
			columns: obj.columns,
			name: obj.name,
			unique: obj.unique,
			primaryKey: obj.primaryKey
		};
		case "foreignKey": return {
			_tag: "foreignKey",
			references: obj.references,
			key: obj.key,
			columns: obj.columns
		};
		case "dbSchema": return {
			_tag: "dbSchema",
			tables: obj.tables.map(trimInfoForHasing)
		};
		default: throw new Error(`Unreachable: ${String(obj)}`);
	}
};
var isSqlDefaultValue = (value) => {
	return typeof value === "object" && value !== null && "sql" in value && typeof value.sql === "string";
};
var isDefaultThunk = (value) => typeof value === "function";
var resolveColumnDefault = (value) => isDefaultThunk(value) === true ? value() : value;
var isColumnDefinition$1 = (value) => {
	return typeof value === "object" && value !== null && "columnType" in value && [
		"text",
		"integer",
		"real",
		"blob"
	].includes(value.columnType);
};
var NoDefault = Symbol.for("NoDefault");
var makeColDef = (columnType) => (def) => {
	const nullable = def?.nullable ?? false;
	const schemaWithoutNull = def?.schema ?? defaultSchemaForColumnType(columnType);
	return {
		columnType,
		schema: nullable === true ? Schema_exports.NullOr(schemaWithoutNull) : schemaWithoutNull,
		default: def?.default === void 0 || def.default === NoDefault ? none() : some(def.default),
		nullable,
		primaryKey: def?.primaryKey ?? false,
		autoIncrement: def?.autoIncrement ?? false
	};
};
var column$1 = (columnType) => makeColDef(columnType);
var text$1 = makeColDef("text");
var integer$1 = makeColDef("integer");
var real$1 = makeColDef("real");
var blob$1 = makeColDef("blob");
var makeSpecializedColDef = (columnType, opts) => (def) => {
	const nullable = def?.nullable ?? false;
	const schemaWithoutNull = opts._tag === "baseSchemaFn" ? opts.baseSchemaFn(def?.schema) : opts.baseSchema;
	return {
		columnType,
		schema: nullable === true ? Schema_exports.NullOr(schemaWithoutNull) : schemaWithoutNull,
		default: def?.default === void 0 || def.default === NoDefault ? none() : some(def.default),
		nullable,
		primaryKey: def?.primaryKey ?? false,
		autoIncrement: def?.autoIncrement ?? false
	};
};
var json$1 = makeSpecializedColDef("text", {
	_tag: "baseSchemaFn",
	baseSchemaFn: (customSchema) => Schema_exports.fromJsonString(customSchema ?? Schema_exports.Any)
});
var datetime$1 = makeSpecializedColDef("text", {
	_tag: "baseSchema",
	baseSchema: Schema_exports.DateFromString
});
var datetimeInteger = makeSpecializedColDef("integer", {
	_tag: "baseSchema",
	baseSchema: Schema_exports.DateFromMillis
});
var boolean$1 = makeSpecializedColDef("integer", {
	_tag: "baseSchema",
	baseSchema: Schema_exports.BooleanFromBit
});
var defaultSchemaForColumnType = (columnType) => {
	switch (columnType) {
		case "text": return Schema_exports.String;
		case "integer": return Schema_exports.Finite;
		case "real": return SqliteReal;
		case "blob": return Schema_exports.Uint8Array;
		default: return casesHandled(columnType);
	}
};
var dsl_exports = /* @__PURE__ */ __exportAll({
	NoDefault: () => NoDefault,
	blob: () => blob$1,
	boolean: () => boolean$1,
	column: () => column$1,
	datetime: () => datetime$1,
	datetimeInteger: () => datetimeInteger,
	defaultSchemaForColumnType: () => defaultSchemaForColumnType,
	insertStructSchemaForTable: () => insertStructSchemaForTable,
	integer: () => integer$1,
	isColumnDefinition: () => isColumnDefinition$1,
	isDefaultThunk: () => isDefaultThunk,
	isSqlDefaultValue: () => isSqlDefaultValue,
	json: () => json$1,
	makeDbSchema: () => makeDbSchema,
	real: () => real$1,
	resolveColumnDefault: () => resolveColumnDefault,
	structSchemaForTable: () => structSchemaForTable,
	table: () => table$1,
	text: () => text$1
});
var makeDbSchema = (schema) => {
	return Array.isArray(schema) === true ? Object.fromEntries(schema.map((_) => [_.name, _])) : schema;
};
var table$1 = (name, columns, indexes) => {
	const ast = {
		_tag: "table",
		name,
		columns: columsToAst(columns),
		indexes: indexesToAst(indexes ?? [])
	};
	return {
		name,
		columns,
		...omitUndefineds({ indexes }),
		ast
	};
};
var getColumnSchema = lambda((column) => column.schema);
var structFieldsForColumns = (columns) => map$3(columns, getColumnSchema);
var structSchemaForTable = (tableDef) => Schema_exports.Struct(structFieldsForColumns(tableDef.columns)).annotate({ title: tableDef.name });
var insertStructSchemaForTable = (tableDef) => Schema_exports.Struct(Object.fromEntries(tableDef.ast.columns.map((column) => [column.name, column.nullable === true || column.default._tag === "Some" ? Schema_exports.optional(column.schema) : column.schema]))).annotate({ title: tableDef.name });
var columsToAst = (columns) => {
	return Object.entries(columns).map(([name, column]) => {
		return {
			_tag: "column",
			name,
			schema: column.schema,
			default: column.default,
			nullable: column.nullable ?? false,
			primaryKey: column.primaryKey ?? false,
			autoIncrement: column.autoIncrement ?? false,
			type: { _tag: column.columnType }
		};
	});
};
var indexesToAst = (indexes) => {
	return indexes.map((_) => ({
		_tag: "index",
		columns: _.columns,
		name: _.name,
		unique: _.isUnique ?? false
	}));
};
var QueryBuilderAstSymbol = Symbol.for("QueryBuilderAst");
var QueryBuilderTypeId = Symbol.for("QueryBuilder");
var isQueryBuilder = (value) => hasProperty(value, QueryBuilderTypeId);
/**
* Extracts array element schema from a JSON array AST with a JSON string encoding.
* Returns the element schema, or undefined if the AST is not a JSON array.
*/
var extractJsonArrayElementSchema = (ast) => {
	if (hasJsonStringEncoding(ast) === false) return void 0;
	const typeAst = toType$1(ast);
	if (isArrays(typeAst) === false) return void 0;
	const restElement = typeAst.rest[0];
	if (restElement === void 0) return void 0;
	return Schema_exports.make(restElement);
};
/**
* For JSON array columns, extracts the element schema from Schema.fromJsonString(Schema.Array(ElementSchema)).
* Also handles nullable JSON arrays (Schema.NullOr(Schema.fromJsonString(Schema.Array(...)))).
* Returns the element schema, or undefined if the column is not a JSON array.
*/
var getJsonArrayElementSchema = (colSchema) => {
	const ast = colSchema.ast;
	const direct = extractJsonArrayElementSchema(ast);
	if (direct !== void 0) return direct;
	if (isUnion(ast) === true) for (const member of ast.types) {
		const result = extractJsonArrayElementSchema(member);
		if (result !== void 0) return result;
	}
};
/**
* `SchemaTransformation.fromJsonString` is a factory since Effect rc.109, so encoding links can no
* longer be matched by identity. `Schema.fromJsonString` annotates its encoded side as
* `application/json`, which identifies the link regardless of the reviver/replacer/space options.
*/
var hasJsonStringEncoding = (ast) => ast.encoding?.some((link) => link.to.annotations?.contentMediaType === "application/json") === true;
/**
* Encodes a JSON array element to the representation returned by SQLite's json_each().
* Objects/arrays are stringified so they match json_each's TEXT representation.
*/
var encodeJsonArrayElementValue = (elementSchema, value) => {
	const encoded = Schema_exports.encodeSync(elementSchema)(value);
	if (encoded === null) return null;
	if (typeof encoded === "object") return JSON.stringify(encoded);
	if (typeof encoded === "boolean") return encoded === true ? 1 : 0;
	return encoded;
};
var quoteIdentifier = (identifier) => `"${identifier.replace(/"/g, "\"\"")}"`;
var formatWhereClause = (whereConditions, tableDef, bindValues) => {
	if (whereConditions.length === 0) return "";
	return `WHERE ${whereConditions.map(({ col, op, value }) => {
		const quotedCol = quoteIdentifier(col);
		if (value === null) {
			if (op !== "=" && op !== "!=") throw new Error(`Unsupported operator for NULL value: ${op}`);
			return `${quotedCol} ${op === "=" ? "IS" : "IS NOT"} NULL`;
		}
		const colDef = tableDef.sqliteDef.columns[col];
		if (colDef === void 0) throw new Error(`Column ${col} not found`);
		if (op === "JSON_CONTAINS" || op === "JSON_NOT_CONTAINS") {
			const elementSchema = getJsonArrayElementSchema(colDef.schema);
			if (elementSchema === void 0) throw new Error(`${op} operator can only be used on JSON array columns, but column "${col}" is not a JSON array`);
			const existsOp = op === "JSON_CONTAINS" ? "EXISTS" : "NOT EXISTS";
			const encodedValue = encodeJsonArrayElementValue(elementSchema, value);
			bindValues.push(encodedValue);
			return `${existsOp} (SELECT 1 FROM json_each(${quotedCol}) WHERE value = ?)`;
		}
		if ((op === "IN" || op === "NOT IN") === true) {
			if (Array.isArray(value) === false) return shouldNeverHappen(`Expected array value for ${op} operator but got`, value);
			if (value.length === 0) return op === "IN" ? "0=1" : "1=1";
			const encodedValues = value.map((v) => Schema_exports.encodeSync(colDef.schema)(v));
			bindValues.push(...encodedValues);
			return `${quotedCol} ${op} (${encodedValues.map(() => "?").join(", ")})`;
		} else {
			const encodedValue = Schema_exports.encodeSync(colDef.schema)(value);
			bindValues.push(encodedValue);
			return `${quotedCol} ${op} ?`;
		}
	}).join(" AND ")}`;
};
var formatReturningClause = (returning) => {
	if (returning == null || returning.length === 0) return "";
	return ` RETURNING ${returning.map(quoteIdentifier).join(", ")}`;
};
var astToSql = (ast) => {
	const bindValues = [];
	const usedTables = /* @__PURE__ */ new Set([ast.tableDef.sqliteDef.name]);
	if (ast._tag === "InsertQuery") {
		const columns = Object.keys(ast.values);
		const quotedColumns = columns.map(quoteIdentifier);
		const placeholders = columns.map(() => "?").join(", ");
		const encodedValues = Schema_exports.encodeSync(ast.tableDef.insertSchema)(ast.values);
		columns.forEach((col) => {
			bindValues.push(encodedValues[col]);
		});
		let insertVerb = "INSERT";
		let conflictClause = "";
		if (ast.onConflict !== void 0) {
			if (ast.onConflict.action._tag === "replace") insertVerb = "INSERT OR REPLACE";
			else {
				conflictClause = ` ON CONFLICT (${ast.onConflict.targets.map(quoteIdentifier).join(", ")}) `;
				if (ast.onConflict.action._tag === "ignore") conflictClause += "DO NOTHING";
				else {
					const updateValues = ast.onConflict.action.update;
					const updateCols = Object.keys(updateValues);
					if (updateCols.length === 0) throw new Error("No update columns provided for ON CONFLICT DO UPDATE");
					const updates = updateCols.map((col) => {
						const value = updateValues[col];
						const quotedCol = quoteIdentifier(col);
						return value === void 0 ? `${quotedCol} = excluded.${quotedCol}` : `${quotedCol} = ?`;
					}).join(", ");
					updateCols.forEach((col) => {
						const value = updateValues[col];
						if (value !== void 0) {
							const colDef = ast.tableDef.sqliteDef.columns[col];
							if (colDef === void 0) throw new Error(`Column ${col} not found`);
							const encodedValue = Schema_exports.encodeSync(colDef.schema)(value);
							bindValues.push(encodedValue);
						}
					});
					conflictClause += `DO UPDATE SET ${updates}`;
				}
			}
		}
		let query = `${insertVerb} INTO '${ast.tableDef.sqliteDef.name}' (${quotedColumns.join(", ")}) VALUES (${placeholders})`;
		query += conflictClause;
		query += formatReturningClause(ast.returning);
		return {
			query,
			bindValues,
			usedTables
		};
	}
	if (ast._tag === "UpdateQuery") {
		const setColumns = Object.keys(ast.values);
		if (setColumns.length === 0) {
			console.warn(`UPDATE query requires at least one column to set (for table ${ast.tableDef.sqliteDef.name}). Running no-op query instead to skip this update query.`);
			return {
				query: "SELECT 1",
				bindValues: [],
				usedTables
			};
		}
		const encodedValues = Schema_exports.encodeSync(ast.tableDef.rowSchema.mapFields(map$3(Schema_exports.optional)))(ast.values);
		setColumns.forEach((col) => {
			bindValues.push(encodedValues[col]);
		});
		let query = `UPDATE '${ast.tableDef.sqliteDef.name}' SET ${setColumns.map((col) => `${quoteIdentifier(col)} = ?`).join(", ")}`;
		const whereClause = formatWhereClause(ast.where, ast.tableDef, bindValues);
		if (whereClause !== void 0) query += ` ${whereClause}`;
		query += formatReturningClause(ast.returning);
		return {
			query,
			bindValues,
			usedTables
		};
	}
	if (ast._tag === "DeleteQuery") {
		let query = `DELETE FROM '${ast.tableDef.sqliteDef.name}'`;
		const whereClause = formatWhereClause(ast.where, ast.tableDef, bindValues);
		if (whereClause !== void 0) query += ` ${whereClause}`;
		query += formatReturningClause(ast.returning);
		return {
			query,
			bindValues,
			usedTables
		};
	}
	if (ast._tag === "CountQuery") return {
		query: [`SELECT COUNT(*) as count FROM '${ast.tableDef.sqliteDef.name}'`, formatWhereClause(ast.where, ast.tableDef, bindValues)].filter((clause) => clause.length > 0).join(" "),
		bindValues,
		usedTables
	};
	if (ast._tag === "RowQuery") {
		const idColDef = ast.tableDef.sqliteDef.columns.id;
		if (idColDef === void 0) throw new Error("Column id not found for ROW query");
		const encodedId = ast.id === SessionIdSymbol ? ast.id : Schema_exports.encodeSync(idColDef.schema)(ast.id);
		return {
			query: `SELECT * FROM '${ast.tableDef.sqliteDef.name}' WHERE ${quoteIdentifier("id")} = ?`,
			bindValues: [encodedId],
			usedTables
		};
	}
	const selectStmt = `SELECT ${ast.select.columns.length === 0 ? "*" : ast.select.columns.map(quoteIdentifier).join(", ")}`;
	const fromStmt = `FROM '${ast.tableDef.sqliteDef.name}'`;
	const whereStmt = formatWhereClause(ast.where, ast.tableDef, bindValues);
	const orderByStmt = ast.orderBy.length > 0 ? `ORDER BY ${ast.orderBy.map(({ col, direction }) => `${quoteIdentifier(col)} ${direction}`).join(", ")}` : "";
	const limitStmt = ast.limit._tag === "Some" ? `LIMIT ?` : "";
	const offsetStmt = ast.offset._tag === "Some" ? `OFFSET ?` : "";
	if (ast.limit._tag === "Some") bindValues.push(ast.limit.value);
	if (ast.offset._tag === "Some") bindValues.push(ast.offset.value);
	return {
		query: [
			selectStmt,
			fromStmt,
			whereStmt,
			orderByStmt,
			limitStmt,
			offsetStmt
		].map((clause) => clause.trim()).filter((clause) => clause.length > 0).join(" "),
		bindValues,
		usedTables
	};
};
var makeQueryBuilder = (tableDef, ast = emptyAst(tableDef)) => {
	const api = {
		select() {
			assertSelectQueryBuilderAst(ast);
			const params = [...arguments];
			if (params.length === 1) {
				const [col] = params;
				return makeQueryBuilder(tableDef, {
					...ast,
					resultSchemaSingle: ast.tableDef.rowSchema.pipe(pluck(col)),
					select: { columns: [col] }
				});
			}
			const columns = params;
			return makeQueryBuilder(tableDef, {
				...ast,
				resultSchemaSingle: columns.length === 0 ? ast.resultSchemaSingle : ast.tableDef.rowSchema.mapFields(pick(columns)),
				select: { columns }
			});
		},
		where: function() {
			if (ast._tag === "InsertQuery") return invalidQueryBuilder("Cannot use where with insert");
			if (ast._tag === "RowQuery") return invalidQueryBuilder("Cannot use where with row");
			if (arguments.length === 1) {
				const params = arguments[0];
				const newOps = Object.entries(params).filter(([, value]) => value !== void 0).map(([col, value]) => hasProperty(value, "op") === true && hasProperty(value, "value") === true ? {
					col,
					op: value.op,
					value: value.value
				} : {
					col,
					op: "=",
					value
				});
				switch (ast._tag) {
					case "CountQuery":
					case "SelectQuery":
					case "UpdateQuery":
					case "DeleteQuery": return makeQueryBuilder(tableDef, {
						...ast,
						where: [...ast.where, ...newOps]
					});
					default: return casesHandled(ast);
				}
			}
			const [col, opOrValue, valueOrUndefined] = arguments;
			const op = valueOrUndefined === void 0 ? "=" : opOrValue;
			const value = valueOrUndefined === void 0 ? opOrValue : valueOrUndefined;
			switch (ast._tag) {
				case "CountQuery":
				case "SelectQuery":
				case "UpdateQuery":
				case "DeleteQuery": return makeQueryBuilder(tableDef, {
					...ast,
					where: [...ast.where, {
						col,
						op,
						value
					}]
				});
				default: return casesHandled(ast);
			}
		},
		orderBy() {
			assertSelectQueryBuilderAst(ast);
			if (arguments.length === 0 || arguments.length > 2) return invalidQueryBuilder();
			if (arguments.length === 1) {
				const params = arguments[0];
				return makeQueryBuilder(tableDef, {
					...ast,
					orderBy: [...ast.orderBy, ...params]
				});
			}
			const [col, direction] = arguments;
			return makeQueryBuilder(tableDef, {
				...ast,
				orderBy: [...ast.orderBy, {
					col,
					direction
				}]
			});
		},
		limit: (limit) => {
			assertSelectQueryBuilderAst(ast);
			return makeQueryBuilder(tableDef, {
				...ast,
				limit: some(limit)
			});
		},
		offset: (offset) => {
			assertSelectQueryBuilderAst(ast);
			return makeQueryBuilder(tableDef, {
				...ast,
				offset: some(offset)
			});
		},
		count: () => {
			if (isRowQuery(ast) === true || ast._tag === "InsertQuery" || ast._tag === "UpdateQuery" || ast._tag === "DeleteQuery") return invalidQueryBuilder();
			return makeQueryBuilder(tableDef, {
				_tag: "CountQuery",
				tableDef,
				where: ast.where,
				resultSchema: Schema_exports.Struct({ count: Schema_exports.Finite }).pipe(pluck("count"), Schema_exports.Array, headOrElse())
			});
		},
		first: (behaviour) => {
			assertSelectQueryBuilderAst(ast);
			if (ast.limit._tag === "Some") return invalidQueryBuilder(`.first() can't be called after .limit()`);
			return makeQueryBuilder(tableDef, {
				...ast,
				limit: some(1),
				pickFirst: {
					_tag: "enabled",
					...behaviour ?? { behaviour: "undefined" }
				}
			});
		},
		insert: (values) => {
			return makeQueryBuilder(tableDef, {
				_tag: "InsertQuery",
				tableDef,
				values: Object.fromEntries(Object.entries(values).filter(([, value]) => value !== void 0)),
				onConflict: void 0,
				returning: void 0,
				resultSchema: Schema_exports.Void
			});
		},
		onConflict: (targetOrTargets, action, updateValues) => {
			const targets = Array.isArray(targetOrTargets) === true ? targetOrTargets : [targetOrTargets];
			assertInsertQueryBuilderAst(ast);
			const onConflict = value(action).pipe(when("ignore", () => ({
				targets,
				action: { _tag: "ignore" }
			})), when("replace", () => ({
				targets,
				action: { _tag: "replace" }
			})), when("update", () => ({
				targets,
				action: {
					_tag: "update",
					update: updateValues
				}
			})), exhaustive);
			return makeQueryBuilder(tableDef, {
				...ast,
				onConflict
			});
		},
		returning: (...columns) => {
			assertWriteQueryBuilderAst(ast);
			return makeQueryBuilder(tableDef, {
				...ast,
				returning: columns,
				resultSchema: tableDef.rowSchema.mapFields(pick(columns)).pipe(Schema_exports.Array)
			});
		},
		update: (values) => {
			return makeQueryBuilder(tableDef, {
				_tag: "UpdateQuery",
				tableDef,
				values: Object.fromEntries(Object.entries(values).filter(([, value]) => value !== void 0)),
				where: ast._tag === "SelectQuery" ? ast.where : [],
				returning: void 0,
				resultSchema: Schema_exports.Void
			});
		},
		delete: () => {
			return makeQueryBuilder(tableDef, {
				_tag: "DeleteQuery",
				tableDef,
				where: ast._tag === "SelectQuery" ? ast.where : [],
				returning: void 0,
				resultSchema: Schema_exports.Void
			});
		}
	};
	return {
		[QueryBuilderTypeId]: QueryBuilderTypeId,
		[QueryBuilderAstSymbol]: ast,
		ResultType: "only-for-type-inference",
		asSql: () => astToSql(ast),
		toString: () => {
			try {
				return astToSql(ast).query;
			} catch (cause) {
				console.debug(`QueryBuilder.toString(): Error converting query builder to string`, cause, ast);
				return `Error converting query builder to string`;
			}
		},
		...api
	};
};
var emptyAst = (tableDef) => ({
	_tag: "SelectQuery",
	columns: [],
	pickFirst: { _tag: "disabled" },
	select: { columns: [] },
	orderBy: [],
	offset: none(),
	limit: none(),
	tableDef,
	where: [],
	resultSchemaSingle: tableDef.rowSchema
});
var assertSelectQueryBuilderAst = (ast) => {
	if (ast._tag !== "SelectQuery") return shouldNeverHappen(`Expected SelectQuery but got ${ast._tag}`);
};
var assertInsertQueryBuilderAst = (ast) => {
	if (ast._tag !== "InsertQuery") return shouldNeverHappen(`Expected InsertQuery but got ${ast._tag}`);
};
var assertWriteQueryBuilderAst = (ast) => {
	if (ast._tag !== "InsertQuery" && ast._tag !== "UpdateQuery" && ast._tag !== "DeleteQuery") return shouldNeverHappen(`Expected WriteQuery but got ${ast._tag}`);
};
var isRowQuery = (ast) => ast._tag === "RowQuery";
var invalidQueryBuilder = (msg) => {
	return shouldNeverHappen(`Invalid query builder${msg !== void 0 ? `: ${msg}` : ""}`);
};
var getResultSchema = (qb) => {
	const queryAst = qb[QueryBuilderAstSymbol];
	switch (queryAst._tag) {
		case "SelectQuery": {
			const arraySchema = Schema_exports.Array(queryAst.resultSchemaSingle);
			if (queryAst.pickFirst._tag === "disabled") return arraySchema;
			else if (queryAst.pickFirst.behaviour === "undefined") return Schema_exports.Array(Schema_exports.UndefinedOr(queryAst.resultSchemaSingle)).pipe(headOrElse(() => void 0));
			else if (queryAst.pickFirst.behaviour === "error") return arraySchema.pipe(headOrElse());
			else {
				const fallbackValue = queryAst.pickFirst.fallback();
				return Schema_exports.Array(Schema_exports.Union([queryAst.resultSchemaSingle, Schema_exports.Literal(fallbackValue)])).pipe(headOrElse(() => fallbackValue));
			}
		}
		case "CountQuery": return Schema_exports.Struct({ count: Schema_exports.Finite }).pipe(pluck("count"), Schema_exports.Array, headOrElse());
		case "InsertQuery":
		case "UpdateQuery":
		case "DeleteQuery":
			if (queryAst.returning !== void 0 && queryAst.returning.length > 0) return queryAst.tableDef.rowSchema.mapFields(pick(queryAst.returning)).pipe(Schema_exports.Array);
			return Schema_exports.Finite;
		case "RowQuery": return queryAst.tableDef.rowSchema.pipe(pluck("value"), Schema_exports.annotate({ title: `${queryAst.tableDef.sqliteDef.name}.value` }), Schema_exports.Array, headOrElse());
		default: return casesHandled(queryAst);
	}
};
var PrimaryKeyId = "livestore/state/sqlite/annotations/primary-key";
var ColumnType = "livestore/state/sqlite/annotations/column-type";
var Default = "livestore/state/sqlite/annotations/default";
var AutoIncrement = "livestore/state/sqlite/annotations/auto-increment";
var Unique = "livestore/state/sqlite/annotations/unique";
dual(2, (schema, type) => {
	return applyAnnotations(schema, { [ColumnType]: type });
});
dual(2, (schema, value) => applyAnnotations(schema, { [Default]: value }));
var applyAnnotations = (schema, overrides) => {
	const identifier = resolveIdentifier(schema.ast);
	const annotations = (identifier !== void 0 && !("identifier" in overrides)) === true ? {
		...overrides,
		identifier
	} : overrides;
	return schema.annotate(annotations);
};
/**
* Maps a schema to a SQLite column definition, respecting column annotations.
*
* Note: When used with schema-based table definitions, optional fields (| undefined)
* are transformed to nullable fields (| null) to match SQLite's NULL semantics.
* Fields with both null and undefined will emit a warning as this is a lossy conversion.
*/
var getColumnDefForSchema = (schema, propertySignature, forceNullable = false) => {
	const ast = schema.ast;
	const getAnnotation = (annotationId) => propertySignature !== void 0 ? hasPropertyAnnotation(propertySignature, annotationId) : fromUndefinedOr(resolveAt(annotationId)(ast));
	const columnType = fromUndefinedOr(resolveAt(ColumnType)(ast));
	const isNullable = forceNullable === true || hasNull(ast) === true || hasUndefined(ast) === true;
	const baseColumn = isSome(columnType) === true ? getColumnForType(columnType.value, isNullable) : getColumnForSchema(schema, isNullable);
	const primaryKey = getAnnotation(PrimaryKeyId).pipe(getOrElse(() => false));
	const autoIncrement = getAnnotation(AutoIncrement).pipe(getOrElse(() => false));
	const defaultValue = getAnnotation(Default);
	return {
		...baseColumn,
		...primaryKey === true ? { primaryKey: true } : {},
		...autoIncrement === true ? { autoIncrement: true } : {},
		...isSome(defaultValue) === true ? { default: some(defaultValue.value) } : {}
	};
};
var hasPropertyAnnotation = (propertySignature, annotationId) => {
	const keyAnnotation = propertySignature.type.context?.annotations?.[annotationId];
	if (keyAnnotation !== void 0) return some(keyAnnotation);
	return fromUndefinedOr(resolveAt(annotationId)(propertySignature.type));
};
/**
* Maps schema property signatures to SQLite column definitions.
* Optional fields (| undefined) become nullable columns (| null).
*/
var schemaFieldsToColumns = (propertySignatures) => {
	const columns = {};
	const uniqueColumns = [];
	for (const prop of propertySignatures) {
		if (typeof prop.name !== "string") continue;
		const isOptional$1 = isOptional(prop.type);
		const fieldSchema = Schema_exports.make(prop.type);
		if (isOptional$1 === true) {
			const { hasNull, hasUndefined } = checkNullUndefined(fieldSchema.ast);
			if (hasNull === true && hasUndefined === true) console.warn(`Field '${prop.name}' has both null and undefined - treating | undefined as | null`);
		}
		const columnDef = getColumnDefForSchema(fieldSchema, prop, isOptional$1 === true);
		const hasPrimaryKey = hasPropertyAnnotation(prop, PrimaryKeyId).pipe(getOrElse(() => false));
		const hasUnique = hasPropertyAnnotation(prop, Unique).pipe(getOrElse(() => false));
		columns[prop.name] = {
			...columnDef,
			...hasPrimaryKey === true ? { primaryKey: true } : {}
		};
		const column = columns[prop.name];
		if (column?.primaryKey === true && column.nullable === true) throw new Error("Primary key columns cannot be nullable");
		if (hasUnique === true) uniqueColumns.push(prop.name);
	}
	return {
		columns,
		uniqueColumns
	};
};
var checkNullUndefined = (ast) => {
	let hasNull = false;
	let hasUndefined = false;
	const visit = (type) => {
		if (isUndefined$1(type) === true) hasUndefined = true;
		else if (isNull(type) === true) hasNull = true;
		else if (isUnion(type) === true) type.types.forEach(visit);
	};
	visit(ast);
	return {
		hasNull,
		hasUndefined
	};
};
var hasNull = (ast) => {
	if (isNull(ast) === true) return true;
	if (isUnion(ast) === true) return ast.types.some((type) => hasNull(type));
	return false;
};
var hasUndefined = (ast) => {
	if (isUndefined$1(ast) === true) return true;
	if (isUnion(ast) === true) return ast.types.some((type) => hasUndefined(type));
	return false;
};
var getColumnForType = (columnType, nullable = false) => {
	switch (columnType) {
		case "text": return text$1({ nullable });
		case "integer": return integer$1({ nullable });
		case "real": return real$1({ nullable });
		case "blob": return blob$1({ nullable });
		default: return shouldNeverHappen(`Unsupported column type: ${columnType}`);
	}
};
var getColumnForSchema = (schema, nullable = false) => {
	const ast = schema.ast;
	const coreAst = stripNullable(ast);
	const coreSchema = stripNullable(ast) === ast ? schema : Schema_exports.make(coreAst);
	if (isBoolean(coreAst) === true) return boolean$1({ nullable });
	const encodedAst = Schema_exports.toEncoded(coreSchema).ast;
	if (isString$1(encodedAst) === true) return text$1({
		schema: coreSchema,
		nullable
	});
	if (isNumber$1(encodedAst) === true) {
		if (hasCheck(coreAst.checks, "effect/schema/isInt") === true || hasDateRepresentation(coreAst) === true) return integer$1({
			schema: coreSchema,
			nullable
		});
		return real$1({
			schema: coreSchema,
			nullable
		});
	}
	if (isUint8ArraySchema(coreAst) === true || isUint8ArraySchema(encodedAst) === true) return blob$1({
		schema: coreSchema,
		nullable
	});
	const literalColumn = getLiteralColumnDefinition(encodedAst, coreSchema, nullable, coreAst);
	if (literalColumn !== null) return literalColumn;
	const coreLiteralColumn = getLiteralColumnDefinition(coreAst, coreSchema, nullable, coreAst);
	if (coreLiteralColumn !== null) return coreLiteralColumn;
	return json$1({
		schema: coreSchema,
		nullable
	});
};
var stripNullable = (ast) => {
	if (isUnion(ast) === false) return ast;
	const coreTypes = ast.types.filter((type) => isNull(type) === false && isUndefined$1(type) === false);
	if (coreTypes.length === 0 || coreTypes.length === ast.types.length) return ast;
	if (coreTypes.length === 1) return coreTypes[0];
	return new Union$1(coreTypes, ast.mode, ast.annotations);
};
var getLiteralColumnDefinition = (ast, schema, nullable, sourceAst) => {
	const literalValues = extractLiteralValues(ast);
	if (literalValues == null) return null;
	switch (getLiteralValueType(literalValues)) {
		case "string": return text$1({
			schema,
			nullable
		});
		case "number":
			if (hasCheck(sourceAst.checks, "effect/schema/isInt") === true || hasDateRepresentation(sourceAst) === true) return integer$1({
				schema,
				nullable
			});
			return (literalValues.length > 1 && literalValues.every((value) => typeof value === "number" && Number.isInteger(value))) === true ? integer$1({
				schema,
				nullable
			}) : real$1({
				schema,
				nullable
			});
		case "boolean": return boolean$1({ nullable });
		case "bigint": return integer$1({
			schema,
			nullable
		});
		default: return null;
	}
};
/** Effect's built-in date codecs expose their semantic type through the Date representation annotation. */
var hasDateRepresentation = (ast) => hasRepresentation(ast, "effect/schema/Date");
var extractLiteralValues = (ast) => {
	if (isLiteral(ast) === true) return [ast.literal];
	if (isUnion(ast) === true && ast.types.length > 0 && ast.types.every((type) => isLiteral(type)) === true) return ast.types.map((type) => type.literal);
	return null;
};
var getLiteralValueType = (literals) => {
	const literalTypes = new Set(literals.map((value) => typeof value));
	if (literalTypes.size !== 1) return null;
	const [literalType] = literalTypes;
	return literalType === "string" || literalType === "number" || literalType === "boolean" || literalType === "bigint" ? literalType : null;
};
/**
* Recursively checks for Effect built-in check metadata.
*
* Checks can be attached directly as `Filter`s or nested in `FilterGroup`s when
* schemas compose multiple refinements, e.g. `Schema.Int.check(...)`.
*
* Effect rc.109 replaced the closed `meta` annotation with the open `representation`
* identity, so built-in checks are matched by their representation id.
*/
var hasCheck = (checks, representationId) => {
	return checks?.some((check) => {
		switch (check._tag) {
			case "Filter": return check.annotations?.representation?.id === representationId;
			case "FilterGroup": return hasCheck(check.checks, representationId);
		}
	}) === true;
};
var isUint8ArraySchema = (ast) => {
	if (hasRepresentation(ast, "effect/schema/Uint8Array") === true) return true;
	const identifier = resolveIdentifier(ast);
	if (identifier !== void 0 && identifier.includes("Uint8Array") === true) return true;
	if (isArrays(ast) === true) return ast.elements.length === 0 && ast.rest.length === 1 && isNumber$1(ast.rest[0]);
	return false;
};
var hasRepresentation = (ast, id) => {
	const representation = ast.annotations?.representation;
	return typeof representation === "object" && representation !== null && "id" in representation && representation.id === id;
};
var { blob, boolean, column, datetime, integer, isColumnDefinition, json, real, text } = dsl_exports;
function table(args) {
	const { ...options } = args;
	let tableName;
	let columns;
	let additionalIndexes = [];
	if ("columns" in args) {
		tableName = args.name;
		const columnOrColumns = args.columns;
		columns = isColumnDefinition$1(columnOrColumns) === true ? { value: columnOrColumns } : columnOrColumns;
		additionalIndexes = [];
	} else if ("schema" in args) {
		const result = args.schema.pipe(getSqlitePropertySignatures, schemaFieldsToColumns);
		columns = result.columns;
		let tempTableName;
		if ("name" in args) tempTableName = args.name;
		else tempTableName = resolveTitle(args.schema.ast) ?? resolveIdentifier(args.schema.ast) ?? shouldNeverHappen("When using schema without explicit name, the schema must have a title or identifier annotation");
		tableName = tempTableName;
		additionalIndexes = (result.uniqueColumns || []).map((columnName) => ({
			name: `idx_${tableName}_${columnName}_unique`,
			columns: [columnName],
			isUnique: true
		}));
	} else return shouldNeverHappen("Either `columns` or `schema` must be provided when calling `table()`");
	const options_ = { isClientDocumentTable: false };
	const allIndexes = [...options?.indexes ?? [], ...additionalIndexes];
	const sqliteDef = table$1(tableName, columns, allIndexes);
	const tableDef = {
		sqliteDef,
		options: options_,
		rowSchema: structSchemaForTable(sqliteDef),
		insertSchema: insertStructSchemaForTable(sqliteDef)
	};
	const query = makeQueryBuilder(tableDef);
	for (const key of Object.keys(query)) tableDef[key] = query[key];
	tableDef[QueryBuilderAstSymbol] = query[QueryBuilderAstSymbol];
	tableDef[QueryBuilderTypeId] = query[QueryBuilderTypeId];
	return tableDef;
}
var getSqlitePropertySignatures = (schema) => {
	const encodedPropertySignatures = getPropertySignatures(toEncoded(schema.ast));
	const typePropertySignatures = getPropertySignatures(toType$1(schema.ast));
	return encodedPropertySignatures.map((encodedPropertySignature) => {
		const typePropertySignature = typePropertySignatures.find((propertySignature) => propertySignature.name === encodedPropertySignature.name);
		if (typePropertySignature === void 0 || hasLiveStoreSqliteAnnotation(encodedPropertySignature.type) === true) return encodedPropertySignature;
		return new PropertySignature(encodedPropertySignature.name, typePropertySignature.type);
	});
};
var getPropertySignatures = (ast) => {
	if (isObjects(ast) === true) return ast.propertySignatures;
	if (isUnion(ast) === true) {
		const [head, ...tail] = ast.types.map(getPropertySignatures);
		if (head === void 0) return [];
		return head.flatMap((propertySignature) => {
			const matchingPropertySignatures = [];
			for (const propertySignatures of tail) {
				const matchingPropertySignature = propertySignatures.find((memberPropertySignature) => memberPropertySignature.name === propertySignature.name);
				if (matchingPropertySignature === void 0) return [];
				matchingPropertySignatures.push(matchingPropertySignature);
			}
			const propertySignatures = [propertySignature, ...matchingPropertySignatures];
			const keyContext = propertySignatures.some((memberPropertySignature) => isOptional(memberPropertySignature.type)) === true === true ? new Context(true, false) : void 0;
			const union = new Union$1(propertySignatures.map((memberPropertySignature) => memberPropertySignature.type), ast.mode, void 0, void 0, void 0, keyContext);
			return [new PropertySignature(propertySignature.name, union)];
		});
	}
	return [];
};
var hasLiveStoreSqliteAnnotation = (ast) => {
	return [...Object.keys(ast.annotations ?? {}), ...Object.keys(ast.context?.annotations ?? {})].some((key) => key.startsWith("livestore/state/sqlite/annotations/"));
};
/**
* STATE DATABASE SYSTEM TABLES
*
* ⚠️  SAFE TO CHANGE: State tables are automatically rebuilt from eventlog when schema changes.
* No need to bump `liveStoreStorageFormatVersion` (uses hash-based migration via SqliteAst.hash()).
*/
var SCHEMA_META_TABLE = "__livestore_schema";
/**
* Tracks schema hashes for user-defined tables to detect schema changes.
*/
var schemaMetaTable = table({
	name: SCHEMA_META_TABLE,
	columns: {
		tableName: text$1({ primaryKey: true }),
		schemaHash: integer$1({ nullable: false }),
		/** ISO date format */
		updatedAt: text$1({ nullable: false })
	}
});
var SCHEMA_EVENT_DEFS_META_TABLE = "__livestore_schema_event_defs";
/**
* Tracks schema hashes for event definitions to detect event schema changes.
*/
var schemaEventDefsMetaTable = table({
	name: SCHEMA_EVENT_DEFS_META_TABLE,
	columns: {
		eventName: text$1({ primaryKey: true }),
		schemaHash: integer$1({ nullable: false }),
		/** ISO date format */
		updatedAt: text$1({ nullable: false })
	}
});
var STATE_HEAD_META_TABLE = "__livestore_state_head";
/**
* Single-row marker for the latest event sequence number reflected by the state DB.
*
* @remarks
* This is separate from the session changeset table because confirmed changesets
* can be removed after they are no longer needed for rollback.
*/
var stateHeadMetaTable = table({
	name: STATE_HEAD_META_TABLE,
	columns: {
		id: integer$1({ primaryKey: true }),
		seqNumGlobal: integer$1({ schema: Schema$3 }),
		seqNumClient: integer$1({ schema: Schema$2 }),
		seqNumRebaseGeneration: integer$1({})
	}
});
/**
* Table which stores SQLite changeset blobs which is used for rolling back
* read-model state during rebasing.
*/
var SESSION_CHANGESET_META_TABLE = "__livestore_session_changeset";
var sessionChangesetMetaTable = table({
	name: SESSION_CHANGESET_META_TABLE,
	columns: {
		seqNumGlobal: integer$1({ schema: Schema$3 }),
		seqNumClient: integer$1({ schema: Schema$2 }),
		seqNumRebaseGeneration: integer$1({}),
		changeset: blob$1({ nullable: true }),
		debug: json$1({ nullable: true })
	},
	indexes: [{
		columns: ["seqNumGlobal", "seqNumClient"],
		name: "idx_session_changeset_id"
	}]
});
var stateSystemTables = [
	schemaMetaTable,
	schemaEventDefsMetaTable,
	stateHeadMetaTable,
	sessionChangesetMetaTable
];
var isStateSystemTable = (tableName) => stateSystemTables.some((_) => _.sqliteDef.name === tableName);
var handleUnknownEvent = ({ schema, context }) => Effect_exports.gen(function* () {
	const config = schema.unknownEventHandling;
	const error = new UnknownEventError(context);
	switch (config.strategy) {
		case "fail": return yield* error;
		case "warn":
			yield* Effect_exports.logWarning("@livestore/common:schema:unknown-event", context);
			return;
		case "ignore": return;
		case "callback": {
			const callback = config.onUnknownEvent;
			yield* trySyncOrPromiseOrEffect(() => callback(context, error)).pipe(Effect_exports.catch((cause) => Effect_exports.logWarning("@livestore/common:schema:unknown-event:callback-error", {
				event: context.event,
				reason: context.reason,
				operation: context.operation,
				cause
			})));
			return;
		}
	}
});
/**
* Resolves the runtime event definition + materializer for a given event name.
*
* Behaviour is intentionally split across the result and error channels:
* - For `'fail'` handling, we surface an `UnknownEventError` via the failure channel so
*   callers can convert it into the appropriate domain error (for example `MaterializeError`).
* - For all other strategies (`warn`, `ignore`, `callback`) we succeed with an
*   `{ _tag: 'unknown' }` value, signalling that the caller should skip the event while
*   continuing normal processing.
*/
var resolveEventDef = (schema, context) => Effect_exports.gen(function* () {
	const eventName = context.event.name;
	const eventDef = schema.eventsDefsMap.get(eventName);
	if (eventDef === void 0) {
		yield* handleUnknownEvent({
			schema,
			context: {
				event: context.event,
				reason: "event-definition-missing",
				operation: context.operation
			}
		});
		return {
			_tag: "unknown",
			reason: "event-definition-missing"
		};
	}
	const materializer = schema.state.materializers.get(eventName);
	if (materializer === void 0) {
		yield* handleUnknownEvent({
			schema,
			context: {
				event: context.event,
				reason: "materializer-missing",
				operation: context.operation
			}
		});
		return {
			_tag: "unknown",
			reason: "materializer-missing"
		};
	}
	return {
		_tag: "known",
		eventDef,
		materializer
	};
});
/**
* Returns a SQLite column specification string for a table's column definitions.
*
* Example:
* ```
* 'id' integer not null autoincrement , 'email' text not null  , 'username' text not null  , 'created_at' text   default CURRENT_TIMESTAMP, PRIMARY KEY ('id')
* ```
*/
var makeColumnSpec = (tableAst) => {
	const pkColumns = tableAst.columns.filter((_) => _.primaryKey);
	const hasSinglePk = pkColumns.length === 1;
	const pkColumn = hasSinglePk === true ? pkColumns[0] : void 0;
	const columnDefStrs = tableAst.columns.map((column) => toSqliteColumnSpec(column, { inlinePrimaryKey: hasSinglePk && column === pkColumn && column.primaryKey }));
	if (pkColumns.length > 1) {
		const quotedPkCols = pkColumns.map((_) => `"${_.name}"`);
		columnDefStrs.push(`PRIMARY KEY (${quotedPkCols.join(", ")})`);
	}
	return columnDefStrs.join(", ");
};
/** NOTE primary keys are applied on a table level not on a column level to account for multi-column primary keys */
var toSqliteColumnSpec = (column, opts) => {
	const columnTypeStr = column.type._tag;
	const nullableStr = opts.inlinePrimaryKey === true ? "" : column.nullable === false ? "not null" : "";
	const includeAutoIncrement = opts.inlinePrimaryKey === true && column.type._tag === "integer" && column.autoIncrement === true;
	const pkStr = opts.inlinePrimaryKey === true ? "primary key" : "";
	const autoIncrementStr = includeAutoIncrement === true ? "autoincrement" : "";
	const defaultValueStr = (() => {
		if (column.default._tag === "None") return "";
		const defaultValue = column.default.value;
		if (isDefaultThunk(defaultValue) === true) return "";
		const resolvedDefault = resolveColumnDefault(defaultValue);
		if (resolvedDefault === null) return "default null";
		if (isSqlDefaultValue(resolvedDefault) === true) return `default ${resolvedDefault.sql}`;
		const encodedDefaultValue = Schema_exports.encodeSync(column.schema)(resolvedDefault);
		if (columnTypeStr === "text") return `default '${encodedDefaultValue}'`;
		return `default ${encodedDefaultValue}`;
	})();
	return `"${column.name}" ${columnTypeStr} ${pkStr} ${autoIncrementStr} ${nullableStr} ${defaultValueStr}`;
};
/**
* EVENTLOG DATABASE SYSTEM TABLES
*
* ⚠️  CRITICAL: NEVER modify eventlog schemas without bumping `liveStoreStorageFormatVersion`!
* Eventlog is the source of truth - schema changes cause permanent data loss.
*
* TODO: Implement proper eventlog versioning system to prevent accidental data loss
*/
var EVENTLOG_META_TABLE = "eventlog";
/**
* Main client-side event log storing all events (global and local/rebased).
*/
var eventlogMetaTable = table({
	name: EVENTLOG_META_TABLE,
	columns: {
		seqNumGlobal: integer$1({
			primaryKey: true,
			schema: Schema$3
		}),
		seqNumClient: integer$1({
			primaryKey: true,
			schema: Schema$2
		}),
		seqNumRebaseGeneration: integer$1({ primaryKey: true }),
		parentSeqNumGlobal: integer$1({ schema: Schema$3 }),
		parentSeqNumClient: integer$1({ schema: Schema$2 }),
		parentSeqNumRebaseGeneration: integer$1({}),
		/** Event definition name */
		name: text$1({}),
		argsJson: text$1({ schema: Schema_exports.fromJsonString(Schema_exports.Any) }),
		clientId: text$1({}),
		sessionId: text$1({}),
		schemaHash: integer$1({}),
		syncMetadataJson: text$1({ schema: Schema_exports.fromJsonString(Schema_exports.toCodecJson(Schema_exports.Option(Schema_exports.Json))) })
	},
	indexes: [{
		columns: ["seqNumGlobal"],
		name: "idx_eventlog_seqNumGlobal"
	}, {
		columns: [
			"seqNumGlobal",
			"seqNumClient",
			"seqNumRebaseGeneration"
		],
		name: "idx_eventlog_seqNum"
	}]
});
var SYNC_STATUS_TABLE = "__livestore_sync_status";
var eventlogSystemTables = [eventlogMetaTable, table({
	name: SYNC_STATUS_TABLE,
	columns: {
		head: integer$1({ primaryKey: true }),
		backendId: text$1({ nullable: true })
	}
})];
/**
* Connectivity metadata emitted by sync backends.
*/
var NetworkStatus = Schema_exports.Struct({
	/** True when the upstream sync backend is reachable and responding to health checks. */
	isConnected: Schema_exports.Boolean,
	/** Unix epoch timestamp (ms) of the latest connectivity state transition. */
	timestampMs: Schema_exports.Finite,
	/** Devtools specific metadata describing simulator overrides. */
	devtools: Schema_exports.Struct({ 
	/** Indicates whether the devtools latch forced the client into an offline state. */
latchClosed: Schema_exports.Boolean })
}).annotate({ title: "NetworkStatus" });
Schema_exports.Union([
	Schema_exports.TaggedStruct("MoreUnknown", {}),
	Schema_exports.TaggedStruct("MoreKnown", { remaining: Schema_exports.Finite }),
	Schema_exports.TaggedStruct("NoMore", {})
]);
var pageInfoNoMore = { _tag: "NoMore" };
var of = (obj) => obj;
var requestId = Schema_exports.String;
var clientId = Schema_exports.String;
var sessionId = Schema_exports.String;
/**
* Display/package version field for DevTools messages.
* Compatibility is decided by the optional DevTools protocol version carried by handshake messages.
*/
var liveStoreVersion$1 = Schema_exports.String;
var LSDMessage = (tag, fields) => Schema_exports.TaggedStruct(tag, {
	liveStoreVersion: liveStoreVersion$1,
	...fields
}).annotate({ identifier: tag });
var LSDChannelMessage = (tag, fields) => LSDMessage(tag, {
	clientId,
	...fields
});
var LSDClientSessionChannelMessage = (tag, fields) => LSDMessage(tag, {
	clientId,
	sessionId,
	...fields
});
var LSDClientSessionReqResMessage = (tag, fields) => LSDMessage(tag, {
	clientId,
	sessionId,
	requestId,
	...fields
});
var LSDReqResMessage = (tag, fields) => LSDChannelMessage(tag, {
	requestId,
	...fields
});
var LeaderReqResMessage = (tag, fields) => {
	const Success = Schema_exports.TaggedStruct(`${tag}.Response.Success`, {
		requestId,
		liveStoreVersion: liveStoreVersion$1,
		...fields.success
	}).annotate({ identifier: `${tag}.Response.Success` });
	const Error = fields.error !== void 0 ? Schema_exports.TaggedStruct(`${tag}.Response.Error`, {
		requestId,
		liveStoreVersion: liveStoreVersion$1,
		...fields.error
	}).annotate({ identifier: `${tag}.Response.Error` }) : Schema_exports.Never;
	return {
		Request: Schema_exports.TaggedStruct(`${tag}.Request`, {
			requestId,
			liveStoreVersion: liveStoreVersion$1,
			...fields.payload
		}).annotate({ identifier: `${tag}.Request` }),
		Response: Schema_exports.Union([Success, Error]),
		Success,
		Error
	};
};
var DebugInfoReq = LSDClientSessionReqResMessage("LSD.ClientSession.DebugInfoReq", {});
var DebugInfoRes = LSDClientSessionReqResMessage("LSD.ClientSession.DebugInfoRes", { debugInfo: DebugInfo });
var DebugInfoHistorySubscribe = LSDClientSessionReqResMessage("LSD.ClientSession.DebugInfoHistorySubscribe", { subscriptionId: Schema_exports.String });
var DebugInfoHistoryRes = LSDClientSessionReqResMessage("LSD.ClientSession.DebugInfoHistoryRes", {
	debugInfoHistory: Schema_exports.Array(DebugInfo),
	subscriptionId: Schema_exports.String
});
var DebugInfoHistoryUnsubscribe = LSDClientSessionReqResMessage("LSD.ClientSession.DebugInfoHistoryUnsubscribe", { subscriptionId: Schema_exports.String });
var DebugInfoResetReq = LSDClientSessionReqResMessage("LSD.ClientSession.DebugInfoResetReq", {});
var DebugInfoResetRes = LSDClientSessionReqResMessage("LSD.ClientSession.DebugInfoResetRes", {});
var DebugInfoRerunQueryReq = LSDClientSessionReqResMessage("LSD.ClientSession.DebugInfoRerunQueryReq", {
	queryStr: Schema_exports.String,
	bindValues: Schema_exports.UndefinedOr(PreparedBindValues),
	queriedTables: Schema_exports.ReadonlySet(Schema_exports.String)
});
var DebugInfoRerunQueryRes = LSDClientSessionReqResMessage("LSD.ClientSession.DebugInfoRerunQueryRes", {});
var SyncHeadSubscribe$1 = LSDClientSessionReqResMessage("LSD.ClientSession.SyncHeadSubscribe", { subscriptionId: Schema_exports.String });
var SyncHeadUnsubscribe$1 = LSDClientSessionReqResMessage("LSD.ClientSession.SyncHeadUnsubscribe", { subscriptionId: Schema_exports.String });
var SyncHeadRes$1 = LSDClientSessionReqResMessage("LSD.ClientSession.SyncHeadRes", {
	local: Composite,
	upstream: Composite,
	subscriptionId: Schema_exports.String
});
var ReactivityGraphSubscribe = LSDClientSessionReqResMessage("LSD.ClientSession.ReactivityGraphSubscribe", {
	includeResults: Schema_exports.Boolean,
	subscriptionId: Schema_exports.String
});
var ReactivityGraphUnsubscribe = LSDClientSessionReqResMessage("LSD.ClientSession.ReactivityGraphUnsubscribe", { subscriptionId: Schema_exports.String });
var ReactivityGraphRes = LSDClientSessionReqResMessage("LSD.ClientSession.ReactivityGraphRes", {
	reactivityGraph: Schema_exports.Any,
	subscriptionId: Schema_exports.String
});
var LiveQueriesSubscribe = LSDClientSessionReqResMessage("LSD.ClientSession.LiveQueriesSubscribe", { subscriptionId: Schema_exports.String });
var LiveQueriesUnsubscribe = LSDClientSessionReqResMessage("LSD.ClientSession.LiveQueriesUnsubscribe", { subscriptionId: Schema_exports.String });
var SerializedLiveQuery = Schema_exports.Struct({
	_tag: Schema_exports.Literals([
		"computed",
		"db",
		"graphql",
		"signal"
	]),
	id: Schema_exports.Finite,
	label: Schema_exports.String,
	hash: Schema_exports.String,
	runs: Schema_exports.Finite,
	executionTimes: Schema_exports.Array(Schema_exports.Finite),
	lastestResult: Schema_exports.Any,
	activeSubscriptions: Schema_exports.Array(Schema_exports.Struct({ frames: Schema_exports.Array(Schema_exports.Struct({
		name: Schema_exports.String,
		filePath: Schema_exports.String
	})) }))
});
var LiveQueriesRes = LSDClientSessionReqResMessage("LSD.ClientSession.LiveQueriesRes", {
	liveQueries: Schema_exports.Array(SerializedLiveQuery),
	subscriptionId: Schema_exports.String
});
var Ping$1 = LSDClientSessionReqResMessage("LSD.ClientSession.Ping", { devtoolsProtocolVersion: Schema_exports.optional(Schema_exports.Finite) });
var Pong$1 = LSDClientSessionReqResMessage("LSD.ClientSession.Pong", { devtoolsProtocolVersion: Schema_exports.optional(Schema_exports.Finite) });
/**
* Sent by the app when the DevTools protocol isn't compatible.
* Contains package versions for display and protocol versions for the actual compatibility decision.
*/
var VersionMismatch$1 = LSDClientSessionReqResMessage("LSD.ClientSession.VersionMismatch", {
	/** The version running in the app */
	appVersion: Schema_exports.String,
	/** The version that was sent by DevTools (that caused the mismatch) */
	receivedVersion: Schema_exports.String,
	appDevtoolsProtocolVersion: Schema_exports.Finite,
	receivedDevtoolsProtocolVersion: Schema_exports.optional(Schema_exports.Finite)
});
var Disconnect$1 = LSDClientSessionChannelMessage("LSD.ClientSession.Disconnect", {});
var MessageToApp$1 = Schema_exports.Union([
	DebugInfoReq,
	DebugInfoHistorySubscribe,
	DebugInfoHistoryUnsubscribe,
	DebugInfoResetReq,
	DebugInfoRerunQueryReq,
	ReactivityGraphSubscribe,
	ReactivityGraphUnsubscribe,
	LiveQueriesSubscribe,
	LiveQueriesUnsubscribe,
	Disconnect$1,
	Ping$1,
	SyncHeadSubscribe$1,
	SyncHeadUnsubscribe$1
]).annotate({ identifier: "LSD.ClientSession.MessageToApp" });
var MessageFromApp$1 = Schema_exports.Union([
	DebugInfoRes,
	DebugInfoHistoryRes,
	DebugInfoResetRes,
	DebugInfoRerunQueryRes,
	ReactivityGraphRes,
	LiveQueriesRes,
	Disconnect$1,
	Pong$1,
	VersionMismatch$1,
	SyncHeadRes$1
]).annotate({ identifier: "LSD.ClientSession.MessageFromApp" });
/**
* SyncState represents the current sync state of a sync node relative to an upstream node.
* Events flow from local to upstream, with each state maintaining its own event head.
*
* Example:
* ```
*                 +------------------------+
*                 |     PENDING EVENTS     |
*                 +------------------------+
*               ▼                       ▼
*        Upstream Head             Local Head
*              e1        e1.1, e1.2, e2
* ```
*
* **Pending Events**: Events awaiting acknowledgment from the upstream.
* - Can be confirmed or rejected by the upstream.
* - Subject to rebase if rejected.
*
* Payloads:
* - `PayloadUpstreamRebase`: Upstream has performed a rebase, so downstream must roll back to the specified event
*    and rebase the pending events on top of the new events.
* - `PayloadUpstreamAdvance`: Upstream has advanced, so downstream must rebase the pending events on top of the new events.
* - `PayloadLocalPush`: Local push payload
*
* Invariants:
* 1. **Chain Continuity**: Each event must reference its immediate parent.
* 2. **Head Ordering**: Upstream Head ≤ Local Head.
* 3. **Event number sequence**: Must follow the pattern e1→e1.1→e1.2→e2.
*
* A few further notes to help form an intuition:
* - The goal is to keep the pending events as small as possible (i.e. to have synced with the next upstream node)
* - There are 2 cases for rebasing:
*   - The conflicting event only conflicts with the pending events -> only (some of) the pending events need to be rolled back
*
* The `merge` function processes updates to the sync state based on incoming payloads,
* handling cases such as upstream rebase, advance and local push.
*/
var SyncState = class extends Schema_exports.Class("SyncState")({
	pending: Schema_exports.Array(EncodedWithMeta),
	/** What this node expects the next upstream node to have as its own local head */
	upstreamHead: Composite,
	/** Equivalent to `pending.at(-1)?.id` if there are pending events */
	localHead: Composite
}) {
	toJSON = () => ({
		pending: this.pending.map((e) => e.toJSON()),
		upstreamHead: toString(this.upstreamHead),
		localHead: toString(this.localHead)
	});
};
/**
* This payload propagates a rebase from the upstream node
*/
var PayloadUpstreamRebase = Schema_exports.TaggedStruct("upstream-rebase", {
	/** Events which need to be rolled back */
	rollbackEvents: Schema_exports.Array(EncodedWithMeta),
	/** Events which need to be applied after the rollback (already rebased by the upstream node) */
	newEvents: Schema_exports.Array(EncodedWithMeta)
});
var PayloadUpstreamAdvance = Schema_exports.TaggedStruct("upstream-advance", { newEvents: Schema_exports.Array(EncodedWithMeta) });
var PayloadLocalPush = Schema_exports.TaggedStruct("local-push", { newEvents: Schema_exports.Array(EncodedWithMeta) });
var Payload = Schema_exports.Union([
	PayloadUpstreamRebase,
	PayloadUpstreamAdvance,
	PayloadLocalPush
]);
var PayloadUpstream = Schema_exports.Union([PayloadUpstreamRebase, PayloadUpstreamAdvance]);
/** Only used for debugging purposes */
var MergeContext = class extends Schema_exports.Class("MergeContext")({
	payload: Payload,
	syncState: SyncState
}) {
	toJSON = () => {
		return {
			payload: value(this.payload).pipe(tag("local-push", () => ({
				_tag: "local-push",
				newEvents: this.payload.newEvents.map((e) => e.toJSON())
			})), tag("upstream-advance", () => ({
				_tag: "upstream-advance",
				newEvents: this.payload.newEvents.map((e) => e.toJSON())
			})), tag("upstream-rebase", (payload) => ({
				_tag: "upstream-rebase",
				newEvents: payload.newEvents.map((e) => e.toJSON()),
				rollbackEvents: payload.rollbackEvents.map((e) => e.toJSON())
			})), exhaustive),
			syncState: this.syncState.toJSON()
		};
	};
};
var MergeResultAdvance = class extends Schema_exports.Class("MergeResultAdvance")({
	_tag: Schema_exports.Literal("advance"),
	newSyncState: SyncState,
	newEvents: Schema_exports.Array(EncodedWithMeta),
	/** Events which were previously pending but are now confirmed */
	confirmedEvents: Schema_exports.Array(EncodedWithMeta),
	mergeContext: MergeContext
}) {
	toJSON = () => {
		return {
			_tag: this._tag,
			newSyncState: this.newSyncState.toJSON(),
			newEvents: this.newEvents.map((e) => e.toJSON()),
			confirmedEvents: this.confirmedEvents.map((e) => e.toJSON()),
			mergeContext: this.mergeContext.toJSON()
		};
	};
};
var MergeResultRebase = class extends Schema_exports.Class("MergeResultRebase")({
	_tag: Schema_exports.Literal("rebase"),
	newSyncState: SyncState,
	newEvents: Schema_exports.Array(EncodedWithMeta),
	/** Events which need to be rolled back */
	rollbackEvents: Schema_exports.Array(EncodedWithMeta),
	mergeContext: MergeContext
}) {
	toJSON = () => {
		return {
			_tag: this._tag,
			newSyncState: this.newSyncState.toJSON(),
			newEvents: this.newEvents.map((e) => e.toJSON()),
			rollbackEvents: this.rollbackEvents.map((e) => e.toJSON()),
			mergeContext: this.mergeContext.toJSON()
		};
	};
};
var MergeResultReject = class extends Schema_exports.Class("MergeResultReject")({
	_tag: Schema_exports.Literal("reject"),
	/** The minimum id that the new events must have */
	expectedMinimumId: Composite,
	mergeContext: MergeContext
}) {
	toJSON = () => {
		return {
			_tag: this._tag,
			expectedMinimumId: toString(this.expectedMinimumId),
			mergeContext: this.mergeContext.toJSON()
		};
	};
};
Schema_exports.Union([
	MergeResultAdvance,
	MergeResultRebase,
	MergeResultReject
]);
var payloadFromMergeResult = (mergeResult) => value(mergeResult).pipe(tag("advance", (result) => ({
	_tag: "upstream-advance",
	newEvents: result.newEvents
})), tag("rebase", (result) => ({
	_tag: "upstream-rebase",
	newEvents: result.newEvents,
	rollbackEvents: result.rollbackEvents
})), exhaustive);
var merge = Effect_exports.fnUntraced(function* ({ syncState, payload, isClientOnlyEvent, isEqualEvent, ignoreClientOnlyEvents = false }) {
	yield* validateSyncState(syncState);
	yield* validatePayload(payload);
	const mergeContext = MergeContext.make({
		payload,
		syncState
	});
	switch (payload._tag) {
		case "upstream-rebase": {
			const rollbackEvents = [...payload.rollbackEvents, ...syncState.pending];
			const newUpstreamHead = payload.newEvents.at(-1)?.seqNum ?? syncState.upstreamHead;
			const rebasedPending = rebaseEvents({
				events: syncState.pending,
				baseEventSequenceNumber: newUpstreamHead,
				isClientOnlyEvent
			});
			return yield* validateMergeResult(MergeResultRebase.make({
				_tag: "rebase",
				newSyncState: new SyncState({
					pending: rebasedPending,
					upstreamHead: newUpstreamHead,
					localHead: rebasedPending.at(-1)?.seqNum ?? newUpstreamHead
				}),
				newEvents: [...payload.newEvents, ...rebasedPending],
				rollbackEvents,
				mergeContext
			}));
		}
		case "upstream-advance": {
			if (payload.newEvents.length === 0) return yield* validateMergeResult(MergeResultAdvance.make({
				_tag: "advance",
				newSyncState: new SyncState({
					pending: syncState.pending,
					upstreamHead: syncState.upstreamHead,
					localHead: syncState.localHead
				}),
				newEvents: [],
				confirmedEvents: [],
				mergeContext
			}));
			for (let i = 1; i < payload.newEvents.length; i++) if (isGreaterThan(payload.newEvents[i - 1].seqNum, payload.newEvents[i].seqNum) === true) return yield* dieDebugger(`Events must be sorted in ascending order by event number. Received: [${payload.newEvents.map((e) => toString(e.seqNum)).join(", ")}]`);
			if (isGreaterThan(syncState.upstreamHead, payload.newEvents[0].seqNum) === true || isEqual(syncState.upstreamHead, payload.newEvents[0].seqNum) === true) return yield* dieDebugger(`Incoming events must be greater than upstream head. Expected greater than: ${toString(syncState.upstreamHead)}. Received: [${payload.newEvents.map((e) => toString(e.seqNum)).join(", ")}]`);
			const newUpstreamHead = payload.newEvents.at(-1).seqNum;
			const divergentPendingIndex = findDivergencePoint({
				existingEvents: syncState.pending,
				incomingEvents: payload.newEvents,
				isEqualEvent,
				isClientOnlyEvent,
				ignoreClientOnlyEvents
			});
			if (divergentPendingIndex === -1) {
				const pendingEventSequenceNumbers = new Set(syncState.pending.map((e) => `${e.seqNum.global},${e.seqNum.client}`));
				const newEvents = payload.newEvents.filter((e) => !pendingEventSequenceNumbers.has(`${e.seqNum.global},${e.seqNum.client}`));
				let clientIndexOffset = 0;
				const [pendingMatching, pendingRemaining] = splitWhere(syncState.pending, (pendingEvent, index) => {
					if (ignoreClientOnlyEvents === true && isClientOnlyEvent(pendingEvent) === true) {
						clientIndexOffset++;
						return false;
					}
					const newEvent = payload.newEvents.at(index - clientIndexOffset);
					if (newEvent == null) return true;
					return !isEqualEvent(pendingEvent, newEvent);
				});
				return yield* validateMergeResult(MergeResultAdvance.make({
					_tag: "advance",
					newSyncState: new SyncState({
						pending: pendingRemaining,
						upstreamHead: newUpstreamHead,
						localHead: pendingRemaining.at(-1)?.seqNum ?? max(syncState.localHead, newUpstreamHead)
					}),
					newEvents,
					confirmedEvents: pendingMatching,
					mergeContext
				}));
			} else {
				const divergentPending = syncState.pending.slice(divergentPendingIndex);
				const rebasedPending = rebaseEvents({
					events: divergentPending,
					baseEventSequenceNumber: newUpstreamHead,
					isClientOnlyEvent
				});
				const divergentNewEventsIndex = findDivergencePoint({
					existingEvents: payload.newEvents,
					incomingEvents: syncState.pending,
					isEqualEvent,
					isClientOnlyEvent,
					ignoreClientOnlyEvents
				});
				return yield* validateMergeResult(MergeResultRebase.make({
					_tag: "rebase",
					newSyncState: new SyncState({
						pending: rebasedPending,
						upstreamHead: newUpstreamHead,
						localHead: rebasedPending.at(-1).seqNum
					}),
					newEvents: [...payload.newEvents.slice(divergentNewEventsIndex), ...rebasedPending],
					rollbackEvents: divergentPending,
					mergeContext
				}));
			}
		}
		case "local-push":
			if (payload.newEvents.length === 0) return yield* validateMergeResult(MergeResultAdvance.make({
				_tag: "advance",
				newSyncState: syncState,
				newEvents: [],
				confirmedEvents: [],
				mergeContext
			}));
			if (!isGreaterThan(payload.newEvents.at(0).seqNum, syncState.localHead) === true) {
				const expectedMinimumId = nextPair({
					seqNum: syncState.localHead,
					isClientOnly: true
				}).seqNum;
				return yield* validateMergeResult(MergeResultReject.make({
					_tag: "reject",
					expectedMinimumId,
					mergeContext
				}));
			} else {
				const nonClientOnlyEvents = ignoreClientOnlyEvents === true ? payload.newEvents.filter((event) => !isClientOnlyEvent(event)) : payload.newEvents;
				const newPending = [...syncState.pending, ...nonClientOnlyEvents];
				const newLocalHead = newPending.at(-1)?.seqNum ?? max(syncState.localHead, syncState.upstreamHead);
				return yield* validateMergeResult(MergeResultAdvance.make({
					_tag: "advance",
					newSyncState: new SyncState({
						pending: newPending,
						upstreamHead: syncState.upstreamHead,
						localHead: newLocalHead
					}),
					newEvents: payload.newEvents,
					confirmedEvents: [],
					mergeContext
				}));
			}
		default: return casesHandled(payload);
	}
});
/**
* Gets the index relative to `existingEvents` where the divergence point is
* by comparing each event in `existingEvents` to the corresponding event in `incomingEvents`
*/
var findDivergencePoint = ({ existingEvents, incomingEvents, isEqualEvent, isClientOnlyEvent, ignoreClientOnlyEvents }) => {
	if (ignoreClientOnlyEvents === true) {
		const divergencePointWithoutClientOnlyEvents = findDivergencePoint({
			existingEvents: existingEvents.filter((event) => !isClientOnlyEvent(event)),
			incomingEvents,
			isEqualEvent,
			isClientOnlyEvent,
			ignoreClientOnlyEvents: false
		});
		if (divergencePointWithoutClientOnlyEvents === -1) return -1;
		const divergencePointEventSequenceNumber = existingEvents[divergencePointWithoutClientOnlyEvents].seqNum;
		return existingEvents.findIndex((event) => isEqual(event.seqNum, divergencePointEventSequenceNumber));
	}
	return existingEvents.findIndex((existingEvent, index) => {
		const incomingEvent = incomingEvents[index];
		return incomingEvent !== void 0 && isEqualEvent(existingEvent, incomingEvent) === false;
	});
};
var rebaseEvents = ({ events, baseEventSequenceNumber, isClientOnlyEvent }) => {
	let prevEventSequenceNumber = baseEventSequenceNumber;
	const rebaseGeneration = baseEventSequenceNumber.rebaseGeneration + 1;
	return events.map((event) => {
		const newEvent = event.rebase({
			parentSeqNum: prevEventSequenceNumber,
			isClientOnly: isClientOnlyEvent(event),
			rebaseGeneration
		});
		prevEventSequenceNumber = newEvent.seqNum;
		return newEvent;
	});
};
var validatePayload = (payload) => Effect_exports.gen(function* () {
	for (let i = 1; i < payload.newEvents.length; i++) if (isGreaterThanOrEqual(payload.newEvents[i - 1].seqNum, payload.newEvents[i].seqNum) === true) return yield* dieDebugger(`Events must be ordered in monotonically ascending order by eventNum. Received: [${payload.newEvents.map((e) => toString(e.seqNum)).join(", ")}]`);
});
var validateSyncState = Effect_exports.fnUntraced(function* (syncState) {
	for (let i = 0; i < syncState.pending.length; i++) {
		const event = syncState.pending[i];
		const nextEvent = syncState.pending[i + 1];
		if (nextEvent === void 0) break;
		if (isGreaterThanOrEqual(event.seqNum, nextEvent.seqNum) === true) return yield* dieDebugger(`Events must be ordered in monotonically ascending order by eventNum. Received: [${syncState.pending.map((e) => toString(e.seqNum)).join(", ")}]`, {
			event,
			nextEvent
		});
		if (nextEvent.seqNum.global > event.seqNum.global === true) {
			if (nextEvent.seqNum.client !== 0) return yield* dieDebugger(`New global events must point to clientId 0 in the parentSeqNum. Received: (${toString(nextEvent.seqNum)})`, syncState.pending, {
				event,
				nextEvent
			});
		} else if (isEqual(nextEvent.parentSeqNum, event.seqNum) === false) return yield* dieDebugger("Events must be linked in a continuous chain via the parentSeqNum", syncState.pending, {
			event,
			nextEvent
		});
	}
});
var validateMergeResult = Effect_exports.fnUntraced(function* (mergeResult) {
	if (mergeResult._tag === "reject") return mergeResult;
	yield* validateSyncState(mergeResult.newSyncState);
	if (isGreaterThan(mergeResult.newSyncState.upstreamHead, mergeResult.newSyncState.localHead) === true) return yield* dieDebugger("Local head must be greater than or equal to upstream head", {
		localHead: mergeResult.newSyncState.localHead,
		upstreamHead: mergeResult.newSyncState.upstreamHead
	});
	if (isGreaterThanOrEqual(mergeResult.newSyncState.localHead, mergeResult.mergeContext.syncState.localHead) === false) return yield* dieDebugger("New local head must be greater than or equal to the previous local head", {
		localHead: mergeResult.newSyncState.localHead,
		previousLocalHead: mergeResult.mergeContext.syncState.localHead
	});
	if (isGreaterThanOrEqual(mergeResult.newSyncState.upstreamHead, mergeResult.mergeContext.syncState.upstreamHead) === false) return yield* dieDebugger("New upstream head must be greater than or equal to the previous upstream head", {
		upstreamHead: mergeResult.newSyncState.upstreamHead,
		previousUpstreamHead: mergeResult.mergeContext.syncState.upstreamHead
	});
	return mergeResult;
});
LSDReqResMessage("LSD.Leader.ResetAllDataReq", { mode: Schema_exports.Literals(["all-data", "only-app-db"]) });
var DatabaseFileInfoReq = LSDReqResMessage("LSD.Leader.DatabaseFileInfoReq", {});
var DatabaseFileInfo = Schema_exports.Struct({
	fileSize: Schema_exports.Finite,
	persistenceInfo: Schema_exports.StructWithRest(Schema_exports.Struct({ fileName: Schema_exports.String }), [Schema_exports.Record(Schema_exports.String, Schema_exports.Any)])
});
var DatabaseFileInfoRes = LSDReqResMessage("LSD.Leader.DatabaseFileInfoRes", {
	state: DatabaseFileInfo,
	eventlog: DatabaseFileInfo
});
var NetworkStatusSubscribe = LSDReqResMessage("LSD.Leader.NetworkStatusSubscribe", { subscriptionId: Schema_exports.String });
var NetworkStatusUnsubscribe = LSDReqResMessage("LSD.Leader.NetworkStatusUnsubscribe", { subscriptionId: Schema_exports.String });
var NetworkStatusRes = LSDReqResMessage("LSD.Leader.NetworkStatusRes", {
	networkStatus: NetworkStatus,
	subscriptionId: Schema_exports.String
});
var SyncingInfoReq = LSDReqResMessage("LSD.Leader.SyncingInfoReq", {});
var SyncingInfo = Schema_exports.Struct({
	enabled: Schema_exports.Boolean,
	metadata: Schema_exports.Record(Schema_exports.String, Schema_exports.Any)
});
var SyncingInfoRes = LSDReqResMessage("LSD.Leader.SyncingInfoRes", { syncingInfo: SyncingInfo });
var SyncHistorySubscribe = LSDReqResMessage("LSD.Leader.SyncHistorySubscribe", { subscriptionId: Schema_exports.String });
var SyncHistoryUnsubscribe = LSDReqResMessage("LSD.Leader.SyncHistoryUnsubscribe", { subscriptionId: Schema_exports.String });
var SyncHistoryRes = LSDReqResMessage("LSD.Leader.SyncHistoryRes", {
	eventEncoded: Encoded$1,
	metadata: Schema_exports.Option(Schema_exports.Json),
	subscriptionId: Schema_exports.String
});
var SyncHeadSubscribe = LSDReqResMessage("LSD.Leader.SyncHeadSubscribe", { subscriptionId: Schema_exports.String });
var SyncHeadUnsubscribe = LSDReqResMessage("LSD.Leader.SyncHeadUnsubscribe", { subscriptionId: Schema_exports.String });
var SyncHeadRes = LSDReqResMessage("LSD.Leader.SyncHeadRes", {
	local: Composite,
	upstream: Composite,
	subscriptionId: Schema_exports.String
});
var SnapshotReq = LSDReqResMessage("LSD.Leader.SnapshotReq", {});
var SnapshotRes = LSDReqResMessage("LSD.Leader.SnapshotRes", { snapshot: Uint8Array$1 });
var LoadDatabaseFile = LeaderReqResMessage("LSD.Leader.LoadDatabaseFile", {
	payload: {
		data: Uint8Array$1,
		batchId: Schema_exports.optional(Schema_exports.String)
	},
	success: {},
	error: { cause: Schema_exports.Union([
		Schema_exports.TaggedStruct("unsupported-file", {}),
		Schema_exports.TaggedStruct("unsupported-database", {}),
		Schema_exports.TaggedStruct("unknown-error", { cause: Schema_exports.Defect() })
	]) }
});
var SyncPull = LSDMessage("LSD.Leader.SyncPull", { payload: PayloadUpstream });
var CommitEventReq = LSDReqResMessage("LSD.Leader.CommitEventReq", { eventEncoded: Encoded });
var CommitEventRes = LSDReqResMessage("LSD.Leader.CommitEventRes", {});
var EventlogReq = LSDReqResMessage("LSD.Leader.EventlogReq", {});
var EventlogRes = LSDReqResMessage("LSD.Leader.EventlogRes", { eventlog: Uint8Array$1 });
var Ping = LSDReqResMessage("LSD.Leader.Ping", { devtoolsProtocolVersion: Schema_exports.optional(Schema_exports.Finite) });
var Pong = LSDReqResMessage("LSD.Leader.Pong", { devtoolsProtocolVersion: Schema_exports.optional(Schema_exports.Finite) });
/**
* Sent by the app when the DevTools protocol isn't compatible.
* Contains package versions for display and protocol versions for the actual compatibility decision.
*/
var VersionMismatch = LSDReqResMessage("LSD.Leader.VersionMismatch", {
	/** The version running in the app */
	appVersion: Schema_exports.String,
	/** The version that was sent by DevTools (that caused the mismatch) */
	receivedVersion: Schema_exports.String,
	appDevtoolsProtocolVersion: Schema_exports.Finite,
	receivedDevtoolsProtocolVersion: Schema_exports.optional(Schema_exports.Finite)
});
var Disconnect = LSDReqResMessage("LSD.Leader.Disconnect", {});
var SetSyncLatch = LeaderReqResMessage("LSD.Leader.SetSyncLatch", {
	payload: { closeLatch: Schema_exports.Boolean },
	success: {}
});
var ResetAllData = LeaderReqResMessage("LSD.Leader.ResetAllData", {
	payload: { mode: Schema_exports.Literals(["all-data", "only-app-db"]) },
	success: {}
});
var MessageToApp = Schema_exports.Union([
	SnapshotReq,
	LoadDatabaseFile.Request,
	EventlogReq,
	ResetAllData.Request,
	NetworkStatusSubscribe,
	NetworkStatusUnsubscribe,
	Disconnect,
	CommitEventReq,
	Ping,
	DatabaseFileInfoReq,
	SyncHistorySubscribe,
	SyncHistoryUnsubscribe,
	SyncingInfoReq,
	SyncHeadSubscribe,
	SyncHeadUnsubscribe,
	SetSyncLatch.Request
]).annotate({ identifier: "LSD.Leader.MessageToApp" });
var MessageFromApp = Schema_exports.Union([
	SnapshotRes,
	LoadDatabaseFile.Response,
	EventlogRes,
	Disconnect,
	SyncPull,
	NetworkStatusRes,
	CommitEventRes,
	Pong,
	VersionMismatch,
	DatabaseFileInfoRes,
	SyncHistoryRes,
	SyncingInfoRes,
	SyncHeadRes,
	ResetAllData.Success,
	SetSyncLatch.Success
]).annotate({ identifier: "LSD.Leader.MessageFromApp" });
Schema_exports.Union([
	Schema_exports.TaggedStruct("node", { 
	/** WebSocket URL */
url: Schema_exports.String }),
	Schema_exports.TaggedStruct("web", {}),
	Schema_exports.TaggedStruct("browser-extension", {})
]);
Schema_exports.Literals([
	"node",
	"web",
	"browser-extension"
]);
var makeNodeName = {
	devtools: { random: () => `devtools-instance-${nanoid()}` },
	client: {
		session: ({ storeId, clientId, sessionId }) => `client-session-${storeId}-${clientId}-${sessionId}`,
		leader: ({ storeId, clientId }) => `client-leader-${storeId}-${clientId}`
	}
};
var makeChannelName = {
	/**
	* SessionInfo channel for DevTools discovery.
	* When an `origin` is provided, it is incorporated into the channel name to scope
	* broadcasts per origin (e.g. `session-info::http%3A%2F%2Flocalhost%3A5173`).
	* The `origin` is currently required only for the browser extension path; non‑browser
	* publishers can pass `undefined` to use the legacy global channel name.
	*/
	sessionInfo: ({ origin }) => origin !== void 0 ? `session-info::${encodeURIComponent(origin)}` : `session-info`,
	devtoolsClientSession: ({ storeId, clientId, sessionId }) => `devtools-channel(client-session-${storeId}-${clientId}-${sessionId})`,
	devtoolsClientLeader: ({ storeId, clientId, sessionId }) => `devtools-channel(client-leader-${storeId}-${clientId}-${sessionId})`
};
var isChannelName = {
	devtoolsClientSession: (channelName, { storeId, clientId, sessionId }) => channelName === makeChannelName.devtoolsClientSession({
		storeId,
		clientId,
		sessionId
	}),
	devtoolsClientLeader: (channelName, { storeId, clientId }) => channelName.startsWith(`devtools-channel(client-leader-${storeId}-${clientId}`)
};
var makeSessionInfoBroadcastChannel$1 = (webmeshNode, options) => webmeshNode.makeBroadcastChannel({
	channelName: makeChannelName.sessionInfo({ origin: options?.origin }),
	schema: Message
});
/**
* Push validation errors returned by {@link LeaderSyncProcessor.push}.
*
* All errors share a common {@link RejectedPushErrorTypeId} so consumers can catch the
* family as a group via {@link isRejectedPushError} instead of matching individual tags.
* Recovery is the same in every case: the client should rebase and retry.
*
* @module
*/
var RejectedPushErrorTypeId = "~@livestore/common/RejectedPushError";
/**
* A pushed batch of events failed validation because its sequence numbers are not strictly increasing.
*
* @remarks
*
* This is a defensive check — callers are expected to construct monotonic event batches.
* The client should rebase and retry.
*/
var NonMonotonicBatchError = class extends Schema_exports.TaggedError(`${RejectedPushErrorTypeId}/NonMonotonicBatchError`)("NonMonotonicBatchError", {
	/** The sequence number that broke the monotonic invariant (i.e. the one that is >= the next). */
	precedingSeqNum: Composite,
	/** The sequence number that was expected to be greater than `precedingSeqNum`. */
	violatingSeqNum: Composite,
	/** The index in the batch where the violation occurred. */
	violationIndex: Schema_exports.Finite,
	/** The session that produced the malformed batch. */
	sessionId: Schema_exports.String
}) {
	[RejectedPushErrorTypeId] = RejectedPushErrorTypeId;
	get message() {
		return `Pushed events' sequence numbers are not strictly increasing at index ${this.violationIndex} (session ${this.sessionId}): ${toString(this.precedingSeqNum)} >= ${toString(this.violatingSeqNum)}`;
	}
};
/** A pushed batch skips an event required to connect it to the leader's admitted push prefix. */
var NonContiguousBatchError = class extends Schema_exports.TaggedError(`${RejectedPushErrorTypeId}/NonContiguousBatchError`)("NonContiguousBatchError", {
	expectedSeqNum: Composite,
	providedSeqNum: Composite,
	expectedParentSeqNum: Composite,
	providedParentSeqNum: Composite,
	violationIndex: Schema_exports.Finite,
	sessionId: Schema_exports.String
}) {
	[RejectedPushErrorTypeId] = RejectedPushErrorTypeId;
	get message() {
		return `Pushed events are not contiguous at index ${this.violationIndex} (session ${this.sessionId}): expected ${toString(this.expectedSeqNum)} after ${toString(this.expectedParentSeqNum)}, got ${toString(this.providedSeqNum)} after ${toString(this.providedParentSeqNum)}`;
	}
};
/**
* A pushed batch of events failed validation because its rebase generation is older than the leader's current rebase generation.
*
* @remarks
*
* This happens when events were enqueued before a backend-pull-triggered rebase incremented the generation.
*/
var StaleRebaseGenerationError = class extends Schema_exports.TaggedError(`${RejectedPushErrorTypeId}/StaleRebaseGenerationError`)("StaleRebaseGenerationError", {
	/** The leader's current rebase generation. */
	currentRebaseGeneration: Schema_exports.Finite,
	/** The rebase generation carried by the dropped events. */
	providedRebaseGeneration: Schema_exports.Finite,
	/** The session that produced the stale batch. */
	sessionId: Schema_exports.String
}) {
	[RejectedPushErrorTypeId] = RejectedPushErrorTypeId;
	get message() {
		return `Pushed events have stale rebase generation (session ${this.sessionId}): expected >= ${this.currentRebaseGeneration}, got ${this.providedRebaseGeneration}`;
	}
};
/**
* A pushed batch of events was rejected because the leader's push head has already advanced
* past the batch's first event.
*
* @remarks
*
* This occurs when another client session (or a backend pull) has pushed events that the current
* session hasn't seen yet.
*/
var LeaderAheadError = class extends Schema_exports.TaggedError(`${RejectedPushErrorTypeId}/LeaderAheadError`)("LeaderAheadError", {
	minimumExpectedNum: Composite,
	providedNum: Composite,
	/** The session that produced the stale batch. */
	sessionId: Schema_exports.String
}) {
	[RejectedPushErrorTypeId] = RejectedPushErrorTypeId;
	get message() {
		return `Leader push head is ahead of batch (session ${this.sessionId}): expected > ${toString(this.minimumExpectedNum)}, got ${toString(this.providedNum)}`;
	}
};
var RejectedPushError = Schema_exports.Union([
	LeaderAheadError,
	NonContiguousBatchError,
	NonMonotonicBatchError,
	StaleRebaseGenerationError
]);
var isRejectedPushError = (u) => hasProperty(u, RejectedPushErrorTypeId);
var EdgeAlreadyExistsError = class extends Schema_exports.TaggedError("~@livestore/webmesh/EdgeAlreadyExistsError")("EdgeAlreadyExistsError", { target: Schema_exports.String }) {};
var packetAsOtelAttributes = (packet) => ({
	packetId: packet.id,
	"span.label": packet.id + (hasProperty(packet, "reqId") === true && packet.reqId !== void 0 ? ` for ${packet.reqId}` : ""),
	...omitUndefineds({ packet: packet._tag !== "DirectChannelResponseSuccess" && packet._tag !== "ProxyChannelPayload" ? packet : void 0 })
});
Schema_exports.Struct({
	channelName: Schema_exports.String,
	source: Schema_exports.String,
	mode: Schema_exports.Literals(["proxy", "direct"])
});
var id = Schema_exports.String.pipe(Schema_exports.withDecodingDefaultType(Effect_exports.sync(() => nanoid(10))), Schema_exports.withConstructorDefault(Effect_exports.sync(() => nanoid(10))));
var defaultPacketFields = {
	id,
	target: Schema_exports.String,
	source: Schema_exports.String,
	channelName: Schema_exports.String,
	hops: Schema_exports.Array(Schema_exports.String)
};
var remainingHopsUndefined = Schema_exports.Undefined.pipe(Schema_exports.optional);
/**
* Needs to go through already existing DirectChannel edges, times out otherwise
*
* Can't yet contain the `port` because the request might be duplicated while forwarding to multiple nodes.
* We need a clear path back to the sender to avoid this, thus we respond with a separate
* `DirectChannelResponseSuccess` which contains the `port`.
*/
var DirectChannelRequest = Schema_exports.TaggedStruct("DirectChannelRequest", {
	...defaultPacketFields,
	remainingHops: Schema_exports.Array(Schema_exports.String).pipe(Schema_exports.optional),
	channelVersion: Schema_exports.Finite,
	/** Only set if the request is in response to an incoming request */
	reqId: Schema_exports.UndefinedOr(Schema_exports.String),
	/**
	* Additionally to the `source` field, we use this field to track whether the instance of a
	* source has changed.
	*/
	sourceId: Schema_exports.String
});
var DirectChannelResponseSuccess = Schema_exports.TaggedStruct("DirectChannelResponseSuccess", {
	...defaultPacketFields,
	reqId: Schema_exports.String,
	port: MessagePort,
	remainingHops: Schema_exports.Array(Schema_exports.String),
	channelVersion: Schema_exports.Finite
});
var DirectChannelResponseNoTransferables = Schema_exports.TaggedStruct("DirectChannelResponseNoTransferables", {
	...defaultPacketFields,
	reqId: Schema_exports.String,
	remainingHops: Schema_exports.Array(Schema_exports.String)
});
var ProxyChannelRequest = Schema_exports.TaggedStruct("ProxyChannelRequest", {
	...defaultPacketFields,
	remainingHops: remainingHopsUndefined,
	channelIdCandidate: Schema_exports.String
});
var ProxyChannelResponseSuccess = Schema_exports.TaggedStruct("ProxyChannelResponseSuccess", {
	...defaultPacketFields,
	reqId: Schema_exports.String,
	remainingHops: Schema_exports.Array(Schema_exports.String),
	combinedChannelId: Schema_exports.String,
	channelIdCandidate: Schema_exports.String
});
var ProxyChannelPayload = Schema_exports.TaggedStruct("ProxyChannelPayload", {
	...defaultPacketFields,
	remainingHops: remainingHopsUndefined,
	payload: Schema_exports.Any,
	combinedChannelId: Schema_exports.String
});
var ProxyChannelPayloadAck = Schema_exports.TaggedStruct("ProxyChannelPayloadAck", {
	...defaultPacketFields,
	reqId: Schema_exports.String,
	remainingHops: Schema_exports.Array(Schema_exports.String),
	combinedChannelId: Schema_exports.String
});
/**
* Broadcast to all nodes when a new edge is added.
* Mostly used for auto-reconnect purposes.
*/
var NetworkEdgeAdded = Schema_exports.TaggedStruct("NetworkEdgeAdded", {
	id,
	source: Schema_exports.String,
	target: Schema_exports.String
});
var NetworkTopologyRequest = Schema_exports.TaggedStruct("NetworkTopologyRequest", {
	id,
	hops: Schema_exports.Array(Schema_exports.String),
	/** Always fixed to who requested the topology */
	source: Schema_exports.String,
	target: Schema_exports.Literal("-")
});
var NetworkTopologyResponse = Schema_exports.TaggedStruct("NetworkTopologyResponse", {
	id,
	reqId: Schema_exports.String,
	remainingHops: Schema_exports.Array(Schema_exports.String),
	nodeName: Schema_exports.String,
	edges: Schema_exports.Array(Schema_exports.String),
	/** Always fixed to who requested the topology */
	source: Schema_exports.String,
	target: Schema_exports.Literal("-")
});
var BroadcastChannelPacket = Schema_exports.TaggedStruct("BroadcastChannelPacket", {
	id,
	channelName: Schema_exports.String,
	/**
	* The payload is expected to be encoded/decoded by the send/listen schema.
	* Transferables are not supported.
	*/
	payload: Schema_exports.Any,
	hops: Schema_exports.Array(Schema_exports.String),
	source: Schema_exports.String,
	target: Schema_exports.Literal("-")
});
var DirectChannelPacket = Schema_exports.Union([
	DirectChannelRequest,
	DirectChannelResponseSuccess,
	DirectChannelResponseNoTransferables
]);
var ProxyChannelPacket = Schema_exports.Union([
	ProxyChannelRequest,
	ProxyChannelResponseSuccess,
	ProxyChannelPayload,
	ProxyChannelPayloadAck
]);
var Packet = Schema_exports.Union([
	DirectChannelPacket,
	ProxyChannelPacket,
	NetworkEdgeAdded,
	NetworkTopologyRequest,
	NetworkTopologyResponse,
	BroadcastChannelPacket
]);
var DirectChannelPing = Schema_exports.TaggedStruct("DirectChannelPing", {});
var DirectChannelPong = Schema_exports.TaggedStruct("DirectChannelPong", {});
var makeDeferredResult = make$6;
/**
* The channel version is important here, as a channel will only be established once both sides have the same version.
* The version is used to avoid concurrency issues where both sides have different incompatible message ports.
*/
var makeDirectChannelInternal = ({ nodeName, incomingPacketsQueue, target, checkTransferableEdges, channelName, schema: schema_, sendPacket, channelVersion, scope, sourceId }) => Effect_exports.gen(function* () {
	const deferred = yield* makeDeferredResult();
	const schema = {
		send: Schema_exports.Union([
			schema_.send,
			DirectChannelPing,
			DirectChannelPong
		]),
		listen: Schema_exports.Union([
			schema_.listen,
			DirectChannelPing,
			DirectChannelPong
		])
	};
	const channelStateRef = { current: { _tag: "Initial" } };
	const processMessagePacket = ({ packet, respondToSender }) => Effect_exports.gen(function* () {
		const channelState = channelStateRef.current;
		yield* spanEvent(`process:${packet._tag}`, {
			channelState: channelState._tag,
			packetId: packet.id,
			packetReqId: packet.reqId,
			...hasProperty("channelVersion")(packet) === true ? { packetChannelVersion: packet.channelVersion } : {}
		});
		if (channelState._tag === "Initial") return shouldNeverHappen();
		if (packet._tag === "DirectChannelResponseNoTransferables") {
			yield* fail$2(deferred, packet);
			return "close";
		}
		if (packet.channelVersion > channelVersion) {
			yield* spanEvent(`incoming packet has higher version (${packet.channelVersion}), closing channel`);
			yield* close(scope, succeed$1("higher-version-expected"));
			return "close";
		}
		if (packet.channelVersion < channelVersion) {
			const newPacket = DirectChannelRequest.make({
				source: nodeName,
				sourceId,
				target,
				channelName,
				channelVersion,
				hops: [],
				remainingHops: packet.hops,
				reqId: void 0
			});
			yield* spanEvent(`incoming packet has lower version (${packet.channelVersion}), sending request to reconnect (${newPacket.id})`);
			yield* sendPacket(newPacket);
			return;
		}
		if (channelState._tag === "Established" && packet._tag === "DirectChannelRequest") {
			if (packet.sourceId === channelState.otherSourceId) return;
			else {
				yield* spanEvent(`force-new-channel`);
				yield* close(scope, succeed$1("force-new-channel"));
				return "close";
			}
		}
		switch (packet._tag) {
			case "DirectChannelRequest":
				if (channelState._tag !== "RequestSent") return;
				if (packet.reqId === channelState.reqPacketId) {} else {
					const newRequestPacket = DirectChannelRequest.make({
						source: nodeName,
						sourceId,
						target,
						channelName,
						channelVersion,
						hops: [],
						remainingHops: packet.hops,
						reqId: packet.id
					});
					yield* spanEvent(`Re-sending new request (${newRequestPacket.id}) for incoming request (${packet.id})`);
					yield* sendPacket(newRequestPacket);
				}
				if (nodeName > target === true) {
					yield* spanEvent(`winner side: creating direct channel and sending response`);
					const mc = new MessageChannel();
					const channel = yield* messagePortChannelWithAck({
						port: mc.port1,
						schema,
						debugId: channelVersion
					}).pipe(Effect_exports.andThen(toOpenChannel));
					yield* respondToSender(DirectChannelResponseSuccess.make({
						reqId: packet.id,
						target,
						source: nodeName,
						channelName: packet.channelName,
						hops: [],
						remainingHops: packet.hops.slice(0, -1),
						port: mc.port2,
						channelVersion
					}));
					channelStateRef.current = {
						_tag: "winner:ResponseSent",
						channel,
						otherSourceId: packet.sourceId
					};
					yield* channel.listen.pipe(Stream_exports.mapEffect(Effect_exports.fromResult), Stream_exports.filter(Schema_exports.is(DirectChannelPing)), Stream_exports.take(1), Stream_exports.runDrain);
					yield* channel.send(DirectChannelPong.make({}));
					yield* spanEvent(`winner side: established`);
					channelStateRef.current = {
						_tag: "Established",
						otherSourceId: packet.sourceId
					};
					yield* succeed$2(deferred, channel);
				} else {
					yield* spanEvent(`loser side: waiting for response`);
					channelStateRef.current = {
						_tag: "loser:WaitingForResponse",
						otherSourceId: packet.sourceId
					};
				}
				return;
			case "DirectChannelResponseSuccess": {
				if (channelState._tag !== "loser:WaitingForResponse") return shouldNeverHappen(`Expected to find direct channel response from ${target}, but was in ${channelState._tag} state`);
				const channel = yield* messagePortChannelWithAck({
					port: packet.port,
					schema,
					debugId: channelVersion
				}).pipe(Effect_exports.andThen(toOpenChannel));
				const waitForPongFiber = yield* channel.listen.pipe(Stream_exports.mapEffect(Effect_exports.fromResult), Stream_exports.filter(Schema_exports.is(DirectChannelPong)), Stream_exports.take(1), Stream_exports.runDrain, Effect_exports.forkChild);
				yield* channel.send(DirectChannelPing.make({})).pipe(Effect_exports.timeout(10), Effect_exports.retry({ times: 2 }));
				yield* join$1(waitForPongFiber);
				yield* spanEvent(`loser side: established`);
				channelStateRef.current = {
					_tag: "Established",
					otherSourceId: channelState.otherSourceId
				};
				yield* succeed$2(deferred, channel);
				return;
			}
			default: return casesHandled(packet);
		}
	}).pipe(Effect_exports.withSpan(`handleMessagePacket:${packet._tag}:${packet.source}→${packet.target}`, { attributes: packetAsOtelAttributes(packet) }));
	const channelState = channelStateRef.current;
	if (channelState._tag !== "Initial") return shouldNeverHappen(`Expected channel to be in Initial state, but was in ${channelState._tag} state`);
	yield* Effect_exports.gen(function* () {
		const packet = DirectChannelRequest.make({
			source: nodeName,
			sourceId,
			target,
			channelName,
			channelVersion,
			hops: [],
			reqId: void 0
		});
		channelStateRef.current = {
			_tag: "RequestSent",
			reqPacketId: packet.id
		};
		const noTransferableResponse = checkTransferableEdges(packet);
		if (noTransferableResponse !== void 0) {
			yield* spanEvent(`No transferable edges found for ${packet.source}→${packet.target}`);
			return yield* Effect_exports.fail(noTransferableResponse);
		}
		yield* sendPacket(packet);
		yield* spanEvent(`initial edge request sent (${packet.id})`);
	});
	yield* Effect_exports.gen(function* () {
		while (true) {
			const packet = yield* take$1(incomingPacketsQueue);
			if ((yield* processMessagePacket(packet)) === "close") return;
		}
	}).pipe(Effect_exports.interruptible, tapCauseLogPretty, Effect_exports.forkScoped);
	return yield* _await(deferred);
}).pipe(Effect_exports.withSpanScoped(`makeDirectChannel:${channelVersion}`));
/**
* Behaviour:
* - Waits until there is an initial edge
* - Automatically reconnects on disconnect
*
* Implementation notes:
* - We've split up the functionality into a wrapper channel and an internal channel.
* - The wrapper channel is responsible for:
*   - Forwarding send/listen messages to the internal channel (via a queue)
*   - Establishing the initial channel and reconnecting on disconnect
*     - Listening for new edges as a hint to reconnect if not already connected
*     - The wrapper channel maintains a edge counter which is used as the channel version
*
* If needed we can also implement further functionality (like heartbeat) in this wrapper channel.
*/
var makeDirectChannel = ({ schema, newEdgeAvailablePubSub, channelName, checkTransferableEdges, nodeName, incomingPacketsQueue, target, sendPacket }) => scopeWithCloseable((scope) => Effect_exports.gen(function* () {
	/** Only used to identify whether a source is the same instance to know when to reconnect */
	const sourceId = nanoid();
	const listenQueue = yield* unbounded();
	const sendQueue = yield* unbounded$1();
	const initialEdgeDeferred = yield* make$6();
	const debugInfo = {
		pendingSends: 0,
		totalSends: 0,
		connectCounter: 0,
		isConnected: false,
		innerChannelRef: { current: void 0 }
	};
	yield* Effect_exports.gen(function* () {
		const resultDeferred = yield* make$6();
		while (true) {
			debugInfo.connectCounter++;
			const channelVersion = debugInfo.connectCounter;
			yield* spanEvent(`Connecting#${channelVersion}`);
			const makeDirectChannelScope = yield* make$5();
			yield* Effect_exports.addFinalizer((ex) => close(makeDirectChannelScope, ex));
			/**
			* Expected concurrency behaviour:
			* - We're concurrently running the edge setup and the waitForNewEdgeFiber
			* - Happy path:
			*   - The edge setup succeeds and we can interrupt the waitForNewEdgeFiber
			* - Tricky paths:
			*   - While a edge is still being setup, we want to re-try when there is a new edge
			*   - If the edge setup returns a `DirectChannelResponseNoTransferables` error,
			*     we want to wait for a new edge and then re-try
			* - Further notes:
			*   - If the parent scope closes, we want to also interrupt both the edge setup and the waitForNewEdgeFiber
			*   - We're creating a separate scope for each edge attempt, which
			*     - we'll use to fork the message channel in which allows us to interrupt it later
			*   - We need to make sure that "interruption" isn't "bubbling out"
			*/
			const waitForNewEdgeFiber = yield* Stream_exports.fromPubSub(newEdgeAvailablePubSub).pipe(Stream_exports.tap((edgeName) => spanEvent(`new-conn:${edgeName}`)), Stream_exports.take(1), Stream_exports.runDrain, Effect_exports.as("new-edge"), Effect_exports.forkChild);
			const makeChannel = makeDirectChannelInternal({
				nodeName,
				sourceId,
				incomingPacketsQueue,
				target,
				checkTransferableEdges,
				channelName,
				schema,
				channelVersion,
				newEdgeAvailablePubSub,
				sendPacket,
				scope: makeDirectChannelScope
			}).pipe(provide(makeDirectChannelScope), Effect_exports.forkIn(makeDirectChannelScope), Effect_exports.provideService(UnhandledLogLevel, void 0));
			const raceResult = yield* Effect_exports.raceFirst(makeChannel, join$1(waitForNewEdgeFiber));
			if (raceResult === "new-edge") yield* close(makeDirectChannelScope, fail$3("new-edge"));
			else {
				const channelExit = yield* await_(raceResult);
				if (channelExit._tag === "Failure") {
					yield* close(makeDirectChannelScope, channelExit);
					if (exists(findErrorOption(channelExit.cause), (error) => Schema_exports.is(DirectChannelResponseNoTransferables)(error)) === true) yield* Effect_exports.exit(join$1(waitForNewEdgeFiber));
				} else {
					const channel = channelExit.value;
					yield* succeed$2(resultDeferred, {
						channel,
						makeDirectChannelScope,
						channelVersion
					});
					break;
				}
			}
		}
		const { channel, makeDirectChannelScope, channelVersion } = yield* _await(resultDeferred);
		yield* spanEvent(`Connected#${channelVersion}`);
		debugInfo.isConnected = true;
		debugInfo.innerChannelRef.current = channel;
		yield* succeed$2(initialEdgeDeferred, void 0);
		yield* channel.listen.pipe(Stream_exports.mapEffect(Effect_exports.fromResult), tapArray((array) => offerAll(listenQueue, array)), Stream_exports.runDrain, tapCauseLogPretty, Effect_exports.forkIn(makeDirectChannelScope));
		yield* Effect_exports.gen(function* () {
			while (true) {
				const [msg, deferred] = yield* peek(sendQueue);
				yield* channel.send(msg);
				yield* succeed$2(deferred, void 0);
				yield* take$2(sendQueue);
			}
		}).pipe(Effect_exports.forkIn(makeDirectChannelScope));
		yield* _await(channel.closedDeferred);
		yield* close(makeDirectChannelScope, succeed$1("channel-closed"));
		yield* spanEvent(`Disconnected#${channelVersion}`);
		debugInfo.isConnected = false;
		debugInfo.innerChannelRef.current = void 0;
	}).pipe(Effect_exports.scoped, Effect_exports.forever, tapCauseLogPretty, Effect_exports.forkScoped);
	const parentSpan = yield* Effect_exports.currentSpan.pipe(Effect_exports.orDie);
	const send = (message) => Effect_exports.gen(function* () {
		const sentDeferred = yield* make$6();
		debugInfo.pendingSends++;
		debugInfo.totalSends++;
		yield* offer(sendQueue, [message, sentDeferred]);
		yield* _await(sentDeferred);
		debugInfo.pendingSends--;
	}).pipe(Effect_exports.scoped, Effect_exports.withParentSpan(parentSpan));
	const listen = Stream_exports.fromQueue(listenQueue).pipe(Stream_exports.rechunk(1), Stream_exports.map(succeed$3));
	const closedDeferred = yield* Effect_exports.acquireRelease(make$6(), done(void_));
	return {
		webChannel: {
			[WebChannelSymbol]: WebChannelSymbol,
			send,
			listen,
			closedDeferred,
			supportsTransferables: true,
			schema,
			debugInfo,
			shutdown: close(scope, succeed$1("shutdown"))
		},
		initialEdgeDeferred
	};
}));
Schema_exports.Struct({ 
/**
* Delays related to receiving and processing payload messages
*/
onPayload: Schema_exports.Struct({
	/** Delay before sending the ACK response (simulates slow ACK send) */
	beforeAckSend: Schema_exports.Int.check(Schema_exports.isBetween({
		minimum: 0,
		maximum: 500
	})),
	/** Delay after forking the ACK send, before adding message to listen queue */
	afterAckFork: Schema_exports.Int.check(Schema_exports.isBetween({
		minimum: 0,
		maximum: 500
	})),
	/** Delay after adding message to listen queue */
	afterListenQueueOffer: Schema_exports.Int.check(Schema_exports.isBetween({
		minimum: 0,
		maximum: 500
	}))
}) });
/** Default simulation params with no delays */
var defaultSimulationParams = { onPayload: {
	beforeAckSend: 0,
	afterAckFork: 0,
	afterListenQueueOffer: 0
} };
var makeProxyChannel = ({ queue, nodeName, newEdgeAvailablePubSub, sendPacket, target, channelName, schema, simulation = defaultSimulationParams }) => scopeWithCloseable((scope) => Effect_exports.gen(function* () {
	/** Helper to inject simulation delays at specific code points */
	const simSleep = (key, key2) => {
		const delay = simulation[key]?.[key2] ?? 0;
		return delay > 0 ? Effect_exports.sleep(delay) : Effect_exports.void;
	};
	const channelStateRef = { current: { _tag: "Initial" } };
	const debugInfo = {
		kind: "proxy-channel",
		pendingSends: 0,
		totalSends: 0,
		connectCounter: 0,
		isConnected: false
	};
	/**
	* We need to unique identify a channel as multiple channels might exist between the same two nodes.
	* We do this by letting each channel end generate a unique id and then combining them in a deterministic way.
	*/
	const channelIdCandidate = nanoid(5);
	yield* Effect_exports.annotateCurrentSpan({ channelIdCandidate });
	const channelSpan = yield* Effect_exports.currentSpan.pipe(Effect_exports.orDie);
	const connectedStateRef = yield* SubscriptionRef_exports.make(false);
	const listenQueue = yield* unbounded();
	const ackMap = /* @__PURE__ */ new Map();
	const waitForEstablished = Effect_exports.gen(function* () {
		return yield* waitUntil(connectedStateRef, (state) => state !== false);
	});
	const setStateToEstablished = (channelId) => Effect_exports.gen(function* () {
		yield* spanEvent(`Connected (${channelId})`).pipe(Effect_exports.withParentSpan(channelSpan));
		channelStateRef.current = {
			_tag: "Established",
			listenSchema: schema.listen,
			listenQueue,
			ackMap,
			combinedChannelId: channelId
		};
		yield* SubscriptionRef_exports.set(connectedStateRef, channelStateRef.current);
		debugInfo.isConnected = true;
	});
	const edgeRequest = Effect_exports.suspend(() => sendPacket(ProxyChannelRequest.make({
		channelName,
		hops: [],
		source: nodeName,
		target,
		channelIdCandidate
	})));
	const getCombinedChannelId = (otherSideChannelIdCandidate) => [channelIdCandidate, otherSideChannelIdCandidate].toSorted().join("_");
	const earlyPayloadBuffer = yield* Effect_exports.acquireRelease(unbounded(), shutdown);
	const processProxyPacket = ({ packet, respondToSender }) => Effect_exports.gen(function* () {
		const channelKey = `target:${packet.source}, channelName:${packet.channelName}`;
		const channelState = channelStateRef.current;
		switch (packet._tag) {
			case "ProxyChannelRequest": {
				const combinedChannelId = getCombinedChannelId(packet.channelIdCandidate);
				if (channelState._tag === "Established") {
					if (channelState.combinedChannelId === combinedChannelId) {} else {
						yield* Effect_exports.logWarning(`[${nodeName}] Received ProxyChannelRequest with different channel ID (${combinedChannelId}) while established with ${channelState.combinedChannelId}. Re-establishing.`);
						yield* SubscriptionRef_exports.set(connectedStateRef, false);
						channelStateRef.current = {
							_tag: "Pending",
							initiatedVia: "incoming-request"
						};
						yield* spanEvent(`Reconnecting (received conflicting ProxyChannelRequest)`).pipe(Effect_exports.withParentSpan(channelSpan));
						debugInfo.isConnected = false;
						debugInfo.connectCounter++;
						yield* edgeRequest;
					}
				} else if (channelState._tag === "Initial") {
					yield* SubscriptionRef_exports.set(connectedStateRef, false);
					channelStateRef.current = {
						_tag: "Pending",
						initiatedVia: "incoming-request"
					};
					yield* spanEvent(`Connecting (received ProxyChannelRequest)`).pipe(Effect_exports.withParentSpan(channelSpan));
					debugInfo.isConnected = false;
					debugInfo.connectCounter++;
				}
				yield* respondToSender(ProxyChannelResponseSuccess.make({
					reqId: packet.id,
					remainingHops: packet.hops,
					hops: [],
					target,
					source: nodeName,
					channelName,
					combinedChannelId,
					channelIdCandidate
				}));
				return;
			}
			case "ProxyChannelResponseSuccess": {
				if (channelState._tag !== "Pending") {
					if (channelState._tag === "Established" && channelState.combinedChannelId !== packet.combinedChannelId) return shouldNeverHappen(`ProxyChannel[${channelKey}]: Expected proxy channel to have the same combinedChannelId as the packet:\n${channelState.combinedChannelId} (channel) === ${packet.combinedChannelId} (packet)`);
					else if (channelState._tag === "Established") return;
					else {
						yield* Effect_exports.logWarning(`[${nodeName}] Ignoring ResponseSuccess ${packet.id} received in unexpected state ${channelState._tag}`);
						return;
					}
				}
				const combinedChannelId = getCombinedChannelId(packet.channelIdCandidate);
				if (combinedChannelId !== packet.combinedChannelId) return yield* Effect_exports.die(`ProxyChannel[${channelKey}]: Expected proxy channel to have the same combinedChannelId as the packet:\n${combinedChannelId} (channel) === ${packet.combinedChannelId} (packet)`);
				yield* setStateToEstablished(packet.combinedChannelId);
				const establishedState = channelStateRef.current;
				if (establishedState._tag === "Established") {
					const bufferedPackets = yield* clear(earlyPayloadBuffer);
					for (const bufferedPacket of bufferedPackets) {
						if (establishedState.combinedChannelId !== bufferedPacket.combinedChannelId) {
							yield* Effect_exports.logWarning(`[${nodeName}] Discarding buffered payload ${bufferedPacket.id}: Combined channel ID mismatch during drain. Expected ${establishedState.combinedChannelId}, got ${bufferedPacket.combinedChannelId}`);
							continue;
						}
						const decodedMessage = yield* Schema_exports.decodeUnknownEffect(establishedState.listenSchema)(bufferedPacket.payload);
						yield* offer$1(establishedState.listenQueue, decodedMessage);
					}
				} else yield* Effect_exports.logError(`[${nodeName}] State is not Established immediately after setStateToEstablished was called. Cannot drain buffer. State: ${establishedState._tag}`);
				return;
			}
			case "ProxyChannelPayload":
				if (channelState._tag === "Established" && channelState.combinedChannelId !== packet.combinedChannelId) return yield* Effect_exports.die(`ProxyChannel[${channelKey}]: Expected proxy channel to have the same combinedChannelId as the packet:\n${channelState.combinedChannelId} (channel) === ${packet.combinedChannelId} (packet)`);
				yield* Effect_exports.gen(function* () {
					yield* simSleep("onPayload", "beforeAckSend");
					yield* respondToSender(ProxyChannelPayloadAck.make({
						reqId: packet.id,
						remainingHops: packet.hops,
						hops: [],
						target,
						source: nodeName,
						channelName,
						combinedChannelId: channelState._tag === "Established" ? channelState.combinedChannelId : packet.combinedChannelId
					}));
				}).pipe(tapCauseLogPretty, Effect_exports.forkScoped);
				yield* simSleep("onPayload", "afterAckFork");
				if (channelState._tag === "Established") {
					const decodedMessage = yield* Schema_exports.decodeUnknownEffect(channelState.listenSchema)(packet.payload);
					yield* offer$1(channelState.listenQueue, decodedMessage);
					yield* simSleep("onPayload", "afterListenQueueOffer");
				} else yield* offer$1(earlyPayloadBuffer, packet);
				return;
			case "ProxyChannelPayloadAck": {
				if (channelState._tag !== "Established") {
					yield* spanEvent(`Not yet connected to ${target}. dropping message`);
					yield* Effect_exports.logWarning(`[${nodeName}] Received Ack but not established (State: ${channelState._tag}). Dropping Ack for ${packet.reqId}`);
					return;
				}
				const ack = channelState.ackMap.get(packet.reqId);
				if (ack === void 0) {
					yield* Effect_exports.logDebug(`Received ACK for unknown reqId: ${packet.reqId} (may be synthetic or duplicate)`);
					return;
				}
				yield* succeed$2(ack, void 0);
				channelState.ackMap.delete(packet.reqId);
				return;
			}
			default: return casesHandled(packet);
		}
	}).pipe(Effect_exports.withSpan(`handleProxyPacket:${packet._tag}:${packet.source}->${packet.target}`, { attributes: packetAsOtelAttributes(packet) }));
	yield* spanEvent(`Connecting`);
	{
		if (channelStateRef.current._tag !== "Initial") return shouldNeverHappen("Expected proxy channel to be Initial");
		channelStateRef.current = {
			_tag: "Pending",
			initiatedVia: "outgoing-request"
		};
		yield* edgeRequest;
		const retryOnNewEdgeFiber = yield* Stream_exports.fromPubSub(newEdgeAvailablePubSub).pipe(Stream_exports.tap(() => edgeRequest), Stream_exports.runDrain, Effect_exports.forkScoped);
		yield* Stream_exports.fromQueue(queue).pipe(Stream_exports.tap(processProxyPacket), Stream_exports.runDrain, tapCauseLogPretty, Effect_exports.forkScoped);
		const { combinedChannelId: channelId } = yield* waitForEstablished;
		yield* interrupt(retryOnNewEdgeFiber);
		yield* setStateToEstablished(channelId);
	}
	const send = (message) => Effect_exports.gen(function* () {
		const payload = yield* Schema_exports.encodeUnknownEffect(schema.send)(message);
		const sendFiberHandle = yield* make$8();
		const sentDeferred = yield* make$6();
		debugInfo.pendingSends++;
		debugInfo.totalSends++;
		const trySend = Effect_exports.gen(function* () {
			const { combinedChannelId } = yield* waitUntil(connectedStateRef, (channel) => channel !== false);
			yield* Effect_exports.gen(function* () {
				const ack = yield* make$6();
				const packet = ProxyChannelPayload.make({
					channelName,
					payload,
					hops: [],
					source: nodeName,
					target,
					combinedChannelId
				});
				ackMap.set(packet.id, ack);
				yield* sendPacket(packet);
				yield* _await(ack);
				yield* succeed$2(sentDeferred, void 0);
				debugInfo.pendingSends--;
			}).pipe(Effect_exports.timeout(100), Effect_exports.retry(Schedule_exports.exponential(10)), Effect_exports.orDie);
		}).pipe(Effect_exports.tapCause(Effect_exports.logError));
		const rerunOnNewChannelFiber = yield* SubscriptionRef_exports.changes(connectedStateRef).pipe(Stream_exports.filter((_) => _ === false), Stream_exports.tap(() => run(sendFiberHandle, trySend)), Stream_exports.runDrain, Effect_exports.forkChild);
		yield* run(sendFiberHandle, trySend);
		yield* _await(sentDeferred);
		yield* interrupt(rerunOnNewChannelFiber);
	}).pipe(Effect_exports.scoped, Effect_exports.withSpan(`sendAckWithRetry:ProxyChannelPayload`), Effect_exports.withParentSpan(channelSpan));
	const listen = Stream_exports.fromQueue(listenQueue).pipe(Stream_exports.map(succeed$3));
	const closedDeferred = yield* Effect_exports.acquireRelease(make$6(), done(void_));
	const services = yield* Effect_exports.context();
	return {
		[WebChannelSymbol]: WebChannelSymbol,
		send,
		listen,
		closedDeferred,
		supportsTransferables: false,
		schema,
		shutdown: close(scope, void_),
		debugInfo,
		debug: { ping: (message = "ping") => send(DebugPingMessage.make({ message })).pipe(Effect_exports.provide(services), tapCauseLogPretty, Effect_exports.runFork) }
	};
}).pipe(Effect_exports.withSpanScoped("makeProxyChannel")));
/**
* A set of values that expire after a given timeout
* The timeout cleanup is performed in a batched way to avoid excessive setTimeout calls
*/
var TimeoutSet = class TimeoutSet {
	values = /* @__PURE__ */ new Map();
	timeoutHandle;
	timeoutMs;
	constructor({ timeout }) {
		this.timeoutMs = toMillis(timeout);
	}
	static make = (timeout) => Effect_exports.gen(function* () {
		const timeoutSet = new TimeoutSet({ timeout });
		yield* Effect_exports.addFinalizer(() => Effect_exports.sync(() => timeoutSet.onShutdown()));
		return timeoutSet;
	});
	add(value) {
		this.values.set(value, Date.now());
		this.scheduleCleanup();
	}
	has(value) {
		return this.values.has(value);
	}
	delete(value) {
		this.values.delete(value);
	}
	scheduleCleanup() {
		if (this.timeoutHandle === void 0) this.timeoutHandle = setTimeout(() => {
			this.cleanup();
			this.timeoutHandle = void 0;
		}, this.timeoutMs);
	}
	cleanup() {
		const now = Date.now();
		for (const [value, timestamp] of this.values.entries()) if (now - timestamp >= this.timeoutMs) this.values.delete(value);
	}
	onShutdown = () => clearTimeout(this.timeoutHandle);
};
var makeMeshNode = (nodeName) => Effect_exports.gen(function* () {
	const edgeChannels = /* @__PURE__ */ new Map();
	const handledPacketIds = yield* TimeoutSet.make(minutes(1));
	const newEdgeAvailablePubSub = yield* Effect_exports.acquireRelease(unbounded$2(), shutdown$1);
	const channelMap = /* @__PURE__ */ new Map();
	const channelRequestsQueue = yield* Effect_exports.acquireRelease(unbounded(), shutdown);
	const topologyRequestsMap = /* @__PURE__ */ new Map();
	const broadcastChannelListenQueueMap = /* @__PURE__ */ new Map();
	const checkTransferableEdges = (packet) => {
		if (packet._tag === "DirectChannelRequest" && (edgeChannels.size === 0 || edgeChannels.get(packet.target)?.channel.supportsTransferables === false) || [...edgeChannels.values()].some((c) => c.channel.supportsTransferables) === false) return DirectChannelResponseNoTransferables.make({
			reqId: packet.id,
			channelName: packet.channelName,
			source: packet.target,
			target: packet.source,
			remainingHops: packet.hops,
			hops: []
		});
	};
	const sendPacket = (packet) => Effect_exports.gen(function* () {
		if (Schema_exports.is(NetworkEdgeAdded)(packet) === true) {
			yield* spanEvent("NetworkEdgeAdded", {
				packet,
				nodeName
			});
			yield* publish(newEdgeAvailablePubSub, packet.target);
			const edgesToForwardTo = Array.from(edgeChannels).filter(([name]) => name !== packet.source).map(([_, con]) => con.channel);
			yield* Effect_exports.forEach(edgesToForwardTo, (con) => con.send(packet), { concurrency: "unbounded" });
			return;
		}
		if (Schema_exports.is(BroadcastChannelPacket)(packet) === true) {
			const edgesToForwardTo = Array.from(edgeChannels).filter(([name]) => !packet.hops.includes(name)).map(([_, con]) => con.channel);
			const adjustedPacket = {
				...packet,
				hops: [...packet.hops, nodeName]
			};
			yield* Effect_exports.forEach(edgesToForwardTo, (con) => con.send(adjustedPacket), { concurrency: "unbounded" });
			if (packet.source === nodeName) return;
			const queue = broadcastChannelListenQueueMap.get(packet.channelName);
			if (queue !== void 0) yield* offer$1(queue, packet);
			return;
		}
		if (Schema_exports.is(NetworkTopologyRequest)(packet) === true) {
			if (packet.source !== nodeName) {
				const backEdgeName = packet.hops.at(-1) ?? shouldNeverHappen(`${nodeName}: Expected hops for packet`, packet);
				const backEdgeChannel = edgeChannels.get(backEdgeName).channel;
				const response = NetworkTopologyResponse.make({
					reqId: packet.id,
					source: packet.source,
					target: packet.target,
					remainingHops: packet.hops.slice(0, -1),
					nodeName,
					edges: Array.from(edgeChannels.keys())
				});
				yield* backEdgeChannel.send(response);
			}
			const edgesToForwardTo = Array.from(edgeChannels).filter(([name]) => !packet.hops.includes(name)).map(([_, con]) => con.channel);
			const adjustedPacket = {
				...packet,
				hops: [...packet.hops, nodeName]
			};
			yield* Effect_exports.forEach(edgesToForwardTo, (con) => con.send(adjustedPacket), { concurrency: "unbounded" });
			return;
		}
		if (Schema_exports.is(NetworkTopologyResponse)(packet) === true) {
			if (packet.source === nodeName) topologyRequestsMap.get(packet.reqId).set(packet.nodeName, new Set(packet.edges));
			else {
				const routeBack = packet.remainingHops.at(-1) ?? shouldNeverHappen(`${nodeName}: Expected remaining hops for packet`, packet);
				yield* (edgeChannels.get(routeBack)?.channel ?? shouldNeverHappen(`${nodeName}: Expected edge channel (${routeBack}) for packet`, packet, "Available edges:", Array.from(edgeChannels.keys()))).send({
					...packet,
					remainingHops: packet.remainingHops.slice(0, -1)
				});
			}
			return;
		}
		if (edgeChannels.has(packet.target) === true) {
			const edgeChannel = edgeChannels.get(packet.target).channel;
			const hops = packet.source === nodeName ? [] : [...packet.hops, nodeName];
			yield* Effect_exports.annotateCurrentSpan({ hasDirectEdge: true });
			yield* edgeChannel.send({
				...packet,
				hops
			});
		} else if (packet.remainingHops !== void 0) {
			const hopTarget = packet.remainingHops.at(-1) ?? shouldNeverHappen(`${nodeName}: Expected remaining hops for packet`, packet);
			const edgeChannel = edgeChannels.get(hopTarget)?.channel;
			if (edgeChannel === void 0) {
				yield* Effect_exports.logWarning(`${nodeName}: Expected to find hop target ${hopTarget} in edges. Dropping packet.`, packet);
				return;
			}
			yield* edgeChannel.send({
				...packet,
				remainingHops: packet.remainingHops.slice(0, -1),
				hops: [...packet.hops, nodeName]
			});
		} else {
			const hops = packet.source === nodeName ? [] : [...packet.hops, nodeName];
			const edgesToForwardTo = Array.from(edgeChannels).filter(([name]) => name !== packet.source).map(([name, con]) => ({
				name,
				channel: con.channel
			}));
			if (hops.length === 0 && edgesToForwardTo.length === 0 && LS_DEV === true) yield* Effect_exports.logWarning(nodeName, "no route found to", packet.target, packet._tag, "TODO handle better");
			const packetToSend = {
				...packet,
				hops
			};
			yield* Effect_exports.annotateCurrentSpan({ edgesToForwardTo: edgesToForwardTo.map(({ name }) => name) });
			yield* Effect_exports.forEach(edgesToForwardTo, ({ channel }) => channel.send(packetToSend), { concurrency: "unbounded" });
		}
	}).pipe(Effect_exports.withSpan(`sendPacket:${packet._tag}:${packet.source}→${packet.target}`, { attributes: packetAsOtelAttributes(packet) }), Effect_exports.orDie);
	const addEdge = ({ target: targetNodeName, edgeChannel, replaceIfExists = false }) => Effect_exports.gen(function* () {
		if (edgeChannels.has(targetNodeName) === true) {
			if (replaceIfExists === true) yield* removeEdge(targetNodeName).pipe(Effect_exports.orDie);
			else return yield* new EdgeAlreadyExistsError({ target: targetNodeName });
		}
		const listenFiber = yield* edgeChannel.listen.pipe(Stream_exports.mapEffect(Effect_exports.fromResult), Stream_exports.tap((message) => Effect_exports.gen(function* () {
			const packet = yield* Schema_exports.decodeUnknownEffect(Packet)(message);
			if (handledPacketIds.has(packet.id) === true) return;
			handledPacketIds.add(packet.id);
			switch (packet._tag) {
				case "NetworkEdgeAdded":
				case "NetworkTopologyRequest":
				case "NetworkTopologyResponse":
					yield* sendPacket(packet);
					break;
				default: if (packet.target === nodeName) {
					const channelKey = `target:${packet.source}, channelName:${packet.channelName}`;
					if (channelMap.has(channelKey) === false) {
						const channelQueue = yield* Effect_exports.acquireRelease(unbounded(), shutdown);
						channelMap.set(channelKey, {
							queue: channelQueue,
							debugInfo: void 0
						});
					}
					const channelQueue = channelMap.get(channelKey).queue;
					const respondToSender = (outgoingPacket) => edgeChannel.send(outgoingPacket).pipe(Effect_exports.withSpan(`respondToSender:${outgoingPacket._tag}:${outgoingPacket.source}→${outgoingPacket.target}`, { attributes: packetAsOtelAttributes(outgoingPacket) }), Effect_exports.orDie);
					if (Schema_exports.is(ProxyChannelPacket)(packet) === true) yield* offer$1(channelQueue, {
						packet,
						respondToSender
					});
					else if (Schema_exports.is(DirectChannelPacket)(packet) === true) yield* offer$1(channelQueue, {
						packet,
						respondToSender
					});
					if (packet._tag === "ProxyChannelRequest" || packet._tag === "DirectChannelRequest") yield* offer$1(channelRequestsQueue, {
						channelName: packet.channelName,
						source: packet.source,
						mode: packet._tag === "ProxyChannelRequest" ? "proxy" : "direct"
					});
				} else {
					if (Schema_exports.is(DirectChannelPacket)(packet) === true) {
						const noTransferableResponse = checkTransferableEdges(packet);
						if (noTransferableResponse !== void 0) {
							yield* spanEvent(`No transferable edges found for ${packet.source}→${packet.target}`);
							return yield* edgeChannel.send(noTransferableResponse).pipe(Effect_exports.withSpan(`sendNoTransferableResponse:${packet.source}→${packet.target}`, { attributes: packetAsOtelAttributes(noTransferableResponse) }));
						}
					}
					yield* sendPacket(packet);
				}
			}
		})), Stream_exports.runDrain, Effect_exports.interruptible, Effect_exports.orDie, tapCauseLogPretty, Effect_exports.forkScoped);
		edgeChannels.set(targetNodeName, {
			channel: edgeChannel,
			listenFiber
		});
		const edgeAddedPacket = NetworkEdgeAdded.make({
			source: nodeName,
			target: targetNodeName
		});
		yield* sendPacket(edgeAddedPacket).pipe(Effect_exports.orDie);
	}).pipe(Effect_exports.annotateLogs({
		"addEdge:target": targetNodeName,
		nodeName
	}), Effect_exports.withSpan(`addEdge:${nodeName}→${targetNodeName}`, { attributes: { supportsTransferables: edgeChannel.supportsTransferables } }));
	const removeEdge = (targetNodeName) => Effect_exports.gen(function* () {
		if (edgeChannels.has(targetNodeName) === false) return yield* new NoSuchElementError(`No edge found for ${targetNodeName}`);
		yield* interrupt(edgeChannels.get(targetNodeName).listenFiber);
		edgeChannels.delete(targetNodeName);
	});
	const hasChannel = ({ target, channelName }) => Effect_exports.sync(() => channelMap.has(`target:${target}, channelName:${channelName}`));
	const makeChannel = ({ target, channelName, schema: inputSchema, mode, timeout = seconds(1), closeExisting = false, simulation }) => Effect_exports.gen(function* () {
		const schema = mapSchema(inputSchema);
		const channelKey = `target:${target}, channelName:${channelName}`;
		if (channelMap.has(channelKey) === true) {
			const existingChannel = channelMap.get(channelKey).debugInfo?.channel;
			if (existingChannel !== void 0) {
				if (closeExisting === true) {
					yield* existingChannel.shutdown;
					channelMap.delete(channelKey);
				} else shouldNeverHappen(`Channel ${channelKey} already exists`, existingChannel);
			}
		}
		if (channelMap.has(channelKey) === false) {
			const channelQueue = yield* Effect_exports.acquireRelease(unbounded(), shutdown);
			channelMap.set(channelKey, {
				queue: channelQueue,
				debugInfo: void 0
			});
		}
		const channelQueue = channelMap.get(channelKey).queue;
		yield* Effect_exports.addFinalizer(() => Effect_exports.sync(() => channelMap.delete(channelKey)));
		if (mode === "direct") {
			const incomingPacketsQueue = yield* Effect_exports.acquireRelease(unbounded(), shutdown);
			yield* takeBetween(channelQueue, 1, 10).pipe(Effect_exports.tap((_) => offerAll(incomingPacketsQueue, _)), Effect_exports.forever, Effect_exports.interruptible, tapCauseLogPretty, Effect_exports.forkScoped);
			const { webChannel, initialEdgeDeferred } = yield* makeDirectChannel({
				nodeName,
				incomingPacketsQueue,
				newEdgeAvailablePubSub,
				target,
				channelName,
				schema,
				sendPacket,
				checkTransferableEdges
			});
			channelMap.set(channelKey, {
				queue: channelQueue,
				debugInfo: {
					channel: webChannel,
					target
				}
			});
			yield* _await(initialEdgeDeferred);
			return webChannel;
		} else {
			const channel = yield* makeProxyChannel({
				nodeName,
				newEdgeAvailablePubSub,
				target,
				channelName,
				schema,
				queue: channelQueue,
				sendPacket,
				...simulation !== void 0 ? { simulation } : {}
			});
			channelMap.set(channelKey, {
				queue: channelQueue,
				debugInfo: {
					channel,
					target
				}
			});
			return channel;
		}
	}).pipe(Effect_exports.withSpanScoped(`makeChannel:${nodeName}→${target}(${channelName})`, { attributes: {
		target,
		channelName,
		mode,
		timeout
	} }), Effect_exports.annotateLogs({
		nodeName,
		target,
		channelName
	}));
	let listenAlreadyStarted = false;
	const listenForChannel = Stream_exports.suspend(() => {
		if (listenAlreadyStarted === true) return shouldNeverHappen("listenForChannel already started");
		listenAlreadyStarted = true;
		const hash = (res) => `${res.channelName}:${res.source}:${res.mode}`;
		const seen = /* @__PURE__ */ new Set();
		return Stream_exports.fromQueue(channelRequestsQueue).pipe(Stream_exports.filter((res) => {
			const hashed = hash(res);
			if (seen.has(hashed) === true) return false;
			seen.add(hashed);
			return true;
		}));
	});
	const makeBroadcastChannel = ({ channelName, schema }) => scopeWithCloseable((scope) => Effect_exports.gen(function* () {
		if (broadcastChannelListenQueueMap.has(channelName) === true) return shouldNeverHappen(`Broadcast channel ${channelName} already exists`, broadcastChannelListenQueueMap.get(channelName));
		const debugInfo = {};
		const queue = yield* Effect_exports.acquireRelease(unbounded(), shutdown);
		broadcastChannelListenQueueMap.set(channelName, queue);
		const send = (message) => Effect_exports.gen(function* () {
			const payload = yield* Schema_exports.encodeEffect(schema)(message);
			const packet = BroadcastChannelPacket.make({
				channelName,
				payload,
				source: nodeName,
				target: "-",
				hops: []
			});
			yield* sendPacket(packet);
		});
		const listen = Stream_exports.fromQueue(queue).pipe(Stream_exports.filter(Schema_exports.is(BroadcastChannelPacket)), Stream_exports.map((_) => Schema_exports.decodeResult(schema)(_.payload)));
		const closedDeferred = yield* Effect_exports.acquireRelease(make$6(), done(void_));
		return {
			[WebChannelSymbol]: WebChannelSymbol,
			send,
			listen,
			closedDeferred,
			supportsTransferables: false,
			schema: {
				listen: schema,
				send: schema
			},
			shutdown: close(scope, void_),
			debugInfo
		};
	}));
	const edgeKeys = Effect_exports.sync(() => new Set(edgeChannels.keys()));
	const services = yield* Effect_exports.context();
	return {
		nodeName,
		addEdge,
		removeEdge,
		hasChannel,
		makeChannel,
		listenForChannel,
		makeBroadcastChannel,
		edgeKeys,
		debug: {
			print: () => {
				console.log("Webmesh debug info for node:", nodeName);
				console.log("Edges:", edgeChannels.size);
				for (const [key, value] of edgeChannels) console.log(`  ${key}: supportsTransferables=${value.channel.supportsTransferables}`);
				console.log("Channels:", channelMap.size);
				for (const [key, value] of channelMap) console.log(indent(key, 2), "\n", Object.entries({
					target: value.debugInfo?.target,
					supportsTransferables: value.debugInfo?.channel.supportsTransferables,
					...value.debugInfo?.channel.debugInfo
				}).map(([key, value]) => indent(`${key}=${String(value)}`, 4)).join("\n"), "    ", value.debugInfo?.channel, "\n", indent(`Queue: ${sizeUnsafe(value.queue)}`, 4), value.queue);
				console.log("Broadcast channels:", broadcastChannelListenQueueMap.size);
				for (const [key, _value] of broadcastChannelListenQueueMap) console.log(indent(key, 2));
			},
			ping: (payload) => {
				Effect_exports.gen(function* () {
					const msg = (via) => DebugPingMessage.make({
						message: `ping from ${nodeName} via ${via}`,
						payload
					});
					for (const [channelName, con] of edgeChannels) {
						yield* Effect_exports.logDebug(`sending ping via edge ${channelName}`);
						yield* con.channel.send(msg(`edge ${channelName}`));
					}
					for (const [channelKey, channel] of channelMap) {
						if (channel.debugInfo === void 0) {
							yield* Effect_exports.logDebug(`channel ${channelKey} has no debug info`);
							continue;
						}
						yield* Effect_exports.logDebug(`sending ping via channel ${channelKey}`);
						yield* channel.debugInfo.channel.send(msg(`channel ${channelKey}`));
					}
				}).pipe(Effect_exports.provide(services), tapCauseLogPretty, Effect_exports.runFork);
			},
			requestTopology: (timeoutMs = 1e3) => Effect_exports.gen(function* () {
				const packet = NetworkTopologyRequest.make({
					source: nodeName,
					target: "-",
					hops: []
				});
				const item = /* @__PURE__ */ new Map();
				item.set(nodeName, new Set(edgeChannels.keys()));
				topologyRequestsMap.set(packet.id, item);
				yield* sendPacket(packet);
				yield* Effect_exports.logDebug(`Waiting ${timeoutMs}ms for topology response`);
				yield* Effect_exports.sleep(timeoutMs);
				yield* Effect_exports.logDebug(`Topology response (from ${nodeName}):`);
				for (const [key, value] of item) yield* Effect_exports.logDebug(`  node '${key}' has edge to: ${Array.from(value.values()).join(", ")}`);
			}).pipe(Effect_exports.provide(services), tapCauseLogPretty, Effect_exports.runPromise)
		}
	};
}).pipe(Effect_exports.withSpan(`makeMeshNode:${nodeName}`), Effect_exports.annotateLogs({ "makeMeshNode.nodeName": nodeName }));
/**
* Current LiveStore package version used for display, release assets, and install guidance.
*
* Can be overridden at runtime via `globalThis.__LIVESTORE_VERSION_OVERRIDE__` for testing display-only version values.
*/
var liveStoreVersion = globalThis.__LIVESTORE_VERSION_OVERRIDE__ ?? {
	name: "@livestore/common",
	version: "0.5.0-dev.0",
	license: "Apache-2.0",
	repository: {
		"type": "git",
		"url": "git+https://github.com/livestorejs/livestore.git"
	},
	files: [
		"dist",
		"package.json",
		"src"
	],
	type: "module",
	sideEffects: false,
	exports: {
		".": "./dist/index.js",
		"./sql-queries": "./dist/sql-queries/index.js",
		"./leader-thread": "./dist/leader-thread/mod.js",
		"./schema": "./dist/schema/mod.js",
		"./sync": "./dist/sync/index.js",
		"./sync/next": "./dist/sync/next/mod.js",
		"./sync/next/test": "./dist/sync/next/test/mod.js",
		"./testing": "./dist/testing/mod.js"
	},
	publishConfig: { "access": "public" },
	dependencies: {
		"@opentelemetry/api": "1.9.0",
		"@livestore/utils": "^0.5.0-dev.0",
		"@livestore/webmesh": "^0.5.0-dev.0"
	},
	devDependencies: {
		"@effect/opentelemetry": "4.0.0-rc.111",
		"@effect/platform-browser": "4.0.0-rc.111",
		"@effect/platform-bun": "4.0.0-rc.111",
		"@effect/platform-node": "4.0.0-rc.111",
		"@effect/platform-node-shared": "4.0.0-rc.111",
		"@effect/vitest": "4.0.0-rc.111",
		"@opentelemetry/api": "1.9.0",
		"@opentelemetry/resources": "2.2.0",
		"@standard-schema/spec": "1.1.0",
		"effect": "4.0.0-rc.111",
		"vitest": "4.1.9",
		"@livestore/utils-dev": "^0.5.0-dev.0"
	},
	peerDependencies: {
		"@effect/opentelemetry": "^4.0.0-rc.111",
		"@effect/platform-browser": "^4.0.0-rc.111",
		"@effect/platform-bun": "^4.0.0-rc.111",
		"@effect/platform-node": "^4.0.0-rc.111",
		"@effect/platform-node-shared": "^4.0.0-rc.111",
		"@effect/vitest": "^4.0.0-rc.111",
		"@opentelemetry/api": "^1.9.0",
		"@opentelemetry/resources": "^2.2.0",
		"@standard-schema/spec": "^1.1.0",
		"effect": "^4.0.0-rc.111"
	},
	$genie: {
		"source": "package.json.genie.ts",
		"warning": "DO NOT EDIT - changes will be overwritten",
		"workspaceClosureDirs": [
			"packages/@livestore/common",
			"packages/@livestore/utils",
			"packages/@livestore/utils-dev",
			"packages/@livestore/webmesh"
		]
	},
	scripts: { "test": "vitest" }
}.version;
var devtoolsProtocolVersion = globalThis.__LIVESTORE_DEVTOOLS_PROTOCOL_VERSION_OVERRIDE__ ?? 1;
var supportedDevtoolsProtocolVersions = [devtoolsProtocolVersion];
var resolveDevtoolsProtocolVersion = (version) => version ?? 1;
var isDevtoolsProtocolVersionSupported = (version, supportedVersions = supportedDevtoolsProtocolVersions) => supportedVersions.includes(resolveDevtoolsProtocolVersion(version));
var makeClientSession = ({ storeId, clientId, sessionId, isLeader, devtoolsEnabled, connectDevtoolsToStore, lockStatus, leaderThread, schema, sqliteDb, shutdown, connectWebmeshNode, webmeshMode, registerBeforeUnload, debugInstanceId, origin }) => Effect_exports.gen(function* () {
	const devtools = devtoolsEnabled === true ? {
		enabled: true,
		pullLatch: yield* make$9(true),
		pushLatch: yield* make$9(true)
	} : { enabled: false };
	if (devtoolsEnabled === true) yield* Effect_exports.gen(function* () {
		const webmeshNode = yield* makeMeshNode(makeNodeName.client.session({
			storeId,
			clientId,
			sessionId
		}));
		globalThis.__debugWebmeshNode = webmeshNode;
		const schemaAlias = schema.devtools.alias;
		const sessionInfo = SessionInfo.make({
			storeId,
			clientId,
			sessionId,
			schemaAlias,
			isLeader,
			origin
		});
		yield* connectWebmeshNode({
			webmeshNode,
			sessionInfo
		});
		yield* provideSessionInfo({
			webChannel: yield* makeSessionInfoBroadcastChannel$1(webmeshNode, { origin }),
			sessionInfo
		}).pipe(tapCauseLogPretty, Effect_exports.forkScoped);
		yield* webmeshNode.listenForChannel.pipe(Stream_exports.filter((res) => isChannelName.devtoolsClientSession(res.channelName, {
			storeId,
			clientId,
			sessionId
		}) && res.mode === webmeshMode), Stream_exports.tap(Effect_exports.fnUntraced(function* ({ channelName, source }) {
			const clientSessionDevtoolsChannel = yield* webmeshNode.makeChannel({
				target: source,
				channelName,
				schema: {
					listen: MessageToApp$1,
					send: MessageFromApp$1
				},
				mode: webmeshMode
			});
			const sendDisconnect = clientSessionDevtoolsChannel.send(Disconnect$1.make({
				clientId,
				liveStoreVersion,
				sessionId
			})).pipe(Effect_exports.orDie);
			yield* Effect_exports.addFinalizer(() => sendDisconnect);
			yield* Effect_exports.acquireRelease(Effect_exports.sync(() => registerBeforeUnload(() => sendDisconnect.pipe(Effect_exports.runFork))), (unsub) => Effect_exports.sync(() => unsub()));
			yield* connectDevtoolsToStore(clientSessionDevtoolsChannel);
		}, tapCauseLogPretty, Effect_exports.forkScoped())), Stream_exports.runDrain);
	}).pipe(Effect_exports.withSpan("@livestore/common:make-client-session:devtools"), tapCauseLogPretty, Effect_exports.forkScoped);
	return {
		sqliteDb,
		leaderThread,
		devtools,
		lockStatus,
		clientId,
		sessionId,
		shutdown,
		debugInstanceId
	};
}).pipe(Effect_exports.withSpan("@livestore/common:make-client-session"));
var configureConnection = (sqliteDb, { foreignKeys, lockingMode }) => execSql(sqliteDb, sql`
    -- disable WAL until we have it working properly
    -- PRAGMA journal_mode=WAL;
    PRAGMA page_size=8192;
    PRAGMA foreign_keys=${foreignKeys === true ? "ON" : "OFF"};
    ${lockingMode === void 0 ? "" : sql`PRAGMA locking_mode=${lockingMode};`}
  `, {});
var execSql = (sqliteDb, sql, bind) => {
	const bindValues = prepareBindValues(bind, sql);
	return Effect_exports.try({
		try: () => sqliteDb.execute(sql, bindValues),
		catch: (cause) => new SqliteError({
			cause,
			query: {
				bindValues,
				sql
			},
			code: cause.code
		})
	}).pipe(Effect_exports.asVoid, Effect_exports.withSpan(`@livestore/common:execSql`, { attributes: {
		"span.label": sql,
		sql,
		bindValueKeys: Object.keys(bindValues)
	} }));
};
var selectSql = (sqliteDb, sql, bind) => {
	const bindValues = prepareBindValues(bind, sql);
	return Effect_exports.try({
		try: () => sqliteDb.select(sql, bindValues),
		catch: (cause) => new SqliteError({
			cause,
			query: {
				bindValues,
				sql
			},
			code: cause.code
		})
	}).pipe(Effect_exports.withSpan(`@livestore/common:selectSql`, { attributes: {
		"span.label": sql,
		sql,
		bindValueKeys: Object.keys(bindValues)
	} }));
};
var execSqlPrepared = (sqliteDb, sql, bindValues) => {
	return Effect_exports.try({
		try: () => sqliteDb.execute(sql, bindValues),
		catch: (cause) => new SqliteError({
			cause,
			query: {
				bindValues,
				sql
			},
			code: cause.code
		})
	}).pipe(Effect_exports.asVoid, Effect_exports.withSpan(`@livestore/common:execSqlPrepared`, { attributes: {
		"span.label": sql,
		sql,
		bindValueKeys: Object.keys(bindValues)
	} }));
};
var isValidWhereOp = (op) => {
	return [
		">",
		"<",
		"="
	].includes(op);
};
var findManyRows = ({ columns, tableName, where, limit }) => {
	const whereSql = buildWhereSql({ where });
	const whereModifier = whereSql === "" ? "" : `WHERE ${whereSql}`;
	const limitModifier = limit !== void 0 ? `LIMIT ${limit}` : "";
	const whereBindValues = makeBindValues({
		columns,
		values: where,
		variablePrefix: "where_",
		skipNil: true
	});
	return [sql`SELECT * FROM ${tableName} ${whereModifier} ${limitModifier}`, whereBindValues];
};
var insertRow = ({ tableName, columns, values, options = { orReplace: false } }) => {
	return [insertRowPrepared({
		tableName,
		columns,
		options: {
			orReplace: options?.orReplace,
			keys: Object.keys(values)
		}
	}), makeBindValues({
		columns,
		values
	})];
};
var insertRowPrepared = ({ tableName, columns, options = { orReplace: false } }) => {
	const keys = options?.keys ?? Object.keys(columns);
	const keysStr = keys.join(", ");
	const valuesStr = keys.map((key) => `$${key}`).join(", ");
	return sql`INSERT ${options.orReplace === true ? "OR REPLACE " : ""}INTO ${tableName} (${keysStr}) VALUES (${valuesStr})`;
};
var updateRows = ({ columns, tableName, updateValues: updateValues_, where }) => {
	const updateValues = filterUndefinedFields(updateValues_);
	if (Object.keys(updateValues).length === 0) return [sql`select 1`, {}];
	const updateValueStr = Object.keys(updateValues).map((columnName) => `${columnName} = $update_${columnName}`).join(", ");
	const bindValues = {
		...makeBindValues({
			columns,
			values: updateValues,
			variablePrefix: "update_"
		}),
		...makeBindValues({
			columns,
			values: where,
			variablePrefix: "where_",
			skipNil: true
		})
	};
	const whereSql = buildWhereSql({ where });
	return [sql`UPDATE ${tableName} SET ${updateValueStr} ${whereSql === "" ? "" : `WHERE ${whereSql}`}`, bindValues];
};
var makeBindValues = ({ columns, values, variablePrefix = "", skipNil }) => {
	const codecMap = pipe(toEntries(columns), map$1(([columnName, columnDef]) => [columnName, (value) => {
		if (columnDef.nullable === true && (value === null || value === void 0)) return null;
		const res = Schema_exports.encodeResult(columnDef.schema)(value);
		if (isFailure(res) === true) {
			const parseErrorStr = makeFormatterDefault()(res.failure.issue);
			const expectedSchemaStr = String(columnDef.schema.ast);
			console.error(`\
Error making bind values for SQL query for column "${columnName}".

Expected schema: ${expectedSchemaStr}

Error: ${parseErrorStr}

Value:`, value);
			debugger;
			throw res.failure;
		} else return res.success;
	}]), Object.fromEntries);
	return pipe(Object.entries(values).filter(([, value]) => skipNil !== true || value !== null && value !== void 0).flatMap(([columnName, value]) => {
		const codec = codecMap[columnName] ?? shouldNeverHappen(`No codec found for column "${columnName}"`);
		if (typeof value === "object" && value !== null && "op" in value) switch (value.op) {
			case "in": return value.val.map((value, i) => [`${variablePrefix}${columnName}_${i}`, codec(value)]);
			case "=":
			case ">":
			case "<": return [[`${variablePrefix}${columnName}`, codec(value.val)]];
			default: throw new Error(`Unknown op: ${value.op}`);
		}
		else return [[`${variablePrefix}${columnName}`, codec(value)]];
	}), Object.fromEntries);
};
var buildWhereSql = ({ where }) => {
	const getWhereOp = (columnName, value) => {
		if (value === null) return `IS NULL`;
		else if (typeof value === "object" && typeof value.op === "string" && isValidWhereOp(value.op) === true) return `${value.op} $where_${columnName}`;
		else if (typeof value === "object" && typeof value.op === "string" && value.op === "in") return `in (${value.val.map((_, i) => `$where_${columnName}_${i}`).join(", ")})`;
		else return `= $where_${columnName}`;
	};
	return pipe(toEntries(where), map$1(([columnName, value]) => `${columnName} ${getWhereOp(columnName, value)}`), join(" AND "));
};
var filterUndefinedFields = (obj) => {
	return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== void 0));
};
var makeExecute = (execute) => {
	return (...args) => {
		const [queryStrOrQueryBuilder, bindValuesOrOptions, maybeOptions] = args;
		if (isQueryBuilder(queryStrOrQueryBuilder) === true) {
			const { query, bindValues } = queryStrOrQueryBuilder.asSql();
			return execute(query, bindValues, bindValuesOrOptions);
		} else return execute(queryStrOrQueryBuilder, bindValuesOrOptions, maybeOptions);
	};
};
var makeSelect = (select) => {
	return (...args) => {
		const [queryStrOrQueryBuilder, maybeBindValues] = args;
		if (isQueryBuilder(queryStrOrQueryBuilder) === true) {
			const { query, bindValues } = queryStrOrQueryBuilder.asSql();
			const resultSchema = getResultSchema(queryStrOrQueryBuilder);
			const results = select(query, bindValues);
			return Schema_exports.decodeUnknownSync(resultSchema)(results);
		} else return select(queryStrOrQueryBuilder, maybeBindValues);
	};
};
dual(2, (self, db) => Effect_exports.uninterruptibleMask((restore) => Effect_exports.sync(generateSavepointName).pipe(Effect_exports.flatMap((savepointName) => {
	const savepointSql = `SAVEPOINT ${savepointName}`;
	const releaseSql = `RELEASE SAVEPOINT ${savepointName}`;
	return executeSavepointSql(db, savepointSql).pipe(Effect_exports.andThen(restore(self).pipe(Effect_exports.exit, Effect_exports.flatMap((exit) => {
		return (isSuccess$1(exit) === true ? executeSavepointSql(db, releaseSql) : executeSavepointSql(db, `ROLLBACK TO SAVEPOINT ${savepointName}`).pipe(Effect_exports.andThen(executeSavepointSql(db, releaseSql)))).pipe(Effect_exports.andThen(exit));
	}))));
}))));
var nextSavepointId = 0;
/** Uses a reserved prefix and process-local counter to avoid caller-controlled or reused identifiers. */
var generateSavepointName = () => `livestore_savepoint_${nextSavepointId++}`;
var executeSavepointSql = (db, sql) => Effect_exports.try({
	try: () => db.execute(sql),
	catch: (cause) => new SqliteError({
		cause,
		query: {
			sql,
			bindValues: []
		}
	})
});
var validateSnapshot = (snapshot) => {
	const headerBytes = new TextDecoder().decode(snapshot.slice(0, 16));
	if (headerBytes.startsWith("SQLite format 3") === false) throw new SqliteError({
		cause: "Invalid SQLite header",
		note: `Expected header to start with 'SQLite format 3', but got: ${headerBytes}`
	});
};
var makeExport = (exportFn) => () => {
	const snapshot = exportFn();
	validateSnapshot(snapshot);
	return snapshot;
};
var getExecStatementsFromMaterializer = ({ eventDef, materializer, dbState, event }) => {
	const eventDecoded = event.decoded === void 0 ? {
		...event.encoded,
		args: Schema_exports.decodeUnknownSync(eventDef.schema)(event.encoded.args)
	} : event.decoded;
	const eventArgsEncoded = isNotUndefined(event.decoded) === true && isNotNullish(event.decoded.args) === true ? Schema_exports.encodeUnknownSync(eventDef.schema)(event.decoded.args) : void 0;
	const query = (rawQueryOrQueryBuilder) => {
		if (isQueryBuilder(rawQueryOrQueryBuilder) === true) {
			const { query, bindValues } = rawQueryOrQueryBuilder.asSql();
			const rawResults = dbState.select(query, prepareBindValues(bindValues, query));
			const resultSchema = getResultSchema(rawQueryOrQueryBuilder);
			return Schema_exports.decodeUnknownSync(resultSchema)(rawResults);
		} else {
			const { query, bindValues } = rawQueryOrQueryBuilder;
			return dbState.select(query, prepareBindValues(bindValues, query));
		}
	};
	return fromMaterializerResult(materializer(eventDecoded.args, {
		eventDef,
		query,
		currentFacts: /* @__PURE__ */ new Map(),
		event: eventDecoded
	})).map((statementRes) => {
		const statementSql = statementRes.sql;
		const bindValues = typeof statementRes === "string" ? eventArgsEncoded : statementRes.bindValues;
		const writeTables = typeof statementRes === "string" ? void 0 : statementRes.writeTables;
		return {
			statementSql,
			bindValues: prepareBindValues(bindValues ?? {}, statementSql),
			writeTables
		};
	});
};
var makeMaterializerHash = ({ schema, dbState }) => (event) => {
	if (isDevEnv() === true) {
		const eventDef = schema.eventsDefsMap.get(event.name);
		const materializer = schema.state.materializers.get(event.name);
		if (eventDef === void 0 || materializer === void 0) return none();
		const materializerResults = getExecStatementsFromMaterializer({
			eventDef,
			materializer,
			dbState,
			event: {
				decoded: void 0,
				encoded: event
			}
		});
		return some(string(JSON.stringify(materializerResults)));
	}
	return none();
};
var hashMaterializerResults = (materializerResults) => string(JSON.stringify(materializerResults));
var fromMaterializerResult = (materializerResult) => {
	if (isArray(materializerResult) === true) return materializerResult.flatMap(fromMaterializerResult);
	if (isQueryBuilder(materializerResult) === true) {
		const { query, bindValues, usedTables } = materializerResult.asSql();
		return [{
			sql: query,
			bindValues,
			writeTables: usedTables
		}];
	} else if (typeof materializerResult === "string") return [{
		sql: materializerResult,
		bindValues: {},
		writeTables: void 0
	}];
	else return [{
		sql: materializerResult.sql,
		bindValues: materializerResult.bindValues,
		writeTables: materializerResult.writeTables
	}];
};
/** Parse JSON string to unknown value */
var jsonParse = Schema_exports.decodeUnknownSync(Schema_exports.fromJsonString(Schema_exports.Unknown));
var rematerializeFromEventlog = Effect_exports.fn("@livestore/common:rematerializeFromEventlog")(function* ({ dbEventlog, schema, onProgress, materializeEvent }) {
	const eventsCount = dbEventlog.select(`SELECT COUNT(*) AS count FROM ${EVENTLOG_META_TABLE}`)[0].count;
	const hashEventDef = memoizeByRef((event) => hash$1(event.schema));
	const processEvent = Effect_exports.fn(`@livestore/common:rematerializeFromEventlog:processEvent`)(function* (row) {
		const args = jsonParse(row.argsJson);
		const eventEncoded = EncodedWithMeta.make({
			name: row.name,
			args,
			seqNum: {
				global: row.seqNumGlobal,
				client: row.seqNumClient,
				rebaseGeneration: row.seqNumRebaseGeneration
			},
			parentSeqNum: {
				global: row.parentSeqNumGlobal,
				client: row.parentSeqNumClient,
				rebaseGeneration: row.parentSeqNumRebaseGeneration
			},
			clientId: row.clientId,
			sessionId: row.sessionId
		});
		const eventDef = schema.eventsDefsMap.get(row.name);
		const materializer = schema.state.materializers.get(row.name);
		if (eventDef === void 0 || materializer === void 0) {
			yield* materializeEvent(eventEncoded, { skipEventlog: true });
			return;
		}
		if (hashEventDef(eventDef) !== row.schemaHash) yield* Effect_exports.logWarning(`Schema hash mismatch for event definition ${row.name}. Trying to materialize event anyway.`);
		yield* Schema_exports.decodeUnknownEffect(eventDef.schema)(args).pipe(Effect_exports.mapError((cause) => UnknownError$1.make({
			cause,
			note: `\
There was an error during rematerializing from the eventlog while decoding
the persisted event args for event definition "${row.name}".
This likely means the schema has changed in an incompatible way.
`
		})));
		yield* materializeEvent(eventEncoded, { skipEventlog: true });
	});
	const stmt = dbEventlog.prepare(sql`\
SELECT * FROM ${EVENTLOG_META_TABLE} 
WHERE seqNumGlobal > $seqNumGlobal OR (seqNumGlobal = $seqNumGlobal AND seqNumClient > $seqNumClient)
ORDER BY seqNumGlobal ASC, seqNumClient ASC
LIMIT ${100}
`);
	let processedEvents = 0;
	yield* Stream_exports.paginate(ROOT, (lastId) => Effect_exports.sync(() => {
		const rows = stmt.select({
			$seqNumGlobal: lastId.global,
			$seqNumClient: lastId.client
		});
		if (isReadonlyArrayNonEmpty(rows) === false) return [rows, none()];
		const lastRow = lastNonEmpty(rows);
		const nextCursor = Composite.make({
			global: lastRow.seqNumGlobal,
			client: lastRow.seqNumClient,
			rebaseGeneration: lastRow.seqNumRebaseGeneration
		});
		return [rows, some(nextCursor)];
	})).pipe(Stream_exports.bufferArray({ capacity: 2 }), Stream_exports.tap((row) => Effect_exports.gen(function* () {
		yield* processEvent(row);
		processedEvents++;
		yield* onProgress({
			done: processedEvents,
			total: eventsCount
		});
	})), Stream_exports.runDrain);
}, withPerformanceMeasure("@livestore/common:rematerializeFromEventlog"));
var dbExecute = (db, queryStr, bindValues) => {
	const stmt = db.prepare(queryStr);
	const preparedBindValues = bindValues !== void 0 ? prepareBindValues(bindValues, queryStr) : void 0;
	try {
		stmt.execute(preparedBindValues);
		stmt.finalize();
	} catch (cause) {
		throw new SqliteError({
			cause,
			query: {
				sql: queryStr,
				bindValues: preparedBindValues ?? {}
			}
		});
	}
};
var dbSelect = (db, queryStr, bindValues) => {
	const stmt = db.prepare(queryStr);
	const res = stmt.select(bindValues !== void 0 ? prepareBindValues(bindValues, queryStr) : void 0);
	stmt.finalize();
	return res;
};
var validateSchema = (schema, schemaManager) => Effect_exports.gen(function* () {
	const registeredEventDefInfos = schemaManager.getEventDefInfos();
	const missingEventDefs = registeredEventDefInfos.filter((registeredEventDefInfo) => !schema.eventsDefsMap.has(registeredEventDefInfo.eventName));
	if (missingEventDefs.length > 0) return yield* new UnknownError$1({ cause: `Missing mutation definitions: ${missingEventDefs.map((info) => info.eventName).join(", ")}` });
	for (const [, eventDef] of schema.eventsDefsMap) validateEventDef(eventDef, schemaManager, registeredEventDefInfos.find((info) => info.eventName === eventDef.name));
});
var validateEventDef = (eventDef, schemaManager, registeredEventDefInfo) => {
	const schemaHash = hash$1(eventDef.schema);
	if (registeredEventDefInfo === void 0) {
		schemaManager.setEventDefInfo({
			schemaHash,
			eventName: eventDef.name
		});
		return;
	}
	if (schemaHash === registeredEventDefInfo.schemaHash) return;
	schemaManager.setEventDefInfo({
		schemaHash,
		eventName: eventDef.name
	});
};
/**
* AUTOMATIC HASH-BASED SCHEMA MIGRATIONS
*
* This module implements automatic schema versioning using hash-based change detection.
*
* ⚠️  CRITICAL DISTINCTION:
* - STATE TABLES (safe to modify): Changes trigger rematerialization from eventlog
* - EVENTLOG TABLES (NEVER modify): Changes cause data loss - need manual versioning!
*
* How it works:
* 1. Each table's schema is hashed using SqliteAst.hash()
* 2. Hashes are stored in SCHEMA_META_TABLE after successful migrations
* 3. On app start, current schema hashes are compared with stored hashes
* 4. Mismatches trigger migrations:
*    - State tables: Recreated and repopulated from eventlog (safe, no data loss)
*    - Eventlog tables: Uses 'create-if-not-exists' (UNSAFE - causes data loss!)
*
* State Table Changes (SAFE):
* - User-defined tables are rebuilt from eventlog
* - System tables (schemaMetaTable, etc.) are recreated
* - Data preserved through rematerializeFromEventlog()
*
* Eventlog Table Changes (UNSAFE):
* - eventlogMetaTable, syncStatusTable changes cause "soft reset"
* - Old table becomes inaccessible (but remains in DB)
* - No automatic migration - effectively data loss
* - TODO: Implement proper EVENTLOG_PERSISTENCE_FORMAT_VERSION system
*
* See system-tables/state-tables.ts and system-tables/eventlog-tables.ts for detailed documentation on each table type.
*/
var getMemoizedTimestamp = memoizeByStringifyArgs(() => (/* @__PURE__ */ new Date()).toISOString());
var makeSchemaManager = (db) => Effect_exports.gen(function* () {
	yield* migrateTable({
		db,
		tableAst: schemaEventDefsMetaTable.sqliteDef.ast,
		behaviour: "create-if-not-exists"
	});
	return {
		getEventDefInfos: () => dbSelect(db, sql`SELECT * FROM ${SCHEMA_EVENT_DEFS_META_TABLE}`),
		setEventDefInfo: (info) => {
			dbExecute(db, sql`INSERT OR REPLACE INTO ${SCHEMA_EVENT_DEFS_META_TABLE} (eventName, schemaHash, updatedAt) VALUES ($eventName, $schemaHash, $updatedAt)`, {
				eventName: info.eventName,
				schemaHash: info.schemaHash,
				updatedAt: (/* @__PURE__ */ new Date()).toISOString()
			});
		}
	};
});
var migrateDb = ({ db, schema, onProgress }) => Effect_exports.gen(function* () {
	for (const tableDef of stateSystemTables) yield* migrateTable({
		db,
		tableAst: tableDef.sqliteDef.ast,
		behaviour: "create-if-not-exists"
	});
	yield* validateSchema(schema, yield* makeSchemaManager(db));
	const schemaMetaRows = dbSelect(db, sql`SELECT * FROM ${SCHEMA_META_TABLE}`);
	const dbSchemaHashByTable = Object.fromEntries(schemaMetaRows.map(({ tableName, schemaHash }) => [tableName, schemaHash]));
	const tableDefs = [...stateSystemTables, ...Array.from(schema.state.sqlite.tables.values()).filter((_) => !isStateSystemTable(_.sqliteDef.name))];
	const tablesToMigrate = /* @__PURE__ */ new Set();
	const migrationsReportEntries = [];
	for (const tableDef of tableDefs) {
		const tableAst = tableDef.sqliteDef.ast;
		const tableName = tableAst.name;
		const dbSchemaHash = dbSchemaHashByTable[tableName];
		const schemaHash = hash(tableAst);
		if (schemaHash !== dbSchemaHash) {
			tablesToMigrate.add({
				tableAst,
				schemaHash
			});
			migrationsReportEntries.push({
				tableName,
				hashes: {
					expected: schemaHash,
					actual: dbSchemaHash
				}
			});
		}
	}
	let processedTables = 0;
	const tablesCount = tablesToMigrate.size;
	for (const { tableAst, schemaHash } of tablesToMigrate) {
		yield* migrateTable({
			db,
			tableAst,
			schemaHash,
			behaviour: "create-if-not-exists"
		});
		if (onProgress !== void 0) {
			processedTables++;
			yield* onProgress({
				done: processedTables,
				total: tablesCount
			});
		}
	}
	return { migrations: migrationsReportEntries };
});
var migrateTable = ({ db, tableAst, schemaHash = hash(tableAst), behaviour, skipMetaTable = false }) => Effect_exports.gen(function* () {
	const tableName = tableAst.name;
	const columnSpec = makeColumnSpec(tableAst);
	if (behaviour === "drop-and-recreate") {
		dbExecute(db, sql`drop table if exists "${tableName}"`);
		dbExecute(db, sql`create table if not exists "${tableName}" (${columnSpec}) strict`);
	} else if (behaviour === "create-if-not-exists") dbExecute(db, sql`create table if not exists "${tableName}" (${columnSpec}) strict`);
	for (const index of tableAst.indexes) dbExecute(db, createIndexFromDefinition(tableName, index));
	if (skipMetaTable !== true) {
		const updatedAt = getMemoizedTimestamp();
		dbExecute(db, sql`
      INSERT INTO ${SCHEMA_META_TABLE} (tableName, schemaHash, updatedAt) VALUES ($tableName, $schemaHash, $updatedAt)
        ON CONFLICT (tableName) DO UPDATE SET schemaHash = $schemaHash, updatedAt = $updatedAt;
    `, {
			tableName,
			schemaHash,
			updatedAt
		});
	}
}).pipe(Effect_exports.withSpan("@livestore/common:migrateTable", { attributes: {
	"span.label": tableAst.name,
	tableName: tableAst.name
} }));
var createIndexFromDefinition = (tableName, index) => {
	return sql`create ${index.unique === true ? "UNIQUE" : ""} index if not exists "${index.name}" on "${tableName}" (${index.columns.map((col) => `"${col}"`).join(", ")})`;
};
var TypeId$2 = "~@livestore/common/StateHead";
var STATE_HEAD_ROW_ID = 1;
var StateHead = class extends Service()("@livestore/common/StateHead") {};
var make$1 = ({ dbState }) => {
	return StateHead.of({
		[TypeId$2]: TypeId$2,
		set: (head) => {
			const [statement, bindValues] = insertRow({
				tableName: STATE_HEAD_META_TABLE,
				columns: stateHeadMetaTable.sqliteDef.columns,
				values: {
					id: STATE_HEAD_ROW_ID,
					seqNumGlobal: head.global,
					seqNumClient: head.client,
					seqNumRebaseGeneration: head.rebaseGeneration
				},
				options: { orReplace: true }
			});
			return execSql(dbState, statement, bindValues);
		},
		get: Effect_exports.suspend(() => {
			const [statement, bindValues] = findManyRows({
				tableName: STATE_HEAD_META_TABLE,
				columns: stateHeadMetaTable.sqliteDef.columns,
				where: { id: STATE_HEAD_ROW_ID },
				limit: 1
			});
			return selectSql(dbState, statement, bindValues).pipe(Effect_exports.map(([row]) => row === void 0 ? ROOT : Composite.make({
				global: row.seqNumGlobal,
				client: row.seqNumClient,
				rebaseGeneration: row.seqNumRebaseGeneration
			})));
		})
	});
};
var layer$2 = (options) => succeed$4(StateHead, make$1(options));
succeed$4(StateHead, StateHead.of({
	[TypeId$2]: TypeId$2,
	set: () => Effect_exports.void,
	get: Effect_exports.succeed(ROOT)
}));
Schema_exports.TaggedError("~@livestore/common/IsOfflineError")("IsOfflineError", { cause: Schema_exports.Defect() });
/** Unique ID generated by the backend when its created. Used to check whether the backend identity has changed. */
var BackendId = Schema_exports.String.annotate({ title: "@livestore/sync-cf:BackendId" });
var BackendIdMismatchError = class extends Schema_exports.TaggedError("~@livestore/common/BackendIdMismatchError")("BackendIdMismatchError", {
	expected: BackendId,
	received: BackendId
}) {};
var ServerAheadError = class extends Schema_exports.TaggedError("~@livestore/common/ServerAheadError")("ServerAheadError", {
	minimumExpectedNum: Schema$3,
	providedNum: Schema$3
}) {};
var InitialSyncOptionsSkip = Schema_exports.TaggedStruct("Skip", {});
var InitialSyncOptionsBlocking = Schema_exports.TaggedStruct("Blocking", { timeout: Schema_exports.Union([Schema_exports.DurationFromMillis, Schema_exports.Finite]) });
Schema_exports.Union([InitialSyncOptionsSkip, InitialSyncOptionsBlocking]);
var LeaderThreadCtx = class extends Service()("LeaderThreadCtx") {};
var StreamEventsOptionsFields = {
	since: Schema_exports.optional(Composite),
	until: Schema_exports.optional(Composite),
	filter: Schema_exports.optional(Schema_exports.Array(Schema_exports.String)),
	clientIds: Schema_exports.optional(Schema_exports.Array(Schema_exports.String)),
	sessionIds: Schema_exports.optional(Schema_exports.Array(Schema_exports.String)),
	batchSize: Schema_exports.optional(Schema_exports.Int.check(Schema_exports.isBetween({
		minimum: 1,
		maximum: 1e3
	}))),
	includeClientOnly: Schema_exports.optional(Schema_exports.Boolean)
};
Schema_exports.Struct(StreamEventsOptionsFields);
var initEventlogDb = (dbEventlog) => Effect_exports.gen(function* () {
	for (const tableDef of eventlogSystemTables) yield* migrateTable({
		db: dbEventlog,
		behaviour: "create-if-not-exists",
		tableAst: tableDef.sqliteDef.ast,
		skipMetaTable: true
	});
	yield* execSql(dbEventlog, sql`INSERT INTO ${SYNC_STATUS_TABLE} (head)
          SELECT ${ROOT.global}
          WHERE NOT EXISTS (SELECT 1 FROM ${SYNC_STATUS_TABLE})`, {});
});
/**
* Exclusive of the "since event"
* Also queries the state db in order to get the SQLite session changeset data.
*/
var getEventsSince = ({ dbEventlog, dbState, since }) => {
	const pendingEvents = dbEventlog.select(eventlogMetaTable.where("seqNumGlobal", ">=", since.global));
	const sessionChangesetRowsDecoded = dbState.select(sessionChangesetMetaTable.where("seqNumGlobal", ">=", since.global));
	const sessionChangesetMap = new Map(sessionChangesetRowsDecoded.map((row) => [`${row.seqNumGlobal}:${row.seqNumClient}`, row]));
	return pendingEvents.map((eventlogEvent) => {
		const sessionChangeset = sessionChangesetMap.get(`${eventlogEvent.seqNumGlobal}:${eventlogEvent.seqNumClient}`);
		return EncodedWithMeta.make({
			name: eventlogEvent.name,
			args: eventlogEvent.argsJson,
			seqNum: {
				global: eventlogEvent.seqNumGlobal,
				client: eventlogEvent.seqNumClient,
				rebaseGeneration: eventlogEvent.seqNumRebaseGeneration
			},
			parentSeqNum: {
				global: eventlogEvent.parentSeqNumGlobal,
				client: eventlogEvent.parentSeqNumClient,
				rebaseGeneration: eventlogEvent.parentSeqNumRebaseGeneration
			},
			clientId: eventlogEvent.clientId,
			sessionId: eventlogEvent.sessionId,
			meta: {
				sessionChangeset: sessionChangeset !== void 0 && sessionChangeset.changeset !== null ? {
					_tag: "sessionChangeset",
					data: sessionChangeset.changeset,
					debug: sessionChangeset.debug
				} : { _tag: "unset" },
				syncMetadata: eventlogEvent.syncMetadataJson,
				materializerHashLeader: none(),
				materializerHashSession: none()
			}
		});
	}).filter((_) => compare(_.seqNum, since) > 0).toSorted((a, b) => compare(a.seqNum, b.seqNum));
};
var getEventsFromEventlog = ({ dbEventlog, options }) => Effect_exports.gen(function* () {
	const since = options.since ?? ROOT;
	const batchSize = options.batchSize ?? 100;
	const makeQuery = () => {
		let query = eventlogMetaTable.where("seqNumGlobal", ">", since.global);
		if (options.until !== void 0) query = query.where("seqNumGlobal", "<=", options.until.global);
		if (options.filter !== void 0 && options.filter.length > 0) query = query.where({ name: {
			op: "IN",
			value: options.filter
		} });
		if (options.clientIds !== void 0 && options.clientIds.length > 0) query = query.where({ clientId: {
			op: "IN",
			value: options.clientIds
		} });
		if (options.sessionIds !== void 0 && options.sessionIds.length > 0) query = query.where({ sessionId: {
			op: "IN",
			value: options.sessionIds
		} });
		if (options.includeClientOnly !== true) query = query.where("seqNumClient", "<=", DEFAULT);
		return query.orderBy([{
			col: "seqNumGlobal",
			direction: "asc"
		}, {
			col: "seqNumClient",
			direction: "asc"
		}]).limit(batchSize);
	};
	const eventlogEvents = yield* Effect_exports.sync(() => dbEventlog.select(makeQuery()));
	if (eventlogEvents.length === 0) return [];
	const spanAttributes = {
		"livestore.eventLog.since": since.global,
		"livestore.eventLog.until": options.until?.global
	};
	return yield* Effect_exports.sync(() => {
		return eventlogEvents.map((eventlogEvent) => {
			return Encoded$2.make({
				name: eventlogEvent.name,
				args: eventlogEvent.argsJson,
				seqNum: {
					global: eventlogEvent.seqNumGlobal,
					client: eventlogEvent.seqNumClient,
					rebaseGeneration: eventlogEvent.seqNumRebaseGeneration
				},
				parentSeqNum: {
					global: eventlogEvent.parentSeqNumGlobal,
					client: eventlogEvent.parentSeqNumClient,
					rebaseGeneration: eventlogEvent.parentSeqNumRebaseGeneration
				},
				clientId: eventlogEvent.clientId,
				sessionId: eventlogEvent.sessionId
			});
		});
	}).pipe(Effect_exports.withSpan("@livestore/common:eventlog:getEventsFromEventlog", { attributes: spanAttributes }));
});
var getClientHeadFromDb = (dbEventlog) => {
	const res = dbEventlog.select(sql`select seqNumGlobal, seqNumClient, seqNumRebaseGeneration from ${EVENTLOG_META_TABLE} order by seqNumGlobal DESC, seqNumClient DESC limit 1`)[0];
	return res !== void 0 ? {
		global: res.seqNumGlobal,
		client: res.seqNumClient,
		rebaseGeneration: res.seqNumRebaseGeneration
	} : ROOT;
};
var getBackendHeadFromDb = (dbEventlog) => dbEventlog.select(sql`select head from ${"__livestore_sync_status"}`)[0]?.head ?? ROOT.global;
var updateBackendHead = (dbEventlog, head) => dbEventlog.execute(sql`UPDATE ${SYNC_STATUS_TABLE} SET head = ${head.global}`);
var getBackendIdFromDb = (dbEventlog) => fromNullishOr(dbEventlog.select(sql`select backendId from ${SYNC_STATUS_TABLE}`)[0]?.backendId);
var updateBackendId = (dbEventlog, backendId) => dbEventlog.execute(sql`UPDATE ${SYNC_STATUS_TABLE} SET backendId = '${backendId}'`);
var insertIntoEventlog = (eventEncoded, dbEventlog, eventDefSchemaHash, clientId, sessionId) => Effect_exports.gen(function* () {
	if (LS_DEV === true && eventEncoded.parentSeqNum.global !== ROOT.global) {
		if (dbEventlog.select(`SELECT COUNT(*) as count FROM eventlog WHERE seqNumGlobal = ? AND seqNumClient = ?`, [eventEncoded.parentSeqNum.global, eventEncoded.parentSeqNum.client])[0].count === 1 === false) shouldNeverHappen(`Parent event ${eventEncoded.parentSeqNum.global},${eventEncoded.parentSeqNum.client} does not exist in eventlog`);
	}
	yield* execSql(dbEventlog, ...insertRow({
		tableName: EVENTLOG_META_TABLE,
		columns: eventlogMetaTable.sqliteDef.columns,
		values: {
			seqNumGlobal: eventEncoded.seqNum.global,
			seqNumClient: eventEncoded.seqNum.client,
			seqNumRebaseGeneration: eventEncoded.seqNum.rebaseGeneration,
			parentSeqNumGlobal: eventEncoded.parentSeqNum.global,
			parentSeqNumClient: eventEncoded.parentSeqNum.client,
			parentSeqNumRebaseGeneration: eventEncoded.parentSeqNum.rebaseGeneration,
			name: eventEncoded.name,
			argsJson: eventEncoded.args ?? {},
			clientId,
			sessionId,
			schemaHash: eventDefSchemaHash,
			syncMetadataJson: eventEncoded.meta.syncMetadata
		}
	}));
	dbEventlog.debug.head = eventEncoded.seqNum;
});
var updateSyncMetadata = (items) => Effect_exports.gen(function* () {
	const { dbEventlog } = yield* LeaderThreadCtx;
	for (let i = 0; i < items.length; i++) {
		const event = items[i];
		yield* execSql(dbEventlog, ...updateRows({
			tableName: EVENTLOG_META_TABLE,
			columns: eventlogMetaTable.sqliteDef.columns,
			where: {
				seqNumGlobal: event.seqNum.global,
				seqNumClient: event.seqNum.client
			},
			updateValues: { syncMetadataJson: event.meta.syncMetadata }
		}));
	}
});
var getSyncBackendCursorInfo = ({ remoteHead }) => Effect_exports.gen(function* () {
	const { dbEventlog } = yield* LeaderThreadCtx;
	if (remoteHead === ROOT.global) return none();
	const EventlogQuerySchema = Schema_exports.Struct({ syncMetadataJson: Schema_exports.fromJsonString(Schema_exports.toCodecJson(Schema_exports.Option(Schema_exports.Json))) }).pipe(pluck("syncMetadataJson"), Schema_exports.Array, head);
	const syncMetadataOption = yield* Effect_exports.sync(() => dbEventlog.select(sql`SELECT syncMetadataJson FROM ${EVENTLOG_META_TABLE} WHERE seqNumGlobal = ${remoteHead} ORDER BY seqNumClient ASC LIMIT 1`)).pipe(Effect_exports.andThen(Schema_exports.decodeEffect(EventlogQuerySchema)), Effect_exports.map(flatten$1), Effect_exports.orDie);
	return some({
		eventSequenceNumber: remoteHead,
		metadata: syncMetadataOption
	});
}).pipe(Effect_exports.withSpan("@livestore/common:eventlog:getSyncBackendCursorInfo", { attributes: { remoteHead } }));
/**
* Type guard for DevtoolsViteNotInstalledError.
* Adapter-specific devtools boot implementations may surface this tagged error;
* common handles it structurally to keep devtools startup environment-agnostic.
*/
var isDevtoolsViteNotInstalledError = (error) => typeof error === "object" && error !== null && "_tag" in error && error._tag === "DevtoolsViteNotInstalledError";
var bootDevtools = Effect_exports.fn("@livestore/common:leader-thread:devtools:boot")(function* (options) {
	if (options.enabled === false) return;
	const { syncProcessor, extraIncomingMessagesQueue, clientId, storeId } = yield* LeaderThreadCtx;
	yield* listenToDevtools({
		incomingMessages: Stream_exports.fromQueue(extraIncomingMessagesQueue),
		sendMessage: () => Effect_exports.void
	}).pipe(tapCauseLogPretty, Effect_exports.forkScoped);
	const bootResult = yield* options.boot.pipe(Effect_exports.map(some), Effect_exports.catchIf(isDevtoolsViteNotInstalledError, (error) => Effect_exports.logWarning(`[@livestore/devtools] ${error.message} Devtools will be disabled.`).pipe(Effect_exports.as(none()))), Effect_exports.catchCause((cause) => Effect_exports.logWarning(`[@livestore/devtools] Failed to start devtools server. Devtools will be disabled.`, cause).pipe(Effect_exports.as(none()))));
	if (isNone(bootResult) === true) return;
	const { node, persistenceInfo, mode } = bootResult.value;
	yield* node.listenForChannel.pipe(Stream_exports.filter((res) => isChannelName.devtoolsClientLeader(res.channelName, {
		storeId,
		clientId
	}) && res.mode === mode), Stream_exports.tap(({ channelName, source }) => Effect_exports.gen(function* () {
		const channel = yield* node.makeChannel({
			target: source,
			channelName,
			schema: {
				listen: MessageToApp,
				send: MessageFromApp
			},
			mode
		});
		const sendMessage = (message) => channel.send(message).pipe(Effect_exports.withSpan("@livestore/common:leader-thread:devtools:sendToDevtools"), Effect_exports.interruptible, Effect_exports.ignore);
		const syncState = yield* syncProcessor.syncState;
		yield* syncProcessor.pull({ cursor: syncState.localHead }).pipe(Stream_exports.tap(({ payload }) => sendMessage(SyncPull.make({
			payload,
			liveStoreVersion
		}))), Stream_exports.runDrain, Effect_exports.forkScoped);
		yield* listenToDevtools({
			incomingMessages: channel.listen.pipe(Stream_exports.mapEffect(Effect_exports.fromResult), Stream_exports.orDie),
			sendMessage,
			persistenceInfo
		});
	}).pipe(tapCauseLogPretty, Effect_exports.forkScoped)), Stream_exports.runDrain);
});
var listenToDevtools = ({ incomingMessages, sendMessage, persistenceInfo }) => Effect_exports.gen(function* () {
	const { syncBackend, makeSqliteDb, dbState, dbEventlog, shutdownStateSubRef, shutdownChannel, syncProcessor, clientId, devtools } = yield* LeaderThreadCtx;
	const subscriptionFiberMap = yield* make$12();
	const handledRequestIds = /* @__PURE__ */ new Set();
	const loadDatabaseBatchTracker = /* @__PURE__ */ new Map();
	const registerBatchProgress = (batchId, kind) => {
		const entry = loadDatabaseBatchTracker.get(batchId) ?? /* @__PURE__ */ new Set();
		entry.add(kind);
		loadDatabaseBatchTracker.set(batchId, entry);
		const finished = entry.has("state") && entry.has("eventlog");
		if (finished === true) loadDatabaseBatchTracker.delete(batchId);
		return finished;
	};
	yield* incomingMessages.pipe(Stream_exports.tap((decodedEvent) => Effect_exports.gen(function* () {
		const { requestId } = decodedEvent;
		const reqPayload = {
			requestId,
			liveStoreVersion,
			clientId
		};
		if (decodedEvent._tag === "LSD.Leader.Disconnect") return;
		if (handledRequestIds.has(requestId) === true) return;
		handledRequestIds.add(requestId);
		switch (decodedEvent._tag) {
			case "LSD.Leader.Ping":
				if (isDevtoolsProtocolVersionSupported(decodedEvent.devtoolsProtocolVersion) === false) {
					yield* sendMessage(VersionMismatch.make({
						...reqPayload,
						appVersion: liveStoreVersion,
						receivedVersion: decodedEvent.liveStoreVersion,
						appDevtoolsProtocolVersion: devtoolsProtocolVersion,
						receivedDevtoolsProtocolVersion: resolveDevtoolsProtocolVersion(decodedEvent.devtoolsProtocolVersion)
					}));
					return;
				}
				yield* sendMessage(Pong.make({
					...reqPayload,
					devtoolsProtocolVersion
				}));
				return;
			case "LSD.Leader.SnapshotReq": {
				const snapshot = dbState.export();
				yield* sendMessage(SnapshotRes.make({
					snapshot,
					...reqPayload
				}));
				return;
			}
			case "LSD.Leader.LoadDatabaseFile.Request": {
				const { data, batchId } = decodedEvent;
				yield* Effect_exports.gen(function* () {
					const tableNames = yield* Effect_exports.acquireRelease(makeSqliteDb({ _tag: "in-memory" }), (db) => Effect_exports.sync(() => db.close())).pipe(Effect_exports.flatMap((db) => Effect_exports.try({
						try: () => {
							db.import(data);
							const rows = db.select(`select name from sqlite_master where type = 'table'`);
							return new Set(rows.map((r) => r.name));
						},
						catch: (cause) => new UnknownError$2(cause)
					})));
					let databaseKind;
					if (tableNames.has("eventlog") === true) {
						databaseKind = "eventlog";
						yield* SubscriptionRef_exports.set(shutdownStateSubRef, "shutting-down");
						yield* Effect_exports.try({
							try: () => dbEventlog.import(data),
							catch: (cause) => new UnknownError$2(cause)
						});
						if (batchId === void 0) yield* Effect_exports.try({
							try: () => dbState.destroy(),
							catch: (cause) => new UnknownError$2(cause)
						});
					} else if (tableNames.has("__livestore_schema") === true && tableNames.has("__livestore_schema_event_defs") === true) {
						databaseKind = "state";
						yield* SubscriptionRef_exports.set(shutdownStateSubRef, "shutting-down");
						yield* Effect_exports.try({
							try: () => dbState.import(data),
							catch: (cause) => new UnknownError$2(cause)
						});
						if (batchId === void 0) yield* Effect_exports.try({
							try: () => dbEventlog.destroy(),
							catch: (cause) => new UnknownError$2(cause)
						});
					} else return yield* Effect_exports.fail({ _tag: "unsupported-database" });
					const resolvedDatabaseKind = databaseKind;
					if (resolvedDatabaseKind === void 0) return yield* Effect_exports.fail({ _tag: "unsupported-database" });
					const shouldShutdown = batchId === void 0 ? true : registerBatchProgress(batchId, resolvedDatabaseKind);
					yield* sendMessage(LoadDatabaseFile.Success.make({ ...reqPayload }));
					if (shouldShutdown === true) yield* shutdownChannel.send(IntentionalShutdownCause.make({ reason: "devtools-import" }));
				}).pipe(Effect_exports.catchTag("unsupported-database", () => sendMessage(LoadDatabaseFile.Error.make({
					...reqPayload,
					cause: { _tag: "unsupported-database" }
				}))), Effect_exports.catch((cause) => Effect_exports.logWarning("Error importing database file", cause).pipe(Effect_exports.andThen(sendMessage(LoadDatabaseFile.Error.make({
					...reqPayload,
					cause: {
						_tag: "unknown-error",
						cause
					}
				}))))));
				return;
			}
			case "LSD.Leader.ResetAllData.Request": {
				const { mode } = decodedEvent;
				yield* SubscriptionRef_exports.set(shutdownStateSubRef, "shutting-down");
				dbState.destroy();
				if (mode === "all-data") dbEventlog.destroy();
				yield* sendMessage(ResetAllData.Success.make({ ...reqPayload }));
				yield* shutdownChannel.send(IntentionalShutdownCause.make({ reason: "devtools-reset" }));
				return;
			}
			case "LSD.Leader.DatabaseFileInfoReq": {
				if (persistenceInfo === void 0) {
					console.log("[@livestore/common:leader-thread:devtools] persistenceInfo is required for this request");
					return;
				}
				const dbSizeQuery = `SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size();`;
				const dbFileSize = dbState.select(dbSizeQuery, void 0)[0].size;
				const eventlogFileSize = dbEventlog.select(dbSizeQuery, void 0)[0].size;
				yield* sendMessage(DatabaseFileInfoRes.make({
					state: {
						fileSize: dbFileSize,
						persistenceInfo: persistenceInfo.state
					},
					eventlog: {
						fileSize: eventlogFileSize,
						persistenceInfo: persistenceInfo.eventlog
					},
					...reqPayload
				}));
				return;
			}
			case "LSD.Leader.EventlogReq": {
				const eventlog = dbEventlog.export();
				yield* sendMessage(EventlogRes.make({
					eventlog,
					...reqPayload
				}));
				return;
			}
			case "LSD.Leader.CommitEventReq":
				yield* syncProcessor.pushPartial({
					event: decodedEvent.eventEncoded,
					clientId: `devtools-${clientId}`,
					sessionId: `devtools-${clientId}`
				});
				yield* sendMessage(CommitEventRes.make({ ...reqPayload }));
				return;
			case "LSD.Leader.SyncHistorySubscribe": {
				const { subscriptionId } = decodedEvent;
				if (syncBackend !== void 0) yield* syncBackend.pull(none(), { live: true }).pipe(Stream_exports.map((_) => _.batch), Stream_exports.flattenIterable, Stream_exports.tap(({ eventEncoded, metadata }) => sendMessage(SyncHistoryRes.make({
					eventEncoded,
					metadata,
					subscriptionId,
					...reqPayload,
					requestId: nanoid(10)
				}))), Stream_exports.runDrain, Effect_exports.interruptible, tapCauseLogPretty, run$1(subscriptionFiberMap, subscriptionId));
				return;
			}
			case "LSD.Leader.SyncHistoryUnsubscribe": {
				const unsubscribeRequestId = decodedEvent.requestId;
				console.log("LSD.SyncHistoryUnsubscribe", unsubscribeRequestId);
				yield* remove(subscriptionFiberMap, unsubscribeRequestId);
				return;
			}
			case "LSD.Leader.SyncingInfoReq": {
				const syncingInfo = SyncingInfo.make({
					enabled: syncBackend !== void 0,
					metadata: syncBackend?.metadata ?? {}
				});
				yield* sendMessage(SyncingInfoRes.make({
					syncingInfo,
					...reqPayload
				}));
				return;
			}
			case "LSD.Leader.NetworkStatusSubscribe":
				if (syncBackend !== void 0) {
					const { subscriptionId } = decodedEvent;
					yield* Effect_exports.sleep(1e3);
					yield* Stream_exports.zipLatest(SubscriptionRef_exports.changes(syncBackend.isConnected), devtools.enabled === true ? SubscriptionRef_exports.changes(devtools.syncBackendLatchState) : Stream_exports.make({ latchClosed: false })).pipe(Stream_exports.tap(([isConnected, { latchClosed }]) => sendMessage(NetworkStatusRes.make({
						networkStatus: {
							isConnected,
							timestampMs: Date.now(),
							devtools: { latchClosed }
						},
						subscriptionId,
						...reqPayload,
						requestId: nanoid(10)
					}))), Stream_exports.runDrain, Effect_exports.interruptible, tapCauseLogPretty, run$1(subscriptionFiberMap, subscriptionId));
				}
				return;
			case "LSD.Leader.NetworkStatusUnsubscribe": {
				const unsubscribeRequestId = decodedEvent.requestId;
				yield* remove(subscriptionFiberMap, unsubscribeRequestId);
				return;
			}
			case "LSD.Leader.SyncHeadSubscribe": {
				const { subscriptionId } = decodedEvent;
				yield* syncProcessor.syncState.changes.pipe(Stream_exports.tap((syncState) => sendMessage(SyncHeadRes.make({
					local: syncState.localHead,
					upstream: syncState.upstreamHead,
					subscriptionId,
					...reqPayload,
					requestId: nanoid(10)
				}))), Stream_exports.runDrain, Effect_exports.interruptible, tapCauseLogPretty, run$1(subscriptionFiberMap, subscriptionId));
				return;
			}
			case "LSD.Leader.SyncHeadUnsubscribe": {
				const { subscriptionId } = decodedEvent;
				yield* remove(subscriptionFiberMap, subscriptionId);
				return;
			}
			case "LSD.Leader.SetSyncLatch.Request": {
				const { closeLatch } = decodedEvent;
				if (devtools.enabled === false) return;
				if (closeLatch === true) yield* devtools.syncBackendLatch.close;
				else yield* devtools.syncBackendLatch.open;
				yield* SubscriptionRef_exports.set(devtools.syncBackendLatchState, { latchClosed: closeLatch });
				yield* sendMessage(SetSyncLatch.Success.make({ ...reqPayload }));
				return;
			}
			default: yield* Effect_exports.logWarning(`TODO implement devtools message`, decodedEvent);
		}
	}).pipe(Effect_exports.withSpan(`@livestore/common:leader-thread:onDevtoolsMessage:${decodedEvent._tag}`))), UnknownError$1.mapToUnknownErrorStream, Stream_exports.runDrain);
});
var makeMaterializeEvent = ({ schema, dbState, dbEventlog }) => Effect_exports.gen(function* () {
	const stateHead = yield* StateHead;
	const eventDefSchemaHashMap = new Map([...schema.eventsDefsMap.entries()].map(([k, v]) => [k, hash$1(v.schema)]));
	return (eventEncoded, options) => Effect_exports.gen(function* () {
		const skipEventlog = options?.skipEventlog ?? false;
		const resolution = yield* resolveEventDef(schema, {
			operation: "@livestore/common:leader-thread:materializeEvent",
			event: eventEncoded
		});
		if (resolution._tag === "unknown") {
			if (skipEventlog === false) yield* insertIntoEventlog(eventEncoded, dbEventlog, -1, eventEncoded.clientId, eventEncoded.sessionId);
			yield* stateHead.set(eventEncoded.seqNum);
			dbState.debug.head = eventEncoded.seqNum;
			return {
				sessionChangeset: { _tag: "no-op" },
				hash: none()
			};
		}
		const { eventDef, materializer } = resolution;
		yield* logDeprecationWarnings(eventDef, eventEncoded.args);
		const execArgsArr = getExecStatementsFromMaterializer({
			eventDef,
			materializer,
			dbState,
			event: {
				decoded: void 0,
				encoded: eventEncoded
			}
		});
		const materializerHash = isDevEnv() === true ? some(hashMaterializerResults(execArgsArr)) : none();
		if (materializerHash._tag === "Some" && eventEncoded.meta.materializerHashSession._tag === "Some" && eventEncoded.meta.materializerHashSession.value !== materializerHash.value) return yield* MaterializerHashMismatchError.make({ eventName: eventEncoded.name });
		const session = dbState.session();
		for (const { statementSql, bindValues } of execArgsArr) yield* execSqlPrepared(dbState, statementSql, bindValues);
		dbState.debug.head = eventEncoded.seqNum;
		const changeset = session.changeset();
		session.finish();
		yield* execSql(dbState, ...insertRow({
			tableName: SESSION_CHANGESET_META_TABLE,
			columns: sessionChangesetMetaTable.sqliteDef.columns,
			values: {
				seqNumGlobal: eventEncoded.seqNum.global,
				seqNumClient: eventEncoded.seqNum.client,
				seqNumRebaseGeneration: eventEncoded.seqNum.rebaseGeneration,
				changeset: changeset ?? null,
				debug: LS_DEV === true ? execArgsArr : null
			}
		}));
		yield* stateHead.set(eventEncoded.seqNum);
		if (skipEventlog === false) {
			const eventName = eventEncoded.name;
			yield* insertIntoEventlog(eventEncoded, dbEventlog, eventDefSchemaHashMap.get(eventName) ?? shouldNeverHappen(`Unknown event definition: ${eventName}`), eventEncoded.clientId, eventEncoded.sessionId);
		}
		return {
			sessionChangeset: changeset !== void 0 ? {
				_tag: "sessionChangeset",
				data: changeset,
				debug: LS_DEV === true ? execArgsArr : null
			} : { _tag: "no-op" },
			hash: materializerHash
		};
	}).pipe(Effect_exports.mapError((cause) => MaterializeError.make({ cause })), Effect_exports.withSpan(`@livestore/common:leader-thread:materializeEvent`, { attributes: {
		eventName: eventEncoded.name,
		eventNum: eventEncoded.seqNum,
		"span.label": `${toString(eventEncoded.seqNum)} ${eventEncoded.name}`
	} }));
});
var rollback = ({ dbState, dbEventlog, eventNumsToRollback }) => Effect_exports.gen(function* () {
	const rollbackEvents = dbState.select(sql`SELECT * FROM ${SESSION_CHANGESET_META_TABLE} WHERE (seqNumGlobal, seqNumClient) IN (${eventNumsToRollback.map((id) => `(${id.global}, ${id.client})`).join(", ")})`).map((_) => ({
		seqNum: {
			global: _.seqNumGlobal,
			client: _.seqNumClient,
			rebaseGeneration: -1
		},
		changeset: _.changeset,
		debug: _.debug
	})).toSorted((a, b) => compare(a.seqNum, b.seqNum));
	for (let i = rollbackEvents.length - 1; i >= 0; i--) {
		const { changeset } = rollbackEvents[i];
		if (changeset !== null) dbState.makeChangeset(changeset).invert().apply();
	}
	const eventNumPairChunks = chunksOf(100)(eventNumsToRollback.map((seqNum) => `(${seqNum.global}, ${seqNum.client})`));
	for (const eventNumPairChunk of eventNumPairChunks) dbState.execute(sql`DELETE FROM ${SESSION_CHANGESET_META_TABLE} WHERE (seqNumGlobal, seqNumClient) IN (${eventNumPairChunk.join(", ")})`);
	for (const eventNumPairChunk of eventNumPairChunks) dbEventlog.execute(sql`DELETE FROM ${EVENTLOG_META_TABLE} WHERE (seqNumGlobal, seqNumClient) IN (${eventNumPairChunk.join(", ")})`);
}).pipe(Effect_exports.withSpan("@livestore/common:LeaderSyncProcessor:rollback", { attributes: { count: eventNumsToRollback.length } }));
var TypeId$1 = "~@livestore/common/LeaderSyncProcessor";
/**
* The LeaderSyncProcessor manages synchronization of events between
* the local state and the sync backend, ensuring efficient and orderly processing.
*
* In the LeaderSyncProcessor, pulling always has precedence over pushing.
*
* Responsibilities:
* - Queueing incoming local events in a localPushesQueue.
* - Broadcasting events to client sessions via pull queues.
* - Pushing events to the sync backend.
*
* Notes:
*
* local push processing:
* - localPushesQueue:
*   - Maintains events in ascending order.
*   - Uses `Deferred` objects to resolve/reject events based on application success.
* - Processes events from the queue, applying events in batches.
* - Controlled by a mutex (`Semaphore(1)`) to ensure mutual exclusion between local push and backend pull processing.
* - The backend pull side acquires the mutex before processing and releases it on post-pull completion.
* - Processes up to `maxBatchSize` events per cycle.
*
* Currently, we're advancing the state db and eventlog in lockstep, but we could also decouple this in the future
*
* Tricky concurrency scenarios:
* - Queued local push batches becoming invalid due to a prior local push item being rejected.
*   Solution: Introduce a generation number for local push batches which is used to filter out old batches items in case of rejection.
*
* See ClientSessionSyncProcessor for how the leader and session sync processors are similar/different.
*/
var LeaderSyncProcessor = class extends Service()("@livestore/common/LeaderSyncProcessor") {};
var make = Effect_exports.fnUntraced(function* ({ schema, dbState, initialBlockingSyncContext, initialSyncState, onError, onBackendIdMismatch, livePull, params, testing }) {
	const stateHead = yield* StateHead;
	const syncBackendPushQueue = yield* unbounded$1();
	const localPushBatchSize = params.localPushBatchSize ?? 10;
	const backendPushBatchSize = params.backendPushBatchSize ?? 50;
	const syncStateSref = yield* SubscriptionRef_exports.make(void 0);
	const isClientOnlyEvent = (eventEncoded) => schema.eventsDefsMap.get(eventEncoded.name)?.options.clientOnly ?? false;
	const connectedClientSessionPullQueues = yield* makePullQueueSet;
	const ctxRef = { current: void 0 };
	const localPushesQueue = yield* unbounded$1();
	const reservedLocalPushItems = /* @__PURE__ */ new Set();
	const localPushBackendPullMutex = yield* make$10(1);
	const pushAdmissionSemaphore = yield* make$10(1);
	/**
	* Admission fence for local pushes. Unlike `syncState.localHead`, this advances as soon as an event
	* is queued, so another session cannot claim the same sequence number while that event is waiting
	* to be applied. With authoritative head e0 and reserved pushes e1/e2, this points to e2.
	*
	* All reads and writes are protected by `pushAdmissionSemaphore` so validation and reservation are
	* one atomic operation from the perspective of concurrent sessions and backend pulls.
	*/
	const pushHeadRef = { current: initialSyncState.localHead };
	/**
	* A backend pull may advance or rebase authoritative history while local pushes remain reserved.
	* Keep the fence at the newest reservation that is still valid for that history; if none remains,
	* fall back to the authoritative head. Stale reservations are released later by the queue worker.
	*/
	const reconcilePushHead = (authoritativeHead) => pushAdmissionSemaphore.withPermits(1)(Effect_exports.gen(function* () {
		const latestCurrentGenerationItem = [...reservedLocalPushItems].findLast(([event]) => event.seqNum.rebaseGeneration >= authoritativeHead.rebaseGeneration);
		pushHeadRef.current = latestCurrentGenerationItem?.[0].seqNum ?? authoritativeHead;
	}).pipe(Effect_exports.uninterruptible));
	/**
	* Stop completed, rejected, or stale queue items from extending the admission fence, then rebuild
	* the fence from any pushes that are still reserved.
	*/
	const releasePushReservations = (items, authoritativeHead) => pushAdmissionSemaphore.withPermits(1)(Effect_exports.gen(function* () {
		for (const item of items) reservedLocalPushItems.delete(item);
		const latestCurrentGenerationItem = [...reservedLocalPushItems].findLast(([event]) => event.seqNum.rebaseGeneration >= authoritativeHead.rebaseGeneration);
		pushHeadRef.current = latestCurrentGenerationItem?.[0].seqNum ?? authoritativeHead;
	}).pipe(Effect_exports.uninterruptible));
	const backgroundApplyLocalPushes = Effect_exports.gen(function* () {
		while (true) {
			if (testing.delays?.localPushProcessing !== void 0) yield* testing.delays.localPushProcessing.pipe(Effect_exports.withSpan("localPushProcessingDelay"));
			const batchItems = yield* takeBetween$1(localPushesQueue, 1, localPushBatchSize);
			yield* Effect_exports.gen(function* () {
				const syncState = yield* Effect_exports.fromNullishOr(yield* SubscriptionRef_exports.get(syncStateSref)).pipe(orDieDebugger);
				const currentRebaseGeneration = syncState.localHead.rebaseGeneration;
				const [droppedItems, filteredItems] = partition(batchItems, (batchItem) => batchItem[0].seqNum.rebaseGeneration >= currentRebaseGeneration ? succeed$3(batchItem) : fail$4(batchItem));
				if (droppedItems.length > 0) {
					yield* spanEvent(`push:drop-old-generation`, {
						droppedCount: droppedItems.length,
						currentRebaseGeneration
					});
					yield* Effect_exports.forEach(droppedItems, ([eventEncoded, deferred]) => fail$2(deferred, StaleRebaseGenerationError.make({
						currentRebaseGeneration,
						providedRebaseGeneration: eventEncoded.seqNum.rebaseGeneration,
						sessionId: eventEncoded.sessionId
					})));
					yield* releasePushReservations(droppedItems, syncState.localHead);
				}
				if (filteredItems.length === 0) return;
				const [newEvents, deferreds] = unzip(filteredItems);
				yield* Effect_exports.annotateCurrentSpan({
					batchSize: newEvents.length,
					...TRACE_VERBOSE === true ? { newEvents: jsonStringify(newEvents) } : {}
				});
				const mergeResult = yield* merge({
					syncState,
					payload: {
						_tag: "local-push",
						newEvents
					},
					isClientOnlyEvent,
					isEqualEvent: isEqualEncoded
				});
				switch (mergeResult._tag) {
					case "rebase": return yield* dieDebugger("The leader thread should never have to rebase due to a local push");
					case "reject": {
						yield* spanEvent(`push:reject`, {
							batchSize: newEvents.length,
							...TRACE_VERBOSE === true ? { mergeResult: jsonStringify(mergeResult) } : {}
						});
						const nextRebaseGeneration = currentRebaseGeneration + 1;
						const providedNum = newEvents.at(0).seqNum;
						const remainingEventsMatchingGeneration = yield* takePrefixUntil(localPushesQueue, ([eventEncoded]) => eventEncoded.seqNum.rebaseGeneration >= nextRebaseGeneration);
						const remainingLocalPushes = yield* snapshotTxQueue(localPushesQueue);
						if (LS_DEV === true && remainingLocalPushes.length > 0) {
							console.log("localPushesQueue is not empty", remainingLocalPushes.length);
							debugger;
						}
						const allDeferredsToReject = [...deferreds, ...remainingEventsMatchingGeneration.map(([_, deferred]) => deferred)];
						yield* releasePushReservations([...filteredItems, ...remainingEventsMatchingGeneration], syncState.localHead);
						yield* Effect_exports.forEach(allDeferredsToReject, (deferred) => fail$2(deferred, LeaderAheadError.make({
							minimumExpectedNum: mergeResult.expectedMinimumId,
							providedNum,
							sessionId: newEvents.at(0).sessionId
						})));
						return;
					}
					case "advance": break;
					default: casesHandled(mergeResult);
				}
				const acceptedPendingEvents = mergeResult.newSyncState.pending.slice(syncState.pending.length);
				if (acceptedPendingEvents.length !== mergeResult.newEvents.length) return yield* dieDebugger("Local push events must be retained in pending state");
				yield* materializeEventsBatch({ batchItems: acceptedPendingEvents });
				yield* SubscriptionRef_exports.set(syncStateSref, mergeResult.newSyncState);
				yield* connectedClientSessionPullQueues.offer({
					payload: PayloadUpstreamAdvance.make({ newEvents: acceptedPendingEvents }),
					leaderHead: mergeResult.newSyncState.localHead
				});
				yield* spanEvent(`push:advance`, {
					batchSize: newEvents.length,
					...TRACE_VERBOSE === true ? { mergeResult: jsonStringify(mergeResult) } : {}
				});
				const globalOrUnknownEvents = acceptedPendingEvents.filter((e) => !isClientOnlyEvent(e));
				yield* offerAll$1(syncBackendPushQueue, globalOrUnknownEvents);
				yield* releasePushReservations(filteredItems, mergeResult.newSyncState.localHead);
				yield* Effect_exports.forEach(deferreds, (deferred) => succeed$2(deferred, void 0));
			}).pipe(localPushBackendPullMutex.withPermits(1));
		}
	});
	const backgroundBackendPulling = Effect_exports.fn("@livestore/common:LeaderSyncProcessor:backend-pulling")(function* ({ restartBackendPushing }) {
		const { syncBackend, dbState: db, dbEventlog, schema } = yield* LeaderThreadCtx;
		if (syncBackend === void 0) return;
		let pullMutexHeld = false;
		const releasePullMutexIfHeld = Effect_exports.gen(function* () {
			if (pullMutexHeld === false) return;
			pullMutexHeld = false;
			yield* localPushBackendPullMutex.release(1);
		});
		const isPullPaginationComplete = (pageInfo) => pageInfo._tag === "NoMore";
		const onNewPullChunk = (newEvents, pageInfo) => Effect_exports.gen(function* () {
			if (ctxRef.current?.devtoolsLatch !== void 0) yield* ctxRef.current.devtoolsLatch.await;
			if (newEvents.length === 0) {
				if (isPullPaginationComplete(pageInfo) === true) yield* releasePullMutexIfHeld;
				return;
			}
			if (pullMutexHeld === false) {
				yield* localPushBackendPullMutex.take(1);
				pullMutexHeld = true;
			}
			const chunkExit = yield* Effect_exports.gen(function* () {
				const syncState = yield* Effect_exports.fromNullishOr(yield* SubscriptionRef_exports.get(syncStateSref)).pipe(orDieDebugger);
				yield* Effect_exports.annotateCurrentSpan({
					"merge.newEventsCount": newEvents.length,
					...TRACE_VERBOSE === true ? { "merge.newEvents": jsonStringify(newEvents) } : {}
				});
				const mergeResult = yield* merge({
					syncState,
					payload: PayloadUpstreamAdvance.make({ newEvents }),
					isClientOnlyEvent,
					isEqualEvent: isEqualEncoded,
					ignoreClientOnlyEvents: true
				});
				if (mergeResult._tag === "reject") return yield* dieDebugger("The leader thread should never reject upstream advances");
				const newBackendHead = newEvents.at(-1).seqNum;
				updateBackendHead(dbEventlog, newBackendHead);
				if (mergeResult._tag === "rebase") {
					yield* spanEvent(`pull:rebase[${mergeResult.newSyncState.localHead.rebaseGeneration}]`, {
						newEventsCount: newEvents.length,
						...TRACE_VERBOSE === true ? { newEvents: jsonStringify(newEvents) } : {},
						rollbackCount: mergeResult.rollbackEvents.length,
						...TRACE_VERBOSE === true ? { mergeResult: jsonStringify(mergeResult) } : {}
					});
					yield* restartBackendPushing(mergeResult.newSyncState.pending.filter((e) => !isClientOnlyEvent(e)));
					if (mergeResult.rollbackEvents.length > 0) {
						yield* rollback({
							dbState: db,
							dbEventlog,
							eventNumsToRollback: mergeResult.rollbackEvents.map((_) => _.seqNum)
						});
						yield* stateHead.set(mergeResult.rollbackEvents[0].parentSeqNum).pipe(Effect_exports.mapError((cause) => MaterializeError.make({ cause })));
					}
					yield* connectedClientSessionPullQueues.offer({
						payload: payloadFromMergeResult(mergeResult),
						leaderHead: mergeResult.newSyncState.localHead
					});
				} else {
					yield* spanEvent(`pull:advance`, {
						newEventsCount: newEvents.length,
						...TRACE_VERBOSE === true ? { mergeResult: jsonStringify(mergeResult) } : {}
					});
					yield* restartBackendPushing(mergeResult.newSyncState.pending.filter((e) => !isClientOnlyEvent(e)));
					yield* connectedClientSessionPullQueues.offer({
						payload: payloadFromMergeResult(mergeResult),
						leaderHead: mergeResult.newSyncState.localHead
					});
					if (mergeResult.confirmedEvents.length > 0) yield* updateSyncMetadata(newEvents.filter((event) => mergeResult.confirmedEvents.some((confirmedEvent) => isEqual(event.seqNum, confirmedEvent.seqNum)))).pipe(orDieDebugger);
				}
				trimChangesetRows(db, newBackendHead);
				yield* reconcilePushHead(mergeResult.newSyncState.localHead);
				yield* materializeEventsBatch({ batchItems: mergeResult.newEvents });
				yield* SubscriptionRef_exports.set(syncStateSref, mergeResult.newSyncState);
			}).pipe(Effect_exports.exit);
			if (isFailure$1(chunkExit) === true) {
				yield* releasePullMutexIfHeld;
				return yield* Effect_exports.failCause(chunkExit.cause);
			}
			if (isPullPaginationComplete(pageInfo) === true) yield* releasePullMutexIfHeld;
		});
		const cursorInfo = yield* getSyncBackendCursorInfo({ remoteHead: (yield* Effect_exports.fromNullishOr(yield* SubscriptionRef_exports.get(syncStateSref)).pipe(orDieDebugger)).upstreamHead.global });
		const hashMaterializerResult = makeMaterializerHash({
			schema,
			dbState
		});
		yield* syncBackend.pull(cursorInfo, { live: livePull }).pipe(Stream_exports.tap(({ batch, pageInfo }) => Effect_exports.gen(function* () {
			yield* waitUntil(syncBackend.isConnected, (isConnected) => isConnected === true);
			yield* onNewPullChunk(batch.map((_) => EncodedWithMeta.fromGlobal(_.eventEncoded, {
				syncMetadata: _.metadata,
				materializerHashLeader: hashMaterializerResult(toClientEncoded(_.eventEncoded)),
				materializerHashSession: none()
			})), pageInfo);
			yield* initialBlockingSyncContext.update({
				processed: batch.length,
				pageInfo
			});
		})), Stream_exports.runDrain, Effect_exports.interruptible, Effect_exports.ensuring(releasePullMutexIfHeld));
		yield* Effect_exports.logDebug("backend-pulling finished", { livePull });
	});
	const backgroundBackendPushing = Effect_exports.gen(function* () {
		const { syncBackend } = yield* LeaderThreadCtx;
		if (syncBackend === void 0) return;
		while (true) {
			yield* waitUntil(syncBackend.isConnected, (isConnected) => isConnected === true);
			const queueItems = yield* takeBetween$1(syncBackendPushQueue, 1, backendPushBatchSize);
			yield* waitUntil(syncBackend.isConnected, (isConnected) => isConnected === true);
			if (ctxRef.current?.devtoolsLatch !== void 0) yield* ctxRef.current.devtoolsLatch.await;
			yield* spanEvent("backend-push", {
				batchSize: queueItems.length,
				...TRACE_VERBOSE === true ? { batch: jsonStringify(queueItems) } : {}
			});
			yield* Effect_exports.gen(function* () {
				const iteration = yield* Schedule_exports.CurrentMetadata;
				const pushResult = yield* syncBackend.push(queueItems.map((_) => _.toGlobal())).pipe(Effect_exports.result);
				const retries = iteration.attempt;
				if (retries > 0 && isSuccess(pushResult) === true) yield* spanEvent("backend-push-retry-success", {
					retries,
					batchSize: queueItems.length
				});
				if (isFailure(pushResult) === true) {
					yield* spanEvent("backend-push-error", {
						error: pushResult.failure.toString(),
						retries,
						batchSize: queueItems.length
					});
					const error = pushResult.failure;
					if (error._tag === "ServerAheadError") {
						yield* Effect_exports.logDebug("handled backend-push-error (waiting for interupt caused by pull)", { error });
						return yield* Effect_exports.never;
					}
					return yield* error;
				}
			}).pipe(Effect_exports.retry({
				schedule: Schedule_exports.exponential(seconds(1)).pipe(Schedule_exports.modifyDelay(({ duration }) => Effect_exports.succeed(min(duration, seconds(30))))),
				while: (error) => error._tag === "IsOfflineError" || error._tag === "UnknownError"
			}), Effect_exports.catchIf((error) => error._tag === "IsOfflineError" || error._tag === "UnknownError", Effect_exports.die));
		}
	}).pipe(Effect_exports.interruptible);
	const push = (newEvents) => Effect_exports.gen(function* () {
		if (newEvents.length === 0) return;
		const deferreds = yield* Effect_exports.forEach(newEvents, () => make$6());
		const items = newEvents.map((eventEncoded, i) => [eventEncoded, deferreds[i]]);
		yield* pushAdmissionSemaphore.withPermits(1)(Effect_exports.gen(function* () {
			yield* validatePushBatch(newEvents, pushHeadRef.current, isClientOnlyEvent);
			for (const item of items) reservedLocalPushItems.add(item);
			yield* offerAll$1(localPushesQueue, items);
			pushHeadRef.current = newEvents.at(-1).seqNum;
			if (testing.hooks?.localPushAdmitted !== void 0) yield* testing.hooks.localPushAdmitted(newEvents);
		}).pipe(Effect_exports.uninterruptible));
		yield* Effect_exports.all(deferreds.map(_await));
	}).pipe(Effect_exports.withSpan("@livestore/common:LeaderSyncProcessor:push", {
		attributes: {
			batchSize: newEvents.length,
			batch: TRACE_VERBOSE === true ? newEvents : void 0
		},
		links: ctxRef.current?.span !== void 0 ? [{
			span: ctxRef.current.span,
			attributes: {}
		}] : void 0
	}));
	return LeaderSyncProcessor.of({
		[TypeId$1]: TypeId$1,
		boot: Effect_exports.gen(function* () {
			const span = yield* Effect_exports.currentSpan.pipe(Effect_exports.orDie);
			const { devtools, shutdownChannel } = yield* LeaderThreadCtx;
			const services = yield* Effect_exports.context();
			ctxRef.current = {
				span,
				devtoolsLatch: devtools.enabled === true ? devtools.syncBackendLatch : void 0,
				services
			};
			/** State transitions need to happen atomically, so we use a Ref to track the state */
			yield* SubscriptionRef_exports.set(syncStateSref, initialSyncState);
			if (initialSyncState.pending.length > 0) {
				const globalOrUnknownPendingEvents = initialSyncState.pending.filter((eventEncoded) => !isClientOnlyEvent(eventEncoded));
				if (globalOrUnknownPendingEvents.length > 0) yield* offerAll$1(syncBackendPushQueue, globalOrUnknownPendingEvents);
			}
			const handleBackendIdMismatchError = (error) => handleBackendIdMismatch({
				error,
				onBackendIdMismatch,
				shutdownChannel
			});
			const maybeShutdownOnError = (cause) => Effect_exports.gen(function* () {
				if (onError === "ignore") {
					if (LS_DEV === true) yield* Effect_exports.logDebug(`Ignoring sync error (${getOrUndefined(findErrorOption(cause))?._tag ?? cause.toString()})`, pretty(cause));
					return;
				}
				const error = getOrUndefined(findErrorOption(cause));
				const errorToSend = error === void 0 ? UnknownError$1.make({ cause }) : error;
				yield* shutdownChannel.send(errorToSend).pipe(Effect_exports.orDie);
				return yield* Effect_exports.failCause(cause).pipe(Effect_exports.orDie);
			});
			yield* backgroundApplyLocalPushes.pipe(Effect_exports.catchCause(maybeShutdownOnError), Effect_exports.forkScoped);
			const backendPushingFiberHandle = yield* make$8();
			const backendPushingEffect = backgroundBackendPushing.pipe(Effect_exports.catchTag("BackendIdMismatchError", handleBackendIdMismatchError), Effect_exports.catchCause(maybeShutdownOnError));
			yield* run(backendPushingFiberHandle, backendPushingEffect);
			yield* backgroundBackendPulling({ restartBackendPushing: (filteredRebasedPending) => Effect_exports.gen(function* () {
				yield* clear$1(backendPushingFiberHandle);
				yield* clear$2(syncBackendPushQueue);
				yield* offerAll$1(syncBackendPushQueue, filteredRebasedPending);
				yield* run(backendPushingFiberHandle, backendPushingEffect);
			}) }).pipe(Effect_exports.retry({ until: (error) => error._tag !== "IsOfflineError" }), Effect_exports.catchTag("BackendIdMismatchError", handleBackendIdMismatchError), Effect_exports.catchCause(maybeShutdownOnError), Effect_exports.provideService(UnhandledLogLevel, void 0), Effect_exports.forkScoped);
			return { initialLeaderHead: initialSyncState.localHead };
		}).pipe(Effect_exports.withSpanScoped("@livestore/common:LeaderSyncProcessor:boot")),
		push,
		pushPartial: ({ event: { name, args }, clientId, sessionId }) => Effect_exports.gen(function* () {
			const syncState = yield* Effect_exports.fromNullishOr(yield* SubscriptionRef_exports.get(syncStateSref)).pipe(orDieDebugger);
			const resolution = yield* resolveEventDef(schema, {
				operation: "@livestore/common:LeaderSyncProcessor:pushPartial",
				event: {
					name,
					args,
					clientId,
					sessionId,
					seqNum: syncState.localHead
				}
			});
			if (resolution._tag === "unknown") return;
			const eventEncoded = new EncodedWithMeta({
				name,
				args,
				clientId,
				sessionId,
				...nextPair({
					seqNum: syncState.localHead,
					isClientOnly: resolution.eventDef.options.clientOnly
				})
			});
			yield* push([eventEncoded]);
		}).pipe(Effect_exports.catchIf(isRejectedPushError, Effect_exports.die)),
		pull: ({ cursor }) => Effect_exports.gen(function* () {
			const queue = yield* Effect_exports.fromNullishOr(ctxRef.current?.services).pipe(orDieDebugger, Effect_exports.flatMap((services) => connectedClientSessionPullQueues.makeQueue(cursor).pipe(Effect_exports.provide(services))));
			return Stream_exports.fromQueue(queue);
		}).pipe(Stream_exports.unwrap),
		pullQueue: ({ cursor }) => Effect_exports.fromNullishOr(ctxRef.current?.services).pipe(orDieDebugger, Effect_exports.flatMap((services) => connectedClientSessionPullQueues.makeQueue(cursor).pipe(Effect_exports.provide(services)))),
		syncState: make$4({
			get: SubscriptionRef_exports.get(syncStateSref).pipe(Effect_exports.flatMap(Effect_exports.fromNullishOr), orDieDebugger),
			changes: SubscriptionRef_exports.changes(syncStateSref).pipe(Stream_exports.filter(isNotUndefined))
		})
	});
});
var materializeEventsBatch = ({ batchItems }) => Effect_exports.gen(function* () {
	const { dbState: db, dbEventlog, materializeEvent } = yield* LeaderThreadCtx;
	db.execute("BEGIN TRANSACTION", void 0);
	dbEventlog.execute("BEGIN TRANSACTION", void 0);
	yield* Effect_exports.addFinalizer((exit) => Effect_exports.gen(function* () {
		if (isSuccess$1(exit) === true) return;
		db.execute("ROLLBACK", void 0);
		dbEventlog.execute("ROLLBACK", void 0);
	}));
	for (let i = 0; i < batchItems.length; i++) {
		const { sessionChangeset, hash } = yield* materializeEvent(batchItems[i]);
		batchItems[i].meta.sessionChangeset = sessionChangeset;
		batchItems[i].meta.materializerHashLeader = hash;
	}
	db.execute("COMMIT", void 0);
	dbEventlog.execute("COMMIT", void 0);
}).pipe(Effect_exports.uninterruptible, Effect_exports.scoped, Effect_exports.withSpan("@livestore/common:LeaderSyncProcessor:materializeEventItems", { attributes: { batchSize: batchItems.length } }), tapCauseLogPretty);
var trimChangesetRows = (db, newHead) => {
	db.execute(sql`DELETE FROM ${SESSION_CHANGESET_META_TABLE} WHERE seqNumGlobal < ${newHead.global}`);
};
var makePullQueueSet = Effect_exports.gen(function* () {
	const set = /* @__PURE__ */ new Set();
	const cachedPayloads = /* @__PURE__ */ new Map();
	yield* Effect_exports.addFinalizer(() => Effect_exports.gen(function* () {
		for (const queue of set) yield* shutdown(queue);
		set.clear();
	}));
	const makeQueue = (cursor) => Effect_exports.gen(function* () {
		const queue = yield* Effect_exports.acquireRelease(unbounded(), shutdown);
		yield* Effect_exports.addFinalizer(() => Effect_exports.sync(() => set.delete(queue)));
		const payloadsSinceCursor = Array.from(cachedPayloads.entries()).flatMap(([seqNumStr, payloads]) => payloads.map((payload) => ({
			payload,
			seqNum: fromString(seqNumStr)
		}))).filter(({ seqNum }) => isGreaterThan(seqNum, cursor)).toSorted((a, b) => compare(a.seqNum, b.seqNum)).map(({ payload }) => {
			if (payload._tag === "upstream-advance") return { payload: {
				_tag: "upstream-advance",
				newEvents: dropWhile(payload.newEvents, (eventEncoded) => isGreaterThanOrEqual(cursor, eventEncoded.seqNum))
			} };
			else return { payload };
		});
		yield* offerAll(queue, payloadsSinceCursor);
		set.add(queue);
		return queue;
	});
	const offer = (item) => Effect_exports.gen(function* () {
		const seqNumStr = toString(item.leaderHead);
		if (cachedPayloads.has(seqNumStr) === true) cachedPayloads.get(seqNumStr).push(item.payload);
		else cachedPayloads.set(seqNumStr, [item.payload]);
		if (item.payload._tag === "upstream-advance" && item.payload.newEvents.length === 0) return;
		for (const queue of set) yield* offer$1(queue, item);
	});
	return {
		makeQueue,
		offer
	};
});
/**
* Validate a client-provided batch before it is admitted to the leader queue.
* Ensures the numbers form a strictly increasing chain and that the first
* event sits ahead of the current push head.
*/
var validatePushBatch = (batch, pushHead, isClientOnlyEvent) => Effect_exports.gen(function* () {
	if (batch.length === 0) return;
	for (let i = 1; i < batch.length; i++) if (isGreaterThanOrEqual(batch[i - 1].seqNum, batch[i].seqNum) === true) return yield* NonMonotonicBatchError.make({
		precedingSeqNum: batch[i - 1].seqNum,
		violatingSeqNum: batch[i].seqNum,
		violationIndex: i,
		sessionId: batch[i].sessionId
	});
	if (isGreaterThanOrEqual(pushHead, batch[0].seqNum) === true) return yield* LeaderAheadError.make({
		minimumExpectedNum: pushHead,
		providedNum: batch[0].seqNum,
		sessionId: batch[0].sessionId
	});
	if (batch[0].seqNum.rebaseGeneration < pushHead.rebaseGeneration) return yield* StaleRebaseGenerationError.make({
		currentRebaseGeneration: pushHead.rebaseGeneration,
		providedRebaseGeneration: batch[0].seqNum.rebaseGeneration,
		sessionId: batch[0].sessionId
	});
	let precedingSeqNum = pushHead;
	for (let i = 0; i < batch.length; i++) {
		const event = batch[i];
		const expectedPair = nextPair({
			seqNum: precedingSeqNum,
			isClientOnly: isClientOnlyEvent(event),
			rebaseGeneration: event.seqNum.rebaseGeneration
		});
		if (isEqual(event.seqNum, expectedPair.seqNum) === false || isSameSequencePosition(event.parentSeqNum, expectedPair.parentSeqNum) === false) return yield* NonContiguousBatchError.make({
			expectedSeqNum: expectedPair.seqNum,
			providedSeqNum: event.seqNum,
			expectedParentSeqNum: expectedPair.parentSeqNum,
			providedParentSeqNum: event.parentSeqNum,
			violationIndex: i,
			sessionId: event.sessionId
		});
		precedingSeqNum = event.seqNum;
	}
});
/**
* Parent linkage identifies a position in the event chain. Rebase generation describes the version
* of optimistic history, so it is validated on the event itself rather than as part of parent identity.
*/
var isSameSequencePosition = (left, right) => left.global === right.global && left.client === right.client;
/**
* Handles a BackendIdMismatchError based on the configured behavior.
* This occurs when the sync backend has been reset and has a new identity.
*/
var handleBackendIdMismatch = Effect_exports.fn("@livestore/common:LeaderSyncProcessor:handleBackendIdMismatch")(function* ({ error, onBackendIdMismatch, shutdownChannel }) {
	const { dbEventlog, dbState } = yield* LeaderThreadCtx;
	if (onBackendIdMismatch === "reset") {
		yield* Effect_exports.logWarning("Sync backend identity changed (backend was reset). Clearing local storage and shutting down.", error);
		yield* clearLocalDatabases({
			dbEventlog,
			dbState
		});
		yield* shutdownChannel.send(IntentionalShutdownCause.make({ reason: "backend-id-mismatch" })).pipe(Effect_exports.orDie);
		return yield* Effect_exports.die(error);
	}
	if (onBackendIdMismatch === "shutdown") {
		yield* Effect_exports.logWarning("Sync backend identity changed (backend was reset). Shutting down without clearing local storage.", error);
		yield* shutdownChannel.send(error).pipe(Effect_exports.orDie);
		return yield* Effect_exports.die(error);
	}
	if (LS_DEV === true) yield* Effect_exports.logDebug("Ignoring BackendIdMismatchError (sync backend was reset but client continues with stale data)", error);
});
/**
* Clears local databases (eventlog and state) so the client can start fresh on next boot.
* This is used when the sync backend identity has changed (i.e. backend was reset).
*/
var clearLocalDatabases = ({ dbEventlog, dbState }) => Effect_exports.sync(() => {
	dbEventlog.execute(sql`DELETE FROM ${EVENTLOG_META_TABLE}`);
	dbEventlog.execute(sql`DELETE FROM ${SYNC_STATUS_TABLE}`);
	const tables = dbState.select(sql`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`);
	for (const { name } of tables) dbState.execute(`DROP TABLE IF EXISTS "${name}"`);
});
var snapshotTxQueue = (queue) => Effect_exports.tx(Effect_exports.gen(function* () {
	const items = yield* clear$2(queue);
	yield* offerAll$1(queue, items);
	return items;
}));
var takePrefixUntil = (queue, predicate) => Effect_exports.tx(Effect_exports.gen(function* () {
	const items = yield* clear$2(queue);
	const [prefix, rest] = splitWhere(items, predicate);
	yield* offerAll$1(queue, rest);
	return prefix;
}));
/** Serialize value to JSON string for trace attributes */
var jsonStringify = Schema_exports.encodeSync(Schema_exports.fromJsonString(Schema_exports.Unknown));
var recreateDb = ({ dbState, dbEventlog, schema, bootStatusQueue, materializeEvent }) => Effect_exports.gen(function* () {
	const hooks = schema.state.sqlite.migrations.hooks;
	yield* Effect_exports.addFinalizer(Effect_exports.fn("recreateDb:finalizer")(function* (ex) {
		if (ex._tag === "Failure") dbState.destroy();
	}));
	const tmpDb = dbState;
	yield* configureConnection(tmpDb, { foreignKeys: true });
	yield* trySyncOrPromiseOrEffect(() => hooks?.init?.(tmpDb)).pipe(UnknownError$1.mapToUnknownError);
	const migrationsReport = yield* migrateDb({
		db: tmpDb,
		schema,
		onProgress: ({ done, total }) => offer$1(bootStatusQueue, {
			stage: "migrating",
			progress: {
				done,
				total
			}
		})
	});
	yield* trySyncOrPromiseOrEffect(() => hooks?.pre?.(tmpDb)).pipe(UnknownError$1.mapToUnknownError);
	yield* rematerializeFromEventlog({
		dbEventlog,
		schema,
		materializeEvent,
		onProgress: ({ done, total }) => offer$1(bootStatusQueue, {
			stage: "rehydrating",
			progress: {
				done,
				total
			}
		})
	});
	yield* trySyncOrPromiseOrEffect(() => hooks?.post?.(tmpDb)).pipe(UnknownError$1.mapToUnknownError);
	return { migrationsReport };
}).pipe(Effect_exports.scoped, Effect_exports.withSpan("@livestore/common:leader-thread:recreateDb"), withPerformanceMeasure("@livestore/common:leader-thread:recreateDb"));
var makeLeaderThreadLayer = ({ schema, storeId, clientId, syncPayloadSchema = Schema_exports.Json, syncPayloadEncoded, makeSqliteDb, syncOptions, dbState, dbEventlog, devtoolsOptions, shutdownChannel, bootWarning, params, testing }) => Effect_exports.gen(function* () {
	const syncPayloadDecoded = syncPayloadEncoded === void 0 ? void 0 : yield* Schema_exports.decodeUnknownEffect(syncPayloadSchema)(syncPayloadEncoded);
	const bootStatusQueue = yield* Effect_exports.acquireRelease(unbounded(), shutdown);
	if (bootWarning !== void 0) yield* offer$1(bootStatusQueue, bootWarning);
	const dbEventlogMissing = !hasEventlogTables(dbEventlog);
	const dbStateMissing = !hasStateTables(dbState);
	yield* initEventlogDb(dbEventlog);
	const syncBackend = syncOptions?.backend === void 0 ? void 0 : yield* syncOptions.backend({
		storeId,
		clientId,
		payload: syncPayloadDecoded
	}).pipe(Effect_exports.provide(succeed$4(KeyValueStore, makeStringOnly({
		get: (_key) => Effect_exports.sync(() => getBackendIdFromDb(dbEventlog)).pipe(Effect_exports.map(getOrUndefined), Effect_exports.catchDefect((cause) => new KeyValueStoreError({
			method: "getBackendIdFromDb",
			message: "Failed to get backendId",
			cause
		}))),
		set: (_key, value) => Effect_exports.sync(() => updateBackendId(dbEventlog, value)).pipe(Effect_exports.catchDefect((cause) => new KeyValueStoreError({
			method: "updateBackendId",
			message: "Failed to update backendId",
			cause
		}))),
		clear: Effect_exports.die(/* @__PURE__ */ new Error(`Not implemented. Should never be used.`)),
		remove: () => Effect_exports.die(/* @__PURE__ */ new Error(`Not implemented. Should never be used.`)),
		size: Effect_exports.die(/* @__PURE__ */ new Error(`Not implemented. Should never be used.`))
	}))));
	if (syncBackend !== void 0) yield* syncBackend.connect.pipe(tapCauseLogPretty, Effect_exports.forkScoped);
	const initialBlockingSyncContext = yield* makeInitialBlockingSyncContext({
		initialSyncOptions: syncOptions?.initialSyncOptions ?? { _tag: "Skip" },
		bootStatusQueue
	});
	const materializeEvent = yield* makeMaterializeEvent({
		schema,
		dbState,
		dbEventlog
	});
	const { migrationsReport } = dbStateMissing === true ? yield* recreateDb({
		dbState,
		dbEventlog,
		schema,
		bootStatusQueue,
		materializeEvent
	}) : { migrationsReport: { migrations: [] } };
	const syncProcessor = yield* make({
		schema,
		dbState,
		initialSyncState: getInitialSyncState({
			dbEventlog,
			dbState,
			dbEventlogMissing
		}),
		initialBlockingSyncContext,
		onError: syncOptions?.onSyncError ?? "ignore",
		onBackendIdMismatch: syncOptions?.onBackendIdMismatch ?? "reset",
		livePull: syncOptions?.livePull ?? true,
		params: { ...omitUndefineds({
			localPushBatchSize: params?.localPushBatchSize,
			backendPushBatchSize: params?.backendPushBatchSize
		}) },
		testing: { ...omitUndefineds({
			delays: testing?.syncProcessor?.delays,
			hooks: testing?.syncProcessor?.hooks
		}) }
	});
	const extraIncomingMessagesQueue = yield* Effect_exports.acquireRelease(unbounded(), shutdown);
	const devtoolsContext = devtoolsOptions.enabled === true ? {
		enabled: true,
		syncBackendLatch: yield* make$9(true),
		syncBackendLatchState: yield* SubscriptionRef_exports.make({ latchClosed: false })
	} : { enabled: false };
	const networkStatus = yield* makeNetworkStatusSubscribable({
		syncBackend,
		devtoolsContext
	});
	const ctx = {
		schema,
		bootStatusQueue,
		storeId,
		clientId,
		dbState,
		dbEventlog,
		makeSqliteDb,
		eventSchema: makeSchema$1(schema),
		shutdownStateSubRef: yield* SubscriptionRef_exports.make("running"),
		shutdownChannel,
		syncBackend,
		syncProcessor,
		materializeEvent,
		extraIncomingMessagesQueue,
		devtools: devtoolsContext,
		networkStatus,
		initialState: {}
	};
	globalThis.__leaderThreadCtx = ctx;
	const layer = succeed$4(LeaderThreadCtx, LeaderThreadCtx.of(ctx));
	ctx.initialState = yield* bootLeaderThread({
		migrationsReport,
		initialBlockingSyncContext,
		devtoolsOptions
	}).pipe(Effect_exports.provide(layer));
	return layer;
}).pipe(Effect_exports.withSpan("@livestore/common:leader-thread:boot"), Effect_exports.withSpanScoped("@livestore/common:leader-thread"), UnknownError$1.mapToUnknownError, tapCauseLogPretty, unwrap);
var hasEventlogTables = (db) => {
	const tableNames = new Set(db.select(sql`select name from sqlite_master`).map((_) => _.name));
	return every(eventlogSystemTables, (_) => tableNames.has(_.sqliteDef.name));
};
var hasStateTables = (db) => {
	const tableNames = new Set(db.select(sql`select name from sqlite_master`).map((_) => _.name));
	return every(stateSystemTables, (_) => tableNames.has(_.sqliteDef.name));
};
var getInitialSyncState = ({ dbEventlog, dbState, dbEventlogMissing }) => {
	const initialBackendHead = dbEventlogMissing === true ? ROOT.global : getBackendHeadFromDb(dbEventlog);
	const initialLocalHead = dbEventlogMissing === true ? ROOT : getClientHeadFromDb(dbEventlog);
	if (initialBackendHead > initialLocalHead.global) return shouldNeverHappen(`During boot the backend head (${initialBackendHead}) should never be greater than the local head (${initialLocalHead.global})`);
	return SyncState.make({
		localHead: initialLocalHead,
		upstreamHead: {
			global: initialBackendHead,
			client: DEFAULT,
			rebaseGeneration: 0
		},
		pending: dbEventlogMissing === true ? [] : getEventsSince({
			dbEventlog,
			dbState,
			since: {
				global: initialBackendHead,
				client: DEFAULT,
				rebaseGeneration: initialLocalHead.rebaseGeneration
			}
		})
	});
};
var makeInitialBlockingSyncContext = ({ initialSyncOptions, bootStatusQueue }) => Effect_exports.gen(function* () {
	const ctx = {
		isDone: false,
		processedEvents: 0,
		total: -1
	};
	const blockingDeferred = initialSyncOptions._tag === "Blocking" ? yield* make$6() : void 0;
	if (blockingDeferred !== void 0 && initialSyncOptions._tag === "Blocking") yield* succeed$2(blockingDeferred, void 0).pipe(Effect_exports.delay(initialSyncOptions.timeout), Effect_exports.forkScoped);
	return {
		blockingDeferred,
		update: ({ processed, pageInfo }) => Effect_exports.gen(function* () {
			if (ctx.isDone === true) return;
			if (ctx.total === -1 && pageInfo._tag === "MoreKnown") ctx.total = pageInfo.remaining + processed;
			ctx.processedEvents += processed;
			yield* offer$1(bootStatusQueue, {
				stage: "syncing",
				progress: {
					done: ctx.processedEvents,
					total: ctx.total
				}
			});
			if (pageInfo._tag === "NoMore" && blockingDeferred !== void 0) {
				yield* succeed$2(blockingDeferred, void 0);
				ctx.isDone = true;
			}
		})
	};
});
/**
* Blocks until the leader thread has finished its initial setup.
* It also starts various background processes (e.g. syncing)
*/
var bootLeaderThread = ({ migrationsReport, initialBlockingSyncContext, devtoolsOptions }) => Effect_exports.gen(function* () {
	const { bootStatusQueue, syncProcessor } = yield* LeaderThreadCtx;
	const { initialLeaderHead } = yield* syncProcessor.boot;
	if (initialBlockingSyncContext.blockingDeferred !== void 0) {
		yield* offer$1(bootStatusQueue, {
			stage: "syncing",
			progress: {
				done: 0,
				total: -1
			}
		});
		yield* _await(initialBlockingSyncContext.blockingDeferred).pipe(Effect_exports.withSpan("@livestore/common:leader-thread:initial-sync-blocking"));
	}
	yield* offer$1(bootStatusQueue, { stage: "done" });
	yield* bootDevtools(devtoolsOptions).pipe(tapCauseLogPretty, Effect_exports.forkScoped);
	return {
		migrationsReport,
		leaderHead: initialLeaderHead
	};
});
/** @internal */
var makeNetworkStatusSubscribable = ({ syncBackend, devtoolsContext }) => Effect_exports.gen(function* () {
	const initialIsConnected = syncBackend !== void 0 ? yield* SubscriptionRef_exports.get(syncBackend.isConnected) : false;
	const initialLatchClosed = devtoolsContext.enabled === true ? (yield* SubscriptionRef_exports.get(devtoolsContext.syncBackendLatchState)).latchClosed : false;
	const networkStatusRef = yield* SubscriptionRef_exports.make({
		isConnected: initialIsConnected,
		timestampMs: Date.now(),
		devtools: { latchClosed: initialLatchClosed }
	});
	const updateNetworkStatus = (patch) => SubscriptionRef_exports.update(networkStatusRef, (previous) => ({
		isConnected: patch.isConnected ?? previous.isConnected,
		timestampMs: Date.now(),
		devtools: { latchClosed: patch.latchClosed ?? previous.devtools.latchClosed }
	}));
	if (syncBackend !== void 0) yield* SubscriptionRef_exports.changes(syncBackend.isConnected).pipe(Stream_exports.tap((isConnected) => updateNetworkStatus({ isConnected })), Stream_exports.runDrain, Effect_exports.interruptible, tapCauseLogPretty, Effect_exports.forkScoped);
	if (devtoolsContext.enabled === true) yield* SubscriptionRef_exports.changes(devtoolsContext.syncBackendLatchState).pipe(Stream_exports.tap(({ latchClosed }) => updateNetworkStatus({ latchClosed })), Stream_exports.runDrain, Effect_exports.interruptible, tapCauseLogPretty, Effect_exports.forkScoped);
	return fromSubscriptionRef(networkStatusRef);
});
var All = Schema_exports.Union([
	IntentionalShutdownCause,
	UnknownError$1,
	BackendIdMismatchError,
	MaterializeError
]);
/**
* Streams events for leader-thread adapters.
*
* Provides a continuous stream from the eventlog as the upstream head advances.
* When an until event is passed in the stream finalizes upon reaching it.
*
* The batch size is set to 100 by default as this was meassured to provide the
* best performance and 1000 as the upper limit.
*
* Adapters that call this helper include:
* - `packages/@livestore/adapter-web/src/in-memory/in-memory-adapter.ts`
* - `packages/@livestore/adapter-web/src/web-worker/leader-worker/make-leader-worker.ts`
* - `packages/@livestore/adapter-cloudflare/src/make-adapter.ts`
* - external leader-thread adapters
*
* Each caller resolves dependencies inside the leader scope before invoking this helper,
* so the stream stays environment-agnostic and does not leak `LeaderThreadCtx` into runtime
* entry points such as `Store.eventsStream`.
*
* Test files:
* Integration: `packages/@livestore/livestore/src/store/store-eventstream.test.ts`
* Performance: `tests/perf-eventlog/tests/suites/event-streaming.test.ts`
*
* Optimization explorations
*
* In order to alleviate the occurence of many small queries when the syncState
* is sequentially progressing quickly we have explored some time-based batching
* approaches. It remains to be determined if and when the added complexity of
* these approaches are worth the benefit. They come with some drawbacks such as
* degraded time to first event or general performance degredation for larger
* query steps. These aspects can likely be mitigated with some more work but
* that is best assessed when we have a final implementation of event streaming
* with support for session and leader level streams.
*
* Fetch plans into a Sink
* https://gist.github.com/slashv/f1223689f2d1171d2eeb60a2823f4c7c
*
* Fetch plans into sink and decompose into windows
* https://gist.github.com/slashv/a8f55f50121c080937f42e44b4039ac8
*
* Queue and Latch approach (suggestion by Tim Smart)
* https://gist.github.com/slashv/d6b12395c85415bf0d3363372a1636c3
*/
var streamEventsWithSyncState = ({ dbEventlog, syncState, options }) => {
	const initialCursor = options.since ?? ROOT;
	const batchSize = options.batchSize ?? 100;
	return Stream_exports.unwrap(Effect_exports.gen(function* () {
		/**
		* Single-element Queue allows suspending the event stream until head
		* advances because Queue.take is a suspending effect. SubscriptionRef in
		* comparrison lacks a primitive for suspending a stream until a new value
		* is set and would require polling.
		*
		* The use of a sliding Queue here is useful since it ensures only the
		* lastest head from syncState is the one present on the queue without the
		* need for manual substitution.
		*/
		const headQueue = yield* sliding(1);
		/**
		* We run a separate fiber which listens to changes in syncState and
		* offer the latest head to the headQueue. Keeping track of the previous
		* value is done to prevent syncState changes unrelated to the
		* upstreamHead triggering empty queries.
		*
		* When we implement support for leader and session level streams
		* this will need to be adapted to support the relevant value from
		* syncState that we are interested in tracking.
		*/
		let prevGlobalHead = -1;
		yield* syncState.changes.pipe(Stream_exports.map((state) => state.upstreamHead), Stream_exports.filter((head) => {
			if (head.global > prevGlobalHead) {
				prevGlobalHead = head.global;
				return true;
			}
			return false;
		}), Stream_exports.runForEach((head) => offer$1(headQueue, head)), Effect_exports.forkScoped);
		return Stream_exports.paginate({
			cursor: initialCursor,
			head: ROOT
		}, ({ cursor, head }) => Effect_exports.gen(function* () {
			/**
			* Early check guards agains:
			* since === until : Prevent empty query
			* since > until : Incorrectly inverted interval
			*/
			if (options.until !== void 0 && isGreaterThanOrEqual(cursor, options.until) === true) return [[], none()];
			/**
			* There are two scenarios where we take the next head from the headQueue:
			*
			* 1. We need to wait for the head to advance
			* The Stream suspends until a new head is available on the headQueue
			*
			* 2. Head has advanced during itteration
			* While itterating towards the lastest head taken from the headQueue
			* in increments of batchSize it's possible the head could have
			* advanced. This leads to a suboptimal amount of queries. Therefor we
			* check if the headQueue is full which tells us that there's a new
			* head available to take. Example:
			*
			* batchSize: 2
			*
			* --> head at: e3
			* First query: e0 -> e2 (two events)
			* --> head advances to: e4
			* Second query: e2 -> e3 (one event but we could have taken 2)
			* --> Take the new head of e4
			* Third query: e3 -> e4 (unnecessary third query)
			*
			*
			* To define the target, which will be used as the temporary until
			* marker for the eventlog query, we select the lowest of three possible values:
			*
			* hardStop: A user supplied until marker
			* current cursor + batchSize: A batchSize step towards the latest head from headQueue
			* nextHead: The latest head from headQueue
			*/
			const waitForHead = isGreaterThanOrEqual(cursor, head);
			const maybeHead = waitForHead === true ? yield* take$1(headQueue).pipe(Effect_exports.map(some)) : yield* poll(headQueue);
			const nextHead = getOrElse(maybeHead, () => head);
			const hardStop = options.until?.global ?? Number.POSITIVE_INFINITY;
			const target = Composite.make({
				global: Math.min(hardStop, cursor.global + batchSize, nextHead.global),
				client: DEFAULT
			});
			/**
			* Eventlog.getEventsFromEventlog returns a batch from each query
			* which is what we emit at each itteration.
			*/
			const events = yield* getEventsFromEventlog({
				dbEventlog,
				options: {
					...options,
					since: cursor,
					until: target
				}
			});
			const nextState = (options.until !== void 0 && isGreaterThanOrEqual(target, options.until)) === true ? none() : some({
				cursor: target,
				head: nextHead
			});
			const spanAttributes = {
				"livestore.streamEvents.cursor.global": cursor.global,
				"livestore.streamEvents.target.global": target.global,
				"livestore.streamEvents.batchSize": batchSize,
				"livestore.streamEvents.waitedForHead": waitForHead
			};
			const result = [events, nextState];
			return yield* Effect_exports.succeed(result).pipe(Effect_exports.withSpan("@livestore/common:streamEvents:segment", { attributes: spanAttributes }));
		}));
	}));
};
var SQLITE_IOERR_ACCESS = 3338;
var SQLITE_IOERR_CLOSE = 4106;
var SQLITE_IOERR_DELETE = 2570;
var SQLITE_IOERR_FSTAT = 1802;
var SQLITE_IOERR_FSYNC = 1034;
var SQLITE_IOERR_TRUNCATE = 1546;
var SQLITE_OPEN_TRANSIENT_DB = 1024;
var SQLITE_OPEN_MAIN_JOURNAL = 2048;
var SQLITE_OPEN_TEMP_JOURNAL = 4096;
var SQLITE_OPEN_SUBJOURNAL = 8192;
var SQLITE_OPEN_SUPER_JOURNAL = 16384;
var SQLITE_OPEN_WAL = 524288;
var SQLITE_IOCAP_UNDELETABLE_WHEN_OPEN = 2048;
var DEFAULT_SECTOR_SIZE = 512;
var Base = class {
	name;
	mxPathname = 64;
	_module;
	/**
	* @param {string} name
	* @param {object} module
	*/
	constructor(name, module) {
		this.name = name;
		this._module = module;
	}
	/**
	* @returns {void|Promise<void>}
	*/
	close() {}
	/**
	* @returns {boolean|Promise<boolean>}
	*/
	isReady() {
		return true;
	}
	/**
	* Overload in subclasses to indicate which methods are asynchronous.
	* @param {string} methodName
	* @returns {boolean}
	*/
	hasAsyncMethod(methodName) {
		return false;
	}
	/**
	* @param {number} pVfs
	* @param {number} zName
	* @param {number} pFile
	* @param {number} flags
	* @param {number} pOutFlags
	* @returns {number|Promise<number>}
	*/
	xOpen(pVfs, zName, pFile, flags, pOutFlags) {
		return 14;
	}
	/**
	* @param {number} pVfs
	* @param {number} zName
	* @param {number} syncDir
	* @returns {number|Promise<number>}
	*/
	xDelete(pVfs, zName, syncDir) {
		return 0;
	}
	/**
	* @param {number} pVfs
	* @param {number} zName
	* @param {number} flags
	* @param {number} pResOut
	* @returns {number|Promise<number>}
	*/
	xAccess(pVfs, zName, flags, pResOut) {
		return 0;
	}
	/**
	* @param {number} pVfs
	* @param {number} zName
	* @param {number} nOut
	* @param {number} zOut
	* @returns {number|Promise<number>}
	*/
	xFullPathname(pVfs, zName, nOut, zOut) {
		return 0;
	}
	/**
	* @param {number} pVfs
	* @param {number} nBuf
	* @param {number} zBuf
	* @returns {number|Promise<number>}
	*/
	xGetLastError(pVfs, nBuf, zBuf) {
		return 0;
	}
	/**
	* @param {number} pFile
	* @returns {number|Promise<number>}
	*/
	xClose(pFile) {
		return 0;
	}
	/**
	* @param {number} pFile
	* @param {number} pData
	* @param {number} iAmt
	* @param {number} iOffsetLo
	* @param {number} iOffsetHi
	* @returns {number|Promise<number>}
	*/
	xRead(pFile, pData, iAmt, iOffsetLo, iOffsetHi) {
		return 0;
	}
	/**
	* @param {number} pFile
	* @param {number} pData
	* @param {number} iAmt
	* @param {number} iOffsetLo
	* @param {number} iOffsetHi
	* @returns {number|Promise<number>}
	*/
	xWrite(pFile, pData, iAmt, iOffsetLo, iOffsetHi) {
		return 0;
	}
	/**
	* @param {number} pFile
	* @param {number} sizeLo
	* @param {number} sizeHi
	* @returns {number|Promise<number>}
	*/
	xTruncate(pFile, sizeLo, sizeHi) {
		return 0;
	}
	/**
	* @param {number} pFile
	* @param {number} flags
	* @returns {number|Promise<number>}
	*/
	xSync(pFile, flags) {
		return 0;
	}
	/**
	*
	* @param {number} pFile
	* @param {number} pSize
	* @returns {number|Promise<number>}
	*/
	xFileSize(pFile, pSize) {
		return 0;
	}
	/**
	* @param {number} pFile
	* @param {number} lockType
	* @returns {number|Promise<number>}
	*/
	xLock(pFile, lockType) {
		return 0;
	}
	/**
	* @param {number} pFile
	* @param {number} lockType
	* @returns {number|Promise<number>}
	*/
	xUnlock(pFile, lockType) {
		return 0;
	}
	/**
	* @param {number} pFile
	* @param {number} pResOut
	* @returns {number|Promise<number>}
	*/
	xCheckReservedLock(pFile, pResOut) {
		return 0;
	}
	/**
	* @param {number} pFile
	* @param {number} op
	* @param {number} pArg
	* @returns {number|Promise<number>}
	*/
	xFileControl(pFile, op, pArg) {
		return 12;
	}
	/**
	* @param {number} pFile
	* @returns {number|Promise<number>}
	*/
	xSectorSize(pFile) {
		return DEFAULT_SECTOR_SIZE;
	}
	/**
	* @param {number} pFile
	* @returns {number|Promise<number>}
	*/
	xDeviceCharacteristics(pFile) {
		return 0;
	}
};
[
	256,
	SQLITE_OPEN_MAIN_JOURNAL,
	512,
	SQLITE_OPEN_TEMP_JOURNAL,
	SQLITE_OPEN_TRANSIENT_DB,
	SQLITE_OPEN_SUBJOURNAL,
	SQLITE_OPEN_SUPER_JOURNAL,
	SQLITE_OPEN_WAL
].reduce((mask, element) => mask | element);
var AsyncFunction$1 = Object.getPrototypeOf(async function() {}).constructor;
var FacadeVFS$1 = class extends Base {
	/**
	* @param {string} name
	* @param {object} module
	*/
	/**
	* Override to indicate which methods are asynchronous.
	* @param {string} methodName
	* @returns {boolean}
	*/
	hasAsyncMethod(methodName) {
		const jMethodName = `j${methodName.slice(1)}`;
		return this[jMethodName] instanceof AsyncFunction$1;
	}
	/**
	* Return the filename for a file id for use by mixins.
	* @param {number} pFile
	* @returns {string}
	*/
	getFilename(pFile) {
		throw new Error("unimplemented");
	}
	/**
	* @param {string?} filename
	* @param {number} pFile
	* @param {number} flags
	* @param {DataView} pOutFlags
	* @returns {number|Promise<number>}
	*/
	jOpen(filename, pFile, flags, pOutFlags) {
		return 14;
	}
	/**
	* @param {string} filename
	* @param {number} syncDir
	* @returns {number|Promise<number>}
	*/
	jDelete(filename, syncDir) {
		return 0;
	}
	/**
	* @param {string} filename
	* @param {number} flags
	* @param {DataView} pResOut
	* @returns {number|Promise<number>}
	*/
	jAccess(filename, flags, pResOut) {
		return 0;
	}
	/**
	* @param {string} filename
	* @param {Uint8Array} zOut
	* @returns {number|Promise<number>}
	*/
	jFullPathname(filename, zOut) {
		const { read, written } = new TextEncoder().encodeInto(filename, zOut);
		if (read < filename.length) return 10;
		if (written >= zOut.length) return 10;
		zOut[written] = 0;
		return 0;
	}
	/**
	* @param {Uint8Array} zBuf
	* @returns {number|Promise<number>}
	*/
	jGetLastError(zBuf) {
		return 0;
	}
	/**
	* @param {number} pFile
	* @returns {number|Promise<number>}
	*/
	jClose(pFile) {
		return 0;
	}
	/**
	* @param {number} pFile
	* @param {Uint8Array} pData
	* @param {number} iOffset
	* @returns {number|Promise<number>}
	*/
	jRead(pFile, pData, iOffset) {
		pData.fill(0);
		return 522;
	}
	/**
	* @param {number} pFile
	* @param {Uint8Array} pData
	* @param {number} iOffset
	* @returns {number|Promise<number>}
	*/
	jWrite(pFile, pData, iOffset) {
		return 778;
	}
	/**
	* @param {number} pFile
	* @param {number} size
	* @returns {number|Promise<number>}
	*/
	jTruncate(pFile, size) {
		return 0;
	}
	/**
	* @param {number} pFile
	* @param {number} flags
	* @returns {number|Promise<number>}
	*/
	jSync(pFile, flags) {
		return 0;
	}
	/**
	* @param {number} pFile
	* @param {DataView} pSize
	* @returns {number|Promise<number>}
	*/
	jFileSize(pFile, pSize) {
		return 0;
	}
	/**
	* @param {number} pFile
	* @param {number} lockType
	* @returns {number|Promise<number>}
	*/
	jLock(pFile, lockType) {
		return 0;
	}
	/**
	* @param {number} pFile
	* @param {number} lockType
	* @returns {number|Promise<number>}
	*/
	jUnlock(pFile, lockType) {
		return 0;
	}
	/**
	* @param {number} pFile
	* @param {DataView} pResOut
	* @returns {number|Promise<number>}
	*/
	jCheckReservedLock(pFile, pResOut) {
		pResOut.setInt32(0, 0, true);
		return 0;
	}
	/**
	* @param {number} pFile
	* @param {number} op
	* @param {DataView} pArg
	* @returns {number|Promise<number>}
	*/
	jFileControl(pFile, op, pArg) {
		return 12;
	}
	/**
	* @param {number} pFile
	* @returns {number|Promise<number>}
	*/
	jSectorSize(pFile) {
		return super.xSectorSize(pFile);
	}
	/**
	* @param {number} pFile
	* @returns {number|Promise<number>}
	*/
	jDeviceCharacteristics(pFile) {
		return 0;
	}
	/**
	* @param {number} pVfs
	* @param {number} zName
	* @param {number} pFile
	* @param {number} flags
	* @param {number} pOutFlags
	* @returns {number|Promise<number>}
	*/
	xOpen(pVfs, zName, pFile, flags, pOutFlags) {
		const filename = this.#decodeFilename(zName, flags);
		const pOutFlagsView = this.#makeTypedDataView("Int32", pOutFlags);
		this["log"]?.("jOpen", filename, pFile, "0x" + flags.toString(16));
		return this.jOpen(filename, pFile, flags, pOutFlagsView);
	}
	/**
	* @param {number} pVfs
	* @param {number} zName
	* @param {number} syncDir
	* @returns {number|Promise<number>}
	*/
	xDelete(pVfs, zName, syncDir) {
		const filename = this._module.UTF8ToString(zName);
		this["log"]?.("jDelete", filename, syncDir);
		return this.jDelete(filename, syncDir);
	}
	/**
	* @param {number} pVfs
	* @param {number} zName
	* @param {number} flags
	* @param {number} pResOut
	* @returns {number|Promise<number>}
	*/
	xAccess(pVfs, zName, flags, pResOut) {
		const filename = this._module.UTF8ToString(zName);
		const pResOutView = this.#makeTypedDataView("Int32", pResOut);
		this["log"]?.("jAccess", filename, flags);
		return this.jAccess(filename, flags, pResOutView);
	}
	/**
	* @param {number} pVfs
	* @param {number} zName
	* @param {number} nOut
	* @param {number} zOut
	* @returns {number|Promise<number>}
	*/
	xFullPathname(pVfs, zName, nOut, zOut) {
		const filename = this._module.UTF8ToString(zName);
		const zOutArray = this._module.HEAPU8.subarray(zOut, zOut + nOut);
		this["log"]?.("jFullPathname", filename, nOut);
		return this.jFullPathname(filename, zOutArray);
	}
	/**
	* @param {number} pVfs
	* @param {number} nBuf
	* @param {number} zBuf
	* @returns {number|Promise<number>}
	*/
	xGetLastError(pVfs, nBuf, zBuf) {
		const zBufArray = this._module.HEAPU8.subarray(zBuf, zBuf + nBuf);
		this["log"]?.("jGetLastError", nBuf);
		return this.jGetLastError(zBufArray);
	}
	/**
	* @param {number} pFile
	* @returns {number|Promise<number>}
	*/
	xClose(pFile) {
		this["log"]?.("jClose", pFile);
		return this.jClose(pFile);
	}
	/**
	* @param {number} pFile
	* @param {number} pData
	* @param {number} iAmt
	* @param {number} iOffsetLo
	* @param {number} iOffsetHi
	* @returns {number|Promise<number>}
	*/
	xRead(pFile, pData, iAmt, iOffsetLo, iOffsetHi) {
		const pDataArray = this.#makeDataArray(pData, iAmt);
		const iOffset = delegalize$1(iOffsetLo, iOffsetHi);
		this["log"]?.("jRead", pFile, iAmt, iOffset);
		return this.jRead(pFile, pDataArray, iOffset);
	}
	/**
	* @param {number} pFile
	* @param {number} pData
	* @param {number} iAmt
	* @param {number} iOffsetLo
	* @param {number} iOffsetHi
	* @returns {number|Promise<number>}
	*/
	xWrite(pFile, pData, iAmt, iOffsetLo, iOffsetHi) {
		const pDataArray = this.#makeDataArray(pData, iAmt);
		const iOffset = delegalize$1(iOffsetLo, iOffsetHi);
		this["log"]?.("jWrite", pFile, pDataArray, iOffset);
		return this.jWrite(pFile, pDataArray, iOffset);
	}
	/**
	* @param {number} pFile
	* @param {number} sizeLo
	* @param {number} sizeHi
	* @returns {number|Promise<number>}
	*/
	xTruncate(pFile, sizeLo, sizeHi) {
		const size = delegalize$1(sizeLo, sizeHi);
		this["log"]?.("jTruncate", pFile, size);
		return this.jTruncate(pFile, size);
	}
	/**
	* @param {number} pFile
	* @param {number} flags
	* @returns {number|Promise<number>}
	*/
	xSync(pFile, flags) {
		this["log"]?.("jSync", pFile, flags);
		return this.jSync(pFile, flags);
	}
	/**
	*
	* @param {number} pFile
	* @param {number} pSize
	* @returns {number|Promise<number>}
	*/
	xFileSize(pFile, pSize) {
		const pSizeView = this.#makeTypedDataView("BigInt64", pSize);
		this["log"]?.("jFileSize", pFile);
		return this.jFileSize(pFile, pSizeView);
	}
	/**
	* @param {number} pFile
	* @param {number} lockType
	* @returns {number|Promise<number>}
	*/
	xLock(pFile, lockType) {
		this["log"]?.("jLock", pFile, lockType);
		return this.jLock(pFile, lockType);
	}
	/**
	* @param {number} pFile
	* @param {number} lockType
	* @returns {number|Promise<number>}
	*/
	xUnlock(pFile, lockType) {
		this["log"]?.("jUnlock", pFile, lockType);
		return this.jUnlock(pFile, lockType);
	}
	/**
	* @param {number} pFile
	* @param {number} pResOut
	* @returns {number|Promise<number>}
	*/
	xCheckReservedLock(pFile, pResOut) {
		const pResOutView = this.#makeTypedDataView("Int32", pResOut);
		this["log"]?.("jCheckReservedLock", pFile);
		return this.jCheckReservedLock(pFile, pResOutView);
	}
	/**
	* @param {number} pFile
	* @param {number} op
	* @param {number} pArg
	* @returns {number|Promise<number>}
	*/
	xFileControl(pFile, op, pArg) {
		const pArgView = new DataView(this._module.HEAPU8.buffer, this._module.HEAPU8.byteOffset + pArg);
		this["log"]?.("jFileControl", pFile, op, pArgView);
		return this.jFileControl(pFile, op, pArgView);
	}
	/**
	* @param {number} pFile
	* @returns {number|Promise<number>}
	*/
	xSectorSize(pFile) {
		this["log"]?.("jSectorSize", pFile);
		return this.jSectorSize(pFile);
	}
	/**
	* @param {number} pFile
	* @returns {number|Promise<number>}
	*/
	xDeviceCharacteristics(pFile) {
		this["log"]?.("jDeviceCharacteristics", pFile);
		return this.jDeviceCharacteristics(pFile);
	}
	/**
	* Wrapped DataView for pointer arguments.
	* Pointers to a single value are passed using a DataView-like class.
	* This wrapper class prevents use of incorrect type or endianness, and
	* reacquires the underlying buffer when the WebAssembly memory is resized.
	* @param {'Int32'|'BigInt64'} type
	* @param {number} byteOffset
	* @returns {DataView}
	*/
	#makeTypedDataView(type, byteOffset) {
		return new DataViewProxy(this._module, byteOffset, type);
	}
	/**
	* Wrapped Uint8Array for buffer arguments.
	* Memory blocks are passed as a Uint8Array-like class. This wrapper
	* class reacquires the underlying buffer when the WebAssembly memory
	* is resized.
	* @param {number} byteOffset
	* @param {number} byteLength
	* @returns {Uint8Array}
	*/
	#makeDataArray(byteOffset, byteLength) {
		return new Uint8ArrayProxy(this._module, byteOffset, byteLength);
	}
	#decodeFilename(zName, flags) {
		if (flags & 64) {
			let pName = zName;
			let state = 1;
			const charCodes = [];
			while (state) {
				const charCode = this._module.HEAPU8[pName++];
				if (charCode) charCodes.push(charCode);
				else {
					if (!this._module.HEAPU8[pName]) state = null;
					switch (state) {
						case 1:
							charCodes.push("?".charCodeAt(0));
							state = 2;
							break;
						case 2:
							charCodes.push("=".charCodeAt(0));
							state = 3;
							break;
						case 3:
							charCodes.push("&".charCodeAt(0));
							state = 2;
					}
				}
			}
			return new TextDecoder().decode(new Uint8Array(charCodes));
		}
		return zName ? this._module.UTF8ToString(zName) : null;
	}
};
function delegalize$1(lo32, hi32) {
	return hi32 * 4294967296 + lo32 + (lo32 < 0 ? 2 ** 32 : 0);
}
var Uint8ArrayProxy = class {
	#module;
	#_array = /* @__PURE__ */ new Uint8Array();
	get #array() {
		if (this.#_array.buffer.byteLength === 0) this.#_array = this.#module.HEAPU8.subarray(this.byteOffset, this.byteOffset + this.byteLength);
		return this.#_array;
	}
	/**
	* @param {*} module
	* @param {number} byteOffset
	* @param {number} byteLength
	*/
	constructor(module, byteOffset, byteLength) {
		this.#module = module;
		this.byteOffset = byteOffset;
		this.length = this.byteLength = byteLength;
	}
	get buffer() {
		return this.#array.buffer;
	}
	at(index) {
		return this.#array.at(index);
	}
	copyWithin(target, start, end) {
		this.#array.copyWithin(target, start, end);
	}
	entries() {
		return this.#array.entries();
	}
	every(predicate) {
		return this.#array.every(predicate);
	}
	fill(value, start, end) {
		this.#array.fill(value, start, end);
	}
	filter(predicate) {
		return this.#array.filter(predicate);
	}
	find(predicate) {
		return this.#array.find(predicate);
	}
	findIndex(predicate) {
		return this.#array.findIndex(predicate);
	}
	findLast(predicate) {
		return this.#array.findLast(predicate);
	}
	findLastIndex(predicate) {
		return this.#array.findLastIndex(predicate);
	}
	forEach(callback) {
		this.#array.forEach(callback);
	}
	includes(value, start) {
		return this.#array.includes(value, start);
	}
	indexOf(value, start) {
		return this.#array.indexOf(value, start);
	}
	join(separator) {
		return this.#array.join(separator);
	}
	keys() {
		return this.#array.keys();
	}
	lastIndexOf(value, start) {
		return this.#array.lastIndexOf(value, start);
	}
	map(callback) {
		return this.#array.map(callback);
	}
	reduce(callback, initialValue) {
		return this.#array.reduce(callback, initialValue);
	}
	reduceRight(callback, initialValue) {
		return this.#array.reduceRight(callback, initialValue);
	}
	reverse() {
		this.#array.reverse();
	}
	set(array, offset) {
		this.#array.set(array, offset);
	}
	slice(start, end) {
		return this.#array.slice(start, end);
	}
	some(predicate) {
		return this.#array.some(predicate);
	}
	sort(compareFn) {
		this.#array.sort(compareFn);
	}
	subarray(begin, end) {
		return this.#array.subarray(begin, end);
	}
	toLocaleString(locales, options) {
		return this.#array.toLocaleString(locales, options);
	}
	toReversed() {
		return this.#array.toReversed();
	}
	toSorted(compareFn) {
		return this.#array.toSorted(compareFn);
	}
	toString() {
		return this.#array.toString();
	}
	values() {
		return this.#array.values();
	}
	with(index, value) {
		return this.#array.with(index, value);
	}
	[Symbol.iterator]() {
		return this.#array[Symbol.iterator]();
	}
};
var DataViewProxy = class {
	#module;
	#type;
	#_view = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(0));
	get #view() {
		if (this.#_view.buffer.byteLength === 0) this.#_view = new DataView(this.#module.HEAPU8.buffer, this.#module.HEAPU8.byteOffset + this.byteOffset);
		return this.#_view;
	}
	/**
	* @param {*} module
	* @param {number} byteOffset
	* @param {'Int32'|'BigInt64'} type
	*/
	constructor(module, byteOffset, type) {
		this.#module = module;
		this.byteOffset = byteOffset;
		this.#type = type;
	}
	get buffer() {
		return this.#view.buffer;
	}
	get byteLength() {
		return this.#type === "Int32" ? 4 : 8;
	}
	getInt32(byteOffset, littleEndian) {
		if (this.#type !== "Int32") throw new Error("invalid type");
		if (!littleEndian) throw new Error("must be little endian");
		return this.#view.getInt32(byteOffset, littleEndian);
	}
	setInt32(byteOffset, value, littleEndian) {
		if (this.#type !== "Int32") throw new Error("invalid type");
		if (!littleEndian) throw new Error("must be little endian");
		this.#view.setInt32(byteOffset, value, littleEndian);
	}
	getBigInt64(byteOffset, littleEndian) {
		if (this.#type !== "BigInt64") throw new Error("invalid type");
		if (!littleEndian) throw new Error("must be little endian");
		return this.#view.getBigInt64(byteOffset, littleEndian);
	}
	setBigInt64(byteOffset, value, littleEndian) {
		if (this.#type !== "BigInt64") throw new Error("invalid type");
		if (!littleEndian) throw new Error("must be little endian");
		this.#view.setBigInt64(byteOffset, value, littleEndian);
	}
};
var MemoryVFS = class MemoryVFS extends FacadeVFS$1 {
	mapNameToFile = /* @__PURE__ */ new Map();
	mapIdToFile = /* @__PURE__ */ new Map();
	static async create(name, module) {
		const vfs = new MemoryVFS(name, module);
		await vfs.isReady();
		return vfs;
	}
	close() {
		for (const fileId of this.mapIdToFile.keys()) this.jClose(fileId);
	}
	/**
	* @param {string?} filename
	* @param {number} fileId
	* @param {number} flags
	* @param {DataView} pOutFlags
	* @returns {number|Promise<number>}
	*/
	jOpen(filename, fileId, flags, pOutFlags) {
		const pathname = new URL(filename || Math.random().toString(36).slice(2), "file://").pathname;
		let file = this.mapNameToFile.get(pathname);
		if (!file) {
			if (flags & 4) {
				file = {
					pathname,
					flags,
					size: 0,
					data: /* @__PURE__ */ new ArrayBuffer(0)
				};
				this.mapNameToFile.set(pathname, file);
			} else return 14;
		}
		this.mapIdToFile.set(fileId, file);
		pOutFlags.setInt32(0, flags, true);
		return 0;
	}
	/**
	* @param {number} fileId
	* @returns {number|Promise<number>}
	*/
	jClose(fileId) {
		const file = this.mapIdToFile.get(fileId);
		this.mapIdToFile.delete(fileId);
		if (file.flags & 8) this.mapNameToFile.delete(file.pathname);
		return 0;
	}
	/**
	* @param {number} fileId
	* @param {Uint8Array} pData
	* @param {number} iOffset
	* @returns {number|Promise<number>}
	*/
	jRead(fileId, pData, iOffset) {
		const file = this.mapIdToFile.get(fileId);
		const bgn = Math.min(iOffset, file.size);
		const nBytes = Math.min(iOffset + pData.byteLength, file.size) - bgn;
		if (nBytes) pData.set(new Uint8Array(file.data, bgn, nBytes));
		if (nBytes < pData.byteLength) {
			pData.fill(0, nBytes);
			return 522;
		}
		return 0;
	}
	/**
	* @param {number} fileId
	* @param {Uint8Array} pData
	* @param {number} iOffset
	* @returns {number|Promise<number>}
	*/
	jWrite(fileId, pData, iOffset) {
		const file = this.mapIdToFile.get(fileId);
		if (iOffset + pData.byteLength > file.data.byteLength) {
			const newSize = Math.max(iOffset + pData.byteLength, 2 * file.data.byteLength);
			const data = new ArrayBuffer(newSize);
			new Uint8Array(data).set(new Uint8Array(file.data, 0, file.size));
			file.data = data;
		}
		new Uint8Array(file.data, iOffset, pData.byteLength).set(pData.subarray());
		file.size = Math.max(file.size, iOffset + pData.byteLength);
		return 0;
	}
	/**
	* @param {number} fileId
	* @param {number} iSize
	* @returns {number|Promise<number>}
	*/
	jTruncate(fileId, iSize) {
		const file = this.mapIdToFile.get(fileId);
		file.size = Math.min(file.size, iSize);
		return 0;
	}
	/**
	* @param {number} fileId
	* @param {DataView} pSize64
	* @returns {number|Promise<number>}
	*/
	jFileSize(fileId, pSize64) {
		const file = this.mapIdToFile.get(fileId);
		pSize64.setBigInt64(0, BigInt(file.size), true);
		return 0;
	}
	/**
	* @param {string} name
	* @param {number} syncDir
	* @returns {number|Promise<number>}
	*/
	jDelete(name, syncDir) {
		const pathname = new URL(name, "file://").pathname;
		this.mapNameToFile.delete(pathname);
		return 0;
	}
	/**
	* @param {string} name
	* @param {number} flags
	* @param {DataView} pResOut
	* @returns {number|Promise<number>}
	*/
	jAccess(name, flags, pResOut) {
		const pathname = new URL(name, "file://").pathname;
		const file = this.mapNameToFile.get(pathname);
		pResOut.setInt32(0, file ? 1 : 0, true);
		return 0;
	}
};
var cachedMemoryVfs;
var makeInMemoryDb = (sqlite3) => {
	if (sqlite3.vfs_registered.has("memory-vfs") === false) {
		const vfs = new MemoryVFS("memory-vfs", sqlite3.module);
		sqlite3.vfs_register(vfs, false);
		cachedMemoryVfs = vfs;
	}
	return {
		dbPointer: sqlite3.open_v2Sync(":memory:", void 0, "memory-vfs"),
		vfs: cachedMemoryVfs
	};
};
var makeSqliteDb = ({ sqlite3, metadata }) => {
	const preparedStmts = [];
	const { dbPointer } = metadata;
	let isClosed = false;
	const sqliteDb = {
		_tag: "SqliteDb",
		metadata,
		debug: { head: ROOT },
		prepare: (queryStr) => {
			try {
				const stmts = sqlite3.statements(dbPointer, queryStr.trim(), { unscoped: true });
				let isFinalized = false;
				const preparedStmt = {
					execute: (bindValues, options) => {
						for (const stmt of stmts) {
							if (bindValues !== void 0 && Object.keys(bindValues).length > 0) sqlite3.bind_collection(stmt, bindValues);
							try {
								sqlite3.step(stmt);
							} finally {
								if (options?.onRowsChanged !== void 0) options.onRowsChanged(sqlite3.changes(dbPointer));
								sqlite3.reset(stmt);
							}
						}
					},
					select: (bindValues) => {
						if (stmts.length !== 1) throw new SqliteError({
							query: {
								bindValues,
								sql: queryStr
							},
							code: -1,
							cause: "Expected only one statement when using `select`"
						});
						const stmt = stmts[0];
						if (bindValues !== void 0 && Object.keys(bindValues).length > 0) sqlite3.bind_collection(stmt, bindValues);
						const results = [];
						try {
							let columns;
							try {
								columns = sqlite3.column_names(stmt);
							} catch (_e) {}
							while (sqlite3.step(stmt) === 100) if (columns !== void 0) {
								const obj = {};
								for (let i = 0; i < columns.length; i++) obj[columns[i]] = sqlite3.column(stmt, i);
								results.push(obj);
							}
						} catch (e) {
							throw new SqliteError({
								query: {
									bindValues,
									sql: queryStr
								},
								code: e.code,
								cause: e
							});
						} finally {
							sqlite3.reset(stmt);
						}
						return results;
					},
					finalize: () => {
						if (isFinalized === true) return;
						isFinalized = true;
						for (const stmt of stmts) sqlite3.finalize(stmt);
					},
					sql: queryStr
				};
				preparedStmts.push(preparedStmt);
				return preparedStmt;
			} catch (e) {
				throw new SqliteError({
					query: {
						sql: queryStr,
						bindValues: {}
					},
					code: e.code,
					cause: e
				});
			}
		},
		export: makeExport(() => sqlite3.serialize(dbPointer, "main")),
		execute: makeExecute((queryStr, bindValues, options) => {
			const stmt = sqliteDb.prepare(queryStr);
			stmt.execute(bindValues, options);
			stmt.finalize();
		}),
		select: makeSelect((queryStr, bindValues) => {
			const stmt = sqliteDb.prepare(queryStr);
			const results = stmt.select(bindValues);
			stmt.finalize();
			return results;
		}),
		destroy: () => {
			sqliteDb.close();
			metadata.deleteDb();
		},
		close: () => {
			if (isClosed === true) return;
			for (const stmt of preparedStmts) stmt.finalize();
			sqlite3.close(dbPointer);
			isClosed = true;
		},
		import: (source) => {
			const ensureSuccess = (rc, operation) => {
				if (rc !== 0) throw new SqliteError({
					code: rc,
					cause: /* @__PURE__ */ new Error(`${operation} failed with rc=${rc}`),
					note: "Snapshot import failed during SQLite copy"
				});
			};
			if (source instanceof Uint8Array) {
				const WAL_FILE_FORMAT = 2;
				if (source.length >= 24 && (source[18] === WAL_FILE_FORMAT || source[19] === WAL_FILE_FORMAT)) throw new SqliteError({
					code: 14,
					cause: /* @__PURE__ */ new Error("WAL snapshots are not supported"),
					note: "Import expects rollback-journal snapshots (journal_mode=DELETE). Please convert snapshot before importing."
				});
				const tmpDb = makeInMemoryDb(sqlite3);
				ensureSuccess(sqlite3.deserialize(tmpDb.dbPointer, "main", source, source.length, source.length, 3), "sqlite3.deserialize");
				try {
					ensureSuccess(sqlite3.backup(dbPointer, "main", tmpDb.dbPointer, "main"), "sqlite3.backup");
				} finally {
					sqlite3.close(tmpDb.dbPointer);
				}
			} else ensureSuccess(sqlite3.backup(dbPointer, "main", source.metadata.dbPointer, "main"), "sqlite3.backup");
			metadata.configureDb(sqliteDb);
		},
		session: () => {
			const sessionPointer = sqlite3.session_create(dbPointer, "main");
			sqlite3.session_attach(sessionPointer, null);
			return {
				changeset: () => {
					return sqlite3.session_changeset(sessionPointer).changeset ?? void 0;
				},
				finish: () => {
					sqlite3.session_delete(sessionPointer);
				}
			};
		},
		makeChangeset: (data) => {
			return {
				invert: () => {
					const inverted = sqlite3.changeset_invert(data);
					return sqliteDb.makeChangeset(inverted);
				},
				apply: () => {
					try {
						sqlite3.changeset_apply(dbPointer, data, null, (eConflict) => {
							if (eConflict === 1 || eConflict === 3) return 1;
							return 0;
						});
						data = void 0;
					} catch (cause) {
						throw new SqliteError({
							code: cause.code ?? -1,
							cause,
							note: `Failed calling makeChangeset.apply`
						});
					}
				}
			};
		}
	};
	metadata.configureDb(sqliteDb);
	return sqliteDb;
};
/**
* Parent-side browser platform for Effect workers.
*
* `layerPlatform` provides the `WorkerPlatform` used to communicate with a
* browser `Worker`, `SharedWorker`, or `MessagePort` through Effect's worker
* protocol. `layer` combines that platform with a `Spawner` built from a
* callback that creates or returns the worker endpoint for each worker id.
*
* @since 4.0.0
*/
/**
* Creates browser worker layers by combining the default `WorkerPlatform` with a spawner for `Worker`, `SharedWorker`, or `MessagePort` instances.
*
* **When to use**
*
* Use when you need both the browser `WorkerPlatform` and a `Spawner` from one
* layer.
*
* **Details**
*
* The `spawn` callback receives the numeric worker id and may return a
* `Worker`, `SharedWorker`, or `MessagePort`.
*
* **Gotchas**
*
* Scope finalization sends the worker close protocol over the port. Dedicated
* workers created by `spawn` are not terminated by this layer.
*
* @see {@link layerPlatform} for providing only the browser worker platform
*
* @category layers
* @since 4.0.0
*/
var layer$1 = (spawn) => merge$1(layerPlatform, layerSpawner(spawn));
/**
* Layer that provides the browser `WorkerPlatform` for `Worker`, `SharedWorker`, and `MessagePort` communication.
*
* @category layers
* @since 4.0.0
*/
var layerPlatform = /*#__PURE__*/ succeed$4(WorkerPlatform)(/*#__PURE__*/ makePlatform()({
	setup({ scope, worker }) {
		const port = "port" in worker ? worker.port : worker;
		return as(addFinalizer$1(scope, sync(() => {
			port.postMessage([1]);
		})), port);
	},
	listen({ deferred, emit, port, scope }) {
		function onMessage(event) {
			emit(event.data);
		}
		function onError(event) {
			doneUnsafe(deferred, new WorkerError({ reason: new WorkerReceiveError({
				message: "An error event was emitter",
				cause: event.error ?? event.message
			}) }));
		}
		port.addEventListener("message", onMessage);
		port.addEventListener("error", onError);
		if ("start" in port) port.start();
		return addFinalizer$1(scope, sync(() => {
			port.removeEventListener("message", onMessage);
			port.removeEventListener("error", onError);
		}));
	}
}));
/**
* Unique identifier for web errors.
*/
var TypeId = "~@livestore/utils/WebError";
/**
* Type guard to check if a value is a web error.
*
* @param u - The value to check
* @returns `true` if the value is an `WebError`, `false` otherwise
*
* @example
* ```ts
* import { WebError } from "@livestore/utils/effect"
*
* const someError = new Error("generic error")
* const webError = new WebError.UnknownError({
*   module: "Test",
*   method: "example"
* })
*
* console.log(WebError.isWebError(someError)) // false
* console.log(WebError.isWebError(webError)) // true
* ```
*/
var isWebError = (u) => hasProperty(u, TypeId);
/**
* Error for the web standard "EvalError" simple exception.
*
* Thrown when the `eval` function is used in a way that violates its usage restrictions.
*
* @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Evalerror | MDN Reference}
* @see {@link https://webidl.spec.whatwg.org/#exceptiondef-evalerror | Specification}
*/
var EvalError = class extends TaggedError(`${TypeId}/EvalError`)("EvalError", { cause: instanceOf(globalThis.EvalError) }) {
	[TypeId] = TypeId;
};
/**
* Error for the web standard "RangeError" simple exception.
*
* Indicates that a numeric value is outside the permitted range.
*
* @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Rangeerror | MDN Reference}
* @see {@link https://webidl.spec.whatwg.org/#exceptiondef-rangeerror | Specification}
*/
var RangeError = class extends TaggedError(`${TypeId}/RangeError`)("RangeError", { cause: instanceOf(globalThis.RangeError) }) {
	[TypeId] = TypeId;
};
/**
* Error for the web standard "ReferenceError" simple exception.
*
* Raised when code references an identifier that has not been defined.
*
* @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Referenceerror | MDN Reference}
* @see {@link https://webidl.spec.whatwg.org/#exceptiondef-referenceerror | Specification}
*/
var ReferenceError = class extends TaggedError(`${TypeId}/ReferenceError`)("ReferenceError", { cause: instanceOf(globalThis.ReferenceError) }) {
	[TypeId] = TypeId;
};
/**
* Error for the web standard "TypeError" simple exception.
*
* Occurs when an operation is applied to a value of an inappropriate type.
*
* @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Typeerror | MDN Reference}
* @see {@link https://webidl.spec.whatwg.org/#exceptiondef-typeerror | Specification}
*/
var TypeError$1 = class extends TaggedError(`${TypeId}/TypeError`)("TypeError", { cause: instanceOf(globalThis.TypeError) }) {
	[TypeId] = TypeId;
};
/**
* Error for the web standard "URIError" simple exception.
*
* Signals incorrect usage of global URI handling functions such as `decodeURI` or `encodeURI`.
*
* @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/URIerror | MDN Reference}
* @see {@link https://webidl.spec.whatwg.org/#exceptiondef-urierror | Specification}
*/
var URIError = class extends TaggedError(`${TypeId}/URIError`)("URIError", { cause: instanceOf(globalThis.URIError) }) {
	[TypeId] = TypeId;
};
var domExceptionWithName = (expectedName) => instanceOf(DOMException).check(makeFilter((domException) => domException.name === expectedName ? void 0 : `Expected DOMException with name "${expectedName}", got "${domException.name}"`));
/**
* Error for the web standard "QuotaExceededError" DOMException-derived error.
*
* The quota has been exceeded.
*
* @see {@link https://developer.mozilla.org/en-US/docs/Web/API/QuotaExceededError | MDN Reference}
* @see {@link https://webidl.spec.whatwg.org/#quotaexceedederror | Specification}
*/
var QuotaExceededError = class extends TaggedError(`${TypeId}/QuotaExceededError`)("QuotaExceededError", { cause: Union([typeof globalThis.QuotaExceededError === "function" ? instanceOf(globalThis.QuotaExceededError) : Never, domExceptionWithName("QuotaExceededError")]) }) {
	[TypeId] = TypeId;
	get message() {
		return this.cause.message;
	}
};
/**
* Error for the web standard "NoModificationAllowedError" DOMException.
*
* The object can not be modified.
*
* @see {@link https://developer.mozilla.org/en-US/docs/Web/API/DOMException#nomodificationallowederror | MDN Reference}
* @see {@link https://webidl.spec.whatwg.org/#nomodificationallowederror | Specification}
*/
var NoModificationAllowedError = class extends TaggedError(`${TypeId}/NoModificationAllowedError`)("NoModificationAllowedError", { cause: domExceptionWithName("NoModificationAllowedError") }) {
	[TypeId] = TypeId;
	get message() {
		return this.cause.message;
	}
};
/**
* Error for the web standard "NotFoundError" DOMException
*
* The object can not be found here.
*
* @see {@link https://developer.mozilla.org/en-US/docs/Web/API/DOMException#notfounderror | MDN Reference}
* @see {@link https://webidl.spec.whatwg.org/#notfounderror | Specification}
*/
var NotFoundError = class extends TaggedError(`${TypeId}/NotFoundError`)("NotFoundError", { cause: domExceptionWithName("NotFoundError") }) {
	[TypeId] = TypeId;
	get message() {
		return this.cause.message;
	}
};
/**
* Error for the web standard "NotAllowedError" DOMException
*
* The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission.
*
* @see {@link https://developer.mozilla.org/en-US/docs/Web/API/DOMException#notallowederror | MDN Reference}
* @see {@link https://webidl.spec.whatwg.org/#notallowederror | Specification}
*/
var NotAllowedError = class extends TaggedError(`${TypeId}/NotAllowedError`)("NotAllowedError", { cause: domExceptionWithName("NotAllowedError") }) {
	[TypeId] = TypeId;
	get message() {
		return this.cause.message;
	}
};
/**
* Error for the web standard "TypeMismatchError" DOMException.
*
* The object can not be converted to the expected type.
*
* @see {@link https://developer.mozilla.org/en-US/docs/Web/API/DOMException#typemismatcherror | MDN Reference}
* @see {@link https://webidl.spec.whatwg.org/#typemismatcherror | Specification}
*/
var TypeMismatchError = class extends TaggedError(`${TypeId}/TypeMismatchError`)("TypeMismatchError", { cause: domExceptionWithName("TypeMismatchError") }) {
	[TypeId] = TypeId;
	get message() {
		return this.cause.message;
	}
};
/**
* Error for the web standard "InvalidStateError" DOMException.
*
* The object is in an invalid state.
*
* @see {@link https://developer.mozilla.org/en-US/docs/Web/API/DOMException#invalidstateerror | MDN Reference}
* @see {@link https://webidl.spec.whatwg.org/#invalidstateerror | Specification}
*/
var InvalidStateError = class extends TaggedError(`${TypeId}/InvalidStateError`)("InvalidStateError", { cause: domExceptionWithName("InvalidStateError") }) {
	[TypeId] = TypeId;
	get message() {
		return this.cause.message;
	}
};
/**
* Error for the web standard "AbortError" DOMException.
*
* The operation was aborted.
*
* @see {@link https://developer.mozilla.org/en-US/docs/Web/API/DOMException#aborterror | MDN Reference}
* @see {@link https://webidl.spec.whatwg.org/#aborterror | Specification}
*/
var AbortError = class extends TaggedError(`${TypeId}/AbortError`)("AbortError", { cause: domExceptionWithName("AbortError") }) {
	[TypeId] = TypeId;
	get message() {
		return this.cause.message;
	}
};
/**
* Error for the web standard "InvalidModificationError" DOMException.
*
* The object can not be modified in this way.
*
* @see {@link https://developer.mozilla.org/en-US/docs/Web/API/DOMException#invalidmodificationerror | MDN Reference}
* @see {@link https://webidl.spec.whatwg.org/#invalidmodificationerror | Specification}
*/
var InvalidModificationError = class extends TaggedError(`${TypeId}/InvalidModificationError`)("InvalidModificationError", { cause: domExceptionWithName("InvalidModificationError") }) {
	[TypeId] = TypeId;
	get message() {
		return this.cause.message;
	}
};
/**
* Error for the web standard "SecurityError" DOMException.
*
* The operation is insecure.
*
* @see {@link https://developer.mozilla.org/en-US/docs/Web/API/DOMException#securityerror | MDN Reference}
* @see {@link https://webidl.spec.whatwg.org/#securityerror | Specification}
*/
var SecurityError = class extends TaggedError(`${TypeId}/SecurityError`)("SecurityError", { cause: domExceptionWithName("SecurityError") }) {
	[TypeId] = TypeId;
	get message() {
		return this.cause.message;
	}
};
/**
* Error for the web standard "DataCloneError" DOMException.
*
* The object can not be cloned.
*
* @see {@link https://developer.mozilla.org/en-US/docs/Web/API/DOMException#datacloneerror | MDN Reference}
* @see {@link https://webidl.spec.whatwg.org/#datacloneerror | Specification}
*/
var DataCloneError = class extends TaggedError(`${TypeId}/DataCloneError`)("DataCloneError", { cause: domExceptionWithName("DataCloneError") }) {
	[TypeId] = TypeId;
	get message() {
		return this.cause.message;
	}
};
/**
* Catch-all error for unexpected runtime errors in web environments.
*
* This error is used when an unexpected exception occurs that doesn't fit
* into the other specific error categories. It provides context about where
* the error occurred and preserves the original cause for debugging.
*
* @example
* ```ts
* import { WebError } from "@livestore/utils/effect"
* import { Effect } from "effect"
*
* const riskyOperation = () => {
*   try {
*     // Some operation that might throw
*     throw new Error("Unexpected runtime issue")
*   } catch (cause) {
*     return Effect.fail(new WebError.UnknownError({
*       module: "JSON",
*       method: "parse",
*       description: "Could not parse string as JSON",
*       cause
*     }))
*   }
* }
*
* const program = riskyOperation().pipe(
*   Effect.catchTag("UnknownError", (error) => {
*     console.log(error.message)
*     // "JSON.parse: Could not parse string as JSON"
*     return Effect.succeed("JSON parsing not possible")
*   })
* )
* ```
*/
var UnknownError = class extends TaggedError(`${TypeId}/UnknownError`)("UnknownError", {
	module: optional(String$1),
	method: optional(String$1),
	description: optional(String$1),
	cause: optional(Defect())
}) {
	[TypeId] = TypeId;
	get message() {
		const messageEnd = isUndefined(this.description) === true ? "A web error occurred" : this.description;
		const moduleMethod = isString(this.module) === true && isString(this.method) === true ? `${this.module}.${this.method}` : void 0;
		return isUndefined(moduleMethod) === true ? messageEnd : `${moduleMethod}: ${messageEnd}`;
	}
};
Union([
	EvalError,
	RangeError,
	ReferenceError,
	TypeError$1,
	URIError,
	QuotaExceededError,
	NoModificationAllowedError,
	NotFoundError,
	NotAllowedError,
	TypeMismatchError,
	InvalidStateError,
	AbortError,
	InvalidModificationError,
	SecurityError,
	DataCloneError,
	UnknownError
]);
function classifyWebError(value, expected = []) {
	const parsed = parseWebError(value);
	if (expected.length === 0) return parsed;
	if (expected.some((ErrorConstructor) => parsed instanceof ErrorConstructor) === true) return parsed;
	return parsed instanceof UnknownError ? parsed : new UnknownError({ cause: parsed });
}
/**
* Converts web-native exception shapes to LiveStore's `WebError`
* classes while preserving the original value as `cause`.
*/
var parseWebError = (cause) => {
	if (isWebError(cause) === true) return cause;
	if (cause instanceof globalThis.EvalError) return new EvalError({ cause });
	if (cause instanceof globalThis.RangeError) return new RangeError({ cause });
	if (cause instanceof globalThis.ReferenceError) return new ReferenceError({ cause });
	if (cause instanceof globalThis.TypeError) return new TypeError$1({ cause });
	if (cause instanceof globalThis.URIError) return new URIError({ cause });
	if (typeof globalThis.QuotaExceededError === "function" && cause instanceof globalThis.QuotaExceededError) return new QuotaExceededError({ cause });
	if (cause instanceof DOMException) switch (cause.name) {
		case "QuotaExceededError": return new QuotaExceededError({ cause });
		case "NoModificationAllowedError": return new NoModificationAllowedError({ cause });
		case "NotFoundError": return new NotFoundError({ cause });
		case "NotAllowedError": return new NotAllowedError({ cause });
		case "TypeMismatchError": return new TypeMismatchError({ cause });
		case "InvalidStateError": return new InvalidStateError({ cause });
		case "AbortError": return new AbortError({ cause });
		case "InvalidModificationError": return new InvalidModificationError({ cause });
		case "SecurityError": return new SecurityError({ cause });
		case "DataCloneError": return new DataCloneError({ cause });
	}
	if (cause instanceof Error) return new UnknownError({
		description: cause.message,
		cause
	});
	return new UnknownError({ cause });
};
var Opfs = class extends Service()("@livestore/utils/Opfs") {};
succeed$4(Opfs, Opfs.of({
	getRootDirectoryHandle: tryPromise({
		try: () => navigator.storage.getDirectory(),
		catch: (u) => classifyWebError(u, [SecurityError])
	}),
	getFileHandle: (parent, name, options) => tryPromise({
		try: () => parent.getFileHandle(name, options),
		catch: (u) => classifyWebError(u, [
			NotAllowedError,
			TypeError$1,
			TypeMismatchError,
			NotFoundError
		])
	}),
	getDirectoryHandle: (parent, name, options) => tryPromise({
		try: () => parent.getDirectoryHandle(name, options),
		catch: (u) => classifyWebError(u, [
			NotAllowedError,
			TypeError$1,
			TypeMismatchError,
			NotFoundError
		])
	}),
	removeEntry: (parent, name, options) => tryPromise({
		try: () => parent.removeEntry(name, options),
		catch: (u) => classifyWebError(u, [
			TypeError$1,
			NotAllowedError,
			InvalidModificationError,
			NotFoundError,
			NoModificationAllowedError
		])
	}),
	values: (directory) => fromAsyncIterable(directory.values(), (u) => classifyWebError(u, [NotAllowedError, NotFoundError])),
	resolve: (parent, child) => tryPromise({
		try: () => parent.resolve(child),
		catch: (u) => classifyWebError(u)
	}).pipe(map((path) => path === null ? none() : some(path))),
	getFile: (handle) => tryPromise({
		try: () => handle.getFile(),
		catch: (u) => classifyWebError(u, [NotAllowedError, NotFoundError])
	}),
	writeFile: (handle, data, options) => acquireUseRelease(tryPromise({
		try: () => handle.createWritable(options),
		catch: (u) => classifyWebError(u, [
			NotAllowedError,
			NotFoundError,
			NoModificationAllowedError,
			AbortError
		])
	}), (stream) => tryPromise({
		try: () => stream.write(data),
		catch: (u) => classifyWebError(u, [
			NotAllowedError,
			QuotaExceededError,
			TypeError$1
		])
	}), (stream) => tryPromise({
		try: () => stream.close(),
		catch: (u) => classifyWebError(u, [TypeError$1])
	}).pipe(catchCause$1(() => void_$1))),
	appendToFile: (handle, data) => acquireUseRelease(tryPromise({
		try: () => handle.createWritable({ keepExistingData: true }),
		catch: (u) => classifyWebError(u, [
			NotAllowedError,
			NotFoundError,
			NoModificationAllowedError,
			AbortError
		])
	}), (stream) => gen(function* () {
		const file = yield* tryPromise({
			try: () => handle.getFile(),
			catch: (u) => classifyWebError(u, [NotAllowedError, NotFoundError])
		});
		yield* tryPromise({
			try: () => stream.seek(file.size),
			catch: (u) => classifyWebError(u, [NotAllowedError, TypeError$1])
		});
		yield* tryPromise({
			try: () => stream.write(data),
			catch: (u) => classifyWebError(u, [
				NotAllowedError,
				QuotaExceededError,
				TypeError$1
			])
		});
	}), (stream) => tryPromise({
		try: () => stream.close(),
		catch: (u) => classifyWebError(u, [TypeError$1])
	}).pipe(catchCause$1(() => void_$1))),
	truncateFile: (handle, size) => acquireUseRelease(tryPromise({
		try: () => handle.createWritable({ keepExistingData: true }),
		catch: (u) => classifyWebError(u, [
			NotAllowedError,
			NotFoundError,
			NoModificationAllowedError,
			AbortError
		])
	}), (stream) => tryPromise({
		try: () => stream.truncate(size),
		catch: (u) => classifyWebError(u, [
			NotAllowedError,
			TypeError$1,
			QuotaExceededError
		])
	}), (stream) => tryPromise({
		try: () => stream.close(),
		catch: (u) => classifyWebError(u, [TypeError$1])
	}).pipe(catchCause$1(() => void_$1))),
	createSyncAccessHandle: (handle) => acquireRelease(tryPromise({
		try: () => handle.createSyncAccessHandle(),
		catch: (u) => classifyWebError(u, [
			NotAllowedError,
			InvalidStateError,
			NotFoundError,
			NoModificationAllowedError
		])
	}), (syncHandle) => sync(() => syncHandle.close())),
	syncRead: (handle, buffer, options) => try_({
		try: () => handle.read(buffer, options),
		catch: (u) => classifyWebError(u, [
			RangeError,
			InvalidStateError,
			TypeError$1
		])
	}),
	syncWrite: (handle, buffer, options) => try_({
		try: () => handle.write(buffer, options),
		catch: (u) => classifyWebError(u)
	}),
	syncTruncate: (handle, size) => try_({
		try: () => handle.truncate(size),
		catch: (u) => classifyWebError(u)
	}),
	syncGetSize: (handle) => try_({
		try: () => handle.getSize(),
		catch: (u) => classifyWebError(u)
	}),
	syncFlush: (handle) => try_({
		try: () => handle.flush(),
		catch: (u) => classifyWebError(u)
	})
}));
var notFoundError = new NotFoundError({ cause: new DOMException("The object can not be found here.", "NotFoundError") });
var unknownError = (message) => new UnknownError({ description: message });
succeed$4(Opfs, Opfs.of({
	getRootDirectoryHandle: fail$1(unknownError("OPFS is not supported in this environment")),
	getFileHandle: () => fail$1(notFoundError),
	getDirectoryHandle: () => fail$1(notFoundError),
	removeEntry: () => fail$1(notFoundError),
	values: () => fail$5(notFoundError),
	resolve: () => succeed(none()),
	getFile: () => fail$1(notFoundError),
	writeFile: () => fail$1(notFoundError),
	appendToFile: () => fail$1(notFoundError),
	truncateFile: () => fail$1(notFoundError),
	createSyncAccessHandle: () => fail$1(unknownError("OPFS is not supported in this environment")),
	syncRead: () => fail$1(unknownError("OPFS is not supported in this environment")),
	syncWrite: () => fail$1(unknownError("OPFS is not supported in this environment")),
	syncTruncate: () => fail$1(unknownError("OPFS is not supported in this environment")),
	syncGetSize: () => fail$1(unknownError("OPFS is not supported in this environment")),
	syncFlush: () => fail$1(unknownError("OPFS is not supported in this environment"))
}));
/**
* Error raised when OPFS operations fail.
*/
var OpfsError = class extends TaggedError("~@livestore/utils/OpfsError")("OpfsError", {
	message: String$1,
	cause: optional(Defect())
}) {};
/**
* Set of path segments that are forbidden by the File System specification.
*
* A valid segment is non-empty, not equal to `.` or `..`, and must not have path separator characters.
*
* @see {@link https://fs.spec.whatwg.org/#valid-file-name | File System Spec}
*/
var DISALLOWED_SEGMENTS = /* @__PURE__ */ new Set([".", ".."]);
/**
* Parse a slash-separated OPFS path into validated segments.
*
* Rejects empty paths and disallows `.` / `..` so callers cannot rely on implicit current/parent
* directory semantics that the File System Access API does not support.
*
* @param path - Slash-delimited path relative to the OPFS root.
* @returns Effect that yields the sanitized path segments.
*/
var parsePathSegments = (path) => gen(function* () {
	const segments = path.split("/").filter((segment) => segment.length > 0);
	if (segments.length === 0) return yield* new OpfsError({ message: `Invalid OPFS path '${path}': path must contain at least one non-empty segment` });
	for (const segment of segments) if (DISALLOWED_SEGMENTS.has(segment) === true) return yield* new OpfsError({ message: `Invalid OPFS path '${path}': segment '${segment}' is not supported` });
	return segments;
});
/**
* Determine whether the provided OPFS path refers to the origin root.
*/
var isRootPath = (path) => path === "" || path === "/";
/**
* Split a set of path segments into parent and leaf portions.
*
* @param segments - Non-empty sequence of path segments pointing to a concrete entry.
* @returns Parent directory segments and the final segment representing the target entry.
*/
var splitPathSegments = (segments) => ({
	parentSegments: segments.slice(0, -1),
	leafSegment: segments[segments.length - 1]
});
/**
* Resolve a directory path from the OPFS root and return the final directory handle.
*
* @param segments - Ordered list of directory names to follow.
* @param options - Options forwarded to each `getDirectoryHandle` call.
*/
var traverseDirectoryPath = (segments, options) => gen(function* () {
	const opfs = yield* Opfs;
	let currentDirHandle = yield* opfs.getRootDirectoryHandle;
	for (let index = 0; index < segments.length; index++) {
		const segment = segments[index];
		currentDirHandle = yield* opfs.getDirectoryHandle(currentDirHandle, segment, options);
	}
	return currentDirHandle;
});
/**
* Ensure that a directory path exists, creating intermediate segments when permitted.
*
* @param segments - Ordered list of directory names to ensure.
* @param options.recursive - When `true`, create every missing segment. Otherwise only the leaf is created.
*/
var ensureDirectoryPath = (segments, options) => gen(function* () {
	const opfs = yield* Opfs;
	let currentDirHandle = yield* opfs.getRootDirectoryHandle;
	for (let index = 0; index < segments.length; index++) {
		const segment = segments[index];
		const isLast = index === segments.length - 1;
		const shouldCreate = options.recursive || isLast;
		currentDirHandle = yield* opfs.getDirectoryHandle(currentDirHandle, segment, shouldCreate === true ? { create: true } : void 0);
	}
	return currentDirHandle;
});
/**
* Resolve a directory handle using a slash-delimited OPFS path.
*
* @param path - Directory path relative to the OPFS root.
* @param options - Options forwarded to `getDirectoryHandle` when traversing segments.
* @returns Directory handle for the final segment.
*/
var getDirectoryHandleByPath = fn("@livestore/utils:Opfs.getDirectoryHandleByPath")(function* (path, options) {
	if (isRootPath(path) === true) return yield* (yield* Opfs).getRootDirectoryHandle;
	return yield* traverseDirectoryPath(yield* parsePathSegments(path), options);
});
fn("@livestore/utils:Opfs.remove")(function* (path, options) {
	const recursive = options?.recursive ?? false;
	const opfs = yield* Opfs;
	if (isRootPath(path) === true) {
		const rootHandle = yield* opfs.getRootDirectoryHandle;
		yield* opfs.values(rootHandle).pipe(runForEach((handle) => opfs.removeEntry(rootHandle, handle.name, { recursive: true })));
		return;
	}
	const { parentSegments, leafSegment: targetName } = splitPathSegments(yield* parsePathSegments(path));
	const parentDirHandle = yield* traverseDirectoryPath(parentSegments);
	yield* opfs.removeEntry(parentDirHandle, targetName, { recursive });
});
fn("@livestore/utils:Opfs.exists")(function* (path) {
	if (isRootPath(path) === true) return true;
	const { parentSegments, leafSegment: targetName } = splitPathSegments(yield* parsePathSegments(path));
	const parentDirHandle = yield* traverseDirectoryPath(parentSegments, { create: false }).pipe(catchTag("NotFoundError", () => void_$1));
	if (parentDirHandle === void 0) return false;
	const opfs = yield* Opfs;
	return yield* opfs.getFileHandle(parentDirHandle, targetName).pipe(catch_(() => opfs.getDirectoryHandle(parentDirHandle, targetName, { create: false })), as(true), catchTag("NotFoundError", () => succeed(false)));
});
fn("@livestore/utils:Opfs.makeDirectory")(function* (path, options) {
	const recursive = options?.recursive ?? false;
	if (isRootPath(path) === true) return;
	yield* ensureDirectoryPath(yield* parsePathSegments(path), { recursive });
});
fn("@livestore/utils:Opfs.getMetadata")(function* (handle) {
	return yield* (yield* Opfs).getFile(handle).pipe(map((file) => ({
		name: file.name,
		size: file.size,
		type: file.type,
		lastModified: file.lastModified
	})));
});
fn("@livestore/utils:Opfs.writeFile")(function* (path, data) {
	if (isRootPath(path) === true) return yield* new OpfsError({ message: `Invalid OPFS path '${path}': cannot write file directly to the OPFS root` });
	const { parentSegments, leafSegment: fileName } = splitPathSegments(yield* parsePathSegments(path));
	return yield* scoped(gen(function* () {
		const parentDirHandle = yield* traverseDirectoryPath(parentSegments);
		const opfs = yield* Opfs;
		const fileHandle = yield* opfs.getFileHandle(parentDirHandle, fileName, { create: true });
		yield* opfs.writeFile(fileHandle, new Uint8Array(data), { keepExistingData: false });
	}));
});
fn("@livestore/utils:Opfs.syncWriteFile")(function* (path, data) {
	if (isRootPath(path) === true) return yield* new OpfsError({ message: `Invalid OPFS path '${path}': cannot write file directly to the OPFS root` });
	const { parentSegments, leafSegment: fileName } = splitPathSegments(yield* parsePathSegments(path));
	return yield* scoped(gen(function* () {
		const parentDirHandle = yield* traverseDirectoryPath(parentSegments);
		const opfs = yield* Opfs;
		const fileHandle = yield* opfs.getFileHandle(parentDirHandle, fileName, { create: true });
		const syncHandle = yield* opfs.createSyncAccessHandle(fileHandle);
		yield* opfs.syncTruncate(syncHandle, 0);
		let offset = 0;
		while (offset < data.byteLength) {
			const wrote = yield* opfs.syncWrite(syncHandle, data.subarray(offset), { at: offset });
			if (wrote === 0) return yield* new OpfsError({ message: `Short write: wrote ${offset} of ${data.byteLength} bytes.` });
			offset += Number(wrote);
		}
		yield* opfs.syncFlush(syncHandle);
	}));
});
/** Browser BroadcastChannel-backed WebChannel */
var broadcastChannel = ({ channelName, schema: inputSchema }) => scopeWithCloseable((scope) => Effect_exports.gen(function* () {
	const schema = mapSchema(inputSchema);
	const channel = new BroadcastChannel(channelName);
	yield* Effect_exports.addFinalizer(() => Effect_exports.try({
		try: () => channel.close(),
		catch: (cause) => new UnknownError$2(cause)
	}).pipe(Effect_exports.ignore));
	const send = (message) => Effect_exports.gen(function* () {
		const messageEncoded = yield* Schema_exports.encodeEffect(schema.send)(message);
		channel.postMessage(messageEncoded);
	});
	const listen = Stream_exports.fromEventListener(channel, "message").pipe(Stream_exports.map((_) => Schema_exports.decodeResult(schema.listen)(_.data)), listenToDebugPing(channelName));
	const closedDeferred = yield* Effect_exports.acquireRelease(make$6(), done(void_));
	const supportsTransferables = false;
	return {
		[WebChannelSymbol]: WebChannelSymbol,
		send,
		listen,
		closedDeferred,
		shutdown: close(scope, succeed$1("shutdown")),
		schema,
		supportsTransferables
	};
}).pipe(Effect_exports.withSpan(`WebChannel:broadcastChannel(${channelName})`)));
/**
* Window.postMessage-based WebChannel
*/
var windowChannel = ({ listenWindow, sendWindow, targetOrigin = "*", ids, schema: inputSchema }) => scopeWithCloseable((scope) => Effect_exports.gen(function* () {
	const schema = mapSchema(inputSchema);
	const debugInfo = {
		sendTotal: 0,
		listenTotal: 0,
		targetOrigin,
		ids
	};
	const WindowMessageListen = Schema_exports.Struct({
		message: schema.listen,
		from: Schema_exports.Literal(ids.other),
		to: Schema_exports.Literal(ids.own)
	}).annotate({ title: "webmesh.WindowMessageListen" });
	const WindowMessageSend = Schema_exports.Struct({
		message: schema.send,
		from: Schema_exports.Literal(ids.own),
		to: Schema_exports.Literal(ids.other)
	}).annotate({ title: "webmesh.WindowMessageSend" });
	const messageQueue = yield* Effect_exports.acquireRelease(unbounded(), shutdown);
	const handler = (event) => {
		offerUnsafe(messageQueue, event);
	};
	listenWindow.addEventListener("message", handler);
	yield* Effect_exports.addFinalizer(() => Effect_exports.sync(() => listenWindow.removeEventListener("message", handler)));
	const send = (message) => Effect_exports.gen(function* () {
		debugInfo.sendTotal++;
		const [messageEncoded, transferables] = yield* encodeWithTransferables(WindowMessageSend)({
			message,
			from: ids.own,
			to: ids.other
		});
		sendWindow.postMessage(messageEncoded, targetOrigin, transferables);
	});
	const listen = Stream_exports.fromQueue(messageQueue).pipe(Stream_exports.filter((_) => Schema_exports.is(Schema_exports.toEncoded(WindowMessageListen))(_.data)), Stream_exports.map((_) => {
		debugInfo.listenTotal++;
		return Schema_exports.decodeResult(schema.listen)(_.data.message);
	}), listenToDebugPing("window"));
	const closedDeferred = yield* Effect_exports.acquireRelease(make$6(), done(void_));
	const supportsTransferables = true;
	return {
		[WebChannelSymbol]: WebChannelSymbol,
		send,
		listen,
		closedDeferred,
		shutdown: close(scope, succeed$1("shutdown")),
		schema,
		supportsTransferables,
		debugInfo
	};
}).pipe(Effect_exports.withSpan(`WebChannel:windowChannel`)));
var AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
var FacadeVFS = class extends Base {
	/**
	* @param {string} name
	* @param {object} module
	*/
	/**
	* Override to indicate which methods are asynchronous.
	* @param {string} methodName
	* @returns {boolean}
	*/
	hasAsyncMethod(methodName) {
		const jMethodName = `j${methodName.slice(1)}`;
		return this[jMethodName] instanceof AsyncFunction;
	}
	/**
	* Return the filename for a file id for use by mixins.
	* @param {number} pFile
	* @returns {string}
	*/
	getFilename(pFile) {
		throw new Error("unimplemented");
	}
	/**
	* @param {string?} filename
	* @param {number} pFile
	* @param {number} flags
	* @param {DataView} pOutFlags
	* @returns {number|Promise<number>}
	*/
	jOpen(filename, pFile, flags, pOutFlags) {
		return 14;
	}
	/**
	* @param {string} filename
	* @param {number} syncDir
	* @returns {number|Promise<number>}
	*/
	jDelete(filename, syncDir) {
		return 0;
	}
	/**
	* @param {string} filename
	* @param {number} flags
	* @param {DataView} pResOut
	* @returns {number|Promise<number>}
	*/
	jAccess(filename, flags, pResOut) {
		return 0;
	}
	/**
	* @param {string} filename
	* @param {Uint8Array} zOut
	* @returns {number|Promise<number>}
	*/
	jFullPathname(filename, zOut) {
		const { read, written } = new TextEncoder().encodeInto(filename, zOut);
		if (read < filename.length) return 10;
		if (written >= zOut.length) return 10;
		zOut[written] = 0;
		return 0;
	}
	/**
	* @param {Uint8Array} zBuf
	* @returns {number|Promise<number>}
	*/
	jGetLastError(zBuf) {
		return 0;
	}
	/**
	* @param {number} pFile
	* @returns {number|Promise<number>}
	*/
	jClose(pFile) {
		return 0;
	}
	/**
	* @param {number} pFile
	* @param {Uint8Array} pData
	* @param {number} iOffset
	* @returns {number|Promise<number>}
	*/
	jRead(pFile, pData, iOffset) {
		pData.fill(0);
		return 522;
	}
	/**
	* @param {number} pFile
	* @param {Uint8Array} pData
	* @param {number} iOffset
	* @returns {number|Promise<number>}
	*/
	jWrite(pFile, pData, iOffset) {
		return 778;
	}
	/**
	* @param {number} pFile
	* @param {number} size
	* @returns {number|Promise<number>}
	*/
	jTruncate(pFile, size) {
		return 0;
	}
	/**
	* @param {number} pFile
	* @param {number} flags
	* @returns {number|Promise<number>}
	*/
	jSync(pFile, flags) {
		return 0;
	}
	/**
	* @param {number} pFile
	* @param {DataView} pSize
	* @returns {number|Promise<number>}
	*/
	jFileSize(pFile, pSize) {
		return 0;
	}
	/**
	* @param {number} pFile
	* @param {number} lockType
	* @returns {number|Promise<number>}
	*/
	jLock(pFile, lockType) {
		return 0;
	}
	/**
	* @param {number} pFile
	* @param {number} lockType
	* @returns {number|Promise<number>}
	*/
	jUnlock(pFile, lockType) {
		return 0;
	}
	/**
	* @param {number} pFile
	* @param {DataView} pResOut
	* @returns {number|Promise<number>}
	*/
	jCheckReservedLock(pFile, pResOut) {
		pResOut.setInt32(0, 0, true);
		return 0;
	}
	/**
	* @param {number} pFile
	* @param {number} op
	* @param {DataView} pArg
	* @returns {number|Promise<number>}
	*/
	jFileControl(pFile, op, pArg) {
		return 12;
	}
	/**
	* @param {number} pFile
	* @returns {number|Promise<number>}
	*/
	jSectorSize(pFile) {
		return super.xSectorSize(pFile);
	}
	/**
	* @param {number} pFile
	* @returns {number|Promise<number>}
	*/
	jDeviceCharacteristics(pFile) {
		return 0;
	}
	/**
	* @param {number} pVfs
	* @param {number} zName
	* @param {number} pFile
	* @param {number} flags
	* @param {number} pOutFlags
	* @returns {number|Promise<number>}
	*/
	xOpen(pVfs, zName, pFile, flags, pOutFlags) {
		const filename = this.#decodeFilename(zName, flags);
		const pOutFlagsView = this.#makeTypedDataView("Int32", pOutFlags);
		this["log"]?.("jOpen", filename, pFile, `0x${flags.toString(16)}`);
		return this.jOpen(filename, pFile, flags, pOutFlagsView);
	}
	/**
	* @param {number} pVfs
	* @param {number} zName
	* @param {number} syncDir
	* @returns {number|Promise<number>}
	*/
	xDelete(pVfs, zName, syncDir) {
		const filename = this._module.UTF8ToString(zName);
		this["log"]?.("jDelete", filename, syncDir);
		return this.jDelete(filename, syncDir);
	}
	/**
	* @param {number} pVfs
	* @param {number} zName
	* @param {number} flags
	* @param {number} pResOut
	* @returns {number|Promise<number>}
	*/
	xAccess(pVfs, zName, flags, pResOut) {
		const filename = this._module.UTF8ToString(zName);
		const pResOutView = this.#makeTypedDataView("Int32", pResOut);
		this["log"]?.("jAccess", filename, flags);
		return this.jAccess(filename, flags, pResOutView);
	}
	/**
	* @param {number} pVfs
	* @param {number} zName
	* @param {number} nOut
	* @param {number} zOut
	* @returns {number|Promise<number>}
	*/
	xFullPathname(pVfs, zName, nOut, zOut) {
		const filename = this._module.UTF8ToString(zName);
		const zOutArray = this._module.HEAPU8.subarray(zOut, zOut + nOut);
		this["log"]?.("jFullPathname", filename, nOut);
		return this.jFullPathname(filename, zOutArray);
	}
	/**
	* @param {number} pVfs
	* @param {number} nBuf
	* @param {number} zBuf
	* @returns {number|Promise<number>}
	*/
	xGetLastError(pVfs, nBuf, zBuf) {
		const zBufArray = this._module.HEAPU8.subarray(zBuf, zBuf + nBuf);
		this["log"]?.("jGetLastError", nBuf);
		return this.jGetLastError(zBufArray);
	}
	/**
	* @param {number} pFile
	* @returns {number|Promise<number>}
	*/
	xClose(pFile) {
		this["log"]?.("jClose", pFile);
		return this.jClose(pFile);
	}
	/**
	* @param {number} pFile
	* @param {number} pData
	* @param {number} iAmt
	* @param {number} iOffsetLo
	* @param {number} iOffsetHi
	* @returns {number|Promise<number>}
	*/
	xRead(pFile, pData, iAmt, iOffsetLo, iOffsetHi) {
		const pDataArray = this.#makeDataArray(pData, iAmt);
		const iOffset = delegalize(iOffsetLo, iOffsetHi);
		this["log"]?.("jRead", pFile, iAmt, iOffset);
		return this.jRead(pFile, pDataArray, iOffset);
	}
	/**
	* @param {number} pFile
	* @param {number} pData
	* @param {number} iAmt
	* @param {number} iOffsetLo
	* @param {number} iOffsetHi
	* @returns {number|Promise<number>}
	*/
	xWrite(pFile, pData, iAmt, iOffsetLo, iOffsetHi) {
		const pDataArray = this.#makeDataArray(pData, iAmt);
		const iOffset = delegalize(iOffsetLo, iOffsetHi);
		this["log"]?.("jWrite", pFile, pDataArray, iOffset);
		return this.jWrite(pFile, pDataArray, iOffset);
	}
	/**
	* @param {number} pFile
	* @param {number} sizeLo
	* @param {number} sizeHi
	* @returns {number|Promise<number>}
	*/
	xTruncate(pFile, sizeLo, sizeHi) {
		const size = delegalize(sizeLo, sizeHi);
		this["log"]?.("jTruncate", pFile, size);
		return this.jTruncate(pFile, size);
	}
	/**
	* @param {number} pFile
	* @param {number} flags
	* @returns {number|Promise<number>}
	*/
	xSync(pFile, flags) {
		this["log"]?.("jSync", pFile, flags);
		return this.jSync(pFile, flags);
	}
	/**
	*
	* @param {number} pFile
	* @param {number} pSize
	* @returns {number|Promise<number>}
	*/
	xFileSize(pFile, pSize) {
		const pSizeView = this.#makeTypedDataView("BigInt64", pSize);
		this["log"]?.("jFileSize", pFile);
		return this.jFileSize(pFile, pSizeView);
	}
	/**
	* @param {number} pFile
	* @param {number} lockType
	* @returns {number|Promise<number>}
	*/
	xLock(pFile, lockType) {
		this["log"]?.("jLock", pFile, lockType);
		return this.jLock(pFile, lockType);
	}
	/**
	* @param {number} pFile
	* @param {number} lockType
	* @returns {number|Promise<number>}
	*/
	xUnlock(pFile, lockType) {
		this["log"]?.("jUnlock", pFile, lockType);
		return this.jUnlock(pFile, lockType);
	}
	/**
	* @param {number} pFile
	* @param {number} pResOut
	* @returns {number|Promise<number>}
	*/
	xCheckReservedLock(pFile, pResOut) {
		const pResOutView = this.#makeTypedDataView("Int32", pResOut);
		this["log"]?.("jCheckReservedLock", pFile);
		return this.jCheckReservedLock(pFile, pResOutView);
	}
	/**
	* @param {number} pFile
	* @param {number} op
	* @param {number} pArg
	* @returns {number|Promise<number>}
	*/
	xFileControl(pFile, op, pArg) {
		const pArgView = new DataView(this._module.HEAPU8.buffer, this._module.HEAPU8.byteOffset + pArg);
		this["log"]?.("jFileControl", pFile, op, pArgView);
		return this.jFileControl(pFile, op, pArgView);
	}
	/**
	* @param {number} pFile
	* @returns {number|Promise<number>}
	*/
	xSectorSize(pFile) {
		this["log"]?.("jSectorSize", pFile);
		return this.jSectorSize(pFile);
	}
	/**
	* @param {number} pFile
	* @returns {number|Promise<number>}
	*/
	xDeviceCharacteristics(pFile) {
		this["log"]?.("jDeviceCharacteristics", pFile);
		return this.jDeviceCharacteristics(pFile);
	}
	/**
	* Wrapped DataView for pointer arguments.
	* Pointers to a single value are passed using DataView. A Proxy
	* wrapper prevents use of incorrect type or endianness.
	* @param {'Int32'|'BigInt64'} type
	* @param {number} byteOffset
	* @returns {DataView}
	*/
	#makeTypedDataView(type, byteOffset) {
		const byteLength = type === "Int32" ? 4 : 8;
		const getter = `get${type}`;
		const setter = `set${type}`;
		const makeDataView = () => new DataView(this._module.HEAPU8.buffer, this._module.HEAPU8.byteOffset + byteOffset, byteLength);
		let dataView = makeDataView();
		return new Proxy(dataView, { get(_, prop) {
			if (dataView.buffer.byteLength === 0) dataView = makeDataView();
			if (prop === getter) return (byteOffset, littleEndian) => {
				if (littleEndian === false) throw new Error("must be little endian");
				return dataView[prop](byteOffset, littleEndian);
			};
			if (prop === setter) return (byteOffset, value, littleEndian) => {
				if (littleEndian === false) throw new Error("must be little endian");
				return dataView[prop](byteOffset, value, littleEndian);
			};
			if (typeof prop === "string" && /^(get)|(set)/.test(prop) === true) throw new Error("invalid type");
			const result = dataView[prop];
			return typeof result === "function" ? result.bind(dataView) : result;
		} });
	}
	/**
	* @param {number} byteOffset
	* @param {number} byteLength
	*/
	#makeDataArray(byteOffset, byteLength) {
		let target = this._module.HEAPU8.subarray(byteOffset, byteOffset + byteLength);
		return new Proxy(target, { get: (_, prop, receiver) => {
			if (target.buffer.byteLength === 0) target = this._module.HEAPU8.subarray(byteOffset, byteOffset + byteLength);
			const result = target[prop];
			return typeof result === "function" ? result.bind(target) : result;
		} });
	}
	#decodeFilename(zName, flags) {
		if ((flags & 64) !== 0) {
			let pName = zName;
			let state = 1;
			const charCodes = [];
			while (state !== null) {
				const charCode = this._module.HEAPU8[pName++];
				if (charCode !== 0) charCodes.push(charCode);
				else {
					if (this._module.HEAPU8[pName] === 0) state = null;
					switch (state) {
						case 1:
							charCodes.push("?".charCodeAt(0));
							state = 2;
							break;
						case 2:
							charCodes.push("=".charCodeAt(0));
							state = 3;
							break;
						case 3:
							charCodes.push("&".charCodeAt(0));
							state = 2;
					}
				}
			}
			return new TextDecoder().decode(new Uint8Array(charCodes));
		}
		return zName !== 0 ? this._module.UTF8ToString(zName) : null;
	}
};
var delegalize = (lo32, hi32) => hi32 * 4294967296 + lo32 + (lo32 < 0 ? 2 ** 32 : 0);
var SECTOR_SIZE = 4096;
var HEADER_MAX_PATH_SIZE = 512;
var HEADER_DIGEST_SIZE = 8;
var HEADER_CORPUS_SIZE = 516;
var HEADER_OFFSET_FLAGS = HEADER_MAX_PATH_SIZE;
var HEADER_OFFSET_DIGEST = HEADER_CORPUS_SIZE;
var HEADER_OFFSET_DATA = SECTOR_SIZE;
var PERSISTENT_FILE_TYPES = 256 | SQLITE_OPEN_MAIN_JOURNAL | SQLITE_OPEN_SUPER_JOURNAL | SQLITE_OPEN_WAL;
var DEFAULT_CAPACITY = 20;
/**
* This VFS uses the updated Access Handle API with all synchronous methods
* on FileSystemSyncAccessHandle (instead of just read and write). It will
* work with the regular SQLite WebAssembly build, i.e. the one without
* Asyncify.
*/
var AccessHandlePoolVFS = class AccessHandlePoolVFS extends FacadeVFS {
	log = null;
	#directoryPath;
	#directoryHandle;
	#services;
	#mapAccessHandleToName = /* @__PURE__ */ new Map();
	#mapPathToAccessHandle = /* @__PURE__ */ new Map();
	#availableAccessHandles = /* @__PURE__ */ new Set();
	#mapIdToFile = /* @__PURE__ */ new Map();
	static create = Effect_exports.fn(function* (name, directoryPath, module) {
		const services = yield* Effect_exports.context();
		const vfs = new AccessHandlePoolVFS({
			name,
			directoryPath,
			module,
			services
		});
		yield* Effect_exports.promise(() => vfs.isReady());
		return vfs;
	});
	constructor({ name, directoryPath, module, services }) {
		super(name, module);
		this.#directoryPath = directoryPath;
		this.#services = services;
	}
	/**
	* Get the OPFS file name that contains the data for the given SQLite file.
	*
	* @remarks
	*
	* This would be for one of the files in the pool managed by this VFS.
	* It's not the same as the SQLite file name. It's a randomly-generated
	* string that is not meaningful to the application.
	*/
	getOpfsFileName = Effect_exports.fn((zName) => Effect_exports.gen({ self: this }, function* () {
		const path = this.#getPath(zName);
		const accessHandle = this.#mapPathToAccessHandle.get(path);
		return this.#mapAccessHandleToName.get(accessHandle);
	}));
	/**
	* Reads the SQLite payload (without the OPFS header) for the given file.
	*
	* @privateRemarks
	*
	* Since the file's access handle is a FileSystemSyncAccessHandle — which
	* acquires an exclusive lock — we don't need to handle short reads as
	* the file cannot be modified by other threads.
	*/
	readFilePayload = Effect_exports.fn((zName) => Effect_exports.gen({ self: this }, function* () {
		const path = this.#getPath(zName);
		const accessHandle = this.#mapPathToAccessHandle.get(path);
		if (accessHandle === void 0) return shouldNeverHappen("Cannot read payload for untracked OPFS path");
		const opfs = yield* Opfs;
		const fileSize = yield* opfs.syncGetSize(accessHandle);
		if (fileSize <= HEADER_OFFSET_DATA) return shouldNeverHappen(`OPFS file too small to contain header and payload: size ${fileSize} < HEADER_OFFSET_DATA ${HEADER_OFFSET_DATA}`);
		const payloadSize = fileSize - HEADER_OFFSET_DATA;
		const payload = new Uint8Array(payloadSize);
		const bytesRead = yield* opfs.syncRead(accessHandle, payload, { at: HEADER_OFFSET_DATA });
		if (bytesRead !== payloadSize) return shouldNeverHappen(`Failed to read full payload from OPFS file: read ${bytesRead}/${payloadSize}`);
		return payload.buffer;
	}));
	resetAccessHandle = Effect_exports.fn((zName) => Effect_exports.gen({ self: this }, function* () {
		const path = this.#getPath(zName);
		const accessHandle = this.#mapPathToAccessHandle.get(path);
		yield* (yield* Opfs).syncTruncate(accessHandle, HEADER_OFFSET_DATA);
	}));
	jOpen(zName, fileId, flags, pOutFlags) {
		return Effect_exports.gen({ self: this }, function* () {
			const name = zName;
			const path = typeof name === "string" && name !== "" ? this.#getPath(name) : Math.random().toString(36);
			let accessHandle = this.#mapPathToAccessHandle.get(path);
			if (accessHandle == null && (flags & 4) !== 0) {
				if (this.getSize() < this.getCapacity()) {
					[accessHandle] = this.#availableAccessHandles.keys();
					yield* this.#setAssociatedPath(accessHandle, path, flags);
				} else return yield* Effect_exports.die(/* @__PURE__ */ new Error("cannot create file"));
			}
			if (accessHandle == null) return yield* Effect_exports.die(/* @__PURE__ */ new Error("file not found"));
			const file = {
				path,
				flags,
				accessHandle
			};
			this.#mapIdToFile.set(fileId, file);
			pOutFlags.setInt32(0, flags, true);
			return 0;
		}).pipe(tapCauseLogPretty, Effect_exports.catchCause(() => Effect_exports.succeed(14)), Effect_exports.runSyncWith(this.#services));
	}
	jClose(fileId) {
		return Effect_exports.gen({ self: this }, function* () {
			const file = this.#mapIdToFile.get(fileId);
			if (file !== void 0) {
				yield* (yield* Opfs).syncFlush(file.accessHandle);
				this.#mapIdToFile.delete(fileId);
				if ((file.flags & 8) !== 0) yield* this.#deletePath(file.path);
			}
			return 0;
		}).pipe(tapCauseLogPretty, Effect_exports.catchCause(() => Effect_exports.succeed(SQLITE_IOERR_CLOSE)), Effect_exports.runSyncWith(this.#services));
	}
	jRead(fileId, pData, iOffset) {
		return Effect_exports.gen({ self: this }, function* () {
			const file = this.#mapIdToFile.get(fileId);
			const nBytes = yield* (yield* Opfs).syncRead(file.accessHandle, pData.subarray(), { at: HEADER_OFFSET_DATA + iOffset });
			if (nBytes < pData.byteLength) {
				pData.fill(0, nBytes, pData.byteLength);
				return 522;
			}
			return 0;
		}).pipe(tapCauseLogPretty, Effect_exports.catchCause(() => Effect_exports.succeed(266)), Effect_exports.runSyncWith(this.#services));
	}
	jWrite(fileId, pData, iOffset) {
		return Effect_exports.gen({ self: this }, function* () {
			const file = this.#mapIdToFile.get(fileId);
			const nBytes = yield* (yield* Opfs).syncWrite(file.accessHandle, pData.subarray(), { at: HEADER_OFFSET_DATA + iOffset });
			if (nBytes !== pData.byteLength) return yield* Effect_exports.die(/* @__PURE__ */ new Error(`Wrote ${nBytes} bytes, expected ${pData.byteLength}`));
			return 0;
		}).pipe(tapCauseLogPretty, Effect_exports.catchCause(() => Effect_exports.succeed(778)), Effect_exports.runSyncWith(this.#services));
	}
	jTruncate(fileId, iSize) {
		return Effect_exports.gen({ self: this }, function* () {
			const file = this.#mapIdToFile.get(fileId);
			yield* (yield* Opfs).syncTruncate(file.accessHandle, HEADER_OFFSET_DATA + iSize);
			return 0;
		}).pipe(tapCauseLogPretty, Effect_exports.catchCause(() => Effect_exports.succeed(SQLITE_IOERR_TRUNCATE)), Effect_exports.runSyncWith(this.#services));
	}
	jSync(fileId, _flags) {
		return Effect_exports.gen({ self: this }, function* () {
			const file = this.#mapIdToFile.get(fileId);
			yield* (yield* Opfs).syncFlush(file.accessHandle);
			return 0;
		}).pipe(tapCauseLogPretty, Effect_exports.catchCause(() => Effect_exports.succeed(SQLITE_IOERR_FSYNC)), Effect_exports.runSyncWith(this.#services));
	}
	jFileSize(fileId, pSize64) {
		return Effect_exports.gen({ self: this }, function* () {
			const file = this.#mapIdToFile.get(fileId);
			const size = (yield* (yield* Opfs).syncGetSize(file.accessHandle)) - HEADER_OFFSET_DATA;
			pSize64.setBigInt64(0, BigInt(size), true);
			return 0;
		}).pipe(tapCauseLogPretty, Effect_exports.catchCause(() => Effect_exports.succeed(SQLITE_IOERR_FSTAT)), Effect_exports.runSyncWith(this.#services));
	}
	jSectorSize(_fileId) {
		return SECTOR_SIZE;
	}
	jDeviceCharacteristics(_fileId) {
		return SQLITE_IOCAP_UNDELETABLE_WHEN_OPEN;
	}
	jAccess(zName, _flags, pResOut) {
		return Effect_exports.gen({ self: this }, function* () {
			const path = this.#getPath(zName);
			pResOut.setInt32(0, this.#mapPathToAccessHandle.has(path) === true ? 1 : 0, true);
			return 0;
		}).pipe(tapCauseLogPretty, Effect_exports.catchCause(() => Effect_exports.succeed(SQLITE_IOERR_ACCESS)), Effect_exports.runSyncWith(this.#services));
	}
	jDelete(zName, _syncDir) {
		return Effect_exports.gen({ self: this }, function* () {
			const path = this.#getPath(zName);
			yield* this.#deletePath(path);
			return 0;
		}).pipe(tapCauseLogPretty, Effect_exports.catchCause(() => Effect_exports.succeed(SQLITE_IOERR_DELETE)), Effect_exports.runSyncWith(this.#services));
	}
	close() {
		this.#releaseAccessHandles().pipe(Effect_exports.runPromiseWith(this.#services));
	}
	async isReady() {
		return Effect_exports.gen({ self: this }, function* () {
			if (this.#directoryHandle == null) {
				this.#directoryHandle = yield* getDirectoryHandleByPath(this.#directoryPath, { create: true });
				yield* this.#acquireAccessHandles();
				if (this.getCapacity() === 0) yield* this.addCapacity(DEFAULT_CAPACITY);
			}
			return true;
		}).pipe(Effect_exports.runPromiseWith(this.#services));
	}
	/**
	* Returns the number of SQLite files in the file system.
	*/
	getSize() {
		return this.#mapPathToAccessHandle.size;
	}
	/**
	* Returns the maximum number of SQLite files the file system can hold.
	*/
	getCapacity() {
		return this.#mapAccessHandleToName.size;
	}
	/**
	* Get all currently tracked SQLite file paths.
	* This can be used by higher-level components for file management operations.
	*
	* @returns Array of currently active SQLite file paths
	*/
	getTrackedFilePaths() {
		return Array.from(this.#mapPathToAccessHandle.keys());
	}
	/**
	* Increase the capacity of the file system by n.
	*/
	addCapacity = Effect_exports.fn((n) => Effect_exports.replicateEffect(Effect_exports.gen({ self: this }, function* () {
		const name = Math.random().toString(36).replace("0.", "");
		const opfs = yield* Opfs;
		const accessHandle = yield* opfs.getFileHandle(this.#directoryHandle, name, { create: true }).pipe(Effect_exports.andThen((handle) => opfs.createSyncAccessHandle(handle)), Effect_exports.retry(exponentialBackoff10Sec));
		this.#mapAccessHandleToName.set(accessHandle, name);
		yield* this.#setAssociatedPath(accessHandle, "", 0);
	}), n, { discard: true }));
	/**
	* Decrease the capacity of the file system by n. The capacity cannot be
	* decreased to fewer than the current number of SQLite files in the
	* file system.
	*/
	removeCapacity = Effect_exports.fn((n) => Effect_exports.gen({ self: this }, function* () {
		let nRemoved = 0;
		yield* Effect_exports.forEach(this.#availableAccessHandles, (accessHandle) => Effect_exports.gen({ self: this }, function* () {
			if (nRemoved === n || this.getSize() === this.getCapacity()) return nRemoved;
			const name = this.#mapAccessHandleToName.get(accessHandle);
			accessHandle.close();
			yield* (yield* Opfs).removeEntry(this.#directoryHandle, name);
			this.#mapAccessHandleToName.delete(accessHandle);
			this.#availableAccessHandles.delete(accessHandle);
			++nRemoved;
			return nRemoved;
		}), { discard: true });
		return nRemoved;
	}));
	#acquireAccessHandles = Effect_exports.fn(() => Effect_exports.gen({ self: this }, function* () {
		const opfs = yield* Opfs;
		yield* opfs.values(this.#directoryHandle).pipe(Stream_exports.filter((handle) => handle.kind === "file"), Stream_exports.mapEffect((fileHandle) => Effect_exports.gen({ self: this }, function* () {
			const accessHandle = yield* opfs.createSyncAccessHandle(fileHandle);
			return {
				accessHandle,
				opfsFileName: fileHandle.name,
				path: yield* this.#getAssociatedPath(accessHandle)
			};
		}), { concurrency: "unbounded" }), Stream_exports.runForEach(({ opfsFileName, accessHandle, path }) => Effect_exports.gen({ self: this }, function* () {
			this.#mapAccessHandleToName.set(accessHandle, opfsFileName);
			if (path !== "") this.#mapPathToAccessHandle.set(path, accessHandle);
			else this.#availableAccessHandles.add(accessHandle);
		})));
	}));
	#releaseAccessHandles = Effect_exports.fn(() => Effect_exports.gen({ self: this }, function* () {
		yield* Effect_exports.forEach(this.#mapAccessHandleToName.keys(), (accessHandle) => Effect_exports.sync(() => accessHandle.close()), {
			concurrency: "unbounded",
			discard: true
		});
		this.#mapAccessHandleToName.clear();
		this.#mapPathToAccessHandle.clear();
		this.#availableAccessHandles.clear();
	}));
	/**
	* Read and return the associated path from an OPFS file header.
	* Empty string is returned for an unassociated OPFS file.
	* @returns {string} path or empty string
	*/
	#getAssociatedPath = Effect_exports.fn((accessHandle) => Effect_exports.gen({ self: this }, function* () {
		const corpus = new Uint8Array(HEADER_CORPUS_SIZE);
		const opfs = yield* Opfs;
		yield* opfs.syncRead(accessHandle, corpus, { at: 0 });
		const flags = new DataView(corpus.buffer, corpus.byteOffset).getUint32(HEADER_OFFSET_FLAGS);
		if (corpus[0] !== 0 && ((flags & 8) !== 0 || (flags & PERSISTENT_FILE_TYPES) === 0)) {
			yield* Effect_exports.logWarning(`Remove file with unexpected flags ${flags.toString(16)}`);
			yield* this.#setAssociatedPath(accessHandle, "", 0);
			return "";
		}
		const fileDigest = new Uint32Array(HEADER_DIGEST_SIZE / 4);
		yield* opfs.syncRead(accessHandle, fileDigest, { at: HEADER_OFFSET_DIGEST });
		const computedDigest = this.#computeDigest(corpus);
		if (fileDigest.every((value, i) => value === computedDigest[i]) === true) {
			const pathBytes = corpus.indexOf(0);
			if (pathBytes === 0) yield* opfs.syncTruncate(accessHandle, HEADER_OFFSET_DATA);
			return new TextDecoder().decode(corpus.subarray(0, pathBytes));
		} else {
			yield* Effect_exports.logWarning("Disassociating file with bad digest.");
			yield* this.#setAssociatedPath(accessHandle, "", 0);
			return "";
		}
	}));
	/**
	* Set the path on an OPFS file header.
	*/
	#setAssociatedPath = Effect_exports.fn((accessHandle, path, flags) => Effect_exports.gen({ self: this }, function* () {
		const corpus = new Uint8Array(HEADER_CORPUS_SIZE);
		if (new TextEncoder().encodeInto(path, corpus).written >= HEADER_MAX_PATH_SIZE) return yield* Effect_exports.die(/* @__PURE__ */ new Error("path too long"));
		new DataView(corpus.buffer, corpus.byteOffset).setUint32(HEADER_OFFSET_FLAGS, flags);
		const digest = this.#computeDigest(corpus);
		const opfs = yield* Opfs;
		yield* opfs.syncWrite(accessHandle, corpus, { at: 0 });
		yield* opfs.syncWrite(accessHandle, digest, { at: HEADER_OFFSET_DIGEST });
		yield* opfs.syncFlush(accessHandle);
		if (path !== "") {
			this.#mapPathToAccessHandle.set(path, accessHandle);
			this.#availableAccessHandles.delete(accessHandle);
		} else {
			yield* opfs.syncTruncate(accessHandle, HEADER_OFFSET_DATA);
			this.#availableAccessHandles.add(accessHandle);
		}
	}));
	/**
	* We need a synchronous digest function so can't use WebCrypto.
	* Adapted from https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
	* @returns {ArrayBuffer} 64-bit digest
	*/
	#computeDigest(corpus) {
		if (corpus[0] === 0) return new Uint32Array([4274806656, 2899230775]);
		let h1 = 3735928559;
		let h2 = 1103547991;
		for (const value of corpus) {
			h1 = Math.imul(h1 ^ value, 2654435761);
			h2 = Math.imul(h2 ^ value, 1597334677);
		}
		h1 = Math.imul(h1 ^ h1 >>> 16, 2246822507) ^ Math.imul(h2 ^ h2 >>> 13, 3266489909);
		h2 = Math.imul(h2 ^ h2 >>> 16, 2246822507) ^ Math.imul(h1 ^ h1 >>> 13, 3266489909);
		return new Uint32Array([h1 >>> 0, h2 >>> 0]);
	}
	/**
	* Convert a bare filename, path, or URL to a UNIX-style path.
	*/
	#getPath(nameOrURL) {
		return (typeof nameOrURL === "string" ? new URL(nameOrURL, "file://localhost/") : nameOrURL).pathname;
	}
	/**
	* Remove the association between a path and an OPFS file.
	* @param {string} path
	*/
	#deletePath = Effect_exports.fn((path) => Effect_exports.gen({ self: this }, function* () {
		const accessHandle = this.#mapPathToAccessHandle.get(path);
		if (accessHandle !== void 0) {
			this.#mapPathToAccessHandle.delete(path);
			yield* this.#setAssociatedPath(accessHandle, "", 0);
		}
	}));
};
var semaphore = make$10(1).pipe(Effect_exports.runSync);
var opfsVfsMap = /* @__PURE__ */ new Map();
var makeOpfsDb = ({ sqlite3, directory, fileName }) => Effect_exports.gen(function* () {
	const safePath = directory.replaceAll(/["*/:<>?\\|]/g, "_");
	const vfsName = `opfs${safePath.length === 0 ? "" : `-${safePath}`}`;
	if (sqlite3.vfs_registered.has(vfsName) === false) {
		const vfs = yield* AccessHandlePoolVFS.create(vfsName, directory, sqlite3.module);
		sqlite3.vfs_register(vfs, false);
		opfsVfsMap.set(vfsName, vfs);
	}
	return {
		dbPointer: sqlite3.open_v2Sync(fileName, void 0, vfsName),
		vfs: opfsVfsMap.get(vfsName)
	};
}).pipe(semaphore.withPermits(1));
var sqliteDbFactory = ({ sqlite3 }) => {
	function makeDb(input) {
		return Effect_exports.gen(function* () {
			if (input._tag === "in-memory") {
				const { dbPointer, vfs } = makeInMemoryDb(sqlite3);
				return makeSqliteDb({
					sqlite3,
					metadata: {
						_tag: "in-memory",
						vfs,
						dbPointer,
						deleteDb: () => {},
						configureDb: input.configureDb ?? (() => {}),
						persistenceInfo: { fileName: ":memory:" }
					}
				});
			}
			const MAX_DB_FILENAME_LENGTH = 60;
			let dbFilename = input.fileName;
			if (input.fileName.length > MAX_DB_FILENAME_LENGTH) {
				yield* Effect_exports.logWarning(`dbFilename too long: '${input.fileName}'. Max ${MAX_DB_FILENAME_LENGTH} chars, got ${input.fileName.length}. Hashing...`);
				dbFilename = `hash-${string(input.fileName)}.db`;
			}
			const { dbPointer, vfs } = yield* makeOpfsDb({
				sqlite3,
				directory: input.opfsDirectory,
				fileName: dbFilename
			});
			const services = yield* Effect_exports.context();
			return makeSqliteDb({
				sqlite3,
				metadata: {
					_tag: "opfs",
					vfs,
					dbPointer,
					deleteDb: () => vfs.resetAccessHandle(input.fileName).pipe(Effect_exports.runSyncWith(services)),
					configureDb: input.configureDb ?? (() => {}),
					persistenceInfo: {
						fileName: dbFilename,
						opfsDirectory: input.opfsDirectory,
						opfsFileName: yield* vfs.getOpfsFileName(dbFilename)
					}
				}
			});
		});
	}
	return makeDb;
};
var CreateConnection = Schema_exports.TaggedStruct("WebmeshWorker.CreateConnection", {
	from: Schema_exports.String,
	port: MessagePort
});
Schema_exports.Union([CreateConnection]);
Service()("@livestore/webmesh:worker:CacheService");
var connectViaWorker = ({ node, target, worker }) => Effect_exports.gen(function* () {
	const mc = new MessageChannel();
	const isConnected = yield* make$6();
	if (LS_DEV === true) yield* addFinalizerLog(`@livestore/webmesh:worker: closing message channel ${node.nodeName} -> ${target}`);
	yield* worker.execute(CreateConnection.make({
		from: node.nodeName,
		port: mc.port1
	})).pipe(Stream_exports.tap(() => succeed$2(isConnected, true)), Stream_exports.runDrain, tapCauseLogPretty, Effect_exports.forkScoped);
	yield* _await(isConnected);
	const workerConnection = yield* messagePortChannel({
		port: mc.port2,
		schema: Packet
	});
	yield* node.addEdge({
		target,
		edgeChannel: workerConnection,
		replaceIfExists: true
	});
	if (LS_DEV === true) yield* Effect_exports.logDebug(`@livestore/webmesh:worker: initiated connection: ${node.nodeName} -> ${target}`);
});
var makeSharedWorkerNodeName = ({ storeId }) => `shared-worker-${storeId}`;
var makeSessionInfoBroadcastChannel = broadcastChannel({
	channelName: "session-info",
	schema: Message
});
var makeBrowserExtensionNodeName = {
	contentscriptMain: (tabId) => `contentscript-main-${tabId}`,
	contentscriptIframe: (tabId) => `contentscript-iframe-${tabId}`
};
var ClientSessionContentscriptMainReq = Schema_exports.TaggedStruct("ClientSessionContentscriptMainReq", {
	storeId: Schema_exports.String,
	clientId: Schema_exports.String,
	sessionId: Schema_exports.String
});
var ClientSessionContentscriptMainRes = Schema_exports.TaggedStruct("ClientSessionContentscriptMainRes", { tabId: Schema_exports.Finite });
var makeStaticClientSessionChannel = {
	contentscriptMain: Effect_exports.suspend(() => windowChannel({
		listenWindow: window,
		sendWindow: window,
		schema: {
			listen: ClientSessionContentscriptMainReq,
			send: ClientSessionContentscriptMainRes
		},
		ids: {
			own: "contentscript-main-static",
			other: "client-session-static"
		}
	})),
	clientSession: Effect_exports.suspend(() => windowChannel({
		listenWindow: window,
		sendWindow: window,
		schema: {
			listen: ClientSessionContentscriptMainRes,
			send: ClientSessionContentscriptMainReq
		},
		ids: {
			own: "client-session-static",
			other: "contentscript-main-static"
		}
	}))
};
var logDevtoolsUrl = Effect_exports.fn("@livestore/adapter-web:client-session:devtools:logDevtoolsUrl")(function* ({ schema, storeId, clientId, sessionId }) {
	if (isDevEnv() === true) {
		const devtoolsPath = globalThis.LIVESTORE_DEVTOOLS_PATH ?? `/_livestore`;
		const devtoolsBaseUrl = `${location.origin}${devtoolsPath}`;
		const response = yield* Effect_exports.promise(() => fetch(devtoolsBaseUrl));
		if (response.ok === true) {
			if ((yield* Effect_exports.promise(() => response.text())).includes("<meta name=\"livestore-devtools\" content=\"true\" />") === true) {
				const url = `${devtoolsBaseUrl}/web/${storeId}/${clientId}/${sessionId}/${schema.devtools.alias}`;
				yield* Effect_exports.log(`[@livestore/adapter-web] Devtools ready on ${url}`);
			}
			if (document.querySelector("[id^=\"livestore-devtools-iframe-\"]") !== null === false) {
				const g = globalThis;
				if (g.__livestoreDevtoolsChromeNoticeShown !== true) {
					g.__livestoreDevtoolsChromeNoticeShown = true;
					const urlToLog = `https://github.com/livestorejs/livestore/releases/download/v${liveStoreVersion}/livestore-devtools-chrome-${liveStoreVersion}.zip`;
					yield* Effect_exports.log(`[@livestore/adapter-web] LiveStore DevTools Chrome extension not detected. Install v${liveStoreVersion}: ${urlToLog}`);
				}
			}
		}
	}
});
var connectWebmeshNodeClientSession = Effect_exports.fn(function* ({ webmeshNode, sessionInfo, sharedWorker, devtoolsEnabled, schema }) {
	if (devtoolsEnabled === true) {
		const { clientId, sessionId, storeId } = sessionInfo;
		yield* logDevtoolsUrl({
			clientId,
			sessionId,
			schema,
			storeId
		});
		yield* provideSessionInfo({
			webChannel: yield* makeSessionInfoBroadcastChannel,
			sessionInfo
		}).pipe(tapCauseLogPretty, Effect_exports.forkScoped);
		yield* Effect_exports.gen(function* () {
			const clientSessionStaticChannel = yield* makeStaticClientSessionChannel.clientSession;
			yield* clientSessionStaticChannel.send(ClientSessionContentscriptMainReq.make({
				clientId,
				sessionId,
				storeId
			}));
			const { tabId } = yield* clientSessionStaticChannel.listen.pipe(Stream_exports.mapEffect(Effect_exports.fromResult), Stream_exports.runHead, Effect_exports.flatMap(Effect_exports.fromOption));
			const contentscriptMainNodeName = makeBrowserExtensionNodeName.contentscriptMain(tabId);
			const contentscriptMainChannel = yield* windowChannel({
				listenWindow: window,
				sendWindow: window,
				schema: Packet,
				ids: {
					own: webmeshNode.nodeName,
					other: contentscriptMainNodeName
				}
			});
			yield* webmeshNode.addEdge({
				target: contentscriptMainNodeName,
				edgeChannel: contentscriptMainChannel
			});
		}).pipe(Effect_exports.withSpan("@livestore/adapter-web:client-session:devtools:browser-extension"), tapCauseLogPretty, Effect_exports.forkScoped);
		yield* connectViaWorker({
			node: webmeshNode,
			target: makeSharedWorkerNodeName({ storeId }),
			worker: sharedWorker
		});
	}
});
async function Module(moduleArg = {}) {
	var moduleRtn;
	var Module = moduleArg;
	var ENVIRONMENT_IS_WORKER = false;
	var ENVIRONMENT_IS_NODE = true;
	if (ENVIRONMENT_IS_NODE) {
		const { createRequire } = await import("module");
		var require = createRequire(import.meta.url);
	}
	var thisProgram = "./this.program";
	var quit_ = (status, toThrow) => {
		throw toThrow;
	};
	var _scriptName = import.meta.url;
	var scriptDirectory = "";
	function locateFile(path) {
		if (Module["locateFile"]) return Module["locateFile"](path, scriptDirectory);
		return scriptDirectory + path;
	}
	var readAsync, readBinary;
	if (ENVIRONMENT_IS_NODE) {
		var fs = require("fs");
		if (_scriptName.startsWith("file:")) scriptDirectory = require("path").dirname(require("url").fileURLToPath(_scriptName)) + "/";
		readBinary = (filename) => {
			filename = isFileURI(filename) ? new URL(filename) : filename;
			return fs.readFileSync(filename);
		};
		readAsync = async (filename, binary = true) => {
			filename = isFileURI(filename) ? new URL(filename) : filename;
			return fs.readFileSync(filename, binary ? void 0 : "utf8");
		};
		if (process.argv.length > 1) thisProgram = process.argv[1].replace(/\\/g, "/");
		process.argv.slice(2);
		quit_ = (status, toThrow) => {
			process.exitCode = status;
			throw toThrow;
		};
	}
	var out = console.log.bind(console);
	var err = console.error.bind(console);
	var wasmBinary;
	var ABORT = false;
	var EXITSTATUS;
	var isFileURI = (filename) => filename.startsWith("file://");
	var readyPromiseResolve, readyPromiseReject;
	var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
	var runtimeInitialized = false;
	function updateMemoryViews() {
		var b = wasmMemory.buffer;
		HEAP8 = new Int8Array(b);
		HEAP16 = new Int16Array(b);
		Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
		HEAPU16 = new Uint16Array(b);
		Module["HEAP32"] = HEAP32 = new Int32Array(b);
		HEAPU32 = new Uint32Array(b);
		HEAPF32 = new Float32Array(b);
		HEAPF64 = new Float64Array(b);
	}
	function preRun() {
		if (Module["preRun"]) {
			if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
			while (Module["preRun"].length) addOnPreRun(Module["preRun"].shift());
		}
		callRuntimeCallbacks(onPreRuns);
	}
	function initRuntime() {
		runtimeInitialized = true;
		if (!Module["noFSInit"] && !FS.initialized) FS.init();
		TTY.init();
		wasmExports["sa"]();
		FS.ignorePermissions = false;
	}
	function postRun() {
		if (Module["postRun"]) {
			if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
			while (Module["postRun"].length) addOnPostRun(Module["postRun"].shift());
		}
		callRuntimeCallbacks(onPostRuns);
	}
	function abort(what) {
		Module["onAbort"]?.(what);
		what = "Aborted(" + what + ")";
		err(what);
		ABORT = true;
		what += ". Build with -sASSERTIONS for more info.";
		var e = new WebAssembly.RuntimeError(what);
		readyPromiseReject?.(e);
		throw e;
	}
	var wasmBinaryFile;
	function findWasmBinary() {
		if (Module["locateFile"]) return locateFile("wa-sqlite.node.wasm");
		return new URL("wa-sqlite.node.wasm", import.meta.url).href;
	}
	function getBinarySync(file) {
		if (file == wasmBinaryFile && wasmBinary) return new Uint8Array(wasmBinary);
		if (readBinary) return readBinary(file);
		throw "both async and sync fetching of the wasm failed";
	}
	async function getWasmBinary(binaryFile) {
		if (!wasmBinary) try {
			var response = await readAsync(binaryFile);
			return new Uint8Array(response);
		} catch {}
		return getBinarySync(binaryFile);
	}
	async function instantiateArrayBuffer(binaryFile, imports) {
		try {
			var binary = await getWasmBinary(binaryFile);
			return await WebAssembly.instantiate(binary, imports);
		} catch (reason) {
			err(`failed to asynchronously prepare wasm: ${reason}`);
			abort(reason);
		}
	}
	async function instantiateAsync(binary, binaryFile, imports) {
		if (!binary && !ENVIRONMENT_IS_NODE) try {
			var response = fetch(binaryFile, { credentials: "same-origin" });
			return await WebAssembly.instantiateStreaming(response, imports);
		} catch (reason) {
			err(`wasm streaming compile failed: ${reason}`);
			err("falling back to ArrayBuffer instantiation");
		}
		return instantiateArrayBuffer(binaryFile, imports);
	}
	function getWasmImports() {
		return { a: wasmImports };
	}
	async function createWasm() {
		function receiveInstance(instance, module) {
			wasmExports = instance.exports;
			assignWasmExports(wasmExports);
			updateMemoryViews();
			return wasmExports;
		}
		function receiveInstantiationResult(result) {
			return receiveInstance(result["instance"]);
		}
		var info = getWasmImports();
		if (Module["instantiateWasm"]) return new Promise((resolve, reject) => {
			Module["instantiateWasm"](info, (inst, mod) => {
				resolve(receiveInstance(inst, mod));
			});
		});
		wasmBinaryFile ??= findWasmBinary();
		return receiveInstantiationResult(await instantiateAsync(wasmBinary, wasmBinaryFile, info));
	}
	var tempDouble;
	var tempI64;
	class ExitStatus {
		name = "ExitStatus";
		constructor(status) {
			this.message = `Program terminated with exit(${status})`;
			this.status = status;
		}
	}
	var callRuntimeCallbacks = (callbacks) => {
		while (callbacks.length > 0) callbacks.shift()(Module);
	};
	var onPostRuns = [];
	var addOnPostRun = (cb) => onPostRuns.push(cb);
	var onPreRuns = [];
	var addOnPreRun = (cb) => onPreRuns.push(cb);
	function getValue(ptr, type = "i8") {
		if (type.endsWith("*")) type = "*";
		switch (type) {
			case "i1": return HEAP8[ptr];
			case "i8": return HEAP8[ptr];
			case "i16": return HEAP16[ptr >> 1];
			case "i32": return HEAP32[ptr >> 2];
			case "i64": abort("to do getValue(i64) use WASM_BIGINT");
			case "float": return HEAPF32[ptr >> 2];
			case "double": return HEAPF64[ptr >> 3];
			case "*": return HEAPU32[ptr >> 2];
			default: abort(`invalid type for getValue: ${type}`);
		}
	}
	var noExitRuntime = true;
	function setValue(ptr, value, type = "i8") {
		if (type.endsWith("*")) type = "*";
		switch (type) {
			case "i1":
				HEAP8[ptr] = value;
				break;
			case "i8":
				HEAP8[ptr] = value;
				break;
			case "i16":
				HEAP16[ptr >> 1] = value;
				break;
			case "i32":
				HEAP32[ptr >> 2] = value;
				break;
			case "i64": abort("to do setValue(i64) use WASM_BIGINT");
			case "float":
				HEAPF32[ptr >> 2] = value;
				break;
			case "double":
				HEAPF64[ptr >> 3] = value;
				break;
			case "*":
				HEAPU32[ptr >> 2] = value;
				break;
			default: abort(`invalid type for setValue: ${type}`);
		}
	}
	var stackRestore = (val) => __emscripten_stack_restore(val);
	var stackSave = () => _emscripten_stack_get_current();
	var UTF8Decoder = new TextDecoder();
	var findStringEnd = (heapOrArray, idx, maxBytesToRead, ignoreNul) => {
		var maxIdx = idx + maxBytesToRead;
		if (ignoreNul) return maxIdx;
		while (heapOrArray[idx] && !(idx >= maxIdx)) ++idx;
		return idx;
	};
	var UTF8ToString = (ptr, maxBytesToRead, ignoreNul) => {
		if (!ptr) return "";
		var end = findStringEnd(HEAPU8, ptr, maxBytesToRead, ignoreNul);
		return UTF8Decoder.decode(HEAPU8.subarray(ptr, end));
	};
	var ___assert_fail = (condition, filename, line, func) => abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [
		filename ? UTF8ToString(filename) : "unknown filename",
		line,
		func ? UTF8ToString(func) : "unknown function"
	]);
	var PATH = {
		isAbs: (path) => path.charAt(0) === "/",
		splitPath: (filename) => {
			return /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(filename).slice(1);
		},
		normalizeArray: (parts, allowAboveRoot) => {
			var up = 0;
			for (var i = parts.length - 1; i >= 0; i--) {
				var last = parts[i];
				if (last === ".") parts.splice(i, 1);
				else if (last === "..") {
					parts.splice(i, 1);
					up++;
				} else if (up) {
					parts.splice(i, 1);
					up--;
				}
			}
			if (allowAboveRoot) for (; up; up--) parts.unshift("..");
			return parts;
		},
		normalize: (path) => {
			var isAbsolute = PATH.isAbs(path), trailingSlash = path.slice(-1) === "/";
			path = PATH.normalizeArray(path.split("/").filter((p) => !!p), !isAbsolute).join("/");
			if (!path && !isAbsolute) path = ".";
			if (path && trailingSlash) path += "/";
			return (isAbsolute ? "/" : "") + path;
		},
		dirname: (path) => {
			var result = PATH.splitPath(path), root = result[0], dir = result[1];
			if (!root && !dir) return ".";
			if (dir) dir = dir.slice(0, -1);
			return root + dir;
		},
		basename: (path) => path && path.match(/([^\/]+|\/)\/*$/)[1],
		join: (...paths) => PATH.normalize(paths.join("/")),
		join2: (l, r) => PATH.normalize(l + "/" + r)
	};
	var initRandomFill = () => {
		if (ENVIRONMENT_IS_NODE) {
			var nodeCrypto = require("crypto");
			return (view) => nodeCrypto.randomFillSync(view);
		}
		return (view) => crypto.getRandomValues(view);
	};
	var randomFill = (view) => {
		(randomFill = initRandomFill())(view);
	};
	var PATH_FS = {
		resolve: (...args) => {
			var resolvedPath = "", resolvedAbsolute = false;
			for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
				var path = i >= 0 ? args[i] : FS.cwd();
				if (typeof path != "string") throw new TypeError("Arguments to path.resolve must be strings");
				else if (!path) return "";
				resolvedPath = path + "/" + resolvedPath;
				resolvedAbsolute = PATH.isAbs(path);
			}
			resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter((p) => !!p), !resolvedAbsolute).join("/");
			return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
		},
		relative: (from, to) => {
			from = PATH_FS.resolve(from).slice(1);
			to = PATH_FS.resolve(to).slice(1);
			function trim(arr) {
				var start = 0;
				for (; start < arr.length; start++) if (arr[start] !== "") break;
				var end = arr.length - 1;
				for (; end >= 0; end--) if (arr[end] !== "") break;
				if (start > end) return [];
				return arr.slice(start, end - start + 1);
			}
			var fromParts = trim(from.split("/"));
			var toParts = trim(to.split("/"));
			var length = Math.min(fromParts.length, toParts.length);
			var samePartsLength = length;
			for (var i = 0; i < length; i++) if (fromParts[i] !== toParts[i]) {
				samePartsLength = i;
				break;
			}
			var outputParts = [];
			for (var i = samePartsLength; i < fromParts.length; i++) outputParts.push("..");
			outputParts = outputParts.concat(toParts.slice(samePartsLength));
			return outputParts.join("/");
		}
	};
	var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => {
		var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul);
		return UTF8Decoder.decode(heapOrArray.buffer ? heapOrArray.subarray(idx, endPtr) : new Uint8Array(heapOrArray.slice(idx, endPtr)));
	};
	var FS_stdin_getChar_buffer = [];
	var lengthBytesUTF8 = (str) => {
		var len = 0;
		for (var i = 0; i < str.length; ++i) {
			var c = str.charCodeAt(i);
			if (c <= 127) len++;
			else if (c <= 2047) len += 2;
			else if (c >= 55296 && c <= 57343) {
				len += 4;
				++i;
			} else len += 3;
		}
		return len;
	};
	var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
		if (!(maxBytesToWrite > 0)) return 0;
		var startIdx = outIdx;
		var endIdx = outIdx + maxBytesToWrite - 1;
		for (var i = 0; i < str.length; ++i) {
			var u = str.codePointAt(i);
			if (u <= 127) {
				if (outIdx >= endIdx) break;
				heap[outIdx++] = u;
			} else if (u <= 2047) {
				if (outIdx + 1 >= endIdx) break;
				heap[outIdx++] = 192 | u >> 6;
				heap[outIdx++] = 128 | u & 63;
			} else if (u <= 65535) {
				if (outIdx + 2 >= endIdx) break;
				heap[outIdx++] = 224 | u >> 12;
				heap[outIdx++] = 128 | u >> 6 & 63;
				heap[outIdx++] = 128 | u & 63;
			} else {
				if (outIdx + 3 >= endIdx) break;
				heap[outIdx++] = 240 | u >> 18;
				heap[outIdx++] = 128 | u >> 12 & 63;
				heap[outIdx++] = 128 | u >> 6 & 63;
				heap[outIdx++] = 128 | u & 63;
				i++;
			}
		}
		heap[outIdx] = 0;
		return outIdx - startIdx;
	};
	var intArrayFromString = (stringy, dontAddNull, length) => {
		var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
		var u8array = new Array(len);
		var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
		if (dontAddNull) u8array.length = numBytesWritten;
		return u8array;
	};
	var FS_stdin_getChar = () => {
		if (!FS_stdin_getChar_buffer.length) {
			var result = null;
			if (ENVIRONMENT_IS_NODE) {
				var BUFSIZE = 256;
				var buf = Buffer.alloc(BUFSIZE);
				var bytesRead = 0;
				var fd = process.stdin.fd;
				try {
					bytesRead = fs.readSync(fd, buf, 0, BUFSIZE);
				} catch (e) {
					if (e.toString().includes("EOF")) bytesRead = 0;
					else throw e;
				}
				if (bytesRead > 0) result = buf.slice(0, bytesRead).toString("utf-8");
			}
			if (!result) return null;
			FS_stdin_getChar_buffer = intArrayFromString(result, true);
		}
		return FS_stdin_getChar_buffer.shift();
	};
	var TTY = {
		ttys: [],
		init() {},
		shutdown() {},
		register(dev, ops) {
			TTY.ttys[dev] = {
				input: [],
				output: [],
				ops
			};
			FS.registerDevice(dev, TTY.stream_ops);
		},
		stream_ops: {
			open(stream) {
				var tty = TTY.ttys[stream.node.rdev];
				if (!tty) throw new FS.ErrnoError(43);
				stream.tty = tty;
				stream.seekable = false;
			},
			close(stream) {
				stream.tty.ops.fsync(stream.tty);
			},
			fsync(stream) {
				stream.tty.ops.fsync(stream.tty);
			},
			read(stream, buffer, offset, length, pos) {
				if (!stream.tty || !stream.tty.ops.get_char) throw new FS.ErrnoError(60);
				var bytesRead = 0;
				for (var i = 0; i < length; i++) {
					var result;
					try {
						result = stream.tty.ops.get_char(stream.tty);
					} catch (e) {
						throw new FS.ErrnoError(29);
					}
					if (result === void 0 && bytesRead === 0) throw new FS.ErrnoError(6);
					if (result === null || result === void 0) break;
					bytesRead++;
					buffer[offset + i] = result;
				}
				if (bytesRead) stream.node.atime = Date.now();
				return bytesRead;
			},
			write(stream, buffer, offset, length, pos) {
				if (!stream.tty || !stream.tty.ops.put_char) throw new FS.ErrnoError(60);
				try {
					for (var i = 0; i < length; i++) stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
				} catch (e) {
					throw new FS.ErrnoError(29);
				}
				if (length) stream.node.mtime = stream.node.ctime = Date.now();
				return i;
			}
		},
		default_tty_ops: {
			get_char(tty) {
				return FS_stdin_getChar();
			},
			put_char(tty, val) {
				if (val === null || val === 10) {
					out(UTF8ArrayToString(tty.output));
					tty.output = [];
				} else if (val != 0) tty.output.push(val);
			},
			fsync(tty) {
				if (tty.output?.length > 0) {
					out(UTF8ArrayToString(tty.output));
					tty.output = [];
				}
			},
			ioctl_tcgets(tty) {
				return {
					c_iflag: 25856,
					c_oflag: 5,
					c_cflag: 191,
					c_lflag: 35387,
					c_cc: [
						3,
						28,
						127,
						21,
						4,
						0,
						1,
						0,
						17,
						19,
						26,
						0,
						18,
						15,
						23,
						22,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0
					]
				};
			},
			ioctl_tcsets(tty, optional_actions, data) {
				return 0;
			},
			ioctl_tiocgwinsz(tty) {
				return [24, 80];
			}
		},
		default_tty1_ops: {
			put_char(tty, val) {
				if (val === null || val === 10) {
					err(UTF8ArrayToString(tty.output));
					tty.output = [];
				} else if (val != 0) tty.output.push(val);
			},
			fsync(tty) {
				if (tty.output?.length > 0) {
					err(UTF8ArrayToString(tty.output));
					tty.output = [];
				}
			}
		}
	};
	var zeroMemory = (ptr, size) => HEAPU8.fill(0, ptr, ptr + size);
	var alignMemory = (size, alignment) => Math.ceil(size / alignment) * alignment;
	var mmapAlloc = (size) => {
		size = alignMemory(size, 65536);
		var ptr = _emscripten_builtin_memalign(65536, size);
		if (ptr) zeroMemory(ptr, size);
		return ptr;
	};
	var MEMFS = {
		ops_table: null,
		mount(mount) {
			return MEMFS.createNode(null, "/", 16895, 0);
		},
		createNode(parent, name, mode, dev) {
			if (FS.isBlkdev(mode) || FS.isFIFO(mode)) throw new FS.ErrnoError(63);
			MEMFS.ops_table ||= {
				dir: {
					node: {
						getattr: MEMFS.node_ops.getattr,
						setattr: MEMFS.node_ops.setattr,
						lookup: MEMFS.node_ops.lookup,
						mknod: MEMFS.node_ops.mknod,
						rename: MEMFS.node_ops.rename,
						unlink: MEMFS.node_ops.unlink,
						rmdir: MEMFS.node_ops.rmdir,
						readdir: MEMFS.node_ops.readdir,
						symlink: MEMFS.node_ops.symlink
					},
					stream: { llseek: MEMFS.stream_ops.llseek }
				},
				file: {
					node: {
						getattr: MEMFS.node_ops.getattr,
						setattr: MEMFS.node_ops.setattr
					},
					stream: {
						llseek: MEMFS.stream_ops.llseek,
						read: MEMFS.stream_ops.read,
						write: MEMFS.stream_ops.write,
						mmap: MEMFS.stream_ops.mmap,
						msync: MEMFS.stream_ops.msync
					}
				},
				link: {
					node: {
						getattr: MEMFS.node_ops.getattr,
						setattr: MEMFS.node_ops.setattr,
						readlink: MEMFS.node_ops.readlink
					},
					stream: {}
				},
				chrdev: {
					node: {
						getattr: MEMFS.node_ops.getattr,
						setattr: MEMFS.node_ops.setattr
					},
					stream: FS.chrdev_stream_ops
				}
			};
			var node = FS.createNode(parent, name, mode, dev);
			if (FS.isDir(node.mode)) {
				node.node_ops = MEMFS.ops_table.dir.node;
				node.stream_ops = MEMFS.ops_table.dir.stream;
				node.contents = {};
			} else if (FS.isFile(node.mode)) {
				node.node_ops = MEMFS.ops_table.file.node;
				node.stream_ops = MEMFS.ops_table.file.stream;
				node.usedBytes = 0;
				node.contents = null;
			} else if (FS.isLink(node.mode)) {
				node.node_ops = MEMFS.ops_table.link.node;
				node.stream_ops = MEMFS.ops_table.link.stream;
			} else if (FS.isChrdev(node.mode)) {
				node.node_ops = MEMFS.ops_table.chrdev.node;
				node.stream_ops = MEMFS.ops_table.chrdev.stream;
			}
			node.atime = node.mtime = node.ctime = Date.now();
			if (parent) {
				parent.contents[name] = node;
				parent.atime = parent.mtime = parent.ctime = node.atime;
			}
			return node;
		},
		getFileDataAsTypedArray(node) {
			if (!node.contents) return /* @__PURE__ */ new Uint8Array(0);
			if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
			return new Uint8Array(node.contents);
		},
		expandFileStorage(node, newCapacity) {
			var prevCapacity = node.contents ? node.contents.length : 0;
			if (prevCapacity >= newCapacity) return;
			newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < 1048576 ? 2 : 1.125) >>> 0);
			if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
			var oldContents = node.contents;
			node.contents = new Uint8Array(newCapacity);
			if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
		},
		resizeFileStorage(node, newSize) {
			if (node.usedBytes == newSize) return;
			if (newSize == 0) {
				node.contents = null;
				node.usedBytes = 0;
			} else {
				var oldContents = node.contents;
				node.contents = new Uint8Array(newSize);
				if (oldContents) node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
				node.usedBytes = newSize;
			}
		},
		node_ops: {
			getattr(node) {
				var attr = {};
				attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
				attr.ino = node.id;
				attr.mode = node.mode;
				attr.nlink = 1;
				attr.uid = 0;
				attr.gid = 0;
				attr.rdev = node.rdev;
				if (FS.isDir(node.mode)) attr.size = 4096;
				else if (FS.isFile(node.mode)) attr.size = node.usedBytes;
				else if (FS.isLink(node.mode)) attr.size = node.link.length;
				else attr.size = 0;
				attr.atime = new Date(node.atime);
				attr.mtime = new Date(node.mtime);
				attr.ctime = new Date(node.ctime);
				attr.blksize = 4096;
				attr.blocks = Math.ceil(attr.size / attr.blksize);
				return attr;
			},
			setattr(node, attr) {
				for (const key of [
					"mode",
					"atime",
					"mtime",
					"ctime"
				]) if (attr[key] != null) node[key] = attr[key];
				if (attr.size !== void 0) MEMFS.resizeFileStorage(node, attr.size);
			},
			lookup(parent, name) {
				if (!MEMFS.doesNotExistError) {
					MEMFS.doesNotExistError = new FS.ErrnoError(44);
					MEMFS.doesNotExistError.stack = "<generic error, no stack>";
				}
				throw MEMFS.doesNotExistError;
			},
			mknod(parent, name, mode, dev) {
				return MEMFS.createNode(parent, name, mode, dev);
			},
			rename(old_node, new_dir, new_name) {
				var new_node;
				try {
					new_node = FS.lookupNode(new_dir, new_name);
				} catch (e) {}
				if (new_node) {
					if (FS.isDir(old_node.mode)) for (var i in new_node.contents) throw new FS.ErrnoError(55);
					FS.hashRemoveNode(new_node);
				}
				delete old_node.parent.contents[old_node.name];
				new_dir.contents[new_name] = old_node;
				old_node.name = new_name;
				new_dir.ctime = new_dir.mtime = old_node.parent.ctime = old_node.parent.mtime = Date.now();
			},
			unlink(parent, name) {
				delete parent.contents[name];
				parent.ctime = parent.mtime = Date.now();
			},
			rmdir(parent, name) {
				for (var i in FS.lookupNode(parent, name).contents) throw new FS.ErrnoError(55);
				delete parent.contents[name];
				parent.ctime = parent.mtime = Date.now();
			},
			readdir(node) {
				return [
					".",
					"..",
					...Object.keys(node.contents)
				];
			},
			symlink(parent, newname, oldpath) {
				var node = MEMFS.createNode(parent, newname, 41471, 0);
				node.link = oldpath;
				return node;
			},
			readlink(node) {
				if (!FS.isLink(node.mode)) throw new FS.ErrnoError(28);
				return node.link;
			}
		},
		stream_ops: {
			read(stream, buffer, offset, length, position) {
				var contents = stream.node.contents;
				if (position >= stream.node.usedBytes) return 0;
				var size = Math.min(stream.node.usedBytes - position, length);
				if (size > 8 && contents.subarray) buffer.set(contents.subarray(position, position + size), offset);
				else for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
				return size;
			},
			write(stream, buffer, offset, length, position, canOwn) {
				if (buffer.buffer === HEAP8.buffer) canOwn = false;
				if (!length) return 0;
				var node = stream.node;
				node.mtime = node.ctime = Date.now();
				if (buffer.subarray && (!node.contents || node.contents.subarray)) {
					if (canOwn) {
						node.contents = buffer.subarray(offset, offset + length);
						node.usedBytes = length;
						return length;
					} else if (node.usedBytes === 0 && position === 0) {
						node.contents = buffer.slice(offset, offset + length);
						node.usedBytes = length;
						return length;
					} else if (position + length <= node.usedBytes) {
						node.contents.set(buffer.subarray(offset, offset + length), position);
						return length;
					}
				}
				MEMFS.expandFileStorage(node, position + length);
				if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position);
				else for (var i = 0; i < length; i++) node.contents[position + i] = buffer[offset + i];
				node.usedBytes = Math.max(node.usedBytes, position + length);
				return length;
			},
			llseek(stream, offset, whence) {
				var position = offset;
				if (whence === 1) position += stream.position;
				else if (whence === 2) {
					if (FS.isFile(stream.node.mode)) position += stream.node.usedBytes;
				}
				if (position < 0) throw new FS.ErrnoError(28);
				return position;
			},
			mmap(stream, length, position, prot, flags) {
				if (!FS.isFile(stream.node.mode)) throw new FS.ErrnoError(43);
				var ptr;
				var allocated;
				var contents = stream.node.contents;
				if (!(flags & 2) && contents && contents.buffer === HEAP8.buffer) {
					allocated = false;
					ptr = contents.byteOffset;
				} else {
					allocated = true;
					ptr = mmapAlloc(length);
					if (!ptr) throw new FS.ErrnoError(48);
					if (contents) {
						if (position > 0 || position + length < contents.length) {
							if (contents.subarray) contents = contents.subarray(position, position + length);
							else contents = Array.prototype.slice.call(contents, position, position + length);
						}
						HEAP8.set(contents, ptr);
					}
				}
				return {
					ptr,
					allocated
				};
			},
			msync(stream, buffer, offset, length, mmapFlags) {
				MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
				return 0;
			}
		}
	};
	var FS_modeStringToFlags = (str) => {
		var flags = {
			r: 0,
			"r+": 2,
			w: 577,
			"w+": 578,
			a: 1089,
			"a+": 1090
		}[str];
		if (typeof flags == "undefined") throw new Error(`Unknown file open mode: ${str}`);
		return flags;
	};
	var FS_getMode = (canRead, canWrite) => {
		var mode = 0;
		if (canRead) mode |= 365;
		if (canWrite) mode |= 146;
		return mode;
	};
	var asyncLoad = async (url) => {
		var arrayBuffer = await readAsync(url);
		return new Uint8Array(arrayBuffer);
	};
	var FS_createDataFile = (...args) => FS.createDataFile(...args);
	var getUniqueRunDependency = (id) => id;
	var runDependencies = 0;
	var dependenciesFulfilled = null;
	var removeRunDependency = (id) => {
		runDependencies--;
		Module["monitorRunDependencies"]?.(runDependencies);
		if (runDependencies == 0) {
			if (dependenciesFulfilled) {
				var callback = dependenciesFulfilled;
				dependenciesFulfilled = null;
				callback();
			}
		}
	};
	var addRunDependency = (id) => {
		runDependencies++;
		Module["monitorRunDependencies"]?.(runDependencies);
	};
	var preloadPlugins = [];
	var FS_handledByPreloadPlugin = async (byteArray, fullname) => {
		if (typeof Browser != "undefined") Browser.init();
		for (var plugin of preloadPlugins) if (plugin["canHandle"](fullname)) return plugin["handle"](byteArray, fullname);
		return byteArray;
	};
	var FS_preloadFile = async (parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish) => {
		var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
		var dep = getUniqueRunDependency(`cp ${fullname}`);
		addRunDependency(dep);
		try {
			var byteArray = url;
			if (typeof url == "string") byteArray = await asyncLoad(url);
			byteArray = await FS_handledByPreloadPlugin(byteArray, fullname);
			preFinish?.();
			if (!dontCreateFile) FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
		} finally {
			removeRunDependency(dep);
		}
	};
	var FS_createPreloadedFile = (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
		FS_preloadFile(parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish).then(onload).catch(onerror);
	};
	var FS = {
		root: null,
		mounts: [],
		devices: {},
		streams: [],
		nextInode: 1,
		nameTable: null,
		currentPath: "/",
		initialized: false,
		ignorePermissions: true,
		filesystems: null,
		syncFSRequests: 0,
		readFiles: {},
		ErrnoError: class {
			name = "ErrnoError";
			constructor(errno) {
				this.errno = errno;
			}
		},
		FSStream: class {
			shared = {};
			get object() {
				return this.node;
			}
			set object(val) {
				this.node = val;
			}
			get isRead() {
				return (this.flags & 2097155) !== 1;
			}
			get isWrite() {
				return (this.flags & 2097155) !== 0;
			}
			get isAppend() {
				return this.flags & 1024;
			}
			get flags() {
				return this.shared.flags;
			}
			set flags(val) {
				this.shared.flags = val;
			}
			get position() {
				return this.shared.position;
			}
			set position(val) {
				this.shared.position = val;
			}
		},
		FSNode: class {
			node_ops = {};
			stream_ops = {};
			readMode = 365;
			writeMode = 146;
			mounted = null;
			constructor(parent, name, mode, rdev) {
				if (!parent) parent = this;
				this.parent = parent;
				this.mount = parent.mount;
				this.id = FS.nextInode++;
				this.name = name;
				this.mode = mode;
				this.rdev = rdev;
				this.atime = this.mtime = this.ctime = Date.now();
			}
			get read() {
				return (this.mode & this.readMode) === this.readMode;
			}
			set read(val) {
				val ? this.mode |= this.readMode : this.mode &= ~this.readMode;
			}
			get write() {
				return (this.mode & this.writeMode) === this.writeMode;
			}
			set write(val) {
				val ? this.mode |= this.writeMode : this.mode &= ~this.writeMode;
			}
			get isFolder() {
				return FS.isDir(this.mode);
			}
			get isDevice() {
				return FS.isChrdev(this.mode);
			}
		},
		lookupPath(path, opts = {}) {
			if (!path) throw new FS.ErrnoError(44);
			opts.follow_mount ??= true;
			if (!PATH.isAbs(path)) path = FS.cwd() + "/" + path;
			linkloop: for (var nlinks = 0; nlinks < 40; nlinks++) {
				var parts = path.split("/").filter((p) => !!p);
				var current = FS.root;
				var current_path = "/";
				for (var i = 0; i < parts.length; i++) {
					var islast = i === parts.length - 1;
					if (islast && opts.parent) break;
					if (parts[i] === ".") continue;
					if (parts[i] === "..") {
						current_path = PATH.dirname(current_path);
						if (FS.isRoot(current)) {
							path = current_path + "/" + parts.slice(i + 1).join("/");
							nlinks--;
							continue linkloop;
						} else current = current.parent;
						continue;
					}
					current_path = PATH.join2(current_path, parts[i]);
					try {
						current = FS.lookupNode(current, parts[i]);
					} catch (e) {
						if (e?.errno === 44 && islast && opts.noent_okay) return { path: current_path };
						throw e;
					}
					if (FS.isMountpoint(current) && (!islast || opts.follow_mount)) current = current.mounted.root;
					if (FS.isLink(current.mode) && (!islast || opts.follow)) {
						if (!current.node_ops.readlink) throw new FS.ErrnoError(52);
						var link = current.node_ops.readlink(current);
						if (!PATH.isAbs(link)) link = PATH.dirname(current_path) + "/" + link;
						path = link + "/" + parts.slice(i + 1).join("/");
						continue linkloop;
					}
				}
				return {
					path: current_path,
					node: current
				};
			}
			throw new FS.ErrnoError(32);
		},
		getPath(node) {
			var path;
			while (true) {
				if (FS.isRoot(node)) {
					var mount = node.mount.mountpoint;
					if (!path) return mount;
					return mount[mount.length - 1] !== "/" ? `${mount}/${path}` : mount + path;
				}
				path = path ? `${node.name}/${path}` : node.name;
				node = node.parent;
			}
		},
		hashName(parentid, name) {
			var hash = 0;
			for (var i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i) | 0;
			return (parentid + hash >>> 0) % FS.nameTable.length;
		},
		hashAddNode(node) {
			var hash = FS.hashName(node.parent.id, node.name);
			node.name_next = FS.nameTable[hash];
			FS.nameTable[hash] = node;
		},
		hashRemoveNode(node) {
			var hash = FS.hashName(node.parent.id, node.name);
			if (FS.nameTable[hash] === node) FS.nameTable[hash] = node.name_next;
			else {
				var current = FS.nameTable[hash];
				while (current) {
					if (current.name_next === node) {
						current.name_next = node.name_next;
						break;
					}
					current = current.name_next;
				}
			}
		},
		lookupNode(parent, name) {
			var errCode = FS.mayLookup(parent);
			if (errCode) throw new FS.ErrnoError(errCode);
			var hash = FS.hashName(parent.id, name);
			for (var node = FS.nameTable[hash]; node; node = node.name_next) {
				var nodeName = node.name;
				if (node.parent.id === parent.id && nodeName === name) return node;
			}
			return FS.lookup(parent, name);
		},
		createNode(parent, name, mode, rdev) {
			var node = new FS.FSNode(parent, name, mode, rdev);
			FS.hashAddNode(node);
			return node;
		},
		destroyNode(node) {
			FS.hashRemoveNode(node);
		},
		isRoot(node) {
			return node === node.parent;
		},
		isMountpoint(node) {
			return !!node.mounted;
		},
		isFile(mode) {
			return (mode & 61440) === 32768;
		},
		isDir(mode) {
			return (mode & 61440) === 16384;
		},
		isLink(mode) {
			return (mode & 61440) === 40960;
		},
		isChrdev(mode) {
			return (mode & 61440) === 8192;
		},
		isBlkdev(mode) {
			return (mode & 61440) === 24576;
		},
		isFIFO(mode) {
			return (mode & 61440) === 4096;
		},
		isSocket(mode) {
			return (mode & 49152) === 49152;
		},
		flagsToPermissionString(flag) {
			var perms = [
				"r",
				"w",
				"rw"
			][flag & 3];
			if (flag & 512) perms += "w";
			return perms;
		},
		nodePermissions(node, perms) {
			if (FS.ignorePermissions) return 0;
			if (perms.includes("r") && !(node.mode & 292)) return 2;
			else if (perms.includes("w") && !(node.mode & 146)) return 2;
			else if (perms.includes("x") && !(node.mode & 73)) return 2;
			return 0;
		},
		mayLookup(dir) {
			if (!FS.isDir(dir.mode)) return 54;
			var errCode = FS.nodePermissions(dir, "x");
			if (errCode) return errCode;
			if (!dir.node_ops.lookup) return 2;
			return 0;
		},
		mayCreate(dir, name) {
			if (!FS.isDir(dir.mode)) return 54;
			try {
				FS.lookupNode(dir, name);
				return 20;
			} catch (e) {}
			return FS.nodePermissions(dir, "wx");
		},
		mayDelete(dir, name, isdir) {
			var node;
			try {
				node = FS.lookupNode(dir, name);
			} catch (e) {
				return e.errno;
			}
			var errCode = FS.nodePermissions(dir, "wx");
			if (errCode) return errCode;
			if (isdir) {
				if (!FS.isDir(node.mode)) return 54;
				if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) return 10;
			} else if (FS.isDir(node.mode)) return 31;
			return 0;
		},
		mayOpen(node, flags) {
			if (!node) return 44;
			if (FS.isLink(node.mode)) return 32;
			else if (FS.isDir(node.mode)) {
				if (FS.flagsToPermissionString(flags) !== "r" || flags & 576) return 31;
			}
			return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
		},
		checkOpExists(op, err) {
			if (!op) throw new FS.ErrnoError(err);
			return op;
		},
		MAX_OPEN_FDS: 4096,
		nextfd() {
			for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) if (!FS.streams[fd]) return fd;
			throw new FS.ErrnoError(33);
		},
		getStreamChecked(fd) {
			var stream = FS.getStream(fd);
			if (!stream) throw new FS.ErrnoError(8);
			return stream;
		},
		getStream: (fd) => FS.streams[fd],
		createStream(stream, fd = -1) {
			stream = Object.assign(new FS.FSStream(), stream);
			if (fd == -1) fd = FS.nextfd();
			stream.fd = fd;
			FS.streams[fd] = stream;
			return stream;
		},
		closeStream(fd) {
			FS.streams[fd] = null;
		},
		dupStream(origStream, fd = -1) {
			var stream = FS.createStream(origStream, fd);
			stream.stream_ops?.dup?.(stream);
			return stream;
		},
		doSetAttr(stream, node, attr) {
			var setattr = stream?.stream_ops.setattr;
			var arg = setattr ? stream : node;
			setattr ??= node.node_ops.setattr;
			FS.checkOpExists(setattr, 63);
			setattr(arg, attr);
		},
		chrdev_stream_ops: {
			open(stream) {
				stream.stream_ops = FS.getDevice(stream.node.rdev).stream_ops;
				stream.stream_ops.open?.(stream);
			},
			llseek() {
				throw new FS.ErrnoError(70);
			}
		},
		major: (dev) => dev >> 8,
		minor: (dev) => dev & 255,
		makedev: (ma, mi) => ma << 8 | mi,
		registerDevice(dev, ops) {
			FS.devices[dev] = { stream_ops: ops };
		},
		getDevice: (dev) => FS.devices[dev],
		getMounts(mount) {
			var mounts = [];
			var check = [mount];
			while (check.length) {
				var m = check.pop();
				mounts.push(m);
				check.push(...m.mounts);
			}
			return mounts;
		},
		syncfs(populate, callback) {
			if (typeof populate == "function") {
				callback = populate;
				populate = false;
			}
			FS.syncFSRequests++;
			if (FS.syncFSRequests > 1) err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
			var mounts = FS.getMounts(FS.root.mount);
			var completed = 0;
			function doCallback(errCode) {
				FS.syncFSRequests--;
				return callback(errCode);
			}
			function done(errCode) {
				if (errCode) {
					if (!done.errored) {
						done.errored = true;
						return doCallback(errCode);
					}
					return;
				}
				if (++completed >= mounts.length) doCallback(null);
			}
			for (var mount of mounts) if (mount.type.syncfs) mount.type.syncfs(mount, populate, done);
			else done(null);
		},
		mount(type, opts, mountpoint) {
			var root = mountpoint === "/";
			var pseudo = !mountpoint;
			var node;
			if (root && FS.root) throw new FS.ErrnoError(10);
			else if (!root && !pseudo) {
				var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
				mountpoint = lookup.path;
				node = lookup.node;
				if (FS.isMountpoint(node)) throw new FS.ErrnoError(10);
				if (!FS.isDir(node.mode)) throw new FS.ErrnoError(54);
			}
			var mount = {
				type,
				opts,
				mountpoint,
				mounts: []
			};
			var mountRoot = type.mount(mount);
			mountRoot.mount = mount;
			mount.root = mountRoot;
			if (root) FS.root = mountRoot;
			else if (node) {
				node.mounted = mount;
				if (node.mount) node.mount.mounts.push(mount);
			}
			return mountRoot;
		},
		unmount(mountpoint) {
			var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
			if (!FS.isMountpoint(lookup.node)) throw new FS.ErrnoError(28);
			var node = lookup.node;
			var mount = node.mounted;
			var mounts = FS.getMounts(mount);
			for (var [hash, current] of Object.entries(FS.nameTable)) while (current) {
				var next = current.name_next;
				if (mounts.includes(current.mount)) FS.destroyNode(current);
				current = next;
			}
			node.mounted = null;
			var idx = node.mount.mounts.indexOf(mount);
			node.mount.mounts.splice(idx, 1);
		},
		lookup(parent, name) {
			return parent.node_ops.lookup(parent, name);
		},
		mknod(path, mode, dev) {
			var parent = FS.lookupPath(path, { parent: true }).node;
			var name = PATH.basename(path);
			if (!name) throw new FS.ErrnoError(28);
			if (name === "." || name === "..") throw new FS.ErrnoError(20);
			var errCode = FS.mayCreate(parent, name);
			if (errCode) throw new FS.ErrnoError(errCode);
			if (!parent.node_ops.mknod) throw new FS.ErrnoError(63);
			return parent.node_ops.mknod(parent, name, mode, dev);
		},
		statfs(path) {
			return FS.statfsNode(FS.lookupPath(path, { follow: true }).node);
		},
		statfsStream(stream) {
			return FS.statfsNode(stream.node);
		},
		statfsNode(node) {
			var rtn = {
				bsize: 4096,
				frsize: 4096,
				blocks: 1e6,
				bfree: 5e5,
				bavail: 5e5,
				files: FS.nextInode,
				ffree: FS.nextInode - 1,
				fsid: 42,
				flags: 2,
				namelen: 255
			};
			if (node.node_ops.statfs) Object.assign(rtn, node.node_ops.statfs(node.mount.opts.root));
			return rtn;
		},
		create(path, mode = 438) {
			mode &= 4095;
			mode |= 32768;
			return FS.mknod(path, mode, 0);
		},
		mkdir(path, mode = 511) {
			mode &= 1023;
			mode |= 16384;
			return FS.mknod(path, mode, 0);
		},
		mkdirTree(path, mode) {
			var dirs = path.split("/");
			var d = "";
			for (var dir of dirs) {
				if (!dir) continue;
				if (d || PATH.isAbs(path)) d += "/";
				d += dir;
				try {
					FS.mkdir(d, mode);
				} catch (e) {
					if (e.errno != 20) throw e;
				}
			}
		},
		mkdev(path, mode, dev) {
			if (typeof dev == "undefined") {
				dev = mode;
				mode = 438;
			}
			mode |= 8192;
			return FS.mknod(path, mode, dev);
		},
		symlink(oldpath, newpath) {
			if (!PATH_FS.resolve(oldpath)) throw new FS.ErrnoError(44);
			var parent = FS.lookupPath(newpath, { parent: true }).node;
			if (!parent) throw new FS.ErrnoError(44);
			var newname = PATH.basename(newpath);
			var errCode = FS.mayCreate(parent, newname);
			if (errCode) throw new FS.ErrnoError(errCode);
			if (!parent.node_ops.symlink) throw new FS.ErrnoError(63);
			return parent.node_ops.symlink(parent, newname, oldpath);
		},
		rename(old_path, new_path) {
			var old_dirname = PATH.dirname(old_path);
			var new_dirname = PATH.dirname(new_path);
			var old_name = PATH.basename(old_path);
			var new_name = PATH.basename(new_path);
			var lookup = FS.lookupPath(old_path, { parent: true }), old_dir = lookup.node, new_dir;
			lookup = FS.lookupPath(new_path, { parent: true });
			new_dir = lookup.node;
			if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
			if (old_dir.mount !== new_dir.mount) throw new FS.ErrnoError(75);
			var old_node = FS.lookupNode(old_dir, old_name);
			var relative = PATH_FS.relative(old_path, new_dirname);
			if (relative.charAt(0) !== ".") throw new FS.ErrnoError(28);
			relative = PATH_FS.relative(new_path, old_dirname);
			if (relative.charAt(0) !== ".") throw new FS.ErrnoError(55);
			var new_node;
			try {
				new_node = FS.lookupNode(new_dir, new_name);
			} catch (e) {}
			if (old_node === new_node) return;
			var isdir = FS.isDir(old_node.mode);
			var errCode = FS.mayDelete(old_dir, old_name, isdir);
			if (errCode) throw new FS.ErrnoError(errCode);
			errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
			if (errCode) throw new FS.ErrnoError(errCode);
			if (!old_dir.node_ops.rename) throw new FS.ErrnoError(63);
			if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) throw new FS.ErrnoError(10);
			if (new_dir !== old_dir) {
				errCode = FS.nodePermissions(old_dir, "w");
				if (errCode) throw new FS.ErrnoError(errCode);
			}
			FS.hashRemoveNode(old_node);
			try {
				old_dir.node_ops.rename(old_node, new_dir, new_name);
				old_node.parent = new_dir;
			} catch (e) {
				throw e;
			} finally {
				FS.hashAddNode(old_node);
			}
		},
		rmdir(path) {
			var parent = FS.lookupPath(path, { parent: true }).node;
			var name = PATH.basename(path);
			var node = FS.lookupNode(parent, name);
			var errCode = FS.mayDelete(parent, name, true);
			if (errCode) throw new FS.ErrnoError(errCode);
			if (!parent.node_ops.rmdir) throw new FS.ErrnoError(63);
			if (FS.isMountpoint(node)) throw new FS.ErrnoError(10);
			parent.node_ops.rmdir(parent, name);
			FS.destroyNode(node);
		},
		readdir(path) {
			var node = FS.lookupPath(path, { follow: true }).node;
			return FS.checkOpExists(node.node_ops.readdir, 54)(node);
		},
		unlink(path) {
			var parent = FS.lookupPath(path, { parent: true }).node;
			if (!parent) throw new FS.ErrnoError(44);
			var name = PATH.basename(path);
			var node = FS.lookupNode(parent, name);
			var errCode = FS.mayDelete(parent, name, false);
			if (errCode) throw new FS.ErrnoError(errCode);
			if (!parent.node_ops.unlink) throw new FS.ErrnoError(63);
			if (FS.isMountpoint(node)) throw new FS.ErrnoError(10);
			parent.node_ops.unlink(parent, name);
			FS.destroyNode(node);
		},
		readlink(path) {
			var link = FS.lookupPath(path).node;
			if (!link) throw new FS.ErrnoError(44);
			if (!link.node_ops.readlink) throw new FS.ErrnoError(28);
			return link.node_ops.readlink(link);
		},
		stat(path, dontFollow) {
			var node = FS.lookupPath(path, { follow: !dontFollow }).node;
			return FS.checkOpExists(node.node_ops.getattr, 63)(node);
		},
		fstat(fd) {
			var stream = FS.getStreamChecked(fd);
			var node = stream.node;
			var getattr = stream.stream_ops.getattr;
			var arg = getattr ? stream : node;
			getattr ??= node.node_ops.getattr;
			FS.checkOpExists(getattr, 63);
			return getattr(arg);
		},
		lstat(path) {
			return FS.stat(path, true);
		},
		doChmod(stream, node, mode, dontFollow) {
			FS.doSetAttr(stream, node, {
				mode: mode & 4095 | node.mode & -4096,
				ctime: Date.now(),
				dontFollow
			});
		},
		chmod(path, mode, dontFollow) {
			var node;
			if (typeof path == "string") node = FS.lookupPath(path, { follow: !dontFollow }).node;
			else node = path;
			FS.doChmod(null, node, mode, dontFollow);
		},
		lchmod(path, mode) {
			FS.chmod(path, mode, true);
		},
		fchmod(fd, mode) {
			var stream = FS.getStreamChecked(fd);
			FS.doChmod(stream, stream.node, mode, false);
		},
		doChown(stream, node, dontFollow) {
			FS.doSetAttr(stream, node, {
				timestamp: Date.now(),
				dontFollow
			});
		},
		chown(path, uid, gid, dontFollow) {
			var node;
			if (typeof path == "string") node = FS.lookupPath(path, { follow: !dontFollow }).node;
			else node = path;
			FS.doChown(null, node, dontFollow);
		},
		lchown(path, uid, gid) {
			FS.chown(path, uid, gid, true);
		},
		fchown(fd, uid, gid) {
			var stream = FS.getStreamChecked(fd);
			FS.doChown(stream, stream.node, false);
		},
		doTruncate(stream, node, len) {
			if (FS.isDir(node.mode)) throw new FS.ErrnoError(31);
			if (!FS.isFile(node.mode)) throw new FS.ErrnoError(28);
			var errCode = FS.nodePermissions(node, "w");
			if (errCode) throw new FS.ErrnoError(errCode);
			FS.doSetAttr(stream, node, {
				size: len,
				timestamp: Date.now()
			});
		},
		truncate(path, len) {
			if (len < 0) throw new FS.ErrnoError(28);
			var node;
			if (typeof path == "string") node = FS.lookupPath(path, { follow: true }).node;
			else node = path;
			FS.doTruncate(null, node, len);
		},
		ftruncate(fd, len) {
			var stream = FS.getStreamChecked(fd);
			if (len < 0 || (stream.flags & 2097155) === 0) throw new FS.ErrnoError(28);
			FS.doTruncate(stream, stream.node, len);
		},
		utime(path, atime, mtime) {
			var node = FS.lookupPath(path, { follow: true }).node;
			FS.checkOpExists(node.node_ops.setattr, 63)(node, {
				atime,
				mtime
			});
		},
		open(path, flags, mode = 438) {
			if (path === "") throw new FS.ErrnoError(44);
			flags = typeof flags == "string" ? FS_modeStringToFlags(flags) : flags;
			if (flags & 64) mode = mode & 4095 | 32768;
			else mode = 0;
			var node;
			var isDirPath;
			if (typeof path == "object") node = path;
			else {
				isDirPath = path.endsWith("/");
				var lookup = FS.lookupPath(path, {
					follow: !(flags & 131072),
					noent_okay: true
				});
				node = lookup.node;
				path = lookup.path;
			}
			var created = false;
			if (flags & 64) {
				if (node) {
					if (flags & 128) throw new FS.ErrnoError(20);
				} else if (isDirPath) throw new FS.ErrnoError(31);
				else {
					node = FS.mknod(path, mode | 511, 0);
					created = true;
				}
			}
			if (!node) throw new FS.ErrnoError(44);
			if (FS.isChrdev(node.mode)) flags &= -513;
			if (flags & 65536 && !FS.isDir(node.mode)) throw new FS.ErrnoError(54);
			if (!created) {
				var errCode = FS.mayOpen(node, flags);
				if (errCode) throw new FS.ErrnoError(errCode);
			}
			if (flags & 512 && !created) FS.truncate(node, 0);
			flags &= -131713;
			var stream = FS.createStream({
				node,
				path: FS.getPath(node),
				flags,
				seekable: true,
				position: 0,
				stream_ops: node.stream_ops,
				ungotten: [],
				error: false
			});
			if (stream.stream_ops.open) stream.stream_ops.open(stream);
			if (created) FS.chmod(node, mode & 511);
			if (Module["logReadFiles"] && !(flags & 1)) {
				if (!(path in FS.readFiles)) FS.readFiles[path] = 1;
			}
			return stream;
		},
		close(stream) {
			if (FS.isClosed(stream)) throw new FS.ErrnoError(8);
			if (stream.getdents) stream.getdents = null;
			try {
				if (stream.stream_ops.close) stream.stream_ops.close(stream);
			} catch (e) {
				throw e;
			} finally {
				FS.closeStream(stream.fd);
			}
			stream.fd = null;
		},
		isClosed(stream) {
			return stream.fd === null;
		},
		llseek(stream, offset, whence) {
			if (FS.isClosed(stream)) throw new FS.ErrnoError(8);
			if (!stream.seekable || !stream.stream_ops.llseek) throw new FS.ErrnoError(70);
			if (whence != 0 && whence != 1 && whence != 2) throw new FS.ErrnoError(28);
			stream.position = stream.stream_ops.llseek(stream, offset, whence);
			stream.ungotten = [];
			return stream.position;
		},
		read(stream, buffer, offset, length, position) {
			if (length < 0 || position < 0) throw new FS.ErrnoError(28);
			if (FS.isClosed(stream)) throw new FS.ErrnoError(8);
			if ((stream.flags & 2097155) === 1) throw new FS.ErrnoError(8);
			if (FS.isDir(stream.node.mode)) throw new FS.ErrnoError(31);
			if (!stream.stream_ops.read) throw new FS.ErrnoError(28);
			var seeking = typeof position != "undefined";
			if (!seeking) position = stream.position;
			else if (!stream.seekable) throw new FS.ErrnoError(70);
			var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
			if (!seeking) stream.position += bytesRead;
			return bytesRead;
		},
		write(stream, buffer, offset, length, position, canOwn) {
			if (length < 0 || position < 0) throw new FS.ErrnoError(28);
			if (FS.isClosed(stream)) throw new FS.ErrnoError(8);
			if ((stream.flags & 2097155) === 0) throw new FS.ErrnoError(8);
			if (FS.isDir(stream.node.mode)) throw new FS.ErrnoError(31);
			if (!stream.stream_ops.write) throw new FS.ErrnoError(28);
			if (stream.seekable && stream.flags & 1024) FS.llseek(stream, 0, 2);
			var seeking = typeof position != "undefined";
			if (!seeking) position = stream.position;
			else if (!stream.seekable) throw new FS.ErrnoError(70);
			var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
			if (!seeking) stream.position += bytesWritten;
			return bytesWritten;
		},
		mmap(stream, length, position, prot, flags) {
			if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) throw new FS.ErrnoError(2);
			if ((stream.flags & 2097155) === 1) throw new FS.ErrnoError(2);
			if (!stream.stream_ops.mmap) throw new FS.ErrnoError(43);
			if (!length) throw new FS.ErrnoError(28);
			return stream.stream_ops.mmap(stream, length, position, prot, flags);
		},
		msync(stream, buffer, offset, length, mmapFlags) {
			if (!stream.stream_ops.msync) return 0;
			return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
		},
		ioctl(stream, cmd, arg) {
			if (!stream.stream_ops.ioctl) throw new FS.ErrnoError(59);
			return stream.stream_ops.ioctl(stream, cmd, arg);
		},
		readFile(path, opts = {}) {
			opts.flags = opts.flags || 0;
			opts.encoding = opts.encoding || "binary";
			if (opts.encoding !== "utf8" && opts.encoding !== "binary") abort(`Invalid encoding type "${opts.encoding}"`);
			var stream = FS.open(path, opts.flags);
			var length = FS.stat(path).size;
			var buf = new Uint8Array(length);
			FS.read(stream, buf, 0, length, 0);
			if (opts.encoding === "utf8") buf = UTF8ArrayToString(buf);
			FS.close(stream);
			return buf;
		},
		writeFile(path, data, opts = {}) {
			opts.flags = opts.flags || 577;
			var stream = FS.open(path, opts.flags, opts.mode);
			if (typeof data == "string") data = new Uint8Array(intArrayFromString(data, true));
			if (ArrayBuffer.isView(data)) FS.write(stream, data, 0, data.byteLength, void 0, opts.canOwn);
			else abort("Unsupported data type");
			FS.close(stream);
		},
		cwd: () => FS.currentPath,
		chdir(path) {
			var lookup = FS.lookupPath(path, { follow: true });
			if (lookup.node === null) throw new FS.ErrnoError(44);
			if (!FS.isDir(lookup.node.mode)) throw new FS.ErrnoError(54);
			var errCode = FS.nodePermissions(lookup.node, "x");
			if (errCode) throw new FS.ErrnoError(errCode);
			FS.currentPath = lookup.path;
		},
		createDefaultDirectories() {
			FS.mkdir("/tmp");
			FS.mkdir("/home");
			FS.mkdir("/home/web_user");
		},
		createDefaultDevices() {
			FS.mkdir("/dev");
			FS.registerDevice(FS.makedev(1, 3), {
				read: () => 0,
				write: (stream, buffer, offset, length, pos) => length,
				llseek: () => 0
			});
			FS.mkdev("/dev/null", FS.makedev(1, 3));
			TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
			TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
			FS.mkdev("/dev/tty", FS.makedev(5, 0));
			FS.mkdev("/dev/tty1", FS.makedev(6, 0));
			var randomBuffer = /* @__PURE__ */ new Uint8Array(1024), randomLeft = 0;
			var randomByte = () => {
				if (randomLeft === 0) {
					randomFill(randomBuffer);
					randomLeft = randomBuffer.byteLength;
				}
				return randomBuffer[--randomLeft];
			};
			FS.createDevice("/dev", "random", randomByte);
			FS.createDevice("/dev", "urandom", randomByte);
			FS.mkdir("/dev/shm");
			FS.mkdir("/dev/shm/tmp");
		},
		createSpecialDirectories() {
			FS.mkdir("/proc");
			var proc_self = FS.mkdir("/proc/self");
			FS.mkdir("/proc/self/fd");
			FS.mount({ mount() {
				var node = FS.createNode(proc_self, "fd", 16895, 73);
				node.stream_ops = { llseek: MEMFS.stream_ops.llseek };
				node.node_ops = {
					lookup(parent, name) {
						var fd = +name;
						var stream = FS.getStreamChecked(fd);
						var ret = {
							parent: null,
							mount: { mountpoint: "fake" },
							node_ops: { readlink: () => stream.path },
							id: fd + 1
						};
						ret.parent = ret;
						return ret;
					},
					readdir() {
						return Array.from(FS.streams.entries()).filter(([k, v]) => v).map(([k, v]) => k.toString());
					}
				};
				return node;
			} }, {}, "/proc/self/fd");
		},
		createStandardStreams(input, output, error) {
			if (input) FS.createDevice("/dev", "stdin", input);
			else FS.symlink("/dev/tty", "/dev/stdin");
			if (output) FS.createDevice("/dev", "stdout", null, output);
			else FS.symlink("/dev/tty", "/dev/stdout");
			if (error) FS.createDevice("/dev", "stderr", null, error);
			else FS.symlink("/dev/tty1", "/dev/stderr");
			FS.open("/dev/stdin", 0);
			FS.open("/dev/stdout", 1);
			FS.open("/dev/stderr", 1);
		},
		staticInit() {
			FS.nameTable = new Array(4096);
			FS.mount(MEMFS, {}, "/");
			FS.createDefaultDirectories();
			FS.createDefaultDevices();
			FS.createSpecialDirectories();
			FS.filesystems = { MEMFS };
		},
		init(input, output, error) {
			FS.initialized = true;
			input ??= Module["stdin"];
			output ??= Module["stdout"];
			error ??= Module["stderr"];
			FS.createStandardStreams(input, output, error);
		},
		quit() {
			FS.initialized = false;
			for (var stream of FS.streams) if (stream) FS.close(stream);
		},
		findObject(path, dontResolveLastLink) {
			var ret = FS.analyzePath(path, dontResolveLastLink);
			if (!ret.exists) return null;
			return ret.object;
		},
		analyzePath(path, dontResolveLastLink) {
			try {
				var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
				path = lookup.path;
			} catch (e) {}
			var ret = {
				isRoot: false,
				exists: false,
				error: 0,
				name: null,
				path: null,
				object: null,
				parentExists: false,
				parentPath: null,
				parentObject: null
			};
			try {
				var lookup = FS.lookupPath(path, { parent: true });
				ret.parentExists = true;
				ret.parentPath = lookup.path;
				ret.parentObject = lookup.node;
				ret.name = PATH.basename(path);
				lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
				ret.exists = true;
				ret.path = lookup.path;
				ret.object = lookup.node;
				ret.name = lookup.node.name;
				ret.isRoot = lookup.path === "/";
			} catch (e) {
				ret.error = e.errno;
			}
			return ret;
		},
		createPath(parent, path, canRead, canWrite) {
			parent = typeof parent == "string" ? parent : FS.getPath(parent);
			var parts = path.split("/").reverse();
			while (parts.length) {
				var part = parts.pop();
				if (!part) continue;
				var current = PATH.join2(parent, part);
				try {
					FS.mkdir(current);
				} catch (e) {
					if (e.errno != 20) throw e;
				}
				parent = current;
			}
			return current;
		},
		createFile(parent, name, properties, canRead, canWrite) {
			var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
			var mode = FS_getMode(canRead, canWrite);
			return FS.create(path, mode);
		},
		createDataFile(parent, name, data, canRead, canWrite, canOwn) {
			var path = name;
			if (parent) {
				parent = typeof parent == "string" ? parent : FS.getPath(parent);
				path = name ? PATH.join2(parent, name) : parent;
			}
			var mode = FS_getMode(canRead, canWrite);
			var node = FS.create(path, mode);
			if (data) {
				if (typeof data == "string") {
					var arr = new Array(data.length);
					for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
					data = arr;
				}
				FS.chmod(node, mode | 146);
				var stream = FS.open(node, 577);
				FS.write(stream, data, 0, data.length, 0, canOwn);
				FS.close(stream);
				FS.chmod(node, mode);
			}
		},
		createDevice(parent, name, input, output) {
			var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
			var mode = FS_getMode(!!input, !!output);
			FS.createDevice.major ??= 64;
			var dev = FS.makedev(FS.createDevice.major++, 0);
			FS.registerDevice(dev, {
				open(stream) {
					stream.seekable = false;
				},
				close(stream) {
					if (output?.buffer?.length) output(10);
				},
				read(stream, buffer, offset, length, pos) {
					var bytesRead = 0;
					for (var i = 0; i < length; i++) {
						var result;
						try {
							result = input();
						} catch (e) {
							throw new FS.ErrnoError(29);
						}
						if (result === void 0 && bytesRead === 0) throw new FS.ErrnoError(6);
						if (result === null || result === void 0) break;
						bytesRead++;
						buffer[offset + i] = result;
					}
					if (bytesRead) stream.node.atime = Date.now();
					return bytesRead;
				},
				write(stream, buffer, offset, length, pos) {
					for (var i = 0; i < length; i++) try {
						output(buffer[offset + i]);
					} catch (e) {
						throw new FS.ErrnoError(29);
					}
					if (length) stream.node.mtime = stream.node.ctime = Date.now();
					return i;
				}
			});
			return FS.mkdev(path, mode, dev);
		},
		forceLoadFile(obj) {
			if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
			if (globalThis.XMLHttpRequest) abort("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
			else try {
				obj.contents = readBinary(obj.url);
			} catch (e) {
				throw new FS.ErrnoError(29);
			}
		},
		createLazyFile(parent, name, url, canRead, canWrite) {
			class LazyUint8Array {
				lengthKnown = false;
				chunks = [];
				get(idx) {
					if (idx > this.length - 1 || idx < 0) return;
					var chunkOffset = idx % this.chunkSize;
					var chunkNum = idx / this.chunkSize | 0;
					return this.getter(chunkNum)[chunkOffset];
				}
				setDataGetter(getter) {
					this.getter = getter;
				}
				cacheLength() {
					var xhr = new XMLHttpRequest();
					xhr.open("HEAD", url, false);
					xhr.send(null);
					if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) abort("Couldn't load " + url + ". Status: " + xhr.status);
					var datalength = Number(xhr.getResponseHeader("Content-length"));
					var header;
					var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
					var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
					var chunkSize = 1048576;
					if (!hasByteServing) chunkSize = datalength;
					var doXHR = (from, to) => {
						if (from > to) abort("invalid range (" + from + ", " + to + ") or no bytes requested!");
						if (to > datalength - 1) abort("only " + datalength + " bytes available! programmer error!");
						var xhr = new XMLHttpRequest();
						xhr.open("GET", url, false);
						if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
						xhr.responseType = "arraybuffer";
						if (xhr.overrideMimeType) xhr.overrideMimeType("text/plain; charset=x-user-defined");
						xhr.send(null);
						if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) abort("Couldn't load " + url + ". Status: " + xhr.status);
						if (xhr.response !== void 0) return new Uint8Array(xhr.response || []);
						return intArrayFromString(xhr.responseText || "", true);
					};
					var lazyArray = this;
					lazyArray.setDataGetter((chunkNum) => {
						var start = chunkNum * chunkSize;
						var end = (chunkNum + 1) * chunkSize - 1;
						end = Math.min(end, datalength - 1);
						if (typeof lazyArray.chunks[chunkNum] == "undefined") lazyArray.chunks[chunkNum] = doXHR(start, end);
						if (typeof lazyArray.chunks[chunkNum] == "undefined") abort("doXHR failed!");
						return lazyArray.chunks[chunkNum];
					});
					if (usesGzip || !datalength) {
						chunkSize = datalength = 1;
						datalength = this.getter(0).length;
						chunkSize = datalength;
						out("LazyFiles on gzip forces download of the whole file when length is accessed");
					}
					this._length = datalength;
					this._chunkSize = chunkSize;
					this.lengthKnown = true;
				}
				get length() {
					if (!this.lengthKnown) this.cacheLength();
					return this._length;
				}
				get chunkSize() {
					if (!this.lengthKnown) this.cacheLength();
					return this._chunkSize;
				}
			}
			if (globalThis.XMLHttpRequest) {
				if (!ENVIRONMENT_IS_WORKER) abort("Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc");
				var properties = {
					isDevice: false,
					contents: new LazyUint8Array()
				};
			} else var properties = {
				isDevice: false,
				url
			};
			var node = FS.createFile(parent, name, properties, canRead, canWrite);
			if (properties.contents) node.contents = properties.contents;
			else if (properties.url) {
				node.contents = null;
				node.url = properties.url;
			}
			Object.defineProperties(node, { usedBytes: { get: function() {
				return this.contents.length;
			} } });
			var stream_ops = {};
			for (const [key, fn] of Object.entries(node.stream_ops)) stream_ops[key] = (...args) => {
				FS.forceLoadFile(node);
				return fn(...args);
			};
			function writeChunks(stream, buffer, offset, length, position) {
				var contents = stream.node.contents;
				if (position >= contents.length) return 0;
				var size = Math.min(contents.length - position, length);
				if (contents.slice) for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
				else for (var i = 0; i < size; i++) buffer[offset + i] = contents.get(position + i);
				return size;
			}
			stream_ops.read = (stream, buffer, offset, length, position) => {
				FS.forceLoadFile(node);
				return writeChunks(stream, buffer, offset, length, position);
			};
			stream_ops.mmap = (stream, length, position, prot, flags) => {
				FS.forceLoadFile(node);
				var ptr = mmapAlloc(length);
				if (!ptr) throw new FS.ErrnoError(48);
				writeChunks(stream, HEAP8, ptr, length, position);
				return {
					ptr,
					allocated: true
				};
			};
			node.stream_ops = stream_ops;
			return node;
		}
	};
	var SYSCALLS = {
		calculateAt(dirfd, path, allowEmpty) {
			if (PATH.isAbs(path)) return path;
			var dir;
			if (dirfd === -100) dir = FS.cwd();
			else dir = SYSCALLS.getStreamFromFD(dirfd).path;
			if (path.length == 0) {
				if (!allowEmpty) throw new FS.ErrnoError(44);
				return dir;
			}
			return dir + "/" + path;
		},
		writeStat(buf, stat) {
			HEAPU32[buf >> 2] = stat.dev;
			HEAPU32[buf + 4 >> 2] = stat.mode;
			HEAPU32[buf + 8 >> 2] = stat.nlink;
			HEAPU32[buf + 12 >> 2] = stat.uid;
			HEAPU32[buf + 16 >> 2] = stat.gid;
			HEAPU32[buf + 20 >> 2] = stat.rdev;
			tempI64 = [stat.size >>> 0, (tempDouble = stat.size, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 24 >> 2] = tempI64[0], HEAP32[buf + 28 >> 2] = tempI64[1];
			HEAP32[buf + 32 >> 2] = 4096;
			HEAP32[buf + 36 >> 2] = stat.blocks;
			var atime = stat.atime.getTime();
			var mtime = stat.mtime.getTime();
			var ctime = stat.ctime.getTime();
			tempI64 = [Math.floor(atime / 1e3) >>> 0, (tempDouble = Math.floor(atime / 1e3), +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 40 >> 2] = tempI64[0], HEAP32[buf + 44 >> 2] = tempI64[1];
			HEAPU32[buf + 48 >> 2] = atime % 1e3 * 1e3 * 1e3;
			tempI64 = [Math.floor(mtime / 1e3) >>> 0, (tempDouble = Math.floor(mtime / 1e3), +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 56 >> 2] = tempI64[0], HEAP32[buf + 60 >> 2] = tempI64[1];
			HEAPU32[buf + 64 >> 2] = mtime % 1e3 * 1e3 * 1e3;
			tempI64 = [Math.floor(ctime / 1e3) >>> 0, (tempDouble = Math.floor(ctime / 1e3), +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 72 >> 2] = tempI64[0], HEAP32[buf + 76 >> 2] = tempI64[1];
			HEAPU32[buf + 80 >> 2] = ctime % 1e3 * 1e3 * 1e3;
			tempI64 = [stat.ino >>> 0, (tempDouble = stat.ino, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 88 >> 2] = tempI64[0], HEAP32[buf + 92 >> 2] = tempI64[1];
			return 0;
		},
		writeStatFs(buf, stats) {
			HEAPU32[buf + 4 >> 2] = stats.bsize;
			HEAPU32[buf + 60 >> 2] = stats.bsize;
			tempI64 = [stats.blocks >>> 0, (tempDouble = stats.blocks, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 8 >> 2] = tempI64[0], HEAP32[buf + 12 >> 2] = tempI64[1];
			tempI64 = [stats.bfree >>> 0, (tempDouble = stats.bfree, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 16 >> 2] = tempI64[0], HEAP32[buf + 20 >> 2] = tempI64[1];
			tempI64 = [stats.bavail >>> 0, (tempDouble = stats.bavail, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 24 >> 2] = tempI64[0], HEAP32[buf + 28 >> 2] = tempI64[1];
			tempI64 = [stats.files >>> 0, (tempDouble = stats.files, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 32 >> 2] = tempI64[0], HEAP32[buf + 36 >> 2] = tempI64[1];
			tempI64 = [stats.ffree >>> 0, (tempDouble = stats.ffree, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 40 >> 2] = tempI64[0], HEAP32[buf + 44 >> 2] = tempI64[1];
			HEAPU32[buf + 48 >> 2] = stats.fsid;
			HEAPU32[buf + 64 >> 2] = stats.flags;
			HEAPU32[buf + 56 >> 2] = stats.namelen;
		},
		doMsync(addr, stream, len, flags, offset) {
			if (!FS.isFile(stream.node.mode)) throw new FS.ErrnoError(43);
			if (flags & 2) return 0;
			var buffer = HEAPU8.slice(addr, addr + len);
			FS.msync(stream, buffer, offset, len, flags);
		},
		getStreamFromFD(fd) {
			return FS.getStreamChecked(fd);
		},
		varargs: void 0,
		getStr(ptr) {
			return UTF8ToString(ptr);
		}
	};
	function ___syscall_chmod(path, mode) {
		try {
			path = SYSCALLS.getStr(path);
			FS.chmod(path, mode);
			return 0;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	function ___syscall_faccessat(dirfd, path, amode, flags) {
		try {
			path = SYSCALLS.getStr(path);
			path = SYSCALLS.calculateAt(dirfd, path);
			if (amode & -8) return -28;
			var node = FS.lookupPath(path, { follow: true }).node;
			if (!node) return -44;
			var perms = "";
			if (amode & 4) perms += "r";
			if (amode & 2) perms += "w";
			if (amode & 1) perms += "x";
			if (perms && FS.nodePermissions(node, perms)) return -2;
			return 0;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	function ___syscall_fchmod(fd, mode) {
		try {
			FS.fchmod(fd, mode);
			return 0;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	function ___syscall_fchown32(fd, owner, group) {
		try {
			FS.fchown(fd, owner, group);
			return 0;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	var syscallGetVarargI = () => {
		var ret = HEAP32[+SYSCALLS.varargs >> 2];
		SYSCALLS.varargs += 4;
		return ret;
	};
	var syscallGetVarargP = syscallGetVarargI;
	function ___syscall_fcntl64(fd, cmd, varargs) {
		SYSCALLS.varargs = varargs;
		try {
			var stream = SYSCALLS.getStreamFromFD(fd);
			switch (cmd) {
				case 0:
					var arg = syscallGetVarargI();
					if (arg < 0) return -28;
					while (FS.streams[arg]) arg++;
					return FS.dupStream(stream, arg).fd;
				case 1:
				case 2: return 0;
				case 3: return stream.flags;
				case 4:
					var arg = syscallGetVarargI();
					stream.flags |= arg;
					return 0;
				case 12:
					var arg = syscallGetVarargP();
					var offset = 0;
					HEAP16[arg + offset >> 1] = 2;
					return 0;
				case 13:
				case 14: return 0;
			}
			return -28;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	function ___syscall_fstat64(fd, buf) {
		try {
			return SYSCALLS.writeStat(buf, FS.fstat(fd));
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	var convertI32PairToI53Checked = (lo, hi) => hi + 2097152 >>> 0 < 4194305 - !!lo ? (lo >>> 0) + hi * 4294967296 : NaN;
	function ___syscall_ftruncate64(fd, length_low, length_high) {
		var length = convertI32PairToI53Checked(length_low, length_high);
		try {
			if (isNaN(length)) return -61;
			FS.ftruncate(fd, length);
			return 0;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	var stringToUTF8 = (str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
	function ___syscall_getcwd(buf, size) {
		try {
			if (size === 0) return -28;
			var cwd = FS.cwd();
			var cwdLengthInBytes = lengthBytesUTF8(cwd) + 1;
			if (size < cwdLengthInBytes) return -68;
			stringToUTF8(cwd, buf, size);
			return cwdLengthInBytes;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	function ___syscall_lstat64(path, buf) {
		try {
			path = SYSCALLS.getStr(path);
			return SYSCALLS.writeStat(buf, FS.lstat(path));
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	function ___syscall_mkdirat(dirfd, path, mode) {
		try {
			path = SYSCALLS.getStr(path);
			path = SYSCALLS.calculateAt(dirfd, path);
			FS.mkdir(path, mode, 0);
			return 0;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	function ___syscall_newfstatat(dirfd, path, buf, flags) {
		try {
			path = SYSCALLS.getStr(path);
			var nofollow = flags & 256;
			var allowEmpty = flags & 4096;
			flags = flags & -6401;
			path = SYSCALLS.calculateAt(dirfd, path, allowEmpty);
			return SYSCALLS.writeStat(buf, nofollow ? FS.lstat(path) : FS.stat(path));
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	function ___syscall_openat(dirfd, path, flags, varargs) {
		SYSCALLS.varargs = varargs;
		try {
			path = SYSCALLS.getStr(path);
			path = SYSCALLS.calculateAt(dirfd, path);
			var mode = varargs ? syscallGetVarargI() : 0;
			return FS.open(path, flags, mode).fd;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	function ___syscall_readlinkat(dirfd, path, buf, bufsize) {
		try {
			path = SYSCALLS.getStr(path);
			path = SYSCALLS.calculateAt(dirfd, path);
			if (bufsize <= 0) return -28;
			var ret = FS.readlink(path);
			var len = Math.min(bufsize, lengthBytesUTF8(ret));
			var endChar = HEAP8[buf + len];
			stringToUTF8(ret, buf, bufsize + 1);
			HEAP8[buf + len] = endChar;
			return len;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	function ___syscall_rmdir(path) {
		try {
			path = SYSCALLS.getStr(path);
			FS.rmdir(path);
			return 0;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	function ___syscall_stat64(path, buf) {
		try {
			path = SYSCALLS.getStr(path);
			return SYSCALLS.writeStat(buf, FS.stat(path));
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	function ___syscall_unlinkat(dirfd, path, flags) {
		try {
			path = SYSCALLS.getStr(path);
			path = SYSCALLS.calculateAt(dirfd, path);
			if (!flags) FS.unlink(path);
			else if (flags === 512) FS.rmdir(path);
			else return -28;
			return 0;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	var readI53FromI64 = (ptr) => HEAPU32[ptr >> 2] + HEAP32[ptr + 4 >> 2] * 4294967296;
	function ___syscall_utimensat(dirfd, path, times, flags) {
		try {
			path = SYSCALLS.getStr(path);
			path = SYSCALLS.calculateAt(dirfd, path, true);
			var now = Date.now(), atime, mtime;
			if (!times) {
				atime = now;
				mtime = now;
			} else {
				var seconds = readI53FromI64(times);
				var nanoseconds = HEAP32[times + 8 >> 2];
				if (nanoseconds == 1073741823) atime = now;
				else if (nanoseconds == 1073741822) atime = null;
				else atime = seconds * 1e3 + nanoseconds / 1e6;
				times += 16;
				seconds = readI53FromI64(times);
				nanoseconds = HEAP32[times + 8 >> 2];
				if (nanoseconds == 1073741823) mtime = now;
				else if (nanoseconds == 1073741822) mtime = null;
				else mtime = seconds * 1e3 + nanoseconds / 1e6;
			}
			if ((mtime ?? atime) !== null) FS.utime(path, atime, mtime);
			return 0;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	var __abort_js = () => abort("");
	var runtimeKeepaliveCounter = 0;
	var __emscripten_runtime_keepalive_clear = () => {
		noExitRuntime = false;
		runtimeKeepaliveCounter = 0;
	};
	var isLeapYear = (year) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
	var MONTH_DAYS_LEAP_CUMULATIVE = [
		0,
		31,
		60,
		91,
		121,
		152,
		182,
		213,
		244,
		274,
		305,
		335
	];
	var MONTH_DAYS_REGULAR_CUMULATIVE = [
		0,
		31,
		59,
		90,
		120,
		151,
		181,
		212,
		243,
		273,
		304,
		334
	];
	var ydayFromDate = (date) => {
		return (isLeapYear(date.getFullYear()) ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE)[date.getMonth()] + date.getDate() - 1;
	};
	function __localtime_js(time_low, time_high, tmPtr) {
		var time = convertI32PairToI53Checked(time_low, time_high);
		var date = /* @__PURE__ */ new Date(time * 1e3);
		HEAP32[tmPtr >> 2] = date.getSeconds();
		HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
		HEAP32[tmPtr + 8 >> 2] = date.getHours();
		HEAP32[tmPtr + 12 >> 2] = date.getDate();
		HEAP32[tmPtr + 16 >> 2] = date.getMonth();
		HEAP32[tmPtr + 20 >> 2] = date.getFullYear() - 1900;
		HEAP32[tmPtr + 24 >> 2] = date.getDay();
		var yday = ydayFromDate(date) | 0;
		HEAP32[tmPtr + 28 >> 2] = yday;
		HEAP32[tmPtr + 36 >> 2] = -(date.getTimezoneOffset() * 60);
		var start = new Date(date.getFullYear(), 0, 1);
		var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
		var winterOffset = start.getTimezoneOffset();
		var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
		HEAP32[tmPtr + 32 >> 2] = dst;
	}
	function __mmap_js(len, prot, flags, fd, offset_low, offset_high, allocated, addr) {
		var offset = convertI32PairToI53Checked(offset_low, offset_high);
		try {
			var stream = SYSCALLS.getStreamFromFD(fd);
			var res = FS.mmap(stream, len, offset, prot, flags);
			var ptr = res.ptr;
			HEAP32[allocated >> 2] = res.allocated;
			HEAPU32[addr >> 2] = ptr;
			return 0;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	function __munmap_js(addr, len, prot, flags, fd, offset_low, offset_high) {
		var offset = convertI32PairToI53Checked(offset_low, offset_high);
		try {
			var stream = SYSCALLS.getStreamFromFD(fd);
			if (prot & 2) SYSCALLS.doMsync(addr, stream, len, flags, offset);
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	var timers = {};
	var handleException = (e) => {
		if (e instanceof ExitStatus || e == "unwind") return EXITSTATUS;
		quit_(1, e);
	};
	var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
	var _proc_exit = (code) => {
		EXITSTATUS = code;
		if (!keepRuntimeAlive()) {
			Module["onExit"]?.(code);
			ABORT = true;
		}
		quit_(code, new ExitStatus(code));
	};
	var exitJS = (status, implicit) => {
		EXITSTATUS = status;
		_proc_exit(status);
	};
	var _exit = exitJS;
	var maybeExit = () => {
		if (!keepRuntimeAlive()) try {
			_exit(EXITSTATUS);
		} catch (e) {
			handleException(e);
		}
	};
	var callUserCallback = (func) => {
		if (ABORT) return;
		try {
			func();
			maybeExit();
		} catch (e) {
			handleException(e);
		}
	};
	var _emscripten_get_now = () => performance.now();
	var __setitimer_js = (which, timeout_ms) => {
		if (timers[which]) {
			clearTimeout(timers[which].id);
			delete timers[which];
		}
		if (!timeout_ms) return 0;
		timers[which] = {
			id: setTimeout(() => {
				delete timers[which];
				callUserCallback(() => __emscripten_timeout(which, _emscripten_get_now()));
			}, timeout_ms),
			timeout_ms
		};
		return 0;
	};
	var __tzset_js = (timezone, daylight, std_name, dst_name) => {
		var currentYear = (/* @__PURE__ */ new Date()).getFullYear();
		var winter = new Date(currentYear, 0, 1);
		var summer = new Date(currentYear, 6, 1);
		var winterOffset = winter.getTimezoneOffset();
		var summerOffset = summer.getTimezoneOffset();
		var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
		HEAPU32[timezone >> 2] = stdTimezoneOffset * 60;
		HEAP32[daylight >> 2] = Number(winterOffset != summerOffset);
		var extractZone = (timezoneOffset) => {
			var sign = timezoneOffset >= 0 ? "-" : "+";
			var absOffset = Math.abs(timezoneOffset);
			return `UTC${sign}${String(Math.floor(absOffset / 60)).padStart(2, "0")}${String(absOffset % 60).padStart(2, "0")}`;
		};
		var winterName = extractZone(winterOffset);
		var summerName = extractZone(summerOffset);
		if (summerOffset < winterOffset) {
			stringToUTF8(winterName, std_name, 17);
			stringToUTF8(summerName, dst_name, 17);
		} else {
			stringToUTF8(winterName, dst_name, 17);
			stringToUTF8(summerName, std_name, 17);
		}
	};
	var _emscripten_date_now = () => Date.now();
	var getHeapMax = () => 2147483648;
	var growMemory = (size) => {
		var pages = (size - wasmMemory.buffer.byteLength + 65535) / 65536 | 0;
		try {
			wasmMemory.grow(pages);
			updateMemoryViews();
			return 1;
		} catch (e) {}
	};
	var _emscripten_resize_heap = (requestedSize) => {
		var oldSize = HEAPU8.length;
		requestedSize >>>= 0;
		var maxHeapSize = getHeapMax();
		if (requestedSize > maxHeapSize) return false;
		for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
			var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
			overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
			if (growMemory(Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536)))) return true;
		}
		return false;
	};
	var ENV = {};
	var getExecutableName = () => thisProgram || "./this.program";
	var getEnvStrings = () => {
		if (!getEnvStrings.strings) {
			var env = {
				USER: "web_user",
				LOGNAME: "web_user",
				PATH: "/",
				PWD: "/",
				HOME: "/home/web_user",
				LANG: (globalThis.navigator?.language ?? "C").replace("-", "_") + ".UTF-8",
				_: getExecutableName()
			};
			for (var x in ENV) if (ENV[x] === void 0) delete env[x];
			else env[x] = ENV[x];
			var strings = [];
			for (var x in env) strings.push(`${x}=${env[x]}`);
			getEnvStrings.strings = strings;
		}
		return getEnvStrings.strings;
	};
	var _environ_get = (__environ, environ_buf) => {
		var bufSize = 0;
		var envp = 0;
		for (var string of getEnvStrings()) {
			var ptr = environ_buf + bufSize;
			HEAPU32[__environ + envp >> 2] = ptr;
			bufSize += stringToUTF8(string, ptr, Infinity) + 1;
			envp += 4;
		}
		return 0;
	};
	var _environ_sizes_get = (penviron_count, penviron_buf_size) => {
		var strings = getEnvStrings();
		HEAPU32[penviron_count >> 2] = strings.length;
		var bufSize = 0;
		for (var string of strings) bufSize += lengthBytesUTF8(string) + 1;
		HEAPU32[penviron_buf_size >> 2] = bufSize;
		return 0;
	};
	function _fd_close(fd) {
		try {
			var stream = SYSCALLS.getStreamFromFD(fd);
			FS.close(stream);
			return 0;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return e.errno;
		}
	}
	function _fd_fdstat_get(fd, pbuf) {
		try {
			var rightsBase = 0;
			var rightsInheriting = 0;
			var flags = 0;
			var stream = SYSCALLS.getStreamFromFD(fd);
			var type = stream.tty ? 2 : FS.isDir(stream.mode) ? 3 : FS.isLink(stream.mode) ? 7 : 4;
			HEAP8[pbuf] = type;
			HEAP16[pbuf + 2 >> 1] = flags;
			tempI64 = [rightsBase >>> 0, (tempDouble = rightsBase, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[pbuf + 8 >> 2] = tempI64[0], HEAP32[pbuf + 12 >> 2] = tempI64[1];
			tempI64 = [rightsInheriting >>> 0, (tempDouble = rightsInheriting, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[pbuf + 16 >> 2] = tempI64[0], HEAP32[pbuf + 20 >> 2] = tempI64[1];
			return 0;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return e.errno;
		}
	}
	var doReadv = (stream, iov, iovcnt, offset) => {
		var ret = 0;
		for (var i = 0; i < iovcnt; i++) {
			var ptr = HEAPU32[iov >> 2];
			var len = HEAPU32[iov + 4 >> 2];
			iov += 8;
			var curr = FS.read(stream, HEAP8, ptr, len, offset);
			if (curr < 0) return -1;
			ret += curr;
			if (curr < len) break;
			if (typeof offset != "undefined") offset += curr;
		}
		return ret;
	};
	function _fd_read(fd, iov, iovcnt, pnum) {
		try {
			var num = doReadv(SYSCALLS.getStreamFromFD(fd), iov, iovcnt);
			HEAPU32[pnum >> 2] = num;
			return 0;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return e.errno;
		}
	}
	function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
		var offset = convertI32PairToI53Checked(offset_low, offset_high);
		try {
			if (isNaN(offset)) return 61;
			var stream = SYSCALLS.getStreamFromFD(fd);
			FS.llseek(stream, offset, whence);
			tempI64 = [stream.position >>> 0, (tempDouble = stream.position, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[newOffset >> 2] = tempI64[0], HEAP32[newOffset + 4 >> 2] = tempI64[1];
			if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
			return 0;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return e.errno;
		}
	}
	function _fd_sync(fd) {
		try {
			var stream = SYSCALLS.getStreamFromFD(fd);
			return stream.stream_ops?.fsync?.(stream);
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return e.errno;
		}
	}
	var doWritev = (stream, iov, iovcnt, offset) => {
		var ret = 0;
		for (var i = 0; i < iovcnt; i++) {
			var ptr = HEAPU32[iov >> 2];
			var len = HEAPU32[iov + 4 >> 2];
			iov += 8;
			var curr = FS.write(stream, HEAP8, ptr, len, offset);
			if (curr < 0) return -1;
			ret += curr;
			if (curr < len) break;
			if (typeof offset != "undefined") offset += curr;
		}
		return ret;
	};
	function _fd_write(fd, iov, iovcnt, pnum) {
		try {
			var num = doWritev(SYSCALLS.getStreamFromFD(fd), iov, iovcnt);
			HEAPU32[pnum >> 2] = num;
			return 0;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return e.errno;
		}
	}
	var adapters_support = function() {
		const handleAsync = typeof Asyncify === "object" ? Asyncify.handleAsync.bind(Asyncify) : null;
		Module["handleAsync"] = handleAsync;
		const targets = /* @__PURE__ */ new Map();
		Module["setCallback"] = (key, target) => targets.set(key, target);
		Module["getCallback"] = (key) => targets.get(key);
		Module["deleteCallback"] = (key) => targets.delete(key);
		adapters_support = function(isAsync, key, ...args) {
			const receiver = targets.get(key);
			let methodName = null;
			const f = typeof receiver === "function" ? receiver : receiver[methodName = UTF8ToString(args.shift())];
			if (isAsync) {
				if (handleAsync) return handleAsync(() => f.apply(receiver, args));
				throw new Error("Synchronous WebAssembly cannot call async function");
			}
			const result = f.apply(receiver, args);
			if (typeof result?.then == "function") {
				console.error("unexpected Promise", f);
				throw new Error(`${methodName} unexpectedly returned a Promise`);
			}
			return result;
		};
	};
	function _ipp(...args) {
		return adapters_support(false, ...args);
	}
	function _ipp_async(...args) {
		return adapters_support(true, ...args);
	}
	function _ippip(...args) {
		return adapters_support(false, ...args);
	}
	function _ippip_async(...args) {
		return adapters_support(true, ...args);
	}
	function _ippipppp(...args) {
		return adapters_support(false, ...args);
	}
	function _ippipppp_async(...args) {
		return adapters_support(true, ...args);
	}
	function _ippp(...args) {
		return adapters_support(false, ...args);
	}
	function _ippp_async(...args) {
		return adapters_support(true, ...args);
	}
	function _ipppi(...args) {
		return adapters_support(false, ...args);
	}
	function _ipppi_async(...args) {
		return adapters_support(true, ...args);
	}
	function _ipppiii(...args) {
		return adapters_support(false, ...args);
	}
	function _ipppiii_async(...args) {
		return adapters_support(true, ...args);
	}
	function _ipppiiip(...args) {
		return adapters_support(false, ...args);
	}
	function _ipppiiip_async(...args) {
		return adapters_support(true, ...args);
	}
	function _ipppip(...args) {
		return adapters_support(false, ...args);
	}
	function _ipppip_async(...args) {
		return adapters_support(true, ...args);
	}
	function _ipppj(...args) {
		return adapters_support(false, ...args);
	}
	function _ipppj_async(...args) {
		return adapters_support(true, ...args);
	}
	function _ipppp(...args) {
		return adapters_support(false, ...args);
	}
	function _ipppp_async(...args) {
		return adapters_support(true, ...args);
	}
	function _ippppi(...args) {
		return adapters_support(false, ...args);
	}
	function _ippppi_async(...args) {
		return adapters_support(true, ...args);
	}
	function _ippppij(...args) {
		return adapters_support(false, ...args);
	}
	function _ippppij_async(...args) {
		return adapters_support(true, ...args);
	}
	function _ippppip(...args) {
		return adapters_support(false, ...args);
	}
	function _ippppip_async(...args) {
		return adapters_support(true, ...args);
	}
	function _ipppppip(...args) {
		return adapters_support(false, ...args);
	}
	function _ipppppip_async(...args) {
		return adapters_support(true, ...args);
	}
	function _vppippii(...args) {
		return adapters_support(false, ...args);
	}
	function _vppippii_async(...args) {
		return adapters_support(true, ...args);
	}
	function _vppp(...args) {
		return adapters_support(false, ...args);
	}
	function _vppp_async(...args) {
		return adapters_support(true, ...args);
	}
	function _vpppip(...args) {
		return adapters_support(false, ...args);
	}
	function _vpppip_async(...args) {
		return adapters_support(true, ...args);
	}
	var getWasmTableEntry = (funcPtr) => wasmTable.get(funcPtr);
	var updateTableMap = (offset, count) => {
		if (functionsInTableMap) for (var i = offset; i < offset + count; i++) {
			var item = getWasmTableEntry(i);
			if (item) functionsInTableMap.set(item, i);
		}
	};
	var functionsInTableMap;
	var getFunctionAddress = (func) => {
		if (!functionsInTableMap) {
			functionsInTableMap = /* @__PURE__ */ new WeakMap();
			updateTableMap(0, wasmTable.length);
		}
		return functionsInTableMap.get(func) || 0;
	};
	var freeTableIndexes = [];
	var getEmptyTableSlot = () => {
		if (freeTableIndexes.length) return freeTableIndexes.pop();
		return wasmTable["grow"](1);
	};
	var setWasmTableEntry = (idx, func) => wasmTable.set(idx, func);
	var uleb128EncodeWithLen = (arr) => {
		const n = arr.length;
		return [
			n % 128 | 128,
			n >> 7,
			...arr
		];
	};
	var wasmTypeCodes = {
		i: 127,
		p: 127,
		j: 126,
		f: 125,
		d: 124,
		e: 111
	};
	var generateTypePack = (types) => uleb128EncodeWithLen(Array.from(types, (type) => {
		return wasmTypeCodes[type];
	}));
	var convertJsFunctionToWasm = (func, sig) => {
		var bytes = Uint8Array.of(0, 97, 115, 109, 1, 0, 0, 0, 1, ...uleb128EncodeWithLen([
			1,
			96,
			...generateTypePack(sig.slice(1)),
			...generateTypePack(sig[0] === "v" ? "" : sig[0])
		]), 2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0);
		var module = new WebAssembly.Module(bytes);
		return new WebAssembly.Instance(module, { e: { f: func } }).exports["f"];
	};
	var addFunction = (func, sig) => {
		var rtn = getFunctionAddress(func);
		if (rtn) return rtn;
		var ret = getEmptyTableSlot();
		try {
			setWasmTableEntry(ret, func);
		} catch (err) {
			if (!(err instanceof TypeError)) throw err;
			setWasmTableEntry(ret, convertJsFunctionToWasm(func, sig));
		}
		functionsInTableMap.set(func, ret);
		return ret;
	};
	var getCFunc = (ident) => {
		return Module["_" + ident];
	};
	var writeArrayToMemory = (array, buffer) => {
		HEAP8.set(array, buffer);
	};
	var stackAlloc = (sz) => __emscripten_stack_alloc(sz);
	var stringToUTF8OnStack = (str) => {
		var size = lengthBytesUTF8(str) + 1;
		var ret = stackAlloc(size);
		stringToUTF8(str, ret, size);
		return ret;
	};
	var ccall = (ident, returnType, argTypes, args, opts) => {
		var toC = {
			string: (str) => {
				var ret = 0;
				if (str !== null && str !== void 0 && str !== 0) ret = stringToUTF8OnStack(str);
				return ret;
			},
			array: (arr) => {
				var ret = stackAlloc(arr.length);
				writeArrayToMemory(arr, ret);
				return ret;
			}
		};
		function convertReturnValue(ret) {
			if (returnType === "string") return UTF8ToString(ret);
			if (returnType === "boolean") return Boolean(ret);
			return ret;
		}
		var func = getCFunc(ident);
		var cArgs = [];
		var stack = 0;
		if (args) for (var i = 0; i < args.length; i++) {
			var converter = toC[argTypes[i]];
			if (converter) {
				if (stack === 0) stack = stackSave();
				cArgs[i] = converter(args[i]);
			} else cArgs[i] = args[i];
		}
		var ret = func(...cArgs);
		function onDone(ret) {
			if (stack !== 0) stackRestore(stack);
			return convertReturnValue(ret);
		}
		ret = onDone(ret);
		return ret;
	};
	var cwrap = (ident, returnType, argTypes, opts) => {
		var numericArgs = !argTypes || argTypes.every((type) => type === "number" || type === "boolean");
		if (returnType !== "string" && numericArgs && !opts) return getCFunc(ident);
		return (...args) => ccall(ident, returnType, argTypes, args, opts);
	};
	var getTempRet0 = (val) => __emscripten_tempret_get();
	var stringToUTF16 = (str, outPtr, maxBytesToWrite) => {
		maxBytesToWrite ??= 2147483647;
		if (maxBytesToWrite < 2) return 0;
		maxBytesToWrite -= 2;
		var startPtr = outPtr;
		var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
		for (var i = 0; i < numCharsToWrite; ++i) {
			var codeUnit = str.charCodeAt(i);
			HEAP16[outPtr >> 1] = codeUnit;
			outPtr += 2;
		}
		HEAP16[outPtr >> 1] = 0;
		return outPtr - startPtr;
	};
	var stringToUTF32 = (str, outPtr, maxBytesToWrite) => {
		maxBytesToWrite ??= 2147483647;
		if (maxBytesToWrite < 4) return 0;
		var startPtr = outPtr;
		var endPtr = startPtr + maxBytesToWrite - 4;
		for (var i = 0; i < str.length; ++i) {
			var codePoint = str.codePointAt(i);
			if (codePoint > 65535) i++;
			HEAP32[outPtr >> 2] = codePoint;
			outPtr += 4;
			if (outPtr + 4 > endPtr) break;
		}
		HEAP32[outPtr >> 2] = 0;
		return outPtr - startPtr;
	};
	var AsciiToString = (ptr) => {
		var str = "";
		while (1) {
			var ch = HEAPU8[ptr++];
			if (!ch) return str;
			str += String.fromCharCode(ch);
		}
	};
	var UTF16Decoder = new TextDecoder("utf-16le");
	var UTF16ToString = (ptr, maxBytesToRead, ignoreNul) => {
		var idx = ptr >> 1;
		var endIdx = findStringEnd(HEAPU16, idx, maxBytesToRead / 2, ignoreNul);
		return UTF16Decoder.decode(HEAPU16.subarray(idx, endIdx));
	};
	var UTF32ToString = (ptr, maxBytesToRead, ignoreNul) => {
		var str = "";
		var startIdx = ptr >> 2;
		for (var i = 0; !(i >= maxBytesToRead / 4); i++) {
			var utf32 = HEAPU32[startIdx + i];
			if (!utf32 && !ignoreNul) break;
			str += String.fromCodePoint(utf32);
		}
		return str;
	};
	var intArrayToString = (array) => {
		var ret = [];
		for (var i = 0; i < array.length; i++) {
			var chr = array[i];
			if (chr > 255) chr &= 255;
			ret.push(String.fromCharCode(chr));
		}
		return ret.join("");
	};
	FS.createPreloadedFile = FS_createPreloadedFile;
	FS.preloadFile = FS_preloadFile;
	FS.staticInit();
	adapters_support();
	if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];
	if (Module["preloadPlugins"]) preloadPlugins = Module["preloadPlugins"];
	if (Module["print"]) out = Module["print"];
	if (Module["printErr"]) err = Module["printErr"];
	if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
	if (Module["arguments"]) Module["arguments"];
	if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
	if (Module["preInit"]) {
		if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
		while (Module["preInit"].length > 0) Module["preInit"].shift()();
	}
	Module["getTempRet0"] = getTempRet0;
	Module["ccall"] = ccall;
	Module["cwrap"] = cwrap;
	Module["addFunction"] = addFunction;
	Module["setValue"] = setValue;
	Module["getValue"] = getValue;
	Module["UTF8ToString"] = UTF8ToString;
	Module["stringToUTF8"] = stringToUTF8;
	Module["lengthBytesUTF8"] = lengthBytesUTF8;
	Module["intArrayFromString"] = intArrayFromString;
	Module["intArrayToString"] = intArrayToString;
	Module["AsciiToString"] = AsciiToString;
	Module["UTF16ToString"] = UTF16ToString;
	Module["stringToUTF16"] = stringToUTF16;
	Module["UTF32ToString"] = UTF32ToString;
	Module["stringToUTF32"] = stringToUTF32;
	Module["writeArrayToMemory"] = writeArrayToMemory;
	var _main, _emscripten_builtin_memalign, __emscripten_timeout, __emscripten_tempret_get, __emscripten_stack_restore, __emscripten_stack_alloc, _emscripten_stack_get_current, wasmMemory, wasmTable;
	function assignWasmExports(wasmExports) {
		Module["_sqlite3_status64"] = wasmExports["ta"];
		Module["_sqlite3_status"] = wasmExports["ua"];
		Module["_sqlite3_db_status"] = wasmExports["va"];
		Module["_sqlite3_msize"] = wasmExports["wa"];
		Module["_sqlite3_vfs_find"] = wasmExports["xa"];
		Module["_sqlite3_vfs_register"] = wasmExports["ya"];
		Module["_sqlite3_vfs_unregister"] = wasmExports["za"];
		Module["_sqlite3_release_memory"] = wasmExports["Aa"];
		Module["_sqlite3_soft_heap_limit64"] = wasmExports["Ba"];
		Module["_sqlite3_memory_used"] = wasmExports["Ca"];
		Module["_sqlite3_hard_heap_limit64"] = wasmExports["Da"];
		Module["_sqlite3_memory_highwater"] = wasmExports["Ea"];
		Module["_sqlite3_malloc"] = wasmExports["Fa"];
		Module["_sqlite3_malloc64"] = wasmExports["Ga"];
		Module["_sqlite3_free"] = wasmExports["Ha"];
		Module["_sqlite3_realloc"] = wasmExports["Ia"];
		Module["_sqlite3_realloc64"] = wasmExports["Ja"];
		Module["_sqlite3_str_vappendf"] = wasmExports["Ka"];
		Module["_sqlite3_str_append"] = wasmExports["La"];
		Module["_sqlite3_str_appendchar"] = wasmExports["Ma"];
		Module["_sqlite3_str_appendall"] = wasmExports["Na"];
		Module["_sqlite3_str_appendf"] = wasmExports["Oa"];
		Module["_sqlite3_str_finish"] = wasmExports["Pa"];
		Module["_sqlite3_str_errcode"] = wasmExports["Qa"];
		Module["_sqlite3_str_length"] = wasmExports["Ra"];
		Module["_sqlite3_str_value"] = wasmExports["Sa"];
		Module["_sqlite3_str_reset"] = wasmExports["Ta"];
		Module["_sqlite3_str_new"] = wasmExports["Ua"];
		Module["_sqlite3_vmprintf"] = wasmExports["Va"];
		Module["_sqlite3_mprintf"] = wasmExports["Wa"];
		Module["_sqlite3_vsnprintf"] = wasmExports["Xa"];
		Module["_sqlite3_snprintf"] = wasmExports["Ya"];
		Module["_sqlite3_log"] = wasmExports["Za"];
		Module["_sqlite3_randomness"] = wasmExports["_a"];
		Module["_sqlite3_stricmp"] = wasmExports["$a"];
		Module["_sqlite3_strnicmp"] = wasmExports["ab"];
		Module["_sqlite3_os_init"] = wasmExports["bb"];
		Module["_sqlite3_os_end"] = wasmExports["cb"];
		Module["_sqlite3_serialize"] = wasmExports["db"];
		Module["_sqlite3_prepare_v2"] = wasmExports["eb"];
		Module["_sqlite3_step"] = wasmExports["fb"];
		Module["_sqlite3_column_int64"] = wasmExports["gb"];
		Module["_sqlite3_reset"] = wasmExports["hb"];
		Module["_sqlite3_exec"] = wasmExports["ib"];
		Module["_sqlite3_column_int"] = wasmExports["jb"];
		Module["_sqlite3_finalize"] = wasmExports["kb"];
		Module["_sqlite3_deserialize"] = wasmExports["lb"];
		Module["_sqlite3_database_file_object"] = wasmExports["mb"];
		Module["_sqlite3_backup_init"] = wasmExports["nb"];
		Module["_sqlite3_backup_step"] = wasmExports["ob"];
		Module["_sqlite3_backup_finish"] = wasmExports["pb"];
		Module["_sqlite3_backup_remaining"] = wasmExports["qb"];
		Module["_sqlite3_backup_pagecount"] = wasmExports["rb"];
		Module["_sqlite3_clear_bindings"] = wasmExports["sb"];
		Module["_sqlite3_value_blob"] = wasmExports["tb"];
		Module["_sqlite3_value_text"] = wasmExports["ub"];
		Module["_sqlite3_value_bytes"] = wasmExports["vb"];
		Module["_sqlite3_value_bytes16"] = wasmExports["wb"];
		Module["_sqlite3_value_double"] = wasmExports["xb"];
		Module["_sqlite3_value_int"] = wasmExports["yb"];
		Module["_sqlite3_value_int64"] = wasmExports["zb"];
		Module["_sqlite3_value_subtype"] = wasmExports["Ab"];
		Module["_sqlite3_value_pointer"] = wasmExports["Bb"];
		Module["_sqlite3_value_text16"] = wasmExports["Cb"];
		Module["_sqlite3_value_text16be"] = wasmExports["Db"];
		Module["_sqlite3_value_text16le"] = wasmExports["Eb"];
		Module["_sqlite3_value_type"] = wasmExports["Fb"];
		Module["_sqlite3_value_encoding"] = wasmExports["Gb"];
		Module["_sqlite3_value_nochange"] = wasmExports["Hb"];
		Module["_sqlite3_value_frombind"] = wasmExports["Ib"];
		Module["_sqlite3_value_dup"] = wasmExports["Jb"];
		Module["_sqlite3_value_free"] = wasmExports["Kb"];
		Module["_sqlite3_result_blob"] = wasmExports["Lb"];
		Module["_sqlite3_result_blob64"] = wasmExports["Mb"];
		Module["_sqlite3_result_double"] = wasmExports["Nb"];
		Module["_sqlite3_result_error"] = wasmExports["Ob"];
		Module["_sqlite3_result_error16"] = wasmExports["Pb"];
		Module["_sqlite3_result_int"] = wasmExports["Qb"];
		Module["_sqlite3_result_int64"] = wasmExports["Rb"];
		Module["_sqlite3_result_null"] = wasmExports["Sb"];
		Module["_sqlite3_result_pointer"] = wasmExports["Tb"];
		Module["_sqlite3_result_subtype"] = wasmExports["Ub"];
		Module["_sqlite3_result_text"] = wasmExports["Vb"];
		Module["_sqlite3_result_text64"] = wasmExports["Wb"];
		Module["_sqlite3_result_text16"] = wasmExports["Xb"];
		Module["_sqlite3_result_text16be"] = wasmExports["Yb"];
		Module["_sqlite3_result_text16le"] = wasmExports["Zb"];
		Module["_sqlite3_result_value"] = wasmExports["_b"];
		Module["_sqlite3_result_error_toobig"] = wasmExports["$b"];
		Module["_sqlite3_result_zeroblob"] = wasmExports["ac"];
		Module["_sqlite3_result_zeroblob64"] = wasmExports["bc"];
		Module["_sqlite3_result_error_code"] = wasmExports["cc"];
		Module["_sqlite3_result_error_nomem"] = wasmExports["dc"];
		Module["_sqlite3_user_data"] = wasmExports["ec"];
		Module["_sqlite3_context_db_handle"] = wasmExports["fc"];
		Module["_sqlite3_vtab_nochange"] = wasmExports["gc"];
		Module["_sqlite3_vtab_in_first"] = wasmExports["hc"];
		Module["_sqlite3_vtab_in_next"] = wasmExports["ic"];
		Module["_sqlite3_aggregate_context"] = wasmExports["jc"];
		Module["_sqlite3_get_auxdata"] = wasmExports["kc"];
		Module["_sqlite3_set_auxdata"] = wasmExports["lc"];
		Module["_sqlite3_column_count"] = wasmExports["mc"];
		Module["_sqlite3_data_count"] = wasmExports["nc"];
		Module["_sqlite3_column_blob"] = wasmExports["oc"];
		Module["_sqlite3_column_bytes"] = wasmExports["pc"];
		Module["_sqlite3_column_bytes16"] = wasmExports["qc"];
		Module["_sqlite3_column_double"] = wasmExports["rc"];
		Module["_sqlite3_column_text"] = wasmExports["sc"];
		Module["_sqlite3_column_value"] = wasmExports["tc"];
		Module["_sqlite3_column_text16"] = wasmExports["uc"];
		Module["_sqlite3_column_type"] = wasmExports["vc"];
		Module["_sqlite3_column_name"] = wasmExports["wc"];
		Module["_sqlite3_column_name16"] = wasmExports["xc"];
		Module["_sqlite3_bind_blob"] = wasmExports["yc"];
		Module["_sqlite3_bind_blob64"] = wasmExports["zc"];
		Module["_sqlite3_bind_double"] = wasmExports["Ac"];
		Module["_sqlite3_bind_int"] = wasmExports["Bc"];
		Module["_sqlite3_bind_int64"] = wasmExports["Cc"];
		Module["_sqlite3_bind_null"] = wasmExports["Dc"];
		Module["_sqlite3_bind_pointer"] = wasmExports["Ec"];
		Module["_sqlite3_bind_text"] = wasmExports["Fc"];
		Module["_sqlite3_bind_text64"] = wasmExports["Gc"];
		Module["_sqlite3_bind_text16"] = wasmExports["Hc"];
		Module["_sqlite3_bind_value"] = wasmExports["Ic"];
		Module["_sqlite3_bind_zeroblob"] = wasmExports["Jc"];
		Module["_sqlite3_bind_zeroblob64"] = wasmExports["Kc"];
		Module["_sqlite3_bind_parameter_count"] = wasmExports["Lc"];
		Module["_sqlite3_bind_parameter_name"] = wasmExports["Mc"];
		Module["_sqlite3_bind_parameter_index"] = wasmExports["Nc"];
		Module["_sqlite3_db_handle"] = wasmExports["Oc"];
		Module["_sqlite3_stmt_readonly"] = wasmExports["Pc"];
		Module["_sqlite3_stmt_isexplain"] = wasmExports["Qc"];
		Module["_sqlite3_stmt_explain"] = wasmExports["Rc"];
		Module["_sqlite3_stmt_busy"] = wasmExports["Sc"];
		Module["_sqlite3_next_stmt"] = wasmExports["Tc"];
		Module["_sqlite3_stmt_status"] = wasmExports["Uc"];
		Module["_sqlite3_sql"] = wasmExports["Vc"];
		Module["_sqlite3_expanded_sql"] = wasmExports["Wc"];
		Module["_sqlite3_value_numeric_type"] = wasmExports["Xc"];
		Module["_sqlite3_blob_open"] = wasmExports["Yc"];
		Module["_sqlite3_blob_close"] = wasmExports["Zc"];
		Module["_sqlite3_blob_read"] = wasmExports["_c"];
		Module["_sqlite3_blob_write"] = wasmExports["$c"];
		Module["_sqlite3_blob_bytes"] = wasmExports["ad"];
		Module["_sqlite3_blob_reopen"] = wasmExports["bd"];
		Module["_sqlite3_set_authorizer"] = wasmExports["cd"];
		Module["_sqlite3_strglob"] = wasmExports["dd"];
		Module["_sqlite3_strlike"] = wasmExports["ed"];
		Module["_sqlite3_errmsg"] = wasmExports["fd"];
		Module["_sqlite3_auto_extension"] = wasmExports["gd"];
		Module["_sqlite3_cancel_auto_extension"] = wasmExports["hd"];
		Module["_sqlite3_reset_auto_extension"] = wasmExports["id"];
		Module["_sqlite3_prepare"] = wasmExports["jd"];
		Module["_sqlite3_prepare_v3"] = wasmExports["kd"];
		Module["_sqlite3_prepare16"] = wasmExports["ld"];
		Module["_sqlite3_prepare16_v2"] = wasmExports["md"];
		Module["_sqlite3_prepare16_v3"] = wasmExports["nd"];
		Module["_sqlite3_get_table"] = wasmExports["od"];
		Module["_sqlite3_free_table"] = wasmExports["pd"];
		Module["_sqlite3_create_module"] = wasmExports["qd"];
		Module["_sqlite3_create_module_v2"] = wasmExports["rd"];
		Module["_sqlite3_drop_modules"] = wasmExports["sd"];
		Module["_sqlite3_declare_vtab"] = wasmExports["td"];
		Module["_sqlite3_vtab_on_conflict"] = wasmExports["ud"];
		Module["_sqlite3_vtab_config"] = wasmExports["vd"];
		Module["_sqlite3_vtab_collation"] = wasmExports["wd"];
		Module["_sqlite3_vtab_in"] = wasmExports["xd"];
		Module["_sqlite3_vtab_rhs_value"] = wasmExports["yd"];
		Module["_sqlite3_vtab_distinct"] = wasmExports["zd"];
		Module["_sqlite3_keyword_name"] = wasmExports["Ad"];
		Module["_sqlite3_keyword_count"] = wasmExports["Bd"];
		Module["_sqlite3_keyword_check"] = wasmExports["Cd"];
		Module["_sqlite3_complete"] = wasmExports["Dd"];
		Module["_sqlite3_complete16"] = wasmExports["Ed"];
		Module["_sqlite3_libversion"] = wasmExports["Fd"];
		Module["_sqlite3_libversion_number"] = wasmExports["Gd"];
		Module["_sqlite3_threadsafe"] = wasmExports["Hd"];
		Module["_sqlite3_initialize"] = wasmExports["Id"];
		Module["_sqlite3_shutdown"] = wasmExports["Jd"];
		Module["_sqlite3_config"] = wasmExports["Kd"];
		Module["_sqlite3_db_mutex"] = wasmExports["Ld"];
		Module["_sqlite3_db_release_memory"] = wasmExports["Md"];
		Module["_sqlite3_db_cacheflush"] = wasmExports["Nd"];
		Module["_sqlite3_db_config"] = wasmExports["Od"];
		Module["_sqlite3_last_insert_rowid"] = wasmExports["Pd"];
		Module["_sqlite3_set_last_insert_rowid"] = wasmExports["Qd"];
		Module["_sqlite3_changes64"] = wasmExports["Rd"];
		Module["_sqlite3_changes"] = wasmExports["Sd"];
		Module["_sqlite3_total_changes64"] = wasmExports["Td"];
		Module["_sqlite3_total_changes"] = wasmExports["Ud"];
		Module["_sqlite3_txn_state"] = wasmExports["Vd"];
		Module["_sqlite3_close"] = wasmExports["Wd"];
		Module["_sqlite3_close_v2"] = wasmExports["Xd"];
		Module["_sqlite3_busy_handler"] = wasmExports["Yd"];
		Module["_sqlite3_progress_handler"] = wasmExports["Zd"];
		Module["_sqlite3_busy_timeout"] = wasmExports["_d"];
		Module["_sqlite3_interrupt"] = wasmExports["$d"];
		Module["_sqlite3_is_interrupted"] = wasmExports["ae"];
		Module["_sqlite3_create_function"] = wasmExports["be"];
		Module["_sqlite3_create_function_v2"] = wasmExports["ce"];
		Module["_sqlite3_create_window_function"] = wasmExports["de"];
		Module["_sqlite3_create_function16"] = wasmExports["ee"];
		Module["_sqlite3_overload_function"] = wasmExports["fe"];
		Module["_sqlite3_trace_v2"] = wasmExports["ge"];
		Module["_sqlite3_commit_hook"] = wasmExports["he"];
		Module["_sqlite3_update_hook"] = wasmExports["ie"];
		Module["_sqlite3_rollback_hook"] = wasmExports["je"];
		Module["_sqlite3_autovacuum_pages"] = wasmExports["ke"];
		Module["_sqlite3_wal_autocheckpoint"] = wasmExports["le"];
		Module["_sqlite3_wal_hook"] = wasmExports["me"];
		Module["_sqlite3_wal_checkpoint_v2"] = wasmExports["ne"];
		Module["_sqlite3_wal_checkpoint"] = wasmExports["oe"];
		Module["_sqlite3_error_offset"] = wasmExports["pe"];
		Module["_sqlite3_errmsg16"] = wasmExports["qe"];
		Module["_sqlite3_errcode"] = wasmExports["re"];
		Module["_sqlite3_extended_errcode"] = wasmExports["se"];
		Module["_sqlite3_system_errno"] = wasmExports["te"];
		Module["_sqlite3_errstr"] = wasmExports["ue"];
		Module["_sqlite3_limit"] = wasmExports["ve"];
		Module["_sqlite3_open"] = wasmExports["we"];
		Module["_sqlite3_open_v2"] = wasmExports["xe"];
		Module["_sqlite3_open16"] = wasmExports["ye"];
		Module["_sqlite3_create_collation"] = wasmExports["ze"];
		Module["_sqlite3_create_collation_v2"] = wasmExports["Ae"];
		Module["_sqlite3_create_collation16"] = wasmExports["Be"];
		Module["_sqlite3_collation_needed"] = wasmExports["Ce"];
		Module["_sqlite3_collation_needed16"] = wasmExports["De"];
		Module["_sqlite3_get_clientdata"] = wasmExports["Ee"];
		Module["_sqlite3_set_clientdata"] = wasmExports["Fe"];
		Module["_sqlite3_get_autocommit"] = wasmExports["Ge"];
		Module["_sqlite3_table_column_metadata"] = wasmExports["He"];
		Module["_sqlite3_sleep"] = wasmExports["Ie"];
		Module["_sqlite3_extended_result_codes"] = wasmExports["Je"];
		Module["_sqlite3_file_control"] = wasmExports["Ke"];
		Module["_sqlite3_test_control"] = wasmExports["Le"];
		Module["_sqlite3_create_filename"] = wasmExports["Me"];
		Module["_sqlite3_free_filename"] = wasmExports["Ne"];
		Module["_sqlite3_uri_parameter"] = wasmExports["Oe"];
		Module["_sqlite3_uri_key"] = wasmExports["Pe"];
		Module["_sqlite3_uri_boolean"] = wasmExports["Qe"];
		Module["_sqlite3_uri_int64"] = wasmExports["Re"];
		Module["_sqlite3_filename_database"] = wasmExports["Se"];
		Module["_sqlite3_filename_journal"] = wasmExports["Te"];
		Module["_sqlite3_filename_wal"] = wasmExports["Ue"];
		Module["_sqlite3_db_name"] = wasmExports["Ve"];
		Module["_sqlite3_db_filename"] = wasmExports["We"];
		Module["_sqlite3_db_readonly"] = wasmExports["Xe"];
		Module["_sqlite3_compileoption_used"] = wasmExports["Ye"];
		Module["_sqlite3_compileoption_get"] = wasmExports["Ze"];
		Module["_sqlite3session_create"] = wasmExports["_e"];
		Module["_sqlite3session_delete"] = wasmExports["$e"];
		Module["_sqlite3session_attach"] = wasmExports["af"];
		Module["_sqlite3session_changeset"] = wasmExports["bf"];
		Module["_sqlite3session_enable"] = wasmExports["cf"];
		Module["_sqlite3changeset_start"] = wasmExports["df"];
		Module["_sqlite3changeset_finalize"] = wasmExports["ef"];
		Module["_sqlite3changeset_invert"] = wasmExports["ff"];
		Module["_sqlite3changeset_apply"] = wasmExports["gf"];
		Module["_sqlite3_sourceid"] = wasmExports["hf"];
		Module["_malloc"] = wasmExports["jf"];
		Module["_free"] = wasmExports["kf"];
		Module["_RegisterExtensionFunctions"] = wasmExports["mf"];
		Module["_getSqliteFree"] = wasmExports["nf"];
		_main = Module["_main"] = wasmExports["of"];
		Module["_libauthorizer_set_authorizer"] = wasmExports["pf"];
		Module["_libfunction_create_function"] = wasmExports["qf"];
		Module["_libhook_commit_hook"] = wasmExports["rf"];
		Module["_libhook_update_hook"] = wasmExports["sf"];
		Module["_libsession_changeset_apply"] = wasmExports["tf"];
		Module["_libprogress_progress_handler"] = wasmExports["uf"];
		Module["_libvfs_vfs_register"] = wasmExports["vf"];
		_emscripten_builtin_memalign = wasmExports["xf"];
		__emscripten_timeout = wasmExports["yf"];
		__emscripten_tempret_get = wasmExports["zf"];
		__emscripten_stack_restore = wasmExports["Af"];
		__emscripten_stack_alloc = wasmExports["Bf"];
		_emscripten_stack_get_current = wasmExports["Cf"];
		wasmExports["dynCall_viiiiijj"];
		wasmExports["dynCall_viji"];
		wasmExports["dynCall_viiiij"];
		wasmExports["dynCall_iij"];
		wasmExports["dynCall_iiiij"];
		wasmExports["dynCall_iijii"];
		wasmExports["dynCall_iiji"];
		wasmExports["dynCall_iiiiiij"];
		wasmMemory = wasmExports["ra"];
		Module["_sqlite3_version"] = wasmExports["lf"].value;
		wasmTable = wasmExports["wf"];
	}
	var wasmImports = {
		a: ___assert_fail,
		aa: ___syscall_chmod,
		ca: ___syscall_faccessat,
		ba: ___syscall_fchmod,
		$: ___syscall_fchown32,
		b: ___syscall_fcntl64,
		_: ___syscall_fstat64,
		y: ___syscall_ftruncate64,
		U: ___syscall_getcwd,
		X: ___syscall_lstat64,
		R: ___syscall_mkdirat,
		W: ___syscall_newfstatat,
		P: ___syscall_openat,
		N: ___syscall_readlinkat,
		M: ___syscall_rmdir,
		Z: ___syscall_stat64,
		K: ___syscall_unlinkat,
		J: ___syscall_utimensat,
		F: __abort_js,
		E: __emscripten_runtime_keepalive_clear,
		w: __localtime_js,
		t: __mmap_js,
		v: __munmap_js,
		G: __setitimer_js,
		Q: __tzset_js,
		n: _emscripten_date_now,
		i: _emscripten_get_now,
		H: _emscripten_resize_heap,
		S: _environ_get,
		T: _environ_sizes_get,
		o: _fd_close,
		I: _fd_fdstat_get,
		O: _fd_read,
		x: _fd_seek,
		V: _fd_sync,
		L: _fd_write,
		s: _ipp,
		u: _ipp_async,
		na: _ippip,
		oa: _ippip_async,
		ka: _ippipppp,
		qa: _ippipppp_async,
		g: _ippp,
		h: _ippp_async,
		c: _ipppi,
		d: _ipppi_async,
		ga: _ipppiii,
		ha: _ipppiii_async,
		ia: _ipppiiip,
		ja: _ipppiiip_async,
		j: _ipppip,
		k: _ipppip_async,
		z: _ipppj,
		A: _ipppj_async,
		e: _ipppp,
		f: _ipppp_async,
		ea: _ippppi,
		fa: _ippppi_async,
		B: _ippppij,
		C: _ippppij_async,
		p: _ippppip,
		q: _ippppip_async,
		la: _ipppppip,
		ma: _ipppppip_async,
		D: _proc_exit,
		pa: _vppippii,
		r: _vppippii_async,
		l: _vppp,
		m: _vppp_async,
		Y: _vpppip,
		da: _vpppip_async
	};
	function callMain() {
		var entryFunction = _main;
		var argc = 0;
		var argv = 0;
		try {
			var ret = entryFunction(argc, argv);
			exitJS(ret, true);
			return ret;
		} catch (e) {
			return handleException(e);
		}
	}
	function run() {
		if (runDependencies > 0) {
			dependenciesFulfilled = run;
			return;
		}
		preRun();
		if (runDependencies > 0) {
			dependenciesFulfilled = run;
			return;
		}
		function doRun() {
			Module["calledRun"] = true;
			if (ABORT) return;
			initRuntime();
			readyPromiseResolve?.(Module);
			Module["onRuntimeInitialized"]?.();
			if (!(Module["noInitialRun"] || false)) callMain();
			postRun();
		}
		if (Module["setStatus"]) {
			Module["setStatus"]("Running...");
			setTimeout(() => {
				setTimeout(() => Module["setStatus"](""), 1);
				doRun();
			}, 1);
		} else doRun();
	}
	var wasmExports = await createWasm();
	run();
	(function() {
		const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
		let pAsyncFlags = 0;
		Module["set_authorizer"] = function(db, xAuthorizer, pApp) {
			if (pAsyncFlags) {
				Module["deleteCallback"](pAsyncFlags);
				Module["_sqlite3_free"](pAsyncFlags);
				pAsyncFlags = 0;
			}
			pAsyncFlags = Module["_sqlite3_malloc"](4);
			setValue(pAsyncFlags, xAuthorizer instanceof AsyncFunction ? 1 : 0, "i32");
			const result = ccall("libauthorizer_set_authorizer", "number", [
				"number",
				"number",
				"number"
			], [
				db,
				xAuthorizer ? 1 : 0,
				pAsyncFlags
			]);
			if (!result && xAuthorizer) Module["setCallback"](pAsyncFlags, (_, iAction, p3, p4, p5, p6) => xAuthorizer(pApp, iAction, p3, p4, p5, p6));
			return result;
		};
	})();
	(function() {
		const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
		const FUNC_METHODS = [
			"xFunc",
			"xStep",
			"xFinal"
		];
		const mapFunctionNameToKey = /* @__PURE__ */ new Map();
		Module["create_function"] = function(db, zFunctionName, nArg, eTextRep, pApp, xFunc, xStep, xFinal) {
			const pAsyncFlags = Module["_sqlite3_malloc"](4);
			const target = {
				xFunc,
				xStep,
				xFinal
			};
			setValue(pAsyncFlags, FUNC_METHODS.reduce((mask, method, i) => {
				if (target[method] instanceof AsyncFunction) return mask | 1 << i;
				return mask;
			}, 0), "i32");
			const result = ccall("libfunction_create_function", "number", [
				"number",
				"string",
				"number",
				"number",
				"number",
				"number",
				"number",
				"number"
			], [
				db,
				zFunctionName,
				nArg,
				eTextRep,
				pAsyncFlags,
				xFunc ? 1 : 0,
				xStep ? 1 : 0,
				xFinal ? 1 : 0
			]);
			if (!result) {
				if (mapFunctionNameToKey.has(zFunctionName)) {
					const oldKey = mapFunctionNameToKey.get(zFunctionName);
					Module["deleteCallback"](oldKey);
				}
				mapFunctionNameToKey.set(zFunctionName, pAsyncFlags);
				Module["setCallback"](pAsyncFlags, {
					xFunc,
					xStep,
					xFinal
				});
			}
			return result;
		};
	})();
	(function() {
		const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
		let pAsyncFlags = 0;
		Module["update_hook"] = function(db, xUpdateHook) {
			if (pAsyncFlags) {
				Module["deleteCallback"](pAsyncFlags);
				Module["_sqlite3_free"](pAsyncFlags);
				pAsyncFlags = 0;
			}
			pAsyncFlags = Module["_sqlite3_malloc"](4);
			setValue(pAsyncFlags, xUpdateHook instanceof AsyncFunction ? 1 : 0, "i32");
			ccall("libhook_update_hook", "void", [
				"number",
				"number",
				"number"
			], [
				db,
				xUpdateHook ? 1 : 0,
				pAsyncFlags
			]);
			if (xUpdateHook) Module["setCallback"](pAsyncFlags, (_, iUpdateType, dbName, tblName, lo32, hi32) => xUpdateHook(iUpdateType, dbName, tblName, lo32, hi32));
		};
	})();
	(function() {
		const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
		let pAsyncFlags = 0;
		Module["commit_hook"] = function(db, xCommitHook) {
			if (pAsyncFlags) {
				Module["deleteCallback"](pAsyncFlags);
				Module["_sqlite3_free"](pAsyncFlags);
				pAsyncFlags = 0;
			}
			pAsyncFlags = Module["_sqlite3_malloc"](4);
			setValue(pAsyncFlags, xCommitHook instanceof AsyncFunction ? 1 : 0, "i32");
			ccall("libhook_commit_hook", "void", [
				"number",
				"number",
				"number"
			], [
				db,
				xCommitHook ? 1 : 0,
				pAsyncFlags
			]);
			if (xCommitHook) Module["setCallback"](pAsyncFlags, (_) => xCommitHook());
		};
	})();
	(function() {
		const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
		Module["changeset_apply"] = function(db, nChangeset, pChangeset, xFilter, xConflict) {
			const pAsyncFlags = Module["_sqlite3_malloc"](4);
			let asyncFlags = 0;
			if (xFilter && xFilter instanceof AsyncFunction) asyncFlags |= 1;
			if (xConflict instanceof AsyncFunction) asyncFlags |= 2;
			setValue(pAsyncFlags, asyncFlags, "i32");
			const target = {};
			if (xFilter) target.xFilter = (zTab) => xFilter(Module["UTF8ToString"](zTab));
			target.xConflict = (eConflict, _pIter) => xConflict(eConflict);
			Module["setCallback"](pAsyncFlags, target);
			const result = ccall("libsession_changeset_apply", "number", [
				"number",
				"number",
				"number",
				"number",
				"number",
				"number"
			], [
				db,
				nChangeset,
				pChangeset,
				xFilter ? 1 : 0,
				1,
				pAsyncFlags
			]);
			Module["deleteCallback"](pAsyncFlags);
			Module["_sqlite3_free"](pAsyncFlags);
			return result;
		};
	})();
	(function() {
		const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
		let pAsyncFlags = 0;
		Module["progress_handler"] = function(db, nOps, xProgress, pApp) {
			if (pAsyncFlags) {
				Module["deleteCallback"](pAsyncFlags);
				Module["_sqlite3_free"](pAsyncFlags);
				pAsyncFlags = 0;
			}
			pAsyncFlags = Module["_sqlite3_malloc"](4);
			setValue(pAsyncFlags, xProgress instanceof AsyncFunction ? 1 : 0, "i32");
			ccall("libprogress_progress_handler", "number", [
				"number",
				"number",
				"number",
				"number"
			], [
				db,
				nOps,
				xProgress ? 1 : 0,
				pAsyncFlags
			]);
			if (xProgress) Module["setCallback"](pAsyncFlags, (_) => xProgress(pApp));
		};
	})();
	(function() {
		const VFS_METHODS = [
			"xOpen",
			"xDelete",
			"xAccess",
			"xFullPathname",
			"xRandomness",
			"xSleep",
			"xCurrentTime",
			"xGetLastError",
			"xCurrentTimeInt64",
			"xClose",
			"xRead",
			"xWrite",
			"xTruncate",
			"xSync",
			"xFileSize",
			"xLock",
			"xUnlock",
			"xCheckReservedLock",
			"xFileControl",
			"xSectorSize",
			"xDeviceCharacteristics",
			"xShmMap",
			"xShmLock",
			"xShmBarrier",
			"xShmUnmap"
		];
		const mapVFSNameToKey = /* @__PURE__ */ new Map();
		Module["vfs_register"] = function(vfs, makeDefault) {
			let methodMask = 0;
			let asyncMask = 0;
			VFS_METHODS.forEach((method, i) => {
				if (vfs[method]) {
					methodMask |= 1 << i;
					if (vfs["hasAsyncMethod"](method)) asyncMask |= 1 << i;
				}
			});
			const vfsReturn = Module["_sqlite3_malloc"](4);
			try {
				const result = ccall("libvfs_vfs_register", "number", [
					"string",
					"number",
					"number",
					"number",
					"number",
					"number"
				], [
					vfs.name,
					vfs.mxPathname,
					methodMask,
					asyncMask,
					makeDefault ? 1 : 0,
					vfsReturn
				]);
				if (!result) {
					if (mapVFSNameToKey.has(vfs.name)) {
						const oldKey = mapVFSNameToKey.get(vfs.name);
						Module["deleteCallback"](oldKey);
					}
					const key = getValue(vfsReturn, "*");
					mapVFSNameToKey.set(vfs.name, key);
					Module["setCallback"](key, vfs);
				}
				return result;
			} finally {
				Module["_sqlite3_free"](vfsReturn);
			}
		};
	})();
	if (runtimeInitialized) moduleRtn = Module;
	else moduleRtn = new Promise((resolve, reject) => {
		readyPromiseResolve = resolve;
		readyPromiseReject = reject;
	});
	return moduleRtn;
}
var MAX_INT64 = 9223372036854775807n;
var MIN_INT64 = -9223372036854775808n;
var SQLiteError = class extends Error {
	constructor(message, code) {
		super(message);
		this.code = code;
	}
};
var async = false;
/**
* Builds a Javascript API from the Emscripten module. This API is still
* low-level and closely corresponds to the C API exported by the module,
* but differs in some specifics like throwing exceptions on errors.
* @param {*} Module SQLite Emscripten module
* @returns {SQLiteAPI}
*/
function Factory(Module) {
	/** @type {SQLiteAPI} */ const sqlite3 = {};
	Module.retryOps = [];
	const sqliteFreeAddress = Module._getSqliteFree();
	const tmp = Module._malloc(8);
	const tmpPtr = [tmp, tmp + 4];
	const textEncoder = new TextEncoder();
	function createUTF8(s) {
		if (typeof s !== "string") return 0;
		const utf8 = textEncoder.encode(s);
		const zts = Module._sqlite3_malloc(utf8.byteLength + 1);
		Module.HEAPU8.set(utf8, zts);
		Module.HEAPU8[zts + utf8.byteLength] = 0;
		return zts;
	}
	/**
	* Concatenate 32-bit numbers into a 64-bit (signed) BigInt.
	* @param {number} lo32
	* @param {number} hi32
	* @returns {bigint}
	*/
	function cvt32x2ToBigInt(lo32, hi32) {
		return BigInt(hi32) << 32n | BigInt(lo32) & 4294967295n;
	}
	/**
	* Concatenate 32-bit numbers and return as number or BigInt, depending
	* on the value.
	* @param {number} lo32
	* @param {number} hi32
	* @returns {number|bigint}
	*/
	const cvt32x2AsSafe = (function() {
		const hiMax = BigInt(Number.MAX_SAFE_INTEGER) >> 32n;
		const hiMin = BigInt(Number.MIN_SAFE_INTEGER) >> 32n;
		return function(lo32, hi32) {
			if (hi32 > hiMax || hi32 < hiMin) return cvt32x2ToBigInt(lo32, hi32);
			else return hi32 * 4294967296 + (lo32 & 2147483647) - (lo32 & 2147483648);
		};
	})();
	const databases = /* @__PURE__ */ new Set();
	function verifyDatabase(db) {
		if (!databases.has(db)) throw new SQLiteError("not a database", 21);
	}
	const mapStmtToDB = /* @__PURE__ */ new Map();
	function verifyStatement(stmt) {
		if (!mapStmtToDB.has(stmt)) throw new SQLiteError("not a statement", 21);
	}
	sqlite3.bind_collection = function(stmt, bindings) {
		verifyStatement(stmt);
		const isArray = Array.isArray(bindings);
		const nBindings = sqlite3.bind_parameter_count(stmt);
		for (let i = 1; i <= nBindings; ++i) {
			const value = bindings[isArray ? i - 1 : sqlite3.bind_parameter_name(stmt, i)];
			if (value !== void 0) sqlite3.bind(stmt, i, value);
		}
		return 0;
	};
	sqlite3.bind = function(stmt, i, value) {
		verifyStatement(stmt);
		switch (typeof value) {
			case "number": if (value === (value | 0)) return sqlite3.bind_int(stmt, i, value);
			else return sqlite3.bind_double(stmt, i, value);
			case "string": return sqlite3.bind_text(stmt, i, value);
			case "boolean": return sqlite3.bind_int(stmt, i, value ? 1 : 0);
			default: if (value instanceof Uint8Array || Array.isArray(value)) return sqlite3.bind_blob(stmt, i, value);
			else if (value === null) return sqlite3.bind_null(stmt, i);
			else if (typeof value === "bigint") return sqlite3.bind_int64(stmt, i, value);
			else if (value === void 0) return 27;
			else {
				console.warn("unknown binding converted to null", value);
				return sqlite3.bind_null(stmt, i);
			}
		}
	};
	sqlite3.bind_blob = (function() {
		const fname = "sqlite3_bind_blob";
		const f = Module.cwrap(fname, ...decl("nnnnn:n"));
		return function(stmt, i, value) {
			verifyStatement(stmt);
			const byteLength = value.byteLength ?? value.length;
			const ptr = Module._sqlite3_malloc(byteLength);
			Module.HEAPU8.subarray(ptr).set(value);
			const result = f(stmt, i, ptr, byteLength, sqliteFreeAddress);
			return check(fname, result, mapStmtToDB.get(stmt));
		};
	})();
	sqlite3.bind_parameter_count = (function() {
		const f = Module.cwrap("sqlite3_bind_parameter_count", ...decl("n:n"));
		return function(stmt) {
			verifyStatement(stmt);
			return f(stmt);
		};
	})();
	sqlite3.bind_double = (function() {
		const fname = "sqlite3_bind_double";
		const f = Module.cwrap(fname, ...decl("nnn:n"));
		return function(stmt, i, value) {
			verifyStatement(stmt);
			const result = f(stmt, i, value);
			return check(fname, result, mapStmtToDB.get(stmt));
		};
	})();
	sqlite3.bind_int = (function() {
		const fname = "sqlite3_bind_int";
		const f = Module.cwrap(fname, ...decl("nnn:n"));
		return function(stmt, i, value) {
			verifyStatement(stmt);
			if (value > 2147483647 || value < -2147483648) return 25;
			const result = f(stmt, i, value);
			return check(fname, result, mapStmtToDB.get(stmt));
		};
	})();
	sqlite3.bind_int64 = (function() {
		const fname = "sqlite3_bind_int64";
		const f = Module.cwrap(fname, ...decl("nnnn:n"));
		return function(stmt, i, value) {
			verifyStatement(stmt);
			if (value > MAX_INT64 || value < MIN_INT64) return 25;
			const lo32 = value & 4294967295n;
			const hi32 = value >> 32n;
			const result = f(stmt, i, Number(lo32), Number(hi32));
			return check(fname, result, mapStmtToDB.get(stmt));
		};
	})();
	sqlite3.bind_null = (function() {
		const fname = "sqlite3_bind_null";
		const f = Module.cwrap(fname, ...decl("nn:n"));
		return function(stmt, i) {
			verifyStatement(stmt);
			const result = f(stmt, i);
			return check(fname, result, mapStmtToDB.get(stmt));
		};
	})();
	sqlite3.bind_parameter_name = (function() {
		const f = Module.cwrap("sqlite3_bind_parameter_name", ...decl("n:s"));
		return function(stmt, i) {
			verifyStatement(stmt);
			return f(stmt, i);
		};
	})();
	sqlite3.bind_text = (function() {
		const fname = "sqlite3_bind_text";
		const f = Module.cwrap(fname, ...decl("nnnnn:n"));
		return function(stmt, i, value) {
			verifyStatement(stmt);
			const ptr = createUTF8(value);
			const result = f(stmt, i, ptr, -1, sqliteFreeAddress);
			return check(fname, result, mapStmtToDB.get(stmt));
		};
	})();
	sqlite3.changes = (function() {
		const f = Module.cwrap("sqlite3_changes", ...decl("n:n"));
		return function(db) {
			verifyDatabase(db);
			return f(db);
		};
	})();
	sqlite3.deserialize = (function() {
		const f = Module.cwrap("sqlite3_deserialize", ...decl("nnnnnn:n"));
		return function(db, schema, data, szDb, szBuf, flags) {
			verifyDatabase(db);
			const ptr = Module._sqlite3_malloc(szDb);
			Module.HEAPU8.subarray(ptr).set(data);
			return f(db, schema, ptr, szDb, szBuf, flags);
		};
	})();
	const SQLITE_SERIALIZE_NOCOPY = 1;
	sqlite3.serialize = (function() {
		const f = Module.cwrap("sqlite3_serialize", ...decl("nsnn:n"));
		return function(db, schema) {
			verifyDatabase(db);
			const piSize = tmpPtr[0];
			let address = f(db, schema, piSize, 0);
			if (address === 0) {
				address = f(db, schema, piSize, SQLITE_SERIALIZE_NOCOPY);
				const size = Module.getValue(piSize, "*");
				const result = Module.HEAPU8.subarray(address, address + size);
				return new Uint8Array(result.slice());
			} else {
				const size = Module.getValue(piSize, "*");
				const result = Module.HEAPU8.subarray(address, address + size);
				const copy = new Uint8Array(result);
				Module._sqlite3_free(address);
				return copy;
			}
		};
	})();
	sqlite3.backup = (function() {
		const fInit = Module.cwrap("sqlite3_backup_init", ...decl("nsns:n"));
		const fStep = Module.cwrap("sqlite3_backup_step", ...decl("nn:n"));
		const fFinish = Module.cwrap("sqlite3_backup_finish", ...decl("n:n"));
		return function(dest, destName, source, sourceName) {
			verifyDatabase(dest);
			verifyDatabase(source);
			const backup = fInit(dest, destName, source, sourceName);
			if (backup === 0) throw new SQLiteError(`backup failed: ${Module.ccall("sqlite3_errmsg", "string", ["number"], [dest])}`, 1);
			fStep(backup, -1);
			return fFinish(backup);
		};
	})();
	sqlite3.clear_bindings = (function() {
		const fname = "sqlite3_clear_bindings";
		const f = Module.cwrap(fname, ...decl("n:n"));
		return function(stmt) {
			verifyStatement(stmt);
			const result = f(stmt);
			return check(fname, result, mapStmtToDB.get(stmt));
		};
	})();
	sqlite3.close = (function() {
		const fname = "sqlite3_close";
		const f = Module.cwrap(fname, ...decl("n:n"), { async });
		return function(db) {
			verifyDatabase(db);
			const result = f(db);
			databases.delete(db);
			return check(fname, result, db);
		};
	})();
	sqlite3.column = function(stmt, iCol) {
		verifyStatement(stmt);
		const type = sqlite3.column_type(stmt, iCol);
		switch (type) {
			case 4: return sqlite3.column_blob(stmt, iCol);
			case 2: return sqlite3.column_double(stmt, iCol);
			case 1:
				const lo32 = sqlite3.column_int(stmt, iCol);
				const hi32 = Module.getTempRet0();
				return cvt32x2AsSafe(lo32, hi32);
			case 5: return null;
			case 3: return sqlite3.column_text(stmt, iCol);
			default: throw new SQLiteError("unknown type", type);
		}
	};
	sqlite3.column_blob = (function() {
		const f = Module.cwrap("sqlite3_column_blob", ...decl("nn:n"));
		return function(stmt, iCol) {
			verifyStatement(stmt);
			const nBytes = sqlite3.column_bytes(stmt, iCol);
			const address = f(stmt, iCol);
			if (address === 0) return null;
			const result = Module.HEAPU8.subarray(address, address + nBytes);
			return new Uint8Array(result);
		};
	})();
	sqlite3.column_bytes = (function() {
		const f = Module.cwrap("sqlite3_column_bytes", ...decl("nn:n"));
		return function(stmt, iCol) {
			verifyStatement(stmt);
			return f(stmt, iCol);
		};
	})();
	sqlite3.column_count = (function() {
		const f = Module.cwrap("sqlite3_column_count", ...decl("n:n"));
		return function(stmt) {
			verifyStatement(stmt);
			return f(stmt);
		};
	})();
	sqlite3.column_double = (function() {
		const f = Module.cwrap("sqlite3_column_double", ...decl("nn:n"));
		return function(stmt, iCol) {
			verifyStatement(stmt);
			return f(stmt, iCol);
		};
	})();
	sqlite3.column_int = (function() {
		const f = Module.cwrap("sqlite3_column_int64", ...decl("nn:n"));
		return function(stmt, iCol) {
			verifyStatement(stmt);
			return f(stmt, iCol);
		};
	})();
	sqlite3.column_int64 = (function() {
		const f = Module.cwrap("sqlite3_column_int64", ...decl("nn:n"));
		return function(stmt, iCol) {
			verifyStatement(stmt);
			return cvt32x2ToBigInt(f(stmt, iCol), Module.getTempRet0());
		};
	})();
	sqlite3.column_name = (function() {
		const f = Module.cwrap("sqlite3_column_name", ...decl("nn:s"));
		return function(stmt, iCol) {
			verifyStatement(stmt);
			return f(stmt, iCol);
		};
	})();
	sqlite3.column_names = function(stmt) {
		const columns = [];
		const nColumns = sqlite3.column_count(stmt);
		for (let i = 0; i < nColumns; ++i) columns.push(sqlite3.column_name(stmt, i));
		return columns;
	};
	sqlite3.column_text = (function() {
		const f = Module.cwrap("sqlite3_column_text", ...decl("nn:s"));
		return function(stmt, iCol) {
			verifyStatement(stmt);
			return f(stmt, iCol);
		};
	})();
	sqlite3.column_type = (function() {
		const f = Module.cwrap("sqlite3_column_type", ...decl("nn:n"));
		return function(stmt, iCol) {
			verifyStatement(stmt);
			return f(stmt, iCol);
		};
	})();
	sqlite3.create_function = function(db, zFunctionName, nArg, eTextRep, pApp, xFunc, xStep, xFinal) {
		verifyDatabase(db);
		function adapt(f) {
			return (ctx, n, values) => f(ctx, Module.HEAP32.subarray(values / 4, values / 4 + n));
		}
		return check("sqlite3_create_function", Module.create_function(db, zFunctionName, nArg, eTextRep, pApp, xFunc && adapt(xFunc), xStep && adapt(xStep), xFinal), db);
	};
	sqlite3.data_count = (function() {
		const f = Module.cwrap("sqlite3_data_count", ...decl("n:n"));
		return function(stmt) {
			verifyStatement(stmt);
			return f(stmt);
		};
	})();
	sqlite3.exec = function(db, sql, callback) {
		const stmts = sqlite3.statements(db, sql, { unscoped: true });
		for (const stmt of stmts) {
			let columns;
			while (sqlite3.step(stmt) === 100) if (callback) {
				columns = columns ?? sqlite3.column_names(stmt);
				callback(sqlite3.row(stmt), columns);
			}
		}
		for (const stmt of stmts) sqlite3.finalize(stmt);
		return 0;
	};
	sqlite3.finalize = (function() {
		const f = Module.cwrap("sqlite3_finalize", ...decl("n:n"), { async });
		return function(stmt) {
			const result = f(stmt);
			mapStmtToDB.delete(stmt);
			return result;
		};
	})();
	sqlite3.get_autocommit = (function() {
		const f = Module.cwrap("sqlite3_get_autocommit", ...decl("n:n"));
		return function(db) {
			return f(db);
		};
	})();
	sqlite3.libversion = (function() {
		const f = Module.cwrap("sqlite3_libversion", ...decl(":s"));
		return function() {
			return f();
		};
	})();
	sqlite3.libversion_number = (function() {
		const f = Module.cwrap("sqlite3_libversion_number", ...decl(":n"));
		return function() {
			return f();
		};
	})();
	sqlite3.limit = (function() {
		const f = Module.cwrap("sqlite3_limit", ...decl("nnn:n"));
		return function(db, id, newVal) {
			return f(db, id, newVal);
		};
	})();
	sqlite3.open_v2 = (function() {
		const fname = "sqlite3_open_v2";
		const f = Module.cwrap(fname, ...decl("snnn:n"), { async });
		return async function(zFilename, flags, zVfs) {
			flags = flags || 6;
			zVfs = createUTF8(zVfs);
			try {
				const rc = await retry(() => f(zFilename, tmpPtr[0], flags, zVfs));
				const db = Module.getValue(tmpPtr[0], "*");
				databases.add(db);
				Module.ccall("RegisterExtensionFunctions", "void", ["number"], [db]);
				check(fname, rc, db);
				return db;
			} finally {
				Module._sqlite3_free(zVfs);
			}
		};
	})();
	sqlite3.open_v2Sync = (function() {
		const fname = "sqlite3_open_v2";
		const f = Module.cwrap(fname, ...decl("snnn:n"), { async });
		return function(zFilename, flags, zVfs) {
			flags = flags || 6;
			zVfs = createUTF8(zVfs);
			try {
				const rc = f(zFilename, tmpPtr[0], flags, zVfs);
				const db = Module.getValue(tmpPtr[0], "*");
				databases.add(db);
				Module.ccall("RegisterExtensionFunctions", "void", ["number"], [db]);
				check(fname, rc, db);
				return db;
			} finally {
				Module._sqlite3_free(zVfs);
			}
		};
	})();
	sqlite3.progress_handler = function(db, nProgressOps, handler, userData) {
		verifyDatabase(db);
		Module.progress_handler(db, nProgressOps, handler, userData);
	};
	sqlite3.reset = (function() {
		const fname = "sqlite3_reset";
		const f = Module.cwrap(fname, ...decl("n:n"), { async });
		return function(stmt) {
			verifyStatement(stmt);
			const result = f(stmt);
			return check(fname, result, mapStmtToDB.get(stmt));
		};
	})();
	sqlite3.result = function(context, value) {
		switch (typeof value) {
			case "number":
				if (value === (value | 0)) sqlite3.result_int(context, value);
				else sqlite3.result_double(context, value);
				break;
			case "string":
				sqlite3.result_text(context, value);
				break;
			default: if (value instanceof Uint8Array || Array.isArray(value)) sqlite3.result_blob(context, value);
			else if (value === null) sqlite3.result_null(context);
			else if (typeof value === "bigint") return sqlite3.result_int64(context, value);
			else {
				console.warn("unknown result converted to null", value);
				sqlite3.result_null(context);
			}
		}
	};
	sqlite3.result_blob = (function() {
		const f = Module.cwrap("sqlite3_result_blob", ...decl("nnnn:n"));
		return function(context, value) {
			const byteLength = value.byteLength ?? value.length;
			const ptr = Module._sqlite3_malloc(byteLength);
			Module.HEAPU8.subarray(ptr).set(value);
			f(context, ptr, byteLength, sqliteFreeAddress);
		};
	})();
	sqlite3.result_double = (function() {
		const f = Module.cwrap("sqlite3_result_double", ...decl("nn:n"));
		return function(context, value) {
			f(context, value);
		};
	})();
	sqlite3.result_int = (function() {
		const f = Module.cwrap("sqlite3_result_int", ...decl("nn:n"));
		return function(context, value) {
			f(context, value);
		};
	})();
	sqlite3.result_int64 = (function() {
		const f = Module.cwrap("sqlite3_result_int64", ...decl("nnn:n"));
		return function(context, value) {
			if (value > MAX_INT64 || value < MIN_INT64) return 25;
			const lo32 = value & 4294967295n;
			const hi32 = value >> 32n;
			f(context, Number(lo32), Number(hi32));
		};
	})();
	sqlite3.result_null = (function() {
		const f = Module.cwrap("sqlite3_result_null", ...decl("n:n"));
		return function(context) {
			f(context);
		};
	})();
	sqlite3.result_text = (function() {
		const f = Module.cwrap("sqlite3_result_text", ...decl("nnnn:n"));
		return function(context, value) {
			const ptr = createUTF8(value);
			f(context, ptr, -1, sqliteFreeAddress);
		};
	})();
	sqlite3.row = function(stmt) {
		const row = [];
		const nColumns = sqlite3.data_count(stmt);
		for (let i = 0; i < nColumns; ++i) {
			const value = sqlite3.column(stmt, i);
			row.push(value?.buffer === Module.HEAPU8.buffer ? value.slice() : value);
		}
		return row;
	};
	sqlite3.set_authorizer = function(db, xAuth, pApp) {
		verifyDatabase(db);
		function cvtArgs(_, iAction, p3, p4, p5, p6) {
			return [
				_,
				iAction,
				Module.UTF8ToString(p3),
				Module.UTF8ToString(p4),
				Module.UTF8ToString(p5),
				Module.UTF8ToString(p6)
			];
		}
		function adapt(f) {
			return (_, iAction, p3, p4, p5, p6) => f(...cvtArgs(_, iAction, p3, p4, p5, p6));
		}
		return check("sqlite3_set_authorizer", Module.set_authorizer(db, adapt(xAuth), pApp), db);
	};
	sqlite3.sql = (function() {
		const f = Module.cwrap("sqlite3_sql", ...decl("n:s"));
		return function(stmt) {
			verifyStatement(stmt);
			return f(stmt);
		};
	})();
	sqlite3.statements = function(db, sql, options = {}) {
		const prepare = Module.cwrap("sqlite3_prepare_v3", "number", [
			"number",
			"number",
			"number",
			"number",
			"number",
			"number"
		], { async: false });
		const stmts = [];
		const onFinally = [];
		const utf8 = textEncoder.encode(sql);
		const allocSize = utf8.byteLength - utf8.byteLength % 4 + 12;
		const pzHead = Module._sqlite3_malloc(allocSize);
		const pzEnd = pzHead + utf8.byteLength + 1;
		onFinally.push(() => Module._sqlite3_free(pzHead));
		Module.HEAPU8.set(utf8, pzHead);
		Module.HEAPU8[pzEnd - 1] = 0;
		const pStmt = pzHead + allocSize - 8;
		const pzTail = pzHead + allocSize - 4;
		let stmt;
		function maybeFinalize() {
			if (stmt && !options.unscoped) sqlite3.finalize(stmt);
			stmt = 0;
		}
		onFinally.push(maybeFinalize);
		Module.setValue(pzTail, pzHead, "*");
		do {
			maybeFinalize();
			const rc = prepare(db, Module.getValue(pzTail, "*"), pzEnd - pzTail, options.flags || 0, pStmt, pzTail);
			if (rc !== 0) check("sqlite3_prepare_v3", rc, db);
			stmt = Module.getValue(pStmt, "*");
			if (stmt) {
				mapStmtToDB.set(stmt, db);
				stmts.push(stmt);
			}
		} while (stmt);
		return stmts;
	};
	sqlite3.step = (function() {
		const fname = "sqlite3_step";
		const f = Module.cwrap(fname, ...decl("n:n"), { async });
		return function(stmt) {
			verifyStatement(stmt);
			const rc = f(stmt);
			return check(fname, rc, mapStmtToDB.get(stmt), [100, 101]);
		};
	})();
	sqlite3.commit_hook = function(db, xCommitHook) {
		verifyDatabase(db);
		Module.commit_hook(db, xCommitHook);
	};
	sqlite3.update_hook = function(db, xUpdateHook) {
		verifyDatabase(db);
		function cvtArgs(iUpdateType, dbName, tblName, lo32, hi32) {
			return [
				iUpdateType,
				Module.UTF8ToString(dbName),
				Module.UTF8ToString(tblName),
				cvt32x2ToBigInt(lo32, hi32)
			];
		}
		function adapt(f) {
			return (iUpdateType, dbName, tblName, lo32, hi32) => f(...cvtArgs(iUpdateType, dbName, tblName, lo32, hi32));
		}
		Module.update_hook(db, adapt(xUpdateHook));
	};
	sqlite3.session_create = (function() {
		const fname = "sqlite3session_create";
		const f = Module.cwrap(fname, ...decl("nsn:n"));
		return function(db, zDb) {
			verifyDatabase(db);
			const ppSession = Module._malloc(4);
			const result = f(db, zDb, ppSession);
			if (result !== 0) check(fname, result, db);
			return Module.getValue(ppSession, "i32");
		};
	})();
	sqlite3.session_attach = (function() {
		const fname = "sqlite3session_attach";
		const f = Module.cwrap(fname, ...decl("ns:n"));
		return function(pSession, zTab) {
			if (typeof pSession !== "number") throw new SQLiteError("Invalid session object", 21);
			const result = f(pSession, zTab);
			return check(fname, result);
		};
	})();
	sqlite3.session_enable = (function() {
		const f = Module.cwrap("sqlite3session_enable", ...decl("nn:n"));
		return function(pSession, enableBool) {
			const enable = enableBool ? 1 : 0;
			if (typeof pSession !== "number") throw new SQLiteError("Invalid session object", 21);
			if (f(pSession, enable) !== enable) throw new SQLiteError("Failed to enable session", 21);
		};
	})();
	sqlite3.session_changeset = (function() {
		const fname = "sqlite3session_changeset";
		const f = Module.cwrap(fname, ...decl("nnn:n"));
		return function(pSession) {
			if (typeof pSession !== "number") throw new SQLiteError("Invalid session object", 21);
			const sizePtr = Module._malloc(4);
			const changesetPtrPtr = Module._malloc(4);
			try {
				const result = f(pSession, sizePtr, changesetPtrPtr);
				if (result === 0) {
					const size = Module.getValue(sizePtr, "i32");
					const changesetPtr = Module.getValue(changesetPtrPtr, "i32");
					if (changesetPtr === 0) return {
						result,
						size: 0,
						changeset: null
					};
					const changeset = new Uint8Array(Module.HEAPU8.subarray(changesetPtr, changesetPtr + size));
					Module._sqlite3_free(changesetPtr);
					return {
						result,
						size,
						changeset
					};
				}
				return check(fname, result);
			} finally {
				Module._free(sizePtr);
				Module._free(changesetPtrPtr);
			}
		};
	})();
	sqlite3.session_delete = (function() {
		const f = Module.cwrap("sqlite3session_delete", ...decl("n:v"));
		return function(pSession) {
			if (typeof pSession !== "number") throw new SQLiteError("Invalid session object", 21);
			return f(pSession);
		};
	})();
	sqlite3.changeset_start = (function() {
		const fname = "sqlite3changeset_start";
		const f = Module.cwrap(fname, ...decl("nnn:n"));
		return function(changesetData) {
			const inPtr = Module._sqlite3_malloc(changesetData.length);
			Module.HEAPU8.subarray(inPtr).set(changesetData);
			const ppIter = Module._malloc(4);
			try {
				const result = f(ppIter, changesetData.length, inPtr);
				if (result !== 0) check(fname, result);
				return Module.getValue(ppIter, "i32");
			} finally {
				Module._sqlite3_free(inPtr);
				Module._free(ppIter);
			}
		};
	})();
	sqlite3.changeset_finalize = (function() {
		const f = Module.cwrap("sqlite3changeset_finalize", ...decl("n:n"));
		return function(pIter) {
			return f(pIter);
		};
	})();
	sqlite3.changeset_invert = (function() {
		const fname = "sqlite3changeset_invert";
		const f = Module.cwrap(fname, ...decl("nn:nn"));
		return function(changesetData) {
			const inPtr = Module._sqlite3_malloc(changesetData.length);
			Module.HEAPU8.subarray(inPtr).set(changesetData);
			const outLengthPtr = Module._malloc(4);
			const outPtrPtr = Module._malloc(4);
			const result = f(changesetData.length, inPtr, outLengthPtr, outPtrPtr);
			if (result !== 0) check(fname, result);
			const outLength = Module.getValue(outLengthPtr, "i32");
			const changesetOutPtr = Module.getValue(outPtrPtr, "i32");
			const changesetOut = new Uint8Array(Module.HEAPU8.buffer, changesetOutPtr, outLength).slice();
			Module._sqlite3_free(inPtr);
			Module._sqlite3_free(changesetOutPtr);
			return changesetOut;
		};
	})();
	/**
	* Convenience function to get an inverted changeset from a session
	* without having to call sqlite3session_changeset() and then sqlite3changeset_invert().
	* It's more efficient as it's reusing the same memory allocation for the changeset.
	*/
	sqlite3.session_changeset_inverted = (function() {
		const fnameChangeset = "sqlite3session_changeset";
		const fChangeset = Module.cwrap(fnameChangeset, ...decl("nnn:n"));
		const fnameInvert = "sqlite3changeset_invert";
		const fInvert = Module.cwrap(fnameInvert, ...decl("nn:nn"));
		return function(pSession) {
			if (typeof pSession !== "number") throw new SQLiteError("Invalid session object", 21);
			const sizePtr = Module._malloc(4);
			const changesetPtrPtr = Module._malloc(4);
			const sizePtrInvert = Module._malloc(4);
			const changesetPtrPtrInvert = Module._malloc(4);
			try {
				const changesetResult = fChangeset(pSession, sizePtr, changesetPtrPtr);
				if (changesetResult !== 0) return check(fnameChangeset, changesetResult);
				const size = Module.getValue(sizePtr, "i32");
				const changesetPtr = Module.getValue(changesetPtrPtr, "i32");
				const invertedResult = fInvert(size, changesetPtr, sizePtrInvert, changesetPtrPtrInvert);
				if (invertedResult !== 0) return check(fnameInvert, invertedResult);
				const sizeInvert = Module.getValue(sizePtrInvert, "i32");
				const changesetPtrInvert = Module.getValue(changesetPtrPtrInvert, "i32");
				const changesetInvert = new Uint8Array(Module.HEAPU8.buffer, changesetPtrInvert, sizeInvert);
				Module._sqlite3_free(changesetPtr);
				Module._sqlite3_free(changesetPtrInvert);
				return {
					result: changesetResult,
					size,
					changeset: new Uint8Array(changesetInvert)
				};
			} finally {
				Module._free(sizePtr);
				Module._free(changesetPtrPtr);
				Module._free(sizePtrInvert);
				Module._free(changesetPtrPtrInvert);
			}
		};
	})();
	sqlite3.changeset_apply = function(db, changesetData, xFilter, xConflict) {
		const inPtr = Module._sqlite3_malloc(changesetData.length);
		Module.HEAPU8.subarray(inPtr).set(changesetData);
		try {
			const result = Module.changeset_apply(db, changesetData.length, inPtr, xFilter, xConflict);
			if (result !== 0) check("sqlite3changeset_apply", result);
			return result;
		} finally {
			Module._sqlite3_free(inPtr);
		}
	};
	sqlite3.value = function(pValue) {
		const type = sqlite3.value_type(pValue);
		switch (type) {
			case 4: return sqlite3.value_blob(pValue);
			case 2: return sqlite3.value_double(pValue);
			case 1:
				const lo32 = sqlite3.value_int(pValue);
				const hi32 = Module.getTempRet0();
				return cvt32x2AsSafe(lo32, hi32);
			case 5: return null;
			case 3: return sqlite3.value_text(pValue);
			default: throw new SQLiteError("unknown type", type);
		}
	};
	sqlite3.value_blob = (function() {
		const f = Module.cwrap("sqlite3_value_blob", ...decl("n:n"));
		return function(pValue) {
			const nBytes = sqlite3.value_bytes(pValue);
			const address = f(pValue);
			return Module.HEAPU8.subarray(address, address + nBytes);
		};
	})();
	sqlite3.value_bytes = (function() {
		const f = Module.cwrap("sqlite3_value_bytes", ...decl("n:n"));
		return function(pValue) {
			return f(pValue);
		};
	})();
	sqlite3.value_double = (function() {
		const f = Module.cwrap("sqlite3_value_double", ...decl("n:n"));
		return function(pValue) {
			return f(pValue);
		};
	})();
	sqlite3.value_int = (function() {
		const f = Module.cwrap("sqlite3_value_int64", ...decl("n:n"));
		return function(pValue) {
			return f(pValue);
		};
	})();
	sqlite3.value_int64 = (function() {
		const f = Module.cwrap("sqlite3_value_int64", ...decl("n:n"));
		return function(pValue) {
			return cvt32x2ToBigInt(f(pValue), Module.getTempRet0());
		};
	})();
	sqlite3.value_text = (function() {
		const f = Module.cwrap("sqlite3_value_text", ...decl("n:s"));
		return function(pValue) {
			return f(pValue);
		};
	})();
	sqlite3.value_type = (function() {
		const f = Module.cwrap("sqlite3_value_type", ...decl("n:n"));
		return function(pValue) {
			return f(pValue);
		};
	})();
	const registeredVfs = /* @__PURE__ */ new Set();
	sqlite3.vfs_register = function(vfs, makeDefault) {
		if (registeredVfs.has(vfs.name)) return;
		const res = check("sqlite3_vfs_register", Module.vfs_register(vfs, makeDefault));
		registeredVfs.add(vfs.name);
		return res;
	};
	sqlite3.vfs_registered = registeredVfs;
	function check(fname, result, db = null, allowed = [0]) {
		if (allowed.includes(result)) return result;
		throw new SQLiteError(db ? Module.ccall("sqlite3_errmsg", "string", ["number"], [db]) : fname, result);
	}
	async function retry(f) {
		let rc;
		do {
			if (Module.retryOps.length) {
				await Promise.all(Module.retryOps);
				Module.retryOps = [];
			}
			rc = await f();
		} while (rc && Module.retryOps.length);
		return rc;
	}
	return sqlite3;
}
function decl(s) {
	const result = [];
	const m = s.match(/([ns@]*):([nsv@])/);
	switch (m[2]) {
		case "n":
			result.push("number");
			break;
		case "s":
			result.push("string");
			break;
		case "v": result.push(null);
	}
	const args = [];
	for (let c of m[1]) switch (c) {
		case "n":
			args.push("number");
			break;
		case "s": args.push("string");
	}
	result.push(args);
	return result;
}
var loadSqlite3Wasm = async () => {
	const module = await Module();
	const sqlite3 = Factory(module);
	sqlite3.module = module;
	return sqlite3;
};
/**
* Browser sessions benefit from downloading and compiling the wasm binary as soon as
* possible to hide network and IO latency behind the rest of the boot process. We kick
* that work off eagerly on the client while still returning the shared promise.
*
* The Cloudflare / Workerd runtime has stricter rules: async fetches during module
* evaluation are blocked, so we defer loading until the worker asks for it.
*/
var isServerRuntime = String(true) === "true" || typeof window === "undefined";
var sqlite3Promise;
if (isServerRuntime === false) sqlite3Promise = loadSqlite3Wasm();
var loadSqlite3 = () => isServerRuntime === true ? loadSqlite3Wasm() : sqlite3Promise ?? loadSqlite3Wasm();
var isRpcClientError = (error) => Schema_exports.is(RpcClientError)(error);
var dieOnRpcClientError = (effect) => effect.pipe(Effect_exports.catchIf(isRpcClientError, (error) => Effect_exports.die(error)));
var dieOnRpcClientErrorStream = (stream) => stream.pipe(Stream_exports.catchIf(isRpcClientError, (error) => Stream_exports.die(error), (error) => Stream_exports.fail(error)));
var makeWebmeshWorkerProxy = (client) => ({ execute: (request) => dieOnRpcClientErrorStream(client["WebmeshWorker.CreateConnection"](request)) });
var makeShutdownChannel = (storeId) => broadcastChannel({
	channelName: `livestore.shutdown.${storeId}`,
	schema: All
});
var StorageTypeOpfs = Schema_exports.Struct({
	type: Schema_exports.Literal("opfs"),
	/**
	* Default is `livestore-${storeId}`
	*
	* When providing this option, make sure to include the `storeId` in the path to avoid
	* conflicts with other LiveStore apps.
	*/
	directory: Schema_exports.optional(Schema_exports.String)
});
var StorageType = Schema_exports.Union([StorageTypeOpfs]);
Schema_exports.Record(Schema_exports.String, Schema_exports.Json);
var LeaderWorkerOuterInitialMessage = class extends make$13("InitialMessage", {
	payload: {
		port: MessagePort,
		storeId: Schema_exports.String,
		clientId: Schema_exports.String
	},
	success: Schema_exports.Void,
	error: Schema_exports.Never
}) {};
make$14(LeaderWorkerOuterInitialMessage);
var LeaderWorkerInnerInitialMessage = class extends make$13("InitialMessage", {
	payload: {
		storageOptions: StorageType,
		devtoolsEnabled: Schema_exports.Boolean,
		storeId: Schema_exports.String,
		clientId: Schema_exports.String,
		debugInstanceId: Schema_exports.String,
		syncPayloadEncoded: Schema_exports.UndefinedOr(Schema_exports.Json)
	},
	success: Schema_exports.Void,
	error: UnknownError$1
}) {};
var LeaderWorkerInnerBootStatusStream = class extends make$13("BootStatusStream", {
	payload: {},
	success: BootStatus,
	error: Schema_exports.Never,
	stream: true
}) {};
var LeaderWorkerInnerPushToLeader = class extends make$13("PushToLeader", {
	payload: { batch: Schema_exports.Array(Schema_exports.toType(Encoded$2)) },
	success: Schema_exports.Void,
	error: RejectedPushError
}) {};
var LeaderWorkerInnerPullStream = class extends make$13("PullStream", {
	payload: { cursor: Schema_exports.toType(Composite) },
	success: Schema_exports.Struct({ payload: PayloadUpstream }),
	error: Schema_exports.Never,
	stream: true
}) {};
var LeaderWorkerInnerStreamEvents = class extends make$13("StreamEvents", {
	payload: StreamEventsOptionsFields,
	success: Encoded$2,
	error: Schema_exports.Never,
	stream: true
}) {};
var LeaderWorkerInnerExport = class extends make$13("Export", {
	payload: {},
	success: Uint8Array$1,
	error: Schema_exports.Never
}) {};
var LeaderWorkerInnerExportEventlog = class extends make$13("ExportEventlog", {
	payload: {},
	success: Uint8Array$1,
	error: Schema_exports.Never
}) {};
var LeaderWorkerInnerGetRecreateSnapshot = class extends make$13("GetRecreateSnapshot", {
	payload: {},
	success: Schema_exports.Struct({
		snapshot: Uint8Array$1,
		migrationsReport: MigrationsReport
	}),
	error: Schema_exports.Never
}) {};
var LeaderWorkerInnerGetLeaderHead = class extends make$13("GetLeaderHead", {
	payload: {},
	success: Schema_exports.toType(Composite),
	error: Schema_exports.Never
}) {};
var LeaderWorkerInnerGetLeaderSyncState = class extends make$13("GetLeaderSyncState", {
	payload: {},
	success: SyncState,
	error: Schema_exports.Never
}) {};
var LeaderWorkerInnerSyncStateStream = class extends make$13("SyncStateStream", {
	payload: {},
	success: SyncState,
	error: Schema_exports.Never,
	stream: true
}) {};
var LeaderWorkerInnerGetNetworkStatus = class extends make$13("GetNetworkStatus", {
	payload: {},
	success: NetworkStatus,
	error: Schema_exports.Never
}) {};
var LeaderWorkerInnerNetworkStatusStream = class extends make$13("NetworkStatusStream", {
	payload: {},
	success: NetworkStatus,
	error: Schema_exports.Never,
	stream: true
}) {};
var LeaderWorkerInnerShutdown = class extends make$13("Shutdown", {
	payload: {},
	success: Schema_exports.Void,
	error: Schema_exports.Never
}) {};
var LeaderWorkerInnerExtraDevtoolsMessage = class extends make$13("ExtraDevtoolsMessage", {
	payload: { message: MessageToApp },
	success: Schema_exports.Void,
	error: Schema_exports.Never
}) {};
var WebmeshWorkerCreateConnection = class extends make$13("WebmeshWorker.CreateConnection", {
	payload: CreateConnection,
	success: Schema_exports.Struct({}),
	error: Schema_exports.Never,
	stream: true
}) {};
make$14(LeaderWorkerInnerBootStatusStream, LeaderWorkerInnerPushToLeader, LeaderWorkerInnerPullStream, LeaderWorkerInnerStreamEvents, LeaderWorkerInnerExport, LeaderWorkerInnerExportEventlog, LeaderWorkerInnerGetRecreateSnapshot, LeaderWorkerInnerGetLeaderHead, LeaderWorkerInnerGetLeaderSyncState, LeaderWorkerInnerSyncStateStream, LeaderWorkerInnerGetNetworkStatus, LeaderWorkerInnerNetworkStatusStream, LeaderWorkerInnerShutdown, LeaderWorkerInnerExtraDevtoolsMessage, WebmeshWorkerCreateConnection);
var SharedWorkerUpdateMessagePort = class extends make$13("UpdateMessagePort", {
	payload: {
		port: MessagePort,
		liveStoreVersion: Schema_exports.Literal(liveStoreVersion),
		/**
		* Initial configuration for the leader worker. This replaces the previous
		* two-phase SharedWorker handshake and is sent under the tab lock by the
		* elected leader. Subsequent calls can omit changes and will simply rebind
		* the port (join) without reinitializing the store.
		*/
		initial: LeaderWorkerInnerInitialMessage.payloadSchema
	},
	success: Schema_exports.Void,
	error: UnknownError$1
}) {};
var SharedWorkerRpcs = class extends make$14(SharedWorkerUpdateMessagePort, LeaderWorkerInnerBootStatusStream, LeaderWorkerInnerPushToLeader, LeaderWorkerInnerPullStream, LeaderWorkerInnerStreamEvents, LeaderWorkerInnerExport, LeaderWorkerInnerGetRecreateSnapshot, LeaderWorkerInnerExportEventlog, LeaderWorkerInnerGetLeaderHead, LeaderWorkerInnerGetLeaderSyncState, LeaderWorkerInnerSyncStateStream, LeaderWorkerInnerGetNetworkStatus, LeaderWorkerInnerNetworkStatusStream, LeaderWorkerInnerShutdown, LeaderWorkerInnerExtraDevtoolsMessage, WebmeshWorkerCreateConnection) {};
/**
* Creates a web-only in-memory LiveStore adapter.
*
* This adapter runs entirely in memory with no persistence. Ideal for:
* - Unit tests and integration tests
* - Sandboxes and demos
* - Ephemeral sessions where persistence isn't needed
*
* **Characteristics:**
* - Fast, zero I/O overhead
* - Works in all browser contexts: Window, WebWorker, SharedWorker, ServiceWorker
* - Supports optional sync backends for real-time collaboration
* - No data persists after page reload
*
* For persistent storage, use `makePersistedAdapter` instead.
*
* @example
* ```ts
* import { makeInMemoryAdapter } from '@livestore/adapter-web'
*
* const adapter = makeInMemoryAdapter()
* ```
*
* @example
* ```ts
* // With sync backend for real-time collaboration
* import { makeInMemoryAdapter } from '@livestore/adapter-web'
* import { makeWsSync } from '@livestore/sync-cf/client'
*
* const adapter = makeInMemoryAdapter({
*   sync: {
*     backend: makeWsSync({ url: 'wss://api.example.com/sync' }),
*   },
* })
* ```
*
* @example
* ```ts
* // Pre-populate with existing data
* const adapter = makeInMemoryAdapter({
*   importSnapshot: existingDbSnapshot,
* })
* ```
*/
var makeInMemoryAdapter = (options = {}) => (adapterArgs) => Effect_exports.gen(function* () {
	const { schema, shutdown, syncPayloadEncoded, syncPayloadSchema, storeId, devtoolsEnabled } = adapterArgs;
	const sqlite3 = yield* Effect_exports.promise(() => loadSqlite3());
	const sqliteDb = yield* sqliteDbFactory({ sqlite3 })({ _tag: "in-memory" });
	const clientId = options.clientId ?? nanoid(6);
	const sessionId = options.sessionId ?? nanoid(6);
	const sharedWebWorker = options.devtools?.sharedWorker !== void 0 ? tryAsFunctionAndNew(options.devtools.sharedWorker, { name: `livestore-shared-worker-${storeId}` }) : void 0;
	const sharedWorkerClient = sharedWebWorker !== void 0 ? yield* RpcClient_exports.make(SharedWorkerRpcs).pipe(Effect_exports.provide(provideMerge(RpcClient_exports.layerProtocolWorker({
		size: 1,
		concurrency: 100
	}), layer$1(() => sharedWebWorker))), tapCauseLogPretty, UnknownError$1.mapToUnknownError) : void 0;
	const { leaderThread, initialSnapshot } = yield* makeLeaderThread({
		schema,
		storeId,
		clientId,
		makeSqliteDb: sqliteDbFactory({ sqlite3 }),
		syncOptions: options.sync,
		syncPayloadEncoded,
		syncPayloadSchema,
		importSnapshot: options.importSnapshot,
		devtoolsEnabled,
		sharedWorker: sharedWorkerClient === void 0 ? void 0 : makeWebmeshWorkerProxy(sharedWorkerClient)
	});
	sqliteDb.import(initialSnapshot);
	const lockStatus = yield* SubscriptionRef_exports.make("has-lock");
	return yield* makeClientSession({
		...adapterArgs,
		sqliteDb,
		clientId,
		sessionId,
		isLeader: true,
		leaderThread,
		lockStatus,
		shutdown,
		webmeshMode: "direct",
		origin: globalThis.location?.origin,
		connectWebmeshNode: ({ sessionInfo, webmeshNode }) => Effect_exports.gen(function* () {
			if (sharedWorkerClient === void 0 || devtoolsEnabled === false) return;
			yield* connectWebmeshNodeClientSession({
				webmeshNode,
				sessionInfo,
				sharedWorker: makeWebmeshWorkerProxy(sharedWorkerClient),
				devtoolsEnabled,
				schema
			});
		}),
		registerBeforeUnload: (onBeforeUnload) => {
			if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
				window.addEventListener("beforeunload", onBeforeUnload);
				return () => window.removeEventListener("beforeunload", onBeforeUnload);
			}
			return () => {};
		}
	});
}).pipe(UnknownError$1.mapToUnknownError, Effect_exports.provide(layer));
var makeLeaderThread = ({ schema, storeId, clientId, makeSqliteDb, syncOptions, syncPayloadEncoded, syncPayloadSchema, importSnapshot, devtoolsEnabled, sharedWorker }) => Effect_exports.gen(function* () {
	const services = yield* Effect_exports.context();
	const makeDb = (_kind) => {
		return makeSqliteDb({
			_tag: "in-memory",
			configureDb: (db) => configureConnection(db, { foreignKeys: true }).pipe(Effect_exports.runSyncWith(services))
		});
	};
	const shutdownChannel = yield* makeShutdownChannel(storeId);
	const [dbState, dbEventlog] = yield* Effect_exports.all([makeDb("state"), makeDb("eventlog")], { concurrency: 2 });
	if (importSnapshot !== void 0) {
		dbState.import(importSnapshot);
		yield* migrateDb({
			db: dbState,
			schema
		});
	}
	const devtoolsOptions = yield* makeDevtoolsOptions({
		devtoolsEnabled,
		sharedWorker,
		dbState,
		dbEventlog,
		storeId,
		clientId
	});
	const layer = yield* build(makeLeaderThreadLayer({
		schema,
		storeId,
		clientId,
		makeSqliteDb,
		syncOptions,
		dbState,
		dbEventlog,
		devtoolsOptions,
		shutdownChannel,
		syncPayloadEncoded,
		syncPayloadSchema
	}).pipe(provide$1(layer$2({ dbState }))));
	return yield* Effect_exports.gen(function* () {
		const { dbState, dbEventlog, syncProcessor, extraIncomingMessagesQueue, initialState, networkStatus } = yield* LeaderThreadCtx;
		return {
			leaderThread: of$1({
				events: {
					pull: ({ cursor }) => syncProcessor.pull({ cursor }),
					push: (batch) => syncProcessor.push(batch.map((item) => new EncodedWithMeta(item))),
					stream: (options) => streamEventsWithSyncState({
						dbEventlog,
						syncState: syncProcessor.syncState,
						options
					})
				},
				initialState: {
					leaderHead: getClientHeadFromDb(dbEventlog),
					migrationsReport: initialState.migrationsReport,
					storageMode: "in-memory"
				},
				export: Effect_exports.sync(() => dbState.export()),
				getEventlogData: Effect_exports.sync(() => dbEventlog.export()),
				syncState: syncProcessor.syncState,
				sendDevtoolsMessage: (message) => offer$1(extraIncomingMessagesQueue, message),
				networkStatus
			}),
			initialSnapshot: dbState.export()
		};
	}).pipe(Effect_exports.provide(layer));
});
var makeDevtoolsOptions = ({ devtoolsEnabled, sharedWorker, dbState, dbEventlog, storeId, clientId }) => Effect_exports.gen(function* () {
	if (devtoolsEnabled === false || sharedWorker === void 0) return { enabled: false };
	return {
		enabled: true,
		boot: Effect_exports.gen(function* () {
			const persistenceInfo = {
				state: dbState.metadata.persistenceInfo,
				eventlog: dbEventlog.metadata.persistenceInfo
			};
			const node = yield* makeMeshNode(makeNodeName.client.leader({
				storeId,
				clientId
			}));
			globalThis.__debugWebmeshNodeLeader = node;
			yield* connectViaWorker({
				node,
				worker: sharedWorker,
				target: makeSharedWorkerNodeName({ storeId })
			}).pipe(tapCauseLogPretty, dieOnRpcClientError, Effect_exports.forkScoped);
			return {
				node,
				persistenceInfo,
				mode: "direct"
			};
		})
	};
});
var defaultRetry = Schedule_exports.recurs(2).pipe(Schedule_exports.addDelay(() => Effect_exports.succeed(100)));
function computeNextCursor(lastItem, current) {
	return lastItem.pipe(flatMap$1((item) => {
		const lastBatchItem = item.batch.at(-1);
		if (!lastBatchItem) return none();
		return some({
			eventSequenceNumber: lastBatchItem.eventEncoded.seqNum,
			metadata: lastBatchItem.metadata
		});
	}), orElse(() => current));
}
var createTwistSyncBackend = ({ endpoint = "/api/livestore", ping: pingOptions, retry } = {}) => ({ storeId }) => Effect_exports.gen(function* () {
	const isConnected = yield* SubscriptionRef_exports.make(false);
	const pullEndpoint = endpoint;
	const pushEndpoint = endpoint;
	const pingEndpoint = endpoint;
	const httpClient = yield* HttpClient;
	const pingTimeout = pingOptions?.requestTimeout ?? 1e4;
	const ping = Effect_exports.gen(function* () {
		yield* httpClient.pipe(filterStatusOk).head(pingEndpoint);
		yield* SubscriptionRef_exports.set(isConnected, true);
	}).pipe(UnknownError$1.mapToUnknownError, Effect_exports.timeout(pingTimeout), Effect_exports.catchTag("TimeoutError", () => SubscriptionRef_exports.set(isConnected, false)));
	const pingInterval = pingOptions?.requestInterval ?? 1e4;
	if (pingOptions?.enabled !== false) yield* ping.pipe(Effect_exports.repeat(Schedule_exports.spaced(pingInterval)), tapCauseLogPretty, Effect_exports.forkScoped);
	const runPullSse = (cursor, live) => {
		const fromSeq = isSome(cursor) ? cursor.value.eventSequenceNumber : 0;
		const url = `${pullEndpoint}?storeId=${encodeURIComponent(storeId)}&cursor=${fromSeq}${live ? "&live=1" : ""}`;
		return httpClient.execute(get$1(url).pipe(setHeaders({ accept: "text/event-stream" }))).pipe(stream, Stream_exports.decodeText({ encoding: "utf8" }), Stream_exports.pipeThroughChannel(decode()), Stream_exports.mapEffect(Effect_exports.fnUntraced(function* (msg) {
			const evt = msg.event.toLowerCase();
			if (evt === "ping") return none();
			if (evt === "error") return yield* Effect_exports.fail(new UnknownError$1({ cause: /* @__PURE__ */ new Error(`SSE error: ${msg.data}`) }));
			if (evt === "batch") {
				const parsed = yield* Schema_exports.decodeEffect(Schema_exports.fromJsonString(Schema_exports.Struct({
					batch: Schema_exports.Array(Schema_exports.Unknown),
					head: Schema_exports.optional(Schema_exports.Number)
				})))(msg.data).pipe(Effect_exports.mapError((cause) => new UnknownError$1({ cause })));
				const items = [];
				for (const item of parsed.batch) items.push({
					eventEncoded: item,
					metadata: none()
				});
				return some({
					batch: items,
					pageInfo: pageInfoNoMore
				});
			}
			if (evt === "message" && msg.data === "[DONE]") return none();
			return none();
		})), Stream_exports.filterMap(fromPredicateOption((item) => item)), Stream_exports.mapError((cause) => cause instanceof UnknownError$1 ? cause : new UnknownError$1({ cause })), Stream_exports.retry(retry?.pull ?? defaultRetry));
	};
	const ssePull = (startCursor) => {
		const loop = (cursor, isFirst) => {
			const sseStream = (live) => runPullSse(cursor, live).pipe(emitIfEmpty({
				batch: [],
				pageInfo: pageInfoNoMore
			}));
			return (isFirst ? sseStream(false) : sseStream(true)).pipe(concatWithLastElement((lastItem) => loop(computeNextCursor(lastItem, cursor), false)));
		};
		return loop(startCursor, true);
	};
	const runPullHttp = (cursor) => {
		const fromSeq = isSome(cursor) ? cursor.value.eventSequenceNumber : 0;
		const url = `${pullEndpoint}?storeId=${encodeURIComponent(storeId)}&cursor=${fromSeq}`;
		return Stream_exports.fromEffect(Effect_exports.gen(function* () {
			const jsonBody = yield* (yield* httpClient.execute(get$1(url)).pipe(Effect_exports.mapError((cause) => new UnknownError$1({ cause })), Effect_exports.retry(retry?.pull ?? defaultRetry))).json.pipe(Effect_exports.mapError((cause) => new UnknownError$1({ cause })));
			const record = isReadonlyObject(jsonBody) ? jsonBody : {};
			const rawBatch = Array.isArray(record.batch) ? record.batch : [];
			const items = [];
			for (const item of rawBatch) items.push({
				eventEncoded: item,
				metadata: none()
			});
			return {
				batch: items,
				pageInfo: pageInfoNoMore
			};
		}));
	};
	const push = (batch) => Effect_exports.gen(function* () {
		const res = yield* httpClient.execute(post(pushEndpoint).pipe(setHeaders({ "content-type": "application/json" }), bodyText(JSON.stringify({
			storeId,
			batch
		})))).pipe(Effect_exports.mapError((cause) => new UnknownError$1({ cause })), Effect_exports.retry(retry?.push ?? defaultRetry));
		if (res.status === 409) {
			const body = yield* res.json.pipe(Effect_exports.orElseSucceed(() => ({})));
			const parsed = isReadonlyObject(body) ? body : {};
			const minimumExpectedNum = isNumber(parsed.minimumExpectedNum) ? parsed.minimumExpectedNum : isNumber(parsed.head) ? parsed.head : 0;
			const providedNum = isNumber(parsed.providedNum) ? parsed.providedNum : batch[0]?.seqNum ?? 0;
			return yield* Effect_exports.fail(new ServerAheadError({
				minimumExpectedNum,
				providedNum
			}));
		}
		if (res.status < 200 || res.status >= 300) return yield* Effect_exports.fail(new UnknownError$1({ cause: /* @__PURE__ */ new Error(`Push failed with HTTP ${res.status}`) }));
	});
	return of({
		connect: Effect_exports.void,
		pull: (cursor, options) => {
			if (options?.live === true) return ssePull(cursor);
			return runPullHttp(cursor);
		},
		push,
		ping,
		isConnected,
		metadata: {
			name: "@twist/livestore",
			description: "Twist LiveStore sync backend",
			protocol: "http",
			endpoint
		},
		supports: {
			pullPageInfoKnown: false,
			pullLive: true
		}
	});
});
/** Build per-actor `storeOptions` for the opinionated Twist LiveStore schema. */
function actorStoreOptions(actorId, config = {}) {
	const endpoint = config.endpoint ?? "/api/livestore";
	return storeOptions({
		storeId: actorId,
		schema,
		adapter: makeInMemoryAdapter({ sync: { backend: createTwistSyncBackend({ endpoint }) } })
	});
}
var defaultRegistry = new StoreRegistry({ defaultOptions: { batchUpdates: import_react_dom.unstable_batchedUpdates } });
/** Root provider that wires LiveStore's StoreRegistry for Twist React apps. */
function TwistLiveStoreProvider({ children, storeRegistry = defaultRegistry }) {
	return (0, import_react.createElement)(StoreRegistryProvider, {
		storeRegistry,
		children
	});
}
/** Subscribe to the per-actor Twist LiveStore (sync-s2 → `/api/livestore`). */
function useActorStore(actorId, options) {
	const endpoint = options?.endpoint;
	const opts = (0, import_react.useMemo)(() => actorStoreOptions(actorId, { endpoint }), [actorId, endpoint]);
	return useStore(opts);
}
var styles_default = "/assets/styles-Dxe0Zt01.css";
var Route$2 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Twist Demo" }
		],
		links: [{
			rel: "stylesheet",
			href: styles_default
		}, {
			rel: "stylesheet",
			href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;600&display=swap"
		}]
	}),
	component: RootComponent
});
function RootComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RootDocument, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TwistLiveStoreProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/",
			style: {
				color: "inherit",
				textDecoration: "none"
			},
			children: "Twist Demo"
		}) }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "sub",
			children: "Start agents and workflows, then watch LiveStore materialize state via sync-s2 → s2-lite."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
	] }) }) });
}
function RootDocument({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
var $$splitComponentImporter$1 = () => import("./routes-dzffp7T0.mjs");
var Route$1 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./actors._actorId-CK9gQkwm.mjs");
var Route = createFileRoute("/actors/$actorId")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var rootRouteChildren = {
	IndexRoute: Route$1.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$2
	}),
	ActorsActorIdRoute: Route.update({
		id: "/actors/$actorId",
		path: "/actors/$actorId",
		getParentRoute: () => Route$2
	})
};
var routeTree = Route$2._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		scrollRestoration: true
	});
}
//#endregion
export { Route, decideReview, queries, router_exports, useActorStore };
