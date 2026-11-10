#!/usr/bin/env bash
# Rebuild a throwaway local D1 that mirrors the remote *schema* and the remote
# applied-migrations list, then apply pending migrations from ./migrations to it.
# Exit code = result of the migration apply, so it doubles as the verification step.
#
# Inputs (produced by the deploy workflow's snapshot step, no data / no PII):
#   $SNAP/remote-schema.sql        wrangler d1 export --no-data
#   $SNAP/applied-migrations.txt   one applied migration filename per line
set -euo pipefail

SNAP="${1:-.heal}"
DB=blog-db
PERSIST=.wrangler/heal-state

for f in remote-schema.sql applied-migrations.txt; do
  [ -f "$SNAP/$f" ] || { echo "missing $SNAP/$f" >&2; exit 2; }
done

rm -rf "$PERSIST"
mkdir -p "$PERSIST"

npx wrangler d1 execute "$DB" --local --persist-to "$PERSIST" --file "$SNAP/remote-schema.sql" > /dev/null

seed="$PERSIST/applied.sql"
echo "CREATE TABLE IF NOT EXISTS d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL);" > "$seed"
while IFS= read -r name; do
  [ -n "$name" ] || continue
  printf "INSERT OR IGNORE INTO d1_migrations (name) VALUES ('%s');\n" "${name//\'/\'\'}" >> "$seed"
done < "$SNAP/applied-migrations.txt"
npx wrangler d1 execute "$DB" --local --persist-to "$PERSIST" --file "$seed" > /dev/null

echo "== pending migrations (relative to remote) =="
npx wrangler d1 migrations list "$DB" --local --persist-to "$PERSIST"

echo "== applying =="
npx wrangler d1 migrations apply "$DB" --local --persist-to "$PERSIST"
