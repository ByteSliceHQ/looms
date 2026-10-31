#!/usr/bin/env bash
# Apply the SQLite replica schema and the desk flag table to Wrangler's local D1.
set -euo pipefail

worker="$(cd "$(dirname "$0")/.." && pwd)"
cd "$worker"

bun x wrangler d1 migrations apply meridian-replica --local
