import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { updateMediaAlt, deleteMediaRecord } from '../../../../lib/admin-api';

export const PATCH: APIRoute = async ({ params, request }) => {
  const id = Number(params.id);
  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: 'Invalid ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const data = await request.json();
  if (typeof data.alt !== 'string') {
    return new Response(JSON.stringify({ error: 'Alt text must be a string' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const file = await updateMediaAlt(env.DB, id, data.alt);
  if (!file) {
    return new Response(JSON.stringify({ error: 'File not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, file }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: 'Invalid ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const file = await deleteMediaRecord(env.DB, id);
  if (!file) {
    return new Response(JSON.stringify({ error: 'File not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await (env as unknown as { MEDIA: R2Bucket }).MEDIA.delete(file.key);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
