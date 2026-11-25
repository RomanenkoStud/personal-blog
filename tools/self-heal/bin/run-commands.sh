#!/usr/bin/env bash
# Run every command in <config.json> at <jq-path>.commands, stop at the first failure.
# usage: run-commands.sh <config.json> <jq-path> [log-file]     e.g. run-commands.sh cfg.json .routes.build
set -uo pipefail
cfg="$1"; path="$2"; log="${3:-/dev/null}"
: > "$log"
mapfile -t cmds < <(jq -r "${path}.commands[]?" "$cfg")
if [ "${#cmds[@]}" -eq 0 ]; then echo "self-heal: no commands configured at $path" | tee -a "$log"; exit 0; fi
for c in "${cmds[@]}"; do
  echo "\$ $c" | tee -a "$log"
  bash -c "$c" 2>&1 | tee -a "$log"
  code=${PIPESTATUS[0]}
  if [ "$code" -ne 0 ]; then echo "self-heal: '$c' exited $code" | tee -a "$log"; exit "$code"; fi
done
