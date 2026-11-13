---
name: heal-migrations
description: Repair a failed production database migration unattended in CI. Use when a self-heal workflow hands you a migration failure and a schema snapshot in .heal/ — fixes pending migrations only; the result ships as a PR, never applied directly.
---

# Heal a failed migration (unattended CI, production)

You are running headless against a **production** failure. Nobody can answer questions. Your diff becomes a PR that a human reviews; merging it re-runs the deploy against prod. Prefer changing nothing over a risky change.

## Inputs (`.heal/`)
- `context.json` — adapter name, migrations dir, `method_skills`, `context_files`, failed commit.
- `migrate.log` — the remote error.
- `snapshot/` — adapter-produced state (schema only, no data) + `applied.txt` (immutable migrations).
- `repro.log` — result of replaying pending migrations against the snapshot; `reproduced` in `context.json`.

## Procedure
1. Read `context_files`, invoke every skill in `method_skills`, then read the adapter guide: `adapters/<adapter>.md` next to this file. It defines engine limitations and the verify command.
2. Find the failing migration and the exact engine error. Compare with the snapshot schema.
3. Classify: `already-applied-manually` (object exists), `missing-dependency`, `engine-limitation`, `data-dependent` (constraint violations on existing rows — cannot reproduce from schema), `other`.
4. Fix **pending** migrations only (not in `applied.txt`): idempotent, forward-safe SQL. For data-dependent failures, handle offending rows explicitly and **never silently drop user data**; if correctness requires losing data, change nothing.
5. Verify with the adapter's verify command until it passes.
6. Write `.heal/result.json` (`{"classification","fixed","confidence","root_cause","data_impact","reproduced"}`) and `.heal/summary.md` (≤ 30 lines: failing migration, cause, fix, data impact, reproduced vs reasoned).

## Hard rules (guard-enforced)
- Only edit files in the migrations dir; never an applied migration; never delete migration files.
- No remote database access — you have no credentials and must not seek them.
- No destructive statements on user tables unless part of a full-copy table rebuild.
- Never commit, push, checkout, reset or stash.
