---
name: heal-build
description: Repair a failing production build unattended in CI. Use when the self-heal workflow routes a failed build job to you with a log in .heal/ — classifies the failure, fixes only build breaks the PR's own source changes caused, and writes a machine-readable result. Not for interactive debugging.
---

# Heal a failing build (unattended CI)

You are running headless in CI. **Nobody can answer questions.** Wherever a method skill says "ask the user", record it in the summary instead and continue — or stop if the skill says you must not proceed without an answer.

## Inputs (`.heal/`)
- `context.json` — route, PR number/title, base and head refs, the configured build `commands`, `method_skills`, `context_files`.
- `failure.log` — output of the failing build (commands run in order, first failure stops).

## Procedure

1. **Load context.** Read every file in `context_files`. Invoke every skill in `method_skills` with the Skill tool and follow it, subject to the overrides below.
2. **Find the first real error.** Build logs cascade: one bad import produces dozens of follow-on errors. Locate the earliest error, then check `diff_command` — is the failing file, or something it imports, changed by this PR?
3. **Classify** before touching code. Exactly one of:
   - `code-regression` — the PR's source changes break the build (bad import/export, type or syntax error, wrong API use, a page/route the bundler rejects) → fix the code.
   - `environment` — the fix needs a dependency, lockfile, native binary, env var, secret, runner or build-config change (`package.json`, lockfiles, CI files are protected) → do not change code; diagnose only and say exactly what a human must change.
   - `flaky` — the build fails intermittently (network fetch, race in codegen) → diagnose only.
   - `unknown` — you cannot reproduce the failure or locate its cause → change nothing.
   (`stale-test` does not apply to builds.)
4. **Build the feedback loop** with the configured commands. It must fail on *this* error before you change anything.
5. **Fix minimally**: the smallest source change that makes the PR's intent build. Never delete or stub out the feature the PR adds to make the build pass; never silence the compiler.
6. **Verify** by running every configured command. All must pass.
7. **Write outputs** (always, even when you change nothing):
   - `.heal/result.json`:
     ```json
     {"classification": "code-regression", "fixed": true, "confidence": "high|medium|low",
      "root_cause": "one sentence", "first_error": "file:line message", "hypotheses_rejected": ["..."], "files_changed": ["..."]}
     ```
   - `.heal/summary.md` — ≤ 25 lines for the PR comment: classification, the first real error, root cause, what changed and why, what a human must still do.

## Hard rules (enforced by a guard after you finish — violations discard your work)
- Never add `@ts-ignore`/`@ts-expect-error`/`@ts-nocheck`/`eslint-disable`; never delete tests.
- Never edit protected paths: CI config, agent config, lockfiles/manifests, the self-heal kit, and any repo-protected path (see context files).
- Never commit, push, checkout, reset or stash. The workflow handles git.
- `confidence: high` only when you reproduced the failure, the fix is the PR's evident intent, and the build passes. An honest "could not fix" is a success.
