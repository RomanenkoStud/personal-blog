import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { updatePage } from '@/server/repositories/pages';
import { validatePage } from '@/lib/validation';
import { jsonResponse } from '@/server/http';
import { HTTP_STATUS } from '@/config';

export const PUT: APIRoute = async ({ params, request }) => {
  const id = Number(params.id);
  if (isNaN(id)) {
    return jsonResponse({ error: 'Invalid ID' }, HTTP_STATUS.BAD_REQUEST);
  }

  const data = await request.json();

  const validation = validatePage(data);
  if (!validation.valid) {
    return jsonResponse({ errors: validation.errors }, HTTP_STATUS.BAD_REQUEST);
  }

  const page = await updatePage(env.DB, id, {
    title: data.title,
    slug: data.slug,
    body: data.body,
  });

  if (!page) {
    return jsonResponse({ error: 'Page not found' }, HTTP_STATUS.NOT_FOUND);
  }

  return jsonResponse({ ok: true, page });
};
