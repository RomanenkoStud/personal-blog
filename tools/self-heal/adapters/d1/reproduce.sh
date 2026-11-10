#!/usr/bin/env bash
# D1 adapter — rebuild a throwaway local D1 mirroring the remote schema and the remote
# applied-migrations list, then apply pending migrations to it. Exit code = apply result,
# so this both reproduces the failure and verifies a fix. No credentials needed.
#
# usage: reproduce.sh <snapshot-dir>   env: SELF_HEAL_D1_DATABASE
set -euo pipefail
snap="$1"; db="${SELF_HEAL_D1_DATABASE:?set migrations.d1.database}"
persist=.wrangler/self-heal-state

for f in remote-schema.sql applied.txt; do
  [ -f "$snap/$f" ] || { echo "missing $snap/$f" >&2; exit 2; }
done

rm -rf "$persist"; mkdir -p "$persist"
npx wrangler d1 execute "$db" --local --persist-to "$persist" --file "$snap/remote-schema.sql" > /dev/null

seed="$persist/applied.sql"
echo "CREATE TABLE IF NOT EXISTS d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL);" > "$seed"
while IFS= read -r name; do
  [ -n "$name" ] || continue
  printf "INSERT OR IGNORE INTO d1_migrations (name) VALUES ('%s');\n" "${name//\'/\'\'}" >> "$seed"
done < "$snap/applied.txt"
npx wrangler d1 execute "$db" --local --persist-to "$persist" --file "$seed" > /dev/null

echo "== pending migrations (relative to remote) =="
npx wrangler d1 migrations list "$db" --local --persist-to "$persist"
echo "== applying =="
npx wrangler d1 migrations apply "$db" --local --persist-to "$persist"
