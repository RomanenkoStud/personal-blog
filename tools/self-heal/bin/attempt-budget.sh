#!/usr/bin/env bash
# Count self-heal commits on this branch since it diverged from <base>.
# usage: attempt-budget.sh <base-ref> <max> → prints "used=N" and "exhausted=true|false"
set -euo pipefail
base="$1"; max="$2"
used=$(git log --format=%B "origin/${base}..HEAD" | grep -c '^Self-Heal: tests' || true)
echo "used=$used"
if [ "$used" -ge "$max" ]; then echo "exhausted=true"; else echo "exhausted=false"; fi
