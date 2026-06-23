import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { HTTP_STATUS, MEDIA_CACHE_MAX_AGE } from '../../consts';

export const GET: APIRoute = async ({ params }) => {
  const key = params.key;
  if (!key) {
    return new Response('Not found', { status: HTTP_STATUS.NOT_FOUND });
  }

  const object = await (env as unknown as { MEDIA: R2Bucket }).MEDIA.get(key);
  if (!object) {
    return new Response('Not found', { status: HTTP_STATUS.NOT_FOUND });
  }

  return new Response(object.body as ReadableStream, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': MEDIA_CACHE_MAX_AGE,
      'ETag': object.etag,
    },
  });
};
