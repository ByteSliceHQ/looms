globalThis.__nitro_main__ = import.meta.url;
import { FastResponse, H3Core, HTTPError, composeMiddleware, createMatcherFromFind, defineHandler, defineLazyEventHandler, headers, memoizeRouteRulesMatcher, serve, toEventHandler } from "./_libs/h3+rou3+srvx.mjs";
import { HookableCore } from "./_libs/hookable.mjs";
import { decodePath, joinURL, withLeadingSlash, withoutTrailingSlash } from "./_libs/ufo.mjs";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/assets/payments-Bh2DhelC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"659-md/cFmMgknGsdxDCWxe4DUF/sAI\"",
		"mtime": "2026-09-08T22:52:24.039Z",
		"size": 1625,
		"path": "../public/assets/payments-Bh2DhelC.js"
	},
	"/assets/runs._runId-Bghtsumw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"19ba-811qiz+7UmF+qZoM1GCudwgBp7Q\"",
		"mtime": "2026-09-08T22:52:24.039Z",
		"size": 6586,
		"path": "../public/assets/runs._runId-Bghtsumw.js"
	},
	"/assets/schemas-COyvlked.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"15f63-vVs62T+UTtme0/nQDB/7j3RyWkY\"",
		"mtime": "2026-09-08T22:52:24.039Z",
		"size": 89955,
		"path": "../public/assets/schemas-COyvlked.js"
	},
	"/assets/styles-BRk_L37D.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"11b1-W+HyX/Wq09j3nsP1og7VYVp7Om4\"",
		"mtime": "2026-09-08T22:52:24.040Z",
		"size": 4529,
		"path": "../public/assets/styles-BRk_L37D.css"
	},
	"/assets/chat.index-DO6VB6Hj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4c3-53zWvqtlVV3/qpj56uXUdJpzhPY\"",
		"mtime": "2026-09-08T22:52:24.038Z",
		"size": 1219,
		"path": "../public/assets/chat.index-DO6VB6Hj.js"
	},
	"/assets/client-C_Ey4V5_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d0-CRRL2DYp6XH2uzZI1fRdK7PTK04\"",
		"mtime": "2026-09-08T22:52:24.038Z",
		"size": 1232,
		"path": "../public/assets/client-C_Ey4V5_.js"
	},
	"/assets/chat._runId-C_PpJH1T.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c7e-0CcAR10JLuCDmoP3HvpPwPLhuDU\"",
		"mtime": "2026-09-08T22:52:24.038Z",
		"size": 3198,
		"path": "../public/assets/chat._runId-C_PpJH1T.js"
	},
	"/assets/routes-BWNhPPdI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"754-uQeraFqSTNjSt/7KSRqoAbQsroo\"",
		"mtime": "2026-09-08T22:52:24.039Z",
		"size": 1876,
		"path": "../public/assets/routes-BWNhPPdI.js"
	},
	"/assets/definitions-CAh3HLwR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"287f-88TkzxClxDwIR23FNtn183MVSa4\"",
		"mtime": "2026-09-08T22:52:24.039Z",
		"size": 10367,
		"path": "../public/assets/definitions-CAh3HLwR.js"
	},
	"/assets/chat-Bh9b5IU5.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"98-O/rxOpfnsVkGGP/CIlS15XPbVr4\"",
		"mtime": "2026-09-08T22:52:24.038Z",
		"size": 152,
		"path": "../public/assets/chat-Bh9b5IU5.js"
	},
	"/assets/preload-helper-2_xAxGF8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7289-TReSoyN/4MzRnoYOe3ZdUftkNK8\"",
		"mtime": "2026-09-08T22:52:24.039Z",
		"size": 29321,
		"path": "../public/assets/preload-helper-2_xAxGF8.js"
	},
	"/assets/index-BtKStCY-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"44544-RIXgW1OZIJ6Vhdi6zE4yKx0Hu7I\"",
		"mtime": "2026-09-08T22:52:24.038Z",
		"size": 279876,
		"path": "../public/assets/index-BtKStCY-.js"
	},
	"/assets/useRouter-Dpb7RwMI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2144-OAWOWZt+i/sSs5fMTIk74KvSiew\"",
		"mtime": "2026-09-08T22:52:24.039Z",
		"size": 8516,
		"path": "../public/assets/useRouter-Dpb7RwMI.js"
	},
	"/assets/src-CXid-tMr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a007-AyBXIxknQw6JhjqANu/sePdxjMY\"",
		"mtime": "2026-09-08T22:52:24.039Z",
		"size": 106503,
		"path": "../public/assets/src-CXid-tMr.js"
	},
	"/assets/useStore-B8eWj0Li.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"879-jv3QQm4qA9WZRLM+xzIGNG/SVbQ\"",
		"mtime": "2026-09-08T22:52:24.039Z",
		"size": 2169,
		"path": "../public/assets/useStore-B8eWj0Li.js"
	}
};
//#endregion
//#region #nitro/virtual/public-assets-node
function readAsset(id) {
	const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
	return promises.readFile(resolve(serverDir, public_assets_data_default[id].path));
}
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
function getAsset(id) {
	return public_assets_data_default[id];
}
//#endregion
//#region ../../node_modules/.bun/nitro@3.0.260903-beta/node_modules/nitro/dist/runtime/internal/static.mjs
var METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
var EncodingMap = {
	gzip: ".gz",
	br: ".br",
	zstd: ".zst"
};
var static_default = defineHandler((event) => {
	if (event.req.method && !METHODS.has(event.req.method)) return;
	let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
	let asset;
	const encodings = [...(event.req.headers.get("accept-encoding") || "").split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
	for (const encoding of encodings) for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
		const _asset = getAsset(_id);
		if (_asset) {
			asset = _asset;
			id = _id;
			break;
		}
	}
	if (!asset) {
		if (isPublicAssetURL(id)) {
			event.res.headers.delete("Cache-Control");
			throw new HTTPError({ status: 404 });
		}
		return;
	}
	if (encodings.length > 1) event.res.headers.append("Vary", "Accept-Encoding");
	if (event.req.headers.get("if-none-match") === asset.etag) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	const ifModifiedSinceH = event.req.headers.get("if-modified-since");
	const mtimeDate = new Date(asset.mtime);
	if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	if (asset.type) event.res.headers.set("Content-Type", asset.type);
	if (asset.etag && !event.res.headers.has("ETag")) event.res.headers.set("ETag", asset.etag);
	if (asset.mtime && !event.res.headers.has("Last-Modified")) event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
	if (asset.encoding && !event.res.headers.has("Content-Encoding")) event.res.headers.set("Content-Encoding", asset.encoding);
	if (asset.size > 0 && !event.res.headers.has("Content-Length")) event.res.headers.set("Content-Length", asset.size.toString());
	return readAsset(id);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = {
		route: "/assets/**",
		rank: 0,
		rules: [{
			name: "headers",
			route: "/assets/**",
			handler: headers,
			options: { "cache-control": "public, max-age=31536000, immutable" }
		}]
	};
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1);
		let s = p.split("/");
		if (s.length > 1 && s[s.length - 1] === "") {
			s.pop();
			p = p.slice(0, -1);
		}
		if (s.length > 1) {
			if (s[1] === "assets") r.push({
				data: $0,
				params: { "_": p.slice(8) }
			});
		}
		return r.reverse();
	};
})();
var _lazy_0da5934ce2fcd8bb = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_0da5934ce2fcd8bb
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
var globalMiddleware = [toEventHandler(static_default)].filter(Boolean);
//#endregion
//#region ../../node_modules/.bun/nitro@3.0.260903-beta/node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new FastResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => {
		event.context.routeRules = getRouteRules(event.req.method, event.url.pathname).routeRules;
		return findRoute(event.req.method, event.url.pathname);
	};
	h3App["~middleware"].push(createRouteRulesMiddleware());
	h3App["~middleware"].push(...globalMiddleware);
	return h3App;
}
//#endregion
//#region ../../node_modules/.bun/nitro@3.0.260903-beta/node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function useNitroHooks() {
	const nitroApp = useNitroApp();
	const hooks = nitroApp.hooks;
	if (hooks) return hooks;
	return nitroApp.hooks = new HookableCore();
}
var _matchRouteRules;
function getRouteRules(method, pathname) {
	return (_matchRouteRules ??= memoizeRouteRulesMatcher(createMatcherFromFind(findRouteRules)))(method, pathname);
}
function createRouteRulesMiddleware() {
	const composed = /* @__PURE__ */ new WeakMap();
	const middleware = (event, next) => {
		const ruleMiddleware = getRouteRules(event.req.method, event.url.pathname).routeRuleMiddleware;
		if (ruleMiddleware.length === 0) return next();
		let chain = composed.get(ruleMiddleware);
		if (!chain) {
			chain = composeMiddleware(ruleMiddleware);
			composed.set(ruleMiddleware, chain);
		}
		return chain(event, next);
	};
	return markUntraced(middleware);
}
function markUntraced(middleware) {
	middleware.__traced__ = true;
	return middleware;
}
//#endregion
//#region ../../node_modules/.bun/nitro@3.0.260903-beta/node_modules/nitro/dist/runtime/internal/error/hooks.mjs
function _captureError(error, type) {
	console.error(`[${type}]`, error);
	useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
	process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
	process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
//#endregion
//#region #nitro/virtual/tracing
var tracingSrvxPlugins = [];
//#endregion
//#region ../../node_modules/.bun/nitro@3.0.260903-beta/node_modules/nitro/dist/runtime/internal/shutdown.mjs
function setupCloseHooks(server) {
	const closeServer = server.close.bind(server);
	let closeHooks;
	server.close = (closeActiveConnections) => closeServer(closeActiveConnections).finally(() => closeHooks ??= callCloseHooks());
}
async function callCloseHooks() {
	try {
		await useNitroHooks().callHook("close");
	} catch (error) {
		console.error("[nitro] Error while calling `close` hooks:", error);
	}
}
//#endregion
//#region ../../node_modules/.bun/nitro@3.0.260903-beta/node_modules/nitro/dist/presets/bun/runtime/bun.mjs
var _parsedPort = Number.parseInt(process.env.NITRO_PORT ?? process.env.PORT ?? "");
var port = Number.isNaN(_parsedPort) ? 3e3 : _parsedPort;
var host = process.env.NITRO_HOST || process.env.HOST;
var cert = process.env.NITRO_SSL_CERT;
var key = process.env.NITRO_SSL_KEY;
var _fetch = useNitroApp().fetch;
setupCloseHooks(serve({
	port,
	hostname: host,
	tls: cert && key ? {
		cert,
		key
	} : void 0,
	fetch: _fetch,
	bun: { websocket: void 0 },
	plugins: [...tracingSrvxPlugins]
}));
trapUnhandledErrors();
var bun_default = {};
//#endregion
export { bun_default as default };
