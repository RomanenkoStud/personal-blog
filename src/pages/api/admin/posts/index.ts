import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createPost } from '@/server/repositories/posts';
import { notifySubscribersOfPost } from '@/server/services/newsletter';
import { validatePost, type PostInput } from '@/lib/validation';
import { calcReadTime } from '@/lib/read-time';
import { jsonResponse, readJsonObject } from '@/server/http';
import { HTTP_STATUS, POST_STATUS, DB_ERROR_UNIQUE_CONSTRAINT } from '@/config';

export const POST: APIRoute = async ({ request }) => {
  const raw = await readJsonObject(request);
  const validation = validatePost(raw);
  if (!validation.valid) {
    return jsonResponse({ errors: validation.errors }, HTTP_STATUS.BAD_REQUEST);
  }
  const data = raw as unknown as PostInput; // shape checked by validatePost

  try {
    const post = await createPost(env.DB, {
      title: data.title,
      slug: data.slug,
      body: data.body,
      area: data.area,
      publishedAt: data.publishedAt,
      featured: Boolean(data.featured),
      readTime: calcReadTime(data.body),
      focusKeyword: data.focusKeyword ?? '',
      excerpt: data.excerpt,
      status: data.status,
    });

    if (data.notify && post.status === POST_STATUS.PUBLISHED) {
      const origin = new URL(request.url).origin;
      await notifySubscribersOfPost(env.DB, origin, post);
    }

    return jsonResponse({ ok: true, post }, HTTP_STATUS.CREATED);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '';
    if (message.includes(DB_ERROR_UNIQUE_CONSTRAINT)) {
      return jsonResponse({ errors: { slug: 'This slug already exists' } }, HTTP_STATUS.CONFLICT);
    }
    throw e;
  }
};
