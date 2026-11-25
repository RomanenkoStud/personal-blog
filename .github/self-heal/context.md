# personal-blog — context for self-heal agents

- Astro 6 SSR blog deployed as a Cloudflare Worker. Bindings: D1 `DB` (blog-db), KV `SESSION`, R2 `MEDIA` (see `wrangler.toml`).
- Build needs Linux glibc native binaries (rollup/sharp) that the lockfile omits; CI installs them with `scripts/ci/install-native-binaries.cjs`. A `Cannot find module @rollup/rollup-linux-*` or sharp load error is `environment`, never a code fix.
- Source in `src/`: `lib/` pure helpers, `server/` server-side services and repositories, `config/` constants, `pages/` routes. Prefer the existing conventions: config constants in `src/config`, data access through repositories, small single-purpose files.
- There is no unit-test or typecheck suite yet (no `test`/`typecheck` npm scripts). The CI signal is `npm run build` (Astro + Vite via `@astrojs/cloudflare`). If tests are added later, keep them next to the code as `src/**/*.test.ts`.
- D1 schema is defined only by `migrations/NNNN_*.sql` (SQLite dialect). Never edit an existing migration to make code work.
- **Privacy contract (analytics/stats):** no personal data may ever be stored — no IPs, user agents, emails or identifiers in stats tables or logs. A test enforcing this is never "stale"; fix the code.
- Content (posts/pages) is user data: never change tests to accept data loss or silent truncation.
