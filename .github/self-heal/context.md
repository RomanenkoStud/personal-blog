# personal-blog — instructions for self-heal agents

## Context
- Astro 6 SSR blog deployed as a Cloudflare Worker. Bindings: D1 `DB` (blog-db), KV `SESSION`, R2 `MEDIA` (see `wrangler.toml`).
- Source in `src/`: `lib/` pure helpers, `server/` server-side services and repositories, `config/` constants, `pages/` routes. Prefer the existing conventions: config constants in `src/config`, data access through repositories, small single-purpose files.
- Unit tests: Vitest, `src/**/*.test.ts` next to the code (`npm run test`). `vitest.config.ts` is plain Vite with the `@` alias — it does not boot Astro or Cloudflare, so tests cover pure modules; fake D1 by stubbing `prepare().bind().run()/all()` (drizzle's D1 driver returns D1's own result shape: `meta.changes`, not `rowsAffected`).
- Typecheck: `npm run typecheck` = `tsc` over `tsconfig.typecheck.json`, deliberately scoped to `src/lib` and `src/config` (the rest still has pre-existing `astro check` errors). Never widen or narrow that scope to make a check pass.
- Build: `npm run build` (Astro + Vite via `@astrojs/cloudflare`).

## Off-Limits
- D1 schema is defined only by `migrations/NNNN_*.sql` (SQLite dialect). Never edit an existing migration to make code work.
- **Privacy contract (analytics/stats):** no personal data may ever be stored — no IPs, user agents, emails or identifiers in stats tables or logs. A test enforcing this is never "stale"; fix the code.
- Content (posts/pages) is user data: never change tests to accept data loss or silent truncation.

## Confidence Rules
- Anything touching auth (`src/server/auth.ts`, `src/config/auth.ts`, `src/middleware.ts`) or newsletter/subscriber data is at most `medium`.

## Fix Preferences
- Fix the code the PR changed; don't refactor neighbours. No new dependencies (manifests are protected anyway).

## Predefined Fixes
- `Cannot find module @rollup/rollup-linux-x64-gnu` or a sharp/`@img/sharp-linux-*` load error → `environment`: the lockfile omits Linux glibc binaries; CI must run `node scripts/ci/install-native-binaries.cjs` after `npm ci`. Never a code fix.
