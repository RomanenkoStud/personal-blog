#!/usr/bin/env bash
# Vendor the self-heal kit into another repository. Never overwrites existing files.
# usage: tools/self-heal/bootstrap.sh <target-repo-root>
# Then: fill .github/self-heal/{config.yml,context.md} and wire callers (templates/callers.md),
# or run the `self-heal:init` skill in Claude Code to do it interactively.
set -euo pipefail
src_kit="$(cd "$(dirname "$0")" && pwd)"
src_root="$(cd "$src_kit/../.." && pwd)"
dst="$(cd "${1:?usage: bootstrap.sh <target-repo-root>}" && pwd)"

copy() { # copy <from> <to> without clobbering
  if [ -e "$2" ]; then echo "skip   $2 (exists)"; else mkdir -p "$(dirname "$2")"; cp -R "$1" "$2"; echo "create $2"; fi
}

copy "$src_kit"                                             "$dst/tools/self-heal"
copy "$src_root/.github/workflows/self-heal-tests.yml"      "$dst/.github/workflows/self-heal-tests.yml"
copy "$src_root/.github/workflows/self-heal-migrations.yml" "$dst/.github/workflows/self-heal-migrations.yml"
copy "$src_kit/templates/config.yml"                        "$dst/.github/self-heal/config.yml"
copy "$src_kit/templates/context.md"                        "$dst/.github/self-heal/context.md"
grep -qxF '.heal/' "$dst/.gitignore" 2>/dev/null || { echo '.heal/' >> "$dst/.gitignore"; echo "update .gitignore (.heal/)"; }

cat <<EOF

Next:
  1. Edit .github/self-heal/config.yml (commands, tools, migrations adapter) and context.md.
  2. Wire the callers into your workflows: tools/self-heal/templates/callers.md
     (or in Claude Code: claude --plugin-dir tools/self-heal/plugin/self-heal, then /self-heal:init)
  3. Add secrets, merge to the default branch — policy is read from there.
EOF
