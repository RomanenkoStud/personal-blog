import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getPage } from '../../../lib/api';
import { updatePage } from '../../../lib/admin-api';
import { getDb } from '../../../lib/db';
import * as schema from '../../../db/schema';

export const PUT: APIRoute = async ({ request }) => {
  const { body } = await request.json();

  if (!body || typeof body !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    JSON.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON in body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const existing = await getPage(env.DB, 'about');

  if (existing) {
    const page = await updatePage(env.DB, existing.id, {
      title: 'About',
      slug: 'about',
      body,
    });
    return new Response(JSON.stringify({ ok: true, page }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = getDb(env.DB);
  const result = await db.insert(schema.pages).values({
    title: 'About',
    slug: 'about',
    body,
    updatedAt: new Date().toISOString(),
  }).returning();

  return new Response(JSON.stringify({ ok: true, page: result[0] }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
