import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';
import { getDb } from '../../lib/db';
import { newsletterSubscribers } from '../../db/schema';

export const GET: APIRoute = async ({ url }) => {
  const email = url.searchParams.get('email');

  if (!email) {
    return new Response(unsubscribePage('Missing email parameter.', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const db = getDb(env.DB);
  const result = await db
    .delete(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email));

  if (result.rowsAffected === 0) {
    return new Response(unsubscribePage('This email was not found in our list.', false), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return new Response(unsubscribePage('You have been unsubscribed.', true), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};

function unsubscribePage(message: string, success: boolean): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Unsubscribe</title>
  <style>
    body { font-family: 'Space Grotesk', system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fbfbfd; color: #1a1c2e; }
    .box { text-align: center; max-width: 400px; padding: 40px 24px; }
    .icon { font-size: 32px; margin-bottom: 16px; }
    h1 { font-size: 20px; font-weight: 400; margin: 0 0 8px; }
    p { font-size: 14px; color: #6b6e7e; margin: 0 0 24px; }
    a { color: #4f56e8; text-decoration: none; font-size: 13px; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">${success ? '✓' : '✗'}</div>
    <h1>${message}</h1>
    <p>${success ? "You won't receive any more emails from us." : 'If you believe this is an error, please try again.'}</p>
    <a href="/">&larr; Back to site</a>
  </div>
</body>
</html>`;
}
