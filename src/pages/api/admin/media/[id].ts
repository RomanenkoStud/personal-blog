import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { updateMediaAlt, deleteMediaRecord } from '@/server/repositories/media';
import { jsonResponse, readJsonObject } from '@/server/http';
import { HTTP_STATUS } from '@/config';

export const PATCH: APIRoute = async ({ params, request }) => {
  const id = Number(params.id);
  if (isNaN(id)) {
    return jsonResponse({ error: 'Invalid ID' }, HTTP_STATUS.BAD_REQUEST);
  }

  const data = await readJsonObject(request);
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

  await env.MEDIA.delete(file.key);

  return jsonResponse({ ok: true });
};
