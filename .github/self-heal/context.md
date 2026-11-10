# personal-blog — context for self-heal agents

- Astro 6 SSR blog deployed as a Cloudflare Worker. Bindings: D1 `DB` (blog-db), KV `SESSION`, R2 `MEDIA` (see `wrangler.toml`).
- Source in `src/`: `lib/` pure helpers, `server/` server-side services and repositories, `config/` constants, `pages/` routes. Prefer the existing conventions: config constants in `src/config`, data access through repositories, small single-purpose files.
- Unit tests (Vitest, `src/**/*.test.ts`) live next to the code. D1 is faked with `src/server/testing/FakeD1.ts` — extend the fake rather than mocking ad hoc. Typecheck: `npm run typecheck` (tsconfig.stats.json).
- D1 schema is defined only by `migrations/NNNN_*.sql` (SQLite dialect). Never edit an existing migration to make code work.
- **Privacy contract (analytics/stats):** no personal data may ever be stored — no IPs, user agents, emails or identifiers in stats tables or logs. A test enforcing this is never "stale"; fix the code.
- Content (posts/pages) is user data: never change tests to accept data loss or silent truncation.
