# self-heal kit

Self-healing CI for GitHub Actions: when a CI job fails on a PR (tests, build, …), or a production migration fails on deploy, a Claude agent diagnoses the failure and produces a fix. Deterministic code — not the agent — decides which healer runs, whether its fix is allowed out, and whether it is committed or only proposed. The kit is generic. A repo plugs in through one config file.

## Layers

| Layer | Where | Changes when | Owned by |
|---|---|---|---|
| **Method**: how to debug | community skill packs, installed per run (`agent.plugins`) | upstream improves | upstream maintainers |
| **Contract**: CI-specific skills, one per route | `plugin/self-heal/skills/*` (`heal-tests`, `heal-build`, `heal-migrations`, `review-fix`, `init`) | you tune the prompt strategy | kit |
| **Decisions**: route, budget, apply | `bin/heal.mjs` (pure functions, unit-tested) | rarely | kit |
| **Guardrails**: what may ship | `bin/guard.mjs`, `defaults.yml` safety floor, workflow steps | rarely | kit |
| **Repo overlay** | `.github/self-heal/config.yml` + `context.md` | stack or tooling changes | each repo |

The default method is [`mattpocock-skills:diagnosing-bugs`](https://github.com/mattpocock/skills). It builds a red-capable feedback loop, then minimises the case, ranks falsifiable hypotheses, instruments, adds a regression test and cleans up. Strategies can be swapped in config without touching a workflow:

```yaml
agent:
  plugins: [superpowers@claude-plugins-official]
  method_skills: [superpowers:systematic-debugging, superpowers:verification-before-completion]
```

## Pipeline

```
PR:  any routed job fails → route → gate → reproduce (passes? stop) → fix [route skill + method]
       → guard → re-verify → review [review-fix] → decide → auto: commit | propose: comment + /heal apply | diagnose
migrations: gate → snapshot (creds) → reproduce → fix [heal-migrations + adapter] → guard → verify → review → PR
```

- **One entry point.** CI calls `self-heal.yml` once, after all routed jobs, passing `toJSON(needs)`.
- **Route (deterministic).** `heal.mjs route` maps each failed job to the route whose `jobs` list contains it (`routes.tests`, `routes.build`, or any route an overlay adds). The route picks the skill, commands, tools and extra protected paths, so it is also the fixer's **permission set** — which is why it comes from job results and never from an LLM reading logs. One route per run, by `heal.priority`; the others are reported and healed on the next run.
- **Gate.** Opt-out label, `heal.max_attempts` fix commits per branch (the `Self-Heal: <route>` trailer), `heal.max_runs` agent runs per PR, and no second run for the same route at the same head SHA (re-runs). Runs are counted by a hidden marker in the bot's own comments.
- **Classification.** The fixer labels the failure `code-regression`, `stale-test` (tests only), `environment`, `flaky` or `unknown`, with a confidence. Only the first two get a fix; the rest become a diagnosis comment.
- **Guard (`bin/guard.mjs`).** For every route: protected paths (`guard.protected_paths` + the route's own), no deleted tests, forbidden added-line patterns (`.skip`, `.only`, `@ts-ignore`, …). Migrations are limited to unapplied files in the migrations dir. Overlays can **add** to the safety lists, never remove from them.
- **Review.** A separate read-only judge (`review-fix`) must approve. If it modifies the working tree, the fix is discarded.

## Apply policy

`heal.mjs decide` turns a fix into one of three outcomes. Config sets the ceiling; the agents' output can only lower it.

| `routes.<r>.apply` | Outcome for a guarded, re-verified, approved fix |
|---|---|
| `propose` (default) | PR comment with the diff, the judge's risks, `/heal apply`, and a `gh run download … && git apply` one-liner. The patch is uploaded as the `self-heal-patch` artifact. |
| `auto` | Committed to the PR branch **only if** the classification is in `auto_apply.classifications`, both fixer and judge confidence reach `auto_apply.min_confidence`, and review is enabled. Otherwise it is proposed, and the comment says which rule failed. |
| `diagnose` | No patch is offered, only the diagnosis. |

**`/heal apply [run-id]`** (`self-heal-commands.yml` → `self-heal-apply.yml`) commits a proposal. It runs from the default branch and never runs PR code or an agent: the commenter needs write access, the PR must be open and same-repo, the marker must come from the bot's own comment, the run must be a `pull_request` run for the current head, the PR head must not have moved since the proposal, and the guard re-checks the exact stored patch before commit.

**Pushes that re-trigger CI.** Pushes made with `GITHUB_TOKEN` do not start new workflow runs. Give self-heal a GitHub App (`vars.SELF_HEAL_APP_ID`, `secrets.SELF_HEAL_APP_PRIVATE_KEY`; contents + pull-requests write) or a `SELF_HEAL_TOKEN` PAT; otherwise the fix lands but CI must be re-run by hand.

## Trust model

- **Policy comes from the default branch.** That covers the kit scripts, skills, config and context files. This protects against the code under repair and the agent working on it, not against a collaborator editing workflow files in their own PR. Only the code under repair comes from the PR, so a PR can't loosen its own guardrails or rewrite the agent's instructions. The catch is that changes to the kit or config only take effect after merge. To test them earlier, override `policy_ref`.
- **Agent text is never trusted as structure.** `<!--` in agent-written summaries is escaped before posting, and only the last marker in a bot comment counts.
- **No push token while the agent runs.** Checkouts use `persist-credentials: false`, Bash is limited to allowlisted patterns, and the token appears only in the publish step.
- **Migrations:** adapter credentials exist only in the snapshot step, which captures the schema without data. The agent never reaches the remote database, and the fix ships as a PR.

## Config

See `defaults.yml` for every key and the merge rules. Minimal overlay: `templates/config.yml`.

## Adapters (migrations)

`adapters/<name>/snapshot.sh <out>` runs with credentials and writes `applied.txt` plus whatever state the reproduction needs. `adapters/<name>/reproduce.sh <snapshot>` runs without credentials and exits non-zero while the failure persists. Adapter settings come from `migrations.<name>.*` and are exported as `SELF_HEAL_<NAME>_<KEY>`. Engine notes for the agent live in `plugin/self-heal/skills/heal-migrations/adapters/<name>.md`.

Available: `d1` (Cloudflare D1).

## Adopting in another repo

```bash
tools/self-heal/bootstrap.sh ../other-repo     # vendors kit + workflows + config templates
```

Then fill in the config (one `routes.<name>` per CI job to heal) and context, and wire the callers (`templates/callers.md`). Alternatively, run Claude Code with `--plugin-dir tools/self-heal/plugin/self-heal` and use `/self-heal:init`.

## Extracting to its own repo later

The kit has no repo-specific values. To extract it:

1. Move `tools/self-heal/` and the reusable workflows (`self-heal.yml`, `self-heal-apply.yml`, `self-heal-migrations.yml`) into a new repo.
2. Callers switch to `uses: <owner>/self-heal-kit/.github/workflows/self-heal.yml@v1`.
3. The policy checkout points at the kit repo and ref instead of `tools/self-heal`. That's a small change to the "Checkout policy" step.
4. `plugin/` becomes a public marketplace (`/plugin marketplace add <owner>/self-heal-kit`).
