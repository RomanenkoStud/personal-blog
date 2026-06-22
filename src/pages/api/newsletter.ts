import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getDb } from '../../lib/db';
import { newsletterSubscribers } from '../../db/schema';

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

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = getDb(env.DB);

  try {
    await db.insert(newsletterSubscribers).values({
      email,
      subscribedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE constraint')) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw e;
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
