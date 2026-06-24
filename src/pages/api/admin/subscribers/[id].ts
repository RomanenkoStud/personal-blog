import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { deleteSubscriber } from '@/server/repositories/subscribers';
import { jsonResponse } from '@/server/http';
import { HTTP_STATUS } from '@/config';

export const DELETE: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (isNaN(id)) {
    return jsonResponse({ error: 'Invalid ID' }, HTTP_STATUS.BAD_REQUEST);
  }

  const deleted = await deleteSubscriber(env.DB, id);
  if (!deleted) {
    return jsonResponse({ error: 'Subscriber not found' }, HTTP_STATUS.NOT_FOUND);
  }

  return jsonResponse({ ok: true });
};
