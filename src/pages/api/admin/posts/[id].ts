import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getPostById, updatePost, deletePost, updatePostStatus } from '../../../../lib/admin-api';
import { validatePost } from '../../../../lib/validate';
import { jsonResponse } from '../../../../lib/response';
import { HTTP_STATUS, POST_STATUS, DB_ERROR_UNIQUE_CONSTRAINT } from '../../../../consts';

const VALID_PUT_TRANSITIONS: Record<string, string[]> = {
  [POST_STATUS.DRAFT]: [POST_STATUS.DRAFT, POST_STATUS.PUBLISHED],
  [POST_STATUS.PUBLISHED]: [POST_STATUS.PUBLISHED],
  [POST_STATUS.ARCHIVED]: [POST_STATUS.ARCHIVED],
};

const VALID_PATCH_TRANSITIONS: Record<string, string[]> = {
  [POST_STATUS.PUBLISHED]: [POST_STATUS.ARCHIVED],
  [POST_STATUS.ARCHIVED]: [POST_STATUS.PUBLISHED],
};

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

  const current = await getPostById(env.DB, id);
  if (!current) {
    return jsonResponse({ error: 'Post not found' }, HTTP_STATUS.NOT_FOUND);
  }

  const allowed = VALID_PUT_TRANSITIONS[current.status];
  if (!allowed || !allowed.includes(data.status)) {
    return jsonResponse({ error: 'Invalid status transition' }, HTTP_STATUS.BAD_REQUEST);
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

export const PATCH: APIRoute = async ({ params, request }) => {
  const id = Number(params.id);
  if (isNaN(id)) {
    return jsonResponse({ error: 'Invalid ID' }, HTTP_STATUS.BAD_REQUEST);
  }

  const { status } = await request.json();

  const current = await getPostById(env.DB, id);
  if (!current) {
    return jsonResponse({ error: 'Post not found' }, HTTP_STATUS.NOT_FOUND);
  }

  const allowed = VALID_PATCH_TRANSITIONS[current.status];
  if (!allowed || !allowed.includes(status)) {
    return jsonResponse({ error: 'Invalid status transition' }, HTTP_STATUS.BAD_REQUEST);
  }

  const post = await updatePostStatus(env.DB, id, status);
  return jsonResponse({ ok: true, post });
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
