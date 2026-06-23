import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { updatePost, deletePost } from '../../../../lib/admin-api';
import { validatePost } from '../../../../lib/validate';
import { jsonResponse } from '../../../../lib/response';
import { HTTP_STATUS, DB_ERROR_UNIQUE_CONSTRAINT } from '../../../../consts';

export const PUT: APIRoute = async ({ params, request }) => {
  const id = Number(params.id);
  if (isNaN(id)) {
    return jsonResponse({ error: 'Invalid ID' }, HTTP_STATUS.BAD_REQUEST);
  }

  const data = await request.json();
  data.readTime = Number(data.readTime);
  data.featured = Boolean(data.featured);

  const validation = validatePost(data);
  if (!validation.valid) {
    return jsonResponse({ errors: validation.errors }, HTTP_STATUS.BAD_REQUEST);
  }

  try {
    const post = await updatePost(env.DB, id, {
      title: data.title,
      slug: data.slug,
      body: data.body,
      area: data.area,
      publishedAt: data.publishedAt,
      featured: data.featured,
      readTime: data.readTime,
      excerpt: data.excerpt,
      status: data.status,
    });

    if (!post) {
      return jsonResponse({ error: 'Post not found' }, HTTP_STATUS.NOT_FOUND);
    }

    return jsonResponse({ ok: true, post });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '';
    if (message.includes(DB_ERROR_UNIQUE_CONSTRAINT)) {
      return jsonResponse({ errors: { slug: 'This slug already exists' } }, HTTP_STATUS.CONFLICT);
    }
    throw e;
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (isNaN(id)) {
    return jsonResponse({ error: 'Invalid ID' }, HTTP_STATUS.BAD_REQUEST);
  }

  const deleted = await deletePost(env.DB, id);
  if (!deleted) {
    return jsonResponse({ error: 'Post not found' }, HTTP_STATUS.NOT_FOUND);
  }

  return jsonResponse({ ok: true });
};
