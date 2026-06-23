import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getDb } from '../../lib/db';
import { newsletterSubscribers } from '../../db/schema';
import { jsonResponse } from '../../lib/response';
import { EMAIL_REGEX } from '../../lib/validate';
import { HTTP_STATUS, DB_ERROR_UNIQUE_CONSTRAINT } from '../../consts';

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

  const db = getDb(env.DB);

  try {
    await db.insert(newsletterSubscribers).values({
      email,
      subscribedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    if (e.message?.includes(DB_ERROR_UNIQUE_CONSTRAINT)) {
      return jsonResponse({ ok: true });
    }
    throw e;
  }

  return jsonResponse({ ok: true });
};
