import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';
import { getDb } from '@/server/db/client';
import { newsletterSubscribers } from '@/server/db/schema';
import { jsonResponse } from '@/server/http';
import { EMAIL_REGEX } from '@/lib/validation';
import { sendEmail } from '@/server/email/client';
import { confirmationEmail } from '@/server/email/templates';
import { HTTP_STATUS } from '@/config';

export const POST: APIRoute = async ({ request }) => {
  let email: string | undefined;

  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = await request.json();
    email = body.email;
  } else {
    const formData = await request.formData();
    email = formData.get('email')?.toString();
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return jsonResponse({ error: 'Invalid email' }, HTTP_STATUS.BAD_REQUEST);
  }

  email = email.trim().toLowerCase();
  const origin = new URL(request.url).origin;
  const db = getDb(env.DB);

  const existing = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email));
  const subscriber = existing[0];

  // Already confirmed — succeed silently without leaking subscription state.
  if (subscriber?.confirmed) {
    return jsonResponse({ ok: true });
  }

  const confirmToken = crypto.randomUUID();

  if (subscriber) {
    // Pending subscriber re-requested — refresh the token and resend.
    await db
      .update(newsletterSubscribers)
      .set({ confirmToken })
      .where(eq(newsletterSubscribers.id, subscriber.id));
  } else {
    await db.insert(newsletterSubscribers).values({
      email,
      subscribedAt: new Date().toISOString(),
      confirmed: false,
      confirmToken,
      unsubscribeToken: crypto.randomUUID(),
    });
  }

  const { subject, html } = confirmationEmail(origin, confirmToken);
  await sendEmail({ to: email, subject, html });

  return jsonResponse({ ok: true });
};
