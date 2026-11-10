# self-heal kit

Self-healing CI for GitHub Actions: when unit tests fail on a PR, or a production migration fails on deploy, a Claude agent diagnoses the failure and proposes a fix. Deterministic guardrails decide whether that fix is allowed out. The kit is generic. A repo plugs in through one config file.

## Layers

| Layer | Where | Changes when | Owned by |
|---|---|---|---|
| **Method**: how to debug | community skill packs, installed per run (`agent.plugins`) | upstream improves | upstream maintainers |
| **Contract**: CI-specific skills | `plugin/self-heal/skills/*` (`heal-tests`, `heal-migrations`, `review-fix`, `init`) | you tune the prompt strategy | kit |
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
tests:      gate → reproduce (flaky? stop) → fix [heal-tests + method] → guard → re-run → review [review-fix] → push + comment
migrations: gate → snapshot (creds) → reproduce → fix [heal-migrations + adapter] → guard → verify → review → PR
```

- **Gate:** checks that healing is enabled, that the PR doesn't carry the opt-out label, and that the attempt budget isn't used up (counted by the `Self-Heal: tests` commit trailer). For migrations, it also checks that no heal PR is already open.
- **Classification:** the fixer must label the failure as `code-regression`, `stale-test`, `environment`, `flaky` or `unknown`. It only fixes the first two. Every other outcome is posted as a diagnosis comment.
- **Guard (`bin/guard.mjs`):** protected paths, no deleted tests, forbidden added-line patterns (`.skip`, `.only`, `@ts-ignore`, …), and migrations limited to unapplied files in the migrations dir. Overlays can **add** to these safety lists but never remove from them.
- **Review:** a separate, read-only judge (`review-fix`) has to approve the fix. If the judge modifies the working tree, the fix is rejected.

## Trust model

- **Policy comes from the default branch.** That covers the kit scripts, skills, config and context files. Only the code under repair comes from the PR, so a PR can't loosen its own guardrails or rewrite the agent's instructions. The catch is that changes to the kit or config only take effect after merge. To test them earlier, override `policy_ref`.
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

Then fill in the config and context, and wire the callers (`templates/callers.md`). Alternatively, run Claude Code with `--plugin-dir tools/self-heal/plugin/self-heal` and use `/self-heal:init`.

## Extracting to its own repo later

The kit has no repo-specific values. To extract it:

1. Move `tools/self-heal/` and the two `self-heal-*.yml` reusable workflows into a new repo.
2. Callers switch to `uses: <owner>/self-heal-kit/.github/workflows/self-heal-tests.yml@v1`.
3. The policy checkout points at the kit repo and ref instead of `tools/self-heal`. That's a small change to the "Checkout policy" step.
4. `plugin/` becomes a public marketplace (`/plugin marketplace add <owner>/self-heal-kit`).
