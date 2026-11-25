---
name: init
description: Bootstrap self-healing CI in a repository — writes the repo overlay config and context, and wires the reusable self-heal workflows into existing CI/deploy workflows. Use when the user asks to set up, install, or add self-healing CI to a repo.
---

# Bootstrap self-heal in a repo (interactive)

1. **Vendor the kit** if the repo doesn't have it: run `bash <kit>/bootstrap.sh <repo-root>` (copies `tools/self-heal/`, the reusable workflows (`self-heal`, `self-heal-apply`, `self-heal-migrations`) plus the `self-heal-commands` caller, and templates for `.github/self-heal/config.yml` + `context.md`). It never overwrites existing files.
2. **Detect the stack** and fill `.github/self-heal/config.yml`:
   - `runtime.node` / `runtime.setup` — from `.nvmrc`/`engines`, lockfile type, any native-binary or codegen steps the existing CI runs before tests.
   - `routes.<name>` — one route per CI job worth healing (`tests`, `build` ship with skills; others need a skill). For each: `jobs` (the CI job ids), `commands` (exactly what that job runs), `allowed_tools` (Bash patterns for those runners, e.g. `Bash(npx vitest:*)`), and `apply` — leave the default `propose` unless the user wants high-confidence fixes committed (`auto`).
   - `guard.protected_paths` — repo paths no fixer may touch (migrations, infra config, CI scripts).
   - `migrations` — enable only if an adapter exists for the repo's migration system (`tools/self-heal/adapters/*`); otherwise leave disabled and tell the user which adapter would be needed.
3. **Write `.github/self-heal/context.md`** — 10–30 lines of repo knowledge an unattended fixer needs: architecture in one paragraph, where tests live and how they are structured, conventions that tests encode, things never to change. Ask the user to confirm anything you infer.
4. **Wire the callers** into existing workflows (show the diff, ask before writing):
   - PR healing: ONE job `needs: [<every job a route covers>]`, `if: failure() && github.event.pull_request.head.repo.full_name == github.repository`, `uses: ./.github/workflows/self-heal.yml`, `with: { needs: ${{ toJSON(needs) }} }`, `secrets: inherit`, permissions `contents: write`, `pull-requests: write`, `actions: read`.
   - `/heal apply`: keep `.github/workflows/self-heal-commands.yml` (issue_comment caller of `self-heal-apply.yml`).
   - migrations: expose the migrate step outcome as a job output and a job `if: failure() && needs.<job>.outputs.migrate == 'failure'` using `self-heal-migrations.yml`. The migrate step must `tee` its output to `migrate.log` and upload it as artifact `migrate-log` on failure.
5. **Secrets checklist** for the user: `CLAUDE_CODE_OAUTH_TOKEN` (`claude setup-token`) or `ANTHROPIC_API_KEY`; optional push identity so heal pushes re-trigger CI — a GitHub App (`vars.SELF_HEAL_APP_ID` + `secrets.SELF_HEAL_APP_PRIVATE_KEY`, preferred) or a `SELF_HEAL_TOKEN` PAT; for migrations, "Allow GitHub Actions to create and approve pull requests" and the adapter's credentials.
6. Remind the user: policy (kit + config) is read from the default branch, so self-heal activates only after the setup is merged.
