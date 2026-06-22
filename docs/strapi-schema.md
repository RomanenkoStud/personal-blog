# Strapi Content Schema

Guide for configuring Strapi content types used by the Astro blog frontend.

---

## Content Types

### blog-post

| Field         | Type                  | Options                                                    |
| ------------- | --------------------- | ---------------------------------------------------------- |
| `title`       | Text                  | Required                                                   |
| `slug`        | UID (from `title`)    | Required                                                   |
| `body`        | Rich text             | Required                                                   |
| `area`        | Enumeration           | `architecture`, `devex`, `ai`, `cases`, `tools`, `homelab` |
| `publishedAt` | Datetime              |                                                            |
| `featured`    | Boolean               | Default: `false`                                           |
| `readTime`    | Integer               |                                                            |
| `excerpt`     | Text                  |                                                            |
| `coverImage`  | Media (single image)  |                                                            |

### page

| Field   | Type               | Options  |
| ------- | ------------------ | -------- |
| `title` | Text               | Required |
| `slug`  | UID (from `title`) | Required |
| `body`  | Rich text          | Required |

---

## API Permissions

In **Settings > Users & Permissions > Roles > Public**, enable:

- `blog-post`: `find`, `findOne`
- `page`: `find`, `findOne`

This grants unauthenticated read access to both content types.

---

## API Token Setup

1. Go to **Settings > API Tokens > Create new API Token**.
2. Name: `astro-frontend` (or similar).
3. Token type: **Read-only**.
4. Permissions: grant access to `blog-post` and `page` (find + findOne).
5. Copy the generated token and store it in the Astro project's `.env` file:

```env
STRAPI_URL=http://localhost:1337
STRAPI_TOKEN=<your-token-here>
```

The Astro app reads these values at build/request time to fetch content from the Strapi API.
