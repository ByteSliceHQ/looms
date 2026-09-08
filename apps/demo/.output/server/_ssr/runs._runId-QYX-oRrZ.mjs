import { ClientOnly, Link, require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { Route } from "./router-B1jQBEKH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/runs._runId-QYX-oRrZ.js
var import_jsx_runtime = require_jsx_runtime();
function RunPage() {
	const { runId } = Route.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "stack",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "row",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					children: "← Start another"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/chat/$runId",
					params: { runId },
					children: "Chat"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: runId })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientOnly, { fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "muted",
			children: "Loading run…"
		}) })]
	});
}
//#endregion
export { RunPage as component };
