FROM oven/bun:1.3.14 AS build
WORKDIR /app
ENV LOOMS_FIXTURE_DIR=/app/examples/ax/fixture
COPY . .
RUN bun install --frozen-lockfile
RUN bun run build --filter=@swirls/looms...
RUN bun build examples/ax/server.ts examples/ax/worker.ts apps/ax-bridge/src/main.ts apps/ax-bridge/scripts/configure.ts --target=bun --outdir=/out/src --entry-naming='[name].js'

FROM oven/bun:1.3.14 AS runtime
WORKDIR /app

FROM runtime AS host
ENV LOOMS_FIXTURE_DIR=/app/examples/ax/fixture
COPY --from=build /out/src/server.js /app/src/server.js
COPY examples/ax/fixture /app/examples/ax/fixture
CMD ["bun", "/app/src/server.js"]

FROM runtime AS bridge
COPY --from=build /out/src/main.js /out/src/configure.js /app/src/
COPY apps/ax-bridge/proto /app/proto
CMD ["bun", "/app/src/main.js"]

FROM runtime AS worker
ENV LOOMS_FIXTURE_DIR=/app/examples/ax/fixture
COPY --from=build /out/src/worker.js /app/src/worker.js
COPY examples/ax/fixture /app/examples/ax/fixture
COPY --chmod=755 .ax-local/ax-task-runner /usr/local/bin/ax-task-runner
ENTRYPOINT ["/usr/local/bin/ax-task-runner"]
