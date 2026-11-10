# Self-healing CI

When CI breaks, Claude agents defined in `.claude/agents/ci-*.md` try a fix. The fix runs through `anthropics/claude-code-action@v1` with `--agent <name>`.

| Failure | Workflow / job | Agent | Output |
|---|---|---|---|
| Unit tests / typecheck fail on a PR | `ci.yml` → `heal-tests` | `ci-test-fixer` (sonnet) | Commit pushed to the PR branch, plus a PR comment |
| `d1 migrations apply --remote` fails on deploy | `deploy.yml` → `heal-migrations` | `ci-migration-healer` (sonnet) | New PR `self-heal/migrations-<run>`. **Never applied automatically.** |

## Setup

1. Repo secret `ANTHROPIC_API_KEY` **or** `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`).
2. Settings → Actions → General → Workflow permissions: enable **"Allow GitHub Actions to create and approve pull requests"**. Without it, the migration healer can't open PRs.
3. Optional `SELF_HEAL_TOKEN` (fine-grained PAT or GitHub App token with `contents: write` on this repo). Pushes made with the default `GITHUB_TOKEN` **don't re-trigger CI**, so after a test heal the PR check stays red until the next push. With this token, CI re-runs on the fix. The 2-attempt budget prevents loops.

## Guardrails

The agent can't decide these. Deterministic workflow steps enforce them:

**Tests**
- Same-repo PRs only (fork PRs have no secrets anyway). Opt out per PR with the `no-self-heal` label.
- Tests are re-run first. If they pass on re-run, the failure is reported as flaky and nothing is changed.
- Max 2 heal commits per branch, counted by the `Self-Heal: unit-tests` trailer.
- The diff is rejected if it touches `.github/`, `.claude/`, `migrations/`, `package*.json` or `wrangler.toml`, deletes test files, or adds `.skip/.only/.todo/xit/@ts-ignore`.
- Tests and typecheck must pass again before anything is pushed.

**Migrations**
- The Cloudflare token is used only in the snapshot step: a schema-only `d1 export` plus a list of applied migrations. The agent has no remote access and never sees production data.
- `scripts/ci/reproduce-remote-d1.sh` rebuilds a local D1 from that snapshot and applies pending migrations. It confirms the failure and later verifies the fix.
- The diff may only touch `migrations/*.sql`, and never a migration that is already applied.
- Only one open `self-heal-migrations` PR at a time.
- Data-dependent failures (constraint violations on existing rows) can't be reproduced from the schema alone. The PR body says whether the failure was reproduced.

For all jobs, `persist-credentials: false` and an emptied `GH_TOKEN` mean the agent step holds no push token. Its Bash access is limited to an allowlist (`--allowedTools`).

## Running locally

Both agents also work as regular subagents, e.g. "use ci-test-fixer on the failing tests". To debug a migration locally, put a snapshot in `.heal/` and run `bash scripts/ci/reproduce-remote-d1.sh .heal`.
