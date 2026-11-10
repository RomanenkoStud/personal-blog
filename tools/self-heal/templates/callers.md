# Wiring the reusable workflows into a repo

## Tests (in the PR CI workflow)
```yaml
  heal-tests:
    needs: unit-tests            # your job that runs tests.commands
    if: failure() && github.event.pull_request.head.repo.full_name == github.repository
    permissions:
      contents: write
      pull-requests: write
    uses: ./.github/workflows/self-heal-tests.yml
    secrets: inherit
```

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
- optional `SELF_HEAL_TOKEN` (PAT/App token) so heal pushes re-trigger CI
- migrations: adapter credentials (d1: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) and
  Settings → Actions → "Allow GitHub Actions to create and approve pull requests"
