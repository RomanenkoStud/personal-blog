# Newsletter Spam Protection — TODO

## Rate Limiting
- Limit subscribes per IP (e.g. 3/hour) using the existing KV `SESSION` binding
- Store `newsletter:rate:<ip>` keys with TTL in KV
- Return 429 from `/api/newsletter` when limit exceeded
- Alternatively, enable Cloudflare Bot Fight Mode at the dashboard level (zero code)

## Cloudflare Turnstile
- Create a Turnstile widget at dash.cloudflare.com (free)
- Add site key + secret key to `wrangler.toml` vars / secrets
- Embed `<div class="cf-turnstile">` in the `NewsletterForm` component
- Verify the token server-side in `/api/newsletter` via `https://challenges.cloudflare.com/turnstile/v0/siteverify`

## Enable newsletter email in production
Double opt-in is built; emails just log to the console until a provider key is set.
- Add `RESEND_API_KEY` to the repo's GitHub Actions secrets (deploy pushes it to the Worker)
- Verify the sending domain in Resend and adjust `NEWSLETTER_FROM` in `wrangler.toml`
