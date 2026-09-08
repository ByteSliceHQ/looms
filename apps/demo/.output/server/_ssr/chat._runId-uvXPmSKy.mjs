import { ClientOnly, Link, require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { Route$1 } from "./router-B1jQBEKH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/chat._runId-uvXPmSKy.js
var import_jsx_runtime = require_jsx_runtime();
function ChatRunPage() {
	const { runId } = Route$1.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "stack",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "row",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/chat",
					children: "← New chat"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/runs/$runId",
					params: { runId },
					children: "Debugger"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: runId })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientOnly, { fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "muted",
			children: "Loading chat…"
		}) })]
	});
}
//#endregion
export { ChatRunPage as component };
