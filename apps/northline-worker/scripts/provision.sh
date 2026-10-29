#!/usr/bin/env bash
# Create the Cloudflare resources for the Northline desk and write its local env.
# Requires DATABASE_URL (PlanetScale Postgres, or any Postgres Hyperdrive can reach).
# Does not set OPENROUTER_API_KEY, TYPESAFE_AI_API_KEY, or LOOMS_EVALUATOR_MODEL.
set -euo pipefail

worker="$(cd "$(dirname "$0")/.." && pwd)"
repo="$(cd "$worker/../.." && pwd)"
cd "$worker"

queue_name="northline-recovery"
hyperdrive_name="northline"
binding="NORTHLINE_DB"
placeholder_token="northline-dev-worker"
dev_vars="$worker/.dev.vars"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Set DATABASE_URL to the Postgres connection string, then run this again." >&2
  echo "A PlanetScale Postgres database created from the Cloudflare dashboard is the one Hyperdrive can attach." >&2
  exit 1
fi

quote_dotenv() {
  local value=$1
  value=${value//\\/\\\\}
  value=${value//\"/\\\"}
  printf '"%s"' "$value"
}

read_dotenv() {
  local key=$1
  [[ -f "$dev_vars" ]] || return 0
  local line
  line="$(grep -E "^${key}=" "$dev_vars" | tail -n 1 || true)"
  [[ -n "$line" ]] || return 0
  local value="${line#*=}"
  if [[ "$value" == \"*\" ]]; then
    local len=$((${#value} - 2))
    value="${value:1:$len}"
    value="${value//\\\"/\"}"
    value="${value//\\\\/\\}"
  fi
  printf '%s' "$value"
}

token="${LOOMS_WORKER_TOKEN:-}"
if [[ -z "$token" || "$token" == "$placeholder_token" ]]; then
  token="$(read_dotenv LOOMS_WORKER_TOKEN)"
fi
if [[ -z "$token" || "$token" == "$placeholder_token" ]]; then
  token="$(bun -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex"))')"
fi

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
if [[ -f "$dev_vars" ]]; then
  grep -v -E '^(DATABASE_URL|LOOMS_WORKER_TOKEN|CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_NORTHLINE_DB)=' "$dev_vars" >"$tmp" || true
fi
{
  cat "$tmp"
  printf 'DATABASE_URL=%s\n' "$(quote_dotenv "$DATABASE_URL")"
  printf 'LOOMS_WORKER_TOKEN=%s\n' "$(quote_dotenv "$token")"
  printf 'CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_NORTHLINE_DB=%s\n' "$(quote_dotenv "$DATABASE_URL")"
} >"$dev_vars"
echo "Wrote .dev.vars (DATABASE_URL, LOOMS_WORKER_TOKEN, Hyperdrive local connection)."

run_wrangler() {
  bun x wrangler "$@"
}

if ! create_queue="$(run_wrangler queues create "$queue_name" 2>&1)"; then
  if printf '%s' "$create_queue" | grep -qi 'already exists'; then
    echo "Queue ${queue_name} already exists."
  else
    printf '%s\n' "$create_queue" >&2
    exit 1
  fi
else
  printf '%s\n' "$create_queue"
fi

hyperdrive_id=""
if ! created="$(run_wrangler hyperdrive create "$hyperdrive_name" \
  --connection-string "$DATABASE_URL" \
  --binding "$binding" \
  --update-config \
  --caching-disabled 2>&1)"; then
  if printf '%s' "$created" | grep -qi 'already exists'; then
    echo "Hyperdrive ${hyperdrive_name} already exists."
    hyperdrive_id="$(
      run_wrangler hyperdrive list | awk -F'│' -v name="$hyperdrive_name" '
        NF < 3 { next }
        {
          id = $2
          config = $3
          gsub(/^[ \t]+|[ \t]+$/, "", id)
          gsub(/^[ \t]+|[ \t]+$/, "", config)
          if (config == name) print id
        }
      '
    )"
    if [[ -z "$hyperdrive_id" ]]; then
      echo "Could not read the Hyperdrive id from wrangler hyperdrive list." >&2
      exit 1
    fi
    run_wrangler hyperdrive update "$hyperdrive_id" \
      --connection-string "$DATABASE_URL" \
      --caching-disabled
    bun scripts/ensure-hyperdrive.mjs "$worker/wrangler.jsonc" "$hyperdrive_id"
  else
    printf '%s\n' "$created" >&2
    exit 1
  fi
else
  printf '%s\n' "$created"
fi

echo "Applying replica migrations."
(cd "$repo" && DATABASE_URL="$DATABASE_URL" bun x looms replica migrate)

echo "Deploying the worker (Durable Objects, cron, queue consumer, Hyperdrive)."
run_wrangler deploy

printf '%s' "$token" | run_wrangler secret put LOOMS_WORKER_TOKEN
echo "Set LOOMS_WORKER_TOKEN. OpenRouter and TypeSafe keys were left unchanged."
