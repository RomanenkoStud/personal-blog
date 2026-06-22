import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async ({ params }) => {
  const key = params.key;
  if (!key) {
    return new Response('Not found', { status: 404 });
  }

  const object = await (env as unknown as { MEDIA: R2Bucket }).MEDIA.get(key);
  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(object.body as ReadableStream, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'ETag': object.etag,
    },
  });
};
