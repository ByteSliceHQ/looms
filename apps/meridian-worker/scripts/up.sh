#!/usr/bin/env bash
# Create the Cloudflare resources for the Meridian desk, migrate D1, and deploy the worker and UI.
# Requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.
# Does not set OPENROUTER_API_KEY, TYPESAFE_AI_API_KEY, ROBINHOOD_API_KEY, ROBINHOOD_PRIVATE_KEY, or MERIDIAN_LIVE.
set -euo pipefail

worker="$(cd "$(dirname "$0")/.." && pwd)"
repo="$(cd "$worker/../.." && pwd)"
infra="$worker/infra"
deploy_config="$worker/wrangler.deploy.jsonc"
dev_vars="$worker/.dev.vars"
placeholder_token="meridian-dev-worker"
prefix="${MERIDIAN_PREFIX:-meridian}"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "Set CLOUDFLARE_API_TOKEN (Workers, D1, and Queues edit)." >&2
  exit 1
fi

if [[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
  echo "Set CLOUDFLARE_ACCOUNT_ID." >&2
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
  grep -v -E '^LOOMS_WORKER_TOKEN=' "$dev_vars" >"$tmp" || true
fi
{
  cat "$tmp"
  printf 'LOOMS_WORKER_TOKEN=%s\n' "$(quote_dotenv "$token")"
} >"$dev_vars"
echo "Wrote .dev.vars (LOOMS_WORKER_TOKEN)."

echo "Creating D1 ${prefix}-replica and the ${prefix}-orders queue."
(
  cd "$infra"
  terraform init -input=false
  terraform apply -input=false -auto-approve \
    -var "account_id=${CLOUDFLARE_ACCOUNT_ID}" \
    -var "name_prefix=${prefix}"
)

d1_id="$(terraform -chdir="$infra" output -raw d1_database_id)"
d1_name="$(terraform -chdir="$infra" output -raw d1_database_name)"

MERIDIAN_PREFIX="$prefix" bun "$worker/scripts/deploy-config.mjs" "$d1_id" "$deploy_config"
echo "Wrote wrangler.deploy.jsonc (D1 ${d1_id}, desk assets)."

echo "Applying replica migrations to ${d1_name}."
(
  cd "$worker"
  bun x wrangler d1 migrations apply "$d1_name" --remote --config "$deploy_config"
)

echo "Building Looms and the desk."
(cd "$repo" && bun x turbo run build --filter=@looms/meridian-ui)

echo "Deploying the worker (Durable Objects, crons, queue consumer, D1, UI)."
(
  cd "$worker"
  bun x wrangler deploy --config "$deploy_config"
  printf '%s' "$token" | bun x wrangler secret put LOOMS_WORKER_TOKEN --config "$deploy_config"
)

echo "Set LOOMS_WORKER_TOKEN. The deployed desk stays on the simulated exchange."
echo "OpenRouter, TypeSafe, and Robinhood were left unset. To add them yourself:"
echo "  bun x wrangler secret put OPENROUTER_API_KEY --config wrangler.deploy.jsonc"
echo "  bun x wrangler secret put TYPESAFE_AI_API_KEY --config wrangler.deploy.jsonc"
echo "  bun x wrangler secret put ROBINHOOD_API_KEY --config wrangler.deploy.jsonc"
echo "  bun x wrangler secret put ROBINHOOD_PRIVATE_KEY --config wrangler.deploy.jsonc"
echo "Live orders also need MERIDIAN_LIVE=1, which this script does not set."
echo "The desk is the workers.dev URL printed above. Tear it down with: bun run down"
