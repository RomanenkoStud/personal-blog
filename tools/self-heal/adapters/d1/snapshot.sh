#!/usr/bin/env bash
# D1 adapter — snapshot remote state for offline reproduction. Runs WITH Cloudflare
# credentials (CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID) and BEFORE the agent,
# which never gets them. Schema only: no rows, no PII.
#
# usage: snapshot.sh <out-dir>   env: SELF_HEAL_D1_DATABASE
# writes: <out>/remote-schema.sql, <out>/applied.txt (one applied migration filename per line)
set -euo pipefail
out="$1"; db="${SELF_HEAL_D1_DATABASE:?set migrations.d1.database}"
mkdir -p "$out"
npx wrangler d1 export "$db" --remote --no-data --output "$out/remote-schema.sql"
npx wrangler d1 execute "$db" --remote --json --command "SELECT name FROM d1_migrations ORDER BY id" \
  | jq -r '.[0].results[].name' > "$out/applied.txt"
echo "applied remotely: $(wc -l < "$out/applied.txt") migrations"
