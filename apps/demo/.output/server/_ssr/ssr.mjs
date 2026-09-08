import { __commonJSMin, __exportAll$1 as __exportAll, __require, __toESM } from "./rolldown-runtime-DaEwE2D6.mjs";
import { require_jsx_runtime, require_react } from "../_libs/livestore__react+react.mjs";
import { RouterProvider, defineHandlerCallback, renderRouterToStream } from "../_libs/@tanstack/react-router+[...].mjs";
import { Service, addFinalizer, callback, catchDefect, catch_, effect, fail, gen, isBoolean, isFunction, isNumber, isObject, isReadonlyObject, isString$1 as isString, map, promise, provide, provideService, runFork, runPromise, succeed as succeed$1, succeed$1 as succeed, sync, tryPromise, void_ } from "../_libs/@effect/opentelemetry+[...].mjs";
import { ArraySchema, Boolean as Boolean$1, Literal, Literals, MutableJson, NullOr, Number as Number$1, Record, String as String$1, Struct, Union, callback as callback$1, decodeUnknownExit, decodeUnknownSync, endUnsafe, fail$1, interrupt, is, isSchema, mutable, offerUnsafe, optional, runForEach, toStandardSchemaV1 } from "../_libs/@livestore/common+[...].mjs";
import { get, make as make$1, update } from "../_libs/@livestore/livestore+[...].mjs";
import { numberType, objectType, stringType } from "../_libs/zod.mjs";
import * as fs from "node:fs";
import * as path from "node:path";
import { AsyncLocalStorage } from "node:async_hooks";
import * as childProcess from "node:child_process";
import * as net from "node:net";
import * as os from "node:os";
//#region node_modules/.nitro/vite/services/ssr/index.js
var ssr_exports = /* @__PURE__ */ __exportAll({
	AppendAck: () => AppendAck,
	DEFAULT_USER_AGENT: () => DEFAULT_USER_AGENT,
	RangeNotSatisfiableError: () => RangeNotSatisfiableError,
	ReadBatch: () => ReadBatch,
	RetryAppendSession: () => RetryAppendSession,
	RetryReadSession: () => RetryReadSession,
	S2Error: () => S2Error,
	S2_ENCRYPTION_KEY_HEADER: () => S2_ENCRYPTION_KEY_HEADER,
	TwistEventSchema: () => TwistEventSchema,
	bigintToSafeNumber: () => bigintToSafeNumber,
	convertProtoRecord: () => convertProtoRecord,
	createMiddleware: () => createMiddleware,
	default: () => server_default,
	encodeProtoAppendInput: () => encodeProtoAppendInput,
	err: () => err,
	errClose: () => errClose,
	fromWireEvent: () => fromWireEvent,
	makeAppendPreconditionError: () => makeAppendPreconditionError,
	makeServerError: () => makeServerError,
	ok: () => ok,
	okClose: () => okClose,
	require_src: () => require_src,
	s2Error: () => s2Error,
	value: () => value
});
require_react();
var import_jsx_runtime = require_jsx_runtime();
function StartServer(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RouterProvider, { router: props.router });
}
var defaultStreamHandler = defineHandlerCallback(({ request, router, responseHeaders }) => renderRouterToStream({
	request,
	router,
	responseHeaders,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StartServer, { router })
}));
var NullProtoObj = /* @__PURE__ */ (() => {
	const e = function() {};
	return e.prototype = Object.create(null), Object.freeze(e.prototype), e;
})();
function lazyInherit(target, source, sourceKey) {
	for (const key of [...Object.getOwnPropertyNames(source), ...Object.getOwnPropertySymbols(source)]) {
		if (key === "constructor") continue;
		const targetDesc = Object.getOwnPropertyDescriptor(target, key);
		const desc = Object.getOwnPropertyDescriptor(source, key);
		let modified = false;
		if (desc.get) {
			modified = true;
			desc.get = targetDesc?.get || function() {
				return this[sourceKey][key];
			};
		}
		if (desc.set) {
			modified = true;
			desc.set = targetDesc?.set || function(value) {
				this[sourceKey][key] = value;
			};
		}
		if (!targetDesc?.value && typeof desc.value === "function") {
			modified = true;
			desc.value = function(...args) {
				return this[sourceKey][key](...args);
			};
		}
		if (modified) Object.defineProperty(target, key, desc);
	}
}
var _needsNormRE = /(?:(?:^|\/)(?:\.|\.\.|%2e|%2e\.|\.%2e|%2e%2e)(?:\/|$))|[\\^#"<>{}`\x80-\uffff]/i;
var _searchNeedsNormRE = /[#"'<>]/;
var FastURL = /* @__PURE__ */ (() => {
	const NativeURL = globalThis.URL;
	const FastURL = class URL {
		#url;
		#href;
		#protocol;
		#host;
		#pathname;
		#search;
		#searchParams;
		#pos;
		constructor(url) {
			if (typeof url === "string") {
				const isOriginForm = url[0] === "/";
				if (isOriginForm && !_searchNeedsNormRE.test(url)) this.#href = url;
				else this.#url = new NativeURL(isOriginForm ? `http://localhost${url}` : url);
			} else if (_needsNormRE.test(url.pathname) || url.search && _searchNeedsNormRE.test(url.search)) this.#url = new NativeURL(`${url.protocol || "http:"}//${url.host || "localhost"}${url.pathname}${url.search || ""}`);
			else {
				this.#protocol = url.protocol;
				this.#host = url.host;
				this.#pathname = url.pathname;
				this.#search = url.search;
			}
		}
		static [Symbol.hasInstance](val) {
			return val instanceof NativeURL;
		}
		get _url() {
			if (this.#url) return this.#url;
			this.#url = new NativeURL(this.href);
			this.#href = void 0;
			this.#protocol = void 0;
			this.#host = void 0;
			this.#pathname = void 0;
			this.#search = void 0;
			this.#searchParams = void 0;
			this.#pos = void 0;
			return this.#url;
		}
		get href() {
			if (this.#url) return this.#url.href;
			if (!this.#href) this.#href = `${this.#protocol || "http:"}//${this.#host || "localhost"}${this.#pathname || "/"}${this.#search || ""}`;
			return this.#href;
		}
		#getPos() {
			if (!this.#pos) {
				const url = this.href;
				const protoIndex = url.indexOf("://");
				const pathnameIndex = protoIndex === -1 ? -1 : url.indexOf("/", protoIndex + 4);
				const qIndex = pathnameIndex === -1 ? -1 : url.indexOf("?", pathnameIndex);
				this.#pos = [
					protoIndex,
					pathnameIndex,
					qIndex
				];
			}
			return this.#pos;
		}
		get pathname() {
			if (this.#url) return this.#url.pathname;
			if (this.#pathname === void 0) {
				const [, pathnameIndex, queryIndex] = this.#getPos();
				if (pathnameIndex === -1) return this._url.pathname;
				this.#pathname = this.href.slice(pathnameIndex, queryIndex === -1 ? void 0 : queryIndex);
			}
			return this.#pathname;
		}
		get search() {
			if (this.#url) return this.#url.search;
			if (this.#search === void 0) {
				const [, pathnameIndex, queryIndex] = this.#getPos();
				if (pathnameIndex === -1) return this._url.search;
				const url = this.href;
				this.#search = queryIndex === -1 || queryIndex === url.length - 1 ? "" : url.slice(queryIndex);
			}
			return this.#search;
		}
		get searchParams() {
			if (this.#url) return this.#url.searchParams;
			if (!this.#searchParams) this.#searchParams = new URLSearchParams(this.search);
			return this.#searchParams;
		}
		get protocol() {
			if (this.#url) return this.#url.protocol;
			if (this.#protocol === void 0) {
				const [protocolIndex] = this.#getPos();
				if (protocolIndex === -1) return this._url.protocol;
				const url = this.href;
				this.#protocol = url.slice(0, protocolIndex + 1);
			}
			return this.#protocol;
		}
		toString() {
			return this.href;
		}
		toJSON() {
			return this.href;
		}
	};
	lazyInherit(FastURL.prototype, NativeURL.prototype, "_url");
	Object.setPrototypeOf(FastURL.prototype, NativeURL.prototype);
	Object.setPrototypeOf(FastURL, NativeURL);
	return FastURL;
})();
var FastResponse = Response;
function decodePathname(pathname) {
	return decodeURI(pathname.includes("%25") ? pathname.replace(/%25/g, "%2525") : pathname);
}
var kEventNS = "h3.internal.event.";
var kEventRes = /* @__PURE__ */ Symbol.for(`${kEventNS}res`);
var kEventResHeaders = /* @__PURE__ */ Symbol.for(`${kEventNS}res.headers`);
var kEventResErrHeaders = /* @__PURE__ */ Symbol.for(`${kEventNS}res.err.headers`);
var H3Event = class {
	app;
	req;
	url;
	context;
	static __is_event__ = true;
	constructor(req, context, app) {
		this.context = context || req.context || new NullProtoObj();
		this.req = req;
		this.app = app;
		const _url = req._url;
		const url = _url && _url instanceof URL ? _url : new FastURL(req.url);
		if (url.pathname.includes("%")) url.pathname = decodePathname(url.pathname);
		this.url = url;
	}
	get res() {
		return this[kEventRes] ||= new H3EventResponse();
	}
	get runtime() {
		return this.req.runtime;
	}
	waitUntil(promise) {
		this.req.waitUntil?.(promise);
	}
	toString() {
		return `[${this.req.method}] ${this.req.url}`;
	}
	toJSON() {
		return this.toString();
	}
	get node() {
		return this.req.runtime?.node;
	}
	get headers() {
		return this.req.headers;
	}
	get path() {
		return this.url.pathname + this.url.search;
	}
	get method() {
		return this.req.method;
	}
};
var H3EventResponse = class {
	status;
	statusText;
	get headers() {
		return this[kEventResHeaders] ||= new Headers();
	}
	get errHeaders() {
		return this[kEventResErrHeaders] ||= new Headers();
	}
};
var DISALLOWED_STATUS_CHARS = /[^\u0009\u0020-\u007E]/g;
function sanitizeStatusMessage(statusMessage = "") {
	return statusMessage.replace(DISALLOWED_STATUS_CHARS, "");
}
function sanitizeStatusCode(statusCode, defaultStatusCode = 200) {
	if (!statusCode) return defaultStatusCode;
	if (typeof statusCode === "string") statusCode = +statusCode;
	if (statusCode < 100 || statusCode > 599) return defaultStatusCode;
	return statusCode;
}
var HTTPError = class HTTPError extends Error {
	get name() {
		return "HTTPError";
	}
	status;
	statusText;
	headers;
	cause;
	data;
	body;
	unhandled;
	static isError(input) {
		return input instanceof Error && input?.name === "HTTPError";
	}
	static status(status, statusText, details) {
		return new HTTPError({
			...details,
			statusText,
			status
		});
	}
	constructor(arg1, arg2) {
		let messageInput;
		let details;
		if (typeof arg1 === "string") {
			messageInput = arg1;
			details = arg2;
		} else details = arg1;
		const status = sanitizeStatusCode(details?.status || details?.statusCode || (details?.cause)?.status || (details?.cause)?.statusCode, 500);
		const statusText = sanitizeStatusMessage(details?.statusText || details?.statusMessage || (details?.cause)?.statusText || (details?.cause)?.statusMessage);
		const message = messageInput || details?.message || (details?.cause)?.message || details?.statusText || details?.statusMessage || [
			"HTTPError",
			status,
			statusText
		].filter(Boolean).join(" ");
		super(message, { cause: details });
		this.cause = details;
		this.status = status;
		this.statusText = statusText || void 0;
		const rawHeaders = details?.headers || (details?.cause)?.headers;
		this.headers = rawHeaders ? new Headers(rawHeaders) : void 0;
		this.unhandled = details?.unhandled ?? (details?.cause)?.unhandled ?? void 0;
		this.data = details?.data;
		this.body = details?.body;
	}
	get statusCode() {
		return this.status;
	}
	get statusMessage() {
		return this.statusText;
	}
	toJSON() {
		const unhandled = this.unhandled;
		return {
			status: this.status,
			statusText: this.statusText,
			unhandled,
			message: unhandled ? "HTTPError" : this.message,
			data: unhandled ? void 0 : this.data,
			...unhandled ? void 0 : this.body
		};
	}
};
function isJSONSerializable(value, _type) {
	if (value === null || value === void 0) return true;
	if (_type !== "object") return _type === "boolean" || _type === "number" || _type === "string";
	if (typeof value.toJSON === "function") return true;
	if (Array.isArray(value)) return true;
	if (typeof value.pipe === "function" || typeof value.pipeTo === "function") return false;
	if (value instanceof NullProtoObj) return true;
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}
var kNotFound = /* @__PURE__ */ Symbol.for("h3.notFound");
var kHandled = /* @__PURE__ */ Symbol.for("h3.handled");
function toResponse(val, event, config = {}) {
	if (typeof val?.then === "function") return (val.catch?.((error) => error) || Promise.resolve(val)).then((resolvedVal) => toResponse(resolvedVal, event, config));
	const response = prepareResponse(val, event, config);
	if (typeof response?.then === "function") return toResponse(response, event, config);
	const { onResponse } = config;
	return onResponse ? Promise.resolve(onResponse(response, event)).then(() => response) : response;
}
var HTTPResponse = class {
	#headers;
	#init;
	body;
	constructor(body, init) {
		this.body = body;
		this.#init = init;
	}
	get status() {
		return this.#init?.status || 200;
	}
	get statusText() {
		return this.#init?.statusText || "OK";
	}
	get headers() {
		return this.#headers ||= new Headers(this.#init?.headers);
	}
};
function prepareResponse(val, event, config, nested) {
	if (val === kHandled) return new FastResponse(null);
	if (val === kNotFound) val = new HTTPError({
		status: 404,
		message: `Cannot find any route matching [${event.req.method}] ${event.url}`
	});
	if (val && val instanceof Error) {
		const isHTTPError = HTTPError.isError(val);
		const error = isHTTPError ? val : new HTTPError(val);
		if (!isHTTPError) {
			error.unhandled = true;
			if (val?.stack) error.stack = val.stack;
		}
		if (error.unhandled && !config.silent) console.error(error);
		const { onError } = config;
		const errHeaders = event[kEventRes]?.[kEventResErrHeaders];
		return onError && !nested ? Promise.resolve(onError(error, event)).catch((error) => error).then((newVal) => prepareResponse(newVal ?? val, event, config, true)) : errorResponse(error, config.debug, errHeaders);
	}
	const preparedRes = event[kEventRes];
	const preparedHeaders = preparedRes?.[kEventResHeaders];
	event[kEventRes] = void 0;
	if (!(val instanceof Response)) {
		const res = prepareResponseBody(val, event, config);
		const status = res.status || preparedRes?.status;
		return new FastResponse(nullBody(event.req.method, status) ? null : res.body, {
			status,
			statusText: res.statusText || preparedRes?.statusText,
			headers: res.headers && preparedHeaders ? mergeHeaders$1$1(res.headers, preparedHeaders) : res.headers || preparedHeaders
		});
	}
	if (!preparedHeaders || nested || !val.ok) return val;
	try {
		mergeHeaders$1$1(val.headers, preparedHeaders, val.headers);
		return val;
	} catch {
		return new FastResponse(nullBody(event.req.method, val.status) ? null : val.body, {
			status: val.status,
			statusText: val.statusText,
			headers: mergeHeaders$1$1(val.headers, preparedHeaders)
		});
	}
}
function mergeHeaders$1$1(base, overrides, target = new Headers(base)) {
	for (const [name, value] of overrides) if (name === "set-cookie") target.append(name, value);
	else target.set(name, value);
	return target;
}
var frozen = (name) => (...args) => {
	throw new Error(`Headers are frozen (${name} ${args.join(", ")})`);
};
var FrozenHeaders = class extends Headers {
	set = frozen("set");
	append = frozen("append");
	delete = frozen("delete");
};
var emptyHeaders = /* @__PURE__ */ new FrozenHeaders({ "content-length": "0" });
var jsonHeaders = /* @__PURE__ */ new FrozenHeaders({ "content-type": "application/json;charset=UTF-8" });
function prepareResponseBody(val, event, config) {
	if (val === null || val === void 0) return {
		body: "",
		headers: emptyHeaders
	};
	const valType = typeof val;
	if (valType === "string") return { body: val };
	if (val instanceof Uint8Array) {
		event.res.headers.set("content-length", val.byteLength.toString());
		return { body: val };
	}
	if (val instanceof HTTPResponse || val?.constructor?.name === "HTTPResponse") return val;
	if (isJSONSerializable(val, valType)) return {
		body: JSON.stringify(val, void 0, config.debug ? 2 : void 0),
		headers: jsonHeaders
	};
	if (valType === "bigint") return {
		body: val.toString(),
		headers: jsonHeaders
	};
	if (val instanceof Blob) {
		const headers = new Headers({
			"content-type": val.type,
			"content-length": val.size.toString()
		});
		let filename = val.name;
		if (filename) {
			filename = encodeURIComponent(filename);
			headers.set("content-disposition", `filename="${filename}"; filename*=UTF-8''${filename}`);
		}
		return {
			body: val.stream(),
			headers
		};
	}
	if (valType === "symbol") return { body: val.toString() };
	if (valType === "function") return { body: `${val.name}()` };
	return { body: val };
}
function nullBody(method, status) {
	return method === "HEAD" || status === 100 || status === 101 || status === 102 || status === 204 || status === 205 || status === 304;
}
function errorResponse(error, debug, errHeaders) {
	let headers = error.headers ? mergeHeaders$1$1(jsonHeaders, error.headers) : new Headers(jsonHeaders);
	if (errHeaders) headers = mergeHeaders$1$1(headers, errHeaders);
	return new FastResponse(JSON.stringify({
		...error.toJSON(),
		stack: debug && error.stack ? error.stack.split("\n").map((l) => l.trim()) : void 0
	}, void 0, debug ? 2 : void 0), {
		status: error.status,
		statusText: error.statusText,
		headers
	});
}
var GLOBAL_EVENT_STORAGE_KEY = Symbol.for("tanstack-start:event-storage");
var globalObj$1 = globalThis;
if (!globalObj$1[GLOBAL_EVENT_STORAGE_KEY]) globalObj$1[GLOBAL_EVENT_STORAGE_KEY] = new AsyncLocalStorage();
var eventStorage = globalObj$1[GLOBAL_EVENT_STORAGE_KEY];
function isPromiseLike(value) {
	return typeof value.then === "function";
}
function getSetCookieValues(headers) {
	const headersWithSetCookie = headers;
	if (typeof headersWithSetCookie.getSetCookie === "function") return headersWithSetCookie.getSetCookie();
	const value = headers.get("set-cookie");
	return value ? [value] : [];
}
function mergeEventResponseHeaders(response, event) {
	if (response.ok) return;
	const eventSetCookies = getSetCookieValues(event.res.headers);
	if (eventSetCookies.length === 0) return;
	const responseSetCookies = getSetCookieValues(response.headers);
	response.headers.delete("set-cookie");
	for (const cookie of responseSetCookies) response.headers.append("set-cookie", cookie);
	for (const cookie of eventSetCookies) response.headers.append("set-cookie", cookie);
}
function attachResponseHeaders(value, event) {
	if (isPromiseLike(value)) return value.then((resolved) => {
		if (resolved instanceof Response) mergeEventResponseHeaders(resolved, event);
		return resolved;
	});
	if (value instanceof Response) mergeEventResponseHeaders(value, event);
	return value;
}
function requestHandler(handler) {
	return (request, requestOpts) => {
		let h3Event;
		try {
			h3Event = new H3Event(request);
		} catch (error) {
			if (error instanceof URIError) return new Response(null, {
				status: 400,
				statusText: "Bad Request"
			});
			throw error;
		}
		return toResponse(attachResponseHeaders(eventStorage.run({ h3Event }, () => handler(request, requestOpts)), h3Event), h3Event);
	};
}
function getH3Event() {
	const event = eventStorage.getStore();
	if (!event) throw new Error(`No StartEvent found in AsyncLocalStorage. Make sure you are using the function within the server runtime.`);
	return event.h3Event;
}
function getResponse() {
	return getH3Event().res;
}
var HEADERS = { TSS_SHELL: "X-TSS_SHELL" };
/** Determine if a value is a TanStack Router not-found error. */
function isNotFound(obj) {
	return obj?.isNotFound === true;
}
/** Stable identifier used for the root route in a route tree. */
var rootRouteId = "__root__";
/** Check whether a value is a TanStack Router redirect Response. */
/** Check whether a value is a TanStack Router redirect Response. */
function isRedirect(obj) {
	return obj instanceof Response && !!obj.options;
}
/** True if value is a redirect with a resolved `href` location. */
/** True if value is a redirect with a resolved `href` location. */
function isResolvedRedirect(obj) {
	return isRedirect(obj) && !!obj.options.href;
}
function dehydrateSsrMatchId(id) {
	return id.replaceAll("~", "~~").replaceAll("\0", "~0").replaceAll("�", "~r").replaceAll("/", "\0");
}
function createLRUCache(max) {
	const cache = /* @__PURE__ */ new Map();
	let oldest;
	let newest;
	const touch = (entry) => {
		if (!entry.next) return;
		if (!entry.prev) {
			entry.next.prev = void 0;
			oldest = entry.next;
			entry.next = void 0;
			if (newest) {
				entry.prev = newest;
				newest.next = entry;
			}
		} else {
			entry.prev.next = entry.next;
			entry.next.prev = entry.prev;
			entry.next = void 0;
			if (newest) {
				newest.next = entry;
				entry.prev = newest;
			}
		}
		newest = entry;
	};
	return {
		get(key) {
			const entry = cache.get(key);
			if (!entry) return void 0;
			touch(entry);
			return entry.value;
		},
		set(key, value) {
			if (cache.size >= max && oldest) {
				const toDelete = oldest;
				cache.delete(toDelete.key);
				if (toDelete.next) {
					oldest = toDelete.next;
					toDelete.next.prev = void 0;
				}
				if (toDelete === newest) newest = void 0;
			}
			const existing = cache.get(key);
			if (existing) {
				existing.value = value;
				touch(existing);
			} else {
				const entry = {
					key,
					value,
					prev: newest
				};
				if (newest) newest.next = entry;
				newest = entry;
				if (!oldest) oldest = entry;
				cache.set(key, entry);
			}
		},
		clear() {
			cache.clear();
			oldest = void 0;
			newest = void 0;
		}
	};
}
function invariant() {
	throw new Error("Invariant failed");
}
/** Execute a location input rewrite if provided. */
function executeRewriteInput(rewrite, url) {
	const res = rewrite?.input?.({ url });
	if (res) {
		if (typeof res === "string") return new URL(res);
		else if (res instanceof URL) return res;
	}
	return url;
}
var stateIndexKey = "__TSR_index";
function createHistory(opts) {
	let location = opts.getLocation();
	const subscribers = /* @__PURE__ */ new Set();
	const notify = (action) => {
		location = opts.getLocation();
		subscribers.forEach((subscriber) => subscriber({
			location,
			action
		}));
	};
	const handleIndexChange = (action) => {
		if (opts.notifyOnIndexChange ?? true) notify(action);
		else location = opts.getLocation();
	};
	const tryNavigation = async ({ task, navigateOpts, ...actionInfo }) => {
		if (navigateOpts?.ignoreBlocker ?? false) {
			task();
			return;
		}
		const blockers = opts.getBlockers?.() ?? [];
		const isPushOrReplace = actionInfo.type === "PUSH" || actionInfo.type === "REPLACE";
		if (typeof document !== "undefined" && blockers.length && isPushOrReplace) for (const blocker of blockers) {
			const nextLocation = parseHref(actionInfo.path, actionInfo.state);
			if (await blocker.blockerFn({
				currentLocation: location,
				nextLocation,
				action: actionInfo.type
			})) {
				opts.onBlocked?.();
				return;
			}
		}
		task();
	};
	return {
		get location() {
			return location;
		},
		get length() {
			return opts.getLength();
		},
		subscribers,
		subscribe: (cb) => {
			subscribers.add(cb);
			return () => {
				subscribers.delete(cb);
			};
		},
		push: (path, state, navigateOpts) => {
			const currentIndex = location.state[stateIndexKey];
			state = assignKeyAndIndex(currentIndex + 1, state);
			tryNavigation({
				task: () => {
					opts.pushState(path, state);
					notify({ type: "PUSH" });
				},
				navigateOpts,
				type: "PUSH",
				path,
				state
			});
		},
		replace: (path, state, navigateOpts) => {
			const currentIndex = location.state[stateIndexKey];
			state = assignKeyAndIndex(currentIndex, state);
			tryNavigation({
				task: () => {
					opts.replaceState(path, state);
					notify({ type: "REPLACE" });
				},
				navigateOpts,
				type: "REPLACE",
				path,
				state
			});
		},
		go: (index, navigateOpts) => {
			tryNavigation({
				task: () => {
					opts.go(index);
					handleIndexChange({
						type: "GO",
						index
					});
				},
				navigateOpts,
				type: "GO"
			});
		},
		back: (navigateOpts) => {
			tryNavigation({
				task: () => {
					opts.back(navigateOpts?.ignoreBlocker ?? false);
					handleIndexChange({ type: "BACK" });
				},
				navigateOpts,
				type: "BACK"
			});
		},
		forward: (navigateOpts) => {
			tryNavigation({
				task: () => {
					opts.forward(navigateOpts?.ignoreBlocker ?? false);
					handleIndexChange({ type: "FORWARD" });
				},
				navigateOpts,
				type: "FORWARD"
			});
		},
		canGoBack: () => location.state[stateIndexKey] !== 0,
		createHref: (str) => opts.createHref(str),
		block: (blocker) => {
			if (!opts.setBlockers) return () => {};
			const blockers = opts.getBlockers?.() ?? [];
			opts.setBlockers([...blockers, blocker]);
			return () => {
				const blockers = opts.getBlockers?.() ?? [];
				opts.setBlockers?.(blockers.filter((b) => b !== blocker));
			};
		},
		flush: () => opts.flush?.(),
		destroy: () => opts.destroy?.(),
		notify
	};
}
function assignKeyAndIndex(index, state) {
	if (!state) state = {};
	const key = createRandomKey();
	return {
		...state,
		key,
		__TSR_key: key,
		[stateIndexKey]: index
	};
}
/**
* Create an in-memory history implementation.
* Ideal for server rendering, tests, and non-DOM environments.
* @link https://tanstack.com/router/latest/docs/framework/react/guide/history-types
*/
function createMemoryHistory(opts = { initialEntries: ["/"] }) {
	const entries = opts.initialEntries;
	let index = opts.initialIndex ? Math.min(Math.max(opts.initialIndex, 0), entries.length - 1) : entries.length - 1;
	const states = entries.map((_entry, index) => assignKeyAndIndex(index, void 0));
	const getLocation = () => parseHref(entries[index], states[index]);
	let blockers = [];
	const _getBlockers = () => blockers;
	const _setBlockers = (newBlockers) => blockers = newBlockers;
	return createHistory({
		getLocation,
		getLength: () => entries.length,
		pushState: (path, state) => {
			if (index < entries.length - 1) {
				entries.splice(index + 1);
				states.splice(index + 1);
			}
			states.push(state);
			entries.push(path);
			index = Math.max(entries.length - 1, 0);
		},
		replaceState: (path, state) => {
			states[index] = state;
			entries[index] = path;
		},
		back: () => {
			index = Math.max(index - 1, 0);
		},
		forward: () => {
			index = Math.min(index + 1, entries.length - 1);
		},
		go: (n) => {
			index = Math.min(Math.max(index + n, 0), entries.length - 1);
		},
		createHref: (path) => path,
		getBlockers: _getBlockers,
		setBlockers: _setBlockers
	});
}
/**
* Sanitize a path to prevent open redirect vulnerabilities.
* Removes control characters and collapses leading double slashes.
*/
function sanitizePath(path) {
	let sanitized = path.replace(/[\x00-\x1f\x7f]/g, "");
	if (sanitized.startsWith("//")) sanitized = "/" + sanitized.replace(/^\/+/, "");
	return sanitized;
}
function parseHref(href, state) {
	const sanitizedHref = sanitizePath(href);
	const hashIndex = sanitizedHref.indexOf("#");
	const searchIndex = sanitizedHref.indexOf("?");
	const addedKey = createRandomKey();
	return {
		href: sanitizedHref,
		pathname: sanitizedHref.substring(0, hashIndex > 0 ? searchIndex > 0 ? Math.min(hashIndex, searchIndex) : hashIndex : searchIndex > 0 ? searchIndex : sanitizedHref.length),
		hash: hashIndex > -1 ? sanitizedHref.substring(hashIndex) : "",
		search: searchIndex > -1 ? sanitizedHref.slice(searchIndex, hashIndex === -1 ? void 0 : hashIndex) : "",
		state: state || {
			[stateIndexKey]: 0,
			key: addedKey,
			__TSR_key: addedKey
		}
	};
}
function createRandomKey() {
	return (Math.random() + 1).toString(36).substring(7);
}
/** Return the structural lane through the first terminal render boundary. */
function _getRenderedMatches(matches) {
	const end = matches.findIndex((match) => match.status !== "success" || match._notFound) + 1;
	return end && end < matches.length ? matches.slice(0, end) : matches;
}
/**
* Re-encode characters that are unsafe in URL paths.
* Includes ASCII control characters (0x00-0x1F, 0x7F) and a subset of the
* WHATWG URL "path percent-encode set" (", <, >, `, {, }).
*
* Space (0x20) is intentionally excluded — decodeURI decodes %20 to space
* and the router stores decoded spaces in location.pathname. The existing
* encodePathLikeUrl already handles re-encoding spaces for outgoing URLs.
*
* These characters are decoded by decodeURI but must remain percent-encoded
* in paths to match how upstream layers (CDNs, edge middleware, browsers)
* interpret the URL, preventing infinite redirect loops and path mismatches.
*/
var PATH_UNSAFE_RE = /[\x00-\x1f\x7f"<>`{}]/g;
function sanitizePathSegment(segment) {
	return segment.replace(PATH_UNSAFE_RE, (ch) => "%" + ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"));
}
function decodeSegment(segment) {
	let decoded;
	try {
		decoded = decodeURI(segment);
	} catch {
		decoded = segment.replaceAll(/%[0-9A-F]{2}/gi, (match) => {
			try {
				return decodeURI(match);
			} catch {
				return match;
			}
		});
	}
	return sanitizePathSegment(decoded);
}
function decodePath(path) {
	if (!path) return {
		path,
		handledProtocolRelativeURL: false
	};
	if (!/[%\\\x00-\x1f\x7f]/.test(path) && !path.startsWith("//")) return {
		path,
		handledProtocolRelativeURL: false
	};
	const re = /%25|%5C/gi;
	let cursor = 0;
	let result = "";
	let match;
	while (null !== (match = re.exec(path))) {
		result += decodeSegment(path.slice(cursor, match.index)) + match[0];
		cursor = re.lastIndex;
	}
	result = result + decodeSegment(cursor ? path.slice(cursor) : path);
	let handledProtocolRelativeURL = false;
	if (result.startsWith("//")) {
		handledProtocolRelativeURL = true;
		result = "/" + result.replace(/^\/+/, "");
	}
	return {
		path: result,
		handledProtocolRelativeURL
	};
}
function getAssetCrossOrigin(assetCrossOrigin, kind) {
	if (!assetCrossOrigin) return;
	if (typeof assetCrossOrigin === "string") return assetCrossOrigin;
	return assetCrossOrigin[kind];
}
function getManifestScriptFormat(manifest) {
	return manifest?.scriptFormat ?? "module";
}
function getScriptPreloadAttrs(manifest, link, assetCrossOrigin) {
	const preloadLink = resolveManifestAssetLink(link);
	const crossOrigin = getAssetCrossOrigin(assetCrossOrigin, "script") ?? preloadLink.crossOrigin;
	return {
		...getManifestScriptFormat(manifest) === "iife" ? {
			rel: "preload",
			as: "script"
		} : { rel: "modulepreload" },
		href: preloadLink.href,
		...crossOrigin ? { crossOrigin } : {}
	};
}
function resolveManifestAssetLink(link) {
	if (typeof link === "string") return {
		href: link,
		crossOrigin: void 0
	};
	return link;
}
function getStylesheetHref(asset) {
	return resolveManifestCssLink(asset).href;
}
function resolveManifestCssLink(link) {
	if (typeof link === "string") return {
		href: link,
		crossOrigin: void 0
	};
	return link;
}
function createInlineCssStyleAsset(css) {
	return {
		attrs: { suppressHydrationWarning: true },
		children: css
	};
}
function createInlineCssPlaceholderAsset() {
	return { attrs: { suppressHydrationWarning: true } };
}
var GLOBAL_TSR = "$_TSR";
var TSR_SCRIPT_BARRIER_ID = "$tsr-stream-barrier";
var SYM_ASYNC_ITERATOR = Symbol.asyncIterator;
var SYM_HAS_INSTANCE = Symbol.hasInstance;
var SYM_IS_CONCAT_SPREADABLE = Symbol.isConcatSpreadable;
var SYM_ITERATOR = Symbol.iterator;
var SYM_MATCH = Symbol.match;
var SYM_MATCH_ALL = Symbol.matchAll;
var SYM_REPLACE = Symbol.replace;
var SYM_SEARCH = Symbol.search;
var SYM_SPECIES = Symbol.species;
var SYM_SPLIT = Symbol.split;
var SYM_TO_PRIMITIVE = Symbol.toPrimitive;
var SYM_TO_STRING_TAG = Symbol.toStringTag;
var SYM_UNSCOPABLES = Symbol.unscopables;
var SYMBOL_STRING = {
	[0]: "Symbol.asyncIterator",
	[1]: "Symbol.hasInstance",
	[2]: "Symbol.isConcatSpreadable",
	[3]: "Symbol.iterator",
	[4]: "Symbol.match",
	[5]: "Symbol.matchAll",
	[6]: "Symbol.replace",
	[7]: "Symbol.search",
	[8]: "Symbol.species",
	[9]: "Symbol.split",
	[10]: "Symbol.toPrimitive",
	[11]: "Symbol.toStringTag",
	[12]: "Symbol.unscopables"
};
var INV_SYMBOL_REF = {
	[SYM_ASYNC_ITERATOR]: 0,
	[SYM_HAS_INSTANCE]: 1,
	[SYM_IS_CONCAT_SPREADABLE]: 2,
	[SYM_ITERATOR]: 3,
	[SYM_MATCH]: 4,
	[SYM_MATCH_ALL]: 5,
	[SYM_REPLACE]: 6,
	[SYM_SEARCH]: 7,
	[SYM_SPECIES]: 8,
	[SYM_SPLIT]: 9,
	[SYM_TO_PRIMITIVE]: 10,
	[SYM_TO_STRING_TAG]: 11,
	[SYM_UNSCOPABLES]: 12
};
var SYMBOL_REF = {
	[0]: SYM_ASYNC_ITERATOR,
	[1]: SYM_HAS_INSTANCE,
	[2]: SYM_IS_CONCAT_SPREADABLE,
	[3]: SYM_ITERATOR,
	[4]: SYM_MATCH,
	[5]: SYM_MATCH_ALL,
	[6]: SYM_REPLACE,
	[7]: SYM_SEARCH,
	[8]: SYM_SPECIES,
	[9]: SYM_SPLIT,
	[10]: SYM_TO_PRIMITIVE,
	[11]: SYM_TO_STRING_TAG,
	[12]: SYM_UNSCOPABLES
};
var CONSTANT_STRING = {
	[2]: "!0",
	[3]: "!1",
	[1]: "void 0",
	[0]: "null",
	[4]: "-0",
	[5]: "1/0",
	[6]: "-1/0",
	[7]: "0/0"
};
var CONSTANT_VAL = {
	[2]: true,
	[3]: false,
	[1]: void 0,
	[0]: null,
	[4]: -0,
	[5]: Number.POSITIVE_INFINITY,
	[6]: Number.NEGATIVE_INFINITY,
	[7]: NaN
};
var ERROR_CONSTRUCTOR_STRING = {
	[0]: "Error",
	[1]: "EvalError",
	[2]: "RangeError",
	[3]: "ReferenceError",
	[4]: "SyntaxError",
	[5]: "TypeError",
	[6]: "URIError"
};
var ERROR_CONSTRUCTOR = {
	[0]: Error,
	[1]: EvalError,
	[2]: RangeError,
	[3]: ReferenceError,
	[4]: SyntaxError,
	[5]: TypeError,
	[6]: URIError
};
function createSerovalNode(t, i, s, c, m, p, e, a, f, b, o, l) {
	return {
		t,
		i,
		s,
		c,
		m,
		p,
		e,
		a,
		f,
		b,
		o,
		l
	};
}
function createConstantNode(value) {
	return createSerovalNode(2, void 0, value, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
var TRUE_NODE = /* @__PURE__ */ createConstantNode(2);
var FALSE_NODE = /* @__PURE__ */ createConstantNode(3);
var UNDEFINED_NODE = /* @__PURE__ */ createConstantNode(1);
var NULL_NODE = /* @__PURE__ */ createConstantNode(0);
var NEG_ZERO_NODE = /* @__PURE__ */ createConstantNode(4);
var INFINITY_NODE = /* @__PURE__ */ createConstantNode(5);
var NEG_INFINITY_NODE = /* @__PURE__ */ createConstantNode(6);
var NAN_NODE = /* @__PURE__ */ createConstantNode(7);
function serializeChar(str) {
	switch (str) {
		case "\"": return "\\\"";
		case "\\": return "\\\\";
		case "\n": return "\\n";
		case "\r": return "\\r";
		case "\b": return "\\b";
		case "	": return "\\t";
		case "\f": return "\\f";
		case "<": return "\\x3C";
		case "\u2028": return "\\u2028";
		case "\u2029": return "\\u2029";
		default: return;
	}
}
function serializeString(str) {
	let result = "";
	let lastPos = 0;
	let replacement;
	for (let i = 0, len = str.length; i < len; i++) {
		replacement = serializeChar(str[i]);
		if (replacement) {
			result += str.slice(lastPos, i) + replacement;
			lastPos = i + 1;
		}
	}
	if (lastPos === 0) result = str;
	else result += str.slice(lastPos);
	return result;
}
function deserializeReplacer(str) {
	switch (str) {
		case "\\\\": return "\\";
		case "\\\"": return "\"";
		case "\\n": return "\n";
		case "\\r": return "\r";
		case "\\b": return "\b";
		case "\\t": return "	";
		case "\\f": return "\f";
		case "\\x3C": return "<";
		case "\\u2028": return "\u2028";
		case "\\u2029": return "\u2029";
		default: return str;
	}
}
function deserializeString(str) {
	return str.replace(/(\\\\|\\"|\\n|\\r|\\b|\\t|\\f|\\u2028|\\u2029|\\x3C)/g, deserializeReplacer);
}
var { toString: objectToString } = Object.prototype;
var STEP_ERROR_CODES = {
	parsing: 1,
	serialization: 2,
	deserialization: 3
};
function getErrorMessageProd(type) {
	return `Seroval Error (step: ${STEP_ERROR_CODES[type]})`;
}
var getErrorMessage = (type, cause) => getErrorMessageProd(type);
var SerovalError = class extends Error {
	constructor(type, cause) {
		super(getErrorMessage(type, cause));
		this.cause = cause;
	}
};
var SerovalParserError = class extends SerovalError {
	constructor(cause) {
		super("parsing", cause);
	}
};
var SerovalDeserializationError = class extends SerovalError {
	constructor(cause) {
		super("deserialization", cause);
	}
};
function getSpecificErrorMessage(code) {
	return `Seroval Error (specific: ${code})`;
}
var SerovalUnsupportedTypeError = class extends Error {
	constructor(value) {
		super(getSpecificErrorMessage(1));
		this.value = value;
	}
};
var SerovalUnsupportedNodeError = class extends Error {
	constructor(node) {
		super(getSpecificErrorMessage(2));
	}
};
var SerovalMissingPluginError = class extends Error {
	constructor(tag) {
		super(getSpecificErrorMessage(3));
	}
};
var SerovalMissingInstanceError = class extends Error {
	constructor(tag) {
		super(getSpecificErrorMessage(4));
	}
};
var SerovalMissingReferenceError = class extends Error {
	constructor(value) {
		super(getSpecificErrorMessage(5));
		this.value = value;
	}
};
var SerovalMissingReferenceForIdError = class extends Error {
	constructor(id) {
		super(getSpecificErrorMessage(6));
	}
};
var SerovalUnknownTypedArrayError = class extends Error {
	constructor(name) {
		super(getSpecificErrorMessage(7));
	}
};
var SerovalMalformedNodeError = class extends Error {
	constructor(node) {
		super(getSpecificErrorMessage(8));
	}
};
var SerovalDepthLimitError = class extends Error {
	constructor(limit) {
		super(getSpecificErrorMessage(9));
	}
};
var REFERENCES_KEY = "__SEROVAL_REFS__";
var GLOBAL_CONTEXT_R = `self.\$R`;
function getCrossReferenceHeader(id) {
	if (id == null) return `${GLOBAL_CONTEXT_R}=${GLOBAL_CONTEXT_R}||[]`;
	return `(${GLOBAL_CONTEXT_R}=${GLOBAL_CONTEXT_R}||{})["${serializeString(id)}"]=[]`;
}
var REFERENCE = /* @__PURE__ */ new Map();
var INV_REFERENCE = /* @__PURE__ */ new Map();
function hasReferenceID(value) {
	return REFERENCE.has(value);
}
function hasReference(id) {
	return INV_REFERENCE.has(id);
}
function getReferenceID(value) {
	if (hasReferenceID(value)) return REFERENCE.get(value);
	throw new SerovalMissingReferenceError(value);
}
function getReference(id) {
	if (hasReference(id)) return INV_REFERENCE.get(id);
	throw new SerovalMissingReferenceForIdError(id);
}
if (typeof globalThis !== "undefined") Object.defineProperty(globalThis, REFERENCES_KEY, {
	value: INV_REFERENCE,
	configurable: true,
	writable: false,
	enumerable: false
});
else if (typeof window !== "undefined") Object.defineProperty(window, REFERENCES_KEY, {
	value: INV_REFERENCE,
	configurable: true,
	writable: false,
	enumerable: false
});
else if (typeof self !== "undefined") Object.defineProperty(self, REFERENCES_KEY, {
	value: INV_REFERENCE,
	configurable: true,
	writable: false,
	enumerable: false
});
else if (typeof global !== "undefined") Object.defineProperty(global, REFERENCES_KEY, {
	value: INV_REFERENCE,
	configurable: true,
	writable: false,
	enumerable: false
});
function getErrorConstructor(error) {
	if (error instanceof EvalError) return 1;
	if (error instanceof RangeError) return 2;
	if (error instanceof ReferenceError) return 3;
	if (error instanceof SyntaxError) return 4;
	if (error instanceof TypeError) return 5;
	if (error instanceof URIError) return 6;
	return 0;
}
function getInitialErrorOptions(error) {
	const construct = ERROR_CONSTRUCTOR_STRING[getErrorConstructor(error)];
	if (error.name !== construct) return { name: error.name };
	if (error.constructor.name !== construct) return { name: error.constructor.name };
	return {};
}
function getErrorOptions(error, features) {
	let options = getInitialErrorOptions(error);
	const names = Object.getOwnPropertyNames(error);
	for (let i = 0, len = names.length, name; i < len; i++) {
		name = names[i];
		if (name !== "name" && name !== "message") {
			if (name === "stack") {
				if (features & 4) {
					options = options || {};
					options[name] = error[name];
				}
			} else {
				options = options || {};
				options[name] = error[name];
			}
		}
	}
	return options;
}
function getObjectFlag(obj) {
	if (Object.isFrozen(obj)) return 3;
	if (Object.isSealed(obj)) return 2;
	if (Object.isExtensible(obj)) return 0;
	return 1;
}
function createNumberNode(value) {
	switch (value) {
		case Number.POSITIVE_INFINITY: return INFINITY_NODE;
		case Number.NEGATIVE_INFINITY: return NEG_INFINITY_NODE;
	}
	if (value !== value) return NAN_NODE;
	if (Object.is(value, -0)) return NEG_ZERO_NODE;
	return createSerovalNode(0, void 0, value, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createStringNode(value) {
	return createSerovalNode(1, void 0, serializeString(value), void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createBigIntNode(current) {
	return createSerovalNode(3, void 0, "" + current, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createIndexedValueNode(id) {
	return createSerovalNode(4, id, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createDateNode(id, current) {
	const timestamp = current.valueOf();
	return createSerovalNode(5, id, timestamp !== timestamp ? "" : current.toISOString(), void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createTemporalNode(id, type, current) {
	return createSerovalNode(36, id, current.toString(), type, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createRegExpNode(id, current) {
	return createSerovalNode(6, id, void 0, serializeString(current.source), current.flags, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createWKSymbolNode(id, current) {
	return createSerovalNode(17, id, INV_SYMBOL_REF[current], void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createReferenceNode(id, ref) {
	return createSerovalNode(18, id, serializeString(getReferenceID(ref)), void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createPluginNode(id, tag, value) {
	return createSerovalNode(25, id, value, serializeString(tag), void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createArrayNode(id, current, parsedItems) {
	return createSerovalNode(9, id, void 0, void 0, void 0, void 0, void 0, parsedItems, void 0, void 0, getObjectFlag(current), void 0);
}
function createBoxedNode(id, boxed) {
	return createSerovalNode(21, id, void 0, void 0, void 0, void 0, void 0, void 0, boxed, void 0, void 0, void 0);
}
var MAX_TYPED_ARRAY_LENGTH = 1e6;
function createTypedArrayNode(id, current, buffer) {
	if (current.length > MAX_TYPED_ARRAY_LENGTH) throw new SerovalUnsupportedTypeError(current);
	return createSerovalNode(15, id, void 0, current.constructor.name, void 0, void 0, void 0, void 0, buffer, current.byteOffset, void 0, current.length);
}
function createBigIntTypedArrayNode(id, current, buffer) {
	if (current.length > MAX_TYPED_ARRAY_LENGTH) throw new SerovalUnsupportedTypeError(current);
	return createSerovalNode(16, id, void 0, current.constructor.name, void 0, void 0, void 0, void 0, buffer, current.byteOffset, void 0, current.length);
}
function createDataViewNode(id, current, buffer) {
	if (current.byteLength > MAX_TYPED_ARRAY_LENGTH) throw new SerovalUnsupportedTypeError(current);
	return createSerovalNode(20, id, void 0, void 0, void 0, void 0, void 0, void 0, buffer, current.byteOffset, void 0, current.byteLength);
}
function createErrorNode(id, current, options) {
	return createSerovalNode(13, id, getErrorConstructor(current), void 0, serializeString(current.message), options, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createAggregateErrorNode(id, current, options) {
	return createSerovalNode(14, id, getErrorConstructor(current), void 0, serializeString(current.message), options, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createSetNode(id, items) {
	return createSerovalNode(7, id, void 0, void 0, void 0, void 0, void 0, items, void 0, void 0, void 0, void 0);
}
function createIteratorFactoryInstanceNode(factory, items) {
	return createSerovalNode(28, void 0, void 0, void 0, void 0, void 0, void 0, [factory, items], void 0, void 0, void 0, void 0);
}
function createAsyncIteratorFactoryInstanceNode(factory, items) {
	return createSerovalNode(30, void 0, void 0, void 0, void 0, void 0, void 0, [factory, items], void 0, void 0, void 0, void 0);
}
function createStreamConstructorNode(id, factory, sequence) {
	return createSerovalNode(31, id, void 0, void 0, void 0, void 0, void 0, sequence, factory, void 0, void 0, void 0);
}
function createStreamNextNode(id, parsed) {
	return createSerovalNode(32, id, void 0, void 0, void 0, void 0, void 0, void 0, parsed, void 0, void 0, void 0);
}
function createStreamThrowNode(id, parsed) {
	return createSerovalNode(33, id, void 0, void 0, void 0, void 0, void 0, void 0, parsed, void 0, void 0, void 0);
}
function createStreamReturnNode(id, parsed) {
	return createSerovalNode(34, id, void 0, void 0, void 0, void 0, void 0, void 0, parsed, void 0, void 0, void 0);
}
function createSequenceNode(id, sequence, throwAt, doneAt) {
	return createSerovalNode(35, id, throwAt, void 0, void 0, void 0, void 0, sequence, void 0, void 0, void 0, doneAt);
}
/**
* An opaque reference allows hiding values from the serializer.
*/
var OpaqueReference = class {
	constructor(value, replacement) {
		this.value = value;
		this.replacement = replacement;
	}
};
var PROMISE_CONSTRUCTOR = () => {
	const resolver = {
		p: 0,
		s: 0,
		f: 0
	};
	resolver.p = new Promise((resolve, reject) => {
		resolver.s = resolve;
		resolver.f = reject;
	});
	return resolver;
};
var PROMISE_SUCCESS = (resolver, data) => {
	resolver.s(data);
	resolver.p.s = 1;
	resolver.p.v = data;
};
var PROMISE_FAILURE = (resolver, data) => {
	resolver.f(data);
	resolver.p.s = 2;
	resolver.p.v = data;
};
var SERIALIZED_PROMISE_CONSTRUCTOR = /* @__PURE__ */ PROMISE_CONSTRUCTOR.toString();
var SERIALIZED_PROMISE_SUCCESS = /* @__PURE__ */ PROMISE_SUCCESS.toString();
var SERIALIZED_PROMISE_FAILURE = /* @__PURE__ */ PROMISE_FAILURE.toString();
var STREAM_CONSTRUCTOR = () => {
	const buffer = [];
	const listeners = [];
	let alive = true;
	let success = false;
	let count = 0;
	const internal = {
		flush(value, mode, x) {
			for (x = 0; x < count; x++) if (listeners[x]) listeners[x][mode](value);
		},
		up(listener, x, z, current) {
			for (x = 0, z = buffer.length; x < z; x++) {
				current = buffer[x];
				if (!alive && x === z - 1) listener[success ? "return" : "throw"](current);
				else listener.next(current);
			}
		},
		on(listener, temp) {
			if (alive) {
				temp = count++;
				listeners[temp] = listener;
			}
			internal.up(listener);
			return () => {
				if (alive) {
					listeners[temp] = listeners[count];
					listeners[count--] = void 0;
				}
			};
		}
	};
	return {
		__SEROVAL_STREAM__: true,
		on(listener) {
			return internal.on(listener);
		},
		next(value) {
			if (alive) {
				buffer.push(value);
				internal.flush(value, "next");
			}
		},
		throw(value) {
			if (alive) {
				buffer.push(value);
				internal.flush(value, "throw");
				alive = false;
				success = false;
				listeners.length = 0;
			}
		},
		return(value) {
			if (alive) {
				buffer.push(value);
				internal.flush(value, "return");
				alive = false;
				success = true;
				listeners.length = 0;
			}
		}
	};
};
var SERIALIZED_STREAM_CONSTRUCTOR = /* @__PURE__ */ STREAM_CONSTRUCTOR.toString();
var ITERATOR_CONSTRUCTOR = (symbol) => (sequence) => () => {
	let index = 0;
	const instance = {
		[symbol]() {
			return instance;
		},
		next() {
			if (index > sequence.d) return {
				done: true,
				value: void 0
			};
			const currentIndex = index++;
			const data = sequence.v[currentIndex];
			if (currentIndex === sequence.t) throw data;
			return {
				done: currentIndex === sequence.d,
				value: data
			};
		}
	};
	return instance;
};
var SERIALIZED_ITERATOR_CONSTRUCTOR = /* @__PURE__ */ ITERATOR_CONSTRUCTOR.toString();
var ASYNC_ITERATOR_CONSTRUCTOR = (symbol, createPromise) => (stream) => () => {
	let count = 0;
	let doneAt = -1;
	let isThrow = false;
	const buffer = [];
	const pending = [];
	const internal = { finalize(i = 0, len = pending.length) {
		for (; i < len; i++) pending[i].s({
			done: true,
			value: void 0
		});
	} };
	stream.on({
		next(value) {
			const temp = pending.shift();
			if (temp) temp.s({
				done: false,
				value
			});
			buffer.push(value);
		},
		throw(value) {
			const temp = pending.shift();
			if (temp) temp.f(value);
			internal.finalize();
			doneAt = buffer.length;
			isThrow = true;
			buffer.push(value);
		},
		return(value) {
			const temp = pending.shift();
			if (temp) temp.s({
				done: true,
				value
			});
			internal.finalize();
			doneAt = buffer.length;
			buffer.push(value);
		}
	});
	const instance = {
		[symbol]() {
			return instance;
		},
		next() {
			if (doneAt === -1) {
				const index = count++;
				if (index >= buffer.length) {
					const temp = createPromise();
					pending.push(temp);
					return temp.p;
				}
				return {
					done: false,
					value: buffer[index]
				};
			}
			if (count > doneAt) return {
				done: true,
				value: void 0
			};
			const index = count++;
			const value = buffer[index];
			if (index !== doneAt) return {
				done: false,
				value
			};
			if (isThrow) throw value;
			return {
				done: true,
				value
			};
		}
	};
	return instance;
};
var SERIALIZED_ASYNC_ITERATOR_CONSTRUCTOR = /* @__PURE__ */ ASYNC_ITERATOR_CONSTRUCTOR.toString();
var ARRAY_BUFFER_CONSTRUCTOR = (b64) => {
	const decoded = atob(b64);
	const length = decoded.length;
	const arr = new Uint8Array(length);
	for (let i = 0; i < length; i++) arr[i] = decoded.charCodeAt(i);
	return arr.buffer;
};
var SERIALIZED_ARRAY_BUFFER_CONSTRUCTOR = /* @__PURE__ */ ARRAY_BUFFER_CONSTRUCTOR.toString();
function isSequence(value) {
	return "__SEROVAL_SEQUENCE__" in value;
}
function createSequence(values, throwAt, doneAt) {
	return {
		__SEROVAL_SEQUENCE__: true,
		v: values,
		t: throwAt,
		d: doneAt
	};
}
function createSequenceFromIterable(source) {
	const values = [];
	let throwsAt = -1;
	let doneAt = -1;
	const iterator = source[SYM_ITERATOR]();
	while (true) try {
		const value = iterator.next();
		values.push(value.value);
		if (value.done) {
			doneAt = values.length - 1;
			break;
		}
	} catch (error) {
		throwsAt = values.length;
		values.push(error);
	}
	return createSequence(values, throwsAt, doneAt);
}
var createIterator = ITERATOR_CONSTRUCTOR(SYM_ITERATOR);
function sequenceToIterator(sequence) {
	return createIterator(sequence);
}
var ITERATOR = {};
var ASYNC_ITERATOR = {};
/**
* Placeholder references
*/
var SPECIAL_REFS = {
	[0]: {},
	[1]: {},
	[2]: {},
	[3]: {},
	[4]: {},
	[5]: {}
};
var SPECIAL_REF_STRING = {
	[0]: "[]",
	[1]: SERIALIZED_PROMISE_CONSTRUCTOR,
	[2]: SERIALIZED_PROMISE_SUCCESS,
	[3]: SERIALIZED_PROMISE_FAILURE,
	[4]: SERIALIZED_STREAM_CONSTRUCTOR,
	[5]: SERIALIZED_ARRAY_BUFFER_CONSTRUCTOR
};
function isStream(value) {
	return "__SEROVAL_STREAM__" in value;
}
function createStream$1() {
	return STREAM_CONSTRUCTOR();
}
function createStreamFromAsyncIterable(iterable) {
	const stream = createStream$1();
	const iterator = iterable[SYM_ASYNC_ITERATOR]();
	async function push() {
		try {
			const value = await iterator.next();
			if (value.done) stream.return(value.value);
			else {
				stream.next(value.value);
				await push();
			}
		} catch (error) {
			stream.throw(error);
		}
	}
	push().catch(() => {});
	return stream;
}
var createAsyncIterable = ASYNC_ITERATOR_CONSTRUCTOR(SYM_ASYNC_ITERATOR, PROMISE_CONSTRUCTOR);
function streamToAsyncIterable(stream) {
	return createAsyncIterable(stream);
}
async function promiseToResult(current) {
	try {
		return [1, await current];
	} catch (e) {
		return [0, e];
	}
}
function createBaseParserContext(mode, options) {
	return {
		plugins: options.plugins,
		mode,
		marked: /* @__PURE__ */ new Set(),
		features: 127 ^ (options.disabledFeatures || 0),
		refs: options.refs || /* @__PURE__ */ new Map(),
		depthLimit: options.depthLimit || 1e3
	};
}
/**
* Ensures that the value (based on an identifier) has been visited by the parser.
* @param ctx
* @param id
*/
function markParserRef(ctx, id) {
	ctx.marked.add(id);
}
/**
* Creates an identifier for a value
* @param ctx
* @param current
*/
function createIndexForValue(ctx, current) {
	const id = ctx.refs.size;
	ctx.refs.set(current, id);
	return id;
}
function getNodeForIndexedValue(ctx, current) {
	const registeredId = ctx.refs.get(current);
	if (registeredId != null) {
		markParserRef(ctx, registeredId);
		return {
			type: 1,
			value: createIndexedValueNode(registeredId)
		};
	}
	return {
		type: 0,
		value: createIndexForValue(ctx, current)
	};
}
function getReferenceNode(ctx, current) {
	const indexed = getNodeForIndexedValue(ctx, current);
	if (indexed.type === 1) return indexed;
	if (hasReferenceID(current)) return {
		type: 2,
		value: createReferenceNode(indexed.value, current)
	};
	return indexed;
}
/**
* Parsing methods
*/
function parseWellKnownSymbol(ctx, current) {
	const ref = getReferenceNode(ctx, current);
	if (ref.type !== 0) return ref.value;
	if (current in INV_SYMBOL_REF) return createWKSymbolNode(ref.value, current);
	throw new SerovalUnsupportedTypeError(current);
}
function parseSpecialReference(ctx, ref) {
	const result = getNodeForIndexedValue(ctx, SPECIAL_REFS[ref]);
	if (result.type === 1) return result.value;
	return createSerovalNode(26, result.value, ref, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function parseIteratorFactory(ctx) {
	const result = getNodeForIndexedValue(ctx, ITERATOR);
	if (result.type === 1) return result.value;
	return createSerovalNode(27, result.value, void 0, void 0, void 0, void 0, void 0, void 0, parseWellKnownSymbol(ctx, SYM_ITERATOR), void 0, void 0, void 0);
}
function parseAsyncIteratorFactory(ctx) {
	const result = getNodeForIndexedValue(ctx, ASYNC_ITERATOR);
	if (result.type === 1) return result.value;
	return createSerovalNode(29, result.value, void 0, void 0, void 0, void 0, void 0, [parseSpecialReference(ctx, 1), parseWellKnownSymbol(ctx, SYM_ASYNC_ITERATOR)], void 0, void 0, void 0, void 0);
}
function createObjectNode(id, current, empty, record) {
	return createSerovalNode(empty ? 11 : 10, id, void 0, void 0, void 0, record, void 0, void 0, void 0, void 0, getObjectFlag(current), void 0);
}
function createMapNode(ctx, id, k, v) {
	return createSerovalNode(8, id, void 0, void 0, void 0, void 0, {
		k,
		v
	}, void 0, parseSpecialReference(ctx, 0), void 0, void 0, void 0);
}
function createPromiseConstructorNode(ctx, id, resolver) {
	return createSerovalNode(22, id, resolver, void 0, void 0, void 0, void 0, void 0, parseSpecialReference(ctx, 1), void 0, void 0, void 0);
}
function createArrayBufferNode(ctx, id, current) {
	const bytes = new Uint8Array(current);
	let result = "";
	for (let i = 0, len = bytes.length; i < len; i++) result += String.fromCharCode(bytes[i]);
	return createSerovalNode(19, id, serializeString(btoa(result)), void 0, void 0, void 0, void 0, void 0, parseSpecialReference(ctx, 5), void 0, void 0, void 0);
}
function createAsyncParserContext(mode, options) {
	return {
		base: createBaseParserContext(mode, options),
		child: void 0
	};
}
var AsyncParsePluginContext = class {
	constructor(_p, depth) {
		this._p = _p;
		this.depth = depth;
	}
	parse(current) {
		return parseAsync(this._p, this.depth, current);
	}
};
async function parseItems$1(ctx, depth, current) {
	const nodes = [];
	for (let i = 0, len = current.length; i < len; i++) if (i in current) nodes[i] = await parseAsync(ctx, depth, current[i]);
	else nodes[i] = 0;
	return nodes;
}
async function parseArray$1(ctx, depth, id, current) {
	return createArrayNode(id, current, await parseItems$1(ctx, depth, current));
}
async function parseProperties$1(ctx, depth, properties) {
	const entries = Object.entries(properties);
	const keyNodes = [];
	const valueNodes = [];
	for (let i = 0, len = entries.length; i < len; i++) {
		keyNodes.push(serializeString(entries[i][0]));
		valueNodes.push(await parseAsync(ctx, depth, entries[i][1]));
	}
	if (SYM_ITERATOR in properties) {
		keyNodes.push(parseWellKnownSymbol(ctx.base, SYM_ITERATOR));
		valueNodes.push(createIteratorFactoryInstanceNode(parseIteratorFactory(ctx.base), await parseAsync(ctx, depth, createSequenceFromIterable(properties))));
	}
	if (SYM_ASYNC_ITERATOR in properties) {
		keyNodes.push(parseWellKnownSymbol(ctx.base, SYM_ASYNC_ITERATOR));
		valueNodes.push(createAsyncIteratorFactoryInstanceNode(parseAsyncIteratorFactory(ctx.base), await parseAsync(ctx, depth, createStreamFromAsyncIterable(properties))));
	}
	if (SYM_TO_STRING_TAG in properties) {
		keyNodes.push(parseWellKnownSymbol(ctx.base, SYM_TO_STRING_TAG));
		valueNodes.push(createStringNode(properties[SYM_TO_STRING_TAG]));
	}
	if (SYM_IS_CONCAT_SPREADABLE in properties) {
		keyNodes.push(parseWellKnownSymbol(ctx.base, SYM_IS_CONCAT_SPREADABLE));
		valueNodes.push(properties[SYM_IS_CONCAT_SPREADABLE] ? TRUE_NODE : FALSE_NODE);
	}
	return {
		k: keyNodes,
		v: valueNodes
	};
}
async function parsePlainObject$1(ctx, depth, id, current, empty) {
	return createObjectNode(id, current, empty, await parseProperties$1(ctx, depth, current));
}
async function parseBoxed$1(ctx, depth, id, current) {
	return createBoxedNode(id, await parseAsync(ctx, depth, current.valueOf()));
}
async function parseTypedArray$1(ctx, depth, id, current) {
	return createTypedArrayNode(id, current, await parseAsync(ctx, depth, current.buffer));
}
async function parseBigIntTypedArray$1(ctx, depth, id, current) {
	return createBigIntTypedArrayNode(id, current, await parseAsync(ctx, depth, current.buffer));
}
async function parseDataView$1(ctx, depth, id, current) {
	return createDataViewNode(id, current, await parseAsync(ctx, depth, current.buffer));
}
async function parseError$1(ctx, depth, id, current) {
	const options = getErrorOptions(current, ctx.base.features);
	return createErrorNode(id, current, options ? await parseProperties$1(ctx, depth, options) : void 0);
}
async function parseAggregateError$1(ctx, depth, id, current) {
	const options = getErrorOptions(current, ctx.base.features);
	return createAggregateErrorNode(id, current, options ? await parseProperties$1(ctx, depth, options) : void 0);
}
async function parseMap$1(ctx, depth, id, current) {
	const keyNodes = [];
	const valueNodes = [];
	for (const [key, value] of current.entries()) {
		keyNodes.push(await parseAsync(ctx, depth, key));
		valueNodes.push(await parseAsync(ctx, depth, value));
	}
	return createMapNode(ctx.base, id, keyNodes, valueNodes);
}
async function parseSet$1(ctx, depth, id, current) {
	const items = [];
	for (const item of current.keys()) items.push(await parseAsync(ctx, depth, item));
	return createSetNode(id, items);
}
async function parsePlugin$1(ctx, depth, id, current) {
	const currentPlugins = ctx.base.plugins;
	if (currentPlugins) for (let i = 0, len = currentPlugins.length; i < len; i++) {
		const plugin = currentPlugins[i];
		if (plugin.parse.async && plugin.test(current)) return createPluginNode(id, plugin.tag, await plugin.parse.async(current, new AsyncParsePluginContext(ctx, depth), { id }));
	}
}
async function parsePromise$1(ctx, depth, id, current) {
	const [status, result] = await promiseToResult(current);
	return createSerovalNode(12, id, status, void 0, void 0, void 0, void 0, void 0, await parseAsync(ctx, depth, result), void 0, void 0, void 0);
}
function parseStreamHandle(depth, id, current, resolve, reject) {
	const sequence = [];
	const cleanup = current.on({
		next: (value) => {
			markParserRef(this.base, id);
			parseAsync(this, depth, value).then((data) => {
				sequence.push(createStreamNextNode(id, data));
			}, (data) => {
				reject(data);
				cleanup();
			});
		},
		throw: (value) => {
			markParserRef(this.base, id);
			parseAsync(this, depth, value).then((data) => {
				sequence.push(createStreamThrowNode(id, data));
				resolve(sequence);
				cleanup();
			}, (data) => {
				reject(data);
				cleanup();
			});
		},
		return: (value) => {
			markParserRef(this.base, id);
			parseAsync(this, depth, value).then((data) => {
				sequence.push(createStreamReturnNode(id, data));
				resolve(sequence);
				cleanup();
			}, (data) => {
				reject(data);
				cleanup();
			});
		}
	});
}
async function parseStream$1(ctx, depth, id, current) {
	return createStreamConstructorNode(id, parseSpecialReference(ctx.base, 4), await new Promise(parseStreamHandle.bind(ctx, depth, id, current)));
}
async function parseSequence$1(ctx, depth, id, current) {
	const nodes = [];
	for (let i = 0, len = current.v.length; i < len; i++) nodes[i] = await parseAsync(ctx, depth, current.v[i]);
	return createSequenceNode(id, nodes, current.t, current.d);
}
async function parseObjectAsync(ctx, depth, id, current) {
	if (Array.isArray(current)) return parseArray$1(ctx, depth, id, current);
	if (isStream(current)) return parseStream$1(ctx, depth, id, current);
	if (isSequence(current)) return parseSequence$1(ctx, depth, id, current);
	let currentClass = current.constructor;
	if (currentClass !== void 0 && typeof currentClass !== "function") {
		const proto = Object.getPrototypeOf(current);
		currentClass = proto === null ? void 0 : proto.constructor;
	}
	if (currentClass === OpaqueReference) return parseAsync(ctx, depth, current.replacement);
	const parsed = await parsePlugin$1(ctx, depth, id, current);
	if (parsed) return parsed;
	switch (currentClass) {
		case Object: return parsePlainObject$1(ctx, depth, id, current, false);
		case void 0: return parsePlainObject$1(ctx, depth, id, current, true);
		case Date: return createDateNode(id, current);
		case Error:
		case EvalError:
		case RangeError:
		case ReferenceError:
		case SyntaxError:
		case TypeError:
		case URIError: return parseError$1(ctx, depth, id, current);
		case Number:
		case Boolean:
		case String:
		case BigInt: return parseBoxed$1(ctx, depth, id, current);
		case ArrayBuffer: return createArrayBufferNode(ctx.base, id, current);
		case Int8Array:
		case Int16Array:
		case Int32Array:
		case Uint8Array:
		case Uint16Array:
		case Uint32Array:
		case Uint8ClampedArray:
		case Float32Array:
		case Float64Array: return parseTypedArray$1(ctx, depth, id, current);
		case DataView: return parseDataView$1(ctx, depth, id, current);
		case Map: return parseMap$1(ctx, depth, id, current);
		case Set: return parseSet$1(ctx, depth, id, current);
	}
	if (currentClass === Promise || current instanceof Promise) return parsePromise$1(ctx, depth, id, current);
	const currentFeatures = ctx.base.features;
	if (currentFeatures & 32 && currentClass === RegExp) return createRegExpNode(id, current);
	if (currentFeatures & 16) switch (currentClass) {
		case BigInt64Array:
		case BigUint64Array: return parseBigIntTypedArray$1(ctx, depth, id, current);
	}
	if (currentFeatures & 1 && typeof AggregateError !== "undefined" && (currentClass === AggregateError || current instanceof AggregateError)) return parseAggregateError$1(ctx, depth, id, current);
	if (currentFeatures & 64 && typeof Temporal !== "undefined") switch (currentClass) {
		case Temporal.Instant: return createTemporalNode(id, 0, current);
		case Temporal.Duration: return createTemporalNode(id, 1, current);
		case Temporal.PlainDate: return createTemporalNode(id, 2, current);
		case Temporal.PlainDateTime: return createTemporalNode(id, 3, current);
		case Temporal.PlainMonthDay: return createTemporalNode(id, 4, current);
		case Temporal.PlainTime: return createTemporalNode(id, 5, current);
		case Temporal.PlainYearMonth: return createTemporalNode(id, 6, current);
		case Temporal.ZonedDateTime: return createTemporalNode(id, 7, current);
	}
	if (current instanceof Error) return parseError$1(ctx, depth, id, current);
	if (SYM_ITERATOR in current || SYM_ASYNC_ITERATOR in current) return parsePlainObject$1(ctx, depth, id, current, !!currentClass);
	throw new SerovalUnsupportedTypeError(current);
}
async function parseFunctionAsync(ctx, depth, current) {
	const ref = getReferenceNode(ctx.base, current);
	if (ref.type !== 0) return ref.value;
	const plugin = await parsePlugin$1(ctx, depth, ref.value, current);
	if (plugin) return plugin;
	throw new SerovalUnsupportedTypeError(current);
}
async function parseAsync(ctx, depth, current) {
	if (depth >= ctx.base.depthLimit) throw new SerovalDepthLimitError(ctx.base.depthLimit);
	switch (typeof current) {
		case "boolean": return current ? TRUE_NODE : FALSE_NODE;
		case "undefined": return UNDEFINED_NODE;
		case "string": return createStringNode(current);
		case "number": return createNumberNode(current);
		case "bigint": return createBigIntNode(current);
		case "object":
			if (current) {
				const ref = getReferenceNode(ctx.base, current);
				return ref.type === 0 ? await parseObjectAsync(ctx, depth + 1, ref.value, current) : ref.value;
			}
			return NULL_NODE;
		case "symbol": return parseWellKnownSymbol(ctx.base, current);
		case "function": return parseFunctionAsync(ctx, depth, current);
		default: throw new SerovalUnsupportedTypeError(current);
	}
}
async function parseTopAsync(ctx, current) {
	try {
		return await parseAsync(ctx, 0, current);
	} catch (error) {
		throw error instanceof SerovalParserError ? error : new SerovalParserError(error);
	}
}
function createPlugin(plugin) {
	return plugin;
}
function dedupePlugins(deduped, plugins) {
	for (let i = 0, len = plugins.length; i < len; i++) {
		const current = plugins[i];
		if (!deduped.has(current)) {
			deduped.add(current);
			if (current.extends) dedupePlugins(deduped, current.extends);
		}
	}
}
function resolvePlugins(plugins) {
	if (plugins) {
		const deduped = /* @__PURE__ */ new Set();
		dedupePlugins(deduped, plugins);
		return [...deduped];
	}
}
function getTypedArrayConstructor(name) {
	switch (name) {
		case "Int8Array": return Int8Array;
		case "Int16Array": return Int16Array;
		case "Int32Array": return Int32Array;
		case "Uint8Array": return Uint8Array;
		case "Uint16Array": return Uint16Array;
		case "Uint32Array": return Uint32Array;
		case "Uint8ClampedArray": return Uint8ClampedArray;
		case "Float32Array": return Float32Array;
		case "Float64Array": return Float64Array;
		case "BigInt64Array": return BigInt64Array;
		case "BigUint64Array": return BigUint64Array;
		default: throw new SerovalUnknownTypedArrayError(name);
	}
}
function isValidKey(key) {
	switch (key) {
		case "constructor":
		case "__proto__":
		case "prototype":
		case "__defineGetter__":
		case "__defineSetter__":
		case "__lookupGetter__":
		case "__lookupSetter__": return false;
		default: return true;
	}
}
function isValidSymbol(symbol) {
	switch (symbol) {
		case SYM_ASYNC_ITERATOR:
		case SYM_IS_CONCAT_SPREADABLE:
		case SYM_TO_STRING_TAG:
		case SYM_ITERATOR: return true;
		default: return false;
	}
}
var MAX_BASE64_LENGTH = 1e6;
var MAX_BIGINT_LENGTH = 1e4;
var MAX_REGEXP_SOURCE_LENGTH = 2e4;
function applyObjectFlag(obj, flag) {
	switch (flag) {
		case 3: return Object.freeze(obj);
		case 1: return Object.preventExtensions(obj);
		case 2: return Object.seal(obj);
		default: return obj;
	}
}
var DEFAULT_DEPTH_LIMIT = 1e3;
function createBaseDeserializerContext(mode, options) {
	var _options$features;
	const refs = options.refs || /* @__PURE__ */ new Map();
	if (!("types" in refs)) Object.assign(refs, { types: /* @__PURE__ */ new Map() });
	return {
		mode,
		plugins: options.plugins,
		refs,
		features: (_options$features = options.features) !== null && _options$features !== void 0 ? _options$features : 127 ^ (options.disabledFeatures || 0),
		depthLimit: options.depthLimit || DEFAULT_DEPTH_LIMIT
	};
}
function createVanillaDeserializerContext(options) {
	return {
		mode: 1,
		base: createBaseDeserializerContext(1, options),
		child: void 0,
		state: { marked: new Set(options.markedRefs) }
	};
}
var DeserializePluginContext = class {
	constructor(_p, depth) {
		this._p = _p;
		this.depth = depth;
	}
	deserialize(node) {
		return deserialize$1(this._p, this.depth, node);
	}
};
function guardIndexedValue(ctx, id) {
	if (id < 0 || !Number.isFinite(id) || !Number.isInteger(id)) throw new SerovalMalformedNodeError({
		t: 4,
		i: id
	});
	if (ctx.refs.has(id)) throw new Error("Conflicted ref id: " + id);
}
function isThennable(value) {
	return !!value && typeof value === "object" && "then" in value && typeof value.then === "function";
}
function assignIndexedValueVanilla(ctx, id, value) {
	guardIndexedValue(ctx.base, id);
	if (ctx.state.marked.has(id)) ctx.base.refs.set(id, value);
	return value;
}
function assignIndexedValueCross(ctx, id, value) {
	guardIndexedValue(ctx.base, id);
	ctx.base.refs.set(id, value);
	return value;
}
function assignIndexedValue$1(ctx, id, value) {
	return ctx.mode === 1 ? assignIndexedValueVanilla(ctx, id, value) : assignIndexedValueCross(ctx, id, value);
}
function deserializeKnownValue(node, record, key) {
	if (Object.hasOwn(record, key)) return record[key];
	throw new SerovalMalformedNodeError(node);
}
function deserializeReference(ctx, node) {
	return assignIndexedValue$1(ctx, node.i, getReference(deserializeString(node.s)));
}
function deserializeArray(ctx, depth, node) {
	const items = node.a;
	const len = items.length;
	const result = assignIndexedValue$1(ctx, node.i, new Array(len));
	for (let i = 0, item; i < len; i++) {
		item = items[i];
		if (item) result[i] = deserialize$1(ctx, depth, item);
	}
	applyObjectFlag(result, node.o);
	return result;
}
function assignStringProperty(object, key, value) {
	if (isValidKey(key)) object[key] = value;
	else Object.defineProperty(object, key, {
		value,
		configurable: true,
		enumerable: true,
		writable: true
	});
}
function assignProperty(ctx, depth, object, key, value) {
	if (typeof key === "string") assignStringProperty(object, deserializeString(key), deserialize$1(ctx, depth, value));
	else {
		const actual = deserialize$1(ctx, depth, key);
		switch (typeof actual) {
			case "string":
				assignStringProperty(object, actual, deserialize$1(ctx, depth, value));
				break;
			case "symbol":
				if (isValidSymbol(actual)) object[actual] = deserialize$1(ctx, depth, value);
				break;
			default: throw new SerovalMalformedNodeError(key);
		}
	}
}
function assignNodeType(ctx, id, type) {
	ctx.base.refs.types.set(id, type);
}
function validateNodeType(ctx, node, id, type) {
	if (ctx.base.refs.types.get(id) !== type) throw new SerovalMalformedNodeError(node);
}
function deserializeProperties(ctx, depth, node, result) {
	const keys = node.k;
	if (keys.length > 0) for (let i = 0, vals = node.v, len = keys.length; i < len; i++) assignProperty(ctx, depth, result, keys[i], vals[i]);
	return result;
}
function deserializeObject(ctx, depth, node) {
	const result = assignIndexedValue$1(ctx, node.i, node.t === 10 ? {} : Object.create(null));
	deserializeProperties(ctx, depth, node.p, result);
	applyObjectFlag(result, node.o);
	return result;
}
function deserializeDate(ctx, node) {
	return assignIndexedValue$1(ctx, node.i, new Date(node.s));
}
function deserializeTemporal(ctx, node) {
	if (!(ctx.base.features & 64)) throw new SerovalUnsupportedNodeError(node);
	let value;
	switch (node.c) {
		case 0:
			value = Temporal.Instant.from(node.s);
			break;
		case 1:
			value = Temporal.Duration.from(node.s);
			break;
		case 2:
			value = Temporal.PlainDate.from(node.s);
			break;
		case 3:
			value = Temporal.PlainDateTime.from(node.s);
			break;
		case 4:
			value = Temporal.PlainMonthDay.from(node.s);
			break;
		case 5:
			value = Temporal.PlainTime.from(node.s);
			break;
		case 6:
			value = Temporal.PlainYearMonth.from(node.s);
			break;
		case 7:
			value = Temporal.ZonedDateTime.from(node.s);
			break;
		default: throw new SerovalMalformedNodeError(node);
	}
	return assignIndexedValue$1(ctx, node.i, value);
}
function deserializeRegExp(ctx, node) {
	if (ctx.base.features & 32) {
		const source = deserializeString(node.c);
		if (source.length > MAX_REGEXP_SOURCE_LENGTH) throw new SerovalMalformedNodeError(node);
		return assignIndexedValue$1(ctx, node.i, new RegExp(source, node.m));
	}
	throw new SerovalUnsupportedNodeError(node);
}
function deserializeSet(ctx, depth, node) {
	const result = assignIndexedValue$1(ctx, node.i, /* @__PURE__ */ new Set());
	for (let i = 0, items = node.a, len = items.length; i < len; i++) result.add(deserialize$1(ctx, depth, items[i]));
	return result;
}
function deserializeMap(ctx, depth, node) {
	const result = assignIndexedValue$1(ctx, node.i, /* @__PURE__ */ new Map());
	for (let i = 0, keys = node.e.k, vals = node.e.v, len = keys.length; i < len; i++) result.set(deserialize$1(ctx, depth, keys[i]), deserialize$1(ctx, depth, vals[i]));
	return result;
}
function deserializeArrayBuffer(ctx, node) {
	if (node.s.length > MAX_BASE64_LENGTH) throw new SerovalMalformedNodeError(node);
	return assignIndexedValue$1(ctx, node.i, ARRAY_BUFFER_CONSTRUCTOR(deserializeString(node.s)));
}
function deserializeTypedArray(ctx, depth, node) {
	var _node$b;
	const construct = getTypedArrayConstructor(node.c);
	const source = deserialize$1(ctx, depth, node.f);
	if (!(source instanceof ArrayBuffer)) throw new SerovalMalformedNodeError(node);
	const offset = (_node$b = node.b) !== null && _node$b !== void 0 ? _node$b : 0;
	if (offset < 0 || offset > source.byteLength || node.l > MAX_BASE64_LENGTH) throw new SerovalMalformedNodeError(node);
	return assignIndexedValue$1(ctx, node.i, new construct(source, offset, node.l));
}
function deserializeDataView(ctx, depth, node) {
	var _node$b2;
	const source = deserialize$1(ctx, depth, node.f);
	if (!(source instanceof ArrayBuffer)) throw new SerovalMalformedNodeError(node);
	const offset = (_node$b2 = node.b) !== null && _node$b2 !== void 0 ? _node$b2 : 0;
	if (offset < 0 || offset > source.byteLength || node.l > MAX_BASE64_LENGTH) throw new SerovalMalformedNodeError(node);
	return assignIndexedValue$1(ctx, node.i, new DataView(source, offset, node.l));
}
function deserializeDictionary(ctx, depth, node, result) {
	if (node.p) {
		const fields = deserializeProperties(ctx, depth, node.p, {});
		Object.defineProperties(result, Object.getOwnPropertyDescriptors(fields));
	}
	return result;
}
function deserializeAggregateError(ctx, depth, node) {
	return deserializeDictionary(ctx, depth, node, assignIndexedValue$1(ctx, node.i, new AggregateError([], deserializeString(node.m))));
}
function deserializeError(ctx, depth, node) {
	const construct = deserializeKnownValue(node, ERROR_CONSTRUCTOR, node.s);
	return deserializeDictionary(ctx, depth, node, assignIndexedValue$1(ctx, node.i, new construct(deserializeString(node.m))));
}
function deserializePromise(ctx, depth, node) {
	const deferred = PROMISE_CONSTRUCTOR();
	const result = assignIndexedValue$1(ctx, node.i, deferred.p);
	const deserialized = deserialize$1(ctx, depth, node.f);
	if (isThennable(deserialized)) throw new SerovalMalformedNodeError(node.f);
	if (node.s) deferred.s(deserialized);
	else deferred.f(deserialized);
	return result;
}
function deserializeBoxed(ctx, depth, node) {
	return assignIndexedValue$1(ctx, node.i, Object(deserialize$1(ctx, depth, node.f)));
}
function deserializePlugin(ctx, depth, node) {
	const currentPlugins = ctx.base.plugins;
	if (currentPlugins) {
		const tag = deserializeString(node.c);
		for (let i = 0, len = currentPlugins.length; i < len; i++) {
			const plugin = currentPlugins[i];
			if (plugin.tag === tag) return assignIndexedValue$1(ctx, node.i, plugin.deserialize(node.s, new DeserializePluginContext(ctx, depth), { id: node.i }));
		}
	}
	throw new SerovalMissingPluginError(node.c);
}
function deserializePromiseConstructor(ctx, node) {
	const value = assignIndexedValue$1(ctx, node.i, assignIndexedValue$1(ctx, node.s, PROMISE_CONSTRUCTOR()).p);
	assignNodeType(ctx, node.s, 22);
	return value;
}
function deserializePromiseFulfill(ctx, depth, node) {
	const deferred = ctx.base.refs.get(node.i);
	if (deferred) {
		validateNodeType(ctx, node, node.i, 22);
		const deserialized = deserialize$1(ctx, depth, node.a[1]);
		if (isThennable(deserialized)) throw new SerovalMalformedNodeError(node.a[1]);
		if (node.t === 23) deferred.s(deserialized);
		else deferred.f(deserialized);
		return;
	}
	throw new SerovalMissingInstanceError("Promise");
}
function deserializeIteratorFactoryInstance(ctx, depth, node) {
	deserialize$1(ctx, depth, node.a[0]);
	const source = deserialize$1(ctx, depth, node.a[1]);
	if (!source || typeof source !== "object" || !isSequence(source)) throw new SerovalMalformedNodeError(node.a[1]);
	return sequenceToIterator(source);
}
function deserializeAsyncIteratorFactoryInstance(ctx, depth, node) {
	deserialize$1(ctx, depth, node.a[0]);
	const source = deserialize$1(ctx, depth, node.a[1]);
	if (!source || typeof source !== "object" || !isStream(source)) throw new SerovalMalformedNodeError(node.a[1]);
	return streamToAsyncIterable(source);
}
function deserializeStreamConstructor(ctx, depth, node) {
	const result = assignIndexedValue$1(ctx, node.i, createStream$1());
	assignNodeType(ctx, node.i, 31);
	const items = node.a;
	const len = items.length;
	if (len) for (let i = 0; i < len; i++) deserialize$1(ctx, depth, items[i]);
	return result;
}
function deserializeStreamNext(ctx, depth, node) {
	const deferred = ctx.base.refs.get(node.i);
	if (deferred) {
		validateNodeType(ctx, node, node.i, 31);
		deferred.next(deserialize$1(ctx, depth, node.f));
		return;
	}
	throw new SerovalMissingInstanceError("Stream");
}
function deserializeStreamThrow(ctx, depth, node) {
	const deferred = ctx.base.refs.get(node.i);
	if (deferred) {
		validateNodeType(ctx, node, node.i, 31);
		deferred.throw(deserialize$1(ctx, depth, node.f));
		return;
	}
	throw new SerovalMissingInstanceError("Stream");
}
function deserializeStreamReturn(ctx, depth, node) {
	const deferred = ctx.base.refs.get(node.i);
	if (deferred) {
		validateNodeType(ctx, node, node.i, 31);
		deferred.return(deserialize$1(ctx, depth, node.f));
		return;
	}
	throw new SerovalMissingInstanceError("Stream");
}
function deserializeIteratorFactory(ctx, depth, node) {
	deserialize$1(ctx, depth, node.f);
}
function deserializeAsyncIteratorFactory(ctx, depth, node) {
	deserialize$1(ctx, depth, node.a[1]);
}
function deserializeSequence(ctx, depth, node) {
	const result = assignIndexedValue$1(ctx, node.i, createSequence([], node.s, node.l));
	for (let i = 0, len = node.a.length; i < len; i++) result.v[i] = deserialize$1(ctx, depth, node.a[i]);
	return result;
}
function deserialize$1(ctx, depth, node) {
	if (depth > ctx.base.depthLimit) throw new SerovalDepthLimitError(ctx.base.depthLimit);
	depth += 1;
	switch (node.t) {
		case 2: return deserializeKnownValue(node, CONSTANT_VAL, node.s);
		case 0: return Number(node.s);
		case 1: return deserializeString(String(node.s));
		case 3:
			if (String(node.s).length > MAX_BIGINT_LENGTH) throw new SerovalMalformedNodeError(node);
			return BigInt(node.s);
		case 4: return ctx.base.refs.get(node.i);
		case 18: return deserializeReference(ctx, node);
		case 9: return deserializeArray(ctx, depth, node);
		case 10:
		case 11: return deserializeObject(ctx, depth, node);
		case 5: return deserializeDate(ctx, node);
		case 6: return deserializeRegExp(ctx, node);
		case 7: return deserializeSet(ctx, depth, node);
		case 8: return deserializeMap(ctx, depth, node);
		case 19: return deserializeArrayBuffer(ctx, node);
		case 16:
		case 15: return deserializeTypedArray(ctx, depth, node);
		case 20: return deserializeDataView(ctx, depth, node);
		case 14: return deserializeAggregateError(ctx, depth, node);
		case 13: return deserializeError(ctx, depth, node);
		case 12: return deserializePromise(ctx, depth, node);
		case 17: return deserializeKnownValue(node, SYMBOL_REF, node.s);
		case 21: return deserializeBoxed(ctx, depth, node);
		case 25: return deserializePlugin(ctx, depth, node);
		case 22: return deserializePromiseConstructor(ctx, node);
		case 23:
		case 24: return deserializePromiseFulfill(ctx, depth, node);
		case 28: return deserializeIteratorFactoryInstance(ctx, depth, node);
		case 30: return deserializeAsyncIteratorFactoryInstance(ctx, depth, node);
		case 31: return deserializeStreamConstructor(ctx, depth, node);
		case 32: return deserializeStreamNext(ctx, depth, node);
		case 33: return deserializeStreamThrow(ctx, depth, node);
		case 34: return deserializeStreamReturn(ctx, depth, node);
		case 27: return deserializeIteratorFactory(ctx, depth, node);
		case 29: return deserializeAsyncIteratorFactory(ctx, depth, node);
		case 35: return deserializeSequence(ctx, depth, node);
		case 36: return deserializeTemporal(ctx, node);
		default: throw new SerovalUnsupportedNodeError(node);
	}
}
function deserializeTop(ctx, node) {
	try {
		return deserialize$1(ctx, 0, node);
	} catch (error) {
		throw new SerovalDeserializationError(error);
	}
}
var RETURN = () => T;
var SERIALIZED_RETURN = /* @__PURE__ */ RETURN.toString();
var IS_MODERN = /* @__PURE__ */ /=>/.test(SERIALIZED_RETURN);
function createFunction(parameters, body) {
	if (IS_MODERN) return (parameters.length === 1 ? parameters[0] : "(" + parameters.join(",") + ")") + "=>" + (body.startsWith("{") ? "(" + body + ")" : body);
	return "function(" + parameters.join(",") + "){return " + body + "}";
}
function createEffectfulFunction(parameters, body) {
	if (IS_MODERN) return (parameters.length === 1 ? parameters[0] : "(" + parameters.join(",") + ")") + "=>{" + body + "}";
	return "function(" + parameters.join(",") + "){" + body + "}";
}
var REF_START_CHARS = "hjkmoquxzABCDEFGHIJKLNPQRTUVWXYZ$_";
var REF_START_CHARS_LEN = 34;
var REF_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$_";
var REF_CHARS_LEN = 64;
function getIdentifier(index) {
	let mod = index % REF_START_CHARS_LEN;
	let ref = REF_START_CHARS[mod];
	index = (index - mod) / REF_START_CHARS_LEN;
	while (index > 0) {
		mod = index % REF_CHARS_LEN;
		ref += REF_CHARS[mod];
		index = (index - mod) / REF_CHARS_LEN;
	}
	return ref;
}
var IDENTIFIER_CHECK = /^[$A-Z_][0-9A-Z_$]*$/i;
function isValidIdentifier(name) {
	const char = name[0];
	return (char === "$" || char === "_" || char >= "A" && char <= "Z" || char >= "a" && char <= "z") && IDENTIFIER_CHECK.test(name);
}
function getAssignmentExpression(assignment) {
	switch (assignment.t) {
		case 0: return assignment.s + "=" + assignment.v;
		case 2: return assignment.s + ".set(" + assignment.k + "," + assignment.v + ")";
		case 1: return assignment.s + ".add(" + assignment.v + ")";
		case 3: return assignment.s + ".delete(" + assignment.k + ")";
		case 4: return "Object.defineProperty(" + assignment.s + ",\"__proto__\",{value:" + assignment.k + ",configurable:!0,enumerable:!0,writable:!0})";
	}
}
function mergeAssignments(assignments) {
	const newAssignments = [];
	let current = assignments[0];
	for (let i = 1, len = assignments.length, item, prev = current; i < len; i++) {
		item = assignments[i];
		if (item.t === 0 && item.v === prev.v) current = {
			t: 0,
			s: item.s,
			k: void 0,
			v: getAssignmentExpression(current)
		};
		else if (item.t === 2 && item.s === prev.s) current = {
			t: 2,
			s: getAssignmentExpression(current),
			k: item.k,
			v: item.v
		};
		else if (item.t === 1 && item.s === prev.s) current = {
			t: 1,
			s: getAssignmentExpression(current),
			k: void 0,
			v: item.v
		};
		else if (item.t === 3 && item.s === prev.s) current = {
			t: 3,
			s: getAssignmentExpression(current),
			k: item.k,
			v: void 0
		};
		else {
			newAssignments.push(current);
			current = item;
		}
		prev = item;
	}
	newAssignments.push(current);
	return newAssignments;
}
function resolveAssignments(assignments) {
	if (assignments.length) {
		let result = "";
		const merged = mergeAssignments(assignments);
		for (let i = 0, len = merged.length; i < len; i++) result += getAssignmentExpression(merged[i]) + ",";
		return result;
	}
}
var NULL_CONSTRUCTOR = "Object.create(null)";
var SET_CONSTRUCTOR = "new Set";
var MAP_CONSTRUCTOR = "new Map";
var PROMISE_RESOLVE = "Promise.resolve";
var PROMISE_REJECT = "Promise.reject";
var OBJECT_FLAG_CONSTRUCTOR = {
	[3]: "Object.freeze",
	[2]: "Object.seal",
	[1]: "Object.preventExtensions",
	[0]: void 0
};
function createBaseSerializerContext(mode, options) {
	return {
		mode,
		plugins: options.plugins,
		features: options.features,
		marked: new Set(options.markedRefs),
		stack: [],
		flags: [],
		assignments: []
	};
}
function createCrossSerializerContext(options) {
	return {
		mode: 2,
		base: createBaseSerializerContext(2, options),
		state: options,
		child: void 0
	};
}
var SerializePluginContext = class {
	constructor(_p) {
		this._p = _p;
	}
	serialize(node) {
		return serialize$1(this._p, node);
	}
};
/**
* Creates the reference param (identifier) from the given reference ID
* Calling this function means the value has been referenced somewhere
*/
function getVanillaRefParam(state, index) {
	/**
	* Creates a new reference ID from a given reference ID
	* This new reference ID means that the reference itself
	* has been referenced at least once, and is used to generate
	* the variables
	*/
	let actualIndex = state.valid.get(index);
	if (actualIndex == null) {
		actualIndex = state.valid.size;
		state.valid.set(index, actualIndex);
	}
	let identifier = state.vars[actualIndex];
	if (identifier == null) {
		identifier = getIdentifier(actualIndex);
		state.vars[actualIndex] = identifier;
	}
	return identifier;
}
function getCrossRefParam(id) {
	return "$R[" + id + "]";
}
/**
* Converts the ID of a reference into a identifier string
* that is used to refer to the object instance in the
* generated script.
*/
function getRefParam(ctx, id) {
	return ctx.mode === 1 ? getVanillaRefParam(ctx.state, id) : getCrossRefParam(id);
}
function markSerializerRef(ctx, id) {
	ctx.marked.add(id);
}
function isSerializerRefMarked(ctx, id) {
	return ctx.marked.has(id);
}
function pushObjectFlag(ctx, flag, id) {
	if (flag !== 0) {
		markSerializerRef(ctx.base, id);
		ctx.base.flags.push({
			type: flag,
			value: getRefParam(ctx, id)
		});
	}
}
function resolveFlags(ctx) {
	let result = "";
	for (let i = 0, current = ctx.flags, len = current.length; i < len; i++) {
		const flag = current[i];
		result += OBJECT_FLAG_CONSTRUCTOR[flag.type] + "(" + flag.value + "),";
	}
	return result;
}
function resolvePatches(ctx) {
	const assignments = resolveAssignments(ctx.assignments);
	const flags = resolveFlags(ctx);
	if (assignments) {
		if (flags) return assignments + flags;
		return assignments;
	}
	return flags;
}
/**
* Generates the inlined assignment for the reference
* This is different from the assignments array as this one
* signifies creation rather than mutation
*/
function createAssignment(ctx, source, value) {
	ctx.assignments.push({
		t: 0,
		s: source,
		k: void 0,
		v: value
	});
}
function createAddAssignment(ctx, ref, value) {
	ctx.base.assignments.push({
		t: 1,
		s: getRefParam(ctx, ref),
		k: void 0,
		v: value
	});
}
function createSetAssignment(ctx, ref, key, value) {
	ctx.base.assignments.push({
		t: 2,
		s: getRefParam(ctx, ref),
		k: key,
		v: value
	});
}
function createDeleteAssignment(ctx, ref, key) {
	ctx.base.assignments.push({
		t: 3,
		s: getRefParam(ctx, ref),
		k: key,
		v: void 0
	});
}
function createArrayAssign(ctx, ref, index, value) {
	createAssignment(ctx.base, getRefParam(ctx, ref) + "[" + index + "]", value);
}
function createObjectAssign(ctx, ref, key, value) {
	if (!isValidKey(key)) {
		ctx.base.assignments.push({
			t: 4,
			s: getRefParam(ctx, ref),
			k: value,
			v: void 0
		});
		return;
	}
	createAssignment(ctx.base, getRefParam(ctx, ref) + "." + key, value);
}
function createSequenceAssign(ctx, ref, index, value) {
	createAssignment(ctx.base, getRefParam(ctx, ref) + ".v[" + index + "]", value);
}
/**
* Checks if the value is in the stack. Stack here is a reference
* structure to know if a object is to be accessed in a TDZ.
*/
function isIndexedValueInStack(ctx, node) {
	return node.t === 4 && ctx.stack.includes(node.i);
}
/**
* Produces an assignment expression. `id` generates a reference
* parameter (through `getRefParam`) and has the option to
* return the reference parameter directly or assign a value to
* it.
*/
function assignIndexedValue(ctx, index, value) {
	if (ctx.mode === 1 && !isSerializerRefMarked(ctx.base, index)) return value;
	/**
	* In cross-reference, we have to assume that
	* every reference are going to be referenced
	* in the future, and so we need to store
	* all of it into the reference array.
	*
	* otherwise in vanilla, we only do this if it
	* is actually referenced
	*/
	return getRefParam(ctx, index) + "=" + value;
}
function serializeReference(node) {
	return "__SEROVAL_REFS__.get(\"" + node.s + "\")";
}
function serializeArrayItem(ctx, id, item, index) {
	if (item) {
		if (isIndexedValueInStack(ctx.base, item)) {
			markSerializerRef(ctx.base, id);
			createArrayAssign(ctx, id, index, getRefParam(ctx, item.i));
			return "";
		}
		return serialize$1(ctx, item);
	}
	return "";
}
function serializeArray(ctx, node) {
	const id = node.i;
	const list = node.a;
	const len = list.length;
	if (len > 0) {
		ctx.base.stack.push(id);
		let values = serializeArrayItem(ctx, id, list[0], 0);
		let isHoley = values === "";
		for (let i = 1, item; i < len; i++) {
			item = serializeArrayItem(ctx, id, list[i], i);
			values += "," + item;
			isHoley = item === "";
		}
		ctx.base.stack.pop();
		pushObjectFlag(ctx, node.o, node.i);
		return "[" + values + (isHoley ? ",]" : "]");
	}
	return "[]";
}
function serializeProperty(ctx, source, key, val) {
	if (typeof key === "string") {
		const check = Number(key);
		const isIdentifier = check >= 0 && check.toString() === key || isValidIdentifier(key);
		if (isIndexedValueInStack(ctx.base, val)) {
			const refParam = getRefParam(ctx, val.i);
			markSerializerRef(ctx.base, source.i);
			if (isIdentifier && check !== check) createObjectAssign(ctx, source.i, key, refParam);
			else createArrayAssign(ctx, source.i, isIdentifier ? key : "\"" + key + "\"", refParam);
			return "";
		}
		if (isValidKey(key)) return (isIdentifier ? key : "\"" + key + "\"") + ":" + serialize$1(ctx, val);
		return "[\"" + key + "\"]:" + serialize$1(ctx, val);
	}
	return "[" + serialize$1(ctx, key) + "]:" + serialize$1(ctx, val);
}
function serializeProperties(ctx, source, record) {
	const keys = record.k;
	const len = keys.length;
	if (len > 0) {
		const values = record.v;
		ctx.base.stack.push(source.i);
		let result = serializeProperty(ctx, source, keys[0], values[0]);
		for (let i = 1, item = result; i < len; i++) {
			item = serializeProperty(ctx, source, keys[i], values[i]);
			result += (item && result && ",") + item;
		}
		ctx.base.stack.pop();
		return "{" + result + "}";
	}
	return "{}";
}
function serializeObject(ctx, node) {
	pushObjectFlag(ctx, node.o, node.i);
	return serializeProperties(ctx, node, node.p);
}
function serializeWithObjectAssign(ctx, source, value, serialized) {
	const fields = serializeProperties(ctx, source, value);
	if (fields !== "{}") return "Object.assign(" + serialized + "," + fields + ")";
	return serialized;
}
function serializeStringKeyAssignment(ctx, source, mainAssignments, key, value) {
	const base = ctx.base;
	const serialized = serialize$1(ctx, value);
	const check = Number(key);
	const isIdentifier = check >= 0 && check.toString() === key || isValidIdentifier(key);
	if (isIndexedValueInStack(base, value)) {
		if (isIdentifier && check !== check) createObjectAssign(ctx, source.i, key, serialized);
		else createArrayAssign(ctx, source.i, isIdentifier ? key : "\"" + key + "\"", serialized);
	} else {
		const parentAssignment = base.assignments;
		base.assignments = mainAssignments;
		if (isIdentifier && check !== check) createObjectAssign(ctx, source.i, key, serialized);
		else createArrayAssign(ctx, source.i, isIdentifier ? key : "\"" + key + "\"", serialized);
		base.assignments = parentAssignment;
	}
}
function serializeAssignment(ctx, source, mainAssignments, key, value) {
	if (typeof key === "string") serializeStringKeyAssignment(ctx, source, mainAssignments, key, value);
	else {
		const base = ctx.base;
		const parent = base.stack;
		base.stack = [];
		const serialized = serialize$1(ctx, value);
		base.stack = parent;
		const parentAssignment = base.assignments;
		base.assignments = mainAssignments;
		createArrayAssign(ctx, source.i, serialize$1(ctx, key), serialized);
		base.assignments = parentAssignment;
	}
}
function serializeAssignments(ctx, source, node) {
	const keys = node.k;
	const len = keys.length;
	if (len > 0) {
		const mainAssignments = [];
		const values = node.v;
		ctx.base.stack.push(source.i);
		for (let i = 0; i < len; i++) serializeAssignment(ctx, source, mainAssignments, keys[i], values[i]);
		ctx.base.stack.pop();
		return resolveAssignments(mainAssignments);
	}
}
function serializeDictionary(ctx, node, init) {
	if (node.p) {
		const base = ctx.base;
		if (base.features & 8) init = serializeWithObjectAssign(ctx, node, node.p, init);
		else {
			markSerializerRef(base, node.i);
			const assignments = serializeAssignments(ctx, node, node.p);
			if (assignments) return "(" + assignIndexedValue(ctx, node.i, init) + "," + assignments + getRefParam(ctx, node.i) + ")";
		}
	}
	return init;
}
function serializeNullConstructor(ctx, node) {
	pushObjectFlag(ctx, node.o, node.i);
	return serializeDictionary(ctx, node, NULL_CONSTRUCTOR);
}
function serializeDate(node) {
	return "new Date(\"" + node.s + "\")";
}
var TEMPORAL_CONSTRUCTOR = {
	[0]: "Temporal.Instant",
	[1]: "Temporal.Duration",
	[2]: "Temporal.PlainDate",
	[3]: "Temporal.PlainDateTime",
	[4]: "Temporal.PlainMonthDay",
	[5]: "Temporal.PlainTime",
	[6]: "Temporal.PlainYearMonth",
	[7]: "Temporal.ZonedDateTime"
};
function serializeTemporal(ctx, node) {
	if (ctx.base.features & 64) return TEMPORAL_CONSTRUCTOR[node.c] + ".from(\"" + node.s + "\")";
	throw new SerovalUnsupportedNodeError(node);
}
function serializeRegExp(ctx, node) {
	if (ctx.base.features & 32) return "/" + deserializeString(node.c) + "/" + node.m;
	throw new SerovalUnsupportedNodeError(node);
}
function serializeSetItem(ctx, id, item) {
	const base = ctx.base;
	if (isIndexedValueInStack(base, item)) {
		markSerializerRef(base, id);
		createAddAssignment(ctx, id, getRefParam(ctx, item.i));
		return "";
	}
	return serialize$1(ctx, item);
}
function serializeSet(ctx, node) {
	let serialized = SET_CONSTRUCTOR;
	const items = node.a;
	const size = items.length;
	const id = node.i;
	if (size > 0) {
		ctx.base.stack.push(id);
		let result = serializeSetItem(ctx, id, items[0]);
		for (let i = 1, item = result; i < size; i++) {
			item = serializeSetItem(ctx, id, items[i]);
			result += (item && result && ",") + item;
		}
		ctx.base.stack.pop();
		if (result) serialized += "([" + result + "])";
	}
	return serialized;
}
function serializeMapEntry(ctx, id, key, val, sentinel) {
	const base = ctx.base;
	if (isIndexedValueInStack(base, key)) {
		const keyRef = getRefParam(ctx, key.i);
		markSerializerRef(base, id);
		if (isIndexedValueInStack(base, val)) {
			createSetAssignment(ctx, id, keyRef, getRefParam(ctx, val.i));
			return "";
		}
		if (val.t !== 4 && val.i != null && isSerializerRefMarked(base, val.i)) {
			const serialized = "(" + serialize$1(ctx, val) + ",[" + sentinel + "," + sentinel + "])";
			createSetAssignment(ctx, id, keyRef, getRefParam(ctx, val.i));
			createDeleteAssignment(ctx, id, sentinel);
			return serialized;
		}
		const parent = base.stack;
		base.stack = [];
		createSetAssignment(ctx, id, keyRef, serialize$1(ctx, val));
		base.stack = parent;
		return "";
	}
	if (isIndexedValueInStack(base, val)) {
		const valueRef = getRefParam(ctx, val.i);
		markSerializerRef(base, id);
		if (key.t !== 4 && key.i != null && isSerializerRefMarked(base, key.i)) {
			const serialized = "(" + serialize$1(ctx, key) + ",[" + sentinel + "," + sentinel + "])";
			createSetAssignment(ctx, id, getRefParam(ctx, key.i), valueRef);
			createDeleteAssignment(ctx, id, sentinel);
			return serialized;
		}
		const parent = base.stack;
		base.stack = [];
		createSetAssignment(ctx, id, serialize$1(ctx, key), valueRef);
		base.stack = parent;
		return "";
	}
	return "[" + serialize$1(ctx, key) + "," + serialize$1(ctx, val) + "]";
}
function serializeMap(ctx, node) {
	let serialized = MAP_CONSTRUCTOR;
	const keys = node.e.k;
	const size = keys.length;
	const id = node.i;
	const sentinel = node.f;
	const sentinelId = getRefParam(ctx, sentinel.i);
	const base = ctx.base;
	if (size > 0) {
		const vals = node.e.v;
		base.stack.push(id);
		let result = serializeMapEntry(ctx, id, keys[0], vals[0], sentinelId);
		for (let i = 1, item = result; i < size; i++) {
			item = serializeMapEntry(ctx, id, keys[i], vals[i], sentinelId);
			result += (item && result && ",") + item;
		}
		base.stack.pop();
		if (result) serialized += "([" + result + "])";
	}
	if (sentinel.t === 26) {
		markSerializerRef(base, sentinel.i);
		serialized = "(" + serialize$1(ctx, sentinel) + "," + serialized + ")";
	}
	return serialized;
}
function serializeArrayBuffer(ctx, node) {
	return getConstructor(ctx, node.f) + "(\"" + node.s + "\")";
}
function serializeTypedArray(ctx, node) {
	return "new " + node.c + "(" + serialize$1(ctx, node.f) + "," + node.b + "," + node.l + ")";
}
function serializeDataView(ctx, node) {
	return "new DataView(" + serialize$1(ctx, node.f) + "," + node.b + "," + node.l + ")";
}
function serializeAggregateError(ctx, node) {
	const id = node.i;
	ctx.base.stack.push(id);
	const serialized = serializeDictionary(ctx, node, "new AggregateError([],\"" + node.m + "\")");
	ctx.base.stack.pop();
	return serialized;
}
function serializeError(ctx, node) {
	return serializeDictionary(ctx, node, "new " + ERROR_CONSTRUCTOR_STRING[node.s] + "(\"" + node.m + "\")");
}
function serializePromise(ctx, node) {
	let serialized;
	const fulfilled = node.f;
	const id = node.i;
	const promiseConstructor = node.s ? PROMISE_RESOLVE : PROMISE_REJECT;
	const base = ctx.base;
	if (isIndexedValueInStack(base, fulfilled)) {
		const ref = getRefParam(ctx, fulfilled.i);
		serialized = promiseConstructor + (node.s ? "().then(" + createFunction([], ref) + ")" : "().catch(" + createEffectfulFunction([], "throw " + ref) + ")");
	} else {
		base.stack.push(id);
		const result = serialize$1(ctx, fulfilled);
		base.stack.pop();
		serialized = promiseConstructor + "(" + result + ")";
	}
	return serialized;
}
function serializeBoxed(ctx, node) {
	return "Object(" + serialize$1(ctx, node.f) + ")";
}
function getConstructor(ctx, node) {
	const current = serialize$1(ctx, node);
	return node.t === 4 ? current : "(" + current + ")";
}
function serializePromiseConstructor(ctx, node) {
	if (ctx.mode === 1) throw new SerovalUnsupportedNodeError(node);
	return "(" + assignIndexedValue(ctx, node.s, getConstructor(ctx, node.f) + "()") + ").p";
}
function serializePromiseResolve(ctx, node) {
	if (ctx.mode === 1) throw new SerovalUnsupportedNodeError(node);
	return getConstructor(ctx, node.a[0]) + "(" + getRefParam(ctx, node.i) + "," + serialize$1(ctx, node.a[1]) + ")";
}
function serializePromiseReject(ctx, node) {
	if (ctx.mode === 1) throw new SerovalUnsupportedNodeError(node);
	return getConstructor(ctx, node.a[0]) + "(" + getRefParam(ctx, node.i) + "," + serialize$1(ctx, node.a[1]) + ")";
}
function serializePlugin(ctx, node) {
	const currentPlugins = ctx.base.plugins;
	if (currentPlugins) for (let i = 0, len = currentPlugins.length; i < len; i++) {
		const plugin = currentPlugins[i];
		if (plugin.tag === node.c) {
			if (ctx.child == null) ctx.child = new SerializePluginContext(ctx);
			return plugin.serialize(node.s, ctx.child, { id: node.i });
		}
	}
	throw new SerovalMissingPluginError(node.c);
}
function serializeIteratorFactory(ctx, node) {
	let result = "";
	let initialized = false;
	if (node.f.t !== 4) {
		markSerializerRef(ctx.base, node.f.i);
		result = "(" + serialize$1(ctx, node.f) + ",";
		initialized = true;
	}
	result += assignIndexedValue(ctx, node.i, "(" + SERIALIZED_ITERATOR_CONSTRUCTOR + ")(" + getRefParam(ctx, node.f.i) + ")");
	if (initialized) result += ")";
	return result;
}
function serializeIteratorFactoryInstance(ctx, node) {
	return getConstructor(ctx, node.a[0]) + "(" + serialize$1(ctx, node.a[1]) + ")";
}
function serializeAsyncIteratorFactory(ctx, node) {
	const promise = node.a[0];
	const symbol = node.a[1];
	const base = ctx.base;
	let result = "";
	if (promise.t !== 4) {
		markSerializerRef(base, promise.i);
		result += "(" + serialize$1(ctx, promise);
	}
	if (symbol.t !== 4) {
		markSerializerRef(base, symbol.i);
		result += (result ? "," : "(") + serialize$1(ctx, symbol);
	}
	if (result) result += ",";
	const iterator = assignIndexedValue(ctx, node.i, "(" + SERIALIZED_ASYNC_ITERATOR_CONSTRUCTOR + ")(" + getRefParam(ctx, symbol.i) + "," + getRefParam(ctx, promise.i) + ")");
	if (result) return result + iterator + ")";
	return iterator;
}
function serializeAsyncIteratorFactoryInstance(ctx, node) {
	return getConstructor(ctx, node.a[0]) + "(" + serialize$1(ctx, node.a[1]) + ")";
}
function serializeStreamConstructor(ctx, node) {
	const result = assignIndexedValue(ctx, node.i, getConstructor(ctx, node.f) + "()");
	const len = node.a.length;
	if (len) {
		let values = serialize$1(ctx, node.a[0]);
		for (let i = 1; i < len; i++) values += "," + serialize$1(ctx, node.a[i]);
		return "(" + result + "," + values + "," + getRefParam(ctx, node.i) + ")";
	}
	return result;
}
function serializeStreamNext(ctx, node) {
	return getRefParam(ctx, node.i) + ".next(" + serialize$1(ctx, node.f) + ")";
}
function serializeStreamThrow(ctx, node) {
	return getRefParam(ctx, node.i) + ".throw(" + serialize$1(ctx, node.f) + ")";
}
function serializeStreamReturn(ctx, node) {
	return getRefParam(ctx, node.i) + ".return(" + serialize$1(ctx, node.f) + ")";
}
function serializeSequenceItem(ctx, id, index, item) {
	const base = ctx.base;
	if (isIndexedValueInStack(base, item)) {
		markSerializerRef(base, id);
		createSequenceAssign(ctx, id, index, getRefParam(ctx, item.i));
		return "";
	}
	return serialize$1(ctx, item);
}
function serializeSequence(ctx, node) {
	const items = node.a;
	const size = items.length;
	const id = node.i;
	if (size > 0) {
		ctx.base.stack.push(id);
		let result = serializeSequenceItem(ctx, id, 0, items[0]);
		for (let i = 1, item = result; i < size; i++) {
			item = serializeSequenceItem(ctx, id, i, items[i]);
			result += (item && result && ",") + item;
		}
		ctx.base.stack.pop();
		if (result) return "{__SEROVAL_SEQUENCE__:!0,v:[" + result + "],t:" + node.s + ",d:" + node.l + "}";
	}
	return "{__SEROVAL_SEQUENCE__:!0,v:[],t:-1,d:0}";
}
function serializeAssignable(ctx, node) {
	switch (node.t) {
		case 17: return SYMBOL_STRING[node.s];
		case 18: return serializeReference(node);
		case 9: return serializeArray(ctx, node);
		case 10: return serializeObject(ctx, node);
		case 11: return serializeNullConstructor(ctx, node);
		case 5: return serializeDate(node);
		case 6: return serializeRegExp(ctx, node);
		case 7: return serializeSet(ctx, node);
		case 8: return serializeMap(ctx, node);
		case 19: return serializeArrayBuffer(ctx, node);
		case 16:
		case 15: return serializeTypedArray(ctx, node);
		case 20: return serializeDataView(ctx, node);
		case 14: return serializeAggregateError(ctx, node);
		case 13: return serializeError(ctx, node);
		case 12: return serializePromise(ctx, node);
		case 21: return serializeBoxed(ctx, node);
		case 22: return serializePromiseConstructor(ctx, node);
		case 25: return serializePlugin(ctx, node);
		case 26: return SPECIAL_REF_STRING[node.s];
		case 35: return serializeSequence(ctx, node);
		case 36: return serializeTemporal(ctx, node);
		default: throw new SerovalUnsupportedNodeError(node);
	}
}
function serialize$1(ctx, node) {
	switch (node.t) {
		case 2: return CONSTANT_STRING[node.s];
		case 0: return "" + node.s;
		case 1: return "\"" + node.s + "\"";
		case 3: return node.s + "n";
		case 4: return getRefParam(ctx, node.i);
		case 23: return serializePromiseResolve(ctx, node);
		case 24: return serializePromiseReject(ctx, node);
		case 27: return serializeIteratorFactory(ctx, node);
		case 28: return serializeIteratorFactoryInstance(ctx, node);
		case 29: return serializeAsyncIteratorFactory(ctx, node);
		case 30: return serializeAsyncIteratorFactoryInstance(ctx, node);
		case 31: return serializeStreamConstructor(ctx, node);
		case 32: return serializeStreamNext(ctx, node);
		case 33: return serializeStreamThrow(ctx, node);
		case 34: return serializeStreamReturn(ctx, node);
		default: return assignIndexedValue(ctx, node.i, serializeAssignable(ctx, node));
	}
}
function serializeTopCross(ctx, tree) {
	const result = serialize$1(ctx, tree);
	const id = tree.i;
	if (id == null) return result;
	const patches = resolvePatches(ctx.base);
	const ref = getRefParam(ctx, id);
	const scopeId = ctx.state.scopeId;
	const params = scopeId == null ? "" : "$R";
	const body = patches ? "(" + result + "," + patches + ref + ")" : result;
	if (params === "") {
		if (tree.t === 10 && !patches) return "(" + body + ")";
		return body;
	}
	const args = scopeId == null ? "()" : "($R[\"" + serializeString(scopeId) + "\"])";
	return "(" + createFunction([params], body) + ")" + args;
}
var SyncParsePluginContext = class {
	constructor(_p, depth) {
		this._p = _p;
		this.depth = depth;
	}
	parse(current) {
		return parseSOS(this._p, this.depth, current);
	}
};
var StreamParsePluginContext = class {
	constructor(_p, depth) {
		this._p = _p;
		this.depth = depth;
	}
	parse(current) {
		return parseSOS(this._p, this.depth, current);
	}
	parseWithError(current) {
		return parseWithError(this._p, this.depth, current);
	}
	isAlive() {
		return this._p.state.alive;
	}
	pushPendingState() {
		pushPendingState(this._p);
	}
	popPendingState() {
		popPendingState(this._p);
	}
	onParse(node) {
		onParse(this._p, node);
	}
	onError(error) {
		onError(this._p, error);
	}
	addCleanup(callback) {
		this._p.state.cleanups.push(callback);
	}
};
function createStreamParserState(options) {
	return {
		alive: true,
		pending: 0,
		initial: true,
		buffer: [],
		onParse: options.onParse,
		onError: options.onError,
		onDone: options.onDone,
		cleanups: []
	};
}
function createStreamParserContext(options) {
	return {
		type: 2,
		base: createBaseParserContext(2, options),
		state: createStreamParserState(options)
	};
}
function parseItems(ctx, depth, current) {
	const nodes = [];
	for (let i = 0, len = current.length; i < len; i++) if (i in current) nodes[i] = parseSOS(ctx, depth, current[i]);
	else nodes[i] = 0;
	return nodes;
}
function parseArray(ctx, depth, id, current) {
	return createArrayNode(id, current, parseItems(ctx, depth, current));
}
function parseProperties(ctx, depth, properties) {
	const entries = Object.entries(properties);
	const keyNodes = [];
	const valueNodes = [];
	for (let i = 0, len = entries.length; i < len; i++) {
		keyNodes.push(serializeString(entries[i][0]));
		valueNodes.push(parseSOS(ctx, depth, entries[i][1]));
	}
	if (SYM_ITERATOR in properties) {
		keyNodes.push(parseWellKnownSymbol(ctx.base, SYM_ITERATOR));
		valueNodes.push(createIteratorFactoryInstanceNode(parseIteratorFactory(ctx.base), parseSOS(ctx, depth, createSequenceFromIterable(properties))));
	}
	if (SYM_ASYNC_ITERATOR in properties) {
		keyNodes.push(parseWellKnownSymbol(ctx.base, SYM_ASYNC_ITERATOR));
		valueNodes.push(createAsyncIteratorFactoryInstanceNode(parseAsyncIteratorFactory(ctx.base), parseSOS(ctx, depth, ctx.type === 1 ? createStream$1() : createStreamFromAsyncIterable(properties))));
	}
	if (SYM_TO_STRING_TAG in properties) {
		keyNodes.push(parseWellKnownSymbol(ctx.base, SYM_TO_STRING_TAG));
		valueNodes.push(createStringNode(properties[SYM_TO_STRING_TAG]));
	}
	if (SYM_IS_CONCAT_SPREADABLE in properties) {
		keyNodes.push(parseWellKnownSymbol(ctx.base, SYM_IS_CONCAT_SPREADABLE));
		valueNodes.push(properties[SYM_IS_CONCAT_SPREADABLE] ? TRUE_NODE : FALSE_NODE);
	}
	return {
		k: keyNodes,
		v: valueNodes
	};
}
function parsePlainObject(ctx, depth, id, current, empty) {
	return createObjectNode(id, current, empty, parseProperties(ctx, depth, current));
}
function parseBoxed(ctx, depth, id, current) {
	return createBoxedNode(id, parseSOS(ctx, depth, current.valueOf()));
}
function parseTypedArray(ctx, depth, id, current) {
	return createTypedArrayNode(id, current, parseSOS(ctx, depth, current.buffer));
}
function parseBigIntTypedArray(ctx, depth, id, current) {
	return createBigIntTypedArrayNode(id, current, parseSOS(ctx, depth, current.buffer));
}
function parseDataView(ctx, depth, id, current) {
	return createDataViewNode(id, current, parseSOS(ctx, depth, current.buffer));
}
function parseError(ctx, depth, id, current) {
	const options = getErrorOptions(current, ctx.base.features);
	return createErrorNode(id, current, options ? parseProperties(ctx, depth, options) : void 0);
}
function parseAggregateError(ctx, depth, id, current) {
	const options = getErrorOptions(current, ctx.base.features);
	return createAggregateErrorNode(id, current, options ? parseProperties(ctx, depth, options) : void 0);
}
function parseMap(ctx, depth, id, current) {
	const keyNodes = [];
	const valueNodes = [];
	for (const [key, value] of current.entries()) {
		keyNodes.push(parseSOS(ctx, depth, key));
		valueNodes.push(parseSOS(ctx, depth, value));
	}
	return createMapNode(ctx.base, id, keyNodes, valueNodes);
}
function parseSet(ctx, depth, id, current) {
	const items = [];
	for (const item of current.keys()) items.push(parseSOS(ctx, depth, item));
	return createSetNode(id, items);
}
function parseStream(ctx, depth, id, current) {
	const result = createStreamConstructorNode(id, parseSpecialReference(ctx.base, 4), []);
	if (ctx.type === 1) return result;
	pushPendingState(ctx);
	current.on({
		next: (value) => {
			if (ctx.state.alive) {
				const parsed = parseWithError(ctx, depth, value);
				if (parsed) onParse(ctx, createStreamNextNode(id, parsed));
			}
		},
		throw: (value) => {
			if (ctx.state.alive) {
				const parsed = parseWithError(ctx, depth, value);
				if (parsed) onParse(ctx, createStreamThrowNode(id, parsed));
			}
			popPendingState(ctx);
		},
		return: (value) => {
			if (ctx.state.alive) {
				const parsed = parseWithError(ctx, depth, value);
				if (parsed) onParse(ctx, createStreamReturnNode(id, parsed));
			}
			popPendingState(ctx);
		}
	});
	return result;
}
function handlePromiseSuccess(id, depth, data) {
	if (this.state.alive) {
		const parsed = parseWithError(this, depth, data);
		if (parsed) onParse(this, createSerovalNode(23, id, void 0, void 0, void 0, void 0, void 0, [parseSpecialReference(this.base, 2), parsed], void 0, void 0, void 0, void 0));
		popPendingState(this);
	}
}
function handlePromiseFailure(id, depth, data) {
	if (this.state.alive) {
		const parsed = parseWithError(this, depth, data);
		if (parsed) onParse(this, createSerovalNode(24, id, void 0, void 0, void 0, void 0, void 0, [parseSpecialReference(this.base, 3), parsed], void 0, void 0, void 0, void 0));
	}
	popPendingState(this);
}
function parsePromise(ctx, depth, id, current) {
	const resolver = createIndexForValue(ctx.base, {});
	if (ctx.type === 2) {
		pushPendingState(ctx);
		current.then(handlePromiseSuccess.bind(ctx, resolver, depth), handlePromiseFailure.bind(ctx, resolver, depth));
	}
	return createPromiseConstructorNode(ctx.base, id, resolver);
}
function parsePluginSync(ctx, depth, id, current, currentPlugins) {
	for (let i = 0, len = currentPlugins.length; i < len; i++) {
		const plugin = currentPlugins[i];
		if (plugin.parse.sync && plugin.test(current)) return createPluginNode(id, plugin.tag, plugin.parse.sync(current, new SyncParsePluginContext(ctx, depth), { id }));
	}
}
function parsePluginStream(ctx, depth, id, current, currentPlugins) {
	for (let i = 0, len = currentPlugins.length; i < len; i++) {
		const plugin = currentPlugins[i];
		if (plugin.parse.stream && plugin.test(current)) return createPluginNode(id, plugin.tag, plugin.parse.stream(current, new StreamParsePluginContext(ctx, depth), { id }));
	}
}
function parsePlugin(ctx, depth, id, current) {
	const currentPlugins = ctx.base.plugins;
	if (currentPlugins) return ctx.type === 1 ? parsePluginSync(ctx, depth, id, current, currentPlugins) : parsePluginStream(ctx, depth, id, current, currentPlugins);
}
function parseSequence(ctx, depth, id, current) {
	const nodes = [];
	for (let i = 0, len = current.v.length; i < len; i++) nodes[i] = parseSOS(ctx, depth, current.v[i]);
	return createSequenceNode(id, nodes, current.t, current.d);
}
function parseObjectPhase2(ctx, depth, id, current, currentClass) {
	switch (currentClass) {
		case Object: return parsePlainObject(ctx, depth, id, current, false);
		case void 0: return parsePlainObject(ctx, depth, id, current, true);
		case Date: return createDateNode(id, current);
		case Error:
		case EvalError:
		case RangeError:
		case ReferenceError:
		case SyntaxError:
		case TypeError:
		case URIError: return parseError(ctx, depth, id, current);
		case Number:
		case Boolean:
		case String:
		case BigInt: return parseBoxed(ctx, depth, id, current);
		case ArrayBuffer: return createArrayBufferNode(ctx.base, id, current);
		case Int8Array:
		case Int16Array:
		case Int32Array:
		case Uint8Array:
		case Uint16Array:
		case Uint32Array:
		case Uint8ClampedArray:
		case Float32Array:
		case Float64Array: return parseTypedArray(ctx, depth, id, current);
		case DataView: return parseDataView(ctx, depth, id, current);
		case Map: return parseMap(ctx, depth, id, current);
		case Set: return parseSet(ctx, depth, id, current);
	}
	if (currentClass === Promise || current instanceof Promise) return parsePromise(ctx, depth, id, current);
	const currentFeatures = ctx.base.features;
	if (currentFeatures & 32 && currentClass === RegExp) return createRegExpNode(id, current);
	if (currentFeatures & 16) switch (currentClass) {
		case BigInt64Array:
		case BigUint64Array: return parseBigIntTypedArray(ctx, depth, id, current);
	}
	if (currentFeatures & 1 && typeof AggregateError !== "undefined" && (currentClass === AggregateError || current instanceof AggregateError)) return parseAggregateError(ctx, depth, id, current);
	if (currentFeatures & 64 && typeof Temporal !== "undefined") switch (currentClass) {
		case Temporal.Instant: return createTemporalNode(id, 0, current);
		case Temporal.Duration: return createTemporalNode(id, 1, current);
		case Temporal.PlainDate: return createTemporalNode(id, 2, current);
		case Temporal.PlainDateTime: return createTemporalNode(id, 3, current);
		case Temporal.PlainMonthDay: return createTemporalNode(id, 4, current);
		case Temporal.PlainTime: return createTemporalNode(id, 5, current);
		case Temporal.PlainYearMonth: return createTemporalNode(id, 6, current);
		case Temporal.ZonedDateTime: return createTemporalNode(id, 7, current);
	}
	if (current instanceof Error) return parseError(ctx, depth, id, current);
	if (SYM_ITERATOR in current || SYM_ASYNC_ITERATOR in current) return parsePlainObject(ctx, depth, id, current, !!currentClass);
	throw new SerovalUnsupportedTypeError(current);
}
function parseObject(ctx, depth, id, current) {
	if (Array.isArray(current)) return parseArray(ctx, depth, id, current);
	if (isStream(current)) return parseStream(ctx, depth, id, current);
	if (isSequence(current)) return parseSequence(ctx, depth, id, current);
	let currentClass = current.constructor;
	if (currentClass !== void 0 && typeof currentClass !== "function") {
		const proto = Object.getPrototypeOf(current);
		currentClass = proto === null ? void 0 : proto.constructor;
	}
	if (currentClass === OpaqueReference) return parseSOS(ctx, depth, current.replacement);
	const parsed = parsePlugin(ctx, depth, id, current);
	if (parsed) return parsed;
	return parseObjectPhase2(ctx, depth, id, current, currentClass);
}
function parseFunction(ctx, depth, current) {
	const ref = getReferenceNode(ctx.base, current);
	if (ref.type !== 0) return ref.value;
	const plugin = parsePlugin(ctx, depth, ref.value, current);
	if (plugin) return plugin;
	throw new SerovalUnsupportedTypeError(current);
}
function parseSOS(ctx, depth, current) {
	if (depth >= ctx.base.depthLimit) throw new SerovalDepthLimitError(ctx.base.depthLimit);
	switch (typeof current) {
		case "boolean": return current ? TRUE_NODE : FALSE_NODE;
		case "undefined": return UNDEFINED_NODE;
		case "string": return createStringNode(current);
		case "number": return createNumberNode(current);
		case "bigint": return createBigIntNode(current);
		case "object":
			if (current) {
				const ref = getReferenceNode(ctx.base, current);
				return ref.type === 0 ? parseObject(ctx, depth + 1, ref.value, current) : ref.value;
			}
			return NULL_NODE;
		case "symbol": return parseWellKnownSymbol(ctx.base, current);
		case "function": return parseFunction(ctx, depth, current);
		default: throw new SerovalUnsupportedTypeError(current);
	}
}
function onParse(ctx, node) {
	if (ctx.state.initial) ctx.state.buffer.push(node);
	else onParseInternal(ctx, node, false);
}
function onError(ctx, error) {
	if (ctx.state.onError) ctx.state.onError(error);
	else throw error instanceof SerovalParserError ? error : new SerovalParserError(error);
}
function onDone(ctx) {
	if (ctx.state.onDone) ctx.state.onDone();
	for (let i = 0, len = ctx.state.cleanups.length; i < len; i++) ctx.state.cleanups[i]();
}
function onParseInternal(ctx, node, initial) {
	try {
		ctx.state.onParse(node, initial);
	} catch (error) {
		onError(ctx, error);
	}
}
function pushPendingState(ctx) {
	ctx.state.pending++;
}
function popPendingState(ctx) {
	if (--ctx.state.pending <= 0) onDone(ctx);
}
function parseWithError(ctx, depth, current) {
	try {
		return parseSOS(ctx, depth, current);
	} catch (err) {
		onError(ctx, err);
		return;
	}
}
function startStreamParse(ctx, current) {
	const parsed = parseWithError(ctx, 0, current);
	if (parsed) {
		onParseInternal(ctx, parsed, true);
		ctx.state.initial = false;
		flushStreamParse(ctx, ctx.state);
		if (ctx.state.pending <= 0) destroyStreamParse(ctx);
	}
}
function flushStreamParse(ctx, state) {
	for (let i = 0, len = state.buffer.length; i < len; i++) onParseInternal(ctx, state.buffer[i], false);
}
function destroyStreamParse(ctx) {
	if (ctx.state.alive) {
		onDone(ctx);
		ctx.state.alive = false;
	}
}
async function toCrossJSONAsync(source, options = {}) {
	return await parseTopAsync(createAsyncParserContext(2, {
		plugins: resolvePlugins(options.plugins),
		disabledFeatures: options.disabledFeatures,
		refs: options.refs
	}), source);
}
function crossSerializeStream(source, options) {
	const plugins = resolvePlugins(options.plugins);
	const ctx = createStreamParserContext({
		plugins,
		refs: options.refs,
		disabledFeatures: options.disabledFeatures,
		onParse(node, initial) {
			const serial = createCrossSerializerContext({
				plugins,
				features: ctx.base.features,
				scopeId: options.scopeId,
				markedRefs: ctx.base.marked
			});
			let serialized;
			try {
				serialized = serializeTopCross(serial, node);
			} catch (err) {
				if (options.onError) options.onError(err);
				return;
			}
			options.onSerialize(serialized, initial);
		},
		onError: options.onError,
		onDone: options.onDone
	});
	startStreamParse(ctx, source);
	return destroyStreamParse.bind(null, ctx);
}
function toCrossJSONStream(source, options) {
	const ctx = createStreamParserContext({
		plugins: resolvePlugins(options.plugins),
		refs: options.refs,
		disabledFeatures: options.disabledFeatures,
		depthLimit: options.depthLimit,
		onParse: options.onParse,
		onError: options.onError,
		onDone: options.onDone
	});
	startStreamParse(ctx, source);
	return destroyStreamParse.bind(null, ctx);
}
function fromJSON(source, options = {}) {
	var _source$f;
	const plugins = resolvePlugins(options.plugins);
	const disabledFeatures = options.disabledFeatures || 0;
	const sourceFeatures = (_source$f = source.f) !== null && _source$f !== void 0 ? _source$f : 127;
	return deserializeTop(createVanillaDeserializerContext({
		plugins,
		markedRefs: source.m,
		features: sourceFeatures & ~disabledFeatures,
		disabledFeatures
	}), source.t);
}
/**
* Create a strongly-typed serialization adapter for SSR hydration.
* Use to register custom types with the router serializer.
*/
function createSerializationAdapter(opts) {
	return opts;
}
/** Create a Seroval plugin for server-side serialization only. */
/* @__NO_SIDE_EFFECTS__ */
function makeSsrSerovalPlugin(serializationAdapter, options) {
	return /* @__PURE__ */ createPlugin({
		tag: "$TSR/t/" + serializationAdapter.key,
		test: serializationAdapter.test,
		parse: { stream(value, ctx, _data) {
			return { v: ctx.parse(serializationAdapter.toSerializable(value)) };
		} },
		serialize(node, ctx, _data) {
			options.didRun = true;
			return GLOBAL_TSR + ".t.get(\"" + serializationAdapter.key + "\")(" + ctx.serialize(node.v) + ")";
		},
		deserialize: void 0
	});
}
/** Create a Seroval plugin for client/server symmetric (de)serialization. */
/* @__NO_SIDE_EFFECTS__ */
function makeSerovalPlugin(serializationAdapter) {
	return /* @__PURE__ */ createPlugin({
		tag: "$TSR/t/" + serializationAdapter.key,
		test: serializationAdapter.test,
		parse: {
			sync(value, ctx, _data) {
				return { v: ctx.parse(serializationAdapter.toSerializable(value)) };
			},
			async async(value, ctx, _data) {
				return { v: await ctx.parse(serializationAdapter.toSerializable(value)) };
			},
			stream(value, ctx, _data) {
				return { v: ctx.parse(serializationAdapter.toSerializable(value)) };
			}
		},
		serialize: void 0,
		deserialize(node, ctx, _data) {
			return serializationAdapter.fromSerializable(ctx.deserialize(node.v));
		}
	});
}
/**
* Marker class for ReadableStream<Uint8Array> that should be serialized
* with base64 encoding (SSR) or binary framing (server functions).
*
* Wrap your binary streams with this to get efficient serialization:
* ```ts
* // For binary data (files, images, etc.)
* return { data: new RawStream(file.stream()) }
*
* // For text-heavy data (RSC payloads, etc.)
* return { data: new RawStream(rscStream, { hint: 'text' }) }
* ```
*/
var RawStream = class {
	constructor(stream, options) {
		this.stream = stream;
		this.hint = options?.hint ?? "binary";
	}
};
var BufferCtor = globalThis.Buffer;
var hasNodeBuffer = !!BufferCtor && typeof BufferCtor.from === "function";
function uint8ArrayToBase64(bytes) {
	if (bytes.length === 0) return "";
	if (hasNodeBuffer) return BufferCtor.from(bytes).toString("base64");
	const CHUNK_SIZE = 32768;
	const chunks = [];
	for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
		const chunk = bytes.subarray(i, i + CHUNK_SIZE);
		chunks.push(String.fromCharCode.apply(null, chunk));
	}
	return btoa(chunks.join(""));
}
function base64ToUint8Array(base64) {
	if (base64.length === 0) return /* @__PURE__ */ new Uint8Array(0);
	if (hasNodeBuffer) {
		const buf = BufferCtor.from(base64, "base64");
		return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
	}
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}
var RAW_STREAM_FACTORY_BINARY = Object.create(null);
var RAW_STREAM_FACTORY_TEXT = Object.create(null);
var RAW_STREAM_FACTORY_CONSTRUCTOR_BINARY = (stream) => new ReadableStream({ start(controller) {
	stream.on({
		next(base64) {
			try {
				controller.enqueue(base64ToUint8Array(base64));
			} catch {}
		},
		throw(error) {
			controller.error(error);
		},
		return() {
			try {
				controller.close();
			} catch {}
		}
	});
} });
var textEncoderForFactory = new TextEncoder();
var RAW_STREAM_FACTORY_CONSTRUCTOR_TEXT = (stream) => {
	return new ReadableStream({ start(controller) {
		stream.on({
			next(value) {
				try {
					if (typeof value === "string") controller.enqueue(textEncoderForFactory.encode(value));
					else controller.enqueue(base64ToUint8Array(value.$b64));
				} catch {}
			},
			throw(error) {
				controller.error(error);
			},
			return() {
				try {
					controller.close();
				} catch {}
			}
		});
	} });
};
var FACTORY_BINARY = `(s=>new ReadableStream({start(c){s.on({next(b){try{const d=atob(b),a=new Uint8Array(d.length);for(let i=0;i<d.length;i++)a[i]=d.charCodeAt(i);c.enqueue(a)}catch(_){}},throw(e){c.error(e)},return(){try{c.close()}catch(_){}}})}}))`;
var FACTORY_TEXT = `(s=>{const e=new TextEncoder();return new ReadableStream({start(c){s.on({next(v){try{if(typeof v==='string'){c.enqueue(e.encode(v))}else{const d=atob(v.$b64),a=new Uint8Array(d.length);for(let i=0;i<d.length;i++)a[i]=d.charCodeAt(i);c.enqueue(a)}}catch(_){}},throw(x){c.error(x)},return(){try{c.close()}catch(_){}}})}})})`;
function toBinaryStream(readable) {
	const stream = createStream$1();
	const reader = readable.getReader();
	(async () => {
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					stream.return(void 0);
					break;
				}
				stream.next(uint8ArrayToBase64(value));
			}
		} catch (error) {
			stream.throw(error);
		} finally {
			reader.releaseLock();
		}
	})();
	return stream;
}
function toTextStream(readable) {
	const stream = createStream$1();
	const reader = readable.getReader();
	const decoder = new TextDecoder("utf-8", { fatal: true });
	(async () => {
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					try {
						const remaining = decoder.decode();
						if (remaining.length > 0) stream.next(remaining);
					} catch {}
					stream.return(void 0);
					break;
				}
				try {
					const text = decoder.decode(value, { stream: true });
					if (text.length > 0) stream.next(text);
				} catch {
					stream.next({ $b64: uint8ArrayToBase64(value) });
				}
			}
		} catch (error) {
			stream.throw(error);
		} finally {
			reader.releaseLock();
		}
	})();
	return stream;
}
/**
* SSR Plugin - uses base64 or UTF-8+base64 encoding for chunks, delegates to seroval's stream mechanism.
* Used during SSR when serializing to JavaScript code for HTML injection.
*
* Supports two modes based on RawStream hint:
* - 'binary': Always base64 encode (default)
* - 'text': Try UTF-8 first, fallback to base64 for invalid UTF-8
*/
var RawStreamSSRPlugin = /* @__PURE__ */ createPlugin({
	tag: "tss/RawStream",
	extends: [/* @__PURE__ */ createPlugin({
		tag: "tss/RawStreamFactory",
		test(value) {
			return value === RAW_STREAM_FACTORY_BINARY;
		},
		parse: {
			sync(_value, _ctx, _data) {
				return {};
			},
			async async(_value, _ctx, _data) {
				return {};
			},
			stream(_value, _ctx, _data) {
				return {};
			}
		},
		serialize(_node, _ctx, _data) {
			return FACTORY_BINARY;
		},
		deserialize(_node, _ctx, _data) {
			return RAW_STREAM_FACTORY_BINARY;
		}
	}), /* @__PURE__ */ createPlugin({
		tag: "tss/RawStreamFactoryText",
		test(value) {
			return value === RAW_STREAM_FACTORY_TEXT;
		},
		parse: {
			sync(_value, _ctx, _data) {
				return {};
			},
			async async(_value, _ctx, _data) {
				return {};
			},
			stream(_value, _ctx, _data) {
				return {};
			}
		},
		serialize(_node, _ctx, _data) {
			return FACTORY_TEXT;
		},
		deserialize(_node, _ctx, _data) {
			return RAW_STREAM_FACTORY_TEXT;
		}
	})],
	test(value) {
		return value instanceof RawStream;
	},
	parse: {
		sync(value, ctx, _data) {
			const factory = value.hint === "text" ? RAW_STREAM_FACTORY_TEXT : RAW_STREAM_FACTORY_BINARY;
			return {
				hint: ctx.parse(value.hint),
				factory: ctx.parse(factory),
				stream: ctx.parse(createStream$1())
			};
		},
		async async(value, ctx, _data) {
			const factory = value.hint === "text" ? RAW_STREAM_FACTORY_TEXT : RAW_STREAM_FACTORY_BINARY;
			const encodedStream = value.hint === "text" ? toTextStream(value.stream) : toBinaryStream(value.stream);
			return {
				hint: await ctx.parse(value.hint),
				factory: await ctx.parse(factory),
				stream: await ctx.parse(encodedStream)
			};
		},
		stream(value, ctx, _data) {
			const factory = value.hint === "text" ? RAW_STREAM_FACTORY_TEXT : RAW_STREAM_FACTORY_BINARY;
			const encodedStream = value.hint === "text" ? toTextStream(value.stream) : toBinaryStream(value.stream);
			return {
				hint: ctx.parse(value.hint),
				factory: ctx.parse(factory),
				stream: ctx.parse(encodedStream)
			};
		}
	},
	serialize(node, ctx, _data) {
		return "(" + ctx.serialize(node.factory) + ")(" + ctx.serialize(node.stream) + ")";
	},
	deserialize(node, ctx, _data) {
		const stream = ctx.deserialize(node.stream);
		return ctx.deserialize(node.hint) === "text" ? RAW_STREAM_FACTORY_CONSTRUCTOR_TEXT(stream) : RAW_STREAM_FACTORY_CONSTRUCTOR_BINARY(stream);
	}
});
/**
* Creates an RPC plugin instance that registers raw streams with a multiplexer.
* Used for server function responses where we want binary framing.
* Note: RPC always uses binary framing regardless of hint.
*
* @param onRawStream Callback invoked when a RawStream is encountered during serialization
*/
/* @__NO_SIDE_EFFECTS__ */
function createRawStreamRPCPlugin(onRawStream) {
	let nextStreamId = 1;
	return /* @__PURE__ */ createPlugin({
		tag: "tss/RawStream",
		test(value) {
			return value instanceof RawStream;
		},
		parse: {
			async async(value, ctx, _data) {
				const streamId = nextStreamId++;
				onRawStream(streamId, value.stream);
				return { streamId: await ctx.parse(streamId) };
			},
			stream(value, ctx, _data) {
				const streamId = nextStreamId++;
				onRawStream(streamId, value.stream);
				return { streamId: ctx.parse(streamId) };
			}
		},
		serialize() {
			throw new Error("RawStreamRPCPlugin.serialize should not be called. RPC uses JSON serialization, not JS code generation.");
		},
		deserialize() {
			throw new Error("RawStreamRPCPlugin.deserialize should not be called. Use createRawStreamDeserializePlugin on client.");
		}
	});
}
/**
* this plugin serializes only the `message` part of an Error
* this helps with serializing e.g. a ZodError which has functions attached that cannot be serialized
*/
var ShallowErrorPlugin = /* @__PURE__ */ createPlugin({
	tag: "$TSR/Error",
	test(value) {
		return value instanceof Error;
	},
	parse: {
		sync(value, ctx) {
			return { message: ctx.parse(value.message) };
		},
		async async(value, ctx) {
			return { message: await ctx.parse(value.message) };
		},
		stream(value, ctx) {
			return { message: ctx.parse(value.message) };
		}
	},
	serialize(node, ctx) {
		return "new Error(" + ctx.serialize(node.message) + ")";
	},
	deserialize(node, ctx) {
		return new Error(ctx.deserialize(node.message));
	}
});
var READABLE_STREAM_FACTORY = {};
var READABLE_STREAM_FACTORY_CONSTRUCTOR = (stream) => new ReadableStream({ start(controller) {
	stream.on({
		next(value) {
			try {
				controller.enqueue(value);
			} catch (_error) {}
		},
		throw(value) {
			controller.error(value);
		},
		return() {
			try {
				controller.close();
			} catch (_error) {}
		}
	});
} });
var ReadableStreamFactoryPlugin = /* @__PURE__ */ createPlugin({
	tag: "seroval-plugins/web/ReadableStreamFactory",
	test(value) {
		return value === READABLE_STREAM_FACTORY;
	},
	parse: {
		sync() {
			return READABLE_STREAM_FACTORY;
		},
		async async() {
			return await Promise.resolve(READABLE_STREAM_FACTORY);
		},
		stream() {
			return READABLE_STREAM_FACTORY;
		}
	},
	serialize() {
		return READABLE_STREAM_FACTORY_CONSTRUCTOR.toString();
	},
	deserialize() {
		return READABLE_STREAM_FACTORY;
	}
});
async function drainStream(stream, reader) {
	try {
		const result = await reader.read();
		if (result.done) {
			stream.return(result.value);
			reader.releaseLock();
		} else {
			stream.next(result.value);
			await drainStream(stream, reader);
		}
	} catch (error) {
		stream.throw(error);
	}
}
function cleanupStream(reader) {
	reader.cancel().catch(() => {});
	reader.releaseLock();
}
function toStream(value) {
	const stream = createStream$1();
	const reader = value.getReader();
	const cleanup = cleanupStream.bind(null, reader);
	drainStream(stream, reader).catch(cleanup);
	return [stream, cleanup];
}
var defaultSerovalPlugins = [
	ShallowErrorPlugin,
	RawStreamSSRPlugin,
	/* @__PURE__ */ createPlugin({
		tag: "seroval/plugins/web/ReadableStream",
		extends: [ReadableStreamFactoryPlugin],
		test(value) {
			if (typeof ReadableStream === "undefined") return false;
			return value instanceof ReadableStream;
		},
		parse: {
			sync(_value, ctx) {
				return {
					factory: ctx.parse(READABLE_STREAM_FACTORY),
					stream: ctx.parse(createStream$1())
				};
			},
			async async(value, ctx) {
				return {
					factory: await ctx.parse(READABLE_STREAM_FACTORY),
					stream: await ctx.parse(toStream(value)[0])
				};
			},
			stream(value, ctx) {
				const [stream, cleanup] = toStream(value);
				ctx.addCleanup(cleanup);
				return {
					factory: ctx.parse(READABLE_STREAM_FACTORY),
					stream: ctx.parse(stream)
				};
			}
		},
		serialize(node, ctx) {
			return "(" + ctx.serialize(node.factory) + ")(" + ctx.serialize(node.stream) + ")";
		},
		deserialize(node, ctx) {
			return READABLE_STREAM_FACTORY_CONSTRUCTOR(ctx.deserialize(node.stream));
		}
	})
];
/**
* @description Returns the router manifest data that should be sent to the client.
* This includes only the assets and preloads for the current route and any
* special assets that are needed for the client. It does not include relationships
* between routes or any other data that is not needed for the client.
*
* @param matchedRoutes - In dev mode, the matched routes are used to build
* the dev styles URL for route-scoped CSS collection.
*/
async function getStartManifest(matchedRoutes) {
	const { tsrStartManifest } = await import("../_tanstack-start-manifest_v-DMMSdzUi.mjs");
	const startManifest = tsrStartManifest();
	let routes = startManifest.routes;
	routes[rootRouteId];
	const manifestRoutes = {};
	for (const k in routes) {
		const v = routes[k];
		const result = {};
		if (v.preloads && v.preloads.length > 0) result.preloads = v.preloads;
		if (v.scripts && v.scripts.length > 0) result.scripts = v.scripts;
		if (v.css?.length) result.css = v.css;
		if (result.preloads || result.scripts || result.css) manifestRoutes[k] = result;
	}
	return {
		...startManifest.scriptFormat ? { scriptFormat: startManifest.scriptFormat } : {},
		...startManifest.inlineCss ? { inlineCss: startManifest.inlineCss } : {},
		routes: manifestRoutes
	};
}
var manifest = {};
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ?? await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
var TSS_FORMDATA_CONTEXT = "__TSS_CONTEXT";
var TSS_SERVER_FUNCTION = Symbol.for("TSS_SERVER_FUNCTION");
var X_TSS_SERIALIZED = "x-tss-serialized";
var X_TSS_RAW_RESPONSE = "x-tss-raw";
/** Content-Type for multiplexed framed responses (RawStream support) */
var TSS_CONTENT_TYPE_FRAMED = "application/x-tss-framed";
/**
* Frame types for binary multiplexing protocol.
*/
var FrameType = {
	/** Seroval JSON chunk (NDJSON line) */
	JSON: 0,
	/** Raw stream data chunk */
	CHUNK: 1,
	/** Raw stream end (EOF) */
	END: 2,
	/** Raw stream error */
	ERROR: 3
};
/** Full Content-Type header value with version parameter */
var TSS_CONTENT_TYPE_FRAMED_VERSIONED = `${TSS_CONTENT_TYPE_FRAMED}; v=1`;
function isSafeKey(key) {
	return key !== "__proto__" && key !== "constructor" && key !== "prototype";
}
/**
* Merge target and source into a new null-proto object, filtering dangerous keys.
*/
function safeObjectMerge(target, source) {
	const result = Object.create(null);
	if (target) {
		for (const key of Object.keys(target)) if (isSafeKey(key)) result[key] = target[key];
	}
	if (source && typeof source === "object") {
		for (const key of Object.keys(source)) if (isSafeKey(key)) result[key] = source[key];
	}
	return result;
}
/**
* Create a null-prototype object, optionally copying from source.
*/
function createNullProtoObject(source) {
	if (!source) return Object.create(null);
	const obj = Object.create(null);
	for (const key of Object.keys(source)) if (isSafeKey(key)) obj[key] = source[key];
	return obj;
}
var GLOBAL_STORAGE_KEY = Symbol.for("tanstack-start:start-storage-context");
var globalObj = globalThis;
if (!globalObj[GLOBAL_STORAGE_KEY]) globalObj[GLOBAL_STORAGE_KEY] = new AsyncLocalStorage();
var startStorage = globalObj[GLOBAL_STORAGE_KEY];
async function runWithStartContext(context, fn) {
	return startStorage.run(context, fn);
}
function getStartContext(opts) {
	const context = startStorage.getStore();
	if (!context && opts?.throwIfNotFound !== false) throw new Error(`No Start context found in AsyncLocalStorage. Make sure you are using the function within the server runtime.`);
	return context;
}
var getStartOptions = () => getStartContext().startOptions;
function splitSetCookieString(cookiesString) {
	if (Array.isArray(cookiesString)) return cookiesString.flatMap((c) => splitSetCookieString(c));
	if (typeof cookiesString !== "string") return [];
	const cookiesStrings = [];
	let pos = 0;
	let start;
	let ch;
	let lastComma;
	let nextStart;
	let cookiesSeparatorFound;
	const skipWhitespace = () => {
		while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) pos += 1;
		return pos < cookiesString.length;
	};
	const notSpecialChar = () => {
		ch = cookiesString.charAt(pos);
		return ch !== "=" && ch !== ";" && ch !== ",";
	};
	while (pos < cookiesString.length) {
		start = pos;
		cookiesSeparatorFound = false;
		while (skipWhitespace()) {
			ch = cookiesString.charAt(pos);
			if (ch === ",") {
				lastComma = pos;
				pos += 1;
				skipWhitespace();
				nextStart = pos;
				while (pos < cookiesString.length && notSpecialChar()) pos += 1;
				if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
					cookiesSeparatorFound = true;
					pos = nextStart;
					cookiesStrings.push(cookiesString.slice(start, lastComma));
					start = pos;
				} else pos = lastComma + 1;
			} else pos += 1;
		}
		if (!cookiesSeparatorFound || pos >= cookiesString.length) cookiesStrings.push(cookiesString.slice(start));
	}
	return cookiesStrings;
}
function toHeadersInstance(init) {
	if (init instanceof Headers) return init;
	else if (Array.isArray(init)) return new Headers(init);
	else if (typeof init === "object") return new Headers(init);
	else return null;
}
function mergeHeaders$2(...headers) {
	return headers.reduce((acc, header) => {
		const headersInstance = toHeadersInstance(header);
		if (!headersInstance) return acc;
		for (const [key, value] of headersInstance.entries()) if (key === "set-cookie") splitSetCookieString(value).forEach((cookie) => acc.append("set-cookie", cookie));
		else acc.set(key, value);
		return acc;
	}, new Headers());
}
function flattenMiddlewares(middlewares, maxDepth = 100) {
	const seen = /* @__PURE__ */ new Set();
	const flattened = [];
	const recurse = (middleware, depth) => {
		if (depth > maxDepth) throw new Error(`Middleware nesting depth exceeded maximum of ${maxDepth}. Check for circular references.`);
		middleware.forEach((m) => {
			if (m.options.middleware) recurse(m.options.middleware, depth + 1);
			if (!seen.has(m)) {
				seen.add(m);
				flattened.push(m);
			}
		});
	};
	recurse(middlewares, 0);
	return flattened;
}
var createMiddleware = (options, __opts) => {
	const resolvedOptions = {
		type: "request",
		...__opts || options
	};
	const setValidator = (validator) => {
		return createMiddleware({}, Object.assign(resolvedOptions, {
			validator,
			inputValidator: validator
		}));
	};
	return {
		options: resolvedOptions,
		middleware: (middleware) => {
			return createMiddleware({}, Object.assign(resolvedOptions, { middleware }));
		},
		validator: setValidator,
		inputValidator: setValidator,
		client: (client) => {
			return createMiddleware({}, Object.assign(resolvedOptions, { client }));
		},
		server: (server) => {
			return createMiddleware({}, Object.assign(resolvedOptions, { server }));
		}
	};
};
var innerCreateCsrfMiddleware = (opts = {}) => {
	return createMiddleware().server(async (ctx) => {
		const csrfCtx = ctx;
		if (opts.filter && !await opts.filter(csrfCtx)) return ctx.next();
		if (await isCsrfRequestAllowed(opts, csrfCtx)) return ctx.next();
		return getFailureResponse(opts, csrfCtx);
	});
};
var createCsrfMiddleware = innerCreateCsrfMiddleware;
async function isCsrfRequestAllowed(opts, ctx) {
	const result = await getCsrfRequestValidationResult(opts, ctx);
	return result === true || result === void 0 && opts.allowRequestsWithoutOriginCheck === true;
}
async function getCsrfRequestValidationResult(opts, ctx) {
	const fetchSite = ctx.request.headers.get("Sec-Fetch-Site");
	if (fetchSite !== null) return matchValue(opts.secFetchSite ?? "same-origin", fetchSite, ctx);
	const origin = ctx.request.headers.get("Origin");
	if (origin !== null) {
		if (opts.origin) return matchValue(opts.origin, origin, ctx);
		return origin === new URL(ctx.request.url).origin;
	}
	const referer = ctx.request.headers.get("Referer");
	if (referer === null || opts.referer === false) return;
	if (typeof opts.referer === "function") return opts.referer(referer, ctx);
	if (opts.origin) {
		const refererOrigin = getOriginFromUrl(referer);
		return refererOrigin !== void 0 && matchValue(opts.origin, refererOrigin, ctx);
	}
	return isRefererSameOrigin(referer, new URL(ctx.request.url).origin);
}
async function matchValue(matcher, value, ctx) {
	if (typeof matcher === "function") return matcher(value, ctx);
	if (Array.isArray(matcher)) return matcher.includes(value);
	return value === matcher;
}
function getOriginFromUrl(url) {
	try {
		return new URL(url).origin;
	} catch {
		return;
	}
}
function isRefererSameOrigin(referer, requestOrigin) {
	if (referer === requestOrigin) return true;
	if (!referer.startsWith(requestOrigin)) return false;
	if (referer.length === requestOrigin.length) return true;
	const code = referer.charCodeAt(requestOrigin.length);
	return code === 47 || code === 63 || code === 35;
}
async function getFailureResponse(opts, ctx) {
	if (typeof opts.failureResponse === "function") return opts.failureResponse(ctx);
	return opts.failureResponse?.clone() ?? new Response("Forbidden", { status: 403 });
}
function getDefaultSerovalPlugins() {
	return [...(getStartOptions()?.serializationAdapters)?.map(makeSerovalPlugin) ?? [], ...defaultSerovalPlugins];
}
/**
* Binary frame protocol for multiplexing JSON and raw streams over HTTP.
*
* Frame format: [type:1][streamId:4][length:4][payload:length]
* - type: 1 byte - frame type (JSON, CHUNK, END, ERROR)
* - streamId: 4 bytes big-endian uint32 - stream identifier
* - length: 4 bytes big-endian uint32 - payload length
* - payload: variable length bytes
*/
/** Cached TextEncoder for frame encoding */
var textEncoder$3 = new TextEncoder();
/** Shared empty payload for END frames - avoids allocation per call */
var EMPTY_PAYLOAD = /* @__PURE__ */ new Uint8Array(0);
/**
* Encodes a single frame with header and payload.
*/
function encodeFrame(type, streamId, payload) {
	const frame = new Uint8Array(9 + payload.length);
	frame[0] = type;
	frame[1] = streamId >>> 24 & 255;
	frame[2] = streamId >>> 16 & 255;
	frame[3] = streamId >>> 8 & 255;
	frame[4] = streamId & 255;
	frame[5] = payload.length >>> 24 & 255;
	frame[6] = payload.length >>> 16 & 255;
	frame[7] = payload.length >>> 8 & 255;
	frame[8] = payload.length & 255;
	frame.set(payload, 9);
	return frame;
}
/**
* Encodes a JSON frame (type 0, streamId 0).
*/
function encodeJSONFrame(json) {
	return encodeFrame(FrameType.JSON, 0, textEncoder$3.encode(json));
}
/**
* Encodes a raw stream chunk frame.
*/
function encodeChunkFrame(streamId, chunk) {
	return encodeFrame(FrameType.CHUNK, streamId, chunk);
}
/**
* Encodes a raw stream end frame.
*/
function encodeEndFrame(streamId) {
	return encodeFrame(FrameType.END, streamId, EMPTY_PAYLOAD);
}
/**
* Encodes a raw stream error frame.
*/
function encodeErrorFrame(streamId, error) {
	const message = error instanceof Error ? error.message : String(error ?? "Unknown error");
	return encodeFrame(FrameType.ERROR, streamId, textEncoder$3.encode(message));
}
/**
* Creates a multiplexed ReadableStream from JSON stream and raw streams.
*
* The JSON stream emits NDJSON lines (from seroval's toCrossJSONStream).
* Raw streams are pumped concurrently, interleaved with JSON frames.
*
* Supports late stream registration for RawStreams discovered after initial
* serialization (e.g., from resolved Promises).
*
* @param jsonStream Stream of JSON strings (each string is one NDJSON line)
* @param rawStreams Map of stream IDs to raw binary streams (known at start)
* @param lateStreamSource Optional stream of late registrations for streams discovered later
*/
function createMultiplexedStream(jsonStream, rawStreams, lateStreamSource) {
	let controller;
	let cancelled = false;
	const readers = [];
	const enqueue = (frame) => {
		if (cancelled) return false;
		try {
			controller.enqueue(frame);
			return true;
		} catch {
			return false;
		}
	};
	const errorOutput = (error) => {
		if (cancelled) return;
		cancelled = true;
		try {
			controller.error(error);
		} catch {}
		for (const reader of readers) reader.cancel().catch(() => {});
	};
	async function pumpRawStream(streamId, stream) {
		const reader = stream.getReader();
		readers.push(reader);
		try {
			while (!cancelled) {
				const { done, value } = await reader.read();
				if (done) {
					enqueue(encodeEndFrame(streamId));
					return;
				}
				if (!enqueue(encodeChunkFrame(streamId, value))) return;
			}
		} catch (error) {
			enqueue(encodeErrorFrame(streamId, error));
		} finally {
			reader.releaseLock();
		}
	}
	async function pumpJSON() {
		const reader = jsonStream.getReader();
		readers.push(reader);
		try {
			while (!cancelled) {
				const { done, value } = await reader.read();
				if (done) return;
				if (!enqueue(encodeJSONFrame(value))) return;
			}
		} catch (error) {
			errorOutput(error);
			throw error;
		} finally {
			reader.releaseLock();
		}
	}
	async function pumpLateStreams() {
		if (!lateStreamSource) return [];
		const lateStreamPumps = [];
		const reader = lateStreamSource.getReader();
		readers.push(reader);
		try {
			while (!cancelled) {
				const { done, value } = await reader.read();
				if (done) break;
				lateStreamPumps.push(pumpRawStream(value.id, value.stream));
			}
		} finally {
			reader.releaseLock();
		}
		return lateStreamPumps;
	}
	return new ReadableStream({
		async start(ctrl) {
			controller = ctrl;
			const pumps = [pumpJSON()];
			for (const [streamId, stream] of rawStreams) pumps.push(pumpRawStream(streamId, stream));
			if (lateStreamSource) pumps.push(pumpLateStreams());
			try {
				const latePumps = (await Promise.all(pumps)).find(Array.isArray);
				if (latePumps && latePumps.length > 0) await Promise.all(latePumps);
				if (!cancelled) try {
					controller.close();
				} catch {}
			} catch {}
		},
		cancel() {
			cancelled = true;
			for (const reader of readers) reader.cancel().catch(() => {});
			readers.length = 0;
		}
	});
}
var serovalPlugins = void 0;
var FORM_DATA_CONTENT_TYPES = ["multipart/form-data", "application/x-www-form-urlencoded"];
var MAX_PAYLOAD_SIZE = 1e6;
var handleServerAction = async ({ request, context, serverFnId }) => {
	const methodUpper = request.method.toUpperCase();
	const url = new URL(request.url);
	const action = await getServerFnById(serverFnId, { origin: "client" });
	if (action.method && methodUpper !== action.method) return new Response(`expected ${action.method} method. Got ${methodUpper}`, {
		status: 405,
		headers: { Allow: action.method }
	});
	const isServerFn = request.headers.get("x-tsr-serverFn") === "true";
	if (!serovalPlugins) serovalPlugins = getDefaultSerovalPlugins();
	const contentType = request.headers.get("Content-Type");
	function parsePayload(payload) {
		return fromJSON(payload, { plugins: serovalPlugins });
	}
	return await (async () => {
		try {
			let res = await (async () => {
				if (FORM_DATA_CONTENT_TYPES.some((type) => contentType && contentType.includes(type))) {
					if (methodUpper === "GET") invariant();
					const formData = await request.formData();
					const serializedContext = formData.get(TSS_FORMDATA_CONTEXT);
					formData.delete(TSS_FORMDATA_CONTEXT);
					const params = {
						context,
						data: formData,
						method: methodUpper
					};
					if (typeof serializedContext === "string") try {
						const deserializedContext = fromJSON(JSON.parse(serializedContext), { plugins: serovalPlugins });
						if (typeof deserializedContext === "object" && deserializedContext) params.context = safeObjectMerge(deserializedContext, context);
					} catch (e) {}
					return await action(params);
				}
				if (methodUpper === "GET") {
					const payloadParam = url.searchParams.get("payload");
					if (payloadParam && payloadParam.length > MAX_PAYLOAD_SIZE) throw new Error("Payload too large");
					const payload = payloadParam ? parsePayload(JSON.parse(payloadParam)) : {};
					payload.context = safeObjectMerge(payload.context, context);
					payload.method = methodUpper;
					return await action(payload);
				}
				let jsonPayload;
				if (contentType?.includes("application/json")) jsonPayload = await request.json();
				const payload = jsonPayload ? parsePayload(jsonPayload) : {};
				payload.context = safeObjectMerge(payload.context, context);
				payload.method = methodUpper;
				return await action(payload);
			})();
			const unwrapped = res.result || res.error;
			if (isNotFound(res)) res = isNotFoundResponse(res);
			if (!isServerFn) return unwrapped;
			if (unwrapped instanceof Response) {
				if (isRedirect(unwrapped)) return unwrapped;
				unwrapped.headers.set(X_TSS_RAW_RESPONSE, "true");
				return unwrapped;
			}
			return serializeResult(res);
			function serializeResult(res) {
				let nonStreamingBody = void 0;
				const alsResponse = getResponse();
				if (res !== void 0) {
					const rawStreams = /* @__PURE__ */ new Map();
					let initialPhase = true;
					let lateStreamWriter;
					let lateStreamReadable = void 0;
					const pendingLateStreams = [];
					const plugins = [/* @__PURE__ */ createRawStreamRPCPlugin((id, stream) => {
						if (initialPhase) {
							rawStreams.set(id, stream);
							return;
						}
						if (lateStreamWriter) {
							lateStreamWriter.write({
								id,
								stream
							}).catch(() => {});
							return;
						}
						pendingLateStreams.push({
							id,
							stream
						});
					}), ...serovalPlugins || []];
					let done = false;
					const callbacks = {
						onParse: (value) => {
							nonStreamingBody = value;
						},
						onDone: () => {
							done = true;
						},
						onError: (error) => {
							throw error;
						}
					};
					toCrossJSONStream(res, {
						refs: /* @__PURE__ */ new Map(),
						plugins,
						onParse(value) {
							callbacks.onParse(value);
						},
						onDone() {
							callbacks.onDone();
						},
						onError: (error) => {
							callbacks.onError(error);
						}
					});
					initialPhase = false;
					if (done && rawStreams.size === 0) return new Response(nonStreamingBody ? JSON.stringify(nonStreamingBody) : void 0, {
						status: alsResponse.status,
						statusText: alsResponse.statusText,
						headers: {
							"Content-Type": "application/json",
							[X_TSS_SERIALIZED]: "true"
						}
					});
					const { readable, writable } = new TransformStream();
					lateStreamReadable = readable;
					lateStreamWriter = writable.getWriter();
					for (const registration of pendingLateStreams) lateStreamWriter.write(registration).catch(() => {});
					pendingLateStreams.length = 0;
					const multiplexedStream = createMultiplexedStream(new ReadableStream({
						start(controller) {
							callbacks.onParse = (value) => {
								controller.enqueue(JSON.stringify(value) + "\n");
							};
							callbacks.onDone = () => {
								try {
									controller.close();
								} catch {}
								lateStreamWriter?.close().catch(() => {}).finally(() => {
									lateStreamWriter = void 0;
								});
							};
							callbacks.onError = (error) => {
								controller.error(error);
								lateStreamWriter?.abort(error).catch(() => {}).finally(() => {
									lateStreamWriter = void 0;
								});
							};
							if (nonStreamingBody !== void 0) callbacks.onParse(nonStreamingBody);
							if (done) callbacks.onDone();
						},
						cancel() {
							lateStreamWriter?.abort().catch(() => {});
							lateStreamWriter = void 0;
						}
					}), rawStreams, lateStreamReadable);
					return new Response(multiplexedStream, {
						status: alsResponse.status,
						statusText: alsResponse.statusText,
						headers: {
							"Content-Type": TSS_CONTENT_TYPE_FRAMED_VERSIONED,
							[X_TSS_SERIALIZED]: "true"
						}
					});
				}
				return new Response(void 0, {
					status: alsResponse.status,
					statusText: alsResponse.statusText
				});
			}
		} catch (error) {
			if (error instanceof Response) return error;
			if (isNotFound(error)) return isNotFoundResponse(error);
			console.info();
			console.info("Server Fn Error!");
			console.info();
			console.error(error);
			console.info();
			const serializedError = JSON.stringify(await Promise.resolve(toCrossJSONAsync(error, {
				refs: /* @__PURE__ */ new Map(),
				plugins: serovalPlugins
			})));
			const response = getResponse();
			return new Response(serializedError, {
				status: response.status ?? 500,
				statusText: response.statusText,
				headers: {
					"Content-Type": "application/json",
					[X_TSS_SERIALIZED]: "true"
				}
			});
		}
	})();
};
function isNotFoundResponse(error) {
	const { headers, ...rest } = error;
	return new Response(JSON.stringify(rest), {
		status: 404,
		headers: {
			"Content-Type": "application/json",
			...headers || {}
		}
	});
}
var LINK_PARAM_TOKEN_RE = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
var PRELOAD_AS_VALUES = /* @__PURE__ */ new Set([
	"fetch",
	"font",
	"image",
	"script",
	"style",
	"track"
]);
function buildLinkParam(name, value) {
	if (value === void 0) return name;
	if (LINK_PARAM_TOKEN_RE.test(value)) return `${name}=${value}`;
	return `${name}=${JSON.stringify(value)}`;
}
function serializeEarlyHint(hint) {
	const parts = [`<${hint.href}>`, buildLinkParam("rel", hint.rel)];
	if (hint.as) parts.push(buildLinkParam("as", hint.as));
	if (hint.crossOrigin !== void 0) parts.push(buildLinkParam("crossorigin", hint.crossOrigin || void 0));
	if (hint.type) parts.push(buildLinkParam("type", hint.type));
	if (hint.integrity) parts.push(buildLinkParam("integrity", hint.integrity));
	if (hint.referrerPolicy) parts.push(buildLinkParam("referrerpolicy", hint.referrerPolicy));
	if (hint.fetchPriority) parts.push(buildLinkParam("fetchpriority", hint.fetchPriority));
	return parts.join("; ");
}
function getStringAttr(attrs, name, fallbackName) {
	const value = attrs?.[name] ?? (fallbackName ? attrs?.[fallbackName] : void 0);
	return typeof value === "string" ? value : void 0;
}
function getPreloadAs(attrs) {
	const as = getStringAttr(attrs, "as");
	return as && PRELOAD_AS_VALUES.has(as) ? as : void 0;
}
function addEarlyHintFetchAttrs(hint, attrs) {
	const crossOrigin = getStringAttr(attrs, "crossOrigin", "crossorigin");
	const type = getStringAttr(attrs, "type");
	const integrity = getStringAttr(attrs, "integrity");
	const referrerPolicy = getStringAttr(attrs, "referrerPolicy", "referrerpolicy");
	const fetchPriority = getStringAttr(attrs, "fetchPriority", "fetchpriority");
	if (crossOrigin !== void 0) hint.crossOrigin = crossOrigin;
	if (type) hint.type = type;
	if (integrity) hint.integrity = integrity;
	if (referrerPolicy) hint.referrerPolicy = referrerPolicy;
	if (fetchPriority) hint.fetchPriority = fetchPriority;
}
function linkAttrsToEarlyHint(attrs) {
	const href = getStringAttr(attrs, "href");
	const rel = getStringAttr(attrs, "rel");
	if (!href || !rel) return void 0;
	const relTokens = rel.split(/\s+/);
	let hintRel;
	let hintAs;
	if (relTokens.includes("modulepreload")) {
		hintRel = "modulepreload";
		hintAs = "script";
	} else if (relTokens.includes("stylesheet")) {
		hintRel = "preload";
		hintAs = "style";
	} else if (relTokens.includes("preload")) {
		hintAs = getPreloadAs(attrs);
		if (!hintAs) return void 0;
		hintRel = "preload";
	} else if (relTokens.includes("preconnect")) {
		hintRel = "preconnect";
		hintAs = void 0;
	} else if (relTokens.includes("dns-prefetch")) {
		hintRel = "dns-prefetch";
		hintAs = void 0;
	}
	if (!hintRel) return void 0;
	const hint = {
		href,
		rel: hintRel
	};
	if (hintAs) hint.as = hintAs;
	addEarlyHintFetchAttrs(hint, attrs);
	return hint;
}
function collectStaticHintsFromManifest(manifest, matchedRoutes) {
	const hints = [];
	for (const route of matchedRoutes) {
		const routeManifest = manifest.routes[route.id];
		if (!routeManifest) continue;
		for (const link of routeManifest.preloads ?? []) {
			const attrs = getScriptPreloadAttrs(manifest, link);
			const hint = {
				href: attrs.href,
				rel: attrs.rel,
				as: "script"
			};
			if (attrs.crossOrigin !== void 0) hint.crossOrigin = attrs.crossOrigin;
			hints.push(hint);
		}
		for (const link of routeManifest.css ?? []) {
			const stylesheetHref = getStylesheetHref(link);
			if (manifest.inlineCss?.styles[stylesheetHref] !== void 0) continue;
			const resolvedLink = resolveManifestCssLink(link);
			const hint = {
				href: stylesheetHref,
				rel: "preload",
				as: "style"
			};
			if (resolvedLink.crossOrigin !== void 0) hint.crossOrigin = resolvedLink.crossOrigin;
			hints.push(hint);
		}
	}
	return hints;
}
function collectDynamicHintsFromMatches(matches) {
	const hints = [];
	for (const match of matches) {
		const links = match.links;
		if (!Array.isArray(links)) continue;
		for (const link of links) {
			const hint = linkAttrsToEarlyHint(link);
			if (hint) hints.push(hint);
		}
	}
	return hints;
}
function createEarlyHintsEvent(opts) {
	const nextHints = [];
	const nextLinks = [];
	for (const hint of opts.hints) {
		const link = serializeEarlyHint(hint);
		if (opts.sentLinks.has(link)) continue;
		opts.sentLinks.add(link);
		opts.sentHints.push(hint);
		nextHints.push(hint);
		nextLinks.push(link);
	}
	if (!nextHints.length && opts.phase !== "dynamic") return void 0;
	return {
		phase: opts.phase,
		hints: nextHints,
		links: nextLinks,
		allHints: opts.sentHints.slice(),
		allLinks: Array.from(opts.sentLinks)
	};
}
function createResponseLinkHeaderEntries(opts) {
	for (const hint of opts.hints) {
		const link = serializeEarlyHint(hint);
		if (opts.sentLinks.has(link)) continue;
		opts.sentLinks.add(link);
		opts.entries.push({
			phase: opts.phase,
			hint,
			link
		});
	}
}
function getResponseLinkHeaderEntries(opts) {
	if (!opts.filter) return opts.entries.map((entry) => entry.link);
	try {
		const links = [];
		for (const entry of opts.entries) if (opts.filter(entry)) links.push(entry.link);
		return links;
	} catch (err) {
		console.error("Error filtering response Link headers:", err);
		return [];
	}
}
function notifyEarlyHints(phase, event, onEarlyHints) {
	try {
		const result = onEarlyHints(event);
		if (result) Promise.resolve(result).catch((err) => {
			console.error(`Error sending ${phase} early hints:`, err);
		});
	} catch (err) {
		console.error(`Error sending ${phase} early hints:`, err);
	}
}
function getResponseLinkHeaderFilter(responseLinkHeader) {
	if (typeof responseLinkHeader !== "object") return;
	return responseLinkHeader.filter;
}
function appendResponseLinkHeaders(opts) {
	for (const link of getResponseLinkHeaderEntries(opts)) opts.responseHeaders.append("Link", link);
}
function collectResponseLinkHeaderEntries(opts) {
	for (let index = 0; index < opts.event.hints.length; index++) opts.entries.push({
		phase: opts.phase,
		hint: opts.event.hints[index],
		link: opts.event.links[index]
	});
}
function collectEarlyHintsPhase(opts) {
	const event = opts.onEarlyHints ? createEarlyHintsEvent({
		phase: opts.phase,
		hints: opts.hints,
		sentLinks: opts.sentLinks,
		sentHints: opts.sentHints
	}) : void 0;
	if (event) notifyEarlyHints(opts.phase, event, opts.onEarlyHints);
	if (!opts.responseLinkHeaderEntries) return;
	if (event) {
		collectResponseLinkHeaderEntries({
			phase: opts.phase,
			event,
			entries: opts.responseLinkHeaderEntries
		});
		return;
	}
	createResponseLinkHeaderEntries({
		phase: opts.phase,
		hints: opts.hints,
		sentLinks: opts.sentLinks,
		entries: opts.responseLinkHeaderEntries
	});
}
function createEarlyHintsCollector(opts) {
	if (!opts?.onEarlyHints && !opts?.responseLinkHeader) return;
	const sentLinks = /* @__PURE__ */ new Set();
	const sentHints = opts.onEarlyHints ? new Array() : void 0;
	const responseLinkHeaderEntries = opts.responseLinkHeader ? new Array() : void 0;
	const responseLinkHeaderFilter = getResponseLinkHeaderFilter(opts.responseLinkHeader);
	return {
		collectStatic: ({ manifest, matchedRoutes }) => {
			if (!matchedRoutes?.length) return;
			collectEarlyHintsPhase({
				phase: "static",
				hints: collectStaticHintsFromManifest(manifest, matchedRoutes),
				sentLinks,
				sentHints,
				onEarlyHints: opts.onEarlyHints,
				responseLinkHeaderEntries
			});
		},
		collectDynamic: (matches) => {
			collectEarlyHintsPhase({
				phase: "dynamic",
				hints: collectDynamicHintsFromMatches(matches),
				sentLinks,
				sentHints,
				onEarlyHints: opts.onEarlyHints,
				responseLinkHeaderEntries
			});
		},
		appendResponseHeaders: (headers) => {
			if (!responseLinkHeaderEntries?.length) return;
			appendResponseLinkHeaders({
				responseHeaders: headers,
				entries: responseLinkHeaderEntries,
				filter: responseLinkHeaderFilter
			});
		}
	};
}
function normalizeTransformAssetResult(result) {
	if (typeof result === "string") return { href: result };
	return result;
}
function escapeCssString(value) {
	return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\a ").replace(/\r/g, "\\d ").replace(/\f/g, "\\c ");
}
async function transformInlineCssTemplate(options) {
	const { strings, urls } = options.template;
	if (strings.length !== urls.length + 1) throw new Error(`TanStack Start inlineCss template for ${options.stylesheetHref} is invalid`);
	let css = strings[0];
	for (let index = 0; index < urls.length; index++) {
		const transformed = normalizeTransformAssetResult(await options.transformFn({
			kind: "css-url",
			url: urls[index],
			stylesheetHref: options.stylesheetHref
		}));
		css += escapeCssString(transformed.href) + strings[index + 1];
	}
	return css;
}
async function transformInlineCssStyles(inlineCss, transformFn) {
	const transformedStyles = {};
	const transformedEntries = await Promise.all(Object.entries(inlineCss.styles).map(async ([stylesheetHref, css]) => {
		const template = inlineCss.templates?.[stylesheetHref];
		return [stylesheetHref, template ? await transformInlineCssTemplate({
			stylesheetHref,
			template,
			transformFn
		}) : css];
	}));
	for (const [stylesheetHref, css] of transformedEntries) transformedStyles[stylesheetHref] = css;
	return {
		styles: transformedStyles,
		...inlineCss.templates ? { templates: inlineCss.templates } : {}
	};
}
function resolveTransformAssetsCrossOrigin(config, kind) {
	if (!config) return void 0;
	if (typeof config === "string") return config;
	return config[kind];
}
function isObjectShorthand(transform) {
	return "prefix" in transform;
}
function resolveTransformAssetsConfig(transform) {
	if (typeof transform === "string") {
		const prefix = transform;
		return {
			type: "transform",
			transformFn: ({ url }) => ({ href: `${prefix}${url}` }),
			cache: true
		};
	}
	if (typeof transform === "function") return {
		type: "transform",
		transformFn: transform,
		cache: true
	};
	if (isObjectShorthand(transform)) {
		const { prefix, crossOrigin } = transform;
		return {
			type: "transform",
			transformFn: ({ url, kind }) => {
				const href = `${prefix}${url}`;
				if (kind === "css-url") return { href };
				const co = resolveTransformAssetsCrossOrigin(crossOrigin, kind);
				return co ? {
					href,
					crossOrigin: co
				} : { href };
			},
			cache: true
		};
	}
	if ("createTransform" in transform && transform.createTransform) return {
		type: "createTransform",
		createTransform: transform.createTransform,
		cache: transform.cache !== false
	};
	return {
		type: "transform",
		transformFn: typeof transform.transform === "string" ? (({ url }) => ({ href: `${transform.transform}${url}` })) : transform.transform,
		cache: transform.cache !== false
	};
}
function assignManifestLink(link, next) {
	if (typeof link === "string") return next.crossOrigin ? next : next.href;
	const nextLink = {
		...link,
		href: next.href
	};
	if (next.crossOrigin) nextLink.crossOrigin = next.crossOrigin;
	else delete nextLink.crossOrigin;
	return nextLink;
}
async function transformManifestAssets(source, transformFn, _opts) {
	const manifest = structuredClone(source);
	const inlineCssEnabled = _opts?.inlineCss !== false;
	const scriptTransforms = /* @__PURE__ */ new Map();
	const transformScript = (url) => {
		const cached = scriptTransforms.get(url);
		if (cached) return cached;
		const transformed = Promise.resolve(transformFn({
			url,
			kind: "script"
		})).then(normalizeTransformAssetResult);
		scriptTransforms.set(url, transformed);
		return transformed;
	};
	if (!inlineCssEnabled) delete manifest.inlineCss;
	else if (manifest.inlineCss) manifest.inlineCss = await transformInlineCssStyles(manifest.inlineCss, transformFn);
	for (const route of Object.values(manifest.routes)) {
		if (route.preloads?.length) route.preloads = await Promise.all(route.preloads.map(async (link) => {
			const result = await transformScript(resolveManifestAssetLink(link).href);
			return assignManifestLink(link, {
				href: result.href,
				crossOrigin: result.crossOrigin
			});
		}));
		if (route.css?.length && !manifest.inlineCss) route.css = await Promise.all(route.css.map(async (link) => {
			const result = normalizeTransformAssetResult(await transformFn({
				url: resolveManifestCssLink(link).href,
				kind: "stylesheet"
			}));
			return assignManifestLink(link, {
				href: result.href,
				crossOrigin: result.crossOrigin
			});
		}));
		if (route.scripts?.length) for (const script of route.scripts) {
			const src = script.attrs?.src;
			if (typeof src !== "string") continue;
			const result = await transformScript(src);
			script.attrs = {
				...script.attrs,
				src: result.href
			};
			if (result.crossOrigin) script.attrs.crossOrigin = result.crossOrigin;
			else delete script.attrs.crossOrigin;
		}
	}
	return manifest;
}
/**
* Builds a final ServerManifest without URL transforms. Used when no
* transformAssets option is provided.
*
* Returns a new manifest object so the cached base manifest is never mutated.
*/
function buildManifest(source, opts) {
	return {
		...source.scriptFormat ? { scriptFormat: source.scriptFormat } : {},
		...opts?.inlineCss !== false && source.inlineCss ? { inlineCss: structuredClone(source.inlineCss) } : {},
		routes: { ...source.routes }
	};
}
function getStaticHandlerInlineCssDefault(handlerInlineCss) {
	if (typeof handlerInlineCss === "function") return;
	return handlerInlineCss ?? true;
}
async function resolveInlineCssForRequest(opts) {
	if (opts.requestInlineCss !== void 0) return opts.requestInlineCss;
	if (typeof opts.handlerInlineCss === "function") return await opts.handlerInlineCss({ request: opts.request });
	return opts.handlerInlineCss ?? true;
}
function createCachedBaseManifestLoader(loadBaseManifest) {
	let baseManifestPromise;
	return () => {
		if (!baseManifestPromise) baseManifestPromise = loadBaseManifest().catch((error) => {
			baseManifestPromise = void 0;
			throw error;
		});
		return baseManifestPromise;
	};
}
function createFinalManifestTransformResolver(transformAssets, opts) {
	const transformConfig = transformAssets !== void 0 ? resolveTransformAssetsConfig(transformAssets) : void 0;
	const cache = transformConfig ? transformConfig.cache : true;
	const warmup = !!transformAssets && typeof transformAssets === "object" && "warmup" in transformAssets && transformAssets.warmup === true;
	let cachedCreateTransformPromise;
	const clearCachedCreateTransform = () => {
		cachedCreateTransformPromise = void 0;
	};
	return {
		cache,
		warmup,
		clearCachedCreateTransform,
		getTransformFn: async (ctx) => {
			if (!transformConfig) return void 0;
			if (transformConfig.type !== "createTransform") return transformConfig.transformFn;
			if (!cache || !opts.cacheCreateTransform) return transformConfig.createTransform(ctx);
			if (!cachedCreateTransformPromise) cachedCreateTransformPromise = Promise.resolve(transformConfig.createTransform(ctx)).catch((error) => {
				clearCachedCreateTransform();
				throw error;
			});
			return cachedCreateTransformPromise;
		}
	};
}
function createFinalManifestResolver(opts) {
	const finalManifestCache = /* @__PURE__ */ new Map();
	const transformResolver = createFinalManifestTransformResolver(opts.transformAssets, { cacheCreateTransform: opts.cacheCreateTransform });
	const handlerDefaultInlineCss = getStaticHandlerInlineCssDefault(opts.inlineCss);
	const getRequestManifestOptions = async (requestOpts) => {
		const transformFn = await transformResolver.getTransformFn({
			warmup: false,
			request: requestOpts.request
		});
		const inlineCss = await resolveInlineCssForRequest({
			request: requestOpts.request,
			handlerInlineCss: opts.inlineCss,
			requestInlineCss: requestOpts.requestInlineCss
		});
		return {
			getBaseManifest: requestOpts.getBaseManifest,
			transformFn,
			cache: transformResolver.cache,
			inlineCss
		};
	};
	const resolveRequest = async (requestOpts, cache) => {
		return resolveFinalManifest({
			...await getRequestManifestOptions(requestOpts),
			finalManifestCache: cache
		});
	};
	return {
		warmup: ({ getBaseManifest }) => warmupFinalManifest({
			enabled: transformResolver.warmup,
			handlerDefaultInlineCss,
			cache: transformResolver.cache,
			finalManifestCache,
			getBaseManifest,
			getTransformFn: () => transformResolver.getTransformFn({ warmup: true }),
			onError: transformResolver.clearCachedCreateTransform
		}),
		resolveCached: (requestOpts) => resolveRequest(requestOpts, finalManifestCache),
		resolveUncached: (requestOpts) => resolveRequest(requestOpts, void 0)
	};
}
function getFinalManifestCacheKey(inlineCss) {
	return inlineCss ? "inline-css" : "linked-css";
}
function cacheFinalManifestPromise(cachedFinalManifestPromises, cacheKey, promise) {
	const cachedFinalManifestPromise = promise.catch((error) => {
		if (cachedFinalManifestPromises.get(cacheKey) === cachedFinalManifestPromise) cachedFinalManifestPromises.delete(cacheKey);
		throw error;
	});
	cachedFinalManifestPromises.set(cacheKey, cachedFinalManifestPromise);
	return cachedFinalManifestPromise;
}
function getOrCreateCachedFinalManifestPromise(cachedFinalManifestPromises, cacheKey, computeFinalManifest) {
	const cachedFinalManifestPromise = cachedFinalManifestPromises.get(cacheKey);
	if (cachedFinalManifestPromise) return cachedFinalManifestPromise;
	return cacheFinalManifestPromise(cachedFinalManifestPromises, cacheKey, Promise.resolve().then(computeFinalManifest));
}
async function buildFinalManifest(opts) {
	return opts.transformFn ? await transformManifestAssets(opts.base, opts.transformFn, { inlineCss: opts.inlineCss }) : buildManifest(opts.base, { inlineCss: opts.inlineCss });
}
async function resolveFinalManifest(opts) {
	const computeFinalManifest = async () => {
		return buildFinalManifest({
			base: await opts.getBaseManifest(),
			transformFn: opts.transformFn,
			inlineCss: opts.inlineCss
		});
	};
	if (opts.finalManifestCache && (!opts.transformFn || opts.cache)) return getOrCreateCachedFinalManifestPromise(opts.finalManifestCache, getFinalManifestCacheKey(opts.inlineCss), computeFinalManifest);
	return computeFinalManifest();
}
function warmupFinalManifest(opts) {
	if (!opts.enabled || opts.handlerDefaultInlineCss === void 0 || !opts.cache) return;
	const inlineCss = opts.handlerDefaultInlineCss;
	const warmupPromise = getOrCreateCachedFinalManifestPromise(opts.finalManifestCache, getFinalManifestCacheKey(inlineCss), async () => {
		const [base, transformFn] = await Promise.all([opts.getBaseManifest(), opts.getTransformFn()]);
		return buildFinalManifest({
			base,
			transformFn,
			inlineCss
		});
	});
	if (opts.onError) warmupPromise.catch(opts.onError);
	return warmupPromise;
}
var ServerFunctionSerializationAdapter = createSerializationAdapter({
	key: "$TSS/serverfn",
	test: (v) => {
		if (typeof v !== "function") return false;
		if (!(TSS_SERVER_FUNCTION in v)) return false;
		return !!v[TSS_SERVER_FUNCTION];
	},
	toSerializable: ({ serverFnMeta }) => ({ functionId: serverFnMeta.id }),
	fromSerializable: ({ functionId }) => {
		const fn = async (opts, signal) => {
			return (await (await getServerFnById(functionId, { origin: "client" }))(opts ?? {}, signal)).result;
		};
		return fn;
	}
});
var tsrScript_default = "self.$_TSR={h(){this.hydrated=!0,this.c()},e(){this.streamEnded=!0,this.c()},c(){this.hydrated&&this.streamEnded&&(delete self.$_TSR,delete self.$R.tsr)},p(e){this.initialized?e():this.buffer.push(e)},buffer:[]}";
var SCOPE_ID = "tsr";
var TSR_PREFIX = GLOBAL_TSR + ".router=";
var P_PREFIX = GLOBAL_TSR + ".p(()=>";
var P_SUFFIX = ")";
function dehydrateMatch(match) {
	const dehydratedMatch = {
		i: dehydrateSsrMatchId(match.id),
		u: match.updatedAt,
		s: match.status
	};
	for (const [key, shorthand] of [
		["__beforeLoadContext", "b"],
		["loaderData", "l"],
		["error", "e"],
		["ssr", "ssr"]
	]) if (match[key] !== void 0) dehydratedMatch[shorthand] = match[key];
	if (match._notFound) dehydratedMatch.g = true;
	return dehydratedMatch;
}
var INITIAL_SCRIPTS = [getCrossReferenceHeader(SCOPE_ID), tsrScript_default];
var ScriptBuffer = class {
	constructor(injectScript) {
		this._scriptBarrierLifted = false;
		this._cleanedUp = false;
		this._microtaskVersion = 0;
		this._pendingMicrotaskVersion = 0;
		this.injectScript = injectScript;
		this._queue = INITIAL_SCRIPTS.slice();
	}
	enqueue(script) {
		if (this._cleanedUp) return;
		this._queue.push(script);
		if (this._scriptBarrierLifted) this.scheduleInjectBufferedScripts();
	}
	liftBarrier() {
		if (this._scriptBarrierLifted || this._cleanedUp) return;
		this._scriptBarrierLifted = true;
		if (this._queue.length > 0) this.scheduleInjectBufferedScripts();
	}
	scheduleInjectBufferedScripts() {
		if (this._pendingMicrotaskVersion !== 0) return;
		const pendingVersion = ++this._microtaskVersion;
		this._pendingMicrotaskVersion = pendingVersion;
		queueMicrotask(() => {
			if (this._pendingMicrotaskVersion !== pendingVersion) return;
			this._pendingMicrotaskVersion = 0;
			this.injectBufferedScripts();
		});
	}
	clearPendingMicrotask() {
		if (this._pendingMicrotaskVersion === 0) return;
		this._pendingMicrotaskVersion = 0;
		this._microtaskVersion++;
	}
	/**
	* Flushes any pending scripts synchronously.
	* Call this before signaling serialization finished to ensure all scripts are injected.
	*
	* IMPORTANT: Only injects if the barrier has been lifted. Before the barrier is lifted,
	* scripts should remain in the queue so takeBufferedScripts() can retrieve them
	*/
	flush() {
		if (!this._scriptBarrierLifted) return;
		if (this._cleanedUp) return;
		this.clearPendingMicrotask();
		this.injectBufferedScripts();
	}
	takeAll() {
		return this.takeScripts(this._queue.length);
	}
	takeScripts(count) {
		if (count <= 0) return void 0;
		const bufferedScripts = this._queue.splice(0, count);
		if (bufferedScripts.length === 0) return;
		if (bufferedScripts.length === 1) return bufferedScripts[0] + ";document.currentScript.remove()";
		return bufferedScripts.join(";") + ";document.currentScript.remove()";
	}
	hasPending() {
		return this._queue.length > 0;
	}
	injectBufferedScripts() {
		if (this._cleanedUp) return;
		if (this._queue.length === 0) return;
		const scriptsToInject = this.takeAll();
		if (scriptsToInject) this.injectScript?.(scriptsToInject);
	}
	cleanup() {
		this._cleanedUp = true;
		this.clearPendingMicrotask();
		this._queue = [];
		this.injectScript = void 0;
	}
};
var MANIFEST_CACHE_SIZE = 100;
var manifestCaches = /* @__PURE__ */ new WeakMap();
function getManifestCache(manifest) {
	const cache = manifestCaches.get(manifest);
	if (cache) return cache;
	const newCache = createLRUCache(MANIFEST_CACHE_SIZE);
	manifestCaches.set(manifest, newCache);
	return newCache;
}
function getInlineCssForPreparedRoutes(manifest, preparedRoutes) {
	if (preparedRoutes.inlineCss !== void 0) return preparedRoutes.inlineCss;
	const styles = manifest.inlineCss?.styles;
	const hrefs = preparedRoutes.inlineCssHrefs;
	if (!styles || !hrefs?.length) return void 0;
	let css = "";
	for (const href of hrefs) css += styles[href];
	preparedRoutes.inlineCss = css;
	return css;
}
function getInlineCssAssetForPreparedRoutes(manifest, preparedRoutes) {
	const css = getInlineCssForPreparedRoutes(manifest, preparedRoutes);
	return css === void 0 ? void 0 : createInlineCssStyleAsset(css);
}
function getMatchedRoutesCacheKey(matches) {
	let cacheKey = "";
	for (let i = 0; i < matches.length; i++) cacheKey += (i === 0 ? "" : "\0") + matches[i].routeId;
	return cacheKey;
}
function getPreparedMatchedManifestRoutes(manifest, matches, cacheKey) {
	{
		const cached = getManifestCache(manifest).get(cacheKey);
		if (cached) return cached;
	}
	const preparedRoutes = prepareMatchedManifestRoutes(manifest, matches);
	getManifestCache(manifest).set(cacheKey, preparedRoutes);
	return preparedRoutes;
}
function prepareMatchedManifestRoutes(manifest, matches) {
	const inlineStyles = manifest.inlineCss?.styles;
	const routes = {};
	if (!inlineStyles) {
		for (const match of matches) {
			const route = manifest.routes[match.routeId];
			if (route) routes[match.routeId] = route;
		}
		return {
			routes,
			hasStrippedRoutes: false
		};
	}
	const inlineCssHrefs = [];
	const seenInlineCssHrefs = /* @__PURE__ */ new Set();
	let hasStrippedRoutes = false;
	for (const match of matches) {
		const routeId = match.routeId;
		const route = manifest.routes[routeId];
		if (!route) continue;
		const nextRoute = stripInlinedStylesheetAssetsFromRoute(inlineStyles, route, inlineCssHrefs, seenInlineCssHrefs);
		if (nextRoute !== route) hasStrippedRoutes = true;
		routes[routeId] = nextRoute;
	}
	return {
		routes,
		hasStrippedRoutes,
		...inlineCssHrefs.length ? { inlineCssHrefs } : {}
	};
}
function stripInlinedStylesheetAssetsFromRoute(inlineStyles, route, inlineCssHrefs, seenInlineCssHrefs) {
	const css = route.css;
	if (!css) return route;
	if (css.length === 0) {
		const nextRoute = { ...route };
		delete nextRoute.css;
		return nextRoute;
	}
	let cssLinks;
	for (let i = 0; i < css.length; i++) {
		const link = css[i];
		const href = getStylesheetHref(link);
		if (inlineStyles[href] === void 0) {
			if (cssLinks) cssLinks.push(link);
			continue;
		}
		if (!seenInlineCssHrefs.has(href)) {
			seenInlineCssHrefs.add(href);
			inlineCssHrefs.push(href);
		}
		if (!cssLinks) cssLinks = css.slice(0, i);
	}
	if (!cssLinks) return route;
	if (cssLinks.length > 0) return {
		...route,
		css: cssLinks
	};
	const nextRoute = { ...route };
	delete nextRoute.css;
	return nextRoute;
}
function hasRouteAssets(route) {
	return !!route.scripts?.length || !!route.css?.length;
}
function hasRequestAssets(assets) {
	return !!assets && (!!assets.preloads?.length || hasRouteAssets(assets));
}
function mergeRequestAssetsIntoRootRoute(rootRoute, requestAssets) {
	const preloads = requestAssets?.preloads?.length ? [...requestAssets.preloads, ...rootRoute?.preloads ?? []] : rootRoute?.preloads;
	const scripts = requestAssets?.scripts?.length ? [...requestAssets.scripts, ...rootRoute?.scripts ?? []] : rootRoute?.scripts;
	const cssLinks = requestAssets?.css?.length ? [...requestAssets.css, ...rootRoute?.css ?? []] : rootRoute?.css;
	return {
		...rootRoute ?? {},
		...preloads?.length ? { preloads } : {},
		...scripts?.length ? { scripts } : {},
		...cssLinks?.length ? { css: cssLinks } : {}
	};
}
function attachRouterServerSsrUtils({ router, manifest, getRequestAssets }) {
	router.ssr = { get manifest() {
		if (!manifest) return manifest;
		const requestAssets = getRequestAssets?.();
		const matches = _getRenderedMatches(router.stores.matches.get());
		const hasAssets = hasRequestAssets(requestAssets);
		if (!hasAssets && !manifest.inlineCss) return manifest;
		let inlineCssAsset;
		let routes = manifest.routes;
		if (manifest.inlineCss) {
			const preparedManifest = getPreparedMatchedManifestRoutes(manifest, matches, getMatchedRoutesCacheKey(matches));
			inlineCssAsset = getInlineCssAssetForPreparedRoutes(manifest, preparedManifest);
			if (preparedManifest.hasStrippedRoutes) routes = {
				...manifest.routes,
				...preparedManifest.routes
			};
		}
		if (!hasAssets) return {
			...manifest.scriptFormat ? { scriptFormat: manifest.scriptFormat } : {},
			...inlineCssAsset ? { inlineStyle: inlineCssAsset } : {},
			routes
		};
		const rootRoute = routes[rootRouteId];
		return {
			...manifest.scriptFormat ? { scriptFormat: manifest.scriptFormat } : {},
			...inlineCssAsset ? { inlineStyle: inlineCssAsset } : {},
			routes: {
				...routes,
				[rootRouteId]: mergeRequestAssetsIntoRootRoute(rootRoute, requestAssets)
			}
		};
	} };
	let _dehydrated = false;
	let _serializationFinished = false;
	let streamFastPathReserved = false;
	const renderFinishedListeners = [];
	const injectedHtmlListeners = [];
	const serializationFinishedListeners = [];
	const cleanupListeners = [];
	let cleanupStarted = false;
	let injectedHtmlBuffer = "";
	const callListeners = (listeners, errorPrefix) => {
		const snapshot = listeners.slice();
		for (const l of snapshot) try {
			l();
		} catch (err) {
			console.error(`${errorPrefix}:`, err);
		}
	};
	const removeListener = (listeners, listener) => {
		const index = listeners.indexOf(listener);
		if (index >= 0) listeners.splice(index, 1);
	};
	const scriptBuffer = new ScriptBuffer((script) => {
		serverSsr.injectScript(script);
	});
	const serverSsr = {
		injectHtml: (html) => {
			if (!html || cleanupStarted) return;
			injectedHtmlBuffer += html;
			callListeners(injectedHtmlListeners, "SSR injected HTML listener error");
		},
		injectScript: (script) => {
			if (!script || cleanupStarted) return;
			const html = `<script${router.options.ssr?.nonce ? ` nonce='${router.options.ssr.nonce}'` : ""}>${script}<\/script>`;
			serverSsr.injectHtml(html);
		},
		dehydrate: async (opts) => {
			if (_dehydrated) invariant();
			let matchesToDehydrate = _getRenderedMatches(router.stores.matches.get());
			if (router.isShell()) matchesToDehydrate = matchesToDehydrate.slice(0, 1);
			const matches = matchesToDehydrate.map(dehydrateMatch);
			let manifestToDehydrate = void 0;
			if (manifest) {
				const cacheKey = getMatchedRoutesCacheKey(matchesToDehydrate);
				const preparedManifest = getPreparedMatchedManifestRoutes(manifest, matchesToDehydrate, cacheKey);
				manifestToDehydrate = {
					...manifest.scriptFormat ? { scriptFormat: manifest.scriptFormat } : {},
					...preparedManifest.inlineCssHrefs ? { inlineStyle: createInlineCssPlaceholderAsset() } : {},
					routes: preparedManifest.routes
				};
				const requestAssets = opts?.requestAssets;
				if (hasRequestAssets(requestAssets)) {
					const existingRoot = manifestToDehydrate.routes[rootRouteId];
					manifestToDehydrate.routes = {
						...manifestToDehydrate.routes,
						[rootRouteId]: mergeRequestAssetsIntoRootRoute(existingRoot, requestAssets)
					};
				}
			}
			const dehydratedRouter = {
				manifest: manifestToDehydrate,
				matches
			};
			const dehydratedData = await router.options.dehydrate?.();
			if (cleanupStarted) return;
			if (dehydratedData) dehydratedRouter.dehydratedData = dehydratedData;
			_dehydrated = true;
			const trackPlugins = { didRun: false };
			const serializationAdapters = router.options.serializationAdapters;
			const plugins = serializationAdapters ? serializationAdapters.map((t) => /* @__PURE__ */ makeSsrSerovalPlugin(t, trackPlugins)).concat(defaultSerovalPlugins) : defaultSerovalPlugins;
			let serializationCompleteSignaled = false;
			const signalSerializationComplete = () => {
				if (serializationCompleteSignaled || cleanupStarted) return;
				serializationCompleteSignaled = true;
				_serializationFinished = true;
				const listeners = serializationFinishedListeners.slice();
				serializationFinishedListeners.length = 0;
				for (const l of listeners) try {
					l();
				} catch (err) {
					console.error("Serialization listener error:", err);
				}
			};
			const finishScriptSerialization = () => {
				if (serializationCompleteSignaled || cleanupStarted) return;
				scriptBuffer.enqueue(GLOBAL_TSR + ".e()");
				scriptBuffer.flush();
				signalSerializationComplete();
			};
			crossSerializeStream(dehydratedRouter, {
				refs: /* @__PURE__ */ new Map(),
				plugins,
				onSerialize: (data, initial) => {
					let serialized = initial ? TSR_PREFIX + data : data;
					if (trackPlugins.didRun) serialized = P_PREFIX + serialized + P_SUFFIX;
					scriptBuffer.enqueue(serialized);
				},
				onError: (err) => {
					console.error("Serialization error:", err);
					if (err && err.stack) console.error(err.stack);
					finishScriptSerialization();
				},
				scopeId: SCOPE_ID,
				onDone: () => {
					finishScriptSerialization();
				}
			});
		},
		isDehydrated() {
			return _dehydrated;
		},
		isSerializationFinished() {
			return _serializationFinished;
		},
		reserveStreamFastPath() {
			if (!cleanupStarted && _serializationFinished && !streamFastPathReserved && renderFinishedListeners.length === 0 && !injectedHtmlBuffer && !scriptBuffer.hasPending()) {
				streamFastPathReserved = true;
				return true;
			}
			return false;
		},
		onInjectedHtml: (listener) => {
			if (cleanupStarted) return () => {};
			injectedHtmlListeners.push(listener);
			return () => removeListener(injectedHtmlListeners, listener);
		},
		onRenderFinished: (listener) => {
			if (cleanupStarted || streamFastPathReserved) return;
			renderFinishedListeners.push(listener);
		},
		onSerializationFinished: (listener) => {
			if (cleanupStarted) return () => {};
			if (_serializationFinished && !cleanupStarted) {
				try {
					listener();
				} catch (err) {
					console.error("Serialization listener error:", err);
				}
				return () => {};
			}
			serializationFinishedListeners.push(listener);
			return () => removeListener(serializationFinishedListeners, listener);
		},
		onCleanup: (listener) => {
			if (cleanupStarted) return;
			cleanupListeners.push(listener);
		},
		setRenderFinished: () => {
			if (cleanupStarted) return;
			scriptBuffer.liftBarrier();
			const listeners = renderFinishedListeners.slice();
			renderFinishedListeners.length = 0;
			for (const l of listeners) try {
				l();
			} catch (err) {
				console.error("Error in render finished listener:", err);
			}
			if (_serializationFinished) scriptBuffer.flush();
		},
		takeBufferedScripts() {
			const scripts = scriptBuffer.takeAll();
			if (!scripts) return void 0;
			return {
				tag: "script",
				attrs: {
					nonce: router.options.ssr?.nonce,
					className: "$tsr",
					id: TSR_SCRIPT_BARRIER_ID
				},
				children: scripts
			};
		},
		liftScriptBarrier() {
			scriptBuffer.liftBarrier();
		},
		takeBufferedHtml() {
			if (!injectedHtmlBuffer) return;
			const buffered = injectedHtmlBuffer;
			injectedHtmlBuffer = "";
			return buffered;
		},
		cleanup() {
			if (cleanupStarted) return;
			cleanupStarted = true;
			const listeners = cleanupListeners.slice();
			cleanupListeners.length = 0;
			for (const l of listeners) try {
				l();
			} catch (err) {
				console.error("Error in SSR cleanup listener:", err);
			}
			renderFinishedListeners.length = 0;
			injectedHtmlListeners.length = 0;
			serializationFinishedListeners.length = 0;
			injectedHtmlBuffer = "";
			scriptBuffer.cleanup();
			router.serverSsr = void 0;
		}
	};
	router.serverSsr = serverSsr;
	for (const listener of router.serverSsrLifecycle?.onServerSsrAttach ?? []) try {
		listener(serverSsr);
	} catch (err) {
		console.error("SSR attach listener error:", err);
	}
}
/**
* Get the origin for the request.
*
* SECURITY: We intentionally do NOT trust the Origin header for determining
* the router's origin. The Origin header can be spoofed by attackers, which
* could lead to SSRF-like vulnerabilities where redirects are constructed
* using a malicious origin (CVE-2024-34351).
*
* Instead, we derive the origin from request.url, which is typically set by
* the server infrastructure (not client-controlled headers).
*
* For applications behind proxies that need to trust forwarded headers,
* use the router's `origin` option to explicitly configure a trusted origin.
*/
function getOrigin(request) {
	try {
		return new URL(request.url).origin;
	} catch {}
	return "http://localhost";
}
function getNormalizedURL(url, base) {
	if (typeof url === "string") url = url.replace("\\", "%5C");
	const rawUrl = new URL(url, base);
	const { path: decodedPathname, handledProtocolRelativeURL } = decodePath(rawUrl.pathname);
	const searchParams = new URLSearchParams(rawUrl.search);
	const normalizedHref = decodedPathname + (searchParams.size > 0 ? "?" : "") + searchParams.toString() + rawUrl.hash;
	return {
		url: new URL(normalizedHref, rawUrl.origin),
		handledProtocolRelativeURL
	};
}
function isSsrResponse(value) {
	return typeof value === "object" && value !== null && "response" in value && "serverSsrCleanup" in value;
}
function normalizeSsrResponse(result) {
	return isSsrResponse(result) ? result : {
		response: result,
		serverSsrCleanup: "none"
	};
}
function disposeSsrResponse(response, reason) {
	if (response.serverSsrCleanup !== "stream") return Promise.resolve();
	try {
		return Promise.resolve(response.dispose(reason));
	} catch (error) {
		return Promise.reject(error);
	}
}
function disposeSsrResponseDetached(result, reason, onError = console.error) {
	const ssrResponse = normalizeSsrResponse(result);
	if (ssrResponse.serverSsrCleanup === "stream") {
		disposeSsrResponse(ssrResponse, reason).catch(onError);
		return;
	}
	if (ssrResponse.response.body) try {
		ssrResponse.response.body.cancel(reason).catch(onError);
	} catch (error) {
		onError(error);
	}
}
function bindSsrResponseToRequest(router, result, signal) {
	const ssrResponse = normalizeSsrResponse(result);
	if (ssrResponse.serverSsrCleanup !== "stream") {
		if (signal.aborted) disposeSsrResponseDetached(result, signal.reason);
		return ssrResponse;
	}
	const failed = (error) => {
		router?.serverSsr?.cleanup();
		console.error(error);
	};
	const abort = () => {
		disposeSsrResponseDetached(ssrResponse, signal.reason, failed);
	};
	if (signal.aborted) {
		abort();
		return ssrResponse;
	}
	signal.addEventListener("abort", abort, { once: true });
	router?.serverSsr?.onCleanup(() => {
		signal.removeEventListener("abort", abort);
	});
	return ssrResponse;
}
async function replaceSsrResponse(result, response, reason) {
	await disposeSsrResponse(normalizeSsrResponse(result), reason);
	return {
		response,
		serverSsrCleanup: "none"
	};
}
async function stripSsrResponseBody(result, reason) {
	const ssrResponse = normalizeSsrResponse(result);
	await disposeSsrResponse(ssrResponse, reason);
	return {
		response: new Response(null, ssrResponse.response),
		serverSsrCleanup: "none"
	};
}
var requestWaiters = /* @__PURE__ */ new WeakMap();
function removeRequestWaiter(waiters, index, reject) {
	if (waiters[index] !== reject) return;
	if (index !== waiters.length - 1) {
		waiters[index] = void 0;
		return;
	}
	waiters.pop();
	while (waiters.length && waiters[waiters.length - 1] === void 0) waiters.pop();
}
function waitForRequest(value, signal, onLate) {
	const promise = Promise.resolve(value);
	if (signal.aborted) {
		promise.then(onLate, () => {});
		return Promise.reject(signal.reason);
	}
	return new Promise((resolve, reject) => {
		let waiters = requestWaiters.get(signal);
		let index;
		if (waiters) index = waiters.push(reject) - 1;
		else {
			const newWaiters = [reject];
			waiters = newWaiters;
			index = 0;
			requestWaiters.set(signal, newWaiters);
			signal.addEventListener("abort", () => {
				requestWaiters.delete(signal);
				for (const rejectWaiter of newWaiters) rejectWaiter?.(signal.reason);
				newWaiters.length = 0;
			}, { once: true });
		}
		promise.then((result) => {
			removeRequestWaiter(waiters, index, reject);
			if (signal.aborted) onLate?.(result);
			else resolve(result);
		}, (error) => {
			removeRequestWaiter(waiters, index, reject);
			reject(error);
		});
	});
}
function getStartResponseHeaders(opts) {
	return mergeHeaders$2({ "Content-Type": "text/html; charset=utf-8" }, ..._getRenderedMatches(opts.router.stores.matches.get()).map((match) => {
		return match.headers;
	}));
}
var entriesPromise;
var defaultCsrfMiddleware = createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" });
var getCachedBaseManifest = createCachedBaseManifestLoader(() => getStartManifest());
var getProdBaseManifest = () => getCachedBaseManifest();
var getBaseManifest = getProdBaseManifest;
var createEarlyHintsForRequest = createEarlyHintsCollector;
async function loadEntries() {
	const [routerEntry, startEntry, pluginAdapters] = await Promise.all([
		import("./router-CaiYRCFU.mjs").then((n) => n.router_exports),
		import("./start-COvwumqL.mjs"),
		import("./empty-plugin-adapters-MYqV26gF.mjs")
	]);
	return {
		routerEntry,
		startEntry,
		pluginAdapters
	};
}
function getEntries() {
	if (!entriesPromise) entriesPromise = loadEntries();
	return entriesPromise;
}
var ROUTER_BASEPATH = "/";
var SERVER_FN_BASE = "/_serverFn/";
var IS_PRERENDERING = process.env.TSS_PRERENDERING === "true";
var IS_SHELL_ENV = process.env.TSS_SHELL === "true";
var IS_DEV = false;
var ERR_NO_RESPONSE = IS_DEV ? `It looks like you forgot to return a response from your server route handler. If you want to defer to the app router, make sure to have a component set in this route.` : "Internal Server Error";
var ERR_NO_DEFER = IS_DEV ? `You cannot defer to the app router if there is no component defined on this route.` : "Internal Server Error";
function throwRouteHandlerError() {
	throw new Error(ERR_NO_RESPONSE);
}
function throwIfMayNotDefer() {
	throw new Error(ERR_NO_DEFER);
}
/**
* Check if a value is a special response (Response or Redirect)
*/
function isSpecialResponse(value) {
	return value instanceof Response || isRedirect(value);
}
/**
* Normalize middleware result to context shape
*/
function handleCtxResult(result) {
	if (isSsrResponse(result) || isSpecialResponse(result)) return { response: result };
	return result;
}
function disposeLateResponse(result, signal) {
	const response = handleCtxResult(result)?.response;
	if (isSsrResponse(response) || isSpecialResponse(response)) disposeSsrResponseDetached(response, signal.reason);
}
function isSignalAborted(signal) {
	return signal.aborted;
}
/**
* Execute a middleware chain
*/
async function executeMiddleware(middlewares, ctx, signal) {
	let index = -1;
	let streamResponse;
	let retiredStreamIdentities;
	const isResponseAlias = (candidate, response) => candidate === response || candidate instanceof Response && response.body !== null && candidate.body === response.body;
	const setResponse = (response) => {
		if (isSsrResponse(response)) {
			if (response.serverSsrCleanup === "stream") streamResponse = response;
			ctx.response = response.response;
			return;
		}
		ctx.response = response;
	};
	const disposeStreamResponse = async (reason) => {
		const response = streamResponse;
		if (!response) return;
		streamResponse = void 0;
		retiredStreamIdentities ??= /* @__PURE__ */ new WeakSet();
		retiredStreamIdentities.add(response.response);
		if (response.response.body) retiredStreamIdentities.add(response.response.body);
		const currentResponse = ctx.response;
		if (isResponseAlias(currentResponse, response.response)) ctx.response = void 0;
		await response.dispose(reason);
	};
	const disposeAbandonedResult = (result) => {
		const exposed = handleCtxResult(result)?.response;
		const response = isSsrResponse(exposed) ? exposed.response : exposed;
		if (streamResponse && isResponseAlias(response, streamResponse.response)) {
			disposeStreamResponse(signal.reason).catch(console.error);
			return;
		}
		if (response instanceof Response && retiredStreamIdentities && (retiredStreamIdentities.has(response) || response.body !== null && retiredStreamIdentities.has(response.body))) return;
		disposeLateResponse(result, signal);
	};
	const getFinalResponse = async () => {
		const response = ctx.response;
		if (!response) throwRouteHandlerError();
		if (!streamResponse) return response;
		if (response === streamResponse.response) return streamResponse;
		if (streamResponse.response.body !== null && response.body === streamResponse.response.body) return {
			...streamResponse,
			response
		};
		await disposeStreamResponse("middleware response replaced");
		return response;
	};
	let nextPromise;
	function next(nextCtx) {
		const result = runNext(nextCtx);
		nextPromise = result;
		return result;
	}
	async function runNext(nextCtx) {
		if (signal.aborted) throw signal.reason;
		if (nextCtx) {
			if (nextCtx.context) ctx.context = safeObjectMerge(ctx.context, nextCtx.context);
			for (const key of Object.keys(nextCtx)) if (key === "response") setResponse(nextCtx.response);
			else if (key !== "context") ctx[key] = nextCtx[key];
		}
		index++;
		const middleware = middlewares[index];
		if (!middleware) return ctx;
		let result;
		try {
			const pending = middleware({
				...ctx,
				next
			});
			if (pending === nextPromise) {
				nextPromise = void 0;
				result = await pending;
				if (isSignalAborted(signal)) {
					disposeAbandonedResult(result);
					throw signal.reason;
				}
			} else result = await waitForRequest(pending, signal, disposeAbandonedResult);
		} catch (err) {
			if (isSignalAborted(signal)) throw signal.reason;
			if (isSpecialResponse(err)) {
				setResponse(err);
				return ctx;
			}
			throw err;
		}
		const normalized = handleCtxResult(result);
		if (normalized) {
			if (normalized.response !== void 0) setResponse(normalized.response);
			if (normalized.context) ctx.context = safeObjectMerge(ctx.context, normalized.context);
		}
		return ctx;
	}
	try {
		await runNext();
		const response = await waitForRequest(getFinalResponse(), signal, disposeAbandonedResult);
		if (signal.aborted) {
			disposeAbandonedResult(response);
			throw signal.reason;
		}
		return {
			ctx,
			response
		};
	} catch (err) {
		const disposal = disposeStreamResponse(signal.aborted ? signal.reason : err);
		if (signal.aborted) disposal.catch(console.error);
		else await disposal;
		throw err;
	}
}
/**
* Wrap a route handler as middleware
*/
function handlerToMiddleware(handler, mayDefer = false) {
	if (mayDefer) return handler;
	return async (ctx) => {
		const response = await handler({
			...ctx,
			next: throwIfMayNotDefer
		});
		if (!response) throwRouteHandlerError();
		return response;
	};
}
/**
* Creates the TanStack Start request handler.
*
* @example Backwards-compatible usage (handler callback only):
* ```ts
* export default createStartHandler(defaultStreamHandler)
* ```
*
* @example With CDN URL rewriting:
* ```ts
* export default createStartHandler({
*   handler: defaultStreamHandler,
*   transformAssets: 'https://cdn.example.com',
* })
* ```
*
* @example With per-request URL rewriting:
* ```ts
* export default createStartHandler({
*   handler: defaultStreamHandler,
*   transformAssets: {
*     transform: ({ url }) => {
*       const cdnBase = getRequest().headers.get('x-cdn-base') || ''
*       return { href: `${cdnBase}${url}` }
*     },
*     cache: false,
*   },
* })
* ```
*/
function createStartHandler(cbOrOptions) {
	const handlerOptions = typeof cbOrOptions === "function" ? {} : cbOrOptions;
	const cb = typeof cbOrOptions === "function" ? cbOrOptions : cbOrOptions.handler;
	const finalManifestResolver = createFinalManifestResolver({
		...handlerOptions,
		cacheCreateTransform: true
	});
	const resolveManifestForRequest = finalManifestResolver.resolveCached;
	finalManifestResolver.warmup({ getBaseManifest: () => getBaseManifest(void 0) });
	const startRequestResolver = async (request, requestOpts) => {
		let router = null;
		let responseOwnsCleanup = false;
		try {
			request.signal.throwIfAborted();
			const { url, handledProtocolRelativeURL } = getNormalizedURL(request.url);
			const href = url.pathname + url.search + url.hash;
			const origin = getOrigin(request);
			if (handledProtocolRelativeURL) return Response.redirect(url, 308);
			const entries = await waitForRequest(getEntries(), request.signal);
			const hasStartInstance = !!entries.startEntry.startInstance;
			const startOptions = await waitForRequest(entries.startEntry.startInstance?.getOptions(), request.signal) || {};
			const { hasPluginAdapters, pluginSerializationAdapters } = entries.pluginAdapters;
			const serializationAdapters = [
				...startOptions.serializationAdapters || [],
				...hasPluginAdapters ? pluginSerializationAdapters : [],
				ServerFunctionSerializationAdapter
			];
			const requestStartOptions = {
				...startOptions,
				requestMiddleware: hasStartInstance ? startOptions.requestMiddleware : [defaultCsrfMiddleware],
				serializationAdapters
			};
			const flattenedRequestMiddlewares = requestStartOptions.requestMiddleware ? flattenMiddlewares(requestStartOptions.requestMiddleware) : [];
			const executedRequestMiddlewares = new Set(flattenedRequestMiddlewares);
			const getRouter = async () => {
				if (router) return router;
				router = await waitForRequest(entries.routerEntry.getRouter(), request.signal);
				let isShell = IS_SHELL_ENV;
				if (IS_PRERENDERING && !isShell) isShell = request.headers.get(HEADERS.TSS_SHELL) === "true";
				const history = createMemoryHistory({ initialEntries: [href] });
				router.update({
					history,
					isShell,
					isPrerendering: IS_PRERENDERING,
					origin: router.options.origin ?? origin,
					defaultSsr: requestStartOptions.defaultSsr,
					serializationAdapters: [...requestStartOptions.serializationAdapters, ...router.options.serializationAdapters || []],
					basepath: ROUTER_BASEPATH
				});
				return router;
			};
			if (SERVER_FN_BASE && url.pathname.startsWith(SERVER_FN_BASE)) {
				const serverFnId = url.pathname.slice(SERVER_FN_BASE.length).split("/")[0];
				if (!serverFnId) throw new Error("Invalid server action param for serverFnId");
				const serverFnHandler = async ({ context }) => {
					return runWithStartContext({
						getRouter,
						startOptions: requestStartOptions,
						contextAfterGlobalMiddlewares: context,
						request,
						executedRequestMiddlewares,
						handlerType: "serverFn"
					}, () => handleServerAction({
						request,
						context: requestOpts?.context,
						serverFnId
					}));
				};
				const { response: middlewareResponse } = await executeMiddleware([...flattenedRequestMiddlewares.map((d) => d.options.server), serverFnHandler], {
					request,
					pathname: url.pathname,
					handlerType: "serverFn",
					context: createNullProtoObject(requestOpts?.context)
				}, request.signal);
				const result = await handleRedirectResponse(middlewareResponse, request, getRouter, request.signal);
				bindSsrResponseToRequest(router ?? void 0, result, request.signal);
				request.signal.throwIfAborted();
				responseOwnsCleanup = result.serverSsrCleanup === "stream";
				return result.response;
			}
			const executeRouter = async (serverContext, matchedRoutes) => {
				const acceptParts = (request.headers.get("Accept") || "*/*").split(",");
				if (!["*/*", "text/html"].some((mimeType) => acceptParts.some((part) => part.trim().startsWith(mimeType)))) return normalizeSsrResponse(Response.json({ error: "Only HTML requests are supported here" }, { status: 500 }));
				const manifest = await waitForRequest(resolveManifestForRequest({
					request,
					requestInlineCss: requestOpts?.inlineCss,
					getBaseManifest: () => getBaseManifest(matchedRoutes)
				}), request.signal);
				const earlyHints = createEarlyHintsForRequest({
					onEarlyHints: requestOpts?.onEarlyHints,
					responseLinkHeader: requestOpts?.responseLinkHeader
				});
				earlyHints?.collectStatic({
					manifest,
					matchedRoutes
				});
				const routerInstance = await getRouter();
				attachRouterServerSsrUtils({
					router: routerInstance,
					manifest,
					getRequestAssets: () => getStartContext({ throwIfNotFound: false })?.requestAssets
				});
				routerInstance.options.additionalContext = { serverContext };
				await routerInstance.load({ _signal: request.signal });
				request.signal.throwIfAborted();
				if (routerInstance._serverResult?.type === "redirect") return normalizeSsrResponse(routerInstance._serverResult.redirect);
				earlyHints?.collectDynamic(_getRenderedMatches(routerInstance.stores.matches.get()));
				const ctx = getStartContext({ throwIfNotFound: false });
				await waitForRequest(routerInstance.serverSsr.dehydrate({ requestAssets: ctx?.requestAssets }), request.signal);
				request.signal.throwIfAborted();
				const responseHeaders = getStartResponseHeaders({ router: routerInstance });
				earlyHints?.appendResponseHeaders(responseHeaders);
				request.signal.throwIfAborted();
				return normalizeSsrResponse(await waitForRequest(cb({
					request,
					router: routerInstance,
					responseHeaders
				}), request.signal, (late) => disposeLateResponse(late, request.signal)));
			};
			const requestHandlerMiddleware = async ({ context }) => {
				return runWithStartContext({
					getRouter,
					startOptions: requestStartOptions,
					contextAfterGlobalMiddlewares: context,
					request,
					executedRequestMiddlewares,
					handlerType: "router"
				}, async () => {
					try {
						return await handleServerRoutes({
							getRouter,
							request,
							url,
							executeRouter,
							context,
							executedRequestMiddlewares
						});
					} catch (err) {
						if (err instanceof Response) return err;
						throw err;
					}
				});
			};
			const { response: middlewareResponse } = await executeMiddleware([...flattenedRequestMiddlewares.map((d) => d.options.server), requestHandlerMiddleware], {
				request,
				pathname: url.pathname,
				handlerType: "router",
				context: createNullProtoObject(requestOpts?.context)
			}, request.signal);
			const response = await handleRedirectResponse(middlewareResponse, request, getRouter, request.signal);
			bindSsrResponseToRequest(router ?? void 0, response, request.signal);
			request.signal.throwIfAborted();
			responseOwnsCleanup = response.serverSsrCleanup === "stream";
			return response.response;
		} finally {
			if (router?.serverSsr && !responseOwnsCleanup) router.serverSsr.cleanup();
			router = null;
		}
	};
	return requestHandler(startRequestResolver);
}
async function handleRedirectResponse(response, request, getRouter, signal) {
	signal.throwIfAborted();
	const ssrResponse = normalizeSsrResponse(response);
	if (!isRedirect(ssrResponse.response)) return ssrResponse;
	if (isResolvedRedirect(ssrResponse.response)) {
		if (request.headers.get("x-tsr-serverFn") === "true") return waitForRequest(replaceSsrResponse(ssrResponse, Response.json({
			...ssrResponse.response.options,
			isSerializedRedirect: true
		}, { headers: ssrResponse.response.headers }), "redirect response replaced"), signal);
		return ssrResponse;
	}
	const opts = ssrResponse.response.options;
	if (opts.to && typeof opts.to === "string" && !opts.to.startsWith("/")) throw new Error(`Server side redirects must use absolute paths via the 'href' or 'to' options. The redirect() method's "to" property accepts an internal path only. Use the "href" property to provide an external URL. Received: ${JSON.stringify(opts)}`);
	if ([
		"params",
		"search",
		"hash"
	].some((d) => typeof opts[d] === "function")) throw new Error(`Server side redirects must use static search, params, and hash values and do not support functional values. Received functional values for: ${Object.keys(opts).filter((d) => typeof opts[d] === "function").map((d) => `"${d}"`).join(", ")}`);
	signal.throwIfAborted();
	const router = await waitForRequest(getRouter(), signal);
	signal.throwIfAborted();
	const redirect = router.resolveRedirect(ssrResponse.response);
	if (request.headers.get("x-tsr-serverFn") === "true") return waitForRequest(replaceSsrResponse(ssrResponse, Response.json({
		...ssrResponse.response.options,
		isSerializedRedirect: true
	}, { headers: ssrResponse.response.headers }), "redirect response replaced"), signal);
	return waitForRequest(replaceSsrResponse(ssrResponse, redirect, "redirect response replaced"), signal);
}
async function handleServerRoutes({ getRouter, request, url, executeRouter, context, executedRequestMiddlewares }) {
	const router = await getRouter();
	const pathname = executeRewriteInput(router.rewrite, url).pathname;
	const [matchedRoutes, rawParams, foundRoute] = router.getMatchedRoutes(pathname);
	const isExactMatch = foundRoute && rawParams["**"] === void 0;
	const routeMiddlewares = [];
	for (const route of matchedRoutes) {
		const serverMiddleware = route.options.server?.middleware;
		if (serverMiddleware) {
			const flattened = flattenMiddlewares(serverMiddleware);
			for (const m of flattened) if (!executedRequestMiddlewares.has(m)) routeMiddlewares.push(m.options.server);
		}
	}
	const server = foundRoute?.options.server;
	let isHeadFallback = false;
	if (server?.handlers && isExactMatch) {
		const handlers = typeof server.handlers === "function" ? server.handlers({ createHandlers: (d) => d }) : server.handlers;
		const requestMethod = request.method.toUpperCase();
		const handler = requestMethod === "HEAD" ? handlers["HEAD"] ?? handlers["GET"] ?? handlers["ANY"] : handlers[requestMethod] ?? handlers["ANY"];
		isHeadFallback = requestMethod === "HEAD" && handler !== void 0 && !handlers["HEAD"];
		if (handler) {
			const mayDefer = !!foundRoute.options.component;
			if (typeof handler === "function") routeMiddlewares.push(handlerToMiddleware(handler, mayDefer));
			else {
				if (handler.middleware?.length) {
					const handlerMiddlewares = flattenMiddlewares(handler.middleware);
					for (const m of handlerMiddlewares) routeMiddlewares.push(m.options.server);
				}
				if (handler.handler) routeMiddlewares.push(handlerToMiddleware(handler.handler, mayDefer));
			}
		}
	}
	routeMiddlewares.push(((ctx) => executeRouter(ctx.context, matchedRoutes)));
	const { ctx, response } = await executeMiddleware(routeMiddlewares, {
		request,
		context,
		params: rawParams,
		pathname,
		handlerType: "router"
	}, request.signal);
	if (isHeadFallback) {
		if (!ctx.response) throwRouteHandlerError();
		return waitForRequest(stripSsrResponseBody(await handleRedirectResponse(response, request, getRouter, request.signal), "HEAD body stripped"), request.signal);
	}
	return normalizeSsrResponse(response);
}
var fetch$1 = createStartHandler(defaultStreamHandler);
function createServerEntry(entry) {
	return { async fetch(...args) {
		return await entry.fetch(...args);
	} };
}
var server_default$1 = createServerEntry({ fetch: fetch$1 });
function llmFromAdapter(adapter) {
	return { complete: (args) => tryPromise({
		try: () => adapter.complete(args),
		catch: (cause) => cause instanceof Error ? cause : new Error(String(cause))
	}) };
}
var LlmTag = class extends Service()("twist/Llm") {};
/**
* Deterministic LLM stub for tests: echoes the last user message,
* or emits tool calls from a simple policy.
*/
var makeStubLlm = (policy = {}) => ({ complete: (args) => sync(() => {
	const ctx = {
		actorId: "stub",
		turn: 0,
		messages: args.messages,
		input: null,
		tools: args.tools,
		instructions: args.instructions
	};
	const toolCalls = policy.toolCallsFor?.(ctx);
	if (toolCalls && toolCalls.length > 0) return {
		message: {
			role: "assistant",
			content: "",
			toolCalls
		},
		toolCalls
	};
	const lastUser = [...args.messages].reverse().find((m) => m.role === "user");
	const lastContent = args.messages.at(-1)?.content;
	const content = lastUser?.content ?? (isString(lastContent) ? lastContent : JSON.stringify(lastContent ?? null));
	const done = policy.doneAfterText !== false;
	return {
		message: {
			role: "assistant",
			content
		},
		done,
		output: { text: content }
	};
}) });
var StubLlmLive = (policy) => succeed(LlmTag, makeStubLlm(policy));
/** JSON-compatible wire schema (Effect 4 mutable JSON). */
var JsonValueSchema = MutableJson;
var EventTypeSchema = Literals([
	"actor.started",
	"actor.completed",
	"actor.failed",
	"actor.cancelled",
	"agent.message.received",
	"agent.turn.started",
	"agent.turn.text_delta",
	"agent.turn.steered",
	"agent.message",
	"agent.tool_call.requested",
	"tool.result",
	"child.spawned",
	"child.completed",
	"workflow.node.started",
	"workflow.node.finished",
	"workflow.node.skipped",
	"review.requested",
	"review.decided",
	"review.timed_out",
	"timer.set",
	"timer.fired",
	"snapshot.taken"
]);
var EventOriginSchema = Struct({
	clientId: String$1,
	sessionId: String$1
});
var TwistEventSchema = Struct({
	id: String$1,
	actorId: String$1,
	type: EventTypeSchema,
	seq: Number$1,
	ts: Number$1,
	ephemeral: optional(Boolean$1),
	parentActorId: optional(NullOr(String$1)),
	origin: optional(EventOriginSchema),
	payload: JsonValueSchema
});
/**
* Promote a wire-decoded event (JsonValue payload) into the typed event union.
*/
function fromWireEvent(wire) {
	return wire;
}
/** Assign actorId + seq to an appendable event, restoring a full TwistEvent. */
function withAssignedSeq(partial, actorId, seq) {
	return {
		...partial,
		actorId,
		seq
	};
}
/** Serialize a typed domain payload for JsonValue storage (EventRow, HTTP, etc.). */
function payloadAsJson(payload) {
	return JSON.parse(JSON.stringify(payload));
}
/** Build a TwistEvent from a typed signal (HTTP / client commit). */
function eventFromSignal(signal, actorId, options) {
	return {
		id: signal.id ?? createEventId(),
		actorId,
		type: signal.type,
		seq: options?.seq ?? 0,
		ts: signal.ts ?? Date.now(),
		ephemeral: signal.ephemeral,
		parentActorId: signal.parentActorId,
		origin: signal.origin,
		payload: signal.payload
	};
}
Struct({
	seq: Number$1,
	stateHash: String$1,
	state: optional(JsonValueSchema)
});
var eventCounter = 0;
function createEventId() {
	eventCounter += 1;
	return `evt_${Date.now().toString(36)}_${eventCounter.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
function event(type, actorId, payload, options) {
	return {
		id: options?.id ?? createEventId(),
		actorId,
		type,
		seq: options?.seq ?? 0,
		ts: options?.ts ?? Date.now(),
		ephemeral: options?.ephemeral,
		parentActorId: options?.parentActorId,
		origin: options?.origin,
		payload
	};
}
function initialAgent(actorId, definitionName, input, parentActorId, maxTurns = 20) {
	return {
		actorId,
		kind: "agent",
		status: "pending",
		definitionName,
		input,
		output: null,
		error: null,
		parentActorId,
		children: {},
		reviews: {},
		owed: [],
		messages: [],
		pendingToolCalls: [],
		turn: 0,
		maxTurns,
		pendingSteer: null
	};
}
function initialWorkflow(actorId, definitionName, input, parentActorId, nodeIds, concurrency = 8) {
	return {
		actorId,
		kind: "workflow",
		status: "pending",
		definitionName,
		input,
		output: null,
		error: null,
		parentActorId,
		children: {},
		reviews: {},
		owed: [],
		concurrency,
		nodes: Object.fromEntries(nodeIds.map((nodeId) => [nodeId, {
			status: "pending",
			result: null,
			error: null
		}]))
	};
}
function setOwed(state, owed) {
	return {
		...state,
		owed
	};
}
function appendOwed(state, work) {
	return setOwed(state, [...state.owed, work]);
}
function removeOwed(state, predicate) {
	return setOwed(state, state.owed.filter((work) => !predicate(work)));
}
function payloadOf(event) {
	return event.payload;
}
function applyAgentEvent(state, event) {
	switch (event.type) {
		case "actor.started": {
			const payload = payloadOf(event);
			return appendOwed({
				...state,
				status: "running",
				definitionName: payload.definitionName,
				input: payload.input,
				parentActorId: payload.parentActorId,
				maxTurns: payload.maxTurns ?? state.maxTurns
			}, {
				type: "agent.turn",
				turn: 1
			});
		}
		case "agent.message.received": {
			const payload = payloadOf(event);
			const next = {
				...state,
				messages: [...state.messages, payload.message],
				status: state.status === "completed" || state.status === "failed" ? state.status : "running"
			};
			if (state.pendingToolCalls.length === 0 && !state.owed.some((w) => w.type === "agent.turn")) return appendOwed(next, {
				type: "agent.turn",
				turn: state.turn + 1
			});
			return next;
		}
		case "agent.turn.started": {
			const payload = payloadOf(event);
			return removeOwed({
				...state,
				turn: payload.turn,
				status: "running",
				pendingSteer: null
			}, (w) => w.type === "agent.turn" && w.turn === payload.turn);
		}
		case "agent.message": {
			const payload = payloadOf(event);
			return {
				...state,
				messages: [...state.messages, payload.message]
			};
		}
		case "agent.tool_call.requested": {
			const payload = payloadOf(event);
			return appendOwed({
				...state,
				pendingToolCalls: [...state.pendingToolCalls, payload.toolCall]
			}, {
				type: "tool.execute",
				turn: payload.turn,
				toolCall: payload.toolCall
			});
		}
		case "tool.result": {
			const payload = payloadOf(event);
			const pendingToolCalls = state.pendingToolCalls.filter((t) => t.id !== payload.toolCallId);
			let next = removeOwed({
				...state,
				pendingToolCalls,
				messages: [...state.messages, {
					role: "tool",
					content: payload.error ?? JSON.stringify(payload.result ?? null),
					toolCallId: payload.toolCallId,
					name: payload.name
				}]
			}, (w) => w.type === "tool.execute" && w.toolCall.id === payload.toolCallId);
			if (pendingToolCalls.length === 0 && next.status === "running") next = appendOwed(next, {
				type: "agent.turn",
				turn: state.turn + 1
			});
			return next;
		}
		case "child.spawned": {
			const payload = payloadOf(event);
			let next = {
				...state,
				status: "waiting_child",
				children: {
					...state.children,
					[payload.childActorId]: {
						kind: payload.childKind,
						definitionName: payload.childDefinitionName,
						status: "running"
					}
				}
			};
			if (payload.toolCallId) next = removeOwed({
				...next,
				pendingToolCalls: next.pendingToolCalls.filter((t) => t.id !== payload.toolCallId)
			}, (w) => w.type === "tool.execute" && w.toolCall.id === payload.toolCallId);
			return appendOwed(next, {
				type: "child.wait",
				childActorId: payload.childActorId
			});
		}
		case "child.completed": {
			const payload = payloadOf(event);
			const child = state.children[payload.childActorId];
			let next = removeOwed({
				...state,
				children: {
					...state.children,
					[payload.childActorId]: {
						kind: child?.kind ?? "agent",
						definitionName: child?.definitionName ?? "unknown",
						status: payload.error ? "failed" : "completed",
						output: payload.result,
						error: payload.error
					}
				}
			}, (w) => w.type === "child.wait" && w.childActorId === payload.childActorId);
			if (!Object.values(next.children).some((c) => c.status === "running") && next.status === "waiting_child") next = appendOwed({
				...next,
				status: "running"
			}, {
				type: "agent.turn",
				turn: next.turn + 1
			});
			return next;
		}
		case "review.requested": {
			const payload = payloadOf(event);
			return appendOwed({
				...state,
				status: "waiting_review",
				reviews: {
					...state.reviews,
					[payload.reviewId]: {
						reviewId: payload.reviewId,
						title: payload.title,
						description: payload.description,
						schema: payload.schema,
						actions: payload.actions,
						nodeId: payload.nodeId,
						status: "pending"
					}
				}
			}, {
				type: "review.wait",
				reviewId: payload.reviewId
			});
		}
		case "review.decided": {
			const payload = payloadOf(event);
			const existing = state.reviews[payload.reviewId];
			let next = removeOwed({
				...state,
				reviews: {
					...state.reviews,
					[payload.reviewId]: {
						reviewId: payload.reviewId,
						title: existing?.title ?? "Review",
						description: existing?.description,
						schema: existing?.schema,
						actions: existing?.actions ?? [],
						nodeId: existing?.nodeId,
						status: payload.outcome === "approve" ? "approved" : "rejected",
						decision: payload.payload ?? { actionId: payload.actionId }
					}
				}
			}, (w) => w.type === "review.wait" && w.reviewId === payload.reviewId);
			if (payload.outcome === "reject") return appendOwed({
				...next,
				status: "failed",
				error: `Review ${payload.reviewId} rejected`
			}, { type: "finalize" });
			return appendOwed({
				...next,
				status: "running"
			}, {
				type: "agent.turn",
				turn: next.turn + 1
			});
		}
		case "actor.completed": {
			const payload = payloadOf(event);
			return setOwed({
				...state,
				status: "completed",
				output: payload.output,
				owed: []
			}, []);
		}
		case "actor.failed": {
			const payload = payloadOf(event);
			return setOwed({
				...state,
				status: "failed",
				error: payload.error,
				owed: []
			}, []);
		}
		case "actor.cancelled": return setOwed({
			...state,
			status: "cancelled",
			owed: []
		}, []);
		case "agent.turn.steered": {
			const payload = payloadOf(event);
			let next = {
				...state,
				messages: [...state.messages, payload.message],
				pendingSteer: payload.message,
				status: "running"
			};
			if (payload.interrupt) {
				next = {
					...next,
					pendingToolCalls: [],
					owed: next.owed.filter((w) => w.type !== "tool.execute")
				};
				next = appendOwed(next, {
					type: "agent.turn",
					turn: Math.max(state.turn, payload.turn) + 1
				});
			}
			return next;
		}
		case "agent.turn.text_delta":
		case "snapshot.taken":
		case "workflow.node.started":
		case "workflow.node.finished":
		case "workflow.node.skipped":
		case "timer.set":
		case "timer.fired":
		case "review.timed_out": return state;
		default: return state;
	}
}
function applyWorkflowEvent(state, event) {
	switch (event.type) {
		case "actor.started": {
			const payload = payloadOf(event);
			const nodeIds = payload.nodeIds ?? Object.keys(state.nodes);
			return appendOwed({
				...state,
				status: "running",
				definitionName: payload.definitionName,
				input: payload.input,
				parentActorId: payload.parentActorId,
				concurrency: payload.concurrency ?? state.concurrency,
				nodes: Object.fromEntries(nodeIds.map((nodeId) => [nodeId, state.nodes[nodeId] ?? {
					status: "pending",
					result: null,
					error: null
				}]))
			}, { type: "workflow.schedule" });
		}
		case "workflow.node.started": {
			const payload = payloadOf(event);
			return removeOwed(removeOwed({
				...state,
				nodes: {
					...state.nodes,
					[payload.nodeId]: {
						status: "running",
						result: null,
						error: null,
						reviewId: state.nodes[payload.nodeId]?.reviewId
					}
				}
			}, (w) => w.type === "workflow.run_node" && w.nodeId === payload.nodeId), (w) => w.type === "workflow.schedule");
		}
		case "workflow.node.finished": {
			const payload = payloadOf(event);
			const next = {
				...state,
				nodes: {
					...state.nodes,
					[payload.nodeId]: {
						status: payload.error ? "failed" : "completed",
						result: payload.result,
						error: payload.error
					}
				}
			};
			if (payload.error) return appendOwed({
				...next,
				status: "failed",
				error: payload.error
			}, { type: "finalize" });
			return appendOwed(removeOwed(next, (w) => w.type === "workflow.schedule"), { type: "workflow.schedule" });
		}
		case "workflow.node.skipped": {
			const payload = payloadOf(event);
			return appendOwed(removeOwed({
				...state,
				nodes: {
					...state.nodes,
					[payload.nodeId]: {
						status: "skipped",
						result: null,
						error: null
					}
				}
			}, (w) => w.type === "workflow.schedule"), { type: "workflow.schedule" });
		}
		case "review.requested": {
			const payload = payloadOf(event);
			const nodeId = payload.nodeId;
			return appendOwed({
				...state,
				status: "waiting_review",
				reviews: {
					...state.reviews,
					[payload.reviewId]: {
						reviewId: payload.reviewId,
						title: payload.title,
						description: payload.description,
						schema: payload.schema,
						actions: payload.actions,
						nodeId,
						status: "pending"
					}
				},
				nodes: nodeId ? {
					...state.nodes,
					[nodeId]: {
						status: "waiting_review",
						result: null,
						error: null,
						reviewId: payload.reviewId
					}
				} : state.nodes
			}, {
				type: "review.wait",
				reviewId: payload.reviewId
			});
		}
		case "review.decided": {
			const payload = payloadOf(event);
			const existing = state.reviews[payload.reviewId];
			const nodeId = existing?.nodeId;
			let next = removeOwed({
				...state,
				reviews: {
					...state.reviews,
					[payload.reviewId]: {
						reviewId: payload.reviewId,
						title: existing?.title ?? "Review",
						description: existing?.description,
						schema: existing?.schema,
						actions: existing?.actions ?? [],
						nodeId,
						status: payload.outcome === "approve" ? "approved" : "rejected",
						decision: payload.payload ?? { actionId: payload.actionId }
					}
				}
			}, (w) => w.type === "review.wait" && w.reviewId === payload.reviewId);
			if (payload.outcome === "reject") return appendOwed({
				...next,
				status: "failed",
				error: `Review ${payload.reviewId} rejected`,
				nodes: nodeId ? {
					...next.nodes,
					[nodeId]: {
						status: "failed",
						result: null,
						error: "rejected",
						reviewId: payload.reviewId
					}
				} : next.nodes
			}, { type: "finalize" });
			if (nodeId) {
				next = {
					...next,
					status: "running",
					nodes: {
						...next.nodes,
						[nodeId]: {
							status: "completed",
							result: payload.payload ?? { approved: true },
							error: null,
							reviewId: payload.reviewId
						}
					}
				};
				return appendOwed(removeOwed(next, (w) => w.type === "workflow.schedule"), { type: "workflow.schedule" });
			}
			return appendOwed(removeOwed({
				...next,
				status: "running"
			}, (w) => w.type === "workflow.schedule"), { type: "workflow.schedule" });
		}
		case "child.spawned": {
			const payload = payloadOf(event);
			return appendOwed({
				...state,
				status: "waiting_child",
				children: {
					...state.children,
					[payload.childActorId]: {
						kind: payload.childKind,
						definitionName: payload.childDefinitionName,
						status: "running"
					}
				}
			}, {
				type: "child.wait",
				childActorId: payload.childActorId
			});
		}
		case "child.completed": {
			const payload = payloadOf(event);
			const child = state.children[payload.childActorId];
			let next = removeOwed({
				...state,
				children: {
					...state.children,
					[payload.childActorId]: {
						kind: child?.kind ?? "workflow",
						definitionName: child?.definitionName ?? "unknown",
						status: payload.error ? "failed" : "completed",
						output: payload.result,
						error: payload.error
					}
				}
			}, (w) => w.type === "child.wait" && w.childActorId === payload.childActorId);
			if (!Object.values(next.children).some((c) => c.status === "running")) {
				next = {
					...next,
					status: "running"
				};
				return appendOwed(removeOwed(next, (w) => w.type === "workflow.schedule"), { type: "workflow.schedule" });
			}
			return next;
		}
		case "timer.set": {
			const payload = payloadOf(event);
			return appendOwed(removeOwed({
				...state,
				status: "waiting_timer"
			}, (w) => w.type === "workflow.schedule"), {
				type: "timer.wait",
				timerId: payload.timerId,
				wakeAt: payload.wakeAt
			});
		}
		case "timer.fired": {
			const payload = payloadOf(event);
			return appendOwed(removeOwed(removeOwed({
				...state,
				status: "running"
			}, (w) => w.type === "timer.wait" && w.timerId === payload.timerId), (w) => w.type === "workflow.schedule"), { type: "workflow.schedule" });
		}
		case "actor.completed": {
			const payload = payloadOf(event);
			return setOwed({
				...state,
				status: "completed",
				output: payload.output,
				owed: []
			}, []);
		}
		case "actor.failed": {
			const payload = payloadOf(event);
			return setOwed({
				...state,
				status: "failed",
				error: payload.error,
				owed: []
			}, []);
		}
		case "actor.cancelled": return setOwed({
			...state,
			status: "cancelled",
			owed: []
		}, []);
		case "snapshot.taken":
		case "agent.message.received":
		case "agent.turn.started":
		case "agent.turn.text_delta":
		case "agent.turn.steered":
		case "agent.message":
		case "agent.tool_call.requested":
		case "tool.result":
		case "review.timed_out": return state;
		default: return state;
	}
}
function reduceActor(events, options) {
	const first = events.find((e) => e.type === "actor.started");
	const started = first ? payloadOf(first) : void 0;
	const kind = options?.kind ?? started?.kind ?? "agent";
	const actorId = options?.actorId ?? events[0]?.actorId ?? "unknown";
	const definitionName = options?.definitionName ?? started?.definitionName ?? "unknown";
	const input = options?.input ?? started?.input ?? null;
	const parentActorId = started?.parentActorId ?? null;
	let state = kind === "workflow" ? initialWorkflow(actorId, definitionName, input, parentActorId, options?.nodeIds ?? started?.nodeIds ?? [], started?.concurrency) : initialAgent(actorId, definitionName, input, parentActorId, started?.maxTurns);
	for (const event of events) {
		if (event.ephemeral) continue;
		if (state.kind === "agent") state = applyAgentEvent(state, event);
		else state = applyWorkflowEvent(state, event);
	}
	return state;
}
function isTerminal(state) {
	return state.status === "completed" || state.status === "failed" || state.status === "cancelled";
}
function isParked(state) {
	return state.status === "waiting_review" || state.status === "waiting_child" || state.status === "waiting_timer" || state.owed.every((w) => w.type === "review.wait" || w.type === "child.wait" || w.type === "timer.wait");
}
var InvalidInputError = class extends Error {
	_tag = "InvalidInputError";
	issues;
	constructor(message, issues = []) {
		super(message);
		this.name = "InvalidInputError";
		this.issues = issues;
	}
};
function toStandard(candidate) {
	if (!candidate) return;
	if (isSchema(candidate)) return toStandardSchemaV1(candidate);
	if (isObject(candidate) && "~standard" in candidate) return candidate;
}
function extractSchema(schemaOrDef) {
	const direct = toStandard(schemaOrDef);
	if (direct) return direct;
	if (schemaOrDef && isObject(schemaOrDef) && "input" in schemaOrDef) return toStandard(schemaOrDef.input);
}
function formatIssue(issue) {
	if (!issue.path || issue.path.length === 0) return issue.message;
	return `${issue.path.map((p) => {
		if (isReadonlyObject(p) && "key" in p) return String(p.key);
		if (isString(p) || isNumber(p)) return String(p);
		return "";
	}).filter((s) => s.length > 0).join(".")}: ${issue.message}`;
}
async function validateInput(schemaOrDef, raw) {
	const schema = extractSchema(schemaOrDef);
	if (!schema) return raw;
	let result = schema["~standard"].validate(raw);
	if (result instanceof Promise) result = await result;
	if (result.issues !== void 0) throw new InvalidInputError(`Invalid input: ${result.issues.map(formatIssue).join(", ")}`, result.issues);
	return result.value;
}
async function validateDefinitionInput(def, raw) {
	if (!def || !("input" in def) || !def.input) return raw;
	return await validateInput(def.input, raw);
}
function defineTool(def) {
	return {
		kind: "function",
		...def
	};
}
function defineAgent(def) {
	return {
		kind: "agent",
		...def
	};
}
function defineWorkflow(def) {
	return {
		kind: "workflow",
		...def
	};
}
function asAgentTool(def) {
	return {
		kind: "agent-tool",
		...def
	};
}
function readyNodes(workflow, nodeStates) {
	return workflow.nodes.filter((node) => {
		const state = nodeStates[node.id];
		if (!state || state.status !== "pending") return false;
		return (node.deps ?? []).every((depId) => {
			const dep = nodeStates[depId];
			return dep?.status === "completed" || dep?.status === "skipped";
		});
	}).map((node) => node.id);
}
var EventStoreError = class extends Error {
	_tag = "EventStoreError";
	conflict;
	cause;
	constructor(message, cause, options) {
		super(message);
		this.name = "EventStoreError";
		this.cause = cause;
		this.conflict = options?.conflict;
	}
};
var EventStoreConflictError = class extends EventStoreError {
	_tag = "EventStoreConflictError";
	conflict = true;
	expectedTail;
	actualTail;
	constructor(actorId, expectedTail, actualTail) {
		super(`Conflict appending to ${actorId}: expected tail ${expectedTail}, got ${actualTail}`, void 0, { conflict: true });
		this.name = "EventStoreConflictError";
		this.expectedTail = expectedTail;
		this.actualTail = actualTail;
	}
};
var EventStoreTag = class extends Service()("twist/EventStore") {};
var makeMemoryEventStore = gen(function* () {
	const logs = yield* make$1(/* @__PURE__ */ new Map());
	const getOrCreate = (map, actorId) => {
		const existing = map.get(actorId);
		if (existing) return existing;
		const created = {
			events: [],
			waiters: []
		};
		map.set(actorId, created);
		return created;
	};
	const service = {
		append: (actorId, events, options) => gen(function* () {
			const sequences = [];
			yield* update(logs, (map) => {
				const next = new Map(map);
				const log = getOrCreate(next, actorId);
				if (options?.expectedTail !== void 0 && log.events.length !== options.expectedTail) throw new EventStoreConflictError(actorId, options.expectedTail, log.events.length);
				const appended = [];
				for (const partial of events) {
					const seq = log.events.length + appended.length + 1;
					const event = withAssignedSeq(partial, actorId, seq);
					appended.push(event);
					sequences.push(seq);
				}
				const updated = {
					events: [...log.events, ...appended],
					waiters: log.waiters
				};
				next.set(actorId, updated);
				for (const event of appended) for (const waiter of log.waiters) waiter(event);
				return next;
			}).pipe(catchDefect((cause) => fail(cause instanceof EventStoreError ? cause : new EventStoreError("append failed", cause))));
			return {
				sequences,
				tail: yield* service.tail(actorId)
			};
		}),
		read: (actorId, options) => gen(function* () {
			const log = (yield* get(logs)).get(actorId);
			if (!log) return [];
			const fromSeq = options?.fromSeq ?? 1;
			const sliced = log.events.filter((e) => e.seq >= fromSeq);
			return options?.limit !== void 0 ? sliced.slice(0, options.limit) : sliced;
		}),
		tail: (actorId) => gen(function* () {
			return (yield* get(logs)).get(actorId)?.events.length ?? 0;
		}),
		subscribe: (actorId, options) => callback$1((queue) => gen(function* () {
			const fromSeq = options?.fromSeq ?? 1;
			const map = yield* get(logs);
			const log = getOrCreate(map, actorId);
			yield* update(logs, (m) => {
				const n = new Map(m);
				if (!n.has(actorId)) n.set(actorId, log);
				return n;
			});
			for (const event of log.events) if (event.seq >= fromSeq) offerUnsafe(queue, event);
			const waiter = (event) => {
				if (event.seq >= fromSeq) offerUnsafe(queue, event);
			};
			log.waiters.push(waiter);
			yield* addFinalizer(() => sync(() => {
				const idx = log.waiters.indexOf(waiter);
				if (idx >= 0) log.waiters.splice(idx, 1);
			}));
		})),
		listActors: () => gen(function* () {
			return [...(yield* get(logs)).keys()];
		})
	};
	return service;
});
effect(EventStoreTag, makeMemoryEventStore);
var fromNumH = (n) => n / 2 ** 32 | 0;
var fromNumL = (n) => n >>> 0;
function setU64FromNum(view, byteOffset, n, isLE) {
	const h = fromNumH(n);
	const l = fromNumL(n);
	view.setUint32(byteOffset, isLE ? l : h, isLE);
	view.setUint32(byteOffset + 4, isLE ? h : l, isLE);
}
/**
* Checks if something is Uint8Array. Be careful: nodejs Buffer will return true.
* @param a - value to test
* @returns `true` when the value is a Uint8Array-compatible view.
* @example
* Check whether a value is a Uint8Array-compatible view.
* ```ts
* isBytes(new Uint8Array([1, 2, 3]));
* ```
*/
function isBytes(a) {
	return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
var atitle = (title) => title ? `"${title}" ` : "";
/**
* Asserts something is a non-negative integer.
* @param n - number to validate
* @param title - label included in thrown errors
* @returns The validated number.
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Validate a non-negative integer option.
* ```ts
* anumber(32, 'length');
* ```
*/
function anumber(n, title = "") {
	if (typeof n !== "number") throw new TypeError(atitle(title) + "expected number, got " + typeof n);
	if (!Number.isSafeInteger(n) || n < 0) throw new RangeError(atitle(title) + "expected integer >= 0, got " + n);
	return n;
}
/**
* Asserts something is Uint8Array.
* @param value - value to validate
* @param length - optional exact length constraint
* @param title - label included in thrown errors
* @returns The validated byte array.
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Validate that a value is a byte array.
* ```ts
* abytes(new Uint8Array([1, 2, 3]));
* ```
*/
function abytes(value, length, title = "") {
	if (isBytes(value) && (length === void 0 || value.length === length)) return value;
	if (length !== void 0) anumber(length, "length");
	const bytes = isBytes(value);
	const ofLen = length !== void 0 ? ` of length ${length}` : "";
	const got = bytes ? `length=${value.length}` : `type=${typeof value}`;
	const message = atitle(title) + "expected Uint8Array" + ofLen + ", got " + got;
	if (!bytes) throw new TypeError(message);
	throw new RangeError(message);
}
var aobject = (value, label) => {
	if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError((label === "object" ? "" : `"${label}" `) + "expected object, got type=" + typeof value);
};
var aopts = (value, label) => {
	aobject(value, label);
	const proto = Object.getPrototypeOf(value);
	if (proto !== Object.prototype && proto !== null) throw new TypeError(`"${label}" expected plain object`);
	if (Object.hasOwn(value, "__proto__")) throw new TypeError(`"${label}.__proto__" is not allowed`);
};
/**
* Asserts a hash instance has not been destroyed or finished.
* @param instance - hash instance to validate
* @param checkFinished - whether to reject finalized instances
* @throws If the hash instance has already been destroyed or finalized. {@link Error}
* @example
* Validate that a hash instance is still usable.
* ```ts
* import { aexists } from '@noble/hashes/utils.js';
* import { sha256 } from '@noble/hashes/sha2.js';
* const hash = sha256.create();
* aexists(hash);
* ```
*/
function aexists(instance, checkFinished = true) {
	if (instance.destroyed) throw new Error("hash was destroyed");
	if (checkFinished && instance.finished) throw new Error("digest() was already called");
}
/**
* Asserts output is a sufficiently-sized byte array.
* @param out - destination buffer
* @param instance - hash instance providing output length
* Oversized buffers are allowed; downstream code only promises to fill the first `outputLen` bytes.
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Validate a caller-provided digest buffer.
* ```ts
* import { aoutput } from '@noble/hashes/utils.js';
* import { sha256 } from '@noble/hashes/sha2.js';
* const hash = sha256.create();
* aoutput(new Uint8Array(hash.outputLen), hash);
* ```
*/
function aoutput(out, instance) {
	abytes(out, void 0, "output");
	const min = instance.outputLen;
	if (!(out.length >= min)) throw new RangeError("\"output\" expected length >= " + min);
}
/**
* Zeroizes typed arrays in place. Warning: JS provides no guarantees.
* @param arrays - arrays to overwrite with zeros
* @example
* Zeroize sensitive buffers in place.
* ```ts
* clean(new Uint8Array([1, 2, 3]));
* ```
*/
function clean(...arrays) {
	for (let i = 0; i < arrays.length; i++) arrays[i].fill(0);
}
/**
* Creates a DataView for byte-level manipulation.
* @param arr - source typed array
* @returns DataView over the same buffer region.
* @example
* Create a DataView over an existing buffer.
* ```ts
* createView(new Uint8Array(4));
* ```
*/
function createView(arr) {
	return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
/**
* Rotate-right operation for uint32 values.
* @param word - source word
* @param shift - shift amount in bits
* @returns Rotated word.
* @example
* Rotate a 32-bit word to the right.
* ```ts
* rotr(0x12345678, 8);
* ```
*/
function rotr(word, shift) {
	return word << 32 - shift | word >>> shift;
}
var hasHexBuiltin = /* @__PURE__ */ (() => typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function")();
var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
/**
* Convert byte array to hex string.
* Uses the built-in function when available and assumes it matches the tested
* fallback semantics.
* @param bytes - bytes to encode
* @returns Lowercase hexadecimal string.
* @throws On wrong argument types. {@link TypeError}
* @example
* Convert bytes to lowercase hexadecimal.
* ```ts
* bytesToHex(Uint8Array.from([0xca, 0xfe, 0x01, 0x23])); // 'cafe0123'
* ```
*/
function bytesToHex(bytes) {
	abytes(bytes);
	if (hasHexBuiltin) return bytes.toHex();
	let hex = "";
	for (let i = 0; i < bytes.length; i++) hex += hexes[bytes[i]];
	return hex;
}
/**
* Merges default options and passed options.
* @param defaults - base option object
* @param opts - user overrides
* @param title - label included in thrown override errors
* @returns Fresh merged option object with a null prototype.
* @throws On wrong argument types. {@link TypeError}
* @example
* Merge user overrides onto default options.
* ```ts
* checkOpts({ dkLen: 32 }, { asyncTick: 10 });
* ```
*/
function checkOpts(defaults, opts, title = "opts") {
	aopts(defaults, "defaults");
	if (opts !== void 0) aopts(opts, title);
	return Object.assign(Object.create(null), defaults, opts);
}
/**
* Creates a callable hash function from a stateful class constructor.
* @param hashCons - hash constructor or factory
* @param info - optional metadata such as DER OID
* @returns Frozen callable hash wrapper with `.create()`.
*   Wrapper construction eagerly calls `hashCons(undefined)` once to read
*   `outputLen` / `blockLen`, so constructor side effects happen at module
*   init time.
* @throws On wrong argument types. {@link TypeError}
* @example
* Wrap a stateful hash constructor into a callable helper.
* ```ts
* import { createHasher } from '@noble/hashes/utils.js';
* import { sha256 } from '@noble/hashes/sha2.js';
* const wrapped = createHasher(sha256.create, { oid: sha256.oid });
* wrapped(new Uint8Array([1]));
* ```
*/
function createHasher(hashCons, info = {}) {
	if (typeof hashCons !== "function") throw new TypeError("\"hashCons\" expected function, got type=" + typeof hashCons);
	info = checkOpts({}, info, "info");
	const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
	const tmp = hashCons(void 0);
	hashC.outputLen = tmp.outputLen;
	hashC.blockLen = tmp.blockLen;
	hashC.canXOF = tmp.canXOF;
	hashC.create = (opts) => hashCons(opts);
	Object.assign(hashC, info);
	return Object.freeze(hashC);
}
/**
* Creates OID metadata for NIST hashes with prefix `06 09 60 86 48 01 65 03 04 02`.
* @param suffix - final OID byte for the selected hash.
*   The helper accepts any byte even though only the documented NIST hash
*   suffixes are meaningful downstream.
* @returns Object containing the DER-encoded OID.
* @example
* Build OID metadata for a NIST hash.
* ```ts
* oidNist(0x01);
* ```
*/
var oidNist = (suffix) => ({ oid: Uint8Array.from([
	6,
	9,
	96,
	134,
	72,
	1,
	101,
	3,
	4,
	2,
	suffix
]) });
/**
* Internal Merkle-Damgard hash utils.
* @module
*/
/**
* Shared 32-bit conditional boolean primitive reused by SHA-256, SHA-1, and MD5 `F`.
* Returns bits from `b` when `a` is set, otherwise from `c`.
* The XOR form is equivalent to MD5's `F(X,Y,Z) = XY v not(X)Z` because the masked terms never
* set the same bit.
* @param a - selector word
* @param b - word chosen when selector bit is set
* @param c - word chosen when selector bit is clear
* @returns Mixed 32-bit word.
* @example
* Combine three words with the shared 32-bit choice primitive.
* ```ts
* Chi(0xffffffff, 0x12345678, 0x87654321);
* ```
*/
function Chi(a, b, c) {
	return a & b ^ ~a & c;
}
/**
* Shared 32-bit majority primitive reused by SHA-256 and SHA-1.
* Returns bits shared by at least two inputs.
* @param a - first input word
* @param b - second input word
* @param c - third input word
* @returns Mixed 32-bit word.
* @example
* Combine three words with the shared 32-bit majority primitive.
* ```ts
* Maj(0xffffffff, 0x12345678, 0x87654321);
* ```
*/
function Maj(a, b, c) {
	return a & b ^ a & c ^ b & c;
}
/**
* Merkle-Damgard hash construction base class.
* Could be used to create MD5, RIPEMD, SHA1, SHA2.
* Accepts only byte-aligned `Uint8Array` input, even when the underlying spec describes bit
* strings with partial-byte tails.
* @param blockLen - internal block size in bytes
* @param outputLen - digest size in bytes
* @param padOffset - trailing length field size in bytes
* @param isLE - whether length and state words are encoded in little-endian
* @example
* Use a concrete subclass to get the shared Merkle-Damgard update/digest flow.
* ```ts
* import { _SHA1 } from '@noble/hashes/legacy.js';
* const hash = new _SHA1();
* hash.update(new Uint8Array([97, 98, 99]));
* hash.digest();
* ```
*/
var HashMD = class {
	blockLen;
	outputLen;
	canXOF = false;
	padOffset;
	isLE;
	buffer;
	view;
	finished = false;
	length = 0;
	pos = 0;
	destroyed = false;
	constructor(blockLen, outputLen, padOffset, isLE) {
		this.blockLen = blockLen;
		this.outputLen = outputLen;
		this.padOffset = padOffset;
		this.isLE = isLE;
		this.buffer = new Uint8Array(blockLen);
		this.view = createView(this.buffer);
	}
	update(data) {
		aexists(this);
		abytes(data);
		const { view, buffer, blockLen } = this;
		const len = data.length;
		let processed = false;
		for (let pos = 0; pos < len;) {
			const take = Math.min(blockLen - this.pos, len - pos);
			if (take === blockLen) {
				const dataView = createView(data);
				for (; blockLen <= len - pos; pos += blockLen) this.process(dataView, pos);
				processed = true;
				continue;
			}
			buffer.set(pos === 0 && take === len ? data : data.subarray(pos, pos + take), this.pos);
			this.pos += take;
			pos += take;
			if (this.pos === blockLen) {
				this.process(view, 0);
				this.pos = 0;
				processed = true;
			}
		}
		this.length += data.length;
		if (processed) this.roundClean();
		return this;
	}
	digestInto(out) {
		aexists(this);
		aoutput(out, this);
		this.finished = true;
		const { buffer, view, blockLen, isLE } = this;
		let { pos } = this;
		buffer[pos++] = 128;
		buffer.fill(0, pos);
		if (this.padOffset > blockLen - pos) {
			this.process(view, 0);
			buffer.fill(0);
		}
		setU64FromNum(view, blockLen - 8, this.length * 8, isLE);
		this.process(view, 0);
		this.roundClean();
		const oview = out === buffer ? view : createView(out);
		const len = this.outputLen;
		const outLen = len / 4;
		const state = this.get();
		if (len % 4 || outLen > state.length) throw new Error("invalid outputLen");
		for (let i = 0; i < outLen; i++) oview.setUint32(4 * i, state[i], isLE);
	}
	digest() {
		const { buffer, outputLen } = this;
		this.digestInto(buffer);
		const res = buffer.slice(0, outputLen);
		this.destroy();
		return res;
	}
	_cloneIntoMeta(to) {
		const { buffer, length, finished, destroyed, pos } = this;
		to.destroyed = destroyed;
		to.finished = finished;
		to.length = length;
		to.pos = pos;
		if (pos) to.buffer.set(buffer);
		return to;
	}
	clone() {
		return this._cloneInto();
	}
};
/**
* Initial SHA-2 state: fractional parts of square roots of first 16 primes 2..53.
* Check out `test/misc/sha2-gen-iv.js` for recomputation guide.
*/
/** Initial SHA256 state from RFC 6234 §6.1: the first 32 bits of the fractional parts of the
* square roots of the first eight prime numbers. Exported as a shared table; callers must treat
* it as read-only because constructors copy words from it by index. */
var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
	1779033703,
	3144134277,
	1013904242,
	2773480762,
	1359893119,
	2600822924,
	528734635,
	1541459225
]);
/**
* SHA2 hash function. A.k.a. sha256, sha384, sha512, sha512_224, sha512_256.
* SHA256 is the fastest hash implementable in JS, even faster than Blake3.
* Check out {@link https://www.rfc-editor.org/rfc/rfc4634 | RFC 4634} and
* {@link https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf | FIPS 180-4}.
* @module
*/
/**
* SHA-224 / SHA-256 round constants from RFC 6234 §5.1: the first 32 bits
* of the cube roots of the first 64 primes (2..311).
*/
var SHA256_K = /* @__PURE__ */ Uint32Array.from([
	1116352408,
	1899447441,
	3049323471,
	3921009573,
	961987163,
	1508970993,
	2453635748,
	2870763221,
	3624381080,
	310598401,
	607225278,
	1426881987,
	1925078388,
	2162078206,
	2614888103,
	3248222580,
	3835390401,
	4022224774,
	264347078,
	604807628,
	770255983,
	1249150122,
	1555081692,
	1996064986,
	2554220882,
	2821834349,
	2952996808,
	3210313671,
	3336571891,
	3584528711,
	113926993,
	338241895,
	666307205,
	773529912,
	1294757372,
	1396182291,
	1695183700,
	1986661051,
	2177026350,
	2456956037,
	2730485921,
	2820302411,
	3259730800,
	3345764771,
	3516065817,
	3600352804,
	4094571909,
	275423344,
	430227734,
	506948616,
	659060556,
	883997877,
	958139571,
	1322822218,
	1537002063,
	1747873779,
	1955562222,
	2024104815,
	2227730452,
	2361852424,
	2428436474,
	2756734187,
	3204031479,
	3329325298
]);
/** Reusable SHA-224 / SHA-256 message schedule buffer `W_t` from RFC 6234 §6.2 step 1. */
var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
/** Internal SHA-224 / SHA-256 compression engine from RFC 6234 §6.2. */
var SHA2_32B = class extends HashMD {
	A = 0;
	B = 0;
	C = 0;
	D = 0;
	E = 0;
	F = 0;
	G = 0;
	H = 0;
	constructor(outputLen, IV) {
		super(64, outputLen, 8, false);
		this.A = IV[0] | 0;
		this.B = IV[1] | 0;
		this.C = IV[2] | 0;
		this.D = IV[3] | 0;
		this.E = IV[4] | 0;
		this.F = IV[5] | 0;
		this.G = IV[6] | 0;
		this.H = IV[7] | 0;
	}
	get() {
		const { A, B, C, D, E, F, G, H } = this;
		return [
			A,
			B,
			C,
			D,
			E,
			F,
			G,
			H
		];
	}
	set(A, B, C, D, E, F, G, H) {
		this.A = A | 0;
		this.B = B | 0;
		this.C = C | 0;
		this.D = D | 0;
		this.E = E | 0;
		this.F = F | 0;
		this.G = G | 0;
		this.H = H | 0;
	}
	_cloneInto(to) {
		(to ||= new this.constructor()).set(...this.get());
		return this._cloneIntoMeta(to);
	}
	process(view, offset) {
		for (let i = 0; i < 16; i++, offset += 4) SHA256_W[i] = view.getUint32(offset, false);
		for (let i = 16; i < 64; i++) {
			const W15 = SHA256_W[i - 15];
			const W2 = SHA256_W[i - 2];
			const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
			const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
			SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
		}
		let { A, B, C, D, E, F, G, H } = this;
		for (let i = 0; i < 64; i++) {
			const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
			const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
			const T2 = (rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22)) + Maj(A, B, C) | 0;
			H = G;
			G = F;
			F = E;
			E = D + T1 | 0;
			D = C;
			C = B;
			B = A;
			A = T1 + T2 | 0;
		}
		A = A + this.A | 0;
		B = B + this.B | 0;
		C = C + this.C | 0;
		D = D + this.D | 0;
		E = E + this.E | 0;
		F = F + this.F | 0;
		G = G + this.G | 0;
		H = H + this.H | 0;
		this.set(A, B, C, D, E, F, G, H);
	}
	roundClean() {
		clean(SHA256_W);
	}
	destroy() {
		this.destroyed = true;
		this.set(0, 0, 0, 0, 0, 0, 0, 0);
		clean(this.buffer);
	}
};
/** Internal SHA-256 hash class grounded in RFC 6234 §6.2. */
var _SHA256 = class extends SHA2_32B {
	constructor() {
		super(32, SHA256_IV);
	}
};
/**
* SHA2-256 hash function from RFC 4634. In JS it's the fastest: even faster than Blake3. Some info:
*
* - Trying 2^128 hashes would get 50% chance of collision, using birthday attack.
* - BTC network is doing 2^70 hashes/sec (2^95 hashes/year) as per 2025.
* - Each sha256 hash is executing 2^18 bit operations.
* - Good 2024 ASICs can do 200Th/sec with 3500 watts of power, corresponding to 2^36 hashes/joule.
* @param msg - message bytes to hash
* @param opts - Reserved hash options.
* @returns Digest bytes.
* @example
* Hash a message with SHA2-256.
* ```ts
* sha256(new Uint8Array([97, 98, 99]));
* ```
*/
var sha256 = /* @__PURE__ */ createHasher(() => new _SHA256(), /* @__PURE__ */ oidNist(1));
var ActorKindSchema = Literals(["agent", "workflow"]);
var ActorStatusSchema = Literals([
	"pending",
	"running",
	"waiting_review",
	"waiting_child",
	"waiting_timer",
	"completed",
	"failed",
	"cancelled"
]);
var NodeStatusSchema = Literals([
	"pending",
	"running",
	"completed",
	"failed",
	"skipped",
	"waiting_review"
]);
var ToolCallSchema = Struct({
	id: String$1,
	name: String$1,
	arguments: JsonValueSchema
});
var MessageSchema$1 = Struct({
	role: Literals([
		"system",
		"user",
		"assistant",
		"tool"
	]),
	content: String$1,
	toolCallId: optional(String$1),
	name: optional(String$1),
	toolCalls: optional(mutable(ArraySchema(ToolCallSchema)))
});
var ChildRefSchema = Struct({
	kind: ActorKindSchema,
	definitionName: String$1,
	status: ActorStatusSchema,
	output: optional(NullOr(JsonValueSchema)),
	error: optional(NullOr(String$1))
});
var ReviewRequestSchema = Struct({
	reviewId: String$1,
	title: String$1,
	description: optional(String$1),
	schema: optional(JsonValueSchema),
	actions: mutable(ArraySchema(Struct({
		id: String$1,
		label: String$1,
		outcome: Literals(["approve", "reject"])
	}))),
	nodeId: optional(String$1),
	status: Literals([
		"pending",
		"approved",
		"rejected",
		"timed_out"
	]),
	decision: optional(JsonValueSchema)
});
var NodeStateSchema = Struct({
	status: NodeStatusSchema,
	result: NullOr(JsonValueSchema),
	error: NullOr(String$1),
	reviewId: optional(String$1)
});
var OwedWorkSchema = Union([
	Struct({
		type: Literal("agent.turn"),
		turn: Number$1
	}),
	Struct({
		type: Literal("tool.execute"),
		turn: Number$1,
		toolCall: ToolCallSchema
	}),
	Struct({ type: Literal("workflow.schedule") }),
	Struct({
		type: Literal("workflow.run_node"),
		nodeId: String$1
	}),
	Struct({
		type: Literal("review.wait"),
		reviewId: String$1
	}),
	Struct({
		type: Literal("child.wait"),
		childActorId: String$1
	}),
	Struct({
		type: Literal("timer.wait"),
		timerId: String$1,
		wakeAt: Number$1
	}),
	Struct({ type: Literal("finalize") })
]);
var ActorBaseFields = {
	actorId: String$1,
	status: ActorStatusSchema,
	definitionName: String$1,
	input: JsonValueSchema,
	output: NullOr(JsonValueSchema),
	error: NullOr(String$1),
	parentActorId: NullOr(String$1),
	children: Record(String$1, ChildRefSchema),
	reviews: Record(String$1, ReviewRequestSchema),
	owed: mutable(ArraySchema(OwedWorkSchema))
};
var AgentStateSchema = Struct({
	...ActorBaseFields,
	kind: Literal("agent"),
	messages: mutable(ArraySchema(MessageSchema$1)),
	pendingToolCalls: mutable(ArraySchema(ToolCallSchema)),
	turn: Number$1,
	maxTurns: Number$1,
	pendingSteer: NullOr(MessageSchema$1)
});
var WorkflowStateSchema = Struct({
	...ActorBaseFields,
	kind: Literal("workflow"),
	nodes: Record(String$1, NodeStateSchema),
	concurrency: Number$1
});
Union([AgentStateSchema, WorkflowStateSchema]);
function hashActorState(state) {
	const json = JSON.stringify(state);
	return bytesToHex(sha256(new TextEncoder().encode(json))).slice(0, 16);
}
function actorStateToJsonValue(state) {
	const raw = JSON.parse(JSON.stringify(state));
	return decodeUnknownSync(JsonValueSchema)(raw);
}
function shouldTakeSnapshot(events, every = 200) {
	const durable = events.filter((e) => !e.ephemeral && e.type !== "snapshot.taken");
	if (durable.length === 0) return false;
	let lastSnap;
	for (let i = events.length - 1; i >= 0; i--) {
		const candidate = events[i];
		if (candidate?.type === "snapshot.taken") {
			lastSnap = candidate;
			break;
		}
	}
	return (lastSnap ? durable.filter((e) => e.seq > lastSnap.seq).length : durable.length) >= every;
}
/**
* Build a `snapshot.taken` event for the current reduced state.
* Clients / hosts can truncate history before this seq on cold start.
*/
function buildSnapshotEvent(actorId, events, options) {
	const state = reduceActor(events, { actorId });
	const payload = {
		seq: events[events.length - 1]?.seq ?? 0,
		stateHash: hashActorState(state)
	};
	if (options?.includeState) payload.state = actorStateToJsonValue(state);
	return event("snapshot.taken", actorId, payload);
}
function encodeTwistEvent(event) {
	return {
		name: event.type,
		args: {
			id: event.id,
			ts: event.ts,
			payload: payloadAsJson(event.payload),
			parentActorId: event.parentActorId ?? null,
			ephemeral: event.ephemeral ?? false
		},
		seqNum: event.seq,
		parentSeqNum: Math.max(0, event.seq - 1),
		clientId: event.origin?.clientId ?? "twist-host",
		sessionId: event.origin?.sessionId ?? "twist-host"
	};
}
function decodeTwistEvent(raw, actorId) {
	if (!isReadonlyObject(raw)) throw new Error("Invalid event payload: expected object");
	if ("name" in raw && isString(raw.name)) {
		const args = "args" in raw && isReadonlyObject(raw.args) ? raw.args : {};
		const payload = "payload" in args ? args.payload : {};
		const id = "id" in args && isString(args.id) ? args.id : createEventId();
		const ts = "ts" in args && isNumber(args.ts) ? args.ts : Date.now();
		const ephemeral = "ephemeral" in args && isBoolean(args.ephemeral) ? args.ephemeral : false;
		const parentActorId = "parentActorId" in args && isString(args.parentActorId) ? args.parentActorId : void 0;
		const seq = "seqNum" in raw && isNumber(raw.seqNum) ? raw.seqNum : 0;
		let origin;
		if ("clientId" in raw && isString(raw.clientId) && "sessionId" in raw && isString(raw.sessionId)) origin = {
			clientId: raw.clientId,
			sessionId: raw.sessionId
		};
		return fromWireEvent({
			id,
			actorId,
			type: raw.name,
			seq,
			ts,
			ephemeral,
			parentActorId,
			origin,
			payload
		});
	}
	if ("type" in raw && isString(raw.type)) {
		const payload = "payload" in raw ? raw.payload : {};
		const id = "id" in raw && isString(raw.id) ? raw.id : createEventId();
		const ts = "ts" in raw && isNumber(raw.ts) ? raw.ts : Date.now();
		const seq = "seq" in raw && isNumber(raw.seq) ? raw.seq : 0;
		const ephemeral = "ephemeral" in raw && isBoolean(raw.ephemeral) ? raw.ephemeral : false;
		const parentActorId = "parentActorId" in raw && isString(raw.parentActorId) ? raw.parentActorId : void 0;
		const itemActorId = "actorId" in raw && isString(raw.actorId) ? raw.actorId : actorId;
		let origin;
		if ("origin" in raw && isReadonlyObject(raw.origin) && "clientId" in raw.origin && isString(raw.origin.clientId) && "sessionId" in raw.origin && isString(raw.origin.sessionId)) origin = {
			clientId: raw.origin.clientId,
			sessionId: raw.origin.sessionId
		};
		return fromWireEvent({
			id,
			actorId: itemActorId,
			type: raw.type,
			seq,
			ts,
			ephemeral,
			parentActorId,
			origin,
			payload
		});
	}
	throw new Error("Unrecognized event format: must have \"name\" (LiveStore) or \"type\" (Twist)");
}
function decodeAppendableTwistEvent(raw, actorId) {
	try {
		const { seq: _, ...rest } = decodeTwistEvent(raw, actorId);
		return rest;
	} catch {
		return;
	}
}
function createChildId$1(parentId, name) {
	return `${parentId}__${name}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}
function findTool(tools, name) {
	return tools.find((t) => t.name === name);
}
/**
* Produce events for a single agent turn (agent.turn owed work).
*/
var executeAgentTurn = (definition, state) => gen(function* () {
	const turn = state.turn + 1;
	if (turn > state.maxTurns) return {
		events: [event("actor.failed", state.actorId, { error: `Max turns exceeded (${state.maxTurns})` })],
		spawns: []
	};
	const tools = definition.tools ?? [];
	const turnCtx = {
		actorId: state.actorId,
		turn,
		messages: state.messages,
		input: state.input,
		tools,
		instructions: definition.instructions
	};
	let result;
	if (definition.runTurn) result = yield* tryPromise({
		try: () => Promise.resolve(definition.runTurn(turnCtx)),
		catch: (cause) => cause instanceof Error ? cause : new Error(String(cause))
	});
	else result = yield* (yield* LlmTag).complete({
		model: definition.model,
		instructions: definition.instructions,
		messages: [{
			role: "system",
			content: definition.instructions
		}, ...state.messages],
		tools
	});
	const events = [event("agent.turn.started", state.actorId, { turn }), event("agent.message", state.actorId, {
		turn,
		message: result.message
	})];
	const toolCalls = result.toolCalls ?? result.message.toolCalls ?? [];
	for (const toolCall of toolCalls) events.push(event("agent.tool_call.requested", state.actorId, {
		turn,
		toolCall
	}));
	if (toolCalls.length === 0 && result.done) {
		const output = result.output ?? { text: result.message.content };
		events.push(event("actor.completed", state.actorId, { output }));
	}
	return {
		events,
		spawns: []
	};
});
/**
* Execute a pending tool call. Function tools run inline; agent/workflow tools emit child.spawned.
*/
var executeToolCall = (definition, state, turn, toolCall) => gen(function* () {
	const tool = findTool(definition.tools ?? [], toolCall.name);
	if (!tool) return {
		events: [event("tool.result", state.actorId, {
			turn,
			toolCallId: toolCall.id,
			name: toolCall.name,
			result: null,
			error: `Unknown tool: ${toolCall.name}`
		})],
		spawns: []
	};
	switch (tool.kind) {
		case "function": {
			const validatedArgs = yield* tryPromise({
				try: () => validateInput(tool.input, toolCall.arguments),
				catch: (cause) => cause instanceof Error ? cause : new Error(String(cause))
			}).pipe(map((value) => ({
				ok: true,
				value
			})), catch_((err) => succeed$1({
				ok: false,
				error: err.message
			})));
			if (!validatedArgs.ok) return {
				events: [event("tool.result", state.actorId, {
					turn,
					toolCallId: toolCall.id,
					name: toolCall.name,
					result: null,
					error: validatedArgs.error
				})],
				spawns: []
			};
			const result = yield* tryPromise({
				try: () => Promise.resolve(tool.handler(validatedArgs.value, {
					actorId: state.actorId,
					turn
				})),
				catch: (cause) => cause instanceof Error ? cause : new Error(String(cause))
			}).pipe(map((value) => ({
				ok: true,
				value
			})), catch_((err) => succeed$1({
				ok: false,
				error: err.message
			})));
			if (!result.ok) return {
				events: [event("tool.result", state.actorId, {
					turn,
					toolCallId: toolCall.id,
					name: toolCall.name,
					result: null,
					error: result.error
				})],
				spawns: []
			};
			return {
				events: [event("tool.result", state.actorId, {
					turn,
					toolCallId: toolCall.id,
					name: toolCall.name,
					result: result.value,
					error: null
				})],
				spawns: []
			};
		}
		case "agent-tool": {
			const input = tool.mapInput ? tool.mapInput(toolCall.arguments) : toolCall.arguments;
			const childActorId = createChildId$1(state.actorId, tool.agent.name);
			return {
				events: [event("child.spawned", state.actorId, {
					childActorId,
					childKind: "agent",
					childDefinitionName: tool.agent.name,
					toolCallId: toolCall.id,
					nodeId: null,
					input
				})],
				spawns: [{
					childActorId,
					kind: "agent",
					definitionName: tool.agent.name,
					definition: tool.agent,
					input,
					toolCallId: toolCall.id
				}]
			};
		}
		case "workflow-tool": {
			const input = tool.mapInput ? tool.mapInput(toolCall.arguments) : toolCall.arguments;
			const childActorId = createChildId$1(state.actorId, tool.workflow.name);
			return {
				events: [event("child.spawned", state.actorId, {
					childActorId,
					childKind: "workflow",
					childDefinitionName: tool.workflow.name,
					toolCallId: toolCall.id,
					nodeId: null,
					input
				})],
				spawns: [{
					childActorId,
					kind: "workflow",
					definitionName: tool.workflow.name,
					definition: tool.workflow,
					input,
					toolCallId: toolCall.id
				}]
			};
		}
		default: return tool;
	}
});
function createRegistry(definitions = []) {
	const agents = /* @__PURE__ */ new Map();
	const workflows = /* @__PURE__ */ new Map();
	for (const def of definitions) if (def.kind === "agent") agents.set(def.name, def);
	else workflows.set(def.name, def);
	return {
		agents,
		workflows
	};
}
/**
* From owed `workflow.schedule`, emit `workflow.run_node` starters for ready nodes
* up to remaining concurrency. If the DAG is finished, emit `actor.completed`.
*/
function scheduleWorkflow(definition, state) {
	const running = Object.values(state.nodes).filter((n) => n.status === "running").length;
	const waitingReview = Object.values(state.nodes).filter((n) => n.status === "waiting_review").length;
	const slots = Math.max(0, state.concurrency - running);
	const ready = readyNodes(definition, state.nodes).slice(0, slots);
	if (ready.length > 0) return ready.map((nodeId) => event("workflow.node.started", state.actorId, { nodeId }));
	if (Object.values(state.nodes).some((n) => n.status === "pending" || n.status === "running" || n.status === "waiting_review") || waitingReview > 0 || running > 0) return [];
	const failed = Object.entries(state.nodes).find(([, n]) => n.status === "failed");
	if (failed) return [event("actor.failed", state.actorId, { error: failed[1].error ?? `Node ${failed[0]} failed` })];
	const results = {};
	for (const [id, node] of Object.entries(state.nodes)) results[id] = node.result;
	const output = definition.output ? definition.output({
		input: state.input,
		results
	}) : results;
	return [event("actor.completed", state.actorId, { output })];
}
function createChildId(parentId, name) {
	return `${parentId}__${name}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}
function createReviewId() {
	return `rev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
function createTimerId() {
	return `tmr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
var NodeResultTypeSchema = Literals([
	"value",
	"review",
	"wait",
	"spawn_agent",
	"spawn_workflow"
]);
function isNodeResult(raw) {
	if (!isReadonlyObject(raw) || !("type" in raw)) return false;
	return is(NodeResultTypeSchema)(raw.type);
}
function normalizeResult(raw) {
	if (isNodeResult(raw)) return raw;
	return {
		type: "value",
		value: raw
	};
}
/**
* Execute a workflow node that is owed as `workflow.run_node`.
* Caller should already have appended `workflow.node.started` (via schedule) or we emit it here if missing.
*/
var executeWorkflowNode = (definition, state, nodeId) => gen(function* () {
	const nodeDef = definition.nodes.find((n) => n.id === nodeId);
	if (!nodeDef) return {
		events: [event("workflow.node.finished", state.actorId, {
			nodeId,
			result: null,
			error: `Unknown node: ${nodeId}`
		})],
		spawns: []
	};
	const results = {};
	for (const [id, node] of Object.entries(state.nodes)) results[id] = node.result;
	const ctx = {
		actorId: state.actorId,
		nodeId,
		input: state.input,
		results,
		requestReview: (request) => ({
			type: "review",
			review: request
		}),
		spawnAgent: (agent, input) => ({
			type: "spawn_agent",
			agent,
			input
		}),
		spawnWorkflow: (workflow, input) => ({
			type: "spawn_workflow",
			workflow,
			input
		})
	};
	const raw = yield* tryPromise({
		try: () => Promise.resolve(nodeDef.run(ctx)),
		catch: (cause) => cause instanceof Error ? cause : new Error(String(cause))
	}).pipe(map((value) => ({
		ok: true,
		value
	})), catch_((err) => succeed$1({
		ok: false,
		error: err.message
	})));
	if (!raw.ok) return {
		events: [event("workflow.node.finished", state.actorId, {
			nodeId,
			result: null,
			error: raw.error
		})],
		spawns: []
	};
	const result = normalizeResult(raw.value);
	switch (result.type) {
		case "value": return {
			events: [event("workflow.node.finished", state.actorId, {
				nodeId,
				result: result.value,
				error: null
			})],
			spawns: []
		};
		case "review": {
			const reviewId = createReviewId();
			const actions = result.review.actions ?? [{
				id: "approve",
				label: "Approve",
				outcome: "approve"
			}, {
				id: "reject",
				label: "Reject",
				outcome: "reject"
			}];
			return {
				events: [event("review.requested", state.actorId, {
					reviewId,
					title: result.review.title,
					description: result.review.description,
					schema: result.review.schema,
					actions,
					nodeId
				})],
				spawns: []
			};
		}
		case "wait": {
			const timerId = createTimerId();
			const wakeAt = Date.now() + result.ms;
			return {
				events: [event("timer.set", state.actorId, {
					timerId,
					wakeAt,
					nodeId
				})],
				spawns: []
			};
		}
		case "spawn_agent": {
			const childActorId = createChildId(state.actorId, result.agent.name);
			return {
				events: [event("child.spawned", state.actorId, {
					childActorId,
					childKind: "agent",
					childDefinitionName: result.agent.name,
					toolCallId: null,
					nodeId,
					input: result.input
				})],
				spawns: [{
					childActorId,
					kind: "agent",
					definitionName: result.agent.name,
					definition: result.agent,
					input: result.input,
					nodeId
				}]
			};
		}
		case "spawn_workflow": {
			const childActorId = createChildId(state.actorId, result.workflow.name);
			return {
				events: [event("child.spawned", state.actorId, {
					childActorId,
					childKind: "workflow",
					childDefinitionName: result.workflow.name,
					toolCallId: null,
					nodeId,
					input: result.input
				})],
				spawns: [{
					childActorId,
					kind: "workflow",
					definitionName: result.workflow.name,
					definition: result.workflow,
					input: result.input,
					nodeId
				}]
			};
		}
		default: return result;
	}
});
var OptionalStringField = Struct({
	timerId: optional(String$1),
	nodeId: optional(String$1),
	parentActorId: optional(NullOr(String$1)),
	childActorId: optional(String$1),
	toolCallId: optional(NullOr(String$1)),
	childDefinitionName: optional(String$1)
});
function readPayloadFields(payload) {
	const decoded = decodeUnknownExit(OptionalStringField)(payload);
	if (decoded._tag === "Success") return decoded.value;
	return {};
}
function createActorId(kind) {
	return `${kind === "agent" ? "agt" : "wf"}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
function stripSeq(events) {
	return events.map(({ seq: _seq, ...rest }) => rest);
}
function createTwistRuntime(registry) {
	const waking = /* @__PURE__ */ new Set();
	const spawnMeta = /* @__PURE__ */ new Map();
	const runtime = {
		registry,
		getState: (actorId) => gen(function* () {
			return reduceActor(yield* (yield* EventStoreTag).read(actorId), { actorId });
		}),
		getEvents: (actorId, options) => gen(function* () {
			return yield* (yield* EventStoreTag).read(actorId, options);
		}),
		startAgent: (definitionName, input = null, options) => gen(function* () {
			const def = registry.agents.get(definitionName);
			if (!def) return yield* fail(/* @__PURE__ */ new Error(`Unknown agent: ${definitionName}`));
			const validatedInput = yield* tryPromise({
				try: () => validateDefinitionInput(def, input),
				catch: (err) => err instanceof Error ? err : new Error(String(err))
			});
			const actorId = options?.actorId ?? createActorId("agent");
			const store = yield* EventStoreTag;
			const batch = [event("actor.started", actorId, {
				kind: "agent",
				definitionName,
				input: validatedInput,
				parentActorId: options?.parentActorId ?? null,
				maxTurns: def.maxTurns ?? 20
			})];
			if (validatedInput !== null && validatedInput !== void 0) {
				const content = isString(validatedInput) ? validatedInput : JSON.stringify(validatedInput);
				batch.push(event("agent.message.received", actorId, { message: {
					role: "user",
					content
				} }));
			}
			yield* store.append(actorId, stripSeq(batch));
			return {
				actorId,
				state: yield* runtime.wake(actorId)
			};
		}),
		startWorkflow: (definitionName, input = null, options) => gen(function* () {
			const def = registry.workflows.get(definitionName);
			if (!def) return yield* fail(/* @__PURE__ */ new Error(`Unknown workflow: ${definitionName}`));
			const validatedInput = yield* tryPromise({
				try: () => validateDefinitionInput(def, input),
				catch: (err) => err instanceof Error ? err : new Error(String(err))
			});
			const actorId = options?.actorId ?? createActorId("workflow");
			yield* (yield* EventStoreTag).append(actorId, stripSeq([event("actor.started", actorId, {
				kind: "workflow",
				definitionName,
				input: validatedInput,
				parentActorId: options?.parentActorId ?? null,
				concurrency: def.concurrency ?? 8,
				nodeIds: def.nodes.map((n) => n.id)
			})]));
			return {
				actorId,
				state: yield* runtime.wake(actorId)
			};
		}),
		signal: (actorId, events) => gen(function* () {
			const store = yield* EventStoreTag;
			const batch = events.map((e) => eventFromSignal(e, actorId));
			yield* store.append(actorId, stripSeq(batch));
			return yield* runtime.wake(actorId);
		}),
		decideReview: (actorId, reviewId, decision) => {
			const payload = {
				reviewId,
				actionId: decision.actionId,
				outcome: decision.outcome
			};
			const withOptional = decision.payload === void 0 ? payload : {
				...payload,
				payload: decision.payload
			};
			return runtime.signal(actorId, [{
				type: "review.decided",
				payload: withOptional
			}]);
		},
		steer: (actorId, message, options) => gen(function* () {
			const state = yield* runtime.getState(actorId);
			const msg = isString(message) ? {
				role: "user",
				content: message
			} : message;
			return yield* runtime.signal(actorId, [{
				type: "agent.turn.steered",
				payload: {
					turn: options?.turn ?? (state.kind === "agent" ? state.turn : 0),
					message: msg,
					interrupt: options?.interrupt ?? true
				}
			}]);
		}),
		wake: (actorId) => gen(function* () {
			if (waking.has(actorId)) return yield* runtime.getState(actorId);
			waking.add(actorId);
			try {
				const store = yield* EventStoreTag;
				let events = yield* store.read(actorId);
				let state = reduceActor(events, { actorId });
				let guard = 0;
				while (!isTerminal(state) && !isParked(state) && guard < 100) {
					guard += 1;
					const dueTimer = state.owed.find((w) => w.type === "timer.wait" && w.wakeAt <= Date.now());
					if (dueTimer) {
						const timerEvt = events.find((e) => {
							if (e.type !== "timer.set") return false;
							return readPayloadFields(e.payload).timerId === dueTimer.timerId;
						});
						const nodeId = timerEvt ? readPayloadFields(timerEvt.payload).nodeId : void 0;
						const batch = [event("timer.fired", actorId, { timerId: dueTimer.timerId })];
						if (nodeId && state.kind === "workflow") {
							const node = state.nodes[nodeId];
							if (node?.status === "running" || node?.status === "waiting_review") batch.push(event("workflow.node.finished", actorId, {
								nodeId,
								result: { waited: true },
								error: null
							}));
						}
						yield* store.append(actorId, stripSeq(batch));
						events = yield* store.read(actorId);
						state = reduceActor(events, { actorId });
						continue;
					}
					const definition = state.kind === "agent" ? registry.agents.get(state.definitionName) : registry.workflows.get(state.definitionName);
					if (!definition) {
						yield* store.append(actorId, stripSeq([event("actor.failed", actorId, { error: `Unknown definition: ${state.definitionName}` })]));
						events = yield* store.read(actorId);
						state = reduceActor(events, { actorId });
						break;
					}
					const actionable = state.owed.find((w) => w.type !== "review.wait" && w.type !== "child.wait" && w.type !== "timer.wait");
					if (!actionable) break;
					const { events: produced, spawns } = yield* runOwed(registry, definition, state, actionable);
					if (produced.length === 0) break;
					yield* store.append(actorId, produced);
					for (const spawn of spawns) {
						spawnMeta.set(spawn.childActorId, {
							parentActorId: spawn.parentActorId,
							toolCallId: spawn.toolCallId,
							nodeId: spawn.nodeId
						});
						if (spawn.definition?.kind === "agent") registry.agents.set(spawn.definition.name, spawn.definition);
						else if (spawn.definition?.kind === "workflow") registry.workflows.set(spawn.definition.name, spawn.definition);
						if (spawn.kind === "agent") yield* runtime.startAgent(spawn.definitionName, spawn.input, {
							actorId: spawn.childActorId,
							parentActorId: spawn.parentActorId
						});
						else yield* runtime.startWorkflow(spawn.definitionName, spawn.input, {
							actorId: spawn.childActorId,
							parentActorId: spawn.parentActorId
						});
					}
					events = yield* store.read(actorId);
					state = reduceActor(events, { actorId });
				}
				if (isTerminal(state) && state.parentActorId) yield* notifyParent(runtime, spawnMeta, actorId, state.output, state.error);
				events = yield* store.read(actorId);
				if (shouldTakeSnapshot(events, 200)) {
					const snap = buildSnapshotEvent(actorId, events, { includeState: true });
					yield* store.append(actorId, stripSeq([snap]));
					events = yield* store.read(actorId);
					state = reduceActor(events, { actorId });
				}
				return state;
			} finally {
				waking.delete(actorId);
			}
		})
	};
	return runtime;
}
function notifyParent(runtime, spawnMeta, childActorId, result, error) {
	return gen(function* () {
		const meta = spawnMeta.get(childActorId);
		const store = yield* EventStoreTag;
		const started = (yield* store.read(childActorId)).find((e) => e.type === "actor.started");
		const parentActorId = meta?.parentActorId ?? (started ? readPayloadFields(started.payload).parentActorId : void 0) ?? null;
		if (!parentActorId) return;
		const spawnEvt = (yield* store.read(parentActorId)).find((e) => {
			if (e.type !== "child.spawned") return false;
			return readPayloadFields(e.payload).childActorId === childActorId;
		});
		const spawnPayload = spawnEvt ? readPayloadFields(spawnEvt.payload) : void 0;
		const nodeId = meta?.nodeId ?? spawnPayload?.nodeId ?? null;
		const toolCallId = meta?.toolCallId ?? spawnPayload?.toolCallId ?? null;
		const batch = [];
		if (toolCallId) batch.push(event("tool.result", parentActorId, {
			turn: null,
			toolCallId,
			name: spawnPayload?.childDefinitionName ?? "child",
			result,
			error
		}));
		batch.push(event("child.completed", parentActorId, {
			childActorId,
			result,
			error
		}));
		if (nodeId) batch.push(event("workflow.node.finished", parentActorId, {
			nodeId,
			result,
			error
		}));
		yield* store.append(parentActorId, stripSeq(batch));
		spawnMeta.delete(childActorId);
		yield* runtime.wake(parentActorId);
	});
}
function runOwed(registry, definition, state, work) {
	return gen(function* () {
		switch (work.type) {
			case "agent.turn": {
				if (state.kind !== "agent" || definition.kind !== "agent") return {
					events: [],
					spawns: []
				};
				const result = yield* executeAgentTurn(definition, state);
				return {
					events: stripSeq(result.events),
					spawns: result.spawns.map((s) => ({
						...s,
						parentActorId: state.actorId,
						nodeId: null
					}))
				};
			}
			case "tool.execute": {
				if (state.kind !== "agent" || definition.kind !== "agent") return {
					events: [],
					spawns: []
				};
				const result = yield* executeToolCall(definition, state, work.turn, work.toolCall);
				return {
					events: stripSeq(result.events),
					spawns: result.spawns.map((s) => ({
						...s,
						parentActorId: state.actorId,
						nodeId: null
					}))
				};
			}
			case "workflow.schedule": {
				if (state.kind !== "workflow" || definition.kind !== "workflow") return {
					events: [],
					spawns: []
				};
				const scheduled = scheduleWorkflow(definition, state);
				const nodeStarts = scheduled.filter((e) => e.type === "workflow.node.started");
				const events = [...scheduled];
				const spawns = [];
				for (const start of nodeStarts) {
					const nodeId = start.payload.nodeId;
					if (!nodeId) continue;
					const executed = yield* executeWorkflowNode(definition, {
						...state,
						nodes: {
							...state.nodes,
							[nodeId]: {
								status: "running",
								result: null,
								error: null
							}
						}
					}, nodeId);
					events.push(...executed.events);
					for (const s of executed.spawns) {
						spawns.push({
							childActorId: s.childActorId,
							kind: s.kind,
							definitionName: s.definitionName,
							definition: s.definition,
							input: s.input,
							parentActorId: state.actorId,
							toolCallId: null,
							nodeId: s.nodeId
						});
						if (s.definition?.kind === "agent") registry.agents.set(s.definition.name, s.definition);
						else if (s.definition?.kind === "workflow") registry.workflows.set(s.definition.name, s.definition);
					}
				}
				return {
					events: stripSeq(events),
					spawns
				};
			}
			case "workflow.run_node": {
				if (state.kind !== "workflow" || definition.kind !== "workflow") return {
					events: [],
					spawns: []
				};
				const started = event("workflow.node.started", state.actorId, { nodeId: work.nodeId });
				const executed = yield* executeWorkflowNode(definition, {
					...state,
					nodes: {
						...state.nodes,
						[work.nodeId]: {
							status: "running",
							result: null,
							error: null
						}
					}
				}, work.nodeId);
				return {
					events: stripSeq([started, ...executed.events]),
					spawns: executed.spawns.map((s) => ({
						childActorId: s.childActorId,
						kind: s.kind,
						definitionName: s.definitionName,
						definition: s.definition,
						input: s.input,
						parentActorId: state.actorId,
						toolCallId: null,
						nodeId: s.nodeId
					}))
				};
			}
			case "finalize":
				if (state.status === "failed" || state.error) return {
					events: stripSeq([event("actor.failed", state.actorId, { error: state.error ?? "Actor failed" })]),
					spawns: []
				};
				return {
					events: stripSeq([event("actor.completed", state.actorId, { output: state.output ?? null })]),
					spawns: []
				};
			case "review.wait":
			case "child.wait":
			case "timer.wait": return {
				events: [],
				spawns: []
			};
			default: return work;
		}
	});
}
/**
* LiveStore sync proxy over the Twist EventStore.
*
* Exposes the standard LiveStore protocol contract:
* - HEAD  — reachability ping (200)
* - GET   — pull events for `storeId` from `cursor` (JSON batch or live SSE)
* - POST  — push batch with `parentSeqNum` conflict detection (409 ServerAheadError) + actor wake
*/
async function handleLivestoreProxy(req, runtime, store, options) {
	const url = new URL(req.url);
	if (req.method === "HEAD") return new Response(null, { status: 200 });
	if (req.method === "GET") {
		const storeId = url.searchParams.get("storeId") ?? url.searchParams.get("actorId");
		if (!storeId) return Response.json({ error: "storeId required" }, { status: 400 });
		const cursor = Number(url.searchParams.get("cursor") ?? "0");
		const acceptHeader = req.headers.get("accept") ?? "";
		if (!(url.searchParams.get("live") === "true" || url.searchParams.get("live") === "1" || acceptHeader.includes("text/event-stream"))) {
			const events = await runPromise(store.read(storeId, { fromSeq: cursor + 1 }));
			const head = await runPromise(store.tail(storeId));
			const batch = events.map(encodeTwistEvent);
			return Response.json({
				batch,
				head
			});
		}
		const encoder = new TextEncoder();
		let cleanup = () => {};
		const stream = new ReadableStream({
			async start(controller) {
				let active = true;
				cleanup = () => {
					active = false;
				};
				req.signal.addEventListener("abort", () => {
					active = false;
					try {
						controller.close();
					} catch {}
				});
				try {
					const backlog = await runPromise(store.read(storeId, { fromSeq: cursor + 1 }));
					const currentHead = await runPromise(store.tail(storeId));
					if (backlog.length > 0 && active) {
						const data = JSON.stringify({
							batch: backlog.map(encodeTwistEvent),
							head: currentHead
						});
						controller.enqueue(encoder.encode(`event: batch\ndata: ${data}\n\n`));
					}
				} catch {}
				const subFiber = runFork(store.subscribe(storeId, { fromSeq: cursor + 1 }).pipe(runForEach((event) => sync(() => {
					if (!active) return;
					const data = JSON.stringify({
						batch: [encodeTwistEvent(event)],
						head: event.seq
					});
					controller.enqueue(encoder.encode(`event: batch\ndata: ${data}\n\n`));
				}))));
				cleanup = () => {
					active = false;
					runPromise(interrupt(subFiber));
				};
			},
			cancel() {
				cleanup();
			}
		});
		return new Response(stream, { headers: {
			"content-type": "text/event-stream",
			"cache-control": "no-cache",
			connection: "keep-alive"
		} });
	}
	if (req.method === "POST") try {
		const rawBody = await req.json();
		if (!isReadonlyObject(rawBody)) return Response.json({ error: "invalid payload" }, { status: 400 });
		const rawStoreId = "storeId" in rawBody ? rawBody.storeId : "actorId" in rawBody ? rawBody.actorId : void 0;
		if (!isString(rawStoreId)) return Response.json({ error: "storeId required" }, { status: 400 });
		const storeId = rawStoreId;
		const rawBatch = "batch" in rawBody && Array.isArray(rawBody.batch) ? rawBody.batch : [];
		if (rawBatch.length === 0) {
			const head = await runPromise(store.tail(storeId));
			return Response.json({
				ok: true,
				head
			});
		}
		const firstItem = rawBatch[0];
		const expectedTail = isReadonlyObject(firstItem) && "parentSeqNum" in firstItem && isNumber(firstItem.parentSeqNum) ? firstItem.parentSeqNum : void 0;
		const events = [];
		for (const item of rawBatch) {
			const decoded = decodeAppendableTwistEvent(item, storeId);
			if (decoded) events.push(decoded);
		}
		if (events.length === 0) {
			const head = await runPromise(store.tail(storeId));
			return Response.json({
				ok: true,
				head
			});
		}
		const appendEffect = store.append(storeId, events, { expectedTail });
		const appendResult = await runPromise(appendEffect.pipe(map((res) => ({
			ok: true,
			res
		})), catch_((err) => succeed$1({
			ok: false,
			err
		}))));
		if (!appendResult.ok) {
			const err = appendResult.err;
			if (err instanceof EventStoreConflictError || isReadonlyObject(err) && "_tag" in err && err._tag === "EventStoreConflictError") {
				const actualTail = "actualTail" in err && isNumber(err.actualTail) ? err.actualTail : await runPromise(store.tail(storeId));
				return Response.json({
					error: "ServerAheadError",
					head: actualTail,
					minimumExpectedNum: actualTail + 1
				}, { status: 409 });
			}
			return Response.json({ error: err.message }, { status: 500 });
		}
		const wakeEffect = runtime.wake(storeId).pipe(provideService(EventStoreTag, store));
		await runPromise(options.provide(wakeEffect).pipe(catch_(() => void_)));
		return Response.json({
			ok: true,
			head: appendResult.res.tail
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return Response.json({ error: message }, { status: 500 });
	}
	return new Response("Method Not Allowed", { status: 405 });
}
var MessageSchema = Struct({
	role: Literals([
		"system",
		"user",
		"assistant",
		"tool"
	]),
	content: String$1,
	toolCallId: optional(String$1),
	name: optional(String$1)
});
var StartActorBodySchema = Struct({
	definitionName: optional(String$1),
	name: optional(String$1),
	input: optional(JsonValueSchema),
	actorId: optional(String$1)
});
var SignalEventSchema = Struct({
	type: EventTypeSchema,
	payload: JsonValueSchema,
	id: optional(String$1),
	ts: optional(Number$1),
	ephemeral: optional(Boolean$1),
	parentActorId: optional(NullOr(String$1))
});
var SignalBodySchema = Struct({
	events: optional(ArraySchema(SignalEventSchema)),
	message: optional(Union([String$1, MessageSchema]))
});
var ReviewDecideBodySchema = Struct({
	actionId: optional(String$1),
	outcome: optional(Literals(["approve", "reject"])),
	payload: optional(JsonValueSchema)
});
var SteerBodySchema = Struct({
	message: optional(Union([String$1, MessageSchema])),
	interrupt: optional(Boolean$1),
	turn: optional(Number$1)
});
function run(effect, store, provide) {
	const withStore = provideService(effect, EventStoreTag, store);
	return runPromise(provide(withStore));
}
async function readJson(req) {
	try {
		const value = await req.json();
		return decodeUnknownSync(JsonValueSchema)(value);
	} catch {
		return {};
	}
}
function parseMessage$1(value) {
	if (isString(value)) return {
		role: "user",
		content: value
	};
	return value;
}
/** True for Twist HTTP routes that hosts should claim before UI fallthrough. */
function isTwistApiPath(path) {
	return path === "/health" || path.startsWith("/api/livestore") || path.startsWith("/actors/");
}
/**
* Build a Fetch handler for Twist HTTP routes.
* Returns `null` when the path is not a Twist API route so a
* parent server (e.g. TanStack Start, Nitro) can fall through.
*/
function createFetchHandler(options) {
	const { runtime, store, provide } = options;
	return async (req) => {
		const url = new URL(req.url);
		const path = url.pathname;
		if (!isTwistApiPath(path)) return null;
		if (path === "/health") return Response.json({ ok: true });
		if (path.startsWith("/api/livestore")) return handleLivestoreProxy(req, runtime, store, { provide });
		try {
			if (req.method === "POST" && path === "/actors/agent") {
				const body = decodeUnknownSync(StartActorBodySchema)(await readJson(req));
				const definitionName = body.definitionName ?? body.name;
				if (!definitionName) return Response.json({ error: "definitionName required" }, { status: 400 });
				if (!runtime.registry.agents.has(definitionName)) return Response.json({ error: `Unknown agent: ${definitionName}` }, { status: 404 });
				try {
					const result = await run(runtime.startAgent(definitionName, body.input ?? null, { actorId: body.actorId }), store, provide);
					return Response.json(result);
				} catch (err) {
					if (err instanceof InvalidInputError) return Response.json({
						error: err.message,
						issues: err.issues
					}, { status: 400 });
					throw err;
				}
			}
			if (req.method === "POST" && path === "/actors/workflow") {
				const body = decodeUnknownSync(StartActorBodySchema)(await readJson(req));
				const definitionName = body.definitionName ?? body.name;
				if (!definitionName) return Response.json({ error: "definitionName required" }, { status: 400 });
				if (!runtime.registry.workflows.has(definitionName)) return Response.json({ error: `Unknown workflow: ${definitionName}` }, { status: 404 });
				try {
					const result = await run(runtime.startWorkflow(definitionName, body.input ?? null, { actorId: body.actorId }), store, provide);
					return Response.json(result);
				} catch (err) {
					if (err instanceof InvalidInputError) return Response.json({
						error: err.message,
						issues: err.issues
					}, { status: 400 });
					throw err;
				}
			}
			const signalMatch = path.match(/^\/actors\/([^/]+)\/signal$/);
			if (req.method === "POST" && signalMatch) {
				const actorId = decodeURIComponent(signalMatch[1]);
				const body = decodeUnknownSync(SignalBodySchema)(await readJson(req));
				if (body.message !== void 0) {
					const message = parseMessage$1(body.message);
					const state = await run(runtime.signal(actorId, [{
						type: "agent.message.received",
						payload: { message }
					}]), store, provide);
					return Response.json({
						actorId,
						state
					});
				}
				const signals = (body.events ?? []).map((e) => {
					const typed = fromWireEvent({
						id: e.id ?? `sig_${Date.now().toString(36)}`,
						actorId,
						type: e.type,
						seq: 0,
						ts: e.ts ?? Date.now(),
						payload: e.payload,
						ephemeral: e.ephemeral,
						parentActorId: e.parentActorId
					});
					return {
						type: typed.type,
						payload: typed.payload,
						id: typed.id,
						ts: typed.ts,
						ephemeral: typed.ephemeral,
						parentActorId: typed.parentActorId
					};
				});
				const state = await run(runtime.signal(actorId, signals), store, provide);
				return Response.json({
					actorId,
					state
				});
			}
			const reviewMatch = path.match(/^\/actors\/([^/]+)\/reviews\/([^/]+)\/decide$/);
			if (req.method === "POST" && reviewMatch) {
				const actorId = decodeURIComponent(reviewMatch[1]);
				const reviewId = decodeURIComponent(reviewMatch[2]);
				const body = decodeUnknownSync(ReviewDecideBodySchema)(await readJson(req));
				if (!body.actionId || !body.outcome) return Response.json({ error: "actionId and outcome required" }, { status: 400 });
				const state = await run(runtime.decideReview(actorId, reviewId, {
					actionId: body.actionId,
					outcome: body.outcome,
					payload: body.payload
				}), store, provide);
				return Response.json({
					actorId,
					state
				});
			}
			const eventsMatch = path.match(/^\/actors\/([^/]+)\/events$/);
			if (req.method === "GET" && eventsMatch) {
				const actorId = decodeURIComponent(eventsMatch[1]);
				const fromSeq = url.searchParams.get("fromSeq") ? Number(url.searchParams.get("fromSeq")) : void 0;
				const limit = url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : void 0;
				const events = await run(runtime.getEvents(actorId, {
					fromSeq,
					limit
				}), store, provide);
				return Response.json({
					actorId,
					events
				});
			}
			const stateMatch = path.match(/^\/actors\/([^/]+)\/state$/);
			if (req.method === "GET" && stateMatch) {
				const actorId = decodeURIComponent(stateMatch[1]);
				const state = await run(runtime.getState(actorId), store, provide);
				return Response.json({
					actorId,
					state
				});
			}
			const wakeMatch = path.match(/^\/actors\/([^/]+)\/wake$/);
			if (req.method === "POST" && wakeMatch) {
				const actorId = decodeURIComponent(wakeMatch[1]);
				const state = await run(runtime.wake(actorId), store, provide);
				return Response.json({
					actorId,
					state
				});
			}
			const steerMatch = path.match(/^\/actors\/([^/]+)\/steer$/);
			if (req.method === "POST" && steerMatch) {
				const actorId = decodeURIComponent(steerMatch[1]);
				const body = decodeUnknownSync(SteerBodySchema)(await readJson(req));
				if (body.message === void 0) return Response.json({ error: "message required" }, { status: 400 });
				const state = await run(runtime.steer(actorId, body.message, {
					interrupt: body.interrupt,
					turn: body.turn
				}), store, provide);
				return Response.json({
					actorId,
					state
				});
			}
			return new Response("Not Found", { status: 404 });
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			return Response.json({ error: message }, { status: 500 });
		}
	};
}
function serveHttp(fetchHandler, options) {
	const port = options?.port ?? Number(process.env.PORT ?? 8787);
	const hostname = options?.hostname ?? "0.0.0.0";
	const server = Bun.serve({
		port,
		hostname,
		async fetch(req) {
			const result = await fetchHandler(req);
			if (result === null) return new Response("Not Found", { status: 404 });
			return result;
		}
	});
	return {
		port: server.port ?? port,
		stop: () => server.stop(true)
	};
}
function createTwist(options = {}) {
	const definitions = options.definitions ? [...options.definitions] : [];
	let initPromise;
	let runningServer;
	const getInit = () => {
		if (!initPromise) initPromise = (async () => {
			let store;
			if (!options.store) store = await runPromise(makeMemoryEventStore);
			else if (isFunction(options.store)) store = await options.store();
			else store = await options.store;
			let llmLayer;
			if (options.llmService) llmLayer = succeed(LlmTag, options.llmService);
			else if (options.llm) {
				if (isReadonlyObject(options.llm) && "_tag" in options.llm) llmLayer = succeed(LlmTag, options.llm);
				else llmLayer = succeed(LlmTag, llmFromAdapter(options.llm));
			} else llmLayer = StubLlmLive(options.llmPolicy);
			const runtime = createTwistRuntime(createRegistry(definitions));
			const provide$1 = (effect) => provide(effect, llmLayer);
			const fetchHandler = createFetchHandler({
				runtime,
				store,
				provide: provide$1
			});
			return {
				runtime,
				store,
				provide: provide$1,
				fetchHandler
			};
		})();
		return initPromise;
	};
	const runEffect = async (fn) => {
		const init = await getInit();
		const withStore = provideService(fn(init), EventStoreTag, init.store);
		return runPromise(init.provide(withStore));
	};
	const twist = {
		definitions,
		ready: async () => {
			const init = await getInit();
			return {
				store: init.store,
				runtime: init.runtime
			};
		},
		get runtime() {
			return getInit().then((i) => i.runtime);
		},
		get store() {
			return getInit().then((i) => i.store);
		},
		startAgent: async (defOrName, input, opts) => {
			const init = await getInit();
			const defName = isString(defOrName) ? defOrName : defOrName.name;
			if (!init.runtime.registry.agents.has(defName)) throw new Error(`Unknown agent: "${defName}". Registered agents: ${[...init.runtime.registry.agents.keys()].join(", ")}`);
			const result = await runEffect((i) => i.runtime.startAgent(defName, input ?? null, opts));
			return {
				actorId: result.actorId,
				state: result.state,
				output: result.state.output
			};
		},
		startWorkflow: async (defOrName, input, opts) => {
			const init = await getInit();
			const defName = isString(defOrName) ? defOrName : defOrName.name;
			if (!init.runtime.registry.workflows.has(defName)) throw new Error(`Unknown workflow: "${defName}". Registered workflows: ${[...init.runtime.registry.workflows.keys()].join(", ")}`);
			const result = await runEffect((i) => i.runtime.startWorkflow(defName, input ?? null, opts));
			return {
				actorId: result.actorId,
				state: result.state,
				output: result.state.output
			};
		},
		getState: (actorId) => runEffect((i) => i.runtime.getState(actorId)),
		getEvents: (actorId, opts) => runEffect((i) => i.runtime.getEvents(actorId, opts)),
		sendMessage: (actorId, message) => {
			const msg = isString(message) ? {
				role: "user",
				content: message
			} : message;
			return runEffect((i) => i.runtime.signal(actorId, [{
				type: "agent.message.received",
				payload: { message: msg }
			}]));
		},
		decideReview: (actorId, reviewId, decision) => runEffect((i) => i.runtime.decideReview(actorId, reviewId, decision)),
		steer: (actorId, message, opts) => runEffect((i) => i.runtime.steer(actorId, message, opts)),
		signal: (actorId, events) => runEffect((i) => i.runtime.signal(actorId, events)),
		wake: (actorId) => runEffect((i) => i.runtime.wake(actorId)),
		fetch: async (req) => {
			if (!isTwistApiPath(new URL(req.url).pathname)) return null;
			const { fetchHandler } = await getInit();
			return fetchHandler(req);
		},
		serve: (serveOpts) => {
			if (runningServer) return runningServer;
			runningServer = serveHttp((req) => twist.fetch(req), serveOpts);
			return runningServer;
		},
		stop: async () => {
			if (runningServer) {
				runningServer.stop();
				runningServer = void 0;
			}
		}
	};
	if (options.serve) {
		const serveOpts = options.serve === true ? {} : options.serve;
		twist.serve(serveOpts);
	}
	return twist;
}
/**
* Configuration for the S2-backed EventStore.
*
* `endpoint` is optional and typically used for local s2-lite:
*   `{ account: "http://localhost:8080", basin: "http://localhost:8080" }`
*/
var S2ConfigSchema = Struct({
	basin: String$1,
	accessToken: String$1,
	endpoint: optional(Union([String$1, Struct({
		account: optional(String$1),
		basin: optional(String$1)
	})]))
});
function streamNameForActor(actorId) {
	return `actors/${actorId}`;
}
function s2ConfigFromEnv(env = process.env) {
	const basin = env.TWIST_S2_BASIN ?? env.S2_BASIN ?? "twist-demo";
	const accessToken = env.TWIST_S2_ACCESS_TOKEN ?? env.TWIST_S2_AUTH_TOKEN ?? env.S2_ACCESS_TOKEN ?? env.S2_AUTH_TOKEN ?? "s2_local";
	const endpoint = env.TWIST_S2_ENDPOINT ?? env.S2_ENDPOINT ?? (env.TWIST_S2_PORT ?? env.S2_PORT ?? env.S2_LITE_PORT ? `http://127.0.0.1:${env.TWIST_S2_PORT ?? env.S2_PORT ?? env.S2_LITE_PORT}` : void 0);
	const config = {
		basin,
		accessToken
	};
	if (endpoint !== void 0) return {
		basin,
		accessToken,
		endpoint
	};
	return config;
}
var jsonBodySerializer = { bodySerializer: (body) => JSON.stringify(body, (_key, value) => typeof value === "bigint" ? value.toString() : value) };
var createSseClient = ({ onRequest, onSseError, onSseEvent, responseTransformer, responseValidator, sseDefaultRetryDelay, sseMaxRetryAttempts, sseMaxRetryDelay, sseSleepFn, url, ...options }) => {
	let lastEventId;
	const sleep = sseSleepFn ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
	const createStream = async function* () {
		let retryDelay = sseDefaultRetryDelay ?? 3e3;
		let attempt = 0;
		const signal = options.signal ?? new AbortController().signal;
		while (true) {
			if (signal.aborted) break;
			attempt++;
			const headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers);
			if (lastEventId !== void 0) headers.set("Last-Event-ID", lastEventId);
			try {
				const requestInit = {
					redirect: options.redirect ?? "follow",
					cache: options.cache,
					credentials: options.credentials,
					integrity: options.integrity,
					keepalive: options.keepalive,
					method: options.method,
					mode: options.mode,
					priority: options.priority,
					referrer: options.referrer,
					referrerPolicy: options.referrerPolicy,
					body: options.serializedBody,
					headers,
					signal
				};
				let request = new Request(url, requestInit);
				if (onRequest) request = await onRequest(url, requestInit);
				const response = await (options.fetch ?? globalThis.fetch)(request);
				if (!response.ok) throw new Error(`SSE failed: ${response.status} ${response.statusText}`);
				if (!response.body) throw new Error("No body in SSE response");
				const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
				let buffer = "";
				const abortHandler = () => {
					try {
						reader.cancel();
					} catch {}
				};
				signal.addEventListener("abort", abortHandler);
				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						buffer += value;
						const chunks = buffer.split("\n\n");
						buffer = chunks.pop() ?? "";
						for (const chunk of chunks) {
							const lines = chunk.split("\n");
							const dataLines = [];
							let eventName;
							for (const line of lines) if (line.startsWith("data:")) dataLines.push(line.replace(/^data:\s*/, ""));
							else if (line.startsWith("event:")) eventName = line.replace(/^event:\s*/, "");
							else if (line.startsWith("id:")) lastEventId = line.replace(/^id:\s*/, "");
							else if (line.startsWith("retry:")) {
								const parsed = Number.parseInt(line.replace(/^retry:\s*/, ""), 10);
								if (!Number.isNaN(parsed)) retryDelay = parsed;
							}
							let data;
							let parsedJson = false;
							if (dataLines.length) {
								const rawData = dataLines.join("\n");
								try {
									data = JSON.parse(rawData);
									parsedJson = true;
								} catch {
									data = rawData;
								}
							}
							if (parsedJson) {
								if (responseValidator) await responseValidator(data);
								if (responseTransformer) data = await responseTransformer(data);
							}
							onSseEvent?.({
								data,
								event: eventName,
								id: lastEventId,
								retry: retryDelay
							});
							if (dataLines.length) yield data;
						}
					}
				} finally {
					signal.removeEventListener("abort", abortHandler);
					reader.releaseLock();
				}
				break;
			} catch (error) {
				onSseError?.(error);
				if (sseMaxRetryAttempts !== void 0 && attempt >= sseMaxRetryAttempts) break;
				const backoff = Math.min(retryDelay * 2 ** (attempt - 1), sseMaxRetryDelay ?? 3e4);
				await sleep(backoff);
			}
		}
	};
	return { stream: createStream() };
};
var separatorArrayExplode = (style) => {
	switch (style) {
		case "label": return ".";
		case "matrix": return ";";
		case "simple": return ",";
		default: return "&";
	}
};
var separatorArrayNoExplode = (style) => {
	switch (style) {
		case "form": return ",";
		case "pipeDelimited": return "|";
		case "spaceDelimited": return "%20";
		default: return ",";
	}
};
var separatorObjectExplode = (style) => {
	switch (style) {
		case "label": return ".";
		case "matrix": return ";";
		case "simple": return ",";
		default: return "&";
	}
};
var serializeArrayParam = ({ allowReserved, explode, name, style, value }) => {
	if (!explode) {
		const joinedValues = (allowReserved ? value : value.map((v) => encodeURIComponent(v))).join(separatorArrayNoExplode(style));
		switch (style) {
			case "label": return `.${joinedValues}`;
			case "matrix": return `;${name}=${joinedValues}`;
			case "simple": return joinedValues;
			default: return `${name}=${joinedValues}`;
		}
	}
	const separator = separatorArrayExplode(style);
	const joinedValues = value.map((v) => {
		if (style === "label" || style === "simple") return allowReserved ? v : encodeURIComponent(v);
		return serializePrimitiveParam({
			allowReserved,
			name,
			value: v
		});
	}).join(separator);
	return style === "label" || style === "matrix" ? separator + joinedValues : joinedValues;
};
var serializePrimitiveParam = ({ allowReserved, name, value }) => {
	if (value === void 0 || value === null) return "";
	if (typeof value === "object") throw new Error("Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these.");
	return `${name}=${allowReserved ? value : encodeURIComponent(value)}`;
};
var serializeObjectParam = ({ allowReserved, explode, name, style, value, valueOnly }) => {
	if (value instanceof Date) return valueOnly ? value.toISOString() : `${name}=${value.toISOString()}`;
	if (style !== "deepObject" && !explode) {
		let values = [];
		Object.entries(value).forEach(([key, v]) => {
			values = [
				...values,
				key,
				allowReserved ? v : encodeURIComponent(v)
			];
		});
		const joinedValues = values.join(",");
		switch (style) {
			case "form": return `${name}=${joinedValues}`;
			case "label": return `.${joinedValues}`;
			case "matrix": return `;${name}=${joinedValues}`;
			default: return joinedValues;
		}
	}
	const separator = separatorObjectExplode(style);
	const joinedValues = Object.entries(value).map(([key, v]) => serializePrimitiveParam({
		allowReserved,
		name: style === "deepObject" ? `${name}[${key}]` : key,
		value: v
	})).join(separator);
	return style === "label" || style === "matrix" ? separator + joinedValues : joinedValues;
};
var PATH_PARAM_RE = /\{[^{}]+\}/g;
var defaultPathSerializer = ({ path, url: _url }) => {
	let url = _url;
	const matches = _url.match(PATH_PARAM_RE);
	if (matches) for (const match of matches) {
		let explode = false;
		let name = match.substring(1, match.length - 1);
		let style = "simple";
		if (name.endsWith("*")) {
			explode = true;
			name = name.substring(0, name.length - 1);
		}
		if (name.startsWith(".")) {
			name = name.substring(1);
			style = "label";
		} else if (name.startsWith(";")) {
			name = name.substring(1);
			style = "matrix";
		}
		const value = path[name];
		if (value === void 0 || value === null) continue;
		if (Array.isArray(value)) {
			url = url.replace(match, serializeArrayParam({
				explode,
				name,
				style,
				value
			}));
			continue;
		}
		if (typeof value === "object") {
			url = url.replace(match, serializeObjectParam({
				explode,
				name,
				style,
				value,
				valueOnly: true
			}));
			continue;
		}
		if (style === "matrix") {
			url = url.replace(match, `;${serializePrimitiveParam({
				name,
				value
			})}`);
			continue;
		}
		const replaceValue = encodeURIComponent(style === "label" ? `.${value}` : value);
		url = url.replace(match, replaceValue);
	}
	return url;
};
var getUrl = ({ baseUrl, path, query, querySerializer, url: _url }) => {
	const pathUrl = _url.startsWith("/") ? _url : `/${_url}`;
	let url = (baseUrl ?? "") + pathUrl;
	if (path) url = defaultPathSerializer({
		path,
		url
	});
	let search = query ? querySerializer(query) : "";
	if (search.startsWith("?")) search = search.substring(1);
	if (search) url += `?${search}`;
	return url;
};
function getValidRequestBody(options) {
	const hasBody = options.body !== void 0;
	if (hasBody && options.bodySerializer) {
		if ("serializedBody" in options) return options.serializedBody !== void 0 && options.serializedBody !== "" ? options.serializedBody : null;
		return options.body !== "" ? options.body : null;
	}
	if (hasBody) return options.body;
}
var getAuthToken = async (auth, callback) => {
	const token = typeof callback === "function" ? await callback(auth) : callback;
	if (!token) return;
	if (auth.scheme === "bearer") return `Bearer ${token}`;
	if (auth.scheme === "basic") return `Basic ${btoa(token)}`;
	return token;
};
var createQuerySerializer = ({ parameters = {}, ...args } = {}) => {
	const querySerializer = (queryParams) => {
		const search = [];
		if (queryParams && typeof queryParams === "object") for (const name in queryParams) {
			const value = queryParams[name];
			if (value === void 0 || value === null) continue;
			const options = parameters[name] || args;
			if (Array.isArray(value)) {
				const serializedArray = serializeArrayParam({
					allowReserved: options.allowReserved,
					explode: true,
					name,
					style: "form",
					value,
					...options.array
				});
				if (serializedArray) search.push(serializedArray);
			} else if (typeof value === "object") {
				const serializedObject = serializeObjectParam({
					allowReserved: options.allowReserved,
					explode: true,
					name,
					style: "deepObject",
					value,
					...options.object
				});
				if (serializedObject) search.push(serializedObject);
			} else {
				const serializedPrimitive = serializePrimitiveParam({
					allowReserved: options.allowReserved,
					name,
					value
				});
				if (serializedPrimitive) search.push(serializedPrimitive);
			}
		}
		return search.join("&");
	};
	return querySerializer;
};
/**
* Infers parseAs value from provided Content-Type header.
*/
var getParseAs = (contentType) => {
	if (!contentType) return "stream";
	const cleanContent = contentType.split(";")[0]?.trim();
	if (!cleanContent) return;
	if (cleanContent.startsWith("application/json") || cleanContent.endsWith("+json")) return "json";
	if (cleanContent === "multipart/form-data") return "formData";
	if ([
		"application/",
		"audio/",
		"image/",
		"video/"
	].some((type) => cleanContent.startsWith(type))) return "blob";
	if (cleanContent.startsWith("text/")) return "text";
};
var checkForExistence = (options, name) => {
	if (!name) return false;
	if (options.headers.has(name) || options.query?.[name] || options.headers.get("Cookie")?.includes(`${name}=`)) return true;
	return false;
};
var setAuthParams = async ({ security, ...options }) => {
	for (const auth of security) {
		if (checkForExistence(options, auth.name)) continue;
		const token = await getAuthToken(auth, options.auth);
		if (!token) continue;
		const name = auth.name ?? "Authorization";
		switch (auth.in) {
			case "query":
				if (!options.query) options.query = {};
				options.query[name] = token;
				break;
			case "cookie":
				options.headers.append("Cookie", `${name}=${token}`);
				break;
			default: options.headers.set(name, token);
		}
	}
};
var buildUrl = (options) => getUrl({
	baseUrl: options.baseUrl,
	path: options.path,
	query: options.query,
	querySerializer: typeof options.querySerializer === "function" ? options.querySerializer : createQuerySerializer(options.querySerializer),
	url: options.url
});
var mergeConfigs = (a, b) => {
	const config = {
		...a,
		...b
	};
	if (config.baseUrl?.endsWith("/")) config.baseUrl = config.baseUrl.substring(0, config.baseUrl.length - 1);
	config.headers = mergeHeaders$1(a.headers, b.headers);
	return config;
};
var headersEntries = (headers) => {
	const entries = [];
	headers.forEach((value, key) => {
		entries.push([key, value]);
	});
	return entries;
};
var mergeHeaders$1 = (...headers) => {
	const mergedHeaders = new Headers();
	for (const header of headers) {
		if (!header) continue;
		const iterator = header instanceof Headers ? headersEntries(header) : Object.entries(header);
		for (const [key, value] of iterator) if (value === null) mergedHeaders.delete(key);
		else if (Array.isArray(value)) for (const v of value) mergedHeaders.append(key, v);
		else if (value !== void 0) mergedHeaders.set(key, typeof value === "object" ? JSON.stringify(value) : value);
	}
	return mergedHeaders;
};
var Interceptors = class {
	fns = [];
	clear() {
		this.fns = [];
	}
	eject(id) {
		const index = this.getInterceptorIndex(id);
		if (this.fns[index]) this.fns[index] = null;
	}
	exists(id) {
		const index = this.getInterceptorIndex(id);
		return Boolean(this.fns[index]);
	}
	getInterceptorIndex(id) {
		if (typeof id === "number") return this.fns[id] ? id : -1;
		return this.fns.indexOf(id);
	}
	update(id, fn) {
		const index = this.getInterceptorIndex(id);
		if (this.fns[index]) {
			this.fns[index] = fn;
			return id;
		}
		return false;
	}
	use(fn) {
		this.fns.push(fn);
		return this.fns.length - 1;
	}
};
var createInterceptors = () => ({
	error: new Interceptors(),
	request: new Interceptors(),
	response: new Interceptors()
});
var defaultQuerySerializer = createQuerySerializer({
	allowReserved: false,
	array: {
		explode: true,
		style: "form"
	},
	object: {
		explode: true,
		style: "deepObject"
	}
});
var defaultHeaders = { "Content-Type": "application/json" };
var createConfig = (override = {}) => ({
	...jsonBodySerializer,
	headers: defaultHeaders,
	parseAs: "auto",
	querySerializer: defaultQuerySerializer,
	...override
});
var createClient$1 = (config = {}) => {
	let _config = mergeConfigs(createConfig(), config);
	const getConfig = () => ({ ..._config });
	const setConfig = (config) => {
		_config = mergeConfigs(_config, config);
		return getConfig();
	};
	const interceptors = createInterceptors();
	const beforeRequest = async (options) => {
		const opts = {
			..._config,
			...options,
			fetch: options.fetch ?? _config.fetch ?? globalThis.fetch,
			headers: mergeHeaders$1(_config.headers, options.headers),
			serializedBody: void 0
		};
		if (opts.security) await setAuthParams({
			...opts,
			security: opts.security
		});
		if (opts.requestValidator) await opts.requestValidator(opts);
		if (opts.body !== void 0 && opts.bodySerializer) opts.serializedBody = opts.bodySerializer(opts.body);
		if (opts.body === void 0 || opts.serializedBody === "") opts.headers.delete("Content-Type");
		return {
			opts,
			url: buildUrl(opts)
		};
	};
	const request = async (options) => {
		const { opts, url } = await beforeRequest(options);
		const requestInit = {
			redirect: opts.redirect ?? "follow",
			cache: opts.cache,
			credentials: opts.credentials,
			headers: opts.headers,
			integrity: opts.integrity,
			keepalive: opts.keepalive,
			method: opts.method,
			mode: opts.mode,
			priority: opts.priority,
			referrer: opts.referrer,
			referrerPolicy: opts.referrerPolicy,
			signal: opts.signal,
			body: getValidRequestBody(opts),
			..."duplex" in opts ? { duplex: opts.duplex } : void 0
		};
		let request = new Request(url, requestInit);
		for (const fn of interceptors.request.fns) if (fn) request = await fn(request, opts);
		const _fetch = opts.fetch;
		let response = await _fetch(request);
		for (const fn of interceptors.response.fns) if (fn) response = await fn(response, request, opts);
		const result = {
			request,
			response
		};
		if (response.ok) {
			const parseAs = (opts.parseAs === "auto" ? getParseAs(response.headers.get("Content-Type")) : opts.parseAs) ?? "json";
			if (response.status === 204 || response.headers.get("Content-Length") === "0") {
				let emptyData;
				switch (parseAs) {
					case "arrayBuffer":
					case "blob":
					case "text":
						emptyData = await response[parseAs]();
						break;
					case "formData":
						emptyData = new FormData();
						break;
					case "stream":
						emptyData = response.body;
						break;
					default: emptyData = {};
				}
				return opts.responseStyle === "data" ? emptyData : {
					data: emptyData,
					...result
				};
			}
			let data;
			switch (parseAs) {
				case "arrayBuffer":
				case "blob":
				case "formData":
				case "json":
				case "text":
					data = await response[parseAs]();
					break;
				case "stream": return opts.responseStyle === "data" ? response.body : {
					data: response.body,
					...result
				};
			}
			if (parseAs === "json") {
				if (opts.responseValidator) await opts.responseValidator(data);
				if (opts.responseTransformer) data = await opts.responseTransformer(data);
			}
			return opts.responseStyle === "data" ? data : {
				data,
				...result
			};
		}
		const textError = await response.text();
		let jsonError;
		try {
			jsonError = JSON.parse(textError);
		} catch {}
		const error = jsonError ?? textError;
		let finalError = error;
		for (const fn of interceptors.error.fns) if (fn) finalError = await fn(error, response, request, opts);
		finalError = finalError || {};
		if (opts.throwOnError) throw finalError;
		return opts.responseStyle === "data" ? void 0 : {
			error: finalError,
			...result
		};
	};
	const makeMethodFn = (method) => (options) => request({
		...options,
		method
	});
	const makeSseFn = (method) => async (options) => {
		const { opts, url } = await beforeRequest(options);
		return createSseClient({
			...opts,
			body: opts.body,
			headers: opts.headers,
			method,
			onRequest: async (url, init) => {
				let request = new Request(url, init);
				for (const fn of interceptors.request.fns) if (fn) request = await fn(request, opts);
				return request;
			},
			url
		});
	};
	return {
		buildUrl,
		connect: makeMethodFn("CONNECT"),
		delete: makeMethodFn("DELETE"),
		get: makeMethodFn("GET"),
		getConfig,
		head: makeMethodFn("HEAD"),
		interceptors,
		options: makeMethodFn("OPTIONS"),
		patch: makeMethodFn("PATCH"),
		post: makeMethodFn("POST"),
		put: makeMethodFn("PUT"),
		request,
		setConfig,
		sse: {
			connect: makeSseFn("CONNECT"),
			delete: makeSseFn("DELETE"),
			get: makeSseFn("GET"),
			head: makeSseFn("HEAD"),
			options: makeSseFn("OPTIONS"),
			patch: makeSseFn("PATCH"),
			post: makeSseFn("POST"),
			put: makeSseFn("PUT"),
			trace: makeSseFn("TRACE")
		},
		trace: makeMethodFn("TRACE")
	};
};
function getErrorCode(error) {
	if (!(error instanceof Error)) return void 0;
	const err = error;
	if (typeof err.code === "string") return err.code;
	if (err.cause && typeof err.cause === "object") {
		const cause = err.cause;
		if (typeof cause.code === "string") return cause.code;
	}
}
function isConnectionError(error) {
	if (!(error instanceof Error)) return false;
	const msg = error.message.toLowerCase().replace(/[\s.!]+$/, "");
	if ([
		"fetch failed",
		"failed to fetch",
		"networkerror when attempting to fetch resource",
		"load failed"
	].includes(msg)) return true;
	const code = getErrorCode(error);
	return typeof code === "string" && [
		"ECONNREFUSED",
		"ENOTFOUND",
		"ETIMEDOUT",
		"ENETUNREACH",
		"EHOSTUNREACH",
		"ECONNRESET",
		"EPIPE"
	].includes(code);
}
function s2Error(error) {
	if (error instanceof S2Error) return error;
	if (isConnectionError(error)) {
		const code = getErrorCode(error) ?? "NETWORK_ERROR";
		if (code === "ENOTFOUND") return new S2Error({
			message: `DNS resolution failed (ENOTFOUND)`,
			code,
			status: 400,
			origin: "sdk"
		});
		return new S2Error({
			message: `Connection failed: ${code}`,
			code,
			status: 502,
			origin: "sdk"
		});
	}
	if (error instanceof Error && error.name === "AbortError") return new S2Error({
		message: "Request cancelled",
		status: 499,
		origin: "sdk"
	});
	return new S2Error({
		message: error instanceof Error ? error.message : "Unknown error",
		status: 0,
		origin: "sdk"
	});
}
/**
* Execute a generated client call and return its `data` on success.
* Throws S2Error when the response contains `error`, or when the
* response has no `data` and is not a 204 No Content.
*/
async function withS2Data(fn) {
	try {
		const res = await fn();
		if (res && typeof res === "object" && (Object.prototype.hasOwnProperty.call(res, "error") || Object.prototype.hasOwnProperty.call(res, "data") || Object.prototype.hasOwnProperty.call(res, "response"))) {
			const status = res.response?.status ?? 500;
			const statusText = res.response?.statusText;
			if (res.error) {
				const err = res.error;
				if (typeof err === "object" && "message" in err) {
					const structured = err;
					throw new S2Error({
						message: typeof structured.message === "string" ? structured.message : statusText ?? "Error",
						code: typeof structured.code === "string" ? structured.code : void 0,
						status,
						origin: "server"
					});
				}
				throw new S2Error({
					message: statusText ?? "Request failed",
					status,
					origin: "server"
				});
			}
			if (typeof res.data !== "undefined") return res.data;
			if (status === 204) return void 0;
			throw new S2Error({
				message: "Empty response",
				status,
				origin: "server"
			});
		}
		return res;
	} catch (error) {
		throw s2Error(error);
	}
}
/**
* Rich error type used by the SDK to surface HTTP and protocol errors.
*
* - `code` is the service error code when available.
* - `status` is the HTTP status code.
* - `data` may include structured error details (e.g. for conditional failures).
*/
var S2Error = class extends Error {
	code;
	/** HTTP status code. 0 for non-HTTP/internal errors. */
	status;
	/** Optional structured error details for diagnostics. */
	data;
	/** Origin of the error: server (HTTP response) or sdk (local). */
	origin;
	constructor({ message, code, status, data, origin }) {
		super(message);
		this.code = code;
		this.status = typeof status === "number" ? status : 0;
		this.data = data;
		this.origin = origin ?? "sdk";
		this.name = "S2Error";
	}
	/**
	* Returns true if the error guarantees that no mutation occurred.
	*
	* Certain server errors (`rate_limited`, `hot_server`) and client errors
	* (`ECONNREFUSED`) are safe to retry since they guarantee no side effects.
	*/
	hasNoSideEffects() {
		if (this.origin === "server") return this.status === 429 && this.code === "rate_limited" || this.status === 502 && this.code === "hot_server";
		if (this.origin === "sdk") return this.code === "ECONNREFUSED";
		return false;
	}
};
/** Helper: construct a non-retryable invariant violation error (status 0). */
function invariantViolation(message, details) {
	return new S2Error({
		message: `Invariant violation: ${message}`,
		code: "INTERNAL_ERROR",
		status: 0,
		origin: "sdk",
		data: details
	});
}
/** Helper: construct an aborted/cancelled error (499). */
function abortedError(message = "Request cancelled") {
	return new S2Error({
		message,
		code: "ABORTED",
		status: 499,
		origin: "sdk"
	});
}
/**
* Thrown when an append operation fails due to a sequence number mismatch.
*
* This occurs when you specify a `matchSeqNum` condition in your append request,
* but the current tail sequence number of the stream doesn't match.
*
* The `expectedSeqNum` property contains the actual next sequence number
* that should be used for a successful append.
*/
var SeqNumMismatchError = class extends S2Error {
	/** The expected next sequence number for the stream. */
	expectedSeqNum;
	constructor({ message, code, status, expectedSeqNum }) {
		super({
			message: `${message}\nExpected sequence number: ${expectedSeqNum}`,
			code,
			status,
			origin: "server"
		});
		this.name = "SeqNumMismatchError";
		this.expectedSeqNum = expectedSeqNum;
	}
};
/**
* Thrown when an append operation fails due to a fencing token mismatch.
*
* This occurs when you specify a `fencingToken` condition in your append request,
* but the current fencing token of the stream doesn't match.
*
* The `expectedFencingToken` property contains the actual fencing token
* that should be used for a successful append.
*/
var FencingTokenMismatchError = class extends S2Error {
	/** The expected fencing token for the stream. */
	expectedFencingToken;
	constructor({ message, code, status, expectedFencingToken }) {
		super({
			message: `${message}\nExpected fencing token: ${expectedFencingToken}`,
			code,
			status,
			origin: "server"
		});
		this.name = "FencingTokenMismatchError";
		this.expectedFencingToken = expectedFencingToken;
	}
};
/**
* Thrown when a read operation fails because the requested starting point is out of range
* (HTTP 416 Range Not Satisfiable).
*
* The `tail` property contains the current tail position of the stream when available.
*
* @see https://s2.dev/docs/api/records/read#starting-point-out-of-range
*/
var RangeNotSatisfiableError = class extends S2Error {
	/** The current tail position of the stream. */
	tail;
	constructor({ code, status = 416, tail } = {}) {
		const message = tail ? `Range not satisfiable: starting point is out of range (tail seq_num=${tail.seq_num}).` : "Range not satisfiable: starting point is out of range.";
		super({
			message,
			code,
			status,
			origin: "server"
		});
		this.name = "RangeNotSatisfiableError";
		this.tail = tail;
	}
};
/**
* Build a generic S2Error from HTTP status and optional payload.
* If the payload contains a structured { message, code }, those are preferred.
*/
function makeServerError(response, payload) {
	const status = typeof response.status === "number" ? response.status : 500;
	if (payload && typeof payload === "object" && "message" in payload) {
		const structured = payload;
		return new S2Error({
			message: typeof structured.message === "string" ? structured.message : response.statusText ?? "Error",
			code: typeof structured.code === "string" ? structured.code : void 0,
			status,
			origin: "server"
		});
	}
	let message = void 0;
	if (typeof payload === "string" && payload.trim().length > 0) message = payload;
	return new S2Error({
		message: message ?? response.statusText ?? "Request failed",
		status,
		origin: "server"
	});
}
/** Map 412 Precondition Failed append errors to rich error types. */
function makeAppendPreconditionError(status, json) {
	if (json && typeof json === "object") {
		if ("seq_num_mismatch" in json) return new SeqNumMismatchError({
			message: "Append condition failed: sequence number mismatch",
			code: "APPEND_CONDITION_FAILED",
			status,
			expectedSeqNum: Number(json.seq_num_mismatch)
		});
		if ("fencing_token_mismatch" in json) return new FencingTokenMismatchError({
			message: "Append condition failed: fencing token mismatch",
			code: "APPEND_CONDITION_FAILED",
			status,
			expectedFencingToken: String(json.fencing_token_mismatch)
		});
		if ("message" in json) return new S2Error({
			message: json.message ?? "Append condition failed",
			status,
			origin: "server"
		});
	}
	return new S2Error({
		message: "Append condition failed",
		status,
		origin: "server"
	});
}
/**
* Generate a random token of the specified byte length, base64 encoded.
* Uses crypto.getRandomValues() which is available in browsers and Node.js 19+.
*
* @param byteLength Number of random bytes to generate (default: 16)
* @returns Base64-encoded random string
*/
var randomToken = (byteLength = 16) => {
	const bytes = new Uint8Array(byteLength);
	crypto.getRandomValues(bytes);
	return encodeToBase64(bytes);
};
var encodeToBase64 = (bytes) => {
	const length = bytes.length;
	let result = "";
	let i = 2;
	for (; i < length; i += 3) {
		result += base64abc[bytes[i - 2] >> 2];
		result += base64abc[(bytes[i - 2] & 3) << 4 | bytes[i - 1] >> 4];
		result += base64abc[(bytes[i - 1] & 15) << 2 | bytes[i] >> 6];
		result += base64abc[bytes[i] & 63];
	}
	if (i === length + 1) {
		result += base64abc[bytes[i - 2] >> 2];
		result += base64abc[(bytes[i - 2] & 3) << 4];
		result += "==";
	}
	if (i === length) {
		result += base64abc[bytes[i - 2] >> 2];
		result += base64abc[(bytes[i - 2] & 3) << 4 | bytes[i - 1] >> 4];
		result += base64abc[(bytes[i - 1] & 15) << 2];
		result += "=";
	}
	return result;
};
var decodeFromBase64 = (str) => {
	const normalized = stripCrlf(str).trim().replace(/-/g, "+").replace(/_/g, "/");
	const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
	const length = padded.length;
	if (length % 4 !== 0) throw new Error(`Length must be a multiple of 4, but is ${length}`);
	const index = padded.indexOf("=");
	if (index !== -1 && (index < length - 2 || index === length - 2 && padded[length - 1] !== "=")) throw new Error("Found a '=' character, but it is not at the end");
	try {
		const missingOctets = padded.endsWith("==") ? 2 : padded.endsWith("=") ? 1 : 0;
		const result = new Uint8Array(3 * (length / 4) - missingOctets);
		for (let i = 0, j = 0; i < length; i += 4, j += 3) {
			const buffer = getBase64Code(padded.charCodeAt(i)) << 18 | getBase64Code(padded.charCodeAt(i + 1)) << 12 | getBase64Code(padded.charCodeAt(i + 2)) << 6 | getBase64Code(padded.charCodeAt(i + 3));
			result[j] = buffer >> 16;
			result[j + 1] = buffer >> 8 & 255;
			result[j + 2] = buffer & 255;
		}
		return result;
	} catch (e) {
		throw new Error(e instanceof Error ? e.message : "Invalid input");
	}
};
var stripCrlf = (str) => str.replace(/[\n\r]/g, "");
function getBase64Code(charCode) {
	if (charCode >= base64codes.length) throw new TypeError(`Invalid character ${String.fromCharCode(charCode)}`);
	const code = base64codes[charCode];
	if (code === 255) throw new TypeError(`Invalid character ${String.fromCharCode(charCode)}`);
	return code;
}
var base64abc = [
	"A",
	"B",
	"C",
	"D",
	"E",
	"F",
	"G",
	"H",
	"I",
	"J",
	"K",
	"L",
	"M",
	"N",
	"O",
	"P",
	"Q",
	"R",
	"S",
	"T",
	"U",
	"V",
	"W",
	"X",
	"Y",
	"Z",
	"a",
	"b",
	"c",
	"d",
	"e",
	"f",
	"g",
	"h",
	"i",
	"j",
	"k",
	"l",
	"m",
	"n",
	"o",
	"p",
	"q",
	"r",
	"s",
	"t",
	"u",
	"v",
	"w",
	"x",
	"y",
	"z",
	"0",
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	"+",
	"/"
];
var base64codes = [
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	62,
	255,
	255,
	255,
	63,
	52,
	53,
	54,
	55,
	56,
	57,
	58,
	59,
	60,
	61,
	255,
	255,
	255,
	0,
	255,
	255,
	255,
	0,
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
	11,
	12,
	13,
	14,
	15,
	16,
	17,
	18,
	19,
	20,
	21,
	22,
	23,
	24,
	25,
	255,
	255,
	255,
	255,
	255,
	255,
	26,
	27,
	28,
	29,
	30,
	31,
	32,
	33,
	34,
	35,
	36,
	37,
	38,
	39,
	40,
	41,
	42,
	43,
	44,
	45,
	46,
	47,
	48,
	49,
	50,
	51
];
var redactedRegistry = /* @__PURE__ */ new WeakMap();
var proto = Object.freeze({
	toString() {
		return "<redacted>";
	},
	toJSON() {
		return "<redacted>";
	},
	[Symbol.for("nodejs.util.inspect.custom")]() {
		return "<redacted>";
	}
});
var make = (value) => {
	const redacted = Object.create(proto);
	redactedRegistry.set(redacted, value);
	return redacted;
};
var value = (self) => {
	if (redactedRegistry.has(self)) return redactedRegistry.get(self);
	else throw new Error("Unable to get redacted value");
};
/**
* Request header used for per-stream append/read encryption keys.
*/
var S2_ENCRYPTION_KEY_HEADER = "s2-encryption-key";
var EncryptionKeyLengthError = class extends S2Error {
	length;
	constructor(length) {
		super({
			message: `invalid encryption key: key material length ${length} is out of range`,
			origin: "sdk"
		});
		this.length = length;
		this.name = "EncryptionKeyLengthError";
	}
};
/**
* Helpers for normalizing client-supplied encryption keys.
*/
var EncryptionKey = { 
/**
* Normalize key material into the base64-encoded header form accepted by S2.
*/
from(value) {
	const normalized = typeof value === "string" ? value.trim() : encodeToBase64(value);
	const keyMaterialLength = typeof value === "string" ? normalized.length : value.byteLength;
	if (normalized.length === 0 || normalized.length > 44) throw new EncryptionKeyLengthError(keyMaterialLength);
	return normalized;
} };
function resolveEncryptionKey(value) {
	if (value === void 0 || value === null) return;
	return make(EncryptionKey.from(value));
}
/**
* Library version.
*
* This file is auto-generated from package.json by scripts/generate-version.ts.
* Do not edit manually.
*/
var VERSION = "0.23.0";
/**
* Detect the current JavaScript runtime
*/
function detectRuntime() {
	if (typeof Deno !== "undefined") return "deno";
	if (typeof Bun !== "undefined") return "bun";
	if (typeof WebSocketPair !== "undefined") return "workerd";
	if (typeof process !== "undefined" && process.versions?.node !== void 0) return "node";
	if (typeof window !== "undefined" && typeof document !== "undefined") return "browser";
	return "unknown";
}
/**
* Check if the current runtime supports HTTP/2 for s2s protocol
*/
function supportsHttp2() {
	switch (detectRuntime()) {
		case "node": return true;
		case "deno": return false;
		case "bun": return false;
		case "browser":
		case "workerd": return false;
		default: return false;
	}
}
/**
* Check if the current runtime allows setting a custom User-Agent header.
*
* Only browsers enforce the Fetch spec's "forbidden header name" restriction
* that prevents setting User-Agent. All server-side runtimes (Node, Bun,
* Deno, Cloudflare Workers, etc.) allow it.
*/
function canSetUserAgentHeader(runtime) {
	return (runtime ?? detectRuntime()) !== "browser";
}
var DEFAULT_USER_AGENT = `s2-sdk-typescript/${VERSION}`;
var client = createClient$1(createConfig({ baseUrl: "https://aws.s2.dev/v1" }));
/**
* List access tokens.
*/
var listAccessTokens = (options) => {
	return (options?.client ?? client).get({
		security: [{
			scheme: "bearer",
			type: "http"
		}],
		url: "/access-tokens",
		...options
	});
};
/**
* Issue a new access token.
*/
var issueAccessToken = (options) => {
	return (options.client ?? client).post({
		security: [{
			scheme: "bearer",
			type: "http"
		}],
		url: "/access-tokens",
		...options,
		headers: {
			"Content-Type": "application/json",
			...options.headers
		}
	});
};
/**
* Revoke an access token.
*/
var revokeAccessToken = (options) => {
	return (options.client ?? client).delete({
		security: [{
			scheme: "bearer",
			type: "http"
		}],
		url: "/access-tokens/{id}",
		...options
	});
};
/**
* List basins.
*/
var listBasins = (options) => {
	return (options?.client ?? client).get({
		security: [{
			scheme: "bearer",
			type: "http"
		}],
		url: "/basins",
		...options
	});
};
/**
* Create a basin.
*/
var createBasin = (options) => {
	return (options.client ?? client).post({
		security: [{
			scheme: "bearer",
			type: "http"
		}],
		url: "/basins",
		...options,
		headers: {
			"Content-Type": "application/json",
			...options.headers
		}
	});
};
/**
* Delete a basin.
*/
var deleteBasin = (options) => {
	return (options.client ?? client).delete({
		security: [{
			scheme: "bearer",
			type: "http"
		}],
		url: "/basins/{basin}",
		...options
	});
};
/**
* Get basin configuration.
*/
var getBasinConfig = (options) => {
	return (options.client ?? client).get({
		security: [{
			scheme: "bearer",
			type: "http"
		}],
		url: "/basins/{basin}",
		...options
	});
};
/**
* Reconfigure a basin.
*/
var reconfigureBasin = (options) => {
	return (options.client ?? client).patch({
		security: [{
			scheme: "bearer",
			type: "http"
		}],
		url: "/basins/{basin}",
		...options,
		headers: {
			"Content-Type": "application/json",
			...options.headers
		}
	});
};
/**
* Account-level metrics.
*/
var accountMetrics = (options) => {
	return (options.client ?? client).get({
		security: [{
			scheme: "bearer",
			type: "http"
		}],
		url: "/metrics",
		...options
	});
};
/**
* Basin-level metrics.
*/
var basinMetrics = (options) => {
	return (options.client ?? client).get({
		security: [{
			scheme: "bearer",
			type: "http"
		}],
		url: "/metrics/{basin}",
		...options
	});
};
/**
* Stream-level metrics.
*/
var streamMetrics = (options) => {
	return (options.client ?? client).get({
		security: [{
			scheme: "bearer",
			type: "http"
		}],
		url: "/metrics/{basin}/{stream}",
		...options
	});
};
/**
* List streams.
*/
var listStreams = (options) => {
	return (options?.client ?? client).get({
		security: [{
			scheme: "bearer",
			type: "http"
		}],
		url: "/streams",
		...options
	});
};
/**
* Create a stream.
*/
var createStream = (options) => {
	return (options.client ?? client).post({
		security: [{
			scheme: "bearer",
			type: "http"
		}],
		url: "/streams",
		...options,
		headers: {
			"Content-Type": "application/json",
			...options.headers
		}
	});
};
/**
* Delete a stream.
*/
var deleteStream = (options) => {
	return (options.client ?? client).delete({
		security: [{
			scheme: "bearer",
			type: "http"
		}],
		url: "/streams/{stream}",
		...options
	});
};
/**
* Get stream configuration.
*/
var getStreamConfig = (options) => {
	return (options.client ?? client).get({
		security: [{
			scheme: "bearer",
			type: "http"
		}],
		url: "/streams/{stream}",
		...options
	});
};
/**
* Reconfigure a stream.
*/
var reconfigureStream = (options) => {
	return (options.client ?? client).patch({
		security: [{
			scheme: "bearer",
			type: "http"
		}],
		url: "/streams/{stream}",
		...options,
		headers: {
			"Content-Type": "application/json",
			...options.headers
		}
	});
};
/**
* Read records.
*/
var read = (options) => {
	return (options.client ?? client).get({
		security: [{
			scheme: "bearer",
			type: "http"
		}],
		url: "/streams/{stream}/records",
		...options
	});
};
/**
* Append records.
*/
var append = (options) => {
	return (options.client ?? client).post({
		security: [{
			scheme: "bearer",
			type: "http"
		}],
		url: "/streams/{stream}/records",
		...options,
		headers: {
			"Content-Type": "application/json",
			...options.headers
		}
	});
};
/**
* Check the tail.
*/
var checkTail = (options) => {
	return (options.client ?? client).get({
		security: [{
			scheme: "bearer",
			type: "http"
		}],
		url: "/streams/{stream}/records/tail",
		...options
	});
};
/**
* Calculate the UTF-8 byte length of a string.
* Handles all Unicode characters including surrogate pairs correctly.
*
* @param str The string to measure
* @returns The byte length when encoded as UTF-8
*/
function utf8ByteLength(str) {
	let bytes = 0;
	for (let i = 0; i < str.length; i++) {
		const code = str.charCodeAt(i);
		if (code <= 127) bytes += 1;
		else if (code <= 2047) bytes += 2;
		else if (code >= 55296 && code <= 56319) {
			if (i + 1 < str.length) {
				const next = str.charCodeAt(i + 1);
				if (next >= 56320 && next <= 57343) {
					bytes += 4;
					i++;
				} else bytes += 3;
			} else bytes += 3;
		} else if (code >= 56320 && code <= 57343) bytes += 3;
		else bytes += 3;
	}
	return bytes;
}
/**
* Calculate the metered size in bytes of a record (append or read).
* This includes the body and headers, but not metadata like timestamp.
*
* This function calculates how many bytes the record will occupy
* after being received and deserialized as raw bytes on the S2 side.
* For strings, it calculates UTF-8 byte length. For Uint8Array, it uses
* the array length directly (same value as would be used when encoding
* to base64 for transmission).
*
* @param record The record to measure
* @returns The size in bytes
*/
function meteredBytes(record) {
	let numHeaders = 0;
	let headersSize = 0;
	if (record.headers) {
		numHeaders = record.headers.length;
		headersSize = record.headers.reduce((sum, [k, v]) => {
			const keySize = typeof k === "string" ? utf8ByteLength(k) : k.length;
			const valueSize = typeof v === "string" ? utf8ByteLength(v) : v.length;
			return sum + keySize + valueSize;
		}, 0);
	}
	const bodySize = record.body ? typeof record.body === "string" ? utf8ByteLength(record.body) : record.body.length : 0;
	return 8 + 2 * numHeaders + headersSize + bodySize;
}
/**
* Whether this is a command record.
* Command records have exactly one header with an empty name.
*/
function isCommandRecord(record) {
	if (!record.headers || !Array.isArray(record.headers)) return false;
	if (record.headers.length !== 1) return false;
	const [name] = record.headers[0];
	if (typeof name === "string") return name === "";
	return name.length === 0;
}
function computeAppendRecordFormat(record) {
	let result = "string";
	if (record.body && typeof record.body !== "string") result = "bytes";
	if (record.headers && Array.isArray(record.headers) && record.headers.some(([k, v]) => typeof k !== "string" || typeof v !== "string")) result = "bytes";
	return result;
}
/**
* S2 SDK Types
*
* All public SDK types are defined here. Types use camelCase field names
* for idiomatic JavaScript/TypeScript usage.
*
* Generated types (snake_case, matching API wire format) are available
* from "./generated/types.gen.js" as the `API` namespace.
*/
var textEncoder$2 = new TextEncoder();
/**
* Factory functions for creating AppendRecord instances.
*/
var AppendRecord$1;
(function(AppendRecord) {
	/**
	* Create a string-format append record with pre-calculated metered size.
	*/
	function string(params) {
		const record = {
			body: params.body,
			headers: params.headers,
			timestamp: params.timestamp,
			meteredBytes: 0
		};
		record.meteredBytes = meteredBytes(record);
		return record;
	}
	AppendRecord.string = string;
	/**
	* Create a bytes-format append record with pre-calculated metered size.
	*/
	function bytes(params) {
		const record = {
			body: params.body,
			headers: params.headers,
			timestamp: params.timestamp,
			meteredBytes: 0
		};
		record.meteredBytes = meteredBytes(record);
		return record;
	}
	AppendRecord.bytes = bytes;
	/**
	* Create a fence command record.
	*/
	function fence(fencingToken, timestamp) {
		if (utf8ByteLength(fencingToken) > 36) throw new S2Error({
			message: "fencing token must not exceed 36 bytes in length",
			origin: "sdk",
			status: 422
		});
		return string({
			body: fencingToken,
			headers: [["", "fence"]],
			timestamp
		});
	}
	AppendRecord.fence = fence;
	/**
	* Create a trim command record.
	*/
	function trim(seqNum, timestamp) {
		if (!Number.isSafeInteger(seqNum) || seqNum < 0) throw new S2Error({
			message: "seqNum must be a non-negative safe integer",
			origin: "sdk"
		});
		const buffer = /* @__PURE__ */ new Uint8Array(8);
		new DataView(buffer.buffer).setBigUint64(0, BigInt(seqNum), false);
		return bytes({
			body: buffer,
			headers: [[textEncoder$2.encode(""), textEncoder$2.encode("trim")]],
			timestamp
		});
	}
	AppendRecord.trim = trim;
})(AppendRecord$1 || (AppendRecord$1 = {}));
/** Maximum number of records in a single append batch. */
var MAX_APPEND_RECORDS = 1e3;
/** Maximum total metered bytes for records in a single append batch (1 MiB). */
var MAX_APPEND_BYTES = 1048576;
/**
* Factory functions for creating AppendInput instances.
*/
var AppendInput$1;
(function(AppendInput) {
	/**
	* Create an AppendInput with validation.
	*
	* @throws {S2Error} If validation fails (empty, too many records, or too large)
	*/
	function create(records, options) {
		if (records.length === 0) throw new S2Error({
			message: "AppendInput must contain at least one record",
			origin: "sdk"
		});
		if (records.length > 1e3) throw new S2Error({
			message: `AppendInput cannot contain more than ${MAX_APPEND_RECORDS} records (got ${records.length})`,
			origin: "sdk"
		});
		const totalBytes = records.reduce((sum, r) => sum + r.meteredBytes, 0);
		if (totalBytes > 1048576) throw new S2Error({
			message: `AppendInput exceeds maximum of ${MAX_APPEND_BYTES} bytes (got ${totalBytes} bytes)`,
			origin: "sdk"
		});
		if (options?.fencingToken !== void 0) {
			if (utf8ByteLength(options.fencingToken) > 36) throw new S2Error({
				message: "fencing token must not exceed 36 bytes in length",
				origin: "sdk",
				status: 422
			});
		}
		if (options?.matchSeqNum !== void 0 && (!Number.isSafeInteger(options.matchSeqNum) || options.matchSeqNum < 0)) throw new S2Error({
			message: "matchSeqNum must be a non-negative safe integer",
			origin: "sdk"
		});
		return {
			records,
			matchSeqNum: options?.matchSeqNum,
			fencingToken: options?.fencingToken,
			meteredBytes: totalBytes
		};
	}
	AppendInput.create = create;
})(AppendInput$1 || (AppendInput$1 = {}));
var textEncoder$1 = new TextEncoder();
function toBytes$1(value) {
	return typeof value === "string" ? textEncoder$1.encode(value) : value;
}
function toBase64(value) {
	return encodeToBase64(toBytes$1(value));
}
function fromBase64(value) {
	return decodeFromBase64(value);
}
/** Convert milliseconds to Date. */
function toDate$2(ms) {
	return new Date(ms);
}
/** Convert Date or milliseconds to milliseconds. */
function toEpochMs(value) {
	if (value === void 0 || value === null) return void 0;
	return typeof value === "number" ? Math.floor(value) : value.getTime();
}
/**
* Convert API StreamPosition to SDK StreamPosition.
*/
function fromAPIStreamPosition(pos) {
	return {
		seqNum: pos.seq_num,
		timestamp: toDate$2(pos.timestamp)
	};
}
/**
* Convert API AppendAck to SDK AppendAck.
*/
function fromAPIAppendAck(ack) {
	return {
		start: fromAPIStreamPosition(ack.start),
		end: fromAPIStreamPosition(ack.end),
		tail: fromAPIStreamPosition(ack.tail)
	};
}
/**
* Convert API TailResponse to SDK TailResponse.
*/
function fromAPITailResponse(res) {
	return { tail: fromAPIStreamPosition(res.tail) };
}
/**
* Convert SDK AppendRecord to API AppendRecord (for JSON/REST API).
*/
function toAPIAppendRecord(record) {
	if ("body" in record && typeof record.body === "string") {
		const stringRecord = record;
		return {
			body: stringRecord.body,
			headers: stringRecord.headers?.map(([name, value]) => [name, value]),
			timestamp: toEpochMs(stringRecord.timestamp)
		};
	} else {
		const bytesRecord = record;
		return {
			body: toBase64(bytesRecord.body),
			headers: bytesRecord.headers?.map(([name, value]) => [toBase64(name), toBase64(value)]),
			timestamp: toEpochMs(bytesRecord.timestamp)
		};
	}
}
/**
* Convert API SequencedRecord to SDK ReadRecord (string format).
*/
function fromAPISequencedRecordString(record) {
	let headers = [];
	if (record.headers) {
		if (Array.isArray(record.headers)) headers = record.headers.map(([name, value]) => [name, value]);
		else if (typeof record.headers === "object") headers = Object.entries(record.headers);
	}
	return {
		seqNum: record.seq_num,
		timestamp: toDate$2(record.timestamp),
		body: record.body ?? "",
		headers
	};
}
/**
* Convert API SequencedRecord to SDK ReadRecord (bytes format).
*/
function fromAPISequencedRecordBytes(record) {
	let body;
	if (!record.body) body = /* @__PURE__ */ new Uint8Array();
	else if (typeof record.body === "string") body = fromBase64(record.body);
	else body = record.body;
	let headers = [];
	if (record.headers) {
		if (Array.isArray(record.headers)) headers = record.headers.map(([name, value]) => {
			return [typeof name === "string" ? fromBase64(name) : name, typeof value === "string" ? fromBase64(value) : value];
		});
		else if (typeof record.headers === "object") headers = Object.entries(record.headers).map(([name, value]) => [fromBase64(name), fromBase64(value)]);
	}
	return {
		seqNum: record.seq_num,
		timestamp: toDate$2(record.timestamp),
		body,
		headers
	};
}
/**
* Convert API/internal ReadBatch to SDK ReadBatch (string format).
*/
function fromAPIReadBatchString(batch) {
	return {
		records: batch.records.map((r) => fromAPISequencedRecordString(r)),
		tail: batch.tail ? fromAPIStreamPosition(batch.tail) : void 0
	};
}
/**
* Convert API/internal ReadBatch to SDK ReadBatch (bytes format).
*/
function fromAPIReadBatchBytes(batch) {
	return {
		records: batch.records.map((r) => fromAPISequencedRecordBytes(r)),
		tail: batch.tail ? fromAPIStreamPosition(batch.tail) : void 0
	};
}
/**
* Convert SDK ReadInput (camelCase) to flat query parameters for the API (snake_case).
*/
function toAPIReadQuery(input) {
	if (!input) return {};
	const query = {};
	if (input.start?.from) {
		const from = input.start.from;
		if ("seqNum" in from) query.seq_num = Math.floor(from.seqNum);
		else if ("timestamp" in from) query.timestamp = typeof from.timestamp === "number" ? Math.floor(from.timestamp) : from.timestamp.getTime();
		else if ("tailOffset" in from) query.tail_offset = Math.floor(from.tailOffset);
	}
	if (input.start?.clamp !== void 0) query.clamp = input.start.clamp;
	if (input.stop?.limits) {
		if (input.stop.limits.count !== void 0) query.count = Math.floor(input.stop.limits.count);
		if (input.stop.limits.bytes !== void 0) query.bytes = Math.floor(input.stop.limits.bytes);
	}
	if (input.stop?.untilTimestamp !== void 0) query.until = typeof input.stop.untilTimestamp === "number" ? Math.floor(input.stop.untilTimestamp) : input.stop.untilTimestamp.getTime();
	if (input.stop?.waitSecs !== void 0) query.wait = Math.max(0, Math.floor(input.stop.waitSecs));
	return query;
}
var require_ms = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Helpers.
	*/
	var s = 1e3;
	var m = s * 60;
	var h = m * 60;
	var d = h * 24;
	var w = d * 7;
	var y = d * 365.25;
	/**
	* Parse or format the given `val`.
	*
	* Options:
	*
	*  - `long` verbose formatting [false]
	*
	* @param {String|Number} val
	* @param {Object} [options]
	* @throws {Error} throw an error if val is not a non-empty string or a number
	* @return {String|Number}
	* @api public
	*/
	module.exports = function(val, options) {
		options = options || {};
		var type = typeof val;
		if (type === "string" && val.length > 0) return parse(val);
		else if (type === "number" && isFinite(val)) return options.long ? fmtLong(val) : fmtShort(val);
		throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
	};
	/**
	* Parse the given `str` and return milliseconds.
	*
	* @param {String} str
	* @return {Number}
	* @api private
	*/
	function parse(str) {
		str = String(str);
		if (str.length > 100) return;
		var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
		if (!match) return;
		var n = parseFloat(match[1]);
		switch ((match[2] || "ms").toLowerCase()) {
			case "years":
			case "year":
			case "yrs":
			case "yr":
			case "y": return n * y;
			case "weeks":
			case "week":
			case "w": return n * w;
			case "days":
			case "day":
			case "d": return n * d;
			case "hours":
			case "hour":
			case "hrs":
			case "hr":
			case "h": return n * h;
			case "minutes":
			case "minute":
			case "mins":
			case "min":
			case "m": return n * m;
			case "seconds":
			case "second":
			case "secs":
			case "sec":
			case "s": return n * s;
			case "milliseconds":
			case "millisecond":
			case "msecs":
			case "msec":
			case "ms": return n;
			default: return;
		}
	}
	/**
	* Short format for `ms`.
	*
	* @param {Number} ms
	* @return {String}
	* @api private
	*/
	function fmtShort(ms) {
		var msAbs = Math.abs(ms);
		if (msAbs >= d) return Math.round(ms / d) + "d";
		if (msAbs >= h) return Math.round(ms / h) + "h";
		if (msAbs >= m) return Math.round(ms / m) + "m";
		if (msAbs >= s) return Math.round(ms / s) + "s";
		return ms + "ms";
	}
	/**
	* Long format for `ms`.
	*
	* @param {Number} ms
	* @return {String}
	* @api private
	*/
	function fmtLong(ms) {
		var msAbs = Math.abs(ms);
		if (msAbs >= d) return plural(ms, msAbs, d, "day");
		if (msAbs >= h) return plural(ms, msAbs, h, "hour");
		if (msAbs >= m) return plural(ms, msAbs, m, "minute");
		if (msAbs >= s) return plural(ms, msAbs, s, "second");
		return ms + " ms";
	}
	/**
	* Pluralization helper.
	*/
	function plural(ms, msAbs, n, name) {
		var isPlural = msAbs >= n * 1.5;
		return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
	}
}));
var require_common = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This is the common logic for both the Node.js and web browser
	* implementations of `debug()`.
	*/
	function setup(env) {
		createDebug.debug = createDebug;
		createDebug.default = createDebug;
		createDebug.coerce = coerce;
		createDebug.disable = disable;
		createDebug.enable = enable;
		createDebug.enabled = enabled;
		createDebug.humanize = require_ms();
		createDebug.destroy = destroy;
		Object.keys(env).forEach((key) => {
			createDebug[key] = env[key];
		});
		/**
		* The currently active debug mode names, and names to skip.
		*/
		createDebug.names = [];
		createDebug.skips = [];
		/**
		* Map of special "%n" handling functions, for the debug "format" argument.
		*
		* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
		*/
		createDebug.formatters = {};
		/**
		* Selects a color for a debug namespace
		* @param {String} namespace The namespace string for the debug instance to be colored
		* @return {Number|String} An ANSI color code for the given namespace
		* @api private
		*/
		function selectColor(namespace) {
			let hash = 0;
			for (let i = 0; i < namespace.length; i++) {
				hash = (hash << 5) - hash + namespace.charCodeAt(i);
				hash |= 0;
			}
			return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
		}
		createDebug.selectColor = selectColor;
		/**
		* Create a debugger with the given `namespace`.
		*
		* @param {String} namespace
		* @return {Function}
		* @api public
		*/
		function createDebug(namespace) {
			let prevTime;
			let enableOverride = null;
			let namespacesCache;
			let enabledCache;
			function debug(...args) {
				if (!debug.enabled) return;
				const self = debug;
				const curr = Number(/* @__PURE__ */ new Date());
				self.diff = curr - (prevTime || curr);
				self.prev = prevTime;
				self.curr = curr;
				prevTime = curr;
				args[0] = createDebug.coerce(args[0]);
				if (typeof args[0] !== "string") args.unshift("%O");
				let index = 0;
				args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
					if (match === "%%") return "%";
					index++;
					const formatter = createDebug.formatters[format];
					if (typeof formatter === "function") {
						const val = args[index];
						match = formatter.call(self, val);
						args.splice(index, 1);
						index--;
					}
					return match;
				});
				createDebug.formatArgs.call(self, args);
				(self.log || createDebug.log).apply(self, args);
			}
			debug.namespace = namespace;
			debug.useColors = createDebug.useColors();
			debug.color = createDebug.selectColor(namespace);
			debug.extend = extend;
			debug.destroy = createDebug.destroy;
			Object.defineProperty(debug, "enabled", {
				enumerable: true,
				configurable: false,
				get: () => {
					if (enableOverride !== null) return enableOverride;
					if (namespacesCache !== createDebug.namespaces) {
						namespacesCache = createDebug.namespaces;
						enabledCache = createDebug.enabled(namespace);
					}
					return enabledCache;
				},
				set: (v) => {
					enableOverride = v;
				}
			});
			if (typeof createDebug.init === "function") createDebug.init(debug);
			return debug;
		}
		function extend(namespace, delimiter) {
			const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
			newDebug.log = this.log;
			return newDebug;
		}
		/**
		* Enables a debug mode by namespaces. This can include modes
		* separated by a colon and wildcards.
		*
		* @param {String} namespaces
		* @api public
		*/
		function enable(namespaces) {
			createDebug.save(namespaces);
			createDebug.namespaces = namespaces;
			createDebug.names = [];
			createDebug.skips = [];
			const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
			for (const ns of split) if (ns[0] === "-") createDebug.skips.push(ns.slice(1));
			else createDebug.names.push(ns);
		}
		/**
		* Checks if the given string matches a namespace template, honoring
		* asterisks as wildcards.
		*
		* @param {String} search
		* @param {String} template
		* @return {Boolean}
		*/
		function matchesTemplate(search, template) {
			let searchIndex = 0;
			let templateIndex = 0;
			let starIndex = -1;
			let matchIndex = 0;
			while (searchIndex < search.length) if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
				if (template[templateIndex] === "*") {
					starIndex = templateIndex;
					matchIndex = searchIndex;
					templateIndex++;
				} else {
					searchIndex++;
					templateIndex++;
				}
			} else if (starIndex !== -1) {
				templateIndex = starIndex + 1;
				matchIndex++;
				searchIndex = matchIndex;
			} else return false;
			while (templateIndex < template.length && template[templateIndex] === "*") templateIndex++;
			return templateIndex === template.length;
		}
		/**
		* Disable debug output.
		*
		* @return {String} namespaces
		* @api public
		*/
		function disable() {
			const namespaces = [...createDebug.names, ...createDebug.skips.map((namespace) => "-" + namespace)].join(",");
			createDebug.enable("");
			return namespaces;
		}
		/**
		* Returns true if the given mode name is enabled, false otherwise.
		*
		* @param {String} name
		* @return {Boolean}
		* @api public
		*/
		function enabled(name) {
			for (const skip of createDebug.skips) if (matchesTemplate(name, skip)) return false;
			for (const ns of createDebug.names) if (matchesTemplate(name, ns)) return true;
			return false;
		}
		/**
		* Coerce `val`.
		*
		* @param {Mixed} val
		* @return {Mixed}
		* @api private
		*/
		function coerce(val) {
			if (val instanceof Error) return val.stack || val.message;
			return val;
		}
		/**
		* XXX DO NOT USE. This is a temporary stub function.
		* XXX It WILL be removed in the next major release.
		*/
		function destroy() {
			console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
		}
		createDebug.enable(createDebug.load());
		return createDebug;
	}
	module.exports = setup;
}));
var require_browser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This is the web browser implementation of `debug()`.
	*/
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.storage = localstorage();
	exports.destroy = (() => {
		let warned = false;
		return () => {
			if (!warned) {
				warned = true;
				console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
			}
		};
	})();
	/**
	* Colors.
	*/
	exports.colors = [
		"#0000CC",
		"#0000FF",
		"#0033CC",
		"#0033FF",
		"#0066CC",
		"#0066FF",
		"#0099CC",
		"#0099FF",
		"#00CC00",
		"#00CC33",
		"#00CC66",
		"#00CC99",
		"#00CCCC",
		"#00CCFF",
		"#3300CC",
		"#3300FF",
		"#3333CC",
		"#3333FF",
		"#3366CC",
		"#3366FF",
		"#3399CC",
		"#3399FF",
		"#33CC00",
		"#33CC33",
		"#33CC66",
		"#33CC99",
		"#33CCCC",
		"#33CCFF",
		"#6600CC",
		"#6600FF",
		"#6633CC",
		"#6633FF",
		"#66CC00",
		"#66CC33",
		"#9900CC",
		"#9900FF",
		"#9933CC",
		"#9933FF",
		"#99CC00",
		"#99CC33",
		"#CC0000",
		"#CC0033",
		"#CC0066",
		"#CC0099",
		"#CC00CC",
		"#CC00FF",
		"#CC3300",
		"#CC3333",
		"#CC3366",
		"#CC3399",
		"#CC33CC",
		"#CC33FF",
		"#CC6600",
		"#CC6633",
		"#CC9900",
		"#CC9933",
		"#CCCC00",
		"#CCCC33",
		"#FF0000",
		"#FF0033",
		"#FF0066",
		"#FF0099",
		"#FF00CC",
		"#FF00FF",
		"#FF3300",
		"#FF3333",
		"#FF3366",
		"#FF3399",
		"#FF33CC",
		"#FF33FF",
		"#FF6600",
		"#FF6633",
		"#FF9900",
		"#FF9933",
		"#FFCC00",
		"#FFCC33"
	];
	/**
	* Currently only WebKit-based Web Inspectors, Firefox >= v31,
	* and the Firebug extension (any Firefox version) are known
	* to support "%c" CSS customizations.
	*
	* TODO: add a `localStorage` variable to explicitly enable/disable colors
	*/
	function useColors() {
		if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) return true;
		if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) return false;
		let m;
		return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
	}
	/**
	* Colorize log arguments if enabled.
	*
	* @api public
	*/
	function formatArgs(args) {
		args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
		if (!this.useColors) return;
		const c = "color: " + this.color;
		args.splice(1, 0, c, "color: inherit");
		let index = 0;
		let lastC = 0;
		args[0].replace(/%[a-zA-Z%]/g, (match) => {
			if (match === "%%") return;
			index++;
			if (match === "%c") lastC = index;
		});
		args.splice(lastC, 0, c);
	}
	/**
	* Invokes `console.debug()` when available.
	* No-op when `console.debug` is not a "function".
	* If `console.debug` is not available, falls back
	* to `console.log`.
	*
	* @api public
	*/
	exports.log = console.debug || console.log || (() => {});
	/**
	* Save `namespaces`.
	*
	* @param {String} namespaces
	* @api private
	*/
	function save(namespaces) {
		try {
			if (namespaces) exports.storage.setItem("debug", namespaces);
			else exports.storage.removeItem("debug");
		} catch (error) {}
	}
	/**
	* Load `namespaces`.
	*
	* @return {String} returns the previously persisted debug modes
	* @api private
	*/
	function load() {
		let r;
		try {
			r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
		} catch (error) {}
		if (!r && typeof process !== "undefined" && "env" in process) r = process.env.DEBUG;
		return r;
	}
	/**
	* Localstorage attempts to return the localstorage.
	*
	* This is necessary because safari throws
	* when a user disables cookies/localstorage
	* and you attempt to access it.
	*
	* @return {LocalStorage}
	* @api private
	*/
	function localstorage() {
		try {
			return localStorage;
		} catch (error) {}
	}
	module.exports = require_common()(exports);
	var { formatters } = module.exports;
	/**
	* Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
	*/
	formatters.j = function(v) {
		try {
			return JSON.stringify(v);
		} catch (error) {
			return "[UnexpectedJSONParseError]: " + error.message;
		}
	};
}));
var require_node = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module dependencies.
	*/
	var tty = __require("tty");
	var util = __require("util");
	/**
	* This is the Node.js implementation of `debug()`.
	*/
	exports.init = init;
	exports.log = log;
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.destroy = util.deprecate(() => {}, "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
	/**
	* Colors.
	*/
	exports.colors = [
		6,
		2,
		3,
		4,
		5,
		1
	];
	try {
		const supportsColor = __require("supports-color");
		if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) exports.colors = [
			20,
			21,
			26,
			27,
			32,
			33,
			38,
			39,
			40,
			41,
			42,
			43,
			44,
			45,
			56,
			57,
			62,
			63,
			68,
			69,
			74,
			75,
			76,
			77,
			78,
			79,
			80,
			81,
			92,
			93,
			98,
			99,
			112,
			113,
			128,
			129,
			134,
			135,
			148,
			149,
			160,
			161,
			162,
			163,
			164,
			165,
			166,
			167,
			168,
			169,
			170,
			171,
			172,
			173,
			178,
			179,
			184,
			185,
			196,
			197,
			198,
			199,
			200,
			201,
			202,
			203,
			204,
			205,
			206,
			207,
			208,
			209,
			214,
			215,
			220,
			221
		];
	} catch (error) {}
	/**
	* Build up the default `inspectOpts` object from the environment variables.
	*
	*   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
	*/
	exports.inspectOpts = Object.keys(process.env).filter((key) => {
		return /^debug_/i.test(key);
	}).reduce((obj, key) => {
		const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
			return k.toUpperCase();
		});
		let val = process.env[key];
		if (/^(yes|on|true|enabled)$/i.test(val)) val = true;
		else if (/^(no|off|false|disabled)$/i.test(val)) val = false;
		else if (val === "null") val = null;
		else val = Number(val);
		obj[prop] = val;
		return obj;
	}, {});
	/**
	* Is stdout a TTY? Colored output is enabled when `true`.
	*/
	function useColors() {
		return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(process.stderr.fd);
	}
	/**
	* Adds ANSI color escape codes if enabled.
	*
	* @api public
	*/
	function formatArgs(args) {
		const { namespace: name, useColors } = this;
		if (useColors) {
			const c = this.color;
			const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
			const prefix = `  ${colorCode};1m${name} \u001B[0m`;
			args[0] = prefix + args[0].split("\n").join("\n" + prefix);
			args.push(colorCode + "m+" + module.exports.humanize(this.diff) + "\x1B[0m");
		} else args[0] = getDate() + name + " " + args[0];
	}
	function getDate() {
		if (exports.inspectOpts.hideDate) return "";
		return (/* @__PURE__ */ new Date()).toISOString() + " ";
	}
	/**
	* Invokes `util.formatWithOptions()` with the specified arguments and writes to stderr.
	*/
	function log(...args) {
		return process.stderr.write(util.formatWithOptions(exports.inspectOpts, ...args) + "\n");
	}
	/**
	* Save `namespaces`.
	*
	* @param {String} namespaces
	* @api private
	*/
	function save(namespaces) {
		if (namespaces) process.env.DEBUG = namespaces;
		else delete process.env.DEBUG;
	}
	/**
	* Load `namespaces`.
	*
	* @return {String} returns the previously persisted debug modes
	* @api private
	*/
	function load() {
		return process.env.DEBUG;
	}
	/**
	* Init logic for `debug` instances.
	*
	* Create a new `inspectOpts` object in case `useColors` is set
	* differently for a particular `debug` instance.
	*/
	function init(debug) {
		debug.inspectOpts = {};
		const keys = Object.keys(exports.inspectOpts);
		for (let i = 0; i < keys.length; i++) debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
	}
	module.exports = require_common()(exports);
	var { formatters } = module.exports;
	/**
	* Map %o to `util.inspect()`, all on a single line.
	*/
	formatters.o = function(v) {
		this.inspectOpts.colors = this.useColors;
		return util.inspect(v, this.inspectOpts).split("\n").map((str) => str.trim()).join(" ");
	};
	/**
	* Map %O to `util.inspect()`, allowing multiple lines if needed.
	*/
	formatters.O = function(v) {
		this.inspectOpts.colors = this.useColors;
		return util.inspect(v, this.inspectOpts);
	};
}));
var require_src = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Detect Electron renderer / nwjs process, which is node, but we should
	* treat as a browser.
	*/
	if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) module.exports = require_browser();
	else module.exports = require_node();
}));
/**
* Constructs a successful append result.
*/
function ok(value) {
	return {
		ok: true,
		value
	};
}
/**
* Constructs a failed append result.
*/
function err(error) {
	return {
		ok: false,
		error
	};
}
/**
* Constructs a successful close result.
*/
function okClose() {
	return { ok: true };
}
/**
* Constructs a failed close result.
*/
function errClose(error) {
	return {
		ok: false,
		error
	};
}
var BatchSubmitTicket = class {
	promise;
	bytes;
	numRecords;
	constructor(promise, bytes, numRecords) {
		this.promise = promise;
		this.bytes = bytes;
		this.numRecords = numRecords;
	}
	/**
	* Returns a promise that resolves with the AppendAck once the batch is durable.
	*/
	ack() {
		return this.promise;
	}
};
var import_src = /* @__PURE__ */ __toESM(require_src(), 1);
var debugWith = (0, import_src.default)("s2:retry:with");
var debugRead = (0, import_src.default)("s2:retry:read");
var debugSession = (0, import_src.default)("s2:retry:session");
/** Type guard for errors with a code property (e.g., Node.js errors). */
function hasErrorCode(err, code) {
	return typeof err === "object" && err !== null && "code" in err && err.code === code;
}
/**
* Convert generated StreamPosition to SDK StreamPosition.
*/
function toSDKStreamPosition$1(pos) {
	return {
		seqNum: pos.seq_num,
		timestamp: new Date(pos.timestamp)
	};
}
/**
* Convert internal ReadRecord to SDK ReadRecord.
* Headers are always an array of tuples from both S2S and fetch transports.
*/
function toSDKReadRecord(record, format) {
	return {
		seqNum: record.seq_num,
		timestamp: new Date(record.timestamp),
		body: record.body ?? (format === "string" ? "" : /* @__PURE__ */ new Uint8Array()),
		headers: record.headers ?? []
	};
}
/**
* Default retry configuration.
*/
var DEFAULT_RETRY_CONFIG = {
	maxAttempts: 3,
	minBaseDelayMillis: 100,
	maxBaseDelayMillis: 1e3,
	appendRetryPolicy: "all",
	requestTimeoutMillis: 5e3,
	connectionTimeoutMillis: 3e3
};
var RETRYABLE_STATUS_CODES = /* @__PURE__ */ new Set([
	408,
	429,
	500,
	502,
	503,
	504
]);
/**
* Determines if an error should be retried based on its characteristics.
* 400-level errors (except 408, 429) are non-retryable validation/client errors.
*/
function isRetryable(error) {
	if (!error.status) return false;
	if (RETRYABLE_STATUS_CODES.has(error.status)) return true;
	if (error.status === 409 && error.code === "transaction_conflict") return true;
	if (error.status >= 400 && error.status < 500) return false;
	return false;
}
/**
* Calculates the delay before the next retry attempt using exponential backoff
* with additive jitter.
*
* Formula:
*   baseDelay = min(minBaseDelayMillis * 2^attempt, maxBaseDelayMillis)
*   jitter = random(0, baseDelay)
*   delay = baseDelay + jitter
*
* @param attempt - Zero-based retry attempt number (0 = first retry)
* @param minBaseDelayMillis - Minimum delay for exponential backoff
* @param maxBaseDelayMillis - Maximum base delay (actual delay can be up to 2x with jitter)
*/
function calculateDelay(attempt, minBaseDelayMillis, maxBaseDelayMillis) {
	const baseDelay = Math.min(minBaseDelayMillis * Math.pow(2, attempt), maxBaseDelayMillis);
	const jitter = Math.random() * baseDelay;
	return Math.floor(baseDelay + jitter);
}
/**
* Sleeps for the specified duration.
*/
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
* Executes an async function with automatic retry logic for transient failures.
*
* @param retryConfig Retry configuration (max attempts, backoff duration)
* @param fn The async function to execute
* @returns The result of the function
* @throws The last error if all retry attempts are exhausted
*/
async function withRetries(retryConfig, fn, isPolicyCompliant = () => true) {
	const config = {
		...DEFAULT_RETRY_CONFIG,
		...retryConfig
	};
	if (config.maxAttempts < 1) config.maxAttempts = 1;
	let lastError = void 0;
	for (let attemptNo = 1; attemptNo <= config.maxAttempts; attemptNo++) try {
		const result = await fn();
		if (attemptNo > 1) debugWith("succeeded after %d retries", attemptNo - 1);
		return result;
	} catch (error) {
		if (!(error instanceof S2Error)) {
			debugWith("non-S2Error thrown, rethrowing immediately: %s", error);
			throw error;
		}
		lastError = error;
		if (attemptNo === config.maxAttempts) {
			debugWith("max attempts exhausted, throwing error");
			break;
		}
		if (!isPolicyCompliant(config, lastError) || !isRetryable(lastError)) {
			debugWith("error not retryable, throwing immediately");
			throw error;
		}
		const delay = calculateDelay(attemptNo - 1, config.minBaseDelayMillis, config.maxBaseDelayMillis);
		debugWith("retryable error, backing off for %dms, status=%s", delay, error.status);
		await sleep(delay);
	}
	throw lastError;
}
var RetryReadSession = class RetryReadSession extends ReadableStream {
	_nextReadPosition = void 0;
	_lastObservedTail = void 0;
	_lastTailAtMs = void 0;
	_recordsRead = 0;
	_bytesRead = 0;
	static async create(generator, args = {}, config) {
		const retryConfig = {
			...DEFAULT_RETRY_CONFIG,
			...config
		};
		let attempt = 0;
		let lastError;
		while (true) try {
			const session = await generator(args);
			return new RetryReadSession(args, generator, config, session);
		} catch (err) {
			const error = s2Error(err);
			lastError = error;
			const effectiveMax = Math.max(1, retryConfig.maxAttempts);
			if (isRetryable(error) && attempt < effectiveMax - 1) {
				const delay = calculateDelay(attempt, retryConfig.minBaseDelayMillis, retryConfig.maxBaseDelayMillis);
				debugRead("connection error in create, will retry after %dms, status=%s", delay, error.status);
				await sleep(delay);
				attempt++;
				continue;
			}
			throw lastError;
		}
	}
	constructor(args, generator, config, initialSession) {
		const retryConfig = {
			...DEFAULT_RETRY_CONFIG,
			...config
		};
		const format = args?.as ?? "string";
		let session = initialSession;
		let cancelled = false;
		super({
			start: async (controller) => {
				let nextArgs = { ...args };
				const baselineCount = args?.count;
				const baselineBytes = args?.bytes;
				const baselineWait = args?.wait;
				let attempt = 0;
				while (true) {
					if (cancelled) return;
					if (!session) {
						debugRead("starting read session with args: %o", nextArgs);
						try {
							session = await generator(nextArgs);
							if (cancelled) {
								try {
									await session.cancel?.("cancelled");
								} catch {}
								return;
							}
						} catch (err) {
							const error = s2Error(err);
							const effectiveMax = Math.max(1, retryConfig.maxAttempts);
							if (isRetryable(error) && attempt < effectiveMax - 1) {
								const delay = calculateDelay(attempt, retryConfig.minBaseDelayMillis, retryConfig.maxBaseDelayMillis);
								debugRead("connection error, will retry after %dms, status=%s", delay, error.status);
								await sleep(delay);
								if (cancelled) return;
								attempt++;
								continue;
							}
							debugRead("connection error not retryable: %s", error);
							controller.error(error);
							return;
						}
					}
					const reader = session.getReader();
					while (true) {
						const { done, value: result } = await reader.read();
						try {
							const tail = session.lastObservedTail?.();
							if (tail) {
								this._lastObservedTail = tail;
								this._lastTailAtMs = performance.now();
							}
						} catch {}
						if (done) {
							reader.releaseLock();
							controller.close();
							return;
						}
						if (!result.ok) {
							reader.releaseLock();
							const error = result.error;
							const effectiveMax = Math.max(1, retryConfig.maxAttempts);
							if (isRetryable(error) && attempt < effectiveMax - 1) {
								if (this._nextReadPosition) {
									nextArgs.seq_num = this._nextReadPosition.seq_num;
									delete nextArgs.timestamp;
									delete nextArgs.tail_offset;
								}
								const delay = calculateDelay(attempt, retryConfig.minBaseDelayMillis, retryConfig.maxBaseDelayMillis);
								if (baselineCount !== void 0) nextArgs.count = Math.max(0, baselineCount - this._recordsRead);
								if (baselineBytes !== void 0) nextArgs.bytes = Math.max(0, baselineBytes - this._bytesRead);
								if (baselineWait !== void 0) {
									if (this._lastTailAtMs !== void 0) {
										const elapsedSeconds = (performance.now() - this._lastTailAtMs) / 1e3;
										nextArgs.wait = Math.max(0, Math.floor(baselineWait - (elapsedSeconds + delay / 1e3)));
									} else nextArgs.wait = baselineWait;
								}
								try {
									await session.cancel?.("retry");
								} catch {}
								session = void 0;
								debugRead("will retry after %dms, status=%s", delay, error.status);
								await sleep(delay);
								if (cancelled) return;
								attempt++;
								break;
							}
							debugRead("error in retry loop: %s", error);
							controller.error(error);
							return;
						}
						const record = result.value;
						this._nextReadPosition = {
							seq_num: record.seq_num + 1,
							timestamp: record.timestamp
						};
						this._recordsRead++;
						this._bytesRead += meteredBytes(record);
						attempt = 0;
						if (args?.ignore_command_records && isCommandRecord(record)) continue;
						controller.enqueue(toSDKReadRecord(record, format));
					}
				}
			},
			cancel: async (reason) => {
				cancelled = true;
				try {
					await session?.cancel(reason);
				} catch (err) {
					if (!hasErrorCode(err, "ERR_INVALID_STATE")) throw err;
				}
			}
		});
	}
	async [Symbol.asyncDispose]() {
		await this.cancel("disposed");
	}
	[Symbol.asyncIterator]() {
		const fn = ReadableStream.prototype[Symbol.asyncIterator];
		if (typeof fn === "function") try {
			return fn.call(this);
		} catch {}
		const reader = this.getReader();
		return {
			next: async () => {
				const r = await reader.read();
				if (r.done) {
					reader.releaseLock();
					return {
						done: true,
						value: void 0
					};
				}
				return {
					done: false,
					value: r.value
				};
			},
			throw: async (e) => {
				try {
					await reader.cancel(e);
				} catch (err) {
					if (!hasErrorCode(err, "ERR_INVALID_STATE")) throw err;
				}
				reader.releaseLock();
				return {
					done: true,
					value: void 0
				};
			},
			return: async () => {
				try {
					await reader.cancel("done");
				} catch (err) {
					if (!hasErrorCode(err, "ERR_INVALID_STATE")) throw err;
				}
				reader.releaseLock();
				return {
					done: true,
					value: void 0
				};
			},
			[Symbol.asyncIterator]() {
				return this;
			}
		};
	}
	lastObservedTail() {
		return this._lastObservedTail ? toSDKStreamPosition$1(this._lastObservedTail) : void 0;
	}
	nextReadPosition() {
		return this._nextReadPosition ? toSDKStreamPosition$1(this._nextReadPosition) : void 0;
	}
};
var MIN_MAX_INFLIGHT_BYTES = 1048576;
var DEFAULT_MAX_INFLIGHT_BYTES = 3145728;
var RetryAppendSession = class RetryAppendSession {
	generator;
	sessionOptions;
	requestTimeoutMillis;
	maxQueuedBytes;
	maxInflightBatches;
	retryConfig;
	inflight = [];
	capacityWaiters = [];
	session;
	queuedBytes = 0;
	pendingBytes = 0;
	pendingBatches = 0;
	consecutiveFailures = 0;
	currentAttempt = 0;
	pumpPromise;
	pumpStopped = false;
	closing = false;
	pumpWakeup;
	closed = false;
	fatalError;
	_lastAckedPosition;
	acksController;
	readable;
	writable;
	streamName;
	/**
	* If the session has failed, returns the original fatal error that caused
	* the pump to stop. Returns undefined when the session has not failed.
	*/
	failureCause() {
		return this.fatalError;
	}
	constructor(generator, sessionOptions, config, streamName) {
		this.generator = generator;
		this.sessionOptions = sessionOptions;
		this.streamName = streamName ?? "unknown";
		this.retryConfig = {
			...DEFAULT_RETRY_CONFIG,
			...config
		};
		this.requestTimeoutMillis = this.retryConfig.requestTimeoutMillis;
		const configuredBytes = this.sessionOptions?.maxInflightBytes ?? DEFAULT_MAX_INFLIGHT_BYTES;
		if (!Number.isFinite(configuredBytes) || configuredBytes < MIN_MAX_INFLIGHT_BYTES) throw new S2Error({
			message: `maxInflightBytes must be a finite number at least 1 MiB (${MIN_MAX_INFLIGHT_BYTES} bytes), got ${configuredBytes}`,
			origin: "sdk"
		});
		this.maxQueuedBytes = configuredBytes;
		this.maxInflightBatches = this.sessionOptions?.maxInflightBatches !== void 0 ? Math.max(1, this.sessionOptions.maxInflightBatches) : void 0;
		this.readable = new ReadableStream({
			start: (controller) => {
				this.acksController = controller;
			},
			cancel: async (reason) => {
				const error = abortedError(`AppendSession acks cancelled: ${reason}`);
				await this.abort(error);
			}
		});
		this.writable = new WritableStream({
			write: async (chunk) => {
				if (this.closed || this.closing) throw new S2Error({ message: "AppendSession is closed" });
				(await this.submit(chunk)).ack().catch(() => {});
			},
			close: async () => {
				await this.close();
			},
			abort: async (reason) => {
				const error = abortedError(`AppendSession aborted: ${reason}`);
				await this.abort(error);
			}
		});
	}
	static async create(generator, sessionOptions, config, streamName) {
		return new RetryAppendSession(generator, sessionOptions, config, streamName);
	}
	/**
	* Wait for capacity to be available for the given batch size.
	* Call this before submit() to apply backpressure based on maxInflightBatches/maxInflightBytes.
	*
	* @param bytes - Size in bytes (use meteredBytes() to calculate)
	* @param numBatches - Number of batches (default: 1)
	* @returns Promise that resolves when capacity is available
	*/
	async waitForCapacity(bytes, numBatches = 1) {
		debugSession("[%s] [CAPACITY] checking for %d bytes, %d batches: queuedBytes=%d, pendingBytes=%d, maxQueuedBytes=%d, inflight=%d, pendingBatches=%d, maxInflightBatches=%s", this.streamName, bytes, numBatches, this.queuedBytes, this.pendingBytes, this.maxQueuedBytes, this.inflight.length, this.pendingBatches, this.maxInflightBatches ?? "unlimited");
		while (true) {
			if (this.fatalError) {
				debugSession("[%s] [CAPACITY] fatal error detected, rejecting: %s", this.streamName, this.fatalError.message);
				throw this.fatalError;
			}
			if (this.closing || this.closed) throw new S2Error({ message: "AppendSession is closed" });
			if (this.queuedBytes + this.pendingBytes + bytes <= this.maxQueuedBytes) {
				if (this.maxInflightBatches === void 0 || this.inflight.length + this.pendingBatches + numBatches <= this.maxInflightBatches) {
					debugSession("[%s] [CAPACITY] capacity available, adding %d to pendingBytes and %d to pendingBatches", this.streamName, bytes, numBatches);
					this.pendingBytes += bytes;
					this.pendingBatches += numBatches;
					return;
				}
			}
			debugSession("[%s] [CAPACITY] no capacity, waiting for release", this.streamName);
			await new Promise((resolve) => {
				this.capacityWaiters.push({
					resolve,
					bytes,
					batches: numBatches
				});
			});
			debugSession("[%s] [CAPACITY] woke up, rechecking", this.streamName);
		}
	}
	/**
	* Submit an append request.
	* Returns a promise that resolves to a submit ticket once the batch is enqueued (has capacity).
	* The ticket's ack() can be awaited to get the AppendAck once the batch is durable.
	* This method applies backpressure and will block if capacity limits are reached.
	*/
	async submit(input) {
		if (this.closed || this.closing) return Promise.reject(new S2Error({ message: "AppendSession is closed" }));
		const batchMeteredSize = input.meteredBytes;
		this.ensurePump();
		await this.waitForCapacity(batchMeteredSize, 1);
		this.pendingBytes = Math.max(0, this.pendingBytes - batchMeteredSize);
		this.pendingBatches = Math.max(0, this.pendingBatches - 1);
		const innerPromise = this.submitInternal(input, batchMeteredSize).then((result) => {
			if (result.ok) return result.value;
			else throw result.error;
		});
		innerPromise.catch(() => {});
		return new BatchSubmitTicket(innerPromise, batchMeteredSize, input.records.length);
	}
	/**
	* Internal submit that returns discriminated union.
	* Creates inflight entry and starts pump if needed.
	*/
	submitInternal(input, batchMeteredSize) {
		if (this.fatalError) {
			debugSession("[%s] [SUBMIT] rejecting due to fatal error: %s", this.streamName, this.fatalError.message);
			return Promise.resolve(err(this.fatalError));
		}
		return new Promise((resolve) => {
			const entry = {
				input,
				expectedCount: input.records.length,
				innerPromise: new Promise(() => {}),
				maybeResolve: resolve,
				needsSubmit: true
			};
			debugSession("[%s] [SUBMIT] enqueueing %d records (%d bytes), match_seq_num=%s: inflight=%d->%d, queuedBytes=%d->%d", this.streamName, input.records.length, batchMeteredSize, input.matchSeqNum ?? "none", this.inflight.length, this.inflight.length + 1, this.queuedBytes, this.queuedBytes + batchMeteredSize);
			this.inflight.push(entry);
			this.queuedBytes += batchMeteredSize;
			if (this.pumpWakeup) this.pumpWakeup();
			this.ensurePump();
		});
	}
	/**
	* Release capacity and wake waiter if present.
	*/
	releaseCapacity(bytes) {
		debugSession("[%s] [CAPACITY] releasing %d bytes: queuedBytes=%d->%d, pendingBytes=%d, pendingBatches=%d, numWaiters=%d", this.streamName, bytes, this.queuedBytes, this.queuedBytes - bytes, this.pendingBytes, this.pendingBatches, this.capacityWaiters.length);
		this.queuedBytes -= bytes;
		this.wakeCapacityWaiters();
	}
	wakeCapacityWaiters() {
		if (this.capacityWaiters.length === 0) return;
		let availableBytes = Math.max(0, this.maxQueuedBytes - (this.queuedBytes + this.pendingBytes));
		let availableBatches = this.maxInflightBatches === void 0 ? Number.POSITIVE_INFINITY : Math.max(0, this.maxInflightBatches - (this.inflight.length + this.pendingBatches));
		while (this.capacityWaiters.length > 0) {
			const next = this.capacityWaiters[0];
			const needsBytes = next.bytes;
			const needsBatches = next.batches;
			const hasBatchCapacity = this.maxInflightBatches === void 0 || needsBatches <= availableBatches;
			if (needsBytes <= availableBytes && hasBatchCapacity) {
				this.capacityWaiters.shift();
				availableBytes -= needsBytes;
				if (this.maxInflightBatches !== void 0) availableBatches -= needsBatches;
				debugSession("[%s] [CAPACITY] waking waiter (bytes=%d, batches=%d)", this.streamName, needsBytes, needsBatches);
				next.resolve();
				continue;
			}
			break;
		}
	}
	/**
	* Ensure pump loop is running.
	*/
	ensurePump() {
		if (this.pumpPromise || this.pumpStopped) return;
		this.pumpPromise = this.runPump().catch((e) => {
			debugSession("[%s] pump crashed unexpectedly: %s", this.streamName, e);
		});
	}
	/**
	* Main pump loop: processes inflight queue, handles acks, retries, and recovery.
	*/
	async runPump() {
		debugSession("[%s] pump started", this.streamName);
		while (true) {
			debugSession("[%s] [PUMP] loop: inflight=%d, queuedBytes=%d, pendingBytes=%d, pendingBatches=%d, closing=%s, pumpStopped=%s", this.streamName, this.inflight.length, this.queuedBytes, this.pendingBytes, this.pendingBatches, this.closing, this.pumpStopped);
			if (this.pumpStopped) {
				debugSession("[%s] [PUMP] stopped by flag", this.streamName);
				return;
			}
			if (this.closing && this.inflight.length === 0 && this.capacityWaiters.length === 0) {
				debugSession("[%s] [PUMP] closing and queue empty, stopping", this.streamName);
				this.pumpStopped = true;
				return;
			}
			if (this.inflight.length === 0) {
				debugSession("[%s] [PUMP] no entries, parking until wakeup", this.streamName);
				await new Promise((resolve) => {
					this.pumpWakeup = resolve;
				});
				this.pumpWakeup = void 0;
				continue;
			}
			const head = this.inflight[0];
			debugSession("[%s] [PUMP] processing head: expectedCount=%d, meteredBytes=%d, match_seq_num=%s", this.streamName, head.expectedCount, head.input.meteredBytes, head.input.matchSeqNum ?? "none");
			debugSession("[%s] [PUMP] ensuring session exists", this.streamName);
			await this.ensureSession();
			if (this.pumpStopped) {
				debugSession("[%s] [PUMP] stopped after ensureSession", this.streamName);
				return;
			}
			if (!this.session) {
				const effectiveMax = Math.max(1, this.retryConfig.maxAttempts);
				const allowedRetries = effectiveMax - 1;
				if (this.currentAttempt >= allowedRetries) {
					debugSession("[%s] [PUMP] session creation failed, max attempts reached (%d), aborting", this.streamName, effectiveMax);
					const wrappedError = new S2Error({
						message: `Max attempts (${effectiveMax}) exhausted: connection failed`,
						status: 502,
						code: "connection_failed"
					});
					await this.abort(wrappedError);
					return;
				}
				this.consecutiveFailures++;
				this.currentAttempt++;
				const delay = calculateDelay(this.consecutiveFailures - 1, this.retryConfig.minBaseDelayMillis, this.retryConfig.maxBaseDelayMillis);
				debugSession("[%s] [PUMP] session creation failed, backing off for %dms (retry %d/%d)", this.streamName, delay, this.currentAttempt, allowedRetries);
				await sleep(delay);
				continue;
			}
			for (const entry of this.inflight) if (!entry.innerPromise || entry.needsSubmit) {
				debugSession("[%s] [PUMP] submitting entry to inner session (%d records, %d bytes, match_seq_num=%s)", this.streamName, entry.expectedCount, entry.input.meteredBytes, entry.input.matchSeqNum ?? "none");
				entry.attemptStartedMonotonicMs = performance.now();
				entry.innerPromise = this.session.submit(entry.input);
				delete entry.needsSubmit;
			}
			debugSession("[%s] [PUMP] waiting for head result", this.streamName);
			const result = await this.waitForHead(head);
			debugSession("[%s] [PUMP] got result: kind=%s", this.streamName, result.kind);
			let appendResult;
			if (result.kind === "timeout") {
				const error = new S2Error({
					message: `Request timeout after ${(head.attemptStartedMonotonicMs != null ? Math.round(performance.now() - head.attemptStartedMonotonicMs) : void 0) ?? "unknown"}ms (${head.expectedCount} records, ${head.input.meteredBytes} bytes)`,
					status: 408,
					code: "REQUEST_TIMEOUT",
					origin: "sdk"
				});
				debugSession("[%s] ack timeout for head entry: %s", this.streamName, error.message);
				appendResult = err(error);
			} else appendResult = result.value;
			if (appendResult.ok) {
				const ack = appendResult.value;
				debugSession("[%s] [PUMP] success, got ack: seq_num=%d-%d", this.streamName, ack.start.seqNum, ack.end.seqNum);
				const ackCount = ack.end.seqNum - ack.start.seqNum;
				if (ackCount !== head.expectedCount) {
					const error = invariantViolation(`Ack count mismatch: expected ${head.expectedCount}, got ${ackCount}`);
					debugSession("[%s] invariant violation: %s", this.streamName, error.message);
					await this.abort(error);
					return;
				}
				if (this._lastAckedPosition) {
					const prevEnd = this._lastAckedPosition.end.seqNum;
					const currentEnd = ack.end.seqNum;
					if (currentEnd <= prevEnd) {
						const error = invariantViolation(`Sequence number not strictly increasing: previous=${prevEnd}, current=${currentEnd}`);
						debugSession("[%s] invariant violation: %s", this.streamName, error.message);
						await this.abort(error);
						return;
					}
				}
				this._lastAckedPosition = ack;
				if (head.maybeResolve) head.maybeResolve(ok(ack));
				try {
					this.acksController?.enqueue(ack);
				} catch (e) {
					debugSession("[%s] failed to enqueue ack: %s", this.streamName, e);
				}
				debugSession("[%s] [PUMP] removing head from inflight, releasing %d bytes", this.streamName, head.input.meteredBytes);
				this.inflight.shift();
				this.releaseCapacity(head.input.meteredBytes);
				this.consecutiveFailures = 0;
				this.currentAttempt = 0;
			} else {
				const error = appendResult.error;
				debugSession("[%s] [PUMP] error: status=%s, message=%s", this.streamName, error.status, error.message);
				if (!isRetryable(error)) {
					debugSession("[%s] error not retryable, aborting", this.streamName);
					await this.abort(error);
					return;
				}
				if (this.retryConfig.appendRetryPolicy === "noSideEffects" && !error.hasNoSideEffects() && (this.session?.effectSignalled() ?? true)) {
					debugSession("[%s] error not policy-compliant (noSideEffects), aborting", this.streamName);
					await this.abort(error);
					return;
				}
				if (this.retryConfig.appendRetryPolicy === "noSideEffects") {
					if (this.inflight.some((entry, index) => index > 0 && !entry.needsSubmit && entry.input.matchSeqNum === void 0)) {
						debugSession("[%s] non-idempotent pipelined entries already sent, aborting under noSideEffects", this.streamName);
						await this.abort(error);
						return;
					}
				}
				const effectiveMax = Math.max(1, this.retryConfig.maxAttempts);
				const allowedRetries = effectiveMax - 1;
				if (this.currentAttempt >= allowedRetries) {
					debugSession("[%s] max attempts reached (%d), aborting", this.streamName, effectiveMax);
					const wrappedError = new S2Error({
						message: `Max attempts (${effectiveMax}) exhausted: ${error.message}`,
						status: error.status,
						code: error.code
					});
					await this.abort(wrappedError);
					return;
				}
				this.consecutiveFailures++;
				this.currentAttempt++;
				debugSession("[%s] performing recovery (retry %d/%d)", this.streamName, this.currentAttempt, allowedRetries);
				await this.recover();
			}
		}
	}
	/**
	* Wait for head entry's innerPromise with timeout.
	* Returns either the settled result or a timeout indicator.
	*
	* Per-attempt ack timeout semantics:
	* - The deadline is computed from the current attempt's start time using a
	*   monotonic clock (performance.now) to avoid issues with wall clock adjustments.
	* - Each retry gets a fresh timeout window (attemptStartedMonotonicMs is reset
	*   during recovery).
	* - If attempt start is missing (for backward compatibility), we measure
	*   from "now" with the full timeout window.
	*/
	async waitForHead(head) {
		const deadline = (head.attemptStartedMonotonicMs ?? performance.now()) + this.requestTimeoutMillis;
		const remaining = Math.max(0, deadline - performance.now());
		let timer;
		const timeoutP = new Promise((resolve) => {
			timer = setTimeout(() => resolve({ kind: "timeout" }), remaining);
		});
		const settledP = head.innerPromise.then((result) => ({
			kind: "settled",
			value: result
		}));
		try {
			return await Promise.race([settledP, timeoutP]);
		} finally {
			if (timer) clearTimeout(timer);
		}
	}
	/**
	* Recover from transient error: recreate session and resubmit all inflight entries.
	*/
	async recover() {
		debugSession("[%s] starting recovery", this.streamName);
		const delay = calculateDelay(this.consecutiveFailures - 1, this.retryConfig.minBaseDelayMillis, this.retryConfig.maxBaseDelayMillis);
		debugSession("[%s] backing off for %dms", this.streamName, delay);
		await sleep(delay);
		if (this.pumpStopped) {
			debugSession("[%s] stopped during recovery backoff", this.streamName);
			return;
		}
		if (this.session) {
			try {
				const closeResult = await this.session.close();
				if (!closeResult.ok) debugSession("[%s] error closing old session during recovery: %s", this.streamName, closeResult.error.message);
			} catch (e) {
				debugSession("[%s] exception closing old session: %s", this.streamName, e);
			}
			this.session = void 0;
		}
		await this.ensureSession();
		if (this.pumpStopped) {
			debugSession("[%s] stopped after ensureSession in recovery", this.streamName);
			return;
		}
		if (!this.session) {
			debugSession("[%s] failed to create new session during recovery", this.streamName);
			return;
		}
		const session = this.session;
		debugSession("[%s] resubmitting %d inflight entries", this.streamName, this.inflight.length);
		for (const entry of this.inflight) {
			entry.innerPromise.catch(() => {});
			entry.attemptStartedMonotonicMs = performance.now();
			entry.innerPromise = session.submit(entry.input);
			delete entry.needsSubmit;
			debugSession("[%s] resubmitted entry (%d records, %d bytes, match_seq_num=%s)", this.streamName, entry.expectedCount, entry.input.meteredBytes, entry.input.matchSeqNum ?? "none");
		}
		debugSession("[%s] recovery complete", this.streamName);
	}
	/**
	* Ensure session exists, creating it if necessary.
	*/
	async ensureSession() {
		if (this.session) return;
		try {
			debugSession("[%s] creating new transport session", this.streamName);
			this.session = await this.generator(this.sessionOptions);
			debugSession("[%s] transport session created", this.streamName);
		} catch (e) {
			const error = s2Error(e);
			debugSession("[%s] failed to create session: %s", this.streamName, error.message);
		}
	}
	/**
	* Abort the session with a fatal error.
	*/
	async abort(error) {
		if (this.pumpStopped) return;
		debugSession("[%s] aborting session: %s", this.streamName, error.message);
		this.fatalError = error;
		this.pumpStopped = true;
		if (this.pumpWakeup) this.pumpWakeup();
		debugSession("[%s] rejecting %d inflight entries", this.streamName, this.inflight.length);
		for (const entry of this.inflight) if (entry.maybeResolve) entry.maybeResolve(err(error));
		this.inflight.length = 0;
		this.queuedBytes = 0;
		this.pendingBytes = 0;
		this.pendingBatches = 0;
		try {
			this.acksController?.error(error);
		} catch (e) {
			debugSession("[%s] failed to error acks controller: %s", this.streamName, e);
		}
		for (const waiter of this.capacityWaiters) waiter.resolve();
		this.capacityWaiters = [];
		if (this.session) {
			debugSession("[%s] closing inner session", this.streamName);
			try {
				await this.session.close();
			} catch (e) {
				debugSession("[%s] error closing session during abort: %s", this.streamName, e);
			}
			this.session = void 0;
		}
	}
	/**
	* Close the append session.
	* Waits for all pending appends to complete before resolving.
	* Does not interrupt recovery - allows it to complete.
	*/
	async close() {
		if (this.closed) {
			if (this.fatalError) throw this.fatalError;
			return;
		}
		debugSession("[%s] close requested", this.streamName);
		this.closing = true;
		for (const waiter of this.capacityWaiters) waiter.resolve();
		this.capacityWaiters = [];
		if (this.pumpWakeup) this.pumpWakeup();
		if (this.pumpPromise) {
			debugSession("[%s] [CLOSE] awaiting pump to drain inflight queue", this.streamName);
			await this.pumpPromise;
		}
		if (this.session) {
			try {
				const result = await this.session.close();
				if (!result.ok) debugSession("[%s] error closing inner session: %s", this.streamName, result.error.message);
			} catch (e) {
				debugSession("[%s] exception closing inner session: %s", this.streamName, e);
			}
			this.session = void 0;
		}
		try {
			this.acksController?.close();
		} catch (e) {
			debugSession("[%s] error closing acks controller: %s", this.streamName, e);
		}
		this.closed = true;
		if (this.fatalError) throw this.fatalError;
		debugSession("[%s] close complete", this.streamName);
	}
	async [Symbol.asyncDispose]() {
		await this.close();
	}
	/**
	* Get a stream of acknowledgements for appends.
	*/
	acks() {
		return this.readable;
	}
	/**
	* Get the last acknowledged position.
	*/
	lastAckedPosition() {
		return this._lastAckedPosition;
	}
};
var debug$2 = (0, import_src.default)("s2:event-stream");
var EventStream = class extends ReadableStream {
	constructor(responseBody, parse) {
		const upstream = responseBody.getReader();
		let buffer = /* @__PURE__ */ new Uint8Array();
		const eventStreamId = Math.random().toString(36).slice(2);
		super({
			async pull(downstream) {
				try {
					while ((downstream.desiredSize ?? 0) > 0) {
						debug$2("pull loop, eventstream=%s", eventStreamId);
						const match = findBoundary(buffer);
						if (!match) {
							const chunk = await upstream.read();
							if (chunk.done) {
								if (buffer.length > 0) throw new S2Error({
									message: "SSE stream closed with incomplete data remaining",
									status: 502,
									code: "STREAM_CLOSED_PREMATURELY",
									origin: "sdk"
								});
								return downstream.close();
							}
							buffer = concatBuffer(buffer, chunk.value);
							continue;
						}
						const message = buffer.slice(0, match.index);
						buffer = buffer.slice(match.index + match.length);
						const item = parseMessage(message, parse);
						if (item) {
							if (item.batch) for (const chunk of item.value) downstream.enqueue(chunk);
							else if (item.value !== void 0) downstream.enqueue(item.value);
							else if (item.done) {
								await upstream.cancel("done");
								downstream.close();
								return;
							}
						}
					}
				} catch (e) {
					downstream.error(e);
					await upstream.cancel(e);
				}
			},
			cancel: (reason) => upstream.cancel(reason)
		});
	}
	async [Symbol.asyncDispose]() {
		await this.cancel("disposed");
	}
	[Symbol.asyncIterator]() {
		const fn = ReadableStream.prototype[Symbol.asyncIterator];
		if (typeof fn === "function") try {
			return fn.call(this);
		} catch {}
		const reader = this.getReader();
		return {
			next: async () => {
				const r = await reader.read();
				if (r.done) {
					reader.releaseLock();
					return {
						done: true,
						value: void 0
					};
				}
				return {
					done: false,
					value: r.value
				};
			},
			throw: async (e) => {
				try {
					await reader.cancel(e);
				} catch (err) {
					if (err?.code !== "ERR_INVALID_STATE") throw err;
				}
				reader.releaseLock();
				return {
					done: true,
					value: void 0
				};
			},
			return: async () => {
				try {
					await reader.cancel("done");
				} catch (err) {
					if (err?.code !== "ERR_INVALID_STATE") throw err;
				}
				reader.releaseLock();
				return {
					done: true,
					value: void 0
				};
			},
			[Symbol.asyncIterator]() {
				return this;
			}
		};
	}
};
function concatBuffer(a, b) {
	const c = new Uint8Array(a.length + b.length);
	c.set(a, 0);
	c.set(b, a.length);
	return c;
}
/**
* Finds the first pair of consecutive newline tokens in the buffer.
* A newline token is CRLF (\r\n), LF (\n), or CR (\r).
* A boundary is any two consecutive newline tokens, covering all
* combinations: \r\n\r\n, \r\n\r, \r\n\n, \r\r\n, \r\r, \n\r\n, \n\r, \n\n.
*/
function findBoundary(buf) {
	const len = buf.length;
	const CR = 13;
	const LF = 10;
	for (let i = 0; i < len; i++) {
		let firstLen;
		if (buf[i] === CR && i + 1 < len && buf[i + 1] === LF) firstLen = 2;
		else if (buf[i] === CR) firstLen = 1;
		else if (buf[i] === LF) firstLen = 1;
		else continue;
		const j = i + firstLen;
		if (j >= len) return null;
		let secondLen;
		if (buf[j] === CR && j + 1 < len && buf[j + 1] === LF) secondLen = 2;
		else if (buf[j] === CR) secondLen = 1;
		else if (buf[j] === LF) secondLen = 1;
		else continue;
		return {
			index: i,
			length: firstLen + secondLen
		};
	}
	return null;
}
function parseMessage(chunk, parse) {
	const lines = new TextDecoder().decode(chunk).split(/\r\n|\r|\n/);
	const dataLines = [];
	const ret = {};
	let ignore = true;
	for (const line of lines) {
		if (!line || line.startsWith(":")) continue;
		ignore = false;
		const i = line.indexOf(":");
		let field;
		let value;
		if (i === -1) {
			field = line;
			value = "";
		} else {
			field = line.slice(0, i);
			value = line[i + 1] === " " ? line.slice(i + 2) : line.slice(i + 1);
		}
		if (field === "data") dataLines.push(value);
		else if (field === "event") ret.event = value;
		else if (field === "id") ret.id = value;
		else if (field === "retry") {
			const n = Number(value);
			if (!isNaN(n)) ret.retry = n;
		}
	}
	if (ignore) return;
	if (dataLines.length) ret.data = dataLines.join("\n");
	return parse(ret);
}
/**
* Get the type of a JSON value.
* Distinguishes between array, null and object.
*/
function typeofJsonValue(value) {
	let t = typeof value;
	if (t == "object") {
		if (Array.isArray(value)) return "array";
		if (value === null) return "null";
	}
	return t;
}
/**
* Is this a JSON object (instead of an array or null)?
*/
function isJsonObject(value) {
	return value !== null && typeof value == "object" && !Array.isArray(value);
}
var encTable = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
var decTable = [];
for (let i = 0; i < encTable.length; i++) decTable[encTable[i].charCodeAt(0)] = i;
decTable["-".charCodeAt(0)] = encTable.indexOf("+");
decTable["_".charCodeAt(0)] = encTable.indexOf("/");
/**
* Decodes a base64 string to a byte array.
*
* - ignores white-space, including line breaks and tabs
* - allows inner padding (can decode concatenated base64 strings)
* - does not require padding
* - understands base64url encoding:
*   "-" instead of "+",
*   "_" instead of "/",
*   no padding
*/
function base64decode(base64Str) {
	let es = base64Str.length * 3 / 4;
	if (base64Str[base64Str.length - 2] == "=") es -= 2;
	else if (base64Str[base64Str.length - 1] == "=") es -= 1;
	let bytes = new Uint8Array(es), bytePos = 0, groupPos = 0, b, p = 0;
	for (let i = 0; i < base64Str.length; i++) {
		b = decTable[base64Str.charCodeAt(i)];
		if (b === void 0) switch (base64Str[i]) {
			case "=": groupPos = 0;
			case "\n":
			case "\r":
			case "	":
			case " ": continue;
			default: throw Error(`invalid base64 string.`);
		}
		switch (groupPos) {
			case 0:
				p = b;
				groupPos = 1;
				break;
			case 1:
				bytes[bytePos++] = p << 2 | (b & 48) >> 4;
				p = b;
				groupPos = 2;
				break;
			case 2:
				bytes[bytePos++] = (p & 15) << 4 | (b & 60) >> 2;
				p = b;
				groupPos = 3;
				break;
			case 3:
				bytes[bytePos++] = (p & 3) << 6 | b;
				groupPos = 0;
		}
	}
	if (groupPos == 1) throw Error(`invalid base64 string.`);
	return bytes.subarray(0, bytePos);
}
/**
* Encodes a byte array to a base64 string.
* Adds padding at the end.
* Does not insert newlines.
*/
function base64encode(bytes) {
	let base64 = "", groupPos = 0, b, p = 0;
	for (let i = 0; i < bytes.length; i++) {
		b = bytes[i];
		switch (groupPos) {
			case 0:
				base64 += encTable[b >> 2];
				p = (b & 3) << 4;
				groupPos = 1;
				break;
			case 1:
				base64 += encTable[p | b >> 4];
				p = (b & 15) << 2;
				groupPos = 2;
				break;
			case 2:
				base64 += encTable[p | b >> 6];
				base64 += encTable[b & 63];
				groupPos = 0;
		}
	}
	if (groupPos) {
		base64 += encTable[p];
		base64 += "=";
		if (groupPos == 1) base64 += "=";
	}
	return base64;
}
/**
* This handler implements the default behaviour for unknown fields.
* When reading data, unknown fields are stored on the message, in a
* symbol property.
* When writing data, the symbol property is queried and unknown fields
* are serialized into the output again.
*/
var UnknownFieldHandler;
(function(UnknownFieldHandler) {
	/**
	* The symbol used to store unknown fields for a message.
	* The property must conform to `UnknownFieldContainer`.
	*/
	UnknownFieldHandler.symbol = Symbol.for("protobuf-ts/unknown");
	/**
	* Store an unknown field during binary read directly on the message.
	* This method is compatible with `BinaryReadOptions.readUnknownField`.
	*/
	UnknownFieldHandler.onRead = (typeName, message, fieldNo, wireType, data) => {
		(is(message) ? message[UnknownFieldHandler.symbol] : message[UnknownFieldHandler.symbol] = []).push({
			no: fieldNo,
			wireType,
			data
		});
	};
	/**
	* Write unknown fields stored for the message to the writer.
	* This method is compatible with `BinaryWriteOptions.writeUnknownFields`.
	*/
	UnknownFieldHandler.onWrite = (typeName, message, writer) => {
		for (let { no, wireType, data } of UnknownFieldHandler.list(message)) writer.tag(no, wireType).raw(data);
	};
	/**
	* List unknown fields stored for the message.
	* Note that there may be multiples fields with the same number.
	*/
	UnknownFieldHandler.list = (message, fieldNo) => {
		if (is(message)) {
			let all = message[UnknownFieldHandler.symbol];
			return fieldNo ? all.filter((uf) => uf.no == fieldNo) : all;
		}
		return [];
	};
	/**
	* Returns the last unknown field by field number.
	*/
	UnknownFieldHandler.last = (message, fieldNo) => UnknownFieldHandler.list(message, fieldNo).slice(-1)[0];
	const is = (message) => message && Array.isArray(message[UnknownFieldHandler.symbol]);
})(UnknownFieldHandler || (UnknownFieldHandler = {}));
/**
* Protobuf binary format wire types.
*
* A wire type provides just enough information to find the length of the
* following value.
*
* See https://developers.google.com/protocol-buffers/docs/encoding#structure
*/
var WireType;
(function(WireType) {
	/**
	* Used for int32, int64, uint32, uint64, sint32, sint64, bool, enum
	*/
	WireType[WireType["Varint"] = 0] = "Varint";
	/**
	* Used for fixed64, sfixed64, double.
	* Always 8 bytes with little-endian byte order.
	*/
	WireType[WireType["Bit64"] = 1] = "Bit64";
	/**
	* Used for string, bytes, embedded messages, packed repeated fields
	*
	* Only repeated numeric types (types which use the varint, 32-bit,
	* or 64-bit wire types) can be packed. In proto3, such fields are
	* packed by default.
	*/
	WireType[WireType["LengthDelimited"] = 2] = "LengthDelimited";
	/**
	* Used for groups
	* @deprecated
	*/
	WireType[WireType["StartGroup"] = 3] = "StartGroup";
	/**
	* Used for groups
	* @deprecated
	*/
	WireType[WireType["EndGroup"] = 4] = "EndGroup";
	/**
	* Used for fixed32, sfixed32, float.
	* Always 4 bytes with little-endian byte order.
	*/
	WireType[WireType["Bit32"] = 5] = "Bit32";
})(WireType || (WireType = {}));
/**
* Read a 64 bit varint as two JS numbers.
*
* Returns tuple:
* [0]: low bits
* [0]: high bits
*
* Copyright 2008 Google Inc.  All rights reserved.
*
* See https://github.com/protocolbuffers/protobuf/blob/8a71927d74a4ce34efe2d8769fda198f52d20d12/js/experimental/runtime/kernel/buffer_decoder.js#L175
*/
function varint64read() {
	let lowBits = 0;
	let highBits = 0;
	for (let shift = 0; shift < 28; shift += 7) {
		let b = this.buf[this.pos++];
		lowBits |= (b & 127) << shift;
		if ((b & 128) == 0) {
			this.assertBounds();
			return [lowBits, highBits];
		}
	}
	let middleByte = this.buf[this.pos++];
	lowBits |= (middleByte & 15) << 28;
	highBits = (middleByte & 112) >> 4;
	if ((middleByte & 128) == 0) {
		this.assertBounds();
		return [lowBits, highBits];
	}
	for (let shift = 3; shift <= 31; shift += 7) {
		let b = this.buf[this.pos++];
		highBits |= (b & 127) << shift;
		if ((b & 128) == 0) {
			this.assertBounds();
			return [lowBits, highBits];
		}
	}
	throw new Error("invalid varint");
}
/**
* Write a 64 bit varint, given as two JS numbers, to the given bytes array.
*
* Copyright 2008 Google Inc.  All rights reserved.
*
* See https://github.com/protocolbuffers/protobuf/blob/8a71927d74a4ce34efe2d8769fda198f52d20d12/js/experimental/runtime/kernel/writer.js#L344
*/
function varint64write(lo, hi, bytes) {
	for (let i = 0; i < 28; i = i + 7) {
		const shift = lo >>> i;
		const hasNext = !(shift >>> 7 == 0 && hi == 0);
		const byte = (hasNext ? shift | 128 : shift) & 255;
		bytes.push(byte);
		if (!hasNext) return;
	}
	const splitBits = lo >>> 28 & 15 | (hi & 7) << 4;
	const hasMoreBits = !(hi >> 3 == 0);
	bytes.push((hasMoreBits ? splitBits | 128 : splitBits) & 255);
	if (!hasMoreBits) return;
	for (let i = 3; i < 31; i = i + 7) {
		const shift = hi >>> i;
		const hasNext = !(shift >>> 7 == 0);
		const byte = (hasNext ? shift | 128 : shift) & 255;
		bytes.push(byte);
		if (!hasNext) return;
	}
	bytes.push(hi >>> 31 & 1);
}
var TWO_PWR_32_DBL$1 = 4294967296;
/**
* Parse decimal string of 64 bit integer value as two JS numbers.
*
* Returns tuple:
* [0]: minus sign?
* [1]: low bits
* [2]: high bits
*
* Copyright 2008 Google Inc.
*/
function int64fromString(dec) {
	let minus = dec[0] == "-";
	if (minus) dec = dec.slice(1);
	const base = 1e6;
	let lowBits = 0;
	let highBits = 0;
	function add1e6digit(begin, end) {
		const digit1e6 = Number(dec.slice(begin, end));
		highBits *= base;
		lowBits = lowBits * base + digit1e6;
		if (lowBits >= TWO_PWR_32_DBL$1) {
			highBits = highBits + (lowBits / TWO_PWR_32_DBL$1 | 0);
			lowBits = lowBits % TWO_PWR_32_DBL$1;
		}
	}
	add1e6digit(-24, -18);
	add1e6digit(-18, -12);
	add1e6digit(-12, -6);
	add1e6digit(-6);
	return [
		minus,
		lowBits,
		highBits
	];
}
/**
* Format 64 bit integer value (as two JS numbers) to decimal string.
*
* Copyright 2008 Google Inc.
*/
function int64toString(bitsLow, bitsHigh) {
	if (bitsHigh >>> 0 <= 2097151) return "" + (TWO_PWR_32_DBL$1 * bitsHigh + (bitsLow >>> 0));
	let low = bitsLow & 16777215;
	let mid = (bitsLow >>> 24 | bitsHigh << 8) >>> 0 & 16777215;
	let high = bitsHigh >> 16 & 65535;
	let digitA = low + mid * 6777216 + high * 6710656;
	let digitB = mid + high * 8147497;
	let digitC = high * 2;
	let base = 1e7;
	if (digitA >= base) {
		digitB += Math.floor(digitA / base);
		digitA %= base;
	}
	if (digitB >= base) {
		digitC += Math.floor(digitB / base);
		digitB %= base;
	}
	function decimalFrom1e7(digit1e7, needLeadingZeros) {
		let partial = digit1e7 ? String(digit1e7) : "";
		if (needLeadingZeros) return "0000000".slice(partial.length) + partial;
		return partial;
	}
	return decimalFrom1e7(digitC, 0) + decimalFrom1e7(digitB, digitC) + decimalFrom1e7(digitA, 1);
}
/**
* Write a 32 bit varint, signed or unsigned. Same as `varint64write(0, value, bytes)`
*
* Copyright 2008 Google Inc.  All rights reserved.
*
* See https://github.com/protocolbuffers/protobuf/blob/1b18833f4f2a2f681f4e4a25cdf3b0a43115ec26/js/binary/encoder.js#L144
*/
function varint32write(value, bytes) {
	if (value >= 0) {
		while (value > 127) {
			bytes.push(value & 127 | 128);
			value = value >>> 7;
		}
		bytes.push(value);
	} else {
		for (let i = 0; i < 9; i++) {
			bytes.push(value & 127 | 128);
			value = value >> 7;
		}
		bytes.push(1);
	}
}
/**
* Read an unsigned 32 bit varint.
*
* See https://github.com/protocolbuffers/protobuf/blob/8a71927d74a4ce34efe2d8769fda198f52d20d12/js/experimental/runtime/kernel/buffer_decoder.js#L220
*/
function varint32read() {
	let b = this.buf[this.pos++];
	let result = b & 127;
	if ((b & 128) == 0) {
		this.assertBounds();
		return result;
	}
	b = this.buf[this.pos++];
	result |= (b & 127) << 7;
	if ((b & 128) == 0) {
		this.assertBounds();
		return result;
	}
	b = this.buf[this.pos++];
	result |= (b & 127) << 14;
	if ((b & 128) == 0) {
		this.assertBounds();
		return result;
	}
	b = this.buf[this.pos++];
	result |= (b & 127) << 21;
	if ((b & 128) == 0) {
		this.assertBounds();
		return result;
	}
	b = this.buf[this.pos++];
	result |= (b & 15) << 28;
	for (let readBytes = 5; (b & 128) !== 0 && readBytes < 10; readBytes++) b = this.buf[this.pos++];
	if ((b & 128) != 0) throw new Error("invalid varint");
	this.assertBounds();
	return result >>> 0;
}
var BI;
function detectBi() {
	const dv = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(8));
	BI = globalThis.BigInt !== void 0 && typeof dv.getBigInt64 === "function" && typeof dv.getBigUint64 === "function" && typeof dv.setBigInt64 === "function" && typeof dv.setBigUint64 === "function" ? {
		MIN: BigInt("-9223372036854775808"),
		MAX: BigInt("9223372036854775807"),
		UMIN: BigInt("0"),
		UMAX: BigInt("18446744073709551615"),
		C: BigInt,
		V: dv
	} : void 0;
}
detectBi();
function assertBi(bi) {
	if (!bi) throw new Error("BigInt unavailable, see https://github.com/timostamm/protobuf-ts/blob/v1.0.8/MANUAL.md#bigint-support");
}
var RE_DECIMAL_STR = /^-?[0-9]+$/;
var TWO_PWR_32_DBL = 4294967296;
var HALF_2_PWR_32 = 2147483648;
var SharedPbLong = class {
	/**
	* Create a new instance with the given bits.
	*/
	constructor(lo, hi) {
		this.lo = lo | 0;
		this.hi = hi | 0;
	}
	/**
	* Is this instance equal to 0?
	*/
	isZero() {
		return this.lo == 0 && this.hi == 0;
	}
	/**
	* Convert to a native number.
	*/
	toNumber() {
		let result = this.hi * TWO_PWR_32_DBL + (this.lo >>> 0);
		if (!Number.isSafeInteger(result)) throw new Error("cannot convert to safe number");
		return result;
	}
};
/**
* 64-bit unsigned integer as two 32-bit values.
* Converts between `string`, `number` and `bigint` representations.
*/
var PbULong = class PbULong extends SharedPbLong {
	/**
	* Create instance from a `string`, `number` or `bigint`.
	*/
	static from(value) {
		if (BI) switch (typeof value) {
			case "string":
				if (value == "0") return this.ZERO;
				if (value == "") throw new Error("string is no integer");
				value = BI.C(value);
			case "number":
				if (value === 0) return this.ZERO;
				value = BI.C(value);
			case "bigint":
				if (!value) return this.ZERO;
				if (value < BI.UMIN) throw new Error("signed value for ulong");
				if (value > BI.UMAX) throw new Error("ulong too large");
				BI.V.setBigUint64(0, value, true);
				return new PbULong(BI.V.getInt32(0, true), BI.V.getInt32(4, true));
		}
		else switch (typeof value) {
			case "string":
				if (value == "0") return this.ZERO;
				value = value.trim();
				if (!RE_DECIMAL_STR.test(value)) throw new Error("string is no integer");
				let [minus, lo, hi] = int64fromString(value);
				if (minus) throw new Error("signed value for ulong");
				return new PbULong(lo, hi);
			case "number":
				if (value == 0) return this.ZERO;
				if (!Number.isSafeInteger(value)) throw new Error("number is no integer");
				if (value < 0) throw new Error("signed value for ulong");
				return new PbULong(value, value / TWO_PWR_32_DBL);
		}
		throw new Error("unknown value " + typeof value);
	}
	/**
	* Convert to decimal string.
	*/
	toString() {
		return BI ? this.toBigInt().toString() : int64toString(this.lo, this.hi);
	}
	/**
	* Convert to native bigint.
	*/
	toBigInt() {
		assertBi(BI);
		BI.V.setInt32(0, this.lo, true);
		BI.V.setInt32(4, this.hi, true);
		return BI.V.getBigUint64(0, true);
	}
};
/**
* ulong 0 singleton.
*/
PbULong.ZERO = new PbULong(0, 0);
/**
* 64-bit signed integer as two 32-bit values.
* Converts between `string`, `number` and `bigint` representations.
*/
var PbLong = class PbLong extends SharedPbLong {
	/**
	* Create instance from a `string`, `number` or `bigint`.
	*/
	static from(value) {
		if (BI) switch (typeof value) {
			case "string":
				if (value == "0") return this.ZERO;
				if (value == "") throw new Error("string is no integer");
				value = BI.C(value);
			case "number":
				if (value === 0) return this.ZERO;
				value = BI.C(value);
			case "bigint":
				if (!value) return this.ZERO;
				if (value < BI.MIN) throw new Error("signed long too small");
				if (value > BI.MAX) throw new Error("signed long too large");
				BI.V.setBigInt64(0, value, true);
				return new PbLong(BI.V.getInt32(0, true), BI.V.getInt32(4, true));
		}
		else switch (typeof value) {
			case "string":
				if (value == "0") return this.ZERO;
				value = value.trim();
				if (!RE_DECIMAL_STR.test(value)) throw new Error("string is no integer");
				let [minus, lo, hi] = int64fromString(value);
				if (minus) {
					if (hi > HALF_2_PWR_32 || hi == HALF_2_PWR_32 && lo != 0) throw new Error("signed long too small");
				} else if (hi >= HALF_2_PWR_32) throw new Error("signed long too large");
				let pbl = new PbLong(lo, hi);
				return minus ? pbl.negate() : pbl;
			case "number":
				if (value == 0) return this.ZERO;
				if (!Number.isSafeInteger(value)) throw new Error("number is no integer");
				return value > 0 ? new PbLong(value, value / TWO_PWR_32_DBL) : new PbLong(-value, -value / TWO_PWR_32_DBL).negate();
		}
		throw new Error("unknown value " + typeof value);
	}
	/**
	* Do we have a minus sign?
	*/
	isNegative() {
		return (this.hi & HALF_2_PWR_32) !== 0;
	}
	/**
	* Negate two's complement.
	* Invert all the bits and add one to the result.
	*/
	negate() {
		let hi = ~this.hi, lo = this.lo;
		if (lo) lo = ~lo + 1;
		else hi += 1;
		return new PbLong(lo, hi);
	}
	/**
	* Convert to decimal string.
	*/
	toString() {
		if (BI) return this.toBigInt().toString();
		if (this.isNegative()) {
			let n = this.negate();
			return "-" + int64toString(n.lo, n.hi);
		}
		return int64toString(this.lo, this.hi);
	}
	/**
	* Convert to native bigint.
	*/
	toBigInt() {
		assertBi(BI);
		BI.V.setInt32(0, this.lo, true);
		BI.V.setInt32(4, this.hi, true);
		return BI.V.getBigInt64(0, true);
	}
};
/**
* long 0 singleton.
*/
PbLong.ZERO = new PbLong(0, 0);
var defaultsRead$1 = {
	readUnknownField: true,
	readerFactory: (bytes) => new BinaryReader(bytes)
};
/**
* Make options for reading binary data form partial options.
*/
function binaryReadOptions(options) {
	return options ? Object.assign(Object.assign({}, defaultsRead$1), options) : defaultsRead$1;
}
var BinaryReader = class {
	constructor(buf, textDecoder) {
		this.varint64 = varint64read;
		/**
		* Read a `uint32` field, an unsigned 32 bit varint.
		*/
		this.uint32 = varint32read;
		this.buf = buf;
		this.len = buf.length;
		this.pos = 0;
		this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
		this.textDecoder = textDecoder !== null && textDecoder !== void 0 ? textDecoder : new TextDecoder("utf-8", {
			fatal: true,
			ignoreBOM: true
		});
	}
	/**
	* Reads a tag - field number and wire type.
	*/
	tag() {
		let tag = this.uint32(), fieldNo = tag >>> 3, wireType = tag & 7;
		if (fieldNo <= 0 || wireType < 0 || wireType > 5) throw new Error("illegal tag: field no " + fieldNo + " wire type " + wireType);
		return [fieldNo, wireType];
	}
	/**
	* Skip one element on the wire and return the skipped data.
	* Supports WireType.StartGroup since v2.0.0-alpha.23.
	*/
	skip(wireType) {
		let start = this.pos;
		switch (wireType) {
			case WireType.Varint:
				while (this.buf[this.pos++] & 128);
				break;
			case WireType.Bit64: this.pos += 4;
			case WireType.Bit32:
				this.pos += 4;
				break;
			case WireType.LengthDelimited:
				let len = this.uint32();
				this.pos += len;
				break;
			case WireType.StartGroup:
				let t;
				while ((t = this.tag()[1]) !== WireType.EndGroup) this.skip(t);
				break;
			default: throw new Error("cant skip wire type " + wireType);
		}
		this.assertBounds();
		return this.buf.subarray(start, this.pos);
	}
	/**
	* Throws error if position in byte array is out of range.
	*/
	assertBounds() {
		if (this.pos > this.len) throw new RangeError("premature EOF");
	}
	/**
	* Read a `int32` field, a signed 32 bit varint.
	*/
	int32() {
		return this.uint32() | 0;
	}
	/**
	* Read a `sint32` field, a signed, zigzag-encoded 32-bit varint.
	*/
	sint32() {
		let zze = this.uint32();
		return zze >>> 1 ^ -(zze & 1);
	}
	/**
	* Read a `int64` field, a signed 64-bit varint.
	*/
	int64() {
		return new PbLong(...this.varint64());
	}
	/**
	* Read a `uint64` field, an unsigned 64-bit varint.
	*/
	uint64() {
		return new PbULong(...this.varint64());
	}
	/**
	* Read a `sint64` field, a signed, zig-zag-encoded 64-bit varint.
	*/
	sint64() {
		let [lo, hi] = this.varint64();
		let s = -(lo & 1);
		lo = (lo >>> 1 | (hi & 1) << 31) ^ s;
		hi = hi >>> 1 ^ s;
		return new PbLong(lo, hi);
	}
	/**
	* Read a `bool` field, a variant.
	*/
	bool() {
		let [lo, hi] = this.varint64();
		return lo !== 0 || hi !== 0;
	}
	/**
	* Read a `fixed32` field, an unsigned, fixed-length 32-bit integer.
	*/
	fixed32() {
		return this.view.getUint32((this.pos += 4) - 4, true);
	}
	/**
	* Read a `sfixed32` field, a signed, fixed-length 32-bit integer.
	*/
	sfixed32() {
		return this.view.getInt32((this.pos += 4) - 4, true);
	}
	/**
	* Read a `fixed64` field, an unsigned, fixed-length 64 bit integer.
	*/
	fixed64() {
		return new PbULong(this.sfixed32(), this.sfixed32());
	}
	/**
	* Read a `fixed64` field, a signed, fixed-length 64-bit integer.
	*/
	sfixed64() {
		return new PbLong(this.sfixed32(), this.sfixed32());
	}
	/**
	* Read a `float` field, 32-bit floating point number.
	*/
	float() {
		return this.view.getFloat32((this.pos += 4) - 4, true);
	}
	/**
	* Read a `double` field, a 64-bit floating point number.
	*/
	double() {
		return this.view.getFloat64((this.pos += 8) - 8, true);
	}
	/**
	* Read a `bytes` field, length-delimited arbitrary data.
	*/
	bytes() {
		let len = this.uint32();
		let start = this.pos;
		this.pos += len;
		this.assertBounds();
		return this.buf.subarray(start, start + len);
	}
	/**
	* Read a `string` field, length-delimited data converted to UTF-8 text.
	*/
	string() {
		return this.textDecoder.decode(this.bytes());
	}
};
/**
* assert that condition is true or throw error (with message)
*/
function assert(condition, msg) {
	if (!condition) throw new Error(msg);
}
var FLOAT32_MAX = 34028234663852886e22;
var FLOAT32_MIN = -34028234663852886e22;
var UINT32_MAX = 4294967295;
var INT32_MAX = 2147483647;
var INT32_MIN = -2147483648;
function assertInt32(arg) {
	if (typeof arg !== "number") throw new Error("invalid int 32: " + typeof arg);
	if (!Number.isInteger(arg) || arg > INT32_MAX || arg < INT32_MIN) throw new Error("invalid int 32: " + arg);
}
function assertUInt32(arg) {
	if (typeof arg !== "number") throw new Error("invalid uint 32: " + typeof arg);
	if (!Number.isInteger(arg) || arg > UINT32_MAX || arg < 0) throw new Error("invalid uint 32: " + arg);
}
function assertFloat32(arg) {
	if (typeof arg !== "number") throw new Error("invalid float 32: " + typeof arg);
	if (!Number.isFinite(arg)) return;
	if (arg > FLOAT32_MAX || arg < FLOAT32_MIN) throw new Error("invalid float 32: " + arg);
}
var defaultsWrite$1 = {
	writeUnknownFields: true,
	writerFactory: () => new BinaryWriter()
};
/**
* Make options for writing binary data form partial options.
*/
function binaryWriteOptions(options) {
	return options ? Object.assign(Object.assign({}, defaultsWrite$1), options) : defaultsWrite$1;
}
var BinaryWriter = class {
	constructor(textEncoder) {
		/**
		* Previous fork states.
		*/
		this.stack = [];
		this.textEncoder = textEncoder !== null && textEncoder !== void 0 ? textEncoder : new TextEncoder();
		this.chunks = [];
		this.buf = [];
	}
	/**
	* Return all bytes written and reset this writer.
	*/
	finish() {
		this.chunks.push(new Uint8Array(this.buf));
		let len = 0;
		for (let i = 0; i < this.chunks.length; i++) len += this.chunks[i].length;
		let bytes = new Uint8Array(len);
		let offset = 0;
		for (let i = 0; i < this.chunks.length; i++) {
			bytes.set(this.chunks[i], offset);
			offset += this.chunks[i].length;
		}
		this.chunks = [];
		return bytes;
	}
	/**
	* Start a new fork for length-delimited data like a message
	* or a packed repeated field.
	*
	* Must be joined later with `join()`.
	*/
	fork() {
		this.stack.push({
			chunks: this.chunks,
			buf: this.buf
		});
		this.chunks = [];
		this.buf = [];
		return this;
	}
	/**
	* Join the last fork. Write its length and bytes, then
	* return to the previous state.
	*/
	join() {
		let chunk = this.finish();
		let prev = this.stack.pop();
		if (!prev) throw new Error("invalid state, fork stack empty");
		this.chunks = prev.chunks;
		this.buf = prev.buf;
		this.uint32(chunk.byteLength);
		return this.raw(chunk);
	}
	/**
	* Writes a tag (field number and wire type).
	*
	* Equivalent to `uint32( (fieldNo << 3 | type) >>> 0 )`.
	*
	* Generated code should compute the tag ahead of time and call `uint32()`.
	*/
	tag(fieldNo, type) {
		return this.uint32((fieldNo << 3 | type) >>> 0);
	}
	/**
	* Write a chunk of raw bytes.
	*/
	raw(chunk) {
		if (this.buf.length) {
			this.chunks.push(new Uint8Array(this.buf));
			this.buf = [];
		}
		this.chunks.push(chunk);
		return this;
	}
	/**
	* Write a `uint32` value, an unsigned 32 bit varint.
	*/
	uint32(value) {
		assertUInt32(value);
		while (value > 127) {
			this.buf.push(value & 127 | 128);
			value = value >>> 7;
		}
		this.buf.push(value);
		return this;
	}
	/**
	* Write a `int32` value, a signed 32 bit varint.
	*/
	int32(value) {
		assertInt32(value);
		varint32write(value, this.buf);
		return this;
	}
	/**
	* Write a `bool` value, a variant.
	*/
	bool(value) {
		this.buf.push(value ? 1 : 0);
		return this;
	}
	/**
	* Write a `bytes` value, length-delimited arbitrary data.
	*/
	bytes(value) {
		this.uint32(value.byteLength);
		return this.raw(value);
	}
	/**
	* Write a `string` value, length-delimited data converted to UTF-8 text.
	*/
	string(value) {
		let chunk = this.textEncoder.encode(value);
		this.uint32(chunk.byteLength);
		return this.raw(chunk);
	}
	/**
	* Write a `float` value, 32-bit floating point number.
	*/
	float(value) {
		assertFloat32(value);
		let chunk = /* @__PURE__ */ new Uint8Array(4);
		new DataView(chunk.buffer).setFloat32(0, value, true);
		return this.raw(chunk);
	}
	/**
	* Write a `double` value, a 64-bit floating point number.
	*/
	double(value) {
		let chunk = /* @__PURE__ */ new Uint8Array(8);
		new DataView(chunk.buffer).setFloat64(0, value, true);
		return this.raw(chunk);
	}
	/**
	* Write a `fixed32` value, an unsigned, fixed-length 32-bit integer.
	*/
	fixed32(value) {
		assertUInt32(value);
		let chunk = /* @__PURE__ */ new Uint8Array(4);
		new DataView(chunk.buffer).setUint32(0, value, true);
		return this.raw(chunk);
	}
	/**
	* Write a `sfixed32` value, a signed, fixed-length 32-bit integer.
	*/
	sfixed32(value) {
		assertInt32(value);
		let chunk = /* @__PURE__ */ new Uint8Array(4);
		new DataView(chunk.buffer).setInt32(0, value, true);
		return this.raw(chunk);
	}
	/**
	* Write a `sint32` value, a signed, zigzag-encoded 32-bit varint.
	*/
	sint32(value) {
		assertInt32(value);
		value = (value << 1 ^ value >> 31) >>> 0;
		varint32write(value, this.buf);
		return this;
	}
	/**
	* Write a `fixed64` value, a signed, fixed-length 64-bit integer.
	*/
	sfixed64(value) {
		let chunk = /* @__PURE__ */ new Uint8Array(8);
		let view = new DataView(chunk.buffer);
		let long = PbLong.from(value);
		view.setInt32(0, long.lo, true);
		view.setInt32(4, long.hi, true);
		return this.raw(chunk);
	}
	/**
	* Write a `fixed64` value, an unsigned, fixed-length 64 bit integer.
	*/
	fixed64(value) {
		let chunk = /* @__PURE__ */ new Uint8Array(8);
		let view = new DataView(chunk.buffer);
		let long = PbULong.from(value);
		view.setInt32(0, long.lo, true);
		view.setInt32(4, long.hi, true);
		return this.raw(chunk);
	}
	/**
	* Write a `int64` value, a signed 64-bit varint.
	*/
	int64(value) {
		let long = PbLong.from(value);
		varint64write(long.lo, long.hi, this.buf);
		return this;
	}
	/**
	* Write a `sint64` value, a signed, zig-zag-encoded 64-bit varint.
	*/
	sint64(value) {
		let long = PbLong.from(value), sign = long.hi >> 31;
		varint64write(long.lo << 1 ^ sign, (long.hi << 1 | long.lo >>> 31) ^ sign, this.buf);
		return this;
	}
	/**
	* Write a `uint64` value, an unsigned 64-bit varint.
	*/
	uint64(value) {
		let long = PbULong.from(value);
		varint64write(long.lo, long.hi, this.buf);
		return this;
	}
};
var defaultsWrite = {
	emitDefaultValues: false,
	enumAsInteger: false,
	useProtoFieldName: false,
	prettySpaces: 0
};
var defaultsRead = { ignoreUnknownFields: false };
/**
* Make options for reading JSON data from partial options.
*/
function jsonReadOptions(options) {
	return options ? Object.assign(Object.assign({}, defaultsRead), options) : defaultsRead;
}
/**
* Make options for writing JSON data from partial options.
*/
function jsonWriteOptions(options) {
	return options ? Object.assign(Object.assign({}, defaultsWrite), options) : defaultsWrite;
}
/**
* The symbol used as a key on message objects to store the message type.
*
* Note that this is an experimental feature - it is here to stay, but
* implementation details may change without notice.
*/
var MESSAGE_TYPE = Symbol.for("protobuf-ts/message-type");
/**
* Converts snake_case to lowerCamelCase.
*
* Should behave like protoc:
* https://github.com/protocolbuffers/protobuf/blob/e8ae137c96444ea313485ed1118c5e43b2099cf1/src/google/protobuf/compiler/java/java_helpers.cc#L118
*/
function lowerCamelCase(snakeCase) {
	let capNext = false;
	const sb = [];
	for (let i = 0; i < snakeCase.length; i++) {
		let next = snakeCase.charAt(i);
		if (next == "_") capNext = true;
		else if (/\d/.test(next)) {
			sb.push(next);
			capNext = true;
		} else if (capNext) {
			sb.push(next.toUpperCase());
			capNext = false;
		} else if (i == 0) sb.push(next.toLowerCase());
		else sb.push(next);
	}
	return sb.join("");
}
/**
* Scalar value types. This is a subset of field types declared by protobuf
* enum google.protobuf.FieldDescriptorProto.Type The types GROUP and MESSAGE
* are omitted, but the numerical values are identical.
*/
var ScalarType;
(function(ScalarType) {
	ScalarType[ScalarType["DOUBLE"] = 1] = "DOUBLE";
	ScalarType[ScalarType["FLOAT"] = 2] = "FLOAT";
	ScalarType[ScalarType["INT64"] = 3] = "INT64";
	ScalarType[ScalarType["UINT64"] = 4] = "UINT64";
	ScalarType[ScalarType["INT32"] = 5] = "INT32";
	ScalarType[ScalarType["FIXED64"] = 6] = "FIXED64";
	ScalarType[ScalarType["FIXED32"] = 7] = "FIXED32";
	ScalarType[ScalarType["BOOL"] = 8] = "BOOL";
	ScalarType[ScalarType["STRING"] = 9] = "STRING";
	ScalarType[ScalarType["BYTES"] = 12] = "BYTES";
	ScalarType[ScalarType["UINT32"] = 13] = "UINT32";
	ScalarType[ScalarType["SFIXED32"] = 15] = "SFIXED32";
	ScalarType[ScalarType["SFIXED64"] = 16] = "SFIXED64";
	ScalarType[ScalarType["SINT32"] = 17] = "SINT32";
	ScalarType[ScalarType["SINT64"] = 18] = "SINT64";
})(ScalarType || (ScalarType = {}));
/**
* JavaScript representation of 64 bit integral types. Equivalent to the
* field option "jstype".
*
* By default, protobuf-ts represents 64 bit types as `bigint`.
*
* You can change the default behaviour by enabling the plugin parameter
* `long_type_string`, which will represent 64 bit types as `string`.
*
* Alternatively, you can change the behaviour for individual fields
* with the field option "jstype":
*
* ```protobuf
* uint64 my_field = 1 [jstype = JS_STRING];
* uint64 other_field = 2 [jstype = JS_NUMBER];
* ```
*/
var LongType;
(function(LongType) {
	/**
	* Use JavaScript `bigint`.
	*
	* Field option `[jstype = JS_NORMAL]`.
	*/
	LongType[LongType["BIGINT"] = 0] = "BIGINT";
	/**
	* Use JavaScript `string`.
	*
	* Field option `[jstype = JS_STRING]`.
	*/
	LongType[LongType["STRING"] = 1] = "STRING";
	/**
	* Use JavaScript `number`.
	*
	* Large values will loose precision.
	*
	* Field option `[jstype = JS_NUMBER]`.
	*/
	LongType[LongType["NUMBER"] = 2] = "NUMBER";
})(LongType || (LongType = {}));
/**
* Protobuf 2.1.0 introduced packed repeated fields.
* Setting the field option `[packed = true]` enables packing.
*
* In proto3, all repeated fields are packed by default.
* Setting the field option `[packed = false]` disables packing.
*
* Packed repeated fields are encoded with a single tag,
* then a length-delimiter, then the element values.
*
* Unpacked repeated fields are encoded with a tag and
* value for each element.
*
* `bytes` and `string` cannot be packed.
*/
var RepeatType;
(function(RepeatType) {
	/**
	* The field is not repeated.
	*/
	RepeatType[RepeatType["NO"] = 0] = "NO";
	/**
	* The field is repeated and should be packed.
	* Invalid for `bytes` and `string`, they cannot be packed.
	*/
	RepeatType[RepeatType["PACKED"] = 1] = "PACKED";
	/**
	* The field is repeated but should not be packed.
	* The only valid repeat type for repeated `bytes` and `string`.
	*/
	RepeatType[RepeatType["UNPACKED"] = 2] = "UNPACKED";
})(RepeatType || (RepeatType = {}));
/**
* Turns PartialFieldInfo into FieldInfo.
*/
function normalizeFieldInfo(field) {
	var _a, _b, _c, _d;
	field.localName = (_a = field.localName) !== null && _a !== void 0 ? _a : lowerCamelCase(field.name);
	field.jsonName = (_b = field.jsonName) !== null && _b !== void 0 ? _b : lowerCamelCase(field.name);
	field.repeat = (_c = field.repeat) !== null && _c !== void 0 ? _c : RepeatType.NO;
	field.opt = (_d = field.opt) !== null && _d !== void 0 ? _d : field.repeat ? false : field.oneof ? false : field.kind == "message";
	return field;
}
/**
* Is the given value a valid oneof group?
*
* We represent protobuf `oneof` as algebraic data types (ADT) in generated
* code. But when working with messages of unknown type, the ADT does not
* help us.
*
* This type guard checks if the given object adheres to the ADT rules, which
* are as follows:
*
* 1) Must be an object.
*
* 2) Must have a "oneofKind" discriminator property.
*
* 3) If "oneofKind" is `undefined`, no member field is selected. The object
* must not have any other properties.
*
* 4) If "oneofKind" is a `string`, the member field with this name is
* selected.
*
* 5) If a member field is selected, the object must have a second property
* with this name. The property must not be `undefined`.
*
* 6) No extra properties are allowed. The object has either one property
* (no selection) or two properties (selection).
*
*/
function isOneofGroup(any) {
	if (typeof any != "object" || any === null || !any.hasOwnProperty("oneofKind")) return false;
	switch (typeof any.oneofKind) {
		case "string":
			if (any[any.oneofKind] === void 0) return false;
			return Object.keys(any).length == 2;
		case "undefined": return Object.keys(any).length == 1;
		default: return false;
	}
}
var ReflectionTypeCheck = class {
	constructor(info) {
		var _a;
		this.fields = (_a = info.fields) !== null && _a !== void 0 ? _a : [];
	}
	prepare() {
		if (this.data) return;
		const req = [], known = [], oneofs = [];
		for (let field of this.fields) if (field.oneof) {
			if (!oneofs.includes(field.oneof)) {
				oneofs.push(field.oneof);
				req.push(field.oneof);
				known.push(field.oneof);
			}
		} else {
			known.push(field.localName);
			switch (field.kind) {
				case "scalar":
				case "enum":
					if (!field.opt || field.repeat) req.push(field.localName);
					break;
				case "message":
					if (field.repeat) req.push(field.localName);
					break;
				case "map": req.push(field.localName);
			}
		}
		this.data = {
			req,
			known,
			oneofs: Object.values(oneofs)
		};
	}
	/**
	* Is the argument a valid message as specified by the
	* reflection information?
	*
	* Checks all field types recursively. The `depth`
	* specifies how deep into the structure the check will be.
	*
	* With a depth of 0, only the presence of fields
	* is checked.
	*
	* With a depth of 1 or more, the field types are checked.
	*
	* With a depth of 2 or more, the members of map, repeated
	* and message fields are checked.
	*
	* Message fields will be checked recursively with depth - 1.
	*
	* The number of map entries / repeated values being checked
	* is < depth.
	*/
	is(message, depth, allowExcessProperties = false) {
		if (depth < 0) return true;
		if (message === null || message === void 0 || typeof message != "object") return false;
		this.prepare();
		let keys = Object.keys(message), data = this.data;
		if (keys.length < data.req.length || data.req.some((n) => !keys.includes(n))) return false;
		if (!allowExcessProperties) {
			if (keys.some((k) => !data.known.includes(k))) return false;
		}
		if (depth < 1) return true;
		for (const name of data.oneofs) {
			const group = message[name];
			if (!isOneofGroup(group)) return false;
			if (group.oneofKind === void 0) continue;
			const field = this.fields.find((f) => f.localName === group.oneofKind);
			if (!field) return false;
			if (!this.field(group[group.oneofKind], field, allowExcessProperties, depth)) return false;
		}
		for (const field of this.fields) {
			if (field.oneof !== void 0) continue;
			if (!this.field(message[field.localName], field, allowExcessProperties, depth)) return false;
		}
		return true;
	}
	field(arg, field, allowExcessProperties, depth) {
		let repeated = field.repeat;
		switch (field.kind) {
			case "scalar":
				if (arg === void 0) return field.opt;
				if (repeated) return this.scalars(arg, field.T, depth, field.L);
				return this.scalar(arg, field.T, field.L);
			case "enum":
				if (arg === void 0) return field.opt;
				if (repeated) return this.scalars(arg, ScalarType.INT32, depth);
				return this.scalar(arg, ScalarType.INT32);
			case "message":
				if (arg === void 0) return true;
				if (repeated) return this.messages(arg, field.T(), allowExcessProperties, depth);
				return this.message(arg, field.T(), allowExcessProperties, depth);
			case "map":
				if (typeof arg != "object" || arg === null) return false;
				if (depth < 2) return true;
				if (!this.mapKeys(arg, field.K, depth)) return false;
				switch (field.V.kind) {
					case "scalar": return this.scalars(Object.values(arg), field.V.T, depth, field.V.L);
					case "enum": return this.scalars(Object.values(arg), ScalarType.INT32, depth);
					case "message": return this.messages(Object.values(arg), field.V.T(), allowExcessProperties, depth);
				}
		}
		return true;
	}
	message(arg, type, allowExcessProperties, depth) {
		if (allowExcessProperties) return type.isAssignable(arg, depth);
		return type.is(arg, depth);
	}
	messages(arg, type, allowExcessProperties, depth) {
		if (!Array.isArray(arg)) return false;
		if (depth < 2) return true;
		if (allowExcessProperties) {
			for (let i = 0; i < arg.length && i < depth; i++) if (!type.isAssignable(arg[i], depth - 1)) return false;
		} else for (let i = 0; i < arg.length && i < depth; i++) if (!type.is(arg[i], depth - 1)) return false;
		return true;
	}
	scalar(arg, type, longType) {
		let argType = typeof arg;
		switch (type) {
			case ScalarType.UINT64:
			case ScalarType.FIXED64:
			case ScalarType.INT64:
			case ScalarType.SFIXED64:
			case ScalarType.SINT64: switch (longType) {
				case LongType.BIGINT: return argType == "bigint";
				case LongType.NUMBER: return argType == "number" && !isNaN(arg);
				default: return argType == "string";
			}
			case ScalarType.BOOL: return argType == "boolean";
			case ScalarType.STRING: return argType == "string";
			case ScalarType.BYTES: return arg instanceof Uint8Array;
			case ScalarType.DOUBLE:
			case ScalarType.FLOAT: return argType == "number" && !isNaN(arg);
			default: return argType == "number" && Number.isInteger(arg);
		}
	}
	scalars(arg, type, depth, longType) {
		if (!Array.isArray(arg)) return false;
		if (depth < 2) return true;
		if (Array.isArray(arg)) {
			for (let i = 0; i < arg.length && i < depth; i++) if (!this.scalar(arg[i], type, longType)) return false;
		}
		return true;
	}
	mapKeys(map, type, depth) {
		let keys = Object.keys(map);
		switch (type) {
			case ScalarType.INT32:
			case ScalarType.FIXED32:
			case ScalarType.SFIXED32:
			case ScalarType.SINT32:
			case ScalarType.UINT32: return this.scalars(keys.slice(0, depth).map((k) => parseInt(k)), type, depth);
			case ScalarType.BOOL: return this.scalars(keys.slice(0, depth).map((k) => k == "true" ? true : k == "false" ? false : k), type, depth);
			default: return this.scalars(keys, type, depth, LongType.STRING);
		}
	}
};
/**
* Utility method to convert a PbLong or PbUlong to a JavaScript
* representation during runtime.
*
* Works with generated field information, `undefined` is equivalent
* to `STRING`.
*/
function reflectionLongConvert(long, type) {
	switch (type) {
		case LongType.BIGINT: return long.toBigInt();
		case LongType.NUMBER: return long.toNumber();
		default: return long.toString();
	}
}
/**
* Reads proto3 messages in canonical JSON format using reflection information.
*
* https://developers.google.com/protocol-buffers/docs/proto3#json
*/
var ReflectionJsonReader = class {
	constructor(info) {
		this.info = info;
	}
	prepare() {
		var _a;
		if (this.fMap === void 0) {
			this.fMap = {};
			const fieldsInput = (_a = this.info.fields) !== null && _a !== void 0 ? _a : [];
			for (const field of fieldsInput) {
				this.fMap[field.name] = field;
				this.fMap[field.jsonName] = field;
				this.fMap[field.localName] = field;
			}
		}
	}
	assert(condition, fieldName, jsonValue) {
		if (!condition) {
			let what = typeofJsonValue(jsonValue);
			if (what == "number" || what == "boolean") what = jsonValue.toString();
			throw new Error(`Cannot parse JSON ${what} for ${this.info.typeName}#${fieldName}`);
		}
	}
	/**
	* Reads a message from canonical JSON format into the target message.
	*
	* Repeated fields are appended. Map entries are added, overwriting
	* existing keys.
	*
	* If a message field is already present, it will be merged with the
	* new data.
	*/
	read(input, message, options) {
		this.prepare();
		const oneofsHandled = [];
		for (const [jsonKey, jsonValue] of Object.entries(input)) {
			const field = this.fMap[jsonKey];
			if (!field) {
				if (!options.ignoreUnknownFields) throw new Error(`Found unknown field while reading ${this.info.typeName} from JSON format. JSON key: ${jsonKey}`);
				continue;
			}
			const localName = field.localName;
			let target;
			if (field.oneof) {
				if (jsonValue === null && (field.kind !== "enum" || field.T()[0] !== "google.protobuf.NullValue")) continue;
				if (oneofsHandled.includes(field.oneof)) throw new Error(`Multiple members of the oneof group "${field.oneof}" of ${this.info.typeName} are present in JSON.`);
				oneofsHandled.push(field.oneof);
				target = message[field.oneof] = { oneofKind: localName };
			} else target = message;
			if (field.kind == "map") {
				if (jsonValue === null) continue;
				this.assert(isJsonObject(jsonValue), field.name, jsonValue);
				const fieldObj = target[localName];
				for (const [jsonObjKey, jsonObjValue] of Object.entries(jsonValue)) {
					this.assert(jsonObjValue !== null, field.name + " map value", null);
					let val;
					switch (field.V.kind) {
						case "message":
							val = field.V.T().internalJsonRead(jsonObjValue, options);
							break;
						case "enum":
							val = this.enum(field.V.T(), jsonObjValue, field.name, options.ignoreUnknownFields);
							if (val === false) continue;
							break;
						case "scalar": val = this.scalar(jsonObjValue, field.V.T, field.V.L, field.name);
					}
					this.assert(val !== void 0, field.name + " map value", jsonObjValue);
					let key = jsonObjKey;
					if (field.K == ScalarType.BOOL) key = key == "true" ? true : key == "false" ? false : key;
					key = this.scalar(key, field.K, LongType.STRING, field.name).toString();
					fieldObj[key] = val;
				}
			} else if (field.repeat) {
				if (jsonValue === null) continue;
				this.assert(Array.isArray(jsonValue), field.name, jsonValue);
				const fieldArr = target[localName];
				for (const jsonItem of jsonValue) {
					this.assert(jsonItem !== null, field.name, null);
					let val;
					switch (field.kind) {
						case "message":
							val = field.T().internalJsonRead(jsonItem, options);
							break;
						case "enum":
							val = this.enum(field.T(), jsonItem, field.name, options.ignoreUnknownFields);
							if (val === false) continue;
							break;
						case "scalar": val = this.scalar(jsonItem, field.T, field.L, field.name);
					}
					this.assert(val !== void 0, field.name, jsonValue);
					fieldArr.push(val);
				}
			} else switch (field.kind) {
				case "message":
					if (jsonValue === null && field.T().typeName != "google.protobuf.Value") {
						this.assert(field.oneof === void 0, field.name + " (oneof member)", null);
						continue;
					}
					target[localName] = field.T().internalJsonRead(jsonValue, options, target[localName]);
					break;
				case "enum":
					if (jsonValue === null) continue;
					let val = this.enum(field.T(), jsonValue, field.name, options.ignoreUnknownFields);
					if (val === false) continue;
					target[localName] = val;
					break;
				case "scalar":
					if (jsonValue === null) continue;
					target[localName] = this.scalar(jsonValue, field.T, field.L, field.name);
			}
		}
	}
	/**
	* Returns `false` for unrecognized string representations.
	*
	* google.protobuf.NullValue accepts only JSON `null` (or the old `"NULL_VALUE"`).
	*/
	enum(type, json, fieldName, ignoreUnknownFields) {
		if (type[0] == "google.protobuf.NullValue") assert(json === null || json === "NULL_VALUE", `Unable to parse field ${this.info.typeName}#${fieldName}, enum ${type[0]} only accepts null.`);
		if (json === null) return 0;
		switch (typeof json) {
			case "number":
				assert(Number.isInteger(json), `Unable to parse field ${this.info.typeName}#${fieldName}, enum can only be integral number, got ${json}.`);
				return json;
			case "string":
				let localEnumName = json;
				if (type[2] && json.substring(0, type[2].length) === type[2]) localEnumName = json.substring(type[2].length);
				let enumNumber = type[1][localEnumName];
				if (typeof enumNumber === "undefined" && ignoreUnknownFields) return false;
				assert(typeof enumNumber == "number", `Unable to parse field ${this.info.typeName}#${fieldName}, enum ${type[0]} has no value for "${json}".`);
				return enumNumber;
		}
		assert(false, `Unable to parse field ${this.info.typeName}#${fieldName}, cannot parse enum value from ${typeof json}".`);
	}
	scalar(json, type, longType, fieldName) {
		let e;
		try {
			switch (type) {
				case ScalarType.DOUBLE:
				case ScalarType.FLOAT:
					if (json === null) return 0;
					if (json === "NaN") return NaN;
					if (json === "Infinity") return Number.POSITIVE_INFINITY;
					if (json === "-Infinity") return Number.NEGATIVE_INFINITY;
					if (json === "") {
						e = "empty string";
						break;
					}
					if (typeof json == "string" && json.trim().length !== json.length) {
						e = "extra whitespace";
						break;
					}
					if (typeof json != "string" && typeof json != "number") break;
					let float = Number(json);
					if (Number.isNaN(float)) {
						e = "not a number";
						break;
					}
					if (!Number.isFinite(float)) {
						e = "too large or small";
						break;
					}
					if (type == ScalarType.FLOAT) assertFloat32(float);
					return float;
				case ScalarType.INT32:
				case ScalarType.FIXED32:
				case ScalarType.SFIXED32:
				case ScalarType.SINT32:
				case ScalarType.UINT32:
					if (json === null) return 0;
					let int32;
					if (typeof json == "number") int32 = json;
					else if (json === "") e = "empty string";
					else if (typeof json == "string") {
						if (json.trim().length !== json.length) e = "extra whitespace";
						else int32 = Number(json);
					}
					if (int32 === void 0) break;
					if (type == ScalarType.UINT32) assertUInt32(int32);
					else assertInt32(int32);
					return int32;
				case ScalarType.INT64:
				case ScalarType.SFIXED64:
				case ScalarType.SINT64:
					if (json === null) return reflectionLongConvert(PbLong.ZERO, longType);
					if (typeof json != "number" && typeof json != "string") break;
					return reflectionLongConvert(PbLong.from(json), longType);
				case ScalarType.FIXED64:
				case ScalarType.UINT64:
					if (json === null) return reflectionLongConvert(PbULong.ZERO, longType);
					if (typeof json != "number" && typeof json != "string") break;
					return reflectionLongConvert(PbULong.from(json), longType);
				case ScalarType.BOOL:
					if (json === null) return false;
					if (typeof json !== "boolean") break;
					return json;
				case ScalarType.STRING:
					if (json === null) return "";
					if (typeof json !== "string") {
						e = "extra whitespace";
						break;
					}
					return json;
				case ScalarType.BYTES:
					if (json === null || json === "") return /* @__PURE__ */ new Uint8Array(0);
					if (typeof json !== "string") break;
					return base64decode(json);
			}
		} catch (error) {
			e = error.message;
		}
		this.assert(false, fieldName + (e ? " - " + e : ""), json);
	}
};
/**
* Writes proto3 messages in canonical JSON format using reflection
* information.
*
* https://developers.google.com/protocol-buffers/docs/proto3#json
*/
var ReflectionJsonWriter = class {
	constructor(info) {
		var _a;
		this.fields = (_a = info.fields) !== null && _a !== void 0 ? _a : [];
	}
	/**
	* Converts the message to a JSON object, based on the field descriptors.
	*/
	write(message, options) {
		const json = {}, source = message;
		for (const field of this.fields) {
			if (!field.oneof) {
				let jsonValue = this.field(field, source[field.localName], options);
				if (jsonValue !== void 0) json[options.useProtoFieldName ? field.name : field.jsonName] = jsonValue;
				continue;
			}
			const group = source[field.oneof];
			if (group.oneofKind !== field.localName) continue;
			const opt = field.kind == "scalar" || field.kind == "enum" ? Object.assign(Object.assign({}, options), { emitDefaultValues: true }) : options;
			let jsonValue = this.field(field, group[field.localName], opt);
			assert(jsonValue !== void 0);
			json[options.useProtoFieldName ? field.name : field.jsonName] = jsonValue;
		}
		return json;
	}
	field(field, value, options) {
		let jsonValue = void 0;
		if (field.kind == "map") {
			assert(typeof value == "object" && value !== null);
			const jsonObj = {};
			switch (field.V.kind) {
				case "scalar":
					for (const [entryKey, entryValue] of Object.entries(value)) {
						const val = this.scalar(field.V.T, entryValue, field.name, false, true);
						assert(val !== void 0);
						jsonObj[entryKey.toString()] = val;
					}
					break;
				case "message":
					const messageType = field.V.T();
					for (const [entryKey, entryValue] of Object.entries(value)) {
						const val = this.message(messageType, entryValue, field.name, options);
						assert(val !== void 0);
						jsonObj[entryKey.toString()] = val;
					}
					break;
				case "enum":
					const enumInfo = field.V.T();
					for (const [entryKey, entryValue] of Object.entries(value)) {
						assert(entryValue === void 0 || typeof entryValue == "number");
						const val = this.enum(enumInfo, entryValue, field.name, false, true, options.enumAsInteger);
						assert(val !== void 0);
						jsonObj[entryKey.toString()] = val;
					}
			}
			if (options.emitDefaultValues || Object.keys(jsonObj).length > 0) jsonValue = jsonObj;
		} else if (field.repeat) {
			assert(Array.isArray(value));
			const jsonArr = [];
			switch (field.kind) {
				case "scalar":
					for (let i = 0; i < value.length; i++) {
						const val = this.scalar(field.T, value[i], field.name, field.opt, true);
						assert(val !== void 0);
						jsonArr.push(val);
					}
					break;
				case "enum":
					const enumInfo = field.T();
					for (let i = 0; i < value.length; i++) {
						assert(value[i] === void 0 || typeof value[i] == "number");
						const val = this.enum(enumInfo, value[i], field.name, field.opt, true, options.enumAsInteger);
						assert(val !== void 0);
						jsonArr.push(val);
					}
					break;
				case "message":
					const messageType = field.T();
					for (let i = 0; i < value.length; i++) {
						const val = this.message(messageType, value[i], field.name, options);
						assert(val !== void 0);
						jsonArr.push(val);
					}
			}
			if (options.emitDefaultValues || jsonArr.length > 0 || options.emitDefaultValues) jsonValue = jsonArr;
		} else switch (field.kind) {
			case "scalar":
				jsonValue = this.scalar(field.T, value, field.name, field.opt, options.emitDefaultValues);
				break;
			case "enum":
				jsonValue = this.enum(field.T(), value, field.name, field.opt, options.emitDefaultValues, options.enumAsInteger);
				break;
			case "message": jsonValue = this.message(field.T(), value, field.name, options);
		}
		return jsonValue;
	}
	/**
	* Returns `null` as the default for google.protobuf.NullValue.
	*/
	enum(type, value, fieldName, optional, emitDefaultValues, enumAsInteger) {
		if (type[0] == "google.protobuf.NullValue") return !emitDefaultValues && !optional ? void 0 : null;
		if (value === void 0) {
			assert(optional);
			return;
		}
		if (value === 0 && !emitDefaultValues && !optional) return void 0;
		assert(typeof value == "number");
		assert(Number.isInteger(value));
		if (enumAsInteger || !type[1].hasOwnProperty(value)) return value;
		if (type[2]) return type[2] + type[1][value];
		return type[1][value];
	}
	message(type, value, fieldName, options) {
		if (value === void 0) return options.emitDefaultValues ? null : void 0;
		return type.internalJsonWrite(value, options);
	}
	scalar(type, value, fieldName, optional, emitDefaultValues) {
		if (value === void 0) {
			assert(optional);
			return;
		}
		const ed = emitDefaultValues || optional;
		switch (type) {
			case ScalarType.INT32:
			case ScalarType.SFIXED32:
			case ScalarType.SINT32:
				if (value === 0) return ed ? 0 : void 0;
				assertInt32(value);
				return value;
			case ScalarType.FIXED32:
			case ScalarType.UINT32:
				if (value === 0) return ed ? 0 : void 0;
				assertUInt32(value);
				return value;
			case ScalarType.FLOAT: assertFloat32(value);
			case ScalarType.DOUBLE:
				if (value === 0) return ed ? 0 : void 0;
				assert(typeof value == "number");
				if (Number.isNaN(value)) return "NaN";
				if (value === Number.POSITIVE_INFINITY) return "Infinity";
				if (value === Number.NEGATIVE_INFINITY) return "-Infinity";
				return value;
			case ScalarType.STRING:
				if (value === "") return ed ? "" : void 0;
				assert(typeof value == "string");
				return value;
			case ScalarType.BOOL:
				if (value === false) return ed ? false : void 0;
				assert(typeof value == "boolean");
				return value;
			case ScalarType.UINT64:
			case ScalarType.FIXED64:
				assert(typeof value == "number" || typeof value == "string" || typeof value == "bigint");
				let ulong = PbULong.from(value);
				if (ulong.isZero() && !ed) return void 0;
				return ulong.toString();
			case ScalarType.INT64:
			case ScalarType.SFIXED64:
			case ScalarType.SINT64:
				assert(typeof value == "number" || typeof value == "string" || typeof value == "bigint");
				let long = PbLong.from(value);
				if (long.isZero() && !ed) return void 0;
				return long.toString();
			case ScalarType.BYTES:
				assert(value instanceof Uint8Array);
				if (!value.byteLength) return ed ? "" : void 0;
				return base64encode(value);
		}
	}
};
/**
* Creates the default value for a scalar type.
*/
function reflectionScalarDefault(type, longType = LongType.STRING) {
	switch (type) {
		case ScalarType.BOOL: return false;
		case ScalarType.UINT64:
		case ScalarType.FIXED64: return reflectionLongConvert(PbULong.ZERO, longType);
		case ScalarType.INT64:
		case ScalarType.SFIXED64:
		case ScalarType.SINT64: return reflectionLongConvert(PbLong.ZERO, longType);
		case ScalarType.DOUBLE:
		case ScalarType.FLOAT: return 0;
		case ScalarType.BYTES: return /* @__PURE__ */ new Uint8Array(0);
		case ScalarType.STRING: return "";
		default: return 0;
	}
}
/**
* Reads proto3 messages in binary format using reflection information.
*
* https://developers.google.com/protocol-buffers/docs/encoding
*/
var ReflectionBinaryReader = class {
	constructor(info) {
		this.info = info;
	}
	prepare() {
		var _a;
		if (!this.fieldNoToField) {
			const fieldsInput = (_a = this.info.fields) !== null && _a !== void 0 ? _a : [];
			this.fieldNoToField = new Map(fieldsInput.map((field) => [field.no, field]));
		}
	}
	/**
	* Reads a message from binary format into the target message.
	*
	* Repeated fields are appended. Map entries are added, overwriting
	* existing keys.
	*
	* If a message field is already present, it will be merged with the
	* new data.
	*/
	read(reader, message, options, length) {
		this.prepare();
		const end = length === void 0 ? reader.len : reader.pos + length;
		while (reader.pos < end) {
			const [fieldNo, wireType] = reader.tag(), field = this.fieldNoToField.get(fieldNo);
			if (!field) {
				let u = options.readUnknownField;
				if (u == "throw") throw new Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.info.typeName}`);
				let d = reader.skip(wireType);
				if (u !== false) (u === true ? UnknownFieldHandler.onRead : u)(this.info.typeName, message, fieldNo, wireType, d);
				continue;
			}
			let target = message, repeated = field.repeat, localName = field.localName;
			if (field.oneof) {
				target = target[field.oneof];
				if (target.oneofKind !== localName) target = message[field.oneof] = { oneofKind: localName };
			}
			switch (field.kind) {
				case "scalar":
				case "enum":
					let T = field.kind == "enum" ? ScalarType.INT32 : field.T;
					let L = field.kind == "scalar" ? field.L : void 0;
					if (repeated) {
						let arr = target[localName];
						if (wireType == WireType.LengthDelimited && T != ScalarType.STRING && T != ScalarType.BYTES) {
							let e = reader.uint32() + reader.pos;
							while (reader.pos < e) arr.push(this.scalar(reader, T, L));
						} else arr.push(this.scalar(reader, T, L));
					} else target[localName] = this.scalar(reader, T, L);
					break;
				case "message":
					if (repeated) {
						let arr = target[localName];
						let msg = field.T().internalBinaryRead(reader, reader.uint32(), options);
						arr.push(msg);
					} else target[localName] = field.T().internalBinaryRead(reader, reader.uint32(), options, target[localName]);
					break;
				case "map":
					let [mapKey, mapVal] = this.mapEntry(field, reader, options);
					target[localName][mapKey] = mapVal;
			}
		}
	}
	/**
	* Read a map field, expecting key field = 1, value field = 2
	*/
	mapEntry(field, reader, options) {
		let length = reader.uint32();
		let end = reader.pos + length;
		let key = void 0;
		let val = void 0;
		while (reader.pos < end) {
			let [fieldNo, wireType] = reader.tag();
			switch (fieldNo) {
				case 1:
					if (field.K == ScalarType.BOOL) key = reader.bool().toString();
					else key = this.scalar(reader, field.K, LongType.STRING);
					break;
				case 2:
					switch (field.V.kind) {
						case "scalar":
							val = this.scalar(reader, field.V.T, field.V.L);
							break;
						case "enum":
							val = reader.int32();
							break;
						case "message": val = field.V.T().internalBinaryRead(reader, reader.uint32(), options);
					}
					break;
				default: throw new Error(`Unknown field ${fieldNo} (wire type ${wireType}) in map entry for ${this.info.typeName}#${field.name}`);
			}
		}
		if (key === void 0) {
			let keyRaw = reflectionScalarDefault(field.K);
			key = field.K == ScalarType.BOOL ? keyRaw.toString() : keyRaw;
		}
		if (val === void 0) switch (field.V.kind) {
			case "scalar":
				val = reflectionScalarDefault(field.V.T, field.V.L);
				break;
			case "enum":
				val = 0;
				break;
			case "message": val = field.V.T().create();
		}
		return [key, val];
	}
	scalar(reader, type, longType) {
		switch (type) {
			case ScalarType.INT32: return reader.int32();
			case ScalarType.STRING: return reader.string();
			case ScalarType.BOOL: return reader.bool();
			case ScalarType.DOUBLE: return reader.double();
			case ScalarType.FLOAT: return reader.float();
			case ScalarType.INT64: return reflectionLongConvert(reader.int64(), longType);
			case ScalarType.UINT64: return reflectionLongConvert(reader.uint64(), longType);
			case ScalarType.FIXED64: return reflectionLongConvert(reader.fixed64(), longType);
			case ScalarType.FIXED32: return reader.fixed32();
			case ScalarType.BYTES: return reader.bytes();
			case ScalarType.UINT32: return reader.uint32();
			case ScalarType.SFIXED32: return reader.sfixed32();
			case ScalarType.SFIXED64: return reflectionLongConvert(reader.sfixed64(), longType);
			case ScalarType.SINT32: return reader.sint32();
			case ScalarType.SINT64: return reflectionLongConvert(reader.sint64(), longType);
		}
	}
};
/**
* Writes proto3 messages in binary format using reflection information.
*
* https://developers.google.com/protocol-buffers/docs/encoding
*/
var ReflectionBinaryWriter = class {
	constructor(info) {
		this.info = info;
	}
	prepare() {
		if (!this.fields) {
			const fieldsInput = this.info.fields ? this.info.fields.concat() : [];
			this.fields = fieldsInput.sort((a, b) => a.no - b.no);
		}
	}
	/**
	* Writes the message to binary format.
	*/
	write(message, writer, options) {
		this.prepare();
		for (const field of this.fields) {
			let value, emitDefault, repeated = field.repeat, localName = field.localName;
			if (field.oneof) {
				const group = message[field.oneof];
				if (group.oneofKind !== localName) continue;
				value = group[localName];
				emitDefault = true;
			} else {
				value = message[localName];
				emitDefault = false;
			}
			switch (field.kind) {
				case "scalar":
				case "enum":
					let T = field.kind == "enum" ? ScalarType.INT32 : field.T;
					if (repeated) {
						assert(Array.isArray(value));
						if (repeated == RepeatType.PACKED) this.packed(writer, T, field.no, value);
						else for (const item of value) this.scalar(writer, T, field.no, item, true);
					} else if (value === void 0) assert(field.opt);
					else this.scalar(writer, T, field.no, value, emitDefault || field.opt);
					break;
				case "message":
					if (repeated) {
						assert(Array.isArray(value));
						for (const item of value) this.message(writer, options, field.T(), field.no, item);
					} else this.message(writer, options, field.T(), field.no, value);
					break;
				case "map":
					assert(typeof value == "object" && value !== null);
					for (const [key, val] of Object.entries(value)) this.mapEntry(writer, options, field, key, val);
			}
		}
		let u = options.writeUnknownFields;
		if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.info.typeName, message, writer);
	}
	mapEntry(writer, options, field, key, value) {
		writer.tag(field.no, WireType.LengthDelimited);
		writer.fork();
		let keyValue = key;
		switch (field.K) {
			case ScalarType.INT32:
			case ScalarType.FIXED32:
			case ScalarType.UINT32:
			case ScalarType.SFIXED32:
			case ScalarType.SINT32:
				keyValue = Number.parseInt(key);
				break;
			case ScalarType.BOOL:
				assert(key == "true" || key == "false");
				keyValue = key == "true";
		}
		this.scalar(writer, field.K, 1, keyValue, true);
		switch (field.V.kind) {
			case "scalar":
				this.scalar(writer, field.V.T, 2, value, true);
				break;
			case "enum":
				this.scalar(writer, ScalarType.INT32, 2, value, true);
				break;
			case "message": this.message(writer, options, field.V.T(), 2, value);
		}
		writer.join();
	}
	message(writer, options, handler, fieldNo, value) {
		if (value === void 0) return;
		handler.internalBinaryWrite(value, writer.tag(fieldNo, WireType.LengthDelimited).fork(), options);
		writer.join();
	}
	/**
	* Write a single scalar value.
	*/
	scalar(writer, type, fieldNo, value, emitDefault) {
		let [wireType, method, isDefault] = this.scalarInfo(type, value);
		if (!isDefault || emitDefault) {
			writer.tag(fieldNo, wireType);
			writer[method](value);
		}
	}
	/**
	* Write an array of scalar values in packed format.
	*/
	packed(writer, type, fieldNo, value) {
		if (!value.length) return;
		assert(type !== ScalarType.BYTES && type !== ScalarType.STRING);
		writer.tag(fieldNo, WireType.LengthDelimited);
		writer.fork();
		let [, method] = this.scalarInfo(type);
		for (let i = 0; i < value.length; i++) writer[method](value[i]);
		writer.join();
	}
	/**
	* Get information for writing a scalar value.
	*
	* Returns tuple:
	* [0]: appropriate WireType
	* [1]: name of the appropriate method of IBinaryWriter
	* [2]: whether the given value is a default value
	*
	* If argument `value` is omitted, [2] is always false.
	*/
	scalarInfo(type, value) {
		let t = WireType.Varint;
		let m;
		let i = value === void 0;
		let d = value === 0;
		switch (type) {
			case ScalarType.INT32:
				m = "int32";
				break;
			case ScalarType.STRING:
				d = i || !value.length;
				t = WireType.LengthDelimited;
				m = "string";
				break;
			case ScalarType.BOOL:
				d = value === false;
				m = "bool";
				break;
			case ScalarType.UINT32:
				m = "uint32";
				break;
			case ScalarType.DOUBLE:
				t = WireType.Bit64;
				m = "double";
				break;
			case ScalarType.FLOAT:
				t = WireType.Bit32;
				m = "float";
				break;
			case ScalarType.INT64:
				d = i || PbLong.from(value).isZero();
				m = "int64";
				break;
			case ScalarType.UINT64:
				d = i || PbULong.from(value).isZero();
				m = "uint64";
				break;
			case ScalarType.FIXED64:
				d = i || PbULong.from(value).isZero();
				t = WireType.Bit64;
				m = "fixed64";
				break;
			case ScalarType.BYTES:
				d = i || !value.byteLength;
				t = WireType.LengthDelimited;
				m = "bytes";
				break;
			case ScalarType.FIXED32:
				t = WireType.Bit32;
				m = "fixed32";
				break;
			case ScalarType.SFIXED32:
				t = WireType.Bit32;
				m = "sfixed32";
				break;
			case ScalarType.SFIXED64:
				d = i || PbLong.from(value).isZero();
				t = WireType.Bit64;
				m = "sfixed64";
				break;
			case ScalarType.SINT32:
				m = "sint32";
				break;
			case ScalarType.SINT64:
				d = i || PbLong.from(value).isZero();
				m = "sint64";
		}
		return [
			t,
			m,
			i || d
		];
	}
};
/**
* Creates an instance of the generic message, using the field
* information.
*/
function reflectionCreate(type) {
	/**
	* This ternary can be removed in the next major version.
	* The `Object.create()` code path utilizes a new `messagePrototype`
	* property on the `IMessageType` which has this same `MESSAGE_TYPE`
	* non-enumerable property on it. Doing it this way means that we only
	* pay the cost of `Object.defineProperty()` once per `IMessageType`
	* class of once per "instance". The falsy code path is only provided
	* for backwards compatibility in cases where the runtime library is
	* updated without also updating the generated code.
	*/
	const msg = type.messagePrototype ? Object.create(type.messagePrototype) : Object.defineProperty({}, MESSAGE_TYPE, { value: type });
	for (let field of type.fields) {
		let name = field.localName;
		if (field.opt) continue;
		if (field.oneof) msg[field.oneof] = { oneofKind: void 0 };
		else if (field.repeat) msg[name] = [];
		else switch (field.kind) {
			case "scalar":
				msg[name] = reflectionScalarDefault(field.T, field.L);
				break;
			case "enum":
				msg[name] = 0;
				break;
			case "map": msg[name] = {};
		}
	}
	return msg;
}
/**
* Copy partial data into the target message.
*
* If a singular scalar or enum field is present in the source, it
* replaces the field in the target.
*
* If a singular message field is present in the source, it is merged
* with the target field by calling mergePartial() of the responsible
* message type.
*
* If a repeated field is present in the source, its values replace
* all values in the target array, removing extraneous values.
* Repeated message fields are copied, not merged.
*
* If a map field is present in the source, entries are added to the
* target map, replacing entries with the same key. Entries that only
* exist in the target remain. Entries with message values are copied,
* not merged.
*
* Note that this function differs from protobuf merge semantics,
* which appends repeated fields.
*/
function reflectionMergePartial(info, target, source) {
	let fieldValue, input = source, output;
	for (let field of info.fields) {
		let name = field.localName;
		if (field.oneof) {
			const group = input[field.oneof];
			if ((group === null || group === void 0 ? void 0 : group.oneofKind) == void 0) continue;
			fieldValue = group[name];
			output = target[field.oneof];
			output.oneofKind = group.oneofKind;
			if (fieldValue == void 0) {
				delete output[name];
				continue;
			}
		} else {
			fieldValue = input[name];
			output = target;
			if (fieldValue == void 0) continue;
		}
		if (field.repeat) output[name].length = fieldValue.length;
		switch (field.kind) {
			case "scalar":
			case "enum":
				if (field.repeat) for (let i = 0; i < fieldValue.length; i++) output[name][i] = fieldValue[i];
				else output[name] = fieldValue;
				break;
			case "message":
				let T = field.T();
				if (field.repeat) for (let i = 0; i < fieldValue.length; i++) output[name][i] = T.create(fieldValue[i]);
				else if (output[name] === void 0) output[name] = T.create(fieldValue);
				else T.mergePartial(output[name], fieldValue);
				break;
			case "map": switch (field.V.kind) {
				case "scalar":
				case "enum":
					Object.assign(output[name], fieldValue);
					break;
				case "message":
					let T = field.V.T();
					for (let k of Object.keys(fieldValue)) output[name][k] = T.create(fieldValue[k]);
			}
		}
	}
}
/**
* Determines whether two message of the same type have the same field values.
* Checks for deep equality, traversing repeated fields, oneof groups, maps
* and messages recursively.
* Will also return true if both messages are `undefined`.
*/
function reflectionEquals(info, a, b) {
	if (a === b) return true;
	if (!a || !b) return false;
	for (let field of info.fields) {
		let localName = field.localName;
		let val_a = field.oneof ? a[field.oneof][localName] : a[localName];
		let val_b = field.oneof ? b[field.oneof][localName] : b[localName];
		switch (field.kind) {
			case "enum":
			case "scalar":
				let t = field.kind == "enum" ? ScalarType.INT32 : field.T;
				if (!(field.repeat ? repeatedPrimitiveEq(t, val_a, val_b) : primitiveEq(t, val_a, val_b))) return false;
				break;
			case "map":
				if (!(field.V.kind == "message" ? repeatedMsgEq(field.V.T(), objectValues(val_a), objectValues(val_b)) : repeatedPrimitiveEq(field.V.kind == "enum" ? ScalarType.INT32 : field.V.T, objectValues(val_a), objectValues(val_b)))) return false;
				break;
			case "message":
				let T = field.T();
				if (!(field.repeat ? repeatedMsgEq(T, val_a, val_b) : T.equals(val_a, val_b))) return false;
		}
	}
	return true;
}
var objectValues = Object.values;
function primitiveEq(type, a, b) {
	if (a === b) return true;
	if (type !== ScalarType.BYTES) return false;
	let ba = a;
	let bb = b;
	if (ba.length !== bb.length) return false;
	for (let i = 0; i < ba.length; i++) if (ba[i] != bb[i]) return false;
	return true;
}
function repeatedPrimitiveEq(type, a, b) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) if (!primitiveEq(type, a[i], b[i])) return false;
	return true;
}
function repeatedMsgEq(type, a, b) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) if (!type.equals(a[i], b[i])) return false;
	return true;
}
var baseDescriptors = Object.getOwnPropertyDescriptors(Object.getPrototypeOf({}));
var messageTypeDescriptor = baseDescriptors[MESSAGE_TYPE] = {};
/**
* This standard message type provides reflection-based
* operations to work with a message.
*/
var MessageType = class {
	constructor(name, fields, options) {
		this.defaultCheckDepth = 16;
		this.typeName = name;
		this.fields = fields.map(normalizeFieldInfo);
		this.options = options !== null && options !== void 0 ? options : {};
		messageTypeDescriptor.value = this;
		this.messagePrototype = Object.create(null, baseDescriptors);
		this.refTypeCheck = new ReflectionTypeCheck(this);
		this.refJsonReader = new ReflectionJsonReader(this);
		this.refJsonWriter = new ReflectionJsonWriter(this);
		this.refBinReader = new ReflectionBinaryReader(this);
		this.refBinWriter = new ReflectionBinaryWriter(this);
	}
	create(value) {
		let message = reflectionCreate(this);
		if (value !== void 0) reflectionMergePartial(this, message, value);
		return message;
	}
	/**
	* Clone the message.
	*
	* Unknown fields are discarded.
	*/
	clone(message) {
		let copy = this.create();
		reflectionMergePartial(this, copy, message);
		return copy;
	}
	/**
	* Determines whether two message of the same type have the same field values.
	* Checks for deep equality, traversing repeated fields, oneof groups, maps
	* and messages recursively.
	* Will also return true if both messages are `undefined`.
	*/
	equals(a, b) {
		return reflectionEquals(this, a, b);
	}
	/**
	* Is the given value assignable to our message type
	* and contains no [excess properties](https://www.typescriptlang.org/docs/handbook/interfaces.html#excess-property-checks)?
	*/
	is(arg, depth = this.defaultCheckDepth) {
		return this.refTypeCheck.is(arg, depth, false);
	}
	/**
	* Is the given value assignable to our message type,
	* regardless of [excess properties](https://www.typescriptlang.org/docs/handbook/interfaces.html#excess-property-checks)?
	*/
	isAssignable(arg, depth = this.defaultCheckDepth) {
		return this.refTypeCheck.is(arg, depth, true);
	}
	/**
	* Copy partial data into the target message.
	*/
	mergePartial(target, source) {
		reflectionMergePartial(this, target, source);
	}
	/**
	* Create a new message from binary format.
	*/
	fromBinary(data, options) {
		let opt = binaryReadOptions(options);
		return this.internalBinaryRead(opt.readerFactory(data), data.byteLength, opt);
	}
	/**
	* Read a new message from a JSON value.
	*/
	fromJson(json, options) {
		return this.internalJsonRead(json, jsonReadOptions(options));
	}
	/**
	* Read a new message from a JSON string.
	* This is equivalent to `T.fromJson(JSON.parse(json))`.
	*/
	fromJsonString(json, options) {
		let value = JSON.parse(json);
		return this.fromJson(value, options);
	}
	/**
	* Write the message to canonical JSON value.
	*/
	toJson(message, options) {
		return this.internalJsonWrite(message, jsonWriteOptions(options));
	}
	/**
	* Convert the message to canonical JSON string.
	* This is equivalent to `JSON.stringify(T.toJson(t))`
	*/
	toJsonString(message, options) {
		var _a;
		let value = this.toJson(message, options);
		return JSON.stringify(value, null, (_a = options === null || options === void 0 ? void 0 : options.prettySpaces) !== null && _a !== void 0 ? _a : 0);
	}
	/**
	* Write the message to binary format.
	*/
	toBinary(message, options) {
		let opt = binaryWriteOptions(options);
		return this.internalBinaryWrite(message, opt.writerFactory(), opt).finish();
	}
	/**
	* This is an internal method. If you just want to read a message from
	* JSON, use `fromJson()` or `fromJsonString()`.
	*
	* Reads JSON value and merges the fields into the target
	* according to protobuf rules. If the target is omitted,
	* a new instance is created first.
	*/
	internalJsonRead(json, options, target) {
		if (json !== null && typeof json == "object" && !Array.isArray(json)) {
			let message = target !== null && target !== void 0 ? target : this.create();
			this.refJsonReader.read(json, message, options);
			return message;
		}
		throw new Error(`Unable to parse message ${this.typeName} from JSON ${typeofJsonValue(json)}.`);
	}
	/**
	* This is an internal method. If you just want to write a message
	* to JSON, use `toJson()` or `toJsonString().
	*
	* Writes JSON value and returns it.
	*/
	internalJsonWrite(message, options) {
		return this.refJsonWriter.write(message, options);
	}
	/**
	* This is an internal method. If you just want to write a message
	* in binary format, use `toBinary()`.
	*
	* Serializes the message in binary format and appends it to the given
	* writer. Returns passed writer.
	*/
	internalBinaryWrite(message, writer, options) {
		this.refBinWriter.write(message, writer, options);
		return writer;
	}
	/**
	* This is an internal method. If you just want to read a message from
	* binary data, use `fromBinary()`.
	*
	* Reads data from binary format and merges the fields into
	* the target according to protobuf rules. If the target is
	* omitted, a new instance is created first.
	*/
	internalBinaryRead(reader, length, options, target) {
		let message = target !== null && target !== void 0 ? target : this.create();
		this.refBinReader.read(reader, message, options, length);
		return message;
	}
};
var StreamPosition$Type = class extends MessageType {
	constructor() {
		super("s2.v1.StreamPosition", [{
			no: 1,
			name: "seq_num",
			kind: "scalar",
			T: 4,
			L: 0
		}, {
			no: 2,
			name: "timestamp",
			kind: "scalar",
			T: 4,
			L: 0
		}]);
	}
	create(value) {
		const message = globalThis.Object.create(this.messagePrototype);
		message.seqNum = 0n;
		message.timestamp = 0n;
		if (value !== void 0) reflectionMergePartial(this, message, value);
		return message;
	}
	internalBinaryRead(reader, length, options, target) {
		let message = target ?? this.create(), end = reader.pos + length;
		while (reader.pos < end) {
			let [fieldNo, wireType] = reader.tag();
			switch (fieldNo) {
				case 1:
					message.seqNum = reader.uint64().toBigInt();
					break;
				case 2:
					message.timestamp = reader.uint64().toBigInt();
					break;
				default:
					let u = options.readUnknownField;
					if (u === "throw") throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
					let d = reader.skip(wireType);
					if (u !== false) (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
			}
		}
		return message;
	}
	internalBinaryWrite(message, writer, options) {
		if (message.seqNum !== 0n) writer.tag(1, WireType.Varint).uint64(message.seqNum);
		if (message.timestamp !== 0n) writer.tag(2, WireType.Varint).uint64(message.timestamp);
		let u = options.writeUnknownFields;
		if (u !== false) (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
		return writer;
	}
};
/**
* @generated MessageType for protobuf message s2.v1.StreamPosition
*/
var StreamPosition = new StreamPosition$Type();
var Header$Type = class extends MessageType {
	constructor() {
		super("s2.v1.Header", [{
			no: 1,
			name: "name",
			kind: "scalar",
			T: 12
		}, {
			no: 2,
			name: "value",
			kind: "scalar",
			T: 12
		}]);
	}
	create(value) {
		const message = globalThis.Object.create(this.messagePrototype);
		message.name = /* @__PURE__ */ new Uint8Array(0);
		message.value = /* @__PURE__ */ new Uint8Array(0);
		if (value !== void 0) reflectionMergePartial(this, message, value);
		return message;
	}
	internalBinaryRead(reader, length, options, target) {
		let message = target ?? this.create(), end = reader.pos + length;
		while (reader.pos < end) {
			let [fieldNo, wireType] = reader.tag();
			switch (fieldNo) {
				case 1:
					message.name = reader.bytes();
					break;
				case 2:
					message.value = reader.bytes();
					break;
				default:
					let u = options.readUnknownField;
					if (u === "throw") throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
					let d = reader.skip(wireType);
					if (u !== false) (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
			}
		}
		return message;
	}
	internalBinaryWrite(message, writer, options) {
		if (message.name.length) writer.tag(1, WireType.LengthDelimited).bytes(message.name);
		if (message.value.length) writer.tag(2, WireType.LengthDelimited).bytes(message.value);
		let u = options.writeUnknownFields;
		if (u !== false) (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
		return writer;
	}
};
/**
* @generated MessageType for protobuf message s2.v1.Header
*/
var Header = new Header$Type();
var AppendRecord$Type = class extends MessageType {
	constructor() {
		super("s2.v1.AppendRecord", [
			{
				no: 1,
				name: "timestamp",
				kind: "scalar",
				opt: true,
				T: 4,
				L: 0
			},
			{
				no: 2,
				name: "headers",
				kind: "message",
				repeat: 2,
				T: () => Header
			},
			{
				no: 3,
				name: "body",
				kind: "scalar",
				T: 12
			}
		]);
	}
	create(value) {
		const message = globalThis.Object.create(this.messagePrototype);
		message.headers = [];
		message.body = /* @__PURE__ */ new Uint8Array(0);
		if (value !== void 0) reflectionMergePartial(this, message, value);
		return message;
	}
	internalBinaryRead(reader, length, options, target) {
		let message = target ?? this.create(), end = reader.pos + length;
		while (reader.pos < end) {
			let [fieldNo, wireType] = reader.tag();
			switch (fieldNo) {
				case 1:
					message.timestamp = reader.uint64().toBigInt();
					break;
				case 2:
					message.headers.push(Header.internalBinaryRead(reader, reader.uint32(), options));
					break;
				case 3:
					message.body = reader.bytes();
					break;
				default:
					let u = options.readUnknownField;
					if (u === "throw") throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
					let d = reader.skip(wireType);
					if (u !== false) (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
			}
		}
		return message;
	}
	internalBinaryWrite(message, writer, options) {
		if (message.timestamp !== void 0) writer.tag(1, WireType.Varint).uint64(message.timestamp);
		for (let i = 0; i < message.headers.length; i++) Header.internalBinaryWrite(message.headers[i], writer.tag(2, WireType.LengthDelimited).fork(), options).join();
		if (message.body.length) writer.tag(3, WireType.LengthDelimited).bytes(message.body);
		let u = options.writeUnknownFields;
		if (u !== false) (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
		return writer;
	}
};
/**
* @generated MessageType for protobuf message s2.v1.AppendRecord
*/
var AppendRecord = new AppendRecord$Type();
var AppendInput$Type = class extends MessageType {
	constructor() {
		super("s2.v1.AppendInput", [
			{
				no: 1,
				name: "records",
				kind: "message",
				repeat: 2,
				T: () => AppendRecord
			},
			{
				no: 2,
				name: "match_seq_num",
				kind: "scalar",
				opt: true,
				T: 4,
				L: 0
			},
			{
				no: 3,
				name: "fencing_token",
				kind: "scalar",
				opt: true,
				T: 9
			}
		]);
	}
	create(value) {
		const message = globalThis.Object.create(this.messagePrototype);
		message.records = [];
		if (value !== void 0) reflectionMergePartial(this, message, value);
		return message;
	}
	internalBinaryRead(reader, length, options, target) {
		let message = target ?? this.create(), end = reader.pos + length;
		while (reader.pos < end) {
			let [fieldNo, wireType] = reader.tag();
			switch (fieldNo) {
				case 1:
					message.records.push(AppendRecord.internalBinaryRead(reader, reader.uint32(), options));
					break;
				case 2:
					message.matchSeqNum = reader.uint64().toBigInt();
					break;
				case 3:
					message.fencingToken = reader.string();
					break;
				default:
					let u = options.readUnknownField;
					if (u === "throw") throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
					let d = reader.skip(wireType);
					if (u !== false) (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
			}
		}
		return message;
	}
	internalBinaryWrite(message, writer, options) {
		for (let i = 0; i < message.records.length; i++) AppendRecord.internalBinaryWrite(message.records[i], writer.tag(1, WireType.LengthDelimited).fork(), options).join();
		if (message.matchSeqNum !== void 0) writer.tag(2, WireType.Varint).uint64(message.matchSeqNum);
		if (message.fencingToken !== void 0) writer.tag(3, WireType.LengthDelimited).string(message.fencingToken);
		let u = options.writeUnknownFields;
		if (u !== false) (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
		return writer;
	}
};
/**
* @generated MessageType for protobuf message s2.v1.AppendInput
*/
var AppendInput = new AppendInput$Type();
var AppendAck$Type = class extends MessageType {
	constructor() {
		super("s2.v1.AppendAck", [
			{
				no: 1,
				name: "start",
				kind: "message",
				T: () => StreamPosition
			},
			{
				no: 2,
				name: "end",
				kind: "message",
				T: () => StreamPosition
			},
			{
				no: 3,
				name: "tail",
				kind: "message",
				T: () => StreamPosition
			}
		]);
	}
	create(value) {
		const message = globalThis.Object.create(this.messagePrototype);
		if (value !== void 0) reflectionMergePartial(this, message, value);
		return message;
	}
	internalBinaryRead(reader, length, options, target) {
		let message = target ?? this.create(), end = reader.pos + length;
		while (reader.pos < end) {
			let [fieldNo, wireType] = reader.tag();
			switch (fieldNo) {
				case 1:
					message.start = StreamPosition.internalBinaryRead(reader, reader.uint32(), options, message.start);
					break;
				case 2:
					message.end = StreamPosition.internalBinaryRead(reader, reader.uint32(), options, message.end);
					break;
				case 3:
					message.tail = StreamPosition.internalBinaryRead(reader, reader.uint32(), options, message.tail);
					break;
				default:
					let u = options.readUnknownField;
					if (u === "throw") throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
					let d = reader.skip(wireType);
					if (u !== false) (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
			}
		}
		return message;
	}
	internalBinaryWrite(message, writer, options) {
		if (message.start) StreamPosition.internalBinaryWrite(message.start, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
		if (message.end) StreamPosition.internalBinaryWrite(message.end, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
		if (message.tail) StreamPosition.internalBinaryWrite(message.tail, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
		let u = options.writeUnknownFields;
		if (u !== false) (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
		return writer;
	}
};
/**
* @generated MessageType for protobuf message s2.v1.AppendAck
*/
var AppendAck = new AppendAck$Type();
var SequencedRecord$Type = class extends MessageType {
	constructor() {
		super("s2.v1.SequencedRecord", [
			{
				no: 1,
				name: "seq_num",
				kind: "scalar",
				T: 4,
				L: 0
			},
			{
				no: 2,
				name: "timestamp",
				kind: "scalar",
				T: 4,
				L: 0
			},
			{
				no: 3,
				name: "headers",
				kind: "message",
				repeat: 2,
				T: () => Header
			},
			{
				no: 4,
				name: "body",
				kind: "scalar",
				T: 12
			}
		]);
	}
	create(value) {
		const message = globalThis.Object.create(this.messagePrototype);
		message.seqNum = 0n;
		message.timestamp = 0n;
		message.headers = [];
		message.body = /* @__PURE__ */ new Uint8Array(0);
		if (value !== void 0) reflectionMergePartial(this, message, value);
		return message;
	}
	internalBinaryRead(reader, length, options, target) {
		let message = target ?? this.create(), end = reader.pos + length;
		while (reader.pos < end) {
			let [fieldNo, wireType] = reader.tag();
			switch (fieldNo) {
				case 1:
					message.seqNum = reader.uint64().toBigInt();
					break;
				case 2:
					message.timestamp = reader.uint64().toBigInt();
					break;
				case 3:
					message.headers.push(Header.internalBinaryRead(reader, reader.uint32(), options));
					break;
				case 4:
					message.body = reader.bytes();
					break;
				default:
					let u = options.readUnknownField;
					if (u === "throw") throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
					let d = reader.skip(wireType);
					if (u !== false) (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
			}
		}
		return message;
	}
	internalBinaryWrite(message, writer, options) {
		if (message.seqNum !== 0n) writer.tag(1, WireType.Varint).uint64(message.seqNum);
		if (message.timestamp !== 0n) writer.tag(2, WireType.Varint).uint64(message.timestamp);
		for (let i = 0; i < message.headers.length; i++) Header.internalBinaryWrite(message.headers[i], writer.tag(3, WireType.LengthDelimited).fork(), options).join();
		if (message.body.length) writer.tag(4, WireType.LengthDelimited).bytes(message.body);
		let u = options.writeUnknownFields;
		if (u !== false) (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
		return writer;
	}
};
/**
* @generated MessageType for protobuf message s2.v1.SequencedRecord
*/
var SequencedRecord = new SequencedRecord$Type();
var ReadBatch$Type = class extends MessageType {
	constructor() {
		super("s2.v1.ReadBatch", [{
			no: 1,
			name: "records",
			kind: "message",
			repeat: 2,
			T: () => SequencedRecord
		}, {
			no: 2,
			name: "tail",
			kind: "message",
			T: () => StreamPosition
		}]);
	}
	create(value) {
		const message = globalThis.Object.create(this.messagePrototype);
		message.records = [];
		if (value !== void 0) reflectionMergePartial(this, message, value);
		return message;
	}
	internalBinaryRead(reader, length, options, target) {
		let message = target ?? this.create(), end = reader.pos + length;
		while (reader.pos < end) {
			let [fieldNo, wireType] = reader.tag();
			switch (fieldNo) {
				case 1:
					message.records.push(SequencedRecord.internalBinaryRead(reader, reader.uint32(), options));
					break;
				case 2:
					message.tail = StreamPosition.internalBinaryRead(reader, reader.uint32(), options, message.tail);
					break;
				default:
					let u = options.readUnknownField;
					if (u === "throw") throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
					let d = reader.skip(wireType);
					if (u !== false) (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
			}
		}
		return message;
	}
	internalBinaryWrite(message, writer, options) {
		for (let i = 0; i < message.records.length; i++) SequencedRecord.internalBinaryWrite(message.records[i], writer.tag(1, WireType.LengthDelimited).fork(), options).join();
		if (message.tail) StreamPosition.internalBinaryWrite(message.tail, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
		let u = options.writeUnknownFields;
		if (u !== false) (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
		return writer;
	}
};
/**
* @generated MessageType for protobuf message s2.v1.ReadBatch
*/
var ReadBatch = new ReadBatch$Type();
var textEncoder = new TextEncoder();
var MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
function bigintToSafeNumber(value, field) {
	if (value > MAX_SAFE_BIGINT) throw new S2Error({
		message: `${field} exceeds JavaScript Number.MAX_SAFE_INTEGER (${Number.MAX_SAFE_INTEGER}); use protobuf transport with bigint support or ensure values stay within 53-bit range`,
		code: "UNSAFE_INTEGER",
		status: 0,
		origin: "sdk"
	});
	return Number(value);
}
var toBytes = (value) => {
	if (value === void 0 || value === null) return /* @__PURE__ */ new Uint8Array();
	return typeof value === "string" ? textEncoder.encode(value) : value;
};
var toProtoHeaders = (headers) => {
	if (!headers) return [];
	return headers.map(([name, value]) => ({
		name: toBytes(name),
		value: toBytes(value)
	}));
};
var toProtoAppendRecord = (record) => {
	let timestamp;
	if (record.timestamp !== void 0) {
		const ms = typeof record.timestamp === "number" ? record.timestamp : record.timestamp.getTime();
		timestamp = BigInt(ms);
	}
	return {
		timestamp,
		headers: toProtoHeaders(record.headers),
		body: toBytes(record.body)
	};
};
var fromProtoPosition = (position) => {
	if (!position) return;
	return {
		seq_num: bigintToSafeNumber(position.seqNum, "StreamPosition.seqNum"),
		timestamp: Number(position.timestamp)
	};
};
var toSDKStreamPosition = (pos) => {
	return {
		seqNum: pos.seq_num,
		timestamp: new Date(pos.timestamp)
	};
};
var fromProtoSequencedRecord = (record) => {
	return {
		seq_num: bigintToSafeNumber(record.seqNum, "SequencedRecord.seqNum"),
		timestamp: Number(record.timestamp),
		headers: record.headers?.map((header) => [header.name, header.value]) ?? [],
		body: record.body
	};
};
/**
* Convert a raw protobuf SequencedRecord to the requested ReadRecord format.
* Used by the S2S transport for record conversion.
*/
function convertProtoRecord(record, format, textDecoder = new TextDecoder()) {
	if (record.seqNum === void 0 || record.timestamp === void 0) throw new S2Error({
		message: "Malformed SequencedRecord: missing required seqNum or timestamp",
		status: 500,
		origin: "sdk"
	});
	if (format === "bytes") return {
		seq_num: bigintToSafeNumber(record.seqNum, "SequencedRecord.seqNum"),
		timestamp: bigintToSafeNumber(record.timestamp, "SequencedRecord.timestamp"),
		headers: record.headers?.map((h) => [h.name ?? /* @__PURE__ */ new Uint8Array(), h.value ?? /* @__PURE__ */ new Uint8Array()]),
		body: record.body
	};
	const headerEntries = record.headers?.map((h) => [h.name ? textDecoder.decode(h.name) : "", h.value ? textDecoder.decode(h.value) : ""]);
	return {
		seq_num: bigintToSafeNumber(record.seqNum, "SequencedRecord.seqNum"),
		timestamp: bigintToSafeNumber(record.timestamp, "SequencedRecord.timestamp"),
		headers: headerEntries,
		body: record.body ? textDecoder.decode(record.body) : void 0
	};
}
var buildProtoAppendInput = (input) => {
	return AppendInput.create({
		records: [...input.records].map((record) => toProtoAppendRecord(record)),
		fencingToken: input.fencingToken === null ? void 0 : input.fencingToken ?? void 0,
		matchSeqNum: input.matchSeqNum !== void 0 ? BigInt(input.matchSeqNum) : void 0
	});
};
var ensureUint8Array = (data) => {
	return data instanceof Uint8Array ? data : new Uint8Array(data);
};
var encodeProtoAppendInput = (input) => {
	return AppendInput.toBinary(buildProtoAppendInput(input));
};
var decodeProtoAppendAck = (data) => {
	return AppendAck.fromBinary(ensureUint8Array(data));
};
var protoAppendAckToJson = (ack) => {
	const start = fromProtoPosition(ack.start);
	const end = fromProtoPosition(ack.end);
	if (!start || !end) throw new S2Error({
		message: "AppendAck missing start or end positions",
		status: 500,
		origin: "sdk"
	});
	const tail = fromProtoPosition(ack.tail) ?? end;
	return {
		start: toSDKStreamPosition(start),
		end: toSDKStreamPosition(end),
		tail: toSDKStreamPosition(tail)
	};
};
var decodeProtoReadBatch = (data) => {
	const protoBatch = ReadBatch.fromBinary(ensureUint8Array(data));
	return {
		records: protoBatch.records.map((record) => fromProtoSequencedRecord(record)),
		tail: fromProtoPosition(protoBatch.tail)
	};
};
function mergeHeaders(...headersList) {
	const merged = Object.assign({}, ...headersList.filter((headers) => Boolean(headers)));
	return Object.keys(merged).length > 0 ? merged : void 0;
}
async function streamRead(stream, client, args, options) {
	const { as, ignore_command_records, ...queryParams } = args ?? {};
	const { headers: customHeaders, ...requestOptions } = options ?? {};
	const wantsBytes = (as ?? "string") === "bytes";
	let response;
	try {
		response = await read({
			client,
			path: { stream },
			headers: mergeHeaders(customHeaders, wantsBytes ? { Accept: "application/protobuf" } : void 0),
			query: queryParams,
			parseAs: wantsBytes ? "arrayBuffer" : void 0,
			...requestOptions
		});
	} catch (error) {
		throw s2Error(error);
	}
	if (response.error || !response.response.ok) {
		const status = response.response.status;
		if (status === 416) {
			const err = response.error;
			throw new RangeNotSatisfiableError({
				status,
				tail: err?.tail,
				code: err?.code
			});
		}
		throw makeServerError({
			status,
			statusText: response.response.statusText
		}, response.error);
	}
	if (wantsBytes) return decodeProtoReadBatch(response.data);
	return {
		...response.data,
		records: response.data.records?.map((record) => ({
			...record,
			headers: record.headers || void 0
		})) ?? []
	};
}
async function streamAppend(stream, client, input, options) {
	const { preferProtobuf, headers: customHeaders, ...requestOptions } = options ?? {};
	const useProtobuf = input.records.some((record) => computeAppendRecordFormat(record) === "bytes") || preferProtobuf === true;
	let response;
	if (useProtobuf) {
		const protoBody = encodeProtoAppendInput(input);
		const headers = mergeHeaders(customHeaders, {
			Accept: "application/protobuf",
			"Content-Type": "application/protobuf"
		});
		try {
			response = await append({
				client,
				path: { stream },
				body: protoBody,
				bodySerializer: null,
				parseAs: "arrayBuffer",
				headers,
				...requestOptions
			});
		} catch (error) {
			throw s2Error(error);
		}
		if (response.error || !response.response.ok) {
			const status = response.response.status;
			if (status === 412) throw makeAppendPreconditionError(status, response.error);
			throw makeServerError({
				status,
				statusText: response.response.statusText
			}, response.error);
		}
		return protoAppendAckToJson(decodeProtoAppendAck(response.data));
	}
	const encodedRecords = [...input.records].map(toAPIAppendRecord);
	try {
		response = await append({
			client,
			path: { stream },
			body: {
				fencing_token: input.fencingToken,
				match_seq_num: input.matchSeqNum,
				records: encodedRecords
			},
			headers: customHeaders,
			...requestOptions
		});
	} catch (error) {
		throw s2Error(error);
	}
	if (response.error || !response.response.ok) {
		const status = response.response.status;
		if (status === 412) throw makeAppendPreconditionError(status, response.error);
		throw makeServerError({
			status,
			statusText: response.response.statusText
		}, response.error);
	}
	return fromAPIAppendAck(response.data);
}
var debug$1 = (0, import_src.default)("s2:fetch");
var FetchReadSession = class FetchReadSession extends ReadableStream {
	static async create(client, name, args, options) {
		debug$1("FetchReadSession.create stream=%s args=%o", name, args);
		const { as, ignore_command_records, ...queryParams } = args ?? {};
		const response = await read({
			client,
			path: { stream: name },
			headers: {
				accept: "text/event-stream",
				...as === "bytes" ? { "s2-format": "base64" } : {}
			},
			query: queryParams,
			parseAs: "stream",
			...options
		});
		if (response.error) {
			const status = response.response.status;
			throw typeof response.error === "object" && response.error !== null && "message" in response.error ? new S2Error({
				message: response.error.message,
				code: response.error.code ?? void 0,
				status
			}) : status === 416 ? new RangeNotSatisfiableError({ status }) : new S2Error({
				message: response.response.statusText ?? "Request failed",
				status
			});
		}
		if (!response.response.body) throw new S2Error({
			message: "No body in SSE response",
			code: "INVALID_RESPONSE",
			status: 502,
			origin: "sdk"
		});
		const format = args?.as ?? "string";
		return new FetchReadSession(response.response.body, format);
	}
	_nextReadPosition = void 0;
	_lastObservedTail = void 0;
	constructor(stream, format) {
		let parserError = null;
		let lastPingTimeMs = performance.now();
		const PING_TIMEOUT_MS = 2e4;
		const reader = new EventStream(stream, (msg) => {
			lastPingTimeMs = performance.now();
			if (msg.event === "batch" && msg.data) {
				const rawBatch = JSON.parse(msg.data);
				const batch = (() => {
					if (format === "bytes") return {
						...rawBatch,
						records: rawBatch.records.map((record) => ({
							...record,
							body: record.body ? decodeFromBase64(record.body) : void 0,
							headers: record.headers?.map((header) => header.map((h) => decodeFromBase64(h)))
						}))
					};
					else return {
						...rawBatch,
						records: rawBatch.records.map((record) => ({
							...record,
							headers: record.headers || void 0
						}))
					};
				})();
				if (batch.tail) this._lastObservedTail = batch.tail;
				let lastRecord = batch.records?.at(-1);
				if (lastRecord) this._nextReadPosition = {
					seq_num: lastRecord.seq_num + 1,
					timestamp: lastRecord.timestamp
				};
				return {
					done: false,
					batch: true,
					value: batch.records ?? []
				};
			}
			if (msg.event === "error") {
				debug$1("parse event error");
				parserError = new S2Error({
					message: msg.data ?? "Unknown error",
					status: 503
				});
				return { done: true };
			}
			if (msg.event === "ping") debug$1("ping");
			return { done: false };
		}).getReader();
		let done = false;
		let pendingRead = null;
		super({
			pull: async (controller) => {
				while (true) {
					if (done) {
						controller.close();
						return;
					}
					const capturedLastPingTime = lastPingTimeMs;
					const remainingTimeMs = PING_TIMEOUT_MS - (performance.now() - lastPingTimeMs);
					if (!pendingRead) pendingRead = reader.read();
					const currentRead = pendingRead;
					try {
						const result = await Promise.race([currentRead.then((r) => {
							pendingRead = null;
							return {
								type: "data",
								value: r
							};
						}), new Promise((resolve) => setTimeout(() => {
							if (lastPingTimeMs === capturedLastPingTime) {
								debug$1("read session ping timeout");
								resolve({ type: "timeout" });
							} else {
								debug$1("stale timeout, activity detected, retrying");
								resolve({ type: "stale" });
							}
						}, remainingTimeMs))]);
						if (result.type === "stale") continue;
						if (result.type === "timeout") {
							const elapsed = performance.now() - lastPingTimeMs;
							const timeoutError = new S2Error({
								message: `No ping received for ${Math.floor(elapsed / 1e3)}s (timeout: ${PING_TIMEOUT_MS / 1e3}s)`,
								status: 408,
								code: "TIMEOUT"
							});
							controller.enqueue({
								ok: false,
								error: timeoutError
							});
							done = true;
							await reader.cancel();
							controller.close();
							return;
						}
						if (result.value.done) {
							done = true;
							if (parserError) controller.enqueue({
								ok: false,
								error: parserError
							});
							controller.close();
						} else controller.enqueue({
							ok: true,
							value: result.value.value
						});
						return;
					} catch (error) {
						controller.enqueue({
							ok: false,
							error: s2Error(error)
						});
						done = true;
						await reader.cancel();
						controller.close();
						return;
					}
				}
			},
			cancel: async () => {
				await reader.cancel();
			}
		});
	}
	nextReadPosition() {
		return this._nextReadPosition;
	}
	lastObservedTail() {
		return this._lastObservedTail;
	}
	[Symbol.asyncIterator]() {
		const fn = ReadableStream.prototype[Symbol.asyncIterator];
		if (typeof fn === "function") try {
			return fn.call(this);
		} catch {}
		const reader = this.getReader();
		return {
			next: async () => {
				const r = await reader.read();
				if (r.done) return {
					done: true,
					value: void 0
				};
				return {
					done: false,
					value: r.value
				};
			},
			return: async (value) => {
				try {
					await reader.cancel();
				} catch (err) {
					if (err?.code !== "ERR_INVALID_STATE") throw err;
				}
				reader.releaseLock();
				return {
					done: true,
					value
				};
			},
			throw: async (e) => {
				try {
					await reader.cancel(e);
				} catch (err) {
					if (err?.code !== "ERR_INVALID_STATE") throw err;
				}
				reader.releaseLock();
				throw e;
			},
			[Symbol.asyncIterator]() {
				return this;
			}
		};
	}
	async [Symbol.asyncDispose]() {
		await this.cancel();
	}
};
/**
* Fetch-based transport session for appending records via HTTP/1.1.
* Queues append requests and ensures only one is in-flight at a time (single-flight).
* No backpressure, no retry logic, no streams - just submit/close with value-encoded errors.
*/
var FetchAppendSession = class FetchAppendSession {
	queue = [];
	pendingResolvers = [];
	inFlight = false;
	_effectSignalled = false;
	options;
	stream;
	closed = false;
	processingPromise = null;
	client;
	static async create(stream, transportConfig, sessionOptions, requestOptions) {
		return new FetchAppendSession(stream, transportConfig, sessionOptions, requestOptions);
	}
	constructor(stream, transportConfig, sessionOptions, requestOptions) {
		this.options = requestOptions;
		this.stream = stream;
		debug$1("[%s] FetchAppendSession created", stream);
		const headers = {};
		if (transportConfig.basinName) headers["s2-basin"] = transportConfig.basinName;
		if (transportConfig.encryptionKey) headers[S2_ENCRYPTION_KEY_HEADER] = value(transportConfig.encryptionKey);
		if (canSetUserAgentHeader()) headers["user-agent"] = DEFAULT_USER_AGENT;
		this.client = createClient$1(createConfig({
			baseUrl: transportConfig.baseUrl,
			auth: () => value(transportConfig.accessToken),
			headers
		}));
	}
	/**
	* Returns true if data may have been sent to the server since the
	* last time the session was dormant (queue fully drained with no errors).
	* Only resets after the processing loop completes successfully.
	*/
	effectSignalled() {
		return this._effectSignalled;
	}
	/**
	* Close the append session.
	* Waits for all pending appends to complete before resolving.
	* Never throws - returns CloseResult.
	*/
	async close() {
		debug$1("[%s] FetchAppendSession close requested", this.stream);
		try {
			this.closed = true;
			await this.waitForDrain();
			debug$1("[%s] FetchAppendSession close complete", this.stream);
			return okClose();
		} catch (error) {
			const s2Err = s2Error(error);
			debug$1("[%s] FetchAppendSession close error: %s", this.stream, s2Err.message);
			return errClose(s2Err);
		}
	}
	/**
	* Submit an append request to the session.
	* The request will be queued and sent when no other request is in-flight.
	* Never throws - returns AppendResult discriminated union.
	*/
	submit(input) {
		debug$1("[%s] FetchAppendSession.submit: records=%d, match_seq_num=%s, queueLen=%d", this.stream, input.records.length, input.matchSeqNum ?? "none", this.queue.length);
		if (this.closed) {
			debug$1("[%s] FetchAppendSession.submit: session closed, rejecting", this.stream);
			return Promise.resolve(err(new S2Error({
				message: "AppendSession is closed",
				status: 400
			})));
		}
		if (input.records.length > 1e3) {
			debug$1("[%s] FetchAppendSession.submit: batch too large (%d records)", this.stream, input.records.length);
			return Promise.resolve(err(new S2Error({
				message: `Batch of ${input.records.length} exceeds maximum batch size of 1000 records`,
				status: 400,
				code: "INVALID_ARGUMENT"
			})));
		}
		const batchMeteredSize = input.meteredBytes;
		if (batchMeteredSize > 1048576) {
			debug$1("[%s] FetchAppendSession.submit: batch too large (%d bytes)", this.stream, batchMeteredSize);
			return Promise.resolve(err(new S2Error({
				message: `Batch size ${batchMeteredSize} bytes exceeds maximum of 1 MiB (1048576 bytes)`,
				status: 400,
				code: "INVALID_ARGUMENT"
			})));
		}
		return new Promise((resolve) => {
			this.queue.push(input);
			this.pendingResolvers.push({ resolve });
			debug$1("[%s] FetchAppendSession.submit: queued, queueLen=%d", this.stream, this.queue.length);
			if (!this.processingPromise) this.processingPromise = this.processLoop().catch(() => {});
		});
	}
	/**
	* Main processing loop that sends queued requests one at a time.
	* Single-flight: only one request in progress at a time.
	*/
	async processLoop() {
		debug$1("[%s] FetchAppendSession.processLoop: starting", this.stream);
		while (this.queue.length > 0) {
			this.inFlight = true;
			const input = this.queue.shift();
			const resolver = this.pendingResolvers.shift();
			debug$1("[%s] FetchAppendSession.processLoop: sending %d records, match_seq_num=%s", this.stream, input.records.length, input.matchSeqNum ?? "none");
			this._effectSignalled = true;
			try {
				const preferProtobuf = input.records.some((record) => computeAppendRecordFormat(record) === "bytes");
				const appendOptions = this.options ? {
					...this.options,
					preferProtobuf
				} : { preferProtobuf };
				const ack = await streamAppend(this.stream, this.client, input, appendOptions);
				debug$1("[%s] FetchAppendSession.processLoop: success, seq_num=%d-%d", this.stream, ack.start.seqNum, ack.end.seqNum);
				resolver.resolve(ok(ack));
			} catch (error) {
				const s2Err = s2Error(error);
				debug$1("[%s] FetchAppendSession.processLoop: error, status=%s, message=%s", this.stream, s2Err.status, s2Err.message);
				resolver.resolve(err(s2Err));
				debug$1("[%s] FetchAppendSession.processLoop: failing %d queued requests", this.stream, this.pendingResolvers.length);
				for (const pendingResolver of this.pendingResolvers) pendingResolver.resolve(err(s2Err));
				this.pendingResolvers = [];
				this.queue = [];
				this.inFlight = false;
				this.processingPromise = null;
				return;
			}
			this.inFlight = false;
		}
		this._effectSignalled = false;
		debug$1("[%s] FetchAppendSession.processLoop: done", this.stream);
		this.processingPromise = null;
	}
	async waitForDrain() {
		if (this.processingPromise) await this.processingPromise;
		while (this.queue.length > 0 || this.inFlight) await new Promise((resolve) => setTimeout(resolve, 10));
	}
};
/**
* Fetch-based transport using HTTP/1.1 + JSON
* Works in all JavaScript environments (browser, Node.js, Deno, etc.)
*/
var FetchTransport = class {
	client;
	transportConfig;
	constructor(config) {
		const headers = {};
		if (config.basinName) headers["s2-basin"] = config.basinName;
		if (config.encryptionKey) headers[S2_ENCRYPTION_KEY_HEADER] = value(config.encryptionKey);
		if (canSetUserAgentHeader()) headers["user-agent"] = DEFAULT_USER_AGENT;
		this.client = createClient$1(createConfig({
			baseUrl: config.baseUrl,
			auth: () => value(config.accessToken),
			headers
		}));
		this.transportConfig = config;
	}
	async makeAppendSession(stream, sessionOptions, requestOptions) {
		return RetryAppendSession.create((myOptions) => {
			return FetchAppendSession.create(stream, this.transportConfig, myOptions, requestOptions);
		}, sessionOptions, this.transportConfig.retry, stream);
	}
	async makeReadSession(stream, args, options) {
		return RetryReadSession.create((myArgs) => {
			return FetchReadSession.create(this.client, stream, myArgs, options);
		}, args, this.transportConfig.retry);
	}
	async close() {}
};
/**
* Transport factory - selects the appropriate transport based on runtime
*/
/**
* Create a transport instance based on the runtime environment
*
* - In Node.js with HTTP/2 support: uses S2STransport (binary protocol over HTTP/2)
* - Everywhere else: uses FetchTransport (JSON over HTTP/1.1)
*
* @param config Transport configuration
*/
async function createSessionTransport(config) {
	if (config?.forceTransport === "fetch") return new FetchTransport(config);
	else if (config?.forceTransport === "s2s") {
		const { S2STransport } = await import("./s2s-DjCcBHec.mjs");
		return new S2STransport(config);
	}
	if (supportsHttp2()) {
		const { S2STransport } = await import("./s2s-DjCcBHec.mjs");
		return new S2STransport(config);
	}
	return new FetchTransport(config);
}
/**
* Basin-scoped stream helper for append/read operations.
*
* Created via {@link S2Basin.stream}. Provides direct methods plus factories for read/append sessions.
*/
var S2Stream = class S2Stream {
	client;
	transportConfig;
	retryConfig;
	_transportPromise;
	closed = false;
	closePromise;
	name;
	constructor(name, client, transportConfig, retryConfig) {
		this.name = name;
		this.client = client;
		this.transportConfig = transportConfig;
		this.retryConfig = retryConfig;
	}
	/**
	* Get or create the transport instance
	*/
	async getTransport() {
		this.ensureOpen();
		if (!this._transportPromise) this._transportPromise = createSessionTransport(this.transportConfig).catch((err) => {
			this._transportPromise = void 0;
			throw err;
		});
		return this._transportPromise;
	}
	ensureOpen() {
		if (this.closed) throw new S2Error({ message: "S2Stream is closed" });
	}
	withEncryptionHeaders(options) {
		const encryptionKey = this.transportConfig.encryptionKey;
		if (!encryptionKey) return options;
		const requestOptions = options ?? {};
		return {
			...requestOptions,
			headers: {
				...requestOptions.headers ?? {},
				[S2_ENCRYPTION_KEY_HEADER]: value(encryptionKey)
			}
		};
	}
	/**
	* Return a new stream handle that sends the supplied encryption key on append/read requests.
	*/
	withEncryptionKey(encryptionKey) {
		return new S2Stream(this.name, this.client, {
			...this.transportConfig,
			encryptionKey: resolveEncryptionKey(encryptionKey)
		}, this.retryConfig);
	}
	/**
	* Check the tail of the stream.
	*
	* Returns the next sequence number and timestamp to be assigned (`tail`).
	*/
	async checkTail(options) {
		this.ensureOpen();
		return await withRetries(this.retryConfig, async () => {
			return fromAPITailResponse(await withS2Data(() => checkTail({
				client: this.client,
				path: { stream: this.name },
				...options
			})));
		});
	}
	/**
	* Read records from the stream.
	*
	* - When `as: "bytes"` is provided, bodies and headers are decoded from base64 to `Uint8Array`.
	* - Supports starting position by `seq_num`, `timestamp`, or `tail_offset` and can clamp to the tail.
	* - Non-streaming reads are bounded by `count` and `bytes` (defaults 1000 and 1 MiB).
	* - Use `readSession` for streaming reads
	*/
	async read(input, options) {
		this.ensureOpen();
		const { as, ...requestOptions } = options ?? {};
		return await withRetries(this.retryConfig, async () => {
			let currentInput = input;
			while (true) {
				const readArgs = {
					...toAPIReadQuery(currentInput),
					as,
					ignore_command_records: input?.ignoreCommandRecords
				};
				const genBatch = await streamRead(this.name, this.client, readArgs, this.withEncryptionHeaders(requestOptions));
				const batch = as === "bytes" ? fromAPIReadBatchBytes(genBatch) : fromAPIReadBatchString(genBatch);
				if (!input?.ignoreCommandRecords) return batch;
				const filtered = batch.records.filter((r) => !isCommandRecord(r));
				if (filtered.length > 0 || batch.records.length === 0) return {
					...batch,
					records: filtered
				};
				const lastRecord = batch.records[batch.records.length - 1];
				currentInput = {
					...input,
					start: {
						from: { seqNum: lastRecord.seqNum + 1 },
						clamp: input?.start?.clamp
					}
				};
			}
		});
	}
	/**
	* Append a batch of records to the stream.
	*
	* - Automatically base64-encodes when format is "bytes".
	* - Supports conditional appends via `fencingToken` and `matchSeqNum` in the input.
	* - Returns the acknowledged range and the stream tail after the append.
	* - All records in a batch must use the same format (either all string or all bytes).
	*
	* Use {@link AppendInput.create} to construct a validated AppendInput.
	* For high-throughput sequential appends, use `appendSession()` instead.
	*
	* @param input The append input containing records and optional conditions
	* @param options Optional request options
	*/
	async append(input, options) {
		this.ensureOpen();
		return await withRetries(this.retryConfig, async () => {
			return await streamAppend(this.name, this.client, input, this.withEncryptionHeaders(options));
		}, (config, error) => {
			if ((config.appendRetryPolicy ?? "all") === "noSideEffects") return error.hasNoSideEffects();
			return true;
		});
	}
	/**
	* Open a streaming read session
	*
	* Use the returned session as an async iterable or as a readable stream.
	* When `as: "bytes"` is provided, bodies and headers are decoded to `Uint8Array`.
	*/
	async readSession(input, options) {
		this.ensureOpen();
		const { as, ...requestOptions } = options ?? {};
		const transport = await this.getTransport();
		this.ensureOpen();
		const readArgs = {
			...toAPIReadQuery(input),
			as,
			ignore_command_records: input?.ignoreCommandRecords
		};
		return await transport.makeReadSession(this.name, readArgs, requestOptions);
	}
	/**
	* Create an append session that guarantees ordering of submissions.
	*
	* Use this to coordinate high-throughput, sequential appends with backpressure.
	* Records can be either string or bytes format - the format is specified in each record.
	*
	* @param sessionOptions Options that control append session behavior
	* @param requestOptions Optional request options
	*/
	async appendSession(sessionOptions, requestOptions) {
		this.ensureOpen();
		const transport = await this.getTransport();
		this.ensureOpen();
		return await transport.makeAppendSession(this.name, sessionOptions, requestOptions);
	}
	async close() {
		if (this.closePromise) return this.closePromise;
		this.closePromise = (async () => {
			if (this.closed) return;
			this.closed = true;
			if (this._transportPromise) try {
				await (await this._transportPromise).close();
			} finally {
				this._transportPromise = void 0;
			}
		})();
		try {
			await this.closePromise;
		} finally {
			this.closePromise = void 0;
		}
	}
	async [Symbol.asyncDispose]() {
		await this.close();
	}
};
/**
* Type-level and runtime utilities for converting between snake_case and camelCase.
*
* These utilities allow the SDK to expose camelCase APIs to users while the
* generated types from OpenAPI use snake_case to match the wire format.
*/
/**
* Convert a snake_case string to camelCase at runtime.
*/
function snakeToCamelString(str) {
	const parts = str.split("_");
	return parts[0] + parts.slice(1).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");
}
/**
* Convert a camelCase string to snake_case at runtime.
*/
function camelToSnakeString(str) {
	return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
/**
* Recursively transform all keys in an object from snake_case to camelCase at runtime.
*
* @example
* const api = { seq_num: 123, created_at: "2024-01-01" };
* const sdk = toCamelCase(api); // { seqNum: 123, createdAt: "2024-01-01" }
*/
function toCamelCase(obj) {
	if (obj === null || obj === void 0) return obj;
	if (typeof obj !== "object") return obj;
	if (Array.isArray(obj)) return obj.map((item) => toCamelCase(item));
	if (ArrayBuffer.isView(obj)) return obj;
	const proto = Object.getPrototypeOf(obj);
	if (proto !== Object.prototype && proto !== null) return obj;
	const result = {};
	for (const [key, value] of Object.entries(obj)) result[snakeToCamelString(key)] = toCamelCase(value);
	return result;
}
/**
* Recursively transform all keys in an object from camelCase to snake_case at runtime.
*
* @example
* const sdk = { seqNum: 123, createdAt: "2024-01-01" };
* const api = toSnakeCase(sdk); // { seq_num: 123, created_at: "2024-01-01" }
*/
function toSnakeCase(obj) {
	if (obj === null || obj === void 0) return obj;
	if (typeof obj !== "object") return obj;
	if (Array.isArray(obj)) return obj.map((item) => toSnakeCase(item));
	if (ArrayBuffer.isView(obj)) return obj;
	const proto = Object.getPrototypeOf(obj);
	if (proto !== Object.prototype && proto !== null) return obj;
	const result = {};
	for (const [key, value] of Object.entries(obj)) result[camelToSnakeString(key)] = toSnakeCase(value);
	return result;
}
var debug = (0, import_src.default)("s2:paginate");
/**
* Creates a lazy async iterable that automatically paginates through all results.
*
* @template TItem The type of items being paginated
* @template TArgs The query arguments type
* @param fetcher Function that fetches a single page of results
* @param args Query arguments (startAfter is managed internally)
* @param getCursor Function to extract the cursor value from an item for the next page
* @returns An async iterable that yields items one at a time, fetching pages as needed
*
* @example
* ```ts
* const allBasins = paginate(
*   (args) => this.list(args).then(r => ({ items: r.basins, hasMore: r.hasMore })),
*   { prefix: "my-" },
*   (basin) => basin.name
* );
*
* for await (const basin of allBasins) {
*   console.log(basin.name);
* }
* ```
*/
function paginate(fetcher, args, getCursor) {
	return { [Symbol.asyncIterator]: async function* () {
		let cursor;
		while (true) {
			debug({
				args,
				cursor
			});
			const { items, hasMore } = await fetcher({
				...args,
				startAfter: cursor
			});
			for (const item of items) yield item;
			if (!hasMore || items.length === 0) break;
			cursor = getCursor(items[items.length - 1]);
		}
	} };
}
/**
* Filters an async iterable, yielding only items that match the predicate.
*
* @template T The type of items in the iterable
* @param source The async iterable to filter
* @param predicate Function that returns true for items to keep
* @returns A new async iterable yielding only matching items
*/
function filterAsync(source, predicate) {
	return { [Symbol.asyncIterator]: async function* () {
		for await (const item of source) if (predicate(item)) yield item;
	} };
}
function toDate$1(value) {
	if (value === null) return null;
	if (value === void 0) return void 0;
	return new Date(value);
}
function transformStreamInfo(stream) {
	return {
		...stream,
		createdAt: toDate$1(stream.createdAt),
		deletedAt: toDate$1(stream.deletedAt)
	};
}
/** Convert SDK RetentionPolicy (ageSecs) to API RetentionPolicy (age). */
function toAPIRetentionPolicy$1(policy) {
	if (policy === null) return null;
	if (policy === void 0) return void 0;
	if ("ageSecs" in policy) return { age: Math.floor(policy.ageSecs) };
	return policy;
}
/** Convert API RetentionPolicy (age) to SDK RetentionPolicy (ageSecs). */
function toSDKRetentionPolicy$1(policy) {
	if (policy === null) return null;
	if (policy === void 0) return void 0;
	if ("age" in policy) return { ageSecs: policy.age };
	return policy;
}
/** Normalize deleteOnEmpty.minAgeSecs (floor and clamp to >= 0). */
function toAPIDeleteOnEmpty(deleteOnEmpty) {
	if (!deleteOnEmpty) return deleteOnEmpty;
	return {
		...deleteOnEmpty,
		minAgeSecs: deleteOnEmpty.minAgeSecs === void 0 ? void 0 : Math.max(0, Math.floor(deleteOnEmpty.minAgeSecs))
	};
}
/** Convert SDK StreamConfig to API format (handles retentionPolicy.ageSecs → age). */
function toAPIStreamConfig$1(config) {
	if (config === null || config === void 0) return config;
	return {
		...config,
		deleteOnEmpty: toAPIDeleteOnEmpty(config.deleteOnEmpty),
		retentionPolicy: toAPIRetentionPolicy$1(config.retentionPolicy)
	};
}
/** Convert API StreamConfig to SDK format (handles retentionPolicy.age → ageSecs). */
function toSDKStreamConfig$1(config) {
	return {
		...config,
		retentionPolicy: toSDKRetentionPolicy$1(config?.retentionPolicy)
	};
}
/**
* Basin-scoped helper for listing and configuring streams.
*
* Access via {@link S2Basin.streams}. Methods inherit the basin's retry configuration.
*/
var S2Streams = class {
	client;
	retryConfig;
	constructor(client, retryConfig) {
		this.client = client;
		this.retryConfig = retryConfig;
	}
	/**
	* List streams in the basin.
	*
	* @param args.prefix Return streams whose names start with the given prefix
	* @param args.startAfter Name to start after (for pagination)
	* @param args.limit Max results (up to 1000)
	*/
	async list(args, options) {
		const camelCased = toCamelCase(await withRetries(this.retryConfig, async () => {
			return await withS2Data(() => listStreams({
				client: this.client,
				query: toSnakeCase(args),
				...options
			}));
		}));
		return {
			...camelCased,
			streams: camelCased.streams.map(transformStreamInfo)
		};
	}
	/**
	* List all streams in the basin with automatic pagination.
	* Returns a lazy async iterable that fetches pages as needed.
	*
	* @param args - Optional options: `prefix` to filter by name prefix, `limit` for max results per page, `includeDeleted` to include streams pending deletion
	*
	* @example
	* ```ts
	* for await (const stream of basin.streams.listAll({ prefix: "events-" })) {
	*   console.log(stream.name);
	* }
	* ```
	*/
	listAll(args, options) {
		const { includeDeleted, ...listArgs } = args ?? {};
		const allItems = paginate((a) => this.list(a, options).then((r) => ({
			items: r.streams,
			hasMore: r.hasMore
		})), listArgs, (stream) => stream.name);
		if (includeDeleted) return allItems;
		return filterAsync(allItems, (s) => !s.deletedAt);
	}
	/**
	* Create a stream.
	*
	* @param args.stream Stream name (1-512 bytes, unique within the basin)
	* @param args.config Stream configuration (retentionPolicy, storageClass, timestamping, deleteOnEmpty)
	*/
	async create(args, options) {
		const requestToken = randomToken();
		const apiArgs = {
			...args,
			config: toAPIStreamConfig$1(args.config)
		};
		return toCamelCase(await withRetries(this.retryConfig, async () => {
			return await withS2Data(() => createStream({
				client: this.client,
				body: toSnakeCase(apiArgs),
				headers: { "s2-request-token": requestToken },
				...options
			}));
		}));
	}
	/**
	* Get stream configuration.
	*
	* @param args.stream Stream name
	*/
	async getConfig(args, options) {
		return toSDKStreamConfig$1(toCamelCase(await withRetries(this.retryConfig, async () => {
			return await withS2Data(() => getStreamConfig({
				client: this.client,
				path: args,
				...options
			}));
		})));
	}
	/**
	* Delete a stream.
	*
	* @param args.stream Stream name
	*/
	async delete(args, options) {
		await withRetries(this.retryConfig, async () => {
			return await withS2Data(() => deleteStream({
				client: this.client,
				path: args,
				...options
			}));
		});
	}
	/**
	* Reconfigure a stream.
	*
	* @param args Configuration for the stream to reconfigure (including stream name and fields to change)
	*/
	async reconfigure(args, options) {
		const { stream, ...reconfigArgs } = args;
		const apiArgs = {
			...reconfigArgs,
			deleteOnEmpty: toAPIDeleteOnEmpty(reconfigArgs.deleteOnEmpty),
			retentionPolicy: toAPIRetentionPolicy$1(args.retentionPolicy)
		};
		return toSDKStreamConfig$1(toCamelCase(await withRetries(this.retryConfig, async () => {
			return await withS2Data(() => reconfigureStream({
				client: this.client,
				path: { stream },
				body: toSnakeCase(apiArgs),
				...options
			}));
		})));
	}
};
var S2Basin = class {
	client;
	transportConfig;
	retryConfig;
	name;
	streams;
	/**
	* Create a basin-scoped client that talks to `https://{basin}.b.s2.dev/v1`.
	*
	* Use this to work with streams inside a single basin.
	* @param name Basin name
	* @param options Configuration for the basin-scoped client
	*/
	constructor(name, options) {
		this.name = name;
		this.retryConfig = options.retryConfig;
		this.transportConfig = {
			baseUrl: options.baseUrl,
			accessToken: options.accessToken,
			basinName: options.includeBasinHeader ? name : void 0,
			connectionTimeoutMillis: options.retryConfig?.connectionTimeoutMillis,
			requestTimeoutMillis: options.retryConfig?.requestTimeoutMillis,
			retry: options.retryConfig
		};
		const headers = {};
		if (options.includeBasinHeader) headers["s2-basin"] = name;
		if (canSetUserAgentHeader()) headers["user-agent"] = DEFAULT_USER_AGENT;
		this.client = createClient$1(createConfig({
			baseUrl: options.baseUrl,
			auth: () => value(this.transportConfig.accessToken),
			headers
		}));
		this.streams = new S2Streams(this.client, this.retryConfig);
	}
	/**
	* Create a stream-scoped helper bound to `this` basin.
	* @param name Stream name
	*/
	stream(name, options) {
		return new S2Stream(name, this.client, {
			...this.transportConfig,
			encryptionKey: resolveEncryptionKey(options?.encryptionKey),
			forceTransport: options?.forceTransport
		}, this.retryConfig);
	}
};
var DEFAULT_SCHEME = "https";
var DEFAULT_API_PATH = "/v1";
var BASIN_PLACEHOLDER_SENTINEL = "__basin__";
function hasScheme(input) {
	return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(input);
}
function firstDelimiterIndex(value, fromIndex) {
	const candidates = [
		value.indexOf("/", fromIndex),
		value.indexOf("?", fromIndex),
		value.indexOf("#", fromIndex)
	].filter((idx) => idx !== -1);
	return candidates.length ? Math.min(...candidates) : -1;
}
function hasExplicitPath(input) {
	const trimmed = input.trim();
	const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//);
	const delim = firstDelimiterIndex(trimmed, schemeMatch ? schemeMatch[0].length : 0);
	return delim !== -1 && trimmed[delim] === "/";
}
function normalizeForUrlParsing(input) {
	const trimmed = input.trim();
	return (hasScheme(trimmed) ? trimmed : `${DEFAULT_SCHEME}://${trimmed}`).replaceAll("{basin}", BASIN_PLACEHOLDER_SENTINEL);
}
function asScheme(protocol) {
	const normalized = protocol.replace(":", "").toLowerCase();
	if (normalized === "http" || normalized === "https") return normalized;
	throw new Error(`Unsupported scheme: ${protocol}`);
}
var EndpointTemplate = class {
	raw;
	scheme;
	hostTemplate;
	port;
	pathTemplate;
	hasBasinPlaceholder;
	explicitPathProvided;
	constructor({ endpoint }) {
		const raw = endpoint.trim();
		if (!raw) throw new Error("Endpoint cannot be empty");
		const explicitPathProvided = hasExplicitPath(raw);
		const parsed = new URL(normalizeForUrlParsing(raw));
		this.raw = raw;
		this.scheme = asScheme(parsed.protocol);
		this.hostTemplate = parsed.hostname.replaceAll(BASIN_PLACEHOLDER_SENTINEL, "{basin}");
		this.port = parsed.port;
		if (parsed.search || parsed.hash) throw new Error(`Endpoint cannot include query string or hash fragment: "${raw}". Use headers for authentication or path prefixes for routing.`);
		const parsedPath = parsed.pathname.replaceAll(BASIN_PLACEHOLDER_SENTINEL, "{basin}");
		this.pathTemplate = explicitPathProvided ? parsedPath : DEFAULT_API_PATH;
		this.explicitPathProvided = explicitPathProvided;
		this.hasBasinPlaceholder = this.raw.includes("{basin}") || this.hostTemplate.includes("{basin}") || this.pathTemplate.includes("{basin}");
	}
	/**
	* Resolve the template into a base URL string.
	*
	* - If `{basin}` appears in the hostname, it is substituted verbatim (basin names are validated by S2.basin()).
	* - If `{basin}` appears in the path/query/hash, it is substituted via `encodeURIComponent`.
	*/
	baseUrl(basin) {
		const host = basin ? this.hostTemplate.replaceAll("{basin}", basin) : this.hostTemplate;
		const path = basin ? this.pathTemplate.replaceAll("{basin}", encodeURIComponent(basin)) : this.pathTemplate;
		const authority = this.port ? `${host}:${this.port}` : host;
		return `${this.scheme}://${authority}${path}`;
	}
};
var DEFAULT_ACCOUNT_ENDPOINT = "aws.s2.dev";
var DEFAULT_BASIN_ENDPOINT = "{basin}.b.s2.dev";
/**
* Endpoint configuration for the S2 environment.
*
* This mirrors the Rust SDK's endpoint model, with an additional capability:
* the basin endpoint may include `{basin}` anywhere (hostname and/or path).
*/
var S2Endpoints = class {
	account;
	basin;
	/**
	* When true, include `s2-basin: <name>` header on basin-scoped requests.
	*
	* Per project convention: enabled whenever a non-default basin endpoint is provided.
	*/
	includeBasinHeader;
	constructor(init) {
		this.account = new EndpointTemplate({ endpoint: init?.account ?? DEFAULT_ACCOUNT_ENDPOINT });
		this.basin = new EndpointTemplate({ endpoint: init?.basin ?? DEFAULT_BASIN_ENDPOINT });
		this.includeBasinHeader = init?.basin !== void 0;
	}
	accountBaseUrl() {
		return this.account.baseUrl();
	}
	basinBaseUrl(basin) {
		return this.basin.baseUrl(basin);
	}
};
/** Convert expiresAt input (Date, milliseconds, or string) to RFC 3339 string for API. */
function toISOString(value) {
	if (value === null) return null;
	if (value === void 0) return void 0;
	if (value instanceof Date) return value.toISOString();
	if (typeof value === "number") return new Date(value).toISOString();
	return value;
}
/** Convert expiresAt from API (ISO string) to Date. */
function toDate(value) {
	if (value === null) return null;
	if (value === void 0) return void 0;
	return new Date(value);
}
/** Transform AccessTokenInfo response: convert expiresAt to Date. */
function transformTokenInfo(token) {
	return {
		...token,
		expiresAt: toDate(token.expiresAt)
	};
}
/**
* Account-scoped helper for listing, issuing, and revoking access tokens.
*
* Acquire via {@link S2.accessTokens}. Use {@link S2AccessTokens.listAll} for async iteration.
*/
var S2AccessTokens = class {
	client;
	retryConfig;
	constructor(client, retryConfig) {
		this.client = client;
		this.retryConfig = retryConfig;
	}
	/**
	* List access tokens.
	*
	* @param args.prefix Filter to IDs beginning with this prefix
	* @param args.startAfter Filter to IDs lexicographically after this value
	* @param args.limit Max results (up to 1000)
	*/
	async list(args, options) {
		const camelCased = toCamelCase(await withRetries(this.retryConfig, async () => {
			return await withS2Data(() => listAccessTokens({
				client: this.client,
				query: toSnakeCase(args),
				...options
			}));
		}));
		return {
			...camelCased,
			accessTokens: camelCased.accessTokens.map(transformTokenInfo)
		};
	}
	/**
	* List all access tokens with automatic pagination.
	* Returns a lazy async iterable that fetches pages as needed.
	*
	* @param args - Optional filtering options: `prefix` to filter by ID prefix, `limit` for max results per page
	*
	* @example
	* ```ts
	* for await (const token of s2.accessTokens.listAll({ prefix: "service-" })) {
	*   console.log(token.id);
	* }
	* ```
	*/
	listAll(args, options) {
		return paginate((a) => this.list(a, options).then((r) => ({
			items: r.accessTokens,
			hasMore: r.hasMore
		})), args ?? {}, (token) => token.id);
	}
	/**
	* Issue a new access token.
	*
	* @param args.id Unique token ID (1-96 bytes)
	* @param args.scope Token scope (operations and resource sets)
	* @param args.autoPrefixStreams Namespace stream names by configured prefix scope
	* @param args.expiresAt Expiration time (Date or RFC 3339 string); defaults to requestor's token expiry
	*/
	async issue(args, options) {
		const apiArgs = {
			...args,
			expiresAt: toISOString(args.expiresAt)
		};
		return toCamelCase(await withRetries(this.retryConfig, async () => {
			return await withS2Data(() => issueAccessToken({
				client: this.client,
				body: toSnakeCase(apiArgs),
				...options
			}));
		}));
	}
	/**
	* Revoke an access token by ID.
	*
	* @param args.id Token ID to revoke
	*/
	async revoke(args, options) {
		await withRetries(this.retryConfig, async () => {
			return await withS2Data(() => revokeAccessToken({
				client: this.client,
				path: args,
				...options
			}));
		});
	}
};
/** Convert SDK RetentionPolicy (ageSecs) to API RetentionPolicy (age). */
function toAPIRetentionPolicy(policy) {
	if (policy === null) return null;
	if (policy === void 0) return void 0;
	if ("ageSecs" in policy) return { age: Math.floor(policy.ageSecs) };
	return policy;
}
/** Convert API RetentionPolicy (age) to SDK RetentionPolicy (ageSecs). */
function toSDKRetentionPolicy(policy) {
	if (policy === null) return null;
	if (policy === void 0) return void 0;
	if ("age" in policy) return { ageSecs: policy.age };
	return policy;
}
/** Convert SDK StreamConfig to API format (handles retentionPolicy.ageSecs → age). */
function toAPIStreamConfig(config) {
	if (config === null || config === void 0) return config;
	return {
		...config,
		deleteOnEmpty: config.deleteOnEmpty ? {
			...config.deleteOnEmpty,
			minAgeSecs: config.deleteOnEmpty.minAgeSecs === void 0 ? void 0 : Math.max(0, Math.floor(config.deleteOnEmpty.minAgeSecs))
		} : config.deleteOnEmpty,
		retentionPolicy: toAPIRetentionPolicy(config.retentionPolicy)
	};
}
/** Convert API StreamConfig to SDK format (handles retentionPolicy.age → ageSecs). */
function toSDKStreamConfig(config) {
	if (config === null || config === void 0) return config;
	return {
		...config,
		retentionPolicy: toSDKRetentionPolicy(config?.retentionPolicy)
	};
}
/** Convert SDK BasinConfig to API format. */
function toAPIBasinConfig(config) {
	if (config === null || config === void 0) return config;
	return {
		...config,
		defaultStreamConfig: toAPIStreamConfig(config.defaultStreamConfig)
	};
}
/** Convert API BasinConfig to SDK format. */
function toSDKBasinConfig(config) {
	return {
		...config,
		defaultStreamConfig: toSDKStreamConfig(config?.defaultStreamConfig)
	};
}
/**
* Account-scoped helper for listing, creating, deleting, and reconfiguring basins.
*
* Retrieve this via {@link S2.basins}. Each method retries according to the client-level retry config.
*/
var S2Basins = class {
	client;
	retryConfig;
	constructor(client, retryConfig) {
		this.client = client;
		this.retryConfig = retryConfig;
	}
	/**
	* List basins.
	*
	* @param args.prefix Return basins whose names start with the given prefix
	* @param args.startAfter Name to start after (for pagination)
	* @param args.limit Max results (up to 1000)
	*/
	async list(args, options) {
		return toCamelCase(await withRetries(this.retryConfig, async () => {
			return await withS2Data(() => listBasins({
				client: this.client,
				query: toSnakeCase(args),
				...options
			}));
		}));
	}
	/**
	* List all basins with automatic pagination.
	* Returns a lazy async iterable that fetches pages as needed.
	*
	* @param args - Optional options: `prefix` to filter by name prefix, `limit` for max results per page, `includeDeleted` to include basins pending deletion
	*
	* @example
	* ```ts
	* for await (const basin of s2.basins.listAll({ prefix: "my-" })) {
	*   console.log(basin.name);
	* }
	* ```
	*/
	listAll(args, options) {
		const { includeDeleted, ...listArgs } = args ?? {};
		const allItems = paginate((a) => this.list(a, options).then((r) => ({
			items: r.basins,
			hasMore: r.hasMore
		})), listArgs, (basin) => basin.name);
		if (includeDeleted) return allItems;
		return filterAsync(allItems, (b) => b.state !== "deleting");
	}
	/**
	* Create a basin.
	*
	* @param args.basin Globally unique basin name (8-48 chars, lowercase letters, numbers, hyphens; cannot begin or end with a hyphen)
	* @param args.config Optional basin configuration (e.g. defaultStreamConfig)
	* @param args.scope Basin scope
	*/
	async create(args, options) {
		const requestToken = randomToken();
		const apiArgs = {
			...args,
			config: toAPIBasinConfig(args.config)
		};
		return toCamelCase(await withRetries(this.retryConfig, async () => {
			return await withS2Data(() => createBasin({
				client: this.client,
				body: toSnakeCase(apiArgs),
				headers: { "s2-request-token": requestToken },
				...options
			}));
		}));
	}
	/**
	* Get basin configuration.
	*
	* @param args.basin Basin name
	*/
	async getConfig(args, options) {
		return toSDKBasinConfig(toCamelCase(await withRetries(this.retryConfig, async () => {
			return await withS2Data(() => getBasinConfig({
				client: this.client,
				path: args,
				...options
			}));
		})));
	}
	/**
	* Delete a basin.
	*
	* @param args.basin Basin name
	*/
	async delete(args, options) {
		await withRetries(this.retryConfig, async () => {
			return await withS2Data(() => deleteBasin({
				client: this.client,
				path: args,
				...options
			}));
		});
	}
	/**
	* Reconfigure a basin.
	*
	* @param args Configuration for the basin to reconfigure (including basin name and fields to change)
	*/
	async reconfigure(args, options) {
		const { basin, ...reconfigArgs } = args;
		const apiArgs = {
			...reconfigArgs,
			defaultStreamConfig: toAPIStreamConfig(args.defaultStreamConfig)
		};
		return toSDKBasinConfig(toCamelCase(await withRetries(this.retryConfig, async () => {
			return await withS2Data(() => reconfigureBasin({
				client: this.client,
				path: { basin },
				body: toSnakeCase(apiArgs),
				...options
			}));
		})));
	}
};
/** Convert timestamp (Date or milliseconds) to Unix seconds (floored). */
function toEpochSeconds(value) {
	if (value === void 0) return void 0;
	const ms = typeof value === "number" ? value : value.getTime();
	return Math.floor(ms / 1e3);
}
/** Convert API metric response to SDK types with Date conversions. */
function fromAPIMetricSetResponse(response) {
	return { values: toCamelCase(response).values.map((metric) => {
		if ("accumulation" in metric) return { accumulation: {
			...metric.accumulation,
			values: metric.accumulation.values.map(([ts, value]) => [/* @__PURE__ */ new Date(ts * 1e3), value])
		} };
		if ("gauge" in metric) return { gauge: {
			...metric.gauge,
			values: metric.gauge.values.map(([ts, value]) => [/* @__PURE__ */ new Date(ts * 1e3), value])
		} };
		return metric;
	}) };
}
/**
* Helper for querying account, basin, and stream level metrics.
*
* Access via {@link S2.metrics}. Responses are automatically converted to Date-friendly SDK types.
*/
var S2Metrics = class {
	client;
	retryConfig;
	constructor(client, retryConfig) {
		this.client = client;
		this.retryConfig = retryConfig;
	}
	/**
	* Account-level metrics.
	*
	* @param args.set Metric set to return
	* @param args.start Optional start timestamp (milliseconds since Unix epoch)
	* @param args.end Optional end timestamp (milliseconds since Unix epoch)
	* @param args.interval Optional aggregation interval for timeseries sets
	*/
	async account(args, options) {
		return fromAPIMetricSetResponse(await withRetries(this.retryConfig, async () => {
			return await withS2Data(() => accountMetrics({
				client: this.client,
				query: toSnakeCase({
					...args,
					start: toEpochSeconds(args.start),
					end: toEpochSeconds(args.end)
				}),
				...options
			}));
		}));
	}
	/**
	* Basin-level metrics.
	*
	* @param args.basin Basin name
	* @param args.set Metric set to return
	* @param args.start Optional start timestamp (milliseconds since Unix epoch)
	* @param args.end Optional end timestamp (milliseconds since Unix epoch)
	* @param args.interval Optional aggregation interval for timeseries sets
	*/
	async basin(args, options) {
		return fromAPIMetricSetResponse(await withRetries(this.retryConfig, async () => {
			return await withS2Data(() => basinMetrics({
				client: this.client,
				path: args,
				query: toSnakeCase({
					...args,
					start: toEpochSeconds(args.start),
					end: toEpochSeconds(args.end)
				}),
				...options
			}));
		}));
	}
	/**
	* Stream-level metrics.
	*
	* @param args.basin Basin name
	* @param args.stream Stream name
	* @param args.set Metric set to return
	* @param args.start Optional start timestamp (milliseconds since Unix epoch)
	* @param args.end Optional end timestamp (milliseconds since Unix epoch)
	* @param args.interval Optional aggregation interval for timeseries sets
	*/
	async stream(args, options) {
		return fromAPIMetricSetResponse(await withRetries(this.retryConfig, async () => {
			return await withS2Data(() => streamMetrics({
				client: this.client,
				path: args,
				query: toSnakeCase({
					...args,
					start: toEpochSeconds(args.start),
					end: toEpochSeconds(args.end)
				}),
				...options
			}));
		}));
	}
};
/**
* Basin names must be 8-48 characters, lowercase alphanumeric and hyphens,
* cannot start or end with a hyphen.
*/
var BASIN_NAME_REGEX = /^[a-z0-9][a-z0-9-]{6,46}[a-z0-9]$/;
/**
* Top-level S2 SDK client.
*
* - Authenticates with an access token and exposes account-scoped helpers for basins, streams, access tokens and metrics.
*/
var S2 = class {
	accessToken;
	client;
	endpoints;
	retryConfig;
	/**
	* Account-scoped basin management operations.
	*
	* - List, create, delete and reconfigure basins.
	*/
	basins;
	/** Manage access tokens for the account (list, issue, revoke). */
	accessTokens;
	/** Account, basin and stream level metrics. */
	metrics;
	/**
	* Create a new S2 client.
	*
	* @param options Access token configuration.
	*/
	constructor(options) {
		this.accessToken = make(options.accessToken);
		this.retryConfig = {
			...options.retry,
			...options.requestTimeoutMillis !== void 0 && { requestTimeoutMillis: options.requestTimeoutMillis },
			...options.connectionTimeoutMillis !== void 0 && { connectionTimeoutMillis: options.connectionTimeoutMillis }
		};
		this.endpoints = options.endpoints instanceof S2Endpoints ? options.endpoints : new S2Endpoints(options.endpoints);
		const headers = {};
		if (canSetUserAgentHeader()) headers["user-agent"] = DEFAULT_USER_AGENT;
		this.client = createClient$1(createConfig({
			baseUrl: this.endpoints.accountBaseUrl(),
			auth: () => value(this.accessToken),
			headers
		}));
		this.client.interceptors.error.use((err, res) => {
			return makeServerError(res, err);
		});
		this.basins = new S2Basins(this.client, this.retryConfig);
		this.accessTokens = new S2AccessTokens(this.client, this.retryConfig);
		this.metrics = new S2Metrics(this.client, this.retryConfig);
	}
	/**
	* Create a basin-scoped client bound to a specific basin name.
	*
	* @param name Basin name (8-48 characters, lowercase alphanumeric and hyphens, no leading/trailing hyphens).
	* @throws {S2Error} If the basin name is invalid.
	*/
	basin(name) {
		if (!BASIN_NAME_REGEX.test(name)) throw new S2Error({
			message: `Invalid basin name: "${name}". Basin names must be 8-48 characters, contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen.`,
			origin: "sdk"
		});
		return new S2Basin(name, {
			accessToken: this.accessToken,
			baseUrl: this.endpoints.basinBaseUrl(name),
			includeBasinHeader: this.endpoints.includeBasinHeader,
			retryConfig: this.retryConfig
		});
	}
};
function toStoreError(cause, message) {
	if (cause instanceof EventStoreError) return cause;
	return new EventStoreError(`${message}: ${cause instanceof Error ? cause.message : String(cause)}`, cause);
}
function parseEvent(body, seqNum) {
	const raw = JSON.parse(body);
	return fromWireEvent({
		...decodeUnknownSync(TwistEventSchema)(raw),
		seq: seqNum + 1
	});
}
function createClient(config) {
	if (is(String$1)(config.endpoint)) return new S2({
		accessToken: config.accessToken,
		endpoints: new S2Endpoints({
			account: config.endpoint,
			basin: config.endpoint
		})
	});
	if (config.endpoint) return new S2({
		accessToken: config.accessToken,
		endpoints: new S2Endpoints(config.endpoint)
	});
	return new S2({ accessToken: config.accessToken });
}
/**
* Synchronous constructor for an S2-backed EventStore.
*
* Basin creation is deferred and memoized lazily on first stream access.
* Expected tail mismatches during `append` map to `EventStoreConflictError`.
*/
function s2(config) {
	const parsed = decodeUnknownSync(S2ConfigSchema)(config);
	const client = createClient(parsed);
	const basin = client.basin(parsed.basin);
	const ensured = /* @__PURE__ */ new Set();
	let basinEnsured = false;
	const ensureBasin = tryPromise({
		try: async () => {
			if (basinEnsured) return;
			try {
				await client.basins.create({ basin: parsed.basin });
			} catch (err) {
				if (!(err instanceof S2Error && err.status === 409)) throw err;
			}
			basinEnsured = true;
		},
		catch: (cause) => toStoreError(cause, `Failed to ensure basin ${parsed.basin}`)
	});
	const ensureStream = (actorId) => gen(function* () {
		yield* ensureBasin;
		return yield* tryPromise({
			try: async () => {
				const name = streamNameForActor(actorId);
				if (ensured.has(name)) return basin.stream(name);
				try {
					await basin.streams.create({ stream: name });
				} catch (err) {
					if (!(err instanceof S2Error && err.status === 409)) {
						if (!(err instanceof S2Error && (err.status === 404 || err.status === 405))) throw err;
					}
				}
				ensured.add(name);
				return basin.stream(name);
			},
			catch: (cause) => toStoreError(cause, `Failed to open stream for ${actorId}`)
		});
	});
	const service = {
		append: (actorId, events, options) => gen(function* () {
			if (events.length === 0) return {
				sequences: [],
				tail: yield* service.tail(actorId)
			};
			const stream = yield* ensureStream(actorId);
			const records = events.map((partial) => {
				const body = JSON.stringify({
					...partial,
					actorId,
					seq: partial.seq ?? 0
				});
				return AppendRecord$1.string({
					body,
					headers: [["content-type", "application/json"]]
				});
			});
			const input = AppendInput$1.create(records, { matchSeqNum: options?.expectedTail });
			const appendResult = yield* promise(() => stream.append(input).then((ack) => ({
				ok: true,
				ack
			}), (err) => ({
				ok: false,
				err
			})));
			if (!appendResult.ok) {
				const cause = appendResult.err;
				if (cause instanceof S2Error && (cause.status === 409 || cause.status === 412 || cause.message.toLowerCase().includes("conflict") || cause.message.toLowerCase().includes("match"))) {
					const actualTail = (yield* promise(() => stream.checkTail().catch(() => null)))?.tail?.seqNum ?? 0;
					return yield* fail(new EventStoreConflictError(actorId, options?.expectedTail ?? 0, actualTail));
				}
				return yield* fail(toStoreError(cause, `Append failed for ${actorId}`));
			}
			const ack = appendResult.ack;
			const sequences = [];
			for (let i = 0; i < events.length; i++) sequences.push(ack.start.seqNum + i + 1);
			return {
				sequences,
				tail: ack.tail.seqNum
			};
		}),
		read: (actorId, options) => gen(function* () {
			const stream = yield* ensureStream(actorId);
			const fromSeq = options?.fromSeq ?? 1;
			const s2From = Math.max(0, fromSeq - 1);
			const limit = options?.limit ?? 1e3;
			const batch = yield* tryPromise({
				try: () => stream.read({
					start: {
						from: { seqNum: s2From },
						clamp: true
					},
					stop: { limits: { count: limit } }
				}),
				catch: (cause) => toStoreError(cause, `Read failed for ${actorId}`)
			}).pipe(catch_((err) => err.cause instanceof S2Error && err.cause.status === 404 ? succeed$1(null) : fail(err)));
			if (!batch) return [];
			return batch.records.filter((r) => r.seqNum >= s2From).map((r) => parseEvent(r.body, r.seqNum));
		}),
		tail: (actorId) => gen(function* () {
			const stream = yield* ensureStream(actorId);
			return (yield* tryPromise({
				try: () => stream.checkTail(),
				catch: (cause) => toStoreError(cause, `Tail failed for ${actorId}`)
			}).pipe(catch_((err) => err.cause instanceof S2Error && err.cause.status === 404 ? succeed$1({ tail: {
				seqNum: 0,
				timestamp: /* @__PURE__ */ new Date(0)
			} }) : fail(err)))).tail.seqNum;
		}),
		subscribe: (actorId, options) => callback$1((queue) => callback((resume) => {
			const fromSeq = options?.fromSeq ?? 1;
			const s2From = Math.max(0, fromSeq - 1);
			let stopped = false;
			const run = async () => {
				try {
					const session = await (await runPromise(ensureStream(actorId))).readSession({ start: {
						from: { seqNum: s2From },
						clamp: true
					} });
					for await (const record of session) {
						if (stopped) break;
						if (record.seqNum < s2From) continue;
						offerUnsafe(queue, parseEvent(record.body, record.seqNum));
					}
					endUnsafe(queue);
					resume(void_);
				} catch (cause) {
					await runPromise(fail$1(queue, toStoreError(cause, `Subscribe failed for ${actorId}`)));
					resume(void_);
				}
			};
			run();
			return sync(() => {
				stopped = true;
			});
		})),
		listActors: () => tryPromise({
			try: async () => {
				return (await basin.streams.list({ prefix: "actors/" })).streams.map((s) => s.name).filter((name) => name.startsWith("actors/")).map((name) => name.slice(7));
			},
			catch: (cause) => toStoreError(cause, "listActors failed")
		})
	};
	return service;
}
function findS2Binary() {
	const pathDirs = (process.env.PATH ?? "").split(path.delimiter);
	for (const dir of pathDirs) {
		if (!dir) continue;
		const candidate = path.join(dir, "s2");
		try {
			if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
		} catch {}
	}
	if (process.env.FLOX_ENV_CACHE) {
		const floxCandidate = path.join(process.env.FLOX_ENV_CACHE, "s2", "bin", "s2");
		if (fs.existsSync(floxCandidate)) return floxCandidate;
	}
	if (process.env.S2_INSTALL_PREFIX) {
		const prefixCandidate = path.join(process.env.S2_INSTALL_PREFIX, "bin", "s2");
		if (fs.existsSync(prefixCandidate)) return prefixCandidate;
	}
	const homeCandidate = path.join(os.homedir(), ".s2", "bin", "s2");
	if (fs.existsSync(homeCandidate)) return homeCandidate;
	const localCandidate = path.join(process.cwd(), ".s2", "bin", "s2");
	if (fs.existsSync(localCandidate)) return localCandidate;
}
function isPortOpen(port, host = "127.0.0.1") {
	return new Promise((resolve) => {
		const socket = new net.Socket();
		socket.setTimeout(200);
		socket.once("connect", () => {
			socket.destroy();
			resolve(true);
		});
		socket.once("timeout", () => {
			socket.destroy();
			resolve(false);
		});
		socket.once("error", () => {
			socket.destroy();
			resolve(false);
		});
		socket.connect(port, host);
	});
}
var activeProcess = null;
async function startS2Lite(options = {}) {
	const port = options.port ?? 8080;
	const endpoint = `http://127.0.0.1:${port}`;
	if (await isPortOpen(port)) return {
		port,
		endpoint,
		stop: () => {}
	};
	const binaryPath = findS2Binary();
	if (!binaryPath) throw new Error(`s2 CLI binary not found on PATH or in standard locations.
To install s2-lite for local development:
  flox activate          # installs into $FLOX_ENV_CACHE/s2 (preferred)
  bun run setup:s2       # scripts/install-s2-cli.sh
  https://s2.dev/docs/cli/installation`);
	const child = childProcess.spawn(binaryPath, [
		"lite",
		"--port",
		String(port)
	], {
		stdio: [
			"ignore",
			"pipe",
			"pipe"
		],
		detached: false
	});
	activeProcess = child;
	const cleanup = () => {
		if (activeProcess === child) activeProcess = null;
		try {
			child.kill("SIGTERM");
		} catch {}
	};
	process.once("exit", cleanup);
	process.once("SIGINT", cleanup);
	process.once("SIGTERM", cleanup);
	let stderrOutput = "";
	child.stderr?.on("data", (chunk) => {
		stderrOutput += chunk.toString();
	});
	const deadline = Date.now() + 5e3;
	while (Date.now() < deadline) {
		if (child.exitCode !== null) throw new Error(`s2 lite process exited with code ${child.exitCode} before becoming ready: ${stderrOutput}`);
		if (await isPortOpen(port)) return {
			port,
			endpoint,
			stop: cleanup
		};
		await new Promise((r) => setTimeout(r, 50));
	}
	cleanup();
	throw new Error(`Timed out waiting for s2 lite to start on port ${port}: ${stderrOutput}`);
}
/**
* Returns a factory function for createTwist that automatically starts local s2-lite
* and connects an S2 EventStore to it.
*/
function s2Lite(options = {}) {
	return async () => {
		const started = await startS2Lite(options);
		return s2({
			basin: options.basin ?? "twist-demo",
			accessToken: options.accessToken ?? "s2_local",
			endpoint: started.endpoint
		});
	};
}
/** Deterministic echo agent. */
var echo = defineAgent({
	name: "echo",
	instructions: "Echo the user message.",
	input: objectType({ text: stringType() }),
	runTurn: ({ input }) => ({
		message: {
			role: "assistant",
			content: input.text
		},
		done: true,
		output: { text: input.text }
	})
});
/** Child agent used via agent-tool. */
var specialist = defineAgent({
	name: "specialist",
	instructions: "Specialize on a short task.",
	input: objectType({ task: stringType() }),
	runTurn: ({ input }) => ({
		message: {
			role: "assistant",
			content: `done:${input.task}`
		},
		done: true,
		output: { result: `done:${input.task}` }
	})
});
function findLastToolMessage(messages) {
	for (let i = messages.length - 1; i >= 0; i--) {
		const msg = messages[i];
		if (msg?.role === "tool") return msg;
	}
}
var SpecialistInputSchema = objectType({ task: stringType().optional() });
/** Parent agent that spawns a child via agent-tool. */
var orchestrator = defineAgent({
	name: "orchestrator",
	instructions: "Delegate work to the specialist tool.",
	input: objectType({ task: stringType().optional().default("default") }),
	tools: [asAgentTool({
		name: "specialist",
		description: "Run the specialist child agent",
		agent: specialist,
		mapInput: (input) => {
			const parsed = SpecialistInputSchema.safeParse(input);
			return { task: parsed.success && parsed.data.task ? parsed.data.task : "default" };
		}
	})],
	runTurn: ({ turn, messages, input }) => {
		if (turn === 1) {
			const task = input.task ?? "default";
			return {
				message: {
					role: "assistant",
					content: "",
					toolCalls: [{
						id: "tc_spec",
						name: "specialist",
						arguments: { task }
					}]
				},
				toolCalls: [{
					id: "tc_spec",
					name: "specialist",
					arguments: { task }
				}]
			};
		}
		const toolMsg = findLastToolMessage(messages);
		let output = null;
		if (toolMsg) try {
			output = JSON.parse(toolMsg.content);
		} catch {
			output = toolMsg.content;
		}
		const strParsed = stringType().safeParse(output);
		return {
			message: {
				role: "assistant",
				content: strParsed.success ? strParsed.data : JSON.stringify(output)
			},
			done: true,
			output
		};
	}
});
var twist = createTwist({
	definitions: [
		echo,
		defineAgent({
			name: "greeter",
			instructions: "Greet using the greet tool.",
			input: objectType({ name: stringType().optional().default("world") }),
			tools: [defineTool({
				name: "greet",
				description: "Return a greeting",
				input: objectType({ name: stringType().optional().default("world") }),
				handler: ({ name }) => ({ greeting: `Hello, ${name}!` })
			})],
			runTurn: ({ turn, messages, input }) => {
				if (turn === 1) {
					const name = input.name ?? "world";
					return {
						message: {
							role: "assistant",
							content: "",
							toolCalls: [{
								id: "tc_greet",
								name: "greet",
								arguments: { name }
							}]
						},
						toolCalls: [{
							id: "tc_greet",
							name: "greet",
							arguments: { name }
						}]
					};
				}
				const toolMsg = findLastToolMessage(messages);
				let output = null;
				if (toolMsg) try {
					output = JSON.parse(toolMsg.content);
				} catch {
					output = toolMsg.content;
				}
				return {
					message: {
						role: "assistant",
						content: toolMsg?.content ?? "done"
					},
					done: true,
					output
				};
			}
		}),
		specialist,
		orchestrator,
		defineWorkflow({
			name: "hitl",
			description: "Human-in-the-loop approval gate",
			input: objectType({ doc: stringType().optional().default("draft") }),
			nodes: [
				{
					id: "prepare",
					run: (ctx) => ({ draft: ctx.input.doc })
				},
				{
					id: "review",
					deps: ["prepare"],
					run: (ctx) => ctx.requestReview({
						title: "Approve draft?",
						description: JSON.stringify(ctx.results.prepare ?? null)
					})
				},
				{
					id: "finalize",
					deps: ["review"],
					run: (ctx) => ({
						approved: true,
						review: ctx.results.review ?? null
					})
				}
			],
			output: ({ results }) => results
		}),
		defineWorkflow({
			name: "pipeline",
			input: objectType({ n: numberType().default(21) }),
			nodes: [
				{
					id: "double",
					run: (ctx) => ctx.input.n * 2
				},
				{
					id: "spawn",
					deps: ["double"],
					run: (ctx) => ctx.spawnAgent(echo, { text: `n=${JSON.stringify(ctx.results.double ?? null)}` })
				},
				{
					id: "format",
					deps: ["spawn"],
					run: (ctx) => ({
						doubled: ctx.results.double ?? null,
						child: ctx.results.spawn ?? null
					})
				}
			],
			output: ({ results }) => results
		})
	],
	store: process.env.TWIST_S2_ENDPOINT ? s2(s2ConfigFromEnv()) : s2Lite()
});
var server_default = createServerEntry({ fetch: async (req) => await twist.fetch(req) ?? server_default$1.fetch(req) });
//#endregion
export { AppendAck, DEFAULT_USER_AGENT, RangeNotSatisfiableError, ReadBatch, RetryAppendSession, RetryReadSession, S2Error, S2_ENCRYPTION_KEY_HEADER, TwistEventSchema, bigintToSafeNumber, convertProtoRecord, createMiddleware, server_default as default, encodeProtoAppendInput, err, errClose, fromWireEvent, makeAppendPreconditionError, makeServerError, ok, okClose, require_src, s2Error, ssr_exports, value };
