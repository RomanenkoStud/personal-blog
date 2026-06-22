# personal-blog

Personal blog built with [Astro](https://astro.build), deployed on [Cloudflare Pages](https://pages.cloudflare.com) with D1 as the database.

## Stack

- **Astro** — static + SSR hybrid
- **Cloudflare Pages / Workers** — hosting and edge runtime
- **D1** — SQLite database at the edge
- **Drizzle ORM** — type-safe queries
- **Tailwind CSS v4** — styling
- **Lit** — web components (search, theme toggle, newsletter)
- **Fuse.js** — client-side search

## Commands

| Command                    | Action                                    |
| :------------------------- | :---------------------------------------- |
| `npm install`              | Install dependencies                      |
| `npm run dev`              | Start local dev server at `localhost:4321` |
| `npm run build`            | Build production site to `./dist/`        |
| `npm run preview`          | Preview build via Wrangler                |
| `npm run deploy`           | Build and deploy to Cloudflare Pages      |
| `npm run db:migrate:local` | Run D1 migrations locally                 |
| `npm run db:seed:local`    | Seed local D1 database                    |
