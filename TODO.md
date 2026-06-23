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

## Double Opt-In
- Add `confirmed` (boolean, default false) and `confirm_token` (text) columns to `newsletter_subscribers`
- On subscribe: generate a token, store unconfirmed, send confirmation email
- Create `GET /api/newsletter/confirm?token=...` endpoint to set `confirmed = true`
- Choose an email provider: Resend, Mailchannels (free via CF Workers), or SES
- Only treat confirmed subscribers as active when sending newsletters
