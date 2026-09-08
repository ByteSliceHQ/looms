import { __toESM } from "../_runtime.mjs";
import { require_jsx_runtime, require_react, useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { assistant } from "./ssr.mjs";
import { createLoomsClient } from "./client-BrxKZ27w.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/chat.index-hBRS_KXp.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var loomsClient = createLoomsClient();
function ChatStartPage() {
	const navigate = useNavigate();
	const [input, setInput] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	const [pending, setPending] = (0, import_react.useState)(false);
	async function onStart() {
		const text = input.trim();
		if (!text) return;
		setError(null);
		setPending(true);
		try {
			const result = await loomsClient.start(assistant, text);
			await navigate({
				to: "/chat/$runId",
				params: { runId: result.runId }
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setPending(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "panel",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Chat" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "muted",
				children: [
					"Starts the conversational ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "assistant" }),
					" agent. Tools include greet, specialist, checkout, and a standalone approval gate."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: input,
					onChange: (e) => setInput(e.target.value),
					placeholder: "Ask the assistant to greet someone, or run checkout…",
					onKeyDown: (e) => {
						if (e.key === "Enter") onStart();
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: pending || input.trim().length === 0,
					onClick: () => void onStart(),
					children: pending ? "Starting…" : "Start chat"
				})]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "error",
				children: error
			}) : null
		]
	});
}
//#endregion
export { ChatStartPage as component };
