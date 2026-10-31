#!/usr/bin/env bash
# Delete the Meridian worker (and its Durable Object storage), then destroy D1 and the queue.
# Requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.
set -euo pipefail

worker="$(cd "$(dirname "$0")/.." && pwd)"
infra="$worker/infra"
prefix="${MERIDIAN_PREFIX:-meridian}"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "Set CLOUDFLARE_API_TOKEN." >&2
  exit 1
fi

if [[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
  echo "Set CLOUDFLARE_ACCOUNT_ID." >&2
  exit 1
fi

echo "Unbinding the order queue so the worker can be deleted."
unbind="$worker/scripts/unbind.json"
cat >"$unbind" <<EOF
{
  "name": "${prefix}",
  "main": "stub.js",
  "compatibility_date": "2026-01-01",
  "durable_objects": {
    "bindings": [
      { "name": "LOOMS_RUN", "class_name": "LoomsRun" },
      { "name": "DESK", "class_name": "DeskBoard" }
    ]
  }
}
EOF

if ! (cd "$worker/scripts" && bun x wrangler deploy --config unbind.json); then
  echo "Unbind deploy failed (the worker may already be gone). Continuing." >&2
fi
rm -f "$unbind"

echo "Deleting the ${prefix} worker. Durable Object storage goes with it."
if ! (cd "$worker" && bun x wrangler delete "$prefix" --force); then
  echo "Worker delete failed (it may already be gone). Continuing." >&2
fi

rm -f "$worker/wrangler.deploy.jsonc"

echo "Destroying D1 and the order queue."
(
  cd "$infra"
  terraform init -input=false
  terraform destroy -input=false -auto-approve \
    -var "account_id=${CLOUDFLARE_ACCOUNT_ID}" \
    -var "name_prefix=${prefix}"
)

echo "Meridian Cloudflare resources are gone."
