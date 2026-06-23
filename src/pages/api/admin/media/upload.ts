import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createMediaRecord } from '../../../../lib/admin-api';
import { validateUpload } from '../../../../lib/validate';
import { jsonResponse } from '../../../../lib/response';
import { HTTP_STATUS } from '../../../../consts';

const DEFAULT_FILE_EXT = 'bin';

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return jsonResponse({ error: 'No file provided' }, HTTP_STATUS.BAD_REQUEST);
  }

  const validation = validateUpload(file);
  if (!validation.valid) {
    return jsonResponse({ errors: validation.errors }, HTTP_STATUS.BAD_REQUEST);
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? DEFAULT_FILE_EXT;
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

  return jsonResponse({ ok: true, file: record }, HTTP_STATUS.CREATED);
};
