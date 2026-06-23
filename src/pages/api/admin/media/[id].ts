import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { updateMediaAlt, deleteMediaRecord } from '../../../../lib/admin-api';
import { jsonResponse } from '../../../../lib/response';
import { HTTP_STATUS } from '../../../../consts';

export const PATCH: APIRoute = async ({ params, request }) => {
  const id = Number(params.id);
  if (isNaN(id)) {
    return jsonResponse({ error: 'Invalid ID' }, HTTP_STATUS.BAD_REQUEST);
  }

  const data = await request.json();
  if (typeof data.alt !== 'string') {
    return jsonResponse({ error: 'Alt text must be a string' }, HTTP_STATUS.BAD_REQUEST);
  }

  const file = await updateMediaAlt(env.DB, id, data.alt);
  if (!file) {
    return jsonResponse({ error: 'File not found' }, HTTP_STATUS.NOT_FOUND);
  }

  return jsonResponse({ ok: true, file });
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (isNaN(id)) {
    return jsonResponse({ error: 'Invalid ID' }, HTTP_STATUS.BAD_REQUEST);
  }

  const file = await deleteMediaRecord(env.DB, id);
  if (!file) {
    return jsonResponse({ error: 'File not found' }, HTTP_STATUS.NOT_FOUND);
  }

  await (env as unknown as { MEDIA: R2Bucket }).MEDIA.delete(file.key);

  return jsonResponse({ ok: true });
};
