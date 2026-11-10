#!/usr/bin/env bash
# Run every command in <config.json>.<section>.commands, stop at the first failure.
# usage: run-commands.sh <config.json> <section> [log-file]
set -uo pipefail
cfg="$1"; section="$2"; log="${3:-/dev/null}"
: > "$log"
mapfile -t cmds < <(jq -r --arg s "$section" '.[$s].commands[]' "$cfg")
if [ "${#cmds[@]}" -eq 0 ]; then echo "self-heal: no $section.commands configured" | tee -a "$log"; exit 0; fi
for c in "${cmds[@]}"; do
  echo "\$ $c" | tee -a "$log"
  bash -c "$c" 2>&1 | tee -a "$log"
  code=${PIPESTATUS[0]}
  if [ "$code" -ne 0 ]; then echo "self-heal: '$c' exited $code" | tee -a "$log"; exit "$code"; fi
done
