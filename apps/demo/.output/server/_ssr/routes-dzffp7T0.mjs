import { __toESM$1 as __toESM } from "./rolldown-runtime-DaEwE2D6.mjs";
import { require_jsx_runtime, require_react } from "../_libs/livestore__react+react.mjs";
import { useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { isString$1 as isString } from "../_libs/@effect/opentelemetry+[...].mjs";
import { decodeUnknownSync } from "../_libs/@livestore/common+[...].mjs";
import { TwistEventSchema, fromWireEvent } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-dzffp7T0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
async function parseJson(res) {
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`HTTP ${res.status}: ${body}`);
	}
	return await res.json();
}
function createTwistClient(options = {}) {
	const baseUrl = (options.baseUrl ?? "").replace(/\/$/, "");
	const fetchFn = options.fetch ?? fetch;
	const client = {
		startAgent: async (definitionOrName, input, opts) => {
			const definitionName = isString(definitionOrName) ? definitionOrName : definitionOrName.name;
			return parseJson(await fetchFn(`${baseUrl}/actors/agent`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					definitionName,
					input,
					actorId: opts?.actorId
				})
			}));
		},
		startWorkflow: async (definitionOrName, input, opts) => {
			const definitionName = isString(definitionOrName) ? definitionOrName : definitionOrName.name;
			return parseJson(await fetchFn(`${baseUrl}/actors/workflow`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					definitionName,
					input,
					actorId: opts?.actorId
				})
			}));
		},
		getState: async (actorId) => {
			return (await parseJson(await fetchFn(`${baseUrl}/actors/${encodeURIComponent(actorId)}/state`))).state;
		},
		getEvents: async (actorId, opts) => {
			const params = new URLSearchParams();
			if (opts?.fromSeq !== void 0) params.set("fromSeq", String(opts.fromSeq));
			if (opts?.limit !== void 0) params.set("limit", String(opts.limit));
			const qs = params.toString();
			return (await parseJson(await fetchFn(`${baseUrl}/actors/${encodeURIComponent(actorId)}/events${qs ? `?${qs}` : ""}`))).events.map((raw) => fromWireEvent(decodeUnknownSync(TwistEventSchema)(raw)));
		},
		sendMessage: async (actorId, message) => {
			return (await parseJson(await fetchFn(`${baseUrl}/actors/${encodeURIComponent(actorId)}/signal`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ message })
			}))).state;
		},
		decideReview: async (actorId, reviewId, decision) => {
			return (await parseJson(await fetchFn(`${baseUrl}/actors/${encodeURIComponent(actorId)}/reviews/${encodeURIComponent(reviewId)}/decide`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					actionId: decision.actionId ?? decision.outcome,
					outcome: decision.outcome,
					payload: decision.payload
				})
			}))).state;
		},
		steer: async (actorId, message, opts) => {
			return (await parseJson(await fetchFn(`${baseUrl}/actors/${encodeURIComponent(actorId)}/steer`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					message,
					interrupt: opts?.interrupt,
					turn: opts?.turn
				})
			}))).state;
		},
		subscribeEvents: (actorId, onEvent, opts) => {
			let cancelled = false;
			let cursor = (opts?.fromSeq ?? 1) - 1;
			const pollIntervalMs = opts?.pollIntervalMs ?? 500;
			let timer;
			const startPolling = () => {
				const tick = async () => {
					if (cancelled) return;
					try {
						const events = await client.getEvents(actorId, { fromSeq: cursor + 1 });
						for (const event of events) {
							cursor = event.seq;
							onEvent(event);
						}
					} catch {}
				};
				tick();
				timer = setInterval(() => void tick(), pollIntervalMs);
			};
			startPolling();
			return () => {
				cancelled = true;
				if (timer) clearInterval(timer);
			};
		}
	};
	return client;
}
var twistClient = createTwistClient();
var DEFINITIONS = [
	{
		name: "echo",
		label: "echo (agent)",
		placeholder: "hi",
		start: (text) => twistClient.startAgent("echo", { text: text || "hi" })
	},
	{
		name: "greeter",
		label: "greeter (agent + tool)",
		placeholder: "Ada",
		start: (name) => twistClient.startAgent("greeter", { name: name || "world" })
	},
	{
		name: "orchestrator",
		label: "orchestrator (sub-agent)",
		placeholder: "summarize",
		start: (task) => twistClient.startAgent("orchestrator", { task: task || "summarize" })
	},
	{
		name: "hitl",
		label: "hitl (review gate)",
		placeholder: "draft document",
		start: (doc) => twistClient.startWorkflow("hitl", { doc: doc || "draft" })
	},
	{
		name: "pipeline",
		label: "pipeline (DAG + spawn)",
		placeholder: "21",
		start: (n) => twistClient.startWorkflow("pipeline", { n: Number(n) || 21 })
	}
];
function StartPanel() {
	const navigate = useNavigate();
	const [selected, setSelected] = (0, import_react.useState)(DEFINITIONS[0].name);
	const [input, setInput] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	const [pending, setPending] = (0, import_react.useState)(false);
	const def = DEFINITIONS.find((d) => d.name === selected) ?? DEFINITIONS[0];
	async function onStart() {
		setError(null);
		setPending(true);
		try {
			const result = await def.start(input.trim());
			await navigate({
				to: "/actors/$actorId",
				params: { actorId: result.actorId }
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
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Start a session" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "muted",
				children: "Creates an agent or workflow actor on the Twist host. LiveStore then syncs the event log through s2-lite."
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
						children: DEFINITIONS.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: d.name,
							children: d.label
						}, d.name))
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
