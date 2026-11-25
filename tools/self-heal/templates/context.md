# <repo> — instructions for self-heal agents

<!-- Read from the default branch. Keep the five headings: the heal skills look for them.
     Keep it short: every line is read on every run. -->

## Context
- Architecture in one paragraph: runtime, framework, where the main modules live.
- Tests: framework, location/naming, shared fakes/fixtures to reuse.
- Conventions tests encode (naming, layering, error handling).

## Off-Limits
- Invariants a test must never be "updated" away from (security, privacy, data integrity).
- Files and areas never to change: generated files, schema files, vendored code.
  (Paths that must be enforced, not just asked for, belong in `guard.protected_paths`.)

## Confidence Rules
- When a fix may be rated `high` in this repo, and when it must never be (e.g. "anything
  touching auth or billing is at most `medium`").

## Fix Preferences
- How fixes should look here: e.g. "fix the code, not the test", "prefer narrowing types
  over casts", "no new dependencies".

## Predefined Fixes
<!-- Known failure → known fix. The fixer checks these first; most CI pain is repeats. -->
- `<error signature>` → `<classification>`: <what to do / what to tell the human>.
