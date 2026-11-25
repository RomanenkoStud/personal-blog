# Wiring the reusable workflows into a repo

## PR healing (in the PR CI workflow)
One job covers every CI job that has a route in config (`routes.<name>.jobs`):
```yaml
  heal:
    needs: [unit-tests, build]   # every job a route covers
    if: failure() && github.event.pull_request.head.repo.full_name == github.repository
    permissions:
      contents: write
      pull-requests: write
      actions: read
    uses: ./.github/workflows/self-heal.yml
    with:
      needs: ${{ toJSON(needs) }}
    secrets: inherit
```

## `/heal apply | reject | revert` (comment commands)
Copy `.github/workflows/self-heal-commands.yml` as is: it runs on `issue_comment` (always from
the default branch) and calls `self-heal-command.yml`.

## Migrations (in the deploy workflow)
The deploy job must expose the migrate step's outcome and upload its log:
```yaml
  deploy:
    outputs:
      migrate: ${{ steps.migrate.outcome }}
    steps:
      # ...
      - name: Run migrations
        id: migrate
        run: |
          set -o pipefail
          <your migrate command> 2>&1 | tee migrate.log
      - if: failure() && steps.migrate.outcome == 'failure'
        uses: actions/upload-artifact@v4
        with: { name: migrate-log, path: migrate.log }

  heal-migrations:
    needs: deploy
    if: failure() && needs.deploy.outputs.migrate == 'failure'
    permissions:
      contents: write
      pull-requests: write
    uses: ./.github/workflows/self-heal-migrations.yml
    secrets: inherit
```

## Secrets
- `CLAUDE_CODE_OAUTH_TOKEN` (`claude setup-token`, Pro/Max) **or** `ANTHROPIC_API_KEY`
- push identity so heal pushes re-trigger CI (pushes with `GITHUB_TOKEN` don't): a GitHub App with
  contents + pull-requests write, as `vars.SELF_HEAL_APP_ID` + `secrets.SELF_HEAL_APP_PRIVATE_KEY`
  (preferred), or a `SELF_HEAL_TOKEN` PAT
- migrations: adapter credentials (d1: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) and
  Settings → Actions → "Allow GitHub Actions to create and approve pull requests"
