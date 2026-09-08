import { __toESM } from "../_runtime.mjs";
import { require_jsx_runtime, require_react, useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { checkout, echo, greeter, orchestrator, pipeline } from "./ssr.mjs";
import { createLoomsClient } from "./client-BrxKZ27w.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DX_MkdNg.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var loomsClient = createLoomsClient();
var DEFINITIONS = [
	{
		name: echo.name,
		label: "echo (agent)",
		placeholder: "hi",
		start: (text) => loomsClient.start(echo, { text: text || "hi" })
	},
	{
		name: greeter.name,
		label: "greeter (agent + tool)",
		placeholder: "Ada",
		start: (name) => loomsClient.start(greeter, { name: name || "world" })
	},
	{
		name: orchestrator.name,
		label: "orchestrator (sub-agent)",
		placeholder: "summarize",
		start: (task) => loomsClient.start(orchestrator, { task: task || "summarize" })
	},
	{
		name: checkout.name,
		label: "checkout (approval + payments)",
		placeholder: "150",
		start: (amount) => loomsClient.start(checkout, {
			amount: Number(amount) || 150,
			currency: "USD"
		})
	},
	{
		name: pipeline.name,
		label: "pipeline (DAG + spawn)",
		placeholder: "21",
		start: (n) => loomsClient.start(pipeline, { n: Number(n) || 21 })
	}
];
function StartPanel() {
	const navigate = useNavigate();
	const [selected, setSelected] = (0, import_react.useState)(DEFINITIONS[0].name);
	const [input, setInput] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	const [pending, setPending] = (0, import_react.useState)(false);
	const def = DEFINITIONS.find((item) => item.name === selected) ?? DEFINITIONS[0];
	async function onStart() {
		setError(null);
		setPending(true);
		try {
			const result = await def.start(input.trim());
			await navigate({
				to: "/runs/$runId",
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
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Start a run" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "muted",
				children: "Creates a run on the Looms kernel. Open the debugger to inspect the thread tree, or chat for conversational agents."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "row",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						value: selected,
						onChange: (e) => {
							setSelected(e.target.value);
							setInput("");
						},
						children: DEFINITIONS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: item.name,
							children: item.label
						}, item.name))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: input,
						onChange: (e) => setInput(e.target.value),
						placeholder: def.placeholder,
						onKeyDown: (e) => {
							if (e.key === "Enter") onStart();
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: pending,
						onClick: () => void onStart(),
						children: pending ? "Starting…" : "Start"
					})
				]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "error",
				children: error
			}) : null
		]
	});
}
var SplitComponent = StartPanel;
//#endregion
export { SplitComponent as component };
