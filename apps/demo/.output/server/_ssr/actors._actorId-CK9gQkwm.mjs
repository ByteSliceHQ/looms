import { __toESM$1 as __toESM } from "./rolldown-runtime-DaEwE2D6.mjs";
import { require_jsx_runtime, require_react, useSyncStatus } from "../_libs/livestore__react+react.mjs";
import { Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { Route, decideReview, queries, useActorStore } from "./router-CaiYRCFU.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/actors._actorId-CK9gQkwm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ReviewActions({ store, reviewId }) {
	function decide(outcome) {
		decideReview(store, {
			reviewId,
			actionId: outcome,
			outcome
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "row tight",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "ok",
			onClick: () => decide("approve"),
			children: "Approve"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "bad",
			onClick: () => decide("reject"),
			children: "Reject"
		})]
	});
}
function SyncBadge({ store }) {
	const status = useSyncStatus({ store });
	const label = status.isSynced ? "synced" : `syncing${status.pendingCount ? ` (${status.pendingCount})` : ""}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: `sync-badge ${status.isSynced ? "ok" : "warn"}`,
		title: JSON.stringify(status),
		children: ["LiveStore · ", label]
	});
}
function MaterializedView({ store, actorId }) {
	const actors = store.useQuery(queries.actors);
	const messages = store.useQuery(queries.messages);
	const nodes = store.useQuery(queries.nodes);
	const reviews = store.useQuery(queries.reviews);
	const children = store.useQuery(queries.children).filter((c) => c.parentActorId === actorId);
	const events = store.useQuery(queries.events);
	const status = actors.find((a) => a.actorId === actorId)?.status ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "stack",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "row",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SyncBadge, { store }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: `status ${status ?? ""}`,
				children: ["status: ", status ?? "—"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "panel",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Event timeline" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "timeline",
					children: events.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "muted",
						children: "Waiting for LiveStore sync…"
					}) : events.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "evt",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "seq",
							children: ["#", e.seq]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "type",
							children: e.type
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "payload",
							children: e.payloadJson
						})] })]
					}, e.id))
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "stack",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "panel",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Messages" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: messages.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "muted",
							children: "—"
						}) : messages.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: m.role }),
							": ",
							m.content
						] }, m.id)) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "panel",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Nodes" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: nodes.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "muted",
							children: "—"
						}) : nodes.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: n.nodeId }),
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `status ${n.status}`,
								children: n.status
							})
						] }, n.id)) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "panel",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Reviews" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: reviews.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "muted",
							children: "—"
						}) : reviews.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: r.title }),
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `status ${r.status}`,
								children: r.status
							})
						] }), r.status === "pending" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewActions, {
							store,
							reviewId: r.reviewId,
							actorId
						}) : null] }, r.reviewId)) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "panel",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Children" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: children.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "muted",
							children: "—"
						}) : children.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/actors/$actorId",
								params: { actorId: c.childActorId },
								className: "link",
								children: c.childActorId
							}),
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `status ${c.status}`,
								children: c.status
							}),
							c.definitionName ? ` · ${c.definitionName}` : ""
						] }, c.childActorId)) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "panel",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Actors table" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: actors.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "muted",
							children: "—"
						}) : actors.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: a.actorId }),
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `status ${a.status ?? ""}`,
								children: a.status ?? "—"
							}),
							a.definitionName ? ` · ${a.definitionName}` : ""
						] }, a.actorId)) })]
					})
				]
			})]
		})]
	});
}
function ActorPage() {
	const { actorId } = Route.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "stack",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "row",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				children: "← Start another"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: actorId })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
			fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "muted",
				children: "Loading LiveStore…"
			}),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActorStoreView, { actorId })
		})]
	});
}
function ActorStoreView({ actorId }) {
	const store = useActorStore(actorId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MaterializedView, {
		store,
		actorId
	});
}
//#endregion
export { ActorPage as component };
