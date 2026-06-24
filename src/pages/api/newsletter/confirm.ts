import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';
import { getDb } from '@/server/db/client';
import { newsletterSubscribers } from '@/server/db/schema';
import { statusPage, CONTENT_TYPE_HTML } from '@/server/http';
import { HTTP_STATUS } from '@/config';

export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('token');

  const fail = (message: string, sub: string, status = HTTP_STATUS.OK) =>
    new Response(statusPage({ title: 'Confirm subscription', message, sub, success: false }), {
      status,
      headers: { 'Content-Type': CONTENT_TYPE_HTML },
    });

  if (!token) {
    return fail('Missing confirmation token.', 'This link looks incomplete.', HTTP_STATUS.BAD_REQUEST);
  }

  const db = getDb(env.DB);
  const rows = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.confirmToken, token));
  const subscriber = rows[0];

  if (!subscriber) {
    return fail('This confirmation link is invalid or has expired.', 'It may have already been used.');
  }

  await db
    .update(newsletterSubscribers)
    .set({ confirmed: true, confirmToken: null })
    .where(eq(newsletterSubscribers.id, subscriber.id));

  return new Response(
    statusPage({
      title: 'Subscription confirmed',
      message: "You're subscribed.",
      sub: "You'll get an email when I publish something new.",
      success: true,
    }),
    { headers: { 'Content-Type': CONTENT_TYPE_HTML } },
  );
};
