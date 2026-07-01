import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getPostById, updatePost, deletePost, updatePostStatus } from '@/server/repositories/posts';
import { notifySubscribersOfPost } from '@/server/services/newsletter';
import { validatePost } from '@/lib/validation';
import { calcReadTime } from '@/lib/read-time';
import { jsonResponse } from '@/server/http';
import { HTTP_STATUS, POST_STATUS, DB_ERROR_UNIQUE_CONSTRAINT } from '@/config';

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
  data.readTime = calcReadTime(data.body);
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
      focusKeyword: data.focusKeyword ?? '',
      excerpt: data.excerpt,
      status: data.status,
    });

    if (!post) {
      return jsonResponse({ error: 'Post not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const justPublished = current.status === POST_STATUS.DRAFT && post.status === POST_STATUS.PUBLISHED;
    if (data.notify && justPublished) {
      const origin = new URL(request.url).origin;
      await notifySubscribersOfPost(env.DB, origin, post);
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

  const body = await request.json();

  const current = await getPostById(env.DB, id);
  if (!current) {
    return jsonResponse({ error: 'Post not found' }, HTTP_STATUS.NOT_FOUND);
  }

  if ('status' in body) {
    const allowed = VALID_PATCH_TRANSITIONS[current.status];
    if (!allowed || !allowed.includes(body.status)) {
      return jsonResponse({ error: 'Invalid status transition' }, HTTP_STATUS.BAD_REQUEST);
    }
    const post = await updatePostStatus(env.DB, id, body.status);
    return jsonResponse({ ok: true, post });
  }

  if ('featured' in body) {
    const post = await updatePost(env.DB, id, { featured: Boolean(body.featured) });
    if (!post) {
      return jsonResponse({ error: 'Post not found' }, HTTP_STATUS.NOT_FOUND);
    }
    return jsonResponse({ ok: true, post });
  }

  return jsonResponse({ error: 'No valid field to update' }, HTTP_STATUS.BAD_REQUEST);
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
