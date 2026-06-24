import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';
import { getDb } from '../../lib/db';
import { newsletterSubscribers } from '../../db/schema';
import { statusPage, CONTENT_TYPE_HTML } from '../../lib/html-page';
import { HTTP_STATUS } from '../../consts';

export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('token');
  const email = url.searchParams.get('email');

  const page = (message: string, sub: string, success: boolean, status = HTTP_STATUS.OK) =>
    new Response(statusPage({ title: 'Unsubscribe', message, sub, success }), {
      status,
      headers: { 'Content-Type': CONTENT_TYPE_HTML },
    });

  if (!token && !email) {
    return page('Missing unsubscribe link.', 'This link looks incomplete.', false, HTTP_STATUS.BAD_REQUEST);
  }

  const db = getDb(env.DB);
  const where = token
    ? eq(newsletterSubscribers.unsubscribeToken, token)
    : eq(newsletterSubscribers.email, email!);

  const result = await db.delete(newsletterSubscribers).where(where);

  if (result.rowsAffected === 0) {
    return page('This subscription was not found.', 'You may have already unsubscribed.', false);
  }

  return page('You have been unsubscribed.', "You won't receive any more emails from us.", true);
};
