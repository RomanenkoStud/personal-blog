import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createMediaRecord } from '../../../../lib/admin-api';
import { validateUpload } from '../../../../lib/validate';

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const validation = validateUpload(file);
  if (!validation.valid) {
    return new Response(JSON.stringify({ errors: validation.errors }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const timestamp = Date.now();
  const safeName = file.name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const key = `${timestamp}-${safeName}.${ext}`;

  await (env as unknown as { MEDIA: R2Bucket }).MEDIA.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const record = await createMediaRecord(env.DB, {
    key,
    filename: file.name,
    contentType: file.type,
    size: file.size,
    width: null,
    height: null,
    alt: '',
    uploadedAt: new Date().toISOString(),
  });

  return new Response(JSON.stringify({ ok: true, file: record }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
