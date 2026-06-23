import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getPage } from '../../../lib/api';
import { updatePage } from '../../../lib/admin-api';
import { getDb } from '../../../lib/db';
import * as schema from '../../../db/schema';
import { jsonResponse } from '../../../lib/response';
import { HTTP_STATUS, PAGE_SLUG } from '../../../consts';

export const PUT: APIRoute = async ({ request }) => {
  const { body } = await request.json();

  if (!body || typeof body !== 'string') {
    return jsonResponse({ error: 'Missing body' }, HTTP_STATUS.BAD_REQUEST);
  }

  try {
    JSON.parse(body);
  } catch {
    return jsonResponse({ error: 'Invalid JSON in body' }, HTTP_STATUS.BAD_REQUEST);
  }

  const existing = await getPage(env.DB, PAGE_SLUG.ABOUT);

  if (existing) {
    const page = await updatePage(env.DB, existing.id, {
      title: 'About',
      slug: PAGE_SLUG.ABOUT,
      body,
    });
    return jsonResponse({ ok: true, page });
  }

  const db = getDb(env.DB);
  const result = await db.insert(schema.pages).values({
    title: 'About',
    slug: PAGE_SLUG.ABOUT,
    body,
    updatedAt: new Date().toISOString(),
  }).returning();

  return jsonResponse({ ok: true, page: result[0] });
};
