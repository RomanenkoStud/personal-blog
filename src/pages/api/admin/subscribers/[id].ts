import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { deleteSubscriber } from '../../../../lib/admin-api';

export const DELETE: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: 'Invalid ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const deleted = await deleteSubscriber(env.DB, id);
  if (!deleted) {
    return new Response(JSON.stringify({ error: 'Subscriber not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
