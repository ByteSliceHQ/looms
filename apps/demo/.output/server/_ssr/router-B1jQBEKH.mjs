import { __toESM } from "../_runtime.mjs";
import { HeadContent, Link, Outlet, Scripts, createFileRoute, createRootRoute, createRouter, lazyRouteComponent, require_jsx_runtime, require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { __exportAll } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-B1jQBEKH.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var EndpointContext = (0, import_react.createContext)("");
/** Root provider that supplies the Looms host endpoint to run stores. */
function LoomsLiveStoreProvider({ children, endpoint = "" }) {
	return (0, import_react.createElement)(EndpointContext.Provider, {
		value: endpoint,
		children
	});
}
var styles_default = "/assets/styles-BRk_L37D.css";
var Route$5 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Looms Demo" }
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RootDocument, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoomsLiveStoreProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/",
			style: {
				color: "inherit",
				textDecoration: "none"
			},
			children: "Looms Demo"
		}) }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "sub",
			children: [
				"Event-sourced thread kernel with pluggable modules. Start a run, then inspect the debugger or chat.",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/chat",
					children: "Chat"
				})
			]
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
var $$splitComponentImporter$4 = () => import("./routes-DX_MkdNg.mjs");
var Route$4 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./chat-DqA2MEY_.mjs");
var Route$3 = createFileRoute("/chat")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./chat.index-hBRS_KXp.mjs");
var Route$2 = createFileRoute("/chat/")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./chat._runId-uvXPmSKy.mjs");
var Route$1 = createFileRoute("/chat/$runId")({
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./runs._runId-QYX-oRrZ.mjs");
var Route = createFileRoute("/runs/$runId")({
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var IndexRoute = Route$4.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$5
});
var ChatRoute = Route$3.update({
	id: "/chat",
	path: "/chat",
	getParentRoute: () => Route$5
});
var ChatIndexRoute = Route$2.update({
	id: "/",
	path: "/",
	getParentRoute: () => ChatRoute
});
var ChatRunIdRoute = Route$1.update({
	id: "/$runId",
	path: "/$runId",
	getParentRoute: () => ChatRoute
});
var RunsRunIdRoute = Route.update({
	id: "/runs/$runId",
	path: "/runs/$runId",
	getParentRoute: () => Route$5
});
var ChatRouteChildren = {
	ChatRunIdRoute,
	ChatIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	ChatRoute: ChatRoute._addFileChildren(ChatRouteChildren),
	RunsRunIdRoute
};
var routeTree = Route$5._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		scrollRestoration: true
	});
}
//#endregion
export { Route, Route$1, router_exports };
