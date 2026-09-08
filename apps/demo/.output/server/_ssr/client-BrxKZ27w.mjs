//#region node_modules/.nitro/vite/services/ssr/assets/client-BrxKZ27w.js
function createLoomsClient(options = {}) {
	const baseUrl = (options.baseUrl ?? "").replace(/\/$/, "");
	const fetchImpl = options.fetch ?? fetch;
	async function request(path, init) {
		const headers = new Headers(init?.headers);
		if (!headers.has("content-type")) headers.set("content-type", "application/json");
		const res = await fetchImpl(`${baseUrl}${path}`, {
			...init,
			headers
		});
		if (!res.ok) {
			const body = await res.text();
			throw new Error(body || `HTTP ${res.status}`);
		}
		return await res.json();
	}
	return {
		/** Start a run by `{ kind, definitionName }` when you only have names. */
		startRun: (args) => request("/runs", {
			method: "POST",
			body: JSON.stringify(args)
		}),
		/** Start a run from a definition object (agent, workflow, or your own kind). */
		start: (definition, input) => request("/runs", {
			method: "POST",
			body: JSON.stringify({
				kind: definition.kind,
				definitionName: definition.name,
				input
			})
		}),
		getRun: (runId) => request(`/runs/${runId}`),
		getState: (runId) => request(`/runs/${runId}`),
		getEvents: (runId, opts) => {
			const params = new URLSearchParams();
			if (opts?.fromSeq !== void 0) params.set("fromSeq", String(opts.fromSeq));
			if (opts?.limit !== void 0) params.set("limit", String(opts.limit));
			const q = params.toString();
			return request(`/runs/${runId}/events${q ? `?${q}` : ""}`);
		},
		signal: (runId, events) => request(`/runs/${runId}/events`, {
			method: "POST",
			body: JSON.stringify({ events })
		}),
		wake: (runId) => request(`/runs/${runId}/wake`, { method: "POST" }),
		replayTo: (runId, seq) => request(`/runs/${runId}/replay?seq=${seq}`),
		project: (runId, name) => request(`/runs/${runId}/projections/${name}`),
		subscribeEvents: (runId, onEvent, intervalMs = 400) => {
			let fromSeq = 1;
			let stopped = false;
			const tick = async () => {
				if (stopped) return;
				try {
					const { events } = await request(`/runs/${runId}/events?fromSeq=${fromSeq}`);
					for (const event of events) {
						onEvent(event);
						fromSeq = Math.max(fromSeq, event.seq + 1);
					}
				} catch {}
				if (!stopped) setTimeout(() => void tick(), intervalMs);
			};
			tick();
			return () => {
				stopped = true;
			};
		}
	};
}
//#endregion
export { createLoomsClient };
