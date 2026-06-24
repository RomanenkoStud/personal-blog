import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createPost, notifySubscribersOfPost } from '../../../../lib/admin-api';
import { validatePost } from '../../../../lib/validate';
import { jsonResponse } from '../../../../lib/response';
import { HTTP_STATUS, POST_STATUS, DB_ERROR_UNIQUE_CONSTRAINT } from '../../../../consts';

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();

  data.readTime = Number(data.readTime);
  data.featured = Boolean(data.featured);

  const validation = validatePost(data);
  if (!validation.valid) {
    return jsonResponse({ errors: validation.errors }, HTTP_STATUS.BAD_REQUEST);
  }

  try {
    const post = await createPost(env.DB, {
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
