import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { updatePage } from '../../../../lib/admin-api';
import { validatePage } from '../../../../lib/validate';

export const PUT: APIRoute = async ({ params, request }) => {
  const id = Number(params.id);
  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: 'Invalid ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const data = await request.json();

  const validation = validatePage(data);
  if (!validation.valid) {
    return new Response(JSON.stringify({ errors: validation.errors }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const page = await updatePage(env.DB, id, {
    title: data.title,
    slug: data.slug,
    body: data.body,
  });

  if (!page) {
    return new Response(JSON.stringify({ error: 'Page not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, page }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
