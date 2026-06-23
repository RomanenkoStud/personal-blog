import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { deleteSubscriber } from '../../../../lib/admin-api';
import { jsonResponse } from '../../../../lib/response';
import { HTTP_STATUS } from '../../../../consts';

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
