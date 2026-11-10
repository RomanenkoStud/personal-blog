---
name: heal-tests
description: Repair a failing test/typecheck suite unattended in CI. Use when a self-heal workflow hands you a failure log in .heal/ — classifies the failure, fixes only real regressions or stale tests, and writes a machine-readable result. Not for interactive debugging (use your method skill directly for that).
---

# Heal failing tests (unattended CI)

You are running headless in CI. **Nobody can answer questions.** Wherever a method skill says "ask the user" or "show the user", record it in the summary instead and continue — or stop if the skill says you must not proceed without an answer.

## Inputs (`.heal/`)
- `context.json` — PR number/title, base and head refs, the configured `commands`, `method_skills`, `context_files`.
- `failure.log` — output of the failing run (commands are run in order, first failure stops).

## Procedure

1. **Load context.** Read every file in `context_files` (repo conventions). Invoke every skill in `method_skills` with the Skill tool — that is your debugging method; follow it, subject to the overrides below.
2. **Classify** the failure before touching code. Exactly one of:
   - `code-regression` — the PR broke behaviour a still-valid test describes → fix the code.
   - `stale-test` — the PR *intentionally* changed behaviour (evidence in PR title, diff, commit messages) and the test asserts the old behaviour → update the test's expectations, never its intent.
   - `environment` — tooling, dependency, network, runner or config issue outside the code → do not change code; diagnose only.
   - `flaky` — non-deterministic; reproduce rate < 100% → do not "fix" by retrying or loosening; diagnose only unless you can remove the non-determinism at its source.
   - `unknown` — you could not build a red-capable feedback loop → change nothing.
3. **Build the feedback loop** with the configured commands (or a narrower invocation of the same runner, e.g. one test file). It must go red on *this* failure before you hypothesise.
4. **Fix minimally** for `code-regression` / `stale-test`. No refactors, no formatting churn, no unrelated files. Remove all temporary instrumentation.
5. **Verify** by running every configured command. All must pass.
6. **Write outputs** (always, even when you change nothing):
   - `.heal/result.json`:
     ```json
     {"classification": "code-regression", "fixed": true, "confidence": "high|medium|low",
      "root_cause": "one sentence", "hypotheses_rejected": ["..."], "files_changed": ["..."]}
     ```
   - `.heal/summary.md` — ≤ 25 lines for the PR comment: classification, root cause (the hypothesis that held), what changed and why, what you could not resolve.

## Hard rules (enforced by a guard after you finish — violations discard your work)
- Never skip, focus, delete, or comment out tests; never add `@ts-ignore`/`@ts-expect-error`/`eslint-disable`; never weaken assertions to force green.
- Never edit protected paths: CI config, agent config, lockfiles/manifests, the self-heal kit. If the real fix needs one of those, classify `environment` and explain.
- Never commit, push, checkout, reset or stash. The workflow handles git.
- An honest "could not fix" is a success. A green suite that no longer tests the behaviour is the worst outcome.
